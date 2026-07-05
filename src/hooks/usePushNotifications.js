import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import api from "../api/api";
import { navigate } from "../navigation/RootNavigation";

export default function usePushNotifications() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotifications();

    // Fired when notification arrives while app is OPEN (foreground)
    // We just let it show the banner — no extra handling needed
    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {});

    // Fired when user TAPS the notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (!data) return;

        // ── Group post / mention / reply / mute ───────────────────────────
        // Takes user directly to that specific circle's chat
        if (data.screen === "GroupChat" && data.groupId) {
          navigate("Main", {
            screen: "Groups",
            params: {
              screen: "GroupChat",
              params: {
                group: { _id: data.groupId },
                // If a specific message postId is included, scroll to it
                scrollToPostId: data.postId || null,
              },
            },
          });
          return;
        }

        // ── Streak milestone ──────────────────────────────────────────────
        // Takes user directly to the CheckIn screen
        if (data.screen === "CheckIn" || data.type === "streak_milestone") {
          navigate("Main", {
            screen: "CheckIn",
          });
          return;
        }

        // ── Repost comment ────────────────────────────────────────────────
        // Takes user to Feed scrolled to the repost
        if (data.type === "repost_comment" && data.repostId) {
          navigate("Main", {
            screen: "Feed",
            params: { scrollToPostId: data.repostId },
          });
          return;
        }

        // ── Reaction / comment / reply / repost / mention on feed post ────
        // Takes user to Feed scrolled directly to that exact post
        if (data.postId) {
          navigate("Main", {
            screen: "Feed",
            params: { scrollToPostId: data.postId },
          });
          return;
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) return;

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "HushCircle",
        importance: Notifications.AndroidImportance.MAX,
        lightColor: "#9B6FD4",
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "542a1822-5d95-44d9-9072-37ad19adcc33",
      });
      await api.post("/notifications/token", {
        expoPushToken: tokenData.data,
        platform: Platform.OS,
      });
    } catch (e) {
      console.log("Push token error:", e.message);
    }
  };
}