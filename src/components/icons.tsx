type P = { size?: number };
const s = (size = 16) => ({ width: size, height: size, viewBox: '0 0 16 16', 'aria-hidden': true as const });

export const ArrowUpRight = ({ size }: P) => (
  <svg {...s(size)}><path d="M5 11 11 5M6 5h5v5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
);
export const ArrowRight = ({ size }: P) => (
  <svg {...s(size)}><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
);
export const ArrowLeft = ({ size }: P) => (
  <svg {...s(size)}><path d="M13 8H3M7 4 3 8l4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
);
export const Bookmark = ({ size }: P) => (
  <svg {...s(size)}><path d="M4.5 2.5h7v11L8 10.5l-3.5 3z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" /></svg>
);
export const Search = ({ size }: P) => (
  <svg {...s(size)}><circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.6" fill="none" /><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
export const Sun = ({ size }: P) => (
  <svg {...s(size)}><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
);
export const Moon = ({ size }: P) => (
  <svg {...s(size)}><path d="M13 9.6A5.4 5.4 0 0 1 6.4 3a5.4 5.4 0 1 0 6.6 6.6z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" /></svg>
);
export const Close = ({ size }: P) => (
  <svg {...s(size)}><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
export const User = ({ size }: P) => (
  <svg {...s(size)}><circle cx="8" cy="5.5" r="2.8" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M2.8 14c.7-2.6 2.8-4 5.2-4s4.5 1.4 5.2 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
);
export const Mark = () => (
  <svg width="24" height="22" viewBox="0 0 24 22" aria-hidden="true">
    <path d="M3 4.5 6.5 7M21 4.5 17.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="2.6" y="7.4" width="8.6" height="8.6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <rect x="12.8" y="7.4" width="8.6" height="8.6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <rect x="5.4" y="10.2" width="3" height="3" fill="var(--blue)" />
    <rect x="15.6" y="10.2" width="3" height="3" fill="currentColor" />
  </svg>
);
