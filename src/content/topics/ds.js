import { Rec, h, parseNums, pick, randArr, rnd, uniqArr } from '../../engine/helpers';
import { setPart, topic } from '../registry';
import { rangeHl } from './sorting';

setPart('ds');
export function parseOps(str, verbs) {
  return String(str).split(/[,;\n]+/).map(s => s.trim()).filter(Boolean).map(s => {
    const [v, ...args] = s.split(/\s+/); const verb = v.toLowerCase();
    if (!verbs.includes(verb)) throw new Error(`Unknown operation "${v}". Use ${verbs.join(', ')}.`);
    const nums = args.map(Number); if (nums.some(x => !Number.isFinite(x))) throw new Error(`"${s}" needs number arguments.`);
    return [verb, ...nums];
  });
}

/* ---------------- arrays ---------------- */
topic({
  id: 'arrays', title: 'Arrays and prefix sums', sec: '§10.3, §17.4', prereq: ['amortized'],
  blurb: 'Contiguous memory with constant-time indexing, linear-time insertion, and the prefix-sum trick.',
  cx: [['Index', 'O(1)'], ['Insert or delete in middle', 'O(n)'], ['Append (dynamic)', 'O(1) amortized'], ['Range sum with prefix array', 'O(1)']],
  props: ['Random access', 'Cache friendly'],
  tags: 'array dynamic array prefix sum vector list contiguous',
  learn: `
<p>An array stores elements of the same size in one contiguous block of memory. The address of <i>A[i]</i> is <code>base + i × size</code>, so any element can be read or written in constant time. That single fact, <b>random access</b>, is why so many algorithms in the book assume arrays.</p>
<h3>What is cheap and what is not</h3>
<ul><li><b>Read or write <i>A[i]</i></b>: O(1).</li><li><b>Append</b> to a dynamic array: O(1) amortized, because the capacity doubles when full (see <a href="/learn/amortized">Amortized analysis</a>).</li><li><b>Insert or delete at position <i>i</i></b>: O(<i>n</i> − <i>i</i>), because every later element shifts by one. Inserting at the front of a Python list is O(<i>n</i>); use <code>collections.deque</code> instead.</li><li><b>Search an unsorted array</b>: O(<i>n</i>). Sorted: O(log <i>n</i>) with binary search.</li></ul>
<p>Arrays are also fast in practice for a reason the RAM model ignores: neighbouring elements share cache lines, so a linear scan is far faster than following pointers through a linked list.</p>
<h3>Multidimensional arrays</h3>
<p>A 2-D array is usually stored in <b>row-major order</b> (C, C++, Python's NumPy default): row 0, then row 1, and so on. Element (<i>i</i>, <i>j</i>) of an <i>m</i> × <i>n</i> array lives at offset <i>i·n</i> + <i>j</i>. Iterating row by row is cache friendly; column by column is not.</p>
<h3>Representing objects without pointers</h3>
<p>Section 10.3 shows how to build linked structures inside arrays: keep parallel arrays <i>key</i>, <i>next</i>, <i>prev</i>, and use indices as pointers, with a <b>free list</b> of unused slots. Competitive programmers still do this for speed, and it explains how memory allocators work.</p>
<h3>Prefix sums</h3>
<p>Many interview problems ask for sums over ranges. Precompute <i>P</i>[0] = 0 and <i>P</i>[<i>i</i> + 1] = <i>P</i>[<i>i</i>] + <i>A</i>[<i>i</i>]. Then the sum of <i>A</i>[<i>l</i>..<i>r</i>] is <i>P</i>[<i>r</i> + 1] − <i>P</i>[<i>l</i>], in constant time after O(<i>n</i>) setup.</p>
<div class="note key"><b>Subarray Sum Equals K</b> (LC 560) combines prefix sums with a hash map: a subarray ending at <i>i</i> sums to <i>k</i> exactly when some earlier prefix equals <i>P</i>[<i>i</i> + 1] − <i>k</i>. Count those earlier prefixes as you scan.</div>
<p>The same idea works in 2-D (LC 304, Range Sum Query 2D), and the reverse operation, a <b>difference array</b>, applies range updates in O(1) each (LC 370, 1094).</p>
<h3>Patterns built on arrays</h3>
<p>Two pointers, sliding window, prefix sums, in-place partitioning and cyclic sort are all array techniques. The <a href="/patterns">Interview patterns</a> section covers each with templates.</p>`,
  code: {
    pseudo: `arrayInsert(A, n, i, x)      // A holds n items, capacity > n
  for j ← n downto i
      A[j + 1] ← A[j]
  A[i] ← x
  return n + 1

arrayDelete(A, n, i)
  for j ← i to n - 1
      A[j] ← A[j + 1]
  return n - 1

prefixSums(A, n)
  allocate P[0..n]
  P[0] ← 0
  for i ← 1 to n
      P[i] ← P[i - 1] + A[i]
  return P`,
    py: `def prefix_sums(a):
    p = [0] * (len(a) + 1)
    for i, x in enumerate(a):
        p[i + 1] = p[i] + x
    return p

def range_sum(p, l, r):          # sum of a[l..r], inclusive
    return p[r + 1] - p[l]

def subarray_sum_equals_k(nums, k):   # LeetCode 560
    from collections import defaultdict
    seen = defaultdict(int)
    seen[0] = 1
    total = count = 0
    for x in nums:
        total += x
        count += seen[total - k]
        seen[total] += 1
    return count`,
    cpp: `#include <vector>
#include <unordered_map>
using namespace std;

vector<long long> prefixSums(const vector<int>& a) {
    vector<long long> p(a.size() + 1, 0);
    for (size_t i = 0; i < a.size(); i++) p[i + 1] = p[i] + a[i];
    return p;
}

int subarraySum(const vector<int>& nums, int k) {   // LeetCode 560
    unordered_map<long long, int> seen{{0, 1}};
    long long total = 0; int count = 0;
    for (int x : nums) {
        total += x;
        auto it = seen.find(total - k);
        if (it != seen.end()) count += it->second;
        seen[total]++;
    }
    return count;
}`,
  },
  viz: {
    inputHint: 'Values | operations, e.g. 10 20 30 | insert 1 99, delete 0, prefix',
    presets: [
      { label: 'Insert and delete', input: '10 20 30 40 50 | insert 1 99, delete 3', note: 'Inserting at position 1 shifts four elements right. Deleting shifts the tail left.' },
      { label: 'Prefix sums', input: '3 1 4 1 5 9 2 6 | prefix', note: 'Build P so any range sum is one subtraction.' },
    ],
    random: () => randArr(rnd(5, 7), 1, 20).join(' ') + ' | ' + pick([`insert ${rnd(0, 3)} ${rnd(50, 99)}, delete ${rnd(0, 3)}`, 'prefix']),
    parse: s => { const [v, o] = s.split('|'); return { a: parseNums(v, { min: 1, max: 14, lo: -99, hi: 999 }), ops: parseOps(o || '', ['insert', 'delete', 'prefix']) }; },
    run({ a, ops }) {
      const R = Rec(); a = [...a];
      const S = (hl, ptr, extra) => ({ arrays: [{ name: 'a', label: 'A (0-indexed here)', a: [...a], hl, ptr }, ...(extra || [])] });
      R.add(S({}, {}), 0, `An array of ${a.length} elements.`);
      for (const [op, x, y] of ops) {
        if (op === 'insert') {
          const i = Math.max(0, Math.min(a.length, x));
          a.push(null);
          R.add(S({ [a.length - 1]: 'cmp' }, {}), 1, `insert ${y} at index ${i}: make room at the end, then shift elements ${i}..${a.length - 2} one slot right.`, { q: `How many elements must shift to insert at index ${i}?`, value: a.length - 1 - i });
          for (let j = a.length - 2; j >= i; j--) { a[j + 1] = a[j]; a[j] = null; R.add(S({ [j + 1]: 'swap' }, { j }), 3, `A[${j + 1}] = A[${j}].`); }
          a[i] = y; R.add(S({ [i]: 'found' }, {}), 4, `Write ${y} into index ${i}. Cost: ${a.length - 1 - i} shifts.`);
        } else if (op === 'delete') {
          const i = Math.max(0, Math.min(a.length - 1, x));
          R.add(S({ [i]: 'cur' }, {}), 7, `delete index ${i} (value ${a[i]}): shift everything after it one slot left.`, { q: `How many elements must shift to delete index ${i}?`, value: a.length - 1 - i });
          for (let j = i; j < a.length - 1; j++) { a[j] = a[j + 1]; R.add(S({ [j]: 'swap' }, { j }), 9, `A[${j}] = A[${j + 1}].`); }
          a.pop(); R.add(S({}, {}), 10, `Length is now ${a.length}.`);
        } else if (op === 'prefix') {
          const P = [0];
          R.add(S({}, {}, [{ name: 'P', label: 'P (prefix sums)', a: [...P], base: 0 }]), 14, 'P[0] = 0.');
          for (let i = 0; i < a.length; i++) {
            P.push(P[i] + a[i]);
            R.add(S({ [i]: 'cur' }, {}, [{ name: 'P', label: 'P (prefix sums)', a: [...P], base: 0, hl: { [i + 1]: 'found', [i]: 'cmp' } }]), 16, `P[${i + 1}] = P[${i}] + A[${i}] = ${P[i]} + ${a[i]} = ${P[i + 1]}.`, i > 0 && Math.random() < .6 ? { q: `P[${i}] = ${P[i]} and A[${i}] = ${a[i]}. What is P[${i + 1}]?`, value: P[i + 1] } : null);
          }
          if (a.length >= 3) { const l = 1, r = a.length - 2; R.add(S(rangeHl(l, r, 'cmp'), {}, [{ name: 'P', label: 'P (prefix sums)', a: [...P], base: 0, hl: { [r + 1]: 'cur', [l]: 'cur' } }]), 17, `Sum of A[${l}..${r}] = P[${r + 1}] − P[${l}] = ${P[r + 1]} − ${P[l]} = ${P[r + 1] - P[l]}.`, { q: `Using P, what is the sum of A[${l}..${r}]?`, value: P[r + 1] - P[l], hint: `P[${r + 1}] − P[${l}]` }); }
        }
      }
      return R.f;
    },
  },
  quiz: [
    { q: 'Inserting at the front of a dynamic array of n elements costs…', opts: ['O(1)', 'O(log n)', 'O(n)', 'O(1) amortized'], a: 2, why: 'Every element shifts right by one.' },
    { q: 'With prefix sums P (P[0] = 0), the sum of A[l..r] is…', opts: ['P[r] − P[l]', 'P[r + 1] − P[l]', 'P[r] − P[l − 1] + A[l]', 'P[r + 1] + P[l]'], a: 1, why: 'P[r+1] is the sum of A[0..r], and P[l] is the sum of A[0..l−1].' },
    { q: 'Why is scanning an array usually faster than scanning a linked list of the same length?', opts: ['Arrays use less memory per element and stay in cache lines', 'Linked lists are O(n²)', 'Arrays are sorted', 'Linked lists cannot be scanned'], a: 0, why: 'Contiguous memory means the hardware prefetches neighbouring elements.' },
    { q: 'In a row-major m × n array, element (i, j) is at offset…', opts: ['i·m + j', 'i·n + j', 'j·m + i', 'i + j'], a: 1, why: 'Each row has n elements, so skip i full rows, then j more.' },
  ],
});

