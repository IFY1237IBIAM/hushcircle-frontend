import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  View, Text, FlatList,
  TouchableOpacity, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert, RefreshControl,
  Animated, Modal, Clipboard, ScrollView, StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Polyline, Circle, Line, Rect } from "react-native-svg";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useNetwork } from "../context/NetworkContext";
import { useTheme } from "../context/ThemeContext";
import { joinGroupRoom, leaveGroupRoom } from "../services/socket";
import NoNetworkOverlay from "../components/NoNetworkOverlay";
import HushCircleSpinner from "../components/HushCircleSpinner";
import useSpinner from "../hooks/useSpinner";
import { useChatTheme } from "../hooks/useChatTheme";
import ChatThemeModal from "../components/ChatThemeModal";
import { ChatWallpaperBackground } from "../components/ChatWallpaper";
import UserProfileCard from "../components/UserProfileCard";
import AvatarVibeEmoji from "../components/AvatarVibeEmoji";
import { getLocalDateString } from "../utils/dateHelpers";

// ── Static constants ──────────────────────────────────────────────────────────
const CIRCLE_KEEPER_EMAIL = "mom@gmail.com";
const EDIT_WINDOW_MS      = 5 * 60 * 1000;
const SWIPE_THRESHOLD     = 60;

const MUTE_DURATIONS = [
  { key: "1h",        label: "1 hour" },
  { key: "24h",       label: "24 hours" },
  { key: "7d",        label: "7 days" },
  { key: "permanent", label: "Permanently" },
];

const REPORT_REASONS = [
  { key: "harassment",    label: "Harassment" },
  { key: "bullying",      label: "Bullying" },
  { key: "spam",          label: "Spam" },
  { key: "inappropriate", label: "Inappropriate content" },
  { key: "other",         label: "Other" },
];

