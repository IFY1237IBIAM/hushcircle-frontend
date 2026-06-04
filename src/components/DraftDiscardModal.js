import { useRef, useEffect } from "react";
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, Animated, Pressable,
} from "react-native";import { useTheme } from "../context/ThemeContext";



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
          <Text style={styles.emoji}>{isSaveMode ? "📝" : "🗑️"}</Text>

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
                <Text style={styles.actionBtnText}>Save 💜</Text>
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

  emoji: { fontSize: 44, marginBottom: 12 },

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

  },

  actionBtnText: {

  color: "#fff",

  fontFamily: "Nunito_600SemiBold",

  fontSize: 14,

  },

  });