/* ---------------- stacks and queues ---------------- */
topic({
  id: 'stacks-queues', title: 'Stacks and queues', sec: '§10.1', prereq: ['arrays'],
  blurb: 'Last in, first out and first in, first out: two restricted lists that power recursion, BFS and parsing.',
  cx: [['Push, pop', 'O(1)'], ['Enqueue, dequeue', 'O(1)'], ['Peek', 'O(1)']],
  props: ['LIFO', 'FIFO', 'Circular buffer'],
  tags: 'stack queue deque lifo fifo circular buffer monotonic',
  learn: `
<p>A <b>stack</b> removes the item inserted most recently: last in, first out (LIFO). A <b>queue</b> removes the item that has waited longest: first in, first out (FIFO). Both restrict a list to make every operation O(1), and both appear everywhere.</p>
<h3>Stack in an array</h3>
<p>The book stores a stack in <i>S</i>[1..<i>n</i>] with an attribute <i>S.top</i> indexing the most recent element. <code>push</code> increments <i>top</i> and writes; <code>pop</code> reads and decrements. Popping an empty stack is an <b>underflow</b>, pushing onto a full one an <b>overflow</b>.</p>
<h3>Queue in a circular array</h3>
<p>A queue needs two ends. The book keeps <i>Q.head</i> (the next element to leave) and <i>Q.tail</i> (the next free slot), and lets both indices <b>wrap around</b> from <i>n</i> back to 1. That way the queue can slide around the array indefinitely without shifting elements. The queue is empty when <i>head</i> = <i>tail</i> and full when <i>head</i> = <i>tail</i> + 1 (mod <i>n</i>), so one slot always stays unused to tell the two apart.</p>
<h3>Where they show up</h3>
<ul><li><b>Stacks</b>: function calls and recursion (the call stack), depth-first search, undo, expression evaluation, matching brackets (LC 20), and the <b>monotonic stack</b> pattern for next-greater-element problems (LC 739, 84, 496).</li><li><b>Queues</b>: breadth-first search, scheduling, buffering, the sliding-window maximum with a <b>deque</b> (LC 239).</li></ul>
<div class="note">Python: use a list as a stack (<code>append</code>, <code>pop</code>) and <code>collections.deque</code> as a queue. <code>list.pop(0)</code> is O(<i>n</i>). C++: <code>std::stack</code>, <code>std::queue</code>, <code>std::deque</code>.</div>
<h3>Classic exercises</h3>
<ul><li>Implement a queue with two stacks (Exercise 10.1-6, LC 232): push onto an <i>in</i> stack; to dequeue, if the <i>out</i> stack is empty, pour <i>in</i> into <i>out</i>. Each element moves once, so operations are O(1) amortized.</li><li>Implement a stack with queues (Exercise 10.1-7, LC 225).</li><li>Min Stack (LC 155): keep a second stack of running minimums.</li></ul>`,
  code: {
    pseudo: `push(S, x)
  S.top ← S.top + 1
  S[S.top] ← x

pop(S)
  if S.top = 0
      error "underflow"
  else S.top ← S.top - 1
      return S[S.top + 1]

enqueue(Q, x)
  Q[Q.tail] ← x
  if Q.tail = len(Q)
      Q.tail ← 1
  else Q.tail ← Q.tail + 1

dequeue(Q)
  x ← Q[Q.head]
  if Q.head = len(Q)
      Q.head ← 1
  else Q.head ← Q.head + 1
  return x`,
    py: `from collections import deque

stack = []
stack.append(4); stack.append(1)
print(stack.pop())        # 1  (last in, first out)

queue = deque()
queue.append(4); queue.append(1)
print(queue.popleft())    # 4  (first in, first out)

class CircularQueue:
    def __init__(self, k):
        self.q = [None] * (k + 1)   # one slot stays empty
        self.head = self.tail = 0
    def enqueue(self, x):
        if (self.tail + 1) % len(self.q) == self.head:
            raise OverflowError
        self.q[self.tail] = x
        self.tail = (self.tail + 1) % len(self.q)
    def dequeue(self):
        if self.head == self.tail:
            raise IndexError("underflow")
        x = self.q[self.head]
        self.head = (self.head + 1) % len(self.q)
        return x`,
    cpp: `#include <stack>
#include <queue>
#include <vector>
#include <stdexcept>
using namespace std;

struct CircularQueue {
    vector<int> q; int head = 0, tail = 0;
    CircularQueue(int k) : q(k + 1) {}
    bool empty() const { return head == tail; }
    bool full() const { return (tail + 1) % (int)q.size() == head; }
    void enqueue(int x) {
        if (full()) throw overflow_error("full");
        q[tail] = x; tail = (tail + 1) % q.size();
    }
    int dequeue() {
        if (empty()) throw underflow_error("empty");
        int x = q[head]; head = (head + 1) % q.size();
        return x;
    }
};
// std::stack<int> s; s.push(4); s.top(); s.pop();
// std::queue<int> q; q.push(4); q.front(); q.pop();`,
  },
  viz: {
    inputHint: 'stack: push 4, push 1, pop   or   queue: enqueue 15, dequeue',
    presets: [
      { label: 'Stack', input: 'stack: push 15, push 6, push 2, push 9, push 17, pop, push 3, pop, pop', note: 'Figure 10.1 style: top moves up and down.' },
      { label: 'Circular queue', input: 'queue: enqueue 15, enqueue 6, enqueue 9, enqueue 8, enqueue 4, dequeue, dequeue, enqueue 17, enqueue 3, enqueue 5, dequeue', note: 'With 8 slots, the tail wraps around to the start.' },
    ],
    random: () => { const st = Math.random() < .5; const ops = []; let sz = 0; for (let i = 0; i < 9; i++) { if (sz > 0 && Math.random() < .4) { ops.push(st ? 'pop' : 'dequeue'); sz--; } else if (sz < 6) { ops.push((st ? 'push ' : 'enqueue ') + rnd(1, 30)); sz++; } } return (st ? 'stack: ' : 'queue: ') + ops.join(', '); },
    parse: s => { const m = /^\s*(stack|queue)\s*:(.*)$/i.exec(s); if (!m) throw new Error('Start with "stack:" or "queue:".'); const kind = m[1].toLowerCase(); return { kind, ops: parseOps(m[2], kind === 'stack' ? ['push', 'pop'] : ['enqueue', 'dequeue']) }; },
    run({ kind, ops }) {
      const R = Rec();
      if (kind === 'stack') {
        const S = Array(8).fill(null); let top = 0;
        const st = (hl) => ({ vars: { 'S.top': top }, arrays: [{ name: 'S', label: 'S[1..8]', a: [...S], hl, ptr: top ? { top: top - 1 } : {}, base: 1 }] });
        R.add(st({}), 1, 'Empty stack: S.top = 0.');
        for (const [op, x] of ops) {
          if (op === 'push') { if (top === 8) { R.add(st({}), 1, 'Overflow: the stack is full.'); continue; } top++; S[top - 1] = x; R.add(st({ [top - 1]: 'found' }), 3, `PUSH ${x}: S.top = ${top}, S[${top}] = ${x}.`); }
          else { if (!top) { R.add(st({}), 7, 'Underflow: the stack is empty.'); continue; } const v = S[top - 1]; R.add(st({ [top - 1]: 'cur' }), 9, `POP returns ${v}, the most recently pushed element.`, { q: 'POP is next. Click the element it returns.', pick: 'S:' + (top - 1) }); S[top - 1] = null; top--; R.add(st({}), 9, `S.top = ${top}.`); }
        }
      } else {
        const n = 8, Q = Array(n).fill(null); let head = 0, tail = 0, cnt = 0;
        const st = (hl) => ({ vars: { 'Q.head': head + 1, 'Q.tail': tail + 1, size: cnt }, arrays: [{ name: 'Q', label: 'Q[1..8], circular', a: [...Q], hl: { ...hl }, ptr: head === tail ? { 'head tail': head } : { head, tail }, base: 1 }] });
        R.add(st({}), 12, 'Empty queue: head = tail.');
        for (const [op, x] of ops) {
          if (op === 'enqueue') { if ((tail + 1) % n === head) { R.add(st({}), 12, 'Overflow: head = tail + 1, the queue is full.'); continue; } Q[tail] = x; const t0 = tail; tail = (tail + 1) % n; cnt++; R.add(st({ [t0]: 'found' }), t0 === n - 1 ? 15 : 17, `ENQUEUE ${x} at Q[${t0 + 1}]. ${t0 === n - 1 ? 'Tail wraps around to 1.' : 'Tail advances.'}`, t0 === n - 1 || Math.random() < .3 ? { q: `ENQUEUE ${x}: which slot does it go into?`, pick: 'Q:' + t0, hint: 'The tail points at the next free slot.' } : null); }
          else { if (head === tail) { R.add(st({}), 20, 'Underflow: the queue is empty.'); continue; } const v = Q[head]; R.add(st({ [head]: 'cur' }), 20, `DEQUEUE returns ${v}, the element that has waited longest.`, { q: 'DEQUEUE is next. Click the element it returns.', pick: 'Q:' + head }); Q[head] = null; head = (head + 1) % n; cnt--; R.add(st({}), 23, `Head advances to ${head + 1}.`); }
        }
      }
      return R.f;
    },
  },
  quiz: [
    { q: 'Which structure does breadth-first search use?', opts: ['Stack', 'Queue', 'Priority queue', 'Hash table'], a: 1, why: 'BFS explores vertices in the order they were discovered: first in, first out.' },
    { q: 'In the book’s circular queue of length n, when is the queue full?', opts: ['head = tail', 'head = tail + 1 (mod n)', 'tail = n', 'head = 1'], a: 1, why: 'One slot is kept empty so full and empty can be told apart.' },
    { q: 'A queue built from two stacks has dequeue cost…', opts: ['O(1) worst case', 'O(1) amortized', 'O(n) amortized', 'O(log n)'], a: 1, why: 'Each element is pushed and popped at most twice in total.' },
    { q: 'Valid Parentheses (LC 20) is solved with…', opts: ['a queue', 'a stack', 'sorting', 'binary search'], a: 1, why: 'Each closing bracket must match the most recent unmatched opening bracket.' },
    { q: 'Why is list.pop(0) a bad queue operation in Python?', opts: ['It is O(n)', 'It raises an error', 'It is not thread safe', 'It returns the last item'], a: 0, why: 'It shifts every remaining element. Use deque.popleft().' },
  ],
});

