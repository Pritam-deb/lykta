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
      style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 9999,
      display: "flex", alignItems: "center", gap: 6,
      borderRadius: 100, padding: "6px 12px",
      background: "var(--bg-2)", border: "1px solid var(--border-2)",
      fontSize: 12, fontWeight: 500, color: "var(--text-2)",
      cursor: "pointer", boxShadow: "0 4px 12px var(--shadow)",
      fontFamily: "var(--font-dm-sans), sans-serif",
    }}
    >
      <span>{ICONS[theme]}</span>
      <span>{LABELS[theme]}</span>
    </button>
  );
}
