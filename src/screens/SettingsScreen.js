/**
 * SettingsScreen.js — Updated with multi-account Switch / Add Account section.
 *
 * Changes from original:
 *   1. Imported useAuth additions: accounts, switchAccount, removeAccount
 *   2. Added <SwitchAccountSection> component rendered above "Danger Zone"
 *   3. Added SwitchAccountSection styles
 *
 * Everything else is identical to the original.
 */

import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, TextInput,
  Alert, ActivityIndicator, Modal,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api/api";
import HushCircleSpinner from "../components/HushCircleSpinner";
import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";
import useSpinner from "../hooks/useSpinner";
import NoNetworkOverlay from "../components/NoNetworkOverlay";
// Module-level color fallbacks for icon defaults (theme-aware colors used inside component)
const DARK = {
  accent: "#9B6FD4",
  textMuted: "#8B7FA8",
  error: "#D4607A",
};



const APP_VERSION = "1.0.0";

const ABOUT_CONTENT = {
  "Community Guidelines": `HushCircle is a safe space built on kindness, empathy, and mutual support. By using this app, you agree to:\n\n💜 Be kind and supportive — this community is for people going through difficult times. Treat everyone with care.\n\n🚫 No harassment or bullying — any targeted attacks, insults, or intimidation will result in immediate suspension.\n\n🩺 No self-harm encouragement — do not encourage, glorify, or provide instructions for self-harm or suicide. If someone is in crisis, direct them to professional help.\n\n🔒 Respect privacy — do not share identifying information about other users. Anonymity is sacred here.\n\n🤖 No spam — do not post repetitive, promotional, or irrelevant content.\n\n📢 Report, don't engage — if you see harmful content, use the report button. Do not engage or retaliate.\n\nViolating these guidelines results in post removal (3 violations = account suspension). Appeals are reviewed within 48 hours.`,
  "Privacy Policy": `Last updated: 2025\n\nWhat we collect:\n• Email address (for account access only)\n• Pseudonym and posts you create\n• Reactions, comments, and check-in data\n• Device push notification token\n• App settings preferences\n\nWhat we do NOT collect:\n• Your real name\n• Location data\n• Contacts or camera access\n• Third-party tracking data\n\nHow we use your data:\n• To operate and improve HushCircle\n• To send you notifications you have opted into\n• To enforce community guidelines\n\nData sharing:\n• We never sell your data to third parties\n• We do not share data with advertisers\n• We may disclose data if required by law\n\nData deletion:\n• Deleting your account permanently removes all your data within 30 days\n• You can request early deletion by contacting support@hushcircle.com\n\nSecurity:\n• Passwords are hashed using bcrypt\n• All connections use HTTPS encryption\n• We conduct regular security reviews`,
  "Terms of Service": `Last updated: 2025\n\nBy using HushCircle, you agree to these terms:\n\nEligibility:\n• You must be at least 13 years old to use this app\n• By signing up, you confirm you meet this requirement\n\nYour content:\n• You retain ownership of all content you post\n• You grant HushCircle a license to display your content within the app\n• You are responsible for what you post\n\nOur rights:\n• We may moderate or remove content that violates our guidelines\n• We may suspend or terminate accounts for repeated violations\n• We may update these terms at any time with notice\n\nNot a crisis service:\n• HushCircle is a peer support community, not a mental health service\n• In an emergency, please contact emergency services (911) or a crisis line (988)\n• We do not provide medical or psychological advice\n\nLimitation of liability:\n• HushCircle is provided as-is without warranties\n• We are not liable for user-generated content\n• Our liability is limited to the amount you paid us (which is zero for free users)\n\nContact:\nFor questions about these terms, email support@hushcircle.com`,
  "Contact Support": `We are here to help 💜\n\n📧 Email: support@hushcircle.com\nResponse time: 24–48 hours\n\n📋 Include in your message:\n• Your pseudonym (not your real name)\n• A description of your issue\n• Screenshots if relevant\n\n🚨 For urgent safety issues:\n• Suicidal crisis: Call or text 988 (Suicide & Crisis Lifeline)\n• Emergency: Call 911\n• Crisis text line: Text HOME to 741741\n\n⚠️ Account issues:\n• Banned account: Use the in-app appeal feature\n• Forgot password: Use the reset option on the login screen\n• Data deletion: Request at support@hushcircle.com\n\n📱 Bug reports:\n• Describe the issue in detail\n• Include your device model and OS version\n• We review all reports and ship fixes weekly\n\nThank you for being part of HushCircle 💜`,
};