/* ---------------- linked lists ---------------- */
topic({
  id: 'linked-lists', title: 'Linked lists', sec: '§10.2', prereq: ['arrays'],
  blurb: 'Nodes connected by pointers: constant-time splicing, linear-time search, and many classic pointer puzzles.',
  cx: [['Search', 'O(n)'], ['Insert at head', 'O(1)'], ['Delete given node', 'O(1) doubly linked'], ['Reverse', 'O(n), O(1) space']],
  props: ['Singly or doubly linked', 'Sentinel'],
  tags: 'linked list pointer reverse fast slow cycle sentinel doubly',
  learn: `
<p>A <b>linked list</b> arranges objects in a linear order using pointers instead of indices. In a <b>doubly linked list</b>, each node <i>x</i> has a <i>key</i>, a pointer <i>x.next</i> to its successor and <i>x.prev</i> to its predecessor. The list itself keeps <i>L.head</i>. A singly linked list drops <i>prev</i>.</p>
<h3>Operations from the book</h3>
<ul><li><code>listSearch</code>(<i>L</i>, <i>k</i>): walk from the head until a node with key <i>k</i> appears. Θ(<i>n</i>) in the worst case.</li><li><code>listInsert</code>(<i>L</i>, <i>x</i>): splice <i>x</i> onto the front. O(1).</li><li><code>listDelete</code>(<i>L</i>, <i>x</i>): given a pointer to <i>x</i>, rewire its neighbours around it. O(1) in a doubly linked list; deleting by key needs a search first.</li></ul>
<h3>Sentinels</h3>
<p>Much of linked-list code is special cases at the ends: is this the head? is <i>next</i> NIL? A <b>sentinel</b> is a dummy node <i>L.nil</i> that sits between the head and the tail of a circular doubly linked list. Every real node now has real neighbours, so the special cases disappear. In interview code the same trick appears as a <b>dummy head</b>: <code>dummy = ListNode(0, head)</code>, then return <code>dummy.next</code>. It makes “remove the head” and “merge two lists” much cleaner.</p>
<h3>Arrays versus lists</h3>
<table><tr><th></th><th>Array</th><th>Linked list</th></tr><tr><td>Index i</td><td>O(1)</td><td>O(i)</td></tr><tr><td>Insert/delete at a known position</td><td>O(n) shifting</td><td>O(1) relinking</td></tr><tr><td>Memory</td><td>compact, cache friendly</td><td>pointer per node, scattered</td></tr></table>
<h3>Reversing a list in place</h3>
<p>Keep three pointers: <i>prev</i> (the reversed part, initially NIL), <i>curr</i> (the next node to flip) and <i>next</i> (saved before flipping). At each step: save <code>next = curr.next</code>, point <code>curr.next = prev</code>, then advance <code>prev = curr</code>, <code>curr = next</code>. It runs in O(<i>n</i>) time and O(1) space. Exercise 10.2-7 asks for exactly this.</p>
<h3>Interview patterns on lists</h3>
<ul><li><b>Fast and slow pointers</b>: detect a cycle (LC 141, 142 Floyd's algorithm), find the middle (LC 876), check a palindrome (LC 234).</li><li><b>Reversal</b>: whole list (LC 206), a sublist (LC 92), in groups of k (LC 25).</li><li><b>Merging</b>: two sorted lists (LC 21), k sorted lists with a heap (LC 23).</li><li><b>Two pointers with a gap</b>: remove the n-th node from the end (LC 19).</li><li>LRU Cache (LC 146): a hash map plus a doubly linked list, O(1) per operation.</li></ul>`,
  code: {
    pseudo: `listSearch(L, k)
  x ← L.head
  while x ≠ nil and x.key ≠ k
      x ← x.next
  return x

listInsert(L, x)
  x.next ← L.head
  if L.head ≠ nil
      L.head.prev ← x
  L.head ← x
  x.prev ← nil

listDelete(L, x)
  if x.prev ≠ nil
      x.prev.next ← x.next
  else L.head ← x.next
  if x.next ≠ nil
      x.next.prev ← x.prev

listReverse(L)
  prev ← nil
  curr ← L.head
  while curr ≠ nil
      next ← curr.next
      curr.next ← prev
      prev ← curr
      curr ← next
  L.head ← prev`,
    py: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next

def reverse(head):                      # LeetCode 206
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev, curr = curr, nxt
    return prev

def has_cycle(head):                    # LeetCode 141, Floyd
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            return True
    return False

def remove_nth_from_end(head, n):       # LeetCode 19, dummy head
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(n + 1):
        fast = fast.next
    while fast:
        fast, slow = fast.next, slow.next
    slow.next = slow.next.next
    return dummy.next`,
    cpp: `struct ListNode {
    int val; ListNode* next;
    ListNode(int v, ListNode* n = nullptr) : val(v), next(n) {}
};

ListNode* reverseList(ListNode* head) {        // LeetCode 206
    ListNode *prev = nullptr, *curr = head;
    while (curr) {
        ListNode* nxt = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
}

bool hasCycle(ListNode* head) {                 // LeetCode 141
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next; fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}`,
  },
  viz: {
    inputHint: 'Initial keys | operations: search k, insert k, delete k, reverse',
    presets: [
      { label: 'Figure 10.3', input: '9 16 4 1 | insert 25, search 4, delete 4', note: 'The book’s list: insert 25 at the head, then find and delete 4.' },
      { label: 'Reverse in place', input: '1 2 3 4 5 | reverse', note: 'Watch prev, curr and next move one node at a time.' },
    ],
    random: () => { const a = uniqArr(rnd(4, 6), 1, 40); return a.join(' ') + ' | ' + pick([`search ${pick(a)}, delete ${pick(a)}`, 'reverse', `insert ${rnd(41, 60)}, search ${pick(a)}`]); },
    parse: s => { const [v, o] = s.split('|'); return { a: parseNums(v, { min: 1, max: 9, lo: -99, hi: 999 }), ops: parseOps(o || '', ['search', 'insert', 'delete', 'reverse']) }; },
    run({ a, ops }) {
      const R = Rec(); let nid = 0; let L = a.map(v => ({ id: nid++, v }));
      const ln = (nodes, marks = {}, labs = {}, title, extra = {}) => ({ id: 0, ...extra, title, doubly: true, headLabel: 'L.head', nodes: nodes.map(n => ({ id: n.id, v: n.v, cls: marks[n.id], lab: labs[n.id] })) });
      R.add({ list: ln(L) }, 0, `A doubly linked list with ${L.length} nodes.`);
      for (const [op, k] of ops) {
        if (op === 'search' || op === 'delete') {
          let idx = -1;
          for (let i = 0; i < L.length; i++) {
            const isIt = L[i].v === k;
            R.add({ list: ln(L, { ...Object.fromEntries(L.slice(0, i).map(n => [n.id, 'dim'])), [L[i].id]: 'cmp' }, { [L[i].id]: 'x' }) }, 3, `x.key = ${L[i].v}${isIt ? ' equals ' + k + '. Stop.' : ' ≠ ' + k + ', move to x.next.'}`, i === 0 && L.findIndex(n => n.v === k) >= 0 ? { q: `${op === 'search' ? 'LIST-SEARCH' : 'Find then delete'} ${k}. Click the node the search will stop at.`, pick: 'l:' + L[L.findIndex(n => n.v === k)].id } : null);
            if (isIt) { idx = i; break; }
          }
          if (idx < 0) { R.add({ list: ln(L) }, 5, `Reached NIL: ${k} is not in the list.`); continue; }
          if (op === 'search') { R.add({ list: ln(L, { [L[idx].id]: 'done' }, { [L[idx].id]: 'found' }) }, 5, `Return the node with key ${k}.`); continue; }
          const x = L[idx];
          R.add({ list: ln(L, { [x.id]: 'cur' }, { [x.id]: 'x' }) }, 13, idx === 0 ? `x is the head, so L.head = x.next.` : `x.prev.next = x.next: node ${L[idx - 1].v} now skips over ${k}.`);
          L = L.filter(n => n !== x);
          R.add({ list: ln(L) }, 17, `Deleted ${k}. O(1) once you hold a pointer to the node.`);
        } else if (op === 'insert') {
          const x = { id: nid++, v: k };
          R.add({ list: ln([x, ...L], { [x.id]: 'cur' }, { [x.id]: 'x' }) }, 7, `x.next = L.head. ${L.length ? 'The old head\'s prev now points back to x.' : ''}`);
          L = [x, ...L];
          R.add({ list: ln(L, { [x.id]: 'done' }) }, 10, `L.head = x. Inserted ${k} at the front in O(1).`);
        } else if (op === 'reverse') {
          let prev = [], curr = [...L];
          const st = (marks, labs) => ({ lists: [{ ...ln(prev, marks, labs, 'Reversed so far (starts at prev)'), doubly: false, headLabel: 'prev' }, { ...ln(curr, marks, labs, 'Still to reverse (starts at curr)'), doubly: false, headLabel: 'curr' }] });
          R.add(st({}, {}), 20, 'prev = NIL, curr = L.head.');
          while (curr.length) {
            const c = curr[0], nx = curr[1];
            R.add(st({ [c.id]: 'cur', ...(nx ? { [nx.id]: 'cmp' } : {}) }, { [c.id]: 'curr', ...(nx ? { [nx.id]: 'next' } : {}) }), 23, `Save next = ${nx ? nx.v : 'NIL'} before breaking the link.`);
            curr = curr.slice(1); prev = [c, ...prev];
            R.add(st({ [c.id]: 'done' }, { [c.id]: 'prev', ...(nx ? { [nx.id]: 'curr' } : {}) }), 24, `curr.next = prev: node ${c.v} now points back. Advance prev and curr.`, prev.length > 1 && Math.random() < .5 ? { q: `After this step, which node will prev point to?`, pick: 'l:' + c.id } : null);
          }
          L = prev;
          R.add({ list: ln(L, Object.fromEntries(L.map(n => [n.id, 'done']))) }, 27, 'curr is NIL. L.head = prev. The list is reversed.');
        }
      }
      return R.f;
    },
  },
  quiz: [
    { q: 'Deleting a node from a singly linked list given only a pointer to that node is hard because…', opts: ['you cannot reach its predecessor in O(1)', 'nodes are immutable', 'it needs sorting', 'it is O(1) anyway'], a: 0, why: 'The predecessor’s next pointer must change. LC 237 cheats by copying the next node’s value instead.' },
    { q: 'What does a sentinel node buy you?', opts: ['Faster search', 'No special cases at the head and tail', 'Less memory', 'Sorted order'], a: 1, why: 'Every real node has real neighbours, so boundary checks vanish.' },
    { q: 'Floyd’s cycle detection moves the fast pointer…', opts: ['one step per iteration', 'two steps per iteration', 'to the head when they meet', 'randomly'], a: 1, why: 'If a cycle exists, the gap closes by one each iteration, so they must meet.' },
    { q: 'Reversing a singly linked list in place needs how much extra space?', opts: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], a: 0, why: 'Three pointers: prev, curr, next.' },
    { q: 'An LRU cache with O(1) get and put combines a hash map with…', opts: ['a heap', 'a doubly linked list', 'a sorted array', 'a BST'], a: 1, why: 'The list keeps recency order with O(1) moves; the map finds nodes in O(1).' },
  ],
});

/* ---------------- hash tables ---------------- */
topic({
  id: 'hash-tables', title: 'Hash tables', sec: '§11.1–11.4', prereq: ['linked-lists', 'probabilistic'],
  blurb: 'Map keys to slots with a hash function for expected constant-time insert, search and delete.',
  cx: [['Search (expected)', 'Θ(1 + α)'], ['Worst case', 'Θ(n)'], ['Load factor α', 'n / m']],
  props: ['Chaining', 'Open addressing', 'Universal hashing'],
  tags: 'hash table hashmap dictionary chaining open addressing linear probing double hashing load factor',
  learn: `
<p>A <b>dictionary</b> supports <code>insert</code>, <code>search</code> and <code>delete</code>. If keys were small integers you could index an array directly (a <b>direct-address table</b>). Hashing extends that idea to huge key universes: a <b>hash function</b> <i>h</i> maps each key to one of <i>m</i> slots, and we store the key in slot <i>h</i>(<i>k</i>).</p>
<p>Two keys can hash to the same slot, a <b>collision</b>. Collisions are unavoidable when the universe is bigger than <i>m</i>, so a hash table is defined by how it resolves them.</p>
<h3>Chaining</h3>
<p>Each slot holds a linked list of every key that hashes there. Insert at the head of the list in O(1); search and delete walk one list. Under <b>simple uniform hashing</b> (each key equally likely to land in any slot), the expected list length is the <b>load factor</b> α = <i>n</i>/<i>m</i>, so a search takes Θ(1 + α) expected time. Keep α bounded (resize when it grows) and every operation is expected O(1).</p>
<h3>Open addressing</h3>
<p>All keys live in the table itself. To insert, <b>probe</b> a sequence of slots <i>h</i>(<i>k</i>, 0), <i>h</i>(<i>k</i>, 1), … until an empty one appears. Search follows the same sequence until it finds the key or an empty slot.</p>
<ul><li><b>Linear probing</b>: <i>h</i>(<i>k</i>, <i>i</i>) = (<i>h'</i>(<i>k</i>) + <i>i</i>) mod <i>m</i>. Simple and cache friendly, but long runs of occupied slots (<b>primary clustering</b>) build up.</li><li><b>Quadratic probing</b>: (<i>h'</i>(<i>k</i>) + <i>c</i><sub>1</sub><i>i</i> + <i>c</i><sub>2</sub><i>i</i>²) mod <i>m</i>. Milder secondary clustering.</li><li><b>Double hashing</b>: (<i>h</i><sub>1</sub>(<i>k</i>) + <i>i</i>·<i>h</i><sub>2</sub>(<i>k</i>)) mod <i>m</i>. Close to ideal uniform hashing. <i>h</i><sub>2</sub>(<i>k</i>) must be relatively prime to <i>m</i>.</li></ul>
<p>With uniform hashing and α &lt; 1, an unsuccessful search makes at most 1/(1 − α) probes in expectation. At α = 0.9 that is 10 probes. Deletion is awkward: you cannot simply empty a slot, or later searches stop early, so implementations mark it with a <b>tombstone</b>.</p>
<h3>Choosing a hash function</h3>
<ul><li><b>Division method</b>: <i>h</i>(<i>k</i>) = <i>k</i> mod <i>m</i>. Pick <i>m</i> prime and not close to a power of 2.</li><li><b>Multiplication method</b>: <i>h</i>(<i>k</i>) = ⌊<i>m</i> (<i>kA</i> mod 1)⌋ for a constant 0 &lt; <i>A</i> &lt; 1. Knuth suggests <i>A</i> ≈ (√5 − 1)/2.</li><li><b>Universal hashing</b>: choose <i>h</i> at random from a family where any two keys collide with probability at most 1/<i>m</i>. Then no fixed input can force bad behaviour, the same idea as randomized quicksort.</li></ul>
<h3>In interviews</h3>
<p>Hash maps are the most used structure in coding interviews: Two Sum (LC 1), Group Anagrams (LC 49), Longest Consecutive Sequence (LC 128), Subarray Sum Equals K (LC 560), LRU Cache (LC 146). Always state “expected O(1)” and mention the O(<i>n</i>) worst case if asked. Python's <code>dict</code> uses open addressing; Java's <code>HashMap</code> uses chaining that turns long chains into balanced trees.</p>`,
  code: {
    pseudo: `chainedHashInsert(T, x)
  push x onto the front of chain T[h(x.key)]

chainedHashSearch(T, k)
  walk chain T[h(k)] until a node with key k appears

hashInsert(T, k)
  i ← 0
  repeat
      j ← h(k, i)
      if T[j] = nil
          T[j] ← k
          return j
      else i ← i + 1
  until i = m
  error "hash table overflow"

hashSearch(T, k)
  i ← 0
  repeat
      j ← h(k, i)
      if T[j] = k
          return j
      i ← i + 1
  until T[j] = nil or i = m
  return nil`,
    py: `class LinearProbingTable:
    EMPTY, DELETED = object(), object()

    def __init__(self, m=11):
        self.m = m
        self.t = [self.EMPTY] * m

    def _probe(self, k):
        h = hash(k) % self.m
        for i in range(self.m):
            yield (h + i) % self.m

    def insert(self, k):
        for j in self._probe(k):
            if self.t[j] is self.EMPTY or self.t[j] is self.DELETED:
                self.t[j] = k
                return j
        raise OverflowError("table full")

    def search(self, k):
        for j in self._probe(k):
            if self.t[j] is self.EMPTY:
                return None
            if self.t[j] == k:
                return j
        return None

    def delete(self, k):
        j = self.search(k)
        if j is not None:
            self.t[j] = self.DELETED     # tombstone keeps probe chains intact

def two_sum(nums, target):               # LeetCode 1
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i`,
    cpp: `#include <vector>
#include <list>
#include <unordered_map>
using namespace std;

struct ChainedHash {
    vector<list<int>> T;
    ChainedHash(int m) : T(m) {}
    int h(int k) const { return ((k % (int)T.size()) + T.size()) % T.size(); }
    void insert(int k) { T[h(k)].push_front(k); }
    bool search(int k) const {
        for (int x : T[h(k)]) if (x == k) return true;
        return false;
    }
    void erase(int k) { T[h(k)].remove(k); }
};

vector<int> twoSum(const vector<int>& nums, int target) {   // LeetCode 1
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        auto it = seen.find(target - nums[i]);
        if (it != seen.end()) return {it->second, i};
        seen[nums[i]] = i;
    }
    return {};
}`,
  },
  viz: {
    inputHint: 'chain m=9: keys   or   linear m=11: keys   or   double m=11: keys',
    presets: [
      { label: 'Chaining (Exercise 11.2-2)', input: 'chain m=9: 5 28 19 15 20 33 12 17 10', note: 'The book’s exercise: h(k) = k mod 9.' },
      { label: 'Linear probing (Exercise 11.4-1)', input: 'linear m=11: 10 22 31 4 15 28 17 88 59', note: 'h(k, i) = (k + i) mod 11. Watch clusters form.' },
      { label: 'Double hashing (Exercise 11.4-1)', input: 'double m=11: 10 22 31 4 15 28 17 88 59', note: 'h₁(k) = k, h₂(k) = 1 + (k mod 10).' },
      { label: 'Quadratic probing', input: 'quadratic m=11: 10 22 31 4 15 28 17 88 59', note: 'c₁ = 1, c₂ = 3, as in the exercise.' },
    ],
    random: () => { const m = pick([7, 11, 13]); return pick(['chain', 'linear', 'double']) + ` m=${m}: ` + uniqArr(rnd(6, Math.min(m - 2, 9)), 1, 99).join(' '); },
    parse: s => { const mm = /^\s*(chain|linear|quadratic|double)\s+m\s*=\s*(\d+)\s*:(.*)$/i.exec(s); if (!mm) throw new Error('Use the form "linear m=11: 10 22 31".'); const m = +mm[2]; if (m < 3 || m > 17) throw new Error('Choose m between 3 and 17.'); const keys = parseNums(mm[3], { min: 1, max: 14, lo: 0, hi: 999 }); if (mm[1].toLowerCase() !== 'chain' && keys.length >= m) throw new Error('Open addressing needs fewer keys than slots.'); return { kind: mm[1].toLowerCase(), m, keys }; },
    run({ kind, m, keys }) {
      const R = Rec();
      if (kind === 'chain') {
        const T = Array.from({ length: m }, () => []);
        const st = (hl) => ({ vars: { m, 'α = n/m': (T.flat().length / m).toFixed(2) }, buckets: { title: `T[0..${m - 1}], chaining, h(k) = k mod ${m}`, slots: T.map((c, i) => ({ label: i, items: [...c], hl: hl[i] || {} })) } });
        R.add(st({}), 1, `Empty table with ${m} slots.`);
        for (const k of keys) {
          const j = k % m;
          T[j].unshift(k);
          R.add(st({ [j]: { 0: 'cur' } }), 2, `h(${k}) = ${k} mod ${m} = ${j}. Insert at the head of list T[${j}]${T[j].length > 1 ? ' (a collision, the chain grows)' : ''}.`, { q: `Which slot does key ${k} hash to?`, pick: 'b:' + j, hint: `${k} mod ${m}` });
        }
        const mx = Math.max(...T.map(c => c.length));
        R.add(st({}), 2, `Done. ${keys.length} keys in ${m} slots: load factor ${(keys.length / m).toFixed(2)}, longest chain ${mx}.`);
      } else {
        const T = Array(m).fill(null);
        const h2 = k => 1 + (k % (m - 1));
        const probe = (k, i) => kind === 'linear' ? (k + i) % m : kind === 'quadratic' ? (k + i + 3 * i * i) % m : (k + i * h2(k)) % m;
        const fn = kind === 'linear' ? `h(k, i) = (k + i) mod ${m}` : kind === 'quadratic' ? `h(k, i) = (k + i + 3i²) mod ${m}` : `h(k, i) = (k + i·(1 + k mod ${m - 1})) mod ${m}`;
        const st = (hl, vars = {}) => ({ vars: { ...vars, α: (T.filter(x => x != null).length / m).toFixed(2) }, arrays: [{ name: 'T', label: 'T[0..' + (m - 1) + ']: ' + fn, a: [...T], hl, base: 0 }] });
        R.add(st({}), 7, `Empty table, ${fn}.`);
        let total = 0, failed = 0;
        for (const k of keys) {
          let i = 0, j, found = false;
          for (; i < m; i++) {
            j = probe(k, i);
            if (T[j] == null) { found = true; break; }
            R.add(st({ [j]: 'cmp' }, { k, i }), 14, `Probe ${i}: slot ${j} holds ${T[j]}. Collision${i + 1 < m ? `, try i = ${i + 1}` : ''}.`, i === 0 ? { q: `Key ${k}: which slot is probed first?`, pick: 'T:' + j } : null);
          }
          if (!found) {
            total += m; failed++;
            const why = kind === 'quadratic' ? 'Quadratic probing can cycle through only some of the slots.' : kind === 'double' ? `Double hashing reaches every slot only when the step h₂(${k}) = ${h2(k)} is coprime to m = ${m}; choosing m prime guarantees that.` : 'Every slot is full.';
            R.add(st({}, { k, i: m - 1 }), 16, `All ${m} probes for ${k} hit occupied slots, so the insertion fails and ${k} is not stored, even though ${T.filter(x => x == null).length} slot${T.filter(x => x == null).length === 1 ? ' is' : 's are'} still empty. ${why} Continue with the next key.`);
            continue;
          }
          total += i + 1;
          const ask = i === 0 ? { q: `Key ${k}: which slot is probed first?`, pick: 'T:' + j } : (i === 1 ? { q: `Slot ${probe(k, 0)} was taken. Which slot is probed next?`, pick: 'T:' + j, hint: kind === 'double' ? `Step size h₂(${k}) = ${h2(k)}` : kind === 'linear' ? 'Move one slot to the right, wrapping around.' : 'i = 1 adds 1 + 3 = 4.' } : null);
          T[j] = k;
          R.add(st({ [j]: 'found' }, { k, i }), [11, 12], `Slot ${j} is empty. Store ${k} there after ${i + 1} probe${i ? 's' : ''}.`, ask);
        }
        const stored = keys.length - failed;
        R.add(st({}), 9, failed ? `Done. ${stored} of ${keys.length} keys stored; ${failed} insertion${failed === 1 ? '' : 's'} failed because the probe sequence never reached an empty slot. ${total} probes in all, ${(total / keys.length).toFixed(2)} per attempted insert.` : `Done. ${total} probes for ${keys.length} inserts, ${(total / keys.length).toFixed(2)} on average.`);
      }
      return R.f;
    },
  },
  quiz: [
    { q: 'With chaining and simple uniform hashing, an unsuccessful search takes expected time…', opts: ['Θ(1)', 'Θ(1 + α)', 'Θ(log n)', 'Θ(n)'], a: 1, why: 'Hash in O(1), then walk a list of expected length α = n/m.' },
    { q: 'Why can open addressing not simply set a deleted slot back to NIL?', opts: ['It wastes memory', 'A later search would stop early at that slot and miss keys placed after it', 'NIL is not allowed', 'It breaks the hash function'], a: 1, why: 'Use a DELETED marker (tombstone) instead.' },
    { q: 'Primary clustering is a weakness of…', opts: ['chaining', 'linear probing', 'double hashing', 'universal hashing'], a: 1, why: 'Occupied runs grow because any key hashing into the run extends it.' },
    { q: 'In double hashing, h₂(k) must be relatively prime to m because…', opts: ['otherwise the probe sequence cannot reach every slot', 'it makes hashing faster', 'it avoids negative numbers', 'it is not required'], a: 0, why: 'If gcd(h₂(k), m) = d > 1, only m/d slots are ever probed.' },
    { q: 'With open addressing at load factor α = 0.75, the expected probes for an unsuccessful search are at most…', opts: ['1.33', '2', '4', '7.5'], a: 2, why: '1 / (1 − α) = 1 / 0.25 = 4.' },
    { q: 'Group Anagrams (LC 49) groups words by…', opts: ['their length', 'a hash key such as the sorted word or a 26-letter count tuple', 'their first letter', 'a binary search'], a: 1, why: 'All anagrams share the same canonical key.' },
  ],
});

/* ---------------- disjoint sets ---------------- */
topic({
  id: 'disjoint-sets', title: 'Disjoint sets (union-find)', sec: '§21.1–21.4', prereq: ['linked-lists'],
  blurb: 'Track a partition into groups with near-constant-time union and find, using rank and path compression.',
  cx: [['m operations on n elements', 'O(m α(n))'], ['α(n)', '≤ 4 in practice']],
  props: ['Union by rank', 'Path compression'],
  tags: 'union find disjoint set dsu connected components kruskal path compression rank',
  learn: `
<p>A <b>disjoint-set</b> structure maintains a collection of non-overlapping sets. Each set is identified by a <b>representative</b>, one of its members. Three operations:</p>
<ul><li><code>makeSet</code>(<i>x</i>): a new set containing only <i>x</i>.</li><li><code>findSet</code>(<i>x</i>): the representative of <i>x</i>'s set. Two elements are in the same set exactly when their representatives match.</li><li><code>union</code>(<i>x</i>, <i>y</i>): merge the sets containing <i>x</i> and <i>y</i>.</li></ul>
<p>It answers “are these connected?” as edges arrive, which is exactly what Kruskal's minimum spanning tree algorithm needs.</p>
<h3>Disjoint-set forests</h3>
<p>Represent each set as a rooted tree where every node points to its parent and the root is the representative. <code>findSet</code> follows parent pointers to the root. <code>union</code> makes one root a child of the other. Done naively, the trees can become long chains and finds cost Θ(<i>n</i>). Two heuristics fix that:</p>
<ol><li><b>Union by rank.</b> Each root stores a <i>rank</i>, an upper bound on its height. Attach the root of smaller rank under the root of larger rank. Only when ranks tie does the height grow, and then the new root's rank increases by 1. Alone, this keeps heights O(lg <i>n</i>).</li><li><b>Path compression.</b> During <code>findSet</code>, make every node on the path point directly to the root. The next find from any of them is one step.</li></ol>
<div class="note key">With both heuristics, a sequence of <i>m</i> operations on <i>n</i> elements takes O(<i>m</i> α(<i>n</i>)) time, where α is the inverse Ackermann function. α(<i>n</i>) ≤ 4 for any <i>n</i> you will ever meet, so treat each operation as constant time. Section 21.4 proves it with a potential function.</div>
<h3>In interviews</h3>
<ul><li><b>Connected components</b> that change by adding edges: Number of Provinces (LC 547), Number of Connected Components (LC 323), Graph Valid Tree (LC 261).</li><li><b>Cycle detection</b> in an undirected graph: an edge whose endpoints already share a root closes a cycle (Redundant Connection, LC 684).</li><li><b>Grouping by equivalence</b>: Accounts Merge (LC 721), Satisfiability of Equality Equations (LC 990), Longest Consecutive Sequence (LC 128).</li><li>Kruskal's algorithm (LC 1584, Min Cost to Connect All Points).</li></ul>`,
  code: {
    pseudo: `makeSet(x)
  x.p ← x
  x.rank ← 0

union(x, y)
  link(findSet(x), findSet(y))

link(x, y)
  if x.rank > y.rank
      y.p ← x
  else x.p ← y
      if x.rank = y.rank
          y.rank ← y.rank + 1

findSet(x)
  if x ≠ x.p
      x.p ← findSet(x.p)      // path compression
  return x.p`,
    py: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path halving
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False            # already connected: this edge closes a cycle
        if self.rank[ra] < self.rank[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        if self.rank[ra] == self.rank[rb]:
            self.rank[ra] += 1
        return True`,
    cpp: `#include <vector>
#include <numeric>
#include <utility>
using namespace std;

struct DSU {
    vector<int> parent, rnk;
    DSU(int n) : parent(n), rnk(n, 0) { iota(parent.begin(), parent.end(), 0); }
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);   // path compression
        return parent[x];
    }
    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        if (rnk[a] < rnk[b]) swap(a, b);
        parent[b] = a;
        if (rnk[a] == rnk[b]) rnk[a]++;
        return true;
    }
};`,
  },
  viz: {
    inputHint: 'n | union a b, find x, ...',
    presets: [
      { label: 'Build and compress', input: '8 | union 1 2, union 3 4, union 1 3, union 5 6, union 7 8, union 5 7, union 2 6, find 1', note: 'Union by rank keeps the trees shallow; the final find compresses a path.' },
      { label: 'Detect a cycle', input: '5 | union 1 2, union 2 3, union 4 5, union 3 1', note: 'The last union finds 3 and 1 already share a root: that edge would close a cycle.' },
    ],
    random: () => { const n = rnd(6, 8); const ops = []; for (let i = 0; i < n; i++) ops.push(`union ${rnd(1, n)} ${rnd(1, n)}`); ops.push(`find ${rnd(1, n)}`); return n + ' | ' + ops.join(', '); },
    parse: s => { const [a, b] = s.split('|'); const n = parseNums(a, { min: 1, max: 1, lo: 2, hi: 12 })[0]; const ops = parseOps(b || '', ['union', 'find']); for (const [, x, y] of ops) if (x < 1 || x > n || (y != null && (y < 1 || y > n))) throw new Error(`Elements must be between 1 and ${n}.`); return { n, ops }; },
    run({ n, ops }) {
      const R = Rec(); const p = Array.from({ length: n + 1 }, (_, i) => i), rank = Array(n + 1).fill(0);
      const st = (hl = {}) => {
        const nodes = {}; for (let i = 1; i <= n; i++) nodes[i] = { k: i, c: [], cls: hl[i], note: p[i] === i ? 'rank ' + rank[i] : undefined };
        const roots = []; for (let i = 1; i <= n; i++) { if (p[i] === i) roots.push(i); else nodes[p[i]].c.push(i); }
        return { tree: { nodes, roots, levelH: 60 }, arrays: [{ name: 'p', label: 'parent', a: p.slice(1), base: 1, hl: Object.fromEntries(Object.entries(hl).map(([k, v]) => [k - 1, v])), small: true }] };
      };
      const root = x => { while (p[x] !== x) x = p[x]; return x; };
      function find(x, line) {
        const path = []; let y = x; while (p[y] !== y) { path.push(y); y = p[y]; }
        const hl = Object.fromEntries(path.map(v => [v, 'cmp'])); hl[y] = 'cur';
        R.add(st(hl), line || 15, `FIND-SET(${x}): follow parent pointers ${[...path, y].join(' → ')}. The root is ${y}.`, { q: `FIND-SET(${x}): click the representative (root) of ${x}'s set.`, pick: 'n:' + y, hint: 'Follow the edges upward.' });
        if (path.length > 1) { path.forEach(v => p[v] = y); R.add(st({ ...Object.fromEntries(path.map(v => [v, 'ok'])), [y]: 'cur' }), 16, `Path compression: ${path.join(', ')} now point directly at ${y}.`); }
        return y;
      }
      R.add(st(), 1, `MAKE-SET on 1..${n}: every element is its own root with rank 0.`);
      for (const [op, a, b] of ops) {
        if (op === 'find') { find(a); continue; }
        const ra = find(a, 6), rb = find(b, 6);
        if (ra === rb) { R.add(st({ [ra]: 'warn' }), 6, `${a} and ${b} already have the same root ${ra}. Nothing to merge${ops.length ? ' (as an edge, this would close a cycle)' : ''}.`); continue; }
        let child, par;
        if (rank[ra] > rank[rb]) { child = rb; par = ra; } else { child = ra; par = rb; }
        const ask = { q: `LINK(${ra}, ${rb}): ranks are ${rank[ra]} and ${rank[rb]}. Which root becomes the parent?`, pick: 'n:' + par, hint: rank[ra] === rank[rb] ? 'On a tie, the book makes the second root the parent.' : 'The higher rank wins.' };
        p[child] = par; const tie = rank[ra] === rank[rb]; if (tie) rank[par]++;
        R.add(st({ [par]: 'cur', [child]: 'ok' }), tie ? 13 : (rank[ra] > rank[rb] ? 10 : 11), `LINK: root ${child} goes under root ${par}${tie ? `. Ranks tied, so rank(${par}) becomes ${rank[par]}` : ' (higher rank stays on top)'}.`, ask);
      }
      const sets = {}; for (let i = 1; i <= n; i++) (sets[root(i)] ||= []).push(i);
      R.add(st(), 1, `Final sets: ${Object.values(sets).map(s => '{' + s.join(', ') + '}').join(' ')}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'With union by rank alone, the height of any tree is at most…', opts: ['O(1)', 'O(lg n)', 'O(√n)', 'O(n)'], a: 1, why: 'A root of rank r has at least 2^r nodes, so r ≤ lg n.' },
    { q: 'Path compression changes…', opts: ['ranks', 'parent pointers of nodes on the find path', 'the set membership', 'the representative'], a: 1, why: 'Ranks are left alone, so after compression a rank is only an upper bound on height.' },
    { q: 'm operations with both heuristics take…', opts: ['O(m lg n)', 'O(m α(n))', 'O(m n)', 'O(m²)'], a: 1, why: 'α(n) is the inverse Ackermann function, at most 4 in practice.' },
    { q: 'Processing undirected edges with union-find, an edge (u, v) closes a cycle when…', opts: ['u and v have different ranks', 'FIND(u) = FIND(v) before the union', 'u is a root', 'v has no parent'], a: 1, why: 'They are already connected, so the new edge creates a second path.' },
  ],
});
