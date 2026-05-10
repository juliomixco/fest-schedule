import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes, format, parseISO } from "date-fns";
import { useSelectionStore } from "../../stores";
import { resolveThumbnail } from "../../services/thumbnails";
import type { Act, Festival } from "../../types";

interface MyScheduleViewProps {
  festival: Festival;
  festivalId: string;
}

interface OverlapSegment {
  topPct: number;
  heightPct: number;
  color: string;
  conflictName: string;
  conflictStageName: string;
  overlapStart: string; // HH:mm
  overlapEnd: string; // HH:mm
  overlapMinutes: number;
  // raw ms for mini-timeline
  actStartMs: number;
  actEndMs: number;
  conflictStartMs: number;
  conflictEndMs: number;
  overlapStartMs: number;
  overlapEndMs: number;
  actColor: string;
}

interface ScheduleRowProps {
  act: Act;
  stageColor: string;
  stageName: string;
  conflicted: boolean;
  festivalId: string;
  overlapSegments: OverlapSegment[];
  expanded: boolean;
  onToggleExpand: () => void;
}

function MiniTimeline({
  seg,
  actName,
  actColor,
}: {
  seg: OverlapSegment;
  actName: string;
  actColor: string;
}) {
  const winS = Math.min(seg.actStartMs, seg.conflictStartMs);
  const winE = Math.max(seg.actEndMs, seg.conflictEndMs);
  const winDur = winE - winS;
  const pct = (ms: number) => ((ms - winS) / winDur) * 100;

  const actLeft = pct(seg.actStartMs);
  const actW = pct(seg.actEndMs) - actLeft;
  const confLeft = pct(seg.conflictStartMs);
  const confW = pct(seg.conflictEndMs) - confLeft;
  const ovLeft = pct(seg.overlapStartMs);
  const ovW = pct(seg.overlapEndMs) - ovLeft;

  return (
    <div className="mt-3 select-none">
      {/* Act row */}
      <div className="mb-1">
        <p className="text-[10px] text-neutral-400 mb-0.5 truncate">
          {actName}
        </p>
        <div className="relative h-4 rounded bg-white/5 w-full">
          <div
            className="absolute h-full rounded opacity-80"
            style={{
              left: `${actLeft}%`,
              width: `${actW}%`,
              backgroundColor: actColor,
            }}
          />
          <div
            className="absolute h-full rounded"
            style={{
              left: `${ovLeft}%`,
              width: `${ovW}%`,
              backgroundColor: "#facc15",
              opacity: 0.5,
            }}
          />
        </div>
      </div>
      {/* Conflict row */}
      <div className="mb-2">
        <p className="text-[10px] text-neutral-400 mb-0.5 truncate">
          {seg.conflictName}
        </p>
        <div className="relative h-4 rounded bg-white/5 w-full">
          <div
            className="absolute h-full rounded opacity-80"
            style={{
              left: `${confLeft}%`,
              width: `${confW}%`,
              backgroundColor: seg.color,
            }}
          />
          <div
            className="absolute h-full rounded"
            style={{
              left: `${ovLeft}%`,
              width: `${ovW}%`,
              backgroundColor: "#facc15",
              opacity: 0.5,
            }}
          />
        </div>
      </div>
      {/* Time labels */}
      <div className="relative h-3 w-full text-[9px] text-neutral-500">
        <span className="absolute" style={{ left: `${actLeft}%` }}>
          {format(new Date(seg.actStartMs), "HH:mm")}
        </span>
        <span
          className="absolute"
          style={{ left: `${ovLeft}%`, color: "#facc15" }}
        >
          {seg.overlapStart}
        </span>
        <span
          className="absolute"
          style={{
            left: `${ovLeft + ovW}%`,
            color: "#facc15",
            transform: "translateX(-100%)",
          }}
        >
          {seg.overlapEnd}
        </span>
        <span
          className="absolute"
          style={{ left: `${actLeft + actW}%`, transform: "translateX(-100%)" }}
        >
          {format(new Date(seg.actEndMs), "HH:mm")}
        </span>
      </div>
    </div>
  );
}

