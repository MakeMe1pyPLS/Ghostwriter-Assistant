// Consultant workspace: every client business in one place. Open a client to
// work inside their plan, data and sessions; track status, next review and
// notes; print a progress report for the client.
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Briefcase, Plus, ArrowRight, FileText, CalendarClock, AlertTriangle, CheckCircle2, Building, MoreHorizontal,
  Trash2, StickyNote, Users, Sparkles, Mail, HardDrive,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UpgradeBanner } from "@/components/UpgradeBadge";
import { useToast } from "@/hooks/use-toast";
import {
  useClientsStore, workspaceStats, storageUsage, isStorageFull, ENGAGEMENT_TYPES, CLIENT_STATUSES,
  type ClientRecord, type ClientStatus, type EngagementType, type WorkspaceStats, type WorkspaceSnapshot,
} from "@/hooks/use-clients-store";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { useSyncStatus } from "@/lib/cloud-sync";
import { BUSINESS_INDUSTRIES, getIndustry } from "@shared/kpi-industries";
import { Stagger, StaggerItem, EASE_OUT } from "@/components/motion";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<ClientStatus, string> = {
  Onboarding: "bg-sky-50 text-sky-700",
  Active: "bg-emerald-50 text-emerald-700",
  Paused: "bg-amber-50 text-amber-700",
  Completed: "bg-slate-100 text-slate-600",
};

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
const todayISO = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const fmtDate = (iso: string) => new Date(iso + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function ClientsPage() {
  const { clients, activeClientId, switchTo, workspaceFor } = useClientsStore();
  // The open workspace is read live (no copy) so its card stays current.
  const liveGrowth = useGrowthStore();
  const statsFor = (id: string | null) => workspaceStats(id === activeClientId ? ({ growth: liveGrowth } as unknown as WorkspaceSnapshot) : workspaceFor(id));
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const rows = clients.map((c) => ({ client: c, stats: statsFor(c.id) }));
  const own = statsFor(null);
  const active = rows.filter((r) => r.client.status === "Active" || r.client.status === "Onboarding").length;
  const overdue = rows.reduce((n, r) => n + r.stats.overdue, 0);
  const open = rows.reduce((n, r) => n + (r.stats.total - r.stats.done), 0);
  const reviewsDue = rows.filter((r) => r.client.nextReview && r.client.nextReview <= inDays(7) && r.client.status !== "Completed").length;
  const usageMb = storageUsage() / 1_000_000;
  const signedIn = useSyncStatus((s) => s.state !== "off");

  const openWorkspace = (id: string | null, to = "/plan") => { switchTo(id); navigate(to); };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto w-full space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Consult</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Clients</h1>
            <p className="text-slate-500 mt-1 max-w-2xl">
              For consultants and agencies. Each client gets their own workspace with a growth plan, data, dashboards and AI sessions. Open one to work inside it, then switch back in a click.
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="h-11 rounded-xl font-black uppercase tracking-widest text-xs shrink-0" data-testid="client-add">
            <Plus className="w-4 h-4 mr-2" /> Add client
          </Button>
        </header>

        <UpgradeBanner feature="client-workspaces" />

        {clients.length > 0 && (
          <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: "Active clients", value: active, icon: Users, tone: "text-slate-900" },
              { label: "Open actions", value: open, icon: CheckCircle2, tone: "text-slate-900" },
              { label: "Overdue", value: overdue, icon: AlertTriangle, tone: overdue ? "text-rose-600" : "text-slate-900" },
              { label: "Reviews this week", value: reviewsDue, icon: CalendarClock, tone: reviewsDue ? "text-amber-700" : "text-slate-900" },
            ].map((s) => (
              <StaggerItem key={s.label}>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
                  <s.icon className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <p className={cn("text-2xl font-black tabular-nums leading-tight", s.tone)}>{s.value}</p>
                    <p className="text-[11px] font-bold text-slate-500 truncate">{s.label}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {/* Own business */}
        <div className={cn("rounded-3xl border bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4", activeClientId === null ? "border-primary/40 ring-1 ring-primary/20" : "border-slate-200")}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="w-11 h-11 rounded-2xl bg-slate-900 text-teal-300 flex items-center justify-center shrink-0"><Building className="w-5 h-5" /></span>
            <div className="min-w-0">
              <p className="font-black text-slate-900 truncate">{own.businessName || "My business"}{activeClientId === null && <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-primary">Open now</span>}</p>
              <p className="text-[13px] text-slate-500 truncate">{own.hasPlan ? `${own.done}/${own.total} actions done${own.northStar ? ` · ${own.northStar}` : ""}` : "Your own workspace"}</p>
            </div>
          </div>
          {activeClientId !== null && (
            <Button variant="outline" className="h-10 rounded-xl font-bold" onClick={() => openWorkspace(null)}>Switch to my business</Button>
          )}
        </div>

        {clients.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}
            className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center mx-auto"><Briefcase className="w-7 h-7" /></div>
            <h2 className="text-xl font-black text-slate-900 mt-4">Add your first client</h2>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Run the AI interview with them to build their plan, import their numbers, then use consult sessions to work through pricing, cash flow and growth together.
            </p>
            <Button onClick={() => setAddOpen(true)} className="mt-5 h-11 rounded-xl font-black uppercase tracking-widest text-xs">Add a client</Button>
          </motion.div>
        ) : (
          <Stagger className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map(({ client, stats }) => (
              <StaggerItem key={client.id}>
                <ClientCard client={client} stats={stats} active={client.id === activeClientId}
                  onOpen={() => openWorkspace(client.id, stats.hasPlan ? "/plan" : "/onboarding")}
                  onDetails={() => setDetailId(client.id)} />
              </StaggerItem>
            ))}
          </Stagger>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 flex gap-3 items-start">
          <HardDrive className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" aria-hidden />
          <p className="text-[13px] text-slate-500">
            {signedIn
              ? <>Every client workspace is saved to your account, so it's there when you sign in on another device. Only you can see them. Inviting clients to sign in to their own workspace is coming soon.</>
              : <>Client workspaces are saved in this browser on this device ({usageMb < 0.1 ? "under 0.1" : usageMb.toFixed(1)} MB used). <Link href="/sign-up" className="font-bold text-primary hover:underline">Create an account</Link> to keep them safe and open them on any device.</>}
            {isStorageFull() && <span className="block mt-1 font-bold text-rose-600">Your browser storage is full, so recent changes may not be saved. Remove old datasets or clients to free space.</span>}
          </p>
        </div>
      </div>

      <AddClientDialog open={addOpen} onOpenChange={setAddOpen} onCreated={(c, startInterview) => { if (startInterview) openWorkspace(c.id, "/onboarding"); }} />
      <ClientSheet clientId={detailId} onClose={() => setDetailId(null)} />
    </AppLayout>
  );
}

function ClientCard({ client, stats, active, onOpen, onDetails }: { client: ClientRecord; stats: WorkspaceStats; active: boolean; onOpen: () => void; onDetails: () => void }) {
  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const reviewSoon = client.nextReview && client.nextReview <= inDays(7) && client.status !== "Completed";
  const reviewLate = client.nextReview && client.nextReview < todayISO() && client.status !== "Completed";
  return (
    <article className={cn("h-full rounded-3xl border bg-white p-5 flex flex-col gap-4 transition-shadow hover:shadow-md", active ? "border-primary/50 ring-1 ring-primary/20" : "border-slate-200")} data-testid={`client-card-${client.id}`}>
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-700 font-black flex items-center justify-center shrink-0">{initials(client.name)}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-slate-900 leading-tight truncate">{client.name}</h3>
          <p className="text-[13px] text-slate-500 truncate">{getIndustry(client.industryId)?.name ?? "Industry not set"} · {client.engagement}</p>
        </div>
        <button onClick={onDetails} className="w-10 h-10 -mr-2 -mt-1 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 shrink-0" aria-label={`Details for ${client.name}`}>
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
        <span className={cn("rounded-full px-2 py-0.5", STATUS_STYLE[client.status])}>{client.status}</span>
        {active && <span className="rounded-full px-2 py-0.5 bg-primary text-white">Open now</span>}
        {stats.overdue > 0 && <span className="rounded-full px-2 py-0.5 bg-rose-50 text-rose-700">{stats.overdue} overdue</span>}
        {client.nextReview && <span className={cn("rounded-full px-2 py-0.5", reviewLate ? "bg-rose-50 text-rose-700" : reviewSoon ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600")}>Review {fmtDate(client.nextReview)}</span>}
      </div>

      <div className="flex-1">
        {stats.hasPlan ? (
          <>
            <p className="text-sm font-bold text-slate-800 line-clamp-1">{stats.planHeadline}</p>
            {stats.northStar && <p className="text-[12px] text-slate-500 line-clamp-1">{stats.northStar}</p>}
            <div className="mt-3">
              <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1"><span>{stats.done} of {stats.total} actions done</span><span>{pct}%</span></div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Actions completed">
                <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: EASE_OUT }} />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{stats.sessions} consult session{stats.sessions === 1 ? "" : "s"} · {stats.decisions} decision{stats.decisions === 1 ? "" : "s"}</p>
          </>
        ) : (
          <p className="text-[13px] text-slate-500 flex items-start gap-2"><Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" /> No plan yet. Open the workspace to run the AI interview with this client.</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={onOpen} className="flex-1 h-10 rounded-xl font-bold" variant={active ? "outline" : "default"} data-testid={`client-open-${client.id}`}>
          {active ? "Go to plan" : stats.hasPlan ? "Open workspace" : "Start interview"} <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
        <Link href={`/clients/${client.id}/report`} className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50" aria-label={`Report for ${client.name}`}>
          <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Report</span>
        </Link>
      </div>
    </article>
  );
}

function IndustrySelect({ value, onChange, id }: { value?: string; onChange: (v: string | undefined) => void; id: string }) {
  const groups = useMemo(() => {
    const m = new Map<string, typeof BUSINESS_INDUSTRIES>();
    for (const i of BUSINESS_INDUSTRIES) m.set(i.group, [...(m.get(i.group) ?? []), i]);
    return [...m.entries()];
  }, []);
  return (
    <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)}
      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
      <option value="">Choose an industry</option>
      {groups.map(([g, list]) => (
        <optgroup key={g} label={g}>{list.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</optgroup>
      ))}
    </select>
  );
}

const FIELD_LABEL = "text-[10px] font-black uppercase tracking-widest text-slate-500";

function AddClientDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (c: ClientRecord, startInterview: boolean) => void }) {
  const addClient = useClientsStore((s) => s.addClient);
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [industryId, setIndustryId] = useState<string | undefined>();
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [engagement, setEngagement] = useState<EngagementType>("Project");
  const [nextReview, setNextReview] = useState(inDays(14));
  const [startInterview, setStartInterview] = useState(true);
  const emailOk = !contactEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !emailOk) return;
    const c = addClient({ name, industryId, contactName: contactName.trim() || undefined, contactEmail: contactEmail.trim() || undefined, engagement, nextReview: nextReview || undefined });
    toast({ title: `${c.name} added`, description: startInterview ? "Opening their workspace for the AI interview." : "Open their workspace whenever you’re ready." });
    onOpenChange(false);
    setName(""); setIndustryId(undefined); setContactName(""); setContactEmail(""); setEngagement("Project"); setNextReview(inDays(14));
    onCreated(c, startInterview);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Add a client</DialogTitle>
          <DialogDescription>They get their own workspace. Nothing from your business or other clients is shown in it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label htmlFor="c-name" className={FIELD_LABEL}>Business name</label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rivera Family Bakery" className="h-11 rounded-xl" maxLength={80} autoFocus required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="c-ind" className={FIELD_LABEL}>Industry</label>
            <IndustrySelect id="c-ind" value={industryId} onChange={setIndustryId} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="c-contact" className={FIELD_LABEL}>Main contact</label>
              <Input id="c-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Name" className="h-11 rounded-xl" maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="c-email" className={FIELD_LABEL}>Email</label>
              <Input id="c-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="name@company.com" className={cn("h-11 rounded-xl", !emailOk && "border-rose-400")} maxLength={120} aria-invalid={!emailOk} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="c-eng" className={FIELD_LABEL}>Engagement</label>
              <select id="c-eng" value={engagement} onChange={(e) => setEngagement(e.target.value as EngagementType)} className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900">
                {ENGAGEMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="c-rev" className={FIELD_LABEL}>First review</label>
              <Input id="c-rev" type="date" value={nextReview} onChange={(e) => setNextReview(e.target.value)} className="h-11 rounded-xl" />
            </div>
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3.5 cursor-pointer">
            <input type="checkbox" className="mt-1 w-4 h-4 accent-teal-600" checked={startInterview} onChange={(e) => setStartInterview(e.target.checked)} />
            <span>
              <span className="block text-sm font-bold text-slate-900">Start the AI interview now</span>
              <span className="block text-[13px] text-slate-500">Switch to their workspace and build their growth plan together.</span>
            </span>
          </label>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
            <Button type="button" variant="ghost" className="h-11 rounded-xl font-bold" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || !emailOk} className="h-11 rounded-xl font-black uppercase tracking-widest text-xs" data-testid="client-create">Add client</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ClientSheet({ clientId, onClose }: { clientId: string | null; onClose: () => void }) {
  const client = useClientsStore((s) => s.clients.find((c) => c.id === clientId));
  const { updateClient, removeClient, addNote, removeNote } = useClientsStore();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Sheet open={!!client} onOpenChange={(o) => { if (!o) { onClose(); setConfirmDelete(false); } }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto overscroll-contain">
        {client && (
          <div className="space-y-6">
            <SheetHeader className="text-left">
              <SheetTitle className="text-xl font-black">{client.name}</SheetTitle>
              <SheetDescription>Engagement details, status and notes. Notes stay private to you.</SheetDescription>
            </SheetHeader>

            <section className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="s-name" className={FIELD_LABEL}>Business name</label>
                <Input id="s-name" value={client.name} onChange={(e) => updateClient(client.id, { name: e.target.value.slice(0, 80) })} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <span className={FIELD_LABEL}>Status</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {CLIENT_STATUSES.map((s) => (
                    <button key={s} onClick={() => updateClient(client.id, { status: s })} aria-pressed={client.status === s}
                      className={cn("h-10 rounded-xl border text-sm font-bold transition-colors", client.status === s ? "border-primary bg-primary text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="s-eng" className={FIELD_LABEL}>Engagement</label>
                  <select id="s-eng" value={client.engagement} onChange={(e) => updateClient(client.id, { engagement: e.target.value as EngagementType })} className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900">
                    {ENGAGEMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="s-rev" className={FIELD_LABEL}>Next review</label>
                  <Input id="s-rev" type="date" value={client.nextReview ?? ""} onChange={(e) => updateClient(client.id, { nextReview: e.target.value || undefined })} className="h-11 rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="s-ind" className={FIELD_LABEL}>Industry</label>
                <IndustrySelect id="s-ind" value={client.industryId} onChange={(v) => updateClient(client.id, { industryId: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="s-contact" className={FIELD_LABEL}>Main contact</label>
                  <Input id="s-contact" value={client.contactName ?? ""} onChange={(e) => updateClient(client.id, { contactName: e.target.value.slice(0, 80) || undefined })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="s-email" className={FIELD_LABEL}>Email</label>
                  <Input id="s-email" type="email" value={client.contactEmail ?? ""} onChange={(e) => updateClient(client.id, { contactEmail: e.target.value.slice(0, 120) || undefined })} className="h-11 rounded-xl" />
                </div>
              </div>
              {client.contactEmail && (
                <a href={`mailto:${encodeURIComponent(client.contactEmail)}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary"><Mail className="w-4 h-4" /> Email {client.contactName || "contact"}</a>
              )}
            </section>

            <section className="space-y-3">
              <h3 className={cn(FIELD_LABEL, "flex items-center gap-1.5")}><StickyNote className="w-3.5 h-3.5" /> Notes</h3>
              <form onSubmit={(e) => { e.preventDefault(); addNote(client.id, note); setNote(""); }} className="space-y-2">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Meeting notes, decisions, things to follow up…" className="rounded-xl min-h-[72px]" maxLength={1000} aria-label="New note" />
                <Button type="submit" disabled={!note.trim()} variant="outline" className="h-10 rounded-xl font-bold">Add note</Button>
              </form>
              {client.notes.length === 0 ? (
                <p className="text-[13px] text-slate-400">No notes yet.</p>
              ) : (
                <ul className="space-y-2">
                  {client.notes.map((n) => (
                    <li key={n.id} className="rounded-2xl bg-slate-50 border border-slate-100 p-3 flex gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{n.text}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                      </div>
                      <button onClick={() => removeNote(client.id, n.id)} className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0" aria-label="Delete note"><Trash2 className="w-4 h-4" /></button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="pt-2 border-t border-slate-100">
              {!confirmDelete ? (
                <Button variant="ghost" className="h-10 rounded-xl font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-4 h-4 mr-1.5" /> Remove client
                </Button>
              ) : (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 space-y-2">
                  <p className="text-sm font-bold text-rose-800">Remove {client.name} and their whole workspace?</p>
                  <p className="text-[13px] text-rose-700">Their plan, actions, sessions, datasets and dashboards are deleted from this browser. This can’t be undone.</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" className="h-10 rounded-xl font-bold" onClick={() => setConfirmDelete(false)}>Keep</Button>
                    <Button className="h-10 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white" onClick={() => { const n = client.name; removeClient(client.id); onClose(); setConfirmDelete(false); toast({ title: `${n} removed` }); }}>Remove</Button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
