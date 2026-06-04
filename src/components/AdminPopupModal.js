import { useEffect, useRef, useState } from "react";
import {
  Modal, View, Text, StyleSheet,
  TouchableOpacity, Animated, ScrollView,
} from "react-native";
import api from "../api/api";import { useTheme } from "../context/ThemeContext";



export default function AdminPopupModal({ visible, popup, onDismiss }) {
  const { colors: COLORS } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 70,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = async () => {
    if (dismissing || !popup) return;
    setDismissing(true);
    try {
      await api.put(`/notifications/popup/${popup._id}/read`);
    } catch (e) {}
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setDismissing(false);
      onDismiss();
    });
  };

  if (!visible || !popup) return null;

  const isBan = popup.isBanNotification;
  const isUnban = popup.isUnban;
  const violationCount = popup.violationCount || 0;

  const accentColor = isUnban
    ? COLORS.success
    : isBan
    ? COLORS.error
    : COLORS.warning;

  const emoji = isUnban ? "💜" : isBan ? "🚫" : "⚠️";
  const title = isUnban
    ? "Account Reinstated"
    : isBan
    ? "Account Suspended"
    : "Post Removed";

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.card, {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
            borderColor: accentColor + "44",
          }]}
        >
          {/* Top accent bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo + emoji */}
            <View style={styles.logoRow}>
              <View style={[styles.logoWrap, { borderColor: accentColor + "44" }]}>
                <Text style={[styles.logoText, { color: accentColor }]}>W</Text>
              </View>
              <Text style={styles.logoLabel}>HushCircle Team</Text>
            </View>

            {/* Main emoji */}
            <View style={[styles.emojiWrap, { backgroundColor: accentColor + "18" }]}>
              <Text style={styles.mainEmoji}>{emoji}</Text>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: accentColor }]}>{title}</Text>

            {/* Admin message */}
            <Text style={styles.message}>{popup.adminMessage}</Text>

            {/* Reason box */}
            {popup.adminReason && (
              <View style={[styles.reasonBox, { borderColor: accentColor + "33" }]}>
                <Text style={[styles.reasonLabel, { color: accentColor }]}>
                  📋 Reason
                </Text>
                <Text style={styles.reasonText}>{popup.adminReason}</Text>
              </View>
            )}

            {/* Post preview */}
            {popup.postPreview && (
              <View style={styles.postPreviewBox}>
                <Text style={styles.postPreviewLabel}>Affected post</Text>
                <Text style={styles.postPreviewText} numberOfLines={3}>
                  "{popup.postPreview}..."
                </Text>
              </View>
            )}

            {/* Violation counter — only for non-ban, non-unban */}
            {!isBan && !isUnban && violationCount > 0 && (
              <View style={styles.violationRow}>
                {[1, 2, 3].map((num) => (
                  <View
                    key={num}
                    style={[
                      styles.violationDot,
                      num <= violationCount
                        ? { backgroundColor: num === 3 ? COLORS.error : COLORS.warning }
                        : { backgroundColor: COLORS.border },
                    ]}
                  >
                    <Text style={styles.violationDotNum}>{num}</Text>
                  </View>
                ))}
                <Text style={styles.violationLabel}>
                  Violation {violationCount} of 3
                </Text>
              </View>
            )}

            {/* Next step */}
            {popup.nextStep && (
              <View style={[styles.nextStepBox, { backgroundColor: accentColor + "0D" }]}>
                <Text style={[styles.nextStepTitle, { color: accentColor }]}>
                  {isUnban ? "💜 What happens now" : "ℹ️ What happens next"}
                </Text>
                <Text style={styles.nextStepText}>{popup.nextStep}</Text>
              </View>
            )}

            {/* Guidelines reminder — only for violations */}
            {!isUnban && (
              <View style={styles.guidelinesBox}>
                <Text style={styles.guidelinesText}>
                  📖 Our community guidelines exist to keep HushCircle a safe healing space for everyone. Thank you for understanding.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* CTA button */}
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: accentColor }]}
            onPress={handleDismiss}
            disabled={dismissing}
          >
            <Text style={styles.ctaBtnText}>
              {isUnban
                ? "Welcome back 💜"
                : isBan
                ? "I understand"
                : "I'll follow the guidelines 💜"}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>
            This message is from the HushCircle moderation team
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}


  const styles = StyleSheet.create({

  overlay: {

  flex: 1,

  backgroundColor: "rgba(0,0,0,0.82)",

  justifyContent: "center",

  alignItems: "center",

  padding: 20,

  },

  card: {

  backgroundColor: "#1A1330",

  borderRadius: 24,

  width: "100%",

  maxWidth: 380,

  borderWidth: 1,

  overflow: "hidden",

  maxHeight: "90%",

  shadowColor: "#000",

  shadowOffset: { width: 0, height: 12 },

  shadowOpacity: 0.5,

  shadowRadius: 24,

  elevation: 12,

  },

  accentBar: { height: 4, width: "100%" },

  scrollContent: { padding: 24, paddingTop: 20 },

  logoRow: {

  flexDirection: "row",

  alignItems: "center",

  gap: 10,

  marginBottom: 20,

  },

  logoWrap: {

  width: 36,

  height: 36,

  borderRadius: 18,

  backgroundColor: "#0F0A1E",

  borderWidth: 1.5,

  justifyContent: "center",

  alignItems: "center",

  },

  logoText: {

  fontSize: 18,

  fontFamily: "DMSerifDisplay_400Regular",

  letterSpacing: 0.5,

  },

  logoLabel: {

  color: "#8B7FA8",

  fontFamily: "Nunito_600SemiBold",

  fontSize: 13,

  },

  emojiWrap: {

  width: 72,

  height: 72,

  borderRadius: 36,

  justifyContent: "center",

  alignItems: "center",

  alignSelf: "center",

  marginBottom: 16,

  },

  mainEmoji: { fontSize: 36 },

  title: {

  fontFamily: "DMSerifDisplay_400Regular",

  fontSize: 26,

  textAlign: "center",

  marginBottom: 10,

  },

  message: {

  color: "#EDE8F5",

  fontFamily: "Nunito_400Regular",

  fontSize: 15,

  textAlign: "center",

  lineHeight: 24,

  marginBottom: 16,

  },

  reasonBox: {

  backgroundColor: "#0F0A1E",

  borderRadius: 14,

  padding: 14,

  borderWidth: 1,

  marginBottom: 12,

  },

  reasonLabel: {

  fontFamily: "Nunito_700Bold",

  fontSize: 12,

  marginBottom: 6,

  letterSpacing: 0.3,

  },

  reasonText: {

  color: "#EDE8F5",

  fontFamily: "Nunito_400Regular",

  fontSize: 14,

  lineHeight: 22,

  },

  postPreviewBox: {

  backgroundColor: "#0F0A1E",

  borderRadius: 12,

  padding: 12,

  marginBottom: 12,

  borderLeftWidth: 3,

  borderLeftColor: "#2D2450",

  },

  postPreviewLabel: {

  color: "#8B7FA8",

  fontFamily: "Nunito_600SemiBold",

  fontSize: 11,

  marginBottom: 4,

  letterSpacing: 0.3,

  },

  postPreviewText: {

  color: "#8B7FA8",

  fontFamily: "Nunito_400Regular",

  fontSize: 13,

  lineHeight: 20,

  fontStyle: "italic",

  },

  violationRow: {

  flexDirection: "row",

  alignItems: "center",

  gap: 8,

  marginBottom: 14,

  backgroundColor: "#0F0A1E",

  borderRadius: 12,

  padding: 12,

  },

  violationDot: {

  width: 28,

  height: 28,

  borderRadius: 14,

  justifyContent: "center",

  alignItems: "center",

  },

  violationDotNum: {

  color: "#fff",

  fontFamily: "Nunito_700Bold",

  fontSize: 12,

  },

  violationLabel: {

  color: "#8B7FA8",

  fontFamily: "Nunito_500Medium",

  fontSize: 12,

  flex: 1,

  },

  nextStepBox: {

  borderRadius: 14,

  padding: 14,

  marginBottom: 12,

  },

  nextStepTitle: {

  fontFamily: "Nunito_700Bold",

  fontSize: 13,

  marginBottom: 6,

  },

  nextStepText: {

  color: "#8B7FA8",

  fontFamily: "Nunito_400Regular",

  fontSize: 13,

  lineHeight: 21,

  },

  guidelinesBox: {

  backgroundColor: "#0F0A1E",

  borderRadius: 12,

  padding: 12,

  marginBottom: 4,

  },

  guidelinesText: {

  color: "#8B7FA8",

  fontFamily: "Nunito_400Regular",

  fontSize: 12,

  lineHeight: 18,

  textAlign: "center",

  },

  ctaBtn: {

  margin: 16,

  marginTop: 4,

  borderRadius: 14,

  padding: 16,

  alignItems: "center",

  },

  ctaBtnText: {

  color: "#fff",

  fontFamily: "Nunito_700Bold",

  fontSize: 15,

  },

  footer: {

  color: "#8B7FA8",

  fontFamily: "Nunito_400Regular",

  fontSize: 11,

  textAlign: "center",

  paddingBottom: 16,

  opacity: 0.7,

  },

  });

