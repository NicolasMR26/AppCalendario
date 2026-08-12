import React, { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { ThemeProvider } from "@presentation/theme/ThemeProvider";
import { OnboardingCarousel } from "@presentation/components/OnboardingCarousel";
import { useSubjectsStore } from "@presentation/store/subjectsStore";
import { useSettingsStore } from "@presentation/store/settingsStore";
import { useAuthStore } from "@presentation/store/authStore";
import { useOnboardingStore } from "@presentation/store/onboardingStore";
import { injectPwaHeadTags } from "@presentation/utils/pwaHeadTags";
import { flushPendingSync } from "@data/repositories";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [bootstrapped, setBootstrapped] = useState(false);
  const loadSubjects = useSubjectsStore((s) => s.load);
  const loadSettings = useSettingsStore((s) => s.load);
  const initAuth = useAuthStore((s) => s.init);
  const loadOnboarding = useOnboardingStore((s) => s.load);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const finishOnboarding = useOnboardingStore((s) => s.finish);

  useEffect(() => {
    injectPwaHeadTags();
    initAuth();
    (async () => {
      await Promise.all([loadSubjects(), loadSettings(), loadOnboarding(), flushPendingSync()]);
      setBootstrapped(true);
    })();
  }, [loadSubjects, loadSettings, initAuth, loadOnboarding]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && bootstrapped) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, bootstrapped]);

  if (!fontsLoaded || !bootstrapped) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          {hasSeenOnboarding === false ? (
            <OnboardingCarousel onFinish={finishOnboarding} />
          ) : (
            <Stack screenOptions={{ headerShadowVisible: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="subject/[id]" options={{ title: "Ramo", presentation: "modal" }} />
            </Stack>
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
