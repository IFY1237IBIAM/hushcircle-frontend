/**
 * RepostCard.js — fully themed via useTheme()
 *
 * The hardcoded `C` design-token object has been replaced with
 * `const { colors: C } = useTheme()` inside each component that needs it.
 * Everything else is identical to the original.
 */

import { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
  Animated, Modal, Pressable,
  KeyboardAvoidingView, Platform, Clipboard,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect } from "react-native-svg";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useNetwork } from "../context/NetworkContext";
import { useTheme } from "../context/ThemeContext";
import NoNetworkOverlay from "./NoNetworkOverlay";
import HushCircleSpinner from "./HushCircleSpinner";
import useSpinner from "../hooks/useSpinner";
import PostCard from "./PostCard";

// ── Helpers ───────────────────────────────────────────────────────────────

const timeAgo = (date) => {
  if (!date) return "";
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const copyToClipboard = (text) => {
  Clipboard.setString(text);
  Alert.alert("Copied", "Text copied to clipboard");
};

// ── SVG Icons — receive color as prop ────────────────────────────────────

const DotsIcon     = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="5"  cy="12" r="1.5" fill={color} />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
    <Circle cx="19" cy="12" r="1.5" fill={color} />
  </Svg>
);
const CopyIcon     = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const EditIcon     = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const TrashIcon    = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const SendSmallIcon = ({ size = 12, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13"  stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 2L15 22l-4-9-9-4 20-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Options bottom-sheet ──────────────────────────────────────────────────

function OptionsModal({ visible, onClose, onEdit, onDelete, onCopy, isDeleted, isOwner }) {
  const { colors: C } = useTheme();
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        onPress={onClose} activeOpacity={1}
      >
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

// ── Avatar ────────────────────────────────────────────────────────────────

function Avatar({ pseudonym, size = 30 }) {
  const { colors: C } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, justifyContent: "center", alignItems: "center", flexShrink: 0, backgroundColor: C.accent + "22" }}>
      <Text style={{ fontSize: size * 0.38, color: C.accentSoft, fontFamily: "Nunito_600SemiBold" }}>
        {pseudonym?.[0]?.toUpperCase() || "?"}
      </Text>
    </View>
  );
}

// ── Single secondary comment row ──────────────────────────────────────────

function RepostCommentRow({ comment, repostId, currentUserId, currentPseudonym, isRepostOwner, onUpdated, onDeleted }) {
  const { colors: C } = useTheme();
  const [showOptions, setShowOptions] = useState(false);
  const [editing, setEditing]         = useState(false);
  const [editText, setEditText]       = useState(comment.text);
  const [savingEdit, setSavingEdit]   = useState(false);
  const [displayText, setDisplayText] = useState(comment.text);
  const [isEdited, setIsEdited]       = useState(comment.edited || false);
  const [isDeleted, setIsDeleted]     = useState(comment.deleted || false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isOwner  = comment.pseudonym === currentPseudonym || comment.author === currentUserId || comment.author?.toString() === currentUserId;
  const canDelete = isOwner || isRepostOwner;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, []);

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
      setDisplayText(editText.trim()); setIsEdited(true);
      if (onUpdated) onUpdated(comment._id, editText.trim());
      setEditing(false);
    } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not update comment."); }
    finally { setSavingEdit(false); }
  };

  const handleDelete = () => {
    Alert.alert("Delete comment", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const res = await api.delete(`/reposts/${repostId}/comments/${comment._id}`);
          setDisplayText("This comment was deleted."); setIsDeleted(true);
          if (onDeleted) onDeleted(comment._id, res.data.repostCommentCount);
        } catch (e) { Alert.alert("Error", "Could not delete comment."); }
      }},
    ]);
  };

  if (isDeleted && !displayText) return null;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
        <Avatar pseudonym={comment.pseudonym} size={30} />
        <View style={{ flex: 1, backgroundColor: C.inputBg, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: C.border, opacity: isDeleted ? 0.55 : 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
            <Text style={{ color: C.accentSoft, fontFamily: "Nunito_600SemiBold", fontSize: 13 }}>{comment.pseudonym}</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, marginLeft: "auto" }}>{timeAgo(comment.createdAt)}</Text>
            {!isDeleted && (
              <TouchableOpacity style={{ marginLeft: "auto", paddingLeft: 6 }} onPress={() => setShowOptions(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <DotsIcon size={14} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          {editing ? (
            <View style={{ marginTop: 4 }}>
              <TextInput style={{ backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.accent + "55", padding: 10, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 13, minHeight: 60, marginBottom: 8 }} value={editText} onChangeText={setEditText} multiline maxLength={500} autoFocus placeholderTextColor={C.textMuted} />
              <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
                <TouchableOpacity style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: C.border }} onPress={() => { setEditing(false); setEditText(displayText); }}>
                  <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 12 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: C.accent, opacity: savingEdit ? 0.6 : 1 }} onPress={handleSaveEdit} disabled={savingEdit}>
                  {savingEdit ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 12 }}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={{ color: isDeleted ? C.textMuted : C.text, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 2, fontStyle: isDeleted ? "italic" : "normal" }}>{displayText}</Text>
              {isEdited && !isDeleted && <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 10, fontStyle: "italic", marginTop: 2 }}>edited</Text>}
            </>
          )}
        </View>
      </View>
      <OptionsModal visible={showOptions} onClose={() => setShowOptions(false)} onEdit={() => setEditing(true)} onDelete={handleDelete} onCopy={() => copyToClipboard(displayText)} isDeleted={isDeleted} isOwner={canDelete} />
    </Animated.View>
  );
}

