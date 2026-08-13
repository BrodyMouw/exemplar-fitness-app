import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PlansListScreen from "../screens/PlansListScreen";
import PlanDetailScreen from "../screens/PlanDetailScreen";
import { colors } from "../theme";

export type PlansStackParamList = {
  PlansList: undefined;
  PlanDetail: { planId: string };
};

const Stack = createNativeStackNavigator<PlansStackParamList>();

export default function PlansStack() {
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
        name="PlansList"
        component={PlansListScreen}
        options={{ title: "Plans" }}
      />
      <Stack.Screen
        name="PlanDetail"
        component={PlanDetailScreen}
        options={{ title: "Plan" }}
      />
    </Stack.Navigator>
  );
}
