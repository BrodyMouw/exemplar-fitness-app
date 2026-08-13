import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WorkoutPlansListScreen from "../screens/WorkoutPlansListScreen";
import RoutinePreviewScreen from "../screens/RoutinePreviewScreen";
import RunnerScreen from "../screens/RunnerScreen";
import { colors } from "../theme";

export type WorkoutStackParamList = {
  WorkoutPlansList: undefined;
  RoutinePreview: { planId: string };
  Runner: { routineId: string; routineName: string };
};

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

export default function WorkoutStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: "700" },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="WorkoutPlansList"
        component={WorkoutPlansListScreen}
        options={{ title: "Workout" }}
      />
      <Stack.Screen
        name="RoutinePreview"
        component={RoutinePreviewScreen}
        options={{ title: "Choose a day" }}
      />
      <Stack.Screen
        name="Runner"
        component={RunnerScreen}
        options={({ route }) => ({ title: route.params.routineName })}
      />
    </Stack.Navigator>
  );
}
