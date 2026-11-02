import { Rec, h, parseNums, pick, randArr, rnd, shuffle } from '../../engine/helpers';
import { setPart, topic } from '../registry';
import { rangeHl } from './sorting';

setPart('tech');
export const dpAsk = (p = .35) => Math.random() < p;

/* ---------------- divide & conquer: maximum subarray ---------------- */
topic({
  id: 'divide-conquer', title: 'Divide and conquer: maximum subarray', sec: '§4.1–4.2', prereq: ['recurrences', 'merge-sort'],
  blurb: 'Find the contiguous subarray with the largest sum, first by splitting in half, then in one linear pass.',
  cx: [['Divide and conquer', 'Θ(n lg n)'], ['Kadane (Exercise 4.1-5)', 'Θ(n)'], ['Strassen', 'Θ(n^2.81)']],
  props: ['Crossing subarray', 'Kadane'],
  tags: 'maximum subarray kadane divide and conquer strassen stock',
  learn: `
<p>The book motivates this problem with stock prices: buy once, sell once later, maximize profit. Turn the price series into daily <b>changes</b>, and the best trade is the contiguous stretch of days whose changes have the largest sum: the <b>maximum subarray</b>. (If every change is negative, the answer is the single least negative value, or an empty trade if allowed.)</p>
<h3>Divide and conquer</h3>
<p>Split <i>A</i>[<i>low</i>..<i>high</i>] at the midpoint. The best subarray lies in exactly one of three places:</p>
<ol><li>entirely in the left half: solve recursively;</li><li>entirely in the right half: solve recursively;</li><li><b>crossing</b> the midpoint: it is the best suffix of the left half joined to the best prefix of the right half. <code>findMaxCrossingSubarray</code> finds both in linear time by scanning outward from the middle.</li></ol>
<p>Return the best of the three. The recurrence is <i>T</i>(<i>n</i>) = 2<i>T</i>(<i>n</i>/2) + Θ(<i>n</i>), the same as merge sort, so Θ(<i>n</i> lg <i>n</i>).</p>
<h3>A linear-time solution</h3>
<p>Exercise 4.1-5 hints at a better way, known as <b>Kadane's algorithm</b>. Scan left to right keeping the best sum of a subarray <i>ending at the current position</i>. At each element you either extend the previous best-ending-here subarray or start fresh at this element, whichever is larger:</p>
<div class="formula">best_here = max(A[i], best_here + A[i]) &nbsp;&nbsp; best = max(best, best_here)</div>
<p>If the running sum goes negative it can only hurt what follows, so it is dropped. This is really a one-dimensional dynamic program, and the visualizer runs it on the book's Figure 4.3 data.</p>
<h3>Strassen's algorithm</h3>
<p>Section 4.2 applies divide and conquer to matrix multiplication. Splitting <i>n</i> × <i>n</i> matrices into four blocks naively needs 8 recursive multiplications, <i>T</i>(<i>n</i>) = 8<i>T</i>(<i>n</i>/2) + Θ(<i>n</i>²) = Θ(<i>n</i>³), no gain. Strassen found a way to use only <b>7</b> products at the cost of more additions, giving Θ(<i>n</i><sup>lg 7</sup>) ≈ Θ(<i>n</i><sup>2.81</sup>). The lesson: saving one recursive call changes the exponent.</p>
<h3>In interviews</h3>
<ul><li>Maximum Subarray (LC 53) expects Kadane; the follow-up asks for divide and conquer.</li><li>Best Time to Buy and Sell Stock (LC 121) is the same idea on prices: track the minimum price so far.</li><li>Maximum Product Subarray (LC 152) tracks both a max and a min ending here, since a negative can flip them.</li><li>Maximum Sum Circular Subarray (LC 918): the answer is max(Kadane, total − minimum subarray), except when every number is negative. Then the minimum subarray is the whole array, total − minimum picks the empty subarray, and the answer is plain Kadane (the largest element).</li></ul>`,
  code: {
    pseudo: `kadane(A)                       // Exercise 4.1-5
  best ← A[1]
  here ← A[1]
  for i ← 2 to len(A)
      if here + A[i] > A[i]
          here ← here + A[i]      // extend the current run
      else here ← A[i]            // start a new run at i
      best ← max(best, here)
  return best

findMaxCrossingSubarray(A, low, mid, high)
  leftSum ← -∞
  sum ← 0
  for i ← mid downto low
      sum ← sum + A[i]
      if sum > leftSum
          leftSum ← sum
          maxLeft ← i
  rightSum ← -∞
  sum ← 0
  for j ← mid + 1 to high
      sum ← sum + A[j]
      if sum > rightSum
          rightSum ← sum
          maxRight ← j
  return (maxLeft, maxRight, leftSum + rightSum)`,
    py: `def max_subarray(a):                    # Kadane, LeetCode 53
    best = here = a[0]
    for x in a[1:]:
        here = max(x, here + x)
        best = max(best, here)
    return best

def max_subarray_dc(a, lo=0, hi=None):  # divide and conquer, Θ(n lg n)
    if hi is None:
        hi = len(a) - 1
    if lo == hi:
        return a[lo]
    mid = (lo + hi) // 2
    s, left = 0, float('-inf')
    for i in range(mid, lo - 1, -1):
        s += a[i]; left = max(left, s)
    s, right = 0, float('-inf')
    for j in range(mid + 1, hi + 1):
        s += a[j]; right = max(right, s)
    return max(max_subarray_dc(a, lo, mid),
               max_subarray_dc(a, mid + 1, hi),
               left + right)

print(max_subarray([13, -3, -25, 20, -3, -16, -23, 18, 20, -7, 12, -5, -22, 15, -4, 7]))  # 43`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

int maxSubArray(const vector<int>& a) {     // Kadane, LeetCode 53
    int best = a[0], here = a[0];
    for (size_t i = 1; i < a.size(); i++) {
        here = max(a[i], here + a[i]);
        best = max(best, here);
    }
    return best;
}

int maxProfit(const vector<int>& prices) {  // LeetCode 121
    int lo = prices[0], best = 0;
    for (int p : prices) { lo = min(lo, p); best = max(best, p - lo); }
    return best;
}`,
  },
  viz: {
    inputHint: 'Integers, some negative',
    presets: [
      { label: 'Figure 4.3', input: '13 -3 -25 20 -3 -16 -23 18 20 -7 12 -5 -22 15 -4 7', note: 'The book’s price changes. The best run is A[8..11] with sum 43.' },
      { label: 'All negative', input: '-8 -3 -6 -2 -5 -4', note: 'The answer is the single largest element, −2.' },
      { label: 'LeetCode 53 example', input: '-2 1 -3 4 -1 2 1 -5 4', note: 'Best run [4, −1, 2, 1] with sum 6.' },
    ],
    random: () => randArr(rnd(8, 11), -15, 15).join(' '),
    parse: s => parseNums(s, { min: 1, max: 16, lo: -99, hi: 99 }),
    run(a) {
      const R = Rec(); const n = a.length; let best = a[0], here = a[0], start = 0, bs = 0, be = 0;
      const st = (i, hl = {}) => ({ vars: { here, best }, arrays: [{ a, base: 1, hl: { ...rangeHl(bs, be, 'done'), ...rangeHl(start, i, 'cmp'), ...hl }, ptr: { i } }] });
      R.add(st(0, { 0: 'cur' }), 3, `Start: here = best = A[1] = ${a[0]}.`);
      for (let i = 1; i < n; i++) {
        const ext = here + a[i] > a[i];
        const ask = { q: `here = ${here}, A[${i + 1}] = ${a[i]}. Extend the current run or start a new one at ${a[i]}?`, choices: ['Extend', 'Start new'], answer: ext ? 0 : 1, hint: 'Compare here + A[i] with A[i] alone.' };
        if (ext) here += a[i]; else { here = a[i]; start = i; }
        let msg = ext ? `Extend: here = ${here}.` : `${here - a[i] < 0 ? 'The previous run is negative, so drop it. ' : ''}Start new at ${i + 1}: here = ${here}.`;
        if (here > best) { best = here; bs = start; be = i; msg += ` New best ${best} on A[${bs + 1}..${be + 1}].`; }
        R.add(st(i, { [i]: 'cur' }), ext ? 6 : 7, msg, Math.random() < .55 ? ask : null);
      }
      R.add({ vars: { best }, arrays: [{ a, base: 1, hl: rangeHl(bs, be, 'found') }] }, 9, `Maximum subarray A[${bs + 1}..${be + 1}] with sum ${best}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'The recurrence for the divide-and-conquer maximum subarray algorithm is…', opts: ['T(n) = T(n/2) + Θ(1)', 'T(n) = 2T(n/2) + Θ(n)', 'T(n) = 2T(n/2) + Θ(1)', 'T(n) = T(n − 1) + Θ(1)'], a: 1, why: 'Two halves plus a linear crossing scan.' },
    { q: 'Why does Kadane’s algorithm drop the running sum when it goes negative?', opts: ['To avoid overflow', 'A negative prefix can only lower the sum of any subarray that continues past it', 'It is required for stability', 'It does not'], a: 1, why: 'Starting fresh is always at least as good as carrying a negative prefix.' },
    { q: 'Strassen’s algorithm runs in Θ(n^lg 7) because it…', opts: ['uses 7 recursive multiplications of half-size matrices instead of 8', 'uses 7 additions', 'splits into 7 blocks', 'is iterative'], a: 0, why: 'T(n) = 7T(n/2) + Θ(n²) gives n^log₂7.' },
    { q: 'For Maximum Product Subarray, Kadane must track…', opts: ['only the max product ending here', 'both the max and the min product ending here', 'the sum', 'the indices only'], a: 1, why: 'Multiplying by a negative turns the minimum into the maximum.' },
  ],
});

