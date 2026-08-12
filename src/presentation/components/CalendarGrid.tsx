import React, { useRef } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Subject, WeekDay } from "@domain/entities/Subject";
import { useTheme } from "@presentation/theme/ThemeProvider";
import {
  DAY_LABELS,
  DAY_WIDTH,
  GRID_TOTAL_HEIGHT,
  GRID_VERTICAL_PADDING,
  HOUR_HEIGHT,
  HOUR_MARKS,
  TIME_GUTTER_WIDTH,
  WEEK_DAYS,
} from "@presentation/utils/calendarLayout";
import { CardRamo } from "./CardRamo";

interface CalendarGridProps {
  subjects: Subject[];
  onPressSubject: (subject: Subject) => void;
  onToggleFavorite: (id: string) => void;
  onMoveSubject: (id: string, day: WeekDay, startTime: string, endTime: string) => void;
}

/**
 * Weekly grid: day columns x hour rows. Columns have a fixed width wide
 * enough to read a full subject name, so the grid scrolls horizontally to
 * fit all 7 — the day-header row scrolls in lockstep via a synced offset
 * rather than its own touch handling, since only the body should be dragged.
 */
export function CalendarGrid({ subjects, onPressSubject, onToggleFavorite, onMoveSubject }: CalendarGridProps) {
  const theme = useTheme();
  const headerScrollRef = useRef<ScrollView>(null);

  const handleBodyScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    headerScrollRef.current?.scrollTo({ x: event.nativeEvent.contentOffset.x, animated: false });
  };

  return (
    <View style={styles.container}>
      <View style={styles.dayHeaderRow}>
        <View style={{ width: TIME_GUTTER_WIDTH }} />
        <ScrollView
          ref={headerScrollRef}
          horizontal
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
        >
          {WEEK_DAYS.map((day) => (
            <View key={day} style={[styles.dayHeaderCell, { width: DAY_WIDTH }]}>
              <Text style={[styles.dayHeaderText, { color: theme.colors.textMuted }]}>{DAY_LABELS[day]}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row" }}>
          <View style={{ width: TIME_GUTTER_WIDTH, height: GRID_TOTAL_HEIGHT }}>
            {HOUR_MARKS.map((hour, index) => (
              <Text
                key={hour}
                style={[
                  styles.hourLabel,
                  { top: GRID_VERTICAL_PADDING + index * HOUR_HEIGHT - 7, color: theme.colors.textMuted },
                ]}
              >
                {hour}:00
              </Text>
            ))}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleBodyScroll}
            scrollEventThrottle={16}
          >
            <View style={[styles.grid, { width: DAY_WIDTH * 7, height: GRID_TOTAL_HEIGHT, borderColor: theme.colors.border }]}>
              {HOUR_MARKS.map((hour, index) => (
                <View
                  key={hour}
                  style={[
                    styles.hourLine,
                    { top: GRID_VERTICAL_PADDING + index * HOUR_HEIGHT, borderColor: theme.colors.border },
                  ]}
                />
              ))}
              {WEEK_DAYS.slice(1).map((day, i) => (
                <View
                  key={day}
                  style={[styles.dayLine, { left: (i + 1) * DAY_WIDTH, borderColor: theme.colors.border }]}
                />
              ))}

              {subjects.map((subject) => (
                <CardRamo
                  key={subject.id}
                  subject={subject}
                  onPress={onPressSubject}
                  onToggleFavorite={onToggleFavorite}
                  onMove={onMoveSubject}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dayHeaderRow: { flexDirection: "row", paddingBottom: 8 },
  dayHeaderCell: { alignItems: "center" },
  dayHeaderText: { fontSize: 12, fontWeight: "600" },
  hourLabel: { position: "absolute", right: 6, fontSize: 11 },
  grid: { borderLeftWidth: StyleSheet.hairlineWidth, position: "relative" },
  hourLine: { position: "absolute", left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth },
  dayLine: { position: "absolute", top: 0, bottom: 0, borderLeftWidth: StyleSheet.hairlineWidth },
});
