import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { describeError } from "./errors";

// Runs a screen's data load when the screen focuses, and remembers whether it
// worked.
//
// Screens used to call `load()` bare inside useFocusEffect. A rejected request
// left every piece of state at its initial value, so the screen fell through to
// its "nothing here yet" empty state and confidently reported no plans, no
// history, no stats - indistinguishable from a working app with an empty
// account. Loading through this keeps the failure visible and retryable.
//
// `load` must be reference-stable (a useCallback), the same requirement
// useFocusEffect already imposes.
export function useLoad(load: () => Promise<unknown>) {
  const [error, setError] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);

  const run = useCallback(async () => {
    try {
      await load();
      setError(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSettled(true);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      run();
    }, [run]),
  );

  // `settled` is "we have an answer", not "we have data" - screens that key
  // their loading state off a null model need it to tell a first load apart
  // from a load that came back empty.
  return { error, settled, reload: run };
}
