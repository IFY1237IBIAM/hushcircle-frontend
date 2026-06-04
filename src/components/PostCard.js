import { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, TextInput, ActivityIndicator,
  Modal, Animated, Pressable, Share,
  Platform,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect, G, Defs, ClipPath } from "react-native-svg";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import CommentThread, { getTotalCommentCount, formatCount } from "./CommentThread";
import UserProfileCard from "./UserProfileCard";
import { useNavigation } from "@react-navigation/native";
import HashtagText from "./HashtagText";
import { useNetwork } from "../context/NetworkContext";
import NoNetworkOverlay from "./NoNetworkOverlay";
import HushCircleSpinner from "./HushCircleSpinner";
import useSpinner from "../hooks/useSpinner";
import usePostSocket from "../hooks/usePostSocket";
import { useLanguage } from "../context/LanguageContext";
import { useSocket } from "../context/SocketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DraftDiscardModal from "./DraftDiscardModal";
import { useDrafts } from "../hooks/useDrafts";
import { deleteRepost } from "../api/postApi";
// Module-level color fallbacks for icon defaults (theme-aware colors used inside component)
const DARK = {
  accent: "#9B6FD4",
  accentSoft: "#C4A3E8",
  textMuted: "#8B7FA8",
  error: "#D4607A",
  warning: "#D4A44C",
};



// ── Mood SVG Icons ─────────────────────────────────────────────────────────