function OverlapDetailPanel({
  segs,
  actName,
  actColor,
}: {
  segs: OverlapSegment[];
  actName: string;
  actColor: string;
}) {
  return (
    <div
      className="mt-2 rounded-lg border border-white/10 bg-neutral-900/80 p-3 text-xs text-white"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="font-semibold text-yellow-400 mb-2">
        ⚠ Conflicts ({segs.length})
      </p>
      {segs.map((seg) => (
        <div
          key={`${seg.conflictName}-${seg.overlapStart}`}
          className="mb-4 last:mb-0"
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="font-bold" style={{ color: seg.color }}>
                {seg.conflictName}
              </p>
              <p className="text-neutral-400">{seg.conflictStageName}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-yellow-300">
                {seg.overlapMinutes} min
              </p>
              <p className="text-neutral-400">
                {seg.overlapStart} – {seg.overlapEnd}
              </p>
            </div>
          </div>
          <MiniTimeline seg={seg} actName={actName} actColor={actColor} />
        </div>
      ))}
    </div>
  );
}

function ScheduleRow({
  act,
  stageColor,
  stageName,
  conflicted,
  festivalId,
  overlapSegments,
  expanded,
  onToggleExpand,
}: ScheduleRowProps) {
  const { data: thumbnail } = useQuery({
    queryKey: ["thumbnail", act.id],
    queryFn: () => resolveThumbnail(act.id, act.name, act.thumbnailUrl),
    staleTime: Infinity,
  });
  const { toggleAct } = useSelectionStore();
  const start = format(new Date(act.startTime), "HH:mm");
  const end = format(new Date(act.endTime), "HH:mm");

  return (
    <div className="mb-2">
      <div
        className={`relative flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-opacity
          ${conflicted ? "ring-2 ring-yellow-400" : ""}
          ${expanded ? "rounded-b-none" : ""}`}
        style={{
          backgroundColor: `${stageColor}22`,
          borderLeft: `4px solid ${stageColor}`,
        }}
        onClick={() => {
          if (overlapSegments.length > 0) onToggleExpand();
          else toggleAct(festivalId, act.id);
        }}
      >
        <img
          src={
            thumbnail ??
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="24" r="12" fill="%23555"/><ellipse cx="32" cy="50" rx="20" ry="14" fill="%23555"/></svg>'
          }
          alt={act.name}
          className="w-14 h-14 rounded object-cover object-top shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white truncate">{act.name}</p>
          <p className="text-sm text-neutral-400 truncate">{stageName}</p>
          <p className="text-sm text-neutral-300">
            {start} – {end}
          </p>
        </div>

        {/* Overlap indicator bar (decorative, click is on the card) */}
        {overlapSegments.length > 0 && (
          <div className="relative w-3 self-stretch shrink-0 rounded-full bg-white/10">
            {overlapSegments.map((seg) => (
              <div
                key={`${seg.conflictName}-${seg.topPct}`}
                className="absolute w-full rounded-full"
                style={{
                  top: `${seg.topPct}%`,
                  height: `${Math.max(seg.heightPct, 8)}%`,
                  backgroundColor: seg.color,
                  opacity: 0.85,
                }}
              />
            ))}
          </div>
        )}

        {/* Chevron for conflicting acts */}
        {overlapSegments.length > 0 && (
          <span className="text-yellow-400 text-xs shrink-0">
            {expanded ? "▲" : "▼"}
          </span>
        )}
      </div>

      {/* Expanded conflict detail panel */}
      {expanded && overlapSegments.length > 0 && (
        <div
          className="rounded-b-lg border-x-2 border-b-2 border-yellow-400/40"
          style={{ backgroundColor: `${stageColor}11` }}
        >
          <OverlapDetailPanel
            segs={overlapSegments}
            actName={act.name}
            actColor={stageColor}
          />
        </div>
      )}
    </div>
  );
}

