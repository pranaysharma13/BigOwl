import { useEffect, useMemo, useRef, type MouseEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { TOPIC, TOPICS, partOf, type Topic } from '../content';
import { PATTERN_LIST } from '../content/patterns/list';
import { Mount } from '../components/Mount';
import { PillButton } from '../components/Pill';
import { Player } from '../engine/player';
import { CodePanel } from '../engine/highlight';
import { Quiz } from '../engine/quiz';
import { useProgress } from '../features/progress/store';
import { mastery } from '../features/progress/model';
import { usePageTitle } from '../lib/usePageTitle';
import { NotFound } from './NotFound';
import { PATTERN_TOPICS } from '../content/patterns/topicLinks';

type Tab = 'learn' | 'visualize' | 'code' | 'practice';

/** Routes clicks on internal links inside first-party HTML content through the router. */
export function useInternalLinks() {
  const nav = useNavigate();
  return (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a');
    const href = a?.getAttribute('href');
    if (a && href && href.startsWith('/') && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      nav(href);
    }
  };
}

function figNo(t: Topic) {
  const p = partOf(t);
  return `${p.n}.${TOPICS.filter((x) => x.part === t.part).indexOf(t) + 1}`;
}

function Learn({ t, go }: { t: Topic; go: (tab: Tab) => void }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const onLink = useInternalLinks();
  useEffect(() => {
    const mark = () => useProgress.getState().mark(t.id, 'r');
    const timer = setTimeout(mark, 20000);
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && (mark(), io.disconnect()));
    if (sentinel.current) io.observe(sentinel.current);
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [t.id]);
  const used = TOPICS.filter((x) => (x.prereq ?? []).includes(t.id));
  const pats = PATTERN_LIST.filter((p) => (PATTERN_TOPICS[p.id] ?? []).includes(t.id));
  return (
    <div className="learn">
      <div>
        {/* Theory text is first-party static content bundled with the site, never user input. */}
        <article className="prose" onClick={onLink} dangerouslySetInnerHTML={{ __html: t.learn ?? '' }} />
        <div ref={sentinel} />
        <div className="acts" style={{ marginTop: 28 }}>
          {(t.viz || t.custom) && <PillButton onClick={() => go('visualize')}>Watch it run</PillButton>}
          {t.quiz && <PillButton variant="ghost" onClick={() => go('practice')}>Test yourself</PillButton>}
        </div>
      </div>
      <aside className="aside">
        {t.cx && (
          <section>
            <span className="lbl ink sq">Cost</span>
            <dl className="cx-list">
              {t.cx.map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        {t.props && (
          <section>
            <span className="lbl ink sq">Properties</span>
            <div className="chips">{t.props.map((p) => <span className="chip" key={p}>{p}</span>)}</div>
          </section>
        )}
        {!!t.prereq?.length && (
          <section className="links">
            <span className="lbl ink sq">Builds on</span>
            {t.prereq.filter((p) => TOPIC[p]).map((p) => <Link key={p} to={`/learn/${p}`}>{TOPIC[p].title}<span aria-hidden="true">↗</span></Link>)}
          </section>
        )}
        {!!used.length && (
          <section className="links">
            <span className="lbl ink sq">Leads to</span>
            {used.map((x) => <Link key={x.id} to={`/learn/${x.id}`}>{x.title}<span aria-hidden="true">↗</span></Link>)}
          </section>
        )}
        {!!pats.length && (
          <section className="links">
            <span className="lbl ink sq">Interview patterns</span>
            {pats.map((p) => <Link key={p.id} to={`/patterns/${p.id}`}>{p.title}<span aria-hidden="true">↗</span></Link>)}
          </section>
        )}
      </aside>
    </div>
  );
}

function Visualize({ t }: { t: Topic }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 28 }}>
      {t.custom && (
        <div className="plate">
          <div className="plate-head"><span className="lbl">Fig. {figNo(t)} — {t.title}</span><span className="lbl">Interactive</span></div>
          <Mount
            className="plate-body"
            deps={[t.id]}
            build={(el) => {
              t.custom!(el);
              useProgress.getState().mark(t.id, 'v');
            }}
          />
        </div>
      )}
      {t.viz && (
        <div className="plate">
          <div className="plate-head"><span className="lbl">Fig. {figNo(t)} — {t.title}</span><span className="lbl sq">Live</span></div>
          <Mount
            className="plate-body"
            deps={[t.id]}
            build={(el) => {
              const pl = Player(t, {
                onEvent: (ev: string, x: { ok: boolean }) => {
                  if (ev === 'end') useProgress.getState().mark(t.id, 'v');
                  if (ev === 'answer') useProgress.getState().drill(t.id, x.ok);
                },
              });
              el.append(pl.el);
              const exs = (t.viz!.presets ?? []).filter((p) => p.note);
              if (exs.length) {
                const box = document.createElement('div');
                box.className = 'examples';
                const head = document.createElement('div');
                head.className = 'lbl ink sq';
                head.style.margin = '22px 0 6px';
                head.textContent = 'Examples to try';
                box.append(head);
                for (const p of exs) {
                  const row = document.createElement('div');
                  row.className = 'prob';
                  row.style.gridTemplateColumns = 'minmax(0,1fr) auto';
                  const txt = document.createElement('div');
                  const b = document.createElement('b');
                  b.textContent = p.label;
                  const d = document.createElement('div');
                  d.className = 'muted';
                  d.style.fontSize = '14px';
                  d.textContent = p.note ?? '';
                  txt.append(b, d);
                  const btn = document.createElement('button');
                  btn.className = 'btn sm';
                  btn.textContent = 'Load';
                  btn.onclick = () => {
                    if (!t.viz!.noInput) pl.setInput(p.input);
                    pl.run(t.viz!.noInput ? p.input : undefined);
                    pl.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  };
                  row.append(txt, btn);
                  box.append(row);
                }
                el.append(box);
              }
              requestAnimationFrame(() => pl.run());
              return () => pl.stop();
            }}
          />
        </div>
      )}
      {t.viz && <p className="muted" style={{ fontSize: 14 }}>Keyboard: left and right arrows step, space plays and pauses. Turn on predict mode to answer at each checkpoint.</p>}
    </div>
  );
}

function CodeTab({ t }: { t: Topic }) {
  const lang = useProgress.getState().data.prefs.lang ?? 'py';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 28 }}>
      <p className="muted">Pseudocode uses the book’s conventions (arrays start at 1, ← is assignment) in our own notation. Python and C++ are 0-indexed and ready to paste into an editor or a judge.</p>
      <Mount
        deps={[t.id]}
        build={(el) => {
          const cp = CodePanel(t.code, { lang, tall: true });
          cp.el.addEventListener('lang', (e: Event) => {
            const l = (e as CustomEvent).detail;
            if (l !== 'pseudo') useProgress.getState().setLang(l);
          });
          el.append(cp.el);
        }}
      />
    </div>
  );
}

