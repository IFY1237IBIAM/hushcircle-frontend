import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import api from "../api/api";
import { navigate } from "../navigation/RootNavigation"; // <- use this

export default function usePushNotifications() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data?.screen === "GroupChat" && data?.groupId) {
        navigate("Groups", { // <- use navigate()
          screen: "GroupChat",
          params: {
            group: { _id: data.groupId },
            scrollToPostId: data.postId
          }
        });
      } 
      else if (data?.postId) {
        navigate("Main", { // <- use navigate()
          screen: "Feed", 
          params: { scrollToPostId: data.postId }
        });
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) return;
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
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
      });
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      await api.post("/notifications/token", {
        expoPushToken: tokenData.data,
        platform: Platform.OS,
      });
    } catch (e) {
      console.log("Push token error:", e.message);
    }
  };
}