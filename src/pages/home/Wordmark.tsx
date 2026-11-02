import { useCallback, useEffect, useRef, useState } from 'react';
import { useFitWidth } from '../../components/FitText';

const WORD = 'BIGOWL';

/** Insertion sort on the letters of the name: the page's one orchestrated motion. */
export function Wordmark({ onDone }: { onDone?: (swaps: number) => void }) {
  const ref = useFitWidth<HTMLDivElement>();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [swaps, setSwaps] = useState<number | null>(null);

  const run = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    clearTimeout(timer.current);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // a scrambled starting order that is never already sorted
    let order = WORD.split('').map((_, i) => i);
    while (order.every((v, i) => v === i)) order = order.sort(() => Math.random() - 0.5);
    if (reduce) order = order.map((_, i) => i);
    el.replaceChildren(
      ...order.map((i) => {
        const s = document.createElement('span');
        s.textContent = WORD[i];
        s.dataset.k = String(i);
        return s;
      }),
    );
    if (reduce) {
      setSwaps(0);
      onDone?.(0);
      return;
    }
    // precompute adjacent swaps of insertion sort
    const a = [...order];
    const steps: number[] = [];
    for (let j = 1; j < a.length; j++) {
      let i = j;
      while (i > 0 && a[i - 1] > a[i]) {
        [a[i - 1], a[i]] = [a[i], a[i - 1]];
        steps.push(i - 1);
        i--;
      }
    }
    setSwaps(null);
    let k = 0;
    const tick = () => {
      if (k >= steps.length) {
        el.querySelectorAll('span').forEach((s) => s.classList.remove('moving'));
        setSwaps(steps.length);
        onDone?.(steps.length);
        return;
      }
      const i = steps[k++];
      const spans = [...el.children] as HTMLElement[];
      const x = spans[i], y = spans[i + 1];
      const rx = x.getBoundingClientRect(), ry = y.getBoundingClientRect();
      el.insertBefore(y, x);
      const nx = x.getBoundingClientRect(), ny = y.getBoundingClientRect();
      spans.forEach((s) => s.classList.remove('moving'));
      y.classList.add('moving');
      x.animate([{ transform: `translateX(${rx.left - nx.left}px)` }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' });
      y.animate(
        [{ transform: `translateX(${ry.left - ny.left}px) translateY(0)` }, { transform: 'translateY(-6%)', offset: 0.5 }, { transform: 'none' }],
        { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
      timer.current = setTimeout(tick, 320);
    };
    timer.current = setTimeout(tick, 650);
  }, [onDone, ref]);

  useEffect(() => {
    const id = requestAnimationFrame(run);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(timer.current);
    };
  }, [run]);

  return (
    <>
      <h1 className="sr-only">BigOwl</h1>
      <div
        ref={ref}
        className="wordmark"
        role="button"
        tabIndex={0}
        aria-label="BigOwl. Activate to shuffle the letters and watch insertion sort put them back."
        onClick={run}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), run())}
        style={{ cursor: 'pointer' }}
      />
      <span className="sr-only" aria-live="polite">{swaps != null ? `Sorted in ${swaps} swaps.` : ''}</span>
    </>
  );
}