function Practice({ t }: { t: Topic }) {
  const drill = t.viz && t.viz.random && t.viz.drill !== false;
  return (
    <div className="practice" style={{ paddingTop: 28 }}>
      {drill && (
        <section className="pr-block">
          <div className="section-head" style={{ marginBottom: 6 }}>
            <h2 style={{ fontSize: 'clamp(26px,3vw,40px)' }}>Trace it yourself</h2>
            <span className="lbl sq">Predict mode</span>
          </div>
          <p className="muted">A fresh random input every run. At each checkpoint the algorithm stops and asks what happens next: answer on the figure or in the box. Press Random for a new problem.</p>
          <div className="plate">
            <div className="plate-head"><span className="lbl">Drill — {t.title}</span><span className="lbl">Scored</span></div>
            <Mount
              className="plate-body"
              deps={[t.id]}
              build={(el) => {
                const pl = Player(t, { drill: true, onEvent: (ev: string, x: { ok: boolean }) => ev === 'answer' && useProgress.getState().drill(t.id, x.ok) });
                el.append(pl.el);
                requestAnimationFrame(() => pl.run());
                return () => pl.stop();
              }}
            />
          </div>
        </section>
      )}
      {t.practice && <Mount className="pr-block" deps={[t.id]} build={(el) => t.practice!(el)} />}
      {t.quiz && (
        <section className="pr-block">
          <div className="section-head" style={{ marginBottom: 6 }}>
            <h2 style={{ fontSize: 'clamp(26px,3vw,40px)' }}>Concept check</h2>
            <span className="lbl sq">{t.quiz.length} questions</span>
          </div>
          <Mount deps={[t.id]} build={(el) => { el.append(Quiz(t.quiz, { onDone: (pct: number) => useProgress.getState().quiz(t.id, pct) })); }} />
        </section>
      )}
    </div>
  );
}

