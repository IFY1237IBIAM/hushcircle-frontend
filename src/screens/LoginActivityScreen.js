/**
 * screens/LoginActivityScreen.js
 *
 * Shows the user's login history — device, location, time, method.
 * Like Google's "Your devices" or Facebook's "Where you're logged in".
 *
 * Features:
 *   - Current session highlighted with green badge
 *   - Device name, OS, location (city + country + flag)
 *   - Sign-in method badge (Password, Passkey, Password + 2FA)
 *   - Relative time ("2 hours ago", "Yesterday", etc.)
 *   - Revoke individual sessions
 *   - "Sign out all other sessions" button
 *   - Pull to refresh
 */

import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTheme }    from "../context/ThemeContext";
import { useNetwork }  from "../context/NetworkContext";
import HushCircleSpinner from "../components/HushCircleSpinner";
import NoNetworkOverlay  from "../components/NoNetworkOverlay";
import useSpinner        from "../hooks/useSpinner";
import api               from "../api/api";

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const BackIcon = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="15 18 9 12 15 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const KeyIcon = ({ size = 12, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LockShieldIcon = ({ size = 12, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="16" r="1" fill={color} />
  </Svg>
);

const LockIcon = ({ size = 12, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LockBigIcon = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const AppleIcon = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16.5 1c.1 1.2-.4 2.4-1.1 3.2-.7.9-1.9 1.6-3 1.5-.1-1.1.4-2.3 1.1-3.1.8-.9 2.1-1.5 3-1.6z"
      fill={color} />
    <Path d="M20.7 17.2c-.6 1.3-.9 1.9-1.6 3-1.1 1.6-2.5 3.5-4.3 3.5-1.6 0-2-1-4.2-1s-2.6 1-4.2 1c-1.8 0-3.2-1.8-4.3-3.4C-.1 16.6-.3 11.1 2.2 8.2c1.2-1.4 3-2.3 4.7-2.3 1.7 0 2.8 1 4.2 1 1.4 0 2.2-1 4.2-1 1.5 0 3.1.8 4.3 2.2-3.7 2-3.1 7.4 1.1 9.1z"
      fill={color} />
  </Svg>
);

const AndroidIcon = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 18c0 .55.45 1 1 1h1v3.5a1.5 1.5 0 0 0 3 0V19h2v3.5a1.5 1.5 0 0 0 3 0V19h1c.55 0 1-.45 1-1V8H6v10z"
      fill={color} />
    <Path d="M3.5 8A1.5 1.5 0 0 0 2 9.5v7a1.5 1.5 0 0 0 3 0v-7A1.5 1.5 0 0 0 3.5 8z" fill={color} />
    <Path d="M20.5 8A1.5 1.5 0 0 0 19 9.5v7a1.5 1.5 0 0 0 3 0v-7A1.5 1.5 0 0 0 20.5 8z" fill={color} />
    <Path d="M15.53 2.16l1.3-1.3a.5.5 0 0 0-.7-.71l-1.47 1.46a5.93 5.93 0 0 0-4.92 0L8.27.15a.5.5 0 1 0-.7.7l1.3 1.31A6 6 0 0 0 6 7h12a6 6 0 0 0-2.47-4.84zM9.5 5a.75.75 0 1 1 0-1.5A.75.75 0 0 1 9.5 5zm5 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z"
      fill={color} />
  </Svg>
);

const WindowsIcon = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 5.5L10 4.5V11.4H3V5.5zM11 4.3L21 3V11.3H11V4.3zM3 12.4H10V19.3L3 18.3V12.4zM11 12.4H21V20.6L11 19.3V12.4z"
      fill={color} />
  </Svg>
);

