import { setPart, topic } from '../registry';
import { Rec, h, sv } from '../../engine/helpers';
import { renderTree } from '../../engine/stage';
import { placeNodes, gview, ekey, parseGraph } from './graphs';

setPart('adv');

/* ---------------- Fibonacci heaps ---------------- */
topic({
  id: 'fib-heaps', title: 'Fibonacci heaps', sec: '§19.1–19.4', prereq: ['binary-heap', 'amortized'],
  blurb: 'A lazy heap with constant amortized insert, union and decrease-key, which speeds up Dijkstra and Prim in theory.',
  cx: [['Insert, union, min', 'O(1)'], ['Decrease-key', 'O(1) amortized'], ['Extract-min, delete', 'O(lg n) amortized']],
  props: ['Mergeable heap', 'Lazy consolidation', 'Cascading cuts'],
  tags: 'fibonacci heap decrease key mergeable heap amortized consolidate cascading cut',
  learn: `
<p>A binary heap does every operation in O(lg <i>n</i>). Some algorithms call <b>decrease-key</b> far more often than extract-min: Dijkstra's and Prim's algorithms can call it once per edge. A <b>Fibonacci heap</b> makes decrease-key O(1) amortized, which turns Dijkstra into O(<i>E</i> + <i>V</i> lg <i>V</i>).</p>
<h3>Structure</h3>
<p>A Fibonacci heap is a collection of heap-ordered trees whose roots sit in a circular, doubly linked <b>root list</b>, with a pointer to the minimum root. Children of each node are also kept in a circular list. Each node records its <i>degree</i> (number of children) and a boolean <i>mark</i>.</p>
<h3>Be lazy, then clean up</h3>
<ul><li><b>Insert</b> adds a one-node tree to the root list and updates the minimum pointer. O(1).</li><li><b>Union</b> splices two root lists together. O(1).</li><li><b>Extract-min</b> removes the minimum root, promotes its children to roots, then <b>consolidates</b>: repeatedly link two roots of equal degree (the larger key becomes a child of the smaller) until all roots have distinct degrees. This is where the postponed work is paid for, O(lg <i>n</i>) amortized.</li><li><b>Decrease-key</b> lowers a key; if heap order breaks, <b>cut</b> the node and move it to the root list. If its parent was already marked (had lost a child before), cut the parent too, and so on up: a <b>cascading cut</b>. Then mark the last parent reached. O(1) amortized.</li></ul>
<div class="note key">The analysis uses the potential Φ = <i>t</i>(<i>H</i>) + 2 <i>m</i>(<i>H</i>): the number of roots plus twice the number of marked nodes. Cascading cuts keep every subtree of degree <i>k</i> at least <i>F</i><sub><i>k</i>+2</sub> ≥ φ<sup><i>k</i></sup> nodes, so the maximum degree is O(lg <i>n</i>). That Fibonacci bound gives the structure its name.</div>
<h3>In practice</h3>
<p>The constants and pointer chasing make Fibonacci heaps slower than binary heaps for most real inputs. Pairing heaps, or a binary heap with lazy deletion, usually win. Know the bounds and why they matter for graph algorithms; nobody expects you to code one in an interview.</p>`,
  quiz: [
    { q: 'Which operation is cheaper in a Fibonacci heap than in a binary heap?', opts: ['Extract-min', 'Decrease-key', 'Find the maximum', 'Sorting'], a: 1, why: 'O(1) amortized versus O(lg n).' },
    { q: 'When does a Fibonacci heap consolidate its root list?', opts: ['On every insert', 'During extract-min', 'During union', 'Never'], a: 1, why: 'Inserts and unions are lazy; extract-min pays for the cleanup.' },
    { q: 'With a Fibonacci heap, Dijkstra’s algorithm runs in…', opts: ['O(V²)', 'O(E lg V)', 'O(E + V lg V)', 'O(VE)'], a: 2, why: 'E decrease-keys at O(1) and V extract-mins at O(lg V).' },
    { q: 'What triggers a cascading cut?', opts: ['A node losing a second child', 'Inserting a duplicate key', 'An empty root list', 'A union'], a: 0, why: 'A marked node has already lost one child; losing another cuts it too.' },
  ],
});

