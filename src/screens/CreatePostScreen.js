import { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Modal,
  Animated, Pressable, Linking, BackHandler,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect, G } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import api from "../api/api";
import { useNetwork } from "../context/NetworkContext";
import NoNetworkOverlay from "../components/NoNetworkOverlay";
import HushCircleSpinner from "../components/HushCircleSpinner";
import useSpinner from "../hooks/useSpinner";
import DraftDiscardModal from "../components/DraftDiscardModal";
import { useDrafts } from "../hooks/useDrafts";import { useTheme } from "../context/ThemeContext";

// Module-level color fallbacks for icon defaults (theme-aware colors used inside component)
const DARK = {
  accent: "#9B6FD4",
  accentSoft: "#C4A3E8",
};



// ── Mood SVG Icons ─────────────────────────────────────────────────────────

const MoodHeartbreakIcon = ({ size = 20, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
    <Path d="M12 8v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M10 10l4 4M14 10l-4 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const MoodSadnessIcon = ({ size = 20, color = "#7B8FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M16 16s-1.5-2-4-2-4 2-4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

const MoodFearIcon = ({ size = 20, color = "#6B9FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 15s1.5-2 4-2 4 2 4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M9 6l1 2M15 6l-1 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const MoodStruggleIcon = ({ size = 20, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 14s1.5 1 4 1 4-1 4-1" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 9l1.5 1.5L12 9l1.5 1.5L15 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MoodHopeIcon = ({ size = 20, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M8 13s1.5 2 4 2 4-2 4-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="9" y1="9" x2="9.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Line x1="15" y1="9" x2="15.01" y2="9" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M12 3v2M16.5 4.5l-1.5 1.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

// ── UI SVG Icons ───────────────────────────────────────────────────────────

const LockIcon = ({ size = 14, color = DARK.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BotIcon = ({ size = 14, color = DARK.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="10" rx="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 11V3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="12" cy="3" r="1" fill={color} />
    <Path d="M8 15h.01M16 15h.01" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M3 15h0M21 15h0" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const GlobeIcon = ({ size = 20, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MessageIcon = ({ size = 20, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartResourceIcon = ({ size = 20, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronRightIcon = ({ size = 18, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="9 18 15 12 9 6"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const AlertTriangleIcon = ({ size = 14, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const LightbulbIcon = ({ size = 14, color = DARK.accentSoft }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V17a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-2.8C7.21 13.16 6 11.22 6 9a6 6 0 0 1 6-6z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldIcon = ({ size = 32, color = DARK.accent }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const AlertCircleIcon = ({ size = 32, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="16" x2="12.01" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const SlashIcon = ({ size = 32, color = "#6B9FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const HeartBrokenIcon = ({ size = 32, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 8l-2 4h4l-2 4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Submit button send icon
const SendIcon = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 2L15 22l-4-9-9-4 20-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Crisis modal "go to feed" icon
const ArrowRightIcon = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 5 19 12 12 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Map icon key → component ───────────────────────────────────────────────

const BlockedIconMap = {
  "heart-broken": HeartBrokenIcon,
  "alert":        AlertCircleIcon,
  "slash":        SlashIcon,
  "shield":       ShieldIcon,
};

const ResourceIconMap = {
  "globe":   GlobeIcon,
  "message": MessageIcon,
  "heart":   HeartResourceIcon,
};

// ── MOODS — SVG icon components instead of emoji ──────────────────────────

const MOODS = [
  { key: "heartbreak", Icon: MoodHeartbreakIcon, label: "Heartbreak", color: "#D4607A" },
  { key: "sadness",    Icon: MoodSadnessIcon,    label: "Sadness",    color: "#7B8FD4" },
  { key: "fear",       Icon: MoodFearIcon,        label: "Fear",       color: "#6B9FD4" },
  { key: "struggle",   Icon: MoodStruggleIcon,    label: "Struggle",   color: "#D4A44C" },
  { key: "hope",       Icon: MoodHopeIcon,        label: "Hope",       color: "#4CAF8F" },
];

const CRISIS_RESOURCES = [
  { name: "Befrienders Worldwide",  subtitle: "Talk to someone now",       url: "https://www.befrienders.org",                         icon: "globe"   },
  { name: "Crisis Text Line",       subtitle: "Text HOME to 741741",       url: null,                                                  icon: "message" },
  { name: "IASP Crisis Centres",    subtitle: "Find help in your country", url: "https://www.iasp.info/resources/Crisis_Centres/",     icon: "heart"   },
];

const ACTION_CONFIG = {
  bullying:         { icon: "heart-broken", title: "This hurts others",     message: "Your post contains language that could deeply hurt someone who is already vulnerable. HushCircle is a space where people come to heal — not to be hurt further.", tip: "Try sharing how YOU feel instead of directing pain at others.", color: "#D4607A" },
  threat:           { icon: "alert",        title: "Threatening content",    message: "Your post contains threatening language that cannot be shared on HushCircle. Everyone here deserves to feel completely safe.",                                       tip: "If you are angry or in pain, try expressing what you are feeling inside.", color: "#D4A44C" },
  spam:             { icon: "slash",        title: "Looks like spam",        message: "Your post was flagged as spam or contains external links. HushCircle is a safe space — not a platform for promotion.",                                              tip: "Share something real and personal instead.", color: "#6B9FD4" },
  self_harm_method: { icon: "shield",       title: "We care about you",      message: "Your post contained details about self-harm methods. We blocked it to keep you and others safe — not to silence you.",                                         tip: "You can still share how you feel. We are listening.", color: "#9B6FD4" },
  guidelines:       { icon: "shield",       title: "Post not shared",        message: "Your post could not be shared as it may violate our community guidelines. HushCircle is built on kindness and safety.",                                             tip: "Review our community guidelines and try again.", color: "#9B6FD4" },
};

// ── Hashtag helper ─────────────────────────────────────────────────────────

const extractHashtags = (text) => {
  const matches = text.match(/#\w+/g) || [];
  return [...new Set(matches.map((t) => t.toLowerCase()))].slice(0, 5);
};

// ──────────────────────────────────────────────────────────────────────────

export default function CreatePostScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("sadness");
  const [hashtags, setHashtags] = useState([]);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedReason, setBlockedReason] = useState("guidelines");
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const crisisAnim = useRef(new Animated.Value(0)).current;
  const blockedAnim = useRef(new Animated.Value(0)).current;
  const spinner = useSpinner();
  const { isConnected } = useNetwork();
  const drafts = useDrafts();

  const selectedMood = MOODS.find((m) => m.key === mood);
  const blocked = ACTION_CONFIG[blockedReason] || ACTION_CONFIG.guidelines;
  const BlockedIcon = BlockedIconMap[blocked.icon] || ShieldIcon;

  // ── Restore draft on mount ──────────────────────────────────────────────
  useEffect(() => {
    const restoreDraft = async () => {
      const draft = await drafts.getCreatePostDraft();
      if (draft?.content) {
        setContent(draft.content);
        setMood(draft.mood || "sadness");
        setHashtags(extractHashtags(draft.content));
      }
    };
    restoreDraft();
  }, []);

  // ── Android hardware back ───────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (content.trim()) { setShowDiscardModal(true); return true; }
        return false;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [content])
  );

  // ── iOS / header back ───────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!content.trim()) return;
      e.preventDefault();
      setShowDiscardModal(true);
    });
    return unsubscribe;
  }, [navigation, content]);

  const animateIn = (anim) =>
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
  const animateOut = (anim, cb) =>
    Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(cb);

  const modalTransform = (anim) => ({
    opacity: anim,
    transform: [
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
    ],
  });

  const handlePost = async () => {
    if (!content.trim() || content.length > 500) return;
    if (!isConnected) { setShowNoNetwork(true); return; }

    await spinner.withSpinner(async () => {
      try {
        const res = await api.post("/posts", { content: content.trim(), mood, hashtags });
        await drafts.clearCreatePostDraft();
        setContent("");
        setMood("sadness");
        setHashtags([]);

        if (res.data.crisisDetected) {
          setShowCrisisModal(true);
          animateIn(crisisAnim);
        } else {
          navigation.navigate("Feed");
        }
      } catch (error) {
        const flagType = error.response?.data?.flagType;
        setBlockedReason(error.response?.status === 400 && flagType ? flagType : "guidelines");
        setShowBlockedModal(true);
        animateIn(blockedAnim);
      }
    }, "Sharing your story...");
  };

  const handleDiscardLeave = async () => {
    await drafts.clearCreatePostDraft();
    setShowDiscardModal(false);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Share your heart</Text>
          <Text style={styles.headerSub}>Anonymous & safe. Always.</Text>
        </View>

        {/* ── Mood picker ── */}
        <Text style={styles.sectionLabel}>How are you feeling?</Text>
        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[
                styles.moodBtn,
                mood === m.key && { backgroundColor: m.color + "33", borderColor: m.color },
              ]}
              onPress={() => setMood(m.key)}
            >
              <m.Icon size={18} color={mood === m.key ? m.color : COLORS.textMuted} />
              <Text style={[styles.moodLabel, mood === m.key && { color: m.color }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Text input ── */}
        <Text style={styles.sectionLabel}>What's on your mind?</Text>
        <View style={[styles.inputContainer, { borderColor: selectedMood.color + "66" }]}>
          <TextInput
            style={styles.input}
            placeholder="It's okay to say it here... this is your safe space"
            placeholderTextColor={COLORS.textMuted}
            value={content}
            onChangeText={(text) => { setContent(text); setHashtags(extractHashtags(text)); }}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, content.length > 450 && { color: COLORS.error }]}>
            {content.length}/500
          </Text>
        </View>

        {/* ── Hashtag preview ── */}
        {hashtags.length > 0 && (
          <View style={styles.hashtagPreview}>
            <Text style={styles.hashtagPreviewLabel}>{hashtags.length}/5 hashtags</Text>
            <View style={styles.hashtagChips}>
              {hashtags.map((tag, i) => (
                <View key={i} style={styles.hashtagChip}>
                  <Text style={styles.hashtagChipText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {hashtags.length >= 5 && (
          <View style={styles.hashtagLimitBox}>
            <AlertTriangleIcon size={13} color="#D4A44C" />
            <Text style={styles.hashtagLimitText}>Max 5 hashtags — only the first 5 will be saved</Text>
          </View>
        )}

        {/* ── Privacy boxes ── */}
        <View style={styles.privacyBox}>
          <LockIcon size={14} color={COLORS.accentSoft} />
          <Text style={styles.privacyText}>Your post is anonymous. Only your pseudonym is shown — never your real identity.</Text>
        </View>
        <View style={styles.privacyBox}>
          <BotIcon size={14} color={COLORS.accentSoft} />
          <Text style={styles.privacyText}>Our AI monitors all posts to keep HushCircle safe. Harmful or bullying content will be automatically blocked.</Text>
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: selectedMood.color }, !content.trim() && styles.disabled]}
          onPress={handlePost}
          disabled={!content.trim()}
        >
          <View style={styles.submitBtnInner}>
            <selectedMood.Icon size={18} color="#fff" />
            <Text style={styles.submitText}>Share anonymously</Text>
            <SendIcon size={15} color="#fff" />
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Draft discard modal ── */}
      <DraftDiscardModal
        visible={showDiscardModal}
        mode="discard"
        onLeave={handleDiscardLeave}
        onCancel={() => setShowDiscardModal(false)}
      />

      {/* ── Crisis Modal ── */}
      <Modal visible={showCrisisModal} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.crisisModal, modalTransform(crisisAnim)]}>

            <View style={styles.crisisIconWrap}>
              <HeartResourceIcon size={36} color={COLORS.accent} />
            </View>

            <Text style={styles.crisisTitle}>You are not alone</Text>
            <Text style={styles.crisisSubtitle}>
              We noticed your post may be expressing thoughts of self-harm or a deep struggle.
            </Text>
            <View style={styles.crisisDivider} />
            <Text style={styles.crisisBodyText}>
              Your post has been shared and your feelings are valid. But before you go — please know that real support is available right now.
            </Text>

            <View style={styles.crisisResourcesTitleRow}>
              <HeartResourceIcon size={14} color={COLORS.accentSoft} />
              <Text style={styles.crisisResourcesTitle}>Talk to someone now</Text>
            </View>

            {CRISIS_RESOURCES.map((resource, index) => {
              const Icon = ResourceIconMap[resource.icon];
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.resourceCard}
                  onPress={() => resource.url && Linking.openURL(resource.url)}
                  activeOpacity={resource.url ? 0.7 : 1}
                >
                  <View style={styles.resourceIconWrap}>
                    <Icon size={20} color={COLORS.accent} />
                  </View>
                  <View style={styles.resourceContent}>
                    <Text style={styles.resourceName}>{resource.name}</Text>
                    <Text style={styles.resourceSub}>{resource.subtitle}</Text>
                  </View>
                  {resource.url && <ChevronRightIcon size={18} color={COLORS.accent} />}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.crisisEnterBtn}
              onPress={() => animateOut(crisisAnim, () => { setShowCrisisModal(false); navigation.navigate("Feed"); })}
            >
              <View style={styles.crisisEnterBtnInner}>
                <Text style={styles.crisisEnterText}>I'm okay, go to feed</Text>
                <ArrowRightIcon size={15} color="#fff" />
              </View>
            </TouchableOpacity>

            <Text style={styles.crisisFooter}>You matter. This community is here for you.</Text>
          </Animated.View>
        </View>
      </Modal>

      {/* ── Blocked Modal ── */}
      <Modal visible={showBlockedModal} transparent animationType="none">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => animateOut(blockedAnim, () => setShowBlockedModal(false))}
        >
          <Animated.View
            style={[styles.blockedModal, modalTransform(blockedAnim)]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.blockedIconWrap, { backgroundColor: blocked.color + "22" }]}>
              <BlockedIcon size={32} color={blocked.color} />
            </View>

            <Text style={styles.blockedTitle}>{blocked.title}</Text>
            <Text style={styles.blockedMessage}>{blocked.message}</Text>

            <View style={[styles.blockedTipBox, { borderColor: blocked.color + "44" }]}>
              <View style={styles.blockedTipLabel}>
                <LightbulbIcon size={13} color={COLORS.accentSoft} />
                <Text style={styles.blockedTipLabelText}>Tip</Text>
              </View>
              <Text style={styles.blockedTipText}>{blocked.tip}</Text>
            </View>

            <View style={styles.blockedActions}>
              <TouchableOpacity
                style={styles.blockedEditBtn}
                onPress={() => animateOut(blockedAnim, () => setShowBlockedModal(false))}
              >
                <Text style={styles.blockedEditText}>Edit my post</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.blockedGuidelinesBtn, { backgroundColor: blocked.color }]}
                onPress={() => animateOut(blockedAnim, () => setShowBlockedModal(false))}
              >
                <Text style={styles.blockedGuidelinesText}>Understood</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      <NoNetworkOverlay
        visible={showNoNetwork}
        action="post"
        onClose={() => setShowNoNetwork(false)}
        onRetry={() => { setShowNoNetwork(false); handlePost(); }}
      />

      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
    </KeyboardAvoidingView>
  );
}

      const styles = StyleSheet.create({
      container: { flex: 1, backgroundColor: "#0F0A1E" },
      scroll: { padding: 20, paddingTop: 56, paddingBottom: 40 },

      // Header
      header: { marginBottom: 28 },
      headerTitle: { fontSize: 32, color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular" },
      headerSub: { fontSize: 13, color: "#8B7FA8", fontFamily: "Nunito_400Regular", marginTop: 4 },
      sectionLabel: { color: "#C4A3E8", fontFamily: "Nunito_500Medium", fontSize: 13, marginBottom: 12 },

      // Mood
      moodRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
      moodBtn: {
      flexDirection: "row", alignItems: "center", gap: 6,
      paddingHorizontal: 12, paddingVertical: 8,
      borderRadius: 20, borderWidth: 1, borderColor: "#2D2450",
      backgroundColor: "#1A1330",
      },
      moodLabel: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 12 },

      // Input
      inputContainer: { backgroundColor: "#1A1330", borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, minHeight: 160 },
      input: { color: "#EDE8F5", fontFamily: "Nunito_400Regular", fontSize: 17, lineHeight: 28, flex: 1, minHeight: 120 },
      charCount: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 12, textAlign: "right", marginTop: 8 },

      // Hashtags
      hashtagPreview: {
      backgroundColor: "#1A1330", borderRadius: 12, padding: 12, marginBottom: 10,
      borderWidth: 1, borderColor: "#9B6FD444",
      flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
      },
      hashtagPreviewLabel: { color: "#8B7FA8", fontFamily: "Nunito_500Medium", fontSize: 11 },
      hashtagChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1, justifyContent: "flex-end" },
      hashtagChip: { backgroundColor: "#9B6FD422", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#9B6FD444" },
      hashtagChipText: { color: "#9B6FD4", fontFamily: "Nunito_600SemiBold", fontSize: 12 },
      hashtagLimitBox: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: "#D4A44C18", borderRadius: 10, padding: 10, marginBottom: 10,
      borderWidth: 1, borderColor: "#D4A44C44",
      },
      hashtagLimitText: { color: "#D4A44C", fontFamily: "Nunito_400Regular", fontSize: 12, flex: 1 },

      // Privacy boxes
      privacyBox: {
      flexDirection: "row", alignItems: "flex-start", gap: 10,
      backgroundColor: "#1A1330", borderRadius: 12, padding: 12, marginBottom: 12,
      borderWidth: 1, borderColor: "#2D2450",
      },
      privacyText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 18, flex: 1 },

      // Submit
      submitBtn: { borderRadius: 14, padding: 16, alignItems: "center", marginTop: 4 },
      submitBtnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
      disabled: { opacity: 0.5 },
      submitText: { color: "#fff", fontFamily: "Nunito_600SemiBold", fontSize: 16 },

      // Modals
      modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.75)", padding: 20 },

      // Crisis modal
      crisisModal: { backgroundColor: "#1A1330", borderRadius: 28, padding: 24, borderWidth: 1, borderColor: "#9B6FD4" + "44", width: "100%", maxWidth: 380 },
      crisisIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#9B6FD4" + "22", justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 16 },
      crisisTitle: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 28, textAlign: "center", marginBottom: 8 },
      crisisSubtitle: { color: "#C4A3E8", fontFamily: "Nunito_500Medium", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 16 },
      crisisDivider: { height: 1, backgroundColor: "#2D2450", marginBottom: 16 },
      crisisBodyText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 22, textAlign: "center", marginBottom: 20 },
      crisisResourcesTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
      crisisResourcesTitle: { color: "#EDE8F5", fontFamily: "Nunito_600SemiBold", fontSize: 14 },
      resourceCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#0F0A1E", borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#2D2450" },
      resourceIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#9B6FD4" + "22", justifyContent: "center", alignItems: "center" },
      resourceContent: { flex: 1 },
      resourceName: { color: "#EDE8F5", fontFamily: "Nunito_600SemiBold", fontSize: 13, marginBottom: 2 },
      resourceSub: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 12 },
      crisisEnterBtn: { backgroundColor: "#9B6FD4", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 16 },
      crisisEnterBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
      crisisEnterText: { color: "#fff", fontFamily: "Nunito_600SemiBold", fontSize: 15 },
      crisisFooter: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 12, textAlign: "center", marginTop: 16, lineHeight: 18 },

      // Blocked modal
      blockedModal: { backgroundColor: "#1A1330", borderRadius: 28, padding: 24, borderWidth: 1, borderColor: "#2D2450", width: "100%", maxWidth: 360 },
      blockedIconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 16 },
      blockedTitle: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 24, textAlign: "center", marginBottom: 10 },
      blockedMessage: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", lineHeight: 22, marginBottom: 16 },
      blockedTipBox: { backgroundColor: "#0F0A1E", borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 20 },
      blockedTipLabel: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
      blockedTipLabelText: { color: "#C4A3E8", fontFamily: "Nunito_600SemiBold", fontSize: 12 },
      blockedTipText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20 },
      blockedActions: { flexDirection: "row", gap: 10 },
      blockedEditBtn: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#2D2450", alignItems: "center" },
      blockedEditText: { color: "#EDE8F5", fontFamily: "Nunito_500Medium", fontSize: 14 },
      blockedGuidelinesBtn: { flex: 1, padding: 14, borderRadius: 14, alignItems: "center" },
      blockedGuidelinesText: { color: "#fff", fontFamily: "Nunito_600SemiBold", fontSize: 14 },
      });