const LaptopIcon = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="4" width="16" height="11" rx="1" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 19h20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const PhoneIcon = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="2" width="12" height="20" rx="2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="18" x2="12.01" y2="18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const ChevronUpIcon = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="18 15 12 9 6 15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDownIcon = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="6 9 12 15 18 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldIcon = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      fill={color + "22"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DoorOutIcon = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ClipboardEmptyIcon = ({ size = 36, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
      stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="8" y="2" width="8" height="4" rx="1" ry="1"
      stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now   = Date.now();
  const then  = new Date(dateStr).getTime();
  const diff  = now - then;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days === 1) return "Yesterday";
  if (days < 7)   return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fullDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString(undefined, {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function methodInfo(method) {
  switch (method) {
    case "passkey":      return { label: "Passkey",        Icon: KeyIcon };
    case "password+2fa": return { label: "Password + 2FA", Icon: LockShieldIcon };
    default:             return { label: "Password",       Icon: LockIcon };
  }
}

function OSIcon({ os = "", size = 24, color }) {
  const lower = os.toLowerCase();
  if (lower.includes("ios") || lower.includes("iphone") || lower.includes("ipad")) return <AppleIcon size={size} color={color} />;
  if (lower.includes("android")) return <AndroidIcon size={size} color={color} />;
  if (lower.includes("windows")) return <WindowsIcon size={size} color={color} />;
  if (lower.includes("mac"))     return <LaptopIcon size={size} color={color} />;
  return <PhoneIcon size={size} color={color} />;
}

// ─── Single activity card ─────────────────────────────────────────────────────

function ActivityCard({ item, onRevoke, C }) {
  const [expanded,   setExpanded]   = useState(false);
  const [confirming, setConfirming] = useState(false);
  const method = methodInfo(item.method);

  const locationStr = [item.flag, item.city, item.country]
    .filter(Boolean).join("  ").trim();

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: item.isCurrent ? C.accent + "12" : C.card,
          borderRadius:    16,
          borderWidth:     1,
          borderColor:     item.isCurrent ? C.accent + "44" : C.border,
          marginBottom:    12,
          overflow:        "hidden",
        },
      ]}
    >
      {/* Main row */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 14 }}>

        {/* Device icon */}
        <View style={{
          width: 48, height: 48, borderRadius: 14,
          backgroundColor: item.isCurrent ? C.accent + "22" : C.border + "44",
          justifyContent: "center", alignItems: "center",
        }}>
          <OSIcon os={item.deviceOS} size={24} color={item.isCurrent ? C.accentSoft : C.textMuted} />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <Text style={{
              color: C.text, fontFamily: "Nunito_700Bold",
              fontSize: 14, flexShrink: 1,
            }} numberOfLines={1}>
              {item.deviceName || "Unknown device"}
            </Text>
            {item.isCurrent && (
              <View style={{
                backgroundColor: C.success + "22", borderRadius: 6,
                paddingHorizontal: 7, paddingVertical: 2,
                borderWidth: 1, borderColor: C.success + "44",
              }}>
                <Text style={{ color: C.success, fontFamily: "Nunito_700Bold", fontSize: 10 }}>
                  This device
                </Text>
              </View>
            )}
            {!item.isActive && (
              <View style={{
                backgroundColor: C.textMuted + "22", borderRadius: 6,
                paddingHorizontal: 7, paddingVertical: 2,
              }}>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 10 }}>
                  Signed out
                </Text>
              </View>
            )}
          </View>

          {/* Location */}
          {locationStr ? (
            <Text style={{
              color: C.textMuted, fontFamily: "Nunito_400Regular",
              fontSize: 12, marginBottom: 2,
            }} numberOfLines={1}>
              {locationStr}
            </Text>
          ) : null}

          {/* Time */}
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>

        {/* Method badge */}
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 4,
            backgroundColor: C.accent + "18", borderRadius: 8,
            paddingHorizontal: 8, paddingVertical: 4,
            borderWidth: 1, borderColor: C.accent + "33",
          }}>
            <method.Icon size={11} color={C.accentSoft} />
            <Text style={{ color: C.accentSoft, fontFamily: "Nunito_600SemiBold", fontSize: 11 }}>
              {method.label}
            </Text>
          </View>
          {expanded
            ? <ChevronUpIcon size={16} color={C.textMuted} />
            : <ChevronDownIcon size={16} color={C.textMuted} />
          }
        </View>
      </View>

      {/* Expanded details */}
      {expanded && (
        <View style={{
          borderTopWidth: 1, borderTopColor: C.border,
          padding: 16, gap: 10,
        }}>
          {/* Detail rows */}
          {[
            { label: "Device",    value: item.deviceName || "Unknown" },
            { label: "OS",        value: item.deviceOS   || "Unknown" },
            { label: "Location",  value: locationStr     || "Unknown" },
            { label: "Signed in", value: fullDate(item.createdAt) },
            { label: "Method",    value: method.label, Icon: method.Icon },
            item.revokedAt
              ? { label: "Signed out", value: fullDate(item.revokedAt) }
              : null,
          ].filter(Boolean).map(({ label, value, Icon }) => (
            <View key={label} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <Text style={{
                color: C.textMuted, fontFamily: "Nunito_600SemiBold",
                fontSize: 12, width: 72,
              }}>
                {label}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                {Icon && <Icon size={12} color={C.textMuted} />}
                <Text style={{
                  color: C.text, fontFamily: "Nunito_400Regular",
                  fontSize: 12, flex: 1,
                }}>
                  {value}
                </Text>
              </View>
            </View>
          ))}

          {/* Revoke button — only for active non-current sessions */}
          {item.isActive && !item.isCurrent && (
            <>
              {!confirming ? (
                <TouchableOpacity
                  style={{
                    marginTop: 8, backgroundColor: C.error + "18",
                    borderRadius: 10, padding: 12, alignItems: "center",
                    borderWidth: 1, borderColor: C.error + "33",
                  }}
                  onPress={() => setConfirming(true)}
                >
                  <Text style={{ color: C.error, fontFamily: "Nunito_700Bold", fontSize: 13 }}>
                    Sign out this session
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                  <TouchableOpacity
                    style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: "center" }}
                    onPress={() => setConfirming(false)}
                  >
                    <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 13 }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: C.error, alignItems: "center" }}
                    onPress={() => { setConfirming(false); onRevoke(item.sessionId); }}
                  >
                    <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 13 }}>Sign out</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LoginActivityScreen() {
  const navigation = useNavigation();
  const { colors: C } = useTheme();
  const { isConnected } = useNetwork();
  const spinner = useSpinner();

  const [activities,    setActivities]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    try {
      const res = await api.get("/activity/login-history");
      setActivities(res.data.activities || []);
    } catch (e) {
      console.log("Login history error:", e.message);
    }
  }, [isConnected]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadHistory().finally(() => setLoading(false));
  }, [loadHistory]));

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleRevoke = async (sessionId) => {
    await spinner.withSpinner(async () => {
      try {
        await api.delete(`/activity/revoke/${sessionId}`);
        setActivities((prev) =>
          prev.map((a) =>
            a.sessionId === sessionId
              ? { ...a, isActive: false, revokedAt: new Date().toISOString() }
              : a
          )
        );
      } catch (e) {
        Alert.alert("Error", e.response?.data?.message || "Could not revoke session.");
      }
    }, "Signing out session...");
  };

  const handleRevokeAll = () => {
    Alert.alert(
      "Sign out all other sessions?",
      "This will sign out all sessions except your current one. Anyone else using your account will be signed out.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out all",
          style: "destructive",
          onPress: async () => {
            await spinner.withSpinner(async () => {
              try {
                await api.delete("/activity/revoke-all");
                setActivities((prev) =>
                  prev.map((a) =>
                    a.isCurrent
                      ? a
                      : { ...a, isActive: false, revokedAt: new Date().toISOString() }
                  )
                );
                Alert.alert("Done", "All other sessions have been signed out.");
              } catch (e) {
                Alert.alert("Error", e.response?.data?.message || "Could not sign out sessions.");
              }
            }, "Signing out all sessions...");
          },
        },
      ]
    );
  };

  const activeOtherSessions = activities.filter((a) => a.isActive && !a.isCurrent);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center", gap: 12 }}>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14 }}>
          Loading login history...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.card,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, justifyContent: "center" }}>
          <BackIcon size={22} color={C.accent} />
        </TouchableOpacity>
        <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22 }}>
          Login Activity
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.accent} />
        }
      >
        {/* Info banner */}
        <View style={{
          backgroundColor: C.accent + "12", borderRadius: 14, padding: 16,
          borderWidth: 1, borderColor: C.accent + "33", marginBottom: 20,
          flexDirection: "row", gap: 12, alignItems: "flex-start",
        }}>
          <ShieldIcon size={20} color={C.accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 14, marginBottom: 4 }}>
              Review your login activity
            </Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 19 }}>
              These are the devices and locations where your HushCircle account has been accessed.
              If you see anything suspicious, sign out that session immediately.
            </Text>
          </View>
        </View>

        {/* Sign out all button */}
        {activeOtherSessions.length > 0 && (
          <TouchableOpacity
            style={{
              backgroundColor: C.error + "18", borderRadius: 14, padding: 14,
              borderWidth: 1, borderColor: C.error + "33", marginBottom: 20,
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            }}
            onPress={handleRevokeAll}
            activeOpacity={0.8}
          >
            <DoorOutIcon size={16} color={C.error} />
            <Text style={{ color: C.error, fontFamily: "Nunito_700Bold", fontSize: 14 }}>
              {`Sign out ${activeOtherSessions.length} other session${activeOtherSessions.length > 1 ? "s" : ""}`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Session count */}
        <Text style={{
          color: C.textMuted, fontFamily: "Nunito_700Bold", fontSize: 11,
          letterSpacing: 0.8, textTransform: "uppercase",
          marginBottom: 12,
        }}>
          {`${activities.length} session${activities.length !== 1 ? "s" : ""} in the last 90 days`}
        </Text>

        {/* Activity cards */}
        {activities.length === 0 ? (
          <View style={{
            backgroundColor: C.card, borderRadius: 16, padding: 32,
            borderWidth: 1, borderColor: C.border, alignItems: "center",
          }}>
            <ClipboardEmptyIcon size={36} color={C.textMuted} />
            <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 16, marginTop: 12, marginBottom: 6 }}>
              No activity yet
            </Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", lineHeight: 19 }}>
              Your login history will appear here after your next sign-in.
            </Text>
          </View>
        ) : (
          activities.map((item) => (
            <ActivityCard
              key={item._id}
              item={item}
              onRevoke={handleRevoke}
              C={C}
            />
          ))
        )}

        {/* Security tip */}
        <View style={{
          backgroundColor: C.card, borderRadius: 14, padding: 16,
          borderWidth: 1, borderColor: C.border, marginTop: 8,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <LockBigIcon size={14} color={C.text} />
            <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 13 }}>
              Keep your account safe
            </Text>
          </View>
          {[
            "Sign out sessions you do not recognise",
            "Enable two-step verification in Security settings",
            "Never share your password or PIN with anyone",
          ].map((tip, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: i < 2 ? 6 : 0 }}>
              <Text style={{ color: C.accent, fontSize: 12, marginTop: 2 }}>•</Text>
              <Text style={{ flex: 1, color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 18 }}>
                {tip}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
      <NoNetworkOverlay
        visible={showNoNetwork}
        action="login activity"
        onRetry={() => { setShowNoNetwork(false); loadHistory(); }}
        onClose={() => setShowNoNetwork(false)}
      />
    </View>
  );
}``