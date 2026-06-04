import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert, Animated, ActivityIndicator,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkContext";import { useTheme } from "../context/ThemeContext";

// Module-level color fallbacks for icon defaults (theme-aware colors used inside component)
const DARK = {
  textMuted: "#8B7FA8",
  error: "#D4607A",
};



const AVATAR_COLORS = [
  "#9B6FD4", "#D4607A", "#6B9FD4",
  "#4CAF8F", "#D4A44C", "#E879F9",
];

function avatarColor(pseudonym = "") {
  return AVATAR_COLORS[(pseudonym.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

// ── SVG Icon Components ────────────────────────────────────────────────────

const HeartLogoIcon = ({ size = 44, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={color + "44"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const AlertCircleIcon = ({ size = 16, color = DARK.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="16" x2="12.01" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const EyeIcon = ({ size = 22, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
  </Svg>
);

const EyeOffIcon = ({ size = 22, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M1 1l22 22" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LockIcon = ({ size = 13, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UserPlusIcon = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="8.5" cy="7" r="4" stroke={color} strokeWidth={2} />
    <Line x1="20" y1="8" x2="20" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="23" y1="11" x2="17" y2="11" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ──────────────────────────────────────────────────────────────────────────

export default function AddAccountScreen() {
  const { colors: COLORS } = useTheme();
  const navigation = useNavigation();
  const route      = useRoute();
  const { addAccount, accounts, user } = useAuth();
  const { isConnected } = useNetwork();

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState({});

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const validate = () => {
    const e = {};
    if (!email)                              e.email    = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email    = "Enter a valid email";
    if (!password)                           e.password = "Password is required";
    else if (password.length < 8)            e.password = "At least 8 characters";
    setErrors(e);
    if (Object.keys(e).length) shake();
    return Object.keys(e).length === 0;
  };

  const handleAddAccount = async () => {
    if (!validate()) return;

    if (!isConnected) {
      Alert.alert("No connection", "Please check your internet connection.");
      return;
    }

    if (accounts.length >= 3) {
      Alert.alert(
        "Account limit reached",
        "You can save up to 3 accounts. Remove one before adding another.",
        [{ text: "OK" }]
      );
      return;
    }

    const activeEmail = accounts.find((a) => a.pseudonym === user?.pseudonym)?.email;
    if (email.trim().toLowerCase() === activeEmail?.toLowerCase()) {
      setErrors({ email: "This account is already active." });
      shake();
      return;
    }

    setLoading(true);
    try {
      const result = await addAccount(email.trim(), password);

      if (!result.success) {
        setErrors({ general: result.message });
        shake();
        return;
      }

      const msg = result.alreadyExisted
        ? "Switched to your existing account."
        : "Account added and switched.";

      Alert.alert("Done!", msg, [
        {
          text: "Continue",
          onPress: async () => {
            if (route.params?.onSuccess) {
              route.params.onSuccess();
            } else {
              await new Promise((resolve) => setTimeout(resolve, 300));
              navigation.reset({ index: 0, routes: [{ name: "Main" }] });
            }
          },
        },
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || "Could not add account. Check your credentials.";
      setErrors({ general: msg });
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Drag handle */}
      <View style={styles.dragHandle} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <HeartLogoIcon size={40} color={COLORS.accent} />
          </View>
          <Text style={styles.title}>Add another account</Text>
          <Text style={styles.subtitle}>
            Sign in to a different HushCircle account.{"\n"}
            You can save up to 3 accounts.
          </Text>
        </View>

        {/* ── Saved accounts preview ── */}
        {accounts.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.savedLabel}>Already saved</Text>
            <View style={styles.savedRow}>
              {accounts.map((acc) => {
                const color = acc.avatarColor || avatarColor(acc.pseudonym);
                const isActive = acc.pseudonym === user?.pseudonym;
                return (
                  <View key={acc.pseudonym} style={styles.savedAvatar}>
                    <View style={[styles.avatarCircle, { backgroundColor: color + "33", borderColor: color }]}>
                      <Text style={[styles.avatarLetter, { color }]}>
                        {acc.pseudonym?.[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.avatarName} numberOfLines={1}>
                      {isActive ? "Active" : acc.pseudonym}
                    </Text>
                    {isActive && <View style={styles.activeDot} />}
                  </View>
                );
              })}
              {Array.from({ length: 3 - accounts.length }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.savedAvatar}>
                  <View style={styles.emptySlot}>
                    <Text style={styles.emptySlotPlus}>+</Text>
                  </View>
                  <Text style={styles.avatarName}>Empty</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Form ── */}
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          {errors.general && (
            <View style={styles.generalError}>
              <AlertCircleIcon size={16} color={COLORS.error} />
              <Text style={styles.generalErrorText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="account@email.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined, general: undefined })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.passwordRow, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Your password"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined, general: undefined })); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  {showPassword
                    ? <EyeOffIcon size={22} color={COLORS.textMuted} />
                    : <EyeIcon size={22} color={COLORS.textMuted} />
                  }
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnLoading]}
              onPress={handleAddAccount}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.submitBtnInner}>
                  <UserPlusIcon size={15} color="#fff" />
                  <Text style={styles.submitText}>Add account</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Privacy note */}
            <View style={styles.privacyNote}>
              <LockIcon size={13} color={COLORS.textMuted} />
              <Text style={styles.privacyText}>
                Passwords are never stored locally. Only your token is saved.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Cancel */}
      <TouchableOpacity style={styles.cancelBar} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}


  const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: "#0F0A1E" },


  dragHandle: {

  width: 40, height: 4, borderRadius: 2,

  backgroundColor: "#2D2450",

  alignSelf: "center", marginTop: 12, marginBottom: 4,

  },


  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 },


  // Header

  header: { alignItems: "center", marginBottom: 28, marginTop: 12 },

  logoWrap: {

  width: 72, height: 72, borderRadius: 36,

  backgroundColor: "#9B6FD4" + "22",

  borderWidth: 1.5, borderColor: "#9B6FD4" + "44",

  justifyContent: "center", alignItems: "center",

  marginBottom: 16,

  },

  title: {

  fontSize: 26, color: "#EDE8F5",

  fontFamily: "DMSerifDisplay_400Regular",

  letterSpacing: 0.5, marginBottom: 8, textAlign: "center",

  },

  subtitle: {

  fontSize: 13, color: "#8B7FA8",

  fontFamily: "Nunito_400Regular",

  textAlign: "center", lineHeight: 20,

  },


  // Saved accounts preview

  savedSection: {

  backgroundColor: "#1A1330", borderRadius: 16,

  borderWidth: 1, borderColor: "#2D2450",

  padding: 16, marginBottom: 24,

  },

  savedLabel: {

  color: "#8B7FA8", fontFamily: "Nunito_700Bold",

  fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14,

  },

  savedRow: { flexDirection: "row", gap: 16 },

  savedAvatar: { alignItems: "center", gap: 6 },

  avatarCircle: {

  width: 50, height: 50, borderRadius: 25,

  justifyContent: "center", alignItems: "center",

  borderWidth: 2,

  },

  avatarLetter: { fontSize: 22, fontFamily: "DMSerifDisplay_400Regular" },

  avatarName: {

  color: "#8B7FA8", fontFamily: "Nunito_500Medium",

  fontSize: 11, maxWidth: 56, textAlign: "center",

  },

  activeDot: {

  width: 7, height: 7, borderRadius: 4,

  backgroundColor: "#4CAF8F",

  position: "absolute", top: 0, right: 0,

  },

  emptySlot: {

  width: 50, height: 50, borderRadius: 25,

  borderWidth: 2, borderColor: "#2D2450",

  borderStyle: "dashed",

  justifyContent: "center", alignItems: "center",

  },

  emptySlotPlus: { color: "#2D2450", fontSize: 22, fontWeight: "300" },


  // General error

  generalError: {

  flexDirection: "row", alignItems: "center", gap: 8,

  backgroundColor: "#D4607A" + "18",

  borderRadius: 12, padding: 12, marginBottom: 16,

  borderWidth: 1, borderColor: "#D4607A" + "44",

  },

  generalErrorText: {

  color: "#D4607A", fontFamily: "Nunito_500Medium",

  fontSize: 13, flex: 1, lineHeight: 18,

  },


  // Form

  form: { gap: 4 },

  inputGroup: { marginBottom: 16 },

  label: {

  color: "#C4A3E8", fontFamily: "Nunito_500Medium",

  fontSize: 13, marginBottom: 8,

  },

  input: {

  backgroundColor: "#1A1330", borderWidth: 1, borderColor: "#2D2450",

  borderRadius: 12, padding: 14, color: "#EDE8F5",

  fontFamily: "Nunito_400Regular", fontSize: 15,

  },

  inputError: { borderColor: "#D4607A" },

  errorText: {

  color: "#D4607A", fontSize: 12,

  fontFamily: "Nunito_400Regular", marginTop: 4,

  },

  passwordRow: {

  flexDirection: "row", backgroundColor: "#1A1330",

  borderWidth: 1, borderColor: "#2D2450", borderRadius: 12,

  alignItems: "center",

  },

  passwordInput: {

  flex: 1, padding: 14, color: "#EDE8F5",

  fontFamily: "Nunito_400Regular", fontSize: 15,

  },

  eyeBtn: { padding: 14 },


  // Submit

  submitBtn: {

  backgroundColor: "#9B6FD4", borderRadius: 12,

  padding: 16, alignItems: "center", marginTop: 8,

  },

  submitBtnLoading: { opacity: 0.7 },

  submitBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },

  submitText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 16 },


  // Privacy note

  privacyNote: {

  flexDirection: "row", alignItems: "flex-start", gap: 8,

  marginTop: 16, paddingHorizontal: 4,

  },

  privacyText: {

  color: "#8B7FA8", fontFamily: "Nunito_400Regular",

  fontSize: 12, flex: 1, lineHeight: 18,

  },


  // Cancel bar

  cancelBar: {

  borderTopWidth: 1, borderTopColor: "#2D2450",

  padding: 18, alignItems: "center",

  backgroundColor: "#0F0A1E",

  },

  cancelText: {

  color: "#8B7FA8", fontFamily: "Nunito_600SemiBold", fontSize: 15,

  },

  });

