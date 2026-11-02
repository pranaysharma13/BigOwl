import { Rec, h, pick, rnd } from '../../engine/helpers';
import { setPart, topic } from '../registry';
import { rangeHl } from './sorting';

setPart('sel');

/* ---------------- naive & Rabin-Karp ---------------- */
topic({
  id: 'string-matching', title: 'String matching: naive and Rabin–Karp', sec: '§32.1–32.2', prereq: ['hash-tables'],
  blurb: 'Find every occurrence of a pattern in a text by sliding a window, then speed it up with a rolling hash.',
  cx: [['Naive', 'O((n − m + 1)m)'], ['Rabin–Karp expected', 'O(n + m)'], ['Rabin–Karp worst', 'O((n − m + 1)m)']],
  props: ['Rolling hash', 'Spurious hits'],
  tags: 'string matching naive rabin karp rolling hash substring search pattern',
  learn: `
<p>The <b>string-matching problem</b>: given a text <i>T</i>[1..<i>n</i>] and a pattern <i>P</i>[1..<i>m</i>], find every <b>valid shift</b> <i>s</i> such that <i>P</i> occurs in <i>T</i> starting at position <i>s</i> + 1. Text editors, <code>grep</code>, DNA search and plagiarism detection all solve it.</p>
<h3>The naive algorithm</h3>
<p>Try every shift <i>s</i> = 0, 1, …, <i>n</i> − <i>m</i> and compare <i>P</i> with <i>T</i>[<i>s</i> + 1..<i>s</i> + <i>m</i>] character by character. Worst case O((<i>n</i> − <i>m</i> + 1)<i>m</i>), for example <i>T</i> = aⁿ and <i>P</i> = aᵐ. It throws away everything learned at one shift before trying the next.</p>
<h3>Rabin–Karp</h3>
<p>Treat each length-<i>m</i> window as a number in base <i>d</i> (the alphabet size) and compare numbers instead of strings. The window's value can be <b>rolled</b> to the next shift in constant time: drop the leading digit, shift left, add the new digit.</p>
<div class="formula">t<sub>s+1</sub> = ( d (t<sub>s</sub> − T[s+1] · h) + T[s+m+1] ) mod q, &nbsp; where h = d<sup>m−1</sup> mod q</div>
<p>Working modulo a prime <i>q</i> keeps the numbers small, at a price: equal hashes do not guarantee equal strings. A window whose hash matches but whose characters do not is a <b>spurious hit</b>, so every hash match is verified character by character. With a good random prime, spurious hits are rare and the expected time is O(<i>n</i> + <i>m</i>).</p>
<h3>Worked example</h3>
<p>Figure 32.5 searches the digits 2359023141526739921 for 31415 with <i>q</i> = 13. The pattern's value mod 13 is 7. Two windows hash to 7: 31415 (a real match) and 67399 (a spurious hit).</p>
<h3>In interviews</h3>
<ul><li>Find the Index of the First Occurrence (LC 28): naive is accepted; mention KMP or Rabin–Karp.</li><li>Repeated DNA Sequences (LC 187) and Longest Duplicate Substring (LC 1044, binary search plus rolling hash).</li><li>Rolling hashes also detect duplicate substrings and power the sliding-window string problems.</li></ul>`,
  code: {
    pseudo: `naiveStringMatcher(T, P)
  n ← len(T)
  m ← len(P)
  for s ← 0 to n - m
      if P[1..m] = T[s + 1..s + m]
          report a match at shift s

rabinKarpMatcher(T, P, d, q)
  n ← len(T)
  m ← len(P)
  h ← d^(m-1) mod q
  p ← 0
  t0 ← 0
  for i ← 1 to m                  // preprocessing
      p ← (d·p + P[i]) mod q
      t0 ← (d·t0 + T[i]) mod q
  for s ← 0 to n - m              // matching
      if p = ts
          if P[1..m] = T[s + 1..s + m]
              report a match at shift s
      if s < n - m
          ts+1 ← (d·(ts - T[s + 1]·h) + T[s + m + 1]) mod q`,
    py: `def rabin_karp(text, pat, d=256, q=1_000_000_007):
    n, m = len(text), len(pat)
    if m > n:
        return []
    h = pow(d, m - 1, q)
    p = t = 0
    for i in range(m):
        p = (d * p + ord(pat[i])) % q
        t = (d * t + ord(text[i])) % q
    out = []
    for s in range(n - m + 1):
        if p == t and text[s:s + m] == pat:   # verify to rule out spurious hits
            out.append(s)
        if s < n - m:
            t = (d * (t - ord(text[s]) * h) + ord(text[s + m])) % q
    return out

print(rabin_karp("2359023141526739921", "31415"))   # [6]`,
    cpp: `#include <string>
#include <vector>
using namespace std;

vector<int> rabinKarp(const string& T, const string& P) {
    const long long d = 256, q = 1000000007LL;
    int n = T.size(), m = P.size(); vector<int> out;
    if (m > n) return out;
    long long h = 1, p = 0, t = 0;
    for (int i = 0; i < m - 1; i++) h = h * d % q;
    for (int i = 0; i < m; i++) { p = (d * p + P[i]) % q; t = (d * t + T[i]) % q; }
    for (int s = 0; s + m <= n; s++) {
        if (p == t && T.compare(s, m, P) == 0) out.push_back(s);
        if (s + m < n) t = ((d * (t - T[s] * h % q + q)) % q + T[s + m]) % q;
    }
    return out;
}`,
  },
  viz: {
    inputHint: 'naive: text pattern   or   rk: digits pattern q',
    presets: [
      { label: 'Rabin–Karp, Figure 32.5', input: 'rk: 2359023141526739921 31415 13', note: 'Windows hashing to 7 mod 13 are checked; one is a spurious hit.' },
      { label: 'Naive, Figure 32.4', input: 'naive: acaabc aab', note: 'Four shifts, one match at s = 2.' },
      { label: 'Naive, repeated letters', input: 'naive: aaaaab aab', note: 'Many partial matches before each failure.' },
    ],
    random: () => Math.random() < .5 ? `naive: ${Array.from({ length: 10 }, () => pick('ab')).join('')} ${Array.from({ length: 3 }, () => pick('ab')).join('')}` : `rk: ${Array.from({ length: 12 }, () => rnd(0, 9)).join('')} ${Array.from({ length: 3 }, () => rnd(0, 9)).join('')} ${pick([7, 11, 13])}`,
    parse: s => { const m = /^\s*(naive|rk)\s*:\s*(\S+)\s+(\S+)\s*(\d+)?\s*$/i.exec(s); if (!m) throw new Error('Use "naive: text pattern" or "rk: digits pattern q".'); const mode = m[1].toLowerCase(); if (mode === 'rk' && !/^\d+$/.test(m[2] + m[3])) throw new Error('For Rabin–Karp, use digit strings so the hash is easy to follow.'); if (m[2].length > 20 || m[3].length > m[2].length) throw new Error('Keep the text to 20 characters and the pattern no longer than the text.'); return { mode, T: m[2], P: m[3], q: +(m[4] || 13) }; },
    run({ mode, T, P, q }) {
      const R = Rec(); const n = T.length, m = P.length;
      const st = (s, hl = {}, phl = {}, vars) => ({ vars, arrays: [{ name: 'T', label: 'Text T', a: T.split(''), base: 1, hl, small: true }, { name: 'P', label: `Pattern P at shift s = ${s}`, a: [...Array(s).fill(undefined), ...P.split('')].map(x => x === undefined ? '' : x), base: 1, hl: phl, small: true, noIdx: true }] });
      const found = [];
      if (mode === 'naive') {
        R.add(st(0), 4, `Try every shift from 0 to ${n - m}.`);
        for (let s = 0; s <= n - m; s++) {
          let j = 0; while (j < m && T[s + j] === P[j]) j++;
          const ok = j === m;
          const hl = {}, phl = {}; for (let k = 0; k < Math.min(j + 1, m); k++) { const good = k < j; hl[s + k] = good ? 'done' : 'warn'; phl[s + k] = good ? 'done' : 'warn'; }
          if (ok) found.push(s);
          R.add(st(s, hl, phl), 5, ok ? `Shift ${s}: all ${m} characters match. Valid shift.` : `Shift ${s}: mismatch at position ${s + j + 1} after ${j} matching character${j === 1 ? '' : 's'}.`, Math.random() < .5 ? { q: `Is shift ${s} a match?`, choices: ['Yes', 'No'], answer: ok ? 0 : 1 } : null);
        }
      } else {
        const d = 10; const h = Number(BigInt(d) ** BigInt(m - 1) % BigInt(q));
        let p = 0, t = 0; for (let i = 0; i < m; i++) { p = (d * p + +P[i]) % q; t = (d * t + +T[i]) % q; }
        R.add(st(0, {}, {}, { q, h, 'p = P mod q': p }), 13, `Preprocess: P = ${P} gives p = ${P} mod ${q} = ${p}. h = 10^${m - 1} mod ${q} = ${h}.`);
        for (let s = 0; s <= n - m; s++) {
          const win = rangeHl(s, s + m - 1, 'cmp');
          const hit = p === t, real = hit && T.slice(s, s + m) === P;
          if (real) found.push(s);
          R.add(st(s, hit ? rangeHl(s, s + m - 1, real ? 'found' : 'warn') : win, {}, { q, p, 'tₛ': t }), hit ? 15 : 14, hit ? (real ? `Window ${T.slice(s, s + m)} hashes to ${t} = p, and the characters match: valid shift ${s}.` : `Window ${T.slice(s, s + m)} hashes to ${t} = p, but the characters differ: a spurious hit.`) : `Window ${T.slice(s, s + m)} hashes to ${t} ≠ ${p}. Skip without comparing characters.`, Math.random() < .4 ? { q: `The window ${T.slice(s, s + m)} has hash ${t} and p = ${p}. What happens?`, choices: ['Skip: hashes differ', 'Verify: real match', 'Verify: spurious hit'], answer: !hit ? 0 : real ? 1 : 2 } : null);
          if (s < n - m) t = ((d * (t - +T[s] * h) + +T[s + m]) % q + q * 100) % q;
        }
      }
      R.add(st(found[0] ?? 0, Object.fromEntries(found.flatMap(s => Array.from({ length: m }, (_, k) => [s + k, 'found'])))), mode === 'naive' ? 6 : 17, found.length ? `Valid shifts: ${found.join(', ')}.` : 'No occurrences.');
      return R.f;
    },
  },
  quiz: [
    { q: 'The naive matcher’s worst case is…', opts: ['O(n)', 'O(n + m)', 'O((n − m + 1) m)', 'O(n log m)'], a: 2, why: 'Each of n − m + 1 shifts can compare up to m characters.' },
    { q: 'A spurious hit in Rabin–Karp is…', opts: ['a match the algorithm misses', 'a window whose hash equals the pattern’s but whose text differs', 'an overflow', 'a hash of zero'], a: 1, why: 'Hashing mod q maps different strings to the same value.' },
    { q: 'What makes the rolling hash O(1) per shift?', opts: ['Caching', 'Updating the old value by removing the leading digit and appending a new one', 'Sorting', 'Using a trie'], a: 1, why: 'No need to recompute the whole window.' },
  ],
});

