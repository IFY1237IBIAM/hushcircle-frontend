export default {
  expo: {
    name: "HushCircle",
    slug: "hushcircle",
    version: "1.0.0",
    orientation: "portrait",

    // ── App icon (home screen — iOS + Android) ──────────────────
    icon: "./assets/icon.png",

    scheme: "hushcircle",

    updates: {
      url: "https://u.expo.dev/542a1822-5d95-44d9-9072-37ad19adcc33"
    },
    runtimeVersion: {
      policy: "appVersion"
    },

    assetBundlePatterns: ["**/*"],

    // ── Splash screen ────────────────────────────────────────────
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0F0A1E"
    },

    // ── Push notification icon (top-level = applies to both platforms) ──
    notification: {
      icon: "./assets/notification-icon.png",
      color: "#9B6FD4",
      androidMode: "default"
    },

    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.hushcircle.app",
      associatedDomains: [
        "applinks:hushcircle.org",
        "webcredentials:wecare-backend-anxl.onrender.com"
      ]
    },

    android: {
      // ── Android adaptive icon ────────────────────────────────
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0F0A1E"
      },
      package: "com.hushcircle.app",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
      // ── Android notification icon ────────────────────────────
      notification: {
        icon: "./assets/notification-icon.png",
        color: "#9B6FD4",
        androidMode: "default"
      },
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "hushcircle.org",
              pathPrefix: "/post"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },

    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#9B6FD4",
          sounds: []
        }
      ],
      "expo-localization",
      "expo-font",
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          ios: { deploymentTarget: "16.0" },
          android: { compileSdkVersion: 36, minSdkVersion: 28 }
        }
      ]
    ],

    owner: "ifegwuifeanyiibiam",
    extra: {
      eas: {
        projectId: "542a1822-5d95-44d9-9072-37ad19adcc33"
      }
    }
  }
};