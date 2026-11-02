/* Interview pattern guides: recognition signals, the idea, a template, a walkthrough and a problem ladder.
   Problem titles and numbers refer to LeetCode; statements are never copied. */
import { PATTERN_LIST } from './list';
import { Rec, parseNums, rnd, randArr, uniqArr, pick } from '../../engine/helpers';
import { rangeHl } from '../topics/sorting';

const lc = (n, title, diff, slug, note) => ({ n, title, diff, slug, note });
const meta = id => PATTERN_LIST.find(p => p.id === id);

export const PATTERNS = [];
function pattern(p) { PATTERNS.push({ ...meta(p.id), ...p }); }

/* ---------- two pointers ---------- */
pattern({
  id: 'two-pointers', topics: ['arrays', 'quicksort'],
  when: ['The input is sorted, or sorting it does not break the problem', 'You need a pair, triplet or partition that meets a target', 'You must work in place with O(1) extra space'],
  idea: `<p>Put one index at each end of a sorted array. Compare the pair with the target: if the sum is too small, the only way to grow it is to move the <b>left</b> pointer right; if too large, move the <b>right</b> pointer left. Each step discards a whole row of candidate pairs, so the scan is O(<i>n</i>) instead of O(<i>n</i>²).</p><p>A second flavour uses two pointers moving the same direction: a <b>read</b> pointer scans everything while a <b>write</b> pointer marks where the next kept element goes. Quicksort's partition and “remove duplicates in place” work this way.</p>`,
  template: {
    py: `def pair_with_sum(a, target):          # a is sorted
    lo, hi = 0, len(a) - 1
    while lo < hi:
        s = a[lo] + a[hi]
        if s == target:
            return lo, hi
        if s < target:
            lo += 1                        # need a bigger sum
        else:
            hi -= 1                        # need a smaller sum
    return None

def remove_duplicates(a):               # read/write pointers
    w = 0
    for r in range(len(a)):
        if r == 0 or a[r] != a[r - 1]:
            a[w] = a[r]; w += 1
    return w`,
    cpp: `pair<int,int> pairWithSum(const vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        int s = a[lo] + a[hi];
        if (s == target) return {lo, hi};
        if (s < target) lo++; else hi--;
    }
    return {-1, -1};
}`,
  },
  viz: {
    inputHint: 'Sorted numbers / target',
    presets: [{ label: 'Pair summing to 16', input: '1 3 4 6 8 10 13 / 16' }, { label: 'No pair exists', input: '2 5 9 11 / 12' }],
    random: () => { const a = uniqArr(rnd(7, 9), 1, 30).sort((x, y) => x - y); return a.join(' ') + ' / ' + (Math.random() < .8 ? a[rnd(0, 2)] + a[rnd(a.length - 3, a.length - 1)] : rnd(5, 50)); },
    parse: s => { const [l, t] = s.split('/'); const a = parseNums(l, { min: 2, max: 14, lo: -99, hi: 999 }); if (a.some((v, i) => i && v < a[i - 1])) throw new Error('The numbers must be sorted.'); if (t == null) throw new Error('Add "/ target".'); return { a, t: parseNums(t, { min: 1, max: 1, lo: -999, hi: 9999 })[0] }; },
    run({ a, t }) {
      const R = Rec(); let lo = 0, hi = a.length - 1;
      const st = (hl = {}) => ({ vars: { target: t, sum: lo < hi ? a[lo] + a[hi] : '—' }, arrays: [{ a, hl: { ...hl, ...Object.fromEntries(a.map((_, i) => [i, i < lo || i > hi ? 'dim' : hl[i]]).filter(([, v]) => v)) }, ptr: { lo, hi } }] });
      R.add(st({ [lo]: 'cmp', [hi]: 'cmp' }), 0, `lo at the smallest, hi at the largest. Looking for a pair summing to ${t}.`);
      while (lo < hi) {
        const s = a[lo] + a[hi];
        if (s === t) { R.add(st({ [lo]: 'found', [hi]: 'found' }), 0, `${a[lo]} + ${a[hi]} = ${t}. Found.`, { q: `${a[lo]} + ${a[hi]} = ${s}, target ${t}. What now?`, choices: ['Move lo right', 'Move hi left', 'Found it'], answer: 2 }); return R.f; }
        const left = s < t;
        if (left) lo++; else hi--;
        R.add(st({ [lo]: 'cmp', [hi]: 'cmp' }), 0, left ? `${s} < ${t}: every pair with the old lo is too small. Move lo right.` : `${s} > ${t}: every pair with the old hi is too big. Move hi left.`, { q: `Sum ${s}, target ${t}. Which pointer moves?`, choices: ['Move lo right', 'Move hi left', 'Found it'], answer: left ? 0 : 1 });
      }
      R.add(st(), 0, 'The pointers met: no pair adds up to the target.');
      return R.f;
    },
  },
  problems: [lc(125, 'Valid Palindrome', 'Easy', 'valid-palindrome'), lc(26, 'Remove Duplicates from Sorted Array', 'Easy', 'remove-duplicates-from-sorted-array'), lc(167, 'Two Sum II – Input Array Is Sorted', 'Medium', 'two-sum-ii-input-array-is-sorted'), lc(15, '3Sum', 'Medium', '3sum', 'Sort, fix one element, two-pointer the rest'), lc(11, 'Container With Most Water', 'Medium', 'container-with-most-water', 'Move the shorter wall'), lc(75, 'Sort Colors', 'Medium', 'sort-colors', 'Three pointers: Dutch national flag'), lc(42, 'Trapping Rain Water', 'Hard', 'trapping-rain-water', 'Track the max height from each side')],
});

/* ---------- sliding window ---------- */
pattern({
  id: 'sliding-window', topics: ['arrays', 'hash-tables'],
  when: ['The answer is a contiguous subarray or substring', 'You want the longest, shortest or count of windows meeting a condition', 'The condition can be updated as one element enters and one leaves'],
  idea: `<p>Keep a window [<i>left</i>, <i>right</i>]. Advance <i>right</i> one step at a time, adding the new element to some running state (a sum, a count map). Whenever the window breaks the rule, advance <i>left</i> and remove elements until it is valid again. Each element enters and leaves the window at most once, so the whole scan is O(<i>n</i>).</p><p>For “longest valid window”, record the size after restoring validity. For “shortest window that satisfies”, record the size while shrinking.</p>`,
  template: {
    py: `def longest_without_repeats(s):          # LeetCode 3
    last, left, best = {}, 0, 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1                 # shrink past the duplicate
        last[ch] = right
        best = max(best, right - left + 1)
    return best

def min_subarray_len(target, nums):        # LeetCode 209
    left = total = 0
    best = float('inf')
    for right, x in enumerate(nums):
        total += x
        while total >= target:                  # valid: try to shrink
            best = min(best, right - left + 1)
            total -= nums[left]; left += 1
    return 0 if best == float('inf') else best`,
    cpp: `int lengthOfLongestSubstring(const string& s) {   // LeetCode 3
    vector<int> last(256, -1);
    int left = 0, best = 0;
    for (int right = 0; right < (int)s.size(); right++) {
        unsigned char c = s[right];
        if (last[c] >= left) left = last[c] + 1;
        last[c] = right;
        best = max(best, right - left + 1);
    }
    return best;
}`,
  },
  viz: {
    inputHint: 'A string (longest substring without repeating characters)',
    presets: [{ label: 'abcabcbb', input: 'abcabcbb' }, { label: 'pwwkew', input: 'pwwkew' }],
    random: () => Array.from({ length: rnd(8, 11) }, () => pick('abcde')).join(''),
    parse: s => { const t = s.trim(); if (!t || t.length > 16 || /\s/.test(t)) throw new Error('Enter one word of up to 16 characters.'); return t; },
    run(s) {
      const R = Rec(); const last = {}; let left = 0, best = 0, bl = 0;
      const st = (right, hl = {}) => ({ vars: { window: s.slice(left, right + 1), best }, arrays: [{ a: s.split(''), hl: { ...rangeHl(left, right, 'cmp'), ...hl }, ptr: { left, right } }] });
      for (let r = 0; r < s.length; r++) {
        const c = s[r], dup = c in last && last[c] >= left;
        if (dup) {
          const nl = last[c] + 1;
          R.add(st(r - 1, { [r]: 'warn', [last[c]]: 'warn' }), 0, `'${c}' is already in the window at ${last[c]}. Move left past it.`, { q: `'${c}' repeats. Where does left move to?`, pick: 'a:' + nl, hint: 'One past the earlier copy.' });
          left = nl;
        }
        last[c] = r;
        if (r - left + 1 > best) { best = r - left + 1; bl = left; }
        R.add(st(r, { [r]: 'cur' }), 0, `Add '${c}'. Window "${s.slice(left, r + 1)}" has no repeats. Best so far ${best}.`);
      }
      R.add({ vars: { best }, arrays: [{ a: s.split(''), hl: rangeHl(bl, bl + best - 1, 'found') }] }, 0, `Longest substring without repeats: "${s.slice(bl, bl + best)}", length ${best}. Each character entered and left the window at most once.`);
      return R.f;
    },
  },
  problems: [lc(643, 'Maximum Average Subarray I', 'Easy', 'maximum-average-subarray-i', 'Fixed-size window'), lc(3, 'Longest Substring Without Repeating Characters', 'Medium', 'longest-substring-without-repeating-characters'), lc(209, 'Minimum Size Subarray Sum', 'Medium', 'minimum-size-subarray-sum'), lc(424, 'Longest Repeating Character Replacement', 'Medium', 'longest-repeating-character-replacement'), lc(567, 'Permutation in String', 'Medium', 'permutation-in-string'), lc(76, 'Minimum Window Substring', 'Hard', 'minimum-window-substring'), lc(239, 'Sliding Window Maximum', 'Hard', 'sliding-window-maximum', 'Monotonic deque')],
});

