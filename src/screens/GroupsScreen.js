import { useState, useCallback, useEffect } from "react";
import {
  View, Text, FlatList,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, Modal,
  TextInput, ScrollView,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import api from "../api/api";
import HushCircleSpinner from "../components/HushCircleSpinner";
import useSpinner from "../hooks/useSpinner";
import { useNetwork } from "../context/NetworkContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import NoNetworkOverlay from "../components/NoNetworkOverlay";

// Topic colors are intentional brand colors — not themed
const TOPIC_COLORS = {
  "Anxiety":    "#6B9FD4",
  "Heartbreak": "#D4607A",
  "Depression": "#7B8FD4",
  "Grief":      "#9B6FD4",
  "Self-love":  "#4CAF8F",
  "Addiction":  "#D4A44C",
  "Trauma":     "#E879F9",
  "Hope":       "#4CAF8F",
};

const TOPIC_OPTIONS = [
  "Anxiety", "Heartbreak", "Depression", "Grief",
  "Self-love", "Addiction", "Trauma", "Hope", "Other",
];

const CIRCLE_KEEPER_EMAIL = "mom@gmail.com";

// ── SVG Icon Components ────────────────────────────────────────────────────────

const PlusIcon = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

const UsersIcon = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={2} />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = ({ size = 12, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LockIcon = ({ size = 12, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ArrowRightIcon = ({ size = 13, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 5 19 12 12 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartIcon = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={color + "44"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartEmptyStateIcon = ({ size = 44, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={color + "22"} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Icon picker SVG icons — replacing ICON_OPTIONS emoji array ─────────────────

const GridIconHeart = ({ size = 22, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={color + "44"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GridIconLeaf = ({ size = 22, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 8-12 9"
      fill={color + "22"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GridIconHeartBreak = ({ size = 22, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 8l-2 4h4l-2 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GridIconMoon = ({ size = 22, color = "#C4A3E8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      fill={color + "33"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GridIconFlame = ({ size = 22, color = "#FF6B35" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C12 2 6 8 6 13a6 6 0 0 0 12 0C18 8 12 2 12 2z"
      fill={color + "33"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 8c0 0-3 3-3 5.5a3 3 0 0 0 6 0C15 11 12 8 12 8z"
      fill={color + "66"} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GridIconWave = ({ size = 22, color = "#6B9FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5s2.5 2 5 2 2.5-2 5-2 2.5 1 3 1.5"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 1 3 1.5"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 1 3 1.5"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GridIconDove = ({ size = 22, color = "#EDE8F5" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16 7h.01M2 12s2-8 10-8c4 0 7 2 7 5s-2 4-5 4H8l-6 6"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 18s1 2 4 2 6-4 6-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GridIconFlower = ({ size = 22, color = "#E879F9" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" fill={color + "66"} stroke={color} strokeWidth={2} />
    <Path d="M12 2a3 3 0 0 1 3 3v2a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zM12 22a3 3 0 0 1-3-3v-2a3 3 0 0 1 6 0v2a3 3 0 0 1-3 3z"
      fill={color + "22"} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Path d="M2 12a3 3 0 0 1 3-3h2a3 3 0 0 1 0 6H5a3 3 0 0 1-3-3zM22 12a3 3 0 0 1-3 3h-2a3 3 0 0 1 0-6h2a3 3 0 0 1 3 3z"
      fill={color + "22"} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const GridIconStar = ({ size = 22, color = "#FFD700" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill={color + "33"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GridIconHug = ({ size = 22, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="7" r="3" stroke={color} strokeWidth={2} />
    <Path d="M5 18v-2a7 7 0 0 1 14 0v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 13c1-1 2-1 3 0M22 13c-1-1-2-1-3 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const GridIconBrain = ({ size = 22, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GridIconStrong = ({ size = 22, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C6 2 4 7 4 9c0 1.5 1 3 3 3.5V18h10v-5.5C19 12 20 10.5 20 9c0-2-2-7-8-7z"
      fill={color + "22"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 18v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 9H2M22 9h-2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const GridIconRainbow = ({ size = 22, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 17a10 10 0 0 0-20 0" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6 17a6 6 0 0 1 12 0" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 17a2 2 0 0 1 4 0" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GridIconHands = ({ size = 22, color = "#C4A3E8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 11V6a2 2 0 0 0-4 0M14 10.5V5a2 2 0 0 0-4 0M10 10.5V3a2 2 0 0 0-4 0v9"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6 12v2a6 6 0 0 0 12 0v-2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Icon picker config ─────────────────────────────────────────────────────────

const ICON_OPTIONS = [
  { key: "heart",      Icon: GridIconHeart,     color: "#9B6FD4" },
  { key: "leaf",       Icon: GridIconLeaf,      color: "#4CAF8F" },
  { key: "heartbreak", Icon: GridIconHeartBreak, color: "#D4607A" },
  { key: "moon",       Icon: GridIconMoon,      color: "#C4A3E8" },
  { key: "flame",      Icon: GridIconFlame,     color: "#FF6B35" },
  { key: "wave",       Icon: GridIconWave,      color: "#6B9FD4" },
  { key: "dove",       Icon: GridIconDove,      color: "#EDE8F5" },
  { key: "flower",     Icon: GridIconFlower,    color: "#E879F9" },
  { key: "star",       Icon: GridIconStar,      color: "#FFD700" },
  { key: "hug",        Icon: GridIconHug,       color: "#D4A44C" },
  { key: "brain",      Icon: GridIconBrain,     color: "#9B6FD4" },
  { key: "strong",     Icon: GridIconStrong,    color: "#4CAF8F" },
  { key: "rainbow",    Icon: GridIconRainbow,   color: "#9B6FD4" },
  { key: "hands",      Icon: GridIconHands,     color: "#C4A3E8" },
];

// ──────────────────────────────────────────────────────────────────────────────

function UnreadBadge({ count, C }) {
  if (!count || count <= 0) return null;
  return (
    <View style={{
      backgroundColor: C.accent, borderRadius: 12, minWidth: 22, height: 22,
      paddingHorizontal: 6, justifyContent: "center", alignItems: "center",
      shadowColor: C.accent, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5, shadowRadius: 4, elevation: 4,
    }}>
      <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 11 }}>
        {count > 99 ? "99+" : count}
      </Text>
    </View>
  );
}

const getGroupIconCfg = (iconKey) =>
  ICON_OPTIONS.find((o) => o.key === iconKey) || ICON_OPTIONS[0];

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function GroupsScreen() {
  const { colors: C } = useTheme();
  const navigation    = useNavigation();
  const spinner       = useSpinner();
  const { isConnected } = useNetwork();
  const { user }        = useAuth();
  const { socket }      = useSocket();

  const [groups, setGroups]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);

  const isAdmin = user?.email === CIRCLE_KEEPER_EMAIL || user?.role === "admin";

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating]   = useState(false);
  const [newGroup, setNewGroup]   = useState({ name: "", topic: "", description: "", icon: "heart" });

  const fetchGroups = async () => {
    if (!isConnected) { setShowNoNetwork(true); setLoading(false); return; }
    try {
      const res = await api.get("/groups");
      const uniqueGroups = (res.data.groups || []).filter(
        (g, i, arr) => arr.findIndex((x) => x._id === g._id) === i
      );
      setGroups(uniqueGroups);
      setShowNoNetwork(false);
    } catch (e) {
      if (e.message === "Network Error") setShowNoNetwork(true);
    } finally { setLoading(false); }
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      spinner.withSpinner(async () => { if (active) await fetchGroups(); }, "Loading Circles...");
      return () => { active = false; };
    }, [isConnected])
  );

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = ({ groupId, senderUserId }) => {
      if (senderUserId === (user?.id || user?._id)?.toString()) return;
      setGroups((prev) => prev.map((g) => {
        if (g._id !== groupId || !g.isMember) return g;
        return { ...g, unreadCount: (g.unreadCount || 0) + 1 };
      }));
    };
    socket.on("group_new_message", handleNewMessage);
    return () => socket.off("group_new_message", handleNewMessage);
  }, [socket, user]);

  const handleRefresh = async () => { setRefreshing(true); await fetchGroups(); setRefreshing(false); };

  const handleJoin = async (group) => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    if (group.rejoinBlockedUntil) {
      const remaining = Math.ceil((new Date(group.rejoinBlockedUntil) - new Date()) / (1000 * 60 * 60));
      Alert.alert("Rejoining too soon", `You left this circle recently. You can rejoin in ${remaining} hour${remaining !== 1 ? "s" : ""}.`);
      return;
    }
    await spinner.withSpinner(async () => {
      try {
        await api.post(`/groups/join/${group._id}`);
        setGroups((prev) => prev.map((g) => g._id === group._id
          ? { ...g, isMember: true, memberCount: g.memberCount + 1, rejoinBlockedUntil: null }
          : g
        ));
        Alert.alert("Joined", `You are now part of ${group.name}`);
      } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not join group."); }
    }, `Joining ${group.name}...`);
  };

  const handleLeave = (group) => {
    Alert.alert(`Leave ${group.name}?`, "You'll need to wait 24 hours before rejoining this circle.", [
      { text: "Stay", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: async () => {
        await spinner.withSpinner(async () => {
          try {
            await api.post(`/groups/leave/${group._id}`);
            const unblockAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            setGroups((prev) => prev.map((g) => g._id === group._id
              ? { ...g, isMember: false, memberCount: g.memberCount - 1, rejoinBlockedUntil: unblockAt, unreadCount: 0 }
              : g
            ));
          } catch (e) { Alert.alert("Error", "Could not leave group."); }
        }, "Leaving...");
      }},
    ]);
  };

  const handleOpenGroup = async (group) => {
    setGroups((prev) => prev.map((g) => g._id === group._id ? { ...g, unreadCount: 0 } : g));
    try { await api.post(`/groups/${group._id}/mark-read`); } catch (e) {}
    navigation.navigate("GroupChat", { group });
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) { Alert.alert("Required", "Please enter a circle name."); return; }
    if (!newGroup.topic) { Alert.alert("Required", "Please select a topic."); return; }
    if (!isConnected) { setShowNoNetwork(true); return; }
    setCreating(true);
    try {
      const res = await api.post("/groups", {
        name: newGroup.name.trim(),
        topic: newGroup.topic,
        description: newGroup.description.trim(),
        icon: newGroup.icon,
      });
      const created = res.data.group;
      setGroups((prev) => [{ ...created, isMember: true, memberCount: 1, isFull: false, unreadCount: 0 }, ...prev]);
      setNewGroup({ name: "", topic: "", description: "", icon: "heart" });
      setShowCreateModal(false);
      Alert.alert("Circle created", `${created.name} is ready for members.`);
    } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not create circle."); }
    finally { setCreating(false); }
  };

  const resetAndClose = () => {
    setNewGroup({ name: "", topic: "", description: "", icon: "heart" });
    setShowCreateModal(false);
  };

  const renderGroup = ({ item }) => {
    const topicColor = TOPIC_COLORS[item.topic] || C.accent;
    const isBlocked  = !!item.rejoinBlockedUntil && new Date(item.rejoinBlockedUntil) > new Date();
    const hasUnread  = item.isMember && item.unreadCount > 0;
    const iconCfg    = getGroupIconCfg(item.icon);

    return (
      <View style={{
        backgroundColor: hasUnread ? C.accent + "06" : C.card,
        borderRadius: 18, padding: 16, marginBottom: 12,
        borderWidth: 1,
        borderColor: hasUnread ? C.accent + "55" : item.isMember ? topicColor + "55" : C.border,
      }}>
        {/* Top row */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
          <View style={{ position: "relative" }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", backgroundColor: topicColor + "22" }}>
              <iconCfg.Icon size={26} color={iconCfg.color} />
            </View>
            {hasUnread && (
              <View style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: 7, backgroundColor: topicColor, borderWidth: 2, borderColor: C.card }} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 16 }}>{item.name}</Text>
              {hasUnread && <UnreadBadge count={item.unreadCount} C={C} />}
            </View>
            <View style={{ borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", backgroundColor: topicColor + "22" }}>
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 11, color: topicColor }}>{item.topic}</Text>
            </View>
          </View>
          {item.isMember && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.success + "22", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.success + "44" }}>
              <CheckIcon size={11} color={C.success} />
              <Text style={{ color: C.success, fontFamily: "Nunito_700Bold", fontSize: 11 }}>Joined</Text>
            </View>
          )}
          {item.isRemoved && !item.isMember && (
            <View style={{ backgroundColor: C.warning + "22", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.warning + "44" }}>
              <Text style={{ color: C.warning, fontFamily: "Nunito_600SemiBold", fontSize: 11 }}>View only</Text>
            </View>
          )}
        </View>

        {item.description ? (
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 12 }} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Footer */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <UsersIcon size={13} color={C.textMuted} />
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>{item.memberCount}/50</Text>
          </View>

          {item.isFull && !item.isMember && (
            <Text style={{ color: C.error, fontFamily: "Nunito_500Medium", fontSize: 12 }}>Full</Text>
          )}

          {isBlocked && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.warning + "18", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.warning + "33" }}>
              <LockIcon size={11} color={C.warning} />
              <Text style={{ color: C.warning, fontFamily: "Nunito_600SemiBold", fontSize: 11 }}>24h cooldown</Text>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 8 }}>
            {item.isMember ? (
              <>
                <TouchableOpacity
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: topicColor, ...(hasUnread ? { backgroundColor: topicColor + "18" } : {}) }}
                  onPress={() => handleOpenGroup(item)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: topicColor }}>
                      {hasUnread ? `Open (${item.unreadCount > 99 ? "99+" : item.unreadCount})` : "Open"}
                    </Text>
                    {!hasUnread && <ArrowRightIcon size={12} color={topicColor} />}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border }}
                  onPress={() => handleLeave(item)}
                >
                  <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 13 }}>Leave</Text>
                </TouchableOpacity>
              </>
            ) : item.isRemoved ? (
              <TouchableOpacity
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.textMuted }}
                onPress={() => navigation.navigate("GroupChat", { group: item })}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Text style={{ color: C.textMuted, fontFamily: "Nunito_700Bold", fontSize: 13 }}>View</Text>
                  <ArrowRightIcon size={12} color={C.textMuted} />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{ paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, backgroundColor: isBlocked ? C.border : topicColor, opacity: (item.isFull || isBlocked) ? (isBlocked ? 0.6 : 0.4) : 1 }}
                onPress={() => !item.isFull && handleJoin(item)}
                disabled={item.isFull || isBlocked}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  {!item.isFull && !isBlocked && <HeartIcon size={13} color="#fff" />}
                  <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 13 }}>
                    {item.isFull ? "Full" : isBlocked ? "Cooldown" : "Join"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <View>
            <Text style={{ fontSize: 32, color: C.text, fontFamily: "DMSerifDisplay_400Regular" }}>Circles</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
              <HeartIcon size={13} color={C.textMuted} />
              <Text style={{ fontSize: 13, color: C.textMuted, fontFamily: "Nunito_400Regular" }}>
                Safe spaces built around shared experiences
              </Text>
            </View>
          </View>
          {isAdmin && (
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 4 }}
              onPress={() => setShowCreateModal(true)}
            >
              <PlusIcon size={15} color="#fff" />
              <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 13 }}>New</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item._id}
        renderItem={renderGroup}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.accent} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={{ alignItems: "center", paddingTop: 80 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center", marginBottom: 14 }}>
                <HeartEmptyStateIcon size={40} color={C.accent} />
              </View>
              <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 8 }}>No circles yet</Text>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center" }}>
                {isAdmin ? "Tap '+ New' to create your first circle." : "Support groups are coming soon."}
              </Text>
            </View>
          )
        }
      />

      {/* Create Group Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={resetAndClose}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 40, maxHeight: "92%", borderTopWidth: 1, borderTopColor: C.border }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginTop: 12, marginBottom: 16 }} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 26, marginBottom: 4 }}>Create a Circle</Text>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 24, lineHeight: 20 }}>
                Build a safe space around a shared experience
              </Text>

              <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, letterSpacing: 0.4, marginBottom: 8, marginTop: 4 }}>Circle name *</Text>
              <TextInput
                style={{ backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15 }}
                placeholder="e.g. Healing from Heartbreak"
                placeholderTextColor={C.textMuted}
                value={newGroup.name}
                onChangeText={(t) => setNewGroup((prev) => ({ ...prev, name: t }))}
                maxLength={50}
                autoCapitalize="words"
              />
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "right", marginTop: 4, marginBottom: 16 }}>{newGroup.name.length}/50</Text>

              <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, letterSpacing: 0.4, marginBottom: 8 }}>Topic *</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {TOPIC_OPTIONS.map((topic) => {
                  const color = TOPIC_COLORS[topic] || C.accent;
                  const isSelected = newGroup.topic === topic;
                  return (
                    <TouchableOpacity
                      key={topic}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: isSelected ? color : C.border, backgroundColor: isSelected ? color + "22" : C.inputBg }}
                      onPress={() => setNewGroup((prev) => ({ ...prev, topic }))}
                    >
                      <Text style={{ color: isSelected ? color : C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 12 }}>{topic}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Icon picker — SVG grid */}
              <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, letterSpacing: 0.4, marginBottom: 8 }}>Icon</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
                {ICON_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      backgroundColor: newGroup.icon === opt.key ? C.accent + "22" : C.inputBg,
                      justifyContent: "center", alignItems: "center",
                      borderWidth: 1,
                      borderColor: newGroup.icon === opt.key ? C.accent : C.border,
                    }}
                    onPress={() => setNewGroup((prev) => ({ ...prev, icon: opt.key }))}
                  >
                    <opt.Icon size={22} color={newGroup.icon === opt.key ? opt.color : C.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, letterSpacing: 0.4, marginBottom: 8 }}>Description (optional)</Text>
              <TextInput
                style={{ backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15, minHeight: 80, paddingTop: 12 }}
                placeholder="What is this circle about? Who is it for?"
                placeholderTextColor={C.textMuted}
                value={newGroup.description}
                onChangeText={(t) => setNewGroup((prev) => ({ ...prev, description: t }))}
                maxLength={200}
                multiline
                textAlignVertical="top"
              />
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "right", marginTop: 4, marginBottom: 16 }}>
                {newGroup.description.length}/200
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: "center" }} onPress={resetAndClose}>
                  <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 2, padding: 14, borderRadius: 14, backgroundColor: C.accent, alignItems: "center", opacity: creating ? 0.6 : 1 }}
                  onPress={handleCreateGroup}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                      <HeartIcon size={14} color="#fff" />
                      <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 }}>Create Circle</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
      <NoNetworkOverlay
        visible={showNoNetwork}
        action="feed"
        onClose={() => setShowNoNetwork(false)}
        onRetry={() => { setShowNoNetwork(false); fetchGroups(); }}
      />
    </View>
  );
}