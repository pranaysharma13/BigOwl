import { useEffect, useRef } from 'react';

/**
 * Hosts an imperative widget (the visualization engine renders plain DOM).
 * `build` receives an empty container and may return a cleanup function.
 */
export function Mount({
  build,
  deps = [],
  className,
}: {
  build: (el: HTMLElement) => void | (() => void);
  deps?: unknown[];
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.replaceChildren();
    const cleanup = build(el);
    return () => {
      if (typeof cleanup === 'function') cleanup();
      el.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <div ref={ref} className={className} />;
}
