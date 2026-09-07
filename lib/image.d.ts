// Types for lib/image.js (recovered bundle module 1894).
import type { PrepareOptions, PreparedPhoto } from "./types";

/** Decodes a file into ImageData, downscaled to fit `maxSize`. */
export declare function ZL(file: Blob, maxSize?: number): Promise<ImageData>;
/** Encodes ImageData to a JPEG object URL. */
export declare function nL(image: ImageData, quality?: number): Promise<string>;
/** Trims the backdrop and straightens the photo. */
export declare function Fu(photo: ImageData, options: PrepareOptions): PreparedPhoto;
/** Human-readable summary of what the trim pass did. */
export declare function q0(prepared: PreparedPhoto | null, autoTrim: boolean): string;
