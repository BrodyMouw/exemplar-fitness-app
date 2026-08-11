import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeScreen from "../screens/HomeScreen";
import CommunityScreen from "../screens/CommunityScreen";
import PlansStack from "./PlansStack";
import WeightScreen from "../screens/WeightScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, { focused: IconName; unfocused: IconName }> = {
  Home: { focused: "home", unfocused: "home-outline" },
  Community: { focused: "people", unfocused: "people-outline" },
  Plans: { focused: "barbell", unfocused: "barbell-outline" },
  Weight: { focused: "stats-chart", unfocused: "stats-chart-outline" },
  Profile: { focused: "person-circle", unfocused: "person-circle-outline" },
};

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#0a7ea4",
        tabBarInactiveTintColor: "#999",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarItemStyle: { paddingTop: 8, paddingBottom: 6 },
        tabBarStyle: {
          position: "absolute",
          left: 20,
          right: 20,
          bottom: insets.bottom + 4,
          height: 76,
          borderRadius: 28,
          backgroundColor: "#fff",
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: "#000",
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
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Plans" component={PlansStack} />
      <Tab.Screen
        name="Weight"
        component={WeightScreen}
        options={{ tabBarLabel: "Weight tracking" }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
