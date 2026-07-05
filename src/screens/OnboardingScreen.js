import { useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Dimensions,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect, G } from "react-native-svg";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const COLORS = {
  bg: "#0F0A1E", card: "#1A1330", border: "#2D2450",
  accent: "#9B6FD4", accentSoft: "#C4A3E8",
  text: "#EDE8F5", textMuted: "#8B7FA8",
  error: "#D4607A", success: "#4CAF8F",
  warning: "#D4A44C",
};

// ── Slide Hero Icons ───────────────────────────────────────────────────────

const WelcomeIcon = ({ size = 44, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={color + "44"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const AnonymousIcon = ({ size = 44, color = "#6B9FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="16" r="1.5" fill={color} />
  </Svg>
);

const ExpectIcon = ({ size = 44, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      fill={color + "22"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ForbiddenIcon = ({ size = 44, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10"
      fill={color + "22"} stroke={color} strokeWidth={1.8} />
    <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const ModerationIcon = ({ size = 44, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="10" rx="2"
      fill={color + "22"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 11V3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx="12" cy="3" r="1.5" fill={color} />
    <Path d="M8 16h.01M16 16h.01" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M3 16h0M21 16h0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const BlockedAccountIcon = ({ size = 44, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={1.8} />
    <Line x1="2" y1="2" x2="22" y2="22" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const ReadyIcon = ({ size = 44, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill={color + "33"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ── Point bullet icons (small, inline) ────────────────────────────────────

const BulletHeartIcon = ({ size = 15, color = "#9B6FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={color + "55"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BulletHugIcon = ({ size = 15, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="7" r="3" stroke={color} strokeWidth={2} />
    <Path d="M5 18v-2a7 7 0 0 1 14 0v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 13c1-1 2-1 3 0M22 13c-1-1-2-1-3 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const BulletLeafIcon = ({ size = 15, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 8-12 9"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BulletHandsIcon = ({ size = 15, color = "#C4A3E8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 11V6a2 2 0 0 0-4 0M14 10.5V5a2 2 0 0 0-4 0M10 10.5V3a2 2 0 0 0-4 0v9"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6 12v2a6 6 0 0 0 12 0v-2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BulletChatIcon = ({ size = 15, color = "#6B9FD4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BulletXIcon = ({ size = 15, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill={color + "22"} stroke={color} strokeWidth={2} />
    <Line x1="8" y1="8" x2="16" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="16" y1="8" x2="8" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const BulletBotIcon = ({ size = 15, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="10" rx="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 11V3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="12" cy="3" r="1" fill={color} />
    <Path d="M8 16h.01M16 16h.01" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

const BulletFlagIcon = ({ size = 15, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="4" y1="22" x2="4" y2="15" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const BulletUsersIcon = ({ size = 15, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={2} />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BulletAlertIcon = ({ size = 15, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const BulletShieldIcon = ({ size = 15, color = "#C4A3E8" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BulletCheckIcon = ({ size = 15, color = "#4CAF8F" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BulletWarningUserIcon = ({ size = 15, color = "#D4A44C" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="16" x2="12.01" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const BulletBlockIcon = ({ size = 15, color = "#D4607A" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ── Nav / UI icons ─────────────────────────────────────────────────────────

const ArrowLeftIcon = ({ size = 16, color = COLORS.textMuted }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="19" y1="12" x2="5" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 19 5 12 12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ArrowRightIcon = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 5 19 12 12 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckmarkIcon = ({ size = 14, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EnterIcon = ({ size = 16, color = "#fff" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="10 17 15 12 10 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="15" y1="12" x2="3" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ──────────────────────────────────────────────────────────────────────────
// SLIDES — emoji replaced with Icon component reference + structured points
// ──────────────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: "welcome",
    Icon: WelcomeIcon,
    title: "Welcome to HushCircle",
    subtitle: "A safe space for your heart",
    content: "HushCircle is a mental health community where real people share real feelings — anonymously, without judgment. Whatever you are carrying right now, you do not have to carry it alone.",
    color: "#9B6FD4",
  },
  {
    id: "anonymous",
    Icon: AnonymousIcon,
    title: "You are anonymous here",
    subtitle: "Your identity is always protected",
    content: "You are known only by your pseudonym — never your real name, email, or any personal details. No one can identify you. Share freely and safely.",
    color: "#6B9FD4",
    points: [
      { Icon: BulletCheckIcon,  color: "#4CAF8F",  text: "Only your pseudonym is visible to others" },
      { Icon: BulletCheckIcon,  color: "#4CAF8F",  text: "Your email is never shown or shared" },
      { Icon: BulletCheckIcon,  color: "#4CAF8F",  text: "Your posts cannot be traced back to you" },
    ],
  },
  {
    id: "expect",
    Icon: ExpectIcon,
    title: "What we expect from you",
    subtitle: "Keep HushCircle a healing space",
    color: "#4CAF8F",
    points: [
      { Icon: BulletHeartIcon, color: "#9B6FD4",  text: "Be kind — everyone here is struggling" },
      { Icon: BulletHugIcon,   color: "#D4A44C",  text: "Offer support, not solutions" },
      { Icon: BulletLeafIcon,  color: "#4CAF8F",  text: "Share honestly from your own experience" },
      { Icon: BulletHandsIcon, color: "#C4A3E8",  text: "Respect every story, even if different from yours" },
      { Icon: BulletChatIcon,  color: "#6B9FD4",  text: "Comment with empathy and care" },
    ],
  },
  {
    id: "forbidden",
    Icon: ForbiddenIcon,
    title: "What is not allowed",
    subtitle: "Zero tolerance for harmful behaviour",
    color: "#D4607A",
    points: [
      { Icon: BulletXIcon, color: "#D4607A", text: "Bullying, harassment or targeting others" },
      { Icon: BulletXIcon, color: "#D4607A", text: "Promoting violence or self-harm methods" },
      { Icon: BulletXIcon, color: "#D4607A", text: "Spam, advertising or fake posts" },
      { Icon: BulletXIcon, color: "#D4607A", text: "Sharing anyone's personal information" },
      { Icon: BulletXIcon, color: "#D4607A", text: "Hate speech or discrimination of any kind" },
      { Icon: BulletXIcon, color: "#D4607A", text: "Explicit or inappropriate sexual content" },
    ],
  },
  {
    id: "moderation",
    Icon: ModerationIcon,
    title: "How we keep you safe",
    subtitle: "AI + human moderation working together",
    color: "#D4A44C",
    content: "Every post and comment is scanned by our AI moderation system in real time. If your content is flagged or reported by 3 or more users, it will be reviewed by our team.",
    points: [
      { Icon: BulletBotIcon,   color: "#D4A44C", text: "AI scans every post for harmful content" },
      { Icon: BulletFlagIcon,  color: "#D4607A", text: "Users can report any post that feels wrong" },
      { Icon: BulletUsersIcon, color: "#D4A44C", text: "3+ reports triggers immediate human review" },
      { Icon: BulletAlertIcon, color: "#D4A44C", text: "Crisis keywords trigger instant support resources" },
    ],
  },
  {
    id: "blocked",
    Icon: BlockedAccountIcon,
    title: "Why accounts get blocked",
    subtitle: "We take safety very seriously",
    color: "#D4607A",
    content: "We want everyone to feel safe here. Accounts that repeatedly violate our guidelines will be suspended to protect the community.",
    points: [
      { Icon: BulletWarningUserIcon, color: "#D4A44C", text: "First violation — warning issued" },
      { Icon: BulletWarningUserIcon, color: "#D4A44C", text: "Second violation — temporary suspension" },
      { Icon: BulletBlockIcon,       color: "#D4607A", text: "Third violation — permanent block" },
      { Icon: BulletBlockIcon,       color: "#D4607A", text: "Severe violations — immediate permanent ban" },
    ],
  },
  {
    id: "ready",
    Icon: ReadyIcon,
    title: "You are ready",
    subtitle: "HushCircle is yours now",
    content: "By joining HushCircle you agree to treat this space and everyone in it with kindness, respect and empathy. Together we make this a place where healing is possible.",
    color: "#9B6FD4",
  },
];

// ──────────────────────────────────────────────────────────────────────────

export default function OnboardingScreen({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const scrollRef = useRef(null);
  const checkAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();

  const isLast = currentSlide === SLIDES.length - 1;
  const slide = SLIDES[currentSlide];

  const goNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const goPrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleAgree = () => {
    setAgreed(true);
    Animated.spring(checkAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 6,
    }).start();
  };

  const handleEnter = async () => {
    await AsyncStorage.setItem("onboarded", "true");
    if (onComplete) onComplete();
  };

  return (
    <View style={styles.container}>

      {/* Progress dots */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setCurrentSlide(i)}>
            <View style={[
              styles.dot,
              i === currentSlide && { backgroundColor: slide.color, width: 20 },
              i < currentSlide && { backgroundColor: slide.color + "66" },
            ]} />
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Slide hero icon */}
        <View style={[styles.iconWrap, { backgroundColor: slide.color + "22" }]}>
          <slide.Icon size={44} color={slide.color} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={[styles.subtitle, { color: slide.color }]}>{slide.subtitle}</Text>

        {/* Content text */}
        {slide.content && (
          <Text style={styles.content}>{slide.content}</Text>
        )}

        {/* Points list */}
        {slide.points && (
          <View style={styles.pointsContainer}>
            {slide.points.map((point, i) => (
              <View key={i} style={[styles.pointRow, { borderLeftColor: slide.color }]}>
                <View style={styles.pointIconWrap}>
                  <point.Icon size={15} color={point.color} />
                </View>
                <Text style={styles.pointText}>{point.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Last slide — agreement */}
        {isLast && (
          <View style={styles.agreementSection}>
            <TouchableOpacity
              style={[styles.checkRow, agreed && { borderColor: COLORS.success }]}
              onPress={handleAgree}
              activeOpacity={0.8}
            >
              <Animated.View style={[
                styles.checkbox,
                agreed && { backgroundColor: COLORS.success, borderColor: COLORS.success },
                {
                  transform: [{
                    scale: checkAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.2, 1],
                    }),
                  }],
                },
              ]}>
                {agreed && <CheckmarkIcon size={13} color="#fff" />}
              </Animated.View>
              <Text style={styles.checkText}>
                I have read and agree to HushCircle's community guidelines and terms of use
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.enterBtn,
                { backgroundColor: agreed ? slide.color : COLORS.border },
                !agreed && { opacity: 0.5 },
              ]}
              onPress={agreed ? handleEnter : null}
              disabled={!agreed}
            >
              <View style={styles.enterBtnInner}>
                {agreed
                  ? <EnterIcon size={16} color="#fff" />
                  : null
                }
                <Text style={styles.enterBtnText}>
                  {agreed ? "Enter HushCircle" : "Please agree to continue"}
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.legalNote}>
              By entering you confirm you are 13 years or older and agree to our privacy policy. Your data is never sold or shared with third parties.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      {!isLast && (
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, currentSlide === 0 && { opacity: 0.3 }]}
            onPress={goPrev}
            disabled={currentSlide === 0}
          >
            <View style={styles.navBtnInner}>
              <ArrowLeftIcon size={15} color={COLORS.textMuted} />
              <Text style={styles.navBtnText}>Back</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.slideCount}>
            {currentSlide + 1} of {SLIDES.length}
          </Text>

          <TouchableOpacity
            style={[styles.navBtnPrimary, { backgroundColor: slide.color }]}
            onPress={goNext}
          >
            <View style={styles.navBtnInner}>
              <Text style={styles.navBtnPrimaryText}>Next</Text>
              <ArrowRightIcon size={15} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  dotsContainer: { flexDirection: "row", justifyContent: "center", gap: 6, paddingTop: 56, paddingBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },

  scroll: { padding: 24, paddingBottom: 40 },

  // Slide hero
  iconWrap: { width: 90, height: 90, borderRadius: 28, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 24, marginTop: 8 },

  title: { color: COLORS.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 30, textAlign: "center", marginBottom: 8 },
  subtitle: { fontFamily: "Nunito_500Medium", fontSize: 14, textAlign: "center", marginBottom: 24 },
  content: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 15, lineHeight: 26, textAlign: "center", marginBottom: 24 },

  // Points
  pointsContainer: { gap: 10, marginBottom: 24 },
  pointRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 10,
    backgroundColor: COLORS.card, borderRadius: 10,
    borderTopLeftRadius: 0, borderBottomLeftRadius: 0,
  },
  pointIconWrap: { width: 22, alignItems: "center", flexShrink: 0 },
  pointText: { color: COLORS.text, fontFamily: "Nunito_400Regular", fontSize: 14, lineHeight: 22, flex: 1 },

  // Agreement
  agreementSection: { gap: 16, marginTop: 8 },
  checkRow: {
    flexDirection: "row", gap: 12, alignItems: "flex-start",
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 2,
    borderColor: COLORS.border, justifyContent: "center", alignItems: "center",
    flexShrink: 0, marginTop: 1,
  },
  checkText: { color: COLORS.text, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20, flex: 1 },
  enterBtn: { borderRadius: 16, padding: 18, alignItems: "center" },
  enterBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  enterBtnText: { color: "#fff", fontFamily: "Nunito_600SemiBold", fontSize: 16 },
  legalNote: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "center", lineHeight: 17 },

  // Nav
  navRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  navBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  navBtnInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  navBtnText: { color: COLORS.textMuted, fontFamily: "Nunito_500Medium", fontSize: 14 },
  slideCount: { color: COLORS.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13 },
  navBtnPrimary: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  navBtnPrimaryText: { color: "#fff", fontFamily: "Nunito_600SemiBold", fontSize: 14 },
});