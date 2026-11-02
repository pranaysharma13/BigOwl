import { useEffect, useRef } from 'react';

interface Node { x: number; y: number; d: number; p: number }

/**
 * A breadth-first search running on a random geometric graph, drawn as light on a dark field.
 * Decorative: hidden from assistive technology; pauses when off screen; static for reduced motion.
 */
export function GlowGraph() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, nodes: Node[] = [], adj: number[][] = [], t0 = performance.now(), raf = 0, visible = true;

    const build = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, Math.max(40, (W * H) / 14000)));
      nodes = Array.from({ length: n }, () => {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
        return { x: W * 0.66 + Math.cos(a) * r * H * 0.62, y: H * 0.5 + Math.sin(a) * r * H * 0.44, d: Infinity, p: -1 };
      }).filter((p) => p.x > 8 && p.x < W - 8);
      adj = nodes.map((p, i) =>
        nodes.map((q, j) => [j, Math.hypot(p.x - q.x, p.y - q.y)] as const).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([j]) => j),
      );
      adj.forEach((l, i) => l.forEach((j) => { if (!adj[j].includes(i)) adj[j].push(i); }));
      bfs();
    };
    const bfs = () => {
      nodes.forEach((p) => { p.d = Infinity; p.p = -1; });
      const s = Math.floor(Math.random() * nodes.length);
      nodes[s].d = 0;
      const q = [s];
      while (q.length) { const u = q.shift()!; for (const v of adj[u]) if (nodes[v].d === Infinity) { nodes[v].d = nodes[u].d + 1; nodes[v].p = u; q.push(v); } }
      t0 = performance.now();
    };
    const lerp = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const BLUE = [92, 120, 255], ORANGE = [255, 112, 64];

    const draw = (now: number) => {
      const t = reduce ? 99 : (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      // iridescent ring
      const cx = W * 0.66, cy = H * 0.5, R = H * 0.58;
      const g = (ctx as any).createConicGradient ? (ctx as any).createConicGradient(now / 9000, cx, cy) : ctx.createLinearGradient(cx - R, cy, cx + R, cy);
      g.addColorStop(0, 'rgba(92,120,255,.9)'); g.addColorStop(0.3, 'rgba(176,110,255,.75)'); g.addColorStop(0.55, 'rgba(255,112,64,.85)'); g.addColorStop(0.8, 'rgba(255,95,160,.6)'); g.addColorStop(1, 'rgba(92,120,255,.9)');
      ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.shadowColor = 'rgba(120,140,255,.8)'; ctx.shadowBlur = 36;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      const maxD = Math.max(...nodes.map((p) => (isFinite(p.d) ? p.d : 0)));
      const step = 0.42, lit = (p: Node) => isFinite(p.d) && t >= p.d * step;
      // faint edges
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(233,235,240,.07)';
      ctx.beginPath(); adj.forEach((l, i) => l.forEach((j) => { if (j > i) { ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); } })); ctx.stroke();
      // BFS tree edges, drawn as they are discovered
      nodes.forEach((p) => {
        if (p.p < 0 || !lit(p)) return;
        const q = nodes[p.p], k = Math.min(1, (t - p.d * step) / step);
        const c = lerp(BLUE, ORANGE, maxD ? p.d / maxD : 0);
        ctx.strokeStyle = `rgba(${c},.75)`; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x + (p.x - q.x) * k, q.y + (p.y - q.y) * k); ctx.stroke();
      });
      nodes.forEach((p) => {
        const on = lit(p), fresh = on && t - p.d * step < step * 1.5;
        const c = lerp(BLUE, ORANGE, maxD && isFinite(p.d) ? p.d / maxD : 0);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.d === 0 ? 5 : fresh ? 4 : 2.4, 0, Math.PI * 2);
        ctx.fillStyle = on ? `rgb(${c})` : 'rgba(233,235,240,.28)';
        if (on) { ctx.shadowColor = `rgb(${c})`; ctx.shadowBlur = fresh ? 18 : 8; }
        ctx.fill(); ctx.shadowBlur = 0;
      });
      if (!reduce && t > (maxD + 1) * step + 2.2) bfs();
      if (!reduce && visible) raf = requestAnimationFrame(draw);
    };

    build();
    const ro = new ResizeObserver(() => { build(); if (reduce) draw(performance.now()); });
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible || reduce) raf = requestAnimationFrame(draw);
    });
    io.observe(cv);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);
  return <canvas ref={ref} aria-hidden="true" />;
}
