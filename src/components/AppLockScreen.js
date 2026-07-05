/**
 * components/AppLockScreen.js
 *
 * The full-screen lock overlay shown when the app is locked.
 * Covers EVERYTHING — no content is visible underneath.
 *
 * Features:
 *   • HushCircle branding (dark purple, consistent with app)
 *   • Fingerprint / Face ID prompt fires automatically on mount
 *   • "Secured by Knox" / "Secured by Android Security" / "Secured by Secure Enclave" badge
 *   • Retry button if authentication fails
 *   • Blur overlay so background content is never visible
 *   • Smooth fade-in animation
 */

import { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Platform, Dimensions, StatusBar,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as Device               from "expo-device";
import { useAppLock }            from "../context/AppLockContext";
import { useTheme }              from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

// ── Detect security badge text ─────────────────────────────────────────────────
// Samsung devices use Knox, stock Android uses Android Security,
// iOS uses Secure Enclave

function getSecurityBadge() {
  if (Platform.OS === "ios") {
    return "Secured by Apple Secure Enclave";
  }
  const brand = (Device.brand || "").toLowerCase();
  const manufacturer = (Device.manufacturer || "").toLowerCase();
  if (brand.includes("samsung") || manufacturer.includes("samsung")) {
    return "Secured by Samsung Knox";
  }
  if (brand.includes("google") || brand.includes("pixel")) {
    return "Secured by Google Titan Security";
  }
  if (brand.includes("huawei") || brand.includes("honor")) {
    return "Secured by Huawei Security";
  }
  if (brand.includes("oneplus") || brand.includes("oppo")) {
    return "Secured by Android Security";
  }
  return "Secured by Android Security";
}

// ── Biometric icon ─────────────────────────────────────────────────────────────

function BiometricIcon({ type, size = 64, color = "#9B6FD4" }) {
  const emoji = type === "face" ? "🔓" : "👆";
  return (
    <Text style={{ fontSize: size, textAlign: "center" }}>{emoji}</Text>
  );
}

// ── Pulsing ring animation around biometric button ────────────────────────────

function PulseRing({ color, size }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <Animated.View style={{
      position:     "absolute",
      width:        size,
      height:       size,
      borderRadius: size / 2,
      borderWidth:  2,
      borderColor:  color,
      transform:    [{ scale }],
      opacity,
    }} />
  );
}

// ── Main AppLockScreen ─────────────────────────────────────────────────────────

