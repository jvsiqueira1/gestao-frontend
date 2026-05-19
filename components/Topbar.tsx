"use client";
import { usePathname } from "next/navigation";
import { Sun, Moon, MagnifyingGlass } from "@phosphor-icons/react";
import { useAppearance } from "../context/AppearanceContext";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/despesas": "Despesas",
  "/despesas/fixas": "Despesas fixas",
  "/rendas": "Rendas",
  "/rendas/fixas": "Rendas fixas",
  "/categorias": "Categorias",
  "/perfil": "Perfil",
  "/ajustes": "Ajustes",
};

export default function Topbar() {
  const pathname = usePathname() ?? "/";
  const { theme, toggleTheme } = useAppearance();
  const title = TITLES[pathname] || "";

  return (
    <div
      className="hidden lg:flex items-center justify-between sticky top-0 z-10"
      style={{
        padding: "18px 36px",
        borderBottom: "1px solid var(--border-soft)",
        background: "var(--bg)",
      }}
    >
      <div className="flex items-center gap-3.5">
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Início <span style={{ margin: "0 6px" }}>/</span>
          <b style={{ color: "var(--fg)", fontWeight: 500 }}>{title}</b>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2"
          style={{
            height: 34,
            padding: "0 12px",
            background: "var(--surface)",
            border: "1px solid transparent",
            borderRadius: 8,
            width: 280,
            color: "var(--muted)",
            fontSize: 13,
          }}
        >
          <MagnifyingGlass size={14} />
          <input
            placeholder="Buscar lançamentos…"
            className="w-full bg-transparent outline-none"
            style={{ border: 0, fontSize: 13 }}
          />
          <span className="pill" style={{ fontSize: 10, padding: "1px 6px" }}>⌘K</span>
        </div>
        <button onClick={toggleTheme} aria-label="Tema" className="btn btn-ghost btn-icon">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </div>
  );
}
