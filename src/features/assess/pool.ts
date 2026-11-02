/** Builds assessment question sets from the curriculum, pattern bank and assessment bank. Pure apart from randomness. */
import { PARTS, TOPICS, TOPIC, type PartId } from '../../content';
import { PATTERN_LIST } from '../../content/patterns/list';
import { SCENARIOS } from '../../content/patterns/patterns';
import { TRACE, PARSONS } from '../../content/assess/bank';

export type Kind = 'concept' | 'trace' | 'bug' | 'pattern' | 'complexity';

export interface AQ {
  id: string;
  kind: Kind;
  /** Topic id, or "pat:<id>" for pattern questions. Used for the per-area report. */
  area: string;
  q: string;
  code?: string;
  lang?: string;
  opts: string[];
  a: number;
  why?: string;
}

export interface ParsonsProblem {
  id: string;
  topic: string;
  pattern?: string;
  title: string;
  lines: string[];
  alts?: number[][];
}

export const KIND_LABEL: Record<Kind, string> = {
  concept: 'Concept',
  trace: 'Trace the code',
  bug: 'Find the bug',
  pattern: 'Spot the pattern',
  complexity: 'Complexity',
};

export function shuffled<T>(a: readonly T[], rand = Math.random): T[] {
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffle the options of a question, keeping track of the right answer. */
export function shuffleOpts(q: AQ, rand = Math.random): AQ {
  const order = shuffled(q.opts.map((_, i) => i), rand);
  return { ...q, opts: order.map((i) => q.opts[i]), a: order.indexOf(q.a) };
}

const patTitle = (id: string) => PATTERN_LIST.find((p) => p.id === id)?.title ?? id;

export function conceptQuestions(parts?: PartId[]): AQ[] {
  const out: AQ[] = [];
  for (const t of TOPICS) {
    if (parts && !parts.includes(t.part)) continue;
    (t.quiz ?? []).forEach((q, i) =>
      out.push({ id: `${t.id}#${i}`, kind: 'concept', area: t.id, q: q.q, code: q.code, lang: q.lang, opts: q.opts, a: q.a, why: q.why }),
    );
  }
  return out;
}

export function traceQuestions(parts?: PartId[]): AQ[] {
  return (TRACE as { topic: string; kind: 'trace' | 'bug'; q: string; code: string; opts: string[]; a: number; why: string }[])
    .filter((q) => !parts || (TOPIC[q.topic] && parts.includes(TOPIC[q.topic].part)))
    .map((q, i) => ({ id: `trace#${i}`, kind: q.kind, area: q.topic, q: q.q, code: q.code, lang: 'py', opts: q.opts, a: q.a, why: q.why }));
}

export function patternQuestions(rand = Math.random): AQ[] {
  const ids = PATTERN_LIST.map((p) => p.id);
  return (SCENARIOS as [string, string][]).map(([s, id], i) => {
    const wrong = shuffled(ids.filter((x) => x !== id), rand).slice(0, 3);
    const sig = PATTERN_LIST.find((p) => p.id === id)?.signal ?? '';
    return {
      id: `scn#${i}`,
      kind: 'pattern' as const,
      area: `pat:${id}`,
      q: s,
      opts: [patTitle(id), ...wrong.map(patTitle)],
      a: 0,
      why: `${patTitle(id)}. Signal: ${sig.charAt(0).toLowerCase() + sig.slice(1)}.`,
    };
  });
}

const ASYMPTOTIC = /^[ΘOΩ]\(.*\)$/;
// Labels that start with a name or an acronym keep their capital when they follow a comma.
const PROPER = /^(Kruskal|Prim|Kosaraju|Tarjan|Johnson|Edmonds|Ford|Kadane|Strassen|Graham|Jarvis|Euclid|Rabin|Miller|Fibonacci|Kahn|Dijkstra|DFS|BFS|LUP)\b/;
const lcFirst = (s: string) => (PROPER.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

/**
 * Questions like "Heapsort, every case: tightest bound?" built from each topic's cost table.
 * They ask for the tightest bound because a larger O(…) distractor would also be a true upper bound.
 */
export function complexityQuestions(parts?: PartId[], rand = Math.random): AQ[] {
  const facts: { t: string; title: string; label: string; v: string }[] = [];
  for (const t of TOPICS) {
    if (parts && !parts.includes(t.part)) continue;
    for (const [label, v] of t.cx ?? []) if (ASYMPTOTIC.test(v) && v.length < 26) facts.push({ t: t.id, title: t.title, label, v });
  }
  // Compare bounds by their body only, so O(n lg n) and Θ(n lg n) never appear as rival options.
  const body = (v: string) => v.slice(1).replace(/\blog\b/g, 'lg').replace(/\s+/g, ' ');
  const bodies = [...new Set([...['(1)', '(lg n)', '(n)', '(n lg n)', '(n²)', '(n³)', '(2ⁿ)', '(V + E)', '(E lg V)', '(V³)'], ...facts.map((f) => body(f.v))])];
  const vars = (s: string) => (s.match(/[A-Za-z]+/g) ?? []).filter((x) => x !== 'lg').sort().join();
  return facts.map((f, i) => {
    const mine = body(f.v);
    const pool = shuffled(bodies.filter((b) => b !== mine), rand);
    // prefer distractors that use the same variables as the answer
    const near = pool.filter((b) => vars(b) === vars(mine));
    const wrong = [...near, ...pool.filter((b) => !near.includes(b))].slice(0, 3).map((b) => f.v[0] + b);
    return {
      id: `cx#${i}`,
      kind: 'complexity' as const,
      area: f.t,
      q: `<b>${f.title}</b>, ${lcFirst(f.label)}: tightest bound?`,
      opts: [f.v, ...wrong],
      a: 0,
      why: `The tightest bound for ${f.title}, ${lcFirst(f.label)}, is ${f.v}.`,
    };
  });
}

export interface MockConfig {
  count: number;
  minutes: number | null;
  parts: PartId[];
  patterns: boolean;
}

/** A balanced mock assessment: about 55% concept, 20% trace/bug, 15% pattern, 10% complexity, topped up from concept questions. */
export function buildMock(cfg: MockConfig, rand = Math.random): AQ[] {
  const parts = cfg.parts.length ? cfg.parts : PARTS.map((p) => p.id);
  const pools: [AQ[], number][] = [
    [shuffled(traceQuestions(parts), rand), 0.2],
    [cfg.patterns ? shuffled(patternQuestions(rand), rand) : [], 0.15],
    [shuffled(complexityQuestions(parts, rand), rand), 0.1],
  ];
  const picked: AQ[] = [];
  for (const [pool, share] of pools) picked.push(...pool.slice(0, Math.round(cfg.count * share)));
  const concept = shuffled(conceptQuestions(parts), rand);
  // spread concept questions across topics before repeating a topic
  const byTopic = new Map<string, AQ[]>();
  for (const q of concept) byTopic.set(q.area, [...(byTopic.get(q.area) ?? []), q]);
  const rounds: AQ[] = [];
  const lists = shuffled([...byTopic.values()], rand);
  for (let r = 0; lists.some((l) => l[r]); r++) for (const l of lists) if (l[r]) rounds.push(l[r]);
  for (const q of rounds) {
    if (picked.length >= cfg.count) break;
    picked.push(q);
  }
  return shuffled(picked.slice(0, cfg.count), rand).map((q) => shuffleOpts(q, rand));
}

export function parsonsSet(n: number, rand = Math.random): ParsonsProblem[] {
  return shuffled(PARSONS as ParsonsProblem[], rand).slice(0, n);
}

export function parsonsCorrect(p: ParsonsProblem, order: number[]): boolean {
  const ok = (ref: number[]) => ref.length === order.length && ref.every((v, i) => p.lines[v] === p.lines[order[i]]);
  return ok(p.lines.map((_, i) => i)) || (p.alts ?? []).some(ok);
}

/** Group per-area results into report rows: one per unit, plus one for patterns. */
export function reportRows(byArea: Record<string, [number, number]>) {
  const rows = new Map<string, { label: string; right: number; total: number }>();
  for (const [area, [r, t]] of Object.entries(byArea)) {
    let key: string, label: string;
    if (area.startsWith('pat:')) {
      key = 'patterns';
      label = 'Interview patterns';
    } else {
      const part = PARTS.find((p) => p.id === TOPIC[area]?.part);
      key = part?.id ?? 'other';
      label = part ? part.title : 'Other';
    }
    const row = rows.get(key) ?? { label, right: 0, total: 0 };
    row.right += r;
    row.total += t;
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => a.right / a.total - b.right / b.total);
}

export const areaTitle = (area: string) => (area.startsWith('pat:') ? patTitle(area.slice(4)) : TOPIC[area]?.title ?? area);
export const areaLink = (area: string) => (area.startsWith('pat:') ? `/patterns/${area.slice(4)}` : `/learn/${area}`);