/* ---------- fast & slow ---------- */
pattern({
  id: 'fast-slow', topics: ['linked-lists'],
  when: ['A linked list or a function x → f(x) might loop', 'You need the middle of a list in one pass', 'O(1) extra space is required'],
  idea: `<p>Move one pointer one step at a time and another two steps. If the sequence loops, the fast pointer laps the slow one and they meet inside the cycle (Floyd's algorithm). Reset one pointer to the start and move both one step at a time: they meet again exactly at the cycle's entrance. If there is no cycle, the fast pointer reaches the end, and at that moment the slow pointer is in the middle.</p>`,
  template: {
    py: `def detect_cycle(head):                 # LeetCode 142
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:                      # they met inside the cycle
            slow = head
            while slow is not fast:
                slow, fast = slow.next, fast.next
            return slow                       # cycle entrance
    return None

def middle(head):                         # LeetCode 876
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    return slow`,
    cpp: `ListNode* detectCycle(ListNode* head) {      // LeetCode 142
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next; fast = fast->next->next;
        if (slow == fast) {
            slow = head;
            while (slow != fast) { slow = slow->next; fast = fast->next; }
            return slow;
        }
    }
    return nullptr;
}`,
  },
  viz: {
    inputHint: 'List length, then | the index the tail links back to',
    presets: [{ label: 'Cycle back to node 2', input: '8 | 2' }, { label: 'Cycle back to node 0', input: '6 | 0' }],
    random: () => { const n = rnd(6, 10); return `${n} | ${rnd(0, n - 2)}`; },
    parse: s => { const [a, b] = s.split('|'); const n = parseNums(a, { min: 1, max: 1, lo: 3, hi: 12 })[0]; const c = parseNums(b ?? '', { min: 1, max: 1, lo: 0, hi: n - 1 })[0]; return { n, c }; },
    run({ n, c }) {
      const R = Rec(); const next = i => (i === n - 1 ? c : i + 1);
      let slow = 0, fast = 0, steps = 0;
      const st = (hl = {}, phase) => ({ vars: { steps, phase }, arrays: [{ a: Array.from({ length: n }, (_, i) => i), hl: { [c]: 'piv', ...hl }, ptr: slow === fast ? { 'slow fast': slow } : { slow, fast }, label: `Nodes 0..${n - 1}; the last node links back to node ${c} (orange)` }] });
      R.add(st({}, 'find a meeting'), 0, 'Both pointers start at the head.');
      do {
        const nf = next(next(fast));
        const ask = steps < 3 ? { q: `fast is at ${fast}. Where will it be after its two steps?`, pick: 'a:' + nf, hint: 'Follow next twice, wrapping back at the end.' } : null;
        slow = next(slow); fast = nf; steps++;
        R.add(st({ [slow]: 'cmp', [fast]: 'cur' }, 'find a meeting'), 0, `slow moves 1 to ${slow}, fast moves 2 to ${fast}.`, ask);
      } while (slow !== fast);
      R.add(st({ [slow]: 'found' }, 'met'), 0, `They meet at node ${slow}: there is a cycle. Reset slow to the head.`);
      slow = 0;
      while (slow !== fast) { slow = next(slow); fast = next(fast); steps++; R.add(st({ [slow]: 'cmp', [fast]: 'cmp' }, 'find the entrance'), 0, `Both move 1 step: slow ${slow}, fast ${fast}.`); }
      R.add(st({ [slow]: 'found' }, 'done'), 0, `They meet at node ${slow}, the start of the cycle.`);
      return R.f;
    },
  },
  problems: [lc(876, 'Middle of the Linked List', 'Easy', 'middle-of-the-linked-list'), lc(141, 'Linked List Cycle', 'Easy', 'linked-list-cycle'), lc(202, 'Happy Number', 'Easy', 'happy-number', 'The sequence of digit-square sums either reaches 1 or loops'), lc(234, 'Palindrome Linked List', 'Easy', 'palindrome-linked-list'), lc(142, 'Linked List Cycle II', 'Medium', 'linked-list-cycle-ii'), lc(287, 'Find the Duplicate Number', 'Medium', 'find-the-duplicate-number', 'Treat i → nums[i] as a linked list')],
});

/* ---------- binary search on the answer ---------- */
pattern({
  id: 'binary-search-answer', topics: ['binary-search'],
  when: ['“Find the minimum X such that …” or “maximize the minimum”', 'A yes/no check for a given X is easy, and the answer flips only once as X grows', 'The answer lies in a numeric range, not necessarily in the array'],
  idea: `<p>If feasibility is <b>monotone</b> (false, false, …, false, true, true, …), the smallest true value can be found by binary search over the range of possible answers. Each probe runs a feasibility check, often a greedy O(<i>n</i>) pass. Total time is O(<i>n</i> log range).</p><p>Write the check first, then the search: <code>lo = smallest possible, hi = largest possible; while lo &lt; hi: mid = (lo + hi) // 2; if ok(mid): hi = mid else: lo = mid + 1</code>.</p>`,
  template: {
    py: `import math

def min_eating_speed(piles, h):              # LeetCode 875
    def ok(k):                                # can Koko finish at speed k?
        return sum(math.ceil(p / k) for p in piles) <= h
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid):
            hi = mid                          # mid works; try smaller
        else:
            lo = mid + 1                      # too slow
    return lo`,
    cpp: `int minEatingSpeed(const vector<int>& piles, int h) {   // LeetCode 875
    auto ok = [&](long long k) {
        long long hours = 0;
        for (int p : piles) hours += (p + k - 1) / k;
        return hours <= h;
    };
    int lo = 1, hi = *max_element(piles.begin(), piles.end());
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (ok(mid)) hi = mid; else lo = mid + 1;
    }
    return lo;
}`,
  },
  viz: {
    inputHint: 'Piles / hours (Koko eating bananas)',
    presets: [{ label: 'piles 3 6 7 11, 8 hours', input: '3 6 7 11 / 8' }, { label: 'piles 30 11 23 4 20, 6 hours', input: '30 11 23 4 20 / 6' }],
    random: () => { const p = randArr(rnd(4, 5), 3, 30); return p.join(' ') + ' / ' + rnd(p.length, p.length + 4); },
    parse: s => { const [a, b] = s.split('/'); const piles = parseNums(a, { min: 1, max: 8, lo: 1, hi: 99 }); const hh = parseNums(b ?? '', { min: 1, max: 1, lo: piles.length, hi: 200 })[0]; return { piles, h: hh }; },
    run({ piles, h }) {
      const R = Rec(); let lo = 1, hi = Math.max(...piles);
      const hours = k => piles.reduce((s, p) => s + Math.ceil(p / k), 0);
      const range = Array.from({ length: hi }, (_, i) => i + 1);
      const st = (hl = {}, mid) => ({ vars: { hours: h, ...(mid ? { [`hours at speed ${mid}`]: hours(mid) } : {}) }, arrays: [{ a: piles, label: 'Piles', noIdx: true, small: true }, { name: 'k', a: range, label: 'Candidate speeds k', noIdx: true, small: true, hl: { ...Object.fromEntries(range.map((_, i) => [i, i + 1 < lo || i + 1 > hi ? 'dim' : undefined]).filter(x => x[1])), ...hl }, ptr: { lo: lo - 1, hi: hi - 1 } }] });
      R.add(st(), 0, `The answer lies between 1 and the largest pile, ${hi}.`);
      while (lo < hi) {
        const mid = (lo + hi) >> 1, ok = hours(mid) <= h;
        R.add(st({ [mid - 1]: 'cur' }, mid), 0, `Try k = ${mid}: ${piles.map(p => Math.ceil(p / mid)).join(' + ')} = ${hours(mid)} hours.`, { q: `At speed ${mid} it takes ${hours(mid)} hours, and the limit is ${h}. Which half survives?`, choices: [`Fast enough: search ${lo}..${mid}`, `Too slow: search ${mid + 1}..${hi}`], answer: ok ? 0 : 1 });
        if (ok) hi = mid; else lo = mid + 1;
        R.add(st(), 0, ok ? `${hours(mid)} ≤ ${h}: k = ${mid} works, and maybe smaller does too. hi = ${mid}.` : `${hours(mid)} > ${h}: too slow, so every speed ≤ ${mid} fails. lo = ${mid + 1}.`);
      }
      R.add(st({ [lo - 1]: 'found' }), 0, `lo = hi = ${lo}: the minimum speed is ${lo}.`);
      return R.f;
    },
  },
  problems: [lc(704, 'Binary Search', 'Easy', 'binary-search'), lc(35, 'Search Insert Position', 'Easy', 'search-insert-position'), lc(33, 'Search in Rotated Sorted Array', 'Medium', 'search-in-rotated-sorted-array'), lc(153, 'Find Minimum in Rotated Sorted Array', 'Medium', 'find-minimum-in-rotated-sorted-array'), lc(875, 'Koko Eating Bananas', 'Medium', 'koko-eating-bananas'), lc(1011, 'Capacity To Ship Packages Within D Days', 'Medium', 'capacity-to-ship-packages-within-d-days'), lc(410, 'Split Array Largest Sum', 'Hard', 'split-array-largest-sum'), lc(4, 'Median of Two Sorted Arrays', 'Hard', 'median-of-two-sorted-arrays')],
});

