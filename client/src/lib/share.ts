// Sharing to Microsoft Teams, Google Chat, Slack and email.
// Chat tools use incoming webhooks the customer creates in that tool
// (Settings → Integrations). Email uses a mailto: link so it opens Outlook,
// Gmail or whatever mail app the user has set as default.
import { postJson } from '@/lib/api';
import { useGrowthStore } from '@/hooks/use-growth-store';

export type ShareChannel = 'teams' | 'google-chat' | 'slack';

export const CHANNEL_LABELS: Record<ShareChannel, string> = {
  teams: 'Microsoft Teams',
  'google-chat': 'Google Chat',
  slack: 'Slack',
};

export interface ShareMessage {
  title: string;
  text: string;
  link?: string;
  facts?: { name: string; value: string }[];
}

export function webhookFor(channel: ShareChannel): string | undefined {
  const i = useGrowthStore.getState().integrations;
  return channel === 'teams' ? i.teamsWebhook : channel === 'google-chat' ? i.googleChatWebhook : i.slackWebhook;
}

export function connectedChannels(): ShareChannel[] {
  return (['teams', 'google-chat', 'slack'] as ShareChannel[]).filter((c) => !!webhookFor(c));
}

export async function sendToChannel(channel: ShareChannel, msg: ShareMessage, webhookUrl = webhookFor(channel)): Promise<void> {
  if (!webhookUrl) throw new Error(`Connect ${CHANNEL_LABELS[channel]} in Settings → Integrations first.`);
  try {
    await postJson('/api/integrations/notify', { channel, webhookUrl, ...msg, link: msg.link && /^https?:/.test(msg.link) ? msg.link : undefined });
  } catch (err: any) {
    if (err?.status === 404 || err?.status === undefined || err?.status === 405) {
      throw new Error('Sending to chat tools needs the ChainInsideIQ server. It isn’t reachable from this deployment yet.');
    }
    throw err;
  }
}

export function mailtoLink(subject: string, body: string, to = ''): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function appLink(path: string): string {
  return typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;
}
