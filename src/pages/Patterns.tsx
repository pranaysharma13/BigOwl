import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { PATTERNS, SCENARIOS } from '../content/patterns/patterns';
import { PATTERN_LIST } from '../content/patterns/list';
import { TOPIC } from '../content';
import { Mount } from '../components/Mount';
import { PillButton, PillLink } from '../components/Pill';
import { Player } from '../engine/player';
import { CodePanel } from '../engine/highlight';
import { Quiz } from '../engine/quiz';
import { shuffle } from '../engine/helpers';
import { useProgress } from '../features/progress/store';
import { patternMastery } from '../features/progress/model';
import { usePageTitle } from '../lib/usePageTitle';
import { useInternalLinks } from './TopicPage';
import { NotFound } from './NotFound';

interface Problem { n: number; title: string; diff: 'Easy' | 'Medium' | 'Hard'; slug: string; note?: string }
interface Pattern {
  id: string; title: string; blurb: string; signal: string;
  topics: string[]; when: string[]; idea: string;
  template: { py: string; cpp: string };
  viz?: unknown; seeTopic?: string; problems: Problem[];
}
const ALL = PATTERNS as Pattern[];
const BY_ID: Record<string, Pattern> = Object.fromEntries(ALL.map((p) => [p.id, p]));
export const problemKey = (n: number) => `lc${n}`;
const leetUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;

function useSolvedCount(p: Pattern) {
  return useProgress((s) => p.problems.filter((q) => (s.data.solved[problemKey(q.n)] ?? 0) > 0).length);
}

/* ---------------- index ---------------- */

function PatternRow({ p, i }: { p: Pattern; i: number }) {
  const solved = useSolvedCount(p);
  const item = useProgress((s) => s.data.pats[p.id]);
  const m = Math.round(100 * patternMastery(item, solved, p.problems.length));
  return (
    <Link to={`/patterns/${p.id}`} className="pidx-row">
      <span className="pidx-n tnum">{String(i + 1).padStart(2, '0')}</span>
      <span className="pidx-t">
        <b>{p.title}</b>
        <span>{p.blurb}</span>
      </span>
      <span className="pidx-sig">{p.signal}</span>
      <span className="pidx-meta">
        <span className="tnum">{solved}/{p.problems.length} solved</span>
        <span className="meter" aria-hidden="true"><i style={{ width: `${m}%` }} /></span>
      </span>
    </Link>
  );
}

export function PatternsIndex() {
  usePageTitle('Interview patterns');
  const total = ALL.reduce((s, p) => s + p.problems.length, 0);
  const solved = useProgress((s) => Object.values(s.data.solved).filter((v) => v > 0).length);
  return (
    <div className="wrap page">
      <header className="phead">
        <span className="lbl ink sq">Interview patterns</span>
        <h1 className="display">Recognise the shape.</h1>
        <p className="lede">
          Most coding-round problems are one of a small set of patterns in disguise. Each guide below shows the signals that give a pattern away, the idea behind it, a template in Python and C++, and a ladder of practice problems from easy to hard.
        </p>
        <div className="acts">
          <PillLink to="/assess?mode=sprint">Spot-the-pattern sprint</PillLink>
          <span className="lbl tnum">{solved} of {total} problems marked solved</span>
        </div>
      </header>
      <p className="muted" style={{ maxWidth: '62ch', marginBottom: 18 }}>
        Ordered as a study path: earlier patterns are simpler and show up inside later ones.
      </p>
      <div className="pidx">
        {ALL.map((p, i) => <PatternRow key={p.id} p={p} i={i} />)}
      </div>
      <p className="muted" style={{ fontSize: 14, marginTop: 28, maxWidth: '70ch' }}>
        Problem names and numbers refer to LeetCode and link to it for practice. BigOwl is not affiliated with LeetCode and does not copy problem statements. Problems marked Premium need a LeetCode subscription.
      </p>
    </div>
  );
}

/* ---------------- one pattern ---------------- */

type Tab = 'guide' | 'walkthrough' | 'template' | 'problems';

/** Three spot-the-pattern questions built from the scenario bank, centred on this pattern. */
function spotQuestions(p: Pattern) {
  const title = (id: string) => BY_ID[id]?.title ?? id;
  const SC = SCENARIOS as [string, string][];
  const mine = SC.filter(([, id]) => id === p.id);
  const others: [string, string][] = shuffle(SC.filter(([, id]) => id !== p.id));
  const qs: { q: string; opts: string[]; a: number; why: string }[] = [];
  const decoys = others.slice(0, 3);
  if (mine[0]) {
    qs.push({
      q: `Which problem is most naturally solved with <b>${title(p.id)}</b>?`,
      opts: [mine[0][0], ...decoys.map(([s]) => s)],
      a: 0,
      why: `Signals for ${title(p.id).toLowerCase()}: ${p.signal.charAt(0).toLowerCase() + p.signal.slice(1)}.`,
    });
  }
  for (const [s, id] of [...mine.slice(1), ...others.slice(3, 5)].slice(0, 2)) {
    const wrong = (shuffle(ALL.filter((x) => x.id !== id)) as Pattern[]).slice(0, 3).map((x) => x.title);
    qs.push({ q: `Which pattern fits? ${s}`, opts: [title(id), ...wrong], a: 0, why: `${title(id)}: ${BY_ID[id]?.signal ?? ''}.` });
  }
  return qs;
}

