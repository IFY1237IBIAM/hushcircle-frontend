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
import HashtagScreen from "./src/screens/HashtagScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import UserProfileScreen from "./src/screens/UserProfileScreen";
import * as Linking from "expo-linking";
import { navigationRef } from "./src/navigation/RootNavigation";
import { useLanguage, LanguageProvider } from "./src/context/LanguageContext";
import AddAccountScreen from "./src/screens/AddAccountScreen";
import { useNetwork } from "./src/context/NetworkContext";

import CommunityGuidelinesScreen from "./src/screens/CommunityGuidelinesScreen";
import PrivacyPolicyScreen        from "./src/screens/PrivacyPolicyScreen";
import TermsOfServiceScreen       from "./src/screens/TermsOfServiceScreen";
import AccountRecoveryScreen from "./src/screens/AccountRecoveryScreen";
import ContactSupportScreen       from "./src/screens/ContactSupportScreen";
import SecurityScreen from "./src/screens/SecurityScreen";
import AppLockScreen from "./src/components/AppLockScreen";
import { useAppLock, AppLockProvider } from "./src/context/AppLockContext";
import LoginActivityScreen from "./src/screens/LoginActivityScreen";
import AdminRecoveryRequestsScreen from "./src/screens/AdminRecoveryRequestsScreen";
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
const Tab   = createBottomTabNavigator();

// ─── SVG Icons ────────────────────────────────────────────────────────────────

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

function NotifBadge({ count, errorColor }) {
  if (!count || count === 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor: errorColor }]}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

// ─── Groups Stack ─────────────────────────────────────────────────────────────
// Uses a separate Stack navigator ref so we can imperatively reset it to
// GroupsList whenever the Circles tab is pressed — regardless of whether the
// user arrived at GroupChat from inside the tab or from Circle Pulse in Feed.

const groupsStackRef = React.createRef();

function GroupsStack() {
  return (
    <Stack.Navigator
      ref={groupsStackRef}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="GroupsList" component={GroupsScreen} />
      <Stack.Screen name="GroupChat"  component={GroupChatScreen} />
    </Stack.Navigator>
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────

function TabNavigator() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user }   = useAuth();
  const { colors } = useTheme();
  const isAdmin    = user?.role === "admin" || user?.role === "moderator";

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
          backgroundColor: colors.tabBar,
          borderTopColor:  colors.tabBarBorder,
          borderTopWidth:  1,
          height:          64,
          paddingBottom:   8,
          paddingTop:      8,
        },
        tabBarActiveTintColor:   colors.accentSoft,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize:    10,
          fontFamily:  "Nunito_500Medium",
          marginTop:   2,
        },
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{ tabBarLabel: "Home", tabBarIcon: ({ color }) => <HomeIcon color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: "Search", tabBarIcon: ({ color }) => (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
            <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        )}}
      />
      <Tab.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          tabBarLabel: "",
          tabBarIcon: () => (
            <View style={[styles.createBtn, { backgroundColor: colors.accent, shadowColor: colors.accent }]}>
              <View style={[styles.createBtnInner, { backgroundColor: colors.accent }]}>
                <Text style={styles.createBtnPlus}>+</Text>
              </View>
            </View>
          ),
          tabBarItemStyle: { marginTop: -14 },
        }}
      />

      {/* ── Circles tab — resets stack to GroupsList on every tab press ── */}
      <Tab.Screen
        name="Groups"
        component={GroupsStack}
        options={{ tabBarLabel: "Circles", tabBarIcon: ({ color }) => <GroupsIcon color={color} size={22} /> }}
        listeners={{
          tabPress: () => {
            // If the stack ref is ready and we are not already at GroupsList,
            // pop back to the root so GroupsList is always what the user sees.
            if (groupsStackRef.current) {
              groupsStackRef.current.reset({
                index: 0,
                routes: [{ name: "GroupsList" }],
              });
            }
          },
        }}
      />

      <Tab.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ tabBarLabel: "Check-in", tabBarIcon: ({ color }) => (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        listeners={{
          tabPress: () => {
            setUnreadCount(0);
            api.patch("/notifications/read-all").catch(() => {});
          },
        }}
        options={{
          tabBarLabel: "Alerts",
          tabBarIcon: ({ color }) => (
            <View>
              <NotifIcon color={color} size={22} />
              <NotifBadge count={unreadCount} errorColor={colors.error} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Me", tabBarIcon: ({ color }) => <ProfileIcon color={color} size={22} /> }}
      />
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{ tabBarLabel: "Admin", tabBarIcon: ({ color }) => (
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill={color} />
            </Svg>
          )}}
        />
      )}
    </Tab.Navigator>
  );
}

// ─── Offline launch screen ────────────────────────────────────────────────────

