import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { PARTS, TOPICS } from '../content';
import { PATTERN_LIST } from '../content/patterns/list';
import { Close, Mark, Moon, Sun, User } from '../components/icons';
import { FitText } from '../components/FitText';
import { useProgress } from '../features/progress/store';
import { level } from '../features/progress/model';
import { useSession } from '../features/auth/auth';
import { currentTheme, setTheme, type Theme } from '../lib/theme';

const NAV = [
  ['/', 'Home'],
  ['/learn', 'Learn'],
  ['/patterns', 'Patterns'],
  ['/assess', 'Assess'],
  ['/progress', 'Progress'],
] as const;

function SyncChip() {
  const status = useProgress((s) => s.status);
  const session = useSession();
  const label =
    status === 'unconfigured' || !session
      ? 'On this device'
      : status === 'synced'
        ? 'Synced'
        : status === 'syncing'
          ? 'Syncing'
          : status === 'offline'
            ? 'Offline'
            : 'On this device';
  const cls = session ? status : 'local';
  return (
    <Link to="/account" className={`sync ${cls}`} title={session ? 'Progress is saved to your account' : 'Sign in to save progress to your account'}>
      <i aria-hidden="true" />
      <span>{label}</span>
      <span className="sr-only">. Open account settings.</span>
    </Link>
  );
}

function ThemeButton() {
  const [t, setT] = useState<Theme>(() => currentTheme());
  return (
    <button
      className="rbtn"
      aria-label={t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => {
        const next = t === 'dark' ? 'light' : 'dark';
        setTheme(next);
        setT(next);
      }}
    >
      {t === 'dark' ? <Sun /> : <Moon />}
    </button>
  );
}

function IndexMenu({ onClose }: { onClose: () => void }) {
  const data = useProgress((s) => s.data);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  const results = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const all = [
      ...TOPICS.map((t) => ({ to: `/learn/${t.id}`, title: t.title, sub: t.sec ?? 'Beyond the book', text: `${t.title} ${t.tags ?? ''} ${t.blurb}`.toLowerCase() })),
      ...PATTERN_LIST.map((p) => ({ to: `/patterns/${p.id}`, title: p.title, sub: 'Pattern', text: `${p.title} ${p.blurb} ${p.signal}`.toLowerCase() })),
      { to: '/assess', title: 'Mock assessment', sub: 'Assess', text: 'mock assessment test exam interview timed' },
    ];
    return all.filter((x) => words.every((w) => x.text.includes(w))).slice(0, 12);
  }, [q]);
  return (
    <div className="index" role="dialog" aria-modal="true" aria-label="Index">
      <div className="wrap">
        <div className="top">
          <span className="lbl sq">Index</span>
          <button className="rbtn close" onClick={onClose} aria-label="Close index">
            <Close />
          </button>
        </div>
        <label className="sr-only" htmlFor="index-q">Search topics and patterns</label>
        <input
          id="index-q"
          ref={inputRef}
          className="index-search"
          placeholder="Search: heap, sliding window, Dijkstra…"
          value={q}
          autoComplete="off"
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
            if (e.key === 'Enter' && results[sel]) { nav(results[sel].to); onClose(); }
          }}
        />
        {q.trim() ? (
          <div className="index-results">
            {results.length === 0 && <p className="lbl" style={{ padding: '16px 0' }}>Nothing matches. Try a structure or technique.</p>}
            {results.map((r, i) => (
              <Link key={r.to} to={r.to} onClick={onClose} className={i === sel ? 'sel' : ''}>
                <span>{r.title}</span>
                <span>{r.sub}</span>
              </Link>
            ))}
          </div>
        ) : (
          <>
            <div className="index-links">
              {NAV.map(([to, label]) => (
                <Link key={to} to={to} onClick={onClose} className="pill light sm noarr">{label}</Link>
              ))}
              <Link to="/account" onClick={onClose} className="pill light sm noarr">Account</Link>
            </div>
            <div className="index-grid">
              {PARTS.map((p) => (
                <div className="index-col" key={p.id}>
                  <span className="n">UNIT {String(p.n).padStart(2, '0')}</span>
                  <h3>{p.title}</h3>
                  <ul>
                    {TOPICS.filter((t) => t.part === p.id).map((t) => (
                      <li key={t.id}>
                        <Link to={`/learn/${t.id}`} onClick={onClose}>
                          <span className={`dot s${level(data.topics[t.id])}`} aria-hidden="true" />
                          {t.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <FitText className="big">BIGOWL</FitText>
        <div className="foot-row">
          <div>
            <span className="lbl">Learn</span>
            <Link to="/learn">Contents</Link>
            <Link to="/patterns">Interview patterns</Link>
            <Link to="/assess">Assessments</Link>
          </div>
          <div>
            <span className="lbl">You</span>
            <Link to="/progress">Progress</Link>
            <Link to="/account">Account and data</Link>
          </div>
          <div>
            <span className="lbl">Legal</span>
            <Link to="/privacy">Privacy</Link>
            <Link to="/about">About and credits</Link>
          </div>
          <div>
            <span className="lbl">Notice</span>
            <p>An independent study aid. Not affiliated with or endorsed by MIT Press, the authors of <i>Introduction to Algorithms</i>, or LeetCode.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Layout() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const session = useSession();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !/INPUT|TEXTAREA|SELECT/.test(tag ?? '')) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const isOn = (to: string) => (to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to));
  return (
    <>
      <div className="rules" aria-hidden="true"><div className="wrap"><div /></div></div>
      <div className="app">
        <a className="skip" href="#main">Skip to content</a>
        <header className="topbar">
          <div className="wrap">
            <Link to="/" className="brand" aria-label="BigOwl, home">
              <span className="mark"><Mark /></span>
              <span className="name">BigOwl</span>
            </Link>
            <nav className="nav" aria-label="Main">
              {NAV.map(([to, label], i) => (
                <span key={to} style={{ display: 'contents' }}>
                  {i > 0 && <span className="sep" aria-hidden="true">/</span>}
                  <NavLink to={to} className={isOn(to) ? 'on' : ''} end={to === '/'}>{label}</NavLink>
                </span>
              ))}
            </nav>
            <div className="bar-actions">
              <SyncChip />
              <Link to="/account" className="rbtn" aria-label={session ? 'Your account' : 'Sign in'}><User /></Link>
              <ThemeButton />
              <button className="menu-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
                INDEX <b aria-hidden="true">::</b>
              </button>
            </div>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <Footer />
      </div>
      {open && <IndexMenu onClose={() => setOpen(false)} />}
    </>
  );
}
