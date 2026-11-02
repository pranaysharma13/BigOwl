/** Interview patterns: names and one-line recognition signals (full guides live alongside). */
export interface PatternMeta {
  id: string;
  title: string;
  blurb: string;
  signal: string;
}

export const PATTERN_LIST: PatternMeta[] = [
  { id: 'two-pointers', title: 'Two pointers', blurb: 'Walk inward from both ends, or chase with a slow and a fast index.', signal: 'Sorted array, pairs or triplets, in-place partitioning' },
  { id: 'sliding-window', title: 'Sliding window', blurb: 'Grow the right edge, shrink the left edge, never restart.', signal: 'Longest or shortest contiguous run that satisfies a condition' },
  { id: 'fast-slow', title: 'Fast and slow pointers', blurb: 'Two speeds through a sequence reveal cycles and midpoints.', signal: 'Cycle detection, middle of a list, repeated states' },
  { id: 'binary-search-answer', title: 'Binary search on the answer', blurb: 'Search the range of possible answers with a yes/no check.', signal: '“Minimum capacity”, “smallest maximum”, monotone feasibility' },
  { id: 'prefix-sum', title: 'Prefix sums', blurb: 'Turn range sums into one subtraction, then count with a hash map.', signal: 'Subarray sum equals k, range queries, balance points' },
  { id: 'hashing', title: 'Hash map counting', blurb: 'Trade memory for time: remember what you have seen.', signal: 'Complements, frequencies, anagrams, duplicates' },
  { id: 'monotonic-stack', title: 'Monotonic stack', blurb: 'Keep a stack in sorted order; each pop answers a question.', signal: 'Next greater or smaller element, spans, histograms' },
  { id: 'heap-top-k', title: 'Heaps and top-k', blurb: 'A size-k heap keeps the best k seen so far.', signal: 'K largest, k closest, k-way merge, running median' },
  { id: 'intervals', title: 'Merge intervals', blurb: 'Sort by start, then sweep and merge.', signal: 'Overlapping ranges, meeting rooms, inserting an interval' },
  { id: 'list-reversal', title: 'In-place list reversal', blurb: 'Three pointers rewire a linked list without extra space.', signal: 'Reverse a list or a sublist, k-groups, palindrome lists' },
  { id: 'tree-dfs', title: 'Tree depth-first search', blurb: 'Answer for a node from its children’s answers.', signal: 'Heights, path sums, diameter, lowest common ancestor' },
  { id: 'tree-bfs', title: 'Tree breadth-first search', blurb: 'Process a tree one level at a time with a queue.', signal: 'Level order, right side view, minimum depth' },
  { id: 'graph-traversal', title: 'Graph BFS and DFS', blurb: 'Visit every reachable vertex once, marking as you go.', signal: 'Islands, flood fill, shortest path with unit costs' },
  { id: 'topological-sort', title: 'Topological sort', blurb: 'Peel off vertices with no remaining prerequisites.', signal: 'Dependencies, course schedules, build order' },
  { id: 'union-find', title: 'Union-find', blurb: 'Merge groups and ask “same group?” in near-constant time.', signal: 'Dynamic connectivity, redundant edges, account merging' },
  { id: 'backtracking', title: 'Backtracking', blurb: 'Choose, explore, unchoose: search every candidate with pruning.', signal: 'All subsets, permutations, combinations, boards' },
  { id: 'dp-1d', title: 'One-dimensional DP', blurb: 'Each answer builds on a few earlier answers.', signal: 'Stairs, robbing houses, coin change, decoding' },
  { id: 'dp-2d', title: 'Two-dimensional DP', blurb: 'A grid of subproblems over two indices.', signal: 'Grid paths, two strings, knapsack' },
  { id: 'greedy', title: 'Greedy', blurb: 'Take the locally best step when you can prove it is safe.', signal: 'Scheduling, jumps, gas stations, partitions' },
  { id: 'trie', title: 'Trie', blurb: 'Share prefixes in a tree of characters.', signal: 'Prefix search, autocomplete, word grids' },
  { id: 'cyclic-sort', title: 'Cyclic sort', blurb: 'Place each value at its own index to find what is missing.', signal: 'Numbers in 1..n: missing, duplicate, first missing positive' },
];
