// A drape preview straight from the traced lines.
//
// The finished pipeline bakes a template pack and hands it to the WebGL
// engine. This is the check that comes before that: it lays a real saree
// between the two traced selvedges and shades it with the folds of the plate,
// so a trace can be judged by looking at cloth rather than at lines.
//
// It is deliberately a preview. There is no fold field, no occlusion order and
// no per-region control, so it will not match the engine pixel for pixel.

import type { TraceDoc, TracePoint } from "./trace";
import { lineLength, sareeWidthPx } from "./trace";

/** Evenly spaced points along a polyline, with their arc-length positions. */
function resample(points: readonly TracePoint[], count: number): TracePoint[] {
  if (points.length < 2) return [];
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    cumulative.push(
      cumulative[i - 1] +
        Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]),
    );
  }
  const total = cumulative[cumulative.length - 1];
  if (total <= 0) return [];

  const out: TracePoint[] = [];
  for (let k = 0; k < count; k++) {
    const target = (k / (count - 1)) * total;
    let i = 1;
    while (i < cumulative.length - 1 && cumulative[i] < target) i++;
    const span = cumulative[i] - cumulative[i - 1] || 1;
    const f = (target - cumulative[i - 1]) / span;
    out.push([
      points[i - 1][0] + (points[i][0] - points[i - 1][0]) * f,
      points[i - 1][1] + (points[i][1] - points[i - 1][1]) * f,
    ]);
  }
  return out;
}

/** Closest sample on a resampled curve: its distance and where along it sits. */
function nearest(curve: readonly TracePoint[], x: number, y: number) {
  let best = Infinity;
  let at = 0;
  for (let i = 0; i < curve.length; i++) {
    const dx = curve[i][0] - x;
    const dy = curve[i][1] - y;
    const d = dx * dx + dy * dy;
    if (d < best) {
      best = d;
      at = i;
    }
  }
  return { distance: Math.sqrt(best), t: at / (curve.length - 1) };
}

/** Joins the traced pieces of one selvedge into a single ordered curve. */
function joinLines(trace: TraceDoc, ids: string[]): TracePoint[] {
  const pieces = ids
    .map((id) => trace.lines.find((line) => line.id === id))
    .filter((line): line is NonNullable<typeof line> => !!line && line.points.length > 1)
    .map((line) => line.points);
  if (pieces.length === 0) return [];

  const joined: TracePoint[] = [...pieces[0]];
  for (let i = 1; i < pieces.length; i++) {
    const tail = joined[joined.length - 1];
    const piece = pieces[i];
    // Attach whichever end of the next piece is closer to where we are.
    const toHead = Math.hypot(piece[0][0] - tail[0], piece[0][1] - tail[1]);
    const toTail = Math.hypot(
      piece[piece.length - 1][0] - tail[0],
      piece[piece.length - 1][1] - tail[1],
    );
    joined.push(...(toHead <= toTail ? piece : [...piece].reverse()));
  }
  return joined;
}

export const WAIST_LINES = ["pallu-top", "pallu-outer", "cuff"];
export const HEM_LINES = ["pallu-front-chest", "pallu-front-floor", "hem"];

/** Mean colour grid, at most `maxDim` on the long side. */
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

/**
 * Finds the cloth in the picture.
 *
 * On the labelled render the saree is the test cloth: cream with coloured
 * bands. On a plain render it is one flat colour. Either way it is neither the
 * pale ground nor skin, so the test is "not the ground, and not skin".
 */
function clothMask(w: number, h: number, rgb: Float32Array): Uint8Array {
  // The ground is sampled from the frame corners.
  let gr = 0;
  let gg = 0;
  let gb = 0;
  let n = 0;
  const patch = Math.max(2, Math.round(Math.min(w, h) * 0.05));
  for (const [cx, cy] of [
    [0, 0],
    [w - patch, 0],
    [0, h - patch],
    [w - patch, h - patch],
  ]) {
    for (let y = cy; y < cy + patch; y++) {
      for (let x = cx; x < cx + patch; x++) {
        const o = (y * w + x) * 3;
        gr += rgb[o];
        gg += rgb[o + 1];
        gb += rgb[o + 2];
        n++;
      }
    }
  }
  gr /= n;
  gg /= n;
  gb /= n;

  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 3;
    const r = rgb[o];
    const g = rgb[o + 1];
    const b = rgb[o + 2];
    if (Math.hypot(r - gr, g - gg, b - gb) <= 26) continue; // ground

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max <= 0 ? 0 : (max - min) / max;
    // Skin is warm and mid-bright: red ahead of green ahead of blue.
    const skin = r > g && g > b && r - b > 22 && r - b < 120 && max > 90 && saturation < 0.5;
    if (skin) continue;
    if (max < 45) continue; // hair and deep shadow

    mask[i] = 1;
  }
  return mask;
}

export interface FieldInput {
  /** The picture the cloth is read from: the labelled render if there is one. */
  cloth: ImageData;
  /** The picture the folds are read from: the plain render if there is one. */
  shade: ImageData;
  trace: TraceDoc;
  /** Longest side of the field, and so of every picture painted from it. */
  maxDim?: number;
}

/**
 * Where every pixel of the drape sits on the cloth, worked out once.
 *
 * None of this depends on which saree is worn, so the expensive part — finding
 * each pixel's place between the two selvedges — is done a single time and then
 * reused for every fabric. That is what makes a sheet of a dozen sarees cheap
 * once the first one has been built.
 */
