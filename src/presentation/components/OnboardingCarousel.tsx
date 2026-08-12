import React, { useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
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

export function OnboardingCarousel({ onFinish }: OnboardingCarouselProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const isLast = index === SLIDES.length - 1;

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(next);
  };

  const goNext = () => {
    if (isLast) {
      onFinish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <Pressable onPress={onFinish} style={styles.skipButton} hitSlop={10}>
        <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>Saltar</Text>
      </Pressable>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
            <Text style={[styles.description, { color: theme.colors.textMuted }]}>{item.description}</Text>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.title}
              style={[
                styles.dot,
                { backgroundColor: i === index ? theme.colors.accent : theme.colors.border },
              ]}
            />
          ))}
        </View>

        <Pressable onPress={goNext} style={[styles.nextButton, { backgroundColor: theme.colors.accent }]}>
          <Text style={styles.nextButtonText}>{isLast ? "Comenzar" : "Siguiente"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipButton: { position: "absolute", top: 16, right: 20, zIndex: 1, padding: 8 },
  slide: { alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  description: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  footer: { alignItems: "center", gap: 20, paddingTop: 8 },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  nextButton: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 999, minWidth: 180, alignItems: "center" },
  nextButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
