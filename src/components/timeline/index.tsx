import { useMemo } from "react";
import { TimelineGrid } from "./TimelineGrid";
import type { Day } from "../../types";

interface TimelineViewProps {
  day: Day;
  festivalId: string;
}

export function TimelineView({ day, festivalId }: TimelineViewProps) {
  const { startHour, endHour } = useMemo(() => {
    let min = 23;
    let max = 11;
    day.stages.forEach((s) =>
      s.acts.forEach((a) => {
        let h = new Date(a.startTime).getHours();
        if (h < 10) h += 24;
        let e =
          new Date(a.endTime).getHours() +
          new Date(a.endTime).getMinutes() / 60;
        if (e < 10) e += 24;
        if (h < min) min = h;
        if (e > max) max = e;
      }),
    );
    return {
      startHour: Math.max(10, Math.floor(min) - 1),
      endHour: Math.ceil(max) + 1,
    };
  }, [day]);

  return (
    <div className="flex-1 overflow-hidden">
      <TimelineGrid
        stages={day.stages}
        festivalId={festivalId}
        startHour={startHour}
        endHour={endHour}
      />
    </div>
  );
}
