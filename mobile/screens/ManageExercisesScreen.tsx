import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "../api/client";
import type { Exercise } from "../api/types";
import { modeIcon } from "../components/RoutineSection";
import ExerciseForm, { type ExerciseDraft } from "../components/ExerciseForm";
import {
  ScreenContainer,
  Card,
  Chip,
  ModalSheet,
  PrimaryButton,
  SearchField,
  EmptyState,
} from "../components/ui";
import { colors, spacing, typography } from "../theme";

export default function ManageExercisesScreen() {
  const api = useApi();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  const load = useCallback(async () => {
    setExercises(
      await api.get<Exercise[]>("/api/exercises?includeArchived=true"),
    );
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const createExercise = async (draft: ExerciseDraft) => {
    await api.post("/api/exercises", draft);
    setCreating(false);
    load();
  };

  const updateExercise = async (draft: ExerciseDraft) => {
    if (!editing) return;
    await api.put(`/api/exercises/${editing.id}`, draft);
    setEditing(null);
    load();
  };

  const toggleArchive = async (exercise: Exercise) => {
    if (exercise.isArchived) {
      await api.del(`/api/exercises/${exercise.id}/archive`);
    } else {
      await api.post(`/api/exercises/${exercise.id}/archive`, {});
    }
    load();
  };

  const q = search.trim().toLowerCase();
  const matches = exercises.filter(
    (e) =>
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.targetMuscle.toLowerCase().includes(q),
  );
  const active = matches.filter((e) => !e.isArchived);
  const archived = matches.filter((e) => e.isArchived);

  const renderRow = (exercise: Exercise) => (
    <Card key={exercise.id} style={exercise.isArchived ? styles.dimmed : undefined}>
      <View style={styles.row}>
        <Ionicons name={modeIcon(exercise)} size={22} color={colors.primary} />
        <View style={styles.main}>
          <Text style={styles.name}>{exercise.name}</Text>
          <Text style={styles.muscle}>{exercise.targetMuscle}</Text>
          {exercise.isCustom ? (
            <View style={styles.chipRow}>
              <Chip label="Custom" tone="primary" />
            </View>
          ) : null}
        </View>
        <View style={styles.actions}>
          {/* Seeded exercises are shared, so only your own are editable. */}
          {exercise.isCustom ? (
            <Pressable
              onPress={() => setEditing(exercise)}
              hitSlop={8}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Ionicons name="pencil" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => toggleArchive(exercise)}
            hitSlop={8}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Ionicons
              name={exercise.isArchived ? "arrow-undo-outline" : "archive-outline"}
              size={18}
              color={exercise.isArchived ? colors.primary : colors.textMuted}
            />
          </Pressable>
        </View>
      </View>
    </Card>
  );

  return (
    <ScreenContainer scroll>
      <SearchField
        placeholder="Search exercises"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      <PrimaryButton title="New exercise" onPress={() => setCreating(true)} />

      {active.length === 0 && archived.length === 0 ? (
        <EmptyState message="No exercises match that search." />
      ) : null}

      {active.map(renderRow)}

      {archived.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Archived</Text>
          <Text style={styles.hint}>
            Hidden from the exercise picker. Routines and logged history are
            unaffected.
          </Text>
          {archived.map(renderRow)}
        </>
      )}

      <ModalSheet
        visible={creating}
        onClose={() => setCreating(false)}
        title="New exercise"
      >
        <View style={styles.formBody}>
          <ExerciseForm
            submitLabel="Create"
            onSubmit={createExercise}
            onCancel={() => setCreating(false)}
          />
        </View>
      </ModalSheet>

      <ModalSheet
        visible={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name}` : "Edit"}
      >
        <View style={styles.formBody}>
          {editing && (
            <ExerciseForm
              key={editing.id}
              initial={editing}
              submitLabel="Save"
              onSubmit={updateExercise}
              onCancel={() => setEditing(null)}
            />
          )}
        </View>
      </ModalSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  main: { flex: 1 },
  name: { ...typography.body, fontWeight: "600" },
  muscle: { ...typography.muted, marginTop: 2 },
  chipRow: { flexDirection: "row", marginTop: spacing.sm },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  pressed: { opacity: 0.6 },
  dimmed: { opacity: 0.55 },
  sectionTitle: { ...typography.heading, marginTop: spacing.lg },
  hint: { ...typography.muted },
  formBody: { paddingBottom: spacing.xl },
});
