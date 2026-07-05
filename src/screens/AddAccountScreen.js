import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
  ScrollView, Alert, Animated, ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkContext";
import { useTheme } from "../context/ThemeContext";

const AVATAR_COLORS = [
  "#9B6FD4", "#D4607A", "#6B9FD4",
  "#4CAF8F", "#D4A44C", "#E879F9",
];

function avatarColor(pseudonym = "") {
  return AVATAR_COLORS[(pseudonym.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

export default function AddAccountScreen() {
  const { colors: C } = useTheme();                     // ← live theme colors
  const navigation    = useNavigation();
  const route         = useRoute();
  const { addAccount, accounts = [], user } = useAuth();
  const { isConnected } = useNetwork();

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState({});

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const validate = () => {
    const e = {};
    if (!email)                              e.email    = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email    = "Enter a valid email";
    if (!password)                           e.password = "Password is required";
    else if (password.length < 8)           e.password = "At least 8 characters";
    setErrors(e);
    if (Object.keys(e).length) shake();
    return Object.keys(e).length === 0;
  };

  const handleAddAccount = async () => {
    if (!validate()) return;
    if (!isConnected) { Alert.alert("No connection", "Please check your internet connection."); return; }
    if (accounts.length >= 3) { Alert.alert("Account limit reached", "You can save up to 3 accounts. Remove one before adding another.", [{ text: "OK" }]); return; }

    const activeAccount = accounts.find((a) => a.pseudonym === user?.pseudonym);
    if (email.trim().toLowerCase() === activeAccount?.email?.toLowerCase()) { setErrors({ email: "This account is already active." }); shake(); return; }

    const alreadySaved = accounts.find((a) => a.email?.toLowerCase() === email.trim().toLowerCase());
    if (alreadySaved) { setErrors({ email: "This account is already saved." }); shake(); return; }

    setLoading(true);
    try {
      const result = await addAccount(email.trim(), password);
      if (!result.success) { setErrors({ general: result.message }); shake(); return; }

      const msg = result.alreadyExisted ? "Switched to your existing account 💜" : "Account added and switched 💜";
      Alert.alert("Done!", msg, [{
        text: "Continue",
        onPress: async () => {
          if (route.params?.onSuccess) { route.params.onSuccess(); }
          else { await new Promise((r) => setTimeout(r, 300)); navigation.reset({ index: 0, routes: [{ name: "Main" }] }); }
        },
      }]);
    } catch (err) {
      setErrors({ general: err.response?.data?.message || "Could not add account. Check your credentials." });
      shake();
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Drag handle */}
      <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 28, marginTop: 12 }}>
          <Text style={{ fontSize: 44, marginBottom: 8 }}>💜</Text>
          <Text style={{ fontSize: 26, color: C.text, fontFamily: "DMSerifDisplay_400Regular", letterSpacing: 0.5, marginBottom: 8, textAlign: "center" }}>Add another account</Text>
          <Text style={{ fontSize: 13, color: C.textMuted, fontFamily: "Nunito_400Regular", textAlign: "center", lineHeight: 20 }}>
            Sign in to a different HushCircle account.{"\n"}You can save up to 3 accounts.
          </Text>
        </View>

        {/* Saved accounts preview */}
        {accounts.length > 0 && (
          <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 24 }}>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_700Bold", fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>Already saved</Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              {accounts.map((acc) => {
                const color    = acc.avatarColor || avatarColor(acc.pseudonym);
                const isActive = acc.pseudonym === user?.pseudonym;
                return (
                  <View key={acc.pseudonym} style={{ alignItems: "center", gap: 6 }}>
                    <View style={{ width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", borderWidth: 2, backgroundColor: color + "33", borderColor: color }}>
                      <Text style={{ fontSize: 22, fontFamily: "DMSerifDisplay_400Regular", color }}>{acc.pseudonym?.[0]?.toUpperCase()}</Text>
                    </View>
                    <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 11, maxWidth: 56, textAlign: "center" }} numberOfLines={1}>
                      {isActive ? "Active" : acc.pseudonym}
                    </Text>
                    {isActive && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.success, position: "absolute", top: 0, right: 0 }} />}
                  </View>
                );
              })}
              {Array.from({ length: Math.max(0, 3 - accounts.length) }).map((_, i) => (
                <View key={`empty-${i}`} style={{ alignItems: "center", gap: 6 }}>
                  <View style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: C.border, borderStyle: "dashed", justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: C.border, fontSize: 22, fontWeight: "300" }}>+</Text>
                  </View>
                  <Text style={{ color: C.textMuted, fontFamily: "Nunito_500Medium", fontSize: 11 }}>Empty</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Form */}
        <Animated.View style={{ transform: [{ translateX: shakeAnim }], gap: 4 }}>
          {errors.general && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.error + "18", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: C.error + "44" }}>
              <Ionicons name="alert-circle-outline" size={16} color={C.error} />
              <Text style={{ color: C.error, fontFamily: "Nunito_500Medium", fontSize: 13, flex: 1, lineHeight: 18 }}>{errors.general}</Text>
            </View>
          )}

          {/* Email */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: C.accentSoft, fontFamily: "Nunito_500Medium", fontSize: 13, marginBottom: 8 }}>Email</Text>
            <TextInput
              style={{ backgroundColor: C.card, borderWidth: 1, borderColor: errors.email ? C.error : C.border, borderRadius: 12, padding: 14, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15 }}
              placeholder="account@email.com"
              placeholderTextColor={C.textMuted}
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined, general: undefined })); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <Text style={{ color: C.error, fontSize: 12, fontFamily: "Nunito_400Regular", marginTop: 4 }}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: C.accentSoft, fontFamily: "Nunito_500Medium", fontSize: 13, marginBottom: 8 }}>Password</Text>
            <View style={{ flexDirection: "row", backgroundColor: C.card, borderWidth: 1, borderColor: errors.password ? C.error : C.border, borderRadius: 12, alignItems: "center" }}>
              <TextInput
                style={{ flex: 1, padding: 14, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 15 }}
                placeholder="Your password"
                placeholderTextColor={C.textMuted}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined, general: undefined })); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={{ padding: 14 }} onPress={() => setShowPassword((s) => !s)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={C.textMuted} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={{ color: C.error, fontSize: 12, fontFamily: "Nunito_400Regular", marginTop: 4 }}>{errors.password}</Text>}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={{ backgroundColor: C.accent, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8, opacity: loading ? 0.7 : 1 }}
            onPress={handleAddAccount}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 16 }}>Add account 💜</Text>}
          </TouchableOpacity>

          {/* Privacy note */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 16, paddingHorizontal: 4 }}>
            <Ionicons name="lock-closed-outline" size={13} color={C.textMuted} />
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, flex: 1, lineHeight: 18 }}>
              Passwords are never stored locally. Only your token is saved.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Cancel */}
      <TouchableOpacity style={{ borderTopWidth: 1, borderTopColor: C.border, padding: 18, alignItems: "center", backgroundColor: C.bg }} onPress={() => navigation.goBack()}>
        <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 15 }}>Cancel</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}