/* ---------- prefix sums ---------- */
pattern({
  id: 'prefix-sum', topics: ['arrays', 'hash-tables'],
  when: ['Many queries ask for the sum of a range', 'Count subarrays whose sum (or balance) equals k', 'Negative numbers rule out a sliding window'],
  idea: `<p>A subarray <i>a</i>[<i>i</i>..<i>j</i>] sums to <i>P</i>[<i>j</i> + 1] − <i>P</i>[<i>i</i>], where <i>P</i> holds running totals. To count subarrays summing to <i>k</i>, scan once, keep a hash map from each prefix total to how often it has appeared, and at each position add the count of earlier prefixes equal to <code>total − k</code>.</p>`,
  template: {
    py: `from collections import defaultdict

def subarray_sum(nums, k):                # LeetCode 560
    seen = defaultdict(int)
    seen[0] = 1                           # the empty prefix
    total = count = 0
    for x in nums:
        total += x
        count += seen[total - k]          # earlier prefixes that complete a k-sum
        seen[total] += 1
    return count`,
    cpp: `int subarraySum(const vector<int>& nums, int k) {   // LeetCode 560
    unordered_map<int, int> seen{{0, 1}};
    int total = 0, count = 0;
    for (int x : nums) {
        total += x;
        if (auto it = seen.find(total - k); it != seen.end()) count += it->second;
        seen[total]++;
    }
    return count;
}`,
  },
  viz: {
    inputHint: 'Numbers / k',
    presets: [{ label: 'Sum to 7', input: '3 4 7 2 -3 1 4 2 / 7' }, { label: 'With negatives', input: '1 -1 1 -1 1 / 0' }],
    random: () => randArr(rnd(6, 8), -3, 6).join(' ') + ' / ' + rnd(2, 8),
    parse: s => { const [a, b] = s.split('/'); return { a: parseNums(a, { min: 1, max: 12, lo: -50, hi: 50 }), k: parseNums(b ?? '', { min: 1, max: 1, lo: -99, hi: 99 })[0] }; },
    run({ a, k }) {
      const R = Rec(); const seen = new Map([[0, 1]]); let total = 0, count = 0;
      const st = (i, extra = {}) => ({ vars: { total, 'total − k': total - k, count }, arrays: [{ a, hl: i >= 0 ? { [i]: 'cur', ...extra } : {} }], buckets: { title: 'Prefix totals seen → how many times', arrows: false, showNil: false, slots: [...seen.entries()].map(([s, n]) => ({ label: String(s), items: [n], hl: s === total - k ? { 0: 'found' } : {} })) } });
      R.add(st(-1), 0, 'Start with the empty prefix: total 0 seen once.');
      a.forEach((x, i) => {
        total += x; const add = seen.get(total - k) || 0;
        R.add(st(i), 0, `total = ${total}. Prefixes equal to ${total} − ${k} = ${total - k} were seen ${add} time${add === 1 ? '' : 's'}: each one starts a subarray ending here that sums to ${k}.`, { q: `total is now ${total}. How many subarrays ending at index ${i} sum to ${k}?`, value: add, hint: `Look up ${total - k} in the map.` });
        count += add; seen.set(total, (seen.get(total) || 0) + 1);
      });
      R.add(st(-1), 0, `${count} subarray${count === 1 ? '' : 's'} sum to ${k}, found in one pass.`);
      return R.f;
    },
  },
  problems: [lc(303, 'Range Sum Query – Immutable', 'Easy', 'range-sum-query-immutable'), lc(724, 'Find Pivot Index', 'Easy', 'find-pivot-index'), lc(560, 'Subarray Sum Equals K', 'Medium', 'subarray-sum-equals-k'), lc(523, 'Continuous Subarray Sum', 'Medium', 'continuous-subarray-sum', 'Store prefix sums mod k'), lc(238, 'Product of Array Except Self', 'Medium', 'product-of-array-except-self', 'Prefix and suffix products'), lc(304, 'Range Sum Query 2D – Immutable', 'Medium', 'range-sum-query-2d-immutable')],
});

/* ---------- hashing ---------- */
pattern({
  id: 'hashing', topics: ['hash-tables'],
  when: ['You keep asking “have I seen this before?”', 'You need a complement (target − x), a frequency, or a group key', 'O(n²) pair checks are too slow'],
  idea: `<p>A hash map turns a search through everything seen so far into an expected O(1) lookup. Decide what to store as the <b>key</b> (a value, a complement, a sorted word, a count signature) and what to store as the <b>value</b> (an index, a count, a list). Two Sum is the archetype: for each <i>x</i>, look up <code>target − x</code> before inserting <i>x</i>.</p>`,
  template: {
    py: `def two_sum(nums, target):               # LeetCode 1
    index = {}
    for i, x in enumerate(nums):
        if target - x in index:
            return [index[target - x], i]
        index[x] = i

from collections import defaultdict
def group_anagrams(words):                # LeetCode 49
    groups = defaultdict(list)
    for w in words:
        groups[''.join(sorted(w))].append(w)
    return list(groups.values())`,
    cpp: `vector<int> twoSum(const vector<int>& nums, int target) {   // LeetCode 1
    unordered_map<int, int> index;
    for (int i = 0; i < (int)nums.size(); i++) {
        if (auto it = index.find(target - nums[i]); it != index.end()) return {it->second, i};
        index[nums[i]] = i;
    }
    return {};
}`,
  },
  seeTopic: 'hash-tables',
  problems: [lc(1, 'Two Sum', 'Easy', 'two-sum'), lc(217, 'Contains Duplicate', 'Easy', 'contains-duplicate'), lc(242, 'Valid Anagram', 'Easy', 'valid-anagram'), lc(49, 'Group Anagrams', 'Medium', 'group-anagrams'), lc(347, 'Top K Frequent Elements', 'Medium', 'top-k-frequent-elements'), lc(128, 'Longest Consecutive Sequence', 'Medium', 'longest-consecutive-sequence', 'Only start counting at a run’s smallest number'), lc(146, 'LRU Cache', 'Medium', 'lru-cache', 'Hash map plus doubly linked list')],
});

/* ---------- monotonic stack ---------- */
pattern({
  id: 'monotonic-stack', topics: ['stacks-queues', 'amortized'],
  when: ['For each element, find the next (or previous) greater or smaller element', 'Spans, widths or areas bounded by the nearest taller bar', 'An O(n²) “look right until …” loop'],
  idea: `<p>Scan left to right with a stack of indices whose values are kept in decreasing order (for “next greater”). When a new value arrives, every smaller value on top of the stack has just found its next greater element: pop it and record the answer. Then push the new index. Each index is pushed and popped once, so the scan is O(<i>n</i>) amortized, the same argument as the book's multipop stack.</p>`,
  template: {
    py: `def daily_temperatures(t):               # LeetCode 739
    ans, stack = [0] * len(t), []          # stack holds indices, temps decreasing
    for i, x in enumerate(t):
        while stack and t[stack[-1]] < x:
            j = stack.pop()
            ans[j] = i - j                 # x is j's next warmer day
        stack.append(i)
    return ans`,
    cpp: `vector<int> dailyTemperatures(const vector<int>& t) {   // LeetCode 739
    vector<int> ans(t.size(), 0), st;
    for (int i = 0; i < (int)t.size(); i++) {
        while (!st.empty() && t[st.back()] < t[i]) { ans[st.back()] = i - st.back(); st.pop_back(); }
        st.push_back(i);
    }
    return ans;
}`,
  },
  viz: {
    inputHint: 'Temperatures',
    presets: [{ label: 'LeetCode 739 example', input: '73 74 75 71 69 72 76 73' }],
    random: () => randArr(rnd(7, 9), 60, 80).join(' '),
    parse: s => parseNums(s, { min: 2, max: 12, lo: -50, hi: 150 }),
    run(t) {
      const R = Rec(); const ans = Array(t.length).fill(0), stack = [];
      const st = (i, hl = {}) => ({ arrays: [{ name: 't', a: t, label: 'Temperatures', hl: { ...(i >= 0 ? { [i]: 'cur' } : {}), ...hl }, bars: true }, { name: 's', a: stack.length ? stack.map(j => t[j]) : [null], label: 'Stack (values, top on the right)', noIdx: true, small: true }, { name: 'ans', a: [...ans], label: 'Days until warmer', small: true }] });
      R.add(st(-1), 0, 'Scan left to right; the stack holds days still waiting for a warmer day.');
      t.forEach((x, i) => {
        while (stack.length && t[stack[stack.length - 1]] < x) {
          const j = stack[stack.length - 1];
          R.add(st(i, { [j]: 'cmp' }), 0, `${x} > ${t[j]} on top of the stack: day ${j} has found its warmer day.`, { q: `Today is ${x} and the top of the stack is ${t[j]}. What happens?`, choices: ['Pop it and record the answer', 'Push today and move on'], answer: 0 });
          stack.pop(); ans[j] = i - j;
          R.add(st(i, { [j]: 'found' }), 0, `answer[${j}] = ${i} − ${j} = ${i - j}.`);
        }
        const blocked = stack.length > 0;
        stack.push(i);
        R.add(st(i), 0, `Push day ${i} (${x}).`, blocked ? { q: `Today is ${x} and the top of the stack is ${t[stack[stack.length - 2]]}. What happens?`, choices: ['Pop it and record the answer', 'Push today and move on'], answer: 1 } : null);
      });
      R.add(st(-1), 0, 'Days left on the stack never get warmer: their answer stays 0. Each index was pushed and popped at most once.');
      return R.f;
    },
  },
  problems: [lc(496, 'Next Greater Element I', 'Easy', 'next-greater-element-i'), lc(155, 'Min Stack', 'Medium', 'min-stack'), lc(739, 'Daily Temperatures', 'Medium', 'daily-temperatures'), lc(503, 'Next Greater Element II', 'Medium', 'next-greater-element-ii', 'Loop over the array twice'), lc(901, 'Online Stock Span', 'Medium', 'online-stock-span'), lc(84, 'Largest Rectangle in Histogram', 'Hard', 'largest-rectangle-in-histogram')],
});

