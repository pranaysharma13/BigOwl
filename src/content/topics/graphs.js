import { I, Rec, fmtV, h, pick, rnd } from '../../engine/helpers';
import { setPart, topic } from '../registry';
import { progress } from '../../features/progress/facade';

setPart('graph');
/* ---- graph helpers ---- */
export const COORDS = {
  bfs: { r: [0, 0], s: [130, 0], t: [260, 0], u: [390, 0], v: [0, 130], w: [130, 130], x: [260, 130], y: [390, 130] },
  dfs: { u: [0, 0], v: [140, 0], w: [280, 0], x: [0, 130], y: [140, 130], z: [280, 130] },
  scc: { a: [0, 0], b: [130, 0], c: [260, 0], d: [390, 0], e: [0, 130], f: [130, 130], g: [260, 130], h: [390, 130] },
  mst: { a: [0, 100], b: [90, 0], c: [220, 0], d: [350, 0], e: [440, 100], f: [350, 200], g: [220, 200], h: [90, 200], i: [155, 100] },
  sp: { s: [0, 100], t: [140, 0], x: [310, 0], y: [140, 200], z: [310, 200] },
  dag: { r: [0, 80], s: [110, 0], t: [220, 80], x: [330, 0], y: [440, 80], z: [550, 0] },
  fw: { 1: [0, 80], 2: [160, 0], 3: [320, 80], 4: [240, 200], 5: [80, 200] },
  flow: { s: [0, 100], v1: [140, 0], v2: [140, 200], v3: [310, 0], v4: [310, 200], t: [450, 100] },
  dress: { shorts: [0, 0], socks: [150, 0], shirt: [330, 0], watch: [480, 0], pants: [0, 110], shoes: [150, 110], tie: [400, 110], belt: [210, 210], jacket: [400, 220] },
  small: { A: [0, 80], B: [130, 0], C: [130, 160], D: [270, 0], E: [270, 160], F: [400, 80] },
};
export function parseGraph(s, { weighted = false, needSrc = false, maxN = 10 } = {}) {
  const [body, tail] = s.split('|');
  const toks = body.trim().split(/[\s,]+/).filter(Boolean);
  if (!toks.length) throw new Error('Enter edges such as a-b:4 (undirected) or a>b:4 (directed).');
  const nodes = [], edges = []; let directed = null;
  for (const t of toks) {
    const m = /^([A-Za-z0-9_]{1,7})([->])([A-Za-z0-9_]{1,7})(?::(-?\d+))?$/.exec(t);
    if (!m) throw new Error(`"${t}" should look like a-b${weighted ? ':4' : ''} or a>b${weighted ? ':4' : ''}.`);
    const d = m[2] === '>'; if (directed === null) directed = d; else if (directed !== d) throw new Error('Use either - (undirected) or > (directed) for every edge, not both.');
    if (weighted && m[4] == null) throw new Error(`Give "${t}" a weight, like ${m[1]}${m[2]}${m[3]}:4.`);
    for (const x of [m[1], m[3]]) if (!nodes.includes(x)) nodes.push(x);
    edges.push({ u: m[1], v: m[3], w: m[4] != null ? +m[4] : 1 });
  }
  if (nodes.length > maxN) throw new Error(`Use at most ${maxN} vertices so the picture stays readable.`);
  let src = tail ? tail.trim() : nodes[0];
  if (!nodes.includes(src)) throw new Error(`The source "${src}" is not a vertex of the graph.`);
  return { nodes, edges, directed, src };
}
export function placeNodes(nodes) {
  for (const k in COORDS) { const c = COORDS[k]; if (nodes.every(n => c[n])) return Object.fromEntries(nodes.map(n => [n, { x: c[n][0], y: c[n][1] }])); }
  const n = nodes.length, R = Math.max(110, n * 22);
  return Object.fromEntries(nodes.map((id, i) => [id, { x: Math.round(R + R * Math.cos(-Math.PI / 2 + 2 * Math.PI * i / n)), y: Math.round(R * .75 + R * .75 * Math.sin(-Math.PI / 2 + 2 * Math.PI * i / n)) }]));
}
export const ekey = (G, u, v) => G.directed ? u + '>' + v : [u, v].sort().join('-');
export function gview(G, P, { ncls = {}, note = {}, ecls = {}, elabel = {}, weights = true, noteBelow = false } = {}) {
  const long = G.nodes.some(n => String(n).length > 4);
  return { directed: G.directed, r: long ? 26 : 19, nodes: G.nodes.map(id => ({ id, x: P[id].x, y: P[id].y, cls: ncls[id], note: note[id], noteBelow })), edges: G.edges.map(e => ({ u: e.u, v: e.v, w: weights ? e.w : null, label: elabel[ekey(G, e.u, e.v)], cls: ecls[ekey(G, e.u, e.v)] })) };
}
export function adj(G) { const A = Object.fromEntries(G.nodes.map(n => [n, []])); for (const e of G.edges) { A[e.u].push({ v: e.v, w: e.w }); if (!G.directed) A[e.v].push({ v: e.u, w: e.w }); } return A; }
export const randGraph = (directed, weighted, n = rnd(5, 6), extra = rnd(2, 4), lo = 1, hi = 9) => {
  const names = 'ABCDEF'.slice(0, n).split(''); const E = new Set(), out = [];
  for (let i = 1; i < n; i++) { const p = names[rnd(0, i - 1)]; const [u, v] = directed && Math.random() < .5 ? [names[i], p] : [p, names[i]]; E.add(u + v); out.push(`${u}${directed ? '>' : '-'}${v}${weighted ? ':' + rnd(lo, hi) : ''}`); }
  for (let k = 0; k < extra; k++) { const u = pick(names), v = pick(names); if (u === v || E.has(u + v) || (!directed && E.has(v + u))) continue; E.add(u + v); out.push(`${u}${directed ? '>' : '-'}${v}${weighted ? ':' + rnd(lo, hi) : ''}`); }
  return out.join(' ');
};

