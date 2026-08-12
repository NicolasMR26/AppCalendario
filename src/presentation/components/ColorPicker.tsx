import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "@presentation/theme/ThemeProvider";
import { SUBJECT_COLOR_PALETTE } from "@presentation/theme/tokens";

const HEX_PATTERN = /^#([0-9A-Fa-f]{6})$/;

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const theme = useTheme();
  const [hexInput, setHexInput] = useState(value);
  const [hexError, setHexError] = useState(false);

  const commitHex = (text: string) => {
    setHexInput(text);
    const normalized = text.startsWith("#") ? text : `#${text}`;
    if (HEX_PATTERN.test(normalized)) {
      setHexError(false);
      onChange(normalized.toUpperCase());
    } else if (text.length > 0) {
      setHexError(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.preview, { backgroundColor: value, borderColor: theme.colors.border }]} />

      <View style={styles.swatchGrid}>
        {SUBJECT_COLOR_PALETTE.map((hex) => {
          const selected = hex.toLowerCase() === value.toLowerCase();
          return (
            <Pressable
              key={hex}
              accessibilityRole="button"
              accessibilityLabel={`Color ${hex}`}
              onPress={() => {
                setHexInput(hex);
                setHexError(false);
                onChange(hex);
              }}
              style={({ pressed }) => [
                styles.swatch,
                { backgroundColor: hex, transform: [{ scale: pressed ? 0.9 : 1 }] },
                selected && [styles.swatchSelected, { borderColor: theme.colors.text }],
              ]}
            >
              {selected && (
                <Animated.View entering={FadeIn.duration(150)} style={styles.checkDot} />
              )}
            </Pressable>
          );
        })}
      </View>

      <View>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>HEX</Text>
        <TextInput
          value={hexInput}
          onChangeText={commitHex}
          placeholder="#5B8DEF"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          style={[
            styles.hexInput,
            {
              borderColor: hexError ? theme.colors.danger : theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.surfaceAlt,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  preview: { height: 44, borderRadius: 12, borderWidth: 1 },
  swatchGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchSelected: { borderWidth: 2 },
  checkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  label: { fontSize: 12, marginBottom: 4, fontWeight: "500" },
  hexInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
});
