import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Note } from "@domain/entities/Note";
import type { Subject } from "@domain/entities/Subject";
import { MonthCalendar } from "@presentation/components/MonthCalendar";
import { useNotesStore } from "@presentation/store/notesStore";
import { useSubjectsStore } from "@presentation/store/subjectsStore";
import { useTheme } from "@presentation/theme/ThemeProvider";
import { formatIsoDateShort, localDateToIsoDate } from "@presentation/utils/date";

type ViewMode = "list" | "calendar";
type GroupMode = "date" | "subject";

export default function NotesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const allNotes = useNotesStore((s) => s.allNotes);
  const loadAll = useNotesStore((s) => s.loadAll);
  const subjects = useSubjectsStore((s) => s.subjects);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [groupMode, setGroupMode] = useState<GroupMode>("date");
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(localDateToIsoDate(new Date()));

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const subjectById = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const datedNotes = useMemo(
    () => allNotes.filter((n): n is Note & { date: string } => n.date !== null).sort((a, b) => a.date.localeCompare(b.date)),
    [allNotes]
  );
  const undatedNotes = useMemo(() => allNotes.filter((n) => n.date === null), [allNotes]);

  const markedDates = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const note of datedNotes) {
      const subject = subjectById.get(note.subjectId);
      if (!subject) continue;
      if (!map[note.date]) map[note.date] = [];
      map[note.date].push(subject.color);
    }
    return map;
  }, [datedNotes, subjectById]);

  const notesForSelectedDate = useMemo(
    () => datedNotes.filter((n) => n.date === selectedDate),
    [datedNotes, selectedDate]
  );

  const groupedBySubject = useMemo(() => {
    const groups = new Map<string, Note[]>();
    for (const note of allNotes) {
      const list = groups.get(note.subjectId) ?? [];
      list.push(note);
      groups.set(note.subjectId, list);
    }
    return Array.from(groups.entries())
      .map(([subjectId, notes]) => ({ subject: subjectById.get(subjectId), notes: [...notes].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")) }))
      .filter((g) => g.subject)
      .sort((a, b) => a.subject!.name.localeCompare(b.subject!.name));
  }, [allNotes, subjectById]);

  const goToSubject = (subjectId: string) => router.push(`/subject/${subjectId}`);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Notas</Text>
        <SegmentedControl
          theme={theme}
          value={viewMode}
          options={[{ value: "list", label: "Lista" }, { value: "calendar", label: "Calendario" }]}
          onChange={setViewMode}
        />
      </View>

      {viewMode === "list" ? (
        <View style={styles.listContainer}>
          <View style={styles.groupToggleRow}>
            <SegmentedControl
              theme={theme}
              value={groupMode}
              options={[{ value: "date", label: "Por fecha" }, { value: "subject", label: "Por ramo" }]}
              onChange={setGroupMode}
            />
          </View>

          {allNotes.length === 0 ? (
            <EmptyState theme={theme} />
          ) : groupMode === "date" ? (
            <FlatList
              data={[...datedNotes, ...undatedNotes]}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <NoteRow note={item} subject={subjectById.get(item.subjectId)} theme={theme} onPressSubject={goToSubject} />
              )}
            />
          ) : (
            <FlatList
              data={groupedBySubject}
              keyExtractor={(item) => item.subject!.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.subjectGroup}>
                  <Pressable onPress={() => goToSubject(item.subject!.id)} style={styles.subjectGroupHeader}>
                    <View style={[styles.subjectDot, { backgroundColor: item.subject!.color }]} />
                    <Text style={[styles.subjectGroupTitle, { color: theme.colors.text }]}>{item.subject!.name}</Text>
                  </Pressable>
                  {item.notes.map((note) => (
                    <NoteRow key={note.id} note={note} subject={item.subject} theme={theme} onPressSubject={goToSubject} compact />
                  ))}
                </View>
              )}
            />
          )}
        </View>
      ) : (
        <View style={styles.calendarContainer}>
          <MonthCalendar
            month={month}
            markedDates={markedDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onChangeMonth={(dir) => setMonth(new Date(month.getFullYear(), month.getMonth() + dir, 1))}
          />
          <View style={styles.selectedDayHeader}>
            <Text style={[styles.selectedDayTitle, { color: theme.colors.text }]}>{formatIsoDateShort(selectedDate)}</Text>
          </View>
          <FlatList
            data={notesForSelectedDate}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={{ color: theme.colors.textMuted, fontSize: 13, paddingHorizontal: 20 }}>
                Sin notas para este día.
              </Text>
            }
            renderItem={({ item }) => (
              <NoteRow note={item} subject={subjectById.get(item.subjectId)} theme={theme} onPressSubject={goToSubject} />
            )}
          />
        </View>
      )}
    </View>
  );
}

function NoteRow({
  note,
  subject,
  theme,
  onPressSubject,
  compact,
}: {
  note: Note;
  subject: Subject | undefined;
  theme: ReturnType<typeof useTheme>;
  onPressSubject: (subjectId: string) => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={() => subject && onPressSubject(subject.id)}
      style={[styles.noteRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
    >
      {!compact && <View style={[styles.subjectDot, { backgroundColor: subject?.color ?? theme.colors.border }]} />}
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontSize: 14 }}>{note.text}</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
          {!compact && subject ? `${subject.name} · ` : ""}
          {note.date ? formatIsoDateShort(note.date) : "Sin fecha"}
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ theme }: { theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.emptyState}>
      <Text style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: "center" }}>
        Todavía no tienes notas. Agrégalas desde el editor de un ramo.
      </Text>
    </View>
  );
}

function SegmentedControl<T extends string>({
  theme,
  value,
  options,
  onChange,
}: {
  theme: ReturnType<typeof useTheme>;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={[styles.segmented, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }]}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={[styles.segmentedItem, value === opt.value && { backgroundColor: theme.colors.accent }]}
        >
          <Text style={{ color: value === opt.value ? "#fff" : theme.colors.text, fontSize: 12, fontWeight: "600" }}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  title: { fontSize: 26, fontWeight: "700" },
  segmented: { flexDirection: "row", borderRadius: 999, borderWidth: 1, padding: 3, alignSelf: "flex-start" },
  segmentedItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  listContainer: { flex: 1 },
  groupToggleRow: { paddingHorizontal: 20, marginBottom: 8 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 8 },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  subjectDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  subjectGroup: { marginBottom: 16, gap: 6 },
  subjectGroupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  subjectGroupTitle: { fontSize: 15, fontWeight: "700" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, paddingTop: 60 },
  calendarContainer: { flex: 1, paddingHorizontal: 20 },
  selectedDayHeader: { marginTop: 14, marginBottom: 8 },
  selectedDayTitle: { fontSize: 15, fontWeight: "700" },
});