/* ---------------- representations ---------------- */
topic({
  id: 'graph-rep', title: 'Graphs and their representations', sec: '§22.1, App. B.4', prereq: ['linked-lists', 'arrays'],
  blurb: 'Vertices and edges, stored as adjacency lists for sparse graphs or an adjacency matrix for dense ones.',
  cx: [['Adjacency list space', 'Θ(V + E)'], ['Matrix space', 'Θ(V²)'], ['Edge lookup (matrix)', 'O(1)']],
  props: ['Directed or undirected', 'Weighted or not'],
  tags: 'graph adjacency list matrix vertex edge directed undirected weighted sparse dense degree',
  learn: `
<p>A <b>graph</b> <i>G</i> = (<i>V</i>, <i>E</i>) is a set of vertices and a set of edges between them. In a <b>directed</b> graph each edge (<i>u</i>, <i>v</i>) goes from <i>u</i> to <i>v</i>; in an <b>undirected</b> graph it connects both ways. Edges may carry <b>weights</b> (distances, costs, capacities). The book writes |<i>V</i>| and |<i>E</i>| for the number of vertices and edges, and running times like O(<i>V</i> + <i>E</i>) use those counts.</p>
<h3>Two standard representations</h3>
<ul><li><b>Adjacency lists</b>: an array <i>Adj</i> of |<i>V</i>| lists; <i>Adj</i>[<i>u</i>] holds every vertex <i>v</i> with an edge (<i>u</i>, <i>v</i>). Space Θ(<i>V</i> + <i>E</i>). Iterating over a vertex's neighbours takes time proportional to its degree. Best for <b>sparse</b> graphs, where |<i>E</i>| is much less than |<i>V</i>|², which is most real graphs.</li><li><b>Adjacency matrix</b>: a |<i>V</i>| × |<i>V</i>| array with <i>a<sub>ij</sub></i> = 1 (or the weight) if (<i>i</i>, <i>j</i>) ∈ <i>E</i>. Space Θ(<i>V</i>²). Checking whether an edge exists is O(1). Best for <b>dense</b> graphs and for algorithms like <a href="/learn/floyd-warshall">Floyd–Warshall</a> that work on the matrix directly.</li></ul>
<p>For an undirected graph, each edge appears twice in the lists (once at each end) and the matrix is symmetric. The sum of all list lengths is |<i>E</i>| for a directed graph and 2|<i>E</i>| for an undirected one, which is the <b>handshaking lemma</b> in disguise: the degrees add up to 2|<i>E</i>|.</p>
<h3>Vocabulary you will need</h3>
<p>Path, cycle, connected component, degree (in-degree and out-degree for directed graphs), directed acyclic graph (DAG), tree (connected and acyclic, with |<i>V</i>| − 1 edges), bipartite, complete, sparse and dense. Appendix B.4 defines them all.</p>
<h3>In interviews</h3>
<ul><li>Most graph problems hand you an edge list; your first line of code builds an adjacency list (<code>defaultdict(list)</code> in Python, <code>vector&lt;vector&lt;int&gt;&gt;</code> in C++).</li><li>Grids are implicit graphs: each cell connects to its four neighbours. Number of Islands (LC 200) is a graph problem without any edge list.</li><li>Clone Graph (LC 133) tests that you can walk adjacency lists with a visited map.</li></ul>`,
  code: {
    pseudo: `buildAdjacency(V, E, directed)
  for each vertex u ∈ V
      Adj[u] ← empty list
  for each edge (u, v) ∈ E
      append v to Adj[u]
      if not directed
          append u to Adj[v]

buildMatrix(V, E, directed)
  allocate A[1..|V|, 1..|V|] of zeros
  for each edge (u, v) ∈ E
      A[u, v] ← 1
      if not directed
          A[v, u] ← 1`,
    py: `from collections import defaultdict

def build_graph(edges, directed=False):
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
        if not directed:
            adj[v].append(u)
    return adj

def grid_neighbors(grid, r, c):          # a grid is an implicit graph
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < len(grid) and 0 <= nc < len(grid[0]):
            yield nr, nc

edges = [('r', 's'), ('r', 'v'), ('s', 'w'), ('w', 't'), ('w', 'x')]
print(dict(build_graph(edges)))`,
    cpp: `#include <vector>
using namespace std;

// vertices numbered 0..n-1
vector<vector<int>> buildList(int n, const vector<pair<int, int>>& edges, bool directed) {
    vector<vector<int>> adj(n);
    for (auto [u, v] : edges) {
        adj[u].push_back(v);
        if (!directed) adj[v].push_back(u);
    }
    return adj;
}

vector<vector<int>> buildMatrix(int n, const vector<pair<int, int>>& edges, bool directed) {
    vector<vector<int>> a(n, vector<int>(n, 0));
    for (auto [u, v] : edges) { a[u][v] = 1; if (!directed) a[v][u] = 1; }
    return a;
}`,
  },
  viz: {
    inputHint: 'Edges: a-b (undirected) or a>b (directed)',
    presets: [
      { label: 'Figure 22.3 graph, undirected', input: 'r-s r-v s-w w-t w-x t-x t-u x-u x-y u-y', note: 'Each undirected edge appears in two adjacency lists, and the matrix is symmetric.' },
      { label: 'Figure 22.4 graph, directed', input: 'u>v u>x x>v v>y y>x w>y w>z z>z', note: 'Each directed edge appears once. Note the self-loop z → z.' },
    ],
    random: () => randGraph(Math.random() < .5, false),
    parse: s => parseGraph(s),
    run(G) {
      const R = Rec(), P = placeNodes(G.nodes), A = Object.fromEntries(G.nodes.map(n => [n, []])), idx = Object.fromEntries(G.nodes.map((n, i) => [n, i]));
      const M = G.nodes.map(() => G.nodes.map(() => 0));
      const st = (ecls = {}, mh = {}, bh = {}) => ({ graph: gview(G, P, { ecls }), buckets: { title: 'Adjacency lists', slots: G.nodes.map(n => ({ label: n, items: [...A[n]], hl: bh[n] || {} })) }, table: { title: 'Adjacency matrix', colH: G.nodes, rowH: G.nodes, cells: M.map(r => [...r]), hl: mh, name: 'm' }, order: ['graph', 'buckets', 'tables'] });
      R.add(st(), 1, `${G.directed ? 'Directed' : 'Undirected'} graph with ${G.nodes.length} vertices and ${G.edges.length} edges. Start with empty lists and a zero matrix.`);
      for (const e of G.edges) {
        A[e.u].push(e.v); M[idx[e.u]][idx[e.v]] = 1;
        const mh = { [idx[e.u] + ',' + idx[e.v]]: 'cur' }, bh = { [e.u]: { [A[e.u].length - 1]: 'cur' } };
        if (!G.directed && e.u !== e.v) { A[e.v].push(e.u); M[idx[e.v]][idx[e.u]] = 1; mh[idx[e.v] + ',' + idx[e.u]] = 'cur'; bh[e.v] = { [A[e.v].length - 1]: 'cur' }; }
        R.add(st({ [ekey(G, e.u, e.v)]: 'cur' }, mh, bh), G.directed ? 5 : 7, G.directed ? `Edge ${e.u} → ${e.v}: append ${e.v} to Adj[${e.u}], set A[${e.u}, ${e.v}] = 1.` : `Edge ${e.u} – ${e.v}: append to both lists and set both matrix cells.`, Math.random() < .4 ? { q: `Edge ${e.u}${G.directed ? ' → ' : ' – '}${e.v} is next. Click the adjacency list it is added to${G.directed ? '' : ' first'}.`, pick: 'b:' + idx[e.u] } : null);
      }
      const total = Object.values(A).reduce((s, l) => s + l.length, 0);
      R.add(st(), 1, `List entries: ${total} (${G.directed ? '= |E|' : '= 2|E|'}). Matrix cells: ${G.nodes.length ** 2}, of which ${M.flat().filter(Boolean).length} are 1.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'For a sparse graph with |E| ≈ |V|, which representation uses less space?', opts: ['Adjacency matrix', 'Adjacency lists', 'They are equal'], a: 1, why: 'Θ(V + E) versus Θ(V²).' },
    { q: 'In an undirected graph, the lengths of all adjacency lists sum to…', opts: ['|V|', '|E|', '2|E|', '|V|²'], a: 2, why: 'Each edge is stored at both endpoints.' },
    { q: 'Which question does an adjacency matrix answer in O(1)?', opts: ['List all neighbours of u', 'Is there an edge from u to v?', 'Is the graph connected?', 'What is the shortest path?'], a: 1, why: 'Just read A[u][v].' },
    { q: 'A tree with n vertices has how many edges?', opts: ['n', 'n − 1', '2n', 'n(n − 1)/2'], a: 1, why: 'Connected and acyclic means exactly n − 1 edges.' },
  ],
});

/* ---------------- BFS ---------------- */
topic({
  id: 'bfs', title: 'Breadth-first search', sec: '§22.2', prereq: ['graph-rep', 'stacks-queues'],
  blurb: 'Explore a graph in waves of increasing distance from a source, using a queue.',
  cx: [['Time', 'O(V + E)'], ['Space', 'O(V)']],
  props: ['Shortest paths, unweighted', 'Queue', 'BFS tree'],
  tags: 'bfs breadth first search queue shortest path unweighted level grid',
  learn: `
<p><b>Breadth-first search</b> explores a graph outward from a source <i>s</i>: first every vertex at distance 1, then every vertex at distance 2, and so on. It computes the distance <i>v.d</i> (fewest edges) from <i>s</i> to every reachable vertex and a <b>breadth-first tree</b> of parent pointers <i>v</i>.π that gives a shortest path to each.</p>
<h3>How it works</h3>
<p>The book colors vertices to track progress: <b>white</b> means undiscovered, <b>gray</b> means discovered but its neighbours not yet examined (it sits in the queue), <b>black</b> means finished. Start with <i>s</i> gray and <i>s.d</i> = 0 in a FIFO queue. Repeatedly dequeue a vertex <i>u</i>; for each white neighbour <i>v</i>, color it gray, set <i>v.d</i> = <i>u.d</i> + 1 and <i>v</i>.π = <i>u</i>, and enqueue it. Then color <i>u</i> black.</p>
<p>The queue is what makes it breadth first: vertices leave in the order they were discovered, so all distance-<i>k</i> vertices are processed before any distance-(<i>k</i> + 1) vertex. Theorem 22.5 proves that <i>v.d</i> equals the true shortest-path distance δ(<i>s</i>, <i>v</i>).</p>
<h3>Running time</h3>
<p>Each vertex is enqueued and dequeued at most once, and each adjacency list is scanned once, so BFS runs in O(<i>V</i> + <i>E</i>) with adjacency lists.</p>
<div class="note warn">BFS gives shortest paths only when every edge has the same cost. With weights, use <a href="/learn/dijkstra">Dijkstra</a>. With weights 0 and 1 only, a deque-based “0-1 BFS” works in O(<i>V</i> + <i>E</i>).</div>
<h3>In interviews</h3>
<ul><li><b>Shortest path in an unweighted graph or grid</b>: Shortest Path in Binary Matrix (LC 1091), Word Ladder (LC 127), Open the Lock (LC 752).</li><li><b>Multi-source BFS</b>: push every source at distance 0. Rotting Oranges (LC 994), 01 Matrix (LC 542), Walls and Gates (LC 286).</li><li><b>Level by level</b>: process the queue in batches of its current size, as in Binary Tree Level Order Traversal (LC 102).</li><li><b>Bipartite check</b> (LC 785): color by BFS level and look for an edge between same-colored vertices.</li><li>Mark vertices visited when you <b>enqueue</b> them, not when you dequeue, or the same vertex can enter the queue many times.</li></ul>`,
  code: {
    pseudo: `bfs(G, s)
  for each vertex u ∈ G.V - {s}
      u.color ← white
      u.d ← ∞
      u.π ← nil
  s.color ← gray
  s.d ← 0
  s.π ← nil
  Q ← ∅
  enqueue(Q, s)
  while Q ≠ ∅
      u ← dequeue(Q)
      for each v ∈ G.Adj[u]
          if v.color = white
              v.color ← gray
              v.d ← u.d + 1
              v.π ← u
              enqueue(Q, v)
      u.color ← black`,
    py: `from collections import deque

def bfs(adj, s):
    dist, parent = {s: 0}, {s: None}
    q = deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if v not in dist:            # mark when enqueued
                dist[v] = dist[u] + 1
                parent[v] = u
                q.append(v)
    return dist, parent

def oranges_rotting(grid):               # LeetCode 994, multi-source BFS
    R, C = len(grid), len(grid[0])
    q = deque((r, c) for r in range(R) for c in range(C) if grid[r][c] == 2)
    fresh = sum(row.count(1) for row in grid)
    minutes = 0
    while q and fresh:
        for _ in range(len(q)):           # one level = one minute
            r, c = q.popleft()
            for nr, nc in ((r+1, c), (r-1, c), (r, c+1), (r, c-1)):
                if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] == 1:
                    grid[nr][nc] = 2; fresh -= 1; q.append((nr, nc))
        minutes += 1
    return -1 if fresh else minutes`,
    cpp: `#include <vector>
#include <queue>
using namespace std;

vector<int> bfs(const vector<vector<int>>& adj, int s) {
    vector<int> dist(adj.size(), -1);
    queue<int> q; q.push(s); dist[s] = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u])
            if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
    }
    return dist;   // -1 means unreachable
}`,
  },
  viz: {
    inputHint: 'Edges, then | source. Example: a-b b-c a-d | a',
    presets: [
      { label: 'Figure 22.3', input: 'r-s r-v s-w w-t w-x t-x t-u x-u x-y u-y | s', note: 'The book’s example from source s. Distances 0 to 3.' },
      { label: 'Directed', input: 'A>B A>C B>D C>D D>E E>F C>F | A', note: 'F is reached through C at distance 2, not through the longer path.' },
    ],
    random: () => randGraph(false, false) + ' | A',
    parse: s => parseGraph(s),
    run(G) {
      const R = Rec(), P = placeNodes(G.nodes), A = adj(G), s = G.src;
      const color = Object.fromEntries(G.nodes.map(n => [n, 'white'])), d = Object.fromEntries(G.nodes.map(n => [n, Infinity])), pi = {};
      const st = (cur, ecur) => {
        const ncls = {}, note = {}, ecls = {};
        for (const n of G.nodes) { ncls[n] = color[n] === 'gray' ? 'gray' : color[n] === 'black' ? 'black' : undefined; note[n] = 'd=' + fmtV(d[n]); if (pi[n]) ecls[ekey(G, pi[n], n)] = 'tree'; }
        if (cur) ncls[cur] = 'cur'; if (ecur) ecls[ecur] = 'cmp';
        return { graph: gview(G, P, { ncls, note, ecls, weights: false }), arrays: [{ name: 'Q', label: 'Queue Q (front on the left)', a: q.length ? [...q] : [null], noIdx: true, small: true }] };
      };
      const q = [];
      color[s] = 'gray'; d[s] = 0; q.push(s);
      R.add(st(), 10, `Source ${s}: color it gray, d = 0, and enqueue it. Every other vertex is white with d = ∞.`);
      let first = true;
      while (q.length) {
        const u = q.shift();
        R.add(st(u), 12, `Dequeue ${u} (d = ${d[u]}). Scan its neighbours.`, first ? null : { q: 'Which vertex is dequeued next? Click it.', pick: 'n:' + u, hint: 'The front of the queue.' });
        first = false;
        for (const { v } of A[u]) {
          if (color[v] === 'white') {
            color[v] = 'gray'; d[v] = d[u] + 1; pi[v] = u; q.push(v);
            R.add(st(u, ekey(G, u, v)), 15, `${v} is white: color it gray, d[${v}] = ${d[v]}, π[${v}] = ${u}, enqueue.`, Math.random() < .3 ? { q: `${v} is discovered from ${u}. What is d[${v}]?`, value: d[v] } : null);
          }
        }
        color[u] = 'black';
        R.add(st(), 19, `${u} is finished: color it black.`);
      }
      R.add(st(), 11, `Queue empty. Red edges form the breadth-first tree; each d is a shortest-path distance from ${s}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'BFS runs in O(V + E) because…', opts: ['each vertex and each adjacency list is processed at most once', 'it uses a heap', 'it visits vertices in sorted order', 'it stops at the first target'], a: 0, why: 'Enqueue/dequeue at most once per vertex, and each list is scanned once.' },
    { q: 'What does the gray color mean in the book’s BFS?', opts: ['Never seen', 'Discovered, in the queue, neighbours not yet scanned', 'Finished', 'Unreachable'], a: 1, why: 'Gray vertices form the frontier.' },
    { q: 'Why mark a vertex visited when it is enqueued rather than when it is dequeued?', opts: ['It is faster to read', 'Otherwise it can be enqueued many times by different neighbours', 'The book requires it', 'It finds longer paths'], a: 1, why: 'Late marking can blow up the queue and the running time.' },
    { q: 'Rotting Oranges is best solved with…', opts: ['DFS from each orange', 'multi-source BFS starting from all rotten oranges at once', 'Dijkstra', 'sorting'], a: 1, why: 'Each BFS level is one minute of spreading.' },
    { q: 'BFS finds shortest paths in…', opts: ['any weighted graph', 'graphs where every edge has the same weight', 'only trees', 'only DAGs'], a: 1, why: 'It counts edges. Weights need Dijkstra or Bellman-Ford.' },
  ],
});

