import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "../components/ui";
import { colors, spacing, typography } from "../theme";

export default function WorkoutScreen() {
  return (
    <ScreenContainer style={styles.container}>
      <Ionicons name="barbell-outline" size={40} color={colors.primary} />
      <Text style={styles.title}>Workout</Text>
      <Text style={styles.subtitle}>
        Pick a plan and run through a routine. Coming next.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", gap: spacing.sm },
  title: { ...typography.title, marginTop: spacing.sm },
  subtitle: { ...typography.muted, textAlign: "center", fontSize: 14 },
});
