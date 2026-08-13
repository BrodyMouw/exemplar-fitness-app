import { useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApi } from "../api/client";
import {
  ScreenContainer,
  Card,
  PrimaryButton,
  TextField,
  SectionLabel,
  EmptyState,
} from "../components/ui";
import { spacing, typography } from "../theme";

type WeightEntry = {
  id: string;
  weightKg: number;
  loggedOn: string;
  note?: string;
};

export default function WeightScreen() {
  const api = useApi();
  const [weight, setWeight] = useState("");
  const [entries, setEntries] = useState<WeightEntry[]>([]);

  const loadEntries = useCallback(async () => {
    setEntries(await api.get<WeightEntry[]>("/api/weightentries"));
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries]),
  );

  const logWeight = async () => {
    if (!weight) return;
    await api.post("/api/weightentries", { weightKg: parseFloat(weight) });
    setWeight("");
    loadEntries();
  };

  return (
    <ScreenContainer scroll style={styles.content}>
      <Text style={styles.title}>Body weight</Text>

      <Card>
        <SectionLabel>Today's weight (kg)</SectionLabel>
        <TextField
          keyboardType="decimal-pad"
          placeholder="e.g. 82.5"
          value={weight}
          onChangeText={setWeight}
        />
        <PrimaryButton
          title="Log weight"
          onPress={logWeight}
          disabled={!weight}
          style={styles.cta}
        />
      </Card>

      <Text style={styles.sectionTitle}>History</Text>

      {entries.length === 0 ? (
        <EmptyState message="No entries yet." />
      ) : (
        entries.map((entry) => (
          <Card key={entry.id}>
            <View style={styles.entryRow}>
              <Text style={styles.entryDate}>{entry.loggedOn}</Text>
              <Text style={styles.entryWeight}>{entry.weightKg} kg</Text>
            </View>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xxl + spacing.xl },
  title: { ...typography.title },
  cta: { marginTop: spacing.lg },
  sectionTitle: { ...typography.heading, marginTop: spacing.lg },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryDate: { ...typography.muted, fontSize: 14 },
  entryWeight: { ...typography.body, fontWeight: "700" },
});
