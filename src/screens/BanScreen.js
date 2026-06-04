import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Alert,
  ActivityIndicator, Linking,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect, G } from "react-native-svg";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import HushCircleSpinner from "../components/HushCircleSpinner";
import useSpinner from "../hooks/useSpinner";import { useTheme } from "../context/ThemeContext";

// Module-level color fallbacks for icon defaults (theme-aware colors used inside component)
const DARK = {
  accentSoft: "#C4A3E8",
  text: "#EDE8F5",
  textMuted: "#8B7FA8",
  error: "#D4607A",
  warning: "#D4A44C",
};



// ── SVG Icon Components ────────────────────────────────────────────────────

const BanIcon = ({ size = 40, color = DARK.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10"
      fill={color + "22"} stroke={color} strokeWidth={1.8} />
    <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const ClipboardIcon = ({ size = 15, color = DARK.text }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
    <Rect x="8" y="2" width="8" height="4" rx="1" ry="1"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="9" y1="12" x2="15" y2="12" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Line x1="9" y1="16" x2="13" y2="16" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const MailIcon = ({ size = 15, color = DARK.text }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
    <Polyline points="22 6 12 13 2 6"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const XCircleIcon = ({ size = 40, color = DARK.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10"
      fill={color + "22"} stroke={color} strokeWidth={1.8} />
    <Line x1="15" y1="9" x2="9" y2="15"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="9" y1="9" x2="15" y2="15"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClockIcon = ({ size = 40, color = DARK.warning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10"
      fill={color + "22"} stroke={color} strokeWidth={1.8} />
    <Polyline points="12 6 12 12 16 14"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldIcon = ({ size = 14, color = DARK.warning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SendIcon = ({ size = 14, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 2L15 22l-4-9-9-4 20-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LogOutIcon = ({ size = 14, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="16 17 21 12 16 7"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="21" y1="12" x2="9" y2="12"
      stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ExternalLinkIcon = ({ size = 14, color = DARK.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="15 3 21 3 21 9"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="10" y1="14" x2="21" y2="3"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ──────────────────────────────────────────────────────────────────────────

export default function BanScreen() {
  const { colors: COLORS } = useTheme();
  const { logout, user, updateUser } = useAuth();
  const spinner = useSpinner();

  const [violations, setViolations] = useState([]);
  const [appeal, setAppeal] = useState(null);
  const [appealText, setAppealText] = useState("");
  const [showAppealInput, setShowAppealInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appealStatus, setAppealStatus] = useState(user?.appealStatus || "none");

  useEffect(() => {
    loadFreshData();
  }, []);

  const loadFreshData = async () => {
    setLoading(true);
    try {
      const userRes = await api.get("/auth/refresh");
      const freshUser = userRes.data.user;
      updateUser(freshUser);

      const freshAppealStatus = freshUser.appealStatus || "none";
      setAppealStatus(freshAppealStatus);
      setViolations(freshUser.violations || []);

      if (freshAppealStatus === "reinstated") {
        await api.patch("/auth/clear-reinstated");
        updateUser({ ...freshUser, appealStatus: "none" });
        setAppealStatus("none");
      }

      if (freshAppealStatus === "under_review" || freshAppealStatus === "permanently_banned") {
        const appealRes = await api.get("/appeals/mine");
        setAppeal(appealRes.data.appeal);
      } else {
        setAppeal(null);
      }
    } catch (e) {
      console.log("BanScreen load error:", e?.message);
      setAppealStatus(user?.appealStatus || "none");
      setViolations(user?.violations || []);
      setAppeal(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAppeal = async () => {
    if (!appealText.trim()) {
      Alert.alert("Empty appeal", "Please write your appeal message.");
      return;
    }
    await spinner.withSpinner(async () => {
      try {
        const res = await api.post("/appeals", { message: appealText.trim() });
        setAppeal(res.data.appeal);
        setAppealStatus("under_review");
        updateUser({ appealStatus: "under_review" });
        setAppealText("");
        setShowAppealInput(false);
      } catch (error) {
        Alert.alert("Error", error.response?.data?.message || "Could not submit appeal.");
      }
    }, "Submitting appeal...");
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.error} />
      </View>
    );
  }

  const isPermanentlyBanned = appealStatus === "permanently_banned";
  const isUnderReview = appealStatus === "under_review";
  const canAppeal = appealStatus === "none" && !isPermanentlyBanned;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* Top accent bar */}
      <View style={styles.topBar} />

      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>H</Text>
        </View>
        <Text style={styles.logoLabel}>HushCircle</Text>
      </View>

      {/* Ban hero icon */}
      <View style={styles.banIconWrap}>
        <BanIcon size={40} color={COLORS.error} />
      </View>

      <Text style={styles.title}>Account Suspended</Text>
      <Text style={styles.subtitle}>
        Your account has been suspended for violating HushCircle's community guidelines.
      </Text>

      {/* Violations */}
      {violations.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <ClipboardIcon size={15} color={COLORS.text} />
            <Text style={styles.sectionTitle}>Confirmed violations</Text>
          </View>
          {violations.map((v, i) => (
            <View key={i} style={styles.violationItem}>
              <View style={styles.violationNum}>
                <Text style={styles.violationNumText}>{i + 1}</Text>
              </View>
              <View style={styles.violationInfo}>
                <Text style={styles.violationReason}>{v}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Guidelines reminder */}
      <View style={styles.guidelinesBox}>
        <View style={styles.guidelinesTitleRow}>
          <ShieldIcon size={14} color={COLORS.warning} />
          <Text style={styles.guidelinesTitle}>Our community guidelines</Text>
        </View>
        <Text style={styles.guidelinesText}>
          HushCircle is a safe space built on kindness and support. Accounts are
          suspended after 3 confirmed violations including bullying, harassment,
          harmful content, or spam.
        </Text>
      </View>

      {/* Appeal section */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <MailIcon size={15} color={COLORS.text} />
          <Text style={styles.sectionTitle}>Appeal your suspension</Text>
        </View>

        {/* ── PERMANENTLY BANNED ── */}
        {isPermanentlyBanned && (
          <View style={styles.appealRejectedBox}>
            <View style={styles.appealStatusIconWrap}>
              <XCircleIcon size={44} color={COLORS.error} />
            </View>
            <Text style={styles.appealRejectedTitle}>Appeal rejected</Text>
            <Text style={styles.appealRejectedText}>
              After careful review, your appeal has been rejected. This decision is final.
            </Text>
            {appeal?.reviewNote ? (
              <View style={styles.reviewNoteBox}>
                <Text style={styles.reviewNoteLabel}>Reason:</Text>
                <Text style={styles.reviewNoteText}>"{appeal.reviewNote}"</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.supportBtn}
              onPress={() => Linking.openURL("mailto:support@hushcircle.com")}
            >
              <View style={styles.supportBtnInner}>
                <ExternalLinkIcon size={14} color={COLORS.accentSoft} />
                <Text style={styles.supportBtnText}>Contact HushCircle Team</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── UNDER REVIEW ── */}
        {isUnderReview && (
          <View style={styles.appealPendingBox}>
            <View style={styles.appealStatusIconWrap}>
              <ClockIcon size={44} color={COLORS.warning} />
            </View>
            <Text style={styles.appealPendingTitle}>Appeal under review</Text>
            <Text style={styles.appealPendingText}>
              Your appeal is being reviewed by our moderation team. We will
              notify you of the outcome.
            </Text>
            {appeal?.message ? (
              <View style={styles.appealPreview}>
                <Text style={styles.appealPreviewLabel}>Your appeal:</Text>
                <Text style={styles.appealPreviewText}>"{appeal.message}"</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ── CAN APPEAL ── */}
        {canAppeal && !showAppealInput && (
          <>
            <Text style={styles.appealDesc}>
              If you believe your suspension was made in error, you may submit
              one appeal. Our team will review it and respond.
            </Text>
            <TouchableOpacity
              style={styles.appealBtn}
              onPress={() => setShowAppealInput(true)}
            >
              <View style={styles.appealBtnInner}>
                <MailIcon size={14} color="#fff" />
                <Text style={styles.appealBtnText}>Submit an appeal</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {canAppeal && showAppealInput && (
          <View style={styles.appealInputSection}>
            <Text style={styles.appealInputLabel}>
              Explain why you believe your suspension should be lifted:
            </Text>
            <TextInput
              style={styles.appealInput}
              placeholder="Write your appeal here... Be specific and honest."
              placeholderTextColor={COLORS.textMuted}
              value={appealText}
              onChangeText={setAppealText}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{appealText.length}/1000</Text>
            <View style={styles.appealActions}>
              <TouchableOpacity
                style={styles.cancelAppealBtn}
                onPress={() => { setShowAppealInput(false); setAppealText(""); }}
              >
                <Text style={styles.cancelAppealText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitAppealBtn, !appealText.trim() && { opacity: 0.4 }]}
                onPress={handleSubmitAppeal}
                disabled={!appealText.trim()}
              >
                <View style={styles.submitAppealBtnInner}>
                  <SendIcon size={13} color="#fff" />
                  <Text style={styles.submitAppealText}>Submit appeal</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.logoutBtnSecondary} onPress={logout}>
        <View style={styles.logoutBtnInner}>
          <LogOutIcon size={14} color={COLORS.textMuted} />
          <Text style={styles.logoutBtnSecondaryText}>Sign out</Text>
        </View>
      </TouchableOpacity>

      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
    </ScrollView>
  );
}

    const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F0A1E" },
    scroll: { padding: 20, paddingBottom: 60 },
    centered: { flex: 1, backgroundColor: "#0F0A1E", justifyContent: "center", alignItems: "center" },

    topBar: { height: 4, backgroundColor: "#D4607A", borderRadius: 2, marginBottom: 24 },

    logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 },
    logoWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#1A1330", borderWidth: 1.5,
    borderColor: "#D4607A" + "55",
    justifyContent: "center", alignItems: "center",
    },
    logoText: { color: "#D4607A", fontSize: 18, fontFamily: "DMSerifDisplay_400Regular" },
    logoLabel: { color: "#8B7FA8", fontFamily: "Nunito_600SemiBold", fontSize: 13 },

    banIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#D4607A" + "18",
    justifyContent: "center", alignItems: "center",
    alignSelf: "center", marginBottom: 20,
    },

    title: {
    color: "#D4607A", fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 28, textAlign: "center", marginBottom: 10,
    },
    subtitle: {
    color: "#8B7FA8", fontFamily: "Nunito_400Regular",
    fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 28,
    },

    section: {
    backgroundColor: "#1A1330", borderRadius: 16, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: "#2D2450",
    },
    sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
    sectionTitle: { color: "#EDE8F5", fontFamily: "Nunito_700Bold", fontSize: 14 },

    violationItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
    violationNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#D4607A" + "22",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#D4607A" + "44",
    },
    violationNumText: { color: "#D4607A", fontFamily: "Nunito_700Bold", fontSize: 13 },
    violationInfo: { flex: 1 },
    violationReason: { color: "#EDE8F5", fontFamily: "Nunito_500Medium", fontSize: 13, lineHeight: 20 },

    guidelinesBox: {
    backgroundColor: "#1A1330", borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: "#2D2450",
    borderLeftWidth: 3, borderLeftColor: "#D4A44C",
    },
    guidelinesTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
    guidelinesTitle: { color: "#D4A44C", fontFamily: "Nunito_700Bold", fontSize: 13 },
    guidelinesText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 21 },

    appealDesc: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 21, marginBottom: 14 },

    appealBtn: { backgroundColor: "#9B6FD4", borderRadius: 12, padding: 14, alignItems: "center" },
    appealBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
    appealBtnText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 },

    appealInputSection: { gap: 10 },
    appealInputLabel: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 13 },
    appealInput: {
    backgroundColor: "#0F0A1E", borderRadius: 12, borderWidth: 1,
    borderColor: "#2D2450", padding: 14, color: "#EDE8F5",
    fontFamily: "Nunito_400Regular", fontSize: 14, minHeight: 120,
    },
    charCount: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "right" },
    appealActions: { flexDirection: "row", gap: 10 },
    cancelAppealBtn: {
    flex: 1, padding: 13, borderRadius: 12,
    borderWidth: 1, borderColor: "#2D2450", alignItems: "center",
    },
    cancelAppealText: { color: "#8B7FA8", fontFamily: "Nunito_600SemiBold", fontSize: 14 },
    submitAppealBtn: { flex: 1, padding: 13, borderRadius: 12, backgroundColor: "#9B6FD4", alignItems: "center" },
    submitAppealBtnInner: { flexDirection: "row", alignItems: "center", gap: 7 },
    submitAppealText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 },

    // Pending / rejected shared
    appealStatusIconWrap: { marginBottom: 8 },

    appealPendingBox: { alignItems: "center", paddingVertical: 8, gap: 8 },
    appealPendingTitle: { color: "#D4A44C", fontFamily: "Nunito_700Bold", fontSize: 16 },
    appealPendingText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },

    appealPreview: {
    backgroundColor: "#0F0A1E", borderRadius: 10, padding: 12,
    width: "100%", borderWidth: 1, borderColor: "#2D2450",
    },
    appealPreviewLabel: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 11, marginBottom: 4 },
    appealPreviewText: { color: "#EDE8F5", fontFamily: "Nunito_400Regular", fontSize: 13, fontStyle: "italic", lineHeight: 20 },

    appealRejectedBox: { alignItems: "center", paddingVertical: 8, gap: 10 },
    appealRejectedTitle: { color: "#D4607A", fontFamily: "Nunito_700Bold", fontSize: 16 },
    appealRejectedText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },

    reviewNoteBox: {
    backgroundColor: "#0F0A1E", borderRadius: 10, padding: 12,
    width: "100%", borderWidth: 1, borderColor: "#D4607A" + "33",
    },
    reviewNoteLabel: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 11, marginBottom: 4 },
    reviewNoteText: { color: "#EDE8F5", fontFamily: "Nunito_400Regular", fontSize: 13, fontStyle: "italic" },

    supportBtn: {
    marginTop: 8, padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: "#2D2450", alignItems: "center",
    },
    supportBtnInner: { flexDirection: "row", alignItems: "center", gap: 7 },
    supportBtnText: { color: "#C4A3E8", fontFamily: "Nunito_600SemiBold", fontSize: 14 },

    logoutBtnSecondary: {
    borderWidth: 1, borderColor: "#2D2450", borderRadius: 12,
    padding: 14, alignItems: "center", marginTop: 8,
    },
    logoutBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
    logoutBtnSecondaryText: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 14 },
    });

