"use client";

// The studio experience: pick a drape, drop in a saree photo, and the cloth is
// detected, straightened and draped in WebGL.
//
// Reconstructed from the compiled production bundle (webpack module 4900 of
// app/page-5e1485b2c56f7fae.js), which is all that survived of the original
// source. Behaviour is unchanged from the deployed app.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useSearchParams } from "next/navigation";

import * as config from "../lib/config.js";
import * as engine from "../lib/engine.js";
import * as templates from "../lib/templates.js";
import * as imageLib from "../lib/image.js";
import type {
  AxisAnalysis,
  Band,
  ClothLayout,
  Cut,
  DrapeParams,
  Grid,
  MeshRenderOptions,
  PackedParams,
  PalluEnd,
  PalluHint,
  ParamName,
  Point,
  PoseCard,
  PreparedPhoto,
  Rect,
  SareeTexture,
  TemplateDescriptor,
  UvRenderOptions,
} from "../lib/types";

/** Params a studio plate starts from, before the fabric's own defaults apply. */
const UV_DEFAULT_PARAMS: DrapeParams = {
  Brightness: 1,
  Saturate: 1.05,
  Expose_Amount: 1,
  Shadow_Color: 1,
  Highlight_Color: 1.15,
  Highlight_Multiplication: 0.45,
  Screen_Amount: 0.03,
  UV_Tiling: 1,
};

const MESH_POSE_NOTES = [
  "Front, pallu over the shoulder.",
  "Back, pallu spread open.",
  "Front, pallu open on the arm.",
];

const STUDIO_PLATE_IDS = [
  "holo-00", "holo-01", "holo-02", "holo-03", "holo-04",
  "holo-05", "holo-06", "holo-07", "holo-08", "holo-09",
  "holo-10", "holo-12", "holo-13", "holo-14", "holo-15",
  "holo-16", "holo-17", "holo-18", "holo-19", "holo-21",
];

/** Every drape the user can pick, traced meshes first. */
const POSES: PoseCard[] = [
  ...config.L6.map((model, index) => ({
    id: `model-${model.id}`,
    name: `Model ${model.id}`,
    note: MESH_POSE_NOTES[index],
    thumb: model.thumb,
    kind: "mesh" as const,
    model: index,
  })),
  ...STUDIO_PLATE_IDS.map((id) => ({
    id,
    name: `Studio ${id.slice(5)}`,
    note: "Nivi drape on a studio plate.",
    thumb: `/templates/${id}/thumb.webp`,
    kind: "uv" as const,
    model: 0,
  })),
];

/** Per-plate render overrides. None are needed today. */
const TEMPLATE_OVERRIDES: Record<string, Partial<UvRenderOptions> | undefined> = {};

// ---------------------------------------------------------------------------
// Cloth detection
//
// The photo is reduced to a small RGB grid, then each axis is scanned for the
// flat borders that frame a saree: the selvedges down the sides and the pallu
// across one end. Everything works on mean-per-line profiles, which is what
// makes it cheap enough to re-run on every nudge of the straighten slider.
// ---------------------------------------------------------------------------

type Axis = "x" | "y";

/** Mean absolute channel difference between two lines of an RGB profile. */
function channelDistance(profile: Float32Array, a: number, b: number): number {
  return (
    (Math.abs(profile[3 * a] - profile[3 * b]) +
      Math.abs(profile[3 * a + 1] - profile[3 * b + 1]) +
      Math.abs(profile[3 * a + 2] - profile[3 * b + 2])) /
    3
  );
}

/** Mean RGB of every line along `axis`. */
function axisProfile(grid: Grid, axis: Axis): Float32Array {
  const lineCount = axis === "x" ? grid.w : grid.h;
  const samples = axis === "x" ? grid.h : grid.w;
  const profile = new Float32Array(3 * lineCount);
  for (let line = 0; line < lineCount; line++) {
    let r = 0;
    let g = 0;
    let b = 0;
    for (let i = 0; i < samples; i++) {
      const x = axis === "x" ? line : i;
      const offset = ((axis === "x" ? i : line) * grid.w + x) * 3;
      r += grid.rgb[offset];
      g += grid.rgb[offset + 1];
      b += grid.rgb[offset + 2];
    }
    profile[3 * line] = r / samples;
    profile[3 * line + 1] = g / samples;
    profile[3 * line + 2] = b / samples;
  }
  return profile;
}

/**
 * For each line, how far it sits in colour from the body of the cloth.
 *
 * The body is whichever lines in the middle 60% resemble many of their
 * neighbours; borders stand out because nothing else looks like them.
 */
function distanceFromBody(profile: Float32Array): Float32Array {
  const count = profile.length / 3;
  const lo = Math.floor(0.2 * count);
  const hi = Math.max(lo + 1, Math.ceil(0.8 * count));
  const similar = new Int32Array(count);
  let mostSimilar = 0;
  for (let i = lo; i < hi; i++) {
    let matches = 0;
    for (let j = lo; j < hi; j++) {
      if (!(Math.abs(i - j) < 2) && channelDistance(profile, i, j) <= 10) matches++;
    }
    similar[i] = matches;
    if (matches > mostSimilar) mostSimilar = matches;
  }

  const body: number[] = [];
  const threshold = 0.5 * mostSimilar;
  for (let i = lo; i < hi; i++) {
    if (similar[i] >= threshold && mostSimilar > 0) body.push(i);
  }
  if (body.length < 3) for (let i = lo; i < hi; i++) body.push(i);

  const distance = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    let best = Infinity;
    for (const reference of body) {
      if (Math.abs(i - reference) < 2) continue;
      const d = channelDistance(profile, i, reference);
      if (d < best && (best = d) < 1) break;
    }
    distance[i] = best === Infinity ? 0 : best;
  }
  return distance;
}

/** Mean absolute luma step along each line — high where the weave is busy. */
function axisContrast(grid: Grid, axis: Axis): Float32Array {
  const { w, h, rgb } = grid;
  const lineCount = axis === "x" ? w : h;
  const samples = axis === "x" ? h : w;
  const contrast = new Float32Array(lineCount);
  for (let line = 0; line < lineCount; line++) {
    let total = 0;
    let steps = 0;
    let previous = -1;
    for (let i = 0; i < samples; i++) {
      const x = axis === "x" ? line : i;
      const offset = ((axis === "x" ? i : line) * w + x) * 3;
      const luma = 0.299 * rgb[offset] + 0.587 * rgb[offset + 1] + 0.114 * rgb[offset + 2];
      if (previous >= 0) {
        total += Math.abs(luma - previous);
        steps++;
      }
      previous = luma;
    }
    contrast[line] = steps ? total / steps : 0;
  }
  return contrast;
}

/**
 * Length of the border run at one end: walk inwards while lines stay far from
 * the body, tolerating a short gap, and give up if the run swallows too much.
 */
function borderRun(
  distance: Float32Array,
  fromStart: boolean,
  threshold: number,
  maxFraction: number,
  gapFraction: number,
): number {
  const count = distance.length;
  let run = 0;
  let gap = 0;
  const maxGap = Math.max(3, Math.round(count * gapFraction));
  for (let i = 0; i < count; i++) {
    if (distance[fromStart ? i : count - 1 - i] >= threshold) {
      run = i + 1;
      gap = 0;
    } else if (++gap > maxGap) break;
  }
  return run > count * maxFraction ? 0 : run;
}

/** Scans one axis for the border bands at each end. */
function analyseAxis(grid: Grid, axis: Axis, maxFraction = 1 / 3, gapFraction = 0.02): AxisAnalysis {
  const profile = axisProfile(grid, axis);
  const distance = distanceFromBody(profile);
  const count = distance.length;

  const sorted = [...distance].sort((a, b) => a - b);
  const median = sorted[Math.floor(0.5 * count)];
  const high = sorted[Math.min(count - 1, Math.floor(0.98 * count))];
  const threshold = Math.max(median + (high - median) * 0.22, 2.5);

  const contrast = axisContrast(grid, axis);
  const medianContrast = Math.max([...contrast].sort((a, b) => a - b)[Math.floor(0.5 * count)], 0.4);

  const bandAt = (fromStart: boolean): Band => {
    const run = borderRun(distance, fromStart, threshold, maxFraction, gapFraction);
    if (run === 0) return { width: 0, strength: 0 };
    let distanceSum = 0;
    let contrastSum = 0;
    for (let i = 0; i < run; i++) {
      const index = fromStart ? i : count - 1 - i;
      distanceSum += distance[index];
      contrastSum += contrast[index];
    }
    const busyness = Math.min(2.5, Math.max(0.55, contrastSum / run / medianContrast / 1.5));
    return { width: run / count, strength: Math.min(1, (distanceSum / run / 40) * busyness) };
  };

  return { bands: [bandAt(true), bandAt(false)], profile };
}

/** Block-averages an image down to at most 512px on its long side. */
function downsample(image: ImageData, maxDim = 512): Grid {
  const block = Math.max(1, Math.ceil(Math.max(image.width, image.height) / maxDim));
  const w = Math.max(1, Math.floor(image.width / block));
  const h = Math.max(1, Math.floor(image.height / block));
  const rgb = new Float32Array(w * h * 3);
  const src = image.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let dy = 0; dy < block; dy++) {
        const sy = y * block + dy;
        if (sy >= image.height) break;
        for (let dx = 0; dx < block; dx++) {
          const sx = x * block + dx;
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
  return { w, h, rgb };
}

/** Maps a destination pixel back to its source pixel for a quarter turn. */
function sourcePixel(
  x: number,
  y: number,
  rotation: number,
  w: number,
  h: number,
): [number, number] {
  switch (rotation) {
    case 90:
      return [y, h - 1 - x];
    case 180:
      return [w - 1 - x, h - 1 - y];
    case 270:
      return [w - 1 - y, x];
    default:
      return [x, y];
  }
}

/** Rotates a grid by a quarter turn, optionally mirroring it first. */
function rotateGrid(grid: Grid, rotation: number, flip: boolean): Grid {
  if (rotation === 0 && !flip) return grid;
  const swapped = rotation === 90 || rotation === 270;
  const w = swapped ? grid.h : grid.w;
  const h = swapped ? grid.w : grid.h;
  const rgb = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [sx, sy] = sourcePixel(flip ? w - 1 - x : x, y, rotation, grid.w, grid.h);
      const from = (sy * grid.w + sx) * 3;
      const to = (y * w + x) * 3;
      rgb[to] = grid.rgb[from];
      rgb[to + 1] = grid.rgb[from + 1];
      rgb[to + 2] = grid.rgb[from + 2];
    }
  }
  return { w, h, rgb };
}

