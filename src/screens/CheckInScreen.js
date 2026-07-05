import { useState, useCallback, useRef } from "react";
import {
  View, Text, ScrollView,
  TouchableOpacity, TextInput, Alert,
  ActivityIndicator, RefreshControl,
  Modal, Animated,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/api";
import { useNetwork } from "../context/NetworkContext";
import { useTheme } from "../context/ThemeContext";
import NoNetworkOverlay from "../components/NoNetworkOverlay";
import HushCircleSpinner from "../components/HushCircleSpinner";
import useSpinner from "../hooks/useSpinner";
import { getLocalDateString } from "../utils/dateHelpers"

// ── Milestone Hero SVG Icons ──────────────────────────────────────────────

const MilestoneLeafIcon     = ({ size = 42, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 8-12 9" fill={color + "33"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MilestoneFlameIcon    = ({ size = 42, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C12 2 6 8 6 13a6 6 0 0 0 12 0C18 8 12 2 12 2z" fill={color + "33"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 8c0 0-3 3-3 5.5a3 3 0 0 0 6 0C15 11 12 8 12 8z" fill={color + "66"} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MilestoneStrengthIcon = ({ size = 42, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C6 2 4 7 4 9c0 1.5 1 3 3 3.5V18h10v-5.5C19 12 20 10.5 20 9c0-2-2-7-8-7z" fill={color + "22"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 18v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 9H2M22 9h-2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);
const MilestoneStarIcon     = ({ size = 42, color = "#C4A3E8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={color + "33"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MilestoneRocketIcon   = ({ size = 42, color = "#FF6B35" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" fill={color + "33"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" fill={color + "22"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MilestoneCrownIcon    = ({ size = 42, color = "#FFD700" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2 20h20M4 20l2-8 5 4 3-8 3 8 5-4 2 8" fill={color + "22"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="8" r="1.5" fill={color} />
    <Circle cx="4.5" cy="12" r="1.5" fill={color} />
    <Circle cx="19.5" cy="12" r="1.5" fill={color} />
  </Svg>
);
const MilestoneDaysIcon     = ({ size = 14, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8"  y1="2" x2="8"  y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="3"  y1="10" x2="21" y2="10" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 16l2 2 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ArrowRightIcon        = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 5 19 12 12 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Pagination icons ──────────────────────────────────────────────────────

const ChevronLeftIcon  = ({ size = 18, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="15 18 9 12 15 6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChevronRightIcon = ({ size = 18, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="9 18 15 12 9 6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Mood SVG Icons ─────────────────────────────────────────────────────────

const MoodHeartbreakIcon = ({ size = 28, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 8v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M10 10l4 4M14 10l-4 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const MoodFearIcon       = ({ size = 28, color = "#6B9FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 15s1.5-2 4-2 4 2 4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M9 6l1 2M15 6l-1 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const MoodSadnessIcon    = ({ size = 28, color = "#7B8FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M16 16s-1.5-2-4-2-4 2-4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);
const MoodStruggleIcon   = ({ size = 28, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 14s1.5 1 4 1 4-1 4-1" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 9l1.5 1.5L12 9l1.5 1.5L15 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MoodHopeIcon       = ({ size = 28, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 13s1.5 2 4 2 4-2 4-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M12 3v2M16.5 4.5l-1.5 1.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const MoodJoyIcon        = ({ size = 28, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 13s1.5 3 4 3 4-3 4-3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M12 2v1.5M8 3.5l1 1.5M16 3.5l-1 1.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const MoodCalmIcon       = ({ size = 28, color = "#C4A3E8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M9 13s1 1.5 3 1.5 3-1.5 3-1.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

// ── Misc UI icons ──────────────────────────────────────────────────────────

const FlameIcon         = ({ size = 36, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C12 2 6 8 6 13a6 6 0 0 0 12 0C18 8 12 2 12 2z" fill={color + "33"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 8c0 0-3 3-3 5.5a3 3 0 0 0 6 0C15 11 12 8 12 8z" fill={color + "66"} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const TargetIcon        = ({ size = 13, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Circle cx="12" cy="12" r="6"  stroke={color} strokeWidth={2} />
    <Circle cx="12" cy="12" r="2"  stroke={color} strokeWidth={2} />
  </Svg>
);
const CheckCircleIcon   = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="22 4 12 14.01 9 11.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CheckmarkSmallIcon = ({ size = 11, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const FireStreakIcon    = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C12 2 6 8 6 13a6 6 0 0 0 12 0C18 8 12 2 12 2z" fill={color + "44"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CalendarCheckIcon = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8"  y1="2" x2="8"  y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="3"  y1="10" x2="21" y2="10" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 16l2 2 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const HeartSmallIcon   = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={color + "44"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const SendIcon         = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 2L15 22l-4-9-9-4 20-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Static data ───────────────────────────────────────────────────────────

const MILESTONES = {
  3:   { Icon: MilestoneLeafIcon,     label: "3-Day Streak",         color: "#4CAF8F", message: "Small steps matter — keep going." },
  7:   { Icon: MilestoneFlameIcon,    label: "One Week Strong",       color: "#D4A44C", message: "7 days of showing up for yourself. That's a whole week of courage." },
  14:  { Icon: MilestoneStrengthIcon, label: "Two Weeks!",            color: "#9B6FD4", message: "You've made checking in a real habit. HushCircle is proud of you." },
  30:  { Icon: MilestoneStarIcon,     label: "30-Day Milestone",      color: "#C4A3E8", message: "A full month of daily check-ins. That's extraordinary self-care." },
  60:  { Icon: MilestoneRocketIcon,   label: "60 Days — Unstoppable", color: "#FF6B35", message: "Two months of showing up for yourself every single day." },
  100: { Icon: MilestoneCrownIcon,    label: "100 Days — Legendary",  color: "#FFD700", message: "ONE HUNDRED days. You are an inspiration to this entire community." },
};

const MOODS = [
  { key: "heartbreak", Icon: MoodHeartbreakIcon, label: "Heartbreak", color: "#D4607A", desc: "Broken, lost" },
  { key: "fear",       Icon: MoodFearIcon,        label: "Anxious",    color: "#6B9FD4", desc: "Scared, overwhelmed" },
  { key: "sadness",    Icon: MoodSadnessIcon,     label: "Sad",        color: "#7B8FD4", desc: "Heavy, low" },
  { key: "struggle",   Icon: MoodStruggleIcon,    label: "Struggling", color: "#D4A44C", desc: "Fighting, tired" },
  { key: "hope",       Icon: MoodHopeIcon,        label: "Hopeful",    color: "#4CAF8F", desc: "Better, lighter" },
  { key: "joy",        Icon: MoodJoyIcon,         label: "Good",       color: "#9B6FD4", desc: "Positive, happy" },
  { key: "calm",       Icon: MoodCalmIcon,        label: "Calm",       color: "#C4A3E8", desc: "Peaceful, okay" },
];

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];
const HISTORY_PAGE_SIZE = 10;

// ── Streak Card ───────────────────────────────────────────────────────────

function StreakCard({ streak, loading }) {
  const { colors: C } = useTheme();
  if (loading) return null;

  const nextMilestone = STREAK_MILESTONES.find((m) => m > streak.currentStreak) || null;
  const progress      = nextMilestone ? (streak.currentStreak / nextMilestone) * 100 : 100;

  const getFlameColor = (d) => d >= 30 ? "#FF6B35" : d >= 14 ? "#D4A44C" : d >= 7 ? "#9B6FD4" : "#4CAF8F";
  const getFlameSize  = (d) => d >= 30 ? 52 : d >= 14 ? 44 : d >= 7 ? 38 : 32;

  const flameColor = getFlameColor(streak.currentStreak);
  const flameSize  = getFlameSize(streak.currentStreak);

  return (
    <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: C.border }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <FlameIcon size={flameSize} color={flameColor} />
        <View>
          <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 44, lineHeight: 48, color: flameColor }}>{streak.currentStreak}</Text>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 13 }}>day{streak.currentStreak !== 1 ? "s" : ""} streak</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 14 }}>
        {[
          { num: streak.totalDays,     label: "Total days",   color: C.accent   },
          { num: streak.longestStreak, label: "Best streak",  color: C.warning  },
          ...(nextMilestone ? [{ num: nextMilestone - streak.currentStreak, label: "To next goal", color: C.success }] : []),
        ].map((stat, i, arr) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 24, marginBottom: 2, color: stat.color }}>{stat.num}</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11 }}>{stat.label}</Text>
            {i < arr.length - 1 && <View style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 1, backgroundColor: C.border }} />}
          </View>
        ))}
      </View>

      {nextMilestone && (
        <View style={{ marginTop: 4 }}>
          <View style={{ height: 6, backgroundColor: C.border, borderRadius: 3, marginBottom: 6, overflow: "hidden" }}>
            <View style={{ height: "100%", borderRadius: 3, backgroundColor: flameColor, width: `${Math.min(progress, 100)}%` }} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "center" }}>
            <TargetIcon size={12} color={C.textMuted} />
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11 }}>{streak.currentStreak}/{nextMilestone} days to next milestone</Text>
          </View>
        </View>
      )}

      {streak.currentStreak === 0 && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 6 }}>
          <CalendarCheckIcon size={14} color={C.textMuted} />
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>Check in today to start your streak</Text>
        </View>
      )}
    </View>
  );
}

