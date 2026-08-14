import { useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useApi } from "../api/client";
import type { ExerciseHistory } from "../api/types";
import type { ProgressStackParamList } from "../navigation/ProgressStack";
import { useUnit } from "../UnitContext";
import { toDisplayWeight, unitLabel } from "../units";
import BarChart, { type Bar } from "../components/BarChart";
import {
  ScreenContainer,
  Card,
  Chip,
  SectionLabel,
  StatTile,
  EmptyState,
} from "../components/ui";
import { colors, spacing, typography } from "../theme";

// Enough to show a trend without the bars collapsing into slivers.
const MAX_POINTS = 12;

type Props = NativeStackScreenProps<ProgressStackParamList, "ExerciseHistory">;

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export default function ExerciseHistoryScreen({ route }: Props) {
  const { exerciseId } = route.params;
  const api = useApi();
  const { unit: prefUnit } = useUnit();
  const [history, setHistory] = useState<ExerciseHistory | null>(null);
  const [missing, setMissing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api
        .get<ExerciseHistory>(`/api/stats/exercise-progress/${exerciseId}`)
        .then(setHistory)
        .catch(() => setMissing(true));
    }, [api, exerciseId]),
  );

  if (missing) {
    return (
      <ScreenContainer>
        <EmptyState message="No history for this exercise yet." />
      </ScreenContainer>
    );
  }

  if (!history) {
    return (
      <ScreenContainer>
        <EmptyState message="Loading…" />
      </ScreenContainer>
    );
  }

  const { points } = history;

  // Only weight-metric exercises convert; reps and seconds pass straight
  // through with the unit the API reported.
  const isWeight = history.metric === "Weight";
  const toDisplay = (value: number) =>
    isWeight ? toDisplayWeight(value, prefUnit) : value;
  const unit = isWeight ? unitLabel(prefUnit) : history.unit;

  const values = points.map((p) => p.value);
  const first = toDisplay(values[0]);
  const latest = toDisplay(values[values.length - 1]);
  const best = toDisplay(Math.max(...values));
  const delta = latest - first;

  // Newest points matter most; keep the tail when there's a long history.
  const charted = points.slice(-MAX_POINTS);
  const bars: Bar[] = charted.map((p) => ({
    label: shortDate(p.completedAt),
    value: toDisplay(p.value),
  }));

  return (
    <ScreenContainer scroll>
      <Card>
        <View style={styles.headerRow}>
          <View style={styles.headerMain}>
            <Text style={styles.muscle}>{history.targetMuscle}</Text>
            <Text style={styles.metric}>
              Tracking {history.metric.toLowerCase()} ({unit})
            </Text>
          </View>
          <Chip
            label={
              delta === 0
                ? "No change"
                : `${delta > 0 ? "+" : "−"}${Math.abs(round(delta))} ${unit}`
            }
            tone={delta === 0 ? "neutral" : delta > 0 ? "success" : "accent"}
          />
        </View>

        <View style={styles.statRow}>
          <StatTile value={`${round(first)}`} label={`First (${unit})`} />
          <StatTile
            value={`${round(latest)}`}
            label={`Latest (${unit})`}
            tone={colors.primary}
          />
          <StatTile
            value={`${round(best)}`}
            label={`Best (${unit})`}
            tone={colors.success}
          />
        </View>
      </Card>

      <Card>
        <SectionLabel>Over time</SectionLabel>
        {points.length < 2 ? (
          <Text style={styles.hint}>
            Only one session logged so far — log this exercise again to see a
            trend.
          </Text>
        ) : (
          // Scaled between the low and high of the window rather than from
          // zero: a 5 kg move on a heavy lift would be invisible otherwise.
          // Every bar carries its own value so the numbers stay honest.
          <BarChart
            data={bars}
            baseline="min"
            formatValue={(v) => String(round(v))}
          />
        )}
      </Card>

      <Text style={styles.sectionTitle}>
        {points.length} {points.length === 1 ? "session" : "sessions"}
      </Text>

      {[...points].reverse().map((p, i) => (
        <Card key={`${p.completedAt}-${i}`}>
          <View style={styles.logRow}>
            <View>
              <Text style={styles.logDate}>
                {new Date(p.completedAt).toLocaleDateString()}
              </Text>
              <Text style={styles.logSets}>
                {p.sets} {p.sets === 1 ? "set" : "sets"}
              </Text>
            </View>
            <Text style={styles.logValue}>
              {round(toDisplay(p.value))} {unit}
            </Text>
          </View>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerMain: { flex: 1 },
  muscle: { ...typography.heading, fontSize: 16 },
  metric: { ...typography.muted, marginTop: 2 },
  statRow: { flexDirection: "row", marginTop: spacing.lg },
  hint: { ...typography.muted, marginTop: spacing.md },
  sectionTitle: { ...typography.heading, marginTop: spacing.lg },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logDate: { ...typography.body, fontWeight: "600" },
  logSets: { ...typography.muted, marginTop: 2 },
  logValue: { ...typography.body, fontWeight: "800", fontSize: 16 },
});