function GapIndicator({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center gap-2 my-1 px-3 text-xs text-neutral-500">
      <div className="flex-1 border-t border-dashed border-neutral-700" />
      <span>{minutes} min gap</span>
      <div className="flex-1 border-t border-dashed border-neutral-700" />
    </div>
  );
}

interface DayDividerProps {
  label: string;
}
function DayDivider({ label }: DayDividerProps) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 border-t border-neutral-700" />
      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
        {label}
      </span>
      <div className="flex-1 border-t border-neutral-700" />
    </div>
  );
}

export function MyScheduleView({ festival, festivalId }: MyScheduleViewProps) {
  const { isSelected } = useSelectionStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filterDay, setFilterDay] = useState<string>("all");
  const [conflictsOnly, setConflictsOnly] = useState(false);

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedActs = useMemo(() => {
    const acts: (Act & { stageColor: string; stageName: string })[] = [];
    festival.days.forEach((day) => {
      day.stages.forEach((stage) => {
        stage.acts.forEach((act) => {
          if (isSelected(festivalId, act.id)) {
            acts.push({
              ...act,
              stageColor: stage.color ?? "#6b7280",
              stageName: stage.name,
            });
          }
        });
      });
    });
    return acts.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  }, [festival, festivalId, isSelected]);

  const overlapMap = useMemo(() => {
    const map = new Map<string, OverlapSegment[]>();
    for (let i = 0; i < selectedActs.length; i++) {
      for (let j = i + 1; j < selectedActs.length; j++) {
        const a = selectedActs[i];
        const b = selectedActs[j];
        if (a.stageId === b.stageId) continue;
        const aS = new Date(a.startTime).getTime();
        const aE = new Date(a.endTime).getTime();
        const bS = new Date(b.startTime).getTime();
        const bE = new Date(b.endTime).getTime();
        const overlapS = Math.max(aS, bS);
        const overlapE = Math.min(aE, bE);
        if (overlapS >= overlapE) continue;

        const aDur = aE - aS;
        const bDur = bE - bS;
        const overlapMins = Math.round((overlapE - overlapS) / 60000);
        const fmtOverlapS = format(new Date(overlapS), "HH:mm");
        const fmtOverlapE = format(new Date(overlapE), "HH:mm");

        const segForA: OverlapSegment = {
          topPct: ((overlapS - aS) / aDur) * 100,
          heightPct: ((overlapE - overlapS) / aDur) * 100,
          color: b.stageColor,
          conflictName: b.name,
          conflictStageName: b.stageName,
          overlapStart: fmtOverlapS,
          overlapEnd: fmtOverlapE,
          overlapMinutes: overlapMins,
          actStartMs: aS,
          actEndMs: aE,
          conflictStartMs: bS,
          conflictEndMs: bE,
          overlapStartMs: overlapS,
          overlapEndMs: overlapE,
          actColor: a.stageColor,
        };
        const segForB: OverlapSegment = {
          topPct: ((overlapS - bS) / bDur) * 100,
          heightPct: ((overlapE - overlapS) / bDur) * 100,
          color: a.stageColor,
          conflictName: a.name,
          conflictStageName: a.stageName,
          overlapStart: fmtOverlapS,
          overlapEnd: fmtOverlapE,
          overlapMinutes: overlapMins,
          actStartMs: bS,
          actEndMs: bE,
          conflictStartMs: aS,
          conflictEndMs: aE,
          overlapStartMs: overlapS,
          overlapEndMs: overlapE,
          actColor: b.stageColor,
        };

        map.set(a.id, [...(map.get(a.id) ?? []), segForA]);
        map.set(b.id, [...(map.get(b.id) ?? []), segForB]);
      }
    }
    return map;
  }, [selectedActs]);

  // Derive unique days present in selection
  const availableDays = useMemo(() => {
    const seen = new Map<string, string>(); // dateKey -> label
    selectedActs.forEach((act) => {
      const d = act.startTime.slice(0, 10); // "2026-06-18"
      if (!seen.has(d)) {
        seen.set(d, format(parseISO(d), "EEE, MMM d"));
      }
    });
    return [...seen.entries()]; // [dateKey, label][]
  }, [selectedActs]);

  const conflictedActIds = [...overlapMap.keys()];
  const allExpanded =
    conflictedActIds.length > 0 &&
    conflictedActIds.every((id) => expandedIds.has(id));

  const toggleAll = () => {
    if (allExpanded) setExpandedIds(new Set());
    else setExpandedIds(new Set(conflictedActIds));
  };

  // Apply filters
  const filteredActs = useMemo(() => {
    return selectedActs.filter((act) => {
      if (filterDay !== "all" && !act.startTime.startsWith(filterDay))
        return false;
      if (conflictsOnly && !overlapMap.has(act.id)) return false;
      return true;
    });
  }, [selectedActs, filterDay, conflictsOnly, overlapMap]);

  // Build rows with day dividers
  const rows: React.ReactNode[] = [];
  let lastDay = "";
  filteredActs.forEach((act, i) => {
    const dayKey = act.startTime.slice(0, 10);
    if (dayKey !== lastDay) {
      const label = format(parseISO(dayKey), "EEEE, MMMM d");
      rows.push(<DayDivider key={`day-${dayKey}`} label={label} />);
      lastDay = dayKey;
    } else if (i > 0) {
      const prev = filteredActs[i - 1];
      const gap = differenceInMinutes(
        new Date(act.startTime),
        new Date(prev.endTime),
      );
      if (gap > 0)
        rows.push(<GapIndicator key={`gap-${act.id}`} minutes={gap} />);
    }
    rows.push(
      <ScheduleRow
        key={act.id}
        act={act}
        stageColor={act.stageColor}
        stageName={act.stageName}
        conflicted={overlapMap.has(act.id)}
        festivalId={festivalId}
        overlapSegments={overlapMap.get(act.id) ?? []}
        expanded={expandedIds.has(act.id)}
        onToggleExpand={() => toggleExpand(act.id)}
      />,
    );
  });

  if (selectedActs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500">
        <p className="text-lg">No acts selected yet.</p>
        <p className="text-sm mt-1">
          Go to the Timeline and tap acts to add them here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Pinned header */}
      <div className="shrink-0 bg-neutral-950/95 backdrop-blur border-b border-neutral-800 px-4 pt-3 pb-2 z-20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-white">My Schedule</h2>
          {conflictedActIds.length > 0 && (
            <button
              className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
              onClick={toggleAll}
            >
              {allExpanded ? "Collapse all" : "Expand all conflicts"}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap pb-1">
          {/* Day filter pills */}
          <button
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filterDay === "all"
                ? "bg-white text-neutral-900 border-white"
                : "border-neutral-600 text-neutral-400 hover:border-neutral-400"
            }`}
            onClick={() => setFilterDay("all")}
          >
            All days
          </button>
          {availableDays.map(([key, label]) => (
            <button
              key={key}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filterDay === key
                  ? "bg-white text-neutral-900 border-white"
                  : "border-neutral-600 text-neutral-400 hover:border-neutral-400"
              }`}
              onClick={() => setFilterDay(filterDay === key ? "all" : key)}
            >
              {label}
            </button>
          ))}

          {/* Conflicts only toggle */}
          {conflictedActIds.length > 0 && (
            <button
              className={`text-xs px-3 py-1 rounded-full border transition-colors ml-auto ${
                conflictsOnly
                  ? "bg-yellow-400 text-neutral-900 border-yellow-400"
                  : "border-neutral-600 text-neutral-400 hover:border-yellow-500"
              }`}
              onClick={() => setConflictsOnly((v) => !v)}
            >
              ⚠ Conflicts only
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div id="my-schedule-root" className="flex-1 overflow-y-auto px-4 py-3">
        {filteredActs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-neutral-500 text-sm">
            No acts match the current filters.
          </div>
        ) : (
          rows
        )}
      </div>
    </div>
  );
}
