"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "pwa-install-dismissed";

export default function InstallPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setVisible(false);
    setPrompt(null);
  };

  if (!visible || !prompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-lg border bg-card text-card-foreground shadow-lg p-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center shrink-0">
        <Download className="w-4 h-4 text-background" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Instalar app</p>
        <p className="text-xs text-muted-foreground mb-2">Acesso rápido offline na home screen.</p>
        <div className="flex gap-2">
          <button onClick={install} className="text-xs px-2.5 py-1 rounded-md bg-foreground text-background hover:opacity-90">
            Instalar
          </button>
          <button onClick={dismiss} className="text-xs px-2.5 py-1 rounded-md hover:bg-secondary text-muted-foreground">
            Agora não
          </button>
        </div>
      </div>
      <button onClick={dismiss} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
