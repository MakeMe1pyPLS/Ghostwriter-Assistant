// "Add to calendar" links for action due dates. These use each calendar's
// public URL format, so they work without any API connection.
export interface CalendarEvent {
  title: string;
  details?: string;
  date: string; // yyyy-mm-dd (all-day)
}

const compact = (d: string) => d.replace(/-/g, '');
function nextDay(d: string) {
  const dt = new Date(d + 'T00:00:00');
  dt.setDate(dt.getDate() + 1);
  return dt.toISOString().slice(0, 10);
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    details: e.details || '',
    dates: `${compact(e.date)}/${compact(nextDay(e.date))}`,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function outlookCalendarUrl(e: CalendarEvent): string {
  const p = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: e.title,
    body: e.details || '',
    startdt: e.date,
    enddt: nextDay(e.date),
    allday: 'true',
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${p.toString()}`;
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\;');

export function icsFile(events: CalendarEvent[]): Blob {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ChainInsideIQ//Growth Plan//EN', 'CALSCALE:GREGORIAN',
    ...events.flatMap((e, i) => [
      'BEGIN:VEVENT',
      `UID:${stamp}-${i}@chaininsideiq`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(e.date)}`,
      `DTEND;VALUE=DATE:${compact(nextDay(e.date))}`,
      `SUMMARY:${esc(e.title)}`,
      ...(e.details ? [`DESCRIPTION:${esc(e.details)}`] : []),
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ];
  return new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
}

export function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
