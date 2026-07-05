/**
 * hooks/useWebAuthnPasskey.js — Production v2
 *
 * Two-tier passkey system:
 *
 * TIER 1 — True WebAuthn (react-native-passkeys)
 *   Used when: native module is available + device supports it (Android 9+, iOS 16+)
 *   Keys stored in: iCloud Keychain / Google Password Manager
 *   Syncs across devices: YES
 *
 * TIER 2 — Biometric fallback (expo-local-authentication + expo-secure-store)
 *   Used when: WebAuthn not available (old OS, dev build without prebuild, etc.)
 *   Keys stored in: device Secure Enclave / hardware keystore via SecureStore
 *   Syncs across devices: NO (device-bound only)
 *   This is what WhatsApp uses on older Android versions.
 *
 * The app automatically picks the best available tier.
 * Users never see the difference in UX — same Face ID / fingerprint prompt either way.
 */

import { Platform }           from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore          from "expo-secure-store";
import * as Device               from "expo-device";
import api                       from "../api/api";

// Secure key name for fallback tier
const FALLBACK_TOKEN_KEY = "hush_biometric_token";

// ── Safely try to import react-native-passkeys ────────────────────────────────
// If the native module isn't linked (e.g. running in Expo Go or dev client
// without prebuild), this will fail gracefully and we fall back to Tier 2.
let NativePasskey = null;
try {
  const mod = require("react-native-passkeys");
  NativePasskey = mod.Passkey || mod.default?.Passkey || mod.default || null;
} catch {
  NativePasskey = null;
}

// ── base64url → base64 conversion ────────────────────────────────────────────
function b64urlToB64(str = "") {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad    = padded.length % 4;
  return pad ? padded + "=".repeat(4 - pad) : padded;
}

function convertOptionsToBase64(obj) {
  if (typeof obj === "string") {
    if (obj.includes("-") || obj.includes("_")) return b64urlToB64(obj);
    return obj;
  }
  if (Array.isArray(obj)) return obj.map(convertOptionsToBase64);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = convertOptionsToBase64(v);
    return out;
  }
  return obj;
}

// ── Check which tier is available ─────────────────────────────────────────────

async function checkTier() {
  // Check Tier 1 — native WebAuthn
  if (NativePasskey) {
    try {
      const supported = await NativePasskey.isSupported();
      if (supported) return "webauthn";
    } catch {}
  }

  // Check Tier 2 — biometric fallback
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled   = await LocalAuthentication.isEnrolledAsync();
    if (compatible && enrolled) return "biometric";
  } catch {}

  return "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1 — True WebAuthn
// ─────────────────────────────────────────────────────────────────────────────

async function webAuthnRegister(deviceName) {
  const optionsRes = await api.get("/passkey/register/options");
  const options    = convertOptionsToBase64(optionsRes.data);
  const attestationResponse = await NativePasskey.create(options);
  const verifyRes  = await api.post("/passkey/register/verify", {
    attestationResponse,
    deviceName: deviceName || (Platform.OS === "ios" ? "iPhone" : "Android"),
  });
  return { success: true, passkey: verifyRes.data, tier: "webauthn" };
}

async function webAuthnAuthenticate(pseudonym) {
  const optionsRes            = await api.post("/passkey/auth/options", { pseudonym });
  const { userId, ...rawOpts } = optionsRes.data;
  const options               = convertOptionsToBase64(rawOpts);
  const assertionResponse     = await NativePasskey.get(options);
  const verifyRes             = await api.post("/passkey/auth/verify", { assertionResponse, userId });
  return { success: true, ...verifyRes.data, tier: "webauthn" };
}

// ─────────────────────────────────────────────────────────────────────────────
// TIER 2 — Biometric fallback (SecureStore + expo-local-authentication)
// Same UX — Face ID / fingerprint prompt — just no cross-device sync.
// This is exactly how WhatsApp biometric lock works on older Android.
// ─────────────────────────────────────────────────────────────────────────────

async function biometricRegister(deviceName, currentToken) {
  // Prompt biometrics to confirm intent
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage:         "Confirm to create passkey",
    fallbackLabel:         "Use PIN",
    cancelLabel:           "Cancel",
    disableDeviceFallback: false,
  });
  if (!result.success) return { success: false, cancelled: true };

  // Register this device on the server (same endpoint, just marks as biometric tier)
  const deviceId   = Device.modelId || Device.osInternalBuildId || "unknown";
  const resolvedName = deviceName || `${Device.brand || ""} ${Device.modelName || "Device"}`.trim();

  await api.post("/passkey/register/verify", {
    attestationResponse: null,        // signals fallback mode to server
    deviceName:          resolvedName,
    deviceId,
    fallback:            true,        // server stores as biometric-fallback passkey
  });

  // Store the current JWT securely in hardware-backed storage
  await SecureStore.setItemAsync(FALLBACK_TOKEN_KEY, currentToken, {
    requireAuthentication: true,      // requires biometrics to read back
    authenticationPrompt:  "Sign in to HushCircle",
  });

  return {
    success: true,
    passkey: { deviceName: resolvedName, createdAt: new Date().toISOString(), tier: "biometric" },
    tier: "biometric",
  };
}

