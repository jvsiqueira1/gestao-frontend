"use client";
import { useLoading } from "../context/LoadingContext";
import LoadingSpinner from "./LoadingSpinner";

export default function DashboardLoadingOverlay() {
  const { isLoading } = useLoading();
  if (!isLoading) return null;
  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="rounded-lg border bg-card p-6 shadow-lg">
        <LoadingSpinner size="lg" text="Carregando…" />
      </div>
    </div>
  );
}