/**
 * Finds the motif repeat period by autocorrelating the luma profile, ignoring
 * the pallu at whichever end it was found. Returns a fraction of the axis.
 */
function repeatPeriod(profile: Float32Array, trimStart: number, trimEnd: number): number {
  const count = profile.length / 3;
  const from = Math.floor(trimStart * count);
  const span = Math.max(from + 1, Math.ceil(count - trimEnd * count)) - from;
  if (span < 40) return 0;

  const signal = new Float32Array(span);
  let mean = 0;
  for (let i = 0; i < span; i++) {
    const o = (from + i) * 3;
    signal[i] = 0.299 * profile[o] + 0.587 * profile[o + 1] + 0.114 * profile[o + 2];
    mean += signal[i];
  }
  mean /= span;

  let energy = 0;
  for (let i = 0; i < span; i++) {
    signal[i] -= mean;
    energy += signal[i] * signal[i];
  }
  if (Math.sqrt(energy / span) < 1.5) return 0;

  let bestLag = 0;
  let bestScore = 0;
  const minLag = Math.max(8, Math.floor(0.04 * span));
  const maxLag = Math.floor(0.6 * span);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let dot = 0;
    let a = 0;
    let b = 0;
    for (let i = 0; i + lag < span; i++) {
      dot += signal[i] * signal[i + lag];
      a += signal[i] * signal[i];
      b += signal[i + lag] * signal[i + lag];
    }
    const norm = Math.sqrt(a * b);
    if (norm < 1e-6) continue;
    const score = dot / norm;
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }
  return bestScore < 0.5 ? 0 : bestLag / count;
}

/**
 * Works out how a saree photo is laid out: which way round it is, where the
 * selvedges and pallu sit, and how long the motif repeat is.
 */
function analyseLayout(image: ImageData, forcedRotation?: number, flip = false): ClothLayout {
  const grid = downsample(image);

  let rotation: number;
  if (forcedRotation !== undefined) {
    rotation = forcedRotation;
  } else if (Math.max(grid.w, grid.h) / Math.max(1, Math.min(grid.w, grid.h)) > 1.25) {
    // Clearly oblong: stand it up on its long edge.
    rotation = grid.w <= grid.h ? 0 : 90;
  } else {
    // Near-square: keep whichever axis has the more convincing pair of bands.
    const score = (analysis: AxisAnalysis) => {
      const weaker = Math.min(analysis.bands[0].strength, analysis.bands[1].strength);
      const balance =
        1 -
        Math.abs(analysis.bands[0].width - analysis.bands[1].width) /
          Math.max(analysis.bands[0].width + analysis.bands[1].width, 1e-6);
      return 1.6 * weaker + (weaker > 0.04 ? 0.4 * balance : 0);
    };
    rotation = score(analyseAxis(grid, "x")) >= score(analyseAxis(grid, "y")) ? 0 : 90;
  }

  const oriented = rotateGrid(grid, rotation, flip);
  const across = analyseAxis(oriented, "x");
  const along = analyseAxis(oriented, "y", 0.5, 0.08);

  const swapped = rotation === 90 || rotation === 270;
  const width = swapped ? image.height : image.width;
  const height = swapped ? image.width : image.height;

  const selvedge: [Band, Band] = [
    { width: across.bands[0].width * width, strength: across.bands[0].strength },
    { width: across.bands[1].width * width, strength: across.bands[1].strength },
  ];

  const atStart = along.bands[0];
  const atEnd = along.bands[1];
  const palluAtEnd = atEnd.strength >= atStart.strength;
  const strongest = palluAtEnd ? atEnd : atStart;
  const pallu =
    strongest.strength > 0.08 && strongest.width > 0.005
      ? {
          end: (palluAtEnd ? "end" : "start") as PalluEnd,
          width: strongest.width * height,
          strength: strongest.strength,
        }
      : { end: "none" as PalluEnd, width: 0, strength: 0 };

  const repeat =
    repeatPeriod(
      along.profile,
      pallu.end === "start" ? pallu.width / height : 0.02,
      pallu.end === "end" ? pallu.width / height : 0.02,
    ) * height;

  return { rotation, flip, width, height, selvedge, pallu, repeat };
}

// ---------------------------------------------------------------------------
// Finding the cloth in a cluttered photo
//
// The trim pass only copes with a saree that already fills the frame on a plain
// backdrop. A photo taken in a shop — held up by hand, with rails, shelves and
// the seller in view — defeats it, and the whole frame ends up selected. These
// passes look for the cloth directly instead.
// ---------------------------------------------------------------------------

/** Otsu's method: the threshold that best splits a set of values in two. */
function otsuThreshold(values: Float32Array, maxValue: number): number {
  const BINS = 64;
  if (maxValue <= 0) return 0;
  const scale = (BINS - 1) / maxValue;
  const histogram = new Float64Array(BINS);
  for (let i = 0; i < values.length; i++) histogram[Math.round(values[i] * scale)]++;

  const total = values.length;
  let weighted = 0;
  for (let i = 0; i < BINS; i++) weighted += i * histogram[i];

  let belowWeight = 0;
  let belowSum = 0;
  let bestBin = 0;
  let bestVariance = -1;
  for (let i = 0; i < BINS; i++) {
    belowWeight += histogram[i];
    if (belowWeight === 0) continue;
    const aboveWeight = total - belowWeight;
    if (aboveWeight === 0) break;
    belowSum += i * histogram[i];
    const meanBelow = belowSum / belowWeight;
    const meanAbove = (weighted - belowSum) / aboveWeight;
    const variance = belowWeight * aboveWeight * (meanBelow - meanAbove) ** 2;
    if (variance > bestVariance) {
      bestVariance = variance;
      bestBin = i;
    }
  }
  return (bestBin / (BINS - 1)) * maxValue;
}

/** Grows or shrinks a binary mask by one cell, four-connected. */
function morph(mask: Uint8Array, w: number, h: number, grow: boolean): Uint8Array {
  const out = new Uint8Array(mask.length);
  const want = grow ? 1 : 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let hit = mask[i] === want;
      if (!hit) {
        if (x > 0 && mask[i - 1] === want) hit = true;
        else if (x < w - 1 && mask[i + 1] === want) hit = true;
        else if (y > 0 && mask[i - w] === want) hit = true;
        else if (y < h - 1 && mask[i + w] === want) hit = true;
      }
      out[i] = hit ? want : grow ? 0 : 1;
    }
  }
  return out;
}

type Colour = [number, number, number];

/**
 * Builds a palette of backdrop colours from the frame's outer ring.
 *
 * Anything inside `exclude` is skipped, and a colour that also fills that
 * region is dropped. Without this the cloth poisons its own background model:
 * a saree usually runs off the bottom of the shot, so its pallu lands in the
 * ring and the detector then treats the pallu as backdrop.
 */
function backdropPalette(grid: Grid, exclude: Rect | null): Colour[] {
  const { w, h, rgb } = grid;
  const bucket = (r: number, g: number, b: number) =>
    ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);

  const ringX = Math.max(1, Math.round(w * 0.06));
  const ringY = Math.max(1, Math.round(h * 0.06));
  const inside = exclude
    ? {
        x0: Math.floor(exclude.left * w),
        x1: Math.ceil(exclude.right * w),
        y0: Math.floor(exclude.top * h),
        y1: Math.ceil(exclude.bottom * h),
      }
    : {
        x0: Math.floor(w * 0.25),
        x1: Math.ceil(w * 0.75),
        y0: Math.floor(h * 0.25),
        y1: Math.ceil(h * 0.75),
      };

  const onRing = new Map<number, number>();
  const inCloth = new Map<number, number>();
  const totals = new Map<number, [number, number, number, number]>();
  let ringPixels = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 3;
      const key = bucket(rgb[o], rgb[o + 1], rgb[o + 2]);
      const within = x >= inside.x0 && x < inside.x1 && y >= inside.y0 && y < inside.y1;
      if (within) {
        inCloth.set(key, (inCloth.get(key) ?? 0) + 1);
        continue;
      }
      if (x < ringX || x >= w - ringX || y < ringY || y >= h - ringY) {
        onRing.set(key, (onRing.get(key) ?? 0) + 1);
        ringPixels++;
        const sum = totals.get(key) ?? [0, 0, 0, 0];
        sum[0] += rgb[o];
        sum[1] += rgb[o + 1];
        sum[2] += rgb[o + 2];
        sum[3]++;
        totals.set(key, sum);
      }
    }
  }

  const palette: Colour[] = [];
  for (const [key, count] of [...onRing.entries()].sort((a, b) => b[1] - a[1])) {
    if (palette.length >= 24) break;
    if (count < ringPixels * 0.004) continue;
    if ((inCloth.get(key) ?? 0) > count * 0.6) continue;
    const sum = totals.get(key)!;
    palette.push([sum[0] / sum[3], sum[1] / sum[3], sum[2] / sum[3]]);
  }
  return palette;
}

/**
 * Marks every pixel that does not belong to the backdrop.
 *
 * Hysteresis: pixels far from the palette are certain, and merely-different
 * pixels are kept when they touch a certain one. A cream selvedge or pallu is
 * only mildly unlike a pale backdrop, so a single threshold loses it, but it is
 * always joined to the body of the saree.
 */
