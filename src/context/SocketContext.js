import { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, disconnectSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const initSocket = async () => {
      if (!user) {
        disconnectSocket();
        setSocket(null);
        setConnected(false);
        return;
      }

      const s = await connectSocket(user.id || user._id);

      if (!mounted) return;

      setSocket(s);

      // 🧠 prevent duplicate listeners
      s.off("connect");
      s.off("disconnect");

      s.on("connect", () => {
        if (mounted) setConnected(true);
        console.log("Socket connected:", s.id);
      });

      s.on("disconnect", () => {
        if (mounted) setConnected(false);
        console.log("Socket disconnected");
      });

      // initial state
      setConnected(s.connected);
    };

    initSocket();

    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);