// lib/config.js — recovered from the compiled production bundle
// (downloaded/public/_next/static/chunks/956-c03bab45e31bab11.js, webpack module 7877).
// Export names are the original minified ones so the recovered components keep working:
//   L6   models[]        { id, cutout, bw, thumb, gradientShadow, gradientHighlights, defaults }
//   XT   textures[]      { id, src, thumb, defaults: number[8], extra? }
//   dU   slider layout[] { label, param, top, height, min, max, step, initial }
//   Jp   default params  { Brightness, Saturate, ... }
//   Rm   zipDefaults(number[8]) -> params object
//   TM   model thumb frames, fi model cards, LY texture grid, SH selection frame
//   g5/JX slider x/width, n6 viewport, _P camera, Rc gradient-bar style

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

export { c as JX, o as Jp, l as L6, v as LY, m as Rc, E as Rm, b as SH, _ as TM, u as XT, d as _P, f as dU, p as fi, s as g5, g as n6 };
