// Settings sections added in Phase 1: AI engine choice, connected tools
// (Microsoft Teams, Google Chat, Slack, calendars) and onboarding controls.
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { BrainCircuit, Plug, CheckCircle2, CircleDashed, Loader2, Send, RotateCcw, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { fetchEngineStatus, ENGINE_LABELS, type EngineStatus } from "@/lib/intel-client";
import { sendToChannel, CHANNEL_LABELS, type ShareChannel } from "@/lib/share";
import type { AIEnginePreference } from "@shared/ai-types";
import { OwnKeysPanel } from "@/components/settings/AccountSettings";
import type { ConnectedKey } from "@/lib/account";

function SectionShell({ id, icon: Icon, title, children }: { id?: string; icon: any; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-24">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </section>
  );
}

const ENGINE_BLURB: Record<AIEnginePreference, string> = {
  auto: 'Uses the first connected engine and falls back to the next if one is busy.',
  claude: 'Anthropic Claude: strong reasoning and clear, careful plans.',
  openai: 'OpenAI ChatGPT: broad general knowledge and fast answers.',
  gemini: 'Google Gemini: fast, with very large context for big datasets.',
};

export function AIEngineSection() {
  const { aiEngine, setAiEngine } = useGrowthStore();
  const [status, setStatus] = useState<EngineStatus | null | undefined>(undefined);
  useEffect(() => { fetchEngineStatus().then(setStatus); }, []);
  const [ownKeys, setOwnKeys] = useState<ConnectedKey[]>([]);
  const configured = (id: string) => status?.engines.find((e) => e.id === id)?.configured;
  const own = (id: string) => ownKeys.some((k) => k.provider === id && k.connected);

  return (
    <SectionShell id="ai" icon={BrainCircuit} title="AI engine">
      <p className="text-sm text-slate-600">Pick the AI that writes your strategy, plans and analyses, or let ChainInsideIQ choose. If one is busy the next answers, and the built-in analyst always has an answer.</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {(['auto', 'claude', 'openai', 'gemini'] as AIEnginePreference[]).map((e) => {
          const mine = e !== 'auto' && own(e);
          const ok = e === 'auto' ? true : mine || configured(e);
          return (
            <button key={e} onClick={() => setAiEngine(e)} aria-pressed={aiEngine === e}
              className={`text-left rounded-xl border p-4 transition-colors ${aiEngine === e ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 hover:bg-slate-50'}`}>
              <span className="flex items-center gap-2">
                <span className="font-black text-slate-900">{ENGINE_LABELS[e]}</span>
                {e !== 'auto' && status !== undefined && (
                  mine ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden /> Your key</span>
                  : ok ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden /> Included</span>
                     : <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"><CircleDashed className="w-3.5 h-3.5" aria-hidden /> Not available</span>
                )}
              </span>
              <span className="block text-xs text-slate-500 mt-1">{ENGINE_BLURB[e]}</span>
            </button>
          );
        })}
      </div>
      {status === null && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
          The AI engines can’t be reached right now, so the built-in analyst is answering. Your work isn’t affected.
        </p>
      )}
      <OwnKeysPanel onChange={setOwnKeys} />
    </SectionShell>
  );
}

const CHANNEL_HELP: Record<ShareChannel, { field: 'teamsWebhook' | 'googleChatWebhook' | 'slackWebhook'; placeholder: string; how: string }> = {
  teams: { field: 'teamsWebhook', placeholder: 'https://…logic.azure.com/… or …webhook.office.com/…', how: 'In Teams, open the channel → ••• → Workflows → “Post to a channel when a webhook request is received”, then copy the URL.' },
  'google-chat': { field: 'googleChatWebhook', placeholder: 'https://chat.googleapis.com/v1/spaces/…', how: 'In Google Chat, open the space → Apps & integrations → Webhooks → Add webhook, then copy the URL.' },
  slack: { field: 'slackWebhook', placeholder: 'https://hooks.slack.com/services/…', how: 'In Slack, create an app with Incoming Webhooks turned on, add it to a channel and copy the URL.' },
};

