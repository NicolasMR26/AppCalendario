import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import type { Note, NoteSortMode } from "@domain/entities/Note";
import { useTheme } from "@presentation/theme/ThemeProvider";
import { formatIsoDateShort, isoDateToLocalDate, localDateToIsoDate } from "@presentation/utils/date";

interface NotesListProps {
  notes: Note[];
  sortMode: NoteSortMode;
  onChangeSortMode: (mode: NoteSortMode) => void;
  onAdd: (text: string, date: string | null, alertEmail: boolean) => void;
  onUpdate: (id: string, patch: Partial<Pick<Note, "text" | "date" | "alertEmail">>) => void;
  onRemove: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
}

/** CRUD list of quick notes for a subject ("Examen el 12 de junio", ...). Text and date are required per note. */
export function NotesList({ notes, sortMode, onChangeSortMode, onAdd, onUpdate, onRemove, onReorder }: NotesListProps) {
  const theme = useTheme();
  const [draftText, setDraftText] = useState("");
  const [draftDate, setDraftDate] = useState<string | null>(null);
  const [draftAlert, setDraftAlert] = useState(false);
  const [openPickerId, setOpenPickerId] = useState<string | "draft" | null>(null);

  const canSubmitDraft = draftText.trim().length > 0 && draftDate !== null;

  const submitDraft = () => {
    if (!canSubmitDraft) return;
    onAdd(draftText.trim(), draftDate, draftAlert);
    setDraftText("");
    setDraftDate(null);
    setDraftAlert(false);
    setOpenPickerId(null);
  };

  const moveNote = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= notes.length) return;
    const reordered = [...notes];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onReorder(reordered.map((n) => n.id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.sortRow}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>Notas</Text>
        <View style={styles.sortToggle}>
          {(["date", "manual"] as NoteSortMode[]).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => onChangeSortMode(mode)}
              style={[
                styles.sortPill,
                {
                  backgroundColor: sortMode === mode ? theme.colors.accent : "transparent",
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={{ color: sortMode === mode ? "#fff" : theme.colors.textMuted, fontSize: 12 }}>
                {mode === "date" ? "Por fecha" : "Manual"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {notes.map((note, index) => (
        <Animated.View
          key={note.id}
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(120)}
          layout={Layout.springify()}
          style={[styles.noteRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.noteMain}>
            <TextInput
              value={note.text}
              onChangeText={(text) => onUpdate(note.id, { text })}
              style={[styles.noteText, { color: theme.colors.text }]}
              multiline
            />
            <View style={styles.noteMetaRow}>
              <DateField
                theme={theme}
                value={note.date}
                isOpen={openPickerId === note.id}
                onToggle={() => setOpenPickerId(openPickerId === note.id ? null : note.id)}
                onChange={(date) => {
                  onUpdate(note.id, { date });
                  if (Platform.OS === "android") setOpenPickerId(null);
                }}
              />
              <View style={styles.alertRow}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>Alerta por correo</Text>
                <Switch
                  value={note.alertEmail}
                  onValueChange={(value) => onUpdate(note.id, { alertEmail: value })}
                  trackColor={{ true: theme.colors.accent }}
                />
              </View>
            </View>
          </View>

          <View style={styles.noteActions}>
            {sortMode === "manual" && (
              <View style={styles.reorderButtons}>
                <Pressable onPress={() => moveNote(index, -1)} hitSlop={6}>
                  <Text style={{ color: theme.colors.textMuted }}>▲</Text>
                </Pressable>
                <Pressable onPress={() => moveNote(index, 1)} hitSlop={6}>
                  <Text style={{ color: theme.colors.textMuted }}>▼</Text>
                </Pressable>
              </View>
            )}
            <Pressable onPress={() => onRemove(note.id)} hitSlop={6}>
              <Text style={{ color: theme.colors.danger, fontSize: 18 }}>×</Text>
            </Pressable>
          </View>
        </Animated.View>
      ))}

      <View style={[styles.draftRow, { borderColor: theme.colors.border }]}>
        <TextInput
          value={draftText}
          onChangeText={setDraftText}
          placeholder="Nueva nota (ej. Examen de Minería de Datos)"
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.draftInput, { color: theme.colors.text }]}
        />
        <View style={styles.noteMetaRow}>
          <DateField
            theme={theme}
            value={draftDate}
            isOpen={openPickerId === "draft"}
            onToggle={() => setOpenPickerId(openPickerId === "draft" ? null : "draft")}
            onChange={(date) => {
              setDraftDate(date);
              if (Platform.OS === "android") setOpenPickerId(null);
            }}
          />
          <View style={styles.alertRow}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>Alerta por correo</Text>
            <Switch value={draftAlert} onValueChange={setDraftAlert} trackColor={{ true: theme.colors.accent }} />
          </View>
        </View>
        {!draftDate && draftText.length > 0 && (
          <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>Elige una fecha para poder agregar la nota.</Text>
        )}
        <Pressable
          disabled={!canSubmitDraft}
          onPress={submitDraft}
          style={[styles.addButton, { backgroundColor: canSubmitDraft ? theme.colors.accent : theme.colors.border }]}
        >
          <Text style={styles.addButtonText}>Agregar nota</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DateField({
  theme,
  value,
  isOpen,
  onToggle,
  onChange,
}: {
  theme: ReturnType<typeof useTheme>;
  value: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (date: string) => void;
}) {
  // @react-native-community/datetimepicker has no web implementation at all
  // (it silently renders nothing there), so date entry and — since a note
  // requires a date to be saved — the whole "add note" flow were both dead
  // on web. The browser's native <input type="date"> already gives a real
  // date picker UI and speaks the same "YYYY-MM-DD" format we use.
  if (Platform.OS === "web") {
    return React.createElement("input", {
      type: "date",
      value: value ?? "",
      onChange: (event: { target: { value: string } }) => {
        if (event.target.value) onChange(event.target.value);
      },
      style: {
        border: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.surfaceAlt,
        color: theme.colors.text,
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 13,
        fontFamily: "inherit",
        minWidth: 110,
      },
    });
  }

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === "dismissed") {
      if (Platform.OS === "android") onToggle();
      return;
    }
    if (selected) onChange(localDateToIsoDate(selected));
  };

  return (
    <View>
      <Pressable
        onPress={onToggle}
        style={[styles.dateField, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt }]}
      >
        <Text style={{ color: value ? theme.colors.text : theme.colors.textMuted, fontSize: 13 }}>
          {value ? formatIsoDateShort(value) : "Elegir fecha"}
        </Text>
      </Pressable>
      {isOpen && (
        <DateTimePicker
          value={value ? isoDateToLocalDate(value) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "calendar"}
          onChange={handleChange}
          themeVariant={theme.isDark ? "dark" : "light"}
        />
      )}
      {isOpen && Platform.OS === "ios" && (
        <Pressable onPress={onToggle} style={styles.doneButton}>
          <Text style={{ color: theme.colors.accent, fontSize: 13, fontWeight: "600" }}>Listo</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  sortRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  sortToggle: { flexDirection: "row", gap: 6 },
  sortPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  noteRow: { flexDirection: "row", borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  noteMain: { flex: 1, gap: 6 },
  noteText: { fontSize: 14 },
  noteMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  dateField: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, minWidth: 110 },
  doneButton: { alignSelf: "flex-end", paddingVertical: 6, paddingHorizontal: 4 },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  noteActions: { alignItems: "center", justifyContent: "space-between", gap: 8 },
  reorderButtons: { gap: 2, alignItems: "center" },
  draftRow: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8, borderStyle: "dashed" },
  draftInput: { fontSize: 14 },
  addButton: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});