/* ---------------- DFS ---------------- */
topic({
  id: 'dfs', title: 'Depth-first search', sec: '§22.3', prereq: ['graph-rep'],
  blurb: 'Go as deep as possible before backing up. Discovery and finishing times reveal the graph’s structure.',
  cx: [['Time', 'Θ(V + E)'], ['Space', 'O(V) recursion']],
  props: ['Discovery and finish times', 'Edge classification', 'Parenthesis theorem'],
  tags: 'dfs depth first search recursion stack discovery finish time back edge cycle',
  learn: `
<p><b>Depth-first search</b> explores edges out of the most recently discovered vertex that still has unexplored edges. When a vertex has none left, the search backtracks to the vertex it came from. Unlike BFS, the book's DFS restarts from every still-white vertex, so it produces a <b>depth-first forest</b> covering the whole graph.</p>
<h3>Timestamps</h3>
<p>DFS keeps a global clock and stamps each vertex twice: <i>v.d</i> when it is <b>discovered</b> (turns gray) and <i>v.f</i> when it is <b>finished</b> (turns black, all its edges explored). These numbers carry a lot of information:</p>
<ul><li><b>Parenthesis theorem.</b> For any two vertices, their intervals [<i>d</i>, <i>f</i>] are either disjoint or one contains the other. Write “(<i>u</i>” at discovery and “<i>u</i>)” at finish and the result is a properly nested expression.</li><li><b>White-path theorem.</b> <i>v</i> becomes a descendant of <i>u</i> exactly when, at the time <i>u</i> is discovered, there is a path from <i>u</i> to <i>v</i> of white vertices.</li></ul>
<h3>Classifying edges</h3>
<p>When DFS explores edge (<i>u</i>, <i>v</i>), the color of <i>v</i> tells you what kind of edge it is:</p>
<table><tr><th><i>v</i> is</th><th>Edge type</th><th>Meaning</th></tr><tr><td>white</td><td>tree</td><td>DFS goes to <i>v</i> next</td></tr><tr><td>gray</td><td>back</td><td><i>v</i> is an ancestor still on the stack: <b>a cycle</b></td></tr><tr><td>black, <i>u.d</i> &lt; <i>v.d</i></td><td>forward</td><td><i>v</i> is an already finished descendant</td></tr><tr><td>black, <i>u.d</i> &gt; <i>v.d</i></td><td>cross</td><td>anything else</td></tr></table>
<div class="note key">A directed graph has a cycle exactly when DFS finds a <b>back edge</b> (Lemma 22.11). In an undirected graph, every edge is a tree edge or a back edge.</div>
<h3>Running time</h3>
<p>Θ(<i>V</i> + <i>E</i>): each vertex is visited once and each adjacency list scanned once.</p>
<h3>In interviews</h3>
<ul><li><b>Connected components / flood fill</b>: Number of Islands (LC 200), Max Area of Island (LC 695), Surrounded Regions (LC 130).</li><li><b>Cycle detection</b> in directed graphs with three colors: Course Schedule (LC 207).</li><li><b>Topological sort</b> by finishing time (next topic), and strongly connected components.</li><li>Recursion depth can hit Python's limit on large graphs: raise it or use an explicit stack.</li></ul>`,
  code: {
    pseudo: `dfs(G)
  for each vertex u ∈ G.V
      u.color ← white
      u.π ← nil
  time ← 0
  for each vertex u ∈ G.V
      if u.color = white
          dfsVisit(G, u)

dfsVisit(G, u)
  time ← time + 1               // discover u
  u.d ← time
  u.color ← gray
  for each v ∈ G.Adj[u]         // look along edge (u, v)
      if v.color = white
          v.π ← u
          dfsVisit(G, v)
  u.color ← black               // u is finished
  time ← time + 1
  u.f ← time`,
    py: `def dfs(adj, vertices):
    color = {u: 'white' for u in vertices}
    d, f, time = {}, {}, [0]
    has_cycle = [False]
    def visit(u):
        time[0] += 1; d[u] = time[0]; color[u] = 'gray'
        for v in adj[u]:
            if color[v] == 'white':
                visit(v)
            elif color[v] == 'gray':
                has_cycle[0] = True          # back edge
        color[u] = 'black'
        time[0] += 1; f[u] = time[0]
    for u in vertices:
        if color[u] == 'white':
            visit(u)
    return d, f, has_cycle[0]

def num_islands(grid):                       # LeetCode 200
    R, C = len(grid), len(grid[0])
    def sink(r, c):
        if 0 <= r < R and 0 <= c < C and grid[r][c] == '1':
            grid[r][c] = '0'
            sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1)
    count = 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] == '1':
                count += 1; sink(r, c)
    return count`,
    cpp: `#include <vector>
using namespace std;

struct DFS {
    const vector<vector<int>>& adj;
    vector<int> color, d, f; int time = 0; bool cycle = false;
    DFS(const vector<vector<int>>& a) : adj(a), color(a.size(), 0), d(a.size()), f(a.size()) {
        for (int u = 0; u < (int)a.size(); u++) if (color[u] == 0) visit(u);
    }
    void visit(int u) {
        d[u] = ++time; color[u] = 1;              // gray
        for (int v : adj[u]) {
            if (color[v] == 0) visit(v);
            else if (color[v] == 1) cycle = true;  // back edge
        }
        color[u] = 2; f[u] = ++time;              // black
    }
};`,
  },
  viz: {
    inputHint: 'Directed edges, e.g. u>v u>x x>v',
    presets: [
      { label: 'Figure 22.4', input: 'u>v u>x x>v v>y y>x w>y w>z z>z', note: 'The book’s example. Notes show d/f; dashed purple edges are back edges.' },
      { label: 'Acyclic', input: 'A>B A>C B>D C>D D>E', note: 'No back edges, so the graph is a DAG.' },
    ],
    random: () => randGraph(true, false),
    parse: s => { const G = parseGraph(s); if (!G.directed) G.directed = false; return G; },
    run(G) {
      const R = Rec(), P = placeNodes(G.nodes), A = adj(G);
      const color = Object.fromEntries(G.nodes.map(n => [n, 'white'])), d = {}, f = {}, ecls = {}; let time = 0;
      const typeCount = { tree: 0, back: 0, forward: 0, cross: 0 };
      const st = (cur, ecur) => {
        const ncls = {}, note = {};
        for (const n of G.nodes) { ncls[n] = color[n] === 'gray' ? 'gray' : color[n] === 'black' ? 'black' : undefined; note[n] = d[n] ? `${d[n]}/${f[n] || ''}` : ''; }
        if (cur) ncls[cur] = 'cur';
        return { graph: gview(G, P, { ncls, note, ecls: { ...ecls, ...(ecur ? { [ecur]: 'cmp' } : {}) }, weights: false }), vars: { time } };
      };
      R.add(st(), 5, 'All vertices white, time = 0. Notes will show discovery/finish times.');
      const nextWhite = () => G.nodes.find(n => color[n] === 'white');
      function visit(u) {
        time++; d[u] = time; color[u] = 'gray';
        R.add(st(u), 12, `Discover ${u} at time ${time}: color it gray.`);
        for (const { v } of A[u]) {
          const k = ekey(G, u, v);
          if (color[v] === 'white') {
            ecls[k] = 'tree'; typeCount.tree++;
            R.add(st(u, k), 15, `Edge (${u}, ${v}): ${v} is white, a tree edge. Go deeper.`, Math.random() < .5 ? { q: `Exploring (${u}, ${v}). What kind of edge is it?`, choices: ['Tree', 'Back', 'Forward', 'Cross'], answer: 0, hint: `${v} is white.` } : null);
            visit(v);
          } else {
            const typ = color[v] === 'gray' ? 'back' : d[u] < d[v] ? 'forward' : 'cross';
            if (!G.directed && typ !== 'back') continue;
            if (!G.directed && ecls[k]) continue;
            ecls[k] = typ === 'back' ? 'back' : 'dim'; typeCount[typ]++;
            R.add(st(u, null), 14, `Edge (${u}, ${v}): ${v} is ${color[v]}, so this is a ${typ} edge${typ === 'back' ? ', which means a cycle' : ''}.`, { q: `Exploring (${u}, ${v}) where ${v} is ${color[v]}. What kind of edge is it?`, choices: ['Tree', 'Back', 'Forward', 'Cross'], answer: { back: 1, forward: 2, cross: 3 }[typ], hint: color[v] === 'gray' ? 'Gray means it is an ancestor still being explored.' : `Compare d[${u}] = ${d[u]} with d[${v}] = ${d[v]}.` });
          }
        }
        color[u] = 'black'; time++; f[u] = time;
        R.add(st(), 17, `${u} has no unexplored edges: finish it at time ${time}.`);
      }
      let u; let first = true;
      while ((u = nextWhite())) { if (!first) R.add(st(), 8, `${u} is still white: start a new tree of the forest from ${u}.`); first = false; visit(u); }
      R.add(st(), 7, `Done. ${typeCount.tree} tree, ${typeCount.back} back, ${typeCount.forward} forward, ${typeCount.cross} cross edge${typeCount.cross === 1 ? '' : 's'}. ${typeCount.back ? 'A back edge means the graph has a cycle.' : 'No back edges: the graph is acyclic.'}`);
      return R.f;
    },
  },
  quiz: [
    { q: 'During DFS, an edge (u, v) to a gray vertex v is a…', opts: ['tree edge', 'back edge', 'forward edge', 'cross edge'], a: 1, why: 'Gray vertices are ancestors on the current recursion path.' },
    { q: 'A directed graph is acyclic if and only if DFS finds no…', opts: ['tree edges', 'back edges', 'cross edges', 'forward edges'], a: 1, why: 'Lemma 22.11.' },
    { q: 'If u.d < v.d < v.f < u.f, then…', opts: ['v is a descendant of u', 'u is a descendant of v', 'they are unrelated', 'the graph has a cycle'], a: 0, why: 'v’s interval nests inside u’s: parenthesis theorem.' },
    { q: 'Course Schedule (LC 207) asks whether all courses can be finished. That is…', opts: ['a shortest-path problem', 'cycle detection in a directed graph', 'a matching problem', 'an MST problem'], a: 1, why: 'Prerequisites must form a DAG.' },
  ],
});

/* ---------------- topological sort ---------------- */
topic({
  id: 'topo-sort', title: 'Topological sort', sec: '§22.4', prereq: ['dfs'],
  blurb: 'Order the vertices of a DAG so every edge points forward, by finishing time or by peeling off in-degree-zero vertices.',
  cx: [['DFS method', 'Θ(V + E)'], ['Kahn’s method', 'Θ(V + E)']],
  props: ['DAG only', 'Many valid orders'],
  tags: 'topological sort dag kahn indegree course schedule dependency order',
  learn: `
<p>A <b>topological sort</b> of a directed acyclic graph (DAG) is a linear ordering of its vertices such that for every edge (<i>u</i>, <i>v</i>), <i>u</i> comes before <i>v</i>. It is how you schedule tasks with dependencies: build steps, course prerequisites, spreadsheet formulas. A graph with a cycle has no topological order.</p>
<p>The book's example is Professor Bumstead getting dressed: undershorts before pants, pants before shoes, socks before shoes, shirt before tie, and so on.</p>
<h3>Method 1: DFS finishing times (the book's)</h3>
<p>Run DFS. Each time a vertex finishes, insert it at the <b>front</b> of a list. The list ends up sorted by decreasing finishing time, which is a topological order: Theorem 22.12 shows that for every edge (<i>u</i>, <i>v</i>) in a DAG, <i>v.f</i> &lt; <i>u.f</i>. Time Θ(<i>V</i> + <i>E</i>).</p>
<h3>Method 2: Kahn's algorithm (repeatedly remove sources)</h3>
<p>Compute every vertex's in-degree. Put all vertices with in-degree 0 in a queue. Repeatedly remove one, append it to the output, and decrement the in-degree of its out-neighbours, enqueuing any that drop to 0. If the output has fewer than |<i>V</i>| vertices, the leftover vertices lie on a cycle. Also Θ(<i>V</i> + <i>E</i>), and it detects cycles for free.</p>
<div class="note">Interviewers usually expect Kahn's algorithm because it is iterative and reports cycles naturally. Both are correct; the visualizer shows both.</div>
<h3>In interviews</h3>
<ul><li>Course Schedule I and II (LC 207, 210).</li><li>Alien Dictionary (LC 269): build edges from adjacent words, then topologically sort letters.</li><li>Parallel Courses (LC 1136) and Minimum Height Trees (LC 310) peel layers the same way.</li><li>Longest path in a DAG: relax edges in topological order (see <a href="/learn/dag-sp">DAG shortest paths</a>).</li></ul>`,
  code: {
    pseudo: `topologicalSort(G)
  run dfs(G), noting each finish time v.f
  whenever a vertex finishes, push it on the front of list L
  return L

kahn(G)
  compute inDegree[v] for every vertex v
  Q ← all vertices with inDegree 0
  L ← empty list
  while Q ≠ ∅
      u ← dequeue(Q)
      append u to L
      for each v ∈ G.Adj[u]
          inDegree[v] ← inDegree[v] - 1
          if inDegree[v] = 0
              enqueue(Q, v)
  if |L| < |G.V|
      error "graph has a cycle"
  return L`,
    py: `from collections import deque, defaultdict

def topo_kahn(n, edges):                 # LeetCode 210
    adj, indeg = defaultdict(list), [0] * n
    for u, v in edges:
        adj[u].append(v); indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []   # [] means a cycle

def topo_dfs(vertices, adj):
    seen, out = set(), []
    def visit(u):
        seen.add(u)
        for v in adj[u]:
            if v not in seen:
                visit(v)
        out.append(u)                    # finished
    for u in vertices:
        if u not in seen:
            visit(u)
    return out[::-1]                     # decreasing finish time`,
    cpp: `#include <vector>
#include <queue>
using namespace std;

vector<int> topoSort(int n, const vector<pair<int, int>>& edges) {   // Kahn
    vector<vector<int>> adj(n); vector<int> indeg(n, 0), order;
    for (auto [u, v] : edges) { adj[u].push_back(v); indeg[v]++; }
    queue<int> q;
    for (int i = 0; i < n; i++) if (indeg[i] == 0) q.push(i);
    while (!q.empty()) {
        int u = q.front(); q.pop(); order.push_back(u);
        for (int v : adj[u]) if (--indeg[v] == 0) q.push(v);
    }
    if ((int)order.size() < n) order.clear();   // cycle
    return order;
}`,
  },
  viz: {
    inputHint: 'dfs: edges   or   kahn: edges (directed)',
    presets: [
      { label: 'Getting dressed, DFS (Figure 22.7)', input: 'dfs: shorts>pants shorts>shoes pants>belt pants>shoes belt>jacket shirt>belt shirt>tie tie>jacket socks>shoes watch>watch', note: 'Vertices go onto the front of the list as they finish. (watch>watch stands in for an isolated vertex; remove it to see the order without the watch.)' },
      { label: 'Getting dressed, Kahn', input: 'kahn: shorts>pants shorts>shoes pants>belt pants>shoes belt>jacket shirt>belt shirt>tie tie>jacket socks>shoes', note: 'Repeatedly take a vertex with no remaining prerequisites.' },
      { label: 'Kahn with a cycle', input: 'kahn: A>B B>C C>A C>D', note: 'A, B and C never reach in-degree 0, so no order exists.' },
    ],
    random: () => pick(['dfs: ', 'kahn: ']) + (() => { const n = rnd(5, 6), names = 'ABCDEF'.slice(0, n).split(''), out = new Set(); for (let k = 0; k < n + 2; k++) { const i = rnd(0, n - 2), j = rnd(i + 1, n - 1); out.add(names[i] + '>' + names[j]); } return [...out].join(' '); })(),
    parse: s => { const m = /^\s*(dfs|kahn)\s*:(.*)$/i.exec(s); if (!m) throw new Error('Start with "dfs:" or "kahn:".'); const G = parseGraph(m[2]); if (!G.directed) throw new Error('Topological sort needs directed edges, written a>b.'); G.mode = m[1].toLowerCase(); return G; },
    run(G) {
      const R = Rec(), P = placeNodes(G.nodes), A = adj(G);
      const realEdges = G.edges.filter(e => e.u !== e.v);
      const Gv = { ...G, edges: realEdges };
      if (G.mode === 'dfs') {
        const color = {}, f = {}, list = []; let time = 0;
        const st = cur => { const ncls = {}, note = {}; for (const n of G.nodes) { ncls[n] = color[n] === 'gray' ? 'gray' : color[n] === 'black' ? 'black' : undefined; note[n] = f[n] ? 'f=' + f[n] : ''; } if (cur) ncls[cur] = 'cur'; return { graph: gview(Gv, P, { ncls, note, weights: false }), arrays: [{ name: 'L', label: 'Linked list (front on the left)', a: list.length ? [...list] : [null], noIdx: true, small: true }] }; };
        R.add(st(), 2, 'Run DFS. When a vertex finishes, put it at the front of the list.');
        const visit = u => { color[u] = 'gray'; time++; for (const { v } of A[u]) if (v !== u && !color[v]) visit(v); color[u] = 'black'; time++; f[u] = time; const predicted = u; R.add(st(u), 3, `${u} finishes at time ${time}. Insert it at the front.`, Math.random() < .5 ? { q: 'Which vertex finishes next? Click it.', pick: 'n:' + predicted, hint: 'The deepest gray vertex with nothing left to explore.' } : null); list.unshift(u); R.add(st(), 3, `List: ${list.join(', ')}.`); };
        for (const u of G.nodes) if (!color[u]) visit(u);
        R.add(st(), 4, `Topological order: ${list.join(' → ')}. Every edge points left to right.`);
      } else {
        const indeg = Object.fromEntries(G.nodes.map(n => [n, 0])); for (const e of G.edges) indeg[e.v]++;
        const q = G.nodes.filter(n => indeg[n] === 0), out = [], done = new Set();
        const st = cur => { const ncls = {}, note = {}; for (const n of G.nodes) { note[n] = 'in=' + indeg[n]; if (done.has(n)) ncls[n] = 'black'; else if (q.includes(n)) ncls[n] = 'gray'; } if (cur) ncls[cur] = 'cur'; const ecls = {}; for (const e of G.edges) if (done.has(e.u)) ecls[ekey(G, e.u, e.v)] = 'dim'; return { graph: gview(G, P, { ncls, note, ecls, weights: false }), arrays: [{ name: 'Q', label: 'Queue of in-degree-0 vertices', a: q.length ? [...q] : [null], noIdx: true, small: true }, { name: 'L', label: 'Output order', a: out.length ? [...out] : [null], noIdx: true, small: true }] }; };
        R.add(st(), 3, `In-degrees computed. Start with the sources: ${q.join(', ') || 'none'}.`);
        while (q.length) {
          const u = q.shift(); out.push(u); done.add(u);
          R.add(st(u), 7, `Remove ${u} and append it to the order.`, out.length > 1 ? { q: 'Which vertex is removed next? Click it.', pick: 'n:' + u, hint: 'The front of the queue.' } : null);
          for (const { v } of A[u]) { indeg[v]--; if (indeg[v] === 0) { q.push(v); R.add(st(u), 11, `In-degree of ${v} drops to 0: enqueue it.`); } }
        }
        if (out.length < G.nodes.length) R.add(st(), 13, `Only ${out.length} of ${G.nodes.length} vertices were output. The rest (${G.nodes.filter(n => !done.has(n)).join(', ')}) lie on a cycle: no topological order exists.`);
        else R.add(st(), 14, `Topological order: ${out.join(' → ')}.`);
      }
      return R.f;
    },
  },
  quiz: [
    { q: 'In the DFS method, vertices are listed in order of…', opts: ['increasing discovery time', 'decreasing finishing time', 'increasing finishing time', 'in-degree'], a: 1, why: 'For every edge (u, v) in a DAG, v finishes before u.' },
    { q: 'How does Kahn’s algorithm detect a cycle?', opts: ['A back edge appears', 'Fewer than |V| vertices are output', 'The queue overflows', 'It cannot'], a: 1, why: 'Vertices on a cycle never reach in-degree 0.' },
    { q: 'How many topological orders can a DAG have?', opts: ['Exactly one', 'At least one, possibly many', 'Zero', 'Always |V|!'], a: 1, why: 'Unrelated vertices can appear in either order.' },
    { q: 'Alien Dictionary (LC 269) uses topological sort on…', opts: ['the words', 'letters, with edges from the first differing characters of adjacent words', 'word lengths', 'positions'], a: 1, why: 'Each adjacent pair of sorted words gives one ordering constraint.' },
  ],
});

