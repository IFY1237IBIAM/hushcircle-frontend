import { useState, useCallback, useRef } from "react";
import {
  View, Text, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl,
  Alert, Switch, Modal, TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Path, Circle, Polyline, Rect } from "react-native-svg";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api";
import PostCard from "../components/PostCard";
import OnlineDot from "../components/OnlineDot";
import NoNetworkOverlay from "../components/NoNetworkOverlay";
import HushCircleSpinner from "../components/HushCircleSpinner";
import { useNavigation } from "@react-navigation/native";
import useSpinner from "../hooks/useSpinner";

const AVATAR_COLORS = [
  "#9B6FD4","#D4607A","#6B9FD4","#4CAF8F","#D4A44C","#E879F9",
];

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const SettingsIcon = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PencilIcon = ({ size = 13, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LockIcon = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EyeIcon = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EyeOffIcon = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M1 1l22 22" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldIcon = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const FileEditIcon = ({ size = 44, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 18v-4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Path d="M10 16h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const BookmarkIcon = ({ size = 44, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GridIcon = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="14" y="3" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="3" y="14" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="14" y="14" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartIcon = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MessageIcon = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 0 2 2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { isConnected } = useNetwork();
  const { colors: C } = useTheme();                      // ← live theme colors
  const spinner = useSpinner();
  const navigation = useNavigation();

  const [activeTab, setActiveTab]           = useState("posts");
  const [stats, setStats]                   = useState(null);
  const [myPosts, setMyPosts]               = useState([]);
  const [savedPosts, setSavedPosts]         = useState([]);
  const [refreshing, setRefreshing]         = useState(false);
  const [showNoNetwork, setShowNoNetwork]   = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showBioModal, setShowBioModal]     = useState(false);
  const [bioText, setBioText]               = useState(user?.bio || "");
  const [savingBio, setSavingBio]           = useState(false);
  const [savedCount, setSavedCount]         = useState(0);
  const [showOnlineStatus, setShowOnlineStatus] = useState(user?.showOnlineStatus !== false);
  const dataLoaded = useRef(false);

  const avatarColor = AVATAR_COLORS[(user?.pseudonym?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  const fetchAll = async (silent = false) => {
    if (!isConnected) { setShowNoNetwork(true); return; }
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

  const handleRefresh = async () => { setRefreshing(true); await fetchAll(); setRefreshing(false); };

  const handleToggleOnlineStatus = async () => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    await spinner.withSpinner(async () => {
      try {
        const res = await api.put("/auth/online-status-privacy");
        const newValue = res.data.showOnlineStatus;
        setShowOnlineStatus(newValue);
        updateUser({ showOnlineStatus: newValue });
        Alert.alert(newValue ? "Status visible" : "Status hidden", res.data.message);
      } catch {
        Alert.alert("Error", "Could not update your privacy setting.");
      }
    }, "Updating privacy...");
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
      Alert.alert("Updated", "Bio saved.");
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Could not save bio.");
    } finally { setSavingBio(false); }
  };

  // ── List Header ─────────────────────────────────────────────────────────────
  const ListHeader = () => (
    <View>
      {/* Settings button */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 }}>
        <TouchableOpacity
          style={{ padding: 8, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border }}
          onPress={() => navigation.navigate("Settings")}
        >
          <SettingsIcon size={20} color={C.text} />
        </TouchableOpacity>
      </View>

      {/* Avatar + name */}
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <View style={{ position: "relative", marginBottom: 14 }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, justifyContent: "center", alignItems: "center", borderWidth: 2, backgroundColor: avatarColor + "33", borderColor: avatarColor }}>
            <Text style={{ fontSize: 40, fontFamily: "DMSerifDisplay_400Regular", color: avatarColor }}>
              {user?.pseudonym?.[0]?.toUpperCase()}
            </Text>
          </View>
          <OnlineDot isOnline={true} showOnlineStatus={showOnlineStatus} size={18} borderColor={C.bg} />
        </View>

        <Text style={{ fontSize: 28, color: C.text, fontFamily: "DMSerifDisplay_400Regular", marginBottom: 8 }}>
          {user?.pseudonym}
        </Text>

        {/* Bio row */}
        <TouchableOpacity
          style={{ marginTop: 8, marginBottom: 4, paddingHorizontal: 16, paddingVertical: 8, alignSelf: "stretch" }}
          onPress={() => { setBioText(user?.bio || ""); setShowBioModal(true); }}
          activeOpacity={0.75}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}>
            {user?.bio
              ? <Text style={{ flex: 1, color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 }}>{user.bio}</Text>
              : <Text style={{ flex: 1, color: C.accent + "88", fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", fontStyle: "italic" }}>Add a bio...</Text>
            }
            <View style={{ width: 24, height: 24, justifyContent: "center", alignItems: "center" }}>
              <PencilIcon size={13} color={C.accentSoft} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Anonymous badge */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.accent + "22", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: C.accent + "44", marginBottom: 6 }}>
          <LockIcon size={12} color={C.accentSoft} />
          <Text style={{ color: C.accentSoft, fontFamily: "Nunito_500Medium", fontSize: 12 }}>Anonymous identity</Text>
        </View>

        {joinDate ? <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>Member since {joinDate}</Text> : null}
      </View>

      {/* Stats */}
      {stats ? (
        <View style={{ flexDirection: "row", backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16, padding: 16 }}>
          <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
            <GridIcon size={13} color={C.accent} />
            <Text style={{ fontSize: 26, fontFamily: "DMSerifDisplay_400Regular", color: C.accent, marginBottom: 2 }}>{stats.totalPosts}</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>Posts</Text>
          </View>
          <View style={{ width: 1, backgroundColor: C.border, marginHorizontal: 8 }} />
          <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
            <HeartIcon size={13} color={C.error} />
            <Text style={{ fontSize: 26, fontFamily: "DMSerifDisplay_400Regular", color: C.error, marginBottom: 2 }}>{stats.totalReactions}</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>Reactions</Text>
          </View>
          <View style={{ width: 1, backgroundColor: C.border, marginHorizontal: 8 }} />
          <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
            <MessageIcon size={13} color={C.success} />
            <Text style={{ fontSize: 26, fontFamily: "DMSerifDisplay_400Regular", color: C.success, marginBottom: 2 }}>{stats.totalComments}</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>Comments</Text>
          </View>
        </View>
      ) : (
        <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16, padding: 24, alignItems: "center" }}>
          <ActivityIndicator color={C.accent} size="small" />
        </View>
      )}

      {/* Privacy section */}
      <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16, overflow: "hidden" }}>
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 11, letterSpacing: 0.5, padding: 14, paddingBottom: 8, textTransform: "uppercase" }}>
          Privacy & Safety
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderTopWidth: 1, borderTopColor: C.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", backgroundColor: showOnlineStatus ? C.success + "22" : C.error + "22" }}>
              {showOnlineStatus
                ? <EyeIcon size={20} color={C.success} />
                : <EyeOffIcon size={20} color={C.error} />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontFamily: "Nunito_500Medium", fontSize: 14, marginBottom: 2 }}>Online status</Text>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 16 }}>
                {showOnlineStatus ? "Others can see when you're active" : "Your online status is hidden from everyone"}
              </Text>
            </View>
          </View>
          <Switch
            value={showOnlineStatus}
            onValueChange={handleToggleOnlineStatus}
            disabled={togglingStatus}
            trackColor={{ false: C.border, true: C.success + "44" }}
            thumbColor={showOnlineStatus ? C.success : C.textMuted}
            ios_backgroundColor={C.border}
          />
        </View>
        <View style={{ margin: 14, marginTop: 4, borderRadius: 12, padding: 12, borderWidth: 1, backgroundColor: C.inputBg, borderColor: showOnlineStatus ? C.success + "44" : C.border }}>
          {showOnlineStatus ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.success }} />
              <Text style={{ color: C.success, fontFamily: "Nunito_400Regular", fontSize: 12, flex: 1, lineHeight: 18 }}>
                Others can see you are online right now
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <LockIcon size={14} color={C.textMuted} />
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, flex: 1, lineHeight: 18 }}>
                Your online status and last seen are hidden from everyone
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Safety note */}
      <View style={{ backgroundColor: C.accentGlow, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.accent + "33", marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <ShieldIcon size={14} color={C.accentSoft} />
          <Text style={{ color: C.accentSoft, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>You are safe here</Text>
        </View>
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 18 }}>
          Your real identity is never shared. Only your pseudonym is visible to others.
        </Text>
      </View>

      {/* Tab switcher */}
      <View style={{ flexDirection: "row", backgroundColor: C.card, borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
        {[
          { key: "posts", label: "My Posts",  Icon: GridIcon },
          { key: "saved", label: "Saved",     Icon: BookmarkIcon },
        ].map(({ key, label, Icon }) => (
          <TouchableOpacity
            key={key}
            style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10, backgroundColor: activeTab === key ? C.accent : "transparent" }}
            onPress={() => setActiveTab(key)}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Icon size={14} color={activeTab === key ? "#fff" : C.textMuted} />
              <Text style={{ color: activeTab === key ? "#fff" : C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 14 }}>
                {label}
              </Text>
              {key === "saved" && savedCount > 0 && (
                <View style={{ backgroundColor: activeTab === "saved" ? "rgba(255,255,255,0.3)" : C.accent, borderRadius: 10, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 5 }}>
                  <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 10 }}>{savedCount > 99 ? "99+" : savedCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Empty state */}
      {currentPosts.length === 0 && !spinner.visible && (
        <View style={{ alignItems: "center", paddingVertical: 40, paddingHorizontal: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center", marginBottom: 14 }}>
            {activeTab === "posts"
              ? <FileEditIcon size={44} color={C.textMuted} />
              : <BookmarkIcon size={44} color={C.textMuted} />
            }
          </View>
          <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 8 }}>
            {activeTab === "posts" ? "No posts yet" : "No saved posts"}
          </Text>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 }}>
            {activeTab === "posts"
              ? "Share your first story — this is your safe space"
              : "Save posts that resonate with you and find them here anytime"}
          </Text>
        </View>
      )}
    </View>
  );

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={currentPosts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onDeleted={handleDeleted}
            onHidden={(hiddenId) => setSavedPosts((prev) => prev.filter((p) => p._id !== hiddenId))}
            onEdited={(id, content, mood) =>
              setMyPosts((prev) => prev.map((p) => p._id === id ? { ...p, content, mood } : p))
            }
          />
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ padding: 16, paddingTop: 56 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.accent} />
        }
      />

      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />

      <NoNetworkOverlay
        visible={showNoNetwork}
        action="profile"
        onRetry={() => { if (isConnected) { setShowNoNetwork(false); fetchAll(); } }}
      />

      {/* Bio edit modal */}
      <Modal visible={showBioModal} transparent animationType="slide" onRequestClose={() => setShowBioModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: C.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <PencilIcon size={18} color={C.accentSoft} />
              <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22 }}>Edit bio</Text>
            </View>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 16 }}>
              Describe yourself in a few words
            </Text>
            <TextInput
              style={{ backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15, minHeight: 80 }}
              value={bioText}
              onChangeText={setBioText}
              placeholder="e.g. On a journey to healing"
              placeholderTextColor={C.textMuted}
              maxLength={100}
              multiline
              autoFocus
            />
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "right", marginTop: 6, marginBottom: 14 }}>
              {bioText.length}/100
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: "center" }}
                onPress={() => setShowBioModal(false)}
              >
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: C.accent, alignItems: "center", opacity: savingBio ? 0.6 : 1 }}
                onPress={handleSaveBio}
                disabled={savingBio}
              >
                {savingBio
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 }}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}