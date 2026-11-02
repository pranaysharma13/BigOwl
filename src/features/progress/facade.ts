import { useProgress } from './store';
import type { Bucket } from './model';

/** Imperative access for the visualization engine and content modules, which live outside React. */
export const progress = {
  mark: (id: string, f: 'r' | 'v', bucket?: Bucket) => useProgress.getState().mark(id, f, bucket),
  quiz: (id: string, pct: number, bucket?: Bucket) => useProgress.getState().quiz(id, pct, bucket),
  drill: (id: string, ok: boolean, bucket?: Bucket) => useProgress.getState().drill(id, ok, bucket),
};
