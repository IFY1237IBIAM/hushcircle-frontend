import { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput,
  FlatList, TouchableOpacity, ActivityIndicator,
  ScrollView, Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Circle, Line, Polyline, Rect, G } from "react-native-svg";
import api from "../api/api";
import PostCard from "../components/PostCard";
import { useNetwork } from "../context/NetworkContext";
import NoNetworkOverlay from "../components/NoNetworkOverlay";import { useTheme } from "../context/ThemeContext";

// Module-level color fallbacks for icon defaults (theme-aware colors used inside component)
const DARK = {
  accent: "#9B6FD4",
  textMuted: "#8B7FA8",
};



// ── SVG Icon Components ────────────────────────────────────────────────────

const SearchIcon = ({ size = 17, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const XIcon = ({ size = 14, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClockIcon = ({ size = 15, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UserIcon = ({ size = 15, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UsersIcon = ({ size = 48, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
      stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
    />
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M23 21v-2a4 4 0 0 0-3-3.87"
      stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
    />
    <Path
      d="M16 3.13a4 4 0 0 1 0 7.75"
      stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const FileTextIcon = ({ size = 48, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
    />
    <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const HashIcon = ({ size = 48, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="9" x2="20" y2="9" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Line x1="4" y1="15" x2="20" y2="15" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Line x1="10" y1="3" x2="8" y2="21" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Line x1="16" y1="3" x2="14" y2="21" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const HashSmallIcon = ({ size = 14, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="9" x2="20" y2="9" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="4" y1="15" x2="20" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="10" y1="3" x2="8" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="16" y1="3" x2="14" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const HeartIcon = ({ size = 48, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const ArrowRightIcon = ({ size = 18, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 5 19 12 12 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Mood SVG icons — inline small versions for filter chips
const MoodAllIcon = ({ size = 15, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const MoodHeartbreakIcon = ({ size = 15, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
    <Line x1="12" y1="8" x2="12" y2="14" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const MoodFearIcon = ({ size = 15, color = "#6B9FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 15s1.5-2 4-2 4 2 4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

const MoodSadnessIcon = ({ size = 15, color = "#7B8FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M16 16s-1.5-2-4-2-4 2-4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

const MoodStruggleIcon = ({ size = 15, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 14s1.5 1 4 1 4-1 4-1" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

const MoodHopeIcon = ({ size = 15, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2a10 10 0 1 0 10 10"
      stroke={color} strokeWidth={2} strokeLinecap="round"
    />
    <Path d="M12 6v4l3 3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M17 2l3 3-3 3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20 5h-5" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ──────────────────────────────────────────────────────────────────────────────

const MOODS = [
  { key: "all",        Icon: MoodAllIcon,        iconColor: DARK.accent,  label: "All" },
  { key: "heartbreak", Icon: MoodHeartbreakIcon, iconColor: "#D4607A",      label: "Heartbreak" },
  { key: "fear",       Icon: MoodFearIcon,       iconColor: "#6B9FD4",      label: "Fear" },
  { key: "sadness",    Icon: MoodSadnessIcon,    iconColor: "#7B8FD4",      label: "Sadness" },
  { key: "struggle",   Icon: MoodStruggleIcon,   iconColor: "#D4A44C",      label: "Struggle" },
  { key: "hope",       Icon: MoodHopeIcon,       iconColor: "#4CAF8F",      label: "Hope" },
];

const RECENT_SEARCHES_KEY = "hushcircle_recent_searches";
const MAX_RECENT = 10;

const timeAgo = (date) => {
  if (!date) return "";
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

function UserResult({ user, onPress }) {
  const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000);
  const isOnline =
    user.showOnlineStatus &&
    user.isOnline &&
    new Date(user.lastSeen) > threeMinAgo;

  return (
    <TouchableOpacity style={styles.userCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.userAvatarWrap}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{user.pseudonym?.[0]?.toUpperCase()}</Text>
        </View>
        {isOnline && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userPseudonym}>@{user.pseudonym}</Text>
        <Text style={styles.userMeta}>
          Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </Text>
      </View>
      <ArrowRightIcon size={18} color={DARK.textMuted} />
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const { colors: COLORS } = useTheme();
  const navigation = useNavigation();
  const { isConnected } = useNetwork();

  const [query, setQuery]             = useState("");
  const [activeTab, setActiveTab]     = useState("posts");
  const [moodFilter, setMoodFilter]   = useState("all");
  const [posts, setPosts]             = useState([]);
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [searched, setSearched]       = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [inputFocused, setInputFocused] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) setRecentSearches(JSON.parse(raw));
    } catch (e) {}
  };

  const saveRecentSearch = async (q, type) => {
    if (!q.trim() || q.trim().length < 2) return;
    try {
      const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const filtered = existing.filter(
        (s) => !(s.query.toLowerCase() === q.trim().toLowerCase() && s.type === type)
      );
      const updated = [
        { query: q.trim(), type, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (e) {}
  };

  const deleteOneRecent = async (index) => {
    try {
      const updated = recentSearches.filter((_, i) => i !== index);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (e) {}
  };

  const clearAllRecent = async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (e) {}
  };

  const doSearch = useCallback(async (q, tab, mood, saveToRecent = false) => {
    if (!q.trim() || q.trim().length < 2) {
      setPosts([]); setUsers([]); setSearched(false);
      return;
    }
    if (!isConnected) { setShowNoNetwork(true); return; }

    setLoading(true);
    setSearched(true);
    Keyboard.dismiss();

    try {
      if (tab === "posts") {
        const params = new URLSearchParams({ q: q.trim() });
        if (mood !== "all") params.append("mood", mood);
        const res = await api.get(`/posts/search?${params}`);
        setPosts(res.data.posts || []);
        if (saveToRecent) await saveRecentSearch(q, "post");
      } else {
        const res = await api.get(`/auth/search-users?q=${encodeURIComponent(q.trim())}`);
        setUsers(res.data.users || []);
        if (saveToRecent) await saveRecentSearch(q, "user");
      }
    } catch (e) {
      console.log("Search error:", e.message);
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  const handleQueryChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(text, activeTab, moodFilter, false), 500);
    } else {
      setPosts([]); setUsers([]); setSearched(false);
    }
  };

  const handleSubmit = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSearch(query, activeTab, moodFilter, true);
  };

  const handleRecentTap = (item) => {
    setQuery(item.query);
    setActiveTab(item.type === "user" ? "users" : "posts");
    doSearch(item.query, item.type === "user" ? "users" : "posts", moodFilter, false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPosts([]); setUsers([]);
    if (query.trim().length >= 2) doSearch(query, tab, moodFilter, false);
  };

  const handleMoodChange = (mood) => {
    setMoodFilter(mood);
    if (query.trim().length >= 2) doSearch(query, "posts", mood, false);
  };

  const handleClear = () => {
    setQuery(""); setPosts([]); setUsers([]); setSearched(false);
  };

  const handlePostDeleted = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));
  const handlePostHidden  = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));

  const showRecent = inputFocused && query.trim().length === 0 && recentSearches.length > 0;

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.headerSubRow}>
          <SearchIcon size={13} color={COLORS.textMuted} />
          <Text style={styles.headerSub}>Find posts and people</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchBarWrap}>
        <SearchIcon size={17} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts, #hashtags, or @people..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={handleQueryChange}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setTimeout(() => setInputFocused(false), 150)}
          clearButtonMode="never"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.clearBtnWrap}
          >
            <View style={styles.clearBtnCircle}>
              <XIcon size={10} color={COLORS.bg} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent searches dropdown */}
      {showRecent && (
        <View style={styles.recentDropdown}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent searches</Text>
            <TouchableOpacity onPress={clearAllRecent} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearAllText}>Clear all</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map((item, index) => (
            <View key={index} style={styles.recentRow}>
              <TouchableOpacity
                style={styles.recentItem}
                onPress={() => handleRecentTap(item)}
                activeOpacity={0.7}
              >
                <View style={styles.recentTypeIconWrap}>
                  {item.type === "user"
                    ? <UserIcon size={15} color={COLORS.accentSoft} />
                    : <ClockIcon size={15} color={COLORS.textMuted} />
                  }
                </View>
                <View style={styles.recentItemContent}>
                  <Text style={styles.recentQuery}>{item.query}</Text>
                  <Text style={styles.recentMeta}>
                    {item.type === "user" ? "People" : "Posts"} · {timeAgo(item.timestamp)} ago
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.recentDeleteBtn}
                onPress={() => deleteOneRecent(index)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <XIcon size={12} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: "posts", label: "Posts",  Icon: FileTextIcon  },
          { key: "users", label: "People", Icon: UsersIcon },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => handleTabChange(tab.key)}
          >
            <View style={styles.tabInner}>
              <tab.Icon
                size={14}
                color={activeTab === tab.key ? "#fff" : COLORS.textMuted}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mood filter (posts only) */}
      {activeTab === "posts" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.moodScroll}
          contentContainerStyle={styles.moodRow}
        >
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.moodChip, moodFilter === m.key && styles.moodChipActive]}
              onPress={() => handleMoodChange(m.key)}
            >
              <m.Icon size={14} color={moodFilter === m.key ? m.iconColor : COLORS.textMuted} />
              <Text style={[styles.moodChipText, moodFilter === m.key && styles.moodChipTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Hashtag shortcut */}
      {query.startsWith("#") && activeTab === "posts" && (
        <TouchableOpacity
          style={styles.hashtagShortcut}
          onPress={() => navigation.navigate("Hashtag", { tag: query })}
        >
          <View style={styles.hashtagShortcutInner}>
            <HashSmallIcon size={14} color={COLORS.accent} />
            <Text style={styles.hashtagShortcutText}>See all posts tagged {query}</Text>
            <ArrowRightIcon size={14} color={COLORS.accent} />
          </View>
        </TouchableOpacity>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.accent} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {/* Results — Posts */}
      {!loading && activeTab === "posts" && (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onDeleted={handlePostDeleted}
              onHidden={handlePostHidden}
              onEdited={(id, content, mood) =>
                setPosts((prev) =>
                  prev.map((p) => p._id === id ? { ...p, content, mood } : p)
                )
              }
            />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searched ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <FileTextIcon size={40} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>No posts found</Text>
                <Text style={styles.emptyText}>Try different words or use the hashtag shortcut above</Text>
              </View>
            ) : !searched && !showRecent ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <SearchIcon size={40} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>Start searching</Text>
                <Text style={styles.emptyText}>Search by keywords, moods, or hashtags</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Results — Users */}
      {!loading && activeTab === "users" && (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <UserResult
              user={item}
              onPress={() => {
                saveRecentSearch(item.pseudonym, "user");
                navigation.navigate("UserProfile", { pseudonym: item.pseudonym });
              }}
            />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searched ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <UsersIcon size={40} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>No people found</Text>
                <Text style={styles.emptyText}>Try searching by pseudonym</Text>
              </View>
            ) : !searched && !showRecent ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <UsersIcon size={40} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>Find people</Text>
                <Text style={styles.emptyText}>Search by pseudonym to view profiles</Text>
              </View>
            ) : null
          }
        />
      )}

      <NoNetworkOverlay
        visible={showNoNetwork}
        action="search"
        onClose={() => setShowNoNetwork(false)}
        onRetry={() => { setShowNoNetwork(false); doSearch(query, activeTab, moodFilter, false); }}
      />
    </View>
  );
}


  const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: "#0F0A1E" },


  header: { paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20 },

  headerTitle: { fontSize: 32, color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular" },

  headerSubRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },

  headerSub: { fontSize: 13, color: "#8B7FA8", fontFamily: "Nunito_400Regular" },


  searchBarWrap: {

  flexDirection: "row", alignItems: "center", gap: 10,

  backgroundColor: "#1A1330", borderRadius: 14,

  borderWidth: 1, borderColor: "#2D2450",

  paddingHorizontal: 14, marginHorizontal: 16, marginBottom: 4,

  },

  searchInput: {

  flex: 1, paddingVertical: 13,

  color: "#EDE8F5", fontFamily: "Nunito_400Regular", fontSize: 15,

  },

  clearBtnWrap: { padding: 2 },

  clearBtnCircle: {

  width: 18, height: 18, borderRadius: 9,

  backgroundColor: "#8B7FA8" + "88",

  justifyContent: "center", alignItems: "center",

  },


  // Recent searches

  recentDropdown: {

  backgroundColor: "#1A1330",

  borderRadius: 14, borderWidth: 1, borderColor: "#2D2450",

  marginHorizontal: 16, marginBottom: 8,

  overflow: "hidden",

  },

  recentHeader: {

  flexDirection: "row", justifyContent: "space-between", alignItems: "center",

  paddingHorizontal: 14, paddingVertical: 10,

  borderBottomWidth: 1, borderBottomColor: "#2D2450",

  },

  recentTitle: { color: "#8B7FA8", fontFamily: "Nunito_700Bold", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" },

  clearAllText: { color: "#D4607A", fontFamily: "Nunito_600SemiBold", fontSize: 12 },

  recentRow: {

  flexDirection: "row", alignItems: "center",

  borderBottomWidth: 1, borderBottomColor: "#2D2450" + "88",

  },

  recentItem: {

  flex: 1, flexDirection: "row", alignItems: "center",

  gap: 10, paddingHorizontal: 14, paddingVertical: 11,

  },

  recentTypeIconWrap: {

  width: 30, height: 30, borderRadius: 8,

  backgroundColor: "#0F0A1E",

  justifyContent: "center", alignItems: "center",

  },

  recentItemContent: { flex: 1 },

  recentQuery: { color: "#EDE8F5", fontFamily: "Nunito_600SemiBold", fontSize: 14, marginBottom: 2 },

  recentMeta: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 11 },

  recentDeleteBtn: {

  paddingHorizontal: 14, paddingVertical: 14,

  justifyContent: "center", alignItems: "center",

  },


  // Tabs

  tabs: { flexDirection: "row", marginHorizontal: 16, marginTop: 8, marginBottom: 10, gap: 8 },

  tab: {

  flex: 1, paddingVertical: 9, borderRadius: 12,

  backgroundColor: "#1A1330", alignItems: "center",

  borderWidth: 1, borderColor: "#2D2450",

  },

  tabActive: { backgroundColor: "#9B6FD4", borderColor: "#9B6FD4" },

  tabInner: { flexDirection: "row", alignItems: "center", gap: 6 },

  tabText: { color: "#8B7FA8", fontFamily: "Nunito_600SemiBold", fontSize: 13 },

  tabTextActive: { color: "#fff" },


  // Mood chips

  moodScroll: { flexGrow: 0, marginBottom: 10 },

  moodRow: { paddingHorizontal: 16, gap: 8 },

  moodChip: {

  flexDirection: "row", alignItems: "center", gap: 5,

  backgroundColor: "#1A1330", borderRadius: 20,

  paddingVertical: 7, paddingHorizontal: 12,

  borderWidth: 1, borderColor: "#2D2450",

  },

  moodChipActive: { backgroundColor: "#9B6FD4" + "22", borderColor: "#9B6FD4" },

  moodChipText: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 12 },

  moodChipTextActive: { color: "#C4A3E8" },


  // Hashtag shortcut

  hashtagShortcut: {

  backgroundColor: "#9B6FD4" + "22", borderRadius: 12, padding: 12,

  marginHorizontal: 16, marginBottom: 10,

  borderWidth: 1, borderColor: "#9B6FD4" + "44",

  },

  hashtagShortcutInner: { flexDirection: "row", alignItems: "center", gap: 8 },

  hashtagShortcutText: { color: "#9B6FD4", fontFamily: "Nunito_600SemiBold", fontSize: 14, flex: 1 },


  loadingWrap: { alignItems: "center", paddingTop: 40, gap: 10 },

  loadingText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 14 },


  list: { padding: 16, paddingTop: 4 },


  // User card

  userCard: {

  flexDirection: "row", alignItems: "center", gap: 12,

  backgroundColor: "#1A1330", borderRadius: 16, padding: 14,

  marginBottom: 10, borderWidth: 1, borderColor: "#2D2450",

  },

  userAvatarWrap: { position: "relative" },

  userAvatar: {

  width: 46, height: 46, borderRadius: 23,

  backgroundColor: "#9B6FD4" + "22",

  justifyContent: "center", alignItems: "center",

  borderWidth: 1.5, borderColor: "#9B6FD4" + "55",

  },

  userAvatarText: { color: "#C4A3E8", fontFamily: "Nunito_700Bold", fontSize: 18 },

  onlineDot: {

  position: "absolute", bottom: 0, right: 0,

  width: 12, height: 12, borderRadius: 6,

  backgroundColor: "#4CAF8F", borderWidth: 2, borderColor: "#1A1330",

  },

  userInfo: { flex: 1 },

  userPseudonym: { color: "#EDE8F5", fontFamily: "Nunito_700Bold", fontSize: 15, marginBottom: 3 },

  userMeta: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 12 },


  // Empty states

  empty: { alignItems: "center", paddingTop: 60 },

  emptyIconWrap: {

  width: 80, height: 80, borderRadius: 40,

  backgroundColor: "#1A1330", borderWidth: 1, borderColor: "#2D2450",

  justifyContent: "center", alignItems: "center", marginBottom: 14,

  },

  emptyTitle: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 8 },

  emptyText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },

  });

