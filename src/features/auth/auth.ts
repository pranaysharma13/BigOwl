import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import { useProgress, writeLocal } from '../progress/store';
import type { ProgressData } from '../progress/model';

interface AuthState {
  session: Session | null;
  ready: boolean;
}
export const useAuth = create<AuthState>(() => ({ session: null, ready: !supabase }));

let syncTimer: ReturnType<typeof setTimeout> | undefined;
let writing = false;
let dirty = false;
let lastSyncedRev = -1;

async function pull(userId: string): Promise<void> {
  if (!supabase) return;
  const st = useProgress.getState();
  st.setStatus('syncing');
  const { data, error } = await supabase.from('progress').select('data').eq('user_id', userId).maybeSingle();
  if (error) {
    st.setStatus('offline');
    return;
  }
  // Merge anything done on this device before sign-in into the account, then save the result.
  if (data?.data) useProgress.getState().mergeIn(data.data as Partial<ProgressData>, true);
  else useProgress.getState().mergeIn({}, true);
  await push(userId);
}

async function push(userId: string): Promise<void> {
  if (!supabase) return;
  if (writing) {
    dirty = true;
    return;
  }
  writing = true;
  const st = useProgress.getState();
  st.setStatus('syncing');
  const rev = st.rev;
  const { error } = await supabase
    .from('progress')
    .upsert({ user_id: userId, data: st.data, updated_at: new Date().toISOString() });
  writing = false;
  if (error) {
    useProgress.getState().setStatus('offline');
  } else {
    lastSyncedRev = rev;
    useProgress.getState().setStatus('synced');
  }
  if (dirty) {
    dirty = false;
    void push(userId);
  }
}

/** Starts auth listening and progress syncing. Call once at app start. */
export function startAuthAndSync(): () => void {
  if (!supabase) {
    useProgress.getState().setStatus('unconfigured');
    return () => {};
  }
  const sb = supabase;
  sb.auth.getSession().then(({ data }) => {
    useAuth.setState({ session: data.session, ready: true });
    if (data.session) void pull(data.session.user.id);
  });
  const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
    const prev = useAuth.getState().session;
    useAuth.setState({ session, ready: true });
    if (event === 'SIGNED_IN' && session && prev?.user.id !== session.user.id) void pull(session.user.id);
    if (event === 'SIGNED_OUT') useProgress.getState().setStatus('local');
  });
  const unsubStore = useProgress.subscribe((s, prev) => {
    const session = useAuth.getState().session;
    if (!session || s.rev === prev.rev || s.rev === lastSyncedRev) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => void push(session.user.id), 1200);
  });
  const onOnline = () => {
    const session = useAuth.getState().session;
    if (session) void push(session.user.id);
  };
  window.addEventListener('online', onOnline);
  return () => {
    sub.subscription.unsubscribe();
    unsubStore();
    window.removeEventListener('online', onOnline);
  };
}

export async function sendMagicLink(email: string): Promise<string | null> {
  if (!supabase) return 'Accounts are not configured on this site yet.';
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/account`,
      data: { age_confirmed_at: new Date().toISOString() },
    },
  });
  if (!error) return null;
  if (/rate/i.test(error.message)) return 'Too many sign-in emails were requested. Wait a few minutes and try again.';
  return 'The sign-in email could not be sent. Check the address and try again.';
}

/** Signs out and removes this account's progress from this device, so the next person on a shared computer starts clean. */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  clearTimeout(syncTimer);
  await supabase.auth.signOut();
  useProgress.getState().clearAll();
  writeLocal(null);
}

/** Deletes the account and its progress on the server (cascade), then clears this device. */
export async function deleteAccount(): Promise<string | null> {
  if (!supabase) return 'Accounts are not configured.';
  const { error } = await supabase.rpc('delete_my_account');
  if (error) return 'Your account could not be deleted. Try again, or contact us using the address on the Privacy page.';
  await supabase.auth.signOut();
  useProgress.getState().clearAll();
  return null;
}

export function useSession(): Session | null {
  return useAuth((s) => s.session);
}

/** True when the visitor has the browser online; used for status text. */
export function useOnline(): boolean {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true),
      b = () => setOn(false);
    window.addEventListener('online', a);
    window.addEventListener('offline', b);
    return () => {
      window.removeEventListener('online', a);
      window.removeEventListener('offline', b);
    };
  }, []);
  return on;
}
