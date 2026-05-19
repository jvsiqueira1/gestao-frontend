"use client";
import { ReactNode } from "react";

export interface SegOption<T extends string = string> {
  value: T;
  label: ReactNode;
}

interface SegmentedProps<T extends string> {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export default function Segmented<T extends string>({ options, value, onChange, className }: SegmentedProps<T>) {
  return (
    <div className={`seg ${className || ""}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          data-active={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
