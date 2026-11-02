import { Link } from 'react-router';
import { PARTS, TOPICS } from '../content';
import { useProgress } from '../features/progress/store';
import { level, mastery, predictionAccuracy, streak, type AssessResult } from '../features/progress/model';
import { useSession } from '../features/auth/auth';
import { usePageTitle } from '../lib/usePageTitle';

export function HistoryChart({ rows }: { rows: AssessResult[] }) {
  const r = rows.slice(-20);
  const W = 640, H = 180, L = 34, B = 24, T = 10, R = 10;
  const x = (i: number) => L + (r.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (r.length - 1));
  const y = (v: number) => T + ((100 - v) * (H - T - B)) / 100;
  const pts = r.map((row, i) => [x(i), y(row.pct)] as const);
  const fmt = (ts: number) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return (
    <svg className="hist" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Assessment scores, latest ${r[r.length - 1]?.pct ?? 0}%`}>
      {[0, 50, 100].map((v) => (
        <g key={v}><line className="ax" x1={L} x2={W - R} y1={y(v)} y2={y(v)} /><text x={L - 6} y={y(v) + 4} textAnchor="end">{v}%</text></g>
      ))}
      {pts.length > 1 && <path className="ln" d={'M' + pts.map((p) => p.join(',')).join(' L')} />}
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={4}><title>{`${fmt(r[i].ts)}: ${r[i].pct}% (${r[i].mode})`}</title></circle>)}
      {r.length > 0 && <><text x={L} y={H - 6}>{fmt(r[0].ts)}</text><text x={W - R} y={H - 6} textAnchor="end">{fmt(r[r.length - 1].ts)}</text></>}
    </svg>
  );
}

export function Progress() {
  usePageTitle('Progress');
  const data = useProgress((s) => s.data);
  const session = useSession();
  const total = TOPICS.length;
  const mastered = TOPICS.filter((t) => level(data.topics[t.id]) === 3).length;
  const overall = Math.round((100 * TOPICS.reduce((s, t) => s + mastery(data.topics[t.id]), 0)) / total);
  const acc = predictionAccuracy(data);
  const st = streak(data.days);
  return (
    <div className="wrap page">
      <header className="phead">
        <span className="lbl ink sq">Progress</span>
        <h1 className="display">Where you stand.</h1>
        <p className="lede">
          {session ? 'Saved to your account and synced across your devices.' : <>Saved in this browser only. <Link to="/account">Sign in</Link> to keep it safe if you clear your history.</>}
        </p>
      </header>
      <div className="stats">
        {[[`${overall}%`, 'Overall mastery'], [`${mastered}/${total}`, 'Topics mastered'], [acc == null ? '—' : `${acc}%`, 'Step-prediction accuracy'], [`${st} day${st === 1 ? '' : 's'}`, 'Current streak']].map(([v, l]) => (
          <div className="stat" key={l}><b>{v}</b><span className="lbl">{l}</span></div>
        ))}
      </div>
      <section className="pr-block">
        <div className="section-head"><h2 style={{ fontSize: 'clamp(24px,2.6vw,36px)' }}>Mastery by unit</h2><span className="lbl sq">Units</span></div>
        <div className="bars-h" style={{ paddingTop: 16 }}>
          {PARTS.map((P) => {
            const ts = TOPICS.filter((t) => t.part === P.id);
            const v = ts.length ? Math.round((100 * ts.reduce((s, t) => s + mastery(data.topics[t.id]), 0)) / ts.length) : 0;
            return (
              <div className="bh" key={P.id}>
                <span>{P.title}</span>
                <div className="tr" role="img" aria-label={`${v}%`}><i style={{ width: `${Math.max(v, 1)}%` }} /></div>
                <span>{v}%</span>
              </div>
            );
          })}
        </div>
      </section>
      {data.assess.length > 0 && (
        <section className="pr-block">
          <div className="section-head"><h2 style={{ fontSize: 'clamp(24px,2.6vw,36px)' }}>Assessment scores</h2><span className="lbl sq">Last {Math.min(20, data.assess.length)}</span></div>
          <HistoryChart rows={data.assess} />
        </section>
      )}
      <section className="pr-block">
        <div className="section-head"><h2 style={{ fontSize: 'clamp(24px,2.6vw,36px)' }}>Every topic</h2><span className="lbl sq">{total} topics</span></div>
        <div className="tablewrap">
          <table className="ctable">
            <thead><tr><th>Topic</th><th>Theory</th><th>Watched</th><th>Quiz best</th><th>Predictions</th><th>Mastery</th></tr></thead>
            <tbody>
              {TOPICS.map((t) => {
                const p = data.topics[t.id] ?? {};
                return (
                  <tr key={t.id}>
                    <td><Link to={`/learn/${t.id}`} style={{ textDecoration: 'none', fontWeight: 600 }}>{t.title}</Link></td>
                    <td>{p.r ? 'Read' : ''}</td>
                    <td>{p.v ? 'Yes' : ''}</td>
                    <td>{p.qa ? `${p.q}%` : ''}</td>
                    <td>{p.dt ? `${p.d ?? 0}/${p.dt}` : ''}</td>
                    <td>{Math.round(mastery(p) * 100)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
