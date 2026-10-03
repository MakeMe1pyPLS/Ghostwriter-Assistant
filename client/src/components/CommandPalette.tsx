// Quick-jump search: Ctrl/⌘ K or "/" from anywhere in the app.
// Jump to a page, run a common action, or find a step in your growth plan.
import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { useLocation } from "wouter";
import {
  Search, CornerDownLeft, BrainCircuit, Upload, Download, Handshake, RotateCcw, Compass,
  CheckCircle2, Circle, CircleDot, Target,
} from "lucide-react";
import { ALL_NAV_ITEMS, NAV_GROUPS, SETTINGS_ITEM } from "@/lib/nav";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { cn } from "@/lib/utils";

const OPEN_EVENT = "ciq:open-command-palette";

/** Open the palette from anywhere (sidebar button, top bar, tab bar). */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * Ranking: the item's name starting with the query beats a word starting with
 * it, which beats a plain substring. No loose letter-by-letter fuzzy matching,
 * so "hub" finds Hub, not "Ask the AI Analyst".
 */
function rank(value: string, search: string): number {
  const v = value.toLowerCase();
  const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;
  let score = 0;
  for (const t of terms) {
    if (v.startsWith(t)) score += 3;
    else if (new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(v)) score += 2;
    else if (v.includes(t)) score += 1;
    else return 0;
  }
  return score / (terms.length * 3);
}

function isTypingTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const actions = useGrowthStore((s) => s.actions);
  const plan = useGrowthStore((s) => s.plan);
  const restartTour = useGrowthStore((s) => s.restartTour);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((o: boolean) => !o); }
      else if (e.key === "/" && !open && !isTypingTarget(e.target)) { e.preventDefault(); setOpen(true); }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener(OPEN_EVENT, onOpen); };
  }, [open]);

  useEffect(() => { if (!open) setQuery(""); }, [open]);

  const go = (href: string) => { setOpen(false); setLocation(href); };

  const quickActions = useMemo(() => [
    { id: "ask", label: "Ask the AI Analyst a question", icon: BrainCircuit, run: () => go("/insights"), keywords: "chat help why" },
    { id: "import", label: "Import a CSV or Excel file", icon: Upload, run: () => go("/data"), keywords: "upload data spreadsheet" },
    { id: "export", label: "Export to Excel, CSV or Power BI", icon: Download, run: () => go("/exports"), keywords: "download" },
    { id: "collab", label: "Start a data collab with a partner", icon: Handshake, run: () => go("/collabs"), keywords: "share supplier invite" },
    { id: "replan", label: plan ? "Rebuild my growth plan" : "Build my growth plan", icon: RotateCcw, run: () => go("/onboarding"), keywords: "interview goal restart" },
    { id: "tour", label: "Take the product tour", icon: Compass, run: () => { restartTour(); go("/plan"); }, keywords: "help guide tutorial" },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [plan]);

  const openActions = actions.filter((a: { status: string }) => a.status !== "done").slice(0, 40);
  const statusIcon = { todo: Circle, doing: CircleDot, done: CheckCircle2 } as const;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[250] bg-slate-950/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-[251] left-1/2 -translate-x-1/2 w-[calc(100vw-24px)] max-w-[620px] top-3 sm:top-[12vh]",
            "rounded-2xl bg-white shadow-[0_24px_80px_-12px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/10 overflow-hidden",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] data-[state=open]:slide-in-from-top-2",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.98] duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Search and jump</DialogPrimitive.Title>
          <Command loop label="Search and jump" filter={rank} className="flex flex-col">
            <div className="flex items-center gap-3 px-4 border-b border-slate-100">
              <Search className="w-[18px] h-[18px] text-slate-400 shrink-0" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                autoFocus
                placeholder="Search pages, actions and plan steps…"
                className="flex-1 h-14 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">Esc</kbd>
            </div>

            <Command.List className="max-h-[min(60vh,440px)] overflow-y-auto overscroll-contain p-2 scroll-py-2">
              <Command.Empty className="py-10 text-center text-sm text-slate-500">
                Nothing matches “{query}”. Try a page name like “Hub” or “Exports”.
              </Command.Empty>

              <Group heading="Do something">
                {quickActions.map((a) => (
                  <Item key={a.id} value={`${a.label} ${a.keywords}`} onSelect={a.run} icon={a.icon} label={a.label} />
                ))}
              </Group>

              {NAV_GROUPS.map((g) => (
                <Group key={g.label} heading={g.label}>
                  {g.items.map((item) => (
                    <Item key={item.href} value={`${item.name} ${item.description} ${item.keywords ?? ""}`} onSelect={() => go(item.href)} icon={item.icon} label={item.name} hint={item.description} />
                  ))}
                </Group>
              ))}
              <Group heading="Account">
                <Item value={`${SETTINGS_ITEM.name} ${SETTINGS_ITEM.keywords}`} onSelect={() => go(SETTINGS_ITEM.href)} icon={SETTINGS_ITEM.icon} label={SETTINGS_ITEM.name} hint={SETTINGS_ITEM.description} />
              </Group>

              {query.length > 1 && openActions.length > 0 && (
                <Group heading="Plan steps">
                  {openActions.map((a) => {
                    const Icon = statusIcon[a.status] ?? Target;
                    return (
                      <Item key={a.id} value={`step ${a.title} ${a.owner ?? ""}`} onSelect={() => go("/plan")} icon={Icon} label={a.title} hint={a.owner ? `Owner: ${a.owner}` : undefined} />
                    );
                  })}
                </Group>
              )}
            </Command.List>

            <div className="hidden sm:flex items-center gap-4 px-4 h-10 border-t border-slate-100 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> to move</span>
              <span className="inline-flex items-center gap-1.5"><Kbd><CornerDownLeft className="w-3 h-3" /></Kbd> to open</span>
              <span className="ml-auto">{ALL_NAV_ITEMS.length} pages</span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-slate-400"
    >
      {children}
    </Command.Group>
  );
}

function Item({ value, onSelect, icon: Icon, label, hint }: { value: string; onSelect: () => void; icon: any; label: string; hint?: string }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="group flex items-center gap-3 px-3 h-11 rounded-xl cursor-pointer text-slate-700 data-[selected=true]:bg-slate-900 data-[selected=true]:text-white transition-colors"
    >
      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-data-[selected=true]:bg-white/10 group-data-[selected=true]:text-teal-300">
        <Icon className="w-4 h-4" />
      </span>
      <span className="text-[14px] font-semibold truncate">{label}</span>
      {hint && <span className="ml-auto pl-3 text-[12px] text-slate-400 truncate hidden sm:block group-data-[selected=true]:text-slate-300">{hint}</span>}
    </Command.Item>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded border border-slate-200 bg-slate-50 px-1 text-[10px] font-semibold text-slate-500">{children}</kbd>;
}
