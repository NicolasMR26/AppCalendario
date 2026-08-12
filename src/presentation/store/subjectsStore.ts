import { create } from "zustand";
import type { NewSubject, Subject, SubjectUpdate } from "@domain/entities/Subject";
import { subjectRepository } from "@data/repositories";

interface SubjectsState {
  subjects: Subject[];
  isLoading: boolean;
  error: string | null;
  load: () => Promise<void>;
  addSubject: (input: NewSubject) => Promise<Subject>;
  updateSubject: (id: string, patch: SubjectUpdate) => Promise<void>;
  moveSubject: (id: string, day: Subject["day"], startTime: string, endTime: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  removeSubject: (id: string) => Promise<void>;
}

export const useSubjectsStore = create<SubjectsState>((set, get) => ({
  subjects: [],
  isLoading: false,
  error: null,

  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const subjects = await subjectRepository.list();
      set({ subjects, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load subjects", isLoading: false });
    }
  },

  addSubject: async (input) => {
    const subject = await subjectRepository.create(input);
    set({ subjects: [...get().subjects, subject] });
    return subject;
  },

  updateSubject: async (id, patch) => {
    const previous = get().subjects;
    // Optimistic update so drag/edit feels instant; reconciled after the write resolves.
    set({ subjects: previous.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
    try {
      const updated = await subjectRepository.update(id, patch);
      set({ subjects: get().subjects.map((s) => (s.id === id ? updated : s)) });
    } catch (err) {
      set({ subjects: previous, error: err instanceof Error ? err.message : "Failed to update subject" });
    }
  },

  moveSubject: async (id, day, startTime, endTime) => {
    await get().updateSubject(id, { day, startTime, endTime });
  },

  toggleFavorite: async (id) => {
    const subject = get().subjects.find((s) => s.id === id);
    if (!subject) return;
    await get().updateSubject(id, { isFavorite: !subject.isFavorite });
  },

  removeSubject: async (id) => {
    const previous = get().subjects;
    set({ subjects: previous.filter((s) => s.id !== id) });
    try {
      await subjectRepository.remove(id);
    } catch (err) {
      set({ subjects: previous, error: err instanceof Error ? err.message : "Failed to delete subject" });
    }
  },
}));
