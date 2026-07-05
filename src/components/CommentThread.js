import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
  Animated, Modal, Clipboard,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import UserProfileCard from "./UserProfileCard";
import NoNetworkOverlay from "./NoNetworkOverlay";

// ── SVG Icons — receive color as prop ────────────────────────────────────

const DotsIcon       = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="5"  cy="12" r="1.5" fill={color} />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
    <Circle cx="19" cy="12" r="1.5" fill={color} />
  </Svg>
);
const CopyIcon       = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const EditIcon       = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const TrashIcon      = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ReplyIcon      = ({ size = 12, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="9 17 4 12 9 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20 18v-2a4 4 0 0 0-4-4H4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const ChevronDownIcon = ({ size = 12, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="6 9 12 15 18 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const PenIcon        = ({ size = 10, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 20h9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const SendSmallIcon  = ({ size = 12, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13"  stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 2L15 22l-4-9-9-4 20-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Exports ───────────────────────────────────────────────────────────────

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
  if (count < 1_000_000) { const v = count / 1000; return v >= 10 ? `${Math.floor(v)}k` : `${v.toFixed(1)}k`; }
  const v = count / 1_000_000;
  return v >= 10 ? `${Math.floor(v)}M` : `${v.toFixed(1)}M`;
};

const timeAgo = (date) => {
  if (!date) return "";
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const ONLINE_THRESHOLD_MS = 3 * 60 * 1000;

const getOnlineStatus = (showOnlineStatus, isOnline, lastSeen) => {
  if (!showOnlineStatus) return null;
  if (isOnline) return true;
  if (!lastSeen) return false;
  return (Date.now() - new Date(lastSeen).getTime()) < ONLINE_THRESHOLD_MS;
};

const copyToClipboard = (text) => { Clipboard.setString(text); Alert.alert("Copied", "Text copied to clipboard"); };

// ── Author badge — fixed gold color ───────────────────────────────────────

function AuthorBadge() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#D4A44C33", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: "#D4A44C66" }}>
      <PenIcon size={9} color="#D4A44C" />
      <Text style={{ color: "#D4A44C", fontFamily: "Nunito_600SemiBold", fontSize: 10 }}>Author</Text>
    </View>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────

function Avatar({ pseudonym, size = 34, showOnlineDot = false, isOnlineStatus = null }) {
  const { colors: C } = useTheme();
  return (
    <View style={{ position: "relative" }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, justifyContent: "center", alignItems: "center", flexShrink: 0, backgroundColor: C.accent + "22" }}>
        <Text style={{ color: C.accentSoft, fontFamily: "Nunito_600SemiBold", fontSize: size * 0.38 }}>
          {pseudonym?.[0]?.toUpperCase() || "?"}
        </Text>
      </View>
      {showOnlineDot && isOnlineStatus !== null && (
        <View style={{
          position: "absolute",
          width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15,
          backgroundColor: isOnlineStatus ? C.success : C.error,
          bottom: -1, right: -1,
          borderWidth: 2, borderColor: C.bg,
        }} />
      )}
    </View>
  );
}

// ── Reply input ───────────────────────────────────────────────────────────

function ReplyInput({ onSubmit, placeholder, onCancel, submitting }) {
  const { colors: C } = useTheme();
  const [text, setText] = useState("");
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.accent + "44" }}>
      <TextInput
        style={{ color: C.text, fontFamily: "Nunito_400Regular", fontSize: 14, minHeight: 40, maxHeight: 80 }}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={200}
        scrollEnabled={false}
        textAlignVertical="top"
        autoFocus
      />
      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <TouchableOpacity style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: C.border }} onPress={onCancel}>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 12 }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: C.accent, opacity: (!text.trim() || submitting) ? 0.4 : 1 }}
          onPress={() => { if (text.trim()) onSubmit(text.trim()); }}
          disabled={!text.trim() || submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <SendSmallIcon size={11} color="#fff" />
                <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 12 }}>Reply</Text>
              </View>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Options bottom-sheet ──────────────────────────────────────────────────

