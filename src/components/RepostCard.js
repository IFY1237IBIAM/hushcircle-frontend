/**
 * RepostCard.js
 *
 * Renders a full repost feed item:
 *  1. Resharer header  (avatar · "X shared a story" · timestamp)
 *  2. Embedded original PostCard  (all reactions/comments go to original author)
 *  3. Resharer's own secondary comment stream
 *     — same bubble/thread/edit/delete UX as CommentThread.js
 *     — notifications go to the RESHARER, not the original author
 *
 * Exports:
 *   default          RepostCard
 *   RepostConfirmModal   bottom-sheet used by FeedScreen before creating a repost
 */

import { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
  Animated, Modal, Pressable,
  KeyboardAvoidingView, Platform, Clipboard,
} from "react-native";
import Svg, {
  Path, Circle, Line, Polyline, Rect,
} from "react-native-svg";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useNetwork } from "../context/NetworkContext";
import NoNetworkOverlay from "./NoNetworkOverlay";
import HushCircleSpinner from "./HushCircleSpinner";
import useSpinner from "../hooks/useSpinner";
import PostCard from "./PostCard";

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg:         "#0F0A1E",
  card:       "#1A1330",
  cardDeep:   "#130E26",
  border:     "#2D2450",
  accent:     "#9B6FD4",
  accentSoft: "#C4A3E8",
  accentDim:  "#9B6FD420",
  text:       "#EDE8F5",
  textMuted:  "#8B7FA8",
  error:      "#D4607A",
  success:    "#4CAF8F",
  warning:    "#D4A44C",
};

// ── Tiny helpers ───────────────────────────────────────────────────────────
const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

const copyToClipboard = (text) => {
  Clipboard.setString(text);
  Alert.alert("Copied", "Text copied to clipboard");
};

