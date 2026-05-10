import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Festival, Act } from '../types';

// ---------------------------------------------------------------------------
// PNG export
// ---------------------------------------------------------------------------
export async function exportToPng(elementId: string, filename = 'my-schedule.png') {
  const el = document.getElementById(elementId);
  if (!el) throw new Error(`Element #${elementId} not found`);
  const canvas = await html2canvas(el, { useCORS: true, backgroundColor: '#0a0a0a' });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ---------------------------------------------------------------------------
// PDF export
// ---------------------------------------------------------------------------
export async function exportToPdf(elementId: string, filename = 'my-schedule.pdf') {
  const el = document.getElementById(elementId);
  if (!el) throw new Error(`Element #${elementId} not found`);
  const canvas = await html2canvas(el, { useCORS: true, backgroundColor: '#0a0a0a', scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(filename);
}

// ---------------------------------------------------------------------------
// JSON export
// ---------------------------------------------------------------------------
export function exportToJson(festival: Festival, selectedActIds: Set<string>) {
  const data = { festival, selectedActIds: [...selectedActIds] };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = `${festival.name.replace(/\s+/g, '-').toLowerCase()}.json`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

// ---------------------------------------------------------------------------
// iCal export
// ---------------------------------------------------------------------------
function escapeIcal(str: string) {
  return str.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
}

function toIcalDate(iso: string) {
  return iso.replace(/[-:]/g, '').replace(/\.\d+/, '');
}

export function exportToIcal(acts: Act[], festivalName: string) {
  const now = toIcalDate(new Date().toISOString());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FestSchedule//EN',
    'CALSCALE:GREGORIAN',
  ];

  acts.forEach((act) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${act.id}@festschedule`,
      `DTSTAMP:${now}`,
      `DTSTART:${toIcalDate(act.startTime)}`,
      `DTEND:${toIcalDate(act.endTime)}`,
      `SUMMARY:${escapeIcal(act.name)}`,
      `DESCRIPTION:${escapeIcal(festivalName)}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const link = document.createElement('a');
  link.download = `${festivalName.replace(/\s+/g, '-').toLowerCase()}.ics`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

// ---------------------------------------------------------------------------
// Share link
// ---------------------------------------------------------------------------
export function buildShareLink(festivalId: string, actIds: Set<string>): string {
  const params = new URLSearchParams({ f: festivalId, s: [...actIds].join(',') });
  return `${window.location.origin}${window.location.pathname}#share?${params}`;
}

export function parseShareLink(hash: string): { festivalId: string; actIds: string[] } | null {
  const match = hash.match(/^#share\?(.+)$/);
  if (!match) return null;
  const params = new URLSearchParams(match[1]);
  const festivalId = params.get('f');
  const s = params.get('s');
  if (!festivalId || !s) return null;
  return { festivalId, actIds: s.split(',').filter(Boolean) };
}
