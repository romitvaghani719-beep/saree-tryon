"use client";

// Trace Studio: the authoring side of a drape template.
//
// Drop in the two renders a pose needs, place the lines that say where the
// selvedges and the pallu run, and save the trace. The canvas zooms and pans,
// points are dragged, added and removed the same way as the cut editor on the
// home page, and auto-detect fills in whatever the pictures can supply on
// their own.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

import {
  DEFAULT_LINES,
  ROLE_COLOR,
  emptyTrace,
  lineLength,
  parseTrace,
  pixelsPerMetre,
  sareeWidthPx,
  serialiseTrace,
  type TraceDoc,
  type TracePoint,
} from "../lib/trace";
import { assignBandRuns, figureSilhouette, silhouetteOutline } from "../lib/silhouette";
import { buildDrapeField, paintFabric, type DrapeField } from "../lib/preview";
import * as config from "../lib/config.js";

/** One of the two pictures a pose is built from. */
interface Plate {
  name: string;
  bitmap: ImageBitmap;
  data: ImageData;
}

type Layer = "render" | "labelled" | "preview" | "sheet";
type Tool = "draw" | "pan";

interface View {
  scale: number;
  tx: number;
  ty: number;
}

const POINT_HIT = 9;
const EDGE_HIT = 14;
const MIN_SCALE = 0.05;
const MAX_SCALE = 12;

const textureCache = new Map<string, Promise<ImageData>>();

/** Loads one of the built-in fabrics as pixels, once per URL. */
function loadTexture(src: string): Promise<ImageData> {
  const cached = textureCache.get(src);
  if (cached) return cached;
  const pending = (async () => {
    const bitmap = await createImageBitmap(await (await fetch(src)).blob());
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  })();
  textureCache.set(src, pending);
  return pending;
}

async function readPlate(file: File): Promise<Plate> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D is unavailable in this browser.");
  ctx.drawImage(bitmap, 0, 0);
  return {
    name: file.name,
    bitmap,
    data: ctx.getImageData(0, 0, bitmap.width, bitmap.height),
  };
}

