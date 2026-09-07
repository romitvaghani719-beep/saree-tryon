import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// Receives { name, dataUrl } from the editors and saves the rendered PNG into
// public/exports so it can be served back by the app. The recovered client
// code expects { path } on success or { error } on failure.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: unknown; dataUrl?: unknown };
    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.replace(/[^\w.-]+/g, "_").slice(0, 80)
        : "export";
    const dataUrl = typeof body.dataUrl === "string" ? body.dataUrl : "";
    const match = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
    if (!match) {
      return NextResponse.json(
        { error: "dataUrl must be a base64 PNG data URL." },
        { status: 400 },
      );
    }
    const dir = path.join(process.cwd(), "public", "exports");
    await mkdir(dir, { recursive: true });
    const filename = `${name}.png`;
    await writeFile(path.join(dir, filename), Buffer.from(match[1], "base64"));
    return NextResponse.json({ path: `/exports/${filename}` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed." },
      { status: 500 },
    );
  }
}

