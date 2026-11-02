import { I, Rec, fmtV, h, parseNums, rangeHl, rnd, shuffle, sv } from '../../engine/helpers';
import { renderArr } from '../../engine/stage';
import { Quiz } from '../../engine/quiz';
import { setPart, topic } from '../registry';
import { progress } from '../../features/progress/facade';

setPart('found');

/* shared little line chart for custom interactives */
export function lineChart({ series, xMax, yMax, xLabel, yLabel, logY = false, W = 680, H = 300 }) {
  const L = 52, B = 34, T = 14, R = 110;
  const yv = v => logY ? Math.log10(Math.max(1, v)) : v;
  const ymax = logY ? Math.log10(Math.max(10, yMax)) : yMax;
  const X = x => L + (x / xMax) * (W - L - R), Y = v => T + (1 - Math.min(1, yv(v) / ymax)) * (H - T - B);
  const svg = sv('svg', { class: 'plot', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': yLabel + ' against ' + xLabel });
  const ticks = logY ? Array.from({ length: Math.floor(ymax) + 1 }, (_, i) => 10 ** i) : [0, .25, .5, .75, 1].map(f => Math.round(f * yMax));
  ticks.forEach(t => { svg.append(sv('line', { class: 'gl', x1: L, x2: W - R, y1: Y(t), y2: Y(t) })); svg.append(sv('text', { class: 'axl', x: L - 6, y: Y(t) + 3, 'text-anchor': 'end' }, t >= 1e6 ? t.toExponential(0) : t.toLocaleString())); });
  [0, .25, .5, .75, 1].forEach(f => { const x = Math.round(f * xMax); svg.append(sv('text', { class: 'axl', x: X(x), y: H - B + 16, 'text-anchor': 'middle' }, x)); });
  svg.append(sv('text', { class: 'axl', x: (L + W - R) / 2, y: H - 4, 'text-anchor': 'middle' }, xLabel));
  const labels = [];
  for (const s of series) {
    const pts = s.pts.filter(([x, y]) => isFinite(y)).map(([x, y]) => [X(x), Y(Math.min(y, logY ? 10 ** ymax : yMax))]);
    if (!pts.length) continue;
    svg.append(sv('path', { class: 'fl', d: 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L'), style: `stroke:${s.color}` + (s.dash ? ';stroke-dasharray:5 4' : '') }));
    const last = pts[pts.length - 1]; labels.push({ y: last[1], x: last[0], name: s.name, color: s.color });
  }
  labels.sort((a, b) => a.y - b.y); let prev = -99;
  labels.forEach(l => { const y = Math.max(l.y + 4, prev + 14); prev = y; svg.append(sv('text', { class: 'flab', x: W - R + 8, y, style: `fill:${l.color}` }, l.name)); });
  return svg;
}
export const PALETTE = ['var(--cobalt)', 'var(--ok)', 'var(--amber)', 'var(--accent)', 'var(--violet)', 'var(--ink-2)', 'var(--ink-3)'];

topic({
  id: 'algorithms', title: 'Algorithms and their cost', sec: '§1–2.2',
  blurb: 'What an algorithm is, how the book measures running time, and why best, worst and average cases differ.',
  cx: [['Model', 'RAM, constant-time steps'], ['Focus', 'Worst case, order of growth']],
  props: ['Loop invariants', 'Correctness proofs'],
  tags: 'ram model running time analysis worst case loop invariant',
  learn: `
<p>An <b>algorithm</b> is a well-defined procedure that takes an input and produces an output, and it is <b>correct</b> if it halts with the right output for every valid input. A <b>problem instance</b> is one specific input. Sorting is a problem; ⟨31, 41, 59, 26, 41, 58⟩ is an instance.</p>
<h3>Why efficiency is a technology</h3>
<p>The book's Chapter 1 makes a point that is easy to underrate: a better algorithm often beats faster hardware. Its example pits a fast computer running insertion sort (about 2<i>n</i>² instructions) against a computer 1000 times slower running merge sort (about 50 <i>n</i> lg <i>n</i> instructions). Sorting ten million numbers, the slow machine wins by a factor of about 17, and the gap grows with <i>n</i>.</p>
<h3>Measuring running time</h3>
<p>The book analyzes algorithms on the <b>RAM model</b>: one processor, instructions run one after another, and each simple operation (arithmetic, comparison, assignment, array access, a function call) costs constant time. Running time is the number of these steps as a function of <b>input size</b> <i>n</i>.</p>
<p>For insertion sort, the book assigns a cost <i>c<sub>k</sub></i> to each line, counts how many times each line runs, and sums. The result depends on the input, not only its size:</p>
<ul><li><b>Best case</b>: the input that makes the algorithm fastest. For insertion sort, a sorted array, giving a linear function <i>an</i> + <i>b</i>.</li><li><b>Worst case</b>: the slowest input. For insertion sort, a reverse-sorted array, giving a quadratic <i>an</i>² + <i>bn</i> + <i>c</i>.</li><li><b>Average case</b>: the expected cost over some distribution of inputs. For insertion sort on random permutations, still quadratic.</li></ul>
<div class="note key">The book focuses on the <b>worst case</b>: it is an upper bound you can rely on, it occurs often in practice (searching for something that is absent), and the average case is frequently as bad.</div>
<h3>Order of growth</h3>
<p>Constants depend on the machine and the compiler, and lower-order terms stop mattering for large <i>n</i>. So we keep only the leading term and drop its coefficient: insertion sort's worst case is Θ(<i>n</i>²). The next chapter, <a href="/learn/asymptotic">Asymptotic notation</a>, makes that precise.</p>
<h3>Proving correctness with loop invariants</h3>
<p>A <b>loop invariant</b> is a statement that is true before each iteration of a loop. You show three things, much like induction:</p>
<ol><li><b>Initialization</b>: it holds before the first iteration.</li><li><b>Maintenance</b>: if it holds before an iteration, it holds before the next.</li><li><b>Termination</b>: when the loop ends, the invariant tells you something useful, usually that the answer is correct.</li></ol>
<p>Interviewers rarely ask for formal proofs, but stating the invariant out loud (“everything left of <code>i</code> is already processed and smaller than the pivot”) is the fastest way to convince them, and yourself, that your loop is right.</p>`,
  custom(el) {
    const nIn = h('input', { type: 'range', min: 4, max: 60, value: 40, id: 'alg-n' });
    const out = h('div');
    const nLab = h('b', { class: 'tnum' });
    function count(a) { a = [...a]; let c = 0, s = 0; for (let j = 1; j < a.length; j++) { const k = a[j]; let i = j - 1; while (true) { c++; if (i >= 0 && a[i] > k) { a[i + 1] = a[i]; i--; s++; } else break; } a[i + 1] = k; } return { c, s }; }
    function draw() {
      const N = +nIn.value; nLab.textContent = N;
      const best = [], worst = [], avg = [];
      for (let n = 1; n <= N; n++) {
        best.push([n, count(Array.from({ length: n }, (_, i) => i)).c]);
        worst.push([n, count(Array.from({ length: n }, (_, i) => n - i)).c]);
        let s = 0; for (let t = 0; t < 12; t++) s += count(shuffle(Array.from({ length: n }, (_, i) => i))).c; avg.push([n, s / 12]);
      }
      out.innerHTML = '';
      out.append(lineChart({ series: [{ name: 'Worst (reversed)', color: PALETTE[3], pts: worst }, { name: 'Average (random)', color: PALETTE[2], pts: avg }, { name: 'Best (sorted)', color: PALETTE[1], pts: best }], xMax: N, yMax: worst[worst.length - 1][1], xLabel: 'n, input size', yLabel: 'comparisons' }));
      const w = worst[N - 1][1], b = best[N - 1][1], av = Math.round(avg[N - 1][1]);
      out.append(h('div', { class: 'answer-box' }, `At n = ${N}, insertion sort makes `, h('b', null, b), ' comparisons on sorted input, about ', h('b', null, av), ' on random input and ', h('b', null, w), ` on reversed input. The worst case is n(n+1)/2 − 1 = ${N * (N + 1) / 2 - 1}, a quadratic. The best case is n − 1 = ${N - 1}, a line.`));
    }
    nIn.addEventListener('input', draw);
    el.append(h('div', { class: 'panel', style: { padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' } },
      h('div', null, h('h2', { class: 'h3' }, 'Count the work'), h('p', { class: 'muted' }, 'This runs insertion sort for every input size up to n and counts how many times the inner while test executes. Drag the slider to see the best and worst case separate.')),
      h('div', { class: 'ctl-row' }, h('label', { for: 'alg-n' }, 'Largest n ', nLab), nIn), out));
    draw();
  },
  quiz: [
    { q: 'Which statement about the RAM model is right?', opts: ['Each instruction takes a constant amount of time', 'Memory access cost depends on cache level', 'Multiple instructions run in parallel', 'Sorting is a single instruction'], a: 0, why: 'The RAM model counts simple operations as constant-time steps and ignores the memory hierarchy.' },
    { q: 'Why does the book usually analyze the worst case?', opts: ['It is easiest to compute', 'It gives a guarantee that holds for every input', 'It equals the average case', 'Best case is always constant'], a: 1, why: 'An upper bound on every input is something you can rely on.' },
    { q: 'A loop invariant must hold…', opts: ['only after the loop', 'before each iteration, including the first', 'only during the first iteration', 'at random points'], a: 1, why: 'Initialization, maintenance and termination together make the argument work, like induction.' },
    { q: 'Machine A runs 2n² instructions at 10¹⁰ per second. Machine B runs 50 n lg n at 10⁷ per second. For n = 10⁷, which finishes first?', opts: ['A', 'B', 'They tie'], a: 1, why: 'A takes about 20,000 seconds, B about 1,163 seconds. The better algorithm beats 1000 times faster hardware.' },
  ],
});

topic({
  id: 'asymptotic', title: 'Asymptotic notation', sec: '§3.1–3.2', prereq: ['algorithms'],
  blurb: 'Θ, O and Ω describe how a running time grows, ignoring constants and small inputs.',
  cx: [['Θ', 'tight bound'], ['O', 'upper bound'], ['Ω', 'lower bound']],
  tags: 'big o theta omega little o growth functions complexity',
  learn: `
<p>Asymptotic notation describes the <b>rate of growth</b> of a function as <i>n</i> gets large. It lets us say “quadratic” precisely without caring about constants that depend on the machine.</p>
<h3>The three main notations</h3>
<table><tr><th>Notation</th><th>Meaning</th><th>Formal definition</th></tr>
<tr><td>Θ(<i>g</i>(<i>n</i>))</td><td>grows exactly like <i>g</i></td><td>there exist <i>c</i><sub>1</sub>, <i>c</i><sub>2</sub>, <i>n</i><sub>0</sub> &gt; 0 with 0 ≤ <i>c</i><sub>1</sub><i>g</i>(<i>n</i>) ≤ <i>f</i>(<i>n</i>) ≤ <i>c</i><sub>2</sub><i>g</i>(<i>n</i>) for all <i>n</i> ≥ <i>n</i><sub>0</sub></td></tr>
<tr><td>O(<i>g</i>(<i>n</i>))</td><td>grows no faster than <i>g</i></td><td>0 ≤ <i>f</i>(<i>n</i>) ≤ <i>c g</i>(<i>n</i>) for all <i>n</i> ≥ <i>n</i><sub>0</sub></td></tr>
<tr><td>Ω(<i>g</i>(<i>n</i>))</td><td>grows at least as fast as <i>g</i></td><td>0 ≤ <i>c g</i>(<i>n</i>) ≤ <i>f</i>(<i>n</i>) for all <i>n</i> ≥ <i>n</i><sub>0</sub></td></tr></table>
<p>Theorem 3.1 ties them together: <i>f</i> = Θ(<i>g</i>) exactly when <i>f</i> = O(<i>g</i>) and <i>f</i> = Ω(<i>g</i>). The book also defines strict versions, <b>little-o</b> (<i>f</i> grows strictly slower, <i>f</i>/<i>g</i> → 0) and <b>little-omega</b> (strictly faster).</p>
<div class="note warn"><b>A common mix-up.</b> “Worst case” and “Big O” are different ideas. Insertion sort's running time is O(<i>n</i>²) on every input and Ω(<i>n</i>) on every input. Its worst case is Θ(<i>n</i>²) and its best case is Θ(<i>n</i>). In interviews, “Big O” usually means a tight bound on the worst case, but say what you mean.</div>
<h3>Working with the definitions</h3>
<p>To show ½<i>n</i>² − 3<i>n</i> = Θ(<i>n</i>²), the book picks <i>c</i><sub>1</sub> = 1/14, <i>c</i><sub>2</sub> = 1/2 and <i>n</i><sub>0</sub> = 7. In practice you rarely need constants. Use these rules:</p>
<ul><li>Drop lower-order terms and constant factors: 3<i>n</i>² + 10<i>n</i> lg <i>n</i> + 7 = Θ(<i>n</i>²).</li><li>Any polynomial beats any polylogarithm: lg<sup><i>k</i></sup> <i>n</i> = o(<i>n</i><sup>ε</sup>) for every ε &gt; 0.</li><li>Any exponential beats any polynomial: <i>n</i><sup><i>k</i></sup> = o(<i>a</i><sup><i>n</i></sup>) for every <i>a</i> &gt; 1.</li><li>Bases of logarithms differ only by a constant, so O(log<sub>2</sub> <i>n</i>) = O(log<sub>10</sub> <i>n</i>). The book writes lg for log<sub>2</sub>.</li><li>lg(<i>n</i>!) = Θ(<i>n</i> lg <i>n</i>), by Stirling's approximation.</li></ul>
<h3>The usual ladder</h3>
<p>From slowest-growing to fastest: 1, lg lg <i>n</i>, lg <i>n</i>, √<i>n</i>, <i>n</i>, <i>n</i> lg <i>n</i>, <i>n</i>², <i>n</i>³, 2<sup><i>n</i></sup>, <i>n</i>!, <i>n</i><sup><i>n</i></sup>. Use the explorer under <b>Visualize</b> to see how quickly they separate. Switch on the log scale to see the exponentials leave everything else behind.</p>
<h3>What interviewers expect</h3>
<ul><li>State time and space for every solution, and say which inputs make it slow.</li><li>Recognize shapes: one loop over <i>n</i> is O(<i>n</i>); two nested loops over <i>n</i> are O(<i>n</i>²); halving the range each step is O(log <i>n</i>); a recursion that branches twice and goes <i>n</i> deep is O(2<sup><i>n</i></sup>).</li><li>Rough budget: about 10<sup>8</sup> simple operations per second. With <i>n</i> = 10<sup>5</sup>, O(<i>n</i>²) is too slow and O(<i>n</i> log <i>n</i>) is fine.</li></ul>`,
  custom(el) {
    const F = [
      ['lg n', n => Math.log2(n)], ['√n', n => Math.sqrt(n)], ['n', n => n], ['n lg n', n => n * Math.log2(n)], ['n²', n => n * n], ['n³', n => n ** 3], ['2ⁿ', n => 2 ** n], ['n!', n => { let r = 1; for (let k = 2; k <= n; k++) r *= k; return r; }],
    ];
    const on = new Set(['lg n', 'n', 'n lg n', 'n²', '2ⁿ']);
    const nIn = h('input', { type: 'range', min: 4, max: 64, value: 20, id: 'g-n' });
    const logB = h('button', { class: 'btn sm', 'aria-pressed': 'false', onclick: () => { logY = !logY; logB.setAttribute('aria-pressed', String(logY)); logB.className = 'btn sm' + (logY ? ' ink' : ''); draw(); } }, 'Log scale');
    let logY = false;
    const toggles = h('div', { class: 'tpick' }, F.map(([name]) => { const b = h('button', { 'aria-pressed': String(on.has(name)), onclick: () => { on.has(name) ? on.delete(name) : on.add(name); b.setAttribute('aria-pressed', String(on.has(name))); draw(); } }, name); return b; }));
    const out = h('div'), tbl = h('div', { class: 'tablewrap' }), nLab = h('b', { class: 'tnum' });
    function draw() {
      const N = +nIn.value; nLab.textContent = N;
      const series = F.filter(([nm]) => on.has(nm)).map(([nm, f], i) => ({ name: nm, color: PALETTE[F.findIndex(x => x[0] === nm) % PALETTE.length], pts: Array.from({ length: N * 2 }, (_, k) => { const x = 1 + k * (N - 1) / (N * 2 - 1); return [x, f(x)]; }) }));
      const yMax = logY ? Math.max(...series.map(s => s.pts[s.pts.length - 1][1])) : Math.max(10, ...F.filter(([nm]) => on.has(nm) && !['2ⁿ', 'n!', 'n³'].includes(nm)).map(([, f]) => f(N))) * 1.1;
      out.innerHTML = ''; out.append(lineChart({ series, xMax: N, yMax: Math.min(yMax, 1e30), logY, xLabel: 'n', yLabel: 'f(n)' }));
      const ns = [10, 100, 1000, 1e6];
      const fmt = v => v > 1e15 ? 'astronomical' : v >= 1e6 ? v.toExponential(1).replace('e+', ' × 10^') : Math.round(v).toLocaleString();
      const timeAt = v => { const s = v / 1e8; return s < 1e-3 ? 'instant' : s < 1 ? (s * 1000).toFixed(0) + ' ms' : s < 3600 ? s.toFixed(1) + ' s' : s < 3.15e7 ? (s / 3600).toFixed(1) + ' h' : s > 1e15 ? 'longer than the universe' : (s / 3.15e7).toExponential(1) + ' years'; };
      tbl.innerHTML = '';
      tbl.append(h('table', { class: 'ctable' }, h('tr', null, h('th', null, 'f(n)'), ns.map(n => h('th', null, 'n = ' + n.toLocaleString())), h('th', null, 'Time at n = 10⁶')),
        F.map(([nm, f]) => h('tr', null, h('td', null, h('b', null, nm)), ns.map(n => h('td', null, n > 200 && nm === 'n!' ? 'astronomical' : n > 1000 && nm === '2ⁿ' ? 'astronomical' : fmt(f(n)))), h('td', null, ['2ⁿ', 'n!'].includes(nm) ? 'longer than the universe' : timeAt(f(1e6)))))));
    }
    nIn.addEventListener('input', draw);
    el.append(h('div', { class: 'panel', style: { padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' } },
      h('div', null, h('h2', { class: 'h3' }, 'Growth explorer'), h('p', { class: 'muted' }, 'Pick functions to compare. Small n can mislead: watch where the curves cross as n grows.')),
      toggles, h('div', { class: 'ctl-row' }, h('label', { for: 'g-n' }, 'n up to ', nLab), nIn, logB), out,
      h('h3', { class: 'h3' }, 'Operation counts, assuming 10⁸ simple operations per second'), tbl));
    draw();
  },
  practice(el) {
    const sets = [['lg n', '√n', 'n', 'n lg n', 'n²', '2ⁿ'], ['1', 'lg lg n', 'lg n', 'n / lg n', 'n', 'n²'], ['lg² n', 'n^0.1', 'n', 'n lg n', 'n^1.5', 'n!'], ['lg(n!)', 'n²', 'n³', '2ⁿ', '3ⁿ', 'nⁿ'], ['√n', 'n', 'n lg² n', 'n² / lg n', 'n²', '1.01ⁿ']];
    el.append(h('h2', { class: 'h2' }, 'Rank by growth'), h('p', { class: 'muted' }, 'Order the functions from slowest-growing (top) to fastest. Drag rows or use the arrows, then check.'), RankDrill(sets, (ok) => progress.drill('asymptotic', ok)));
  },
  quiz: [
    { q: 'Which is true for f(n) = 3n² + 100n?', opts: ['f(n) = O(n)', 'f(n) = Θ(n²)', 'f(n) = Ω(n³)', 'f(n) = Θ(n)'], a: 1, why: 'The n² term dominates for large n.' },
    { q: 'Is 2ⁿ⁺¹ = O(2ⁿ)?', opts: ['Yes', 'No'], a: 0, why: '2ⁿ⁺¹ = 2 · 2ⁿ, a constant factor.' },
    { q: 'Is 2²ⁿ = O(2ⁿ)?', opts: ['Yes', 'No'], a: 1, why: '2²ⁿ = (2ⁿ)², and the ratio 2ⁿ grows without bound.' },
    { q: 'Which grows faster: lg¹⁰⁰ n or n^0.01?', opts: ['lg¹⁰⁰ n', 'n^0.01', 'They are the same'], a: 1, why: 'Every positive power of n eventually beats every power of lg n, though the crossover point is enormous.' },
    { q: 'f(n) = O(g(n)) and f(n) = Ω(g(n)) together imply…', opts: ['f = o(g)', 'f = Θ(g)', 'f = ω(g)', 'nothing'], a: 1, why: 'Theorem 3.1 in the book.' },
    { q: 'What is lg(n!) asymptotically?', opts: ['Θ(n)', 'Θ(n lg n)', 'Θ(n²)', 'Θ(lg n)'], a: 1, why: 'Stirling: n! ≈ √(2πn)(n/e)ⁿ, so lg(n!) ≈ n lg n − n lg e.' },
  ],
});

/* ranking drill used by asymptotic practice */
export function RankDrill(sets, onResult) {
  const el = h('div', { class: 'pr-block' });
  let k = 0;
  function show() {
    el.innerHTML = '';
    const correct = sets[k % sets.length];
    let order = shuffle(correct);
    while (order.join() === correct.join()) order = shuffle(correct);
    const list = h('div', { class: 'parsons' });
    const fb = h('div', { class: 'why', hidden: true });
    const draw = () => { list.innerHTML = ''; order.forEach((f, i) => { const row = h('div', { class: 'pline', draggable: 'true', 'data-i': i }, h('span', { style: { fontFamily: 'var(--f-read)', fontSize: '16px' } }, f), h('div', { class: 'mv' }, h('button', { 'aria-label': 'Move up', html: I.up, onclick: () => { if (i) { [order[i - 1], order[i]] = [order[i], order[i - 1]]; draw(); } } }), h('button', { 'aria-label': 'Move down', html: I.down, onclick: () => { if (i < order.length - 1) { [order[i + 1], order[i]] = [order[i], order[i + 1]]; draw(); } } }))); dragRow(row, list, order, draw); list.append(row); }); };
    draw();
    el.append(list, h('div', { class: 'inrow' }, h('button', { class: 'btn ink', onclick: () => {
      const ok = order.join() === correct.join();
      [...list.children].forEach((r, i) => r.classList.add(order[i] === correct[i] ? 'right' : 'wrong'));
      fb.hidden = false; fb.innerHTML = ok ? '<b>Correct.</b> ' + correct.join(' ≺ ') : '<b>Not quite.</b> The right order is ' + correct.join(' ≺ ') + '.';
      onResult && onResult(ok);
    } }, 'Check order'), h('button', { class: 'btn', onclick: () => { k++; show(); } }, 'Next set')), fb);
  }
  show(); return el;
}
export function dragRow(row, list, order, redraw) {
  row.addEventListener('dragstart', e => { row.classList.add('drag'); e.dataTransfer.setData('text/plain', row.dataset.i); });
  row.addEventListener('dragend', () => row.classList.remove('drag'));
  row.addEventListener('dragover', e => e.preventDefault());
  row.addEventListener('drop', e => { e.preventDefault(); const from = +e.dataTransfer.getData('text/plain'), to = +row.dataset.i; if (from === to) return; const [x] = order.splice(from, 1); order.splice(to, 0, x); redraw(); });
}

topic({
  id: 'recurrences', title: 'Recurrences and the master theorem', sec: '§4.3–4.6', prereq: ['asymptotic'],
  blurb: 'Solve the running-time equations that recursive algorithms produce.',
  cx: [['Master form', 'T(n) = aT(n/b) + f(n)'], ['Watershed', 'n^(log_b a)']],
  tags: 'recurrence master theorem recursion tree substitution',
  learn: `
<p>A recursive algorithm's running time is naturally described by a <b>recurrence</b>: an equation that defines <i>T</i>(<i>n</i>) in terms of <i>T</i> on smaller inputs. Merge sort gives <i>T</i>(<i>n</i>) = 2<i>T</i>(<i>n</i>/2) + Θ(<i>n</i>). Binary search gives <i>T</i>(<i>n</i>) = <i>T</i>(<i>n</i>/2) + Θ(1). The book gives three ways to solve them.</p>
<h3>1. Substitution</h3>
<p>Guess the answer, then prove it by induction. To show merge sort is O(<i>n</i> lg <i>n</i>), assume <i>T</i>(<i>m</i>) ≤ <i>c m</i> lg <i>m</i> for <i>m</i> &lt; <i>n</i> and check that it holds for <i>n</i>. The trap is proving the wrong thing: from <i>T</i>(<i>n</i>) ≤ <i>cn</i> + <i>n</i> you cannot conclude <i>T</i>(<i>n</i>) = O(<i>n</i>), because you must prove the exact form <i>T</i>(<i>n</i>) ≤ <i>cn</i>.</p>
<h3>2. Recursion trees</h3>
<p>Draw the calls as a tree, write the non-recursive cost at each node, and add up each level. For <i>T</i>(<i>n</i>) = 3<i>T</i>(<i>n</i>/4) + <i>cn</i>², the level costs are <i>cn</i>², (3/16)<i>cn</i>², (3/16)²<i>cn</i>², … a decreasing geometric series, so the root dominates and <i>T</i>(<i>n</i>) = Θ(<i>n</i>²). Trees are the best way to build a guess and the best way to understand the master theorem.</p>
<h3>3. The master theorem</h3>
<p>For <i>T</i>(<i>n</i>) = <i>a T</i>(<i>n</i>/<i>b</i>) + <i>f</i>(<i>n</i>) with <i>a</i> ≥ 1 and <i>b</i> &gt; 1, compare <i>f</i>(<i>n</i>) with the <b>watershed function</b> <i>n</i><sup>log<sub><i>b</i></sub> <i>a</i></sup>, which counts the leaves of the recursion tree.</p>
<table><tr><th>Case</th><th>Condition</th><th>Solution</th><th>Intuition</th></tr>
<tr><td>1</td><td><i>f</i>(<i>n</i>) = O(<i>n</i><sup>log<sub><i>b</i></sub><i>a</i> − ε</sup>)</td><td>Θ(<i>n</i><sup>log<sub><i>b</i></sub><i>a</i></sup>)</td><td>leaves dominate</td></tr>
<tr><td>2</td><td><i>f</i>(<i>n</i>) = Θ(<i>n</i><sup>log<sub><i>b</i></sub><i>a</i></sup>)</td><td>Θ(<i>n</i><sup>log<sub><i>b</i></sub><i>a</i></sup> lg <i>n</i>)</td><td>every level costs the same</td></tr>
<tr><td>3</td><td><i>f</i>(<i>n</i>) = Ω(<i>n</i><sup>log<sub><i>b</i></sub><i>a</i> + ε</sup>) and <i>a f</i>(<i>n</i>/<i>b</i>) ≤ <i>c f</i>(<i>n</i>), <i>c</i> &lt; 1</td><td>Θ(<i>f</i>(<i>n</i>))</td><td>root dominates</td></tr></table>
<p>The comparison must be <b>polynomially</b> larger or smaller. <i>T</i>(<i>n</i>) = 2<i>T</i>(<i>n</i>/2) + <i>n</i> lg <i>n</i> falls in the gap between cases 2 and 3 (its answer is Θ(<i>n</i> lg² <i>n</i>), from the extended case 2 in Exercise 4.6-2, which the solver under <b>Visualize</b> supports).</p>
<h3>Examples from the book</h3>
<ul><li>Merge sort: <i>a</i> = 2, <i>b</i> = 2, <i>f</i> = Θ(<i>n</i>). Watershed <i>n</i>. Case 2: Θ(<i>n</i> lg <i>n</i>).</li><li>Binary search: <i>a</i> = 1, <i>b</i> = 2, <i>f</i> = Θ(1). Watershed <i>n</i><sup>0</sup> = 1. Case 2: Θ(lg <i>n</i>).</li><li>Strassen: <i>a</i> = 7, <i>b</i> = 2, <i>f</i> = Θ(<i>n</i>²). Watershed <i>n</i><sup>lg 7</sup> ≈ <i>n</i><sup>2.81</sup>. Case 1: Θ(<i>n</i><sup>lg 7</sup>).</li><li><i>T</i>(<i>n</i>) = 3<i>T</i>(<i>n</i>/4) + <i>n</i> lg <i>n</i>: watershed <i>n</i><sup>0.79</sup>. Case 3: Θ(<i>n</i> lg <i>n</i>).</li></ul>
<h3>Recurrences the master theorem does not cover</h3>
<p>Subtract-and-conquer forms such as <i>T</i>(<i>n</i>) = <i>T</i>(<i>n</i> − 1) + Θ(<i>n</i>) (quicksort's worst case, Θ(<i>n</i>²)) and <i>T</i>(<i>n</i>) = 2<i>T</i>(<i>n</i> − 1) + Θ(1) (naive Towers of Hanoi or subsets, Θ(2<sup><i>n</i></sup>)) need a recursion tree or direct summation.</p>`,
  custom(el) {
    const mk = (id, v, label, step = 1) => h('label', { for: id }, label, h('input', { type: 'number', id, value: v, step, min: 0 }));
    const aI = mk('m-a', 2, 'a ='), bI = mk('m-b', 2, 'b ='), cI = mk('m-c', 1, 'c =', .5), kI = mk('m-k', 0, 'k =');
    const out = h('div', { class: 'answer-box' }), tree = h('div');
    const presets = [['Merge sort', 2, 2, 1, 0], ['Binary search', 1, 2, 0, 0], ['Strassen', 7, 2, 2, 0], ['Naive matrix multiply', 8, 2, 2, 0], ['3T(n/4) + n²', 3, 4, 2, 0], ['2T(n/2) + n lg n', 2, 2, 1, 1], ['Karatsuba', 3, 2, 1, 0]];
    const pr = h('div', { class: 'tpick' }, presets.map(([nm, a, b, c, k]) => h('button', { onclick: () => { aI.lastChild.value = a; bI.lastChild.value = b; cI.lastChild.value = c; kI.lastChild.value = k; solve(); } }, nm)));
    const fmtE = x => Number.isInteger(x) ? String(x) : x.toFixed(3).replace(/0+$/, '');
    const poly = (e, k) => { const p = e === 0 ? (k ? '' : '1') : e === 1 ? 'n' : `n^${fmtE(e)}`; const l = k === 0 ? '' : k === 1 ? 'lg n' : `lg^${k} n`; return [p, l].filter(Boolean).join(' ') || '1'; };
    function solve() {
      const a = +aI.lastChild.value, b = +bI.lastChild.value, c = +cI.lastChild.value, k = +kI.lastChild.value;
      out.innerHTML = ''; tree.innerHTML = '';
      if (!(a >= 1) || !(b > 1) || !(c >= 0) || !(k >= 0) || !Number.isInteger(k)) { out.textContent = 'Use a ≥ 1, b > 1, c ≥ 0 and a whole number k ≥ 0.'; return; }
      const w = Math.log(a) / Math.log(b), eps = 1e-9;
      const f = poly(c, k);
      let cas, sol, why;
      if (c < w - eps) { cas = 'Case 1'; sol = poly(w, 0); why = `f(n) = ${f} grows polynomially slower than the watershed n^${fmtE(w)}. The leaves dominate.`; }
      else if (Math.abs(c - w) < eps) { cas = k === 0 ? 'Case 2' : 'Case 2 (extended)'; sol = poly(w, k + 1); why = `f(n) = ${f} matches the watershed${k ? ' up to a lg^' + k + ' n factor' : ''}. Each of the lg n levels costs about the same.`; }
      else { cas = 'Case 3'; sol = poly(c, k); why = `f(n) = ${f} grows polynomially faster than n^${fmtE(w)}, and the regularity condition a·f(n/b) ≤ (a/b^${fmtE(c)})·f(n) holds since a/b^c = ${fmtE(a / b ** c)} < 1. The root dominates.`; }
      out.append(h('div', null, `T(n) = ${a}T(n/${b}) + ${f}`), h('div', { class: 'big' }, `T(n) = Θ(${sol})`), h('div', null, h('b', null, cas + '. '), `Watershed n^(log_${b} ${a}) = n^${fmtE(w)}. ${why}`));
      // level-cost chart for n = b^L
      const L = Math.min(8, Math.max(3, Math.round(Math.log(4096) / Math.log(b))));
      const n = b ** L, costs = [];
      for (let d = 0; d <= L; d++) { const sz = n / b ** d; costs.push(a ** d * (sz ** c) * (k ? Math.max(1, Math.log2(sz)) ** k : 1)); }
      const mx = Math.max(...costs);
      tree.append(h('h3', { class: 'h3' }, `Recursion tree for n = ${fmtV(n)}: total cost per level`), h('div', { class: 'bars-h' }, costs.map((v, d) => h('div', { class: 'bh' }, h('span', null, `Depth ${d}: ${a === 1 ? '1 node' : fmtV(a ** d) + ' nodes'}`), h('div', { class: 'tr' }, h('i', { class: d === 0 ? '' : 'mid', style: { width: Math.max(1, 100 * v / mx) + '%' } })), h('span', null, v >= 1e5 ? v.toExponential(1) : fmtV(Math.round(v)))))),
        h('p', { class: 'muted' }, cas.startsWith('Case 1') ? 'Costs grow toward the leaves: the bottom level dominates.' : cas.startsWith('Case 3') ? 'Costs shrink geometrically: the root dominates.' : 'Every level costs about the same, so the total is one level times the number of levels.'));
    }
    [aI, bI, cI, kI].forEach(x => x.lastChild.addEventListener('input', solve));
    el.append(h('div', { class: 'panel', style: { padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' } },
      h('div', null, h('h2', { class: 'h3' }, 'Master theorem solver'), h('p', { class: 'muted' }, 'Solve T(n) = a·T(n/b) + n^c · lg^k n. Try the presets, then your own.')),
      pr, h('div', { class: 'ctl-row' }, aI, bI, cI, kI), out, tree));
    solve();
  },
  practice(el) {
    const qs = [[2, 2, 1, 0, 'n lg n'], [4, 2, 1, 0, 'n²'], [4, 2, 2, 0, 'n² lg n'], [4, 2, 3, 0, 'n³'], [1, 2, 0, 0, 'lg n'], [7, 2, 2, 0, 'n^2.81'], [9, 3, 1, 0, 'n²'], [3, 2, 1, 0, 'n^1.58'], [2, 4, .5, 0, '√n lg n'], [8, 2, 3, 0, 'n³ lg n'], [2, 2, 2, 0, 'n²'], [16, 4, 2, 0, 'n² lg n']];
    const all = [...new Set(qs.map(q => q[4]))];
    const quiz = shuffle(qs).slice(0, 6).map(([a, b, c, , ans]) => ({ q: `Solve T(n) = ${a === 1 ? '' : a}T(n/${b}) + ${c === 0 ? '1' : c === 1 ? 'n' : c === .5 ? '√n' : 'n' + (c === 2 ? '²' : '³')}`, opts: [ans, ...shuffle(all.filter(x => x !== ans)).slice(0, 3)].map(x => 'Θ(' + x + ')'), a: 0, why: `Watershed n^(log_${b} ${a}). Compare it with f(n).` }));
    el.append(h('h2', { class: 'h2' }, 'Solve these recurrences'), Quiz(quiz, { title: 'Master theorem drill', onDone: pct => progress.quiz('recurrences', pct) }));
  },
  quiz: [
    { q: 'Solve T(n) = 4T(n/2) + n.', opts: ['Θ(n)', 'Θ(n lg n)', 'Θ(n²)', 'Θ(n² lg n)'], a: 2, why: 'Watershed n^(log₂4) = n². f(n) = n is polynomially smaller: case 1.' },
    { q: 'Solve T(n) = 2T(n/2) + n².', opts: ['Θ(n²)', 'Θ(n² lg n)', 'Θ(n lg n)', 'Θ(n³)'], a: 0, why: 'Watershed n. f(n) = n² is polynomially larger and regular: case 3.' },
    { q: 'Why can the basic master theorem not solve T(n) = 2T(n/2) + n lg n?', opts: ['a is too small', 'f(n) is larger than n but not polynomially larger', 'b is not an integer', 'It can'], a: 1, why: 'n lg n / n = lg n, which is smaller than any n^ε. The extended case 2 gives Θ(n lg² n).' },
    { q: 'What does T(n) = T(n − 1) + n solve to?', opts: ['Θ(n)', 'Θ(n lg n)', 'Θ(n²)', 'Θ(2ⁿ)'], a: 2, why: 'Summing n + (n−1) + … + 1 gives n(n+1)/2. This is quicksort’s worst case.' },
    { q: 'In a recursion tree for T(n) = aT(n/b) + f(n), how many leaves are there?', opts: ['a', 'n', 'n^(log_b a)', 'log_b n'], a: 2, why: 'The tree has depth log_b n and branching a, so a^(log_b n) = n^(log_b a) leaves.' },
  ],
});

topic({
  id: 'probabilistic', title: 'Probabilistic analysis', sec: '§5.1–5.3', prereq: ['asymptotic'],
  blurb: 'Average-case reasoning with indicator random variables, and why algorithms should randomize.',
  cx: [['Expected hires', 'H_n ≈ ln n'], ['Random permutation', 'Θ(n)']],
  props: ['Indicator variables', 'Linearity of expectation'],
  tags: 'probability randomized expected value hiring problem indicator random variable shuffle fisher yates',
  learn: `
<h3>The hiring problem</h3>
<p>You interview <i>n</i> candidates for a job, one per day, in some order. After each interview you compare the candidate with the best person seen so far, and if the new one is better you fire the current employee and hire the new one. Hiring is expensive. How many times do you hire?</p>
<p>The worst case is easy: if candidates arrive in increasing order of quality, you hire all <i>n</i>. But if they arrive in <b>random order</b>, the answer is much smaller.</p>
<h3>Indicator random variables</h3>
<p>For an event <i>A</i>, the indicator <i>I</i>{<i>A</i>} is 1 if <i>A</i> happens and 0 otherwise. Its expected value is just the probability: E[<i>I</i>{<i>A</i>}] = Pr{<i>A</i>}. Combined with <b>linearity of expectation</b> (E[<i>X</i> + <i>Y</i>] = E[<i>X</i>] + E[<i>Y</i>], even when <i>X</i> and <i>Y</i> are dependent), this turns hard counting into easy sums.</p>
<p>Let <i>X<sub>i</sub></i> = 1 if candidate <i>i</i> is hired. Candidate <i>i</i> is hired exactly when they are the best of the first <i>i</i>, which in a random order happens with probability 1/<i>i</i>. So</p>
<div class="formula">E[hires] = Σ<sub>i=1..n</sub> 1/i = H<sub>n</sub> = ln n + O(1)</div>
<p>With 100 candidates you expect about 5.2 hires, not 100. The simulator under <b>Visualize</b> checks this empirically.</p>
<h3>Randomized algorithms</h3>
<p>Probabilistic analysis assumes the <i>input</i> is random, which you often cannot guarantee. A <b>randomized algorithm</b> makes its own random choices so that no particular input is bad. For the hiring problem, shuffle the candidates first. For quicksort, choose the pivot at random. The expected cost then holds for every input.</p>
<h3>Shuffling correctly</h3>
<p><code>randomizeInPlace</code> (the Fisher–Yates shuffle) swaps <i>A[i]</i> with a uniformly random element of <i>A[i..n]</i>, for <i>i</i> = 1 to <i>n</i>. It produces every permutation with probability exactly 1/<i>n</i>! in linear time. A common bug is swapping with a random element of the <i>whole</i> array each time, which gives <i>n</i><sup><i>n</i></sup> equally likely outcomes; that number is not divisible by <i>n</i>! for <i>n</i> ≥ 3, so some permutations come up more often than others.</p>
<h3>More results from the chapter</h3>
<ul><li><b>Birthday paradox</b>: with 23 people, the chance that two share a birthday exceeds 1/2. Expected collisions grow like <i>k</i>²/(2<i>n</i>), which is why hash collisions appear sooner than intuition suggests.</li><li><b>Balls and bins</b>: about <i>n</i> ln <i>n</i> tosses fill all <i>n</i> bins (the coupon collector).</li><li><b>Online hiring</b>: reject the first <i>n</i>/<i>e</i> candidates, then hire the first one better than all of them. You get the best candidate with probability about 1/<i>e</i>.</li></ul>
<h3>In interviews</h3>
<ul><li>Shuffle an Array (LC 384) is Fisher–Yates.</li><li>Random Pick with Weight (LC 528) and Linked List Random Node (LC 382, reservoir sampling) are about sampling uniformly.</li><li>Use linearity of expectation whenever someone asks for an expected count.</li></ul>`,
  code: {
    pseudo: `randomizeInPlace(A)
  n ← len(A)
  for i ← 1 to n
      swap A[i] with A[random(i, n)]

hireAssistant(n)
  best ← 0          // dummy candidate 0 loses to everyone
  for i ← 1 to n
      evaluate candidate i
      if candidate i is better than candidate best
          best ← i
          hire(i)              // the costly step`,
    py: `import random

def shuffle(a):                       # Fisher-Yates
    for i in range(len(a) - 1):
        j = random.randint(i, len(a) - 1)
        a[i], a[j] = a[j], a[i]
    return a

def hires(order):
    best, count = float('-inf'), 0
    for q in order:
        if q > best:
            best, count = q, count + 1
    return count

n, trials = 100, 10000
avg = sum(hires(shuffle(list(range(n)))) for _ in range(trials)) / trials
print(avg)   # close to H_100 = 5.19`,
    cpp: `#include <vector>
#include <random>
#include <utility>
using namespace std;

mt19937 rng(random_device{}());

void fisherYates(vector<int>& a) {
    for (int i = 0; i + 1 < (int)a.size(); i++) {
        uniform_int_distribution<int> d(i, a.size() - 1);
        swap(a[i], a[d(rng)]);
    }
}

int hires(const vector<int>& order) {
    int best = -1, count = 0;
    for (int q : order) if (q > best) { best = q; count++; }
    return count;
}`,
  },
  custom(el) {
    const nI = h('input', { type: 'number', id: 'h-n', value: 50, min: 2, max: 2000 });
    const tI = h('input', { type: 'number', id: 'h-t', value: 2000, min: 10, max: 20000 });
    const out = h('div'), strip = h('div');
    function one() {
      const n = Math.min(30, +nI.value || 30), order = shuffle(Array.from({ length: n }, (_, i) => i + 1));
      let best = 0; const hl = {};
      order.forEach((q, i) => { if (q > best) { best = q; hl[i] = 'found'; } });
      strip.innerHTML = '';
      strip.append(h('div', { class: 'stage', style: { minHeight: '0' } }, renderArr({ a: order, hl, base: 1, bars: true, label: 'One random order (bar height is quality). Green bars are hires.' })),
        h('p', { class: 'muted' }, `${Object.keys(hl).length} hires out of ${n} candidates.`));
    }
    function run() {
      const n = Math.max(2, Math.min(2000, +nI.value || 50)), T = Math.max(10, Math.min(20000, +tI.value || 2000));
      const hist = {}; let sum = 0;
      for (let t = 0; t < T; t++) { let best = -1, c = 0; for (let i = 0; i < n; i++) { const q = Math.random(); if (q > best) { best = q; c++; } } hist[c] = (hist[c] || 0) + 1; sum += c; }
      let H = 0; for (let i = 1; i <= n; i++) H += 1 / i;
      const ks = Object.keys(hist).map(Number).sort((a, b) => a - b), mx = Math.max(...Object.values(hist));
      out.innerHTML = '';
      out.append(h('div', { class: 'answer-box' }, `Average over ${T.toLocaleString()} random orders: `, h('b', null, (sum / T).toFixed(3)), ` hires. Theory says H_${n} = `, h('b', null, H.toFixed(3)), ` (and ln ${n} = ${Math.log(n).toFixed(3)}).`),
        h('div', { class: 'bars-h' }, ks.map(k => h('div', { class: 'bh' }, h('span', null, `${k} hire${k > 1 ? 's' : ''}`), h('div', { class: 'tr' }, h('i', { style: { width: (100 * hist[k] / mx) + '%' } })), h('span', null, (100 * hist[k] / T).toFixed(1) + '%')))));
      one();
    }
    el.append(h('div', { class: 'panel', style: { padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' } },
      h('div', null, h('h2', { class: 'h3' }, 'Hiring problem simulator'), h('p', { class: 'muted' }, 'Generate random candidate orders and count how often a new best appears.')),
      h('div', { class: 'ctl-row' }, h('label', { for: 'h-n' }, 'Candidates', nI), h('label', { for: 'h-t' }, 'Trials', tI), h('button', { class: 'btn ink', onclick: run }, 'Run simulation')), out, strip));
    run();
  },
  quiz: [
    { q: 'In a random order of n candidates, what is the probability that candidate i is hired?', opts: ['1/n', '1/i', 'i/n', '1/2'], a: 1, why: 'Candidate i is hired when they are the best of the first i, and each of those i is equally likely to be the best.' },
    { q: 'Expected hires with 1000 candidates in random order is about…', opts: ['1', '7.5', '31.6', '500'], a: 1, why: 'H₁₀₀₀ ≈ ln 1000 + 0.577 ≈ 7.49.' },
    { q: 'Linearity of expectation requires the random variables to be…', opts: ['independent', 'identically distributed', 'nothing special: it always holds', 'indicator variables'], a: 2, why: 'E[X + Y] = E[X] + E[Y] for any random variables with finite expectations.' },
    { q: 'Which shuffle produces a uniform random permutation?', opts: ['For each i, swap A[i] with A[RANDOM(1, n)]', 'For each i, swap A[i] with A[RANDOM(i, n)]', 'Sort by a random key that may repeat', 'Swap two random elements n times'], a: 1, why: 'Fisher–Yates. The first option has nⁿ outcomes, which cannot divide evenly among n! permutations.' },
  ],
});

topic({
  id: 'amortized', title: 'Amortized analysis', sec: '§17.1–17.4', prereq: ['asymptotic'],
  blurb: 'Average the cost of a sequence of operations so rare expensive steps are paid for by many cheap ones.',
  cx: [['Dynamic array append', 'O(1) amortized'], ['Binary counter increment', 'O(1) amortized']],
  props: ['Aggregate', 'Accounting', 'Potential'],
  tags: 'amortized dynamic table array doubling potential accounting aggregate binary counter',
  learn: `
<p>Some data structures have operations that are usually cheap and occasionally expensive. A dynamic array (Python <code>list</code>, C++ <code>vector</code>) appends in constant time until it fills up, then copies everything into a table twice as large. A worst-case bound per operation (“append is O(<i>n</i>)”) is true but far too pessimistic. <b>Amortized analysis</b> bounds the total cost of any sequence of <i>n</i> operations, then divides by <i>n</i>.</p>
<div class="note key">Amortized cost is a <b>guarantee about worst-case sequences</b>, not an average over random inputs. No probability is involved.</div>
<h3>Three methods, one example: the dynamic table</h3>
<p>Insert into a table; when it is full, allocate a table of twice the size and copy all items over. Inserting the <i>i</i>-th item costs <i>i</i> if <i>i</i> − 1 is a power of 2 (copy <i>i</i> − 1 items plus insert one), and 1 otherwise.</p>
<p><b>Aggregate method.</b> Add up the total. Over <i>n</i> inserts, the copies cost at most 1 + 2 + 4 + … + <i>n</i> &lt; 2<i>n</i>, and the plain inserts cost <i>n</i>. Total &lt; 3<i>n</i>, so each insert is O(1) amortized.</p>
<p><b>Accounting method.</b> Charge each insert 3 units. One pays for inserting the item itself. One is saved on the item to pay for moving it at the next expansion. The last is saved to move one of the items that were already moved in an earlier expansion. The bank balance never goes negative, so 3 per insert covers everything.</p>
<p><b>Potential method.</b> Define a potential function on the data structure, Φ = 2·<i>num</i> − <i>size</i>, like stored energy. The amortized cost of an operation is its actual cost plus the change in Φ. A cheap insert raises Φ by 2 (amortized cost 3). An expanding insert costs <i>num</i> + 1 but Φ drops from about <i>num</i> to 2, so the amortized cost is again 3. Since Φ starts at 0 and never goes negative, the total amortized cost bounds the actual cost.</p>
<h3>Two more examples from the book</h3>
<ul><li><b>Stack with <code>multipop</code></b>: popping <i>k</i> items costs <i>k</i>, but each item can be popped at most once after being pushed, so <i>n</i> operations cost O(<i>n</i>) total.</li><li><b>Binary counter</b>: an increment can flip many bits, but bit <i>i</i> flips only every 2<sup><i>i</i></sup> increments, so <i>n</i> increments flip fewer than 2<i>n</i> bits.</li></ul>
<h3>Shrinking</h3>
<p>Halving the table when it becomes half empty can thrash: alternating inserts and deletes at the boundary make every operation expensive. The book's fix is to halve only when the table is a quarter full. Then both insert and delete are O(1) amortized.</p>
<h3>In interviews</h3>
<ul><li>Saying “append is amortized O(1)” correctly is expected whenever you use a dynamic array or a hash table.</li><li>Monotonic stack problems (Daily Temperatures, LC 739) are O(<i>n</i>) by the same argument as <code>multipop</code>: each element is pushed and popped once.</li><li>Implement Queue using Stacks (LC 232) has amortized O(1) operations.</li></ul>`,
  code: {
    pseudo: `tableInsert(T, x)
  if T.size = 0
      allocate T.table with 1 slot
      T.size ← 1
  if T.num = T.size
      allocate newTable with 2 · T.size slots
      copy every item of T.table into newTable
      free T.table
      T.table ← newTable
      T.size ← 2 · T.size
  store x in the next free slot of T.table
  T.num ← T.num + 1`,
    py: `class DynamicArray:
    def __init__(self):
        self.cap, self.n = 1, 0
        self.data = [None]
        self.copies = 0

    def append(self, x):
        if self.n == self.cap:               # full: double the capacity
            new = [None] * (2 * self.cap)
            for i in range(self.n):
                new[i] = self.data[i]
                self.copies += 1
            self.data, self.cap = new, 2 * self.cap
        self.data[self.n] = x
        self.n += 1

d = DynamicArray()
for i in range(1000):
    d.append(i)
print(d.copies)    # 1023 copies for 1000 appends: under 2 per append`,
    cpp: `#include <cstddef>

struct DynArray {
    int* data = new int[1];
    size_t cap = 1, n = 0;

    void push(int x) {
        if (n == cap) {                     // full: double
            int* bigger = new int[2 * cap];
            for (size_t i = 0; i < n; i++) bigger[i] = data[i];
            delete[] data;
            data = bigger;
            cap *= 2;
        }
        data[n++] = x;
    }
    ~DynArray() { delete[] data; }
};`,
  },
  viz: {
    inputHint: 'How many insertions (2 to 20)',
    presets: [{ label: '17 insertions', input: '17', note: 'Expansions happen at insert 2, 3, 5, 9 and 17.' }, { label: '8 insertions', input: '8', note: 'Watch the potential rebuild after each doubling.' }],
    random: () => String(rnd(9, 17)),
    parse: s => parseNums(s, { min: 1, max: 1, lo: 2, hi: 20 })[0],
    run(N) {
      const R = Rec(); let size = 0, num = 0; const costs = [], amort = [];
      const S = (hl, msg) => ({ vars: { num, size, 'Φ = 2·num − size': 2 * num - size, 'total actual': costs.reduce((a, b) => a + b, 0), '3 × inserts': 3 * costs.length },
        arrays: [{ name: 'T', label: `Table (size ${size})`, a: Array.from({ length: Math.max(size, 1) }, (_, i) => i < num ? i + 1 : null), hl, small: true, base: 1 },
          { name: 'c', label: 'Actual cost of each insert', a: costs.length ? [...costs] : [0], bars: true, base: 1, hl: costs.length ? { [costs.length - 1]: 'cur' } : {} }] });
      R.add(S({}), 1, 'Empty table. Each insert will be charged an amortized cost of 3.');
      for (let i = 1; i <= N; i++) {
        let cost = 1, msg;
        const willExpand = size === 0 || num === size;
        const ask = { q: `Insert #${i}: num = ${num}, size = ${size}. What is the actual cost of this insert (copies plus one write)?`, value: size === 0 ? 1 : num === size ? num + 1 : 1, hint: num === size && size ? 'The table is full: every existing item is copied first.' : 'There is a free slot.' };
        if (size === 0) { size = 1; msg = 'Allocate a table of size 1, then insert.'; }
        else if (num === size) { cost = num + 1; size *= 2; msg = `Table full. Double to ${size} slots and copy ${num} items, then insert: actual cost ${cost}.`; }
        else msg = 'A free slot exists: actual cost 1.';
        num++; costs.push(cost);
        R.add(S({ [num - 1]: willExpand ? 'cur' : 'found', ...(willExpand ? rangeHl(0, num - 2, 'cmp') : {}) }), willExpand ? 6 : 11, msg + ` Φ is now ${2 * num - size}.`, i > 1 && (willExpand || Math.random() < .3) ? ask : null);
      }
      R.add(S({}), 12, `After ${N} inserts: actual total ${costs.reduce((a, b) => a + b, 0)} ≤ 3 × ${N} = ${3 * N}. Amortized O(1) per insert.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'Appending n items to a doubling dynamic array costs in total…', opts: ['Θ(n)', 'Θ(n lg n)', 'Θ(n²)', 'Θ(lg n)'], a: 0, why: 'Copies sum to 1 + 2 + 4 + … < 2n, plus n writes.' },
    { q: 'If the array grows by a constant 10 slots instead of doubling, n appends cost…', opts: ['Θ(n)', 'Θ(n²)', 'Θ(n lg n)', 'Θ(n/10)'], a: 1, why: 'Copies happen every 10 appends and cost 10, 20, 30, … which sums to Θ(n²). Growth must be geometric.' },
    { q: 'n increments of a binary counter starting from 0 flip how many bits in total?', opts: ['Θ(n lg n)', 'Fewer than 2n', 'Exactly n', 'Θ(n²)'], a: 1, why: 'Bit i flips ⌊n/2^i⌋ times, and the sum is less than 2n.' },
    { q: 'Amortized analysis differs from average-case analysis because…', opts: ['it uses probability', 'it bounds the worst-case total of any sequence, with no probability', 'it ignores expensive operations', 'it only applies to arrays'], a: 1, why: 'The bound holds for every sequence, no randomness assumed.' },
    { q: 'Why shrink a table only when it is 1/4 full rather than 1/2 full?', opts: ['To save memory', 'To avoid thrashing between expand and contract at the boundary', 'It is required for stability', 'Halving is impossible'], a: 1, why: 'At the 1/2 threshold, alternating insert and delete would trigger a full copy every operation.' },
  ],
});
