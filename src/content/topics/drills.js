/* Step-through drills for topics whose main figure is a custom interactive or a diagram.
   Each one plugs into the standard player, so it gets predict mode, scoring and the Practice drill. */
import { Rec, parseNums, pick, rangeHl, rnd, shuffle, uniqArr } from '../../engine/helpers';
import { addViz } from '../registry';
import { gview, parseGraph } from './graphs';

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = n => String(n).split('').map(c => SUP[c] ?? c).join('');
const lg = Math.log2;
/** Shuffle choices and return them with the index of the right one. */
function choices(right, wrong) {
  const all = shuffle([right, ...new Set(wrong.filter(w => w !== right))]);
  return { choices: all, answer: all.indexOf(right) };
}

/* ======================= Algorithms and their cost: linear search ======================= */
addViz('algorithms', {
  inputHint: 'Numbers / value to find',
  presets: [
    { label: 'Found in the middle', input: '31 41 59 26 41 58 / 26', note: 'Four comparisons: neither the best nor the worst case.' },
    { label: 'Not present (worst case)', input: '8 3 9 1 7 / 5', note: 'Every element is compared once: n comparisons, the worst case.' },
    { label: 'First element (best case)', input: '12 4 7 9 / 12', note: 'One comparison, whatever n is.' },
  ],
  random: () => { const a = uniqArr(rnd(6, 9), 1, 60); return a.join(' ') + ' / ' + (Math.random() < 0.75 ? pick(a) : rnd(61, 99)); },
  parse: s => { const [l, r] = s.split('/'); if (r == null) throw new Error('Add "/ value", for example 3 8 1 / 8.'); return { a: parseNums(l, { min: 1, max: 14 }), x: parseNums(r, { min: 1, max: 1 })[0] }; },
  run({ a, x }) {
    const R = Rec(); let c = 0;
    const st = (i, hl = {}) => ({ vars: { x, comparisons: c }, arrays: [{ a, hl: { ...rangeHl(0, i - 1, 'dim'), ...hl }, ptr: i < a.length ? { i } : {} }] });
    R.add(st(0), 0, `Search for ${x} from the left. Under the RAM model each comparison costs one step, so the running time is the number of comparisons.`);
    for (let i = 0; i < a.length; i++) {
      c++;
      const hit = a[i] === x;
      R.add(st(i, { [i]: hit ? 'found' : 'cmp' }), 0, hit ? `A[${i}] = ${x}. Found after ${c} comparison${c === 1 ? '' : 's'}.` : `A[${i}] = ${a[i]} ≠ ${x}. Keep going.`,
        { q: `Compare A[${i}] = ${a[i]} with ${x}. What happens?`, choices: ['Found it, stop', 'Not equal, keep going'], answer: hit ? 0 : 1 });
      if (hit) {
        R.add(st(i, { [i]: 'found' }), 0, `Total: ${c} step${c === 1 ? '' : 's'}. Best case is 1 (x first), worst case is n = ${a.length} (x last or absent). The worst case is the number the book reports: Θ(n).`, { q: 'How many comparisons did this search make?', value: c });
        return R.f;
      }
    }
    R.add(st(a.length), 0, `${x} is not in the array. All ${a.length} elements were compared: the worst case, n steps, so linear search is Θ(n).`, { q: 'How many comparisons did this search make?', value: c });
    return R.f;
  },
});

/* ======================= Asymptotic notation: growth race ======================= */
const lgFact = n => (n <= 170 ? Array.from({ length: n }, (_, i) => lg(i + 1)).reduce((s, v) => s + v, 0) : (n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n)) / Math.LN2);
const FORMS = [
  { re: /^n!$/, lab: 'n!', f: n => lgFact(n) },
  { re: /^2\^n$/, lab: '2ⁿ', f: n => n },
  { re: /^n\^([2-4])$/, lab: m => 'n' + sup(m[1]), f: (n, m) => +m[1] * lg(n) },
  { re: /^n\s*(lg|log)\s*n$/, lab: 'n lg n', f: n => lg(n) + lg(lg(n)) },
  { re: /^(lg|log)\s*n$/, lab: 'lg n', f: n => lg(lg(n)) },
  { re: /^(sqrt\s*n|√n)$/, lab: '√n', f: n => 0.5 * lg(n) },
  { re: /^n$/, lab: 'n', f: n => lg(n) },
];
function parseGrowth(raw) {
  const s = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (/^\d+$/.test(s)) { const c = +s; return { label: String(c), lgv: () => lg(c) }; }
  const m0 = /^(?:(\d+)(?![\d^])\s*\*?\s*)?(.+)$/.exec(s);
  const c = m0[1] ? +m0[1] : 1, body = m0[2].trim();
  if (c < 1 || c > 10000) throw new Error('Keep constant factors between 1 and 10000.');
  for (const F of FORMS) {
    const m = F.re.exec(body);
    if (m) { const lab = typeof F.lab === 'function' ? F.lab(m) : F.lab; return { label: (c > 1 ? c + (/^[0-9]/.test(lab) ? '·' : '') : '') + lab, lgv: n => lg(c) + F.f(n, m) }; }
  }
  throw new Error(`"${raw.trim()}" is not a form I know. Try 100n, n^2, n lg n, 2^n, n!, sqrt n, lg n or a constant.`);
}
function fmtLg(v) {
  if (v === -Infinity) return '0';
  if (v < 40) { const x = 2 ** v; return Math.abs(x - Math.round(x)) < 1e-6 ? Math.round(x).toLocaleString('en-US') : (+x.toPrecision(3)).toLocaleString('en-US'); }
  const d = v * Math.log10(2), k = Math.floor(d);
  return `${(10 ** (d - k)).toFixed(1)}×10${sup(k)}`;
}
const GROWTH = ['100n', 'n^2', 'n lg n', '2^n', 'n^3', '20 lg n', 'sqrt n', 'n!', '50 n lg n', '3 n^2', '1000', '8n'];
addViz('asymptotic', {
  inputHint: 'f | g, e.g. 100n | n^2',
  presets: [
    { label: '100n against n²', input: '100n | n^2', note: '100n wins until n = 100, then n² takes over for good.' },
    { label: 'n lg n against n²', input: 'n lg n | n^2' },
    { label: 'n³ against 2ⁿ', input: 'n^3 | 2^n', note: 'Exponential growth overtakes any polynomial.' },
    { label: '3n against n (same order)', input: '3n | n' },
  ],
  random: () => { const [a, b] = shuffle(GROWTH).slice(0, 2); return `${a} | ${b}`; },
  parse: s => { const [a, b] = s.split('|'); if (b == null) throw new Error('Write two functions separated by |, e.g. 100n | n^2.'); return { f: parseGrowth(a), g: parseGrowth(b) }; },
  run({ f, g }) {
    const R = Rec(); const rows = [];
    const ns = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
    const winner = (a, b) => (Math.abs(a - b) < 1e-9 ? 2 : a > b ? 0 : 1);
    const opts = [f.label, g.label, 'Equal'];
    const st = (hl = {}) => ({ table: { title: 'Values as n doubles', colH: ['n', f.label, g.label, 'larger'], cells: rows.map(r => [...r]), hl, name: 'g' } });
    R.add(st(), 0, `Compare f(n) = ${f.label} with g(n) = ${g.label}. Asymptotic notation only cares which one is larger for every large enough n.`);
    ns.forEach((n, i) => {
      const a = f.lgv(n), b = g.lgv(n), w = winner(a, b);
      const ask = i >= 2 ? { q: `At n = ${n}, which is larger?`, choices: opts, answer: w } : null;
      rows.push([n, fmtLg(a), fmtLg(b), opts[w]]);
      R.add(st({ [i + ',3']: 'found', [i + ',' + (w === 2 ? 3 : w + 1)]: 'cur' }), 0, `n = ${n}: ${f.label} = ${fmtLg(a)}, ${g.label} = ${fmtLg(b)}.`, ask);
    });
    const d1 = f.lgv(2 ** 20) - g.lgv(2 ** 20), d2 = f.lgv(2 ** 40) - g.lgv(2 ** 40);
    let verdict, ans;
    if (Math.abs(d2 - d1) < 1e-6) { verdict = `The ratio f/g stays at ${fmtLg(d1)}: they grow at the same rate, so f = Θ(g).`; ans = 2; }
    else if (d2 > d1) { verdict = `f keeps pulling away: f = Ω(g) but not O(g), so g = o(f).`; ans = 0; }
    else { verdict = `g keeps pulling away: f = O(g) but not Ω(g), so f = o(g).`; ans = 1; }
    R.add(st(), 0, verdict, { q: 'As n grows without bound, which function dominates?', choices: [f.label, g.label, 'Neither: same order'], answer: ans });
    return R.f;
  },
});

