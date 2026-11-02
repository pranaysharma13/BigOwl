import { fmtV, h, sv } from './helpers';

export function clsList(c, pre = 'c-') { if (!c) return ''; return ' ' + String(c).split(/\s+/).filter(Boolean).map(x => pre + x).join(' '); }
export function renderArr(A) {
  const wrap = h('div', { class: 'arr' });
  if (A.label) wrap.append(h('div', { class: 'arr-lab' }, A.label));
  const sc = h('div', { class: 'arr-scroll' });
  const row = h('div', { class: A.bars ? 'bars' : 'cells' });
  const nums = A.a.filter(v => typeof v === 'number' && isFinite(v)).map(Math.abs);
  const max = Math.max(1, ...nums);
  const ptrAt = {};
  for (const [k, i] of Object.entries(A.ptr || {})) if (i != null && i >= 0 && i <= A.a.length) (ptrAt[i] ||= []).push(k);
  const nm = A.name || 'a';
  A.a.forEach((v, i) => {
    const c = clsList(A.hl && A.hl[i]);
    let box;
    if (A.bars) box = h('div', { class: 'bar' + c, style: { height: (26 + Math.round(130 * (typeof v === 'number' && isFinite(v) ? Math.abs(v) : max) / max)) + 'px' } }, fmtV(v));
    else box = h('div', { class: 'cell' + (A.small ? ' sm' : '') + (v == null || v === '' ? ' empty' : '') + c, style: A.w ? { minWidth: A.w + 'px' } : null }, v == null ? (A.nil || '') : fmtV(v));
    row.append(h('div', { class: 'cellw', 'data-k': nm + ':' + i, 'data-fid': A.ids ? nm + '#' + A.ids[i] : null }, box,
      A.noIdx ? null : h('div', { class: 'idx' }, A.idxLabels ? A.idxLabels[i] : i + (A.base ?? 0)),
      h('div', { class: 'ptr' }, (ptrAt[i] || []).join(' '))));
  });
  if (ptrAt[A.a.length]) row.append(h('div', { class: 'cellw' }, h('div', { class: 'cell', style: { visibility: 'hidden' } }, ''), h('div', { class: 'idx' }, ''), h('div', { class: 'ptr' }, ptrAt[A.a.length].join(' '))));
  sc.append(row); wrap.append(sc);
  return wrap;
}
export function renderVars(v) {
  return h('div', { class: 'vars' }, Object.entries(v).map(([k, x]) => h('span', { class: 'var' }, k + ' = ', h('b', null, Array.isArray(x) ? '[' + x.map(fmtV).join(', ') + ']' : fmtV(x)))));
}
export function renderTable(T) {
  const wrap = h('div', {});
  if (T.title) wrap.append(h('div', { class: 'tbl-title' }, T.title));
  const tw = h('div', { class: 'tbl-wrap' });
  const t = h('table', { class: 'tbl' });
  const nm = T.name || 't';
  if (T.colH) t.append(h('tr', null, T.rowH ? h('th', null, T.corner || '') : null, T.colH.map(c => h('th', null, fmtV(c)))));
  T.cells.forEach((row, r) => {
    t.append(h('tr', null, T.rowH ? h('th', null, fmtV(T.rowH[r])) : null, row.map((v, c) => {
      const key = r + ',' + c;
      const blank = v === undefined || (T.blankNull && v == null);
      const ar = T.ar && T.ar[key];
      return h('td', { class: (blank ? 'blank' : '') + clsList(T.hl && T.hl[key]), 'data-k': blank ? null : nm + ':' + key }, ar ? h('span', { class: 'ar' }, ar) : null, blank ? '' : fmtV(v));
    })));
  });
  tw.append(t); wrap.append(tw); return wrap;
}
export function renderBuckets(B) {
  const wrap = h('div', {});
  if (B.title) wrap.append(h('div', { class: 'tbl-title' }, B.title));
  const sc = h('div', { class: 'arr-scroll' });
  const box = h('div', { class: 'buckets' });
  B.slots.forEach((s, i) => {
    const row = h('div', { class: 'bk', 'data-k': 'b:' + i }, h('div', { class: 'bi' + clsList(s.cls) }, s.label ?? i));
    (s.items || []).forEach((v, j) => {
      row.append(h('span', { class: 'arrow' }, B.arrows === false ? '' : '→'));
      row.append(h('div', { class: 'cell sm' + clsList(s.hl && s.hl[j]), 'data-k': 'b:' + i + ',' + j, 'data-fid': s.ids ? 'bk#' + s.ids[j] : null }, fmtV(v)));
    });
    if (B.showNil !== false && !(s.items || []).length) row.append(h('span', { class: 'nil' }, B.empty ?? '/'));
    box.append(row);
  });
  sc.append(box); wrap.append(sc); return wrap;
}
export function renderList(L) {
  const wrap = h('div', {});
  if (L.title) wrap.append(h('div', { class: 'tbl-title' }, L.title));
  const sc = h('div', { class: 'arr-scroll' });
  const row = h('div', { class: 'llist' });
  if (L.headArrow !== false && L.headLabel) row.append(h('span', { class: 'lnil' }, L.headLabel), h('div', { class: 'larr' }));
  L.nodes.forEach((n, i) => {
    row.append(h('div', { class: 'lnode' + clsList(n.cls), 'data-k': 'l:' + n.id, 'data-fid': 'ln#' + n.id },
      n.lab ? h('div', { class: 'lab' }, n.lab) : null,
      h('div', { class: 'box' }, h('span', null, fmtV(n.v)), h('i')),
      n.labb ? h('div', { class: 'labb' }, n.labb) : null));
    if (i < L.nodes.length - 1) row.append(h('div', { class: 'larr' + (L.doubly ? ' dbl' : '') }));
  });
  if (L.nil !== false) { if (L.nodes.length) row.append(h('div', { class: 'larr' })); row.append(h('span', { class: 'lnil' }, L.circular ? '↺ head' : 'NIL')); }
  sc.append(row); wrap.append(sc); return wrap;
}

