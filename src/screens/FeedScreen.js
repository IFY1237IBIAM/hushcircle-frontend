import { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, FlatList,
  RefreshControl, ActivityIndicator,
  TouchableOpacity, Animated, Alert,
  ScrollView,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/api";
import PostCard from "../components/PostCard";
import RepostCard, { RepostConfirmModal } from "../components/RepostCard";
import { useNetwork } from "../context/NetworkContext";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import NoNetworkOverlay from "../components/NoNetworkOverlay";
import HushCircleSpinner from "../components/HushCircleSpinner";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useSpinner from "../hooks/useSpinner";
import { getLocalDateString } from "../utils/dateHelpers";

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const SparklesIcon = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"
      fill={color + "55"} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75L19 3z"
      fill={color} stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 15l.75 2.25L8 18l-2.25.75L5 21l-.75-2.25L2 18l2.25-.75L5 15z"
      fill={color} stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LeafIcon = ({ size = 42, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 8-12 9"
      fill={color + "22"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Mood meta for Circle Pulse ───────────────────────────────────────────────
// Color and emoji for each mood key — used only inside CirclePulseBar.
// These are intentionally fixed (not theme-dependent) so the bar always
// reads like an emotional colour palette regardless of dark/light mode.

const PULSE_MOOD_META = {
  heartbreak: { color: "#D4607A", label: "Heartbreak" },
  fear:       { color: "#6B9FD4", label: "Anxious"    },
  sadness:    { color: "#7B8FD4", label: "Sad"        },
  struggle:   { color: "#D4A44C", label: "Struggling" },
  hope:       { color: "#4CAF8F", label: "Hopeful"    },
  joy:        { color: "#9B6FD4", label: "Good"       },
  calm:       { color: "#C4A3E8", label: "Calm"       },
};

// Small inline SVG mood dots for the dominant mood badge
const MoodDotIcon = ({ color, size = 8 }) => (
  <Svg width={size} height={size} viewBox="0 0 8 8" fill="none">
    <Circle cx="4" cy="4" r="4" fill={color} />
  </Svg>
);

// Ordered from "heavier" to "lighter" for the mini mood bar left→right display.
const MOOD_BAR_ORDER = ["heartbreak", "fear", "sadness", "struggle", "hope", "joy", "calm"];

// ─── CirclePulseBar ───────────────────────────────────────────────────────────

function CirclePulseBar({ navigation, colors: C }) {
  const [pulses, setPulses]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [visible, setVisible]   = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchPulse = useCallback(async () => {
    try {
      const localDate = getLocalDateString();
      const res = await api.get(`/checkin/circle-pulse?localDate=${localDate}`);
      const data = res.data.pulses || [];
      setPulses(data);
      if (data.length > 0) {
        setVisible(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      } else {
        setVisible(false);
        fadeAnim.setValue(0);
      }
    } catch (e) {
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPulse();
    }, [fetchPulse])
  );

  if (!visible && !loading) return null;

  if (loading) {
    return (
      <View style={{ borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 12, paddingHorizontal: 16 }}>
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_700Bold", fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10 }}>
          Circle Pulse
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ width: 150, height: 82, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, marginRight: 10, opacity: 0.5 }} />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <Animated.View style={{ borderBottomWidth: 1, borderBottomColor: C.border, paddingTop: 12, paddingBottom: 14, opacity: fadeAnim }}>
      <Text style={{ color: C.textMuted, fontFamily: "Nunito_700Bold", fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10, paddingHorizontal: 16 }}>
        Circle Pulse · Today
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        {pulses.map((pulse) => {
          const dominant = PULSE_MOOD_META[pulse.dominantMood] || PULSE_MOOD_META.hope;
          const total    = pulse.totalCheckIns;

          const barSegments = MOOD_BAR_ORDER
            .filter((key) => (pulse.moodCounts[key] || 0) > 0)
            .map((key) => ({
              key,
              color: PULSE_MOOD_META[key].color,
              flex:  pulse.moodCounts[key] / total,
            }));

          return (
            <TouchableOpacity
              key={pulse.groupId}
              activeOpacity={0.75}
              onPress={() =>
                navigation.navigate("Groups", {
                  screen: "GroupChat",
                  params: {
                    group: {
                      _id:         pulse.groupId,
                      name:        pulse.groupName,
                      icon:        pulse.groupIcon,
                      memberCount: 0,
                    },
                  },
                })
              }
              style={{
                width: 158, borderRadius: 16, backgroundColor: C.card,
                borderWidth: 1.5, borderColor: dominant.color + "44", padding: 12,
                shadowColor: dominant.color, shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18, shadowRadius: 6, elevation: 3,
              }}
            >
              {/* Top row: icon + circle name */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <View style={{
                  width: 30, height: 30, borderRadius: 15,
                  backgroundColor: dominant.color + "22",
                  justifyContent: "center", alignItems: "center",
                  borderWidth: 1, borderColor: dominant.color + "44",
                }}>
                  {/* groupIcon is server-provided emoji data — left as Text */}
                  <Text style={{ fontSize: 15 }}>{pulse.groupIcon}</Text>
                </View>
                <Text numberOfLines={1} style={{ flex: 1, color: C.text, fontFamily: "Nunito_700Bold", fontSize: 12 }}>
                  {pulse.groupName}
                </Text>
              </View>

              {/* Check-in count + dominant mood badge */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11 }}>
                  {total} check-in{total !== 1 ? "s" : ""} today
                </Text>
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 4,
                  backgroundColor: dominant.color + "18",
                  borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
                }}>
                  <MoodDotIcon color={dominant.color} size={7} />
                  <Text style={{ color: dominant.color, fontFamily: "Nunito_600SemiBold", fontSize: 10 }}>
                    {dominant.label}
                  </Text>
                </View>
              </View>

              {/* Mini proportional mood bar */}
              <View style={{ flexDirection: "row", height: 5, borderRadius: 3, overflow: "hidden", backgroundColor: C.border }}>
                {barSegments.map((seg, idx) => (
                  <View
                    key={seg.key}
                    style={{
                      flex: seg.flex, backgroundColor: seg.color,
                      borderTopLeftRadius:    idx === 0 ? 3 : 0,
                      borderBottomLeftRadius: idx === 0 ? 3 : 0,
                      borderTopRightRadius:    idx === barSegments.length - 1 ? 3 : 0,
                      borderBottomRightRadius: idx === barSegments.length - 1 ? 3 : 0,
                    }}
                  />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

// ─── FeedScreen ───────────────────────────────────────────────────────────────

export default function FeedScreen({ route, navigation }) {
  const { colors: COLORS } = useTheme();

  const [posts, setPosts]                   = useState([]);
  const [ownPost, setOwnPost]               = useState(null);
  const [scrollTargetId, setScrollTargetId] = useState(null);
  const [refreshing, setRefreshing]         = useState(false);
  const [loadingMore, setLoadingMore]       = useState(false);
  const [hasMore, setHasMore]               = useState(true);
  const [showNoNetwork, setShowNoNetwork]   = useState(false);
  const [hasNewPosts, setHasNewPosts]       = useState(false);
  const [checkingNew, setCheckingNew]       = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmPostId, setConfirmPostId]   = useState(null);
  const [confirmThought, setConfirmThought] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  const { isConnected } = useNetwork();
  const { socket }      = useSocket();
  const { user }        = useAuth();
  const flatListRef     = useRef(null);
  const newPostsBtnAnim = useRef(new Animated.Value(0)).current;
  const spinner         = useSpinner();

  const isScrolledDown       = useRef(false);
  const lastHeaderTap        = useRef(0);
  const lastCheckedId        = useRef(null);
  const HEADER_TAP_COOLDOWN_MS = 10000;

  const handleHeaderTap = async () => {
    if (refreshing) return;
    if (isScrolledDown.current) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      return;
    }
    const now = Date.now();
    if (now - lastHeaderTap.current < HEADER_TAP_COOLDOWN_MS) return;
    lastHeaderTap.current = now;
    hideNewPostsBtn();
    setRefreshing(true);
    setOwnPost(null);
    await fetchPosts(true);
    setRefreshing(false);
  };

  const handleScroll = (event) => {
    isScrolledDown.current = event.nativeEvent.contentOffset.y > 80;
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", (e) => {
      if (!navigation.isFocused()) return;
      e.preventDefault();
      handleHeaderTap();
    });
    return unsubscribe;
  }, [navigation, refreshing]);

  const getHiddenKey = () =>
    `hushcircle_hidden_posts_${user?._id || user?.id || "guest"}`;

  const getHiddenIds = async () => {
    try {
      const raw = await AsyncStorage.getItem(getHiddenKey());
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  };

  useEffect(() => {
    if (route?.params?.newPost) {
      const newPost = route.params.newPost;
      setOwnPost({ ...newPost, _isOwn: true });
      navigation.setParams({ newPost: undefined });
      setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
    }
  }, [route?.params?.newPost]);

  useEffect(() => {
    const params = route?.params || {};
    if (params.postId) {
      setScrollTargetId(params.postId);
      navigation.setParams({ postId: undefined });
    } else if (params.scrollToPostId) {
      setScrollTargetId(params.scrollToPostId);
      navigation.setParams({ scrollToPostId: undefined });
    }
  }, [route?.params?.postId, route?.params?.scrollToPostId]);

  useEffect(() => {
    if (!scrollTargetId) return;
    const scrollToPost = async () => {
      let index = feedData.findIndex((p) => {
        if (p.isRepostItem) return p.originalPost?._id === scrollTargetId;
        return p._id === scrollTargetId;
      });
      if (index === -1) {
        try {
          const res = await api.get(`/posts/${scrollTargetId}`);
          const targetPost = res.data.post;
          if (targetPost) {
            setPosts((prev) => {
              const exists = prev.some((p) => p._id === targetPost._id);
              return exists ? prev : [targetPost, ...prev];
            });
            index = 0;
          }
        } catch (e) { return; }
      }
      if (index !== -1) {
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
          setScrollTargetId(null);
        });
      }
    };
    scrollToPost();
  }, [posts, scrollTargetId]);

  const handleContentSizeChange = () => {
    if (scrollTargetId && feedData.length > 0) {
      const index = feedData.findIndex((p) => {
        if (p.isRepostItem) return p.originalPost?._id === scrollTargetId;
        return p._id === scrollTargetId;
      });
      if (index !== -1) {
        flatListRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.3 });
        setScrollTargetId(null);
      }
    }
  };

  const showNewPostsBtn = () => {
    setHasNewPosts(true);
    Animated.spring(newPostsBtnAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
  };

  const hideNewPostsBtn = () => {
    Animated.timing(newPostsBtnAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(() => setHasNewPosts(false));
  };

  useEffect(() => {
    if (!socket) return;

    const handleComment = (data) => {
      setOwnPost((prev) => {
        if (!prev || prev._id !== data.postId) return prev;
        const exists = (prev.comments || []).some((c) => c._id === data.comment._id);
        if (exists) return prev;
        return { ...prev, comments: [...(prev.comments || []), data.comment] };
      });
      setPosts((prev) => prev.map((p) => {
        if (p.isRepostItem) {
          if (p.originalPost?._id !== data.postId) return p;
          const exists = (p.originalPost.comments || []).some((c) => c._id === data.comment._id);
          if (exists) return p;
          return { ...p, originalPost: { ...p.originalPost, comments: [...(p.originalPost.comments || []), data.comment] } };
        }
        if (p._id !== data.postId) return p;
        const exists = (p.comments || []).some((c) => c._id === data.comment._id);
        if (exists) return p;
        return { ...p, comments: [...(p.comments || []), data.comment] };
      }));
    };

    const handleReaction = (data) => {
      setOwnPost((prev) => {
        if (!prev || prev._id !== data.postId) return prev;
        return { ...prev, reactionCounts: data.reactionCounts, totalReactions: data.totalReactions };
      });
      setPosts((prev) => prev.map((p) => {
        if (p.isRepostItem) {
          if (p.originalPost?._id !== data.postId) return p;
          return { ...p, originalPost: { ...p.originalPost, reactionCounts: data.reactionCounts, totalReactions: data.totalReactions } };
        }
        if (p._id !== data.postId) return p;
        return { ...p, reactionCounts: data.reactionCounts, totalReactions: data.totalReactions };
      }));
    };

    const handleRepostComment = (data) => {
      setPosts((prev) => prev.map((p) => {
        if (!p.isRepostItem || p.repostId !== data.repostId) return p;
        const exists = (p.repostComments || []).some((c) => c._id === data.comment._id);
        if (exists) return p;
        return { ...p, repostComments: [...(p.repostComments || []), data.comment], repostCommentCount: data.repostCommentCount };
      }));
    };

    socket.on("comment_added", handleComment);
    socket.on("reaction_updated", handleReaction);
    socket.on("repost_comment_added", handleRepostComment);
    return () => {
      socket.off("comment_added", handleComment);
      socket.off("reaction_updated", handleReaction);
      socket.off("repost_comment_added", handleRepostComment);
    };
  }, [socket]);

  const fetchPosts = async (refresh = false) => {
    if (!isConnected) { setShowNoNetwork(true); setRefreshing(false); return; }
    try {
      const hiddenIds = await getHiddenIds();
      if (refresh) {
        const res = await api.get("/posts?limit=10");
        const newPosts = res.data.posts.filter(
          (p) => !hiddenIds.has(p._id) && p.pseudonym !== user?.pseudonym
        );
        setPosts(newPosts);
        setHasMore(res.data.posts.length === 10);
        if (newPosts.length > 0) lastCheckedId.current = newPosts[0]._id;
      } else {
        if (posts.length === 0) return;
        const lastId = posts[posts.length - 1]._id;
        const res = await api.get(`/posts?lastId=${lastId}&limit=10`);
        const newPosts = res.data.posts.filter(
          (p) => !hiddenIds.has(p._id) && p.pseudonym !== user?.pseudonym
        );
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          return [...prev, ...newPosts.filter((p) => !existingIds.has(p._id))];
        });
        setHasMore(res.data.posts.length === 10);
      }
      setShowNoNetwork(false);
    } catch (error) {
      console.log("Feed error:", error.message);
      if (error.message === "Network Error") setShowNoNetwork(true);
    }
  };

  const checkForNewPosts = async () => {
    if (!isConnected || checkingNew) return;
    setCheckingNew(true);
    try {
      const res = await api.get("/posts?limit=1");
      const latestPost = res.data.posts?.[0];
      if (latestPost && latestPost.pseudonym === user?.pseudonym) return;
      const firstItem = posts[0];
      const firstId = firstItem?.isRepostItem ? firstItem.originalPost?._id : firstItem?._id;
      if (latestPost && posts.length > 0 && latestPost._id !== firstId) showNewPostsBtn();
    } catch (e) {
    } finally { setCheckingNew(false); }
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const hasNewPostParam = !!route?.params?.newPost;
      if (!hasNewPostParam) {
        spinner.withSpinner(async () => {
          if (active) await fetchPosts(true);
        }, "Loading stories...");
      }
      const interval = setInterval(checkForNewPosts, 30000);
      return () => { active = false; clearInterval(interval); };
    }, [isConnected, user?._id])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    hideNewPostsBtn();
    setOwnPost(null);
    await fetchPosts(true);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPosts(false);
    setLoadingMore(false);
  };

  const handleSeeNewPosts = async () => {
    hideNewPostsBtn();
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setRefreshing(true);
    setOwnPost(null);
    await fetchPosts(true);
    setRefreshing(false);
  };

  const handleDeleted = (deletedId) => {
    if (ownPost?._id === deletedId) setOwnPost(null);
    setPosts((prev) => prev.filter((p) => {
      if (p.isRepostItem) return p.originalPost?._id !== deletedId;
      return p._id !== deletedId;
    }));
  };

  const handleHidden = async (hiddenId) => {
    if (ownPost?._id === hiddenId) setOwnPost(null);
    try {
      const key = getHiddenKey();
      const raw = await AsyncStorage.getItem(key);
      const existing = raw ? JSON.parse(raw) : [];
      if (!existing.includes(hiddenId)) {
        await AsyncStorage.setItem(key, JSON.stringify([...existing, hiddenId]));
      }
    } catch (e) {}
    setPosts((prev) => prev.filter((p) => {
      if (p.isRepostItem) return p.originalPost?._id !== hiddenId;
      return p._id !== hiddenId;
    }));
  };

  const handleReposted = (postId, newCount) => {
    if (ownPost?._id === postId) {
      setOwnPost((prev) => prev ? { ...prev, repostCount: newCount, isReposted: true } : prev);
    }
    setPosts((prev) => prev.map((p) => {
      if (p.isRepostItem && p.originalPost?._id === postId) return { ...p, originalPost: { ...p.originalPost, repostCount: newCount, isReposted: true } };
      if (p._id === postId) return { ...p, repostCount: newCount, isReposted: true };
      return p;
    }));
  };

  const handleUnreposted = (postId, newCount) => {
    if (ownPost?._id === postId) {
      setOwnPost((prev) => prev ? { ...prev, repostCount: newCount, isReposted: false } : prev);
    }
    setPosts((prev) => prev.map((p) => {
      if (p.isRepostItem && p.originalPost?._id === postId) return { ...p, originalPost: { ...p.originalPost, repostCount: newCount, isReposted: false } };
      if (p._id === postId) return { ...p, repostCount: newCount, isReposted: false };
      return p;
    }));
  };

  const openRepostConfirm = (postId) => {
    setConfirmPostId(postId);
    setConfirmThought("");
    setConfirmVisible(true);
  };

  const handleConfirmRepost = async () => {
    if (!confirmPostId || confirmLoading) return;
    if (!isConnected) { setShowNoNetwork(true); return; }
    setConfirmLoading(true);
    await spinner.withSpinner(async () => {
      try {
        const res = await api.post(`/posts/${confirmPostId}/repost`, { thought: confirmThought, confirmed: true });
        handleReposted(confirmPostId, res.data.repostCount);
        setConfirmVisible(false);
        setConfirmThought("");
      } catch (e) {
        const msg = e.response?.data?.message || "";
        if (msg) Alert.alert("Couldn't repost", msg);
        else setConfirmVisible(false);
      } finally { setConfirmLoading(false); }
    }, "Sharing this story…");
  };

  const feedData = ownPost ? [ownPost, ...posts] : posts;

  const renderItem = ({ item }) => {
    if (item.isRepostItem) {
      if (!item.originalPost) return null;
      return (
        <RepostCard
          repostItem={item}
          onDeleted={handleDeleted}
          onHidden={handleHidden}
          onEdited={(id, content, mood) =>
            setPosts((prev) => prev.map((p) => {
              if (p.isRepostItem && p.originalPost?._id === id) return { ...p, originalPost: { ...p.originalPost, content, mood } };
              if (p._id === id) return { ...p, content, mood };
              return p;
            }))
          }
          onReposted={handleReposted}
          onUnreposted={handleUnreposted}
          currentUserId={user?._id?.toString()}
          currentPseudonym={user?.pseudonym}
        />
      );
    }

    return (
      <PostCard
        post={item}
        isSaved={item.isSaved}
        userReaction={item.userReaction}
        hasReacted={item.hasReacted}
        onDeleted={handleDeleted}
        onHidden={item._isOwn ? undefined : handleHidden}
        onEdited={(id, content, mood) => {
          if (ownPost?._id === id) setOwnPost((prev) => prev ? { ...prev, content, mood } : prev);
          setPosts((prev) => prev.map((p) => (p._id === id ? { ...p, content, mood } : p)));
        }}
        onReposted={handleReposted}
        onUnreposted={handleUnreposted}
        onRepostPress={item.allowReposts !== false && !item._isOwn ? openRepostConfirm : undefined}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>

      {/* ── App Header ── */}
      <TouchableOpacity
        style={{
          paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
          borderBottomWidth: 1, borderBottomColor: COLORS.border,
          backgroundColor: COLORS.card,
        }}
        onPress={handleHeaderTap}
        activeOpacity={0.75}
      >
        <Text style={{ fontSize: 32, color: COLORS.text, fontFamily: "DMSerifDisplay_400Regular" }}>
          HushCircle
        </Text>
        <Text style={{ fontSize: 13, color: COLORS.textMuted, fontFamily: "Nunito_400Regular", marginTop: 2 }}>
          {refreshing ? "Loading new stories…" : "You are not alone"}
        </Text>
      </TouchableOpacity>

      {/* ── Circle Pulse Bar ── */}
      <CirclePulseBar navigation={navigation} colors={COLORS} />

      {/* ── New posts banner ── */}
      {hasNewPosts && (
        <Animated.View
          style={{
            alignItems: "center", marginTop: 10, zIndex: 10,
            opacity: newPostsBtnAnim,
            transform: [{ translateY: newPostsBtnAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.accent, borderRadius: 20,
              paddingHorizontal: 20, paddingVertical: 10,
              shadowColor: COLORS.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
            }}
            onPress={handleSeeNewPosts}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <SparklesIcon size={16} color="#fff" />
              <Text style={{ color: "#fff", fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>
                See new posts
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <FlatList
        ref={flatListRef}
        data={feedData}
        onContentSizeChange={handleContentSizeChange}
        keyExtractor={(item) =>
          item._isOwn ? `own_${item._id}` : item.isRepostItem ? `repost_${item.repostId}` : item._id
        }
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 16 }} /> : null
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 32 }}>
            <View style={{
              width: 82, height: 82, borderRadius: 41,
              backgroundColor: COLORS.card,
              borderWidth: 1, borderColor: COLORS.border,
              justifyContent: "center", alignItems: "center",
              marginBottom: 16,
            }}>
              <LeafIcon size={42} color={COLORS.accentSoft} />
            </View>
            <Text style={{ color: COLORS.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 8 }}>
              Be the first to share
            </Text>
            <Text style={{ color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22 }}>
              This is a safe space. Your feelings are valid here.
            </Text>
          </View>
        }
      />

      <RepostConfirmModal
        visible={confirmVisible}
        thought={confirmThought}
        setThought={setConfirmThought}
        onConfirm={handleConfirmRepost}
        onCancel={() => { if (!confirmLoading) setConfirmVisible(false); }}
        loading={confirmLoading}
      />

      <NoNetworkOverlay
        visible={showNoNetwork}
        action="feed"
        onClose={() => setShowNoNetwork(false)}
        onRetry={() => { setShowNoNetwork(false); fetchPosts(true); }}
      />

      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
    </View>
  );
}