// ── Mood SVG Icons ────────────────────────────────────────────────────────────
const MoodHeartbreakIcon = ({ size = 18, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 8v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M10 10l4 4M14 10l-4 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const MoodFearIcon       = ({ size = 18, color = "#6B9FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 15s1.5-2 4-2 4 2 4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M9 6l1 2M15 6l-1 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const MoodSadnessIcon    = ({ size = 18, color = "#7B8FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M16 16s-1.5-2-4-2-4 2-4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);
const MoodStruggleIcon   = ({ size = 18, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 14s1.5 1 4 1 4-1 4-1" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 9l1.5 1.5L12 9l1.5 1.5L15 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MoodHopeIcon       = ({ size = 18, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 13s1.5 2 4 2 4-2 4-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M12 3v2M16.5 4.5l-1.5 1.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const MoodJoyIcon        = ({ size = 18, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 13s1.5 3 4 3 4-3 4-3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M12 2v1.5M8 3.5l1 1.5M16 3.5l-1 1.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const MoodCalmIcon       = ({ size = 18, color = "#C4A3E8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M9 13s1 1.5 3 1.5 3-1.5 3-1.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

// ── UI SVG Icons ──────────────────────────────────────────────────────────────
const SearchIcon      = ({ size = 18, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const CloseIcon       = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const BackIcon        = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="15 18 9 12 15 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const SendIcon        = ({ size = 18, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 2L15 22l-4-9-9-4 20-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PinIcon         = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const InfoIcon        = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="16" x2="12.01" y2="16" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);
const EditIcon        = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const TrashIcon       = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const RetryIcon       = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1 4v6h6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3.51 15a9 9 0 1 0 .49-4.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ReplyIcon       = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="9 17 4 12 9 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20 18v-2a4 4 0 0 0-4-4H4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CopyIcon        = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const CrownIcon       = ({ size = 12, color = "#FFD700" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2 20h20M4 20l2-8 5 4 3-8 3 8 5-4 2 8" fill={color + "33"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const LockIcon        = ({ size = 13, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const HeartIcon       = ({ size = 48, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill={color + "33"} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const MessageSearchIcon = ({ size = 48, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="11" cy="10" r="3" stroke={color} strokeWidth={1.5} />
    <Line x1="14" y1="13" x2="16" y2="15" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
const PaletteThemeIcon = ({ size = 18, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Circle cx="8"  cy="10" r="1.5" fill={color} />
    <Circle cx="12" cy="7"  r="1.5" fill={color} />
    <Circle cx="16" cy="10" r="1.5" fill={color} />
    <Path d="M12 17c2.5 0 4-1.5 4-3H8c0 1.5 1.5 3 4 3z" fill={color} />
  </Svg>
);
const BroomIcon        = ({ size = 18, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 21l9-9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12.5 6.5l5 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 3c0 0-6 2-7.5 7.5L14 16c5.5-1.5 7.5-7.5 7.5-7.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 21c1-1 2-4 4-4s3 3 4 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Mood config ───────────────────────────────────────────────────────────────
const MOOD_CONFIG = {
  heartbreak: { Icon: MoodHeartbreakIcon, color: "#D4607A" },
  fear:       { Icon: MoodFearIcon,       color: "#6B9FD4" },
  sadness:    { Icon: MoodSadnessIcon,    color: "#7B8FD4" },
  struggle:   { Icon: MoodStruggleIcon,   color: "#D4A44C" },
  hope:       { Icon: MoodHopeIcon,       color: "#4CAF8F" },
  joy:        { Icon: MoodJoyIcon,        color: "#9B6FD4" },
  calm:       { Icon: MoodCalmIcon,       color: "#C4A3E8" },
};

const MOODS = [
  { key: "hope" }, { key: "joy" }, { key: "calm" },
  { key: "sadness" }, { key: "struggle" }, { key: "fear" }, { key: "heartbreak" },
];

// ── Message ticks ─────────────────────────────────────────────────────────────
function MessageTicks({ sent = true, delivered, read, accentColor, mutedColor }) {
  if (read) {
    return (
      <Svg width={18} height={11} viewBox="0 0 18 11" fill="none">
        <Polyline points="1 5 4 8 10 2" stroke={accentColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Polyline points="8 5 11 8 17 2" stroke={accentColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (delivered) {
    return (
      <Svg width={18} height={11} viewBox="0 0 18 11" fill="none">
        <Polyline points="1 5 4 8 10 2" stroke={mutedColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Polyline points="8 5 11 8 17 2" stroke={mutedColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={11} height={11} viewBox="0 0 11 11" fill="none">
      <Polyline points="1 5 4 8 10 2" stroke={mutedColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDateSeparator(date) {
  if (!date) return "";
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function canEdit(post) { return Date.now() - new Date(post.createdAt).getTime() < EDIT_WINDOW_MS; }

// ── Sub-components ────────────────────────────────────────────────────────────

function MentionText({ text, style, accentColor }) {
  if (!text) return null;
  const parts = text.split(/(@\w+)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        /^@\w+/.test(part)
          ? <Text key={i} style={{ color: accentColor, fontFamily: "Nunito_600SemiBold" }}>{part}</Text>
          : <Text key={i}>{part}</Text>
      )}
    </Text>
  );
}

function ReplyPreview({ post, onCancel, C }) {
  if (!post) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
      <View style={{ width: 3, minHeight: 36, backgroundColor: C.accent, borderRadius: 2 }} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
          <ReplyIcon size={12} color={C.accentSoft} />
          <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12 }}>Replying to {post.pseudonym}</Text>
        </View>
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }} numberOfLines={2}>{post.content}</Text>
      </View>
      <TouchableOpacity onPress={onCancel} style={{ padding: 4 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <CloseIcon size={14} color={C.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

function MentionSuggestions({ suggestions, onSelect, C }) {
  if (!suggestions.length) return null;
  return (
    <View style={{ backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, maxHeight: 200 }}>
      {suggestions.map((m) => (
        <TouchableOpacity key={m._id} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border + "66", gap: 10 }} onPress={() => onSelect(m.pseudonym)}>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.accent + "33", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 13 }}>{m.pseudonym[0].toUpperCase()}</Text>
          </View>
          <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>@{m.pseudonym}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function TypingBar({ typingUsers, C }) {
  if (!typingUsers.length) return null;
  const label = typingUsers.length === 1
    ? `${typingUsers[0].pseudonym} is typing...`
    : typingUsers.length === 2
    ? `${typingUsers[0].pseudonym}, ${typingUsers[1].pseudonym} are typing...`
    : `${typingUsers.length} people are typing...`;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 6, backgroundColor: C.bg, gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 3 }}>
        {[0, 1, 2].map((i) => <View key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.accentSoft, opacity: 1 - i * 0.3 }} />)}
      </View>
      <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, fontStyle: "italic" }}>{label}</Text>
    </View>
  );
}

function PinnedBanner({ pinnedMessage, onDismiss, onTap, isKeeper, currentUserId, C }) {
  if (!pinnedMessage?.content) return null;
  if (pinnedMessage.expiresAt && new Date() > new Date(pinnedMessage.expiresAt)) return null;
  const pinnerLabel = pinnedMessage.pinnedBy === currentUserId ? "You pinned a message" : `${pinnedMessage.pinnedByPseudonym || "Someone"} pinned a message`;
  const expiryLabel = (() => {
    if (!pinnedMessage.expiresAt) return null;
    const diff = new Date(pinnedMessage.expiresAt) - new Date();
    if (diff <= 0) return null;
    const hrs = Math.ceil(diff / (1000 * 60 * 60));
    return hrs < 24 ? `${hrs}h left` : `${Math.ceil(hrs / 24)}d left`;
  })();
  return (
    <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.accent + "18", paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.accent + "33" }} onPress={onTap} activeOpacity={0.8}>
      <PinIcon size={13} color={C.accentSoft} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 10, letterSpacing: 0.4, marginBottom: 1 }}>{pinnerLabel}</Text>
          {expiryLabel && <Text style={{ color: C.warning, fontFamily: "Nunito_600SemiBold", fontSize: 9, letterSpacing: 0.3 }}>{expiryLabel}</Text>}
        </View>
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }} numberOfLines={1}>{pinnedMessage.content}</Text>
      </View>
      {isKeeper && (
        <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onDismiss(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <CloseIcon size={13} color={C.textMuted} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

function FailedMessageBar({ message, onRetry, onDiscard, C }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.error + "18", paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.error + "33" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
        <RetryIcon size={14} color={C.error} />
        <Text style={{ color: C.error, fontFamily: "Nunito_400Regular", fontSize: 12, flex: 1 }} numberOfLines={1}>{message}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <TouchableOpacity style={{ backgroundColor: C.error + "22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.error + "44" }} onPress={onRetry}>
          <Text style={{ color: C.error, fontFamily: "Nunito_600SemiBold", fontSize: 12 }}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDiscard}><CloseIcon size={14} color={C.textMuted} /></TouchableOpacity>
      </View>
    </View>
  );
}

function SystemMessage({ post, currentUserId, onTapPinned, C }) {
  if (!post.isSystem) return null;
  const isMe = post.pinnedById === currentUserId;
  const label = isMe ? "You pinned a message" : `${post.pinnedByPseudonym || "Someone"} pinned a message`;
  return (
    <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 16, marginVertical: 4 }} onPress={() => post.pinnedPostId && onTapPinned(post.pinnedPostId)} activeOpacity={post.pinnedPostId ? 0.7 : 1}>
      <PinIcon size={11} color={C.textMuted} />
      <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, fontStyle: "italic" }}>{label}</Text>
      {post.pinnedPostId && <Text style={{ color: C.accentSoft, fontFamily: "Nunito_400Regular", fontSize: 12, fontStyle: "italic", marginLeft: 2 }}>· tap to view</Text>}
    </TouchableOpacity>
  );
}

// ── Message Action Sheet ──────────────────────────────────────────────────────
function MessageActionSheet({ visible, isOwn, isDeleted, canStillEdit, isKeeper, onClose, onDelete, onCopy, onReply, onEdit, onInfo, onPin, C }) {
  if (!visible) return null;
  const items = [];
  if (!isDeleted) {
    items.push({ label: "Reply",          Icon: ReplyIcon, color: C.text,       onPress: onReply });
    items.push({ label: "Copy text",      Icon: CopyIcon,  color: C.text,       onPress: onCopy });
    items.push({ label: "Pin message",    Icon: PinIcon,   color: C.accentSoft, onPress: onPin });
  }
  if (isOwn && !isDeleted && canStillEdit)
    items.push({ label: "Edit message",   Icon: EditIcon,  color: C.text,       onPress: onEdit });
  if (isOwn && !isDeleted)
    items.push({ label: "Message info",   Icon: InfoIcon,  color: C.text,       onPress: onInfo });
  if ((isOwn || isKeeper) && !isDeleted)
    items.push({ label: "Delete message", Icon: TrashIcon, color: C.error,      onPress: onDelete });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }} onPress={onClose} activeOpacity={1}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === "ios" ? 34 : 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border }}>
          {items.map((item, i) => (
            <View key={i}>
              <TouchableOpacity style={{ paddingVertical: 16, paddingHorizontal: 24 }} onPress={() => { onClose(); item.onPress(); }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <item.Icon size={16} color={item.color} />
                  <Text style={{ color: item.color, fontFamily: "Nunito_600SemiBold", fontSize: 16 }}>{item.label}</Text>
                </View>
              </TouchableOpacity>
              {i < items.length - 1 && <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: 16 }} />}
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: 16 }} />
          <TouchableOpacity style={{ paddingVertical: 16, paddingHorizontal: 24 }} onPress={onClose}>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 16, textAlign: "center" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Members List Modal ────────────────────────────────────────────────────────
function MembersListModal({ visible, onClose, members, membersLoading, group, user, isCircleKeeperUser, mutedMemberIds, isGroupClosed, onMute, onRemove, onToggleClose, onReport, C }) {
  const [showMuteModal, setShowMuteModal]     = useState(false);
  const [muteTarget, setMuteTarget]           = useState(null);
  const [muteReason, setMuteReason]           = useState("");
  const [muteDuration, setMuteDuration]       = useState("24h");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget]       = useState(null);
  const [reportReason, setReportReason]       = useState("");
  const [reportDetails, setReportDetails]     = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  if (!visible) return null;

  const isKeeper = (member) => member._id?.toString() === group.creator?.toString() || member.email === CIRCLE_KEEPER_EMAIL;

  const handleMutePress   = (member) => { setMuteTarget(member); setMuteReason(""); setMuteDuration("24h"); setShowMuteModal(true); };
  const handleReportPress = (member) => { setReportTarget(member); setReportReason(""); setReportDetails(""); setShowReportModal(true); };
  const handleSubmitReport = async () => {
    if (!reportReason || !reportTarget) return;
    setSubmittingReport(true);
    try { await onReport(reportTarget._id, reportReason, reportDetails); setShowReportModal(false); setReportTarget(null); }
    catch (e) {} finally { setSubmittingReport(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: "85%", borderTopWidth: 1, borderTopColor: C.border }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <View>
              <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 18 }}>{group.name}</Text>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, marginTop: 2 }}>{members.length} member{members.length !== 1 ? "s" : ""}</Text>
            </View>
            <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.border, justifyContent: "center", alignItems: "center" }} onPress={onClose}>
              <CloseIcon size={14} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          {isCircleKeeperUser && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 10, backgroundColor: C.accent + "11", borderBottomWidth: 1, borderBottomColor: C.accent + "22" }}>
              <Text style={{ color: C.accentSoft, fontFamily: "Nunito_600SemiBold", fontSize: 12 }}>Circle_Keeper controls</Text>
              <TouchableOpacity style={{ backgroundColor: isGroupClosed ? C.success + "22" : C.error + "22", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: isGroupClosed ? C.success + "55" : C.error + "44" }} onPress={onToggleClose}>
                <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: isGroupClosed ? C.success : C.error }}>{isGroupClosed ? "Reopen circle" : "Close circle"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {isGroupClosed && (
            <View style={{ backgroundColor: C.error + "18", paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.error + "33" }}>
              <Text style={{ color: C.error, fontFamily: "Nunito_500Medium", fontSize: 12, lineHeight: 18 }}>This circle is temporarily closed. Only the Circle_Keeper can post.</Text>
            </View>
          )}

          {membersLoading ? (
            <View style={{ alignItems: "center", paddingVertical: 32, gap: 10 }}>
              <ActivityIndicator color={C.accent} />
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14 }}>Loading members...</Text>
            </View>
          ) : (
            <ScrollView style={{ paddingHorizontal: 16, paddingTop: 8 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {members.map((member) => {
                const isMe          = member.pseudonym === user?.pseudonym;
                const isThisKeeper  = isKeeper(member);
                const isMuted       = mutedMemberIds.includes(member._id?.toString());
                return (
                  <View key={member._id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: C.border + "66" }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.accent + "22", justifyContent: "center", alignItems: "center", flexShrink: 0, ...(isThisKeeper ? { borderColor: C.accent, borderWidth: 2 } : {}) }}>
                      <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 16 }}>{member.pseudonym?.[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>@{member.pseudonym}{isMe ? " (you)" : ""}</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                        {isThisKeeper && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.accent + "22", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: C.accent + "44" }}>
                            <CrownIcon size={10} color="#FFD700" />
                            <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 10 }}>Circle_Keeper</Text>
                          </View>
                        )}
                        {isMuted && (
                          <View style={{ backgroundColor: C.error + "22", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: C.error + "44" }}>
                            <Text style={{ color: C.error, fontFamily: "Nunito_600SemiBold", fontSize: 10 }}>Muted{member.muteExpiresAt ? ` until ${new Date(member.muteExpiresAt).toLocaleDateString()}` : " permanently"}</Text>
                          </View>
                        )}
                      </View>
                      {isMuted && member.muteReason ? <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, fontStyle: "italic", marginTop: 2 }}>"{member.muteReason}"</Text> : null}
                    </View>
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                      {!isMe && !isThisKeeper && (
                        <TouchableOpacity style={{ backgroundColor: C.warning + "22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: C.warning + "44" }} onPress={() => handleReportPress(member)}>
                          <Text style={{ color: C.warning, fontFamily: "Nunito_700Bold", fontSize: 11 }}>Report</Text>
                        </TouchableOpacity>
                      )}
                      {isCircleKeeperUser && !isMe && !isThisKeeper && (
                        <>
                          <TouchableOpacity style={{ backgroundColor: isMuted ? C.success + "22" : C.warning + "22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: isMuted ? C.success + "44" : C.warning + "44" }} onPress={() => isMuted ? onMute(member._id, member.pseudonym, true) : handleMutePress(member)}>
                            <Text style={{ color: isMuted ? C.success : C.warning, fontFamily: "Nunito_700Bold", fontSize: 11 }}>{isMuted ? "Unmute" : "Mute"}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={{ backgroundColor: C.error + "22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: C.error + "44" }} onPress={() => onRemove(member._id, member.pseudonym)}>
                            <Text style={{ color: C.error, fontFamily: "Nunito_700Bold", fontSize: 11 }}>Remove</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Mute modal */}
      <Modal visible={showMuteModal} transparent animationType="fade" onRequestClose={() => setShowMuteModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 24, width: "100%", maxWidth: 360, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 20, marginBottom: 4 }}>Mute @{muteTarget?.pseudonym}</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 16 }}>Select duration and optional reason</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {MUTE_DURATIONS.map((d) => (
                <TouchableOpacity key={d.key} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: muteDuration === d.key ? C.accent : C.border, backgroundColor: muteDuration === d.key ? C.accent + "22" : C.inputBg }} onPress={() => setMuteDuration(d.key)}>
                  <Text style={{ color: muteDuration === d.key ? C.accent : C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 12 }}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={{ backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 14, marginBottom: 16, minHeight: 50 }} placeholder="Reason (shown to user, optional)..." placeholderTextColor={C.textMuted} value={muteReason} onChangeText={setMuteReason} maxLength={120} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: "center" }} onPress={() => setShowMuteModal(false)}>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: C.error, alignItems: "center" }} onPress={() => { setShowMuteModal(false); onMute(muteTarget._id, muteTarget.pseudonym, false, muteReason, muteDuration); }}>
                <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 }}>Mute</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report modal */}
      <Modal visible={showReportModal} transparent animationType="fade" onRequestClose={() => setShowReportModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 24, width: "100%", maxWidth: 360, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 20, marginBottom: 4 }}>Report @{reportTarget?.pseudonym}</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 16 }}>Select a reason to report this member</Text>
            {REPORT_REASONS.map((r) => (
              <TouchableOpacity key={r.key} style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: reportReason === r.key ? C.accent : C.border, backgroundColor: reportReason === r.key ? C.accent + "18" : C.inputBg, marginBottom: 6 }} onPress={() => setReportReason(r.key)}>
                <Text style={{ color: reportReason === r.key ? C.accent : C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 13 }}>{r.label}</Text>
              </TouchableOpacity>
            ))}
            <TextInput style={{ backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 14, marginBottom: 16, minHeight: 50 }} placeholder="Additional details (optional)..." placeholderTextColor={C.textMuted} value={reportDetails} onChangeText={setReportDetails} maxLength={200} multiline />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: "center" }} onPress={() => setShowReportModal(false)}>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: C.warning, alignItems: "center", opacity: (!reportReason || submittingReport) ? 0.5 : 1 }} onPress={handleSubmitReport} disabled={!reportReason || submittingReport}>
                {submittingReport ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 }}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

