"use client";
import { ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** "lg" ≈ 860px (ex.: wizard de importação); padrão "md" ≈ 480px. */
  size?: "md" | "lg";
}

export default function Modal({ title, subtitle, onClose, children, size = "md" }: ModalProps) {
  // Só fecha quando o gesto começa E termina no próprio backdrop — evita fechar
  // quando o usuário seleciona texto num input e solta o mouse fora do modal.
  const pressOnBackdrop = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        pressOnBackdrop.current = e.target === e.currentTarget;
      }}
      onMouseUp={(e) => {
        if (pressOnBackdrop.current && e.target === e.currentTarget) onClose();
        pressOnBackdrop.current = false;
      }}
    >
      <div className={`modal${size === "lg" ? " modal-lg" : ""}`}>
        <h2>{title}</h2>
        {subtitle && <div className="sub">{subtitle}</div>}
        {children}
      </div>
    </div>
  );
}