function backdropMask(grid: Grid, palette: Colour[]): Uint8Array | null {
  const { w, h, rgb } = grid;
  if (palette.length === 0) return null;

  const distance = new Float32Array(w * h);
  let furthest = 0;
  for (let i = 0; i < w * h; i++) {
    const o = i * 3;
    const r = rgb[o];
    const g = rgb[o + 1];
    const b = rgb[o + 2];
    let best = Infinity;
    for (const [br, bg, bb] of palette) {
      const d = (r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2;
      if (d < best) best = d;
    }
    const value = Math.sqrt(best);
    distance[i] = value;
    if (value > furthest) furthest = value;
  }

  const certain = otsuThreshold(distance, furthest);
  const possible = certain * 0.45;

  const mask = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let tail = 0;
  for (let i = 0; i < w * h; i++) {
    if (distance[i] > certain) {
      mask[i] = 1;
      queue[tail++] = i;
    }
  }
  if (tail === 0) return null;

  let head = 0;
  while (head < tail) {
    const i = queue[head++];
    const x = i % w;
    const y = (i / w) | 0;
    const push = (n: number) => {
      if (mask[n] === 0 && distance[n] > possible) {
        mask[n] = 1;
        queue[tail++] = n;
      }
    };
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (y > 0) push(i - w);
    if (y < h - 1) push(i + w);
  }

  // Opening: drop the speckle, then put the cloth back to its original size.
  return morph(morph(mask, w, h, false), w, h, true);
}

/** The biggest run of lines that are at least half as full as the fullest. */
function solidRun(counts: Int32Array, n: number): [number, number] | null {
  let peak = 0;
  for (let i = 0; i < n; i++) if (counts[i] > peak) peak = counts[i];
  if (peak === 0) return null;
  const floor = peak * 0.5;

  let bestFrom = -1;
  let bestTo = -1;
  let from = -1;
  for (let i = 0; i <= n; i++) {
    const full = i < n && counts[i] >= floor;
    if (full && from < 0) from = i;
    if (!full && from >= 0) {
      if (i - from > bestTo - bestFrom) {
        bestFrom = from;
        bestTo = i;
      }
      from = -1;
    }
  }
  return bestFrom < 0 ? null : [bestFrom, bestTo];
}

/**
 * The largest blob in the mask, preferring one that covers the middle of the
 * frame, trimmed to the rows and columns it actually fills.
 *
 * A hand holding the cloth joins the same blob and would otherwise drag the box
 * out with it; the cloth is solid, so an arm covers too few lines to survive.
 */
function largestBlob(grid: Grid, mask: Uint8Array): Rect | null {
  const { w, h } = grid;
  const midX0 = Math.floor(w * 0.25);
  const midX1 = Math.ceil(w * 0.75);
  const midY0 = Math.floor(h * 0.25);
  const midY1 = Math.ceil(h * 0.75);

  const labels = new Int32Array(w * h).fill(-1);
  const queue = new Int32Array(w * h);
  let bestScore = -1;
  let bestSeed = -1;
  let bestBounds: Rect | null = null;

  for (let seed = 0; seed < w * h; seed++) {
    if (mask[seed] !== 1 || labels[seed] !== -1) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = seed;
    labels[seed] = seed;

    let minX = w;
    let maxX = -1;
    let minY = h;
    let maxY = -1;
    let area = 0;
    let middle = 0;

    while (head < tail) {
      const i = queue[head++];
      const x = i % w;
      const y = (i / w) | 0;
      area++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x >= midX0 && x < midX1 && y >= midY0 && y < midY1) middle++;

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

    const score = area * (middle > 0 ? 2 : 1);
    if (score > bestScore) {
      bestScore = score;
      bestSeed = seed;
      bestBounds = {
        left: minX / w,
        right: (maxX + 1) / w,
        top: minY / h,
        bottom: (maxY + 1) / h,
      };
    }
  }
  if (!bestBounds || bestSeed < 0) return null;

  const columns = new Int32Array(w);
  const rows = new Int32Array(h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (labels[y * w + x] === bestSeed) {
        columns[x]++;
        rows[y]++;
      }
    }
  }

  const columnRun = solidRun(columns, w);
  const rowRun = solidRun(rows, h);
  if (columnRun && rowRun) {
    const trimmed = {
      left: columnRun[0] / w,
      right: columnRun[1] / w,
      top: rowRun[0] / h,
      bottom: rowRun[1] / h,
    };
    // Only accept a trim that kept most of the blob; a drastic cut means the
    // profile was noisy and the untrimmed box is the safer answer.
    const keptX = (trimmed.right - trimmed.left) / (bestBounds.right - bestBounds.left);
    const keptY = (trimmed.bottom - trimmed.top) / (bestBounds.bottom - bestBounds.top);
    if (keptX > 0.3 && keptY > 0.3) bestBounds = trimmed;
  }
  return bestBounds;
}

/**
 * Locates the saree in a photo that also contains hands, rails and shelving.
 *
 * Runs twice: the first pass gets a rough box from a backdrop model that the
 * cloth itself may have polluted, and the second rebuilds that model with the
 * box excluded. The second answer is used when it still looks like cloth.
 *
 * Returns null when nothing convincing is found, so the caller can fall back.
 */
function findClothBounds(image: ImageData): Rect | null {
  const grid = downsample(image, 220);
  if (grid.w < 24 || grid.h < 24) return null;

  const firstMask = backdropMask(grid, backdropPalette(grid, null));
  if (!firstMask) return null;
  let bounds = largestBlob(grid, firstMask);
  if (!bounds) return null;

  // Widen the exclusion before rebuilding the model. The first pass finds the
  // body of the saree, but its borders -- the selvedges and the pallu -- sit
  // just outside that box and often reach into the sampled ring. Unless they
  // are excluded too they end up in the backdrop model and the second pass
  // crops them off, losing the very parts that matter most.
  const margin = 0.15;
  const widened: Rect = {
    left: Math.max(0, bounds.left - margin),
    right: Math.min(1, bounds.right + margin),
    top: Math.max(0, bounds.top - margin),
    bottom: Math.min(1, bounds.bottom + margin),
  };
  const secondMask = backdropMask(grid, backdropPalette(grid, widened));
  if (secondMask) {
    const refined = largestBlob(grid, secondMask);
    if (refined) {
      const spanX = refined.right - refined.left;
      const spanY = refined.bottom - refined.top;
      if (spanX >= 0.15 && spanY >= 0.15 && !(spanX > 0.97 && spanY > 0.97)) bounds = refined;
    }
  }

  const spanX = bounds.right - bounds.left;
  const spanY = bounds.bottom - bounds.top;
  // Too small to be the cloth, or so large that it tells us nothing.
  if (spanX < 0.15 || spanY < 0.15) return null;
  if (spanX > 0.95 && spanY > 0.95) return null;

  // Cloth on a backdrop stands clear of every edge. A flat-lay that fills the
  // frame cannot, and neither can a design whose own border was mistaken for
  // one, so anything touching an edge is refused rather than guessed at.
  const inset = 0.02;
  if (
    bounds.left < inset ||
    bounds.top < inset ||
    bounds.right > 1 - inset ||
    bounds.bottom > 1 - inset
  ) {
    return null;
  }
  const area = spanX * spanY;
  if (area < 0.18 || area > 0.85) return null;

  const pad = 0.004;
  return {
    left: Math.max(0, bounds.left - pad),
    right: Math.min(1, bounds.right + pad),
    top: Math.max(0, bounds.top - pad),
    bottom: Math.min(1, bounds.bottom + pad),
  };
}

// ---------------------------------------------------------------------------
// Cut geometry
// ---------------------------------------------------------------------------

/** Axis-aligned bounds of a polygon, never degenerate. */
function polygonBounds(polygon: readonly Point[]): Rect {
  let left = 1;
  let right = 0;
  let top = 1;
  let bottom = 0;
  for (const [x, y] of polygon) {
    if (x < left) left = x;
    if (x > right) right = x;
    if (y < top) top = y;
    if (y > bottom) bottom = y;
  }
  return {
    left,
    right: Math.max(right, left + 0.01),
    top,
    bottom: Math.max(bottom, top + 0.01),
  };
}

/** Replaces a cut's outline, re-deriving its bounds and clamping the pallu. */
function withPolygon(cut: Cut, polygon: Point[]): Cut {
  const bounds = polygonBounds(polygon);
  const pallu =
    cut.pallu === null ? null : Math.min(bounds.bottom, Math.max(bounds.top, cut.pallu));
  return { ...cut, polygon, ...bounds, pallu };
}

function rectToPolygon(rect: Rect): Point[] {
  return [
    [rect.left, rect.top],
    [rect.right, rect.top],
    [rect.right, rect.bottom],
    [rect.left, rect.bottom],
  ];
}

/** Sorts four corners clockwise starting from the top-left. */
function orderCorners(points: readonly Point[]): Point[] {
  const cx = points.reduce((sum, p) => sum + p[0], 0) / 4;
  const cy = points.reduce((sum, p) => sum + p[1], 0) / 4;
  const clockwise = [...points].sort(
    (a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx),
  );
  let first = 0;
  let smallest = Infinity;
  clockwise.forEach((p, i) => {
    if (p[0] + p[1] < smallest) {
      smallest = p[0] + p[1];
      first = i;
    }
  });
  return [0, 1, 2, 3].map((i) => clockwise[(first + i) % 4]);
}

/** Solves the projective transform that maps the unit square onto a quad. */
function quadTransform(quad: readonly Point[]): number[] {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1 || 1e-12;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
}

/** Pulls a quad straight into a rectangle with bilinear sampling. */
function unwarpQuad(image: ImageData, polygon: readonly Point[]): ImageData {
  const quad = orderCorners(
    polygon.map(([x, y]) => [x * image.width, y * image.height] as Point),
  );
  const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const outW = Math.max(
    8,
    Math.min(2600, Math.round((dist(quad[0], quad[1]) + dist(quad[3], quad[2])) / 2)),
  );
  const outH = Math.max(
    8,
    Math.min(2600, Math.round((dist(quad[0], quad[3]) + dist(quad[1], quad[2])) / 2)),
  );
  const [a, b, c, d, e, f, g, h] = quadTransform(quad);

  const out = new ImageData(outW, outH);
  const src = image.data;
  const dst = out.data;
  const w = image.width;
  const hgt = image.height;
  const maxX = w - 1.001;
  const maxY = hgt - 1.001;

  for (let y = 0; y < outH; y++) {
    const v = (y + 0.5) / outH;
    for (let x = 0; x < outW; x++) {
      const u = (x + 0.5) / outW;
      const denom = g * u + h * v + 1;
      let sx = (a * u + b * v + c) / denom;
      let sy = (d * u + e * v + f) / denom;
      if (sx < 0) sx = 0;
      else if (sx > maxX) sx = maxX;
      if (sy < 0) sy = 0;
      else if (sy > maxY) sy = maxY;

      const x0 = sx | 0;
      const y0 = sy | 0;
      const x1 = x0 + 1 < w ? x0 + 1 : x0;
      const y1 = y0 + 1 < hgt ? y0 + 1 : y0;
      const fx = sx - x0;
      const fy = sy - y0;
      const w00 = (1 - fx) * (1 - fy);
      const w10 = fx * (1 - fy);
      const w01 = (1 - fx) * fy;
      const w11 = fx * fy;
      const o00 = (y0 * w + x0) * 4;
      const o10 = (y0 * w + x1) * 4;
      const o01 = (y1 * w + x0) * 4;
      const o11 = (y1 * w + x1) * 4;
      const o = (y * outW + x) * 4;

      dst[o] = src[o00] * w00 + src[o10] * w10 + src[o01] * w01 + src[o11] * w11;
      dst[o + 1] = src[o00 + 1] * w00 + src[o10 + 1] * w10 + src[o01 + 1] * w01 + src[o11 + 1] * w11;
      dst[o + 2] = src[o00 + 2] * w00 + src[o10 + 2] * w10 + src[o01 + 2] * w01 + src[o11 + 2] * w11;
      dst[o + 3] = 255;
    }
  }
  return out;
}

