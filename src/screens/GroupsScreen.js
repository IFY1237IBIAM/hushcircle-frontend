import { useState, useCallback, useEffect } from "react";
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, Modal,
  TextInput, ScrollView,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline } from "react-native-svg";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import api from "../api/api";
import HushCircleSpinner from "../components/HushCircleSpinner";
import useSpinner from "../hooks/useSpinner";
import { useNetwork } from "../context/NetworkContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import NoNetworkOverlay from "../components/NoNetworkOverlay";import { useTheme } from "../context/ThemeContext";

// Module-level color fallbacks for icon defaults (theme-aware colors used inside component)
const DARK = {
  accent: "#9B6FD4",
  textMuted: "#8B7FA8",
  success: "#4CAF8F",
  warning: "#D4A44C",
};


// ── Design tokens ──────────────────────────────────────────────────────────

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

const ICON_OPTIONS = [
  "💜", "🌿", "💔", "🌙", "🔥", "🌊", "🕊️",
  "🌸", "⭐", "🤗", "🧠", "💪", "🌈", "🫂",
];

const CIRCLE_KEEPER_EMAIL = "mom@gmail.com";

// ── SVG Icons ──────────────────────────────────────────────────────────────
const PlusIcon = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

const UsersIcon = ({ size = 14, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={2} />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = ({ size = 12, color = DARK.success }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// SVG <rect> polyfill for react-native-svg
const Rect = ({ x, y, width, height, rx = 0, ry = 0, stroke, strokeWidth }) => (
  <Path
    d={`M${+x + +rx},${y} h${+width - 2 * +rx} a${rx},${ry} 0 0 1 ${rx},${ry} v${+height - 2 * +ry} a${rx},${ry} 0 0 1 -${rx},${ry} h-${+width - 2 * +rx} a${rx},${ry} 0 0 1 -${rx},-${ry} v-${+height - 2 * +ry} a${rx},${ry} 0 0 1 ${rx},-${ry} z`}
    stroke={stroke}
    strokeWidth={strokeWidth}
    fill="none"
  />
);

const LockIcon = ({ size = 12, color = DARK.warning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth={2} />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const MessageIcon = ({ size = 13, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

// ── Unread badge (pill) — only renders when count > 0 ─────────────────────
function UnreadBadge({ count }) {
  if (!count || count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <View style={styles.unreadBadge}>
      <Text style={styles.unreadBadgeText}>{label}</Text>
    </View>
  );
}

// ── Unread count pill shown inside the Open button ────────────────────────
function UnreadCountPill({ count, color }) {
  if (!count || count <= 0) return null;
  return (
    <View style={[styles.btnCountPill, { backgroundColor: color }]}>
      <Text style={styles.btnCountPillText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────
export default function GroupsScreen() {
  const { colors: COLORS } = useTheme();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);

  const navigation = useNavigation();
  const spinner    = useSpinner();
  const { isConnected } = useNetwork();
  const { user }        = useAuth();
  const { socket }      = useSocket();

  const isAdmin = user?.email === CIRCLE_KEEPER_EMAIL || user?.role === "admin";

  // ── Create-group modal state ───────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "", topic: "", description: "", icon: "💜",
  });

  // ── Fetch groups ──────────────────────────────────────────────────────
  const fetchGroups = async () => {
    if (!isConnected) {
      setShowNoNetwork(true);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/groups");
      // Deduplicate just in case
      const unique = (res.data.groups || []).filter(
        (g, i, arr) => arr.findIndex((x) => x._id === g._id) === i
      );
      setGroups(unique);
      setShowNoNetwork(false);
    } catch (e) {
      console.log("Groups fetch error:", e.message);
      if (e.message === "Network Error") setShowNoNetwork(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      spinner.withSpinner(async () => {
        if (active) await fetchGroups();
      }, "Loading Circles...");
      return () => { active = false; };
    }, [isConnected])
  );

  // ── Socket: live unread increment ─────────────────────────────────────
  // When *someone else* posts, bump every member's badge by 1.
  // The sender themselves is excluded.
  useEffect(() => {
    if (!socket) return;

    const myId = (user?.id || user?._id)?.toString();

    const handleNewMessage = ({ groupId, senderUserId }) => {
      // Sender's own badge must not go up
      if (senderUserId === myId) return;

      setGroups((prev) =>
        prev.map((g) => {
          if (g._id !== groupId) return g;
          // Only current (non-removed) members see the badge
          if (!g.isMember) return g;
          return { ...g, unreadCount: (g.unreadCount || 0) + 1 };
        })
      );
    };

    socket.on("group_new_message", handleNewMessage);
    return () => socket.off("group_new_message", handleNewMessage);
  }, [socket, user]);

  // ── Pull-to-refresh ───────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    setRefreshing(false);
  };

  // ── Join ──────────────────────────────────────────────────────────────
  const handleJoin = async (group) => {
    if (!isConnected) { setShowNoNetwork(true); return; }

    if (group.rejoinBlockedUntil && new Date(group.rejoinBlockedUntil) > new Date()) {
      const remaining = Math.ceil(
        (new Date(group.rejoinBlockedUntil) - new Date()) / (1000 * 60 * 60)
      );
      Alert.alert(
        "Rejoining too soon",
        `You left this circle recently. You can rejoin in ${remaining} hour${remaining !== 1 ? "s" : ""}.`
      );
      return;
    }

    await spinner.withSpinner(async () => {
      try {
        await api.post(`/groups/join/${group._id}`);
        setGroups((prev) =>
          prev.map((g) =>
            g._id === group._id
              ? {
                  ...g,
                  isMember:            true,
                  isRemoved:           false,   // clear removed flag on rejoin
                  memberCount:         g.memberCount + 1,
                  rejoinBlockedUntil:  null,
                  unreadCount:         g.totalMessages || 0, // start with all messages unread
                }
              : g
          )
        );
        Alert.alert("Joined 💜", `You are now part of ${group.name}`);
      } catch (e) {
        Alert.alert("Error", e.response?.data?.message || "Could not join group.");
      }
    }, `Joining ${group.name}...`);
  };

  // ── Leave ─────────────────────────────────────────────────────────────
  const handleLeave = (group) => {
    Alert.alert(
      `Leave ${group.name}?`,
      "You'll need to wait 24 hours before rejoining this circle.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            await spinner.withSpinner(async () => {
              try {
                await api.post(`/groups/leave/${group._id}`);
                const unblockAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                setGroups((prev) =>
                  prev.map((g) =>
                    g._id === group._id
                      ? {
                          ...g,
                          isMember:           false,
                          isRemoved:          false,   // leaving is not the same as being removed
                          memberCount:        g.memberCount - 1,
                          rejoinBlockedUntil: unblockAt,
                          unreadCount:        0,        // badge gone once they leave
                        }
                      : g
                  )
                );
              } catch (e) {
                Alert.alert("Error", "Could not leave group.");
              }
            }, "Leaving...");
          },
        },
      ]
    );
  };

  // ── Open group chat: clear badge optimistically, then tell backend ────
  const handleOpenGroup = async (group) => {
    // 1. Instantly zero the badge so it feels snappy
    setGroups((prev) =>
      prev.map((g) => g._id === group._id ? { ...g, unreadCount: 0 } : g)
    );

    // 2. Tell the backend to record the read checkpoint
    try {
      await api.post(`/groups/${group._id}/mark-read`);
    } catch {
      // Non-critical; badge will re-sync on next fetch
    }

    // 3. Navigate
    navigation.navigate("GroupChat", { group });
  };

  // ── Create group ──────────────────────────────────────────────────────
  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      Alert.alert("Required", "Please enter a circle name.");
      return;
    }
    if (!newGroup.topic) {
      Alert.alert("Required", "Please select a topic.");
      return;
    }
    if (!isConnected) { setShowNoNetwork(true); return; }

    setCreating(true);
    try {
      const res = await api.post("/groups", {
        name:        newGroup.name.trim(),
        topic:       newGroup.topic,
        description: newGroup.description.trim(),
        icon:        newGroup.icon,
      });
      const created = res.data.group;
      setGroups((prev) => [
        {
          ...created,
          isMember:    true,
          isRemoved:   false,
          memberCount: 1,
          isFull:      false,
          unreadCount: 0,
        },
        ...prev,
      ]);
      resetAndClose();
      Alert.alert("Circle created 💜", `${created.name} is ready for members.`);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Could not create circle.");
    } finally {
      setCreating(false);
    }
  };

  const resetAndClose = () => {
    setNewGroup({ name: "", topic: "", description: "", icon: "💜" });
    setShowCreateModal(false);
  };

  // ── Render individual group card ──────────────────────────────────────
  const renderGroup = ({ item }) => {
    const topicColor = TOPIC_COLORS[item.topic] || COLORS.accent;
    const isBlocked  = !!item.rejoinBlockedUntil && new Date(item.rejoinBlockedUntil) > new Date();

    // Badge only shows for current (non-removed) members with unread messages
    const hasUnread  = item.isMember && !item.isRemoved && (item.unreadCount || 0) > 0;

    return (
      <View style={[
        styles.groupCard,
        item.isMember && { borderColor: topicColor + "55" },
        hasUnread && styles.groupCardUnread,
      ]}>

        {/* ── Top row: icon + info + status badge ── */}
        <View style={styles.groupTop}>

          {/* Icon with unread dot */}
          <View>
            <View style={[styles.groupIcon, { backgroundColor: topicColor + "22" }]}>
              <Text style={styles.groupIconText}>{item.icon}</Text>
            </View>
            {hasUnread && (
              <View style={[styles.unreadDot, { backgroundColor: topicColor }]} />
            )}
          </View>

          {/* Name + topic */}
          <View style={styles.groupInfo}>
            <View style={styles.groupNameRow}>
              <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
              {/* Unread pill — visible only to members with unread messages */}
              {hasUnread && <UnreadBadge count={item.unreadCount} />}
            </View>
            <View style={[styles.topicBadge, { backgroundColor: topicColor + "22" }]}>
              <Text style={[styles.topicText, { color: topicColor }]}>{item.topic}</Text>
            </View>
          </View>

          {/* Right status chip */}
          {item.isMember && (
            <View style={styles.memberBadge}>
              <CheckIcon size={11} color={COLORS.success} />
              <Text style={styles.memberBadgeText}>Joined</Text>
            </View>
          )}
          {item.isRemoved && !item.isMember && (
            <View style={styles.removedBadge}>
              <Text style={styles.removedBadgeText}>View only</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {!!item.description && (
          <Text style={styles.groupDesc} numberOfLines={2}>{item.description}</Text>
        )}

        {/* ── Footer: count + actions ── */}
        <View style={styles.groupFooter}>
          <View style={styles.memberCountRow}>
            <UsersIcon size={13} />
            <Text style={styles.memberCount}>{item.memberCount}/50</Text>
          </View>

          {item.isFull && !item.isMember && (
            <Text style={styles.fullText}>Full</Text>
          )}

          {isBlocked && (
            <View style={styles.blockedBadge}>
              <LockIcon size={11} color={COLORS.warning} />
              <Text style={styles.blockedBadgeText}>24h cooldown</Text>
            </View>
          )}

          <View style={styles.groupActions}>
            {/* ── MEMBER: Open + Leave ── */}
            {item.isMember ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.enterBtn,
                    { borderColor: topicColor },
                    hasUnread && { backgroundColor: topicColor + "18" },
                  ]}
                  onPress={() => handleOpenGroup(item)}
                  activeOpacity={0.75}
                >
                  {hasUnread
                    ? (
                      /* Show message icon + count when unread */
                      <View style={styles.enterBtnInner}>
                        <MessageIcon size={13} color={topicColor} />
                        <Text style={[styles.enterBtnText, { color: topicColor }]}>
                          Open
                        </Text>
                        <UnreadCountPill count={item.unreadCount} color={topicColor} />
                      </View>
                    ) : (
                      <Text style={[styles.enterBtnText, { color: topicColor }]}>
                        Open →
                      </Text>
                    )
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.leaveBtn}
                  onPress={() => handleLeave(item)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.leaveBtnText}>Leave</Text>
                </TouchableOpacity>
              </>
            ) : item.isRemoved ? (
              /* ── REMOVED: view-only access ── */
              <TouchableOpacity
                style={[styles.enterBtn, { borderColor: COLORS.textMuted }]}
                onPress={() => navigation.navigate("GroupChat", { group: item })}
                activeOpacity={0.75}
              >
                <Text style={[styles.enterBtnText, { color: COLORS.textMuted }]}>
                  View →
                </Text>
              </TouchableOpacity>
            ) : (
              /* ── NON-MEMBER: Join ── */
              <TouchableOpacity
                style={[
                  styles.joinBtn,
                  { backgroundColor: isBlocked ? COLORS.border : topicColor },
                  (item.isFull || isBlocked) && { opacity: 0.5 },
                ]}
                onPress={() => !item.isFull && !isBlocked && handleJoin(item)}
                disabled={item.isFull || isBlocked}
                activeOpacity={0.75}
              >
                <Text style={styles.joinBtnText}>
                  {item.isFull ? "Full" : isBlocked ? "Cooldown" : "Join 💜"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Circles</Text>
            <Text style={styles.headerSub}>
              Safe spaces built around shared experiences 💜
            </Text>
          </View>
          {isAdmin && (
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => setShowCreateModal(true)}
            >
              <PlusIcon size={15} color="#fff" />
              <Text style={styles.createBtnText}>New</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Group list ── */}
      <FlatList
        data={groups}
        keyExtractor={(item) => item._id}
        renderItem={renderGroup}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent}
          />
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💜</Text>
              <Text style={styles.emptyTitle}>No circles yet</Text>
              <Text style={styles.emptyText}>
                {isAdmin
                  ? "Tap '+ New' to create your first circle."
                  : "Support groups are coming soon."}
              </Text>
            </View>
          )
        }
      />

      {/* ── Create Circle modal ── */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={resetAndClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>Create a Circle 💜</Text>
              <Text style={styles.modalSub}>
                Build a safe space around a shared experience
              </Text>

              <Text style={styles.fieldLabel}>Circle name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Healing from Heartbreak"
                placeholderTextColor={COLORS.textMuted}
                value={newGroup.name}
                onChangeText={(t) => setNewGroup((p) => ({ ...p, name: t }))}
                maxLength={50}
                autoCapitalize="words"
              />
              <Text style={styles.charHint}>{newGroup.name.length}/50</Text>

              <Text style={styles.fieldLabel}>Topic *</Text>
              <View style={styles.topicGrid}>
                {TOPIC_OPTIONS.map((topic) => {
                  const color      = TOPIC_COLORS[topic] || COLORS.accent;
                  const isSelected = newGroup.topic === topic;
                  return (
                    <TouchableOpacity
                      key={topic}
                      style={[
                        styles.topicOption,
                        isSelected && {
                          backgroundColor: color + "22",
                          borderColor: color,
                        },
                      ]}
                      onPress={() => setNewGroup((p) => ({ ...p, topic }))}
                    >
                      <Text
                        style={[
                          styles.topicOptionText,
                          isSelected && { color },
                        ]}
                      >
                        {topic}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Icon</Text>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      newGroup.icon === icon && styles.iconOptionActive,
                    ]}
                    onPress={() => setNewGroup((p) => ({ ...p, icon }))}
                  >
                    <Text style={styles.iconOptionText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="What is this circle about? Who is it for?"
                placeholderTextColor={COLORS.textMuted}
                value={newGroup.description}
                onChangeText={(t) => setNewGroup((p) => ({ ...p, description: t }))}
                maxLength={200}
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.charHint}>{newGroup.description.length}/200</Text>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={resetAndClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, creating && { opacity: 0.6 }]}
                  onPress={handleCreateGroup}
                  disabled={creating}
                >
                  {creating
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.saveBtnText}>Create Circle 💜</Text>
                  }
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

// ── Styles ─────────────────────────────────────────────────────────────────

  const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#0F0A1E" },

  // Header
  header:      { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#2D2450" },
  headerRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 12 },
  headerTitle: { fontSize: 32, color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular" },
  headerSub:   { fontSize: 13, color: "#8B7FA8", fontFamily: "Nunito_400Regular", marginTop: 2 },
  createBtn:   { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#9B6FD4", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 4 },
  createBtnText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 13 },

  list: { padding: 16, paddingBottom: 32 },

  // Group card
  groupCard: {
  backgroundColor: "#1A1330",
  borderRadius: 18,
  padding: 16,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: "#2D2450",
  },
  // Subtle purple glow when there are unread messages
  groupCardUnread: {
  borderColor: "#9B6FD4" + "66",
  backgroundColor: "#9B6FD4" + "07",
  shadowColor: "#9B6FD4",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 3,
  },

  groupTop:  { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  groupIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  groupIconText: { fontSize: 24 },

  // Colored dot on the icon corner
  unreadDot: {
  position:    "absolute",
  top:         -3,
  right:       -3,
  width:       14,
  height:      14,
  borderRadius: 7,
  borderWidth:  2,
  borderColor:  "#1A1330",
  },

  groupInfo:    { flex: 1 },
  groupNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
  groupName:    { color: "#EDE8F5", fontFamily: "Nunito_700Bold", fontSize: 16, flexShrink: 1 },

  // Unread count pill next to the group name
  unreadBadge: {
  backgroundColor:  "#9B6FD4",
  borderRadius:     12,
  minWidth:         22,
  height:           22,
  paddingHorizontal: 6,
  justifyContent:   "center",
  alignItems:       "center",
  shadowColor:      "#9B6FD4",
  shadowOffset:     { width: 0, height: 2 },
  shadowOpacity:    0.55,
  shadowRadius:     4,
  elevation:        5,
  },
  unreadBadgeText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 11 },

  topicBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  topicText:  { fontFamily: "Nunito_600SemiBold", fontSize: 11 },

  memberBadge: {
  flexDirection: "row", alignItems: "center", gap: 4,
  backgroundColor: "#4CAF8F" + "22",
  borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  borderWidth: 1, borderColor: "#4CAF8F" + "44",
  },
  memberBadgeText: { color: "#4CAF8F", fontFamily: "Nunito_700Bold", fontSize: 11 },

  removedBadge: {
  backgroundColor: "#D4A44C" + "22",
  borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  borderWidth: 1, borderColor: "#D4A44C" + "44",
  },
  removedBadgeText: { color: "#D4A44C", fontFamily: "Nunito_600SemiBold", fontSize: 11 },

  groupDesc:  { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 12 },
  groupFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  memberCountRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  memberCount: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 12 },
  fullText:   { color: "#D4607A", fontFamily: "Nunito_500Medium", fontSize: 12 },

  blockedBadge: {
  flexDirection: "row", alignItems: "center", gap: 4,
  backgroundColor: "#D4A44C" + "18",
  borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  borderWidth: 1, borderColor: "#D4A44C" + "33",
  },
  blockedBadgeText: { color: "#D4A44C", fontFamily: "Nunito_600SemiBold", fontSize: 11 },

  groupActions: { flexDirection: "row", gap: 8 },

  // Open button (member)
  enterBtn: {
  paddingHorizontal: 14, paddingVertical: 9,
  borderRadius: 10, borderWidth: 1,
  justifyContent: "center", alignItems: "center",
  },
  enterBtnInner: { flexDirection: "row", alignItems: "center", gap: 5 },
  enterBtnText:  { fontFamily: "Nunito_700Bold", fontSize: 13 },

  // Mini count pill inside the Open button
  btnCountPill: {
  borderRadius: 10,
  minWidth:     20, height: 20,
  paddingHorizontal: 5,
  justifyContent: "center", alignItems: "center",
  opacity: 0.9,
  },
  btnCountPillText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 10 },

  // Leave button
  leaveBtn: {
  paddingHorizontal: 12, paddingVertical: 9,
  borderRadius: 10, borderWidth: 1, borderColor: "#2D2450",
  },
  leaveBtnText: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 13 },

  // Join button (non-member)
  joinBtn:     { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 },
  joinBtnText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 13 },

  // Empty state
  empty:      { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 8 },
  emptyText:  { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 24 },

  // Create modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" },
  modalSheet: {
  backgroundColor: "#1A1330",
  borderTopLeftRadius: 24, borderTopRightRadius: 24,
  paddingHorizontal: 24, paddingBottom: 40,
  maxHeight: "92%",
  borderTopWidth: 1, borderTopColor: "#2D2450",
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#2D2450", alignSelf: "center", marginTop: 12, marginBottom: 16 },
  modalTitle:  { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 26, marginBottom: 4 },
  modalSub:    { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 24, lineHeight: 20 },

  fieldLabel:  { color: "#C4A3E8", fontFamily: "Nunito_700Bold", fontSize: 12, letterSpacing: 0.4, marginBottom: 8, marginTop: 4 },
  input: {
  backgroundColor: "#0F0A1E", borderRadius: 14,
  borderWidth: 1, borderColor: "#2D2450",
  paddingHorizontal: 14, paddingVertical: 12,
  color: "#EDE8F5", fontFamily: "Nunito_400Regular", fontSize: 15,
  },
  inputMultiline: { minHeight: 80, paddingTop: 12 },
  charHint:    { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "right", marginTop: 4, marginBottom: 16 },

  topicGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  topicOption:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "#2D2450", backgroundColor: "#0F0A1E" },
  topicOptionText: { color: "#8B7FA8", fontFamily: "Nunito_600SemiBold", fontSize: 12 },

  iconGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  iconOption:      { width: 44, height: 44, borderRadius: 12, backgroundColor: "#0F0A1E", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#2D2450" },
  iconOptionActive: { borderColor: "#9B6FD4", backgroundColor: "#9B6FD4" + "22" },
  iconOptionText:  { fontSize: 22 },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn:    { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#2D2450", alignItems: "center" },
  cancelBtnText: { color: "#8B7FA8", fontFamily: "Nunito_600SemiBold", fontSize: 14 },
  saveBtn:      { flex: 2, padding: 14, borderRadius: 14, backgroundColor: "#9B6FD4", alignItems: "center" },
  saveBtnText:  { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 },
  });

