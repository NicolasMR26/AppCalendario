import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@presentation/theme/ThemeProvider";

interface Slide {
  emoji: string;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    emoji: "🗓️",
    title: "Bienvenido a DayGridK&N",
    description: "Cada ramo es una tarjeta dentro de tu calendario semanal, simple y a colores.",
  },
  {
    emoji: "✋",
    title: "Arrastra y suelta",
    description: "Mantén presionada una tarjeta y arrástrala a otro día u hora para reprogramarla al instante.",
  },
  {
    emoji: "🎨",
    title: "Personaliza cada ramo",
    description: "Toca una tarjeta para editar nombre, profesor, horario y color. Marca ⭐ tus favoritos.",
  },
  {
    emoji: "🔔",
    title: "Notas y alertas",
    description: "Agrega notas con fecha para exámenes o entregas, y activa alertas por correo para no olvidarlas.",
  },
  {
    emoji: "📝",
    title: "Todo en un lugar",
    description: "La pestaña Notas te muestra todas tus fechas importantes en lista o en un calendario mensual.",
  },
];

interface OnboardingCarouselProps {
  onFinish: () => void;
}

/**
 * A single slide renders at a time, driven purely by `index` state — no
 * ScrollView/FlatList. Earlier versions relied on an imperative
 * `scrollTo`/`scrollToIndex` ref call to advance the page, which is
 * unreliable on react-native-web (the index state updated but the visible
 * content never scrolled). This sidesteps that entirely.
 */
export function OnboardingCarousel({ onFinish }: OnboardingCarouselProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  const isFirst = index === 0;
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const goNext = () => {
    if (isLast) {
      onFinish();
      return;
    }
    setIndex((i) => i + 1);
  };

  const goPrevious = () => {
    if (isFirst) return;
    setIndex((i) => i - 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <Pressable onPress={onFinish} style={styles.skipButton} hitSlop={10}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>Saltar</Text>
      </Pressable>

      <View style={styles.slideArea}>
        <Animated.View key={index} entering={FadeIn.duration(220)} style={styles.slide}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>{slide.title}</Text>
          <Text style={[styles.description, { color: theme.colors.textMuted }]}>{slide.description}</Text>
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={s.title}
              style={[
                styles.dot,
                { backgroundColor: i === index ? theme.colors.accent : theme.colors.border },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            onPress={goPrevious}
            disabled={isFirst}
            style={[styles.previousButton, { borderColor: theme.colors.border, opacity: isFirst ? 0 : 1 }]}
          >
            <Text style={{ color: theme.colors.text, fontWeight: "600", fontSize: 15 }}>Anterior</Text>
          </Pressable>

          <Pressable onPress={goNext} style={[styles.nextButton, { backgroundColor: theme.colors.accent }]}>
            <Text style={styles.nextButtonText}>{isLast ? "Comenzar" : "Siguiente"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipButton: { position: "absolute", top: 16, right: 20, zIndex: 1, padding: 8 },
  slideArea: { flex: 1 },
  slide: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  description: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  footer: { alignItems: "center", gap: 20, paddingTop: 8, paddingHorizontal: 32, width: "100%" },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  buttonRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" },
  previousButton: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 999, borderWidth: 1 },
  nextButton: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999, minWidth: 160, alignItems: "center" },
  nextButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
