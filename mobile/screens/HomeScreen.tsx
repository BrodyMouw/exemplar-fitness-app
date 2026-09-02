import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useUser } from "@clerk/expo";
import { useApi } from "../api/client";
import type { WorkoutPlan } from "../api/types";
import type { TabParamList } from "../navigation/TabNavigator";
import {
  ScreenContainer,
  Card,
  PrimaryButton,
  SecondaryButton,
  SelectPill,
  TextField,
  SectionLabel,
  showError,
} from "../components/ui";
import { spacing, typography } from "../theme";

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export default function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { user } = useUser();
  const api = useApi();

  const [step, setStep] = useState<"details" | "days">("details");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const firstName =
    user?.firstName ?? user?.primaryEmailAddress?.emailAddress?.split("@")[0];

  const reset = () => {
    setStep("details");
    setName("");
    setDescription("");
    setDaysPerWeek(null);
  };

  const createPlan = async () => {
    if (!name.trim() || !daysPerWeek) return;
    setSaving(true);
    try {
      const plan = await api.post<WorkoutPlan>("/api/workoutplans", {
        name: name.trim(),
        description: description.trim() || null,
        daysPerWeek,
      });
      reset();
      navigation.navigate("Plans", {
        screen: "PlanDetail",
        params: { planId: plan.id },
      });
    } catch (err) {
      showError(err, "Couldn't create this plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer scroll style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {firstName ? `Hey, ${firstName}` : "Welcome"}
        </Text>
        <Text style={styles.subgreeting}>Ready to build something?</Text>
      </View>

      <Card>
        {step === "details" ? (
          <>
            <Text style={styles.cardTitle}>New workout plan</Text>
            <Text style={styles.cardSubtitle}>
              Name it first — we'll set up your training days next.
            </Text>

            <SectionLabel>Name</SectionLabel>
            <TextField
              placeholder="e.g. Push Pull Legs"
              value={name}
              onChangeText={setName}
            />

            <SectionLabel>Description</SectionLabel>
            <TextField
              placeholder="Optional"
              value={description}
              onChangeText={setDescription}
            />

            <PrimaryButton
              title="Create plan"
              onPress={() => setStep("days")}
              disabled={!name.trim()}
              style={styles.cta}
            />
          </>
        ) : (
          <>
            <Text style={styles.cardTitle}>How many days a week?</Text>
            <Text style={styles.cardSubtitle}>
              We'll create a routine for each day, ready to fill in.
            </Text>

            <View style={styles.dayGrid}>
              {DAY_OPTIONS.map((day) => (
                <SelectPill
                  key={day}
                  label={String(day)}
                  selected={daysPerWeek === day}
                  onPress={() => setDaysPerWeek(day)}
                />
              ))}
            </View>

            <View style={styles.buttonRow}>
              <SecondaryButton
                title="Back"
                onPress={() => setStep("details")}
                style={styles.flexButton}
              />
              <PrimaryButton
                title={saving ? "Creating…" : "Create"}
                onPress={createPlan}
                disabled={!daysPerWeek || saving}
                style={styles.flexButton}
              />
            </View>
          </>
        )}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xxl + spacing.xl },
  header: { marginBottom: spacing.sm },
  greeting: { ...typography.title },
  subgreeting: {
    ...typography.muted,
    marginTop: spacing.xs,
    fontSize: 15,
  },
  cardTitle: { ...typography.heading },
  cardSubtitle: {
    ...typography.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cta: { marginTop: spacing.lg },
  buttonRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  flexButton: { flex: 1 },
});
