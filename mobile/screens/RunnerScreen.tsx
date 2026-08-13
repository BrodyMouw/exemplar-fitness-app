import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "../api/client";
import type { Routine, RoutineExercise, WorkoutLog } from "../api/types";
import type { WorkoutStackParamList } from "../navigation/WorkoutStack";
import { modeIcon, prescriptionSummary } from "../components/RoutineSection";
import CountdownTimer from "../components/CountdownTimer";
import {
  ScreenContainer,
  Card,
  Chip,
  PrimaryButton,
  SecondaryButton,
  Stepper,
  SectionLabel,
  EmptyState,
} from "../components/ui";
import { colors, spacing, radii, typography } from "../theme";

type Props = NativeStackScreenProps<WorkoutStackParamList, "Runner">;

// What the user actually performed for one exercise, seeded from the
// prescription and adjusted as they go.
type Entry = {
  sets: number;
  reps: number;
  seconds: number;
  weight: number;
  logId?: string;
};

function seedEntry(item: RoutineExercise): Entry {
  return {
    sets: item.sets,
    reps: item.repsPerSet ?? 10,
    seconds: item.timePerSetSeconds ?? 30,
    weight: item.weightKg ?? 0,
  };
}

export default function RunnerScreen({ route, navigation }: Props) {
  const { routineId } = route.params;
  const api = useApi();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [index, setIndex] = useState(0);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Routine>(`/api/routines/${routineId}`).then((data) => {
      setRoutine(data);
      // Seed only what we haven't got yet - never overwrite numbers the user
      // has already dialled in for this session.
      setEntries((prev) => {
        const next = { ...prev };
        for (const re of data.routineExercises) {
          if (!next[re.id]) next[re.id] = seedEntry(re);
        }
        return next;
      });
    });
  }, [api, routineId]);

  const exercises = routine?.routineExercises ?? [];
  const current = exercises[index];
  const entry = current ? entries[current.id] : undefined;

  const patchEntry = useCallback(
    (patch: Partial<Entry>) => {
      if (!current) return;
      setEntries((prev) => ({ ...prev, [current.id]: { ...prev[current.id], ...patch } }));
    },
    [current],
  );

  const handleElapsed = useCallback(
    (seconds: number) => {
      if (seconds > 0) patchEntry({ seconds });
    },
    [patchEntry],
  );

  if (!routine || !current || !entry) {
    return (
      <ScreenContainer>
        <EmptyState message="Loading…" />
      </ScreenContainer>
    );
  }

  const exercise = current.exercise;
  const isTimed = exercise?.mode === "Time";
  const needsWeight = exercise?.mode === "Reps" && exercise.weightType === "External";
  const isLast = index === exercises.length - 1;

  const prescribedWeight = current.weightKg ?? 0;
  const weightDelta = entry.weight - prescribedWeight;

  const save = async () => {
    setSaving(true);
    try {
      const body = {
        actualSets: entry.sets,
        actualReps: isTimed ? null : entry.reps,
        actualTimeSeconds: isTimed ? entry.seconds : null,
        weightUsedKg: needsWeight ? entry.weight : null,
      };

      if (entry.logId) {
        await api.put(`/api/workoutlogs/${entry.logId}`, body);
      } else {
        const created = await api.post<WorkoutLog>(
          `/api/routineexercises/${current.id}/logs`,
          body,
        );
        patchEntry({ logId: created.id });
      }

      if (isLast) {
        navigation.goBack();
      } else {
        setIndex(index + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.progressStrip}
      >
        {exercises.map((item, i) => {
          const logged = Boolean(entries[item.id]?.logId);
          const active = i === index;
          return (
            <Pressable
              key={item.id}
              onPress={() => setIndex(i)}
              style={({ pressed }) => [
                styles.progressPill,
                logged && styles.progressPillLogged,
                active && styles.progressPillActive,
                pressed && styles.pressed,
              ]}
            >
              {logged ? (
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={active ? "#fff" : colors.success}
                />
              ) : null}
              <Text
                style={[
                  styles.progressPillText,
                  logged && styles.progressPillTextLogged,
                  active && styles.progressPillTextActive,
                ]}
              >
                {i + 1}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.position}>
        Exercise {index + 1} of {exercises.length}
      </Text>

      <Card>
        <View style={styles.exerciseHeader}>
          <Ionicons name={modeIcon(exercise)} size={26} color={colors.primary} />
          <View style={styles.exerciseMain}>
            <Text style={styles.exerciseName}>{exercise?.name}</Text>
            <Text style={styles.exerciseMuscle}>{exercise?.targetMuscle}</Text>
          </View>
        </View>
        {exercise?.description ? (
          <Text style={styles.description}>{exercise.description}</Text>
        ) : null}
        <View style={styles.planRow}>
          <Chip label={`Plan: ${prescriptionSummary(current)}`} tone="neutral" />
        </View>
      </Card>

      {isTimed && (
        // Keyed per exercise so moving between two exercises that happen to
        // share the same target doesn't carry over a half-run clock.
        <CountdownTimer
          key={current.id}
          targetSeconds={current.timePerSetSeconds ?? entry.seconds}
          onElapsed={handleElapsed}
        />
      )}

      <Card>
        <SectionLabel>Sets completed</SectionLabel>
        <Stepper
          value={entry.sets}
          onChange={(sets) => patchEntry({ sets })}
          min={0}
          max={20}
        />

        {isTimed ? (
          <>
            <SectionLabel>Seconds per set</SectionLabel>
            <Stepper
              value={entry.seconds}
              onChange={(seconds) => patchEntry({ seconds })}
              min={0}
              max={600}
              step={5}
            />
          </>
        ) : (
          <>
            <SectionLabel>Reps per set</SectionLabel>
            <Stepper
              value={entry.reps}
              onChange={(reps) => patchEntry({ reps })}
              min={0}
              max={50}
            />
          </>
        )}

        {needsWeight && (
          <>
            <SectionLabel>Weight used (kg)</SectionLabel>
            <Stepper
              value={entry.weight}
              onChange={(weight) => patchEntry({ weight })}
              min={0}
              max={500}
              step={2.5}
              decimals={1}
            />
            <View style={styles.deltaRow}>
              <Chip
                label={
                  weightDelta === 0
                    ? `As prescribed (${prescribedWeight} kg)`
                    : `${weightDelta > 0 ? "+" : "−"}${Math.abs(weightDelta)} kg vs plan`
                }
                tone={
                  weightDelta === 0 ? "neutral" : weightDelta > 0 ? "success" : "accent"
                }
              />
            </View>
          </>
        )}
      </Card>

      <PrimaryButton
        title={
          saving
            ? "Saving…"
            : entry.logId
              ? isLast
                ? "Update & finish"
                : "Update & next"
              : isLast
                ? "Log & finish"
                : "Log & next"
        }
        onPress={save}
        disabled={saving}
      />

      <View style={styles.navRow}>
        <SecondaryButton
          title="Previous"
          onPress={() => setIndex(index - 1)}
          disabled={index === 0}
          style={styles.flexButton}
        />
        <SecondaryButton
          title="Skip"
          onPress={() => setIndex(index + 1)}
          disabled={isLast}
          style={styles.flexButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  progressStrip: { gap: spacing.sm, paddingVertical: spacing.xs },
  progressPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minWidth: 40,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressPillLogged: {
    backgroundColor: colors.successMuted,
    borderColor: colors.successMuted,
  },
  progressPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  progressPillText: { fontSize: 14, fontWeight: "700", color: colors.text },
  progressPillTextLogged: { color: colors.success },
  progressPillTextActive: { color: "#fff" },
  pressed: { opacity: 0.75 },
  position: { ...typography.muted, textAlign: "center" },
  exerciseHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  exerciseMain: { flex: 1 },
  exerciseName: { ...typography.title, fontSize: 22 },
  exerciseMuscle: { ...typography.muted, marginTop: 2 },
  description: { ...typography.muted, marginTop: spacing.md },
  planRow: { flexDirection: "row", marginTop: spacing.md },
  deltaRow: { flexDirection: "row", marginTop: spacing.md },
  navRow: { flexDirection: "row", gap: spacing.md },
  flexButton: { flex: 1 },
});
