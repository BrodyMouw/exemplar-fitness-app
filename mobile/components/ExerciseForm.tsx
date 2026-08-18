import { useState } from "react";
import { View, StyleSheet } from "react-native";
import type { Exercise, ExerciseMode, ExerciseWeightType } from "../api/types";
import {
  PrimaryButton,
  SecondaryButton,
  SelectPill,
  TextField,
  SectionLabel,
} from "./ui";
import { spacing } from "../theme";

export type ExerciseDraft = {
  name: string;
  description: string | null;
  mode: ExerciseMode;
  weightType: ExerciseWeightType | null;
  targetMuscle: string;
};

// Shared by the picker's quick-add and the management screen's edit, so the
// rule that timed exercises have no weight type lives in exactly one place.
export default function ExerciseForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Exercise;
  submitLabel: string;
  onSubmit: (draft: ExerciseDraft) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [targetMuscle, setTargetMuscle] = useState(initial?.targetMuscle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [mode, setMode] = useState<ExerciseMode>(initial?.mode ?? "Reps");
  const [weightType, setWeightType] = useState<ExerciseWeightType>(
    initial?.weightType ?? "External",
  );

  const isTimed = mode === "Time";

  return (
    <View>
      <SectionLabel>Name</SectionLabel>
      <TextField
        placeholder="e.g. Cable Fly"
        value={name}
        onChangeText={setName}
      />

      <SectionLabel>Target muscle</SectionLabel>
      <TextField
        placeholder="e.g. Chest"
        value={targetMuscle}
        onChangeText={setTargetMuscle}
      />

      <SectionLabel>Measured in</SectionLabel>
      <View style={styles.pillRow}>
        <SelectPill
          label="Reps"
          selected={mode === "Reps"}
          onPress={() => setMode("Reps")}
        />
        <SelectPill
          label="Time"
          selected={isTimed}
          onPress={() => setMode("Time")}
        />
      </View>

      {!isTimed && (
        <>
          <SectionLabel>Resistance</SectionLabel>
          <View style={styles.pillRow}>
            <SelectPill
              label="Added weight"
              selected={weightType === "External"}
              onPress={() => setWeightType("External")}
            />
            <SelectPill
              label="Bodyweight"
              selected={weightType === "Bodyweight"}
              onPress={() => setWeightType("Bodyweight")}
            />
          </View>
        </>
      )}

      <SectionLabel>Description</SectionLabel>
      <TextField
        placeholder="Optional"
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.buttonRow}>
        <SecondaryButton title="Cancel" onPress={onCancel} style={styles.flexButton} />
        <PrimaryButton
          title={submitLabel}
          disabled={!name.trim() || !targetMuscle.trim()}
          onPress={() =>
            onSubmit({
              name: name.trim(),
              description: description.trim() || null,
              mode,
              weightType: isTimed ? null : weightType,
              targetMuscle: targetMuscle.trim(),
            })
          }
          style={styles.flexButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pillRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  buttonRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  flexButton: { flex: 1 },
});
