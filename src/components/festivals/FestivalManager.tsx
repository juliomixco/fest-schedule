import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useFestivalStore } from "../../stores";
import type { Festival, Day, Stage, Act } from "../../types";

// ── Constants ──────────────────────────────────────────────────────────────

const GRASPOP_DAYS = [
  { slug: "thursday",  label: "Thursday",  date: "2026-06-18" },
  { slug: "friday",    label: "Friday",    date: "2026-06-19" },
  { slug: "saturday",  label: "Saturday",  date: "2026-06-20" },
  { slug: "sunday",    label: "Sunday",    date: "2026-06-21" },
];

const STAGE_COLOR_PALETTE = [
  "#e11d48", "#2563eb", "#7c3aed", "#d97706",
  "#059669", "#db2777", "#0891b2", "#65a30d",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function getDayInfos(url: string) {
  const match = url.match(/\/line-up\/([a-z]+)\/schedule/i);
  if (!match) return [{ slug: "day-1", label: "Day 1", url, date: "" }];
  return GRASPOP_DAYS.map(({ slug, label, date }) => ({
    slug,
    label,
    date,
    url: url.replace(`/${match[1]}/`, `/${slug}/`),
  }));
}

function buildDayPrompt(url: string, label: string, date: string): string {
  const nextDate = date
    ? new Date(new Date(date + "T12:00:00").getTime() + 86400000)
        .toISOString()
        .slice(0, 10)
    : "next-calendar-date";

  return `Visit this festival schedule page and extract EVERY act for every stage on this day.

URL: ${url}

STRICT RULES — follow exactly, do not deviate:
1. Include ALL stages and ALL acts — do NOT truncate, skip, or summarise any
2. Times use format YYYY-MM-DDThh:mm:ss — no Z suffix, no milliseconds
3. ${label} date is ${date || "(infer from page)"}
4. Acts ending past midnight (times 00:xx through 09:xx) belong to the NEXT date: ${nextDate}
5. Return ONLY raw JSON — no markdown code fences, no explanation, nothing else

Generate short unique slugs for all "id" fields (e.g. "south-stage", "megadeth-fri").

Required JSON structure:
{
  "date": "${date || "YYYY-MM-DD"}",
  "stages": [
    {
      "id": "stage-slug",
      "name": "STAGE NAME",
      "acts": [
        {
          "id": "act-slug",
          "name": "BAND NAME",
          "startTime": "${date || "YYYY-MM-DD"}T14:00:00",
          "endTime": "${date || "YYYY-MM-DD"}T15:00:00",
          "url": "https://festival-url/bands/band-name"
        }
      ]
    }
  ]
}`;
}

/** Convert any ISO time to a timezone-naive string: strips Z and milliseconds */
function normalizeTime(t: string): string {
  if (!t) return t;
  return t.replace(/\.\d+Z?$/, "").replace(/Z$/, "");
}

interface DayFragment {
  date?: string;
  stages: Array<{
    id?: string;
    name: string;
    color?: string;
    acts: Array<{
      id?: string;
      name: string;
      startTime: string;
      endTime: string;
      url?: string;
    }>;
  }>;
}

function parseDayFragment(json: string, dayId: string, fallbackDate: string, label: string): Day {
  const raw: DayFragment = JSON.parse(json.trim());
  const date = raw.date || fallbackDate;

  const stages: Stage[] = (raw.stages ?? []).map((rs, i) => {
    const stageId = rs.id || uuidv4();
    const acts: Act[] = (rs.acts ?? []).map((ra) => ({
      id: ra.id || uuidv4(),
      name: ra.name,
      startTime: normalizeTime(ra.startTime),
      endTime: normalizeTime(ra.endTime),
      stageId,
      dayId,
      url: ra.url,
    }));
    return {
      id: stageId,
      name: rs.name,
      color: rs.color || STAGE_COLOR_PALETTE[i % STAGE_COLOR_PALETTE.length],
      acts,
    };
  });

  return { id: dayId, label, date, stages };
}

function normalizeFestivalJson(raw: Festival): Festival {
  if (!raw.id) raw.id = uuidv4();
  raw.days?.forEach((d) => {
    if (!d.id) d.id = uuidv4();
    d.stages?.forEach((s, si) => {
      if (!s.id) s.id = uuidv4();
      if (!s.color) s.color = STAGE_COLOR_PALETTE[si % STAGE_COLOR_PALETTE.length];
      s.acts?.forEach((a) => {
        if (!a.id) a.id = uuidv4();
        a.stageId = s.id;
        a.dayId = d.id;
        a.startTime = normalizeTime(a.startTime);
        a.endTime = normalizeTime(a.endTime);
      });
    });
  });
  return raw;
}

// ── Component ──────────────────────────────────────────────────────────────

interface DayState {
  slug: string;
  label: string;
  url: string;
  date: string;
  json: string;
  copied: boolean;
  error: string | null;
}

export function FestivalManager() {
  const {
    festivals,
    activeFestivalId,
    addFestival,
    updateFestival,
    removeFestival,
    setActiveFestival,
  } = useFestivalStore();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // AI import
  const [aiUrl, setAiUrl] = useState("");
  const [festivalName, setFestivalName] = useState("");
  const [dayStates, setDayStates] = useState<DayState[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [setupDone, setSetupDone] = useState(false);

  // JSON file import
  const [fileError, setFileError] = useState<string | null>(null);

  async function handleRename(id: string) {
    const f = festivals.find((f) => f.id === id);
    if (!f) return;
    await updateFestival({ ...f, name: renameValue });
    setRenamingId(null);
  }

  function handleSetup() {
    if (!aiUrl.trim()) return;
    const infos = getDayInfos(aiUrl.trim());
    setDayStates(
      infos.map(({ slug, label, url, date }) => ({
        slug, label, url, date, json: "", copied: false, error: null,
      }))
    );
    setFestivalName("Festival");
    setSetupDone(true);
    setActiveTab(0);
    setImportError(null);
  }

  function updateDayJson(idx: number, json: string) {
    setDayStates((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, json, error: null } : d))
    );
  }

  async function handleCopy(idx: number) {
    const d = dayStates[idx];
    await navigator.clipboard.writeText(buildDayPrompt(d.url, d.label, d.date));
    setDayStates((prev) =>
      prev.map((day, i) => (i === idx ? { ...day, copied: true } : day))
    );
    setTimeout(
      () =>
        setDayStates((prev) =>
          prev.map((day, i) => (i === idx ? { ...day, copied: false } : day))
        ),
      2000
    );
  }

  async function handleImport() {
    setImportError(null);
    const festivalId = uuidv4();
    const days: Day[] = [];
    let hasError = false;

    const updated = dayStates.map((d) => {
      if (!d.json.trim()) return d;
      try {
        parseDayFragment(d.json, uuidv4(), d.date, d.label); // validate
        return { ...d, error: null };
      } catch {
        hasError = true;
        return { ...d, error: "Invalid JSON — check this day's AI response." };
      }
    });

    setDayStates(updated);
    if (hasError) {
      setImportError("Fix the errors above before importing.");
      return;
    }

    for (const d of updated) {
      if (!d.json.trim()) continue;
      const dayId = uuidv4();
      const day = parseDayFragment(d.json, dayId, d.date, d.label);
      days.push(day);
    }

    if (days.length === 0) {
      setImportError("Paste at least one day's JSON before importing.");
      return;
    }

    const festival: Festival = {
      id: festivalId,
      name: festivalName.trim() || "Festival",
      website: (() => { try { return new URL(aiUrl.trim()).origin; } catch { return aiUrl; } })(),
      days,
      importedAt: new Date().toISOString(),
    };

    await addFestival(festival);
    setAiUrl("");
    setFestivalName("");
    setDayStates([]);
    setSetupDone(false);
  }

  async function handleJsonFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    try {
      const raw = JSON.parse(await file.text());
      if (!raw.days) {
        setFileError("JSON must contain a 'days' array. Export a festival from this app first, or use the AI import.");
        e.target.value = "";
        return;
      }
      await addFestival(normalizeFestivalJson(raw as Festival));
    } catch {
      setFileError("Invalid JSON file.");
    }
    e.target.value = "";
  }

  const readyDays = dayStates.filter((d) => d.json.trim()).length;

  return (
    <div className="p-4 space-y-6 text-white max-w-2xl overflow-y-auto max-h-[calc(100vh-8rem)]">
      <h2 className="text-lg font-bold">Festivals</h2>

      {/* Festival list */}
      <ul className="space-y-2">
        {festivals.map((f) => (
          <li
            key={f.id}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors
              ${f.id === activeFestivalId ? "bg-neutral-700" : "bg-neutral-800 hover:bg-neutral-700"}`}
            onClick={() => setActiveFestival(f.id)}
          >
            {renamingId === f.id ? (
              <input
                className="flex-1 bg-neutral-600 rounded px-2 py-0.5 text-sm"
                value={renameValue}
                autoFocus
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename(f.id);
                  if (e.key === "Escape") setRenamingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 truncate text-sm">{f.name}</span>
            )}
            <button
              className="text-xs text-neutral-400 hover:text-white px-1"
              onClick={(e) => { e.stopPropagation(); setRenamingId(f.id); setRenameValue(f.name); }}
              title="Rename"
            >✏</button>
            <button
              className="text-xs text-red-400 hover:text-red-300 px-1"
              onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${f.name}"?`)) removeFestival(f.id); }}
              title="Delete"
            >✕</button>
          </li>
        ))}
        {festivals.length === 0 && (
          <p className="text-sm text-neutral-500">No festivals yet. Import one below.</p>
        )}
      </ul>

      {/* ── Import with AI ── */}
      <div className="space-y-3 border border-violet-700/50 rounded-xl p-4 bg-violet-950/20">
        <div>
          <p className="text-sm font-bold text-violet-300">Import with AI (ChatGPT / Copilot)</p>
          <p className="text-xs text-neutral-400 mt-0.5">
            One prompt per day — prevents AI truncation. Copy each prompt into ChatGPT with web browsing, paste the response back, then import.
          </p>
        </div>

        {!setupDone ? (
          <div className="flex gap-2">
            <input
              className="flex-1 bg-neutral-800 rounded px-3 py-2 text-sm placeholder-neutral-500"
              placeholder="https://www.graspop.be/en/line-up/thursday/schedule"
              value={aiUrl}
              onChange={(e) => setAiUrl(e.target.value)}
            />
            <button
              className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded text-sm font-semibold disabled:opacity-40"
              onClick={handleSetup}
              disabled={!aiUrl.trim()}
            >
              Set up
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Festival name + reset */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-400 shrink-0">Festival name:</label>
              <input
                className="flex-1 bg-neutral-800 rounded px-2 py-1 text-sm"
                value={festivalName}
                onChange={(e) => setFestivalName(e.target.value)}
              />
              <button
                className="text-xs text-neutral-500 hover:text-white shrink-0"
                onClick={() => setSetupDone(false)}
              >
                ← Change URL
              </button>
            </div>

            {/* Day tabs */}
            <div className="flex gap-1 flex-wrap">
              {dayStates.map((d, i) => (
                <button
                  key={d.slug}
                  onClick={() => setActiveTab(i)}
                  className={[
                    "text-xs px-3 py-1 rounded-full transition-colors",
                    activeTab === i ? "bg-violet-600 text-white" : "bg-neutral-800 text-neutral-400 hover:text-white",
                    d.error ? "ring-1 ring-red-500" : d.json.trim() ? "ring-1 ring-green-500" : "",
                  ].join(" ")}
                >
                  {d.label}{d.json.trim() && !d.error ? " ✓" : ""}
                </button>
              ))}
            </div>

            {/* Active day panel */}
            {dayStates[activeTab] && (() => {
              const d = dayStates[activeTab];
              return (
                <div className="space-y-2">
                  <div className="relative">
                    <pre className="bg-neutral-900 rounded-lg p-3 text-xs text-neutral-300 overflow-auto max-h-44 whitespace-pre-wrap">
                      {buildDayPrompt(d.url, d.label, d.date)}
                    </pre>
                    <button
                      className="absolute top-2 right-2 bg-violet-600 hover:bg-violet-500 text-white text-xs px-2 py-1 rounded"
                      onClick={() => handleCopy(activeTab)}
                    >
                      {d.copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Paste this into <strong className="text-white">ChatGPT</strong> (enable web browsing), then paste the JSON response below:
                  </p>
                  <textarea
                    className={[
                      "w-full bg-neutral-900 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder-neutral-600 min-h-28 font-mono",
                      d.error ? "ring-1 ring-red-500" : "",
                    ].join(" ")}
                    placeholder={`Paste ${d.label} JSON response here…`}
                    value={d.json}
                    onChange={(e) => updateDayJson(activeTab, e.target.value)}
                  />
                  {d.error && <p className="text-xs text-red-400">{d.error}</p>}
                </div>
              );
            })()}

            {importError && <p className="text-xs text-red-400">{importError}</p>}

            <button
              className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm font-semibold disabled:opacity-40"
              onClick={handleImport}
              disabled={readyDays === 0}
            >
              Import festival ({readyDays} of {dayStates.length} days ready)
            </button>
          </div>
        )}
      </div>

      {/* ── JSON file import ── */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-neutral-300">Import from JSON file</label>
        <p className="text-xs text-neutral-500">Import a previously exported festival JSON.</p>
        <input
          type="file"
          accept=".json"
          className="text-sm text-neutral-300"
          onChange={handleJsonFileImport}
        />
        {fileError && <p className="text-xs text-red-400">{fileError}</p>}
      </div>
    </div>
  );
}
