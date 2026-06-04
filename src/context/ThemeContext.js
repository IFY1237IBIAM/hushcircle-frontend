import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";

export const FONT_SIZES = {
  small: {
    base: 13, content: 14, title: 18, subtitle: 16, small: 11, label: 12, badge: 10,
  },
  medium: {
    base: 15, content: 16, title: 22, subtitle: 18, small: 13, label: 14, badge: 11,
  },
  large: {
    base: 17, content: 18, title: 26, subtitle: 21, small: 15, label: 16, badge: 13,
  },
};

const LIGHT_COLORS = {
  // Backgrounds — pure white page, very light lavender-tinted card surfaces
  bg:          "#F5F4F8",   // page background: soft off-white with a whisper of lavender
  card:        "#FFFFFF",   // card surface: pure white (matches the nav bar in the image)
  border:      "#E4E0EF",   // borders: light lavender-gray (subtle, not harsh)

  // Purple accent — unchanged, same as dark mode
  accent:      "#9B6FD4",
  accentSoft:  "#7B52B8",   // darker in light mode so it reads on white bg

  // Text
  text:        "#1A1530",   // near-black with purple tint (not pure black)
  textMuted:   "#7A6E95",   // muted purple-gray (matches the gray icons in the nav)

  // Semantic — unchanged
  error:       "#D4607A",
  success:     "#4CAF8F",
  warning:     "#D4A44C",
};

const DARK_COLORS = {
  bg:          "#0F0A1E",
  card:        "#1A1330",
  border:      "#2D2450",
  accent:      "#9B6FD4",
  accentSoft:  "#C4A3E8",
  text:        "#EDE8F5",
  textMuted:   "#8B7FA8",
  error:       "#D4607A",
  success:     "#4CAF8F",
  warning:     "#D4A44C",
};

const ThemeContext = createContext({
  fontSize: "medium",
  fs: FONT_SIZES.medium,
  setFontSize: () => {},
  theme: "dark",
  colors: DARK_COLORS,
  setTheme: () => {},
  blockedUserIds: [],
  setBlockedUserIds: () => {},
  addBlockedUser: () => {},
  removeBlockedUser: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [fontSize, setFontSizeState] = useState("medium");
  const [theme, setThemeState] = useState("dark");
  const [blockedUserIds, setBlockedUserIds] = useState([]);

  const colors = theme === "light" ? LIGHT_COLORS : DARK_COLORS;

  useEffect(() => {
    AsyncStorage.getItem("fontSize").then((stored) => {
      if (stored && FONT_SIZES[stored]) setFontSizeState(stored);
    });

    AsyncStorage.getItem("appTheme").then((stored) => {
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
      }
    });

    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      const res = await api.get("/settings/blocked-users");
      const ids = (res.data.blockedUsers || []).map((u) =>
        u._id?.toString() || u.toString()
      );
      setBlockedUserIds(ids);
    } catch (e) {}
  };

  const setFontSize = async (size) => {
    if (!FONT_SIZES[size]) return;
    setFontSizeState(size);
    await AsyncStorage.setItem("fontSize", size);
    try {
      await api.put("/settings", { fontSize: size });
    } catch (e) {}
  };

  const setTheme = async (newTheme) => {
    if (newTheme !== "dark" && newTheme !== "light") return;
    setThemeState(newTheme);
    await AsyncStorage.setItem("appTheme", newTheme);
    try {
      await api.put("/settings", { theme: newTheme });
    } catch (e) {}
  };

  const addBlockedUser = (userId) => {
    setBlockedUserIds((prev) => prev.includes(userId) ? prev : [...prev, userId]);
  };

  const removeBlockedUser = (userId) => {
    setBlockedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  return (
    <ThemeContext.Provider
      value={{
        fontSize,
        fs: FONT_SIZES[fontSize],
        setFontSize,
        theme,
        colors,
        setTheme,
        blockedUserIds,
        setBlockedUserIds,
        addBlockedUser,
        removeBlockedUser,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);