/* ---------------- van Emde Boas ---------------- */
topic({
  id: 'veb', title: 'van Emde Boas trees', sec: '§20.1–20.3', prereq: ['b-trees', 'bit-manipulation'],
  blurb: 'Predecessor and successor queries over integer keys in O(lg lg u) time by recursing on the square root of the universe.',
  cx: [['Insert, delete, successor', 'O(lg lg u)'], ['Space', 'O(u)']],
  props: ['Integer keys 0..u−1', 'Recursive square-root split'],
  tags: 'van emde boas tree predecessor successor integer lg lg u',
  learn: `
<p>Comparison-based structures cannot beat O(lg <i>n</i>) for successor queries. If the keys are integers from a universe {0, 1, …, <i>u</i> − 1}, the <b>van Emde Boas tree</b> does better: O(lg lg <i>u</i>) for insert, delete, member, minimum, maximum, successor and predecessor. For 32-bit keys, lg lg <i>u</i> = 5.</p>
<h3>The square-root idea</h3>
<p>Split each key <i>x</i> into a <b>high</b> half and a <b>low</b> half: high(<i>x</i>) = ⌊<i>x</i>/√<i>u</i>⌋ chooses a <b>cluster</b>, low(<i>x</i>) = <i>x</i> mod √<i>u</i> is the position inside it. A vEB structure for universe <i>u</i> holds √<i>u</i> clusters, each a vEB structure for universe √<i>u</i>, plus a <b>summary</b> vEB structure recording which clusters are non-empty.</p>
<p>Successor of <i>x</i>: if <i>x</i>'s own cluster has an element larger than low(<i>x</i>), recurse into that cluster; otherwise ask the summary for the next non-empty cluster and take its minimum. Storing each structure's <b>min</b> and <b>max</b> directly (and keeping the min out of the clusters) ensures only <b>one</b> recursive call per level, so</p>
<div class="formula">T(u) = T(√u) + O(1) &nbsp;⟹&nbsp; T(u) = O(lg lg u)</div>
<p>Substituting <i>m</i> = lg <i>u</i> turns it into <i>S</i>(<i>m</i>) = <i>S</i>(<i>m</i>/2) + O(1), the binary search recurrence.</p>
<h3>Trade-offs</h3>
<p>Space is O(<i>u</i>), which is large when the universe is big and the set is small. Hashing the clusters (y-fast tries) brings space down to O(<i>n</i>). The chapter is a lesson in using structure in the keys, not just comparisons, to beat comparison bounds, just as counting sort did.</p>`,
  quiz: [
    { q: 'What recurrence describes a vEB successor query?', opts: ['T(u) = 2T(u/2) + O(1)', 'T(u) = T(√u) + O(1)', 'T(u) = T(u − 1) + O(1)', 'T(u) = T(u/2) + O(lg u)'], a: 1, why: 'One recursive call on a structure of size √u.' },
    { q: 'For 64-bit integer keys, lg lg u equals…', opts: ['6', '32', '64', '8'], a: 0, why: 'lg 64 = 6.' },
    { q: 'Why does a vEB node store its minimum outside the clusters?', opts: ['To save memory', 'So that operations make only one recursive call per level', 'For sorting', 'It does not'], a: 1, why: 'Inserting into an empty cluster then costs O(1), avoiding a second recursive call.' },
  ],
});

