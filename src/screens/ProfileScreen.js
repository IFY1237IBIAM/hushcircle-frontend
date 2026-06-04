import { useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl,
  Alert, Switch, Modal, TextInput,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect, G } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkContext";
import api from "../api/api";
import PostCard from "../components/PostCard";
import OnlineDot from "../components/OnlineDot";
import NoNetworkOverlay from "../components/NoNetworkOverlay";
import HushCircleSpinner from "../components/HushCircleSpinner";
import { useNavigation } from "@react-navigation/native";
import useSpinner from "../hooks/useSpinner";import { useTheme } from "../context/ThemeContext";

// Module-level color fallbacks for icon defaults (theme-aware colors used inside component)
const DARK = {
  accent: "#9B6FD4",
  accentSoft: "#C4A3E8",
  text: "#EDE8F5",
  error: "#D4607A",
  success: "#4CAF8F",
};



const AVATAR_COLORS = [
  "#9B6FD4", "#D4607A", "#6B9FD4",
  "#4CAF8F", "#D4A44C", "#E879F9",
];

// ── SVG Icon Components ────────────────────────────────────────────────────

const SettingsIcon = ({ size = 22, color = DARK.text }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const EditIcon = ({ size = 14, color = DARK.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const ShieldIcon = ({ size = 20, color = DARK.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const LockIcon = ({ size = 20, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
    <Path
      d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const EyeIcon = ({ size = 20, color = DARK.success }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
    <Circle cx="12" cy="12" r="3"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const EyeOffIcon = ({ size = 20, color = DARK.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
    <Line x1="1" y1="1" x2="23" y2="23"
      stroke={color} strokeWidth={2} strokeLinecap="round"
    />
  </Svg>
);

const PostIcon = ({ size = 16, color = DARK.text }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 20h9"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
    <Path
      d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const BookmarkIcon = ({ size = 16, color = DARK.text }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const CheckIcon = ({ size = 16, color = DARK.success }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12"
      stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

// ──────────────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { colors: COLORS } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const { isConnected } = useNetwork();
  const spinner = useSpinner();
  const [activeTab, setActiveTab] = useState("posts");
  const navigation = useNavigation();
  const [stats, setStats] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || "");
  const [savingBio, setSavingBio] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [showOnlineStatus, setShowOnlineStatus] = useState(
    user?.showOnlineStatus !== false
  );
  const dataLoaded = useRef(false);

  const avatarColor = AVATAR_COLORS[
    (user?.pseudonym?.charCodeAt(0) || 0) % AVATAR_COLORS.length
  ];

  const fetchAll = async (silent = false) => {
    if (!isConnected) {
      setShowNoNetwork(true);
      return;
    }
    try {
      const [statsRes, postsRes, savedRes] = await Promise.all([
        api.get("/auth/stats"),
        api.get("/auth/my-posts"),
        api.get("/auth/saved-posts"),
      ]);
      setStats(statsRes.data);
      setMyPosts(postsRes.data.posts);
      setSavedPosts(savedRes.data.posts);
      setSavedCount(savedRes.data.posts?.length || 0);
      setShowNoNetwork(false);
      dataLoaded.current = true;
    } catch (error) {
      console.log("Profile fetch error:", error.message);
      if (error.message === "Network Error") setShowNoNetwork(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!dataLoaded.current) {
        spinner.withSpinner(() => fetchAll(), "Loading your profile...");
      } else {
        fetchAll(true);
      }
    }, [isConnected])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const handleToggleOnlineStatus = async () => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    await spinner.withSpinner(async () => {
      try {
        const res = await api.put("/auth/online-status-privacy");
        const newValue = res.data.showOnlineStatus;
        setShowOnlineStatus(newValue);
        updateUser({ showOnlineStatus: newValue });
        Alert.alert(
          newValue ? "Status visible 💜" : "Status hidden",
          res.data.message
        );
      } catch {
        Alert.alert("Error", "Could not update your privacy setting.");
      }
    }, "Updating privacy...");
  };

  const handleLogout = () => {
    Alert.alert("Leave safely?", "You can always come back 💜", [
      { text: "Stay", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: logout },
    ]);
  };

  const handleDeleted = (deletedId) => {
    setMyPosts((prev) => prev.filter((p) => p._id !== deletedId));
    setSavedPosts((prev) => prev.filter((p) => p._id !== deletedId));
    if (stats) setStats((prev) => ({ ...prev, totalPosts: prev.totalPosts - 1 }));
  };

  const joinDate = user?._id
    ? new Date(parseInt(user._id.substring(0, 8), 16) * 1000)
        .toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const currentPosts = activeTab === "posts" ? myPosts : savedPosts;

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      await api.put("/auth/bio", { bio: bioText.trim() });
      updateUser({ bio: bioText.trim() });
      setShowBioModal(false);
      Alert.alert("Updated 💜", "Bio saved.");
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Could not save bio.");
    } finally {
      setSavingBio(false);
    }
  };

  const ListHeader = () => (
    <View>
      {/* ── Header actions row ── */}
      <View style={styles.profileHeaderRow}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate("Settings")}
        >
          <SettingsIcon size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* ── Profile header ── */}
      <View style={styles.profileHeader}>
        <View style={{ position: "relative", marginBottom: 14 }}>
          <View style={[styles.avatar, { backgroundColor: avatarColor + "33", borderColor: avatarColor }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>
              {user?.pseudonym?.[0]?.toUpperCase()}
            </Text>
          </View>
          <OnlineDot
            isOnline={true}
            showOnlineStatus={showOnlineStatus}
            size={18}
            borderColor={COLORS.bg}
          />
        </View>

        <Text style={styles.pseudonym}>{user?.pseudonym}</Text>

        {/* Bio row */}
        <TouchableOpacity
          style={styles.bioRow}
          onPress={() => { setBioText(user?.bio || ""); setShowBioModal(true); }}
          activeOpacity={0.75}
        >
          <View style={styles.bioInner}>
            {user?.bio ? (
              <Text style={styles.bioText}>{user.bio}</Text>
            ) : (
              <Text style={styles.bioPlaceholder}>Add a bio...</Text>
            )}
            <View style={styles.bioPencilWrap}>
              <EditIcon size={13} color={COLORS.accentSoft} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Anonymous badge */}
        <View style={styles.anonBadge}>
          <LockIcon size={12} color={COLORS.accentSoft} />
          <Text style={styles.anonBadgeText}>Anonymous identity</Text>
        </View>

        {joinDate ? <Text style={styles.joinDate}>Member since {joinDate}</Text> : null}
      </View>

      {/* ── Stats ── */}
      {stats ? (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.accent }]}>{stats.totalPosts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#D4607A" }]}>{stats.totalReactions}</Text>
            <Text style={styles.statLabel}>Reactions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#4CAF8F" }]}>{stats.totalComments}</Text>
            <Text style={styles.statLabel}>Comments</Text>
          </View>
        </View>
      ) : (
        <View style={styles.statsPlaceholder}>
          <ActivityIndicator color={COLORS.accent} size="small" />
        </View>
      )}

      {/* ── Privacy settings ── */}
      <View style={styles.privacySection}>
        <View style={styles.privacySectionTitleRow}>
          <ShieldIcon size={14} color={COLORS.textMuted} />
          <Text style={styles.privacySectionTitle}>Privacy & Safety</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[
              styles.settingIconWrap,
              { backgroundColor: showOnlineStatus ? "#4CAF8F22" : "#D4607A22" }
            ]}>
              {showOnlineStatus
                ? <EyeIcon size={18} color={COLORS.success} />
                : <EyeOffIcon size={18} color={COLORS.error} />
              }
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Online status</Text>
              <Text style={styles.settingDesc}>
                {showOnlineStatus
                  ? "Others can see when you're active"
                  : "Your online status is hidden from everyone"}
              </Text>
            </View>
          </View>
          <Switch
            value={showOnlineStatus}
            onValueChange={handleToggleOnlineStatus}
            disabled={togglingStatus}
            trackColor={{ false: "#2D2450", true: "#4CAF8F44" }}
            thumbColor={showOnlineStatus ? "#4CAF8F" : "#8B7FA8"}
            ios_backgroundColor="#2D2450"
          />
        </View>

        {/* Status preview */}
        <View style={[styles.statusPreview, { borderColor: showOnlineStatus ? "#4CAF8F44" : COLORS.border }]}>
          {showOnlineStatus ? (
            <View style={styles.statusPreviewRow}>
              <View style={styles.statusPreviewDot} />
              <Text style={[styles.statusPreviewText, { color: "#4CAF8F" }]}>
                Others can see you are online right now
              </Text>
            </View>
          ) : (
            <View style={styles.statusPreviewRow}>
              <LockIcon size={14} color={COLORS.textMuted} />
              <Text style={styles.statusPreviewText}>
                Your online status and last seen are hidden from everyone
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Safety note ── */}
      <View style={styles.safetyBox}>
        <View style={styles.safetyTitleRow}>
          <ShieldIcon size={16} color={COLORS.accentSoft} />
          <Text style={styles.safetyTitle}>You are safe here 💜</Text>
        </View>
        <Text style={styles.safetyText}>
          Your real identity is never shared. Only your pseudonym is visible to others.
        </Text>
      </View>

      {/* ── Tab switcher ── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "posts" && styles.tabBtnActive]}
          onPress={() => setActiveTab("posts")}
        >
          <PostIcon size={15} color={activeTab === "posts" ? "#fff" : COLORS.textMuted} />
          <Text style={[styles.tabBtnText, activeTab === "posts" && styles.tabBtnTextActive]}>
            My Posts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "saved" && styles.tabBtnActive]}
          onPress={() => setActiveTab("saved")}
        >
          <BookmarkIcon size={15} color={activeTab === "saved" ? "#fff" : COLORS.textMuted} />
          <Text style={[styles.tabBtnText, activeTab === "saved" && styles.tabBtnTextActive]}>
            Saved
          </Text>
          {savedCount > 0 && (
            <View style={styles.tabCountBadge}>
              <Text style={styles.tabCountBadgeText}>{savedCount > 99 ? "99+" : savedCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {currentPosts.length === 0 && !spinner.visible && (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            {activeTab === "posts"
              ? <PostIcon size={36} color={COLORS.textMuted} />
              : <BookmarkIcon size={36} color={COLORS.textMuted} />
            }
          </View>
          <Text style={styles.emptyTitle}>
            {activeTab === "posts" ? "No posts yet" : "No saved posts"}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === "posts"
              ? "Share your first story — this is your safe space 💜"
              : "Save posts that resonate with you and find them here anytime 💜"}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={currentPosts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onDeleted={handleDeleted}
            onHidden={(hiddenId) => setSavedPosts((prev) => prev.filter((p) => p._id !== hiddenId))}
            onEdited={(id, content, mood) =>
              setMyPosts((prev) =>
                prev.map((p) => p._id === id ? { ...p, content, mood } : p)
              )
            }
          />
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent}
          />
        }
      />

      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />

      <NoNetworkOverlay
        visible={showNoNetwork}
        action="profile"
        onRetry={() => {
          if (isConnected) {
            setShowNoNetwork(false);
            fetchAll();
          }
        }}
      />

      {/* ── Bio edit modal ── */}
      <Modal
        visible={showBioModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBioModal(false)}
      >
        <View style={styles.bioModalOverlay}>
          <View style={styles.bioModal}>
            <View style={styles.bioModalTitleRow}>
              <EditIcon size={18} color={COLORS.accentSoft} />
              <Text style={styles.bioModalTitle}>Edit bio</Text>
            </View>
            <Text style={styles.bioModalSub}>Describe yourself in a few words</Text>

            <TextInput
              style={styles.bioInput}
              value={bioText}
              onChangeText={setBioText}
              placeholder="e.g. On a journey to healing 💜"
              placeholderTextColor={COLORS.textMuted}
              maxLength={100}
              multiline
              autoFocus
            />
            <Text style={styles.bioCharCount}>{bioText.length}/100</Text>

            <View style={styles.bioActions}>
              <TouchableOpacity style={styles.bioCancelBtn} onPress={() => setShowBioModal(false)}>
                <Text style={styles.bioCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bioSaveBtn, savingBio && { opacity: 0.6 }]}
                onPress={handleSaveBio}
                disabled={savingBio}
              >
                {savingBio
                  ? <ActivityIndicator color="#fff" size="small" />
                  : (
                    <View style={styles.bioSaveBtnInner}>
                      <CheckIcon size={15} color="#fff" />
                      <Text style={styles.bioSaveText}>Save</Text>
                    </View>
                  )
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


  const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: "#0F0A1E" },

  list: { padding: 16, paddingTop: 56 },


  // Header

  profileHeaderRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 },

  settingsBtn: {

  padding: 10, borderRadius: 12,

  backgroundColor: "#1A1330",

  borderWidth: 1, borderColor: "#2D2450",

  },


  // Profile header

  profileHeader: { alignItems: "center", marginBottom: 24 },

  avatar: { width: 88, height: 88, borderRadius: 44, justifyContent: "center", alignItems: "center", borderWidth: 2 },

  avatarText: { fontSize: 40, fontFamily: "Inter_600SemiBold" },

  pseudonym: { fontSize: 28, color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", marginBottom: 8 },


  // Bio

  bioRow: { marginTop: 8, marginBottom: 10, paddingHorizontal: 16, alignSelf: "stretch" },

  bioInner: {

  flexDirection: "row", alignItems: "center", justifyContent: "center",

  backgroundColor: "#1A133088", borderRadius: 12, borderWidth: 1,

  borderColor: "#2D245066", paddingHorizontal: 14, paddingVertical: 10, gap: 8,

  },

  bioText: { flex: 1, color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },

  bioPlaceholder: { flex: 1, color: "#9B6FD4" + "66", fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", fontStyle: "italic" },

  bioPencilWrap: { width: 22, height: 22, justifyContent: "center", alignItems: "center", flexShrink: 0 },


  // Anonymous badge

  anonBadge: {

  flexDirection: "row", alignItems: "center", gap: 6,

  backgroundColor: "#9B6FD4" + "22", borderRadius: 20,

  paddingHorizontal: 14, paddingVertical: 5,

  borderWidth: 1, borderColor: "#9B6FD4" + "44", marginBottom: 6,

  },

  anonBadgeText: { color: "#C4A3E8", fontFamily: "Inter_500Medium", fontSize: 12 },

  joinDate: { color: "#8B7FA8", fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 },


  // Stats

  statsRow: { flexDirection: "row", backgroundColor: "#1A1330", borderRadius: 16, borderWidth: 1, borderColor: "#2D2450", marginBottom: 16, padding: 16 },

  statsPlaceholder: { backgroundColor: "#1A1330", borderRadius: 16, borderWidth: 1, borderColor: "#2D2450", marginBottom: 16, padding: 24, alignItems: "center" },

  statCard: { flex: 1, alignItems: "center" },

  statNumber: { fontSize: 26, fontFamily: "DMSerifDisplay_400Regular", marginBottom: 2 },

  statLabel: { color: "#8B7FA8", fontFamily: "Inter_400Regular", fontSize: 12 },

  statDivider: { width: 1, backgroundColor: "#2D2450", marginHorizontal: 8 },


  // Privacy section

  privacySection: { backgroundColor: "#1A1330", borderRadius: 16, borderWidth: 1, borderColor: "#2D2450", marginBottom: 16, overflow: "hidden" },

  privacySectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, padding: 14, paddingBottom: 8 },

  privacySectionTitle: { color: "#8B7FA8", fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" },

  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderTopWidth: 1, borderTopColor: "#2D2450" },

  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 12 },

  settingIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },

  settingInfo: { flex: 1 },

  settingTitle: { color: "#EDE8F5", fontFamily: "Inter_500Medium", fontSize: 14, marginBottom: 2 },

  settingDesc: { color: "#8B7FA8", fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16 },

  statusPreview: { margin: 14, marginTop: 4, borderRadius: 12, padding: 12, borderWidth: 1, backgroundColor: "#0F0A1E" },

  statusPreviewRow: { flexDirection: "row", alignItems: "center", gap: 8 },

  statusPreviewDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#4CAF8F" },

  statusPreviewText: { color: "#8B7FA8", fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 18 },


  // Safety box

  safetyBox: { backgroundColor: "#9B6FD4" + "15", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#9B6FD4" + "33", marginBottom: 20 },

  safetyTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },

  safetyTitle: { color: "#C4A3E8", fontFamily: "Inter_600SemiBold", fontSize: 14 },

  safetyText: { color: "#8B7FA8", fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 },


  // Tabs

  tabRow: { flexDirection: "row", backgroundColor: "#1A1330", borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: "#2D2450" },

  tabBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10, flexDirection: "row", justifyContent: "center", gap: 6 },

  tabBtnActive: { backgroundColor: "#9B6FD4" },

  tabBtnText: { color: "#8B7FA8", fontFamily: "Inter_500Medium", fontSize: 14 },

  tabBtnTextActive: { color: "#fff" },

  tabCountBadge: { backgroundColor: "#9B6FD4", borderRadius: 10, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 5, marginLeft: 2 },

  tabCountBadgeText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 10 },


  // Empty state

  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 24 },

  emptyIconWrap: { marginBottom: 16, opacity: 0.5 },

  emptyTitle: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 8 },

  emptyText: { color: "#8B7FA8", fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 },


  // Bio modal

  bioModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },

  bioModal: { backgroundColor: "#1A1330", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: "#2D2450" },

  bioModalTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },

  bioModalTitle: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 22 },

  bioModalSub: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 16 },

  bioInput: { backgroundColor: "#0F0A1E", borderRadius: 12, borderWidth: 1, borderColor: "#2D2450", padding: 14, color: "#EDE8F5", fontFamily: "Nunito_400Regular", fontSize: 15, minHeight: 80 },

  bioCharCount: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "right", marginTop: 6, marginBottom: 14 },

  bioActions: { flexDirection: "row", gap: 10 },

  bioCancelBtn: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#2D2450", alignItems: "center" },

  bioCancelText: { color: "#8B7FA8", fontFamily: "Nunito_600SemiBold", fontSize: 14 },

  bioSaveBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: "#9B6FD4", alignItems: "center" },

  bioSaveBtnInner: { flexDirection: "row", alignItems: "center", gap: 6 },

  bioSaveText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 },

  });

