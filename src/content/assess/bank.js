/* Original assessment questions: output tracing, bug spotting and line ordering (Parsons problems). */

/** Trace and bug questions share the quiz shape: { q, code, lang, opts, a, why, topic } */
export const TRACE = [
  {
    topic: 'insertion-sort', kind: 'trace',
    q: 'What does this print?',
    code: `a = [4, 1, 3, 2]
for j in range(1, len(a)):
    key, i = a[j], j - 1
    while i >= 0 and a[i] > key:
        a[i + 1] = a[i]
        i -= 1
    a[i + 1] = key
    if j == 2:
        print(a)`,
    opts: ['[1, 3, 4, 2]', '[1, 4, 3, 2]', '[1, 2, 3, 4]', '[1, 3, 2, 4]'], a: 0,
    why: 'After j = 1 the prefix is [1, 4]; j = 2 inserts 3 between them, giving [1, 3, 4, 2]. The 2 has not been touched yet.',
  },
  {
    topic: 'binary-search', kind: 'trace',
    q: 'How many times does the loop body run?',
    code: `a = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
lo, hi, steps = 0, len(a) - 1, 0
while lo <= hi:
    steps += 1
    mid = (lo + hi) // 2
    if a[mid] == 23: break
    if a[mid] < 23: lo = mid + 1
    else: hi = mid - 1
print(steps)`,
    opts: ['1', '2', '3', '4'], a: 2,
    why: 'mid = 4 holds 16 < 23, so lo = 5. mid = 7 holds 56 > 23, so hi = 6. mid = 5 holds 23. Three probes.',
  },
  {
    topic: 'stacks-queues', kind: 'trace',
    q: 'What does this print?',
    code: `s = []
for ch in "(()())":
    if ch == "(":
        s.append(len(s))
    else:
        s.pop()
    if len(s) == 2:
        print("x", end="")
print(len(s))`,
    opts: ['xx0', 'x0', 'xxx0', 'xx1'], a: 0,
    why: 'Depth reaches 2 after the second character and again after the fourth, printing x twice; the string is balanced, so the stack ends empty.',
  },
  {
    topic: 'hash-tables', kind: 'trace',
    q: 'What does this print?',
    code: `seen, out = {}, []
for i, x in enumerate([3, 1, 3, 2, 1]):
    if x in seen:
        out.append(i - seen[x])
    seen[x] = i
print(out)`,
    opts: ['[2, 3]', '[2, 2]', '[1, 3]', '[3, 2]'], a: 0,
    why: '3 repeats at index 2 (gap 2 from index 0); 1 repeats at index 4 (gap 3 from index 1).',
  },
  {
    topic: 'bfs', kind: 'trace',
    q: 'In what order are the vertices printed?',
    code: `from collections import deque
adj = {0: [2, 1], 1: [3], 2: [3, 4], 3: [], 4: []}
q, seen = deque([0]), {0}
while q:
    u = q.popleft()
    print(u, end=" ")
    for v in adj[u]:
        if v not in seen:
            seen.add(v); q.append(v)`,
    opts: ['0 2 1 3 4', '0 1 2 3 4', '0 2 3 4 1', '0 2 1 4 3'], a: 0,
    why: 'Neighbours are queued in list order: 2 then 1. From 2 we queue 3 and 4; 1’s neighbour 3 is already seen.',
  },
  {
    topic: 'dp-intro', kind: 'trace',
    q: 'What does this print?',
    code: `dp = [0] * 7
dp[0] = 1
for coin in [1, 3]:
    for a in range(coin, 7):
        dp[a] += dp[a - coin]
print(dp[6])`,
    opts: ['3', '2', '4', '7'], a: 0,
    why: 'Counting coin combinations for 6 using 1s and 3s: 1×6, 3+1+1+1, 3+3. Three ways.',
  },
  {
    topic: 'recurrences', kind: 'trace',
    q: 'How many times is "*" printed for f(8)?',
    code: `def f(n):
    if n <= 1:
        return
    for _ in range(n):
        print("*", end="")
    f(n // 2)
    f(n // 2)

f(8)`,
    opts: ['24', '16', '32', '15'], a: 0,
    why: 'T(n) = 2T(n/2) + n with T(1) = 0: 8 at the top, 2 × 4 = 8 at the next level, 4 × 2 = 8 below. 8 + 8 + 8 = 24, which is n lg n.',
  },
  {
    topic: 'bit-manipulation', kind: 'trace',
    q: 'What does this print?',
    code: `x, c = 44, 0
while x:
    x &= x - 1
    c += 1
print(c)`,
    opts: ['3', '4', '2', '6'], a: 0,
    why: 'x & (x − 1) clears the lowest set bit. 44 is 101100 in binary: three set bits.',
  },
  {
    topic: 'quicksort', kind: 'trace',
    q: 'After one Lomuto partition with the last element as pivot, what is the array?',
    code: `a = [5, 2, 8, 1, 4]
p, i = a[-1], -1
for j in range(len(a) - 1):
    if a[j] <= p:
        i += 1
        a[i], a[j] = a[j], a[i]
a[i + 1], a[-1] = a[-1], a[i + 1]
print(a)`,
    opts: ['[2, 1, 4, 5, 8]', '[1, 2, 4, 5, 8]', '[2, 1, 4, 8, 5]', '[4, 2, 1, 5, 8]'], a: 0,
    why: '2 and 1 are ≤ 4, so they are swapped to the front in order: [2, 1, 8, 5, 4]. Then the pivot swaps with index 2: [2, 1, 4, 5, 8].',
  },
  {
    topic: 'tree-basics', kind: 'trace',
    q: 'The tree is stored as a heap-style array. What does the inorder walk print?',
    code: `t = [6, 3, 9, 1, 4]       # children of i are 2i+1 and 2i+2
def walk(i):
    if i >= len(t): return
    walk(2 * i + 1)
    print(t[i], end=" ")
    walk(2 * i + 2)
walk(0)`,
    opts: ['1 3 4 6 9', '6 3 1 4 9', '1 4 3 9 6', '6 3 9 1 4'], a: 0,
    why: 'Inorder visits left subtree, node, right subtree. The tree is a BST, so inorder prints the keys in sorted order.',
  },
  {
    topic: 'insertion-sort', kind: 'bug',
    q: 'This insertion sort sometimes leaves the array unsorted. Which line is wrong?',
    code: `def insertion_sort(a):
    for j in range(1, len(a)):
        key = a[j]
        i = j - 1
        while i > 0 and a[i] > key:
            a[i + 1] = a[i]
            i -= 1
        a[i + 1] = key`,
    opts: ['Line 5', 'Line 2', 'Line 6', 'Line 8'], a: 0,
    why: '`i > 0` never compares against a[0], so a small key can never move to the front. It should be `i >= 0`.',
  },
  {
    topic: 'binary-search', kind: 'bug',
    q: 'This search can loop forever. Which line causes it?',
    code: `def first_true(lo, hi, ok):      # smallest x in [lo, hi] with ok(x)
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid):
            hi = mid
        else:
            lo = mid`,
    opts: ['Line 7', 'Line 3', 'Line 5', 'Line 2'], a: 0,
    why: 'When hi = lo + 1 and ok(lo) is false, mid = lo and `lo = mid` makes no progress. It must be `lo = mid + 1`.',
  },
  {
    topic: 'sliding-window', pattern: 'sliding-window', kind: 'bug',
    q: 'This should return the longest substring without repeats, but fails on "abba". Which line is wrong?',
    code: `def longest(s):
    last, left, best = {}, 0, 0
    for right, ch in enumerate(s):
        if ch in last:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best`,
    opts: ['Line 4', 'Line 5', 'Line 6', 'Line 7'], a: 0,
    why: 'On the final "a", last["a"] = 0 is outside the window, but the code moves left back from 2 to 1. Line 4 must also check `last[ch] >= left`.',
  },
  {
    topic: 'dfs', kind: 'bug',
    q: 'This cycle check for a directed graph reports cycles that are not there. What is wrong?',
    code: `def has_cycle(adj):
    seen = set()
    def dfs(u):
        seen.add(u)
        for v in adj[u]:
            if v in seen:
                return True
            if dfs(v):
                return True
        return False
    return any(dfs(u) for u in adj if u not in seen)`,
    opts: ['It needs a separate “on the current path” set; reaching a finished vertex is not a cycle', 'It should use BFS instead of DFS', 'seen should be a list', 'It must start only from vertex 0'], a: 0,
    why: 'In a directed graph, an edge to a black (finished) vertex is a cross or forward edge, not a back edge. Only gray vertices, on the current recursion path, signal a cycle.',
  },
  {
    topic: 'dijkstra', kind: 'bug',
    q: 'Does this Dijkstra return correct distances when every weight is non-negative?',
    code: `import heapq
def dijkstra(adj, s):
    dist = {s: 0}
    pq, done = [(0, s)], set()
    while pq:
        d, u = heapq.heappop(pq)
        done.add(u)
        for v, w in adj[u]:
            if v not in dist or d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(pq, (dist[v], v))
    return dist`,
    opts: ['Yes; it is only slower, because stale heap entries re-expand vertices', 'No; the heap must be a max-heap', 'No; dist[s] must start at infinity', 'No; edges must be relaxed before popping'], a: 0,
    why: 'Stale heap entries can re-expand a vertex but never set a distance below a real path length, so the results are correct. Adding `if u in done: continue` after the pop restores the O((V + E) lg V) bound.',
  },
  {
    topic: 'merge-sort', kind: 'bug',
    q: 'This merge drops elements. Which line is missing something?',
    code: `def merge(a, b):
    i = j = 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    return out`,
    opts: ['Line 9 should return out + a[i:] + b[j:]', 'Line 5 should use <', 'Line 4 should use or', 'Line 2 should start at 1'], a: 0,
    why: 'When one list runs out, the rest of the other is never copied. Append the leftovers before returning.',
  },
];