/* ---------------- NP-completeness ---------------- */
const NP_TREE = {
  nodes: {
    cs: { k: 'CIRCUIT-SAT', c: ['sat'] }, sat: { k: 'SAT', c: ['3cnf'] }, '3cnf': { k: '3-CNF-SAT', c: ['clique', 'subset'] },
    clique: { k: 'CLIQUE', c: ['vc'] }, vc: { k: 'VERTEX-COVER', c: ['ham'] }, ham: { k: 'HAM-CYCLE', c: ['tsp'] }, tsp: { k: 'TSP', c: [] }, subset: { k: 'SUBSET-SUM', c: [] },
  },
};
topic({
  id: 'np-complete', title: 'NP-completeness', sec: '§34.1–34.5', prereq: ['dfs', 'knapsack'],
  blurb: 'Why some problems seem to resist every efficient algorithm, and how reductions prove it.',
  cx: [['P', 'solvable in polynomial time'], ['NP', 'verifiable in polynomial time']],
  props: ['Reductions', 'P vs NP'],
  tags: 'np complete np hard p vs np reduction sat clique vertex cover hamiltonian traveling salesman',
  learn: `
<p>Most algorithms in this course run in polynomial time, O(<i>n<sup>k</sup></i>) for some constant <i>k</i>. Chapter 34 studies problems for which no polynomial algorithm is known, and explains why finding one would solve all of them at once.</p>
<h3>The classes</h3>
<ul><li><b>P</b>: decision problems solvable in polynomial time. Shortest paths, sorting, matching.</li><li><b>NP</b>: decision problems whose “yes” answers have a <b>certificate</b> that can be checked in polynomial time. Given a proposed Hamiltonian cycle, checking it is easy even though finding one seems hard. P ⊆ NP; whether they are equal is the most famous open question in computer science.</li><li><b>NP-hard</b>: at least as hard as every problem in NP. <b>NP-complete</b>: NP-hard and in NP itself.</li></ul>
<h3>Reductions</h3>
<p>Problem A <b>reduces</b> to problem B (A ≤<sub>P</sub> B) if a polynomial-time transformation turns any instance of A into an instance of B with the same answer. Then a fast algorithm for B gives a fast algorithm for A, so B is at least as hard. To prove a new problem B NP-complete: show B ∈ NP, then reduce a known NP-complete problem to B.</p>
<p>The chain starts with <b>Circuit-SAT</b>, proved NP-complete directly (Cook–Levin). The book then builds the tree drawn under <b>Visualize</b>: SAT, 3-CNF-SAT, Clique, Vertex Cover, Hamiltonian Cycle, Travelling Salesman and Subset Sum.</p>
<div class="note key"><b>Clique from 3-CNF-SAT</b>, the classic example: for each clause make three vertices, one per literal. Connect two vertices when they are in different clauses and are not negations of each other. The formula with <i>k</i> clauses is satisfiable exactly when the graph has a clique of size <i>k</i>: pick one true literal per clause.</div>
<h3>What to do in practice</h3>
<p>An NP-complete label means “stop looking for a fast exact algorithm for every input”. Instead: exploit special structure (2-SAT and bipartite matching are polynomial), use exponential algorithms that are fine for small <i>n</i> (bitmask DP, backtracking with pruning), use <a href="/learn/approximation">approximation algorithms</a> with guarantees, or heuristics.</p>
<h3>In interviews</h3>
<ul><li>Recognizing that a problem is a disguised TSP, knapsack or subset-sum tells you the constraints must be small and points to bitmask DP or pseudo-polynomial DP.</li><li>Shortest Path Visiting All Nodes (LC 847) and Find the Shortest Superstring (LC 943) are TSP-shaped with <i>n</i> ≤ 12.</li></ul>`,
  custom(el) {
    const clauses = [[1, -2, 3], [-1, 2, 3], [1, 2, -3], [-1, -2, -3]];
    const val = { 1: true, 2: false, 3: true };
    const box = h('div');
    const lit = l => `${l < 0 ? '¬' : ''}x${Math.abs(l)}`;
    const truth = l => (l < 0 ? !val[-l] : val[l]);
    function draw() {
      box.innerHTML = '';
      const ok = clauses.map(c => c.some(truth));
      box.append(h('div', { class: 'ctl-row' }, [1, 2, 3].map(v => h('button', { class: 'btn sm' + (val[v] ? ' ink' : ''), 'aria-pressed': String(val[v]), onclick: () => { val[v] = !val[v]; draw(); } }, `x${v} = ${val[v] ? 'true' : 'false'}`))));
      box.append(h('div', { class: 'tablewrap', style: { marginTop: '14px' } }, h('table', { class: 'ctable' },
        h('thead', null, h('tr', null, h('th', null, 'Clause'), h('th', null, 'Literals'), h('th', null, 'Satisfied?'))),
        h('tbody', null, clauses.map((c, i) => h('tr', null, h('td', null, 'C' + (i + 1)), h('td', null, c.map(l => h('span', { class: 'chip', style: { marginRight: '4px', background: truth(l) ? 'var(--ok-soft)' : 'var(--paper-2)' } }, lit(l)))), h('td', null, ok[i] ? 'Yes' : 'No')))))));
      const all = ok.every(Boolean);
      box.append(h('div', { class: 'answer-box', style: { marginTop: '12px' } }, all ? 'This assignment satisfies every clause: it is a certificate, and checking it took one pass over the clauses (polynomial time).' : `Clause ${ok.indexOf(false) + 1} is false. Try another assignment. Finding one can take up to 2ⁿ tries; checking one is fast.`));
    }
    draw();
    el.append(h('div', { style: { display: 'flex', flexDirection: 'column', gap: '22px' } },
      h('div', null, h('h3', { class: 'lbl ink sq', style: { marginBottom: '10px' } }, 'Verify a certificate'), h('p', { class: 'muted', style: { marginBottom: '12px' } }, 'Formula: (x1 ∨ ¬x2 ∨ x3) ∧ (¬x1 ∨ x2 ∨ x3) ∧ (x1 ∨ x2 ∨ ¬x3) ∧ (¬x1 ∨ ¬x2 ∨ ¬x3). Toggle the variables.'), box),
      h('div', null, h('h3', { class: 'lbl ink sq', style: { marginBottom: '10px' } }, 'The chain of reductions in Chapter 34'), renderTree({ ...NP_TREE, root: 'cs', levelH: 66, gap: 26 }), h('p', { class: 'muted', style: { marginTop: '8px' } }, 'An arrow from A to B means A reduces to B, so B is at least as hard. Every problem in the tree is NP-complete.'))));
  },
  quiz: [
    { q: 'A problem is in NP when…', opts: ['it cannot be solved in polynomial time', 'a proposed solution can be verified in polynomial time', 'it is not in P', 'it needs exponential space'], a: 1, why: 'NP is about efficient verification, not hardness.' },
    { q: 'To show B is NP-hard, you reduce…', opts: ['B to a known NP-complete problem', 'a known NP-complete problem to B', 'B to sorting', 'B to itself'], a: 1, why: 'Then solving B quickly would solve the known hard problem quickly.' },
    { q: 'Which of these is solvable in polynomial time?', opts: ['3-SAT', '2-SAT', 'Hamiltonian cycle', 'Subset sum'], a: 1, why: '2-SAT reduces to strongly connected components on an implication graph.' },
    { q: 'If someone found a polynomial algorithm for one NP-complete problem, then…', opts: ['only that problem gets easier', 'P = NP', 'P ≠ NP', 'nothing changes'], a: 1, why: 'Every NP problem reduces to it.' },
    { q: 'Knapsack has an O(nW) dynamic program. Why is it still NP-complete?', opts: ['The DP is wrong', 'O(nW) is exponential in the number of bits used to write W', 'Knapsack is not in NP', 'It is not NP-complete'], a: 1, why: 'Pseudo-polynomial is not polynomial in the input size.' },
  ],
});

