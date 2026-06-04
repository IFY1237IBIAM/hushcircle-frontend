if (typeof ErrorUtils !== 'undefined') {
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.log('GLOBAL ERROR:', error.message);
    console.log('STACK:', error.stack);
  });
}
import { useEffect, useState, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { useFonts, DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";
import {
  Nunito_400Regular, Nunito_500Medium,
  Nunito_600SemiBold, Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { NetworkProvider } from "./src/context/NetworkContext";
import { SocketProvider } from "./src/context/SocketContext";
import NetworkBanner from "./src/components/NetworkBanner";
import AdminPopupModal from "./src/components/AdminPopupModal";
import useAdminPopup from "./src/hooks/useAdminPopup";
import usePushNotifications from "./src/hooks/usePushNotifications";
import AuthScreen from "./src/screens/AuthScreen";
import FeedScreen from "./src/screens/FeedScreen";
import CreatePostScreen from "./src/screens/CreatePostScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import AdminScreen from "./src/screens/AdminScreen";
import SearchScreen from "./src/screens/SearchScreen";
import CheckInScreen from "./src/screens/CheckInScreen";
import GroupsScreen from "./src/screens/GroupsScreen";
import GroupChatScreen from "./src/screens/GroupChatScreen";
import BanScreen from "./src/screens/BanScreen";
// import ReinstatedPopup from "./src/components/ReinstatedPopup";
import HashtagScreen from "./src/screens/HashtagScreen"; // 1. Add import
import SettingsScreen from "./src/screens/SettingsScreen";
import { ThemeProvider } from "./src/context/ThemeContext";
import UserProfileScreen from "./src/screens/UserProfileScreen";
import * as Linking from "expo-linking";
import { navigationRef } from "./src/navigation/RootNavigation";
import { useLanguage, LanguageProvider } from "./src/context/LanguageContext";
import AddAccountScreen from "./src/screens/AddAccountScreen"; // add at top of file
import { useNetwork } from "./src/context/NetworkContext";
import api from "./src/api";
import Svg, { Path, Circle } from "react-native-svg";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const COLORS = {
  bg: "#0F0A1E", card: "#1A1330", border: "#2D2450",
  accent: "#9B6FD4", accentSoft: "#C4A3E8",
  text: "#EDE8F5", textMuted: "#8B7FA8",
};

function HomeIcon({ color, size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z" fill={color} />
    </Svg>
  );
}

function NotifIcon({ color, size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill={color} />
    </Svg>
  );
}

function ProfileIcon({ color, size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" fill={color} />
      <Path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function GroupsIcon({ color, size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="3" fill={color} />
      <Circle cx="15" cy="7" r="3" fill={color} opacity="0.6" />
      <Path d="M1 20C1 16.134 4.58172 13 9 13C13.4183 13 17 16.134 17 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M13 13.5C14 13.17 15.2 13 16 13C19.866 13 23 15.686 23 19" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </Svg>
  );
}

function NotifBadge({ count }) {
  if (!count || count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99? "99+" : count}</Text>
    </View>
  );
}

function TabNavigator() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "moderator";

  usePushNotifications();

  useEffect(() => {
    if (!user) return;
    const pingPresence = async () => {
      try { await api.put("/auth/presence"); } catch (e) {}
    };
    pingPresence();
    const presenceInterval = setInterval(pingPresence, 2 * 60 * 1000);
    return () => {
      clearInterval(presenceInterval);
      api.put("/auth/offline").catch(() => {});
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const res = await api.get("/notifications/unread-count");
        setUnreadCount(res.data.count);
      } catch (e) {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.accentSoft,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontFamily: "Nunito_500Medium", marginTop: 2 },
      }}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarLabel: "Home", tabBarIcon: ({ color }) => <HomeIcon color={color} size={22} /> }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: "Search", tabBarIcon: ({ color }) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
          <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      )}} />
      <Tab.Screen name="CreatePost" component={CreatePostScreen} options={{ tabBarLabel: "", tabBarIcon: () => (
        <View style={styles.createBtn}>
          <View style={styles.createBtnInner}>
            <Text style={styles.createBtnPlus}>+</Text>
          </View>
        </View>
      ), tabBarItemStyle: { marginTop: -14 } }} />
      <Tab.Screen name="Groups" component={GroupsStack} options={{ tabBarLabel: "Circles", tabBarIcon: ({ color }) => <GroupsIcon color={color} size={22} /> }} />
      <Tab.Screen name="CheckIn" component={CheckInScreen} options={{ tabBarLabel: "Check-in", tabBarIcon: ({ color }) => (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}} />
            <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        listeners={{
          tabPress: () => {
            // instantly clear local badge
            setUnreadCount(0);

            // clear unread notifications on backend too
            api.patch("/notifications/read-all").catch(() => {});
          },
        }}
        options={{
          tabBarLabel: "Alerts",
          tabBarIcon: ({ color }) => (
            <View>
              <NotifIcon color={color} size={22} />
              <NotifBadge count={unreadCount} />
            </View>
          ),
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: "Me", tabBarIcon: ({ color }) => <ProfileIcon color={color} size={22} /> }} />
      {isAdmin && (
        <Tab.Screen name="Admin" component={AdminScreen} options={{ tabBarLabel: "Admin", tabBarIcon: ({ color }) => (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill={color} />
          </Svg>
        )}} />
      )}
    </Tab.Navigator>
  );
}

function GroupsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GroupsList" component={GroupsScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
    </Stack.Navigator>
  );
}
function OfflineLaunchScreen({ onRetry }) {
  const { t } = useLanguage();
  return (
    <View style={offlineStyles.container}>
      <Text style={offlineStyles.emoji}>📡</Text>
      <Text style={offlineStyles.title}>{t("noConnection")}</Text>
      <Text style={offlineStyles.sub}>{t("noConnectionSub")}</Text>
      <TouchableOpacity style={offlineStyles.retryBtn} onPress={onRetry}>
        <Text style={offlineStyles.retryText}>{t("retry")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const offlineStyles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#0F0A1E",
    justifyContent: "center", alignItems: "center",
    padding: 32,
  },
  emoji: { fontSize: 64, marginBottom: 20 },
  title: {
    color: "#EDE8F5", fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 26, marginBottom: 10, textAlign: "center",
  },
  sub: {
    color: "#8B7FA8", fontFamily: "Nunito_400Regular",
    fontSize: 15, textAlign: "center", lineHeight: 24, marginBottom: 32,
  },
  retryBtn: {
    backgroundColor: "#9B6FD4", borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  retryText: {
    color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 16,
  },
});
function RootNavigator() {
  const { user, loading, refreshUser, clearReinstatedStatus } = useAuth();
  const { isConnected } = useNetwork();
  const [hasCheckedNetwork, setHasCheckedNetwork] = useState(false);
  const [onboarded, setOnboarded] = useState(null);
  const { popup, visible, dismiss } = useAdminPopup();
  const reinstatedCleared = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasCheckedNetwork(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (user) {
      AsyncStorage.getItem("onboarded").then((val) => {
        setOnboarded(val === "true");
      });

      if (user.appealStatus === "reinstated" && !user.isBanned && !reinstatedCleared.current) {
        reinstatedCleared.current = true;
        clearReinstatedStatus();
      }
    } else {
      reinstatedCleared.current = false;
    }
  }, [user?.appealStatus, user?.isBanned]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0A1E", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 32, marginBottom: 16 }}>💜</Text>
        <ActivityIndicator color="#9B6FD4" />
      </View>
    );
  }

  if (hasCheckedNetwork && !isConnected && !user) {
    return <OfflineLaunchScreen onRetry={() => setHasCheckedNetwork(false)} />;
  }

  if (user && user.isBanned) {
    return <BanScreen />;
  }

  if (user && onboarded === false) {
    return <OnboardingScreen onComplete={() => setOnboarded(true)} />;
  }

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: "slide_from_right" }} />
            <Stack.Screen
              name="AddAccount"
              component={AddAccountScreen}
              options={{ presentation: "modal", headerShown: false }} // ← add this
            />
            <Stack.Screen name="Hashtag" component={HashtagScreen} options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ animation: "slide_from_right" }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
      <AdminPopupModal visible={visible && !!user} popup={popup} onDismiss={dismiss} />
    </>
  );
} // end of RootNavigator

// 1. Updated linking config (add this)
const linking = {
  prefixes: ["hushcircle://", "https://hushcircle.org"],
  config: {
    screens: {
      Main: {
        screens: {
          Feed: "post/:postId",           // Handles https://hushcircle.org/post/12345
          Groups: {
            screens: {
              GroupsList: "groups",
              GroupChat: "group/:groupId",
            },
          },
          Notifications: "notifications",
          Profile: "profile",
        },
      },
      Hashtag: "hashtag/:tag",
    },
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    const handleDeepLink = async ({ url }) => {
      if (!url) return;

      const parsed = Linking.parse(url);
      const { pathname, queryParams } = parsed;

      // Handle email verification
      if (queryParams?.token) {
        try {
          await api.post("/email/verify-email", { token: queryParams.token });
          console.log("Email verified 💜");
        } catch (err) {
          console.log("Verify failed:", err.response?.data?.message || err.message);
        }
        return;
      }

      // Handle Post Deep Link
      if (pathname?.includes("/post/") || parsed.path?.includes("post/")) {
        let postId = null;

        if (pathname) {
          postId = pathname.split("/post/")[1];
        } else if (parsed.path) {
          postId = parsed.path.split("/post/")[1];
        }

        if (postId) {
          setTimeout(() => {
            if (navigationRef.isReady()) {
              navigationRef.navigate("Main", {
                screen: "Feed",
                params: { postId },
              });
            }
          }, 700);
        }
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Handle cold start
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

  // Cleanup
  return () => subscription.remove();
}, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0A1E", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#9B6FD4" />
      </View>
    );
  }

  return (
  <LanguageProvider>
    <NetworkProvider>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <StatusBar style="light" />
            <NavigationContainer ref={navigationRef} linking={linking}>
              <RootNavigator />
            </NavigationContainer>
            <NetworkBanner />
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </NetworkProvider>
  </LanguageProvider>

);
}

const styles = StyleSheet.create({
  badge: { position: "absolute", top: -4, right: -8, backgroundColor: "#D4607A", borderRadius: 10, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: "Nunito_600SemiBold" },
  createBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#9B6FD4", justifyContent: "center", alignItems: "center", shadowColor: "#9B6FD4", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  createBtnInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#9B6FD4", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  createBtnPlus: { color: "#fff", fontSize: 26, fontWeight: "300", lineHeight: 30, marginTop: -2 },
});
