import { generateGraph, mulberry32, simulatedAnnealing } from "./maxcut";

const randArray = (n, seed) => {
  const r = mulberry32(seed);
  return Float64Array.from({ length: n }, () => r());
};
const sortedCheck = (a) => `sorted ${a.length.toLocaleString()} values · min ${a[0].toFixed(5)} · max ${a[a.length - 1].toFixed(5)}`;

function mergeSort(a) {
  if (a.length < 2) return a;
  const m = a.length >> 1;
  const l = mergeSort(a.slice(0, m));
  const r = mergeSort(a.slice(m));
  const out = new Float64Array(a.length);
  let i = 0, j = 0, k = 0;
  while (i < l.length && j < r.length) out[k++] = l[i] <= r[j] ? l[i++] : r[j++];
  while (i < l.length) out[k++] = l[i++];
  while (j < r.length) out[k++] = r[j++];
  return out;
}

function quickSort(a, lo = 0, hi = a.length - 1) {
  while (lo < hi) {
    const p = a[(lo + hi) >> 1];
    let i = lo, j = hi;
    while (i <= j) {
      while (a[i] < p) i++;
      while (a[j] > p) j--;
      if (i <= j) { const t = a[i]; a[i] = a[j]; a[j] = t; i++; j--; }
    }
    if (j - lo < hi - i) { quickSort(a, lo, j); lo = i; } else { quickSort(a, i, hi); hi = j; }
  }
  return a;
}

function insertionSort(a) {
  for (let i = 1; i < a.length; i++) {
    const v = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > v) { a[j + 1] = a[j]; j--; }
    a[j + 1] = v;
  }
  return a;
}

export const BENCHMARKS = [
  { id: "sort-native", label: "Typed-array sort (engine built-in)", complexity: "O(n log n)", param: "Array length", min: 1000, max: 1000000, def: 200000,
    prepare: (n, s) => randArray(n, s), run: (a) => sortedCheck(a.slice().sort()) },
  { id: "sort-merge", label: "Merge sort (JavaScript)", complexity: "O(n log n)", param: "Array length", min: 1000, max: 500000, def: 200000,
    prepare: (n, s) => randArray(n, s), run: (a) => sortedCheck(mergeSort(a)) },
  { id: "sort-quick", label: "Quicksort (JavaScript, middle pivot)", complexity: "O(n log n) avg", param: "Array length", min: 1000, max: 1000000, def: 200000,
    prepare: (n, s) => randArray(n, s), run: (a) => sortedCheck(quickSort(a.slice())) },
  { id: "sort-insertion", label: "Insertion sort (JavaScript)", complexity: "O(n²)", param: "Array length", min: 100, max: 8000, def: 3000,
    prepare: (n, s) => randArray(n, s), run: (a) => sortedCheck(insertionSort(a.slice())) },
  { id: "sieve", label: "Sieve of Eratosthenes", complexity: "O(n log log n)", param: "Upper bound N", min: 1000, max: 5000000, def: 1000000,
    prepare: (n) => n,
    run: (N) => {
      const c = new Uint8Array(N + 1);
      let count = 0;
      for (let i = 2; i <= N; i++) {
        if (c[i]) continue;
        count++;
        for (let j = i * i; j <= N; j += i) c[j] = 1;
      }
      return `${count.toLocaleString()} primes ≤ ${N.toLocaleString()}`;
    } },
  { id: "matmul", label: "Dense matrix multiply (n × n)", complexity: "O(n³)", param: "Matrix size n", min: 10, max: 300, def: 150,
    prepare: (n, s) => ({ n, A: randArray(n * n, s), B: randArray(n * n, s + 1) }),
    run: ({ n, A, B }) => {
      const C = new Float64Array(n * n);
      for (let i = 0; i < n; i++)
        for (let k = 0; k < n; k++) {
          const a = A[i * n + k];
          for (let j = 0; j < n; j++) C[i * n + j] += a * B[k * n + j];
        }
      let tr = 0;
      for (let i = 0; i < n; i++) tr += C[i * n + i];
      return `trace(C) = ${tr.toFixed(4)}`;
    } },
  { id: "maxcut-sa", label: "Max-Cut simulated annealing (18 nodes)", complexity: "O(sweeps · edges)", param: "Sweeps", min: 50, max: 3000, def: 800,
    prepare: (sw, s) => ({ g: generateGraph({ n: 18, density: 0.5, seed: s, weighted: true }), sw, s }),
    run: ({ g, sw, s }) => `best cut ${simulatedAnnealing(g, s, { sweeps: sw, tStart: 5, tEnd: 0.05 }).cut} of total weight ${g.totalWeight}` },
];

export function stats(times) {
  const s = [...times].sort((a, b) => a - b);
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  const median = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  const sd = Math.sqrt(s.reduce((a, b) => a + (b - mean) ** 2, 0) / s.length);
  return { min: s[0], max: s[s.length - 1], mean, median, sd };
}
