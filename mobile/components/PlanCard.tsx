import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { WorkoutPlanSummary } from "../api/types";
import { Card } from "./ui";
import { accentForId, colors, spacing, radii, typography } from "../theme";

export default function PlanCard({
  plan,
  onPress,
}: {
  plan: WorkoutPlanSummary;
  onPress: () => void;
}) {
  const accent = accentForId(plan.id);
  const dayLabel = plan.routineCount === 1 ? "1 day" : `${plan.routineCount} days`;
  const exerciseLabel =
    plan.exerciseCount === 1 ? "1 exercise" : `${plan.exerciseCount} exercises`;

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={[styles.iconTile, { backgroundColor: accent.bg }]}>
        <Ionicons name="barbell" size={22} color={accent.fg} />
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {plan.name}
        </Text>
        {plan.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {plan.description}
          </Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        {plan.routineCount === 0 ? (
          <Text style={styles.empty}>No days yet</Text>
        ) : (
          <>
            <Text style={[styles.days, { color: accent.fg }]}>{dayLabel}</Text>
            <Text style={styles.meta}>{exerciseLabel}</Text>
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    // Fixed share of the row rather than flex:1, so a lone card on an odd
    // last row stays half-width instead of stretching across.
    width: "48%",
    minHeight: 168,
    padding: spacing.lg,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radii.sm + 4,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, marginTop: spacing.md },
  name: { ...typography.body, fontWeight: "700", fontSize: 16 },
  description: { ...typography.muted, marginTop: spacing.xs, fontSize: 12 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  days: { fontSize: 13, fontWeight: "700" },
  meta: { ...typography.muted, fontSize: 12, marginTop: 1 },
  empty: { ...typography.muted, fontSize: 12, fontStyle: "italic" },
});
