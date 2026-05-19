"use client";
import { ReactNode } from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: ReactNode;
  className?: string;
}

export default function Toggle({ checked, onChange, children, className }: ToggleProps) {
  return (
    <label className={`toggle ${className || ""}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" />
      {children && <span>{children}</span>}
    </label>
  );
}