function OptionsModal({ visible, onClose, onEdit, onDelete, onCopy, isDeleted, isOwner }) {
  const { colors: C } = useTheme();
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }} onPress={onClose} activeOpacity={1}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, paddingTop: 8, borderTopWidth: 1, borderColor: C.border }}>
          {!isDeleted && (
            <TouchableOpacity style={{ paddingVertical: 16, paddingHorizontal: 24 }} onPress={() => { onClose(); onCopy(); }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <CopyIcon size={16} color={C.text} />
                <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 16 }}>Copy text</Text>
              </View>
            </TouchableOpacity>
          )}
          {isOwner && !isDeleted && (
            <>
              <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: 16 }} />
              <TouchableOpacity style={{ paddingVertical: 16, paddingHorizontal: 24 }} onPress={() => { onClose(); onEdit(); }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <EditIcon size={16} color={C.text} />
                  <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 16 }}>Edit</Text>
                </View>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: 16 }} />
              <TouchableOpacity style={{ paddingVertical: 16, paddingHorizontal: 24 }} onPress={() => { onClose(); onDelete(); }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <TrashIcon size={16} color={C.error} />
                  <Text style={{ color: C.error, fontFamily: "Nunito_600SemiBold", fontSize: 16 }}>Delete</Text>
                </View>
              </TouchableOpacity>
              <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: 16 }} />
            </>
          )}
          <TouchableOpacity style={{ paddingVertical: 16, paddingHorizontal: 24 }} onPress={onClose}>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 16, textAlign: "center" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Inline edit block ─────────────────────────────────────────────────────

function InlineEdit({ value, onChange, onSave, onCancel, saving, maxLength = 200 }) {
  const { colors: C } = useTheme();
  return (
    <View style={{ marginTop: 4 }}>
      <TextInput style={{ backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.accent + "55", padding: 10, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 13, minHeight: 60, marginBottom: 8 }} value={value} onChangeText={onChange} multiline maxLength={maxLength} autoFocus placeholderTextColor={C.textMuted} />
      <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
        <TouchableOpacity style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: C.border }} onPress={onCancel}>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 12 }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: C.accent, opacity: saving ? 0.6 : 1 }} onPress={onSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 12 }}>Save</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Reply item ────────────────────────────────────────────────────────────

