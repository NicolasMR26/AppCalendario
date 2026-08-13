import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { Subject, WeekDay } from "@domain/entities/Subject";
import { subjectDurationMinutes } from "@domain/entities/Subject";
import { useTheme } from "@presentation/theme/ThemeProvider";
import {
  DAY_WIDTH,
  dayFromX,
  HOUR_HEIGHT,
  minutesFromGridTop,
  minutesToTime,
  timeToMinutes,
  yFromMinutes,
} from "@presentation/utils/calendarLayout";

interface CardRamoProps {
  subject: Subject;
  onPress: (subject: Subject) => void;
  onToggleFavorite: (id: string) => void;
  onMove: (id: string, day: WeekDay, startTime: string, endTime: string) => void;
}

/**
 * A single subject card positioned absolutely inside the calendar grid.
 * Drag & drop is gesture-driven: the card follows the finger, and on release
 * the new day/time is derived from grid geometry and committed via onMove.
 */
export function CardRamo({ subject, onPress, onToggleFavorite, onMove }: CardRamoProps) {
  const theme = useTheme();
  const durationMinutes = subjectDurationMinutes(subject);
  const cardHeight = Math.max(44, (durationMinutes / 60) * HOUR_HEIGHT - 4);

  const baseX = dayFromXIndex(subject.day) * DAY_WIDTH;
  const baseY = yFromMinutes(timeToMinutes(subject.startTime));

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const commitMove = (day: WeekDay, startTime: string) => {
    const start = timeToMinutes(startTime);
    const end = start + durationMinutes;
    const endTime = minutesToTime(end);
    onMove(subject.id, day, startTime, endTime);
  };

  const pan = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart(() => {
      isDragging.value = true;
      scale.value = withSpring(1.05);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const newX = baseX + event.translationX;
      const newY = baseY + event.translationY;
      const newDay = dayFromX(newX, DAY_WIDTH);
      const newStartMinutes = minutesFromGridTop(newY);
      const newStartTime = minutesToTime(newStartMinutes);

      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      scale.value = withSpring(1);
      isDragging.value = false;
      runOnJS(commitMove)(newDay, newStartTime);
    });

  const tap = Gesture.Tap()
    .maxDuration(200)
    .onEnd(() => {
      runOnJS(onPress)(subject);
    });

  const composed = Gesture.Simultaneous(pan, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: isDragging.value ? 10 : 1,
    shadowOpacity: isDragging.value ? 0.25 : 0.08,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          styles.card,
          animatedStyle,
          {
            left: baseX + 3,
            top: baseY + 2,
            width: DAY_WIDTH - 6,
            height: cardHeight,
            backgroundColor: subject.color,
            shadowColor: theme.colors.shadow,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text numberOfLines={2} ellipsizeMode="tail" style={styles.title}>
            {subject.name}
          </Text>
          <Pressable hitSlop={8} onPress={() => onToggleFavorite(subject.id)}>
            <Text style={styles.star}>{subject.isFavorite ? "★" : "☆"}</Text>
          </Pressable>
        </View>
        {cardHeight > 60 && (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subject.startTime} – {subject.endTime}
          </Text>
        )}
        {subject.room && cardHeight > 78 && (
          <Text numberOfLines={1} style={styles.subtitle}>
            📍 {subject.room}
          </Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

function dayFromXIndex(day: WeekDay): number {
  return day - 1;
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    borderRadius: 12,
    padding: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  title: { color: "#fff", fontWeight: "600", fontSize: 13, flexShrink: 1 },
  star: { color: "#fff", fontSize: 14 },
  subtitle: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2 },
});
