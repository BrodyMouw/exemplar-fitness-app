import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser, useClerk } from "@clerk/expo";
import { ScreenContainer, Card, SecondaryButton } from "../components/ui";
import { colors, spacing, radii, typography } from "../theme";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();

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

      <SecondaryButton title="Sign out" tone="danger" onPress={() => signOut()} />
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
});
