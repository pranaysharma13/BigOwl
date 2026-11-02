import { describe, expect, it } from 'vitest';
import { TOPICS } from '../src/content';
import { PATTERNS, SCENARIOS } from '../src/content/patterns/patterns';
import { PATTERN_LIST } from '../src/content/patterns/list';
import { PARSONS, TRACE } from '../src/content/assess/bank';
import { buildMock, complexityQuestions, parsonsCorrect, patternQuestions, type ParsonsProblem } from '../src/features/assess/pool';

type AnyViz = { presets?: { input: unknown }[]; parse?: (s: string) => unknown; random?: () => string; run: (x: unknown) => { msg?: string; ask?: { choices?: string[]; answer?: number } | null }[]; noInput?: boolean };

/** Runs a visualizer on every preset and on several random inputs; every run must produce frames with valid checkpoints. */
function exercise(name: string, viz: AnyViz) {
  const inputs: unknown[] = [];
  for (const p of viz.presets ?? []) inputs.push(viz.noInput || !viz.parse ? p.input : viz.parse(String(p.input)));
  if (viz.random && viz.parse) for (let i = 0; i < 8; i++) inputs.push(viz.parse(viz.random()));
  for (const input of inputs) {
    const frames = viz.run(input);
    expect(frames.length, name).toBeGreaterThan(0);
    for (const f of frames) {
      if (f.ask?.choices) {
        expect(f.ask.answer, `${name}: ask answer index`).toBeGreaterThanOrEqual(0);
        expect(f.ask.answer!, `${name}: ask answer index`).toBeLessThan(f.ask.choices.length);
      }
    }
  }
}

describe('curriculum visualizers', () => {
  for (const t of TOPICS) {
    if (!t.viz) continue;
    it(`${t.id} runs on presets and random input`, () => exercise(t.id, t.viz as unknown as AnyViz));
  }
});

describe('pattern walkthroughs', () => {
  it('covers every listed pattern, in order', () => {
    expect(PATTERNS.map((p: { id: string }) => p.id)).toEqual(PATTERN_LIST.map((p) => p.id));
  });
  for (const p of PATTERNS as { id: string; viz?: AnyViz }[]) {
    if (!p.viz) continue;
    it(`${p.id} runs on presets and random input`, () => exercise(p.id, p.viz!));
  }
  it('every scenario names a real pattern', () => {
    const ids = new Set(PATTERN_LIST.map((p) => p.id));
    for (const [, id] of SCENARIOS as [string, string][]) expect(ids.has(id)).toBe(true);
  });
});

describe('pattern walkthrough answers', () => {
  const byId = Object.fromEntries((PATTERNS as { id: string; viz?: AnyViz }[]).map((p) => [p.id, p.viz!]));
  const lastMsg = (id: string, raw: string) => {
    const v = byId[id];
    const f = v.run(v.parse!(raw));
    return f[f.length - 1].msg ?? '';
  };
  it('two pointers finds the pair', () => expect(lastMsg('two-pointers', '1 3 4 6 8 10 13 / 16')).toContain('Found'));
  it('sliding window finds the longest run', () => expect(lastMsg('sliding-window', 'pwwkew')).toContain('length 3'));
  it('prefix sums count subarrays', () => expect(lastMsg('prefix-sum', '1 -1 1 -1 1 / 0')).toContain('6 subarrays'));
  it('heap finds the kth largest', () => expect(lastMsg('heap-top-k', '3 2 3 1 2 4 5 5 6 / 4')).toContain('The root, 4'));
  it('koko speed', () => expect(lastMsg('binary-search-answer', '30 11 23 4 20 / 6')).toContain('minimum speed is 23'));
  it('house robber', () => expect(lastMsg('dp-1d', '2 7 9 3 1')).toContain('12'));
  it('unique paths', () => expect(lastMsg('dp-2d', '3 7')).toContain('28 paths'));
  it('first missing positive', () => expect(lastMsg('cyclic-sort', '7 3 1 4 6 5')).toContain('is 2'));
  it('merge intervals', () => expect(lastMsg('intervals', '1-3 2-6 8-10 15-18')).toContain('[1, 6] [8, 10] [15, 18]'));
  it('floyd finds the cycle entrance', () => expect(lastMsg('fast-slow', '8 | 2')).toContain('node 2'));
});

describe('assessment pool', () => {
  it('builds a mock of the requested size with valid answers and no repeats', () => {
    const qs = buildMock({ count: 30, minutes: 30, parts: [], patterns: true });
    expect(qs).toHaveLength(30);
    expect(new Set(qs.map((q) => q.id)).size).toBe(30);
    for (const q of qs) expect(q.a).toBeLessThan(q.opts.length);
  });
  it('respects the unit filter', () => {
    const qs = buildMock({ count: 10, minutes: null, parts: ['graph'], patterns: false });
    expect(qs.every((q) => q.kind !== 'pattern')).toBe(true);
  });
  it('never offers an equivalent bound as a wrong answer', () => {
    for (const q of complexityQuestions()) {
      const bodies = q.opts.map((o) => o.slice(1));
      expect(new Set(bodies).size, q.q).toBe(bodies.length);
    }
  });
  it('pattern questions have four distinct options', () => {
    for (const q of patternQuestions()) expect(new Set(q.opts).size).toBe(4);
  });
  it('trace questions have an in-range answer', () => {
    for (const q of TRACE as { opts: string[]; a: number }[]) expect(q.a).toBeLessThan(q.opts.length);
  });
  it('parsons accepts the reference order and listed alternatives only', () => {
    for (const p of PARSONS as ParsonsProblem[]) {
      expect(parsonsCorrect(p, p.lines.map((_, i) => i))).toBe(true);
      for (const alt of p.alts ?? []) expect(parsonsCorrect(p, alt)).toBe(true);
      expect(parsonsCorrect(p, p.lines.map((_, i) => i).reverse())).toBe(false);
    }
  });
});
