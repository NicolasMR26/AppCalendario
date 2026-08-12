/** Day of week as ISO index: 1 = Monday ... 7 = Sunday. */
export type WeekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Subject {
  id: string;
  name: string;
  professor?: string;
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

export function subjectDurationMinutes(subject: Pick<Subject, "startTime" | "endTime">): number {
  const [startH, startM] = subject.startTime.split(":").map(Number);
  const [endH, endM] = subject.endTime.split(":").map(Number);
  return endH * 60 + endM - (startH * 60 + startM);
}