const MoodHeartbreakIcon = ({ size = 18, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 8v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M10 10l4 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Path d="M14 10l-4 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const MoodFearIcon = ({ size = 18, color = "#6B9FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 15s1.5-2 4-2 4 2 4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M9 6l1 2M15 6l-1 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const MoodSadnessIcon = ({ size = 18, color = "#7B8FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M16 16s-1.5-2-4-2-4 2-4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

const MoodStruggleIcon = ({ size = 18, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 14s1.5 1 4 1 4-1 4-1" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 9l1.5 1.5L12 9l1.5 1.5L15 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MoodHopeIcon = ({ size = 18, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 13s1.5 2 4 2 4-2 4-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M12 3v2M16.5 4.5l-1.5 1.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

// ── Reaction SVG Icons ─────────────────────────────────────────────────────

const ReactionCareIcon = ({ size = 22, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={color + "44"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ReactionHeartIcon = ({ size = 22, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={color} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ReactionHugIcon = ({ size = 22, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="3" stroke={color} strokeWidth={2} />
    <Path d="M5 20v-3a7 7 0 0 1 14 0v3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 15c1-1 2-1 3 0M22 15c-1-1-2-1-3 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ReactionStrongIcon = ({ size = 22, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C6 2 4 7 4 9c0 1.5 1 3 3 3.5V18h10v-5.5C19 12 20 10.5 20 9c0-2-2-7-8-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 18v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 9H2M22 9h-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ReactionCryIcon = ({ size = 22, color = "#6B9FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M16 16s-1.5-2-4-2-4 2-4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M9 13l-1 3M15 13l1 3" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const ReactionHopeIcon = ({ size = 22, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 13s1.5 2 4 2 4-2 4-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M12 2v2.5M15.5 3.5l-1.5 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

// ── Confirm Modal Illustration Icons ──────────────────────────────────────

const HideConfirmIcon = ({ size = 52, color = "#6B9FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M1 1l22 22" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DeleteConfirmIcon = ({ size = 52, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SaveConfirmIcon = ({ size = 52, color = "#9B6FD4", filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill={filled ? color + "55" : "none"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ReportSuccessIcon = ({ size = 52, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="22 4 12 14.01 9 11.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const AlreadyReportedIcon = ({ size = 52, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClockReviewIcon = ({ size = 16, color = DARK.warning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Report Category Icons ──────────────────────────────────────────────────

const ReportHarmfulIcon = ({ size = 20, color = DARK.warning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ReportBullyingIcon = ({ size = 20, color = DARK.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 14s1.5 1 4 1 4-1 4-1" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 9l1.5 1.5L12 9l1.5 1.5L15 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ReportSpamIcon = ({ size = 20, color = "#8B7FA8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="3" width="20" height="14" rx="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 21h8M12 17v4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 8h2M11 8h6M7 11h10" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const ReportInappropriateIcon = ({ size = 20, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ReportMisinfoIcon = ({ size = 20, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="4" y1="22" x2="4" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ReportOtherIcon = ({ size = 20, color = "#8B7FA8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="9" y1="10" x2="15" y2="10" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="14" x2="12" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ── Misc UI Icons ──────────────────────────────────────────────────────────

const CheckIcon = ({ size = 18, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EditLabelIcon = ({ size = 14, color = DARK.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ArrowReturnIcon = ({ size = 13, color = DARK.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 14L4 9l5-5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 9h11a5 5 0 0 1 0 10h-1" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ThumbsUpIcon = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartIcon = ({ size = 18, color = DARK.textMuted, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={filled ? color : "none"} stroke={color} strokeWidth={filled ? 0 : 2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CommentIcon = ({ size = 18, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const RepostIcon = ({ size = 18, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 1l4 4-4 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 11V9a4 4 0 0 1 4-4h14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 23l-4-4 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21 13v2a4 4 0 0 1-4 4H3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BookmarkIcon = ({ size = 18, color = DARK.textMuted, filled = false }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill={filled ? color : "none"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShareIcon = ({ size = 18, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="16 6 12 2 8 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="2" x2="12" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const DotsIcon = ({ size = 20, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="5" r="1.5" fill={color} />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
    <Circle cx="12" cy="19" r="1.5" fill={color} />
  </Svg>
);

const HideIcon = ({ size = 20, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M1 1l22 22" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ReportIcon = ({ size = 20, color = DARK.warning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="4" y1="22" x2="4" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const BlockIcon = ({ size = 20, color = DARK.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const EditIcon = ({ size = 20, color = DARK.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TrashIcon = ({ size = 20, color = DARK.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TranslateIcon = ({ size = 16, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 5h12M9 3v2m-4 0a9.003 9.003 0 0 0 6 8.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 7c0 5 4 8 6 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M15 11l5 13M15 11l-5 13M17.5 17h-5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SendIcon = ({ size = 18, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 2L15 22l-4-9-9-4 20-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const RepostToggleIcon = ({ size = 20, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 1l4 4-4 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 11V9a4 4 0 0 1 4-4h14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 23l-4-4 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21 13v2a4 4 0 0 1-4 4H3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="2" y1="2" x2="22" y2="22" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ── MOOD_CONFIG ────────────────────────────────────────────────────────────
const MOOD_CONFIG = {
  heartbreak: { Icon: MoodHeartbreakIcon, color: "#D4607A", label: "Heartbreak" },
  fear:       { Icon: MoodFearIcon,       color: "#6B9FD4", label: "Fear" },
  sadness:    { Icon: MoodSadnessIcon,    color: "#7B8FD4", label: "Sadness" },
  struggle:   { Icon: MoodStruggleIcon,   color: "#D4A44C", label: "Struggle" },
  hope:       { Icon: MoodHopeIcon,       color: "#4CAF8F", label: "Hope" },
};

// ── REACTIONS ──────────────────────────────────────────────────────────────
const REACTIONS = [
  { key: "care",   Icon: ReactionCareIcon,   iconColor: "#9B6FD4", label: "Here for you" },
  { key: "heart",  Icon: ReactionHeartIcon,  iconColor: "#D4607A", label: "Love" },
  { key: "hug",    Icon: ReactionHugIcon,    iconColor: "#D4A44C", label: "Sending hugs" },
  { key: "strong", Icon: ReactionStrongIcon, iconColor: "#4CAF8F", label: "Stay strong" },
  { key: "cry",    Icon: ReactionCryIcon,    iconColor: "#6B9FD4", label: "I feel this" },
  { key: "hope",   Icon: ReactionHopeIcon,   iconColor: "#4CAF8F", label: "There is hope" },
];

// ── Report categories ──────────────────────────────────────────────────────
const REPORT_REASONS = [
  { key: "harmful_content", Icon: ReportHarmfulIcon,       iconColor: DARK.warning, label: "Harmful content",  sub: "Promotes violence or self-harm" },
  { key: "bullying",        Icon: ReportBullyingIcon,      iconColor: DARK.error,   label: "Bullying",         sub: "Targets or harasses someone" },
  { key: "spam",            Icon: ReportSpamIcon,          iconColor: "#8B7FA8",      label: "Spam",             sub: "Fake, repetitive or promotional" },
  { key: "inappropriate",   Icon: ReportInappropriateIcon, iconColor: DARK.error,   label: "Inappropriate",    sub: "Offensive or explicit content" },
  { key: "misinformation",  Icon: ReportMisinfoIcon,       iconColor: DARK.warning, label: "Misinformation",   sub: "False or misleading information" },
  { key: "other",           Icon: ReportOtherIcon,         iconColor: "#8B7FA8",      label: "Other",            sub: "Something else entirely" },
];

// ──────────────────────────────────────────────────────────────────────────────

export default function PostCard({
  post,
  userReaction: initialReaction,
  hasReacted,
  isSaved,
  onDeleted,
  onEdited,
  onHidden,
  onReposted,
  onUnreposted,
  isInsideRepost,
  // ── NEW: if provided, tapping the repost button delegates to the parent
  // (FeedScreen) which owns the confirmation modal. If not provided (e.g.
  // PostCard used outside FeedScreen), the card falls back to its own modal.
  onRepostPress,
}) {
  const navigation = useNavigation();
  const { socket } = useSocket();
  const spinner = useSpinner();
  const { user } = useAuth();
  const { isConnected } = useNetwork();
  const { fs, blockedUserIds, addBlockedUser, colors: COLORS} = useTheme();
  const { language, t } = useLanguage();
  const drafts = useDrafts();
  const isOwner = post.pseudonym === user?.pseudonym;

  const handleHashtagPress = (tag) => navigation.navigate("Hashtag", { tag });
  const handleAvatarPress = () => {
    if (isOwner) navigation.navigate("Profile");
    else setShowUserCard(true);
  };

  const [userReaction, setUserReaction] = useState(initialReaction || null);
  const [reactionCounts, setReactionCounts] = useState(post.reactionCounts || {});
  const [totalReactions, setTotalReactions] = useState(post.totalReactions || 0);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reacting, setReacting] = useState(false);

  useEffect(() => { setUserReaction(initialReaction || null); }, [initialReaction]);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentCount, setCommentCount] = useState(
    post.commentCount ?? getTotalCommentCount(post.comments || [])
  );
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const restoreDraft = async () => {
      const saved = await drafts.getCommentDraft(post._id);
      if (saved) setCommentText(saved);
    };
    restoreDraft();
  }, [post._id]);

  useEffect(() => { drafts.saveCommentDraft(post._id, commentText); }, [commentText]);

  const [showOptions, setShowOptions] = useState(false);
  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showUserCard, setShowUserCard] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Repost state ───────────────────────────────────────────────────────
  // showRepostModal is only used when onRepostPress is NOT provided (standalone mode).
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostThought, setRepostThought] = useState("");
  const [reposting, setReposting] = useState(false);
  const [isReposted, setIsReposted]   = useState(post.isReposted || false);
  const [repostCount, setRepostCount] = useState(post.repostCount || 0);
  const [allowReposts, setAllowReposts] = useState(post.allowReposts !== false);
  const [togglingReposts, setTogglingReposts] = useState(false);
  const [showRepostDraftModal, setShowRepostDraftModal] = useState(false);
  const repostAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIsReposted(post.isReposted || false);
    setRepostCount(post.repostCount || 0);
  }, [post.isReposted, post.repostCount]);

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editMood, setEditMood] = useState(post.mood || "sadness");
  const [savingEdit, setSavingEdit] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const MAX_CHARS = 250;
  const isLong = post.content.length > MAX_CHARS;
  const displayText = expanded || !isLong ? post.content : post.content.slice(0, MAX_CHARS) + "...";

  const [saved, setSaved] = useState(isSaved || false);
  useEffect(() => {
    setSaved(isSaved || false);
    setUserReaction(initialReaction || null);
  }, [isSaved, initialReaction]);

  const [reportReason, setReportReason] = useState(null);
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportAlreadyDone, setReportAlreadyDone] = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const [noNetworkAction, setNoNetworkAction] = useState("default");

  const [translatedText, setTranslatedText] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);
  const [detectedLang, setDetectedLang] = useState(null);

  useEffect(() => {
    const detect = async () => {
      if (post.detectedLang) { setDetectedLang(post.detectedLang.toLowerCase()); return; }
      try {
        const lang = await detectPostLanguage(post.content);
        setDetectedLang(lang.toLowerCase());
      } catch { setDetectedLang("en"); }
    };
    detect();
  }, [post.detectedLang, post.content]);

  usePostSocket(post._id, {
    onReaction: (data) => {
      setReactionCounts(data.reactionCounts);
      setTotalReactions(data.totalReactions);
      if (data.postId === post._id) setUserReaction(data.userReaction || null);
    },
    onComment: (data) => {
      setComments((prev) => {
        const exists = prev.some((c) => c._id === data.comment._id);
        if (exists) return prev;
        return [...prev, data.comment];
      });
      if (data.totalComments !== undefined) setCommentCount(data.totalComments);
    },
    onReply: (data) => {
      setComments((prev) =>
        prev.map((c) => {
          if (c._id !== data.commentId) return c;
          const exists = (c.replies || []).some(
            (r) =>
              (r._id && data.reply._id && r._id === data.reply._id) ||
              (r.text === data.reply.text && r.pseudonym === data.reply.pseudonym &&
                Math.abs(new Date(r.createdAt) - new Date(data.reply.createdAt)) < 3000)
          );
          if (exists) return c;
          return { ...c, replies: [...(c.replies || []), data.reply] };
        })
      );
      if (data.totalComments !== undefined) setCommentCount(data.totalComments);
    },
  });

  useEffect(() => {
    if (!socket) return;
    const handleCommentUpdated = (data) => {
      if (data.postId !== post._id) return;
      setComments((prev) => prev.map((c) => c._id === data.commentId ? { ...c, text: data.text, edited: true } : c));
    };
    const handleCommentDeleted = (data) => {
      if (data.postId !== post._id) return;
      setComments((prev) => prev.map((c) => c._id === data.commentId ? { ...c, text: "This comment was deleted.", deleted: true } : c));
      if (data.commentCount !== undefined) setCommentCount(data.commentCount);
    };
    const handleReplyDeleted = (data) => {
      if (data.postId !== post._id) return;
      setComments((prev) =>
        prev.map((c) =>
          c._id === data.commentId
            ? { ...c, replies: (c.replies || []).map((r) => r._id === data.replyId ? { ...r, text: "This reply was deleted.", deleted: true } : r) }
            : c
        )
      );
      if (data.commentCount !== undefined) setCommentCount(data.commentCount);
    };
    socket.on("comment_updated", handleCommentUpdated);
    socket.on("comment_deleted", handleCommentDeleted);
    socket.on("reply_deleted", handleReplyDeleted);
    return () => {
      socket.off("comment_updated", handleCommentUpdated);
      socket.off("comment_deleted", handleCommentDeleted);
      socket.off("reply_deleted", handleReplyDeleted);
    };
  }, [socket, post._id]);

  const checkNetwork = (action) => {
    if (!isConnected) { setNoNetworkAction(action); setShowNoNetwork(true); return false; }
    return true;
  };

  const detectPostLanguage = async (text) => {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.substring(0, 100))}&langpair=autodetect|en`;
      const res = await fetch(url);
      const data = await res.json();
      return data.responseData?.detectedLanguage || "en";
    } catch { return "en"; }
  };

  const handleTranslate = async () => {
    if (showTranslated) { setShowTranslated(false); return; }
    if (translatedText) { setShowTranslated(true); return; }
    setTranslating(true);
    try {
      const sourceLang = detectedLang || await detectPostLanguage(post.content);
      setDetectedLang(sourceLang);
      if (sourceLang === language) { setTranslating(false); return; }
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(post.content)}&langpair=${sourceLang}|${language}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        setTranslatedText(data.responseData.translatedText);
        setShowTranslated(true);
      } else { Alert.alert(t("error"), "Translation not available right now."); }
    } catch { Alert.alert(t("error"), "Translation failed. Check your connection."); }
    finally { setTranslating(false); }
  };

  const pickerAnim = useRef(new Animated.Value(0)).current;
  const optionsAnim = useRef(new Animated.Value(0)).current;
  const hideAnim = useRef(new Animated.Value(0)).current;
  const deleteAnim = useRef(new Animated.Value(0)).current;
  const saveAnim = useRef(new Animated.Value(0)).current;
  const reportAnim = useRef(new Animated.Value(0)).current;

  const isBlocked = post.authorId && blockedUserIds.includes(post.authorId.toString());
  if (isBlocked) return null;

  const mood = MOOD_CONFIG[editMood] || MOOD_CONFIG.sadness;

  const animateIn = (anim) =>
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
  const animateOut = (anim, cb) =>
    Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }).start(cb);
  const modalTransform = (anim) => ({
    opacity: anim,
    transform: [
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
    ],
  });

  const openReactionPicker = () => { setShowReactionPicker(true); animateIn(pickerAnim); };
  const closeReactionPicker = () => animateOut(pickerAnim, () => setShowReactionPicker(false));
  const openOptions = () => { setShowOptions(true); animateIn(optionsAnim); };
  const closeOptions = () => animateOut(optionsAnim, () => setShowOptions(false));
  const openHideConfirm = () => { closeOptions(); setTimeout(() => { setShowHideConfirm(true); animateIn(hideAnim); }, 300); };
  const closeHideConfirm = () => animateOut(hideAnim, () => setShowHideConfirm(false));
  const openDeleteConfirm = () => { closeOptions(); setTimeout(() => { setShowDeleteConfirm(true); animateIn(deleteAnim); }, 300); };
  const closeDeleteConfirm = () => animateOut(deleteAnim, () => setShowDeleteConfirm(false));
  const openSaveConfirm = () => { setShowSaveConfirm(true); animateIn(saveAnim); };
  const closeSaveConfirm = () => animateOut(saveAnim, () => setShowSaveConfirm(false));
  const openReportModal = () => { closeOptions(); setTimeout(() => { setShowReportModal(true); animateIn(reportAnim); }, 300); };
  const closeReportModal = () => {
    animateOut(reportAnim, () => {
      setShowReportModal(false);
      setReportReason(null);
      setReportDetails("");
      setReportSubmitted(false);
      setReportAlreadyDone(false);
    });
  };

  // ── Repost button tap ──────────────────────────────────────────────────
  // If the parent (FeedScreen) provided onRepostPress, use it — that opens
  // the shared RepostConfirmModal which sends confirmed:true to the server.
  // Un-reposting still happens directly (no confirmation needed).
  const handleRepostButtonPress = async () => {
    if (!checkNetwork("repost")) return;

    // Un-repost: no confirmation needed, just delete
    if (isReposted) {
      setReposting(true);
      try {
        const res = await deleteRepost(post._id);
        setIsReposted(false);
        setRepostCount(res.data.repostCount);
        if (onUnreposted) onUnreposted(post._id, res.data.repostCount);
      } catch (e) {
        Alert.alert("Error", e.response?.data?.message || "Could not remove repost.");
      } finally {
        setReposting(false);
      }
      return;
    }

    // New repost: delegate to FeedScreen modal if available, else use own modal
    if (onRepostPress) {
      onRepostPress(post._id);
    } else {
      // Standalone fallback (e.g. ProfileScreen, SearchScreen)
      const draft = await drafts.getRepostDraft(post._id);
      if (draft?.thought) setRepostThought(draft.thought);
      setShowRepostModal(true);
      animateIn(repostAnim);
    }
  };

  const closeRepostModal = () => animateOut(repostAnim, () => setShowRepostModal(false));
  const handleRepostModalBackAttempt = () => {
    if (repostThought.trim()) setShowRepostDraftModal(true);
    else closeRepostModal();
  };

  // Fallback standalone repost (used when onRepostPress is not provided)
  const handleStandaloneRepost = async (thought = "") => {
    closeRepostModal();
    if (!checkNetwork("repost")) return;
    setReposting(true);
    try {
      const res = await api.post(`/posts/${post._id}/repost`, {
        thought: thought.trim(),
        confirmed: true, // server requires this
      });
      setIsReposted(true);
      setRepostCount(res.data.repostCount);
      if (onReposted) onReposted(post._id, res.data.repostCount);
      await drafts.clearRepostDraft(post._id);
      setRepostThought("");
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Could not repost.");
    } finally {
      setReposting(false);
    }
  };

  const handleSaveRepostDraft = async () => {
    await drafts.saveRepostDraft(post._id, { thought: repostThought, postId: post._id });
    setShowRepostDraftModal(false);
    closeRepostModal();
  };
  const handleLeaveRepostDraft = async () => {
    await drafts.clearRepostDraft(post._id);
    setRepostThought("");
    setShowRepostDraftModal(false);
    closeRepostModal();
  };

  const handleBlockUser = () => {
    closeOptions();
    Alert.alert(`Block @${post.pseudonym}?`, "Their posts will be hidden from your feed. You can unblock them in Settings.", [
      { text: "Cancel", style: "cancel" },
      { text: "Block", style: "destructive", onPress: async () => {
        try {
          await api.post(`/settings/block/${post.authorId}`);
          addBlockedUser(post.authorId.toString());
          if (onHidden) onHidden(post._id);
        } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not block user."); }
      }},
    ]);
  };

  const handleReaction = async (reaction) => {
    closeReactionPicker();
    if (reacting) return;
    setReacting(true);
    const previousReaction = userReaction;
    const previousCounts = { ...reactionCounts };
    const previousTotal = totalReactions;
    const newCounts = { ...reactionCounts };
    if (previousReaction) {
      newCounts[previousReaction] = Math.max(0, (newCounts[previousReaction] || 1) - 1);
      if (newCounts[previousReaction] === 0) delete newCounts[previousReaction];
    }
    if (reaction.key !== previousReaction) {
      newCounts[reaction.key] = (newCounts[reaction.key] || 0) + 1;
      setUserReaction(reaction.key);
      setTotalReactions(previousTotal + (previousReaction ? 0 : 1));
    } else {
      setUserReaction(null);
      setTotalReactions(previousTotal - 1);
    }
    setReactionCounts(newCounts);
    try {
      const res = await api.post(`/posts/${post._id}/react`, { type: reaction.key });
      setReactionCounts(res.data.reactionCounts);
      setTotalReactions(res.data.totalReactions);
      setUserReaction(res.data.userReaction);
    } catch {
      setUserReaction(previousReaction);
      setReactionCounts(previousCounts);
      setTotalReactions(previousTotal);
      Alert.alert("Error", "Could not update reaction.");
    } finally { setReacting(false); }
  };

  const handleQuickTap = () => {
    if (!checkNetwork("reaction")) return;
    if (userReaction) handleReaction(REACTIONS.find((r) => r.key === userReaction));
    else handleReaction(REACTIONS[0]);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    if (!checkNetwork("comment")) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/posts/${post._id}/comments`, { text: commentText.trim() });
      setComments((prev) => {
        const exists = prev.some((c) => c._id === res.data.comment._id);
        if (exists) return prev;
        return [...prev, { ...res.data.comment, replies: [] }];
      });
      if (res.data.commentCount !== undefined) setCommentCount(res.data.commentCount);
      setCommentText("");
      await drafts.clearCommentDraft(post._id);
    } catch { Alert.alert("Error", "Could not add comment."); }
    finally { setSubmittingComment(false); }
  };

  const handleReplyAdded = (commentId, newReply) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c._id !== commentId) return c;
        const exists = (c.replies || []).some(
          (r) =>
            (r._id && newReply._id && r._id === newReply._id) ||
            (r.text === newReply.text && r.pseudonym === newReply.pseudonym &&
              Math.abs(new Date(r.createdAt) - new Date(newReply.createdAt)) < 3000)
        );
        if (exists) return c;
        return { ...c, replies: [...(c.replies || []), newReply] };
      })
    );
  };

  const handleCommentUpdated = (commentId, newText) => {
    setComments((prev) => prev.map((c) => c._id === commentId ? { ...c, text: newText, edited: true } : c));
  };

  const handleCommentDeleted = (commentId, newCount) => {
    setComments((prev) => prev.map((c) => c._id === commentId ? { ...c, text: "This comment was deleted.", deleted: true } : c));
    if (newCount !== undefined) setCommentCount(newCount);
  };

  const handleSaveConfirm = async () => {
    closeSaveConfirm();
    if (!checkNetwork("save")) return;
    try {
      const res = await api.post(`/posts/${post._id}/save`);
      setSaved(res.data.saved);
    } catch { Alert.alert("Error", "Could not save post."); }
  };

  const handleShare = async () => {
    closeOptions();
    try {
      const postUrl = `https://hushcircle.org/post/${post._id}`;
      const shareText = `"${post.content}"\n\n— ${post.pseudonym} on HushCircle`;
      await Share.share({
        title: "HushCircle — A safe space for your heart",
        message: Platform.OS === "android"
          ? `${shareText}\n\n${postUrl}\n\nJoin HushCircle — a safe space for your heart.`
          : shareText,
        url: postUrl,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share post.");
    }
  };

  const handleSubmitReport = async () => {
    if (!reportReason) return;
    await spinner.withSpinner(async () => {
      try {
        await api.post(`/posts/${post._id}/report`, { reason: reportReason, details: reportDetails });
        setReportSubmitted(true);
      } catch (error) {
        const msg = error.response?.data?.message || "Could not submit report.";
        if (msg.includes("already reported")) { setReportAlreadyDone(true); setReportSubmitted(true); }
        else Alert.alert("Error", msg);
      }
    }, "Submitting report...");
  };

  const handleHideConfirm = () => { closeHideConfirm(); setTimeout(() => { if (onHidden) onHidden(post._id); }, 200); };
  const handleEditPress = () => { closeOptions(); setTimeout(() => setEditing(true), 300); };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setSavingEdit(true);
    try {
      await api.put(`/posts/${post._id}`, { content: editContent.trim(), mood: editMood });
      setEditing(false);
      if (onEdited) onEdited(post._id, editContent.trim(), editMood);
      Alert.alert("Updated", "Your post has been updated.");
    } catch (error) { Alert.alert("Error", error.response?.data?.message || "Could not update post."); }
    finally { setSavingEdit(false); }
  };

  const handleToggleAllowReposts = async () => {
    closeOptions();
    if (!checkNetwork("repost")) return;
    const next = !allowReposts;
    setTogglingReposts(true);
    try {
      await api.patch(`/posts/${post._id}/allow-reposts`, { allowReposts: next });
      setAllowReposts(next);
      Alert.alert(
        next ? "Reposts enabled" : "Reposts disabled",
        next
          ? "Others can now repost your story 💜"
          : "No one can repost this story anymore."
      );
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Could not update repost setting.");
    } finally { setTogglingReposts(false); }
  };

  const handleDeleteConfirm = async () => {
    closeDeleteConfirm();
    await spinner.withSpinner(async () => {
      try { await api.delete(`/posts/${post._id}`); setTimeout(() => onDeleted(post._id), 300); }
      catch { Alert.alert("Error", "Could not delete post"); }
    }, "Deleting post...");
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const currentReaction = REACTIONS.find((r) => r.key === userReaction);
  const reactionSummaryItems = REACTIONS.filter((r) => reactionCounts[r.key] > 0);

  // Hide repost button entirely if creator disabled reposts
  const canRepost = allowReposts;

  const cardStyle = isInsideRepost
    ? [styles.card, { borderLeftColor: mood.color, borderLeftWidth: 3 }, { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 0, marginBottom: 12 }]
    : [styles.card, { borderLeftColor: mood.color, borderLeftWidth: 3 }];

  return (
    <View style={cardStyle}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <TouchableOpacity onPress={handleAvatarPress}>
            <View style={{ position: "relative" }}>
              <View style={[styles.avatar, { backgroundColor: mood.color + "33" }]}>
                <Text style={[styles.avatarText, { fontSize: fs.base }]}>
                  {post.pseudonym?.[0]?.toUpperCase()}
                </Text>
              </View>
              {post.showOnlineStatus && (
                <View style={[
                  styles.onlineDot,
                  { backgroundColor: post.isOnline ? "#4CAF8F" : "#D4607A" }
                ]} />
              )}
            </View>
          </TouchableOpacity>
          <View>
            <TouchableOpacity onPress={handleAvatarPress}>
              <Text style={[styles.pseudonym, { fontSize: fs.label }]}>{post.pseudonym}</Text>
            </TouchableOpacity>
            <Text style={[styles.time, { fontSize: fs.small }]}>{timeAgo(post.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.moodBadge, { backgroundColor: mood.color + "22" }]}>
            <mood.Icon size={13} color={mood.color} />
            <Text style={[styles.moodLabel, { color: mood.color, fontSize: fs.small }]}>{mood.label}</Text>
          </View>
          <TouchableOpacity style={styles.dotsBtn} onPress={openOptions}>
            <DotsIcon size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content or Edit ── */}
      {editing ? (
        <View style={styles.editContainer}>
          <View style={styles.editLabelRow}>
            <EditLabelIcon size={13} color={COLORS.accentSoft} />
            <Text style={[styles.editLabel, { fontSize: fs.small }]}>Edit your post</Text>
          </View>
          <View style={styles.moodRow}>
            {Object.entries(MOOD_CONFIG).map(([key, val]) => (
              <TouchableOpacity key={key} style={[styles.moodBtn, editMood === key && { backgroundColor: val.color + "33", borderColor: val.color }]} onPress={() => setEditMood(key)}>
                <val.Icon size={20} color={val.color} />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={[styles.editInput, { fontSize: fs.content }]} value={editContent} onChangeText={setEditContent} multiline maxLength={500} placeholderTextColor={COLORS.textMuted} />
          <Text style={[styles.charCount, { fontSize: fs.small }]}>{editContent.length}/500</Text>
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelEditBtn} onPress={() => { setEditing(false); setEditContent(post.content); setEditMood(post.mood); }}>
              <Text style={[styles.cancelEditText, { fontSize: fs.label }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveEditBtn, savingEdit && { opacity: 0.6 }]} onPress={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? <ActivityIndicator color="#fff" size="small" /> : <Text style={[styles.saveEditText, { fontSize: fs.label }]}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View>
          <HashtagText text={displayText} style={[styles.content, { fontSize: fs.content, lineHeight: fs.content * 1.7 }]} onHashtagPress={handleHashtagPress} />
          {isLong && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)}>
              <Text style={[styles.seeMoreText, { fontSize: fs.small }]}>{expanded ? "See less" : "See more"}</Text>
            </TouchableOpacity>
          )}
          {!editing && !showTranslated && detectedLang && detectedLang.toLowerCase() !== language.toLowerCase() && (
            <TouchableOpacity style={styles.translateBtn} onPress={handleTranslate} disabled={translating}>
              {translating
                ? <ActivityIndicator color={COLORS.accent} size="small" />
                : <View style={styles.translateBtnInner}><TranslateIcon size={14} color={COLORS.accent} /><Text style={styles.translateBtnText}>{t("translate")}</Text></View>
              }
            </TouchableOpacity>
          )}
          {showTranslated && translatedText && (
            <View style={styles.translatedBox}>
              <Text style={[styles.translatedText, { fontSize: fs.content, lineHeight: fs.content * 1.7 }]}>{translatedText}</Text>
              <TouchableOpacity style={styles.seeOriginalBtn} onPress={() => setShowTranslated(false)}>
                <ArrowReturnIcon size={12} color={COLORS.accentSoft} />
                <Text style={styles.seeOriginalText}>{t("seeOriginal")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── Reaction summary ── */}
      {totalReactions > 0 && (
        <View style={styles.reactionSummaryBar}>
          <View style={styles.reactionSummaryIcons}>
            {reactionSummaryItems.slice(0, 4).map((r) => (
              <View key={r.key} style={styles.reactionSummaryItem}>
                <r.Icon size={14} color={r.iconColor} />
                <Text style={[styles.reactionSummaryCount, { fontSize: fs.small }]}>{reactionCounts[r.key]}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.reactionTotal, { fontSize: fs.small }]}>{formatCount(totalReactions)} {totalReactions === 1 ? "reaction" : "reactions"}</Text>
        </View>
      )}

      {/* ── Actions row ── */}
      {!editing && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleQuickTap} onLongPress={openReactionPicker} delayLongPress={400} disabled={reacting}>
            {currentReaction
              ? <currentReaction.Icon size={20} color={currentReaction.iconColor} />
              : <HeartIcon size={20} color={COLORS.textMuted} filled={false} />
            }
            <Text style={[styles.actionText, { fontSize: fs.small }, userReaction && { color: COLORS.accentSoft }]}>
              {currentReaction ? currentReaction.label : "React"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(!showComments)}>
            <CommentIcon size={20} color={showComments ? COLORS.accent : COLORS.textMuted} />
            <Text style={[styles.actionText, { fontSize: fs.small }, showComments && { color: COLORS.accent }]}>{formatCount(commentCount)}</Text>
          </TouchableOpacity>

          {/* Repost — hidden if owner OR creator disabled reposts */}
          {canRepost && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleRepostButtonPress} disabled={reposting}>
              {reposting
                ? <ActivityIndicator size={16} color={isReposted ? COLORS.error : COLORS.textMuted} />
                : <RepostIcon size={20} color={isReposted ? COLORS.success : COLORS.textMuted} />
              }
              <Text style={[styles.actionText, { fontSize: fs.small }, isReposted && { color: COLORS.success }]}>
                {repostCount > 0 ? formatCount(repostCount) : ""}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionBtn} onPress={openSaveConfirm}>
            <BookmarkIcon size={20} color={saved ? COLORS.accentSoft : COLORS.textMuted} filled={saved} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <ShareIcon size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Comments ── */}
      {showComments && (
        <View style={styles.commentsSection}>
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <CommentThread
                key={comment._id || index}
                comment={comment}
                postId={post._id}
                postAuthorPseudonym={post.pseudonym}
                onReplyAdded={(commentId, newReply) => { handleReplyAdded(commentId, newReply); setCommentCount((prev) => prev + 1); }}
                onCommentUpdated={handleCommentUpdated}
                onCommentDeleted={handleCommentDeleted}
                onReplyDeleted={(replyId, newCount) => { if (newCount !== undefined) setCommentCount(newCount); }}
              />
            ))
          ) : (
            <Text style={[styles.noComments, { fontSize: fs.small }]}>Be the first to show support</Text>
          )}
          <View style={styles.commentInputRow}>
            <TextInput
              style={[styles.commentInput, { fontSize: fs.base }]}
              placeholder="Say something kind..."
              placeholderTextColor={COLORS.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!commentText.trim() || submittingComment) && styles.sendBtnDisabled]}
              onPress={handleAddComment}
              disabled={!commentText.trim() || submittingComment}
            >
              {submittingComment ? <ActivityIndicator color="#fff" size="small" /> : <SendIcon size={16} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── STANDALONE REPOST MODAL (fallback when onRepostPress not provided) ── */}
      <Modal visible={showRepostModal} transparent animationType="none" onRequestClose={handleRepostModalBackAttempt}>
        <Pressable style={styles.modalOverlay} onPress={handleRepostModalBackAttempt}>
          <Animated.View style={[styles.repostModal, modalTransform(repostAnim)]} onStartShouldSetResponder={() => true}>
            <View style={styles.repostModalHeader}>
              <RepostIcon size={20} color={COLORS.accent} />
              <Text style={styles.repostTitle}>Repost</Text>
            </View>
            <Text style={styles.repostSub}>Share this story with your circle</Text>
            <TextInput
              style={styles.repostInput}
              placeholder="Add a thought (optional)..."
              placeholderTextColor={COLORS.textMuted}
              value={repostThought}
              onChangeText={setRepostThought}
              multiline
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={[styles.repostCharCount, { color: repostThought.length > 270 ? COLORS.error : COLORS.textMuted }]}>
              {repostThought.length}/300
            </Text>
            <View style={styles.repostPreview}>
              <View style={styles.repostPreviewHeader}>
                <Text style={styles.repostPreviewAvatar}>{post.pseudonym?.[0]?.toUpperCase()}</Text>
                <Text style={styles.repostPreviewName}>{post.pseudonym}</Text>
              </View>
              <Text style={styles.repostPreviewContent} numberOfLines={3}>{post.content}</Text>
            </View>
            <View style={styles.repostActions}>
              <TouchableOpacity
                style={styles.quickRepostBtn}
                onPress={() => handleStandaloneRepost("")}
                disabled={reposting}
              >
                {reposting && !repostThought.trim()
                  ? <ActivityIndicator color={COLORS.accent} size="small" />
                  : <View style={styles.quickRepostBtnInner}><RepostIcon size={16} color={COLORS.accent} /><Text style={styles.quickRepostText}>Quick repost</Text></View>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.repostWithThoughtBtn, !repostThought.trim() && { opacity: 0.4 }]}
                onPress={() => handleStandaloneRepost(repostThought)}
                disabled={!repostThought.trim() || reposting}
              >
                {reposting && repostThought.trim()
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.repostWithThoughtText}>Repost with thought</Text>
                }
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      <DraftDiscardModal
        visible={showRepostDraftModal}
        mode="save"
        onSave={handleSaveRepostDraft}
        onLeave={handleLeaveRepostDraft}
        onCancel={() => setShowRepostDraftModal(false)}
      />

      {/* ── REACTION PICKER ── */}
      <Modal visible={showReactionPicker} transparent animationType="none" onRequestClose={closeReactionPicker}>
        <Pressable style={styles.modalOverlay} onPress={closeReactionPicker}>
          <Animated.View style={[styles.reactionPicker, modalTransform(pickerAnim)]}>
            <Text style={[styles.pickerTitle, { fontSize: fs.small }]}>How do you feel about this?</Text>
            <View style={styles.pickerGrid}>
              {REACTIONS.map((reaction) => (
                <TouchableOpacity key={reaction.key} style={[styles.reactionItem, userReaction === reaction.key && styles.reactionItemActive]} onPress={() => handleReaction(reaction)}>
                  <reaction.Icon size={26} color={reaction.iconColor} />
                  <Text style={[styles.reactionLabel, { fontSize: fs.badge }, userReaction === reaction.key && { color: COLORS.accentSoft }]}>{reaction.label}</Text>
                  {reactionCounts[reaction.key] > 0 && (
                    <View style={styles.reactionCountBadge}>
                      <Text style={[styles.reactionCountText, { fontSize: fs.badge }]}>{reactionCounts[reaction.key]}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── OPTIONS MENU ── */}
      <Modal visible={showOptions} transparent animationType="none" onRequestClose={closeOptions}>
        <Pressable style={styles.modalOverlay} onPress={closeOptions}>
          <Animated.View style={[styles.optionsMenu, modalTransform(optionsAnim)]}>
            <Text style={[styles.optionsTitle, { fontSize: fs.small }]}>Options</Text>
            <TouchableOpacity style={styles.optionItem} onPress={handleShare}>
              <View style={[styles.optionIconWrap, { backgroundColor: "#4CAF8F22" }]}><ShareIcon size={18} color="#4CAF8F" /></View>
              <View><Text style={[styles.optionLabel, { fontSize: fs.label }]}>Share post</Text><Text style={[styles.optionSub, { fontSize: fs.small }]}>Share this story with others</Text></View>
            </TouchableOpacity>
            {!isOwner && (
              <>
                <TouchableOpacity style={styles.optionItem} onPress={openHideConfirm}>
                  <View style={[styles.optionIconWrap, { backgroundColor: "#6B9FD422" }]}><HideIcon size={18} color="#6B9FD4" /></View>
                  <View><Text style={[styles.optionLabel, { fontSize: fs.label }]}>Hide post</Text><Text style={[styles.optionSub, { fontSize: fs.small }]}>Don't show this post again</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={openReportModal}>
                  <View style={[styles.optionIconWrap, { backgroundColor: "#D4A44C22" }]}><ReportIcon size={18} color={COLORS.warning} /></View>
                  <View><Text style={[styles.optionLabel, { fontSize: fs.label }]}>Report post</Text><Text style={[styles.optionSub, { fontSize: fs.small }]}>Flag harmful or inappropriate content</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionItem} onPress={handleBlockUser}>
                  <View style={[styles.optionIconWrap, { backgroundColor: "#D4607A22" }]}><BlockIcon size={18} color={COLORS.error} /></View>
                  <View><Text style={[styles.optionLabel, { fontSize: fs.label, color: COLORS.error }]}>Block @{post.pseudonym}</Text><Text style={[styles.optionSub, { fontSize: fs.small }]}>Hide all their posts from your feed</Text></View>
                </TouchableOpacity>
              </>
            )}
            {isOwner && (
              <>
                <View style={styles.optionDivider} />
                <Text style={[styles.optionSectionLabel, { fontSize: fs.small }]}>Your post</Text>
                <TouchableOpacity style={styles.optionItem} onPress={handleEditPress}>
                  <View style={[styles.optionIconWrap, { backgroundColor: "#9B6FD422" }]}><EditIcon size={18} color={COLORS.accentSoft} /></View>
                  <View><Text style={[styles.optionLabel, { fontSize: fs.label }]}>Edit post</Text><Text style={[styles.optionSub, { fontSize: fs.small }]}>Change content or mood</Text></View>
                </TouchableOpacity>

                {/* ── Allow / disable reposts toggle ── */}
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={handleToggleAllowReposts}
                  disabled={togglingReposts}
                >
                  <View style={[styles.optionIconWrap, { backgroundColor: allowReposts ? "#4CAF8F22" : "#D4607A22" }]}>
                    {togglingReposts
                      ? <ActivityIndicator size={16} color={allowReposts ? COLORS.success : COLORS.error} />
                      : <RepostToggleIcon size={18} color={allowReposts ? COLORS.success : COLORS.error} />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, { fontSize: fs.label, color: allowReposts ? COLORS.success : COLORS.error }]}>
                      {allowReposts ? "Disable reposts" : "Enable reposts"}
                    </Text>
                    <Text style={[styles.optionSub, { fontSize: fs.small }]}>
                      {allowReposts
                        ? "Stop others from reposting this story"
                        : "Let others repost this story again"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionItem} onPress={openDeleteConfirm}>
                  <View style={[styles.optionIconWrap, { backgroundColor: "#D4607A22" }]}><TrashIcon size={18} color={COLORS.error} /></View>
                  <View><Text style={[styles.optionLabel, { fontSize: fs.label, color: COLORS.error }]}>Delete post</Text><Text style={[styles.optionSub, { fontSize: fs.small }]}>This cannot be undone</Text></View>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── HIDE CONFIRM ── */}
      <Modal visible={showHideConfirm} transparent animationType="none" onRequestClose={closeHideConfirm}>
        <Pressable style={styles.modalOverlay} onPress={closeHideConfirm}>
          <Animated.View style={[styles.confirmModal, modalTransform(hideAnim)]}>
            <View style={styles.confirmIconWrap}><HideConfirmIcon size={44} color="#6B9FD4" /></View>
            <Text style={[styles.confirmTitle, { fontSize: fs.subtitle }]}>Hide this post?</Text>
            <Text style={[styles.confirmText, { fontSize: fs.small }]}>This post will disappear from your feed. You can always refresh to see all posts again.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={closeHideConfirm}><Text style={[styles.confirmCancelText, { fontSize: fs.label }]}>Undo</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: "#6B9FD4" }]} onPress={handleHideConfirm}><Text style={[styles.confirmBtnText, { fontSize: fs.label }]}>Hide it</Text></TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── DELETE CONFIRM ── */}
      <Modal visible={showDeleteConfirm} transparent animationType="none" onRequestClose={closeDeleteConfirm}>
        <Pressable style={styles.modalOverlay} onPress={closeDeleteConfirm}>
          <Animated.View style={[styles.confirmModal, modalTransform(deleteAnim)]}>
            <View style={styles.confirmIconWrap}><DeleteConfirmIcon size={44} color={COLORS.error} /></View>
            <Text style={[styles.confirmTitle, { fontSize: fs.subtitle }]}>Delete this post?</Text>
            <Text style={[styles.confirmText, { fontSize: fs.small }]}>Your words will be gone forever. The hearts you touched will remain. Are you sure?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={closeDeleteConfirm}><Text style={[styles.confirmCancelText, { fontSize: fs.label }]}>Keep it</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: COLORS.error }, deleting && { opacity: 0.6 }]} onPress={handleDeleteConfirm} disabled={deleting}>
                {deleting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={[styles.confirmBtnText, { fontSize: fs.label }]}>Delete</Text>}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── SAVE CONFIRM ── */}
      <Modal visible={showSaveConfirm} transparent animationType="none" onRequestClose={closeSaveConfirm}>
        <Pressable style={styles.modalOverlay} onPress={closeSaveConfirm}>
          <Animated.View style={[styles.confirmModal, modalTransform(saveAnim)]}>
            <View style={styles.confirmIconWrap}><SaveConfirmIcon size={44} color={COLORS.accent} filled={saved} /></View>
            <Text style={[styles.confirmTitle, { fontSize: fs.subtitle }]}>{saved ? "Remove from saved?" : "Save this story?"}</Text>
            <Text style={[styles.confirmText, { fontSize: fs.small }]}>{saved ? "This post will be removed from your saved stories." : "Keep this story close to your heart. You can find it anytime in your saved posts."}</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={closeSaveConfirm}><Text style={[styles.confirmCancelText, { fontSize: fs.label }]}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: saved ? COLORS.error : COLORS.accent }]} onPress={handleSaveConfirm}><Text style={[styles.confirmBtnText, { fontSize: fs.label }]}>{saved ? "Remove" : "Save it"}</Text></TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── REPORT MODAL ── */}
      <Modal visible={showReportModal} transparent animationType="none" onRequestClose={closeReportModal}>
        <Pressable style={styles.modalOverlay} onPress={closeReportModal}>
          <Animated.View style={[styles.reportModal, modalTransform(reportAnim)]} onStartShouldSetResponder={() => true}>
            {reportSubmitted ? (
              <View style={styles.reportSuccess}>
                <View style={styles.confirmIconWrap}>
                  {reportAlreadyDone ? <AlreadyReportedIcon size={44} color={COLORS.warning} /> : <ReportSuccessIcon size={44} color={COLORS.accent} />}
                </View>
                <Text style={[styles.confirmTitle, { fontSize: fs.subtitle }]}>{reportAlreadyDone ? "Already reported" : "Thank you"}</Text>
                <Text style={[styles.confirmText, { fontSize: fs.small }]}>
                  {reportAlreadyDone
                    ? "You have already reported this post. Our team is reviewing it."
                    : "Your report has been submitted. Our team will review this post."}
                </Text>
                {reportAlreadyDone && (
                  <View style={styles.alreadyReportedBadge}>
                    <ClockReviewIcon size={13} color={COLORS.warning} />
                    <Text style={[styles.alreadyReportedText, { fontSize: fs.small }]}>Under review by our team</Text>
                  </View>
                )}
                <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: reportAlreadyDone ? COLORS.warning : COLORS.accent, width: "100%", marginTop: 8 }]} onPress={closeReportModal}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    {!reportAlreadyDone && <ThumbsUpIcon size={14} color="#fff" />}
                    <Text style={[styles.confirmBtnText, { fontSize: fs.label }]}>{reportAlreadyDone ? "Got it" : "Done"}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.reportTitle, { fontSize: fs.subtitle }]}>Report post</Text>
                <Text style={[styles.reportSub, { fontSize: fs.small }]}>Help us keep HushCircle safe and supportive</Text>
                {REPORT_REASONS.map((r) => (
                  <TouchableOpacity key={r.key} style={[styles.reportOption, reportReason === r.key && styles.reportOptionActive]} onPress={() => setReportReason(r.key)}>
                    <View style={[styles.reportOptionIcon, reportReason === r.key && { backgroundColor: COLORS.accent + "33" }]}>
                      <r.Icon size={18} color={reportReason === r.key ? r.iconColor : COLORS.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reportOptionLabel, { fontSize: fs.small }, reportReason === r.key && { color: COLORS.accentSoft }]}>{r.label}</Text>
                      <Text style={[styles.reportOptionSub, { fontSize: fs.badge }]}>{r.sub}</Text>
                    </View>
                    {reportReason === r.key && <CheckIcon size={18} color={COLORS.accent} />}
                  </TouchableOpacity>
                ))}
                <TextInput style={[styles.reportInput, { fontSize: fs.base }]} placeholder="Add any details (optional)..." placeholderTextColor={COLORS.textMuted} value={reportDetails} onChangeText={setReportDetails} multiline maxLength={300} scrollEnabled={false} textAlignVertical="top" />
                <View style={styles.confirmActions}>
                  <TouchableOpacity style={styles.confirmCancelBtn} onPress={closeReportModal}><Text style={[styles.confirmCancelText, { fontSize: fs.label }]}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: reportReason ? COLORS.error : COLORS.border }, (!reportReason || submittingReport) && { opacity: 0.6 }]} onPress={handleSubmitReport} disabled={!reportReason || submittingReport}>
                    {submittingReport ? <ActivityIndicator color="#fff" size="small" /> : <Text style={[styles.confirmBtnText, { fontSize: fs.label }]}>Submit</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </Pressable>
      </Modal>

      <UserProfileCard pseudonym={post.pseudonym} visible={showUserCard} onClose={() => setShowUserCard(false)} />
      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
      <NoNetworkOverlay visible={showNoNetwork} action={noNetworkAction} onClose={() => setShowNoNetwork(false)} onRetry={() => setShowNoNetwork(false)} />
    </View>
  );
}

    const styles = StyleSheet.create({
    card: { backgroundColor: "#1A1330", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#2D2450" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    authorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },
    avatarText: { color: "#EDE8F5", fontFamily: "Nunito_600SemiBold" },
    pseudonym: { color: "#EDE8F5", fontFamily: "Nunito_600SemiBold" },
    time: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", marginTop: 1 },
    headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    moodBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    moodLabel: { fontFamily: "Nunito_500Medium" },
    dotsBtn: { padding: 6 },
    content: { color: "#EDE8F5", fontFamily: "Nunito_400Regular", marginBottom: 14 },
    seeMoreText: { color: "#C4A3E8", fontFamily: "Nunito_600SemiBold", marginTop: 6, marginBottom: 14 },
    reactionSummaryBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0F0A1E", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 10 },
    reactionSummaryIcons: { flexDirection: "row", alignItems: "center", gap: 8 },
    reactionSummaryItem: { flexDirection: "row", alignItems: "center", gap: 3 },
    reactionSummaryCount: { color: "#8B7FA8", fontFamily: "Nunito_400Regular" },
    reactionTotal: { color: "#8B7FA8", fontFamily: "Nunito_400Regular" },
    actions: { flexDirection: "row", alignItems: "center", gap: 20, borderTopWidth: 1, borderTopColor: "#2D2450", paddingTop: 12 },
    actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
    actionText: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 13 },
    commentsSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#2D2450", paddingTop: 12 },
    noComments: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", textAlign: "center", paddingVertical: 8 },
    commentInputRow: { flexDirection: "row", gap: 8, marginTop: 8, alignItems: "flex-end" },
    commentInput: { flex: 1, backgroundColor: "#0F0A1E", borderWidth: 1, borderColor: "#2D2450", borderRadius: 12, padding: 10, color: "#EDE8F5", fontFamily: "Nunito_400Regular", maxHeight: 80 },
    sendBtn: { backgroundColor: "#9B6FD4", width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
    sendBtnDisabled: { opacity: 0.4 },
    editContainer: { marginBottom: 14 },
    editLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
    editLabel: { color: "#C4A3E8", fontFamily: "Nunito_500Medium" },
    moodRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
    moodBtn: { padding: 8, borderRadius: 10, borderWidth: 1, borderColor: "#2D2450" },
    editInput: { backgroundColor: "#0F0A1E", borderWidth: 1, borderColor: "#9B6FD4" + "66", borderRadius: 12, padding: 12, color: "#EDE8F5", fontFamily: "Nunito_400Regular", lineHeight: 26, minHeight: 100 },
    charCount: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", textAlign: "right", marginTop: 4, marginBottom: 10 },
    editActions: { flexDirection: "row", gap: 10 },
    cancelEditBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#2D2450", alignItems: "center" },
    cancelEditText: { color: "#8B7FA8", fontFamily: "Nunito_500Medium" },
    saveEditBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: "#9B6FD4", alignItems: "center" },
    saveEditText: { color: "#fff", fontFamily: "Nunito_600SemiBold" },
    translateBtn: { paddingVertical: 4, marginBottom: 8 },
    translateBtnInner: { flexDirection: "row", alignItems: "center", gap: 5 },
    translateBtnText: { color: "#9B6FD4", fontFamily: "Nunito_500Medium", fontSize: 12 },
    translatedBox: { backgroundColor: "#0F0A1E", borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#9B6FD4" + "33" },
    translatedText: { color: "#EDE8F5", fontFamily: "Nunito_400Regular", marginBottom: 8 },
    seeOriginalBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    seeOriginalText: { color: "#C4A3E8", fontFamily: "Nunito_500Medium", fontSize: 12 },
    modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.65)" },
    reactionPicker: { backgroundColor: "#1A1330", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#2D2450", width: 320, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
    pickerTitle: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", textAlign: "center", marginBottom: 16 },
    pickerGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
    reactionItem: { alignItems: "center", padding: 10, borderRadius: 14, width: "30%", borderWidth: 1, borderColor: "transparent", position: "relative" },
    reactionItemActive: { backgroundColor: "#9B6FD4" + "22", borderColor: "#9B6FD4" + "66" },
    reactionLabel: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", textAlign: "center", marginTop: 4 },
    reactionCountBadge: { position: "absolute", top: 4, right: 4, backgroundColor: "#9B6FD4", borderRadius: 10, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
    reactionCountText: { color: "#fff", fontFamily: "Nunito_600SemiBold" },
    optionsMenu: { backgroundColor: "#1A1330", borderRadius: 24, padding: 12, borderWidth: 1, borderColor: "#2D2450", width: 300, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
    optionsTitle: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", textAlign: "center", paddingVertical: 8, letterSpacing: 0.5 },
    optionItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14 },
    optionIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    optionLabel: { color: "#EDE8F5", fontFamily: "Nunito_500Medium", marginBottom: 2 },
    optionSub: { color: "#8B7FA8", fontFamily: "Nunito_400Regular" },
    optionDivider: { height: 1, backgroundColor: "#2D2450", marginHorizontal: 12, marginVertical: 6 },
    optionSectionLabel: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", paddingHorizontal: 12, paddingBottom: 4, letterSpacing: 0.5 },
    confirmModal: { backgroundColor: "#1A1330", borderRadius: 24, padding: 28, borderWidth: 1, borderColor: "#2D2450", width: 300, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
    confirmIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#0F0A1E", borderWidth: 1, borderColor: "#2D2450", justifyContent: "center", alignItems: "center", marginBottom: 16 },
    confirmTitle: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", marginBottom: 10, textAlign: "center" },
    confirmText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 24 },
    confirmActions: { flexDirection: "row", gap: 10, width: "100%" },
    onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#1A1330", // matches card background
    },
    confirmCancelBtn: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#2D2450", alignItems: "center" },
    confirmCancelText: { color: "#EDE8F5", fontFamily: "Nunito_500Medium" },
    confirmBtn: { flex: 1, padding: 14, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    confirmBtnText: { color: "#fff", fontFamily: "Nunito_600SemiBold" },
    reportModal: { backgroundColor: "#1A1330", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#2D2450", width: 320, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
    reportTitle: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", marginBottom: 4 },
    reportSub: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", marginBottom: 16 },
    reportOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "transparent", marginBottom: 6 },
    reportOptionActive: { borderColor: "#9B6FD4" + "66", backgroundColor: "#9B6FD4" + "11" },
    reportOptionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#0F0A1E", justifyContent: "center", alignItems: "center" },
    reportOptionLabel: { color: "#EDE8F5", fontFamily: "Nunito_500Medium", marginBottom: 1 },
    reportOptionSub: { color: "#8B7FA8", fontFamily: "Nunito_400Regular" },
    reportInput: { backgroundColor: "#0F0A1E", borderWidth: 1, borderColor: "#2D2450", borderRadius: 12, padding: 10, color: "#EDE8F5", fontFamily: "Nunito_400Regular", minHeight: 60, marginTop: 8, marginBottom: 16 },
    reportSuccess: { alignItems: "center", paddingVertical: 8 },
    alreadyReportedBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#D4A44C22", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#D4A44C44", marginBottom: 8 },
    alreadyReportedText: { color: "#D4A44C", fontFamily: "Nunito_500Medium", textAlign: "center" },
    repostModal: { backgroundColor: "#1A1330", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#2D2450", width: 320, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
    repostModalHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
    repostTitle: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 22 },
    repostSub: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 14 },
    repostInput: { backgroundColor: "#0F0A1E", borderWidth: 1, borderColor: "#2D2450", borderRadius: 12, padding: 10, color: "#EDE8F5", fontFamily: "Nunito_400Regular", fontSize: 14, minHeight: 70, marginBottom: 4 },
    repostCharCount: { fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "right", marginBottom: 12 },
    repostPreview: { backgroundColor: "#0F0A1E", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#2D2450", marginBottom: 16 },
    repostPreviewHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
    repostPreviewAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#9B6FD4" + "33", textAlign: "center", lineHeight: 24, color: "#EDE8F5", fontFamily: "Nunito_600SemiBold", fontSize: 11 },
    repostPreviewName: { color: "#C4A3E8", fontFamily: "Nunito_600SemiBold", fontSize: 13 },
    repostPreviewContent: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20 },
    repostActions: { gap: 10 },
    quickRepostBtn: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#2D2450", alignItems: "center" },
    quickRepostBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
    quickRepostText: { color: "#EDE8F5", fontFamily: "Nunito_600SemiBold", fontSize: 14 },
    repostWithThoughtBtn: { backgroundColor: "#9B6FD4", padding: 14, borderRadius: 14, alignItems: "center" },
    repostWithThoughtText: { color: "#fff", fontFamily: "Nunito_600SemiBold", fontSize: 14 },
    });