/* ---------------- SCC ---------------- */
topic({
  id: 'scc', title: 'Strongly connected components', sec: '§22.5', prereq: ['dfs'],
  blurb: 'Split a directed graph into maximal groups of mutually reachable vertices with two passes of DFS.',
  cx: [['Kosaraju (the book’s)', 'Θ(V + E)'], ['Tarjan', 'Θ(V + E), one pass']],
  props: ['Transpose graph', 'Component DAG'],
  tags: 'strongly connected components scc kosaraju tarjan transpose',
  learn: `
<p>Two vertices of a directed graph are <b>strongly connected</b> if each can reach the other. This is an equivalence relation, so it splits the vertices into <b>strongly connected components</b> (SCCs). Shrinking each component to a single vertex gives the <b>component graph</b>, which is always a DAG.</p>
<h3>The algorithm (Kosaraju's)</h3>
<ol><li>Run DFS on <i>G</i> to compute finishing times <i>u.f</i>.</li><li>Compute the <b>transpose</b> <i>G</i><sup>T</sup>, with every edge reversed. <i>G</i> and <i>G</i><sup>T</sup> have exactly the same SCCs.</li><li>Run DFS on <i>G</i><sup>T</sup>, but in the main loop consider vertices in order of <b>decreasing</b> <i>u.f</i> from step 1.</li><li>Each tree of the second depth-first forest is one SCC.</li></ol>
<h3>Why it works</h3>
<p>The vertex with the largest finishing time lies in a component <i>C</i> that is a <b>source</b> of the component DAG (Lemma 22.14: if there is an edge from component <i>C</i> to <i>C'</i>, the latest finish in <i>C</i> beats the latest in <i>C'</i>). In the transpose, that source becomes a sink: no edges leave <i>C</i>. So the second DFS started there explores exactly <i>C</i> and stops. Removing <i>C</i> and repeating peels off components one at a time.</p>
<p>Two DFS passes and a transpose: Θ(<i>V</i> + <i>E</i>). Tarjan's algorithm finds the same components in one DFS using low-link values, also linear.</p>
<h3>In interviews</h3>
<ul><li>Critical Connections in a Network (LC 1192) uses Tarjan-style low-link values (bridges in undirected graphs).</li><li>2-SAT is solved with SCCs on an implication graph.</li><li>“Can every node reach every other?” is a single-SCC check: one DFS from any vertex in <i>G</i> and one in <i>G</i><sup>T</sup>.</li></ul>`,
  code: {
    pseudo: `stronglyConnectedComponents(G)
  run dfs(G), noting each finish time u.f
  build G^T, the graph with every edge reversed
  run dfs(G^T), starting each new tree at the unvisited
      vertex whose finish time from line 2 is largest
  each tree of this second forest is one strongly
      connected component: output its vertices`,
    py: `from collections import defaultdict

def kosaraju(vertices, edges):
    g, gt = defaultdict(list), defaultdict(list)
    for u, v in edges:
        g[u].append(v); gt[v].append(u)
    seen, order = set(), []
    def dfs1(u):
        seen.add(u)
        for v in g[u]:
            if v not in seen: dfs1(v)
        order.append(u)                  # by finishing time
    for u in vertices:
        if u not in seen: dfs1(u)
    seen.clear(); comps = []
    def dfs2(u, comp):
        seen.add(u); comp.append(u)
        for v in gt[u]:
            if v not in seen: dfs2(v, comp)
    for u in reversed(order):            # decreasing finish time
        if u not in seen:
            comp = []; dfs2(u, comp); comps.append(comp)
    return comps`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

struct Kosaraju {
    vector<vector<int>> g, gt; vector<bool> seen; vector<int> order, comp;
    Kosaraju(int n, const vector<pair<int,int>>& e) : g(n), gt(n), seen(n), comp(n) {
        for (auto [u, v] : e) { g[u].push_back(v); gt[v].push_back(u); }
        for (int u = 0; u < n; u++) if (!seen[u]) dfs1(u);
        fill(seen.begin(), seen.end(), false);
        int c = 0;
        for (int i = n - 1; i >= 0; i--) if (!seen[order[i]]) dfs2(order[i], c++);
    }
    void dfs1(int u) { seen[u] = true; for (int v : g[u]) if (!seen[v]) dfs1(v); order.push_back(u); }
    void dfs2(int u, int c) { seen[u] = true; comp[u] = c; for (int v : gt[u]) if (!seen[v]) dfs2(v, c); }
};`,
  },
  viz: {
    inputHint: 'Directed edges',
    presets: [{ label: 'Figure 22.9', input: 'a>b b>c b>e b>f c>d c>g d>c d>h e>a e>f f>g g>f g>h h>h', note: 'Four components: {a, b, e}, {c, d}, {f, g}, {h}.' }, { label: 'Two cycles joined', input: 'A>B B>C C>A C>D D>E E>F F>D', note: 'Two components connected by one edge.' }],
    random: () => randGraph(true, false, rnd(5, 6), rnd(3, 5)),
    parse: s => { const G = parseGraph(s); if (!G.directed) throw new Error('Use directed edges, written a>b.'); return G; },
    run(G) {
      const R = Rec(), P = placeNodes(G.nodes), A = adj(G);
      const seen = new Set(), f = {}, order = []; let time = 0;
      const COMP = ['ok', 'violet', 'gray', 'src'];
      const st = (ncls, note, gg = G, title) => ({ graph: { ...gview(gg, P, { ncls, note, weights: false }), title } });
      const visit = u => { seen.add(u); time++; for (const { v } of A[u]) if (!seen.has(v)) visit(v); time++; f[u] = time; order.push(u); };
      for (const u of G.nodes) if (!seen.has(u)) visit(u);
      R.add(st(Object.fromEntries(G.nodes.map(n => [n, 'black'])), Object.fromEntries(G.nodes.map(n => [n, 'f=' + f[n]])), G, 'G with finishing times'), 2, `Step 1: DFS on G gives finishing times. Largest first: ${[...order].reverse().join(', ')}.`);
      const GT = { ...G, edges: G.edges.map(e => ({ u: e.v, v: e.u, w: e.w })) };
      const AT = adj(GT);
      const comp = {}; let c = 0;
      const notes = Object.fromEntries(G.nodes.map(n => [n, 'f=' + f[n]]));
      const cls = () => Object.fromEntries(G.nodes.map(n => [n, comp[n] != null ? (comp[n] === c ? 'cur' : COMP[comp[n] % COMP.length]) : undefined]));
      R.add(st({}, notes, GT, 'Transpose Gᵀ'), 3, 'Step 2: reverse every edge to get Gᵀ. It has the same strongly connected components.');
      for (const u of [...order].reverse()) {
        if (comp[u] != null) continue;
        R.add(st({ ...cls(), [u]: 'cur' }, notes, GT, 'DFS on Gᵀ in decreasing f'), 4, `Start a DFS tree in Gᵀ at ${u}, the unvisited vertex with the largest finishing time (${f[u]}).`, { q: 'Which vertex starts the next DFS tree in Gᵀ? Click it.', pick: 'n:' + u, hint: 'The unassigned vertex with the largest f.' });
        const stack = [u]; comp[u] = c; const members = [u];
        while (stack.length) { const x = stack.pop(); for (const { v } of AT[x]) if (comp[v] == null) { comp[v] = c; members.push(v); stack.push(v); } }
        R.add(st(cls(), notes, GT, 'DFS on Gᵀ in decreasing f'), 5, `That tree reaches {${members.join(', ')}}: one strongly connected component.`);
        c++;
      }
      R.add(st(Object.fromEntries(G.nodes.map(n => [n, COMP[comp[n] % COMP.length]])), {}, G, 'Components of G'), 5, `${c} strongly connected component${c > 1 ? 's' : ''}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'Why does the second DFS run on the transpose graph?', opts: ['It is smaller', 'Reversing edges turns the first component (a source) into a sink, so the DFS cannot leak into other components', 'To compute finishing times', 'Transposes are faster to scan'], a: 1, why: 'Starting from the largest finish time in Gᵀ explores exactly one component.' },
    { q: 'The component graph of any directed graph is…', opts: ['a tree', 'a DAG', 'strongly connected', 'bipartite'], a: 1, why: 'A cycle among components would merge them into one.' },
    { q: 'Kosaraju’s algorithm runs in…', opts: ['Θ(V + E)', 'Θ(V log V)', 'Θ(VE)', 'Θ(V²)'], a: 0, why: 'Two DFS passes plus building the transpose.' },
  ],
});

