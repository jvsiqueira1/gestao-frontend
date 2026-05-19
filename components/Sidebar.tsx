"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, Tags, User, LogOut, Menu, X, Repeat } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rendas", label: "Rendas", icon: ArrowUpCircle },
  { href: "/rendas/fixas", label: "Rendas fixas", icon: Repeat },
  { href: "/despesas", label: "Despesas", icon: ArrowDownCircle },
  { href: "/despesas/fixas", label: "Despesas fixas", icon: Repeat },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/perfil", label: "Perfil", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "/";
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;
  if (pathname === "/login" || pathname === "/esqueci-senha" || pathname === "/trocar-senha") return null;

  const NavList = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-0.5 px-2 mt-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b bg-background">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
            <span className="text-background text-xs font-semibold">G</span>
          </div>
          <span className="text-sm font-medium">Gastos</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="p-2 rounded-md hover:bg-secondary"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-background/95 backdrop-blur-sm pt-14">
          <NavList onClick={() => setMobileOpen(false)} />
          <div className="px-4 pt-6 mt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">{user.email}</p>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-destructive hover:underline"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r bg-background sticky top-0 h-screen">
        <div className="h-14 px-4 flex items-center gap-2 border-b">
          <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
            <span className="text-background text-xs font-semibold">G</span>
          </div>
          <span className="text-sm font-medium">Gestão de Gastos</span>
        </div>
        <NavList />
        <div className="mt-auto p-3 border-t flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={logout}
              aria-label="Sair"
              className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
