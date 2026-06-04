import { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
  Animated, Modal, Clipboard,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkContext";
import { useSocket } from "../context/SocketContext";
import UserProfileCard from "./UserProfileCard";
import NoNetworkOverlay from "./NoNetworkOverlay";import { useTheme } from "../context/ThemeContext";

// Module-level color fallbacks for icon defaults (theme-aware colors used inside component)
const DARK = {
  accent: "#9B6FD4",
  text: "#EDE8F5",
  textMuted: "#8B7FA8",
  error: "#D4607A",
};



// ── SVG Icon Components ────────────────────────────────────────────────────

const DotsIcon = ({ size = 16, color = DARK.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="5" cy="12" r="1.5" fill={color} />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
    <Circle cx="19" cy="12" r="1.5" fill={color} />
  </Svg>
);

const CopyIcon = ({ size = 16, color = DARK.text }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="13" height="13" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EditIcon = ({ size = 16, color = DARK.text }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TrashIcon = ({ size = 16, color = DARK.error }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ReplyIcon = ({ size = 12, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="9 17 4 12 9 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20 18v-2a4 4 0 0 0-4-4H4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDownIcon = ({ size = 12, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="6 9 12 15 18 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PenIcon = ({ size = 10, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 20h9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SendSmallIcon = ({ size = 12, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 2L15 22l-4-9-9-4 20-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ──────────────────────────────────────────────────────────────────────────

export const getTotalCommentCount = (comments, serverCount) => {
  if (serverCount !== undefined && serverCount !== null) return serverCount;
  if (!comments || !Array.isArray(comments)) return 0;
  return comments.reduce((total, comment) => {
    if (comment.deleted) return total;
    const activeReplies = (comment.replies || []).filter((r) => !r.deleted).length;
    return total + 1 + activeReplies;
  }, 0);
};

export const formatCount = (count) => {
  if (count === null || count === undefined) return "0";
  if (count < 1000) return String(count);
  if (count < 1_000_000) {
    const value = count / 1000;
    return value >= 10 ? `${Math.floor(value)}k` : `${value.toFixed(1)}k`;
  }
  const value = count / 1_000_000;
  return value >= 10 ? `${Math.floor(value)}M` : `${value.toFixed(1)}M`;
};


const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

const getOnlineStatus = (
  showOnlineStatus,
  isOnline,
  lastSeen
) => {
  if (!showOnlineStatus) return null; // don't show dot

  // live socket status from backend
  if (isOnline) return true;

  // fallback to lastSeen
  if (!lastSeen) return false;

  return (
    Date.now() - new Date(lastSeen).getTime()
  ) < ONLINE_THRESHOLD_MS;
};

const copyToClipboard = (text) => {
  Clipboard.setString(text);
  Alert.alert("Copied", "Text copied to clipboard");
};

// ── Author badge ───────────────────────────────────────────────────────────

function AuthorBadge() {
  return (
    <View style={styles.authorBadge}>
      <PenIcon size={9} color="#D4A44C" />
      <Text style={styles.authorBadgeText}>Author</Text>
    </View>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ pseudonym, size = 34, showOnlineDot = false, isOnlineStatus = null }) {
  return (
    <View style={{ position: "relative" }}>
      <View style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 }
      ]}>
        <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>
          {pseudonym?.[0]?.toUpperCase() || "?"}
        </Text>
      </View>
      {showOnlineDot && isOnlineStatus !== null && (
        <View style={[
          styles.onlineDot,
          {
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: size * 0.15,
            backgroundColor: isOnlineStatus ? "#4CAF8F" : "#D4607A",
            bottom: -1,
            right: -1,
          }
        ]} />
      )}
    </View>
  );
}

// ── Reply input ────────────────────────────────────────────────────────────

function ReplyInput({ onSubmit, placeholder, onCancel, submitting }) {
  const [text, setText] = useState("");
  return (
    <View style={styles.replyInputWrap}>
      <TextInput
        style={styles.replyInput}
        placeholder={placeholder}
        placeholderTextColor={DARK.textMuted}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={200}
        scrollEnabled={false}
        textAlignVertical="top"
        autoFocus
      />
      <View style={styles.replyInputActions}>
        <TouchableOpacity style={styles.cancelReplyBtn} onPress={onCancel}>
          <Text style={styles.cancelReplyText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendReplyBtn, (!text.trim() || submitting) && styles.sendBtnDisabled]}
          onPress={() => { if (text.trim()) onSubmit(text.trim()); }}
          disabled={!text.trim() || submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : (
              <View style={styles.sendReplyBtnInner}>
                <SendSmallIcon size={11} color="#fff" />
                <Text style={styles.sendReplyText}>Reply</Text>
              </View>
            )
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Options bottom-sheet ───────────────────────────────────────────────────

function OptionsModal({ visible, onClose, onEdit, onDelete, onCopy, isDeleted, isOwner }) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.optionsOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.optionsSheet}>
          {!isDeleted && (
            <TouchableOpacity style={styles.optionItem} onPress={() => { onClose(); onCopy(); }}>
              <View style={styles.optionItemRow}>
                <CopyIcon size={16} color={DARK.text} />
                <Text style={styles.optionItemText}>Copy text</Text>
              </View>
            </TouchableOpacity>
          )}
          {!isDeleted && isOwner && <View style={styles.optionDivider} />}
          {isOwner && !isDeleted && (
            <>
              <TouchableOpacity style={styles.optionItem} onPress={() => { onClose(); onEdit(); }}>
                <View style={styles.optionItemRow}>
                  <EditIcon size={16} color={DARK.text} />
                  <Text style={styles.optionItemText}>Edit</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.optionDivider} />
              <TouchableOpacity style={styles.optionItem} onPress={() => { onClose(); onDelete(); }}>
                <View style={styles.optionItemRow}>
                  <TrashIcon size={16} color={DARK.error} />
                  <Text style={[styles.optionItemText, { color: DARK.error }]}>Delete</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.optionDivider} />
            </>
          )}
          <TouchableOpacity style={styles.optionItem} onPress={onClose}>
            <Text style={[styles.optionItemText, { color: DARK.textMuted, textAlign: "center" }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Reply item ─────────────────────────────────────────────────────────────

function ReplyItem({
  reply, postId, commentId, currentUserId,
  onReplyToReply, isLast, onReplyUpdated, onReplyDeleted,
}) {
  const [showInput, setShowInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.text);
  const [savingEdit, setSavingEdit] = useState(false);

  // User profile card
  const [showUserCard, setShowUserCard] = useState(false);
  const [selectedPseudonym, setSelectedPseudonym] = useState(null);

  const handleAvatarPress = (pseudonym) => {
    setSelectedPseudonym(pseudonym);
    setShowUserCard(true);
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isOwner =
    reply.author === currentUserId ||
    reply.author?._id === currentUserId ||
    reply.author?.toString() === currentUserId;

  const isDeleted = reply.deleted;

  const replyOnlineStatus = getOnlineStatus(
  reply.showOnlineStatus,
  reply.isOnline,
  reply.lastSeen
);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, []);

  const handleSubmit = async (text) => {
    setSubmitting(true);
    await onReplyToReply(text, reply.pseudonym);
    setSubmitting(false);
    setShowInput(false);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText.trim() === reply.text) { setEditing(false); return; }
    setSavingEdit(true);
    try {
      await api.put(`/posts/${postId}/comments/${commentId}/replies/${reply._id}`, { text: editText.trim() });
      onReplyUpdated(reply._id, editText.trim());
      setEditing(false);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Could not update reply.");
    } finally { setSavingEdit(false); }
  };

  const handleDelete = () => {
    Alert.alert("Delete reply", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/posts/${postId}/comments/${commentId}/replies/${reply._id}`);
            onReplyDeleted(reply._id);
          } catch (e) { Alert.alert("Error", "Could not delete reply."); }
        },
      },
    ]);
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.replyRow}>
        <View style={styles.threadLineWrap}>
          <View style={[styles.threadLine, isLast && { height: 20 }]} />
          <View style={styles.threadConnector} />
        </View>
        <View style={styles.replyContentWrap}>
          <TouchableOpacity
            onPress={() => handleAvatarPress(reply.pseudonym)}
            activeOpacity={0.7}
          >
            <Avatar
              pseudonym={reply.pseudonym}
              size={26}
              showOnlineDot={reply.showOnlineStatus === true}
              isOnlineStatus={replyOnlineStatus}
            />
          </TouchableOpacity>
          <View style={[styles.replyBubble, isDeleted && styles.deletedBubble]}>
            <View style={styles.replyHeader}>
              <Text style={styles.replyPseudonym}>{reply.pseudonym}</Text>
              {reply.isPostAuthor && !isDeleted && <AuthorBadge />}
              {reply.replyingTo && !isDeleted && (
                <Text style={styles.replyingToText}>
                  › <Text style={styles.replyingToName}>{reply.replyingTo}</Text>
                </Text>
              )}
              <Text style={styles.replyTime}>{timeAgo(reply.createdAt)}</Text>
              {!isDeleted && (
                <TouchableOpacity
                  style={styles.dotsBtn}
                  onPress={() => setShowOptions(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <DotsIcon size={14} color={DARK.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {editing ? (
              <View style={styles.editWrap}>
                <TextInput
                  style={styles.editInput}
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  maxLength={200}
                  autoFocus
                  placeholderTextColor={DARK.textMuted}
                />
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.editCancelBtn} onPress={() => { setEditing(false); setEditText(reply.text); }}>
                    <Text style={styles.editCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.editSaveBtn, savingEdit && { opacity: 0.6 }]} onPress={handleSaveEdit} disabled={savingEdit}>
                    {savingEdit ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.editSaveText}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={[styles.replyText, isDeleted && styles.deletedText]}>{reply.text}</Text>
                {reply.edited && !isDeleted && <Text style={styles.editedLabel}>edited</Text>}
                {!isDeleted && (
                  <TouchableOpacity style={styles.replyBtnRow} onPress={() => setShowInput(!showInput)}>
                    {!showInput && <ReplyIcon size={11} color={DARK.accent} />}
                    <Text style={styles.replyBtn}>{showInput ? "Cancel" : "Reply"}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </View>

      {showInput && (
        <View style={styles.nestedReplyInput}>
          <ReplyInput
            placeholder={`Reply to ${reply.pseudonym}...`}
            onSubmit={handleSubmit}
            onCancel={() => setShowInput(false)}
            submitting={submitting}
          />
        </View>
      )}

      <OptionsModal
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        onEdit={() => setEditing(true)}
        onDelete={handleDelete}
        onCopy={() => copyToClipboard(reply.text)}
        isDeleted={isDeleted}
        isOwner={isOwner}
      />

      <UserProfileCard
        pseudonym={selectedPseudonym}
        visible={showUserCard}
        onClose={() => { setShowUserCard(false); setSelectedPseudonym(null); }}
      />
    </Animated.View>
  );
}

// ── Main CommentThread ─────────────────────────────────────────────────────

export default function CommentThread({
  comment, postId, onReplyAdded,
  onCommentUpdated, onCommentDeleted,
}) {
  const { colors: COLORS } = useTheme();
  const { user } = useAuth();
  const { isConnected } = useNetwork();
  const { socket } = useSocket();

  const [replies, setReplies] = useState(comment.replies || []);
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [savingEdit, setSavingEdit] = useState(false);
  const [commentText, setCommentText] = useState(comment.text);
  const [isEdited, setIsEdited] = useState(comment.edited || false);
  const [isDeleted, setIsDeleted] = useState(comment.deleted || false);

  // User profile card
  const [showUserCard, setShowUserCard] = useState(false);
  const [selectedPseudonym, setSelectedPseudonym] = useState(null);

  const handleAvatarPress = (pseudonym) => {
    const isMe = pseudonym === user?.pseudonym;
    if (isMe) return; // don't show profile card for own avatar

    setSelectedPseudonym(pseudonym);
    setShowUserCard(true);
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const currentUserId = user?.id || user?._id;

  const isOwner =
  comment.author === currentUserId ||
  comment.author?._id === currentUserId ||
  comment.author?.toString() === currentUserId;

  const commentOnlineStatus = getOnlineStatus(
    comment.showOnlineStatus,
    comment.isOnline,
    comment.lastSeen
  );

  const activeReplies = replies.filter((r) => !r.deleted);
  const PREVIEW_COUNT = 2;
  const visibleReplies = showAll ? replies : replies.slice(0, PREVIEW_COUNT);
  const hiddenCount = activeReplies.length - PREVIEW_COUNT;
  const totalReplies = comment.repliesCount ?? activeReplies.length;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    setReplies(comment.replies || []);
    setCommentText(comment.text);
    setIsEdited(comment.edited || false);
    setIsDeleted(comment.deleted || false);
  }, [comment.replies, comment.text, comment.edited, comment.deleted]);

  useEffect(() => {
    if (!socket || !postId) return;
    const handleReplyUpdated = (data) => {
      if (data.commentId !== comment._id) return;
      setReplies((prev) => prev.map((r) => r._id === data.replyId ? { ...r, text: data.text, edited: data.edited } : r));
    };
    const handleReplyDeleted = (data) => {
      if (data.commentId !== comment._id) return;
      setReplies((prev) => prev.map((r) => r._id === data.replyId ? { ...r, text: "This reply was deleted.", deleted: true } : r));
    };
    socket.on("reply_updated", handleReplyUpdated);
    socket.on("reply_deleted", handleReplyDeleted);
    return () => {
      socket.off("reply_updated", handleReplyUpdated);
      socket.off("reply_deleted", handleReplyDeleted);
    };
  }, [socket, postId, comment._id]);

  const handleAddReply = async (text, replyingTo = null) => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    setSubmitting(true);
    try {
      const res = await api.post(
        `/posts/${postId}/comments/${comment._id}/replies`,
        { text, replyingTo }
      );
      if (res.data.commentCount !== undefined && onReplyAdded) {
        onReplyAdded(comment._id, res.data.reply);
      }
      setShowReplies(true);
      setShowAll(true);
      setShowReplyInput(false);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Could not add reply.");
    } finally { setSubmitting(false); }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText.trim() === commentText) { setEditing(false); return; }
    setSavingEdit(true);
    try {
      await api.put(`/posts/${postId}/comments/${comment._id}`, { text: editText.trim() });
      setCommentText(editText.trim());
      setIsEdited(true);
      if (onCommentUpdated) onCommentUpdated(comment._id, editText.trim());
      setEditing(false);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Could not update comment.");
    } finally { setSavingEdit(false); }
  };

  const handleDeleteComment = () => {
    Alert.alert("Delete comment", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/posts/${postId}/comments/${comment._id}`);
            setCommentText("This comment was deleted.");
            setIsDeleted(true);
            if (onCommentDeleted) onCommentDeleted(comment._id);
          } catch (e) { Alert.alert("Error", "Could not delete comment."); }
        },
      },
    ]);
  };

  const handleReplyUpdated = (replyId, newText) => {
    setReplies((prev) => prev.map((r) => r._id === replyId ? { ...r, text: newText, edited: true } : r));
  };

  const handleReplyDeleted = (replyId) => {
    setReplies((prev) => prev.map((r) => r._id === replyId ? { ...r, text: "This reply was deleted.", deleted: true } : r));
  };

  if (isDeleted && activeReplies.length === 0) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Main comment */}
      <View style={styles.commentRow}>
        <TouchableOpacity
          onPress={() => handleAvatarPress(comment.pseudonym)}
          activeOpacity={0.7}
        >
          <Avatar
            pseudonym={comment.pseudonym}
            size={34}
            showOnlineDot={comment.showOnlineStatus === true}
            isOnlineStatus={commentOnlineStatus}
          />
        </TouchableOpacity>
        <View style={[styles.commentBubble, isDeleted && styles.deletedBubble]}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentPseudonym}>{comment.pseudonym}</Text>
            {comment.isPostAuthor && !isDeleted && <AuthorBadge />}
            <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
            {!isDeleted && (
              <TouchableOpacity
                style={styles.dotsBtn}
                onPress={() => setShowOptions(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <DotsIcon size={14} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <View style={styles.editWrap}>
              <TextInput
                style={styles.editInput}
                value={editText}
                onChangeText={setEditText}
                multiline
                maxLength={200}
                autoFocus
                placeholderTextColor={COLORS.textMuted}
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.editCancelBtn} onPress={() => { setEditing(false); setEditText(commentText); }}>
                  <Text style={styles.editCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editSaveBtn, savingEdit && { opacity: 0.6 }]} onPress={handleSaveEdit} disabled={savingEdit}>
                  {savingEdit ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.editSaveText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={[styles.commentText, isDeleted && styles.deletedText]}>{commentText}</Text>
              {isEdited && !isDeleted && <Text style={styles.editedLabel}>edited</Text>}
              {!isDeleted && (
                <TouchableOpacity style={styles.replyBtnRow} onPress={() => setShowReplyInput(!showReplyInput)}>
                  {!showReplyInput && <ReplyIcon size={11} color={COLORS.accent} />}
                  <Text style={styles.replyBtn}>{showReplyInput ? "Cancel" : "Reply"}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      {/* Reply input */}
      {showReplyInput && (
        <View style={styles.commentReplyInput}>
          <ReplyInput
            placeholder={`Reply to ${comment.pseudonym}...`}
            onSubmit={(text) => handleAddReply(text, comment.pseudonym)}
            onCancel={() => setShowReplyInput(false)}
            submitting={submitting}
          />
        </View>
      )}

      {/* Toggle replies */}
      {totalReplies > 0 && (
        <TouchableOpacity
          style={styles.toggleRepliesBtn}
          onPress={() => { setShowReplies(!showReplies); if (showReplies) setShowAll(false); }}
          activeOpacity={0.7}
        >
          <View style={styles.toggleLine} />
          <Text style={styles.toggleText}>
            {showReplies
              ? "Hide replies"
              : `View ${formatCount(totalReplies)} ${totalReplies === 1 ? "reply" : "replies"}`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Replies list */}
      {showReplies && visibleReplies.length > 0 && (
        <View style={styles.repliesList}>
          {visibleReplies.map((reply, index) => (
            <ReplyItem
              key={
                reply._id
                  ? `reply-${reply._id}`
                  : `reply-${reply.pseudonym}-${reply.createdAt || "no-time"}-${index}`
              }
              reply={reply}
              postId={postId}
              commentId={comment._id}
              currentUserId={currentUserId}
              isLast={index === visibleReplies.length - 1 && hiddenCount <= 0}
              onReplyToReply={(text, replyingTo) => handleAddReply(text, replyingTo)}
              onReplyUpdated={handleReplyUpdated}
              onReplyDeleted={handleReplyDeleted}
            />
          ))}

          {hiddenCount > 0 && !showAll && (
            <TouchableOpacity
              style={styles.viewMoreBtn}
              onPress={() => setShowAll(true)}
              activeOpacity={0.7}
            >
              <View style={styles.viewMoreLine} />
              <Text style={styles.viewMoreText}>
                View {formatCount(hiddenCount)} more {hiddenCount === 1 ? "reply" : "replies"}
              </Text>
              <ChevronDownIcon size={12} color={COLORS.accent} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <OptionsModal
        visible={showOptions}
        onClose={() => setShowOptions(false)}
        onEdit={() => setEditing(true)}
        onDelete={handleDeleteComment}
        onCopy={() => copyToClipboard(commentText)}
        isDeleted={isDeleted}
        isOwner={isOwner}
      />

      <NoNetworkOverlay
        visible={showNoNetwork}
        action="reply"
        onClose={() => setShowNoNetwork(false)}
        onRetry={() => setShowNoNetwork(false)}
      />

      {/* User profile card — opens on avatar tap */}
      <UserProfileCard
        pseudonym={selectedPseudonym}
        visible={showUserCard}
        onClose={() => { setShowUserCard(false); setSelectedPseudonym(null); }}
      />
    </Animated.View>
  );
}


  const styles = StyleSheet.create({

  container: { marginBottom: 12 },


  commentRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },

  avatar: { justifyContent: "center", alignItems: "center", flexShrink: 0, backgroundColor: "#9B6FD422" },

  avatarText: { color: "#C4A3E8", fontFamily: "Nunito_600SemiBold" },

  commentBubble: { flex: 1, backgroundColor: "#0F0A1E", borderRadius: 14, padding: 10, borderWidth: 1, borderColor: "#2D2450" },

  deletedBubble: { borderColor: "#2D2450", opacity: 0.55 },

  commentHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" },

  commentPseudonym: { color: "#C4A3E8", fontFamily: "Nunito_600SemiBold", fontSize: 13 },

  commentTime: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 11, marginLeft: "auto" },

  commentText: { color: "#EDE8F5", fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 6 },

  deletedText: { color: "#8B7FA8", fontStyle: "italic" },

  editedLabel: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 10, marginBottom: 4, fontStyle: "italic" },


  authorBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#D4A44C33", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: "#D4A44C66" },

  authorBadgeText: { color: "#D4A44C", fontFamily: "Nunito_600SemiBold", fontSize: 10 },


  dotsBtn: { marginLeft: "auto", paddingLeft: 6 },


  replyBtnRow: { flexDirection: "row", alignItems: "center", gap: 4 },

  replyBtn: { color: "#9B6FD4", fontFamily: "Nunito_600SemiBold", fontSize: 12 },


  editWrap: { marginTop: 4 },

  editInput: { backgroundColor: "#1A1330", borderRadius: 10, borderWidth: 1, borderColor: "#9B6FD4" + "55", padding: 10, color: "#EDE8F5", fontFamily: "Nunito_400Regular", fontSize: 13, minHeight: 60, marginBottom: 8 },

  editActions: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },

  editCancelBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: "#2D2450" },

  editCancelText: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 12 },

  editSaveBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "#9B6FD4" },

  editSaveText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 12 },


  commentReplyInput: { paddingLeft: 44, marginTop: 6 },

  nestedReplyInput: { paddingLeft: 64, marginTop: 4 },

  replyInputWrap: { backgroundColor: "#1A1330", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#9B6FD4" + "44" },

  replyInput: { color: "#EDE8F5", fontFamily: "Nunito_400Regular", fontSize: 14, minHeight: 40, maxHeight: 80 },

  replyInputActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 },

  cancelReplyBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#2D2450" },

  cancelReplyText: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 12 },

  sendReplyBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "#9B6FD4" },

  sendReplyBtnInner: { flexDirection: "row", alignItems: "center", gap: 5 },

  sendBtnDisabled: { opacity: 0.4 },

  sendReplyText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 12 },


  toggleRepliesBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 44, marginTop: 6, paddingVertical: 4 },

  toggleLine: { height: 1, width: 24, backgroundColor: "#2D2450" },

  toggleText: { color: "#9B6FD4", fontFamily: "Nunito_600SemiBold", fontSize: 12 },


  repliesList: { paddingLeft: 44, marginTop: 4 },

  replyRow: { flexDirection: "row", marginBottom: 8 },

  threadLineWrap: { width: 20, alignItems: "center", marginRight: 8 },

  threadLine: { width: 2, flex: 1, backgroundColor: "#2D2450", borderRadius: 1 },

  threadConnector: { width: 10, height: 2, backgroundColor: "#2D2450", alignSelf: "flex-start", marginTop: -2 },

  replyContentWrap: { flex: 1, flexDirection: "row", gap: 8, alignItems: "flex-start" },

  replyBubble: { flex: 1, backgroundColor: "#0F0A1E", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#2D2450" },

  replyHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" },

  replyPseudonym: { color: "#C4A3E8", fontFamily: "Nunito_600SemiBold", fontSize: 12 },

  replyingToText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 11 },

  replyingToName: { color: "#9B6FD4", fontFamily: "Nunito_600SemiBold" },

  replyTime: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 11, marginLeft: "auto" },

  replyText: { color: "#EDE8F5", fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 18, marginBottom: 4 },


  viewMoreBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },

  viewMoreLine: { height: 1, width: 16, backgroundColor: "#2D2450" },

  viewMoreText: { color: "#9B6FD4", fontFamily: "Nunito_500Medium", fontSize: 12 },


  optionsOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },

  optionsSheet: { backgroundColor: "#1A1330", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, paddingTop: 8, borderTopWidth: 1, borderColor: "#2D2450" },

  optionItem: { paddingVertical: 16, paddingHorizontal: 24 },

  optionItemRow: { flexDirection: "row", alignItems: "center", gap: 12 },

  optionItemText: { color: "#EDE8F5", fontFamily: "Nunito_600SemiBold", fontSize: 16 },

  optionDivider: { height: 1, backgroundColor: "#2D2450", marginHorizontal: 16 },

  onlineDot: {

  position: "absolute",

  borderWidth: 2,

  borderColor: "#0F0A1E",

  },

  });

