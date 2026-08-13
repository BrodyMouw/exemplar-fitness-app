import { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "../api/client";
import type { WorkoutPlan } from "../api/types";
import type { WorkoutStackParamList } from "../navigation/WorkoutStack";
import { modeIcon, prescriptionSummary } from "../components/RoutineSection";
import {
  ScreenContainer,
  Card,
  Chip,
  PrimaryButton,
  SelectPill,
  EmptyState,
} from "../components/ui";
import { colors, spacing, typography } from "../theme";

type Props = NativeStackScreenProps<WorkoutStackParamList, "RoutinePreview">;

export default function RoutinePreviewScreen({ route, navigation }: Props) {
  const { planId } = route.params;
  const api = useApi();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      api.get<WorkoutPlan>(`/api/workoutplans/${planId}`).then((data) => {
        setPlan(data);
        navigation.setOptions({ title: data.name });
      });
    }, [api, planId, navigation]),
  );

  useEffect(() => {
    if (!plan) return;
    const stillExists = plan.routines.some((r) => r.id === selectedRoutineId);
    if (!stillExists) setSelectedRoutineId(plan.routines[0]?.id ?? null);
  }, [plan, selectedRoutineId]);

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
                </View>
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
                          {prescriptionSummary(item)}
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
  chipRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  exerciseRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  exerciseMain: { flex: 1 },
  exerciseName: { ...typography.body, fontWeight: "600" },
  exerciseMeta: { ...typography.muted, marginTop: 2 },
  startButton: { marginTop: spacing.lg },
});