/* ======================= Recurrences: recursion tree ======================= */
addViz('recurrences', {
  inputHint: 'a b d n for T(n) = aT(n/b) + n^d',
  presets: [
    { label: 'Merge sort: 2T(n/2) + n', input: '2 2 1 16', note: 'Every level costs n: Θ(n lg n).' },
    { label: 'Binary search: T(n/2) + 1', input: '1 2 0 16', note: 'Every level costs 1 and there are lg n levels.' },
    { label: 'Leaves win: 4T(n/2) + n', input: '4 2 1 16', note: 'Level costs double each time; the leaves dominate: Θ(n²).' },
    { label: 'Root wins: 2T(n/2) + n²', input: '2 2 2 16', note: 'Level costs halve; the root dominates: Θ(n²).' },
  ],
  random: () => { const b = rnd(2, 3), k = b === 2 ? rnd(3, 4) : rnd(2, 3); return `${rnd(1, 4)} ${b} ${rnd(0, 2)} ${b ** k}`; },
  parse: s => {
    const [a, b, d, n] = parseNums(s, { min: 4, max: 4, lo: 0, hi: 4096 });
    if (a < 1 || a > 8) throw new Error('Use a between 1 and 8.');
    if (b < 2 || b > 4) throw new Error('Use b between 2 and 4.');
    if (d > 3) throw new Error('Use d between 0 and 3.');
    const k = Math.round(Math.log(n) / Math.log(b));
    if (k < 1 || b ** k !== n) throw new Error(`n must be a power of b, like ${b ** 3}.`);
    if (k > 6 || a ** k > 4096) throw new Error('That tree is too big to draw; use a smaller n.');
    return { a, b, d, n, k };
  },
  run({ a, b, d, n, k }) {
    const R = Rec(); const rows = []; let total = 0;
    const T = `T(n) = ${a === 1 ? '' : a}T(n/${b}) + ${d === 0 ? '1' : d === 1 ? 'n' : 'n' + sup(d)}`;
    const st = (hl = {}) => ({ vars: { recurrence: T, n, 'total so far': total }, table: { title: 'Recursion tree, one row per level', colH: ['level', 'nodes', 'size', 'cost per node', 'level cost'], cells: rows.map(r => [...r]), hl, name: 'r' } });
    R.add(st(), 0, `Expand ${T} with n = ${n}. Each level has ${a} times as many nodes, and each subproblem is ${b} times smaller. The tree has ${k} levels below the root.`);
    for (let i = 0; i <= k; i++) {
      const nodes = a ** i, size = n / b ** i, per = size ** d, cost = nodes * per;
      total += cost;
      rows.push([i, nodes, size, per, cost]);
      const ask = i >= 1 ? { q: `Level ${i} has ${nodes} node${nodes === 1 ? '' : 's'} of size ${size}, each costing ${size}${d === 1 ? '' : sup(d)}. What does the level cost?`, value: cost, hint: 'nodes × cost per node' } : null;
      R.add(st({ [i + ',4']: 'cur' }), 0, i === k ? `Level ${k} is the leaves: ${nodes} base cases of cost 1 each.` : `Level ${i}: ${nodes} × ${per} = ${cost}.`, ask);
    }
    const bd = b ** d, cmp = a < bd ? 0 : a === bd ? 1 : 2;
    const pw = e => (e === 0 ? '1' : e === 1 ? 'n' : Number.isInteger(e) ? 'n' + sup(e) : `n^${e.toFixed(2)}`);
    const ex = Math.log(a) / Math.log(b), exR = Math.abs(ex - Math.round(ex)) < 1e-9 ? Math.round(ex) : ex;
    const res = cmp === 0 ? `Θ(${pw(d)})` : cmp === 1 ? (d === 0 ? 'Θ(lg n)' : `Θ(${pw(d)} lg n)`) : `Θ(${pw(exR)})`;
    const why = cmp === 0 ? `a = ${a} < b${sup(d)} = ${bd}: level costs shrink geometrically, so the root's work dominates` : cmp === 1 ? `a = ${a} = b${sup(d)} = ${bd}: every level costs the same, times ${k + 1} levels` : `a = ${a} > b${sup(d)} = ${bd}: level costs grow geometrically, so the leaves dominate`;
    R.add(st(), 0, `Total ${total}. ${why}, which gives ${res} (master theorem case ${cmp === 0 ? 3 : cmp === 1 ? 2 : 1}).`, { q: 'Where is most of the work?', choices: ['At the root', 'Spread evenly over the levels', 'At the leaves'], answer: cmp });
    return R.f;
  },
});