// ── Comment input strip ───────────────────────────────────────────────────

function CommentInput({ onSubmit, submitting, currentPseudonym }) {
  const { colors: C } = useTheme();
  const [text, setText] = useState("");
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 14, paddingTop: 8 }}>
      <Avatar pseudonym={currentPseudonym} size={28} />
      <TextInput
        style={{ flex: 1, backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 8, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 13, maxHeight: 90, textAlignVertical: "top" }}
        placeholder="Share your take on this repost…"
        placeholderTextColor={C.textMuted}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
      />
      <TouchableOpacity
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: (!text.trim() || submitting) ? C.border : C.accent, justifyContent: "center", alignItems: "center", marginBottom: 2 }}
        onPress={() => { if (text.trim()) { onSubmit(text.trim()); setText(""); } }}
        disabled={!text.trim() || submitting}
      >
        {submitting ? <ActivityIndicator size={14} color="#fff" /> : <SendSmallIcon size={12} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RepostConfirmModal — exported, used by FeedScreen
// ══════════════════════════════════════════════════════════════════════════════

export function RepostConfirmModal({ visible, onConfirm, onCancel, thought, setThought, loading = false }) {
  const { colors: C } = useTheme();
  const { isConnected } = useNetwork();
  const [showNoNetwork, setShowNoNetwork] = useState(false);

  const handleConfirm = () => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onCancel}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#00000099", justifyContent: "flex-end" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={{ flex: 1 }} onPress={onCancel} />
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: C.border }}>
          <View style={{ width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 }} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <MaterialCommunityIcons name="repeat-variant" size={22} color={C.accent} />
            <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 20 }}>Share this story 💜</Text>
          </View>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
            The original author is always credited. Your followers will see this in their feed.
          </Text>
          <TextInput
            style={{ backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 14, minHeight: 72, textAlignVertical: "top" }}
            placeholder="Add your thoughts… (optional)"
            placeholderTextColor={C.textMuted}
            value={thought}
            onChangeText={setThought}
            multiline
            maxLength={300}
          />
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "right", marginTop: 4, marginBottom: 20 }}>{thought.length}/300</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border, opacity: loading ? 0.4 : 1 }} onPress={onCancel} disabled={loading}>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: C.accent, opacity: loading ? 0.75 : 1 }} onPress={handleConfirm} disabled={loading}>
              {loading
                ? <ActivityIndicator size={16} color="#fff" />
                : <>
                    <MaterialCommunityIcons name="repeat-variant" size={16} color="#fff" />
                    <Text style={{ color: "#fff", fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>Repost</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>
        <NoNetworkOverlay visible={showNoNetwork} action="repost" onClose={() => setShowNoNetwork(false)} onRetry={() => setShowNoNetwork(false)} />
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RepostCard — main export
// ══════════════════════════════════════════════════════════════════════════════

export default function RepostCard({ repostItem, onDeleted, onHidden, onEdited, onReposted, onUnreposted, currentUserId, currentPseudonym }) {
  const { colors: C } = useTheme();                     // ← live theme colors
  const {
    repostId, reposterPseudonym, repostThought,
    repostCreatedAt, repostComments: initialComments = [],
    repostCommentCount: initialCount = 0, originalPost,
  } = repostItem;

  const { socket }      = useSocket();
  const { isConnected } = useNetwork();
  const spinner         = useSpinner();

  const [showNoNetwork, setShowNoNetwork]   = useState(false);
  const [noNetworkAction, setNoNetworkAction] = useState("default");
  const checkNetwork = (action) => { if (!isConnected) { setNoNetworkAction(action); setShowNoNetwork(true); return false; } return true; };

  const [comments, setComments]         = useState(initialComments);
  const [commentCount, setCommentCount] = useState(initialCount);
  const [commentOpen, setCommentOpen]   = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [collapsed, setCollapsed]       = useState(false);

  const isRepostOwner = currentPseudonym === reposterPseudonym;

  useEffect(() => {
    if (!socket || !repostId) return;
    socket.emit("join_repost", repostId);

    const handleNewComment = (data) => {
      if (data.repostId !== repostId) return;
      setComments((prev) => { const exists = prev.some((c) => c._id === data.comment._id); if (exists) return prev; return [...prev, data.comment]; });
      setCommentCount(data.repostCommentCount);
    };
    const handleUpdatedComment = (data) => {
      if (data.repostId !== repostId) return;
      setComments((prev) => prev.map((c) => c._id === data.commentId ? { ...c, text: data.text, edited: true } : c));
    };

    socket.on("repost_comment_added",   handleNewComment);
    socket.on("repost_comment_updated", handleUpdatedComment);
    return () => {
      socket.off("repost_comment_added",   handleNewComment);
      socket.off("repost_comment_updated", handleUpdatedComment);
      socket.emit("leave_repost", repostId);
    };
  }, [socket, repostId]);

  const handleSubmitComment = async (text) => {
    if (!checkNetwork("comment")) return;
    setSubmitting(true);
    await spinner.withSpinner(async () => {
      try {
        const res = await api.post(`/reposts/${repostId}/comments`, { text });
        setComments((prev) => { const exists = prev.some((c) => c._id === res.data.comment._id); if (exists) return prev; return [...prev, res.data.comment]; });
        setCommentCount(res.data.repostCommentCount);
      } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not add comment."); }
      finally { setSubmitting(false); }
    }, "Posting your take…");
  };

  const handleCommentUpdated = (commentId, newText) => setComments((prev) => prev.map((c) => c._id === commentId ? { ...c, text: newText, edited: true } : c));
  const handleCommentDeleted = (commentId, newCount) => {
    setComments((prev) => prev.map((c) => c._id === commentId ? { ...c, text: "This comment was deleted.", deleted: true } : c));
    if (newCount !== undefined) setCommentCount(newCount);
  };

  if (!originalPost) return null;

  return (
    <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12, overflow: "hidden" }}>

      {/* Resharer header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          <Avatar pseudonym={reposterPseudonym} size={32} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MaterialCommunityIcons name="repeat-variant" size={14} color={C.accentSoft} />
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13 }}>
                <Text style={{ color: C.accentSoft, fontFamily: "Nunito_600SemiBold" }}>{reposterPseudonym}</Text>
                {" shared a story"}
              </Text>
            </View>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, marginTop: 1 }}>{timeAgo(repostCreatedAt)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setCollapsed((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={collapsed ? "chevron-down" : "chevron-up"} size={16} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Resharer's thought */}
      {!!repostThought && !collapsed && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
          <Text style={{ color: C.text, fontFamily: "Nunito_400Regular", fontSize: 14, lineHeight: 22, fontStyle: "italic" }}>"{repostThought}"</Text>
        </View>
      )}

      {/* Embedded PostCard */}
      {!collapsed && (
        <View style={{ marginHorizontal: 10, marginBottom: 4, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: C.border }}>
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

      {/* Secondary comment stream */}
      {!collapsed && (
        <View style={{ borderTopWidth: 1, borderTopColor: C.border }}>

          {/* Toggle bar */}
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10 }}
            onPress={() => { if (!commentOpen && !checkNetwork("comment")) return; setCommentOpen((v) => !v); }}
            activeOpacity={0.7}
          >
            <View style={{ height: 1, width: 16, backgroundColor: C.border }} />
            <Ionicons name={commentOpen ? "chatbubble" : "chatbubble-outline"} size={13} color={commentOpen ? C.accent : C.textMuted} />
            <Text style={{ color: commentOpen ? C.accent : C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, flex: 1 }}>
              {commentCount > 0 ? `${commentCount} take${commentCount !== 1 ? "s" : ""} on this repost` : "Add your take on this repost"}
            </Text>
            <Ionicons name={commentOpen ? "chevron-up" : "chevron-down"} size={12} color={C.textMuted} />
          </TouchableOpacity>

          {commentOpen && (
            <View style={{ paddingBottom: 12 }}>
              {/* Context note */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.accentGlow, marginHorizontal: 14, marginBottom: 12, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: C.accent + "33" }}>
                <Ionicons name="information-circle-outline" size={13} color={C.textMuted} />
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, lineHeight: 16, flex: 1 }}>
                  These takes go to{" "}
                  <Text style={{ color: C.accentSoft }}>{reposterPseudonym}</Text>
                  , not the original author.
                </Text>
              </View>

              {/* Comment list */}
              {comments.length > 0 && (
                <View style={{ paddingHorizontal: 14, gap: 2 }}>
                  {comments.map((c, i) =>
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
                  )}
                </View>
              )}

              {comments.length === 0 && (
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", paddingVertical: 10, paddingHorizontal: 14 }}>
                  Be the first to share your take 💜
                </Text>
              )}

              <CommentInput onSubmit={handleSubmitComment} submitting={submitting} currentPseudonym={currentPseudonym} />
            </View>
          )}
        </View>
      )}

      <NoNetworkOverlay visible={showNoNetwork} action={noNetworkAction} onClose={() => setShowNoNetwork(false)} onRetry={() => setShowNoNetwork(false)} />
      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
    </View>
  );
}