/* ---------------- approximation ---------------- */
topic({
  id: 'approximation', title: 'Approximation algorithms', sec: '§35.1–35.5', prereq: ['np-complete', 'mst'],
  blurb: 'Fast algorithms for NP-hard problems that come with a proven bound on how far from optimal they can be.',
  cx: [['Vertex cover', '2-approximation, O(V + E)'], ['Metric TSP', '2-approximation via MST']],
  props: ['Approximation ratio', 'Lower bounds'],
  tags: 'approximation algorithm vertex cover tsp set cover ratio greedy',
  learn: `
<p>When a problem is NP-hard, you can still often guarantee a good answer. An algorithm has <b>approximation ratio</b> ρ if, on every input, its answer is within a factor ρ of the optimum. The trick in every proof is to compare against a <b>lower bound</b> on the optimum, since the optimum itself is unknown.</p>
<h3>Vertex cover, ratio 2</h3>
<p>A <b>vertex cover</b> is a set of vertices touching every edge. <code>approxVertexCover</code>: while edges remain, pick any edge (<i>u</i>, <i>v</i>), add <b>both</b> endpoints to the cover, and delete every edge touching <i>u</i> or <i>v</i>.</p>
<div class="note key">The chosen edges share no endpoints (they form a matching), so any cover, including the optimal one, needs at least one vertex per chosen edge. The algorithm takes two per edge, so its cover is at most twice the optimum.</div>
<h3>Travelling salesman with the triangle inequality</h3>
<p>Build a minimum spanning tree, walk it in preorder, and visit vertices in that order. The MST costs no more than the optimal tour (delete one tour edge and you have a spanning tree), the full walk costs twice the MST, and shortcuts never increase cost when distances obey the triangle inequality. Ratio 2. Without the triangle inequality, no constant ratio is possible unless P = NP.</p>
<h3>Set cover and the greedy bound</h3>
<p>Repeatedly pick the set covering the most uncovered elements. The ratio is <i>H</i>(max set size) ≈ ln <i>n</i>, and that is essentially the best possible.</p>
<h3>Subset sum</h3>
<p>Section 35.5 gives a <b>fully polynomial-time approximation scheme</b>: for any ε &gt; 0, get within a factor 1 + ε in time polynomial in <i>n</i> and 1/ε, by trimming lists of partial sums that are within a small factor of each other.</p>`,
  code: {
    pseudo: `approxVertexCover(G)
  C ← ∅
  E' ← G.E
  while E' ≠ ∅
      pick any edge (u, v) ∈ E'
      C ← C ∪ {u, v}
      remove from E' every edge touching u or v
  return C`,
    py: `def approx_vertex_cover(edges):
    cover, remaining = set(), list(edges)
    while remaining:
        u, v = remaining[0]                 # any edge
        cover |= {u, v}
        remaining = [(a, b) for a, b in remaining if a not in (u, v) and b not in (u, v)]
    return cover                            # at most twice the optimum`,
    cpp: `#include <set>
#include <vector>
using namespace std;

set<int> approxVertexCover(const vector<pair<int, int>>& edges) {
    set<int> cover;
    for (auto [u, v] : edges)               // scanning in order picks a maximal matching
        if (!cover.count(u) && !cover.count(v)) { cover.insert(u); cover.insert(v); }
    return cover;
}`,
  },
  viz: {
    inputHint: 'Undirected edges',
    presets: [{ label: 'Seven vertices', input: 'A-B B-C C-D C-E D-E D-F E-F D-G', note: 'A small graph in the spirit of Figure 35.1. The optimal cover has 3 vertices; the algorithm returns at most 6.' }],
    random: () => 'A-B B-C C-D D-E E-F F-A A-D B-E',
    parse: s => { const G = parseGraph(s); if (G.directed) throw new Error('Use undirected edges, written a-b.'); return G; },
    run(G) {
      const R = Rec(), P = placeNodes(G.nodes); const C = new Set(), gone = new Set();
      const st = (cur) => { const ncls = {}, ecls = {}; for (const n of C) ncls[n] = 'cur'; for (const e of G.edges) { const k = ekey(G, e.u, e.v); if (gone.has(k)) ecls[k] = 'dim'; } if (cur) ecls[cur] = 'mst'; return { graph: gview(G, P, { ncls, ecls, weights: false }), vars: { 'cover size': C.size } }; };
      R.add(st(), 2, 'Start with an empty cover. Every edge still needs covering.');
      for (const e of G.edges) {
        const k = ekey(G, e.u, e.v); if (gone.has(k)) continue;
        R.add(st(k), 5, `Pick an uncovered edge, ${e.u}–${e.v}.`);
        C.add(e.u); C.add(e.v);
        for (const f of G.edges) if ([e.u, e.v].includes(f.u) || [e.u, e.v].includes(f.v)) gone.add(ekey(G, f.u, f.v));
        R.add(st(), 7, `Add both ${e.u} and ${e.v}; every edge touching them is now covered.`, { q: `After adding ${e.u} and ${e.v}, how many vertices are in the cover?`, value: C.size });
      }
      R.add(st(), 8, `Cover {${[...C].join(', ')}} with ${C.size} vertices: at most twice the optimum.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'Why does approxVertexCover never exceed twice the optimum?', opts: ['It is greedy', 'The chosen edges form a matching, and any cover needs one vertex per matched edge', 'Vertex cover is easy', 'It checks all subsets'], a: 1, why: 'The matching gives a lower bound on the optimum.' },
    { q: 'The MST-based TSP tour is within a factor 2 of optimal when…', opts: ['the graph is a tree', 'distances satisfy the triangle inequality', 'all weights are equal', 'n is small'], a: 1, why: 'Shortcutting a repeated vertex never makes the tour longer under the triangle inequality.' },
    { q: 'Greedy set cover achieves a ratio of about…', opts: ['2', 'ln n', '√n', '1'], a: 1, why: 'H(max set size), and doing much better is NP-hard.' },
  ],
});

/* ---------------- FFT ---------------- */
topic({
  id: 'fft', title: 'Polynomials and the FFT', sec: '§30.1–30.3', prereq: ['divide-conquer', 'number-theory'],
  blurb: 'Multiply polynomials (and big integers) in O(n lg n) by evaluating at roots of unity.',
  cx: [['Naive multiplication', 'Θ(n²)'], ['Via FFT', 'Θ(n lg n)']],
  props: ['Divide and conquer', 'Roots of unity'],
  tags: 'fft fast fourier transform polynomial multiplication convolution roots of unity',
  learn: `
<p>Multiplying two polynomials of degree <i>n</i> − 1 coefficient by coefficient takes Θ(<i>n</i>²) time. The Fast Fourier Transform does it in Θ(<i>n</i> lg <i>n</i>), and the same idea multiplies huge integers, filters audio and compresses images.</p>
<h3>Two representations</h3>
<p>A polynomial can be stored as its <b>coefficients</b>, or as its <b>values</b> at <i>n</i> distinct points (point-value form). In point-value form, multiplication is trivial: multiply the values pointwise, in Θ(<i>n</i>) (using 2<i>n</i> points, since the product has degree up to 2<i>n</i> − 2). So the plan is: evaluate, multiply pointwise, interpolate back.</p>
<h3>Evaluating fast: the FFT</h3>
<p>Evaluating at <i>n</i> arbitrary points costs Θ(<i>n</i>²). The trick is to choose the <i>n</i>-th <b>complex roots of unity</b>, ω<sup><i>k</i></sup> with ω = <i>e</i><sup>2π<i>i</i>/<i>n</i></sup>. Split <i>A</i>(<i>x</i>) into even and odd coefficients:</p>
<div class="formula">A(x) = A<sub>even</sub>(x²) + x · A<sub>odd</sub>(x²)</div>
<p>Squaring the <i>n</i>-th roots of unity gives the (<i>n</i>/2)-th roots of unity, each twice (the halving lemma). So evaluating <i>A</i> at <i>n</i> points needs two evaluations of half-size polynomials at <i>n</i>/2 points, plus Θ(<i>n</i>) combining work: <i>T</i>(<i>n</i>) = 2<i>T</i>(<i>n</i>/2) + Θ(<i>n</i>) = Θ(<i>n</i> lg <i>n</i>).</p>
<p>Interpolation is the same transform with ω<sup>−1</sup> and a division by <i>n</i>, so it is also Θ(<i>n</i> lg <i>n</i>). Section 30.3 gives an iterative, in-place version using bit-reversal permutation, which is what libraries implement.</p>
<h3>In practice</h3>
<p>Convolution problems (counting pair sums, string matching with wildcards) become FFT problems. For exact integer results, use the number-theoretic transform modulo a prime such as 998244353, which avoids floating-point error.</p>`,
  code: {
    pseudo: `recursiveFft(a)
  n ← len(a)                       // n is a power of 2
  if n = 1
      return a
  ω_n ← e^(2πi/n)
  ω ← 1
  y_even ← recursiveFft(a[0], a[2], ..., a[n-2])
  y_odd ← recursiveFft(a[1], a[3], ..., a[n-1])
  for k ← 0 to n/2 - 1
      y[k] ← y_even[k] + ω · y_odd[k]
      y[k + n/2] ← y_even[k] - ω · y_odd[k]
      ω ← ω · ω_n
  return y`,
    py: `import cmath

def fft(a, invert=False):
    n = len(a)
    if n == 1:
        return a[:]
    even, odd = fft(a[0::2], invert), fft(a[1::2], invert)
    sign = -1 if invert else 1
    out = [0] * n
    for k in range(n // 2):
        w = cmath.exp(sign * 2j * cmath.pi * k / n)
        out[k] = even[k] + w * odd[k]
        out[k + n // 2] = even[k] - w * odd[k]
    return out

def multiply(p, q):
    n = 1
    while n < len(p) + len(q) - 1:
        n *= 2
    fp, fq = fft(p + [0] * (n - len(p))), fft(q + [0] * (n - len(q)))
    prod = fft([x * y for x, y in zip(fp, fq)], invert=True)
    return [round(v.real / n) for v in prod][: len(p) + len(q) - 1]

print(multiply([1, 2, 3], [4, 5]))   # [4, 13, 22, 15]`,
    cpp: `#include <complex>
#include <vector>
#include <cmath>
using namespace std;
typedef complex<double> cd;

void fft(vector<cd>& a, bool invert) {           // iterative, in place
    int n = a.size();
    for (int i = 1, j = 0; i < n; i++) {           // bit-reversal permutation
        int bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) swap(a[i], a[j]);
    }
    for (int len = 2; len <= n; len <<= 1) {
        double ang = 2 * M_PI / len * (invert ? -1 : 1);
        cd wl(cos(ang), sin(ang));
        for (int i = 0; i < n; i += len) {
            cd w(1);
            for (int k = 0; k < len / 2; k++) {
                cd u = a[i + k], v = a[i + k + len / 2] * w;
                a[i + k] = u + v; a[i + k + len / 2] = u - v; w *= wl;
            }
        }
    }
    if (invert) for (cd& x : a) x /= n;
}`,
  },
  quiz: [
    { q: 'Why evaluate at complex roots of unity?', opts: ['They are real numbers', 'Squaring them halves the number of distinct points, enabling divide and conquer', 'They avoid overflow', 'They are integers'], a: 1, why: 'The halving lemma gives T(n) = 2T(n/2) + Θ(n).' },
    { q: 'Multiplying two degree-(n−1) polynomials with the FFT takes…', opts: ['Θ(n)', 'Θ(n lg n)', 'Θ(n²)', 'Θ(n^1.58)'], a: 1, why: 'Two forward transforms, a pointwise product and one inverse transform.' },
    { q: 'In point-value form, multiplying two polynomials costs…', opts: ['Θ(n)', 'Θ(n²)', 'Θ(n lg n)', 'Θ(1)'], a: 0, why: 'Multiply matching values pointwise.' },
  ],
});

/* ---------------- linear programming ---------------- */
topic({
  id: 'linear-programming', title: 'Linear programming', sec: '§29.1–29.5', prereq: ['max-flow'],
  blurb: 'Optimize a linear objective subject to linear inequalities. Shortest paths and max flow are special cases.',
  cx: [['Simplex (typical)', 'fast in practice'], ['Ellipsoid, interior point', 'polynomial time']],
  props: ['Feasible region', 'Duality'],
  tags: 'linear programming simplex duality feasible region optimization',
  learn: `
<p>A <b>linear program</b> asks to maximize (or minimize) a linear function such as 3<i>x</i><sub>1</sub> + <i>x</i><sub>2</sub> subject to linear constraints like <i>x</i><sub>1</sub> + <i>x</i><sub>2</sub> ≤ 4, 2<i>x</i><sub>1</sub> − <i>x</i><sub>2</sub> ≤ 5, and <i>x</i> ≥ 0. The constraints carve out a convex <b>feasible region</b>, a polytope, and an optimum, when one exists, is always reached at a <b>vertex</b>.</p>
<h3>Forms</h3>
<p>The book works with <b>standard form</b> (maximize <i>c</i><sup>T</sup><i>x</i> subject to <i>Ax</i> ≤ <i>b</i>, <i>x</i> ≥ 0) and <b>slack form</b>, which adds one slack variable per constraint to turn inequalities into equalities. Any LP can be converted.</p>
<h3>The simplex algorithm</h3>
<p>Start at a vertex of the region. Repeatedly <b>pivot</b>: pick a variable whose increase improves the objective, raise it until some constraint becomes tight, and move to the neighbouring vertex. Stop when no improving direction remains; convexity guarantees that local optimum is global. Simplex is exponential in contrived worst cases but very fast in practice. Polynomial algorithms exist (ellipsoid, interior-point methods).</p>
<h3>Duality</h3>
<p>Every maximization LP has a <b>dual</b> minimization LP, and their optimal values are equal (strong duality). Any feasible dual solution is an upper bound on the primal, which is how optimality is certified. Max-flow min-cut is LP duality in disguise.</p>
<h3>Why it matters</h3>
<p>Shortest paths, maximum flow, minimum-cost flow and bipartite matching can all be written as linear programs, and LP relaxations underpin approximation algorithms (Section 35.4 rounds a vertex-cover LP to get a 2-approximation for the weighted version). In industry, LP and integer programming solvers schedule airlines, plan supply chains and allocate budgets.</p>`,
  quiz: [
    { q: 'Where does a linear program attain its optimum, if it has one?', opts: ['At the centre of the region', 'At a vertex of the feasible region', 'On the axes', 'Anywhere'], a: 1, why: 'A linear objective over a convex polytope is maximized at a vertex.' },
    { q: 'What does a simplex pivot do?', opts: ['Sorts the constraints', 'Moves from one vertex to an adjacent vertex with a better objective value', 'Removes a constraint', 'Doubles the variables'], a: 1, why: 'It swaps one basic and one non-basic variable.' },
    { q: 'Strong duality says the primal and dual optimal values are…', opts: ['always different', 'equal', 'opposite in sign', 'unrelated'], a: 1, why: 'Max-flow min-cut is one instance.' },
  ],
});

/* ---------------- multithreaded ---------------- */
topic({
  id: 'multithreaded', title: 'Multithreaded algorithms', sec: '§27.1–27.3', prereq: ['merge-sort', 'recurrences'],
  blurb: 'Measure parallel algorithms by work and span, and parallelize merge sort and matrix multiplication.',
  cx: [['Parallelism', 'work / span'], ['Greedy scheduler', 'T_P ≤ T₁/P + T∞']],
  props: ['spawn and sync', 'Work and span'],
  tags: 'parallel multithreaded work span spawn sync race condition',
  learn: `
<p>Chapter 27 adds three keywords to pseudocode: <b>spawn</b> (the call may run in parallel with the caller), <b>sync</b> (wait for all spawned children) and <b>parallel for</b>. A multithreaded computation is then a DAG of strands.</p>
<h3>Work and span</h3>
<ul><li><b>Work</b> <i>T</i><sub>1</sub>: total time on one processor, the number of strands.</li><li><b>Span</b> <i>T</i><sub>∞</sub>: the longest path in the DAG, the time with unlimited processors.</li><li><b>Parallelism</b> <i>T</i><sub>1</sub>/<i>T</i><sub>∞</sub>: the maximum useful number of processors.</li></ul>
<p>Two laws bound the running time <i>T<sub>P</sub></i> on <i>P</i> processors: <i>T<sub>P</sub></i> ≥ <i>T</i><sub>1</sub>/<i>P</i> (the work law) and <i>T<sub>P</sub></i> ≥ <i>T</i><sub>∞</sub> (the span law). A greedy scheduler achieves <i>T<sub>P</sub></i> ≤ <i>T</i><sub>1</sub>/<i>P</i> + <i>T</i><sub>∞</sub>, within a factor of 2 of optimal.</p>
<h3>Examples</h3>
<ul><li>Parallel Fibonacci: spawn fib(<i>n</i> − 1), compute fib(<i>n</i> − 2), sync. Work Θ(φ<sup><i>n</i></sup>), span Θ(<i>n</i>): enormous parallelism.</li><li>Merge sort with a serial merge has span Θ(<i>n</i>), so parallelism only Θ(lg <i>n</i>). A parallel merge (binary search for the split point) brings the span to Θ(lg<sup>3</sup> <i>n</i>).</li><li>Matrix multiplication with parallel loops: work Θ(<i>n</i><sup>3</sup>), span Θ(<i>n</i>) or less with divide and conquer.</li></ul>
<div class="note warn"><b>Determinacy races.</b> Two parallel strands that access the same memory, with at least one writing, can produce different answers on different runs. Every parallel algorithm in the chapter avoids them by giving strands disjoint data.</div>`,
  quiz: [
    { q: 'The span of a computation is…', opts: ['the total number of strands', 'the length of the longest path in its DAG', 'the number of processors', 'the memory used'], a: 1, why: 'It is the running time with infinitely many processors.' },
    { q: 'If work is 10⁶ and span is 10³, the parallelism is…', opts: ['10³', '10⁶', '10⁹', '1'], a: 0, why: 'Work divided by span.' },
    { q: 'A determinacy race happens when…', opts: ['two parallel strands touch the same memory and at least one writes', 'a thread finishes early', 'sync is called twice', 'work exceeds span'], a: 0, why: 'The result then depends on scheduling.' },
  ],
});

/* ---------------- matrix operations ---------------- */
topic({
  id: 'matrix-ops', title: 'Matrix operations', sec: '§4.2, §28.1–28.3', prereq: ['divide-conquer'],
  blurb: 'Strassen’s fast multiplication, and solving linear systems with LUP decomposition.',
  cx: [['Strassen', 'Θ(n^2.81)'], ['LUP decomposition', 'Θ(n³)'], ['Solve after LUP', 'Θ(n²)']],
  props: ['Divide and conquer', 'Pivoting'],
  tags: 'matrix multiplication strassen lup decomposition linear system gaussian elimination',
  learn: `
<h3>Strassen's algorithm</h3>
<p>Multiplying two <i>n</i> × <i>n</i> matrices by the definition takes Θ(<i>n</i><sup>3</sup>). Divide each matrix into four <i>n</i>/2 × <i>n</i>/2 blocks: the straightforward recursion needs 8 block products, <i>T</i>(<i>n</i>) = 8<i>T</i>(<i>n</i>/2) + Θ(<i>n</i><sup>2</sup>) = Θ(<i>n</i><sup>3</sup>). Strassen combines sums and differences of blocks so that only <b>7</b> products are needed, at the cost of 18 block additions. The recurrence becomes 7<i>T</i>(<i>n</i>/2) + Θ(<i>n</i><sup>2</sup>) = Θ(<i>n</i><sup>lg 7</sup>) ≈ Θ(<i>n</i><sup>2.81</sup>). It is used for very large matrices; below a crossover size the plain method is faster.</p>
<h3>Solving Ax = b with LUP decomposition</h3>
<p>Chapter 28 factors <i>A</i> as <i>PA</i> = <i>LU</i>: <i>L</i> is unit lower triangular, <i>U</i> upper triangular, and <i>P</i> a permutation that reorders rows. This is Gaussian elimination, recorded. Then solve <i>Ly</i> = <i>Pb</i> by <b>forward substitution</b> and <i>Ux</i> = <i>y</i> by <b>back substitution</b>, each Θ(<i>n</i><sup>2</sup>).</p>
<p>The factorization costs Θ(<i>n</i><sup>3</sup>) once; after that, each new right-hand side <i>b</i> costs only Θ(<i>n</i><sup>2</sup>). <b>Pivoting</b> (choosing the row with the largest entry in the current column) avoids dividing by zero and keeps rounding errors small.</p>
<h3>Related results</h3>
<ul><li>Inverting a matrix is no harder than multiplying matrices, and vice versa (Section 28.2).</li><li>Symmetric positive-definite matrices never need pivoting, and least-squares fitting reduces to solving the normal equations <i>A</i><sup>T</sup><i>Ax</i> = <i>A</i><sup>T</sup><i>y</i> (Section 28.3).</li></ul>`,
  quiz: [
    { q: 'How many block multiplications does Strassen use?', opts: ['8', '7', '6', '4'], a: 1, why: 'Seven, which changes the exponent from 3 to lg 7.' },
    { q: 'After computing PA = LU once, solving for a new b costs…', opts: ['Θ(n³)', 'Θ(n²)', 'Θ(n)', 'Θ(n lg n)'], a: 1, why: 'One forward and one back substitution.' },
    { q: 'Why pivot during LU decomposition?', opts: ['To sort rows', 'To avoid dividing by zero or tiny numbers that amplify rounding errors', 'To make the matrix symmetric', 'It is optional for speed'], a: 1, why: 'Partial pivoting picks the largest entry in the column.' },
  ],
});
