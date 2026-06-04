/**
 * useChatTheme.js
 *
 * Persists chat theme + wallpaper per user per group in AsyncStorage.
 * Key format: `chat_theme_{userId}_{groupId}`
 *
 * Returns:
 *   theme        — current theme object
 *   wallpaper    — current wallpaper object (null = none)
 *   setTheme     — (themeKey) => void
 *   setWallpaper — (wallpaperObj | null) => void
 *   loaded       — boolean, false until AsyncStorage read completes
 */

import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Built-in themes ────────────────────────────────────────────────────────
export const CHAT_THEMES = [
  {
    key: "default",
    label: "Midnight",
    preview: ["#0F0A1E", "#2A1F4A", "#1A1330"],
    colors: {
      bg:         "#0F0A1E",
      card:       "#1A1330",
      border:     "#2D2450",
      myBubble:   "#2A1F4A",
      theirBubble:"#1A1330",
      replyBg:    "#13102B",
      accent:     "#9B6FD4",
      accentSoft: "#C4A3E8",
      text:       "#EDE8F5",
      textMuted:  "#8B7FA8",
      headerBg:   "#0F0A1E",
    },
  },
  {
    key: "rose",
    label: "Rose Dusk",
    preview: ["#1A0E14", "#3D1A2A", "#2A1020"],
    colors: {
      bg:         "#1A0E14",
      card:       "#2A1020",
      border:     "#4D2238",
      myBubble:   "#3D1A2A",
      theirBubble:"#2A1020",
      replyBg:    "#1F0D18",
      accent:     "#D46FA0",
      accentSoft: "#E8A3C4",
      text:       "#F5E8EE",
      textMuted:  "#A87F90",
      headerBg:   "#1A0E14",
    },
  },
  {
    key: "ocean",
    label: "Deep Ocean",
    preview: ["#0A141E", "#0F2A3D", "#0A1E2A"],
    colors: {
      bg:         "#0A141E",
      card:       "#0A1E2A",
      border:     "#1A3A50",
      myBubble:   "#0F2A3D",
      theirBubble:"#0A1E2A",
      replyBg:    "#08161F",
      accent:     "#4A9FD4",
      accentSoft: "#8AC8E8",
      text:       "#E8F2F8",
      textMuted:  "#6A9FB0",
      headerBg:   "#0A141E",
    },
  },
  {
    key: "forest",
    label: "Forest",
    preview: ["#0A180E", "#142A1A", "#0E2014"],
    colors: {
      bg:         "#0A180E",
      card:       "#0E2014",
      border:     "#1A3D22",
      myBubble:   "#142A1A",
      theirBubble:"#0E2014",
      replyBg:    "#0A1A0E",
      accent:     "#4CAF8F",
      accentSoft: "#8AD4B8",
      text:       "#E8F5EE",
      textMuted:  "#6AA880",
      headerBg:   "#0A180E",
    },
  },
  {
    key: "ember",
    label: "Ember",
    preview: ["#1A0E08", "#2A1A0A", "#1E1208"],
    colors: {
      bg:         "#1A0E08",
      card:       "#1E1208",
      border:     "#3D2410",
      myBubble:   "#2A1A0A",
      theirBubble:"#1E1208",
      replyBg:    "#150E06",
      accent:     "#D4824A",
      accentSoft: "#E8B08C",
      text:       "#F5EEE8",
      textMuted:  "#A87A5A",
      headerBg:   "#1A0E08",
    },
  },
  {
    key: "slate",
    label: "Slate",
    preview: ["#0E1218", "#141C26", "#101620"],
    colors: {
      bg:         "#0E1218",
      card:       "#101620",
      border:     "#1E2A38",
      myBubble:   "#141C26",
      theirBubble:"#101620",
      replyBg:    "#0C1018",
      accent:     "#6A8FD4",
      accentSoft: "#A0B8E8",
      text:       "#E8EEF5",
      textMuted:  "#6A7A90",
      headerBg:   "#0E1218",
    },
  },
  {
    key: "lavender",
    label: "Lavender Mist",
    preview: ["#120E1A", "#1E1430", "#160E22"],
    colors: {
      bg:         "#120E1A",
      card:       "#160E22",
      border:     "#2E2050",
      myBubble:   "#1E1430",
      theirBubble:"#160E22",
      replyBg:    "#100C18",
      accent:     "#A06FD4",
      accentSoft: "#C8A8E8",
      text:       "#EEE8F5",
      textMuted:  "#907AA8",
      headerBg:   "#120E1A",
    },
  },
  {
    key: "light",
    label: "Cloud",
    preview: ["#F0EEF8", "#E8E0F8", "#FAFAF8"],
    colors: {
      bg:         "#F0EEF8",
      card:       "#FAFAF8",
      border:     "#D8D0EE",
      myBubble:   "#9B6FD4",
      theirBubble:"#FFFFFF",
      replyBg:    "#EAE6F8",
      accent:     "#7B4FB4",
      accentSoft: "#9B6FD4",
      text:       "#1A1030",
      textMuted:  "#6A5A88",
      headerBg:   "#FFFFFF",
    },
  },
];