/* ---------------- DP intro: rod cutting ---------------- */
topic({
  id: 'dp-intro', title: 'Dynamic programming: rod cutting', sec: '§15.1, §15.3', prereq: ['divide-conquer'],
  blurb: 'Solve overlapping subproblems once and reuse the answers. Rod cutting shows the whole method.',
  cx: [['Naive recursion', 'Θ(2ⁿ)'], ['Memoized or bottom-up', 'Θ(n²)']],
  props: ['Optimal substructure', 'Overlapping subproblems'],
  tags: 'dynamic programming dp memoization tabulation rod cutting optimal substructure overlapping',
  learn: `
<p><b>Dynamic programming</b> solves a problem by combining solutions to subproblems, like divide and conquer, but the subproblems <b>overlap</b>: the same smaller problem is needed again and again. Instead of recomputing, DP stores each answer in a table. The book's four steps:</p>
<ol><li>Characterize the structure of an optimal solution.</li><li>Define the value of an optimal solution recursively.</li><li>Compute the values, usually bottom-up.</li><li>Construct an optimal solution from the computed information.</li></ol>
<h3>The rod-cutting problem</h3>
<p>A rod of length <i>n</i> can be cut into integer pieces; a piece of length <i>i</i> sells for <i>p<sub>i</sub></i>. Find the maximum revenue <i>r<sub>n</sub></i>. With the book's prices (1, 5, 8, 9, 10, 17, 17, 20, 24, 30), a rod of length 4 is worth most as two pieces of length 2: 5 + 5 = 10.</p>
<p>Think about the <b>first cut</b>: a first piece of length <i>i</i> sells for <i>p<sub>i</sub></i>, and the remainder of length <i>n</i> − <i>i</i> should be cut optimally. So</p>
<div class="formula">r<sub>n</sub> = max<sub>1 ≤ i ≤ n</sub> (p<sub>i</sub> + r<sub>n−i</sub>), &nbsp; r<sub>0</sub> = 0</div>
<p>This is <b>optimal substructure</b>: an optimal solution contains optimal solutions to subproblems.</p>
<h3>Why naive recursion is slow</h3>
<p>Coding that formula directly calls <code>cutRod</code>(<i>n</i> − <i>i</i>) for every <i>i</i>, and those calls repeat the same work. The recursion tree has 2<sup><i>n</i>−1</sup> leaves, so the running time is exponential, even though there are only <i>n</i> + 1 distinct subproblems.</p>
<h3>Two ways to fix it</h3>
<ul><li><b>Top-down with memoization</b>: recurse as before, but save each <i>r<sub>j</sub></i> in an array the first time and look it up after that.</li><li><b>Bottom-up (tabulation)</b>: solve subproblems in order of size, <i>j</i> = 1, 2, …, <i>n</i>. When computing <i>r<sub>j</sub></i>, every smaller <i>r</i> is already in the table.</li></ul>
<p>Both take Θ(<i>n</i>²): <i>n</i> subproblems, each a loop over up to <i>n</i> choices. Bottom-up has smaller constants; top-down skips subproblems that are never needed. Recording the best first cut <i>s</i>[<i>j</i>] for each <i>j</i> lets you rebuild the actual cuts (step 4).</p>
<div class="note key"><b>The interview recipe.</b> (1) Define the state in words: “<i>r</i>[<i>j</i>] = best revenue for a rod of length <i>j</i>”. (2) Write the transition: what is the last (or first) decision? (3) Set base cases. (4) Choose an evaluation order so dependencies come first. (5) Read off the answer, and reduce memory if only the previous row is needed.</div>
<h3>Related problems</h3>
<ul><li>Climbing Stairs (LC 70), House Robber (LC 198), Coin Change (LC 322) and Perfect Squares (LC 279) are one-dimensional like rod cutting.</li><li>Rod cutting is an <b>unbounded knapsack</b>: each length can be used any number of times.</li></ul>`,
  code: {
    pseudo: `bottomUpCutRod(p, n)
  allocate r[0..n], s[0..n]
  r[0] ← 0
  for j ← 1 to n
      q ← -∞
      for i ← 1 to j
          if q < p[i] + r[j - i]
              q ← p[i] + r[j - i]
              s[j] ← i
      r[j] ← q
  return r and s

printCutRodSolution(p, n)
  (r, s) ← bottomUpCutRod(p, n)
  while n > 0
      output s[n]
      n ← n - s[n]`,
    py: `from functools import lru_cache

def cut_rod(p, n):                 # bottom-up, p[i] = price of length i (p[0] unused)
    r = [0] * (n + 1)
    s = [0] * (n + 1)
    for j in range(1, n + 1):
        q = float('-inf')
        for i in range(1, j + 1):
            if p[i] + r[j - i] > q:
                q, s[j] = p[i] + r[j - i], i
        r[j] = q
    cuts = []
    while n > 0:
        cuts.append(s[n]); n -= s[n]
    return r[-1], cuts

def cut_rod_memo(p, n):            # top-down with memoization
    @lru_cache(maxsize=None)
    def best(j):
        if j == 0:
            return 0
        return max(p[i] + best(j - i) for i in range(1, j + 1))
    return best(n)

prices = [0, 1, 5, 8, 9, 10, 17, 17, 20, 24, 30]
print(cut_rod(prices, 7))          # (18, [1, 6])`,
    cpp: `#include <vector>
#include <climits>
using namespace std;

// p[i] = price of a piece of length i, p[0] unused
pair<int, vector<int>> cutRod(const vector<int>& p, int n) {
    vector<int> r(n + 1, 0), s(n + 1, 0);
    for (int j = 1; j <= n; j++) {
        int q = INT_MIN;
        for (int i = 1; i <= j; i++)
            if (p[i] + r[j - i] > q) { q = p[i] + r[j - i]; s[j] = i; }
        r[j] = q;
    }
    vector<int> cuts;
    for (int k = n; k > 0; k -= s[k]) cuts.push_back(s[k]);
    return {r[n], cuts};
}`,
  },
  viz: {
    inputHint: 'Prices for lengths 1..n',
    presets: [
      { label: 'Figure 15.1 prices, n = 8', input: '1 5 8 9 10 17 17 20', note: 'The book’s price table. Length 8 is best cut as 2 + 6 for 22.' },
      { label: 'n = 10', input: '1 5 8 9 10 17 17 20 24 30', note: 'Length 10 is worth 30 uncut.' },
      { label: 'Steep prices', input: '3 5 8 9 10', note: 'Cutting into length-1 pieces wins: 3 per unit.' },
    ],
    random: () => { let p = rnd(1, 3); return Array.from({ length: rnd(5, 8) }, (_, i) => (p += rnd(1, 5))).join(' '); },
    parse: s => parseNums(s, { min: 1, max: 10, lo: 0, hi: 99 }),
    run(p) {
      const R = Rec(); const n = p.length, r = Array(n + 1).fill(null), s = Array(n + 1).fill(null); r[0] = 0;
      const st = (hl = {}, rh = {}, vars) => ({ vars, arrays: [{ name: 'p', label: 'p (price of length i)', a: [null, ...p], base: 0, hl, small: true }, { name: 'r', label: 'r (best revenue for length j)', a: [...r], base: 0, hl: rh, small: true }, { name: 's', label: 's (best first piece)', a: [...s], base: 0, small: true }] });
      R.add(st({}, { 0: 'done' }), 3, 'r[0] = 0: a rod of length 0 earns nothing.');
      for (let j = 1; j <= n; j++) {
        let q = -Infinity, bi = 0;
        for (let i = 1; i <= j; i++) {
          const v = p[i - 1] + r[j - i];
          const better = v > q;
          if (better) { q = v; bi = i; }
          R.add(st({ [i]: 'cmp' }, { [j - i]: 'cmp', [j]: 'cur' }, { j, i, 'p[i] + r[j−i]': v, q }), better ? 8 : 7, `First piece ${i}: ${p[i - 1]} + r[${j - i}] = ${v}${better ? ', the best so far' : ''}.`);
        }
        r[j] = q; s[j] = bi;
        R.add(st({}, { [j]: 'found' }, { j }), 10, `r[${j}] = ${q}, using a first piece of length ${bi}.`, j > 1 ? { q: `What is r[${j}], the best revenue for a rod of length ${j}?`, value: q, hint: `Try each first piece i: p[i] + r[${j}−i].` } : null);
      }
      const cuts = []; let k = n; while (k > 0) { cuts.push(s[k]); k -= s[k]; }
      R.add(st({}, rangeHl(0, n, 'done')), 15, `Optimal revenue for length ${n} is ${r[n]}: cut into pieces ${cuts.join(' + ')}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'Two properties a problem needs for dynamic programming are…', opts: ['sorted input and small n', 'optimal substructure and overlapping subproblems', 'greedy choice and matroid structure', 'recursion and randomness'], a: 1, why: 'Without overlap, plain divide and conquer is enough.' },
    { q: 'How many distinct subproblems does rod cutting of length n have?', opts: ['n + 1', 'n²', '2ⁿ', 'n!'], a: 0, why: 'One per length 0..n, which is why the table has n+1 entries.' },
    { q: 'The naive recursive CUT-ROD runs in…', opts: ['Θ(n)', 'Θ(n²)', 'Θ(2ⁿ)', 'Θ(n lg n)'], a: 2, why: 'It recomputes the same subproblems exponentially many times.' },
    { q: 'What extra array lets you reconstruct the actual cuts?', opts: ['r', 's, the best first piece for each length', 'p', 'none'], a: 1, why: 'Follow s[n], s[n − s[n]], … until the rod is used up.' },
    { q: 'Coin Change (LC 322, fewest coins for an amount) is most similar to…', opts: ['0-1 knapsack', 'rod cutting, an unbounded choice per step', 'LCS', 'activity selection'], a: 1, why: 'dp[a] = 1 + min over coins c of dp[a − c], each coin reusable.' },
  ],
});

/* ---------------- LCS ---------------- */
topic({
  id: 'lcs', title: 'Longest common subsequence', sec: '§15.4', prereq: ['dp-intro'],
  blurb: 'A two-dimensional DP over prefixes of two strings, the template for most string DP problems.',
  cx: [['Time', 'Θ(mn)'], ['Space', 'Θ(mn), or Θ(min(m, n)) for the length only']],
  props: ['2-D table', 'Traceback'],
  tags: 'lcs longest common subsequence dynamic programming string dp diff',
  learn: `
<p>A <b>subsequence</b> keeps some characters of a string in order, not necessarily adjacent: BCDB is a subsequence of ABCBDAB. The <b>longest common subsequence</b> of two strings is the longest string that is a subsequence of both. For <i>X</i> = ABCBDAB and <i>Y</i> = BDCABA, one LCS is BCBA, length 4. Diff tools and DNA alignment are built on this problem.</p>
<p>Brute force would check all 2<sup><i>m</i></sup> subsequences of <i>X</i>. DP does it in Θ(<i>mn</i>).</p>
<h3>Optimal substructure</h3>
<p>Let <i>c</i>[<i>i</i>, <i>j</i>] be the LCS length of the prefixes <i>X</i><sub>i</sub> (first <i>i</i> characters) and <i>Y</i><sub>j</sub>. Look at the last characters:</p>
<ul><li>If <i>x<sub>i</sub></i> = <i>y<sub>j</sub></i>, that character ends an LCS: <i>c</i>[<i>i</i>, <i>j</i>] = <i>c</i>[<i>i</i> − 1, <i>j</i> − 1] + 1.</li><li>Otherwise, at least one of them is not used: <i>c</i>[<i>i</i>, <i>j</i>] = max(<i>c</i>[<i>i</i> − 1, <i>j</i>], <i>c</i>[<i>i</i>, <i>j</i> − 1]).</li></ul>
<p>Row 0 and column 0 are 0 (an empty prefix has an empty LCS). Fill the table row by row; each cell depends only on its upper, left and upper-left neighbours.</p>
<h3>Reconstructing the LCS</h3>
<p>The book stores an arrow <i>b</i>[<i>i</i>, <i>j</i>] recording which case was used: ↖ for a match, ↑ or ← for a skip. Starting at <i>c</i>[<i>m</i>, <i>n</i>], follow arrows back to the border; each ↖ contributes a character, collected in reverse. In code you can skip the <i>b</i> table and decide from the <i>c</i> values.</p>
<div class="note">If you need only the length, keep two rows: Θ(min(<i>m</i>, <i>n</i>)) space. Recovering the sequence itself in linear space needs Hirschberg's algorithm.</div>
<h3>In interviews</h3>
<ul><li>Longest Common Subsequence (LC 1143) is this exact table.</li><li>Edit Distance (LC 72), Delete Operation for Two Strings (LC 583), Shortest Common Supersequence (LC 1092), Distinct Subsequences (LC 115) and Interleaving String (LC 97) all use the same prefix-by-prefix grid with different transitions.</li><li>Longest Common <i>Substring</i> is different: characters must be adjacent, so a mismatch resets the cell to 0.</li></ul>`,
  code: {
    pseudo: `lcsLength(X, Y)
  m ← len(X)
  n ← len(Y)
  allocate b[1..m, 1..n], c[0..m, 0..n]
  for i ← 1 to m
      c[i, 0] ← 0
  for j ← 0 to n
      c[0, j] ← 0
  for i ← 1 to m
      for j ← 1 to n
          if x_i = y_j
              c[i, j] ← c[i - 1, j - 1] + 1
              b[i, j] ← "↖"
          else if c[i - 1, j] ≥ c[i, j - 1]
              c[i, j] ← c[i - 1, j]
              b[i, j] ← "↑"
          else c[i, j] ← c[i, j - 1]
              b[i, j] ← "←"
  return c and b`,
    py: `def lcs(x, y):                                  # LeetCode 1143
    m, n = len(x), len(y)
    c = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if x[i - 1] == y[j - 1]:
                c[i][j] = c[i - 1][j - 1] + 1
            else:
                c[i][j] = max(c[i - 1][j], c[i][j - 1])
    # traceback
    out, i, j = [], m, n
    while i and j:
        if x[i - 1] == y[j - 1]:
            out.append(x[i - 1]); i -= 1; j -= 1
        elif c[i - 1][j] >= c[i][j - 1]:
            i -= 1
        else:
            j -= 1
    return c[m][n], ''.join(reversed(out))

print(lcs("ABCBDAB", "BDCABA"))   # (4, 'BCBA')`,
    cpp: `#include <string>
#include <vector>
#include <algorithm>
using namespace std;

int lcs(const string& x, const string& y) {        // LeetCode 1143
    int m = x.size(), n = y.size();
    vector<int> prev(n + 1, 0), cur(n + 1, 0);      // two rows are enough
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++)
            cur[j] = (x[i - 1] == y[j - 1]) ? prev[j - 1] + 1 : max(prev[j], cur[j - 1]);
        swap(prev, cur);
    }
    return prev[n];
}`,
  },
  viz: {
    inputHint: 'Two strings separated by a space',
    presets: [
      { label: 'Figure 15.8: ABCBDAB, BDCABA', input: 'ABCBDAB BDCABA', note: 'The book’s example. LCS length 4.' },
      { label: 'LeetCode 1143', input: 'abcde ace', note: 'LCS "ace", length 3.' },
      { label: 'DNA strands', input: 'GTTCCTA TCCGATA', note: 'Short gene fragments.' },
    ],
    random: () => { const al = 'ABCD'; const g = () => Array.from({ length: rnd(5, 7) }, () => pick(al)).join(''); return g() + ' ' + g(); },
    parse: s => { const p = s.trim().split(/\s+/); if (p.length !== 2) throw new Error('Enter exactly two strings separated by a space.'); if (p.some(x => x.length > 9)) throw new Error('Keep each string to 9 characters or fewer.'); return p; },
    run([X, Y]) {
      const R = Rec(); const m = X.length, n = Y.length;
      const c = Array.from({ length: m + 1 }, () => Array(n + 1).fill(null)), b = {};
      for (let i = 0; i <= m; i++) c[i][0] = 0; for (let j = 0; j <= n; j++) c[0][j] = 0;
      const st = (hl = {}) => ({ table: { colH: ['', ...Y.split('')], rowH: ['', ...X.split('')], corner: 'c', cells: c.map(r => [...r]), hl, ar: { ...b }, name: 'c' } });
      R.add(st(), 8, `X = ${X} (rows), Y = ${Y} (columns). Row 0 and column 0 are 0.`);
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
        const match = X[i - 1] === Y[j - 1];
        let v, line, arrow;
        if (match) { v = c[i - 1][j - 1] + 1; arrow = '↖'; line = 12; }
        else if (c[i - 1][j] >= c[i][j - 1]) { v = c[i - 1][j]; arrow = '↑'; line = 15; }
        else { v = c[i][j - 1]; arrow = '←'; line = 18; }
        const deps = match ? { [(i - 1) + ',' + (j - 1)]: 'cmp' } : { [(i - 1) + ',' + j]: 'cmp', [i + ',' + (j - 1)]: 'cmp' };
        const ask = dpAsk(.3) ? { q: `x${i} = ${X[i - 1]}, y${j} = ${Y[j - 1]}. What is c[${i}, ${j}]?`, value: v, hint: match ? 'They match: diagonal + 1.' : 'No match: the larger of up and left.', s: { table: { ...st({ ...deps, [i + ',' + j]: 'ask' }).table } } } : null;
        c[i][j] = v; b[i + ',' + j] = arrow;
        R.add(st({ ...deps, [i + ',' + j]: 'cur' }), line, match ? `${X[i - 1]} = ${Y[j - 1]}: c[${i},${j}] = c[${i - 1},${j - 1}] + 1 = ${v}.` : `${X[i - 1]} ≠ ${Y[j - 1]}: c[${i},${j}] = max(${c[i - 1][j]}, ${c[i][j - 1]}) = ${v}.`, ask);
      }
      let i = m, j = n; const path = {}, out = [];
      while (i > 0 && j > 0) { path[i + ',' + j] = 'ok'; if (b[i + ',' + j] === '↖') { out.push(X[i - 1]); path[i + ',' + j] = 'found'; i--; j--; } else if (b[i + ',' + j] === '↑') i--; else j--; }
      R.add(st(path), 13, `Follow the arrows back from c[${m},${n}]. Diagonal steps spell the LCS: ${out.reverse().join('') || '(empty)'}, length ${c[m][n]}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'If x_i = y_j, then c[i, j] equals…', opts: ['max(c[i−1, j], c[i, j−1])', 'c[i−1, j−1] + 1', 'c[i−1, j−1]', '0'], a: 1, why: 'The shared last character extends an LCS of the two shorter prefixes.' },
    { q: 'How long does LCS-LENGTH take on strings of length m and n?', opts: ['Θ(m + n)', 'Θ(mn)', 'Θ(2^m)', 'Θ(mn lg n)'], a: 1, why: 'One constant-time cell per (i, j) pair.' },
    { q: 'What is the LCS length of "abcde" and "ace"?', opts: ['2', '3', '4', '5'], a: 1, why: '"ace" itself is a subsequence of "abcde".' },
    { q: 'For longest common substring (contiguous), a mismatch sets the cell to…', opts: ['the max of up and left', '0', 'diagonal + 1', 'the row number'], a: 1, why: 'A substring must be unbroken, so a mismatch ends it.' },
  ],
});

/* ---------------- matrix chain ---------------- */
topic({
  id: 'matrix-chain', title: 'Matrix-chain multiplication', sec: '§15.2', prereq: ['dp-intro'],
  blurb: 'Choose where to put parentheses so a chain of matrix products costs the fewest scalar multiplications.',
  cx: [['Time', 'Θ(n³)'], ['Space', 'Θ(n²)'], ['Parenthesizations', 'Catalan number, Ω(4ⁿ/n^1.5)']],
  props: ['Interval DP', 'Diagonal order'],
  tags: 'matrix chain multiplication interval dp parenthesization burst balloons',
  learn: `
<p>Multiplying a <i>p</i> × <i>q</i> matrix by a <i>q</i> × <i>r</i> matrix costs <i>pqr</i> scalar multiplications. Matrix multiplication is associative, so a chain <i>A</i><sub>1</sub><i>A</i><sub>2</sub>⋯<i>A<sub>n</sub></i> can be parenthesized in many ways with the same result, but wildly different cost. For dimensions 10 × 100, 100 × 5, 5 × 50, computing ((<i>A</i><sub>1</sub><i>A</i><sub>2</sub>)<i>A</i><sub>3</sub>) costs 7,500 while (<i>A</i><sub>1</sub>(<i>A</i><sub>2</sub><i>A</i><sub>3</sub>)) costs 75,000.</p>
<p>The number of parenthesizations grows like the Catalan numbers, exponentially, so trying them all is hopeless.</p>
<h3>The recurrence</h3>
<p>Matrix <i>A<sub>i</sub></i> has dimensions <i>p</i><sub><i>i</i>−1</sub> × <i>p<sub>i</sub></i>. Let <i>m</i>[<i>i</i>, <i>j</i>] be the minimum cost of computing <i>A<sub>i</sub></i>⋯<i>A<sub>j</sub></i>. The last multiplication splits the chain at some <i>k</i>:</p>
<div class="formula">m[i, j] = min<sub>i ≤ k &lt; j</sub> ( m[i, k] + m[k+1, j] + p<sub>i−1</sub> p<sub>k</sub> p<sub>j</sub> ), &nbsp; m[i, i] = 0</div>
<p>This is an <b>interval DP</b>: subproblems are contiguous ranges, and a range depends only on shorter ranges inside it. So fill the table by increasing chain length <i>l</i> = 2, 3, …, <i>n</i>, which sweeps the diagonals of the upper triangle. Record the best split <i>s</i>[<i>i</i>, <i>j</i>] to print the parenthesization. There are Θ(<i>n</i>²) cells and each tries up to <i>n</i> splits, so Θ(<i>n</i>³).</p>
<h3>Worked example</h3>
<p>Figure 15.5 uses six matrices with dimensions 30 × 35, 35 × 15, 15 × 5, 5 × 10, 10 × 20, 20 × 25. The minimum cost is 15,125, achieved by ((<i>A</i><sub>1</sub>(<i>A</i><sub>2</sub><i>A</i><sub>3</sub>))((<i>A</i><sub>4</sub><i>A</i><sub>5</sub>)<i>A</i><sub>6</sub>)).</p>
<h3>Interval DP in interviews</h3>
<ul><li>Burst Balloons (LC 312) is matrix-chain in disguise: choose the <i>last</i> balloon to burst in each range.</li><li>Minimum Cost Tree From Leaf Values (LC 1130), Minimum Score Triangulation of Polygon (LC 1039), Palindrome Partitioning II (LC 132), Strange Printer (LC 664).</li><li>Signal: “the answer for a range depends on how you split it”. Iterate by length, then left endpoint, then split point.</li></ul>`,
  code: {
    pseudo: `matrixChainOrder(p)
  n ← len(p) - 1
  allocate m[1..n, 1..n], s[1..n - 1, 2..n]
  for i ← 1 to n
      m[i, i] ← 0
  for l ← 2 to n                  // chain length
      for i ← 1 to n - l + 1
          j ← i + l - 1
          m[i, j] ← ∞
          for k ← i to j - 1
              q ← m[i, k] + m[k + 1, j] + p[i-1]·p[k]·p[j]
              if q < m[i, j]
                  m[i, j] ← q
                  s[i, j] ← k
  return m and s`,
    py: `def matrix_chain_order(p):
    n = len(p) - 1
    m = [[0] * (n + 1) for _ in range(n + 1)]
    s = [[0] * (n + 1) for _ in range(n + 1)]
    for l in range(2, n + 1):                 # chain length
        for i in range(1, n - l + 2):
            j = i + l - 1
            m[i][j] = float('inf')
            for k in range(i, j):
                q = m[i][k] + m[k + 1][j] + p[i - 1] * p[k] * p[j]
                if q < m[i][j]:
                    m[i][j], s[i][j] = q, k
    def paren(i, j):
        return f"A{i}" if i == j else f"({paren(i, s[i][j])}{paren(s[i][j] + 1, j)})"
    return m[1][n], paren(1, n)

print(matrix_chain_order([30, 35, 15, 5, 10, 20, 25]))   # (15125, '((A1(A2A3))((A4A5)A6))')`,
    cpp: `#include <vector>
#include <climits>
#include <string>
using namespace std;

long long matrixChain(const vector<int>& p, string& order) {
    int n = p.size() - 1;
    vector<vector<long long>> m(n + 1, vector<long long>(n + 1, 0));
    vector<vector<int>> s(n + 1, vector<int>(n + 1, 0));
    for (int l = 2; l <= n; l++)
        for (int i = 1; i + l - 1 <= n; i++) {
            int j = i + l - 1; m[i][j] = LLONG_MAX;
            for (int k = i; k < j; k++) {
                long long q = m[i][k] + m[k + 1][j] + 1LL * p[i - 1] * p[k] * p[j];
                if (q < m[i][j]) { m[i][j] = q; s[i][j] = k; }
            }
        }
    function<string(int, int)> paren = [&](int i, int j) -> string {
        return i == j ? "A" + to_string(i) : "(" + paren(i, s[i][j]) + paren(s[i][j] + 1, j) + ")";
    };
    order = paren(1, n);
    return m[1][n];
}`,
  },
  viz: {
    inputHint: 'Dimensions p0 p1 … pn',
    presets: [
      { label: 'Figure 15.5', input: '30 35 15 5 10 20 25', note: 'Six matrices. Minimum cost 15,125.' },
      { label: 'Three matrices', input: '10 100 5 50', note: 'The book’s first example: 7,500 versus 75,000.' },
    ],
    random: () => Array.from({ length: rnd(5, 6) }, () => rnd(2, 30)).join(' '),
    parse: s => parseNums(s, { min: 3, max: 8, lo: 1, hi: 200 }),
    run(p) {
      const R = Rec(); const n = p.length - 1;
      const m = Array.from({ length: n }, () => Array(n).fill(undefined)), s = Array.from({ length: n }, () => Array(n).fill(undefined));
      for (let i = 0; i < n; i++) m[i][i] = 0;
      const lbl = Array.from({ length: n }, (_, i) => 'A' + (i + 1));
      const st = (hl = {}, sh = {}, vars) => ({ vars, tables: [{ title: 'm[i, j]: minimum cost of Ai..Aj', colH: lbl, rowH: lbl, cells: m.map(r => [...r]), hl, name: 'm' }, { title: 's[i, j]: best split k', colH: lbl, rowH: lbl, cells: s.map(r => [...r]), hl: sh, name: 's' }] });
      R.add(st(Object.fromEntries(Array.from({ length: n }, (_, i) => [i + ',' + i, 'done']))), 5, `Dimensions: ${lbl.map((l, i) => `${l} is ${p[i]}×${p[i + 1]}`).join(', ')}. A single matrix costs 0.`);
      for (let l = 2; l <= n; l++) for (let i = 0; i + l - 1 < n; i++) {
        const j = i + l - 1; let best = Infinity, bk = -1; const tries = [];
        for (let k = i; k < j; k++) { const q = m[i][k] + m[k + 1][j] + p[i] * p[k + 1] * p[j + 1]; tries.push(`k=${k + 1}: ${q}`); if (q < best) { best = q; bk = k; } }
        const ask = dpAsk(.35) ? { q: `Chain length ${l}: what is m[${i + 1}, ${j + 1}]? Try each split k and take the cheapest.`, value: best, hint: `m[i,k] + m[k+1,j] + p${i}·p_k·p${j + 1}. Options: ${tries.map(t => t.split(':')[0]).join(', ')}.` } : null;
        m[i][j] = best; s[i][j] = bk + 1;
        const deps = {}; for (let k = i; k < j; k++) { deps[i + ',' + k] = 'cmp'; deps[(k + 1) + ',' + j] = 'cmp'; }
        R.add(st({ ...deps, [i + ',' + j]: 'cur' }, { [i + ',' + j]: 'cur' }, { l }), 13, `m[${i + 1},${j + 1}]: ${tries.join(', ')}. Best split k = ${bk + 1}, cost ${best}.`, ask);
      }
      const paren = (i, j) => i === j ? 'A' + (i + 1) : '(' + paren(i, s[i][j] - 1) + paren(s[i][j], j) + ')';
      R.add(st({ ['0,' + (n - 1)]: 'found' }), 15, `Minimum cost ${m[0][n - 1].toLocaleString()} with ${paren(0, n - 1)}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'Multiplying a 10 × 100 matrix by a 100 × 5 matrix costs how many scalar multiplications?', opts: ['500', '1,000', '5,000', '50,000'], a: 2, why: 'p·q·r = 10 · 100 · 5.' },
    { q: 'In what order must the m table be filled?', opts: ['Row by row', 'By increasing chain length (diagonal by diagonal)', 'Column by column from the right', 'Any order'], a: 1, why: 'm[i, j] depends on shorter chains inside [i, j].' },
    { q: 'Matrix-chain order runs in…', opts: ['Θ(n²)', 'Θ(n³)', 'Θ(2ⁿ)', 'Θ(n lg n)'], a: 1, why: 'Θ(n²) cells, up to n splits each.' },
    { q: 'Burst Balloons (LC 312) is solved by an interval DP where for each range you choose…', opts: ['the first balloon to burst', 'the last balloon to burst', 'the largest balloon', 'the middle balloon'], a: 1, why: 'Choosing the last one makes the two sides independent, like a split point k.' },
  ],
});

/* ---------------- knapsack ---------------- */
topic({
  id: 'knapsack', title: '0-1 knapsack', sec: '§16.2', prereq: ['dp-intro'],
  blurb: 'Pick items with weights and values to maximize value under a weight limit, each item at most once.',
  cx: [['Time', 'Θ(nW)'], ['Space', 'Θ(W) with one row'], ['Note', 'pseudo-polynomial']],
  props: ['Take or skip', 'Pseudo-polynomial'],
  tags: 'knapsack 0-1 dynamic programming subset sum partition coin change',
  learn: `
<p>A thief can carry at most <i>W</i> pounds. Item <i>i</i> weighs <i>w<sub>i</sub></i> and is worth <i>v<sub>i</sub></i>. Each item is taken whole or left behind (that is the “0-1”). Maximize the total value.</p>
<p>The book introduces this problem in Section 16.2 to show where greedy fails. With capacity 50 and items (10 lb, $60), (20 lb, $100), (30 lb, $120), greedy by value per pound takes the first two for $160, but the best choice is the last two for $220. In the <b>fractional</b> version you may take part of an item, and greedy by value per pound is optimal. For 0-1 we need DP (Exercise 16.2-2).</p>
<h3>The recurrence</h3>
<p>Let <i>K</i>[<i>i</i>, <i>w</i>] be the best value using only the first <i>i</i> items with capacity <i>w</i>. For item <i>i</i> there are two choices:</p>
<div class="formula">K[i, w] = max( K[i−1, w], &nbsp; v<sub>i</sub> + K[i−1, w − w<sub>i</sub>] ) &nbsp; (second option only if w<sub>i</sub> ≤ w)</div>
<p>Skip it, or take it and solve the rest with less capacity. Base cases are 0. The answer is <i>K</i>[<i>n</i>, <i>W</i>]. Walking back through the table (did the value change from the row above?) recovers which items were taken.</p>
<h3>Pseudo-polynomial time</h3>
<p>The table has (<i>n</i> + 1)(<i>W</i> + 1) cells, so the running time is Θ(<i>nW</i>). That looks polynomial, but <i>W</i> is a number in the input, written in about lg <i>W</i> bits. Doubling the number of bits squares <i>W</i>. Knapsack is in fact NP-complete, and this algorithm is called <b>pseudo-polynomial</b>.</p>
<div class="note key"><b>One-row trick.</b> Each row only reads the row above. Keep one array and iterate <i>w</i> from <b>high to low</b>, so <code>dp[w − w_i]</code> still holds the previous row's value. Iterating low to high instead lets an item be reused, which solves the <b>unbounded</b> knapsack (Coin Change).</div>
<h3>In interviews</h3>
<ul><li>Partition Equal Subset Sum (LC 416): a boolean knapsack with target sum/2.</li><li>Target Sum (LC 494), Last Stone Weight II (LC 1049), Ones and Zeroes (LC 474, two capacities).</li><li>Coin Change (LC 322) and Coin Change II (LC 518) are unbounded variants.</li></ul>`,
  code: {
    pseudo: `knapsack(w, v, n, W)
  allocate K[0..n, 0..W]
  for c ← 0 to W
      K[0, c] ← 0
  for i ← 1 to n
      for c ← 0 to W
          K[i, c] ← K[i - 1, c]                 // skip item i
          if w[i] ≤ c and v[i] + K[i - 1, c - w[i]] > K[i, c]
              K[i, c] ← v[i] + K[i - 1, c - w[i]]   // take item i
  return K[n, W]`,
    py: `def knapsack(weights, values, W):
    dp = [0] * (W + 1)
    for w, v in zip(weights, values):
        for c in range(W, w - 1, -1):     # high to low: each item used once
            dp[c] = max(dp[c], v + dp[c - w])
    return dp[W]

def can_partition(nums):                  # LeetCode 416
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    ok = [True] + [False] * target
    for x in nums:
        for c in range(target, x - 1, -1):
            ok[c] = ok[c] or ok[c - x]
    return ok[target]

print(knapsack([10, 20, 30], [60, 100, 120], 50))   # 220`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

int knapsack(const vector<int>& w, const vector<int>& v, int W) {
    vector<int> dp(W + 1, 0);
    for (size_t i = 0; i < w.size(); i++)
        for (int c = W; c >= w[i]; c--)          // high to low
            dp[c] = max(dp[c], v[i] + dp[c - w[i]]);
    return dp[W];
}

int coinChange(const vector<int>& coins, int amount) {    // LeetCode 322, unbounded
    vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++)
        for (int c : coins) if (c <= a) dp[a] = min(dp[a], dp[a - c] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}`,
  },
  viz: {
    inputHint: 'W=capacity | weight:value pairs',
    presets: [
      { label: 'Small example', input: 'W=7 | 1:1 3:4 4:5 5:7', note: 'Best: weights 3 + 4 for value 9.' },
      { label: 'Figure 16.2, scaled ÷10', input: 'W=5 | 1:60 2:100 3:120', note: 'The book’s greedy counterexample with weights divided by 10. Answer 220.' },
    ],
    random: () => `W=${rnd(6, 9)} | ` + Array.from({ length: rnd(3, 4) }, () => `${rnd(1, 5)}:${rnd(2, 12)}`).join(' '),
    parse: s => { const m = /^\s*W\s*=\s*(\d+)\s*\|(.*)$/i.exec(s); if (!m) throw new Error('Use the form "W=7 | 1:1 3:4 4:5".'); const W = +m[1]; if (W < 1 || W > 12) throw new Error('Keep W between 1 and 12 so the table fits.'); const items = m[2].trim().split(/\s+/).map(t => { const [a, b] = t.split(':').map(Number); if (!(a > 0 && b >= 0)) throw new Error(`"${t}" should look like weight:value.`); return [a, b]; }); if (items.length > 6) throw new Error('Use at most 6 items.'); return { W, items }; },
    run({ W, items }) {
      const R = Rec(); const n = items.length;
      const K = Array.from({ length: n + 1 }, (_, i) => Array(W + 1).fill(i === 0 ? 0 : null));
      const st = (hl = {}, vars) => ({ vars, table: { title: 'K[i, c]: best value from the first i items with capacity c', colH: Array.from({ length: W + 1 }, (_, c) => c), rowH: ['none', ...items.map(([w, v], i) => `${i + 1} (w${w}, $${v})`)], corner: 'item \\ c', cells: K.map(r => [...r]), hl, name: 'K' } });
      R.add(st(), 4, 'Row 0: with no items, the value is 0 for every capacity.');
      for (let i = 1; i <= n; i++) {
        const [w, v] = items[i - 1];
        for (let c = 0; c <= W; c++) {
          const skip = K[i - 1][c], take = w <= c ? v + K[i - 1][c - w] : -Infinity, val = Math.max(skip, take);
          const deps = { [(i - 1) + ',' + c]: 'cmp', ...(w <= c ? { [(i - 1) + ',' + (c - w)]: 'cmp' } : {}) };
          const ask = c >= w && dpAsk(.3) ? { q: `Item ${i} (weight ${w}, value ${v}), capacity ${c}. What is K[${i}, ${c}]?`, value: val, hint: `max(skip = ${skip}, take = ${v} + K[${i - 1}, ${c - w}])`, s: st({ ...deps, [i + ',' + c]: 'ask' }) } : null;
          K[i][c] = val;
          if (c >= w || c === 0) R.add(st({ ...deps, [i + ',' + c]: 'cur' }, { 'skip': skip, 'take': w <= c ? take : '—' }), take > skip ? 9 : 7, w > c ? `Item ${i} weighs ${w} > ${c}: it cannot fit, copy ${skip} from above.` : take > skip ? `Take item ${i}: ${v} + K[${i - 1},${c - w}] = ${take} beats skipping (${skip}).` : `Skip item ${i}: ${skip} ≥ take (${take}).`, ask);
        }
        R.add(st(Object.fromEntries(Array.from({ length: W + 1 }, (_, c) => [i + ',' + c, 'done']))), 6, `Row ${i} complete.`);
      }
      let c = W; const taken = [], path = {};
      for (let i = n; i > 0; i--) { path[i + ',' + c] = 'ok'; if (K[i][c] !== K[i - 1][c]) { taken.push(i); path[i + ',' + c] = 'found'; c -= items[i - 1][0]; } }
      R.add(st(path), 10, `Best value ${K[n][W]}. Tracing back: take item${taken.length > 1 ? 's' : ''} ${taken.reverse().join(', ') || 'none'}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'Why is greedy by value-per-weight wrong for 0-1 knapsack?', opts: ['It is too slow', 'Taking the densest item whole can waste capacity that a different combination would use better', 'It ignores weights', 'It is right'], a: 1, why: 'The book’s example: greedy gets $160, optimal is $220.' },
    { q: 'The DP for 0-1 knapsack runs in Θ(nW). Why is that called pseudo-polynomial?', opts: ['Because W can be exponential in the number of bits used to write it', 'Because it uses recursion', 'Because n is small', 'It is truly polynomial'], a: 0, why: 'Input size is about lg W bits, and the time is exponential in that.' },
    { q: 'With a one-dimensional dp array, why iterate capacity from high to low for 0-1 knapsack?', opts: ['It is faster', 'So each item is used at most once: dp[c − w] still holds the previous row', 'To handle negatives', 'It does not matter'], a: 1, why: 'Low to high would let the same item be added again, the unbounded variant.' },
    { q: 'Partition Equal Subset Sum reduces to…', opts: ['LCS', 'a 0-1 knapsack asking whether sum/2 is reachable', 'activity selection', 'shortest paths'], a: 1, why: 'Each number is taken or not; the target is half the total.' },
  ],
});

/* ---------------- edit distance ---------------- */
topic({
  id: 'edit-distance', title: 'Edit distance', sec: 'Problem 15-5', prereq: ['lcs'],
  blurb: 'The fewest insertions, deletions and substitutions that turn one string into another.',
  cx: [['Time', 'Θ(mn)'], ['Space', 'Θ(min(m, n)) for the value']],
  props: ['Levenshtein', '2-D table'],
  tags: 'edit distance levenshtein dynamic programming string insert delete replace',
  learn: `
<p>The <b>edit distance</b> (Levenshtein distance) between strings <i>x</i> and <i>y</i> is the minimum number of single-character operations that transform <i>x</i> into <i>y</i>: insert a character, delete a character, or replace one character by another. “kitten” becomes “sitting” in 3 edits: replace k→s, replace e→i, insert g. Spell checkers, DNA alignment and fuzzy search depend on it. The book's Problem 15-5 generalizes it with costs for each operation, including copy and twiddle.</p>
<h3>The recurrence</h3>
<p>Let <i>D</i>[<i>i</i>, <i>j</i>] be the edit distance between the first <i>i</i> characters of <i>x</i> and the first <i>j</i> of <i>y</i>. Base cases: <i>D</i>[<i>i</i>, 0] = <i>i</i> (delete everything) and <i>D</i>[0, <i>j</i>] = <i>j</i> (insert everything). Otherwise, consider the last characters:</p>
<ul><li>If <i>x<sub>i</sub></i> = <i>y<sub>j</sub></i>: no operation needed, <i>D</i>[<i>i</i>, <i>j</i>] = <i>D</i>[<i>i</i> − 1, <i>j</i> − 1].</li><li>Otherwise, 1 + the minimum of
<ul><li><i>D</i>[<i>i</i> − 1, <i>j</i> − 1]: replace <i>x<sub>i</sub></i> with <i>y<sub>j</sub></i>,</li><li><i>D</i>[<i>i</i> − 1, <i>j</i>]: delete <i>x<sub>i</sub></i>,</li><li><i>D</i>[<i>i</i>, <i>j</i> − 1]: insert <i>y<sub>j</sub></i>.</li></ul></li></ul>
<p>The grid has the same shape as <a href="/learn/lcs">LCS</a>: each cell looks at its diagonal, upper and left neighbours. In fact, if only insertions and deletions are allowed, the edit distance is <i>m</i> + <i>n</i> − 2·LCS.</p>
<h3>In interviews</h3>
<ul><li>Edit Distance (LC 72) is a frequent hard question. Explain the three neighbour moves as the three operations.</li><li>One Edit Distance (LC 161) needs only a linear scan.</li><li>Minimum ASCII Delete Sum (LC 712) and Delete Operation for Two Strings (LC 583) change the costs.</li></ul>`,
  code: {
    pseudo: `editDistance(x, y)
  m ← len(x)
  n ← len(y)
  allocate D[0..m, 0..n]
  for i ← 0 to m
      D[i, 0] ← i
  for j ← 0 to n
      D[0, j] ← j
  for i ← 1 to m
      for j ← 1 to n
          if x_i = y_j
              D[i, j] ← D[i - 1, j - 1]
          else D[i, j] ← 1 + min(D[i - 1, j - 1],   // replace
                                 D[i - 1, j],       // delete
                                 D[i, j - 1])       // insert
  return D[m, n]`,
    py: `def edit_distance(x, y):                     # LeetCode 72
    m, n = len(x), len(y)
    prev = list(range(n + 1))
    for i in range(1, m + 1):
        cur = [i] + [0] * n
        for j in range(1, n + 1):
            if x[i - 1] == y[j - 1]:
                cur[j] = prev[j - 1]
            else:
                cur[j] = 1 + min(prev[j - 1], prev[j], cur[j - 1])
        prev = cur
    return prev[n]

print(edit_distance("kitten", "sitting"))    # 3`,
    cpp: `#include <string>
#include <vector>
#include <algorithm>
using namespace std;

int minDistance(const string& x, const string& y) {    // LeetCode 72
    int m = x.size(), n = y.size();
    vector<int> prev(n + 1), cur(n + 1);
    for (int j = 0; j <= n; j++) prev[j] = j;
    for (int i = 1; i <= m; i++) {
        cur[0] = i;
        for (int j = 1; j <= n; j++)
            cur[j] = x[i - 1] == y[j - 1] ? prev[j - 1]
                   : 1 + min({prev[j - 1], prev[j], cur[j - 1]});
        swap(prev, cur);
    }
    return prev[n];
}`,
  },
  viz: {
    inputHint: 'Two words separated by a space',
    presets: [{ label: 'kitten → sitting', input: 'kitten sitting', note: 'Distance 3.' }, { label: 'horse → ros (LC 72)', input: 'horse ros', note: 'Distance 3: replace h, delete r, delete e.' }, { label: 'intention → execution', input: 'intention execution', note: 'Distance 5.' }],
    random: () => { const w = shuffle(['cat', 'cart', 'chart', 'march', 'match', 'batch', 'patch', 'catch', 'mat', 'mart']); return w[0] + ' ' + w[1]; },
    parse: s => { const p = s.trim().split(/\s+/); if (p.length !== 2) throw new Error('Enter two words separated by a space.'); if (p.some(x => x.length > 9)) throw new Error('Keep each word to 9 characters or fewer.'); return p; },
    run([x, y]) {
      const R = Rec(); const m = x.length, n = y.length;
      const D = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : null));
      const st = (hl = {}) => ({ table: { colH: ['', ...y.split('')], rowH: ['', ...x.split('')], corner: 'D', cells: D.map(r => [...r]), hl, name: 'D' } });
      R.add(st(), 8, `Turn "${x}" (rows) into "${y}" (columns). Row 0 counts insertions, column 0 counts deletions.`);
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
        const eq = x[i - 1] === y[j - 1];
        const rep = D[i - 1][j - 1], del = D[i - 1][j], ins = D[i][j - 1];
        const v = eq ? rep : 1 + Math.min(rep, del, ins);
        const deps = eq ? { [(i - 1) + ',' + (j - 1)]: 'cmp' } : { [(i - 1) + ',' + (j - 1)]: 'cmp', [(i - 1) + ',' + j]: 'cmp', [i + ',' + (j - 1)]: 'cmp' };
        const ask = dpAsk(.3) ? { q: `"${x.slice(0, i)}" → "${y.slice(0, j)}": what is D[${i}, ${j}]?`, value: v, hint: eq ? 'Last letters match: copy the diagonal.' : '1 + min(diagonal, up, left).', s: st({ ...deps, [i + ',' + j]: 'ask' }) } : null;
        D[i][j] = v;
        const op = eq ? 'match' : v === 1 + rep ? 'replace' : v === 1 + del ? 'delete' : 'insert';
        R.add(st({ ...deps, [i + ',' + j]: 'cur' }), eq ? 12 : 13, eq ? `${x[i - 1]} = ${y[j - 1]}: D[${i},${j}] = D[${i - 1},${j - 1}] = ${v}.` : `${x[i - 1]} ≠ ${y[j - 1]}: 1 + min(replace ${rep}, delete ${del}, insert ${ins}) = ${v} (${op}).`, ask);
      }
      let i = m, j = n; const path = {}, ops = [];
      while (i > 0 || j > 0) { path[i + ',' + j] = 'ok'; if (i > 0 && j > 0 && x[i - 1] === y[j - 1] && D[i][j] === D[i - 1][j - 1]) { i--; j--; } else if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + 1) { ops.push(`replace ${x[i - 1]}→${y[j - 1]}`); path[i + ',' + j] = 'found'; i--; j--; } else if (i > 0 && D[i][j] === D[i - 1][j] + 1) { ops.push(`delete ${x[i - 1]}`); path[i + ',' + j] = 'found'; i--; } else { ops.push(`insert ${y[j - 1]}`); path[i + ',' + j] = 'found'; j--; } }
      R.add(st(path), 16, `Edit distance ${D[m][n]}: ${ops.reverse().join(', ') || 'no edits'}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'In the edit-distance table, moving from D[i−1, j] to D[i, j] corresponds to…', opts: ['inserting y_j', 'deleting x_i', 'replacing x_i', 'a match'], a: 1, why: 'You consumed x_i without producing any of y.' },
    { q: 'What is the edit distance between "abc" and "abc"?', opts: ['0', '1', '3', '6'], a: 0, why: 'Every diagonal step is a free match.' },
    { q: 'If only insertions and deletions are allowed, edit distance equals…', opts: ['m + n', 'm + n − 2·LCS(x, y)', 'max(m, n)', 'LCS(x, y)'], a: 1, why: 'Delete what is not in the LCS from x, insert what is not in the LCS from y.' },
  ],
});

/* ---------------- greedy: activity selection ---------------- */
export function timeline(acts, cls = {}, maxT, extra = '') {
  const T = maxT || Math.max(...acts.map(a => a[2]));
  const rows = acts.map(([id, s, f]) => `<div class="tl-row"><span class="tl-lab">a${id}</span><div class="tl-track"><div class="tl-bar ${cls[id] ? 'c-' + cls[id] : ''}" data-k="a:${id}" style="left:${100 * s / T}%;width:${100 * (f - s) / T}%">${s}–${f}</div></div></div>`).join('');
  const ticks = Array.from({ length: T + 1 }, (_, t) => t).filter(t => t % 2 === 0).map(t => `<span style="left:${100 * t / T}%">${t}</span>`).join('');
  return `<div class="tl">${rows}<div class="tl-row"><span class="tl-lab"></span><div class="tl-axis">${ticks}</div></div>${extra}</div>`;
}
topic({
  id: 'greedy', title: 'Greedy algorithms: activity selection', sec: '§16.1–16.2', prereq: ['dp-intro'],
  blurb: 'Make the locally best choice and never look back, when you can prove it stays optimal.',
  cx: [['Activity selection', 'Θ(n) after sorting'], ['With sort', 'Θ(n lg n)']],
  props: ['Greedy choice property', 'Exchange argument'],
  tags: 'greedy activity selection interval scheduling non overlapping exchange argument',
  learn: `
<p>A <b>greedy algorithm</b> builds a solution step by step, always making the choice that looks best right now. It is simpler and faster than dynamic programming, but it only works when the problem has the <b>greedy-choice property</b>: some optimal solution begins with the greedy choice. You need a proof; intuition is not enough (see <a href="/learn/knapsack">0-1 knapsack</a>, where greedy fails).</p>
<h3>Activity selection</h3>
<p>Activities <i>a</i><sub>1</sub>, …, <i>a<sub>n</sub></i> want to use one room. Activity <i>a<sub>i</sub></i> occupies [<i>s<sub>i</sub></i>, <i>f<sub>i</sub></i>). Two activities are compatible if their intervals do not overlap. Find a largest set of mutually compatible activities.</p>
<p>Several greedy rules sound reasonable: shortest first, earliest start first, fewest conflicts first. All three fail on some input. The rule that works is <b>earliest finish time first</b>: sort by finish time, take the first activity, then repeatedly take the next activity that starts no earlier than the last chosen one finishes.</p>
<div class="note key"><b>Why it is optimal (exchange argument).</b> Let <i>a<sub>m</sub></i> be the activity that finishes first. Take any optimal solution and its earliest-finishing activity <i>a<sub>j</sub></i>. Replace <i>a<sub>j</sub></i> with <i>a<sub>m</sub></i>: since <i>f<sub>m</sub></i> ≤ <i>f<sub>j</sub></i>, nothing else conflicts, and the size is unchanged. So some optimal solution contains <i>a<sub>m</sub></i>, and the rest of the problem is the same problem on the activities that start after <i>f<sub>m</sub></i>.</div>
<p>After sorting, the scan is a single pass: Θ(<i>n</i>). With sorting, Θ(<i>n</i> lg <i>n</i>).</p>
<h3>Elements of the greedy strategy</h3>
<p>Section 16.2 compares greedy with DP. Both need optimal substructure. DP makes a choice after solving subproblems; greedy makes the choice first and then solves the single remaining subproblem. Proving a greedy algorithm usually follows the same template: show the greedy choice is safe (exchange argument), then show the remaining subproblem has the same form.</p>
<h3>In interviews</h3>
<ul><li>Non-overlapping Intervals (LC 435): the answer is <i>n</i> minus the activity-selection count.</li><li>Minimum Number of Arrows to Burst Balloons (LC 452) is the same scan.</li><li>Meeting Rooms II (LC 253) asks for the number of rooms: sort starts and ends, or use a min-heap of end times.</li><li>Jump Game (LC 55, 45), Gas Station (LC 134), Task Scheduler (LC 621) are other classic greedy problems.</li></ul>`,
  code: {
    pseudo: `greedyActivitySelector(s, f)       // activities sorted by finish time
  n ← len(s)
  A ← {a1}
  k ← 1
  for m ← 2 to n
      if s[m] ≥ f[k]
          A ← A ∪ {am}
          k ← m
  return A`,
    py: `def select_activities(intervals):
    intervals = sorted(intervals, key=lambda x: x[1])    # by finish time
    chosen, last_end = [], float('-inf')
    for s, f in intervals:
        if s >= last_end:
            chosen.append((s, f))
            last_end = f
    return chosen

def erase_overlap_intervals(intervals):                  # LeetCode 435
    return len(intervals) - len(select_activities(intervals))

acts = [(1, 4), (3, 5), (0, 6), (5, 7), (3, 9), (5, 9), (6, 10), (8, 11), (8, 12), (2, 14), (12, 16)]
print(select_activities(acts))   # [(1, 4), (5, 7), (8, 11), (12, 16)]`,
    cpp: `#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

int maxActivities(vector<pair<int, int>> a) {      // (start, finish)
    sort(a.begin(), a.end(), [](auto& x, auto& y) { return x.second < y.second; });
    int count = 0, lastEnd = INT_MIN;
    for (auto& [s, f] : a)
        if (s >= lastEnd) { count++; lastEnd = f; }
    return count;
}`,
  },
  viz: {
    inputHint: 'start-finish pairs, e.g. 1-4 3-5 0-6',
    presets: [
      { label: 'Book’s 11 activities', input: '1-4 3-5 0-6 5-7 3-9 5-9 6-10 8-11 8-12 2-14 12-16', note: 'The table at the start of Section 16.1. The greedy answer is {a1, a4, a8, a11}.' },
      { label: 'Shortest-first trap', input: '0-5 4-7 6-11', note: 'The short middle activity conflicts with both others. Earliest finish still picks two.' },
    ],
    random: () => Array.from({ length: rnd(6, 9) }, () => { const s = rnd(0, 12); return `${s}-${s + rnd(1, 5)}`; }).join(' '),
    parse: s => { const acts = s.trim().split(/\s+/).map(t => { const m = /^(\d+)-(\d+)$/.exec(t); if (!m || +m[2] <= +m[1]) throw new Error(`"${t}" should look like start-finish with finish > start.`); return [+m[1], +m[2]]; }); if (acts.length > 12) throw new Error('Use at most 12 activities.'); return acts; },
    run(raw) {
      const R = Rec(); const acts = raw.map(([s, f], i) => [i + 1, s, f]).sort((a, b) => a[2] - b[2] || a[1] - b[1]).map((a, i) => [i + 1, a[1], a[2]]);
      const T = Math.max(...acts.map(a => a[2]));
      const cls = {}; const st = () => ({ html: timeline(acts, cls, T) , order: ['vars', 'html'], vars: { 'last finish': lastF, chosen: acts.filter(a => cls[a[0]] === 'done').length } });
      let lastF = -Infinity;
      R.add({ ...st(), vars: { activities: acts.length } }, 1, 'Activities sorted by finish time, numbered a1 to an in that order.');
      cls[1] = 'done'; lastF = acts[0][2];
      R.add(st(), 3, `Always take a1, which finishes first (at ${acts[0][2]}).`);
      for (let m = 1; m < acts.length; m++) {
        const [id, s, f] = acts[m];
        const ok = s >= lastF;
        cls[id] = 'cmp';
        const ask = { q: `a${id} runs ${s}–${f}. The last chosen activity finishes at ${lastF}. Take a${id}?`, choices: ['Take it', 'Skip it'], answer: ok ? 0 : 1, hint: 'It is compatible if it starts at or after the last finish.' };
        R.add(st(), 6, `Consider a${id} (${s}–${f}).`);
        if (ok) { const prevF = lastF; cls[id] = 'done'; lastF = f; R.add(st(), 7, `a${id} starts at ${s} ≥ ${prevF}: compatible. Take it; the room is now busy until ${f}.`, ask); }
        else { cls[id] = 'dim'; R.add(st(), 6, `a${id} starts at ${s}, before ${lastF}: it overlaps. Skip.`, ask); }
      }
      R.add(st(), 9, `Selected ${acts.filter(a => cls[a[0]] === 'done').map(a => 'a' + a[0]).join(', ')}: ${acts.filter(a => cls[a[0]] === 'done').length} activities, the maximum possible.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'Which greedy rule is optimal for activity selection?', opts: ['Shortest activity first', 'Earliest start first', 'Earliest finish first', 'Fewest overlaps first'], a: 2, why: 'Finishing earliest leaves the most room for everything else. The others have counterexamples.' },
    { q: 'An exchange argument shows that…', opts: ['the greedy algorithm is fast', 'some optimal solution can be transformed to include the greedy choice without getting worse', 'DP is required', 'the input must be sorted'], a: 1, why: 'That is the greedy-choice property.' },
    { q: 'Non-overlapping Intervals (LC 435) asks for the minimum removals. The answer is…', opts: ['the activity-selection count', 'n minus the activity-selection count', 'the number of overlaps', 'n/2'], a: 1, why: 'Keep the largest compatible set and remove the rest.' },
    { q: 'Greedy and DP both require…', opts: ['sorted input', 'optimal substructure', 'overlapping subproblems', 'a heap'], a: 1, why: 'Greedy additionally needs the greedy-choice property.' },
  ],
});

/* ---------------- Huffman ---------------- */
topic({
  id: 'huffman', title: 'Huffman codes', sec: '§16.3', prereq: ['greedy', 'binary-heap'],
  blurb: 'Build an optimal prefix code by repeatedly merging the two least frequent symbols.',
  cx: [['Time', 'O(n lg n)'], ['Queue operations', '2n − 1 extractions']],
  props: ['Prefix code', 'Min-priority queue'],
  tags: 'huffman coding compression prefix code greedy priority queue',
  learn: `
<p>To compress text, give frequent characters short codewords and rare ones long codewords. A <b>prefix code</b> is one where no codeword is a prefix of another, so a bit stream decodes unambiguously from left to right. Any prefix code is a binary tree: each character is a leaf, and its codeword is the path from the root (0 for left, 1 for right).</p>
<p>The cost of a tree <i>T</i> is the total number of bits to encode the file, <i>B</i>(<i>T</i>) = Σ <i>c.freq</i> · <i>d<sub>T</sub></i>(<i>c</i>), where <i>d</i> is the leaf's depth. Huffman's algorithm finds a tree of minimum cost.</p>
<h3>The algorithm</h3>
<p>Start with each character as a one-node tree, keyed by its frequency, in a <b>min-priority queue</b>. Repeat <i>n</i> − 1 times: extract the two trees with the smallest frequencies, make them children of a new node whose frequency is their sum, and insert the new node. The last remaining tree is the code.</p>
<p>With a binary heap, each of the <i>n</i> − 1 iterations costs O(lg <i>n</i>), so O(<i>n</i> lg <i>n</i>) overall.</p>
<h3>Why greedy works</h3>
<ul><li><b>Greedy choice</b> (Lemma 16.2): there is an optimal tree in which the two least frequent characters are sibling leaves at the maximum depth. Swapping them into the deepest positions never increases the cost.</li><li><b>Optimal substructure</b> (Lemma 16.3): merging those two into one character with their combined frequency gives a smaller instance, and an optimal tree for it expands to an optimal tree for the original.</li></ul>
<h3>Worked example</h3>
<p>The book's file has characters a–f with frequencies (in thousands) 45, 13, 12, 16, 9, 5. A fixed 3-bit code uses 300,000 bits. Huffman's code (a = 0, b = 101, c = 100, d = 111, e = 1101, f = 1100) uses 224,000 bits, about 25% less.</p>
<h3>In interviews</h3>
<ul><li>The merge-two-smallest pattern solves Minimum Cost to Connect Sticks (LC 1167) and Last Stone Weight (LC 1046, with max instead).</li><li>Explaining why a heap is needed (repeated extract-min with insertions) is the key point.</li></ul>`,
  code: {
    pseudo: `huffman(C)
  n ← |C|
  Q ← C                         // min-priority queue keyed on freq
  for i ← 1 to n - 1
      z ← new node
      z.left ← x ← extractMin(Q)
      z.right ← y ← extractMin(Q)
      z.freq ← x.freq + y.freq
      insert(Q, z)
  return extractMin(Q)         // the root of the code tree`,
    py: `import heapq
from itertools import count

def huffman(freq):                       # freq: dict symbol -> frequency
    tie = count()                        # tie-breaker so heap never compares trees
    heap = [(f, next(tie), sym) for sym, f in freq.items()]
    heapq.heapify(heap)
    while len(heap) > 1:
        f1, _, x = heapq.heappop(heap)
        f2, _, y = heapq.heappop(heap)
        heapq.heappush(heap, (f1 + f2, next(tie), (x, y)))
    codes = {}
    def walk(node, code):
        if isinstance(node, tuple):
            walk(node[0], code + '0')
            walk(node[1], code + '1')
        else:
            codes[node] = code or '0'
    walk(heap[0][2], '')
    return codes

print(huffman({'a': 45, 'b': 13, 'c': 12, 'd': 16, 'e': 9, 'f': 5}))`,
    cpp: `#include <queue>
#include <vector>
#include <string>
#include <map>
using namespace std;

struct Node { int freq; char sym; Node *l, *r; };
struct Cmp { bool operator()(Node* a, Node* b) const { return a->freq > b->freq; } };

void codes(Node* x, string s, map<char, string>& out) {
    if (!x->l) { out[x->sym] = s.empty() ? "0" : s; return; }
    codes(x->l, s + "0", out); codes(x->r, s + "1", out);
}

map<char, string> huffman(const vector<pair<char, int>>& freq) {
    priority_queue<Node*, vector<Node*>, Cmp> q;
    for (auto [c, f] : freq) q.push(new Node{f, c, nullptr, nullptr});
    while (q.size() > 1) {
        Node* x = q.top(); q.pop();
        Node* y = q.top(); q.pop();
        q.push(new Node{x->freq + y->freq, 0, x, y});
    }
    map<char, string> out; codes(q.top(), "", out);
    return out;
}`,
  },
  viz: {
    inputHint: 'symbol:frequency pairs',
    presets: [{ label: 'Figure 16.5', input: 'a:45 b:13 c:12 d:16 e:9 f:5', note: 'The book’s six characters. Total cost 224 (thousand bits).' }, { label: 'Equal frequencies', input: 'a:1 b:1 c:1 d:1', note: 'With equal weights, Huffman produces a balanced tree: 2 bits each.' }],
    random: () => shuffle('abcdefg'.split('')).slice(0, rnd(4, 6)).map(c => `${c}:${rnd(1, 30)}`).join(' '),
    parse: s => { const p = s.trim().split(/\s+/).map(t => { const m = /^(\S):(\d+)$/.exec(t); if (!m || +m[2] < 1) throw new Error(`"${t}" should look like a:45.`); return [m[1], +m[2]]; }); if (p.length < 2 || p.length > 8) throw new Error('Use between 2 and 8 symbols.'); return p; },
    run(pairs) {
      const R = Rec(); const N = {}; let nid = 1; let Q = [];
      for (const [c, f] of pairs) { const id = nid++; N[id] = { k: f, sym: c, l: null, r: null }; Q.push(id); }
      const sortQ = () => Q.sort((a, b) => N[a].k - N[b].k || a - b);
      sortQ();
      const st = (hl = {}) => { const nodes = {}, elab = {}; for (const id in N) { nodes[id] = { k: N[id].k, c: N[id].l ? [N[id].l, N[id].r] : [], cls: hl[id], note: N[id].sym ? N[id].sym : undefined }; if (N[id].l) { elab[N[id].l] = '0'; elab[N[id].r] = '1'; } } return { tree: { nodes, roots: [...Q], elab, levelH: 62, gap: 8 }, arrays: [{ name: 'q', label: 'Min-priority queue (by frequency)', a: Q.map(id => N[id].sym ? `${N[id].sym}:${N[id].k}` : N[id].k), noIdx: true, small: true }] }; };
      R.add(st(), 3, 'Each symbol starts as its own tree, keyed by frequency.');
      for (let i = 1; i < pairs.length; i++) {
        const x = Q[0], y = Q[1];
        R.add(st({ [x]: 'cmp', [y]: 'cmp' }), 6, `EXTRACT-MIN twice: ${N[x].sym || ''}${N[x].sym ? ':' : ''}${N[x].k} and ${N[y].sym || ''}${N[y].sym ? ':' : ''}${N[y].k}.`, { q: 'Which trees are merged next? Click one of them.', pick: ['n:' + x, 'n:' + y], hint: 'The two smallest roots.' });
        const z = nid++; N[z] = { k: N[x].k + N[y].k, l: x, r: y };
        Q = Q.slice(2); Q.push(z); sortQ();
        R.add(st({ [z]: 'cur' }), 9, `New node with frequency ${N[z].k} = ${N[x].k} + ${N[y].k}; insert it into the queue.`);
      }
      const codes = {}; (function w(id, s) { if (!N[id].l) { codes[N[id].sym] = s || '0'; return; } w(N[id].l, s + '0'); w(N[id].r, s + '1'); })(Q[0]);
      const cost = pairs.reduce((t, [c, f]) => t + f * codes[c].length, 0), fixed = Math.ceil(Math.log2(pairs.length)) * pairs.reduce((t, p) => t + p[1], 0);
      const out = st(); out.table = { title: 'Codewords', colH: ['symbol', 'freq', 'code', 'bits'], cells: pairs.map(([c, f]) => [c, f, codes[c], f * codes[c].length]) };
      R.add(out, 10, `Done. Total cost ${cost} bits versus ${fixed} with a fixed-length code.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'In a prefix code…', opts: ['every codeword has the same length', 'no codeword is a prefix of another', 'codewords are sorted', 'the first bit encodes the length'], a: 1, why: 'That is what makes left-to-right decoding unambiguous.' },
    { q: 'Huffman’s algorithm merges…', opts: ['the two most frequent trees', 'the two least frequent trees', 'a random pair', 'adjacent symbols'], a: 1, why: 'The rarest symbols should sit deepest in the tree.' },
    { q: 'Using a binary heap, Huffman’s algorithm on n symbols runs in…', opts: ['O(n)', 'O(n lg n)', 'O(n²)', 'O(2ⁿ)'], a: 1, why: 'n − 1 iterations, each a constant number of O(lg n) heap operations.' },
    { q: 'For the book’s frequencies, a fixed 3-bit code costs 300,000 bits. Huffman costs about…', opts: ['150,000', '224,000', '280,000', '300,000'], a: 1, why: 'A saving of roughly 25%.' },
  ],
});

/* ---------------- backtracking ---------------- */
topic({
  id: 'backtracking', title: 'Backtracking', sec: 'Beyond the book', prereq: ['divide-conquer', 'tree-basics'], beyond: true,
  blurb: 'Search a tree of partial solutions depth first, undoing each choice and pruning branches that cannot work.',
  cx: [['Subsets', 'O(2ⁿ · n)'], ['Permutations', 'O(n! · n)'], ['N-Queens', 'O(n!) with pruning']],
  props: ['Choose, explore, unchoose', 'Pruning'],
  tags: 'backtracking recursion subsets permutations combinations n queens sudoku word search',
  learn: `
<p>Some problems ask for <b>all</b> solutions, or any solution in a huge search space: every subset, every permutation, every way to place queens on a board. <b>Backtracking</b> builds a candidate one decision at a time and abandons (backtracks from) a partial candidate as soon as it cannot lead to a valid solution.</p>
<p>The search forms a <b>state-space tree</b>: the root is the empty choice, each level fixes one more decision, and leaves are complete candidates. Backtracking is depth-first search on that tree; <b>pruning</b> cuts off subtrees early.</p>
<div class="note key"><b>The template.</b> <code>def bt(state): if complete(state): record; return. for choice in choices(state): if valid(choice): make(choice); bt(state); undo(choice)</code>. Choose, explore, unchoose. The undo step is what lets one mutable state serve the whole search.</div>
<h3>Three classic shapes</h3>
<ul><li><b>Subsets</b> (LC 78): at each index, include the element or not. 2<sup><i>n</i></sup> leaves.</li><li><b>Permutations</b> (LC 46): at each position, pick any unused element. <i>n</i>! leaves.</li><li><b>Combinations</b> with a target (LC 39, 40, 77): like subsets, but stop when the running sum exceeds the target, and skip duplicates by sorting first.</li></ul>
<h3>N-Queens</h3>
<p>Place <i>n</i> queens on an <i>n</i> × <i>n</i> board so none attack each other. Put one queen per row. In each row, try each column; skip columns or diagonals already attacked (track them in three sets: columns, <i>r</i> − <i>c</i>, <i>r</i> + <i>c</i>). If a row has no safe column, backtrack to the previous row and move its queen. The visualizer runs this search. For <i>n</i> = 8 there are 92 solutions, found after exploring about 2,000 nodes instead of 16 million naive placements.</p>
<h3>Complexity</h3>
<p>Backtracking is exponential in the worst case; the goal is to prune enough. Good pruning comes from checking constraints as early as possible and ordering choices so failures happen near the root. When subproblems repeat, add memoization and it becomes dynamic programming.</p>
<h3>In interviews</h3>
<ul><li>Subsets, Permutations, Combination Sum, Letter Combinations of a Phone Number (LC 17), Generate Parentheses (LC 22).</li><li>N-Queens (LC 51), Sudoku Solver (LC 37), Word Search (LC 79), Palindrome Partitioning (LC 131).</li><li>State the complexity as (number of leaves) × (work per leaf), for example O(2<sup><i>n</i></sup> · <i>n</i>) for subsets.</li></ul>`,
  code: {
    pseudo: `nQueens(r, n)                    // place queens in rows r..n
  if r > n
      save a copy of the board
      return
  for c ← 1 to n
      if column c and both diagonals through (r, c) are free
          put a queen on (r, c)
          nQueens(r + 1, n)
          take the queen off (r, c)       // backtrack

subsets(i, current)
  if i > n
      save a copy of current
      return
  subsets(i + 1, current)                 // exclude element i
  subsets(i + 1, current ∪ {A[i]})        // include element i`,
    py: `def solve_n_queens(n):                    # LeetCode 51
    cols, d1, d2, board, out = set(), set(), set(), [], []
    def bt(r):
        if r == n:
            out.append(['.' * c + 'Q' + '.' * (n - c - 1) for c in board])
            return
        for c in range(n):
            if c in cols or r - c in d1 or r + c in d2:
                continue                      # pruned: attacked
            cols.add(c); d1.add(r - c); d2.add(r + c); board.append(c)
            bt(r + 1)
            cols.remove(c); d1.remove(r - c); d2.remove(r + c); board.pop()
    bt(0)
    return out

def subsets(nums):                        # LeetCode 78
    out, cur = [], []
    def bt(i):
        if i == len(nums):
            out.append(cur[:]); return
        bt(i + 1)                         # skip nums[i]
        cur.append(nums[i]); bt(i + 1); cur.pop()   # take nums[i]
    bt(0)
    return out

def permute(nums):                        # LeetCode 46
    out, cur, used = [], [], [False] * len(nums)
    def bt():
        if len(cur) == len(nums):
            out.append(cur[:]); return
        for i, x in enumerate(nums):
            if not used[i]:
                used[i] = True; cur.append(x)
                bt()
                used[i] = False; cur.pop()
    bt()
    return out`,
    cpp: `#include <vector>
#include <string>
using namespace std;

class NQueens {                                     // LeetCode 51
    int n; vector<int> board; vector<bool> col, d1, d2;
    vector<vector<string>> out;
    void bt(int r) {
        if (r == n) {
            vector<string> b(n, string(n, '.'));
            for (int i = 0; i < n; i++) b[i][board[i]] = 'Q';
            out.push_back(b); return;
        }
        for (int c = 0; c < n; c++) {
            if (col[c] || d1[r - c + n] || d2[r + c]) continue;
            col[c] = d1[r - c + n] = d2[r + c] = true; board[r] = c;
            bt(r + 1);
            col[c] = d1[r - c + n] = d2[r + c] = false;      // backtrack
        }
    }
public:
    vector<vector<string>> solve(int n_) {
        n = n_; board.assign(n, 0); col.assign(n, false);
        d1.assign(2 * n, false); d2.assign(2 * n, false);
        bt(0); return out;
    }
};`,
  },
  viz: {
    inputHint: 'Board size 4 to 6, add "all" to find every solution for n = 4',
    presets: [{ label: '4 queens, all solutions', input: '4 all', note: 'Two solutions. Watch the search back up when a row has no safe square.' }, { label: '5 queens, first solution', input: '5', note: 'Found quickly with pruning.' }, { label: '6 queens, first solution', input: '6', note: 'More backtracking before the first success.' }],
    random: () => pick(['4 all', '5', '6']),
    parse: s => { const m = /^\s*(\d)\s*(all)?\s*$/i.exec(s); if (!m || +m[1] < 4 || +m[1] > 6) throw new Error('Enter a size from 4 to 6, optionally followed by "all".'); return { n: +m[1], all: !!m[2] && +m[1] === 4 }; },
    run({ n, all }) {
      const R = Rec(); const board = Array.from({ length: n }, () => Array(n).fill('')); const qc = [];
      let nodes = 0, sols = 0;
      const attacked = (r, c) => qc.some((cc, rr) => cc === c || rr - cc === r - c || rr + cc === r + c);
      const st = (hl = {}) => ({ vars: { 'nodes tried': nodes, solutions: sols }, table: { colH: Array.from({ length: n }, (_, c) => c + 1), rowH: Array.from({ length: n }, (_, r) => r + 1), cells: board.map(r => r.map(v => v || '')), hl, name: 'b' } });
      const attackHl = () => { const h = {}; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!board[r][c] && attacked(r, c)) h[r + ',' + c] = 'dim'; qc.forEach((c, r) => h[r + ',' + c] = 'ink'); return h; };
      R.add(st(), 1, `Place ${n} queens, one per row, so that none share a column or diagonal.`);
      let stop = false;
      (function bt(r) {
        if (stop) return;
        if (r === n) { sols++; R.add(st(Object.fromEntries(qc.map((c, rr) => [rr + ',' + c, 'found']))), 3, `Solution ${sols}: columns ${qc.map(c => c + 1).join(', ')}.`); if (!all) stop = true; return; }
        for (let c = 0; c < n && !stop; c++) {
          nodes++;
          if (attacked(r, c)) { if (Math.random() < .25) R.add(st({ ...attackHl(), [r + ',' + c]: 'warn' }), 6, `Row ${r + 1}, column ${c + 1} is attacked. Prune.`, { q: `Is row ${r + 1}, column ${c + 1} safe for a queen?`, choices: ['Safe', 'Attacked'], answer: 1 }); continue; }
          board[r][c] = 'Q'; qc.push(c);
          R.add(st({ ...attackHl(), [r + ',' + c]: 'cur' }), 7, `Place a queen at row ${r + 1}, column ${c + 1}.`, Math.random() < .35 ? { q: `Row ${r + 1}: click the first safe column, scanning from the left.`, pick: 'b:' + r + ',' + c } : null);
          bt(r + 1);
          if (stop) return;
          board[r][c] = ''; qc.pop();
          R.add(st({ ...attackHl(), [r + ',' + c]: 'warn' }), 9, `Backtrack: remove the queen from row ${r + 1}, column ${c + 1} and try the next column.`);
        }
      })(0);
      R.add(st(Object.fromEntries(qc.map((c, rr) => [rr + ',' + c, 'found']))), 1, `Search finished: ${sols} solution${sols === 1 ? '' : 's'} after trying ${nodes} squares.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'What is the “unchoose” step in backtracking for?', opts: ['To print the answer', 'To restore shared state so the next choice starts from the same partial solution', 'To sort choices', 'To memoize'], a: 1, why: 'One mutable state serves the whole depth-first search.' },
    { q: 'Generating all subsets of n elements takes…', opts: ['O(n²)', 'O(2ⁿ · n)', 'O(n!)', 'O(n log n)'], a: 1, why: '2ⁿ subsets, each up to n elements to copy.' },
    { q: 'In N-Queens, the two diagonals through (r, c) can be identified by…', opts: ['r and c', 'r − c and r + c', 'r · c', 'max(r, c)'], a: 1, why: 'Cells on a “\\” diagonal share r − c; on a “/” diagonal they share r + c.' },
    { q: 'When does backtracking become dynamic programming?', opts: ['Never', 'When identical subproblems recur and you cache their results', 'When the tree is binary', 'When n is small'], a: 1, why: 'Memoizing repeated states is exactly top-down DP.' },
  ],
});
