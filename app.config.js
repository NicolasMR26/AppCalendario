/** Dynamic Expo config so env vars can flow into `extra` at build time. */
module.exports = ({ config }) => ({
  ...config,
  name: "DayGridK&N",
  slug: "daygrid-kn",
  scheme: "daygridkn",
  version: "1.0.0",
  orientation: "default",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#FFFFFF",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.daygridkn.app",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FFFFFF",
    },
    package: "com.daygridkn.app",
  },
  web: {
    // NOTE: "static" output would enable app/+html.tsx for custom <head>
    // tags, but it left the app stuck on a blank screen (React hydration
    // never resolves — root div stays as an empty Suspense boundary marker,
    // no console error). Default (SPA) mode is solid; the apple-touch-icon
    // etc. are injected client-side instead — see RootLayout's web effect.
    favicon: "./assets/favicon.png",
  },
  // GitHub Pages serves project sites from /<repo-name>/, not the domain
  // root — this tells Expo Router's web build to prefix every route/asset
  // URL accordingly. Update the path if the repo is ever renamed.
  experiments: {
    baseUrl: "/AppCalendario",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#FFFFFF",
        image: "./assets/splash.png",
        resizeMode: "contain",
      },
    ],
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
    // `extra.eas.projectId` is intentionally omitted until you run
    // `eas build:configure` (see docs/SETUP.md) — a placeholder value here
    // makes Expo Go try to validate a real EAS project and fail with
    // "An Expo user account is required to proceed."
  },
});
