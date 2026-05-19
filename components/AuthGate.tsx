"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const PUBLIC_PATHS = new Set(["/login", "/esqueci-senha", "/trocar-senha"]);

export default function AuthGate() {
  const { user, loading } = useAuth();
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.has(pathname);
    if (!user && !isPublic) {
      router.replace("/login");
    } else if (user && (pathname === "/" || pathname === "/login")) {
      router.replace("/dashboard");
    }
  }, [user, loading, pathname, router]);

  return null;
}
