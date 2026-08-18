import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../screens/ProfileScreen";
import ManageExercisesScreen from "../screens/ManageExercisesScreen";
import { colors } from "../theme";

export type ProfileStackParamList = {
  ProfileHome: undefined;
  ManageExercises: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
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
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
      <Stack.Screen
        name="ManageExercises"
        component={ManageExercisesScreen}
        options={{ title: "Exercises" }}
      />
    </Stack.Navigator>
  );
}
