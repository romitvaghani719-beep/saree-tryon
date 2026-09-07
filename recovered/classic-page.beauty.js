(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [49],
  {
    1962: (e, t, a) => {
      "use strict";
      a.d(t, { default: () => m });
      var r = a(5155);
      a(8291);
      var l = a(2115),
        n = a(63),
        i = a(7877),
        s = a(6072),
        u = a(1894);
      let c = {
          model: 0,
          textureIndex: 0,
          params: { ...i.Jp },
          sliders: i.dU.map((e) => e.initial),
          custom: [],
          rotations: {},
        },
        d = [1.114, 1.199, 1, 1.284, 3, 0.782, 0.167, 1];
      function o(e) {
        return e.custom.length ? [...i.XT, ...e.custom] : i.XT;
      }
      function h(e) {
        return i.dU.findIndex((t) => t.param === e);
      }
      function m() {
        var e, t, a, m, p, f, x;
        let b = (0, n.useSearchParams)(),
          [v, w] = (0, l.useState)(c),
          [j, N] = (0, l.useState)({ x: 1, y: 1 }),
          [y, L] = (0, l.useState)("loading"),
          [k, C] = (0, l.useState)(!1),
          S = (0, l.useRef)(null),
          T = (0, l.useRef)(null),
          Y = (0, l.useRef)(null),
          R = (0, l.useRef)(null),
          M = (0, l.useRef)(null),
          E = (0, l.useRef)(c);
        E.current = v;
        let I = (0, l.useRef)(!1);
        (0, l.useEffect)(() => {
          let e = () => N({ x: window.innerWidth / 1920, y: window.innerHeight / 1080 });
          return e(), window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
        }, []);
        let U = (0, l.useCallback)((e) => {
          var t;
          let a = i.L6[e.model],
            r = o(e)[e.textureIndex];
          return {
            model: e.model,
            cutout: a.cutout,
            bw: a.bw,
            texture: r.src,
            params: e.params,
            gradientShadow: a.gradientShadow,
            gradientHighlights: a.gradientHighlights,
            rotation: null != (t = e.rotations[r.id]) ? t : 0,
          };
        }, []);
        (0, l.useEffect)(() => {
          let e,
            t = S.current;
          if (!t) return;
          let a = !0;
          try {
            var r;
            let a = Number(null != (r = b.get("scale")) ? r : "1") || 1;
            (e = new s.m(t, a)), (Y.current = new s.c());
          } catch (e) {
            L(e instanceof Error ? e.message : String(e));
            return;
          }
          return (
            (T.current = e),
            (async () => {
              let t = await (await fetch("/meshes.json")).json();
              a && (e.setMeshes(t), await e.prepare(U(E.current)), a && (C(!0), L("")));
            })().catch((e) => L(e instanceof Error ? e.message : String(e))),
            () => {
              a = !1;
            }
          );
        }, []),
          (0, l.useEffect)(() => {
            let e = T.current;
            if (!e || !k) return;
            let t = !0,
              a = U(v);
            return (
              e
                .prepare(a)
                .then(() => {
                  t && e.render(a);
                })
                .catch((e) => L(String(e))),
              () => {
                t = !1;
              }
            );
          }, [v, k, U]),
          (0, l.useEffect)(() => {
            let e = 0,
              t = performance.now(),
              a = () => {
                let r = Y.current;
                if (r && r.ready)
                  for (let e of (r.render((performance.now() - t) / 1e3), [R.current, M.current])) {
                    if (!e) continue;
                    let t = e.getContext("2d");
                    t && t.drawImage(r.canvas, 0, 0, e.width, e.height);
                  }
                e = requestAnimationFrame(a);
              };
            return (e = requestAnimationFrame(a)), () => cancelAnimationFrame(e);
          }, []);
        let P = (0, l.useCallback)((e) => {
            w((t) => {
              let a = i.L6[e],
                r = { ...t.params, ...a.defaults },
                l = [...t.sliders];
              return (
                (l[h("Brightness")] = r.Brightness),
                (l[h("Saturate")] = r.Saturate),
                (l[h("Highlight_Multiplication")] = r.Highlight_Multiplication),
                { ...t, model: e, params: r, sliders: l }
              );
            });
          }, []),
          H = (0, l.useCallback)((e) => {
            w((t) => {
              let a = (0, i.Rm)(o(t)[e].defaults),
                r = i.dU.map((e) => a[e.param]);
              return { ...t, textureIndex: e, params: a, sliders: r };
            });
          }, []),
          X = (0, l.useCallback)(() => {
            w((e) => {
              var t;
              let a = o(e)[e.textureIndex].id;
              return {
                ...e,
                rotations: { ...e.rotations, [a]: ((null != (t = e.rotations[a]) ? t : 0) + 1) % 4 },
              };
            });
          }, []),
          _ = (0, l.useRef)(null),
          A = (0, l.useRef)(0),
          F = (0, l.useRef)(new Map()),
          [O, B] = (0, l.useState)(0),
          [q, J] = (0, l.useState)(null),
          z = (0, l.useCallback)(async (e) => {
            let t = F.current.get(e);
            if (!t) return;
            J(e), await new Promise((e) => setTimeout(e, 30));
            let a = (0, u.Fu)(t.photo, { autoTrim: t.autoTrim, nudge: t.nudge }),
              r = await (0, u.nL)(a.trimmed);
            (t.prepared = a),
              w((t) => {
                let a = t.custom.map((t) => {
                  var a;
                  return t.id !== e
                    ? t
                    : (null == (a = T.current) || a.release(t.src),
                      URL.revokeObjectURL(t.src),
                      { ...t, src: r, thumb: r });
                });
                return { ...t, custom: a };
              }),
              J(null),
              B((e) => e + 1);
          }, []),
          D = (0, l.useCallback)(
            async (e) => {
              if (!e || !e.length) return;
              let t = Array.from(e);
              for (let e of (_.current && (_.current.value = ""), t)) {
                let t;
                try {
                  t = await (0, u.ZL)(e);
                } catch (e) {
                  L(e instanceof Error ? e.message : "That file could not be read as an image.");
                  continue;
                }
                A.current += 1;
                let a = "upload-".concat(A.current);
                F.current.set(a, { photo: t, autoTrim: !0, nudge: 0, prepared: null });
                let r = await (0, u.nL)(t, 0.8);
                w((e) => {
                  let t = [...e.custom, { id: a, src: r, thumb: r, defaults: d, extra: !0 }],
                    l = { ...e, custom: t },
                    n = (0, i.Rm)(d);
                  return {
                    ...l,
                    textureIndex: o(l).length - 1,
                    params: n,
                    sliders: i.dU.map((e) => n[e.param]),
                  };
                }),
                  await z(a);
              }
            },
            [z],
          ),
          G = o(v)[v.textureIndex],
          W = null != (e = F.current.get(G.id)) ? e : null,
          Z = (0, l.useCallback)(
            (e) => {
              let t = G.id,
                a = F.current.get(t);
              a && ((a.autoTrim = e), z(t));
            },
            [G.id, z],
          ),
          K = (0, l.useRef)(null),
          Q = (0, l.useCallback)(
            (e) => {
              let t = G.id,
                a = F.current.get(t);
              a &&
                ((a.nudge = e),
                B((e) => e + 1),
                K.current && clearTimeout(K.current),
                (K.current = setTimeout(() => void z(t), 250)));
            },
            [G.id, z],
          ),
          V = (0, l.useCallback)((e, t) => {
            w((a) => {
              let r = i.dU[e],
                l = Math.min(r.max, Math.max(r.min, Math.round(t / r.step) * r.step)),
                n = [...a.sliders];
              return (n[e] = l), { ...a, sliders: n, params: { ...a.params, [r.param]: l } };
            });
          }, []),
          $ = (0, l.useCallback)(() => {
            let e = T.current;
            if (!e) return;
            e.render(U(E.current));
            let t = document.createElement("a");
            (t.href = e.toPNG()),
              (t.download = "saree-model"
                .concat(E.current.model + 1, "-")
                .concat(o(E.current)[E.current.textureIndex].id, ".png")),
              t.click();
          }, [U]);
        (0, l.useEffect)(() => {
          var e, t, a;
          if (!k || I.current) return;
          let r = b.get("export");
          if (!r) return;
          I.current = !0;
          let l = Math.max(0, Math.min(2, Number(null != (e = b.get("model")) ? e : "1") - 1)),
            n = null != (t = b.get("texture")) ? t : i.XT[0].id,
            s = Math.max(
              0,
              i.XT.findIndex((e) => e.id === n),
            ),
            u = c,
            d = i.L6[l];
          u = { ...u, model: l, params: { ...u.params, ...d.defaults } };
          let o = (0, i.Rm)(i.XT[s].defaults),
            h = ((Number(null != (a = b.get("rotate")) ? a : "0") % 4) + 4) % 4;
          w(
            (u = {
              ...u,
              textureIndex: s,
              params: o,
              sliders: i.dU.map((e) => o[e.param]),
              rotations: { [n]: h },
            }),
          );
          let m = T.current,
            g = U(u);
          m.prepare(g)
            .then(async () => {
              m.render(g);
              let e = await fetch("/api/export", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ name: r, dataUrl: m.toPNG() }),
                }),
                t = await e.json();
              L(t.path ? "exported ".concat(t.path) : "export failed: ".concat(t.error));
            })
            .catch((e) => L("export failed: " + String(e)));
        }, [k, b, U]);
        let ee = (0, l.useMemo)(() => o(v), [v]),
          et = Math.ceil(ee.length / 2),
          ea = i.LY.marginTop + et * i.LY.height + (et - 1) * i.LY.vSep + i.LY.marginBottom;
        return (0, r.jsxs)("div", {
          className: "godot-stage",
          style: { transform: "scale(".concat(j.x, ", ").concat(j.y, ")") },
          children: [
            (0, r.jsx)("div", { className: "abs frame" }),
            (0, r.jsx)("div", { className: "abs viewport", children: (0, r.jsx)("canvas", { ref: S }) }),
            (0, r.jsx)("div", { className: "abs pill", style: { left: 74, top: 92 } }),
            (0, r.jsx)("div", { className: "abs title", style: { left: 99, top: 89 }, children: "Models" }),
            i.TM.map((e, t) =>
              (0, r.jsx)(
                "canvas",
                {
                  ref: t === v.model ? R : void 0,
                  className: "abs outline",
                  width: 180,
                  height: 240,
                  style: {
                    left: e.left,
                    top: e.top,
                    width: e.width,
                    height: e.height,
                    visibility: t === v.model ? "visible" : "hidden",
                  },
                },
                t,
              ),
            ),
            i.fi.map((e, t) =>
              (0, r.jsxs)(
                "div",
                {
                  className: "abs",
                  style: { left: e.left, top: e.top, width: e.width, height: e.height },
                  children: [
                    (0, r.jsx)("div", {
                      className: "abs thumb-shadow",
                      style: { left: 8, top: 8, width: e.width, height: e.height },
                    }),
                    (0, r.jsx)("button", {
                      className: "abs thumb",
                      style: { left: 0, top: 0, width: e.width, height: e.height },
                      onClick: () => P(t),
                      title: "Model ".concat(t + 1),
                      children: (0, r.jsx)("img", {
                        src: i.L6[t].thumb,
                        alt: "Model ".concat(t + 1),
                        draggable: !1,
                      }),
                    }),
                  ],
                },
                t,
              ),
            ),
            i.dU.map((e, t) => {
              let a = (v.sliders[t] - e.min) / (e.max - e.min);
              return (0, r.jsxs)(
                "div",
                {
                  children: [
                    (0, r.jsx)("div", {
                      className: "abs param",
                      style: { left: i.g5 - 208, top: e.top + e.height / 2 - 19 },
                      children: e.label,
                    }),
                    (0, r.jsx)(g, {
                      left: i.g5,
                      top: e.top,
                      width: i.JX,
                      height: e.height,
                      frac: a,
                      onChange: (a) => V(t, e.min + a * (e.max - e.min)),
                      scaleX: j.x,
                    }),
                  ],
                },
                e.param,
              );
            }),
            (0, r.jsxs)("div", {
              className: "abs photo",
              "data-tick": O,
              children: [
                (0, r.jsxs)("label", {
                  className: "check",
                  children: [
                    (0, r.jsx)("input", {
                      type: "checkbox",
                      checked: null == (t = null == W ? void 0 : W.autoTrim) || t,
                      disabled: !W,
                      onChange: (e) => Z(e.target.checked),
                    }),
                    "Trim the backdrop and straighten",
                  ],
                }),
                (0, r.jsxs)("div", {
                  className: "nudge",
                  children: [
                    (0, r.jsx)("span", { children: "Nudge" }),
                    (0, r.jsx)("input", {
                      type: "range",
                      min: -5,
                      max: 5,
                      step: 0.1,
                      disabled: !W || !W.autoTrim,
                      value: null != (a = null == W ? void 0 : W.nudge) ? a : 0,
                      onChange: (e) => Q(+e.target.value),
                    }),
                    (0, r.jsxs)("span", {
                      className: "val",
                      children: [
                        (null != (m = null == W ? void 0 : W.nudge) ? m : 0) > 0 ? "+" : "",
                        (null != (p = null == W ? void 0 : W.nudge) ? p : 0).toFixed(1),
                        "\xb0",
                      ],
                    }),
                  ],
                }),
                (0, r.jsx)("div", {
                  className: q ? "note busy" : "note",
                  children:
                    q === G.id
                      ? "Detecting the cloth…"
                      : (0, u.q0)(
                          null != (f = null == W ? void 0 : W.prepared) ? f : null,
                          null == (x = null == W ? void 0 : W.autoTrim) || x,
                        ),
                }),
              ],
            }),
            (0, r.jsx)("input", {
              ref: _,
              type: "file",
              accept: "image/*",
              multiple: !0,
              hidden: !0,
              onChange: (e) => void D(e.target.files),
            }),
            (0, r.jsx)("button", {
              className: "abs btn small upload",
              onClick: () => {
                var e;
                return null == (e = _.current) ? void 0 : e.click();
              },
              children: "Upload Saree",
            }),
            (0, r.jsx)("button", {
              className: "abs btn small rotate",
              onClick: X,
              title: "Rotate the selected fabric 90\xb0",
              children: "Rotate",
            }),
            (0, r.jsx)("button", { className: "abs btn small save", onClick: $, children: "Save Image" }),
            (0, r.jsx)("div", { className: "abs pill", style: { left: 1403, top: 72 } }),
            (0, r.jsx)("div", {
              className: "abs title",
              style: { left: 1428, top: 70 },
              children: "Textures",
            }),
            (0, r.jsx)("div", {
              className: "abs scroll",
              children: (0, r.jsx)("div", {
                className: "scroll-inner",
                style: { height: ea },
                children: ee.map((e, t) => {
                  var a;
                  let l = t % 2,
                    n = Math.floor(t / 2),
                    s = i.LY.marginLeft + l * (i.LY.width + i.LY.hSep),
                    u = i.LY.marginTop + n * (i.LY.height + i.LY.vSep),
                    c = t === v.textureIndex,
                    d = null != (a = v.rotations[e.id]) ? a : 0,
                    o =
                      d % 2 == 1
                        ? {
                            width: i.LY.height,
                            height: i.LY.width,
                            position: "absolute",
                            left: (i.LY.width - i.LY.height) / 2,
                            top: (i.LY.height - i.LY.width) / 2,
                            transform: "rotate(".concat(90 * d, "deg)"),
                          }
                        : { transform: "rotate(".concat(90 * d, "deg)") };
                  return (0, r.jsxs)(
                    "div",
                    {
                      className: "abs",
                      style: { left: s, top: u, width: i.LY.width, height: i.LY.height },
                      children: [
                        (0, r.jsx)("canvas", {
                          ref: c ? M : void 0,
                          className: "abs outline",
                          width: 180,
                          height: 240,
                          style: {
                            left: i.SH.left,
                            top: i.SH.top,
                            width: i.SH.width,
                            height: i.SH.height,
                            visibility: c ? "visible" : "hidden",
                          },
                        }),
                        (0, r.jsx)("div", {
                          className: "abs thumb-shadow",
                          style: { left: 8, top: 8, width: i.LY.width, height: i.LY.height },
                        }),
                        (0, r.jsx)("button", {
                          className: "abs thumb",
                          style: { left: 0, top: 0, width: i.LY.width, height: i.LY.height },
                          onClick: () => H(t),
                          title: e.id,
                          children: (0, r.jsx)("img", { src: e.thumb, alt: e.id, draggable: !1, style: o }),
                        }),
                      ],
                    },
                    e.id,
                  );
                }),
              }),
            }),
            y && (0, r.jsx)("div", { className: "status", children: y }),
          ],
        });
      }
      function g(e) {
        let t = (0, l.useRef)(null),
          a = (0, l.useRef)(!1),
          n = (e) => {
            let a = t.current.getBoundingClientRect();
            return Math.min(1, Math.max(0, (e.clientX - a.left) / a.width));
          };
        return (0, r.jsxs)("div", {
          ref: t,
          className: "abs hslider",
          style: { left: e.left, top: e.top, width: e.width, height: e.height, touchAction: "none" },
          onPointerDown: (t) => {
            (a.current = !0), t.currentTarget.setPointerCapture(t.pointerId), e.onChange(n(t));
          },
          onPointerMove: (t) => {
            a.current && e.onChange(n(t));
          },
          onPointerUp: () => {
            a.current = !1;
          },
          onPointerCancel: () => {
            a.current = !1;
          },
          children: [
            (0, r.jsx)("div", { className: "track" }),
            (0, r.jsx)("div", { className: "fill", style: { width: e.frac * (e.width - 16) } }),
            (0, r.jsx)("div", { className: "grabber", style: { left: e.frac * (e.width - 16) } }),
          ],
        });
      }
    },
    2200: (e, t, a) => {
      Promise.resolve().then(a.bind(a, 1962));
    },
    8291: () => {},
  },
  (e) => {
    e.O(0, [616, 956, 441, 255, 358], () => e((e.s = 2200))), (_N_E = e.O());
  },
]);
