// Auto-detect for the Trace Studio.
//
// Two jobs. From the plain render it lifts the figure off the white ground,
// which gives the figure height the scale depends on and an outline the
// silhouette lines can be read from. From the labelled render it finds the
// green, blue and red bands and turns each into an ordered polyline, so the
// selvedges and the pallu end can be placed without drawing them by hand.

import type { TracePoint } from "./trace";

export interface Silhouette {
  /** One byte per pixel of the downsampled grid: 1 where the figure is. */
  mask: Uint8Array;
  w: number;
  h: number;
  /** Scale from grid cells back to image pixels. */
  step: number;
  /** Bounds in image pixels. */
  bounds: { left: number; right: number; top: number; bottom: number };
  /** Figure height in image pixels. */
  heightPx: number;
}

/** Reduces an image to a grid of mean colours, at most `maxDim` on the long side. */
function reduce(image: ImageData, maxDim: number) {
  const step = Math.max(1, Math.ceil(Math.max(image.width, image.height) / maxDim));
  const w = Math.max(1, Math.floor(image.width / step));
  const h = Math.max(1, Math.floor(image.height / step));
  const rgb = new Float32Array(w * h * 3);
  const src = image.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let dy = 0; dy < step; dy++) {
        const sy = y * step + dy;
        if (sy >= image.height) break;
        for (let dx = 0; dx < step; dx++) {
          const sx = x * step + dx;
          if (sx >= image.width) break;
          const o = (sy * image.width + sx) * 4;
          r += src[o];
          g += src[o + 1];
          b += src[o + 2];
          n++;
        }
      }
      const o = (y * w + x) * 3;
      rgb[o] = r / n;
      rgb[o + 1] = g / n;
      rgb[o + 2] = b / n;
    }
  }
  return { w, h, step, rgb };
}

/** Keeps only the largest four-connected blob in a mask. */
function largestBlob(mask: Uint8Array, w: number, h: number): Uint8Array {
  const labels = new Int32Array(w * h).fill(-1);
  const queue = new Int32Array(w * h);
  let bestSeed = -1;
  let bestArea = 0;

  for (let seed = 0; seed < w * h; seed++) {
    if (mask[seed] !== 1 || labels[seed] !== -1) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = seed;
    labels[seed] = seed;
    let area = 0;
    while (head < tail) {
      const i = queue[head++];
      area++;
      const x = i % w;
      const y = (i / w) | 0;
      const push = (n: number) => {
        if (mask[n] === 1 && labels[n] === -1) {
          labels[n] = seed;
          queue[tail++] = n;
        }
      };
      if (x > 0) push(i - 1);
      if (x < w - 1) push(i + 1);
      if (y > 0) push(i - w);
      if (y < h - 1) push(i + w);
    }
    if (area > bestArea) {
      bestArea = area;
      bestSeed = seed;
    }
  }

  const out = new Uint8Array(w * h);
  if (bestSeed < 0) return out;
  for (let i = 0; i < w * h; i++) if (labels[i] === bestSeed) out[i] = 1;
  return out;
}

/**
 * Lifts the figure off the plain white ground of a two-render plate A.
 *
 * The brief calls for a white or very light grey background with nothing
 * touching the frame edge, so the figure is simply whatever is not near-white
 * and not connected to the border.
 */
export function figureSilhouette(image: ImageData, maxDim = 420): Silhouette {
  const { w, h, step, rgb } = reduce(image, maxDim);

  // The ground is the brightest, flattest colour; sample the frame corners.
  let groundR = 0;
  let groundG = 0;
  let groundB = 0;
  let n = 0;
  const patch = Math.max(2, Math.round(Math.min(w, h) * 0.04));
  for (const [cx, cy] of [
    [0, 0],
    [w - patch, 0],
    [0, h - patch],
    [w - patch, h - patch],
  ]) {
    for (let y = cy; y < cy + patch; y++) {
      for (let x = cx; x < cx + patch; x++) {
        const o = (y * w + x) * 3;
        groundR += rgb[o];
        groundG += rgb[o + 1];
        groundB += rgb[o + 2];
        n++;
      }
    }
  }
  groundR /= n;
  groundG /= n;
  groundB /= n;

  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 3;
    const d = Math.hypot(rgb[o] - groundR, rgb[o + 1] - groundG, rgb[o + 2] - groundB);
    mask[i] = d > 26 ? 1 : 0;
  }

  const figure = largestBlob(mask, w, h);

  let left = w;
  let right = -1;
  let top = h;
  let bottom = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (figure[y * w + x] !== 1) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  if (right < 0) {
    return {
      mask: figure,
      w,
      h,
      step,
      bounds: { left: 0, right: image.width, top: 0, bottom: image.height },
      heightPx: 0,
    };
  }

  const bounds = {
    left: left * step,
    right: (right + 1) * step,
    top: top * step,
    bottom: (bottom + 1) * step,
  };
  return { mask: figure, w, h, step, bounds, heightPx: bounds.bottom - bounds.top };
}

