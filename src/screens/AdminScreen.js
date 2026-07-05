import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, ActivityIndicator,
  RefreshControl, TextInput, Modal, ScrollView,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect, G } from "react-native-svg";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import api from "../api/api";
import HushCircleSpinner from "../components/HushCircleSpinner";
import useSpinner from "../hooks/useSpinner";

const COLORS = {
  bg: "#0F0A1E", card: "#1A1330", border: "#2D2450",
  accent: "#9B6FD4", accentSoft: "#C4A3E8",
  text: "#EDE8F5", textMuted: "#8B7FA8",
  error: "#D4607A", success: "#4CAF8F", warning: "#D4A44C",
};

// ── SVG Icons ──────────────────────────────────────────────────────────────

const FlagIcon = ({ size = 14, color = COLORS.warning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="4" y1="22" x2="4" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const BanCircleIcon = ({ size = 14, color = COLORS.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const MailIcon = ({ size = 14, color = COLORS.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="22 6 12 13 2 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UsersIcon = ({ size = 14, color = COLORS.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={2} />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClipboardIcon = ({ size = 14, color = COLORS.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="8" y="2" width="8" height="4" rx="1" ry="1"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TrashIcon = ({ size = 14, color = COLORS.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = ({ size = 14, color = COLORS.success }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LockIcon = ({ size = 14, color = COLORS.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UnlockIcon = ({ size = 20, color = COLORS.success }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 9.9-1"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ZapIcon = ({ size = 14, color = COLORS.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SearchIcon = ({ size = 20, color = COLORS.text }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const AlertTriangleIcon = ({ size = 14, color = COLORS.warning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const InfoIcon = ({ size = 14, color = COLORS.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="12" y1="8" x2="12" y2="8" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CheckCircleIcon = ({ size = 14, color = COLORS.success }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="22 4 12 14.01 9 11.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const XCircleIcon = ({ size = 14, color = COLORS.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClockIcon = ({ size = 14, color = COLORS.warning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldIcon = ({ size = 44, color = COLORS.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      fill={color + "22"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LeafIcon = ({ size = 44, color = COLORS.success }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 8-12 9"
      fill={color + "22"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const InboxIcon = ({ size = 44, color = COLORS.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="22 12 16 12 14 15 10 15 8 12 2 12"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UsersEmptyIcon = ({ size = 44, color = COLORS.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={1.8} />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClipboardEmptyIcon = ({ size = 44, color = COLORS.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="8" y="2" width="8" height="4" rx="1" ry="1"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="9" y1="12" x2="15" y2="12" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Line x1="9" y1="16" x2="13" y2="16" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const MailPendingIcon = ({ size = 20, color = COLORS.warning }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="22 6 12 13 2 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartIcon = ({ size = 14, color = COLORS.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={color + "44"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ArrowRightIcon = ({ size = 13, color = COLORS.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 5 19 12 12 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Reason label configs — Icon + label instead of emoji prefix ────────────

const REASON_CONFIG = {
  harmful_content: { Icon: AlertTriangleIcon, color: COLORS.warning,    label: "Harmful" },
  spam:            { Icon: BanCircleIcon,     color: COLORS.textMuted,  label: "Spam" },
  inappropriate:   { Icon: XCircleIcon,       color: COLORS.error,      label: "Inappropriate" },
  bullying:        { Icon: AlertTriangleIcon, color: COLORS.error,      label: "Bullying" },
  misinformation:  { Icon: InfoIcon,          color: COLORS.warning,    label: "Misinfo" },
  other:           { Icon: MailIcon,          color: COLORS.textMuted,  label: "Other" },
};

const GROUP_REASON_CONFIG = {
  harassment:    { Icon: AlertTriangleIcon, color: COLORS.error,     label: "Harassment" },
  bullying:      { Icon: AlertTriangleIcon, color: COLORS.error,     label: "Bullying" },
  spam:          { Icon: BanCircleIcon,     color: COLORS.textMuted, label: "Spam" },
  inappropriate: { Icon: XCircleIcon,       color: COLORS.error,     label: "Inappropriate" },
  other:         { Icon: MailIcon,          color: COLORS.textMuted, label: "Other" },
};

// ── Appeal status config ───────────────────────────────────────────────────

const APPEAL_STATUS_CONFIG = {
  accepted: { Icon: CheckCircleIcon, color: COLORS.success, label: "Accepted" },
  rejected: { Icon: XCircleIcon,     color: COLORS.error,   label: "Rejected" },
  pending:  { Icon: ClockIcon,       color: COLORS.warning, label: "Pending" },
};

// ── Action type config ─────────────────────────────────────────────────────

const ACTION_TYPE_CONFIG = {
  delete_post:           { Icon: TrashIcon,   color: COLORS.error,   label: "Post removed" },
  dismiss_report:        { Icon: CheckIcon,   color: COLORS.success, label: "Dismissed" },
  group_report_reviewed: { Icon: UsersIcon,   color: COLORS.accent,  label: "Group report reviewed" },
  default:               { Icon: UnlockIcon,  color: COLORS.success, label: "Account updated" },
};

// ──────────────────────────────────────────────────────────────────────────

const timeAgo = (date) => {
  if (!date) return "—";
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const strikeColor = (count) => {
  if (count >= 3) return COLORS.error;
  if (count === 2) return COLORS.warning;
  return COLORS.textMuted;
};

export default function AdminScreen() {
  const navigation = useNavigation();
  const [reports, setReports] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [groupReports, setGroupReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("reports");
  const spinner = useSpinner();
  const [strikeCache, setStrikeCache] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostStrikes, setSelectedPostStrikes] = useState(0);
  const [deleteReason, setDeleteReason] = useState("");

  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [selectedBannedUser, setSelectedBannedUser] = useState(null);
  const [resetViolations, setResetViolations] = useState(true);

  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupPseudonym, setLookupPseudonym] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [searchingUser, setSearchingUser] = useState(false);
  const [lookupResetViolations, setLookupResetViolations] = useState(true);

  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [appealReviewNote, setAppealReviewNote] = useState("");

  const [showGroupReportModal, setShowGroupReportModal] = useState(false);
  const [selectedGroupReport, setSelectedGroupReport] = useState(null);

  const fetchStrikes = async (pseudonym) => {
    if (strikeCache[pseudonym] !== undefined) return strikeCache[pseudonym];
    try {
      const res = await api.get(`/admin/user-info/${pseudonym}`);
      const count = res.data.user?.confirmedViolations || 0;
      setStrikeCache((prev) => ({ ...prev, [pseudonym]: count }));
      return count;
    } catch { return 0; }
  };

  const fetchData = async () => {
    try {
      const [reportsRes, statsRes, bannedRes, appealsRes, groupReportsRes] = await Promise.all([
        api.get("/admin/reported-posts"),
        api.get("/admin/stats"),
        api.get("/admin/banned-users"),
        api.get("/admin/appeals"),
        api.get("/admin/group-reports"),
      ]);
      setReports(reportsRes.data.reports || []);
      setStats(statsRes.data);
      setBannedUsers(bannedRes.data.bannedUsers || []);
      setAppeals(appealsRes.data.appeals || []);
      setGroupReports(groupReportsRes.data.reports || []);

      const pseudonyms = [...new Set((reportsRes.data.reports || []).map((r) => r.postPseudonym))];
      const cache = {};
      await Promise.all(
        pseudonyms.map(async (p) => {
          try {
            const res = await api.get(`/admin/user-info/${p}`);
            cache[p] = res.data.user?.confirmedViolations || 0;
          } catch { cache[p] = 0; }
        })
      );
      setStrikeCache(cache);
    } catch (e) {
      Alert.alert("Error", "Could not load admin data.");
    }
  };

  const fetchActions = async () => {
    try {
      const res = await api.get("/admin/actions");
      setActions(res.data.actions || []);
    } catch (e) {}
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([fetchData(), fetchActions()]).finally(() => setLoading(false));
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchActions()]);
    setRefreshing(false);
  };

  const openDeleteModal = async (item) => {
    const strikes = strikeCache[item.postPseudonym] ?? await fetchStrikes(item.postPseudonym);
    setSelectedPost(item);
    setSelectedPostStrikes(strikes);
    setShowDeleteModal(true);
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    setShowDeleteModal(false);
    await spinner.withSpinner(async () => {
      try {
        const res = await api.post("/admin/delete-post", {
          postId: selectedPost.postId,
          reason: deleteReason || "Community guideline violation",
          notifyUser: true,
        });
        setStrikeCache((prev) => ({ ...prev, [selectedPost.postPseudonym]: res.data.violationCount }));
        Alert.alert(
          res.data.userBanned ? "Post removed — User banned" : "Post removed",
          `Violation ${res.data.violationCount}/3 confirmed.${res.data.userBanned ? " User has been banned." : ""}`
        );
        setDeleteReason("");
        setSelectedPost(null);
        await fetchData();
      } catch (e) {
        Alert.alert("Error", e.response?.data?.message || "Could not delete post.");
      }
    }, "Removing post...");
  };

  const handleDismiss = (postId) => {
    Alert.alert("Dismiss", "Mark as no violation found?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Dismiss",
        onPress: async () => {
          await spinner.withSpinner(async () => {
            try {
              await api.post("/admin/dismiss-report", { postId });
              await fetchData();
            } catch (e) { Alert.alert("Error", "Could not dismiss."); }
          }, "Dismissing...");
        },
      },
    ]);
  };

  const handleUnbanUser = async () => {
    if (!selectedBannedUser) return;
    setShowUnbanModal(false);
    await spinner.withSpinner(async () => {
      try {
        const res = await api.post("/admin/unban-user", { pseudonym: selectedBannedUser.pseudonym, resetViolations });
        Alert.alert("Done", res.data.message);
        setSelectedBannedUser(null);
        await fetchData();
      } catch (e) {
        Alert.alert("Error", e.response?.data?.message || "Could not unban.");
      }
    }, "Reinstating account...");
  };

  const handleLookupUser = async () => {
    if (!lookupPseudonym.trim()) return;
    setSearchingUser(true);
    setUserInfo(null);
    setRecentActivity([]);
    try {
      const res = await api.get(`/admin/user-info/${lookupPseudonym.trim()}`);
      setUserInfo(res.data.user);
      setRecentActivity(res.data.recentActivity || []);
    } catch (e) {
      Alert.alert("Not found", "No user with that pseudonym.");
    } finally { setSearchingUser(false); }
  };

  const handleLookupAction = async () => {
    if (!userInfo) return;
    setShowLookupModal(false);
    await spinner.withSpinner(async () => {
      try {
        const res = await api.post("/admin/unban-user", { pseudonym: userInfo.pseudonym, resetViolations: lookupResetViolations });
        Alert.alert("Done", res.data.message);
        setLookupPseudonym("");
        setUserInfo(null);
        await fetchData();
      } catch (e) {
        Alert.alert("Error", e.response?.data?.message || "Could not update.");
      }
    }, "Updating account...");
  };

  const handleReviewAppeal = async (action) => {
    if (!selectedAppeal) return;
    setShowAppealModal(false);
    await spinner.withSpinner(async () => {
      try {
        await api.patch(`/appeals/${selectedAppeal._id}`, { action, reviewNote: appealReviewNote });
        Alert.alert(
          action === "accepted" ? "Appeal accepted" : "Appeal rejected",
          action === "accepted" ? "User has been unbanned and violations reset." : "Appeal rejected. User remains banned."
        );
        setSelectedAppeal(null);
        setAppealReviewNote("");
        await fetchData();
      } catch (e) {
        Alert.alert("Error", e.response?.data?.message || "Could not review appeal.");
      }
    }, action === "accepted" ? "Accepting appeal..." : "Rejecting appeal...");
  };

  const handleReviewGroupReport = async (action) => {
    if (!selectedGroupReport) return;
    setShowGroupReportModal(false);
    await spinner.withSpinner(async () => {
      try {
        await api.patch(`/admin/group-reports/${selectedGroupReport._id}`, { action });
        Alert.alert(
          action === "actioned" ? "Report actioned" : "Report dismissed",
          action === "actioned" ? "The report has been marked as actioned." : "Report dismissed."
        );
        setSelectedGroupReport(null);
        await fetchData();
      } catch (e) {
        Alert.alert("Error", e.response?.data?.message || "Could not review report.");
      }
    }, "Reviewing report...");
  };

  // ── RENDER FUNCTIONS ───────────────────────────────────────────────────────

  const renderReport = ({ item }) => {
    const strikes = strikeCache[item.postPseudonym] ?? 0;
    const topReasons = Object.entries(item.reasons || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View>
            <Text style={styles.reportPseudonym}>@{item.postPseudonym}</Text>
            {strikes > 0 && (
              <View style={styles.strikeBadgeRow}>
                {[1, 2, 3].map((n) => (
                  <View key={n} style={[styles.strikeDot, { backgroundColor: n <= strikes ? strikeColor(strikes) : COLORS.border }]} />
                ))}
                <Text style={[styles.strikeLabel, { color: strikeColor(strikes) }]}>{strikes}/3 strikes</Text>
              </View>
            )}
          </View>
          <View style={styles.reportRight}>
            <View style={[styles.reportCountBadge, { backgroundColor: item.reportCount >= 3 ? COLORS.error + "33" : COLORS.warning + "22" }]}>
              <Text style={[styles.reportCount, { color: item.reportCount >= 3 ? COLORS.error : COLORS.warning }]}>
                {item.reportCount} report{item.reportCount !== 1 ? "s" : ""}
              </Text>
            </View>
            {item.reportCount >= 3 && (
              <View style={styles.actionRequiredBadge}>
                <ZapIcon size={13} color={COLORS.error} />
              </View>
            )}
          </View>
        </View>
        <Text style={styles.postPreview} numberOfLines={2}>"{item.postContent}"</Text>
        <View style={styles.reasonsWrap}>
          {topReasons.map(([reason, count]) => {
            const cfg = REASON_CONFIG[reason] || REASON_CONFIG.other;
            return (
              <View key={reason} style={styles.reasonChip}>
                <cfg.Icon size={11} color={cfg.color} />
                <Text style={styles.reasonText}>{cfg.label} ×{count}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.reportTime}>Latest: {timeAgo(item.latestReport)}</Text>
        <View style={styles.reportActions}>
          <TouchableOpacity style={styles.dismissBtn} onPress={() => handleDismiss(item.postId)}>
            <View style={styles.btnInner}>
              <CheckIcon size={13} color={COLORS.success} />
              <Text style={styles.dismissBtnText}>No violation</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => openDeleteModal(item)}>
            <View style={styles.btnInner}>
              <TrashIcon size={13} color={COLORS.error} />
              <Text style={styles.deleteBtnText}>Remove post</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderBannedUser = ({ item }) => (
    <View style={[styles.bannedCard, item.hasRejectedAppeal && { borderColor: COLORS.error + "55" }]}>
      <View style={styles.bannedLeft}>
        <View style={styles.bannedAvatar}>
          <Text style={styles.bannedAvatarText}>{item.pseudonym?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.bannedStatusDot} />
      </View>
      <View style={styles.bannedInfo}>
        <View style={styles.bannedNameRow}>
          <Text style={styles.bannedPseudonym}>@{item.pseudonym}</Text>
          {item.hasPendingAppeal && (
            <View style={styles.appealPendingBadge}>
              <MailPendingIcon size={10} color={COLORS.warning} />
              <Text style={styles.appealPendingBadgeText}>Appeal pending</Text>
            </View>
          )}
          {item.hasRejectedAppeal && (
            <View style={styles.appealRejectedBadge}>
              <LockIcon size={10} color={COLORS.error} />
              <Text style={styles.appealRejectedBadgeText}>Final</Text>
            </View>
          )}
        </View>
        <View style={styles.violationDotsRow}>
          {[1, 2, 3].map((n) => (
            <View key={n} style={[styles.vDot, { backgroundColor: n <= item.confirmedViolations ? COLORS.error : COLORS.border }]} />
          ))}
          <Text style={styles.violationText}>{item.confirmedViolations} violation{item.confirmedViolations !== 1 ? "s" : ""}</Text>
        </View>
        <Text style={styles.bannedMeta}>By {item.bannedBy} • {timeAgo(item.lastViolationDate)}</Text>
        {item.lastViolationReason && (
          <Text style={styles.bannedReason} numberOfLines={1}>"{item.lastViolationReason}"</Text>
        )}
      </View>
      {item.hasRejectedAppeal ? (
        <View style={styles.lockedBtn}>
          <LockIcon size={18} color={COLORS.textMuted} />
          <Text style={styles.lockedBtnLabel}>Locked</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.unbanBtn}
          onPress={() => { setSelectedBannedUser(item); setResetViolations(true); setShowUnbanModal(true); }}
        >
          <UnlockIcon size={18} color={COLORS.success} />
          <Text style={styles.unbanBtnLabel}>Unban</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAppeal = ({ item }) => {
    const statusCfg = APPEAL_STATUS_CONFIG[item.status] || APPEAL_STATUS_CONFIG.pending;
    return (
      <View style={[styles.appealCard, { borderLeftColor: statusCfg.color }]}>
        <View style={styles.appealHeader}>
          <Text style={styles.appealPseudonym}>@{item.pseudonym}</Text>
          <View style={[styles.appealStatusBadge, { backgroundColor: statusCfg.color + "22" }]}>
            <statusCfg.Icon size={11} color={statusCfg.color} />
            <Text style={[styles.appealStatusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>
        <Text style={styles.appealMessage} numberOfLines={3}>"{item.message}"</Text>
        <Text style={styles.appealTime}>{timeAgo(item.createdAt)}</Text>
        {item.status === "pending" && (
          <TouchableOpacity
            style={styles.reviewAppealBtn}
            onPress={() => { setSelectedAppeal(item); setShowAppealModal(true); }}
          >
            <View style={styles.btnInner}>
              <Text style={styles.reviewAppealBtnText}>Review appeal</Text>
              <ArrowRightIcon size={12} color={COLORS.accentSoft} />
            </View>
          </TouchableOpacity>
        )}
        {item.status !== "pending" && item.reviewNote && (
          <Text style={styles.appealReviewNote}>Note: "{item.reviewNote}"</Text>
        )}
      </View>
    );
  };

  const renderGroupReport = ({ item }) => {
    const grCfg = GROUP_REASON_CONFIG[item.reason] || GROUP_REASON_CONFIG.other;
    return (
      <View style={styles.groupReportCard}>
        <View style={styles.groupReportHeader}>
          <View>
            <Text style={styles.groupReportTitle}>{item.groupName || "Circle"}</Text>
            <Text style={styles.groupReportSub}>
              @{item.reportedByPseudonym} reported @{item.targetUserPseudonym}
            </Text>
          </View>
          <View style={[styles.reasonChip, { backgroundColor: COLORS.warning + "22" }]}>
            <grCfg.Icon size={11} color={grCfg.color} />
            <Text style={[styles.reasonText, { color: COLORS.warning }]}>{grCfg.label}</Text>
          </View>
        </View>
        {item.postContext ? (
          <Text style={styles.postPreview} numberOfLines={2}>"{item.postContext}"</Text>
        ) : null}
        {item.details ? (
          <Text style={styles.groupReportDetails} numberOfLines={2}>{item.details}</Text>
        ) : null}
        <Text style={styles.reportTime}>{timeAgo(item.createdAt)}</Text>
        <View style={styles.reportActions}>
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => { setSelectedGroupReport(item); handleReviewGroupReport("dismissed"); }}
          >
            <View style={styles.btnInner}>
              <CheckIcon size={13} color={COLORS.success} />
              <Text style={styles.dismissBtnText}>Dismiss</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => { setSelectedGroupReport(item); setShowGroupReportModal(true); }}
          >
            <View style={styles.btnInner}>
              <ZapIcon size={13} color={COLORS.error} />
              <Text style={styles.deleteBtnText}>Take action</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAction = ({ item }) => {
    const cfg = ACTION_TYPE_CONFIG[item.action] || ACTION_TYPE_CONFIG.default;
    return (
      <View style={styles.actionItem}>
        <View style={[styles.actionDot, { backgroundColor: item.action === "delete_post" ? COLORS.error : COLORS.success }]} />
        <View style={styles.actionInfo}>
          <View style={styles.actionTypeRow}>
            <cfg.Icon size={13} color={cfg.color} />
            <Text style={styles.actionType}>{cfg.label}</Text>
          </View>
          <Text style={styles.actionAdmin}>by {item.adminPseudonym}</Text>
          {item.reason && <Text style={styles.actionReason} numberOfLines={1}>"{item.reason}"</Text>}
          <Text style={styles.actionTime}>{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.accent} size="large" />
        <Text style={styles.loadingText}>Loading admin panel...</Text>
      </View>
    );
  }

  const pendingAppeals = appeals.filter((a) => a.status === "pending").length;
  const pendingGroupReports = groupReports.filter((r) => r.status === "pending").length;

  const tabs = [
    { key: "reports",      Icon: FlagIcon,      iconColor: COLORS.warning,    label: `Reports (${reports.length})` },
    { key: "banned",       Icon: BanCircleIcon, iconColor: COLORS.error,      label: `Banned (${bannedUsers.length})` },
    { key: "appeals",      Icon: MailIcon,       iconColor: COLORS.accentSoft, label: `Appeals${pendingAppeals > 0 ? ` (${pendingAppeals})` : ""}` },
    { key: "groupReports", Icon: UsersIcon,      iconColor: COLORS.accent,     label: `Circles${pendingGroupReports > 0 ? ` (${pendingGroupReports})` : ""}` },
    { key: "actions",      Icon: ClipboardIcon,  iconColor: COLORS.textMuted,  label: "Actions" },
  ];

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>HushCircle moderation</Text>
        </View>
        <TouchableOpacity style={styles.lookupTriggerBtn} onPress={() => setShowLookupModal(true)}>
          <View style={styles.btnInner}>
            <SearchIcon size={14} color={COLORS.text} />
            <Text style={styles.lookupTriggerText}>Lookup</Text>
          </View>
        </TouchableOpacity>
      </View>
      {/* Recovery Requests */}
<TouchableOpacity
  style={{
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  }}
  onPress={() => navigation.navigate("AdminRecoveryRequests")}
>
  <Text
    style={{
      color: COLORS.text,
      fontFamily: "Nunito_700Bold",
      fontSize: 14,
    }}
  >
    Recovery Requests
  </Text>
</TouchableOpacity>

      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: COLORS.accent }]}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: COLORS.error }]}>{stats.pendingReports}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: COLORS.warning }]}>{stats.bannedUsers}</Text>
            <Text style={styles.statLabel}>Banned</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: COLORS.warning }]}>{stats.pendingGroupReports || 0}</Text>
            <Text style={styles.statLabel}>Circle</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: COLORS.success }]}>{stats.totalPosts}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <View style={styles.tabBtnInner}>
              <tab.Icon size={13} color={activeTab === tab.key ? "#fff" : tab.iconColor} />
              <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab content */}
      {activeTab === "reports" && (
        <FlatList data={reports} keyExtractor={(item) => item.postId?.toString()} renderItem={renderReport}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}><ShieldIcon size={36} color={COLORS.accent} /></View>
              <Text style={styles.emptyTitle}>No reports right now.</Text>
              <Text style={styles.emptyText}>Good job. The community is healthy.</Text>
            </View>
          }
        />
      )}

      {activeTab === "banned" && (
        <FlatList data={bannedUsers} keyExtractor={(item) => item._id?.toString()} renderItem={renderBannedUser}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}><LeafIcon size={36} color={COLORS.success} /></View>
              <Text style={styles.emptyTitle}>No banned users</Text>
              <Text style={styles.emptyText}>Everyone is following the guidelines.</Text>
            </View>
          }
        />
      )}

      {activeTab === "appeals" && (
        <FlatList data={appeals} keyExtractor={(item, i) => item._id || i.toString()} renderItem={renderAppeal}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}><InboxIcon size={36} color={COLORS.accentSoft} /></View>
              <Text style={styles.emptyTitle}>No appeals</Text>
              <Text style={styles.emptyText}>No users have appealed yet.</Text>
            </View>
          }
        />
      )}

      {activeTab === "groupReports" && (
        <FlatList data={groupReports} keyExtractor={(item, i) => item._id || i.toString()} renderItem={renderGroupReport}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}><UsersEmptyIcon size={36} color={COLORS.textMuted} /></View>
              <Text style={styles.emptyTitle}>No circle reports</Text>
              <Text style={styles.emptyText}>All circles are running smoothly.</Text>
            </View>
          }
        />
      )}

      {activeTab === "actions" && (
        <FlatList data={actions} keyExtractor={(item, i) => item._id || i.toString()} renderItem={renderAction}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}><ClipboardEmptyIcon size={36} color={COLORS.textMuted} /></View>
              <Text style={styles.emptyTitle}>No actions yet</Text>
              <Text style={styles.emptyText}>Admin actions will appear here.</Text>
            </View>
          }
        />
      )}

      {/* ── DELETE MODAL ── */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <TrashIcon size={32} color={COLORS.error} />
            </View>
            <Text style={styles.modalTitle}>Remove this post?</Text>
            {selectedPost && (
              <View style={[styles.strikeWarning, { backgroundColor: selectedPostStrikes >= 2 ? COLORS.error + "18" : COLORS.warning + "18", borderColor: selectedPostStrikes >= 2 ? COLORS.error + "44" : COLORS.warning + "44" }]}>
                <View style={styles.btnInner}>
                  {selectedPostStrikes >= 2
                    ? <AlertTriangleIcon size={13} color={COLORS.error} />
                    : <InfoIcon size={13} color={COLORS.accent} />
                  }
                  <Text style={[styles.strikeWarningText, { color: selectedPostStrikes >= 2 ? COLORS.error : COLORS.warning }]}>
                    {selectedPostStrikes >= 2
                      ? `User is at ${selectedPostStrikes}/3 violations — this action will ban them`
                      : `User is at ${selectedPostStrikes}/3 violations`}
                  </Text>
                </View>
              </View>
            )}
            {selectedPost && (
              <View style={styles.modalPostPreview}>
                <Text style={styles.modalPostText} numberOfLines={2}>"{selectedPost.postContent}"</Text>
                <Text style={styles.modalPostBy}>— @{selectedPost.postPseudonym}</Text>
              </View>
            )}
            <TextInput style={styles.reasonInput} placeholder="Reason for removal (shown to user)..." placeholderTextColor={COLORS.textMuted} value={deleteReason} onChangeText={setDeleteReason} multiline />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowDeleteModal(false); setSelectedPost(null); setDeleteReason(""); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDeleteBtn} onPress={handleDeletePost}>
                <View style={styles.btnInner}>
                  <TrashIcon size={13} color="#fff" />
                  <Text style={styles.modalDeleteText}>Remove</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── UNBAN MODAL ── */}
      <Modal visible={showUnbanModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <UnlockIcon size={32} color={COLORS.success} />
            </View>
            <Text style={styles.modalTitle}>Reinstate account?</Text>
            {selectedBannedUser && (
              <View style={styles.unbanUserCard}>
                <View style={styles.unbanUserAvatar}>
                  <Text style={styles.unbanUserAvatarText}>{selectedBannedUser.pseudonym?.[0]?.toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.unbanUserName}>@{selectedBannedUser.pseudonym}</Text>
                  <Text style={styles.unbanUserMeta}>{selectedBannedUser.confirmedViolations} confirmed violations</Text>
                </View>
              </View>
            )}
            <Text style={styles.modalDesc}>User will receive a welcome back notification and appeal access will be reset.</Text>
            <TouchableOpacity style={[styles.resetToggle, resetViolations && styles.resetToggleActive]} onPress={() => setResetViolations(!resetViolations)}>
              <View style={[styles.toggleDot, resetViolations && styles.toggleDotActive]} />
              <Text style={[styles.resetToggleText, resetViolations && { color: COLORS.success }]}>
                {resetViolations ? "Reset violations to 0" : `Keep count (${selectedBannedUser?.confirmedViolations || 0})`}
              </Text>
              {resetViolations && <CheckIcon size={13} color={COLORS.success} />}
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowUnbanModal(false); setSelectedBannedUser(null); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalDeleteBtn, { backgroundColor: COLORS.success }]} onPress={handleUnbanUser}>
                <View style={styles.btnInner}>
                  <HeartIcon size={13} color="#fff" />
                  <Text style={styles.modalDeleteText}>Reinstate</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── LOOKUP MODAL ── */}
      <Modal visible={showLookupModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.lookupScroll}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconWrap}>
                <SearchIcon size={32} color={COLORS.accent} />
              </View>
              <Text style={styles.modalTitle}>User Lookup</Text>
              <View style={styles.lookupRow}>
                <TextInput
                  style={[styles.reasonInput, { flex: 1, minHeight: 44, marginBottom: 0 }]}
                  placeholder="Enter pseudonym..."
                  placeholderTextColor={COLORS.textMuted}
                  value={lookupPseudonym}
                  onChangeText={(t) => { setLookupPseudonym(t); setUserInfo(null); setRecentActivity([]); }}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.lookupSearchBtn} onPress={handleLookupUser}>
                  {searchingUser ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.lookupSearchText}>Go</Text>}
                </TouchableOpacity>
              </View>

              {userInfo && (
                <>
                  <View style={styles.userInfoBox}>
                    <View style={styles.userInfoHeader}>
                      <View style={styles.unbanUserAvatar}>
                        <Text style={styles.unbanUserAvatarText}>{userInfo.pseudonym?.[0]?.toUpperCase()}</Text>
                      </View>
                      <View>
                        <Text style={styles.unbanUserName}>@{userInfo.pseudonym}</Text>
                        <View style={styles.btnInner}>
                          {userInfo.isBanned
                            ? <BanCircleIcon size={12} color={COLORS.error} />
                            : <CheckCircleIcon size={12} color={COLORS.success} />
                          }
                          <Text style={[styles.userStatusBadge, { color: userInfo.isBanned ? COLORS.error : COLORS.success }]}>
                            {userInfo.isBanned ? "Banned" : "Active"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.userInfoStats}>
                      <View style={styles.userInfoStat}>
                        <Text style={[styles.userInfoStatNum, { color: COLORS.error }]}>{userInfo.confirmedViolations || 0}</Text>
                        <Text style={styles.userInfoStatLabel}>Violations</Text>
                      </View>
                      <View style={styles.userInfoStat}>
                        <Text style={[styles.userInfoStatNum, { color: COLORS.accent }]}>{userInfo.role || "user"}</Text>
                        <Text style={styles.userInfoStatLabel}>Role</Text>
                      </View>
                    </View>
                    <View style={styles.activitySection}>
                      <Text style={styles.activityTitle}>Recent activity</Text>
                      {recentActivity.length > 0 ? (
                        recentActivity.map((a, i) => (
                          <View key={i} style={styles.activityItem}>
                            <View style={[styles.activityDot, { backgroundColor: a.action === "delete_post" ? COLORS.error : COLORS.success }]} />
                            <Text style={styles.activityText}>
                              {a.action === "delete_post" ? "Post removed" : "Report dismissed"}
                              {a.reason ? ` — ${a.reason}` : ""}
                            </Text>
                            <Text style={styles.activityTime}>{timeAgo(a.createdAt)}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noActivityText}>No violations on record</Text>
                      )}
                    </View>
                    <TouchableOpacity style={[styles.resetToggle, lookupResetViolations && styles.resetToggleActive]} onPress={() => setLookupResetViolations(!lookupResetViolations)}>
                      <View style={[styles.toggleDot, lookupResetViolations && styles.toggleDotActive]} />
                      <Text style={[styles.resetToggleText, lookupResetViolations && { color: COLORS.success }]}>
                        {lookupResetViolations ? "Reset violations to 0" : "Keep violation count"}
                      </Text>
                      {lookupResetViolations && <CheckIcon size={13} color={COLORS.success} />}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowLookupModal(false); setLookupPseudonym(""); setUserInfo(null); setRecentActivity([]); }}>
                      <Text style={styles.modalCancelText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalDeleteBtn, { backgroundColor: userInfo.isBanned ? COLORS.success : COLORS.warning }]} onPress={handleLookupAction}>
                      <View style={styles.btnInner}>
                        {userInfo.isBanned ? <HeartIcon size={13} color="#fff" /> : <CheckIcon size={13} color="#fff" />}
                        <Text style={styles.modalDeleteText}>{userInfo.isBanned ? "Reinstate" : "Reset violations"}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {!userInfo && (
                <TouchableOpacity style={[styles.modalCancelBtn, { width: "100%", marginTop: 8 }]} onPress={() => setShowLookupModal(false)}>
                  <Text style={styles.modalCancelText}>Close</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── APPEAL REVIEW MODAL ── */}
      <Modal visible={showAppealModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <MailIcon size={32} color={COLORS.accentSoft} />
            </View>
            <Text style={styles.modalTitle}>Review Appeal</Text>
            {selectedAppeal && (
              <>
                <View style={styles.appealReviewCard}>
                  <Text style={styles.appealReviewPseudonym}>@{selectedAppeal.pseudonym}</Text>
                  <Text style={styles.appealReviewMessage}>"{selectedAppeal.message}"</Text>
                  <Text style={styles.appealReviewTime}>{timeAgo(selectedAppeal.createdAt)}</Text>
                </View>
                {selectedAppeal.violations?.length > 0 && (
                  <View style={styles.appealViolationsBox}>
                    <Text style={styles.appealViolationsTitle}>Their violations:</Text>
                    {selectedAppeal.violations.map((v, i) => (
                      <Text key={i} style={styles.appealViolationItem}>
                        • {v.reason || "Guideline violation"} — {timeAgo(v.date)}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            )}
            <TextInput style={[styles.reasonInput, { marginTop: 12 }]} placeholder="Review note (shown to user if rejected)..." placeholderTextColor={COLORS.textMuted} value={appealReviewNote} onChangeText={setAppealReviewNote} multiline />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowAppealModal(false); setSelectedAppeal(null); setAppealReviewNote(""); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalDeleteBtn, { backgroundColor: COLORS.error }]} onPress={() => handleReviewAppeal("rejected")}>
                <View style={styles.btnInner}>
                  <XCircleIcon size={13} color="#fff" />
                  <Text style={styles.modalDeleteText}>Reject</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalDeleteBtn, { backgroundColor: COLORS.success }]} onPress={() => handleReviewAppeal("accepted")}>
                <View style={styles.btnInner}>
                  <CheckCircleIcon size={13} color="#fff" />
                  <Text style={styles.modalDeleteText}>Accept</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── GROUP REPORT ACTION MODAL ── */}
      <Modal visible={showGroupReportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <UsersIcon size={32} color={COLORS.accent} />
            </View>
            <Text style={styles.modalTitle}>Take action?</Text>
            {selectedGroupReport && (
              <View style={styles.appealReviewCard}>
                <Text style={styles.appealReviewPseudonym}>
                  @{selectedGroupReport.targetUserPseudonym} in {selectedGroupReport.groupName}
                </Text>
                <Text style={styles.appealReviewMessage}>
                  Reason: {GROUP_REASON_CONFIG[selectedGroupReport.reason]?.label || selectedGroupReport.reason}
                </Text>
                {selectedGroupReport.postContext ? (
                  <Text style={styles.groupReportDetails} numberOfLines={2}>"{selectedGroupReport.postContext}"</Text>
                ) : null}
                <Text style={styles.appealReviewTime}>{timeAgo(selectedGroupReport.createdAt)}</Text>
              </View>
            )}
            <Text style={styles.modalDesc}>
              Mark this report as actioned. You may also need to take action in the specific circle via the Circle_Keeper controls.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowGroupReportModal(false); setSelectedGroupReport(null); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalDeleteBtn, { backgroundColor: COLORS.success }]} onPress={() => handleReviewGroupReport("actioned")}>
                <View style={styles.btnInner}>
                  <HeartIcon size={13} color="#fff" />
                  <Text style={styles.modalDeleteText}>Mark actioned</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14 },

  header: { paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 26, color: COLORS.text, fontFamily: "DMSerifDisplay_400Regular" },
  headerSub: { fontSize: 12, color: COLORS.textMuted, fontFamily: "Nunito_400Regular", marginTop: 2 },
  lookupTriggerBtn: { backgroundColor: COLORS.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  lookupTriggerText: { color: COLORS.text, fontFamily: "Nunito_600SemiBold", fontSize: 13 },

  statsRow: { flexDirection: "row", padding: 12, gap: 6 },
  statItem: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  statNum: { fontSize: 20, fontFamily: "DMSerifDisplay_400Regular", marginBottom: 2 },
  statLabel: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 10 },

  tabScroll: { flexGrow: 0 },
  tabRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  tabBtn: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  tabBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  tabBtnInner: { flexDirection: "row", alignItems: "center", gap: 5 },
  tabBtnText: { color: COLORS.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 13 },
  tabBtnTextActive: { color: "#fff" },
  list: { padding: 16, paddingTop: 4 },

  // Shared inline row
  btnInner: { flexDirection: "row", alignItems: "center", gap: 6 },

  reportCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  reportHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  reportPseudonym: { color: COLORS.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 14, marginBottom: 4 },
  strikeBadgeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  strikeDot: { width: 8, height: 8, borderRadius: 4 },
  strikeLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 11, marginLeft: 2 },
  reportRight: { alignItems: "flex-end", gap: 4 },
  reportCountBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  reportCount: { fontFamily: "Nunito_700Bold", fontSize: 12 },
  actionRequiredBadge: { backgroundColor: COLORS.error + "22", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4, alignItems: "center", justifyContent: "center" },
  postPreview: { color: COLORS.text, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 10, fontStyle: "italic" },
  reasonsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  reasonChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  reasonText: { color: COLORS.textMuted, fontFamily: "Nunito_500Medium", fontSize: 11 },
  reportTime: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, marginBottom: 12 },
  reportActions: { flexDirection: "row", gap: 10 },
  dismissBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.success + "66", alignItems: "center" },
  dismissBtnText: { color: COLORS.success, fontFamily: "Nunito_700Bold", fontSize: 13 },
  deleteBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: COLORS.error + "22", borderWidth: 1, borderColor: COLORS.error + "44", alignItems: "center" },
  deleteBtnText: { color: COLORS.error, fontFamily: "Nunito_700Bold", fontSize: 13 },

  groupReportCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3, borderLeftColor: COLORS.warning },
  groupReportHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  groupReportTitle: { color: COLORS.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 14 },
  groupReportSub: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2 },
  groupReportDetails: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, fontStyle: "italic", marginBottom: 8 },

  bannedCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.error + "33" },
  bannedLeft: { position: "relative" },
  bannedAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.error + "22", justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: COLORS.error + "55" },
  bannedAvatarText: { color: COLORS.error, fontFamily: "Nunito_700Bold", fontSize: 18 },
  bannedStatusDot: { position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.error, borderWidth: 2, borderColor: COLORS.card },
  bannedInfo: { flex: 1 },
  bannedNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" },
  bannedPseudonym: { color: COLORS.text, fontFamily: "Nunito_700Bold", fontSize: 15 },
  appealPendingBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.warning + "22", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  appealPendingBadgeText: { color: COLORS.warning, fontFamily: "Nunito_600SemiBold", fontSize: 10 },
  appealRejectedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.error + "22", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  appealRejectedBadgeText: { color: COLORS.error, fontFamily: "Nunito_600SemiBold", fontSize: 10 },
  violationDotsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  vDot: { width: 10, height: 10, borderRadius: 5 },
  violationText: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, marginLeft: 4 },
  bannedMeta: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, marginBottom: 2 },
  bannedReason: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, fontStyle: "italic" },
  unbanBtn: { backgroundColor: COLORS.success + "22", borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: COLORS.success + "44", minWidth: 56 },
  unbanBtnLabel: { color: COLORS.success, fontFamily: "Nunito_700Bold", fontSize: 11, marginTop: 2 },
  lockedBtn: { backgroundColor: COLORS.border, borderRadius: 12, padding: 10, alignItems: "center", minWidth: 56, opacity: 0.6 },
  lockedBtnLabel: { color: COLORS.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 11, marginTop: 2 },

  appealCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3 },
  appealHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  appealPseudonym: { color: COLORS.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 14 },
  appealStatusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  appealStatusText: { fontFamily: "Nunito_700Bold", fontSize: 11 },
  appealMessage: { color: COLORS.text, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20, fontStyle: "italic", marginBottom: 8 },
  appealTime: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, marginBottom: 10 },
  reviewAppealBtn: { backgroundColor: COLORS.accent + "22", borderRadius: 10, padding: 10, alignItems: "center", borderWidth: 1, borderColor: COLORS.accent + "44" },
  reviewAppealBtnText: { color: COLORS.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 13 },
  appealReviewNote: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, fontStyle: "italic", marginTop: 6 },

  actionItem: { flexDirection: "row", gap: 12, backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  actionDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  actionInfo: { flex: 1 },
  actionTypeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  actionType: { color: COLORS.text, fontFamily: "Nunito_700Bold", fontSize: 14 },
  actionAdmin: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 },
  actionReason: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, fontStyle: "italic", marginTop: 2 },
  actionTime: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, marginTop: 4 },

  empty: { alignItems: "center", paddingTop: 60 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  emptyTitle: { color: COLORS.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 8 },
  emptyText: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "center", alignItems: "center", padding: 24 },
  lookupScroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 24, width: "100%", maxWidth: 360, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  modalIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  modalTitle: { color: COLORS.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 8, textAlign: "center" },
  modalDesc: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  strikeWarning: { borderRadius: 10, padding: 10, borderWidth: 1, width: "100%", marginBottom: 12 },
  strikeWarningText: { fontFamily: "Nunito_600SemiBold", fontSize: 13, flex: 1 },
  modalPostPreview: { backgroundColor: COLORS.bg, borderRadius: 12, padding: 12, width: "100%", marginBottom: 12, borderLeftWidth: 3, borderLeftColor: COLORS.error },
  modalPostText: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, fontStyle: "italic", lineHeight: 20 },
  modalPostBy: { color: COLORS.accentSoft, fontFamily: "Nunito_600SemiBold", fontSize: 12, marginTop: 4 },
  reasonInput: { backgroundColor: COLORS.bg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 12, color: COLORS.text, fontFamily: "Nunito_400Regular", fontSize: 14, width: "100%", minHeight: 80, marginBottom: 16, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 8, width: "100%" },
  modalCancelBtn: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: "center" },
  modalCancelText: { color: COLORS.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 14 },
  modalDeleteBtn: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: COLORS.error, alignItems: "center", justifyContent: "center" },
  modalDeleteText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 },

  unbanUserCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.bg, borderRadius: 14, padding: 14, width: "100%", marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  unbanUserAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.error + "22", justifyContent: "center", alignItems: "center" },
  unbanUserAvatarText: { color: COLORS.error, fontFamily: "Nunito_700Bold", fontSize: 18 },
  unbanUserName: { color: COLORS.text, fontFamily: "Nunito_700Bold", fontSize: 15, marginBottom: 2 },
  unbanUserMeta: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 },
  resetToggle: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, width: "100%", marginBottom: 16, backgroundColor: COLORS.bg },
  resetToggleActive: { borderColor: COLORS.success + "66", backgroundColor: COLORS.success + "0D" },
  toggleDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.border },
  toggleDotActive: { backgroundColor: COLORS.success },
  resetToggleText: { color: COLORS.textMuted, fontFamily: "Nunito_500Medium", fontSize: 13, flex: 1 },

  lookupRow: { flexDirection: "row", gap: 8, width: "100%", marginBottom: 14 },
  lookupSearchBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  lookupSearchText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 },
  userInfoBox: { backgroundColor: COLORS.bg, borderRadius: 14, padding: 14, width: "100%", marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  userInfoHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  userStatusBadge: { fontFamily: "Nunito_600SemiBold", fontSize: 13 },
  userInfoStats: { flexDirection: "row", gap: 16, marginBottom: 12 },
  userInfoStat: { alignItems: "center" },
  userInfoStatNum: { fontFamily: "DMSerifDisplay_400Regular", fontSize: 22 },
  userInfoStatLabel: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11 },
  activitySection: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, marginBottom: 12 },
  activityTitle: { color: COLORS.text, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 8, letterSpacing: 0.3 },
  activityItem: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  activityDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  activityText: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, flex: 1 },
  activityTime: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11 },
  noActivityText: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, fontStyle: "italic" },

  appealReviewCard: { backgroundColor: COLORS.bg, borderRadius: 12, padding: 14, width: "100%", marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  appealReviewPseudonym: { color: COLORS.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 13, marginBottom: 6 },
  appealReviewMessage: { color: COLORS.text, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20, fontStyle: "italic", marginBottom: 6 },
  appealReviewTime: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11 },
  appealViolationsBox: { backgroundColor: COLORS.bg, borderRadius: 10, padding: 12, width: "100%", marginBottom: 4, borderWidth: 1, borderColor: COLORS.error + "33" },
  appealViolationsTitle: { color: COLORS.error, fontFamily: "Nunito_600SemiBold", fontSize: 12, marginBottom: 6 },
  appealViolationItem: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 20 },
});