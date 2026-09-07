// Types for lib/engine.js (recovered bundle module 6072).
import type { MeshRenderOptions, UvRenderOptions } from "./types";

/** WebGL2 drape engine. Exported from the bundle as `m`. */
export declare class m {
  constructor(canvas: HTMLCanvasElement, scale?: number);
  readonly canvas: HTMLCanvasElement;
  /** Installs the traced mesh geometry from meshes.json. */
  setMeshes(meshes: unknown): void;
  /** Uploads the textures a mesh frame needs. */
  prepare(options: MeshRenderOptions): Promise<void>;
  render(options: MeshRenderOptions): boolean;
  /** Uploads the textures a studio-plate frame needs. */
  prepareUv(options: UvRenderOptions): Promise<void>;
  renderUv(options: UvRenderOptions): void;
  /** Drops a cached texture so a replaced upload is re-read. */
  release(src: string): void;
  toPNG(): string;
}

/** Background compositor. Exported from the bundle as `c`. */
export declare class c {
  constructor(width: number, height: number);
  readonly canvas: HTMLCanvasElement;
  render(options: unknown): void;
}
