import { useState } from "react";
import {
  View, Text, TouchableOpacity,
  TextInput, ActivityIndicator,
  ScrollView, Alert, Linking,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api/api";

// ── SVG Icons — receive color as prop ────────────────────────────────────

const ShieldOffIcon    = ({ size = 52, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const AlertTriangleIcon = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const CheckCircleIcon  = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="22 4 12 14.01 9 11.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ClockIcon        = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const LogOutIcon       = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const SendIcon         = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 2L15 22l-4-9-9-4 20-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MailIcon         = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="22 6 12 13 2 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const InfoIcon         = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="16" x2="12.01" y2="16" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);
const BanReasonIcon    = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ── Helper ────────────────────────────────────────────────────────────────

const formatBanDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

// ── Screen ────────────────────────────────────────────────────────────────

export default function BanScreen() {
  const { user, logout } = useAuth();
  const { colors: C }    = useTheme();                  // ← live theme colors

  const [appealText, setAppealText]           = useState("");
  const [submitting, setSubmitting]           = useState(false);
  const [appealSubmitted, setAppealSubmitted] = useState(user?.appealStatus === "pending");
  const [appealDecision, setAppealDecision]   = useState(
    user?.appealStatus === "rejected" ? "rejected" : null
  );

  const isPermaBan   = user?.banType === "permanent" || !user?.banExpiresAt;
  const banExpiresAt = user?.banExpiresAt;
  const banReason    = user?.banReason || "Violation of community guidelines";
  const violation    = user?.violation;

  const handleSubmitAppeal = async () => {
    if (!appealText.trim()) { Alert.alert("Required", "Please write your appeal message."); return; }
    if (appealText.trim().length < 20) { Alert.alert("Too short", "Please write at least 20 characters for your appeal."); return; }
    setSubmitting(true);
    try {
      await api.post("/auth/appeal", { message: appealText.trim() });
      setAppealSubmitted(true);
      Alert.alert("Appeal submitted 💜", "Our team will review your appeal within 48 hours.");
    } catch (e) {
      const msg = e.response?.data?.message || "Could not submit appeal.";
      if (msg.includes("already submitted")) { setAppealSubmitted(true); Alert.alert("Already submitted", "You already have a pending appeal."); }
      else Alert.alert("Error", msg);
    } finally { setSubmitting(false); }
  };

  const canAppeal = !appealSubmitted && (!violation || violation < 3);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 72, paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >

      {/* Hero */}
      <View style={{ alignItems: "center", marginBottom: 28 }}>
        <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: C.error + "22", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: C.error + "44", marginBottom: 18 }}>
          <ShieldOffIcon size={44} color={C.error} />
        </View>
        <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 30, textAlign: "center", marginBottom: 8 }}>
          Account suspended
        </Text>
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 }}>
          Your account has been suspended for violating HushCircle's community guidelines.
        </Text>
      </View>

      {/* Ban details card */}
      <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: C.error + "44" }}>
        {/* Type */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 14 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.error + "22", justifyContent: "center", alignItems: "center" }}>
            <AlertTriangleIcon size={18} color={C.error} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 }}>Ban type</Text>
            <Text style={{ color: C.error, fontFamily: "Nunito_700Bold", fontSize: 15 }}>
              {isPermaBan ? "Permanent suspension" : "Temporary suspension"}
            </Text>
          </View>
        </View>

        {/* Reason */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 14 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.warning + "22", justifyContent: "center", alignItems: "center" }}>
            <BanReasonIcon size={18} color={C.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 }}>Reason</Text>
            <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 14, lineHeight: 20 }}>{banReason}</Text>
          </View>
        </View>

        {/* Expiry (temp bans only) */}
        {!isPermaBan && banExpiresAt && (
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.accent + "22", justifyContent: "center", alignItems: "center" }}>
              <ClockIcon size={18} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 }}>Suspended until</Text>
              <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>{formatBanDate(banExpiresAt)}</Text>
            </View>
          </View>
        )}

        {/* Violation count */}
        {violation !== undefined && (
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.error + "22", justifyContent: "center", alignItems: "center" }}>
              <InfoIcon size={14} color={C.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 }}>Violations</Text>
              <Text style={{ color: violation >= 3 ? C.error : C.warning, fontFamily: "Nunito_700Bold", fontSize: 14 }}>
                {violation}/3 strikes
              </Text>
              {violation >= 3 && (
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2, lineHeight: 18 }}>
                  3 strikes results in a permanent ban. Appeals are no longer available.
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Info note */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: C.inputBg, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: C.border }}>
        <InfoIcon size={14} color={C.textMuted} />
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20, flex: 1 }}>
          HushCircle is a safe space built on kindness and mutual support. Violations of our community guidelines result in suspension to protect other members.
        </Text>
      </View>

      {/* Appeal section */}
      {canAppeal ? (
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 20, marginBottom: 6 }}>Appeal your suspension</Text>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
            If you believe this was a mistake, you can submit one appeal. Our team will review it within 48 hours.
          </Text>
          <TextInput
            style={{ backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 14, minHeight: 110, textAlignVertical: "top", lineHeight: 22, marginBottom: 6 }}
            placeholder="Explain why you believe this suspension was incorrect. Be honest and respectful."
            placeholderTextColor={C.textMuted}
            value={appealText}
            onChangeText={setAppealText}
            multiline
            maxLength={500}
          />
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "right", marginBottom: 16 }}>{appealText.length}/500</Text>
          <TouchableOpacity
            style={{ backgroundColor: C.accent, borderRadius: 14, padding: 15, alignItems: "center", opacity: submitting ? 0.7 : 1 }}
            onPress={handleSubmitAppeal}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <SendIcon size={15} color="#fff" />
                <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 15 }}>Submit appeal</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ) : appealSubmitted ? (
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: C.success + "44" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <CheckCircleIcon size={20} color={C.success} />
            <Text style={{ color: C.success, fontFamily: "Nunito_700Bold", fontSize: 16 }}>Appeal submitted</Text>
          </View>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20 }}>
            Your appeal is under review. Our team will respond within 48 hours. You will be notified of the decision.
          </Text>
        </View>
      ) : appealDecision === "rejected" ? (
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: C.error + "44" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <AlertTriangleIcon size={18} color={C.error} />
            <Text style={{ color: C.error, fontFamily: "Nunito_700Bold", fontSize: 16 }}>Appeal rejected</Text>
          </View>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20 }}>
            Your appeal has been reviewed and rejected. The suspension will remain in place. No further appeals can be submitted.
          </Text>
        </View>
      ) : null}

      {/* Contact support */}
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: C.border }}
        onPress={() => Linking.openURL("mailto:support@hushcircle.com")}
        activeOpacity={0.75}
      >
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.accent + "22", justifyContent: "center", alignItems: "center" }}>
          <MailIcon size={16} color={C.accentSoft} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 14, marginBottom: 2 }}>Contact support</Text>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>support@hushcircle.com</Text>
        </View>
      </TouchableOpacity>

      {/* Sign out */}
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border }}
        onPress={logout}
        activeOpacity={0.75}
      >
        <LogOutIcon size={16} color={C.textMuted} />
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 15 }}>Sign out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}