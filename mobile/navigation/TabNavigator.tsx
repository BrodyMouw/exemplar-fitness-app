import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeScreen from "../screens/HomeScreen";
import PlansStack, { type PlansStackParamList } from "./PlansStack";
import WorkoutStack, { type WorkoutStackParamList } from "./WorkoutStack";
import WeightScreen from "../screens/WeightScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { colors, radii } from "../theme";

export type TabParamList = {
  Home: undefined;
  Plans: NavigatorScreenParams<PlansStackParamList>;
  Workout: NavigatorScreenParams<WorkoutStackParamList>;
  Weight: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<keyof TabParamList, { focused: IconName; unfocused: IconName }> = {
  Home: { focused: "home", unfocused: "home-outline" },
  Plans: { focused: "list", unfocused: "list-outline" },
  Workout: { focused: "barbell", unfocused: "barbell-outline" },
  Weight: { focused: "stats-chart", unfocused: "stats-chart-outline" },
  Profile: { focused: "person-circle", unfocused: "person-circle-outline" },
};

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarItemStyle: { paddingTop: 8, paddingBottom: 6 },
        tabBarStyle: {
          position: "absolute",
          left: 20,
          right: 20,
          bottom: insets.bottom + 4,
          height: 76,
          borderRadius: radii.lg + 8,
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icon = ICONS[route.name];
          return (
            <Ionicons
              name={focused ? icon.focused : icon.unfocused}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Plans" component={PlansStack} />
      <Tab.Screen name="Workout" component={WorkoutStack} />
      <Tab.Screen
        name="Weight"
        component={WeightScreen}
        options={{ tabBarLabel: "Weight" }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
