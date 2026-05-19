import React from "react";
import clsx from "clsx";

type Tone = "default" | "pos" | "neg" | "warn" | "info";

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClass: Record<Tone, string> = {
  default: "",
  pos: "pill-pos",
  neg: "pill-neg",
  warn: "pill-warn",
  info: "pill-info",
};

export default function Pill({ tone = "default", className, ...props }: PillProps) {
  return <span className={clsx("pill", toneClass[tone], className)} {...props} />;
}
