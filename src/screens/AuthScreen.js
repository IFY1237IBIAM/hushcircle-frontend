import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert, Animated,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkContext";
import NoNetworkOverlay from "../components/NoNetworkOverlay";
import { Ionicons } from "@expo/vector-icons";
import HushCircleSpinner from "../components/HushCircleSpinner";
import useSpinner from "../hooks/useSpinner";
import api from "../api/api";import { useTheme } from "../context/ThemeContext";



// ─── SCREENS within AuthScreen ───────────────────────────────────────────────
// "auth"       → login / signup toggle (existing)
// "verify"     → 6-digit code entry after signup
// "forgot"     → enter email to request reset code
// "reset"      → enter code + new password

export default function AuthScreen() {
  const { colors: COLORS } = useTheme();
  const [screen, setScreen] = useState("auth"); // "auth" | "verify" | "forgot" | "reset"
  const [isLogin, setIsLogin] = useState(true);

  // Auth fields
  const [pseudonym, setPseudonym] = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Verify fields
  const [verifyCode, setVerifyCode]       = useState(["", "", "", "", "", ""]);
  const [verifyEmail, setVerifyEmail]     = useState(""); // set after signup
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeRefs = useRef([]);

  // Forgot / reset fields
  const [forgotEmail, setForgotEmail]       = useState("");
  const [resetCode, setResetCode]           = useState(["", "", "", "", "", ""]);
  const [resetEmail, setResetEmail]         = useState(""); // carried from forgot screen
  const [newPassword, setNewPassword]       = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const resetCodeRefs = useRef([]);

  const [errors, setErrors]           = useState({});
  const [showNoNetwork, setShowNoNetwork] = useState(false);

  const { login, signup, setAuth } = useAuth();
  const { isConnected }   = useNetwork();
  const spinner           = useSpinner();

  // Fade animation for screen transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const switchScreen = (to) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setErrors({});
    setScreen(to);
  };

  // ── Resend cooldown timer ────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!email) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Password must be at least 8 characters";
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(password))
      e.password = "Need uppercase, lowercase, number & special character";
    if (!isLogin && !pseudonym) e.pseudonym = "Pseudonym is required";
    else if (!isLogin && (pseudonym.length < 3 || pseudonym.length > 20))
      e.pseudonym = "Pseudonym must be 3–20 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Auth submit ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    if (!isConnected) { setShowNoNetwork(true); return; }

    await spinner.withSpinner(async () => {
      try {
        if (isLogin) {
          const result = await login(email, password);
          // Backend confirmed credentials but email isn't verified yet —
          // redirect to verify screen without logging the user in.
          if (result?.unverified === true) {
            setVerifyEmail(email);
            switchScreen("verify");
          }
          // If verified, RootNavigator handles navigation automatically.
        } else {
          const result = await signup(pseudonym, email, password);
          setVerifyEmail(result.email);
          switchScreen("verify");
        }
      } catch (error) {
        const msg = error.response?.data?.message || "Something went wrong. Try again.";
        Alert.alert("Oops", msg);
      }
    }, isLogin ? "Signing you in..." : "Creating your space...");
  };

  // ── 6-digit code input helpers ───────────────────────────────────────────
  const handleCodeChange = (text, idx, codeArr, setCode, refs) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(-1);
    const next = [...codeArr];
    next[idx] = cleaned;
    setCode(next);
    if (cleaned && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleCodeBackspace = (key, idx, codeArr, setCode, refs) => {
    if (key === "Backspace" && !codeArr[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handleCodePaste = (text, setCode, refs) => {
    const digits = text.replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length === 6) {
      setCode(digits);
      refs.current[5]?.focus();
    }
  };

  const CodeInput = ({ codeArr, setCode, refs }) => (
    <View style={styles.codeRow}>
      {codeArr.map((digit, i) => (
        <TextInput
          key={i}
          ref={(r) => (refs.current[i] = r)}
          style={[styles.codeBox, digit && styles.codeBoxFilled]}
          value={digit}
          onChangeText={(t) => {
            // Handle paste
            if (t.length > 1) { handleCodePaste(t, setCode, refs); return; }
            handleCodeChange(t, i, codeArr, setCode, refs);
          }}
          onKeyPress={({ nativeEvent }) =>
            handleCodeBackspace(nativeEvent.key, i, codeArr, setCode, refs)
          }
          keyboardType="number-pad"
          maxLength={6}
          selectTextOnFocus
        />
      ))}
    </View>
  );

  // ── Verify email submit ──────────────────────────────────────────────────
  const handleVerify = async () => {
  const code = verifyCode.join("");

  if (code.length < 6) {
    setErrors({ code: "Enter the full 6-digit code" });
    return;
  }

  setVerifyLoading(true);

  try {
    const res = await api.post("/email/verify-email", {
      code,
      email: verifyEmail,
    });

    // Save token + user so RootNavigator logs them in
    await setAuth(res.data.token, res.data.user);

    Alert.alert(
      "You're verified 💜",
      "Welcome to HushCircle. Let's set you up.",
      [{ text: "Continue", onPress: () => {} }]
    );

  } catch (err) {
    const msg = err.response?.data?.message || "Invalid or expired code.";
    setErrors({ code: msg });
  } finally {
    setVerifyLoading(false);
  }
};

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await api.post("/email/resend-verification", { email: verifyEmail });
      setResendCooldown(60);
      Alert.alert("Sent 💜", "A new code has been sent to your email.");
    } catch {
      Alert.alert("Oops", "Could not resend. Try again shortly.");
    }
  };

  // ── Forgot password ──────────────────────────────────────────────────────
  const handleForgotSubmit = async () => {
    if (!forgotEmail || !/^\S+@\S+\.\S+$/.test(forgotEmail)) {
      setErrors({ forgotEmail: "Enter a valid email address" });
      return;
    }
    await spinner.withSpinner(async () => {
      try {
        await api.post("/email/forgot-password", { email: forgotEmail });
        setResetEmail(forgotEmail);
        switchScreen("reset");
      } catch (err) {
        // API always returns 200 for security — only real errors hit here
        Alert.alert("Oops", "Something went wrong. Try again.");
      }
    }, "Sending reset code...");
  };

  // ── Reset password ───────────────────────────────────────────────────────
  const handleResetSubmit = async () => {
    const code = resetCode.join("");
    const e = {};
    if (code.length < 6) e.resetCode = "Enter the full 6-digit code";
    if (!newPassword) e.newPassword = "Password is required";
    else if (newPassword.length < 8) e.newPassword = "At least 8 characters";
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(newPassword))
      e.newPassword = "Need uppercase, lowercase, number & special character";
    setErrors(e);
    if (Object.keys(e).length) return;

    await spinner.withSpinner(async () => {
      try {
        await api.post("/email/reset-password", {
          email: resetEmail,
          code,
          newPassword,
        });
        Alert.alert(
          "Password reset 💜",
          "You can now sign in with your new password.",
          [{ text: "Sign in", onPress: () => { setIsLogin(true); switchScreen("auth"); } }]
        );
        setResetCode(["", "", "", "", "", ""]);
        setNewPassword("");
      } catch (err) {
        const msg = err.response?.data?.message || "Invalid or expired code.";
        setErrors({ resetCode: msg });
      }
    }, "Resetting password...");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, width: "100%" }}>

          {/* ── Header (always visible) ── */}
          <View style={styles.header}>
            <Text style={styles.logo}>💜</Text>
            <Text style={styles.appName}>HushCircle</Text>
            <Text style={styles.tagline}>A safe space for your heart</Text>
          </View>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN: auth (login / signup)                                 */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {screen === "auth" && (
            <>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleBtn, isLogin && styles.toggleActive]}
                  onPress={() => { setIsLogin(true); setErrors({}); }}
                >
                  <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, !isLogin && styles.toggleActive]}
                  onPress={() => { setIsLogin(false); setErrors({}); }}
                >
                  <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                    Join
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                {!isLogin && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Your Anonymous Name</Text>
                    <TextInput
                      style={[styles.input, errors.pseudonym && styles.inputError]}
                      placeholder="e.g. StargazerX, MoonWhisper"
                      placeholderTextColor={COLORS.textMuted}
                      value={pseudonym}
                      onChangeText={setPseudonym}
                      autoCapitalize="none"
                    />
                    {errors.pseudonym && <Text style={styles.errorText}>{errors.pseudonym}</Text>}
                    <Text style={styles.hint}>This is how others see you — never your real name</Text>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="your@email.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.passwordInput, errors.password && styles.inputError]}
                      placeholder="Min 8 chars, uppercase, number, symbol"
                      placeholderTextColor={COLORS.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color={COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {/* Forgot password link — login only */}
                {isLogin && (
                  <TouchableOpacity
                    style={styles.forgotLink}
                    onPress={() => { setForgotEmail(email); switchScreen("forgot"); }}
                  >
                    <Text style={styles.forgotLinkText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                  <Text style={styles.submitText}>
                    {isLogin ? "Enter safely 💜" : "Create my safe space 💜"}
                  </Text>
                </TouchableOpacity>

                {!isLogin && (
                  <Text style={styles.privacyNote}>
                    🔒 Your identity is protected. We only store your pseudonym, never your real name.
                  </Text>
                )}
              </View>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN: verify email                                           */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {screen === "verify" && (
            <View style={styles.form}>
              <View style={styles.verifyCard}>
                <Text style={styles.verifyEmoji}>📬</Text>
                <Text style={styles.verifyTitle}>Check your inbox</Text>
                <Text style={styles.verifySubtitle}>
                  We sent a 6-digit code to{"\n"}
                  <Text style={styles.verifyEmail}>{verifyEmail}</Text>
                </Text>
              </View>

              <CodeInput codeArr={verifyCode} setCode={setVerifyCode} refs={codeRefs} />
              {errors.code && (
                <Text style={[styles.errorText, { textAlign: "center", marginTop: 8 }]}>{errors.code}</Text>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, { marginTop: 20 }]}
                onPress={handleVerify}
                disabled={verifyLoading}
              >
                <Text style={styles.submitText}>
                  {verifyLoading ? "Verifying..." : "Verify email 💜"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleResend}
                disabled={resendCooldown > 0}
              >
                <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't get it? Resend code"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backLink} onPress={() => switchScreen("auth")}>
                <Text style={styles.backLinkText}>← Back to sign in</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN: forgot password                                        */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {screen === "forgot" && (
            <View style={styles.form}>
              <View style={styles.verifyCard}>
                <Text style={styles.verifyEmoji}>🔑</Text>
                <Text style={styles.verifyTitle}>Reset password</Text>
                <Text style={styles.verifySubtitle}>
                  Enter the email linked to your account and we'll send you a reset code.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email address</Text>
                <TextInput
                  style={[styles.input, errors.forgotEmail && styles.inputError]}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.forgotEmail && <Text style={styles.errorText}>{errors.forgotEmail}</Text>}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleForgotSubmit}>
                <Text style={styles.submitText}>Send reset code 💜</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backLink} onPress={() => switchScreen("auth")}>
                <Text style={styles.backLinkText}>← Back to sign in</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SCREEN: reset password                                         */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {screen === "reset" && (
            <View style={styles.form}>
              <View style={styles.verifyCard}>
                <Text style={styles.verifyEmoji}>🛡️</Text>
                <Text style={styles.verifyTitle}>Enter reset code</Text>
                <Text style={styles.verifySubtitle}>
                  We sent a code to{"\n"}
                  <Text style={styles.verifyEmail}>{resetEmail}</Text>
                  {"\n"}
                  <Text style={styles.expiryNote}>Expires in 10 minutes</Text>
                </Text>
              </View>

              <CodeInput codeArr={resetCode} setCode={setResetCode} refs={resetCodeRefs} />
              {errors.resetCode && (
                <Text style={[styles.errorText, { textAlign: "center", marginTop: 8 }]}>{errors.resetCode}</Text>
              )}

              <View style={[styles.inputGroup, { marginTop: 20 }]}>
                <Text style={styles.label}>New password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, errors.newPassword && styles.inputError]}
                    placeholder="Min 8 chars, uppercase, number, symbol"
                    placeholderTextColor={COLORS.textMuted}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Ionicons
                        name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color={COLORS.textMuted}
                      />
                    </TouchableOpacity>
                </View>
                {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleResetSubmit}>
                <Text style={styles.submitText}>Set new password 💜</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backLink}
                onPress={() => switchScreen("forgot")}
              >
                <Text style={styles.backLinkText}>← Try a different email</Text>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      <NoNetworkOverlay
        visible={showNoNetwork}
        action={isLogin ? "login" : "signup"}
        onClose={() => setShowNoNetwork(false)}
        onRetry={() => { setShowNoNetwork(false); handleSubmit(); }}
      />

      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

    const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F0A1E" },
    scroll: { flexGrow: 1, padding: 24, justifyContent: "center", alignItems: "center" },

    header: { alignItems: "center", marginBottom: 40, width: "100%" },
    logo: { fontSize: 56, marginBottom: 8 },
    appName: {
    fontSize: 42, color: "#EDE8F5",
    fontFamily: "DMSerifDisplay_400Regular", letterSpacing: 1,
    },
    tagline: {
    fontSize: 14, color: "#8B7FA8",
    fontFamily: "Nunito_400Regular", marginTop: 4,
    },

    // Toggle
    toggleContainer: {
    flexDirection: "row", backgroundColor: "#1A1330", borderRadius: 12,
    padding: 4, marginBottom: 28, borderWidth: 1, borderColor: "#2D2450", width: "100%",
    },
    toggleBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
    toggleActive: { backgroundColor: "#9B6FD4" },
    toggleText: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 14 },
    toggleTextActive: { color: "#fff" },

    // Form
    form: { gap: 4, width: "100%" },
    inputGroup: { marginBottom: 16 },
    label: { color: "#C4A3E8", fontFamily: "Nunito_500Medium", fontSize: 13, marginBottom: 8 },
    input: {
    backgroundColor: "#1A1330", borderWidth: 1, borderColor: "#2D2450",
    borderRadius: 12, padding: 14, color: "#EDE8F5",
    fontFamily: "Nunito_400Regular", fontSize: 15,
    },
    inputError: { borderColor: "#D4607A" },
    passwordContainer: {
    flexDirection: "row", backgroundColor: "#1A1330",
    borderWidth: 1, borderColor: "#2D2450", borderRadius: 12, alignItems: "center",
    },
    passwordInput: {
    flex: 1, padding: 14, color: "#EDE8F5",
    fontFamily: "Nunito_400Regular", fontSize: 15,
    },
    eyeBtn: { padding: 14 },
    // eyeIcon: { fontSize: 18 },
    errorText: { color: "#D4607A", fontSize: 12, fontFamily: "Nunito_400Regular", marginTop: 4 },
    hint: { color: "#8B7FA8", fontSize: 12, fontFamily: "Nunito_400Regular", marginTop: 4 },

    forgotLink: { alignSelf: "flex-end", marginBottom: 8, marginTop: -8 },
    forgotLinkText: { color: "#C4A3E8", fontFamily: "Nunito_500Medium", fontSize: 13 },

    submitBtn: {
    backgroundColor: "#9B6FD4", borderRadius: 12,
    padding: 16, alignItems: "center", marginTop: 8,
    },
    submitText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 16 },

    privacyNote: {
    color: "#8B7FA8", fontSize: 12, fontFamily: "Nunito_400Regular",
    textAlign: "center", marginTop: 16, lineHeight: 18,
    },

    // ── Verify / Reset shared ──
    verifyCard: {
    backgroundColor: "#1A1330", borderRadius: 16, padding: 24,
    alignItems: "center", borderWidth: 1, borderColor: "#2D2450", marginBottom: 28,
    },
    verifyEmoji: { fontSize: 44, marginBottom: 12 },
    verifyTitle: {
    color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 24, marginBottom: 10, textAlign: "center",
    },
    verifySubtitle: {
    color: "#8B7FA8", fontFamily: "Nunito_400Regular",
    fontSize: 14, textAlign: "center", lineHeight: 22,
    },
    verifyEmail: { color: "#C4A3E8", fontFamily: "Nunito_700Bold" },
    expiryNote: { color: "#D4607A", fontFamily: "Nunito_500Medium", fontSize: 12 },

    // 6-digit code boxes
    codeRow: {
    flexDirection: "row", justifyContent: "center",
    gap: 10, marginTop: 4,
    },
    codeBox: {
    width: 46, height: 58, borderRadius: 12,
    backgroundColor: "#1A1330", borderWidth: 1.5, borderColor: "#2D2450",
    textAlign: "center", color: "#EDE8F5",
    fontFamily: "Nunito_700Bold", fontSize: 22,
    },
    codeBoxFilled: { borderColor: "#9B6FD4", backgroundColor: "#9B6FD4" + "15" },

    resendBtn: { alignItems: "center", marginTop: 16 },
    resendText: { color: "#C4A3E8", fontFamily: "Nunito_500Medium", fontSize: 14 },
    resendTextDisabled: { color: "#8B7FA8" },

    backLink: { alignItems: "center", marginTop: 20 },
    backLinkText: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 14 },
    });

