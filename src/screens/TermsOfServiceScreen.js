/**
 * TermsOfServiceScreen.js
 */

import { useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Animated, Linking, StyleSheet,
} from "react-native";
import Svg, { Path, Polyline, Line, Rect, Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

// ── Hero SVG icon ──────────────────────────────────────────────────────────

function HeroClipboardIcon({ size = 52, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="8" y="2" width="8" height="4" rx="1" ry="1"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="9" y1="10" x2="15" y2="10" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1="9" y1="14" x2="15" y2="14" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1="9" y1="18" x2="12" y2="18" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

// ── Back arrow SVG ─────────────────────────────────────────────────────────

function BackArrowIcon({ size = 20, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="15 18 9 12 15 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function TermsOfServiceScreen() {
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
        <Text style={S.floatingTitle}>Terms of Service</Text>
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
        {/* Hero */}
        <View style={S.hero}>
          <View style={S.heroIconWrap}>
            <HeroClipboardIcon size={44} color={C.accent} />
          </View>
          <Text style={S.heroTitle}>Terms of Service</Text>
          <Text style={S.heroSub}>
            These terms form the agreement between you and HushCircle. We have written them in plain language on purpose — so you actually understand what you are agreeing to.
          </Text>
          <View style={S.heroBadge}>
            <Text style={S.heroBadgeText}>Last updated: January 2025  ·  Effective immediately</Text>
          </View>
        </View>

        <View style={S.body}>

          <Section title="Agreement & Acceptance" emoji="🤝" C={C}>
            <Body C={C}>
              By creating an account on HushCircle — or by using the app in any capacity — you confirm that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use HushCircle.
            </Body>
            <Body C={C}>
              We may update these terms from time to time. When we do, we will notify you via in-app notification and email at least 14 days before changes take effect. Continued use of HushCircle after that date means you accept the updated terms. If you disagree, you can close your account at any time.
            </Body>
            <CallOut emoji="📌" title="Plain-language summary:" C={C}>
              Using HushCircle means you agree to these rules. We'll warn you before changing them. You can leave whenever you want.
            </CallOut>
          </Section>

          <Section title="Eligibility" emoji="🎂" C={C}>
            <Body C={C}>
              HushCircle is available to individuals aged 13 and older. By creating an account, you confirm that you meet this requirement. If you are between 13 and 18 years of age, you confirm that your parent or legal guardian has reviewed and agreed to these terms on your behalf.
            </Body>
            <Body C={C}>
              HushCircle is available globally. However, if the laws of your country prohibit you from using services like ours, you are responsible for understanding and complying with those laws. We do not knowingly facilitate access in jurisdictions where our service is prohibited.
            </Body>
            <Rule emoji="🚫" label="You may not use HushCircle if:" C={C}>
              You are under 13 years of age. You are a previously suspended or banned user attempting to re-register. You intend to use the platform to harm, exploit, or deceive other users.
            </Rule>
          </Section>

          <Section title="Your Account" emoji="👤" C={C}>
            <Body C={C}>
              When you create a HushCircle account, you are responsible for maintaining the security of your credentials. You may not share your account with anyone else. You are responsible for all activity that occurs under your account.
            </Body>
            <Rule emoji="🔐" label="Account security responsibilities:" C={C}>
              Use a strong, unique password that you do not use on other services. Do not share your password or allow others to access your account. Notify us immediately at support@hushcircle.com if you suspect unauthorized access. We are not liable for loss resulting from unauthorized account access caused by your failure to protect your credentials.
            </Rule>
            <Body C={C}>
              You may maintain up to three (3) HushCircle accounts per device. Each account must be created and operated in good faith, with genuine personal intent. Operating multiple accounts to circumvent bans, inflate engagement, or manipulate the community is strictly prohibited and will result in all associated accounts being permanently suspended.
            </Body>
          </Section>

          <Section title="Your Content" emoji="✍️" C={C}>
            <Body C={C}>
              You retain full ownership of all content you post on HushCircle — your posts, comments, and anything else you share. We do not claim ownership of your content.
            </Body>
            <Rule emoji="📜" label="License you grant us:" C={C}>
              By posting content on HushCircle, you grant us a limited, non-exclusive, royalty-free license to display, distribute, and store your content within the HushCircle platform for the purpose of operating the service. This license ends when you delete your content or close your account.
            </Rule>
            <Rule emoji="⚠️" label="Your responsibilities:" C={C}>
              You are solely responsible for the content you post. You confirm that your content does not infringe on anyone else's copyright, trademark, or other intellectual property rights. You confirm that your content does not violate any applicable laws. You understand that content you post may be seen by all HushCircle users (unless restricted to a specific Circle).
            </Rule>
            <Body C={C}>
              We do not pre-screen content before it is posted. However, we reserve the right to remove content that violates our Community Guidelines and to suspend accounts that repeatedly post violating content.
            </Body>
          </Section>

          <Section title="Prohibited Uses" emoji="🚫" C={C}>
            <Body C={C}>
              Using HushCircle comes with the responsibility to use it honestly and in good faith. The following are strictly prohibited and will result in enforcement action, up to and including permanent account termination and referral to law enforcement:
            </Body>
            <Rule emoji="❌" label="You may not use HushCircle to:" C={C}>
              Harass, bully, intimidate, or threaten any person. Post content that glorifies, encourages, or instructs self-harm or suicide. Impersonate another person, account, or organization. Collect, scrape, or harvest personal information about other users. Reverse-engineer, decompile, or attempt to access the HushCircle source code. Introduce malware, viruses, or any code designed to disrupt or harm the service. Use automated bots, scripts, or tools to create accounts or interact with the platform. Violate any applicable local, national, or international law or regulation.
            </Rule>
            <Body C={C}>
              We continuously monitor for prohibited behavior using a combination of automated systems and human review. If you witness a prohibited use, please report it immediately using the in-app report feature.
            </Body>
          </Section>

          <Section title="HushCircle Is Not a Crisis Service" emoji="⚕️" C={C}>
            <Body C={C}>
              This is important. HushCircle is a peer support community. It is not a mental health service, a clinical therapy platform, or a crisis intervention tool. The people you interact with on HushCircle are fellow community members — not licensed therapists, counselors, or medical professionals.
            </Body>
            <Body C={C}>
              Nothing on HushCircle constitutes medical advice, psychological diagnosis, or professional counseling. Do not treat content posted by other users, or any in-app notifications or resources, as a substitute for professional mental health care.
            </Body>
            <CallOut emoji="🆘" title="In a mental health emergency:" C={C}>
              {"Please contact professional services immediately.\n\nSuicide & Crisis Lifeline: 988 (US)\nCrisis Text Line: Text HOME to 741741\nEmergency services: 911 (US) or your local equivalent\nInternational resources: iasp.info/resources/Crisis_Centres"}
            </CallOut>
          </Section>

          <Section title="Our Service & Availability" emoji="⚙️" C={C}>
            <Body C={C}>
              We work hard to keep HushCircle available and reliable, but we cannot guarantee uninterrupted access. The service may be unavailable during maintenance windows, due to technical failures, or for reasons beyond our control.
            </Body>
            <Rule emoji="📢" label="We reserve the right to:" C={C}>
              Modify, suspend, or discontinue any feature of HushCircle at any time. Change the pricing of premium features with at least 30 days' notice. Terminate or suspend access to accounts that violate these terms. Take any other action necessary to protect the safety and integrity of the platform.
            </Rule>
            <Body C={C}>
              We will always endeavor to give reasonable notice before making changes that materially affect how you use the service. However, in cases involving safety, security, or legal compliance, we may act immediately without prior notice.
            </Body>
          </Section>

          <Section title="Intellectual Property" emoji="©️" C={C}>
            <Body C={C}>
              The HushCircle brand, app design, logo, interface, and all original content created by our team are owned exclusively by HushCircle and protected by copyright, trademark, and other intellectual property laws.
            </Body>
            <Body C={C}>
              You may not copy, reproduce, modify, or distribute any part of HushCircle's intellectual property without our express written permission. User-generated content is owned by the users who create it, subject to the license described in the "Your Content" section above.
            </Body>
          </Section>

          <Section title="Limitation of Liability" emoji="⚖️" C={C}>
            <Body C={C}>
              HushCircle is provided "as is" without warranties of any kind, express or implied. We do not warrant that the service will be error-free, uninterrupted, or free from harmful components.
            </Body>
            <Rule emoji="📉" label="Our liability is limited to:" C={C}>
              The amount you have paid us in the 12 months prior to the claim giving rise to liability. For free users, this is zero — and we acknowledge that this limitation reflects the nature of a free service, not our disregard for your interests.
            </Rule>
            <Body C={C}>
              We are not liable for content posted by other users. We are not liable for the outcome of peer support interactions on the platform. We are not liable for mental health outcomes or decisions made by users based on community content.
            </Body>
            <Body C={C}>
              Some jurisdictions do not allow limitations on implied warranties or exclusions of certain damages. In those jurisdictions, our liability is limited to the maximum extent permitted by law.
            </Body>
          </Section>

          <Section title="Governing Law & Disputes" emoji="🏛️" C={C}>
            <Body C={C}>
              These terms are governed by and construed in accordance with applicable law. We encourage you to contact us directly to resolve any dispute before pursuing formal action — most issues can be resolved quickly and informally.
            </Body>
            <Rule emoji="📩" label="Dispute resolution process:" C={C}>
              Step 1: Contact support@hushcircle.com with a description of your concern. We will respond within 5 business days. Step 2: If unresolved, disputes may be submitted to binding arbitration in accordance with applicable arbitration rules. Step 3: Nothing in these terms prevents you from filing a complaint with your local consumer protection authority.
            </Rule>
            <Body C={C}>
              You agree that any claim against HushCircle must be brought individually, not as part of a class action. This waiver applies to the maximum extent permitted by your local law.
            </Body>
          </Section>

          <Section title="Termination" emoji="🔚" C={C}>
            <Body C={C}>
              You may close your account at any time from the Settings screen. Upon closure, your personal data will be deleted in accordance with our Privacy Policy.
            </Body>
            <Body C={C}>
              We may suspend or terminate your account at any time if you violate these terms or our Community Guidelines. You will be notified where legally required and given the opportunity to appeal where possible.
            </Body>
            <Body C={C}>
              Upon termination, all licenses granted to you under these terms immediately expire. Provisions that by their nature should survive termination — including intellectual property rights, limitation of liability, and dispute resolution — will remain in effect.
            </Body>
          </Section>

          <View style={S.footer}>
            <Text style={S.footerDivider}>— — —</Text>
            <Text style={S.footerText}>Questions about these terms?</Text>
            <Text style={[S.footerText, { marginTop: 6 }]}>
              <Text style={S.footerLink} onPress={() => Linking.openURL("mailto:support@hushcircle.com")}>
                support@hushcircle.com
              </Text>
            </Text>
            <Text style={[S.footerText, { marginTop: 16, fontStyle: "italic" }]}>
              We built HushCircle to help people — not to trap them in fine print.
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