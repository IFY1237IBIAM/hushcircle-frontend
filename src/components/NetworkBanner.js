import { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";
import Svg, { Path, Circle, Line, Polyline } from "react-native-svg";
import { useNetwork } from "../context/NetworkContext";

// ── SVG Icons ──────────────────────────────────────────────────────────────

const OnlineIcon = ({ size = 22, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="22 4 12 14.01 9 11.01"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const OfflineIcon = ({ size = 22, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="1" y1="1" x2="23" y2="23"
      stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10.71 5.05A16 16 0 0 1 22.56 9"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8.53 16.11a6 6 0 0 1 6.95 0"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="20" x2="12.01" y2="20"
      stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ──────────────────────────────────────────────────────────────────────────

export default function NetworkBanner() {
  const { isConnected, justReconnected } = useNetwork();
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const visible = !isConnected || justReconnected;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -80,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [visible]);

  const bgColor  = justReconnected ? "#4CAF8F" : "#D4607A";
  const title    = justReconnected ? "Back online!" : "No internet connection";
  const subtitle = justReconnected
    ? "Everything is working again"
    : "Check your connection to continue";

  return (
    <Animated.View
      style={[styles.banner, { backgroundColor: bgColor, transform: [{ translateY: slideAnim }] }]}
      pointerEvents="none"
    >
      {justReconnected
        ? <OnlineIcon size={22} color="#fff" />
        : <OfflineIcon size={22} color="#fff" />
      }
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Animated.View>
  );
}


const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 9999,
    paddingTop: 48, paddingBottom: 14, paddingHorizontal: 20,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  title: { color: "#fff", fontFamily: "Nunito_600SemiBold", fontSize: 14 },
  subtitle: { color: "rgba(255,255,255,0.85)", fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2 },
});
