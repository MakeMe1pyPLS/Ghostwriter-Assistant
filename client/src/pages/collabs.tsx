// Data collabs: saved, reusable sets of partners + shared data + KPIs.
// Businesses can start from a template, then duplicate a collab to set up the
// same arrangement with another partner in seconds.
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  Handshake, Plus, Copy, Trash2, Users, Database, Target, CalendarClock, Mail, MessageSquare, Check, ArrowLeft, ArrowRight,
  ShieldCheck, Eye, MessageCircle, Pencil, X, Search,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useGrowthStore, COLLAB_TEMPLATES, newId,
  type Collab, type CollabPartner, type CollabPermission, type CollabCadence, type CollabTemplate,
} from "@/hooks/use-growth-store";
import { mailtoLink, appLink } from "@/lib/share";
import { Stagger, StaggerItem, EASE_OUT } from "@/components/motion";
import { kpisForIndustry, ALL_INDUSTRY_KPIS } from "@shared/kpi-industries";

const PERMISSIONS: { id: CollabPermission; label: string; hint: string; icon: any }[] = [
  { id: 'view', label: 'View only', hint: 'Partners see the shared numbers', icon: Eye },
  { id: 'comment', label: 'View & discuss', hint: 'They can also comment in the Hub', icon: MessageCircle },
  { id: 'edit', label: 'Full collaboration', hint: 'They can add data and create actions', icon: Pencil },
];
const CADENCES: { id: CollabCadence; label: string }[] = [
  { id: 'weekly', label: 'Weekly review' },
  { id: 'biweekly', label: 'Every 2 weeks' },
  { id: 'monthly', label: 'Monthly' },
];

interface Draft {
  id?: string;
  templateId: string;
  name: string;
  purpose: string;
  partners: CollabPartner[];
  datasets: string[];
  kpis: string[];
  permission: CollabPermission;
  cadence: CollabCadence;
}

const blankPartner = (role = 'Partner'): CollabPartner => ({ id: newId('ptr'), name: '', role, contact: '', status: 'invited' });

function draftFromTemplate(t: CollabTemplate): Draft {
  return {
    templateId: t.id,
    name: t.id === 'custom' ? '' : t.name,
    purpose: t.purpose,
    partners: [blankPartner(t.roles[0])],
    datasets: [...t.datasets],
    kpis: [...t.kpis],
    permission: 'comment',
    cadence: 'weekly',
  };
}

