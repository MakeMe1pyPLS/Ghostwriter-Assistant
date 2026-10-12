import { useState } from "react";
import { Link } from "wouter";
import { Share2, Mail, Copy, Check, Loader2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useGrowthStore } from "@/hooks/use-growth-store";
import { CHANNEL_LABELS, mailtoLink, sendToChannel, type ShareChannel, type ShareMessage } from "@/lib/share";

function TeamsIcon() {
  return <span className="w-4 h-4 rounded-[4px] bg-[#5059C9] text-white text-[9px] font-black flex items-center justify-center" aria-hidden>T</span>;
}
function GChatIcon() {
  return <span className="w-4 h-4 rounded-[4px] bg-[#1E8E3E] text-white text-[9px] font-black flex items-center justify-center" aria-hidden>G</span>;
}
function SlackIcon() {
  return <span className="w-4 h-4 rounded-[4px] bg-[#4A154B] text-white text-[9px] font-black flex items-center justify-center" aria-hidden>S</span>;
}
const ICONS = { teams: TeamsIcon, "google-chat": GChatIcon, slack: SlackIcon } satisfies Record<ShareChannel, unknown>;

export function ShareMenu({ message, label = "Share", size = "sm", variant = "outline", className = "" }: {
  message: () => ShareMessage;
  label?: string;
  size?: "sm" | "default" | "icon";
  variant?: "outline" | "ghost" | "default";
  className?: string;
}) {
  const { toast } = useToast();
  const integrations = useGrowthStore((s) => s.integrations);
  const [busy, setBusy] = useState<ShareChannel | null>(null);
  const [copied, setCopied] = useState(false);

  const connected: Record<ShareChannel, boolean> = {
    teams: !!integrations.teamsWebhook,
    'google-chat': !!integrations.googleChatWebhook,
    slack: !!integrations.slackWebhook,
  };

  const send = async (channel: ShareChannel) => {
    setBusy(channel);
    try {
      await sendToChannel(channel, message());
      toast({ title: `Sent to ${CHANNEL_LABELS[channel]}`, description: "Your team can see it in the channel now." });
    } catch (err: any) {
      toast({ title: `Couldn’t send to ${CHANNEL_LABELS[channel]}`, description: err?.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const asText = () => {
    const m = message();
    return [m.title, '', m.text, ...(m.facts || []).map((f) => `${f.name}: ${f.value}`), m.link ? `\n${m.link}` : ''].join('\n').trim();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: "Copied", description: "Paste it anywhere: email, chat or a doc." });
    } catch {
      toast({ title: "Couldn’t copy", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={`rounded-xl font-bold ${className}`} aria-label={label}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          {size !== "icon" && <span className="ml-2">{label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-xl">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Send to</DropdownMenuLabel>
        {(Object.keys(CHANNEL_LABELS) as ShareChannel[]).map((c) => {
          const Icon = ICONS[c];
          return connected[c] ? (
            <DropdownMenuItem key={c} onSelect={() => send(c)} className="gap-2 font-medium">
              <Icon /> {CHANNEL_LABELS[c]}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={c} asChild className="gap-2 text-slate-400">
              <Link href="/settings#integrations"><Icon /> Connect {CHANNEL_LABELS[c]}</Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2 font-medium">
          <a href={mailtoLink(message().title, asText())}><Mail className="w-4 h-4" /> Email (Outlook, Gmail…)</a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); copy(); }} className="gap-2 font-medium">
          {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />} Copy as text
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2 text-xs text-slate-500">
          <Link href="/settings#integrations"><Settings2 className="w-3.5 h-3.5" /> Manage connections</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
