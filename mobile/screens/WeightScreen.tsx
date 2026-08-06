import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from "react-native";
import axios from "axios";

// Replace with your LAN IP, or 10.0.2.2 for Android emulator
const API_BASE = "http://192.168.0.202:5002";

type WeightEntry = {
  id: string;
  weightKg: number;
  loggedOn: string;
  note?: string;
};

export default function WeightScreen() {
  const [weight, setWeight] = useState("");
  const [entries, setEntries] = useState<WeightEntry[]>([]);

  const loadEntries = async () => {
    const res = await axios.get<WeightEntry[]>(`${API_BASE}/api/weightentries`);
    setEntries(res.data);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const logWeight = async () => {
    if (!weight) return;
    await axios.post(`${API_BASE}/api/weightentries`, {
      weightKg: parseFloat(weight),
    });
    setWeight("");
    loadEntries();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log your weight</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="Weight in kg"
        value={weight}
        onChangeText={setWeight}
      />
      <Button title="Log weight" onPress={logWeight} />
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.entry}>
            {item.loggedOn}: {item.weightKg} kg
          </Text>
        )}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  list: { marginTop: 24 },
  entry: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
