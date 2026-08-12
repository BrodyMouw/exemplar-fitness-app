import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PlansListScreen from "../screens/PlansListScreen";
import PlanDetailScreen from "../screens/PlanDetailScreen";
import ExerciseLogScreen from "../screens/ExerciseLogScreen";

export type PlansStackParamList = {
  PlansList: undefined;
  PlanDetail: { planId: string };
  ExerciseLog: { exerciseId: string; exerciseName: string };
};

const Stack = createNativeStackNavigator<PlansStackParamList>();

export default function PlansStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PlansList"
        component={PlansListScreen}
        options={{ title: "Plans" }}
      />
      <Stack.Screen
        name="PlanDetail"
        component={PlanDetailScreen}
        options={{ title: "Plan" }}
      />
      <Stack.Screen
        name="ExerciseLog"
        component={ExerciseLogScreen}
        options={({ route }) => ({ title: route.params.exerciseName })}
      />
    </Stack.Navigator>
  );
}
