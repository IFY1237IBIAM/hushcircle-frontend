/**
 * SecurityScreen.js — Production Final
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, Modal, ActivityIndicator, Platform,
} from "react-native";
import Svg, { Path, Circle, Line, Polyline, Rect, G } from "react-native-svg";
import * as Clipboard            from "expo-clipboard";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useAuth }               from "../context/AuthContext";
import { useTheme }              from "../context/ThemeContext";
import { useNetwork }            from "../context/NetworkContext";
import HushCircleSpinner         from "../components/HushCircleSpinner";
import NoNetworkOverlay          from "../components/NoNetworkOverlay";
import useSpinner                from "../hooks/useSpinner";
import { useWebAuthnPasskey }    from "../hooks/useWebAuthnPasskey";
import api                       from "../api/api";

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const BackIcon = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="15 18 9 12 15 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LockClosedIcon = ({ size = 28, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      fill={color + "33"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LockOpenIcon = ({ size = 28, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M7 11V7a5 5 0 0 1 9.9-1"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const KeyIcon = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const KeyLargeIcon = ({ size = 26, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PhoneIcon = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="2" width="14" height="20" rx="2" ry="2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="18" x2="12.01" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CloudIcon = ({ size = 22, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DotsIcon = ({ size = 18, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="5" cy="12" r="1.5" fill={color} />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
    <Circle cx="19" cy="12" r="1.5" fill={color} />
  </Svg>
);

const XIcon = ({ size = 16, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ChevronRightIcon = ({ size = 18, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="9 18 15 12 9 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckCircleIcon = ({ size = 48, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="22 4 12 14.01 9 11.01"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckSmallIcon = ({ size = 12, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldIcon = ({ size = 18, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClipboardIcon = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="8" y="2" width="8" height="4" rx="1" ry="1"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BanIcon = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const AlertTriangleIcon = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      fill={color + "22"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const HeartIcon = ({ size = 14, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={color + "44"} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const InfoIcon = ({ size = 18, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Line x1="12" y1="8" x2="12" y2="8" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) +
      " at " +
      d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    );
  } catch { return ""; }
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function SectionHeader({ title, C }) {
  return (
    <Text style={{
      color: C.textMuted, fontFamily: "Nunito_700Bold", fontSize: 11,
      letterSpacing: 0.8, textTransform: "uppercase",
      marginTop: 28, marginBottom: 8, paddingHorizontal: 4,
    }}>{title}</Text>
  );
}

function SectionCard({ children, C }) {
  return (
    <View style={{
      backgroundColor: C.card, borderRadius: 16, borderWidth: 1,
      borderColor: C.border, overflow: "hidden", marginBottom: 4,
    }}>{children}</View>
  );
}

function Row({ label, sub, subWarning, right, onPress, danger, last, C }) {
  const inner = (
    <View style={[
      { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingVertical: 14, paddingHorizontal: 16, minHeight: 56 },
      !last && { borderBottomWidth: 1, borderBottomColor: C.border },
    ]}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ color: danger ? C.error : C.text, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>
          {label}
        </Text>
        {sub ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            {subWarning && <AlertTriangleIcon size={12} color={C.warning || C.error} />}
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 16, flex: 1 }}>
              {sub}
            </Text>
          </View>
        ) : null}
      </View>
      {right ? <View style={{ alignItems: "flex-end" }}>{right}</View> : null}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity>;
  return inner;
}

function Sheet({ visible, onClose, children, C }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}>
        <View style={{
          backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: 24, paddingBottom: 48, borderTopWidth: 1, borderColor: C.border,
          maxHeight: "92%",
        }}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PinBoxes({ pin, setPin, refs, C }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginVertical: 12 }}>
      {pin.map((digit, i) => (
        <TextInput
          key={i}
          ref={(r) => (refs.current[i] = r)}
          style={{
            width: 46, height: 58, borderRadius: 12, borderWidth: 1.5,
            textAlign: "center", fontSize: 22, fontFamily: "Nunito_700Bold",
            color: C.text,
            borderColor: digit ? C.accent : C.border,
            backgroundColor: digit ? C.accent + "15" : C.card,
          }}
          value={digit}
          onChangeText={(t) => {
            if (t.length > 1) {
              const digits = t.replace(/\D/g, "").slice(0, 6).split("");
              if (digits.length === 6) { setPin(digits); refs.current[5]?.focus(); }
              return;
            }
            const c = t.replace(/[^0-9]/g, "").slice(-1);
            const next = [...pin]; next[i] = c; setPin(next);
            if (c && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Backspace" && !pin[i] && i > 0)
              refs.current[i - 1]?.focus();
          }}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

// ─── Enable Two-Step Sheet ────────────────────────────────────────────────────

function EnableTwoStepSheet({ visible, onClose, onEnabled, C, spinner }) {
  const [step,         setStep]         = useState("setup");
  const [pin,          setPin]          = useState(Array(6).fill(""));
  const [confirmPin,   setConfirmPin]   = useState(Array(6).fill(""));
  const [hint,         setHint]         = useState("");
  const [error,        setError]        = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const pinRefs = useRef([]); const confirmRefs = useRef([]);
  const { isConnected } = useNetwork();

  const reset = () => {
    setStep("setup"); setPin(Array(6).fill("")); setConfirmPin(Array(6).fill(""));
    setHint(""); setError(""); setRecoveryCode("");
  };

  const handleEnable = async () => {
    const p1 = pin.join(""), p2 = confirmPin.join("");
    if (p1.length < 6) { setError("Enter a full 6-digit PIN."); return; }
    if (p1 !== p2)     { setError("PINs do not match."); return; }
    if (!isConnected)  { Alert.alert("No connection", "Check your internet."); return; }
    await spinner.withSpinner(async () => {
      try {
        const res = await api.post("/two-step/enable", { pin: p1, hint: hint.trim() });
        setRecoveryCode(res.data.recoveryCode);
        setStep("recovery");
      } catch (err) {
        setError(err.response?.data?.message || "Could not enable. Try again.");
      }
    }, "Enabling two-step...");
  };

  return (
    <Sheet visible={visible} onClose={() => { reset(); onClose(); }} C={C}>
      {step === "setup" ? (
        <>
          <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 6 }}>
            Set up two-step verification
          </Text>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 20, lineHeight: 20 }}>
            Pick a 6-digit PIN. You'll need it when signing in on a new device.
          </Text>
          <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 2 }}>Your PIN</Text>
          <PinBoxes pin={pin} setPin={setPin} refs={pinRefs} C={C} />
          <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 2, marginTop: 8 }}>Confirm PIN</Text>
          <PinBoxes pin={confirmPin} setPin={setConfirmPin} refs={confirmRefs} C={C} />
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 6 }}>PIN hint (optional)</Text>
            <TextInput
              style={{ backgroundColor: C.inputBg || C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15 }}
              value={hint} onChangeText={setHint}
              placeholder="e.g. 'birth year' — not the PIN itself"
              placeholderTextColor={C.textMuted} maxLength={50}
            />
          </View>
          {error ? <Text style={{ color: C.error, fontFamily: "Nunito_500Medium", fontSize: 13, marginTop: 12, textAlign: "center" }}>{error}</Text> : null}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
            <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: "center" }} onPress={() => { reset(); onClose(); }}>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: C.accent, alignItems: "center" }} onPress={handleEnable}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <HeartIcon size={13} color="#fff" />
                <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 }}>Enable</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.accent + "18", borderWidth: 1, borderColor: C.accent + "33", justifyContent: "center", alignItems: "center" }}>
              <KeyLargeIcon size={34} color={C.accent} />
            </View>
          </View>
          <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 8, textAlign: "center" }}>Save your recovery code</Text>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 20, lineHeight: 20, textAlign: "center" }}>
            If you forget your PIN, this one-time code resets it. It won't be shown again.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: C.accent + "18", borderRadius: 14, padding: 20, alignItems: "center", borderWidth: 1, borderColor: C.accent + "44", marginBottom: 16 }}
            onPress={async () => {
              await Clipboard.setStringAsync(recoveryCode);
              Alert.alert("Copied", "Recovery code copied to clipboard.");
            }}
          >
            <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 24, letterSpacing: 4 }}>{recoveryCode}</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 8 }}>Tap to copy</Text>
          </TouchableOpacity>
          <View style={{ backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 20 }}>
            {["Write it down or store in a password manager", "Never share it with anyone, including HushCircle support", "This code can only be used once"].map((tip, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 10, marginBottom: i < 2 ? 8 : 0 }}>
                <Text style={{ color: C.accent }}>•</Text>
                <Text style={{ flex: 1, color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 18 }}>{tip}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={{ backgroundColor: C.accent, borderRadius: 14, padding: 16, alignItems: "center" }} onPress={() => { reset(); onEnabled(); onClose(); }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <CheckSmallIcon size={13} color="#fff" />
              <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 16 }}>I've saved my code</Text>
            </View>
          </TouchableOpacity>
        </>
      )}
    </Sheet>
  );
}

// ─── Disable Two-Step Sheet ───────────────────────────────────────────────────

function DisableTwoStepSheet({ visible, onClose, onDisabled, C, spinner }) {
  const [pin, setPin]     = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const pinRefs = useRef([]);
  const { isConnected } = useNetwork();

  const handle = async () => {
    const p = pin.join("");
    if (p.length < 6) { setError("Enter your 6-digit PIN."); return; }
    if (!isConnected)  { Alert.alert("No connection", "Check your internet."); return; }
    await spinner.withSpinner(async () => {
      try {
        await api.post("/two-step/disable", { pin: p });
        setPin(Array(6).fill("")); setError(""); onDisabled(); onClose();
      } catch (err) { setError(err.response?.data?.message || "Incorrect PIN."); }
    }, "Disabling two-step...");
  };

  return (
    <Sheet visible={visible} onClose={() => { setPin(Array(6).fill("")); setError(""); onClose(); }} C={C}>
      <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 6 }}>Disable two-step</Text>
      <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 16, lineHeight: 20 }}>Enter your PIN to turn off two-step verification.</Text>
      <PinBoxes pin={pin} setPin={setPin} refs={pinRefs} C={C} />
      {error ? <Text style={{ color: C.error, fontFamily: "Nunito_500Medium", fontSize: 13, textAlign: "center", marginTop: 4 }}>{error}</Text> : null}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: "center" }} onPress={() => { setPin(Array(6).fill("")); setError(""); onClose(); }}>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: C.error, alignItems: "center" }} onPress={handle}>
          <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 }}>Disable</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}

// ─── Change PIN Sheet ─────────────────────────────────────────────────────────

function ChangePinSheet({ visible, onClose, C, spinner }) {
  const [cur, setCur]     = useState(Array(6).fill(""));
  const [nxt, setNxt]     = useState(Array(6).fill(""));
  const [cf,  setCf]      = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const r1 = useRef([]); const r2 = useRef([]); const r3 = useRef([]);
  const { isConnected } = useNetwork();
  const reset = () => { setCur(Array(6).fill("")); setNxt(Array(6).fill("")); setCf(Array(6).fill("")); setError(""); };

  const handle = async () => {
    const c = cur.join(""), n = nxt.join(""), conf = cf.join("");
    if (c.length < 6) { setError("Enter your current PIN."); return; }
    if (n.length < 6) { setError("Enter a new 6-digit PIN."); return; }
    if (n !== conf)   { setError("New PINs do not match."); return; }
    if (c === n)      { setError("New PIN must differ from current PIN."); return; }
    if (!isConnected) { Alert.alert("No connection", "Check your internet."); return; }
    await spinner.withSpinner(async () => {
      try {
        await api.post("/two-step/change-pin", { currentPin: c, newPin: n });
        Alert.alert("PIN updated", "Your two-step PIN has been changed.");
        reset(); onClose();
      } catch (err) { setError(err.response?.data?.message || "Could not change PIN."); }
    }, "Updating PIN...");
  };

  return (
    <Sheet visible={visible} onClose={() => { reset(); onClose(); }} C={C}>
      <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, marginBottom: 20 }}>Change PIN</Text>
      {[
        { label: "Current PIN",     p: cur, set: setCur, refs: r1 },
        { label: "New PIN",         p: nxt, set: setNxt, refs: r2 },
        { label: "Confirm new PIN", p: cf,  set: setCf,  refs: r3 },
      ].map(({ label, p, set, refs }, i) => (
        <View key={i} style={{ marginBottom: 4 }}>
          <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 2 }}>{label}</Text>
          <PinBoxes pin={p} setPin={set} refs={refs} C={C} />
        </View>
      ))}
      {error ? <Text style={{ color: C.error, fontFamily: "Nunito_500Medium", fontSize: 13, textAlign: "center", marginBottom: 8 }}>{error}</Text> : null}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: "center" }} onPress={() => { reset(); onClose(); }}>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: C.accent, alignItems: "center" }} onPress={handle}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <CheckSmallIcon size={12} color="#fff" />
            <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 }}>Update PIN</Text>
          </View>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}

// ─── Add Passkey Sheet ────────────────────────────────────────────────────────

function AddPasskeySheet({ visible, onClose, onAdded, C, spinner }) {
  const { registerPasskey } = useWebAuthnPasskey();
  const { token }           = useAuth();
  const { isConnected }     = useNetwork();
  const [deviceName, setDeviceName] = useState("");
  const [step, setStep]             = useState("info");

  const handle = async () => {
    if (!isConnected) { Alert.alert("No connection", "Check your internet."); return; }
    await spinner.withSpinner(async () => {
      const name   = deviceName.trim() || (Platform.OS === "ios" ? "iPhone" : "Android");
      const result = await registerPasskey(name, token);
      if (result.cancelled) return;
      if (!result.success) {
        Alert.alert("Oops", result.error || "Could not create passkey. Try again.");
        return;
      }
      setStep("done");
      setTimeout(() => { setStep("info"); setDeviceName(""); onAdded(); onClose(); }, 1400);
    }, "Creating passkey...");
  };

  return (
    <Sheet visible={visible} onClose={() => { setStep("info"); setDeviceName(""); onClose(); }} C={C}>
      {step === "done" ? (
        <View style={{ alignItems: "center", paddingVertical: 32 }}>
          <CheckCircleIcon size={56} color={C.success || "#4CAF8F"} />
          <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 24, textAlign: "center", marginTop: 16 }}>Passkey created</Text>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            Your passkey is stored securely on this device.
          </Text>
        </View>
      ) : (
        <>
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.accent + "18", borderWidth: 1, borderColor: C.accent + "33", justifyContent: "center", alignItems: "center" }}>
              <KeyLargeIcon size={30} color={C.accent} />
            </View>
          </View>
          <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, textAlign: "center", marginBottom: 8 }}>Create a passkey</Text>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, textAlign: "center", marginBottom: 24, lineHeight: 20 }}>
            Your device will ask you to confirm with your fingerprint or face. The key never leaves your device.
          </Text>
          <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 6 }}>Passkey name (optional)</Text>
          <TextInput
            style={{ backgroundColor: C.inputBg || C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15, marginBottom: 20 }}
            value={deviceName} onChangeText={setDeviceName}
            placeholder={Platform.OS === "ios" ? "e.g. My iPhone" : "e.g. My Galaxy S20"}
            placeholderTextColor={C.textMuted} maxLength={40}
          />
          <View style={{ backgroundColor: C.accent + "12", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.accent + "30", marginBottom: 24 }}>
            {[
              "Passkey stored securely in this device's hardware",
              "Your biometrics never leave this device",
              "You can delete this passkey anytime",
              "Works with fingerprint, face unlock, or device PIN",
            ].map((tip, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 10, marginBottom: i < 3 ? 8 : 0 }}>
                <CheckSmallIcon size={12} color={C.accent} />
                <Text style={{ flex: 1, color: C.accentSoft, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 18 }}>{tip}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: "center" }} onPress={() => { setStep("info"); setDeviceName(""); onClose(); }}>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 14, backgroundColor: C.accent, alignItems: "center" }} onPress={handle}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <KeyIcon size={13} color="#fff" />
                <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 }}>Create passkey</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}
    </Sheet>
  );
}

// ─── Passkey Info Sheet ───────────────────────────────────────────────────────

function PasskeyInfoSheet({ visible, onClose, C }) {
  const items = [
    { Icon: PhoneIcon,  iconColor: C.accent,      title: "Stored on your device",    body: "A passkey is a cryptographic key stored in your device's secure hardware. It never travels over the network." },
    { Icon: ShieldIcon, iconColor: C.accent,      title: "Unlocked by your biometrics", body: "Your fingerprint or face unlock confirms it's you. HushCircle never receives your biometric data." },
    { Icon: BanIcon,    iconColor: C.error,       title: "Phishing-proof",           body: "A passkey only works with the real HushCircle app. A fake app can never steal it because there's no password to steal." },
    { Icon: KeyIcon,    iconColor: C.accent,      title: "One passkey per device",   body: "Each device has its own passkey. Register a new one on a new device and delete old ones you no longer use." },
    { Icon: HeartIcon,  iconColor: C.accentSoft,  title: "We never see your secrets", body: "HushCircle stores only your device name and registration date. Never your biometrics, never a private key." },
  ];

  return (
    <Sheet visible={visible} onClose={onClose} C={C}>
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.accent + "18", borderWidth: 1, borderColor: C.accent + "33", justifyContent: "center", alignItems: "center" }}>
          <KeyLargeIcon size={30} color={C.accent} />
        </View>
      </View>
      <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22, textAlign: "center", marginBottom: 20 }}>How passkeys work</Text>
      {items.map((item, i) => (
        <View key={i} style={[{ flexDirection: "row", gap: 14, paddingVertical: 14 }, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
          <item.Icon size={22} color={item.iconColor} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 14, marginBottom: 4 }}>{item.title}</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 19 }}>{item.body}</Text>
          </View>
        </View>
      ))}
      <TouchableOpacity style={{ marginTop: 20, backgroundColor: C.accent, borderRadius: 14, padding: 14, alignItems: "center" }} onPress={onClose}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <CheckSmallIcon size={12} color="#fff" />
          <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 }}>Got it</Text>
        </View>
      </TouchableOpacity>
    </Sheet>
  );
}

// ─── Passkey Device Row ───────────────────────────────────────────────────────

function PasskeyRow({ passkey, onDelete, C }) {
  const [confirming, setConfirming] = useState(false);
  const isSync = passkey.backedUp || passkey.deviceType === "multiDevice";

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.accent + "18", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.accent + "33" }}>
          {isSync
            ? <CloudIcon size={22} color={C.accent} />
            : <PhoneIcon size={22} color={C.accent} />
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 14 }}>{passkey.deviceName}</Text>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 1 }}>
            Created {formatDate(passkey.createdAt)}
          </Text>
          {passkey.lastUsedAt ? (
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, marginTop: 1 }}>
              Last used {formatDate(passkey.lastUsedAt)}
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.success || "#4CAF8F" }} />
            <Text style={{ color: C.success || "#4CAF8F", fontFamily: "Nunito_500Medium", fontSize: 11 }}>
              {passkey.tier === "webauthn" ? "Synced · Google Password Manager" : "Stored on device"}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setConfirming(!confirming)} style={{ padding: 8 }}>
          {confirming
            ? <XIcon size={16} color={C.error} />
            : <DotsIcon size={18} color={C.textMuted} />
          }
        </TouchableOpacity>
      </View>
      {confirming && (
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: C.error + "10", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.error + "30" }}>
            <Text style={{ color: C.error, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 2 }}>Delete this passkey?</Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, lineHeight: 15 }}>
              You'll need your password or another passkey to sign in.
            </Text>
          </View>
          <View style={{ gap: 8 }}>
            <TouchableOpacity style={{ backgroundColor: C.error, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
              onPress={() => { setConfirming(false); onDelete(passkey._id, passkey.deviceName); }}>
              <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 12 }}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: C.border + "66", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
              onPress={() => setConfirming(false)}>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 12 }}>Keep</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main SecurityScreen ──────────────────────────────────────────────────────

export default function SecurityScreen() {
  const navigation    = useNavigation();
  const { colors: C } = useTheme();
  const { isConnected } = useNetwork();
  const spinner       = useSpinner();
  const { deletePasskey, listPasskeys, getBiometricLabel } = useWebAuthnPasskey();

  const [twoStepStatus, setTwoStepStatus] = useState(null);
  const [passkeys,      setPasskeys]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showNoNetwork, setShowNoNetwork] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometrics");

  const [showEnable,      setShowEnable]      = useState(false);
  const [showDisable,     setShowDisable]     = useState(false);
  const [showChangePin,   setShowChangePin]   = useState(false);
  const [showAddPasskey,  setShowAddPasskey]  = useState(false);
  const [showPasskeyInfo, setShowPasskeyInfo] = useState(false);

  useEffect(() => {
    getBiometricLabel().then(setBiometricLabel).catch(() => {});
  }, []);

  const loadAll = useCallback(async () => {
    if (!isConnected) { setShowNoNetwork(true); return; }
    try {
      const [statusRes, pks] = await Promise.all([
        api.get("/two-step/status"),
        listPasskeys(),
      ]);
      setTwoStepStatus(statusRes.data);
      setPasskeys(Array.isArray(pks) ? pks : []);
    } catch (e) {
      console.log("Security load error:", e.message);
      if (!twoStepStatus) setTwoStepStatus({ twoStepEnabled: false, twoStepHint: "", recoveryUsed: false });
    }
  }, [isConnected]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, [loadAll]));

  const handleDeletePasskey = async (passkeyId) => {
    await spinner.withSpinner(async () => {
      try {
        await deletePasskey(passkeyId);
        setPasskeys((prev) => prev.filter((p) => p._id !== passkeyId));
      } catch {
        Alert.alert("Error", "Could not delete passkey. Try again.");
      }
    }, "Deleting passkey...");
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center", gap: 12 }}>
        <ActivityIndicator color={C.accent} size="large" />
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14 }}>Loading security settings...</Text>
      </View>
    );
  }

  const status = twoStepStatus || { twoStepEnabled: false, twoStepHint: "", recoveryUsed: false };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.card }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, justifyContent: "center", alignItems: "flex-start" }}>
          <BackIcon size={22} color={C.accent} />
        </TouchableOpacity>
        <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 22 }}>Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }}>

        {/* ── TWO-STEP ── */}
        <SectionHeader title="Two-Step Verification" C={C} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: status.twoStepEnabled ? C.accent + "18" : C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: status.twoStepEnabled ? C.accent + "44" : C.border, marginBottom: 12 }}>
          {status.twoStepEnabled
            ? <LockClosedIcon size={28} color={C.accent} />
            : <LockOpenIcon size={28} color={C.textMuted} />
          }
          <View style={{ flex: 1 }}>
            <Text style={{ color: status.twoStepEnabled ? C.accentSoft : C.text, fontFamily: "Nunito_700Bold", fontSize: 14 }}>
              {status.twoStepEnabled ? "Two-step is ON" : "Two-step is OFF"}
            </Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2, lineHeight: 16 }}>
              {status.twoStepEnabled
                ? `PIN required on new sign-ins.${status.twoStepHint ? `  Hint: "${status.twoStepHint}"` : ""}`
                : "Require a PIN on top of your password for new sign-ins."}
            </Text>
          </View>
        </View>

        <SectionCard C={C}>
          {!status.twoStepEnabled ? (
            <Row C={C} last label="Enable two-step verification" sub="Set a 6-digit PIN — like WhatsApp"
              right={<Text style={{ color: C.accent, fontFamily: "Nunito_700Bold", fontSize: 13 }}>Set up</Text>}
              onPress={() => setShowEnable(true)} />
          ) : (
            <>
              <Row C={C} label="Change PIN" sub="Update your two-step PIN"
                right={<ChevronRightIcon size={18} color={C.textMuted} />}
                onPress={async () => {
                  try {
                    const fresh = await api.get("/two-step/status");
                    if (!fresh.data.twoStepEnabled) {
                      setTwoStepStatus((p) => ({ ...p, twoStepEnabled: false }));
                      Alert.alert(
                        "Two-step is off",
                        "Enable two-step verification first to set a PIN."
                      );
                      return;
                    }
                    setTwoStepStatus((p) => ({ ...p, ...fresh.data }));
                  } catch {}
                  setShowChangePin(true);
                }} />
              <Row C={C} label="Recovery code"
                sub={status.recoveryUsed ? "Code used — re-enable to get a new one" : "One-time backup to reset your PIN"}
                subWarning={status.recoveryUsed}
                right={<ChevronRightIcon size={18} color={C.textMuted} />}
                onPress={() => Alert.alert("Recovery code",
                  status.recoveryUsed
                    ? "Your recovery code was already used. Disable and re-enable two-step to generate a new one."
                    : "Your recovery code was shown when you enabled two-step. Store it in a password manager. Disable and re-enable to get a fresh one."
                )} />
              <Row C={C} last danger label="Disable two-step verification"
                sub="Only your password will be required to sign in"
                right={<ChevronRightIcon size={18} color={C.error} />}
                onPress={async () => {
                  // Refetch fresh status right before opening the sheet —
                  // prevents acting on stale cached state that no longer
                  // matches what's actually in the database
                  try {
                    const fresh = await api.get("/two-step/status");
                    if (!fresh.data.twoStepEnabled) {
                      setTwoStepStatus((p) => ({ ...p, twoStepEnabled: false }));
                      Alert.alert(
                        "Already disabled",
                        "Two-step verification is not currently enabled on your account."
                      );
                      return;
                    }
                    setTwoStepStatus((p) => ({ ...p, ...fresh.data }));
                  } catch {}
                  setShowDisable(true);
                }} />
            </>
          )}
        </SectionCard>

        {/* ── PASSKEYS ── */}
        <SectionHeader title={`Passkeys  (${biometricLabel})`} C={C} />

        {passkeys.length > 0 ? (
          <SectionCard C={C}>
            {passkeys.map((pk, i) => (
              <View key={pk._id} style={i < passkeys.length - 1 ? { borderBottomWidth: 1, borderBottomColor: C.border } : {}}>
                <PasskeyRow passkey={pk} onDelete={handleDeletePasskey} C={C} />
              </View>
            ))}
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: C.border }}
              onPress={() => setShowAddPasskey(true)} activeOpacity={0.75}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.accent, justifyContent: "center", alignItems: "center", backgroundColor: C.accent + "10" }}>
                <Text style={{ color: C.accent, fontSize: 22, fontWeight: "300" }}>+</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 14 }}>Create a passkey</Text>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 1 }}>Add another device or replace an existing passkey</Text>
              </View>
              <ChevronRightIcon size={18} color={C.textMuted} />
            </TouchableOpacity>
          </SectionCard>
        ) : (
          <TouchableOpacity
            style={{ backgroundColor: C.accent + "12", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.accent + "33", flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 }}
            onPress={() => setShowAddPasskey(true)} activeOpacity={0.8}
          >
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.accent + "22", justifyContent: "center", alignItems: "center" }}>
              <KeyLargeIcon size={26} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 15, marginBottom: 4 }}>Create a passkey</Text>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 18 }}>
                Sign in with {biometricLabel} — no password needed
              </Text>
            </View>
            <ChevronRightIcon size={18} color={C.accent} />
          </TouchableOpacity>
        )}

        {/* Stored securely strip */}
        <View style={{ backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <LockClosedIcon size={18} color={C.accentSoft} />
            <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 13, flex: 1 }}>
              {passkeys.length > 0
                ? `Your passkey${passkeys.length > 1 ? "s are" : " is"} stored securely on this device.`
                : "Passkeys are stored securely in your device hardware."}
            </Text>
          </View>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 18, marginBottom: 10 }}>
            The private key never leaves your device. HushCircle only stores your device name and registration date.
          </Text>
          <TouchableOpacity onPress={() => setShowPasskeyInfo(true)}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ color: C.accent, fontFamily: "Nunito_700Bold", fontSize: 13 }}>Learn more</Text>
              <ChevronRightIcon size={13} color={C.accent} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Security tips */}
        <SectionHeader title="Security tips" C={C} />
        <SectionCard C={C}>
          {[
            { Icon: LockClosedIcon, iconColor: C.accent,     label: "Enable two-step",       sub: "Protects you even if your password is compromised" },
            { Icon: KeyIcon,        iconColor: C.accent,     label: "Create a passkey",      sub: "Faster and more secure than any password" },
            { Icon: ClipboardIcon,  iconColor: C.accentSoft, label: "Save your recovery code", sub: "Store it in a password manager or write it down" },
            { Icon: BanIcon,        iconColor: C.error,      label: "Never share your PIN",  sub: "HushCircle staff will never ask for it" },
          ].map((tip, i, arr) => (
            <View key={i} style={[{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 16 }, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
              <tip.Icon size={20} color={tip.iconColor} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 13 }}>{tip.label}</Text>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 1 }}>{tip.sub}</Text>
              </View>
            </View>
          ))}
        </SectionCard>

        <View style={{ height: 48 }} />
        <SectionHeader title="Login Activity" C={C} />
        <SectionCard C={C}>
          <Row
            C={C} last
            label="Login activity"
            sub="See where and when your account was accessed"
            right={<ChevronRightIcon size={18} color={C.textMuted} />}
            onPress={() => navigation.navigate("LoginActivity")}
          />
        </SectionCard>
      </ScrollView>

      <EnableTwoStepSheet  visible={showEnable}      onClose={() => setShowEnable(false)}      onEnabled={() => setTwoStepStatus((p) => ({ ...p, twoStepEnabled: true }))}  C={C} spinner={spinner} />
      <DisableTwoStepSheet visible={showDisable}     onClose={() => setShowDisable(false)}     onDisabled={() => setTwoStepStatus((p) => ({ ...p, twoStepEnabled: false }))} C={C} spinner={spinner} />
      <ChangePinSheet      visible={showChangePin}   onClose={() => setShowChangePin(false)}   C={C} spinner={spinner} />
      <AddPasskeySheet     visible={showAddPasskey}  onClose={() => setShowAddPasskey(false)}  onAdded={loadAll} C={C} spinner={spinner} />
      <PasskeyInfoSheet    visible={showPasskeyInfo} onClose={() => setShowPasskeyInfo(false)} C={C} />

      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
      <NoNetworkOverlay  visible={showNoNetwork} action="security"
        onRetry={() => { setShowNoNetwork(false); loadAll(); }}
        onClose={() => setShowNoNetwork(false)} />
    </View>
  );
}