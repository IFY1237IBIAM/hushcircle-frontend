/**
 * components/AppLockSettings.js
 *
 * The settings section that appears inside SettingsScreen.
 * Drop this component directly into your SettingsScreen.js.
 *
 * Shows:
 *   - Toggle to enable/disable app lock
 *   - Lock delay options (immediately, 1 min, 5 min, 30 min)
 *   - Security badge info
 *   - Graceful message if biometrics not available on device
 */

import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, Switch, Alert, ActivityIndicator,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as Device               from "expo-device";
import { Platform }              from "react-native";
import { useAppLock }            from "../context/AppLockContext";

function getSecurityBadge() {
  if (Platform.OS === "ios") return "Apple Secure Enclave";
  const brand = (Device.brand || "").toLowerCase();
  if (brand.includes("samsung")) return "Samsung Knox";
  if (brand.includes("google") || brand.includes("pixel")) return "Google Titan";
  return "Android Security";
}

export default function AppLockSettings({ C }) {
  const {
    isEnabled,
    lockDelay,
    enableAppLock,
    disableAppLock,
    updateLockDelay,
    authenticate,
  } = useAppLock();

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType,      setBiometricType]      = useState("Biometrics");
  const [checking,           setChecking]           = useState(true);
  const [toggling,           setToggling]           = useState(false);

  const securityBadge = getSecurityBadge();

  // Check biometric availability
  useEffect(() => {
    (async () => {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled   = await LocalAuthentication.isEnrolledAsync();
        const types      = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setBiometricAvailable(compatible && enrolled);
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType(Platform.OS === "ios" ? "Face ID" : "Face Recognition");
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType(Platform.OS === "ios" ? "Touch ID" : "Fingerprint");
        }
      } catch {}
      setChecking(false);
    })();
  }, []);

  const handleToggle = async (value) => {
    if (toggling) return;
    setToggling(true);
    try {
      if (value) {
        // Require biometric confirmation before enabling
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage:         "Confirm to enable App Lock",
          fallbackLabel:         "Use device PIN",
          cancelLabel:           "Cancel",
          disableDeviceFallback: false,
        });
        if (!result.success) {
          setToggling(false);
          return;
        }
        await enableAppLock(lockDelay);
        Alert.alert(
          "App Lock enabled 💜",
          `HushCircle will lock with ${biometricType} when you leave the app.`
        );
      } else {
        // Require biometric confirmation before disabling too
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage:         "Confirm to disable App Lock",
          fallbackLabel:         "Use device PIN",
          cancelLabel:           "Cancel",
          disableDeviceFallback: false,
        });
        if (!result.success) {
          setToggling(false);
          return;
        }
        await disableAppLock();
      }
    } catch {}
    setToggling(false);
  };

  const handleDelayChange = async (delay) => {
    await updateLockDelay(delay);
  };

  const DELAY_OPTIONS = [
    { value: "immediately", label: "Immediately",   sub: "Lock as soon as you leave the app" },
    { value: "1min",        label: "After 1 minute", sub: "Lock if away for more than 1 minute" },
    { value: "5min",        label: "After 5 minutes",sub: "Lock if away for more than 5 minutes" },
    { value: "30min",       label: "After 30 minutes",sub: "Lock if away for more than 30 minutes" },
  ];

  if (checking) {
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <ActivityIndicator color={C.accent} size="small" />
      </View>
    );
  }

  if (!biometricAvailable) {
    return (
      <View style={{
        backgroundColor: C.card, borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: C.border, marginBottom: 4,
      }}>
        <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 14, marginBottom: 6 }}>
          App Lock not available
        </Text>
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 18 }}>
          {`App Lock requires biometric authentication (${biometricType}) to be set up on your device. Go to your device Settings to enroll your fingerprint or face.`}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Main toggle row */}
      <View style={{
        backgroundColor: C.card, borderRadius: 16,
        borderWidth: 1, borderColor: C.border,
        overflow: "hidden", marginBottom: 4,
      }}>
        {/* Toggle */}
        <View style={{
          flexDirection: "row", alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 14, paddingHorizontal: 16,
          borderBottomWidth: isEnabled ? 1 : 0,
          borderBottomColor: C.border,
        }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>
              {`Lock with ${biometricType}`}
            </Text>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2 }}>
              {isEnabled
                ? `App locks when you leave · ${securityBadge}`
                : `Require ${biometricType} to open HushCircle`}
            </Text>
          </View>
          {toggling ? (
            <ActivityIndicator color={C.accent} size="small" />
          ) : (
            <Switch
              value={isEnabled}
              onValueChange={handleToggle}
              trackColor={{ false: C.border, true: C.accent + "66" }}
              thumbColor={isEnabled ? C.accent : C.textMuted}
              ios_backgroundColor={C.border}
            />
          )}
        </View>

        {/* Lock delay options — only shown when enabled */}
        {isEnabled && (
          <View>
            <Text style={{
              color: C.textMuted, fontFamily: "Nunito_700Bold",
              fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase",
              paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
            }}>
              Lock after
            </Text>
            {DELAY_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  {
                    flexDirection: "row", alignItems: "center",
                    paddingVertical: 12, paddingHorizontal: 16, gap: 12,
                  },
                  i < DELAY_OPTIONS.length - 1 && {
                    borderBottomWidth: 1, borderBottomColor: C.border,
                  },
                  lockDelay === opt.value && {
                    backgroundColor: C.accent + "10",
                  },
                ]}
                onPress={() => handleDelayChange(opt.value)}
                activeOpacity={0.7}
              >
                {/* Radio dot */}
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  borderWidth: 2,
                  borderColor: lockDelay === opt.value ? C.accent : C.border,
                  justifyContent: "center", alignItems: "center",
                }}>
                  {lockDelay === opt.value && (
                    <View style={{
                      width: 10, height: 10, borderRadius: 5,
                      backgroundColor: C.accent,
                    }} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: lockDelay === opt.value ? C.accentSoft : C.text,
                    fontFamily: "Nunito_600SemiBold", fontSize: 14,
                  }}>
                    {opt.label}
                  </Text>
                  <Text style={{
                    color: C.textMuted, fontFamily: "Nunito_400Regular",
                    fontSize: 12, marginTop: 1,
                  }}>
                    {opt.sub}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Security badge strip */}
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: C.card, borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: C.border, marginBottom: 4,
      }}>
        <Text style={{ fontSize: 18 }}>🛡️</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 13 }}>
            {`Secured by ${securityBadge}`}
          </Text>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2, lineHeight: 16 }}>
            Your biometrics never leave this device. HushCircle cannot access them.
          </Text>
        </View>
      </View>
    </View>
  );
}