/* ---------------- KMP ---------------- */
topic({
  id: 'kmp', title: 'Knuth–Morris–Pratt', sec: '§32.4', prereq: ['string-matching'],
  blurb: 'Never re-read the text: a prefix function tells you how far the pattern can slide after a mismatch.',
  cx: [['Prefix function', 'Θ(m)'], ['Matching', 'Θ(n)'], ['Total', 'Θ(n + m)']],
  props: ['Prefix function π', 'Amortized linear'],
  tags: 'kmp knuth morris pratt prefix function failure function lps string matching',
  learn: `
<p>When the naive matcher fails at some character, it shifts the pattern by one and starts comparing from scratch, even though it already knows what the last few text characters were. KMP uses that knowledge. It precomputes, for every prefix of the pattern, how much of it can be reused after a mismatch.</p>
<h3>The prefix function</h3>
<p>For each <i>q</i>, π[<i>q</i>] is the length of the longest proper prefix of <i>P</i>[1..<i>q</i>] that is also a suffix of it. For <i>P</i> = ababaca (Figure 32.11), π = 0, 0, 1, 2, 3, 0, 1. After matching “ababa” (<i>q</i> = 5) and then failing, the last three text characters “aba” are known to match the first three pattern characters, so matching continues from <i>q</i> = π[5] = 3 without moving backward in the text.</p>
<p><code>computePrefixFunction</code> fills π in Θ(<i>m</i>) using the same trick on the pattern itself: <i>k</i> tracks the current border length, falls back through π[<i>k</i>] on mismatch, and grows by one on a match.</p>
<h3>Matching</h3>
<p><code>kmpMatcher</code> scans the text once with a state <i>q</i> (characters currently matched). On a mismatch it sets <i>q</i> = π[<i>q</i>] repeatedly until the next character can extend the match or <i>q</i> = 0. When <i>q</i> = <i>m</i>, a match ends here; report it and continue with <i>q</i> = π[<i>m</i>].</p>
<div class="note key"><b>Why it is linear.</b> <i>q</i> increases by at most 1 per text character, and every fallback decreases it. It can never decrease more often than it increased, so the total number of fallbacks is at most <i>n</i>. The same amortized argument bounds the prefix-function computation by Θ(<i>m</i>).</div>
<h3>In interviews</h3>
<ul><li>Find the Index of the First Occurrence (LC 28) in guaranteed linear time.</li><li>Shortest Palindrome (LC 214): compute π on <code>s + '#' + reverse(s)</code>.</li><li>Repeated Substring Pattern (LC 459): <i>s</i> is a repeated pattern exactly when π[<i>n</i>] &gt; 0 and <i>p</i> = <i>n</i> − π[<i>n</i>] divides <i>n</i>. Without π[<i>n</i>] &gt; 0, <i>p</i> = <i>n</i> would divide <i>n</i> for every string.</li><li>The Z-algorithm is an alternative with the same linear bound.</li></ul>`,
  code: {
    pseudo: `computePrefixFunction(P)
  m ← len(P)
  allocate π[1..m]
  π[1] ← 0
  k ← 0
  for q ← 2 to m
      while k > 0 and P[k + 1] ≠ P[q]
          k ← π[k]
      if P[k + 1] = P[q]
          k ← k + 1
      π[q] ← k
  return π

kmpMatcher(T, P)
  n ← len(T)
  m ← len(P)
  π ← computePrefixFunction(P)
  q ← 0                           // characters matched so far
  for i ← 1 to n                  // one pass over the text
      while q > 0 and P[q + 1] ≠ T[i]
          q ← π[q]                // fall back
      if P[q + 1] = T[i]
          q ← q + 1               // extend the match
      if q = m                   // full match
          report a match at shift i - m
          q ← π[q]                // continue, allowing overlaps`,
    py: `def prefix_function(p):
    pi = [0] * len(p)
    k = 0
    for q in range(1, len(p)):
        while k and p[k] != p[q]:
            k = pi[k - 1]
        if p[k] == p[q]:
            k += 1
        pi[q] = k
    return pi

def kmp_search(text, p):
    pi, q, out = prefix_function(p), 0, []
    for i, c in enumerate(text):
        while q and p[q] != c:
            q = pi[q - 1]
        if p[q] == c:
            q += 1
        if q == len(p):
            out.append(i - len(p) + 1)
            q = pi[q - 1]
    return out

print(prefix_function("ababaca"))          # [0, 0, 1, 2, 3, 0, 1]
print(kmp_search("bacbababaabcbab", "ababaca"))`,
    cpp: `#include <string>
#include <vector>
using namespace std;

vector<int> prefixFunction(const string& p) {
    vector<int> pi(p.size(), 0);
    for (int q = 1, k = 0; q < (int)p.size(); q++) {
        while (k && p[k] != p[q]) k = pi[k - 1];
        if (p[k] == p[q]) k++;
        pi[q] = k;
    }
    return pi;
}

vector<int> kmp(const string& t, const string& p) {
    vector<int> pi = prefixFunction(p), out;
    for (int i = 0, q = 0; i < (int)t.size(); i++) {
        while (q && p[q] != t[i]) q = pi[q - 1];
        if (p[q] == t[i]) q++;
        if (q == (int)p.size()) { out.push_back(i - q + 1); q = pi[q - 1]; }
    }
    return out;
}`,
  },
  viz: {
    inputHint: 'text pattern',
    presets: [
      { label: 'Figure 32.11 pattern', input: 'abababacaba ababaca', note: 'π for ababaca is 0, 0, 1, 2, 3, 0, 1. One match at shift 2.' },
      { label: 'Overlapping matches', input: 'abababab abab', note: 'Matches at shifts 0, 2 and 4. After each match, q falls back to π[4] = 2, so the next match reuses “ab”.' },
    ],
    random: () => { const P = Array.from({ length: rnd(3, 5) }, () => pick('ab')).join(''); return Array.from({ length: rnd(10, 14) }, () => pick('ab')).join('') + ' ' + P; },
    parse: s => { const p = s.trim().split(/\s+/); if (p.length !== 2) throw new Error('Enter the text and the pattern separated by a space.'); if (p[0].length > 20 || p[1].length > 9 || p[1].length > p[0].length) throw new Error('Text up to 20 characters, pattern up to 9 and no longer than the text.'); return p; },
    run([T, P]) {
      const R = Rec(); const n = T.length, m = P.length; const pi = Array(m).fill(null); pi[0] = 0;
      const pst = (q, k, hl = {}) => ({ vars: { q: q + 1, k }, arrays: [{ name: 'P', label: 'Pattern P', a: P.split(''), base: 1, hl, ptr: { q, ...(k > 0 ? { k: k - 1 } : {}) }, small: true }, { name: 'pi', label: 'π (prefix function)', a: [...pi], base: 1, hl: { [q]: 'cur' }, small: true }] });
      R.add(pst(0, 0), 4, 'π[1] = 0. Now compute π for each longer prefix.');
      let k = 0;
      for (let q = 1; q < m; q++) {
        while (k > 0 && P[k] !== P[q]) { R.add(pst(q, k, { [k]: 'warn', [q]: 'warn' }), 8, `P[${k + 1}] = ${P[k]} ≠ P[${q + 1}] = ${P[q]}: fall back k = π[${k}] = ${pi[k - 1]}.`); k = pi[k - 1]; }
        if (P[k] === P[q]) k++;
        const ask = { q: `What is π[${q + 1}], the longest proper border of "${P.slice(0, q + 1)}"?`, value: k, hint: 'The longest proper prefix that is also a suffix.' };
        pi[q] = k;
        R.add(pst(q, k, { ...rangeHl(0, k - 1, 'done'), ...rangeHl(q - k + 1, q, 'cmp') }), 11, `π[${q + 1}] = ${k}${k ? `: "${P.slice(0, k)}" is both a prefix and a suffix of "${P.slice(0, q + 1)}"` : ''}.`, Math.random() < .55 ? ask : null);
      }
      const tst = (i, q, hl = {}, phl = {}) => ({ vars: { q }, arrays: [{ name: 'T', label: 'Text T', a: T.split(''), base: 1, hl, ptr: { i }, small: true }, { name: 'P', label: 'Pattern aligned at shift ' + (i - q + 1), a: [...Array(Math.max(0, i - q + 1)).fill(''), ...P.split('')].slice(0, n), base: 1, hl: phl, small: true, noIdx: true }, { name: 'pi', label: 'π', a: [...pi], base: 1, small: true }] });
      R.add(tst(0, 0), 19, `π = ${pi.join(', ')}. Scan the text once with q = 0.`);
      let q = 0; const found = [];
      for (let i = 0; i < n; i++) {
        while (q > 0 && P[q] !== T[i]) { const nq = pi[q - 1]; R.add(tst(i, q, { [i]: 'warn' }, { [i]: 'warn' }), 21, `T[${i + 1}] = ${T[i]} ≠ P[${q + 1}] = ${P[q]}: q = π[${q}] = ${nq}. The text pointer stays put.`, { q: `Mismatch with q = ${q}. What does q fall back to?`, value: nq, hint: `π[${q}]` }); q = nq; }
        if (P[q] === T[i]) q++;
        const base = i - q + 1;
        R.add(tst(i, q, rangeHl(base, i, 'done'), rangeHl(base, i, 'done')), 23, q ? `T[${i + 1}] = ${T[i]} extends the match: q = ${q}.` : `T[${i + 1}] = ${T[i]} does not match P[1]: q stays 0.`);
        if (q === m) { found.push(i - m + 1); R.add(tst(i, q, rangeHl(i - m + 1, i, 'found'), rangeHl(i - m + 1, i, 'found')), 25, `q = m: a match at shift ${i - m + 1}. Continue with q = π[${m}] = ${pi[m - 1]}.`); q = pi[m - 1]; }
      }
      R.add(tst(n - 1, q), 19, found.length ? `Matches at shifts ${found.join(', ')}. Each text character was read once.` : 'No matches. Each text character was read once.');
      return R.f;
    },
  },
  quiz: [
    { q: 'What is the prefix function of "aabaaab"?', opts: ['0 1 0 1 2 2 3', '0 1 0 1 2 3 4', '0 0 0 1 2 2 3', '0 1 2 3 4 5 6'], a: 0, why: 'For example π[7] = 3 because "aab" is both a prefix and a suffix of "aabaaab".' },
    { q: 'Why is KMP-MATCHER linear in n?', opts: ['It skips characters', 'q rises at most once per character and every fallback lowers it, so fallbacks total at most n', 'It uses hashing', 'It is not linear'], a: 1, why: 'An amortized (potential) argument on q.' },
    { q: 'After a full match, KMP continues with q = …', opts: ['0', 'm', 'π[m]', 'm − 1'], a: 2, why: 'The longest border of P can start the next, overlapping match.' },
  ],
});