/* ---------------- MST ---------------- */
topic({
  id: 'mst', title: 'Minimum spanning trees', sec: '§23.1–23.2', prereq: ['bfs', 'disjoint-sets', 'binary-heap'],
  blurb: 'Connect every vertex with the cheapest set of edges. Kruskal grows a forest; Prim grows one tree.',
  cx: [['Kruskal', 'O(E lg V)'], ['Prim with binary heap', 'O(E lg V)'], ['Prim with Fibonacci heap', 'O(E + V lg V)']],
  props: ['Greedy', 'Cut property'],
  tags: 'minimum spanning tree mst kruskal prim cut property union find greedy',
  learn: `
<p>Given a connected, undirected, weighted graph, a <b>spanning tree</b> is a subset of edges that connects every vertex with no cycles (|<i>V</i>| − 1 edges). A <b>minimum spanning tree</b> (MST) has the smallest total weight. Laying cable or pipe between sites at minimum cost is the classic application.</p>
<h3>The generic greedy method</h3>
<p>Both algorithms grow a set <i>A</i> that is always a subset of some MST, adding one <b>safe edge</b> at a time. Which edges are safe? A <b>cut</b> (<i>S</i>, <i>V</i> − <i>S</i>) splits the vertices in two; an edge <b>crosses</b> it if its endpoints are on different sides. Theorem 23.1 is the <b>cut property</b>:</p>
<div class="note key">If no edge of <i>A</i> crosses a cut, then a lightest edge crossing that cut is safe to add to <i>A</i>.</div>
<p>The proof is an exchange argument: if an MST does not use that light edge, adding it creates a cycle that crosses the cut somewhere else, and swapping out that other (heavier or equal) edge gives a spanning tree that is no heavier.</p>
<h3>Kruskal's algorithm</h3>
<p>Sort all edges by weight. Scan them in order; add an edge if its endpoints are in different trees of the forest, which you check and merge with a <a href="/learn/disjoint-sets">union-find</a> structure. An edge whose endpoints are already connected would close a cycle, so skip it. Sorting dominates: O(<i>E</i> lg <i>E</i>) = O(<i>E</i> lg <i>V</i>).</p>
<h3>Prim's algorithm</h3>
<p>Grow a single tree from a root. Keep every vertex outside the tree in a min-priority queue keyed by the lightest edge connecting it to the tree (∞ if none). Repeatedly extract the vertex with the smallest key, add its edge to the tree, and update the keys of its neighbours. With a binary heap, O(<i>E</i> lg <i>V</i>); with a Fibonacci heap, O(<i>E</i> + <i>V</i> lg <i>V</i>). Prim's structure is almost identical to Dijkstra's; only the key differs (edge weight instead of path length).</p>
<h3>Worked example</h3>
<p>Figure 23.1's graph on vertices a–i has an MST of weight 37. Kruskal picks g–h (1), c–i (2), f–g (2), a–b (4), c–f (4), skips i–g (6) because it would close a cycle, takes c–d (7), skips h–i (7), takes a–h (8) or b–c (8), and finishes with d–e (9).</p>
<h3>In interviews</h3>
<ul><li>Min Cost to Connect All Points (LC 1584): Prim on a complete graph, or Kruskal on all pairs.</li><li>Connecting Cities With Minimum Cost (LC 1135), Optimize Water Distribution (LC 1168, add a virtual source vertex).</li><li>Know that MSTs are unique when all weights are distinct.</li></ul>`,
  code: {
    pseudo: `mstKruskal(G, w)
  A ← ∅
  for each vertex v ∈ G.V
      makeSet(v)
  order the edges of G.E by weight, lightest first
  for each edge (u, v), in that order
      if findSet(u) ≠ findSet(v)
          A ← A ∪ {(u, v)}
          union(u, v)
  return A

mstPrim(G, w, r)
  for each u ∈ G.V
      u.key ← ∞
      u.π ← nil
  r.key ← 0
  Q ← G.V
  while Q ≠ ∅
      u ← extractMin(Q)
      for each v ∈ G.Adj[u]
          if v ∈ Q and w(u, v) < v.key
              v.π ← u
              v.key ← w(u, v)`,
    py: `import heapq

def kruskal(n, edges):                       # edges: (w, u, v), vertices 0..n-1
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    total, tree = 0, []
    for w, u, v in sorted(edges):
        ru, rv = find(u), find(v)
        if ru != rv:
            parent[ru] = rv
            total += w; tree.append((u, v, w))
    return total, tree

def prim(adj, root=0):                       # adj[u] = [(v, w), ...]
    seen, total = set(), 0
    pq = [(0, root)]
    while pq:
        w, u = heapq.heappop(pq)
        if u in seen:
            continue                         # stale entry (lazy deletion)
        seen.add(u); total += w
        for v, wv in adj[u]:
            if v not in seen:
                heapq.heappush(pq, (wv, v))
    return total`,
    cpp: `#include <vector>
#include <queue>
#include <algorithm>
#include <numeric>
#include <tuple>
using namespace std;

long long kruskal(int n, vector<tuple<int,int,int>> edges) {   // (w, u, v)
    vector<int> p(n); iota(p.begin(), p.end(), 0);
    function<int(int)> find = [&](int x) { return p[x] == x ? x : p[x] = find(p[x]); };
    sort(edges.begin(), edges.end());
    long long total = 0;
    for (auto [w, u, v] : edges) {
        int a = find(u), b = find(v);
        if (a != b) { p[a] = b; total += w; }
    }
    return total;
}

long long prim(const vector<vector<pair<int,int>>>& adj) {      // (v, w)
    vector<bool> in(adj.size(), false); long long total = 0;
    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq; pq.push({0, 0});
    while (!pq.empty()) {
        auto [w, u] = pq.top(); pq.pop();
        if (in[u]) continue;
        in[u] = true; total += w;
        for (auto [v, wv] : adj[u]) if (!in[v]) pq.push({wv, v});
    }
    return total;
}`,
  },
  viz: {
    inputHint: 'kruskal: edges   or   prim: edges | root (undirected, weighted)',
    presets: [
      { label: 'Kruskal on Figure 23.1', input: 'kruskal: a-b:4 a-h:8 b-c:8 b-h:11 c-d:7 c-f:4 c-i:2 d-e:9 d-f:14 e-f:10 f-g:2 g-h:1 g-i:6 h-i:7', note: 'The book’s graph. MST weight 37.' },
      { label: 'Prim on Figure 23.1', input: 'prim: a-b:4 a-h:8 b-c:8 b-h:11 c-d:7 c-f:4 c-i:2 d-e:9 d-f:14 e-f:10 f-g:2 g-h:1 g-i:6 h-i:7 | a', note: 'Figure 23.5: grow one tree from a.' },
    ],
    random: () => pick(['kruskal: ', 'prim: ']) + randGraph(false, true, rnd(5, 6), rnd(3, 4)),
    parse: s => { const m = /^\s*(kruskal|prim)\s*:(.*)$/i.exec(s); if (!m) throw new Error('Start with "kruskal:" or "prim:".'); const G = parseGraph(m[2], { weighted: true }); if (G.directed) throw new Error('MSTs are for undirected graphs: write a-b:4.'); G.mode = m[1].toLowerCase(); return G; },
    run(G) {
      const R = Rec(), P = placeNodes(G.nodes); const ecls = {}; let total = 0;
      if (G.mode === 'kruskal') {
        const parent = Object.fromEntries(G.nodes.map(n => [n, n])); const find = x => parent[x] === x ? x : (parent[x] = find(parent[x]));
        const E = [...G.edges].sort((a, b) => a.w - b.w);
        const st = (cur, hlRow) => ({ graph: gview(G, P, { ecls: { ...ecls, ...(cur ? { [cur]: 'cmp' } : {}) } }), table: { title: 'Edges sorted by weight', colH: ['edge', 'w', 'result'], cells: E.map(e => [`${e.u}–${e.v}`, e.w, e.res || '']), hl: hlRow != null ? { [hlRow + ',0']: 'cur', [hlRow + ',1']: 'cur', [hlRow + ',2']: 'cur' } : {} }, vars: { 'tree weight': total } });
        R.add(st(), 5, 'Sort the edges by weight. Every vertex starts in its own tree.');
        E.forEach((e, i) => {
          const k = ekey(G, e.u, e.v), ok = find(e.u) !== find(e.v);
          const ask = { q: `Edge ${e.u}–${e.v} (weight ${e.w}) is next. Add it to the forest?`, choices: ['Add it', 'Skip: it would close a cycle'], answer: ok ? 0 : 1, hint: `Are ${e.u} and ${e.v} already connected by chosen edges?` };
          if (ok) { parent[find(e.u)] = find(e.v); ecls[k] = 'mst'; total += e.w; e.res = 'added'; R.add(st(null, i), 8, `${e.u} and ${e.v} are in different trees: add ${e.u}–${e.v} (${e.w}) and union them.`, ask); }
          else { ecls[k] = 'dim'; e.res = 'skip'; R.add(st(null, i), 7, `${e.u} and ${e.v} are already connected: ${e.u}–${e.v} would close a cycle. Skip.`, ask); }
        });
        R.add(st(), 10, `Minimum spanning tree weight ${total}.`);
      } else {
        const A = adj(G), key = Object.fromEntries(G.nodes.map(n => [n, Infinity])), pi = {}, inQ = new Set(G.nodes);
        key[G.src] = 0;
        const st = (cur, ecur) => { const ncls = {}, note = {}; for (const n of G.nodes) { note[n] = 'key ' + fmtV(key[n]); if (!inQ.has(n)) ncls[n] = 'black'; } if (cur) ncls[cur] = 'cur'; return { graph: gview(G, P, { ncls, note, ecls: { ...ecls, ...(ecur ? { [ecur]: 'cmp' } : {}) } }), vars: { 'tree weight': total } }; };
        R.add(st(), 16, `Root ${G.src} has key 0; every other key is ∞.`);
        while (inQ.size) {
          let u = null; for (const n of inQ) if (u == null || key[n] < key[u]) u = n;
          if (key[u] === Infinity) break;
          const ties = [...inQ].filter(n => key[n] === key[u]);
          inQ.delete(u); if (pi[u]) { ecls[ekey(G, pi[u], u)] = 'mst'; total += key[u]; }
          R.add(st(u), 18, `EXTRACT-MIN: ${u} with key ${key[u]}${pi[u] ? `, joining through edge ${pi[u]}–${u}` : ''}.`, pi[u] || inQ.size < G.nodes.length - 1 ? { q: 'Which vertex does EXTRACT-MIN return next? Click it.', pick: ties.map(t => 'n:' + t), hint: 'Smallest key among vertices not yet in the tree.' } : null);
          for (const { v, w } of A[u]) if (inQ.has(v) && w < key[v]) { key[v] = w; pi[v] = u; R.add(st(u, ekey(G, u, v)), 22, `Edge ${u}–${v} (${w}) is lighter than ${v}'s old key: key[${v}] = ${w}.`); }
        }
        R.add(st(), 17, `Minimum spanning tree weight ${total}.`);
      }
      return R.f;
    },
  },
  quiz: [
    { q: 'The cut property says the safe edge to add is…', opts: ['any edge crossing the cut', 'a lightest edge crossing a cut that respects A', 'the heaviest edge', 'an edge inside S'], a: 1, why: 'Theorem 23.1.' },
    { q: 'Kruskal uses union-find to…', opts: ['sort the edges', 'check whether an edge’s endpoints are already connected', 'compute keys', 'find shortest paths'], a: 1, why: 'Different roots means adding the edge cannot create a cycle.' },
    { q: 'Prim’s algorithm with a binary heap runs in…', opts: ['O(V²)', 'O(E lg V)', 'O(E + V)', 'O(V lg E)'], a: 1, why: 'Up to E decrease-key operations at O(lg V) each.' },
    { q: 'How many edges does a spanning tree of a connected graph with V vertices have?', opts: ['V', 'V − 1', 'E', 'E − V'], a: 1, why: 'Any tree on V vertices has V − 1 edges.' },
    { q: 'If all edge weights are distinct, the MST is…', opts: ['unique', 'not unique', 'a path', 'empty'], a: 0, why: 'There are no ties for the cut property to break differently.' },
  ],
});

/* ---------------- shortest path helpers ---------------- */
export function spState(G, P, d, pi, { cur, ecur, settled = new Set(), extra = {} } = {}) {
  const ncls = {}, note = {}, ecls = {};
  for (const n of G.nodes) { note[n] = fmtV(d[n]); if (settled.has(n)) ncls[n] = 'black'; if (pi[n]) ecls[ekey(G, pi[n], n)] = 'tree'; }
  ncls[G.src] = ncls[G.src] || 'src';
  if (cur) ncls[cur] = 'cur'; if (ecur) ecls[ecur] = 'cmp';
  return { graph: gview(G, P, { ncls, note, ecls }), ...extra };
}