// ── Milestone Celebration Modal ───────────────────────────────────────────

function MilestoneCelebrationModal({ milestone, visible, onClose }) {
  const { colors: C } = useTheme();
  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  if (visible) {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const cfg = MILESTONES[milestone];
  if (!cfg) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.82)", padding: 24, opacity: opacityAnim }}>
        <Animated.View style={{ backgroundColor: C.card, borderRadius: 28, padding: 28, width: "100%", maxWidth: 340, alignItems: "center", borderWidth: 1.5, borderColor: cfg.color + "66", transform: [{ scale: scaleAnim }] }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, justifyContent: "center", alignItems: "center", borderWidth: 1.5, marginBottom: 18, backgroundColor: cfg.color + "22", borderColor: cfg.color + "44" }}>
            <cfg.Icon size={42} color={cfg.color} />
          </View>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 13, marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>You did it!</Text>
          <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 28, marginBottom: 12, textAlign: "center", color: cfg.color }}>{cfg.label}</Text>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 20 }}>{cfg.message}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, marginBottom: 24, width: "100%", justifyContent: "center", backgroundColor: cfg.color + "22", borderColor: cfg.color + "44" }}>
            <MilestoneDaysIcon size={14} color={cfg.color} />
            <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, textAlign: "center", color: cfg.color }}>{milestone} days of showing up for yourself</Text>
          </View>
          <TouchableOpacity style={{ borderRadius: 16, paddingVertical: 14, alignItems: "center", width: "100%", backgroundColor: cfg.color }} onPress={handleClose}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 16 }}>Keep going</Text>
              <ArrowRightIcon size={15} color="#fff" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ── Pagination Bar ─────────────────────────────────────────────────────────

