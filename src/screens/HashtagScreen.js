import { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import api from "../api/api";
import PostCard from "../components/PostCard";
import { useNetwork } from "../context/NetworkContext";
import NoNetworkOverlay from "../components/NoNetworkOverlay";import { useTheme } from "../context/ThemeContext";



export default function HashtagScreen() {
  const { colors: COLORS } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { tag } = route.params || {};

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const { isConnected } = useNetwork();

  // Normalize tag — always include #
  const normalizedTag = tag?.startsWith("#") ? tag : `#${tag}`;

  const fetchPosts = async (refresh = false) => {
    if (!isConnected) { setShowNoNetwork(true); return; }

    try {
      const lastId = (!refresh && posts.length > 0)
        ? posts[posts.length - 1]._id
        : undefined;

      const params = lastId
        ? `?lastId=${lastId}&limit=15`
        : "?limit=15";

      const encodedTag = encodeURIComponent(
        normalizedTag.replace("#", "")
      );

      const res = await api.get(`/posts/hashtag/${encodedTag}${params}`);
      const newPosts = res.data.posts || [];

      if (refresh) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          return [...prev, ...newPosts.filter((p) => !existingIds.has(p._id))];
        });
      }

      setHasMore(newPosts.length === 15);
    } catch (e) {
      console.log("Hashtag fetch error:", e.message);
      if (e.message === "Network Error") setShowNoNetwork(true);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPosts(true).finally(() => setLoading(false));
  }, [tag]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(true);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPosts(false);
    setLoadingMore(false);
  };

  const handleDeleted = (id) => {
    setPosts((prev) => prev.filter((p) => p._id !== id));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.accent} size="large" />
        <Text style={styles.loadingText}>Loading {normalizedTag}...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTag}>{normalizedTag}</Text>
          <Text style={styles.headerCount}>
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </Text>
        </View>
      </View>

      {/* Banner */}
      <View style={styles.tagBanner}>
        <View style={styles.tagBannerIcon}>
          <Text style={styles.tagBannerIconText}>#</Text>
        </View>
        <View>
          <Text style={styles.tagBannerName}>{normalizedTag}</Text>
          <Text style={styles.tagBannerDesc}>
            Posts tagged with {normalizedTag}
          </Text>
        </View>
      </View>

      {/* Posts */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onDeleted={handleDeleted}
            onHidden={handleDeleted}
            onEdited={(id, content, mood) =>
              setPosts((prev) =>
                prev.map((p) => p._id === id ? { ...p, content, mood } : p)
              )
            }
          />
        )}
        contentContainerStyle={styles.list}
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
          loadingMore
            ? <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 16 }} />
            : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>#</Text>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>
              Be the first to post with {normalizedTag}
            </Text>
          </View>
        }
      />

      <NoNetworkOverlay
        visible={showNoNetwork}
        action="feed"
        onClose={() => setShowNoNetwork(false)}
        onRetry={() => { setShowNoNetwork(false); fetchPosts(true); }}
      />
    </View>
  );
}

    const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F0A1E" },
    centered: {
    flex: 1, backgroundColor: "#0F0A1E",
    justifyContent: "center", alignItems: "center", gap: 12,
    },
    loadingText: {
    color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 14,
    },

    // Header
    header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2450",
    gap: 12,
    },
    backBtn: { padding: 8 },
    backBtnText: { color: "#9B6FD4", fontSize: 22 },
    headerCenter: { flex: 1 },
    headerTag: {
    color: "#9B6FD4",
    fontFamily: "Nunito_700Bold",
    fontSize: 20,
    },
    headerCount: {
    color: "#8B7FA8",
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    marginTop: 2,
    },

    // Tag banner
    tagBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    margin: 16,
    padding: 16,
    backgroundColor: "#1A1330",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#9B6FD433",
    },
    tagBannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#9B6FD422",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#9B6FD455",
    },
    tagBannerIconText: {
    color: "#9B6FD4",
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 28,
    },
    tagBannerName: {
    color: "#9B6FD4",
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    marginBottom: 2,
    },
    tagBannerDesc: {
    color: "#8B7FA8",
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    },

    // List
    list: { padding: 16, paddingTop: 0 },

    // Empty
    empty: { alignItems: "center", paddingTop: 60 },
    emptyEmoji: {
    color: "#9B6FD4",
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 52,
    marginBottom: 14,
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
    },
    });