/** Signed area of a polygon; positive when wound clockwise on screen. */
function signedArea(points: readonly Point[]): number {
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    total += x1 * y2 - x2 * y1;
  }
  return total / 2;
}

/** Samples a polyline by normalised arc length, so spacing stays even. */
function arcLengthSampler(points: readonly Point[]): (t: number) => Point {
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    cumulative.push(
      cumulative[i - 1] +
        Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]),
    );
  }
  const total = cumulative[cumulative.length - 1];
  if (total <= 0) return () => points[0];

  return (t: number) => {
    const target = Math.min(1, Math.max(0, t)) * total;
    let i = 1;
    while (i < cumulative.length - 1 && cumulative[i] < target) i++;
    const span = cumulative[i] - cumulative[i - 1] || 1;
    const f = (target - cumulative[i - 1]) / span;
    const a = points[i - 1];
    const b = points[i];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  };
}

/**
 * Splits an outline into its four boundary curves.
 *
 * The vertices nearest the four corners of the outline's box become the
 * corners of the patch; every other vertex bends the side it sits on. That is
 * what lets an added dot actually shape the cloth rather than just widen a box.
 */
function outlineSides(polygon: readonly Point[]): {
  top: Point[];
  right: Point[];
  bottom: Point[];
  left: Point[];
  corners: [Point, Point, Point, Point];
} {
  let points: Point[] = polygon.map(([x, y]) => [x, y] as Point);

  // A triangle has no fourth corner, so split its longest edge.
  if (points.length === 3) {
    let longest = 0;
    let best = -1;
    for (let i = 0; i < 3; i++) {
      const a = points[i];
      const b = points[(i + 1) % 3];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d > best) {
        best = d;
        longest = i;
      }
    }
    const a = points[longest];
    const b = points[(longest + 1) % 3];
    points.splice(longest + 1, 0, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  }

  if (signedArea(points) < 0) points = points.slice().reverse();

  const bounds = polygonBounds(points);
  const boxCorners: Point[] = [
    [bounds.left, bounds.top],
    [bounds.right, bounds.top],
    [bounds.right, bounds.bottom],
    [bounds.left, bounds.bottom],
  ];
  const nearestTo = (corner: Point) => {
    let index = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const d = Math.hypot(p[0] - corner[0], p[1] - corner[1]);
      if (d < best) {
        best = d;
        index = i;
      }
    });
    return index;
  };

  const n = points.length;
  const first = nearestTo(boxCorners[0]);
  const rotated = points.map((_, i) => points[(first + i) % n]);
  let cut = boxCorners.map((corner) => (nearestTo(corner) - first + n) % n);

  // Corners must stay in order around the outline; even spacing is the fallback.
  const ordered = cut[0] === 0 && cut[1] > 0 && cut[2] > cut[1] && cut[3] > cut[2];
  if (!ordered) {
    cut = [0, Math.round(n / 4), Math.round(n / 2), Math.round((3 * n) / 4)];
  }

  const slice = (from: number, to: number) => rotated.slice(from, to + 1);
  return {
    top: slice(cut[0], cut[1]),
    right: slice(cut[1], cut[2]),
    // Both of these run backwards around the outline, so flip them to point
    // left-to-right and top-to-bottom like the sides they pair with.
    bottom: slice(cut[2], cut[3]).reverse(),
    left: [...rotated.slice(cut[3]), rotated[0]].reverse(),
    corners: [rotated[cut[0]], rotated[cut[1]], rotated[cut[2]], rotated[cut[3]]],
  };
}

/** Bilinear sample of `image` at a pixel position, written into `dst`. */
function sampleBilinear(
  image: ImageData,
  sx: number,
  sy: number,
  dst: Uint8ClampedArray,
  at: number,
): void {
  const w = image.width;
  const h = image.height;
  const src = image.data;
  const cx = sx < 0 ? 0 : sx > w - 1.001 ? w - 1.001 : sx;
  const cy = sy < 0 ? 0 : sy > h - 1.001 ? h - 1.001 : sy;

  const x0 = cx | 0;
  const y0 = cy | 0;
  const x1 = x0 + 1 < w ? x0 + 1 : x0;
  const y1 = y0 + 1 < h ? y0 + 1 : y0;
  const fx = cx - x0;
  const fy = cy - y0;
  const w00 = (1 - fx) * (1 - fy);
  const w10 = fx * (1 - fy);
  const w01 = (1 - fx) * fy;
  const w11 = fx * fy;
  const o00 = (y0 * w + x0) * 4;
  const o10 = (y0 * w + x1) * 4;
  const o01 = (y1 * w + x0) * 4;
  const o11 = (y1 * w + x1) * 4;

  dst[at] = src[o00] * w00 + src[o10] * w10 + src[o01] * w01 + src[o11] * w11;
  dst[at + 1] = src[o00 + 1] * w00 + src[o10 + 1] * w10 + src[o01 + 1] * w01 + src[o11 + 1] * w11;
  dst[at + 2] = src[o00 + 2] * w00 + src[o10 + 2] * w10 + src[o01 + 2] * w01 + src[o11 + 2] * w11;
  dst[at + 3] = 255;
}

/**
 * Pulls an outline of any shape straight into a rectangle with a Coons patch:
 * the four boundary curves are interpolated across the interior, so a dragged
 * dot bends the cloth around it instead of just moving a bounding box.
 */
function coonsUnwarp(image: ImageData, polygon: readonly Point[]): ImageData {
  const pixels = polygon.map(([x, y]) => [x * image.width, y * image.height] as Point);
  const sides = outlineSides(pixels);
  const [p00, p10, p11, p01] = sides.corners;

  const top = arcLengthSampler(sides.top);
  const right = arcLengthSampler(sides.right);
  const bottom = arcLengthSampler(sides.bottom);
  const left = arcLengthSampler(sides.left);

  const length = (points: readonly Point[]) => {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    }
    return total;
  };
  const outW = Math.max(
    8,
    Math.min(2600, Math.round((length(sides.top) + length(sides.bottom)) / 2)),
  );
  const outH = Math.max(
    8,
    Math.min(2600, Math.round((length(sides.left) + length(sides.right)) / 2)),
  );

  // Walking the boundary curves once per row/column keeps the inner loop cheap.
  const topLut: Point[] = [];
  const bottomLut: Point[] = [];
  for (let x = 0; x < outW; x++) {
    const u = outW === 1 ? 0 : x / (outW - 1);
    topLut.push(top(u));
    bottomLut.push(bottom(u));
  }
  const leftLut: Point[] = [];
  const rightLut: Point[] = [];
  for (let y = 0; y < outH; y++) {
    const v = outH === 1 ? 0 : y / (outH - 1);
    leftLut.push(left(v));
    rightLut.push(right(v));
  }

  const out = new ImageData(outW, outH);
  for (let y = 0; y < outH; y++) {
    const v = outH === 1 ? 0 : y / (outH - 1);
    const l = leftLut[y];
    const r = rightLut[y];
    for (let x = 0; x < outW; x++) {
      const u = outW === 1 ? 0 : x / (outW - 1);
      const t = topLut[x];
      const b = bottomLut[x];

      const sx =
        (1 - v) * t[0] +
        v * b[0] +
        (1 - u) * l[0] +
        u * r[0] -
        ((1 - u) * (1 - v) * p00[0] +
          u * (1 - v) * p10[0] +
          (1 - u) * v * p01[0] +
          u * v * p11[0]);
      const sy =
        (1 - v) * t[1] +
        v * b[1] +
        (1 - u) * l[1] +
        u * r[1] -
        ((1 - u) * (1 - v) * p00[1] +
          u * (1 - v) * p10[1] +
          (1 - u) * v * p01[1] +
          u * v * p11[1]);

      sampleBilinear(image, sx, sy, out.data, (y * outW + x) * 4);
    }
  }
  return out;
}

/**
 * Cuts the cloth out of a prepared photo. Four points are pulled straight by a
 * perspective warp; any other number is pulled straight by a Coons patch, so
 * the outline's real shape drives the result. Afterwards the cut is turned so
 * the pallu ends up at the bottom.
 */
function extractCloth(image: ImageData, cut: Cut): ImageData {
  const out =
    cut.polygon.length === 4 ? unwarpQuad(image, cut.polygon) : coonsUnwarp(image, cut.polygon);

  if (cut.palluEnd === "start") {
    // The renderer always wants the pallu last, so flip the whole cut.
    const pixels = new Uint32Array(out.data.buffer);
    const copy = new Uint32Array(pixels);
    for (let i = 0, n = out.width * out.height; i < n; i++) pixels[i] = copy[n - 1 - i];
  }
  return out;
}

/** Derives a cut from a detected layout, in the coordinates of `bounds`. */
function cutFromLayout(cloth: ImageData, bounds: Rect): Cut {
  const layout = analyseLayout(cloth, 0);
  const w = layout.width;
  const h = layout.height;
  const spanX = bounds.right - bounds.left;
  const spanY = bounds.bottom - bounds.top;
  const end = layout.pallu.end;
  const palluFraction =
    end === "end" ? 1 - layout.pallu.width / h : end === "start" ? layout.pallu.width / h : null;

  return {
    polygon: rectToPolygon(bounds),
    ...bounds,
    selvedgeL: bounds.left + (layout.selvedge[0].width / w) * spanX,
    selvedgeR: bounds.left + (1 - layout.selvedge[1].width / w) * spanX,
    pallu: palluFraction === null ? null : bounds.top + palluFraction * spanY,
    palluEnd: end,
    repeat: (layout.repeat / h) * spanY,
  };
}

