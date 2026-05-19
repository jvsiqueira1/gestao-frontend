"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  SquaresFour,
  ArrowUp,
  ArrowDown,
  Repeat,
  Tag,
  Target,
  User,
  Sliders,
  SignOut,
  List,
  X,
  type Icon as IconType,
} from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  href: string;
  label: string;
  icon: IconType;
  group: "main" | "movimentos" | "config";
  badge?: string;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour, group: "main" },
  { href: "/rendas", label: "Rendas", icon: ArrowUp, group: "movimentos" },
  { href: "/rendas/fixas", label: "Rendas fixas", icon: Repeat, group: "movimentos" },
  { href: "/despesas", label: "Despesas", icon: ArrowDown, group: "movimentos" },
  { href: "/despesas/fixas", label: "Despesas fixas", icon: Repeat, group: "movimentos" },
  { href: "/categorias", label: "Categorias", icon: Tag, group: "config" },
  { href: "/perfil", label: "Perfil", icon: User, group: "config" },
  { href: "/ajustes", label: "Ajustes", icon: Sliders, group: "config" },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "/";
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;
  if (["/login", "/esqueci-senha", "/trocar-senha"].includes(pathname)) return null;

  const initial = (user.name?.[0] || user.email[0] || "?").toUpperCase();

  const renderItem = (item: NavItem, onClick?: () => void) => {
    const Icon = item.icon;
    const active =
      pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClick}
        className={`sb-item${active ? " is-active" : ""}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 10px",
          borderRadius: 8,
          fontSize: 13,
          color: active ? "var(--fg)" : "var(--fg-soft)",
          fontWeight: 500,
          position: "relative",
          background: active ? "var(--surface)" : "transparent",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        {active && (
          <span
            aria-hidden
            style={{
              content: '""',
              position: "absolute",
              left: -4,
              top: 8,
              bottom: 8,
              width: 2.5,
              background: "var(--accent)",
              borderRadius: 2,
            }}
          />
        )}
        <Icon size={16} weight="regular" style={{ opacity: 0.85, flexShrink: 0 }} />
        <span>{item.label}</span>
        {item.badge && (
          <span
            className="ml-auto"
            style={{
              fontSize: 10.5,
              padding: "1px 6px",
              borderRadius: 999,
              background: "var(--accent-soft)",
              color: "var(--accent-ink)",
              fontWeight: 600,
            }}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const groups = ["main", "movimentos", "config"] as const;
  const groupLabels: Record<typeof groups[number], string> = {
    main: "Visão geral",
    movimentos: "Movimentos",
    config: "Configurações",
  };

  const Content = ({ onClick }: { onClick?: () => void }) => (
    <>
      <div className="flex items-center gap-2.5" style={{ padding: "6px 8px 18px" }}>
        <div
          className="grid place-items-center"
          style={{
            width: 30,
            height: 30,
            background: "var(--fg)",
            color: "var(--bg)",
            borderRadius: 8,
            fontFamily: "var(--font-display-stack)",
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: "-0.05em",
          }}
        >
          G
        </div>
        <div className="flex flex-col" style={{ lineHeight: 1.1 }}>
          <b style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.01em" }}>Gestão</b>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>finanças pessoais</span>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g} style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 10.5,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
              padding: "0 10px 8px",
            }}
          >
            {groupLabels[g]}
          </div>
          <nav className="flex flex-col gap-px">{NAV.filter((n) => n.group === g).map((n) => renderItem(n, onClick))}</nav>
        </div>
      ))}

      <div
        className="mt-auto pt-3.5 border-t"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <div className="flex items-center gap-2.5" style={{ padding: "6px 8px" }}>
          <div
            className="grid place-items-center"
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              background: "var(--accent-soft)",
              color: "var(--accent-ink)",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0" style={{ lineHeight: 1.2 }}>
            <b style={{ fontSize: 12.5, fontWeight: 600, display: "block" }} className="truncate">
              {user.name}
            </b>
            <span
              style={{ fontSize: 11, color: "var(--muted)", display: "block" }}
              className="truncate"
            >
              {user.email}
            </span>
          </div>
          <button onClick={logout} aria-label="Sair" className="btn btn-ghost btn-icon btn-sm">
            <SignOut size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header
        className="lg:hidden sticky top-0 z-40 flex items-center justify-between"
        style={{
          height: 56,
          padding: "0 16px",
          borderBottom: "1px solid var(--border-soft)",
          background: "var(--bg)",
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <div
            className="grid place-items-center"
            style={{
              width: 28,
              height: 28,
              background: "var(--fg)",
              color: "var(--bg)",
              borderRadius: 8,
              fontFamily: "var(--font-display-stack)",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            G
          </div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Gestão</span>
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
          className="btn btn-ghost btn-icon"
        >
          {mobileOpen ? <X size={18} /> : <List size={18} />}
        </button>
      </header>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-x-0 z-30"
          style={{
            top: 56,
            bottom: 0,
            background: "var(--bg-elev)",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          <Content onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col shrink-0"
        style={{
          width: 240,
          background: "var(--bg-elev)",
          borderRight: "1px solid var(--border)",
          padding: "18px 14px",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <Content />
      </aside>
    </>
  );
}
