import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { useSettingsStore } from "@presentation/store/settingsStore";
import { darkPalette, lightPalette, radii, spacing, typography, type Palette } from "./tokens";

export interface Theme {
  colors: Palette;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  isDark: boolean;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const themeMode = useSettingsStore((s) => s.settings.themeMode);

  const isDark = themeMode === "system" ? system === "dark" : themeMode === "dark";

  const theme = useMemo<Theme>(
    () => ({
      colors: isDark ? darkPalette : lightPalette,
      spacing,
      radii,
      typography,
      isDark,
    }),
    [isDark]
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
