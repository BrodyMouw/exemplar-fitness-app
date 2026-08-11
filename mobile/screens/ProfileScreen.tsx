import { View, Text, Button, StyleSheet } from "react-native";
import { useUser, useClerk } from "@clerk/expo";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user?.primaryEmailAddress && (
        <Text style={styles.email}>{user.primaryEmailAddress.emailAddress}</Text>
      )}
      <View style={styles.spacer} />
      <Button title="Sign out" onPress={() => signOut()} color="#999" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { fontSize: 24, fontWeight: "600", color: "#000", marginBottom: 8 },
  email: { fontSize: 14, color: "#888" },
  spacer: { height: 24 },
});
