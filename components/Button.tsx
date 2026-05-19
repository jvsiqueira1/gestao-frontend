import React from "react";
import clsx from "clsx";

type Variant = "primary" | "accent" | "ghost" | "outline" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  icon?: boolean;
  children?: React.ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  accent: "btn-accent",
  ghost: "btn-ghost",
  outline: "btn-outline",
  destructive: "btn-destructive",
};

const sizeClass: Record<Size, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

export default function Button({
  loading = false,
  variant = "primary",
  size = "md",
  icon = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx("btn", variantClass[variant], sizeClass[size], icon && "btn-icon", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
