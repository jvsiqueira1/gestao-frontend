"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import Button from "./Button";
import ThemeToggle from "./ThemeToggle";
import { hasValidAccess } from "../lib/api";
import { Menu, X, BarChart3, DollarSign, ArrowDownLeft, Tag, User } from "lucide-react";
import { useColorTheme } from '../context/ColorThemeContext';

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { href: "/rendas", label: "Rendas", icon: <DollarSign className="w-4 h-4" /> },
  { href: "/despesas", label: "Despesas", icon: <ArrowDownLeft className="w-4 h-4" /> },
  { href: "/categorias", label: "Categorias", icon: <Tag className="w-4 h-4" /> },
  { href: "/perfil", label: "Perfil", icon: <User className="w-4 h-4" /> },
];

export default function NavBar() {
  const { user, logout } = useAuth();
  const rawPathname = usePathname();
  const pathname = rawPathname ?? "/";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const hasAccess = hasValidAccess(user);
  const { colorTheme } = useColorTheme ? useColorTheme() : { colorTheme: 'default' };
  
  if (!user || pathname === '/') return null;
  
  return (
    <nav
      className="bg-background text-foreground shadow-sm border-b border-border sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">$</span>
              </div>
              <span className={colorTheme === 'default'
                ? 'text-xl font-bold text-gray-900 dark:text-white'
                : 'text-xl font-bold text-foreground'}>
                Gestão de Gastos
              </span>
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
                    className={colorTheme === 'default'
                      ? `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors select-none
                          ${pathname === item.href
                            ? 'bg-cyan-100 text-cyan-700 border border-cyan-300 dark:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-700'
                            : 'text-gray-500 hover:text-cyan-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-cyan-400 dark:hover:bg-gray-800'}
                          ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`
                      : `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors select-none ${
                          pathname === item.href
                            ? 'bg-primary/10 text-primary border border-primary'
                            : 'text-muted-foreground hover:text-primary hover:bg-muted'} ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
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
              className={colorTheme === 'default'
                ? 'p-2 rounded-lg text-gray-500 hover:text-cyan-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-cyan-400 dark:hover:bg-gray-800 transition-colors'
                : 'p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors'}
            >
              <span className="text-xl">{isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</span>
            </button>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Olá,</span>
              <span className="font-medium text-foreground">{user.name || user.email}</span>
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
          <div className={colorTheme === 'default'
            ? 'md:hidden border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-black'
            : 'md:hidden border-t border-border bg-background'}>
            <div className="py-4 space-y-2">
              {navItems.map(item => {
                const isProfile = item.href === "/perfil";
                const isDisabled = !hasAccess && !isProfile;
                return (
                  <span key={item.href} title={isDisabled ? "Regularize sua assinatura para acessar" : undefined}>
                    <Link
                      href={isDisabled ? String(pathname ?? "/") : item.href}
                      tabIndex={isDisabled ? -1 : 0}
                      aria-disabled={isDisabled}
                      onClick={e => {
                        if (isDisabled) e.preventDefault();
                        setIsMobileMenuOpen(false);
                      }}
                      className={colorTheme === 'default'
                        ? `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors select-none
                            ${pathname === item.href
                              ? 'bg-cyan-100 text-cyan-700 border border-cyan-300 dark:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-700'
                              : 'text-gray-500 hover:text-cyan-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-cyan-400 dark:hover:bg-gray-800'}
                            ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`
                        : `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors select-none ${
                            pathname === item.href
                              ? 'bg-primary/10 text-primary border border-primary'
                              : 'text-muted-foreground hover:text-primary hover:bg-muted'} ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
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
                  <div className="text-sm text-muted-foreground">
                    Olá, <span className="font-medium text-foreground">{user.name || user.email}</span>
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