// ── Built-in wallpapers (gradient/pattern descriptions rendered in JS) ─────
export const PRESET_WALLPAPERS = [
  { key: "none",     label: "None",        type: "none" },
  {
    key: "stars",    label: "Starfield",   type: "pattern",
    dots: { color: "#9B6FD4", opacity: 0.18, size: 1.5, spacing: 18 },
  },
  {
    key: "grid",     label: "Grid",        type: "pattern",
    grid: { color: "#9B6FD4", opacity: 0.10, spacing: 24 },
  },
  {
    key: "bubbles",  label: "Bubbles",     type: "circles",
    circles: { color: "#9B6FD4", opacity: 0.08 },
  },
  {
    key: "waves",    label: "Waves",       type: "waves",
    waves: { color: "#4A9FD4", opacity: 0.10 },
  },
  {
    key: "heartbeat",label: "Heartbeat",   type: "heartbeat",
    line: { color: "#D46FA0", opacity: 0.18 },
  },
];

const getStorageKey = (userId, groupId) =>
  `chat_theme_${userId}_${groupId}`;

export function useChatTheme(userId, groupId) {
  const [themeKey, setThemeKeyState]   = useState("default");
  const [wallpaper, setWallpaperState] = useState(null);
  const [loaded, setLoaded]            = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    if (!userId || !groupId) { setLoaded(true); return; }
    const key = getStorageKey(userId, groupId);
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw) {
          try {
            const saved = JSON.parse(raw);
            if (saved.themeKey) setThemeKeyState(saved.themeKey);
            if (saved.wallpaper !== undefined) setWallpaperState(saved.wallpaper);
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [userId, groupId]);

  const persist = useCallback(async (nextThemeKey, nextWallpaper) => {
    if (!userId || !groupId) return;
    const key = getStorageKey(userId, groupId);
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        themeKey: nextThemeKey,
        wallpaper: nextWallpaper,
      }));
    } catch {}
  }, [userId, groupId]);

  const setTheme = useCallback((key) => {
    setThemeKeyState(key);
    // Read current wallpaper state directly
    setWallpaperState((currentWallpaper) => {
      persist(key, currentWallpaper);
      return currentWallpaper;
    });
  }, [persist]);

  const setWallpaper = useCallback((wp) => {
    setWallpaperState(wp);
    setThemeKeyState((currentThemeKey) => {
      persist(currentThemeKey, wp);
      return currentThemeKey;
    });
  }, [persist]);

  const theme = CHAT_THEMES.find((t) => t.key === themeKey) || CHAT_THEMES[0];

  return { theme, wallpaper, setTheme, setWallpaper, loaded };
}