/* ======================= Probabilistic analysis: the hiring problem ======================= */
addViz('probabilistic', {
  inputHint: 'Candidate scores in interview order',
  presets: [
    { label: 'Random order', input: '5 2 8 1 6 9 3 7 4 10' },
    { label: 'Worst order: increasing', input: '1 2 3 4 5 6 7 8', note: 'Every candidate is better than the last, so every one is hired: n hires.' },
    { label: 'Best order: best first', input: '9 4 7 2 8 1 5', note: 'Only the first is hired.' },
  ],
  random: () => shuffle(Array.from({ length: rnd(8, 10) }, (_, i) => i + 1)).join(' '),
  parse: s => { const a = parseNums(s, { min: 2, max: 14, lo: 1, hi: 999 }); if (new Set(a).size !== a.length) throw new Error('Use distinct scores.'); return a; },
  run(a) {
    const R = Rec(); let best = -Infinity, bi = -1, hires = 0; const hired = {};
    const st = (i, extra = {}) => ({ vars: { 'best so far': bi < 0 ? '—' : best, hires }, arrays: [{ a, label: 'Candidates, in the order they arrive', hl: { ...Object.fromEntries(Object.keys(hired).map(k => [k, 'done'])), ...(i >= 0 && i < a.length ? { [i]: 'cur' } : {}), ...extra }, ptr: bi >= 0 ? { best: bi } : {} }] });
    R.add(st(-1), 7, 'Interview the candidates in order and hire anyone better than the current best. Hiring is the costly step, so we count hires.');
    a.forEach((x, i) => {
      const better = x > best;
      R.add(st(i), [9, 10], `Candidate ${i + 1} scores ${x}.`, { q: `Candidate ${i + 1} scores ${x}${bi >= 0 ? ` and the best so far is ${best}` : ''}. Hire?`, choices: ['Hire', 'Skip'], answer: better ? 0 : 1 });
      if (better) { best = x; bi = i; hires++; hired[i] = 1; R.add(st(i, { [i]: 'found' }), [11, 12], `${x} beats everyone so far: hire. That is hire number ${hires}.`); }
    });
    const H = Array.from({ length: a.length }, (_, i) => 1 / (i + 1)).reduce((s, v) => s + v, 0);
    R.add(st(-1), 0, `${hires} hire${hires === 1 ? '' : 's'}. Candidate i is hired exactly when it is the best of the first i, which happens with probability 1/i in a random order. So the expected number of hires is 1 + 1/2 + … + 1/${a.length} ≈ ${H.toFixed(2)}, about ln n.`);
    return R.f;
  },
});

/* ======================= RSA: the Miller–Rabin witness test ======================= */
const powmod = (a, e, m) => { let r = 1, b = a % m; while (e > 0) { if (e & 1) r = (r * b) % m; b = (b * b) % m; e = Math.floor(e / 2); } return r; };
addViz('rsa', {
  inputHint: 'a n (is a a witness that n is composite?)',
  presets: [
    { label: '7 against 561 (a Carmichael number)', input: '7 561', note: '561 fools the plain Fermat test for every base coprime to it, but Miller–Rabin finds a nontrivial square root of 1.' },
    { label: '2 against 13 (prime)', input: '2 13', note: 'No witness exists for a prime.' },
    { label: '2 against 15', input: '2 15' },
    { label: '2 against 341', input: '2 341', note: '341 = 11 × 31 passes the Fermat test for base 2, but not this one.' },
  ],
  random: () => { const n = 2 * rnd(4, 120) + 1; return `${rnd(2, n - 2)} ${n}`; },
  parse: s => {
    const [a, n] = parseNums(s, { min: 2, max: 2, lo: 2, hi: 99999 });
    if (n % 2 === 0 || n < 5) throw new Error('n must be odd and at least 5.');
    if (a < 2 || a > n - 2) throw new Error(`a must be between 2 and n − 2 = ${n - 2}.`);
    return { a, n };
  },
  run({ a, n }) {
    const R = Rec(); let t = 0, u = n - 1; while (u % 2 === 0) { u /= 2; t++; }
    const xs = [];
    const st = (hl = {}) => ({ vars: { a, n, 'n − 1': `${n - 1} = 2${sup(t)} · ${u}` }, arrays: [{ name: 'x', a: xs.length ? [...xs] : [null], label: 'x₀, x₁, …: each is the square of the one before, mod n', hl }] });
    R.add({ vars: { a, n } }, 1, `Is ${a} a witness that ${n} is composite?`);
    R.add({ vars: { a, n, 'n − 1': `${n - 1} = 2${sup(t)} · ${u}` } }, 2, `Split off the factors of 2: ${n - 1} = 2${sup(t)} · ${u}, with ${u} odd.`, { q: `${n - 1} = 2ᵗ · u with u odd. What is u?`, value: u, hint: `Keep halving ${n - 1} until it is odd.` });
    xs.push(powmod(a, u, n));
    R.add(st({ 0: 'cur' }), 3, `x₀ = ${a}${sup(u)} mod ${n} = ${xs[0]}, by repeated squaring.`);
    for (let i = 1; i <= t; i++) {
      const prev = xs[i - 1], x = (prev * prev) % n;
      xs.push(x);
      const nontrivial = x === 1 && prev !== 1 && prev !== n - 1;
      R.add(st({ [i]: 'cur', [i - 1]: 'cmp' }), 5, `x${'₀₁₂₃₄₅₆₇₈₉'[i] ?? i} = ${prev}² mod ${n} = ${x}.`);
      R.add(st({ [i]: nontrivial ? 'warn' : 'cur', [i - 1]: 'cmp' }), 6, nontrivial ? `${x} = 1 but the previous value ${prev} is neither 1 nor ${n - 1}: a nontrivial square root of 1 mod ${n}. Primes have none, so ${n} is composite.` : x === 1 ? `x = 1, but its square root was ${prev === 1 ? '1' : `${n - 1} (that is, −1)`}, a trivial one. Nothing learned.` : `${x} is not 1 yet.`,
        { q: `x went from ${prev} to ${x}. Is that a nontrivial square root of 1?`, choices: ['Yes: n is composite', 'No: keep squaring'], answer: nontrivial ? 0 : 1 });
      if (nontrivial) { R.add(st({ [i]: 'warn' }), 7, `${a} is a witness: ${n} is certainly composite.`); return R.f; }
    }
    const xt = xs[t];
    if (xt !== 1) {
      R.add(st({ [t]: 'warn' }), [8, 9], `x${'ₜ'} = ${a}${sup(n - 1)} mod ${n} = ${xt} ≠ 1, so Fermat's little theorem fails: ${n} is composite and ${a} is a witness.`, { q: `${a}^(n−1) mod n = ${xt}. Verdict?`, choices: ['Composite', 'Probably prime'], answer: 0 });
    } else {
      R.add(st({ [t]: 'done' }), 10, `${a}${sup(n - 1)} ≡ 1 and no nontrivial square root of 1 appeared, so ${a} is not a witness. ${n} is ${isPrime(n) ? 'in fact prime' : 'actually composite, and this a is a liar; trying more random bases catches it with probability at least 1/2 each time'}.`, { q: 'No witness found with this a. Verdict?', choices: ['Composite', 'Probably prime'], answer: 1 });
    }
    return R.f;
  },
});
function isPrime(n) { for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return n > 1; }

