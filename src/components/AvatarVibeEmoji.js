/**
 * AvatarVibeEmoji
 *
 * A small animated emoji that floats at the top-right corner of any avatar.
 * It fetches the vibe for a given pseudonym once and caches it in memory
 * for the lifetime of the session — no repeated network calls per render.
 *
 * Props:
 *   pseudonym  string   — whose vibe to fetch
 *   size       number   — font size of the emoji (default 13)
 *   localDate  string   — YYYY-MM-DD from getLocalDateString()
 *
 * Usage (wrap your existing avatar View):
 *
 *   <View style={{ position: "relative" }}>
 *     <YourAvatarHere />
 *     <AvatarVibeEmoji pseudonym={post.pseudonym} localDate={localDate} />
 *   </View>
 *
 * The parent View MUST have position: "relative" (or just not override it —
 * React Native Views are relative by default).
 */

import { useEffect, useRef, useState } from "react";
import { View, Text, Animated } from "react-native";
import api from "../api/api";
import { getLocalDateString } from "../utils/dateHelpers";

// In-memory cache so every PostCard for the same pseudonym
// doesn't fire its own network request.
// Keyed by `pseudonym:localDate` → { emoji, type } | null
const vibeCache = {};

// ── Exported cache-clear function ─────────────────────────────────────────────
// Call this on logout or account switch so the new session always
// fetches fresh vibes and never shows stale data from a previous user.
export function clearVibeCache() {
  Object.keys(vibeCache).forEach((key) => delete vibeCache[key]);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AvatarVibeEmoji({ pseudonym, size = 13, localDate }) {
  const [vibe, setVibe] = useState(null); // { emoji, type } | null

  // Animation values
  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const floatAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const today    = localDate || getLocalDateString();
  const cacheKey = `${pseudonym}:${today}`;

  useEffect(() => {
    if (!pseudonym) return;

    // Serve from cache immediately if available
    if (vibeCache[cacheKey] !== undefined) {
      if (vibeCache[cacheKey]) {
        setVibe(vibeCache[cacheKey]);
        playEntrance();
      }
      return;
    }

    let cancelled = false;

    const fetchVibe = async () => {
      try {
        const res = await api.get(
          `/users/avatar-vibe/${encodeURIComponent(pseudonym)}?localDate=${today}`
        );
        const data = res.data;

        if (cancelled) return;

        if (data.emoji) {
          const result = { emoji: data.emoji, type: data.type };
          vibeCache[cacheKey] = result;
          setVibe(result);
          playEntrance();
        } else {
          // Cache the "nothing to show" result too so we don't re-fetch
          vibeCache[cacheKey] = null;
        }
      } catch {
        // Silently fail — avatar vibe is decorative, not critical
        vibeCache[cacheKey] = null;
      }
    };

    fetchVibe();
    return () => { cancelled = true; };
  }, [pseudonym, today]);

  // Entrance: pop in then start gentle float loop
  const playEntrance = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 120,
        friction: 6,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => startFloat());
  };

  // Gentle up-down float loop — subtle, calming, not distracting
  const startFloat = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -3,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  if (!vibe) return null;

  // Milestone emoji gets a slightly larger size and gold ring
  const isMilestone  = vibe.type === "milestone";
  const emojiSize    = isMilestone ? size + 2 : size;
  const badgeSize    = emojiSize + 6;
  const badgeBg      = isMilestone ? "#FFD70033" : "rgba(0,0,0,0.45)";
  const badgeBorder  = isMilestone ? "#FFD70099" : "transparent";

  return (
    <Animated.View
      style={{
        position:  "absolute",
        top:       -4,
        right:     -4,
        zIndex:    10,
        opacity:   opacityAnim,
        transform: [
          { scale:      scaleAnim  },
          { translateY: floatAnim  },
        ],
      }}
    >
      <View
        style={{
          width:           badgeSize,
          height:          badgeSize,
          borderRadius:    badgeSize / 2,
          backgroundColor: badgeBg,
          borderWidth:     isMilestone ? 1 : 0,
          borderColor:     badgeBorder,
          justifyContent:  "center",
          alignItems:      "center",
          shadowColor:     "#000",
          shadowOffset:    { width: 0, height: 1 },
          shadowOpacity:   0.3,
          shadowRadius:    2,
          elevation:       3,
        }}
      >
        <Text style={{ fontSize: emojiSize, lineHeight: emojiSize + 2 }}>
          {vibe.emoji}
        </Text>
      </View>
    </Animated.View>
  );
}