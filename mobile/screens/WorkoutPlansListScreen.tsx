import { useState, useCallback } from "react";
import { Text, FlatList, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useApi } from "../api/client";
import type { WorkoutPlanSummary } from "../api/types";
import type { WorkoutStackParamList } from "../navigation/WorkoutStack";
import PlanCard from "../components/PlanCard";
import { EmptyState } from "../components/ui";
import { colors, spacing, typography } from "../theme";

type Props = NativeStackScreenProps<WorkoutStackParamList, "WorkoutPlansList">;

export default function WorkoutPlansListScreen({ navigation }: Props) {
  const api = useApi();
  const [plans, setPlans] = useState<WorkoutPlanSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      api.get<WorkoutPlanSummary[]>("/api/workoutplans").then(setPlans);
    }, [api]),
  );

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.row}
      numColumns={2}
      data={plans}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        plans.length > 0 ? (
          <Text style={styles.prompt}>Which plan are you training today?</Text>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState message="No plans yet. Build one from the Home or Plans tab first." />
      }
      renderItem={({ item }) => (
        <PlanCard
          plan={item}
          onPress={() => navigation.navigate("RoutinePreview", { planId: item.id })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  listContent: {
    padding: spacing.xl,
    paddingBottom: 120,
    gap: spacing.md,
  },
  row: { justifyContent: "space-between" },
  prompt: { ...typography.muted, fontSize: 14, marginBottom: spacing.xs },
});
