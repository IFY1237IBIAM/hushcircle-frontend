import { useState, useCallback } from "react";
import {
  View, Text, FlatList,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert,
} from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import PostCard from "../components/PostCard";
import { useNetwork } from "../context/NetworkContext";
import NoNetworkOverlay from "../components/NoNetworkOverlay";

// ── SVG Icons — receive color as prop ────────────────────────────────────

const ArrowLeftIcon   = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 19l-7-7 7-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const BlockIcon       = ({ size = 18, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const GridIcon        = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3"  y="3"  width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="14" y="3"  width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="3"  y="14" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="14" y="14" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const FileTextIcon    = ({ size = 48, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const UserSearchIcon  = ({ size = 48, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="9"  cy="7" r="4" stroke={color} strokeWidth={1.5} />
    <Circle cx="19" cy="10" r="3" stroke={color} strokeWidth={1.5} />
    <Path d="M21.5 12.5l1.5 1.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const CalendarIcon    = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8"  y1="2" x2="8"  y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="3"  y1="10" x2="21" y2="10" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const HeartIcon       = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────

const timeAgo = (date) => {
  if (!date) return "";
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// ── Screen ────────────────────────────────────────────────────────────────

export default function UserProfileScreen() {
  const route      = useRoute();
  const navigation = useNavigation();
  const { user: currentUser }              = useAuth();
  const { colors: C, blockedUserIds, addBlockedUser } = useTheme(); // ← live colors
  const { isConnected } = useNetwork();

  const { pseudonym } = route.params || {};

  const [profile, setProfile]       = useState(null);
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const [blocking, setBlocking]     = useState(false);

  const isOwnProfile = currentUser?.pseudonym === pseudonym;
  const isBlocked    = profile?.authorId && blockedUserIds.includes(profile?.authorId?.toString());

  const loadProfile = async () => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    try { const res = await api.get(`/auth/user/${pseudonym}`); setProfile(res.data.user); }
    catch (e) { console.log("Profile load error:", e.message); }
  };

  const loadPosts = async () => {
    if (!isConnected) return;
    try { const res = await api.get(`/posts/search?q=${encodeURIComponent(pseudonym)}&author=${encodeURIComponent(pseudonym)}`); setPosts(res.data.posts || []); }
    catch (e) { setPosts([]); }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([loadProfile(), loadPosts()]).finally(() => setLoading(false));
    }, [pseudonym, isConnected])
  );

  const handleRefresh = async () => { setRefreshing(true); await Promise.all([loadProfile(), loadPosts()]); setRefreshing(false); };

  const handleBlock = () => {
    if (!profile) return;
    Alert.alert(`Block @${pseudonym}?`, "Their posts will be hidden from your feed. You can unblock them in Settings.", [
      { text: "Cancel", style: "cancel" },
      { text: "Block", style: "destructive", onPress: async () => {
        setBlocking(true);
        try {
          await api.post(`/settings/block/${profile._id || profile.id}`);
          addBlockedUser((profile._id || profile.id).toString());
          Alert.alert("Blocked", `@${pseudonym} has been blocked.`);
          navigation.goBack();
        } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not block user."); }
        finally { setBlocking(false); }
      }},
    ]);
  };

  const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000);
  const isOnline    = profile?.showOnlineStatus && profile?.isOnline && new Date(profile?.lastSeen) > threeMinAgo;

  // ── Common header ─────────────────────────────────────────────────────────
  const Header = ({ title }) => (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.card }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, justifyContent: "center", alignItems: "flex-start" }}>
        <ArrowLeftIcon size={22} color={C.accent} />
      </TouchableOpacity>
      <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 16, flex: 1, textAlign: "center" }}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Header title="Profile" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingBottom: 60 }}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, marginTop: 8 }}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Header title="Profile" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingBottom: 60 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center", marginBottom: 6 }}>
            <UserSearchIcon size={48} color={C.textMuted} />
          </View>
          <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 4 }}>User not found</Text>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center" }}>This profile may no longer exist.</Text>
        </View>
      </View>
    );
  }

  // ── List header ───────────────────────────────────────────────────────────
  const ListHeader = () => (
    <View style={{ paddingTop: 24, paddingHorizontal: 20, alignItems: "center" }}>
      {/* Avatar */}
      <View style={{ position: "relative", marginBottom: 14 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.accent + "33", justifyContent: "center", alignItems: "center", borderWidth: 2.5, borderColor: C.accent + "55" }}>
          <Text style={{ color: C.accentSoft, fontFamily: "DMSerifDisplay_400Regular", fontSize: 32 }}>{pseudonym?.[0]?.toUpperCase()}</Text>
        </View>
        {profile?.showOnlineStatus && (
          <View style={{ position: "absolute", bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, borderColor: C.bg, backgroundColor: isOnline ? C.success : C.border }} />
        )}
      </View>

      {/* Name */}
      <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 22, marginBottom: 6 }}>@{pseudonym}</Text>

      {/* Online status */}
      {profile?.showOnlineStatus && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: isOnline ? C.success : C.border }} />
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13 }}>
            {isOnline ? "Online now" : profile?.lastSeen ? `Last seen ${timeAgo(profile.lastSeen)} ago` : ""}
          </Text>
        </View>
      )}

      {/* Bio */}
      {profile?.bio ? (
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 16, paddingHorizontal: 20 }}>{profile.bio}</Text>
      ) : null}

      {/* Stats */}
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 16, width: "100%", borderWidth: 1, borderColor: C.border }}>
        {[
          { Icon: GridIcon,    value: profile?.totalPosts ?? "—",     label: "Posts" },
          { Icon: HeartIcon,   value: profile?.totalReactions ?? "—", label: "Reactions" },
          { Icon: CalendarIcon, value: profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—", label: "Joined" },
        ].map(({ Icon, value, label }, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
            {i > 0 && <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 1, backgroundColor: C.border }} />}
            <View style={{ marginBottom: 2 }}><Icon size={14} color={C.accent} /></View>
            <Text style={{ color: C.accent, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22 }}>{value}</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "center" }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Block button */}
      {!isOwnProfile && (
        <View style={{ width: "100%", marginBottom: 16 }}>
          <TouchableOpacity
            style={{ paddingVertical: 11, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: C.error + "55", backgroundColor: C.error + "11", alignItems: "center", opacity: blocking ? 0.6 : 1 }}
            onPress={handleBlock}
            disabled={blocking}
          >
            {blocking ? (
              <ActivityIndicator color={C.error} size="small" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <BlockIcon size={16} color={C.error} />
                <Text style={{ color: C.error, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>Block @{pseudonym}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Posts section header */}
      {posts.length > 0 && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginBottom: 8, marginTop: 4 }}>
          <GridIcon size={14} color={C.textMuted} />
          <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 14 }}>Posts by @{pseudonym}</Text>
        </View>
      )}
    </View>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Header title={`@${pseudonym}`} />

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onDeleted={(id) => setPosts((prev) => prev.filter((p) => p._id !== id))}
            onHidden={(id) => setPosts((prev) => prev.filter((p) => p._id !== id))}
            onEdited={(id, content, mood) => setPosts((prev) => prev.map((p) => p._id === id ? { ...p, content, mood } : p))}
          />
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.accent} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 40, gap: 8 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center", marginBottom: 6 }}>
              <FileTextIcon size={48} color={C.textMuted} />
            </View>
            <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 4 }}>No posts yet</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center" }}>@{pseudonym} has not shared anything.</Text>
          </View>
        }
      />

      <NoNetworkOverlay visible={showNoNetwork} action="feed" onClose={() => setShowNoNetwork(false)} onRetry={() => { setShowNoNetwork(false); loadProfile(); }} />
    </View>
  );
}