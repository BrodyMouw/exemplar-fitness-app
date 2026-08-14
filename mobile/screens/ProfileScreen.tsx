import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser, useClerk } from "@clerk/expo";
import { useUnit } from "../UnitContext";
import { ScreenContainer, Card, SecondaryButton, SelectPill } from "../components/ui";
import { colors, spacing, radii, typography } from "../theme";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { unit, setUnit } = useUnit();

  const email = user?.primaryEmailAddress?.emailAddress;
  const displayName = user?.fullName ?? email?.split("@")[0] ?? "Athlete";

  return (
    <ScreenContainer scroll style={styles.content}>
      <Card style={styles.headerCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={30} color={colors.primary} />
        </View>
        <Text style={styles.name}>{displayName}</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}
      </Card>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <Card>
        <View style={styles.prefRow}>
          <View style={styles.prefMain}>
            <Text style={styles.prefLabel}>Weight units</Text>
            <Text style={styles.prefHint}>
              Used everywhere weights are shown or entered.
            </Text>
          </View>
          <View style={styles.prefChoices}>
            <SelectPill
              label="kg"
              selected={unit === "Kg"}
              onPress={() => setUnit("Kg")}
            />
            <SelectPill
              label="lb"
              selected={unit === "Lb"}
              onPress={() => setUnit("Lb")}
            />
          </View>
        </View>
      </Card>

      <SecondaryButton
        title="Sign out"
        tone="danger"
        onPress={() => signOut()}
        style={styles.signOut}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xxl + spacing.xl },
  headerCard: { alignItems: "center", paddingVertical: spacing.xl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  name: { ...typography.heading, fontSize: 20 },
  email: { ...typography.muted, marginTop: spacing.xs },
  sectionTitle: { ...typography.heading, marginTop: spacing.lg },
  prefRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  prefMain: { flex: 1 },
  prefLabel: { ...typography.body, fontWeight: "600" },
  prefHint: { ...typography.muted, marginTop: 2 },
  prefChoices: { flexDirection: "row", gap: spacing.sm },
  signOut: { marginTop: spacing.lg },
});
