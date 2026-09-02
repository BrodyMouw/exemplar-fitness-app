import { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "../api/client";
import { useLoad } from "../api/useLoad";
import type { WorkoutPlan } from "../api/types";
import type { WorkoutStackParamList } from "../navigation/WorkoutStack";
import {
  modeIcon,
  prescriptionSummary,
  estimateLabel,
  estimateHint,
} from "../components/RoutineSection";
import { useUnit } from "../UnitContext";
import {
  ScreenContainer,
  Card,
  Chip,
  PrimaryButton,
  SelectPill,
  EmptyState,
  ErrorState,
  ErrorBanner,
} from "../components/ui";
import { colors, spacing, typography } from "../theme";

type Props = NativeStackScreenProps<WorkoutStackParamList, "RoutinePreview">;

export default function RoutinePreviewScreen({ route, navigation }: Props) {
  const { planId } = route.params;
  const api = useApi();
  const { unit } = useUnit();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await api.get<WorkoutPlan>(`/api/workoutplans/${planId}`);
    setPlan(data);
    navigation.setOptions({ title: data.name });
  }, [api, planId, navigation]);

  const { error, reload } = useLoad(load);

  useEffect(() => {
    if (!plan) return;
    const stillExists = plan.routines.some((r) => r.id === selectedRoutineId);
    if (!stillExists) setSelectedRoutineId(plan.routines[0]?.id ?? null);
  }, [plan, selectedRoutineId]);

  // Order matters: a failed first load leaves `plan` null, and without this
  // the screen would sit on "Loading…" forever.
  if (error && !plan) {
    return (
      <ScreenContainer>
        <ErrorState message={error} onRetry={reload} />
      </ScreenContainer>
    );
  }

  if (!plan) {
    return (
      <ScreenContainer>
        <EmptyState message="Loading…" />
      </ScreenContainer>
    );
  }

  const routine = plan.routines.find((r) => r.id === selectedRoutineId) ?? null;

  return (
    <ScreenContainer scroll>
      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
      {plan.routines.length === 0 ? (
        <EmptyState message="This plan has no routines yet. Add some from the Plans tab." />
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.routineStrip}
          >
            {plan.routines.map((r) => (
              <SelectPill
                key={r.id}
                label={r.name}
                selected={r.id === selectedRoutineId}
                onPress={() => setSelectedRoutineId(r.id)}
              />
            ))}
          </ScrollView>

          {routine && (
            <>
              <Card>
                <Text style={styles.routineTitle}>{routine.name}</Text>
                <View style={styles.chipRow}>
                  {routine.workoutType ? (
                    <Chip label={routine.workoutType} tone="accent" />
                  ) : null}
                  <Chip
                    label={`${routine.routineExercises.length} exercises`}
                    tone="neutral"
                  />
                  {estimateLabel(routine.estimate) ? (
                    <Chip label={estimateLabel(routine.estimate)!} tone="primary" />
                  ) : null}
                </View>
                {/* This is the screen you're on right before committing to the
                    workout, so it's worth saying where the number came from. */}
                {estimateHint(routine.estimate) ? (
                  <Text style={styles.estimateHint}>
                    {estimateHint(routine.estimate)}
                  </Text>
                ) : null}
              </Card>

              {routine.routineExercises.length === 0 ? (
                <EmptyState message="No exercises in this routine yet." />
              ) : (
                routine.routineExercises.map((item) => (
                  <Card key={item.id}>
                    <View style={styles.exerciseRow}>
                      <Ionicons
                        name={modeIcon(item.exercise)}
                        size={22}
                        color={colors.primary}
                      />
                      <View style={styles.exerciseMain}>
                        <Text style={styles.exerciseName}>{item.exercise?.name}</Text>
                        <Text style={styles.exerciseMeta}>
                          {prescriptionSummary(item, unit)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))
              )}

              <PrimaryButton
                title="Start workout"
                disabled={routine.routineExercises.length === 0}
                onPress={() =>
                  navigation.navigate("Runner", {
                    routineId: routine.id,
                    routineName: routine.name,
                  })
                }
                style={styles.startButton}
              />
            </>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  routineStrip: { gap: spacing.sm, paddingVertical: spacing.xs },
  routineTitle: { ...typography.heading, fontSize: 17 },
  // Wraps: a third chip pushes past the card edge on a narrow screen.
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  estimateHint: { ...typography.muted, marginTop: spacing.sm },
  exerciseRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  exerciseMain: { flex: 1 },
  exerciseName: { ...typography.body, fontWeight: "600" },
  exerciseMeta: { ...typography.muted, marginTop: 2 },
  startButton: { marginTop: spacing.lg },
});
