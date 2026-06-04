import { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Modal,
  Animated, Pressable, ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import api from "../api/api";
import { useNetwork } from "../context/NetworkContext";
import OnlineDot from "./OnlineDot";import { useTheme } from "../context/ThemeContext";

// Module-level color fallbacks for icon defaults (theme-aware colors used inside component)
const DARK = {
  accentSoft: "#C4A3E8",
  textMuted: "#8B7FA8",
};



const AVATAR_COLORS = [
  "#9B6FD4", "#D4607A", "#6B9FD4",
  "#4CAF8F", "#D4A44C", "#E879F9",
];

const getAvatarColor = (pseudonym) =>
  AVATAR_COLORS[(pseudonym?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// ── SVG Icon Components ────────────────────────────────────────────────────

const WifiOffIcon = ({ size = 44, color = DARK.textMuted }) => (
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

const FrownIcon = ({ size = 44, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
    <Path d="M16 16s-1.5-2-4-2-4 2-4 2"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9"
      stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9"
      stroke={color} strokeWidth={2.5} strokeLinecap="round" />
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

const LockIcon = ({ size = 14, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CalendarIcon = ({ size = 12, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="2" x2="16" y2="6"
      stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8" y1="2" x2="8" y2="6"
      stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="3" y1="10" x2="21" y2="10"
      stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const XIcon = ({ size = 12, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18"
      stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="6" y1="6" x2="18" y2="18"
      stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldIcon = ({ size = 14, color = DARK.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ──────────────────────────────────────────────────────────────────────────

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "a long time ago";
  const now = new Date();
  const seen = new Date(lastSeen);
  const seconds = Math.floor((now - seen) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(seconds / 86400);
  if (seconds < 30) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  return seen.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
};

const formatJoinDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const formatCount = (count) => {
  if (!count) return "0";
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  return `${Math.floor(count / 1000)}k`;
};

// ──────────────────────────────────────────────────────────────────────────

export default function UserProfileCard({ pseudonym, visible, onClose }) {
  const { colors: COLORS } = useTheme();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const avatarColor = getAvatarColor(pseudonym);
  const { isConnected } = useNetwork();

  const fetchUser = async () => {
    if (!isConnected) return;
    setLoading(true);
    setHasError(false);
    try {
      const res = await api.get(`/auth/user/${pseudonym}`);
      setUserData(res.data.user);
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && pseudonym) {
      setUserData(null);
      setHasError(false);
      fetchUser();
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, pseudonym]);

  if (!visible) return null;

  const noNetwork = !isConnected;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[styles.card, {
            opacity: slideAnim,
            transform: [
              { scale: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
              { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
            ],
          }]}
          onStartShouldSetResponder={() => true}
        >

          {/* ── No network ── */}
          {noNetwork ? (
            <View style={styles.stateWrap}>
              <View style={styles.stateIconWrap}>
                <WifiOffIcon size={36} color={COLORS.textMuted} />
              </View>
              <Text style={styles.stateTitle}>No connection</Text>
              <Text style={styles.stateMessage}>
                Turn on your internet to view this profile.
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => { if (isConnected) fetchUser(); }}
              >
                <View style={styles.retryBtnInner}>
                  <RefreshIcon size={13} color="#fff" />
                  <Text style={styles.retryBtnText}>Refresh</Text>
                </View>
              </TouchableOpacity>
            </View>

          ) : loading ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator color={COLORS.accent} size="large" />
              <Text style={styles.stateMessage}>Loading profile...</Text>
            </View>

          ) : hasError ? (
            <View style={styles.stateWrap}>
              <View style={styles.stateIconWrap}>
                <FrownIcon size={36} color={COLORS.textMuted} />
              </View>
              <Text style={styles.stateTitle}>Could not load</Text>
              <Text style={styles.stateMessage}>Something went wrong loading this profile.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchUser}>
                <View style={styles.retryBtnInner}>
                  <RefreshIcon size={13} color="#fff" />
                  <Text style={styles.retryBtnText}>Try again</Text>
                </View>
              </TouchableOpacity>
            </View>

          ) : userData ? (
            <>
              {/* ── Header ── */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarWrap}>
                  <View style={[styles.avatar, { backgroundColor: avatarColor + "33", borderColor: avatarColor }]}>
                    <Text style={[styles.avatarText, { color: avatarColor }]}>
                      {pseudonym?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                  {userData.showOnlineStatus && (
                    <OnlineDot
                      isOnline={userData.isOnline}
                      showOnlineStatus={userData.showOnlineStatus}
                      size={16}
                      borderColor={COLORS.card}
                    />
                  )}
                </View>

                <View style={styles.headerInfo}>
                  <Text style={styles.pseudonymText}>{userData.pseudonym}</Text>

                  {/* Online status row */}
                  <View style={styles.statusRow}>
                    {userData.showOnlineStatus ? (
                      <>
                        <View style={[styles.statusDot, { backgroundColor: userData.isOnline ? COLORS.online : COLORS.offline }]} />
                        <Text style={[styles.statusText, { color: userData.isOnline ? COLORS.online : COLORS.textMuted }]}>
                          {userData.isOnline ? "Online now" : `Last seen ${formatLastSeen(userData.lastSeen)}`}
                        </Text>
                      </>
                    ) : (
                      <>
                        <LockIcon size={12} color={COLORS.textMuted} />
                        <Text style={[styles.statusText, { color: COLORS.textMuted }]}>
                          Online status hidden
                        </Text>
                      </>
                    )}
                  </View>

                  {/* Joined row */}
                  <View style={styles.joinedRow}>
                    <CalendarIcon size={11} color={COLORS.textMuted} />
                    <Text style={styles.joinedText}>Joined {formatJoinDate(userData.joinedAt)}</Text>
                  </View>
                </View>

                {/* Close button */}
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <XIcon size={11} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* ── Stats ── */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: COLORS.accent }]}>
                    {formatCount(userData.totalPosts)}
                  </Text>
                  <Text style={styles.statLabel}>Stories</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: "#D4607A" }]}>
                    {formatCount(userData.totalReactions)}
                  </Text>
                  <Text style={styles.statLabel}>Hearts received</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* ── Anonymous note ── */}
              <View style={styles.anonNote}>
                <ShieldIcon size={14} color={COLORS.accentSoft} />
                <Text style={styles.anonNoteText}>
                  This is an anonymous identity. No personal information is shared on HushCircle.
                </Text>
              </View>

              {/* ── Active status card ── */}
              {userData.showOnlineStatus ? (
                <View style={[styles.activeCard, { borderColor: userData.isOnline ? COLORS.online + "44" : COLORS.border }]}>
                  <View style={[styles.activeDot, { backgroundColor: userData.isOnline ? COLORS.online : COLORS.offline }]} />
                  <Text style={[styles.activeText, { color: userData.isOnline ? COLORS.online : COLORS.textMuted }]}>
                    {userData.isOnline
                      ? "Currently active on HushCircle"
                      : userData.lastSeen
                        ? `Was active ${formatLastSeen(userData.lastSeen)}`
                        : "Has not been active recently"}
                  </Text>
                </View>
              ) : (
                <View style={[styles.activeCard, { borderColor: COLORS.border }]}>
                  <LockIcon size={14} color={COLORS.textMuted} />
                  <Text style={[styles.activeText, { color: COLORS.textMuted }]}>
                    This user has hidden their online status
                  </Text>
                </View>
              )}
            </>
          ) : null}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}


  const styles = StyleSheet.create({

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 },

  card: { backgroundColor: "#1A1330", borderRadius: 24, padding: 20, width: "100%", maxWidth: 360, borderWidth: 1, borderColor: "#2D2450", shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 },


  // State screens (no network / error / loading)

  stateWrap: { alignItems: "center", paddingVertical: 24, gap: 10 },

  stateIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#0F0A1E", borderWidth: 1, borderColor: "#2D2450", justifyContent: "center", alignItems: "center", marginBottom: 4 },

  stateTitle: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 20 },

  stateMessage: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },

  retryBtn: { backgroundColor: "#9B6FD4", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, marginTop: 8 },

  retryBtnInner: { flexDirection: "row", alignItems: "center", gap: 7 },

  retryBtnText: { color: "#fff", fontFamily: "Nunito_600SemiBold", fontSize: 14 },


  // Card header

  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 16 },

  avatarWrap: { position: "relative" },

  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", borderWidth: 2 },

  avatarText: { fontSize: 28, fontFamily: "DMSerifDisplay_400Regular" },

  headerInfo: { flex: 1 },

  pseudonymText: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 5 },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },

  statusDot: { width: 8, height: 8, borderRadius: 4 },

  statusText: { fontFamily: "Nunito_500Medium", fontSize: 13 },

  joinedRow: { flexDirection: "row", alignItems: "center", gap: 5 },

  joinedText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 11 },


  // Close button

  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#0F0A1E", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#2D2450" },


  divider: { height: 1, backgroundColor: "#2D2450", marginVertical: 14 },


  // Stats

  statsRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },

  statItem: { alignItems: "center" },

  statNumber: { fontFamily: "DMSerifDisplay_400Regular", fontSize: 28, marginBottom: 2 },

  statLabel: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 12 },

  statDivider: { width: 1, height: 40, backgroundColor: "#2D2450" },


  // Anon note

  anonNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#0F0A1E", borderRadius: 12, padding: 12, marginBottom: 12 },

  anonNoteText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 18, flex: 1 },


  // Active card

  activeCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, padding: 12, borderWidth: 1, backgroundColor: "#0F0A1E" },

  activeDot: { width: 10, height: 10, borderRadius: 5 },

  activeText: { fontFamily: "Nunito_500Medium", fontSize: 13, flex: 1 },

  });

