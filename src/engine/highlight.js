import { I, esc, h, toast } from './helpers';

export const KW = {
  py: new Set('def return if elif else for while in not and or is class import from as with lambda yield pass break continue global nonlocal try except finally raise del assert'.split(' ')),
  cpp: new Set('int long double float bool char void auto const return if else for while do break continue struct class public private template typename using namespace std vector string new delete static unsigned size_t pair map unordered_map set unordered_set queue stack deque priority_queue sizeof inline operator this array greater less function tuple multiset list min max swap sort reverse'.split(' ')),
  pseudo: new Set('for to downto while if else return and or not do then repeat until error each in by swap allocate mod'.split(' ')),
};
export const CONSTS = new Set(['nil', 'red', 'black', 'white', 'gray', 'prime', 'composite', 'NIL', 'TRUE', 'FALSE', 'None', 'True', 'False', 'nullptr', 'true', 'false', 'INT_MAX', 'INT_MIN', 'LLONG_MAX', 'inf']);
export function hlLine(line, lang) {
  if (lang === 'cpp' && /^\s*#/.test(line)) return `<span class="tk-k">${esc(line)}</span>`;
  const re = lang === 'py'
    ? /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+)|([\s\S])/g
    : lang === 'cpp'
      ? /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+)|([\s\S])/g
      : /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+|[A-Za-z_][\w']*)|(\s+)|([\s\S])/g;
  let out = '', m;
  while ((m = re.exec(line))) {
    const [t, com, str, num, id] = m;
    if (com) out += `<span class="tk-c">${esc(com)}</span>`;
    else if (str) out += `<span class="tk-s">${esc(str)}</span>`;
    else if (num) out += `<span class="tk-n">${num}</span>`;
    else if (id) {
      const after = line.slice(re.lastIndex);
      if (CONSTS.has(id)) out += `<span class="tk-n">${id}</span>`;
      else if (KW[lang] && KW[lang].has(id)) out += `<span class="tk-k">${id}</span>`;
      else if (lang === 'pseudo' && /^[A-Z][A-Z0-9]*(-[A-Z0-9]+)*$/.test(id) && (id.length > 3 || id.includes('-') || /^\(/.test(after))) {
        out += `<span class="tk-p">${id.toLowerCase().replace(/(^|-)([a-z])/g, (_, a, b) => a + b.toUpperCase())}</span>`;
      } else if (/^\s*\(/.test(after)) out += `<span class="tk-f">${id}</span>`;
      else out += esc(id);
    } else out += esc(t);
  }
  return out;
}
export function codeBlock(src, lang, { numbers = true } = {}) {
  const pre = h('pre', { class: 'code' });
  src.replace(/\n+$/, '').split('\n').forEach((ln, i) => {
    pre.append(h('div', { class: 'ln', 'data-l': i + 1 }, h('i', null, numbers ? i + 1 : ''), h('span', { html: hlLine(ln, lang) || ' ' })));
  });
  return pre;
}
export async function copyText(text, btn) {
  try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); }
  catch { const ta = h('textarea', { style: { position: 'fixed', opacity: 0 } }); ta.value = text; document.body.append(ta); ta.select(); try { document.execCommand('copy'); toast('Copied to clipboard'); } catch { toast('Select the code and copy it manually'); } ta.remove(); }
}
export const LANG_NAMES = { pseudo: 'Pseudocode', py: 'Python', cpp: 'C++' };
export function CodePanel(code, { lang = 'pseudo', title, langs, tall = false } = {}) {
  langs = langs || ['pseudo', 'py', 'cpp'].filter(l => code[l]);
  if (!langs.includes(lang)) lang = langs[0];
  const box = h('div', { class: 'codebox' + (tall ? ' code-tall' : '') });
  const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Language' });
  const body = h('div');
  let cur = lang, line = 0;
  const btns = langs.map(l => h('button', { 'aria-pressed': String(l === cur), onclick: () => set(l) }, LANG_NAMES[l]));
  seg.append(...btns);
  const copy = h('button', { class: 'btn ghost sm', html: I.copy + '<span>Copy</span>', onclick: () => copyText(code[cur]) });
  box.append(h('div', { class: 'bar' }, title ? h('span', { class: 'ttl' }, title) : seg, title ? seg : null, copy));
  if (title) { box.querySelector('.bar').append(copy); }
  box.append(body);
  function set(l) { cur = l; btns.forEach((b, i) => b.setAttribute('aria-pressed', String(langs[i] === l))); body.innerHTML = ''; body.append(codeBlock(code[l], l)); setLine(line); box.dispatchEvent(new CustomEvent('lang', { detail: l })); }
  function setLine(n) {
    line = n; body.querySelectorAll('.ln.on').forEach(e => e.classList.remove('on'));
    if (cur !== 'pseudo' || !n) return;
    const ns = Array.isArray(n) ? n : [n];
    let first;
    ns.forEach(k => { const e = body.querySelector(`.ln[data-l="${k}"]`); if (e) { e.classList.add('on'); first = first || e; } });
    if (first) { const pre = body.querySelector('pre'); const top = first.offsetTop - pre.clientHeight / 2; if (first.offsetTop < pre.scrollTop || first.offsetTop > pre.scrollTop + pre.clientHeight - 30) pre.scrollTo({ top, behavior: 'smooth' }); }
  }
  set(cur);
  return { el: box, setLine, set, get lang() { return cur; } };
}
