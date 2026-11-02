import { Rec, fmtV, h, parseNums, pick, randArr, rnd } from '../../engine/helpers';
import { setPart, topic } from '../registry';

setPart('sort');
export const numsIn = (lo = 1, hi = 99, min = 2, max = 16) => s => parseNums(s, { min, max, lo, hi });
export const rangeHl = (from, to, cls, base = {}) => { const o = { ...base }; for (let k = from; k <= to; k++) o[k] = cls; return o; };

/* ---------------- elementary sorts ---------------- */
topic({
  id: 'elementary-sorts', title: 'Selection and bubble sort', sec: 'Problem 2-2', prereq: ['algorithms'],
  blurb: 'The two simplest quadratic sorts. Worth knowing so you can explain why we need better ones.',
  cx: [['Time', 'Θ(n²)'], ['Space', 'Θ(1)'], ['Swaps (selection)', 'Θ(n)']],
  props: ['In place', 'Selection: not stable', 'Bubble: stable'],
  tags: 'bubble selection sort quadratic',
  learn: `
<p><b>Selection sort</b> repeatedly finds the smallest element of the unsorted part and swaps it into the next position. <b>Bubble sort</b> repeatedly swaps adjacent pairs that are out of order, so small elements drift toward the front one swap at a time. Both take quadratic time on every input of size <i>n</i>, which is why the book moves on quickly. They are still worth knowing: interviewers use them to check that you can reason about loop invariants and stability.</p>
<h3>Selection sort</h3>
<p>After iteration <i>i</i>, the first <i>i</i> positions hold the <i>i</i> smallest elements of the whole array, in sorted order. That is the loop invariant. Each iteration scans the rest of the array for its minimum (about <i>n − i</i> comparisons) and makes a single exchange. Total comparisons are <i>n(n−1)/2</i> regardless of the input, so best, average and worst case are all Θ(<i>n</i>²). The upside is that it makes only <i>n − 1</i> swaps, which matters when writes are expensive.</p>
<div class="note warn">Selection sort is <b>not stable</b>. The long-distance swap can jump an element over an equal one. Try the input <code>4a 4b 1</code> on paper: the first swap moves <code>4a</code> behind <code>4b</code>.</div>
<h3>Bubble sort</h3>
<p>The version in the book's Problem 2-2 runs the inner loop from the end of the array down to position <i>i + 1</i>, swapping <i>A[j]</i> and <i>A[j − 1]</i> whenever they are out of order. Each pass carries the smallest remaining element down to position <i>i</i>. Because it only swaps adjacent elements that are strictly out of order, equal keys never pass each other, so it is <b>stable</b>.</p>
<p>The number of swaps bubble sort makes equals the number of <b>inversions</b> in the input: pairs (<i>i</i>, <i>j</i>) with <i>i</i> &lt; <i>j</i> and <i>A[i]</i> &gt; <i>A[j]</i>. A reversed array has <i>n(n−1)/2</i> inversions, the maximum possible. Insertion sort's running time is also tied to inversions, which is why it does well on nearly sorted data.</p>
<h3>In interviews</h3>
<ul><li>A common follow-up: “stop early if a pass makes no swaps.” That makes bubble sort Θ(<i>n</i>) on sorted input.</li><li>Counting inversions efficiently is a merge sort problem (LeetCode 315 and “reverse pairs”), not a bubble sort one.</li></ul>`,
  code: {
    pseudo: `selectionSort(A)
  for i ← 1 to len(A) - 1
      min ← i
      for j ← i + 1 to len(A)
          if A[j] < A[min]
              min ← j
      swap A[i], A[min]

bubblesort(A)
  for i ← 1 to len(A) - 1
      for j ← len(A) downto i + 1
          if A[j] < A[j - 1]
              swap A[j], A[j - 1]`,
    py: `def selection_sort(a):
    n = len(a)
    for i in range(n - 1):
        m = i
        for j in range(i + 1, n):
            if a[j] < a[m]:
                m = j
        a[i], a[m] = a[m], a[i]
    return a

def bubble_sort(a):
    n = len(a)
    for i in range(n - 1):
        swapped = False
        for j in range(n - 1, i, -1):
            if a[j] < a[j - 1]:
                a[j], a[j - 1] = a[j - 1], a[j]
                swapped = True
        if not swapped:      # already sorted: stop early
            break
    return a`,
    cpp: `#include <vector>
#include <utility>
using namespace std;

void selectionSort(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i + 1 < n; i++) {
        int m = i;
        for (int j = i + 1; j < n; j++)
            if (a[j] < a[m]) m = j;
        swap(a[i], a[m]);
    }
}

void bubbleSort(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i + 1 < n; i++) {
        bool swapped = false;
        for (int j = n - 1; j > i; j--)
            if (a[j] < a[j - 1]) { swap(a[j], a[j - 1]); swapped = true; }
        if (!swapped) break;   // already sorted
    }
}`,
  },
  viz: {
    inputHint: 'selection: 5 2 4 6 1 3   or   bubble: 5 2 4 6 1 3',
    presets: [
      { label: 'Selection sort', input: 'selection: 5 2 4 6 1 3', note: 'Watch the minimum get chosen, then a single swap per pass.' },
      { label: 'Bubble sort', input: 'bubble: 5 2 4 6 1 3', note: 'Small values sink to the front one adjacent swap at a time.' },
      { label: 'Bubble on reversed input', input: 'bubble: 6 5 4 3 2 1', note: 'Every pair is an inversion, so every comparison swaps.' },
    ],
    random: () => pick(['selection', 'bubble']) + ': ' + randArr(rnd(5, 7), 1, 30).join(' '),
    parse: s => { const m = /^\s*(selection|bubble)\s*:\s*(.*)$/i.exec(s); return { alg: m ? m[1].toLowerCase() : 'selection', a: parseNums(m ? m[2] : s, { min: 2, max: 14, lo: -99, hi: 99 }) }; },
    run({ alg, a }) {
      const R = Rec(); a = [...a]; const ids = a.map((_, i) => i), n = a.length;
      const S = (hl, ptr, vars) => ({ vars, arrays: [{ a: [...a], ids: [...ids], hl, ptr, base: 1, bars: true }] });
      const sw = (x, y) => { [a[x], a[y]] = [a[y], a[x]];[ids[x], ids[y]] = [ids[y], ids[x]]; };
      if (alg === 'selection') {
        R.add(S({}, {}), 1, 'Selection sort: grow a sorted prefix by repeatedly picking the minimum of what is left.');
        for (let i = 0; i < n - 1; i++) {
          let m = i; const done = rangeHl(0, i - 1, 'done');
          R.add(S({ ...done, [i]: 'key' }, { i, min: m }), 3, `Pass ${i + 1}: assume A[${i + 1}] = ${a[i]} is the minimum.`);
          for (let j = i + 1; j < n; j++) {
            R.add(S({ ...done, [m]: 'key', [j]: 'cmp' }, { i, j, min: m }), 5, `Compare A[${j + 1}] = ${a[j]} with current minimum ${a[m]}.`);
            if (a[j] < a[m]) { m = j; R.add(S({ ...done, [m]: 'key' }, { i, j, min: m }), 6, `${a[m]} is smaller. It becomes the new minimum.`); }
          }
          let tm = i; for (let j = i + 1; j < n; j++) if (a[j] < a[tm]) tm = j;
          sw(i, m);
          R.add(S({ ...rangeHl(0, i, 'done') }, { i }), 7, m === i ? `A[${i + 1}] was already the minimum. No move needed.` : `Exchange A[${i + 1}] with the minimum. Prefix A[1..${i + 1}] is final.`,
            { q: `Pass ${i + 1} is about to swap. Which element is the minimum of the unsorted part?`, pick: 'a:' + m, hint: 'Look only at positions ' + (i + 1) + ' to ' + n + '.' });
        }
      } else {
        R.add(S({}, {}), 9, 'Bubble sort: each pass carries the smallest remaining element down to the front.');
        for (let i = 0; i < n - 1; i++) {
          let swaps = 0;
          for (let j = n - 1; j > i; j--) {
            const done = rangeHl(0, i - 1, 'done');
            R.add(S({ ...done, [j]: 'cmp', [j - 1]: 'cmp' }, { i, j }), 12, `Compare A[${j}] = ${a[j - 1]} and A[${j + 1}] = ${a[j]}.`);
            if (a[j] < a[j - 1]) {
              const ask = Math.random() < .5 ? { q: `A[${j}] = ${a[j - 1]}, A[${j + 1}] = ${a[j]}. Do they swap?`, choices: ['Swap', 'Leave them'], answer: 0 } : null;
              sw(j, j - 1); swaps++; R.add(S({ ...done, [j]: 'swap', [j - 1]: 'swap' }, { i, j }), 13, `Out of order, so exchange them.`, ask);
            }
          }
          R.add(S(rangeHl(0, i, 'done'), {}), 10, `Pass ${i + 1} done with ${swaps} swap${swaps === 1 ? '' : 's'}. A[${i + 1}] holds its final value.`);
        }
      }
      R.add(S(rangeHl(0, n - 1, 'done'), {}), alg === 'selection' ? 2 : 10, 'Sorted.');
      return R.f;
    },
  },
  quiz: [
    { q: 'How many comparisons does selection sort make on an already sorted array of n elements?', opts: ['n − 1', 'n(n − 1)/2', 'n log n', 'n²'], a: 1, why: 'Selection sort always scans the whole unsorted suffix, so it makes (n−1) + (n−2) + … + 1 comparisons no matter the input.' },
    { q: 'Which of these is stable?', opts: ['Selection sort as written in the book', 'Bubble sort', 'Both', 'Neither'], a: 1, why: 'Bubble sort only swaps adjacent elements that are strictly out of order. Selection sort’s long swap can reorder equal keys.' },
    { q: 'The number of swaps bubble sort performs equals…', opts: ['the number of inversions in the input', 'n − 1 always', 'the number of distinct values', 'n log n'], a: 0, why: 'Each adjacent swap removes exactly one inversion, and the sort finishes when none are left.' },
    { q: 'Why might you choose selection sort over insertion sort?', opts: ['It is faster on nearly sorted data', 'It makes at most n − 1 swaps, useful when writes are costly', 'It is stable', 'It runs in Θ(n log n)'], a: 1, why: 'Selection sort minimizes writes. Insertion sort is faster on nearly sorted inputs.' },
  ],
});