// ── SVG Icons (matching CommentThread style) ───────────────────────────────
const DotsIcon = ({ size = 16, color = C.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="5"  cy="12" r="1.5" fill={color} />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
    <Circle cx="19" cy="12" r="1.5" fill={color} />
  </Svg>
);

const CopyIcon = ({ size = 16, color = C.text }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="13" height="13" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EditIcon = ({ size = 16, color = C.text }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TrashIcon = ({ size = 16, color = C.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 11v6M14 11v6"
      stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SendSmallIcon = ({ size = 12, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13"  stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 2L15 22l-4-9-9-4 20-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Options bottom-sheet (same pattern as CommentThread) ───────────────────
function OptionsModal({ visible, onClose, onEdit, onDelete, onCopy, isDeleted, isOwner }) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.optionsOverlay} onPress={onClose} activeOpacity={1}>
        <View style={s.optionsSheet}>
          {!isDeleted && (
            <TouchableOpacity style={s.optionItem} onPress={() => { onClose(); onCopy(); }}>
              <View style={s.optionItemRow}>
                <CopyIcon size={16} color={C.text} />
                <Text style={s.optionItemText}>Copy text</Text>
              </View>
            </TouchableOpacity>
          )}
          {!isDeleted && isOwner && <View style={s.optionDivider} />}
          {isOwner && !isDeleted && (
            <>
              <TouchableOpacity style={s.optionItem} onPress={() => { onClose(); onEdit(); }}>
                <View style={s.optionItemRow}>
                  <EditIcon size={16} color={C.text} />
                  <Text style={s.optionItemText}>Edit</Text>
                </View>
              </TouchableOpacity>
              <View style={s.optionDivider} />
              <TouchableOpacity style={s.optionItem} onPress={() => { onClose(); onDelete(); }}>
                <View style={s.optionItemRow}>
                  <TrashIcon size={16} color={C.error} />
                  <Text style={[s.optionItemText, { color: C.error }]}>Delete</Text>
                </View>
              </TouchableOpacity>
              <View style={s.optionDivider} />
            </>
          )}
          <TouchableOpacity style={s.optionItem} onPress={onClose}>
            <Text style={[s.optionItemText, { color: C.textMuted, textAlign: "center" }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ pseudonym, size = 30 }) {
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[s.avatarText, { fontSize: size * 0.38 }]}>
        {pseudonym?.[0]?.toUpperCase() || "?"}
      </Text>
    </View>
  );
}

// ── Single secondary comment row ───────────────────────────────────────────
function RepostCommentRow({
  comment,
  repostId,
  currentUserId,
  currentPseudonym,
  isRepostOwner,   // true if current user is the resharer
  onUpdated,
  onDeleted,
}) {
  const [showOptions, setShowOptions]   = useState(false);
  const [editing, setEditing]           = useState(false);
  const [editText, setEditText]         = useState(comment.text);
  const [savingEdit, setSavingEdit]     = useState(false);
  const [displayText, setDisplayText]   = useState(comment.text);
  const [isEdited, setIsEdited]         = useState(comment.edited || false);
  const [isDeleted, setIsDeleted]       = useState(comment.deleted || false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isOwner =
    comment.pseudonym === currentPseudonym ||
    comment.author === currentUserId ||
    comment.author?.toString() === currentUserId;

  // Can delete: comment author OR the resharer (same rule as post author in CommentThread)
  const canDelete = isOwner || isRepostOwner;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, []);

  // Keep display text in sync with parent updates
  useEffect(() => {
    setDisplayText(comment.text);
    setIsEdited(comment.edited || false);
    setIsDeleted(comment.deleted || false);
  }, [comment.text, comment.edited, comment.deleted]);

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText.trim() === displayText) { setEditing(false); return; }
    setSavingEdit(true);
    try {
      await api.put(`/reposts/${repostId}/comments/${comment._id}`, { text: editText.trim() });
      setDisplayText(editText.trim());
      setIsEdited(true);
      if (onUpdated) onUpdated(comment._id, editText.trim());
      setEditing(false);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Could not update comment.");
    } finally { setSavingEdit(false); }
  };

  const handleDelete = () => {
    Alert.alert("Delete comment", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            const res = await api.delete(`/reposts/${repostId}/comments/${comment._id}`);
            setDisplayText("This comment was deleted.");
            setIsDeleted(true);
            if (onDeleted) onDeleted(comment._id, res.data.repostCommentCount);
          } catch (e) {
            Alert.alert("Error", "Could not delete comment.");
          }
        },
      },
    ]);
  };

  if (isDeleted && !displayText) return null;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={s.commentRow}>
        {/* Avatar */}
        <Avatar pseudonym={comment.pseudonym} size={30} />

        {/* Bubble — exact same shape as CommentThread */}
        <View style={[s.commentBubble, isDeleted && s.deletedBubble]}>
          <View style={s.commentHeader}>
            <Text style={s.commentPseudonym}>{comment.pseudonym}</Text>
            <Text style={s.commentTime}>{timeAgo(comment.createdAt)}</Text>
            {!isDeleted && (
              <TouchableOpacity
                style={s.dotsBtn}
                onPress={() => setShowOptions(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <DotsIcon size={14} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <View style={s.editWrap}>
              <TextInput
                style={s.editInput}
                value={editText}
                onChangeText={setEditText}
                multiline
                maxLength={500}
                autoFocus
                placeholderTextColor={C.textMuted}
              />
              <View style={s.editActions}>
                <TouchableOpacity
                  style={s.editCancelBtn}
                  onPress={() => { setEditing(false); setEditText(displayText); }}
                >
                  <Text style={s.editCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.editSaveBtn, savingEdit && { opacity: 0.6 }]}
                  onPress={handleSaveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.editSaveText}>Save</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={[s.commentText, isDeleted && s.deletedText]}>{displayText}</Text>
              {isEdited && !isDeleted && <Text style={s.editedLabel}>edited</Text>}
            </>
          )}
        </View>
      </View>

      {/* Options sheet — edit/delete/copy, same as CommentThread */}
      <OptionsModal
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        onEdit={() => setEditing(true)}
        onDelete={handleDelete}
        onCopy={() => copyToClipboard(displayText)}
        isDeleted={isDeleted}
        isOwner={canDelete}  // resharer can also delete any comment on their repost
      />
    </Animated.View>
  );
}