/** Parsons problems: put the shuffled lines in order. Indentation is part of each line. */
export const PARSONS = [
  {
    id: 'pp-binary-search', topic: 'binary-search', title: 'Binary search for a target',
    lines: [
      'def search(a, x):',
      '    lo, hi = 0, len(a) - 1',
      '    while lo <= hi:',
      '        mid = (lo + hi) // 2',
      '        if a[mid] == x:',
      '            return mid',
      '        if a[mid] < x:',
      '            lo = mid + 1',
      '        else:',
      '            hi = mid - 1',
      '    return -1',
    ],
  },
  {
    id: 'pp-two-sum', topic: 'hash-tables', pattern: 'hashing', title: 'Two Sum with a hash map',
    lines: [
      'def two_sum(nums, target):',
      '    index = {}',
      '    for i, x in enumerate(nums):',
      '        if target - x in index:',
      '            return [index[target - x], i]',
      '        index[x] = i',
    ],
  },
  {
    id: 'pp-reverse-list', topic: 'linked-lists', pattern: 'list-reversal', title: 'Reverse a linked list',
    lines: [
      'def reverse(head):',
      '    prev, curr = None, head',
      '    while curr:',
      '        nxt = curr.next',
      '        curr.next = prev',
      '        prev = curr',
      '        curr = nxt',
      '    return prev',
    ],
  },
  {
    id: 'pp-bfs', topic: 'bfs', pattern: 'graph-traversal', title: 'Breadth-first distances',
    lines: [
      'def bfs(adj, s):',
      '    dist = {s: 0}',
      '    q = deque([s])',
      '    while q:',
      '        u = q.popleft()',
      '        for v in adj[u]:',
      '            if v not in dist:',
      '                dist[v] = dist[u] + 1',
      '                q.append(v)',
      '    return dist',
    ],
    alts: [[0, 1, 2, 3, 4, 5, 6, 8, 7, 9]],
  },
  {
    id: 'pp-heapify', topic: 'heapsort', title: 'Sift down in a max-heap',
    lines: [
      'def sift_down(a, i, n):',
      '    while True:',
      '        l, r, big = 2 * i + 1, 2 * i + 2, i',
      '        if l < n and a[l] > a[big]: big = l',
      '        if r < n and a[r] > a[big]: big = r',
      '        if big == i:',
      '            return',
      '        a[i], a[big] = a[big], a[i]',
      '        i = big',
    ],
    alts: [[0, 1, 2, 4, 3, 5, 6, 7, 8]],
  },
  {
    id: 'pp-subsets', topic: 'backtracking', pattern: 'backtracking', title: 'All subsets by backtracking',
    lines: [
      'def subsets(nums):',
      '    out, cur = [], []',
      '    def bt(i):',
      '        if i == len(nums):',
      '            out.append(cur[:])',
      '            return',
      '        bt(i + 1)',
      '        cur.append(nums[i])',
      '        bt(i + 1)',
      '        cur.pop()',
      '    bt(0)',
      '    return out',
    ],
    alts: [[0, 1, 2, 3, 4, 5, 7, 8, 9, 6, 10, 11]],
  },
  {
    id: 'pp-find', topic: 'disjoint-sets', pattern: 'union-find', title: 'Union-find with path compression',
    lines: [
      'def find(parent, x):',
      '    root = x',
      '    while parent[root] != root:',
      '        root = parent[root]',
      '    while parent[x] != root:',
      '        parent[x], x = root, parent[x]',
      '    return root',
    ],
  },
  {
    id: 'pp-kadane', topic: 'dp-intro', pattern: 'dp-1d', title: 'Maximum subarray (Kadane)',
    lines: [
      'def max_subarray(nums):',
      '    best = cur = nums[0]',
      '    for x in nums[1:]:',
      '        cur = max(x, cur + x)',
      '        best = max(best, cur)',
      '    return best',
    ],
  },
];