async function biometricAuthenticate(pseudonym) {
  // Prompt biometrics — SecureStore with requireAuthentication does this automatically
  // but we call it explicitly for a better UX prompt message
  const authResult = await LocalAuthentication.authenticateAsync({
    promptMessage:         "Sign in to HushCircle",
    fallbackLabel:         "Use PIN",
    cancelLabel:           "Cancel",
    disableDeviceFallback: false,
  });
  if (!authResult.success) return { success: false, cancelled: true };

  // Retrieve the stored JWT
  const storedToken = await SecureStore.getItemAsync(FALLBACK_TOKEN_KEY, {
    requireAuthentication: true,
    authenticationPrompt:  "Sign in to HushCircle",
  });

  if (!storedToken) {
    return { success: false, notFound: true };
  }

  // Validate token is still alive with the backend
  const res = await fetch(
    `${api.defaults?.baseURL || "https://wecare-backend-anxl.onrender.com/api"}/auth/refresh`,
    { method: "GET", headers: { Authorization: `Bearer ${storedToken}`, "Content-Type": "application/json" } }
  );
  const data = await res.json();
  if (!res.ok) {
    await SecureStore.deleteItemAsync(FALLBACK_TOKEN_KEY);
    return { success: false, error: "SESSION_EXPIRED" };
  }

  return { success: true, token: storedToken, user: data.user, tier: "biometric" };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useWebAuthnPasskey() {

  /**
   * getCapability()
   * Returns:
   *   "webauthn"  — real passkeys available (Android 9+ with proper build, iOS 16+)
   *   "biometric" — fallback biometric available (older OS or dev build)
   *   "none"      — no biometrics at all
   */
  const getCapability = () => checkTier();

  /**
   * isSupported()
   * Returns true if ANY passkey tier is available.
   */
  const isSupported = async () => {
    const tier = await checkTier();
    return tier !== "none";
  };

  /**
   * registerPasskey(deviceName, currentToken)
   *
   * Registers a passkey using the best available tier.
   * currentToken is the user's current JWT (needed for biometric fallback).
   * Call this from SecurityScreen.
   */
  const registerPasskey = async (deviceName, currentToken) => {
    const tier = await checkTier();

    if (tier === "none") {
      return { success: false, error: "No biometric hardware available on this device." };
    }

    try {
      if (tier === "webauthn") {
        return await webAuthnRegister(deviceName);
      } else {
        return await biometricRegister(deviceName, currentToken);
      }
    } catch (err) {
      if (
        err?.error === "UserCanceled" ||
        err?.message?.toLowerCase().includes("cancel") ||
        err?.message?.toLowerCase().includes("dismiss")
      ) {
        return { success: false, cancelled: true };
      }
      console.error("registerPasskey error:", err);
      return {
        success: false,
        error: err?.response?.data?.message || err?.message || "Could not create passkey.",
      };
    }
  };

  /**
   * authenticateWithPasskey(pseudonym)
   *
   * Signs in using the best available tier.
   * Returns { success: true, token, user } on success.
   * Call this from AuthScreen.
   */
  const authenticateWithPasskey = async (pseudonym) => {
    const tier = await checkTier();

    if (tier === "none") {
      return { success: false, error: "No biometric hardware available." };
    }

    try {
      if (tier === "webauthn") {
        return await webAuthnAuthenticate(pseudonym);
      } else {
        return await biometricAuthenticate(pseudonym);
      }
    } catch (err) {
      if (
        err?.error === "UserCanceled" ||
        err?.message?.toLowerCase().includes("cancel") ||
        err?.message?.toLowerCase().includes("dismiss")
      ) {
        return { success: false, cancelled: true };
      }
      if (err?.response?.status === 404) {
        return { success: false, notFound: true };
      }
      if (err?.message === "SESSION_EXPIRED") {
        return { success: false, error: "SESSION_EXPIRED" };
      }
      console.error("authenticateWithPasskey error:", err);
      return {
        success: false,
        error: err?.response?.data?.message || err?.message || "Sign-in failed.",
      };
    }
  };

  /**
   * listPasskeys()
   * Returns registered passkeys from the server.
   */
  const listPasskeys = async () => {
    try {
      const res = await api.get("/passkey/list");
      return res.data.passkeys || [];
    } catch {
      return [];
    }
  };

  /**
   * deletePasskey(passkeyId)
   * Deletes from server. Also clears local SecureStore if it's the fallback key.
   */
  const deletePasskey = async (passkeyId) => {
    await api.delete(`/passkey/${passkeyId}`);
    // Also clear fallback token — if they delete the passkey they should re-register
    try { await SecureStore.deleteItemAsync(FALLBACK_TOKEN_KEY); } catch {}
  };

  /**
   * getBiometricLabel()
   * Returns a human-readable label for the current biometric type.
   * Use this in UI instead of hardcoding "Face ID" or "Fingerprint".
   */
  const getBiometricLabel = async () => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION))
        return Platform.OS === "ios" ? "Face ID" : "Face Recognition";
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT))
        return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
      return "Biometrics";
    } catch {
      return "Biometrics";
    }
  };

  return {
    isSupported,
    getCapability,
    registerPasskey,
    authenticateWithPasskey,
    listPasskeys,
    deletePasskey,
    getBiometricLabel,
  };
}