/* trees: binary (l/r) or n-ary (c), single or multi-key nodes, with tweened motion */
export function layoutTree(T) {
  const N = T.nodes, pos = {}, roots = T.roots || (T.root != null ? [T.root] : []);
  const multi = id => Array.isArray(N[id].k);
  const width = id => multi(id) ? Math.max(1, N[id].k.length) * 26 + 6 : 40;
  const GAP = T.gap || 10;
  let cursor = 0, maxD = 0;
  const binary = T.binary ?? roots.every(r => N[r] && N[r].c === undefined);
  function bin(id, d) {
    if (id == null || !N[id]) return;
    maxD = Math.max(maxD, d);
    bin(N[id].l, d + 1);
    const w = width(id);
    pos[id] = { x: cursor + w / 2, y: d };
    cursor += w + GAP + (T.spread || 0);
    bin(N[id].r, d + 1);
  }
  function nary(id, d) {
    maxD = Math.max(maxD, d);
    const kids = (N[id].c || []).filter(c => c != null && N[c]);
    const w = width(id);
    if (!kids.length) { pos[id] = { x: cursor + w / 2, y: d }; cursor += w + GAP + (T.spread || 0); return; }
    const start = cursor;
    kids.forEach(c => nary(c, d + 1));
    let x = (pos[kids[0]].x + pos[kids[kids.length - 1]].x) / 2;
    if (x - w / 2 < start) x = start + w / 2;
    pos[id] = { x, y: d };
    if (x + w / 2 + GAP > cursor) cursor = x + w / 2 + GAP;
  }
  roots.forEach(r => { if (N[r]) { binary ? bin(r, 0) : nary(r, 0); cursor += 18; } });
  return { pos, maxD, width: cursor, binary, w: width };
}
export function renderTree(T, root) {
  const L = layoutTree(T);
  const LH = T.levelH || 64, PAD = 26;
  const W = Math.max(L.width + PAD * 2 - 18, 120), H = (L.maxD + 1) * LH + PAD * 2 - 10 + (T.notes ? 12 : 0);
  const P = {}; for (const id in L.pos) P[id] = { x: L.pos[id].x + PAD, y: L.pos[id].y * LH + PAD + 4 };
  const svg = sv('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: `max-width:100%;height:auto`, role: 'img', 'aria-label': T.aria || 'Tree' });
  const N = T.nodes, edges = [];
  const kids = id => L.binary ? [N[id].l, N[id].r].filter(c => c != null && N[c]) : (N[id].c || []).filter(c => c != null && N[c]);
  for (const id in P) for (const c of kids(id)) {
    const line = sv('line', { class: 'g-edge' + clsList(T.ecls && T.ecls[c], 'e-') });
    const lab = T.elab && T.elab[c] != null ? sv('text', { class: 'g-elab' }, T.elab[c]) : null;
    edges.push({ u: id, v: c, line, lab });
    svg.append(line); if (lab) svg.append(lab);
  }
  const gs = {};
  for (const id in P) {
    const n = N[id];
    const g = sv('g', { class: 'g-node' + clsList(n.cls, 'n-') + (n.color ? ' rb-' + n.color : '') + (n.nil ? ' nil' : ''), 'data-k': 'n:' + id });
    if (Array.isArray(n.k)) {
      const w = L.w(id), ks = n.k.length || 1;
      g.append(sv('rect', { class: 'nb', x: -w / 2, y: -15, width: w, height: 30, rx: 6, style: 'fill:var(--surface-2);stroke:var(--ink-3)' }));
      (n.k.length ? n.k : ['']).forEach((k, i) => {
        const x = -w / 2 + 3 + i * 26;
        g.append(sv('rect', { class: 'kcell' + (n.kh && n.kh[i] ? ' k-' + n.kh[i] : ''), x, y: -12, width: 24, height: 24, rx: 4 }));
        g.append(sv('text', { x: x + 12, y: 0, class: 'nl', style: n.kh && n.kh[i] === 'cur' ? 'fill:var(--accent-ink)' : null }, fmtV(k)));
      });
    } else {
      g.append(sv('circle', { r: n.nil ? 9 : 18 }));
      g.append(sv('text', { class: 'nl', style: String(n.k).length > 3 ? 'font-size:10.5px' : null }, n.nil ? '' : fmtV(n.k)));
    }
    if (n.note != null) g.append(sv('text', { class: 'nt', y: Array.isArray(n.k) ? 27 : 30 }, n.note));
    if (n.noteUp != null) g.append(sv('text', { class: 'nt', y: -28 }, n.noteUp));
    gs[id] = g; svg.append(g);
  }
  function place(Q) {
    for (const id in gs) { const p = Q[id]; gs[id].setAttribute('transform', `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`); }
    for (const e of edges) {
      const a = Q[e.u], b = Q[e.v];
      e.line.setAttribute('x1', a.x); e.line.setAttribute('y1', a.y + (Array.isArray(N[e.u].k) ? 15 : 0));
      e.line.setAttribute('x2', b.x); e.line.setAttribute('y2', b.y - (Array.isArray(N[e.v].k) ? 15 : 0));
      if (e.lab) { e.lab.setAttribute('x', (a.x + b.x) / 2 + (b.x < a.x ? -8 : 8)); e.lab.setAttribute('y', (a.y + b.y) / 2); }
    }
  }
  const prev = root && root._tpos || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const moved = Object.keys(P).some(id => prev[id] && (Math.abs(prev[id].x - P[id].x) > 1 || Math.abs(prev[id].y - P[id].y) > 1));
  if (root) { cancelAnimationFrame(root._raf); root._tpos = P; }
  if (!moved || reduce || !root) place(P);
  else {
    const t0 = performance.now(), D = 380;
    const step = now => {
      const t = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - t, 3);
      const Q = {}; for (const id in P) { const a = prev[id] || P[id]; Q[id] = { x: a.x + (P[id].x - a.x) * e, y: a.y + (P[id].y - a.y) * e }; }
      place(Q); if (t < 1) root._raf = requestAnimationFrame(step);
    };
    place(Object.fromEntries(Object.keys(P).map(id => [id, prev[id] || P[id]])));
    root._raf = requestAnimationFrame(step);
  }
  const wrap = h('div', {});
  if (T.title) wrap.append(h('div', { class: 'tbl-title' }, T.title));
  wrap.append(h('div', { class: 'svgwrap' }, svg));
  return wrap;
}
/* graphs with fixed coordinates */
export function renderGraph(G) {
  const R = G.r || 19;
  const xs = G.nodes.map(n => n.x), ys = G.nodes.map(n => n.y);
  const minX = Math.min(...xs) - R - 26, maxX = Math.max(...xs) + R + 26, minY = Math.min(...ys) - R - 30, maxY = Math.max(...ys) + R + 26;
  const W = maxX - minX, H = maxY - minY;
  const svg = sv('svg', { viewBox: `${minX} ${minY} ${W} ${H}`, width: W, height: H, style: 'max-width:100%;height:auto', role: 'img', 'aria-label': G.aria || 'Graph' });
  const pos = Object.fromEntries(G.nodes.map(n => [n.id, n]));
  const has = new Set(G.edges.map(e => e.u + '>' + e.v));
  const labels = [];
  for (const e of G.edges) {
    const a = pos[e.u], b = pos[e.v]; if (!a || !b) continue;
    const c = clsList(e.cls, 'e-');
    if (e.u === e.v) {
      svg.append(sv('path', { class: 'g-edge' + c, d: `M${a.x - 8},${a.y - R + 2} C${a.x - 26},${a.y - R - 34} ${a.x + 26},${a.y - R - 34} ${a.x + 8},${a.y - R + 2}` }));
      if (G.directed) svg.append(sv('polygon', { class: 'g-arrow' + c, points: `${a.x + 8},${a.y - R + 1} ${a.x + 13},${a.y - R - 8} ${a.x + 4},${a.y - R - 7}` }));
      if (e.w != null) labels.push([a.x, a.y - R - 30, e.w, c]);
      continue;
    }
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    const curved = G.directed && has.has(e.v + '>' + e.u) && !G.straight;
    const off = curved ? 16 : (e.bend || 0);
    const nx = -uy, ny = ux;
    const mx = (a.x + b.x) / 2 + nx * off, my = (a.y + b.y) / 2 + ny * off;
    let sx, sy, ex, ey;
    if (off) {
      const d1 = Math.hypot(mx - a.x, my - a.y), d2 = Math.hypot(b.x - mx, b.y - my);
      sx = a.x + (mx - a.x) / d1 * R; sy = a.y + (my - a.y) / d1 * R;
      ex = b.x - (b.x - mx) / d2 * (R + (G.directed ? 2 : 0)); ey = b.y - (b.y - my) / d2 * (R + (G.directed ? 2 : 0));
      svg.append(sv('path', { class: 'g-edge' + c, d: `M${sx},${sy} Q${mx},${my} ${ex},${ey}` }));
    } else {
      sx = a.x + ux * R; sy = a.y + uy * R; ex = b.x - ux * (R + (G.directed ? 2 : 0)); ey = b.y - uy * (R + (G.directed ? 2 : 0));
      svg.append(sv('line', { class: 'g-edge' + c, x1: sx, y1: sy, x2: ex, y2: ey }));
    }
    if (G.directed) {
      const tx = off ? (ex - mx) : dx, ty = off ? (ey - my) : dy, tl = Math.hypot(tx, ty) || 1, vx = tx / tl, vy = ty / tl;
      const px = ex, py = ey;
      svg.append(sv('polygon', { class: 'g-arrow' + c, points: `${px},${py} ${px - vx * 10 - vy * 5},${py - vy * 10 + vx * 5} ${px - vx * 10 + vy * 5},${py - vy * 10 - vx * 5}` }));
    }
    if (e.w != null || e.label != null) {
      const lx = off ? (a.x + 2 * mx + b.x) / 4 : (a.x + b.x) / 2 + (G.directed ? nx * 0 : 0), ly = off ? (a.y + 2 * my + b.y) / 4 : (a.y + b.y) / 2;
      labels.push([lx, ly, e.label ?? fmtV(e.w), c]);
    }
  }
  for (const [x, y, t, c] of labels) {
    const w = String(t).length * 6.8 + 8;
    svg.append(sv('g', { class: 'g-w' + c }, sv('rect', { x: x - w / 2, y: y - 8, width: w, height: 16, rx: 4 }), sv('text', { x, y: y + 4, 'text-anchor': 'middle' }, t)));
  }
  for (const n of G.nodes) {
    const g = sv('g', { class: 'g-node' + clsList(n.cls, 'n-'), 'data-k': 'n:' + n.id, transform: `translate(${n.x},${n.y})` });
    g.append(sv('circle', { r: R }));
    g.append(sv('text', { class: 'nl', style: String(n.label ?? n.id).length > 3 ? 'font-size:10px' : null }, n.label ?? n.id));
    if (n.note != null) g.append(sv('text', { class: 'nt', y: n.noteBelow ? R + 13 : -R - 8 }, n.note));
    svg.append(g);
  }
  const wrap = h('div', {});
  if (G.title) wrap.append(h('div', { class: 'tbl-title' }, G.title));
  wrap.append(h('div', { class: 'svgwrap' }, svg));
  return wrap;
}
export const Stage = {
  render(root, s) {
    const prev = new Map();
    root.querySelectorAll('[data-fid]').forEach(e => { const r = e.getBoundingClientRect(); prev.set(e.dataset.fid, [r.left, r.top]); });
    root.innerHTML = '';
    const order = s.order || ['vars', 'tree', 'graph', 'arrays', 'tables', 'buckets', 'list', 'note'];
    for (const part of order) {
      if (part === 'vars' && s.vars) root.append(renderVars(s.vars));
      if (part === 'tree' && s.tree) root.append(renderTree(s.tree, root));
      if (part === 'trees' && s.trees) s.trees.forEach(t => root.append(renderTree(t)));
      if (part === 'graph' && s.graph) root.append(renderGraph(s.graph));
      if (part === 'arrays' && (s.arrays || s.array)) (s.arrays || [s.array]).forEach(a => root.append(renderArr(a)));
      if (part === 'tables' && (s.tables || s.table)) (s.tables || [s.table]).forEach(t => root.append(renderTable(t)));
      if (part === 'buckets' && s.buckets) root.append(renderBuckets(s.buckets));
      if (part === 'list' && (s.list || s.lists)) (s.lists || [s.list]).forEach(l => root.append(renderList(l)));
      if (part === 'note' && s.note) root.append(h('div', { class: 'stage-note', html: s.note }));
      if (part === 'html' && s.html) root.append(h('div', { html: s.html }));
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.querySelectorAll('[data-fid]').forEach(e => {
      const p = prev.get(e.dataset.fid); if (!p) return;
      const r = e.getBoundingClientRect(), dx = p[0] - r.left, dy = p[1] - r.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      e.style.transform = `translate(${dx}px,${dy}px)`; e.style.transition = 'none'; e.style.zIndex = 2;
      requestAnimationFrame(() => requestAnimationFrame(() => { e.style.transition = 'transform .36s cubic-bezier(.2,.7,.2,1)'; e.style.transform = ''; }));
    });
  }
};
