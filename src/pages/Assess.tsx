import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PARTS, type PartId } from '../content';
import { Mount } from '../components/Mount';
import { PillButton } from '../components/Pill';
import { codeBlock } from '../engine/highlight';
import { useProgress } from '../features/progress/store';
import type { AssessResult } from '../features/progress/model';
import {
  KIND_LABEL,
  areaLink,
  areaTitle,
  buildMock,
  complexityQuestions,
  parsonsCorrect,
  parsonsSet,
  patternQuestions,
  reportRows,
  shuffleOpts,
  shuffled,
  type AQ,
  type MockConfig,
  type ParsonsProblem,
} from '../features/assess/pool';
import { usePageTitle } from '../lib/usePageTitle';
import { HistoryChart } from './Progress';

type Mode = 'mock' | 'sprint' | 'complexity' | 'parsons';
const MODE_NAME: Record<Mode, string> = {
  mock: 'Mock assessment',
  sprint: 'Pattern sprint',
  complexity: 'Complexity drill',
  parsons: 'Put it in order',
};

interface Outcome {
  mode: Mode;
  items: { q: AQ; given: number | null }[];
  seconds: number;
  parsons?: { p: ParsonsProblem; firstTry: boolean }[];
}

type Phase =
  | { k: 'home' }
  | { k: 'mcq'; mode: Exclude<Mode, 'parsons'>; qs: AQ[]; limit: number | null; instant: boolean }
  | { k: 'parsons'; set: ParsonsProblem[] }
  | { k: 'report'; out: Outcome };

/* ---------------- shared bits ---------------- */

function Code({ src, lang = 'py' }: { src: string; lang?: string }) {
  return <Mount className="codebox qcode" deps={[src]} build={(el) => { el.append(codeBlock(src, lang)); }} />;
}

/** First-party HTML from the curriculum (never user input). */
const Html = ({ html, as: Tag = 'span', className }: { html: string; as?: 'span' | 'div'; className?: string }) => (
  <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />
);

function useCountdown(limit: number | null, onEnd: () => void) {
  const [start] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  });
  useEffect(() => {
    let ended = false;
    const t = setInterval(() => {
      const e = Math.floor((Date.now() - start) / 1000);
      setElapsed(e);
      if (limit != null && e >= limit && !ended) {
        ended = true;
        onEndRef.current();
      }
    }, 250);
    return () => clearInterval(t);
  }, [start, limit]);
  const elapsedNow = useCallback(() => Math.round((Date.now() - start) / 1000), [start]);
  return { elapsed, left: limit == null ? null : Math.max(0, limit - elapsed), elapsedNow };
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/* ---------------- multiple-choice runner ---------------- */