/* ---------------- Bellman-Ford ---------------- */
topic({
  id: 'bellman-ford', title: 'Bellman–Ford', sec: '§24.1, §24.5', prereq: ['bfs'],
  blurb: 'Relax every edge |V| − 1 times. Handles negative weights and detects negative cycles.',
  cx: [['Time', 'Θ(VE)'], ['Negative weights', 'Allowed'], ['Negative cycle', 'Detected']],
  props: ['Relaxation', 'Single source'],
  tags: 'bellman ford shortest path negative weight cycle relaxation single source',
  learn: `
<p>The <b>single-source shortest-paths</b> problem: given a weighted directed graph and a source <i>s</i>, find the minimum total weight δ(<i>s</i>, <i>v</i>) of a path to every vertex <i>v</i>. Chapter 24's algorithms all rest on one operation.</p>
<h3>Relaxation</h3>
<p>Each vertex keeps an estimate <i>v.d</i> ≥ δ(<i>s</i>, <i>v</i>), initially ∞ (and 0 for <i>s</i>), plus a predecessor <i>v</i>.π. <b>Relaxing</b> edge (<i>u</i>, <i>v</i>) asks whether going through <i>u</i> improves the estimate:</p>
<div class="formula">if v.d &gt; u.d + w(u, v) then v.d = u.d + w(u, v), v.π = u</div>
<p>The algorithms differ only in which edges they relax and in what order. Section 24.5 proves the key facts, including the <b>path-relaxation property</b>: if <i>p</i> = ⟨<i>s</i>, <i>v</i><sub>1</sub>, …, <i>v<sub>k</sub></i>⟩ is a shortest path and its edges are relaxed in that order (with any other relaxations mixed in), then <i>v<sub>k</sub>.d</i> = δ(<i>s</i>, <i>v<sub>k</sub></i>).</p>
<h3>Bellman–Ford</h3>
<p>Relax <b>every</b> edge, then do it again, |<i>V</i>| − 1 times in total. A shortest path without cycles has at most |<i>V</i>| − 1 edges, and pass <i>i</i> is guaranteed to relax its <i>i</i>-th edge in order, so the path-relaxation property finishes the job. Running time Θ(<i>VE</i>).</p>
<div class="note key"><b>Negative cycles.</b> If some cycle reachable from <i>s</i> has negative total weight, shortest paths are undefined (go around it forever). After the |<i>V</i>| − 1 passes, do one more check: if any edge can still be relaxed, such a cycle exists and Bellman–Ford returns FALSE.</div>
<p>Negative weights are not exotic: currency arbitrage, difference constraints (Section 24.4) and Johnson's all-pairs algorithm all rely on them. Dijkstra cannot handle them.</p>
<h3>In interviews</h3>
<ul><li>Cheapest Flights Within K Stops (LC 787) is Bellman–Ford limited to <i>k</i> + 1 passes; copy the distance array each pass so a pass uses only the previous one.</li><li>Network Delay Time (LC 743) accepts Bellman–Ford, though Dijkstra is faster.</li><li>SPFA is a queue-based Bellman–Ford variant that is often faster in practice, with the same worst case.</li></ul>`,
  code: {
    pseudo: `initializeSingleSource(G, s)
  for each vertex v ∈ G.V
      v.d ← ∞
      v.π ← nil
  s.d ← 0

relax(u, v, w)
  if v.d > u.d + w(u, v)
      v.d ← u.d + w(u, v)
      v.π ← u

bellmanFord(G, w, s)
  initializeSingleSource(G, s)
  for i ← 1 to |G.V| - 1
      for each edge (u, v) ∈ G.E
          relax(u, v, w)
  for each edge (u, v) ∈ G.E
      if v.d > u.d + w(u, v)
          return false
  return true`,
    py: `def bellman_ford(n, edges, s):           # edges: (u, v, w)
    INF = float('inf')
    d = [INF] * n
    d[s] = 0
    for _ in range(n - 1):
        changed = False
        for u, v, w in edges:
            if d[u] + w < d[v]:
                d[v] = d[u] + w
                changed = True
        if not changed:
            break                         # early exit
    for u, v, w in edges:
        if d[u] + w < d[v]:
            return None                   # negative cycle reachable from s
    return d

def cheapest_flights(n, flights, src, dst, k):   # LeetCode 787
    INF = float('inf')
    d = [INF] * n; d[src] = 0
    for _ in range(k + 1):
        nd = d[:]                         # use only last round's values
        for u, v, w in flights:
            if d[u] + w < nd[v]:
                nd[v] = d[u] + w
        d = nd
    return -1 if d[dst] == INF else d[dst]`,
    cpp: `#include <vector>
#include <tuple>
#include <climits>
using namespace std;

// returns false if a negative cycle is reachable from s
bool bellmanFord(int n, const vector<tuple<int,int,int>>& edges, int s, vector<long long>& d) {
    const long long INF = LLONG_MAX / 4;
    d.assign(n, INF); d[s] = 0;
    for (int i = 1; i < n; i++)
        for (auto [u, v, w] : edges)
            if (d[u] < INF && d[u] + w < d[v]) d[v] = d[u] + w;
    for (auto [u, v, w] : edges)
        if (d[u] < INF && d[u] + w < d[v]) return false;
    return true;
}`,
  },
  viz: {
    inputHint: 'Directed weighted edges | source',
    presets: [
      { label: 'Figure 24.4', input: 't>x:5 t>y:8 t>z:-4 x>t:-2 y>x:-3 y>z:9 z>x:7 z>s:2 s>t:6 s>y:7 | s', note: 'The book’s edge order. Negative weights, no negative cycle.' },
      { label: 'Negative cycle', input: 'A>B:1 B>C:-2 C>A:-1 A>D:4 | A', note: 'A → B → C → A has weight −2. The final check catches it.' },
    ],
    random: () => randGraph(true, true, 5, 3, -2, 9) + ' | A',
    parse: s => { const G = parseGraph(s, { weighted: true }); if (!G.directed) throw new Error('Use directed edges, written a>b:4.'); return G; },
    run(G) {
      const R = Rec(), P = placeNodes(G.nodes); const d = Object.fromEntries(G.nodes.map(n => [n, Infinity])), pi = {}; d[G.src] = 0;
      const st = (o = {}) => spState(G, P, d, pi, o);
      R.add(st(), 13, `d[${G.src}] = 0, all others ∞. ${G.nodes.length - 1} passes over all ${G.edges.length} edges.`);
      for (let i = 1; i < G.nodes.length; i++) {
        let changed = false;
        for (const e of G.edges) {
          const cand = d[e.u] + e.w;
          if (cand < d[e.v]) {
            const old = d[e.v]; d[e.v] = cand; pi[e.v] = e.u; changed = true;
            R.add(st({ cur: e.v, ecur: ekey(G, e.u, e.v) }), 17, `Pass ${i}: relax (${e.u}, ${e.v}): ${fmtV(d[e.u])} + ${e.w} = ${cand} < ${fmtV(old)}. Update d[${e.v}] = ${cand}.`, Math.random() < .45 ? { q: `Pass ${i}, relaxing (${e.u}, ${e.v}) with weight ${e.w}. d[${e.u}] = ${fmtV(d[e.u])}, d[${e.v}] = ${fmtV(old)}. What is d[${e.v}] afterwards?`, value: cand } : null);
          }
        }
        R.add(st(), 15, `End of pass ${i}${changed ? '' : ': nothing changed, so the estimates are final'}.`);
        if (!changed) break;
      }
      const bad = G.edges.find(e => d[e.u] + e.w < d[e.v]);
      if (bad) R.add(st({ ecur: ekey(G, bad.u, bad.v) }), 20, `Edge (${bad.u}, ${bad.v}) can still be relaxed: a negative-weight cycle is reachable. Return FALSE.`);
      else R.add(st(), 21, 'No edge can be relaxed further. Red edges form the shortest-path tree. Return TRUE.');
      return R.f;
    },
  },
  quiz: [
    { q: 'Why does Bellman–Ford make |V| − 1 passes?', opts: ['To sort the edges', 'A shortest simple path has at most |V| − 1 edges, and each pass fixes at least one more edge of it', 'It is arbitrary', 'To detect cycles'], a: 1, why: 'Path-relaxation property.' },
    { q: 'After |V| − 1 passes, an edge that can still be relaxed means…', opts: ['the graph is disconnected', 'a negative-weight cycle is reachable from the source', 'Dijkstra would work', 'nothing'], a: 1, why: 'Without such a cycle, all estimates would be final.' },
    { q: 'Bellman–Ford runs in…', opts: ['O(V + E)', 'O(E lg V)', 'O(VE)', 'O(V³)'], a: 2, why: '|V| − 1 passes over all edges.' },
    { q: 'In Cheapest Flights Within K Stops, why copy the distance array each round?', opts: ['To save memory', 'So a single round cannot chain several edges, which would exceed the stop limit', 'To sort it', 'It is not needed'], a: 1, why: 'Round i must use only paths with at most i edges.' },
  ],
});

/* ---------------- DAG shortest paths ---------------- */
topic({
  id: 'dag-sp', title: 'Shortest paths in a DAG', sec: '§24.2', prereq: ['topo-sort', 'bellman-ford'],
  blurb: 'Relax edges in topological order: one pass, linear time, negative weights allowed.',
  cx: [['Time', 'Θ(V + E)'], ['Negative weights', 'Allowed']],
  props: ['Topological order', 'Critical path'],
  tags: 'dag shortest path longest path critical path pert topological',
  learn: `
<p>When the graph is a <b>DAG</b>, shortest paths are easy. Topologically sort the vertices, then process them in that order, relaxing every edge leaving each vertex. Because every path visits vertices in topological order, each shortest path's edges get relaxed in order, and the path-relaxation property guarantees correct distances after a single pass.</p>
<p>Total time Θ(<i>V</i> + <i>E</i>), and negative weights are fine: a DAG cannot have a negative cycle because it has no cycles at all.</p>
<h3>Longest paths and critical paths</h3>
<p>In a general graph, longest simple path is NP-hard. In a DAG it is easy: negate the weights and find shortest paths, or run the same algorithm with “if <i>v.d</i> &lt; <i>u.d</i> + <i>w</i>” and initial values −∞. In project scheduling (PERT charts), vertices are milestones, edges are tasks with durations, and the longest path is the <b>critical path</b>: the minimum time to finish the whole project, and the tasks that cannot slip.</p>
<h3>Why this matters for DP</h3>
<p>Every dynamic program is secretly a shortest or longest path problem on a DAG of subproblems, evaluated in topological order. Seeing that link makes DP recurrences much easier to design.</p>
<h3>In interviews</h3>
<ul><li>Longest Increasing Path in a Matrix (LC 329): the grid with edges toward larger values is a DAG.</li><li>Parallel Courses III (LC 2050): critical path.</li><li>Course Schedule problems that ask for the minimum number of semesters.</li></ul>`,
  code: {
    pseudo: `dagShortestPaths(G, w, s)
  order ← a topological order of G.V
  initializeSingleSource(G, s)
  for each vertex u in order
      for each vertex v ∈ G.Adj[u]
          relax(u, v, w)`,
    py: `def dag_shortest_paths(vertices, adj, s):
    # adj[u] = [(v, w), ...]; vertices are given in topological order
    INF = float('inf')
    d = {v: INF for v in vertices}
    d[s] = 0
    for u in vertices:
        if d[u] == INF:
            continue
        for v, w in adj[u]:
            if d[u] + w < d[v]:
                d[v] = d[u] + w
    return d`,
    cpp: `#include <vector>
#include <climits>
using namespace std;

// order: vertices in topological order; adj[u] = {(v, w)}
vector<long long> dagShortest(const vector<int>& order,
                              const vector<vector<pair<int,int>>>& adj, int s) {
    const long long INF = LLONG_MAX / 4;
    vector<long long> d(adj.size(), INF); d[s] = 0;
    for (int u : order) {
        if (d[u] == INF) continue;
        for (auto [v, w] : adj[u]) if (d[u] + w < d[v]) d[v] = d[u] + w;
    }
    return d;
}`,
  },
  viz: {
    inputHint: 'Directed acyclic weighted edges | source',
    presets: [{ label: 'Figure 24.5', input: 'r>s:5 r>t:3 s>t:2 s>x:6 t>x:7 t>y:4 t>z:2 x>y:-1 x>z:1 y>z:-2 | s', note: 'The book’s DAG from source s. r is unreachable and keeps ∞.' }],
    random: () => { const n = rnd(5, 6), names = 'ABCDEF'.slice(0, n).split(''), out = new Set([`A>${names[rnd(1, n - 1)]}:${rnd(1, 9)}`]); for (let k = 0; k < n + 3; k++) { const i = rnd(0, n - 2), j = rnd(i + 1, n - 1); out.add(`${names[i]}>${names[j]}:${rnd(-3, 9)}`); } return [...out].join(' ') + ' | A'; },
    parse: s => { const G = parseGraph(s, { weighted: true }); if (!G.directed) throw new Error('Use directed edges, written a>b:4.'); return G; },
    run(G) {
      const R = Rec(), P = placeNodes(G.nodes), A = adj(G);
      const indeg = Object.fromEntries(G.nodes.map(n => [n, 0])); for (const e of G.edges) indeg[e.v]++;
      const q = G.nodes.filter(n => !indeg[n]), order = []; while (q.length) { const u = q.shift(); order.push(u); for (const { v } of A[u]) if (--indeg[v] === 0) q.push(v); }
      if (order.length < G.nodes.length) throw new Error('This graph has a cycle, so it is not a DAG.');
      const d = Object.fromEntries(G.nodes.map(n => [n, Infinity])), pi = {}; d[G.src] = 0; const done = new Set();
      const st = o => spState(G, P, d, pi, { ...o, settled: done, extra: { arrays: [{ name: 'o', label: 'Topological order', a: order, noIdx: true, small: true, hl: Object.fromEntries(order.map((x, i) => [i, done.has(x) ? 'done' : o && o.cur === x ? 'cur' : undefined])) }] } });
      R.add(st(), 2, `Topological order: ${order.join(', ')}. d[${G.src}] = 0.`);
      for (const u of order) {
        R.add(st({ cur: u }), 4, d[u] === Infinity ? `${u} is unreachable from ${G.src} (d = ∞). Its edges change nothing.` : `Process ${u} (d = ${d[u]}): relax its outgoing edges.`);
        for (const { v, w } of A[u]) if (d[u] + w < d[v]) { d[v] = d[u] + w; pi[v] = u; R.add(st({ cur: u, ecur: ekey(G, u, v) }), 6, `Relax (${u}, ${v}): d[${v}] = ${d[u]} + ${w} = ${d[v]}.`, Math.random() < .4 ? { q: `Relaxing (${u}, ${v}) with weight ${w}. What is d[${v}] now?`, value: d[v] } : null); }
        done.add(u);
      }
      R.add(st(), 4, 'One pass in topological order, and every distance is final.');
      return R.f;
    },
  },
  quiz: [
    { q: 'Why does one pass suffice in a DAG?', opts: ['DAGs have no negative weights', 'Processing vertices in topological order relaxes every path’s edges in order', 'DAGs are trees', 'It does not'], a: 1, why: 'Path-relaxation property with a single pass.' },
    { q: 'Longest path in a DAG can be found by…', opts: ['it is NP-hard', 'negating weights and finding shortest paths', 'BFS', 'Kruskal'], a: 1, why: 'No cycles means negating cannot create a negative cycle.' },
    { q: 'DAG-SHORTEST-PATHS runs in…', opts: ['Θ(V + E)', 'Θ(E lg V)', 'Θ(VE)', 'Θ(V²)'], a: 0, why: 'Topological sort plus one relaxation per edge.' },
  ],
});

