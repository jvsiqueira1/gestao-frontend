"use client";
import { Moon, Sun } from "@phosphor-icons/react";
import { useAppearance } from "../context/AppearanceContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useAppearance();
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Alternar para modo ${theme === "light" ? "escuro" : "claro"}`}
      className="btn btn-ghost btn-icon"
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
