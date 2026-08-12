import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@presentation/theme/ThemeProvider";
import { formatMonthYear, getMonthGrid } from "@presentation/utils/date";
import { DAY_LABELS, WEEK_DAYS } from "@presentation/utils/calendarLayout";

interface MonthCalendarProps {
  month: Date;
  markedDates: Record<string, string[]>; // iso date -> hex colors of subjects with events that day
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
  onChangeMonth: (direction: -1 | 1) => void;
}

/** Lightweight month grid (no external calendar lib) showing which days have events. */
export function MonthCalendar({ month, markedDates, selectedDate, onSelectDate, onChangeMonth }: MonthCalendarProps) {
  const theme = useTheme();
  const weeks = getMonthGrid(month);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => onChangeMonth(-1)} hitSlop={8} style={styles.navButton}>
          <Text style={{ color: theme.colors.text, fontSize: 18 }}>‹</Text>
        </Pressable>
        <Text style={[styles.monthLabel, { color: theme.colors.text }]}>{formatMonthYear(month)}</Text>
        <Pressable onPress={() => onChangeMonth(1)} hitSlop={8} style={styles.navButton}>
          <Text style={{ color: theme.colors.text, fontSize: 18 }}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEK_DAYS.map((day) => (
          <Text key={day} style={[styles.weekDayLabel, { color: theme.colors.textMuted }]}>
            {DAY_LABELS[day]}
          </Text>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={week[0].iso} style={styles.weekRow}>
          {week.map((cell) => {
            const colors = markedDates[cell.iso] ?? [];
            const isSelected = cell.iso === selectedDate;
            return (
              <Pressable key={cell.iso} onPress={() => onSelectDate(cell.iso)} style={styles.dayCell}>
                <View
                  style={[
                    styles.dayCircle,
                    isSelected && { backgroundColor: theme.colors.accent },
                  ]}
                >
                  <Text
                    style={{
                      color: isSelected
                        ? "#fff"
                        : cell.isCurrentMonth
                        ? theme.colors.text
                        : theme.colors.textMuted,
                      fontSize: 13,
                      opacity: cell.isCurrentMonth ? 1 : 0.4,
                    }}
                  >
                    {cell.day}
                  </Text>
                </View>
                <View style={styles.dotsRow}>
                  {colors.slice(0, 3).map((color, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: color }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 4 },
  navButton: { paddingHorizontal: 10, paddingVertical: 4 },
  monthLabel: { fontSize: 16, fontWeight: "700" },
  weekRow: { flexDirection: "row", justifyContent: "space-around" },
  weekDayLabel: { width: 40, textAlign: "center", fontSize: 11, fontWeight: "600", marginBottom: 4 },
  dayCell: { width: 40, alignItems: "center", paddingVertical: 3, gap: 2 },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  dotsRow: { flexDirection: "row", gap: 2, height: 5 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