/* ---------------- Dijkstra ---------------- */
topic({
  id: 'dijkstra', title: 'Dijkstra’s algorithm', sec: '§24.3', prereq: ['bellman-ford', 'binary-heap'],
  blurb: 'Greedily settle the closest unsettled vertex. Fast single-source shortest paths for non-negative weights.',
  cx: [['Binary heap', 'O((V + E) lg V)'], ['Fibonacci heap', 'O(V lg V + E)'], ['Array', 'O(V²)']],
  props: ['Greedy', 'Non-negative weights only'],
  tags: 'dijkstra shortest path priority queue heap greedy network delay',
  learn: `
<p>Dijkstra's algorithm solves single-source shortest paths when every edge weight is <b>non-negative</b>. It keeps a set <i>S</i> of vertices whose distances are final. Each step it picks the vertex <i>u</i> outside <i>S</i> with the smallest estimate <i>u.d</i>, adds it to <i>S</i>, and relaxes the edges leaving <i>u</i>. A min-priority queue keyed on <i>d</i> finds that vertex quickly.</p>
<p>It looks like <a href="/learn/bfs">BFS</a> with a priority queue instead of a FIFO queue, and like <a href="/learn/mst">Prim</a> with path length instead of edge weight as the key.</p>
<h3>Why the greedy choice is correct</h3>
<p>Theorem 24.6: when <i>u</i> is extracted, <i>u.d</i> = δ(<i>s</i>, <i>u</i>). Suppose not, and take a true shortest path to <i>u</i>. It leaves <i>S</i> at some edge (<i>x</i>, <i>y</i>) with <i>y</i> ∉ <i>S</i>. Then <i>y.d</i> = δ(<i>s</i>, <i>y</i>) ≤ δ(<i>s</i>, <i>u</i>) ≤ <i>u.d</i>, where the middle step needs <b>non-negative weights</b> (the rest of the path cannot make it shorter). But <i>u</i> was chosen as the minimum, so equality holds throughout.</p>
<div class="note warn">With a negative edge, a vertex can be settled too early: a later path through the negative edge would have been shorter. Use <a href="/learn/bellman-ford">Bellman–Ford</a> instead.</div>
<h3>Running time</h3>
<p>|<i>V</i>| extract-min operations and up to |<i>E</i>| decrease-key operations. With a binary heap, O((<i>V</i> + <i>E</i>) lg <i>V</i>). With a Fibonacci heap (O(1) amortized decrease-key), O(<i>V</i> lg <i>V</i> + <i>E</i>). With a plain array, O(<i>V</i>²), best for very dense graphs.</p>
<p>In code, most libraries lack decrease-key, so the standard trick is <b>lazy deletion</b>: push a new (distance, vertex) pair whenever a distance improves, and skip popped pairs whose distance is stale.</p>
<h3>In interviews</h3>
<ul><li>Network Delay Time (LC 743), Path with Minimum Effort (LC 1631, minimize the max edge), Swim in Rising Water (LC 778), Path with Maximum Probability (LC 1514, multiply instead of add).</li><li>Cheapest Flights Within K Stops (LC 787): Dijkstra on (vertex, stops) states, or Bellman–Ford.</li><li>For grids with unit weights, plain BFS is enough.</li></ul>`,
  code: {
    pseudo: `dijkstra(G, w, s)
  initializeSingleSource(G, s)
  S ← ∅
  Q ← G.V
  while Q ≠ ∅
      u ← extractMin(Q)
      S ← S ∪ {u}
      for each vertex v ∈ G.Adj[u]
          relax(u, v, w)`,
    py: `import heapq

def dijkstra(adj, s):                     # adj[u] = [(v, w), ...], w >= 0
    dist = {s: 0}
    pq = [(0, s)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, float('inf')):
            continue                      # stale entry: skip (lazy deletion)
        for v, w in adj[u]:
            nd = d + w
            if nd < dist.get(v, float('inf')):
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist

def network_delay_time(times, n, k):      # LeetCode 743
    from collections import defaultdict
    adj = defaultdict(list)
    for u, v, w in times:
        adj[u].append((v, w))
    dist = dijkstra(adj, k)
    return max(dist.values()) if len(dist) == n else -1`,
    cpp: `#include <vector>
#include <queue>
#include <climits>
using namespace std;

vector<long long> dijkstra(const vector<vector<pair<int,int>>>& adj, int s) {
    vector<long long> d(adj.size(), LLONG_MAX); d[s] = 0;
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    pq.push({0, s});
    while (!pq.empty()) {
        auto [du, u] = pq.top(); pq.pop();
        if (du > d[u]) continue;                    // stale
        for (auto [v, w] : adj[u])
            if (du + w < d[v]) { d[v] = du + w; pq.push({d[v], v}); }
    }
    return d;
}`,
  },
  viz: {
    inputHint: 'Directed or undirected weighted edges | source',
    presets: [
      { label: 'Figure 24.6', input: 's>t:10 s>y:5 t>x:1 t>y:2 x>z:4 y>t:3 y>x:9 y>z:2 z>s:7 z>x:6 | s', note: 'The book’s example. Settle order: s, y, z, t, x.' },
      { label: 'Undirected', input: 'A-B:4 A-C:2 B-C:1 B-D:5 C-D:8 C-E:10 D-E:2 D-F:6 E-F:2 | A', note: 'The direct edge to C is not always the best route onward.' },
      { label: 'Why negatives break it', input: 'A>B:2 A>C:3 C>B:-2 | A', note: 'B is settled at 2, but A → C → B costs 1. Dijkstra’s answer is wrong here.' },
    ],
    random: () => randGraph(Math.random() < .5, true, rnd(5, 6), rnd(3, 4)) + ' | A',
    parse: s => parseGraph(s, { weighted: true }),
    run(G) {
      const R = Rec(), P = placeNodes(G.nodes), A = adj(G);
      const d = Object.fromEntries(G.nodes.map(n => [n, Infinity])), pi = {}; d[G.src] = 0; const S = new Set();
      const st = o => spState(G, P, d, pi, { ...o, settled: S, extra: { vars: { S: '{' + [...S].join(', ') + '}' } } });
      R.add(st(), 2, `d[${G.src}] = 0, all others ∞. S, the set of settled vertices, is empty.`);
      if (G.edges.some(e => e.w < 0)) R.add(st(), 1, 'Warning: this graph has a negative edge. Dijkstra assumes non-negative weights, so watch for a wrong answer.');
      while (S.size < G.nodes.length) {
        let u = null; for (const n of G.nodes) if (!S.has(n) && (u == null || d[n] < d[u])) u = n;
        if (d[u] === Infinity) { R.add(st(), 6, `The remaining vertices (${G.nodes.filter(n => !S.has(n)).join(', ')}) are unreachable.`); break; }
        const ties = G.nodes.filter(n => !S.has(n) && d[n] === d[u]);
        S.add(u);
        R.add(st({ cur: u }), 6, `EXTRACT-MIN returns ${u} with d = ${d[u]}. Its distance is now final.`, S.size > 1 ? { q: 'Which vertex does EXTRACT-MIN settle next? Click it.', pick: ties.map(t => 'n:' + t), hint: 'Smallest d among unsettled vertices.' } : null);
        for (const { v, w } of A[u]) {
          if (S.has(v)) continue;
          if (d[u] + w < d[v]) { const old = d[v]; d[v] = d[u] + w; pi[v] = u; R.add(st({ cur: u, ecur: ekey(G, u, v) }), 9, `Relax (${u}, ${v}): ${d[u] - 0} + ${w} = ${d[v]} < ${fmtV(old)}. Update.`, Math.random() < .4 ? { q: `Relax (${u}, ${v}), weight ${w}. d[${u}] = ${d[u]}, d[${v}] = ${fmtV(old)}. New d[${v}]?`, value: d[v] } : null); }
          else R.add(st({ cur: u, ecur: ekey(G, u, v) }), 9, `Relax (${u}, ${v}): ${d[u]} + ${w} = ${d[u] + w} ≥ ${fmtV(d[v])}. No change.`);
        }
      }
      R.add(st(), 5, 'All reachable vertices settled. Red edges form the shortest-path tree.');
      return R.f;
    },
  },
  quiz: [
    { q: 'Why does Dijkstra require non-negative edge weights?', opts: ['For the heap to work', 'So that once a vertex is extracted, no later path can be shorter', 'For termination', 'It does not'], a: 1, why: 'A negative edge discovered later could undercut a settled distance.' },
    { q: 'With a binary heap, Dijkstra runs in…', opts: ['O(V + E)', 'O((V + E) lg V)', 'O(VE)', 'O(V³)'], a: 1, why: 'V extractions and up to E decrease-keys, each O(lg V).' },
    { q: 'What is “lazy deletion” in heap-based Dijkstra?', opts: ['Never deleting vertices', 'Pushing duplicates and skipping popped entries whose distance is out of date', 'Deleting edges', 'Using a stack'], a: 1, why: 'It replaces decrease-key, which heapq and priority_queue lack.' },
    { q: 'For a grid where every move costs 1, the simplest correct algorithm is…', opts: ['Dijkstra', 'BFS', 'Bellman–Ford', 'Floyd–Warshall'], a: 1, why: 'Equal weights mean BFS already finds shortest paths.' },
  ],
});

