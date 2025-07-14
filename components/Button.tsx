import React from "react";
import clsx from "clsx";
import { useColorTheme } from '../context/ColorThemeContext';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "text";
  size?: "md" | "lg";
  children: React.ReactNode;
}

export default function Button({
  loading = false,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const { colorTheme } = useColorTheme ? useColorTheme() : { colorTheme: 'default' };
  const base =
    "inline-flex items-center justify-center font-semibold rounded-md transition focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary:
      colorTheme === 'default'
        ? "bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white"
        : "bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground",
    secondary:
      colorTheme === 'default'
        ? "bg-white border border-cyan-500 text-cyan-700 hover:bg-cyan-50 active:bg-cyan-100"
        : "bg-background border border-primary text-primary hover:bg-primary/10 active:bg-primary/20",
    text:
      colorTheme === 'default'
        ? "bg-transparent text-cyan-600 hover:underline px-2 py-1"
        : "bg-transparent text-primary hover:underline px-2 py-1",
  };
  const sizes = {
    md: "h-10 px-4 text-base",
    lg: "h-12 px-6 text-lg",
  };
  return (
    <button
      className={clsx(
        base,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className={colorTheme === 'default' ? "animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full" : "animate-spin mr-2 w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"}></span>
      )}
      {children}
    </button>
  );
} 