function McqRunner({ phase, onDone, onQuit }: { phase: Extract<Phase, { k: 'mcq' }>; onDone: (o: Outcome) => void; onQuit: () => void }) {
  const { qs, limit, instant, mode } = phase;
  const [k, setK] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => qs.map(() => null));
  const [locked, setLocked] = useState(false);
  const finished = useRef(false);
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const sprint = mode === 'sprint';
  const finishRef = useRef<(upto?: number) => void>(() => {});
  const timer = useCountdown(limit, () => {
    const firstBlank = answersRef.current.findIndex((a) => a == null);
    finishRef.current(sprint && firstBlank >= 0 ? firstBlank : undefined);
  });
  const { elapsedNow } = timer;
  const finish = useCallback(
    (upto?: number) => {
      if (finished.current) return;
      finished.current = true;
      const n = upto ?? qs.length;
      onDone({ mode, items: qs.slice(0, n).map((q, i) => ({ q, given: answersRef.current[i] })), seconds: elapsedNow() });
    },
    [qs, mode, onDone, elapsedNow],
  );
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);
  const q = qs[k];
  const given = answers[k];
  const reveal = instant && given != null;

  const choose = (i: number) => {
    if (locked || (instant && given != null)) return;
    const next = [...answers];
    next[k] = i;
    setAnswers(next);
    if (sprint) {
      setLocked(true);
      setTimeout(() => {
        setLocked(false);
        if (k + 1 >= qs.length) finish();
        else setK(k + 1);
      }, i === q.a ? 380 : 900);
    }
  };
  const go = (d: number) => setK((x) => Math.max(0, Math.min(qs.length - 1, x + d)));
  const submit = () => {
    const blank = answers.filter((a) => a == null).length;
    if (!instant && blank && !window.confirm(`${blank} question${blank === 1 ? ' is' : 's are'} unanswered. Submit anyway?`)) return;
    finish();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((document.activeElement as HTMLElement)?.tagName ?? '')) return;
      const n = '1234abcd'.indexOf(e.key.toLowerCase());
      if (n >= 0 && n % 4 < q.opts.length) {
        e.preventDefault();
        choose(n % 4);
      } else if (e.key === 'ArrowRight' && !sprint) go(1);
      else if (e.key === 'ArrowLeft' && !sprint && !instant) go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const answered = answers.filter((a) => a != null).length;
  const right = answers.filter((a, i) => a === qs[i].a).length;
  const low = timer.left != null && timer.left <= (sprint ? 10 : 60);
  return (
    <div className="runner">
      <div className="runbar">
        <span className="lbl ink sq">{MODE_NAME[mode]}</span>
        <span className="lbl tnum">{sprint ? `${right} correct` : `Question ${k + 1} of ${qs.length}`}</span>
        <span className={'clock tnum' + (low ? ' low' : '')} role="timer" aria-label={timer.left != null ? `${clock(timer.left)} left` : `${clock(timer.elapsed)} elapsed`}>
          {timer.left != null ? clock(timer.left) : clock(timer.elapsed)}
        </span>
        <button className="btn sm ghost" onClick={() => window.confirm('Leave this assessment? Nothing will be saved.') && onQuit()}>Quit</button>
      </div>
      <div className="qprog" aria-hidden="true"><i style={{ width: `${(100 * (sprint ? k : answered)) / qs.length}%` }} /></div>
      {!sprint && !instant && (
        <nav className="qdots" aria-label="Questions">
          {qs.map((_, i) => (
            <button key={i} className={(answers[i] != null ? 'on' : '') + (i === k ? ' cur' : '')} aria-current={i === k} aria-label={`Question ${i + 1}${answers[i] != null ? ', answered' : ''}`} onClick={() => setK(i)}>
              {i + 1}
            </button>
          ))}
        </nav>
      )}
      <div className="qcard" key={q.id + k}>
        <span className="lbl">{KIND_LABEL[q.kind]}</span>
        <Html as="div" className="qtext" html={q.q} />
        {q.code && <Code src={q.code} lang={q.lang} />}
        <div className="opts" role="group" aria-label="Answers">
          {q.opts.map((o, i) => {
            const cls = reveal ? (i === q.a ? ' right' : i === given ? ' wrong' : '') : given === i ? ' picked' : '';
            return (
              <button key={i} className={'opt' + cls} aria-pressed={given === i} disabled={reveal || locked} onClick={() => choose(i)}>
                <span className="lt">{'ABCD'[i]}</span>
                <Html html={o} />
              </button>
            );
          })}
        </div>
        {reveal && !sprint && (
          <div className="why" role="status">
            <b>{given === q.a ? 'Correct.' : 'Not quite.'}</b> <Html html={q.why ?? ''} />
          </div>
        )}
      </div>
      {!sprint && (
        <div className="runfoot">
          {!instant && <button className="btn" disabled={k === 0} onClick={() => go(-1)}>Previous</button>}
          {k < qs.length - 1 ? (
            <button className="btn ink" disabled={instant && given == null} onClick={() => go(1)}>Next</button>
          ) : (
            <button className="btn ink" disabled={instant && given == null} onClick={submit}>{instant ? 'See results' : 'Submit'}</button>
          )}
          {!instant && k < qs.length - 1 && <button className="btn ghost" onClick={submit}>Submit now</button>}
          <span className="muted kbd-hint">Keys 1–4 answer{!instant ? ', arrows move' : ''}.</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- Parsons runner ---------------- */

function ParsonsRunner({ set, onDone, onQuit }: { set: ParsonsProblem[]; onDone: (o: Outcome) => void; onQuit: () => void }) {
  const [k, setK] = useState(0);
  const p = set[k];
  const [order, setOrder] = useState<number[]>(() => scramble(p));
  const [sel, setSel] = useState(0);
  const [state, setState] = useState<'work' | 'wrong' | 'right' | 'shown'>('work');
  const results = useRef<{ p: ParsonsProblem; firstTry: boolean }[]>([]);
  const checks = useRef(0);
  const timer = useCountdown(null, () => {});
  const listRef = useRef<HTMLOListElement>(null);

  function scramble(pp: ParsonsProblem) {
    let o = shuffled(pp.lines.map((_, i) => i));
    while (parsonsCorrect(pp, o)) o = shuffled(o);
    return o;
  }
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= order.length || state === 'right' || state === 'shown') return;
    const o = [...order];
    [o[i], o[j]] = [o[j], o[i]];
    setOrder(o);
    setSel(j);
    setState('work');
    requestAnimationFrame(() => (listRef.current?.children[j]?.querySelector('.pl-line') as HTMLElement | null)?.focus());
  };
  const check = () => {
    checks.current++;
    const ok = parsonsCorrect(p, order);
    if (ok) results.current.push({ p, firstTry: checks.current === 1 });
    setState(ok ? 'right' : 'wrong');
  };
  const show = () => {
    results.current.push({ p, firstTry: false });
    setOrder(p.lines.map((_, i) => i));
    setState('shown');
  };
  const next = () => {
    if (k + 1 >= set.length) {
      onDone({ mode: 'parsons', items: [], seconds: timer.elapsedNow(), parsons: results.current });
      return;
    }
    const np = set[k + 1];
    setK(k + 1);
    setOrder(scramble(np));
    setSel(0);
    setState('work');
    checks.current = 0;
  };
  const misplaced = state === 'wrong' ? order.filter((v, i) => p.lines[v] !== p.lines[i]).length : 0;
  return (
    <div className="runner">
      <div className="runbar">
        <span className="lbl ink sq">{MODE_NAME.parsons}</span>
        <span className="lbl tnum">Problem {k + 1} of {set.length}</span>
        <span className="clock tnum" role="timer">{clock(timer.elapsed)}</span>
        <button className="btn sm ghost" onClick={() => window.confirm('Leave? Nothing will be saved.') && onQuit()}>Quit</button>
      </div>
      <div className="qprog" aria-hidden="true"><i style={{ width: `${(100 * k) / set.length}%` }} /></div>
      <div className="qcard">
        <span className="lbl">Python</span>
        <h2 className="qtext">{p.title}</h2>
        <p className="muted" id="pl-help">Put the lines in working order. Select a line, then use the arrow buttons, or Alt + ↑ / ↓ on the keyboard. Indentation is already correct.</p>
        <ol className="pl" ref={listRef} aria-describedby="pl-help">
          {order.map((v, i) => {
            const bad = state === 'wrong' && p.lines[v] !== p.lines[i];
            return (
              <li key={v} className={(sel === i ? 'sel ' : '') + (bad ? 'bad ' : '') + (state === 'right' || state === 'shown' ? 'ok' : '')}>
                <span className="pl-n tnum" aria-hidden="true">{i + 1}</span>
                <button
                  className="pl-line"
                  aria-label={`Line ${i + 1}: ${p.lines[v].trim()}`}
                  onFocus={() => setSel(i)}
                  onClick={() => setSel(i)}
                  onKeyDown={(e) => {
                    if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); move(i, -1); }
                    if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); move(i, 1); }
                  }}
                >
                  <code>{p.lines[v]}</code>
                </button>
                <span className="pl-mv">
                  <button className="pbtn" aria-label={`Move line ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                  <button className="pbtn" aria-label={`Move line ${i + 1} down`} disabled={i === order.length - 1} onClick={() => move(i, 1)}>↓</button>
                </span>
              </li>
            );
          })}
        </ol>
        <div role="status" className={state === 'wrong' ? 'why bad' : state === 'work' ? '' : 'why'}>
          {state === 'wrong' && <><b>Not yet.</b> {misplaced} line{misplaced === 1 ? ' is' : 's are'} in the wrong place (marked).</>}
          {state === 'right' && <><b>Correct.</b> {checks.current === 1 ? 'First try.' : `Solved in ${checks.current} checks.`}</>}
          {state === 'shown' && <><b>Here is a working order.</b> Read it through once before moving on.</>}
        </div>
      </div>
      <div className="runfoot">
        {state === 'right' || state === 'shown' ? (
          <button className="btn ink" onClick={next}>{k + 1 >= set.length ? 'See results' : 'Next problem'}</button>
        ) : (
          <>
            <button className="btn ink" onClick={check}>Check order</button>
            <button className="btn ghost" onClick={show}>Show me</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- report ---------------- */

function Report({ out, onAgain, onHome }: { out: Outcome; onAgain: () => void; onHome: () => void }) {
  const saved = useRef(false);
  const summary = useMemo(() => {
    const byArea: Record<string, [number, number]> = {};
    let right = 0, total = 0;
    if (out.parsons) {
      for (const r of out.parsons) {
        const a = r.p.pattern ? `pat:${r.p.pattern}` : r.p.topic;
        byArea[a] ??= [0, 0];
        byArea[a][1]++;
        total++;
        if (r.firstTry) { byArea[a][0]++; right++; }
      }
    } else {
      for (const { q, given } of out.items) {
        byArea[q.area] ??= [0, 0];
        byArea[q.area][1]++;
        total++;
        if (given === q.a) { byArea[q.area][0]++; right++; }
      }
    }
    return { byArea, right, total, pct: total ? Math.round((100 * right) / total) : 0 };
  }, [out]);
  useEffect(() => {
    if (saved.current || !summary.total) return;
    saved.current = true;
    const r: AssessResult = { ts: Date.now(), mode: out.mode, pct: summary.pct, right: summary.right, total: summary.total, byTopic: summary.byArea };
    useProgress.getState().addAssessment(r);
  }, [summary, out.mode]);
  const rows = reportRows(summary.byArea);
  const missed = out.items.filter(({ q, given }) => given !== q.a);
  const weak = Object.entries(summary.byArea).filter(([, [r, t]]) => r / t < 0.6).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1]).slice(0, 4);
  return (
    <div className="report">
      <div className="rep-head">
        <span className="lbl ink sq">{MODE_NAME[out.mode]} — result</span>
        <div className="rep-score">
          <b className="tnum">{summary.pct}<small>%</small></b>
          <span className="tnum">{summary.right} of {summary.total} {out.parsons ? 'solved on the first check' : 'correct'} · {clock(out.seconds)}</span>
        </div>
        {!summary.total && <p className="muted">No questions were answered, so nothing was saved.</p>}
        <div className="acts">
          <PillButton onClick={onAgain}>Try another</PillButton>
          <PillButton variant="ghost" noArrow onClick={onHome}>All assessments</PillButton>
        </div>
      </div>
      {rows.length > 0 && (
        <section className="rep-sec">
          <h2>By area</h2>
          <div className="rep-rows">
            {rows.map((r) => {
              const p = Math.round((100 * r.right) / r.total);
              return (
                <div className="rep-row" key={r.label}>
                  <span>{r.label}</span>
                  <span className="meter" aria-hidden="true"><i style={{ width: `${p}%` }} /></span>
                  <span className="tnum">{r.right}/{r.total}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
      {weak.length > 0 && (
        <section className="rep-sec">
          <h2>Review next</h2>
          <div className="links rep-links">
            {weak.map(([a]) => <Link key={a} to={areaLink(a)}>{areaTitle(a)}<span aria-hidden="true">↗</span></Link>)}
          </div>
        </section>
      )}
      {missed.length > 0 && (
        <section className="rep-sec">
          <h2>Questions to revisit</h2>
          <ol className="rep-missed">
            {missed.map(({ q, given }) => (
              <li key={q.id}>
                <span className="lbl">{KIND_LABEL[q.kind]} · <Link to={areaLink(q.area)}>{areaTitle(q.area)}</Link></span>
                <Html as="div" className="qtext" html={q.q} />
                {q.code && <Code src={q.code} lang={q.lang} />}
                <p className="ans">
                  {given == null ? <span className="muted">Not answered. </span> : <span className="yours">Your answer: <Html html={q.opts[given]} />. </span>}
                  <span className="correct">Answer: <Html html={q.opts[q.a]} />.</span>
                </p>
                {q.why && <Html as="div" className="why" html={q.why} />}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

/* ---------------- home ---------------- */

function MockSetup({ onStart }: { onStart: (cfg: MockConfig) => void }) {
  const [count, setCount] = useState(20);
  const [minutes, setMinutes] = useState<number | null>(30);
  const [parts, setParts] = useState<PartId[]>([]);
  const [patterns, setPatterns] = useState(true);
  const toggle = (id: PartId) => setParts((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <div className="cfg">
      <fieldset>
        <legend>Questions</legend>
        {[10, 20, 30].map((n) => <button key={n} className="tog" aria-pressed={count === n} onClick={() => setCount(n)}>{n}</button>)}
      </fieldset>
      <fieldset>
        <legend>Time limit</legend>
        {[15, 30, 45].map((n) => <button key={n} className="tog" aria-pressed={minutes === n} onClick={() => setMinutes(n)}>{n} min</button>)}
        <button className="tog" aria-pressed={minutes == null} onClick={() => setMinutes(null)}>Untimed</button>
      </fieldset>
      <fieldset className="wide">
        <legend>Units <span className="muted">({parts.length ? `${parts.length} selected` : 'all'})</span></legend>
        {PARTS.map((p) => <button key={p.id} className="tog" aria-pressed={parts.includes(p.id)} onClick={() => toggle(p.id)}>{p.title}</button>)}
        <button className="tog" aria-pressed={patterns} onClick={() => setPatterns(!patterns)}>Interview patterns</button>
      </fieldset>
      <div><PillButton onClick={() => onStart({ count, minutes, parts, patterns })}>Start mock assessment</PillButton></div>
    </div>
  );
}

const MODES: { id: Mode; blurb: string; meta: string }[] = [
  { id: 'mock', blurb: 'A timed paper mixing concept questions, code tracing, bug spotting, pattern recognition and complexity. Answers are revealed at the end, like a real screen.', meta: '10–30 questions · timed' },
  { id: 'sprint', blurb: 'Sixty seconds. Read a problem description, name the pattern. Trains the first thirty seconds of an interview.', meta: '60 seconds · instant feedback' },
  { id: 'complexity', blurb: 'Twelve running-time and space questions drawn from every topic’s cost table.', meta: '12 questions · instant feedback' },
  { id: 'parsons', blurb: 'Scrambled lines of a classic routine. Put them back in an order that works. Tests whether you know why each line is where it is.', meta: '4 problems · untimed' },
];

function Home({ start, focus }: { start: (m: Mode, cfg?: MockConfig) => void; focus: Mode | null }) {
  const [open, setOpen] = useState<Mode | null>(focus === 'mock' ? 'mock' : null);
  const hist = useProgress((s) => s.data.assess);
  const refs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    if (focus) refs.current[focus]?.scrollIntoView({ block: 'center' });
  }, [focus]);
  return (
    <>
      <header className="phead">
        <span className="lbl ink sq">Assessments</span>
        <h1 className="display">Prove it.</h1>
        <p className="lede">Reading and watching build understanding. Answering under a little pressure shows what has stuck. Results are saved to your progress so you can see the trend.</p>
      </header>
      <div className="modes">
        {MODES.map((m, i) => (
          <section key={m.id} className={'amode' + (focus === m.id ? ' focus' : '')} ref={(el) => { refs.current[m.id] = el; }} aria-labelledby={`m-${m.id}`}>
            <span className="pidx-n tnum">{String(i + 1).padStart(2, '0')}</span>
            <div className="mode-t">
              <h2 id={`m-${m.id}`}>{MODE_NAME[m.id]}</h2>
              <p>{m.blurb}</p>
              <span className="lbl">{m.meta}</span>
            </div>
            <div className="mode-go">
              {m.id === 'mock' ? (
                <PillButton variant={open === 'mock' ? 'ghost' : 'ink'} onClick={() => setOpen(open === 'mock' ? null : 'mock')}>{open === 'mock' ? 'Hide options' : 'Set up'}</PillButton>
              ) : (
                <PillButton onClick={() => start(m.id)}>Start</PillButton>
              )}
            </div>
            {m.id === 'mock' && open === 'mock' && <div className="mode-cfg"><MockSetup onStart={(cfg) => start('mock', cfg)} /></div>}
          </section>
        ))}
      </div>
      <section className="rep-sec" style={{ marginTop: 56 }}>
        <div className="section-head" style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 'clamp(26px,3vw,40px)' }}>History</h2>
          <span className="lbl sq tnum">{hist.length} saved</span>
        </div>
        {hist.length ? (
          <>
            <HistoryChart rows={hist} />
            <table className="htable">
              <thead><tr><th>Date</th><th>Mode</th><th>Score</th></tr></thead>
              <tbody>
                {[...hist].reverse().slice(0, 8).map((r) => (
                  <tr key={r.ts}>
                    <td>{new Date(r.ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{MODE_NAME[r.mode as Mode] ?? r.mode}</td>
                    <td className="tnum">{r.pct}% <span className="muted">({r.right}/{r.total})</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="muted">Finish any assessment and your score appears here.</p>
        )}
      </section>
    </>
  );
}

/* ---------------- page ---------------- */

export function Assess() {
  usePageTitle('Assessments');
  const [params] = useSearchParams();
  const focus = (['mock', 'sprint', 'complexity', 'parsons'] as Mode[]).find((m) => m === params.get('mode')) ?? null;
  const [phase, setPhase] = useState<Phase>({ k: 'home' });
  const last = useRef<{ m: Mode; cfg?: MockConfig }>({ m: 'mock' });

  const start = useCallback((m: Mode, cfg?: MockConfig) => {
    last.current = { m, cfg };
    window.scrollTo({ top: 0 });
    if (m === 'mock') {
      const c = cfg ?? { count: 20, minutes: 30, parts: [], patterns: true };
      setPhase({ k: 'mcq', mode: 'mock', qs: buildMock(c), limit: c.minutes ? c.minutes * 60 : null, instant: false });
    } else if (m === 'sprint') {
      const qs = [...shuffled(patternQuestions()), ...shuffled(patternQuestions())].map((q, i) => ({ ...shuffleOpts(q), id: q.id + '-' + i }));
      setPhase({ k: 'mcq', mode: 'sprint', qs, limit: 60, instant: true });
    } else if (m === 'complexity') {
      setPhase({ k: 'mcq', mode: 'complexity', qs: shuffled(complexityQuestions()).slice(0, 12).map((q) => shuffleOpts(q)), limit: null, instant: true });
    } else setPhase({ k: 'parsons', set: parsonsSet(4) });
  }, []);
  const done = useCallback((out: Outcome) => {
    window.scrollTo({ top: 0 });
    setPhase({ k: 'report', out });
  }, []);
  const home = useCallback(() => setPhase({ k: 'home' }), []);

  return (
    <div className="wrap page">
      {phase.k === 'home' && <Home start={start} focus={focus} />}
      {phase.k === 'mcq' && <McqRunner phase={phase} onDone={done} onQuit={home} />}
      {phase.k === 'parsons' && <ParsonsRunner set={phase.set} onDone={done} onQuit={home} />}
      {phase.k === 'report' && <Report out={phase.out} onAgain={() => start(last.current.m, last.current.cfg)} onHome={home} />}
    </div>
  );
}
