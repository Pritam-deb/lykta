"use client";

import { useTheme } from "./ThemeProvider";

type Theme = "light" | "dark" | "system";

const CYCLE: Theme[] = ["system", "light", "dark"];

const LABELS: Record<Theme, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const ICONS: Record<Theme, string> = {
  system: "⊙",
  light: "☀",
  dark: "☾",
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  function cycle() {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length] as Theme;
    setTheme(next);
  }

  return (
    <button
      onClick={cycle}
      title={`Theme: ${LABELS[theme]} — click to cycle`}
      className="fixed right-4 top-4 z-50 flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-100"
    >
      <span>{ICONS[theme]}</span>
      <span>{LABELS[theme]}</span>
    </button>
  );
}
