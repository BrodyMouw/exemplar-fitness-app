import { useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useApi } from "../api/client";
import type { WorkoutPlan } from "../api/types";
import type { PlansStackParamList } from "../navigation/PlansStack";
import { Card, EmptyState } from "../components/ui";
import { colors, spacing, radii, typography } from "../theme";

type Props = NativeStackScreenProps<PlansStackParamList, "PlansList">;

export default function PlansListScreen({ navigation }: Props) {
  const api = useApi();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);

  useFocusEffect(
    useCallback(() => {
      api.get<WorkoutPlan[]>("/api/workoutplans").then(setPlans);
    }, [api]),
  );

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={plans}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <EmptyState message="No plans yet. Create one from the Home tab." />
      }
      renderItem={({ item }) => (
        <Card
          style={styles.card}
          onPress={() => navigation.navigate("PlanDetail", { planId: item.id })}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </Card>
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
  card: { borderRadius: radii.md },
  cardRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  cardMain: { flex: 1 },
  cardTitle: { ...typography.heading },
  cardDescription: { ...typography.muted, marginTop: spacing.xs },
});
