import type { FestivalParser } from "./types";
import { graspopParser } from "./graspop";

export const parsers: FestivalParser[] = [graspopParser];

export function findParser(url: string): FestivalParser | undefined {
  return parsers.find((p) => p.canParse(url));
}

export type { FestivalParser };
