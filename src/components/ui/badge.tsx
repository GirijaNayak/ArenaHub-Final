import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
}

export function Badge({ className, status, variant, children, ...props }: BadgeProps) {
  let resolvedVariant = variant || "default";

  if (status) {
    switch (status.toUpperCase()) {
      case "REGISTRATION_OPEN":
        resolvedVariant = "success";
        break;
      case "ONGOING":
        resolvedVariant = "purple";
        break;
      case "COMPLETED":
        resolvedVariant = "info";
        break;
      case "UPCOMING":
        resolvedVariant = "warning";
        break;
      case "REGISTRATION_CLOSED":
      case "CANCELLED":
      case "DISQUALIFIED":
        resolvedVariant = "danger";
        break;
      default:
        resolvedVariant = "default";
    }
  }

  const variants = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-emerald-950/60 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-950/60 text-amber-400 border-amber-500/30",
    danger: "bg-rose-950/60 text-rose-400 border-rose-500/30",
    info: "bg-sky-950/60 text-sky-400 border-sky-500/30",
    purple: "bg-indigo-950/60 text-indigo-400 border-indigo-500/30",
  };

  const displayText = children || (status ? status.replace(/_/g, " ") : "");

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border",
          variants[resolvedVariant],
          className
        )
      )}
      {...props}
    >
      {displayText}
    </span>
  );
}
