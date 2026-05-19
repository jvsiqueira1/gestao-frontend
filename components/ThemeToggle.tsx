"use client";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Alternar para modo ${theme === "light" ? "escuro" : "claro"}`}
      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
    >
      {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
