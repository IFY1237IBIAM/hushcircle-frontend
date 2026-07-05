/**
 * ContactSupportScreen.js
 */

import { useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Animated, Linking, StyleSheet, Alert,
} from "react-native";
import Svg, { Path, Polyline, Line, Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

function HeroSupportIcon({ size = 44, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={color + "33"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BackArrowIcon({ size = 20, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="15 18 9 12 15 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function ContactSupportScreen() {
  const navigation = useNavigation();
  const { colors: C } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const S = makeStyles(C);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80], outputRange: [0, 1], extrapolate: "clamp",
  });

  const openEmail = (address, subject = "") => {
    const url = subject
      ? `mailto:${address}?subject=${encodeURIComponent(subject)}`
      : `mailto:${address}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Could not open mail app", `Please email us at ${address}`)
    );
  };

  return (
    <View style={S.container}>
      <Animated.View style={[S.floatingHeader, { opacity: headerOpacity }]}>
        <Text style={S.floatingTitle}>Contact Support</Text>
      </Animated.View>

      <View style={S.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <BackArrowIcon size={20} color={C.accent} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        contentContainerStyle={S.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={S.hero}>
          <View style={S.heroIconWrap}>
            <HeroSupportIcon size={44} color={C.accent} />
          </View>
          <Text style={S.heroTitle}>We're Here for You</Text>
          <Text style={S.heroSub}>
            Every message we receive is read by a real person. We take your questions, concerns, and reports seriously — and we respond.
          </Text>
          <View style={S.heroBadge}>
            <Text style={S.heroBadgeText}>Response time: 24–48 hours  ·  Safety issues: priority queue</Text>
          </View>
        </View>

        <View style={S.body}>

          {/* Crisis block */}
          <View style={{ backgroundColor: C.error + "12", borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: C.error + "40", marginBottom: 32 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Text style={{ fontSize: 22 }}>🆘</Text>
              <Text style={{ color: C.error, fontFamily: "Nunito_700Bold", fontSize: 15 }}>
                If you are in crisis right now
              </Text>
            </View>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 22, marginBottom: 14 }}>
              HushCircle is a peer support community, not a crisis intervention service. If you are experiencing a mental health emergency, please reach out to professional services immediately.
            </Text>
            {[
              { label: "Suicide & Crisis Lifeline", value: "988", action: () => Linking.openURL("tel:988") },
              { label: "Crisis Text Line", value: "Text HOME to 741741", action: () => Linking.openURL("sms:741741?body=HOME") },
              { label: "Emergency services", value: "911 (or local equivalent)", action: () => Linking.openURL("tel:911") },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.error + "10", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.error + "25" }}
                onPress={item.action}
                activeOpacity={0.75}
              >
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 13 }}>{item.label}</Text>
                <Text style={{ color: C.error, fontFamily: "Nunito_700Bold", fontSize: 13 }}>{item.value}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Section title="General Support" emoji="📧" C={C}>
            <Body C={C}>
              For most questions and issues, our general support inbox is the right place to start. We read every message and aim to respond within 24–48 hours on business days. Complex issues may take longer — we will always acknowledge your message promptly.
            </Body>
            <ContactCard emoji="✉️" title="General support" detail="support@hushcircle.com" badge="24–48 hr response" onPress={() => openEmail("support@hushcircle.com")} C={C} />
            <Rule emoji="📋" label="Please include in your message:" C={C}>
              Your pseudonym (not your real name). A clear description of the issue. Steps to reproduce the problem, if it's a bug. Screenshots or screen recordings if relevant. Your device model and OS version for technical issues.
            </Rule>
            <Body C={C}>
              The more context you provide, the faster we can help. Vague reports like "the app is broken" make it difficult to investigate. Specific, detailed reports help us resolve issues quickly.
            </Body>
          </Section>

          <Section title="Safety & Abuse Reports" emoji="🛡️" C={C}>
            <Body C={C}>
              Safety reports receive priority review above all other inquiries. If you have witnessed harassment, abuse, self-harm encouragement, or any content that puts someone at risk, please report it immediately.
            </Body>
            <Body C={C}>
              The fastest way to report content is via the in-app report button on any post or comment. Reports submitted this way are automatically flagged for priority review and reach our moderation team within minutes.
            </Body>
            <ContactCard emoji="🚨" title="Safety & abuse" detail="safety@hushcircle.com" badge="Priority queue" onPress={() => openEmail("safety@hushcircle.com", "Safety Report")} C={C} />
            <Rule emoji="📝" label="For safety reports via email, include:" C={C}>
              The pseudonym of the user involved. A description of the harmful content or behavior. The approximate date and time of the incident. Screenshots if you are able to take them safely.
            </Rule>
            <Body C={C}>
              We take all safety reports seriously, even if the outcome is a decision not to act. You will receive a response explaining what action (if any) was taken. Due to privacy obligations, we cannot always share detailed information about enforcement actions against other users.
            </Body>
          </Section>

          <Section title="Account Issues" emoji="🔑" C={C}>
            <Body C={C}>
              Locked out of your account? Received an enforcement notice you believe is unfair? We handle account issues through our support team and a formal appeals process.
            </Body>
            <Rule emoji="🔒" label="Forgot your password:" C={C}>
              Use the "Forgot password" option on the login screen. A reset link will be sent to your registered email address within a few minutes. Check your spam folder if it does not arrive. If you no longer have access to your email, contact support.
            </Rule>
            <Rule emoji="⚖️" label="Appealing a suspension or ban:" C={C}>
              Tap "Appeal" in the suspension notice within the app. You can also email support@hushcircle.com with "Account Appeal" in the subject line. Include your pseudonym and a clear explanation of why you believe the action was taken in error. Appeals are reviewed by a human moderator (not the original reviewer) within 48 hours.
            </Rule>
            <Rule emoji="🔄" label="Switching or adding accounts:" C={C}>
              You can manage up to 3 accounts per device from Settings. If you are experiencing issues with account switching, log out of all accounts, close the app completely, and sign back in to each account individually.
            </Rule>
            <Rule emoji="🗑️" label="Deleting your account:" C={C}>
              Account deletion is available from Settings → Danger Zone. Deletion is permanent and cannot be undone. All your posts, comments, and data will be removed within 30 days. If you encounter issues with the in-app deletion flow, contact support@hushcircle.com.
            </Rule>
          </Section>

          <Section title="Bug Reports & Technical Issues" emoji="🐛" C={C}>
            <Body C={C}>
              Encountered something that does not look right? We ship bug fixes weekly and rely heavily on user reports to identify issues we might not catch internally.
            </Body>
            <ContactCard emoji="🔧" title="Bug reports & technical feedback" detail="bugs@hushcircle.com" badge="Reviewed weekly" onPress={() => openEmail("bugs@hushcircle.com", "Bug Report")} C={C} />
            <Rule emoji="📱" label="Include for fastest resolution:" C={C}>
              Your device make and model (e.g., iPhone 15 Pro, Samsung Galaxy S24). Your operating system version (e.g., iOS 18.2, Android 15). App version number — found in Settings under "App version." A clear description of what happened vs. what you expected. Steps to reproduce the issue. Screenshots or a screen recording if possible.
            </Rule>
            <Body C={C}>
              Our engineering team reviews all bug reports. For critical bugs that affect usability or safety, we aim to release a fix within 72 hours. For lower-priority issues, fixes are batched into our weekly release cycle.
            </Body>
          </Section>

          <Section title="Privacy Requests" emoji="🔐" C={C}>
            <Body C={C}>
              For requests related to your personal data — including data exports, correction requests, or deletion requests that you cannot complete through the app — contact our privacy team directly.
            </Body>
            <ContactCard emoji="🛡️" title="Privacy requests" detail="privacy@hushcircle.com" badge="30-day response guarantee" onPress={() => openEmail("privacy@hushcircle.com", "Privacy Request")} C={C} />
            <Body C={C}>
              Under applicable privacy laws, you have the right to access your data, correct inaccuracies, request deletion, and object to certain processing. We will fulfill all valid requests within 30 days. For complex requests, we will acknowledge within 5 business days and keep you updated on progress.
            </Body>
          </Section>

          <Section title="Feature Requests & Feedback" emoji="💡" C={C}>
            <Body C={C}>
              We actively read product feedback and many of HushCircle's features have come directly from community suggestions. If you have an idea for how to make HushCircle better, we genuinely want to hear it.
            </Body>
            <ContactCard emoji="💌" title="Product feedback" detail="hello@hushcircle.com" badge="Read by the team" onPress={() => openEmail("hello@hushcircle.com", "Product Feedback")} C={C} />
            <Body C={C}>
              We cannot respond to every feedback message individually, but we read them all and discuss them in our weekly product reviews. Your voice directly shapes what we build next.
            </Body>
          </Section>

          <Section title="Partnerships & Press" emoji="🤝" C={C}>
            <Body C={C}>
              HushCircle is open to partnerships with mental health organizations, support communities, and mission-aligned services. If you represent an organization interested in working together, please get in touch.
            </Body>
            <ContactCard emoji="💼" title="Partnerships & press" detail="partnerships@hushcircle.com" badge="Business inquiries" onPress={() => openEmail("partnerships@hushcircle.com")} C={C} />
          </Section>

          <View style={S.footer}>
            <Text style={S.footerDivider}>— — —</Text>
            <Text style={S.footerText}>
              Whatever brings you here — a bug, a question, a concern, or a kind word — we are glad you reached out.
            </Text>
            <Text style={[S.footerText, { marginTop: 16, fontStyle: "italic" }]}>
              Thank you for being part of HushCircle.
            </Text>
          </View>

        </View>
      </Animated.ScrollView>
    </View>
  );
}

function Section({ title, emoji, children, C }) {
  return (
    <View style={{ marginBottom: 36 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
        <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 20, flex: 1 }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Body({ children, C }) {
  return (
    <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, lineHeight: 24, marginBottom: 12 }}>
      {children}
    </Text>
  );
}

function Rule({ emoji, label, children, C }) {
  return (
    <View style={{ backgroundColor: C.cardAlt || C.inputBg, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
        <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 13 }}>{label}</Text>
      </View>
      <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 21 }}>{children}</Text>
    </View>
  );
}

function ContactCard({ emoji, title, detail, badge, onPress, C }) {
  return (
    <TouchableOpacity
      style={{ backgroundColor: C.accentGlow, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.accentMuted, flexDirection: "row", alignItems: "center", gap: 14 }}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.accent + "20", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 14, marginBottom: 2 }}>{title}</Text>
        <Text style={{ color: C.accentSoft, fontFamily: "Nunito_500Medium", fontSize: 13 }}>{detail}</Text>
      </View>
      <View style={{ backgroundColor: C.accent + "20", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }}>
        <Text style={{ color: C.accentSoft, fontFamily: "Nunito_600SemiBold", fontSize: 10 }}>{badge}</Text>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    floatingHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: C.card, paddingTop: 52, paddingBottom: 12, paddingHorizontal: 60, borderBottomWidth: 1, borderBottomColor: C.border, alignItems: "center" },
    floatingTitle: { color: C.text, fontFamily: "Nunito_700Bold", fontSize: 16 },
    topBar: { position: "absolute", top: 52, left: 16, zIndex: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card + "EE", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.border },
    scroll: { paddingBottom: 60 },
    hero: { backgroundColor: C.card, paddingTop: 100, paddingBottom: 36, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: C.border, alignItems: "center" },
    heroIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.accent + "18", borderWidth: 1.5, borderColor: C.accent + "33", justifyContent: "center", alignItems: "center", marginBottom: 16 },
    heroTitle: { color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 30, textAlign: "center", marginBottom: 14 },
    heroSub: { color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, lineHeight: 23, textAlign: "center", marginBottom: 20 },
    heroBadge: { backgroundColor: C.accentGlow, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: C.accentMuted },
    heroBadgeText: { color: C.accentSoft, fontFamily: "Nunito_600SemiBold", fontSize: 12 },
    body: { paddingHorizontal: 20, paddingTop: 28 },
    footer: { marginTop: 8, paddingTop: 28, borderTopWidth: 1, borderTopColor: C.border, alignItems: "center", paddingBottom: 20 },
    footerDivider: { color: C.border, fontSize: 18, marginBottom: 16 },
    footerText: { color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 20, textAlign: "center" },
    footerLink: { color: C.accentSoft, fontFamily: "Nunito_600SemiBold" },
  });
}