/* ---------- heap top-k ---------- */
pattern({
  id: 'heap-top-k', topics: ['binary-heap', 'selection'],
  when: ['“k largest”, “k smallest”, “k closest”, “k most frequent”', 'Merging k sorted streams', 'A running median or the best item among changing candidates'],
  idea: `<p>To keep the <i>k</i> largest items, keep a <b>min</b>-heap of size <i>k</i>. Its root is the smallest of the kept items, the one to evict when something bigger arrives. Each of <i>n</i> items costs O(log <i>k</i>), for O(<i>n</i> log <i>k</i>) total and O(<i>k</i>) space. For k-way merge, the heap holds the current head of each list.</p>`,
  template: {
    py: `import heapq

def kth_largest(nums, k):                # LeetCode 215
    heap = []
    for x in nums:
        if len(heap) < k:
            heapq.heappush(heap, x)
        elif x > heap[0]:
            heapq.heapreplace(heap, x)   # evict the smallest kept item
    return heap[0]

def merge_k_sorted(lists):               # k-way merge of Python lists
    heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]
    heapq.heapify(heap)
    out = []
    while heap:
        v, i, j = heapq.heappop(heap)
        out.append(v)
        if j + 1 < len(lists[i]):
            heapq.heappush(heap, (lists[i][j + 1], i, j + 1))
    return out`,
    cpp: `int findKthLargest(const vector<int>& nums, int k) {   // LeetCode 215
    priority_queue<int, vector<int>, greater<int>> heap;  // min-heap
    for (int x : nums) {
        if ((int)heap.size() < k) heap.push(x);
        else if (x > heap.top()) { heap.pop(); heap.push(x); }
    }
    return heap.top();
}`,
  },
  viz: {
    inputHint: 'Numbers / k',
    presets: [{ label: '2nd largest', input: '3 2 1 5 6 4 / 2' }, { label: '4th largest', input: '3 2 3 1 2 4 5 5 6 / 4' }],
    random: () => randArr(rnd(7, 9), 1, 50).join(' ') + ' / ' + rnd(2, 4),
    parse: s => { const [a, b] = s.split('/'); const arr = parseNums(a, { min: 1, max: 14, lo: -99, hi: 999 }); return { a: arr, k: parseNums(b ?? '', { min: 1, max: 1, lo: 1, hi: arr.length })[0] }; },
    run({ a, k }) {
      const R = Rec(); const heap = [];
      const up = i => { while (i > 0 && heap[(i - 1) >> 1] > heap[i]) { const p = (i - 1) >> 1;[heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
      const down = i => { for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l] < heap[m]) m = l; if (r < heap.length && heap[r] < heap[m]) m = r; if (m === i) return; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } };
      const tree = () => { const nodes = {}; heap.forEach((v, i) => nodes[i] = { k: v, l: 2 * i + 1 < heap.length ? 2 * i + 1 : null, r: 2 * i + 2 < heap.length ? 2 * i + 2 : null, cls: i === 0 ? 'cmp' : undefined }); return { nodes, root: heap.length ? 0 : null, binary: true }; };
      const st = (i) => ({ vars: { k, 'heap size': heap.length }, tree: tree(), arrays: [{ a, hl: i >= 0 ? { [i]: 'cur', ...rangeHl(0, i - 1, 'dim') } : {} }] });
      a.forEach((x, i) => {
        if (heap.length < k) { heap.push(x); up(heap.length - 1); R.add(st(i), 0, `The heap holds fewer than ${k} items: push ${x}.`); return; }
        const take = x > heap[0];
        const ask = { q: `The heap's minimum is ${heap[0]}. Does ${x} get in?`, choices: [`Yes: replace ${heap[0]}`, 'No: skip it'], answer: take ? 0 : 1 };
        if (take) { heap[0] = x; down(0); R.add(st(i), 0, `${x} beats the smallest kept item: replace the root and sift down.`, ask); }
        else R.add(st(i), 0, `${x} ≤ ${heap[0]}: it cannot be among the ${k} largest. Skip.`, ask);
      });
      R.add(st(-1), 0, `The root, ${heap[0]}, is the ${k}${k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'} largest.`);
      return R.f;
    },
  },
  problems: [lc(703, 'Kth Largest Element in a Stream', 'Easy', 'kth-largest-element-in-a-stream'), lc(215, 'Kth Largest Element in an Array', 'Medium', 'kth-largest-element-in-an-array'), lc(973, 'K Closest Points to Origin', 'Medium', 'k-closest-points-to-origin'), lc(621, 'Task Scheduler', 'Medium', 'task-scheduler'), lc(23, 'Merge k Sorted Lists', 'Hard', 'merge-k-sorted-lists'), lc(295, 'Find Median from Data Stream', 'Hard', 'find-median-from-data-stream', 'Two heaps')],
});

/* ---------- intervals ---------- */
pattern({
  id: 'intervals', topics: ['greedy', 'merge-sort'],
  when: ['Input is a list of [start, end] ranges', 'You merge, insert, count overlaps or remove the fewest', 'Meeting rooms, bookings, calendars'],
  idea: `<p>Sort intervals by start. Then a single sweep suffices: keep the current merged interval; if the next one starts before (or at) its end, extend the end; otherwise close it and start a new one. Removing the fewest intervals to avoid overlap is the book's activity selection: sort by <b>end</b> instead.</p>`,
  template: {
    py: `def merge(intervals):                   # LeetCode 56
    intervals.sort(key=lambda x: x[0])
    out = []
    for s, e in intervals:
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)   # overlap: extend
        else:
            out.append([s, e])                # gap: start a new one
    return out`,
    cpp: `vector<vector<int>> merge(vector<vector<int>> in) {   // LeetCode 56
    sort(in.begin(), in.end());
    vector<vector<int>> out;
    for (auto& iv : in) {
        if (!out.empty() && iv[0] <= out.back()[1]) out.back()[1] = max(out.back()[1], iv[1]);
        else out.push_back(iv);
    }
    return out;
}`,
  },
  viz: {
    inputHint: 'start-end pairs',
    presets: [{ label: 'LeetCode 56 example', input: '1-3 2-6 8-10 15-18' }, { label: 'Nested and touching', input: '1-4 4-5 2-3 7-9 8-12' }],
    random: () => Array.from({ length: rnd(5, 7) }, () => { const s = rnd(0, 14); return `${s}-${s + rnd(1, 4)}`; }).join(' '),
    parse: s => s.trim().split(/\s+/).map(t => { const m = /^(\d+)-(\d+)$/.exec(t); if (!m || +m[2] < +m[1]) throw new Error(`"${t}" should look like 2-6.`); return [+m[1], +m[2]]; }),
    run(iv) {
      const R = Rec(); const arr = [...iv].sort((x, y) => x[0] - y[0]); const out = [];
      const T = Math.max(...arr.map(x => x[1])) + 1;
      const row = (lab, s, e, cls) => `<div class="tl-row"><span class="tl-lab">${lab}</span><div class="tl-track"><div class="tl-bar ${cls ? 'c-' + cls : ''}" style="left:${100 * s / T}%;width:${Math.max(100 * (e - s) / T, 1.5)}%">${s}–${e}</div></div></div>`;
      const st = (i) => ({ order: ['vars', 'html'], vars: { merged: out.length }, html: `<div class="tl">${arr.map((x, j) => row('in', x[0], x[1], j === i ? 'cur' : j < i ? 'dim' : '')).join('')}${out.map(x => row('out', x[0], x[1], 'done')).join('')}</div>` });
      R.add(st(-1), 0, 'Sorted by start time. The merged list is empty.');
      arr.forEach(([s, e], i) => {
        const last = out[out.length - 1], overlap = !!last && s <= last[1];
        const ask = last ? { q: `[${s}, ${e}] against the last merged [${last[0]}, ${last[1]}]: merge or start new?`, choices: ['Merge', 'Start new'], answer: overlap ? 0 : 1 } : null;
        if (overlap) last[1] = Math.max(last[1], e); else out.push([s, e]);
        R.add(st(i), 0, overlap ? `${s} ≤ the last end: overlaps the last merged interval, so extend it to [${last[0]}, ${last[1]}].` : `Starts after the last merged interval ends: begin a new one.`, ask);
      });
      R.add(st(arr.length), 0, `Merged: ${out.map(x => `[${x[0]}, ${x[1]}]`).join(' ')}.`);
      return R.f;
    },
  },
  problems: [lc(252, 'Meeting Rooms', 'Easy', 'meeting-rooms', 'Premium'), lc(56, 'Merge Intervals', 'Medium', 'merge-intervals'), lc(57, 'Insert Interval', 'Medium', 'insert-interval'), lc(435, 'Non-overlapping Intervals', 'Medium', 'non-overlapping-intervals', 'Activity selection: sort by end'), lc(452, 'Minimum Number of Arrows to Burst Balloons', 'Medium', 'minimum-number-of-arrows-to-burst-balloons'), lc(253, 'Meeting Rooms II', 'Medium', 'meeting-rooms-ii', 'Premium; min-heap of end times'), lc(986, 'Interval List Intersections', 'Medium', 'interval-list-intersections')],
});

