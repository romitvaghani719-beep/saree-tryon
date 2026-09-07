"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [956],
  {
    63: (t, e, n) => {
      var r = n(7260);
      n.o(r, "useSearchParams") &&
        n.d(e, {
          useSearchParams: function () {
            return r.useSearchParams;
          },
        });
    },
    1894: (t, e, n) => {
      function r(t) {
        let e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 360,
          n = Math.max(1, Math.ceil(Math.max(t.width, t.height) / e)),
          r = Math.max(1, Math.floor(t.width / n)),
          o = Math.max(1, Math.floor(t.height / n)),
          a = new Uint8Array(r * o * 3),
          i = t.data;
        for (let e = 0; e < o; e++)
          for (let o = 0; o < r; o++) {
            let l = 0,
              h = 0,
              u = 0,
              f = 0;
            for (let r = 0; r < n; r++) {
              let a = e * n + r;
              if (a >= t.height) break;
              for (let e = 0; e < n; e++) {
                let r = o * n + e;
                if (r >= t.width) break;
                let s = (a * t.width + r) * 4;
                (l += i[s]), (h += i[s + 1]), (u += i[s + 2]), f++;
              }
            }
            let s = (e * r + o) * 3;
            (a[s] = l / f), (a[s + 1] = h / f), (a[s + 2] = u / f);
          }
        return { w: r, h: o, rgb: a, scale: n };
      }
      function o(t) {
        let { w: e, h: n, rgb: r } = t,
          o = [],
          a = Math.max(1, Math.round(0.02 * Math.min(e, n)));
        for (let t = 0; t < n; t++)
          for (let i = 0; i < e; i++) {
            if (i >= a && i < e - a && t >= a && t < n - a) continue;
            let l = (t * e + i) * 3;
            o.push([r[l], r[l + 1], r[l + 2]]);
          }
        if (!o.length) return null;
        let i = [0, 1, 2].map((t) => {
            let e = o.map((e) => e[t]).sort((t, e) => t - e);
            return e[e.length >> 1];
          }),
          l = o
            .map((t) => (Math.abs(t[0] - i[0]) + Math.abs(t[1] - i[1]) + Math.abs(t[2] - i[2])) / 3)
            .sort((t, e) => t - e),
          h = Math.min(60, Math.max(20, 3 * l[Math.floor(0.6 * l.length)])),
          u = new Uint8Array(e * n),
          f = new Int32Array(e * n),
          s = 0,
          c = 0,
          g = (t) => {
            !u[t] &&
              ((t) => {
                let e = 3 * t;
                return (
                  (Math.abs(r[e] - i[0]) + Math.abs(r[e + 1] - i[1]) + Math.abs(r[e + 2] - i[2])) / 3 <= h
                );
              })(t) &&
              ((u[t] = 1), (f[c++] = t));
          };
        for (let t = 0; t < e; t++) g(t), g((n - 1) * e + t);
        for (let t = 0; t < n; t++) g(t * e), g(t * e + e - 1);
        for (; s < c; ) {
          let t = f[s++],
            r = t % e,
            o = (t / e) | 0;
          r > 0 && g(t - 1), r < e - 1 && g(t + 1), o > 0 && g(t - e), o < n - 1 && g(t + e);
        }
        let d = 0;
        for (let t = 0; t < u.length; t++) d += u[t];
        let m = d / u.length;
        if (m < 0.02 || m > 0.88) return null;
        let p = (t) => {
            let e = [0, 0, 0],
              n = 0;
            for (let o = 0; o < u.length; o++)
              u[o] === t && ((e[0] += r[3 * o]), (e[1] += r[3 * o + 1]), (e[2] += r[3 * o + 2]), n++);
            return n ? e.map((t) => t / n) : null;
          },
          _ = p(1),
          v = p(0);
        return _ && v
          ? (Math.abs(_[0] - v[0]) + Math.abs(_[1] - v[1]) + Math.abs(_[2] - v[2])) / 3 < 50
            ? null
            : u
          : null;
      }
      function a(t, e, n) {
        let r = new Int32Array(e * n).fill(-1),
          o = new Int32Array(e * n),
          a = -1,
          i = 0,
          l = 0;
        for (let h = 0; h < t.length; h++) {
          if (t[h] || r[h] >= 0) continue;
          let u = l++,
            f = 0,
            s = 0;
          (r[h] = u), (o[s++] = h);
          let c = 0;
          for (; f < s; ) {
            let a = o[f++];
            c++;
            let i = a % e,
              l = (a / e) | 0;
            i > 0 && !t[a - 1] && r[a - 1] < 0 && ((r[a - 1] = u), (o[s++] = a - 1)),
              i < e - 1 && !t[a + 1] && r[a + 1] < 0 && ((r[a + 1] = u), (o[s++] = a + 1)),
              l > 0 && !t[a - e] && r[a - e] < 0 && ((r[a - e] = u), (o[s++] = a - e)),
              l < n - 1 && !t[a + e] && r[a + e] < 0 && ((r[a + e] = u), (o[s++] = a + e));
          }
          c > i && ((i = c), (a = u));
        }
        let h = new Uint8Array(e * n);
        if (a < 0) return h;
        for (let t = 0; t < h.length; t++) r[t] === a && (h[t] = 1);
        let u = new Uint8Array(e * n),
          f = 0,
          s = 0,
          c = (t) => {
            u[t] || h[t] || ((u[t] = 1), (o[s++] = t));
          };
        for (let t = 0; t < e; t++) c(t), c((n - 1) * e + t);
        for (let t = 0; t < n; t++) c(t * e), c(t * e + e - 1);
        for (; f < s; ) {
          let t = o[f++],
            r = t % e,
            a = (t / e) | 0;
          r > 0 && c(t - 1), r < e - 1 && c(t + 1), a > 0 && c(t - e), a < n - 1 && c(t + e);
        }
        for (let t = 0; t < h.length; t++) u[t] || (h[t] = 1);
        return h;
      }
      function i(t, e, n, r, o) {
        let a = new Float32Array(n);
        for (let i = 0; i < n; i++) a[i] = t[i] * r + e[i] * o;
        return a.sort(), { lo: a[Math.floor(0.004 * n)], hi: a[Math.min(n - 1, Math.floor(0.996 * n))] };
      }
      function l(t, e, n, r) {
        let o = (r * Math.PI) / 180,
          a = Math.cos(o),
          i = Math.sin(o),
          l = e / 2,
          h = n / 2,
          u = Math.ceil(Math.abs(e * a) + Math.abs(n * i)) + 2,
          f = new Float32Array(u),
          s = new Float32Array(u);
        for (let r = 0; r < n; r++)
          for (let n = 0; n < e; n++) {
            let o = t[r * e + n];
            if (o <= 0) continue;
            let c = 0 | ((n - l) * a + (r - h) * i + u / 2);
            c < 0 || c >= u || ((f[c] += o), (s[c] += 1));
          }
        let c = [];
        for (let t = 0; t < u; t++) s[t] > 0.08 * n && c.push(f[t] / s[t]);
        if (c.length < 8) return 0;
        let g = c.reduce((t, e) => t + e, 0) / c.length;
        if (g <= 1e-6) return 0;
        let d = [...c].sort((t, e) => t - e);
        return d[Math.floor(0.99 * d.length)] / g;
      }
      function h(t, e, n, r, o, a) {
        let i = Math.max(1, Math.round(2 * o)),
          l = Math.max(1, Math.round(2 * a)),
          h = new ImageData(i, l),
          u = (e * Math.PI) / 180,
          f = Math.cos(u),
          s = Math.sin(u),
          c = t.data,
          g = h.data,
          d = t.width,
          m = t.height,
          p = d - 1.001,
          _ = m - 1.001;
        for (let t = 0; t < l; t++) {
          let e = t - a;
          for (let a = 0; a < i; a++) {
            let l = a - o,
              h = n + l * f - e * s,
              u = r + l * s + e * f;
            h < 0 ? (h = 0) : h > p && (h = p), u < 0 ? (u = 0) : u > _ && (u = _);
            let v = 0 | h,
              b = 0 | u,
              x = v + 1 < d ? v + 1 : v,
              E = b + 1 < m ? b + 1 : b,
              T = h - v,
              w = u - b,
              R = (1 - T) * (1 - w),
              M = T * (1 - w),
              U = (1 - T) * w,
              A = T * w,
              P = (b * d + v) * 4,
              S = (b * d + x) * 4,
              L = (E * d + v) * 4,
              F = (E * d + x) * 4,
              y = (t * i + a) * 4;
            (g[y] = c[P] * R + c[S] * M + c[L] * U + c[F] * A),
              (g[y + 1] = c[P + 1] * R + c[S + 1] * M + c[L + 1] * U + c[F + 1] * A),
              (g[y + 2] = c[P + 2] * R + c[S + 2] * M + c[L + 2] * U + c[F + 2] * A),
              (g[y + 3] = 255);
          }
        }
        return h;
      }
      n.d(e, { q0: () => m, ZL: () => s, nL: () => g, Fu: () => d });
      let u = (t) => ({
        image: t,
        report: {
          trimmed: !1,
          angle: 0,
          coverage: 1,
          trim: { left: 0, top: 0, right: 0, bottom: 0 },
          suggestedAngle: null,
        },
      });
      function f(t) {
        let e = t,
          n = null;
        for (let t = 0; t < 3; t++) {
          if (e.length < 10) return null;
          let t = 0,
            r = 0,
            o = 0,
            a = 0;
          for (let [n, i] of e) (t += n), (r += i), (o += n * n), (a += n * i);
          let i = e.length,
            l = i * o - t * t;
          if (1e-9 > Math.abs(l)) return null;
          let h = (i * a - t * r) / l,
            u = (r - h * t) / i;
          n = [h, u];
          let f = e.map((t) => {
              let [e, n] = t;
              return Math.abs(n - (h * e + u));
            }),
            s = [...f].sort((t, e) => t - e),
            c = Math.max(1.5, 3 * s[s.length >> 1]);
          e = e.filter((t, e) => f[e] <= c);
        }
        return n;
      }
      async function s(t) {
        let e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 2600,
          n = await createImageBitmap(t),
          r = Math.min(1, e / Math.max(n.width, n.height)),
          o = Math.max(1, Math.round(n.width * r)),
          a = Math.max(1, Math.round(n.height * r)),
          i = document.createElement("canvas");
        (i.width = o), (i.height = a);
        let l = i.getContext("2d", { willReadFrequently: !0 });
        if (!l) throw Error("Canvas 2D is unavailable in this browser");
        return (
          (l.imageSmoothingQuality = "high"),
          l.drawImage(n, 0, 0, o, a),
          n.close(),
          l.getImageData(0, 0, o, a)
        );
      }
      function c(t) {
        let { width: e, height: n, data: r } = t,
          o = new ImageData(n, e),
          a = o.data;
        for (let t = 0; t < n; t++)
          for (let o = 0; o < e; o++) {
            let i = (t * e + o) * 4,
              l = n - 1 - t,
              h = (o * n + l) * 4;
            (a[h] = r[i]), (a[h + 1] = r[i + 1]), (a[h + 2] = r[i + 2]), (a[h + 3] = r[i + 3]);
          }
        return o;
      }
      function g(t) {
        let e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0.92,
          n = document.createElement("canvas");
        return (
          (n.width = t.width),
          (n.height = t.height),
          n.getContext("2d").putImageData(t, 0, 0),
          new Promise((t, r) => {
            n.toBlob((e) => (e ? t(URL.createObjectURL(e)) : r(Error("encode failed"))), "image/jpeg", e);
          })
        );
      }
      function d(t, e) {
        let n = t,
          s = t,
          g = { left: 0, right: 1, top: 0, bottom: 1 },
          d = null,
          m = null;
        if (e.autoTrim) {
          let c = (function (t) {
            let e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0,
              n = r(t),
              f = o(n);
            if (!f) {
              if (!e) return u(t);
              let n = t.width / 2,
                r = t.height / 2,
                o = (e * Math.PI) / 180,
                a = Math.abs(Math.cos(o)),
                i = Math.abs(Math.sin(o)),
                l = (t.width * a + t.height * i) / 2,
                f = (t.width * i + t.height * a) / 2;
              return {
                image: h(t, e, n, r, l, f),
                report: {
                  trimmed: !1,
                  angle: e,
                  coverage: 1,
                  trim: { left: 0, top: 0, right: 0, bottom: 0 },
                  suggestedAngle: null,
                },
              };
            }
            let s = a(f, n.w, n.h),
              c = 0;
            for (let t = 0; t < s.length; t++) c += s[t];
            let g = c / s.length;
            if ((g > 0.985 && !e) || g < 0.12) return u(t);
            {
              let e = n.w,
                r = -1,
                o = n.h,
                a = -1;
              for (let t = 0; t < s.length; t++) {
                if (!s[t]) continue;
                let i = t % n.w,
                  l = (t / n.w) | 0;
                i < e && (e = i), i > r && (r = i), l < o && (o = l), l > a && (a = l);
              }
              let i = r - e + 1,
                l = a - o + 1,
                h = Math.min(i, l) / Math.max(i, l),
                f = c / (i * l);
              if (h < 0.06 || f < 0.55) return u(t);
            }
            let d = { w: n.w, h: n.h, bits: s, scale: n.scale },
              m = (function (t) {
                let { w: e, bits: n } = t,
                  r = 0;
                for (let t = 0; t < n.length; t++) n[t] && r++;
                if (r < 200) return 0;
                let o = new Float32Array(r),
                  a = new Float32Array(r),
                  i = 0;
                for (let t = 0; t < n.length; t++) n[t] && ((o[i] = t % e), (a[i] = (t / e) | 0), i++);
                let l = (function (t, e, n) {
                    let r = Array.from({ length: n }, (t, e) => e).sort((n, r) => t[n] - t[r] || e[n] - e[r]),
                      o = (n, r, o) => (t[r] - t[n]) * (e[o] - e[n]) - (e[r] - e[n]) * (t[o] - t[n]),
                      a = (t) => {
                        let e = [];
                        for (let n of t) {
                          for (; e.length >= 2 && 0 >= o(e[e.length - 2], e[e.length - 1], n); ) e.pop();
                          e.push(n);
                        }
                        return e.pop(), e;
                      },
                      i = a(r),
                      l = a([...r].reverse()),
                      h = i.concat(l),
                      u = new Float32Array(2 * h.length);
                    return (
                      h.forEach((n, r) => {
                        (u[2 * r] = t[n]), (u[2 * r + 1] = e[n]);
                      }),
                      u
                    );
                  })(o, a, r),
                  h = l.length / 2;
                if (h < 3) return 0;
                let u = (t) => {
                    let e = (t * Math.PI) / 180,
                      n = Math.cos(e),
                      r = Math.sin(e),
                      o = 1 / 0,
                      a = -1 / 0,
                      i = 1 / 0,
                      u = -1 / 0;
                    for (let t = 0; t < h; t++) {
                      let e = l[2 * t],
                        h = l[2 * t + 1],
                        f = e * n + h * r,
                        s = -e * r + h * n;
                      f < o && (o = f), f > a && (a = f), s < i && (i = s), s > u && (u = s);
                    }
                    return (a - o) * (u - i);
                  },
                  f = 0,
                  s = 1 / 0;
                for (let t = -25; t <= 25; t += 0.5) {
                  let e = u(t);
                  e < s && ((s = e), (f = t));
                }
                for (let t = f - 0.5; t <= f + 0.5; t += 0.05) {
                  let e = u(t);
                  e < s && ((s = e), (f = t));
                }
                return f;
              })(d),
              p = r(t, 540),
              _ = new Uint8Array(p.w * p.h);
            for (let t = 0; t < p.h; t++)
              for (let e = 0; e < p.w; e++) {
                let r = Math.min(n.w - 1, Math.floor((e / p.w) * n.w)),
                  o = Math.min(n.h - 1, Math.floor((t / p.h) * n.h));
                _[t * p.w + e] = s[o * n.w + r];
              }
            let v = (function (t, e) {
                let { w: n, h: r, rgb: o } = t,
                  a = new Float32Array(n * r),
                  i = (t) => 0.299 * o[3 * t] + 0.587 * o[3 * t + 1] + 0.114 * o[3 * t + 2],
                  l = [];
                for (let t = 0; t < n * r; t++) e[t] && l.push(i(t));
                if (l.length < 32) return a;
                l.sort((t, e) => t - e);
                let h = l[Math.floor(0.6 * l.length)];
                for (let t = 0; t < r; t++)
                  for (let r = 1; r < n - 1; r++) {
                    let o = t * n + r;
                    if (!e[o]) continue;
                    let l = Math.abs(i(o + 1) - i(o - 1)) / 2,
                      u = Math.min(3, Math.max(0, (i(o) - h) / 40));
                    a[o] = l * u;
                  }
                return a;
              })(p, _),
              b = l(v, p.w, p.h, m),
              x = m,
              E = b;
            for (let t = -25; t <= 25; t += 1) {
              let e = l(v, p.w, p.h, t);
              e > E && ((E = e), (x = t));
            }
            for (let t = x - 1; t <= x + 1; t += 0.25) {
              let e = l(v, p.w, p.h, t);
              e > E && ((E = e), (x = t));
            }
            let T = E / Math.max(b, 1e-6),
              w = T > 1.5,
              R = (w ? x : m) + e,
              M = !w && T > 1.25 && Math.abs(x - m) >= 2 ? Math.round((x - m) * 4) / 4 : null,
              U = Math.max(1, Math.floor(c / 2e4)),
              A = Math.ceil(c / U),
              P = new Float32Array(A),
              S = new Float32Array(A),
              L = 0,
              F = 0;
            for (let t = 0; t < s.length && L < A; t++)
              s[t] && !(F++ % U) && ((P[L] = t % n.w), (S[L] = (t / n.w) | 0), L++);
            let y = (R * Math.PI) / 180,
              D = Math.cos(y),
              C = Math.sin(y),
              I = i(P, S, L, D, C),
              V = i(P, S, L, -C, D);
            {
              let t = Math.floor(I.lo),
                e = Math.ceil(I.hi),
                r = Math.floor(V.lo),
                o = Math.ceil(V.hi),
                a = Math.max(1, e - t),
                i = Math.max(1, o - r),
                l = new Int32Array(a),
                h = new Int32Array(i);
              for (let e = 0; e < i; e++) {
                let o = r + e;
                for (let r = 0; r < a; r++) {
                  let a = t + r,
                    i = Math.round(a * D - o * C),
                    u = Math.round(a * C + o * D);
                  !(i < 0) && !(u < 0) && !(i >= n.w) && !(u >= n.h) && s[u * n.w + i] && (l[r]++, h[e]++);
                }
              }
              let u = (t, e, n, r) => {
                  let o = Math.floor(0.1 * n);
                  for (let n = 0; n < o; n++) {
                    let o = r ? n : t.length - 1 - n;
                    if (t[o] / e >= 0.92) return n;
                  }
                  return 0;
                },
                f = u(l, i, a, !0),
                c = u(l, i, a, !1),
                g = u(h, a, i, !0),
                d = u(h, a, i, !1),
                m = (t, e, r, o) => {
                  let a = e - t,
                    i = o - r;
                  if (a < 8 || i < 8) return { worst: 1, side: -1 };
                  let l = 1,
                    h = -1,
                    u = (e, o) => {
                      let l = 0,
                        h = 0,
                        u = "u" === o ? a : i;
                      for (let a = 0; a < u; a++) {
                        let i = "u" === o ? t + a : e,
                          u = "u" === o ? e : r + a,
                          f = Math.round(i * D - u * C),
                          c = Math.round(i * C + u * D);
                        h++, f >= 0 && c >= 0 && f < n.w && c < n.h && s[c * n.w + f] && l++;
                      }
                      return h ? l / h : 0;
                    };
                  for (let [n, a] of [
                    [u(t, "v"), 0],
                    [u(e - 1, "v"), 1],
                    [u(r, "u"), 2],
                    [u(o - 1, "u"), 3],
                  ])
                    n < l && ((l = n), (h = a));
                  return { worst: l, side: h };
                },
                p = Math.floor(0.35 * Math.min(a, i));
              for (let t = 0; t < p; t++) {
                let t = Math.floor(I.lo) + f,
                  e = Math.ceil(I.hi) - c,
                  { worst: n, side: r } = m(t, e, Math.floor(V.lo) + g, Math.ceil(V.hi) - d);
                if (n >= 0.97 || r < 0) break;
                0 === r ? f++ : 1 === r ? c++ : 2 === r ? g++ : d++;
              }
              (I.lo += f), (I.hi -= c), (V.lo += g), (V.hi -= d);
            }
            let B = (I.lo + I.hi) / 2,
              N = (V.lo + V.hi) / 2,
              O = B * D - N * C,
              X = B * C + N * D,
              H = n.scale,
              W = (O + 0.5) * H,
              k = (X + 0.5) * H,
              G = ((I.hi - I.lo) / 2) * H,
              j = ((V.hi - V.lo) / 2) * H,
              q = h(t, R, W, k, G, j);
            return (
              !(function (t, e, n, r, o, a, i, l) {
                let { w: h, h: u, bits: f } = e,
                  s = new Int32Array(h * u).fill(-1),
                  c = new Int32Array(h * u),
                  g = 0,
                  d = 0;
                for (let t = 0; t < f.length; t++) f[t] && ((s[t] = t), (c[d++] = t));
                if (!d) return;
                for (; g < d; ) {
                  let t = c[g++],
                    e = t % h,
                    n = (t / h) | 0,
                    r = (e) => {
                      s[e] < 0 && ((s[e] = s[t]), (c[d++] = e));
                    };
                  e > 0 && r(t - 1), e < h - 1 && r(t + 1), n > 0 && r(t - h), n < u - 1 && r(t + h);
                }
                let m = (n * Math.PI) / 180,
                  p = Math.cos(m),
                  _ = Math.sin(m),
                  v = t.data;
                for (let e = 0; e < t.height; e++) {
                  let n = e - i;
                  for (let c = 0; c < t.width; c++) {
                    let g = c - a,
                      d = Math.round((r + g * p - n * _) / l),
                      m = Math.round((o + g * _ + n * p) / l);
                    if (d < 0 || m < 0 || d >= h || m >= u) continue;
                    let b = m * h + d;
                    if (f[b]) continue;
                    let x = s[b];
                    if (x < 0) continue;
                    let E = (x % h) * l,
                      T = ((x / h) | 0) * l,
                      w = Math.round((E - r) * p + (T - o) * _ + a),
                      R = Math.round(-(E - r) * _ + (T - o) * p + i);
                    if (w < 0 || R < 0 || w >= t.width || R >= t.height) continue;
                    let M = (e * t.width + c) * 4,
                      U = (R * t.width + w) * 4;
                    (v[M] = v[U]), (v[M + 1] = v[U + 1]), (v[M + 2] = v[U + 2]), (v[M + 3] = 255);
                  }
                }
              })(q, d, R, W, k, G, j, H),
              {
                image: q,
                report: {
                  trimmed: !0,
                  angle: R,
                  coverage: g,
                  trim: {
                    left: Math.max(0, (W - G) / t.width),
                    top: Math.max(0, (k - j) / t.height),
                    right: Math.max(0, (t.width - (W + G)) / t.width),
                    bottom: Math.max(0, (t.height - (k + j)) / t.height),
                  },
                  suggestedAngle: M,
                },
              }
            );
          })(t, e.nudge);
          if (
            ((m = c.report),
            (s = c.image),
            c.report.trimmed &&
              (d = (function (t, e) {
                let n = r(t),
                  i = o(n);
                if (!i) return null;
                let { w: l, h } = n,
                  u = a(i, l, h),
                  s = 0,
                  c = l,
                  g = -1,
                  d = h,
                  m = -1;
                for (let t = 0; t < u.length; t++) {
                  if (!u[t]) continue;
                  s++;
                  let e = t % l,
                    n = (t / l) | 0;
                  e < c && (c = e), e > g && (g = e), n < d && (d = n), n > m && (m = n);
                }
                if (s < 200) return null;
                let p = d + (m - d) * 0.05,
                  _ = m - (m - d) * 0.05,
                  v = c + (g - c) * 0.05,
                  b = g - (g - c) * 0.05,
                  x = [],
                  E = [];
                for (let t = Math.ceil(p); t <= _; t++) {
                  let e = -1,
                    n = -1;
                  for (let n = 0; n < l; n++)
                    if (u[t * l + n]) {
                      e = n;
                      break;
                    }
                  for (let e = l - 1; e >= 0; e--)
                    if (u[t * l + e]) {
                      n = e;
                      break;
                    }
                  e >= 0 && x.push([t, e]), n >= 0 && E.push([t, n + 1]);
                }
                let T = [],
                  w = [];
                for (let t = Math.ceil(v); t <= b; t++) {
                  let e = -1,
                    n = -1;
                  for (let n = 0; n < h; n++)
                    if (u[n * l + t]) {
                      e = n;
                      break;
                    }
                  for (let e = h - 1; e >= 0; e--)
                    if (u[e * l + t]) {
                      n = e;
                      break;
                    }
                  e >= 0 && T.push([t, e]), n >= 0 && w.push([t, n + 1]);
                }
                let R = f(x),
                  M = f(E),
                  U = f(T),
                  A = f(w);
                if (!R || !M || !U || !A) return null;
                let P = (t, e) => {
                    let [n, r] = t,
                      [o, a] = e,
                      i = 1 - n * o;
                    if (1e-6 > Math.abs(i)) return null;
                    let l = (n * a + r) / i;
                    return [l, o * l + a];
                  },
                  S = P(R, U),
                  L = P(M, U),
                  F = P(M, A),
                  y = P(R, A);
                if (!S || !L || !F || !y) return null;
                let D = [S, L, F, y];
                for (let [t, e] of D)
                  if (t < -(0.1 * l) || t > 1.1 * l || e < -(0.1 * h) || e > 1.1 * h) return null;
                let C = 0;
                for (let t = 0; t < 4; t++) {
                  let [e, n] = D[t],
                    [r, o] = D[(t + 1) % 4];
                  C += e * o - r * n;
                }
                if ((C = Math.abs(C) / 2) < 0.7 * s || C > 1.4 * s) return null;
                let I = D.reduce((t, e) => t + e[0], 0) / 4,
                  V = D.reduce((t, e) => t + e[1], 0) / 4;
                for (let t of D) (t[0] += (I - t[0]) * 0.005), (t[1] += (V - t[1]) * 0.005);
                let B = (e * Math.PI) / 180,
                  N = Math.cos(B),
                  O = Math.sin(B),
                  X = Math.round(t.width * Math.abs(N) + t.height * Math.abs(O)),
                  H = Math.round(t.width * Math.abs(O) + t.height * Math.abs(N)),
                  W = n.scale;
                return D.map((t) => {
                  let [e, n] = t,
                    r = e - l / 2,
                    o = n - h / 2;
                  return [
                    Math.min(1, Math.max(0, ((r * N + o * O) * W + X / 2) / X)),
                    Math.min(1, Math.max(0, ((-r * O + o * N) * W + H / 2) / H)),
                  ];
                });
              })(t, c.report.angle)),
            c.report.trimmed || 0 !== c.report.angle)
          ) {
            let e = t.width,
              r = t.height,
              o = c.report.trim,
              a = ((o.left + (1 - o.right)) / 2) * e,
              i = ((1 - o.right - o.left) / 2) * e,
              l = ((o.top + (1 - o.bottom)) / 2) * r,
              h = ((1 - o.bottom - o.top) / 2) * r;
            n = (function (t, e) {
              if (0.001 > Math.abs(e)) return t;
              let n = (e * Math.PI) / 180,
                r = Math.abs(Math.cos(n)),
                o = Math.abs(Math.sin(n)),
                a = Math.round(t.width * r + t.height * o),
                i = Math.round(t.width * o + t.height * r),
                l = document.createElement("canvas");
              (l.width = t.width), (l.height = t.height), l.getContext("2d").putImageData(t, 0, 0);
              let h = document.createElement("canvas");
              (h.width = a), (h.height = i);
              let u = h.getContext("2d", { willReadFrequently: !0 });
              return (
                (u.fillStyle = "#000"),
                u.fillRect(0, 0, a, i),
                u.translate(a / 2, i / 2),
                u.rotate(-n),
                (u.imageSmoothingQuality = "high"),
                u.drawImage(l, -t.width / 2, -t.height / 2),
                u.getImageData(0, 0, a, i)
              );
            })(t, c.report.angle);
            let u = (c.report.angle * Math.PI) / 180,
              f = Math.cos(u),
              s = Math.sin(u),
              d = a - e / 2,
              m = l - r / 2,
              p = d * f + m * s + n.width / 2,
              _ = -d * s + m * f + n.height / 2,
              v = (t) => Math.min(1, Math.max(0, t));
            g = {
              left: v((p - i) / n.width),
              right: v((p + i) / n.width),
              top: v((_ - h) / n.height),
              bottom: v((_ + h) / n.height),
            };
          }
        }
        let p = (g.right - g.left) * n.width > (g.bottom - g.top) * n.height;
        if (p) {
          var _;
          if (
            ((n = c(n)),
            (s = c(s)),
            (g = { left: 1 - (_ = g).bottom, right: 1 - _.top, top: _.left, bottom: _.right }),
            d)
          ) {
            let t = d.map((t) => {
              let [e, n] = t;
              return [1 - n, e];
            });
            d = [t[3], t[0], t[1], t[2]];
          }
        }
        return { full: n, trimmed: s, crop: g, corners: d, report: m, turned: p };
      }
      function m(t, e) {
        if (!t) return "Upload a saree photo to detect the cloth and remove the backdrop.";
        let n = t.turned ? " Turned to portrait." : "";
        if (!e || !t.report) return "Using the photo exactly as uploaded." + n;
        let r = t.report;
        if (!r.trimmed) return "No backdrop found: the cloth already fills the frame." + n;
        let o = Math.round(100 * Math.max(r.trim.left, r.trim.right));
        return (
          "Found the cloth over ".concat(Math.round(100 * r.coverage), "% of the frame, straightened ") +
          ""
            .concat(r.angle >= 0 ? "" : "−")
            .concat(Math.abs(r.angle).toFixed(1), "\xb0 and trimmed ")
            .concat(o, "% off the sides.") +
          n
        );
      }
    },
    4586: (t, e, n) => {
      n.d(e, { SC: () => i, Yz: () => o, xn: () => a });
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
    },
    6072: (t, e, n) => {
      n.d(e, { c: () => c, m: () => s });
      var r = n(7877),
        o = n(4586);
      let a =
          "#version 300 es\nlayout(location=0) in vec3 aPos;\nlayout(location=1) in vec2 aUV;\nlayout(location=2) in vec2 aUV2;\nuniform mat4 uProj;\nout vec2 vUV;\nout vec2 vUV2;\nvoid main() {\n  vUV = aUV;\n  vUV2 = aUV2;\n  gl_Position = uProj * vec4(aPos, 1.0);\n}",
        i =
          "#version 300 es\nprecision highp float;\nin vec2 vUV;\nuniform sampler2D Colored_Texture;\nuniform sampler2D Shading;\nuniform sampler2D Panels;\nuniform sampler2D UVMap;\nuniform vec4 Fit;                    // scaleX, scaleY, offsetX, offsetY\nuniform vec2 ShadeRange;\nuniform float FabricAspect;          // fabric width / height\nuniform float SareeWidthPx;\nuniform float PalluDepth;            // fraction of the fabric height\nuniform float PalluAtMax;            // 1 = pallu at the far end of the cloth\nuniform float FabricPalluAtStart;    // 1 = this saree's decorated end is at the top of its image\nuniform float LengthScale;           // cloth taken along the length, relative to the plate's px/m\nuniform float TuckOffset;            // fraction of the length hidden in the tuck before the pleats start\nuniform float RUSpan["
            .concat(o.xn, "];\nuniform float RVSpan[")
            .concat(o.xn, "];\nuniform int RRole[")
            .concat(
              o.xn,
              "];   // 0 body, 1 pallu, 2 tail\n// Per-region placement, from the editor's fix.json (or the defaults).\nuniform float RFlipW[",
            )
            .concat(o.xn, "];\nuniform float RFlipL[")
            .concat(o.xn, "];\nuniform float RLen[")
            .concat(o.xn, "];\nuniform float RWid[")
            .concat(o.xn, "];\nuniform float ROffL[")
            .concat(o.xn, "];\nuniform float ROffW[")
            .concat(o.xn, "];\nuniform float RShow[")
            .concat(
              o.xn,
              "];\nuniform int Rotation;\nuniform float UV_Tiling;\nuniform float Brightness;\nuniform float Saturate;\nuniform float Expose_Amount;\nuniform float Shadow_Color;\nuniform float Highlight_Color;\nuniform float Highlight_Multiplication;\nuniform float Screen_Amount;\nout vec4 fragColor;\n\nvoid main() {\n  // Viewport -> template, keeping the plate's aspect (letterboxed).\n  vec2 t = (vec2(vUV.x, 1.0 - vUV.y) - Fit.zw) / Fit.xy;\n  if (t.x < 0.0 || t.x > 1.0 || t.y < 0.0 || t.y > 1.0) { fragColor = vec4(1.0); return; }\n\n  int reg = int(texture(Panels, t).r * 255.0 + 0.5);\n  if (reg >= ",
            )
            .concat(
              o.xn,
              " || RShow[reg] < 0.5) { fragColor = vec4(1.0); return; }   // 255 = not drape\n\n  // Packed 16-bit fabric coordinates.\n  vec4 packed = texture(UVMap, t);\n  float un = (packed.r * 65280.0 + packed.g * 255.0) / 65535.0;\n  float vn = (packed.b * 65280.0 + packed.a * 255.0) / 65535.0;\n\n  // The plate's map runs u along the folds and v across them. Which of those is\n  // the saree's WIDTH depends on the region: on the pleats and the wraps the\n  // folds run down the width (hem to waist); on the hanging pallu the folds run\n  // down the LENGTH of the cloth. Same rule as Model 1-3: hem and pallu edge\n  // carry the left border, waist and inner edge the right border, and the\n  // pallu's free end carries the decorated band.\n  int role = RRole[reg];\n  bool isPallu = role == 1;\n  float wn = isPallu ? (RFlipW[reg] > 0.5 ? 1.0 - vn : vn) : (RFlipW[reg] > 0.5 ? 1.0 - un : un);\n  float ln = isPallu ? (RFlipL[reg] > 0.5 ? 1.0 - un : un) : (RFlipL[reg] > 0.5 ? 1.0 - vn : vn);\n  float widthSpanPx = isPallu ? RVSpan[reg] : RUSpan[reg];\n  float lengthSpanPx = (isPallu ? RUSpan[reg] : RVSpan[reg]) * UV_Tiling * LengthScale * RLen[reg];\n  // A region never shows more than one saree width; the pleats span exactly it.\n  float across = wn * min(1.0, widthSpanPx * UV_Tiling / SareeWidthPx) * RWid[reg] + ROffW[reg];\n  float runLen = lengthSpanPx / SareeWidthPx * FabricAspect;\n  float along = ln * lengthSpanPx / SareeWidthPx * FabricAspect + ROffL[reg];\n\n  // Only the pallu region may reach the decorated end; the pleats meet the\n  // plain tuck end; everything else is mid-saree and repeats.\n  float bodyBot = clamp(1.0 - PalluDepth, 0.05, 1.0);\n  float y;\n  if (role == 1) y = 1.0 - (runLen - along);\n  else if (role == 2) y = along + TuckOffset;   // the plain end sits inside the tuck, out of sight\n  else y = bodyBot - along;\n  // Mid-saree repeats between the tuck and the pallu band, never into either.\n  float wrapLen = max(0.05, bodyBot - TuckOffset);\n  if (role != 1 || y < bodyBot) {\n    float d = bodyBot - y;\n    if (d > 0.0) y = bodyBot - mod(d, wrapLen);\n  }\n  if (PalluAtMax < 0.5) y = 1.0 - y;\n\n  vec2 fab = clamp(vec2(across, y), vec2(0.0), vec2(1.0));\n  // The drape reaches for the decorated end at fab.y = 1. When this saree's\n  // photo has it at the top instead, turn the cloth end over end; the selvedges\n  // run along the length, so they are unaffected.\n  if (FabricPalluAtStart > 0.5) fab.y = 1.0 - fab.y;\n  if (Rotation == 1) fab = vec2(fab.y, 1.0 - fab.x);\n  else if (Rotation == 2) fab = vec2(1.0 - fab.x, 1.0 - fab.y);\n  else if (Rotation == 3) fab = vec2(1.0 - fab.y, fab.x);\n\n  vec3 col = texture(Colored_Texture, fab).rgb * Brightness;\n  float lum = dot(col, vec3(0.30000, 0.59000, 0.11000));\n  col = vec3(lum) + (col - vec3(lum)) * Saturate;\n\n  float s = texture(Shading, t).r;\n  float shade = ShadeRange.x + s * (ShadeRange.y - ShadeRange.x);\n  col *= shade * Expose_Amount;\n\n  vec3 shadowed = col * Shadow_Color;\n  vec3 lit = col * Highlight_Color;\n  float hl = clamp((shade - ShadeRange.x) / max(1e-4, ShadeRange.y - ShadeRange.x), 0.0, 1.0)\n             * Highlight_Multiplication;\n  vec3 mixed = mix(shadowed, lit, vec3(hl));\n  vec3 screened = vec3(1.0) - (vec3(1.0) - shadowed) * (1.0 - hl);\n  fragColor = vec4(mix(mixed, screened, Screen_Amount), 1.0);\n}",
            ),
        l =
          "#version 300 es\nout vec2 vUV;\nvoid main() {\n  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);\n  vUV = p;\n  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);\n}";
      function h(t, e, n) {
        let r = t.createShader(e);
        if ((t.shaderSource(r, n), t.compileShader(r), !t.getShaderParameter(r, t.COMPILE_STATUS)))
          throw Error("shader: " + t.getShaderInfoLog(r));
        return r;
      }
      function u(t, e, n) {
        let r = t.createProgram();
        if (
          (t.attachShader(r, h(t, t.VERTEX_SHADER, e)),
          t.attachShader(r, h(t, t.FRAGMENT_SHADER, n)),
          t.linkProgram(r),
          !t.getProgramParameter(r, t.LINK_STATUS))
        )
          throw Error("link: " + t.getProgramInfoLog(r));
        return r;
      }
      async function f(t) {
        return new Promise((e, n) => {
          let r = new Image();
          (r.onload = () => e(r)), (r.onerror = () => n(Error("failed to load " + t))), (r.src = t);
        });
      }
      class s {
        setScale(t) {
          let e = this.gl,
            n = Math.round(r.n6.width * t),
            o = Math.round(r.n6.height * t);
          if (n === this.fboW && o === this.fboH) return;
          (this.fboW = n),
            (this.fboH = o),
            (this.canvas.width = n),
            (this.canvas.height = o),
            e.bindTexture(e.TEXTURE_2D, this.fboTex),
            e.texImage2D(e.TEXTURE_2D, 0, e.SRGB8_ALPHA8, n, o, 0, e.RGBA, e.UNSIGNED_BYTE, null),
            e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.LINEAR),
            e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.LINEAR),
            e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE),
            e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE),
            e.bindRenderbuffer(e.RENDERBUFFER, this.depthRb),
            e.renderbufferStorage(e.RENDERBUFFER, e.DEPTH_COMPONENT24, n, o),
            e.bindFramebuffer(e.FRAMEBUFFER, this.fbo),
            e.framebufferTexture2D(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, e.TEXTURE_2D, this.fboTex, 0),
            e.framebufferRenderbuffer(e.FRAMEBUFFER, e.DEPTH_ATTACHMENT, e.RENDERBUFFER, this.depthRb);
          let a = e.checkFramebufferStatus(e.FRAMEBUFFER);
          if (a !== e.FRAMEBUFFER_COMPLETE) throw Error("framebuffer incomplete: " + a);
          e.bindFramebuffer(e.FRAMEBUFFER, null);
        }
        setMeshes(t) {
          let e = this.gl;
          (this.models = t.models.map((t) => ({
            background: this.upload(t.background),
            saree: t.saree.map((t) => this.upload(t)),
          }))),
            e.bindVertexArray(null);
        }
        upload(t) {
          let e = this.gl,
            n = e.createVertexArray();
          e.bindVertexArray(n);
          let r = t.pos.length,
            o = new Float32Array(7 * r);
          for (let e = 0; e < r; e++) {
            var a, i, l, h, u, f, s, c;
            (o[7 * e] = t.pos[e][0]),
              (o[7 * e + 1] = t.pos[e][1]),
              (o[7 * e + 2] = t.pos[e][2]),
              (o[7 * e + 3] = null != (u = null == (a = t.uv[e]) ? void 0 : a[0]) ? u : 0),
              (o[7 * e + 4] = null != (f = null == (i = t.uv[e]) ? void 0 : i[1]) ? f : 0),
              (o[7 * e + 5] = null != (s = null == (l = t.uv2[e]) ? void 0 : l[0]) ? s : 0),
              (o[7 * e + 6] = null != (c = null == (h = t.uv2[e]) ? void 0 : h[1]) ? c : 0);
          }
          let g = e.createBuffer();
          e.bindBuffer(e.ARRAY_BUFFER, g),
            e.bufferData(e.ARRAY_BUFFER, o, e.STATIC_DRAW),
            e.enableVertexAttribArray(0),
            e.vertexAttribPointer(0, 3, e.FLOAT, !1, 28, 0),
            e.enableVertexAttribArray(1),
            e.vertexAttribPointer(1, 2, e.FLOAT, !1, 28, 12),
            e.enableVertexAttribArray(2),
            e.vertexAttribPointer(2, 2, e.FLOAT, !1, 28, 20);
          let d = e.createBuffer();
          return (
            e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, d),
            e.bufferData(e.ELEMENT_ARRAY_BUFFER, new Uint16Array(t.idx), e.STATIC_DRAW),
            { vao: n, count: t.idx.length, surface: t }
          );
        }
        texture(t, e) {
          let n = this.textures.get(t);
          if (n) return Promise.resolve(n);
          let r = this.pending.get(t);
          if (r) return r;
          let o = f(t).then((n) => {
            let r = this.gl,
              o = r.createTexture();
            r.bindTexture(r.TEXTURE_2D, o),
              r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL, !1),
              r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !1),
              r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL, r.NONE),
              r.texImage2D(r.TEXTURE_2D, 0, e.srgb ? r.SRGB8_ALPHA8 : r.RGBA8, r.RGBA, r.UNSIGNED_BYTE, n);
            let a = e.repeat ? r.REPEAT : r.CLAMP_TO_EDGE;
            if (
              (r.texParameteri(r.TEXTURE_2D, r.TEXTURE_WRAP_S, a),
              r.texParameteri(r.TEXTURE_2D, r.TEXTURE_WRAP_T, a),
              r.texParameteri(r.TEXTURE_2D, r.TEXTURE_MAG_FILTER, e.nearest ? r.NEAREST : r.LINEAR),
              this.sizes.set(t, n.width / n.height),
              e.nearest)
            )
              r.texParameteri(r.TEXTURE_2D, r.TEXTURE_MIN_FILTER, r.NEAREST);
            else if (e.mipmap) {
              if (
                (r.generateMipmap(r.TEXTURE_2D),
                r.texParameteri(r.TEXTURE_2D, r.TEXTURE_MIN_FILTER, r.LINEAR_MIPMAP_LINEAR),
                this.anisoExt)
              ) {
                let t = r.getParameter(this.anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
                r.texParameterf(r.TEXTURE_2D, this.anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, t));
              }
            } else r.texParameteri(r.TEXTURE_2D, r.TEXTURE_MIN_FILTER, r.LINEAR);
            return this.textures.set(t, o), this.pending.delete(t), o;
          });
          return this.pending.set(t, o), o;
        }
        release(t) {
          let e = this.textures.get(t);
          e && (this.gl.deleteTexture(e), this.textures.delete(t));
        }
        async prepare(t) {
          await Promise.all([
            this.texture(t.cutout, { srgb: !0, repeat: !1, mipmap: !0 }),
            this.texture(t.bw, { srgb: !0, repeat: !1, mipmap: !0 }),
            this.texture(t.texture, { srgb: !0, repeat: !0, mipmap: !0 }),
          ]);
        }
        render(t) {
          let e = this.gl,
            n = this.models[t.model],
            r = this.textures.get(t.texture),
            o = this.textures.get(t.bw),
            a = this.textures.get(t.cutout);
          if (!n || !r || !o || !a) return !1;
          e.bindFramebuffer(e.FRAMEBUFFER, this.fbo),
            e.viewport(0, 0, this.fboW, this.fboH),
            e.clearColor(1, 1, 1, 1),
            e.clearDepth(1),
            e.clear(e.COLOR_BUFFER_BIT | e.DEPTH_BUFFER_BIT),
            e.enable(e.DEPTH_TEST),
            e.depthFunc(e.LEQUAL),
            e.enable(e.CULL_FACE),
            e.frontFace(e.CW),
            e.cullFace(e.BACK),
            e.disable(e.BLEND),
            e.depthMask(!0),
            e.useProgram(this.sareeProg),
            e.uniformMatrix4fv(e.getUniformLocation(this.sareeProg, "uProj"), !1, this.proj),
            e.activeTexture(e.TEXTURE0),
            e.bindTexture(e.TEXTURE_2D, r),
            e.uniform1i(e.getUniformLocation(this.sareeProg, "Colored_Texture"), 0),
            e.activeTexture(e.TEXTURE1),
            e.bindTexture(e.TEXTURE_2D, o),
            e.uniform1i(e.getUniformLocation(this.sareeProg, "Bw_Texture2"), 1);
          let i = t.params;
          for (let t of Object.keys(i)) e.uniform1f(e.getUniformLocation(this.sareeProg, t), i[t]);
          e.uniform1i(e.getUniformLocation(this.sareeProg, "Rotation"), ((t.rotation % 4) + 4) % 4);
          let l = t.gradientShadow,
            h = t.gradientHighlights;
          for (let t of (e.uniform4f(
            e.getUniformLocation(this.sareeProg, "Gradient_Shadow"),
            l.offsets[0],
            l.offsets[1],
            l.colors[0],
            l.colors[1],
          ),
          e.uniform4f(
            e.getUniformLocation(this.sareeProg, "Gradient_Highlights"),
            h.offsets[0],
            h.offsets[1],
            h.colors[0],
            h.colors[1],
          ),
          n.saree))
            e.bindVertexArray(t.vao), e.drawElements(e.TRIANGLES, t.count, e.UNSIGNED_SHORT, 0);
          return (
            e.enable(e.BLEND),
            e.blendFuncSeparate(e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA, e.ONE, e.ONE_MINUS_SRC_ALPHA),
            e.depthMask(!1),
            e.useProgram(this.bgProg),
            e.uniformMatrix4fv(e.getUniformLocation(this.bgProg, "uProj"), !1, this.proj),
            e.activeTexture(e.TEXTURE0),
            e.bindTexture(e.TEXTURE_2D, a),
            e.uniform1i(e.getUniformLocation(this.bgProg, "Texture"), 0),
            e.bindVertexArray(n.background.vao),
            e.drawElements(e.TRIANGLES, n.background.count, e.UNSIGNED_SHORT, 0),
            e.depthMask(!0),
            e.disable(e.BLEND),
            this.resolve(),
            e.bindVertexArray(null),
            !0
          );
        }
        resolve() {
          let t = this.gl;
          return (
            t.bindFramebuffer(t.FRAMEBUFFER, null),
            t.viewport(0, 0, this.canvas.width, this.canvas.height),
            t.disable(t.DEPTH_TEST),
            t.disable(t.CULL_FACE),
            t.useProgram(this.blitProg),
            t.activeTexture(t.TEXTURE0),
            t.bindTexture(t.TEXTURE_2D, this.fboTex),
            t.uniform1i(t.getUniformLocation(this.blitProg, "uTex"), 0),
            t.bindVertexArray(this.blitVao),
            t.drawArrays(t.TRIANGLES, 0, 3),
            t.bindVertexArray(null),
            !0
          );
        }
        async prepareUv(t) {
          let e = t.template;
          await Promise.all([
            this.texture(t.texture, { srgb: !0, repeat: !0, mipmap: !0 }),
            this.texture(e.mannequinUrl, { srgb: !0, repeat: !1, mipmap: !0 }),
            this.texture(e.shadingUrl, { srgb: !1, repeat: !1, mipmap: !1 }),
            this.texture(e.panelsUrl, { srgb: !1, repeat: !1, mipmap: !1, nearest: !0 }),
            this.texture(e.uvUrl, { srgb: !1, repeat: !1, mipmap: !1 }),
          ]);
        }
        renderUv(t) {
          var e, n, r, a, i, l, h, u, f, s, c, g, d, m, p;
          let _ = this.gl,
            v = t.template,
            b = this.textures.get(t.texture),
            x = this.textures.get(v.mannequinUrl),
            E = this.textures.get(v.shadingUrl),
            T = this.textures.get(v.panelsUrl),
            w = this.textures.get(v.uvUrl);
          if (!b || !x || !E || !T || !w) return !1;
          let R = v.width / v.height,
            M = this.fboW / this.fboH,
            U = R > M ? 1 : R / M,
            A = R > M ? M / R : 1,
            P = [U, A, (1 - U) / 2, (1 - A) / 2];
          _.bindFramebuffer(_.FRAMEBUFFER, this.fbo),
            _.viewport(0, 0, this.fboW, this.fboH),
            _.clearColor(1, 1, 1, 1),
            _.clear(_.COLOR_BUFFER_BIT | _.DEPTH_BUFFER_BIT),
            _.disable(_.DEPTH_TEST),
            _.disable(_.CULL_FACE),
            _.disable(_.BLEND);
          let S = v.fix,
            L = (0, o.SC)(v, S, {
              flipW: null == (i = t.flipU) || i,
              flipL: null != (l = t.flipV) && l,
              palluFlipW: null == (h = t.palluFlipW) || h,
              palluFlipL: null != (u = t.palluFlipL) && u,
            }),
            { uSpan: F, vSpan: y, role: D } = L,
            C = this.uvProg;
          _.useProgram(C);
          let I = (t, e, n) => {
            _.activeTexture(_.TEXTURE0 + t),
              _.bindTexture(_.TEXTURE_2D, e),
              _.uniform1i(_.getUniformLocation(C, n), t);
          };
          for (let o of (I(0, b, "Colored_Texture"),
          I(1, E, "Shading"),
          I(2, T, "Panels"),
          I(3, w, "UVMap"),
          _.uniform4f(_.getUniformLocation(C, "Fit"), P[0], P[1], P[2], P[3]),
          _.uniform2f(_.getUniformLocation(C, "ShadeRange"), v.shadingRange[0], v.shadingRange[1]),
          _.uniform1f(_.getUniformLocation(C, "SareeWidthPx"), v.uv.sareeWidthPx),
          _.uniform1f(
            _.getUniformLocation(C, "PalluDepth"),
            null !=
              (s =
                null != (f = t.palluDepth) ? f : null == S || null == (e = S.global) ? void 0 : e.palluDepth)
              ? s
              : 0.22,
          ),
          _.uniform1f(_.getUniformLocation(C, "PalluAtMax"), +("max" === v.uv.palluAt)),
          _.uniform1f(_.getUniformLocation(C, "FabricPalluAtStart"), +!!t.fabricPalluAtStart),
          _.uniform1fv(_.getUniformLocation(C, "RFlipW"), L.flipW),
          _.uniform1fv(_.getUniformLocation(C, "RFlipL"), L.flipL),
          _.uniform1fv(_.getUniformLocation(C, "RLen"), L.len),
          _.uniform1fv(_.getUniformLocation(C, "RWid"), L.wid),
          _.uniform1fv(_.getUniformLocation(C, "ROffL"), L.offL),
          _.uniform1fv(_.getUniformLocation(C, "ROffW"), L.offW),
          _.uniform1fv(_.getUniformLocation(C, "RShow"), L.show),
          _.uniform1f(
            _.getUniformLocation(C, "LengthScale"),
            null !=
              (g =
                null != (c = null == S || null == (n = S.global) ? void 0 : n.lengthScale)
                  ? c
                  : t.lengthScale)
              ? g
              : 1.8,
          ),
          _.uniform1f(
            _.getUniformLocation(C, "TuckOffset"),
            null !=
              (m = null != (d = null == S || null == (r = S.global) ? void 0 : r.tuck) ? d : t.tuckOffset)
              ? m
              : 0.06,
          ),
          _.uniform1f(_.getUniformLocation(C, "FabricAspect"), this.aspectOf(t.texture)),
          _.uniform1i(
            _.getUniformLocation(C, "Rotation"),
            (((t.rotation +
              (null != (p = null == S || null == (a = S.global) ? void 0 : a.rotation) ? p : 0)) %
              4) +
              4) %
              4,
          ),
          _.uniform1fv(_.getUniformLocation(C, "RUSpan"), F),
          _.uniform1fv(_.getUniformLocation(C, "RVSpan"), y),
          _.uniform1iv(_.getUniformLocation(C, "RRole"), D),
          Object.keys(t.params)))
            _.uniform1f(_.getUniformLocation(C, o), t.params[o]);
          return (
            _.bindVertexArray(this.blitVao),
            _.drawArrays(_.TRIANGLES, 0, 3),
            _.enable(_.BLEND),
            _.blendFuncSeparate(_.SRC_ALPHA, _.ONE_MINUS_SRC_ALPHA, _.ONE, _.ONE_MINUS_SRC_ALPHA),
            _.useProgram(this.plateProg),
            _.activeTexture(_.TEXTURE0),
            _.bindTexture(_.TEXTURE_2D, x),
            _.uniform1i(_.getUniformLocation(this.plateProg, "Plate"), 0),
            _.uniform4f(_.getUniformLocation(this.plateProg, "Fit"), P[0], P[1], P[2], P[3]),
            _.drawArrays(_.TRIANGLES, 0, 3),
            _.disable(_.BLEND),
            this.resolve(),
            _.bindVertexArray(null),
            !0
          );
        }
        aspectOf(t) {
          var e;
          return null != (e = this.sizes.get(t)) ? e : 1;
        }
        toPNG() {
          return this.canvas.toDataURL("image/png");
        }
        constructor(t, e = 1) {
          (this.canvas = t),
            (this.fboW = 0),
            (this.fboH = 0),
            (this.textures = new Map()),
            (this.sizes = new Map()),
            (this.pending = new Map()),
            (this.models = []);
          let n = t.getContext("webgl2", {
            antialias: !1,
            alpha: !1,
            premultipliedAlpha: !1,
            preserveDrawingBuffer: !0,
          });
          if (!n) throw Error("WebGL2 is required");
          (this.gl = n),
            (this.anisoExt = n.getExtension("EXT_texture_filter_anisotropic")),
            (this.sareeProg = u(
              n,
              a,
              "#version 300 es\nprecision highp float;\nin vec2 vUV;\nin vec2 vUV2;\nuniform sampler2D Colored_Texture;\nuniform sampler2D Bw_Texture2;\nuniform float UV_Tiling;\nuniform float Brightness;\nuniform float Saturate;\nuniform float Expose_Amount;\nuniform float Shadow_Color;\nuniform float Highlight_Color;\nuniform float Highlight_Multiplication;\nuniform float Screen_Amount;\nuniform int Rotation;              // port addition: fabric image rotated in quarter turns\nuniform vec4 Gradient_Shadow;      // offset0, offset1, grey0, grey1 (sRGB values)\nuniform vec4 Gradient_Highlights;\nout vec4 fragColor;\n\nfloat srgbToLinear(float c) {\n  return c < 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4);\n}\n// GradientTexture1D: linear interpolation between two stops in sRGB space, clamped.\nfloat gradient(vec4 g, float t) {\n  if (t <= g.x) return g.z;\n  if (t >= g.y) return g.w;\n  return mix(g.z, g.w, (t - g.x) / (g.y - g.x));\n}\n\nvoid main() {\n  // Port addition: rotate the fabric image clockwise in quarter turns before anything else.\n  vec2 uv2 = vUV2;\n  if (Rotation == 1) uv2 = vec2(uv2.y, 1.0 - uv2.x);\n  else if (Rotation == 2) uv2 = vec2(1.0 - uv2.x, 1.0 - uv2.y);\n  else if (Rotation == 3) uv2 = vec2(1.0 - uv2.y, uv2.x);\n\n  // Input:7 UV2 -> UVFunc:67 (scaling by UV_Tiling) -> Texture2D:3\n  vec2 n_out67p0 = uv2 * vec2(UV_Tiling);\n  vec4 n_out3p0 = texture(Colored_Texture, n_out67p0);\n\n  // FloatOp:38 Brightness + 0, VectorOp:37\n  float n_out38p0 = Brightness + 0.0;\n  vec4 n_out37p0 = n_out3p0 * vec4(n_out38p0);\n\n  // DotProduct:40, VectorOp:42, FloatParameter:48, VectorOp:43, VectorOp:46 (saturation)\n  float n_out40p0 = dot(n_out37p0.xyz, vec3(0.30000, 0.59000, 0.11000));\n  vec3 n_out42p0 = n_out37p0.xyz - vec3(n_out40p0);\n  vec3 n_out43p0 = n_out42p0 * vec3(Saturate);\n  vec3 n_out46p0 = vec3(n_out40p0) + n_out43p0;\n\n  // Texture2D:4 (B/W folds, sampled at UV)\n  vec4 n_out4p0 = texture(Bw_Texture2, vUV);\n  float n_out4p1 = n_out4p0.r;\n\n  // Texture2D:21 Gradient_Shadow sampled at n_out4p0.xy (source_color -> decoded)\n  vec4 n_out21p0 = vec4(vec3(srgbToLinear(gradient(Gradient_Shadow, n_out4p0.x))), 1.0);\n\n  // VectorOp:9, :13, :35, :31\n  vec3 n_out9p0 = n_out46p0 * n_out21p0.xyz;\n  vec3 n_out13p0 = n_out9p0 * vec3(Expose_Amount);\n  vec3 n_out35p0 = n_out13p0 * vec3(Shadow_Color);\n  vec3 n_out31p0 = n_out13p0 * vec3(Highlight_Color);\n\n  // DotProduct:19, Clamp:16, VectorCompose:15, Texture2D:27 Gradient_Highlights (raw)\n  float n_out19p0 = dot(vec3(n_out4p1), vec3(0.21300, 0.71500, 0.03200));\n  float n_out16p0 = clamp(n_out19p0, 0.0, 1.0);\n  vec4 n_out27p0 = vec4(vec3(gradient(Gradient_Highlights, n_out16p0)), 1.0);\n\n  // FloatOp:26, Mix:29\n  float n_out26p0 = n_out27p0.x * Highlight_Multiplication;\n  vec3 n_out29p0 = mix(n_out35p0, n_out31p0, vec3(n_out26p0));\n\n  // Screen/Highlights frame: VectorFunc:57,58 VectorOp:59 VectorFunc:60 Mix:62\n  vec4 n_out57p0 = vec4(1.0) - vec4(n_out35p0, 0.0);\n  vec4 n_out58p0 = vec4(1.0) - vec4(n_out26p0);\n  vec4 n_out59p0 = n_out57p0 * n_out58p0;\n  vec4 n_out60p0 = vec4(1.0) - n_out59p0;\n  vec4 n_out62p0 = mix(vec4(n_out29p0, 0.0), n_out60p0, vec4(Screen_Amount));\n\n  // Output: ALBEDO (unshaded), opaque\n  fragColor = vec4(n_out62p0.xyz, 1.0);\n}",
            )),
            (this.bgProg = u(
              n,
              a,
              "#version 300 es\nprecision highp float;\nin vec2 vUV;\nuniform sampler2D Texture;\nout vec4 fragColor;\nvoid main() {\n  vec4 n_out3p0 = texture(Texture, vUV);\n  float n_out10p0 = smoothstep(0.00000, 0.40000, n_out3p0.w);\n  fragColor = vec4(n_out3p0.xyz, n_out10p0);\n}",
            )),
            (this.blitProg = u(
              n,
              l,
              "#version 300 es\nprecision highp float;\nin vec2 vUV;\nuniform sampler2D uTex;\nout vec4 fragColor;\nvec3 linearToSrgb(vec3 c) {\n  c = clamp(c, 0.0, 1.0);\n  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));\n}\nvoid main() {\n  vec3 lin = texture(uTex, vUV).rgb;\n  fragColor = vec4(linearToSrgb(lin), 1.0);\n}",
            )),
            (this.uvProg = u(n, l, i)),
            (this.plateProg = u(
              n,
              l,
              "#version 300 es\nprecision highp float;\nin vec2 vUV;\nuniform sampler2D Plate;\nuniform vec4 Fit;\nout vec4 fragColor;\nvoid main() {\n  vec2 t = (vec2(vUV.x, 1.0 - vUV.y) - Fit.zw) / Fit.xy;\n  if (t.x < 0.0 || t.x > 1.0 || t.y < 0.0 || t.y > 1.0) { fragColor = vec4(0.0); return; }\n  fragColor = texture(Plate, t);\n}",
            )),
            (this.blitVao = n.createVertexArray()),
            (this.fbo = n.createFramebuffer()),
            (this.fboTex = n.createTexture()),
            (this.depthRb = n.createRenderbuffer()),
            this.setScale(e);
          let [o, h, f] = r._P.origin;
          (this.proj = (function (t, e, n, r, o, a) {
            return new Float32Array([
              2 / (e - t),
              0,
              0,
              0,
              0,
              2 / (r - n),
              0,
              0,
              0,
              0,
              -2 / (a - o),
              0,
              -(e + t) / (e - t),
              -(r + n) / (r - n),
              -(a + o) / (a - o),
              1,
            ]);
          })(
            o - r._P.halfWidth,
            o + r._P.halfWidth,
            h - r._P.halfHeight,
            h + r._P.halfHeight,
            r._P.near,
            r._P.far,
          )),
            (this.proj[14] += -(this.proj[10] * f));
        }
      }
      class c {
        get ready() {
          return null !== this.tex;
        }
        render(t) {
          let e = this.gl;
          this.tex &&
            (e.viewport(0, 0, this.canvas.width, this.canvas.height),
            e.useProgram(this.prog),
            e.activeTexture(e.TEXTURE0),
            e.bindTexture(e.TEXTURE_2D, this.tex),
            e.uniform1i(e.getUniformLocation(this.prog, "gradient_texture"), 0),
            e.uniform4f(e.getUniformLocation(this.prog, "outline_color"), ...r.Rc.outlineColor),
            e.uniform1f(e.getUniformLocation(this.prog, "time"), t),
            e.uniform1f(e.getUniformLocation(this.prog, "thickness"), r.Rc.thickness),
            e.uniform1f(e.getUniformLocation(this.prog, "hue_shift"), r.Rc.hueShift),
            e.uniform1f(e.getUniformLocation(this.prog, "saturation"), r.Rc.saturation),
            e.uniform1f(e.getUniformLocation(this.prog, "brightness"), r.Rc.brightness),
            e.bindVertexArray(this.vao),
            e.drawArrays(e.TRIANGLES, 0, 3),
            e.bindVertexArray(null));
        }
        constructor(t = 180, e = 240) {
          (this.tex = null),
            (this.canvas = document.createElement("canvas")),
            (this.canvas.width = t),
            (this.canvas.height = e);
          let n = this.canvas.getContext("webgl2", { antialias: !1, alpha: !1, preserveDrawingBuffer: !0 });
          if (!n) throw Error("WebGL2 is required");
          (this.gl = n),
            (this.prog = u(
              n,
              l,
              "#version 300 es\nprecision highp float;\nin vec2 vUV;\nuniform sampler2D gradient_texture;\nuniform vec4 outline_color;\nuniform float time;\nuniform float thickness;\nuniform float hue_shift;\nuniform float saturation;\nuniform float brightness;\nout vec4 COLOR;\n\nvec3 rgb2hsv(vec3 c) {\n  float max_val = max(c.r, max(c.g, c.b));\n  float min_val = min(c.r, min(c.g, c.b));\n  float delta = max_val - min_val;\n  float h = 0.0;\n  if (delta > 0.0) {\n    if (max_val == c.r) { h = (c.g - c.b) / delta; }\n    else if (max_val == c.g) { h = (c.b - c.r) / delta + 2.0; }\n    else { h = (c.r - c.g) / delta + 4.0; }\n    h = mod(h / 6.0, 1.0);\n  }\n  float s = (max_val == 0.0) ? 0.0 : (delta / max_val);\n  float v = max_val;\n  return vec3(h, s, v);\n}\nvec3 hsv2rgb(vec3 c) {\n  float h = c.x; float s = c.y; float v = c.z;\n  float p = v * (1.0 - s);\n  float q = v * (1.0 - s * mod(h * 6.0, 1.0));\n  float t = v * (1.0 - s * (1.0 - mod(h * 6.0, 1.0)));\n  if (h < 1.0 / 6.0) return vec3(v, t, p);\n  if (h < 2.0 / 6.0) return vec3(q, v, p);\n  if (h < 3.0 / 6.0) return vec3(p, v, t);\n  if (h < 4.0 / 6.0) return vec3(p, q, v);\n  if (h < 5.0 / 6.0) return vec3(t, p, q);\n  return vec3(v, p, q);\n}\nvoid main() {\n  vec2 uv = vUV;\n  vec2 center = vec2(0.5, 0.5);\n  float angle = time;\n  float cos_a = cos(angle);\n  float sin_a = sin(angle);\n  mat2 rotation = mat2(vec2(cos_a, -sin_a), vec2(sin_a, cos_a));\n  uv -= center;\n  uv = rotation * uv;\n  uv += center;\n  vec4 gradient_color = texture(gradient_texture, uv);\n  vec3 hsv = rgb2hsv(gradient_color.rgb);\n  hsv.x += hue_shift;\n  hsv.y *= saturation;\n  vec3 final_color = hsv2rgb(hsv);\n  final_color *= brightness;\n  float dist_to_left = uv.x - 0.5;\n  float dist_to_right = 0.5 - uv.x;\n  float border_left = smoothstep(0.0, thickness, dist_to_left);\n  float border_right = smoothstep(0.0, thickness, dist_to_right);\n  float border = max(border_left, border_right);\n  vec4 border_color = mix(outline_color, vec4(final_color, 1.0), border);\n  COLOR = mix(vec4(final_color, 1.0), border_color, border);\n}",
            )),
            (this.vao = n.createVertexArray()),
            f(r.Rc.gradientTexture).then((t) => {
              let e = n.createTexture();
              n.bindTexture(n.TEXTURE_2D, e),
                n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL, !0),
                n.texImage2D(n.TEXTURE_2D, 0, n.RGBA8, n.RGBA, n.UNSIGNED_BYTE, t),
                n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_S, n.CLAMP_TO_EDGE),
                n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_T, n.CLAMP_TO_EDGE),
                n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MIN_FILTER, n.LINEAR),
                n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MAG_FILTER, n.LINEAR),
                (this.tex = e);
            });
        }
      }
    },
    7877: (t, e, n) => {
      n.d(e, {
        JX: () => c,
        Jp: () => o,
        L6: () => l,
        LY: () => v,
        Rc: () => m,
        Rm: () => E,
        SH: () => b,
        TM: () => _,
        XT: () => u,
        _P: () => d,
        dU: () => f,
        fi: () => p,
        g5: () => s,
        n6: () => g,
      });
      let r = [
          "Brightness",
          "Saturate",
          "Expose_Amount",
          "Shadow_Color",
          "Highlight_Color",
          "Highlight_Multiplication",
          "Screen_Amount",
          "UV_Tiling",
        ],
        o = {
          Brightness: 1,
          Saturate: 1.07,
          Expose_Amount: 1,
          Shadow_Color: 1.447,
          Highlight_Color: 3,
          Highlight_Multiplication: 1.069,
          Screen_Amount: 0.052,
          UV_Tiling: 1,
        },
        a = { offsets: [0.284644, 1], colors: [0.23, 1] },
        i = { offsets: [0.812734, 1], colors: [0, 0.77] },
        l = [
          {
            id: 1,
            cutout: "/models/1/cutout.webp",
            bw: "/models/1/bw.webp",
            thumb: "/ui/model-1.webp",
            gradientShadow: { offsets: [0.791391, 1], colors: [0.44, 1] },
            gradientHighlights: { offsets: [0.821192, 1], colors: [0, 1] },
            defaults: {
              Brightness: 1.302,
              Expose_Amount: 1,
              Highlight_Color: 1.7,
              Highlight_Multiplication: 1,
              Saturate: 1.235,
              Screen_Amount: 0.213,
              Shadow_Color: 1,
            },
          },
          {
            id: 2,
            cutout: "/models/2/cutout.webp",
            bw: "/models/2/bw.webp",
            thumb: "/ui/model-2.webp",
            gradientShadow: a,
            gradientHighlights: i,
            defaults: {
              Brightness: 1.361,
              Expose_Amount: 1,
              Highlight_Color: 1.355,
              Highlight_Multiplication: 1.28,
              Saturate: 1,
              Screen_Amount: 0.062,
              Shadow_Color: 1,
            },
          },
          {
            id: 3,
            cutout: "/models/3/cutout.webp",
            bw: "/models/3/bw.webp",
            thumb: "/ui/model-3.webp",
            gradientShadow: a,
            gradientHighlights: i,
            defaults: {
              Brightness: 1.361,
              Expose_Amount: 1,
              Highlight_Color: 1.355,
              Highlight_Multiplication: 1.28,
              Saturate: 1,
              Screen_Amount: 0.062,
              Shadow_Color: 1,
            },
          },
        ],
        h = [1.114, 1.199, 1, 1.284, 3, 0.782, 0.167, 1],
        u = [
          {
            id: "t01",
            src: "/textures/t01.webp",
            thumb: "/ui/tex-01.webp",
            defaults: [1.114, 1.199, 1, 1.284, 3, 0.782, 0.167, 1],
          },
          {
            id: "t02",
            src: "/textures/t02.webp",
            thumb: "/ui/tex-02.webp",
            defaults: [1.086, 1.199, 1, 1.284, 3, 0.924, 0.167, 1],
          },
          {
            id: "t03",
            src: "/textures/t03.webp",
            thumb: "/ui/tex-03.webp",
            defaults: [1.361, 1.256, 1, 1.479, 3, 0.616, 0.082, 1],
          },
          {
            id: "t04",
            src: "/textures/t04.webp",
            thumb: "/ui/tex-04.webp",
            defaults: [1, 1.256, 1, 0.996, 1.535, 1.374, 0.179, 1],
          },
          {
            id: "t05",
            src: "/textures/t05.webp",
            thumb: "/ui/tex-05.webp",
            defaults: [1, 1.256, 1, 0.996, 3, 0.615, 0.5, 1],
          },
          {
            id: "t06",
            src: "/textures/t06.webp",
            thumb: "/ui/tex-06.webp",
            defaults: [1, 1.057, 1, 1.806, 3, 1.302, 0.104, 1],
          },
          {
            id: "t07",
            src: "/textures/t07.webp",
            thumb: "/ui/tex-07.webp",
            defaults: [0.763, 1.057, 1, 1.678, 3, 0.615, 0.191, 1],
          },
          {
            id: "t08",
            src: "/textures/t08.webp",
            thumb: "/ui/tex-08.webp",
            defaults: [1, 1.057, 1.389, 1.28, 3, 2.131, 0.094, 1],
          },
          {
            id: "t09",
            src: "/textures/t09.webp",
            thumb: "/ui/tex-09.webp",
            defaults: [0.952, 1, 1.342, 0.886, 1.331, 1.232, 0.027, 4.791],
          },
          {
            id: "t10",
            src: "/textures/t10.webp",
            thumb: "/ui/tex-10.webp",
            defaults: [0.905, 1, 1.408, 0.63, 1.313, 0.758, 0.027, 4.364],
          },
          { id: "ref-1", src: "/textures/ref-1.webp", thumb: "/ui/ref-1.webp", defaults: h, extra: !0 },
          { id: "ref-2", src: "/textures/ref-2.webp", thumb: "/ui/ref-2.webp", defaults: h, extra: !0 },
          { id: "ref-3", src: "/textures/ref-3.webp", thumb: "/ui/ref-3.webp", defaults: h, extra: !0 },
        ],
        f = [
          {
            label: "Brightness",
            param: "Brightness",
            top: 712,
            height: 49,
            min: 0,
            max: 3,
            step: 0.01,
            initial: 1.62,
          },
          {
            label: "Saturation",
            param: "Saturate",
            top: 785,
            height: 43,
            min: 0,
            max: 2,
            step: 0.001,
            initial: 1,
          },
          {
            label: "Highlights",
            param: "Highlight_Multiplication",
            top: 857,
            height: 39,
            min: 0,
            max: 5,
            step: 0.001,
            initial: 0.33,
          },
          {
            label: "Shadow Amount",
            param: "Shadow_Color",
            top: 930,
            height: 33,
            min: 0,
            max: 3,
            step: 0.01,
            initial: 1.11,
          },
          {
            label: "UV Tiling",
            param: "UV_Tiling",
            top: 1003,
            height: 33,
            min: 1,
            max: 6,
            step: 0.01,
            initial: 1,
          },
        ],
        s = 234,
        c = 383,
        g = { width: 786, height: 1024 },
        d = {
          halfWidth: 0.5 * (g.width / g.height),
          halfHeight: 0.5,
          origin: [0, 0.495, 0.49],
          near: 0.05,
          far: 10,
        },
        m = {
          outlineColor: [1.4, 0.26, 1.5, 1],
          thickness: 0.963,
          hueShift: 0.015,
          saturation: 1.4,
          brightness: 1.38,
          gradientTexture: "/ui/rectangle-bar.webp",
        },
        p = [
          { left: 74, top: 189 },
          { left: 279, top: 189 },
          { left: 74, top: 454 },
        ].map((t) => ({ ...t, width: 150, height: 225 })),
        _ = [
          { left: 103.64, top: 234.6, width: 95.64, height: 141.075 },
          { left: 308, top: 235, width: 95.695, height: 141.075 },
          { left: 102, top: 499, width: 96.415, height: 141.075 },
        ].map((t) => x(t, 1.67, 50, 75)),
        v = {
          width: 166.154,
          height: 221.538,
          hSep: 27,
          vSep: 27,
          marginLeft: 25,
          marginTop: 10,
          marginBottom: 10,
        },
        b = x(
          { left: v.width / 2 - 56.05, top: v.height / 2 - 67.5375, width: 107.005, height: 141.075 },
          1.67,
          50,
          75,
        );
      function x(t, e, n, r) {
        return { left: t.left + n - n * e, top: t.top + r - r * e, width: t.width * e, height: t.height * e };
      }
      function E(t) {
        let e = {};
        return (
          r.forEach((n, r) => {
            e[n] = t[r];
          }),
          e
        );
      }
    },
  },
]);
