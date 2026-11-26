/* Efectos suaves: particulas (nieve, chispitas, burbujas, confeti, vapor, notas, zzz),
 * guirnaldas de luces en las repisas, la ventana (cielo, nieve afuera, noche), la TV de la pared
 * y burbujas en los matraces. Todo con poca intensidad para no distraer en el lab. */
(function () {
  "use strict";
  var C = N.clay, L = N.LAB;
  var FX = N.fx = {};
  var MAXP = N.LOW ? 140 : 320;

  /* ---------- particulas ---------- */
  var parts = [];
  FX.count = function () { return parts.length; };
  function P(o) { if (parts.length >= MAXP) parts.shift(); o.t = 0; o.scene = o.scene || N.cam.scene; parts.push(o); return o; }
  FX.add = P;
  FX.update = function (dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.t += dt;
      if (p.t > p.life) { parts.splice(i, 1); continue; }
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.type === "snow") p.x += Math.sin(p.t * 1.3 + p.ph) * 18 * dt;
      if (p.type === "bubble") p.x += Math.sin(p.t * 6 + p.ph) * 8 * dt;
      if (p.rot != null) p.rot += p.vr * dt;
      if (p.clip && (p.y > p.clip[1] + p.clip[3])) { parts.splice(i, 1); }
    }
  };
  FX.draw = function (g, top) {
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p.scene !== N.cam.scene || !!p.top !== !!top) continue;
      var k = p.t / p.life, a = (p.a || 1) * Math.min(1, p.t / (p.fin || 0.3), (p.life - p.t) / (p.fout || 0.6));
      if (a <= 0) continue;
      g.save(); g.globalAlpha = a;
      if (p.clip) { g.beginPath(); g.rect(p.clip[0], p.clip[1], p.clip[2], p.clip[3]); g.clip(); }
      var s = p.s;
      switch (p.type) {
        case "snow": g.fillStyle = "#fff"; g.beginPath(); g.arc(p.x, p.y, s, 0, 7); g.fill(); break;
        case "spark": g.globalCompositeOperation = "lighter"; g.drawImage(C.glow(p.c || "#ffe9a8"), p.x - s, p.y - s, s * 2, s * 2); break;
        case "bubble": g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = s * 0.2; g.beginPath(); g.arc(p.x, p.y, s, 0, 7); g.stroke();
          g.fillStyle = p.c ? N.rgba(N.hex2rgb(p.c), 0.25) : "rgba(200,235,255,0.2)"; g.fill(); break;
        case "confetti": g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, Math.cos(p.t * 5 + p.ph)); g.fillStyle = p.c; g.fillRect(-s, -s * 0.5, s * 2, s); break;
        case "steam": g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.arc(p.x, p.y, s * (1 + k), 0, 7); g.fill(); break;
        case "smoke": g.fillStyle = p.c || "rgba(240,248,255,0.25)"; g.beginPath(); g.arc(p.x, p.y, s * (1 + k * 1.5), 0, 7); g.fill(); break;
        case "text": g.fillStyle = p.c || "#fff"; g.font = "bold " + s + "px sans-serif"; g.textAlign = "center";
          g.strokeStyle = "rgba(40,30,20,0.35)"; g.lineWidth = s * 0.08; g.strokeText(p.txt, p.x, p.y); g.fillText(p.txt, p.x, p.y); break;
        case "heart": g.translate(p.x, p.y); g.scale(s / 10, s / 10); g.fillStyle = p.c || "#e04a5a"; g.beginPath();
          g.moveTo(0, 3); g.bezierCurveTo(-10, -4, -5, -11, 0, -5); g.bezierCurveTo(5, -11, 10, -4, 0, 3); g.fill(); break;
      }
      g.restore();
    }
  };
  /* atajos */
  FX.sparkles = function (x, y, n, spread, col) {
    for (var i = 0; i < n; i++) P({ type: "spark", x: x + N.rnd(-spread, spread), y: y + N.rnd(-spread, spread) * 0.6, vx: N.rnd(-20, 20), vy: N.rnd(-50, -10), s: N.rnd(14, 34), life: N.rnd(0.8, 1.8), c: col || N.pick(["#ffe9a8", "#fff6d8", "#ffd27a"]), top: true });
  };
  FX.confetti = function (x, y, n, spread) {
    for (var i = 0; i < n; i++) P({ type: "confetti", x: x + N.rnd(-spread, spread), y: y + N.rnd(-40, 40), vx: N.rnd(-60, 60), vy: N.rnd(-260, -80), g: 260, s: N.rnd(6, 11), rot: N.rnd(0, 6), vr: N.rnd(-5, 5), ph: N.rnd(0, 6), life: N.rnd(2, 3.2), c: N.pick(["#d0242c", "#2f8a3e", "#f2c94c", "#5fb3d9", "#f6f3ee"]), top: true });
  };
  FX.steam = function (x, y) { P({ type: "steam", x: x + N.rnd(-6, 6), y: y, vx: N.rnd(-6, 6), vy: N.rnd(-40, -25), s: N.rnd(6, 10), life: N.rnd(1.2, 2), a: 0.7 }); };
  FX.zzz = function (x, y) { P({ type: "text", txt: "z", x: x, y: y, vx: 15, vy: -30, s: 34, life: 2.5, c: "#cfe3ff", top: true }); };
  FX.note = function (x, y, col) { P({ type: "text", txt: N.pick(["♪", "♫"]), x: x + N.rnd(-20, 20), y: y, vx: N.rnd(-15, 15), vy: N.rnd(-60, -35), s: N.rnd(34, 50), life: 2.4, c: col || N.pick(["#fff7d6", "#ffd6d6", "#d6f5ff"]), top: true }); };
  FX.hearts = function (x, y, n) { for (var i = 0; i < n; i++) P({ type: "heart", x: x + N.rnd(-30, 30), y: y, vx: N.rnd(-20, 20), vy: N.rnd(-70, -40), s: N.rnd(14, 22), life: 2, top: true }); };
  FX.bubbles = function (x, y, n, w, col, clip) {
    for (var i = 0; i < n; i++) P({ type: "bubble", x: x + N.rnd(-w / 2, w / 2), y: y - N.rnd(0, 10), vx: 0, vy: N.rnd(-90, -45), s: N.rnd(3, 8), ph: N.rnd(0, 6), life: N.rnd(1.2, 2.2), c: col, clip: clip });
  };

  /* ---------- nieve magica sobre todo el lab ---------- */
  FX.snow = 0;   // intensidad 0..1 (la maneja el director)
  FX.outsideSnow = 0;
  var snowAcc = 0, outAcc = 0;
  FX.tickWeather = function (dt) {
    if (N.cam.scene !== "lab") return;
    snowAcc += dt * FX.snow * (N.LOW ? 14 : 30);
    while (snowAcc > 1) {
      snowAcc--;
      P({ type: "snow", x: N.cam.x + N.rnd(0, N.cam.vw), y: N.cam.y - 20, vx: N.rnd(-10, 10), vy: N.rnd(45, 90), s: N.rnd(3, 8), ph: N.rnd(0, 6), life: N.cam.vh / 60, a: N.rnd(0.5, 0.9), fin: 1, top: true });
    }
    var g0 = L.spots.glass, gx = N.near(g0[0]), gl = [gx, g0[1], g0[2], g0[3]];
    outAcc += dt * FX.outsideSnow * 25;
    while (outAcc > 1) {
      outAcc--;
      P({ type: "snow", x: gl[0] + N.rnd(0, gl[2]), y: gl[1], vx: N.rnd(-5, 5), vy: N.rnd(40, 80), s: N.rnd(2, 5), ph: N.rnd(0, 6), life: gl[3] / 45, a: 0.85, clip: gl });
    }
  };

  /* ---------- guirnaldas de luces ---------- */
  var PALETTES = [
    ["#ff5a5a", "#ffd25a", "#5ad1ff", "#7dff8a", "#ff8ae0"],
    ["#ffd9a0", "#ffe7c2", "#ffcf8a"],
    ["#ff4a4a", "#4aff7a"],
    ["#8ad8ff", "#ffffff", "#bfe9ff"],
    ["#ffb347", "#ff6f61", "#ffd700"]
  ];
  var MODES = ["twinkle", "chase", "breathe", "wave", "still"];
  FX.lights = { pal: PALETTES[0], mode: "twinkle", on: 1, level: 1 };
  FX.nextLights = function () {
    FX.lights.pal = N.pick(PALETTES.filter(function (p) { return p !== FX.lights.pal; }));
    FX.lights.mode = N.pick(MODES.filter(function (m) { return m !== FX.lights.mode; }));
  };
  function buildGarland(def) {
    var bulbs = [], pts = def.pts;
    var wire = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(len / 55));
      for (var j = 0; j <= n; j++) {
        var t = j / n, x = N.lerp(a[0], b[0], t), y = N.lerp(a[1], b[1], t) + Math.sin(Math.PI * t) * def.sag;
        wire.push([x, y]);
        if (j < n || i === pts.length - 2) bulbs.push({ x: x, y: y + 9, i: bulbs.length, ph: Math.random() * 6 });
      }
    }
    return { wire: wire, bulbs: bulbs };
  }
  FX.initLights = function () {
    L.garlands.forEach(function (def) {
      var gl = buildGarland(def);
      N.add({ scene: "lab", static: true, z: def.pts[0][1], kind: "garland", gl: gl, draw: function (g) {
        var W = this.gl.wire, B = this.gl.bulbs, lt = FX.lights, t = N.time;
        g.save();
        g.strokeStyle = "rgba(40,60,40,0.75)"; g.lineWidth = 2.2; g.beginPath();
        g.moveTo(W[0][0], W[0][1]); for (var i = 1; i < W.length; i++) g.lineTo(W[i][0], W[i][1]); g.stroke();
        var night = N.night || 0;
        for (i = 0; i < B.length; i++) {
          var b = B[i], col = lt.pal[i % lt.pal.length], v;
          switch (lt.mode) {
            case "twinkle": v = 0.55 + 0.45 * Math.sin(t * 1.3 + b.ph * 3); break;
            case "chase": v = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2.2 - i * 0.55)); break;
            case "breathe": v = 0.5 + 0.5 * Math.sin(t * 0.8); break;
            case "wave": v = 0.45 + 0.55 * Math.sin(t * 1.1 - i * 0.18) * Math.sin(t * 1.1 - i * 0.18); break;
            default: v = 0.9;
          }
          v *= lt.on * lt.level;
          g.fillStyle = col; g.beginPath(); g.ellipse(b.x, b.y, 5, 8, 0, 0, 7); g.fill();
          if (v > 0.05) {
            g.globalCompositeOperation = "lighter"; g.globalAlpha = v * (0.55 + night * 0.45);
            var s = 34 + night * 18; g.drawImage(C.glow(col), b.x - s, b.y - s, s * 2, s * 2);
            g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
          }
        }
        g.restore();
      } });
    });
  };

  /* ---------- ventana: cielo de noche y estrellas ---------- */
  FX.initWindow = function () {
    var gl = L.spots.glass, stars = [];
    for (var i = 0; i < 40; i++) stars.push([gl[0] + Math.random() * gl[2], gl[1] + Math.random() * gl[3] * 0.6, Math.random() * 6]);
    N.add({ scene: "lab", static: true, z: 1, draw: function (g) {
      var n = N.night || 0;
      if (n < 0.02) return;
      g.save(); g.globalAlpha = n * 0.8;
      var gr = g.createLinearGradient(0, gl[1], 0, gl[1] + gl[3]);
      gr.addColorStop(0, "#0b1530"); gr.addColorStop(1, "#28355e");
      g.fillStyle = gr; g.fillRect(gl[0], gl[1], gl[2], gl[3]);
      g.fillStyle = "#fff";
      stars.forEach(function (s) { g.globalAlpha = n * (0.4 + 0.4 * Math.sin(N.time * 1.5 + s[2])); g.fillRect(s[0], s[1], 3, 3); });
      g.restore();
      // persianas iluminadas de noche: tono azul
      var bl = L.spots.blinds; g.save(); g.globalAlpha = n * 0.35; g.fillStyle = "#1a2550"; g.fillRect(bl[0], bl[1], bl[2], bl[3]); g.restore();
    } });
  };

  /* ---------- TV de la pared ---------- */
  var tvR = L.spots.tv, TV = FX.tv = { ch: "off", t0: 0 };
  var CHANNELS = ["fire", "globe", "tree", "aurora", "msg"];
  FX.tvNext = function (ch) { TV.ch = ch || N.pick(CHANNELS.filter(function (c) { return c !== TV.ch; })); TV.t0 = N.time; TV.seed = Math.random(); };
  FX.tvOff = function () { TV.ch = "off"; };
  var GENERA = ["Acidithiobacillus", "Fervidacidithiobacillus", "Igneacidithiobacillus", "Ambacidithiobacillus", "Thermithiobacillus"];
  FX.initTV = function () {
    var x = tvR[0] + 8, y = tvR[1] + 8, w = tvR[2] - 16, h = tvR[3] - 18;
    var flames = [];
    for (var i = 0; i < 16; i++) flames.push({ x: Math.random(), ph: Math.random() * 6, s: 0.5 + Math.random() * 0.5 });
    N.add({ scene: "lab", static: true, z: 2, draw: function (g) {
      if (TV.ch === "off") return;
      var t = N.time - TV.t0, a = Math.min(1, t / 1.2);
      g.save(); g.globalAlpha = a; g.beginPath(); g.rect(x, y, w, h); g.clip();
      if (TV.ch === "fire") {
        g.fillStyle = "#1a0e08"; g.fillRect(x, y, w, h);
        g.fillStyle = "#3a2216"; g.fillRect(x, y + h * 0.78, w, h * 0.22);
        C.rrShape(g, x + w * 0.25, y + h * 0.72, w * 0.5, h * 0.1, 10, "#6b3a1e", { prints: 0 });
        g.globalCompositeOperation = "lighter";
        flames.forEach(function (f) {
          var fx = x + w * (0.28 + f.x * 0.44), fh = h * (0.25 + 0.2 * f.s * (0.7 + 0.3 * Math.sin(N.time * 5 + f.ph)));
          var gr = g.createRadialGradient(fx, y + h * 0.72, 0, fx, y + h * 0.72, fh);
          gr.addColorStop(0, "rgba(255,200,80,0.55)"); gr.addColorStop(0.5, "rgba(255,110,30,0.25)"); gr.addColorStop(1, "rgba(255,60,0,0)");
          g.fillStyle = gr; g.fillRect(fx - fh, y + h * 0.72 - fh, fh * 2, fh * 1.4);
        });
      } else if (TV.ch === "globe") {
        g.fillStyle = "#0f2240"; g.fillRect(x, y, w, h);
        var cx = x + w / 2, cy = y + h * 0.52, r = h * 0.4;
        g.fillStyle = "rgba(200,230,255,0.15)"; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
        g.fillStyle = "#f4f6fa"; g.beginPath(); g.ellipse(cx, cy + r * 0.62, r * 0.78, r * 0.25, 0, 0, 7); g.fill();
        g.fillStyle = "#2f7a3e"; g.beginPath(); g.moveTo(cx - r * 0.25, cy + r * 0.55); g.lineTo(cx, cy - r * 0.35); g.lineTo(cx + r * 0.25, cy + r * 0.55); g.fill();
        g.fillStyle = "#fff";
        for (i = 0; i < 40; i++) { var a2 = i * 2.4 + TV.seed * 10, rr = r * ((i * 37 % 100) / 100), yy = ((N.time * 12 + i * 23) % (r * 2)) - r; g.globalAlpha = a * 0.8; g.beginPath(); g.arc(cx + Math.cos(a2) * rr * 0.8, cy + yy * 0.9, 2.4, 0, 7); g.fill(); }
        g.globalAlpha = a; g.strokeStyle = "rgba(255,255,255,0.5)"; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
        g.fillStyle = "#7a4a2a"; g.fillRect(cx - r * 0.6, cy + r * 0.85, r * 1.2, h * 0.1);
      } else if (TV.ch === "tree") {
        // arbol filogenetico que crece (generos del paper) decorado como arbol de pascua
        g.fillStyle = "#f7f5ef"; g.fillRect(x, y, w, h);
        var k = Math.min(1, t / 8), n = GENERA.length;
        g.strokeStyle = "#2f7a3e"; g.lineWidth = 3; g.font = "italic 15px sans-serif"; g.fillStyle = "#24302a";
        var rx = x + 20, ry = y + h / 2;
        for (i = 0; i < n; i++) {
          var lk = N.clamp(k * n - i, 0, 1); if (lk <= 0) continue;
          var ty = y + 22 + i * (h - 40) / (n - 1), bx = rx + 30 + i * 22;
          g.beginPath(); g.moveTo(rx, ry); g.lineTo(bx, ry); g.lineTo(bx, N.lerp(ry, ty, lk)); g.lineTo(bx + (w * 0.42 - i * 22) * lk, N.lerp(ry, ty, lk)); g.stroke();
          if (lk >= 1) { g.globalAlpha = a; g.fillText(GENERA[i], bx + w * 0.42 - i * 22 + 8, ty + 5); var col = ["#c8262e", "#f2c94c", "#2f5d9e", "#b02a7a", "#2f7a3e"][i]; g.fillStyle = col; g.beginPath(); g.arc(bx + w * 0.42 - i * 22, ty, 5, 0, 7); g.fill(); g.fillStyle = "#24302a"; }
        }
      } else if (TV.ch === "aurora") {
        g.fillStyle = "#06101f"; g.fillRect(x, y, w, h);
        g.globalCompositeOperation = "lighter";
        for (i = 0; i < 3; i++) {
          g.strokeStyle = ["rgba(90,255,170,0.25)", "rgba(120,180,255,0.2)", "rgba(200,120,255,0.15)"][i]; g.lineWidth = 26;
          g.beginPath(); for (var xx = 0; xx <= w; xx += 12) { var yv = y + h * (0.35 + 0.08 * i) + Math.sin(xx * 0.02 + N.time * 0.4 + i) * 18; if (!xx) g.moveTo(x + xx, yv); else g.lineTo(x + xx, yv); } g.stroke();
        }
        g.globalCompositeOperation = "source-over"; g.fillStyle = "#e8eef5"; g.fillRect(x, y + h * 0.85, w, h * 0.15);
      } else if (TV.ch === "msg") {
        g.fillStyle = "#13281c"; g.fillRect(x, y, w, h);
        g.fillStyle = "#fff8e0"; g.textAlign = "center"; g.font = "bold 34px 'Trebuchet MS', sans-serif";
        g.fillText(TV.msg || "¡Felices fiestas, lab!", x + w / 2, y + h / 2 + 4);
        g.font = "17px sans-serif"; g.fillStyle = "#cfe8d0"; g.fillText("pH 2 y mucho cariño", x + w / 2, y + h / 2 + 36);
        for (i = 0; i < 18; i++) { g.fillStyle = "#fff"; g.globalAlpha = a * 0.7; g.beginPath(); g.arc(x + ((i * 53 + N.time * 8) % w), y + ((i * 37 + N.time * 20) % h), 2, 0, 7); g.fill(); }
      }
      g.restore();
      // reflejo
      g.save(); g.globalAlpha = 0.08 * a; g.fillStyle = "#fff"; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.3, y); g.lineTo(x, y + h * 0.5); g.fill(); g.restore();
    } });
  };

  /* ---------- reloj de pared con la hora real ---------- */
  FX.initClock = function () {
    var r = L.spots.clock, cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2, R = r[2] / 2;
    N.add({ scene: "lab", static: true, z: 3, draw: function (g) {
      var d = new Date(), h = d.getHours() % 12 + d.getMinutes() / 60, m = d.getMinutes() + d.getSeconds() / 60;
      g.save();
      g.fillStyle = "rgba(60,40,30,0.1)"; g.beginPath(); g.arc(cx + 6, cy + 8, R, 0, 7); g.fill();
      g.fillStyle = "#fbfaf6"; g.strokeStyle = "#c8262e"; g.lineWidth = 10; g.beginPath(); g.arc(cx, cy, R - 5, 0, 7); g.fill(); g.stroke();
      g.fillStyle = "#6a5a5a"; for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * (R - 22), cy + Math.sin(a) * (R - 22), i % 3 ? 3 : 5, 0, 7); g.fill(); }
      g.strokeStyle = "#3a2a2a"; g.lineCap = "round";
      var ha = h / 12 * Math.PI * 2 - Math.PI / 2, ma = m / 60 * Math.PI * 2 - Math.PI / 2;
      g.lineWidth = 8; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ha) * R * 0.45, cy + Math.sin(ha) * R * 0.45); g.stroke();
      g.lineWidth = 5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ma) * R * 0.68, cy + Math.sin(ma) * R * 0.68); g.stroke();
      g.fillStyle = "#c8262e"; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill();
      // ramita de acebo
      g.fillStyle = "#3f8a4a"; g.beginPath(); g.ellipse(cx - 24, cy - R + 4, 16, 8, -0.4, 0, 7); g.ellipse(cx + 2, cy - R, 16, 8, 0.4, 0, 7); g.fill();
      g.fillStyle = "#d0242c"; g.beginPath(); g.arc(cx - 8, cy - R + 6, 6, 0, 7); g.arc(cx + 4, cy - R + 9, 6, 0, 7); g.fill();
      g.restore();
    } });
  };

  /* ---------- matraces: burbujas y brillo de color ---------- */
  FX.flaskGlow = [0, 0, 0, 0];
  FX.flaskCol = ["#7cc4ff", "#ffd36a", "#ff8ab0", "#9cff9a"];
  FX.bubbleFlask = function (i, dur, col) {
    var fb = L.flasks[i], t0 = N.time, f = [N.near(fb[0]), fb[1], fb[2]];
    if (col) FX.flaskCol[i] = col;
    N.add({ scene: "lab", z: 3, update: function (dt) {
      var k = (N.time - t0) / dur;
      FX.flaskGlow[i] = Math.min(1, k * 4, (1 - k) * 3);
      if (Math.random() < dt * 9) FX.bubbles(f[0], f[1] - 10, 1, f[2] * 0.6, FX.flaskCol[i], [f[0] - f[2] / 2, f[1] - 300, f[2], 300]);
      if (k >= 1) { FX.flaskGlow[i] = 0; this.dead = true; }
    } });
  };
  FX.initFlasks = function () {
    N.add({ scene: "lab", static: true, z: 4, draw: function (g) {
      for (var i = 0; i < L.flasks.length; i++) {
        var v = FX.flaskGlow[i]; if (v < 0.02) continue;
        var f = L.flasks[i], s = f[2] * 1.6;
        g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = v * 0.5;
        g.drawImage(C.glow(FX.flaskCol[i]), f[0] - s, f[1] - s * 1.1, s * 2, s * 2); g.restore();
      }
    } });
  };
})();
