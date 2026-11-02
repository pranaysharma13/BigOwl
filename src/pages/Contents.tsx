import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { PARTS, TOPICS } from '../content';
import { useProgress } from '../features/progress/store';
import { level } from '../features/progress/model';
import { usePageTitle } from '../lib/usePageTitle';

function CurriculumMap() {
  const data = useProgress((s) => s.data);
  const nav = useNavigate();
  const [hover, setHover] = useState<string | null>(null);
  const CW = 168, CG = 34, RH = 32, TOP = 34, NW = 152, NH = 24;
  const cols = useMemo(() => PARTS.map((P) => TOPICS.filter((t) => t.part === P.id)), []);
  const pos = useMemo(() => {
    const out: Record<string, { x: number; y: number }> = {};
    cols.forEach((ts, c) => ts.forEach((t, r) => (out[t.id] = { x: 10 + c * (CW + CG), y: TOP + r * RH })));
    return out;
  }, [cols]);
  const H = TOP + Math.max(...cols.map((c) => c.length)) * RH + 10, W = 10 + PARTS.length * (CW + CG);
  const links = useMemo(() => TOPICS.flatMap((t) => (t.prereq ?? []).filter((p) => pos[p]).map((p) => ({ from: p, to: t.id }))), [pos]);
  const anc = useMemo(() => {
    if (!hover) return new Set<string>();
    const s = new Set([hover]);
    let grew = true;
    while (grew) { grew = false; for (const l of links) if (s.has(l.to) && !s.has(l.from)) { s.add(l.from); grew = true; } }
    return s;
  }, [hover, links]);
  return (
    <div className="map-wrap">
      <svg className="map" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Curriculum map: each arrow is a prerequisite">
        {PARTS.map((P, c) => (
          <g className="mh" key={P.id}>
            <text x={10 + c * (CW + CG)} y={16}>{String(P.n).padStart(2, '0')} {P.title}</text>
          </g>
        ))}
        {links.map((l) => {
          const a = pos[l.from], b = pos[l.to];
          const d = a.x === b.x
            ? `M${a.x + NW},${a.y + NH / 2} C${a.x + NW + 22},${a.y + NH / 2} ${a.x + NW + 22},${b.y + NH / 2} ${a.x + NW},${b.y + NH / 2}`
            : `M${a.x + NW},${a.y + NH / 2} C${(a.x + NW + b.x) / 2},${a.y + NH / 2} ${(a.x + NW + b.x) / 2},${b.y + NH / 2} ${b.x},${b.y + NH / 2}`;
          return <path key={l.from + l.to} className={`ml ${anc.has(l.to) && anc.has(l.from) ? 'hl' : ''}`} d={d} />;
        })}
        {TOPICS.map((t) => {
          const p = pos[t.id];
          return (
            <g key={t.id} className={`mn s${level(data.topics[t.id])} ${anc.has(t.id) ? 'hl' : ''}`} transform={`translate(${p.x},${p.y})`}
              tabIndex={0} role="link" aria-label={t.title}
              onClick={() => nav(`/learn/${t.id}`)} onKeyDown={(e) => e.key === 'Enter' && nav(`/learn/${t.id}`)}
              onMouseEnter={() => setHover(t.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(t.id)} onBlur={() => setHover(null)}>
              <rect width={NW} height={NH} rx={4} />
              <text x={9} y={16}>{t.title.length > 22 ? t.title.slice(0, 21) + '…' : t.title}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function Contents() {
  usePageTitle('Learn');
  const data = useProgress((s) => s.data);
  const loc = useLocation();
  useEffect(() => {
    if (loc.hash) document.getElementById(loc.hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [loc.hash]);
  return (
    <div className="wrap page">
      <header className="phead">
        <span className="lbl ink sq">Contents</span>
        <h1 className="display">Learn.</h1>
        <p className="lede">{TOPICS.length} topics in eight units, ordered so each builds on the last. Section numbers refer to <i>Introduction to Algorithms</i>, 3rd edition. Topics marked “beyond the book” are interview staples the textbook covers only in exercises, or not at all.</p>
      </header>
      <div className="contents">
        {PARTS.map((P) => (
          <section className="cpart" key={P.id} id={`unit-${P.n}`} style={{ scrollMarginTop: 80 }}>
            <h2><span>{String(P.n).padStart(2, '0')}</span>{P.title}</h2>
            {TOPICS.filter((t) => t.part === P.id).map((t) => (
              <Link key={t.id} className="crow" to={`/learn/${t.id}`}>
                <span className={`dot s${level(data.topics[t.id])}`} aria-hidden="true" />
                <span>
                  <span className="ct">{t.title}</span>
                  {t.beyond && <span className="tag">Beyond the book</span>}
                  <div className="cs">{t.blurb}</div>
                </span>
                <span className="cx">{t.beyond ? '' : t.sec}</span>
              </Link>
            ))}
          </section>
        ))}
      </div>
      <section className="pr-block">
        <div className="section-head"><h2 style={{ fontSize: 'clamp(26px,3vw,40px)' }}>How the topics connect</h2><span className="lbl sq">Map</span></div>
        <p className="muted">Each line is a prerequisite. Hover or focus a topic to trace everything it builds on.</p>
        <CurriculumMap />
      </section>
    </div>
  );
}
