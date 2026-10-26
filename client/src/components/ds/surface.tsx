import { cn } from "@/lib/utils";

/** The one card: white, rounded, hairline border, soft shadow. */
export function DsCard({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-card border border-slate-200 bg-white shadow-card p-4 sm:p-5", className)} {...rest}>
      {children}
    </div>
  );
}

/** Small uppercase label above a title. */
export const Eyebrow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn("text-[11px] font-black uppercase tracking-widest text-primary", className)}>{children}</p>
);
