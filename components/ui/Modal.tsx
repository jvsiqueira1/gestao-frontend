"use client";
import { ReactNode, useEffect } from "react";

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** "lg" ≈ 860px (ex.: wizard de importação); padrão "md" ≈ 480px. */
  size?: "md" | "lg";
}

export default function Modal({ title, subtitle, onClose, children, size = "md" }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal${size === "lg" ? " modal-lg" : ""}`} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {subtitle && <div className="sub">{subtitle}</div>}
        {children}
      </div>
    </div>
  );
}