/* ======================= Bit manipulation: Kernighan's popcount ======================= */
addViz('bit-manipulation', {
  inputHint: 'A number from 1 to 65535',
  presets: [{ label: '44 = 101100', input: '44' }, { label: '255', input: '255' }, { label: '1024', input: '1024', note: 'A single set bit: one iteration, even though 1024 needs 11 bits.' }],
  random: () => String(rnd(5, 4000)),
  parse: s => parseNums(s, { min: 1, max: 1, lo: 1, hi: 65535 })[0],
  run(x0) {
    const R = Rec(); const w = Math.max(8, Math.ceil(lg(x0 + 1) / 4) * 4); let x = x0, c = 0;
    const bits = v => Array.from({ length: w }, (_, i) => (v >> (w - 1 - i)) & 1);
    const labels = Array.from({ length: w }, (_, i) => String(w - 1 - i));
    const st = (rows, msgv) => ({ vars: { x: x, 'set bits counted': c, ...msgv }, arrays: rows });
    const row = (name, v, label, hl = {}) => ({ name, a: bits(v), label: `${label} = ${v}`, idxLabels: labels, small: true, hl: { ...Object.fromEntries(bits(v).map((b, i) => [i, b ? 'cmp' : undefined]).filter(e => e[1])), ...hl } });
    R.add(st([row('a', x, 'x')]), 0, `x = ${x0} in binary. Count its set bits by clearing the lowest one until x is 0.`);
    while (x) {
      const low = x & -x, p = Math.round(lg(low)), idx = w - 1 - p;
      R.add(st([row('a', x, 'x'), row('m', x - 1, 'x − 1', rangeHl(idx, w - 1, 'swap'))]), 0, `x − 1 flips the lowest set bit (bit ${p}) and every 0 below it.`, { q: 'Which bit of x does x & (x − 1) clear? Click it in the top row.', pick: 'a:' + idx, hint: 'The lowest 1, furthest to the right.' });
      x &= x - 1; c++;
      R.add(st([row('a', x, 'x after x &= x − 1', { [idx]: 'warn' })]), 0, `Bit ${p} is cleared. Count = ${c}.`);
    }
    R.add(st([row('a', x0, 'original x', {})]), 0, `x is 0 after ${c} iteration${c === 1 ? '' : 's'}: one per set bit, not one per bit position.`, { q: `How many set bits does ${x0} have?`, value: c });
    return R.f;
  },
});

/* ======================= NP-completeness: verifying a certificate ======================= */
addViz('np-complete', {
  inputHint: 'Clauses separated by commas | assignment, e.g. 1 -2 3, -1 2 3 | 101',
  presets: [
    { label: 'A satisfying assignment', input: '1 -2 3, -1 2 3, 1 2 -3, -1 -2 -3 | 110' },
    { label: 'A failing assignment', input: '1 -2 3, -1 2 3, 1 2 -3, -1 -2 -3 | 111', note: 'The last clause needs at least one variable to be false.' },
  ],
  random: () => {
    const v = rnd(3, 4), m = rnd(4, 5);
    const cl = Array.from({ length: m }, () => shuffle(Array.from({ length: v }, (_, i) => i + 1)).slice(0, 3).map(x => (Math.random() < 0.5 ? -x : x)).join(' '));
    return cl.join(', ') + ' | ' + Array.from({ length: v }, () => rnd(0, 1)).join('');
  },
  parse: s => {
    const [l, r] = s.split('|');
    if (r == null) throw new Error('Add "| assignment", e.g. | 101.');
    const clauses = l.split(',').map(c => parseNums(c, { min: 1, max: 3, lo: -9, hi: 9 }));
    if (clauses.length > 8) throw new Error('Use at most 8 clauses.');
    const asg = r.trim();
    if (!/^[01]+$/.test(asg)) throw new Error('The assignment is a string of 0s and 1s, one per variable.');
    for (const c of clauses) for (const lit of c) if (lit === 0 || Math.abs(lit) > asg.length) throw new Error(`Literal ${lit} refers to a variable the assignment does not set.`);
    return { clauses, asg: asg.split('').map(Number) };
  },
  run({ clauses, asg }) {
    const R = Rec();
    const name = lit => (lit < 0 ? '¬x' : 'x') + Math.abs(lit);
    const val = lit => (lit < 0 ? 1 - asg[-lit - 1] : asg[lit - 1]);
    const done = [];
    const st = (hl = {}) => ({ vars: Object.fromEntries(asg.map((b, i) => ['x' + (i + 1), b ? 'true' : 'false'])), table: { title: 'Each clause needs at least one true literal', colH: ['clause', 'literals', 'values', 'satisfied?'], cells: clauses.map((c, j) => [j + 1, c.map(name).join(' ∨ '), c.map(l => (val(l) ? 'T' : 'F')).join(' '), done[j] ?? '']), hl, name: 'c' } });
    R.add(st(), 0, 'The certificate is an assignment of true or false to each variable. The verifier checks every clause once.');
    for (let j = 0; j < clauses.length; j++) {
      const ok = clauses[j].some(l => val(l));
      done[j] = ok ? 'yes' : 'no';
      R.add(st({ [j + ',3']: ok ? 'done' : 'warn', [j + ',2']: 'cur' }), 0, ok ? `Clause ${j + 1} has a true literal.` : `Clause ${j + 1} has no true literal: the assignment fails. Reject this certificate.`, { q: `Clause ${j + 1}: ${clauses[j].map(name).join(' ∨ ')}. Satisfied?`, choices: ['Yes', 'No'], answer: ok ? 0 : 1 });
      if (!ok) { R.add(st({ [j + ',3']: 'warn' }), 0, 'Rejected. That does not prove the formula is unsatisfiable, only that this certificate is wrong. Finding a good one may need trying exponentially many.'); return R.f; }
    }
    R.add(st(), 0, `All ${clauses.length} clauses are satisfied: accept. Checking took time linear in the size of the formula, which is why 3-CNF satisfiability is in NP.`);
    return R.f;
  },
});

