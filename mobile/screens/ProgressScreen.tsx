import { useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "../api/client";
import type {
  ConsistencyStats,
  ExerciseProgress,
  WeightEntry,
} from "../api/types";
import type { ProgressStackParamList } from "../navigation/ProgressStack";
import BarChart, { type Bar } from "../components/BarChart";
import {
  ScreenContainer,
  Card,
  Chip,
  PrimaryButton,
  TextField,
  SectionLabel,
  StatTile,
  EmptyState,
} from "../components/ui";
import { colors, spacing, typography } from "../theme";

const BODY_WEIGHT_POINTS = 8;

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDelta(delta: number, unit: string): string {
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) return `No change`;
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded)} ${unit}`;
}

type Props = NativeStackScreenProps<ProgressStackParamList, "ProgressHome">;

export default function ProgressScreen({ navigation }: Props) {
  const api = useApi();

  const [consistency, setConsistency] = useState<ConsistencyStats | null>(null);
  const [progress, setProgress] = useState<ExerciseProgress[]>([]);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weight, setWeight] = useState("");

  const load = useCallback(async () => {
    const [c, p, w] = await Promise.all([
      api.get<ConsistencyStats>("/api/stats/consistency"),
      api.get<ExerciseProgress[]>("/api/stats/exercise-progress"),
      api.get<WeightEntry[]>("/api/weightentries"),
    ]);
    setConsistency(c);
    setProgress(p);
    setEntries(w);
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const logWeight = async () => {
    if (!weight) return;
    await api.post("/api/weightentries", { weightKg: parseFloat(weight) });
    setWeight("");
    load();
  };

  const weeklyBars: Bar[] =
    consistency?.weeklyCounts.map((w) => ({
      label: shortDate(w.weekStart),
      value: w.count,
    })) ?? [];

  // Entries arrive newest-first; the chart reads left-to-right oldest-first.
  const recentEntries = entries.slice(0, BODY_WEIGHT_POINTS);
  const bodyWeightBars: Bar[] = [...recentEntries]
    .reverse()
    .map((e) => ({ label: shortDate(e.loggedOn), value: e.weightKg }));

  const latestWeight = entries[0];
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const priorEntry = entries.find((e) => new Date(e.loggedOn) <= monthAgo);
  const bodyWeightDelta =
    latestWeight && priorEntry ? latestWeight.weightKg - priorEntry.weightKg : null;

  return (
    <ScreenContainer scroll>
      <Text style={styles.firstSectionTitle}>Consistency</Text>
      <Card>
        <View style={styles.statRow}>
          <StatTile
            value={consistency?.workoutsThisWeek ?? 0}
            label="This week"
            tone={colors.primary}
          />
          <StatTile
            value={consistency?.weekStreak ?? 0}
            label="Week streak"
            tone={consistency?.weekStreak ? colors.success : undefined}
          />
          <StatTile value={consistency?.totalWorkouts ?? 0} label="Total workouts" />
        </View>
        {consistency && consistency.totalWorkouts === 0 ? (
          <Text style={styles.hint}>
            Log a workout from the Workout tab and it'll show up here.
          </Text>
        ) : (
          <BarChart data={weeklyBars} baseline="zero" />
        )}
      </Card>

      <Text style={styles.sectionTitle}>Strength progression</Text>
      {progress.length === 0 ? (
        <EmptyState message="Nothing logged yet. Your lifts will trend here once you do." />
      ) : (
        progress.map((item) => {
          const up = item.delta > 0;
          const flat = item.delta === 0;
          return (
            <Card
              key={item.exerciseId}
              onPress={() =>
                navigation.navigate("ExerciseHistory", {
                  exerciseId: item.exerciseId,
                  exerciseName: item.exerciseName,
                })
              }
            >
              <View style={styles.progressHeader}>
                <View style={styles.progressMain}>
                  <Text style={styles.exerciseName}>{item.exerciseName}</Text>
                  <Text style={styles.exerciseMeta}>{item.targetMuscle}</Text>
                </View>
                <Chip
                  label={formatDelta(item.delta, item.unit)}
                  tone={flat ? "neutral" : up ? "success" : "accent"}
                />
              </View>
              <View style={styles.progressValues}>
                <Text style={styles.progressNumbers}>
                  {item.first} → <Text style={styles.latest}>{item.latest}</Text>{" "}
                  {item.unit}
                </Text>
                <View style={styles.sessionsRow}>
                  <Text style={styles.exerciseMeta}>
                    {item.sessionCount}{" "}
                    {item.sessionCount === 1 ? "session" : "sessions"}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textMuted}
                  />
                </View>
              </View>
            </Card>
          );
        })
      )}

      <Text style={styles.sectionTitle}>Body weight</Text>
      <Card>
        {latestWeight ? (
          <>
            <View style={styles.bodyHeader}>
              <View>
                <Text style={styles.currentWeight}>{latestWeight.weightKg} kg</Text>
                <Text style={styles.exerciseMeta}>
                  as of {latestWeight.loggedOn}
                </Text>
              </View>
              {bodyWeightDelta !== null ? (
                <Chip
                  label={`${formatDelta(bodyWeightDelta, "kg")} in 30d`}
                  tone="neutral"
                />
              ) : null}
            </View>
            <BarChart
              data={bodyWeightBars}
              baseline="min"
              accent={colors.accent}
              formatValue={(v) => String(Math.round(v * 10) / 10)}
            />
          </>
        ) : (
          <View style={styles.bodyEmpty}>
            <Ionicons name="scale-outline" size={26} color={colors.textMuted} />
            <Text style={styles.hint}>
              No entries yet. Log your weight below to start tracking.
            </Text>
          </View>
        )}
      </Card>

      <Card>
        <SectionLabel>Log today's weight (kg)</SectionLabel>
        {/* Button sits beside the input, not under it - iOS scrolls a focused
            field into view but not whatever follows it, and a decimal-pad
            keyboard has no return key to submit with. */}
        <View style={styles.logRow}>
          <TextField
            style={styles.logInput}
            keyboardType="decimal-pad"
            placeholder="e.g. 82.5"
            value={weight}
            onChangeText={setWeight}
          />
          <PrimaryButton title="Log" onPress={logWeight} disabled={!weight} />
        </View>
      </Card>

      {recentEntries.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent entries</Text>
          {recentEntries.map((entry) => (
            <Card key={entry.id}>
              <View style={styles.entryRow}>
                <Text style={styles.entryDate}>{entry.loggedOn}</Text>
                <Text style={styles.entryWeight}>{entry.weightKg} kg</Text>
              </View>
            </Card>
          ))}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  firstSectionTitle: { ...typography.heading },
  sectionTitle: { ...typography.heading, marginTop: spacing.lg },
  sessionsRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  statRow: { flexDirection: "row" },
  hint: { ...typography.muted, marginTop: spacing.md, textAlign: "center" },
  progressHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  progressMain: { flex: 1 },
  exerciseName: { ...typography.body, fontWeight: "700" },
  exerciseMeta: { ...typography.muted, marginTop: 2 },
  progressValues: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  progressNumbers: { ...typography.body, fontSize: 16, color: colors.textMuted },
  latest: { fontWeight: "800", color: colors.text },
  bodyHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  currentWeight: { fontSize: 30, fontWeight: "800", color: colors.text },
  bodyEmpty: { alignItems: "center", paddingVertical: spacing.md },
  logRow: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  logInput: { flex: 1 },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryDate: { ...typography.muted, fontSize: 14 },
  entryWeight: { ...typography.body, fontWeight: "700" },
});
