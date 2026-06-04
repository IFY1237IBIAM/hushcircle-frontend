import { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Modal,
  Animated, Easing,
} from "react-native";import { useTheme } from "../context/ThemeContext";



export default function HushCircleSpinner({ visible, message = "" }) {
  const { colors: COLORS } = useTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      // Fade + scale in
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      ]).start();

      // Rotate spinner ring
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Pulse the W
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();

      // Dot wave animation
      const dotWave = (anim, delay) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
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
        Animated.timing(scaleAnim, { toValue: 0.8, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal transparent animationType="none" visible={visible} statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>

          {/* Spinning ring */}
          <View style={styles.ringWrap}>
            <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]} />
            <Animated.View style={[styles.ringInner, { transform: [{ rotate: spin }] }]} />

            {/* W logo in center */}
            <Animated.View style={[styles.logoWrap, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.logoText}>HC</Text>
            </Animated.View>
          </View>

          {/* Message */}
          {message ? (
            <Text style={styles.message}>{message}</Text>
          ) : null}

          {/* Dot wave */}
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
            <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
            <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
          </View>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}


  const styles = StyleSheet.create({

  overlay: {

  flex: 1,

  backgroundColor: "#0F0A1E",

  justifyContent: "center",

  alignItems: "center",

  },

  container: {

  alignItems: "center",

  gap: 20,

  },

  ringWrap: {

  width: 100,

  height: 100,

  justifyContent: "center",

  alignItems: "center",

  },

  ring: {

  position: "absolute",

  width: 100,

  height: 100,

  borderRadius: 50,

  borderWidth: 3,

  borderColor: "transparent",

  borderTopColor: "#9B6FD4",

  borderRightColor: "#C4A3E844",

  },

  ringInner: {

  position: "absolute",

  width: 84,

  height: 84,

  borderRadius: 42,

  borderWidth: 2,

  borderColor: "transparent",

  borderBottomColor: "#9B6FD466",

  borderLeftColor: "#C4A3E822",

  },

  logoWrap: {

  width: 64,

  height: 64,

  borderRadius: 32,

  backgroundColor: "#1A1330",

  borderWidth: 1.5,

  borderColor: "#9B6FD444",

  justifyContent: "center",

  alignItems: "center",

  },

  logoText: {

  color: "#C4A3E8",

  fontSize: 22,

  fontFamily: "DMSerifDisplay_400Regular",

  letterSpacing: 0.5,

  },

  message: {

  color: "#C4A3E8",

  fontFamily: "Inter_500Medium",

  fontSize: 14,

  textAlign: "center",

  letterSpacing: 0.3,

  },

  dotsRow: {

  flexDirection: "row",

  gap: 8,

  alignItems: "center",

  },

  dot: {

  width: 6,

  height: 6,

  borderRadius: 3,

  backgroundColor: "#9B6FD4",

  },

  });

