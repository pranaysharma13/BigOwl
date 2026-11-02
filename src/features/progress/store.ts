import { create } from 'zustand';
import {
  dayKey,
  emptyProgress,
  mergeProgress,
  type AssessResult,
  type Bucket,
  type ItemProgress,
  type ProgressData,
} from './model';

const LOCAL_KEY = 'aw-progress-v1';

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'offline' | 'unconfigured';

interface ProgressState {
  data: ProgressData;
  status: SyncStatus;
  /** Increments on every local change; the sync layer listens to it. */
  rev: number;
  mark: (id: string, field: 'r' | 'v', bucket?: Bucket) => void;
  quiz: (id: string, pct: number, bucket?: Bucket) => void;
  drill: (id: string, ok: boolean, bucket?: Bucket) => void;
  toggleDone: (id: string, bucket?: Bucket) => void;
  visit: (id: string, kind: 't' | 'p') => void;
  toggleSolved: (problemId: string) => void;
  addAssessment: (r: AssessResult) => void;
  setLang: (lang: 'pseudo' | 'py' | 'cpp') => void;
  /** Merge data from elsewhere (an import file or the server) without counting it as a local change. */
  mergeIn: (other: Partial<ProgressData>, countAsChange?: boolean) => void;
  /** Replace everything with empty progress (used on delete and sign-out). */
  clearAll: () => void;
  setStatus: (s: SyncStatus) => void;
}

function readLocal(): ProgressData {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return mergeProgress(emptyProgress(), JSON.parse(raw));
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return emptyProgress();
}

export function writeLocal(data: ProgressData | null): void {
  try {
    if (data) localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    else localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* ignore quota or privacy-mode errors */
  }
}

export const useProgress = create<ProgressState>()((set, get) => {
  /** Apply a mutation to a copy of the data, record today's activity, persist locally. */
  const change = (fn: (d: ProgressData) => boolean | void) => {
    const d: ProgressData = structuredClone(get().data);
    if (fn(d) === false) return;
    const today = dayKey();
    if (!d.days.includes(today)) d.days.push(today);
    writeLocal(d);
    set({ data: d, rev: get().rev + 1 });
  };
  const item = (d: ProgressData, id: string, bucket: Bucket): ItemProgress => (d[bucket][id] ??= {});

  return {
    data: readLocal(),
    status: 'local',
    rev: 0,
    mark: (id, field, bucket = 'topics') =>
      change((d) => {
        const p = item(d, id, bucket);
        if (p[field]) return false;
        p[field] = 1;
      }),
    quiz: (id, pct, bucket = 'topics') =>
      change((d) => {
        const p = item(d, id, bucket);
        p.qa = (p.qa ?? 0) + 1;
        p.q = Math.max(p.q ?? 0, pct);
      }),
    drill: (id, ok, bucket = 'topics') =>
      change((d) => {
        const p = item(d, id, bucket);
        p.dt = (p.dt ?? 0) + 1;
        if (ok) p.d = (p.d ?? 0) + 1;
      }),
    toggleDone: (id, bucket = 'topics') =>
      change((d) => {
        const p = item(d, id, bucket);
        p.done = (p.done ?? 0) > 0 ? -Date.now() : Date.now();
      }),
    visit: (id, kind) =>
      change((d) => {
        if (d.last?.id === id && Date.now() - d.last.ts < 60_000) return false;
        d.last = { id, kind, ts: Date.now() };
      }),
    toggleSolved: (pid) =>
      change((d) => {
        d.solved[pid] = (d.solved[pid] ?? 0) > 0 ? -Date.now() : Date.now();
      }),
    addAssessment: (r) =>
      change((d) => {
        d.assess = [...d.assess, r].slice(-50);
      }),
    setLang: (lang) =>
      change((d) => {
        if (d.prefs.lang === lang) return false;
        d.prefs = { lang, ts: Date.now() };
      }),
    mergeIn: (other, countAsChange = false) => {
      const merged = mergeProgress(get().data, other);
      writeLocal(merged);
      set({ data: merged, rev: countAsChange ? get().rev + 1 : get().rev });
    },
    clearAll: () => {
      writeLocal(null);
      set({ data: emptyProgress(), rev: get().rev + 1 });
    },
    setStatus: (status) => set({ status }),
  };
});
