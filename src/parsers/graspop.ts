import { v4 as uuidv4 } from 'uuid';
import { parse, addDays } from 'date-fns';
import type { Act, Stage } from '../types';
import type { FestivalParser } from './types';

const STAGE_COLORS: Record<string, string> = {
  'SOUTH STAGE': '#e11d48',
  'NORTH STAGE': '#2563eb',
  'MARQUEE': '#7c3aed',
  'JUPILER STAGE': '#d97706',
  'METAL DOME': '#059669',
  'CLASSIC ROCK CAFÉ': '#db2777',
};

function proxyUrl(url: string): string {
  const proxy = import.meta.env.VITE_CORS_PROXY_URL;
  if (!proxy) return url;
  return `${proxy}?url=${encodeURIComponent(url)}`;
}

/**
 * Parse "HH.MM" into a full ISO datetime string.
 * Times < 10:00 are treated as next-day (past midnight).
 */
function parseTime(dayDate: string, timeStr: string): string {
  const [hStr, mStr] = timeStr.split('.');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const baseDate = parse(dayDate, 'yyyy-MM-dd', new Date());
  const date = h < 10 ? addDays(baseDate, 1) : baseDate;
  date.setHours(h, m, 0, 0);
  return date.toISOString();
}

const DAY_ORDER = ['thursday', 'friday', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday'];

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(proxyUrl(url));
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** Parse a single day's schedule HTML into Stage[]. dayDate may be '' if unknown. */
function parseDayHtml(html: string, dayDate: string): { stages: Stage[] } {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const stagesMap = new Map<string, Stage>();

  doc.querySelectorAll('h2').forEach((h2) => {
    const stageName = h2.textContent?.trim().toUpperCase() ?? '';
    if (!stageName) return;

    const stageId = uuidv4();
    const color = STAGE_COLORS[stageName] ?? '#6b7280';
    const acts: Act[] = [];

    let el: Element | null = h2.nextElementSibling;
    while (el && el.tagName !== 'H2') {
      const link = el.tagName === 'A' ? el : el.querySelector('a');
      if (link) {
        const text = link.textContent?.trim() ?? '';
        const match = text.match(/^(.+?)\s+(\d{1,2}\.\d{2})\s*[-\u2013]\s*(\d{1,2}\.\d{2})$/);
        if (match) {
          const [, name, startRaw, endRaw] = match;
          const thumbnail = link.querySelector('img')?.getAttribute('src') ?? undefined;
          acts.push({
            id: uuidv4(),
            name: name.trim(),
            startTime: dayDate ? parseTime(dayDate, startRaw) : '',
            endTime: dayDate ? parseTime(dayDate, endRaw) : '',
            stageId,
            dayId: '', // backfilled by caller
            url: (link as HTMLAnchorElement).href || undefined,
            thumbnailUrl: thumbnail,
          });
        }
      }
      el = el.nextElementSibling;
    }

    if (acts.length > 0 && !stagesMap.has(stageName)) {
      stagesMap.set(stageName, { id: stageId, name: stageName, color, acts });
    }
  });

  return { stages: [...stagesMap.values()] };
}

/**
 * Try to infer the festival start date from visible page text.
 * Graspop pages contain text like "18 19 20 21 june 2026".
 */
function inferStartDate(pageText: string): Date | null {
  const fullMatch = pageText.match(
    /(\d{1,2})(?:\s+\d{1,2}){0,6}\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i
  );
  if (fullMatch) {
    const d = parse(`${fullMatch[1]} ${fullMatch[2]} ${fullMatch[3]}`, 'd MMMM yyyy', new Date());
    if (!isNaN(d.getTime())) return d;
  }
  const rangeMatch = pageText.match(
    /(\d{1,2})-\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i
  );
  if (rangeMatch) {
    const d = parse(`${rangeMatch[1]} ${rangeMatch[2]} ${rangeMatch[3]}`, 'd MMMM yyyy', new Date());
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export const graspopParser: FestivalParser = {
  key: 'graspop',
  name: 'Graspop Metal Meeting',
  canParse: (url) => url.includes('graspop.be'),

  parse: async (startUrl) => {
    // 1. Fetch the initial page to discover all day navigation links
    const seedHtml = await fetchHtml(startUrl);
    const seedDoc = new DOMParser().parseFromString(seedHtml, 'text/html');

    // 2. Discover day schedule URLs from navigation
    const dayLinkPattern = /\/en\/line-up\/([a-z]+)\/schedule/i;
    const dayLinksFound = new Map<string, string>(); // slug → absolute URL

    // Always include the start URL
    const startMatch = startUrl.match(dayLinkPattern);
    if (startMatch) dayLinksFound.set(startMatch[1].toLowerCase(), startUrl);

    seedDoc.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
      const m = a.href.match(dayLinkPattern);
      if (m) {
        const slug = m[1].toLowerCase();
        if (!dayLinksFound.has(slug)) dayLinksFound.set(slug, a.href);
      }
    });

    // 3. Sort by typical week order
    const orderedDays = [...dayLinksFound.entries()].sort(
      ([a], [b]) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
    );

    // 4. Infer start date from page text
    const startDate = inferStartDate(seedDoc.body.textContent ?? '');

    // 5. Fetch and parse all days (re-use seed HTML for the starting day)
    const festivalId = uuidv4();
    const results = await Promise.allSettled(
      orderedDays.map(async ([daySlug, dayUrl], i) => {
        const dayDate = startDate ? addDays(startDate, i).toISOString().slice(0, 10) : '';
        const html = dayUrl === startUrl ? seedHtml : await fetchHtml(dayUrl);
        const { stages } = parseDayHtml(html, dayDate);
        const dayId = uuidv4();
        stages.forEach((s) => s.acts.forEach((a) => { a.dayId = dayId; }));
        return {
          id: dayId,
          label: daySlug.charAt(0).toUpperCase() + daySlug.slice(1),
          date: dayDate,
          stages,
        };
      })
    );

    results.forEach((r, i) => {
      if (r.status === 'rejected') console.warn(`Skipping day ${orderedDays[i][0]}:`, r.reason);
    });

    const days = results
      .filter((r): r is PromiseFulfilledResult<{ id: string; label: string; date: string; stages: Stage[] }> => r.status === 'fulfilled')
      .map((r) => r.value);

    const rawTitle = seedDoc.querySelector('title')?.textContent?.trim() ?? '';
    const festivalName = rawTitle.replace(/[-|].*$/, '').trim() || 'Graspop Metal Meeting';

    return {
      id: festivalId,
      name: festivalName,
      website: new URL(startUrl).origin,
      days,
      importedAt: new Date().toISOString(),
    };
  },
};


