import { LoaderCircle } from "lucide-react";

export function LoadingSpinner({ label = "Memuat...", className = "" }: { label?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  );
}