// ── Message Info Modal ────────────────────────────────────────────────────────
function MessageInfoModal({ visible, info, onClose, C }) {
  if (!visible || !info) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: "60%", borderTopWidth: 1, borderTopColor: C.border }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 18 }}>Message info</Text>
            <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.border, justifyContent: "center", alignItems: "center" }} onPress={onClose}>
              <CloseIcon size={14} color={C.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, letterSpacing: 0.4, marginBottom: 6, marginTop: 16 }}>Sent</Text>
            <Text style={{ color: C.text, fontFamily: "Nunito_400Regular", fontSize: 14 }}>{info.sentAt ? new Date(info.sentAt).toLocaleString() : "—"}</Text>
            {["readBy", "deliveredTo"].map((key) => (
              <View key={key}>
                <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, letterSpacing: 0.4, marginBottom: 6, marginTop: 16 }}>{key === "readBy" ? "Read by" : "Delivered to"}</Text>
                {info[key]?.length > 0
                  ? info[key].map((u) => (
                      <View key={u._id} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.accent + "33", justifyContent: "center", alignItems: "center" }}>
                          <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 11 }}>{u.pseudonym?.[0]?.toUpperCase()}</Text>
                        </View>
                        <Text style={{ color: C.text, fontFamily: "Nunito_500Medium", fontSize: 13 }}>@{u.pseudonym}</Text>
                      </View>
                    ))
                  : <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, fontStyle: "italic" }}>{key === "readBy" ? "Not read yet" : "Not delivered yet"}</Text>
                }
              </View>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
