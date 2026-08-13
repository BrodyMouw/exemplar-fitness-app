import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "../api/client";
import type { Exercise, Routine, RoutineExercise } from "../api/types";
import {
  Card,
  Chip,
  IconButton,
  ModalSheet,
  PrimaryButton,
  SearchField,
  SecondaryButton,
  Stepper,
  TextField,
  SectionLabel,
  confirmDelete,
} from "./ui";
import { colors, spacing, radii, typography } from "../theme";

type IconName = keyof typeof Ionicons.glyphMap;

const DEFAULT_SETS = 3;
const DEFAULT_REPS = 10;
const DEFAULT_SECONDS = 30;
const DEFAULT_WEIGHT_KG = 20;

export function modeIcon(exercise?: Exercise): IconName {
  if (!exercise) return "ellipse-outline";
  if (exercise.mode === "Time") return "stopwatch-outline";
  return exercise.weightType === "External" ? "barbell-outline" : "body-outline";
}

export function prescriptionSummary(item: RoutineExercise): string {
  const parts = [`${item.sets} sets`];
  if (item.exercise?.mode === "Time") {
    if (item.timePerSetSeconds) parts.push(`${item.timePerSetSeconds}s each`);
  } else if (item.repsPerSet) {
    parts.push(`${item.repsPerSet} reps`);
  }
  if (item.weightKg != null) parts.push(`@ ${item.weightKg} kg`);
  return parts.join(" · ");
}

