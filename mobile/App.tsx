import { ClerkProvider, Show } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import TabNavigator from "./navigation/TabNavigator";
import AuthScreen from "./screens/AuthScreen";
import { UnitProvider } from "./UnitContext";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to mobile/.env");
}

export default function App() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <NavigationContainer>
          {/* Inside the signed-in branch: loading the preference needs auth. */}
          <Show when="signed-in">
            <UnitProvider>
              <TabNavigator />
            </UnitProvider>
          </Show>
          <Show when="signed-out">
            <AuthScreen />
          </Show>
        </NavigationContainer>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
