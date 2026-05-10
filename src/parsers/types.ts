import type { Festival } from "../types";

export interface FestivalParser {
  /** Unique key for this parser, e.g. "graspop" */
  key: string;
  /** Human-readable name */
  name: string;
  /** Returns true if this parser can handle the given URL */
  canParse: (url: string) => boolean;
  /** Fetch and parse the full festival from the given root URL */
  parse: (url: string) => Promise<Festival>;
}
