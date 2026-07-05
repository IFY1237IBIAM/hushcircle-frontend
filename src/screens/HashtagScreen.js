import { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import api from "../api/api";
import PostCard from "../components/PostCard";
import { useNetwork } from "../context/NetworkContext";
import { useTheme } from "../context/ThemeContext";
import NoNetworkOverlay from "../components/NoNetworkOverlay";

export default function HashtagScreen() {
  const { colors: C } = useTheme();                     // ← live theme colors
  const route      = useRoute();
  const navigation = useNavigation();
  const { tag }    = route.params || {};
  const { isConnected } = useNetwork();

  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]     = useState(true);
  const [showNoNetwork, setShowNoNetwork] = useState(false);

  const normalizedTag = tag?.startsWith("#") ? tag : `#${tag}`;

  const fetchPosts = async (refresh = false) => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    try {
      const lastId    = (!refresh && posts.length > 0) ? posts[posts.length - 1]._id : undefined;
      const params    = lastId ? `?lastId=${lastId}&limit=15` : "?limit=15";
      const encodedTag = encodeURIComponent(normalizedTag.replace("#", ""));
      const res       = await api.get(`/posts/hashtag/${encodedTag}${params}`);
      const newPosts  = res.data.posts || [];
      if (refresh) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => { const ids = new Set(prev.map((p) => p._id)); return [...prev, ...newPosts.filter((p) => !ids.has(p._id))]; });
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

  const handleRefresh  = async () => { setRefreshing(true); await fetchPosts(true); setRefreshing(false); };
  const handleLoadMore = async () => { if (loadingMore || !hasMore) return; setLoadingMore(true); await fetchPosts(false); setLoadingMore(false); };
  const handleDeleted  = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center", gap: 12 }}>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14 }}>Loading {normalizedTag}...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12, backgroundColor: C.card }}>
        <TouchableOpacity style={{ padding: 8 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: C.accent, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.accent, fontFamily: "Nunito_700Bold", fontSize: 20 }}>{normalizedTag}</Text>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2 }}>
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </Text>
        </View>
      </View>

      {/* Banner */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, margin: 16, padding: 16, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.accent + "33" }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: C.accent + "22", justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: C.accent + "55" }}>
          <Text style={{ color: C.accent, fontFamily: "DMSerifDisplay_400Regular", fontSize: 28 }}>#</Text>
        </View>
        <View>
          <Text style={{ color: C.accent, fontFamily: "Nunito_700Bold", fontSize: 18, marginBottom: 2 }}>{normalizedTag}</Text>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>Posts tagged with {normalizedTag}</Text>
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
            onEdited={(id, content, mood) => setPosts((prev) => prev.map((p) => p._id === id ? { ...p, content, mood } : p))}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.accent} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={C.accent} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Text style={{ color: C.accent, fontFamily: "DMSerifDisplay_400Regular", fontSize: 52, marginBottom: 14 }}>#</Text>
            <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 8 }}>No posts yet</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center" }}>Be the first to post with {normalizedTag}</Text>
          </View>
        }
      />

      <NoNetworkOverlay visible={showNoNetwork} action="feed" onClose={() => setShowNoNetwork(false)} onRetry={() => { setShowNoNetwork(false); fetchPosts(true); }} />
    </View>
  );
}