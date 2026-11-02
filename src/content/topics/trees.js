import { I, Rec, h, parseNums, pick, randArr, rnd, shuffle, uniqArr } from '../../engine/helpers';
import { setPart, topic } from '../registry';
import { heapTree, rangeHl } from './sorting';
import { parseOps } from './ds';

setPart('trees');
/* ---- shared binary-tree toolkit ---- */
export function BST() { return { N: {}, root: null, nid: 1 }; }
export function bnode(T, key, extra = {}) { const id = T.nid++; T.N[id] = { id, key, l: null, r: null, p: null, ...extra }; return id; }
export function tsnap(T, hl = {}, note) { const nodes = {}; for (const id in T.N) { const n = T.N[id]; nodes[id] = { k: n.key, l: n.l, r: n.r, cls: hl[id], color: n.color, note: note ? note(n) : undefined }; } return { nodes, root: T.root, binary: true }; }
export function rotL(T, x) { const N = T.N, y = N[x].r; N[x].r = N[y].l; if (N[y].l != null) N[N[y].l].p = x; N[y].p = N[x].p; if (N[x].p == null) T.root = y; else if (N[N[x].p].l === x) N[N[x].p].l = y; else N[N[x].p].r = y; N[y].l = x; N[x].p = y; return y; }
export function rotR(T, x) { const N = T.N, y = N[x].l; N[x].l = N[y].r; if (N[y].r != null) N[N[y].r].p = x; N[y].p = N[x].p; if (N[x].p == null) T.root = y; else if (N[N[x].p].r === x) N[N[x].p].r = y; else N[N[x].p].l = y; N[y].r = x; N[x].p = y; return y; }
export function bstInsertQuiet(T, key, extra) { const z = bnode(T, key, extra); let y = null, x = T.root; while (x != null) { y = x; x = key < T.N[x].key ? T.N[x].l : T.N[x].r; } T.N[z].p = y; if (y == null) T.root = z; else if (key < T.N[y].key) T.N[y].l = z; else T.N[y].r = z; return z; }
export function fromLevel(list) {
  const T = BST(); if (!list.length || list[0] == null) return T;
  const ids = list.map(v => v == null ? null : bnode(T, v));
  T.root = ids[0]; let q = [ids[0]], k = 1;
  while (q.length && k < ids.length) { const x = q.shift(); const L = ids[k++], R = k < ids.length ? ids[k++] : null; if (L != null) { T.N[x].l = L; T.N[L].p = x; q.push(L); } if (R != null) { T.N[x].r = R; T.N[R].p = x; q.push(R); } }
  return T;
}
export const parseKeys = s => parseNums(s, { min: 1, max: 15, lo: -999, hi: 999 });

