// The trace document: the hand-placed lines that describe how a saree is
// draped on one pose, plus the measurements that turn them into real cloth
// sizes. This is what the Trace Studio reads and writes, and what the plate
// build will consume to produce a templates-pack pose.
//
// Coordinates are in pixels of the pose image, so a trace stays meaningful
// next to the render it was drawn on.

/** A point in image pixel space. */
export type TracePoint = [number, number];

/**
 * What a line means on the cloth.
 *
 * `waist` and `hem` are the two selvedges — the long edges of the saree — and
 * `pallu` is the decorated end. `guide` lines carry no cloth meaning; they
 * mark body landmarks the build uses to place things.
 */
export type LineRole = "waist" | "hem" | "pallu" | "guide";

export const ROLE_COLOR: Record<LineRole, string> = {
  waist: "#4f8bf5",
  hem: "#3fbf7f",
  pallu: "#e2504b",
  guide: "#e0b44a",
};

export interface TraceLine {
  id: string;
  label: string;
  role: LineRole;
  /** True for lines the silhouette can supply on its own. */
  fromSilhouette: boolean;
  /** Ordered polyline. Empty until traced. */
  points: TracePoint[];
}

export interface TraceDoc {
  version: 1;
  pose: string;
  image: { width: number; height: number };
  /** Height of the figure in the picture, and what that is in real life. */
  figure: { heightPx: number; metres: number };
  /** Width of the saree across the cloth, in metres. */
  sareeWidthMetres: number;
  lines: TraceLine[];
}

/**
 * The nine lines from the two-render brief, in the order they are placed.
 *
 * The first six are drawn by hand on the plain render; the last three can be
 * read off the silhouette, so they start empty and are filled by auto-detect.
 */
export const DEFAULT_LINES: ReadonlyArray<Omit<TraceLine, "points">> = [
  {
    id: "pallu-top",
    label: "Top of the pallu across the chest",
    role: "waist",
    fromSilhouette: false,
  },
  {
    id: "pallu-front-chest",
    label: "Pallu front edge over the chest",
    role: "hem",
    fromSilhouette: false,
  },
  {
    id: "pallu-front-floor",
    label: "Front edge below the hands, to the floor",
    role: "hem",
    fromSilhouette: false,
  },
  {
    id: "wrap-lower",
    label: "Lower edge of the wrap, hip to hands",
    role: "hem",
    fromSilhouette: false,
  },
  {
    id: "sleeve-seam",
    label: "Where the sleeve meets the body",
    role: "guide",
    fromSilhouette: false,
  },
  {
    id: "cuff",
    label: "The cuff, where the waist selvedge lands",
    role: "waist",
    fromSilhouette: false,
  },
  { id: "hem", label: "The hem", role: "hem", fromSilhouette: true },
  { id: "pallu-foot", label: "The foot of the pallu", role: "pallu", fromSilhouette: true },
  {
    id: "pallu-outer",
    label: "The outer edge of the pallu",
    role: "waist",
    fromSilhouette: true,
  },
];

export function emptyTrace(pose: string, width: number, height: number): TraceDoc {
  return {
    version: 1,
    pose,
    image: { width, height },
    figure: { heightPx: 0, metres: 1.7 },
    sareeWidthMetres: 1.1,
    lines: DEFAULT_LINES.map((line) => ({ ...line, points: [] })),
  };
}

/** Pixels per metre, from the figure's height in the picture. */
export function pixelsPerMetre(trace: TraceDoc): number {
  if (trace.figure.heightPx <= 0 || trace.figure.metres <= 0) return 0;
  return trace.figure.heightPx / trace.figure.metres;
}

/** One saree width, in pixels of this picture. */
export function sareeWidthPx(trace: TraceDoc): number {
  return pixelsPerMetre(trace) * trace.sareeWidthMetres;
}

/** Length of a polyline in pixels. */
export function lineLength(points: readonly TracePoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return total;
}

export function serialiseTrace(trace: TraceDoc): string {
  return JSON.stringify(trace, null, 1);
}

/**
 * Reads a trace file, keeping the standard lines in their usual order and
 * carrying over anything extra the file happens to contain.
 */
export function parseTrace(text: string): TraceDoc {
  const raw: unknown = JSON.parse(text);
  if (!raw || typeof raw !== "object") throw new Error("That file is not a trace.");
  const doc = raw as Partial<TraceDoc>;
  if (!Array.isArray(doc.lines)) throw new Error("That trace has no lines.");
  if (!doc.image || typeof doc.image.width !== "number" || typeof doc.image.height !== "number") {
    throw new Error("That trace does not say what size picture it was drawn on.");
  }

  const byId = new Map<string, TraceLine>();
  for (const line of doc.lines as TraceLine[]) {
    if (!line || typeof line.id !== "string" || !Array.isArray(line.points)) continue;
    const points = line.points
      .filter(
        (p): p is TracePoint =>
          Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]),
      )
      .map(([x, y]) => [x, y] as TracePoint);
    byId.set(line.id, { ...line, points });
  }

  const lines: TraceLine[] = DEFAULT_LINES.map((standard) => {
    const found = byId.get(standard.id);
    byId.delete(standard.id);
    return { ...standard, points: found ? found.points : [] };
  });
  for (const extra of byId.values()) lines.push(extra);

  return {
    version: 1,
    pose: typeof doc.pose === "string" ? doc.pose : "pose",
    image: { width: doc.image.width, height: doc.image.height },
    figure: {
      heightPx: doc.figure?.heightPx ?? 0,
      metres: doc.figure?.metres ?? 1.7,
    },
    sareeWidthMetres: doc.sareeWidthMetres ?? 1.1,
    lines,
  };
}