/* ---------- list reversal ---------- */
pattern({
  id: 'list-reversal', topics: ['linked-lists'],
  when: ['Reverse a whole list, a range of it, or every group of k nodes', 'Reorder or compare halves of a list', 'O(1) extra space'],
  idea: `<p>Three pointers, <code>prev</code>, <code>curr</code> and <code>nxt</code>, flip one link at a time. For a sublist, walk to the node before the range, reverse <i>k</i> links, then reconnect both ends. A dummy head node avoids special cases when the range starts at the head.</p>`,
  template: {
    py: `def reverse_between(head, left, right):   # LeetCode 92
    dummy = ListNode(0, head)
    before = dummy
    for _ in range(left - 1):
        before = before.next
    prev, curr = None, before.next
    for _ in range(right - left + 1):
        nxt = curr.next
        curr.next = prev
        prev, curr = curr, nxt
    before.next.next = curr                # old first node of the range now points past it
    before.next = prev                     # node before the range points to the new first
    return dummy.next`,
    cpp: `ListNode* reverseList(ListNode* head) {      // LeetCode 206
    ListNode *prev = nullptr, *curr = head;
    while (curr) { ListNode* nxt = curr->next; curr->next = prev; prev = curr; curr = nxt; }
    return prev;
}`,
  },
  seeTopic: 'linked-lists',
  problems: [lc(206, 'Reverse Linked List', 'Easy', 'reverse-linked-list'), lc(21, 'Merge Two Sorted Lists', 'Easy', 'merge-two-sorted-lists'), lc(92, 'Reverse Linked List II', 'Medium', 'reverse-linked-list-ii'), lc(24, 'Swap Nodes in Pairs', 'Medium', 'swap-nodes-in-pairs'), lc(143, 'Reorder List', 'Medium', 'reorder-list', 'Middle, reverse second half, merge'), lc(25, 'Reverse Nodes in k-Group', 'Hard', 'reverse-nodes-in-k-group')],
});

/* ---------- tree dfs ---------- */
pattern({
  id: 'tree-dfs', topics: ['tree-basics', 'bst'],
  when: ['Anything about paths, depths, heights, subtrees or ancestors', 'The answer for a node depends on its children’s answers', 'BST validation or k-th smallest'],
  idea: `<p>Write one recursive function that returns what the parent needs from a subtree, and combine children's results at each node (postorder). If the answer is not the same thing the parent needs, keep a global best and return the helper value: diameter returns height but records left + right height as a candidate.</p>`,
  template: {
    py: `def diameter(root):                     # LeetCode 543
    best = 0
    def height(node):
        nonlocal best
        if not node:
            return 0
        l, r = height(node.left), height(node.right)
        best = max(best, l + r)            # path through this node
        return 1 + max(l, r)               # what the parent needs
    height(root)
    return best

def lca(root, p, q):                      # LeetCode 236
    if not root or root is p or root is q:
        return root
    l, r = lca(root.left, p, q), lca(root.right, p, q)
    return root if l and r else l or r`,
    cpp: `int best = 0;
int height(TreeNode* n) {                     // LeetCode 543
    if (!n) return 0;
    int l = height(n->left), r = height(n->right);
    best = max(best, l + r);
    return 1 + max(l, r);
}`,
  },
  seeTopic: 'tree-basics',
  problems: [lc(104, 'Maximum Depth of Binary Tree', 'Easy', 'maximum-depth-of-binary-tree'), lc(226, 'Invert Binary Tree', 'Easy', 'invert-binary-tree'), lc(112, 'Path Sum', 'Easy', 'path-sum'), lc(543, 'Diameter of Binary Tree', 'Easy', 'diameter-of-binary-tree'), lc(110, 'Balanced Binary Tree', 'Easy', 'balanced-binary-tree'), lc(98, 'Validate Binary Search Tree', 'Medium', 'validate-binary-search-tree'), lc(236, 'Lowest Common Ancestor of a Binary Tree', 'Medium', 'lowest-common-ancestor-of-a-binary-tree'), lc(124, 'Binary Tree Maximum Path Sum', 'Hard', 'binary-tree-maximum-path-sum'), lc(297, 'Serialize and Deserialize Binary Tree', 'Hard', 'serialize-and-deserialize-binary-tree')],
});

/* ---------- tree bfs ---------- */
pattern({
  id: 'tree-bfs', topics: ['tree-basics', 'bfs'],
  when: ['The question mentions levels, rows or depth order', 'The leftmost or rightmost node of each level', 'The nearest leaf (minimum depth)'],
  idea: `<p>Use a queue. At the start of each round, the queue holds exactly one level; process <code>len(queue)</code> nodes, pushing their children, and you have handled that level as a batch. That batch boundary is what most level-based questions need.</p>`,
  template: {
    py: `from collections import deque

def right_side_view(root):              # LeetCode 199
    if not root:
        return []
    out, q = [], deque([root])
    while q:
        for i in range(len(q)):          # exactly one level
            node = q.popleft()
            if i == 0:
                out.append(node.val)     # with right-first pushes, the first is rightmost
            if node.right: q.append(node.right)
            if node.left: q.append(node.left)
    return out`,
    cpp: `vector<int> rightSideView(TreeNode* root) {   // LeetCode 199
    vector<int> out; if (!root) return out;
    queue<TreeNode*> q; q.push(root);
    while (!q.empty()) {
        int n = q.size();
        for (int i = 0; i < n; i++) {
            TreeNode* x = q.front(); q.pop();
            if (i == n - 1) out.push_back(x->val);
            if (x->left) q.push(x->left);
            if (x->right) q.push(x->right);
        }
    }
    return out;
}`,
  },
  seeTopic: 'tree-basics',
  problems: [lc(111, 'Minimum Depth of Binary Tree', 'Easy', 'minimum-depth-of-binary-tree'), lc(637, 'Average of Levels in Binary Tree', 'Easy', 'average-of-levels-in-binary-tree'), lc(102, 'Binary Tree Level Order Traversal', 'Medium', 'binary-tree-level-order-traversal'), lc(199, 'Binary Tree Right Side View', 'Medium', 'binary-tree-right-side-view'), lc(103, 'Binary Tree Zigzag Level Order Traversal', 'Medium', 'binary-tree-zigzag-level-order-traversal'), lc(116, 'Populating Next Right Pointers in Each Node', 'Medium', 'populating-next-right-pointers-in-each-node')],
});

