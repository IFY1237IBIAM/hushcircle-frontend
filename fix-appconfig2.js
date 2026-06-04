const fs = require("fs");

const appConfig = `export default {
  expo: {
    name: "HushCircle",
    slug: "hushcircle",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "hushcircle",
    assetBundlePatterns: ["**/*"],
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0F0A1E"
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.hushcircle.app",
      associatedDomains: ["applinks:hushcircle.org"]
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0F0A1E"
      },
      package: "com.hushcircle.app",
      googleServicesFile: "./google-services.json",
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
      "expo-font"
    ],
    owner: "ifegwuifeanyiibiam",
    extra: {
      eas: {
        projectId: "542a1822-5d95-44d9-9072-37ad19adcc33"
      }
    }
  }
};
`;

fs.writeFileSync("app.config.js", appConfig);
console.log("Done - fixed googleServicesFile to use local path");