// ← AvatarVibeEmoji added to other-user avatar only
function MessageBubble({ post, isOwn, allPosts, onSwipeReply, onLongPress, themeColors, onAvatarPress, C, localDate }) {
  const TC = themeColors || { myBubble: "#2A1F4A", theirBubble: "#1A1330", text: "#EDE8F5", textMuted: "#8B7FA8", accentSoft: "#C4A3E8" };
  const translateX  = useRef(new Animated.Value(0)).current;
  const originalPost = post.replyTo ? allPosts.find((p) => p._id === (post.replyTo?._id || post.replyTo)) : null;
  const isDeleted   = post.deleted;
  const delivered   = (post.deliveredTo?.length || 0) > 0;
  const read        = (post.readBy?.length || 0) > 0;
  const moodCfg     = post.mood && post.mood !== "hope" ? MOOD_CONFIG[post.mood] : null;

  const deletedLabel = (() => {
    if (!isDeleted) return null;
    if (post.deletedBy === "Crown_Keeper") return post.deletedByPseudonym ? `Deleted by Crown_Keeper (@${post.deletedByPseudonym})` : "Deleted by Crown_Keeper";
    return "This message was deleted.";
  })();

  const handleGestureEvent  = Animated.event([{ nativeEvent: { translationX: translateX } }], { useNativeDriver: true });
  const handleStateChange   = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      if (!isDeleted) {
        if (!isOwn && nativeEvent.translationX > SWIPE_THRESHOLD) onSwipeReply(post);
        else if (isOwn && nativeEvent.translationX < -SWIPE_THRESHOLD) onSwipeReply(post);
      }
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 100, friction: 10 }).start();
    }
  };
  const clampedX = isOwn
    ? translateX.interpolate({ inputRange: [-100, 0], outputRange: [-60, 0], extrapolate: "clamp" })
    : translateX.interpolate({ inputRange: [0, 100], outputRange: [0, 60], extrapolate: "clamp" });

  return (
    <PanGestureHandler onGestureEvent={handleGestureEvent} onHandlerStateChange={handleStateChange} activeOffsetX={isOwn ? [-15, 200] : [-200, 15]}>
      <Animated.View style={[
        { flexDirection: "row", marginBottom: 6, alignItems: "flex-end", gap: 8 },
        isOwn ? { justifyContent: "flex-end", paddingLeft: 48 } : { justifyContent: "flex-start", paddingRight: 48 },
        { transform: [{ translateX: clampedX }] },
      ]}>

        {/* ── Other user avatar with vibe emoji ── */}
        {!isOwn && (
          <TouchableOpacity
            onPress={() => onAvatarPress && onAvatarPress(post.pseudonym)}
            activeOpacity={0.7}
            style={{
              position:        "relative",
              width:           30,
              height:          30,
              borderRadius:    15,
              backgroundColor: C.accent + "33",
              justifyContent:  "center",
              alignItems:      "center",
              flexShrink:      0,
              marginBottom:    2,
            }}
          >
            <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12 }}>
              {post.pseudonym?.[0]?.toUpperCase()}
            </Text>
            <AvatarVibeEmoji
              pseudonym={post.pseudonym}
              localDate={localDate}
              size={10}
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity onLongPress={() => !isDeleted && onLongPress(post)} delayLongPress={400} activeOpacity={0.85} style={{ maxWidth: "80%", flexShrink: 1 }}>
          <View style={[
            { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 2 },
            isOwn
              ? { backgroundColor: TC.myBubble, borderBottomRightRadius: 4, borderWidth: 1, borderColor: C.accent + "33" }
              : { backgroundColor: TC.theirBubble, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border },
            isDeleted && { opacity: 0.55 },
          ]}>
            {!isOwn && <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 4 }}>{post.pseudonym}</Text>}

            {originalPost && !isDeleted && (
              <View style={{ flexDirection: "row", marginBottom: 8, backgroundColor: C.inputBg, borderRadius: 10, overflow: "hidden" }}>
                <View style={{ width: 3, backgroundColor: C.accent }} />
                <View style={{ flex: 1, padding: 8 }}>
                  <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 11, marginBottom: 2 }}>{originalPost.pseudonym}</Text>
                  <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, flexWrap: "wrap" }} numberOfLines={2}>
                    {originalPost.deleted ? "This message was deleted." : originalPost.content}
                  </Text>
                </View>
              </View>
            )}

            {isDeleted ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                {post.deletedBy === "Crown_Keeper" && <CrownIcon size={11} color={C.textMuted} />}
                <Text style={{ color: post.deletedBy === "Crown_Keeper" ? "#A08060" : C.textMuted, fontFamily: post.deletedBy === "Crown_Keeper" ? "Nunito_500Medium" : "Nunito_400Regular", fontSize: 14, fontStyle: "italic", lineHeight: 20, flexShrink: 1 }}>
                  {deletedLabel}
                </Text>
              </View>
            ) : (
              <MentionText text={post.content} style={{ color: TC.text || C.text, fontFamily: "Nunito_400Regular", fontSize: 15, lineHeight: 22, flexWrap: "wrap" }} accentColor={C.accentSoft} />
            )}

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 }}>
              {!isDeleted && moodCfg && <moodCfg.Icon size={12} color={moodCfg.color} />}
              {!isDeleted && post.isEdited && <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 9, fontStyle: "italic" }}>edited</Text>}
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 10 }}>{formatTime(post.createdAt)}</Text>
              {isOwn && !isDeleted && <MessageTicks sent delivered={delivered} read={read} accentColor={C.accent} mutedColor={C.textMuted} />}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
}