/* ---------- graph traversal ---------- */
pattern({
  id: 'graph-traversal', topics: ['bfs', 'dfs', 'graph-rep'],
  when: ['A grid of cells, or nodes with neighbours', 'Count regions, fill an area, copy a structure', 'Fewest steps when every move costs the same'],
  idea: `<p>Use DFS (recursion or a stack) to explore or count connected regions, and BFS (a queue) when you need the fewest steps. In grids, the neighbours are the four (or eight) adjacent cells; mark cells visited, or overwrite them, as soon as you push them. For “all cells’ distance to the nearest X”, start BFS from every X at once.</p>`,
  template: {
    py: `from collections import deque

def num_islands(grid):                  # LeetCode 200
    R, C, count = len(grid), len(grid[0]), 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] != '1':
                continue
            count += 1
            grid[r][c] = '0'
            q = deque([(r, c)])
            while q:
                x, y = q.popleft()
                for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
                    if 0 <= nx < R and 0 <= ny < C and grid[nx][ny] == '1':
                        grid[nx][ny] = '0'          # mark when pushing
                        q.append((nx, ny))
    return count`,
    cpp: `int numIslands(vector<vector<char>>& g) {        // LeetCode 200
    int R = g.size(), C = g[0].size(), count = 0;
    function<void(int, int)> sink = [&](int r, int c) {
        if (r < 0 || c < 0 || r >= R || c >= C || g[r][c] != '1') return;
        g[r][c] = '0';
        sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);
    };
    for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) if (g[r][c] == '1') { count++; sink(r, c); }
    return count;
}`,
  },
  seeTopic: 'bfs',
  problems: [lc(733, 'Flood Fill', 'Easy', 'flood-fill'), lc(200, 'Number of Islands', 'Medium', 'number-of-islands'), lc(695, 'Max Area of Island', 'Medium', 'max-area-of-island'), lc(133, 'Clone Graph', 'Medium', 'clone-graph'), lc(994, 'Rotting Oranges', 'Medium', 'rotting-oranges', 'Multi-source BFS'), lc(417, 'Pacific Atlantic Water Flow', 'Medium', 'pacific-atlantic-water-flow'), lc(1091, 'Shortest Path in Binary Matrix', 'Medium', 'shortest-path-in-binary-matrix'), lc(127, 'Word Ladder', 'Hard', 'word-ladder')],
});

/* ---------- topological sort ---------- */
pattern({
  id: 'topological-sort', topics: ['topo-sort'],
  when: ['Tasks with prerequisites or dependencies', '“Is it possible to finish?” (cycle detection)', 'An order consistent with pairwise constraints'],
  idea: `<p>Build a directed graph from “a must come before b”. Count in-degrees, queue every vertex with in-degree 0, and repeatedly pop one, output it and decrement its neighbours. If fewer than all vertices come out, the rest are stuck on a cycle.</p>`,
  template: {
    py: `from collections import deque

def find_order(n, prereqs):              # LeetCode 210
    adj, indeg = [[] for _ in range(n)], [0] * n
    for course, pre in prereqs:
        adj[pre].append(course); indeg[course] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft(); order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []`,
    cpp: `bool canFinish(int n, const vector<vector<int>>& pre) {   // LeetCode 207
    vector<vector<int>> adj(n); vector<int> indeg(n, 0);
    for (auto& p : pre) { adj[p[1]].push_back(p[0]); indeg[p[0]]++; }
    queue<int> q; for (int i = 0; i < n; i++) if (!indeg[i]) q.push(i);
    int seen = 0;
    while (!q.empty()) { int u = q.front(); q.pop(); seen++; for (int v : adj[u]) if (--indeg[v] == 0) q.push(v); }
    return seen == n;
}`,
  },
  seeTopic: 'topo-sort',
  problems: [lc(207, 'Course Schedule', 'Medium', 'course-schedule'), lc(210, 'Course Schedule II', 'Medium', 'course-schedule-ii'), lc(310, 'Minimum Height Trees', 'Medium', 'minimum-height-trees', 'Peel leaves layer by layer'), lc(1136, 'Parallel Courses', 'Medium', 'parallel-courses', 'Premium'), lc(269, 'Alien Dictionary', 'Hard', 'alien-dictionary', 'Premium'), lc(329, 'Longest Increasing Path in a Matrix', 'Hard', 'longest-increasing-path-in-a-matrix')],
});

/* ---------- union-find ---------- */
pattern({
  id: 'union-find', topics: ['disjoint-sets', 'mst'],
  when: ['Edges or equivalences arrive and you ask “connected?”', 'Count groups that merge over time', 'Find the edge that creates a cycle'],
  idea: `<p>Keep a parent array. <code>find</code> follows parents to a root (compressing the path), and <code>union</code> links two roots (by rank or size). Two items are connected exactly when their roots match. With both heuristics, each operation is effectively constant time.</p>`,
  template: {
    py: `def find_redundant_connection(edges):    # LeetCode 684
    parent = list(range(len(edges) + 1))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for u, v in edges:
        ru, rv = find(u), find(v)
        if ru == rv:
            return [u, v]                  # already connected: this edge closes a cycle
        parent[ru] = rv`,
    cpp: `vector<int> parent;
int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }
vector<int> findRedundantConnection(const vector<vector<int>>& edges) {   // LeetCode 684
    parent.resize(edges.size() + 1);
    iota(parent.begin(), parent.end(), 0);
    for (auto& e : edges) {
        int a = find(e[0]), b = find(e[1]);
        if (a == b) return e;
        parent[a] = b;
    }
    return {};
}`,
  },
  seeTopic: 'disjoint-sets',
  problems: [lc(547, 'Number of Provinces', 'Medium', 'number-of-provinces'), lc(684, 'Redundant Connection', 'Medium', 'redundant-connection'), lc(323, 'Number of Connected Components in an Undirected Graph', 'Medium', 'number-of-connected-components-in-an-undirected-graph', 'Premium'), lc(721, 'Accounts Merge', 'Medium', 'accounts-merge'), lc(990, 'Satisfiability of Equality Equations', 'Medium', 'satisfiability-of-equality-equations'), lc(1584, 'Min Cost to Connect All Points', 'Medium', 'min-cost-to-connect-all-points', 'Kruskal')],
});

/* ---------- backtracking ---------- */
pattern({
  id: 'backtracking', topics: ['backtracking'],
  when: ['“All”, “every”, “generate” or “list all”', 'Constraints are small (n up to about 20)', 'Choices made one position at a time, with rules about what is allowed'],
  idea: `<p>Build a candidate one decision at a time. Recurse after each choice and undo it afterwards: choose, explore, unchoose. Prune as soon as the partial candidate cannot lead anywhere valid. Sort first and skip equal neighbours to avoid duplicate answers.</p>`,
  template: {
    py: `def combination_sum(candidates, target):  # LeetCode 39
    candidates.sort()
    out, cur = [], []
    def bt(start, remaining):
        if remaining == 0:
            out.append(cur[:]); return
        for i in range(start, len(candidates)):
            c = candidates[i]
            if c > remaining:
                break                          # sorted, so the rest are too big
            cur.append(c)
            bt(i, remaining - c)               # i, not i + 1: reuse allowed
            cur.pop()
    bt(0, target)
    return out`,
    cpp: `void bt(vector<int>& c, int start, int rem, vector<int>& cur, vector<vector<int>>& out) {
    if (rem == 0) { out.push_back(cur); return; }
    for (int i = start; i < (int)c.size() && c[i] <= rem; i++) {
        cur.push_back(c[i]);
        bt(c, i, rem - c[i], cur, out);
        cur.pop_back();
    }
}`,
  },
  seeTopic: 'backtracking',
  problems: [lc(78, 'Subsets', 'Medium', 'subsets'), lc(90, 'Subsets II', 'Medium', 'subsets-ii'), lc(46, 'Permutations', 'Medium', 'permutations'), lc(39, 'Combination Sum', 'Medium', 'combination-sum'), lc(17, 'Letter Combinations of a Phone Number', 'Medium', 'letter-combinations-of-a-phone-number'), lc(22, 'Generate Parentheses', 'Medium', 'generate-parentheses'), lc(79, 'Word Search', 'Medium', 'word-search'), lc(51, 'N-Queens', 'Hard', 'n-queens')],
});