const AVATAR_COLORS = [
  "#9B6FD4", "#D4607A", "#6B9FD4",
  "#4CAF8F", "#D4A44C", "#E879F9",
];
function avatarColorForPseudonym(pseudonym = "") {
  return AVATAR_COLORS[(pseudonym.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

// ── Reusable row components ──────────────────────────────────────────────────

function SettingRow({ label, sub, right, onPress, danger = false, last = false }) {
  const content = (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, danger && { color: DARK.error }]}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <View style={styles.rowRight}>{right}</View>
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  return content;
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SectionCard({ children }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

// ── NEW: Switch Account Section ──────────────────────────────────────────────

/**
 * SwitchAccountSection
 *
 * Renders inside SettingsScreen between "About & Support" and "Danger Zone".
 * Shows each saved account with:
 *   - Avatar circle + pseudonym + "Active" badge or "Switch" button
 *   - "Remove" button for non-active accounts
 *   - "Add Account +" button (hidden if 3 accounts already saved)
 */
function SwitchAccountSection({ navigation, spinner }) {
  const { user, accounts, switchAccount, removeAccount } = useAuth();
  const { isConnected } = useNetwork();

  const handleSwitch = async (pseudonym) => {
    if (pseudonym === user?.pseudonym) return; // already active
    if (!isConnected) {
      Alert.alert("No connection", "Check your internet connection.");
      return;
    }

    await spinner.withSpinner(async () => {
      try {
        await switchAccount(pseudonym);
        // Small delay to let AuthContext state update before nav reset
        await new Promise((resolve) => setTimeout(resolve, 300));
        navigation.reset({ index: 0, routes: [{ name: "Main" }] });
      } catch (err) {
        if (err.message === "SESSION_EXPIRED") {
          Alert.alert(
            "Session expired",
            `@${pseudonym}'s session has expired and the account has been removed. Please add it again.`
          );
        } else {
          Alert.alert("Error", "Could not switch account. Please try again.");
        }
      }
    }, `Switching to @${pseudonym}...`);
  };

  const handleRemove = (pseudonym) => {
    Alert.alert(
      `Remove @${pseudonym}?`,
      "This will remove the account from this device. You can add it back anytime.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeAccount(pseudonym);
            } catch (err) {
              Alert.alert("Error", err.message || "Could not remove account.");
            }
          },
        },
      ]
    );
  };

  const canAddMore = accounts.length < 3;

  return (
    <>
      <SectionHeader title="Accounts" />
      <View style={styles.sectionCard}>
        {accounts.map((acc, i) => {
          const isActive  = acc.pseudonym === user?.pseudonym;
          const color     = acc.avatarColor || avatarColorForPseudonym(acc.pseudonym);
          const isLast    = !canAddMore && i === accounts.length - 1;

          return (
            <View
              key={acc.pseudonym}
              style={[
                styles.switchAccountRow,
                !isLast && styles.rowBorder,
                isActive && styles.switchAccountRowActive,
              ]}
            >
              {/* Avatar */}
              <View style={[styles.switchAvatar, { backgroundColor: color + "22", borderColor: color }]}>
                <Text style={[styles.switchAvatarLetter, { color }]}>
                  {acc.pseudonym?.[0]?.toUpperCase()}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.switchAccountInfo}>
                <Text style={styles.switchPseudonym}>@{acc.pseudonym}</Text>
                {acc.email ? (
                  <Text style={styles.switchEmail} numberOfLines={1}>{acc.email}</Text>
                ) : null}
              </View>

              {/* Right actions */}
              <View style={styles.switchActions}>
                {isActive ? (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.switchBtn}
                      onPress={() => handleSwitch(acc.pseudonym)}
                    >
                      <Text style={styles.switchBtnText}>Switch</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemove(acc.pseudonym)}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        })}

        {/* Add Account button */}
        {canAddMore && (
          <TouchableOpacity
            style={[styles.addAccountBtn, accounts.length > 0 && styles.rowBorderTop]}
            onPress={() => navigation.navigate("AddAccount")}
            activeOpacity={0.75}
          >
            <View style={styles.addAccountIcon}>
              <Text style={styles.addAccountPlus}>+</Text>
            </View>
            <Text style={styles.addAccountText}>Add account</Text>
            <Text style={styles.addAccountSlots}>
              {3 - accounts.length} slot{3 - accounts.length !== 1 ? "s" : ""} left
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

// ── Sub-modals (unchanged from original) ────────────────────────────────────

function ChangePasswordModal({ visible, onClose, spinner }) {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const { isConnected }       = useNetwork();

  const handleSubmit = async () => {
    if (!isConnected) { Alert.alert("No connection", "Check your internet."); return; }
    if (next !== confirm) { Alert.alert("Mismatch", "New passwords do not match."); return; }
    await spinner.withSpinner(async () => {
      try {
        await api.put("/settings/change-password", { currentPassword: current, newPassword: next });
        Alert.alert("Done 💜", "Password updated successfully.");
        setCurrent(""); setNext(""); setConfirm("");
        onClose();
      } catch (e) {
        Alert.alert("Error", e.response?.data?.message || "Could not update password.");
      }
    }, "Updating password...");
  };

  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Change Password</Text>
          <Text style={styles.sheetSub}>Must include uppercase, lowercase, number & symbol</Text>
          {[
            { label: "Current password", value: current, setter: setCurrent },
            { label: "New password",     value: next,    setter: setNext    },
            { label: "Confirm new password", value: confirm, setter: setConfirm },
          ].map((f, i) => (
            <View key={i} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{f.label}</Text>
              <TextInput
                style={styles.input}
                value={f.value}
                onChangeText={f.setter}
                secureTextEntry
                placeholderTextColor={DARK.textMuted}
                placeholder="••••••••"
                autoCapitalize="none"
              />
            </View>
          ))}
          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
              <Text style={styles.saveBtnText}>Update 💜</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ChangeEmailModal({ visible, onClose, currentEmail, spinner }) {
  const [newEmail, setNewEmail]   = useState("");
  const [password, setPassword]   = useState("");
  const { isConnected }           = useNetwork();

  const handleSubmit = async () => {
    if (!isConnected) { Alert.alert("No connection", "Check your internet."); return; }
    if (!newEmail.trim() || !password) { Alert.alert("Required", "Fill in all fields."); return; }
    await spinner.withSpinner(async () => {
      try {
        await api.put("/settings/change-email", { newEmail: newEmail.trim(), password });
        Alert.alert("Done 💜", "Email updated successfully.");
        setNewEmail(""); setPassword("");
        onClose();
      } catch (e) {
        Alert.alert("Error", e.response?.data?.message || "Could not update email.");
      }
    }, "Updating email...");
  };

  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Change Email</Text>
          <Text style={styles.sheetSub}>Current: {currentEmail}</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New email</Text>
            <TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail}
              keyboardType="email-address" autoCapitalize="none"
              placeholder="new@email.com" placeholderTextColor={DARK.textMuted} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm with password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword}
              secureTextEntry placeholder="••••••••"
              placeholderTextColor={DARK.textMuted} autoCapitalize="none" />
          </View>
          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
              <Text style={styles.saveBtnText}>Update 💜</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MutedKeywordsModal({ visible, onClose, keywords, onAdd, onRemove }) {
  const [newKeyword, setNewKeyword] = useState("");
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheet, { maxHeight: "80%" }]}>
          <Text style={styles.sheetTitle}>Muted Keywords</Text>
          <Text style={styles.sheetSub}>Posts containing these words will be hidden from your feed.</Text>
          <View style={styles.keywordInputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={newKeyword} onChangeText={setNewKeyword}
              placeholder="e.g. politics, spoiler" placeholderTextColor={DARK.textMuted}
              autoCapitalize="none" maxLength={30}
            />
            <TouchableOpacity style={styles.addKeywordBtn}
              onPress={() => { if (newKeyword.trim()) { onAdd(newKeyword.trim()); setNewKeyword(""); } }}>
              <Text style={styles.addKeywordBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.keywordList}>
            {keywords.length === 0 && <Text style={styles.emptyText}>No muted keywords yet.</Text>}
            {keywords.map((kw, i) => (
              <View key={i} style={styles.keywordChip}>
                <Text style={styles.keywordChipText}>{kw}</Text>
                <TouchableOpacity onPress={() => onRemove(kw)}>
                  <Text style={styles.keywordRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={[styles.saveBtn, { marginTop: 12 }]} onPress={onClose}>
            <Text style={styles.saveBtnText}>Done 💜</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function BlockedUsersModal({ visible, onClose, spinner, onUnblocked }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading]           = useState(false);

  useFocusEffect(useCallback(() => {
    if (visible) loadBlocked();
  }, [visible]));

  const loadBlocked = async () => {
    setLoading(true);
    try {
      const res = await api.get("/settings/blocked-users");
      setBlockedUsers(res.data.blockedUsers || []);
    } catch (e) {}
    finally { setLoading(false); }
  };

  const handleUnblock = async (userId, pseudonym) => {
    await spinner.withSpinner(async () => {
      try {
        await api.delete(`/settings/block/${userId}`);
        setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
        if (onUnblocked) onUnblocked(userId);
        Alert.alert("Unblocked 💜", `@${pseudonym} has been unblocked.`);
      } catch (e) { Alert.alert("Error", "Could not unblock user."); }
    }, "Unblocking...");
  };

  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheet, { maxHeight: "75%" }]}>
          <Text style={styles.sheetTitle}>Blocked Users</Text>
          {loading ? (
            <ActivityIndicator color={DARK.accent} style={{ marginVertical: 24 }} />
          ) : blockedUsers.length === 0 ? (
            <Text style={styles.emptyText}>You have not blocked anyone.</Text>
          ) : (
            <ScrollView>
              {blockedUsers.map((u) => (
                <View key={u._id} style={styles.blockedUserRow}>
                  <View style={styles.blockedAvatar}>
                    <Text style={styles.blockedAvatarText}>{u.pseudonym?.[0]?.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.blockedPseudonym}>@{u.pseudonym}</Text>
                  <TouchableOpacity style={styles.unblockBtn} onPress={() => handleUnblock(u._id, u.pseudonym)}>
                    <Text style={styles.unblockBtnText}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity style={[styles.cancelBtn, { marginTop: 12 }]} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function AboutModal({ visible, title, content, onClose }) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheet, { maxHeight: "85%" }]}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView style={{ marginVertical: 12 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.aboutContent}>{content}</Text>
          </ScrollView>
          <TouchableOpacity style={[styles.saveBtn, { marginTop: 8 }]} onPress={onClose}>
            <Text style={styles.saveBtnText}>Got it 💜</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main SettingsScreen ──────────────────────────────────────────────────────

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuth();
  const { isConnected } = useNetwork();
  const { fontSize, setFontSize, removeBlockedUser, theme, colors, setTheme, colors: COLORS} = useTheme();
  const spinner = useSpinner();
  const { language, setLanguage, t, isFullySupported, uiTranslating } = useLanguage();
  const [showLangPicker, setShowLangPicker] = useState(false);

  const [settings, setSettings] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal]       = useState(false);
  const [showKeywordsModal, setShowKeywordsModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal]   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword]       = useState("");

  const [aboutModal, setAboutModal] = useState({ visible: false, title: "", content: "" });
  const openAbout  = (title) => setAboutModal({ visible: true, title, content: ABOUT_CONTENT[title] || "" });
  const closeAbout = () => setAboutModal({ visible: false, title: "", content: "" });

  const loadSettings = async () => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    try {
      const res = await api.get("/settings");
      setSettings(res.data.settings);
      setUserInfo(res.data.user);
    } catch (e) { console.log("Settings load error:", e.message); }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadSettings().finally(() => setLoading(false));
  }, [isConnected]));

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
  };

  const updateSetting = async (path, value) => {
    if (!isConnected) { Alert.alert("No connection", "Check your internet."); return; }
    setSettings((prev) => {
      const updated = { ...prev };
      const keys = path.split(".");
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...(obj[keys[i]] || {}) };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return updated;
    });
    try {
      const body = {};
      const keys = path.split(".");
      if (keys.length === 1) { body[keys[0]] = value; }
      else { body[keys[0]] = { [keys[1]]: value }; }
      await api.put("/settings", body);
    } catch (e) {
      Alert.alert("Error", "Could not save setting.");
      await loadSettings();
    }
  };

  const handleFontSizeChange = async (size) => {
    await setFontSize(size);
    setSettings((prev) => ({ ...prev, fontSize: size }));
  };

  const handleAddKeyword = async (keyword) => {
    if (!isConnected) { Alert.alert("No connection", "Check your internet."); return; }
    try {
      const res = await api.post("/settings/muted-keywords", { keyword });
      setSettings((prev) => ({ ...prev, mutedKeywords: res.data.mutedKeywords }));
    } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not add keyword."); }
  };

  const handleRemoveKeyword = async (keyword) => {
    if (!isConnected) { Alert.alert("No connection", "Check your internet."); return; }
    try {
      const encoded = encodeURIComponent(keyword);
      const res = await api.delete(`/settings/muted-keywords/${encoded}`);
      setSettings((prev) => ({ ...prev, mutedKeywords: res.data.mutedKeywords }));
    } catch (e) { Alert.alert("Error", "Could not remove keyword."); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) { Alert.alert("Required", "Enter your password to confirm."); return; }
    await spinner.withSpinner(async () => {
      try {
        await api.delete("/settings/delete-account", { data: { password: deletePassword } });
        setShowDeleteConfirm(false);
        logout();
      } catch (e) {
        Alert.alert("Error", e.response?.data?.message || "Could not delete account.");
      }
    }, "Deleting account...");
  };

  const handleLogout = () => {
    Alert.alert("Sign out", "Sign out of this account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.accent} size="large" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Could not load settings</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => { setLoading(true); loadSettings().finally(() => setLoading(false)); }}
        >
          <Text style={styles.retryBtnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />}
      >
        {/* ── ACCOUNT ── */}
        <SectionHeader title="Account" />
        <SectionCard>
          <SettingRow label="Signed in as" sub={`@${user?.pseudonym}`} right={null} />
          <SettingRow label="Change password" sub="Update your login password"
            right={<Text style={styles.chevron}>›</Text>} onPress={() => setShowPasswordModal(true)} />
          <SettingRow label="Change email" sub={userInfo?.email || ""}
            right={<Text style={styles.chevron}>›</Text>} onPress={() => setShowEmailModal(true)} />
          <SettingRow label="Sign out" right={<Text style={styles.chevron}>›</Text>}
            onPress={handleLogout} last />
        </SectionCard>

        {/* ── PRIVACY ── */}
        <SectionHeader title="Privacy" />
        <SectionCard>
          <SettingRow
            label="Private profile" sub="Only approved followers can see your posts"
            right={
              <Switch value={settings.isProfilePrivate}
                onValueChange={(v) => updateSetting("isProfilePrivate", v)}
                trackColor={{ false: COLORS.border, true: COLORS.accent + "66" }}
                thumbColor={settings.isProfilePrivate ? COLORS.accent : COLORS.textMuted}
                ios_backgroundColor={COLORS.border} />
            }
          />
          <SettingRow
            label="Show online status" sub="Let others see when you are active"
            right={
              <Switch
                value={user?.showOnlineStatus !== false}
                onValueChange={async () => {
                  try {
                    const res = await api.put("/auth/online-status-privacy");
                    updateUser({ showOnlineStatus: res.data.showOnlineStatus });
                  } catch (e) {}
                }}
                trackColor={{ false: COLORS.border, true: COLORS.success + "66" }}
                thumbColor={user?.showOnlineStatus !== false ? COLORS.success : COLORS.textMuted}
                ios_backgroundColor={COLORS.border} />
            }
          />
          <SettingRow label="Blocked users" sub="Manage who you have blocked"
            right={<Text style={styles.chevron}>›</Text>}
            onPress={() => setShowBlockedModal(true)} last />
        </SectionCard>

        {/* ── PUSH NOTIFICATIONS ── */}
        <SectionHeader title="Push Notifications" />
        <SectionCard>
          {[
            { key: "comments",   label: "Comments",    sub: "When someone comments on your post" },
            { key: "replies",    label: "Replies",      sub: "When someone replies to your comment" },
            { key: "reactions",  label: "Reactions",    sub: "When someone reacts to your post" },
            { key: "mentions",   label: "Mentions",     sub: "When you are mentioned" },
            { key: "groupPosts", label: "Circle posts", sub: "New posts in your circles" },
          ].map((item, i, arr) => (
            <SettingRow key={item.key} label={item.label} sub={item.sub}
              right={
                <Switch
                  value={settings.pushNotifications?.[item.key] ?? true}
                  onValueChange={(v) => updateSetting(`pushNotifications.${item.key}`, v)}
                  trackColor={{ false: COLORS.border, true: COLORS.accent + "66" }}
                  thumbColor={settings.pushNotifications?.[item.key] ? COLORS.accent : COLORS.textMuted}
                  ios_backgroundColor={COLORS.border} />
              }
              last={i === arr.length - 1} />
          ))}
        </SectionCard>

        {/* ── QUIET HOURS ── */}
        <SectionHeader title="Quiet Hours" />
        <SectionCard>
          <SettingRow label="Enable quiet hours" sub="Pause notifications during set hours"
            right={
              <Switch value={settings.quietHours?.enabled ?? false}
                onValueChange={(v) => updateSetting("quietHours.enabled", v)}
                trackColor={{ false: COLORS.border, true: COLORS.accent + "66" }}
                thumbColor={settings.quietHours?.enabled ? COLORS.accent : COLORS.textMuted}
                ios_backgroundColor={COLORS.border} />
            }
          />
          {settings.quietHours?.enabled && (
            <SettingRow label="Active hours"
              sub={`Quiet from ${settings.quietHours?.from || "22:00"} to ${settings.quietHours?.to || "08:00"}`}
              right={null} last />
          )}
        </SectionCard>

        {/* ── CONTENT & SAFETY ── */}
        <SectionHeader title="Content & Safety" />
        <SectionCard>
          <SettingRow label="Content sensitivity" sub={`Currently: ${settings.contentSensitivity}`}
            right={
              <View style={styles.segmentedRow}>
                {["low", "medium", "strict"].map((level) => (
                  <TouchableOpacity key={level}
                    style={[styles.segmentBtn, settings.contentSensitivity === level && styles.segmentBtnActive]}
                    onPress={() => updateSetting("contentSensitivity", level)}>
                    <Text style={[styles.segmentBtnText, settings.contentSensitivity === level && styles.segmentBtnTextActive]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            }
          />
          <SettingRow label="Muted keywords" sub={`${settings.mutedKeywords?.length || 0} words hidden`}
            right={<Text style={styles.chevron}>›</Text>}
            onPress={() => setShowKeywordsModal(true)} last />
        </SectionCard>

        {/* ── APPEARANCE ── */}
        <SectionHeader title="Appearance" />
        <SectionCard>
          <SettingRow label="Theme" sub="App color scheme"
            right={
              <View style={styles.segmentedRow}>
                {["dark", "light"].map((t) => (
                  <TouchableOpacity key={t}
                    style={[styles.segmentBtn, settings.theme === t && styles.segmentBtnActive]}
                    onPress={() => updateSetting("theme", t)}>
                    <Text style={[styles.segmentBtnText, settings.theme === t && styles.segmentBtnTextActive]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            }
          />
          <SettingRow label={t("language")}
            sub={SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeLabel || "English"}
            right={<Text style={styles.chevron}>›</Text>}
            onPress={() => setShowLangPicker(true)} />
          <SettingRow label="Font size" sub="Text size across the app"
            right={
              <View style={styles.segmentedRow}>
                {["small", "medium", "large"].map((s) => (
                  <TouchableOpacity key={s}
                    style={[styles.segmentBtn, fontSize === s && styles.segmentBtnActive]}
                    onPress={() => handleFontSizeChange(s)}>
                    <Text style={[styles.segmentBtnText, fontSize === s && styles.segmentBtnTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            }
            last />
        </SectionCard>

        {/* ── ABOUT & SUPPORT ── */}
        <SectionHeader title="About & Support" />
        <SectionCard>
          <SettingRow label="Community guidelines" sub="What we stand for"
            right={<Text style={styles.chevron}>›</Text>} onPress={() => openAbout("Community Guidelines")} />
          <SettingRow label="Privacy policy" sub="How we protect your data"
            right={<Text style={styles.chevron}>›</Text>} onPress={() => openAbout("Privacy Policy")} />
          <SettingRow label="Terms of service" sub="Usage agreement"
            right={<Text style={styles.chevron}>›</Text>} onPress={() => openAbout("Terms of Service")} />
          <SettingRow label="Contact support" sub="support@hushcircle.com"
            right={<Text style={styles.chevron}>›</Text>} onPress={() => openAbout("Contact Support")} />
          <SettingRow label="App version" sub={`v${APP_VERSION}`} right={null} last />
        </SectionCard>

        {/* ── SWITCH / ADD ACCOUNT (NEW) ── */}
        <SwitchAccountSection navigation={navigation} spinner={spinner} />

        {/* ── DANGER ZONE ── */}
        <SectionHeader title="Danger Zone" />
        <SectionCard>
          <SettingRow label="Delete account" sub="Permanently remove all your data"
            right={<Text style={[styles.chevron, { color: COLORS.error }]}>›</Text>}
            onPress={() => setShowDeleteConfirm(true)} danger last />
        </SectionCard>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── DELETE ACCOUNT MODAL ── */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmEmoji}>⚠️</Text>
            <Text style={styles.confirmTitle}>Delete account?</Text>
            <Text style={styles.confirmSub}>
              This permanently deletes all your posts, comments, check-ins, and account data. This cannot be undone.
            </Text>
            <TextInput
              style={[styles.input, { width: "100%", marginBottom: 16 }]}
              placeholder="Enter your password to confirm"
              placeholderTextColor={COLORS.textMuted}
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry autoCapitalize="none"
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn}
                onPress={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: COLORS.error }]}
                onPress={handleDeleteAccount}>
                <Text style={styles.saveBtnText}>Delete 🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sub-modals */}
      <ChangePasswordModal visible={showPasswordModal} onClose={() => setShowPasswordModal(false)} spinner={spinner} />
      <ChangeEmailModal visible={showEmailModal} onClose={() => setShowEmailModal(false)}
        currentEmail={userInfo?.email || ""} spinner={spinner} />
      <MutedKeywordsModal visible={showKeywordsModal} onClose={() => setShowKeywordsModal(false)}
        keywords={settings.mutedKeywords || []} onAdd={handleAddKeyword} onRemove={handleRemoveKeyword} />
      <BlockedUsersModal visible={showBlockedModal} onClose={() => setShowBlockedModal(false)}
        spinner={spinner} onUnblocked={(userId) => removeBlockedUser(userId)} />
      <AboutModal visible={aboutModal.visible} title={aboutModal.title}
        content={aboutModal.content} onClose={closeAbout} />

      {/* Language Picker */}
      <Modal visible={showLangPicker} transparent animationType="slide"
        onRequestClose={() => setShowLangPicker(false)}>
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { maxHeight: "80%" }]}>
            <Text style={styles.sheetTitle}>{t("language")}</Text>
            <Text style={styles.sheetSub}>{t("languageSub")}</Text>
            {uiTranslating && (
              <View style={styles.uiTranslatingRow}>
                <ActivityIndicator color={COLORS.accent} size="small" />
                <Text style={styles.uiTranslatingText}>Translating app interface...</Text>
              </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.langGroupLabel}>Full translations available</Text>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity key={lang.code}
                  style={[styles.langOption, language === lang.code && styles.langOptionActive]}
                  onPress={async () => { await setLanguage(lang.code); setShowLangPicker(false); }}>
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <View style={styles.langInfo}>
                    <Text style={styles.langLabel}>{lang.label}</Text>
                    <Text style={styles.langNative}>{lang.nativeLabel}</Text>
                  </View>
                  {language === lang.code && <Text style={styles.langCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
              {!isFullySupported && !SUPPORTED_LANGUAGES.find((l) => l.code === language) && (
                <>
                  <Text style={styles.langGroupLabel}>Your device language</Text>
                  <TouchableOpacity style={[styles.langOption, styles.langOptionActive]}>
                    <Text style={styles.langFlag}>🌐</Text>
                    <View style={styles.langInfo}>
                      <Text style={styles.langLabel}>{language.toUpperCase()} (auto-translated)</Text>
                      <Text style={styles.langNative}>UI translated on-device via API</Text>
                    </View>
                    <Text style={styles.langCheck}>✓</Text>
                  </TouchableOpacity>
                </>
              )}
              <View style={styles.otherLangBox}>
                <Text style={styles.otherLangTitle}>🌐 Other languages</Text>
                <Text style={styles.otherLangText}>
                  HushCircle can translate its interface to any language using on-device translation.
                </Text>
                <Text style={styles.otherLangText}>
                  Your device language ({language.toUpperCase()}) is already applied if it's not in the list above.
                </Text>
              </View>
            </ScrollView>
            <TouchableOpacity style={[styles.cancelBtn, { marginTop: 12 }]} onPress={() => setShowLangPicker(false)}>
              <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
      <NoNetworkOverlay visible={showNoNetwork} action="profile"
        onRetry={() => { setShowNoNetwork(false); loadSettings(); }}
        onClose={() => setShowNoNetwork(false)} />
    </View>
  );
}

  const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0A1E" },
  centered:  { flex: 1, backgroundColor: "#0F0A1E", justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 14 },
  retryBtn:     { backgroundColor: "#9B6FD4", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24 },
  retryBtnText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#2D2450" },
  backBtn:     { width: 40, height: 40, justifyContent: "center" },
  backBtnText: { color: "#9B6FD4", fontSize: 22 },
  headerTitle: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 22 },

  scroll: { padding: 20, paddingTop: 16 },

  sectionHeader: { color: "#8B7FA8", fontFamily: "Nunito_700Bold", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", marginTop: 24, marginBottom: 8, paddingHorizontal: 4 },
  sectionCard:   { backgroundColor: "#1A1330", borderRadius: 16, borderWidth: 1, borderColor: "#2D2450", overflow: "hidden", marginBottom: 4 },

  row:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 16, minHeight: 56 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#2D2450" },
  rowLeft:   { flex: 1, marginRight: 12 },
  rowLabel:  { color: "#EDE8F5", fontFamily: "Nunito_600SemiBold", fontSize: 14 },
  rowSub:    { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2 },
  rowRight:  { alignItems: "flex-end" },
  chevron:   { color: "#8B7FA8", fontSize: 20, fontWeight: "300" },

  segmentedRow:        { flexDirection: "row", backgroundColor: "#0F0A1E", borderRadius: 10, padding: 2, gap: 2 },
  segmentBtn:          { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  segmentBtnActive:    { backgroundColor: "#9B6FD4" },
  segmentBtnText:      { color: "#8B7FA8", fontFamily: "Nunito_600SemiBold", fontSize: 11 },
  segmentBtnTextActive:{ color: "#fff" },

  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet:        { backgroundColor: "#1A1330", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: "#2D2450" },
  sheetTitle:   { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 4 },
  sheetSub:     { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 16 },
  sheetActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn:    { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#2D2450", alignItems: "center" },
  cancelBtnText:{ color: "#8B7FA8", fontFamily: "Nunito_600SemiBold", fontSize: 14 },
  saveBtn:      { flex: 1, padding: 14, borderRadius: 14, backgroundColor: "#9B6FD4", alignItems: "center" },
  saveBtnText:  { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 },

  inputGroup: { marginBottom: 14 },
  inputLabel: { color: "#C4A3E8", fontFamily: "Nunito_500Medium", fontSize: 12, marginBottom: 6 },
  input:      { backgroundColor: "#0F0A1E", borderRadius: 12, borderWidth: 1, borderColor: "#2D2450", padding: 14, color: "#EDE8F5", fontFamily: "Nunito_400Regular", fontSize: 15 },

  keywordInputRow:   { flexDirection: "row", gap: 8, marginBottom: 16 },
  addKeywordBtn:     { backgroundColor: "#9B6FD4", borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
  addKeywordBtnText: { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 },
  keywordList:       { maxHeight: 200 },
  keywordChip:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0F0A1E", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8, borderWidth: 1, borderColor: "#2D2450" },
  keywordChipText:   { color: "#EDE8F5", fontFamily: "Nunito_500Medium", fontSize: 14 },
  keywordRemove:     { color: "#D4607A", fontSize: 16, fontWeight: "bold", paddingLeft: 10 },

  blockedUserRow:    { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#2D2450" },
  blockedAvatar:     { width: 38, height: 38, borderRadius: 19, backgroundColor: "#9B6FD4" + "22", justifyContent: "center", alignItems: "center" },
  blockedAvatarText: { color: "#C4A3E8", fontFamily: "Nunito_700Bold", fontSize: 16 },
  blockedPseudonym:  { flex: 1, color: "#EDE8F5", fontFamily: "Nunito_600SemiBold", fontSize: 14 },
  unblockBtn:        { backgroundColor: "#4CAF8F" + "22", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#4CAF8F" + "44" },
  unblockBtnText:    { color: "#4CAF8F", fontFamily: "Nunito_700Bold", fontSize: 13 },

  emptyText:     { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 24 },
  aboutContent:  { color: "#EDE8F5", fontFamily: "Nunito_400Regular", fontSize: 14, lineHeight: 22 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "center", alignItems: "center", padding: 24 },
  confirmCard:  { backgroundColor: "#1A1330", borderRadius: 24, padding: 24, width: "100%", maxWidth: 340, alignItems: "center", borderWidth: 1, borderColor: "#2D2450" },
  confirmEmoji: { fontSize: 44, marginBottom: 12 },
  confirmTitle: { color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 8 },
  confirmSub:   { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 16 },

  // Language picker
  langOption:       { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: "#2D2450", backgroundColor: "#0F0A1E" },
  langOptionActive: { borderColor: "#9B6FD4", backgroundColor: "#9B6FD4" + "11" },
  langFlag:         { fontSize: 28 },
  langInfo:         { flex: 1 },
  langLabel:        { color: "#EDE8F5", fontFamily: "Nunito_700Bold", fontSize: 15, marginBottom: 2 },
  langNative:       { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 12 },
  langCheck:        { color: "#9B6FD4", fontSize: 20, fontWeight: "bold" },
  langGroupLabel:   { color: "#8B7FA8", fontFamily: "Nunito_700Bold", fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8, marginTop: 4 },
  otherLangBox:     { backgroundColor: "#0F0A1E", borderRadius: 14, padding: 14, marginTop: 12, borderWidth: 1, borderColor: "#2D2450" },
  otherLangTitle:   { color: "#C4A3E8", fontFamily: "Nunito_700Bold", fontSize: 13, marginBottom: 8 },
  otherLangText:    { color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 19, marginBottom: 6 },
  uiTranslatingRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#9B6FD4" + "11", borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: "#9B6FD4" + "33" },
  uiTranslatingText:{ color: "#C4A3E8", fontFamily: "Nunito_500Medium", fontSize: 13 },

  // ── NEW: Switch Account styles ──────────────────────────────────────────
  switchAccountRow: {
  flexDirection: "row", alignItems: "center",
  paddingVertical: 12, paddingHorizontal: 16, minHeight: 64,
  },
  switchAccountRowActive: {
  backgroundColor: "#9B6FD4" + "08",
  },
  rowBorderTop: {
  borderTopWidth: 1, borderTopColor: "#2D2450",
  },
  switchAvatar: {
  width: 42, height: 42, borderRadius: 21,
  justifyContent: "center", alignItems: "center",
  borderWidth: 2, marginRight: 12,
  },
  switchAvatarLetter: {
  fontSize: 18, fontFamily: "DMSerifDisplay_400Regular",
  },
  switchAccountInfo: { flex: 1 },
  switchPseudonym: {
  color: "#EDE8F5", fontFamily: "Nunito_600SemiBold", fontSize: 14, marginBottom: 2,
  },
  switchEmail: {
  color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 12,
  },
  switchActions: {
  flexDirection: "row", alignItems: "center", gap: 8,
  },
  activeBadge: {
  backgroundColor: "#9B6FD4" + "22",
  borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  borderWidth: 1, borderColor: "#9B6FD4" + "55",
  },
  activeBadgeText: {
  color: "#C4A3E8", fontFamily: "Nunito_700Bold", fontSize: 11,
  },
  switchBtn: {
  backgroundColor: "#9B6FD4",
  borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7,
  },
  switchBtnText: {
  color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 12,
  },
  removeBtn: {
  backgroundColor: "#D4607A" + "18",
  borderRadius: 10, width: 30, height: 30,
  justifyContent: "center", alignItems: "center",
  borderWidth: 1, borderColor: "#D4607A" + "33",
  },
  removeBtnText: {
  color: "#D4607A", fontSize: 13, fontWeight: "bold",
  },
  addAccountBtn: {
  flexDirection: "row", alignItems: "center",
  paddingVertical: 14, paddingHorizontal: 16, gap: 12,
  },
  addAccountIcon: {
  width: 42, height: 42, borderRadius: 21,
  borderWidth: 2, borderColor: "#2D2450",
  borderStyle: "dashed",
  justifyContent: "center", alignItems: "center",
  backgroundColor: "#9B6FD4" + "0A",
  },
  addAccountPlus: {
  color: "#9B6FD4", fontSize: 22, fontWeight: "300",
  },
  addAccountText: {
  flex: 1, color: "#C4A3E8",
  fontFamily: "Nunito_600SemiBold", fontSize: 14,
  },
  addAccountSlots: {
  color: "#8B7FA8", fontFamily: "Nunito_400Regular", fontSize: 12,
  },
  });