/** Perpendicular distance from a point to a segment. */
function pointToSegment(p: TracePoint, a: TracePoint, b: TracePoint): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.min(1, Math.max(0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSq));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Douglas-Peucker: drops points a line does not need. */
export function simplify(points: readonly TracePoint[], tolerance: number): TracePoint[] {
  if (points.length < 3) return points.map(([x, y]) => [x, y] as TracePoint);

  let worst = 0;
  let index = 0;
  const first = points[0];
  const last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = pointToSegment(points[i], first, last);
    if (d > worst) {
      worst = d;
      index = i;
    }
  }
  if (worst <= tolerance) return [[first[0], first[1]], [last[0], last[1]]];

  const head = simplify(points.slice(0, index + 1), tolerance);
  const tail = simplify(points.slice(index), tolerance);
  head.pop();
  return [...head, ...tail];
}

/**
 * Orders a cloud of cells into a single stroke.
 *
 * A band on the picture is a blob, not a path. Walking from the cell furthest
 * from the middle and always stepping to the nearest one not yet used traces it
 * end to end, which is enough for a band that does not cross itself.
 */
function orderIntoPath(cells: TracePoint[]): TracePoint[] {
  if (cells.length < 2) return cells;

  let cx = 0;
  let cy = 0;
  for (const [x, y] of cells) {
    cx += x;
    cy += y;
  }
  cx /= cells.length;
  cy /= cells.length;

  let start = 0;
  let furthest = -1;
  cells.forEach(([x, y], i) => {
    const d = Math.hypot(x - cx, y - cy);
    if (d > furthest) {
      furthest = d;
      start = i;
    }
  });

  const used = new Uint8Array(cells.length);
  const path: TracePoint[] = [cells[start]];
  used[start] = 1;
  let current = cells[start];

  for (let step = 1; step < cells.length; step++) {
    let next = -1;
    let best = Infinity;
    for (let i = 0; i < cells.length; i++) {
      if (used[i]) continue;
      const d = Math.hypot(cells[i][0] - current[0], cells[i][1] - current[1]);
      if (d < best) {
        best = d;
        next = i;
      }
    }
    // A big jump means the rest of the cloud is a separate piece of the band.
    if (next < 0 || best > furthest * 0.45) break;
    used[next] = 1;
    current = cells[next];
    path.push(current);
  }
  return path;
}

export type BandName = "green" | "blue" | "red";

/** Hue windows for the three bands painted on the labelled test saree. */
const BANDS: Record<BandName, (r: number, g: number, b: number) => boolean> = {
  green: (r, g, b) => g > 70 && g - r > 30 && g - b > 25,
  blue: (r, g, b) => b > 70 && b - r > 30 && b - g > 18,
  red: (r, g, b) => r > 80 && r - g > 45 && r - b > 45,
};

/** Every four-connected blob in a mask, as lists of cells, largest first. */
function allBlobs(
  mask: Uint8Array,
  w: number,
  h: number,
  minArea: number,
): TracePoint[][] {
  const labels = new Int32Array(w * h).fill(-1);
  const queue = new Int32Array(w * h);
  const found: TracePoint[][] = [];

  for (let seed = 0; seed < w * h; seed++) {
    if (mask[seed] !== 1 || labels[seed] !== -1) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = seed;
    labels[seed] = seed;
    const cells: TracePoint[] = [];

    while (head < tail) {
      const i = queue[head++];
      const x = i % w;
      const y = (i / w) | 0;
      cells.push([x, y]);
      const push = (n: number) => {
        if (mask[n] === 1 && labels[n] === -1) {
          labels[n] = seed;
          queue[tail++] = n;
        }
      };
      if (x > 0) push(i - 1);
      if (x < w - 1) push(i + 1);
      if (y > 0) push(i - w);
      if (y < h - 1) push(i + w);
    }
    if (cells.length >= minArea) found.push(cells);
  }
  return found.sort((a, b) => b.length - a.length);
}