/* ---------- 1-D DP ---------- */
pattern({
  id: 'dp-1d', topics: ['dp-intro'],
  when: ['“Number of ways”, “minimum cost”, “maximum value” along a sequence', 'Each choice depends only on a few previous positions', 'A brute-force recursion repeats the same arguments'],
  idea: `<p>Define <code>dp[i]</code> in one sentence (“the most money from the first <i>i</i> houses”), write the transition from the last decision (“rob house <i>i</i> or not”), set the base cases, and fill left to right. When <code>dp[i]</code> needs only the last one or two values, keep two variables instead of an array.</p>`,
  template: {
    py: `def rob(nums):                            # LeetCode 198
    take, skip = 0, 0                      # best ending with / without robbing the previous house
    for x in nums:
        take, skip = skip + x, max(take, skip)
    return max(take, skip)

def coin_change(coins, amount):           # LeetCode 322
    INF = amount + 1
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return -1 if dp[amount] == INF else dp[amount]`,
    cpp: `int rob(const vector<int>& nums) {        // LeetCode 198
    int prev2 = 0, prev1 = 0;              // dp[i-2], dp[i-1]
    for (int x : nums) { int cur = max(prev1, prev2 + x); prev2 = prev1; prev1 = cur; }
    return prev1;
}`,
  },
  viz: {
    inputHint: 'House values (house robber)',
    presets: [{ label: 'LeetCode 198 example', input: '2 7 9 3 1' }, { label: 'Skip two in a row', input: '2 1 1 2' }],
    random: () => randArr(rnd(6, 8), 1, 20).join(' '),
    parse: s => parseNums(s, { min: 1, max: 12, lo: 0, hi: 400 }),
    run(a) {
      const R = Rec(); const dp = Array(a.length + 1).fill(null); dp[0] = 0;
      const st = (i, hl = {}) => ({ arrays: [{ name: 'h', a, label: 'Houses', hl: i ? { [i - 1]: 'cur' } : {} }, { name: 'dp', a: [...dp], label: 'dp[i]: best from the first i houses', base: 0, hl }] });
      R.add(st(0, { 0: 'done' }), 0, 'dp[0] = 0: no houses, no money.');
      for (let i = 1; i <= a.length; i++) {
        const skip = dp[i - 1], take = (i >= 2 ? dp[i - 2] : 0) + a[i - 1], v = Math.max(skip, take);
        dp[i] = v;
        R.add(st(i, { [i]: 'found', [i - 1]: 'cmp', ...(i >= 2 ? { [i - 2]: 'cmp' } : {}) }), 0, `dp[${i}] = max(skip: dp[${i - 1}] = ${skip}, rob: ${i >= 2 ? `dp[${i - 2}]` : '0'} + ${a[i - 1]} = ${take}) = ${v}.`, i > 1 ? { q: `House ${i} holds ${a[i - 1]}. What is dp[${i}]?`, value: v, hint: `max(dp[${i - 1}], dp[${i - 2}] + ${a[i - 1]})` } : null);
      }
      R.add(st(a.length + 1, { [a.length]: 'found' }), 0, `The most you can take is ${dp[a.length]}.`);
      return R.f;
    },
  },
  problems: [lc(70, 'Climbing Stairs', 'Easy', 'climbing-stairs'), lc(746, 'Min Cost Climbing Stairs', 'Easy', 'min-cost-climbing-stairs'), lc(198, 'House Robber', 'Medium', 'house-robber'), lc(213, 'House Robber II', 'Medium', 'house-robber-ii', 'Run twice: without the first, without the last'), lc(322, 'Coin Change', 'Medium', 'coin-change'), lc(300, 'Longest Increasing Subsequence', 'Medium', 'longest-increasing-subsequence'), lc(139, 'Word Break', 'Medium', 'word-break'), lc(91, 'Decode Ways', 'Medium', 'decode-ways'), lc(152, 'Maximum Product Subarray', 'Medium', 'maximum-product-subarray')],
});

/* ---------- 2-D DP ---------- */
pattern({
  id: 'dp-2d', topics: ['lcs', 'edit-distance', 'knapsack'],
  when: ['Two sequences compared position by position', 'Paths through a grid that move right and down', 'Items and a capacity (knapsack)'],
  idea: `<p>The state is a pair (<i>i</i>, <i>j</i>): a position in each string, a grid cell, or an item and a remaining capacity. Each cell is computed from a few neighbours (up, left, diagonal). Draw the table on paper for a small example before coding; it shows the fill order and the base row and column.</p>`,
  template: {
    py: `def unique_paths(m, n):                  # LeetCode 62
    row = [1] * n                          # first row: one way to each cell
    for _ in range(1, m):
        for j in range(1, n):
            row[j] += row[j - 1]           # from above (old row[j]) + from the left
    return row[-1]

def lcs(a, b):                            # LeetCode 1143
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            dp[i][j] = dp[i-1][j-1] + 1 if a[i-1] == b[j-1] else max(dp[i-1][j], dp[i][j-1])
    return dp[-1][-1]`,
    cpp: `int uniquePaths(int m, int n) {            // LeetCode 62
    vector<int> row(n, 1);
    for (int i = 1; i < m; i++) for (int j = 1; j < n; j++) row[j] += row[j - 1];
    return row[n - 1];
}`,
  },
  viz: {
    inputHint: 'rows cols (unique paths)',
    presets: [{ label: '3 × 7 grid', input: '3 7' }, { label: '4 × 4 grid', input: '4 4' }],
    random: () => `${rnd(3, 5)} ${rnd(3, 6)}`,
    parse: s => { const [m, n] = parseNums(s, { min: 2, max: 2, lo: 1, hi: 8 }); return { m, n }; },
    run({ m, n }) {
      const R = Rec(); const dp = Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => (i === 0 || j === 0 ? 1 : null)));
      const st = (hl = {}) => ({ table: { title: 'dp[i][j]: ways to reach cell (i, j) moving only right or down', colH: Array.from({ length: n }, (_, j) => j), rowH: Array.from({ length: m }, (_, i) => i), cells: dp.map(r => [...r]), hl, name: 'g' } });
      R.add(st(), 0, 'The first row and first column can each be reached one way only.');
      for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) {
        const v = dp[i - 1][j] + dp[i][j - 1];
        const ask = (i * n + j) % 3 === 1 ? { q: `How many ways reach (${i}, ${j})?`, value: v, hint: 'Ways from above plus ways from the left.', s: st({ [(i - 1) + ',' + j]: 'cmp', [i + ',' + (j - 1)]: 'cmp', [i + ',' + j]: 'ask' }) } : null;
        dp[i][j] = v;
        R.add(st({ [(i - 1) + ',' + j]: 'cmp', [i + ',' + (j - 1)]: 'cmp', [i + ',' + j]: 'cur' }), 0, `dp[${i}][${j}] = ${dp[i - 1][j]} (from above) + ${dp[i][j - 1]} (from the left) = ${v}.`, ask);
      }
      R.add(st({ [(m - 1) + ',' + (n - 1)]: 'found' }), 0, `${dp[m - 1][n - 1]} paths reach the bottom-right corner.`);
      return R.f;
    },
  },
  problems: [lc(62, 'Unique Paths', 'Medium', 'unique-paths'), lc(64, 'Minimum Path Sum', 'Medium', 'minimum-path-sum'), lc(1143, 'Longest Common Subsequence', 'Medium', 'longest-common-subsequence'), lc(416, 'Partition Equal Subset Sum', 'Medium', 'partition-equal-subset-sum'), lc(518, 'Coin Change II', 'Medium', 'coin-change-ii'), lc(5, 'Longest Palindromic Substring', 'Medium', 'longest-palindromic-substring'), lc(72, 'Edit Distance', 'Medium', 'edit-distance'), lc(312, 'Burst Balloons', 'Hard', 'burst-balloons', 'Interval DP')],
});

/* ---------- greedy ---------- */
pattern({
  id: 'greedy', topics: ['greedy', 'huffman'],
  when: ['A natural “best next step” exists (earliest end, farthest reach, cheapest)', 'You can argue that swapping in the greedy choice never hurts', 'Sorting the input once makes the decisions obvious'],
  idea: `<p>Commit to the locally best choice and never revisit it. Before coding, test the rule against a small counterexample hunt: shortest-first fails for interval scheduling, while earliest-finish works. The proof is usually an exchange argument, as in the book's activity-selection and Huffman proofs.</p>`,
  template: {
    py: `def can_jump(nums):                      # LeetCode 55
    reach = 0
    for i, x in enumerate(nums):
        if i > reach:
            return False                   # stuck before i
        reach = max(reach, i + x)          # farthest index reachable so far
    return True

def jump(nums):                           # LeetCode 45: fewest jumps
    jumps = end = far = 0
    for i in range(len(nums) - 1):
        far = max(far, i + nums[i])
        if i == end:                       # must jump now; jump as far as possible
            jumps, end = jumps + 1, far
    return jumps`,
    cpp: `bool canJump(const vector<int>& nums) {   // LeetCode 55
    int reach = 0;
    for (int i = 0; i < (int)nums.size(); i++) {
        if (i > reach) return false;
        reach = max(reach, i + nums[i]);
    }
    return true;
}`,
  },
  seeTopic: 'greedy',
  problems: [lc(121, 'Best Time to Buy and Sell Stock', 'Easy', 'best-time-to-buy-and-sell-stock'), lc(122, 'Best Time to Buy and Sell Stock II', 'Medium', 'best-time-to-buy-and-sell-stock-ii'), lc(55, 'Jump Game', 'Medium', 'jump-game'), lc(45, 'Jump Game II', 'Medium', 'jump-game-ii'), lc(134, 'Gas Station', 'Medium', 'gas-station'), lc(763, 'Partition Labels', 'Medium', 'partition-labels'), lc(846, 'Hand of Straights', 'Medium', 'hand-of-straights')],
});