// ---------------------------------------------------------------------------
// Pallu hints for built-in fabrics
// ---------------------------------------------------------------------------

const palluHintCache = new Map<string, Promise<PalluHint | null>>();

async function loadImageData(url: string): Promise<ImageData> {
  const bitmap = await createImageBitmap(await (await fetch(url)).blob());
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Looks at a fabric image to see whether it carries its own pallu, so studio
 * plates can place it correctly. Cached per URL; failures resolve to null.
 */
function palluHint(url: string): Promise<PalluHint | null> {
  const cached = palluHintCache.get(url);
  if (cached) return cached;

  const pending = loadImageData(url)
    .then((image) => {
      const layout = analyseLayout(image);
      if (layout.rotation !== 0 || layout.pallu.end === "none") return null;
      const depth = layout.pallu.width / Math.max(1, layout.height);
      if (!(depth > 0.02) || depth > 0.6) return null;
      return { depth: Math.min(0.6, depth), atStart: layout.pallu.end === "start" };
    })
    .catch(() => null);

  palluHintCache.set(url, pending);
  return pending;
}

// ---------------------------------------------------------------------------
// Cut editor
// ---------------------------------------------------------------------------

/** Backing resolution of the editor canvas; CSS scales it to the panel width. */
const EDITOR_WIDTH = 560;
/** Pointer slack, in displayed pixels, for grabbing a dot or an edge. */
const POINT_HIT = 10;
const EDGE_HIT = 20;

const OUTLINE_COLOR = "#4fbf8b";
const PALLU_COLOR = "#d98a3f";
const REPEAT_COLOR = "#6f8cff";

/** What the pointer grabbed when a drag started. */
type DragTarget = { kind: "point"; index: number } | { kind: "pallu" };

interface CutEditorProps {
  image: ImageData;
  cut: Cut;
  onChange: (cut: Cut) => void;
  onCommit: () => void;
}

function drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.beginPath();
  ctx.arc(x, y, 5.5, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/**
 * The straightened photo with the cut drawn over it. Points can be dragged,
 * double-clicked to add or remove, and the pallu line dragged along the length.
 */
function CutEditor({ image, cut, onChange, onCommit }: CutEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<DragTarget | null>(null);
  const movedRef = useRef(false);
  // Where a new point would land if the user double-clicked right now.
  const [ghost, setGhost] = useState<Point | null>(null);

  // Downscale the photo once per image; the overlay redraws far more often.
  useEffect(() => {
    const scale = EDITOR_WIDTH / image.width;
    const preview = document.createElement("canvas");
    preview.width = EDITOR_WIDTH;
    preview.height = Math.max(1, Math.round(image.height * scale));

    const source = document.createElement("canvas");
    source.width = image.width;
    source.height = image.height;
    source.getContext("2d")!.putImageData(image, 0, 0);

    const ctx = preview.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, preview.width, preview.height);
    previewRef.current = preview;

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = preview.width;
      canvas.height = preview.height;
    }
  }, [image]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const preview = previewRef.current;
    if (!canvas || !preview) return;

    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;
    ctx.drawImage(preview, 0, 0);

    const left = cut.left * w;
    const right = cut.right * w;
    const top = cut.top * h;
    const bottom = cut.bottom * h;
    const points = cut.polygon.map(([x, y]) => [x * w, y * h] as Point);

    const tracePolygon = () => {
      ctx.beginPath();
      points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
    };

    // Dim everything outside the outline.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fill("evenodd");
    ctx.restore();

    ctx.save();
    tracePolygon();
    ctx.clip();

    // Selvedge bands and their edges.
    ctx.fillStyle = "rgba(79,191,139,0.22)";
    const selvedgeL = cut.selvedgeL * w;
    const selvedgeR = cut.selvedgeR * w;
    if (selvedgeL > left) ctx.fillRect(left, top, selvedgeL - left, bottom - top);
    if (selvedgeR < right) ctx.fillRect(selvedgeR, top, right - selvedgeR, bottom - top);

    ctx.strokeStyle = "rgba(79,191,139,0.9)";
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1;
    for (const x of [selvedgeL, selvedgeR]) {
      if (x > left && x < right) {
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // Pallu band, plus a few repeat lines marching away from it.
    if (cut.pallu !== null && cut.palluEnd !== "none") {
      const palluY = cut.pallu * h;
      ctx.fillStyle = "rgba(217,138,63,0.22)";
      if (cut.palluEnd === "end") {
        ctx.fillRect(left, palluY, right - left, Math.max(0, bottom - palluY));
      } else {
        ctx.fillRect(left, top, right - left, Math.max(0, palluY - top));
      }

      if (cut.repeat > 0) {
        const repeat = cut.repeat * h;
        ctx.strokeStyle = REPEAT_COLOR;
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.5;
        for (let i = 1; i <= 3; i++) {
          const y = cut.palluEnd === "end" ? palluY - repeat * i : palluY + repeat * i;
          if (y < top || y > bottom) break;
          ctx.beginPath();
          ctx.moveTo(left, y);
          ctx.lineTo(right, y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    }
    ctx.restore();

    // The pallu line itself sits above the clip so its handle stays visible.
    if (cut.pallu !== null && cut.palluEnd !== "none") {
      const palluY = cut.pallu * h;
      ctx.strokeStyle = PALLU_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left, palluY);
      ctx.lineTo(right, palluY);
      ctx.stroke();
      drawHandle(ctx, (left + right) / 2, palluY, PALLU_COLOR);
    }

    ctx.strokeStyle = OUTLINE_COLOR;
    ctx.lineWidth = 2;
    tracePolygon();
    ctx.stroke();
    for (const [x, y] of points) drawHandle(ctx, x, y, OUTLINE_COLOR);

    // Hovering the outline previews the point a double-click would add.
    if (ghost) {
      const gx = ghost[0] * w;
      const gy = ghost[1] * h;
      ctx.beginPath();
      ctx.arc(gx, gy, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(79,191,139,0.35)";
      ctx.fill();
      ctx.strokeStyle = OUTLINE_COLOR;
      ctx.setLineDash([3, 2]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx - 3, gy);
      ctx.lineTo(gx + 3, gy);
      ctx.moveTo(gx, gy - 3);
      ctx.lineTo(gx, gy + 3);
      ctx.stroke();
    }
  }, [cut, image, ghost]);

  /** Pointer position as a fraction of the canvas, plus its pixel size. */
  const localPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      fx: (event.clientX - rect.left) / rect.width,
      fy: (event.clientY - rect.top) / rect.height,
      w: rect.width,
      h: rect.height,
    };
  };

  const hitTest = useCallback(
    (fx: number, fy: number, w: number, h: number): DragTarget | null => {
      let hit: DragTarget | null = null;
      let best = POINT_HIT;
      cut.polygon.forEach(([x, y], index) => {
        const d = Math.hypot((fx - x) * w, (fy - y) * h);
        if (d <= best) {
          best = d;
          hit = { kind: "point", index };
        }
      });
      if (hit) return hit;

      const onPallu =
        cut.pallu !== null &&
        cut.palluEnd !== "none" &&
        fx >= cut.left - 0.02 &&
        fx <= cut.right + 0.02 &&
        Math.abs(fy - cut.pallu) * h <= POINT_HIT;
      return onPallu ? { kind: "pallu" } : null;
    },
    [cut],
  );

  /** Closest point on the outline, used to insert a new corner. */
  const nearestEdge = useCallback(
    (fx: number, fy: number, w: number, h: number) => {
      const polygon = cut.polygon;
      let best = { edge: 0, x: polygon[0][0], y: polygon[0][1], d: Infinity };
      for (let i = 0; i < polygon.length; i++) {
        const [ax, ay] = polygon[i];
        const [bx, by] = polygon[(i + 1) % polygon.length];
        const dx = (bx - ax) * w;
        const dy = (by - ay) * h;
        const lengthSq = dx * dx + dy * dy || 1e-9;
        const t = Math.min(
          1,
          Math.max(0, ((fx - ax) * w * dx + (fy - ay) * h * dy) / lengthSq),
        );
        const px = ax + (bx - ax) * t;
        const py = ay + (by - ay) * t;
        const d = Math.hypot((fx - px) * w, (fy - py) * h);
        if (d < best.d) best = { edge: i, x: px, y: py, d };
      }
      return best;
    },
    [cut],
  );

  const endDrag = () => {
    if (dragRef.current) {
      dragRef.current = null;
      if (movedRef.current) onCommit();
    }
  };

  return (
    <div className="map">
      <canvas
        ref={canvasRef}
        style={{ touchAction: "none" }}
        onPointerDown={(event) => {
          const { fx, fy, w, h } = localPoint(event);
          const target = hitTest(fx, fy, w, h);
          if (!target) return;
          dragRef.current = target;
          movedRef.current = false;
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // Pointer capture is best-effort.
          }
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          const { fx, fy, w, h } = localPoint(event);
          const canvas = event.currentTarget;

          if (!dragRef.current) {
            const target = hitTest(fx, fy, w, h);
            if (target) {
              canvas.style.cursor = target.kind === "pallu" ? "ns-resize" : "move";
              setGhost(null);
              return;
            }
            const edge = nearestEdge(fx, fy, w, h);
            const near = edge.d <= EDGE_HIT;
            canvas.style.cursor = near ? "copy" : "default";
            setGhost((current) => {
              if (!near) return current === null ? current : null;
              if (current && current[0] === edge.x && current[1] === edge.y) return current;
              return [edge.x, edge.y];
            });
            return;
          }

          setGhost(null);
          movedRef.current = true;
          const x = Math.min(1, Math.max(0, fx));
          const y = Math.min(1, Math.max(0, fy));
          const target = dragRef.current;
          if (target.kind === "point") {
            onChange(
              withPolygon(
                cut,
                cut.polygon.map((p, i) => (i === target.index ? ([x, y] as Point) : p)),
              ),
            );
          } else {
            onChange({ ...cut, pallu: Math.min(cut.bottom, Math.max(cut.top, y)) });
          }
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => setGhost(null)}
        onDoubleClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const fx = (event.clientX - rect.left) / rect.width;
          const fy = (event.clientY - rect.top) / rect.height;
          const target = hitTest(fx, fy, rect.width, rect.height);

          if (target && target.kind === "point") {
            if (cut.polygon.length <= 3) return;
            onChange(withPolygon(cut, cut.polygon.filter((_, i) => i !== target.index)));
            onCommit();
            return;
          }
          if (target) return;

          const edge = nearestEdge(fx, fy, rect.width, rect.height);
          const polygon = [...cut.polygon];
          polygon.splice(edge.edge + 1, 0, [edge.x, edge.y]);
          onChange(withPolygon(cut, polygon));
          onCommit();
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Studio state
// ---------------------------------------------------------------------------

/** Params an uploaded fabric starts from. */
const UPLOAD_DEFAULT_PARAMS: PackedParams = [1.114, 1.199, 1, 1.284, 3, 0.782, 0.167, 1];

const SAMPLE_SAREES = [
  { label: "Striped, tight crop", src: "/samples/1-ref.jpeg" },
  { label: "Paithani", src: "/samples/4-ref.png" },
  { label: "Shop floor", src: "/samples/5-ref.jpg" },
];

interface StudioState {
  poseId: string;
  model: number;
  textureIndex: number;
  params: DrapeParams;
  custom: SareeTexture[];
  rotations: Record<string, number>;
}

const INITIAL_STATE: StudioState = {
  poseId: "model-1",
  model: 0,
  textureIndex: 0,
  params: { ...config.Jp },
  custom: [],
  rotations: {},
};

/** An uploaded photo and everything derived from it. */
interface Upload {
  photo: ImageData;
  originalUrl: string;
  autoTrim: boolean;
  /** Look for the cloth inside a busy photo rather than trusting the trim. */
  findCloth: boolean;
  nudge: number;
  prepared: PreparedPhoto | null;
  cut: Cut | null;
  detected: Cut | null;
}

/** Built-in fabrics, then anything the user uploaded. */
function textureList(state: StudioState): SareeTexture[] {
  return state.custom.length ? [...config.XT, ...state.custom] : config.XT;
}

function textureLabel(texture: SareeTexture): string {
  if (texture.id.startsWith("upload")) return "your upload";
  if (texture.id.startsWith("ref")) return texture.id.replace("ref-", "ref ");
  return texture.id.replace("t", "saree ");
}

/** The facts panel under the cut editor. */
function cutFacts(cut: Cut): Array<[string, string]> {
  const pct = (value: number) => `${Math.round(100 * value)}%`;
  const spanX = Math.max(1e-6, cut.right - cut.left);
  const spanY = Math.max(1e-6, cut.bottom - cut.top);
  const palluDepth =
    cut.pallu === null
      ? 0
      : cut.palluEnd === "end"
        ? (cut.bottom - cut.pallu) / spanY
        : (cut.pallu - cut.top) / spanY;

  return [
    [
      "Selvedges",
      `${pct((cut.selvedgeL - cut.left) / spanX)} · ${pct((cut.right - cut.selvedgeR) / spanX)} of width`,
    ],
    [
      "Pallu",
      cut.palluEnd === "none" || cut.pallu === null
        ? "none found"
        : `${cut.palluEnd === "end" ? "bottom" : "top"} · ${pct(palluDepth)} of length`,
    ],
    ["Repeat", cut.repeat > 0 ? `${pct(cut.repeat / spanY)} of length` : "none found"],
    [
      "Outline",
      `${cut.polygon.length} points · ${cut.polygon.length === 4 ? "perspective" : "shaped"} · ${pct(spanX)} × ${pct(spanY)}`,
    ],
  ];
}

// ---------------------------------------------------------------------------
// Studio
// ---------------------------------------------------------------------------

export default function Studio() {
  const searchParams = useSearchParams();

  const [state, setState] = useState<StudioState>(INITIAL_STATE);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState("");
  const [detectingId, setDetectingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateDescriptor | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [palluHints, setPalluHints] = useState<Record<string, PalluHint | null>>({});

  // Uploads live in a ref because the ImageData in them must not be cloned on
  // every render; `bump` is what actually repaints after they are mutated.
  const [, setTick] = useState(0);
  const bump = () => setTick((n) => n + 1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<engine.m | null>(null);
  const uploadsRef = useRef(new Map<string, Upload>());
  const uploadCount = useRef(0);
  const exportStarted = useRef(false);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cutCardRef = useRef<HTMLDivElement | null>(null);
  // Set once a fresh upload has been detected; cleared when it is scrolled to.
  const [scrollToCut, setScrollToCut] = useState(false);

  // Mirrors of state that async callbacks need to read at their own pace.
  const stateRef = useRef<StudioState>(INITIAL_STATE);
  stateRef.current = state;
  const popupOpenRef = useRef(false);
  popupOpenRef.current = popupOpen;

  const textures = useMemo(() => textureList(state), [state]);
  const activeTexture = textures[state.textureIndex];
  const activeUpload = uploadsRef.current.get(activeTexture.id) ?? null;
  const pose = useMemo(
    () => POSES.find((p) => p.id === state.poseId) ?? POSES[0],
    [state.poseId],
  );

  // --- pallu placement -----------------------------------------------------

  // Built-in fabrics get their pallu inferred from the image itself.
  useEffect(() => {
    if (activeUpload || palluHints[activeTexture.src] !== undefined) return;
    let alive = true;
    palluHint(activeTexture.src).then((hint) => {
      if (alive) setPalluHints((current) => ({ ...current, [activeTexture.src]: hint }));
    });
    return () => {
      alive = false;
    };
  }, [activeTexture.src, activeUpload, palluHints]);

  // An uploaded fabric uses the pallu line from its cut instead.
  const palluInfo = useMemo<PalluHint | null>(() => {
    const cut = activeUpload?.cut;
    if (!cut || cut.pallu === null || cut.palluEnd === "none") {
      return activeUpload ? null : (palluHints[activeTexture.src] ?? null);
    }
    const span = Math.max(1e-6, cut.bottom - cut.top);
    const depth =
      cut.palluEnd === "end" ? (cut.bottom - cut.pallu) / span : (cut.pallu - cut.top) / span;
    return { depth: Math.min(0.6, Math.max(0.02, depth)), atStart: false };
  }, [activeUpload, palluHints, activeTexture.src]);
  const palluDepth = palluInfo?.depth;

  // --- rendering -----------------------------------------------------------

  const buildMeshOptions = useCallback((snapshot: StudioState): MeshRenderOptions => {
    const model = config.L6[snapshot.model];
    const texture = textureList(snapshot)[snapshot.textureIndex];
    return {
      model: snapshot.model,
      cutout: model.cutout,
      bw: model.bw,
      texture: texture.src,
      params: snapshot.params,
      gradientShadow: model.gradientShadow,
      gradientHighlights: model.gradientHighlights,
      rotation: snapshot.rotations[texture.id] ?? 0,
    };
  }, []);

  // Studio plates need their template loaded before anything can be drawn.
  useEffect(() => {
    if (pose.kind !== "uv") {
      setTemplate(null);
      setTemplateError(null);
      return;
    }
    let alive = true;
    setTemplateError(null);
    templates
      .Yz(pose.id)
      .then((loaded) => {
        if (alive) setTemplate(loaded);
      })
      .catch((err: unknown) => {
        if (alive) setTemplateError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      alive = false;
    };
  }, [pose]);

  // Boot the WebGL engine once.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let alive = true;
    let instance: engine.m;
    try {
      instance = new engine.m(canvas, Number(searchParams.get("scale") ?? "1") || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }
    engineRef.current = instance;

    (async () => {
      const meshes = await (await fetch("/meshes.json")).json();
      if (!alive) return;
      instance.setMeshes(meshes);
      await instance.prepare(buildMeshOptions(stateRef.current));
      if (alive) setReady(true);
    })().catch((err: unknown) =>
      setError(err instanceof Error ? err.message : String(err)),
    );

    return () => {
      alive = false;
    };
    // Deliberately runs once: the engine owns the canvas for the page's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw whenever anything the frame depends on changes.
  useEffect(() => {
    const instance = engineRef.current;
    if (!instance || !ready) return;

    let alive = true;
    const snapshotPopup = () => {
      if (popupOpenRef.current) setPreviewUrl(instance.canvas.toDataURL("image/jpeg", 0.92));
    };

    if (pose.kind === "uv") {
      if (!template || template.id !== pose.id) return;
      const texture = textureList(state)[state.textureIndex];
      const options: UvRenderOptions = {
        template,
        texture: texture.src,
        params: state.params,
        rotation: state.rotations[texture.id] ?? 0,
        palluDepth,
        fabricPalluAtStart: palluInfo?.atStart ?? false,
        ...TEMPLATE_OVERRIDES[template.id],
      };
      instance
        .prepareUv(options)
        .then(() => {
          if (alive) {
            instance.renderUv(options);
            snapshotPopup();
          }
        })
        .catch((err: unknown) => setError(String(err)));
    } else {
      const options = buildMeshOptions(state);
      instance
        .prepare(options)
        .then(() => {
          if (alive) {
            instance.render(options);
            snapshotPopup();
          }
        })
        .catch((err: unknown) => setError(String(err)));
    }

    return () => {
      alive = false;
    };
  }, [state, ready, buildMeshOptions, pose, template, palluDepth, palluInfo]);

  // --- selection -----------------------------------------------------------

  const selectPose = useCallback((next: PoseCard) => {
    setState((current) =>
      next.kind === "mesh"
        ? {
            ...current,
            poseId: next.id,
            model: next.model,
            params: { ...current.params, ...config.L6[next.model].defaults },
          }
        : {
            ...current,
            poseId: next.id,
            params: { ...UV_DEFAULT_PARAMS, UV_Tiling: current.params.UV_Tiling },
          },
    );
  }, []);

  const selectTexture = useCallback((index: number, openPopup = true) => {
    setState((current) => ({
      ...current,
      textureIndex: index,
      // Studio plates keep their own look; meshes adopt the fabric's defaults.
      params: current.poseId.startsWith("holo-")
        ? { ...UV_DEFAULT_PARAMS }
        : config.Rm(textureList(current)[index].defaults),
    }));
    if (openPopup) setPopupOpen(true);
  }, []);

  const setParam = useCallback((param: ParamName, value: number) => {
    setState((current) => ({ ...current, params: { ...current.params, [param]: value } }));
  }, []);

  const rotateTexture = useCallback(() => {
    setState((current) => {
      const id = textureList(current)[current.textureIndex].id;
      return {
        ...current,
        rotations: { ...current.rotations, [id]: ((current.rotations[id] ?? 0) + 1) % 4 },
      };
    });
  }, []);

  const downloadPng = useCallback(() => {
    const instance = engineRef.current;
    if (!instance) return;
    // A mesh frame may have been overwritten by the popup snapshot.
    if (pose.kind === "mesh") instance.render(buildMeshOptions(stateRef.current));

    const link = document.createElement("a");
    link.href = instance.toPNG();
    const texture = textureList(stateRef.current)[stateRef.current.textureIndex];
    link.download = `saree-${stateRef.current.poseId}-${texture.id}.png`;
    link.click();
  }, [buildMeshOptions, pose]);

  // --- uploads and detection ----------------------------------------------

  /** Swaps in a newly cut image for an uploaded fabric, freeing the old one. */
  const replaceUploadImage = useCallback(async (id: string, cloth: ImageData) => {
    const upload = uploadsRef.current.get(id);
    if (!upload) return;
    const url = await imageLib.nL(cloth);
    setState((current) => ({
      ...current,
      custom: current.custom.map((texture) => {
        if (texture.id !== id) return texture;
        if (texture.src !== upload.originalUrl) {
          engineRef.current?.release(texture.src);
          URL.revokeObjectURL(texture.src);
        }
        return { ...texture, src: url, thumb: url };
      }),
    }));
  }, []);

  const cutOf = (upload: Upload) => extractCloth(upload.prepared!.full, upload.cut!);

  const detect = useCallback(
    async (id: string) => {
      const upload = uploadsRef.current.get(id);
      if (!upload) return;

      setDetectingId(id);
      // Let the spinner paint before the synchronous detection blocks.
      await new Promise((resolve) => setTimeout(resolve, 30));

      const prepared = imageLib.Fu(upload.photo, {
        autoTrim: upload.autoTrim,
        nudge: upload.nudge,
      });
      upload.prepared = prepared;

      let polygon = prepared.corners
        ? orderCorners(prepared.corners)
        : rectToPolygon(prepared.crop);
      let bounds = polygonBounds(polygon);

      // Keeping most of the frame means the trim pass found little backdrop to
      // cut, which is what happens with a photo shot in a shop: the cloth is
      // held up in front of rails, shelves and the seller. Look for the cloth
      // itself, and take that answer when it is a real improvement. On a plain
      // flat-lay the search finds no backdrop at all and returns null, so this
      // cannot spoil the photos the trim pass already handles well.
      if (
        upload.findCloth &&
        bounds.right - bounds.left > 0.75 &&
        bounds.bottom - bounds.top > 0.75
      ) {
        const found = findClothBounds(prepared.full);
        if (found) {
          const trimArea = (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
          const foundArea = (found.right - found.left) * (found.bottom - found.top);
          if (foundArea < trimArea * 0.92) {
            polygon = rectToPolygon(found);
            bounds = polygonBounds(polygon);
          }
        }
      }
      const boxCut: Cut = {
        polygon,
        ...bounds,
        selvedgeL: bounds.left,
        selvedgeR: bounds.right,
        pallu: null,
        palluEnd: "none",
        repeat: 0,
      };

      upload.detected = {
        ...cutFromLayout(extractCloth(prepared.full, boxCut), bounds),
        polygon,
      };
      upload.cut = { ...upload.detected };

      await replaceUploadImage(id, cutOf(upload));
      setDetectingId(null);
      bump();
    },
    [replaceUploadImage],
  );

  const recut = useCallback(() => {
    const upload = uploadsRef.current.get(activeTexture.id);
    if (upload && upload.prepared && upload.cut) replaceUploadImage(activeTexture.id, cutOf(upload));
  }, [activeTexture.id, replaceUploadImage]);

  const updateCut = useCallback(
    (cut: Cut) => {
      const upload = uploadsRef.current.get(activeTexture.id);
      if (!upload) return;
      upload.cut = cut;
      bump();
    },
    [activeTexture.id],
  );

  const redetect = useCallback(() => {
    const upload = uploadsRef.current.get(activeTexture.id);
    if (!upload || !upload.prepared || !upload.detected) return;
    upload.cut = { ...upload.detected };
    bump();
    replaceUploadImage(activeTexture.id, cutOf(upload));
  }, [activeTexture.id, replaceUploadImage]);

  /** Adds a pallu line, or flips it to the other end. */
  const togglePallu = useCallback(() => {
    const upload = uploadsRef.current.get(activeTexture.id);
    if (!upload || !upload.prepared || !upload.cut) return;
    const cut = upload.cut;

    upload.cut =
      cut.palluEnd === "none" || cut.pallu === null
        ? { ...cut, palluEnd: "end", pallu: cut.bottom - (cut.bottom - cut.top) * 0.2 }
        : {
            ...cut,
            palluEnd: cut.palluEnd === "end" ? "start" : "end",
            pallu: cut.top + cut.bottom - cut.pallu,
          };
    bump();
    replaceUploadImage(activeTexture.id, cutOf(upload));
  }, [activeTexture.id, replaceUploadImage]);

  const addUploads = useCallback(
    async (files: Blob[]) => {
      setError(null);
      for (const file of files) {
        let photo: ImageData;
        try {
          photo = await imageLib.ZL(file);
        } catch (err: unknown) {
          setError(
            err instanceof Error ? err.message : "That file could not be read as an image.",
          );
          continue;
        }

        uploadCount.current += 1;
        const id = `upload-${uploadCount.current}`;
        const url = await imageLib.nL(photo, 0.85);
        uploadsRef.current.set(id, {
          photo,
          originalUrl: url,
          autoTrim: true,
          findCloth: true,
          nudge: 0,
          prepared: null,
          cut: null,
          detected: null,
        });

        setState((current) => {
          const custom = [
            ...current.custom,
            { id, src: url, thumb: url, defaults: UPLOAD_DEFAULT_PARAMS, extra: true },
          ];
          const next = { ...current, custom };
          return {
            ...next,
            textureIndex: textureList(next).length - 1,
            params: config.Rm(UPLOAD_DEFAULT_PARAMS),
          };
        });

        await detect(id);
        // The outline is the next thing to look at, so bring it into view.
        setScrollToCut(true);
      }
    },
    [detect],
  );

  const loadSample = useCallback(
    async (src: string) => {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Sample not found (${response.status})`);
        await addUploads([await response.blob()]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [addUploads],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setDragOver(false);
      const files = Array.from(event.dataTransfer.files ?? []);
      if (files.length) addUploads(files);
    },
    [addUploads],
  );

  const setAutoTrim = useCallback(
    (value: boolean) => {
      if (!activeUpload) return;
      activeUpload.autoTrim = value;
      detect(activeTexture.id);
    },
    [activeUpload, activeTexture.id, detect],
  );

  const setFindCloth = useCallback(
    (value: boolean) => {
      if (!activeUpload) return;
      activeUpload.findCloth = value;
      detect(activeTexture.id);
    },
    [activeUpload, activeTexture.id, detect],
  );

  /** Nudging re-runs detection, so it is debounced while the slider moves. */
  const setNudge = useCallback(
    (value: number) => {
      if (!activeUpload) return;
      activeUpload.nudge = value;
      bump();
      if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
      nudgeTimer.current = setTimeout(() => void detect(activeTexture.id), 250);
    },
    [activeUpload, activeTexture.id, detect],
  );

  useEffect(() => {
    if (!scrollToCut) return;
    // Scroll straight away: clearing the flag re-runs this effect, so anything
    // deferred to a later frame would be cancelled by its own cleanup.
    cutCardRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    setScrollToCut(false);
  }, [scrollToCut]);

  // --- popup ---------------------------------------------------------------

  useEffect(() => {
    if (!popupOpen) return;
    const instance = engineRef.current;
    if (instance && ready) setPreviewUrl(instance.canvas.toDataURL("image/jpeg", 0.92));

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPopupOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [popupOpen, ready]);

  // --- headless export -----------------------------------------------------

  // `?export=name` renders one frame from the query string and POSTs it back,
  // which is how batches of stills are produced without driving the UI.
  useEffect(() => {
    if (!ready || exportStarted.current) return;
    const name = searchParams.get("export");
    if (!name) return;
    exportStarted.current = true;

    const poseId = searchParams.get("pose");
    const model = Math.max(0, Math.min(2, Number(searchParams.get("model") ?? "1") - 1));
    const textureId = searchParams.get("texture") ?? config.XT[0].id;

    let textureIndex = config.XT.findIndex((t) => t.id === textureId);
    const custom: SareeTexture[] = [];
    if (textureIndex < 0) {
      custom.push({
        id: textureId,
        src: `/textures/${textureId}.webp`,
        thumb: `/textures/${textureId}.webp`,
        defaults: UPLOAD_DEFAULT_PARAMS,
        extra: true,
      });
      textureIndex = config.XT.length;
    }

    const rotation = ((Number(searchParams.get("rotate") ?? "0") % 4) + 4) % 4;
    const isPlate = !!poseId && poseId.startsWith("holo-");
    const exportState: StudioState = {
      ...INITIAL_STATE,
      custom,
      poseId: isPlate ? poseId : `model-${model + 1}`,
      model,
      textureIndex,
      params: isPlate
        ? { ...UV_DEFAULT_PARAMS }
        : config.Rm(textureList({ ...INITIAL_STATE, custom })[textureIndex].defaults),
      rotations: { [textureId]: rotation },
    };
    setState(exportState);

    const instance = engineRef.current!;
    const post = async () => {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, dataUrl: instance.toPNG() }),
      });
      const result = await response.json();
      setExportStatus(
        result.path ? `exported ${result.path}` : `export failed: ${result.error}`,
      );
    };

    const num = (key: string) => Number(searchParams.get(key));
    const flag = (key: string) => searchParams.get(key) === "1";

    if (isPlate) {
      templates
        .Yz(poseId)
        .then(async (loaded) => {
          const src = textureList(exportState)[textureIndex].src;
          const hint = await palluHint(src);
          const options: UvRenderOptions = {
            template: loaded,
            texture: src,
            params: exportState.params,
            rotation,
            palluDepth: searchParams.has("pallu") ? num("pallu") : hint?.depth,
            fabricPalluAtStart: !searchParams.has("pallu") && !!hint?.atStart,
            ...TEMPLATE_OVERRIDES[loaded.id],
            ...(searchParams.has("flipU") ? { flipU: flag("flipU") } : {}),
            ...(searchParams.has("flipV") ? { flipV: flag("flipV") } : {}),
            ...(searchParams.has("pw") ? { palluFlipW: flag("pw") } : {}),
            ...(searchParams.has("pl") ? { palluFlipL: flag("pl") } : {}),
            ...(searchParams.has("ls") ? { lengthScale: num("ls") } : {}),
            ...(searchParams.has("tuck") ? { tuckOffset: num("tuck") } : {}),
          };
          await instance.prepareUv(options);
          instance.renderUv(options);
          await post();
        })
        .catch((err: unknown) => setExportStatus(`export failed: ${String(err)}`));
    } else {
      const options = buildMeshOptions(exportState);
      instance
        .prepare(options)
        .then(async () => {
          instance.render(options);
          await post();
        })
        .catch((err: unknown) => setExportStatus(`export failed: ${String(err)}`));
    }
  }, [ready, searchParams, buildMeshOptions]);

  // --- view ----------------------------------------------------------------

  const rotation = state.rotations[activeTexture.id] ?? 0;
  const isDetecting = detectingId === activeTexture.id;

  return (
    <div className="shell">
      <div className="side">
        <div className="brand">
          <strong>Saree Try On</strong>
          <span>pick a drape, upload a saree, see it draped</span>
        </div>

        <div className="card">
          <h2>
            <span className="n">1</span>Drape template
          </h2>
          <div className="templates">
            {POSES.map((item) => (
              <button
                key={item.id}
                className={item.id === state.poseId ? "on" : ""}
                onClick={() => selectPose(item)}
                title={item.note}
              >
                <img src={item.thumb} alt={item.name} loading="lazy" />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
          <p className="note">
            {pose.note}
            {pose.kind === "uv"
              ? " Studio plate: the cloth follows the pose’s own fold field, so it curves rather than facets."
              : " Traced mesh from the original app."}
          </p>
          {templateError && <p className="err">{templateError}</p>}
        </div>

        <div className="card">
          <h2>
            <span className="n">2</span>Saree
          </h2>
          <label
            className={`drop${dragOver ? " over" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                if (files.length) addUploads(files);
              }}
            />
            <strong>Drop a saree photo</strong>
            <p>or click to choose · flat shot, borders visible</p>
          </label>

          <div className="samples">
            {SAMPLE_SAREES.map((sample) => (
              <button key={sample.src} onClick={() => void loadSample(sample.src)}>
                {sample.label}
              </button>
            ))}
          </div>

          {error && <p className="err">{error}</p>}

          <div className="library">
            {textures.map((texture, index) => (
              <button
                key={texture.id}
                className={index === state.textureIndex ? "on" : ""}
                title={textureLabel(texture)}
                onClick={() => selectTexture(index)}
              >
                <img
                  src={texture.thumb}
                  alt={textureLabel(texture)}
                  style={{ transform: `rotate(${(state.rotations[texture.id] ?? 0) * 90}deg)` }}
                />
                {texture.extra && (
                  <span className="tag">
                    {texture.id.startsWith("upload") ? "yours" : "ref"}
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="note">Click a saree to open it next to the drape.</p>
        </div>

        {activeUpload && (
          <div className="card">
            <h2>
              <span className="n">3</span>Detection
            </h2>
            <div className="compare">
              <figure>
                <img src={activeUpload.originalUrl} alt="As uploaded" />
                <figcaption>as uploaded</figcaption>
              </figure>
              <figure>
                <img src={activeTexture.src} alt="Cloth found" />
                <figcaption>{isDetecting ? "detecting…" : "cloth only"}</figcaption>
              </figure>
            </div>

            <label className="check">
              <input
                type="checkbox"
                checked={activeUpload.autoTrim}
                onChange={(event) => setAutoTrim(event.target.checked)}
              />
              Trim the backdrop and straighten
            </label>

            <label className="check">
              <input
                type="checkbox"
                checked={activeUpload.findCloth}
                onChange={(event) => setFindCloth(event.target.checked)}
              />
              Find the saree in a busy photo
            </label>

            <p className={isDetecting ? "note busy" : "note"} style={{ marginTop: 2 }}>
              {isDetecting
                ? "Detecting the cloth…"
                : imageLib.q0(activeUpload.prepared, activeUpload.autoTrim)}
            </p>

            {activeUpload.autoTrim && (
              <div className="row">
                <label>Nudge</label>
                <input
                  type="range"
                  min={-5}
                  max={5}
                  step={0.1}
                  value={activeUpload.nudge}
                  onChange={(event) => setNudge(+event.target.value)}
                />
                <span className="val">
                  {activeUpload.nudge > 0 ? "+" : ""}
                  {activeUpload.nudge.toFixed(1)}°
                </span>
              </div>
            )}
          </div>
        )}

        {activeUpload && activeUpload.prepared && activeUpload.cut && (
          <div className="card" ref={cutCardRef}>
            <h2>
              <span className="n">4</span>Detected cut
            </h2>
            <CutEditor
              image={activeUpload.prepared.full}
              cut={activeUpload.cut}
              onChange={updateCut}
              onCommit={recut}
            />

            <div className="legend">
              <span>
                <i style={{ background: OUTLINE_COLOR }} />
                outline · drag points, double-click to add or remove
              </span>
              <span>
                <i style={{ background: PALLU_COLOR }} />
                pallu end · drag
              </span>
              <span>
                <i style={{ background: "rgba(79,191,139,0.5)" }} />
                selvedge
              </span>
              <span>
                <i style={{ background: REPEAT_COLOR }} />
                repeat
              </span>
            </div>

            <div className="facts" style={{ marginTop: 8 }}>
              {cutFacts(activeUpload.cut).map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <b>{value}</b>
                </div>
              ))}
            </div>

            <div className="btnrow" style={{ marginTop: 10 }}>
              <button onClick={togglePallu}>
                {activeUpload.cut.palluEnd === "none"
                  ? "Add pallu line"
                  : activeUpload.cut.palluEnd === "end"
                    ? "Pallu at top"
                    : "Pallu at bottom"}
              </button>
              <button onClick={redetect}>Re-detect</button>
            </div>

            <p className="note">
              The whole photo, straightened. The green outline starts on the four corners of the
              cloth that was found. Drag the points to the true corners. Hover the outline and a
              faint dot appears &mdash; double-click there to add a point, and double-click any
              point to remove it (three is the minimum). With four points the cloth is pulled
              straight by a perspective warp; with more, the outline is followed as a curve, so a
              saree with a wavy or uneven edge still comes out as a clean rectangle. Drag the orange
              line to where the pallu starts; the cut is turned so the pallu ends up at the bottom,
              where the original app keeps it.
            </p>
          </div>
        )}

        <div className="card">
          <h2>
            <span className="n">{activeUpload ? 5 : 3}</span>Tweak
          </h2>
          <div className="btnrow">
            <button onClick={rotateTexture}>Rotate 90° ({90 * rotation}°)</button>
            <button onClick={() => selectTexture(state.textureIndex, false)}>Reset</button>
          </div>

          {config.dU.map((slider) => (
            <div key={slider.param} className="row">
              <label>{slider.label}</label>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={state.params[slider.param]}
                onChange={(event) => setParam(slider.param, +event.target.value)}
              />
              <span className="val">{state.params[slider.param].toFixed(2)}</span>
            </div>
          ))}

          <div className="btnrow" style={{ marginTop: 10 }}>
            <button className="primary" onClick={downloadPng} disabled={!ready}>
              Download PNG
            </button>
            <button onClick={() => setPopupOpen(true)} disabled={!ready}>
              Open popup
            </button>
          </div>

          <p className="note">
            The classic one-to-one layout of the original app is at{" "}
            <a href="/classic" style={{ color: "var(--accent)" }}>
              /classic
            </a>
            . Trace the drape lines for a new pose at{" "}
            <a href="/trace" style={{ color: "var(--accent)" }}>
              /trace
            </a>
            .
          </p>
        </div>
      </div>

      <div className="stage">
        <div className="name">
          {pose.name} · {textureLabel(activeTexture)}
        </div>
        {(exportStatus || isDetecting) && (
          <div className="badge">{isDetecting ? "detecting cloth…" : exportStatus}</div>
        )}
        {!ready && !error && <div className="empty">Loading the drape…</div>}
        {error && <div className="empty">{error}</div>}
        <canvas ref={canvasRef} style={{ display: ready ? "block" : "none" }} />
      </div>

      {popupOpen && (
        <div className="modal" onClick={() => setPopupOpen(false)}>
          <div className="modal-box" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <strong>{textureLabel(activeTexture)}</strong>
                <span>on {pose.name}</span>
              </div>
              <div className="btnrow">
                <button onClick={rotateTexture}>Rotate 90°</button>
                <button className="primary" onClick={downloadPng}>
                  Download PNG
                </button>
                <button onClick={() => setPopupOpen(false)}>Close</button>
              </div>
            </div>

            <div className="modal-body">
              <div className="pane">
                <h3>Saree</h3>
                <div className="img">
                  <img
                    src={activeTexture.src}
                    alt={textureLabel(activeTexture)}
                    style={{ transform: `rotate(${90 * rotation}deg)` }}
                  />
                </div>
                <div className="meta">
                  {activeUpload
                    ? imageLib.q0(activeUpload.prepared, activeUpload.autoTrim)
                    : "Built-in fabric from the original app."}
                </div>
              </div>

              <div className="pane">
                <h3>Draped</h3>
                <div className="img">{previewUrl && <img src={previewUrl} alt="Draped preview" />}</div>
                <div className="meta">
                  {pose.name}. {pose.note} Sliders in the panel update this live.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
