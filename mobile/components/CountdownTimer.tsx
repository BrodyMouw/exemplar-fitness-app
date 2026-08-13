import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { PrimaryButton, SecondaryButton } from "./ui";
import { colors, spacing, radii, typography } from "../theme";

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function CountdownTimer({
  targetSeconds,
  onElapsed,
}: {
  targetSeconds: number;
  // Fired with however many seconds were actually worked, so the timer
  // feeds the log instead of sitting beside it.
  onElapsed: (seconds: number) => void;
}) {
  const [remaining, setRemaining] = useState(targetSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopInterval = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Re-seed whenever the prescription changes (i.e. a different exercise).
  useEffect(() => {
    stopInterval();
    setRunning(false);
    setRemaining(targetSeconds);
  }, [targetSeconds]);

  useEffect(() => stopInterval, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return stopInterval;
  }, [running]);

  // Completion is handled here rather than inside the setState updater above,
  // so the side effect can't fire twice under StrictMode's double-invocation.
  useEffect(() => {
    if (running && remaining === 0) {
      setRunning(false);
      stopInterval();
      onElapsed(targetSeconds);
    }
  }, [running, remaining, targetSeconds, onElapsed]);

  const pause = () => {
    setRunning(false);
    stopInterval();
    onElapsed(targetSeconds - remaining);
  };

  const reset = () => {
    setRunning(false);
    stopInterval();
    setRemaining(targetSeconds);
  };

  const done = remaining === 0;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.clock, done && styles.clockDone]}>
        {formatClock(remaining)}
      </Text>
      <View style={styles.buttonRow}>
        {running ? (
          <SecondaryButton title="Pause" onPress={pause} style={styles.flexButton} />
        ) : (
          <PrimaryButton
            title={done ? "Done" : remaining < targetSeconds ? "Resume" : "Start"}
            onPress={() => setRunning(true)}
            disabled={done}
            style={styles.flexButton}
          />
        )}
        <SecondaryButton title="Reset" onPress={reset} style={styles.flexButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  clock: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  clockDone: { color: colors.success },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    alignSelf: "stretch",
  },
  flexButton: { flex: 1 },
});
