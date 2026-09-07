import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";

const ACCOUNT_ID = "61afaaa97284241e40ed6659699d8e60";
const WORKER_NAME = "saree-tryon";
const OUT_DIR = join(process.cwd(), "downloaded");

function getWranglerToken() {
	const configPath = join(
		process.env.APPDATA || join(homedir(), "AppData", "Roaming"),
		"xdg.config",
		".wrangler",
		"config",
		"default.toml",
	);
	const config = readFileSync(configPath, "utf8");
	const match = config.match(/^oauth_token = "(.+)"$/m);
	if (!match) {
		throw new Error("No wrangler oauth token found. Run: npx wrangler login");
	}
	return match[1];
}

async function cfFetch(path, token, accept) {
	const headers = { Authorization: `Bearer ${token}` };
	if (accept) headers.Accept = accept;

	const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
		headers,
	});
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`${path} failed (${res.status}): ${body}`);
	}
	return res;
}

async function main() {
	const token = getWranglerToken();

	const service = await (
		await cfFetch(`/accounts/${ACCOUNT_ID}/workers/services/${WORKER_NAME}`, token)
	).json();
	const envName = service.result.default_environment.environment;

	const settings = await (
		await cfFetch(
			`/accounts/${ACCOUNT_ID}/workers/scripts/${WORKER_NAME}/settings`,
			token,
		)
	).json();

	const contentRes = await cfFetch(
		`/accounts/${ACCOUNT_ID}/workers/services/${WORKER_NAME}/environments/${envName}/content/v2`,
		token,
		"multipart/form-data",
	);

	const contentType = contentRes.headers.get("content-type") || "";
	const boundaryMatch = contentType.match(/boundary=(.+)$/);
	if (!boundaryMatch) {
		throw new Error(`Unexpected content response: ${contentType}`);
	}

	const body = Buffer.from(await contentRes.arrayBuffer());
	const boundary = boundaryMatch[1];
	const parts = parseMultipart(body, boundary);

	await mkdir(join(OUT_DIR, "src"), { recursive: true });

	let entrypoint = null;
	for (const part of parts) {
		if (!part.filename) continue;
		const filepath = join(OUT_DIR, "src", part.filename);
		await mkdir(dirname(filepath), { recursive: true });
		await writeFile(filepath, part.data);
		console.log(`Saved src/${part.filename}`);
		if (part.name === "index.js" || part.filename.endsWith("index.js")) {
			entrypoint = part.filename;
		}
	}

	const wranglerConfig = {
		name: WORKER_NAME,
		main: entrypoint ? `src/${entrypoint}` : "src/index.js",
		compatibility_date:
			settings.result?.compatibility_date || "2026-08-17",
		compatibility_flags: settings.result?.compatibility_flags || [
			"nodejs_compat",
		],
		assets: {
			directory: "./public",
			binding: "ASSETS",
		},
	};

	await writeFile(
		join(OUT_DIR, "wrangler.jsonc"),
		JSON.stringify(wranglerConfig, null, 2),
	);
	console.log("Saved wrangler.jsonc");

	console.log("\nWorker script downloaded to ./downloaded/");
	console.log(
		"Static assets cannot be pulled via wrangler yet — see instructions in README-DOWNLOAD.txt",
	);
}

function parseMultipart(body, boundary) {
	const delimiter = Buffer.from(`--${boundary}`);
	const parts = [];
	let offset = 0;

	while (offset < body.length) {
		const start = body.indexOf(delimiter, offset);
		if (start === -1) break;
		offset = start + delimiter.length;
		if (body[offset] === 45 && body[offset + 1] === 45) break; // --
		if (body[offset] === 13) offset += 2; // \r\n
		else if (body[offset] === 10) offset += 1;

		const headerEnd = body.indexOf("\r\n\r\n", offset);
		if (headerEnd === -1) break;
		const headers = body.slice(offset, headerEnd).toString("utf8");
		offset = headerEnd + 4;

		const next = body.indexOf(delimiter, offset);
		const raw = body.slice(offset, next === -1 ? body.length : next - 2);
		const nameMatch = headers.match(/name="([^"]+)"/);
		const filenameMatch = headers.match(/filename="([^"]+)"/);

		parts.push({
			name: nameMatch?.[1],
			filename: filenameMatch?.[1],
			data: raw,
		});
		offset = next;
	}

	return parts;
}

main().catch((err) => {
	console.error(err.message || err);
	process.exit(1);
});
