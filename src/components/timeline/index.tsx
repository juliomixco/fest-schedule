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
    const extractHour = (iso: string) => {
      const match = iso.match(/T(\d{2}):(\d{2})/);
      if (!match) return 0;
      const abs = parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
      return abs < 10 ? abs + 24 : abs;
    };
    day.stages.forEach((s) =>
      s.acts.forEach((a) => {
        const h = extractHour(a.startTime);
        const e = extractHour(a.endTime);
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
    <div className="h-full overflow-hidden">
      <TimelineGrid
        stages={day.stages}
        festivalId={festivalId}
        startHour={startHour}
        endHour={endHour}
      />
    </div>
  );
}
