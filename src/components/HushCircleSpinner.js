import { useEffect, useRef } from "react";
import { View, Text, Modal, Animated, Easing } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function HushCircleSpinner({ visible, message = "" }) {
  const { colors: C } = useTheme();                     // ← live theme colors

  const rotateAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const dot1Anim    = useRef(new Animated.Value(0.3)).current;
  const dot2Anim    = useRef(new Animated.Value(0.3)).current;
  const dot3Anim    = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();

      const dotWave = (anim, delay) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, { toValue: 1,   duration: 400, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
            Animated.delay(800 - delay),
          ])
        );

      dotWave(dot1Anim, 0).start();
      dotWave(dot2Anim, 200).start();
      dotWave(dot3Anim, 400).start();
    } else {
      rotateAnim.stopAnimation();
      pulseAnim.stopAnimation();
      dot1Anim.stopAnimation();
      dot2Anim.stopAnimation();
      dot3Anim.stopAnimation();
      rotateAnim.setValue(0);
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim,   { toValue: 0.8, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <Animated.View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center", opacity: opacityAnim }}>
        <Animated.View style={{ alignItems: "center", gap: 20, transform: [{ scale: scaleAnim }] }}>

          {/* Spinning ring */}
          <View style={{ width: 100, height: 100, justifyContent: "center", alignItems: "center" }}>
            {/* Outer ring */}
            <Animated.View style={{
              position: "absolute", width: 100, height: 100, borderRadius: 50,
              borderWidth: 3, borderColor: "transparent",
              borderTopColor: C.accent,
              borderRightColor: C.accentSoft + "44",
              transform: [{ rotate: spin }],
            }} />
            {/* Inner ring */}
            <Animated.View style={{
              position: "absolute", width: 84, height: 84, borderRadius: 42,
              borderWidth: 2, borderColor: "transparent",
              borderBottomColor: C.accent + "66",
              borderLeftColor: C.accentSoft + "22",
              transform: [{ rotate: spin }],
            }} />
            {/* HC logo */}
            <Animated.View style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: C.card,
              borderWidth: 1.5, borderColor: C.accent + "44",
              justifyContent: "center", alignItems: "center",
              transform: [{ scale: pulseAnim }],
            }}>
              <Text style={{ color: C.accentSoft, fontSize: 22, fontFamily: "DMSerifDisplay_400Regular", letterSpacing: 0.5 }}>HC</Text>
            </Animated.View>
          </View>

          {/* Message */}
          {!!message && (
            <Text style={{ color: C.accentSoft, fontFamily: "Nunito_500Medium", fontSize: 14, textAlign: "center", letterSpacing: 0.3 }}>
              {message}
            </Text>
          )}

          {/* Dot wave */}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            {[dot1Anim, dot2Anim, dot3Anim].map((anim, i) => (
              <Animated.View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent, opacity: anim }} />
            ))}
          </View>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}