/**
 * Cuts a stroke where it turns a corner.
 *
 * One painted band covers more than one traced line: the green runs down the
 * front edge of the pallu and then along the hem, and the blue crosses the
 * chest before dropping down the outer edge. The turn between them is sharp,
 * so splitting there separates the lines.
 */
function splitAtCorners(
  points: TracePoint[],
  angleThreshold = 55,
  minPoints = 4,
): TracePoint[][] {
  if (points.length < minPoints * 2) return [points];

  const window = Math.max(2, Math.round(points.length * 0.08));
  const turn = new Float64Array(points.length);
  for (let i = window; i < points.length - window; i++) {
    const ax = points[i][0] - points[i - window][0];
    const ay = points[i][1] - points[i - window][1];
    const bx = points[i + window][0] - points[i][0];
    const by = points[i + window][1] - points[i][1];
    const la = Math.hypot(ax, ay);
    const lb = Math.hypot(bx, by);
    if (la < 1e-6 || lb < 1e-6) continue;
    const cos = Math.min(1, Math.max(-1, (ax * bx + ay * by) / (la * lb)));
    turn[i] = (Math.acos(cos) * 180) / Math.PI;
  }

  const cuts: number[] = [];
  for (let i = window; i < points.length - window; i++) {
    if (turn[i] < angleThreshold) continue;
    let peak = true;
    for (let j = Math.max(0, i - window); j <= Math.min(points.length - 1, i + window); j++) {
      if (turn[j] > turn[i]) {
        peak = false;
        break;
      }
    }
    if (peak && (cuts.length === 0 || i - cuts[cuts.length - 1] >= minPoints)) cuts.push(i);
  }
  if (cuts.length === 0) return [points];

  const pieces: TracePoint[][] = [];
  let from = 0;
  for (const cut of cuts) {
    if (cut - from + 1 >= minPoints) pieces.push(points.slice(from, cut + 1));
    from = cut;
  }
  if (points.length - from >= minPoints) pieces.push(points.slice(from));
  return pieces.length ? pieces : [points];
}

export interface BandRun {
  band: BandName;
  points: TracePoint[];
  bounds: { left: number; right: number; top: number; bottom: number };
  orientation: "vertical" | "horizontal";
  /** Length along the stroke, in image pixels. */
  length: number;
}

function describe(band: BandName, points: TracePoint[]): BandRun {
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  let length = 0;
  points.forEach(([x, y], i) => {
    if (x < left) left = x;
    if (x > right) right = x;
    if (y < top) top = y;
    if (y > bottom) bottom = y;
    if (i > 0) length += Math.hypot(x - points[i - 1][0], y - points[i - 1][1]);
  });
  return {
    band,
    points,
    bounds: { left, right, top, bottom },
    orientation: right - left > bottom - top ? "horizontal" : "vertical",
    length,
  };
}

/**
 * Reads one band off the labelled render as a set of separate strokes.
 *
 * Each blob of that colour is walked end to end and then cut at its corners,
 * so a band that covers two different lines comes back as two runs.
 */
export function bandRuns(image: ImageData, band: BandName, maxRuns = 6): BandRun[] {
  const { w, h, step, rgb } = reduce(image, 300);
  const test = BANDS[band];

  const mask = new Uint8Array(w * h);
  let count = 0;
  for (let i = 0; i < w * h; i++) {
    const o = i * 3;
    if (test(rgb[o], rgb[o + 1], rgb[o + 2])) {
      mask[i] = 1;
      count++;
    }
  }
  if (count < 12) return [];

  const runs: BandRun[] = [];
  for (const cells of allBlobs(mask, w, h, Math.max(10, count * 0.04))) {
    const thin = Math.max(1, Math.round(Math.sqrt(cells.length) / 10));
    const sample = cells.filter((_, i) => i % thin === 0);
    const path = orderIntoPath(sample).map(
      ([x, y]) => [(x + 0.5) * step, (y + 0.5) * step] as TracePoint,
    );
    if (path.length < 3) continue;

    let tolerance = step * 0.8;
    let simplified = simplify(path, tolerance);
    while (simplified.length > 90 && tolerance < step * 40) {
      tolerance *= 1.6;
      simplified = simplify(path, tolerance);
    }

    for (const piece of splitAtCorners(simplified)) {
      if (piece.length < 2) continue;
      const run = describe(band, piece);
      if (run.length > step * 4) runs.push(run);
    }
  }
  return runs.sort((a, b) => b.length - a.length).slice(0, maxRuns);
}

