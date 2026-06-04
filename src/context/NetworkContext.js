import { createContext, useContext, useState, useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";

const NetworkContext = createContext({ isConnected: true, justReconnected: false });

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);
  const wasOffline = useRef(false);
  const initialized = useRef(false);

  useEffect(() => {
    NetInfo.fetch().then((state) => {
      const connected = !!(state.isConnected && state.isInternetReachable !== false);
      setIsConnected(connected);
      initialized.current = true;
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!initialized.current) return;
      const connected = !!(state.isConnected && state.isInternetReachable !== false);

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

  return (
    <NetworkContext.Provider value={{ isConnected, justReconnected }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);