/** Curriculum registry: units ("parts") and topics, in teaching order. */

export type PartId = 'found' | 'sort' | 'ds' | 'trees' | 'tech' | 'graph' | 'sel' | 'adv';

export interface Part {
  id: PartId;
  n: number;
  title: string;
  sub: string;
}

export interface QuizQuestion {
  q: string;
  opts: string[];
  a: number;
  why?: string;
  code?: string;
  lang?: 'py' | 'cpp' | 'pseudo';
}

export interface Ask {
  q: string;
  pick?: string | string[];
  choices?: string[];
  answer?: number;
  value?: number | string;
  hint?: string;
  s?: unknown;
}

export interface Frame {
  s: any;
  line?: number | number[];
  msg?: string;
  ask?: Ask | null;
}

export interface Preset {
  label: string;
  input: any;
  note?: string;
}

export interface Viz {
  presets: Preset[];
  run: (input: any) => Frame[];
  parse?: (raw: string) => any;
  random?: () => string;
  inputHint?: string;
  noInput?: boolean;
  drill?: boolean;
  legend?: string;
}

export interface CodeSet {
  pseudo?: string;
  py?: string;
  cpp?: string;
}

export interface Topic {
  id: string;
  title: string;
  part: PartId;
  blurb: string;
  sec?: string;
  prereq?: string[];
  beyond?: boolean;
  tags?: string;
  cx?: [string, string][];
  props?: string[];
  learn?: string;
  code?: CodeSet;
  codeNotes?: string;
  viz?: Viz;
  quiz?: QuizQuestion[];
  /** Imperative interactive mounted on the Visualize tab. */
  custom?: (el: HTMLElement) => void;
  /** Extra practice block mounted on the Practice tab. */
  practice?: (el: HTMLElement) => void;
}

export const PARTS: Part[] = [
  { id: 'found', n: 1, title: 'Foundations', sub: 'Analysis, growth, recurrences' },
  { id: 'sort', n: 2, title: 'Sorting and Searching', sub: 'Comparison sorts, linear sorts, selection' },
  { id: 'ds', n: 3, title: 'Core Data Structures', sub: 'Arrays, lists, stacks, queues, hashing' },
  { id: 'trees', n: 4, title: 'Trees and Heaps', sub: 'Search trees, balanced trees, heaps, tries' },
  { id: 'tech', n: 5, title: 'Design Techniques', sub: 'Divide and conquer, DP, greedy, backtracking' },
  { id: 'graph', n: 6, title: 'Graph Algorithms', sub: 'Traversal, spanning trees, shortest paths, flow' },
  { id: 'sel', n: 7, title: 'Strings, Math, Geometry', sub: 'Matching, number theory, hulls, bits' },
  { id: 'adv', n: 8, title: 'Advanced Topics', sub: 'Advanced heaps, NP-completeness, FFT, LP' },
];

export const TOPICS: Topic[] = [];
export const TOPIC: Record<string, Topic> = {};

let currentPart: PartId = 'found';

/** Sets the unit that subsequent topic() calls belong to. */
export function setPart(part: PartId): void {
  currentPart = part;
}

type TopicInput = Omit<Topic, 'part'> & { part?: PartId };

export function topic(t: TopicInput): void {
  const full: Topic = { ...t, part: t.part ?? currentPart };
  if (TOPIC[full.id]) throw new Error(`Duplicate topic id "${full.id}"`);
  TOPICS.push(full);
  TOPIC[full.id] = full;
}

export const partOf = (t: Topic): Part => PARTS.find((p) => p.id === t.part)!;
