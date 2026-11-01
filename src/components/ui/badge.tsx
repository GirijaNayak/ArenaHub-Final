import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "gold" | "secondary";
}

export function Badge({ className, status, variant, children, ...props }: BadgeProps) {
  let resolvedVariant = variant || "default";

  if (status) {
    switch (status.toUpperCase()) {
      case "LIVE":
      case "ACTIVE":
      case "RESOLVED":
      case "REGISTRATION_OPEN":
        resolvedVariant = "success";
        break;
      case "ROOM_POSTED":
      case "OPEN":
      case "UNDER_REVIEW":
        resolvedVariant = "warning";
        break;
      case "SCHEDULED":
      case "DRAFT":
        resolvedVariant = "secondary";
        break;
      case "RESULTS_PENDING":
      case "DISPUTED":
      case "REJECTED":
      case "CANCELLED":
      case "SUSPENDED":
        resolvedVariant = "danger";
        break;
      case "COMPLETED":
      case "CONFIRMED":
        resolvedVariant = "gold";
        break;
      default:
        resolvedVariant = "default";
    }
  }

  const variants = {
    default: "bg-[#161d27] text-slate-300 border-white/[0.08]",
    secondary: "bg-[#192231] text-slate-400 border-slate-700/50",
    success: "bg-emerald-950/40 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-950/40 text-amber-400 border-amber-500/30",
    danger: "bg-red-950/40 text-red-400 border-red-500/30",
    info: "bg-cyan-950/40 text-cyan-400 border-cyan-500/30",
    gold: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };

  const displayText = children || (status ? status.replace(/_/g, " ") : "");

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border",
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
