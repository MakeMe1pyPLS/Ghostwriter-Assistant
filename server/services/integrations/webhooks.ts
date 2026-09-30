import { lookup } from 'node:dns/promises';
import net from 'node:net';

export type WebhookChannel = 'teams' | 'google-chat' | 'slack';

// Hosts each tool uses for incoming webhooks. Microsoft Teams now issues
// Workflows (Power Automate) URLs on *.logic.azure.com / *.powerplatform.com;
// older connectors used *.webhook.office.com.
const ALLOWED_HOSTS: Record<WebhookChannel, RegExp[]> = {
  teams: [/\.webhook\.office\.com$/i, /\.logic\.azure\.com$/i, /\.powerplatform\.com$/i, /\.powerautomate\.com$/i],
  'google-chat': [/^chat\.googleapis\.com$/i],
  slack: [/^hooks\.slack\.com$/i],
};

export function isAllowedWebhook(channel: WebhookChannel, url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && ALLOWED_HOSTS[channel].some((re) => re.test(u.hostname));
  } catch {
    return false;
  }
}

interface NotifyInput {
  channel: WebhookChannel;
  webhookUrl: string;
  title: string;
  text: string;
  link?: string;
  facts?: { name: string; value: string }[];
}

function payloadFor(n: NotifyInput): unknown {
  const factsText = (n.facts || []).map((f) => `${f.name}: ${f.value}`).join('\n');
  if (n.channel === 'google-chat') {
    return { text: `*${n.title}*\n${n.text}${factsText ? '\n' + factsText : ''}${n.link ? `\n<${n.link}|Open in ChainInsideIQ>` : ''}` };
  }
  if (n.channel === 'slack') {
    return { text: `*${n.title}*\n${n.text}${factsText ? '\n' + factsText : ''}${n.link ? `\n<${n.link}|Open in ChainInsideIQ>` : ''}` };
  }
  // Microsoft Teams: an Adaptive Card works for both Workflows and legacy connectors.
  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          { type: 'TextBlock', text: n.title, weight: 'Bolder', size: 'Medium', wrap: true },
          ...(n.text ? [{ type: 'TextBlock', text: n.text, wrap: true }] : []),
          ...(n.facts?.length ? [{ type: 'FactSet', facts: n.facts.map((f) => ({ title: f.name, value: f.value })) }] : []),
        ],
        actions: n.link ? [{ type: 'Action.OpenUrl', title: 'Open in ChainInsideIQ', url: n.link }] : [],
      },
    }],
  };
}

export async function postWebhook(n: NotifyInput): Promise<void> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(n.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadFor(n)),
      signal: ctrl.signal,
      redirect: 'error',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } finally {
    clearTimeout(timer);
  }
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') ||
    (v.startsWith('::ffff:') && isPrivateIp(v.slice(7)));
}

/**
 * Rejects URLs that point at private, loopback or cloud-metadata addresses so
 * user-supplied import URLs cannot be used to probe internal networks.
 */
export async function assertPublicHttpUrl(url: string): Promise<void> {
  let u: URL;
  try { u = new URL(url); } catch { throw new Error('Enter a full URL starting with https://'); }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('Only http and https URLs are supported.');
  if (u.username || u.password) throw new Error('Remove the username and password from the URL and use a header instead.');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (/^(localhost|metadata\.google\.internal)$/i.test(host) || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('That address is not reachable from ChainInsideIQ.');
  }
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new Error('That address could not be found.');
  if (addrs.some((a) => isPrivateIp(a.address))) throw new Error('That address is not reachable from ChainInsideIQ.');
}
