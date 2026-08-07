import * as React from "react";
import { useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useSignIn, useSignUp, useSSO } from "@clerk/expo";
import {
  View,
  Text,
  TextInput,
  Button,
  Platform,
  StyleSheet,
} from "react-native";

// Preloads the browser for Android to reduce OAuth load time.
function useWarmUpBrowser() {
  React.useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  useWarmUpBrowser();

  const { signIn, errors: signInErrors, fetchStatus: signInStatus } = useSignIn();
  const { signUp, errors: signUpErrors, fetchStatus: signUpStatus } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignIn = async () => {
    const { error } = await signIn.password({ emailAddress, password });
    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }
    if (signIn.status === "complete") {
      await signIn.finalize({ navigate: () => {} });
    } else {
      console.error("Sign-in not complete:", signIn.status);
    }
  };

  const handleSignUp = async () => {
    const { error } = await signUp.password({ emailAddress, password });
    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }
    await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === "complete") {
      await signUp.finalize({ navigate: () => {} });
    } else {
      console.error("Sign-up not complete:", signUp.status);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: "fitnessapp",
          path: "sso-callback",
        }),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId, navigate: () => {} });
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setGoogleLoading(false);
    }
  };

  const awaitingEmailCode =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  if (mode === "sign-up" && awaitingEmailCode) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Verify your email</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Verification code"
          placeholderTextColor="#888"
          value={code}
          onChangeText={setCode}
        />
        {signUpErrors.fields.code && (
          <Text style={styles.error}>{signUpErrors.fields.code.message}</Text>
        )}
        <Button
          title="Verify"
          onPress={handleVerify}
          disabled={signUpStatus === "fetching"}
        />
      </View>
    );
  }

  if (mode === "sign-in" && signIn.status === "needs_client_trust") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Verify your account</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Verification code"
          placeholderTextColor="#888"
          value={code}
          onChangeText={setCode}
        />
        <Button
          title="Verify"
          onPress={async () => {
            await signIn.mfa.verifyEmailCode({ code });
            if (signIn.status === "complete") {
              await signIn.finalize({ navigate: () => {} });
            }
          }}
        />
      </View>
    );
  }

  const activeErrors = mode === "sign-in" ? signInErrors : signUpErrors;
  const emailError =
    mode === "sign-in"
      ? signInErrors.fields.identifier
      : signUpErrors.fields.emailAddress;
  const passwordError = activeErrors.fields.password;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === "sign-in" ? "Sign in" : "Sign up"}</Text>

      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor="#888"
        value={emailAddress}
        onChangeText={setEmailAddress}
      />
      {emailError && <Text style={styles.error}>{emailError.message}</Text>}
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
      />
      {passwordError && <Text style={styles.error}>{passwordError.message}</Text>}

      <Button
        title={mode === "sign-in" ? "Sign in" : "Sign up"}
        onPress={mode === "sign-in" ? handleSignIn : handleSignUp}
        disabled={
          !emailAddress ||
          !password ||
          (mode === "sign-in" ? signInStatus : signUpStatus) === "fetching"
        }
      />

      <View style={styles.spacer} />
      <Button
        title={googleLoading ? "Opening…" : "Continue with Google"}
        onPress={handleGoogle}
        disabled={googleLoading}
      />

      <Text
        style={styles.link}
        onPress={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
      >
        {mode === "sign-in"
          ? "Don't have an account? Sign up"
          : "Already have an account? Sign in"}
      </Text>

      {/* Required for sign-up flows. Clerk's bot protection is enabled by default. */}
      <View nativeID="clerk-captcha" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 80, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 16, color: "#000" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: "#000",
    backgroundColor: "#fff",
  },
  spacer: { height: 12 },
  error: { color: "#d32f2f", fontSize: 12, marginTop: -8, marginBottom: 8 },
  link: { marginTop: 16, color: "#0a7ea4", textAlign: "center" },
});
