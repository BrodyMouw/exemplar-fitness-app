import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useApi } from "./api/client";
import type { WeightUnit } from "./units";

type UnitContextValue = {
  unit: WeightUnit;
  setUnit: (unit: WeightUnit) => void;
};

// Defaults to Kg so screens can render before the preference loads; the
// fetch below corrects it a moment later.
const UnitContext = createContext<UnitContextValue>({
  unit: "Kg",
  setUnit: () => {},
});

export function useUnit() {
  return useContext(UnitContext);
}

export function UnitProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const [unit, setUnitState] = useState<WeightUnit>("Kg");

  useEffect(() => {
    api
      .get<{ weightUnit: WeightUnit }>("/api/preferences")
      .then((p) => setUnitState(p.weightUnit))
      .catch(() => {
        // Preference is cosmetic - falling back to kg is fine if this fails.
      });
  }, [api]);

  const setUnit = useCallback(
    (next: WeightUnit) => {
      // Applied locally first so the toggle feels instant, then persisted.
      setUnitState(next);
      api.put("/api/preferences", { weightUnit: next }).catch(() => {});
    },
    [api],
  );

  const value = useMemo(() => ({ unit, setUnit }), [unit, setUnit]);

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}
