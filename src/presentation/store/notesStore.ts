import { create } from "zustand";
import type { NewNote, Note, NoteSortMode, NoteUpdate } from "@domain/entities/Note";
import { sortNotes } from "@domain/entities/Note";
import { noteRepository } from "@data/repositories";

interface NotesState {
  bySubject: Record<string, Note[]>;
  allNotes: Note[];
  sortMode: NoteSortMode;
  isLoading: boolean;
  error: string | null;
  setSortMode: (mode: NoteSortMode) => void;
  loadForSubject: (subjectId: string) => Promise<void>;
  loadAll: () => Promise<void>;
  addNote: (input: NewNote) => Promise<void>;
  updateNote: (id: string, subjectId: string, patch: NoteUpdate) => Promise<void>;
  removeNote: (id: string, subjectId: string) => Promise<void>;
  reorderNotes: (subjectId: string, orderedIds: string[]) => Promise<void>;
  notesFor: (subjectId: string) => Note[];
}

export const useNotesStore = create<NotesState>((set, get) => ({
  bySubject: {},
  allNotes: [],
  sortMode: "date",
  isLoading: false,
  error: null,

  setSortMode: (mode) => set({ sortMode: mode }),

  loadForSubject: async (subjectId) => {
    set({ isLoading: true, error: null });
    try {
      const notes = await noteRepository.listBySubject(subjectId);
      set({ bySubject: { ...get().bySubject, [subjectId]: notes }, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load notes", isLoading: false });
    }
  },

  loadAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const allNotes = await noteRepository.listAll();
      set({ allNotes, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load notes", isLoading: false });
    }
  },

  addNote: async (input) => {
    const note = await noteRepository.create(input);
    const current = get().bySubject[input.subjectId] ?? [];
    set({ bySubject: { ...get().bySubject, [input.subjectId]: [...current, note] }, allNotes: [...get().allNotes, note] });
  },

  updateNote: async (id, subjectId, patch) => {
    const current = get().bySubject[subjectId] ?? [];
    const previousAll = get().allNotes;
    set({
      bySubject: { ...get().bySubject, [subjectId]: current.map((n) => (n.id === id ? { ...n, ...patch } : n)) },
      allNotes: previousAll.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    });
    try {
      const updated = await noteRepository.update(id, patch);
      const refreshed = get().bySubject[subjectId] ?? [];
      set({
        bySubject: { ...get().bySubject, [subjectId]: refreshed.map((n) => (n.id === id ? updated : n)) },
        allNotes: get().allNotes.map((n) => (n.id === id ? updated : n)),
      });
    } catch (err) {
      set({
        bySubject: { ...get().bySubject, [subjectId]: current },
        allNotes: previousAll,
        error: err instanceof Error ? err.message : "Failed to update note",
      });
    }
  },

  removeNote: async (id, subjectId) => {
    const current = get().bySubject[subjectId] ?? [];
    const previousAll = get().allNotes;
    set({
      bySubject: { ...get().bySubject, [subjectId]: current.filter((n) => n.id !== id) },
      allNotes: previousAll.filter((n) => n.id !== id),
    });
    try {
      await noteRepository.remove(id);
    } catch (err) {
      set({ bySubject: { ...get().bySubject, [subjectId]: current }, allNotes: previousAll, error: err instanceof Error ? err.message : "Failed to delete note" });
    }
  },

  reorderNotes: async (subjectId, orderedIds) => {
    const current = get().bySubject[subjectId] ?? [];
    const order = new Map(orderedIds.map((id, idx) => [id, idx]));
    const reordered = [...current].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    set({ bySubject: { ...get().bySubject, [subjectId]: reordered } });
    await noteRepository.reorder(subjectId, orderedIds);
  },

  notesFor: (subjectId) => sortNotes(get().bySubject[subjectId] ?? [], get().sortMode),
}));
