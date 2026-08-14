import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProgressScreen from "../screens/ProgressScreen";
import ExerciseHistoryScreen from "../screens/ExerciseHistoryScreen";
import { colors } from "../theme";

export type ProgressStackParamList = {
  ProgressHome: undefined;
  ExerciseHistory: { exerciseId: string; exerciseName: string };
};

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export default function ProgressStack() {
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
        name="ProgressHome"
        component={ProgressScreen}
        options={{ title: "Progress" }}
      />
      <Stack.Screen
        name="ExerciseHistory"
        component={ExerciseHistoryScreen}
        options={({ route }) => ({ title: route.params.exerciseName })}
      />
    </Stack.Navigator>
  );
}
