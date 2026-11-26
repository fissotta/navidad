/* El laboratorio dibujado (inspirado en la foto panoramica, sin gente, ordenado y liviano).
 * Es una franja de 9600 x 2160 unidades que se cierra sobre si misma (lab circular): el final
 * empalma con el principio. Se pinta una sola vez al cargar en trozos (canvas) y se reutiliza.
 * Los muebles del primer plano (escritorios, sillas, planta) son objetos aparte para que la
 * gente pueda pasar por detras. */
(function () {
  "use strict";
  var C = N.clay, W = 9600, H = 2160;
  var WALL_TOP = 400, FLOOR = 1500;
  var OUT = "rgba(96,74,74,0.42)";
  var items = [];
  function item(x0, x1, fn) { items.push({ x0: x0, x1: x1, draw: fn }); }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  /* ---------- pinceles ---------- */
  function rr(g, x, y, w, h, r) { C.rrect(x, y, w, h, r)(g); }
  function box(g, x, y, w, h, fill, o) {
    o = o || {};
    if (o.shadow) { g.fillStyle = "rgba(60,40,30,0.08)"; g.beginPath(); rr(g, x + o.shadow, y + o.shadow, w, h, o.r || 6); g.fill(); }
    g.beginPath(); rr(g, x, y, w, h, o.r || 6);
    if (o.grad) { var gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, o.grad[0]); gr.addColorStop(1, o.grad[1]); g.fillStyle = gr; } else g.fillStyle = fill;
    g.fill();
    if (o.stroke !== false) { g.strokeStyle = o.stroke || OUT; g.lineWidth = o.lw || 3; g.stroke(); }
  }
  function line(g, x0, y0, x1, y1, col, lw) { g.strokeStyle = col; g.lineWidth = lw || 3; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  function circle(g, x, y, r, fill, stroke) { g.beginPath(); g.arc(x, y, r, 0, 7); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = 3; g.stroke(); } }
  function glass(g, pts, liquid, lv) {   // recipiente de vidrio con liquido hasta el nivel lv (0..1)
    var ys = pts.map(function (p) { return p[1]; }), top = Math.min.apply(null, ys), bot = Math.max.apply(null, ys);
    g.save(); g.beginPath(); C.poly(pts)(g);
    g.fillStyle = "rgba(225,240,248,0.75)"; g.fill(); g.clip();
    if (liquid) { g.fillStyle = liquid; g.fillRect(-1e5, bot - (bot - top) * lv, 2e5, 1e4); }
    g.fillStyle = "rgba(255,255,255,0.55)"; g.fillRect(Math.min.apply(null, pts.map(function (p) { return p[0]; })) + 6, top, 6, bot - top);
    g.restore();
    g.strokeStyle = "rgba(110,130,145,0.7)"; g.lineWidth = 2.5; g.beginPath(); C.poly(pts)(g); g.stroke();
  }
  function bottle(g, x, by, w, h, cap, liq, lv) {
    var n = w * 0.36, sh = h * 0.22;
    glass(g, [[x - n / 2, by - h], [x + n / 2, by - h], [x + n / 2, by - h + sh * 0.5], [x + w / 2, by - h + sh], [x + w / 2, by], [x - w / 2, by], [x - w / 2, by - h + sh], [x - n / 2, by - h + sh * 0.5]], liq, lv);
    box(g, x - n * 0.62, by - h - h * 0.1, n * 1.24, h * 0.12, cap, { r: 3, lw: 2 });
  }
  function erlen(g, x, by, w, h, liq, foil) {
    var n = w * 0.22;
    glass(g, [[x - n / 2, by - h], [x + n / 2, by - h], [x + n / 2, by - h * 0.62], [x + w / 2, by], [x - w / 2, by], [x - n / 2, by - h * 0.62]], liq, 0.28);
    if (foil) { g.fillStyle = "#d9dde2"; g.beginPath(); C.blob([[x - n * 0.8, by - h + 2], [x - n * 0.4, by - h - h * 0.14], [x + n * 0.5, by - h - h * 0.12], [x + n * 0.8, by - h + 4], [x, by - h + h * 0.06]])(g); g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke(); }
  }
  function jar(g, x, by, w, h, lid, label) {
    box(g, x - w / 2, by - h, w, h, "#fbfbf8", { r: 5, lw: 2 });
    box(g, x - w / 2 - 2, by - h - h * 0.18, w + 4, h * 0.2, lid, { r: 3, lw: 2 });
    if (label) { g.fillStyle = label; g.fillRect(x - w / 2 + 4, by - h * 0.62, w - 8, h * 0.3); }
  }
  function shelfBoard(g, x0, x1, y) {
    g.fillStyle = "rgba(60,40,30,0.07)"; g.fillRect(x0, y + 14, x1 - x0, 22);
    box(g, x0, y, x1 - x0, 16, "#fbfaf6", { r: 3, lw: 2.5 });
  }
  function fillShelf(g, r, x0, x1, y, kinds) {   // llena una repisa con frascos/botellas
    var x = x0 + 20;
    while (x < x1 - 40) {
      var k = kinds[Math.floor(r() * kinds.length)], w;
      if (k === "bottle") { w = 40 + r() * 30; bottle(g, x + w / 2, y, w, 70 + r() * 70, r() < 0.7 ? "#2f6fc0" : "#e07a2a", r() < 0.5 ? N.pick(["rgba(120,190,230,0.5)", "rgba(240,210,90,0.5)", "rgba(200,120,170,0.45)"]) : null, 0.3 + r() * 0.5); }
      else if (k === "jar") { w = 34 + r() * 18; jar(g, x + w / 2, y, w, 50 + r() * 30, ["#2b2b2b", "#f2f2ee", "#c23a3a", "#3a6fc2"][Math.floor(r() * 4)], ["#e8c55a", "#7fb6e0", "#e07a7a", "#9ad08a", null][Math.floor(r() * 5)]); }
      else if (k === "box") { w = 60 + r() * 60; box(g, x, y - 50 - r() * 40, w, 0, "#fff", { stroke: false }); var bh = 50 + r() * 50; box(g, x, y - bh, w, bh, ["#e9d8b8", "#cfe0f0", "#f0d0d0", "#fbfaf6"][Math.floor(r() * 4)], { r: 4, lw: 2 }); }
      else if (k === "binder") { w = 26; box(g, x, y - 110, w, 110, ["#3a6fc2", "#c23a3a", "#3a9a5a", "#e0a030", "#7a4ab0"][Math.floor(r() * 5)], { r: 3, lw: 2 }); }
      else if (k === "erlen") { w = 60 + r() * 30; erlen(g, x + w / 2, y, w, w * 1.3, r() < 0.5 ? "rgba(240,210,90,0.5)" : null, r() < 0.5); }
      else w = 30;
      x += w + 8 + r() * 26;
    }
  }
  function bench(g, x0, x1, top) {   // meson blanco con cajoneras
    g.fillStyle = "rgba(60,40,30,0.10)"; g.fillRect(x0 + 10, FLOOR - 6, x1 - x0, 30);
    box(g, x0, top + 24, x1 - x0, FLOOR - top - 24, "#f3f1ec", { r: 4, grad: ["#f6f4ef", "#e6e2da"] });
    var n = Math.max(2, Math.round((x1 - x0) / 330));
    for (var i = 0; i < n; i++) {
      var cx = x0 + (i + 0.5) * (x1 - x0) / n, cw = (x1 - x0) / n - 40;
      if (i % 3 === 1) { g.fillStyle = "rgba(80,70,70,0.10)"; g.fillRect(cx - cw / 2, top + 44, cw, FLOOR - top - 60); continue; }
      for (var d = 0; d < 3; d++) {
        var dy = top + 44 + d * (FLOOR - top - 60) / 3;
        box(g, cx - cw / 2, dy, cw, (FLOOR - top - 60) / 3 - 10, "#fbfaf7", { r: 4, lw: 2 });
        box(g, cx - 34, dy + 18, 68, 9, "#b8b0a8", { r: 4, lw: 1.5 });
      }
    }
    box(g, x0 - 10, top, x1 - x0 + 20, 28, "#ffffff", { r: 5, grad: ["#ffffff", "#ecebe6"] });
  }
  function poster(g, x, y, w, h) {
    box(g, x, y, w, h, "#fbfbf8", { r: 4, shadow: 8 });
    box(g, x + 16, y + 16, w - 32, h * 0.12, "#e8eef5", { r: 3, lw: 1.5 });
    g.fillStyle = "#3a4a6a"; g.fillRect(x + 30, y + 30, w * 0.6, 12); g.fillRect(x + 30, y + 50, w * 0.4, 8);
    var cols = ["#e07a5f", "#f2cc8f", "#81b29a", "#3d85c6", "#b07ac4"];
    for (var i = 0; i < 9; i++) { g.fillStyle = cols[i % 5]; g.fillRect(x + 30 + i * (w - 60) / 9, y + h * 0.55 - (20 + (i * 37 % 90)), (w - 60) / 9 - 8, 20 + (i * 37 % 90)); }
    for (i = 0; i < 4; i++) { g.fillStyle = cols[i]; g.beginPath(); g.arc(x + w * 0.3 + i * 40, y + h * 0.27, 14, 0, 7); g.fill(); }
    g.fillStyle = "#c9ccd2"; for (i = 0; i < 12; i++) g.fillRect(x + 30, y + h * 0.62 + i * 22, (w - 60) * (0.5 + (i * 13 % 10) / 20), 7);
  }
  function chairBack(g, x, y, w, h, col) {   // respaldo de silla (fondo)
    box(g, x - w / 2, y, w, h, col, { r: w * 0.3, grad: [N.shade(col, 0.15), col] });
  }

  /* ---------- la escena ---------- */
  function build() {
    items = [];
    var r = rng(7);
    // cielo raso, pared y piso (todo el ancho, en trozos)
    item(-50, W + 50, function (g, x0, x1) {
      g.fillStyle = "#ebe7e1"; g.fillRect(x0, 0, x1 - x0, WALL_TOP);
      for (var x = Math.floor(x0 / 240) * 240; x < x1; x += 240) line(g, x, 0, x, WALL_TOP, "rgba(150,140,130,0.22)", 3);
      [110, 220, 315].forEach(function (y) { line(g, x0, y, x1, y, "rgba(150,140,130,0.22)", 3); });
      for (x = Math.floor(x0 / 1200) * 1200 + 300; x < x1; x += 1200) {
        var gr = g.createRadialGradient(x + 120, 165, 10, x + 120, 165, 320); gr.addColorStop(0, "rgba(255,253,240,0.8)"); gr.addColorStop(1, "rgba(255,253,240,0)");
        g.fillStyle = gr; g.fillRect(x - 220, 0, 680, WALL_TOP);
        box(g, x, 130, 240, 70, "#fffef8", { r: 4, lw: 2, stroke: "rgba(160,150,140,0.5)" });
      }
      var wg = g.createLinearGradient(0, WALL_TOP, 0, FLOOR); wg.addColorStop(0, "#f6f2eb"); wg.addColorStop(1, "#eee8de");
      g.fillStyle = wg; g.fillRect(x0, WALL_TOP, x1 - x0, FLOOR - WALL_TOP);
      g.fillStyle = "#d9d3c9"; g.fillRect(x0, WALL_TOP - 6, x1 - x0, 16);
      var fg = g.createLinearGradient(0, FLOOR, 0, H); fg.addColorStop(0, "#d8d0c4"); fg.addColorStop(1, "#c9c0b2");
      g.fillStyle = fg; g.fillRect(x0, FLOOR, x1 - x0, H - FLOOR);
      [1580, 1690, 1830, 2010].forEach(function (y) { line(g, x0, y, x1, y, "rgba(140,125,110,0.12)", 3); });
      g.fillStyle = "#cfc8bd"; g.fillRect(x0, FLOOR - 14, x1 - x0, 18);
    });
    // esquinas suaves entre secciones (sensacion de sala circular)
    [1400, 3600, 4700, 6200, 8000, 9600].forEach(function (cx) {
      item(cx - 120, cx + 120, function (g) {
        var gr = g.createLinearGradient(cx - 120, 0, cx + 120, 0);
        gr.addColorStop(0, "rgba(120,100,90,0)"); gr.addColorStop(0.5, "rgba(120,100,90,0.07)"); gr.addColorStop(1, "rgba(120,100,90,0)");
        g.fillStyle = gr; g.fillRect(cx - 120, WALL_TOP, 240, FLOOR - WALL_TOP);
        line(g, cx, WALL_TOP + 10, cx, FLOOR - 14, "rgba(150,135,125,0.18)", 3);
      });
    });


    /* decoracion navidena: guirnalda de pino, banderines y copos de papel */
    item(-50, W + 50, function (g, x0, x1) {
      var hooks = 700;
      for (var hx = Math.floor(x0 / hooks) * hooks; hx < x1 + hooks; hx += hooks) {
        for (var t = 0; t <= 1.0001; t += 0.05) {
          var x = hx + t * hooks, y = 430 + Math.sin(Math.PI * t) * 55;
          g.fillStyle = (Math.round(t * 20) % 2) ? "#3f8a4a" : "#4f9d58";
          g.beginPath(); g.ellipse(x, y, 30, 17, (t - 0.5) * 0.6, 0, 7); g.fill();
          g.fillStyle = "#357a40"; g.beginPath(); g.ellipse(x + 10, y + 6, 18, 10, 0.4, 0, 7); g.fill();
        }
        // mono rojo en cada gancho
        g.fillStyle = "#c8262e"; g.beginPath(); g.ellipse(hx - 22, 428, 22, 13, -0.4, 0, 7); g.ellipse(hx + 22, 428, 22, 13, 0.4, 0, 7); g.fill();
        g.beginPath(); g.moveTo(hx - 6, 432); g.lineTo(hx - 20, 470); g.lineTo(hx - 8, 466); g.closePath(); g.moveTo(hx + 6, 432); g.lineTo(hx + 20, 470); g.lineTo(hx + 8, 466); g.closePath(); g.fill();
        g.fillStyle = "#a81e26"; g.beginPath(); g.arc(hx, 430, 10, 0, 7); g.fill();
        g.fillStyle = "#f2c94c"; g.beginPath(); g.arc(hx + 350, 482, 9, 0, 7); g.fill();
      }
    });
    function bunting(x0, x1, y, text) {
      item(x0 - 20, x1 + 20, function (g) {
        var n = text.length, w = (x1 - x0) / n, cols = ["#c8262e", "#3f8a4a", "#e0a82e"];
        g.strokeStyle = "rgba(90,70,60,0.6)"; g.lineWidth = 3; g.beginPath();
        for (var i = 0; i <= n; i++) { var xx = x0 + i * w, yy = y + Math.sin(Math.PI * i / n) * 40; if (!i) g.moveTo(xx, yy); else g.lineTo(xx, yy); } g.stroke();
        for (i = 0; i < n; i++) {
          var a = x0 + i * w, b = a + w, ya = y + Math.sin(Math.PI * i / n) * 40, yb = y + Math.sin(Math.PI * (i + 1) / n) * 40, ym = (ya + yb) / 2;
          if (text[i] === " ") continue;
          g.fillStyle = cols[i % 3]; g.beginPath(); g.moveTo(a + 4, ya); g.lineTo(b - 4, yb); g.lineTo((a + b) / 2, ym + w * 1.05); g.closePath(); g.fill();
          g.strokeStyle = "rgba(90,60,50,0.35)"; g.lineWidth = 2; g.stroke();
          g.fillStyle = "#fff8ea"; g.font = "bold " + Math.round(w * 0.5) + "px 'Trebuchet MS', sans-serif"; g.textAlign = "center"; g.fillText(text[i], (a + b) / 2, ym + w * 0.48);
        }
      });
    }
    bunting(1750, 3250, 520, "FELIZ NAVIDAD");
    bunting(6500, 7250, 520, "LAB 2026");
    function flakes(x0, x1, n, seed) {
      item(x0 - 60, x1 + 60, function (g) {
        var rf = rng(seed);
        for (var i = 0; i < n; i++) {
          var x = x0 + (i + 0.5) * (x1 - x0) / n + (rf() - 0.5) * 60, len = 60 + rf() * 140, y = 330 + len, R = 26 + rf() * 16;
          g.strokeStyle = "rgba(150,150,160,0.6)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 330); g.lineTo(x, y - R); g.stroke();
          g.strokeStyle = i % 3 === 2 ? "#f2c94c" : "#ffffff"; g.lineWidth = 6; g.lineCap = "round";
          for (var k = 0; k < 6; k++) {
            var a = k * Math.PI / 3, ex = x + Math.cos(a) * R, ey = y + Math.sin(a) * R;
            g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.stroke();
            g.beginPath(); g.moveTo(x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.55); g.lineTo(x + Math.cos(a + 0.5) * R * 0.8, y + Math.sin(a + 0.5) * R * 0.8); g.stroke();
          }
          g.strokeStyle = "rgba(120,120,140,0.35)"; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 5, 0, 7); g.stroke();
        }
      });
    }
    flakes(400, 1300, 4, 3); flakes(4800, 6100, 5, 5); flakes(8100, 8800, 3, 9);

    /* A: TV, poster Copahue, puerta (0 - 1400) */
    item(60, 1400, function (g) {
      // mesita con planta
      box(g, 40, 1210, 200, 24, "#fbfaf6", { r: 4 }); line(g, 70, 1234, 70, FLOOR, OUT, 6); line(g, 210, 1234, 210, FLOOR, OUT, 6);
      box(g, 110, 1130, 70, 80, "#d98a5a", { r: 8 });
      [[-50, -90], [0, -120], [45, -85], [-20, -60], [30, -55]].forEach(function (p) { C.ellShape(g, 145 + p[0] * 0.6, 1130 + p[1] * 0.6, 34, 18, "#5aa060", { prints: 0 }); });
      // poster Copahue
      box(g, 150, 770, 180, 240, "#2c4a78", { r: 4, shadow: 8 });
      var sk = g.createLinearGradient(0, 790, 0, 990); sk.addColorStop(0, "#8cc8f0"); sk.addColorStop(1, "#d8eefa"); g.fillStyle = sk; g.fillRect(165, 830, 150, 165);
      g.fillStyle = "#6a5a6a"; g.beginPath(); g.moveTo(165, 995); g.lineTo(240, 880); g.lineTo(315, 995); g.fill();
      g.fillStyle = "#fbfbf8"; g.beginPath(); g.moveTo(222, 907); g.lineTo(240, 880); g.lineTo(258, 907); g.lineTo(248, 900); g.lineTo(240, 910); g.lineTo(232, 900); g.fill();
      g.fillStyle = "rgba(255,255,255,0.7)"; g.beginPath(); g.arc(250, 865, 12, 0, 7); g.arc(262, 850, 9, 0, 7); g.fill();
      g.fillStyle = "#fff"; g.font = "bold 22px 'Trebuchet MS', sans-serif"; g.textAlign = "center"; g.fillText("COPAHUE", 240, 800); g.font = "15px 'Trebuchet MS', sans-serif"; g.fillText("extremo", 240, 820);
      // TV
      box(g, 370, 750, 500, 300, "#1f2328", { r: 10, shadow: 10 });
      box(g, 385, 765, 470, 270, "#2b3038", { r: 4, stroke: false });
      g.fillStyle = "rgba(255,255,255,0.05)"; g.beginPath(); g.moveTo(385, 765); g.lineTo(560, 765); g.lineTo(385, 900); g.fill();
      box(g, 450, 1080, 340, 18, "#fbfaf6", { r: 4 });
      [470, 500, 530].forEach(function (x, i) { box(g, x, 1066, 20, 14, ["#3a6fc2", "#c23a3a", "#2b2b2b"][i], { r: 3, lw: 1.5 }); });
      // alfombra
      g.fillStyle = "#b9b4ae"; g.beginPath(); rr(g, 260, 1525, 720, 90, 10); g.fill();
      g.strokeStyle = "rgba(255,255,255,0.25)"; g.lineWidth = 6; for (var x = 290; x < 960; x += 40) line(g, x, 1530, x, 1610, "rgba(255,255,255,0.2)", 6);
      // puerta con corona navidena
      box(g, 1010, 760, 290, 745, "#e9e5de", { r: 4 });
      box(g, 1030, 780, 250, 725, "#c99460", { r: 4, grad: ["#d4a06c", "#b98450"] });
      box(g, 1100, 830, 110, 140, "#cfe6f2", { r: 6 });
      circle(g, 1250, 1160, 13, "#d8c070", OUT);
      g.save(); g.lineWidth = 24; g.strokeStyle = "#3f8a4a"; g.beginPath(); g.arc(1155, 1070, 62, 0, 7); g.stroke(); g.restore();
      for (var a = 0; a < 10; a++) circle(g, 1155 + Math.cos(a * 0.63) * 62, 1070 + Math.sin(a * 0.63) * 62, 8, a % 2 ? "#d0242c" : "#f2c94c");
      C.ellShape(g, 1135, 1135, 22, 14, "#d0242c", { prints: 0 }); C.ellShape(g, 1175, 1135, 22, 14, "#d0242c", { prints: 0 });
      box(g, 1105, 990, 100, 40, "#fbfaf6", { r: 4, lw: 2 }); g.fillStyle = "#3a3a3a"; g.font = "bold 22px sans-serif"; g.textAlign = "center"; g.fillText("LAB", 1155, 1018);
    });

    /* B: meson largo con repisas y matraces grandes (1400 - 3600) */
    item(1400, 3600, function (g) {
      var rb = rng(11);
      shelfBoard(g, 1450, 3550, 750); shelfBoard(g, 1450, 3550, 940);
      // soportes
      [1450, 2150, 2850, 3534].forEach(function (x) { box(g, x, 740, 16, 380, "#f3f1ec", { r: 3, lw: 2 }); });
      fillShelf(g, rb, 1460, 2050, 750, ["bottle", "bottle", "jar", "box"]);
      fillShelf(g, rb, 2780, 3540, 750, ["bottle", "jar", "box", "binder"]);
      fillShelf(g, rb, 1460, 3540, 940, ["bottle", "jar", "jar", "bottle", "box"]);
      // matraces grandes (los que burbujean)
      N.LAB.flasks.forEach(function (f) { erlen(g, f[0], f[1], f[2], f[2] * 1.45, null, true); });
      bench(g, 1420, 3580, 1150);
      // cosas sobre el meson
      var y = 1150;
      box(g, 1560, y - 70, 120, 70, "#3a7fc8", { r: 8 }); box(g, 1580, y - 60, 60, 30, "#cfe8ff", { r: 3, lw: 1.5 });
      [1760, 1800, 1840].forEach(function (x) { line(g, x, y, x, y - 140, "#7a7a80", 5); });
      box(g, 1730, y - 24, 140, 24, "#e8e8ea", { r: 4 });
      [[1750, "#f0d44a"], [1790, "#3a77c8"], [1830, "#e8e8ea"]].forEach(function (p) { box(g, p[0] - 8, y - 150, 16, 70, p[1], { r: 5, lw: 1.5 }); });
      box(g, 2000, y - 46, 160, 46, "#f07a2a", { r: 5 }); for (var i = 0; i < 6; i++) box(g, 2012 + i * 24, y - 78, 16, 40, "rgba(230,240,248,0.9)", { r: 3, lw: 1.5 });
      box(g, 2330, y - 55, 100, 55, "#f0d44a", { r: 5 }); box(g, 2450, y - 55, 100, 55, "#3a77c8", { r: 5 });
      bottle(g, 2700, y, 70, 140, "#2f6fc0", "rgba(120,190,230,0.45)", 0.6);
      box(g, 2900, y - 90, 110, 90, "#e2e4e8", { r: 10 }); circle(g, 2955, y - 55, 26, "#c9ccd2", OUT);
      erlen(g, 3150, y, 80, 100, "rgba(200,120,170,0.45)", false);
      box(g, 3300, y - 40, 150, 40, "#fbfaf6", { r: 4 }); g.fillStyle = "#9aa0a8"; for (i = 0; i < 4; i++) g.fillRect(3315, y - 34 + i * 8, 110, 3);
    });

    /* C: refrigerador vidriado, reactivos y percha con delantales (3600 - 4700) */
    item(3600, 4700, function (g) {
      var rc = rng(23);
      box(g, 3690, 590, 370, 915, "#dfe3e8", { r: 10, shadow: 10, grad: ["#e8ebef", "#d2d7de"] });
      box(g, 3715, 620, 320, 760, "#cfe4ee", { r: 6, grad: ["#e0f0f7", "#c3dce8"] });
      for (var s = 0; s < 4; s++) { var sy = 790 + s * 170; line(g, 3720, sy, 4030, sy, "rgba(120,150,170,0.6)", 4); fillShelf(g, rc, 3720, 4030, sy, ["bottle", "jar", "bottle"]); }
      g.fillStyle = "rgba(255,255,255,0.25)"; g.beginPath(); g.moveTo(3730, 630); g.lineTo(3830, 630); g.lineTo(3730, 900); g.fill();
      box(g, 4020, 950, 14, 140, "#9aa0a8", { r: 6, lw: 2 });
      box(g, 3715, 1400, 320, 80, "#c8ccd2", { r: 4 });
      // repisa de reactivos
      shelfBoard(g, 4120, 4660, 720); shelfBoard(g, 4120, 4660, 900);
      fillShelf(g, rc, 4130, 4650, 720, ["jar", "jar", "jar", "bottle"]); fillShelf(g, rc, 4130, 4650, 900, ["jar", "binder", "jar"]);
      // percha con delantales
      box(g, 4180, 1000, 420, 22, "#2b2b2b", { r: 6 });
      [4230, 4330, 4440, 4540].forEach(function (x, i) {
        line(g, x, 1010, x, 1045, "#444", 5);
        C.blobShape(g, [[x - 55, 1045], [x, 1035], [x + 55, 1045], [x + 70, 1380 + i * 12], [x - 70, 1380 + i * 12]], "#f6f5f1", { prints: 0, hi: 0.15 });
        line(g, x, 1045, x, 1370, "rgba(120,110,110,0.35)", 3);
      });
      bench(g, 4120, 4660, 1300);
    });

    /* D: ventanal con palmera y persianas (4700 - 6200) */
    item(4700, 6200, function (g) {
      box(g, 4780, 500, 1340, 840, "#e9e6e0", { r: 6 });
      // afuera
      var sk = g.createLinearGradient(0, 540, 0, 1310); sk.addColorStop(0, "#9fd4ef"); sk.addColorStop(1, "#e4f4fb");
      g.fillStyle = sk; g.fillRect(4810, 530, 1280, 780);
      box(g, 4900, 700, 420, 610, "#b8d8d0", { r: 4, lw: 2, stroke: "rgba(90,120,120,0.4)" });
      for (var y = 740; y < 1300; y += 60) line(g, 4900, y, 5320, y, "rgba(90,130,130,0.35)", 3);
      box(g, 5600, 760, 400, 550, "#c4dcd6", { r: 4, lw: 2, stroke: "rgba(90,120,120,0.4)" });
      // palmera
      box(g, 5085, 1000, 34, 310, "#a87a4a", { r: 14 });
      [[-1.2, 160], [-0.6, 180], [0, 150], [0.6, 180], [1.2, 160], [2.6, 140], [-2.6, 140]].forEach(function (p) {
        g.save(); g.translate(5102, 1000); g.rotate(p[0] * 0.55 - Math.PI / 2 + Math.PI / 2); C.ellShape(g, p[1] * 0.5 * Math.sin(p[0] * 0.6), -40 + Math.abs(p[0]) * 20, p[1] * 0.55, 30, "#5aa65a", { prints: 0 }); g.restore();
      });
      g.fillStyle = "#86c06a"; g.beginPath(); g.ellipse(5200, 1320, 420, 40, 0, Math.PI, 0); g.fill();
      // marcos
      [4810, 5250, 5670, 6090].forEach(function (x) { box(g, x - 12, 530, 24, 790, "#f4f2ee", { r: 3, lw: 2 }); });
      box(g, 4800, 520, 1310, 24, "#f4f2ee", { r: 3, lw: 2 });
      // persianas a medio bajar en los dos paneles de la derecha
      [[5262, 5658, 1150], [5682, 6078, 980]].forEach(function (p) {
        g.fillStyle = "rgba(245,236,205,0.88)"; g.fillRect(p[0], 545, p[1] - p[0], p[2] - 545);
        for (var yy = 575; yy < p[2]; yy += 34) line(g, p[0], yy, p[1], yy, "rgba(180,165,130,0.35)", 3);
        box(g, p[0], p[2] - 14, p[1] - p[0], 16, "#e8dcb8", { r: 3, lw: 2 });
      });
      // alfeizar y mueble bajo
      box(g, 4770, 1310, 1360, 34, "#fbfaf6", { r: 5 });
      box(g, 4800, 1344, 1300, 160, "#f0eee9", { r: 4, grad: ["#f4f2ee", "#e2ded6"] });
      for (var x = 4850; x < 6050; x += 60) line(g, x, 1360, x, 1490, "rgba(150,140,130,0.25)", 3);
      // macetas en el alfeizar
      [[4900, "#d98a5a"], [5980, "#6a9ad0"]].forEach(function (p) { box(g, p[0] - 40, 1240, 80, 70, p[1], { r: 8 }); for (var k = 0; k < 6; k++) C.ellShape(g, p[0] + Math.cos(k) * 30, 1220 - Math.abs(Math.sin(k)) * 40, 24, 14, "#4f9a5a", { prints: 0 }); });
    });

    /* E: bioinformatica: pizarra, sillas (escritorios = primer plano aparte) (6200 - 8000) */
    item(6200, 8000, function (g) {
      box(g, 6400, 620, 900, 380, "#fdfdfb", { r: 8, shadow: 8 });
      g.strokeStyle = "#3a6fc2"; g.lineWidth = 5;
      // arbol filogenetico dibujado en la pizarra
      var tx = 6460, ty = 700;
      [[0, 0], [0, 60], [40, 60], [40, 120], [80, 120], [80, 180], [120, 180], [120, 240]].reduce(function (a, b) { line(g, tx + a[0] * 2, ty + a[1], tx + b[0] * 2, ty + b[1], "#3a6fc2", 5); return b; });
      [0, 60, 120, 180, 240].forEach(function (yy, i) { line(g, tx + (i * 40) * 2, ty + yy, tx + 320, ty + yy, "#3a6fc2", 4); });
      g.fillStyle = "#c23a3a"; g.font = "italic 26px Georgia, serif"; g.textAlign = "left";
      ["Acidithiobacillus", "Fervidacidithiobacillus", "Igneacidithiobacillus", "Ambacidithiobacillus", "Thermithiobacillus"].forEach(function (n, i) { g.fillText(n, tx + 330, ty + 8 + i * 60); });
      g.fillStyle = "#2a8a4a"; g.font = "bold 30px monospace"; g.fillText("ATGCGTTAGC…", 7020, 720); g.fillText("pH 2 :)", 7020, 790);
      [[7080, 860, "#f7e27a"], [7160, 880, "#f7a8c8"], [7230, 855, "#a8e0f7"]].forEach(function (p) { box(g, p[0], p[1], 64, 64, p[2], { r: 3, lw: 1.5 }); });
      box(g, 6420, 990, 860, 14, "#d8d4ce", { r: 4, lw: 2 });
      // respaldos de sillas detras de los escritorios
      N.LAB.desksList.forEach(function (d) { chairBack(g, d.x, 1060, 250, 260, d.chair || "#2b2d33"); });
      // estante bajo con libros
      box(g, 7700, 1100, 260, 400, "#f6f4ef", { r: 4 });
      var rbk = rng(31); fillShelf(g, rbk, 7705, 7955, 1230, ["binder", "binder", "binder"]); shelfBoard(g, 7705, 7955, 1230);
      fillShelf(g, rbk, 7705, 7955, 1380, ["binder", "binder", "box"]); shelfBoard(g, 7705, 7955, 1380);
    });

    /* F: repisa de peluches, poster cientifico y meson 2 (8000 - 9600) */
    item(8000, 9600, function (g) {
      var rf = rng(41);
      // mueble blanco (las cajas de los peluches van encima, las dibuja plush.js)
      box(g, 8090, 790, 740, 715, "#f8f7f3", { r: 5, shadow: 8, grad: ["#fbfaf7", "#ebe8e1"] });
      for (var c = 0; c < 3; c++) for (var rw = 0; rw < 3; rw++) {
        var cx = 8110 + c * 240, cy = 810 + rw * 230;
        box(g, cx, cy, 220, 210, "#eeebe5", { r: 4, lw: 2 });
        if ((c + rw) % 2 === 0) fillShelf(g, rf, cx + 4, cx + 216, cy + 206, ["binder", "box", "binder"]);
      }
      C.ellShape(g, 8460, 1270, 60, 60, "#bfe6d8", { prints: 0 }); circle(g, 8460, 1270, 20, "#8fc8b8", OUT);
      // poster grande
      poster(g, 8920, 500, 420, 560);
      // meson 2 con equipos
      bench(g, 8880, 9560, 1150);
      var y = 1150;
      box(g, 8930, y - 110, 200, 110, "#e8e8ea", { r: 10 }); box(g, 8950, y - 95, 90, 40, "#2b3038", { r: 4, lw: 2 }); g.fillStyle = "#7fe08a"; g.font = "bold 22px monospace"; g.fillText("95°C", 8957, y - 66);
      box(g, 9180, y - 80, 130, 80, "#cfd3d8", { r: 30 }); circle(g, 9245, y - 50, 22, "#9aa0a8", OUT);
      box(g, 9360, y - 140, 150, 140, "#fbfaf6", { r: 6 }); box(g, 9380, y - 120, 110, 60, "#ffe8a8", { r: 30, lw: 2 });
      g.fillStyle = "#fff"; g.fillRect(8880, 1150 - 2, 0, 0);
    });
  }

  /* ---------- muebles de primer plano (objetos con profundidad) ---------- */
  function fgSprite(w, h, k, fn) {
    var c = C.canvas(w * k, h * k), g = c.getContext("2d"); g.scale(k, k); g.lineJoin = "round"; g.lineCap = "round";
    var pu = C._U; C._U = k; fn(g); C._U = pu; return c;
  }
  N.buildForeground = function (k) {
    var L = N.LAB, list = [];
    // escritorios de bioinfo con monitores (z: delante de quienes estan sentados)
    L.deskTables.forEach(function (t) {
      var w = t.x1 - t.x0 + 40, h = 560;
      var c = fgSprite(w, h, k, function (g) {
        var ox = 20, top = 300;
        g.fillStyle = "rgba(40,30,30,0.12)"; g.fillRect(ox + 10, h - 26, w - 60, 24);
        // monitores: la mayoria de espaldas (miran a quienes estan sentados), uno de lado y uno de frente
        t.monitors.forEach(function (m) {
          var x = m.x - t.x0 + ox, bot = top - 34, mw = 160, mh = 110;
          box(g, x - 12, bot - 4, 24, 40, "#2b2d33", { r: 4, lw: 2 });
          box(g, x - 46, top - 10, 92, 12, "#2b2d33", { r: 5, lw: 2 });
          if (m.k === "back") {
            box(g, x - mw / 2, bot - mh, mw, mh, "#2a2c32", { r: 10, grad: ["#3a3d45", "#24262b"] });
            box(g, x - 34, bot - mh * 0.62, 68, 44, "#33363e", { r: 8, lw: 1.5 });
            circle(g, x, bot - mh * 0.4, 6, "#4a4e58");
          } else if (m.k === "side") {
            var d = m.dir || 1;
            g.fillStyle = "#2a2c32"; g.beginPath(); g.moveTo(x - 14, bot - mh); g.lineTo(x + 14, bot - mh + 8); g.lineTo(x + 14, bot - 6); g.lineTo(x - 14, bot); g.closePath(); g.fill();
            g.strokeStyle = OUT; g.lineWidth = 2.5; g.stroke();
            line(g, x + d * 15, bot - mh + 10, x + d * 15, bot - 8, "rgba(140,200,255,0.85)", 4);
          } else {
            box(g, x - mw / 2, bot - mh, mw, mh, "#26282e", { r: 8 });
            var sx = x - mw / 2 + 9, sy = bot - mh + 9, sw = mw - 18, shh = mh - 18;
            g.fillStyle = "#1c2330"; g.fillRect(sx, sy, sw, shh);
            for (var j = 0; j < 7; j++) { g.fillStyle = ["#7fe08a", "#8cc8f0", "#f2c94c", "#d0d6e0"][j % 4]; g.fillRect(sx + 8 + (j % 3) * 7, sy + 8 + j * 12, 30 + ((j * 37) % 70), 5); }
          }
        });
        // cubierta y panel frontal (tapa las piernas de quienes estan sentados)
        box(g, ox, top, w - 40, 34, "#cfd2d6", { r: 6, grad: ["#e6e8eb", "#c6cad0"] });
        box(g, ox + 14, top + 32, w - 68, h - top - 46, "#c3c7cd", { r: 6, grad: ["#ccd0d6", "#b4b9c0"] });
        for (var px = ox + 14 + (w - 68) / 3; px < w - 60; px += (w - 68) / 3) line(g, px, top + 44, px, h - 22, "rgba(120,125,135,0.35)", 3);
        box(g, w / 2 - 30, top - 30, 40, 34, "#e85a5a", { r: 6, lw: 2 });
      });
      list.push({ c: c, x: t.x0 - 20, y: L.deskTop - 300, w: w, h: h, z: L.deskZ });
    });
    // sillas, planta y piso de primer plano
    var chair = function (col, seat) {
      return fgSprite(340, 520, k, function (g) {
        box(g, 60, 0, 220, 260, col, { r: 60, grad: [N.shade(col, 0.18), col] });
        box(g, 40, 250, 260, 60, seat || col, { r: 26 });
        box(g, 158, 310, 24, 130, "#3a3a40", { r: 8 });
        [[-120, 40], [120, 40], [-60, 60], [60, 60]].forEach(function (p) { line(g, 170, 440, 170 + p[0], 440 + p[1] * 0.6, "#3a3a40", 14); circle(g, 170 + p[0], 450 + p[1] * 0.6 + 10, 14, "#2a2a2e"); });
      });
    };
    var plant = fgSprite(760, 640, k, function (g) {
      g.translate(200, 20);
      for (var i = 0; i < 14; i++) { var a = -Math.PI / 2 + (i - 7) * 0.2; g.save(); g.translate(180, 420); g.rotate(a + Math.PI / 2); C.ellShape(g, 0, -150 - (i % 3) * 40, 40, 150, i % 2 ? "#4f9a5a" : "#64b06a", { prints: 0 }); g.restore(); }
      box(g, 90, 400, 180, 200, "#d98a5a", { r: 16, grad: ["#e39a6a", "#c97a4a"] });
      // adornos navidenos en la planta
      [[120, 280, "#d0242c"], [230, 240, "#f2c94c"], [180, 180, "#3a6fc2"], [140, 340, "#f2c94c"], [250, 330, "#d0242c"]].forEach(function (p) { C.ellShape(g, p[0], p[1], 16, 16, p[2], { prints: 0, hi: 0.6 }); });
    });
    [{ c: chair("#b8323a", "#a52a32"), x: 2350, y: 1620, w: 340, h: 520, z: 2140 },
      { c: chair("#2b2d33"), x: 5480, y: 1600, w: 340, h: 520, z: 2120 },
      { c: chair("#33353c", "#3a3c44"), x: 7020, y: 1660, w: 380, h: 580, z: 2240 },
      { c: plant, x: 4360, y: 1400, w: 760, h: 640, z: 2040 }].forEach(function (o) { list.push(o); });
    list.forEach(function (o) {
      N.add({ scene: "lab", static: true, z: o.z, fg: true, draw: function (g) { g.drawImage(o.c, o.x, o.y, o.w, o.h); } });
    });
  };

  /* Pinta la franja en trozos */
  N.buildLabArt = function (k, onProg) {
    build();
    var TW = 1200, tiles = [], n = Math.ceil(W / TW), i = 0;
    return new Promise(function (res) {
      (function next() {
        if (i >= n) { res(tiles); return; }
        var x0 = i * TW, c = C.canvas(TW * k, H * k), g = c.getContext("2d");
        g.scale(k, k); g.translate(-x0, 0); g.lineJoin = "round"; g.lineCap = "round";
        var pu = C._U; C._U = k;
        items.forEach(function (it) {
          [-W, 0, W].forEach(function (off) {
            if (it.x1 + off < x0 - 10 || it.x0 + off > x0 + TW + 10) return;
            g.save(); g.translate(off, 0); g.beginPath(); g.rect(x0 - off - 2, 0, TW + 4, H); g.clip();
            it.draw(g, x0 - off - 2, x0 - off + TW + 2); g.restore();
          });
        });
        C._U = pu;
        tiles.push({ img: c, x: x0, w: TW });
        i++; if (onProg) onProg(i / n);
        setTimeout(next, 0);
      })();
    });
  };
})();
