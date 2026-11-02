import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { PillButton } from '../components/Pill';
import { supabase } from '../lib/supabase';
import { deleteAccount, sendMagicLink, signOut, useSession } from '../features/auth/auth';
import { useProgress } from '../features/progress/store';
import { mergeProgress } from '../features/progress/model';
import { usePageTitle } from '../lib/usePageTitle';

function download(name: string, obj: unknown) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [age, setAge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErr('Enter a valid email address.');
    if (!age) return setErr('Confirm your age to continue.');
    setBusy(true);
    const problem = await sendMagicLink(email.trim());
    setBusy(false);
    if (problem) setErr(problem);
    else setSent(true);
  };
  if (sent)
    return (
      <div className="form">
        <p className="ok-msg" role="status">Check your inbox. We sent a sign-in link to {email.trim()}. It works once and expires in about an hour.</p>
        <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => setSent(false)}>Use a different email</button>
      </div>
    );
  return (
    <form className="form" onSubmit={submit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="email" className="lbl ink">Email</label>
        <input id="email" className="field-in" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <label className="check-row" htmlFor="age">
        <input id="age" type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} required />
        <span>I am at least 13 years old (16 if I live in the EU or UK).</span>
      </label>
      <p className="muted" style={{ fontSize: 14 }}>
        We email you a one-time sign-in link, so there is no password. Your email and progress are stored as described in the{' '}
        <Link to="/privacy">privacy page</Link>.
      </p>
      {err && <p className="err" role="alert">{err}</p>}
      <div><PillButton type="submit" disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</PillButton></div>
    </form>
  );
}

export function Account() {
  usePageTitle('Account');
  const session = useSession();
  const data = useProgress((s) => s.data);
  const status = useProgress((s) => s.status);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState('');
  const [askDelete, setAskDelete] = useState(false);
  const [askClear, setAskClear] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const exportData = () =>
    download(`bigowl-data-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedAt: new Date().toISOString(),
      account: session ? { id: session.user.id, email: session.user.email, createdAt: session.user.created_at } : null,
      progress: data,
    });

  const importData = async (f: File) => {
    setErr(null);
    setMsg(null);
    if (f.size > 1_000_000) return setErr('That file is too large to be a BigOwl export.');
    try {
      const parsed = JSON.parse(await f.text());
      const incoming = parsed?.progress ?? parsed;
      if (!incoming || typeof incoming !== 'object' || !('topics' in incoming)) throw new Error('shape');
      const clean = mergeProgress({}, incoming);
      useProgress.getState().mergeIn(clean, true);
      setMsg('Imported. Your best scores from both copies were kept.');
    } catch {
      setErr('That file is not a BigOwl export. Use a file from “Download my data”.');
    }
  };

  return (
    <div className="wrap page">
      <header className="phead">
        <span className="lbl ink sq">Account</span>
        <h1 className="display">{session ? 'Your account.' : 'Save your progress.'}</h1>
        <p className="lede">
          {session
            ? 'Your progress is stored in your account, so it follows you to any browser and survives clearing your history.'
            : 'Sign in to keep your progress safe across devices. Without an account it lives only in this browser and disappears if you clear your history.'}
        </p>
      </header>

      {!supabase && (
        <p className="notice">Accounts are not switched on for this copy of the site yet. Progress is kept in this browser. You can still download and import it below.</p>
      )}

      <div className="account-grid">
        <section aria-labelledby="acct-h">
          <h2 id="acct-h" className="lbl ink sq">{session ? 'Signed in' : 'Sign in'}</h2>
          {session ? (
            <>
              <p style={{ fontSize: 17 }}>{session.user.email}</p>
              <p className="muted" style={{ fontSize: 14 }}>
                Sync status: {status === 'synced' ? 'all changes saved' : status === 'syncing' ? 'saving…' : status === 'offline' ? 'cannot reach the server; changes are kept here and saved when you are back online' : 'ready'}.
              </p>
              <div><PillButton variant="ghost" small noArrow onClick={() => void signOut()}>Sign out</PillButton></div>
              <p className="muted" style={{ fontSize: 13.5 }}>Signing out removes your progress from this browser. It stays safe in your account.</p>
            </>
          ) : supabase ? (
            <SignIn />
          ) : null}
        </section>

        <section aria-labelledby="data-h">
          <h2 id="data-h" className="lbl ink sq">Your data</h2>
          <p className="muted" style={{ fontSize: 14.5 }}>Download everything stored about you as a JSON file, or import a file you downloaded earlier.</p>
          <div className="acts">
            <PillButton small onClick={exportData}>Download my data</PillButton>
            <PillButton small variant="ghost" noArrow onClick={() => fileRef.current?.click()}>Import progress</PillButton>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden aria-label="Import progress file" onChange={(e) => e.target.files?.[0] && void importData(e.target.files[0])} />
          </div>
          {msg && <p className="ok-msg" role="status">{msg}</p>}
          {err && <p className="err" role="alert">{err}</p>}

          <h2 className="lbl ink sq" style={{ marginTop: 18 }}>{session ? 'Delete account' : 'Clear this browser'}</h2>
          {session ? (
            !askDelete ? (
              <div><button className="btn sm" onClick={() => setAskDelete(true)}>Delete my account and data</button></div>
            ) : (
              <div className="notice" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p>This permanently deletes your account, email address and all progress. It cannot be undone. Type <b>delete</b> to confirm.</p>
                <label className="sr-only" htmlFor="confirm-del">Type delete to confirm</label>
                <input id="confirm-del" className="field-in" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
                <div className="acts">
                  <PillButton small disabled={confirm.trim().toLowerCase() !== 'delete'} noArrow
                    onClick={async () => { const e = await deleteAccount(); if (e) setErr(e); }}>
                    Delete permanently
                  </PillButton>
                  <button className="btn sm" onClick={() => { setAskDelete(false); setConfirm(''); }}>Keep my account</button>
                </div>
              </div>
            )
          ) : !askClear ? (
            <div><button className="btn sm" onClick={() => setAskClear(true)}>Clear progress in this browser</button></div>
          ) : (
            <div className="notice acts">
              <span>This erases all progress saved in this browser.</span>
              <button className="btn sm ink" onClick={() => { useProgress.getState().clearAll(); setAskClear(false); setMsg('Cleared.'); }}>Clear it</button>
              <button className="btn sm" onClick={() => setAskClear(false)}>Cancel</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
