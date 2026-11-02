/** Progress data model. Pure functions only, so they can be unit tested and shared by the store and sync. */

export interface ItemProgress {
  /** Theory read (1) */
  r?: number;
  /** Visualizer watched to the end (1) */
  v?: number;
  /** Best quiz score, 0–100 */
  q?: number;
  /** Quiz attempts */
  qa?: number;
  /** Step predictions correct on first try */
  d?: number;
  /** Step predictions attempted */
  dt?: number;
  /** Signed timestamp: positive = marked learned at that time, negative = unmarked at that time */
  done?: number;
}

export interface AssessResult {
  ts: number;
  mode: string;
  pct: number;
  right: number;
  total: number;
  byTopic: Record<string, [number, number]>;
}

export interface ProgressData {
  v: 1;
  topics: Record<string, ItemProgress>;
  pats: Record<string, ItemProgress>;
  /** Problem id -> signed timestamp (positive = solved) */
  solved: Record<string, number>;
  assess: AssessResult[];
  /** Active days as YYYY-MM-DD */
  days: string[];
  last: { id: string; kind: 't' | 'p'; ts: number } | null;
  prefs: { lang?: 'pseudo' | 'py' | 'cpp'; ts?: number };
}

export type Bucket = 'topics' | 'pats';

export const emptyProgress = (): ProgressData => ({
  v: 1,
  topics: {},
  pats: {},
  solved: {},
  assess: [],
  days: [],
  last: null,
  prefs: {},
});

const pickSigned = (a = 0, b = 0) => (Math.abs(a) >= Math.abs(b) ? a : b);

/**
 * Merges two progress snapshots without losing work from either side:
 * counters and best scores take the maximum, toggles take the most recent change,
 * histories are unioned and capped.
 */
export function mergeProgress(a: Partial<ProgressData>, b: Partial<ProgressData>): ProgressData {
  const out = emptyProgress();
  for (const key of ['topics', 'pats'] as const) {
    const A = a[key] ?? {},
      B = b[key] ?? {};
    for (const id of new Set([...Object.keys(A), ...Object.keys(B)])) {
      const x = A[id] ?? {},
        y = B[id] ?? {};
      const m: ItemProgress = {};
      for (const f of new Set([...Object.keys(x), ...Object.keys(y)]) as Set<keyof ItemProgress>) {
        m[f] = f === 'done' ? pickSigned(x.done, y.done) : Math.max(x[f] ?? 0, y[f] ?? 0);
      }
      out[key][id] = m;
    }
  }
  const SA = a.solved ?? {},
    SB = b.solved ?? {};
  for (const id of new Set([...Object.keys(SA), ...Object.keys(SB)])) out.solved[id] = pickSigned(SA[id], SB[id]);
  const seen = new Map<number, AssessResult>();
  [...(a.assess ?? []), ...(b.assess ?? [])].forEach((r) => seen.set(r.ts, r));
  out.assess = [...seen.values()].sort((p, q) => p.ts - q.ts).slice(-50);
  out.days = [...new Set([...(a.days ?? []), ...(b.days ?? [])])].sort().slice(-400);
  out.last = [a.last, b.last].filter(Boolean).sort((p, q) => q!.ts - p!.ts)[0] ?? null;
  const pa = a.prefs ?? {},
    pb = b.prefs ?? {};
  out.prefs = (pa.ts ?? 0) >= (pb.ts ?? 0) ? { ...pa } : { ...pb };
  return out;
}

/** Mastery from 0 to 1: theory 15%, watched 15%, quiz 40%, prediction accuracy 30%. */
export function mastery(p: ItemProgress | undefined): number {
  if (!p) return 0;
  if ((p.done ?? 0) > 0) return 1;
  const acc = p.dt ? (p.d ?? 0) / p.dt : 0;
  const weight = Math.min(1, (p.dt ?? 0) / 6);
  return Math.min(1, 0.15 * (p.r ? 1 : 0) + 0.15 * (p.v ? 1 : 0) + 0.4 * ((p.q ?? 0) / 100) + 0.3 * acc * weight);
}

/** 0 not started, 1 started, 2 practiced, 3 mastered */
export function level(p: ItemProgress | undefined): 0 | 1 | 2 | 3 {
  if (!p || !Object.values(p).some((v) => (v ?? 0) > 0)) return 0;
  const m = mastery(p);
  return m >= 0.85 ? 3 : m >= 0.45 ? 2 : 1;
}

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function streak(days: string[], now = new Date()): number {
  const set = new Set(days);
  const d = new Date(now);
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function predictionAccuracy(data: ProgressData): number | null {
  let d = 0,
    t = 0;
  for (const bucket of [data.topics, data.pats]) for (const p of Object.values(bucket)) {
    d += p.d ?? 0;
    t += p.dt ?? 0;
  }
  return t ? Math.round((100 * d) / t) : null;
}

/** Pattern progress from 0 to 1: guide read 15%, spot-the-pattern score 25%, share of its problems solved 60%. */
export function patternMastery(p: ItemProgress | undefined, solved: number, total: number): number {
  const share = total ? Math.min(1, solved / total) : 0;
  return Math.min(1, 0.15 * (p?.r ? 1 : 0) + 0.25 * ((p?.q ?? 0) / 100) + 0.6 * share);
}
