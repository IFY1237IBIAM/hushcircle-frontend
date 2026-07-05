/**
 * CommunityGuidelinesScreen.js
 */

import { useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Animated, Linking, StyleSheet,
} from "react-native";
import Svg, { Path, Polyline, Line, Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";

function HeroShieldIcon({ size = 44, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        fill={color + "22"} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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

export default function CommunityGuidelinesScreen() {
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
        <Text style={S.floatingTitle}>Community Guidelines</Text>
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
            <HeroShieldIcon size={44} color={C.accent} />
          </View>
          <Text style={S.heroTitle}>Community Guidelines</Text>
          <Text style={S.heroSub}>
            HushCircle is a safe space for people navigating difficult emotions.
            These guidelines protect that space — for you, and for everyone here.
          </Text>
          <View style={S.heroBadge}>
            <Text style={S.heroBadgeText}>Last updated: January 2025</Text>
          </View>
        </View>

        <View style={S.body}>

          <Section title="Our Core Promise" emoji="🛡️" C={C}>
            <Body C={C}>
              HushCircle was built on one fundamental belief: every person deserves a place to be heard without judgment. Whether you are grieving a loss, managing anxiety, processing heartbreak, or simply carrying the weight of a hard day — you belong here.
            </Body>
            <Body C={C}>
              Our platform is anonymous by design. You share what you feel comfortable sharing — nothing more, nothing less. Your real name, location, workplace, and personal identity are never required, never asked, and never stored.
            </Body>
            <Body C={C}>
              In return, we ask that you actively help protect this space by reading, understanding, and following the guidelines below. This is a shared responsibility. No moderation system is perfect — but a community that genuinely cares for one another is.
            </Body>
            <CallOut emoji="💜" title="Remember" C={C}>
              Behind every post is a real human being in a real moment of vulnerability. Read everything with that in mind.
            </CallOut>
          </Section>

          <Section title="Be Kind. Always." emoji="🤝" C={C}>
            <Body C={C}>
              Kindness is not optional on HushCircle — it is the foundation. Every person here is going through something. Even if you cannot see their pain, it is real. Treat every post and comment as if it came from someone you genuinely love, because for someone else, it might.
            </Body>
            <Rule emoji="✅" label="What kindness looks like here:" C={C}>
              Offering support even when you disagree with someone's choices. Using "I feel" statements rather than "you should." Acknowledging someone's experience before offering advice. Celebrating small wins with the same energy you would give to big ones.
            </Rule>
            <Rule emoji="🚫" label="What we do not allow:" C={C}>
              Dismissive comments like "just get over it" or "others have it worse." Unsolicited opinions on someone's lifestyle or decisions. Comparisons that minimize someone's suffering. Tone-policing someone who is in distress.
            </Rule>
            <Body C={C}>
              If you are having a hard day and find it difficult to be kind, it is okay to step back and simply read rather than post. Taking care of yourself is also part of taking care of this community.
            </Body>
          </Section>

          <Section title="Zero Tolerance: Harassment & Bullying" emoji="⛔" C={C}>
            <Body C={C}>
              Any form of targeted harassment, intimidation, or bullying results in immediate account suspension — no warnings, no second chances. HushCircle is categorically not a place for cruelty. This applies to posts, comments, direct messages, and Circle chats equally.
            </Body>
            <Rule emoji="🚫" label="Prohibited behavior includes:" C={C}>
              Personal attacks on someone's character, appearance, or identity. Repeatedly targeting the same user across multiple posts or contexts. Coordinating with others to mock or pile on a specific person. Threatening to expose, embarrass, or harm someone. Using alternative accounts to harass after being suspended.
            </Rule>
            <Body C={C}>
              If you experience harassment, tap the Report button on the offending post or comment immediately. Do not engage or retaliate — this can complicate the review process. Our team reviews all harassment reports within 24 hours, with priority review for threats.
            </Body>
            <Body C={C}>
              You can also block a user directly from any post. Blocked users cannot see your posts, comment on your content, or send you messages. Blocking is immediate and silent.
            </Body>
          </Section>

          <Section title="Self-Harm & Crisis Content" emoji="🩺" C={C}>
            <Body C={C}>
              This is our most critical guideline. HushCircle is a peer support community — not a clinical crisis service. While we deeply care about the wellbeing of every member, we are not a substitute for professional mental health care, emergency services, or trained crisis counselors.
            </Body>
            <Rule emoji="🚫" label="Content we never allow:" C={C}>
              Any content that encourages, glorifies, romanticizes, or provides instructions for self-harm or suicide. Specific details about methods, dosages, locations, or plans. Content explicitly designed to trigger or escalate another person's mental health crisis. "Challenges" or trends that normalize dangerous behavior.
            </Rule>
            <Rule emoji="✅" label="Content we actively support:" C={C}>
              Sharing your struggles honestly, including dark feelings. Expressing hopelessness while seeking connection and support. Discussing mental health as a topic openly, critically, and safely. Sharing recovery journeys — both the wins and the setbacks.
            </Rule>
            <Body C={C}>
              Our platform uses automated content moderation that scans for crisis signals in real time. If your post is flagged, you will be shown crisis resources and given the option to connect with support. This is not punishment — it is care. The flag does not automatically delete your post or report you to anyone.
            </Body>
            <CallOut emoji="🆘" title="If you are in crisis right now:" C={C}>
              {"Suicide & Crisis Lifeline: Call or text 988 (US)\nCrisis Text Line: Text HOME to 741741\nInternational Association: iasp.info/resources/Crisis_Centres\nEmergency services: 911 or your local equivalent\n\nYou are not alone. Please reach out."}
            </CallOut>
          </Section>

          <Section title="Respect Anonymity & Privacy" emoji="🔒" C={C}>
            <Body C={C}>
              Anonymity is what makes HushCircle work. Many of our members share things here they cannot share anywhere else — in their families, friendships, or workplaces. They do this because they trust that their identity is protected. Protecting that trust is a collective responsibility.
            </Body>
            <Rule emoji="🚫" label="These actions are strictly prohibited:" C={C}>
              Attempting to identify or expose another user's real name, location, employer, or any personal details. Sharing screenshots of posts or comments outside the app without explicit consent. Asking another user for identifying information — phone number, social media handles, or location. Correlating a user's HushCircle pseudonym with their presence on other platforms.
            </Rule>
            <Body C={C}>
              Violations of this rule are treated with the utmost seriousness. Doxxing — the act of researching and publicly exposing private information about someone — results in permanent suspension and, where applicable, referral to law enforcement.
            </Body>
            <Body C={C}>
              This rule also applies to your own information. We encourage you not to share personally identifying details in your posts. You can always share your experience without revealing who you are.
            </Body>
          </Section>

          <Section title="No Spam or Self-Promotion" emoji="🤖" C={C}>
            <Body C={C}>
              The HushCircle feed is a curated space for authentic emotional sharing. It is not a marketing channel, a promotional platform, or a place for content that serves interests other than genuine peer support.
            </Body>
            <Rule emoji="🚫" label="Prohibited content includes:" C={C}>
              Advertisements, promotional links, or affiliate marketing. Repetitive or copy-pasted posts. Fake or coordinated accounts designed to manipulate the feed or inflate engagement. AI-generated content presented as genuine personal experience. Recruitment for external groups, apps, or services. Unsolicited links to external websites or social media profiles.
            </Rule>
            <Body C={C}>
              If you run a legitimate mental health resource, support group, or service and want to be present on HushCircle, please contact us at support@hushcircle.com to discuss partnership options.
            </Body>
          </Section>

          <Section title="Circles (Group Spaces)" emoji="⭕" C={C}>
            <Body C={C}>
              Circles are moderated group spaces organized around shared experiences — grief, anxiety, chronic illness, recovery, and more. Each Circle is guided by a Circle Keeper, a trusted community member who helps maintain the safety and tone of that space.
            </Body>
            <Rule emoji="✅" label="Circle members are expected to:" C={C}>
              Follow all community guidelines within circle spaces. Respect the Circle Keeper's guidance and decisions. Support fellow members and contribute meaningfully to the space.
            </Rule>
            <Rule emoji="⚠️" label="Circle Keepers have the authority to:" C={C}>
              Mute or remove members who repeatedly violate guidelines. Temporarily close a Circle if the environment becomes unsafe. Pin crisis resources for members who need immediate support. Escalate serious violations to the HushCircle moderation team.
            </Rule>
            <Body C={C}>
              Circle Keepers are volunteers, not professional moderators. Please be patient with them. If you believe a Circle Keeper has acted unfairly, you can appeal directly to our team at support@hushcircle.com.
            </Body>
          </Section>

          <Section title="Enforcement & Violations" emoji="⚖️" C={C}>
            <Body C={C}>
              We believe in proportional enforcement. Not every mistake warrants the same response, and our system is designed to educate first, escalate when necessary. Here is how violations are handled:
            </Body>
            <Rule emoji="1️⃣" label="First violation:" C={C}>
              The offending post or comment is removed. You receive an in-app notification explaining what was removed, which guideline it violated, and why. Your violation count increments to 1 of 3.
            </Rule>
            <Rule emoji="2️⃣" label="Second violation:" C={C}>
              Post removed. Notification sent. Violation count at 2 of 3. You receive a clear warning: one more violation will result in a temporary account suspension.
            </Rule>
            <Rule emoji="3️⃣" label="Third violation:" C={C}>
              Post removed. Account suspended. You may submit an appeal through the app immediately. Appeals are reviewed within 48 hours by a human moderator — not an automated system. Approved appeals restore your account. Denied appeals include an explanation.
            </Rule>
            <Rule emoji="⚡" label="Immediate suspension — no warnings:" C={C}>
              Doxxing or revealing someone's private information. Sharing content that encourages or instructs self-harm or suicide. Coordinated harassment or brigading. Operating fake or bot accounts. Threatening violence or harm against any person.
            </Rule>
            <Body C={C}>
              Suspension lengths vary by severity: 7 days for first suspensions, 30 days for second, permanent for third or for immediate-suspension offenses. Permanent bans are reviewed by a senior moderator before being finalized.
            </Body>
          </Section>

          <Section title="Reporting Content" emoji="🚩" C={C}>
            <Body C={C}>
              Reporting is one of the most powerful things you can do to keep HushCircle safe. When you see something that violates these guidelines, please report it. Do not engage with it, argue with it, or call it out publicly — simply report and move on.
            </Body>
            <Body C={C}>
              Posts flagged by 3 or more users are automatically elevated for priority review. All reports are reviewed by a human moderator — we do not rely solely on automated systems for final decisions.
            </Body>
            <Body C={C}>
              Misusing the report system to target users you personally dislike — when no guideline has been violated — is itself a violation. False reporting is taken seriously and will result in enforcement action against the reporter.
            </Body>
          </Section>

          <View style={S.footer}>
            <Text style={S.footerDivider}>— — —</Text>
            <Text style={S.footerText}>
              These guidelines are reviewed and updated regularly. Continued use of HushCircle constitutes acceptance of the current version.
            </Text>
            <Text style={[S.footerText, { marginTop: 10 }]}>
              Questions about a specific situation?{"\n"}
              <Text style={S.footerLink} onPress={() => Linking.openURL("mailto:support@hushcircle.com")}>
                support@hushcircle.com
              </Text>
            </Text>
            <Text style={[S.footerText, { marginTop: 16, fontStyle: "italic" }]}>
              Thank you for helping us make HushCircle a place where people feel safe to be human.
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