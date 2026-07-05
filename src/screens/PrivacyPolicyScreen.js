/**
 * PrivacyPolicyScreen.js
 */

import { useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Animated, Linking, StyleSheet,
} from "react-native";
import Svg, { Path, Polyline, Line, Rect, Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

function HeroLockIcon({ size = 44, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
        fill={color + "22"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="16" r="1" fill={color} />
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

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const { colors: C } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const S = makeStyles(C);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80], outputRange: [0, 1], extrapolate: "clamp",
  });

  return (
    <View style={S.container}>
      <Animated.View style={[S.floatingHeader, { opacity: headerOpacity }]}>
        <Text style={S.floatingTitle}>Privacy Policy</Text>
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
            <HeroLockIcon size={44} color={C.accent} />
          </View>
          <Text style={S.heroTitle}>Privacy Policy</Text>
          <Text style={S.heroSub}>
            Your privacy is not a feature — it is the architecture of HushCircle.
            This policy explains, in plain language, exactly what we collect, why we collect it, and how we protect it.
          </Text>
          <View style={S.heroBadge}>
            <Text style={S.heroBadgeText}>Last updated: January 2025  ·  Effective immediately</Text>
          </View>
        </View>

        <View style={S.body}>

          <Section title="Our Privacy Philosophy" emoji="🧭" C={C}>
            <Body C={C}>
              HushCircle was designed from the ground up with privacy as a first principle, not an afterthought. We serve people in vulnerable moments — and that comes with an extraordinary responsibility. We do not monetize your data. We do not build advertising profiles. We do not sell, rent, or broker your information to any third party.
            </Body>
            <Body C={C}>
              Our business model is simple: we charge for premium features, not for access to your personal information. That alignment matters. When our revenue does not depend on your data, we have no incentive to collect more than we need.
            </Body>
            <CallOut emoji="🎯" title="The short version:" C={C}>
              We collect the minimum data needed to run a safe, functional app. We protect it rigorously. We never sell it. You can delete it completely at any time.
            </CallOut>
          </Section>

          <Section title="What We Collect" emoji="📋" C={C}>
            <Body C={C}>
              We are deliberate about what we collect. Every data point we store exists because it serves a specific, necessary function. Here is a complete breakdown:
            </Body>
            <Rule emoji="📧" label="Account data" C={C}>
              Your email address — used solely for account access, password recovery, and critical security notifications. We do not use your email for marketing without explicit opt-in. Your pseudonym — the name you chose, displayed within the app. Your encrypted password hash — we never store your raw password; it is hashed using bcrypt before storage.
            </Rule>
            <Rule emoji="📝" label="Content you create" C={C}>
              Posts, comments, reactions, and check-ins that you actively submit. Circle memberships and the content you share within those spaces. Settings and preferences you configure within the app.
            </Rule>
            <Rule emoji="🔔" label="Technical data" C={C}>
              Push notification token — required to deliver notifications you have opted into. App version and OS type — used exclusively for debugging and compatibility support. Anonymized crash reports — help us identify and fix bugs. These contain no personal content.
            </Rule>
            <Rule emoji="📊" label="Usage analytics (anonymized)" C={C}>
              Aggregate feature usage statistics — for example, "60% of users use Dark Mode" — used to improve the product. These are never tied to individual user profiles or accounts.
            </Rule>
          </Section>

          <Section title="What We Do NOT Collect" emoji="🚫" C={C}>
            <Body C={C}>
              We believe transparency about what we do not collect is just as important as what we do. The following information is never collected, stored, or accessed by HushCircle under any circumstances:
            </Body>
            <Rule emoji="❌" label="Never collected:" C={C}>
              Your real name, age, or any government-issued identity. Your precise or approximate location — we have no access to GPS or location services. Your device contacts, camera roll, or microphone. Browsing history or behavior outside the HushCircle app. Financial information beyond what payment processors (if applicable) handle independently. Third-party advertising identifiers or tracking cookies.
            </Rule>
            <Body C={C}>
              We request only the device permissions that are strictly necessary for features you actively use. You will always be informed and asked for consent before any permission is accessed.
            </Body>
          </Section>

          <Section title="How We Use Your Data" emoji="⚙️" C={C}>
            <Body C={C}>
              Every use of your data has a specific, bounded purpose. We do not use your data beyond what is described here.
            </Body>
            <Rule emoji="🔧" label="To operate HushCircle:" C={C}>
              Authenticating your account. Displaying your posts and comments to the community. Routing push notifications you have enabled. Enforcing community guidelines and responding to reports.
            </Rule>
            <Rule emoji="🛡️" label="To keep the platform safe:" C={C}>
              Detecting and removing content that violates our guidelines. Identifying and suspending accounts engaged in harassment, spam, or abuse. Responding to crisis signals in posts and connecting users with resources.
            </Rule>
            <Rule emoji="📈" label="To improve the product:" C={C}>
              Anonymized usage data helps us understand what features are working and which need improvement. We never run A/B tests on mental health content or safety features — these are fixed and tested by our team before release.
            </Rule>
            <Rule emoji="⚖️" label="To comply with legal obligations:" C={C}>
              We may retain or disclose data when required by law — for example, in response to a valid court order or subpoena. We will notify affected users when legally permitted to do so.
            </Rule>
          </Section>

          <Section title="Data Sharing" emoji="🤝" C={C}>
            <Body C={C}>
              We do not share your personal data with third parties for commercial purposes. Full stop. The following is a complete list of circumstances under which your data may leave HushCircle's infrastructure:
            </Body>
            <Rule emoji="🛠️" label="Infrastructure providers:" C={C}>
              We use carefully vetted cloud infrastructure to host the app and store data securely. These providers process data only according to our instructions and are contractually prohibited from using your data for any other purpose. They are GDPR-compliant and maintain SOC 2 certifications.
            </Rule>
            <Rule emoji="🚨" label="Legal requirements:" C={C}>
              We will disclose data to law enforcement or courts when compelled by a legally valid order. We challenge overbroad or legally deficient requests. We will notify you when legally permitted.
            </Rule>
            <Rule emoji="💼" label="Business transfers:" C={C}>
              In the event of a merger, acquisition, or sale of HushCircle, user data may be transferred. You will be notified in advance, given the opportunity to delete your account, and any new owner would be bound by this policy or required to obtain fresh consent.
            </Rule>
            <Body C={C}>
              We will never sell your data to advertisers, data brokers, or any commercial third party. This is a core commitment, not a contingent policy.
            </Body>
          </Section>

          <Section title="Data Security" emoji="🔐" C={C}>
            <Body C={C}>
              We take the security of your data seriously and implement multiple layers of protection:
            </Body>
            <Rule emoji="🔑" label="Encryption:" C={C}>
              All data in transit is protected by TLS 1.3 encryption. Passwords are hashed using bcrypt with a work factor appropriate to current hardware. Sensitive fields in our database are encrypted at rest.
            </Rule>
            <Rule emoji="🏗️" label="Infrastructure:" C={C}>
              Our servers are hosted in SOC 2 Type II compliant data centers. Access to production databases is restricted to a small team and requires multi-factor authentication. We conduct regular security audits and penetration testing.
            </Rule>
            <Rule emoji="🚨" label="Incident response:" C={C}>
              In the event of a data breach, we will notify affected users within 72 hours of discovery — or sooner where legally required. Notifications will be sent to your registered email and displayed in-app.
            </Rule>
            <Body C={C}>
              No system is completely impenetrable. If you discover a security vulnerability, please report it responsibly to security@hushcircle.com. We appreciate and respond to all responsible disclosures.
            </Body>
          </Section>

          <Section title="Your Rights & Controls" emoji="⚡" C={C}>
            <Body C={C}>
              You have meaningful control over your data. These rights apply regardless of where you are in the world:
            </Body>
            <Rule emoji="👁️" label="Right to access:" C={C}>
              You can request a complete export of all data we hold about you at any time by contacting support@hushcircle.com. We will fulfill your request within 30 days.
            </Rule>
            <Rule emoji="✏️" label="Right to correction:" C={C}>
              You can update your email, pseudonym, and settings at any time within the app. If you believe other data about you is inaccurate, contact us and we will investigate.
            </Rule>
            <Rule emoji="🗑️" label="Right to deletion:" C={C}>
              Deleting your account permanently removes all your posts, comments, check-ins, reactions, and account data from our active systems within 30 days. Anonymized aggregate data derived from your usage (e.g., feature statistics) cannot be individually removed as it contains no personal identifiers.
            </Rule>
            <Rule emoji="📤" label="Right to portability:" C={C}>
              You can request your data in a machine-readable format (JSON). Contact support@hushcircle.com with the subject "Data Export Request."
            </Rule>
            <Rule emoji="🛑" label="Right to object:" C={C}>
              You can opt out of all non-essential data processing at any time by adjusting your settings or contacting us. Essential processing (authentication, security) cannot be disabled while your account remains active.
            </Rule>
          </Section>

          <Section title="Data Retention" emoji="🗂️" C={C}>
            <Body C={C}>
              We retain your data only as long as necessary for the purposes described in this policy:
            </Body>
            <Rule emoji="📁" label="Active accounts:" C={C}>
              Your data is retained as long as your account is active. We consider an account inactive after 24 months of no sign-ins and will notify you before archiving.
            </Rule>
            <Rule emoji="🗑️" label="Deleted accounts:" C={C}>
              Upon account deletion, your personal data is removed from active systems within 30 days and from backups within 90 days. Some anonymized data (never linked to your identity) may be retained in aggregate analytics.
            </Rule>
            <Rule emoji="⚖️" label="Legal holds:" C={C}>
              In some cases, we may be required to retain certain data for longer periods to comply with legal obligations or to resolve disputes. We will inform you if this applies to your data.
            </Rule>
          </Section>

          <Section title="Children's Privacy" emoji="👶" C={C}>
            <Body C={C}>
              HushCircle is intended for users aged 13 and older. We do not knowingly collect personal information from children under the age of 13. If we become aware that a child under 13 has provided us with personal information, we will delete that account and associated data immediately.
            </Body>
            <Body C={C}>
              If you are a parent or guardian and believe your child has created an account on HushCircle, please contact us immediately at support@hushcircle.com.
            </Body>
          </Section>

          <Section title="Changes to This Policy" emoji="📌" C={C}>
            <Body C={C}>
              We will update this privacy policy from time to time as our product evolves or as legal requirements change. When we make material changes, we will notify you via in-app notification and email at least 14 days before the changes take effect.
            </Body>
            <Body C={C}>
              Continued use of HushCircle after the effective date of changes constitutes acceptance of the updated policy. If you disagree with any changes, you may delete your account at any time.
            </Body>
          </Section>

          <View style={S.footer}>
            <Text style={S.footerDivider}>— — —</Text>
            <Text style={S.footerText}>Questions, requests, or concerns about your privacy?</Text>
            <Text style={[S.footerText, { marginTop: 6 }]}>
              <Text style={S.footerLink} onPress={() => Linking.openURL("mailto:privacy@hushcircle.com")}>
                privacy@hushcircle.com
              </Text>
              {"  ·  "}
              <Text style={S.footerLink} onPress={() => Linking.openURL("mailto:support@hushcircle.com")}>
                support@hushcircle.com
              </Text>
            </Text>
            <Text style={[S.footerText, { marginTop: 16, fontStyle: "italic" }]}>
              Your trust is the most important thing we protect.
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

function CallOut({ emoji, title, children, C }) {
  return (
    <View style={{ backgroundColor: C.accent + "15", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.accent + "44" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
        <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 14 }}>{title}</Text>
      </View>
      <Text style={{ color: C.text, fontFamily: "Nunito_500Medium", fontSize: 13, lineHeight: 22 }}>{children}</Text>
    </View>
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