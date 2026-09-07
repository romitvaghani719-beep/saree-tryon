// Shared domain types for the saree studio.
//
// These describe the data that flows between the recovered engine/image
// libraries and the React components. They were reconstructed from the
// compiled production bundle, so the field names match what the runtime
// actually reads.

/** The eight shading uniforms the drape shaders take. */
export type ParamName =
  | "Brightness"
  | "Saturate"
  | "Expose_Amount"
  | "Shadow_Color"
  | "Highlight_Color"
  | "Highlight_Multiplication"
  | "Screen_Amount"
  | "UV_Tiling";

export type DrapeParams = Record<ParamName, number>;

/** Packed form of {@link DrapeParams}, in the canonical `ParamName` order. */
export type PackedParams = readonly number[];

/** A point in normalised [0,1] image space. */
export type Point = readonly [number, number];

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Which end of the cloth the pallu sits at. */
export type PalluEnd = "start" | "end" | "none";

/** A detected border band, as a fraction of the axis and a confidence. */
export interface Band {
  width: number;
  strength: number;
}

export interface PalluBand extends Band {
  end: PalluEnd;
}

/** Result of scanning one axis of a downsampled image. */
export interface AxisAnalysis {
  bands: [Band, Band];
  profile: Float32Array;
}

/** A downsampled RGB image used by the detection passes. */
export interface Grid {
  w: number;
  h: number;
  rgb: Float32Array;
}

/** What the detector concluded about a saree photo. */
export interface ClothLayout {
  rotation: number;
  flip: boolean;
  width: number;
  height: number;
  /** Left and right selvedge bands, in pixels. */
  selvedge: [Band, Band];
  pallu: { end: PalluEnd; width: number; strength: number };
  /** Motif repeat period in pixels, or 0 when none was found. */
  repeat: number;
}

/** The editable outline over a prepared photo. */
export interface Cut extends Rect {
  polygon: Point[];
  selvedgeL: number;
  selvedgeR: number;
  pallu: number | null;
  palluEnd: PalluEnd;
  repeat: number;
}

export interface TrimReport {
  trimmed: boolean;
  angle: number;
  coverage: number;
  trim: { left: number; top: number; right: number; bottom: number };
  suggestedAngle: number | null;
}

/** Output of the trim/straighten pass. */
export interface PreparedPhoto {
  full: ImageData;
  trimmed: ImageData;
  crop: Rect;
  corners: Point[] | null;
  report: TrimReport | null;
  turned: boolean;
}

export interface PrepareOptions {
  autoTrim: boolean;
  nudge: number;
}

/** A selectable fabric — built in, reference, or uploaded. */
export interface SareeTexture {
  id: string;
  src: string;
  thumb: string;
  defaults: PackedParams;
  /** Set on reference and uploaded fabrics, which get a corner tag. */
  extra?: boolean;
}

/** One of the three traced mesh models. */
export interface MeshModel {
  id: number;
  cutout: string;
  bw: string;
  thumb: string;
  gradientShadow: Gradient;
  gradientHighlights: Gradient;
  defaults: Partial<DrapeParams>;
}

export interface Gradient {
  offsets: number[];
  colors: number[];
}

/** A slider in the Tweak panel. */
export interface SliderSpec {
  label: string;
  param: ParamName;
  top: number;
  height: number;
  min: number;
  max: number;
  step: number;
  initial: number;
}

/** A drape the user can pick: either a traced mesh or a studio plate. */
export interface PoseCard {
  id: string;
  name: string;
  note: string;
  thumb: string;
  kind: "mesh" | "uv";
  model: number;
}

/** One UV region of a studio plate. */
export interface TemplatePanel {
  id: string;
  index: number;
  role: string;
  uSpan: number;
  vSpan: number;
  areaPct: number;
}

/** Hand-authored corrections for a studio plate, when present. */
export interface TemplateFix {
  regions?: Record<
    string,
    {
      role?: number;
      flipW?: boolean;
      flipL?: boolean;
      len?: number;
      wid?: number;
      offL?: number;
      offW?: number;
      show?: boolean;
    }
  >;
}

/** A studio plate, as returned by `loadTemplate`. */
export interface TemplateDescriptor {
  id: string;
  name: string;
  kind: string;
  width: number;
  height: number;
  panels: TemplatePanel[];
  uv: { sareeWidthPx: number; pxPerMetre: number; palluAt: string };
  fix: TemplateFix | null;
  base: string;
  mannequinUrl: string;
  shadingUrl: string;
  panelsUrl: string;
  uvUrl: string;
  thumb: string;
  [key: string]: unknown;
}

/** Per-region uniform arrays handed to the UV shader. */
export interface RegionUniforms {
  uSpan: Float32Array;
  vSpan: Float32Array;
  role: Int32Array;
  flipW: Float32Array;
  flipL: Float32Array;
  len: Float32Array;
  wid: Float32Array;
  offL: Float32Array;
  offW: Float32Array;
  show: Float32Array;
}

/** Everything the mesh renderer needs for one frame. */
export interface MeshRenderOptions {
  model: number;
  cutout: string;
  bw: string;
  texture: string;
  params: DrapeParams;
  gradientShadow: Gradient;
  gradientHighlights: Gradient;
  rotation: number;
}

/** Everything the studio-plate renderer needs for one frame. */
export interface UvRenderOptions {
  template: TemplateDescriptor;
  texture: string;
  params: DrapeParams;
  rotation: number;
  palluDepth?: number;
  fabricPalluAtStart?: boolean;
  flipU?: boolean;
  flipV?: boolean;
  palluFlipW?: boolean;
  palluFlipL?: boolean;
  lengthScale?: number;
  tuckOffset?: number;
}

/** Where a fabric's own pallu sits, inferred from the texture image. */
export interface PalluHint {
  depth: number;
  atStart: boolean;
}
