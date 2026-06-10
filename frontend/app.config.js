const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withCleartextNetworkConfig = (config) => {
  config = withDangerousMod(config, ['android', (config) => {
    const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    fs.mkdirSync(xmlDir, { recursive: true });
    fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'),
      `<?xml version="1.0" encoding="utf-8"?>\n<network-security-config>\n    <base-config cleartextTrafficPermitted="true" />\n</network-security-config>`
    );
    return config;
  }]);
  config = withAndroidManifest(config, (config) => {
    config.modResults.manifest.application[0].$['android:networkSecurityConfig'] = '@xml/network_security_config';
    return config;
  });
  return config;
};

module.exports = {
  expo: {
    owner: "bean28",
    name: "양심냉장고",
    slug: "yangsimfridge",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/splash_screen_3.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash_screen_3.png",
      resizeMode: "contain",
      backgroundColor: "#39A7FF",
    },
    ios: {
      supportsTablet: true,
    },
    scheme: "yangsimfridge",
    android: {
      package: "com.yangsimfridge.app",
      adaptiveIcon: {
        foregroundImage: "./assets/splash_screen_3.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      usesCleartextTraffic: true,
      permissions: [
        "android.permission.INTERNET",
        "android.permission.NFC",
        "android.permission.ACCESS_NETWORK_STATE"
      ],
      intentFilters: [
        {
          action: "android.intent.action.VIEW",
          autoVerify: false,
          data: [{ scheme: "yangsimfridge" }],
          category: ["android.intent.category.DEFAULT", "android.intent.category.BROWSABLE"],
        },
        {
          action: "android.nfc.action.NDEF_DISCOVERED",
          data: [{ scheme: "yangsimfridge" }],
          category: ["android.intent.category.DEFAULT"],
        },
      ],
      // EAS 빌드: 환경변수로 주입된 경로 사용 / 로컬: 직접 파일 참조
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    },
    web: {
      favicon: "./assets/logo.png",
    },
    plugins: ["expo-notifications", "expo-secure-store", "@react-native-community/datetimepicker", "expo-camera", withCleartextNetworkConfig],
    extra: {
      eas: {
        projectId: "e89627b7-d5cf-4f26-84a5-6a85380d4605",
      },
    },
  },
};
