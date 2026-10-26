// What a screen says when there is nothing to show yet: one sentence, one action.
import { cn } from "@/lib/utils";
import { DsCard } from "./surface";

export function EmptyState({ illustration, title, body, action, className }: {
  illustration?: React.ReactNode; title: string; body: string; action?: React.ReactNode; className?: string;
}) {
  return (
    <DsCard className={cn("flex flex-col items-center text-center gap-3 py-10", className)}>
      {illustration && <div className="w-40 text-primary" aria-hidden>{illustration}</div>}
      <h3 className="text-lg font-black tracking-tight text-slate-900">{title}</h3>
      <p className="max-w-sm text-sm text-slate-600">{body}</p>
      {action}
    </DsCard>
  );
}
