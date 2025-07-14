"use client";
import { useAuth } from "../context/AuthContext";
import { usePathname } from "next/navigation";

export default function Footer() {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Não mostrar o footer na página inicial ou se o usuário não estiver logado
  if (!user || pathname === '/') return null;
  
  return (
    <footer className="bg-background text-foreground border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">$</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              Gestão de Gastos <a href="https://www.linkedin.com/in/joaovitorsiqueira1/" target="_blank" className="hover:underline">by João Vitor</a>
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} - Simplificando suas finanças
          </div>
        </div>
      </div>
    </footer>
  );
} 