export default function RoutineSection({
  routine,
  catalog,
  onChanged,
}: {
  routine: Routine;
  catalog: Exercise[];
  onChanged: () => void;
}) {
  const api = useApi();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(routine.name);
  const [workoutType, setWorkoutType] = useState(routine.workoutType);

  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [editingItem, setEditingItem] = useState<RoutineExercise | null>(null);
  const [sets, setSets] = useState(DEFAULT_SETS);
  const [reps, setReps] = useState(DEFAULT_REPS);
  const [seconds, setSeconds] = useState(DEFAULT_SECONDS);
  const [weight, setWeight] = useState(DEFAULT_WEIGHT_KG);

  const resetForm = () => {
    setSelected(null);
    setEditingItem(null);
    setSets(DEFAULT_SETS);
    setReps(DEFAULT_REPS);
    setSeconds(DEFAULT_SECONDS);
    setWeight(DEFAULT_WEIGHT_KG);
    setSearch("");
    setPicking(false);
  };

  const openEdit = (item: RoutineExercise) => {
    if (!item.exercise) return;
    setEditingItem(item);
    setSelected(item.exercise);
    setSets(item.sets);
    setReps(item.repsPerSet ?? DEFAULT_REPS);
    setSeconds(item.timePerSetSeconds ?? DEFAULT_SECONDS);
    setWeight(item.weightKg ?? DEFAULT_WEIGHT_KG);
    setPicking(true);
  };

  const filteredCatalog = catalog.filter((exercise) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      exercise.name.toLowerCase().includes(q) ||
      exercise.targetMuscle.toLowerCase().includes(q)
    );
  });

  const saveRoutine = async () => {
    await api.put(`/api/routines/${routine.id}`, {
      name: name.trim(),
      workoutType: workoutType.trim(),
    });
    setEditing(false);
    onChanged();
  };

  const submitExercise = async () => {
    if (!selected) return;
    const isTimed = selected.mode === "Time";
    const prescription = {
      sets,
      repsPerSet: isTimed ? null : reps,
      timePerSetSeconds: isTimed ? seconds : null,
      weightKg: !isTimed && selected.weightType === "External" ? weight : null,
    };

    if (editingItem) {
      await api.put(`/api/routineexercises/${editingItem.id}`, prescription);
    } else {
      await api.post(`/api/routines/${routine.id}/exercises`, {
        exerciseId: selected.id,
        ...prescription,
      });
    }
    resetForm();
    onChanged();
  };

  const removeExercise = async (id: string, label?: string) => {
    confirmDelete(
      "Remove exercise",
      `Remove ${label ?? "this exercise"} from ${routine.name}?`,
      async () => {
        await api.del(`/api/routineexercises/${id}`);
        onChanged();
      },
    );
  };

  const deleteRoutine = () => {
    confirmDelete(
      "Delete routine",
      `Delete ${routine.name} and all of its exercises? This can't be undone.`,
      async () => {
        await api.del(`/api/routines/${routine.id}`);
        onChanged();
      },
    );
  };

  const isTimed = selected?.mode === "Time";
  const needsWeight = selected?.mode === "Reps" && selected.weightType === "External";
  const canSubmit = Boolean(selected);

  return (
    <View style={styles.wrapper}>
      <Card>
        {editing ? (
          <>
            <SectionLabel>Routine name</SectionLabel>
            <TextField value={name} onChangeText={setName} />
            <SectionLabel>Workout type</SectionLabel>
            <TextField
              placeholder="e.g. Push, Legs, Cardio"
              value={workoutType}
              onChangeText={setWorkoutType}
            />
            <View style={styles.buttonRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => {
                  setName(routine.name);
                  setWorkoutType(routine.workoutType);
                  setEditing(false);
                }}
                style={styles.flexButton}
              />
              <PrimaryButton
                title="Save"
                onPress={saveRoutine}
                disabled={!name.trim()}
                style={styles.flexButton}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.routineHeader}>
              <View style={styles.routineMain}>
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
              </View>
              <IconButton name="ellipsis-horizontal" onPress={() => setEditing(true)} />
            </View>
            <SecondaryButton
              title="Delete routine"
              tone="danger"
              onPress={deleteRoutine}
              style={styles.deleteButton}
            />
          </>
        )}
      </Card>

      {routine.routineExercises.map((item) => (
        <Card key={item.id} onPress={() => openEdit(item)}>
          <View style={styles.exerciseRow}>
            <Ionicons name={modeIcon(item.exercise)} size={22} color={colors.primary} />
            <View style={styles.catalogMain}>
              <Text style={styles.catalogName}>{item.exercise?.name}</Text>
              <Text style={styles.catalogMuscle}>{prescriptionSummary(item)}</Text>
            </View>
            <Pressable
              onPress={() => removeExercise(item.id, item.exercise?.name)}
              hitSlop={8}
              style={({ pressed }) => pressed && styles.rowPressed}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        </Card>
      ))}

      <Pressable
        onPress={() => setPicking(true)}
        style={({ pressed }) => [styles.addTile, pressed && styles.rowPressed]}
      >
        <View style={styles.addIconCircle}>
          <Ionicons name="add" size={26} color={colors.primary} />
        </View>
        <Text style={styles.addTileText}>Add Exercise</Text>
      </Pressable>

      <ModalSheet
        visible={picking}
        onClose={resetForm}
        title={
          selected
            ? editingItem
              ? `Edit ${selected.name}`
              : selected.name
            : "Add exercise"
        }
      >
        {!selected ? (
          <View style={styles.catalogList}>
            <View style={styles.searchFieldWrap}>
              <SearchField
                placeholder="Search exercises"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
            </View>
            {filteredCatalog.length === 0 ? (
              <Text style={styles.noResults}>No exercises match "{search}"</Text>
            ) : (
              filteredCatalog.map((exercise) => (
                <Pressable
                  key={exercise.id}
                  style={({ pressed }) => [
                    styles.catalogRow,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => setSelected(exercise)}
                >
                  <Ionicons
                    name={modeIcon(exercise)}
                    size={20}
                    color={colors.primary}
                    style={styles.catalogIcon}
                  />
                  <View style={styles.catalogMain}>
                    <Text style={styles.catalogName}>{exercise.name}</Text>
                    <Text style={styles.catalogMuscle}>{exercise.targetMuscle}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        ) : (
          <View style={styles.formBody}>
            {selected.description ? (
              <Text style={styles.selectedDescription}>{selected.description}</Text>
            ) : null}

            <SectionLabel>Sets</SectionLabel>
            <Stepper value={sets} onChange={setSets} min={1} max={20} />

            {isTimed ? (
              <>
                <SectionLabel>Seconds per set</SectionLabel>
                <Stepper value={seconds} onChange={setSeconds} min={5} max={600} step={5} />
              </>
            ) : (
              <>
                <SectionLabel>Reps per set</SectionLabel>
                <Stepper value={reps} onChange={setReps} min={1} max={50} />
              </>
            )}

            {needsWeight && (
              <>
                <SectionLabel>Target weight (kg)</SectionLabel>
                <Stepper
                  value={weight}
                  onChange={setWeight}
                  min={0}
                  max={500}
                  step={2.5}
                  decimals={1}
                />
              </>
            )}

            <View style={styles.buttonRow}>
              <SecondaryButton
                title={editingItem ? "Cancel" : "Back"}
                onPress={editingItem ? resetForm : () => setSelected(null)}
                style={styles.flexButton}
              />
              <PrimaryButton
                title={editingItem ? "Save" : "Add"}
                onPress={submitExercise}
                disabled={!canSubmit}
                style={styles.flexButton}
              />
            </View>
          </View>
        )}
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.md },
  routineHeader: { flexDirection: "row", alignItems: "flex-start" },
  routineMain: { flex: 1, paddingRight: spacing.md },
  routineTitle: { ...typography.heading, fontSize: 17 },
  chipRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  deleteButton: { marginTop: spacing.lg },
  catalogRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: { opacity: 0.6 },
  catalogIcon: { marginRight: spacing.md },
  catalogMain: { flex: 1 },
  catalogName: { ...typography.body, fontWeight: "600" },
  catalogMuscle: { ...typography.muted, marginTop: 2 },
  catalogList: { paddingBottom: spacing.lg },
  searchFieldWrap: { marginBottom: spacing.sm },
  noResults: { ...typography.muted, textAlign: "center", paddingVertical: spacing.xl },
  formBody: { paddingBottom: spacing.xl },
  selectedDescription: { ...typography.muted, marginBottom: spacing.sm },
  exerciseRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  buttonRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  flexButton: { flex: 1 },
  addTile: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  addTileText: { ...typography.body, fontWeight: "700", color: colors.primary },
});