function Guide({ p, go }: { p: Pattern; go: (t: Tab) => void }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const onLink = useInternalLinks();
  useEffect(() => {
    const mark = () => useProgress.getState().mark(p.id, 'r', 'pats');
    const timer = setTimeout(mark, 15000);
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && (mark(), io.disconnect()));
    if (sentinel.current) io.observe(sentinel.current);
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [p.id]);
  return (
    <div className="learn">
      <div>
        <section className="signals" aria-labelledby="sig-h">
          <h2 id="sig-h">Reach for it when</h2>
          <ul>{p.when.map((w) => <li key={w}>{w}</li>)}</ul>
        </section>
        {/* First-party static content bundled with the site, never user input. */}
        <article className="prose" onClick={onLink} dangerouslySetInnerHTML={{ __html: p.idea }} />
        <div ref={sentinel} />
        <div className="acts" style={{ marginTop: 28 }}>
          {p.viz ? <PillButton onClick={() => go('walkthrough')}>Watch it run</PillButton> : null}
          <PillButton variant="ghost" onClick={() => go('problems')}>Practice problems</PillButton>
        </div>
      </div>
      <aside className="aside">
        <section>
          <span className="lbl ink sq">Signal</span>
          <p style={{ margin: 0 }}>{p.signal}</p>
        </section>
        <section className="links">
          <span className="lbl ink sq">Theory behind it</span>
          {p.topics.filter((t) => TOPIC[t]).map((t) => <Link key={t} to={`/learn/${t}`}>{TOPIC[t].title}<span aria-hidden="true">↗</span></Link>)}
        </section>
      </aside>
    </div>
  );
}

function Walkthrough({ p }: { p: Pattern }) {
  const pseudoTopic = useMemo(() => ({ id: 'pat-' + p.id, title: p.title, viz: p.viz }), [p]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 28 }}>
      <div className="plate">
        <div className="plate-head"><span className="lbl">Walkthrough — {p.title}</span><span className="lbl sq">Live</span></div>
        <Mount
          className="plate-body"
          deps={[p.id]}
          build={(el) => {
            const pl = Player(pseudoTopic, {
              onEvent: (ev: string, x: { ok: boolean }) => {
                if (ev === 'end') useProgress.getState().mark(p.id, 'v', 'pats');
                if (ev === 'answer') useProgress.getState().drill(p.id, x.ok, 'pats');
              },
            });
            el.append(pl.el);
            requestAnimationFrame(() => pl.run());
            return () => pl.stop();
          }}
        />
      </div>
      <p className="muted" style={{ fontSize: 14 }}>Keyboard: left and right arrows step, space plays and pauses. Turn on predict mode to make each decision yourself.</p>
    </div>
  );
}

function Template({ p }: { p: Pattern }) {
  const lang = useProgress.getState().data.prefs.lang;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 28 }}>
      <p className="muted">A starting point to adapt, not a solution to memorise. The comments mark the decision that makes the pattern work.</p>
      <Mount
        deps={[p.id]}
        build={(el) => {
          const cp = CodePanel(p.template, { lang: lang === 'cpp' ? 'cpp' : 'py', tall: true });
          cp.el.addEventListener('lang', (e: Event) => useProgress.getState().setLang((e as CustomEvent).detail));
          el.append(cp.el);
        }}
      />
    </div>
  );
}

function ProblemRow({ q }: { q: Problem }) {
  const key = problemKey(q.n);
  const solved = useProgress((s) => (s.data.solved[key] ?? 0) > 0);
  const id = `pb-${key}`;
  return (
    <li className={'ladder-row' + (solved ? ' done' : '')}>
      <input type="checkbox" id={id} checked={solved} onChange={() => useProgress.getState().toggleSolved(key)} />
      <label htmlFor={id} className="sr-only">Mark {q.title} as solved</label>
      <span className="tnum ladder-n">{q.n}</span>
      <span className="ladder-t">
        <a href={leetUrl(q.slug)} target="_blank" rel="noopener noreferrer">
          {q.title}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens LeetCode in a new tab)</span>
        </a>
        {q.note && <span className="muted">{q.note}</span>}
      </span>
      <span className={'diff d-' + q.diff.toLowerCase()}>{q.diff}</span>
    </li>
  );
}