export function IntegrationsSection() {
  const { toast } = useToast();
  const { integrations, setIntegrations } = useGrowthStore();
  const [drafts, setDrafts] = useState({
    teams: integrations.teamsWebhook ?? '',
    'google-chat': integrations.googleChatWebhook ?? '',
    slack: integrations.slackWebhook ?? '',
  } as Record<ShareChannel, string>);
  const [testing, setTesting] = useState<ShareChannel | null>(null);

  const save = (c: ShareChannel) => {
    const v = drafts[c].trim();
    if (v && !/^https:\/\//.test(v)) {
      toast({ title: 'That doesn’t look like a webhook URL', description: 'It should start with https://', variant: 'destructive' });
      return;
    }
    setIntegrations({ [CHANNEL_HELP[c].field]: v || undefined });
    toast({ title: v ? `${CHANNEL_LABELS[c]} connected` : `${CHANNEL_LABELS[c]} disconnected` });
  };

  const test = async (c: ShareChannel) => {
    setTesting(c);
    try {
      await sendToChannel(c, { title: 'ChainInsideIQ is connected', text: 'Updates, plans and bottlenecks you share will appear in this channel.' }, drafts[c].trim());
      toast({ title: 'Test message sent', description: `Check your ${CHANNEL_LABELS[c]} channel.` });
    } catch (err: any) {
      toast({ title: 'Test failed', description: err?.message, variant: 'destructive' });
    } finally {
      setTesting(null);
    }
  };

  return (
    <SectionShell id="integrations" icon={Plug} title="Connected tools">
      <p className="text-sm text-slate-500">Send plans, bottlenecks and Hub updates to the tools your team already uses. Due dates can be added to Google Calendar, Outlook or Apple Calendar from any action.</p>
      {(Object.keys(CHANNEL_HELP) as ShareChannel[]).map((c) => {
        const saved = !!integrations[CHANNEL_HELP[c].field];
        return (
          <div key={c} className="rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900">{CHANNEL_LABELS[c]}</span>
              {saved && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-700"><CheckCircle2 className="w-3 h-3" /> Connected</span>}
            </div>
            <p className="text-xs text-slate-500">{CHANNEL_HELP[c].how}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input value={drafts[c]} onChange={(e) => setDrafts((d) => ({ ...d, [c]: e.target.value }))} placeholder={CHANNEL_HELP[c].placeholder} className="h-10 rounded-xl font-mono text-xs" aria-label={`${CHANNEL_LABELS[c]} webhook URL`} />
              <div className="flex gap-2">
                <Button variant="outline" className="h-10 rounded-xl font-bold" onClick={() => test(c)} disabled={!drafts[c].trim() || testing === c}>
                  {testing === c ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}<span className="ml-1.5">Test</span>
                </Button>
                <Button className="h-10 rounded-xl font-bold" onClick={() => save(c)}>Save</Button>
              </div>
            </div>
          </div>
        );
      })}
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-500">
        Coming next: sign in with Microsoft 365 or Google Workspace to sync Outlook and Gmail, post to Teams without webhooks, and read Google Sheets and Excel files directly from OneDrive and Drive.
      </div>
    </SectionShell>
  );
}

export function OnboardingSection() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { restartTour, onboardingComplete } = useGrowthStore();
  return (
    <SectionShell icon={Compass} title="Plan & tour">
      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" className="rounded-xl font-bold" onClick={() => navigate('/onboarding')}>
          <RotateCcw className="w-4 h-4 mr-2" /> {onboardingComplete ? 'Redo the AI interview' : 'Start the AI interview'}
        </Button>
        <Button variant="outline" className="rounded-xl font-bold" disabled={!onboardingComplete} onClick={() => { restartTour(); navigate('/plan'); toast({ title: 'Tour restarted' }); }}>
          <Compass className="w-4 h-4 mr-2" /> Replay the product tour
        </Button>
      </div>
    </SectionShell>
  );
}