function CollabEditor({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (o: boolean) => void; initial: Draft | null }) {
  const { toast } = useToast();
  const { createCollab, updateCollab, profile } = useGrowthStore();
  const [step, setStep] = useState<'template' | 'details'>(initial ? 'details' : 'template');
  const [draft, setDraft] = useState<Draft | null>(initial);
  const [datasetInput, setDatasetInput] = useState('');
  const [kpiQuery, setKpiQuery] = useState('');

  const kpiPool = useMemo(() => (profile ? kpisForIndustry(profile.industryId) : ALL_INDUSTRY_KPIS), [profile]);
  const kpiMatches = useMemo(() => {
    const q = kpiQuery.trim().toLowerCase();
    if (!q) return [];
    const pool = [...kpiPool, ...ALL_INDUSTRY_KPIS];
    const seen = new Set<string>();
    return pool.filter((k) => k.name.toLowerCase().includes(q) && !seen.has(k.name) && seen.add(k.name)).slice(0, 8);
  }, [kpiQuery, kpiPool]);

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const save = () => {
    if (!draft) return;
    const partners = draft.partners.filter((p) => p.name.trim());
    if (!draft.name.trim() || !partners.length) {
      toast({ title: 'Almost there', description: 'Give the collab a name and add at least one partner.', variant: 'destructive' });
      return;
    }
    const payload = {
      name: draft.name.trim(), purpose: draft.purpose.trim(), templateId: draft.templateId,
      partners, datasets: draft.datasets, kpis: draft.kpis, permission: draft.permission, cadence: draft.cadence,
    };
    if (draft.id) {
      updateCollab(draft.id, payload);
      toast({ title: 'Collab updated' });
    } else {
      createCollab(payload);
      toast({ title: 'Collab created', description: 'Send the invite so your partners can join.' });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-2xl max-h-[90dvh] overflow-y-auto p-0">
        <AnimatePresence mode="wait" initial={false}>
          {step === 'template' ? (
            <motion.div key="t" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2, ease: EASE_OUT }} className="p-6 sm:p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Start a data collab</DialogTitle>
                <DialogDescription>Pick the relationship that fits. You can change everything on the next screen.</DialogDescription>
              </DialogHeader>
              <div className="grid sm:grid-cols-2 gap-2 mt-5">
                {COLLAB_TEMPLATES.map((t) => (
                  <motion.button key={t.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setDraft(draftFromTemplate(t)); setStep('details'); }}
                    className="text-left rounded-2xl border border-slate-200 hover:border-primary/40 hover:bg-primary/5 p-4 transition-colors">
                    <p className="font-black text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.purpose}</p>
                    {t.datasets.length > 0 && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">{t.datasets.join(' · ')}</p>}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : draft && (
            <motion.div key="d" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2, ease: EASE_OUT }} className="p-6 sm:p-8 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">{draft.id ? 'Edit collab' : 'Collab details'}</DialogTitle>
                <DialogDescription>Who you’re working with, what you share and how often you review it together.</DialogDescription>
              </DialogHeader>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Collab name</span>
                  <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. West Coast fulfillment with FastFreight" className="h-11 rounded-xl" maxLength={80} />
                </label>
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">What you want to achieve together</span>
                  <Textarea value={draft.purpose} onChange={(e) => set({ purpose: e.target.value })} className="rounded-xl min-h-[64px]" maxLength={300} />
                </label>
              </div>

              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Partners</h3>
                  <Button variant="ghost" size="sm" className="font-bold" onClick={() => set({ partners: [...draft.partners, blankPartner()] })}><Plus className="w-3.5 h-3.5 mr-1" /> Add partner</Button>
                </div>
                <div className="space-y-2">
                  {draft.partners.map((p, i) => (
                    <div key={p.id} className="grid grid-cols-1 sm:grid-cols-[1.3fr_0.9fr_1.3fr_auto] gap-2 items-center">
                      <Input value={p.name} onChange={(e) => set({ partners: draft.partners.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)) })} placeholder="Company name" className="h-10 rounded-xl" aria-label={`Partner ${i + 1} name`} />
                      <Input value={p.role} onChange={(e) => set({ partners: draft.partners.map((x) => (x.id === p.id ? { ...x, role: e.target.value } : x)) })} placeholder="Role (Carrier…)" className="h-10 rounded-xl" aria-label={`Partner ${i + 1} role`} />
                      <Input type="email" value={p.contact ?? ''} onChange={(e) => set({ partners: draft.partners.map((x) => (x.id === p.id ? { ...x, contact: e.target.value } : x)) })} placeholder="Contact email (for the invite)" className="h-10 rounded-xl" aria-label={`Partner ${i + 1} email`} />
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400" disabled={draft.partners.length === 1} onClick={() => set({ partners: draft.partners.filter((x) => x.id !== p.id) })} aria-label="Remove partner"><X className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Data you’ll share</h3>
                <div className="flex flex-wrap gap-2">
                  {draft.datasets.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">
                      {d}<button onClick={() => set({ datasets: draft.datasets.filter((x) => x !== d) })} className="p-0.5 rounded hover:bg-slate-200" aria-label={`Remove ${d}`}><X className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
                  <form onSubmit={(e) => { e.preventDefault(); const v = datasetInput.trim(); if (v && !draft.datasets.includes(v)) set({ datasets: [...draft.datasets, v] }); setDatasetInput(''); }} className="flex gap-1">
                    <Input value={datasetInput} onChange={(e) => setDatasetInput(e.target.value)} placeholder="Add dataset (e.g. Returns)" className="h-9 rounded-xl w-48" maxLength={60} />
                  </form>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Shared KPIs</h3>
                <div className="flex flex-wrap gap-2">
                  {draft.kpis.map((k) => (
                    <span key={k} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-100 text-sm font-bold">
                      {k}<button onClick={() => set({ kpis: draft.kpis.filter((x) => x !== k) })} className="p-0.5 rounded hover:bg-teal-100" aria-label={`Remove ${k}`}><X className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input value={kpiQuery} onChange={(e) => setKpiQuery(e.target.value)} placeholder="Search the KPI library to add…" className="h-10 pl-9 rounded-xl" />
                  {kpiMatches.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                      {kpiMatches.map((k) => (
                        <button key={k.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm" onClick={() => { if (!draft.kpis.includes(k.name)) set({ kpis: [...draft.kpis, k.name] }); setKpiQuery(''); }}>
                          <span className="font-bold text-slate-900">{k.name}</span><span className="text-slate-400"> · {k.formula}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <div className="grid sm:grid-cols-2 gap-4">
                <section className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Partner access</h3>
                  <div className="space-y-1.5">
                    {PERMISSIONS.map((p) => (
                      <button key={p.id} onClick={() => set({ permission: p.id })} aria-pressed={draft.permission === p.id}
                        className={`w-full flex items-start gap-2.5 text-left rounded-xl border p-3 transition-colors ${draft.permission === p.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <p.icon className="w-4 h-4 mt-0.5 text-slate-500" />
                        <span><span className="block text-sm font-bold text-slate-900">{p.label}</span><span className="block text-xs text-slate-500">{p.hint}</span></span>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5" /> Review together</h3>
                  <div className="space-y-1.5">
                    {CADENCES.map((c) => (
                      <button key={c.id} onClick={() => set({ cadence: c.id })} aria-pressed={draft.cadence === c.id}
                        className={`w-full text-left rounded-xl border px-3 h-11 text-sm font-bold transition-colors ${draft.cadence === c.id ? 'border-primary bg-primary/5 ring-1 ring-primary text-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between pt-2">
                {!draft.id ? <Button variant="ghost" className="font-bold" onClick={() => setStep('template')}><ArrowLeft className="w-4 h-4 mr-1" /> Templates</Button> : <span />}
                <Button onClick={save} className="h-11 rounded-xl font-black uppercase tracking-widest text-xs px-6">{draft.id ? 'Save changes' : 'Create collab'} <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function inviteLink(c: Collab): string {
  const to = c.partners.map((p) => p.contact).filter(Boolean).join(',');
  const body = `Hi,\n\nI'd like to set up a shared data collab with you on ChainInsideIQ: "${c.name}".\n\nWhat we'd share: ${c.datasets.join(', ') || 'to be agreed'}\nKPIs we'd track together: ${c.kpis.join(', ') || 'to be agreed'}\nReview: ${CADENCES.find((x) => x.id === c.cadence)?.label.toLowerCase()}\n\nGoal: ${c.purpose}\n\nYou can see the platform here: ${appLink('/')}\n\nThanks!`;
  return mailtoLink(`Data collab invite: ${c.name}`, body, to);
}

function CollabCard({ collab, onEdit }: { collab: Collab; onEdit: () => void }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { duplicateCollab, updateCollab, removeCollab, addHubPost } = useGrowthStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const openDiscussion = () => {
    const post = addHubPost({
      type: 'discussion', title: `${collab.name}: weekly review`, collabId: collab.id,
      content: `Shared KPIs: ${collab.kpis.join(', ') || 'none yet'}. What changed since last review, and what should we fix first?`,
      sector: 'unified', tags: ['Collab'], urgency: 'Medium', status: 'Open',
      author: { name: 'You', role: 'Collab owner', initials: 'YO' },
    });
    navigate(`/hub?thread=${post.id}`);
  };

  return (
    <motion.article layout className={`rounded-3xl border bg-white p-5 sm:p-6 flex flex-col gap-4 transition-shadow hover:shadow-md ${collab.active ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-75'}`}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-slate-900 text-teal-300 flex items-center justify-center shrink-0"><Handshake className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-slate-900 text-lg leading-tight">{collab.name}</h3>
          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{collab.purpose}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:inline">{collab.active ? 'Active' : 'Paused'}</span>
          <Switch checked={collab.active} onCheckedChange={(v) => updateCollab(collab.id, { active: v })} aria-label="Collab active" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {collab.partners.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-slate-100 text-sm font-bold text-slate-700">
            <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-[10px] font-black flex items-center justify-center">{p.name.slice(0, 2).toUpperCase()}</span>
            {p.name}<span className="text-slate-400 font-medium">· {p.role}</span>
            {p.status === 'invited' && <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">Invited</span>}
          </span>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Shared data</p>
          <p className="text-slate-700 font-medium">{collab.datasets.join(', ') || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Shared KPIs</p>
          <p className="text-slate-700 font-medium">{collab.kpis.join(', ') || '—'}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
        <Button size="sm" className="rounded-xl font-bold" onClick={openDiscussion}><MessageSquare className="w-4 h-4 mr-1.5" /> Discuss in Hub</Button>
        <Button size="sm" variant="outline" className="rounded-xl font-bold" asChild>
          <a href={inviteLink(collab)}><Mail className="w-4 h-4 mr-1.5" /> Send invite</a>
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl font-bold" onClick={() => {
          const copy = duplicateCollab(collab.id, `${collab.name} (new partner)`);
          if (copy) toast({ title: 'Preset copied', description: 'Same data, KPIs and cadence. Update the partner and save.' });
        }}><Copy className="w-4 h-4 mr-1.5" /> Reuse as preset</Button>
        <Button size="sm" variant="ghost" className="rounded-xl font-bold" onClick={onEdit}><Pencil className="w-4 h-4 mr-1.5" /> Edit</Button>
        {confirmDelete ? (
          <span className="inline-flex items-center gap-1 ml-auto">
            <span className="text-xs font-bold text-slate-500">Delete?</span>
            <Button size="sm" variant="ghost" className="rounded-xl font-bold text-rose-600 hover:bg-rose-50" onClick={() => removeCollab(collab.id)}><Check className="w-4 h-4" /></Button>
            <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setConfirmDelete(false)}><X className="w-4 h-4" /></Button>
          </span>
        ) : (
          <Button size="sm" variant="ghost" className="rounded-xl text-slate-400 hover:text-rose-600 ml-auto" onClick={() => setConfirmDelete(true)} aria-label="Delete collab"><Trash2 className="w-4 h-4" /></Button>
        )}
      </div>
    </motion.article>
  );
}

export default function CollabsPage() {
  const collabs = useGrowthStore((s) => s.collabs);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const openNew = () => { setEditing(null); setEditorKey((k) => k + 1); setEditorOpen(true); };
  const openEdit = (c: Collab) => {
    setEditing({ id: c.id, templateId: c.templateId ?? 'custom', name: c.name, purpose: c.purpose, partners: c.partners, datasets: c.datasets, kpis: c.kpis, permission: c.permission, cadence: c.cadence });
    setEditorKey((k) => k + 1);
    setEditorOpen(true);
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto w-full space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Collaborate</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">Data collabs</h1>
            <p className="text-slate-500 mt-1 max-w-2xl">Share the numbers you and your partners both depend on, spot problems between companies and review them together. Save any collab as a preset to set up the next partner in seconds.</p>
          </div>
          <Button onClick={openNew} className="h-11 rounded-xl font-black uppercase tracking-widest text-xs shrink-0"><Plus className="w-4 h-4 mr-2" /> New collab</Button>
        </header>

        {collabs.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}
            className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto"><Handshake className="w-7 h-7" /></div>
            <h2 className="text-xl font-black text-slate-900 mt-4">No collabs yet</h2>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">Start with a template like “Seller + 3PL” or “Restaurant + food distributor”. It takes about a minute.</p>
            <Button onClick={openNew} className="mt-5 h-11 rounded-xl font-black uppercase tracking-widest text-xs">Create your first collab</Button>
          </motion.div>
        ) : (
          <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {collabs.map((c) => <StaggerItem key={c.id}><CollabCard collab={c} onEdit={() => openEdit(c)} /></StaggerItem>)}
          </Stagger>
        )}

        <div className="rounded-3xl bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1">
            <p className="font-black">Partners see the same data in real time once shared accounts launch.</p>
            <p className="text-sm text-slate-300 mt-1">Today, collabs are saved in this workspace and invites go out by email. Approved data requests are tracked under Settings → Data sharing.</p>
          </div>
          <Button variant="outline" className="rounded-xl font-bold bg-white/10 border-white/15 text-white hover:bg-white/15 hover:text-white" asChild><Link href="/settings">Data sharing settings</Link></Button>
        </div>
      </div>
      {editorOpen && <CollabEditor key={editorKey} open={editorOpen} onOpenChange={setEditorOpen} initial={editing} />}
    </AppLayout>
  );
}