function Problems({ p }: { p: Pattern }) {
  const solved = useSolvedCount(p);
  return (
    <div className="practice" style={{ paddingTop: 28 }}>
      <section className="pr-block">
        <div className="section-head" style={{ marginBottom: 6 }}>
          <h2 style={{ fontSize: 'clamp(26px,3vw,40px)' }}>Problem ladder</h2>
          <span className="lbl sq tnum">{solved}/{p.problems.length} solved</span>
        </div>
        <p className="muted">Work down the list. Try each one for 25 minutes before reading a solution, then tick it off here. Your ticks sync with your account.</p>
        <ol className="ladder">{p.problems.map((q) => <ProblemRow key={q.n} q={q} />)}</ol>
      </section>
      <section className="pr-block">
        <div className="section-head" style={{ marginBottom: 6 }}>
          <h2 style={{ fontSize: 'clamp(26px,3vw,40px)' }}>Spot the pattern</h2>
          <span className="lbl sq">3 questions</span>
        </div>
        <Mount
          deps={[p.id]}
          build={(el) => {
            el.append(Quiz(spotQuestions(p), { title: 'Spot the pattern', onDone: (pct: number) => useProgress.getState().quiz(p.id, pct, 'pats') }));
          }}
        />
      </section>
    </div>
  );
}

export function PatternPage() {
  const { id = '' } = useParams();
  const p = BY_ID[id];
  const [params, setParams] = useSearchParams();
  usePageTitle(p ? p.title : 'Not found');
  const item = useProgress((s) => s.data.pats[id]);
  const solved = useProgress((s) => (p ? p.problems.filter((q) => (s.data.solved[problemKey(q.n)] ?? 0) > 0).length : 0));
  useEffect(() => {
    if (p) useProgress.getState().visit(p.id, 'p');
  }, [p]);
  if (!p) return <NotFound />;
  const tabs: [Tab, string][] = [['guide', 'Guide']];
  if (p.viz) tabs.push(['walkthrough', 'Walkthrough']);
  tabs.push(['template', 'Template'], ['problems', 'Problems']);
  const tab = (tabs.find(([k]) => k === params.get('tab'))?.[0] ?? 'guide') as Tab;
  const go = (k: Tab) => {
    setParams(k === 'guide' ? {} : { tab: k });
    window.scrollTo({ top: 0 });
  };
  const idx = ALL.indexOf(p);
  const prev = ALL[idx - 1], next = ALL[idx + 1];
  const m = Math.round(100 * patternMastery(item, solved, p.problems.length));
  const counts = (['Easy', 'Medium', 'Hard'] as const).map((d) => [d, p.problems.filter((q) => q.diff === d).length] as const).filter(([, n]) => n);
  return (
    <div className="wrap page">
      <header className="phead">
        <div className="crumbs">
          <Link className="lbl" to="/patterns">Patterns</Link>
          <span className="lbl" aria-hidden="true">/</span>
          <span className="lbl ink sq">Pattern {String(idx + 1).padStart(2, '0')} of {PATTERN_LIST.length}</span>
        </div>
        <div className="row">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, flex: '1 1 520px' }}>
            <h1 className="display">{p.title}</h1>
            <p className="lede">{p.blurb}</p>
          </div>
          <div className="acts">
            <div className="ring" style={{ ['--p' as string]: m }} data-v={`${m}%`} role="img" aria-label={`${m}% progress on this pattern`} />
          </div>
        </div>
        <div className="chips">
          {counts.map(([d, n]) => <span className="chip" key={d}>{d} <b>{n}</b></span>)}
          <span className="chip">Solved <b>{solved}/{p.problems.length}</b></span>
        </div>
      </header>
      <div className="tabs" role="tablist" aria-label="Pattern sections">
        {tabs.map(([k, label], i) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => go(k)}>
            <i>{String(i + 1).padStart(2, '0')}</i>{label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'guide' && <Guide p={p} go={go} />}
        {tab === 'walkthrough' && <Walkthrough p={p} />}
        {tab === 'template' && <Template p={p} />}
        {tab === 'problems' && <Problems p={p} />}
      </div>
      <nav className="pager" aria-label="Previous and next pattern">
        {prev ? <Link to={`/patterns/${prev.id}`}><span className="lbl">Previous</span><b>{prev.title}</b></Link> : <span />}
        {next ? <Link to={`/patterns/${next.id}`}><span className="lbl">Next</span><b>{next.title}</b></Link> : <span />}
      </nav>
    </div>
  );
}
