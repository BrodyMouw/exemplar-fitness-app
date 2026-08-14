import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, radii, typography } from "../theme";

const CHART_HEIGHT = 96;
const MIN_BAR_FRACTION = 0.06;

export type Bar = { label: string; value: number };

export default function BarChart({
  data,
  // "zero" scales from 0, so the absolute number is what reads - right for
  // counts. "min" scales between the low and high of the window, which is the
  // only way small variation (82.5 vs 83.0 kg) is visible at all.
  baseline = "zero",
  accent = colors.primary,
  formatValue,
}: {
  data: Bar[];
  baseline?: "zero" | "min";
  accent?: string;
  formatValue?: (value: number) => string;
}) {
  if (data.length === 0) return null;

  const values = data.map((d) => d.value);
  const high = Math.max(...values);
  const low = baseline === "min" ? Math.min(...values) : 0;
  const span = high - low;

  const fractionFor = (value: number) => {
    // Everything equal (or a single point) has no shape to show - draw a
    // consistent mid-height bar instead of dividing by zero.
    if (span <= 0) return high > 0 ? 0.5 : MIN_BAR_FRACTION;
    return Math.max(MIN_BAR_FRACTION, (value - low) / span);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.plot}>
        {data.map((bar, i) => (
          <View key={`${bar.label}-${i}`} style={styles.column}>
            <Text style={styles.value} numberOfLines={1}>
              {bar.value > 0 || baseline === "min"
                ? (formatValue?.(bar.value) ?? String(bar.value))
                : ""}
            </Text>
            <View
              style={[
                styles.bar,
                {
                  height: CHART_HEIGHT * fractionFor(bar.value),
                  backgroundColor: bar.value > 0 ? accent : colors.border,
                },
              ]}
            />
            <Text style={styles.label} numberOfLines={1}>
              {bar.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  plot: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  column: { flex: 1, alignItems: "center" },
  bar: {
    width: "100%",
    maxWidth: 28,
    borderRadius: radii.sm,
    marginTop: spacing.xs,
  },
  value: { ...typography.muted, fontSize: 10, fontWeight: "600" },
  label: { ...typography.muted, fontSize: 10, marginTop: spacing.xs },
});
