// lib/image.js — recovered from the compiled production bundle (module 1894).
//   ZL(file, max?)         File/Blob -> ImageData (downscaled)
//   nL(imageData, q?)      ImageData -> object-URL jpeg for <img>/thumbs
//   Fu(imageData, opts)    auto-trim/straighten -> { image, report }
//   q0(prepared, autoTrim) human readable status note

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

export { m as q0, s as ZL, g as nL, d as Fu };