function OfflineLaunchScreen({ onRetry }) {
  const { t }      = useLanguage();
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: 32 }}>
      <Text style={{ fontSize: 64, marginBottom: 20 }}>📡</Text>
      <Text style={{ color: colors.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 26, marginBottom: 10, textAlign: "center" }}>
        {t("noConnection")}
      </Text>
      <Text style={{ color: colors.textMuted, fontFamily: "Nunito_400Regular", fontSize: 15, textAlign: "center", lineHeight: 24, marginBottom: 32 }}>
        {t("noConnectionSub")}
      </Text>
      <TouchableOpacity
        style={{ backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40 }}
        onPress={onRetry}
      >
        <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 16 }}>{t("retry")}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────

function RootNavigator() {
  const { user, loading, refreshUser, clearReinstatedStatus } = useAuth();
  const { isLocked, isReady, unlockSilently } = useAppLock();
  const { isConnected } = useNetwork();
  const { colors, isDark } = useTheme();
  const [hasCheckedNetwork, setHasCheckedNetwork] = useState(false);
  const [onboarded, setOnboarded]                 = useState(null);
  const { popup, visible, dismiss } = useAdminPopup();
  const reinstatedCleared = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasCheckedNetwork(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { refreshUser(); }, []);

  useEffect(() => {
    if (user) {
      AsyncStorage.getItem("onboarded").then((val) => setOnboarded(val === "true"));
      if (user.appealStatus === "reinstated" && !user.isBanned && !reinstatedCleared.current) {
        reinstatedCleared.current = true;
        clearReinstatedStatus();
      }
    } else {
      reinstatedCleared.current = false;
    }
  }, [user?.appealStatus, user?.isBanned]);

  if (loading || !isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 32, marginBottom: 16 }}>💜</Text>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (hasCheckedNetwork && !isConnected && !user) {
    return <OfflineLaunchScreen onRetry={() => setHasCheckedNetwork(false)} />;
  }

  if (user && user.isBanned)       return <BanScreen />;
  if (user && onboarded === false) return <OnboardingScreen onComplete={() => setOnboarded(true)} />;

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main"     component={TabNavigator} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddAccount" component={AddAccountScreen} options={{ presentation: "modal", headerShown: false }} />
            <Stack.Screen name="Hashtag"  component={HashtagScreen} options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Security" component={SecurityScreen} options={{ headerShown: false }} />
            <Stack.Screen name="LoginActivity" component={LoginActivityScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AdminRecoveryRequests" component={AdminRecoveryRequestsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CommunityGuidelines" component={CommunityGuidelinesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ContactSupport" component={ContactSupportScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Auth"            component={AuthScreen}           options={{ headerShown: false }} />
            <Stack.Screen name="AccountRecovery" component={AccountRecoveryScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>

      <AdminPopupModal visible={visible && !!user} popup={popup} onDismiss={dismiss} />
      {isLocked && user && <AppLockScreen />}
    </>
  );
}

// ─── Deep link config ─────────────────────────────────────────────────────────

const linking = {
  prefixes: ["hushcircle://", "https://hushcircle.org"],
  config: {
    screens: {
      Main: {
        screens: {
          Feed:   "post/:postId",
          Groups: { screens: { GroupsList: "groups", GroupChat: "group/:groupId" } },
          Notifications: "notifications",
          Profile: "profile",
        },
      },
      Hashtag: "hashtag/:tag",
    },
  },
};

// ─── App root ─────────────────────────────────────────────────────────────────

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

      if (queryParams?.token) {
        try { await api.post("/email/verify-email", { token: queryParams.token }); }
        catch (err) { console.log("Verify failed:", err.response?.data?.message || err.message); }
        return;
      }

      if (pathname?.includes("/post/") || parsed.path?.includes("post/")) {
        let postId = pathname?.split("/post/")[1] || parsed.path?.split("/post/")[1];
        if (postId) {
          setTimeout(() => {
            if (navigationRef.isReady()) {
              navigationRef.navigate("Main", { screen: "Feed", params: { postId } });
            }
          }, 700);
        }
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink({ url }); });
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
          <AppLockProvider>
            <ThemeProvider>
              <SocketProvider>
                <NavigationContainer ref={navigationRef} linking={linking}>
                  <RootNavigator />
                </NavigationContainer>
                <NetworkBanner />
              </SocketProvider>
            </ThemeProvider>
          </AppLockProvider>
        </AuthProvider>
      </NetworkProvider>
    </LanguageProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    position: "absolute", top: -4, right: -8,
    borderRadius: 10, minWidth: 18, height: 18,
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontFamily: "Nunito_600SemiBold" },
  createBtn: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: "center", alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  createBtnInner: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
  },
  createBtnPlus: { color: "#fff", fontSize: 26, fontWeight: "300", lineHeight: 30, marginTop: -2 },
});