/* ---------------- Floyd–Warshall ---------------- */
topic({
  id: 'floyd-warshall', title: 'Floyd–Warshall', sec: '§25.2–25.3', prereq: ['bellman-ford', 'dp-intro'],
  blurb: 'All-pairs shortest paths by dynamic programming over the allowed intermediate vertices.',
  cx: [['Time', 'Θ(V³)'], ['Space', 'Θ(V²)'], ['Johnson’s (sparse)', 'O(V² lg V + VE)']],
  props: ['Dynamic programming', 'Negative edges allowed'],
  tags: 'floyd warshall all pairs shortest path transitive closure johnson matrix',
  learn: `
<p>To find shortest paths between <b>every</b> pair of vertices, you could run Dijkstra from each vertex. Floyd–Warshall is a simpler alternative that also allows negative edges (but no negative cycles) and works directly on the adjacency matrix.</p>
<h3>The dynamic program</h3>
<p>Number the vertices 1 to <i>n</i>. Let <i>d<sub>ij</sub></i><sup>(<i>k</i>)</sup> be the weight of a shortest path from <i>i</i> to <i>j</i> whose <b>intermediate</b> vertices all lie in {1, …, <i>k</i>}. For <i>k</i> = 0 no intermediates are allowed, so <i>D</i><sup>(0)</sup> is the weight matrix. When vertex <i>k</i> becomes available, a shortest path either avoids it or goes through it exactly once:</p>
<div class="formula">d<sub>ij</sub><sup>(k)</sup> = min( d<sub>ij</sub><sup>(k−1)</sup>, &nbsp; d<sub>ik</sub><sup>(k−1)</sup> + d<sub>kj</sub><sup>(k−1)</sup> )</div>
<p>Three nested loops, <i>k</i> outermost: Θ(<i>n</i><sup>3</sup>). The update can be done in place in one matrix. The order of loops matters: <i>k</i> must be the <b>outer</b> loop, because each phase needs every pair's answer from the previous phase.</p>
<p>A predecessor matrix Π, updated alongside, reconstructs the actual paths. A negative number on the diagonal at the end means a negative cycle.</p>
<h3>Transitive closure</h3>
<p>Replace min and + by OR and AND, and the same loops compute reachability between every pair: the <b>transitive closure</b> of the graph (Section 25.2).</p>
<h3>Johnson's algorithm</h3>
<p>For sparse graphs, Section 25.3 does better: add a new vertex connected to everything with weight 0, run Bellman–Ford from it to get potentials <i>h</i>(<i>v</i>), <b>reweight</b> each edge as <i>w</i>(<i>u</i>, <i>v</i>) + <i>h</i>(<i>u</i>) − <i>h</i>(<i>v</i>) ≥ 0, then run Dijkstra from every vertex. Total O(<i>V</i><sup>2</sup> lg <i>V</i> + <i>VE</i>).</p>
<h3>In interviews</h3>
<ul><li>Find the City With the Smallest Number of Neighbors at a Threshold Distance (LC 1334) is a direct Floyd–Warshall.</li><li>Course Schedule IV (LC 1462) is transitive closure.</li><li>Evaluate Division (LC 399) can be solved with a multiplicative Floyd–Warshall.</li><li>Use it when <i>n</i> ≤ about 400 and you need all pairs; it is five lines of code.</li></ul>`,
  code: {
    pseudo: `floydWarshall(W)
  n ← rows(W)
  D(0) ← W
  for k ← 1 to n
      allocate D(k) ← (d_ij(k))
      for i ← 1 to n
          for j ← 1 to n
              d_ij(k) ← min(d_ij(k-1), d_ik(k-1) + d_kj(k-1))
  return D(n)`,
    py: `def floyd_warshall(n, edges):             # vertices 0..n-1, edges (u, v, w)
    INF = float('inf')
    d = [[0 if i == j else INF for j in range(n)] for i in range(n)]
    for u, v, w in edges:
        d[u][v] = min(d[u][v], w)
    for k in range(n):                       # k must be the outer loop
        for i in range(n):
            for j in range(n):
                if d[i][k] + d[k][j] < d[i][j]:
                    d[i][j] = d[i][k] + d[k][j]
    has_neg_cycle = any(d[i][i] < 0 for i in range(n))
    return d, has_neg_cycle`,
    cpp: `#include <vector>
#include <climits>
#include <algorithm>
using namespace std;

void floydWarshall(vector<vector<long long>>& d) {   // d[i][j] = INF if no edge
    const long long INF = LLONG_MAX / 4;
    int n = d.size();
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (d[i][k] < INF && d[k][j] < INF)
                    d[i][j] = min(d[i][j], d[i][k] + d[k][j]);
}`,
  },
  viz: {
    inputHint: 'Directed weighted edges, vertices up to 6',
    presets: [{ label: 'Figure 25.4', input: '1>2:3 1>3:8 1>5:-4 2>4:1 2>5:7 3>2:4 4>1:2 4>3:-5 5>4:6', note: 'The book’s five-vertex example with negative edges.' }],
    random: () => randGraph(true, true, 4, 3, -2, 9),
    parse: s => { const G = parseGraph(s, { weighted: true, maxN: 6 }); if (!G.directed) G.edges = G.edges.flatMap(e => [e, { u: e.v, v: e.u, w: e.w }]); G.directed = true; return G; },
    run(G) {
      const R = Rec(), P = placeNodes(G.nodes), V = [...G.nodes].sort((a, b) => isFinite(a) && isFinite(b) ? a - b : String(a).localeCompare(b)), n = V.length, ix = Object.fromEntries(V.map((v, i) => [v, i]));
      const D = V.map((_, i) => V.map((_, j) => i === j ? 0 : Infinity)); for (const e of G.edges) D[ix[e.u]][ix[e.v]] = Math.min(D[ix[e.u]][ix[e.v]], e.w);
      const st = (k, hl = {}, ncls = {}) => ({ graph: gview(G, P, { ncls }), table: { title: k === 0 ? 'D(0): the weight matrix' : `D(${k}): intermediates from {${V.slice(0, k).join(', ')}}`, colH: V, rowH: V, cells: D.map(r => [...r]), hl, name: 'D' } });
      R.add(st(0), 3, 'D(0) is the weight matrix: no intermediate vertices allowed yet.');
      for (let k = 0; k < n; k++) {
        const K = V[k]; const rowcol = {}; for (let t = 0; t < n; t++) { rowcol[k + ',' + t] = 'cmp'; rowcol[t + ',' + k] = 'cmp'; }
        R.add(st(k, rowcol, { [K]: 'cur' }), 4, `Phase k = ${K}: may a path i → j improve by going through ${K}? Compare d[i][j] with d[i][${K}] + d[${K}][j].`);
        const changed = [];
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          if (i === k || j === k) continue;
          const via = D[i][k] + D[k][j];
          if (via < D[i][j]) {
            const old = D[i][j];
            const ask = Math.random() < .3 ? { q: `k = ${K}: d[${V[i]}][${K}] = ${fmtV(D[i][k])} and d[${K}][${V[j]}] = ${fmtV(D[k][j])}, while d[${V[i]}][${V[j]}] = ${fmtV(old)}. What is the new d[${V[i]}][${V[j]}]?`, value: via, s: st(k, { [i + ',' + k]: 'cmp', [k + ',' + j]: 'cmp', [i + ',' + j]: 'ask' }, { [K]: 'cur' }) } : null;
            D[i][j] = via; changed.push(i + ',' + j);
            R.add(st(k, { [i + ',' + k]: 'cmp', [k + ',' + j]: 'cmp', [i + ',' + j]: 'cur' }, { [V[i]]: 'gray', [K]: 'cur', [V[j]]: 'gray' }), 8, `${V[i]} → ${K} → ${V[j]}: ${fmtV(D[i][k])} + ${fmtV(D[k][j])} = ${via} < ${fmtV(old)}.`, ask);
          }
        }
        R.add(st(k + 1, Object.fromEntries(changed.map(c => [c, 'found']))), 8, `End of phase ${K}: ${changed.length} entr${changed.length === 1 ? 'y' : 'ies'} improved.`);
      }
      const neg = V.some((_, i) => D[i][i] < 0);
      R.add(st(n), 9, neg ? 'A negative value on the diagonal: the graph has a negative-weight cycle.' : `Done. D(${n}) holds every shortest-path distance.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'In Floyd–Warshall, which loop must be outermost?', opts: ['i', 'j', 'k, the intermediate vertex', 'Any order works'], a: 2, why: 'Phase k needs all pairs’ answers from phase k − 1.' },
    { q: 'Floyd–Warshall runs in…', opts: ['Θ(V²)', 'Θ(V³)', 'Θ(VE)', 'Θ(V² lg V)'], a: 1, why: 'Three nested loops over the vertices.' },
    { q: 'How does Floyd–Warshall reveal a negative cycle?', opts: ['It loops forever', 'A negative entry appears on the diagonal', 'The matrix is not symmetric', 'It cannot'], a: 1, why: 'A vertex would have a negative-weight path back to itself.' },
    { q: 'Johnson’s algorithm reweights edges so that…', opts: ['all weights become non-negative and Dijkstra can run from every vertex', 'the graph becomes a DAG', 'all weights equal 1', 'BFS works'], a: 0, why: 'Potentials from Bellman–Ford make w + h(u) − h(v) ≥ 0 without changing shortest paths.' },
  ],
});

/* ---------------- Max flow ---------------- */
topic({
  id: 'max-flow', title: 'Maximum flow', sec: '§26.1–26.3', prereq: ['bfs'],
  blurb: 'Push as much flow as possible from source to sink by repeatedly finding augmenting paths.',
  cx: [['Edmonds–Karp', 'O(VE²)'], ['Ford–Fulkerson, integer capacities', 'O(E·|f*|)']],
  props: ['Residual network', 'Max-flow min-cut'],
  tags: 'max flow ford fulkerson edmonds karp residual network min cut bipartite matching',
  learn: `
<p>A <b>flow network</b> is a directed graph where each edge has a <b>capacity</b> <i>c</i>(<i>u</i>, <i>v</i>) ≥ 0, with a source <i>s</i> and a sink <i>t</i>. A <b>flow</b> assigns each edge an amount 0 ≤ <i>f</i>(<i>u</i>, <i>v</i>) ≤ <i>c</i>(<i>u</i>, <i>v</i>) such that, at every vertex other than <i>s</i> and <i>t</i>, flow in equals flow out (<b>flow conservation</b>). The value |<i>f</i>| is the net flow out of <i>s</i>. Think of pipes, roads or network links.</p>
<h3>The Ford–Fulkerson method</h3>
<p>Start with zero flow. Build the <b>residual network</b> <i>G<sub>f</sub></i>: for each edge with flow <i>f</i> and capacity <i>c</i>, a forward residual edge with capacity <i>c</i> − <i>f</i> (room to push more) and a backward edge with capacity <i>f</i> (flow that could be cancelled). An <b>augmenting path</b> is any <i>s</i>–<i>t</i> path in <i>G<sub>f</sub></i>. Push flow equal to its smallest residual capacity (the <b>bottleneck</b>) along it, update, and repeat until no augmenting path exists.</p>
<p>Backward edges are what make it work: they let a later path reroute flow that an earlier, greedy path sent the wrong way.</p>
<h3>Max-flow min-cut theorem</h3>
<p>A <b>cut</b> (<i>S</i>, <i>T</i>) separates <i>s</i> from <i>t</i>; its capacity is the total capacity of edges from <i>S</i> to <i>T</i>. Every flow is at most every cut's capacity. Theorem 26.6 says the following are equivalent: <i>f</i> is a maximum flow; the residual network has no augmenting path; |<i>f</i>| equals the capacity of some cut. So when the method stops, the vertices reachable from <i>s</i> in <i>G<sub>f</sub></i> form a <b>minimum cut</b>.</p>
<h3>Edmonds–Karp</h3>
<p>If augmenting paths are chosen badly, Ford–Fulkerson can take time proportional to the flow value, or fail to terminate with irrational capacities. Choosing the <b>shortest</b> augmenting path by BFS bounds the number of augmentations by O(<i>VE</i>), for O(<i>VE</i><sup>2</sup>) total. The visualizer uses BFS.</p>
<h3>Applications</h3>
<p><b>Maximum bipartite matching</b> (Section 26.3): connect a source to every left vertex and every right vertex to a sink, all capacities 1; the max flow is the size of the largest matching. Project selection, image segmentation, airline scheduling and baseball elimination all reduce to max flow or min cut.</p>
<h3>In interviews</h3>
<p>Flow problems are rare in standard interviews but common in competitive programming. Know how to recognize a bipartite matching problem and state the reduction. Push-relabel algorithms (Sections 26.4 and 26.5) achieve O(<i>V</i><sup>3</sup>).</p>`,
  code: {
    pseudo: `fordFulkerson(G, s, t)
  for each edge (u, v) ∈ G.E
      (u, v).f ← 0
  while bfs finds an s-to-t path p in the residual graph G_f
      c_f(p) ← min{c_f(u, v) : (u, v) is in p}
      for each edge (u, v) in p
          if (u, v) ∈ E
              (u, v).f ← (u, v).f + c_f(p)
          else (v, u).f ← (v, u).f - c_f(p)`,
    py: `from collections import deque, defaultdict

def edmonds_karp(edges, s, t):          # edges: (u, v, capacity)
    cap = defaultdict(lambda: defaultdict(int))
    for u, v, c in edges:
        cap[u][v] += c
        cap[v][u] += 0                   # make sure the residual edge exists
    flow = 0
    while True:
        parent = {s: None}
        q = deque([s])
        while q and t not in parent:     # BFS: shortest augmenting path
            u = q.popleft()
            for v, c in cap[u].items():
                if c > 0 and v not in parent:
                    parent[v] = u
                    q.append(v)
        if t not in parent:
            return flow                  # no augmenting path: maximum reached
        b, v = float('inf'), t           # bottleneck
        while parent[v] is not None:
            b = min(b, cap[parent[v]][v]); v = parent[v]
        v = t
        while parent[v] is not None:
            u = parent[v]
            cap[u][v] -= b; cap[v][u] += b
            v = u
        flow += b`,
    cpp: `#include <vector>
#include <queue>
#include <climits>
#include <algorithm>
using namespace std;

int maxFlow(vector<vector<int>> cap, int s, int t) {   // adjacency matrix of capacities
    int n = cap.size(), flow = 0;
    while (true) {
        vector<int> par(n, -1); par[s] = s;
        queue<int> q; q.push(s);
        while (!q.empty() && par[t] == -1) {
            int u = q.front(); q.pop();
            for (int v = 0; v < n; v++)
                if (par[v] == -1 && cap[u][v] > 0) { par[v] = u; q.push(v); }
        }
        if (par[t] == -1) return flow;
        int b = INT_MAX;
        for (int v = t; v != s; v = par[v]) b = min(b, cap[par[v]][v]);
        for (int v = t; v != s; v = par[v]) { cap[par[v]][v] -= b; cap[v][par[v]] += b; }
        flow += b;
    }
}`,
  },
  viz: {
    inputHint: 'Directed edges with capacities, then | source sink',
    presets: [{ label: 'Figure 26.1', input: 's>v1:16 s>v2:13 v2>v1:4 v1>v3:12 v3>v2:9 v2>v4:14 v4>v3:7 v3>t:20 v4>t:4 | s t', note: 'The book’s network. Maximum flow 23.' }, { label: 'Rerouting needed', input: 's>a:1 s>d:1 a>b:1 a>c:1 d>b:1 b>t:1 c>t:1 | s t', note: 'BFS takes s → a → b → t first. The next path, s → d → b → a → c → t, uses the backward edge b → a to undo a → b.' }],
    random: () => { const n = ['s', 'a', 'b', 'c', 't']; return `s>a:${rnd(3, 9)} s>b:${rnd(3, 9)} a>b:${rnd(1, 5)} a>c:${rnd(2, 8)} b>c:${rnd(1, 6)} b>t:${rnd(2, 8)} c>t:${rnd(3, 9)} | s t`; },
    parse: s => { const [body, tail] = s.split('|'); const G = parseGraph(body, { weighted: true }); if (!G.directed) throw new Error('Use directed edges with capacities, like s>a:5.'); const [src, snk] = (tail || '').trim().split(/\s+/); if (!G.nodes.includes(src) || !G.nodes.includes(snk)) throw new Error('After |, give the source and sink, for example "| s t".'); G.src = src; G.sink = snk; if (G.edges.some(e => e.w < 0)) throw new Error('Capacities must be non-negative.'); return G; },
    run(G) {
      const R = Rec(), P = placeNodes(G.nodes); const f = {}; G.edges.forEach(e => f[ekey(G, e.u, e.v)] = 0);
      const capOf = {}; G.edges.forEach(e => capOf[ekey(G, e.u, e.v)] = e.w);
      let total = 0;
      const st = (ecur = {}, ncls = {}) => { const elabel = {}, ecls = {}; for (const e of G.edges) { const k = ekey(G, e.u, e.v); elabel[k] = `${f[k]}/${e.w}`; if (f[k] > 0) ecls[k] = f[k] === e.w ? 'ink' : 'tree'; } Object.assign(ecls, ecur); return { graph: gview(G, P, { ecls, elabel, ncls: { [G.src]: 'src', [G.sink]: 'src', ...ncls } }), vars: { '|f|': total } }; };
      R.add(st(), 3, `Every edge starts with flow 0. Labels show flow/capacity. Push from ${G.src} to ${G.sink}.`);
      const residual = () => { const r = {}; G.nodes.forEach(n => r[n] = []); for (const e of G.edges) { const k = ekey(G, e.u, e.v); if (e.w - f[k] > 0) r[e.u].push({ v: e.v, c: e.w - f[k], k, fwd: true }); if (f[k] > 0) r[e.v].push({ v: e.u, c: f[k], k, fwd: false }); } return r; };
      for (let it = 1; it < 40; it++) {
        const r = residual(), par = { [G.src]: null }, q = [G.src];
        while (q.length && !(G.sink in par)) { const u = q.shift(); for (const ed of r[u]) if (!(ed.v in par)) { par[ed.v] = { u, ...ed }; q.push(ed.v); } }
        if (!(G.sink in par)) break;
        const path = []; let v = G.sink; while (par[v]) { path.unshift(par[v]); v = par[v].u; }
        const b = Math.min(...path.map(p => p.c));
        const pathStr = [G.src, ...path.map(p => p.v)].join(' → ');
        const hl = Object.fromEntries(path.map(p => [p.k, 'cmp']));
        R.add(st(hl, Object.fromEntries(path.map(p => [p.v, 'gray']))), 4, `Augmenting path ${it} (BFS): ${pathStr}${path.some(p => !p.fwd) ? ' (uses a backward residual edge)' : ''}. Residual capacities: ${path.map(p => p.c).join(', ')}.`);
        for (const p of path) f[p.k] += p.fwd ? b : -b;
        total += b;
        R.add(st(Object.fromEntries(path.map(p => [p.k, 'ok']))), 7, `Push the bottleneck ${b} along the path. |f| = ${total}.`, { q: `Path ${pathStr} has residual capacities ${path.map(p => p.c).join(', ')}. How much flow can be pushed?`, value: b, hint: 'The smallest residual capacity on the path.' });
      }
      const r = residual(), seen = new Set([G.src]), q = [G.src]; while (q.length) { const u = q.shift(); for (const ed of r[u]) if (!seen.has(ed.v)) { seen.add(ed.v); q.push(ed.v); } }
      const cut = G.edges.filter(e => seen.has(e.u) && !seen.has(e.v));
      R.add(st(Object.fromEntries(cut.map(e => [ekey(G, e.u, e.v), 'back'])), Object.fromEntries([...seen].map(n => [n, 'ok']))), 4, `No augmenting path remains. Maximum flow ${total}. Minimum cut S = {${[...seen].join(', ')}}: dashed edges, capacity ${cut.reduce((a, e) => a + e.w, 0)}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'What does a backward edge in the residual network represent?', opts: ['A new pipe', 'Flow that can be cancelled or rerouted', 'Negative capacity', 'An error'], a: 1, why: 'Its capacity equals the current flow on the forward edge.' },
    { q: 'The max-flow min-cut theorem says the maximum flow value equals…', opts: ['the sum of all capacities', 'the minimum capacity over all s–t cuts', 'the number of edges', 'the longest path'], a: 1, why: 'Theorem 26.6.' },
    { q: 'Edmonds–Karp chooses augmenting paths by…', opts: ['DFS', 'BFS (fewest edges)', 'largest bottleneck', 'random'], a: 1, why: 'Shortest paths bound the number of augmentations by O(VE).' },
    { q: 'Maximum bipartite matching reduces to max flow by…', opts: ['adding a source to the left side and a sink from the right side with unit capacities', 'weighting edges by degree', 'removing edges', 'it cannot'], a: 0, why: 'Each unit of flow corresponds to one matched pair.' },
  ],
});
