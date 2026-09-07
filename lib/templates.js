// lib/templates.js — recovered from the compiled production bundle (module 4586).
//   Yz(id)                 -> promise of a studio template descriptor (template.json + fix.json)
//   SC(tpl, fix, defaults) -> per-region uniform arrays for the engine
//   xn                     max region count used by the shaders

let r = new Map();
function o(t) {
  let e = r.get(t);
  if (e) return e;
  let n = "/templates/".concat(t),
    o = fetch("".concat(n, "/template.json"))
      .then((e) => {
        if (!e.ok) throw Error("template ".concat(t, " not found (").concat(e.status, ")"));
        return e.json();
      })
      .then(async (t) => ({
        ...t,
        fix: await fetch("".concat(n, "/fix.json"))
          .then((t) => (t.ok ? t.json() : null))
          .catch(() => null),
        base: n,
        mannequinUrl: "".concat(n, "/").concat(t.assets.mannequin),
        shadingUrl: "".concat(n, "/").concat(t.assets.shading),
        panelsUrl: "".concat(n, "/").concat(t.assets.panels),
        uvUrl: "".concat(n, "/").concat(t.assets.uv),
        thumb: "".concat(n, "/thumb.webp"),
      }));
  return r.set(t, o), o;
}
let a = 16;
function i(t, e, n) {
  let r = () => new Float32Array(a),
    o = r(),
    i = r(),
    l = r(),
    h = r(),
    u = r(),
    f = r(),
    s = r(),
    c = r(),
    g = r(),
    d = new Int32Array(a);
  for (let r of t.panels) {
    var m, p, _, v, b, x, E, T, w, R;
    let t = 255 & r.index;
    if (t >= a) continue;
    let M = null != (p = null == e || null == (m = e.regions) ? void 0 : m[String(t)]) ? p : {};
    (o[t] = r.uSpan || 1),
      (i[t] = r.vSpan || 1),
      (d[t] = null != (_ = M.role) ? _ : "pallu" === r.role ? 1 : 2 * ("tail" === r.role));
    let U = 1 === d[t];
    (l[t] = +(null != (v = M.flipW) ? !!v : U ? !!n.palluFlipW : !!n.flipW)),
      (h[t] = +(null != (b = M.flipL) ? !!b : U ? !!n.palluFlipL : !!n.flipL)),
      (u[t] = null != (x = M.len) ? x : 1),
      (f[t] = null != (E = M.wid) ? E : 1),
      (s[t] = null != (T = M.offL) ? T : 0),
      (c[t] = null != (w = M.offW) ? w : 0),
      (g[t] = null == (R = M.show) || R ? 1 : 0);
  }
  return { uSpan: o, vSpan: i, role: d, flipW: l, flipL: h, len: u, wid: f, offL: s, offW: c, show: g };
}

export { i as SC, o as Yz, a as xn };