export default function TraceStudio() {
  const [render, setRender] = useState<Plate | null>(null);
  const [labelled, setLabelled] = useState<Plate | null>(null);
  const [trace, setTrace] = useState<TraceDoc>(() => emptyTrace("pose", 1792, 2400));
  const [activeId, setActiveId] = useState<string>(DEFAULT_LINES[0].id);
  const [layer, setLayer] = useState<Layer>("render");
  const [tool, setTool] = useState<Tool>("draw");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [view, setView] = useState<View>({ scale: 0.3, tx: 0, ty: 0 });
  const [preview, setPreview] = useState<ImageBitmap | null>(null);
  const [textureIndex, setTextureIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  /** Every saree drawn on this pose, for judging the template as a whole. */
  const [sheet, setSheet] = useState<Array<{ id: string; url: string }>>([]);
  const fieldRef = useRef<DrapeField | null>(null);
  const fieldKeyRef = useRef("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Pointer bookkeeping: whether a gesture has become a drag, and what it grabbed.
  const dragRef = useRef<{ kind: "point"; index: number } | { kind: "pan" } | null>(null);
  const movedRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [ghost, setGhost] = useState<TracePoint | null>(null);

  const activeLine = useMemo(
    () => trace.lines.find((line) => line.id === activeId) ?? trace.lines[0],
    [trace.lines, activeId],
  );
  // Either picture can be traced on. A is preferred, but a pose often arrives
  // as the labelled render alone.
  const plate = layer === "labelled" && labelled ? labelled : (render ?? labelled);
  const hasPicture = !!(render ?? labelled);

  const metrePx = pixelsPerMetre(trace);
  const widthPx = sareeWidthPx(trace);

  // --- view -----------------------------------------------------------------

  const fitToStage = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const box = stage.getBoundingClientRect();
    const scale = Math.min(
      (box.width - 32) / trace.image.width,
      (box.height - 32) / trace.image.height,
    );
    const safe = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    setView({
      scale: safe,
      tx: (box.width - trace.image.width * safe) / 2,
      ty: (box.height - trace.image.height * safe) / 2,
    });
  }, [trace.image.width, trace.image.height]);

  useEffect(() => {
    fitToStage();
  }, [fitToStage]);

  const zoomBy = useCallback((factor: number, atX?: number, atY?: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const box = stage.getBoundingClientRect();
    const cx = atX ?? box.width / 2;
    const cy = atY ?? box.height / 2;
    setView((current) => {
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, current.scale * factor));
      const k = next / current.scale;
      return { scale: next, tx: cx - (cx - current.tx) * k, ty: cy - (cy - current.ty) * k };
    });
  }, []);

  const onWheel = useCallback(
    (event: ReactWheelEvent<HTMLCanvasElement>) => {
      const box = stageRef.current?.getBoundingClientRect();
      if (!box) return;
      zoomBy(
        Math.exp(-event.deltaY * 0.0015),
        event.clientX - box.left,
        event.clientY - box.top,
      );
    },
    [zoomBy],
  );

  // --- drawing --------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const box = stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(box.width * dpr));
    canvas.height = Math.max(1, Math.round(box.height * dpr));
    canvas.style.width = `${box.width}px`;
    canvas.style.height = `${box.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#0f1116";
    ctx.fillRect(0, 0, box.width, box.height);

    ctx.save();
    ctx.translate(view.tx, view.ty);
    ctx.scale(view.scale, view.scale);

    if (layer === "preview" && preview) {
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(preview, 0, 0, trace.image.width, trace.image.height);
    } else if (plate) {
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(plate.bitmap, 0, 0);
    } else {
      ctx.fillStyle = "#1a1d25";
      ctx.fillRect(0, 0, trace.image.width, trace.image.height);
    }

    // Lines. The active one is drawn solid and on top of the rest.
    const stroke = 2 / view.scale;
    const ordered = [
      ...trace.lines.filter((line) => line.id !== activeLine?.id),
      ...trace.lines.filter((line) => line.id === activeLine?.id),
    ];
    for (const line of ordered) {
      if (line.points.length < 1) continue;
      const isActive = line.id === activeLine?.id;
      ctx.strokeStyle = ROLE_COLOR[line.role];
      ctx.globalAlpha = isActive ? 1 : 0.35;
      ctx.lineWidth = isActive ? stroke * 1.6 : stroke;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      if (line.points.length > 1) {
        ctx.beginPath();
        line.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }

      if (isActive) {
        const r = 5 / view.scale;
        for (const [x, y] of line.points) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 2 * Math.PI);
          ctx.fillStyle = ROLE_COLOR[line.role];
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.6)";
          ctx.lineWidth = 1.4 / view.scale;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    // Where a double-click would drop a new point.
    if (ghost && activeLine) {
      const r = 5.5 / view.scale;
      ctx.beginPath();
      ctx.arc(ghost[0], ghost[1], r, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fill();
      ctx.strokeStyle = ROLE_COLOR[activeLine.role];
      ctx.setLineDash([3 / view.scale, 2 / view.scale]);
      ctx.lineWidth = 1.5 / view.scale;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [plate, trace, view, activeLine, ghost, layer, preview]);

  // Redraw on resize so the canvas keeps filling the stage.
  useEffect(() => {
    const onResize = () => setView((v) => ({ ...v }));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // --- pointer --------------------------------------------------------------

  /** Pointer position in image pixels. */
  const toImage = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const box = stageRef.current!.getBoundingClientRect();
      return {
        x: (event.clientX - box.left - view.tx) / view.scale,
        y: (event.clientY - box.top - view.ty) / view.scale,
        sx: event.clientX,
        sy: event.clientY,
      };
    },
    [view],
  );

  const hitPoint = useCallback(
    (x: number, y: number): number => {
      if (!activeLine) return -1;
      const slack = POINT_HIT / view.scale;
      let hit = -1;
      let best = slack;
      activeLine.points.forEach(([px, py], i) => {
        const d = Math.hypot(px - x, py - y);
        if (d <= best) {
          best = d;
          hit = i;
        }
      });
      return hit;
    },
    [activeLine, view.scale],
  );

  const nearestEdge = useCallback(
    (x: number, y: number) => {
      if (!activeLine || activeLine.points.length < 2) return null;
      const points = activeLine.points;
      let best = { at: 0, x: 0, y: 0, d: Infinity };
      for (let i = 0; i < points.length - 1; i++) {
        const [ax, ay] = points[i];
        const [bx, by] = points[i + 1];
        const dx = bx - ax;
        const dy = by - ay;
        const lengthSq = dx * dx + dy * dy || 1e-9;
        const t = Math.min(1, Math.max(0, ((x - ax) * dx + (y - ay) * dy) / lengthSq));
        const px = ax + dx * t;
        const py = ay + dy * t;
        const d = Math.hypot(x - px, y - py);
        if (d < best.d) best = { at: i + 1, x: px, y: py, d };
      }
      return best;
    },
    [activeLine],
  );

  const updateActive = useCallback(
    (points: TracePoint[]) => {
      setTrace((current) => ({
        ...current,
        lines: current.lines.map((line) =>
          line.id === activeLine?.id ? { ...line, points } : line,
        ),
      }));
    },
    [activeLine?.id],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const { x, y, sx, sy } = toImage(event);
    movedRef.current = false;
    lastRef.current = { x: sx, y: sy };

    const index = tool === "draw" ? hitPoint(x, y) : -1;
    dragRef.current = index >= 0 ? { kind: "point", index } : { kind: "pan" };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort.
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const { x, y, sx, sy } = toImage(event);
    const drag = dragRef.current;

    if (!drag) {
      if (tool !== "draw" || !activeLine) {
        setGhost(null);
        return;
      }
      if (hitPoint(x, y) >= 0) {
        setGhost(null);
        event.currentTarget.style.cursor = "move";
        return;
      }
      const edge = nearestEdge(x, y);
      const near = edge !== null && edge.d <= EDGE_HIT / view.scale;
      event.currentTarget.style.cursor = near ? "copy" : "crosshair";
      setGhost((current) => {
        if (!near || !edge) return current === null ? current : null;
        if (current && current[0] === edge.x && current[1] === edge.y) return current;
        return [edge.x, edge.y];
      });
      return;
    }

    const last = lastRef.current;
    if (last && Math.hypot(sx - last.x, sy - last.y) > 3) movedRef.current = true;

    if (drag.kind === "pan") {
      if (!last) return;
      const dx = sx - last.x;
      const dy = sy - last.y;
      lastRef.current = { x: sx, y: sy };
      setView((current) => ({ ...current, tx: current.tx + dx, ty: current.ty + dy }));
      return;
    }

    if (!activeLine) return;
    setGhost(null);
    updateActive(
      activeLine.points.map((p, i) => (i === drag.index ? ([x, y] as TracePoint) : p)),
    );
  };

  const endGesture = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    lastRef.current = null;
    if (!drag || movedRef.current) return;

    // A click that never became a drag appends to the line being traced.
    if (drag.kind === "pan" && tool === "draw" && activeLine) {
      const { x, y } = toImage(event);
      updateActive([...activeLine.points, [x, y]]);
    }
  };

  const onDoubleClick = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (tool !== "draw" || !activeLine) return;
    const { x, y } = toImage(event);

    const index = hitPoint(x, y);
    if (index >= 0) {
      updateActive(activeLine.points.filter((_, i) => i !== index));
      return;
    }
    const edge = nearestEdge(x, y);
    if (edge && edge.d <= EDGE_HIT / view.scale) {
      const points = [...activeLine.points];
      points.splice(edge.at, 0, [edge.x, edge.y]);
      updateActive(points);
    }
  };

  // --- files ----------------------------------------------------------------

  /**
   * Reads whatever the pictures can supply on their own.
   *
   * Colour comes first: on the labelled render the painted bands say exactly
   * where the selvedges and the decorated end run. Edges fill the gaps, since
   * the silhouette still knows where the hem falls even with no bands to read.
   */
  const autoDetect = useCallback(
    (renderPlate: Plate | null, labelledPlate: Plate | null, quiet = false) => {
      const base = renderPlate ?? labelledPlate;
      if (!base) return;
      setError(null);

      const placed = new Map<string, TracePoint[]>();
      const notes: string[] = [];

      // Colour: the painted bands on the labelled render.
      if (labelledPlate) {
        const fromBands = assignBandRuns(labelledPlate.data, {
          width: labelledPlate.bitmap.width,
          height: labelledPlate.bitmap.height,
        });
        for (const [id, points] of fromBands) placed.set(id, points);
        if (fromBands.size > 0) notes.push(`${fromBands.size} lines from the bands`);
      }

      // Edges: the figure against the ground.
      let figureHeight = 0;
      const figure = figureSilhouette(base.data);
      if (figure.heightPx > 0) {
        figureHeight = Math.round(figure.heightPx);
        notes.push(`figure ${figureHeight} px`);

        const outline = silhouetteOutline(figure);
        if (outline.length > 2) {
          // The hem is the run of outline along the bottom of the figure.
          const cut = figure.bounds.bottom - figure.heightPx * 0.06;
          const low = outline
            .filter(([, y]) => y >= cut)
            .sort((a, b) => a[0] - b[0]);
          if (low.length > 1 && !placed.has("hem")) {
            placed.set("hem", low);
            notes.push("hem from the silhouette");
          }
          if (!placed.has("pallu-outer")) {
            // The outer edge is the tall run down the side the pallu falls on.
            const mid = (figure.bounds.left + figure.bounds.right) / 2;
            const side = outline.filter(
              ([x, y]) => x > mid && y > figure.bounds.top + figure.heightPx * 0.3 && y < cut,
            );
            if (side.length > 2) {
              placed.set("pallu-outer", side.sort((a, b) => a[1] - b[1]));
              notes.push("outer edge from the silhouette");
            }
          }
        }
      }

      if (placed.size === 0 && figureHeight === 0) {
        if (!quiet) setError("Nothing stood out from the background.");
        return;
      }

      setTrace((current) => ({
        ...current,
        figure: {
          ...current.figure,
          heightPx: figureHeight || current.figure.heightPx,
        },
        lines: current.lines.map((line) => {
          const points = placed.get(line.id);
          return points && points.length > 1 ? { ...line, points } : line;
        }),
      }));
      setStatus(notes.join(" · "));
    },
    [],
  );


  const loadPlate = useCallback(
    async (file: File, which: Layer) => {
      setError(null);
      try {
        const loaded = await readPlate(file);
        if (which === "render") {
          setRender(loaded);
          setTrace((current) => ({
            ...current,
            image: { width: loaded.bitmap.width, height: loaded.bitmap.height },
          }));
          setLayer("render");
        } else {
          setLabelled(loaded);
          setLayer("labelled");
        }
        setStatus(`${file.name} · ${loaded.bitmap.width} × ${loaded.bitmap.height}`);
        // Trace what the picture already tells us, so the lines are there to
        // adjust rather than to place from nothing.
        autoDetect(
          which === "render" ? loaded : render,
          which === "labelled" ? loaded : labelled,
          true,
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "That file could not be read.");
      }
    },
    [autoDetect, render, labelled],
  );

  /**
   * Works out where the cloth sits, and keeps it until the trace changes.
   *
   * The geometry does not depend on which saree is worn, so it is built once
   * and every fabric after the first is nearly free.
   */
  const drapeField = useCallback((): DrapeField | null => {
    const clothPlate = labelled ?? render;
    const shadePlate = render ?? labelled;
    if (!clothPlate || !shadePlate) {
      setError("Load a render first.");
      return null;
    }

    const key = JSON.stringify([
      clothPlate.name,
      shadePlate.name,
      trace.figure,
      trace.sareeWidthMetres,
      trace.lines.map((line) => [line.id, line.points.length, line.points[0], line.points.at(-1)]),
    ]);
    if (fieldRef.current && fieldKeyRef.current === key) return fieldRef.current;

    const field = buildDrapeField({
      cloth: clothPlate.data,
      shade: shadePlate.data,
      trace,
    });
    if (!field) {
      setError("Trace a waist selvedge and a hem selvedge first.");
      return null;
    }
    fieldRef.current = field;
    fieldKeyRef.current = key;
    return field;
  }, [labelled, render, trace]);

  /** Lays one saree between the traced selvedges. */
  const renderSaree = useCallback(
    async (index = textureIndex) => {
      setBusy(true);
      setError(null);
      try {
        const field = drapeField();
        if (!field) return;
        const fabric = await loadTexture(config.XT[index].src);
        setPreview(await createImageBitmap(paintFabric(field, fabric)));
        setTextureIndex(index);
        setLayer("preview");
        setStatus(
          `${config.XT[index].id} on this pose · cloth over ${Math.round(field.coverage * 100)}% of the frame`,
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "The preview failed.");
      } finally {
        setBusy(false);
      }
    },
    [drapeField, textureIndex],
  );

  /** Draws every saree on this pose, so the template can be judged at a glance. */
  const renderSheet = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const field = drapeField();
      if (!field) return;

      const canvas = document.createElement("canvas");
      canvas.width = field.w;
      canvas.height = field.h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D is unavailable in this browser.");

      const made: Array<{ id: string; url: string }> = [];
      for (const texture of config.XT) {
        const fabric = await loadTexture(texture.src);
        ctx.putImageData(paintFabric(field, fabric), 0, 0);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.85),
        );
        if (blob) made.push({ id: texture.id, url: URL.createObjectURL(blob) });
        // Let the page paint between sarees so the button stays responsive.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      setSheet((old) => {
        for (const item of old) URL.revokeObjectURL(item.url);
        return made;
      });
      setLayer("sheet");
      setStatus(`${made.length} sarees on this pose`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "The sheet failed.");
    } finally {
      setBusy(false);
    }
  }, [drapeField]);

  const exportTrace = useCallback(() => {
    const blob = new Blob([serialiseTrace(trace)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${trace.pose}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(`saved ${trace.pose}.json`);
  }, [trace]);

  const importTrace = useCallback(async (file: File) => {
    setError(null);
    try {
      const parsed = parseTrace(await file.text());
      setTrace(parsed);
      setActiveId(parsed.lines[0]?.id ?? DEFAULT_LINES[0].id);
      setStatus(`loaded ${file.name}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "That trace could not be read.");
    }
  }, []);

  // --- auto-detect ----------------------------------------------------------

  // --- view -----------------------------------------------------------------

  const traced = trace.lines.filter((line) => line.points.length > 1).length;

  return (
    <div className="shell">
      <div className="side">
        <div className="brand">
          <strong>Trace Studio</strong>
          <span>place the drape lines for a new pose</span>
        </div>

        <div className="card">
          <h2>
            <span className="n">1</span>Pose pictures
          </h2>

          <div className="row">
            <label>Pose</label>
            <input
              className="sel"
              value={trace.pose}
              onChange={(event) => setTrace((c) => ({ ...c, pose: event.target.value }))}
            />
          </div>

          <label className="drop" style={{ marginTop: 8 }}>
            <input
              type="file"
              accept="image/*"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void loadPlate(file, "render");
              }}
            />
            <strong>{render ? "Plain render ✓" : "Plain render (A)"}</strong>
            <p>{render ? render.name : "the pose in one flat colour"}</p>
          </label>

          <label className="drop" style={{ marginTop: 8 }}>
            <input
              type="file"
              accept="image/*"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void loadPlate(file, "labelled");
              }}
            />
            <strong>{labelled ? "Labelled render ✓" : "Labelled render (B)"}</strong>
            <p>{labelled ? labelled.name : "the same pose in the test cloth"}</p>
          </label>

          {error && <p className="err">{error}</p>}
          {!error && status && <p className="note">{status}</p>}
        </div>

        <div className="card">
          <h2>
            <span className="n">2</span>Auto-detect
          </h2>
          <div className="btnrow">
            <button onClick={() => autoDetect(render, labelled)} disabled={!render && !labelled}>
              Detect again
            </button>
          </div>
          <p className="note">
            This runs on its own as soon as a picture is loaded. Colour comes first: the painted
            bands on the labelled render give the blue waist selvedge, the green hem selvedge and
            the red pallu end, each split where it turns a corner. Edges fill the rest, reading the
            hem and the outer edge off the silhouette. Everything placed this way can still be
            dragged.
          </p>
        </div>

        <div className="card">
          <h2>
            <span className="n">3</span>Lines
          </h2>
          <ul className="roles" style={{ gap: 2 }}>
            {trace.lines.map((line, index) => (
              <li key={line.id}>
                <button
                  className={`sel${line.id === activeLine?.id ? " on" : ""}`}
                  onClick={() => setActiveId(line.id)}
                  style={{
                    textAlign: "left",
                    borderColor:
                      line.id === activeLine?.id ? ROLE_COLOR[line.role] : undefined,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <i
                    style={{
                      background: ROLE_COLOR[line.role],
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      flex: "0 0 auto",
                      display: "inline-block",
                    }}
                  />
                  <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                    {index + 1}. {line.label}
                  </span>
                  <b style={{ fontSize: 11, opacity: 0.7 }}>{line.points.length || "—"}</b>
                </button>
              </li>
            ))}
          </ul>

          <div className="btnrow" style={{ marginTop: 10 }}>
            <button onClick={() => updateActive([])} disabled={!activeLine?.points.length}>
              Clear line
            </button>
            <button
              onClick={() =>
                updateActive(activeLine ? activeLine.points.slice(0, -1) : [])
              }
              disabled={!activeLine?.points.length}
            >
              Undo point
            </button>
          </div>
          <p className="note">
            Click on the picture to add a point to the end of the selected line. Drag a point to
            move it, double-click the line to insert one, double-click a point to remove it.
          </p>
        </div>

        <div className="card">
          <h2>
            <span className="n">4</span>Scale
          </h2>
          <div className="row">
            <label>Figure px</label>
            <input
              className="sel"
              type="number"
              value={trace.figure.heightPx}
              onChange={(event) =>
                setTrace((c) => ({
                  ...c,
                  figure: { ...c.figure, heightPx: +event.target.value },
                }))
              }
            />
          </div>
          <div className="row">
            <label>Height m</label>
            <input
              className="sel"
              type="number"
              step="0.01"
              value={trace.figure.metres}
              onChange={(event) =>
                setTrace((c) => ({
                  ...c,
                  figure: { ...c.figure, metres: +event.target.value },
                }))
              }
            />
          </div>
          <div className="row">
            <label>Saree m</label>
            <input
              className="sel"
              type="number"
              step="0.01"
              value={trace.sareeWidthMetres}
              onChange={(event) =>
                setTrace((c) => ({ ...c, sareeWidthMetres: +event.target.value }))
              }
            />
          </div>
          <div className="facts" style={{ marginTop: 8 }}>
            <div>
              <span>Per metre</span>
              <b>{metrePx ? `${Math.round(metrePx)} px` : "—"}</b>
            </div>
            <div>
              <span>One saree width</span>
              <b>{widthPx ? `${Math.round(widthPx)} px` : "—"}</b>
            </div>
            <div>
              <span>Pallu length</span>
              <b>
                {(() => {
                  const foot = trace.lines.find((l) => l.id === "pallu-foot");
                  if (!foot || foot.points.length < 2 || !widthPx) return "—";
                  return `${(lineLength(foot.points) / widthPx).toFixed(2)} widths`;
                })()}
              </b>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>
            <span className="n">5</span>Try a saree
          </h2>
          <div className="library">
            {config.XT.map((texture, index) => (
              <button
                key={texture.id}
                className={index === textureIndex ? "on" : ""}
                title={texture.id}
                onClick={() => setTextureIndex(index)}
              >
                <img src={texture.thumb} alt={texture.id} loading="lazy" />
              </button>
            ))}
          </div>
          {!render && (
            <p className="caution">
              The folds are read from the plain render. Without it the labelled cloth is used
              instead, so its grid lines and letters show through the drape. Load render A for a
              clean result.
            </p>
          )}

          <div className="btnrow" style={{ marginTop: 10 }}>
            <button className="primary" onClick={() => void renderSheet()} disabled={busy}>
              {busy ? "Draping…" : "Try every saree"}
            </button>
            <button onClick={() => void renderSaree()} disabled={busy}>
              Just this one
            </button>
          </div>
          <div className="btnrow">
            <button onClick={() => setLayer("render")} disabled={layer === "render"}>
              Back to the trace
            </button>
          </div>
          <p className="note">
            Every saree is laid between the waist selvedge and the hem selvedge and shaded with the
            folds of the plate, so one sheet shows how the template carries a plain weave, a heavy
            border and a big motif. Click any of them to see it full size. It is a check on the
            trace, not the finished render: there is no fold field or occlusion order yet, so it
            will not match the drape studio exactly.
          </p>
        </div>

        <div className="card">
          <h2>
            <span className="n">6</span>Trace file
          </h2>
          <div className="btnrow">
            <button className="primary" onClick={exportTrace}>
              Download JSON
            </button>
            <button onClick={() => fileRef.current?.click()}>Import JSON</button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void importTrace(file);
            }}
          />
          <p className="note">
            {traced} of {trace.lines.length} lines traced. The file keeps pixel coordinates
            against a {trace.image.width} × {trace.image.height} picture.
          </p>
          <p className="note">
            Back to the <a href="/" style={{ color: "var(--accent)" }}>drape studio</a>.
          </p>
        </div>
      </div>

      <div className="stage" ref={stageRef} style={{ position: "relative", overflow: "hidden" }}>
        <div className="name">
          {trace.pose} · {activeLine?.label ?? "no line"}
        </div>

        <div
          className="btnrow"
          style={{ position: "absolute", top: 10, right: 12, zIndex: 2, width: "auto" }}
        >
          <div className="seg" style={{ width: 150 }}>
            <button className={tool === "draw" ? "on" : ""} onClick={() => setTool("draw")}>
              Draw
            </button>
            <button className={tool === "pan" ? "on" : ""} onClick={() => setTool("pan")}>
              Pan
            </button>
          </div>
          <button onClick={() => zoomBy(1 / 1.35)}>−</button>
          <button onClick={() => zoomBy(1.35)}>+</button>
          <button onClick={fitToStage}>Fit</button>
          {labelled && render && (
            <button
              onClick={() => setLayer(layer === "labelled" ? "render" : "labelled")}
              className={layer === "labelled" ? "on" : ""}
            >
              {layer === "labelled" ? "Show A" : "Show B"}
            </button>
          )}
          {preview && (
            <button
              onClick={() => setLayer(layer === "preview" ? "render" : "preview")}
              className={layer === "preview" ? "on" : ""}
            >
              Drape
            </button>
          )}
          {sheet.length > 0 && (
            <button
              onClick={() => setLayer(layer === "sheet" ? "render" : "sheet")}
              className={layer === "sheet" ? "on" : ""}
            >
              All sarees
            </button>
          )}
        </div>

        {!hasPicture && <div className="empty">Load a render to start tracing.</div>}

        {layer === "sheet" && sheet.length > 0 && (
          <div className="sheet">
            {sheet.map((item, index) => (
              <button
                key={item.id}
                onClick={() => void renderSaree(index)}
                title={`${item.id} — click to see it full size`}
              >
                <img src={item.url} alt={item.id} />
                <span>{item.id}</span>
              </button>
            ))}
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{
            display: hasPicture && layer !== "sheet" ? "block" : "none",
            touchAction: "none",
            cursor: tool === "pan" ? "grab" : "crosshair",
          }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
          onPointerLeave={() => setGhost(null)}
          onDoubleClick={onDoubleClick}
        />

        <div className="badge" style={{ bottom: 10, top: "auto" }}>
          {Math.round(view.scale * 100)}%
        </div>
      </div>
    </div>
  );
}
