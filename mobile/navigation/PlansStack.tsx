import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PlansListScreen from "../screens/PlansListScreen";
import PlanDetailScreen from "../screens/PlanDetailScreen";

export type PlansStackParamList = {
  PlansList: undefined;
  PlanDetail: { planId: string };
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
    </Stack.Navigator>
  );
}