// ── Secondary comment input strip ─────────────────────────────────────────
function CommentInput({ onSubmit, submitting, currentPseudonym }) {
  const [text, setText] = useState("");
  return (
    <View style={s.inputRow}>
      <Avatar pseudonym={currentPseudonym} size={28} />
      <TextInput
        style={s.input}
        placeholder="Share your take on this repost…"
        placeholderTextColor={C.textMuted}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
      />
      <TouchableOpacity
        style={[s.sendBtn, (!text.trim() || submitting) && s.sendBtnDisabled]}
        onPress={() => { if (text.trim()) { onSubmit(text.trim()); setText(""); } }}
        disabled={!text.trim() || submitting}
      >
        {submitting
          ? <ActivityIndicator size={14} color="#fff" />
          : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <SendSmallIcon size={12} color="#fff" />
            </View>
          )
        }
      </TouchableOpacity>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RepostConfirmModal — exported, used by FeedScreen before creating a repost
// ══════════════════════════════════════════════════════════════════════════════
export function RepostConfirmModal({ visible, onConfirm, onCancel, thought, setThought, loading = false }) {
  const { isConnected } = useNetwork();
  const [showNoNetwork, setShowNoNetwork] = useState(false);

  const handleConfirm = () => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    onConfirm();
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={cm.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={{ flex: 1 }} onPress={onCancel} />
        <View style={cm.sheet}>
          <View style={cm.handle} />

          {/* Header */}
          <View style={cm.headerRow}>
            <MaterialCommunityIcons name="repeat-variant" size={22} color={C.accent} />
            <Text style={cm.title}>Share this story 💜</Text>
          </View>
          <Text style={cm.sub}>
            The original author is always credited. Your followers will see this in their feed.
          </Text>

          {/* Optional thought */}
          <TextInput
            style={cm.input}
            placeholder="Add your thoughts… (optional)"
            placeholderTextColor={C.textMuted}
            value={thought}
            onChangeText={setThought}
            multiline
            maxLength={300}
          />
          <Text style={cm.charCount}>{thought.length}/300</Text>

          {/* Actions */}
          <View style={cm.actions}>
            <TouchableOpacity
              style={[cm.btn, cm.cancelBtn, loading && { opacity: 0.4 }]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={cm.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cm.btn, cm.confirmBtn, loading && { opacity: 0.75 }]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size={16} color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="repeat-variant" size={16} color="#fff" />
                  <Text style={cm.confirmText}>Repost</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Network overlay inside the modal so it appears on top */}
        <NoNetworkOverlay
          visible={showNoNetwork}
          action="repost"
          onClose={() => setShowNoNetwork(false)}
          onRetry={() => setShowNoNetwork(false)}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const cm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: "#00000099", justifyContent: "flex-end" },
  sheet:      { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: C.border },
  handle:     { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  headerRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  title:      { color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 20 },
  sub:        { color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 16 },
  input:      { backgroundColor: C.cardDeep, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 14, minHeight: 72, textAlignVertical: "top" },
  charCount:  { color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "right", marginTop: 4, marginBottom: 20 },
  actions:    { flexDirection: "row", gap: 12 },
  btn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 12 },
  cancelBtn:  { backgroundColor: C.cardDeep, borderWidth: 1, borderColor: C.border },
  cancelText: { color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 14 },
  confirmBtn: { backgroundColor: C.accent },
  confirmText:{ color: "#fff", fontFamily: "Nunito_600SemiBold", fontSize: 14 },
});

