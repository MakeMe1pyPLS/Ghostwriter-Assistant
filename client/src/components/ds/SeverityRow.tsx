// One line in a ranked list of problems. Rank, name, a severity word with its icon,
// and a bar sized to the impact so the list reads top-down without opening anything.
import { cn } from "@/lib/utils";
import { STATUS, StatusChip, type Status } from "./status";

export function SeverityRow({ rank, name, detail, status, share, onClick }: {
  rank: number; name: string; detail: string; status: Status; /** 0..1 of the biggest problem */ share: number; onClick?: () => void;
}) {
  const s = STATUS[status];
  return (
    <li>
      <button type="button" onClick={onClick}
        className={cn("w-full text-left grid grid-cols-[28px_1fr_auto] items-center gap-x-3 gap-y-1.5 rounded-xl border border-slate-200 bg-white px-3 py-3 min-h-[56px] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-primary")}>
        <span className="text-sm font-black text-slate-500 tabular-nums">{rank}</span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-slate-900 truncate">{name}</span>
          <span className="block text-[12px] text-slate-600 truncate">{detail}</span>
        </span>
        <StatusChip status={status} />
        <span aria-hidden className="col-start-2 col-span-2 h-1.5 rounded-full" style={{ background: "var(--chart-track)" }}>
          <span className="block h-full rounded-full" style={{ width: `${Math.round(share * 100)}%`, background: s.mark }} />
        </span>
      </button>
    </li>
  );
}
