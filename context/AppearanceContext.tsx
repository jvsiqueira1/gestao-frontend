"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Theme = "light" | "dark";
export type Density = "compact" | "regular" | "cozy";
export type AccentKey = "tinta" | "musgo" | "terracota" | "indigo" | "borgonha";

interface Appearance {
  theme: Theme;
  density: Density;
  accent: AccentKey;
}

export const ACCENT_PRESETS: Record<AccentKey, { h: number; c: number; l: string; label: string; hex: string }> = {
  tinta: { h: 240, c: 0.025, l: "20%", label: "Tinta", hex: "#2E3036" },
  musgo: { h: 155, c: 0.085, l: "42%", label: "Musgo", hex: "#3D7B5A" },
  terracota: { h: 35, c: 0.135, l: "55%", label: "Terracota", hex: "#B0522F" },
  indigo: { h: 270, c: 0.12, l: "48%", label: "Índigo", hex: "#5546B4" },
  borgonha: { h: 18, c: 0.13, l: "38%", label: "Borgonha", hex: "#7E2D2A" },
};

const DEFAULTS: Appearance = { theme: "light", density: "compact", accent: "tinta" };
const STORAGE_KEY = "gastos.appearance";

interface Ctx extends Appearance {
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setDensity: (d: Density) => void;
  setAccent: (a: AccentKey) => void;
  reset: () => void;
}

const AppearanceContext = createContext<Ctx | undefined>(undefined);

function readStored(): Appearance {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme === "dark" ? "dark" : "light",
      density: ["compact", "regular", "cozy"].includes(parsed.density) ? parsed.density : DEFAULTS.density,
      accent: parsed.accent in ACCENT_PRESETS ? parsed.accent : DEFAULTS.accent,
    };
  } catch {
    return DEFAULTS;
  }
}

function applyToRoot(appearance: Appearance) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const a = ACCENT_PRESETS[appearance.accent];
  root.style.setProperty("--accent-h", String(a.h));
  root.style.setProperty("--accent-c", String(a.c));
  root.style.setProperty("--accent-l", a.l);
  root.dataset.theme = appearance.theme;
  root.dataset.density = appearance.density;
  if (appearance.theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setAppearance(stored);
    applyToRoot(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyToRoot(appearance);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
    } catch {}
  }, [appearance, mounted]);

  const setTheme = useCallback((theme: Theme) => setAppearance((a) => ({ ...a, theme })), []);
  const toggleTheme = useCallback(
    () => setAppearance((a) => ({ ...a, theme: a.theme === "light" ? "dark" : "light" })),
    []
  );
  const setDensity = useCallback((density: Density) => setAppearance((a) => ({ ...a, density })), []);
  const setAccent = useCallback((accent: AccentKey) => setAppearance((a) => ({ ...a, accent })), []);
  const reset = useCallback(() => setAppearance(DEFAULTS), []);

  const value = useMemo<Ctx>(
    () => ({ ...appearance, setTheme, toggleTheme, setDensity, setAccent, reset }),
    [appearance, setTheme, toggleTheme, setDensity, setAccent, reset]
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used within AppearanceProvider");
  return ctx;
}

// Backwards-compat alias for code still importing useTheme
export const useTheme = () => {
  const { theme, toggleTheme } = useAppearance();
  return { theme, toggleTheme };
};
