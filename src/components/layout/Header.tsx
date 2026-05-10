import { useState } from "react";
import {
  useFestivalStore,
  useThemeStore,
  useSelectionStore,
} from "../../stores";
import {
  exportToPng,
  exportToPdf,
  exportToJson,
  exportToIcal,
  buildShareLink,
} from "../../export";
import type { Act } from "../../types";

interface HeaderProps {
  view: "timeline" | "schedule" | "festivals";
  setView: (v: "timeline" | "schedule" | "festivals") => void;
}

export function Header({ view, setView }: HeaderProps) {
  const { theme, toggleTheme } = useThemeStore();
  const {
    festivals,
    activeFestivalId,
    setActiveFestival,
    activeDayId,
    setActiveDay,
  } = useFestivalStore();
  const { selections } = useSelectionStore();
  const [exportOpen, setExportOpen] = useState(false);

  const festival = festivals.find((f) => f.id === activeFestivalId);
  const selectedActIds = activeFestivalId
    ? (selections[activeFestivalId] ?? new Set<string>())
    : new Set<string>();

  const selectedActs: Act[] = festival
    ? festival.days
        .flatMap((d) => d.stages.flatMap((s) => s.acts))
        .filter((a) => selectedActIds.has(a.id))
    : [];

  async function handleExport(type: string) {
    setExportOpen(false);
    if (!festival) return;
    if (type === "png") await exportToPng("my-schedule-root");
    if (type === "pdf") await exportToPdf("my-schedule-root");
    if (type === "json") exportToJson(festival, selectedActIds);
    if (type === "ical") exportToIcal(selectedActs, festival.name);
    if (type === "share") {
      const link = buildShareLink(festival.id, selectedActIds);
      await navigator.clipboard.writeText(link);
      alert("Share link copied to clipboard!");
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur border-b border-neutral-800">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="font-black text-white text-base tracking-tight shrink-0">
            FestSchedule
          </span>

          {/* Festival selector */}
          {festivals.length > 0 && (
            <select
              className="bg-neutral-800 text-white text-xs rounded px-2 py-1 min-w-0 flex-1 truncate"
              value={activeFestivalId ?? ""}
              onChange={(e) => setActiveFestival(e.target.value)}
            >
              {festivals.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {/* Export dropdown */}
            <div className="relative">
              <button
                className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white"
                onClick={() => setExportOpen((o) => !o)}
                title="Export"
              >
                <span className="hidden sm:inline">Export </span>▾
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-neutral-800 rounded-lg shadow-xl z-50 overflow-hidden">
                  {[
                    { key: "pdf", label: "PDF" },
                    { key: "png", label: "PNG" },
                    { key: "json", label: "JSON" },
                    { key: "ical", label: "iCal (.ics)" },
                    { key: "share", label: "Copy Share Link" },
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
              className="text-base px-2"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        {/* Day tabs — only on timeline */}
        {festival && view === "timeline" && (
          <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
            {festival.days.map((day) => (
              <button
                key={day.id}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors
                  ${activeDayId === day.id ? "bg-violet-600 text-white" : "text-neutral-400 hover:text-white"}`}
                onClick={() => setActiveDay(day.id)}
              >
                {day.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Bottom nav bar (mobile-first tab bar) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-neutral-950/95 backdrop-blur border-t border-neutral-800 flex sm:hidden">
        {(["timeline", "schedule", "festivals"] as const).map((v) => {
          const label =
            v === "festivals"
              ? "Manage"
              : v === "schedule"
                ? "My Schedule"
                : "Timeline";
          const icon = v === "timeline" ? "📅" : v === "schedule" ? "⭐" : "🎪";
          return (
            <button
              key={v}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors
                ${view === v ? "text-violet-400" : "text-neutral-500"}`}
              onClick={() => setView(v)}
            >
              <span className="text-lg leading-none">{icon}</span>
              {label}
            </button>
          );
        })}
      </nav>

      {/* Desktop nav — hidden on mobile (handled by bottom bar above) */}
      <div className="hidden sm:flex sticky top-0 z-20 bg-neutral-950/80 backdrop-blur border-b border-neutral-800 px-4 gap-1 py-1">
        {(["timeline", "schedule", "festivals"] as const).map((v) => (
          <button
            key={v}
            className={`text-sm px-3 py-1 rounded transition-colors capitalize
              ${view === v ? "bg-violet-600 text-white" : "text-neutral-400 hover:text-white"}`}
            onClick={() => setView(v)}
          >
            {v === "festivals"
              ? "Manage"
              : v === "schedule"
                ? "My Schedule"
                : "Timeline"}
          </button>
        ))}
      </div>
    </>
  );
}
