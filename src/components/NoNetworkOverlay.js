import { useRef, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";import { useTheme } from "../context/ThemeContext";

// Module-level color fallbacks for icon defaults (theme-aware colors used inside component)
const DARK = {
  textMuted: "#8B7FA8",
};



// ── SVG Icon Components ────────────────────────────────────────────────────

const WifiOffIcon = ({ size = 38, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="1" y1="1" x2="23" y2="23"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10.71 5.05A16 16 0 0 1 22.56 9"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8.53 16.11a6 6 0 0 1 6.95 0"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="20" x2="12.01" y2="20"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const SignalIcon = ({ size = 38, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1.42 9a16 16 0 0 1 21.16 0"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 12.55a11 11 0 0 1 14.08 0"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8.53 16.11a6 6 0 0 1 6.95 0"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="20" x2="12.01" y2="20"
      stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

const MessageIcon = ({ size = 38, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ReplyIcon = ({ size = 38, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="9 17 4 12 9 7"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20 18v-2a4 4 0 0 0-4-4H4"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartIcon = ({ size = 38, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UserIcon = ({ size = 38, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="7" r="4"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BellIcon = ({ size = 38, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BookmarkIcon = ({ size = 38, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Badge icon — small version for the noWifiBadge
const WifiOffSmallIcon = ({ size = 13, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="1" y1="1" x2="23" y2="23"
      stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8.53 16.11a6 6 0 0 1 6.95 0"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="20" x2="12.01" y2="20"
      stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const RefreshIcon = ({ size = 14, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="23 4 23 10 17 10"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="1 20 1 14 7 14"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── ACTION_CONFIG — Icon component instead of emoji ────────────────────────

const ACTION_CONFIG = {
  signup:        { Icon: WifiOffIcon,  title: "No connection",            message: "You need internet to create your account. Please check your connection and try again." },
  login:         { Icon: WifiOffIcon,  title: "No connection",            message: "You need internet to sign in. Please check your connection and try again." },
  feed:          { Icon: SignalIcon,   title: "Can't load stories",       message: "Check your internet connection to see stories from the HushCircle community." },
  post:          { Icon: WifiOffIcon,  title: "Can't share your post",    message: "You need internet to share your story. Your words are saved — try again when connected." },
  comment:       { Icon: MessageIcon,  title: "Can't send comment",       message: "You need internet to comment. Please check your connection and try again." },
  reply:         { Icon: ReplyIcon,    title: "Can't send reply",         message: "You need internet to reply. Please check your connection and try again." },
  reaction:      { Icon: HeartIcon,    title: "Can't react",              message: "You need internet to react to posts. Please check your connection." },
  profile:       { Icon: UserIcon,     title: "Can't load profile",       message: "You need internet to view this profile. Please check your connection." },
  notifications: { Icon: BellIcon,    title: "Can't load notifications",  message: "You need internet to see your notifications. Please check your connection." },
  save:          { Icon: BookmarkIcon, title: "Can't save post",          message: "You need internet to save posts. Please check your connection." },
  default:       { Icon: WifiOffIcon,  title: "No connection",            message: "You need internet to do this. Please check your connection and try again." },
};

// ──────────────────────────────────────────────────────────────────────────

export default function NoNetworkOverlay({ visible, onClose, onRetry, action = "default" }) {
  const { colors: COLORS } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const config = ACTION_CONFIG[action] || ACTION_CONFIG.default;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>

          {/* Context icon */}
          <View style={styles.iconWrap}>
            <config.Icon size={38} color={COLORS.textMuted} />
          </View>

          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.message}>{config.message}</Text>

          {/* No-wifi badge */}
          <View style={styles.noWifiBadge}>
            <WifiOffSmallIcon size={12} color={COLORS.textMuted} />
            <Text style={styles.noWifiText}>No internet · Check your connection</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {onClose && (
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>Dismiss</Text>
              </TouchableOpacity>
            )}
            {onRetry && (
              <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
                <View style={styles.retryBtnInner}>
                  <RefreshIcon size={13} color="#fff" />
                  <Text style={styles.retryBtnText}>Try again</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}


  const styles = StyleSheet.create({

  overlay: { flex: 1, backgroundColor: "#0F0A1E", justifyContent: "center", alignItems: "center", padding: 24 },

  card: { backgroundColor: "#1A1330", borderRadius: 28, padding: 28, width: "100%", maxWidth: 340, alignItems: "center", borderWidth: 1, borderColor: "#2D2450" },


  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#2D2450", justifyContent: "center", alignItems: "center", marginBottom: 16 },


  title: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 24, marginBottom: 10, textAlign: "center" },

  message: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 16 },


  noWifiBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#2D2450", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 22 },

  noWifiText: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 12 },


  actions: { flexDirection: "row", gap: 10, width: "100%" },

  closeBtn: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#2D2450", alignItems: "center" },

  closeBtnText: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 14 },

  retryBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: "#9B6FD4", alignItems: "center" },

  retryBtnInner: { flexDirection: "row", alignItems: "center", gap: 7 },

  retryBtnText: { color: "#fff", fontFamily: "Nunito_600SemiBold", fontSize: 14 },

  });

