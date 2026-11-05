import { Link } from "wouter";
import { FlaskConical } from "lucide-react";
import { useSectorData } from "@/hooks/use-sector-data";

/**
 * Shown while no file of the customer's is in use. The KPI cards, trend and breakdown on
 * this screen are then built-in sample figures, not the customer's numbers, and must never
 * be read as real. Goes away once a file is uploaded and selected.
 */
export function SampleDataNotice({ className = "" }: { className?: string }) {
  const { hasImportedData } = useSectorData();
  if (hasImportedData) return null;
  return (
    <div
      role="note"
      className={`flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className}`}
      data-testid="sample-data-notice"
    >
      <FlaskConical className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" aria-hidden />
      <p className="min-w-0 leading-snug">
        <span className="font-bold">Sample data.</span> The numbers and charts here are made-up examples, not your business.
        Upload a file on the{" "}
        <Link href="/data" className="font-bold underline underline-offset-2">Data page</Link>{" "}
        to see your own.
      </p>
    </div>
  );
}
