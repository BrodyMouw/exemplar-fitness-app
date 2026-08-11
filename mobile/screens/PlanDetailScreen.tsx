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

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  order: number;
};

type WorkoutPlan = {
  id: string;
  name: string;
  description?: string;
  exercises: Exercise[];
};

type Props = NativeStackScreenProps<PlansStackParamList, "PlanDetail">;

export default function PlanDetailScreen({ route, navigation }: Props) {
  const { planId } = route.params;
  const { getToken } = useAuth();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");

  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");

  const authHeaders = async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  const loadPlan = async () => {
    const res = await axios.get<WorkoutPlan>(
      `${API_BASE}/api/workoutplans/${planId}`,
      { headers: await authHeaders() },
    );
    setPlan(res.data);
    setPlanName(res.data.name);
    setPlanDescription(res.data.description ?? "");
  };

  useFocusEffect(
    useCallback(() => {
      loadPlan();
    }, [planId]),
  );

  const savePlanEdits = async () => {
    await axios.put(
      `${API_BASE}/api/workoutplans/${planId}`,
      { name: planName, description: planDescription || null },
      { headers: await authHeaders() },
    );
    setEditingPlan(false);
    loadPlan();
  };

  const deletePlan = async () => {
    await axios.delete(`${API_BASE}/api/workoutplans/${planId}`, {
      headers: await authHeaders(),
    });
    navigation.goBack();
  };

  const addExercise = async () => {
    if (!exerciseName || !sets || !reps) return;
    await axios.post(
      `${API_BASE}/api/workoutplans/${planId}/exercises`,
      { name: exerciseName, sets: parseInt(sets, 10), reps: parseInt(reps, 10) },
      { headers: await authHeaders() },
    );
    setExerciseName("");
    setSets("");
    setReps("");
    loadPlan();
  };

  const deleteExercise = async (id: string) => {
    await axios.delete(`${API_BASE}/api/exercises/${id}`, {
      headers: await authHeaders(),
    });
    loadPlan();
  };

  if (!plan) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {editingPlan ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Plan name"
            placeholderTextColor="#888"
            value={planName}
            onChangeText={setPlanName}
          />
          <TextInput
            style={styles.input}
            placeholder="Description (optional)"
            placeholderTextColor="#888"
            value={planDescription}
            onChangeText={setPlanDescription}
          />
          <Button title="Save" onPress={savePlanEdits} />
        </>
      ) : (
        <>
          <Text style={styles.title}>{plan.name}</Text>
          {plan.description && (
            <Text style={styles.subtitle}>{plan.description}</Text>
          )}
          <Button title="Edit plan" onPress={() => setEditingPlan(true)} />
        </>
      )}

      <View style={styles.spacer} />
      <Text style={styles.sectionTitle}>Exercises</Text>

      <TextInput
        style={styles.input}
        placeholder="Exercise name"
        placeholderTextColor="#888"
        value={exerciseName}
        onChangeText={setExerciseName}
      />
      <TextInput
        style={styles.input}
        placeholder="Sets"
        placeholderTextColor="#888"
        keyboardType="number-pad"
        value={sets}
        onChangeText={setSets}
      />
      <TextInput
        style={styles.input}
        placeholder="Reps"
        placeholderTextColor="#888"
        keyboardType="number-pad"
        value={reps}
        onChangeText={setReps}
      />
      <Button title="Add exercise" onPress={addExercise} />

      <FlatList
        data={plan.exercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.rowSubtitle}>
                {item.sets} sets x {item.reps} reps
              </Text>
            </View>
            <Button title="Delete" color="#d32f2f" onPress={() => deleteExercise(item.id)} />
          </View>
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.spacer} />
      <Button title="Delete plan" color="#d32f2f" onPress={deletePlan} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "600", color: "#000" },
  subtitle: { fontSize: 14, color: "#888", marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 12 },
  spacer: { height: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: "#000",
    backgroundColor: "#fff",
  },
  list: { marginTop: 12 },
  listContent: { paddingBottom: 100 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rowTitle: { fontSize: 16, fontWeight: "600", color: "#000" },
  rowSubtitle: { fontSize: 13, color: "#888", marginTop: 2 },
});
