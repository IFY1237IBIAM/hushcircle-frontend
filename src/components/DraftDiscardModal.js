import { useRef, useEffect } from "react";
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, Animated, Pressable,
} from "react-native";
import Svg, { Path, Polyline, Line, Rect } from "react-native-svg";
import { useTheme } from "../context/ThemeContext";

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const EditIcon = ({ size = 44, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      fill={color + "22"} stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TrashIcon = ({ size = 44, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
      fill={color + "18"} stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
      stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartSmallIcon = ({ size = 13, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={color + "55"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ──────────────────────────────────────────────────────────────────────────────

/**
 * DraftDiscardModal
 *
 * mode="discard"  → "Discard post?" — Leave / Cancel
 * mode="save"     → "Save for later?" — Save / Leave / Cancel
 */
export default function DraftDiscardModal({
  visible,
  mode = "discard",
  onSave,
  onLeave,
  onCancel,
}) {
  const { colors: COLORS } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(anim, {
        toValue: 1, useNativeDriver: true, tension: 80, friction: 8,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0, duration: 150, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const modalStyle = {
    opacity: anim,
    transform: [
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) },
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
    ],
  };

  const isSaveMode = mode === "save";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Animated.View style={[styles.sheet, modalStyle]} onStartShouldSetResponder={() => true}>

          {/* Hero icon */}
          <View style={styles.iconWrap}>
            {isSaveMode
              ? <EditIcon size={36} color="#9B6FD4" />
              : <TrashIcon size={36} color="#D4607A" />
            }
          </View>

          <Text style={styles.title}>
            {isSaveMode ? "Save for later?" : "Discard post?"}
          </Text>

          <Text style={styles.message}>
            {isSaveMode
              ? "Your thought isn't posted yet. Save it to finish later?"
              : "You have an unfinished post. Do you want to leave and discard it?"}
          </Text>

          <View style={styles.actions}>
            {/* Cancel — always present */}
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            {/* Leave — always present */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.error }]}
              onPress={onLeave}
            >
              <Text style={styles.actionBtnText}>Leave</Text>
            </TouchableOpacity>

            {/* Save — only in save mode */}
            {isSaveMode && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.accent }]}
                onPress={onSave}
              >
                <View style={styles.saveBtnInner}>
                  <HeartSmallIcon size={12} color="#fff" />
                  <Text style={styles.actionBtnText}>Save</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
    padding: 16,
    paddingBottom: 32,
  },
  sheet: {
    backgroundColor: "#1A1330",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2D2450",
    alignItems: "center",
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#2D2450",
    justifyContent: "center", alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#EDE8F5",
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 22,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    color: "#8B7FA8",
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    justifyContent: "center",
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2D2450",
    alignItems: "center",
  },
  cancelText: {
    color: "#EDE8F5",
    fontFamily: "Nunito_500Medium",
    fontSize: 14,
  },
  actionBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtnText: {
    color: "#fff",
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
  },
});