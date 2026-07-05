import { useState, useEffect, useRef } from "react";
import {
  View, Text, Modal,
  Animated, Pressable, ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import api from "../api/api";
import { useNetwork } from "../context/NetworkContext";
import { useTheme } from "../context/ThemeContext";
import OnlineDot from "./OnlineDot";

const AVATAR_COLORS = [
  "#9B6FD4", "#D4607A", "#6B9FD4",
  "#4CAF8F", "#D4A44C", "#E879F9",
];

const getAvatarColor = (pseudonym) =>
  AVATAR_COLORS[(pseudonym?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// ── SVG Icons — receive color as prop ────────────────────────────────────

const WifiOffIcon = ({ size = 44, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10.71 5.05A16 16 0 0 1 22.56 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="20" x2="12.01" y2="20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const FrownIcon   = ({ size = 44, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.8} />
    <Path d="M16 16s-1.5-2-4-2-4 2-4 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);
const RefreshIcon = ({ size = 14, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="23 4 23 10 17 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="1 20 1 14 7 14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const LockIcon    = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CalendarIcon = ({ size = 12, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8"  y1="2" x2="8"  y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="3"  y1="10" x2="21" y2="10" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const XIcon       = ({ size = 12, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6"  x2="6"  y2="18" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="6"  y1="6"  x2="18" y2="18" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ShieldIcon  = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "a long time ago";
  const s = Math.floor((new Date() - new Date(lastSeen)) / 1000);
  const m = Math.floor(s / 60), h = Math.floor(s / 3600), d = Math.floor(s / 86400);
  if (s < 30) return "just now";
  if (s < 60) return `${s} seconds ago`;
  if (m === 1) return "1 minute ago";
  if (m < 60) return `${m} minutes ago`;
  if (h === 1) return "1 hour ago";
  if (h < 24) return `${h} hours ago`;
  if (d === 1) return "yesterday";
  if (d < 7)  return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)} week${Math.floor(d / 7) > 1 ? "s" : ""} ago`;
  return new Date(lastSeen).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
};

const formatJoinDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const formatCount = (count) => {
  if (!count) return "0";
  if (count < 1000)  return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  return `${Math.floor(count / 1000)}k`;
};

// ── Component ─────────────────────────────────────────────────────────────

export default function UserProfileCard({ pseudonym, visible, onClose }) {
  const { colors: C } = useTheme();                     // ← live theme colors
  const { isConnected } = useNetwork();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [hasError, setHasError] = useState(false);
  const slideAnim   = useRef(new Animated.Value(0)).current;
  const avatarColor = getAvatarColor(pseudonym);

  const fetchUser = async () => {
    if (!isConnected) return;
    setLoading(true); setHasError(false);
    try {
      const res = await api.get(`/auth/user/${pseudonym}`);
      setUserData(res.data.user);
    } catch { setHasError(true); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (visible && pseudonym) {
      setUserData(null); setHasError(false); fetchUser();
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible, pseudonym]);

  if (!visible) return null;

  const noNetwork = !isConnected;

  // ── Reusable state wrapper ────────────────────────────────────────────────
  const StateWrap = ({ icon, title, message, onAction, actionLabel }) => (
    <View style={{ alignItems: "center", paddingVertical: 24, gap: 10 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center", marginBottom: 4 }}>
        {icon}
      </View>
      {title && <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 20 }}>{title}</Text>}
      <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 }}>{message}</Text>
      {onAction && (
        <TouchableOpacity style={{ backgroundColor: C.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, marginTop: 8 }} onPress={onAction}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <RefreshIcon size={13} color="#fff" />
            <Text style={{ color: "#fff", fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>{actionLabel || "Try again"}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 }} onPress={onClose}>
        <Animated.View
          style={{ backgroundColor: C.card, borderRadius: 24, padding: 20, width: "100%", maxWidth: 360, borderWidth: 1, borderColor: C.border, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 12, opacity: slideAnim, transform: [{ scale: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }, { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}
          onStartShouldSetResponder={() => true}
        >

          {noNetwork ? (
            <StateWrap icon={<WifiOffIcon size={36} color={C.textMuted} />} title="No connection" message="Turn on your internet to view this profile." onAction={() => { if (isConnected) fetchUser(); }} actionLabel="Refresh" />

          ) : loading ? (
            <View style={{ alignItems: "center", paddingVertical: 24, gap: 10 }}>
              <ActivityIndicator color={C.accent} size="large" />
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13 }}>Loading profile...</Text>
            </View>

          ) : hasError ? (
            <StateWrap icon={<FrownIcon size={36} color={C.textMuted} />} title="Could not load" message="Something went wrong loading this profile." onAction={fetchUser} />

          ) : userData ? (
            <>
              {/* Header */}
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                <View style={{ position: "relative" }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", borderWidth: 2, backgroundColor: avatarColor + "33", borderColor: avatarColor }}>
                    <Text style={{ fontSize: 28, fontFamily: "DMSerifDisplay_400Regular", color: avatarColor }}>{pseudonym?.[0]?.toUpperCase()}</Text>
                  </View>
                  {userData.showOnlineStatus && (
                    <OnlineDot isOnline={userData.isOnline} showOnlineStatus={userData.showOnlineStatus} size={16} borderColor={C.card} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 5 }}>{userData.pseudonym}</Text>

                  {/* Online status */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    {userData.showOnlineStatus ? (
                      <>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: userData.isOnline ? C.success : C.error }} />
                        <Text style={{ fontFamily: "Nunito_500Medium", fontSize: 13, color: userData.isOnline ? C.success : C.textMuted }}>
                          {userData.isOnline ? "Online now" : `Last seen ${formatLastSeen(userData.lastSeen)}`}
                        </Text>
                      </>
                    ) : (
                      <>
                        <LockIcon size={12} color={C.textMuted} />
                        <Text style={{ fontFamily: "Nunito_500Medium", fontSize: 13, color: C.textMuted }}>Online status hidden</Text>
                      </>
                    )}
                  </View>

                  {/* Joined */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <CalendarIcon size={11} color={C.textMuted} />
                    <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11 }}>Joined {formatJoinDate(userData.joinedAt)}</Text>
                  </View>
                </View>

                {/* Close */}
                <TouchableOpacity style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.inputBg, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.border }} onPress={onClose}>
                  <XIcon size={11} color={C.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={{ height: 1, backgroundColor: C.border, marginVertical: 14 }} />

              {/* Stats */}
              <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center" }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 28, marginBottom: 2, color: C.accent }}>{formatCount(userData.totalPosts)}</Text>
                  <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>Stories</Text>
                </View>
                <View style={{ width: 1, height: 40, backgroundColor: C.border }} />
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 28, marginBottom: 2, color: "#D4607A" }}>{formatCount(userData.totalReactions)}</Text>
                  <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>Hearts received</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: C.border, marginVertical: 14 }} />

              {/* Anon note */}
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: C.inputBg, borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <ShieldIcon size={14} color={C.accentSoft} />
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 18, flex: 1 }}>
                  This is an anonymous identity. No personal information is shared on HushCircle.
                </Text>
              </View>

              {/* Active status card */}
              {userData.showOnlineStatus ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, padding: 12, borderWidth: 1, backgroundColor: C.inputBg, borderColor: userData.isOnline ? C.success + "44" : C.border }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: userData.isOnline ? C.success : C.error }} />
                  <Text style={{ fontFamily: "Nunito_500Medium", fontSize: 13, flex: 1, color: userData.isOnline ? C.success : C.textMuted }}>
                    {userData.isOnline ? "Currently active on HushCircle" : userData.lastSeen ? `Was active ${formatLastSeen(userData.lastSeen)}` : "Has not been active recently"}
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, padding: 12, borderWidth: 1, backgroundColor: C.inputBg, borderColor: C.border }}>
                  <LockIcon size={14} color={C.textMuted} />
                  <Text style={{ fontFamily: "Nunito_500Medium", fontSize: 13, flex: 1, color: C.textMuted }}>This user has hidden their online status</Text>
                </View>
              )}
            </>
          ) : null}

        </Animated.View>
      </Pressable>
    </Modal>
  );
}