(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [974],
  {
    4900: (e, t, l) => {
      "use strict";
      l.d(t, { default: () => D });
      var a = l(5155),
        n = l(2115),
        r = l(63),
        i = l(7877),
        s = l(6072),
        o = l(4586);
      let h = {
          Brightness: 1,
          Saturate: 1.05,
          Expose_Amount: 1,
          Shadow_Color: 1,
          Highlight_Color: 1.15,
          Highlight_Multiplication: 0.45,
          Screen_Amount: 0.03,
          UV_Tiling: 1,
        },
        c = ["Front, pallu over the shoulder.", "Back, pallu spread open.", "Front, pallu open on the arm."],
        d = [
          ...i.L6.map((e, t) => ({
            id: "model-".concat(e.id),
            name: "Model ".concat(e.id),
            note: c[t],
            thumb: e.thumb,
            kind: "mesh",
            model: t,
          })),
          ...[
            "holo-00",
            "holo-01",
            "holo-02",
            "holo-03",
            "holo-04",
            "holo-05",
            "holo-06",
            "holo-07",
            "holo-08",
            "holo-09",
            "holo-10",
            "holo-12",
            "holo-13",
            "holo-14",
            "holo-15",
            "holo-16",
            "holo-17",
            "holo-18",
            "holo-19",
            "holo-21",
          ].map((e) => ({
            id: e,
            name: "Studio ".concat(e.slice(5)),
            note: "Nivi drape on a studio plate.",
            thumb: "/templates/".concat(e, "/thumb.webp"),
            kind: "uv",
            model: 0,
          })),
        ],
        u = {};
      var p = l(1894);
      function m(e, t, l) {
        return (
          (Math.abs(e[3 * t] - e[3 * l]) +
            Math.abs(e[3 * t + 1] - e[3 * l + 1]) +
            Math.abs(e[3 * t + 2] - e[3 * l + 2])) /
          3
        );
      }
      function f(e, t) {
        let l = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 1 / 3,
          a = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : 0.02,
          n = (function (e, t) {
            let l = "x" === t ? e.w : e.h,
              a = "x" === t ? e.h : e.w,
              n = new Float32Array(3 * l);
            for (let r = 0; r < l; r++) {
              let l = 0,
                i = 0,
                s = 0;
              for (let n = 0; n < a; n++) {
                let a = "x" === t ? r : n,
                  o = (("x" === t ? n : r) * e.w + a) * 3;
                (l += e.rgb[o]), (i += e.rgb[o + 1]), (s += e.rgb[o + 2]);
              }
              (n[3 * r] = l / a), (n[3 * r + 1] = i / a), (n[3 * r + 2] = s / a);
            }
            return n;
          })(e, t),
          r = (function (e) {
            let t = e.length / 3,
              l = Math.floor(0.2 * t),
              a = Math.max(l + 1, Math.ceil(0.8 * t)),
              n = new Int32Array(t),
              r = 0;
            for (let t = l; t < a; t++) {
              let i = 0;
              for (let n = l; n < a; n++) !(2 > Math.abs(t - n)) && 10 >= m(e, t, n) && i++;
              (n[t] = i), i > r && (r = i);
            }
            let i = [],
              s = 0.5 * r;
            for (let e = l; e < a; e++) n[e] >= s && r > 0 && i.push(e);
            if (i.length < 3) for (let e = l; e < a; e++) i.push(e);
            let o = new Float32Array(t);
            for (let l = 0; l < t; l++) {
              let t = 1 / 0;
              for (let a of i) {
                if (2 > Math.abs(l - a)) continue;
                let n = m(e, l, a);
                if (n < t && (t = n) < 1) break;
              }
              o[l] = t === 1 / 0 ? 0 : t;
            }
            return o;
          })(n),
          i = r.length,
          s = [...r].sort((e, t) => e - t),
          o = s[Math.floor(0.5 * i)],
          h = Math.max(o + (s[Math.min(i - 1, Math.floor(0.98 * i))] - o) * 0.22, 2.5),
          c = (function (e, t) {
            let { w: l, h: a, rgb: n } = e,
              r = "x" === t ? l : a,
              i = "x" === t ? a : l,
              s = new Float32Array(r);
            for (let e = 0; e < r; e++) {
              let a = 0,
                r = 0,
                o = -1;
              for (let s = 0; s < i; s++) {
                let i = "x" === t ? e : s,
                  h = (("x" === t ? s : e) * l + i) * 3,
                  c = 0.299 * n[h] + 0.587 * n[h + 1] + 0.114 * n[h + 2];
                o >= 0 && ((a += Math.abs(c - o)), r++), (o = c);
              }
              s[e] = r ? a / r : 0;
            }
            return s;
          })(e, t),
          d = Math.max([...c].sort((e, t) => e - t)[Math.floor(0.5 * i)], 0.4),
          u = (e) => {
            let t = (function (e, t, l, a, n) {
              let r = e.length,
                i = 0,
                s = 0,
                o = Math.max(3, Math.round(r * n));
              for (let a = 0; a < r; a++)
                if (e[t ? a : r - 1 - a] >= l) (i = a + 1), (s = 0);
                else if (++s > o) break;
              return i > r * a ? 0 : i;
            })(r, e, h, l, a);
            if (0 === t) return { width: 0, strength: 0 };
            let n = 0,
              s = 0;
            for (let l = 0; l < t; l++) {
              let t = e ? l : i - 1 - l;
              (n += r[t]), (s += c[t]);
            }
            let o = Math.min(2.5, Math.max(0.55, s / t / d / 1.5));
            return { width: t / i, strength: Math.min(1, (n / t / 40) * o) };
          };
        return { bands: [u(!0), u(!1)], profile: n };
      }
      function g(e, t) {
        let l,
          a = arguments.length > 2 && void 0 !== arguments[2] && arguments[2],
          n = (function (e) {
            let t = Math.max(1, Math.ceil(Math.max(e.width, e.height) / 512)),
              l = Math.max(1, Math.floor(e.width / t)),
              a = Math.max(1, Math.floor(e.height / t)),
              n = new Float32Array(l * a * 3),
              r = e.data;
            for (let i = 0; i < a; i++)
              for (let a = 0; a < l; a++) {
                let s = 0,
                  o = 0,
                  h = 0,
                  c = 0;
                for (let l = 0; l < t; l++) {
                  let n = i * t + l;
                  if (n >= e.height) break;
                  for (let l = 0; l < t; l++) {
                    let i = a * t + l;
                    if (i >= e.width) break;
                    let d = (n * e.width + i) * 4;
                    (s += r[d]), (o += r[d + 1]), (h += r[d + 2]), c++;
                  }
                }
                let d = (i * l + a) * 3;
                (n[d] = s / c), (n[d + 1] = o / c), (n[d + 2] = h / c);
              }
            return { w: l, h: a, rgb: n };
          })(e);
        if (void 0 !== t) l = t;
        else if (Math.max(n.w, n.h) / Math.max(1, Math.min(n.w, n.h)) > 1.25) l = n.w <= n.h ? 0 : 90;
        else {
          let e = f(n, "x"),
            t = f(n, "y"),
            a = (e) => {
              let t = Math.min(e.bands[0].strength, e.bands[1].strength),
                l =
                  1 -
                  Math.abs(e.bands[0].width - e.bands[1].width) /
                    Math.max(e.bands[0].width + e.bands[1].width, 1e-6);
              return 1.6 * t + (t > 0.04 ? 0.4 * l : 0);
            };
          l = a(e) >= a(t) ? 0 : 90;
        }
        let r = (function (e, t, l) {
            if (0 === t && !l) return e;
            let a = 90 === t || 270 === t,
              n = a ? e.h : e.w,
              r = a ? e.w : e.h,
              i = new Float32Array(n * r * 3);
            for (let a = 0; a < r; a++)
              for (let r = 0; r < n; r++) {
                let [s, o] = (function (e, t, l, a, n) {
                    switch (l) {
                      case 90:
                        return [t, n - 1 - e];
                      case 180:
                        return [a - 1 - e, n - 1 - t];
                      case 270:
                        return [a - 1 - t, e];
                      default:
                        return [e, t];
                    }
                  })(l ? n - 1 - r : r, a, t, e.w, e.h),
                  h = (o * e.w + s) * 3,
                  c = (a * n + r) * 3;
                (i[c] = e.rgb[h]), (i[c + 1] = e.rgb[h + 1]), (i[c + 2] = e.rgb[h + 2]);
              }
            return { w: n, h: r, rgb: i };
          })(n, l, a),
          i = f(r, "x"),
          s = f(r, "y", 0.5, 0.08),
          o = 90 === l || 270 === l,
          h = o ? e.height : e.width,
          c = o ? e.width : e.height,
          d = [
            { width: i.bands[0].width * h, strength: i.bands[0].strength },
            { width: i.bands[1].width * h, strength: i.bands[1].strength },
          ],
          u = s.bands[0],
          p = s.bands[1],
          m = p.strength >= u.strength,
          g = m ? p : u,
          x =
            g.strength > 0.08 && g.width > 0.005
              ? { end: m ? "end" : "start", width: g.width * c, strength: g.strength }
              : { end: "none", width: 0, strength: 0 },
          b =
            (function (e, t, l) {
              let a = e.length / 3,
                n = Math.floor(t * a),
                r = Math.max(n + 1, Math.ceil(a - l * a)) - n;
              if (r < 40) return 0;
              let i = new Float32Array(r),
                s = 0;
              for (let t = 0; t < r; t++) {
                let l = (n + t) * 3;
                (i[t] = 0.299 * e[l] + 0.587 * e[l + 1] + 0.114 * e[l + 2]), (s += i[t]);
              }
              s /= r;
              let o = 0;
              for (let e = 0; e < r; e++) (i[e] -= s), (o += i[e] * i[e]);
              if (1.5 > Math.sqrt(o / r)) return 0;
              let h = 0,
                c = 0,
                d = Math.max(8, Math.floor(0.04 * r)),
                u = Math.floor(0.6 * r);
              for (let e = d; e <= u; e++) {
                let t = 0,
                  l = 0,
                  a = 0;
                for (let n = 0; n + e < r; n++)
                  (t += i[n] * i[n + e]), (l += i[n] * i[n]), (a += i[n + e] * i[n + e]);
                let n = Math.sqrt(l * a);
                if (n < 1e-6) continue;
                let s = t / n;
                s > c && ((c = s), (h = e));
              }
              return c < 0.5 ? 0 : h / a;
            })(s.profile, "start" === x.end ? x.width / c : 0.02, "end" === x.end ? x.width / c : 0.02) * c;
        return { rotation: l, flip: a, width: h, height: c, selvedge: d, pallu: x, repeat: b };
      }
      function x(e) {
        let t = 1,
          l = 0,
          a = 1,
          n = 0;
        for (let [r, i] of e) r < t && (t = r), r > l && (l = r), i < a && (a = i), i > n && (n = i);
        return { left: t, right: Math.max(l, t + 0.01), top: a, bottom: Math.max(n, a + 0.01) };
      }
      function b(e, t) {
        let l = x(t),
          a = null === e.pallu ? null : Math.min(l.bottom, Math.max(l.top, e.pallu));
        return { ...e, polygon: t, ...l, pallu: a };
      }
      function w(e) {
        return [
          [e.left, e.top],
          [e.right, e.top],
          [e.right, e.bottom],
          [e.left, e.bottom],
        ];
      }
      function v(e) {
        let t = e.reduce((e, t) => e + t[0], 0) / 4,
          l = e.reduce((e, t) => e + t[1], 0) / 4,
          a = [...e].sort((e, a) => Math.atan2(e[1] - l, e[0] - t) - Math.atan2(a[1] - l, a[0] - t)),
          n = 0,
          r = 1 / 0;
        return (
          a.forEach((e, t) => {
            e[0] + e[1] < r && ((r = e[0] + e[1]), (n = t));
          }),
          [0, 1, 2, 3].map((e) => a[(n + e) % 4])
        );
      }
      function j(e, t) {
        let l;
        if (4 === t.polygon.length)
          l = (function (e, t) {
            let l = v(
                t.map((t) => {
                  let [l, a] = t;
                  return [l * e.width, a * e.height];
                }),
              ),
              a = (e, t) => Math.hypot(e[0] - t[0], e[1] - t[1]),
              n = Math.max(8, Math.min(2600, Math.round((a(l[0], l[1]) + a(l[3], l[2])) / 2))),
              r = Math.max(8, Math.min(2600, Math.round((a(l[0], l[3]) + a(l[1], l[2])) / 2))),
              [i, s, o, h, c, d, u, p] = (function (e) {
                let [[t, l], [a, n], [r, i], [s, o]] = e,
                  h = a - r,
                  c = s - r,
                  d = t - a + r - s,
                  u = n - i,
                  p = o - i,
                  m = l - n + i - o,
                  f = h * p - c * u || 1e-12,
                  g = (d * p - c * m) / f,
                  x = (h * m - d * u) / f;
                return [a - t + g * a, s - t + x * s, t, n - l + g * n, o - l + x * o, l, g, x, 1];
              })(l),
              m = new ImageData(n, r),
              f = e.data,
              g = m.data,
              x = e.width,
              b = e.height,
              w = x - 1.001,
              j = b - 1.001;
            for (let e = 0; e < r; e++) {
              let t = (e + 0.5) / r;
              for (let l = 0; l < n; l++) {
                let a = (l + 0.5) / n,
                  r = u * a + p * t + 1,
                  m = (i * a + s * t + o) / r,
                  v = (h * a + c * t + d) / r;
                m < 0 ? (m = 0) : m > w && (m = w), v < 0 ? (v = 0) : v > j && (v = j);
                let y = 0 | m,
                  M = 0 | v,
                  k = y + 1 < x ? y + 1 : y,
                  N = M + 1 < b ? M + 1 : M,
                  S = m - y,
                  C = v - M,
                  E = (1 - S) * (1 - C),
                  T = S * (1 - C),
                  I = (1 - S) * C,
                  R = S * C,
                  D = (M * x + y) * 4,
                  P = (M * x + k) * 4,
                  L = (N * x + y) * 4,
                  U = (N * x + k) * 4,
                  A = (e * n + l) * 4;
                (g[A] = f[D] * E + f[P] * T + f[L] * I + f[U] * R),
                  (g[A + 1] = f[D + 1] * E + f[P + 1] * T + f[L + 1] * I + f[U + 1] * R),
                  (g[A + 2] = f[D + 2] * E + f[P + 2] * T + f[L + 2] * I + f[U + 2] * R),
                  (g[A + 3] = 255);
              }
            }
            return m;
          })(e, t.polygon);
        else {
          let a = Math.round(t.left * e.width),
            n = Math.round(t.right * e.width),
            r = Math.round(t.top * e.height),
            i = Math.round(t.bottom * e.height),
            s = Math.max(1, n - a),
            o = Math.max(1, i - r);
          l = new ImageData(s, o);
          let h = new Uint32Array(e.data.buffer, e.data.byteOffset, e.width * e.height),
            c = new Uint32Array(l.data.buffer);
          for (let t = 0; t < o; t++)
            c.set(h.subarray((r + t) * e.width + a, (r + t) * e.width + a + s), t * s);
          (4 === t.polygon.length &&
            t.polygon.every((e) => {
              let [l, a] = e;
              return (
                (1e-6 > Math.abs(l - t.left) || 1e-6 > Math.abs(l - t.right)) &&
                (1e-6 > Math.abs(a - t.top) || 1e-6 > Math.abs(a - t.bottom))
              );
            })) ||
            (function (e, t) {
              let l = e.width,
                a = e.height,
                n = Math.max(1, Math.ceil(Math.max(l, a) / 400)),
                r = Math.ceil(l / n),
                i = Math.ceil(a / n),
                s = new Int32Array(r * i).fill(-1),
                o = new Int32Array(r * i),
                h = 0;
              for (let e = 0; e < i; e++)
                for (let l = 0; l < r; l++) {
                  let a = e * r + l;
                  (function (e, t, l) {
                    let a = !1;
                    for (let n = 0, r = e.length - 1; n < e.length; r = n++) {
                      let [i, s] = e[n],
                        [o, h] = e[r];
                      s > l != h > l && t < ((o - i) * (l - s)) / (h - s) + i && (a = !a);
                    }
                    return a;
                  })(t, (l + 0.5) * n, (e + 0.5) * n) && ((s[a] = a), (o[h++] = a));
                }
              if (0 === h || h === r * i) return;
              let c = 0;
              for (; c < h; ) {
                let e = o[c++],
                  t = e % r,
                  l = (e / r) | 0,
                  a = (t) => {
                    s[t] < 0 && ((s[t] = s[e]), (o[h++] = t));
                  };
                t > 0 && a(e - 1), t < r - 1 && a(e + 1), l > 0 && a(e - r), l < i - 1 && a(e + r);
              }
              let d = new Uint32Array(e.data.buffer);
              for (let e = 0; e < a; e++) {
                let t = (e / n) | 0;
                for (let i = 0; i < l; i++) {
                  let o = t * r + ((i / n) | 0),
                    h = s[o];
                  if (h === o) continue;
                  let c = Math.min(l - 1, ((h % r) * n + (n >> 1)) | 0),
                    u = Math.min(a - 1, (((h / r) | 0) * n + (n >> 1)) | 0);
                  d[e * l + i] = d[u * l + c];
                }
              }
            })(
              l,
              t.polygon.map((t) => {
                let [l, n] = t;
                return [l * e.width - a, n * e.height - r];
              }),
            );
        }
        let a = new Uint32Array(l.data.buffer),
          n = l.width,
          r = l.height;
        if ("start" === t.palluEnd) {
          let e = new Uint32Array(a);
          for (let t = 0, l = n * r; t < l; t++) a[t] = e[l - 1 - t];
        }
        return l;
      }
      let y = new Map();
      async function M(e) {
        let t = await createImageBitmap(await (await fetch(e)).blob()),
          l = document.createElement("canvas");
        (l.width = t.width), (l.height = t.height);
        let a = l.getContext("2d", { willReadFrequently: !0 });
        return a.drawImage(t, 0, 0), t.close(), a.getImageData(0, 0, l.width, l.height);
      }
      function k(e) {
        let t = y.get(e);
        if (t) return t;
        let l = M(e)
          .then((e) => {
            let t = g(e);
            if (0 !== t.rotation || "none" === t.pallu.end) return null;
            let l = t.pallu.width / Math.max(1, t.height);
            return !(l > 0.02) || l > 0.6
              ? null
              : { depth: Math.min(0.6, l), atStart: "start" === t.pallu.end };
          })
          .catch(() => null);
        return y.set(e, l), l;
      }
      function N(e) {
        let { image: t, cut: l, onChange: r, onCommit: i } = e,
          s = (0, n.useRef)(null),
          o = (0, n.useRef)(null),
          h = (0, n.useRef)(null),
          c = (0, n.useRef)(!1);
        (0, n.useEffect)(() => {
          let e = 300 / t.width,
            l = document.createElement("canvas");
          (l.width = 300), (l.height = Math.max(1, Math.round(t.height * e)));
          let a = document.createElement("canvas");
          (a.width = t.width), (a.height = t.height), a.getContext("2d").putImageData(t, 0, 0);
          let n = l.getContext("2d");
          (n.imageSmoothingQuality = "high"), n.drawImage(a, 0, 0, l.width, l.height), (o.current = l);
          let r = s.current;
          r && ((r.width = l.width), (r.height = l.height));
        }, [t]),
          (0, n.useEffect)(() => {
            let e = s.current,
              t = o.current;
            if (!e || !t) return;
            let a = e.getContext("2d"),
              n = e.width,
              r = e.height;
            a.drawImage(t, 0, 0);
            let i = l.left * n,
              h = l.right * n,
              c = l.top * r,
              d = l.bottom * r,
              u = l.polygon.map((e) => {
                let [t, l] = e;
                return [t * n, l * r];
              }),
              p = () => {
                a.beginPath(),
                  u.forEach((e, t) => {
                    let [l, n] = e;
                    return t ? a.lineTo(l, n) : a.moveTo(l, n);
                  }),
                  a.closePath();
              };
            a.save(),
              a.beginPath(),
              a.rect(0, 0, n, r),
              u.forEach((e, t) => {
                let [l, n] = e;
                return t ? a.lineTo(l, n) : a.moveTo(l, n);
              }),
              a.closePath(),
              (a.fillStyle = "rgba(0,0,0,0.55)"),
              a.fill("evenodd"),
              a.restore(),
              a.save(),
              p(),
              a.clip(),
              (a.fillStyle = "rgba(79,191,139,0.22)");
            let m = l.selvedgeL * n,
              f = l.selvedgeR * n;
            for (let e of (m > i && a.fillRect(i, c, m - i, d - c),
            f < h && a.fillRect(f, c, h - f, d - c),
            (a.strokeStyle = "rgba(79,191,139,0.9)"),
            a.setLineDash([4, 3]),
            (a.lineWidth = 1),
            [m, f]))
              e > i && e < h && (a.beginPath(), a.moveTo(e, c), a.lineTo(e, d), a.stroke());
            if ((a.setLineDash([]), null !== l.pallu && "none" !== l.palluEnd)) {
              let e = l.pallu * r;
              if (
                ((a.fillStyle = "rgba(217,138,63,0.22)"),
                "end" === l.palluEnd
                  ? a.fillRect(i, e, h - i, Math.max(0, d - e))
                  : a.fillRect(i, c, h - i, Math.max(0, e - c)),
                l.repeat > 0)
              ) {
                let t = l.repeat * r;
                (a.strokeStyle = "#6f8cff"), a.setLineDash([5, 4]), (a.lineWidth = 1.5);
                for (let n = 1; n <= 3; n++) {
                  let r = "end" === l.palluEnd ? e - t * n : e + t * n;
                  if (r < c || r > d) break;
                  a.beginPath(), a.moveTo(i, r), a.lineTo(h, r), a.stroke();
                }
                a.setLineDash([]);
              }
            }
            if ((a.restore(), null !== l.pallu && "none" !== l.palluEnd)) {
              let e = l.pallu * r;
              (a.strokeStyle = "#d98a3f"),
                (a.lineWidth = 2),
                a.beginPath(),
                a.moveTo(i, e),
                a.lineTo(h, e),
                a.stroke(),
                S(a, (i + h) / 2, e, "#d98a3f");
            }
            for (let [e, t] of ((a.strokeStyle = "#4fbf8b"), (a.lineWidth = 2), p(), a.stroke(), u))
              S(a, e, t, "#4fbf8b");
          }, [l, t]);
        let d = (e) => {
            let t = s.current.getBoundingClientRect();
            return {
              fx: (e.clientX - t.left) / t.width,
              fy: (e.clientY - t.top) / t.height,
              w: t.width,
              h: t.height,
            };
          },
          u = (0, n.useCallback)(
            (e, t, a, n) => {
              let r = null,
                i = 10;
              return (l.polygon.forEach((l, s) => {
                let [o, h] = l,
                  c = Math.hypot((e - o) * a, (t - h) * n);
                c <= i && ((i = c), (r = { kind: "point", index: s }));
              }),
              r)
                ? r
                : null !== l.pallu &&
                    "none" !== l.palluEnd &&
                    e >= l.left - 0.02 &&
                    e <= l.right + 0.02 &&
                    Math.abs(t - l.pallu) * n <= 10
                  ? { kind: "pallu" }
                  : null;
            },
            [l],
          ),
          p = (0, n.useCallback)(
            (e, t, a, n) => {
              let r = l.polygon,
                i = { edge: 0, x: r[0][0], y: r[0][1], d: 1 / 0 };
              for (let l = 0; l < r.length; l++) {
                let [s, o] = r[l],
                  [h, c] = r[(l + 1) % r.length],
                  d = (h - s) * a,
                  u = (c - o) * n,
                  p = d * d + u * u || 1e-9,
                  m = Math.min(1, Math.max(0, ((e - s) * a * d + (t - o) * n * u) / p)),
                  f = s + (h - s) * m,
                  g = o + (c - o) * m,
                  x = Math.hypot((e - f) * a, (t - g) * n);
                x < i.d && (i = { edge: l, x: f, y: g, d: x });
              }
              return i;
            },
            [l],
          ),
          m = () => {
            h.current && ((h.current = null), c.current && i());
          };
        return (0, a.jsx)("div", {
          className: "map",
          children: (0, a.jsx)("canvas", {
            ref: s,
            onPointerDown: (e) => {
              let t = d(e),
                l = u(t.fx, t.fy, t.w, t.h);
              if (l) {
                (h.current = l), (c.current = !1);
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch (e) {}
                e.preventDefault();
              }
            },
            onPointerMove: (e) => {
              let t = d(e),
                a = e.currentTarget;
              if (!h.current) {
                let e = u(t.fx, t.fy, t.w, t.h);
                a.style.cursor = e
                  ? "pallu" === e.kind
                    ? "ns-resize"
                    : "move"
                  : p(t.fx, t.fy, t.w, t.h).d <= 20
                    ? "copy"
                    : "default";
                return;
              }
              c.current = !0;
              let n = Math.min(1, Math.max(0, t.fx)),
                i = Math.min(1, Math.max(0, t.fy)),
                s = h.current;
              if ("point" === s.kind) {
                let e = l.polygon.map((e, t) => (t === s.index ? [n, i] : e));
                r(b(l, e));
              } else r({ ...l, pallu: Math.min(l.bottom, Math.max(l.top, i)) });
            },
            onPointerUp: m,
            onPointerCancel: m,
            onDoubleClick: (e) => {
              let t = d(e),
                a = u(t.fx, t.fy, t.w, t.h);
              if (a && "point" === a.kind) {
                if (l.polygon.length <= 3) return;
                r(
                  b(
                    l,
                    l.polygon.filter((e, t) => t !== a.index),
                  ),
                ),
                  i();
                return;
              }
              if (a) return;
              let n = p(t.fx, t.fy, t.w, t.h),
                s = [...l.polygon];
              s.splice(n.edge + 1, 0, [n.x, n.y]), r(b(l, s)), i();
            },
            style: { touchAction: "none" },
          }),
        });
      }
      function S(e, t, l, a) {
        e.beginPath(),
          e.arc(t, l, 5.5, 0, 2 * Math.PI),
          (e.fillStyle = a),
          e.fill(),
          (e.strokeStyle = "rgba(0,0,0,0.55)"),
          (e.lineWidth = 1.5),
          e.stroke();
      }
      let C = [1.114, 1.199, 1, 1.284, 3, 0.782, 0.167, 1],
        E = [
          { label: "Striped, tight crop", src: "/samples/1-ref.jpeg" },
          { label: "Paithani", src: "/samples/4-ref.png" },
          { label: "Shop floor", src: "/samples/5-ref.jpg" },
        ],
        T = { poseId: "model-1", model: 0, textureIndex: 0, params: { ...i.Jp }, custom: [], rotations: {} };
      function I(e) {
        return e.custom.length ? [...i.XT, ...e.custom] : i.XT;
      }
      function R(e) {
        return e.id.startsWith("upload")
          ? "your upload"
          : e.id.startsWith("ref")
            ? e.id.replace("ref-", "ref ")
            : e.id.replace("t", "saree ");
      }
      function D() {
        var e, t;
        let l = (0, r.useSearchParams)(),
          [c, m] = (0, n.useState)(T),
          [f, b] = (0, n.useState)(!1),
          [y, M] = (0, n.useState)(null),
          [S, D] = (0, n.useState)(""),
          [P, L] = (0, n.useState)(null),
          [U, A] = (0, n.useState)(!1),
          [F, _] = (0, n.useState)(!1),
          [W, O] = (0, n.useState)(null),
          [, V] = (0, n.useState)(0),
          X = (0, n.useRef)(null),
          q = (0, n.useRef)(null),
          B = (0, n.useRef)(T);
        B.current = c;
        let z = (0, n.useRef)(new Map()),
          G = (0, n.useRef)(0),
          H = (0, n.useRef)(!1),
          Y = (0, n.useRef)(!1);
        Y.current = F;
        let [J, Q] = (0, n.useState)(null),
          [Z, K] = (0, n.useState)(null),
          $ = (0, n.useMemo)(() => I(c), [c]),
          ee = $[c.textureIndex],
          et = null != (e = z.current.get(ee.id)) ? e : null;
        i.L6[c.model];
        let el = (0, n.useMemo)(() => {
            var e;
            return null != (e = d.find((e) => e.id === c.poseId)) ? e : d[0];
          }, [c.poseId]),
          [ea, en] = (0, n.useState)({});
        (0, n.useEffect)(() => {
          if (et || void 0 !== ea[ee.src]) return;
          let e = !0;
          return (
            k(ee.src).then((t) => {
              e && en((e) => ({ ...e, [ee.src]: t }));
            }),
            () => {
              e = !1;
            }
          );
        }, [ee.src, et, ea]);
        let er = (0, n.useMemo)(() => {
            let e = null == et ? void 0 : et.cut;
            if (!e || null === e.pallu || "none" === e.palluEnd) {
              var t;
              return et ? null : null != (t = ea[ee.src]) ? t : null;
            }
            let l = Math.max(1e-6, e.bottom - e.top);
            return {
              depth: Math.min(
                0.6,
                Math.max(0.02, "end" === e.palluEnd ? (e.bottom - e.pallu) / l : (e.pallu - e.top) / l),
              ),
              atStart: !1,
            };
          }, [et, ea, ee.src]),
          ei = null == er ? void 0 : er.depth,
          es = (0, n.useCallback)((e) => {
            var t;
            let l = i.L6[e.model],
              a = I(e)[e.textureIndex];
            return {
              model: e.model,
              cutout: l.cutout,
              bw: l.bw,
              texture: a.src,
              params: e.params,
              gradientShadow: l.gradientShadow,
              gradientHighlights: l.gradientHighlights,
              rotation: null != (t = e.rotations[a.id]) ? t : 0,
            };
          }, []);
        (0, n.useEffect)(() => {
          if ("uv" !== el.kind) {
            Q(null), K(null);
            return;
          }
          let e = !0;
          return (
            K(null),
            (0, o.Yz)(el.id)
              .then((t) => {
                e && Q(t);
              })
              .catch((t) => {
                e && K(t instanceof Error ? t.message : String(t));
              }),
            () => {
              e = !1;
            }
          );
        }, [el]),
          (0, n.useEffect)(() => {
            let e,
              t = X.current;
            if (!t) return;
            let a = !0;
            try {
              var n;
              e = new s.m(t, Number(null != (n = l.get("scale")) ? n : "1") || 1);
            } catch (e) {
              M(e instanceof Error ? e.message : String(e));
              return;
            }
            return (
              (q.current = e),
              (async () => {
                let t = await (await fetch("/meshes.json")).json();
                a && (e.setMeshes(t), await e.prepare(es(B.current)), a && b(!0));
              })().catch((e) => M(e instanceof Error ? e.message : String(e))),
              () => {
                a = !1;
              }
            );
          }, []),
          (0, n.useEffect)(() => {
            let e = q.current;
            if (!e || !f) return;
            let t = !0,
              l = () => {
                Y.current && O(e.canvas.toDataURL("image/jpeg", 0.92));
              };
            if ("uv" === el.kind) {
              var a, n;
              if (!J || J.id !== el.id) return;
              let r = {
                template: J,
                texture: I(c)[c.textureIndex].src,
                params: c.params,
                rotation: null != (a = c.rotations[I(c)[c.textureIndex].id]) ? a : 0,
                palluDepth: ei,
                fabricPalluAtStart: null != (n = null == er ? void 0 : er.atStart) && n,
                ...u[J.id],
              };
              e.prepareUv(r)
                .then(() => {
                  t && (e.renderUv(r), l());
                })
                .catch((e) => M(String(e)));
            } else {
              let a = es(c);
              e.prepare(a)
                .then(() => {
                  t && (e.render(a), l());
                })
                .catch((e) => M(String(e)));
            }
            return () => {
              t = !1;
            };
          }, [c, f, es, el, J, ei, er]);
        let eo = (0, n.useCallback)((e) => {
            m((t) =>
              "mesh" === e.kind
                ? { ...t, poseId: e.id, model: e.model, params: { ...t.params, ...i.L6[e.model].defaults } }
                : { ...t, poseId: e.id, params: { ...h, UV_Tiling: t.params.UV_Tiling } },
            );
          }, []),
          eh = (0, n.useCallback)(function (e) {
            let t = !(arguments.length > 1) || void 0 === arguments[1] || arguments[1];
            m((t) => ({
              ...t,
              textureIndex: e,
              params: t.poseId.startsWith("holo-") ? { ...h } : (0, i.Rm)(I(t)[e].defaults),
            })),
              t && _(!0);
          }, []),
          ec = (0, n.useCallback)((e, t) => {
            m((l) => ({ ...l, params: { ...l.params, [e]: t } }));
          }, []),
          ed = (0, n.useCallback)(() => {
            m((e) => {
              var t;
              let l = I(e)[e.textureIndex].id;
              return {
                ...e,
                rotations: { ...e.rotations, [l]: ((null != (t = e.rotations[l]) ? t : 0) + 1) % 4 },
              };
            });
          }, []),
          eu = (0, n.useCallback)(() => {
            let e = q.current;
            if (!e) return;
            "mesh" === el.kind && e.render(es(B.current));
            let t = document.createElement("a");
            t.href = e.toPNG();
            let l = I(B.current)[B.current.textureIndex];
            (t.download = "saree-".concat(B.current.poseId, "-").concat(l.id, ".png")), t.click();
          }, [es, el]),
          ep = (0, n.useCallback)(async (e, t) => {
            let l = z.current.get(e);
            if (!l) return;
            let a = await (0, p.nL)(t);
            m((t) => ({
              ...t,
              custom: t.custom.map((t) => {
                if (t.id !== e) return t;
                if (t.src !== l.originalUrl) {
                  var n;
                  null == (n = q.current) || n.release(t.src), URL.revokeObjectURL(t.src);
                }
                return { ...t, src: a, thumb: a };
              }),
            }));
          }, []),
          em = (e) => j(e.prepared.full, e.cut),
          ef = (0, n.useCallback)(
            async (e) => {
              var t, l;
              let a = z.current.get(e);
              if (!a) return;
              L(e), await new Promise((e) => setTimeout(e, 30));
              let n = (0, p.Fu)(a.photo, { autoTrim: a.autoTrim, nudge: a.nudge });
              a.prepared = n;
              let r = ((t = n.corners), (l = n.crop), t ? v(t) : w(l)),
                i = x(r),
                s = {
                  polygon: r,
                  ...i,
                  selvedgeL: i.left,
                  selvedgeR: i.right,
                  pallu: null,
                  palluEnd: "none",
                  repeat: 0,
                };
              (a.detected = {
                ...(function (e, t) {
                  let l = g(e, 0),
                    a = l.width,
                    n = l.height,
                    r = t.right - t.left,
                    i = t.bottom - t.top,
                    s = l.pallu.end,
                    o = "end" === s ? 1 - l.pallu.width / n : "start" === s ? l.pallu.width / n : null;
                  return {
                    layout: l,
                    cut: {
                      polygon: w(t),
                      ...t,
                      selvedgeL: t.left + (l.selvedge[0].width / a) * r,
                      selvedgeR: t.left + (1 - l.selvedge[1].width / a) * r,
                      pallu: null === o ? null : t.top + o * i,
                      palluEnd: s,
                      repeat: (l.repeat / n) * i,
                    },
                  };
                })(j(n.full, s), i).cut,
                polygon: r,
              }),
                (a.cut = { ...a.detected }),
                await ep(e, em(a)),
                L(null),
                V((e) => e + 1);
            },
            [ep],
          ),
          eg = (0, n.useCallback)(() => {
            let e = z.current.get(ee.id);
            e && e.prepared && e.cut && ep(ee.id, em(e));
          }, [ee.id, ep]),
          ex = (0, n.useCallback)(
            (e) => {
              let t = z.current.get(ee.id);
              t && ((t.cut = e), V((e) => e + 1));
            },
            [ee.id],
          ),
          eb = (0, n.useCallback)(() => {
            let e = z.current.get(ee.id);
            e && e.prepared && e.detected && ((e.cut = { ...e.detected }), V((e) => e + 1), ep(ee.id, em(e)));
          }, [ee.id, ep]),
          ew = (0, n.useCallback)(() => {
            let e = z.current.get(ee.id);
            if (!e || !e.prepared || !e.cut) return;
            let t = e.cut;
            "none" === t.palluEnd || null === t.pallu
              ? (e.cut = { ...t, palluEnd: "end", pallu: t.bottom - (t.bottom - t.top) * 0.2 })
              : (e.cut = {
                  ...t,
                  palluEnd: "end" === t.palluEnd ? "start" : "end",
                  pallu: t.top + t.bottom - t.pallu,
                }),
              V((e) => e + 1),
              ep(ee.id, em(e));
          }, [ee.id, ep]),
          ev = (0, n.useCallback)(
            async (e) => {
              for (let t of (M(null), e)) {
                let e;
                try {
                  e = await (0, p.ZL)(t);
                } catch (e) {
                  M(e instanceof Error ? e.message : "That file could not be read as an image.");
                  continue;
                }
                G.current += 1;
                let l = "upload-".concat(G.current),
                  a = await (0, p.nL)(e, 0.85);
                z.current.set(l, {
                  photo: e,
                  originalUrl: a,
                  autoTrim: !0,
                  nudge: 0,
                  prepared: null,
                  cut: null,
                  detected: null,
                }),
                  m((e) => {
                    let t = [...e.custom, { id: l, src: a, thumb: a, defaults: C, extra: !0 }],
                      n = { ...e, custom: t };
                    return { ...n, textureIndex: I(n).length - 1, params: (0, i.Rm)(C) };
                  }),
                  await ef(l);
              }
            },
            [ef],
          ),
          ej = (0, n.useCallback)(
            async (e) => {
              try {
                let t = await fetch(e);
                if (!t.ok) throw Error("Sample not found (".concat(t.status, ")"));
                await ev([await t.blob()]);
              } catch (e) {
                M(e instanceof Error ? e.message : String(e));
              }
            },
            [ev],
          ),
          ey = (0, n.useCallback)(
            (e) => {
              var t;
              e.preventDefault(), A(!1);
              let l = Array.from(null != (t = e.dataTransfer.files) ? t : []);
              l.length && ev(l);
            },
            [ev],
          ),
          eM = (0, n.useCallback)(
            (e) => {
              et && ((et.autoTrim = e), ef(ee.id));
            },
            [et, ee.id, ef],
          ),
          ek = (0, n.useRef)(null),
          eN = (0, n.useCallback)(
            (e) => {
              et &&
                ((et.nudge = e),
                V((e) => e + 1),
                ek.current && clearTimeout(ek.current),
                (ek.current = setTimeout(() => void ef(ee.id), 250)));
            },
            [et, ee.id, ef],
          );
        (0, n.useEffect)(() => {
          if (!F) return;
          let e = q.current;
          e && f && O(e.canvas.toDataURL("image/jpeg", 0.92));
          let t = (e) => {
            "Escape" === e.key && _(!1);
          };
          return window.addEventListener("keydown", t), () => window.removeEventListener("keydown", t);
        }, [F, f]),
          (0, n.useEffect)(() => {
            var e, t, a;
            if (!f || H.current) return;
            let n = l.get("export");
            if (!n) return;
            H.current = !0;
            let r = l.get("pose"),
              s = Math.max(0, Math.min(2, Number(null != (e = l.get("model")) ? e : "1") - 1)),
              c = null != (t = l.get("texture")) ? t : i.XT[0].id,
              d = i.XT.findIndex((e) => e.id === c),
              p = [];
            d < 0 &&
              (p.push({
                id: c,
                src: "/textures/".concat(c, ".webp"),
                thumb: "/textures/".concat(c, ".webp"),
                defaults: C,
                extra: !0,
              }),
              (d = i.XT.length));
            let g = ((Number(null != (a = l.get("rotate")) ? a : "0") % 4) + 4) % 4,
              x = !!r && r.startsWith("holo-"),
              b = {
                ...T,
                custom: p,
                poseId: x ? r : "model-".concat(s + 1),
                model: s,
                textureIndex: d,
                params: x ? { ...h } : (0, i.Rm)(I({ ...T, custom: p })[d].defaults),
                rotations: { [c]: g },
              };
            m(b);
            let w = q.current,
              v = async () => {
                let e = await fetch("/api/export", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ name: n, dataUrl: w.toPNG() }),
                  }),
                  t = await e.json();
                D(t.path ? "exported ".concat(t.path) : "export failed: ".concat(t.error));
              };
            if (x)
              (0, o.Yz)(r)
                .then(async (e) => {
                  var t, a;
                  let n = {
                    template: e,
                    texture: I(b)[d].src,
                    params: b.params,
                    rotation: g,
                    palluDepth: l.has("pallu")
                      ? Number(l.get("pallu"))
                      : null == (t = await k(I(b)[d].src))
                        ? void 0
                        : t.depth,
                    fabricPalluAtStart:
                      !l.has("pallu") && !!(null == (a = await k(I(b)[d].src)) ? void 0 : a.atStart),
                    ...u[e.id],
                    ...(l.has("flipU") ? { flipU: "1" === l.get("flipU") } : {}),
                    ...(l.has("flipV") ? { flipV: "1" === l.get("flipV") } : {}),
                    ...(l.has("pw") ? { palluFlipW: "1" === l.get("pw") } : {}),
                    ...(l.has("pl") ? { palluFlipL: "1" === l.get("pl") } : {}),
                    ...(l.has("ls") ? { lengthScale: Number(l.get("ls")) } : {}),
                    ...(l.has("tuck") ? { tuckOffset: Number(l.get("tuck")) } : {}),
                  };
                  await w.prepareUv(n), w.renderUv(n), await v();
                })
                .catch((e) => D("export failed: " + String(e)));
            else {
              let e = es(b);
              w.prepare(e)
                .then(async () => {
                  w.render(e), await v();
                })
                .catch((e) => D("export failed: " + String(e)));
            }
          }, [f, l, es]);
        let eS = null != (t = c.rotations[ee.id]) ? t : 0,
          eC = P === ee.id;
        return (0, a.jsxs)("div", {
          className: "shell",
          children: [
            (0, a.jsxs)("div", {
              className: "side",
              children: [
                (0, a.jsxs)("div", {
                  className: "brand",
                  children: [
                    (0, a.jsx)("strong", { children: "Saree Try On" }),
                    (0, a.jsx)("span", { children: "pick a drape, upload a saree, see it draped" }),
                  ],
                }),
                (0, a.jsxs)("div", {
                  className: "card",
                  children: [
                    (0, a.jsxs)("h2", {
                      children: [(0, a.jsx)("span", { className: "n", children: "1" }), "Drape template"],
                    }),
                    (0, a.jsx)("div", {
                      className: "templates",
                      children: d.map((e) =>
                        (0, a.jsxs)(
                          "button",
                          {
                            className: e.id === c.poseId ? "on" : "",
                            onClick: () => eo(e),
                            title: e.note,
                            children: [
                              (0, a.jsx)("img", { src: e.thumb, alt: e.name, loading: "lazy" }),
                              (0, a.jsx)("span", { children: e.name }),
                            ],
                          },
                          e.id,
                        ),
                      ),
                    }),
                    (0, a.jsxs)("p", {
                      className: "note",
                      children: [
                        el.note,
                        "uv" === el.kind
                          ? " Studio plate: the cloth follows the pose’s own fold field, so it curves rather than facets."
                          : " Traced mesh from the original app.",
                      ],
                    }),
                    Z && (0, a.jsx)("p", { className: "err", children: Z }),
                  ],
                }),
                (0, a.jsxs)("div", {
                  className: "card",
                  children: [
                    (0, a.jsxs)("h2", {
                      children: [(0, a.jsx)("span", { className: "n", children: "2" }), "Saree"],
                    }),
                    (0, a.jsxs)("label", {
                      className: "drop".concat(U ? " over" : ""),
                      onDragOver: (e) => {
                        e.preventDefault(), A(!0);
                      },
                      onDragLeave: () => A(!1),
                      onDrop: ey,
                      children: [
                        (0, a.jsx)("input", {
                          type: "file",
                          accept: "image/*",
                          multiple: !0,
                          onChange: (e) => {
                            var t;
                            let l = Array.from(null != (t = e.target.files) ? t : []);
                            (e.target.value = ""), l.length && ev(l);
                          },
                        }),
                        (0, a.jsx)("strong", { children: "Drop a saree photo" }),
                        (0, a.jsx)("p", { children: "or click to choose \xb7 flat shot, borders visible" }),
                      ],
                    }),
                    (0, a.jsx)("div", {
                      className: "samples",
                      children: E.map((e) =>
                        (0, a.jsx)("button", { onClick: () => void ej(e.src), children: e.label }, e.src),
                      ),
                    }),
                    y && (0, a.jsx)("p", { className: "err", children: y }),
                    (0, a.jsx)("div", {
                      className: "library",
                      children: $.map((e, t) => {
                        var l;
                        return (0, a.jsxs)(
                          "button",
                          {
                            className: t === c.textureIndex ? "on" : "",
                            title: R(e),
                            onClick: () => eh(t),
                            children: [
                              (0, a.jsx)("img", {
                                src: e.thumb,
                                alt: R(e),
                                style: {
                                  transform: "rotate(".concat(
                                    (null != (l = c.rotations[e.id]) ? l : 0) * 90,
                                    "deg)",
                                  ),
                                },
                              }),
                              e.extra &&
                                (0, a.jsx)("span", {
                                  className: "tag",
                                  children: e.id.startsWith("upload") ? "yours" : "ref",
                                }),
                            ],
                          },
                          e.id,
                        );
                      }),
                    }),
                    (0, a.jsx)("p", {
                      className: "note",
                      children: "Click a saree to open it next to the drape.",
                    }),
                  ],
                }),
                et &&
                  (0, a.jsxs)("div", {
                    className: "card",
                    children: [
                      (0, a.jsxs)("h2", {
                        children: [(0, a.jsx)("span", { className: "n", children: "3" }), "Detection"],
                      }),
                      (0, a.jsxs)("div", {
                        className: "compare",
                        children: [
                          (0, a.jsxs)("figure", {
                            children: [
                              (0, a.jsx)("img", { src: et.originalUrl, alt: "As uploaded" }),
                              (0, a.jsx)("figcaption", { children: "as uploaded" }),
                            ],
                          }),
                          (0, a.jsxs)("figure", {
                            children: [
                              (0, a.jsx)("img", { src: ee.src, alt: "Cloth found" }),
                              (0, a.jsx)("figcaption", { children: eC ? "detecting…" : "cloth only" }),
                            ],
                          }),
                        ],
                      }),
                      (0, a.jsxs)("label", {
                        className: "check",
                        children: [
                          (0, a.jsx)("input", {
                            type: "checkbox",
                            checked: et.autoTrim,
                            onChange: (e) => eM(e.target.checked),
                          }),
                          "Trim the backdrop and straighten",
                        ],
                      }),
                      (0, a.jsx)("p", {
                        className: eC ? "note busy" : "note",
                        style: { marginTop: 2 },
                        children: eC ? "Detecting the cloth…" : (0, p.q0)(et.prepared, et.autoTrim),
                      }),
                      et.autoTrim &&
                        (0, a.jsxs)("div", {
                          className: "row",
                          children: [
                            (0, a.jsx)("label", { children: "Nudge" }),
                            (0, a.jsx)("input", {
                              type: "range",
                              min: -5,
                              max: 5,
                              step: 0.1,
                              value: et.nudge,
                              onChange: (e) => eN(+e.target.value),
                            }),
                            (0, a.jsxs)("span", {
                              className: "val",
                              children: [et.nudge > 0 ? "+" : "", et.nudge.toFixed(1), "\xb0"],
                            }),
                          ],
                        }),
                    ],
                  }),
                et &&
                  et.prepared &&
                  et.cut &&
                  (0, a.jsxs)("div", {
                    className: "card",
                    children: [
                      (0, a.jsxs)("h2", {
                        children: [(0, a.jsx)("span", { className: "n", children: "4" }), "Detected cut"],
                      }),
                      (0, a.jsx)(N, { image: et.prepared.full, cut: et.cut, onChange: ex, onCommit: eg }),
                      (0, a.jsxs)("div", {
                        className: "legend",
                        children: [
                          (0, a.jsxs)("span", {
                            children: [
                              (0, a.jsx)("i", { style: { background: "#4fbf8b" } }),
                              "outline \xb7 drag points, double-click to add or remove",
                            ],
                          }),
                          (0, a.jsxs)("span", {
                            children: [
                              (0, a.jsx)("i", { style: { background: "#d98a3f" } }),
                              "pallu end \xb7 drag",
                            ],
                          }),
                          (0, a.jsxs)("span", {
                            children: [
                              (0, a.jsx)("i", { style: { background: "rgba(79,191,139,0.5)" } }),
                              "selvedge",
                            ],
                          }),
                          (0, a.jsxs)("span", {
                            children: [(0, a.jsx)("i", { style: { background: "#6f8cff" } }), "repeat"],
                          }),
                        ],
                      }),
                      (0, a.jsx)("div", {
                        className: "facts",
                        style: { marginTop: 8 },
                        children: (function (e) {
                          let t = (e) => "".concat(Math.round(100 * e), "%"),
                            l = Math.max(1e-6, e.right - e.left),
                            a = Math.max(1e-6, e.bottom - e.top),
                            n =
                              null === e.pallu
                                ? 0
                                : "end" === e.palluEnd
                                  ? (e.bottom - e.pallu) / a
                                  : (e.pallu - e.top) / a;
                          return [
                            [
                              "Selvedges",
                              ""
                                .concat(t((e.selvedgeL - e.left) / l), " \xb7 ")
                                .concat(t((e.right - e.selvedgeR) / l), " of width"),
                            ],
                            [
                              "Pallu",
                              "none" === e.palluEnd || null === e.pallu
                                ? "none found"
                                : ""
                                    .concat("end" === e.palluEnd ? "bottom" : "top", " \xb7 ")
                                    .concat(t(n), " of length"),
                            ],
                            [
                              "Repeat",
                              e.repeat > 0 ? "".concat(t(e.repeat / a), " of length") : "none found",
                            ],
                            [
                              "Outline",
                              ""
                                .concat(e.polygon.length, " points \xb7 ")
                                .concat(4 === e.polygon.length ? "perspective" : "box + fill", " \xb7 ")
                                .concat(t(l), " \xd7 ")
                                .concat(t(a)),
                            ],
                          ];
                        })(et.cut).map((e) => {
                          let [t, l] = e;
                          return (0, a.jsxs)(
                            "div",
                            {
                              children: [
                                (0, a.jsx)("span", { children: t }),
                                (0, a.jsx)("b", { children: l }),
                              ],
                            },
                            t,
                          );
                        }),
                      }),
                      (0, a.jsxs)("div", {
                        className: "btnrow",
                        style: { marginTop: 10 },
                        children: [
                          (0, a.jsx)("button", {
                            onClick: ew,
                            children:
                              "none" === et.cut.palluEnd
                                ? "Add pallu line"
                                : "end" === et.cut.palluEnd
                                  ? "Pallu at top"
                                  : "Pallu at bottom",
                          }),
                          (0, a.jsx)("button", { onClick: eb, children: "Re-detect" }),
                        ],
                      }),
                      (0, a.jsx)("p", {
                        className: "note",
                        children:
                          "The whole photo, straightened. The green outline starts on the four corners of the cloth that was found. With four points the cloth is pulled straight by a perspective warp, so a photo shot at an angle comes out as a clean rectangle with nothing filled in. Drag the points to the true corners; double-click on the outline to add a point (then the outline's box is used and anything outside the outline is filled from the cloth), double-click a point to remove it. Drag the orange line to where the pallu starts; the cut is turned so the pallu ends up at the bottom, where the original app keeps it.",
                      }),
                    ],
                  }),
                (0, a.jsxs)("div", {
                  className: "card",
                  children: [
                    (0, a.jsxs)("h2", {
                      children: [(0, a.jsx)("span", { className: "n", children: et ? 5 : 3 }), "Tweak"],
                    }),
                    (0, a.jsxs)("div", {
                      className: "btnrow",
                      children: [
                        (0, a.jsxs)("button", {
                          onClick: ed,
                          children: ["Rotate 90\xb0 (", 90 * eS, "\xb0)"],
                        }),
                        (0, a.jsx)("button", { onClick: () => eh(c.textureIndex, !1), children: "Reset" }),
                      ],
                    }),
                    i.dU.map((e) =>
                      (0, a.jsxs)(
                        "div",
                        {
                          className: "row",
                          children: [
                            (0, a.jsx)("label", { children: e.label }),
                            (0, a.jsx)("input", {
                              type: "range",
                              min: e.min,
                              max: e.max,
                              step: e.step,
                              value: c.params[e.param],
                              onChange: (t) => ec(e.param, +t.target.value),
                            }),
                            (0, a.jsx)("span", { className: "val", children: c.params[e.param].toFixed(2) }),
                          ],
                        },
                        e.param,
                      ),
                    ),
                    (0, a.jsxs)("div", {
                      className: "btnrow",
                      style: { marginTop: 10 },
                      children: [
                        (0, a.jsx)("button", {
                          className: "primary",
                          onClick: eu,
                          disabled: !f,
                          children: "Download PNG",
                        }),
                        (0, a.jsx)("button", { onClick: () => _(!0), disabled: !f, children: "Open popup" }),
                      ],
                    }),
                    (0, a.jsxs)("p", {
                      className: "note",
                      children: [
                        "The classic one-to-one layout of the original app is at ",
                        (0, a.jsx)("a", {
                          href: "/classic",
                          style: { color: "var(--accent)" },
                          children: "/classic",
                        }),
                        ".",
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, a.jsxs)("div", {
              className: "stage",
              children: [
                (0, a.jsxs)("div", { className: "name", children: [el.name, " \xb7 ", R(ee)] }),
                (S || eC) && (0, a.jsx)("div", { className: "badge", children: eC ? "detecting cloth…" : S }),
                !f && !y && (0, a.jsx)("div", { className: "empty", children: "Loading the drape…" }),
                y && (0, a.jsx)("div", { className: "empty", children: y }),
                (0, a.jsx)("canvas", { ref: X, style: { display: f ? "block" : "none" } }),
              ],
            }),
            F &&
              (0, a.jsx)("div", {
                className: "modal",
                onClick: () => _(!1),
                children: (0, a.jsxs)("div", {
                  className: "modal-box",
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    (0, a.jsxs)("div", {
                      className: "modal-head",
                      children: [
                        (0, a.jsxs)("div", {
                          children: [
                            (0, a.jsx)("strong", { children: R(ee) }),
                            (0, a.jsxs)("span", { children: ["on ", el.name] }),
                          ],
                        }),
                        (0, a.jsxs)("div", {
                          className: "btnrow",
                          children: [
                            (0, a.jsx)("button", { onClick: ed, children: "Rotate 90\xb0" }),
                            (0, a.jsx)("button", {
                              className: "primary",
                              onClick: eu,
                              children: "Download PNG",
                            }),
                            (0, a.jsx)("button", { onClick: () => _(!1), children: "Close" }),
                          ],
                        }),
                      ],
                    }),
                    (0, a.jsxs)("div", {
                      className: "modal-body",
                      children: [
                        (0, a.jsxs)("div", {
                          className: "pane",
                          children: [
                            (0, a.jsx)("h3", { children: "Saree" }),
                            (0, a.jsx)("div", {
                              className: "img",
                              children: (0, a.jsx)("img", {
                                src: ee.src,
                                alt: R(ee),
                                style: { transform: "rotate(".concat(90 * eS, "deg)") },
                              }),
                            }),
                            (0, a.jsx)("div", {
                              className: "meta",
                              children: et
                                ? (0, p.q0)(et.prepared, et.autoTrim)
                                : "Built-in fabric from the original app.",
                            }),
                          ],
                        }),
                        (0, a.jsxs)("div", {
                          className: "pane",
                          children: [
                            (0, a.jsx)("h3", { children: "Draped" }),
                            (0, a.jsx)("div", {
                              className: "img",
                              children: W && (0, a.jsx)("img", { src: W, alt: "Draped preview" }),
                            }),
                            (0, a.jsxs)("div", {
                              className: "meta",
                              children: [el.name, ". ", el.note, " Sliders in the panel update this live."],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              }),
          ],
        });
      }
    },
    8706: (e, t, l) => {
      Promise.resolve().then(l.bind(l, 4900));
    },
  },
  (e) => {
    e.O(0, [956, 441, 255, 358], () => e((e.s = 8706))), (_N_E = e.O());
  },
]);
