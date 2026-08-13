/** Day of week as ISO index: 1 = Monday ... 7 = Sunday. */
export type WeekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Subject {
  id: string;
  name: string;
  professor?: string;
  room?: string; // e.g. "Sala 204", set manually per ramo
  color: string; // hex, e.g. "#5B8DEF"
  day: WeekDay;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  isFavorite: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export type NewSubject = Omit<Subject, "id" | "createdAt" | "updatedAt">;
export type SubjectUpdate = Partial<Omit<Subject, "id" | "createdAt" | "updatedAt">>;

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function subjectDurationMinutes(subject: Pick<Subject, "startTime" | "endTime">): number {
  return toMinutes(subject.endTime) - toMinutes(subject.startTime);
}

/** True if two subjects share a day and their time ranges intersect (touching edges don't count). */
export function subjectsOverlap(
  a: Pick<Subject, "day" | "startTime" | "endTime">,
  b: Pick<Subject, "day" | "startTime" | "endTime">
): boolean {
  if (a.day !== b.day) return false;
  return toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(b.startTime) < toMinutes(a.endTime);
}
