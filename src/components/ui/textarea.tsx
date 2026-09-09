import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-md border border-rule bg-white px-3 py-2 text-sm text-ink placeholder:text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}