/* ======================= Fibonacci heaps: consolidate after extract-min ======================= */
addViz('fib-heaps', {
  inputHint: 'Keys to insert',
  presets: [{ label: 'Nine inserts, then extract-min', input: '23 7 21 3 18 52 38 39 41' }, { label: 'Five inserts', input: '17 24 26 30 35' }],
  random: () => uniqArr(rnd(6, 10), 1, 60).join(' '),
  parse: s => { const a = parseNums(s, { min: 3, max: 12, lo: 0, hi: 999 }); if (new Set(a).size !== a.length) throw new Error('Use distinct keys.'); return a; },
  run(keys) {
    const R = Rec();
    const kids = Object.fromEntries(keys.map(k => [k, []]));
    let roots = [...keys];
    const A = [];
    const forest = (cls = {}) => ({ nodes: Object.fromEntries(Object.entries(kids).filter(([k]) => k in kids).map(([k, c]) => [k, { k: +k, c: c.map(String), cls: cls[k] }])), roots: roots.map(String), levelH: 54, aria: 'Root list of the heap' });
    const st = (cls = {}, msgv = {}, Ahl = {}) => ({ vars: msgv, tree: forest(cls), arrays: [{ name: 'A', a: A.length ? Array.from(A, v => v ?? null) : [null], idxLabels: Array.from({ length: Math.max(1, A.length) }, (_, d) => 'deg ' + d), label: 'A[d]: the root seen so far with degree d', small: true, hl: Ahl }] });
    const deg = k => kids[k].length;
    R.add(st({}, { roots: roots.length }), 0, `After ${keys.length} inserts the heap is just a list of single-node trees. Insert is O(1) because it never tidies up.`);
    const m = Math.min(...roots);
    roots = roots.filter(k => k !== m); delete kids[m];
    R.add(st({}, { 'removed min': m, roots: roots.length }), 0, `Extract-min removes ${m}. Now consolidate: link roots of equal degree until every root has a different degree.`);
    for (const w of [...roots]) {
      let x = w, d = deg(x);
      R.add(st({ [x]: 'cur' }, { 'current root': x, degree: d }, A[d] != null ? { [d]: 'cmp' } : {}), 0, `Take root ${x}, degree ${d}.`);
      while (A[d] != null) {
        let y = A[d];
        const parent = Math.min(x, y);
        const c = choices(String(parent), [String(Math.max(x, y))]);
        R.add(st({ [x]: 'cur', [y]: 'cmp' }, { 'current root': x, degree: d }, { [d]: 'cmp' }), 0, `A[${d}] already holds ${y}. Two trees of degree ${d} must be linked.`, { q: `Link ${x} and ${y}. Which key becomes the parent?`, ...c });
        if (x > y) [x, y] = [y, x];
        kids[x].push(y);
        roots = roots.filter(k => k !== y);
        A[d] = null; d++;
        R.add(st({ [x]: 'cur', [y]: 'ok' }, { 'current root': x, degree: d }), 0, `${y} becomes a child of ${x}. ${x} now has degree ${d}.`);
      }
      A[d] = x;
      R.add(st({ [x]: 'ok' }, { 'current root': x, degree: d }, { [d]: 'done' }), 0, `Store ${x} in A[${d}].`);
    }
    const newMin = Math.min(...roots);
    R.add(st({ [newMin]: 'cur' }, { roots: roots.length, 'new min': newMin }), 0, `Done: ${roots.length} roots with distinct degrees, at most lg n + 1 of them. The new minimum is ${newMin}. The long, lazy root list paid for this work, which is why extract-min is O(lg n) amortized.`, { q: 'Which key is the new minimum?', value: newMin });
    return R.f;
  },
});

/* ======================= van Emde Boas: successor in a 16-element universe ======================= */
addViz('veb', {
  inputHint: 'Set from 0..15 | x',
  presets: [
    { label: 'Successor in the same cluster', input: '2 3 4 5 7 14 15 | 4' },
    { label: 'Successor via the summary', input: '2 3 4 5 7 14 15 | 7', note: 'Cluster 1 has nothing above 7, so the summary finds cluster 3.' },
    { label: 'No successor', input: '1 6 9 | 12' },
  ],
  random: () => uniqArr(rnd(4, 7), 0, 15).sort((a, b) => a - b).join(' ') + ' | ' + rnd(0, 14),
  parse: s => { const [l, r] = s.split('|'); if (r == null) throw new Error('Add "| x".'); return { S: [...new Set(parseNums(l, { min: 1, max: 16, lo: 0, hi: 15 }))], x: parseNums(r, { min: 1, max: 1, lo: 0, hi: 15 })[0] }; },
  run({ S, x }) {
    const R = Rec(); const has = new Set(S);
    const cells = Array.from({ length: 4 }, (_, hi) => Array.from({ length: 4 }, (_, lo) => (has.has(hi * 4 + lo) ? hi * 4 + lo : '·')));
    const summary = [0, 1, 2, 3].map(c => (cells[c].some(v => v !== '·') ? 1 : 0));
    const st = (hl = {}, shl = {}, v = {}) => ({ order: ['vars', 'tables', 'arrays'], vars: { u: 16, '√u': 4, x, ...v }, tables: [{ title: 'Clusters: cluster i holds 4i .. 4i + 3', colH: ['low 0', 'low 1', 'low 2', 'low 3'], rowH: ['cluster 0', 'cluster 1', 'cluster 2', 'cluster 3'], cells, hl, name: 'v' }], arrays: [{ name: 's', a: summary, label: 'Summary: is cluster i non-empty? (c0 … c3)', idxLabels: ['c0', 'c1', 'c2', 'c3'], small: true, hl: shl }] });
    const hi = Math.floor(x / 4), lo = x % 4;
    R.add(st(), 0, `Find the successor of ${x}: the smallest element larger than ${x}.`);
    R.add(st({ [hi + ',' + lo]: 'cur' }, {}, { 'high(x)': hi, 'low(x)': lo }), 0, `high(${x}) = ⌊${x} / 4⌋ = ${hi} picks the cluster; low(${x}) = ${x} mod 4 = ${lo} is the position inside it.`, { q: `high(${x}) = ⌊x / √u⌋. Which cluster?`, value: hi });
    const inCluster = [0, 1, 2, 3].filter(l => l > lo && cells[hi][l] !== '·');
    const hl = { [hi + ',' + lo]: 'cur', ...Object.fromEntries([1, 2, 3].filter(l => l > lo).map(l => [hi + ',' + l, 'cmp'])) };
    R.add(st(hl, {}, { 'high(x)': hi, 'low(x)': lo }), 0, inCluster.length ? `Cluster ${hi} has an element after position ${lo} (the cluster's max is larger).` : `Cluster ${hi} has nothing after position ${lo}.`, { q: `Is there an element in cluster ${hi} larger than ${x}?`, choices: ['Yes: answer is in this cluster', 'No: ask the summary'], answer: inCluster.length ? 0 : 1 });
    if (inCluster.length) {
      const ans = hi * 4 + inCluster[0];
      R.add(st({ [hi + ',' + inCluster[0]]: 'found' }, {}, { successor: ans }), 0, `Recurse inside cluster ${hi} only: the successor is ${ans}. One recursive call on a universe of size √u.`, { q: `What is the successor of ${x}?`, value: ans });
      return R.f;
    }
    const nextC = [0, 1, 2, 3].find(c => c > hi && summary[c]);
    if (nextC == null) {
      R.add(st({}, Object.fromEntries([0, 1, 2, 3].filter(c => c > hi).map(c => [c, 'cmp']))), 0, `The summary has no non-empty cluster after ${hi}: ${x} has no successor.`, { q: 'Is there a non-empty cluster after this one?', choices: ['Yes', 'No: no successor'], answer: 1 });
      return R.f;
    }
    R.add(st({}, { [nextC]: 'found' }), 0, `Recurse on the summary: the next non-empty cluster after ${hi} is ${nextC}.`, { q: `Which cluster does the summary report next? Click it.`, pick: 's:' + nextC });
    const minLo = [0, 1, 2, 3].find(l => cells[nextC][l] !== '·'), ans = nextC * 4 + minLo;
    R.add(st({ [nextC + ',' + minLo]: 'found' }, { [nextC]: 'found' }, { successor: ans }), 0, `Its minimum, stored directly so no recursion is needed, is ${ans}. Each step recursed once on a universe of size √u, giving O(lg lg u).`, { q: `What is the successor of ${x}?`, value: ans });
    return R.f;
  },
});

