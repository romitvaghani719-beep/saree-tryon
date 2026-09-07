// lib/engine.js — recovered from the compiled production bundle (module 6072).
//   m DrapeEngine — WebGL2 saree draping renderer (new m(canvas, scale))
//   c Background  — animated gradient background renderer (.ready/.render/.canvas)

import * as r from "./config.js";
import * as o from "./templates.js";
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

export { c, s as m };
