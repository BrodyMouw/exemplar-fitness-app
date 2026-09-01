import { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useApi } from "../api/client";
import type { Exercise, WorkoutPlan } from "../api/types";
import type { PlansStackParamList } from "../navigation/PlansStack";
import RoutineSection from "../components/RoutineSection";
import {
  ScreenContainer,
  Card,
  Chip,
  IconButton,
  PrimaryButton,
  SecondaryButton,
  SelectPill,
  TextField,
  SectionLabel,
  EmptyState,
  confirmDelete,
  showActionMenu,
} from "../components/ui";
import { colors, spacing, typography } from "../theme";

const MAX_ROUTINES = 7;

type Props = NativeStackScreenProps<PlansStackParamList, "PlanDetail">;

export default function PlanDetailScreen({ route, navigation }: Props) {
  const { planId } = route.params;
  const api = useApi();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");

  const [adding, setAdding] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [workoutType, setWorkoutType] = useState("");

  const load = useCallback(async () => {
    const [planData, catalogData] = await Promise.all([
      api.get<WorkoutPlan>(`/api/workoutplans/${planId}`),
      api.get<Exercise[]>("/api/exercises"),
    ]);
    setPlan(planData);
    setCatalog(catalogData);
    setPlanName(planData.name);
    setPlanDescription(planData.description ?? "");
    navigation.setOptions({ title: planData.name });
  }, [api, planId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Keep a routine selected: default to the first, and recover if the
  // selected one was just deleted.
  useEffect(() => {
    if (!plan) return;
    const stillExists = plan.routines.some((r) => r.id === selectedRoutineId);
    if (!stillExists) {
      setSelectedRoutineId(plan.routines[0]?.id ?? null);
    }
  }, [plan, selectedRoutineId]);

  const savePlan = async () => {
    await api.put(`/api/workoutplans/${planId}`, {
      name: planName.trim(),
      description: planDescription.trim() || null,
    });
    setEditing(false);
    load();
  };

  const deletePlan = () => {
    confirmDelete(
      "Delete plan",
      `Delete ${plan?.name} and all of its routines? This can't be undone.`,
      async () => {
        await api.del(`/api/workoutplans/${planId}`);
        navigation.goBack();
      },
    );
  };

  const addRoutine = async () => {
    if (!routineName.trim()) return;
    await api.post(`/api/workoutplans/${planId}/routines`, {
      name: routineName.trim(),
      workoutType: workoutType.trim(),
    });
    setRoutineName("");
    setWorkoutType("");
    setAdding(false);
    load();
  };

  if (!plan) {
    return (
      <ScreenContainer>
        <EmptyState message="Loading…" />
      </ScreenContainer>
    );
  }

  const atRoutineLimit = plan.routines.length >= MAX_ROUTINES;
  const selectedRoutine =
    plan.routines.find((r) => r.id === selectedRoutineId) ?? null;

  return (
    <ScreenContainer scroll>
      <Card>
        {editing ? (
          <>
            <SectionLabel>Name</SectionLabel>
            <TextField value={planName} onChangeText={setPlanName} />
            <SectionLabel>Description</SectionLabel>
            <TextField
              value={planDescription}
              onChangeText={setPlanDescription}
              placeholder="Optional"
            />
            <View style={styles.buttonRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setEditing(false)}
                style={styles.flexButton}
              />
              <PrimaryButton
                title="Save"
                onPress={savePlan}
                disabled={!planName.trim()}
                style={styles.flexButton}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.planHeaderRow}>
              <View style={styles.planHeaderMain}>
                <Text style={styles.planTitle}>{plan.name}</Text>
                {plan.description ? (
                  <Text style={styles.planDescription}>{plan.description}</Text>
                ) : null}
              </View>
              <IconButton
                name="ellipsis-horizontal"
                onPress={() =>
                  showActionMenu(plan.name, [
                    { label: "Edit plan", onPress: () => setEditing(true) },
                    { label: "Delete plan", destructive: true, onPress: deletePlan },
                  ])
                }
              />
            </View>
            <View style={styles.metaRow}>
              <Chip
                label={`${plan.routines.length} of ${MAX_ROUTINES} days`}
                tone="primary"
              />
            </View>
          </>
        )}
      </Card>

      <View style={styles.routineRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.routineStrip}
          style={styles.routineScroll}
        >
          {plan.routines.map((routine) => (
            <SelectPill
              key={routine.id}
              label={routine.name}
              selected={routine.id === selectedRoutineId}
              onPress={() => setSelectedRoutineId(routine.id)}
            />
          ))}
        </ScrollView>
        {!adding && !atRoutineLimit && (
          <IconButton
            name="add"
            color={colors.primary}
            onPress={() => {
              setRoutineName(`Day ${plan.routines.length + 1}`);
              setAdding(true);
            }}
          />
        )}
      </View>

      {atRoutineLimit && !adding ? (
        <Text style={styles.limitNote}>
          A plan covers one week — seven routines is the max.
        </Text>
      ) : null}

      {adding && (
        <Card>
          <SectionLabel>Routine name</SectionLabel>
          <TextField
            placeholder="e.g. Day 4"
            value={routineName}
            onChangeText={setRoutineName}
          />
          <SectionLabel>Workout type</SectionLabel>
          <TextField
            placeholder="e.g. Push, Legs, Cardio"
            value={workoutType}
            onChangeText={setWorkoutType}
          />
          <View style={styles.buttonRow}>
            <SecondaryButton
              title="Cancel"
              onPress={() => setAdding(false)}
              style={styles.flexButton}
            />
            <PrimaryButton
              title="Add routine"
              onPress={addRoutine}
              disabled={!routineName.trim()}
              style={styles.flexButton}
            />
          </View>
        </Card>
      )}

      {selectedRoutine ? (
        <RoutineSection
          key={selectedRoutine.id}
          routine={selectedRoutine}
          catalog={catalog}
          onChanged={load}
          onCatalogChanged={load}
        />
      ) : (
        !adding && (
          <EmptyState message="No routines yet. Add your first training day." />
        )
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  planHeaderRow: { flexDirection: "row", alignItems: "flex-start" },
  planHeaderMain: { flex: 1, paddingRight: spacing.md },
  planTitle: { ...typography.title, fontSize: 22 },
  planDescription: { ...typography.muted, marginTop: spacing.xs, fontSize: 14 },
  metaRow: { flexDirection: "row", marginTop: spacing.md },
  routineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  routineScroll: { flex: 1 },
  routineStrip: { gap: spacing.sm, paddingVertical: spacing.xs },
  limitNote: { ...typography.muted },
  buttonRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  flexButton: { flex: 1 },
});
