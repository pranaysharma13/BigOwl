import { h, shuffle } from './helpers';
import { codeBlock } from './highlight';

export function Quiz(qs, { onDone, title } = {}) {
  const el = h('div', { class: 'quiz' });
  let k = 0, right = 0; const missed = [];
  const order = qs.map(q => ({ ...q, perm: shuffle(q.opts.map((_, i) => i)) }));
  function show() {
    el.innerHTML = '';
    if (k >= order.length) return done();
    const q = order[k];
    el.append(h('div', { class: 'qhead' }, h('span', null, title || 'Check your understanding'), h('span', { class: 'tnum' }, `Question ${k + 1} of ${order.length}`)));
    el.append(h('div', { class: 'qprog' }, h('i', { style: { width: (100 * k / order.length) + '%' } })));
    el.append(h('div', { class: 'qtext', html: q.q }));
    if (q.code) el.append(h('div', { class: 'codebox qcode' }, codeBlock(q.code, q.lang || 'py')));
    const why = h('div', { class: 'why', hidden: true });
    const nextB = h('button', { class: 'btn ink', hidden: true, onclick: () => { k++; show(); } }, k === order.length - 1 ? 'See results' : 'Next question');
    const opts = h('div', { class: 'opts' });
    q.perm.forEach((oi, pos) => {
      const b = h('button', { class: 'opt', onclick: () => {
        opts.querySelectorAll('.opt').forEach(x => x.disabled = true);
        const ok = oi === q.a;
        if (ok) right++; else missed.push(q);
        b.classList.add(ok ? 'right' : 'wrong');
        opts.children[q.perm.indexOf(q.a)].classList.add('right');
        why.hidden = false; why.innerHTML = `<b>${ok ? 'Correct.' : 'Not quite.'}</b> ${q.why || ''}`;
        nextB.hidden = false; nextB.focus({ preventScroll: true });
      } }, h('span', { class: 'lt' }, 'ABCDEFG'[pos]), h('span', { html: q.opts[oi] }));
      opts.append(b);
    });
    el.append(opts, why, h('div', { class: 'qfoot' }, h('span'), nextB));
  }
  function done() {
    const pct = Math.round(100 * right / order.length);
    onDone && onDone(pct, right, order.length);
    el.append(h('div', { class: 'panel result' }, h('div', { class: 'big' }, pct + '%'),
      h('div', { style: { flex: 1, minWidth: '200px' } }, h('div', { class: 'h3' }, `${right} of ${order.length} correct`), h('p', { class: 'muted' }, pct >= 80 ? 'Strong result. This topic counts toward your mastery.' : 'Review the theory tab, then try again. The questions reshuffle each time.')),
      h('button', { class: 'btn', onclick: () => { k = 0; right = 0; missed.length = 0; order.forEach(q => q.perm = shuffle(q.perm)); show(); } }, 'Try again')));
    if (missed.length) {
      el.append(h('div', { class: 'h3' }, 'Review what you missed'));
      missed.forEach(q => el.append(h('div', { class: 'why', html: `<b>${q.q}</b><br>Answer: ${q.opts[q.a]}. ${q.why || ''}` })));
    }
  }
  show();
  return el;
}
