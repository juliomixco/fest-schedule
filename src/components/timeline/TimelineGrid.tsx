import { useMemo } from "react";
import { ActBlock } from "./ActBlock";
import type { Stage, Act } from "../../types";
import { useSelectionStore } from "../../stores";

interface TimelineGridProps {
  stages: Stage[];
  festivalId: string;
  /** Timeline start hour (e.g. 11 for 11:00) */
  startHour: number;
  /** Timeline end hour in absolute terms (e.g. 29 for 05:00 next day) */
  endHour: number;
}

/** Extract the absolute hour from a naive ISO string (e.g. "2026-06-18T15:35:00").
 *  Reads HH:MM directly from the string to avoid any timezone conversion.
 *  Past-midnight times (00:xx–09:xx) are treated as next-day (+24h). */
function toAbsoluteHour(isoString: string): number {
  const match = isoString.match(/T(\d{2}):(\d{2})/);
  if (!match) return 0;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const abs = h + m / 60;
  return abs < 10 ? abs + 24 : abs;
}

function buildConflictSet(selectedActs: Act[]): Set<string> {
  const conflicts = new Set<string>();
  for (let i = 0; i < selectedActs.length; i++) {
    for (let j = i + 1; j < selectedActs.length; j++) {
      const a = selectedActs[i];
      const b = selectedActs[j];
      if (a.stageId === b.stageId) continue;
      const aStart = toAbsoluteHour(a.startTime);
      const aEnd = toAbsoluteHour(a.endTime);
      const bStart = toAbsoluteHour(b.startTime);
      const bEnd = toAbsoluteHour(b.endTime);
      if (aStart < bEnd && aEnd > bStart) {
        conflicts.add(a.id);
        conflicts.add(b.id);
      }
    }
  }
  return conflicts;
}

const HOUR_HEIGHT_PX = 120;

export function TimelineGrid({
  stages,
  festivalId,
  startHour,
  endHour,
}: TimelineGridProps) {
  const { toggleAct, isSelected, selections } = useSelectionStore();
  const totalHours = endHour - startHour;
  const totalHeight = totalHours * HOUR_HEIGHT_PX;

  const allSelectedActs = useMemo(() => {
    return stages.flatMap((s) =>
      s.acts.filter((a) => isSelected(festivalId, a.id)),
    );
  }, [stages, festivalId, selections]);

  const conflictSet = useMemo(
    () => buildConflictSet(allSelectedActs),
    [allSelectedActs],
  );

  const hours = Array.from(
    { length: totalHours + 1 },
    (_, i) => (startHour + i) % 24,
  );

  return (
    <div
      className="flex overflow-x-auto overflow-y-auto max-h-[calc(100vh-8rem)]"
      style={{ minHeight: `${totalHeight}px` }}
    >
      {/* Time ruler */}
      <div
        className="sticky left-0 z-20 bg-neutral-950 dark:bg-neutral-950 w-14 shrink-0 relative"
        style={{ height: totalHeight }}
      >
        {hours.map((h, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 text-[10px] text-neutral-500 pr-1 text-right"
            style={{ top: i * HOUR_HEIGHT_PX - 6 }}
          >
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
        {/* Horizontal gridlines */}
        {hours.map((_, i) => (
          <div
            key={`grid-${i}`}
            className="absolute left-14 right-0 border-t border-neutral-800"
            style={{ top: i * HOUR_HEIGHT_PX, width: "100vw" }}
          />
        ))}
      </div>

      {/* Stage columns */}
      {stages.map((stage) => (
        <div key={stage.id} className="flex flex-col min-w-40 w-44 shrink-0">
          {/* Stage header */}
          <div
            className="sticky top-0 z-10 px-2 py-1 text-xs font-bold text-white text-center truncate"
            style={{ backgroundColor: stage.color ?? "#374151" }}
          >
            {stage.name}
          </div>

          {/* Acts */}
          <div className="relative" style={{ height: totalHeight }}>
            {stage.acts.map((act) => {
              const actStart = toAbsoluteHour(act.startTime);
              const actEnd = toAbsoluteHour(act.endTime);
              const topPct = ((actStart - startHour) / totalHours) * 100;
              const heightPct = ((actEnd - actStart) / totalHours) * 100;
              const selected = isSelected(festivalId, act.id);
              const conflicted = conflictSet.has(act.id);

              return (
                <ActBlock
                  key={act.id}
                  act={act}
                  selected={selected}
                  conflicted={conflicted}
                  stageColor={stage.color ?? "#6b7280"}
                  topPct={topPct}
                  heightPct={heightPct}
                  onClick={() => toggleAct(festivalId, act.id)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
