export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  fontFamily: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
} as const;

export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  danger: string;
  favorite: string;
  shadow: string;
}

export const lightPalette: Palette = {
  background: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F2F4",
  border: "#E7E8EB",
  text: "#16181D",
  textMuted: "#71757F",
  accent: "#5B8DEF",
  danger: "#EF5B5B",
  favorite: "#F5B301",
  shadow: "rgba(16, 18, 24, 0.08)",
};

export const darkPalette: Palette = {
  background: "#0E0F12",
  surface: "#17191E",
  surfaceAlt: "#1E2127",
  border: "#2A2D34",
  text: "#F4F5F7",
  textMuted: "#9296A3",
  accent: "#7DA3F5",
  danger: "#F17B7B",
  favorite: "#F5C842",
  shadow: "rgba(0, 0, 0, 0.4)",
};

/** 30+ curated hues offered in the color picker, plus HEX entry for anything else. */
export const SUBJECT_COLOR_PALETTE: string[] = [
  "#EF5B5B", "#F2703C", "#F5B301", "#F7DC6F", "#A3D977",
  "#5CC98A", "#2FB8A6", "#4AC7D8", "#5B8DEF", "#7C7CF0",
  "#9B6BF2", "#C06BE0", "#E06BB8", "#F26B9A", "#F58B8B",
  "#D1495B", "#E8871E", "#F4A261", "#E9C46A", "#8AB17D",
  "#43AA8B", "#4D9078", "#277DA1", "#577590", "#6C7BC2",
  "#7768AE", "#9C6ADE", "#C879C8", "#E07A9E", "#8D8D99",
];
