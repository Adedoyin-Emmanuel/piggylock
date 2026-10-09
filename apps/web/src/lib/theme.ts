import { useSyncExternalStore } from "react";

export type ThemePreference = "system" | "light" | "dark";

// Keep in sync with the inline script in index.html. The "lockbox:" prefix is
// the app's former name, kept so saved preferences survive the rename.
const STORAGE_KEY = "lockbox:theme";
const media = window.matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set<() => void>();

function read(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

let preference = read();

function apply() {
  const dark = preference === "dark" || (preference === "system" && media.matches);
  // Switch instantly: without this, every element's colour transition fades
  // at once and the page flickers through half-themed states.
  const freeze = document.createElement("style");
  freeze.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(freeze);
  document.documentElement.classList.toggle("dark", dark);
  void getComputedStyle(document.body).color; // force the style flush
  requestAnimationFrame(() => freeze.remove());
}

// Follow OS changes live while on "system".
media.addEventListener("change", () => {
  if (preference === "system") apply();
  listeners.forEach((l) => l());
});

export function setThemePreference(next: ThemePreference) {
  preference = next;
  try {
    if (next === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage unavailable: the choice still applies for this session.
  }
  apply();
  listeners.forEach((l) => l());
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => preference,
  );
}

apply();
