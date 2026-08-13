import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { subjectsOverlap, type WeekDay } from "@domain/entities/Subject";
import { ColorPicker } from "@presentation/components/ColorPicker";
import { NotesList } from "@presentation/components/NotesList";
import { useNotesStore } from "@presentation/store/notesStore";
import { useSubjectsStore } from "@presentation/store/subjectsStore";
import { useTheme } from "@presentation/theme/ThemeProvider";
import { DAY_LABELS, WEEK_DAYS } from "@presentation/utils/calendarLayout";
import { SUBJECT_COLOR_PALETTE } from "@presentation/theme/tokens";
import { confirmDestructive, notify } from "@presentation/utils/nativeAlert";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function SubjectEditorScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";

  const subjects = useSubjectsStore((s) => s.subjects);
  const addSubject = useSubjectsStore((s) => s.addSubject);
  const updateSubject = useSubjectsStore((s) => s.updateSubject);
  const removeSubject = useSubjectsStore((s) => s.removeSubject);

  const existing = useMemo(() => subjects.find((s) => s.id === id), [subjects, id]);

  const [name, setName] = useState(existing?.name ?? "");
  const [professor, setProfessor] = useState(existing?.professor ?? "");
  const [room, setRoom] = useState(existing?.room ?? "");
  const [color, setColor] = useState(existing?.color ?? SUBJECT_COLOR_PALETTE[8]);
  const [day, setDay] = useState<WeekDay>(existing?.day ?? 1);
  const [startTime, setStartTime] = useState(existing?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(existing?.endTime ?? "10:30");
  const [isFavorite, setIsFavorite] = useState(existing?.isFavorite ?? false);
  const [savedId, setSavedId] = useState<string | null>(isNew ? null : (id as string));

  const notesStore = useNotesStore();
  const notes = savedId ? notesStore.notesFor(savedId) : [];

  const [notesEnabled, setNotesEnabled] = useState(false);
  const [notesToggleSynced, setNotesToggleSynced] = useState(false);

  useEffect(() => {
    if (savedId) notesStore.loadForSubject(savedId);
  }, [savedId]);

  useEffect(() => {
    if (!notesToggleSynced && notes.length > 0) {
      setNotesEnabled(true);
      setNotesToggleSynced(true);
    }
  }, [notes, notesToggleSynced]);

  const timesValid = TIME_PATTERN.test(startTime) && TIME_PATTERN.test(endTime) && startTime < endTime;
  const canSave = name.trim().length > 0 && timesValid;

  // Non-blocking: only informs the user, never prevents saving (see report §6.2).
  const conflicts = useMemo(() => {
    if (!timesValid) return [];
    return subjects.filter((s) => s.id !== savedId && subjectsOverlap({ day, startTime, endTime }, s));
  }, [subjects, day, startTime, endTime, timesValid, savedId]);

  const handleSave = async () => {
    if (!canSave) return;
    if (isNew && !savedId) {
      const created = await addSubject({
        name: name.trim(),
        professor: professor.trim() || undefined,
        room: room.trim() || undefined,
        color,
        day,
        startTime,
        endTime,
        isFavorite,
      });
      setSavedId(created.id);
      router.setParams({ id: created.id });
    } else if (savedId) {
      await updateSubject(savedId, {
        name: name.trim(),
        professor: professor.trim() || undefined,
        room: room.trim() || undefined,
        color,
        day,
        startTime,
        endTime,
        isFavorite,
      });
    }
    notify("Guardado", `"${name.trim()}" se guardó correctamente.`, () => router.back());
  };

  const handleDelete = async () => {
    if (!savedId) {
      router.back();
      return;
    }
    const confirmed = await confirmDestructive("Eliminar ramo", `¿Eliminar "${name}" y todas sus notas?`);
    if (!confirmed) return;
    await removeSubject(savedId);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.headerRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nombre del ramo"
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.nameInput, { color: theme.colors.text }]}
        />
        <Pressable onPress={() => setIsFavorite((v) => !v)} hitSlop={8}>
          <Text style={{ fontSize: 26, color: isFavorite ? theme.colors.favorite : theme.colors.textMuted }}>
            {isFavorite ? "★" : "☆"}
          </Text>
        </Pressable>
      </View>

      <TextInput
        value={professor}
        onChangeText={setProfessor}
        placeholder="Profesor (opcional)"
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.professorInput, { color: theme.colors.textMuted, borderColor: theme.colors.border }]}
      />

      <TextInput
        value={room}
        onChangeText={setRoom}
        placeholder="Salón (opcional)"
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.professorInput, { color: theme.colors.textMuted, borderColor: theme.colors.border }]}
      />

      <Field label="Día" theme={theme}>
        <View style={styles.dayRow}>
          {WEEK_DAYS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDay(d)}
              style={[
                styles.dayPill,
                { borderColor: theme.colors.border, backgroundColor: day === d ? theme.colors.accent : "transparent" },
              ]}
            >
              <Text style={{ color: day === d ? "#fff" : theme.colors.text, fontSize: 13 }}>{DAY_LABELS[d]}</Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Horario" theme={theme}>
        <View style={styles.timeRow}>
          <TextInput
            value={startTime}
            onChangeText={setStartTime}
            placeholder="09:00"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.timeInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
          />
          <Text style={{ color: theme.colors.textMuted }}>–</Text>
          <TextInput
            value={endTime}
            onChangeText={setEndTime}
            placeholder="10:30"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.timeInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
          />
        </View>
        {!timesValid && <Text style={{ color: theme.colors.danger, fontSize: 12 }}>Formato HH:mm, hora fin debe ser mayor a inicio.</Text>}
        {conflicts.length > 0 && (
          <Text style={{ color: theme.colors.favorite, fontSize: 12 }}>
            ⚠ Se solapa con: {conflicts.map((c) => c.name).join(", ")}
          </Text>
        )}
      </Field>

      <Field label="Color" theme={theme}>
        <ColorPicker value={color} onChange={setColor} />
      </Field>

      <Pressable
        disabled={!canSave}
        onPress={handleSave}
        style={[styles.saveButton, { backgroundColor: canSave ? theme.colors.accent : theme.colors.border }]}
      >
        <Text style={styles.saveButtonText}>{isNew && !savedId ? "Crear ramo" : "Guardar cambios"}</Text>
      </Pressable>

      {savedId && (
        <View style={styles.notesSection}>
          <View style={styles.notesToggleRow}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>¿Agregar notas?</Text>
            <View style={styles.notesToggleButtons}>
              {([true, false] as const).map((value) => (
                <Pressable
                  key={String(value)}
                  onPress={() => setNotesEnabled(value)}
                  style={[
                    styles.notesTogglePill,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: notesEnabled === value ? theme.colors.accent : "transparent",
                    },
                  ]}
                >
                  <Text style={{ color: notesEnabled === value ? "#fff" : theme.colors.text, fontSize: 13 }}>
                    {value ? "Sí" : "No"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {notesEnabled && (
            <NotesList
              notes={notes}
              sortMode={notesStore.sortMode}
              onChangeSortMode={notesStore.setSortMode}
              onAdd={(text, date, alertEmail) => notesStore.addNote({ subjectId: savedId, text, date, sortOrder: notes.length, alertEmail })}
              onUpdate={(noteId, patch) => notesStore.updateNote(noteId, savedId, patch)}
              onRemove={(noteId) => notesStore.removeNote(noteId, savedId)}
              onReorder={(orderedIds) => notesStore.reorderNotes(savedId, orderedIds)}
            />
          )}
        </View>
      )}

      <Pressable onPress={handleDelete} style={styles.deleteButton}>
        <Text style={{ color: theme.colors.danger, fontWeight: "600" }}>{savedId ? "Eliminar ramo" : "Cancelar"}</Text>
      </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, theme, children }: { label: string; theme: ReturnType<typeof useTheme>; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 18, paddingBottom: 60 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  nameInput: { fontSize: 24, fontWeight: "700", flex: 1 },
  professorInput: { fontSize: 15, borderBottomWidth: 1, paddingVertical: 6 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  dayRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  timeInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, width: 90, textAlign: "center" },
  saveButton: { borderRadius: 999, paddingVertical: 14, alignItems: "center" },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  notesSection: { marginTop: 8, gap: 14 },
  notesToggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  notesToggleButtons: { flexDirection: "row", gap: 8 },
  notesTogglePill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, borderWidth: 1, minWidth: 48, alignItems: "center" },
  deleteButton: { alignItems: "center", paddingVertical: 12 },
});
