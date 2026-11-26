/* Estilo plastilina: cada pieza se pinta una sola vez en un canvas aparte (al cargar),
 * con luz suave arriba a la izquierda, sombra abajo, bordes redondeados, granitos y alguna
 * "huella digital". Durante la animacion solo se mueven esas piezas (barato para la TV). */
(function () {
  "use strict";
  var C = N.clay = {};
  var noise = null;

  function makeNoise() {
    var s = 96, c = document.createElement("canvas"); c.width = c.height = s;
    var g = c.getContext("2d"), d = g.createImageData(s, s);
    for (var i = 0; i < s * s; i++) {
      var v = 128 + (Math.random() - 0.5) * 120;
      d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    return c;
  }

  C.canvas = function (w, h) {
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    return c;
  };

  /* Crea una pieza: caja (x0,y0,x1,y1) en unidades, pivote en (0,0), U pixeles por unidad. */
  C.part = function (x0, y0, x1, y1, U, draw) {
    var c = C.canvas((x1 - x0) * U, (y1 - y0) * U), g = c.getContext("2d");
    g.scale(U, U); g.translate(-x0, -y0);
    g.lineJoin = "round"; g.lineCap = "round";
    var prevU = C._U; C._U = U;
    draw(g, U);
    C._U = prevU;
    return { c: c, x0: x0, y0: y0, w: x1 - x0, h: y1 - y0 };
  };
  /* Dibuja una pieza en el mundo: pivote en (x,y), rotacion a, escala s (unidades -> mundo). */
  C.draw = function (g, p, x, y, a, s, flip, alpha) {
    if (!p) return;
    g.save(); g.translate(x, y); if (a) g.rotate(a); if (flip) g.scale(-1, 1);
    if (alpha != null && alpha < 1) g.globalAlpha *= alpha;
    g.drawImage(p.c, p.x0 * s, p.y0 * s, p.w * s, p.h * s);
    g.restore();
  };

  /* Pinta una forma con aspecto de plastilina. path(g) traza el camino; box = [x,y,w,h]. */
  C.shape = function (g, path, color, box, o) {
    o = o || {};
    var x = box[0], y = box[1], w = box[2], h = box[3], R = Math.max(w, h);
    g.save();
    g.beginPath(); path(g); g.fillStyle = color; g.fill();
    g.clip();
    // luz
    var cx = x + w * (o.lx != null ? o.lx : 0.33), cy = y + h * (o.ly != null ? o.ly : 0.22);
    var gr = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.95);
    gr.addColorStop(0, "rgba(255,252,245," + (o.hi != null ? o.hi * 0.8 : 0.28) + ")");
    gr.addColorStop(0.35, "rgba(255,250,240,0.10)");
    gr.addColorStop(1, "rgba(255,250,240,0)");
    g.fillStyle = gr; g.fillRect(x - w, y - h, w * 3, h * 3);
    // sombra
    var sx = x + w * 0.72, sy = y + h * 1.02;
    gr = g.createRadialGradient(sx, sy, 0, sx, sy, R * 0.9);
    gr.addColorStop(0, "rgba(35,18,8," + (o.sh != null ? o.sh : 0.32) + ")");
    gr.addColorStop(1, "rgba(35,18,8,0)");
    g.fillStyle = gr; g.fillRect(x - w, y - h, w * 3, h * 3);
    // granito (textura)
    if (!noise) noise = makeNoise();
    var pat = g.createPattern(noise, "repeat");
    g.globalAlpha = o.grain != null ? o.grain : 0.035;
    g.globalCompositeOperation = "overlay";
    g.save(); var ns = 1.7 / (C._U || 1); g.scale(ns, ns); g.fillStyle = pat;
    g.fillRect((x - w) / ns, (y - h) / ns, w * 3 / ns, h * 3 / ns); g.restore();
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
    // huellas (arquitos)
    var nf = o.prints != null ? Math.min(o.prints, 0) : 0;
    for (var f = 0; f < nf; f++) {
      var px = x + w * (0.25 + Math.random() * 0.5), py = y + h * (0.3 + Math.random() * 0.5), pr = R * 0.12;
      g.strokeStyle = "rgba(60,30,10,0.05)"; g.lineWidth = R * 0.006;
      for (var r = 1; r < 5; r++) { g.beginPath(); g.arc(px, py, pr * r * 0.3, -2.4, -0.6); g.stroke(); }
    }
    // borde interior oscuro (volumen)
    g.lineWidth = Math.min(w, h) * (o.rim != null ? o.rim : 0.12) * 0.8;
    g.strokeStyle = "rgba(60,30,40,0.13)";
    g.beginPath(); path(g); g.stroke();
    g.restore();
    // contorno muy suave
    if (o.edge !== false) {
      g.save(); g.lineWidth = Math.max(Math.min(w, h) * 0.035, 2.2 / (C._U || 1)); g.strokeStyle = "rgba(70,42,48,0.55)";
      g.beginPath(); path(g); g.stroke(); g.restore();
    }
  };

  /* Formas basicas */
  C.ell = function (cx, cy, rx, ry) { return function (g) { g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); }; };
  C.rrect = function (x, y, w, h, r) {
    return function (g) {
      r = Math.min(r, w / 2, h / 2);
      g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
      g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
      g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
    };
  };
  C.poly = function (pts) {
    return function (g) { g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); };
  };
  /* Curva suave cerrada por puntos (Catmull-Rom) */
  C.blob = function (pts) {
    return function (g) {
      var n = pts.length;
      g.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
      for (var i = 0; i < n; i++) {
        var p = pts[i], q = pts[(i + 1) % n];
        g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      }
      g.closePath();
    };
  };
  C.boxOf = function (pts) {
    var a = 1e9, b = 1e9, c = -1e9, d = -1e9;
    pts.forEach(function (p) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); });
    return [a, b, c - a, d - b];
  };
  C.blobShape = function (g, pts, color, o) { C.shape(g, C.blob(pts), color, C.boxOf(pts), o); };
  C.ellShape = function (g, cx, cy, rx, ry, color, o) { C.shape(g, C.ell(cx, cy, rx, ry), color, [cx - rx, cy - ry, rx * 2, ry * 2], o); };
  C.rrShape = function (g, x, y, w, h, r, color, o) { C.shape(g, C.rrect(x, y, w, h, r), color, [x, y, w, h], o); };

  /* Sombra suave en el suelo */
  var shadowSpr = null;
  C.floorShadow = function (g, x, y, w, a) {
    if (!shadowSpr) {
      shadowSpr = C.canvas(128, 64); var s = shadowSpr.getContext("2d");
      var gr = s.createRadialGradient(64, 32, 0, 64, 32, 64);
      gr.addColorStop(0, "rgba(20,12,6,0.45)"); gr.addColorStop(0.6, "rgba(20,12,6,0.18)"); gr.addColorStop(1, "rgba(20,12,6,0)");
      s.save(); s.scale(1, 0.5); s.fillStyle = gr; s.beginPath(); s.arc(64, 64, 64, 0, Math.PI * 2); s.fill(); s.restore();
    }
    g.save(); g.globalAlpha *= (a == null ? 1 : a); g.drawImage(shadowSpr, x - w / 2, y - w * 0.14, w, w * 0.28); g.restore();
  };

  /* Brillo (para luces): sprite de gradiente radial por color */
  var glows = {};
  C.glow = function (color) {
    if (glows[color]) return glows[color];
    var c = C.canvas(64, 64), s = c.getContext("2d"), rgb = N.hex2rgb(color);
    var gr = s.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,0.95)");
    gr.addColorStop(0.18, N.rgba(rgb, 0.85));
    gr.addColorStop(0.45, N.rgba(rgb, 0.22));
    gr.addColorStop(1, N.rgba(rgb, 0));
    s.fillStyle = gr; s.fillRect(0, 0, 64, 64);
    glows[color] = c; return c;
  };
})();