function PaginationBar({ page, totalPages, onPrev, onNext, loading }) {
  const { colors: C } = useTheme();
  if (totalPages <= 1) return null;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 14, marginBottom: 4 }}>
      <TouchableOpacity
        onPress={onPrev}
        disabled={page <= 1 || loading}
        style={{
          width: 36, height: 36, borderRadius: 18,
          justifyContent: "center", alignItems: "center",
          backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
          opacity: page <= 1 ? 0.4 : 1,
        }}
      >
        <ChevronLeftIcon size={18} color={C.text} />
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="small" color={C.accent} />
      ) : (
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 13 }}>
          Page {page} of {totalPages}
        </Text>
      )}

      <TouchableOpacity
        onPress={onNext}
        disabled={page >= totalPages || loading}
        style={{
          width: 36, height: 36, borderRadius: 18,
          justifyContent: "center", alignItems: "center",
          backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
          opacity: page >= totalPages ? 0.4 : 1,
        }}
      >
        <ChevronRightIcon size={18} color={C.text} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────

export default function CheckInScreen() {
  const { colors: C } = useTheme();
  const spinner         = useSpinner();
  const { isConnected } = useNetwork();

  const [selectedMood, setSelectedMood]   = useState(null);
  const [note, setNote]                   = useState("");
  const [todayCheckIn, setTodayCheckIn]   = useState(null);
  const [streak, setStreak]               = useState({ currentStreak: 0, longestStreak: 0, totalDays: 0 });
  const [loading, setLoading]             = useState(true);
  const [streakLoading, setStreakLoading] = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const [milestoneCelebration, setMilestoneCelebration] = useState(null);
  const [showMilestoneModal, setShowMilestoneModal]     = useState(false);

  // ── History pagination state ──────────────────────────────────────────
  const [history, setHistory]           = useState([]);
  const [historyPage, setHistoryPage]   = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  const totalHistoryPages = Math.max(Math.ceil(historyTotal / HISTORY_PAGE_SIZE), 1);

  // ── Load history for a specific page ─────────────────────────────────
  const loadHistoryPage = async (page) => {
    setHistoryLoading(true);
    try {
      const res = await api.get(`/checkin/history?page=${page}&limit=${HISTORY_PAGE_SIZE}`);
      setHistory(res.data.checkIns || []);
      setHistoryTotal(res.data.total || 0);
      setHistoryPage(res.data.page || page);
    } catch (e) {
      // keep previous page's data on error — don't wipe the list
      console.log("History page load error:", e.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadAll = async () => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    try {
      const localDate = getLocalDateString();
      const [todayRes, streakRes] = await Promise.all([
        api.get(`/checkin/today?localDate=${localDate}`).catch(() => ({ data: { checkIn: null } })),
        api.get(`/checkin/streak?localDate=${localDate}`).catch(() => ({ data: { currentStreak: 0, longestStreak: 0, totalDays: 0 } })),
      ]);
      setTodayCheckIn(todayRes.data.checkIn);
      setStreak(streakRes.data);
      await loadHistoryPage(1); // always reset to page 1 on full reload
    } catch (e) { console.log("CheckIn load error:", e.message); }
    finally { setStreakLoading(false); }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true); setStreakLoading(true);
      loadAll().finally(() => setLoading(false));
    }, [isConnected])
  );

  const handleRefresh = async () => { setRefreshing(true); await loadAll(); setRefreshing(false); };

  const handleSubmit = async () => {
    if (!selectedMood) { Alert.alert("Choose a mood", "Select how you feel today first."); return; }
    if (!isConnected) { setShowNoNetwork(true); return; }
    await spinner.withSpinner(async () => {
      try {
        const res = await api.post("/checkin", {
          mood: selectedMood,
          note: note.trim(),
          localDate: getLocalDateString(),
        });
        setTodayCheckIn(res.data.checkIn); setNote("");
        if (res.data.streak) {
          setStreak(res.data.streak);
          if (res.data.streak.hitMilestone) { setMilestoneCelebration(res.data.streak.hitMilestone); setShowMilestoneModal(true); }
        } else {
          const streakRes = await api.get(`/checkin/streak?localDate=${getLocalDateString()}`);
          setStreak(streakRes.data);
        }
        // Refresh page 1 of history so the new check-in shows immediately
        await loadHistoryPage(1);
      } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not save check-in."); }
    }, "Saving your check-in...");
  };

  const handlePrevPage = () => {
    if (historyPage <= 1 || historyLoading) return;
    loadHistoryPage(historyPage - 1);
  };

  const handleNextPage = () => {
    if (historyPage >= totalHistoryPages || historyLoading) return;
    loadHistoryPage(historyPage + 1);
  };

  const getMoodConfig  = (key) => MOODS.find((m) => m.key === key) || MOODS[0];
  const formatDate     = (dateStr) => new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center", gap: 12 }}>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14 }}>Loading your check-in...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingTop: 56, paddingBottom: 20 }}>
          <Text style={{ fontSize: 32, color: C.text, fontFamily: "DMSerifDisplay_400Regular" }}>Daily Check-in</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
            <HeartSmallIcon size={14} color={C.textMuted} />
            <Text style={{ fontSize: 14, color: C.textMuted, fontFamily: "Nunito_400Regular" }}>How are you doing today?</Text>
          </View>
        </View>

        <StreakCard streak={streak} loading={streakLoading} />

        {todayCheckIn ? (
          <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: C.success + "44" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <View style={{ width: 56, height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center", backgroundColor: getMoodConfig(todayCheckIn.mood).color + "22" }}>
                {(() => { const cfg = getMoodConfig(todayCheckIn.mood); return <cfg.Icon size={32} color={cfg.color} />; })()}
              </View>
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <CheckCircleIcon size={15} color={C.success} />
                  <Text style={{ color: C.success, fontFamily: "Nunito_700Bold", fontSize: 15 }}>Today's check-in done</Text>
                </View>
                <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: getMoodConfig(todayCheckIn.mood).color }}>{getMoodConfig(todayCheckIn.mood).label}</Text>
              </View>
            </View>
            {todayCheckIn.note ? (
              <View style={{ backgroundColor: C.inputBg, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 11, marginBottom: 4 }}>Your note:</Text>
                <Text style={{ color: C.text, fontFamily: "Nunito_400Regular", fontSize: 13, fontStyle: "italic", lineHeight: 20 }}>"{todayCheckIn.note}"</Text>
              </View>
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <FireStreakIcon size={14} color={C.warning} />
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>Come back tomorrow to keep your streak going</Text>
            </View>
          </View>
        ) : (
          <>
            {/* Mood picker */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 15, marginBottom: 14 }}>How are you feeling?</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {MOODS.map((mood) => (
                  <TouchableOpacity
                    key={mood.key}
                    style={{ width: "30%", flexGrow: 1, borderRadius: 16, padding: 12, alignItems: "center", borderWidth: 1.5, position: "relative", gap: 6, borderColor: selectedMood === mood.key ? mood.color : C.border, backgroundColor: selectedMood === mood.key ? mood.color + "18" : C.card }}
                    onPress={() => setSelectedMood(mood.key)}
                    activeOpacity={0.7}
                  >
                    <mood.Icon size={30} color={selectedMood === mood.key ? mood.color : C.textMuted} />
                    <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 2, textAlign: "center", color: selectedMood === mood.key ? mood.color : C.text }}>{mood.label}</Text>
                    <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 10, textAlign: "center" }}>{mood.desc}</Text>
                    {selectedMood === mood.key && (
                      <View style={{ position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center", backgroundColor: mood.color }}>
                        <CheckmarkSmallIcon size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Note input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 15, marginBottom: 14 }}>Add a note (optional)</Text>
              <TextInput
                style={{ backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15, minHeight: 80 }}
                placeholder="What's on your mind today?"
                placeholderTextColor={C.textMuted}
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "right", marginTop: 6 }}>{note.length}/200</Text>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={{ backgroundColor: C.accent, borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 28, opacity: !selectedMood ? 0.4 : 1 }}
              onPress={handleSubmit}
              disabled={!selectedMood}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <SendIcon size={15} color="#fff" />
                <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 16 }}>Save check-in</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* ── History with pagination ── */}
        {historyTotal > 0 && (
          <View style={{ marginTop: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 15 }}>Your history</Text>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>
                {historyTotal} check-in{historyTotal !== 1 ? "s" : ""}
              </Text>
            </View>

            {historyLoading ? (
              <View style={{ paddingVertical: 30, alignItems: "center" }}>
                <ActivityIndicator color={C.accent} size="small" />
              </View>
            ) : (
              history.map((item, i) => {
                const mood = getMoodConfig(item.mood);
                return (
                  <View key={item._id || i} style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border, gap: 10, position: "relative", overflow: "hidden" }}>
                    <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, backgroundColor: mood.color }} />
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center", backgroundColor: mood.color + "22" }}>
                        <mood.Icon size={22} color={mood.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, marginBottom: 2, color: mood.color }}>{mood.label}</Text>
                        {item.note ? <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, fontStyle: "italic" }} numberOfLines={1}>"{item.note}"</Text> : null}
                      </View>
                    </View>
                    <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11 }}>{formatDate(item.date)}</Text>
                  </View>
                );
              })
            )}

            {/* Pagination controls */}
            <PaginationBar
              page={historyPage}
              totalPages={totalHistoryPages}
              onPrev={handlePrevPage}
              onNext={handleNextPage}
              loading={historyLoading}
            />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <MilestoneCelebrationModal milestone={milestoneCelebration} visible={showMilestoneModal} onClose={() => setShowMilestoneModal(false)} />
      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
      <NoNetworkOverlay visible={showNoNetwork} action="checkin" onClose={() => setShowNoNetwork(false)} onRetry={() => { setShowNoNetwork(false); loadAll(); }} />
    </View>
  );
}