import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";
import { useAuth } from "@clerk/expo";
import { API_BASE } from "../config";
import type { PlansStackParamList } from "../navigation/PlansStack";

type WorkoutLog = {
  id: string;
  completedAt: string;
  actualSets: number;
  actualReps: number;
  weightUsedKg?: number;
};

type Props = NativeStackScreenProps<PlansStackParamList, "ExerciseLog">;

export default function ExerciseLogScreen({ route }: Props) {
  const { exerciseId } = route.params;
  const { getToken } = useAuth();

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [actualSets, setActualSets] = useState("");
  const [actualReps, setActualReps] = useState("");
  const [weightUsedKg, setWeightUsedKg] = useState("");

  const authHeaders = async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  const loadLogs = async () => {
    const res = await axios.get<WorkoutLog[]>(
      `${API_BASE}/api/exercises/${exerciseId}/logs`,
      { headers: await authHeaders() },
    );
    setLogs(res.data);
  };

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [exerciseId]),
  );

  const logSet = async () => {
    if (!actualSets || !actualReps) return;
    await axios.post(
      `${API_BASE}/api/exercises/${exerciseId}/logs`,
      {
        actualSets: parseInt(actualSets, 10),
        actualReps: parseInt(actualReps, 10),
        weightUsedKg: weightUsedKg ? parseFloat(weightUsedKg) : null,
      },
      { headers: await authHeaders() },
    );
    setActualSets("");
    setActualReps("");
    setWeightUsedKg("");
    loadLogs();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log a set</Text>
      <TextInput
        style={styles.input}
        placeholder="Sets"
        placeholderTextColor="#888"
        keyboardType="number-pad"
        value={actualSets}
        onChangeText={setActualSets}
      />
      <TextInput
        style={styles.input}
        placeholder="Reps"
        placeholderTextColor="#888"
        keyboardType="number-pad"
        value={actualReps}
        onChangeText={setActualReps}
      />
      <TextInput
        style={styles.input}
        placeholder="Weight used (kg, optional)"
        placeholderTextColor="#888"
        keyboardType="decimal-pad"
        value={weightUsedKg}
        onChangeText={setWeightUsedKg}
      />
      <Button title="Log set" onPress={logSet} />

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.entry}>
            {new Date(item.completedAt).toLocaleDateString()}: {item.actualSets} x{" "}
            {item.actualReps}
            {item.weightUsedKg != null ? ` @ ${item.weightUsedKg} kg` : ""}
          </Text>
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 16, color: "#000" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: "#000",
    backgroundColor: "#fff",
  },
  list: { marginTop: 24 },
  listContent: { paddingBottom: 100 },
  entry: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    color: "#000",
  },
});
