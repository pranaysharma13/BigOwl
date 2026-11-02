import { describe, expect, it } from 'vitest';
import { emptyProgress, mastery, mergeProgress, patternMastery, streak } from '../src/features/progress/model';

describe('mergeProgress', () => {
  it('keeps the best of both sides', () => {
    const a = emptyProgress();
    const b = emptyProgress();
    a.topics.bfs = { r: 1, q: 60, dt: 4, d: 3 };
    b.topics.bfs = { v: 1, q: 80, dt: 2, d: 2 };
    const m = mergeProgress(a, b).topics.bfs;
    expect(m.r).toBe(1);
    expect(m.v).toBe(1);
    expect(m.q).toBe(80);
    expect(m.dt).toBe(4);
  });
  it('takes the latest toggle', () => {
    const a = emptyProgress();
    const b = emptyProgress();
    a.solved.lc1 = 100;
    b.solved.lc1 = -200;
    expect(mergeProgress(a, b).solved.lc1).toBe(-200);
  });
});

describe('mastery', () => {
  it('is 0 for nothing and 1 when marked learned', () => {
    expect(mastery(undefined)).toBe(0);
    expect(mastery({ done: Date.now() })).toBe(1);
  });
  it('weights theory, watching, quiz and prediction', () => {
    expect(mastery({ r: 1, v: 1, q: 100, dt: 6, d: 6 })).toBeCloseTo(1);
    expect(mastery({ r: 1 })).toBeCloseTo(0.15);
  });
  it('patternMastery counts solved problems most', () => {
    expect(patternMastery(undefined, 5, 10)).toBeCloseTo(0.3);
    expect(patternMastery({ r: 1, q: 100 }, 10, 10)).toBeCloseTo(1);
  });
});

describe('streak', () => {
  it('counts consecutive days ending today or yesterday', () => {
    const now = new Date(2026, 10, 2);
    expect(streak(['2026-11-02', '2026-11-01', '2026-10-31'], now)).toBe(3);
    expect(streak(['2026-11-01', '2026-10-31'], now)).toBe(2);
    expect(streak(['2026-10-30'], now)).toBe(0);
  });
});
