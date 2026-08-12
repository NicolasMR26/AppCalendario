import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Subject, WeekDay } from "@domain/entities/Subject";
import { CalendarGrid } from "@presentation/components/CalendarGrid";
import { useSubjectsStore } from "@presentation/store/subjectsStore";
import { useTheme } from "@presentation/theme/ThemeProvider";

export default function CalendarScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const subjects = useSubjectsStore((s) => s.subjects);
  const toggleFavorite = useSubjectsStore((s) => s.toggleFavorite);
  const moveSubject = useSubjectsStore((s) => s.moveSubject);

  const handlePressSubject = (subject: Subject) => router.push(`/subject/${subject.id}`);
  const handleMove = (id: string, day: WeekDay, startTime: string, endTime: string) =>
    moveSubject(id, day, startTime, endTime);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>DayGrid</Text>
        <Pressable
          onPress={() => router.push("/subject/new")}
          style={[styles.addButton, { backgroundColor: theme.colors.accent }]}
        >
          <Text style={styles.addButtonText}>+ Ramo</Text>
        </Pressable>
      </View>

      <View style={styles.gridWrapper}>
        <CalendarGrid
          subjects={subjects}
          onPressSubject={handlePressSubject}
          onToggleFavorite={toggleFavorite}
          onMoveSubject={handleMove}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: "700" },
  addButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  gridWrapper: { flex: 1, paddingHorizontal: 12 },
});
