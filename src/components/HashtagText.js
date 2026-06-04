import { Text, StyleSheet } from "react-native";

const HASHTAG_COLOR = "#9B6FD4";

/**
 * Renders text with hashtags highlighted in purple and tappable.
 * Usage: <HashtagText text={post.content} onHashtagPress={(tag) => navigate} style={styles.content} />
 */
export default function HashtagText({ text, onHashtagPress, style, numberOfLines }) {
  if (!text) return null;

  // Split on hashtag boundaries keeping the delimiter
  const parts = text.split(/(#\w+)/g);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) => {
        if (/^#\w+/.test(part)) {
          return (
            <Text
              key={index}
              style={styles.hashtag}
              onPress={() => onHashtagPress && onHashtagPress(part.toLowerCase())}
            >
              {part}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
}


const styles = StyleSheet.create({
  hashtag: {
    color: HASHTAG_COLOR,
    fontFamily: "Nunito_600SemiBold",
  },
});
