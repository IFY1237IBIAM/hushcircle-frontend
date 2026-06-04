import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import api from "../api/api";
import { useNetwork } from "../context/NetworkContext";
import NoNetworkOverlay from "../components/NoNetworkOverlay";import { useTheme } from "../context/ThemeContext";

// Module-level color fallbacks for icon defaults (theme-aware colors used inside component)
const DARK = {
  accent: "#9B6FD4",
  accentSoft: "#C4A3E8",
  textMuted: "#8B7FA8",
  error: "#D4607A",
};



// ── SVG Icon Components ────────────────────────────────────────────────────

const HeartFilledIcon = ({ size = 20, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={color + "66"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartRedIcon = ({ size = 20, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={color} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HugIcon = ({ size = 20, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="7" r="3" stroke={color} strokeWidth={2} />
    <Path d="M5 18v-2a7 7 0 0 1 14 0v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 13c1-1 2-1 3 0M22 13c-1-1-2-1-3 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const StrongIcon = ({ size = 20, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C6 2 4 7 4 9c0 1.5 1 3 3 3.5V18h10v-5.5C19 12 20 10.5 20 9c0-2-2-7-8-7z"
      fill={color + "22"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 18v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 9H2M22 9h-2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const CryIcon = ({ size = 20, color = "#6B9FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M16 16s-1.5-2-4-2-4 2-4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M9 13l-1 3M15 13l1 3" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const HopeIcon = ({ size = 20, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 13s1.5 2 4 2 4-2 4-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M12 3v2M16.5 4.5l-1.5 1.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const CommentIcon = ({ size = 20, color = "#6B9FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ReplyIcon = ({ size = 20, color = "#C4A3E8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="9 17 4 12 9 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20 18v-2a4 4 0 0 0-4-4H4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MentionIcon = ({ size = 20, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={2} />
    <Path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const AlertIcon = ({ size = 20, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      fill={color + "22"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const BellIcon = ({ size = 44, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      fill={color + "22"} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = ({ size = 14, color = DARK.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const XIcon = ({ size = 14, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TrashIcon = ({ size = 14, color = DARK.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartSmallIcon = ({ size = 13, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={color + "44"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Reaction icon map — SVG component per reaction key ─────────────────────

const REACTION_ICON = {
  care:   { Icon: HeartFilledIcon, color: "#9B6FD4" },
  heart:  { Icon: HeartRedIcon,    color: "#D4607A" },
  hug:    { Icon: HugIcon,         color: "#D4A44C" },
  strong: { Icon: StrongIcon,      color: "#4CAF8F" },
  cry:    { Icon: CryIcon,         color: "#6B9FD4" },
  hope:   { Icon: HopeIcon,        color: "#4CAF8F" },
};

// ── TYPE_CONFIG — Icon component instead of emoji ──────────────────────────

const TYPE_CONFIG = {
  reaction: {
    Icon: HeartFilledIcon,
    iconColor: "#9B6FD4",
    label: "Reactions",
    color: "#9B6FD4",
    format: (n) => `${n.senderPseudonym} reacted to your post`,
  },
  comment: {
    Icon: CommentIcon,
    iconColor: "#6B9FD4",
    label: "Comments",
    color: "#6B9FD4",
    format: (n) => `${n.senderPseudonym} commented on your post`,
  },
  reply: {
    Icon: ReplyIcon,
    iconColor: "#C4A3E8",
    label: "Replies",
    color: "#C4A3E8",
    format: (n) => `${n.senderPseudonym} replied to your comment`,
  },
  mention: {
    Icon: MentionIcon,
    iconColor: "#9B6FD4",
    label: "Mentions",
    color: "#9B6FD4",
    format: (n) => `${n.senderPseudonym} mentioned you in ${n.postPreview || "a post"}`,
  },
  post_removed: {
    Icon: AlertIcon,
    iconColor: "#D4607A",
    label: "Moderation",
    color: "#D4607A",
    format: (n) => n.adminMessage || "A post was removed",
  },
};

// ──────────────────────────────────────────────────────────────────────────

const timeAgo = (date) => {
  if (!date) return "";
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

function groupNotifications(notifications) {
  const order = ["post_removed", "mention", "reaction", "comment", "reply"];
  const groups = {};
  for (const n of notifications) {
    const type = n.type || "reaction";
    if (!groups[type]) groups[type] = [];
    groups[type].push(n);
  }
  return order
    .filter((t) => groups[t]?.length > 0)
    .map((type) => ({
      type,
      items: groups[type],
      config: TYPE_CONFIG[type] || TYPE_CONFIG.reaction,
    }));
}

// ── Notification item ──────────────────────────────────────────────────────

function NotificationItem({ item, onMarkRead, onDelete, onPress }) {
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.reaction;
  const isModeration = item.type === "post_removed";

  // For reaction notifications, use the specific reaction icon if available
  const reactionCfg = item.type === "reaction" && item.reactionType
    ? REACTION_ICON[item.reactionType] || REACTION_ICON.care
    : null;

  const IconComponent = reactionCfg ? reactionCfg.Icon : config.Icon;
  const iconColor = reactionCfg ? reactionCfg.color : config.iconColor;

  return (
    <View style={[
      styles.notifItem,
      !item.read && styles.notifItemUnread,
      isModeration && styles.notifItemModeration,
    ]}>
      {!item.read && <View style={[styles.unreadDot, { backgroundColor: config.color }]} />}

      <View style={[styles.notifIcon, { backgroundColor: config.color + "22" }]}>
        <IconComponent size={18} color={iconColor} />
      </View>

      <TouchableOpacity
        style={styles.notifContent}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.notifText, !item.read && styles.notifTextBold]}>
          {config.format(item)}
        </Text>

        {item.postPreview && !isModeration && (
          <Text style={styles.notifPreview} numberOfLines={1}>
            "{item.postPreview}"
          </Text>
        )}

        {item.commentText && (
          <Text style={styles.notifPreview} numberOfLines={1}>
            "{item.commentText}"
          </Text>
        )}

        {isModeration && item.nextStep && (
          <Text style={styles.notifAdminText} numberOfLines={2}>
            {item.nextStep}
          </Text>
        )}

        <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item._id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <XIcon size={13} color={DARK.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ── Group header ───────────────────────────────────────────────────────────

function GroupHeader({ config, count }) {
  return (
    <View style={styles.groupHeader}>
      <View style={[styles.groupHeaderDot, { backgroundColor: config.color }]} />
      <Text style={[styles.groupHeaderLabel, { color: config.color }]}>
        {config.label}
      </Text>
      <View style={[styles.groupHeaderBadge, { backgroundColor: config.color + "22" }]}>
        <Text style={[styles.groupHeaderCount, { color: config.color }]}>{count}</Text>
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { colors: COLORS } = useTheme();
  const { isConnected } = useNetwork();
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);

  const handleNotifPress = (notif) => {
    api.patch(`/notifications/${notif._id}/read`).catch(() => {});
    if (notif.post?.group) {
      navigation.navigate("Groups", {
        screen: "GroupChat",
        params: { group: { _id: notif.post.group }, scrollToPostId: notif.post._id },
      });
    } else if (notif.post) {
      navigation.navigate("Main", {
        screen: "Feed",
        params: { scrollToPostId: notif.post._id },
      });
    }
  };

  const fetchNotifications = async () => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
    } catch (e) {
      console.log("Notifications error:", e.message);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      Alert.alert("Error", "Could not mark all as read");
    }
  };

  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    } catch (e) {}
  };

  const deleteOne = async (id) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch (e) { fetchNotifications(); }
  };

  const deleteAll = () => {
    Alert.alert(
      "Clear all notifications?",
      "This will permanently remove all your notifications.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: async () => {
            setNotifications([]);
            try { await api.delete("/notifications"); }
            catch (e) { fetchNotifications(); }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchNotifications().finally(() => setLoading(false));
      markAllRead();
    }, [isConnected])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const unreadCount = notifications.filter(
    (n) => !n.read && n.type !== "post_removed"
  ).length;

  const groups = groupNotifications(notifications);

  const listData = [];
  for (const group of groups) {
    listData.push({ _type: "header", ...group });
    for (const item of group.items) {
      listData.push({ _type: "item", ...item });
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.accent} size="large" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Alerts</Text>
          <View style={styles.headerSubRow}>
            {unreadCount > 0
              ? <Text style={styles.headerSub}>{unreadCount} unread</Text>
              : (
                <>
                  <CheckIcon size={12} color={COLORS.success} />
                  <Text style={styles.headerSub}>All caught up</Text>
                </>
              )
            }
          </View>
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.headerBtn} onPress={markAllRead}>
              <Text style={styles.headerBtnText}>Mark read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              style={[styles.headerBtn, styles.headerBtnDanger]}
              onPress={deleteAll}
            >
              <View style={styles.headerBtnInner}>
                <TrashIcon size={12} color={COLORS.error} />
                <Text style={[styles.headerBtnText, { color: COLORS.error }]}>Clear all</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, i) => item._id || `${item._type}-${i}`}
        renderItem={({ item }) => {
          if (item._type === "header") {
            return <GroupHeader config={item.config} count={item.items.length} />;
          }
          return (
            <NotificationItem
              item={item}
              onMarkRead={markOneRead}
              onDelete={deleteOne}
              onPress={handleNotifPress}
            />
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <BellIcon size={40} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <View style={styles.emptySubRow}>
              <Text style={styles.emptyText}>When someone reacts to your posts or comments, you'll see it here</Text>
              <HeartSmallIcon size={13} color={COLORS.accent} />
            </View>
          </View>
        }
      />

      <NoNetworkOverlay
        visible={showNoNetwork}
        action="feed"
        onClose={() => setShowNoNetwork(false)}
        onRetry={() => { setShowNoNetwork(false); fetchNotifications(); }}
      />
    </View>
  );
}


  const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: "#0F0A1E" },

  centered: { flex: 1, backgroundColor: "#0F0A1E", justifyContent: "center", alignItems: "center" },

  loadingText: { color: "#8B7FA8", marginTop: 12, fontSize: 14, fontFamily: "Nunito_400Regular" },


  header: {

  flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",

  paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16,

  borderBottomWidth: 1, borderBottomColor: "#2D2450", backgroundColor: "#0F0A1E",

  },

  headerTitle: { color: "#EDE8F5", fontSize: 24, fontFamily: "DMSerifDisplay_400Regular" },

  headerSubRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },

  headerSub: { color: "#8B7FA8", fontSize: 13, fontFamily: "Nunito_400Regular" },

  headerActions: { flexDirection: "row", gap: 8 },

  headerBtn: {

  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,

  backgroundColor: "#1A1330", borderWidth: 1, borderColor: "#2D2450",

  },

  headerBtnInner: { flexDirection: "row", alignItems: "center", gap: 5 },

  headerBtnDanger: { borderColor: "#D4607A" + "44" },

  headerBtnText: { color: "#C4A3E8", fontSize: 12, fontFamily: "Nunito_600SemiBold" },


  list: { paddingBottom: 24 },


  groupHeader: {

  flexDirection: "row", alignItems: "center",

  paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: "#0F0A1E",

  },

  groupHeaderDot: { width: 6, height: 6, borderRadius: 3 },

  groupHeaderLabel: { fontSize: 13, fontFamily: "Nunito_700Bold", flex: 1 },

  groupHeaderBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },

  groupHeaderCount: { fontSize: 12, fontFamily: "Nunito_700Bold" },


  notifItem: {

  flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12,

  borderBottomWidth: 1, borderBottomColor: "#2D2450" + "66",

  backgroundColor: "#0F0A1E", position: "relative",

  },

  notifItemUnread: { backgroundColor: "#1A1330" + "66" },

  notifItemModeration: { borderLeftWidth: 3, borderLeftColor: "#D4607A" },

  unreadDot: { position: "absolute", left: 6, top: 18, width: 6, height: 6, borderRadius: 3 },

  notifIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 12, flexShrink: 0 },

  notifContent: { flex: 1 },

  notifText: { color: "#EDE8F5", fontSize: 14, lineHeight: 20, fontFamily: "Nunito_400Regular" },

  notifTextBold: { fontFamily: "Nunito_700Bold" },

  notifPreview: { color: "#8B7FA8", fontSize: 13, marginTop: 4, fontStyle: "italic", fontFamily: "Nunito_400Regular" },

  notifAdminText: { color: "#D4607A", fontSize: 13, marginTop: 4, fontFamily: "Nunito_400Regular" },

  notifTime: { color: "#8B7FA8", fontSize: 11, marginTop: 6, fontFamily: "Nunito_400Regular" },

  deleteBtn: { padding: 6, marginLeft: 8, justifyContent: "center" },


  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },

  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#1A1330", borderWidth: 1, borderColor: "#2D2450", justifyContent: "center", alignItems: "center", marginBottom: 16 },

  emptyTitle: { color: "#EDE8F5", fontSize: 20, fontFamily: "DMSerifDisplay_400Regular", marginBottom: 8 },

  emptySubRow: { flexDirection: "row", alignItems: "flex-end", gap: 5 },

  emptyText: { color: "#8B7FA8", fontSize: 14, textAlign: "center", lineHeight: 20, fontFamily: "Nunito_400Regular", flex: 1 },

  });

