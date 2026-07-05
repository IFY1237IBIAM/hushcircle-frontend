import { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, TextInput,
  FlatList, TouchableOpacity, ActivityIndicator,
  ScrollView, Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import api from "../api/api";
import PostCard from "../components/PostCard";
import { useNetwork } from "../context/NetworkContext";
import { useTheme } from "../context/ThemeContext";
import NoNetworkOverlay from "../components/NoNetworkOverlay";

// ── SVG Icons ─────────────────────────────────────────────────────────────

const SearchIcon      = ({ size = 17, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const XIcon           = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ClockIcon       = ({ size = 15, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const UserIcon        = ({ size = 15, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const UsersIcon       = ({ size = 48, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
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
const HashSmallIcon   = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="9" x2="20" y2="9" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="4" y1="15" x2="20" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="10" y1="3" x2="8" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="16" y1="3" x2="14" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const ArrowRightIcon  = ({ size = 18, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 5 19 12 12 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Mood filter icons (colors are fixed per mood)
const MoodAllIcon       = ({ size = 15, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MoodHeartbreakIcon = ({ size = 15, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="8" x2="12" y2="14" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const MoodFearIcon      = ({ size = 15, color = "#6B9FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 15s1.5-2 4-2 4 2 4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);
const MoodSadnessIcon   = ({ size = 15, color = "#7B8FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M16 16s-1.5-2-4-2-4 2-4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);
const MoodStruggleIcon  = ({ size = 15, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 14s1.5 1 4 1 4-1 4-1" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);
const MoodHopeIcon      = ({ size = 15, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2a10 10 0 1 0 10 10" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M12 6v4l3 3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M17 2l3 3-3 3M20 5h-5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Static data ───────────────────────────────────────────────────────────

const RECENT_SEARCHES_KEY = "hushcircle_recent_searches";
const MAX_RECENT = 10;

const timeAgo = (date) => {
  if (!date) return "";
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

// ── User result card ──────────────────────────────────────────────────────

function UserResult({ user, onPress, C }) {
  const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000);
  const isOnline = user.showOnlineStatus && user.isOnline && new Date(user.lastSeen) > threeMinAgo;

  return (
    <TouchableOpacity
      style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border }}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={{ position: "relative" }}>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.accent + "22", justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: C.accent + "55" }}>
          <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 18 }}>{user.pseudonym?.[0]?.toUpperCase()}</Text>
        </View>
        {isOnline && <View style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: C.success, borderWidth: 2, borderColor: C.card }} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 15, marginBottom: 3 }}>@{user.pseudonym}</Text>
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>
          Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </Text>
      </View>
      <ArrowRightIcon size={18} color={C.textMuted} />
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────

export default function SearchScreen() {
  const navigation = useNavigation();
  const { isConnected } = useNetwork();
  const { colors: C } = useTheme();                     // ← live theme colors

  // mood "all" chip uses accent; fixed per theme
  const MOODS = [
    { key: "all",        Icon: MoodAllIcon,         iconColor: C.accent, label: "All" },
    { key: "heartbreak", Icon: MoodHeartbreakIcon,  iconColor: "#D4607A", label: "Heartbreak" },
    { key: "fear",       Icon: MoodFearIcon,        iconColor: "#6B9FD4", label: "Fear" },
    { key: "sadness",    Icon: MoodSadnessIcon,     iconColor: "#7B8FD4", label: "Sadness" },
    { key: "struggle",   Icon: MoodStruggleIcon,    iconColor: "#D4A44C", label: "Struggle" },
    { key: "hope",       Icon: MoodHopeIcon,        iconColor: "#4CAF8F", label: "Hope" },
  ];

  const [query, setQuery]               = useState("");
  const [activeTab, setActiveTab]       = useState("posts");
  const [moodFilter, setMoodFilter]     = useState("all");
  const [posts, setPosts]               = useState([]);
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [searched, setSearched]         = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [inputFocused, setInputFocused] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => { loadRecentSearches(); }, []);

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
      const filtered = existing.filter((s) => !(s.query.toLowerCase() === q.trim().toLowerCase() && s.type === type));
      const updated = [{ query: q.trim(), type, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT);
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
    try { await AsyncStorage.removeItem(RECENT_SEARCHES_KEY); setRecentSearches([]); } catch (e) {}
  };

  const doSearch = useCallback(async (q, tab, mood, saveToRecent = false) => {
    if (!q.trim() || q.trim().length < 2) { setPosts([]); setUsers([]); setSearched(false); return; }
    if (!isConnected) { setShowNoNetwork(true); return; }
    setLoading(true); setSearched(true); Keyboard.dismiss();
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
    } catch (e) { console.log("Search error:", e.message); }
    finally { setLoading(false); }
  }, [isConnected]);

  const handleQueryChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(text, activeTab, moodFilter, false), 500);
    } else { setPosts([]); setUsers([]); setSearched(false); }
  };

  const handleSubmit        = () => { if (debounceRef.current) clearTimeout(debounceRef.current); doSearch(query, activeTab, moodFilter, true); };
  const handleRecentTap     = (item) => { setQuery(item.query); setActiveTab(item.type === "user" ? "users" : "posts"); doSearch(item.query, item.type === "user" ? "users" : "posts", moodFilter, false); };
  const handleTabChange     = (tab) => { setActiveTab(tab); setPosts([]); setUsers([]); if (query.trim().length >= 2) doSearch(query, tab, moodFilter, false); };
  const handleMoodChange    = (mood) => { setMoodFilter(mood); if (query.trim().length >= 2) doSearch(query, "posts", mood, false); };
  const handleClear         = () => { setQuery(""); setPosts([]); setUsers([]); setSearched(false); };
  const handlePostDeleted   = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));
  const handlePostHidden    = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));

  const showRecent = inputFocused && query.trim().length === 0 && recentSearches.length > 0;

  // ── Empty state helper ────────────────────────────────────────────────────
  const EmptyState = ({ Icon, title, text }) => (
    <View style={{ alignItems: "center", paddingTop: 60 }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center", marginBottom: 14 }}>
        <Icon size={40} color={C.textMuted} />
      </View>
      <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 8 }}>{title}</Text>
      <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 32 }}>{text}</Text>
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* Header */}
      <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 32, color: C.text, fontFamily: "DMSerifDisplay_400Regular" }}>Search</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
          <SearchIcon size={13} color={C.textMuted} />
          <Text style={{ fontSize: 13, color: C.textMuted, fontFamily: "Nunito_400Regular" }}>Find posts and people</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, marginHorizontal: 16, marginBottom: 4 }}>
        <SearchIcon size={17} color={C.textMuted} />
        <TextInput
          style={{ flex: 1, paddingVertical: 13, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15 }}
          placeholder="Search posts, #hashtags, or @people..."
          placeholderTextColor={C.textMuted}
          value={query}
          onChangeText={handleQueryChange}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setTimeout(() => setInputFocused(false), 150)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: C.textMuted + "88", justifyContent: "center", alignItems: "center" }}>
              <XIcon size={10} color={C.bg} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent searches dropdown */}
      {showRecent && (
        <View style={{ backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginHorizontal: 16, marginBottom: 8, overflow: "hidden" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_700Bold", fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>Recent searches</Text>
            <TouchableOpacity onPress={clearAllRecent} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: C.error, fontFamily: "Nunito_600SemiBold", fontSize: 12 }}>Clear all</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map((item, index) => (
            <View key={index} style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: C.border + "88" }}>
              <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 11 }} onPress={() => handleRecentTap(item)} activeOpacity={0.7}>
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: C.inputBg, justifyContent: "center", alignItems: "center" }}>
                  {item.type === "user"
                    ? <UserIcon size={15} color={C.accentSoft} />
                    : <ClockIcon size={15} color={C.textMuted} />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 14, marginBottom: 2 }}>{item.query}</Text>
                  <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11 }}>{item.type === "user" ? "People" : "Posts"} · {timeAgo(item.timestamp)} ago</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 14, justifyContent: "center", alignItems: "center" }} onPress={() => deleteOneRecent(index)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <XIcon size={12} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Tabs */}
      <View style={{ flexDirection: "row", marginHorizontal: 16, marginTop: 8, marginBottom: 10, gap: 8 }}>
        {[{ key: "posts", label: "Posts", Icon: FileTextIcon }, { key: "users", label: "People", Icon: UsersIcon }].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={{ flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: "center", borderWidth: 1, backgroundColor: activeTab === tab.key ? C.accent : C.card, borderColor: activeTab === tab.key ? C.accent : C.border }}
            onPress={() => handleTabChange(tab.key)}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <tab.Icon size={14} color={activeTab === tab.key ? "#fff" : C.textMuted} />
              <Text style={{ color: activeTab === tab.key ? "#fff" : C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 13 }}>{tab.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mood filter */}
      {activeTab === "posts" && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 10 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1, backgroundColor: moodFilter === m.key ? C.accent + "22" : C.card, borderColor: moodFilter === m.key ? C.accent : C.border }}
              onPress={() => handleMoodChange(m.key)}
            >
              <m.Icon size={14} color={moodFilter === m.key ? m.iconColor : C.textMuted} />
              <Text style={{ color: moodFilter === m.key ? C.accentSoft : C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 12 }}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Hashtag shortcut */}
      {query.startsWith("#") && activeTab === "posts" && (
        <TouchableOpacity style={{ backgroundColor: C.accent + "22", borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: C.accent + "44" }} onPress={() => navigation.navigate("Hashtag", { tag: query })}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <HashSmallIcon size={14} color={C.accent} />
            <Text style={{ color: C.accent, fontFamily: "Nunito_600SemiBold", fontSize: 14, flex: 1 }}>See all posts tagged {query}</Text>
            <ArrowRightIcon size={14} color={C.accent} />
          </View>
        </TouchableOpacity>
      )}

      {/* Loading */}
      {loading && (
        <View style={{ alignItems: "center", paddingTop: 40, gap: 10 }}>
          <ActivityIndicator color={C.accent} />
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14 }}>Searching...</Text>
        </View>
      )}

      {/* Posts results */}
      {!loading && activeTab === "posts" && (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PostCard post={item} onDeleted={handlePostDeleted} onHidden={handlePostHidden}
              onEdited={(id, content, mood) => setPosts((prev) => prev.map((p) => p._id === id ? { ...p, content, mood } : p))} />
          )}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searched
              ? <EmptyState Icon={FileTextIcon} title="No posts found" text="Try different words or use the hashtag shortcut above" />
              : !showRecent ? <EmptyState Icon={({ size, color }) => <SearchIcon size={size} color={color} />} title="Start searching" text="Search by keywords, moods, or hashtags" /> : null
          }
        />
      )}

      {/* Users results */}
      {!loading && activeTab === "users" && (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <UserResult user={item} C={C} onPress={() => { saveRecentSearch(item.pseudonym, "user"); navigation.navigate("UserProfile", { pseudonym: item.pseudonym }); }} />
          )}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searched
              ? <EmptyState Icon={UsersIcon} title="No people found" text="Try searching by pseudonym" />
              : !showRecent ? <EmptyState Icon={UsersIcon} title="Find people" text="Search by pseudonym to view profiles" /> : null
          }
        />
      )}

      <NoNetworkOverlay visible={showNoNetwork} action="search" onClose={() => setShowNoNetwork(false)} onRetry={() => { setShowNoNetwork(false); doSearch(query, activeTab, moodFilter, false); }} />
    </View>
  );
}