function ReplyItem({ reply, postId, commentId, currentUserId, onReplyToReply, isLast, onReplyUpdated, onReplyDeleted }) {
  const { colors: C } = useTheme();
  const [showInput, setShowInput]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [editing, setEditing]       = useState(false);
  const [editText, setEditText]     = useState(reply.text);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showUserCard, setShowUserCard]         = useState(false);
  const [selectedPseudonym, setSelectedPseudonym] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isOwner  = reply.author === currentUserId || reply.author?._id === currentUserId || reply.author?.toString() === currentUserId;
  const isDeleted = reply.deleted;
  const replyOnlineStatus = getOnlineStatus(reply.showOnlineStatus, reply.isOnline, reply.lastSeen);

  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start(); }, []);

  const handleSubmit = async (text) => { setSubmitting(true); await onReplyToReply(text, reply.pseudonym); setSubmitting(false); setShowInput(false); };

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText.trim() === reply.text) { setEditing(false); return; }
    setSavingEdit(true);
    try {
      await api.put(`/posts/${postId}/comments/${commentId}/replies/${reply._id}`, { text: editText.trim() });
      onReplyUpdated(reply._id, editText.trim()); setEditing(false);
    } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not update reply."); }
    finally { setSavingEdit(false); }
  };

  const handleDelete = () => {
    Alert.alert("Delete reply", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await api.delete(`/posts/${postId}/comments/${commentId}/replies/${reply._id}`); onReplyDeleted(reply._id); }
        catch (e) { Alert.alert("Error", "Could not delete reply."); }
      }},
    ]);
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={{ flexDirection: "row", marginBottom: 8 }}>
        {/* Thread line */}
        <View style={{ width: 20, alignItems: "center", marginRight: 8 }}>
          <View style={{ width: 2, flex: 1, height: isLast ? 20 : undefined, backgroundColor: C.border, borderRadius: 1 }} />
          <View style={{ width: 10, height: 2, backgroundColor: C.border, alignSelf: "flex-start", marginTop: -2 }} />
        </View>
        <View style={{ flex: 1, flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
          <TouchableOpacity onPress={() => { setSelectedPseudonym(reply.pseudonym); setShowUserCard(true); }} activeOpacity={0.7}>
            <Avatar pseudonym={reply.pseudonym} size={26} showOnlineDot={reply.showOnlineStatus === true} isOnlineStatus={replyOnlineStatus} />
          </TouchableOpacity>
          <View style={{ flex: 1, backgroundColor: C.inputBg, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.border, opacity: isDeleted ? 0.55 : 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
              <Text style={{ color: C.accentSoft, fontFamily: "Nunito_600SemiBold", fontSize: 12 }}>{reply.pseudonym}</Text>
              {reply.isPostAuthor && !isDeleted && <AuthorBadge />}
              {reply.replyingTo && !isDeleted && (
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11 }}>
                  › <Text style={{ color: C.accent, fontFamily: "Nunito_600SemiBold" }}>{reply.replyingTo}</Text>
                </Text>
              )}
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, marginLeft: "auto" }}>{timeAgo(reply.createdAt)}</Text>
              {!isDeleted && (
                <TouchableOpacity style={{ marginLeft: "auto", paddingLeft: 6 }} onPress={() => setShowOptions(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <DotsIcon size={14} color={C.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {editing
              ? <InlineEdit value={editText} onChange={setEditText} onSave={handleSaveEdit} onCancel={() => { setEditing(false); setEditText(reply.text); }} saving={savingEdit} />
              : (
                <>
                  <Text style={{ color: isDeleted ? C.textMuted : C.text, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 18, marginBottom: 4, fontStyle: isDeleted ? "italic" : "normal" }}>{reply.text}</Text>
                  {reply.edited && !isDeleted && <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 10, marginBottom: 4, fontStyle: "italic" }}>edited</Text>}
                  {!isDeleted && (
                    <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }} onPress={() => setShowInput(!showInput)}>
                      {!showInput && <ReplyIcon size={11} color={C.accent} />}
                      <Text style={{ color: C.accent, fontFamily: "Nunito_600SemiBold", fontSize: 12 }}>{showInput ? "Cancel" : "Reply"}</Text>
                    </TouchableOpacity>
                  )}
                </>
              )
            }
          </View>
        </View>
      </View>

      {showInput && (
        <View style={{ paddingLeft: 64, marginTop: 4 }}>
          <ReplyInput placeholder={`Reply to ${reply.pseudonym}...`} onSubmit={handleSubmit} onCancel={() => setShowInput(false)} submitting={submitting} />
        </View>
      )}

      <OptionsModal visible={showOptions} onClose={() => setShowOptions(false)} onEdit={() => setEditing(true)} onDelete={handleDelete} onCopy={() => copyToClipboard(reply.text)} isDeleted={isDeleted} isOwner={isOwner} />
      <UserProfileCard pseudonym={selectedPseudonym} visible={showUserCard} onClose={() => { setShowUserCard(false); setSelectedPseudonym(null); }} />
    </Animated.View>
  );
}

// ── Main CommentThread ────────────────────────────────────────────────────

