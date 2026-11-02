import { Link } from 'react-router';
import { PARTS, TOPICS, TOPIC } from '../content';
import { PATTERN_LIST } from '../content/patterns/list';
import { PillLink } from '../components/Pill';
import { ArrowUpRight, Bookmark } from '../components/icons';
import { useProgress } from '../features/progress/store';
import { mastery } from '../features/progress/model';
import { Wordmark } from './home/Wordmark';
import { GlowGraph } from './home/GlowGraph';
import { HeapBlueprint, MiniPredict, MiniRead, MiniWatch } from './home/Blueprints';
import { usePageTitle } from '../lib/usePageTitle';

export function Home() {
  usePageTitle(null);
  const data = useProgress((s) => s.data);
  const last = data.last;
  const lastTo = last ? (last.kind === 'p' ? `/patterns/${last.id}` : `/learn/${last.id}`) : '/learn/insertion-sort';
  const lastTitle = last ? (last.kind === 'p' ? PATTERN_LIST.find((p) => p.id === last.id)?.title : TOPIC[last.id]?.title) : null;

  return (
    <>
      <section className="wrap hero" aria-label="Introduction">
        <div className="hero-top">
          <div className="stmt">
            <p>
              Big O, made visible.
              <br />
              <span className="muted">Data structures and algorithms, built from the textbook up and running in front of you.</span>
            </p>
            <PillLink to={lastTo}>{lastTitle ? `Continue: ${lastTitle}` : 'Start learning'}</PillLink>
          </div>
          <div className="meta">
            <span className="lbl ink sq">{TOPICS.length} topics</span>
            <span className="lbl">{PATTERN_LIST.length} interview patterns</span>
            <span className="lbl">Timed assessments</span>
          </div>
        </div>
        <Wordmark />
        <div className="hero-foot">
          <div className="cap">
            <span className="lbl" style={{ color: 'var(--blue)' }}>Fig. 0 — insertion sort, applied to our own name</span>
            <span className="muted" style={{ fontSize: 14 }}>Click the word to shuffle it again. Every figure on this site runs like this, one step at a time.</span>
          </div>
          <div className="round">
            <Link className="rbtn lg" to={lastTo} aria-label={lastTitle ? `Continue with ${lastTitle}` : 'Start with insertion sort'}>
              <Bookmark size={20} />
            </Link>
            <Link className="rbtn lg" to="/learn" aria-label="Open the contents">
              <ArrowUpRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="night" aria-labelledby="night-h">
        <GlowGraph />
        <div className="wrap night-hero">
          <div className="night-head">
            <span className="lbl sq">Live figure</span>
            <span className="lbl">Breadth-first search</span>
            <span className="lbl">Random geometric graph</span>
            <span className="lbl" style={{ justifySelf: 'end' }}>Lit by distance</span>
          </div>
          <h2 id="night-h" className="serif-xl">
            <b>Watch</b> an algorithm think, then <b>predict</b> its next move.
          </h2>
          <div className="night-body">
            <p>
              Each node lights up when the search reaches it, cooler for near and warmer for far. Every topic on BigOwl has a
              figure like this one that you can step through, rewind and feed your own input, with the pseudocode line
              highlighted as it runs.
            </p>
            <div className="acts">
              <div className="legend-n" aria-hidden="true">
                <span><i style={{ background: '#5c78ff' }} />Near the source</span>
                <span><i style={{ background: '#ff7040' }} />Far</span>
              </div>
              <PillLink to="/learn/bfs" variant="light">Step through BFS</PillLink>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap section" aria-labelledby="method-h">
        <div className="section-head">
          <h2 id="method-h">Read. Watch. Predict.</h2>
          <span className="lbl sq">The method</span>
        </div>
        <div className="cols">
          <div>
            <span className="step-n">01 / Read</span>
            <div className="mini"><MiniRead /></div>
            <h3>The idea, in plain words</h3>
            <p>Short chapters written from the textbook: the intuition, the invariant that makes it correct, and what it costs. Section numbers point to your copy.</p>
          </div>
          <div>
            <span className="step-n">02 / Watch</span>
            <div className="mini"><MiniWatch /></div>
            <h3>The algorithm, running</h3>
            <p>Step forward and back through the book’s own examples or your input. The current pseudocode line lights up, so you see why each move happens.</p>
          </div>
          <div>
            <span className="step-n">03 / Predict</span>
            <div className="mini"><MiniPredict /></div>
            <h3>You, one step ahead</h3>
            <p>Predict mode stops at every decision and asks what comes next. Fresh random input each time, scored, and saved to your progress.</p>
          </div>
        </div>
      </section>

      <section className="wrap section" style={{ paddingTop: 0 }} aria-labelledby="manual-h">
        <div className="section-head">
          <h2 id="manual-h">A reference manual that moves.</h2>
          <span className="lbl sq">Fig. 6.1</span>
        </div>
        <div className="plate-spread">
          <div className="text">
            <p className="dropcap">
              A heap is one structure with two faces. As a tree, every parent outranks its children, so the largest key waits
              at the root. As an array, it needs no pointers at all: the children of slot <i>i</i> sit at 2<i>i</i> and 2<i>i</i> + 1.
            </p>
            <p className="muted" style={{ fontSize: 15 }}>
              Every topic pairs the explanation with drawings like this one, then hands you the controls: pseudocode, Python
              and C++, a concept quiz, and step-by-step practice.
            </p>
            <div><PillLink to="/learn/binary-heap" variant="ghost" small>Open heaps</PillLink></div>
          </div>
          <div className="fig">
            <span className="fig-tag" aria-hidden="true">FIG. 6.1 — MAX-HEAP, TREE AND ARRAY</span>
            <HeapBlueprint />
          </div>
        </div>
      </section>

      <section className="wrap section" style={{ paddingTop: 0 }} aria-labelledby="units-h">
        <div className="section-head">
          <h2 id="units-h">Eight units, in the order they build.</h2>
          <span className="lbl sq">Contents</span>
        </div>
        <div className="units">
          {PARTS.map((p) => {
            const ts = TOPICS.filter((t) => t.part === p.id);
            const m = ts.length ? Math.round((100 * ts.reduce((s, t) => s + mastery(data.topics[t.id]), 0)) / ts.length) : 0;
            return (
              <Link key={p.id} to={`/learn#unit-${p.n}`} className="unit">
                <span className="n"><span>UNIT {String(p.n).padStart(2, '0')}</span><span>{ts.length} topics</span></span>
                <h3>{p.title}</h3>
                <p>{ts.slice(0, 5).map((t) => t.title).join(', ')}{ts.length > 5 ? '…' : ''}</p>
                <span className="bar-p" aria-label={`${m}% mastered`}><i style={{ width: `${m}%` }} /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="night section" aria-labelledby="iv-h">
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <div className="outline" aria-hidden="true">INTERVIEW</div>
          <div className="night-body" style={{ alignItems: 'start' }}>
            <h2 id="iv-h" className="serif-xl" style={{ gridColumn: '1 / span 3', fontSize: 'clamp(30px,3.6vw,52px)', maxWidth: '22ch' }}>
              Twenty-one patterns cover <b>most coding rounds.</b>
            </h2>
            <div className="acts" style={{ alignSelf: 'end' }}>
              <PillLink to="/assess" variant="light">Take an assessment</PillLink>
            </div>
          </div>
          <div className="pat-rows">
            {PATTERN_LIST.slice(0, 7).map((p, i) => (
              <Link key={p.id} to={`/patterns/${p.id}`} className="pat-row">
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <b>{p.title}</b>
                <span>{p.signal}</span>
                <span className="go" aria-hidden="true"><ArrowUpRight /></span>
              </Link>
            ))}
          </div>
          <div><PillLink to="/patterns" variant="light" small>All {PATTERN_LIST.length} patterns</PillLink></div>
        </div>
      </section>
    </>
  );
}