/* ======================= FFT: the even/odd split ======================= */
addViz('fft', {
  inputHint: 'n: 4, 8 or 16 coefficients',
  presets: [{ label: 'n = 8', input: '8' }, { label: 'n = 4', input: '4' }, { label: 'n = 16', input: '16' }],
  random: () => String(pick([4, 8, 8, 16])),
  parse: s => { const n = parseNums(s, { min: 1, max: 1, lo: 2, hi: 16 })[0]; if (![4, 8, 16].includes(n)) throw new Error('Use n = 4, 8 or 16.'); return n; },
  run(n) {
    const R = Rec(); const nodes = { r: { k: Array.from({ length: n }, (_, i) => i), c: [] } };
    const tree = (cls = {}) => ({ nodes: Object.fromEntries(Object.entries(nodes).map(([id, v]) => [id, { k: v.k, c: [...v.c], cls: cls[id] }])), root: 'r', levelH: 58, gap: 12, aria: 'Recursion tree of coefficient indices' });
    const L = lg(n);
    R.add({ tree: tree() }, 1, `recursiveFft starts with coefficients a0 … a${n - 1}. Each call splits its list into even and odd positions and recurses on both halves.`);
    let level = ['r'];
    for (let dpt = 0; dpt < L; dpt++) {
      const next = [];
      level.forEach((id, j) => {
        const idx = nodes[id].k, ev = idx.filter((_, p) => p % 2 === 0), od = idx.filter((_, p) => p % 2 === 1);
        const fmt = a => a.map(i => 'a' + i).join(' ');
        const ask = j === 0 ? { q: `Which coefficients go to the even half of [${fmt(idx)}]?`, ...choices(fmt(ev), [fmt(idx.slice(0, idx.length / 2)), fmt(od)]) } : null;
        nodes[id + '0'] = { k: ev, c: [] }; nodes[id + '1'] = { k: od, c: [] }; nodes[id].c = [id + '0', id + '1'];
        R.add({ tree: tree({ [id]: 'cmp', [id + '0']: 'ok' }) }, [7, 8], `Split [${fmt(idx)}]: even positions → [${fmt(ev)}], odd positions → [${fmt(od)}].`, ask);
        next.push(id + '0', id + '1');
      });
      level = next;
    }
    const leaves = level.map(id => nodes[id].k[0]);
    const j = pick(leaves.filter(v => v !== 0 && v !== n - 1));
    const bin = v => v.toString(2).padStart(L, '0');
    R.add({ tree: tree(Object.fromEntries(level.map(id => [id, 'ok']))), arrays: [{ name: 'l', a: leaves, label: 'Leaf order (the base cases, line 3)', idxLabels: leaves.map((_, p) => bin(p)), small: true }] }, [3, 4], `The leaves read ${leaves.join(', ')}. Write a position in binary and reverse its bits: you get the coefficient that lands there.`, { q: `At which position (counting from 0) does a${j} end up?`, value: leaves.indexOf(j), hint: `${j} in binary is ${bin(j)}; reverse the bits.` });
    R.add({ tree: tree(), arrays: [{ name: 'l', a: leaves, label: 'Bit-reversal order', idxLabels: leaves.map((_, p) => bin(p)), small: true }] }, [9, 10, 11], `On the way back up, each level combines its two halves with n/2 butterfly operations. ${L} levels × n work = Θ(n lg n). The iterative FFT starts by putting the coefficients straight into this bit-reversed order.`);
    return R.f;
  },
});

