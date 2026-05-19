"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "../context/AuthContext";

const PUBLIC_PATHS = new Set(["/login", "/esqueci-senha", "/trocar-senha"]);

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: "var(--muted)" }}>
        Carregando…
      </div>
    );
  }

  const isPublic = PUBLIC_PATHS.has(pathname);
  if (!user || isPublic) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="main-inner">{children}</main>
      </div>
    </div>
  );
}