/* ---------------- tree basics & traversals ---------------- */
topic({
  id: 'tree-basics', title: 'Rooted trees and traversals', sec: '§10.4, §12.1, App. B.5', prereq: ['linked-lists', 'stacks-queues'],
  blurb: 'How trees are stored, the vocabulary, and the four traversal orders behind most tree problems.',
  cx: [['Any traversal', 'Θ(n)'], ['Recursion depth', 'O(h)']],
  props: ['Preorder', 'Inorder', 'Postorder', 'Level order'],
  tags: 'tree traversal preorder inorder postorder level order bfs dfs binary tree height depth',
  learn: `
<p>A <b>rooted tree</b> is a connected acyclic graph with one node chosen as the <b>root</b>. Every other node has exactly one <b>parent</b>. Nodes with no children are <b>leaves</b>. The <b>depth</b> of a node is the length of the path from the root to it; the <b>height</b> of a tree is the largest depth. A <b>binary tree</b> gives each node at most a left child and a right child, and distinguishes the two.</p>
<h3>Representing trees</h3>
<p>The book stores a binary tree with three pointers per node: <i>p</i>, <i>left</i> and <i>right</i>. For trees with any number of children it uses the <b>left-child, right-sibling</b> representation: each node points to its leftmost child and to its next sibling, so every node needs only two pointers no matter how many children it has. In interviews, a node usually has <code>left</code> and <code>right</code> and no parent pointer.</p>
<p>Some trees fit in arrays with no pointers at all: a <b>complete</b> binary tree stored level by level puts the children of index <i>i</i> at 2<i>i</i> and 2<i>i</i> + 1. Heaps and segment trees rely on this.</p>
<h3>The four traversals</h3>
<ul><li><b>Preorder</b> (node, left, right): copy or serialize a tree, since the root comes first.</li><li><b>Inorder</b> (left, node, right): on a binary search tree, prints keys in sorted order. The book's <code>inorderTreeWalk</code> takes Θ(<i>n</i>) time.</li><li><b>Postorder</b> (left, right, node): compute something from the children first, such as height, subtree sums, or freeing memory.</li><li><b>Level order</b> (breadth first): visit depth 0, then depth 1, and so on, using a queue. Right Side View (LC 199) and Zigzag (LC 103) are variants.</li></ul>
<div class="note key"><b>The one tree recursion template.</b> Most tree problems are “compute something for each subtree from its children's answers”: <code>def f(node): if not node: return base; L = f(node.left); R = f(node.right); return combine(node, L, R)</code>. Maximum depth (LC 104), diameter (LC 543), balanced check (LC 110), path sum (LC 112) and lowest common ancestor (LC 236) all fit.</div>
<h3>Iterative traversals</h3>
<p>Recursion uses O(<i>h</i>) stack space, which is O(<i>n</i>) for a degenerate tree. An explicit stack gives iterative preorder and inorder (Exercise 10.4-3). Morris traversal even does inorder in O(1) extra space by temporarily threading right pointers.</p>`,
  code: {
    pseudo: `inorderTreeWalk(x)
  if x ≠ nil
      inorderTreeWalk(x.left)
      visit(x)
      inorderTreeWalk(x.right)

preorder(x)
  if x ≠ nil
      visit(x)
      preorder(x.left)
      preorder(x.right)

postorder(x)
  if x ≠ nil
      postorder(x.left)
      postorder(x.right)
      visit(x)

levelOrder(root)
  Q ← empty queue; enqueue(Q, root)
  while Q is not empty
      x ← dequeue(Q)
      visit(x)
      for each child c of x, left then right
          enqueue(Q, c)`,
    py: `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def inorder(root):
    out, stack, node = [], [], root
    while stack or node:
        while node:                 # go as far left as possible
            stack.append(node)
            node = node.left
        node = stack.pop()
        out.append(node.val)
        node = node.right
    return out

def level_order(root):              # LeetCode 102
    if not root:
        return []
    out, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            x = q.popleft()
            level.append(x.val)
            if x.left: q.append(x.left)
            if x.right: q.append(x.right)
        out.append(level)
    return out

def max_depth(root):                # LeetCode 104
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))`,
    cpp: `#include <vector>
#include <queue>
#include <stack>
#include <algorithm>
using namespace std;

struct TreeNode { int val; TreeNode *left, *right; TreeNode(int v) : val(v), left(nullptr), right(nullptr) {} };

vector<int> inorder(TreeNode* root) {
    vector<int> out; stack<TreeNode*> st; TreeNode* node = root;
    while (node || !st.empty()) {
        while (node) { st.push(node); node = node->left; }
        node = st.top(); st.pop();
        out.push_back(node->val);
        node = node->right;
    }
    return out;
}

vector<vector<int>> levelOrder(TreeNode* root) {      // LeetCode 102
    vector<vector<int>> out; if (!root) return out;
    queue<TreeNode*> q; q.push(root);
    while (!q.empty()) {
        out.emplace_back();
        for (int k = q.size(); k > 0; k--) {
            TreeNode* x = q.front(); q.pop();
            out.back().push_back(x->val);
            if (x->left) q.push(x->left);
            if (x->right) q.push(x->right);
        }
    }
    return out;
}

int maxDepth(TreeNode* r) { return r ? 1 + max(maxDepth(r->left), maxDepth(r->right)) : 0; }`,
  },
  viz: {
    inputHint: 'order: level-order values with _ for gaps, e.g. inorder: 1 2 3 4 5 _ 6',
    presets: [
      { label: 'Inorder', input: 'inorder: 6 5 7 2 5 _ 8', note: 'Figure 12.1(a) is a BST, so inorder prints the keys sorted.' },
      { label: 'Preorder', input: 'preorder: 1 2 3 4 5 6 7', note: 'Root first, then the whole left subtree, then the right.' },
      { label: 'Postorder', input: 'postorder: 1 2 3 4 5 6 7', note: 'Children before parent: the root is printed last.' },
      { label: 'Level order', input: 'level: 3 9 20 _ _ 15 7', note: 'LeetCode 102’s example, using a queue.' },
    ],
    random: () => pick(['inorder', 'preorder', 'postorder', 'level']) + ': ' + Array.from({ length: rnd(6, 9) }, (_, i) => i && Math.random() < .15 ? '_' : rnd(1, 30)).join(' '),
    parse: s => { const m = /^\s*(inorder|preorder|postorder|level)\s*:(.*)$/i.exec(s); if (!m) throw new Error('Start with inorder:, preorder:, postorder: or level:.'); const vals = m[2].trim().split(/[\s,]+/).filter(Boolean).map(t => t === '_' || /^null$/i.test(t) ? null : Number(t)); if (vals.some(v => v != null && !isFinite(v))) throw new Error('Use numbers or _ for gaps.'); if (vals.length > 15) throw new Error('Use at most 15 positions.'); if (vals[0] == null) throw new Error('The root cannot be empty.'); return { order: m[1].toLowerCase(), vals }; },
    run({ order, vals }) {
      const R = Rec(), T = fromLevel(vals), N = T.N; const out = [], done = new Set();
      const seq = [];
      (function walk(x) { if (x == null) return; if (order === 'preorder') seq.push(x); walk(N[x].l); if (order === 'inorder') seq.push(x); walk(N[x].r); if (order === 'postorder') seq.push(x); })(order === 'level' ? null : T.root);
      if (order === 'level') { const q = [T.root]; while (q.length) { const x = q.shift(); seq.push(x); if (N[x].l != null) q.push(N[x].l); if (N[x].r != null) q.push(N[x].r); } }
      const st = (hl, extra = {}) => ({ tree: tsnap(T, { ...Object.fromEntries([...done].map(d => [d, 'ok'])), ...hl }), arrays: [{ name: 'out', label: 'Output', a: out.length ? [...out] : [null], small: true, noIdx: true }, ...(extra.q ? [{ name: 'q', label: 'Queue (front on the left)', a: extra.q.length ? extra.q.map(i => N[i].key) : [null], small: true, noIdx: true }] : [])] });
      const lineBase = { inorder: 4, preorder: 9, postorder: 17, level: 23 }[order];
      R.add(st({}), { inorder: 1, preorder: 7, postorder: 13, level: 19 }[order], `${order === 'level' ? 'Level-order' : order[0].toUpperCase() + order.slice(1)} traversal from the root.`);
      if (order === 'level') {
        const q = [T.root];
        R.add(st({ [T.root]: 'cmp' }, { q: [...q] }), 20, 'Enqueue the root.');
        let first = true;
        while (q.length) {
          const x = q.shift(); out.push(N[x].key); done.add(x);
          R.add(st({ [x]: 'cur' }, { q: [...q] }), 23, `Dequeue and print ${N[x].key}.`, first ? null : { q: 'Which node is printed next? Click it.', pick: 'n:' + x, hint: 'It is at the front of the queue.' });
          first = false;
          const kids = [N[x].l, N[x].r].filter(c => c != null);
          if (kids.length) { q.push(...kids); R.add(st({ [x]: 'cur', ...Object.fromEntries(kids.map(k => [k, 'cmp'])) }, { q: [...q] }), 25, `Enqueue its children: ${kids.map(k => N[k].key).join(', ')}.`); }
        }
      } else {
        seq.forEach((x, i) => {
          out.push(N[x].key); done.add(x);
          R.add(st({ [x]: 'cur' }), lineBase, `Print ${N[x].key}.`, i === 0 || Math.random() < .7 ? { q: `Which node does ${order} print ${i === 0 ? 'first' : 'next'}? Click it.`, pick: 'n:' + x, hint: order === 'inorder' ? 'Left subtree first, then the node, then the right subtree.' : order === 'preorder' ? 'The node first, then its left subtree.' : 'Both subtrees before the node.' } : null);
        });
      }
      R.add(st({}), lineBase, `Done: ${out.join(', ')}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'Which traversal of a binary search tree outputs the keys in sorted order?', opts: ['Preorder', 'Inorder', 'Postorder', 'Level order'], a: 1, why: 'Left subtree keys are smaller and right subtree keys are larger, so left-node-right is sorted.' },
    { q: 'To compute each subtree’s height from its children, which order do you process nodes in?', opts: ['Preorder', 'Inorder', 'Postorder', 'Random'], a: 2, why: 'A node needs its children’s heights first.' },
    { q: 'Level-order traversal uses…', opts: ['a stack', 'a queue', 'recursion only', 'a heap'], a: 1, why: 'It is breadth-first search on the tree.' },
    { q: 'The left-child, right-sibling representation uses how many pointers per node (besides the parent)?', opts: ['One per child', 'Two', 'Three', 'It varies'], a: 1, why: 'Leftmost child and next sibling.' },
    { q: 'Recursive traversal of a degenerate (path-shaped) tree of n nodes uses stack space…', opts: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], a: 2, why: 'Recursion depth equals the height, which is n − 1.' },
  ],
});

/* ---------------- BST ---------------- */
topic({
  id: 'bst', title: 'Binary search trees', sec: '§12.1–12.3', prereq: ['tree-basics', 'binary-search'],
  blurb: 'Keep keys ordered in a tree so search, insert and delete cost the height of the tree.',
  cx: [['Search, insert, delete', 'O(h)'], ['Balanced h', 'O(lg n)'], ['Degenerate h', 'O(n)']],
  props: ['Ordered', 'Dynamic set'],
  tags: 'binary search tree bst insert delete successor predecessor minimum maximum transplant',
  learn: `
<p>A <b>binary search tree</b> stores keys so that for every node <i>x</i>, all keys in <i>x</i>'s left subtree are ≤ <i>x.key</i> and all keys in the right subtree are ≥ <i>x.key</i>. That ordering lets every query walk a single root-to-leaf path, so each operation costs O(<i>h</i>), where <i>h</i> is the tree's height.</p>
<h3>Queries</h3>
<ul><li><code>treeSearch</code>(<i>x</i>, <i>k</i>): compare <i>k</i> with <i>x.key</i>; go left if smaller, right if larger, stop on equality or NIL. It is binary search on a linked structure.</li><li><code>treeMinimum</code> follows left pointers to the end; <code>treeMaximum</code> follows right pointers.</li><li><code>treeSuccessor</code>(<i>x</i>): if <i>x</i> has a right subtree, the successor is that subtree's minimum. Otherwise climb until you move up from a left child; that parent is the successor (LC 285).</li></ul>
<h3>Insertion</h3>
<p>Search for the key, keeping a trailing pointer <i>y</i> to the last node visited. When the search falls off the tree, attach the new node as the left or right child of <i>y</i>. New keys always become leaves.</p>
<h3>Deletion</h3>
<p>Deleting node <i>z</i> has three cases, handled with a helper <code>transplant</code> that replaces one subtree with another:</p>
<ol><li><i>z</i> has no left child: replace <i>z</i> by its right child (which may be NIL).</li><li><i>z</i> has a left child but no right child: replace <i>z</i> by its left child.</li><li><i>z</i> has two children: find its successor <i>y</i>, the minimum of the right subtree, which has no left child. Splice <i>y</i> out of its position (replacing it by its own right child), then put <i>y</i> where <i>z</i> was, taking over <i>z</i>'s children.</li></ol>
<h3>Height is everything</h3>
<p>Insert keys in sorted order and the tree degenerates into a path of height <i>n</i> − 1, so every operation is linear. The book shows that a BST built from a random permutation has expected height O(lg <i>n</i>) (Section 12.4), but you cannot count on random input. <b>Balanced</b> trees, such as <a href="/learn/red-black">red-black</a> and <a href="/learn/avl">AVL</a> trees, rotate nodes to guarantee O(lg <i>n</i>) height. C++'s <code>std::map</code> and Java's <code>TreeMap</code> are red-black trees.</p>
<h3>In interviews</h3>
<ul><li>Validate a BST (LC 98): pass down the allowed (low, high) range, or check that the inorder sequence is increasing.</li><li>Kth Smallest in a BST (LC 230): inorder and stop at k.</li><li>Lowest Common Ancestor in a BST (LC 235): walk down until the two keys split.</li><li>Delete Node in a BST (LC 450) is exactly the book's three cases.</li></ul>`,
  code: {
    pseudo: `treeSearch(x, k)
  while x ≠ nil and k ≠ x.key
      if k < x.key
          x ← x.left
      else x ← x.right
  return x

treeInsert(T, z)
  y ← nil
  x ← T.root
  while x ≠ nil
      y ← x
      if z.key < x.key
          x ← x.left
      else x ← x.right
  z.p ← y
  if y = nil
      T.root ← z          // empty tree
  else if z.key < y.key
      y.left ← z
  else y.right ← z

transplant(T, u, v)
  if u.p = nil
      T.root ← v
  else if u = u.p.left
      u.p.left ← v
  else u.p.right ← v
  if v ≠ nil
      v.p ← u.p

treeDelete(T, z)
  if z.left = nil
      transplant(T, z, z.right)
  else if z.right = nil
      transplant(T, z, z.left)
  else y ← treeMinimum(z.right)
      if y.p ≠ z
          transplant(T, y, y.right)
          y.right ← z.right
          y.right.p ← y
      transplant(T, z, y)
      y.left ← z.left
      y.left.p ← y`,
    py: `class Node:
    def __init__(self, key):
        self.key, self.left, self.right = key, None, None

def search(root, k):
    while root and root.key != k:
        root = root.left if k < root.key else root.right
    return root

def insert(root, k):
    if root is None:
        return Node(k)
    if k < root.key:
        root.left = insert(root.left, k)
    else:
        root.right = insert(root.right, k)
    return root

def delete(root, k):                       # LeetCode 450
    if root is None:
        return None
    if k < root.key:
        root.left = delete(root.left, k)
    elif k > root.key:
        root.right = delete(root.right, k)
    else:
        if root.left is None:
            return root.right
        if root.right is None:
            return root.left
        succ = root.right
        while succ.left:
            succ = succ.left
        root.key = succ.key                 # copy successor, delete it below
        root.right = delete(root.right, succ.key)
    return root

def is_valid_bst(node, lo=float('-inf'), hi=float('inf')):   # LeetCode 98
    if not node:
        return True
    return lo < node.key < hi and is_valid_bst(node.left, lo, node.key) \\
        and is_valid_bst(node.right, node.key, hi)`,
    cpp: `#include <climits>
struct Node { int key; Node *left = nullptr, *right = nullptr; Node(int k) : key(k) {} };

Node* search(Node* x, int k) {
    while (x && x->key != k) x = k < x->key ? x->left : x->right;
    return x;
}

Node* insert(Node* root, int k) {
    if (!root) return new Node(k);
    if (k < root->key) root->left = insert(root->left, k);
    else root->right = insert(root->right, k);
    return root;
}

Node* erase(Node* root, int k) {                 // LeetCode 450
    if (!root) return nullptr;
    if (k < root->key) root->left = erase(root->left, k);
    else if (k > root->key) root->right = erase(root->right, k);
    else {
        if (!root->left) { Node* r = root->right; delete root; return r; }
        if (!root->right) { Node* l = root->left; delete root; return l; }
        Node* s = root->right;
        while (s->left) s = s->left;
        root->key = s->key;
        root->right = erase(root->right, s->key);
    }
    return root;
}`,
  },
  viz: {
    inputHint: 'Keys to insert | search k, insert k, delete k',
    presets: [
      { label: 'Figure 12.2', input: '15 6 18 3 7 17 20 2 4 13 9 | search 13, insert 14, delete 6', note: 'The book’s search tree. Deleting 6 uses its successor 7.' },
      { label: 'All three delete cases', input: '50 30 70 20 40 60 80 35 | delete 20, delete 30, delete 50', note: 'A leaf, a node with one child, then a node with two children.' },
      { label: 'Sorted input degenerates', input: '1 2 3 4 5 6 | search 6', note: 'Inserting sorted keys builds a path of height n − 1.' },
    ],
    random: () => { const a = uniqArr(rnd(7, 9), 1, 60); return a.join(' ') + ' | ' + `search ${pick(a)}, insert ${rnd(61, 99)}, delete ${pick(a.slice(0, 4))}`; },
    parse: s => { const [v, o] = s.split('|'); return { a: parseKeys(v), ops: parseOps(o || '', ['search', 'insert', 'delete']) }; },
    run({ a, ops }) {
      const R = Rec(), T = BST(), N = T.N;
      a.forEach(k => bstInsertQuiet(T, k));
      const st = hl => ({ tree: tsnap(T, hl) });
      R.add(st({}), 8, `A BST built by inserting ${a.join(', ')}.`);
      const findPath = k => { const p = []; let x = T.root; while (x != null && N[x].key !== k) { p.push(x); x = k < N[x].key ? N[x].l : N[x].r; } return [p, x]; };
      for (const [op, k] of ops) {
        if (op === 'search' || op === 'insert') {
          let x = T.root, y = null, seen = [];
          while (x != null && !(op === 'search' && N[x].key === k)) {
            const goL = k < N[x].key;
            R.add(st({ ...Object.fromEntries(seen.map(s => [s, 'dim'])), [x]: 'cmp' }), op === 'search' ? 3 : 13, `${k} ${goL ? '<' : (k === N[x].key ? '=' : '>')} ${N[x].key}: go ${goL ? 'left' : 'right'}.`, Math.random() < .55 ? { q: `${op === 'search' ? 'Searching' : 'Inserting'} ${k}. At node ${N[x].key}, which way?`, choices: ['Go left', 'Go right'], answer: goL ? 0 : 1 } : null);
            seen.push(x); y = x; x = goL ? N[x].l : N[x].r;
          }
          if (op === 'search') R.add(st(x != null ? { [x]: 'found' } : {}), 6, x != null ? `Found ${k} after ${seen.length + 1} comparison${seen.length ? 's' : ''}.` : `Fell off the tree: ${k} is not present.`);
          else { const z = bnode(T, k); N[z].p = y; if (y == null) T.root = z; else if (k < N[y].key) N[y].l = z; else N[y].r = z; R.add(st({ [z]: 'cur' }), y == null ? 18 : k < N[y].key ? 20 : 21, `Attach ${k} as the ${y == null ? 'root' : (k < N[y].key ? 'left' : 'right') + ' child of ' + N[y].key}. New keys are always leaves.`); }
        } else {
          const [, z] = findPath(k);
          if (z == null) { R.add(st({}), 32, `${k} is not in the tree.`); continue; }
          const zl = N[z].l, zr = N[z].r;
          const cas = zl == null ? 0 : zr == null ? 1 : 2;
          const transplant = (u, v) => { if (N[u].p == null) T.root = v; else if (N[N[u].p].l === u) N[N[u].p].l = v; else N[N[u].p].r = v; if (v != null) N[v].p = N[u].p; };
          R.add(st({ [z]: 'cur' }), 32, `Delete ${k}.`, { q: `Deleting ${k}. Which case applies?`, choices: ['No left child: replace by right child', 'Only a left child: replace by left child', 'Two children: use the successor'], answer: cas });
          if (cas === 0) { transplant(z, zr); delete N[z]; R.add(st(zr != null ? { [zr]: 'ok' } : {}), 34, zr != null ? `Replace ${k} by its right subtree.` : `${k} was a leaf. Remove it.`); }
          else if (cas === 1) { transplant(z, zl); delete N[z]; R.add(st({ [zl]: 'ok' }), 36, `Replace ${k} by its left subtree.`); }
          else {
            let y = zr; while (N[y].l != null) y = N[y].l;
            R.add(st({ [z]: 'cur', [y]: 'cmp' }), 37, `Successor y = ${N[y].key}, the minimum of ${k}'s right subtree. It has no left child.`, { q: `Click the successor of ${k}.`, pick: 'n:' + y, hint: 'Go right once, then left as far as possible.' });
            if (N[y].p !== z) { transplant(y, N[y].r); N[y].r = N[z].r; N[N[y].r].p = y; R.add(st({ [z]: 'cur', [y]: 'cmp' }), 39, `Splice ${N[y].key} out, replacing it by its right child, and give it ${k}'s right subtree.`); }
            transplant(z, y); N[y].l = N[z].l; N[N[y].l].p = y; delete N[z];
            R.add(st({ [y]: 'ok' }), 42, `${N[y].key} takes ${k}'s place. Order is preserved.`);
          }
        }
      }
      return R.f;
    },
  },
  quiz: [
    { q: 'Inserting the keys 1, 2, 3, …, n in order into an empty BST gives height…', opts: ['O(1)', 'O(lg n)', 'n − 1', 'n/2'], a: 2, why: 'Every key goes to the right of the last, forming a path.' },
    { q: 'If a node has a right subtree, its successor is…', opts: ['its parent', 'the minimum of its right subtree', 'the maximum of its left subtree', 'its right child'], a: 1, why: 'The smallest key larger than x lives in x’s right subtree, as far left as possible.' },
    { q: 'When deleting a node z with two children, why is its successor easy to remove?', opts: ['It is a leaf', 'It has no left child', 'It is the root', 'It has no right child'], a: 1, why: 'It is the minimum of a subtree, so it has no left child.' },
    { q: 'A correct BST validation must check that…', opts: ['each node is greater than its left child and less than its right child', 'every key in the left subtree is less than the node and every key in the right subtree is greater', 'the tree is balanced', 'the inorder walk visits n nodes'], a: 1, why: 'Checking only direct children misses violations deeper down. Pass a valid range down the recursion.' },
    { q: 'Expected height of a BST built by inserting a random permutation of n keys is…', opts: ['O(1)', 'O(lg n)', 'O(√n)', 'O(n)'], a: 1, why: 'Section 12.4 proves it.' },
  ],
});

/* ---------------- red-black ---------------- */
topic({
  id: 'red-black', title: 'Red-black trees', sec: '§13.1–13.4', prereq: ['bst'],
  blurb: 'A self-balancing BST that uses node colors and rotations to keep height under 2 lg(n + 1).',
  cx: [['Search, insert, delete', 'O(lg n)'], ['Height', '≤ 2 lg(n + 1)'], ['Rotations per insert', '≤ 2']],
  props: ['Balanced', 'Used by std::map, TreeMap'],
  tags: 'red black tree rotation balanced bst insert fixup',
  learn: `
<p>A red-black tree is a binary search tree with one extra bit per node, its <b>color</b>, and five rules that keep the tree approximately balanced:</p>
<ol><li>Every node is red or black.</li><li>The root is black.</li><li>Every leaf (NIL) is black.</li><li>If a node is red, both its children are black. No two reds in a row.</li><li>For each node, every simple path down to a descendant leaf contains the same number of black nodes, its <b>black-height</b>.</li></ol>
<p>Rules 4 and 5 together force balance: the longest path (alternating red and black) is at most twice the shortest (all black). Lemma 13.1 turns that into a bound: a red-black tree with <i>n</i> internal nodes has height at most 2 lg(<i>n</i> + 1). So search, minimum, successor and the rest are O(lg <i>n</i>).</p>
<h3>Rotations</h3>
<p>A <b>left rotation</b> on <i>x</i> pivots around the link to its right child <i>y</i>: <i>y</i> becomes the subtree's root, <i>x</i> becomes <i>y</i>'s left child, and <i>y</i>'s old left subtree becomes <i>x</i>'s right subtree. It changes a constant number of pointers, runs in O(1) and preserves the BST ordering. A right rotation is the mirror image.</p>
<h3>Insertion</h3>
<p>Insert <i>z</i> as in an ordinary BST and color it <b>red</b>. That never breaks rule 5, but it may break rule 2 (if <i>z</i> is the root) or rule 4 (if <i>z</i>'s parent is red). <code>rbInsertFixup</code> repairs rule 4 by looking at <i>z</i>'s <b>uncle</b> <i>y</i>. Assuming <i>z</i>'s parent is a left child:</p>
<ul><li><b>Case 1, the uncle is red.</b> Recolor: parent and uncle become black, grandparent becomes red. The violation may move up two levels, so set <i>z</i> to the grandparent and loop.</li><li><b>Case 2, the uncle is black and <i>z</i> is a right child</b> (a “triangle”). Left-rotate at the parent. This turns it into case 3.</li><li><b>Case 3, the uncle is black and <i>z</i> is a left child</b> (a “line”). Recolor the parent black and the grandparent red, then right-rotate at the grandparent. Done.</li></ul>
<p>The mirror cases apply when the parent is a right child. Case 1 can repeat up the tree, but cases 2 and 3 run at most once, so insertion makes <b>at most two rotations</b>. Finally the root is colored black.</p>
<h3>Deletion</h3>
<p>Deletion follows <code>treeDelete</code>, but if the node removed or moved was black, some path loses a black node. The book gives <i>x</i>, the node that took its place, an “extra black” and pushes it up the tree with four cases (based on <i>x</i>'s sibling <i>w</i>) until it can be absorbed. At most three rotations happen.</p>
<h3>In practice</h3>
<ul><li>C++ <code>std::map</code> and <code>std::set</code>, Java <code>TreeMap</code>, and the Linux kernel's scheduler use red-black trees.</li><li>Interviews rarely ask you to code one. They do ask what an ordered map gives you: O(log <i>n</i>) insert, delete, floor, ceiling and in-order iteration. Python has no built-in; use <code>sortedcontainers.SortedList</code> or <code>bisect</code> on a list.</li><li>Compared with <a href="/learn/avl">AVL trees</a>: AVL trees are more strictly balanced (faster lookups); red-black trees rotate less on updates.</li></ul>`,
  code: {
    pseudo: `leftRotate(T, x)
  y ← x.right
  x.right ← y.left
  if y.left ≠ T.nil
      y.left.p ← x
  y.p ← x.p
  if x.p = T.nil
      T.root ← y
  else if x = x.p.left
      x.p.left ← y
  else x.p.right ← y
  y.left ← x
  x.p ← y

rbInsert(T, z)
  treeInsert(T, z)        // plain BST insert, T.nil as leaves
  z.left ← T.nil
  z.right ← T.nil
  z.color ← red
  rbInsertFixup(T, z)

rbInsertFixup(T, z)
  while z.p.color = red
      if z.p = z.p.p.left
          y ← z.p.p.right
          if y.color = red
              z.p.color ← black            // case 1
              y.color ← black              // case 1
              z.p.p.color ← red            // case 1
              z ← z.p.p                    // case 1
          else if z = z.p.right
                  z ← z.p                  // case 2
                  leftRotate(T, z)        // case 2
              z.p.color ← black            // case 3
              z.p.p.color ← red            // case 3
              rightRotate(T, z.p.p)       // case 3
      else mirror image of the branch above (left ↔ right)
  T.root.color ← black`,
    py: `RED, BLACK = 0, 1

class Node:
    def __init__(self, key, color=RED, nil=None):
        self.key, self.color = key, color
        self.left = self.right = self.p = nil

class RBTree:
    def __init__(self):
        self.nil = Node(None, BLACK)
        self.root = self.nil

    def _rotate_left(self, x):
        y = x.right
        x.right = y.left
        if y.left is not self.nil: y.left.p = x
        y.p = x.p
        if x.p is self.nil: self.root = y
        elif x is x.p.left: x.p.left = y
        else: x.p.right = y
        y.left, x.p = x, y

    def _rotate_right(self, x):
        y = x.left
        x.left = y.right
        if y.right is not self.nil: y.right.p = x
        y.p = x.p
        if x.p is self.nil: self.root = y
        elif x is x.p.right: x.p.right = y
        else: x.p.left = y
        y.right, x.p = x, y

    def insert(self, key):
        z = Node(key, RED, self.nil)
        y, x = self.nil, self.root
        while x is not self.nil:
            y = x
            x = x.left if key < x.key else x.right
        z.p = y
        if y is self.nil: self.root = z
        elif key < y.key: y.left = z
        else: y.right = z
        self._fixup(z)

    def _fixup(self, z):
        while z.p.color == RED:
            g = z.p.p
            if z.p is g.left:
                y = g.right
                if y.color == RED:                       # case 1
                    z.p.color = y.color = BLACK
                    g.color = RED
                    z = g
                else:
                    if z is z.p.right:                   # case 2
                        z = z.p
                        self._rotate_left(z)
                    z.p.color, g.color = BLACK, RED      # case 3
                    self._rotate_right(g)
            else:                                        # mirror image
                y = g.left
                if y.color == RED:
                    z.p.color = y.color = BLACK
                    g.color = RED
                    z = g
                else:
                    if z is z.p.left:
                        z = z.p
                        self._rotate_right(z)
                    z.p.color, g.color = BLACK, RED
                    self._rotate_left(g)
        self.root.color = BLACK`,
    cpp: `// In practice, use the standard library's red-black tree:
#include <map>
#include <set>
#include <iostream>
using namespace std;

int main() {
    map<int, string> m;              // ordered map, O(log n) operations
    m[41] = "a"; m[38] = "b"; m[31] = "c";
    auto it = m.lower_bound(35);     // first key >= 35  -> 38
    cout << it->first << "\\n";
    set<int> s = {12, 19, 8};
    auto fl = prev(s.upper_bound(15));   // floor(15) -> 12
    cout << *fl << "\\n";
    for (auto& [k, v] : m) cout << k << " ";   // in-order: 31 38 41
}`,
  },
  viz: {
    inputHint: 'Keys to insert, one at a time',
    presets: [
      { label: 'Exercise 13.3-2', input: '41 38 31 12 19 8', note: 'The book asks you to draw the tree after each of these inserts.' },
      { label: 'Ascending keys', input: '1 2 3 4 5 6 7 8 9 10', note: 'A plain BST would become a path. The red-black tree stays shallow.' },
      { label: 'Figure 13.4 style', input: '11 2 14 1 7 15 5 8 4', note: 'Inserting 4 last triggers case 1, then case 2, then case 3.' },
    ],
    random: () => uniqArr(rnd(7, 10), 1, 60).join(' '),
    parse: s => parseNums(s, { min: 1, max: 15, lo: -999, hi: 999 }),
    run(keys) {
      const R = Rec(), T = BST(), N = T.N;
      const col = id => id == null ? 'black' : N[id].color;
      const st = hl => ({ tree: tsnap(T, hl) });
      R.add(st({}), 15, 'An empty red-black tree.');
      for (const k of keys) {
        const z = bstInsertQuiet(T, k, { color: 'red' });
        R.add(st({ [z]: 'cur' }), 19, `Insert ${k} as in a BST and color it red.`);
        let x = z;
        while (N[x].p != null && col(N[x].p) === 'red') {
          const p = N[x].p, g = N[p].p, leftSide = p === N[g].l, y = leftSide ? N[g].r : N[g].l;
          const inner = leftSide ? x === N[p].r : x === N[p].l;
          const cas = col(y) === 'red' ? 0 : inner ? 1 : 2;
          const ask = { q: `${N[x].key} and its parent ${N[p].key} are both red. The uncle is ${y == null ? 'NIL (black)' : N[y].key + ' (' + col(y) + ')'}. Which case applies?`, choices: ['Case 1: uncle is red', 'Case 2: uncle black, z is an inner child', 'Case 3: uncle black, z is an outer child'], answer: cas, hint: 'Look at the uncle’s color first, then at the shape z, parent, grandparent make.' };
          R.add(st({ [x]: 'cur', [p]: 'cmp', ...(y != null ? { [y]: 'cmp' } : {}) }), 23, `Red ${N[x].key} has a red parent ${N[p].key}: rule 4 is broken. Uncle: ${y == null ? 'NIL (black)' : N[y].key}.`);
          if (cas === 0) {
            N[p].color = 'black'; N[y].color = 'black'; N[g].color = 'red';
            R.add(st({ [g]: 'cur' }), 27, `Case 1: recolor ${N[p].key} and ${N[y].key} black and ${N[g].key} red. Continue from the grandparent.`, ask);
            x = g;
          } else {
            if (cas === 1) {
              x = p; leftSide ? rotL(T, x) : rotR(T, x);
              R.add(st({ [x]: 'cur' }), 33, `Case 2: ${leftSide ? 'left' : 'right'}-rotate at ${N[x].key}. Now the reds form a straight line: case 3.`, ask);
            }
            const p2 = N[x].p, g2 = N[p2].p;
            N[p2].color = 'black'; N[g2].color = 'red';
            leftSide ? rotR(T, g2) : rotL(T, g2);
            R.add(st({ [p2]: 'ok' }), 36, `Case 3: color ${N[p2].key} black and ${N[g2].key} red, then ${leftSide ? 'right' : 'left'}-rotate at ${N[g2].key}.`, cas === 2 ? ask : null);
          }
        }
        if (N[T.root].color === 'red') { N[T.root].color = 'black'; R.add(st({ [T.root]: 'ok' }), 38, 'Color the root black (rule 2).'); }
        else R.add(st({}), 38, `${k} inserted. All five properties hold.`);
      }
      let h = 0; (function d(x, dep) { if (x == null) return; h = Math.max(h, dep); d(N[x].l, dep + 1); d(N[x].r, dep + 1); })(T.root, 0);
      R.add(st({}), 38, `Final height ${h} for ${keys.length} keys. The bound is 2 lg(n + 1) = ${(2 * Math.log2(keys.length + 1)).toFixed(1)}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'Why is a newly inserted node colored red rather than black?', opts: ['Red nodes are faster', 'A red node cannot break the black-height rule', 'The root must be red', 'Black is reserved for NIL'], a: 1, why: 'Adding a black node would add one to the black-height of some paths only. A red node can break only the no-red-red rule, which is easier to fix.' },
    { q: 'At most how many rotations does RB-INSERT perform?', opts: ['1', '2', 'O(lg n)', 'O(n)'], a: 1, why: 'Case 1 only recolors. Cases 2 and 3 run once, then the loop ends.' },
    { q: 'The height of a red-black tree with n internal nodes is at most…', opts: ['lg n', '2 lg(n + 1)', 'n/2', '1.44 lg n'], a: 1, why: 'Lemma 13.1. (1.44 lg n is the AVL bound.)' },
    { q: 'In RB-INSERT-FIXUP, if the uncle is red you…', opts: ['rotate at the grandparent', 'recolor parent and uncle black, grandparent red, and move up', 'stop immediately', 'delete the node'], a: 1, why: 'That is case 1. The problem may reappear two levels up.' },
    { q: 'Which standard library container is typically a red-black tree?', opts: ['Python dict', 'C++ std::map', 'C++ std::unordered_map', 'Java ArrayList'], a: 1, why: 'Ordered associative containers in C++ and Java’s TreeMap use red-black trees.' },
  ],
});

/* ---------------- AVL ---------------- */
topic({
  id: 'avl', title: 'AVL trees', sec: 'Problem 13-3', prereq: ['bst'],
  blurb: 'A height-balanced BST: every node’s subtrees differ in height by at most one.',
  cx: [['Search, insert, delete', 'O(lg n)'], ['Height', '< 1.44 lg(n + 2)']],
  props: ['Strictly balanced', 'Four rotation cases'],
  tags: 'avl tree balance factor rotation left right height balanced',
  learn: `
<p>AVL trees (Adelson-Velsky and Landis, 1962) were the first self-balancing BSTs. The book introduces them in Problem 13-3. Every node stores its <b>height</b>, and the tree keeps this invariant:</p>
<div class="note key">For every node, the heights of its left and right subtrees differ by at most 1. The difference is the node's <b>balance factor</b>.</div>
<p>A tree that satisfies this has height O(lg <i>n</i>). The proof uses Fibonacci numbers: the fewest nodes in an AVL tree of height <i>h</i> satisfies <i>N</i>(<i>h</i>) = <i>N</i>(<i>h</i> − 1) + <i>N</i>(<i>h</i> − 2) + 1, which grows like φ<sup><i>h</i></sup>, so <i>h</i> &lt; 1.44 lg(<i>n</i> + 2).</p>
<h3>Insertion</h3>
<p>Insert as in a BST, then walk back up toward the root updating heights. The first node whose balance factor becomes ±2 is rebalanced with one of four rotations:</p>
<table><tr><th>Shape</th><th>Where the new key went</th><th>Fix</th></tr>
<tr><td>Left-Left</td><td>left subtree of the left child</td><td>right rotation at the node</td></tr>
<tr><td>Right-Right</td><td>right subtree of the right child</td><td>left rotation at the node</td></tr>
<tr><td>Left-Right</td><td>right subtree of the left child</td><td>left-rotate the child, then right-rotate the node</td></tr>
<tr><td>Right-Left</td><td>left subtree of the right child</td><td>right-rotate the child, then left-rotate the node</td></tr></table>
<p>One single or double rotation restores the subtree to the height it had before the insertion, so nothing above needs fixing. Deletion can require rotations at several levels on the way up, still O(lg <i>n</i>) in total.</p>
<h3>AVL or red-black?</h3>
<p>AVL trees are shallower, so lookups are a little faster. Red-black trees do fewer rotations per update. Databases with read-heavy workloads sometimes prefer AVL; most standard libraries chose red-black.</p>
<h3>In interviews</h3>
<ul><li>Balanced Binary Tree (LC 110) checks exactly the AVL condition with a postorder height computation.</li><li>Convert Sorted Array to BST (LC 108): pick the middle element as root recursively; the result is height balanced.</li></ul>`,
  code: {
    pseudo: `avlInsert(x, z)
  if x = nil
      return z                      // new leaf, height 0
  if z.key < x.key
      x.left ← avlInsert(x.left, z)
  else x.right ← avlInsert(x.right, z)
  x.h ← 1 + max(x.left.h, x.right.h)
  return balance(x)

balance(x)                          // NIL has height -1
  if x.left.h - x.right.h = 2            // left heavy
      if x.left.left.h < x.left.right.h   // left-right case
          x.left ← leftRotate(x.left)
      return rightRotate(x)
  if x.right.h - x.left.h = 2            // right heavy
      if x.right.right.h < x.right.left.h // right-left case
          x.right ← rightRotate(x.right)
      return leftRotate(x)
  return x`,
    py: `class Node:
    def __init__(self, key):
        self.key, self.left, self.right, self.h = key, None, None, 0

def h(n): return n.h if n else -1
def fix(n): n.h = 1 + max(h(n.left), h(n.right))

def rot_right(x):
    y = x.left
    x.left, y.right = y.right, x
    fix(x); fix(y)
    return y

def rot_left(x):
    y = x.right
    x.right, y.left = y.left, x
    fix(x); fix(y)
    return y

def insert(x, key):
    if x is None:
        return Node(key)
    if key < x.key:
        x.left = insert(x.left, key)
    else:
        x.right = insert(x.right, key)
    fix(x)
    if h(x.left) - h(x.right) == 2:
        if h(x.left.left) < h(x.left.right):
            x.left = rot_left(x.left)          # left-right
        return rot_right(x)
    if h(x.right) - h(x.left) == 2:
        if h(x.right.right) < h(x.right.left):
            x.right = rot_right(x.right)       # right-left
        return rot_left(x)
    return x`,
    cpp: `#include <algorithm>
using namespace std;

struct Node { int key, h = 0; Node *left = nullptr, *right = nullptr; Node(int k) : key(k) {} };
int ht(Node* n) { return n ? n->h : -1; }
void fix(Node* n) { n->h = 1 + max(ht(n->left), ht(n->right)); }
Node* rotRight(Node* x) { Node* y = x->left; x->left = y->right; y->right = x; fix(x); fix(y); return y; }
Node* rotLeft(Node* x)  { Node* y = x->right; x->right = y->left; y->left = x; fix(x); fix(y); return y; }

Node* insert(Node* x, int key) {
    if (!x) return new Node(key);
    if (key < x->key) x->left = insert(x->left, key);
    else x->right = insert(x->right, key);
    fix(x);
    if (ht(x->left) - ht(x->right) == 2) {
        if (ht(x->left->left) < ht(x->left->right)) x->left = rotLeft(x->left);
        return rotRight(x);
    }
    if (ht(x->right) - ht(x->left) == 2) {
        if (ht(x->right->right) < ht(x->right->left)) x->right = rotRight(x->right);
        return rotLeft(x);
    }
    return x;
}`,
  },
  viz: {
    inputHint: 'Keys to insert',
    presets: [
      { label: 'All four rotations', input: '30 20 10 40 50 5 7 60 55', note: 'LL at 30, RR at 30, LR at 10, then RL at 50. Notes show each node’s balance factor.' },
      { label: 'Ascending keys', input: '1 2 3 4 5 6 7', note: 'Repeated left rotations build a perfect tree.' },
    ],
    random: () => uniqArr(rnd(7, 10), 1, 60).join(' '),
    parse: s => parseNums(s, { min: 1, max: 15, lo: -999, hi: 999 }),
    run(keys) {
      const R = Rec(), T = BST(), N = T.N;
      const H = x => x == null ? -1 : N[x].h, fix = x => { N[x].h = 1 + Math.max(H(N[x].l), H(N[x].r)); };
      const bf = n => H(n.l) - H(n.r);
      const st = hl => ({ tree: tsnap(T, hl, n => 'bf ' + (bf(n) > 0 ? '+' : '') + bf(n)) });
      const rr = x => { const y = N[x].l; N[x].l = N[y].r; N[y].r = x; fix(x); fix(y); return y; };
      const rl = x => { const y = N[x].r; N[x].r = N[y].l; N[y].l = x; fix(x); fix(y); return y; };
      R.add(st({}), 1, 'Empty AVL tree. Notes show each node’s balance factor (left height minus right height).');
      for (const k of keys) {
        let newId;
        // run insert with a wrapper that resolves rotation results up the recursion
        const rec = (x) => {
          if (x == null) { newId = bnode(T, k, { h: 0 }); return newId; }
          if (k < N[x].key) N[x].l = rec(N[x].l); else N[x].r = rec(N[x].r);
          fix(x);
          const b = H(N[x].l) - H(N[x].r);
          if (Math.abs(b) < 2) return x;
          const typ = b === 2 ? (H(N[N[x].l].l) < H(N[N[x].l].r) ? 2 : 0) : (H(N[N[x].r].r) < H(N[N[x].r].l) ? 3 : 1);
          const names = ['Left-Left: right rotation', 'Right-Right: left rotation', 'Left-Right: rotate child left, then node right', 'Right-Left: rotate child right, then node left'];
          pending = { x, typ, names, b };
          let y;
          if (typ === 0) y = rr(x); else if (typ === 1) y = rl(x); else if (typ === 2) { N[x].l = rl(N[x].l); y = rr(x); } else { N[x].r = rr(N[x].r); y = rl(x); }
          pending.y = y;
          return y;
        };
        let pending = null;
        // first show the plain BST insert, then rebalance
        const snapBefore = () => { const save = JSON.stringify({ N: T.N, root: T.root, nid: T.nid }); return save; };
        const before = snapBefore();
        T.root = rec(T.root);
        if (pending) {
          const after = JSON.stringify({ N: T.N, root: T.root, nid: T.nid });
          const restore = s => { const o = JSON.parse(s); for (const kk in T.N) delete T.N[kk]; Object.assign(T.N, o.N); T.root = o.root; T.nid = o.nid; };
          restore(before);
          // plain insert without rebalancing, for display
          const z = bstInsertQuiet(T, k, { h: 0 });
          (function upd(x) { if (x == null) return -1; N[x].h = 1 + Math.max(upd(N[x].l), upd(N[x].r)); return N[x].h; })(T.root);
          R.add(st({ [z]: 'cur' }), 3, `Insert ${k} as a BST leaf and update heights on the way up.`);
          const xKey = pending.x;
          R.add(st({ [xKey]: 'warn', [z]: 'cmp' }), pending.b === 2 ? 11 : 15, `Node ${N[xKey] ? N[xKey].key : ''} now has balance factor ${pending.b > 0 ? '+' : ''}${pending.b}. It must be rebalanced.`);
          restore(after);
          R.add(st({ [pending.y]: 'ok' }), [14, 18, 13, 17][pending.typ], `${pending.names[pending.typ]}. The subtree is balanced again, and its height is what it was before the insert.`, { q: `Node ${N[xKey].key} is unbalanced. Which fix applies?`, choices: pending.names, answer: pending.typ, hint: 'Trace the two steps from the unbalanced node toward the new key.' });
        } else R.add(st({ [newId]: 'cur' }), 3, `Insert ${k}. Every balance factor is still −1, 0 or +1.`);
      }
      return R.f;
    },
  },
  quiz: [
    { q: 'An AVL node has balance factor +2 and its left child has balance factor −1. Which fix?', opts: ['Single right rotation', 'Single left rotation', 'Left-rotate the left child, then right-rotate the node', 'Recolor'], a: 2, why: 'That is the Left-Right case, a double rotation.' },
    { q: 'The height of an AVL tree with n nodes is at most about…', opts: ['lg n', '1.44 lg n', '2 lg n', 'n'], a: 1, why: 'The minimum node count grows like the Fibonacci numbers.' },
    { q: 'After an insertion, how many rebalancing operations (single or double rotations) does an AVL tree need?', opts: ['At most one', 'At most two', 'O(lg n)', 'O(n)'], a: 0, why: 'One rotation restores the subtree’s old height, so ancestors are unaffected. Deletion can need more.' },
  ],
});

/* ---------------- binary heap / priority queue ---------------- */
topic({
  id: 'binary-heap', title: 'Heaps and priority queues', sec: '§6.1–6.2, §6.5', prereq: ['tree-basics', 'arrays'],
  blurb: 'A complete binary tree in an array where every parent beats its children: the engine behind priority queues.',
  cx: [['Insert', 'O(lg n)'], ['Extract max', 'O(lg n)'], ['Peek max', 'O(1)'], ['Build from array', 'O(n)']],
  props: ['Array-based', 'Max-heap or min-heap'],
  tags: 'heap priority queue heapq extract insert increase key top k',
  learn: `
<p>A <b>binary heap</b> is an array that we view as a nearly complete binary tree: every level is full except possibly the last, which fills from the left. With 1-based indices,</p>
<div class="formula">PARENT(i) = ⌊i/2⌋ &nbsp;&nbsp; LEFT(i) = 2i &nbsp;&nbsp; RIGHT(i) = 2i + 1</div>
<p>(In 0-based code: parent (<i>i</i> − 1)/2, children 2<i>i</i> + 1 and 2<i>i</i> + 2.) No pointers are stored; the shape is implicit. A heap of <i>n</i> elements has height ⌊lg <i>n</i>⌋.</p>
<p>In a <b>max-heap</b>, every node's key is at least its children's keys, so the maximum sits at the root. A <b>min-heap</b> is the reverse. Siblings are not ordered relative to each other; a heap is much weaker than a sorted array, which is why it can be maintained so cheaply.</p>
<h3>Maintaining the heap property</h3>
<ul><li><b>Sift down</b> (<code>maxHeapify</code>): if a node is smaller than a child, swap it with its <i>larger</i> child and continue from there. O(lg <i>n</i>).</li><li><b>Sift up</b> (inside <code>heapIncreaseKey</code>): if a node is larger than its parent, swap them and continue upward. O(lg <i>n</i>).</li></ul>
<h3>Priority queue operations</h3>
<ul><li><code>heapMaximum</code>: return <i>A</i>[1]. O(1).</li><li><code>heapExtractMax</code>: save <i>A</i>[1], move the last element to the root, shrink the heap and sift down. O(lg <i>n</i>).</li><li><code>heapIncreaseKey</code>: raise a key and sift up. O(lg <i>n</i>).</li><li><code>maxHeapInsert</code>: append −∞ at the end, then increase it to the new key. O(lg <i>n</i>).</li></ul>
<p><code>buildMaxHeap</code> turns any array into a heap in O(<i>n</i>), and <a href="/learn/heapsort">heapsort</a> follows from repeated extraction.</p>
<h3>Where priority queues appear</h3>
<p>Dijkstra's and Prim's algorithms, Huffman coding, event simulation, job scheduling, and the median of a stream (two heaps). In interviews the heap is the tool for <b>top-k</b> and <b>k-way merge</b> problems:</p>
<ul><li>Kth Largest Element (LC 215): a min-heap of size <i>k</i>; its root is the answer. O(<i>n</i> log <i>k</i>).</li><li>Top K Frequent Elements (LC 347), K Closest Points (LC 973).</li><li>Merge k Sorted Lists (LC 23): heap of the current heads.</li><li>Find Median from Data Stream (LC 295): a max-heap for the lower half and a min-heap for the upper half.</li></ul>
<div class="note">Python's <code>heapq</code> is a <b>min-heap</b> on a plain list. For a max-heap, push negated keys. C++'s <code>priority_queue</code> is a <b>max-heap</b> by default; use <code>priority_queue&lt;int, vector&lt;int&gt;, greater&lt;int&gt;&gt;</code> for a min-heap.</div>`,
  code: {
    pseudo: `heapMaximum(A)
  return A[1]

heapExtractMax(A)
  if A.heapSize < 1
      error "heap underflow"
  max ← A[1]
  A[1] ← A[A.heapSize]
  A.heapSize ← A.heapSize - 1
  maxHeapify(A, 1)
  return max

heapIncreaseKey(A, i, key)
  if key < A[i]
      error "new key is smaller than current key"
  A[i] ← key
  while i > 1 and A[parent(i)] < A[i]
      swap A[i], A[parent(i)]
      i ← parent(i)

maxHeapInsert(A, key)
  A.heapSize ← A.heapSize + 1
  A[A.heapSize] ← -∞
  heapIncreaseKey(A, A.heapSize, key)`,
    py: `import heapq

# heapq is a min-heap on a list
h = []
for x in [5, 1, 8, 3]:
    heapq.heappush(h, x)
print(heapq.heappop(h))        # 1

def kth_largest(nums, k):      # LeetCode 215
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)   # drop the smallest; keep the k largest
    return h[0]

class MedianFinder:            # LeetCode 295
    def __init__(self):
        self.lo, self.hi = [], []          # lo: max-heap (negated), hi: min-heap
    def add(self, x):
        heapq.heappush(self.lo, -x)
        heapq.heappush(self.hi, -heapq.heappop(self.lo))
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))
    def median(self):
        if len(self.lo) > len(self.hi):
            return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2`,
    cpp: `#include <queue>
#include <vector>
#include <functional>
using namespace std;

int kthLargest(const vector<int>& nums, int k) {          // LeetCode 215
    priority_queue<int, vector<int>, greater<int>> h;      // min-heap
    for (int x : nums) {
        h.push(x);
        if ((int)h.size() > k) h.pop();
    }
    return h.top();
}

struct MaxHeap {                     // the book's operations, 0-indexed
    vector<int> a;
    void push(int key) {
        a.push_back(key);
        int i = a.size() - 1;
        while (i > 0 && a[(i - 1) / 2] < a[i]) { swap(a[i], a[(i - 1) / 2]); i = (i - 1) / 2; }
    }
    int pop() {
        int top = a[0]; a[0] = a.back(); a.pop_back();
        int i = 0, n = a.size();
        while (true) {
            int l = 2 * i + 1, r = l + 1, m = i;
            if (l < n && a[l] > a[m]) m = l;
            if (r < n && a[r] > a[m]) m = r;
            if (m == i) break;
            swap(a[i], a[m]); i = m;
        }
        return top;
    }
};`,
  },
  viz: {
    inputHint: 'insert k, extract, increase i k (1-based index)',
    presets: [
      { label: 'Build by inserts, then extract', input: 'insert 16, insert 14, insert 10, insert 8, insert 7, insert 9, insert 3, insert 15, extract, extract', note: 'Inserting 15 sifts it up past 8 and 14, as in Figure 6.5.' },
      { label: 'Increase a key', input: 'insert 16, insert 14, insert 10, insert 8, insert 7, insert 9, insert 3, insert 2, insert 4, insert 1, increase 9 15', note: 'Figure 6.5: node 9 (key 4) becomes 15 and climbs to depth 1.' },
    ],
    random: () => { const ops = uniqArr(rnd(6, 8), 1, 60).map(x => 'insert ' + x); ops.push('extract', 'insert ' + rnd(61, 90), 'extract'); return ops.join(', '); },
    parse: s => parseOps(s, ['insert', 'extract', 'increase']),
    run(ops) {
      const R = Rec(); const a = [];
      const st = (hl) => ({ tree: heapTree(a, a.length, hl), arrays: [{ a: [...a], hl, base: 1, label: 'A (heap-size ' + a.length + ')' }] });
      R.add(st({}), 21, 'An empty max-heap.');
      const siftUp = (i) => {
        while (i > 0 && a[(i - 1) >> 1] < a[i]) {
          const p = (i - 1) >> 1;
          R.add(st({ [i]: 'cur', [p]: 'cmp' }), 17, `${a[i]} > parent ${a[p]}: exchange them.`, Math.random() < .5 ? { q: `${a[i]} is at node ${i + 1}. Does it swap with its parent ${a[p]}?`, choices: ['Yes, swap upward', 'No, stop here'], answer: 0 } : null);
          [a[i], a[p]] = [a[p], a[i]]; i = p;
        }
        R.add(st({ [i]: 'ok' }), 17, i === 0 ? `${a[i]} reached the root.` : `${a[i]} ≤ parent ${a[(i - 1) >> 1]}. The heap property holds.`);
      };
      for (const [op, x, y] of ops) {
        if (op === 'insert') { a.push(x); R.add(st({ [a.length - 1]: 'cur' }), 23, `MAX-HEAP-INSERT ${x}: place it at the next free leaf, A[${a.length}].`); siftUp(a.length - 1); }
        else if (op === 'increase') { const i = x - 1; if (i < 0 || i >= a.length || y < a[i]) { R.add(st({}), 15, `Cannot increase A[${x}] to ${y}.`); continue; } a[i] = y; R.add(st({ [i]: 'cur' }), 16, `A[${x}] = ${y}. Sift up.`); siftUp(i); }
        else {
          if (!a.length) { R.add(st({}), 6, 'Heap underflow.'); continue; }
          const mx = a[0];
          R.add(st({ 0: 'found' }), 7, `HEAP-EXTRACT-MAX: the maximum ${mx} is at the root.`);
          a[0] = a[a.length - 1]; a.pop();
          if (!a.length) { R.add(st({}), 11, `Return ${mx}. The heap is empty.`); continue; }
          R.add(st({ 0: 'cur' }), 8, `Move the last element ${a[0]} to the root and shrink the heap.`);
          let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = l + 1; let m = i;
            if (l < a.length && a[l] > a[m]) m = l; if (r < a.length && a[r] > a[m]) m = r;
            if (m === i) { R.add(st({ [i]: 'ok' }), 10, `${a[i]} is at least as large as its children. Return ${mx}.`, l < a.length ? { q: `Sifting ${a[i]} down. Which node holds the largest of it and its children?`, pick: ['n:' + m, 'a:' + m] } : null); break; }
            R.add(st({ [m]: 'cmp', [i]: 'cur' }), 10, `Swap ${a[i]} with its larger child ${a[m]}.`, { q: `Sifting ${a[i]} down. Click the node it swaps with.`, pick: ['n:' + m, 'a:' + m], hint: 'Always the larger child.' });
            [a[i], a[m]] = [a[m], a[i]]; i = m;
          }
        }
      }
      return R.f;
    },
  },
  quiz: [
    { q: 'In a 0-indexed array heap, the parent of index i is…', opts: ['i/2', '(i − 1) / 2, rounded down', '2i + 1', 'i − 1'], a: 1, why: 'Children of j are 2j+1 and 2j+2, so the parent of i is ⌊(i−1)/2⌋.' },
    { q: 'Where is the minimum element in a max-heap?', opts: ['At the root', 'At index 2', 'Somewhere among the leaves', 'At the last index'], a: 2, why: 'Any node with a child is larger than that child, so the minimum has no children.' },
    { q: 'To keep the k largest elements of a stream, use…', opts: ['a max-heap of size k', 'a min-heap of size k', 'a sorted array', 'a stack'], a: 1, why: 'The min-heap’s root is the smallest of the k kept, so it is the one to evict.' },
    { q: 'Extract-max moves the last element to the root and then…', opts: ['sifts it up', 'sifts it down, swapping with the larger child', 'sorts the array', 'rebuilds the heap from scratch'], a: 1, why: 'It must sink until both children are smaller.' },
    { q: 'Python’s heapq module provides…', opts: ['a max-heap', 'a min-heap', 'a balanced BST', 'a Fibonacci heap'], a: 1, why: 'Negate keys to simulate a max-heap.' },
  ],
});

/* ---------------- augmented trees ---------------- */
topic({
  id: 'augmented', title: 'Order-statistic and interval trees', sec: '§14.1–14.3', prereq: ['red-black'],
  blurb: 'Store a little extra data in each node to answer new kinds of queries in O(lg n).',
  cx: [['Select i-th smallest', 'O(lg n)'], ['Rank of a node', 'O(lg n)'], ['Interval overlap search', 'O(lg n)']],
  props: ['Subtree sizes', 'Max endpoint'],
  tags: 'order statistic tree rank select interval tree augment size',
  learn: `
<p>Chapter 14 shows a powerful design habit: take a balanced search tree and <b>augment</b> each node with extra information that can be maintained during insertions, deletions and rotations. The book's four-step recipe:</p>
<ol><li>Choose an underlying structure (usually a red-black tree).</li><li>Decide what extra information to store.</li><li>Check that it can be maintained by the basic operations. Theorem 14.1: any field computable from a node's key and its children's fields can be maintained in O(lg <i>n</i>) per update.</li><li>Develop the new operations.</li></ol>
<h3>Order-statistic trees</h3>
<p>Store in each node <i>x.size</i>, the number of nodes in its subtree, so <i>x.size</i> = <i>x.left.size</i> + <i>x.right.size</i> + 1. Then:</p>
<ul><li><code>osSelect</code>(<i>x</i>, <i>i</i>) finds the <i>i</i>-th smallest key. Let <i>r</i> = <i>x.left.size</i> + 1, the rank of <i>x</i> within its subtree. If <i>i</i> = <i>r</i>, return <i>x</i>. If <i>i</i> &lt; <i>r</i>, recurse left. Otherwise recurse right looking for the (<i>i</i> − <i>r</i>)-th smallest.</li><li><code>osRank</code>(<i>T</i>, <i>x</i>) finds <i>x</i>'s position in sorted order: start with <i>x.left.size</i> + 1 and walk up; whenever you come from a right child, add the parent's left subtree size plus one.</li></ul>
<p>Both run in O(lg <i>n</i>) on a red-black tree. Updating sizes during rotation is two lines of code.</p>
<h3>Interval trees</h3>
<p>Store intervals keyed by their low endpoint, and augment each node with <i>x.max</i>, the largest high endpoint in its subtree. <code>intervalSearch</code> for an interval overlapping <i>i</i>: at node <i>x</i>, if <i>x</i>'s interval overlaps, return it. Otherwise, if the left child exists and its <i>max</i> ≥ <i>i.low</i>, go left (if no overlap is found there, none exists on the right either); else go right. One path, O(lg <i>n</i>).</p>
<h3>In interviews</h3>
<ul><li>Count of Smaller Numbers After Self (LC 315) and Count of Range Sum (LC 327) are order-statistic queries. In practice a <a href="/learn/segment-tree">Fenwick tree</a> is the shortest code.</li><li>My Calendar I and II (LC 729, 731) are interval overlap problems; an ordered map works for these sizes.</li><li>The habit of augmenting a structure is the real lesson. Asking yourself “what if each node also knew X?” solves many design questions.</li></ul>`,
  code: {
    pseudo: `osSelect(x, i)
  r ← x.left.size + 1
  if i = r
      return x
  else if i < r
      return osSelect(x.left, i)
  else return osSelect(x.right, i - r)

osRank(T, x)
  r ← x.left.size + 1
  y ← x
  while y ≠ T.root
      if y = y.p.right
          r ← r + y.p.left.size + 1
      y ← y.p
  return r

intervalSearch(T, i)
  x ← T.root
  while x ≠ T.nil and i does not overlap x.int
      if x.left ≠ T.nil and x.left.max ≥ i.low
          x ← x.left
      else x ← x.right
  return x`,
    py: `class Node:
    def __init__(self, key):
        self.key, self.left, self.right, self.size = key, None, None, 1

def size(n): return n.size if n else 0

def insert(root, key):          # unbalanced, for brevity
    if not root:
        return Node(key)
    if key < root.key:
        root.left = insert(root.left, key)
    else:
        root.right = insert(root.right, key)
    root.size += 1
    return root

def select(x, i):               # i-th smallest, 1-based
    while x:
        r = size(x.left) + 1
        if i == r:
            return x.key
        if i < r:
            x = x.left
        else:
            x, i = x.right, i - r
    return None

def rank(root, key):            # 1-based position of key
    r = 0
    while root:
        if key < root.key:
            root = root.left
        else:
            r += size(root.left) + 1
            if key == root.key:
                return r
            root = root.right
    return None`,
    cpp: `// GNU policy-based order-statistic tree (works on most judges with g++)
#include <ext/pb_ds/assoc_container.hpp>
#include <ext/pb_ds/tree_policy.hpp>
#include <functional>
#include <iostream>
using namespace __gnu_pbds;
using namespace std;

typedef tree<int, null_type, less<int>, rb_tree_tag,
             tree_order_statistics_node_update> ordered_set;

int main() {
    ordered_set s;
    for (int x : {26, 17, 41, 14, 21, 30, 47}) s.insert(x);
    cout << *s.find_by_order(2) << "\\n";   // 3rd smallest (0-based 2) -> 21
    cout << s.order_of_key(30) << "\\n";    // how many keys < 30 -> 4
}`,
  },
  viz: {
    inputHint: 'Keys | select i, rank k',
    presets: [
      { label: 'Select and rank', input: '26 17 41 14 21 30 47 10 16 19 23 28 38 7 12 | select 17, select 5, rank 38', note: 'Keys from Figure 14.1, built as a balanced tree. Each note shows the subtree size.' },
    ],
    random: () => { const a = uniqArr(rnd(9, 13), 1, 60); return a.join(' ') + ` | select ${rnd(1, a.length)}, rank ${pick(a)}`; },
    parse: s => { const [v, o] = s.split('|'); return { a: parseKeys(v), ops: parseOps(o || '', ['select', 'rank']) }; },
    run({ a, ops }) {
      const R = Rec(), T = BST(), N = T.N;
      const sorted = [...new Set(a)].sort((x, y) => x - y);
      (function build(lo, hi) { if (lo > hi) return; const m = (lo + hi) >> 1; bstInsertQuiet(T, sorted[m]); build(lo, m - 1); build(m + 1, hi); })(0, sorted.length - 1);
      const sz = x => x == null ? 0 : N[x].size;
      (function s(x) { if (x == null) return 0; N[x].size = 1 + s(N[x].l) + s(N[x].r); return N[x].size; })(T.root);
      const st = hl => ({ tree: tsnap(T, hl, n => 'size ' + n.size) });
      R.add(st({}), 1, `A balanced search tree on ${sorted.length} keys. Each node stores the size of its subtree.`);
      for (const [op, v] of ops) {
        if (op === 'select') {
          let x = T.root, i = v; if (i < 1 || i > sorted.length) { R.add(st({}), 1, `i must be between 1 and ${sorted.length}.`); continue; }
          const seen = [];
          for (;;) {
            const r = sz(N[x].l) + 1;
            const ans = i === r ? 2 : i < r ? 0 : 1;
            R.add(st({ ...Object.fromEntries(seen.map(s => [s, 'dim'])), [x]: 'cmp' }), 2, `OS-SELECT(${N[x].key}, ${i}): r = left size + 1 = ${r}.`);
            const ask = { q: `Looking for the ${i}-th smallest here, and this node’s rank in its subtree is r = ${r}. What next?`, choices: ['Go left', 'Go right with i − r', 'This node is the answer'], answer: ans };
            if (ans === 2) { R.add(st({ [x]: 'found' }), 4, `i = r: the ${v}-th smallest key is ${N[x].key}.`, ask); break; }
            seen.push(x);
            if (ans === 0) { x = N[x].l; R.add(st({ [x]: 'cur' }), 6, `${i} < ${r}: recurse into the left subtree with the same i.`, ask); }
            else { i -= r; x = N[x].r; R.add(st({ [x]: 'cur' }), 7, `${i + r} > ${r}: recurse right, now looking for the ${i}-th smallest.`, ask); }
          }
        } else {
          let x = T.root; while (x != null && N[x].key !== v) x = v < N[x].key ? N[x].l : N[x].r;
          if (x == null) { R.add(st({}), 9, `${v} is not in the tree.`); continue; }
          let r = sz(N[x].l) + 1, y = x;
          R.add(st({ [x]: 'cur' }), 10, `OS-RANK(${v}): start with r = left size + 1 = ${r}.`);
          while (y !== T.root) {
            const p = N[y].p;
            if (N[p].r === y) { const add = sz(N[p].l) + 1; r += add; R.add(st({ [x]: 'cur', [p]: 'cmp' }), 14, `${N[y].key} is a right child, so ${N[p].key} and its left subtree come before: r += ${add} → ${r}.`, { q: `Climbing from ${N[y].key} to its parent ${N[p].key}. How much is added to r?`, value: add, hint: 'A right child adds the parent’s left subtree size plus one; a left child adds nothing.' }); }
            else R.add(st({ [x]: 'cur', [p]: 'dim' }), 13, `${N[y].key} is a left child: nothing to add.`, { q: `Climbing from ${N[y].key} to its parent ${N[p].key}. How much is added to r?`, value: 0, hint: 'A left child adds nothing.' });
            y = p;
          }
          R.add(st({ [x]: 'found' }), 16, `Rank of ${v} is ${r}.`);
        }
      }
      return R.f;
    },
  },
  quiz: [
    { q: 'In OS-SELECT, r = x.left.size + 1 is…', opts: ['the depth of x', 'the rank of x within its own subtree', 'the height of x', 'the global rank of x'], a: 1, why: 'All keys in the left subtree are smaller, so x is the (left size + 1)-th smallest of its subtree.' },
    { q: 'Theorem 14.1 says a field can be maintained in O(lg n) per update when…', opts: ['it is a constant', 'it can be computed from the node and its children’s fields', 'it depends on the root only', 'the tree is perfect'], a: 1, why: 'Then rotations and the insertion path only touch O(lg n) nodes.' },
    { q: 'In an interval tree, each node is augmented with…', opts: ['the minimum low endpoint', 'the maximum high endpoint in its subtree', 'the interval length', 'the number of overlaps'], a: 1, why: 'That tells the search whether the left subtree can contain an overlap.' },
  ],
});

/* ---------------- B-trees ---------------- */
topic({
  id: 'b-trees', title: 'B-trees', sec: '§18.1–18.3', prereq: ['bst'],
  blurb: 'Wide, shallow search trees with many keys per node, designed for disks and databases.',
  cx: [['Height', '≤ log_t((n + 1)/2)'], ['Search, insert', 'O(t log_t n) CPU, O(log_t n) disk reads']],
  props: ['Minimum degree t', 'All leaves at the same depth'],
  tags: 'b-tree btree database disk split node minimum degree',
  learn: `
<p>When data lives on disk, the cost that matters is the number of <b>disk accesses</b>, and each access reads a whole page of several kilobytes. A binary tree wastes that: one key per page read. A <b>B-tree</b> packs many keys into each node so that the tree is extremely shallow. A B-tree of minimum degree <i>t</i> = 1001 holding a billion keys has height 2. Databases and file systems (B+ trees in PostgreSQL, MySQL InnoDB, NTFS, ext4 directories) use this design.</p>
<h3>Definition</h3>
<p>A B-tree of <b>minimum degree</b> <i>t</i> ≥ 2 satisfies:</p>
<ul><li>Every node other than the root has at least <i>t</i> − 1 keys; every node has at most 2<i>t</i> − 1 keys (then it is <b>full</b>).</li><li>The keys in a node are sorted, and a node with <i>k</i> keys has <i>k</i> + 1 children. The keys separate the ranges of the children's subtrees.</li><li>All leaves have the same depth.</li></ul>
<p>Theorem 18.1 bounds the height: <i>h</i> ≤ log<sub><i>t</i></sub>((<i>n</i> + 1)/2). The simplest case, <i>t</i> = 2, is the <b>2-3-4 tree</b>, where nodes have 2, 3 or 4 children.</p>
<h3>Search</h3>
<p>Within a node, scan (or binary search) for the first key ≥ <i>k</i>. If it equals <i>k</i>, done. Otherwise descend into the child between the two neighbouring keys. One disk read per level.</p>
<h3>Insertion with proactive splitting</h3>
<p>New keys go into leaves, but a full leaf has no room. The book's single-pass method splits full nodes <b>on the way down</b>: before descending into a full child (2<i>t</i> − 1 keys), <code>bTreeSplitChild</code> moves its median key up into the parent and splits the remaining keys into two nodes of <i>t</i> − 1 keys each. Because the parent was already guaranteed non-full, it has room for the median. If the root is full, split it first and create a new root above it: that is the only way a B-tree grows taller, so all leaves stay at the same depth.</p>
<h3>Deletion</h3>
<p>Deletion is symmetric: on the way down, make sure every node you enter has at least <i>t</i> keys, either by borrowing a key from a sibling (through the parent) or by merging with a sibling. Section 18.3 lists the cases.</p>
<h3>Interview relevance</h3>
<p>You will not code a B-tree in an interview, but system design rounds ask why databases index with B+ trees (shallow, sequential leaf scans, few disk reads) and how they compare with LSM trees and hash indexes.</p>`,
  code: {
    pseudo: `bTreeSearch(x, k)
  i ← 1
  while i ≤ x.n and k > x.key[i]
      i ← i + 1
  if i ≤ x.n and k = x.key[i]
      return (x, i)
  else if x.leaf
      return nil
  else diskRead(x.c[i])
      return bTreeSearch(x.c[i], k)

bTreeInsert(T, k)
  r ← T.root
  if r.n = 2t - 1
      s ← allocateNode()
      T.root ← s
      s.leaf ← false
      s.n ← 0
      s.c[1] ← r
      bTreeSplitChild(s, 1)
      bTreeInsertNonfull(s, k)
  else bTreeInsertNonfull(r, k)

bTreeInsertNonfull(x, k)
  i ← x.n
  if x.leaf
      while i ≥ 1 and k < x.key[i]
          x.key[i + 1] ← x.key[i]
          i ← i - 1
      x.key[i + 1] ← k
      x.n ← x.n + 1
  else while i ≥ 1 and k < x.key[i]
          i ← i - 1
      i ← i + 1
      if x.c[i].n = 2t - 1
          bTreeSplitChild(x, i)
          if k > x.key[i]
              i ← i + 1
      bTreeInsertNonfull(x.c[i], k)`,
    py: `class BNode:
    def __init__(self, leaf=True):
        self.keys, self.children, self.leaf = [], [], leaf

class BTree:
    def __init__(self, t=2):
        self.t, self.root = t, BNode()

    def search(self, k, x=None):
        x = x or self.root
        i = 0
        while i < len(x.keys) and k > x.keys[i]:
            i += 1
        if i < len(x.keys) and x.keys[i] == k:
            return x, i
        return None if x.leaf else self.search(k, x.children[i])

    def split_child(self, x, i):
        t, y = self.t, x.children[i]
        z = BNode(y.leaf)
        x.keys.insert(i, y.keys[t - 1])          # median moves up
        x.children.insert(i + 1, z)
        z.keys, y.keys = y.keys[t:], y.keys[:t - 1]
        if not y.leaf:
            z.children, y.children = y.children[t:], y.children[:t]

    def insert(self, k):
        r = self.root
        if len(r.keys) == 2 * self.t - 1:         # grow at the root
            s = BNode(leaf=False)
            s.children.append(r)
            self.root = s
            self.split_child(s, 0)
        self._insert_nonfull(self.root, k)

    def _insert_nonfull(self, x, k):
        i = len(x.keys) - 1
        if x.leaf:
            x.keys.append(None)
            while i >= 0 and k < x.keys[i]:
                x.keys[i + 1] = x.keys[i]
                i -= 1
            x.keys[i + 1] = k
        else:
            while i >= 0 and k < x.keys[i]:
                i -= 1
            i += 1
            if len(x.children[i].keys) == 2 * self.t - 1:
                self.split_child(x, i)
                if k > x.keys[i]:
                    i += 1
            self._insert_nonfull(x.children[i], k)`,
    cpp: `#include <vector>
using namespace std;

struct BNode { vector<int> keys; vector<BNode*> kids; bool leaf = true; };

struct BTree {
    int t; BNode* root;
    BTree(int t) : t(t), root(new BNode) {}

    void splitChild(BNode* x, int i) {
        BNode* y = x->kids[i]; BNode* z = new BNode; z->leaf = y->leaf;
        x->keys.insert(x->keys.begin() + i, y->keys[t - 1]);
        x->kids.insert(x->kids.begin() + i + 1, z);
        z->keys.assign(y->keys.begin() + t, y->keys.end());
        y->keys.resize(t - 1);
        if (!y->leaf) { z->kids.assign(y->kids.begin() + t, y->kids.end()); y->kids.resize(t); }
    }
    void insert(int k) {
        if ((int)root->keys.size() == 2 * t - 1) {
            BNode* s = new BNode; s->leaf = false; s->kids.push_back(root);
            root = s; splitChild(s, 0);
        }
        insertNonFull(root, k);
    }
    void insertNonFull(BNode* x, int k) {
        int i = x->keys.size() - 1;
        if (x->leaf) {
            x->keys.push_back(k);
            while (i >= 0 && k < x->keys[i]) { x->keys[i + 1] = x->keys[i]; i--; }
            x->keys[i + 1] = k;
        } else {
            while (i >= 0 && k < x->keys[i]) i--;
            i++;
            if ((int)x->kids[i]->keys.size() == 2 * t - 1) { splitChild(x, i); if (k > x->keys[i]) i++; }
            insertNonFull(x->kids[i], k);
        }
    }
};`,
  },
  viz: {
    inputHint: 't=2: keys (letters or numbers)',
    presets: [
      { label: 'Exercise 18.2-1 (t = 2)', input: 't=2: F S Q K C L H T V W M R N P A B X Y D Z E', note: 'The book asks for the tree after inserting these letters into an empty 2-3-4 tree.' },
      { label: 'Numbers with t = 3', input: 't=3: 10 20 30 40 50 60 70 80 90 25 35 45 55 65', note: 'Nodes hold up to 5 keys before splitting.' },
    ],
    random: () => 't=2: ' + uniqArr(rnd(10, 14), 1, 99).join(' '),
    parse: s => { const m = /^\s*t\s*=\s*(\d)\s*:(.*)$/i.exec(s); if (!m) throw new Error('Use the form "t=2: F S Q K".'); const t = +m[1]; if (t < 2 || t > 4) throw new Error('Use t = 2, 3 or 4.'); const toks = m[2].trim().split(/[\s,]+/).filter(Boolean); if (toks.length < 1 || toks.length > 26) throw new Error('Insert between 1 and 26 keys.'); const nums = toks.every(x => isFinite(+x)); return { t, keys: nums ? toks.map(Number) : toks.map(x => x.toUpperCase()) }; },
    run({ t, keys }) {
      const R = Rec(); const N = {}; let nid = 1;
      const mk = (leaf = true) => { const id = nid++; N[id] = { keys: [], c: [], leaf }; return id; };
      let root = mk();
      const st = (hl = {}, kh = {}) => { const nodes = {}; for (const id in N) nodes[id] = { k: N[id].keys, c: N[id].leaf ? [] : N[id].c, cls: hl[id], kh: kh[id] }; return { tree: { nodes, root, levelH: 70, gap: 16 } }; };
      R.add(st(), 12, `Empty B-tree with minimum degree t = ${t}: each node holds ${t - 1} to ${2 * t - 1} keys (the root may hold fewer).`);
      const split = (x, i) => {
        const y = N[x].c[i], z = mk(N[y].leaf);
        const med = N[y].keys[t - 1];
        N[x].keys.splice(i, 0, med); N[x].c.splice(i + 1, 0, z);
        N[z].keys = N[y].keys.slice(t); N[y].keys = N[y].keys.slice(0, t - 1);
        if (!N[y].leaf) { N[z].c = N[y].c.slice(t); N[y].c = N[y].c.slice(0, t); }
        return { y, z, med };
      };
      for (const k of keys) {
        if (N[root].keys.length === 2 * t - 1) {
          R.add(st({ [root]: 'warn' }), 14, `Insert ${k}: the root is full (${2 * t - 1} keys). Split it first; the tree grows one level.`);
          const s = mk(false); N[s].c = [root]; root = s;
          const { y, z, med } = split(s, 0);
          R.add(st({ [s]: 'cur', [y]: 'cmp', [z]: 'cmp' }, { [s]: { 0: 'cur' } }), 20, `Median ${med} moves up into a new root. The other keys split into two nodes of ${t - 1}.`);
        }
        let x = root;
        for (;;) {
          if (N[x].leaf) {
            let i = N[x].keys.length - 1; while (i >= 0 && k < N[x].keys[i]) i--;
            N[x].keys.splice(i + 1, 0, k);
            R.add(st({ [x]: 'ok' }, { [x]: { [i + 1]: 'cur' } }), 30, `Insert ${k} into the leaf in sorted position.`);
            break;
          }
          let i = N[x].keys.length - 1; while (i >= 0 && k < N[x].keys[i]) i--; i++;
          const c = N[x].c[i];
          R.add(st({ [x]: 'cmp' }), 33, `At [${N[x].keys.join(' ')}]: ${k} belongs in child ${i + 1}.`, Math.random() < .6 ? { q: `Inserting ${k}. Which child of [${N[x].keys.join(' ')}] does it descend into? Click it.`, pick: 'n:' + c, hint: 'Find the gap between keys where it fits.' } : null);
          if (N[c].keys.length === 2 * t - 1) {
            R.add(st({ [c]: 'warn' }), 35, `That child [${N[c].keys.join(' ')}] is full. Split it before descending.`);
            const { y, z, med } = split(x, i);
            R.add(st({ [x]: 'cur', [y]: 'cmp', [z]: 'cmp' }, { [x]: { [i]: 'cur' } }), 36, `Median ${med} moves up into the parent.`);
            if (k > N[x].keys[i]) i++;
          }
          x = N[x].c[i];
        }
      }
      let h = 0, x = root; while (!N[x].leaf) { x = N[x].c[0]; h++; }
      R.add(st(), 12, `Done: ${keys.length} keys, height ${h}. Every leaf is at depth ${h}.`);
      return R.f;
    },
  },
  quiz: [
    { q: 'In a B-tree of minimum degree t, a full node has how many keys?', opts: ['t', '2t', '2t − 1', 't − 1'], a: 2, why: 'Non-root nodes hold between t − 1 and 2t − 1 keys.' },
    { q: 'How does a B-tree become taller?', opts: ['A leaf splits downward', 'The root splits and a new root is created above it', 'Keys are inserted at the root', 'It never does'], a: 1, why: 'That is why all leaves stay at the same depth.' },
    { q: 'Why does B-TREE-INSERT split full nodes on the way down?', opts: ['To keep the tree sorted', 'So a split never has to propagate back up, and insertion takes one pass', 'To reduce memory', 'It is required by the definition'], a: 1, why: 'The parent of any node being split is guaranteed not to be full.' },
    { q: 'Why do databases prefer B-trees (B+ trees) over binary search trees?', opts: ['They use less memory', 'Each node fills a disk page, so the height and the number of disk reads are tiny', 'They are simpler', 'They allow duplicates'], a: 1, why: 'Disk access, not comparisons, dominates the cost.' },
  ],
});

/* ---------------- tries ---------------- */
topic({
  id: 'tries', title: 'Tries (prefix trees)', sec: 'Problem 12-2', prereq: ['tree-basics', 'hash-tables'], beyond: true,
  blurb: 'A tree keyed by characters: every path from the root spells a prefix, so prefix queries cost the length of the word.',
  cx: [['Insert, search', 'O(L)'], ['Starts-with', 'O(L)'], ['Space', 'O(total characters)']],
  props: ['Prefix queries', 'Autocomplete'],
  tags: 'trie prefix tree autocomplete word search radix',
  learn: `
<p>A <b>trie</b> stores a set of strings in a tree where each edge is labelled by a character. The path from the root to a node spells a prefix, and a node is marked when that prefix is a complete word. The book's Problem 12-2 calls this a <b>radix tree</b> and uses it to sort bit strings lexicographically in linear time.</p>
<h3>Operations</h3>
<ul><li><b>Insert</b>: walk from the root following characters, creating missing children, and mark the last node as a word end.</li><li><b>Search</b>: walk the same way; fail if a child is missing; succeed only if the final node is marked.</li><li><b>Starts-with</b>: like search, but succeed as soon as the walk completes.</li></ul>
<p>Each operation costs O(<i>L</i>) for a word of length <i>L</i>, independent of how many words are stored. A hash set also checks membership in O(<i>L</i>), but cannot answer “which words start with <code>car</code>?” without scanning everything.</p>
<h3>Representing children</h3>
<p>Use an array of 26 pointers for lowercase letters (fast, memory heavy) or a hash map per node (compact, flexible). A <b>compressed trie</b> (radix or Patricia tree) merges chains of single-child nodes into one edge labelled by a string, which saves memory when words share few prefixes.</p>
<h3>In interviews</h3>
<ul><li>Implement Trie (LC 208) and Design Add and Search Words (LC 211, with <code>.</code> wildcards handled by DFS).</li><li>Word Search II (LC 212): put the dictionary in a trie and DFS the grid, pruning as soon as the current path is not a prefix.</li><li>Replace Words (LC 648), Search Suggestions System (LC 1268).</li><li>Maximum XOR of Two Numbers (LC 421): a binary trie over the bits.</li></ul>`,
  code: {
    pseudo: `trieInsert(root, word)
  x ← root
  for each character c in word
      if x.child[c] = nil
          x.child[c] ← new node
      x ← x.child[c]
  x.end ← true

trieSearch(root, word)
  x ← root
  for each character c in word
      if x.child[c] = nil
          return false
      x ← x.child[c]
  return x.end`,
    py: `class Trie:                                  # LeetCode 208
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for c in word:
            node = node.setdefault(c, {})
        node['$'] = True                     # end-of-word marker

    def _walk(self, s):
        node = self.root
        for c in s:
            if c not in node:
                return None
            node = node[c]
        return node

    def search(self, word):
        node = self._walk(word)
        return node is not None and '$' in node

    def starts_with(self, prefix):
        return self._walk(prefix) is not None`,
    cpp: `#include <string>
#include <array>
using namespace std;

struct Trie {                                      // LeetCode 208
    struct Node { array<Node*, 26> next{}; bool end = false; };
    Node* root = new Node;

    void insert(const string& w) {
        Node* x = root;
        for (char c : w) {
            int i = c - 'a';
            if (!x->next[i]) x->next[i] = new Node;
            x = x->next[i];
        }
        x->end = true;
    }
    Node* walk(const string& s) const {
        Node* x = root;
        for (char c : s) { x = x->next[c - 'a']; if (!x) return nullptr; }
        return x;
    }
    bool search(const string& w) const { Node* x = walk(w); return x && x->end; }
    bool startsWith(const string& p) const { return walk(p) != nullptr; }
};`,
  },
  viz: {
    inputHint: 'insert: words | search: words | prefix: words',
    presets: [
      { label: 'Shared prefixes', input: 'insert: car cart care cat dog do | search: car ca dot | prefix: ca', note: '"ca" is a prefix but not a word, so search fails while starts-with succeeds.' },
      { label: 'Autocomplete', input: 'insert: tea ten ted to tom inn in | prefix: te', note: 'Every word below the "te" node is a completion.' },
    ],
    random: () => { const w = shuffle(['art', 'arc', 'arm', 'army', 'bat', 'bath', 'bay', 'bee', 'beef', 'sun', 'sung', 'sum']).slice(0, 6); return `insert: ${w.join(' ')} | search: ${w[0]} ${w[1].slice(0, 2)} | prefix: ${w[2].slice(0, 2)}`; },
    parse: s => { const parts = {}; s.split('|').forEach(p => { const m = /^\s*(insert|search|prefix)\s*:(.*)$/i.exec(p); if (m) parts[m[1].toLowerCase()] = m[2].trim().toLowerCase().split(/[\s,]+/).filter(Boolean); }); if (!parts.insert) throw new Error('Start with "insert: word word".'); const all = [...parts.insert, ...(parts.search || []), ...(parts.prefix || [])]; if (all.some(w => !/^[a-z]{1,8}$/.test(w))) throw new Error('Use lowercase words of up to 8 letters.'); if (parts.insert.length > 9) throw new Error('Insert at most 9 words.'); return parts; },
    run({ insert, search = [], prefix = [] }) {
      const R = Rec(); const N = { 0: { ch: {}, end: false, label: '·' } }; let nid = 1;
      const st = (hl = {}) => { const nodes = {}; for (const id in N) nodes[id] = { k: N[id].label, c: Object.keys(N[id].ch).sort().map(c => N[id].ch[c]), cls: hl[id] || (N[id].end ? 'violet' : undefined) }; return { tree: { nodes, root: 0, levelH: 54, gap: 6 }, note: 'Purple nodes end a word.' }; };
      R.add(st(), 1, 'An empty trie: just the root.');
      for (const w of insert) {
        let x = 0; const path = [];
        for (const c of w) {
          if (N[x].ch[c] == null) { const id = nid++; N[id] = { ch: {}, end: false, label: c }; N[x].ch[c] = id; R.add(st({ ...Object.fromEntries(path.map(p => [p, 'cmp'])), [id]: 'cur' }), 5, `insert "${w}": no child for '${c}', create one.`); }
          path.push(x); x = N[x].ch[c];
        }
        N[x].end = true;
        R.add(st({ ...Object.fromEntries(path.map(p => [p, 'cmp'])), [x]: 'ok' }), 7, `Mark the node for "${w}" as a word end.`);
      }
      const walk = (s, kind) => {
        let x = 0; const path = [0];
        for (let i = 0; i < s.length; i++) {
          const c = s[i], nx = N[x].ch[c];
          if (nx == null) { R.add(st({ ...Object.fromEntries(path.map(p => [p, 'cmp'])), [x]: 'warn' }), 13, `${kind} "${s}": no child '${c}' under "${s.slice(0, i) || 'root'}". Return FALSE.`); return; }
          path.push(nx);
          R.add(st({ ...Object.fromEntries(path.map(p => [p, 'cmp'])), [nx]: 'cur' }), 14, `Follow '${c}'.`, i === 0 ? { q: `${kind} "${s}": click the first node visited after the root.`, pick: 'n:' + nx } : null);
          x = nx;
        }
        if (kind === 'search') R.add(st({ ...Object.fromEntries(path.map(p => [p, 'cmp'])), [x]: N[x].end ? 'found' : 'warn' }), 15, N[x].end ? `"${s}" is a word: TRUE.` : `The path exists but "${s}" is not marked as a word: FALSE.`, { q: `The walk for "${s}" finished. Does search return true?`, choices: ['True', 'False'], answer: N[x].end ? 0 : 1 });
        else { const words = []; (function dfs(y, pre) { if (N[y].end) words.push(pre); Object.keys(N[y].ch).sort().forEach(c => dfs(N[y].ch[c], pre + c)); })(x, s); const sub = {}; (function m(y) { sub[y] = 'ok'; Object.values(N[y].ch).forEach(m); })(x); R.add(st(sub), 15, `Prefix "${s}" exists. Words below it: ${words.join(', ')}.`); }
      };
      search.forEach(s => walk(s, 'search'));
      prefix.forEach(s => walk(s, 'prefix'));
      return R.f;
    },
  },
  quiz: [
    { q: 'Searching a trie for a word of length L costs…', opts: ['O(log n)', 'O(L)', 'O(n)', 'O(L log n)'], a: 1, why: 'One step per character, regardless of how many words are stored.' },
    { q: 'Why does a trie need an end-of-word marker?', opts: ['To save space', 'Because a word may be a prefix of another word', 'For sorting', 'It does not'], a: 1, why: '"car" is a prefix of "cart"; the marker tells whether "car" itself was inserted.' },
    { q: 'Word Search II (LC 212) uses a trie to…', opts: ['sort the words', 'prune DFS paths that are not a prefix of any word', 'count letters', 'store the grid'], a: 1, why: 'Without it you would DFS once per word.' },
  ],
});

/* ---------------- segment tree ---------------- */
topic({
  id: 'segment-tree', title: 'Segment and Fenwick trees', sec: 'Beyond the book', prereq: ['binary-heap'], beyond: true,
  blurb: 'Answer range queries and point updates in O(log n) by storing an aggregate for every segment.',
  cx: [['Build', 'O(n)'], ['Range query', 'O(log n)'], ['Point update', 'O(log n)'], ['Space', 'O(n)']],
  props: ['Range sum, min, max', 'Lazy propagation'],
  tags: 'segment tree fenwick binary indexed tree range query update sum minimum',
  learn: `
<p>Prefix sums answer range-sum queries in O(1), but a single update costs O(<i>n</i>) to rebuild. When queries and updates are mixed, a <b>segment tree</b> balances both at O(log <i>n</i>). It is a natural application of the book's ideas: divide and conquer, a complete binary tree stored in an array like a heap, and augmentation (each node stores an aggregate of its segment).</p>
<h3>Structure</h3>
<p>The root covers the whole array [0, <i>n</i> − 1]. A node covering [<i>l</i>, <i>r</i>] has children covering [<i>l</i>, <i>m</i>] and [<i>m</i> + 1, <i>r</i>] with <i>m</i> = ⌊(<i>l</i> + <i>r</i>)/2⌋. Leaves cover single elements. Each node stores the sum (or min, max, gcd: any associative operation) of its segment. Stored heap-style, node <i>i</i>'s children are 2<i>i</i> and 2<i>i</i> + 1, and an array of size 4<i>n</i> is always enough.</p>
<h3>Query</h3>
<p>To sum [<i>ql</i>, <i>qr</i>], start at the root. A node is in one of three situations:</p>
<ul><li><b>Disjoint</b> from the query: contribute 0.</li><li><b>Fully covered</b> by the query: contribute its stored sum without going deeper.</li><li><b>Partially overlapping</b>: recurse into both children.</li></ul>
<p>At most two partially overlapping nodes exist per level, so a query visits O(log <i>n</i>) nodes. The visualizer asks you to classify each node.</p>
<h3>Update</h3>
<p>Change a leaf, then recompute the sums on the path back to the root: O(log <i>n</i>). With <b>lazy propagation</b>, range updates (“add 5 to every element in [l, r]”) also run in O(log <i>n</i>) by postponing work at fully covered nodes.</p>
<h3>Fenwick trees</h3>
<p>A <b>Fenwick tree</b> (binary indexed tree) supports prefix sums and point updates in O(log <i>n</i>) with a tiny array and a few lines of code. Index <i>i</i> stores the sum of the last <code>i &amp; -i</code> elements ending at <i>i</i>. Prefer it when you only need sums; use a segment tree for min/max or range updates.</p>
<h3>In interviews</h3>
<ul><li>Range Sum Query – Mutable (LC 307) is the canonical problem.</li><li>Count of Smaller Numbers After Self (LC 315) and Reverse Pairs (LC 493) with coordinate compression and a Fenwick tree.</li><li>The Skyline Problem (LC 218) and My Calendar III (LC 732) can use segment trees, though heaps or sweep lines are often simpler.</li></ul>`,
  code: {
    pseudo: `build(node, l, r)
  if l = r
      tree[node] ← A[l]
  else m ← ⌊(l + r) / 2⌋
      build(2·node, l, m)
      build(2·node + 1, m + 1, r)
      tree[node] ← tree[2·node] + tree[2·node + 1]

query(node, l, r, ql, qr)
  if qr < l or r < ql
      return 0                      // disjoint
  if ql ≤ l and r ≤ qr
      return tree[node]             // fully covered
  m ← ⌊(l + r) / 2⌋
  return query(2·node, l, m, ql, qr) + query(2·node + 1, m + 1, r, ql, qr)

update(node, l, r, i, v)
  if l = r
      tree[node] ← v
      return
  m ← ⌊(l + r) / 2⌋
  if i ≤ m
      update(2·node, l, m, i, v)
  else update(2·node + 1, m + 1, r, i, v)
  tree[node] ← tree[2·node] + tree[2·node + 1]`,
    py: `class SegmentTree:                           # LeetCode 307
    def __init__(self, a):
        self.n = len(a)
        self.t = [0] * (4 * self.n)
        self._build(a, 1, 0, self.n - 1)

    def _build(self, a, node, l, r):
        if l == r:
            self.t[node] = a[l]; return
        m = (l + r) // 2
        self._build(a, 2 * node, l, m)
        self._build(a, 2 * node + 1, m + 1, r)
        self.t[node] = self.t[2 * node] + self.t[2 * node + 1]

    def query(self, ql, qr, node=1, l=0, r=None):
        if r is None: r = self.n - 1
        if qr < l or r < ql: return 0
        if ql <= l and r <= qr: return self.t[node]
        m = (l + r) // 2
        return self.query(ql, qr, 2 * node, l, m) + self.query(ql, qr, 2 * node + 1, m + 1, r)

    def update(self, i, v, node=1, l=0, r=None):
        if r is None: r = self.n - 1
        if l == r:
            self.t[node] = v; return
        m = (l + r) // 2
        if i <= m: self.update(i, v, 2 * node, l, m)
        else: self.update(i, v, 2 * node + 1, m + 1, r)
        self.t[node] = self.t[2 * node] + self.t[2 * node + 1]

class Fenwick:
    def __init__(self, n):
        self.f = [0] * (n + 1)
    def add(self, i, delta):                 # 0-based index
        i += 1
        while i < len(self.f):
            self.f[i] += delta
            i += i & -i
    def prefix(self, i):                     # sum of a[0..i]
        i += 1; s = 0
        while i > 0:
            s += self.f[i]
            i -= i & -i
        return s`,
    cpp: `#include <vector>
using namespace std;

struct SegTree {
    int n; vector<long long> t;
    SegTree(const vector<int>& a) : n(a.size()), t(4 * a.size()) { build(a, 1, 0, n - 1); }
    void build(const vector<int>& a, int node, int l, int r) {
        if (l == r) { t[node] = a[l]; return; }
        int m = (l + r) / 2;
        build(a, 2 * node, l, m); build(a, 2 * node + 1, m + 1, r);
        t[node] = t[2 * node] + t[2 * node + 1];
    }
    long long query(int ql, int qr, int node, int l, int r) {
        if (qr < l || r < ql) return 0;
        if (ql <= l && r <= qr) return t[node];
        int m = (l + r) / 2;
        return query(ql, qr, 2 * node, l, m) + query(ql, qr, 2 * node + 1, m + 1, r);
    }
    void update(int i, int v, int node, int l, int r) {
        if (l == r) { t[node] = v; return; }
        int m = (l + r) / 2;
        if (i <= m) update(i, v, 2 * node, l, m); else update(i, v, 2 * node + 1, m + 1, r);
        t[node] = t[2 * node] + t[2 * node + 1];
    }
};

struct Fenwick {
    vector<long long> f;
    Fenwick(int n) : f(n + 1, 0) {}
    void add(int i, long long d) { for (i++; i < (int)f.size(); i += i & -i) f[i] += d; }
    long long prefix(int i) { long long s = 0; for (i++; i > 0; i -= i & -i) s += f[i]; return s; }
};`,
  },
  viz: {
    inputHint: 'values | query l r, update i v (0-based)',
    presets: [
      { label: 'Query and update', input: '5 8 6 3 2 7 2 6 | query 2 6, update 3 10, query 2 6', note: 'Query sum of A[2..6], change A[3], then query again.' },
      { label: 'Single element', input: '1 3 5 7 9 11 | query 4 4, query 0 5', note: 'A full-range query stops at the root immediately.' },
    ],
    random: () => { const n = rnd(6, 8); return randArr(n, 1, 9).join(' ') + ` | query ${rnd(0, 2)} ${rnd(3, n - 1)}, update ${rnd(0, n - 1)} ${rnd(1, 9)}`; },
    parse: s => { const [v, o] = s.split('|'); const a = parseNums(v, { min: 2, max: 10, lo: -99, hi: 99 }); const ops = parseOps(o || '', ['query', 'update']); for (const [op, x, y] of ops) { if (x < 0 || x >= a.length || (op === 'query' && (y < x || y >= a.length))) throw new Error('Indices are 0-based and must be inside the array.'); } return { a, ops }; },
    run({ a, ops }) {
      const R = Rec(); const n = a.length, t = {}, seg = {};
      (function b(node, l, r) { seg[node] = [l, r]; if (l === r) { t[node] = a[l]; return; } const m = (l + r) >> 1; b(2 * node, l, m); b(2 * node + 1, m + 1, r); t[node] = t[2 * node] + t[2 * node + 1]; })(1, 0, n - 1);
      const st = (hl = {}, ahl = {}) => { const nodes = {}; for (const id in t) { const [l, r] = seg[id]; nodes[id] = { k: t[id], l: t[2 * id] !== undefined ? 2 * id : null, r: t[2 * id + 1] !== undefined ? 2 * id + 1 : null, cls: hl[id], note: l === r ? `[${l}]` : `[${l}..${r}]` }; } return { tree: { nodes, root: 1, binary: true, spread: 4 }, arrays: [{ a: [...a], hl: ahl, label: 'A' }] }; };
      R.add(st(), 1, `Each node stores the sum of its segment. The root covers A[0..${n - 1}] with sum ${t[1]}.`);
      for (const [op, x, y] of ops) {
        if (op === 'query') {
          const ql = x, qr = y; let total = 0; const used = {}, seen = {};
          const visit = (node) => {
            const [l, r] = seg[node];
            const cls = (qr < l || r < ql) ? 2 : (ql <= l && r <= qr) ? 0 : 1;
            const ask = { q: `Query [${ql}..${qr}] at node [${l}..${r}]. How does it relate?`, choices: ['Fully inside: use its sum', 'Partial: recurse into both children', 'Disjoint: contributes 0'], answer: cls, hint: 'Compare the node’s segment with the query range.' };
            if (cls === 2) { seen[node] = 'dim'; R.add(st({ ...seen, ...used, [node]: 'dim' }, rangeHl(ql, qr, 'cmp')), 11, `[${l}..${r}] is disjoint from [${ql}..${qr}]: return 0.`, Math.random() < .5 ? ask : null); return; }
            if (cls === 0) { used[node] = 'ok'; total += t[node]; R.add(st({ ...seen, ...used }, rangeHl(ql, qr, 'cmp')), 13, `[${l}..${r}] lies inside the query: take its sum ${t[node]}. Running total ${total}.`, ask); return; }
            seen[node] = 'cmp'; R.add(st({ ...seen, ...used, [node]: 'cur' }, rangeHl(ql, qr, 'cmp')), 15, `[${l}..${r}] partly overlaps: recurse into both children.`, Math.random() < .6 ? ask : null);
            visit(2 * node); visit(2 * node + 1);
          };
          R.add(st({}, rangeHl(ql, qr, 'cmp')), 9, `QUERY sum of A[${ql}..${qr}].`);
          visit(1);
          R.add(st(used, rangeHl(ql, qr, 'done')), 15, `Sum of A[${ql}..${qr}] = ${total}, from ${Object.keys(used).length} node${Object.keys(used).length > 1 ? 's' : ''}.`);
        } else {
          const i = x, v = y; a[i] = v; let node = 1; const path = [];
          while (seg[node][0] !== seg[node][1]) { path.push(node); const m = (seg[node][0] + seg[node][1]) >> 1; node = i <= m ? 2 * node : 2 * node + 1; }
          t[node] = v;
          R.add(st({ [node]: 'cur' }, { [i]: 'cur' }), 19, `UPDATE A[${i}] = ${v} at its leaf.`);
          for (let k = path.length - 1; k >= 0; k--) { const p = path[k]; const old = t[p]; t[p] = t[2 * p] + t[2 * p + 1]; R.add(st({ [p]: 'cur' }, { [i]: 'cur' }), 25, `Recompute [${seg[p][0]}..${seg[p][1]}]: ${old} → ${t[p]}.`, Math.random() < .5 ? { q: `Children of [${seg[p][0]}..${seg[p][1]}] now hold ${t[2 * p]} and ${t[2 * p + 1]}. What is its new sum?`, value: t[p] } : null); }
        }
      }
      return R.f;
    },
  },
  quiz: [
    { q: 'How many nodes does a segment-tree range query visit?', opts: ['O(1)', 'O(log n)', 'O(√n)', 'O(n)'], a: 1, why: 'At most a constant number of nodes per level are partially covered.' },
    { q: 'When a node’s segment is fully inside the query range, the query…', opts: ['recurses into both children', 'uses the node’s stored value and stops', 'returns 0', 'updates the node'], a: 1, why: 'That is what makes the structure fast.' },
    { q: 'A Fenwick tree is a good fit for…', opts: ['range minimum with range updates', 'prefix sums with point updates', 'sorting', 'graph search'], a: 1, why: 'It is simpler than a segment tree for invertible operations like sums.' },
    { q: 'Prefix sums beat a segment tree when…', opts: ['the array never changes after preprocessing', 'there are many updates', 'queries are minimums', 'n is small'], a: 0, why: 'Without updates, O(1) per query after O(n) setup is unbeatable.' },
  ],
});
