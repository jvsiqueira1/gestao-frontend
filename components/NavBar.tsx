"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import Button from "./Button";
import ThemeToggle from "./ThemeToggle";
import { hasValidAccess } from "../lib/api";
import { Menu, X, BarChart3, DollarSign, ArrowDownLeft, Tag, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { href: "/rendas", label: "Rendas", icon: <DollarSign className="w-4 h-4" /> },
  { href: "/despesas", label: "Despesas", icon: <ArrowDownLeft className="w-4 h-4" /> },
  { href: "/categorias", label: "Categorias", icon: <Tag className="w-4 h-4" /> },
  { href: "/perfil", label: "Perfil", icon: <User className="w-4 h-4" /> },
];

export default function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Usar a função utilitária para verificar acesso
  const hasAccess = hasValidAccess(user);
  
  // Não mostrar a navbar na página inicial se o usuário estiver logado
  if (!user || pathname === '/') return null;
  
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-neutral-dark/10 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">$</span>
              </div>
              <span className="text-xl font-bold text-primary-700 dark:text-primary-400">Gestão de Gastos</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map(item => {
              const isProfile = item.href === "/perfil";
              const isDisabled = !hasAccess && !isProfile;
              return (
                <span key={item.href} title={isDisabled ? "Regularize sua assinatura para acessar" : undefined}>
                  <Link
                    href={isDisabled ? pathname : item.href}
                    tabIndex={isDisabled ? -1 : 0}
                    aria-disabled={isDisabled}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors select-none ${
                      pathname === item.href
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-700"
                        : "text-text-secondary dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-light dark:hover:bg-gray-800"
                    } ${isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                    onClick={e => {
                      if (isDisabled) e.preventDefault();
                    }}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </span>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-text-secondary dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-light dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-xl">{isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</span>
            </button>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <div className="hidden sm:flex items-center space-x-2 text-sm text-text-secondary dark:text-gray-300">
              <span>Olá,</span>
              <span className="font-medium text-text-primary dark:text-white">{user.name || user.email}</span>
            </div>
            <span className="hidden md:inline-block">
              <Button
                variant="text"
                onClick={logout}
                className="text-feedback-error hover:text-feedback-error/80"
              >
                Sair
              </Button>
            </span>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-dark/10 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="py-4 space-y-2">
              {navItems.map(item => {
                const isProfile = item.href === "/perfil";
                const isDisabled = !hasAccess && !isProfile;
                return (
                  <span key={item.href} title={isDisabled ? "Regularize sua assinatura para acessar" : undefined}>
                    <Link
                      href={isDisabled ? pathname : item.href}
                      tabIndex={isDisabled ? -1 : 0}
                      aria-disabled={isDisabled}
                      onClick={e => {
                        if (isDisabled) e.preventDefault();
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors select-none ${
                        pathname === item.href
                          ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-700"
                          : "text-text-secondary dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-light dark:hover:bg-gray-800"
                      } ${isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </span>
                );
              })}
              
              {/* User info in mobile menu */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-text-secondary dark:text-gray-300">
                    Olá, {user.name || user.email}
                  </div>
                  <Button
                    variant="text"
                    onClick={logout}
                    className="text-feedback-error hover:text-feedback-error/80 text-sm"
                  >
                    Sair
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 