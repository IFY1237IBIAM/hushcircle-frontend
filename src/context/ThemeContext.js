/**
 * ThemeContext.js
 *
 * Provides:
 *   - isDark / toggleTheme  (persisted via AsyncStorage)
 *   - colors                (full dark or light palette — auto-switches)
 *   - fontSize / setFontSize
 *   - fs                    (font-scale helper)
 *   - blockedUserIds / addBlockedUser / removeBlockedUser
 *
 * DARK palette  → existing HushCircle deep-purple look
 * LIGHT palette → clean white with purple accents
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─────────────────────────────────────────────────────────────────────────────
// Palettes
// ─────────────────────────────────────────────────────────────────────────────

const DARK = {
  // Backgrounds
  bg:         "#0F0A1E",   // deep space purple-black
  card:       "#1A1330",   // card surface
  cardAlt:    "#201840",   // slightly lighter card (modals, inner cards)
  overlay:    "#0B0818",   // sheet overlays

  // Borders
  border:     "#2D2450",
  borderSoft: "#241E40",

  // Accent
  accent:      "#9B6FD4",
  accentSoft:  "#C4A3E8",
  accentMuted: "#6A4FA0",
  accentGlow:  "rgba(155,111,212,0.18)",

  // Text
  text:       "#EDE8F5",
  textMuted:  "#8B7FA8",
  textFaint:  "#5C5478",

  // Semantic
  success:    "#4CAF8F",
  error:      "#D4607A",
  warning:    "#D4A44C",

  // Nav / tab bar
  tabBar:     "#120E22",
  tabBarBorder:"#1E1840",

  // Inputs
  inputBg:    "#0F0A1E",

  // Status bar style
  statusBar:  "light-content",

  // Reaction / avatar tints (unchanged)
  avatarColors: ["#9B6FD4","#D4607A","#6B9FD4","#4CAF8F","#D4A44C","#E879F9"],
};

const LIGHT = {
  // Backgrounds
  bg:         "#F8F6FF",   // very soft lavender-white
  card:       "#FFFFFF",
  cardAlt:    "#F2EEFF",
  overlay:    "#EDE8F8",

  // Borders
  border:     "#E0D8F5",
  borderSoft: "#EDE8F5",

  // Accent — keep HushCircle purple identity
  accent:      "#7B52C7",   // slightly deeper so it pops on white
  accentSoft:  "#9B6FD4",
  accentMuted: "#B89EDF",
  accentGlow:  "rgba(123,82,199,0.10)",

  // Text
  text:       "#1A1330",   // dark purple-black for crisp legibility
  textMuted:  "#6B5F8A",
  textFaint:  "#A898C8",

  // Semantic
  success:    "#2E9C72",
  error:      "#C04060",
  warning:    "#B8862A",

  // Nav / tab bar
  tabBar:     "#FFFFFF",
  tabBarBorder:"#E8E0F8",

  // Inputs
  inputBg:    "#F2EEFF",

  // Status bar style
  statusBar:  "dark-content",

  // Reaction / avatar tints (slightly adjusted for light bg)
  avatarColors: ["#7B52C7","#C04060","#4A7FC4","#2E9C72","#B8862A","#C04EC8"],
};

// ─────────────────────────────────────────────────────────────────────────────
// Font scale
// ─────────────────────────────────────────────────────────────────────────────

const FONT_SCALE = { small: 0.9, medium: 1, large: 1.15 };

function buildFs(size) {
  const scale = FONT_SCALE[size] ?? 1;
  return (base) => Math.round(base * scale);
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────────────────────────────────────

const KEY_THEME    = "@hushcircle:theme";      // "dark" | "light"
const KEY_FONTSIZE = "@hushcircle:fontSize";   // "small" | "medium" | "large"
const KEY_BLOCKED  = "@hushcircle:blocked";    // JSON array of IDs

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark,    setIsDark]    = useState(true);
  const [fontSize,  setFontSizeS] = useState("medium");
  const [blockedUserIds, setBlockedUserIds] = useState([]);
  const [loaded,    setLoaded]    = useState(false);
  // ── CHANGE 1: track whether user has a locally saved theme preference ──
  const [hasLocalTheme, setHasLocalTheme] = useState(false);

  // ── Hydrate from storage ───────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [theme, size, blocked] = await Promise.all([
          AsyncStorage.getItem(KEY_THEME),
          AsyncStorage.getItem(KEY_FONTSIZE),
          AsyncStorage.getItem(KEY_BLOCKED),
        ]);
        if (theme)   setIsDark(theme === "dark");
        if (size)    setFontSizeS(size);
        if (blocked) setBlockedUserIds(JSON.parse(blocked));
        // ── CHANGE 2: mark whether a local preference already exists ──
        setHasLocalTheme(!!theme);
      } catch (e) {
        // Silently fall back to defaults
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const toggleTheme = useCallback(async () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(KEY_THEME, next ? "dark" : "light").catch(() => {});
      return next;
    });
    // ── CHANGE 3: user explicitly toggled, mark local preference as set ──
    setHasLocalTheme(true);
  }, []);

  // Also expose setTheme("dark"|"light") for external callers (e.g. server-synced setting)
  const setTheme = useCallback(async (value) => {
    const next = value === "dark";
    setIsDark(next);
    // ── CHANGE 4: mark local preference as set whenever setTheme is called ──
    setHasLocalTheme(true);
    await AsyncStorage.setItem(KEY_THEME, value).catch(() => {});
  }, []);

  const setFontSize = useCallback(async (size) => {
    setFontSizeS(size);
    await AsyncStorage.setItem(KEY_FONTSIZE, size).catch(() => {});
  }, []);

  const addBlockedUser = useCallback(async (userId) => {
    setBlockedUserIds((prev) => {
      if (prev.includes(userId)) return prev;
      const next = [...prev, userId];
      AsyncStorage.setItem(KEY_BLOCKED, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removeBlockedUser = useCallback(async (userId) => {
    setBlockedUserIds((prev) => {
      const next = prev.filter((id) => id !== userId);
      AsyncStorage.setItem(KEY_BLOCKED, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const colors = isDark ? DARK : LIGHT;
  const fs     = buildFs(fontSize);

  // Keep legacy `theme` string for any places that read it
  const theme  = isDark ? "dark" : "light";

  const value = {
    // Theme
    isDark,
    theme,
    toggleTheme,
    setTheme,
    colors,
    // ── CHANGE 5: expose hasLocalTheme so SettingsScreen can use it ──
    hasLocalTheme,

    // Font
    fontSize,
    setFontSize,
    fs,

    // Blocked
    blockedUserIds,
    addBlockedUser,
    removeBlockedUser,
  };

  // Don't render children until we've read storage (prevents flash)
  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

export { DARK, LIGHT };