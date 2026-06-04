import { View, Text, StyleSheet } from "react-native";import { useTheme } from "../context/ThemeContext";



const MOOD_CONFIG = {
  heartbreak: { emoji: "💔", color: "#D4607A", label: "Heartbreak" },
  fear: { emoji: "😨", color: "#6B9FD4", label: "Fear" },
  sadness: { emoji: "😢", color: "#7B8FD4", label: "Sadness" },
  struggle: { emoji: "😤", color: "#D4A44C", label: "Struggle" },
  hope: { emoji: "🌿", color: "#4CAF8F", label: "Hope" },
};

export default function RepostEmbed({ post }) {
  const { colors: COLORS } = useTheme();
  if (!post) return null;

  const mood = MOOD_CONFIG[post.mood] || MOOD_CONFIG.sadness;
  const MAX_CHARS = 200;
  const displayText =
    post.content.length > MAX_CHARS
      ? post.content.slice(0, MAX_CHARS) + "..."
      : post.content;

  return (
    <View style={[styles.container, { borderLeftColor: mood.color }]}>
      {/* Embed header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: mood.color + "33" }]}>
          <Text style={styles.avatarText}>
            {post.pseudonym?.[0]?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.pseudonym}>{post.pseudonym}</Text>
          <View style={[styles.moodBadge, { backgroundColor: mood.color + "22" }]}>
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>
          </View>
        </View>
      </View>

      {/* Embed content */}
      <Text style={styles.content}>{displayText}</Text>

      {/* Embed stats */}
      <View style={styles.stats}>
        {post.totalReactions > 0 && (
          <Text style={styles.statText}>🤍 {post.totalReactions}</Text>
        )}
        {post.commentCount > 0 && (
          <Text style={styles.statText}>💬 {post.commentCount}</Text>
        )}
      </View>
    </View>
  );
}


  const styles = StyleSheet.create({

  container: {

  backgroundColor: "#0F0A1E",

  borderRadius: 12,

  padding: 12,

  borderWidth: 1,

  borderColor: "#2D2450",

  borderLeftWidth: 3,

  marginTop: 8,

  marginBottom: 4,

  },

  header: {

  flexDirection: "row",

  alignItems: "center",

  gap: 8,

  marginBottom: 8,

  },

  avatar: {

  width: 28,

  height: 28,

  borderRadius: 14,

  justifyContent: "center",

  alignItems: "center",

  },

  avatarText: {

  color: "#EDE8F5",

  fontFamily: "Nunito_600SemiBold",

  fontSize: 12,

  },

  headerMeta: {

  flexDirection: "row",

  alignItems: "center",

  gap: 8,

  flex: 1,

  flexWrap: "wrap",

  },

  pseudonym: {

  color: "#EDE8F5",

  fontFamily: "Nunito_600SemiBold",

  fontSize: 13,

  },

  moodBadge: {

  flexDirection: "row",

  alignItems: "center",

  gap: 3,

  paddingHorizontal: 8,

  paddingVertical: 2,

  borderRadius: 20,

  },

  moodEmoji: { fontSize: 10 },

  moodLabel: {

  fontFamily: "Nunito_500Medium",

  fontSize: 10,

  },

  content: {

  color: "#8B7FA8",

  fontFamily: "Nunito_400Regular",

  fontSize: 14,

  lineHeight: 22,

  marginBottom: 6,

  },

  stats: {

  flexDirection: "row",

  gap: 12,

  },

  statText: {

  color: "#8B7FA8",

  fontFamily: "Nunito_400Regular",

  fontSize: 12,

  },

  });

