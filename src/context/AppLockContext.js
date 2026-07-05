/**
 * context/AppLockContext.js
 *
 * App Lock settings are stored PER USER using their user ID in the key.
 * This prevents account A's lock settings from bleeding into account B
 * when switching accounts on the same device.
 *
 * Storage keys:
 *   hush_applock_enabled_{userId}
 *   hush_applock_delay_{userId}
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { AppState }             from "react-native";
import AsyncStorage             from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuth }              from "./AuthContext";

// ── Context with safe defaults ────────────────────────────────────────────────

const AppLockContext = createContext({
  isLocked:         false,
  isEnabled:        false,
  lockDelay:        "immediately",
  isAuthenticating: false,
  authFailed:       false,
  isReady:          false,
  authenticate:     async () => {},
  enableAppLock:    async () => {},
  disableAppLock:   async () => {},
  updateLockDelay:  async () => {},
  lockNow:          () => {},
  unlockSilently:   () => {},
});

// ── Delay map ─────────────────────────────────────────────────────────────────

const DELAY_MS = {
  immediately:  0,
  "1min":       1  * 60 * 1000,
  "5min":       5  * 60 * 1000,
  "30min":      30 * 60 * 1000,
};

// ── Per-user storage keys ─────────────────────────────────────────────────────

function enabledKey(userId) { return `hush_applock_enabled_${userId}`; }
function delayKey(userId)   { return `hush_applock_delay_${userId}`; }

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppLockProvider({ children }) {
  const { user } = useAuth();
  const userId   = user?._id || user?.id || null;

  const [isLocked,         setIsLocked]         = useState(false);
  const [isEnabled,        setIsEnabled]        = useState(false);
  const [lockDelay,        setLockDelay]        = useState("immediately");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authFailed,       setAuthFailed]       = useState(false);
  const [isReady,          setIsReady]          = useState(false);

  const backgroundedAt  = useRef(null);
  const appStateRef     = useRef(AppState.currentState);
  const currentUserId   = useRef(null); // track user changes

  // ── Load settings whenever userId changes ──────────────────────────────────
  // This is the core fix — runs fresh for every account that logs in

  useEffect(() => {
    let mounted = true;

    // User logged out — clear lock state entirely
    if (!userId) {
      setIsEnabled(false);
      setLockDelay("immediately");
      setIsLocked(false);
      setAuthFailed(false);
      setIsReady(true);
      currentUserId.current = null;
      return;
    }

    // Same user — don't reload (avoid flicker on re-renders)
    if (currentUserId.current === userId) return;

    // New user logged in — reset everything and load their settings
    setIsReady(false);
    setIsLocked(false);
    setAuthFailed(false);
    currentUserId.current = userId;

    ;(async () => {
      try {
        const [enabled, delay] = await Promise.all([
          AsyncStorage.getItem(enabledKey(userId)),
          AsyncStorage.getItem(delayKey(userId)),
        ]);
        if (!mounted) return;
        setIsEnabled(enabled === "true");
        setLockDelay(delay || "immediately");
      } catch (e) {
        console.log("AppLock load error:", e.message);
      } finally {
        if (mounted) setIsReady(true);
      }
    })();

    return () => { mounted = false; };
  }, [userId]);

  // ── AppState watcher ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!isReady) return;

    const sub = AppState.addEventListener("change", (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      // Going to background — record the time
      if (nextState === "background") {
        backgroundedAt.current = Date.now();
        return;
      }

      // Coming back to foreground
      if (nextState === "active" && prev === "background") {
        if (!isEnabled) return;

        const elapsed  = backgroundedAt.current
          ? Date.now() - backgroundedAt.current
          : Infinity;
        const required = DELAY_MS[lockDelay] ?? 0;

        if (elapsed >= required) {
          setIsLocked(true);
          setAuthFailed(false);
        }

        backgroundedAt.current = null;
      }
    });

    return () => sub.remove();
  }, [isReady, isEnabled, lockDelay]);

  // ── Authenticate ───────────────────────────────────────────────────────────

  const authenticate = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setAuthFailed(false);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:         "Unlock HushCircle",
        fallbackLabel:         "Use device PIN",
        cancelLabel:           "Cancel",
        disableDeviceFallback: false,
      });
      if (result.success) {
        setIsLocked(false);
        setAuthFailed(false);
      } else {
        setAuthFailed(true);
      }
    } catch (e) {
      console.log("AppLock auth error:", e.message);
      setAuthFailed(true);
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating]);

  // ── Enable ─────────────────────────────────────────────────────────────────

  const enableAppLock = useCallback(async (delay = "immediately") => {
    if (!userId) return;
    try {
      await AsyncStorage.setItem(enabledKey(userId), "true");
      await AsyncStorage.setItem(delayKey(userId), delay);
      setIsEnabled(true);
      setLockDelay(delay);
    } catch (e) {
      console.log("AppLock enable error:", e.message);
    }
  }, [userId]);

  // ── Disable ────────────────────────────────────────────────────────────────

  const disableAppLock = useCallback(async () => {
    if (!userId) return;
    try {
      await AsyncStorage.setItem(enabledKey(userId), "false");
      await AsyncStorage.setItem(delayKey(userId), "immediately");
      setIsEnabled(false);
      setLockDelay("immediately");
      setIsLocked(false);
      setAuthFailed(false);
    } catch (e) {
      console.log("AppLock disable error:", e.message);
    }
  }, [userId]);

  // ── Update delay ───────────────────────────────────────────────────────────

  const updateLockDelay = useCallback(async (delay) => {
    if (!userId) return;
    try {
      await AsyncStorage.setItem(delayKey(userId), delay);
      setLockDelay(delay);
    } catch (e) {
      console.log("AppLock delay error:", e.message);
    }
  }, [userId]);

  // ── Lock now ───────────────────────────────────────────────────────────────

  const lockNow = useCallback(() => {
    if (isEnabled) {
      setIsLocked(true);
      setAuthFailed(false);
    }
  }, [isEnabled]);

  // ── Unlock silently (after fresh login — user already authenticated) ───────

  const unlockSilently = useCallback(() => {
    setIsLocked(false);
    setAuthFailed(false);
    backgroundedAt.current = null;
  }, []);

  // ── Value ──────────────────────────────────────────────────────────────────

  const value = {
    isLocked,
    isEnabled,
    lockDelay,
    isAuthenticating,
    authFailed,
    isReady,
    authenticate,
    enableAppLock,
    disableAppLock,
    updateLockDelay,
    lockNow,
    unlockSilently,
  };

  return (
    <AppLockContext.Provider value={value}>
      {children}
    </AppLockContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error("useAppLock must be used within an AppLockProvider");
  }
  return context;
}

export default AppLockContext;