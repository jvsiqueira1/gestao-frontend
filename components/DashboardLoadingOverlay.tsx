"use client";
import { useLoading } from "../context/LoadingContext";
import LoadingSpinner from "./LoadingSpinner";

export default function DashboardLoadingOverlay() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl border border-gray-200 dark:border-gray-700">
        <LoadingSpinner 
          size="lg" 
          text="Carregando dados..." 
          className="min-w-[200px]"
        />
      </div>
    </div>
  );
} 