export function TopicPage() {
  const { id = '' } = useParams();
  const t = TOPIC[id];
  const [params, setParams] = useSearchParams();
  usePageTitle(t ? t.title : 'Not found');
  const p = useProgress((s) => s.data.topics[id]);
  useEffect(() => {
    if (t) useProgress.getState().visit(t.id, 't');
  }, [t]);
  const tabs = useMemo(() => {
    if (!t) return [];
    const out: [Tab, string][] = [['learn', 'Learn']];
    if (t.viz || t.custom) out.push(['visualize', 'Visualize']);
    if (t.code) out.push(['code', 'Code']);
    if (t.quiz || t.practice || (t.viz?.random && t.viz.drill !== false)) out.push(['practice', 'Practice']);
    return out;
  }, [t]);
  if (!t) return <NotFound />;
  const tab = (tabs.find(([k]) => k === params.get('tab'))?.[0] ?? 'learn') as Tab;
  const go = (k: Tab) => {
    setParams(k === 'learn' ? {} : { tab: k }, { replace: false });
    window.scrollTo({ top: 0 });
  };
  const part = partOf(t);
  const idx = TOPICS.indexOf(t);
  const prev = TOPICS[idx - 1], next = TOPICS[idx + 1];
  const m = Math.round(mastery(p) * 100);
  const learned = (p?.done ?? 0) > 0;
  return (
    <div className="wrap page">
      <header className="phead">
        <div className="crumbs">
          <Link className="lbl" to="/learn">Learn</Link>
          <span className="lbl" aria-hidden="true">/</span>
          <Link className="lbl ink sq" to={`/learn#unit-${part.n}`}>Unit {String(part.n).padStart(2, '0')} — {part.title}</Link>
        </div>
        <div className="row">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, flex: '1 1 520px' }}>
            <h1 className="display">{t.title}</h1>
            <p className="lede">{t.blurb}</p>
          </div>
          <div className="acts">
            <div className="ring" style={{ ['--p' as string]: m }} data-v={`${m}%`} role="img" aria-label={`${m}% mastered`} />
            <PillButton variant={learned ? 'ink' : 'ghost'} small noArrow onClick={() => useProgress.getState().toggleDone(t.id)}>
              {learned ? '✓ Learned' : 'Mark as learned'}
            </PillButton>
          </div>
        </div>
        <div className="chips">
          <span className="chip ref">{t.sec && !t.beyond ? `CLRS ${t.sec}` : t.sec && t.beyond ? `Beyond the book · ${t.sec}` : 'Beyond the book'}</span>
          {(t.cx ?? []).slice(0, 2).map(([k, v]) => <span className="chip" key={k}>{k} <b>{v}</b></span>)}
        </div>
      </header>
      <div className="tabs" role="tablist" aria-label="Topic sections">
        {tabs.map(([k, label], i) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => go(k)}>
            <i>{String(i + 1).padStart(2, '0')}</i>{label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'learn' && <Learn t={t} go={go} />}
        {tab === 'visualize' && <Visualize t={t} />}
        {tab === 'code' && <CodeTab t={t} />}
        {tab === 'practice' && <Practice t={t} />}
      </div>
      <nav className="pager" aria-label="Previous and next topic">
        {prev ? <Link to={`/learn/${prev.id}`}><span className="lbl">Previous</span><b>{prev.title}</b></Link> : <span />}
        {next ? <Link to={`/learn/${next.id}`}><span className="lbl">Next</span><b>{next.title}</b></Link> : <span />}
      </nav>
    </div>
  );
}
