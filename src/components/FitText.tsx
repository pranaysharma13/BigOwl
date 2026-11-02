import { useLayoutEffect, useRef, type ReactNode } from 'react';

/** Scales an element's font size so its natural width exactly fills its parent. */
export function useFitWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const fit = () => {
      el.style.fontSize = '100px';
      const natural = el.scrollWidth;
      const cs = getComputedStyle(parent);
      const target = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (natural > 0) el.style.fontSize = `${(100 * target) / natural}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);
  return ref;
}

export function FitText({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useFitWidth<HTMLDivElement>();
  return (
    <div ref={ref} className={className} aria-hidden="true">
      {children}
    </div>
  );
}
