import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes, format } from "date-fns";
import { useSelectionStore } from "../../stores";
import { resolveThumbnail } from "../../services/thumbnails";
import type { Act, Festival } from "../../types";

interface OverlapSegment {
  topPct: number;
  heightPct: number;
  color: string;
  conflictName: string;
  conflictStageName: string;
  overlapStart: string; // HH:mm
  overlapEnd: string; // HH:mm
  overlapMinutes: number;
}

interface ScheduleRowProps {
  act: Act;
  stageColor: string;
  stageName: string;
  conflicted: boolean;
  festivalId: string;
  overlapSegments: OverlapSegment[];
}

function OverlapSegmentPin({ seg }: { seg: OverlapSegment }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="absolute w-full rounded-full"
      style={{
        top: `${seg.topPct}%`,
        height: `${seg.heightPct}%`,
        backgroundColor: seg.color,
        opacity: 0.85,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <div
          className="absolute right-5 z-50 w-52 rounded-lg shadow-xl border border-white/10 bg-neutral-900 p-3 text-xs text-white pointer-events-none"
          style={{ top: "50%", transform: "translateY(-50%)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-bold mb-1" style={{ color: seg.color }}>
            {seg.conflictName}
          </p>
          <p className="text-neutral-400 mb-2">{seg.conflictStageName}</p>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-yellow-400">⚠</span>
            <span className="font-semibold">
              {seg.overlapMinutes} min overlap
            </span>
          </div>
          <p className="text-neutral-400">
            {seg.overlapStart} – {seg.overlapEnd}
          </p>
        </div>
      )}
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
    <div
      className={`relative flex items-center gap-3 rounded-lg p-3 mb-2 cursor-pointer transition-opacity overflow-hidden
        ${conflicted ? "ring-2 ring-yellow-400" : ""}`}
      style={{
        backgroundColor: `${stageColor}22`,
        borderLeft: `4px solid ${stageColor}`,
      }}
      onClick={() => toggleAct(festivalId, act.id)}
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

      {/* Overlap bar on the right */}
      {overlapSegments.length > 0 && (
        <div
          className="relative w-3 self-stretch shrink-0 rounded-full bg-white/10"
          title="Overlap with other acts"
        >
          {overlapSegments.map((seg) => (
            <OverlapSegmentPin
              key={`${seg.conflictName}-${seg.topPct}`}
              seg={seg}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface GapIndicatorProps {
  minutes: number;
}

function GapIndicator({ minutes }: GapIndicatorProps) {
  return (
    <div className="flex items-center gap-2 my-1 px-3 text-xs text-neutral-500">
      <div className="flex-1 border-t border-dashed border-neutral-700" />
      <span>{minutes} min gap</span>
      <div className="flex-1 border-t border-dashed border-neutral-700" />
    </div>
  );
}

interface MyScheduleViewProps {
  festival: Festival;
  festivalId: string;
}

export function MyScheduleView({ festival, festivalId }: MyScheduleViewProps) {
  const { isSelected } = useSelectionStore();

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
        };

        map.set(a.id, [...(map.get(a.id) ?? []), segForA]);
        map.set(b.id, [...(map.get(b.id) ?? []), segForB]);
      }
    }
    return map;
  }, [selectedActs]);

  if (selectedActs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
        <p className="text-lg">No acts selected yet.</p>
        <p className="text-sm mt-1">
          Go to the Timeline and tap acts to add them here.
        </p>
      </div>
    );
  }

  const rows: React.ReactNode[] = [];
  selectedActs.forEach((act, i) => {
    if (i > 0) {
      const prev = selectedActs[i - 1];
      const gap = differenceInMinutes(
        new Date(act.startTime),
        new Date(prev.endTime),
      );
      if (gap > 0) rows.push(<GapIndicator key={`gap-${i}`} minutes={gap} />);
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
      />,
    );
  });

  return (
    <div id="my-schedule-root" className="max-w-xl mx-auto px-4 py-4">
      <h2 className="text-xl font-bold text-white mb-4">My Schedule</h2>
      {rows}
    </div>
  );
}
