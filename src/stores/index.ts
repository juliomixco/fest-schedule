import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Festival } from '../types';
import {
  getFestivals,
  saveFestival,
  deleteFestival as dbDeleteFestival,
  getSelections,
  saveSelections,
} from '../db';
import { buildGraspop2026Fixture } from '../fixtures/graspop2026';

// ---------------------------------------------------------------------------
// Theme store
// ---------------------------------------------------------------------------
interface ThemeState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        document.documentElement.classList.toggle('dark', next === 'dark');
      },
    }),
    { name: 'fest-theme' }
  )
);

// Apply saved theme on load
const savedTheme = useThemeStore.getState().theme;
document.documentElement.classList.toggle('dark', savedTheme === 'dark');

// ---------------------------------------------------------------------------
// Festival store
// ---------------------------------------------------------------------------
interface FestivalState {
  festivals: Festival[];
  activeFestivalId: string | null;
  activeDayId: string | null;
  loadFestivals: () => Promise<void>;
  addFestival: (festival: Festival) => Promise<void>;
  updateFestival: (festival: Festival) => Promise<void>;
  removeFestival: (id: string) => Promise<void>;
  setActiveFestival: (id: string) => void;
  setActiveDay: (id: string) => void;
}

export const useFestivalStore = create<FestivalState>()((set, get) => ({
  festivals: [],
  activeFestivalId: null,
  activeDayId: null,

  loadFestivals: async () => {
    let festivals = await getFestivals();
    // Seed fixture on first run
    if (festivals.length === 0) {
      const fixture = buildGraspop2026Fixture();
      await saveFestival(fixture);
      festivals = [fixture];
    }
    set({ festivals });
    if (festivals.length > 0 && !get().activeFestivalId) {
      const f = festivals[0];
      set({ activeFestivalId: f.id, activeDayId: f.days[0]?.id ?? null });
    }
  },

  addFestival: async (festival) => {
    await saveFestival(festival);
    set((s) => ({ festivals: [...s.festivals, festival] }));
    if (!get().activeFestivalId) {
      set({ activeFestivalId: festival.id, activeDayId: festival.days[0]?.id ?? null });
    }
  },

  updateFestival: async (festival) => {
    await saveFestival(festival);
    set((s) => ({ festivals: s.festivals.map((f) => (f.id === festival.id ? festival : f)) }));
  },

  removeFestival: async (id) => {
    await dbDeleteFestival(id);
    set((s) => {
      const festivals = s.festivals.filter((f) => f.id !== id);
      const activeFestivalId = s.activeFestivalId === id ? (festivals[0]?.id ?? null) : s.activeFestivalId;
      const activeDayId = s.activeFestivalId === id ? (festivals[0]?.days[0]?.id ?? null) : s.activeDayId;
      return { festivals, activeFestivalId, activeDayId };
    });
  },

  setActiveFestival: (id) => {
    const festival = get().festivals.find((f) => f.id === id);
    set({ activeFestivalId: id, activeDayId: festival?.days[0]?.id ?? null });
  },

  setActiveDay: (id) => set({ activeDayId: id }),
}));

// ---------------------------------------------------------------------------
// Selections store
// ---------------------------------------------------------------------------
interface SelectionState {
  /** festivalId → Set<actId> */
  selections: Record<string, Set<string>>;
  loadSelections: (festivalId: string) => Promise<void>;
  toggleAct: (festivalId: string, actId: string) => void;
  isSelected: (festivalId: string, actId: string) => boolean;
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  selections: {},

  loadSelections: async (festivalId) => {
    const actIds = await getSelections(festivalId);
    set((s) => ({ selections: { ...s.selections, [festivalId]: actIds } }));
  },

  toggleAct: (festivalId, actId) => {
    const current = get().selections[festivalId] ?? new Set<string>();
    const next = new Set(current);
    if (next.has(actId)) next.delete(actId);
    else next.add(actId);
    set((s) => ({ selections: { ...s.selections, [festivalId]: next } }));
    saveSelections(festivalId, next);
  },

  isSelected: (festivalId, actId) => get().selections[festivalId]?.has(actId) ?? false,
}));