// ══════════════════════════════════════════════════════════════════════════════
// RepostCard — main export
// ══════════════════════════════════════════════════════════════════════════════
export default function RepostCard({
  repostItem,
  onDeleted,
  onHidden,
  onEdited,
  onReposted,
  onUnreposted,
  currentUserId,
  currentPseudonym,
}) {
  const {
    repostId,
    reposterPseudonym,
    repostThought,
    repostCreatedAt,
    repostComments: initialComments = [],
    repostCommentCount: initialCount  = 0,
    originalPost,
  } = repostItem;

  const { socket }       = useSocket();
  const { isConnected }  = useNetwork();
  const spinner          = useSpinner();

  // ── Network overlay state ────────────────────────────────────────────────
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const [noNetworkAction, setNoNetworkAction] = useState("default");

  const checkNetwork = (action) => {
    if (!isConnected) {
      setNoNetworkAction(action);
      setShowNoNetwork(true);
      return false;
    }
    return true;
  };

  // ── Secondary comment state ──────────────────────────────────────────────
  const [comments, setComments]         = useState(initialComments);
  const [commentCount, setCommentCount] = useState(initialCount);
  const [commentOpen, setCommentOpen]   = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  // ── Collapse toggle ──────────────────────────────────────────────────────
  const [collapsed, setCollapsed] = useState(false);

  const isRepostOwner = currentPseudonym === reposterPseudonym;

  // ── Real-time: listen for secondary comments on this repost ───────────────
  useEffect(() => {
    if (!socket || !repostId) return;

    // Join the repost room so we receive live updates
    socket.emit("join_repost", repostId);

    const handleNewComment = (data) => {
      if (data.repostId !== repostId) return;
      setComments((prev) => {
        const exists = prev.some((c) => c._id === data.comment._id);
        if (exists) return prev;
        return [...prev, data.comment];
      });
      setCommentCount(data.repostCommentCount);
    };

    const handleUpdatedComment = (data) => {
      if (data.repostId !== repostId) return;
      setComments((prev) =>
        prev.map((c) =>
          c._id === data.commentId ? { ...c, text: data.text, edited: true } : c
        )
      );
    };

    socket.on("repost_comment_added",   handleNewComment);
    socket.on("repost_comment_updated", handleUpdatedComment);
    return () => {
      socket.off("repost_comment_added",   handleNewComment);
      socket.off("repost_comment_updated", handleUpdatedComment);
      socket.emit("leave_repost", repostId);
    };
  }, [socket, repostId]);

  // ── Submit secondary comment ─────────────────────────────────────────────
  const handleSubmitComment = async (text) => {
    if (!checkNetwork("comment")) return;
    setSubmitting(true);
    await spinner.withSpinner(async () => {
      try {
        const res = await api.post(`/reposts/${repostId}/comments`, { text });
        setComments((prev) => {
          const exists = prev.some((c) => c._id === res.data.comment._id);
          if (exists) return prev;
          return [...prev, res.data.comment];
        });
        setCommentCount(res.data.repostCommentCount);
      } catch (e) {
        Alert.alert("Error", e.response?.data?.message || "Could not add comment.");
      } finally {
        setSubmitting(false);
      }
    }, "Posting your take…");
  };

  // ── Comment updated ──────────────────────────────────────────────────────
  const handleCommentUpdated = (commentId, newText) => {
    setComments((prev) =>
      prev.map((c) => c._id === commentId ? { ...c, text: newText, edited: true } : c)
    );
  };

  // ── Comment deleted ──────────────────────────────────────────────────────
  const handleCommentDeleted = (commentId, newCount) => {
    setComments((prev) =>
      prev.map((c) =>
        c._id === commentId
          ? { ...c, text: "This comment was deleted.", deleted: true }
          : c
      )
    );
    if (newCount !== undefined) setCommentCount(newCount);
  };

  if (!originalPost) return null;

  return (
    <View style={s.wrapper}>

      {/* ── Resharer header ─────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Avatar pseudonym={reposterPseudonym} size={32} />
          <View style={s.headerMeta}>
            <View style={s.headerRow}>
              <MaterialCommunityIcons name="repeat-variant" size={14} color={C.accentSoft} />
              <Text style={s.headerLabel}>
                <Text style={s.reposterName}>{reposterPseudonym}</Text>
                {" shared a story"}
              </Text>
            </View>
            <Text style={s.headerTime}>{timeAgo(repostCreatedAt)}</Text>
          </View>
        </View>

        {/* Collapse toggle */}
        <TouchableOpacity
          onPress={() => setCollapsed((v) => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={collapsed ? "chevron-down" : "chevron-up"}
            size={16}
            color={C.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Resharer's thought */}
      {!!repostThought && !collapsed && (
        <View style={s.thoughtWrap}>
          <Text style={s.thoughtText}>"{repostThought}"</Text>
        </View>
      )}

      {/* ── Embedded original PostCard ───────────────────────────────────── */}
      {!collapsed && (
        <View style={s.postCardWrap}>
          <PostCard
            post={originalPost}
            isSaved={originalPost.isSaved}
            userReaction={originalPost.userReaction}
            hasReacted={originalPost.hasReacted}
            onDeleted={onDeleted}
            onHidden={onHidden}
            onEdited={onEdited}
            onReposted={onReposted}
            onUnreposted={onUnreposted}
            isInsideRepost
          />
        </View>
      )}

      {/* ── Secondary comment stream ──────────────────────────────────────── */}
      {!collapsed && (
        <View style={s.commentSection}>

          {/* Toggle bar */}
          <TouchableOpacity
            style={s.commentToggle}
            onPress={() => {
              if (!commentOpen && !checkNetwork("comment")) return;
              setCommentOpen((v) => !v);
            }}
            activeOpacity={0.7}
          >
            <View style={s.toggleLine} />
            <Ionicons
              name={commentOpen ? "chatbubble" : "chatbubble-outline"}
              size={13}
              color={commentOpen ? C.accent : C.textMuted}
            />
            <Text style={[s.commentToggleText, commentOpen && { color: C.accent }]}>
              {commentCount > 0
                ? `${commentCount} take${commentCount !== 1 ? "s" : ""} on this repost`
                : "Add your take on this repost"}
            </Text>
            <Ionicons
              name={commentOpen ? "chevron-up" : "chevron-down"}
              size={12}
              color={C.textMuted}
            />
          </TouchableOpacity>

          {commentOpen && (
            <View style={s.commentBody}>

              {/* Context note — so users know these go to resharer */}
              <View style={s.contextNote}>
                <Ionicons name="information-circle-outline" size={13} color={C.textMuted} />
                <Text style={s.contextNoteText}>
                  These takes go to{" "}
                  <Text style={{ color: C.accentSoft }}>{reposterPseudonym}</Text>
                  , not the original author.
                </Text>
              </View>

              {/* Comment list */}
              {comments.length > 0 && (
                <View style={s.commentList}>
                  {comments.map((c, i) => (
                    !c.deleted || c.text ? (
                      <RepostCommentRow
                        key={c._id || `rc-${i}`}
                        comment={c}
                        repostId={repostId}
                        currentUserId={currentUserId}
                        currentPseudonym={currentPseudonym}
                        isRepostOwner={isRepostOwner}
                        onUpdated={handleCommentUpdated}
                        onDeleted={handleCommentDeleted}
                      />
                    ) : null
                  ))}
                </View>
              )}

              {comments.length === 0 && (
                <Text style={s.noComments}>Be the first to share your take 💜</Text>
              )}

              {/* Input */}
              <CommentInput
                onSubmit={handleSubmitComment}
                submitting={submitting}
                currentPseudonym={currentPseudonym}
              />
            </View>
          )}
        </View>
      )}

      {/* ── Network + spinner overlays (same pattern as PostCard) ─────────── */}
      <NoNetworkOverlay
        visible={showNoNetwork}
        action={noNetworkAction}
        onClose={() => setShowNoNetwork(false)}
        onRetry={() => setShowNoNetwork(false)}
      />
      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />

    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // ── Card wrapper ──────────────────────────────────────────────────────────
  wrapper: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    overflow: "hidden",
  },

  // ── Resharer header ───────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerMeta: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerLabel: {
    color: C.textMuted,
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
  },
  reposterName: {
    color: C.accentSoft,
    fontFamily: "Nunito_600SemiBold",
  },
  headerTime: {
    color: C.textMuted,
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    marginTop: 1,
  },

  // ── Thought ───────────────────────────────────────────────────────────────
  thoughtWrap: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  thoughtText: {
    color: C.text,
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },

  // ── Embedded PostCard ─────────────────────────────────────────────────────
  postCardWrap: {
    marginHorizontal: 10,
    marginBottom: 4,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },

  // ── Comment section ───────────────────────────────────────────────────────
  commentSection: {
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  commentToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toggleLine: {
    height: 1,
    width: 16,
    backgroundColor: C.border,
  },
  commentToggleText: {
    color: C.textMuted,
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    flex: 1,
  },
  commentBody: {
    paddingBottom: 12,
  },
  contextNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.accentDim,
    marginHorizontal: 14,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.accent + "33",
  },
  contextNoteText: {
    color: C.textMuted,
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  commentList: {
    paddingHorizontal: 14,
    gap: 2,
  },
  noComments: {
    color: C.textMuted,
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  // ── Comment row (matches CommentThread bubble style) ──────────────────────
  commentRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 10,
  },
  avatar: {
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    backgroundColor: "#9B6FD422",
  },
  avatarText: {
    color: "#C4A3E8",
    fontFamily: "Nunito_600SemiBold",
  },
  commentBubble: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  deletedBubble: {
    borderColor: C.border,
    opacity: 0.55,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  commentPseudonym: {
    color: C.accentSoft,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
  },
  commentTime: {
    color: C.textMuted,
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    marginLeft: "auto",
  },
  dotsBtn: {
    marginLeft: "auto",
    paddingLeft: 6,
  },
  commentText: {
    color: C.text,
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 2,
  },
  deletedText: {
    color: C.textMuted,
    fontStyle: "italic",
  },
  editedLabel: {
    color: C.textMuted,
    fontFamily: "Nunito_400Regular",
    fontSize: 10,
    fontStyle: "italic",
    marginTop: 2,
  },

  // ── Edit inline (matches CommentThread) ───────────────────────────────────
  editWrap: { marginTop: 4 },
  editInput: {
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.accent + "55",
    padding: 10,
    color: C.text,
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    minHeight: 60,
    marginBottom: 8,
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  editCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  editCancelText: {
    color: C.textMuted,
    fontFamily: "Nunito_500Medium",
    fontSize: 12,
  },
  editSaveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: C.accent,
  },
  editSaveText: {
    color: "#fff",
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
  },

  // ── Comment input strip ────────────────────────────────────────────────────
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: C.cardDeep,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: C.text,
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    maxHeight: 90,
    textAlignVertical: "top",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: C.border,
  },

  // ── Options bottom-sheet (identical to CommentThread) ─────────────────────
  optionsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  optionsSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  optionItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  optionItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionItemText: {
    color: C.text,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 16,
  },
  optionDivider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 16,
  },
});