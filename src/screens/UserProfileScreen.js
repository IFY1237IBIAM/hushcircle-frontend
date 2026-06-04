import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Path, Circle, Line, Polyline, Rect, G } from "react-native-svg";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import PostCard from "../components/PostCard";
import { useNetwork } from "../context/NetworkContext";
import NoNetworkOverlay from "../components/NoNetworkOverlay";
// Module-level color fallbacks for icon defaults (theme-aware colors used inside component)
const DARK = {
  accent: "#9B6FD4",
  accentSoft: "#C4A3E8",
  textMuted: "#8B7FA8",
  error: "#D4607A",
};



// ── SVG Icon Components ────────────────────────────────────────────────────

const ArrowLeftIcon = ({ size = 22, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
    <Path
      d="M12 19l-7-7 7-7"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const UserIcon = ({ size = 32, color = DARK.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    />
    <Circle
      cx="12" cy="7" r="4"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const BlockIcon = ({ size = 18, color = DARK.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const GridIcon = ({ size = 16, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="14" y="3" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="3" y="14" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="14" y="14" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const FileTextIcon = ({ size = 48, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
    />
    <Polyline
      points="14 2 14 8 20 8"
      stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
    />
    <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Polyline points="10 9 9 9 8 9" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const UserSearchIcon = ({ size = 48, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
      stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
    />
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={1.5} />
    <Circle cx="19" cy="10" r="3" stroke={color} strokeWidth={1.5} />
    <Path d="M21.5 12.5l1.5 1.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const ZapIcon = ({ size = 14, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const CalendarIcon = ({ size = 14, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const HeartIcon = ({ size = 14, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const WifiOffIcon = ({ size = 20, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10.71 5.05A16 16 0 0 1 22.56 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="20" x2="12.01" y2="20" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ──────────────────────────────────────────────────────────────────────────────

const timeAgo = (date) => {
  if (!date) return "";
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function UserProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  const { blockedUserIds, addBlockedUser, colors: COLORS} = useTheme();
  const { isConnected } = useNetwork();

  const { pseudonym } = route.params || {};

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const isOwnProfile = currentUser?.pseudonym === pseudonym;
  const isBlocked = profile?.authorId && blockedUserIds.includes(profile?.authorId?.toString());

  const loadProfile = async () => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    try {
      const res = await api.get(`/auth/user/${pseudonym}`);
      setProfile(res.data.user);
    } catch (e) {
      console.log("Profile load error:", e.message);
    }
  };

  const loadPosts = async () => {
    if (!isConnected) return;
    try {
      const res = await api.get(`/posts/search?q=${encodeURIComponent(pseudonym)}&author=${encodeURIComponent(pseudonym)}`);
      setPosts(res.data.posts || []);
    } catch (e) {
      setPosts([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([loadProfile(), loadPosts()]).finally(() => setLoading(false));
    }, [pseudonym, isConnected])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadPosts()]);
    setRefreshing(false);
  };

  const handleBlock = () => {
    if (!profile) return;
    Alert.alert(
      `Block @${pseudonym}?`,
      "Their posts will be hidden from your feed. You can unblock them in Settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            setBlocking(true);
            try {
              await api.post(`/settings/block/${profile._id || profile.id}`);
              addBlockedUser((profile._id || profile.id).toString());
              Alert.alert("Blocked", `@${pseudonym} has been blocked.`);
              navigation.goBack();
            } catch (e) {
              Alert.alert("Error", e.response?.data?.message || "Could not block user.");
            } finally {
              setBlocking(false);
            }
          },
        },
      ]
    );
  };

  const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000);
  const isOnline =
    profile?.showOnlineStatus &&
    profile?.isOnline &&
    new Date(profile?.lastSeen) > threeMinAgo;

  const ListHeader = () => (
    <View style={styles.profileHeader}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{pseudonym?.[0]?.toUpperCase()}</Text>
        </View>
        {profile?.showOnlineStatus && (
          <View style={[styles.onlineDot, { backgroundColor: isOnline ? COLORS.success : COLORS.border }]} />
        )}
      </View>

      {/* Name and status */}
      <Text style={styles.pseudonym}>@{pseudonym}</Text>

      {profile?.showOnlineStatus && (
        <View style={styles.onlineStatusRow}>
          <View style={[styles.onlinePulse, { backgroundColor: isOnline ? COLORS.success : COLORS.border }]} />
          <Text style={styles.onlineStatus}>
            {isOnline ? "Online now" : profile?.lastSeen ? `Last seen ${timeAgo(profile.lastSeen)} ago` : ""}
          </Text>
        </View>
      )}

      {/* Bio */}
      {profile?.bio ? (
        <Text style={styles.bio}>{profile.bio}</Text>
      ) : null}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statIconWrap}>
            <GridIcon size={14} color={COLORS.accent} />
          </View>
          <Text style={styles.statNum}>{profile?.totalPosts ?? "—"}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={styles.statIconWrap}>
            <HeartIcon size={14} color={COLORS.accent} />
          </View>
          <Text style={styles.statNum}>{profile?.totalReactions ?? "—"}</Text>
          <Text style={styles.statLabel}>Reactions</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={styles.statIconWrap}>
            <CalendarIcon size={14} color={COLORS.accent} />
          </View>
          <Text style={styles.statNum}>
            {profile?.joinedAt
              ? new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
              : "—"}
          </Text>
          <Text style={styles.statLabel}>Joined</Text>
        </View>
      </View>

      {/* Actions */}
      {!isOwnProfile && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.blockBtn, blocking && { opacity: 0.6 }]}
            onPress={handleBlock}
            disabled={blocking}
          >
            {blocking ? (
              <ActivityIndicator color={COLORS.error} size="small" />
            ) : (
              <View style={styles.blockBtnInner}>
                <BlockIcon size={16} color={COLORS.error} />
                <Text style={styles.blockBtnText}>Block @{pseudonym}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {posts.length > 0 && (
        <View style={styles.postsHeaderRow}>
          <GridIcon size={14} color={COLORS.textMuted} />
          <Text style={styles.postsHeader}>Posts by @{pseudonym}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeftIcon size={22} color={COLORS.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.accent} size="large" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeftIcon size={22} color={COLORS.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <UserSearchIcon size={48} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>User not found</Text>
          <Text style={styles.emptyText}>This profile may no longer exist.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeftIcon size={22} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{pseudonym}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onDeleted={(id) => setPosts((prev) => prev.filter((p) => p._id !== id))}
            onHidden={(id) => setPosts((prev) => prev.filter((p) => p._id !== id))}
            onEdited={(id, content, mood) =>
              setPosts((prev) =>
                prev.map((p) => p._id === id ? { ...p, content, mood } : p)
              )
            }
          />
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <FileTextIcon size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>@{pseudonym} has not shared anything.</Text>
          </View>
        }
      />

      <NoNetworkOverlay
        visible={showNoNetwork}
        action="feed"
        onClose={() => setShowNoNetwork(false)}
        onRetry={() => { setShowNoNetwork(false); loadProfile(); }}
      />
    </View>
  );
}

    const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F0A1E" },
    centered: {
    flex: 1, backgroundColor: "#0F0A1E",
    alignItems: "center", justifyContent: "center",
    gap: 12, paddingBottom: 60,
    },
    loadingText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 14, marginTop: 8 },

    header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: "#2D2450",
    backgroundColor: "#0F0A1E",
    },
    backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "flex-start" },
    headerTitle: {
    color: "#EDE8F5", fontFamily: "Nunito_700Bold", fontSize: 16,
    flex: 1, textAlign: "center",
    },

    profileHeader: { paddingTop: 24, paddingHorizontal: 20, alignItems: "center" },

    avatarWrap: { position: "relative", marginBottom: 14 },
    avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#9B6FD4" + "33",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2.5, borderColor: "#9B6FD4" + "55",
    },
    avatarText: { color: "#C4A3E8", fontFamily: "DMSerifDisplay_400Regular", fontSize: 32 },
    onlineDot: {
    position: "absolute", bottom: 2, right: 2,
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2.5, borderColor: "#0F0A1E",
    },

    pseudonym: { color: "#EDE8F5", fontFamily: "Nunito_700Bold", fontSize: 22, marginBottom: 6 },

    onlineStatusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
    onlinePulse: { width: 7, height: 7, borderRadius: 4 },
    onlineStatus: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13 },

    bio: {
    color: "#8B7FA8", fontFamily: "Nunito_400Regular",
    fontSize: 14, textAlign: "center", lineHeight: 22,
    marginBottom: 16, paddingHorizontal: 20,
    },

    statsRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1A1330", borderRadius: 16,
    padding: 16, marginBottom: 16, width: "100%",
    borderWidth: 1, borderColor: "#2D2450",
    },
    statItem: { flex: 1, alignItems: "center", gap: 4 },
    statIconWrap: { marginBottom: 2 },
    statNum: { color: "#9B6FD4", fontFamily: "DMSerifDisplay_400Regular", fontSize: 22 },
    statLabel: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "center" },
    statDivider: { width: 1, height: 36, backgroundColor: "#2D2450", marginHorizontal: 8 },

    actions: { width: "100%", marginBottom: 16 },
    blockBtn: {
    paddingVertical: 11, paddingHorizontal: 20,
    borderRadius: 12, borderWidth: 1,
    borderColor: "#D4607A" + "55",
    backgroundColor: "#D4607A" + "11",
    alignItems: "center",
    },
    blockBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
    blockBtnText: { color: "#D4607A", fontFamily: "Nunito_600SemiBold", fontSize: 14 },

    postsHeaderRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", marginBottom: 8, marginTop: 4,
    },
    postsHeader: {
    color: "#EDE8F5", fontFamily: "Nunito_700Bold", fontSize: 14,
    },

    list: { paddingHorizontal: 16, paddingBottom: 32 },

    empty: { alignItems: "center", paddingTop: 40, gap: 8 },
    emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#1A1330", borderWidth: 1, borderColor: "#2D2450",
    justifyContent: "center", alignItems: "center", marginBottom: 6,
    },
    emptyTitle: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 4 },
    emptyText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center" },
    });

