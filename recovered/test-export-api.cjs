// Quick test of the /api/export route
const http = require("node:http");
const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const body = JSON.stringify({ name: "api-test", dataUrl: png });
const req = http.request(
  { host: "localhost", port: 3001, path: "/api/export", method: "POST", headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body) } },
  (res) => {
    let d = "";
    res.on("data", (c) => (d += c));
    res.on("end", () => console.log("export api:", res.statusCode, d));
  },
);
req.on("error", (e) => console.log("error:", e.message));
req.end(body);
