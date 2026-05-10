import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes, format } from "date-fns";
import { useSelectionStore } from "../../stores";
import { resolveThumbnail } from "../../services/thumbnails";
import type { Act, Festival } from "../../types";

interface ScheduleRowProps {
  act: Act;
  stageColor: string;
  stageName: string;
  conflicted: boolean;
  festivalId: string;
}

function ScheduleRow({
  act,
  stageColor,
  stageName,
  conflicted,
  festivalId,
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
      className={`flex items-center gap-3 rounded-lg p-3 mb-2 cursor-pointer transition-opacity
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
      {conflicted && (
        <span
          className="text-yellow-400 text-lg"
          title="Overlaps with another selected act"
        >
          ⚠
        </span>
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

  const conflictSet = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < selectedActs.length; i++) {
      for (let j = i + 1; j < selectedActs.length; j++) {
        const a = selectedActs[i];
        const b = selectedActs[j];
        if (a.stageId === b.stageId) continue;
        const aS = new Date(a.startTime).getTime();
        const aE = new Date(a.endTime).getTime();
        const bS = new Date(b.startTime).getTime();
        const bE = new Date(b.endTime).getTime();
        if (aS < bE && aE > bS) {
          set.add(a.id);
          set.add(b.id);
        }
      }
    }
    return set;
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
        conflicted={conflictSet.has(act.id)}
        festivalId={festivalId}
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