export default function AppLockScreen() {
  const { authenticate, isAuthenticating, authFailed } = useAppLock();
  const { colors: C } = useTheme();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const [biometricType, setBiometricType] = useState("fingerprint"); // "fingerprint" | "face"
  const securityBadge = getSecurityBadge();

  // ── Detect biometric type ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("face");
      } else {
        setBiometricType("fingerprint");
      }
    })();
  }, []);

  // ── Fade in on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue:  1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── Auto-trigger biometric prompt on mount ─────────────────────────────────
  useEffect(() => {
    // Small delay so the screen is visible before the system prompt appears
    const timer = setTimeout(() => {
      authenticate();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // ── Shake animation on failed auth ────────────────────────────────────────
  useEffect(() => {
    if (!authFailed) return;
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60,  useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60,  useNativeDriver: true }),
    ]).start();
  }, [authFailed]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0A1E" />

      {/* Top section — branding */}
      <View style={styles.top}>
        <Text style={styles.logoEmoji}>💜</Text>
        <Text style={styles.appName}>HushCircle</Text>
        <Text style={styles.tagline}>Your safe space is locked</Text>
      </View>

      {/* Middle section — biometric button */}
      <View style={styles.middle}>
        <Animated.View style={[
          styles.biometricWrapper,
          { transform: [{ translateX: shakeAnim }] }
        ]}>
          {/* Pulsing ring — only when not authenticating and not failed */}
          {!isAuthenticating && !authFailed && (
            <PulseRing color="#9B6FD4" size={140} />
          )}

          {/* Main biometric button */}
          <TouchableOpacity
            style={[
              styles.biometricBtn,
              authFailed && styles.biometricBtnFailed,
              isAuthenticating && styles.biometricBtnActive,
            ]}
            onPress={authenticate}
            disabled={isAuthenticating}
            activeOpacity={0.8}
          >
            <BiometricIcon
              type={biometricType}
              size={52}
              color={authFailed ? "#D4607A" : "#9B6FD4"}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Status text */}
        <Text style={[
          styles.statusText,
          authFailed && styles.statusTextFailed,
        ]}>
          {isAuthenticating
            ? "Verifying..."
            : authFailed
              ? "Authentication failed. Try again."
              : biometricType === "face"
                ? "Tap to use Face ID"
                : "Tap to use fingerprint"}
        </Text>

        {/* Retry button — only shown after failure */}
        {authFailed && !isAuthenticating && (
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={authenticate}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom section — security badge */}
      <View style={styles.bottom}>
        <View style={styles.securityBadge}>
          <Text style={styles.shieldEmoji}>🛡️</Text>
          <Text style={styles.securityText}>{securityBadge}</Text>
        </View>
        <Text style={styles.footerText}>
          Your content is protected by your device security.{"\n"}
          HushCircle never stores your biometrics.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:        "absolute",
    top:             0,
    left:            0,
    right:           0,
    bottom:          0,
    width,
    height:          height + (StatusBar.currentHeight || 0),
    backgroundColor: "#0F0A1E",
    zIndex:          9999,
    elevation:       9999,
    flexDirection:   "column",
    alignItems:      "center",
    justifyContent:  "space-between",
    paddingTop:      60,
    paddingBottom:   48,
    paddingHorizontal: 32,
  },

  // Top
  top: {
    alignItems:  "center",
    marginTop:   20,
  },
  logoEmoji: {
    fontSize:     52,
    marginBottom: 10,
  },
  appName: {
    fontSize:    32,
    fontWeight:  "700",
    color:       "#EDE8F5",
    letterSpacing: 1,
    fontFamily:  "DMSerifDisplay_400Regular",
    marginBottom: 6,
  },
  tagline: {
    fontSize:   14,
    color:      "#8B7FA8",
    fontFamily: "Nunito_400Regular",
  },

  // Middle
  middle: {
    alignItems: "center",
    gap:        20,
  },
  biometricWrapper: {
    width:          140,
    height:         140,
    justifyContent: "center",
    alignItems:     "center",
    marginBottom:   8,
  },
  biometricBtn: {
    width:          110,
    height:         110,
    borderRadius:   55,
    backgroundColor: "#1A1330",
    borderWidth:    2,
    borderColor:    "#9B6FD4",
    justifyContent: "center",
    alignItems:     "center",
    shadowColor:    "#9B6FD4",
    shadowOffset:   { width: 0, height: 0 },
    shadowOpacity:  0.4,
    shadowRadius:   20,
    elevation:      10,
  },
  biometricBtnFailed: {
    borderColor:    "#D4607A",
    shadowColor:    "#D4607A",
  },
  biometricBtnActive: {
    borderColor:    "#C4A3E8",
    shadowOpacity:  0.2,
  },
  statusText: {
    fontSize:   15,
    color:      "#C4A3E8",
    fontFamily: "Nunito_500Medium",
    textAlign:  "center",
  },
  statusTextFailed: {
    color: "#D4607A",
  },
  retryBtn: {
    backgroundColor: "#9B6FD4",
    borderRadius:    12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop:       4,
  },
  retryText: {
    color:      "#fff",
    fontFamily: "Nunito_700Bold",
    fontSize:   15,
  },

  // Bottom
  bottom: {
    alignItems: "center",
    gap:        12,
  },
  securityBadge: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             8,
    backgroundColor: "#1A1330",
    borderRadius:    20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth:     1,
    borderColor:     "#2D2450",
  },
  shieldEmoji: {
    fontSize: 14,
  },
  securityText: {
    fontSize:   12,
    color:      "#8B7FA8",
    fontFamily: "Nunito_600SemiBold",
    letterSpacing: 0.3,
  },
  footerText: {
    fontSize:   11,
    color:      "#4A4060",
    fontFamily: "Nunito_400Regular",
    textAlign:  "center",
    lineHeight: 17,
  },
});