/**
 * Works out which traced line each painted run belongs to.
 *
 * The brief fixes what each colour means, and the drape fixes where each part
 * of it sits: the hem lies along the bottom, the pallu's outer edge falls down
 * one side, the waist selvedge crosses the chest near the top. Position and
 * direction are enough to tell them apart.
 */
export function assignBandRuns(
  image: ImageData,
  size: { width: number; height: number },
): Map<string, TracePoint[]> {
  const out = new Map<string, TracePoint[]>();
  const take = (id: string, run: BandRun | undefined) => {
    if (run && !out.has(id)) out.set(id, run.points);
  };

  const green = bandRuns(image, "green");
  const blue = bandRuns(image, "blue");
  const red = bandRuns(image, "red");

  // The decorated end is a single stroke across the foot of the pallu.
  take("pallu-foot", red[0]);

  // Green is the hem selvedge: along the bottom of the skirt, and up the front
  // edge of the hanging pallu.
  const lowBand = size.height * 0.75;
  const hem = green
    .filter((r) => r.orientation === "horizontal" && r.bounds.bottom > lowBand)
    .sort((a, b) => b.length - a.length)[0];
  take("hem", hem);

  const greenRest = green.filter((r) => r !== hem).sort((a, b) => b.length - a.length);
  take("pallu-front-floor", greenRest[0]);
  // The chest section sits higher up than the run to the floor.
  const chest = greenRest
    .slice(1)
    .sort((a, b) => a.bounds.top - b.bounds.top)
    .find((r) => r.bounds.top < size.height * 0.5);
  take("pallu-front-chest", chest);

  // Blue is the waist selvedge: across the chest, over the shoulder, then down
  // the outer edge of the hanging pallu.
  const across = blue
    .filter((r) => r.bounds.top < size.height * 0.45)
    .sort((a, b) => a.bounds.top - b.bounds.top)[0];
  take("pallu-top", across);

  const outer = blue
    .filter((r) => r !== across && r.orientation === "vertical")
    .sort((a, b) => b.length - a.length)[0];
  take("pallu-outer", outer ?? blue.filter((r) => r !== across)[0]);

  return out;
}

/**
 * Walks the outside of the figure and returns it as a polyline in image
 * pixels, starting at the topmost cell and going clockwise.
 */
export function silhouetteOutline(figure: Silhouette, maxPoints = 160): TracePoint[] {
  const { mask, w, h, step } = figure;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : mask[y * w + x]);

  let startX = -1;
  let startY = -1;
  outer: for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (at(x, y) === 1) {
        startX = x;
        startY = y;
        break outer;
      }
    }
  }
  if (startX < 0) return [];

  // Moore boundary walk.
  const around = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];
  const cells: TracePoint[] = [];
  let cx = startX;
  let cy = startY;
  let dir = 0;
  const limit = w * h * 4;

  for (let guard = 0; guard < limit; guard++) {
    cells.push([cx, cy]);
    let moved = false;
    for (let k = 0; k < 8; k++) {
      const d = (dir + 6 + k) % 8;
      const nx = cx + around[d][0];
      const ny = cy + around[d][1];
      if (at(nx, ny) === 1) {
        cx = nx;
        cy = ny;
        dir = d;
        moved = true;
        break;
      }
    }
    if (!moved) break;
    if (cx === startX && cy === startY && cells.length > 2) break;
  }

  const path = cells.map(([x, y]) => [(x + 0.5) * step, (y + 0.5) * step] as TracePoint);
  let tolerance = step * 1.2;
  let simplified = simplify(path, tolerance);
  while (simplified.length > maxPoints && tolerance < step * 60) {
    tolerance *= 1.5;
    simplified = simplify(path, tolerance);
  }
  return simplified;
}
