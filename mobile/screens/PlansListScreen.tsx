import { useState, useCallback } from "react";
import { FlatList, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useApi } from "../api/client";
import { useLoad } from "../api/useLoad";
import type { WorkoutPlanSummary } from "../api/types";
import type { PlansStackParamList } from "../navigation/PlansStack";
import PlanCard from "../components/PlanCard";
import { EmptyState, ErrorState, ErrorBanner } from "../components/ui";
import { colors, spacing } from "../theme";

type Props = NativeStackScreenProps<PlansStackParamList, "PlansList">;

export default function PlansListScreen({ navigation }: Props) {
  const api = useApi();
  const [plans, setPlans] = useState<WorkoutPlanSummary[]>([]);

  const load = useCallback(async () => {
    setPlans(await api.get<WorkoutPlanSummary[]>("/api/workoutplans"));
  }, [api]);

  const { error, reload } = useLoad(load);

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.row}
      numColumns={2}
      data={plans}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        error && plans.length > 0 ? (
          <ErrorBanner message={error} onRetry={reload} />
        ) : null
      }
      ListEmptyComponent={
        error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <EmptyState message="No plans yet. Create one from the Home tab." />
        )
      }
      renderItem={({ item }) => (
        <PlanCard
          plan={item}
          onPress={() => navigation.navigate("PlanDetail", { planId: item.id })}
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
});