// ── Main GroupChatScreen ──────────────────────────────────────────────────────
export default function GroupChatScreen() {
  const route      = useRoute();
  const navigation = useNavigation();
  const { user }   = useAuth();
  const { socket, connected } = useSocket();
  const { isConnected }       = useNetwork();
  const { colors: C }         = useTheme();
  const spinner  = useSpinner();
  const group    = route.params?.group;
  const flatListRef = useRef(null);
  const userId   = user?._id?.toString() || user?.id?.toString();

  // Stable localDate for the whole screen session
  const localDate = getLocalDateString();

  const { theme, wallpaper, setTheme, setWallpaper } = useChatTheme(userId, group._id);
  const T = theme.colors;

  const [showThemeModal, setShowThemeModal]     = useState(false);
  const DRAFT_KEY = `draft_group_${group._id}`;

  const [profileCardPseudonym, setProfileCardPseudonym] = useState(null);
  const [showProfileCard, setShowProfileCard]   = useState(false);
  const [clearingChat, setClearingChat]         = useState(false);

  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]       = useState(true);
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const [isRemovedMember, setIsRemovedMember] = useState(false);

  const [content, setContent]         = useState("");
  const [mood, setMood]               = useState("hope");
  const [posting, setPosting]         = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [failedMessage, setFailedMessage] = useState(null);

  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);

  const [members, setMembers]               = useState([]);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [isCircleKeeperUser, setIsCircleKeeperUser] = useState(false);
  const [isGroupClosed, setIsGroupClosed]   = useState(false);
  const [mutedMemberIds, setMutedMemberIds] = useState([]);
  const [myMuteInfo, setMyMuteInfo]         = useState(null);
  const [pinnedMessage, setPinnedMessage]   = useState(null);

  const [typingUsers, setTypingUsers]   = useState([]);
  const isTypingRef                     = useRef(false);
  const typingTimeoutRef                = useRef(null);
  const autoHideTimers                  = useRef({});

  const [showSearch, setShowSearch]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [actionTarget, setActionTarget] = useState(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showMembers, setShowMembers]   = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showMsgInfo, setShowMsgInfo]   = useState(false);
  const [msgInfo, setMsgInfo]           = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinTarget, setPinTarget]       = useState(null);
  const [pinDuration, setPinDuration]   = useState("24h");

  useFocusEffect(useCallback(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
    return () => { navigation.getParent()?.setOptions({ tabBarStyle: undefined }); };
  }, [navigation]));

  useEffect(() => {
    const loadMembers = async () => {
      if (!isConnected) return;
      try {
        const res = await api.get(`/groups/${group._id}/members`);
        const memberList = res.data.members || [];
        setMembers(memberList);
        setIsGroupClosed(res.data.isClosed || false);
        setPinnedMessage(res.data.pinnedMessage || null);
        const meInList  = memberList.find((m) => m.pseudonym === user?.pseudonym);
        const creatorId = res.data.creatorId?.toString();
        setIsCircleKeeperUser(meInList?._id?.toString() === creatorId || meInList?.email === CIRCLE_KEEPER_EMAIL);
        setMutedMemberIds(memberList.filter((m) => m.isMuted).map((m) => m._id?.toString()));
        const me = memberList.find((m) => m.pseudonym === user?.pseudonym);
        setMyMuteInfo(me?.isMuted ? { reason: me.muteReason || "", duration: me.muteDuration || "permanent", expiresAt: me.muteExpiresAt || null } : null);
      } catch (e) {}
    };
    loadMembers();
  }, [group._id, isConnected]);

  const fetchPosts = useCallback(async (loadMore = false) => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    try {
      const firstId = loadMore && posts.length > 0 ? posts[0]._id : undefined;
      const params  = firstId ? `?firstId=${firstId}&limit=30` : "?limit=30";
      const res     = await api.get(`/groups/${group._id}/posts${params}`);
      const newPosts = res.data.posts || [];
      setIsRemovedMember(res.data.isRemovedMember || false);
      if (loadMore) {
        setPosts((prev) => { const existingIds = new Set(prev.map((p) => p._id)); return [...newPosts.filter((p) => !existingIds.has(p._id)), ...prev]; });
        setHasMore(newPosts.length === 30);
      } else {
        setPosts(newPosts);
        setHasMore(newPosts.length === 30);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
      }
    } catch (e) { console.log("Group posts error:", e.message); }
  }, [group._id, isConnected, posts]);

  useEffect(() => {
    fetchPosts().finally(() => setLoading(false));
    AsyncStorage.getItem(DRAFT_KEY).then((saved) => { if (saved) setContent(saved); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!group?._id || !connected) return;
    joinGroupRoom(group._id);
    return () => leaveGroupRoom(group._id);
  }, [group._id, connected]);

  useEffect(() => {
    if (!socket || !group?._id) return;

    const handleNewPost      = (data) => {
      if (data.groupId !== group._id) return;
      setPosts((prev) => { const exists = prev.some((p) => p._id === data.post._id); if (exists) return prev; return [...prev, data.post]; });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      if (data.post.pseudonym !== user?.pseudonym) api.post(`/groups/${group._id}/posts/${data.post._id}/read`).catch(() => {});
    };
    const handlePostDeleted  = (data) => {
      if (data.groupId !== group._id) return;
      setPosts((prev) => prev.map((p) => p._id === data.postId ? { ...p, deleted: true, deletedBy: data.deletedBy || null, deletedByPseudonym: data.deletedByPseudonym || null } : p));
    };
    const handlePostEdited   = (data) => {
      if (data.groupId !== group._id) return;
      setPosts((prev) => prev.map((p) => p._id === data.postId ? { ...p, content: data.content, isEdited: true, editedAt: data.editedAt } : p));
    };
    const handleGroupClosed    = (data) => { if (data.groupId?.toString() !== group._id?.toString()) return; setIsGroupClosed(data.isClosed); };
    const handlePinnedUpdated  = (data) => { if (data.groupId !== group._id) return; setPinnedMessage(data.pinnedMessage); };
    const handleDelivered      = (data) => { if (data.groupId !== group._id) return; setPosts((prev) => prev.map((p) => p._id === data.postId ? { ...p, deliveredTo: [...(p.deliveredTo || []), data.userId] } : p)); };
    const handleRead           = (data) => { if (data.groupId !== group._id) return; setPosts((prev) => prev.map((p) => p._id === data.postId ? { ...p, readBy: [...(p.readBy || []), data.userId], deliveredTo: [...(p.deliveredTo || []), data.userId] } : p)); };
    const handleRemovedFromGroup = (data) => { if (data.groupId?.toString() !== group._id?.toString()) return; setIsRemovedMember(true); };

    socket.on("group_post_added",    handleNewPost);
    socket.on("group_post_deleted",  handlePostDeleted);
    socket.on("group_post_edited",   handlePostEdited);
    socket.on("group_closed",        handleGroupClosed);
    socket.on("pinned_message_updated", handlePinnedUpdated);
    socket.on("message_delivered",   handleDelivered);
    socket.on("message_read",        handleRead);
    socket.on("removed_from_group",  handleRemovedFromGroup);
    return () => {
      socket.off("group_post_added",    handleNewPost);
      socket.off("group_post_deleted",  handlePostDeleted);
      socket.off("group_post_edited",   handlePostEdited);
      socket.off("group_closed",        handleGroupClosed);
      socket.off("pinned_message_updated", handlePinnedUpdated);
      socket.off("message_delivered",   handleDelivered);
      socket.off("message_read",        handleRead);
      socket.off("removed_from_group",  handleRemovedFromGroup);
    };
  }, [socket, group?._id]);

  useEffect(() => {
    if (!socket || !group?._id) return;
    const handleTyping = ({ groupId, userId: uid, pseudonym }) => {
      if (uid === (user?.id || user?._id)) return;
      if (groupId !== group._id) return;
      setTypingUsers((prev) => { if (prev.some((u) => u.userId === uid)) return prev; return [...prev, { userId: uid, pseudonym }]; });
      if (autoHideTimers.current[uid]) clearTimeout(autoHideTimers.current[uid]);
      autoHideTimers.current[uid] = setTimeout(() => setTypingUsers((prev) => prev.filter((u) => u.userId !== uid)), 3000);
    };
    const handleStopTyping = ({ groupId, userId: uid }) => {
      if (groupId !== group._id) return;
      setTypingUsers((prev) => prev.filter((u) => u.userId !== uid));
      if (autoHideTimers.current[uid]) clearTimeout(autoHideTimers.current[uid]);
    };
    socket.on("user_typing",      handleTyping);
    socket.on("user_stop_typing", handleStopTyping);
    return () => { socket.off("user_typing", handleTyping); socket.off("user_stop_typing", handleStopTyping); };
  }, [socket, group?._id, user]);

  useEffect(() => {
    return () => {
      Object.values(autoHideTimers.current).forEach(clearTimeout);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (socket?.connected && isTypingRef.current) socket.emit("stop_typing", { groupId: group._id, userId: user?.id || user?._id, pseudonym: user?.pseudonym });
    };
  }, []);

  const handleAvatarPress = useCallback((pseudonym) => {
    if (!pseudonym || pseudonym === user?.pseudonym) return;
    setProfileCardPseudonym(pseudonym); setShowProfileCard(true);
  }, [user?.pseudonym]);

  const handleClearChat = useCallback(() => {
    Alert.alert("Clear chat", "This will clear the chat from your view only. Other members won't be affected.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: async () => {
        setClearingChat(true);
        await new Promise((r) => setTimeout(r, 800));
        setPosts([]); setFailedMessage(null); setReplyTarget(null); setEditingPost(null); setEditContent("");
        setClearingChat(false);
      }},
    ]);
  }, []);

  const handleContentChange = (text) => {
    setContent(text);
    AsyncStorage.setItem(DRAFT_KEY, text).catch(() => {});
    if (socket?.connected && group?._id) {
      const uid = user?.id || user?._id;
      if (!isTypingRef.current) { isTypingRef.current = true; socket.emit("typing", { groupId: group._id, userId: uid, pseudonym: user?.pseudonym }); }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) { isTypingRef.current = false; socket.emit("stop_typing", { groupId: group._id, userId: uid, pseudonym: user?.pseudonym }); }
      }, 2000);
    }
    const words    = text.split(" ");
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith("@")) {
      const query = lastWord.slice(1).toLowerCase();
      const base  = members.filter((m) => m.pseudonym.toLowerCase() !== user?.pseudonym?.toLowerCase());
      if (query === "")    setMentionSuggestions([{ _id: "all", pseudonym: "all" }, ...base.slice(0, 6)]);
      else if (query === "all") setMentionSuggestions([{ _id: "all", pseudonym: "all" }]);
      else setMentionSuggestions(base.filter((m) => m.pseudonym.toLowerCase().startsWith(query)).slice(0, 6));
    } else { setMentionSuggestions([]); }
  };

  const handleMentionSelect = (pseudonym) => {
    const words = content.split(" "); words[words.length - 1] = `@${pseudonym} `;
    setContent(words.join(" ")); setMentionSuggestions([]);
  };

  const handleLongPress   = (post) => { setActionTarget(post); setShowActionSheet(true); };

  const handleDeletePost  = async () => {
    if (!actionTarget || !isConnected) { setShowNoNetwork(true); return; }
    try {
      await api.delete(`/groups/${group._id}/posts/${actionTarget._id}`);
      const isSelf = actionTarget.pseudonym === user?.pseudonym;
      setPosts((prev) => prev.map((p) => p._id === actionTarget._id ? { ...p, deleted: true, deletedBy: isSelf ? "self" : "Crown_Keeper", deletedByPseudonym: isSelf ? null : user?.pseudonym } : p));
    } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not delete message."); }
  };

  const handleCopyPost    = () => {
    if (actionTarget?.content) { Clipboard.setString(actionTarget.content); Alert.alert("Copied", "Message copied to clipboard."); }
  };

  const handleEditStart   = () => { if (!actionTarget) return; setEditingPost(actionTarget); setEditContent(actionTarget.content); };

  const handleEditSave    = async () => {
    if (!editContent.trim() || !editingPost || !isConnected) { setShowNoNetwork(true); return; }
    try {
      await api.put(`/groups/${group._id}/posts/${editingPost._id}`, { content: editContent.trim() });
      setPosts((prev) => prev.map((p) => p._id === editingPost._id ? { ...p, content: editContent.trim(), isEdited: true } : p));
      setEditingPost(null); setEditContent("");
    } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not edit message."); }
  };

  const handleMsgInfo     = async () => {
    if (!actionTarget) return;
    try { const res = await api.get(`/groups/${group._id}/posts/${actionTarget._id}/info`); setMsgInfo(res.data); setShowMsgInfo(true); }
    catch (e) { Alert.alert("Error", "Could not load message info."); }
  };

  const handleSend = async () => {
    if (!content.trim()) return;
    if (!isConnected) { setFailedMessage({ text: content.trim(), replyTo: replyTarget }); setContent(""); AsyncStorage.removeItem(DRAFT_KEY).catch(() => {}); setReplyTarget(null); return; }
    if (isGroupClosed && !isCircleKeeperUser) { Alert.alert("Circle closed", "The Circle_Keeper has temporarily closed this circle."); return; }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current && socket?.connected) { isTypingRef.current = false; socket.emit("stop_typing", { groupId: group._id, userId: user?.id || user?._id, pseudonym: user?.pseudonym }); }
    setPosting(true);
    const trimmed = content.trim();
    setContent(""); AsyncStorage.removeItem(DRAFT_KEY).catch(() => {}); setMentionSuggestions([]);
    const currentReplyTarget = replyTarget; setReplyTarget(null);
    try {
      const res = await api.post(`/groups/${group._id}/posts`, { content: trimmed, mood, replyTo: currentReplyTarget?._id || null });
      setPosts((prev) => { const exists = prev.some((p) => p._id === res.data.post._id); if (exists) return prev; return [...prev, res.data.post]; });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
      if (res.data.crisisDetected) Alert.alert("You are not alone", res.data.crisisMessage || "It sounds like you may be going through something difficult. Please reach out to someone you trust.");
    } catch (e) { setFailedMessage({ text: trimmed, replyTo: currentReplyTarget }); setContent(""); }
    finally { setPosting(false); }
  };

  const handleRetryFailed = () => { if (!failedMessage) return; setContent(failedMessage.text); setReplyTarget(failedMessage.replyTo || null); setFailedMessage(null); };
  const handleRefresh     = async () => { setRefreshing(true); await fetchPosts(); setRefreshing(false); };
  const handleLoadMore    = async () => { if (loadingMore || !hasMore) return; setLoadingMore(true); await fetchPosts(true); setLoadingMore(false); };

  const handleOpenMembers = async () => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    setMembersLoading(true); setShowMembers(true);
    try {
      const res = await api.get(`/groups/${group._id}/members`);
      const memberList = res.data.members || [];
      setMembers(memberList); setIsGroupClosed(res.data.isClosed || false);
      setMutedMemberIds(memberList.filter((m) => m.isMuted).map((m) => m._id?.toString()));
    } catch (e) {} finally { setMembersLoading(false); }
  };

  const handleMuteMember = async (memberId, pseudonym, isCurrentlyMuted, reason = "", duration = "24h") => {
    try {
      if (isCurrentlyMuted) {
        await api.delete(`/groups/${group._id}/mute/${memberId}`);
        setMutedMemberIds((prev) => prev.filter((id) => id !== memberId));
        setMembers((prev) => prev.map((m) => m._id?.toString() === memberId?.toString() ? { ...m, isMuted: false } : m));
      } else {
        await api.post(`/groups/${group._id}/mute/${memberId}`, { reason, duration });
        setMutedMemberIds((prev) => [...prev, memberId?.toString()]);
        setMembers((prev) => prev.map((m) => m._id?.toString() === memberId?.toString() ? { ...m, isMuted: true, muteReason: reason, muteDuration: duration } : m));
      }
    } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not update mute status."); }
  };

  const handleRemoveMember = (memberId, pseudonym) => {
    Alert.alert(`Remove @${pseudonym}?`, "This member will be removed from the circle.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        try { await api.delete(`/groups/${group._id}/members/${memberId}`); setMembers((prev) => prev.filter((m) => m._id !== memberId)); Alert.alert("Done", `@${pseudonym} has been removed.`); }
        catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not remove member."); }
      }},
    ]);
  };

  const handleReportMember = async (memberId, reason, details) => {
    await api.post(`/groups/${group._id}/report/${memberId}`, { reason, details });
    Alert.alert("Report submitted", "Thank you for keeping this circle safe.");
  };

  const handleToggleClose = () => {
    Alert.alert(isGroupClosed ? "Reopen this circle?" : "Close this circle?", isGroupClosed ? "Members will be able to post again." : "No new posts will be allowed until you reopen it.", [
      { text: "Cancel", style: "cancel" },
      { text: isGroupClosed ? "Reopen" : "Close", style: isGroupClosed ? "default" : "destructive", onPress: async () => {
        try { const res = await api.post(`/groups/${group._id}/close`); setIsGroupClosed(res.data.isClosed); }
        catch (e) { Alert.alert("Error", "Could not update circle."); }
      }},
    ]);
  };

  const handleUnpin = async () => {
    try { await api.post(`/groups/${group._id}/pin`, { content: null }); setPinnedMessage(null); } catch (e) {}
  };

  const handlePinMessage = (post) => { setPinTarget(post); setPinDuration("24h"); setShowPinModal(true); };

  const confirmPin = async () => {
    if (!pinTarget || !isConnected) { setShowNoNetwork(true); return; }
    setShowPinModal(false);
    try {
      const res = await api.post(`/groups/${group._id}/pin`, { content: pinTarget.content, postId: pinTarget._id, duration: pinDuration });
      setPinnedMessage(res.data.pinnedMessage); setPinTarget(null);
    } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not pin message."); }
  };

  const handleScrollToPinned = useCallback((postId) => {
    if (!postId || !flatListRef.current) return;
    setPosts((currentPosts) => {
      const postIndex = currentPosts.findIndex((p) => p._id === postId);
      if (postIndex !== -1) {
        let flatIndex = 0; let lastDate = null;
        for (let i = 0; i < currentPosts.length; i++) {
          const dateStr = new Date(currentPosts[i].createdAt).toDateString();
          if (dateStr !== lastDate) { flatIndex++; lastDate = dateStr; }
          if (currentPosts[i]._id === postId) {
            try { flatListRef.current?.scrollToIndex({ index: flatIndex, animated: true, viewPosition: 0.3 }); }
            catch (e) { flatListRef.current?.scrollToEnd({ animated: true }); }
            break;
          }
          flatIndex++;
        }
      }
      return currentPosts;
    });
  }, []);

  const filteredPosts = useMemo(() => {
    if (!showSearch || !searchQuery.trim()) return posts;
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((p) => p.content?.toLowerCase().includes(q) || p.pseudonym?.toLowerCase().includes(q));
  }, [posts, searchQuery, showSearch]);

  const listData = useMemo(() => {
    const source = showSearch && searchQuery.trim() ? filteredPosts : posts;
    const items = []; let lastDate = null;
    for (const post of source) {
      const dateStr = new Date(post.createdAt).toDateString();
      if (dateStr !== lastDate) { items.push({ type: "separator", date: post.createdAt, key: `sep-${dateStr}-${post._id}` }); lastDate = dateStr; }
      items.push({ type: "message", post, key: post._id });
    }
    return items;
  }, [posts, filteredPosts, showSearch, searchQuery]);

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}><ActivityIndicator color={C.accent} size="large" /></View>;
  }

  const currentMoodCfg  = MOOD_CONFIG[mood] || MOOD_CONFIG.hope;
  const isMutedUser     = !!myMuteInfo;
  const isInputDisabled = isRemovedMember || (isGroupClosed && !isCircleKeeperUser) || isMutedUser;
  const getMuteLabel    = () => {
    if (!myMuteInfo) return "";
    const base = myMuteInfo.reason ? `Muted: "${myMuteInfo.reason}"` : "You are muted";
    if (myMuteInfo.expiresAt) { const diff = new Date(myMuteInfo.expiresAt) - new Date(); if (diff > 0) return `${base} · ${Math.ceil(diff / (1000 * 60 * 60))}h remaining`; }
    return `${base} · Permanent`;
  };
  const inputPlaceholder = isRemovedMember ? "You were removed from this circle." : isMutedUser ? getMuteLabel() : isGroupClosed && !isCircleKeeperUser ? "Circle is closed..." : "Message the circle...";

  // ── Back handler — respects fromFeed flag ─────────────────────────────
  const handleBack = () => {
    if (route.params?.fromFeed) {
      navigation.navigate("Main", { screen: "Feed" });
    } else {
      navigation.goBack();
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: T.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>

        {/* ── Header ── */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.card, gap: 10 }}>
          <TouchableOpacity onPress={handleBack} style={{ padding: 8 }}>
            <BackIcon size={22} color={C.accent} />
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.accent + "22", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.accent + "44" }}>
              <Text style={{ fontSize: 20 }}>{group.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 16 }} numberOfLines={1}>{group.name}</Text>
              <TouchableOpacity onPress={handleOpenMembers}>
                <Text style={{ color: C.accentSoft, fontFamily: "Nunito_400Regular", fontSize: 12 }}>{members.length || group.memberCount} members ›</Text>
              </TouchableOpacity>
            </View>
          </View>
          {[
            { onPress: () => { setShowSearch(!showSearch); setSearchQuery(""); }, Icon: () => showSearch ? <CloseIcon size={18} color={C.textMuted} /> : <SearchIcon size={18} color={C.textMuted} /> },
            { onPress: () => setShowThemeModal(true), Icon: () => <PaletteThemeIcon size={18} color={C.textMuted} /> },
            { onPress: handleClearChat, disabled: clearingChat, Icon: () => <BroomIcon size={18} color={C.textMuted} /> },
          ].map((btn, i) => (
            <TouchableOpacity key={i} style={{ padding: 8 }} onPress={btn.onPress} disabled={btn.disabled}>
              <btn.Icon />
            </TouchableOpacity>
          ))}
        </View>

        <PinnedBanner pinnedMessage={pinnedMessage} onDismiss={handleUnpin} onTap={() => pinnedMessage?.postId && handleScrollToPinned(pinnedMessage.postId)} isKeeper={isCircleKeeperUser} currentUserId={user?._id?.toString()} C={C} />

        {isGroupClosed && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.error + "18", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.error + "33" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
              <LockIcon size={13} color={C.error} />
              <Text style={{ color: C.error, fontFamily: "Nunito_500Medium", fontSize: 12 }}>Circle closed — {isCircleKeeperUser ? "tap to reopen" : "posting paused"}</Text>
            </View>
            {isCircleKeeperUser && (
              <TouchableOpacity onPress={handleToggleClose}>
                <Text style={{ color: C.accent, fontFamily: "Nunito_600SemiBold", fontSize: 12, marginLeft: 8 }}>Reopen →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isRemovedMember && (
          <View style={{ backgroundColor: C.warning + "18", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.warning + "33" }}>
            <Text style={{ color: C.warning, fontFamily: "Nunito_500Medium", fontSize: 12 }}>You were removed from this circle. You can view messages but cannot post.</Text>
          </View>
        )}

        {showSearch && (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, paddingHorizontal: 14, paddingVertical: 8, gap: 8 }}>
              <SearchIcon size={15} color={C.textMuted} />
              <TextInput style={{ flex: 1, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15, paddingVertical: 6 }} placeholder="Search messages or @mentions..." placeholderTextColor={C.textMuted} value={searchQuery} onChangeText={setSearchQuery} autoFocus autoCapitalize="none" />
              {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><CloseIcon size={14} color={C.textMuted} /></TouchableOpacity>}
            </View>
            {searchQuery.trim().length > 0 && (
              <View style={{ backgroundColor: C.card, paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border }}>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>{filteredPosts.length} result{filteredPosts.length !== 1 ? "s" : ""} for "{searchQuery}"</Text>
              </View>
            )}
          </>
        )}

        {/* ── Messages list ── */}
        <View style={{ flex: 1 }}>
          <ChatWallpaperBackground wallpaper={wallpaper} bgColor={T.bg} />
          {clearingChat && (
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", zIndex: 99 }}>
              <View style={{ backgroundColor: C.card, borderRadius: 20, paddingVertical: 28, paddingHorizontal: 40, alignItems: "center", gap: 14, borderWidth: 1, borderColor: C.border }}>
                <ActivityIndicator color={C.accent} size="large" />
                <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 15 }}>Clearing chat…</Text>
              </View>
            </View>
          )}
          <FlatList
            ref={flatListRef}
            data={listData}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => {
              if (item.type === "separator") {
                return (
                  <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 8 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
                    <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, paddingHorizontal: 4 }}>{formatDateSeparator(item.date)}</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
                  </View>
                );
              }
              if (item.post.isSystem) return <SystemMessage post={item.post} currentUserId={user?._id?.toString()} onTapPinned={handleScrollToPinned} C={C} />;
              return (
                <MessageBubble
                  post={item.post}
                  isOwn={item.post.pseudonym === user?.pseudonym}
                  allPosts={posts}
                  onSwipeReply={(p) => setReplyTarget(p)}
                  onLongPress={handleLongPress}
                  themeColors={T}
                  onAvatarPress={handleAvatarPress}
                  C={C}
                  localDate={localDate}
                />
              );
            }}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8, paddingTop: 12 }}
            onEndReached={!showSearch ? handleLoadMore : undefined}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={loadingMore ? <ActivityIndicator color={C.accent} style={{ marginVertical: 8 }} /> : null}
            refreshControl={!showSearch ? <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.accent} /> : undefined}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 80 }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center", marginBottom: 14 }}>
                  {showSearch ? <MessageSearchIcon size={40} color={C.textMuted} /> : <HeartIcon size={40} color={C.accent} />}
                </View>
                <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 8 }}>{showSearch ? "No messages found" : "No messages yet"}</Text>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14 }}>{showSearch ? "Try a different search term" : "Be the first to share in this circle"}</Text>
              </View>
            }
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          />
        </View>

        <TypingBar typingUsers={typingUsers} C={C} />
        <MentionSuggestions suggestions={mentionSuggestions} onSelect={handleMentionSelect} C={C} />

        {failedMessage && <FailedMessageBar message={failedMessage.text} onRetry={handleRetryFailed} onDiscard={() => setFailedMessage(null)} C={C} />}

        {myMuteInfo && (
          <View style={{ backgroundColor: C.warning + "18", borderTopWidth: 1, borderTopColor: C.warning + "33", paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, flex: 1 }}>
              <LockIcon size={13} color={C.warning} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.warning, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 2 }}>You are muted in this circle</Text>
                {myMuteInfo.reason ? <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, fontStyle: "italic", marginBottom: 2 }}>"{myMuteInfo.reason}"</Text> : null}
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11 }}>{myMuteInfo.expiresAt ? `Expires: ${new Date(myMuteInfo.expiresAt).toLocaleString()}` : "Duration: Permanent"}</Text>
              </View>
            </View>
          </View>
        )}

        <ReplyPreview post={replyTarget} onCancel={() => setReplyTarget(null)} C={C} />

        {editingPost && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.accent + "18", paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.accent + "33" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <EditIcon size={14} color={C.accentSoft} />
              <Text style={{ color: C.accentSoft, fontFamily: "Nunito_600SemiBold", fontSize: 12 }}>Editing message</Text>
            </View>
            <TouchableOpacity onPress={() => { setEditingPost(null); setEditContent(""); }}><CloseIcon size={14} color={C.textMuted} /></TouchableOpacity>
          </View>
        )}

        {/* ── Compose ── */}
        {!showSearch && (
          <View style={{ backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: Platform.OS === "ios" ? 24 : 10 }}>
            {showMoodPicker && (
              <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
                {MOODS.map((m) => {
                  const cfg = MOOD_CONFIG[m.key];
                  return (
                    <TouchableOpacity key={m.key} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.inputBg, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: mood === m.key ? C.accent : C.border, ...(mood === m.key ? { backgroundColor: C.accent + "22" } : {}) }} onPress={() => { setMood(m.key); setShowMoodPicker(false); }}>
                      <cfg.Icon size={20} color={mood === m.key ? cfg.color : C.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            <View style={{ flexDirection: "row", alignItems: "flex-end", padding: 10, gap: 8 }}>
              {!editingPost && (
                <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.inputBg, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.border, flexShrink: 0, opacity: isInputDisabled ? 0.3 : 1 }} onPress={() => !isInputDisabled && setShowMoodPicker(!showMoodPicker)} disabled={isInputDisabled}>
                  <currentMoodCfg.Icon size={20} color={currentMoodCfg.color} />
                </TouchableOpacity>
              )}
              <TextInput style={{ flex: 1, backgroundColor: C.inputBg, borderRadius: 20, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10, color: isInputDisabled ? C.textMuted : C.text, fontFamily: "Nunito_400Regular", fontSize: 15, maxHeight: 120, textAlignVertical: "top" }} placeholder={editingPost ? "Edit your message..." : inputPlaceholder} placeholderTextColor={C.textMuted} value={editingPost ? editContent : content} onChangeText={editingPost ? setEditContent : handleContentChange} multiline maxLength={500} textAlignVertical="top" editable={!isInputDisabled || !!editingPost} />
              <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.accent, justifyContent: "center", alignItems: "center", flexShrink: 0, opacity: ((!editingPost && (!content.trim() || posting || isInputDisabled)) || (editingPost && !editContent.trim())) ? 0.35 : 1 }} onPress={editingPost ? handleEditSave : handleSend} disabled={editingPost ? !editContent.trim() : !content.trim() || posting || isInputDisabled}>
                {posting ? <ActivityIndicator color="#fff" size="small" /> : <SendIcon size={16} color="#fff" />}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Pin Duration Modal ── */}
        <Modal visible={showPinModal} transparent animationType="fade" onRequestClose={() => setShowPinModal(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 24 }}>
            <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 24, width: "100%", maxWidth: 360, borderWidth: 1, borderColor: C.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <PinIcon size={16} color={C.accentSoft} />
                <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 20 }}>Pin message</Text>
              </View>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 16 }}>How long should this message stay pinned?</Text>
              <View style={{ backgroundColor: C.inputBg, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13 }} numberOfLines={2}>{pinTarget?.content}</Text>
              </View>
              {[{ key: "24h", label: "24 hours" }, { key: "3d", label: "3 days" }, { key: "7d", label: "7 days" }, { key: "permanent", label: "Until removed" }].map((d) => (
                <TouchableOpacity key={d.key} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginBottom: 8, width: "100%", borderColor: pinDuration === d.key ? C.accent : C.border, backgroundColor: pinDuration === d.key ? C.accent + "22" : C.inputBg }} onPress={() => setPinDuration(d.key)}>
                  <Text style={{ color: pinDuration === d.key ? C.accent : C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 12 }}>{d.label}</Text>
                </TouchableOpacity>
              ))}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: "center" }} onPress={() => { setShowPinModal(false); setPinTarget(null); }}>
                  <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: C.accent, alignItems: "center" }} onPress={confirmPin}>
                  <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 }}>Pin 💜</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <MessageActionSheet visible={showActionSheet} isOwn={actionTarget?.pseudonym === user?.pseudonym} isDeleted={actionTarget?.deleted} canStillEdit={actionTarget ? canEdit(actionTarget) : false} isKeeper={isCircleKeeperUser} onClose={() => { setShowActionSheet(false); setActionTarget(null); }} onDelete={handleDeletePost} onCopy={handleCopyPost} onReply={() => setReplyTarget(actionTarget)} onEdit={handleEditStart} onInfo={handleMsgInfo} onPin={() => actionTarget && handlePinMessage(actionTarget)} C={C} />

        <MembersListModal visible={showMembers} onClose={() => setShowMembers(false)} members={members} membersLoading={membersLoading} group={group} user={user} isCircleKeeperUser={isCircleKeeperUser} mutedMemberIds={mutedMemberIds} isGroupClosed={isGroupClosed} onMute={handleMuteMember} onRemove={handleRemoveMember} onToggleClose={handleToggleClose} onReport={handleReportMember} C={C} />

        <MessageInfoModal visible={showMsgInfo} info={msgInfo} onClose={() => { setShowMsgInfo(false); setMsgInfo(null); }} C={C} />

        <ChatThemeModal visible={showThemeModal} onClose={() => setShowThemeModal(false)} currentThemeKey={theme.key} currentWallpaper={wallpaper} onSelectTheme={(key) => setTheme(key)} onSelectWallpaper={(wp) => setWallpaper(wp)} />

        <UserProfileCard pseudonym={profileCardPseudonym} visible={showProfileCard} onClose={() => { setShowProfileCard(false); setProfileCardPseudonym(null); }} />

        <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
        <NoNetworkOverlay visible={showNoNetwork} action="feed" onClose={() => setShowNoNetwork(false)} onRetry={() => { setShowNoNetwork(false); fetchPosts(); }} />
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
}