/* ---------- trie ---------- */
pattern({
  id: 'trie', topics: ['tries'],
  when: ['Many words share prefixes', '“Starts with” queries, autocomplete, or wildcard search', 'Searching a grid for many dictionary words at once'],
  idea: `<p>Store words character by character in a tree, marking where words end. Lookups cost the word's length. For grid word search, put the dictionary in a trie and prune any DFS path that is not a prefix of some word.</p>`,
  template: {
    py: `class Trie:                               # LeetCode 208
    def __init__(self):
        self.root = {}
    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node['$'] = True
    def _walk(self, s):
        node = self.root
        for ch in s:
            if ch not in node:
                return None
            node = node[ch]
        return node
    def search(self, word):
        node = self._walk(word)
        return bool(node) and '$' in node
    def startsWith(self, prefix):
        return self._walk(prefix) is not None`,
    cpp: `struct Trie {
    struct Node { Node* next[26] = {}; bool end = false; };
    Node* root = new Node;
    void insert(const string& w) {
        Node* x = root;
        for (char c : w) { if (!x->next[c - 'a']) x->next[c - 'a'] = new Node; x = x->next[c - 'a']; }
        x->end = true;
    }
};`,
  },
  seeTopic: 'tries',
  problems: [lc(208, 'Implement Trie (Prefix Tree)', 'Medium', 'implement-trie-prefix-tree'), lc(211, 'Design Add and Search Words Data Structure', 'Medium', 'design-add-and-search-words-data-structure'), lc(648, 'Replace Words', 'Medium', 'replace-words'), lc(1268, 'Search Suggestions System', 'Medium', 'search-suggestions-system'), lc(421, 'Maximum XOR of Two Numbers in an Array', 'Medium', 'maximum-xor-of-two-numbers-in-an-array', 'Binary trie over bits'), lc(212, 'Word Search II', 'Hard', 'word-search-ii')],
});

/* ---------- cyclic sort ---------- */
pattern({
  id: 'cyclic-sort', topics: ['arrays', 'counting-sort'],
  when: ['The values are in the range 1..n (or 0..n)', 'Find what is missing, duplicated, or the first missing positive', 'O(1) extra space is required'],
  idea: `<p>If every value <i>v</i> belongs at index <i>v</i> − 1, keep swapping the element at <i>i</i> into its home until the home already holds the right value. Every swap puts one value in its final place, so there are at most <i>n</i> swaps in total. Then one scan finds the indices whose value is wrong: those reveal the missing and duplicated numbers.</p>`,
  template: {
    py: `def first_missing_positive(nums):        # LeetCode 41
    n = len(nums)
    for i in range(n):
        while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:
            j = nums[i] - 1
            nums[i], nums[j] = nums[j], nums[i]     # send the value home
    for i in range(n):
        if nums[i] != i + 1:
            return i + 1
    return n + 1`,
    cpp: `int firstMissingPositive(vector<int>& a) {   // LeetCode 41
    int n = a.size();
    for (int i = 0; i < n; i++)
        while (a[i] >= 1 && a[i] <= n && a[a[i] - 1] != a[i]) swap(a[i], a[a[i] - 1]);
    for (int i = 0; i < n; i++) if (a[i] != i + 1) return i + 1;
    return n + 1;
}`,
  },
  viz: {
    inputHint: 'Numbers (find the first missing positive)',
    presets: [{ label: 'LeetCode 41 example', input: '3 4 -1 1' }, { label: 'Missing 2', input: '7 3 1 4 6 5' }],
    random: () => shuffle6(),
    parse: s => parseNums(s, { min: 1, max: 10, lo: -9, hi: 20 }),
    run(a) {
      const R = Rec(); a = [...a]; const n = a.length; const ids = a.map((_, i) => i);
      const st = (hl = {}, ptr = {}) => ({ arrays: [{ a: [...a], ids: [...ids], hl, ptr, idxLabels: a.map((_, i) => `home of ${i + 1}`), small: false }] });
      R.add(st(), 0, `Each value v from 1 to ${n} belongs at index v − 1.`);
      for (let i = 0; i < n; i++) {
        while (a[i] >= 1 && a[i] <= n && a[a[i] - 1] !== a[i]) {
          const j = a[i] - 1;
          R.add(st({ [i]: 'cur', [j]: 'cmp' }, { i }), 0, `${a[i]} is not home. Swap it with index ${j}.`, { q: `Where does ${a[i]} belong? Click its home.`, pick: 'a:' + j });
          [a[i], a[j]] = [a[j], a[i]];[ids[i], ids[j]] = [ids[j], ids[i]];
          R.add(st({ [j]: 'done' }, { i }), 0, `${a[j]} is now at its home.`);
        }
        R.add(st({ [i]: a[i] === i + 1 ? 'done' : 'warn' }, { i }), 0, a[i] >= 1 && a[i] <= n ? (a[i] === i + 1 ? `Index ${i} holds ${a[i]}, its own value. Move on.` : `${a[i]}'s home already holds ${a[i]}: a duplicate. Move on.`) : `${a[i]} is outside 1..${n}: it can never be the answer. Move on.`);
      }
      let miss = n + 1; for (let i = 0; i < n; i++) if (a[i] !== i + 1) { miss = i + 1; break; }
      R.add(st(miss <= n ? { [miss - 1]: 'found' } : {}), 0, `Scan for the first index whose value is wrong: the first missing positive is ${miss}.`);
      return R.f;
    },
  },
  problems: [lc(268, 'Missing Number', 'Easy', 'missing-number'), lc(448, 'Find All Numbers Disappeared in an Array', 'Easy', 'find-all-numbers-disappeared-in-an-array'), lc(645, 'Set Mismatch', 'Easy', 'set-mismatch'), lc(287, 'Find the Duplicate Number', 'Medium', 'find-the-duplicate-number'), lc(442, 'Find All Duplicates in an Array', 'Medium', 'find-all-duplicates-in-an-array'), lc(41, 'First Missing Positive', 'Hard', 'first-missing-positive')],
});
function shuffle6() { const n = rnd(5, 7); const a = Array.from({ length: n }, (_, i) => i + 1); a.splice(rnd(0, n - 1), 1, rnd(-3, 0)); return a.sort(() => Math.random() - .5).join(' '); }

/* ---------- scenario bank for "spot the pattern" ---------- */
export const SCENARIOS = [
  ['Given a sorted array, find two numbers that add up to a target using O(1) extra space.', 'two-pointers'],
  ['Find the longest substring that contains at most two distinct characters.', 'sliding-window'],
  ['Determine whether a linked list loops back on itself, using constant memory.', 'fast-slow'],
  ['Find the smallest daily capacity that ships every package within D days.', 'binary-search-answer'],
  ['Count the subarrays whose elements sum to exactly k; values may be negative.', 'prefix-sum'],
  ['Return the indices of two numbers in an unsorted array that add up to a target.', 'hashing'],
  ['For each day’s stock price, find how many days you must wait for a higher price.', 'monotonic-stack'],
  ['Return the k points closest to the origin from a list of a million points.', 'heap-top-k'],
  ['Given meeting times, find the minimum number of rooms required.', 'intervals'],
  ['Reverse the nodes of a linked list between positions m and n.', 'list-reversal'],
  ['Find the length of the longest path between any two nodes in a binary tree.', 'tree-dfs'],
  ['Return the values visible when looking at a binary tree from its right side.', 'tree-bfs'],
  ['Count the number of separate land masses in a grid of land and water.', 'graph-traversal'],
  ['Given course prerequisites, return an order in which all courses can be taken.', 'topological-sort'],
  ['Edges are added one at a time; report the first edge that creates a cycle.', 'union-find'],
  ['Return all possible ways to place n queens on an n × n board.', 'backtracking'],
  ['Find the fewest coins that make up an amount, given unlimited coins of each type.', 'dp-1d'],
  ['Find the minimum number of edits to turn one word into another.', 'dp-2d'],
  ['Decide whether you can reach the last index when each value is your maximum jump.', 'greedy'],
  ['Return up to three dictionary words that start with each prefix the user types.', 'trie'],
  ['An array holds n numbers from 0 to n with one missing; find it in O(1) space.', 'cyclic-sort'],
  ['Find the minimum window of a string that contains every character of another string.', 'sliding-window'],
  ['Move all zeros to the end of an array while keeping the order of other elements.', 'two-pointers'],
  ['Find the middle node of a singly linked list in one pass.', 'fast-slow'],
  ['Search for a target in a sorted array that has been rotated at an unknown pivot.', 'binary-search-answer'],
  ['Group words that are anagrams of each other.', 'hashing'],
  ['Find the largest rectangle that fits under a histogram.', 'monotonic-stack'],
  ['Merge k sorted linked lists into one sorted list.', 'heap-top-k'],
  ['Merge all overlapping time ranges in a calendar.', 'intervals'],
  ['Check whether a binary tree is a valid binary search tree.', 'tree-dfs'],
  ['Every rotten orange infects its neighbours each minute; when are all oranges rotten?', 'graph-traversal'],
  ['Given a list of email accounts that share addresses, merge accounts belonging to the same person.', 'union-find'],
  ['Generate every valid combination of n pairs of parentheses.', 'backtracking'],
  ['Count the distinct paths from the top-left to the bottom-right of a grid moving right or down.', 'dp-2d'],
  ['Maximize the money robbed from houses in a row without robbing two neighbours.', 'dp-1d'],
  ['Split a string into as many parts as possible so each letter appears in only one part.', 'greedy'],
  ['Find all words from a dictionary that can be traced on a letter grid.', 'trie'],
  ['Find the first missing positive integer in an unsorted array in linear time and constant space.', 'cyclic-sort'],
  ['Compute the product of all elements except the current one, without division.', 'prefix-sum'],
  ['Reorder a list as first, last, second, second last, and so on, in place.', 'list-reversal'],
];
