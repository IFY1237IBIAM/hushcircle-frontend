/**
 * screens/AccountRecoveryScreen.js
 *
 * The "I'm locked out" screen — for users who forgot their password
 * AND lost their two-step recovery code.
 */

import { useState } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { useTheme }   from "../context/ThemeContext";
import { useNetwork } from "../context/NetworkContext";
import api             from "../api/api";

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const BackIcon = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="15 18 9 12 15 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MailSentIcon = ({ size = 52, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      fill={color + "18"} stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="22 6 12 13 2 6" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 12l4-4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="18 6 22 6 22 10" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LockIcon = ({ size = 40, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      fill={color + "18"} stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="16" r="1.5" fill={color} />
  </Svg>
);

const CheckCircleIcon = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="22 4 12 14.01 9 11.01"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ──────────────────────────────────────────────────────────────────────────────

export default function AccountRecoveryScreen() {
  const navigation     = useNavigation();
  const { colors: C }  = useTheme();
  const { isConnected } = useNetwork();

  const [email,       setEmail]       = useState("");
  const [pseudonym,   setPseudonym]   = useState("");
  const [accountAge,  setAccountAge]  = useState("");
  const [reason,      setReason]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [error,       setError]       = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !pseudonym.trim() || !reason.trim()) {
      setError("Please fill in your email, pseudonym, and a description of your situation.");
      return;
    }
    if (reason.trim().length < 20) {
      setError("Please provide a bit more detail (at least 20 characters) so we can verify it's you.");
      return;
    }
    if (!isConnected) {
      Alert.alert("No connection", "Check your internet and try again.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/recovery/request", {
        email:      email.trim(),
        pseudonym:  pseudonym.trim(),
        accountAge: accountAge.trim(),
        reason:     reason.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center", padding: 32 }}>
        {/* Icon */}
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: C.accent + "18", borderWidth: 1.5, borderColor: C.accent + "33", justifyContent: "center", alignItems: "center", marginBottom: 20 }}>
          <MailSentIcon size={44} color={C.accent} />
        </View>

        <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 24, textAlign: "center", marginBottom: 12 }}>
          Request submitted
        </Text>
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
          We've received your account recovery request. If we find a matching account,
          you'll get an email within 24–48 hours with the outcome.
        </Text>

        <View style={{ backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 32, width: "100%" }}>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 19 }}>
            Check your spam folder if you don't see an email from us.
            For urgent issues, you can also reach support directly at{" "}
            <Text style={{ color: C.accent, fontFamily: "Nunito_700Bold" }}>support@hushcircle.org</Text>.
          </Text>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40 }}
          onPress={() => navigation.navigate("Auth")}
        >
          <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 15 }}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.card,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, justifyContent: "center" }}>
          <BackIcon size={22} color={C.accent} />
        </TouchableOpacity>
        <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 20 }}>Account recovery</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

        {/* Hero icon */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.accent + "18", borderWidth: 1.5, borderColor: C.accent + "33", justifyContent: "center", alignItems: "center" }}>
            <LockIcon size={36} color={C.accent} />
          </View>
        </View>

        <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 20, textAlign: "center", marginBottom: 8 }}>
          Locked out of your account?
        </Text>
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 28 }}>
          If you've forgotten your password and lost your two-step recovery code,
          tell us a bit about your account and we'll review it manually.
        </Text>

        {/* Info callout */}
        <View style={{ backgroundColor: C.accent + "12", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.accent + "30", marginBottom: 24, flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
          <CheckCircleIcon size={16} color={C.accentSoft} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 13, marginBottom: 6 }}>
              Before you continue
            </Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 18 }}>
              If you still remember your password, use "Forgot password" instead — it's instant.
              This form is only for when you're completely locked out.
            </Text>
          </View>
        </View>

        {/* Fields */}
        <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 6 }}>Your account email</Text>
        <TextInput
          style={{ backgroundColor: C.inputBg || C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15, marginBottom: 16 }}
          value={email} onChangeText={setEmail}
          placeholder="you@example.com" placeholderTextColor={C.textMuted}
          keyboardType="email-address" autoCapitalize="none"
        />

        <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 6 }}>Your pseudonym</Text>
        <TextInput
          style={{ backgroundColor: C.inputBg || C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15, marginBottom: 16 }}
          value={pseudonym} onChangeText={setPseudonym}
          placeholder="Your username on HushCircle" placeholderTextColor={C.textMuted}
          autoCapitalize="none"
        />

        <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 6 }}>
          Roughly when did you create your account?{" "}
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular" }}>(optional)</Text>
        </Text>
        <TextInput
          style={{ backgroundColor: C.inputBg || C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15, marginBottom: 16 }}
          value={accountAge} onChangeText={setAccountAge}
          placeholder="e.g. around March 2025" placeholderTextColor={C.textMuted}
        />

        <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 6 }}>
          Tell us what happened
        </Text>
        <TextInput
          style={{
            backgroundColor: C.inputBg || C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border,
            padding: 14, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15,
            minHeight: 110, textAlignVertical: "top", marginBottom: 8,
          }}
          value={reason} onChangeText={setReason}
          placeholder="e.g. I forgot my password and I never saved my two-step recovery code. I think I set up two-step around..."
          placeholderTextColor={C.textMuted}
          multiline maxLength={1000}
        />
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "right", marginBottom: 20 }}>
          {reason.length}/1000
        </Text>

        {error ? (
          <Text style={{ color: C.error, fontFamily: "Nunito_500Medium", fontSize: 13, textAlign: "center", marginBottom: 16 }}>
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          style={{ backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center", opacity: loading ? 0.7 : 1 }}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 16 }}>Submit recovery request</Text>
          }
        </TouchableOpacity>

        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, textAlign: "center", marginTop: 20, lineHeight: 18 }}>
          Our team reviews requests within 24–48 hours. You'll receive an email with the outcome.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}