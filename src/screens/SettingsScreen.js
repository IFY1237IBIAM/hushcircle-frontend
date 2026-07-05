/**
 * SettingsScreen.js
 *
 * Changes from previous version:
 *   • All hardcoded COLORS replaced with dynamic `colors` from useTheme()
 *   • Theme row uses animated ThemeToggle (moon/sun) instead of segmented buttons
 *   • StyleSheet rebuilt as a factory function so styles re-derive when theme changes
 *   • About & Support rows now navigate to standalone full-page screens instead of modals
 *   • ABOUT_CONTENT, aboutModal state, openAbout/closeAbout, and <AboutModal> removed
 *   • Everything else (account switching, modals, language picker) unchanged
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, TextInput,
  Alert, ActivityIndicator, Modal,
  RefreshControl, Animated,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api/api";
import HushCircleSpinner from "../components/HushCircleSpinner";
import { useLanguage, SUPPORTED_LANGUAGES } from "../context/LanguageContext";
import AppLockSettings from "../components/AppLockSettings";
import useSpinner from "../hooks/useSpinner";
import NoNetworkOverlay from "../components/NoNetworkOverlay";

const APP_VERSION = "1.0.0";

const AVATAR_COLORS = ["#9B6FD4","#D4607A","#6B9FD4","#4CAF8F","#D4A44C","#E879F9"];
function avatarColorForPseudonym(pseudonym = "") {
  return AVATAR_COLORS[(pseudonym.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated Theme Toggle
// ─────────────────────────────────────────────────────────────────────────────

function ThemeToggle({ isDark, onToggle, C }) {
  const anim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: true,
      tension: 140,
      friction: 9,
    }).start();
  }, [isDark]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 24] });

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.85}>
      <View style={{
        width: 56, height: 30, borderRadius: 15,
        backgroundColor: isDark ? C.accent : C.borderSoft,
        justifyContent: "center",
        paddingHorizontal: 2,
        borderWidth: 1,
        borderColor: isDark ? C.accentMuted : C.border,
      }}>
        <Animated.View style={{
          width: 26, height: 26, borderRadius: 13,
          backgroundColor: isDark ? "#1A1330" : "#FFFFFF",
          transform: [{ translateX }],
          justifyContent: "center", alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 4,
        }}>
          <Text style={{ fontSize: 13 }}>{isDark ? "🌙" : "☀️"}</Text>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable row components — accept C (colors) as prop
// ─────────────────────────────────────────────────────────────────────────────

function SettingRow({ label, sub, right, onPress, danger = false, last = false, C }) {
  const s = makeRowStyles(C);
  const content = (
    <View style={[s.row, !last && s.rowBorder]}>
      <View style={s.rowLeft}>
        <Text style={[s.rowLabel, danger && { color: C.error }]}>{label}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      <View style={s.rowRight}>{right}</View>
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  return content;
}

function SectionHeader({ title, C }) {
  return (
    <Text style={{
      color: C.textMuted,
      fontFamily: "Nunito_700Bold",
      fontSize: 11, letterSpacing: 0.8,
      textTransform: "uppercase",
      marginTop: 24, marginBottom: 8,
      paddingHorizontal: 4,
    }}>
      {title}
    </Text>
  );
}

function SectionCard({ children, C }) {
  return (
    <View style={{
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.border,
      overflow: "hidden",
      marginBottom: 4,
    }}>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Switch Account Section
// ─────────────────────────────────────────────────────────────────────────────

function SwitchAccountSection({ navigation, spinner, C }) {
  const { user, accounts = [], switchAccount, removeAccount } = useAuth();
  const { isConnected } = useNetwork();

  const handleSwitch = async (pseudonym) => {
    if (pseudonym === user?.pseudonym) return;
    if (!isConnected) { Alert.alert("No connection", "Check your internet connection."); return; }
    await spinner.withSpinner(async () => {
      try {
        await switchAccount(pseudonym);
        await new Promise((r) => setTimeout(r, 300));
        navigation.reset({ index: 0, routes: [{ name: "Main" }] });
      } catch (err) {
        if (err.message === "SESSION_EXPIRED") {
          Alert.alert("Session expired", `@${pseudonym}'s session has expired. Please add it again.`);
        } else {
          Alert.alert("Error", "Could not switch account. Please try again.");
        }
      }
    }, `Switching to @${pseudonym}...`);
  };

  const handleRemove = (pseudonym) => {
    Alert.alert(`Remove @${pseudonym}?`, "This will remove the account from this device.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        try { await removeAccount(pseudonym); }
        catch (err) { Alert.alert("Error", err.message || "Could not remove account."); }
      }},
    ]);
  };

  const canAddMore = accounts.length < 3;

  return (
    <>
      <SectionHeader title="Accounts" C={C} />
      <SectionCard C={C}>
        {accounts.map((acc, i) => {
          const isActive = acc.pseudonym === user?.pseudonym;
          const color    = acc.avatarColor || avatarColorForPseudonym(acc.pseudonym);
          const isLast   = !canAddMore && i === accounts.length - 1;
          return (
            <View key={acc.pseudonym} style={[
              { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, minHeight: 64 },
              !isLast && { borderBottomWidth: 1, borderBottomColor: C.border },
              isActive && { backgroundColor: C.accentGlow },
            ]}>
              <View style={{ width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center", borderWidth: 2, marginRight: 12, backgroundColor: color + "22", borderColor: color }}>
                <Text style={{ fontSize: 18, fontFamily: "DMSerifDisplay_400Regular", color }}>{acc.pseudonym?.[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 14, marginBottom: 2 }}>@{acc.pseudonym}</Text>
                {acc.email ? <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }} numberOfLines={1}>{acc.email}</Text> : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {isActive ? (
                  <View style={{ backgroundColor: C.accentGlow, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.accentMuted }}>
                    <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 11 }}>Active</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity style={{ backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }} onPress={() => handleSwitch(acc.pseudonym)}>
                      <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 12 }}>Switch</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ backgroundColor: C.error + "18", borderRadius: 10, width: 30, height: 30, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.error + "33" }} onPress={() => handleRemove(acc.pseudonym)}>
                      <Text style={{ color: C.error, fontSize: 13, fontWeight: "bold" }}>✕</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        })}
        {canAddMore && (
          <TouchableOpacity
            style={[{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 12 }, accounts.length > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}
            onPress={() => navigation.navigate("AddAccount")} activeOpacity={0.75}
          >
            <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: C.border, borderStyle: "dashed", justifyContent: "center", alignItems: "center", backgroundColor: C.accentGlow }}>
              <Text style={{ color: C.accent, fontSize: 22, fontWeight: "300" }}>+</Text>
            </View>
            <Text style={{ flex: 1, color: C.accentSoft, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>Add account</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>{3 - accounts.length} slot{3 - accounts.length !== 1 ? "s" : ""} left</Text>
          </TouchableOpacity>
        )}
      </SectionCard>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-modals
// ─────────────────────────────────────────────────────────────────────────────

function ChangePasswordModal({ visible, onClose, spinner, C }) {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const { isConnected }       = useNetwork();
  const S = makeSheetStyles(C);

  const handleSubmit = async () => {
    if (!isConnected) { Alert.alert("No connection", "Check your internet."); return; }
    if (next !== confirm) { Alert.alert("Mismatch", "New passwords do not match."); return; }
    await spinner.withSpinner(async () => {
      try {
        await api.put("/settings/change-password", { currentPassword: current, newPassword: next });
        Alert.alert("Done 💜", "Password updated successfully.");
        setCurrent(""); setNext(""); setConfirm(""); onClose();
      } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not update password."); }
    }, "Updating password...");
  };

  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={S.overlay}>
        <View style={S.sheet}>
          <Text style={S.title}>Change Password</Text>
          <Text style={S.sub}>Must include uppercase, lowercase, number & symbol</Text>
          {[
            { label: "Current password", value: current, setter: setCurrent },
            { label: "New password",     value: next,    setter: setNext    },
            { label: "Confirm new password", value: confirm, setter: setConfirm },
          ].map((f, i) => (
            <View key={i} style={S.inputGroup}>
              <Text style={S.inputLabel}>{f.label}</Text>
              <TextInput style={S.input} value={f.value} onChangeText={f.setter} secureTextEntry placeholderTextColor={C.textMuted} placeholder="••••••••" autoCapitalize="none" />
            </View>
          ))}
          <View style={S.actions}>
            <TouchableOpacity style={S.cancelBtn} onPress={onClose}><Text style={S.cancelTxt}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={S.saveBtn} onPress={handleSubmit}><Text style={S.saveTxt}>Update 💜</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ChangeEmailModal({ visible, onClose, currentEmail, spinner, C }) {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isConnected }         = useNetwork();
  const S = makeSheetStyles(C);

  const handleSubmit = async () => {
    if (!isConnected) { Alert.alert("No connection", "Check your internet."); return; }
    if (!newEmail.trim() || !password) { Alert.alert("Required", "Fill in all fields."); return; }
    await spinner.withSpinner(async () => {
      try {
        await api.put("/settings/change-email", { newEmail: newEmail.trim(), password });
        Alert.alert("Done 💜", "Email updated successfully.");
        setNewEmail(""); setPassword(""); onClose();
      } catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not update email."); }
    }, "Updating email...");
  };

  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={S.overlay}>
        <View style={S.sheet}>
          <Text style={S.title}>Change Email</Text>
          <Text style={S.sub}>Current: {currentEmail}</Text>
          <View style={S.inputGroup}>
            <Text style={S.inputLabel}>New email</Text>
            <TextInput style={S.input} value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" placeholder="new@email.com" placeholderTextColor={C.textMuted} />
          </View>
          <View style={S.inputGroup}>
            <Text style={S.inputLabel}>Confirm with password</Text>
            <TextInput style={S.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor={C.textMuted} autoCapitalize="none" />
          </View>
          <View style={S.actions}>
            <TouchableOpacity style={S.cancelBtn} onPress={onClose}><Text style={S.cancelTxt}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={S.saveBtn} onPress={handleSubmit}><Text style={S.saveTxt}>Update 💜</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MutedKeywordsModal({ visible, onClose, keywords, onAdd, onRemove, C }) {
  const [newKeyword, setNewKeyword] = useState("");
  const S = makeSheetStyles(C);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={S.overlay}>
        <View style={[S.sheet, { maxHeight: "80%" }]}>
          <Text style={S.title}>Muted Keywords</Text>
          <Text style={S.sub}>Posts containing these words will be hidden from your feed.</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            <TextInput style={[S.input, { flex: 1, marginBottom: 0 }]} value={newKeyword} onChangeText={setNewKeyword} placeholder="e.g. politics, spoiler" placeholderTextColor={C.textMuted} autoCapitalize="none" maxLength={30} />
            <TouchableOpacity style={{ backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" }} onPress={() => { if (newKeyword.trim()) { onAdd(newKeyword.trim()); setNewKeyword(""); } }}>
              <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 }}>Add</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 200 }}>
            {keywords.length === 0 && <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 24 }}>No muted keywords yet.</Text>}
            {keywords.map((kw, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.text, fontFamily: "Nunito_500Medium", fontSize: 14 }}>{kw}</Text>
                <TouchableOpacity onPress={() => onRemove(kw)}><Text style={{ color: C.error, fontSize: 16, fontWeight: "bold", paddingLeft: 10 }}>✕</Text></TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={[S.saveBtn, { marginTop: 12 }]} onPress={onClose}><Text style={S.saveTxt}>Done 💜</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function BlockedUsersModal({ visible, onClose, spinner, onUnblocked, C }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading]           = useState(false);
  const S = makeSheetStyles(C);

  useFocusEffect(useCallback(() => { if (visible) loadBlocked(); }, [visible]));

  const loadBlocked = async () => {
    setLoading(true);
    try { const res = await api.get("/settings/blocked-users"); setBlockedUsers(res.data.blockedUsers || []); }
    catch (e) {} finally { setLoading(false); }
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
      <View style={S.overlay}>
        <View style={[S.sheet, { maxHeight: "75%" }]}>
          <Text style={S.title}>Blocked Users</Text>
          {loading ? (
            <ActivityIndicator color={C.accent} style={{ marginVertical: 24 }} />
          ) : blockedUsers.length === 0 ? (
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 24 }}>You have not blocked anyone.</Text>
          ) : (
            <ScrollView>
              {blockedUsers.map((u) => (
                <View key={u._id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.accent + "22", justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 16 }}>{u.pseudonym?.[0]?.toUpperCase()}</Text>
                  </View>
                  <Text style={{ flex: 1, color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>@{u.pseudonym}</Text>
                  <TouchableOpacity style={{ backgroundColor: C.success + "22", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.success + "44" }} onPress={() => handleUnblock(u._id, u.pseudonym)}>
                    <Text style={{ color: C.success, fontFamily: "Nunito_700Bold", fontSize: 13 }}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity style={[S.cancelBtn, { marginTop: 12 }]} onPress={onClose}><Text style={S.cancelTxt}>Close</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Style factories (called inline, always get fresh C)
// ─────────────────────────────────────────────────────────────────────────────

function makeRowStyles(C) {
  return {
    row:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 16, minHeight: 56 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    rowLeft:   { flex: 1, marginRight: 12 },
    rowLabel:  { color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 14 },
    rowSub:    { color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2 },
    rowRight:  { alignItems: "flex-end" },
  };
}

function makeSheetStyles(C) {
  return {
    overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
    sheet:      { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: C.border },
    title:      { color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 4 },
    sub:        { color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 16 },
    actions:    { flexDirection: "row", gap: 10, marginTop: 4 },
    cancelBtn:  { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: "center" },
    cancelTxt:  { color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 14 },
    saveBtn:    { flex: 1, padding: 14, borderRadius: 14, backgroundColor: C.accent, alignItems: "center" },
    saveTxt:    { color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 },
    inputGroup: { marginBottom: 14 },
    inputLabel: { color: C.accentSoft, fontFamily: "Nunito_500Medium", fontSize: 12, marginBottom: 6 },
    input:      { backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15 },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuth();
  const { isConnected } = useNetwork();
  // ── CHANGE 6: pull hasLocalTheme from useTheme ──
  const { isDark, toggleTheme, setTheme, hasLocalTheme, fontSize, setFontSize, colors: C, fs, removeBlockedUser } = useTheme();
  const spinner = useSpinner();
  const { language, setLanguage, t, isFullySupported, uiTranslating } = useLanguage();
  const [showLangPicker, setShowLangPicker] = useState(false);

  const [settings, setSettings] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNoNetwork, setShowNoNetwork] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal]       = useState(false);
  const [showKeywordsModal, setShowKeywordsModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal]   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword]       = useState("");

  const loadSettings = async () => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    try {
      const res = await api.get("/settings");
      setSettings(res.data.settings);
      setUserInfo(res.data.user);
      // ── CHANGE 7: only apply server theme if no local preference exists yet ──
      // On a fresh install hasLocalTheme is false, so server value initialises it once.
      // After that, local preference always wins and we push it back to keep server in sync.
      if (res.data.settings?.theme) {
        if (!hasLocalTheme) {
          setTheme(res.data.settings.theme);
        } else if (res.data.settings.theme !== (isDark ? "dark" : "light")) {
          // Local preference differs from server — push local value to server silently
          api.put("/settings", { theme: isDark ? "dark" : "light" }).catch(() => {});
        }
      }
    } catch (e) { console.log("Settings load error:", e.message); }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadSettings().finally(() => setLoading(false));
  }, [isConnected]));

  const handleRefresh = async () => { setRefreshing(true); await loadSettings(); setRefreshing(false); };

  const updateSetting = async (path, value) => {
    if (!isConnected) { Alert.alert("No connection", "Check your internet."); return; }
    setSettings((prev) => {
      const updated = { ...prev };
      const keys = path.split(".");
      let obj = updated;
      for (let i = 0; i < keys.length - 1; i++) { obj[keys[i]] = { ...(obj[keys[i]] || {}) }; obj = obj[keys[i]]; }
      obj[keys[keys.length - 1]] = value;
      return updated;
    });
    try {
      const body = {};
      const keys = path.split(".");
      if (keys.length === 1) body[keys[0]] = value;
      else body[keys[0]] = { [keys[1]]: value };
      await api.put("/settings", body);
    } catch (e) { Alert.alert("Error", "Could not save setting."); await loadSettings(); }
  };

  const handleFontSizeChange = async (size) => { await setFontSize(size); setSettings((prev) => ({ ...prev, fontSize: size })); };

  const handleAddKeyword = async (keyword) => {
    if (!isConnected) { Alert.alert("No connection", "Check your internet."); return; }
    try { const res = await api.post("/settings/muted-keywords", { keyword }); setSettings((prev) => ({ ...prev, mutedKeywords: res.data.mutedKeywords })); }
    catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not add keyword."); }
  };

  const handleRemoveKeyword = async (keyword) => {
    if (!isConnected) { Alert.alert("No connection", "Check your internet."); return; }
    try { const encoded = encodeURIComponent(keyword); const res = await api.delete(`/settings/muted-keywords/${encoded}`); setSettings((prev) => ({ ...prev, mutedKeywords: res.data.mutedKeywords })); }
    catch (e) { Alert.alert("Error", "Could not remove keyword."); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) { Alert.alert("Required", "Enter your password to confirm."); return; }
    await spinner.withSpinner(async () => {
      try { await api.delete("/settings/delete-account", { data: { password: deletePassword } }); setShowDeleteConfirm(false); logout(); }
      catch (e) { Alert.alert("Error", e.response?.data?.message || "Could not delete account."); }
    }, "Deleting account...");
  };

  const handleLogout = () => {
    Alert.alert("Sign out", "Sign out of this account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: logout },
    ]);
  };

  // ── Segmented control ──────────────────────────────────────────────────────
  const SegRow = ({ options, current, onSelect }) => (
    <View style={{ flexDirection: "row", backgroundColor: C.inputBg, borderRadius: 10, padding: 2, gap: 2 }}>
      {options.map((opt) => (
        <TouchableOpacity key={opt.value}
          style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, backgroundColor: current === opt.value ? C.accent : "transparent" }}
          onPress={() => onSelect(opt.value)}>
          <Text style={{ color: current === opt.value ? "#fff" : C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 11 }}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const S = makeSheetStyles(C);

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center", gap: 12 }}>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14 }}>Loading settings...</Text>
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center", gap: 12 }}>
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14 }}>Could not load settings</Text>
        <TouchableOpacity style={{ backgroundColor: C.accent, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24 }}
          onPress={() => { setLoading(true); loadSettings().finally(() => setLoading(false)); }}>
          <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 }}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.card }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, justifyContent: "center" }}>
          <Text style={{ color: C.accent, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22 }}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.accent} />}
      >
        {/* ── ACCOUNT ── */}
        <SectionHeader title="Account" C={C} />
        <SectionCard C={C}>
          <SettingRow C={C} label="Signed in as" sub={`@${user?.pseudonym}`} right={null} />
          <SettingRow C={C} label="Change password" sub="Update your login password" right={<Text style={{ color: C.textMuted, fontSize: 20, fontWeight: "300" }}>›</Text>} onPress={() => setShowPasswordModal(true)} />
          <SettingRow C={C} label="Change email" sub={userInfo?.email || ""} right={<Text style={{ color: C.textMuted, fontSize: 20, fontWeight: "300" }}>›</Text>} onPress={() => setShowEmailModal(true)} />
          <SettingRow C={C} label="Sign out" right={<Text style={{ color: C.textMuted, fontSize: 20, fontWeight: "300" }}>›</Text>} onPress={handleLogout} last />
        </SectionCard>

        {/* ── PRIVACY ── */}
        <SectionHeader title="Privacy" C={C} />
        <SectionCard C={C}>
          <SettingRow C={C} label="Private profile" sub="Only approved followers can see your posts"
            right={<Switch value={settings.isProfilePrivate} onValueChange={(v) => updateSetting("isProfilePrivate", v)}
              trackColor={{ false: C.border, true: C.accent + "66" }} thumbColor={settings.isProfilePrivate ? C.accent : C.textMuted} ios_backgroundColor={C.border} />} />
          <SettingRow C={C} label="Show online status" sub="Let others see when you are active"
            right={<Switch value={user?.showOnlineStatus !== false}
              onValueChange={async () => { try { const res = await api.put("/auth/online-status-privacy"); updateUser({ showOnlineStatus: res.data.showOnlineStatus }); } catch (e) {} }}
              trackColor={{ false: C.border, true: C.success + "66" }} thumbColor={user?.showOnlineStatus !== false ? C.success : C.textMuted} ios_backgroundColor={C.border} />} />
          <SettingRow C={C} label="Blocked users" sub="Manage who you have blocked" right={<Text style={{ color: C.textMuted, fontSize: 20, fontWeight: "300" }}>›</Text>} onPress={() => setShowBlockedModal(true)} last />
        </SectionCard>
                {/* ── SECURITY ── */}
        <SectionHeader title="Security" C={C} />
        <SectionCard C={C}>
          <SettingRow
            C={C} last
            label="Two-step verification & Passkeys"
            sub={user?.twoStepEnabled ? "🔐 Two-step is ON" : "🔓 Add extra protection"}
            right={<Text style={{ color: C.textMuted, fontSize: 20, fontWeight: "300" }}>›</Text>}
            onPress={() => navigation.navigate("Security")}
          />
        </SectionCard>

        {/* ── PUSH NOTIFICATIONS ── */}
        <SectionHeader title="Push Notifications" C={C} />
        <SectionCard C={C}>
          {[
            { key: "comments",   label: "Comments",    sub: "When someone comments on your post" },
            { key: "replies",    label: "Replies",      sub: "When someone replies to your comment" },
            { key: "reactions",  label: "Reactions",    sub: "When someone reacts to your post" },
            { key: "mentions",   label: "Mentions",     sub: "When you are mentioned" },
            { key: "groupPosts", label: "Circle posts", sub: "New posts in your circles" },
          ].map((item, i, arr) => (
            <SettingRow key={item.key} C={C} label={item.label} sub={item.sub}
              right={<Switch value={settings.pushNotifications?.[item.key] ?? true} onValueChange={(v) => updateSetting(`pushNotifications.${item.key}`, v)}
                trackColor={{ false: C.border, true: C.accent + "66" }} thumbColor={settings.pushNotifications?.[item.key] ? C.accent : C.textMuted} ios_backgroundColor={C.border} />}
              last={i === arr.length - 1} />
          ))}
        </SectionCard>

        {/* ── QUIET HOURS ── */}
        <SectionHeader title="Quiet Hours" C={C} />
        <SectionCard C={C}>
          <SettingRow C={C} label="Enable quiet hours" sub="Pause notifications during set hours"
            right={<Switch value={settings.quietHours?.enabled ?? false} onValueChange={(v) => updateSetting("quietHours.enabled", v)}
              trackColor={{ false: C.border, true: C.accent + "66" }} thumbColor={settings.quietHours?.enabled ? C.accent : C.textMuted} ios_backgroundColor={C.border} />} />
          {settings.quietHours?.enabled && (
            <SettingRow C={C} label="Active hours" sub={`Quiet from ${settings.quietHours?.from || "22:00"} to ${settings.quietHours?.to || "08:00"}`} right={null} last />
          )}
        </SectionCard>

        {/* ── CONTENT & SAFETY ── */}
        <SectionHeader title="Content & Safety" C={C} />
        <SectionCard C={C}>
          <SettingRow C={C} label="Content sensitivity" sub={`Currently: ${settings.contentSensitivity}`}
            right={<SegRow options={["low","medium","strict"].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))} current={settings.contentSensitivity} onSelect={(v) => updateSetting("contentSensitivity", v)} />} />
          <SettingRow C={C} label="Muted keywords" sub={`${settings.mutedKeywords?.length || 0} words hidden`} right={<Text style={{ color: C.textMuted, fontSize: 20, fontWeight: "300" }}>›</Text>} onPress={() => setShowKeywordsModal(true)} last />
        </SectionCard>

        {/* ── APPEARANCE ── */}
        <SectionHeader title="Appearance" C={C} />
        <SectionCard C={C}>
          <SettingRow C={C} label="Theme" sub={isDark ? "Dark mode" : "Light mode"}
            right={<ThemeToggle isDark={isDark} onToggle={async () => { toggleTheme(); await updateSetting("theme", isDark ? "light" : "dark"); }} C={C} />} />
          <SettingRow C={C} label={t("language")} sub={SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeLabel || "English"} right={<Text style={{ color: C.textMuted, fontSize: 20, fontWeight: "300" }}>›</Text>} onPress={() => setShowLangPicker(true)} />
          <SettingRow C={C} label="Font size" sub="Text size across the app"
            right={<SegRow options={["small","medium","large"].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))} current={fontSize} onSelect={handleFontSizeChange} />} last />
          </SectionCard>
        {/* Add this section ABOVE the "About & Support" section: */}
        <SectionHeader title="App Lock" C={C} />
        <AppLockSettings C={C} />

        {/* ── ABOUT & SUPPORT ── */}
        <SectionHeader title="About & Support" C={C} />
        <SectionCard C={C}>
          <SettingRow
            C={C}
            label="Community guidelines"
            sub="What we stand for"
            right={<Text style={{ color: C.textMuted, fontSize: 20, fontWeight: "300" }}>›</Text>}
            onPress={() => navigation.navigate("CommunityGuidelines")}
          />
          <SettingRow
            C={C}
            label="Privacy policy"
            sub="How we protect your data"
            right={<Text style={{ color: C.textMuted, fontSize: 20, fontWeight: "300" }}>›</Text>}
            onPress={() => navigation.navigate("PrivacyPolicy")}
          />
          <SettingRow
            C={C}
            label="Terms of service"
            sub="Usage agreement"
            right={<Text style={{ color: C.textMuted, fontSize: 20, fontWeight: "300" }}>›</Text>}
            onPress={() => navigation.navigate("TermsOfService")}
          />
          <SettingRow
            C={C}
            label="Contact support"
            sub="support@hushcircle.org"
            right={<Text style={{ color: C.textMuted, fontSize: 20, fontWeight: "300" }}>›</Text>}
            onPress={() => navigation.navigate("ContactSupport")}
          />
          <SettingRow C={C} label="App version" sub={`v${APP_VERSION}`} right={null} last />
          
        </SectionCard>

        {/* ── SWITCH / ADD ACCOUNT ── */}
        <SwitchAccountSection navigation={navigation} spinner={spinner} C={C} />

        {/* ── DANGER ZONE ── */}
        <SectionHeader title="Danger Zone" C={C} />
        <SectionCard C={C}>
          <SettingRow C={C} label="Delete account" sub="Permanently remove all your data"
            right={<Text style={{ color: C.error, fontSize: 20, fontWeight: "300" }}>›</Text>}
            onPress={() => setShowDeleteConfirm(true)} danger last />
        </SectionCard>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── DELETE CONFIRM MODAL ── */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 24, width: "100%", maxWidth: 340, alignItems: "center", borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>⚠️</Text>
            <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 8 }}>Delete account?</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 16 }}>
              This permanently deletes all your posts, comments, check-ins, and account data. This cannot be undone.
            </Text>
            <TextInput style={[S.input, { width: "100%", marginBottom: 16 }]} placeholder="Enter your password to confirm" placeholderTextColor={C.textMuted} value={deletePassword} onChangeText={setDeletePassword} secureTextEntry autoCapitalize="none" />
            <View style={S.actions}>
              <TouchableOpacity style={S.cancelBtn} onPress={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}><Text style={S.cancelTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[S.saveBtn, { backgroundColor: C.error }]} onPress={handleDeleteAccount}><Text style={S.saveTxt}>Delete 🗑️</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sub-modals */}
      <ChangePasswordModal visible={showPasswordModal} onClose={() => setShowPasswordModal(false)} spinner={spinner} C={C} />
      <ChangeEmailModal visible={showEmailModal} onClose={() => setShowEmailModal(false)} currentEmail={userInfo?.email || ""} spinner={spinner} C={C} />
      <MutedKeywordsModal visible={showKeywordsModal} onClose={() => setShowKeywordsModal(false)} keywords={settings.mutedKeywords || []} onAdd={handleAddKeyword} onRemove={handleRemoveKeyword} C={C} />
      <BlockedUsersModal visible={showBlockedModal} onClose={() => setShowBlockedModal(false)} spinner={spinner} onUnblocked={(userId) => removeBlockedUser(userId)} C={C} />

      {/* Language Picker */}
      <Modal visible={showLangPicker} transparent animationType="slide" onRequestClose={() => setShowLangPicker(false)}>
        <View style={S.overlay}>
          <View style={[S.sheet, { maxHeight: "80%" }]}>
            <Text style={S.title}>{t("language")}</Text>
            <Text style={S.sub}>{t("languageSub")}</Text>
            {uiTranslating && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.accentGlow, borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: C.accent + "33" }}>
                <ActivityIndicator color={C.accent} size="small" />
                <Text style={{ color: C.accentSoft, fontFamily: "Nunito_500Medium", fontSize: 13 }}>Translating app interface...</Text>
              </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_700Bold", fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8, marginTop: 4 }}>Full translations available</Text>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity key={lang.code}
                  style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: language === lang.code ? C.accent : C.border, backgroundColor: language === lang.code ? C.accentGlow : C.inputBg }}
                  onPress={async () => { await setLanguage(lang.code); setShowLangPicker(false); }}>
                  <Text style={{ fontSize: 28 }}>{lang.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 15, marginBottom: 2 }}>{lang.label}</Text>
                    <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>{lang.nativeLabel}</Text>
                  </View>
                  {language === lang.code && <Text style={{ color: C.accent, fontSize: 20, fontWeight: "bold" }}>✓</Text>}
                </TouchableOpacity>
              ))}
              {!isFullySupported && !SUPPORTED_LANGUAGES.find((l) => l.code === language) && (
                <>
                  <Text style={{ color: C.textMuted, fontFamily: "Nunito_700Bold", fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8, marginTop: 4 }}>Your device language</Text>
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: C.accent, backgroundColor: C.accentGlow }}>
                    <Text style={{ fontSize: 28 }}>🌐</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 15, marginBottom: 2 }}>{language.toUpperCase()} (auto-translated)</Text>
                      <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12 }}>UI translated on-device via API</Text>
                    </View>
                    <Text style={{ color: C.accent, fontSize: 20, fontWeight: "bold" }}>✓</Text>
                  </TouchableOpacity>
                </>
              )}
              <View style={{ backgroundColor: C.inputBg, borderRadius: 14, padding: 14, marginTop: 12, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 13, marginBottom: 8 }}>🌐 Other languages</Text>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 19, marginBottom: 6 }}>HushCircle can translate its interface to any language using on-device translation.</Text>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 19 }}>Your device language ({language.toUpperCase()}) is already applied if it's not in the list above.</Text>
              </View>
            </ScrollView>
            <TouchableOpacity style={[S.cancelBtn, { marginTop: 12 }]} onPress={() => setShowLangPicker(false)}><Text style={S.cancelTxt}>{t("cancel")}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
      <NoNetworkOverlay visible={showNoNetwork} action="profile" onRetry={() => { setShowNoNetwork(false); loadSettings(); }} onClose={() => setShowNoNetwork(false)} />
    </View>
  );
}