export interface Act {
  id: string;
  name: string;
  /** ISO 8601 datetime string */
  startTime: string;
  /** ISO 8601 datetime string */
  endTime: string;
  stageId: string;
  dayId: string;
  /** Link to artist page on festival site */
  url?: string;
  /** Resolved artist thumbnail URL */
  thumbnailUrl?: string;
}

export interface Stage {
  id: string;
  name: string;
  /** Accent color for this stage (hex) */
  color?: string;
  acts: Act[];
}

export interface Day {
  id: string;
  /** Display label, e.g. "Thursday" */
  label: string;
  /** ISO 8601 date string, e.g. "2026-06-18" */
  date: string;
  stages: Stage[];
}

export interface Festival {
  id: string;
  name: string;
  website: string;
  days: Day[];
  /** ISO 8601 datetime of last import */
  importedAt?: string;
}

export interface UserSelections {
  /** Festival id → Set of selected Act ids */
  [festivalId: string]: Set<string>;
}
