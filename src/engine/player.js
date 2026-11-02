import { I, h } from './helpers';
import { CodePanel } from './highlight';
import { Stage } from './stage';

export let activePlayer = null;
document.addEventListener('keydown', e => {
  if (!activePlayer || !document.body.contains(activePlayer.el)) return;
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); activePlayer.next(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); activePlayer.prev(); }
  else if (e.key === ' ' && document.activeElement === document.body) { e.preventDefault(); activePlayer.toggle(); }
});
/**
 * @param {any} topic
 * @param {{ drill?: boolean, onEvent?: (ev: string, x?: any) => void, compact?: boolean, codeLang?: string }} [opts]
 */
export function Player(topic, { drill = false, onEvent, compact = false, codeLang = 'pseudo' } = {}) {
  const V = topic.viz;
  const el = h('div', { class: compact ? 'stage-col' : 'bench' });
  const col = compact ? el : h('div', { class: 'stage-col' });
  let frames = [], i = 0, playing = false, timer = null, speed = 1, predict = drill, answered = {}, tries = 0;
  const stats = { right: 0, total: 0, streak: 0 };
  // input row
  const presets = V.presets || [];
  const inp = h('input', { type: 'text', id: 'in-' + topic.id + (drill ? '-d' : ''), 'aria-label': 'Input for ' + topic.title, spellcheck: 'false' });
  const sel = presets.length > 1 ? h('select', { id: 'ps-' + topic.id + (drill ? '-d' : ''), 'aria-label': 'Example', onchange: () => { const p = presets[+sel.value]; inp.value = p.input; run(); } }, presets.map((p, k) => h('option', { value: k }, p.label))) : null;
  const err = h('div', { class: 'err', hidden: true });
  const inrow = h('div', { class: 'inrow' },
    V.noInput ? null : inp,
    sel,
    V.noInput ? null : h('button', { class: 'btn ink', onclick: () => run() }, 'Run'),
    V.random ? h('button', { class: 'btn', onclick: () => { inp.value = V.random(); if (sel) sel.value = ''; run(); } }, 'Random') : null,
    err);
  if (V.inputHint && !V.noInput) inp.placeholder = V.inputHint;
  const stage = h('div', { class: 'stage', 'aria-live': 'off' });
  const narr = h('div', { class: 'narr', 'aria-live': 'polite' }, h('span', { class: 'stepn tnum' }), h('span', { class: 'msg' }));
  const askbar = h('div', { class: 'askbar', hidden: true });
  const playB = h('button', { class: 'pbtn play', 'aria-label': 'Play', html: I.play, onclick: () => toggle() });
  const prevB = h('button', { class: 'pbtn', 'aria-label': 'Previous step', html: I.prev, onclick: () => prev() });
  const nextB = h('button', { class: 'pbtn', 'aria-label': 'Next step', html: I.next, onclick: () => next() });
  const resetB = h('button', { class: 'pbtn', 'aria-label': 'Restart', html: I.reset, onclick: () => go(0) });
  const scrub = h('input', { type: 'range', class: 'scrub', min: 0, max: 0, value: 0, 'aria-label': 'Step', oninput: () => { if (predict) { scrub.value = i; return; } stop(); go(+scrub.value); } });
  const spd = h('input', { type: 'range', min: -2, max: 2, step: 1, value: 0, 'aria-label': 'Speed', oninput: () => { speed = Math.pow(2, +spd.value); } });
  const predictT = h('button', { class: 'btn sm', 'aria-pressed': String(predict), onclick: () => setPredict(!predict) });
  const score = h('div', { class: 'scorebar', hidden: !drill });
  const controls = h('div', { class: 'controls' }, resetB, prevB, playB, nextB, scrub, h('label', { class: 'speed' }, 'Speed', spd), drill ? null : predictT);
  col.append(inrow, stage, askbar, narr, controls, score);
  let code = null;
  if (!compact && topic.code && topic.code.pseudo) {
    code = CodePanel(topic.code, { lang: codeLang });
    const side = h('div', { class: 'stage-col' }, code.el, V.legend ? h('div', { class: 'legend', html: V.legend }) : null);
    el.append(col, side);
  } else if (!compact) { el.classList.add('solo'); el.append(col); }
  function setPredict(on) {
    predict = on; predictT.setAttribute('aria-pressed', String(on));
    predictT.textContent = on ? 'Predict mode on' : 'Predict the next step';
    predictT.className = 'btn sm' + (on ? ' primary' : '');
    score.hidden = !on; renderScore(); render();
  }
  setPredict(predict);
  function renderScore() {
    const acc = stats.total ? Math.round(100 * stats.right / stats.total) : 0;
    score.innerHTML = '';
    score.append(h('span', null, 'Correct first try ', h('b', null, `${stats.right}/${stats.total}`)), h('span', null, 'Accuracy ', h('b', null, acc + '%')), h('span', null, 'Streak ', h('b', null, stats.streak)));
  }
  function run(input) {
    stop(); err.hidden = true;
    let parsed;
    try { parsed = input !== undefined ? input : V.noInput ? presets[sel ? +sel.value || 0 : 0].input : V.parse ? V.parse(inp.value) : inp.value; }
    catch (e) { err.textContent = e.message; err.hidden = false; return; }
    try { frames = V.run(parsed); } catch (e) { err.textContent = e.message || 'That input did not work.'; err.hidden = false; console.error(e); return; }
    i = 0; answered = {}; scrub.max = frames.length - 1;
    activePlayer = api;
    onEvent && onEvent('run');
    render();
  }
  function pendingAsk() { const f = frames[i + 1]; return predict && f && f.ask && !answered[i + 1] ? f.ask : null; }
  function render() {
    const f = frames[i]; if (!f) return;
    const ask = pendingAsk();
    Stage.render(stage, ask && ask.s ? ask.s : f.s);
    stage.classList.toggle('pickable', !!(ask && ask.pick));
    narr.firstChild.textContent = `${i + 1}/${frames.length}`;
    narr.lastChild.textContent = f.msg || '';
    scrub.value = i;
    prevB.disabled = i === 0; nextB.disabled = i >= frames.length - 1;
    if (code) code.setLine(f.line);
    showAsk(ask);
  }
  function showAsk(ask) {
    askbar.innerHTML = ''; askbar.hidden = !ask; if (!ask) return;
    tries = 0;
    askbar.append(h('div', { class: 'q' }, ask.q));
    const fb = h('div', { class: 'fb' });
    const row = h('div', { class: 'row' });
    if (ask.choices) ask.choices.forEach((c, k) => row.append(h('button', { class: 'btn sm', onclick: () => answer(k === ask.answer, fb, c) }, c)));
    else if (ask.value !== undefined) {
      const vi = h('input', { type: 'text', id: 'ask-v', 'aria-label': 'Your answer', autocomplete: 'off', onkeydown: e => { if (e.key === 'Enter') chk(); } });
      const chk = () => { const a = vi.value.trim(); if (!a) return; const want = ask.value; const ok = typeof want === 'number' ? (a === '∞' || /^inf/i.test(a) ? want === Infinity : Math.abs(Number(a) - want) < 1e-6) : a.toLowerCase().replace(/\s+/g, '') === String(want).toLowerCase().replace(/\s+/g, ''); answer(ok, fb, a); };
      row.append(vi, h('button', { class: 'btn sm ink', onclick: chk }, 'Check'));
      setTimeout(() => vi.focus({ preventScroll: true }), 30);
    } else if (ask.pick) row.append(h('span', { class: 'muted' }, 'Click your answer on the stage above.'));
    row.append(h('button', { class: 'btn sm ghost', onclick: () => reveal(fb) }, 'Show me'));
    askbar.append(row, fb);
  }
  function answer(ok, fb, given) {
    const ask = frames[i + 1].ask;
    if (ok) {
      if (tries === 0) { stats.right++; stats.streak++; } else stats.streak = 0;
      stats.total++; answered[i + 1] = true; renderScore();
      onEvent && onEvent('answer', { ok: tries === 0 });
      i++; render();
      if (playing) schedule();
    } else {
      tries++; if (tries === 1) stats.streak = 0;
      fb.className = 'fb bad'; fb.innerHTML = (ask.hint && tries === 1 ? 'Not quite. Hint: ' + ask.hint : 'Not quite. Try again, or choose "Show me".');
      askbar.classList.remove('shake'); void askbar.offsetWidth; askbar.classList.add('shake');
    }
  }
  function reveal() { stats.total++; stats.streak = 0; answered[i + 1] = true; renderScore(); onEvent && onEvent('answer', { ok: false }); i++; render(); }
  stage.addEventListener('click', e => {
    const ask = pendingAsk(); if (!ask || !ask.pick) return;
    const t = e.target.closest('[data-k]'); if (!t) return;
    const want = [].concat(ask.pick);
    answer(want.includes(t.dataset.k), askbar.querySelector('.fb'), t.dataset.k);
  });
  function go(k) { i = Math.max(0, Math.min(frames.length - 1, k)); render(); }
  function next() { if (pendingAsk()) { askbar.classList.remove('shake'); void askbar.offsetWidth; askbar.classList.add('shake'); stop(); return; } if (i < frames.length - 1) { i++; render(); } else stop(); if (i >= frames.length - 1) { stop(); onEvent && onEvent('end'); } }
  function prev() { stop(); if (i > 0) { i--; render(); } }
  function schedule() { clearTimeout(timer); timer = setTimeout(() => { if (!playing) return; if (pendingAsk()) { stop(); return; } next(); if (playing) schedule(); }, 1000 / speed); }
  function toggle() { if (playing) stop(); else { if (i >= frames.length - 1) go(0); playing = true; playB.innerHTML = I.pause; playB.setAttribute('aria-label', 'Pause'); activePlayer = api; schedule(); } }
  function stop() { playing = false; clearTimeout(timer); playB.innerHTML = I.play; playB.setAttribute('aria-label', 'Play'); }
  const api = { el, run, next, prev, toggle, stop, stats, setInput(v) { inp.value = v; }, get frames() { return frames; } };
  if (presets[0]) inp.value = drill && V.random ? V.random() : presets[0].input;
  return api;
}