/* ---------------- number theory ---------------- */
topic({
  id: 'number-theory', title: 'GCD and modular arithmetic', sec: '§31.1–31.6', prereq: ['algorithms'],
  blurb: 'Euclid’s algorithm, the extended version that finds modular inverses, and fast modular exponentiation.',
  cx: [['Euclid', 'O(lg b) steps'], ['Modular exponentiation', 'O(lg b) multiplications']],
  props: ['Extended Euclid', 'Repeated squaring'],
  tags: 'gcd euclid extended euclid modular inverse exponentiation fast power prime sieve modulo',
  learn: `
<h3>Greatest common divisor</h3>
<p>Euclid's algorithm rests on one identity: gcd(<i>a</i>, <i>b</i>) = gcd(<i>b</i>, <i>a</i> mod <i>b</i>), with gcd(<i>a</i>, 0) = <i>a</i>. For gcd(30, 21): gcd(21, 9) → gcd(9, 3) → gcd(3, 0) = 3. The arguments shrink at least as fast as Fibonacci numbers decrease (Lamé's theorem), so it takes O(lg <i>b</i>) steps. Consecutive Fibonacci numbers are the worst case.</p>
<h3>Extended Euclid</h3>
<p>The gcd can always be written as a combination <i>d</i> = <i>ax</i> + <i>by</i> with integers <i>x</i>, <i>y</i>. <code>extendedEuclid</code> returns (<i>d</i>, <i>x</i>, <i>y</i>) by unwinding the recursion: if (<i>d</i>, <i>x'</i>, <i>y'</i>) works for (<i>b</i>, <i>a</i> mod <i>b</i>), then (<i>d</i>, <i>y'</i>, <i>x'</i> − ⌊<i>a</i>/<i>b</i>⌋<i>y'</i>) works for (<i>a</i>, <i>b</i>). When gcd(<i>a</i>, <i>n</i>) = 1, the coefficient <i>x</i> is the <b>modular inverse</b> of <i>a</i> mod <i>n</i>, which RSA needs.</p>
<h3>Modular arithmetic</h3>
<p>Arithmetic mod <i>n</i> keeps numbers small: (<i>a</i> + <i>b</i>) mod <i>n</i> and (<i>a</i> · <i>b</i>) mod <i>n</i> can be reduced at every step. Division is multiplication by an inverse, which exists exactly when the divisor is relatively prime to <i>n</i>. The <b>Chinese remainder theorem</b> (Section 31.5) says a system of congruences modulo pairwise coprime moduli has a unique solution modulo their product.</p>
<h3>Modular exponentiation by repeated squaring</h3>
<p>To compute <i>a<sup>b</sup></i> mod <i>n</i>, read the bits of <i>b</i> from most to least significant. For each bit, square the result; if the bit is 1, also multiply by <i>a</i>. That is O(lg <i>b</i>) multiplications instead of <i>b</i>. Figure 31.4 computes 7<sup>560</sup> mod 561 = 1 this way, ten bits, ten steps.</p>
<h3>In interviews</h3>
<ul><li>Pow(x, n) (LC 50) is repeated squaring; watch for negative <i>n</i>.</li><li>Count Primes (LC 204): the sieve of Eratosthenes, O(<i>n</i> log log <i>n</i>).</li><li>Many problems ask for an answer mod 10<sup>9</sup> + 7, a prime, so inverses come from Fermat: <i>a</i><sup>−1</sup> ≡ <i>a</i><sup><i>p</i>−2</sup>.</li><li>Fraction and ratio problems reduce with gcd (Water and Jug Problem, LC 365, is Bézout's identity).</li></ul>`,
  code: {
    pseudo: `euclid(a, b)
  if b = 0
      return a
  else return euclid(b, a mod b)

extendedEuclid(a, b)
  if b = 0
      return (a, 1, 0)
  else (d', x', y') ← extendedEuclid(b, a mod b)
      (d, x, y) ← (d', y', x' - ⌊a/b⌋ y')
      return (d, x, y)

modularExponentiation(a, b, n)
  c ← 0
  d ← 1
  ⟨b_k, ..., b_0⟩ ← bits of b, most significant first
  for i ← k downto 0
      c ← 2c
      d ← (d · d) mod n
      if b_i = 1
          c ← c + 1
          d ← (d · a) mod n
  return d`,
    py: `def gcd(a, b):
    while b:
        a, b = b, a % b
    return a

def ext_gcd(a, b):
    if b == 0:
        return a, 1, 0
    d, x, y = ext_gcd(b, a % b)
    return d, y, x - (a // b) * y

def mod_inverse(a, n):
    d, x, _ = ext_gcd(a, n)
    if d != 1:
        raise ValueError("no inverse")
    return x % n

def mod_pow(a, b, n):               # same as Python's pow(a, b, n)
    result, a = 1, a % n
    while b:
        if b & 1:
            result = result * a % n
        a = a * a % n
        b >>= 1
    return result

def sieve(n):                        # primes below n, LeetCode 204
    is_p = [True] * n
    is_p[0:2] = [False, False]
    for i in range(2, int(n ** 0.5) + 1):
        if is_p[i]:
            is_p[i*i::i] = [False] * len(is_p[i*i::i])
    return [i for i, p in enumerate(is_p) if p]

print(gcd(30, 21), ext_gcd(99, 78), mod_pow(7, 560, 561))   # 3 (3, -11, 14) 1`,
    cpp: `#include <tuple>
#include <vector>
using namespace std;
typedef long long ll;

ll gcd(ll a, ll b) { return b ? gcd(b, a % b) : a; }

tuple<ll,ll,ll> extGcd(ll a, ll b) {
    if (b == 0) return {a, 1, 0};
    auto [d, x, y] = extGcd(b, a % b);
    return {d, y, x - (a / b) * y};
}

ll modPow(ll a, ll b, ll n) {
    ll r = 1; a %= n;
    while (b) { if (b & 1) r = r * a % n; a = a * a % n; b >>= 1; }
    return r;
}

vector<bool> sieve(int n) {
    vector<bool> p(n + 1, true); p[0] = p[1] = false;
    for (int i = 2; (ll)i * i <= n; i++)
        if (p[i]) for (int j = i * i; j <= n; j += i) p[j] = false;
    return p;
}`,
  },
  viz: {
    inputHint: 'gcd a b   or   egcd a b   or   modexp a b n',
    presets: [
      { label: 'Euclid: gcd(30, 21)', input: 'gcd 30 21', note: 'The book’s example: 3.' },
      { label: 'Extended Euclid (Figure 31.1)', input: 'egcd 99 78', note: 'gcd 3 = 99·(−11) + 78·14.' },
      { label: 'Figure 31.4: 7^560 mod 561', input: 'modexp 7 560 561', note: 'Ten bits of 560, ten squarings. The answer is 1.' },
    ],
    random: () => pick([`gcd ${rnd(20, 200)} ${rnd(10, 150)}`, `egcd ${rnd(20, 120)} ${rnd(10, 90)}`, `modexp ${rnd(2, 9)} ${rnd(10, 60)} ${pick([13, 17, 19, 23, 97])}`]),
    parse: s => { const m = /^\s*(gcd|egcd|modexp)\s+(\d+)\s+(\d+)(?:\s+(\d+))?\s*$/i.exec(s); if (!m) throw new Error('Use "gcd 30 21", "egcd 99 78" or "modexp 7 560 561".'); const op = m[1].toLowerCase(); if (op === 'modexp' && !m[4]) throw new Error('modexp needs a, b and n.'); if (+m[2] > 1e6 || +m[3] > 1e6 || (m[4] && +m[4] > 1e5)) throw new Error('Keep numbers below a million (n below 100,000).'); return { op, a: +m[2], b: +m[3], n: m[4] ? +m[4] : null }; },
    run({ op, a, b, n }) {
      const R = Rec();
      if (op === 'gcd' || op === 'egcd') {
        const rows = []; let x = a, y = b;
        while (true) { rows.push({ a: x, b: y, q: y ? Math.floor(x / y) : null }); if (!y) break; [x, y] = [y, x % y]; }
        const cells = () => rows.map(r => [r.a, r.b, r.q ?? '—', r.d ?? '', r.x ?? '', r.y ?? '']);
        const tbl = (hl = {}) => ({ table: { title: op === 'gcd' ? 'EUCLID calls' : 'EXTENDED-EUCLID: call table, then unwinding', colH: op === 'gcd' ? ['a', 'b', '⌊a/b⌋'] : ['a', 'b', '⌊a/b⌋', 'd', 'x', 'y'], cells: op === 'gcd' ? rows.map(r => [r.a, r.b, r.q ?? '—']) : cells(), hl } });
        const shown = [];
        rows.forEach((r, i) => { shown.push(r); R.add({ table: { ...tbl({ [i + ',0']: 'cur', [i + ',1']: 'cur' }).table, cells: (op === 'gcd' ? rows.map(r => [r.a, r.b, r.q ?? '—']) : cells()).slice(0, i + 1) } }, r.b === 0 ? 2 : 4, r.b === 0 ? `b = 0, so the gcd is ${r.a}.` : `${op === 'gcd' ? 'EUCLID' : 'EXTENDED-EUCLID'}(${r.a}, ${r.b}) calls (${r.b}, ${r.a} mod ${r.b} = ${r.a % r.b}).`, i > 0 && Math.random() < .5 ? { q: `Next call after (${rows[i - 1].a}, ${rows[i - 1].b}): what is the second argument, ${rows[i - 1].a} mod ${rows[i - 1].b}?`, value: r.b } : null); });
        if (op === 'egcd') {
          for (let i = rows.length - 1; i >= 0; i--) {
            const r = rows[i];
            if (r.b === 0) { r.d = r.a; r.x = 1; r.y = 0; }
            else { const nx = rows[i + 1]; r.d = nx.d; r.x = nx.y; r.y = nx.x - r.q * nx.y; }
            R.add(tbl({ [i + ',3']: 'cur', [i + ',4']: 'cur', [i + ',5']: 'cur', ...(i < rows.length - 1 ? { [(i + 1) + ',4']: 'cmp', [(i + 1) + ',5']: 'cmp' } : {}) }), r.b === 0 ? 7 : 9, r.b === 0 ? `Base case: (d, x, y) = (${r.a}, 1, 0).` : `x = y' = ${r.x}, y = x' − ⌊${r.a}/${r.b}⌋·y' = ${rows[i + 1].x} − ${r.q}·${rows[i + 1].y} = ${r.y}.`, r.b !== 0 && Math.random() < .5 ? { q: `Unwinding (${r.a}, ${r.b}): x' = ${rows[i + 1].x}, y' = ${rows[i + 1].y}, ⌊a/b⌋ = ${r.q}. What is y?`, value: r.y } : null);
          }
          R.add(tbl({ '0,3': 'found', '0,4': 'found', '0,5': 'found' }), 10, `gcd(${a}, ${b}) = ${rows[0].d} = ${a}·(${rows[0].x}) + ${b}·(${rows[0].y}).${rows[0].d === 1 ? ` So ${a}⁻¹ ≡ ${((rows[0].x % b) + b) % b} (mod ${b}).` : ''}`);
        } else R.add(tbl({ [(rows.length - 1) + ',0']: 'found' }), 2, `gcd(${a}, ${b}) = ${rows[rows.length - 1].a} after ${rows.length - 1} step${rows.length === 2 ? '' : 's'}.`);
      } else {
        const bits = b.toString(2).split('').map(Number); const k = bits.length;
        let c = 0, d = 1; const cs = [], ds = [];
        const tbl = (i, hl = {}) => ({ vars: { a, b, n }, table: { title: `Bits of b = ${b} (most significant first)`, colH: bits.map((_, j) => 'b' + (k - 1 - j)), rowH: ['bit', 'c', 'd'], cells: [bits, [...cs, ...Array(k - cs.length).fill(null)], [...ds, ...Array(k - ds.length).fill(null)]], blankNull: false, hl } });
        R.add(tbl(-1), 15, `Compute ${a}^${b} mod ${n} with ${k} squarings. Start with c = 0 and d = 1.`);
        bits.forEach((bit, i) => {
          c = 2 * c; d = d * d % n; if (bit) { c++; d = d * a % n; }
          cs.push(c); ds.push(d);
          R.add(tbl(i, { [`0,${i}`]: 'cmp', [`1,${i}`]: 'cur', [`2,${i}`]: 'cur' }), bit ? 20 : 17, `Bit ${bit}: square${bit ? ' and multiply by ' + a : ''}. Now c = ${c} and d = ${a}^${c} mod ${n} = ${d}.`, Math.random() < .4 ? { q: `Bit ${bit}. Previous d = ${ds[i - 1] ?? 1}. What is the new d?`, value: d, hint: `d·d mod ${n}${bit ? `, then times ${a} mod ${n}` : ''}` } : null);
        });
        R.add(tbl(k, { [`2,${k - 1}`]: 'found' }), 21, `${a}^${b} mod ${n} = ${d}, using ${k} squarings instead of ${b - 1} multiplications.`);
      }
      return R.f;
    },
  },
  quiz: [
    { q: 'gcd(252, 105) = ?', opts: ['7', '21', '35', '42'], a: 1, why: '252 mod 105 = 42, 105 mod 42 = 21, 42 mod 21 = 0.' },
    { q: 'Euclid’s algorithm takes the most steps on…', opts: ['powers of two', 'consecutive Fibonacci numbers', 'primes', 'equal numbers'], a: 1, why: 'Lamé’s theorem: each step shrinks them as slowly as possible.' },
    { q: 'a has an inverse modulo n exactly when…', opts: ['a < n', 'gcd(a, n) = 1', 'n is even', 'a is prime'], a: 1, why: 'Then extended Euclid gives ax + ny = 1.' },
    { q: 'Computing a^b mod n by repeated squaring takes how many multiplications?', opts: ['O(b)', 'O(lg b)', 'O(n)', 'O(√b)'], a: 1, why: 'One or two per bit of b.' },
  ],
});

