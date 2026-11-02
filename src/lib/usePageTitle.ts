import { useEffect } from 'react';

/** Sets the document title as "<page> · BigOwl", or just "BigOwl" for the home page. */
export function usePageTitle(title: string | null): void {
  useEffect(() => {
    document.title = title ? `${title} · BigOwl` : 'BigOwl';
  }, [title]);
}
