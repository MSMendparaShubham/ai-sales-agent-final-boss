import {
  CalendlyTimeSlot,
} from '@/types/voice';

export const DEFAULT_CALENDLY_BASE_URL =
  process.env.CALENDLY_EVENT_TYPE_URL ||
  'https://calendly.com/intentos-solutions/discovery';

export const PRESET_CALENDLY_TIMESLOTS: CalendlyTimeSlot[] = [
  {
    id: 'slot-1',
    time: '10:00 AM - 10:30 AM',
    period: 'Morning',
    availability: 'Fastest Response',
  },
  {
    id: 'slot-2',
    time: '11:30 AM - 12:00 PM',
    period: 'Morning',
    availability: 'Available',
  },
  {
    id: 'slot-3',
    time: '02:00 PM - 02:30 PM',
    period: 'Afternoon',
    recommended: true,
    availability: 'Popular',
  },
  {
    id: 'slot-4',
    time: '03:30 PM - 04:00 PM',
    period: 'Afternoon',
    availability: 'Available',
  },
  {
    id: 'slot-5',
    time: '04:30 PM - 05:00 PM',
    period: 'Late Afternoon',
    availability: 'Popular',
  },
];

export function getUpcomingBusinessDates(): { dateStr: string; label: string; isToday?: boolean }[] {
  const dates: { dateStr: string; label: string; isToday?: boolean }[] = [];
  const base = new Date();

  let added = 0;
  let offset = 0;

  while (added < 5) {
    const cur = new Date(base);
    cur.setDate(base.getDate() + offset);
    const day = cur.getDay();

    // Skip Saturday (6) and Sunday (0)
    if (day !== 0 && day !== 6) {
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const weekday = cur.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isToday = offset === 0;
      const isTomorrow = offset === 1;

      let prefix = `${weekday}, ${monthDay}`;
      if (isToday) prefix = `Today (${monthDay})`;
      else if (isTomorrow) prefix = `Tomorrow (${monthDay})`;

      dates.push({ dateStr, label: prefix, isToday });
      added++;
    }
    offset++;
  }

  return dates;
}

export function buildCalendlyUrl(params: {
  baseUrl?: string;
  leadName?: string;
  leadEmail?: string;
  companyName?: string;
  topic?: string;
}): string {
  const {
    baseUrl = DEFAULT_CALENDLY_BASE_URL,
    leadName = 'John Smith',
    leadEmail = 'john.smith@technova.com',
    companyName = 'Prospect Company',
    topic = 'Technical Architecture & Scoping Call',
  } = params;

  try {
    const url = new URL(baseUrl);
    if (leadName) url.searchParams.set('name', leadName);
    if (leadEmail) url.searchParams.set('email', leadEmail);
    if (companyName) url.searchParams.set('a1', companyName);
    if (topic) url.searchParams.set('a2', topic);
    return url.toString();
  } catch {
    const query = new URLSearchParams({
      name: leadName,
      email: leadEmail,
      a1: companyName,
      a2: topic,
    }).toString();
    return `${baseUrl}?${query}`;
  }
}

export function generateCalendlySmsText(params: {
  leadName?: string;
  calendlyUrl: string;
  companyName?: string;
}): string {
  const firstName = params.leadName?.split(' ')[0] || 'there';
  return `Hi ${firstName}, thanks for speaking with IntentOS! To speak directly with our solutions engineering team, pick a preferred timeslot that works for you on our team Calendly: ${params.calendlyUrl} — We look forward to meeting you!`;
}
