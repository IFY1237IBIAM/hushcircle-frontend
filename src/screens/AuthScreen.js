/**
 * AuthScreen.js — Production (True WebAuthn passkeys)
 *
 * Screens:
 *   "auth"       → login / signup
 *   "verify"     → email 6-digit code after signup
 *   "forgot"     → request password reset code
 *   "reset"      → enter code + new password
 *   "twostep"    → enter 6-digit PIN after successful password login
 *   "tworecover" → recover access with recovery code + set new PIN
 */

import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Animated,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import { useAuth }               from "../context/AuthContext";
import { useAppLock } from "../context/AppLockContext";
import { useNetwork }            from "../context/NetworkContext";
import { useWebAuthnPasskey }    from "../hooks/useWebAuthnPasskey";
import NoNetworkOverlay          from "../components/NoNetworkOverlay";
import HushCircleSpinner         from "../components/HushCircleSpinner";
import useSpinner                from "../hooks/useSpinner";
import api                       from "../api/api";

const COLORS = {
  bg: "#0F0A1E", card: "#1A1330", border: "#2D2450",
  accent: "#9B6FD4", accentSoft: "#C4A3E8",
  text: "#EDE8F5", textMuted: "#8B7FA8",
  error: "#D4607A", success: "#4CAF8F",
};

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const HeartLogoIcon = ({ size = 52, color = COLORS.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={color + "44"} stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartSmallIcon = ({ size = 13, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={color + "55"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EyeIcon = ({ size = 18, color = COLORS.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
  </Svg>
);

const EyeOffIcon = ({ size = 18, color = COLORS.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M1 1l22 22" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const KeyIcon = ({ size = 16, color = COLORS.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const KeyLargeIcon = ({ size = 44, color = COLORS.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
      stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MailOpenIcon = ({ size = 44, color = COLORS.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 8.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5"
      stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 8.5l9 6 9-6M3 8.5L12 3l9 5.5"
      stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldIcon = ({ size = 44, color = COLORS.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      fill={color + "22"} stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LockIcon = ({ size = 44, color = COLORS.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      fill={color + "22"} stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LifeBuoyIcon = ({ size = 44, color = COLORS.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.6} />
    <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={1.6} />
    <Line x1="4.93" y1="4.93" x2="9.17" y2="9.17" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    <Line x1="14.83" y1="14.83" x2="19.07" y2="19.07" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    <Line x1="14.83" y1="9.17" x2="19.07" y2="4.93" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    <Line x1="4.93" y1="19.07" x2="9.17" y2="14.83" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);

const LockSmallIcon = ({ size = 13, color = COLORS.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ArrowLeftIcon = ({ size = 13, color = COLORS.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="19" y1="12" x2="5" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 19 5 12 12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ──────────────────────────────────────────────────────────────────────────

export default function AuthScreen({ navigation }) {
  // ── Screen state ────────────────────────────────────────────────────────────
  const [screen,   setScreen]   = useState("auth");
  const [isLogin,  setIsLogin]  = useState(true);

  // ── Auth fields ─────────────────────────────────────────────────────────────
  const [pseudonym,    setPseudonym]    = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── Email verify ─────────────────────────────────────────────────────────────
  const [verifyCode,      setVerifyCode]      = useState(Array(6).fill(""));
  const [verifyEmail,     setVerifyEmail]     = useState("");
  const [verifyLoading,   setVerifyLoading]   = useState(false);
  const [resendCooldown,  setResendCooldown]  = useState(0);
  const codeRefs = useRef([]);

  // ── Forgot / reset password ──────────────────────────────────────────────────
  const [forgotEmail,    setForgotEmail]    = useState("");
  const [resetCode,      setResetCode]      = useState(Array(6).fill(""));
  const [resetEmail,     setResetEmail]     = useState("");
  const [newPassword,    setNewPassword]    = useState("");
  const [showNewPw,      setShowNewPw]      = useState(false);
  const resetCodeRefs = useRef([]);

  // ── Two-step ─────────────────────────────────────────────────────────────────
  const [twoStepPin,    setTwoStepPin]    = useState(Array(6).fill(""));
  const [twoStepHint,   setTwoStepHint]   = useState("");
  const [twoStepEmail,  setTwoStepEmail]  = useState("");
  const [pendingToken,  setPendingToken]  = useState(null);
  const [pendingUser,   setPendingUser]   = useState(null);
  const twoStepRefs = useRef([]);

  // ── Two-step recovery ────────────────────────────────────────────────────────
  const [recoverCode,   setRecoverCode]   = useState("");
  const [newRecoverPin, setNewRecoverPin] = useState(Array(6).fill(""));
  const newRecoverRefs = useRef([]);

  // ── Passkey ──────────────────────────────────────────────────────────────────
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [passkeyPseudonym, setPasskeyPseudonym] = useState("");
  const [biometricLabel, setBiometricLabel] = useState("Biometrics");

  // ── Shared ───────────────────────────────────────────────────────────────────
  const [errors,        setErrors]        = useState({});
  const [showNoNetwork, setShowNoNetwork] = useState(false);

  const { login, signup, setAuth } = useAuth();
  const { unlockSilently } = useAppLock();
  const { isConnected }             = useNetwork();
  const spinner                     = useSpinner();
  const { isSupported, authenticateWithPasskey, getBiometricLabel } = useWebAuthnPasskey();

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const supported = await isSupported();
      setPasskeyAvailable(supported);
      if (supported) {
        const label = await getBiometricLabel();
        setBiometricLabel(label);
      }
    })();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const switchScreen = (to) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setErrors({});
    if (to === "auth") {
      setPendingToken(null);
      setPendingUser(null);
      setTwoStepPin(Array(6).fill(""));
      setTwoStepHint("");
      setTwoStepEmail("");
      setRecoverCode("");
      setNewRecoverPin(Array(6).fill(""));
    }
    setScreen(to);
  };

  const validate = () => {
    const e = {};
    if (!email)    e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "At least 8 characters";
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(password))
      e.password = "Need uppercase, lowercase, number & symbol";
    if (!isLogin && !pseudonym) e.pseudonym = "Pseudonym is required";
    else if (!isLogin && (pseudonym.length < 3 || pseudonym.length > 20))
      e.pseudonym = "Pseudonym must be 3–20 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!isConnected) { setShowNoNetwork(true); return; }

    setPendingToken(null);
    setPendingUser(null);
    setTwoStepPin(Array(6).fill(""));
    setTwoStepHint("");
    setTwoStepEmail("");

    await spinner.withSpinner(async () => {
      try {
        if (isLogin) {
          const result = await login(email, password, {
            deviceName: Platform.OS === "ios" ? "iPhone" : "Android",
            deviceOS:   Platform.OS === "ios" ? "iOS" : "Android",
          });
          if (result?.unverified === true) {
            setVerifyEmail(email);
            switchScreen("verify");
            return;
          }
          if (result?.twoStep === true) {
          setTwoStepEmail(email);
          setTwoStepHint(result.twoStepHint || "");
          setPendingToken(result.pendingToken);
          setPendingUser(result.pendingUser);
          switchScreen("twostep");
          return;
        }

        unlockSilently();
        } else {
          await signup(pseudonym, email, password);
          setVerifyEmail(email);
          switchScreen("verify");
        }
      } catch (error) {
        Alert.alert("Oops", error.response?.data?.message || "Something went wrong. Try again.");
      }
    }, isLogin ? "Signing you in..." : "Creating your space...");
  };

  const handlePasskeyLogin = async () => {
    if (!passkeyPseudonym.trim()) {
      setErrors({ pseudonymPasskey: "Enter your pseudonym to sign in with passkey." });
      return;
    }
    if (!isConnected) { setShowNoNetwork(true); return; }

    await spinner.withSpinner(async () => {
      const result = await authenticateWithPasskey(passkeyPseudonym.trim());
      if (result.cancelled) return;
      if (result.notFound) {
        Alert.alert("No passkey", "No passkey registered for this account. Sign in with your password first.");
        return;
      }
      if (!result.success) {
        Alert.alert("Oops", result.error || "Passkey sign-in failed. Try your password.");
        return;
      }
      await setAuth(result.token, result.user);
      unlockSilently();
    }, "Signing in with passkey...");
  };

  const buildCodeInput = (codeArr, setCode, refs) => (
    <View style={styles.codeRow}>
      {codeArr.map((digit, i) => (
        <TextInput
          key={i}
          ref={(r) => (refs.current[i] = r)}
          style={[styles.codeBox, digit && styles.codeBoxFilled]}
          value={digit}
          onChangeText={(t) => {
            if (t.length > 1) {
              const digits = t.replace(/\D/g, "").slice(0, 6).split("");
              if (digits.length === 6) { setCode(digits); refs.current[5]?.focus(); }
              return;
            }
            const c = t.replace(/[^0-9]/g, "").slice(-1);
            const next = [...codeArr]; next[i] = c; setCode(next);
            if (c && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Backspace" && !codeArr[i] && i > 0)
              refs.current[i - 1]?.focus();
          }}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          selectTextOnFocus
        />
      ))}
    </View>
  );

  const handleVerify = async () => {
    const code = verifyCode.join("");
    if (code.length < 6) { setErrors({ code: "Enter the full 6-digit code" }); return; }
    setVerifyLoading(true);
    try {
      await api.post("/email/verify-email", { code, email: verifyEmail });
      Alert.alert("You're verified", "Welcome to HushCircle.", [
        { text: "Let's go", onPress: () => { setVerifyCode(Array(6).fill("")); switchScreen("auth"); } },
      ]);
    } catch (err) {
      setErrors({ code: err.response?.data?.message || "Invalid or expired code." });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await api.post("/email/resend-verification", { email: verifyEmail });
      setResendCooldown(60);
      Alert.alert("Sent", "A new code has been sent to your email.");
    } catch {
      Alert.alert("Oops", "Could not resend. Try again shortly.");
    }
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail || !/^\S+@\S+\.\S+$/.test(forgotEmail)) {
      setErrors({ forgotEmail: "Enter a valid email address" }); return;
    }
    if (!isConnected) { setShowNoNetwork(true); return; }
    await spinner.withSpinner(async () => {
      try {
        await api.post("/email/forgot-password", { email: forgotEmail });
        setResetEmail(forgotEmail);
        switchScreen("reset");
      } catch { Alert.alert("Oops", "Something went wrong. Try again."); }
    }, "Sending reset code...");
  };

  const handleResetSubmit = async () => {
    const code = resetCode.join("");
    const e = {};
    if (code.length < 6) e.resetCode = "Enter the full 6-digit code";
    if (!newPassword) e.newPassword = "Password is required";
    else if (newPassword.length < 8) e.newPassword = "At least 8 characters";
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(newPassword))
      e.newPassword = "Need uppercase, lowercase, number & symbol";
    setErrors(e);
    if (Object.keys(e).length) return;
    if (!isConnected) { setShowNoNetwork(true); return; }
    await spinner.withSpinner(async () => {
      try {
        await api.post("/email/reset-password", { email: resetEmail, code, newPassword });
        Alert.alert("Password reset", "Sign in with your new password.", [
          { text: "Sign in", onPress: () => { setIsLogin(true); switchScreen("auth"); } },
        ]);
        setResetCode(Array(6).fill("")); setNewPassword("");
      } catch (err) {
        setErrors({ resetCode: err.response?.data?.message || "Invalid or expired code." });
      }
    }, "Resetting password...");
  };

  const handleTwoStepVerify = async () => {
    const pin = twoStepPin.join("");
    if (pin.length < 6) { setErrors({ twoStep: "Enter your full 6-digit PIN." }); return; }
    if (!isConnected)   { setShowNoNetwork(true); return; }
    await spinner.withSpinner(async () => {
      try {
        await api.post("/two-step/verify", { pin, email: twoStepEmail });
        await setAuth(pendingToken, pendingUser);
        unlockSilently();
      } catch (err) {
        setErrors({ twoStep: err.response?.data?.message || "Incorrect PIN. Try again." });
      }
    }, "Verifying PIN...");
  };

  const handleTwoStepRecover = async () => {
    const newPin = newRecoverPin.join("");
    if (!recoverCode.trim()) { setErrors({ recover: "Enter your recovery code." }); return; }
    if (newPin.length < 6)   { setErrors({ recover: "Enter a new 6-digit PIN." }); return; }
    if (!isConnected)         { setShowNoNetwork(true); return; }
    await spinner.withSpinner(async () => {
      try {
        await api.post("/two-step/recover", {
          email: twoStepEmail,
          recoveryCode: recoverCode.trim().toUpperCase(),
          newPin,
        });
        Alert.alert("PIN reset", "Sign in again and use your new PIN.", [
          { text: "OK", onPress: () => { setTwoStepPin(Array(6).fill("")); setRecoverCode(""); setNewRecoverPin(Array(6).fill("")); switchScreen("twostep"); } },
        ]);
      } catch (err) {
        setErrors({ recover: err.response?.data?.message || "Recovery failed. Check your code." });
      }
    }, "Resetting PIN...");
  };

  // ── RENDER ────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, width: "100%" }}>

          {/* Header */}
          <View style={styles.header}>
            <HeartLogoIcon size={52} color={COLORS.accent} />
            <Text style={styles.appName}>HushCircle</Text>
            <Text style={styles.tagline}>A safe space for your heart</Text>
          </View>

          {/* ══ AUTH SCREEN ══ */}
          {screen === "auth" && (
            <>
              <View style={styles.toggleContainer}>
                {["Sign In", "Join"].map((label, i) => {
                  const active = i === 0 ? isLogin : !isLogin;
                  return (
                    <TouchableOpacity key={label} style={[styles.toggleBtn, active && styles.toggleActive]}
                      onPress={() => {
                        setIsLogin(i === 0);
                        setErrors({});
                        setPendingToken(null);
                        setPendingUser(null);
                        setTwoStepPin(Array(6).fill(""));
                        setTwoStepHint("");
                        setTwoStepEmail("");
                      }}>
                      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.form}>
                {!isLogin && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Your Anonymous Name</Text>
                    <TextInput style={[styles.input, errors.pseudonym && styles.inputError]}
                      placeholder="e.g. StargazerX, MoonWhisper" placeholderTextColor={COLORS.textMuted}
                      value={pseudonym} onChangeText={setPseudonym} autoCapitalize="none" />
                    {errors.pseudonym && <Text style={styles.errorText}>{errors.pseudonym}</Text>}
                    <Text style={styles.hint}>This is how others see you — never your real name</Text>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput style={[styles.input, errors.email && styles.inputError]}
                    placeholder="your@email.com" placeholderTextColor={COLORS.textMuted}
                    value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput style={[styles.passwordInput, errors.password && styles.inputError]}
                      placeholder="Min 8 chars, uppercase, number, symbol" placeholderTextColor={COLORS.textMuted}
                      value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOffIcon size={18} color={COLORS.textMuted} /> : <EyeIcon size={18} color={COLORS.textMuted} />}
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {isLogin && (
  <>
    <TouchableOpacity
      style={styles.forgotLink}
      onPress={() => {
        setForgotEmail(email);
        switchScreen("forgot");
      }}
    >
      <Text style={styles.forgotLinkText}>Forgot password?</Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => navigation.navigate("AccountRecovery")}
    >
      <Text
        style={{
          color: COLORS.textMuted,
          fontFamily: "Nunito_400Regular",
          fontSize: 12,
          textAlign: "center",
          marginTop: 8,
        }}
      >
        Lost access to your account entirely?{" "}
        <Text
          style={{
            color: COLORS.accent,
            fontFamily: "Nunito_700Bold",
          }}
        >
          Get help
        </Text>
      </Text>
    </TouchableOpacity>
  </>
)}

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                  <View style={styles.btnInner}>
                    <HeartSmallIcon size={13} color="#fff" />
                    <Text style={styles.submitText}>{isLogin ? "Enter safely" : "Create my safe space"}</Text>
                  </View>
                </TouchableOpacity>

                {/* ── Passkey sign-in section ── */}
                {isLogin && passkeyAvailable && (
                  <View style={{ marginTop: 20 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                      <Text style={{ color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>or sign in with passkey</Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Your pseudonym</Text>
                      <TextInput
                        style={[styles.input, errors.pseudonymPasskey && styles.inputError]}
                        placeholder="Enter your HushCircle pseudonym"
                        placeholderTextColor={COLORS.textMuted}
                        value={passkeyPseudonym}
                        onChangeText={setPasskeyPseudonym}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {errors.pseudonymPasskey && <Text style={styles.errorText}>{errors.pseudonymPasskey}</Text>}
                    </View>

                    <TouchableOpacity
                      style={[styles.submitBtn, { backgroundColor: "transparent", borderWidth: 1, borderColor: COLORS.border }]}
                      onPress={handlePasskeyLogin}
                    >
                      <View style={styles.btnInner}>
                        <KeyIcon size={16} color={COLORS.accentSoft} />
                        <Text style={[styles.submitText, { color: COLORS.accentSoft }]}>
                          Sign in with {biometricLabel}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {!isLogin && (
                  <View style={styles.privacyNoteRow}>
                    <LockSmallIcon size={13} color={COLORS.textMuted} />
                    <Text style={styles.privacyNote}>
                      Your identity is protected. We only store your pseudonym, never your real name.
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* ══ VERIFY EMAIL ══ */}
          {screen === "verify" && (
            <View style={styles.form}>
              <View style={styles.verifyCard}>
                <MailOpenIcon size={44} color={COLORS.accent} />
                <Text style={styles.verifyTitle}>Check your inbox</Text>
                <Text style={styles.verifySubtitle}>
                  We sent a 6-digit code to{"\n"}
                  <Text style={styles.verifyEmail}>{verifyEmail}</Text>
                </Text>
              </View>
              {buildCodeInput(verifyCode, setVerifyCode, codeRefs)}
              {errors.code && <Text style={[styles.errorText, { textAlign: "center", marginTop: 8 }]}>{errors.code}</Text>}
              <TouchableOpacity style={[styles.submitBtn, { marginTop: 20 }]} onPress={handleVerify} disabled={verifyLoading}>
                <View style={styles.btnInner}>
                  {!verifyLoading && <HeartSmallIcon size={13} color="#fff" />}
                  <Text style={styles.submitText}>{verifyLoading ? "Verifying..." : "Verify email"}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={resendCooldown > 0}>
                <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't get it? Resend code"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backLink} onPress={() => switchScreen("auth")}>
                <View style={styles.btnInner}>
                  <ArrowLeftIcon size={13} color={COLORS.textMuted} />
                  <Text style={styles.backLinkText}>Back to sign in</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* ══ FORGOT PASSWORD ══ */}
          {screen === "forgot" && (
            <View style={styles.form}>
              <View style={styles.verifyCard}>
                <KeyLargeIcon size={44} color={COLORS.accent} />
                <Text style={styles.verifyTitle}>Reset password</Text>
                <Text style={styles.verifySubtitle}>Enter your account email and we'll send a reset code.</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email address</Text>
                <TextInput style={[styles.input, errors.forgotEmail && styles.inputError]}
                  placeholder="your@email.com" placeholderTextColor={COLORS.textMuted}
                  value={forgotEmail} onChangeText={setForgotEmail} keyboardType="email-address" autoCapitalize="none" />
                {errors.forgotEmail && <Text style={styles.errorText}>{errors.forgotEmail}</Text>}
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={handleForgotSubmit}>
                <View style={styles.btnInner}>
                  <HeartSmallIcon size={13} color="#fff" />
                  <Text style={styles.submitText}>Send reset code</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backLink} onPress={() => switchScreen("auth")}>
                <View style={styles.btnInner}>
                  <ArrowLeftIcon size={13} color={COLORS.textMuted} />
                  <Text style={styles.backLinkText}>Back to sign in</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* ══ RESET PASSWORD ══ */}
          {screen === "reset" && (
            <View style={styles.form}>
              <View style={styles.verifyCard}>
                <ShieldIcon size={44} color={COLORS.accent} />
                <Text style={styles.verifyTitle}>Enter reset code</Text>
                <Text style={styles.verifySubtitle}>
                  Sent to <Text style={styles.verifyEmail}>{resetEmail}</Text>
                  {"\n"}<Text style={styles.expiryNote}>Expires in 10 minutes</Text>
                </Text>
              </View>
              {buildCodeInput(resetCode, setResetCode, resetCodeRefs)}
              {errors.resetCode && <Text style={[styles.errorText, { textAlign: "center", marginTop: 8 }]}>{errors.resetCode}</Text>}
              <View style={[styles.inputGroup, { marginTop: 20 }]}>
                <Text style={styles.label}>New password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput style={[styles.passwordInput, errors.newPassword && styles.inputError]}
                    placeholder="Min 8 chars, uppercase, number, symbol" placeholderTextColor={COLORS.textMuted}
                    value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNewPw} autoCapitalize="none" />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNewPw(!showNewPw)}>
                    {showNewPw ? <EyeOffIcon size={18} color={COLORS.textMuted} /> : <EyeIcon size={18} color={COLORS.textMuted} />}
                  </TouchableOpacity>
                </View>
                {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={handleResetSubmit}>
                <View style={styles.btnInner}>
                  <HeartSmallIcon size={13} color="#fff" />
                  <Text style={styles.submitText}>Set new password</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backLink} onPress={() => switchScreen("forgot")}>
                <View style={styles.btnInner}>
                  <ArrowLeftIcon size={13} color={COLORS.textMuted} />
                  <Text style={styles.backLinkText}>Try a different email</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* ══ TWO-STEP PIN ══ */}
          {screen === "twostep" && (
            <View style={styles.form}>
              <View style={styles.verifyCard}>
                <LockIcon size={44} color={COLORS.accent} />
                <Text style={styles.verifyTitle}>Two-step verification</Text>
                <Text style={styles.verifySubtitle}>
                  Enter your 6-digit security PIN.
                  {twoStepHint ? `\n\nHint: "${twoStepHint}"` : ""}
                </Text>
              </View>
              {buildCodeInput(twoStepPin, setTwoStepPin, twoStepRefs)}
              {errors.twoStep && <Text style={[styles.errorText, { textAlign: "center", marginTop: 8 }]}>{errors.twoStep}</Text>}
              <TouchableOpacity style={[styles.submitBtn, { marginTop: 20 }]} onPress={handleTwoStepVerify}>
                <View style={styles.btnInner}>
                  <HeartSmallIcon size={13} color="#fff" />
                  <Text style={styles.submitText}>Confirm PIN</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backLink} onPress={() => { setErrors({}); switchScreen("tworecover"); }}>
                <Text style={[styles.backLinkText, { color: COLORS.accentSoft }]}>Forgot your PIN? Use recovery code</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backLink} onPress={() => switchScreen("auth")}>
                <View style={styles.btnInner}>
                  <ArrowLeftIcon size={13} color={COLORS.textMuted} />
                  <Text style={styles.backLinkText}>Back to sign in</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* ══ TWO-STEP RECOVERY ══ */}
          {screen === "tworecover" && (
            <View style={styles.form}>
              <View style={styles.verifyCard}>
                <LifeBuoyIcon size={44} color={COLORS.accent} />
                <Text style={styles.verifyTitle}>Recover access</Text>
                <Text style={styles.verifySubtitle}>
                  Enter your one-time recovery code and set a new PIN.{"\n"}
                  <Text style={styles.expiryNote}>Recovery code can only be used once.</Text>
                </Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Recovery code</Text>
                <TextInput style={[styles.input, errors.recover && styles.inputError]}
                  value={recoverCode} onChangeText={setRecoverCode}
                  autoCapitalize="characters" autoCorrect={false}
                  placeholder="e.g. A3F1C9B2D7" placeholderTextColor={COLORS.textMuted} />
              </View>
              <Text style={[styles.label, { marginBottom: 4 }]}>New PIN</Text>
              {buildCodeInput(newRecoverPin, setNewRecoverPin, newRecoverRefs)}
              {errors.recover && <Text style={[styles.errorText, { textAlign: "center", marginTop: 8 }]}>{errors.recover}</Text>}
              <TouchableOpacity style={[styles.submitBtn, { marginTop: 16 }]} onPress={handleTwoStepRecover}>
                <View style={styles.btnInner}>
                  <HeartSmallIcon size={13} color="#fff" />
                  <Text style={styles.submitText}>Reset PIN</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backLink} onPress={() => { setErrors({}); switchScreen("twostep"); }}>
                <View style={styles.btnInner}>
                  <ArrowLeftIcon size={13} color={COLORS.textMuted} />
                  <Text style={styles.backLinkText}>Back to PIN entry</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      <NoNetworkOverlay visible={showNoNetwork} action={isLogin ? "login" : "signup"}
        onClose={() => setShowNoNetwork(false)} onRetry={() => { setShowNoNetwork(false); handleSubmit(); }} />
      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll:    { flexGrow: 1, padding: 24, justifyContent: "center", alignItems: "center" },
  header:    { alignItems: "center", marginBottom: 40, width: "100%" },
  appName:   { fontSize: 42, color: COLORS.text, fontFamily: "DMSerifDisplay_400Regular", letterSpacing: 1, marginTop: 8 },
  tagline:   { fontSize: 14, color: COLORS.textMuted, fontFamily: "Nunito_400Regular", marginTop: 4 },
  toggleContainer: { flexDirection: "row", backgroundColor: COLORS.card, borderRadius: 12, padding: 4, marginBottom: 28, borderWidth: 1, borderColor: COLORS.border, width: "100%" },
  toggleBtn:       { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  toggleActive:    { backgroundColor: COLORS.accent },
  toggleText:      { color: COLORS.textMuted, fontFamily: "Nunito_500Medium", fontSize: 14 },
  toggleTextActive:{ color: "#fff" },
  form:        { gap: 4, width: "100%" },
  inputGroup:  { marginBottom: 16 },
  label:       { color: COLORS.accentSoft, fontFamily: "Nunito_500Medium", fontSize: 13, marginBottom: 8 },
  input:       { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, color: COLORS.text, fontFamily: "Nunito_400Regular", fontSize: 15 },
  inputError:  { borderColor: COLORS.error },
  passwordContainer: { flexDirection: "row", backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, alignItems: "center" },
  passwordInput:     { flex: 1, padding: 14, color: COLORS.text, fontFamily: "Nunito_400Regular", fontSize: 15 },
  eyeBtn:  { padding: 14 },
  btnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  errorText:  { color: COLORS.error, fontSize: 12, fontFamily: "Nunito_400Regular", marginTop: 4 },
  hint:       { color: COLORS.textMuted, fontSize: 12, fontFamily: "Nunito_400Regular", marginTop: 4 },
  forgotLink:     { alignSelf: "flex-end", marginBottom: 8, marginTop: -8 },
  forgotLinkText: { color: COLORS.accentSoft, fontFamily: "Nunito_500Medium", fontSize: 13 },
  submitBtn:  { backgroundColor: COLORS.accent, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  submitText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 16 },
  privacyNoteRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 16, paddingHorizontal: 4 },
  privacyNote: { color: COLORS.textMuted, fontSize: 12, fontFamily: "Nunito_400Regular", lineHeight: 18, flex: 1 },
  verifyCard:     { backgroundColor: COLORS.card, borderRadius: 16, padding: 24, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, marginBottom: 28 },
  verifyTitle:    { color: COLORS.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 24, marginTop: 12, marginBottom: 10, textAlign: "center" },
  verifySubtitle: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },
  verifyEmail:    { color: COLORS.accentSoft, fontFamily: "Nunito_700Bold" },
  expiryNote:     { color: COLORS.error, fontFamily: "Nunito_500Medium", fontSize: 12 },
  codeRow:        { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 4 },
  codeBox:        { width: 46, height: 58, borderRadius: 12, backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, textAlign: "center", color: COLORS.text, fontFamily: "Nunito_700Bold", fontSize: 22 },
  codeBoxFilled:  { borderColor: COLORS.accent, backgroundColor: COLORS.accent + "15" },
  resendBtn:      { alignItems: "center", marginTop: 16 },
  resendText:     { color: COLORS.accentSoft, fontFamily: "Nunito_500Medium", fontSize: 14 },
  resendTextDisabled: { color: COLORS.textMuted },
  backLink:     { alignItems: "center", marginTop: 20 },
  backLinkText: { color: COLORS.textMuted, fontFamily: "Nunito_500Medium", fontSize: 14 },
});