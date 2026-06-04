import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_URL = "https://wecare-backend-anxl.onrender.com";

let socket = null;

export const getSocket = () => socket;

export const connectSocket = async (userId) => {
  if (socket?.connected) return socket;

  const token = await AsyncStorage.getItem("token");

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 10000,

    // ✅ NEW: send JWT to backend
    auth: {
      token,
      userId, // optional (you can still keep it)
    },
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket.id);

    // optional fallback (you can remove later if backend uses JWT)
    if (userId) {
      socket.emit("identify", userId);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.log("🔌 Socket error:", error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("🔌 Socket manually disconnected");
  }
};

// ================= ROOM HELPERS =================

export const joinPostRoom = (postId) => {
  if (socket?.connected && postId) {
    socket.emit("join_post", postId);
  }
};

export const leavePostRoom = (postId) => {
  if (socket?.connected && postId) {
    socket.emit("leave_post", postId);
  }
};

export const joinGroupRoom = (groupId) => {
  if (socket?.connected && groupId) {
    socket.emit("join_group", groupId);
  }
};

export const leaveGroupRoom = (groupId) => {
  if (socket?.connected && groupId) {
    socket.emit("leave_group", groupId);
  }
};