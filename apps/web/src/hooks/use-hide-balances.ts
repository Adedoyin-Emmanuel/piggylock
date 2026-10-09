import { useSyncExternalStore } from "react";

// Remembered on this device, like the eye toggle in banking apps.
const STORAGE_KEY = "piggylock:hide-balances";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

let hidden = read();

function setHidden(next: boolean) {
  hidden = next;
  try {
    if (next) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: still applies for this session.
  }
  listeners.forEach((l) => l());
}

/** Whether amounts on the home screen are masked, plus a toggle. */
export function useHideBalances() {
  const value = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => hidden,
  );
  return { hidden: value, toggle: () => setHidden(!value) };
}
