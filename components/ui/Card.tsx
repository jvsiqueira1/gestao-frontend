import React from "react";
import clsx from "clsx";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("card", className)} {...props} />;
}

export function CardHead({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("card-head", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("card-title", className)} {...props} />;
}

export function CardSub({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("card-sub", className)} {...props} />;
}
