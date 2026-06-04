import { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, ActivityIndicator,
  TouchableOpacity, Animated,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/api";
import PostCard from "../components/PostCard";
import RepostCard, { RepostConfirmModal } from "../components/RepostCard";
import { useNetwork } from "../context/NetworkContext";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import NoNetworkOverlay from "../components/NoNetworkOverlay";
import HushCircleSpinner from "../components/HushCircleSpinner";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import useSpinner from "../hooks/useSpinner";import { useTheme } from "../context/ThemeContext";



export default function FeedScreen({ route, navigation }) {
  const { colors: COLORS } = useTheme();
  const [posts, setPosts]                 = useState([]);
  const [scrollTargetId, setScrollTargetId] = useState(null);
  const [refreshing, setRefreshing]       = useState(false);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [hasMore, setHasMore]             = useState(true);
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const [hasNewPosts, setHasNewPosts]     = useState(false);
  const [checkingNew, setCheckingNew]     = useState(false);

  // ── Confirmation modal state ─────────────────────────────────────────────
  const [confirmVisible, setConfirmVisible]   = useState(false);
  const [confirmPostId, setConfirmPostId]     = useState(null);
  const [confirmThought, setConfirmThought]   = useState("");
  const [confirmLoading, setConfirmLoading]   = useState(false);

  const { isConnected }  = useNetwork();
  const { socket }       = useSocket();
  const { user }         = useAuth();
  const flatListRef      = useRef(null);
  const newPostsBtnAnim  = useRef(new Animated.Value(0)).current;
  const spinner          = useSpinner();

  // ── Header tap (Facebook-style) ───────────────────────────────────────────
  // Tracks whether the list is scrolled away from the top
  const isScrolledDown   = useRef(false);
  // Cooldown: prevents repeated taps from hammering the API
  const lastHeaderTap    = useRef(0);
  const HEADER_TAP_COOLDOWN_MS = 10000; // 10s between refreshes, same feel as Facebook

  const handleHeaderTap = async () => {
    if (refreshing) return;

    // If scrolled down → scroll to top first, that's the whole action
    if (isScrolledDown.current) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      return;
    }

    // Already at top — refresh if cooldown has passed
    const now = Date.now();
    if (now - lastHeaderTap.current < HEADER_TAP_COOLDOWN_MS) return;
    lastHeaderTap.current = now;

    hideNewPostsBtn();
    setRefreshing(true);
    await fetchPosts(true);
    setRefreshing(false);
  };

  const handleScroll = (event) => {
    isScrolledDown.current = event.nativeEvent.contentOffset.y > 80;
  };

  // ── Tab icon tap (same logic as header tap) ───────────────────────────────
  // React Navigation fires a 'tabPress' event we can intercept
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", (e) => {
      // Only act if this screen is already focused
      if (!navigation.isFocused()) return;
      // Prevent default tab switch animation (we're already here)
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

  // ── Scroll target from nav params ────────────────────────────────────────
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
      let index = posts.findIndex((p) => {
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
        } catch (e) {
          return;
        }
      }
      if (index !== -1) {
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.3,
          });
          setScrollTargetId(null);
        });
      }
    };
    scrollToPost();
  }, [posts, scrollTargetId]);

  const handleContentSizeChange = () => {
    if (scrollTargetId && posts.length > 0) {
      const index = posts.findIndex((p) => {
        if (p.isRepostItem) return p.originalPost?._id === scrollTargetId;
        return p._id === scrollTargetId;
      });
      if (index !== -1) {
        flatListRef.current?.scrollToIndex({
          index,
          animated: false,
          viewPosition: 0.3,
        });
        setScrollTargetId(null);
      }
    }
  };

  // ── New posts banner ─────────────────────────────────────────────────────
  const showNewPostsBtn = () => {
    setHasNewPosts(true);
    Animated.spring(newPostsBtnAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  };

  const hideNewPostsBtn = () => {
    Animated.timing(newPostsBtnAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setHasNewPosts(false));
  };

  // ── Socket: real-time updates ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleComment = (data) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.isRepostItem) {
            if (p.originalPost?._id !== data.postId) return p;
            const exists = (p.originalPost.comments || []).some(
              (c) => c._id === data.comment._id
            );
            if (exists) return p;
            return {
              ...p,
              originalPost: {
                ...p.originalPost,
                comments: [...(p.originalPost.comments || []), data.comment],
              },
            };
          }
          if (p._id !== data.postId) return p;
          const exists = (p.comments || []).some(
            (c) => c._id === data.comment._id
          );
          if (exists) return p;
          return { ...p, comments: [...(p.comments || []), data.comment] };
        })
      );
    };

    const handleReaction = (data) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.isRepostItem) {
            if (p.originalPost?._id !== data.postId) return p;
            return {
              ...p,
              originalPost: {
                ...p.originalPost,
                reactionCounts: data.reactionCounts,
                totalReactions: data.totalReactions,
              },
            };
          }
          if (p._id !== data.postId) return p;
          return {
            ...p,
            reactionCounts: data.reactionCounts,
            totalReactions: data.totalReactions,
          };
        })
      );
    };

    // Real-time secondary comment on a repost
    const handleRepostComment = (data) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (!p.isRepostItem || p.repostId !== data.repostId) return p;
          const exists = (p.repostComments || []).some(
            (c) => c._id === data.comment._id
          );
          if (exists) return p;
          return {
            ...p,
            repostComments: [...(p.repostComments || []), data.comment],
            repostCommentCount: data.repostCommentCount,
          };
        })
      );
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

  // ── Fetch posts ───────────────────────────────────────────────────────────
  const fetchPosts = async (refresh = false) => {
    if (!isConnected) {
      setShowNoNetwork(true);
      setRefreshing(false);
      return;
    }
    try {
      const hiddenIds = await getHiddenIds();
      if (refresh) {
        const res = await api.get("/posts?limit=10");
        const newPosts = res.data.posts.filter((p) => {
          if (p.isRepostItem) return !hiddenIds.has(p.originalPost?._id);
          return !hiddenIds.has(p._id);
        });
        setPosts(newPosts);
        setHasMore(res.data.posts.length === 10);
      } else {
        if (posts.length === 0) return;
        const lastId = posts[posts.length - 1]._id;
        const res = await api.get(`/posts?lastId=${lastId}&limit=10`);
        const newPosts = res.data.posts.filter((p) => {
          if (p.isRepostItem) return !hiddenIds.has(p.originalPost?._id);
          return !hiddenIds.has(p._id);
        });
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          return [...prev, ...newPosts.filter((p) => !existingIds.has(p._id))];
        });
        setHasMore(res.data.posts.length === 10);
      }
      setShowNoNetwork(false);
    } catch (error) {
      if (error.message === "Network Error") setShowNoNetwork(true);
    }
  };

  const checkForNewPosts = async () => {
    if (!isConnected || checkingNew) return;
    setCheckingNew(true);
    try {
      const res = await api.get("/posts?limit=1");
      const latestPost = res.data.posts?.[0];
      const firstItem = posts[0];
      const firstId = firstItem?.isRepostItem
        ? firstItem.originalPost?._id
        : firstItem?._id;
      if (latestPost && posts.length > 0 && latestPost._id !== firstId) {
        showNewPostsBtn();
      }
    } catch (e) {
    } finally {
      setCheckingNew(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      spinner.withSpinner(async () => {
        if (active) await fetchPosts(true);
      }, "Loading stories...");
      const interval = setInterval(checkForNewPosts, 30000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }, [isConnected, user?._id])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    hideNewPostsBtn();
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
    await fetchPosts(true);
    setRefreshing(false);
  };

  const handleDeleted = (deletedId) => {
    setPosts((prev) =>
      prev.filter((p) => {
        if (p.isRepostItem) return p.originalPost?._id !== deletedId;
        return p._id !== deletedId;
      })
    );
  };

  const handleHidden = async (hiddenId) => {
    try {
      const key = getHiddenKey();
      const raw = await AsyncStorage.getItem(key);
      const existing = raw ? JSON.parse(raw) : [];
      if (!existing.includes(hiddenId)) {
        await AsyncStorage.setItem(
          key,
          JSON.stringify([...existing, hiddenId])
        );
      }
    } catch (e) {}
    setPosts((prev) =>
      prev.filter((p) => {
        if (p.isRepostItem) return p.originalPost?._id !== hiddenId;
        return p._id !== hiddenId;
      })
    );
  };

  // ── Repost count sync ─────────────────────────────────────────────────────
  const handleReposted = (postId, newCount) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.isRepostItem && p.originalPost?._id === postId) {
          return {
            ...p,
            originalPost: { ...p.originalPost, repostCount: newCount, isReposted: true },
          };
        }
        if (p._id === postId) return { ...p, repostCount: newCount, isReposted: true };
        return p;
      })
    );
  };

  const handleUnreposted = (postId, newCount) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.isRepostItem && p.originalPost?._id === postId) {
          return {
            ...p,
            originalPost: { ...p.originalPost, repostCount: newCount, isReposted: false },
          };
        }
        if (p._id === postId) return { ...p, repostCount: newCount, isReposted: false };
        return p;
      })
    );
  };

  // ── Confirmation overlay helpers ──────────────────────────────────────────
  // PostCard calls this instead of calling the API directly.
  // postController now requires confirmed:true so the PostCard should
  // delegate to the feed's modal for the confirmation step.
  const openRepostConfirm = (postId) => {
    setConfirmPostId(postId);
    setConfirmThought("");
    setConfirmVisible(true);
  };

  const handleConfirmRepost = async () => {
    if (!confirmPostId || confirmLoading) return;

    // Network check — show overlay instead of a silent failure
    if (!isConnected) {
      setShowNoNetwork(true);
      return;
    }

    setConfirmLoading(true);
    await spinner.withSpinner(async () => {
      try {
        const res = await api.post(`/posts/${confirmPostId}/repost`, {
          thought: confirmThought,
          confirmed: true,
        });
        handleReposted(confirmPostId, res.data.repostCount);
        setConfirmVisible(false);
        setConfirmThought("");
      } catch (e) {
        const msg = e.response?.data?.message || "";
        if (msg) Alert.alert("Couldn't repost", msg);
        else setConfirmVisible(false);
      } finally {
        setConfirmLoading(false);
      }
    }, "Sharing this story… 💜");
  };

  // ── Render item ───────────────────────────────────────────────────────────
  const renderItem = ({ item }) => {
    if (item.isRepostItem) {
      // Guard: block repost-of-repost at the render level too
      if (!item.originalPost) return null;

      return (
        <RepostCard
          repostItem={item}
          onDeleted={handleDeleted}
          onHidden={handleHidden}
          onEdited={(id, content, mood) =>
            setPosts((prev) =>
              prev.map((p) => {
                if (p.isRepostItem && p.originalPost?._id === id) {
                  return {
                    ...p,
                    originalPost: { ...p.originalPost, content, mood },
                  };
                }
                if (p._id === id) return { ...p, content, mood };
                return p;
              })
            )
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
        onHidden={handleHidden}
        onEdited={(id, content, mood) =>
          setPosts((prev) =>
            prev.map((p) => (p._id === id ? { ...p, content, mood } : p))
          )
        }
        onReposted={handleReposted}
        onUnreposted={handleUnreposted}
        // Pass the confirm-modal opener so PostCard can delegate
        onRepostPress={
          item.allowReposts !== false ? openRepostConfirm : undefined
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={handleHeaderTap}
        activeOpacity={0.75}
      >
        <Text style={styles.headerTitle}>HushCircle</Text>
        <Text style={styles.headerSub}>
          {refreshing ? "Loading new stories…" : "You are not alone 💜"}
        </Text>
      </TouchableOpacity>

      {hasNewPosts && (
        <Animated.View
          style={[
            styles.newPostsBtnWrap,
            {
              opacity: newPostsBtnAnim,
              transform: [
                {
                  translateY: newPostsBtnAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.newPostsBtn}
            onPress={handleSeeNewPosts}
          >
            <View style={styles.newPostsContent}>
              <Ionicons name="sparkles-outline" size={16} color="#fff" />
              <Text style={styles.newPostsBtnText}>See new posts</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <FlatList
        ref={flatListRef}
        data={posts}
        onContentSizeChange={handleContentSizeChange}
        keyExtractor={(item) =>
          item.isRepostItem ? `repost_${item.repostId}` : item._id
        }
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              color={COLORS.accent}
              style={{ marginVertical: 16 }}
            />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="leaf-outline" size={42} color={COLORS.accentSoft} />
            </View>
            <Text style={styles.emptyTitle}>Be the first to share</Text>
            <Text style={styles.emptyText}>
              This is a safe space. Your feelings are valid here.
            </Text>
          </View>
        }
      />

      {/* ── Repost confirmation modal ──────────────────────────────────────── */}
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
        onRetry={() => {
          setShowNoNetwork(false);
          fetchPosts(true);
        }}
      />

      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
    </View>
  );
}


    const styles = StyleSheet.create({

    container: { flex: 1, backgroundColor: "#0F0A1E" },

    header: {

    paddingTop: 56,

    paddingBottom: 16,

    paddingHorizontal: 20,

    borderBottomWidth: 1,

    borderBottomColor: "#2D2450",

    },

    headerTitle: {

    fontSize: 32,

    color: "#EDE8F5",

    fontFamily: "DMSerifDisplay_400Regular",

    },

    headerSub: {

    fontSize: 13,

    color: "#8B7FA8",

    fontFamily: "Nunito_400Regular",

    marginTop: 2,

    },

    newPostsBtnWrap: { alignItems: "center", marginTop: 10, zIndex: 10 },

    newPostsBtn: {

    backgroundColor: "#9B6FD4",

    borderRadius: 20,

    paddingHorizontal: 20,

    paddingVertical: 10,

    shadowColor: "#9B6FD4",

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.4,

    shadowRadius: 8,

    elevation: 6,

    },

    newPostsContent: { flexDirection: "row", alignItems: "center", gap: 6 },

    newPostsBtnText: {

    color: "#fff",

    fontFamily: "Nunito_600SemiBold",

    fontSize: 14,

    },

    list: { padding: 16 },

    empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },

    emptyIconWrap: {

    width: 82,

    height: 82,

    borderRadius: 41,

    backgroundColor: "#1A1330",

    borderWidth: 1,

    borderColor: "#2D2450",

    justifyContent: "center",

    alignItems: "center",

    marginBottom: 16,

    },

    emptyTitle: {

    color: "#EDE8F5",

    fontFamily: "DMSerifDisplay_400Regular",

    fontSize: 22,

    marginBottom: 8,

    },

    emptyText: {

    color: "#8B7FA8",

    fontFamily: "Nunito_400Regular",

    fontSize: 14,

    textAlign: "center",

    lineHeight: 22,

    },

    });

