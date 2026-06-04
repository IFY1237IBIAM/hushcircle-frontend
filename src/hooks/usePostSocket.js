import { useEffect, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { joinPostRoom, leavePostRoom } from "../services/socket";

export default function usePostSocket(postId, { onReaction, onComment, onReply } = {}) {
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!postId || !connected) return;

    // Join this post's room
    joinPostRoom(postId);

    // Listen for real-time reaction updates
    const handleReaction = (data) => {
      if (data.postId === postId && onReaction) {
        onReaction(data);
      }
    };

    // Listen for new comments
    const handleComment = (data) => {
      if (data.postId === postId && onComment) {
        onComment(data);
      }
    };

    // Listen for new replies
    const handleReply = (data) => {
      if (data.postId === postId && onReply) {
        onReply(data);
      }
    };

    socket?.on("reaction_updated", handleReaction);
    socket?.on("comment_added", handleComment);
    socket?.on("reply_added", handleReply);

    return () => {
      leavePostRoom(postId);
      socket?.off("reaction_updated", handleReaction);
      socket?.off("comment_added", handleComment);
      socket?.off("reply_added", handleReply);
    };
  }, [postId, connected, socket]);
}