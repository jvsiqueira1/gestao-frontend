"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

const PUBLIC_PATHS = new Set(["/login", "/esqueci-senha", "/trocar-senha"]);

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Carregando…</div>;
  }

  const isPublic = PUBLIC_PATHS.has(pathname);
  if (!user || isPublic) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