/* ======================= Linear programming: checking the corners ======================= */
function lpVertices(cons) {
  const lines = [...cons, [1, 0, 0, 'x = 0'], [0, 1, 0, 'y = 0']].map(([a, b, c]) => [a, b, c]);
  const feasible = (x, y) => x >= -1e-9 && y >= -1e-9 && cons.every(([a, b, c]) => a * x + b * y <= c + 1e-9);
  const pts = [];
  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
    const [a1, b1, c1] = lines[i], [a2, b2, c2] = lines[j], det = a1 * b2 - a2 * b1;
    if (Math.abs(det) < 1e-12) continue;
    const x = (c1 * b2 - c2 * b1) / det, y = (a1 * c2 - a2 * c1) / det;
    if (feasible(x, y) && !pts.some(p => Math.abs(p[0] - x) < 1e-9 && Math.abs(p[1] - y) < 1e-9)) pts.push([x + 0, y + 0]);
  }
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx));
}
const r2 = v => Math.round(v * 100) / 100;
function lpSvg(pts, cur, best) {
  const X = Math.max(...pts.map(p => p[0]), 1), Y = Math.max(...pts.map(p => p[1]), 1), W = 360, H = 230, P = 30, PR = 80;
  const sx = x => P + (x / X) * (W - P - PR), sy = y => H - P - (y / Y) * (H - 2 * P);
  const poly = pts.map(p => `${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(' ');
  const dots = pts.map((p, i) => `<circle cx="${sx(p[0]).toFixed(1)}" cy="${sy(p[1]).toFixed(1)}" r="${i === cur ? 7 : 5}" style="fill:${i === cur ? 'var(--accent)' : i === best ? 'var(--ok)' : 'var(--surface)'};stroke:var(--ink-2);stroke-width:1.5"/><text x="${(sx(p[0]) + 9).toFixed(1)}" y="${(sy(p[1]) - 8).toFixed(1)}" style="font:11px var(--f-mono);fill:var(--ink-2)">(${r2(p[0])}, ${r2(p[1])})</text>`).join('');
  return `<div style="width:100%;text-align:center"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="max-width:100%;height:auto;display:inline-block" role="img" aria-label="Feasible region"><line x1="${P}" y1="${H - P}" x2="${W - 10}" y2="${H - P}" style="stroke:var(--ink-3)"/><line x1="${P}" y1="${H - P}" x2="${P}" y2="10" style="stroke:var(--ink-3)"/><text x="${W - 14}" y="${H - P + 16}" style="font:11px var(--f-mono);fill:var(--ink-3)">x</text><text x="${P - 16}" y="16" style="font:11px var(--f-mono);fill:var(--ink-3)">y</text><polygon points="${poly}" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5"/>${dots}</svg></div>`;
}
addViz('linear-programming', {
  inputHint: 'c1 c2 | a b c; a b c (maximize c1·x + c2·y with ax + by ≤ c, x, y ≥ 0)',
  presets: [
    { label: 'Two constraints', input: '3 2 | 1 1 4; 1 3 6' },
    { label: 'Three constraints', input: '1 1 | 1 1 6; 1 2 10; 2 1 10', note: 'Two corners tie for the optimum because the objective is parallel to an edge.' },
  ],
  random: () => { const k = rnd(2, 3); return `${rnd(1, 5)} ${rnd(1, 5)} | ` + Array.from({ length: k }, () => `${rnd(1, 4)} ${rnd(1, 4)} ${rnd(6, 16)}`).join('; '); },
  parse: s => {
    const [l, r] = s.split('|');
    if (r == null) throw new Error('Write the objective, then | and the constraints.');
    const [c1, c2] = parseNums(l, { min: 2, max: 2, lo: -99, hi: 99 });
    const cons = r.split(';').map(t => parseNums(t, { min: 3, max: 3, lo: -99, hi: 999 }));
    if (cons.length > 4) throw new Error('Use at most 4 constraints.');
    if (cons.some(([a, b]) => a <= 0 || b <= 0)) throw new Error('Keep a and b positive so the region is bounded.');
    if (cons.some(c => c[2] <= 0)) throw new Error('Keep each right-hand side positive.');
    return { c1, c2, cons };
  },
  run({ c1, c2, cons }) {
    const R = Rec(); const pts = lpVertices(cons), obj = p => c1 * p[0] + c2 * p[1];
    let best = -1;
    const rows = pts.map(p => [`(${r2(p[0])}, ${r2(p[1])})`, '']);
    const st = (cur, hl = {}) => ({ order: ['vars', 'html', 'tables'], vars: { maximize: `${c1}x + ${c2}y`, 'best so far': best < 0 ? '—' : r2(obj(pts[best])) }, html: lpSvg(pts, cur, best), table: { title: 'Corners of the feasible region', colH: ['corner', 'objective'], cells: rows.map(r => [...r]), hl, name: 'p' } });
    R.add(st(-1), 0, `The constraints cut out a convex polygon. If a linear objective has a maximum, one is at a corner, so it is enough to check the ${pts.length} corners.`);
    pts.forEach((p, i) => {
      const v = obj(p), int = Math.abs(v - Math.round(v)) < 1e-9;
      rows[i][1] = r2(v);
      const better = best < 0 || v > obj(pts[best]) + 1e-9;
      const ask = int ? { q: `At (${r2(p[0])}, ${r2(p[1])}), what is ${c1}x + ${c2}y?`, value: Math.round(v) } : null;
      if (better) best = i;
      R.add(st(i, { [i + ',1']: better ? 'found' : 'cur' }), 0, `${c1}·${r2(p[0])} + ${c2}·${r2(p[1])} = ${r2(v)}${better ? ': the best so far.' : '.'}`, ask);
    });
    const ties = pts.map((_, i) => i).filter(i => Math.abs(obj(pts[i]) - obj(pts[best])) < 1e-9);
    const at = i => `(${r2(pts[i][0])}, ${r2(pts[i][1])})`;
    const where = ties.length > 1 ? `, reached at ${ties.slice(0, -1).map(at).join(', ')} and ${at(ties[ties.length - 1])}, so every point on the edge between them is optimal too` : ` at ${at(best)}`;
    R.add(st(best, Object.fromEntries(ties.map(i => [i + ',1', 'found']))), 0, `The maximum is ${r2(obj(pts[best]))}${where}. Simplex does the same thing cleverly: it walks from corner to neighbouring corner, always improving, instead of checking them all.`);
    return R.f;
  },
});

/* ======================= Multithreaded algorithms: work and span ======================= */
addViz('multithreaded', {
  inputHint: 'Dependencies between unit-time strands, e.g. A>B A>C',
  presets: [
    { label: 'Fork and join', input: 'A>B A>C A>D B>E C>E D>F E>G F>G' },
    { label: 'A long chain with side work', input: 'A>B B>C C>D D>E A>F A>G F>E G>E' },
  ],
  random: () => {
    const n = rnd(6, 7), names = 'ABCDEFG'.slice(0, n).split(''), E = new Set();
    for (let j = 1; j < n; j++) E.add(`${names[rnd(0, j - 1)]}>${names[j]}`);
    for (let k = 0; k < 3; k++) { const i = rnd(0, n - 2), j = rnd(i + 1, n - 1); E.add(`${names[i]}>${names[j]}`); }
    return [...E].join(' ');
  },
  parse: s => { const G = parseGraph(s); if (!G.directed) throw new Error('Use directed edges, written A>B.'); return G; },
  run(G) {
    const R = Rec(); const preds = Object.fromEntries(G.nodes.map(v => [v, []])), indeg = Object.fromEntries(G.nodes.map(v => [v, 0]));
    for (const e of G.edges) { preds[e.v].push(e.u); indeg[e.v]++; }
    const q = G.nodes.filter(v => !indeg[v]), order = [];
    const left = { ...indeg };
    while (q.length) { const u = q.shift(); order.push(u); for (const e of G.edges) if (e.u === u && --left[e.v] === 0) q.push(e.v); }
    if (order.length < G.nodes.length) throw new Error('A computation DAG cannot have a cycle.');
    const lvl = {}; for (const v of order) lvl[v] = Math.max(0, ...preds[v].map(p => lvl[p] + 1));
    const byL = {}; for (const v of order) (byL[lvl[v]] ||= []).push(v);
    const P = {}; for (const [l, vs] of Object.entries(byL)) vs.forEach((v, i) => (P[v] = { x: 50 + +l * 96, y: 50 + i * 70 - (vs.length - 1) * 35 + 110 }));
    const span = {};
    const st = (ncls = {}) => ({ vars: { work: G.nodes.length, 'span so far': Math.max(0, ...Object.values(span)) }, graph: gview(G, P, { ncls: { ...Object.fromEntries(Object.keys(span).map(v => [v, 'ok'])), ...ncls }, note: Object.fromEntries(Object.entries(span).map(([v, s]) => [v, 'span ' + s])), weights: false }) });
    R.add(st(), 0, `Each vertex is a strand taking one time unit; an edge means "must finish first". Work T₁ = number of strands = ${G.nodes.length}. Span T∞ = the longest path, found by visiting strands in dependency order.`);
    for (const v of order) {
      const s = 1 + Math.max(0, ...preds[v].map(p => span[p]));
      const ask = preds[v].length ? { q: `${v} waits for ${preds[v].join(', ')} (span ${preds[v].map(p => span[p]).join(', ')}). What is the span up to and including ${v}?`, value: s, hint: '1 + the largest span among its predecessors.' } : null;
      span[v] = s;
      R.add(st({ [v]: 'cur', ...Object.fromEntries(preds[v].map(p => [p, 'cmp'])) }), 0, preds[v].length ? `${v}: 1 + max(${preds[v].map(p => span[p]).join(', ')}) = ${s}.` : `${v} has no dependencies: span 1.`, ask);
    }
    const T1 = G.nodes.length, Tinf = Math.max(...Object.values(span));
    R.add(st(), 0, `Work ${T1}, span ${Tinf}, so parallelism T₁ / T∞ = ${r2(T1 / Tinf)}. More than about ${Math.round(T1 / Tinf)} processors cannot help: the longest chain still runs one step at a time.`, { q: 'What is the span T∞ of the whole computation?', value: Tinf });
    return R.f;
  },
});

/* ======================= Matrix operations: LU decomposition ======================= */
addViz('matrix-ops', {
  inputHint: '9 numbers, row by row (3 × 3)',
  presets: [{ label: 'A clean 3 × 3', input: '2 1 1  4 3 3  8 7 9' }, { label: 'Negative multipliers', input: '1 2 0  -2 -1 3  3 9 4' }],
  random: () => {
    const L = [[1, 0, 0], [rnd(-2, 2), 1, 0], [rnd(-2, 2), rnd(-2, 2), 1]], U = [[rnd(1, 3), rnd(-3, 3), rnd(-3, 3)], [0, pick([1, 2, 3, -1]), rnd(-3, 3)], [0, 0, rnd(1, 4)]];
    return Array.from({ length: 3 }, (_, i) => Array.from({ length: 3 }, (_, j) => L[i].reduce((s, l, k) => s + l * U[k][j], 0)).join(' ')).join('  ');
  },
  parse: s => { const v = parseNums(s, { min: 9, max: 9, lo: -99, hi: 99 }); return [v.slice(0, 3), v.slice(3, 6), v.slice(6, 9)]; },
  run(A0) {
    const R = Rec(); const A = A0.map(r => [...r]), L = [[1, '', ''], ['?', 1, ''], ['?', '?', 1]];
    const st = (hl = {}, lhl = {}) => ({ tables: [{ title: 'Working matrix (becomes U)', cells: A.map(r => r.map(r2)), hl, name: 'u' }, { title: 'L (multipliers)', cells: L.map(r => [...r]), hl: lhl, name: 'l' }] });
    R.add(st(), 0, 'Gaussian elimination, recording each multiplier. The multipliers form L and what is left forms U, so A = LU.');
    for (let k = 0; k < 2; k++) {
      if (Math.abs(A[k][k]) < 1e-12) { R.add(st({ [k + ',' + k]: 'warn' }), 0, `The pivot A[${k + 1}][${k + 1}] is 0. Plain LU stops here; LUP decomposition would swap in a lower row first.`); return R.f; }
      R.add(st({ [k + ',' + k]: 'cur' }), 0, `Pivot on ${r2(A[k][k])} in row ${k + 1}.`);
      for (let i = k + 1; i < 3; i++) {
        const l = A[i][k] / A[k][k], int = Math.abs(l - Math.round(l)) < 1e-9;
        const ask = int ? { q: `Row ${i + 1} starts with ${r2(A[i][k])} under the pivot ${r2(A[k][k])}. What multiplier eliminates it?`, value: Math.round(l), hint: 'entry ÷ pivot' } : null;
        for (let j = k; j < 3; j++) A[i][j] -= l * A[k][j];
        L[i][k] = r2(l);
        R.add(st({ [k + ',' + k]: 'cur', ...rangeHlRow(i, k) }, { [i + ',' + k]: 'found' }), 0, `ℓ = ${r2(l)}. Row ${i + 1} ← row ${i + 1} − ${r2(l)} × row ${k + 1}.`, ask);
      }
    }
    if (Math.abs(A[2][2]) < 1e-12) R.add(st({ '2,2': 'warn' }), 0, 'The last pivot is 0, so A is singular. The factorization still exists, but U cannot be used to solve Ax = b.');
    else R.add(st(Object.fromEntries([0, 1, 2].map(i => [i + ',' + i, 'done']))), 0, `Done: L is unit lower-triangular, U is upper-triangular, and A = LU. Solving Ax = b is now a forward substitution with L and a back substitution with U, Θ(n²) each, after a single Θ(n³) factorization.`, Number.isInteger(r2(A[2][2])) ? { q: 'What is the last pivot, U[3][3]?', value: r2(A[2][2]) } : null);
    return R.f;
  },
});
function rangeHlRow(i, k) { const o = {}; for (let j = k; j < 3; j++) o[i + ',' + j] = 'cmp'; return o; }
