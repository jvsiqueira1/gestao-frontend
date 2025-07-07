import React from "react";
import clsx from "clsx";

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
  const base =
    "inline-flex items-center justify-center font-semibold rounded-md transition focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white",
    secondary:
      "bg-white border border-primary-500 text-primary-700 hover:bg-primary-50 active:bg-primary-100",
    text:
      "bg-transparent text-primary-600 hover:underline px-2 py-1",
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
        <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
      )}
      {children}
    </button>
  );
} 