/* ---------------- insertion sort ---------------- */
topic({
  id: 'insertion-sort', title: 'Insertion sort', sec: '§2.1–2.2', prereq: ['algorithms'],
  blurb: 'Sort the way you arrange a hand of cards: take the next card and slide it into place.',
  cx: [['Best', 'Θ(n)'], ['Worst', 'Θ(n²)'], ['Average', 'Θ(n²)'], ['Space', 'Θ(1)']],
  props: ['In place', 'Stable', 'Online', 'Adaptive'],
  tags: 'insertion sort cards loop invariant',
  learn: `
<p>Insertion sort is the first algorithm in the book, and it is a good one to learn the vocabulary on. Think of sorting a hand of playing cards. Your left hand holds cards that are already in order. You take one card at a time from the table and slide it leftward past every card that is larger, until it sits after a card that is not larger.</p>
<h3>How it works</h3>
<p>The outer loop moves an index <i>j</i> from the second position to the last. The element <i>A[j]</i> is the <b>key</b>. The inner loop walks leftward from <i>j − 1</i>, shifting each element greater than the key one slot to the right. When it finds an element ≤ key (or runs off the left end), it drops the key into the gap.</p>
<div class="note key"><b>Loop invariant.</b> At the start of each iteration of the outer loop, the subarray <i>A[1..j−1]</i> consists of the elements originally in those positions, now in sorted order.</div>
<p>The book proves correctness with three checks that you will reuse for every loop:</p>
<ol><li><b>Initialization.</b> Before the first iteration, <i>j</i> = 2, and <i>A[1..1]</i> is a single element, trivially sorted.</li><li><b>Maintenance.</b> The body shifts larger elements right and inserts the key, so <i>A[1..j]</i> becomes sorted. Incrementing <i>j</i> restores the invariant.</li><li><b>Termination.</b> The loop ends when <i>j</i> = <i>n</i> + 1, so the invariant says <i>A[1..n]</i>, the whole array, is sorted.</li></ol>
<h3>Analysis</h3>
<p>The cost is dominated by how many times the inner <code>while</code> test runs. If <i>t<sub>j</sub></i> is the number of tests for a given <i>j</i>:</p>
<ul><li><b>Best case</b>, the array is already sorted: every <i>t<sub>j</sub></i> = 1, so the running time is linear, Θ(<i>n</i>).</li><li><b>Worst case</b>, reverse sorted: the key moves all the way left, <i>t<sub>j</sub></i> = <i>j</i>, and the sum is about <i>n</i>²/2, so Θ(<i>n</i>²).</li><li><b>Average case</b>: half the prefix is larger than the key on average, which is still Θ(<i>n</i>²).</li></ul>
<p>More precisely, the number of shifts equals the number of <b>inversions</b> in the input. That makes insertion sort excellent for nearly sorted data, which is why production sorts (TimSort in Python and Java, introsort in C++) switch to it for small or almost-sorted runs.</p>
<h3>Worked example</h3>
<p>The book's Figure 2.2 sorts ⟨5, 2, 4, 6, 1, 3⟩. Key 2 shifts 5 right and lands first. Key 4 shifts 5. Key 6 does not move. Key 1 shifts all four sorted elements. Key 3 shifts 4, 5 and 6. Load it under <b>Visualize</b> and step through.</p>
<h3>In interviews</h3>
<ul><li>Mention that it is <b>stable</b> (the strict &gt; test never moves an equal key past another) and <b>online</b> (it can sort a stream as items arrive).</li><li>“Insertion sort a linked list” is LeetCode 147.</li><li>Binary search can find the insertion point in O(log <i>j</i>) comparisons, but the shifting still costs Θ(<i>j</i>), so the worst case stays quadratic.</li></ul>`,
  code: {
    pseudo: `insertionSort(A)
  for j ← 2 to len(A)
      key ← A[j]
      // slide A[j] left into the sorted prefix A[1..j-1]
      i ← j - 1
      while i > 0 and A[i] > key
          A[i + 1] ← A[i]
          i ← i - 1
      A[i + 1] ← key`,
    py: `def insertion_sort(a):
    for j in range(1, len(a)):
        key = a[j]
        i = j - 1
        # shift larger elements one slot right
        while i >= 0 and a[i] > key:
            a[i + 1] = a[i]
            i -= 1
        a[i + 1] = key
    return a

print(insertion_sort([5, 2, 4, 6, 1, 3]))  # [1, 2, 3, 4, 5, 6]`,
    cpp: `#include <vector>
using namespace std;

void insertionSort(vector<int>& a) {
    for (int j = 1; j < (int)a.size(); j++) {
        int key = a[j];
        int i = j - 1;
        // shift larger elements one slot right
        while (i >= 0 && a[i] > key) {
            a[i + 1] = a[i];
            i--;
        }
        a[i + 1] = key;
    }
}`,
  },
  viz: {
    inputHint: 'Numbers separated by spaces, for example 5 2 4 6 1 3',
    presets: [
      { label: 'Figure 2.2: ⟨5, 2, 4, 6, 1, 3⟩', input: '5 2 4 6 1 3', note: 'The book’s example. Six keys, each slid into the sorted hand.' },
      { label: 'Already sorted (best case)', input: '1 2 3 4 5 6 7 8', note: 'Each key is compared once and never moves. Linear time.' },
      { label: 'Reverse sorted (worst case)', input: '8 7 6 5 4 3 2 1', note: 'Every key travels to the front. Quadratic time.' },
      { label: 'Nearly sorted', input: '1 2 4 3 5 6 8 7 9', note: 'Only two inversions, so only two shifts.' },
    ],
    random: () => randArr(rnd(6, 8), 1, 40).join(' '),
    parse: numsIn(-99, 99, 2, 16),
    run(a) {
      const R = Rec(); a = [...a]; const ids = a.map((_, i) => i), n = a.length;
      const S = (hl, ptr, vars) => ({ vars, arrays: [{ a: [...a], ids: [...ids], hl, ptr, base: 1, bars: true }] });
      let shifts = 0;
      R.add(S({ 0: 'done' }, {}, { shifts }), 2, 'A[1..1] is a sorted hand of one card. Start with j = 2.');
      for (let j = 1; j < n; j++) {
        const key = a[j];
        let p = j; while (p > 0 && a[p - 1] > key) p--;
        const done = rangeHl(0, j - 1, 'done');
        R.add(S({ ...done, [j]: 'key' }, { j: j }, { key, shifts }), 3, `Take key = ${key} from position ${j + 1}.`);
        let i = j - 1, k = j, first = true;
        const ask = { q: `Key = ${key}. Click the position where it will end up.`, pick: 'a:' + p, hint: 'It stops just after the first element (scanning left) that is ≤ ' + key + '.' };
        while (i >= 0 && a[i] > key) {
          R.add(S({ ...done, [i]: 'cmp', [k]: 'key' }, { i: i, j: j }, { key, shifts }), 6, `A[${i + 1}] = ${a[i]} > ${key}, so shift it right.`, first ? ask : null);
          first = false;
          [a[i], a[k]] = [a[k], a[i]];[ids[i], ids[k]] = [ids[k], ids[i]]; shifts++;
          R.add(S({ ...rangeHl(0, j, 'done'), [i]: 'key', [k]: 'swap' }, { i: i - 1 >= 0 ? i - 1 : null, j: j }, { key, shifts }), 7, `Shifted ${a[k]} to position ${k + 1}.`);
          k = i; i--;
        }
        if (i >= 0) R.add(S({ ...rangeHl(0, j, 'done'), [i]: 'cmp', [k]: 'key' }, { i: i, j: j }, { key, shifts }), 6, `A[${i + 1}] = ${a[i]} ≤ ${key}. Stop scanning.`, first ? ask : null);
        else R.add(S({ ...rangeHl(0, j, 'done'), [k]: 'key' }, { j: j }, { key, shifts }), 6, `Reached the left end (i = 0). Stop scanning.`, first ? ask : null);
        R.add(S({ ...rangeHl(0, j, 'done'), [k]: 'found' }, { j: j }, { key, shifts }), 9, `Place key ${key} at position ${k + 1}. Now A[1..${j + 1}] is sorted.`);
      }
      R.add(S(rangeHl(0, n - 1, 'done'), {}, { shifts }), 2, `Done. ${shifts} shifts, which equals the number of inversions in the input.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'What is the best-case running time of insertion sort, and when does it happen?', opts: ['Θ(n), on an already sorted array', 'Θ(n log n), on random input', 'Θ(n), on a reverse-sorted array', 'Θ(1), on an empty array'], a: 0, why: 'When the input is sorted, the inner while test fails immediately for every key, so each iteration does constant work.' },
    { q: 'Which statement is the loop invariant the book uses for insertion sort?', opts: ['A[j..n] is sorted', 'A[1..j−1] holds the original first j−1 elements in sorted order', 'A[1..j−1] holds the j−1 smallest elements of A', 'The key is always the maximum'], a: 1, why: 'Note the difference from selection sort: the prefix holds the original elements, not necessarily the smallest ones overall.' },
    { q: 'Why is insertion sort stable?', opts: ['It uses extra memory', 'The inner loop uses A[i] > key, so it never moves a key past an equal element', 'It always swaps adjacent elements', 'It is not stable'], a: 1, why: 'Changing the test to ≥ would break stability.' },
    { q: 'Insertion sort runs on ⟨2, 1, 4, 3, 6, 5⟩. How many element shifts occur?', opts: ['0', '3', '6', '15'], a: 1, why: 'There are exactly three inversions: (2,1), (4,3), (6,5). Each costs one shift.' },
    { q: 'Using binary search to find each insertion point changes the worst case to…', opts: ['Θ(n log n)', 'Θ(n²) still, because elements must still be shifted', 'Θ(n)', 'Θ(log n)'], a: 1, why: 'Comparisons drop to O(n log n), but the data movement stays quadratic in the worst case.' },
  ],
});

/* ---------------- merge sort ---------------- */
topic({
  id: 'merge-sort', title: 'Merge sort', sec: '§2.3', prereq: ['insertion-sort', 'recurrences'],
  blurb: 'Divide the array in half, sort each half recursively, then merge the two sorted halves.',
  cx: [['Every case', 'Θ(n lg n)'], ['Extra space', 'Θ(n)'], ['Recurrence', 'T(n) = 2T(n/2) + Θ(n)']],
  props: ['Stable', 'Not in place', 'Divide and conquer'],
  tags: 'merge sort divide conquer recursion sentinel',
  learn: `
<p>Merge sort is the book's introduction to <b>divide and conquer</b>. The pattern has three steps, and you will see it again in quicksort, Strassen's algorithm, the FFT and closest-pair:</p>
<ol><li><b>Divide</b> the problem into subproblems. Here: split <i>A[p..r]</i> at the midpoint <i>q</i>.</li><li><b>Conquer</b> the subproblems recursively. Sort <i>A[p..q]</i> and <i>A[q+1..r]</i>. A one-element array is already sorted, which is the base case.</li><li><b>Combine</b> the answers. Merge the two sorted halves into one sorted run.</li></ol>
<h3>The merge step</h3>
<p>All the real work happens in <code>merge</code>. Copy the two halves into arrays <i>L</i> and <i>R</i>. Then repeatedly compare the front elements of <i>L</i> and <i>R</i>, and copy the smaller into the next slot of <i>A</i>. It is like merging two face-up sorted piles of cards: you only ever look at the two top cards.</p>
<p>The book places a <b>sentinel</b> value ∞ at the end of each pile, so neither pile ever runs out early and the loop needs no “is this pile empty?” check. Exactly <i>r − p + 1</i> cards get placed, then the loop stops with only the two sentinels left.</p>
<div class="note key"><b>Merge invariant.</b> At the start of each iteration, <i>A[p..k−1]</i> holds the <i>k − p</i> smallest elements of <i>L</i> and <i>R</i> in sorted order, and <i>L[i]</i>, <i>R[j]</i> are the smallest elements of their arrays not yet copied back.</div>
<h3>Analysis</h3>
<p>Merging <i>n</i> elements takes Θ(<i>n</i>) time. Splitting is Θ(1). So the running time satisfies</p>
<div class="formula">T(n) = 2 T(n/2) + Θ(n)</div>
<p>Draw the recursion tree: the root costs <i>cn</i>, its two children cost <i>cn</i>/2 each, the four grandchildren <i>cn</i>/4 each, and so on. Every level sums to <i>cn</i>, and there are lg <i>n</i> + 1 levels, so the total is Θ(<i>n</i> lg <i>n</i>). The master theorem gives the same answer (case 2). Unlike insertion sort, this holds for every input, sorted or not.</p>
<h3>Worked example</h3>
<p>Figure 2.4 in the book sorts ⟨5, 2, 4, 7, 1, 3, 2, 6⟩. The bottom level merges pairs into ⟨2,5⟩ ⟨4,7⟩ ⟨1,3⟩ ⟨2,6⟩, the next level into ⟨2,4,5,7⟩ and ⟨1,2,3,6⟩, and the last merge produces the sorted array.</p>
<h3>Trade-offs and interview notes</h3>
<ul><li>Merge sort needs Θ(<i>n</i>) extra memory for <i>L</i> and <i>R</i>. Quicksort sorts in place and usually wins on arrays.</li><li>On <b>linked lists</b> merge sort needs no extra array and is the standard answer (LeetCode 148, Sort List).</li><li>It is <b>stable</b> because ties take from <i>L</i> first (the ≤ test).</li><li>The merge step solves many problems by itself: merge two sorted lists (LC 21), merge k sorted lists (LC 23, with a heap), and counting inversions during the merge (LC 315, 493).</li></ul>`,
  code: {
    pseudo: `mergeSort(A, p, r)
  if p < r
      q ← ⌊(p + r) / 2⌋
      mergeSort(A, p, q)
      mergeSort(A, q + 1, r)
      merge(A, p, q, r)

merge(A, p, q, r)
  n1 ← q - p + 1
  n2 ← r - q
  allocate L[1..n1 + 1], R[1..n2 + 1]
  for i ← 1 to n1
      L[i] ← A[p + i - 1]
  for j ← 1 to n2
      R[j] ← A[q + j]
  L[n1 + 1] ← ∞
  R[n2 + 1] ← ∞
  i ← 1
  j ← 1
  for k ← p to r
      if L[i] ≤ R[j]
          A[k] ← L[i]
          i ← i + 1
      else A[k] ← R[j]
          j ← j + 1`,
    py: `def merge_sort(a):
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    left = merge_sort(a[:mid])
    right = merge_sort(a[mid:])
    return merge(left, right)

def merge(left, right):
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:      # <= keeps the sort stable
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    out.extend(left[i:])
    out.extend(right[j:])
    return out

print(merge_sort([5, 2, 4, 7, 1, 3, 2, 6]))`,
    cpp: `#include <vector>
using namespace std;

void merge(vector<int>& a, int p, int q, int r) {
    vector<int> L(a.begin() + p, a.begin() + q + 1);
    vector<int> R(a.begin() + q + 1, a.begin() + r + 1);
    int i = 0, j = 0, k = p;
    while (i < (int)L.size() && j < (int)R.size())
        a[k++] = (L[i] <= R[j]) ? L[i++] : R[j++];   // <= keeps it stable
    while (i < (int)L.size()) a[k++] = L[i++];
    while (j < (int)R.size()) a[k++] = R[j++];
}

void mergeSort(vector<int>& a, int p, int r) {
    if (p >= r) return;
    int q = p + (r - p) / 2;
    mergeSort(a, p, q);
    mergeSort(a, q + 1, r);
    merge(a, p, q, r);
}`,
  },
  viz: {
    inputHint: 'Up to 12 numbers, for example 5 2 4 7 1 3 2 6',
    presets: [
      { label: 'Figure 2.4: ⟨5, 2, 4, 7, 1, 3, 2, 6⟩', input: '5 2 4 7 1 3 2 6', note: 'The book’s example, with sentinels ∞ at the end of L and R.' },
      { label: 'Odd length', input: '38 27 43 3 9 82 10', note: 'The split is uneven: the left half gets the extra element.' },
      { label: 'With duplicates', input: '3 1 3 2 1 2', note: 'Ties take from L first, which keeps the sort stable.' },
    ],
    random: () => randArr(rnd(6, 8), 1, 50).join(' '),
    parse: numsIn(-99, 99, 2, 12),
    run(a) {
      const R = Rec(); a = [...a]; const n = a.length;
      let depth = 0;
      const S = (hl, ptr, extra = {}) => ({ vars: extra.vars, arrays: [{ name: 'a', label: 'A', a: [...a], hl, ptr, base: 1 }, ...(extra.aux || [])] });
      const span = (p, r, cls, base) => rangeHl(p, r, cls, rangeHl(0, n - 1, 'dim', base || {}));
      R.add(S({}, {}), 1, `MERGE-SORT(A, 1, ${n}): sort the whole array.`);
      function ms(p, r) {
        if (p >= r) { R.add(S(span(p, r, 'done'), { p }), 2, `A[${p + 1}] alone is sorted (base case).`); return; }
        const q = Math.floor((p + r) / 2);
        R.add(S(rangeHl(q + 1, r, 'hi', span(p, q, 'lo')), { p, q, r }), 3, `Split A[${p + 1}..${r + 1}] at q = ${q + 1}: left half A[${p + 1}..${q + 1}], right half A[${q + 2}..${r + 1}].`);
        ms(p, q); ms(q + 1, r);
        merge(p, q, r);
      }
      function merge(p, q, r) {
        const L = a.slice(p, q + 1).concat([Infinity]), Rr = a.slice(q + 1, r + 1).concat([Infinity]);
        let i = 0, j = 0;
        const aux = (hlL, hlR) => [{ name: 'L', label: 'L', a: [...L], hl: hlL, ptr: { i }, base: 1, small: true }, { name: 'R', label: 'R', a: [...Rr], hl: hlR, ptr: { j }, base: 1, small: true }];
        R.add(S(span(p, r, 'lo'), { p, r }, { aux: aux({}, {}) }), 11, `MERGE(A, ${p + 1}, ${q + 1}, ${r + 1}): copy both sorted halves into L and R, with ∞ sentinels at the end.`);
        for (let k = p; k <= r; k++) {
          const takeL = L[i] <= Rr[j];
          R.add(S({ ...span(p, r, 'lo'), ...rangeHl(p, k - 1, 'done'), [k]: 'ask' }, { k }, { aux: aux({ [i]: 'cmp' }, { [j]: 'cmp' }) }), 21, `Compare L[${i + 1}] = ${fmtV(L[i])} with R[${j + 1}] = ${fmtV(Rr[j])}.`);
          a[k] = takeL ? L[i] : Rr[j];
          const ask = { q: `Which value is copied into A[${k + 1}]? Click it in L or R.`, pick: takeL ? 'L:' + i : 'R:' + j, hint: 'Take the smaller front element. On a tie, L wins.' };
          if (takeL) i++; else j++;
          R.add(S({ ...span(p, r, 'lo'), ...rangeHl(p, k, 'done'), [k]: 'found' }, { k }, { aux: aux(takeL ? { [i - 1]: 'dim' } : {}, takeL ? {} : { [j - 1]: 'dim' }) }), takeL ? 22 : 24, `${fmtV(a[k])} is smaller${L[i - (takeL ? 1 : 0)] === Rr[j - (takeL ? 0 : 1)] ? ' (a tie, L wins)' : ''}, so A[${k + 1}] = ${fmtV(a[k])}.`, ask);
        }
        R.add(S(span(p, r, 'done'), {}), 20, `A[${p + 1}..${r + 1}] is now sorted: ${a.slice(p, r + 1).join(', ')}.`);
      }
      ms(0, n - 1);
      R.add(S(rangeHl(0, n - 1, 'done'), {}), 1, 'Sorted.');
      return R.f;
    },
  },
  quiz: [
    { q: 'What recurrence describes merge sort?', opts: ['T(n) = T(n−1) + Θ(n)', 'T(n) = 2T(n/2) + Θ(n)', 'T(n) = 2T(n/2) + Θ(1)', 'T(n) = T(n/2) + Θ(1)'], a: 1, why: 'Two half-size subproblems plus linear-time merging. It solves to Θ(n lg n).' },
    { q: 'Why does the book’s MERGE put ∞ at the end of L and R?', opts: ['To make the sort stable', 'So the loop never has to check whether a pile is empty', 'To handle negative numbers', 'To mark the midpoint'], a: 1, why: 'The sentinel can never be the smaller of the two fronts while real elements remain.' },
    { q: 'Merge sort is the usual choice for sorting a singly linked list because…', opts: ['it needs no random access and no extra array on lists', 'it is in place on arrays', 'it is faster than Θ(n log n) on lists', 'quicksort cannot sort lists at all'], a: 0, why: 'Splitting a list (fast/slow pointers) and merging by relinking nodes needs only O(log n) stack space.' },
    { q: 'How many levels does the recursion tree of merge sort have for n = 16?', opts: ['4', '5', '8', '16'], a: 1, why: 'There are lg n + 1 = 5 levels: sizes 16, 8, 4, 2, 1.' },
    { q: 'Which change would make merge sort unstable?', opts: ['Using < instead of ≤ when comparing L[i] and R[j]', 'Splitting at ⌈(p+r)/2⌉', 'Removing the sentinels', 'Sorting the right half first'], a: 0, why: 'With <, equal elements are taken from R first, so an element from the right half jumps ahead of an equal one from the left.' },
  ],
});

/* ---------------- heapsort ---------------- */
export function heapTree(a, size, hl = {}, extra = {}) {
  const nodes = {};
  for (let i = 0; i < size; i++) nodes[i] = { k: a[i], l: 2 * i + 1 < size ? 2 * i + 1 : null, r: 2 * i + 2 < size ? 2 * i + 2 : null, cls: hl[i], note: extra.notes ? extra.notes[i] : undefined };
  return { nodes, root: size ? 0 : null, binary: true };
}
topic({
  id: 'heapsort', title: 'Heapsort', sec: '§6.3–6.4', prereq: ['binary-heap'],
  blurb: 'Build a max-heap, then repeatedly move the maximum to the end and repair the heap.',
  cx: [['Every case', 'Θ(n lg n)'], ['Build heap', 'Θ(n)'], ['Space', 'Θ(1)']],
  props: ['In place', 'Not stable'],
  tags: 'heapsort heap build max-heapify',
  learn: `
<p>Heapsort combines the best of insertion sort (it works in place) and merge sort (Θ(<i>n</i> lg <i>n</i>) in every case). It uses a <b>max-heap</b>: an array viewed as a nearly complete binary tree where every parent is at least as large as its children. If you have not read <a href="/learn/binary-heap">Heaps and priority queues</a> yet, start there.</p>
<h3>Two phases</h3>
<ol><li><b>Build a max-heap</b> from the unordered array. Call <code>maxHeapify</code> on every internal node, from the last one (index ⌊<i>n</i>/2⌋) back up to the root. Leaves are already one-element heaps.</li><li><b>Extract repeatedly.</b> The maximum is at <i>A[1]</i>. Swap it with the last element of the heap, shrink the heap by one (the swapped-out maximum is now in its final sorted position), and call <code>maxHeapify</code>(<i>A</i>, 1) to sink the new root down to where it belongs.</li></ol>
<div class="note key"><b>Invariant of the second phase.</b> <i>A[1..i]</i> is a max-heap holding the <i>i</i> smallest elements, and <i>A[i+1..n]</i> holds the <i>n − i</i> largest elements in sorted order.</div>
<h3>Why building a heap is linear</h3>
<p>Each <code>maxHeapify</code> call costs O(<i>h</i>) where <i>h</i> is the height of the node. Most nodes are near the bottom: about <i>n</i>/2 leaves of height 0, <i>n</i>/4 nodes of height 1, and so on. The sum Σ <i>h</i> · <i>n</i>/2<sup><i>h</i>+1</sup> converges to O(<i>n</i>). The naive bound of O(<i>n</i> lg <i>n</i>) is correct but not tight.</p>
<p>The extraction phase does <i>n</i> − 1 heapify calls from the root, each O(lg <i>n</i>), so heapsort is O(<i>n</i> lg <i>n</i>) overall.</p>
<h3>In practice</h3>
<ul><li>Heapsort jumps around the array, so it has poor cache locality and a well-implemented quicksort usually beats it.</li><li>It is <b>not stable</b>: the swap to the end can reorder equal keys.</li><li>C++'s <code>std::sort</code> (introsort) falls back to heapsort when quicksort's recursion gets too deep, which guarantees O(<i>n</i> log <i>n</i>).</li><li>In interviews the heap itself is usually what matters: top-k elements, k-th largest (LC 215), merging k sorted lists (LC 23).</li></ul>`,
  code: {
    pseudo: `heapsort(A)
  buildMaxHeap(A)
  for i ← len(A) downto 2
      swap A[1], A[i]
      A.heapSize ← A.heapSize - 1
      maxHeapify(A, 1)

buildMaxHeap(A)
  A.heapSize ← len(A)
  for i ← ⌊len(A) / 2⌋ downto 1
      maxHeapify(A, i)

maxHeapify(A, i)
  l ← left(i)
  r ← right(i)
  if l ≤ A.heapSize and A[l] > A[i]
      largest ← l
  else largest ← i
  if r ≤ A.heapSize and A[r] > A[largest]
      largest ← r
  if largest ≠ i
      swap A[i], A[largest]
      maxHeapify(A, largest)`,
    py: `def max_heapify(a, i, size):
    while True:
        l, r = 2 * i + 1, 2 * i + 2
        largest = i
        if l < size and a[l] > a[largest]:
            largest = l
        if r < size and a[r] > a[largest]:
            largest = r
        if largest == i:
            return
        a[i], a[largest] = a[largest], a[i]
        i = largest

def heapsort(a):
    n = len(a)
    for i in range(n // 2 - 1, -1, -1):   # build max-heap
        max_heapify(a, i, n)
    for end in range(n - 1, 0, -1):
        a[0], a[end] = a[end], a[0]       # move max to the end
        max_heapify(a, 0, end)
    return a`,
    cpp: `#include <vector>
#include <utility>
using namespace std;

void maxHeapify(vector<int>& a, int i, int size) {
    while (true) {
        int l = 2 * i + 1, r = 2 * i + 2, largest = i;
        if (l < size && a[l] > a[largest]) largest = l;
        if (r < size && a[r] > a[largest]) largest = r;
        if (largest == i) return;
        swap(a[i], a[largest]);
        i = largest;
    }
}

void heapSort(vector<int>& a) {
    int n = a.size();
    for (int i = n / 2 - 1; i >= 0; i--) maxHeapify(a, i, n);
    for (int end = n - 1; end > 0; end--) {
        swap(a[0], a[end]);
        maxHeapify(a, 0, end);
    }
}`,
  },
  viz: {
    inputHint: 'Up to 15 numbers',
    presets: [
      { label: 'Figure 6.3 input', input: '4 1 3 2 16 9 10 14 8 7', note: 'The book builds a max-heap from this array in Figure 6.3, then sorts it in Figure 6.4.' },
      { label: 'Small example', input: '5 13 2 25 7 17 20 8 4', note: 'Nine elements: a heap of height 3.' },
    ],
    random: () => randArr(rnd(7, 9), 1, 60).join(' '),
    parse: numsIn(-99, 99, 2, 15),
    run(a) {
      const R = Rec(); a = [...a]; const n = a.length; let size = n;
      const S = (hl, ptr, vars) => ({ vars, tree: heapTree(a, size, hl), arrays: [{ a: [...a], hl: { ...hl, ...rangeHl(size, n - 1, 'done') }, ptr, base: 1 }] });
      function heapify(i, line0) {
        for (;;) {
          const l = 2 * i + 1, r = 2 * i + 2; let lg = i;
          if (l < size && a[l] > a[lg]) lg = l;
          if (r < size && a[r] > a[lg]) lg = r;
          const kids = {}; if (l < size) kids[l] = 'cmp'; if (r < size) kids[r] = 'cmp';
          if (l >= size) { R.add(S({ [i]: 'cur' }, { i }), 16, `Node ${i + 1} (${a[i]}) is a leaf. Nothing to do.`); return; }
          R.add(S({ ...kids, [i]: 'cur' }, { i }), 16, `MAX-HEAPIFY at node ${i + 1} (${a[i]}): compare with its children.`);
          const ask = { q: `Which of node ${i + 1} and its children holds the largest value?`, pick: ['n:' + lg, 'a:' + lg], hint: 'Compare the parent with both children.' };
          if (lg === i) { R.add(S({ [i]: 'ok' }, { i }), 21, `${a[i]} is at least as large as its children. Heap property holds here.`, ask); return; }
          R.add(S({ [lg]: 'cur', [i]: 'cmp' }, { i, largest: lg }), lg === l ? 17 : 20, `largest = node ${lg + 1} (${a[lg]}).`, ask);
          [a[i], a[lg]] = [a[lg], a[i]];
          R.add(S({ [lg]: 'cur', [i]: 'ok' }, { largest: lg }), 22, `Exchange: ${a[i]} moves up, ${a[lg]} sinks to node ${lg + 1}.`);
          i = lg;
        }
      }
      R.add(S({}, {}), 2, 'Phase 1: build a max-heap. The array is read as a complete binary tree.');
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) { R.add(S({ [i]: 'cur' }, { i }), 11, `BUILD-MAX-HEAP: call MAX-HEAPIFY on node ${i + 1}.`); heapify(i); }
      R.add(S({}, {}), 3, `Max-heap built. The maximum, ${a[0]}, is at the root.`);
      for (let i = n - 1; i >= 1; i--) {
        [a[0], a[i]] = [a[i], a[0]];
        R.add(S({ 0: 'cur', [i]: 'found' }, { i }), 4, `Exchange the root with A[${i + 1}]. ${a[i]} is now in its final position.`);
        size--;
        R.add(S({ 0: 'cur' }, {}), 5, `Shrink the heap to ${size} element${size === 1 ? '' : 's'}.`);
        heapify(0);
      }
      size = 0;
      R.add(S({}, {}), 3, 'Sorted: ' + a.join(', ') + '.');
      return R.f;
    },
  },
  quiz: [
    { q: 'What is the tight bound for BUILD-MAX-HEAP on n elements?', opts: ['Θ(n)', 'Θ(n lg n)', 'Θ(lg n)', 'Θ(n²)'], a: 0, why: 'Most nodes are low in the tree, and heapify costs only their height. The sum is linear.' },
    { q: 'BUILD-MAX-HEAP starts its loop at index ⌊n/2⌋ because…', opts: ['nodes after ⌊n/2⌋ are leaves, already heaps', 'the root must be processed last', 'it halves the work', 'the left half is sorted'], a: 0, why: 'In a 1-indexed heap, nodes ⌊n/2⌋+1 through n have no children.' },
    { q: 'Is heapsort stable?', opts: ['Yes', 'No'], a: 1, why: 'Moving the root to the end can carry an element past an equal one.' },
    { q: 'In a 1-indexed heap, the children of node i are at…', opts: ['i+1 and i+2', '2i and 2i+1', '2i−1 and 2i', 'i/2 and i/2+1'], a: 1, why: 'Parent is ⌊i/2⌋. In 0-indexed code, children are 2i+1 and 2i+2.' },
  ],
});

/* ---------------- quicksort ---------------- */
topic({
  id: 'quicksort', title: 'Quicksort', sec: '§7.1–7.4', prereq: ['merge-sort', 'probabilistic'],
  blurb: 'Partition around a pivot so smaller elements go left and larger go right, then recurse on each side.',
  cx: [['Expected', 'Θ(n lg n)'], ['Worst', 'Θ(n²)'], ['Space', 'Θ(lg n) stack, expected']],
  props: ['In place', 'Not stable', 'Divide and conquer'],
  tags: 'quicksort partition lomuto hoare pivot randomized',
  learn: `
<p>Quicksort is divide and conquer with the work moved to the front. Merge sort splits trivially and works hard to combine. Quicksort works hard to split, so that combining is free.</p>
<ol><li><b>Divide.</b> Choose a pivot <i>x</i> (the book uses the last element, <i>A[r]</i>). Rearrange <i>A[p..r]</i> so that every element of <i>A[p..q−1]</i> is ≤ <i>x</i>, <i>A[q]</i> = <i>x</i>, and every element of <i>A[q+1..r]</i> is &gt; <i>x</i>.</li><li><b>Conquer.</b> Sort the two sides recursively.</li><li><b>Combine.</b> Nothing to do. The array is already sorted.</li></ol>
<h3>The partition procedure</h3>
<p>The book's <code>partition</code> (Lomuto's scheme) scans left to right with index <i>j</i> and keeps a boundary <i>i</i>. At every step the subarray is split into four regions:</p>
<ul><li><i>A[p..i]</i>: elements known to be ≤ pivot</li><li><i>A[i+1..j−1]</i>: elements known to be &gt; pivot</li><li><i>A[j..r−1]</i>: not yet examined</li><li><i>A[r]</i>: the pivot</li></ul>
<p>When <i>A[j]</i> ≤ pivot, increment <i>i</i> and swap <i>A[i]</i> with <i>A[j]</i>, which grows the low region by one. Otherwise just advance <i>j</i>. At the end, swap the pivot into position <i>i</i> + 1, between the two regions. This is exactly what the colored regions show in the visualizer.</p>
<h3>Performance</h3>
<ul><li><b>Worst case</b> Θ(<i>n</i>²): the pivot is always the smallest or largest element, so one side is empty. With the last-element pivot, this happens on already sorted input, which is common in practice.</li><li><b>Best case</b> Θ(<i>n</i> lg <i>n</i>): the pivot always splits evenly.</li><li><b>Any constant-proportion split</b> is still Θ(<i>n</i> lg <i>n</i>). The book shows that even a 9-to-1 split every time gives a recursion tree of depth log<sub>10/9</sub> <i>n</i>.</li></ul>
<h3>Randomization</h3>
<p><code>randomizedPartition</code> swaps a uniformly random element into position <i>r</i> before partitioning. Now no particular input is bad. The expected number of comparisons is at most 2<i>n</i> ln <i>n</i> ≈ 1.39 <i>n</i> lg <i>n</i>. The book's proof uses indicator random variables: elements <i>z<sub>i</sub></i> and <i>z<sub>j</sub></i> (the i-th and j-th smallest) are compared exactly when one of them is the first pivot chosen from <i>z<sub>i</sub>..z<sub>j</sub></i>, which has probability 2/(<i>j − i</i> + 1).</p>
<div class="note warn"><b>Duplicates.</b> If every element is equal, Lomuto's partition sends everything to the low side and quicksort goes quadratic. Three-way partitioning (Dutch national flag, LeetCode 75) fixes this.</div>
<h3>In interviews</h3>
<ul><li>The partition step is the core of <b>quickselect</b>, which finds the k-th smallest element in expected linear time (LeetCode 215).</li><li>Know both Lomuto (simpler, the book's) and Hoare (fewer swaps, used in Problem 7-1) partitioning.</li><li>Quicksort usually beats merge sort and heapsort on arrays because its inner loop is tight and cache friendly.</li></ul>`,
  code: {
    pseudo: `quicksort(A, p, r)
  if p < r
      q ← partition(A, p, r)
      quicksort(A, p, q - 1)
      quicksort(A, q + 1, r)

partition(A, p, r)
  x ← A[r]
  i ← p - 1
  for j ← p to r - 1
      if A[j] ≤ x
          i ← i + 1
          swap A[i], A[j]
  swap A[i + 1], A[r]
  return i + 1`,
    py: `import random

def partition(a, p, r):
    x = a[r]                      # pivot
    i = p - 1
    for j in range(p, r):
        if a[j] <= x:
            i += 1
            a[i], a[j] = a[j], a[i]
    a[i + 1], a[r] = a[r], a[i + 1]
    return i + 1

def quicksort(a, p=0, r=None):
    if r is None:
        r = len(a) - 1
    if p < r:
        k = random.randint(p, r)  # randomized pivot
        a[k], a[r] = a[r], a[k]
        q = partition(a, p, r)
        quicksort(a, p, q - 1)
        quicksort(a, q + 1, r)
    return a`,
    cpp: `#include <vector>
#include <cstdlib>
#include <utility>
using namespace std;

int partition(vector<int>& a, int p, int r) {
    int x = a[r], i = p - 1;
    for (int j = p; j < r; j++)
        if (a[j] <= x) swap(a[++i], a[j]);
    swap(a[i + 1], a[r]);
    return i + 1;
}

void quickSort(vector<int>& a, int p, int r) {
    if (p >= r) return;
    int k = p + rand() % (r - p + 1);   // randomized pivot
    swap(a[k], a[r]);
    int q = partition(a, p, r);
    quickSort(a, p, q - 1);
    quickSort(a, q + 1, r);
}`,
  },
  viz: {
    inputHint: 'Up to 14 numbers. The last element of each range is the pivot.',
    legend: '<span><i class="dot s2"></i>≤ pivot</span><span><i class="dot" style="border-color:var(--violet);background:var(--violet-soft)"></i>&gt; pivot</span><span><i class="dot" style="border-color:var(--violet);background:var(--violet)"></i>pivot</span><span><i class="dot s3"></i>final position</span>',
    presets: [
      { label: 'Figure 7.1: ⟨2, 8, 7, 1, 3, 5, 6, 4⟩', input: '2 8 7 1 3 5 6 4', note: 'The book’s partition example, pivot 4.' },
      { label: 'Already sorted (worst case)', input: '1 2 3 4 5 6 7 8', note: 'The last-element pivot is always the maximum. Each partition peels off one element.' },
      { label: 'Random-looking', input: '13 19 9 5 12 8 7 4 21 2 6 11', note: 'Partition sizes vary with each pivot.' },
    ],
    random: () => randArr(rnd(6, 9), 1, 40).join(' '),
    parse: numsIn(-99, 99, 2, 14),
    run(a) {
      const R = Rec(); a = [...a]; const ids = a.map((_, i) => i), n = a.length; const fin = {};
      const S = (hl, ptr, vars) => ({ vars, arrays: [{ a: [...a], ids: [...ids], hl: { ...Object.fromEntries(Object.keys(fin).map(k => [k, 'done'])), ...hl }, ptr, base: 1, bars: true }] });
      const sw = (x, y) => { [a[x], a[y]] = [a[y], a[x]];[ids[x], ids[y]] = [ids[y], ids[x]]; };
      const outside = (p, r) => { const o = {}; for (let k = 0; k < n; k++) if ((k < p || k > r) && !fin[k]) o[k] = 'dim'; return o; };
      R.add(S({}, {}), 1, `QUICKSORT(A, 1, ${n}).`);
      function qs(p, r) {
        if (p > r) return;
        if (p === r) { fin[p] = 1; R.add(S(outside(p, r), { p }), 2, `A[${p + 1}..${r + 1}] has one element. It is in its final place.`); return; }
        const x = a[r]; let i = p - 1;
        const regions = (j) => ({ ...outside(p, r), ...rangeHl(p, i, 'lo'), ...rangeHl(i + 1, j - 1, 'hi'), [r]: 'piv' });
        R.add(S(regions(p), { p, r }, { pivot: x }), 8, `PARTITION(A, ${p + 1}, ${r + 1}): pivot x = A[${r + 1}] = ${x}.`);
        for (let j = p; j < r; j++) {
          R.add(S({ ...regions(j), [j]: 'cmp' }, { i: i >= p ? i : null, j }, { pivot: x }), 11, `Is A[${j + 1}] = ${a[j]} ≤ ${x}?`);
          if (a[j] <= x) {
            i++;
            const ask = { q: `${a[j]} ≤ ${x}, so i advances and a swap happens. Click the cell A[j] is exchanged with.`, pick: 'a:' + i, hint: 'It is the first cell after the ≤ region.' };
            sw(i, j);
            R.add(S({ ...regions(j + 1), [i]: 'swap' }, { i, j }, { pivot: x }), 13, i === j ? `Yes. i = ${i + 1} equals j, so the element stays where it is.` : `Yes. i = ${i + 1}; exchange A[${i + 1}] and A[${j + 1}]. The ≤ region grows.`, Math.random() < .6 ? ask : null);
          } else R.add(S({ ...regions(j + 1), [j]: 'hi' }, { i: i >= p ? i : null, j }, { pivot: x }), 11, `No. ${a[j]} > ${x} stays in the > region.`);
        }
        sw(i + 1, r); fin[i + 1] = 1;
        R.add(S({ ...outside(p, r), ...rangeHl(p, i, 'lo'), ...rangeHl(i + 2, r, 'hi'), [i + 1]: 'piv' }, { q: i + 1 }, { pivot: x }), 14,
          `Exchange the pivot into A[${i + 2}]. Everything left of it is ≤ ${x}, everything right is > ${x}.`,
          { q: `The scan is finished. Click the cell where pivot ${x} will land.`, pick: 'a:' + (i + 1), hint: 'Right after the last element of the ≤ region.' });
        const q = i + 1;
        qs(p, q - 1); qs(q + 1, r);
      }
      qs(0, n - 1);
      R.add(S({}, {}), 1, 'Sorted.');
      return R.f;
    },
  },
  quiz: [
    { q: 'Which input makes the book’s PARTITION (last-element pivot) perform worst?', opts: ['Random order', 'Already sorted', 'All distinct', 'Alternating high and low values'], a: 1, why: 'Every pivot is the maximum, so one side of each split is empty and the recursion depth is n.' },
    { q: 'If partition always produces a 9-to-1 split, quicksort runs in…', opts: ['Θ(n²)', 'Θ(n lg n)', 'Θ(n)', 'Θ(n^1.5)'], a: 1, why: 'The recursion tree has depth log₁₀/₉ n = Θ(lg n), and each level costs at most cn.' },
    { q: 'During Lomuto partition, what does the region A[i+1..j−1] contain?', opts: ['Elements ≤ pivot', 'Elements > pivot', 'Unexamined elements', 'The pivot'], a: 1, why: 'A[p..i] is ≤ pivot, A[i+1..j−1] is > pivot, A[j..r−1] is unexamined.' },
    { q: 'What is the expected number of comparisons in randomized quicksort?', opts: ['O(n)', 'O(n lg n)', 'O(n²)', 'O(lg n)'], a: 1, why: 'Summing 2/(j−i+1) over all pairs gives about 2n ln n.' },
    { q: 'Quicksort on an array where all elements are equal, using the book’s PARTITION, takes…', opts: ['Θ(n)', 'Θ(n lg n)', 'Θ(n²)'], a: 2, why: 'Every element is ≤ pivot, so the split is n−1 to 0. Three-way partitioning avoids this.' },
  ],
});

/* ---------------- counting sort ---------------- */
topic({
  id: 'counting-sort', title: 'Counting sort and the lower bound', sec: '§8.1–8.2', prereq: ['merge-sort'],
  blurb: 'No comparison sort can beat n lg n. Counting sort sidesteps the limit by indexing on the keys.',
  cx: [['Time', 'Θ(n + k)'], ['Space', 'Θ(n + k)'], ['Comparison lower bound', 'Ω(n lg n)']],
  props: ['Stable', 'Not in place', 'Integer keys 0..k'],
  tags: 'counting sort lower bound decision tree linear time',
  learn: `
<h3>Why comparison sorts cannot beat n lg n</h3>
<p>Every sort so far learns about the input only by comparing pairs of elements. The book models any such algorithm as a <b>decision tree</b>: each internal node is a comparison “<i>a<sub>i</sub></i> ≤ <i>a<sub>j</sub></i>?”, each leaf is an output permutation. To sort every input correctly the tree needs at least <i>n</i>! reachable leaves. A binary tree of height <i>h</i> has at most 2<sup><i>h</i></sup> leaves, so</p>
<div class="formula">2<sup>h</sup> ≥ n! &nbsp;⟹&nbsp; h ≥ lg(n!) = Ω(n lg n)</div>
<p>The height is the worst-case number of comparisons. So merge sort and heapsort are <b>asymptotically optimal</b> comparison sorts. To go faster you must use something other than comparisons.</p>
<h3>Counting sort</h3>
<p>If every key is an integer in the range 0 to <i>k</i>, you can count. Counting sort makes three passes:</p>
<ol><li><b>Count.</b> <i>C[v]</i> = how many elements equal <i>v</i>.</li><li><b>Prefix sums.</b> Replace <i>C[v]</i> with the number of elements ≤ <i>v</i>. Now <i>C[v]</i> is the last position that a <i>v</i> should occupy in the output.</li><li><b>Place.</b> Walk the input from <b>right to left</b>. Put <i>A[j]</i> at <i>B[C[A[j]]]</i>, then decrement <i>C[A[j]]</i> so the next equal key goes one slot earlier.</li></ol>
<p>Walking right to left is what makes it <b>stable</b>: among equal keys, the last one in the input fills the last slot. Stability is not a nicety here. Radix sort depends on it.</p>
<p>Running time is Θ(<i>n</i> + <i>k</i>). When <i>k</i> = O(<i>n</i>), that is linear. When <i>k</i> is huge (sorting 32-bit integers directly), the count array is too big and you should use radix sort instead.</p>
<h3>Worked example</h3>
<p>Figure 8.2 sorts <i>A</i> = ⟨2, 5, 3, 0, 2, 3, 0, 3⟩ with <i>k</i> = 5. The counts are <i>C</i> = ⟨2, 0, 2, 3, 0, 1⟩, the prefix sums are ⟨2, 2, 4, 7, 7, 8⟩, and the output is ⟨0, 0, 2, 2, 3, 3, 3, 5⟩.</p>
<h3>In interviews</h3>
<ul><li>Bounded alphabets are a strong hint: “lowercase letters only” means an array of 26 counts beats a hash map. See anagram problems (LC 242, 438).</li><li>Sort Colors (LC 75) can be solved by counting, though the one-pass three-way partition is the expected answer.</li><li>H-Index (LC 274) and Top K Frequent (LC 347, bucket by frequency) use the same idea.</li></ul>`,
  code: {
    pseudo: `countingSort(A, B, k)
  allocate C[0..k]
  for i ← 0 to k
      C[i] ← 0
  for j ← 1 to len(A)
      C[A[j]] ← C[A[j]] + 1
  // C[i] = how many elements equal i
  for i ← 1 to k
      C[i] ← C[i] + C[i - 1]
  // C[i] = how many elements are ≤ i
  for j ← len(A) downto 1
      B[C[A[j]]] ← A[j]
      C[A[j]] ← C[A[j]] - 1`,
    py: `def counting_sort(a, k):
    count = [0] * (k + 1)
    for v in a:
        count[v] += 1
    for i in range(1, k + 1):           # prefix sums
        count[i] += count[i - 1]
    out = [0] * len(a)
    for v in reversed(a):               # right to left keeps it stable
        count[v] -= 1
        out[count[v]] = v
    return out

print(counting_sort([2, 5, 3, 0, 2, 3, 0, 3], 5))`,
    cpp: `#include <vector>
using namespace std;

vector<int> countingSort(const vector<int>& a, int k) {
    vector<int> count(k + 1, 0), out(a.size());
    for (int v : a) count[v]++;
    for (int i = 1; i <= k; i++) count[i] += count[i - 1];
    for (int j = (int)a.size() - 1; j >= 0; j--)   // stable
        out[--count[a[j]]] = a[j];
    return out;
}`,
  },
  viz: {
    inputHint: 'Integers from 0 to 9, for example 2 5 3 0 2 3 0 3',
    presets: [
      { label: 'Figure 8.2: ⟨2, 5, 3, 0, 2, 3, 0, 3⟩', input: '2 5 3 0 2 3 0 3', note: 'The book’s example with k = 5.' },
      { label: 'Many duplicates', input: '1 4 1 2 7 5 2 1 4', note: 'Watch equal keys keep their relative order.' },
    ],
    random: () => randArr(rnd(6, 9), 0, 6).join(' '),
    parse: s => parseNums(s, { min: 2, max: 14, lo: 0, hi: 9 }),
    run(a) {
      const R = Rec(); const n = a.length, k = Math.max(...a);
      const C = Array(k + 1).fill(0), B = Array(n).fill(null);
      const S = (hA, hC, hB, ptr = {}, vars) => ({ vars, arrays: [{ name: 'A', label: 'A (input)', a: [...a], hl: hA, ptr: ptr.A, base: 1, small: true }, { name: 'C', label: 'C (counts)', a: [...C], hl: hC, ptr: ptr.C, base: 0, small: true }, { name: 'B', label: 'B (output)', a: [...B], hl: hB, ptr: ptr.B, base: 1, small: true }] });
      R.add(S({}, {}, {}, {}, { k }), 2, `k = ${k}. Make a count array C[0..${k}], all zeros.`);
      for (let j = 0; j < n; j++) { C[a[j]]++; R.add(S({ [j]: 'cur' }, { [a[j]]: 'cmp' }, {}, { A: { j }, C: {} }), 6, `A[${j + 1}] = ${a[j]}: increment C[${a[j]}] to ${C[a[j]]}.`); }
      R.add(S({}, {}, {}), 7, 'C[i] now counts the elements equal to i.');
      for (let i = 1; i <= k; i++) {
        const v = C[i] + C[i - 1];
        const ask = { q: `C[${i}] = ${C[i]} and C[${i - 1}] = ${C[i - 1]}. What does C[${i}] become?`, value: v, hint: 'Add the previous running total.' };
        C[i] = v;
        R.add(S({}, { [i]: 'cur', [i - 1]: 'cmp' }, {}, { C: { i } }), 9, `C[${i}] = C[${i}] + C[${i - 1}] = ${v}. There are ${v} elements ≤ ${i}.`, ask);
      }
      R.add(S({}, {}, {}), 10, 'C[i] now holds the number of elements ≤ i: the last output slot for key i.');
      for (let j = n - 1; j >= 0; j--) {
        const v = a[j], pos = C[v] - 1;
        R.add(S({ [j]: 'cur' }, { [v]: 'cmp' }, {}, { A: { j }, C: {} }), 11, `A[${j + 1}] = ${v}. C[${v}] = ${C[v]}, so it belongs at B[${C[v]}].`);
        B[pos] = v; C[v]--;
        R.add(S({ [j]: 'done' }, { [v]: 'cur' }, { [pos]: 'found' }, { B: {} }), 12, `B[${pos + 1}] = ${v}; decrement C[${v}] to ${C[v]}.`, { q: `Where does A[${j + 1}] = ${v} go in B? Click the slot.`, pick: 'B:' + pos, hint: `Look at C[${v}].` });
      }
      R.add(S({}, {}, rangeHl(0, n - 1, 'done')), 11, 'B is sorted, and equal keys kept their input order.');
      return R.f;
    },
  },
  quiz: [
    { q: 'What is the minimum height of a decision tree that sorts n elements?', opts: ['Ω(n)', 'Ω(n lg n)', 'Ω(n²)', 'Ω(lg n)'], a: 1, why: 'It needs at least n! leaves, and lg(n!) = Θ(n lg n) by Stirling’s approximation.' },
    { q: 'Why does counting sort’s last loop run from right to left?', opts: ['It is faster', 'It makes the sort stable', 'It handles negative keys', 'It avoids overflow'], a: 1, why: 'The last occurrence of a key fills the last slot reserved for that key, preserving input order.' },
    { q: 'Counting sort on n keys from 0 to k runs in…', opts: ['Θ(n lg n)', 'Θ(n + k)', 'Θ(nk)', 'Θ(k lg k)'], a: 1, why: 'One pass over the input, one over C, one more over the input.' },
    { q: 'When is counting sort a bad choice?', opts: ['When n is large', 'When k is much larger than n', 'When keys repeat', 'When you need stability'], a: 1, why: 'The C array has k+1 entries, so time and space blow up if the key range is huge.' },
  ],
});

/* ---------------- radix sort ---------------- */
topic({
  id: 'radix-sort', title: 'Radix sort', sec: '§8.3', prereq: ['counting-sort'],
  blurb: 'Sort by the least significant digit first, using a stable sort on each digit.',
  cx: [['Time', 'Θ(d(n + k))'], ['Space', 'Θ(n + k)']],
  props: ['Stable', 'Integer or fixed-length keys'],
  tags: 'radix sort digit lsd msd',
  learn: `
<p>Radix sort is the algorithm of the old punched-card sorting machines. It sorts <i>d</i>-digit numbers by running a stable sort on each digit, starting with the <b>least significant</b> one.</p>
<p>It feels backwards. Why not sort by the most significant digit first? Because with LSD order, each pass only needs one stable sort over the whole array, no recursion into piles. After sorting on digit <i>i</i>, the numbers are in order with respect to their last <i>i</i> digits. The next pass sorts on digit <i>i</i> + 1, and stability keeps numbers with equal digit <i>i</i> + 1 in their already-correct order.</p>
<div class="note key"><b>Stability is essential.</b> If the per-digit sort were unstable, a later pass could scramble the order that earlier passes established. Counting sort is the usual choice because each digit has a small range (0 to 9, or 0 to 255 for bytes).</div>
<h3>Analysis</h3>
<p>With <i>d</i> digits, each in the range 0 to <i>k</i> − 1, radix sort makes <i>d</i> passes of counting sort, for Θ(<i>d</i>(<i>n</i> + <i>k</i>)) time. The book shows how to choose digit width: sorting <i>b</i>-bit keys using <i>r</i>-bit digits takes Θ((<i>b</i>/<i>r</i>)(<i>n</i> + 2<sup><i>r</i></sup>)), minimized near <i>r</i> = lg <i>n</i>. For 32-bit integers, four passes of 8-bit digits is a classic choice.</p>
<h3>Worked example</h3>
<p>Figure 8.3 sorts 329, 457, 657, 839, 436, 720, 355. After the ones digit: 720, 355, 436, 457, 657, 329, 839. After the tens: 720, 329, 436, 839, 355, 457, 657. After the hundreds the list is sorted.</p>
<h3>In interviews</h3>
<ul><li>Maximum Gap (LC 164) asks for linear time, which points at radix or bucket sort.</li><li>Radix sort also works on strings of equal length, character by character from the right.</li></ul>`,
  code: {
    pseudo: `radixSort(A, d)
  for i ← 1 to d
      stableSortByDigit(A, i)        // counting sort works`,
    py: `def radix_sort(a, base=10):
    if not a:
        return a
    exp = 1
    while max(a) // exp > 0:
        buckets = [[] for _ in range(base)]
        for v in a:                       # appending keeps it stable
            buckets[(v // exp) % base].append(v)
        a = [v for b in buckets for v in b]
        exp *= base
    return a

print(radix_sort([329, 457, 657, 839, 436, 720, 355]))`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

void radixSort(vector<int>& a) {          // non-negative ints
    if (a.empty()) return;
    int mx = *max_element(a.begin(), a.end());
    vector<int> out(a.size());
    for (long long exp = 1; mx / exp > 0; exp *= 10) {
        int count[10] = {0};
        for (int v : a) count[(v / exp) % 10]++;
        for (int i = 1; i < 10; i++) count[i] += count[i - 1];
        for (int j = (int)a.size() - 1; j >= 0; j--)
            out[--count[(a[j] / exp) % 10]] = a[j];
        a = out;
    }
}`,
  },
  viz: {
    inputHint: 'Non-negative integers with up to 4 digits',
    presets: [
      { label: 'Figure 8.3', input: '329 457 657 839 436 720 355', note: 'The book’s seven 3-digit numbers.' },
      { label: 'Mixed lengths', input: '170 45 75 90 802 24 2 66', note: 'Short numbers are padded with leading zeros.' },
    ],
    random: () => randArr(rnd(6, 8), 10, 999).join(' '),
    parse: s => parseNums(s, { min: 2, max: 12, lo: 0, hi: 9999 }),
    run(a) {
      const R = Rec(); a = [...a]; const d = String(Math.max(...a)).length;
      const digits = v => String(v).padStart(d, '0').split('').map(Number);
      const tbl = (hlRow, col, title) => ({ title, colH: Array.from({ length: d }, (_, i) => 'digit ' + (d - i)), rowH: a.map((_, i) => i + 1), cells: a.map(digits), hl: Object.fromEntries(a.flatMap((_, r) => [[r + ',' + (d - 1 - col), 'cmp'], ...(hlRow === r ? [[r + ',' + (d - 1 - col), 'cur']] : [])])) });
      R.add({ tables: [{ title: 'Input', colH: Array.from({ length: d }, (_, i) => 'digit ' + (d - i)), rowH: a.map((_, i) => i + 1), cells: a.map(digits) }] }, 2, `Each number has ${d} digit${d > 1 ? 's' : ''} (padding with leading zeros). Pass 1 sorts on the ones digit.`);
      for (let col = 0; col < d; col++) {
        const exp = 10 ** col, B = Array.from({ length: 10 }, () => []);
        for (let r = 0; r < a.length; r++) {
          const dg = Math.floor(a[r] / exp) % 10;
          const ask = { q: `Pass ${col + 1}: which bucket does ${a[r]} drop into?`, pick: 'b:' + dg, hint: `Read digit ${col + 1} from the right.` };
          B[dg].push(a[r]);
          R.add({ tables: [tbl(r, col, `Pass ${col + 1}: sorting on digit ${col + 1}`)], buckets: { title: 'Buckets by digit (a stable counting sort)', slots: B.map((b, i) => ({ label: i, items: [...b], hl: i === dg ? { [b.length - 1]: 'cur' } : {} })) } }, 3, `${a[r]} has digit ${dg}, so it goes to the back of bucket ${dg}.`, r < 3 || Math.random() < .4 ? ask : null);
        }
        a = B.flat();
        R.add({ tables: [{ title: `After pass ${col + 1}`, colH: Array.from({ length: d }, (_, i) => 'digit ' + (d - i)), rowH: a.map((_, i) => i + 1), cells: a.map(digits), hl: Object.fromEntries(a.flatMap((_, r) => Array.from({ length: col + 1 }, (_, c) => [r + ',' + (d - 1 - c), 'done']))) }] }, 3, `Collect the buckets in order. The list is now sorted by its last ${col + 1} digit${col ? 's' : ''}: ${a.join(', ')}.`);
      }
      R.add({ arrays: [{ a: [...a], hl: rangeHl(0, a.length - 1, 'done'), base: 1 }] }, 2, 'Sorted.');
      return R.f;
    },
  },
  quiz: [
    { q: 'Why must the per-digit sort in radix sort be stable?', opts: ['To run in linear time', 'So later passes do not undo the order established by earlier passes', 'To handle duplicates', 'It does not need to be'], a: 1, why: 'Numbers that tie on the current digit must stay ordered by the lower digits already processed.' },
    { q: 'Radix sort on n numbers with d digits in base k runs in…', opts: ['Θ(n lg n)', 'Θ(d(n + k))', 'Θ(n^d)', 'Θ(dk)'], a: 1, why: 'd passes of counting sort, each Θ(n + k).' },
    { q: 'LSD radix sort processes digits…', opts: ['from most significant to least', 'from least significant to most', 'in random order', 'only the leading digit'], a: 1, why: 'Least significant first lets every pass be one flat stable sort.' },
  ],
});

/* ---------------- bucket sort ---------------- */
topic({
  id: 'bucket-sort', title: 'Bucket sort', sec: '§8.4', prereq: ['counting-sort', 'insertion-sort'],
  blurb: 'Spread uniformly distributed values into n buckets, sort each small bucket, then concatenate.',
  cx: [['Expected', 'Θ(n)'], ['Worst', 'Θ(n²)'], ['Space', 'Θ(n)']],
  props: ['Stable with insertion sort', 'Assumes uniform input'],
  tags: 'bucket sort uniform distribution',
  learn: `
<p>Bucket sort assumes the input is drawn uniformly from [0, 1). Split that interval into <i>n</i> equal buckets. Value <i>A[i]</i> goes into bucket ⌊<i>n</i> · <i>A[i]</i>⌋. Sort each bucket with insertion sort, then read the buckets in order.</p>
<p>If the input really is uniform, each bucket gets about one element on average, so the insertion sorts are cheap. The book proves the expected total cost is Θ(<i>n</i>): if <i>n<sub>i</sub></i> is the size of bucket <i>i</i>, then E[<i>n<sub>i</sub></i>²] = 2 − 1/<i>n</i>, so the expected sum of the quadratic bucket sorts is linear.</p>
<div class="note warn">If the input is not uniform, many values can land in one bucket and the cost degrades to the insertion sort worst case, Θ(<i>n</i>²). Bucket sort trades a guarantee for an assumption about the data.</div>
<h3>Worked example</h3>
<p>Figure 8.4 sorts ten values: .78, .17, .39, .26, .72, .94, .21, .12, .23, .68. With ten buckets, .17 and .12 share bucket 1, .26, .21 and .23 share bucket 2, and so on.</p>
<h3>In interviews</h3>
<ul><li><b>Bucket by frequency</b> is the linear-time answer to Top K Frequent Elements (LC 347) and Sort Characters by Frequency (LC 451).</li><li>Maximum Gap (LC 164) uses the pigeonhole principle with buckets.</li><li>Contains Duplicate III (LC 220) buckets by value range.</li></ul>`,
  code: {
    pseudo: `bucketSort(A)
  n ← len(A)
  allocate B[0..n - 1]
  for i ← 0 to n - 1
      B[i] ← empty list
  for i ← 1 to n
      append A[i] to B[⌊n · A[i]⌋]
  for i ← 0 to n - 1
      insertionSort(B[i])
  return B[0] + B[1] + ... + B[n - 1]`,
    py: `def bucket_sort(a):
    n = len(a)
    buckets = [[] for _ in range(n)]
    for v in a:                         # values in [0, 1)
        buckets[int(n * v)].append(v)
    out = []
    for b in buckets:
        out.extend(sorted(b))           # each bucket is tiny on average
    return out

print(bucket_sort([.78, .17, .39, .26, .72, .94, .21, .12, .23, .68]))`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

vector<double> bucketSort(const vector<double>& a) {   // values in [0, 1)
    int n = a.size();
    vector<vector<double>> b(n);
    for (double v : a) b[(int)(n * v)].push_back(v);
    vector<double> out;
    for (auto& bucket : b) {
        sort(bucket.begin(), bucket.end());
        out.insert(out.end(), bucket.begin(), bucket.end());
    }
    return out;
}`,
  },
  viz: {
    inputHint: 'Decimals in [0, 1), for example .78 .17 .39',
    presets: [{ label: 'Figure 8.4', input: '.78 .17 .39 .26 .72 .94 .21 .12 .23 .68', note: 'The book’s ten values in ten buckets.' }, { label: 'Skewed input', input: '.11 .12 .13 .14 .15 .16 .9', note: 'Not uniform: one bucket gets almost everything.' }],
    random: () => Array.from({ length: rnd(7, 10) }, () => (rnd(1, 99) / 100).toFixed(2).slice(1)).join(' '),
    parse: s => parseNums(s, { min: 2, max: 12, int: false, lo: 0, hi: 0.9999 }),
    run(a) {
      const R = Rec(); const n = a.length; const B = Array.from({ length: n }, () => []);
      const bk = (hl = {}) => ({ title: `${n} buckets, each covering an interval of width 1/${n}`, slots: B.map((b, i) => ({ label: `${i}`, items: [...b], hl: hl[i] || {} })) });
      R.add({ arrays: [{ a: [...a], base: 1, small: true }], buckets: bk() }, 4, `n = ${n}, so make ${n} empty buckets.`);
      a.forEach((v, i) => {
        const k = Math.floor(n * v); B[k].push(v);
        R.add({ arrays: [{ a: [...a], base: 1, small: true, hl: { [i]: 'cur', ...rangeHl(0, i - 1, 'done') } }], buckets: bk({ [k]: { [B[k].length - 1]: 'cur' } }) }, 7, `${fmtV(v)} goes to bucket ⌊${n} × ${fmtV(v)}⌋ = ${k}.`, { q: `Which bucket does ${fmtV(v)} go into?`, pick: 'b:' + k, hint: `Compute ⌊${n} × ${fmtV(v)}⌋.` });
      });
      B.forEach((b, i) => { if (b.length > 1) { b.sort((x, y) => x - y); R.add({ buckets: bk({ [i]: rangeHl(0, b.length - 1, 'cmp') }) }, 9, `Insertion sort bucket ${i}: ${b.map(fmtV).join(', ')}.`); } });
      const out = B.flat();
      R.add({ buckets: bk(), arrays: [{ a: out, base: 1, small: true, hl: rangeHl(0, n - 1, 'done') }] }, 10, 'Concatenate the buckets in order: sorted.');
      return R.f;
    },
  },
  quiz: [
    { q: 'Bucket sort runs in expected linear time when…', opts: ['the input is uniformly distributed', 'the input is sorted', 'all keys are integers', 'n is a power of two'], a: 0, why: 'Uniform input makes each bucket small, so the per-bucket sorts are cheap on average.' },
    { q: 'What is bucket sort’s worst case with insertion sort per bucket?', opts: ['Θ(n)', 'Θ(n lg n)', 'Θ(n²)'], a: 2, why: 'If every value lands in one bucket, you are doing insertion sort on everything.' },
    { q: 'In Top K Frequent Elements, what are the buckets indexed by?', opts: ['The element value', 'The frequency count', 'The array index', 'The hash'], a: 1, why: 'Frequencies range from 1 to n, so an array of n+1 buckets indexed by frequency gives linear time.' },
  ],
});

/* ---------------- binary search ---------------- */
topic({
  id: 'binary-search', title: 'Binary search', sec: 'Exercise 2.3-5', prereq: ['insertion-sort'],
  blurb: 'Halve a sorted search range on every comparison until the target is found or the range is empty.',
  cx: [['Time', 'Θ(lg n)'], ['Space', 'Θ(1) iterative'], ['Recurrence', 'T(n) = T(n/2) + Θ(1)']],
  props: ['Needs sorted input', 'Decrease and conquer'],
  tags: 'binary search lower bound bisect',
  learn: `
<p>Binary search finds a value <i>v</i> in a sorted array by checking the middle element. If the middle is too small, everything to its left is too small as well, so discard that half. If it is too large, discard the right half. Each comparison halves the range, so at most ⌊lg <i>n</i>⌋ + 1 comparisons are needed.</p>
<div class="note key"><b>Invariant.</b> If <i>v</i> is in the array at all, it is in <i>A[low..high]</i>. The loop ends either when <i>A[mid]</i> = <i>v</i> or when <i>low</i> &gt; <i>high</i>, which means the range is empty and <i>v</i> is absent.</div>
<p>The recurrence <i>T(n)</i> = <i>T(n/2)</i> + Θ(1) solves to Θ(lg <i>n</i>) (master theorem, case 2 with <i>a</i> = 1, <i>b</i> = 2).</p>
<h3>Getting the details right</h3>
<ul><li><b>Overflow.</b> In languages with fixed-width integers, compute <code>mid = low + (high - low) / 2</code>. The naive <code>(low + high) / 2</code> overflowed in Java's own library for years.</li><li><b>Off by one.</b> Decide whether <i>high</i> is inclusive or exclusive and stay consistent. The book's style is inclusive on both ends with <code>while low ≤ high</code>.</li><li><b>Lower bound.</b> Often you want the first index whose value is ≥ <i>v</i>, not any index equal to <i>v</i>. Keep searching left when you find a match. Python's <code>bisect_left</code> and C++'s <code>lower_bound</code> do this.</li></ul>
<h3>Binary search on the answer</h3>
<p>The most important interview idea: binary search works on any <b>monotone predicate</b>, not just arrays. If “can we finish with capacity <i>c</i>?” is false for small <i>c</i> and true for large <i>c</i>, binary search the smallest <i>c</i> that works. This solves Koko Eating Bananas (LC 875), Capacity to Ship Packages (LC 1011) and Split Array Largest Sum (LC 410). Searching a rotated array (LC 33) and finding a peak (LC 162) are other variants.</p>`,
  code: {
    pseudo: `binarySearch(A, v)
  low ← 1
  high ← len(A)
  while low ≤ high
      mid ← ⌊(low + high) / 2⌋
      if A[mid] = v
          return mid
      else if A[mid] < v
          low ← mid + 1
      else high ← mid - 1
  return nil`,
    py: `def binary_search(a, v):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == v:
            return mid
        if a[mid] < v:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

def lower_bound(a, v):           # first index with a[i] >= v
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < v:
            lo = mid + 1
        else:
            hi = mid
    return lo`,
    cpp: `#include <vector>
using namespace std;

int binarySearch(const vector<int>& a, int v) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;   // avoids overflow
        if (a[mid] == v) return mid;
        if (a[mid] < v) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}

int lowerBound(const vector<int>& a, int v) {  // same as std::lower_bound
    int lo = 0, hi = a.size();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < v) lo = mid + 1; else hi = mid;
    }
    return lo;
}`,
  },
  viz: {
    inputHint: 'Sorted numbers, then a slash and the target: 2 5 8 12 / 8',
    presets: [
      { label: 'Find 23', input: '2 5 8 12 16 23 38 56 72 91 / 23', note: 'Found on the third probe.' },
      { label: 'Missing value', input: '1 3 5 7 9 11 13 15 / 10', note: 'The range shrinks to nothing. low ends at the insertion point.' },
      { label: 'Large array', input: '1 4 6 9 13 17 20 24 29 33 38 41 45 50 57 63 / 50', note: 'Sixteen elements, at most five probes.' },
    ],
    random: () => { const a = [...new Set(randArr(rnd(9, 14), 1, 99))].sort((x, y) => x - y); return a.join(' ') + ' / ' + (Math.random() < .75 ? pick(a) : rnd(1, 99)); },
    parse: s => { const [l, t] = s.split('/'); if (t == null) throw new Error('Add a slash and the target value, for example "1 3 5 / 3".'); const a = parseNums(l, { min: 1, max: 20, lo: -999, hi: 999 }); for (let i = 1; i < a.length; i++) if (a[i] < a[i - 1]) throw new Error('The numbers must be sorted in ascending order.'); return { a, v: parseNums(t, { min: 1, max: 1, lo: -999, hi: 999 })[0] }; },
    run({ a, v }) {
      const R = Rec(); const n = a.length; let lo = 0, hi = n - 1, probes = 0;
      const S = (hl, ptr) => ({ vars: { target: v, probes }, arrays: [{ a, hl, ptr, base: 1 }] });
      const out = (l, h) => { const o = {}; for (let k = 0; k < n; k++) if (k < l || k > h) o[k] = 'dim'; return o; };
      R.add(S({}, { low: lo, high: hi }), 4, `Search for ${v}. The whole array A[1..${n}] is the candidate range.`);
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2); probes++;
        R.add(S({ ...out(lo, hi), [mid]: 'cmp' }, { low: lo, mid, high: hi }), 5, `mid = ⌊(${lo + 1} + ${hi + 1}) / 2⌋ = ${mid + 1}. A[mid] = ${a[mid]}.`, { q: `low = ${lo + 1}, high = ${hi + 1}. Click A[mid].`, pick: 'a:' + mid, hint: 'Average the two ends and round down (positions are 1-based).' });
        if (a[mid] === v) { R.add(S({ ...out(lo, hi), [mid]: 'found' }, { mid }), 7, `A[${mid + 1}] = ${v}. Found after ${probes} probe${probes > 1 ? 's' : ''}.`); return R.f; }
        const goRight = a[mid] < v;
        const ask = { q: `A[mid] = ${a[mid]} and the target is ${v}. Which half survives?`, choices: ['Left half', 'Right half'], answer: goRight ? 1 : 0 };
        if (goRight) lo = mid + 1; else hi = mid - 1;
        R.add(S(out(lo, hi), { low: lo, high: hi }), goRight ? 9 : 10, goRight ? `${a[mid]} < ${v}: discard the left half. low = ${lo + 1}.` : `${a[mid]} > ${v}: discard the right half. high = ${hi + 1}.`, ask);
      }
      R.add(S(out(lo, hi), { low: lo }), 11, `low > high: the range is empty, so ${v} is not present. It would be inserted at position ${lo + 1}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'How many probes does binary search need in the worst case on 1,000,000 sorted elements?', opts: ['About 10', 'About 20', 'About 1,000', 'About 500,000'], a: 1, why: '⌊lg 10⁶⌋ + 1 = 20.' },
    { q: 'Why write mid = low + (high − low) / 2?', opts: ['It is faster', 'It avoids integer overflow when low + high exceeds the int range', 'It rounds up', 'It handles duplicates'], a: 1, why: 'low + high can overflow a 32-bit int for large arrays.' },
    { q: 'You need the smallest ship capacity that delivers all packages within D days. The best approach is…', opts: ['Greedy by heaviest package', 'Binary search on the capacity with a feasibility check', 'Dynamic programming over days', 'Sort the packages'], a: 1, why: 'Feasibility is monotone in capacity, so binary search the answer. That is LC 1011.' },
    { q: 'When the target is absent, where does low end up?', opts: ['At 0', 'At the index where the target would be inserted', 'At n', 'Undefined'], a: 1, why: 'All elements before low are smaller than the target, and all from low on are larger.' },
  ],
});

/* ---------------- selection / quickselect ---------------- */
topic({
  id: 'selection', title: 'Order statistics and quickselect', sec: '§9.1–9.3', prereq: ['quicksort'],
  blurb: 'Find the i-th smallest element in linear time by partitioning and recursing into only one side.',
  cx: [['Expected', 'Θ(n)'], ['Worst (randomized)', 'Θ(n²)'], ['Worst (median of medians)', 'Θ(n)']],
  props: ['In place', 'Decrease and conquer'],
  tags: 'quickselect kth smallest largest median order statistic',
  learn: `
<p>The <i>i</i>-th <b>order statistic</b> of a set is its <i>i</i>-th smallest element. The minimum is the 1st, the maximum the <i>n</i>-th, and the median is in the middle. Sorting finds any order statistic in Θ(<i>n</i> lg <i>n</i>), but we can do better.</p>
<h3>Minimum and maximum</h3>
<p>Finding the minimum takes exactly <i>n</i> − 1 comparisons, and that is optimal: every element except the winner must lose at least once. Finding both the minimum and maximum together takes only about 3⌊<i>n</i>/2⌋ comparisons: process elements in pairs, compare the pair to each other, then compare the smaller with the current min and the larger with the current max.</p>
<h3>Randomized select (quickselect)</h3>
<p>Partition the array around a pivot exactly as in quicksort. The pivot lands at position <i>q</i>, and the low side has <i>k</i> = <i>q</i> − <i>p</i> + 1 elements including the pivot.</p>
<ul><li>If <i>i</i> = <i>k</i>, the pivot is the answer.</li><li>If <i>i</i> &lt; <i>k</i>, the answer is the <i>i</i>-th smallest of the low side. Recurse there only.</li><li>If <i>i</i> &gt; <i>k</i>, the answer is the (<i>i</i> − <i>k</i>)-th smallest of the high side.</li></ul>
<p>Recursing into one side instead of two changes everything: the expected cost is <i>n</i> + <i>n</i>/2 + <i>n</i>/4 + … = Θ(<i>n</i>) with random pivots. The worst case is still quadratic if pivots are always extreme.</p>
<h3>Worst-case linear time</h3>
<p>The book's <code>select</code> guarantees a good pivot with the <b>median of medians</b>. Split the elements into groups of 5, find each group's median by insertion sort, recursively find the median of those medians, and partition around it. At least 3<i>n</i>/10 − 6 elements fall on each side, so the recurrence <i>T(n)</i> ≤ <i>T(n/5)</i> + <i>T(7n/10 + 6)</i> + O(<i>n</i>) solves to O(<i>n</i>) because 1/5 + 7/10 &lt; 1. It is mostly of theoretical interest because the constant is large.</p>
<div class="note">The visualizer uses the last element as the pivot so runs are repeatable. The book's version picks it at random.</div>
<h3>In interviews</h3>
<ul><li>Kth Largest Element in an Array (LC 215): quickselect in expected O(<i>n</i>), or a min-heap of size <i>k</i> in O(<i>n</i> log <i>k</i>).</li><li>K Closest Points to Origin (LC 973) and Top K Frequent (LC 347) also accept quickselect.</li><li>Kth largest is the (<i>n</i> − <i>k</i> + 1)-th smallest. Off-by-one errors here are common.</li></ul>`,
  code: {
    pseudo: `randomizedSelect(A, p, r, i)
  if p = r
      return A[p]
  q ← randomizedPartition(A, p, r)
  k ← q - p + 1
  if i = k          // the pivot value is the answer
      return A[q]
  else if i < k
      return randomizedSelect(A, p, q - 1, i)
  else return randomizedSelect(A, q + 1, r, i - k)`,
    py: `import random

def quickselect(a, i):
    """Return the i-th smallest element (1-based)."""
    p, r = 0, len(a) - 1
    while True:
        if p == r:
            return a[p]
        k_ = random.randint(p, r)
        a[k_], a[r] = a[r], a[k_]
        x, s = a[r], p - 1
        for j in range(p, r):
            if a[j] <= x:
                s += 1
                a[s], a[j] = a[j], a[s]
        a[s + 1], a[r] = a[r], a[s + 1]
        q = s + 1
        k = q - p + 1
        if i == k:
            return a[q]
        if i < k:
            r = q - 1
        else:
            p, i = q + 1, i - k

def kth_largest(nums, k):
    return quickselect(nums[:], len(nums) - k + 1)`,
    cpp: `#include <vector>
#include <cstdlib>
#include <utility>
using namespace std;

int quickselect(vector<int> a, int i) {   // i-th smallest, 1-based
    int p = 0, r = a.size() - 1;
    while (true) {
        if (p == r) return a[p];
        swap(a[p + rand() % (r - p + 1)], a[r]);
        int x = a[r], s = p - 1;
        for (int j = p; j < r; j++) if (a[j] <= x) swap(a[++s], a[j]);
        swap(a[s + 1], a[r]);
        int q = s + 1, k = q - p + 1;
        if (i == k) return a[q];
        if (i < k) r = q - 1; else { p = q + 1; i -= k; }
    }
}`,
  },
  viz: {
    inputHint: 'Numbers, then a slash and i: 3 2 1 5 6 4 / 2',
    presets: [
      { label: 'Median of 9 values', input: '13 19 9 5 12 8 7 4 21 / 5', note: 'The 5th smallest of nine values is the median.' },
      { label: 'Second smallest', input: '3 2 1 5 6 4 / 2', note: 'Only part of the array is ever examined after the first partition.' },
    ],
    random: () => { const a = randArr(rnd(7, 10), 1, 60); return a.join(' ') + ' / ' + rnd(1, a.length); },
    parse: s => { const [l, t] = s.split('/'); if (t == null) throw new Error('Add a slash and i, for example "5 1 4 / 2".'); const a = parseNums(l, { min: 1, max: 14, lo: -99, hi: 99 }); const i = parseNums(t, { min: 1, max: 1, lo: 1, hi: a.length })[0]; return { a, i }; },
    run({ a, i }) {
      const R = Rec(); a = [...a]; const ids = a.map((_, k) => k), n = a.length; let p = 0, r = n - 1, want = i;
      const S = (hl, ptr, vars) => ({ vars, arrays: [{ a: [...a], ids: [...ids], hl, ptr, base: 1, bars: true }] });
      const out = (l, h) => { const o = {}; for (let k = 0; k < n; k++) if (k < l || k > h) o[k] = 'dim'; return o; };
      R.add(S({}, { p, r }, { i }), 1, `Find the ${i}-th smallest of ${n} elements.`);
      for (;;) {
        if (p === r) { R.add(S({ ...out(p, r), [p]: 'found' }, { p }), 3, `Only one candidate left: ${a[p]} is the answer.`); break; }
        const x = a[r]; let s = p - 1;
        for (let j = p; j < r; j++) if (a[j] <= x) { s++;[a[s], a[j]] = [a[j], a[s]];[ids[s], ids[j]] = [ids[j], ids[s]]; }
        [a[s + 1], a[r]] = [a[r], a[s + 1]];[ids[s + 1], ids[r]] = [ids[r], ids[s + 1]];
        const q = s + 1, k = q - p + 1;
        R.add(S({ ...out(p, r), ...rangeHl(p, q - 1, 'lo'), ...rangeHl(q + 1, r, 'hi'), [q]: 'piv' }, { p, q, r }, { i: want, k }), 5, `Partition A[${p + 1}..${r + 1}] around ${x}. The pivot lands at position ${q + 1}, so it is the ${k}-th smallest of this range.`);
        const ans = want === k ? 1 : want < k ? 0 : 2;
        const ask = { q: `We want the ${want}-th smallest of this range and the pivot is the ${k}-th. Where is the answer?`, choices: ['Left side', 'The pivot itself', 'Right side'], answer: ans };
        if (ans === 1) { R.add(S({ ...out(p, r), [q]: 'found' }, { q }, { i: want, k }), 7, `i = k = ${k}: the pivot ${a[q]} is the answer.`, ask); break; }
        if (ans === 0) { r = q - 1; R.add(S(out(p, r), { p, r }, { i: want }), 9, `${want} < ${k}: recurse into the left side only.`, ask); }
        else { p = q + 1; want -= k; R.add(S(out(p, r), { p, r }, { i: want }), 10, `${want + k} > ${k}: recurse into the right side, now looking for the ${want}-th smallest there.`, ask); }
      }
      return R.f;
    },
  },
  quiz: [
    { q: 'Why is quickselect expected linear while quicksort is n lg n?', opts: ['It uses a better pivot', 'It recurses into only one side of each partition', 'It skips the partition step', 'It sorts in place'], a: 1, why: 'The work shrinks geometrically: n + n/2 + n/4 + … = O(n) in expectation.' },
    { q: 'The median-of-medians algorithm uses groups of size…', opts: ['3', '5', '7', '√n'], a: 1, why: 'With groups of 5, the two recursive calls have sizes n/5 and about 7n/10, which sum to less than n.' },
    { q: 'To find the k-th largest of n elements with an order-statistic routine, ask for the…', opts: ['k-th smallest', '(n − k + 1)-th smallest', '(n − k)-th smallest', '(k + 1)-th smallest'], a: 1, why: 'The largest is the n-th smallest, the second largest is the (n−1)-th, and so on.' },
    { q: 'How many comparisons suffice to find both the minimum and maximum of n elements?', opts: ['2n − 2', 'About 3n/2', 'n lg n', 'n − 1'], a: 1, why: 'Compare elements in pairs first: 3 comparisons per 2 elements.' },
  ],
});
