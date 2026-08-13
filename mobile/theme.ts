export const colors = {
  background: "#F7F7FB",
  surface: "#FFFFFF",
  primary: "#4F46E5",
  primaryMuted: "#EEF2FF",
  accent: "#FF7A59",
  accentMuted: "#FFF1ED",
  text: "#111827",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  danger: "#EF4444",
  dangerMuted: "#FEF2F2",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
};

export const typography = {
  title: { fontSize: 26, fontWeight: "700" as const, color: colors.text },
  heading: { fontSize: 18, fontWeight: "700" as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
  label: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase" as const,
  },
};