export default function CommentThread({ comment, postId, onReplyAdded, onCommentUpdated, onCommentDeleted }) {
  const { user }        = useAuth();
  const { isConnected } = useNetwork();
  const { socket }      = useSocket();
  const { colors: C }   = useTheme();                   // ← live theme colors

  const [replies, setReplies]           = useState(comment.replies || []);
  const [showReplies, setShowReplies]   = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [showAll, setShowAll]           = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const [showOptions, setShowOptions]   = useState(false);
  const [editing, setEditing]           = useState(false);
  const [editText, setEditText]         = useState(comment.text);
  const [savingEdit, setSavingEdit]     = useState(false);
  const [commentText, setCommentText]   = useState(comment.text);
  const [isEdited, setIsEdited]         = useState(comment.edited || false);
  const [isDeleted, setIsDeleted]       = useState(comment.deleted || false);
  const [showUserCard, setShowUserCard] = useState(false);
  const [selectedPseudonym, setSelectedPseudonym] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const currentUserId = user?.id || user?._id;
  const isOwner = comment.author === currentUserId || comment.author?._id === currentUserId || comment.author?.toString() === currentUserId;
  const commentOnlineStatus = getOnlineStatus(comment.showOnlineStatus, comment.isOnline, comment.lastSeen);
  const activeReplies   = replies.filter((r) => !r.deleted);
  const PREVIEW_COUNT   = 2;
  const visibleReplies  = showAll ? replies : replies.slice(0, PREVIEW_COUNT);
  const hiddenCount     = activeReplies.length - PREVIEW_COUNT;
  const totalReplies    = comment.repliesCount ?? activeReplies.length;

  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(); }, []);

  useEffect(() => {
    setReplies(comment.replies || []);
    setCommentText(comment.text);
    setIsEdited(comment.edited || false);
    setIsDeleted(comment.deleted || false);
  }, [comment.replies, comment.text, comment.edited, comment.deleted]);

  useEffect(() => {
    if (!socket || !postId) return;
    const handleReplyUpdated = (data) => { if (data.commentId !== comment._id) return; setReplies((prev) => prev.map((r) => r._id === data.replyId ? { ...r, text: data.text, edited: data.edited } : r)); };
    const handleReplyDeleted = (data) => { if (data.commentId !== comment._id) return; setReplies((prev) => prev.map((r) => r._id === data.replyId ? { ...r, text: "This reply was deleted.", deleted: true } : r)); };
    socket.on("reply_updated", handleReplyUpdated);
    socket.on("reply_deleted", handleReplyDeleted);
    return () => { socket.off("reply_updated", handleReplyUpdated); socket.off("reply_deleted", handleReplyDeleted); };
  }, [socket, postId, comment._id]);

  const handleAddReply = async (text, replyingTo = null) => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${postId}/comments/${comment._id}/replies`, { text, replyingTo });
      if (res.data.commentCount !== undefined && onReplyAdded) onReplyAdded(comment._id, res.data.reply);
      setShowReplies(true); setShowAll(true); setShowReplyInput(false);
    } catch (error) { Alert.alert("Error", error.response?.data?.message || "Could not add reply."); }
    finally { setSubmitting(false); }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText.trim() === commentText) { setEditing(false); return; }
    setSavingEdit(true);
    try {
      await api.put(`/posts/${postId}/comments/${comment._id}`, { text: editText.trim() });
      setCommentText(editText.trim()); setIsEdited(true);
      if (onCommentUpdated) onCommentUpdated(comment._id, editText.trim());
      setEditing(false);
    } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not update comment."); }
    finally { setSavingEdit(false); }
  };

  const handleDeleteComment = () => {
    Alert.alert("Delete comment", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await api.delete(`/posts/${postId}/comments/${comment._id}`);
          setCommentText("This comment was deleted."); setIsDeleted(true);
          if (onCommentDeleted) onCommentDeleted(comment._id);
        } catch (e) { Alert.alert("Error", "Could not delete comment."); }
      }},
    ]);
  };

  const handleReplyUpdated = (replyId, newText) => setReplies((prev) => prev.map((r) => r._id === replyId ? { ...r, text: newText, edited: true } : r));
  const handleReplyDeleted = (replyId) => setReplies((prev) => prev.map((r) => r._id === replyId ? { ...r, text: "This reply was deleted.", deleted: true } : r));

  const handleAvatarPress = (pseudonym) => {
    if (pseudonym === user?.pseudonym) return;
    setSelectedPseudonym(pseudonym); setShowUserCard(true);
  };

  if (isDeleted && activeReplies.length === 0) return null;

  return (
    <Animated.View style={{ marginBottom: 12, opacity: fadeAnim }}>
      {/* Main comment */}
      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
        <TouchableOpacity onPress={() => handleAvatarPress(comment.pseudonym)} activeOpacity={0.7}>
          <Avatar pseudonym={comment.pseudonym} size={34} showOnlineDot={comment.showOnlineStatus === true} isOnlineStatus={commentOnlineStatus} />
        </TouchableOpacity>
        <View style={{ flex: 1, backgroundColor: C.inputBg, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: C.border, opacity: isDeleted ? 0.55 : 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
            <Text style={{ color: C.accentSoft, fontFamily: "Nunito_600SemiBold", fontSize: 13 }}>{comment.pseudonym}</Text>
            {comment.isPostAuthor && !isDeleted && <AuthorBadge />}
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, marginLeft: "auto" }}>{timeAgo(comment.createdAt)}</Text>
            {!isDeleted && (
              <TouchableOpacity style={{ marginLeft: "auto", paddingLeft: 6 }} onPress={() => setShowOptions(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <DotsIcon size={14} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {editing
            ? <InlineEdit value={editText} onChange={setEditText} onSave={handleSaveEdit} onCancel={() => { setEditing(false); setEditText(commentText); }} saving={savingEdit} />
            : (
              <>
                <Text style={{ color: isDeleted ? C.textMuted : C.text, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 6, fontStyle: isDeleted ? "italic" : "normal" }}>{commentText}</Text>
                {isEdited && !isDeleted && <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 10, marginBottom: 4, fontStyle: "italic" }}>edited</Text>}
                {!isDeleted && (
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }} onPress={() => setShowReplyInput(!showReplyInput)}>
                    {!showReplyInput && <ReplyIcon size={11} color={C.accent} />}
                    <Text style={{ color: C.accent, fontFamily: "Nunito_600SemiBold", fontSize: 12 }}>{showReplyInput ? "Cancel" : "Reply"}</Text>
                  </TouchableOpacity>
                )}
              </>
            )
          }
        </View>
      </View>

      {/* Reply input */}
      {showReplyInput && (
        <View style={{ paddingLeft: 44, marginTop: 6 }}>
          <ReplyInput placeholder={`Reply to ${comment.pseudonym}...`} onSubmit={(text) => handleAddReply(text, comment.pseudonym)} onCancel={() => setShowReplyInput(false)} submitting={submitting} />
        </View>
      )}

      {/* Toggle replies */}
      {totalReplies > 0 && (
        <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 44, marginTop: 6, paddingVertical: 4 }} onPress={() => { setShowReplies(!showReplies); if (showReplies) setShowAll(false); }} activeOpacity={0.7}>
          <View style={{ height: 1, width: 24, backgroundColor: C.border }} />
          <Text style={{ color: C.accent, fontFamily: "Nunito_600SemiBold", fontSize: 12 }}>
            {showReplies ? "Hide replies" : `View ${formatCount(totalReplies)} ${totalReplies === 1 ? "reply" : "replies"}`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Replies list */}
      {showReplies && visibleReplies.length > 0 && (
        <View style={{ paddingLeft: 44, marginTop: 4 }}>
          {visibleReplies.map((reply, index) => (
            <ReplyItem
              key={reply._id ? `reply-${reply._id}` : `reply-${reply.pseudonym}-${reply.createdAt || "no-time"}-${index}`}
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
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 }} onPress={() => setShowAll(true)} activeOpacity={0.7}>
              <View style={{ height: 1, width: 16, backgroundColor: C.border }} />
              <Text style={{ color: C.accent, fontFamily: "Nunito_500Medium", fontSize: 12 }}>View {formatCount(hiddenCount)} more {hiddenCount === 1 ? "reply" : "replies"}</Text>
              <ChevronDownIcon size={12} color={C.accent} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <OptionsModal visible={showOptions} onClose={() => setShowOptions(false)} onEdit={() => setEditing(true)} onDelete={handleDeleteComment} onCopy={() => copyToClipboard(commentText)} isDeleted={isDeleted} isOwner={isOwner} />
      <NoNetworkOverlay visible={showNoNetwork} action="reply" onClose={() => setShowNoNetwork(false)} onRetry={() => setShowNoNetwork(false)} />
      <UserProfileCard pseudonym={selectedPseudonym} visible={showUserCard} onClose={() => { setShowUserCard(false); setSelectedPseudonym(null); }} />
    </Animated.View>
  );
}