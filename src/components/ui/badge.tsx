import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/lib/types";

const STATUS: Record<ItemStatus, string> = {
  pending: "bg-pending/15 text-pending",
  met: "bg-met/15 text-met",
  partial: "bg-partial/15 text-partial",
  gap: "bg-gap/15 text-gap",
  na: "bg-rule text-fg-muted",
};

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide", className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  return <Badge className={STATUS[status]}>{status}</Badge>;
}
