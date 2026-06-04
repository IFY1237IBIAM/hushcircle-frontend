import { useState, useEffect } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function useAdminPopup() {
  const [popup, setPopup] = useState(null);
  const [visible, setVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    checkForPopup();
  }, [user]);

  const checkForPopup = async () => {
    try {
      const res = await api.get("/notifications/popup");
      if (res.data.popup) {
        setPopup(res.data.popup);
        setVisible(true);
      }
    } catch (e) {}
  };

  const dismiss = () => {
    setVisible(false);
    setPopup(null);
  };

  return { popup, visible, dismiss };
}