/* ---------------- RSA & primality ---------------- */
topic({
  id: 'rsa', title: 'RSA and primality testing', sec: '§31.7–31.8', prereq: ['number-theory'],
  blurb: 'Public-key encryption from modular exponentiation, and how to find the large primes it needs.',
  cx: [['Encrypt, decrypt', 'O(lg e), O(lg d) multiplications'], ['Miller–Rabin, s trials', 'error ≤ 2⁻ˢ']],
  props: ['Public and secret keys', 'Randomized primality'],
  tags: 'rsa public key cryptography encryption miller rabin primality fermat',
  learn: `
<p>In a <b>public-key cryptosystem</b>, each person publishes a key <i>P</i> and keeps a matching secret key <i>S</i>. Anyone can encrypt with <i>P</i>, but only the holder of <i>S</i> can decrypt. Applying <i>S</i> first gives a <b>digital signature</b> that anyone can check with <i>P</i>.</p>
<h3>RSA</h3>
<ol><li>Pick two large random primes <i>p</i> and <i>q</i> (each hundreds of digits long).</li><li>Compute <i>n</i> = <i>pq</i> and φ(<i>n</i>) = (<i>p</i> − 1)(<i>q</i> − 1).</li><li>Choose a small odd <i>e</i> relatively prime to φ(<i>n</i>), often 65537.</li><li>Compute <i>d</i> = <i>e</i><sup>−1</sup> mod φ(<i>n</i>) with <a href="/learn/number-theory">extended Euclid</a>.</li><li>Publish <i>P</i> = (<i>e</i>, <i>n</i>); keep <i>S</i> = (<i>d</i>, <i>n</i>) secret.</li></ol>
<p>Encrypt a message <i>M</i> &lt; <i>n</i> as <i>C</i> = <i>M<sup>e</sup></i> mod <i>n</i>; decrypt as <i>M</i> = <i>C<sup>d</sup></i> mod <i>n</i>. Both are modular exponentiations. Since <i>ed</i> ≡ 1 mod φ(<i>n</i>), Euler's theorem gives <i>M<sup>ed</sup></i> ≡ <i>M</i> (mod <i>n</i>) for every message coprime to <i>n</i>. The book proves it for every message, including multiples of <i>p</i> or <i>q</i>, by applying Fermat's little theorem modulo <i>p</i> and modulo <i>q</i> separately and combining the two with the Chinese remainder theorem.</p>
<p>Security rests on the belief that <b>factoring</b> <i>n</i> is hard. Anyone who factors <i>n</i> can compute φ(<i>n</i>) and then <i>d</i>. Try it with the calculator under <b>Visualize</b>, using tiny primes.</p>
<h3>Finding primes: Miller–Rabin</h3>
<p>Primes are plentiful (about 1 in ln <i>n</i> numbers near <i>n</i>), so pick random odd numbers and test them. Fermat's little theorem says <i>a</i><sup><i>n</i>−1</sup> ≡ 1 (mod <i>n</i>) for prime <i>n</i>, but some composites (Carmichael numbers, such as 561) pass that test for every base coprime to them. Only bases that share a factor with <i>n</i> expose them (3, 11 and 17 for 561), and those are rare. <b>Miller–Rabin</b> also checks for nontrivial square roots of 1 while squaring. Each random base exposes a composite with probability at least 1/2, so <i>s</i> trials give error at most 2<sup>−<i>s</i></sup>.</p>
<h3>Integer factorization</h3>
<p>Section 31.9 presents Pollard's rho heuristic, which finds small factors in about <i>n</i><sup>1/4</sup> steps. No known classical algorithm factors RSA-size numbers in polynomial time.</p>`,
  code: {
    pseudo: `witness(a, n)
  write n - 1 as 2^t · u with u odd and t ≥ 1
  x0 ← modularExponentiation(a, u, n)
  for i ← 1 to t
      xi ← x(i-1)^2 mod n
      if xi = 1 and x(i-1) ≠ 1 and x(i-1) ≠ n - 1
          return true         // a nontrivial square root of 1
  if xt ≠ 1
      return true
  return false

millerRabin(n, s)
  for j ← 1 to s
      a ← random(1, n - 1)
      if witness(a, n)
          return composite     // certainly composite
  return prime                 // prime with high probability`,
    py: `import random

def is_probable_prime(n, s=20):           # Miller-Rabin
    if n < 4:
        return n in (2, 3)
    if n % 2 == 0:
        return False
    t, u = 0, n - 1
    while u % 2 == 0:
        t, u = t + 1, u // 2
    for _ in range(s):
        a = random.randrange(2, n - 1)
        x = pow(a, u, n)
        if x in (1, n - 1):
            continue
        for _ in range(t - 1):
            x = x * x % n
            if x == n - 1:
                break
        else:
            return False                  # a is a witness: composite
    return True

def rsa_keys(p, q, e=65537):
    n, phi = p * q, (p - 1) * (q - 1)
    d = pow(e, -1, phi)                   # modular inverse (Python 3.8+)
    return (e, n), (d, n)

pub, sec = rsa_keys(61, 53, 17)
c = pow(65, *pub)
print(c, pow(c, *sec))                    # 2790 65`,
    cpp: `#include <cstdint>
typedef unsigned long long ull;
typedef __uint128_t u128;

ull mulmod(ull a, ull b, ull m) { return (u128)a * b % m; }
ull powmod(ull a, ull b, ull m) { ull r = 1; a %= m; while (b) { if (b & 1) r = mulmod(r, a, m); a = mulmod(a, a, m); b >>= 1; } return r; }

bool isPrime(ull n) {                       // deterministic for 64-bit n
    if (n < 2) return false;
    for (ull p : {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37}) if (n % p == 0) return n == p;
    ull u = n - 1; int t = 0; while (!(u & 1)) { u >>= 1; t++; }
    for (ull a : {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37}) {
        ull x = powmod(a, u, n);
        if (x == 1 || x == n - 1) continue;
        bool comp = true;
        for (int i = 1; i < t && comp; i++) { x = mulmod(x, x, n); if (x == n - 1) comp = false; }
        if (comp) return false;
    }
    return true;
}`,
  },
  custom(el) {
    const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const inv = (a, m) => { let [or, r] = [a, m], [os, s] = [1, 0]; while (r) { const q = Math.floor(or / r);[or, r] = [r, or - q * r];[os, s] = [s, os - q * s]; } return ((os % m) + m) % m; };
    const pw = (a, b, m) => { let r = 1n, A = BigInt(a) % BigInt(m), B = BigInt(b); const M = BigInt(m); while (B > 0n) { if (B & 1n) r = r * A % M; A = A * A % M; B >>= 1n; } return Number(r); };
    const mk = (id, v, l) => h('label', { for: id }, l, h('input', { type: 'number', id, value: v, min: 2 }));
    const pI = mk('rsa-p', 61, 'p'), qI = mk('rsa-q', 53, 'q'), eI = mk('rsa-e', 17, 'e'), mI = mk('rsa-m', 65, 'message M');
    const out = h('div', { class: 'answer-box' });
    function calc() {
      const p = +pI.lastChild.value, q = +qI.lastChild.value, e = +eI.lastChild.value, M = +mI.lastChild.value;
      out.innerHTML = '';
      if (!isPrime(p) || !isPrime(q) || p === q) { out.textContent = 'p and q must be two different primes (try 61 and 53).'; return; }
      if (p * q > 1e7) { out.textContent = 'Keep p·q below ten million for this demo.'; return; }
      const n = p * q, phi = (p - 1) * (q - 1);
      if (gcd(e, phi) !== 1) { out.textContent = `e = ${e} shares a factor with φ(n) = ${phi}. Choose an e with gcd(e, φ(n)) = 1, for example 17 or 65537.`; return; }
      if (M < 0 || M >= n) { out.textContent = `The message must be between 0 and n − 1 = ${n - 1}.`; return; }
      const d = inv(e, phi), C = pw(M, e, n), back = pw(C, d, n);
      out.append(h('div', null, `n = p·q = ${n}, φ(n) = (p − 1)(q − 1) = ${phi}`), h('div', null, `d = e⁻¹ mod φ(n) = ${d} (check: e·d mod φ(n) = ${(e * d) % phi})`), h('div', null, `Public key (e, n) = (${e}, ${n}). Secret key (d, n) = (${d}, ${n}).`), h('div', { class: 'big' }, `C = ${M}^${e} mod ${n} = ${C}`), h('div', null, `Decrypt: ${C}^${d} mod ${n} = `, h('b', null, back), back === M ? ', the original message.' : '.'));
    }
    [pI, qI, eI, mI].forEach(x => x.lastChild.addEventListener('input', calc));
    el.append(h('div', { class: 'panel', style: { padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' } }, h('div', null, h('h2', { class: 'h3' }, 'RSA calculator'), h('p', { class: 'muted' }, 'Tiny primes so you can follow every number. Real keys use primes with hundreds of digits.')), h('div', { class: 'ctl-row' }, pI, qI, eI, mI), out));
    calc();
  },
  quiz: [
    { q: 'In RSA, the secret exponent d is…', opts: ['a random prime', 'the inverse of e modulo φ(n)', 'p + q', 'e²'], a: 1, why: 'Then (Mᵉ)ᵈ ≡ M (mod n).' },
    { q: 'RSA’s security depends on the difficulty of…', opts: ['sorting', 'computing gcds', 'factoring n = pq', 'modular exponentiation'], a: 2, why: 'Factoring n reveals φ(n) and therefore d.' },
    { q: 'Why is Fermat’s test alone not enough for primality?', opts: ['It is too slow', 'Carmichael numbers like 561 pass it for every base coprime to them', 'It rejects primes', 'It needs factoring'], a: 1, why: 'Miller–Rabin adds the square-root check that catches them.' },
    { q: 'Miller–Rabin with s random bases errs with probability at most…', opts: ['1/s', '2⁻ˢ', '1/2', '0'], a: 1, why: 'Each base catches a composite with probability at least 1/2.' },
  ],
});

/* ---------------- convex hull ---------------- */
topic({
  id: 'convex-hull', title: 'Convex hull (Graham scan)', sec: '§33.1, §33.3', prereq: ['merge-sort', 'stacks-queues'],
  blurb: 'Wrap a rubber band around a set of points: sort by angle, then keep only left turns on a stack.',
  cx: [['Graham scan', 'O(n lg n)'], ['Jarvis march', 'O(nh)'], ['Turn test', 'O(1) cross product']],
  props: ['Cross product', 'Stack'],
  tags: 'convex hull graham scan jarvis cross product orientation geometry',
  learn: `
<p>The <b>convex hull</b> of a set of points is the smallest convex polygon containing them all. Imagine the points as nails in a board and a rubber band snapped around them. Hulls appear in collision detection, GIS, image processing and as a first step for many geometry algorithms.</p>
<h3>The one primitive: cross products</h3>
<p>Section 33.1 builds everything from a single test. For points <i>p</i><sub>0</sub>, <i>p</i><sub>1</sub>, <i>p</i><sub>2</sub>, compute</p>
<div class="formula">(p<sub>1</sub> − p<sub>0</sub>) × (p<sub>2</sub> − p<sub>0</sub>) = (x<sub>1</sub> − x<sub>0</sub>)(y<sub>2</sub> − y<sub>0</sub>) − (x<sub>2</sub> − x<sub>0</sub>)(y<sub>1</sub> − y<sub>0</sub>)</div>
<p>If it is positive, going from <i>p</i><sub>0</sub> to <i>p</i><sub>1</sub> to <i>p</i><sub>2</sub> makes a <b>left turn</b> (counterclockwise); negative means a right turn; zero means the three are collinear. No division, no angles, no floating-point trouble. The same test decides whether two segments intersect.</p>
<h3>Graham scan</h3>
<ol><li>Let <i>p</i><sub>0</sub> be the point with the lowest <i>y</i> (leftmost on ties). It is on the hull.</li><li>Sort the other points by polar angle around <i>p</i><sub>0</sub>, using cross products as the comparison.</li><li>Push <i>p</i><sub>0</sub>, <i>p</i><sub>1</sub>, <i>p</i><sub>2</sub>. For each remaining point, while the top two stack points and the new point make a <b>non-left turn</b>, pop. Then push the new point.</li></ol>
<p>Every point is pushed once and popped at most once, so the scan is O(<i>n</i>) after the O(<i>n</i> lg <i>n</i>) sort. The stack ends holding the hull in counterclockwise order.</p>
<h3>Jarvis's march</h3>
<p>“Gift wrapping”: from the lowest point, repeatedly pick the point that makes the smallest counterclockwise angle with the previous edge. Each step is O(<i>n</i>), and there are <i>h</i> hull vertices, so O(<i>nh</i>), which beats Graham when the hull is tiny.</p>
<h3>In interviews</h3>
<ul><li>Erect the Fence (LC 587) is a convex hull, usually with Andrew's monotone chain (sort by x, build lower and upper hulls).</li><li>The cross-product orientation test shows up in Max Points on a Line (LC 149, use slopes as reduced fractions instead), Valid Boomerang (LC 1037) and polygon problems.</li><li>Section 33.4's closest pair of points is a divide-and-conquer classic in O(<i>n</i> lg <i>n</i>).</li></ul>`,
  code: {
    pseudo: `grahamScan(Q)
  p0 ← the point of Q with the smallest y,
      taking the leftmost one on a tie
  ⟨p1, ..., pm⟩ ← the other points, ordered by
      counterclockwise angle around p0
  S ← empty stack
  push(p0, S)
  push(p1, S)
  push(p2, S)
  for i ← 3 to m
      while nextToTop(S) → top(S) → pi
              does not turn left
          pop(S)
      push(pi, S)
  return S`,
    py: `def cross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def convex_hull(points):                 # Andrew's monotone chain, O(n log n)
    pts = sorted(set(points))
    if len(pts) <= 2:
        return pts
    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]       # counterclockwise

print(convex_hull([(0, 0), (2, 1), (4, 0), (3, 3), (1, 2), (2, 4), (0, 3)]))`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;
typedef long long ll;
struct P { ll x, y; bool operator<(const P& o) const { return x < o.x || (x == o.x && y < o.y); } };

ll cross(P o, P a, P b) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }

vector<P> convexHull(vector<P> p) {             // monotone chain
    sort(p.begin(), p.end());
    int n = p.size(), k = 0;
    if (n < 3) return p;
    vector<P> h(2 * n);
    for (int i = 0; i < n; i++) { while (k >= 2 && cross(h[k-2], h[k-1], p[i]) <= 0) k--; h[k++] = p[i]; }
    for (int i = n - 2, t = k + 1; i >= 0; i--) { while (k >= t && cross(h[k-2], h[k-1], p[i]) <= 0) k--; h[k++] = p[i]; }
    h.resize(k - 1);
    return h;
}`,
  },
  viz: {
    inputHint: 'Points as x,y separated by spaces (0 to 20)',
    presets: [{ label: 'Twelve points', input: '2,1 9,2 14,1 17,5 15,9 12,7 8,6 5,10 3,7 1,5 10,12 6,3', note: 'The points are numbered p0 to p11 in scan order. Pops happen at p3, p5, p6, p8 and p11.' }, { label: 'A square with inner points', input: '0,0 10,0 10,10 0,10 5,5 3,6 7,2', note: 'Only the four corners survive.' }],
    random: () => Array.from({ length: rnd(8, 11) }, () => `${rnd(0, 20)},${rnd(0, 14)}`).join(' '),
    parse: s => { const pts = s.trim().split(/\s+/).map(t => { const m = /^(-?\d+),(-?\d+)$/.exec(t); if (!m) throw new Error(`"${t}" should look like x,y.`); return [+m[1], +m[2]]; }); const u = [...new Map(pts.map(p => [p.join(), p])).values()]; if (u.length < 3 || u.length > 14) throw new Error('Use between 3 and 14 distinct points.'); return u; },
    run(pts) {
      const R = Rec(); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      let i0 = 0; pts.forEach((p, i) => { if (p[1] < pts[i0][1] || (p[1] === pts[i0][1] && p[0] < pts[i0][0])) i0 = i; });
      const p0 = pts[i0];
      const rest = pts.filter((_, i) => i !== i0).sort((a, b) => { const c = cr(p0, a, b); return c !== 0 ? -c : (Math.hypot(a[0] - p0[0], a[1] - p0[1]) - Math.hypot(b[0] - p0[0], b[1] - p0[1])); });
      const order = [p0, ...rest]; const id = p => order.indexOf(p);
      const S = 22;
      const st = (stack, extra = {}, ecls = {}) => {
        const nodes = order.map((p, i) => ({ id: String(i), label: String(i), x: p[0] * S, y: (14 - p[1]) * S, cls: extra[i] }));
        const edges = [];
        for (let k = 1; k < stack.length; k++) edges.push({ u: String(id(stack[k - 1])), v: String(id(stack[k])), cls: 'tree' });
        if (extra.closing && stack.length > 2) edges.push({ u: String(id(stack[stack.length - 1])), v: String(id(stack[0])), cls: 'tree' });
        if (extra.probe) edges.push({ u: String(id(stack[stack.length - 1])), v: String(extra.probe), cls: 'cmp' });
        return { graph: { nodes, edges, directed: false, r: 11 }, arrays: [{ name: 'S', label: 'Stack S (top on the right)', a: stack.length ? stack.map(p => id(p)) : [null], noIdx: true, small: true }] };
      };
      R.add(st([], { 0: 'src' }), 3, `p0 = (${p0}) has the lowest y. Number the rest 1 to ${rest.length} by polar angle around p0.`);
      const stack = [order[0], order[1], order[2]];
      R.add(st([...stack], { 0: 'ok', 1: 'ok', 2: 'ok' }), 9, 'Push p0, p1 and p2.');
      for (let i = 3; i < order.length; i++) {
        const p = order[i];
        while (stack.length >= 2 && cr(stack[stack.length - 2], stack[stack.length - 1], p) <= 0) {
          const a = id(stack[stack.length - 2]), b = id(stack[stack.length - 1]);
          R.add(st([...stack], { [i]: 'cur', [b]: 'warn', probe: i }), 11, `p${a} → p${b} → p${i} is a ${cr(stack[stack.length - 2], stack[stack.length - 1], p) === 0 ? 'straight line' : 'right turn'}: pop p${b}.`, { q: `Does p${a} → p${b} → p${i} make a left turn?`, choices: ['Left turn: push', 'Right turn or straight: pop'], answer: 1, hint: 'Imagine walking along the path. Which way do you turn at the middle point?' });
          stack.pop();
        }
        const a = stack.length >= 2 ? id(stack[stack.length - 2]) : null, b = id(stack[stack.length - 1]);
        stack.push(p);
        R.add(st([...stack], { [i]: 'cur' }), 14, a != null ? `p${a} → p${b} → p${i} turns left: push p${i}.` : `Push p${i}.`, a != null && Math.random() < .5 ? { q: `Does p${a} → p${b} → p${i} make a left turn?`, choices: ['Left turn: push', 'Right turn or straight: pop'], answer: 0 } : null);
      }
      R.add(st([...stack], Object.fromEntries([...stack.map(p => [id(p), 'ok']), ['closing', true]])), 15, `The stack holds the hull in counterclockwise order: ${stack.map(p => 'p' + id(p)).join(', ')}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'The cross product (p1 − p0) × (p2 − p0) is positive when…', opts: ['p0 → p1 → p2 turns left', 'it turns right', 'the points are collinear', 'p2 is farther away'], a: 0, why: 'Positive means counterclockwise.' },
    { q: 'Graham scan runs in…', opts: ['O(n)', 'O(n lg n)', 'O(n²)', 'O(nh)'], a: 1, why: 'Sorting dominates; the stack scan is linear.' },
    { q: 'Jarvis’s march is faster than Graham scan when…', opts: ['the hull has few vertices', 'points are sorted', 'points are integers', 'never'], a: 0, why: 'It costs O(nh) for h hull vertices.' },
  ],
});

/* ---------------- bit manipulation ---------------- */
topic({
  id: 'bit-manipulation', title: 'Bit manipulation', sec: 'Beyond the book', prereq: ['algorithms'], beyond: true,
  blurb: 'Treat integers as arrays of bits: masks, XOR tricks, popcount and subset enumeration.',
  cx: [['Single bit operations', 'O(1)'], ['Enumerate subsets of n', 'O(2ⁿ)']],
  props: ['AND OR XOR', 'Masks'],
  tags: 'bit manipulation xor and or shift mask popcount lowbit subset bitmask',
  learn: `
<p>Integers are stored in binary, and processors operate on all of their bits at once. Bit tricks give constant-time set operations on small sets, compact state for DP, and a few famously clever interview answers. The book uses them in radix sort and the van Emde Boas tree.</p>
<h3>The operators</h3>
<table><tr><th>Expression</th><th>Meaning</th></tr>
<tr><td><code>x &amp; y</code>, <code>x | y</code>, <code>x ^ y</code></td><td>bitwise AND, OR, XOR</td></tr>
<tr><td><code>x &lt;&lt; k</code>, <code>x &gt;&gt; k</code></td><td>shift left (× 2<sup>k</sup>) and right (÷ 2<sup>k</sup>, floor)</td></tr>
<tr><td><code>(x &gt;&gt; i) &amp; 1</code></td><td>test bit <i>i</i></td></tr>
<tr><td><code>x | (1 &lt;&lt; i)</code>, <code>x &amp; ~(1 &lt;&lt; i)</code>, <code>x ^ (1 &lt;&lt; i)</code></td><td>set, clear, toggle bit <i>i</i></td></tr>
<tr><td><code>x &amp; (x - 1)</code></td><td>clear the lowest set bit; zero exactly when <i>x</i> is a power of two</td></tr>
<tr><td><code>x &amp; -x</code></td><td>isolate the lowest set bit (Fenwick trees use it)</td></tr></table>
<h3>XOR identities</h3>
<p><i>x</i> ⊕ <i>x</i> = 0, <i>x</i> ⊕ 0 = <i>x</i>, and XOR is commutative and associative. So XOR-ing a list where every value appears twice except one leaves that one (Single Number, LC 136). Missing Number (LC 268) XORs indices with values.</p>
<h3>Bitmasks as sets</h3>
<p>A subset of {0, …, <i>n</i> − 1} fits in an integer: bit <i>i</i> set means element <i>i</i> is in the set. Union is OR, intersection is AND, and looping <code>mask</code> from 0 to 2<sup><i>n</i></sup> − 1 enumerates every subset (Subsets, LC 78). <b>Bitmask DP</b> uses the mask as a DP state: the travelling salesman problem in O(<i>n</i><sup>2</sup> 2<sup><i>n</i></sup>), Partition to K Equal Sum Subsets (LC 698), Shortest Path Visiting All Nodes (LC 847).</p>
<h3>In interviews</h3>
<ul><li>Number of 1 Bits (LC 191): repeat <code>x &amp;= x - 1</code> and count.</li><li>Counting Bits (LC 338): <code>bits[i] = bits[i &gt;&gt; 1] + (i &amp; 1)</code>.</li><li>Reverse Bits (LC 190), Sum of Two Integers without + (LC 371).</li><li>Python integers are unbounded, so mask with <code>0xFFFFFFFF</code> when a problem assumes 32 bits.</li></ul>`,
  code: {
    py: `def popcount(x):                 # LeetCode 191
    c = 0
    while x:
        x &= x - 1                  # drop the lowest set bit
        c += 1
    return c

def single_number(nums):          # LeetCode 136
    r = 0
    for x in nums:
        r ^= x                      # pairs cancel out
    return r

def subsets(nums):                # every bitmask is a subset
    n = len(nums)
    return [[nums[i] for i in range(n) if mask >> i & 1] for mask in range(1 << n)]

def count_bits(n):                # LeetCode 338
    bits = [0] * (n + 1)
    for i in range(1, n + 1):
        bits[i] = bits[i >> 1] + (i & 1)
    return bits

is_power_of_two = lambda x: x > 0 and x & (x - 1) == 0
lowest_set_bit = lambda x: x & -x`,
    cpp: `#include <vector>
using namespace std;

int popcount(unsigned x) { int c = 0; while (x) { x &= x - 1; c++; } return c; }
// or __builtin_popcount(x), std::popcount in C++20

int singleNumber(const vector<int>& a) { int r = 0; for (int x : a) r ^= x; return r; }

vector<vector<int>> subsets(const vector<int>& a) {
    int n = a.size(); vector<vector<int>> out;
    for (int mask = 0; mask < (1 << n); mask++) {
        vector<int> s;
        for (int i = 0; i < n; i++) if (mask >> i & 1) s.push_back(a[i]);
        out.push_back(s);
    }
    return out;
}

bool isPowerOfTwo(long long x) { return x > 0 && (x & (x - 1)) == 0; }`,
  },
  custom(el) {
    const W = 12;
    const aI = h('input', { type: 'number', id: 'bit-a', value: 44, min: 0, max: 4095 }), bI = h('input', { type: 'number', id: 'bit-b', value: 26, min: 0, max: 4095 });
    const out = h('div', { class: 'tablewrap' });
    const row = (label, v, cls) => h('tr', null, h('th', { style: { textAlign: 'right', whiteSpace: 'nowrap' } }, label), ...[...(v >>> 0).toString(2).padStart(W, '0').slice(-W)].map(b => h('td', { class: b === '1' ? (cls || 'c-ink') : '' }, b)), h('td', { class: 'blank', style: { fontFamily: 'var(--f-code)', textAlign: 'left', paddingLeft: '10px' } }, String(v)));
    function draw() {
      const a = Math.max(0, Math.min(4095, +aI.value || 0)), b = Math.max(0, Math.min(4095, +bI.value || 0));
      out.innerHTML = '';
      const t = h('table', { class: 'tbl' }, h('tr', null, h('th'), ...Array.from({ length: W }, (_, i) => h('th', null, W - 1 - i)), h('th', null, 'decimal')),
        row('a', a, 'c-cmp'), row('b', b, 'c-cmp'), row('a & b', a & b), row('a | b', a | b), row('a ^ b', a ^ b), row('a << 1', (a << 1) & 4095), row('a >> 1', a >> 1), row('a & (a − 1)', a & (a - 1), 'c-done'), row('a & −a', a & -a, 'c-key'));
      out.append(t, h('p', { class: 'muted', style: { marginTop: '10px' } }, `a has ${[...a.toString(2)].filter(c => c === '1').length} set bits. ${a > 0 && (a & (a - 1)) === 0 ? 'a is a power of two.' : 'a is not a power of two.'} The lowest set bit of a is worth ${a & -a}.`));
    }
    [aI, bI].forEach(x => x.addEventListener('input', draw));
    el.append(h('div', { class: 'panel', style: { padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' } }, h('div', null, h('h2', { class: 'h3' }, 'Bit playground'), h('p', { class: 'muted' }, 'Twelve bits, values 0 to 4095. Change a and b and watch every operator at once.')), h('div', { class: 'ctl-row' }, h('label', { for: 'bit-a' }, 'a', aI), h('label', { for: 'bit-b' }, 'b', bI)), out));
    draw();
  },
  quiz: [
    { q: 'What does x & (x − 1) do?', opts: ['Sets the lowest bit', 'Clears the lowest set bit', 'Doubles x', 'Flips every bit'], a: 1, why: 'Subtracting 1 flips the lowest set bit and every zero below it.' },
    { q: 'Every number in an array appears twice except one. The fastest O(1)-space solution is…', opts: ['sort', 'a hash set', 'XOR all of them', 'sum them'], a: 2, why: 'Pairs cancel because x ^ x = 0.' },
    { q: 'How many subsets does a set of n elements have, and how can a loop enumerate them?', opts: ['n², nested loops', '2ⁿ, a mask from 0 to 2ⁿ − 1', 'n!, permutations', 'n, one per element'], a: 1, why: 'Each bit of the mask decides one element.' },
    { q: 'x & −x gives…', opts: ['the highest set bit', 'the lowest set bit', 'zero', 'the number of set bits'], a: 1, why: 'In two’s complement, −x = ~x + 1, which shares only the lowest set bit with x.' },
  ],
});
