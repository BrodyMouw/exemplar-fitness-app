import { ClerkProvider, Show } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import WeightScreen from "./screens/WeightScreen";
import AuthScreen from "./screens/AuthScreen";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to mobile/.env");
}

export default function App() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <Show when="signed-in">
        <WeightScreen />
      </Show>
      <Show when="signed-out">
        <AuthScreen />
      </Show>
    </ClerkProvider>
  );
}
