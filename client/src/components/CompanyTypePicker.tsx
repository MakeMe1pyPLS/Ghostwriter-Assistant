// Pick which kind of company each company in your structure is.
// One slot per company ("Your company", "Partner company"…). The list is the full
// library of business types, grouped, with search, so it isn't limited to logistics.
import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY_TYPE_GROUPS, SLOT_LABELS, companyTypeName, type StructureId } from "@shared/company-types";

export function CompanyTypePicker({ structure, value, onChange }: {
  structure: StructureId;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const labels = SLOT_LABELS[structure];
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const slot = Math.min(active, labels.length - 1);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMPANY_TYPE_GROUPS;
    return COMPANY_TYPE_GROUPS
      .map((g) => ({ ...g, types: g.types.filter((t) => t.name.toLowerCase().includes(q) || g.group.toLowerCase().includes(q)) }))
      .filter((g) => g.types.length > 0);
  }, [query]);

  const choose = (id: string) => {
    const next = labels.map((_, i) => (i === slot ? id : value[i] ?? ""));
    // Trim empty trailing slots so the list stays in order.
    while (next.length && !next[next.length - 1]) next.pop();
    onChange(next.map((x) => x || ""));
    const nextEmpty = labels.findIndex((_, i) => i !== slot && !next[i]);
    if (nextEmpty >= 0) setActive(nextEmpty);
    setQuery("");
  };

  return (
    <div className="space-y-4" data-testid="company-type-picker">
      <div role="tablist" aria-label="Companies" className={cn("grid gap-2", labels.length === 1 ? "grid-cols-1" : labels.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3")}>
        {labels.map((label, i) => {
          const chosen = value[i];
          return (
            <button key={label} type="button" role="tab" aria-selected={slot === i} onClick={() => setActive(i)}
              data-testid={`company-slot-${i}`}
              className={cn("text-left rounded-xl border-2 px-3.5 py-2.5 min-h-[56px] transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                slot === i ? "border-primary bg-primary/5" : "border-slate-200 bg-white hover:border-slate-300")}>
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
              <span className={cn("block text-sm font-bold truncate", chosen ? "text-slate-900" : "text-slate-500")}>{chosen ? companyTypeName(chosen) : "Choose a type"}</span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search business types"
          aria-label="Search business types" data-testid="company-type-search"
          className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-primary" />
      </div>

      <div className="max-h-[320px] overflow-y-auto space-y-4 pr-1" role="tabpanel" aria-label={`Business type for ${labels[slot]}`}>
        {groups.length === 0 && <p className="text-sm text-slate-600">No match. Try a shorter word, like "clinic" or "software".</p>}
        {groups.map((g) => (
          <fieldset key={g.group}>
            <legend className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">{g.group}</legend>
            <div className="flex flex-wrap gap-2">
              {g.types.map((t) => {
                const selected = value[slot] === t.id;
                return (
                  <button key={t.id} type="button" aria-pressed={selected} onClick={() => choose(t.id)}
                    data-testid={`company-type-${t.id}`}
                    className={cn("inline-flex items-center gap-1.5 min-h-10 px-3.5 rounded-xl border text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-primary",
                      selected ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300")}>
                    {selected && <Check className="w-3.5 h-3.5" aria-hidden />}{t.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
