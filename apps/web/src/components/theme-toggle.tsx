import { Monitor, Moon, Sun } from "lucide-react";
import { setThemePreference, useThemePreference, type ThemePreference } from "../lib/theme";
import { Button } from "./ui";

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};
const ICON = { system: Monitor, light: Sun, dark: Moon };
const LABEL = { system: "System theme", light: "Light theme", dark: "Dark theme" };

/** Cycles System → Light → Dark. Defaults to System. */
export function ThemeToggle() {
  const preference = useThemePreference();
  const Icon = ICON[preference];
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setThemePreference(NEXT[preference])}
      aria-label={`${LABEL[preference]}. Switch to ${LABEL[NEXT[preference]].toLowerCase()}`}
      title={LABEL[preference]}
    >
      <Icon className="size-5" />
    </Button>
  );
}
