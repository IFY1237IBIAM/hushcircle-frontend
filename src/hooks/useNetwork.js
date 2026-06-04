import { useState, useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";

export default function useNetwork() {
  const [isConnected, setIsConnected] = useState(true);
  const [isWeak, setIsWeak] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);
  const wasOffline = useRef(false);
  const initialized = useRef(false);

  useEffect(() => {
    // First check current state
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsConnected(connected ?? true);
      initialized.current = true;
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!initialized.current) return;

      const connected = state.isConnected && state.isInternetReachable !== false;
      const weak = connected && (
        state.type === "cellular" &&
        state.details?.cellularGeneration === "2g"
      );

      setIsWeak(weak || false);

      if (!connected) {
        wasOffline.current = true;
        setIsConnected(false);
        setJustReconnected(false);
      } else {
        setIsConnected(true);
        if (wasOffline.current) {
          wasOffline.current = false;
          setJustReconnected(true);
          setTimeout(() => setJustReconnected(false), 3000);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, isWeak, justReconnected };
}