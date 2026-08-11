import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import axios from "axios";
import { useAuth } from "@clerk/expo";
import { API_BASE } from "../config";
import type { PlansStackParamList } from "../navigation/PlansStack";

type WorkoutPlan = {
  id: string;
  name: string;
  description?: string;
};

type Props = NativeStackScreenProps<PlansStackParamList, "PlansList">;

export default function PlansListScreen({ navigation }: Props) {
  const { getToken } = useAuth();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const authHeaders = async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  const loadPlans = async () => {
    const res = await axios.get<WorkoutPlan[]>(`${API_BASE}/api/workoutplans`, {
      headers: await authHeaders(),
    });
    setPlans(res.data);
  };

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, []),
  );

  const createPlan = async () => {
    if (!name) return;
    await axios.post(
      `${API_BASE}/api/workoutplans`,
      { name, description: description || null },
      { headers: await authHeaders() },
    );
    setName("");
    setDescription("");
    loadPlans();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout plans</Text>
      <TextInput
        style={styles.input}
        placeholder="Plan name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Description (optional)"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
      />
      <Button title="New plan" onPress={createPlan} />
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate("PlanDetail", { planId: item.id })}
          >
            <Text style={styles.rowTitle}>{item.name}</Text>
            {item.description && (
              <Text style={styles.rowSubtitle}>{item.description}</Text>
            )}
          </Pressable>
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 24, backgroundColor: "#fff" },
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
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rowTitle: { fontSize: 16, fontWeight: "600", color: "#000" },
  rowSubtitle: { fontSize: 13, color: "#888", marginTop: 2 },
});
