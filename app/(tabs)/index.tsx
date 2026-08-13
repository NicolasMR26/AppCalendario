import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { subjectsOverlap, type Subject, type WeekDay } from "@domain/entities/Subject";
import { CalendarGrid } from "@presentation/components/CalendarGrid";
import { useSubjectsStore } from "@presentation/store/subjectsStore";
import { useTheme } from "@presentation/theme/ThemeProvider";
import { notify } from "@presentation/utils/nativeAlert";

export default function CalendarScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const subjects = useSubjectsStore((s) => s.subjects);
  const toggleFavorite = useSubjectsStore((s) => s.toggleFavorite);
  const moveSubject = useSubjectsStore((s) => s.moveSubject);

  const handlePressSubject = (subject: Subject) => router.push(`/subject/${subject.id}`);

  // Non-blocking: the move already committed: this only informs, never reverts (see report §6.2).
  const handleMove = async (id: string, day: WeekDay, startTime: string, endTime: string) => {
    await moveSubject(id, day, startTime, endTime);
    const current = useSubjectsStore.getState().subjects;
    const moved = current.find((s) => s.id === id);
    if (!moved) return;
    const conflicts = current.filter((s) => s.id !== id && subjectsOverlap(moved, s));
    if (conflicts.length > 0) {
      notify("Horario solapado", `"${moved.name}" ahora se cruza con: ${conflicts.map((c) => c.name).join(", ")}.`);
    }
  };

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
