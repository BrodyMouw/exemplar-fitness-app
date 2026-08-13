import * as React from "react";
import { useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useSignIn, useSignUp, useSSO } from "@clerk/expo";
import { View, Text, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  ScreenContainer,
  Card,
  PrimaryButton,
  SecondaryButton,
  TextField,
  SectionLabel,
} from "../components/ui";
import { colors, spacing, radii, typography } from "../theme";

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
      <ScreenContainer style={styles.centered}>
        <Card>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>We sent a code to {emailAddress}.</Text>
          <SectionLabel>Verification code</SectionLabel>
          <TextField
            keyboardType="numeric"
            placeholder="123456"
            value={code}
            onChangeText={setCode}
          />
          {signUpErrors.fields.code && (
            <Text style={styles.error}>{signUpErrors.fields.code.message}</Text>
          )}
          <PrimaryButton
            title="Verify"
            onPress={handleVerify}
            disabled={signUpStatus === "fetching"}
            style={styles.cta}
          />
          <SecondaryButton
            title="Send a new code"
            onPress={() => signUp.verifications.sendEmailCode()}
            style={styles.secondaryCta}
          />
        </Card>
      </ScreenContainer>
    );
  }

  if (mode === "sign-in" && signIn.status === "needs_client_trust") {
    return (
      <ScreenContainer style={styles.centered}>
        <Card>
          <Text style={styles.title}>Verify your account</Text>
          <SectionLabel>Verification code</SectionLabel>
          <TextField
            keyboardType="numeric"
            placeholder="123456"
            value={code}
            onChangeText={setCode}
          />
          <PrimaryButton
            title="Verify"
            style={styles.cta}
            onPress={async () => {
              await signIn.mfa.verifyEmailCode({ code });
              if (signIn.status === "complete") {
                await signIn.finalize({ navigate: () => {} });
              }
            }}
          />
        </Card>
      </ScreenContainer>
    );
  }

  const activeErrors = mode === "sign-in" ? signInErrors : signUpErrors;
  const emailError =
    mode === "sign-in"
      ? signInErrors.fields.identifier
      : signUpErrors.fields.emailAddress;
  const passwordError = activeErrors.fields.password;

  const busy = (mode === "sign-in" ? signInStatus : signUpStatus) === "fetching";

  return (
    <ScreenContainer scroll style={styles.centered}>
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Ionicons name="barbell" size={28} color={colors.primary} />
        </View>
        <Text style={styles.brandTitle}>Exemplar</Text>
        <Text style={styles.brandSubtitle}>Train with intent.</Text>
      </View>

      <Card>
        <Text style={styles.title}>
          {mode === "sign-in" ? "Welcome back" : "Create your account"}
        </Text>

        <SectionLabel>Email</SectionLabel>
        <TextField
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          value={emailAddress}
          onChangeText={setEmailAddress}
        />
        {emailError && <Text style={styles.error}>{emailError.message}</Text>}

        <SectionLabel>Password</SectionLabel>
        <TextField
          secureTextEntry
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
        />
        {passwordError && <Text style={styles.error}>{passwordError.message}</Text>}

        <PrimaryButton
          title={mode === "sign-in" ? "Sign in" : "Sign up"}
          onPress={mode === "sign-in" ? handleSignIn : handleSignUp}
          disabled={!emailAddress || !password || busy}
          style={styles.cta}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <SecondaryButton
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
      </Card>

      {/* Required for sign-up flows. Clerk's bot protection is enabled by default. */}
      <View nativeID="clerk-captcha" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: { justifyContent: "center", flexGrow: 1, paddingTop: spacing.xxl },
  brand: { alignItems: "center", marginBottom: spacing.xl },
  brandMark: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  brandTitle: { ...typography.title },
  brandSubtitle: { ...typography.muted, marginTop: spacing.xs },
  title: { ...typography.heading, marginBottom: spacing.sm },
  subtitle: { ...typography.muted, marginBottom: spacing.sm },
  cta: { marginTop: spacing.lg },
  secondaryCta: { marginTop: spacing.md },
  error: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.muted, fontSize: 12 },
  link: {
    marginTop: spacing.lg,
    color: colors.primary,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
  },
});