export interface DrapeField {
  w: number;
  h: number;
  /** 1 where the cloth is. */
  mask: Uint8Array;
  /** 0 at the waist selvedge, 1 at the hem selvedge. */
  across: Float32Array;
  /** 0 at the start of the drape, 1 at its end. */
  along: Float32Array;
  /** Fold shading, as a multiplier around 1. */
  shading: Float32Array;
  /** The plate itself, for everything that is not cloth. */
  plate: Float32Array;
  /** One saree width, in field pixels. */
  widthPx: number;
  /** The length of the drape, in field pixels. */
  alongPx: number;
  coverage: number;
}

/**
 * Evens out a coordinate across the cloth.
 *
 * A pixel's place along the drape comes from the nearest sample on a traced
 * curve, and that nearest sample flips from one to another as the curve bends,
 * which tears the fabric. Averaging each value with its neighbours inside the
 * cloth smooths the jumps out while leaving the overall run of the coordinate
 * alone.
 */
function relax(
  values: Float32Array,
  mask: Uint8Array,
  w: number,
  h: number,
  passes: number,
): void {
  const next = new Float32Array(values.length);
  for (let pass = 0; pass < passes; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (mask[i] !== 1) {
          next[i] = values[i];
          continue;
        }
        let sum = values[i];
        let n = 1;
        if (x > 0 && mask[i - 1] === 1) {
          sum += values[i - 1];
          n++;
        }
        if (x < w - 1 && mask[i + 1] === 1) {
          sum += values[i + 1];
          n++;
        }
        if (y > 0 && mask[i - w] === 1) {
          sum += values[i - w];
          n++;
        }
        if (y < h - 1 && mask[i + w] === 1) {
          sum += values[i + w];
          n++;
        }
        next[i] = sum / n;
      }
    }
    values.set(next);
  }
}

export function buildDrapeField(input: FieldInput): DrapeField | null {
  const waist = joinLines(input.trace, WAIST_LINES);
  const hem = joinLines(input.trace, HEM_LINES);
  if (waist.length < 2 || hem.length < 2) return null;

  const maxDim = input.maxDim ?? 420;
  const cloth = reduce(input.cloth, maxDim);
  const shade = reduce(input.shade, maxDim);
  const { w, h, step } = cloth;
  if (shade.w !== w || shade.h !== h) return null;

  const mask = clothMask(w, h, cloth.rgb);

  const toGrid = (points: TracePoint[]) =>
    resample(points, 160).map(([x, y]) => [x / step, y / step] as TracePoint);
  const waistCurve = toGrid(waist);
  const hemCurve = toGrid(hem);
  if (waistCurve.length < 2 || hemCurve.length < 2) return null;

  // Shading is the plate's own luminance, normalised over the cloth.
  let sum = 0;
  let count = 0;
  for (let i = 0; i < w * h; i++) {
    if (mask[i] !== 1) continue;
    const o = i * 3;
    sum += 0.299 * shade.rgb[o] + 0.587 * shade.rgb[o + 1] + 0.114 * shade.rgb[o + 2];
    count++;
  }
  if (count === 0) return null;
  const meanLuma = sum / count;

  const across = new Float32Array(w * h);
  const along = new Float32Array(w * h);
  const shading = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (mask[i] !== 1) continue;

      const a = nearest(waistCurve, x, y);
      const b = nearest(hemCurve, x, y);
      const total = a.distance + b.distance || 1;
      const u = a.distance / total;
      across[i] = u;
      along[i] = a.t * (1 - u) + b.t * u;

      const o = i * 3;
      const luma = 0.299 * shade.rgb[o] + 0.587 * shade.rgb[o + 1] + 0.114 * shade.rgb[o + 2];
      shading[i] = Math.min(1.8, Math.max(0.35, luma / Math.max(1, meanLuma)));
    }
  }

  // Across the cloth the coordinate is already smooth; along it, the nearest
  // sample flips as the curves bend, so it needs the most settling.
  relax(across, mask, w, h, 4);
  relax(along, mask, w, h, 16);

  return {
    w,
    h,
    mask,
    across,
    along,
    shading,
    plate: shade.rgb,
    widthPx: sareeWidthPx(input.trace) / step,
    alongPx: Math.max(lineLength(waist), lineLength(hem)) / step,
    coverage: count / (w * h),
  };
}

/** Paints one saree into a field that has already been worked out. */
export function paintFabric(field: DrapeField, fabric: ImageData): ImageData {
  const { w, h, mask, across, along, shading, plate } = field;
  const fabricW = fabric.width;
  const fabricH = fabric.height;
  // Keep the weave square: one pixel across the cloth is one pixel along it.
  const scale =
    field.widthPx > 0 ? fabricW / field.widthPx : fabricW / Math.max(1, w * 0.4);

  const out = new ImageData(w, h);
  const dst = out.data;
  const src = fabric.data;

  for (let i = 0; i < w * h; i++) {
    const o = i * 3;
    const at = i * 4;

    if (mask[i] !== 1) {
      // Outside the cloth, keep the plate so the figure still reads.
      dst[at] = plate[o];
      dst[at + 1] = plate[o + 1];
      dst[at + 2] = plate[o + 2];
      dst[at + 3] = 255;
      continue;
    }

    let fx = Math.round(across[i] * field.widthPx * scale) % fabricW;
    let fy = Math.round(along[i] * field.alongPx * scale) % fabricH;
    if (fx < 0) fx += fabricW;
    if (fy < 0) fy += fabricH;
    const fo = (fy * fabricW + fx) * 4;

    const light = shading[i];
    dst[at] = Math.min(255, src[fo] * light);
    dst[at + 1] = Math.min(255, src[fo + 1] * light);
    dst[at + 2] = Math.min(255, src[fo + 2] * light);
    dst[at + 3] = 255;
  }
  return out;
}
