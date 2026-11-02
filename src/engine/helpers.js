export const NS = 'http://www.w3.org/2000/svg';
export function h(tag, p, ...kids) {
  const el = document.createElement(tag);
  if (p) for (const k in p) {
    const v = p[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'hidden') el.hidden = !!v;
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) { if (c == null || c === false) continue; el.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return el;
}
export function sv(tag, p, ...kids) {
  const el = document.createElementNS(NS, tag);
  if (p) for (const k in p) { const v = p[k]; if (v == null || v === false) continue; if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v); else el.setAttribute(k, v); }
  for (const c of kids.flat(Infinity)) { if (c == null || c === false) continue; el.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return el;
}
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const clone = o => structuredClone(o);
export const fmtV = v => v === Infinity ? '∞' : v === -Infinity ? '−∞' : v == null ? '' : (typeof v === 'number' && !Number.isInteger(v)) ? String(+v.toFixed(2)) : String(v);
export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const randArr = (n, lo = 1, hi = 99) => Array.from({ length: n }, () => rnd(lo, hi));
export const uniqArr = (n, lo = 1, hi = 99) => shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => i + lo)).slice(0, n);
export function parseNums(str, { min = 1, max = 40, int = true, lo = -9999, hi = 9999 } = {}) {
  const parts = String(str).split(/[\s,;]+/).filter(Boolean);
  const out = parts.map(p => { const v = Number(p); if (!isFinite(v)) throw new Error(`"${p}" is not a number.`); if (int && !Number.isInteger(v)) throw new Error(`Use whole numbers ("${p}").`); if (v < lo || v > hi) throw new Error(`Keep values between ${lo} and ${hi}.`); return v; });
  if (out.length < min) throw new Error(`Enter at least ${min} number${min > 1 ? 's' : ''}.`);
  if (out.length > max) throw new Error(`Use at most ${max} numbers so the picture stays readable.`);
  return out;
}
export const rangeHl = (from, to, cls, base = {}) => { const o = { ...base }; for (let k = from; k <= to; k++) o[k] = cls; return o; };
export function Rec() { const f = []; return { f, add(s, line, msg, ask) { f.push({ s: clone(s), line, msg, ask }); return this; } }; }
export const I = { // inline icons
  play: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',
  pause: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>',
  next: '<svg width="14" height="14" viewBox="0 0 16 16"><path d="M3 2.5v11l7-5.5zM11 2.5h2.5v11H11z" fill="currentColor"/></svg>',
  prev: '<svg width="14" height="14" viewBox="0 0 16 16"><path d="M13 2.5v11L6 8zM2.5 2.5H5v11H2.5z" fill="currentColor"/></svg>',
  reset: '<svg width="14" height="14" viewBox="0 0 16 16"><path d="M3.2 6.2A5 5 0 1 1 3 9.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M2 2.8v4h4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  copy: '<svg width="14" height="14" viewBox="0 0 16 16"><rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M11 3.5V3a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 0 2 3v6.5A1.5 1.5 0 0 0 3.5 11H4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>',
  check: '<svg width="12" height="12" viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  up: '<svg width="12" height="12" viewBox="0 0 16 16"><path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  down: '<svg width="12" height="12" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
};

let toastT;
export function toast(msg) { document.querySelectorAll('.toast').forEach(t => t.remove()); const t = h('div', { class: 'toast', role: 'status' }, msg); document.body.append(t); clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2200); }
