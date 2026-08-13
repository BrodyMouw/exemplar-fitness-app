import { useState, useEffect, type ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii, shadow, typography } from "../theme";

// Deletes here cascade (a plan takes its routines with it), so they always
// go through a confirmation rather than firing on a single tap.
export function confirmDelete(
  title: string,
  message: string,
  onConfirm: () => void,
) {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onConfirm },
  ]);
}

export function ScreenContainer({
  children,
  scroll = false,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  if (scroll) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.screenContent, style]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.screen, styles.screenContent, style]}>{children}</View>;
}

export function Card({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles.primaryButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  disabled,
  tone = "neutral",
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "neutral" | "danger";
  style?: StyleProp<ViewStyle>;
}) {
  const isDanger = tone === "danger";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles.secondaryButton,
        isDanger && styles.dangerButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[styles.secondaryButtonText, isDanger && styles.dangerButtonText]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  tone = "primary",
}: {
  label: string;
  tone?: "primary" | "accent" | "neutral";
}) {
  const toneStyle =
    tone === "accent"
      ? { bg: colors.accentMuted, fg: colors.accent }
      : tone === "neutral"
        ? { bg: colors.background, fg: colors.textMuted }
        : { bg: colors.primaryMuted, fg: colors.primary };

  return (
    <View style={[styles.chip, { backgroundColor: toneStyle.bg }]}>
      <Text style={[styles.chipText, { color: toneStyle.fg }]}>{label}</Text>
    </View>
  );
}

export function SelectPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectPill,
        selected && styles.selectPillActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.selectPillText, selected && styles.selectPillTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  name,
  onPress,
  color,
  size = 20,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Ionicons name={name} size={size} color={color ?? colors.textMuted} />
    </Pressable>
  );
}

export function ModalSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <IconButton name="close" onPress={onClose} size={22} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.modalBody}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function formatStepperValue(value: number, decimals: number): string {
  return Number(value.toFixed(decimals)).toString();
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  decimals = 0,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
}) {
  const atMin = value <= min;
  const atMax = value >= max;

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(formatStepperValue(value, decimals));

  useEffect(() => {
    if (!editing) setText(formatStepperValue(value, decimals));
  }, [value, decimals, editing]);

  const commit = () => {
    const parsed = parseFloat(text);
    onChange(Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : value);
    setEditing(false);
  };

  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - step))}
        disabled={atMin}
        hitSlop={8}
        style={({ pressed }) => [
          styles.stepperButton,
          atMin && styles.stepperButtonDisabled,
          pressed && !atMin && styles.pressed,
        ]}
      >
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
      </Pressable>

      {editing ? (
        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType={decimals > 0 ? "decimal-pad" : "number-pad"}
          autoFocus
          selectTextOnFocus
          style={styles.stepperInput}
        />
      ) : (
        <Pressable onPress={() => setEditing(true)} hitSlop={8}>
          <Text style={styles.stepperValue}>
            {formatStepperValue(value, decimals)}
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={() => onChange(Math.min(max, value + step))}
        disabled={atMax}
        hitSlop={8}
        style={({ pressed }) => [
          styles.stepperButton,
          atMax && styles.stepperButtonDisabled,
          pressed && !atMax && styles.pressed,
        ]}
      >
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

export function SearchField(props: TextInputProps) {
  return (
    <View style={styles.searchWrap}>
      <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
      <TextInput
        {...props}
        placeholderTextColor={colors.textMuted}
        style={[styles.searchInput, props.style]}
      />
    </View>
  );
}

export function TextField(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textMuted}
      style={[styles.input, props.style]}
    />
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: {
    padding: spacing.xl,
    paddingBottom: 120,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    ...shadow.card,
  },
  pressed: { opacity: 0.75 },
  button: {
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: { backgroundColor: colors.primary },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
  },
  dangerButton: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.dangerMuted,
  },
  dangerButtonText: { color: colors.danger },
  buttonDisabled: { opacity: 0.45 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  chipText: { fontSize: 12, fontWeight: "600" },
  selectPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 48,
    alignItems: "center",
  },
  selectPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectPillText: { fontSize: 14, fontWeight: "600", color: colors.text },
  selectPillTextActive: { color: "#fff" },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  sectionLabel: {
    ...typography.label,
    marginTop: spacing.sm,
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyText: { ...typography.muted },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    // Fixed, not max - a short (e.g. filtered) content list must not let the
    // sheet shrink and sink toward the bottom-anchored keyboard.
    height: "85%",
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.heading },
  modalBody: { flex: 1, paddingHorizontal: spacing.xl },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: { opacity: 0.35 },
  stepperValue: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    minWidth: 52,
    textAlign: "center",
  },
  stepperInput: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.primary,
    minWidth: 64,
    textAlign: "center",
    padding: 0,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 12,
  },
});
