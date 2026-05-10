import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useFestivalStore } from "../../stores";
import type { Festival } from "../../types";

const AI_SCHEMA = `{
  "id": "unique-string",
  "name": "Festival Name",
  "website": "https://festival-site.com",
  "days": [
    {
      "id": "unique-string",
      "label": "Thursday",
      "date": "2026-06-18",
      "stages": [
        {
          "id": "unique-string",
          "name": "STAGE NAME",
          "acts": [
            {
              "id": "unique-string",
              "name": "BAND NAME",
              "startTime": "2026-06-18T14:00:00.000Z",
              "endTime": "2026-06-18T15:00:00.000Z",
              "stageId": "<same as parent stage id>",
              "dayId": "<same as parent day id>",
              "url": "https://festival-site.com/bands/band-name"
            }
          ]
        }
      ]
    }
  ]
}`;

function buildAiPrompt(url: string): string {
  // Derive all day URLs if it's a known pattern (e.g. graspop /thursday/schedule)
  const dayMatch = url.match(/\/line-up\/([a-z]+)\/schedule/i);
  const dayUrls = dayMatch
    ? ["thursday", "friday", "saturday", "sunday"]
        .map((d) => url.replace(`/${dayMatch[1]}/`, `/${d}/`))
        .join("\n- ")
    : url;

  return `You are a data extraction assistant. Visit the following festival schedule page(s) and extract the full lineup into a single JSON object matching the schema below. Use ISO 8601 datetime strings for startTime/endTime (handle acts past midnight correctly — e.g. 00:30 on a Thursday night is 2026-06-19T00:30:00.000Z). Generate a unique short id (e.g. a short UUID or slug) for every id field. Do not omit any acts or stages.

URLs to fetch:
- ${dayUrls}

Return ONLY valid JSON, no markdown, no explanation.

Schema:
${AI_SCHEMA}`;
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

  // Festival list state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // AI import state
  const [aiUrl, setAiUrl] = useState("");
  const [aiPromptVisible, setAiPromptVisible] = useState(false);
  const [aiJson, setAiJson] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // JSON file import state
  const [fileError, setFileError] = useState<string | null>(null);

  async function handleRename(id: string) {
    const festival = festivals.find((f) => f.id === id);
    if (!festival) return;
    await updateFestival({ ...festival, name: renameValue });
    setRenamingId(null);
  }

  function handleGeneratePrompt() {
    if (!aiUrl.trim()) return;
    setAiPromptVisible(true);
    setAiError(null);
    setAiJson("");
  }

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(buildAiPrompt(aiUrl));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAiImport() {
    setAiError(null);
    try {
      const parsed = JSON.parse(aiJson.trim()) as Festival;
      if (!parsed.id) parsed.id = uuidv4();
      // Ensure all nested ids exist
      parsed.days?.forEach((d) => {
        if (!d.id) d.id = uuidv4();
        d.stages?.forEach((s) => {
          if (!s.id) s.id = uuidv4();
          s.acts?.forEach((a) => {
            if (!a.id) a.id = uuidv4();
            a.stageId = s.id;
            a.dayId = d.id;
          });
        });
      });
      await addFestival(parsed);
      setAiUrl("");
      setAiJson("");
      setAiPromptVisible(false);
    } catch {
      setAiError("Could not parse the JSON. Make sure you pasted only the raw JSON from the AI response.");
    }
  }

  async function handleJsonFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    try {
      const text = await file.text();
      const festival: Festival = JSON.parse(text);
      if (!festival.id) festival.id = uuidv4();
      await addFestival(festival);
    } catch {
      setFileError("Invalid JSON file.");
    }
    e.target.value = "";
  }

  return (
    <div className="p-4 space-y-6 text-white max-w-2xl">
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
            No backend needed. Paste the festival URL, copy the generated prompt into ChatGPT or Copilot, then paste the JSON response back here.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 bg-neutral-800 rounded px-3 py-2 text-sm placeholder-neutral-500"
            placeholder="https://www.graspop.be/en/line-up/thursday/schedule"
            value={aiUrl}
            onChange={(e) => setAiUrl(e.target.value)}
          />
          <button
            className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded text-sm font-semibold disabled:opacity-40"
            onClick={handleGeneratePrompt}
            disabled={!aiUrl.trim()}
          >
            Generate prompt
          </button>
        </div>

        {aiPromptVisible && (
          <div className="space-y-2">
            <div className="relative">
              <pre className="bg-neutral-900 rounded-lg p-3 text-xs text-neutral-300 overflow-auto max-h-48 whitespace-pre-wrap">
                {buildAiPrompt(aiUrl)}
              </pre>
              <button
                className="absolute top-2 right-2 bg-violet-600 hover:bg-violet-500 text-white text-xs px-2 py-1 rounded"
                onClick={handleCopyPrompt}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Paste this into <strong className="text-white">ChatGPT</strong> or <strong className="text-white">GitHub Copilot Chat</strong> (with web browsing enabled), then paste the JSON response below:
            </p>

            <textarea
              className="w-full bg-neutral-900 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder-neutral-600 min-h-32 font-mono"
              placeholder={'{\n  "id": "...",\n  "name": "Festival Name",\n  ...\n}'}
              value={aiJson}
              onChange={(e) => setAiJson(e.target.value)}
            />

            {aiError && <p className="text-xs text-red-400">{aiError}</p>}

            <button
              className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm font-semibold disabled:opacity-40"
              onClick={handleAiImport}
              disabled={!aiJson.trim()}
            >
              Import JSON
            </button>
          </div>
        )}
      </div>

      {/* ── JSON file import ── */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-neutral-300">Import from JSON file</label>
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
