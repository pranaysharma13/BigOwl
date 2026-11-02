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

describe('topic drill answers', () => {
  const last = (id: string, raw: string) => {
    const v = TOPICS.find((t) => t.id === id)!.viz!;
    const f = v.run(v.parse ? v.parse(raw) : raw);
    return f[f.length - 1];
  };
  it('linear search counts comparisons', () => expect(last('algorithms', '31 41 59 26 41 58 / 26').ask?.value).toBe(4));
  it('growth race verdicts', () => {
    expect(last('asymptotic', '100n | n^2').ask?.answer).toBe(1);
    expect(last('asymptotic', '2^n | n^3').ask?.answer).toBe(0);
    expect(last('asymptotic', '3n | n').ask?.answer).toBe(2);
  });
  it('recursion tree totals and master cases', () => {
    expect(last('recurrences', '2 2 1 16').msg).toMatch(/Total 80.*Θ\(n lg n\)/);
    expect(last('recurrences', '4 2 1 16').msg).toContain('Θ(n²)');
    expect(last('recurrences', '1 2 0 16').msg).toContain('Θ(lg n)');
    expect(last('recurrences', '2 2 2 16').msg).toContain('Θ(n²)');
  });
  it('hiring counts hires', () => expect(last('probabilistic', '1 2 3 4 5 6 7 8').msg).toMatch(/^8 hires/));
  it('miller-rabin', () => {
    expect(last('rsa', '7 561').msg).toContain('composite');
    expect(last('rsa', '2 341').msg).toContain('composite');
    expect(last('rsa', '2 13').msg).toContain('in fact prime');
  });
  it('popcount', () => expect(last('bit-manipulation', '44').ask?.value).toBe(3));
  it('certificate check', () => {
    expect(last('np-complete', '1 -2 3, -1 2 3, 1 2 -3, -1 -2 -3 | 110').msg).toContain('All 4 clauses');
    expect(last('np-complete', '1 -2 3, -1 2 3, 1 2 -3, -1 -2 -3 | 111').msg).toContain('Rejected');
  });
  it('fibonacci heap consolidate', () => expect(last('fib-heaps', '23 7 21 3 18 52 38 39 41').ask?.value).toBe(7));
  it('veb successor', () => {
    expect(last('veb', '2 3 4 5 7 14 15 | 4').ask?.value).toBe(5);
    expect(last('veb', '2 3 4 5 7 14 15 | 7').ask?.value).toBe(14);
    expect(last('veb', '1 6 9 | 12').msg).toContain('no successor');
  });
  it('fft leaves are bit-reversed', () => {
    const v = TOPICS.find((t) => t.id === 'fft')!.viz!;
    const f = v.run(v.parse!('8'));
    expect((f[f.length - 1].s as { arrays: { a: number[] }[] }).arrays[0].a).toEqual([0, 4, 2, 6, 1, 5, 3, 7]);
  });
  it('lp optimum', () => expect(last('linear-programming', '3 2 | 1 1 4; 1 3 6').msg).toContain('maximum is 12 at (4, 0)'));
  it('work and span', () => expect(last('multithreaded', 'A>B A>C A>D B>E C>E D>F E>G F>G').ask?.value).toBe(4));
  it('lu decomposition', () => expect(last('matrix-ops', '2 1 1  4 3 3  8 7 9').ask?.value).toBe(2));
  it('every topic now has a step-through figure', () => expect(TOPICS.filter((t) => !t.viz).map((t) => t.id)).toEqual([]));
});

describe('content review fixes', () => {
  const frames = (id: string, raw: string) => {
    const v = TOPICS.find((t) => t.id === id)!.viz!;
    return v.run(v.parse ? v.parse(raw) : raw);
  };
  const msgs = (id: string, raw: string) => frames(id, raw).map((f) => f.msg ?? '');
  const preset = (id: string, label: string) => String(TOPICS.find((t) => t.id === id)!.viz!.presets.find((p) => p.label === label)!.input);

  it('AVL preset shows all four rotations', () => {
    const all = msgs('avl', preset('avl', 'All four rotations')).join('\n');
    for (const r of ['Left-Left', 'Right-Right', 'Left-Right', 'Right-Left']) expect(all).toContain(r);
  });
  it('max-flow preset reroutes through a backward edge', () => {
    const m = msgs('max-flow', preset('max-flow', 'Rerouting needed'));
    expect(m.some((x) => x.includes('uses a backward residual edge'))).toBe(true);
    expect(m[m.length - 1]).toContain('Maximum flow 2.');
  });
  it('union-find preset compresses a path', () => {
    expect(msgs('disjoint-sets', preset('disjoint-sets', 'Build and compress')).some((x) => x.startsWith('Path compression'))).toBe(true);
  });
  it('KMP preset finds overlapping matches', () => {
    const m = msgs('kmp', preset('kmp', 'Overlapping matches'));
    expect(m[m.length - 1]).toContain('Matches at shifts 0, 2, 4.');
  });
  it('LP preset names both tied corners', () => {
    const m = msgs('linear-programming', preset('linear-programming', 'Three constraints'));
    expect(m[m.length - 1]).toContain('(4, 2)');
    expect(m[m.length - 1]).toContain('(2, 4)');
  });
  it('open addressing never overwrites a stored key when probing fails', () => {
    for (const raw of ['quadratic m=4: 0 2 4', 'double m=9: 2 5 8 26 1']) {
      const fs = frames('hash-tables', raw);
      const tables = fs.map((f) => (f.s as { arrays: { a: (number | null)[] }[] }).arrays[0].a);
      for (let i = 1; i < tables.length; i++) {
        tables[i - 1].forEach((v, slot) => {
          if (v != null) expect(tables[i][slot], `${raw}: slot ${slot}`).toBe(v);
        });
      }
      expect(fs.some((f) => (f.msg ?? '').includes('the insertion fails')), raw).toBe(true);
    }
  });
  it('open addressing highlights the hashInsert pseudocode lines', () => {
    const fs = frames('hash-tables', 'linear m=11: 10 22 31 4 15');
    const store = fs.filter((f) => (f.msg ?? '').startsWith('Slot '));
    expect(store.length).toBeGreaterThan(0);
    for (const f of store) expect([f.line].flat()).toContain(12);
    expect(fs[0].line).toBe(7);
    expect(fs.filter((f) => (f.msg ?? '').startsWith('Probe ')).every((f) => f.line === 14)).toBe(true);
  });
  it('complexity questions ask for the tightest bound', () => {
    for (const q of complexityQuestions()) {
      expect(q.q).toContain('tightest');
      expect(q.why).toContain('tightest');
    }
  });
});
