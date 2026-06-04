import { View, StyleSheet } from "react-native";

export default function OnlineDot({
  isOnline,
  showOnlineStatus = true,
  size = 12,
  borderColor = "#1A1330",
}) {
  if (!showOnlineStatus) return null;
  if (isOnline === null || isOnline === undefined) return null;

  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isOnline ? "#4CAF8F" : "#D4607A",
          borderWidth: size > 10 ? 2 : 1.5,
          borderColor,
        },
      ]}
    />
  );
}


const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
});
