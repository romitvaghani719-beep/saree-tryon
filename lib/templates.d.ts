// Types for lib/templates.js (recovered bundle module 4586).
import type { RegionUniforms, TemplateDescriptor, TemplateFix, UvRenderOptions } from "./types";

/** Loads and caches a studio plate descriptor (template.json + optional fix.json). */
export declare function Yz(id: string): Promise<TemplateDescriptor>;
/** Builds the per-region uniform arrays for the UV shader. */
export declare function SC(
  template: TemplateDescriptor,
  fix: TemplateFix | null,
  options: UvRenderOptions,
): RegionUniforms;
/** Maximum number of UV regions the shaders support. */
export declare const xn: number;
