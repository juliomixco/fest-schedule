import { useState } from 'react';
import { useFestivalStore, useThemeStore, useSelectionStore } from '../../stores';
import { exportToPng, exportToPdf, exportToJson, exportToIcal, buildShareLink } from '../../export';
import type { Act } from '../../types';

interface HeaderProps {
  view: 'timeline' | 'schedule' | 'festivals';
  setView: (v: 'timeline' | 'schedule' | 'festivals') => void;
}

export function Header({ view, setView }: HeaderProps) {
  const { theme, toggleTheme } = useThemeStore();
  const { festivals, activeFestivalId, setActiveFestival, activeDayId, setActiveDay } = useFestivalStore();
  const { selections } = useSelectionStore();
  const [exportOpen, setExportOpen] = useState(false);

  const festival = festivals.find((f) => f.id === activeFestivalId);
  const selectedActIds = activeFestivalId ? (selections[activeFestivalId] ?? new Set<string>()) : new Set<string>();

  const selectedActs: Act[] = festival
    ? festival.days
        .flatMap((d) => d.stages.flatMap((s) => s.acts))
        .filter((a) => selectedActIds.has(a.id))
    : [];

  async function handleExport(type: string) {
    setExportOpen(false);
    if (!festival) return;
    if (type === 'png') await exportToPng('my-schedule-root');
    if (type === 'pdf') await exportToPdf('my-schedule-root');
    if (type === 'json') exportToJson(festival, selectedActIds);
    if (type === 'ical') exportToIcal(selectedActs, festival.name);
    if (type === 'share') {
      const link = buildShareLink(festival.id, selectedActIds);
      await navigator.clipboard.writeText(link);
      alert('Share link copied to clipboard!');
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur border-b border-neutral-800">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2">
        <span className="font-black text-white text-lg tracking-tight">FestSchedule</span>

        {/* Festival selector */}
        {festivals.length > 0 && (
          <select
            className="bg-neutral-800 text-white text-sm rounded px-2 py-1 max-w-48 truncate"
            value={activeFestivalId ?? ''}
            onChange={(e) => setActiveFestival(e.target.value)}
          >
            {festivals.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        )}

        <div className="flex-1" />

        {/* View tabs */}
        {(['timeline', 'schedule', 'festivals'] as const).map((v) => (
          <button
            key={v}
            className={`text-sm px-3 py-1 rounded transition-colors capitalize
              ${view === v ? 'bg-violet-600 text-white' : 'text-neutral-400 hover:text-white'}`}
            onClick={() => setView(v)}
          >
            {v === 'festivals' ? 'Manage' : v === 'schedule' ? 'My Schedule' : 'Timeline'}
          </button>
        ))}

        {/* Export dropdown */}
        <div className="relative">
          <button
            className="text-sm px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white"
            onClick={() => setExportOpen((o) => !o)}
          >
            Export ▾
          </button>
          {exportOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-neutral-800 rounded-lg shadow-xl z-50 overflow-hidden">
              {[
                { key: 'pdf', label: 'PDF' },
                { key: 'png', label: 'PNG' },
                { key: 'json', label: 'JSON' },
                { key: 'ical', label: 'iCal (.ics)' },
                { key: 'share', label: 'Copy Share Link' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 transition-colors"
                  onClick={() => handleExport(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          className="text-lg px-2"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Day tabs */}
      {festival && view === 'timeline' && (
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto">
          {festival.days.map((day) => (
            <button
              key={day.id}
              className={`text-sm px-4 py-1 rounded-full whitespace-nowrap transition-colors
                ${activeDayId === day.id ? 'bg-violet-600 text-white' : 'text-neutral-400 hover:text-white'}`}
              onClick={() => setActiveDay(day.id)}
            >
              {day.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
