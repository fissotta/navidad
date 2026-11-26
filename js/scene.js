/* Escenarios: la panoramica del lab (9222 x 2160 unidades de mundo = pixeles de la version 4K)
 * y los primeros planos de la repisa de peluches. Aqui estan las coordenadas de todo
 * (pasillos, mesones, escritorios, ventana, TV, matraces...). Con ?debug se dibujan y al
 * tocar se muestra la coordenada, para ajustarlas. */
(function () {
  "use strict";

  /* ---------- Geometria del laboratorio (coordenadas de mundo) ---------- */
  N.LAB = {
    w: 9222, h: 2160,
    // vistas de camara (x = borde izquierdo de lo que se ve, zoom 1 = alto completo)
    zones: { left: 0, center: 2700, right: 5382 },
    // pasillos donde camina la gente: de a hacia b (pies), con los objetos que los tapan en los extremos
    lanes: {
      L1: { a: [230, 1590], b: [1000, 1575] },
      L2: { a: [2860, 1575], b: [3660, 1560] },
      L3: { a: [5830, 1590], b: [7120, 1575] },
      L4: { a: [8700, 1670], b: [9330, 1660] }
    },
    // lugares para trabajar de pie (frente al meson)
    stations: {
      S1: { x: 720, y: 1578, lane: "L1" },
      S5: { x: 420, y: 1585, lane: "L1" },
      S2: { x: 3300, y: 1568, lane: "L2" },
      S6: { x: 3540, y: 1563, lane: "L2" },
      S3: { x: 6150, y: 1585, lane: "L3" },
      S7: { x: 6560, y: 1582, lane: "L3" },
      S4: { x: 8950, y: 1666, lane: "L4" }
    },
    // escritorios de bioinformatica (sentados, se ve de los hombros para arriba)
    desks: {
      D1: { x: 7690, hip: 1255, hw: 520, clip: 1095 },
      D2: { x: 7395, hip: 1245, hw: 500, clip: 1088 },
      D3: { x: 8150, hip: 1305, hw: 540, clip: 1150 }
    },
    // zonas tocables [x, y, w, h]
    spots: {
      tv: [394, 774, 452, 262],
      window: [5810, 470, 1680, 730],
      glass: [5815, 615, 565, 580],
      blinds: [6390, 470, 1090, 730],
      shelf: [7690, 460, 545, 190],
      flasks: [4180, 450, 800, 350],
      copahue: [164, 780, 172, 224],
      poster: [8750, 280, 480, 580],
      monitor: [6640, 960, 270, 170],
      fridge: [3590, 800, 310, 360]
    },
    // guirnaldas de luces: puntos de anclaje y cuanto cuelgan
    garlands: [
      { pts: [[1130, 892], [2000, 878], [2690, 852]], sag: 38 },
      { pts: [[3810, 803], [4700, 803], [5540, 801]], sag: 44 },
      { pts: [[5720, 470], [6600, 490], [7480, 502]], sag: 46 },
      { pts: [[7690, 650], [8230, 642], [8690, 624]], sag: 24 }
    ],
    flasks: [[4258, 785, 70], [4508, 790, 88], [4712, 790, 70], [4876, 792, 80]],
    floorY: 1500
  };

  /* ---------- Camara ---------- */
  var cam = N.cam = { scene: "lab", x: 0, y: 0, z: 1, s: 1, vw: 0, vh: 0, tw: null };
  N.SCENES = {};
  cam.sceneDef = function () { return N.SCENES[cam.scene]; };
  cam.update = function (dt, CW, CH) {
    var S = N.SCENES[cam.scene];
    if (cam.tw) {
      var t = cam.tw, k = N.ease((N.time - t.t0) / t.d);
      cam.x = N.lerp(t.a.x, t.b.x, k); cam.y = N.lerp(t.a.y, t.b.y, k); cam.z = N.lerp(t.a.z, t.b.z, k);
      if (k >= 1) cam.tw = null;
    }
    cam.vh = S.h / cam.z; cam.vw = cam.vh * CW / CH;
    if (cam.vw > S.w) { cam.vw = S.w; cam.vh = S.w * CH / CW; }
    cam.x = N.clamp(cam.x, 0, Math.max(0, S.w - cam.vw));
    cam.y = N.clamp(cam.y, 0, Math.max(0, S.h - cam.vh));
    cam.s = CH / cam.vh;
  };
  cam.go = function (x, y, z, d) {
    cam.tw = { t0: N.time, d: Math.max(0.01, d || 0), a: { x: cam.x, y: cam.y, z: cam.z }, b: { x: x, y: y, z: z } };
    return N.wait(d || 0);
  };
  // centra la camara en un punto del mundo
  cam.look = function (wx, wy, z, d) {
    var S = N.SCENES[cam.scene], vh = S.h / z, vw = vh * N.CW / N.CH;
    return cam.go(N.clamp(wx - vw / 2, 0, S.w - vw), N.clamp(wy - vh / 2, 0, S.h - vh), z, d);
  };
  cam.toZone = function (name, d) { return cam.go(N.LAB.zones[name], 0, 1, d); };
  cam.zone = function () {   // zona mas cercana a la vista actual
    var best = "left", bd = 1e9, Z = N.LAB.zones;
    for (var k in Z) { var dd = Math.abs(Z[k] - (cam.tw ? cam.tw.b.x : cam.x)); if (dd < bd) { bd = dd; best = k; } }
    return best;
  };
  cam.sees = function (x, m) {   // x de mundo visible (con margen m) en la vista final de la camara
    var x0 = cam.tw ? cam.tw.b.x : cam.x, vw = N.SCENES[cam.scene].h / (cam.tw ? cam.tw.b.z : cam.z) * N.CW / N.CH;
    m = m || 0;
    return x > x0 + m && x < x0 + vw - m;
  };
  cam.toScreen = function (wx, wy) { return [(wx - cam.x) * cam.s, (wy - cam.y) * cam.s]; };
  cam.toWorld = function (sx, sy) { return [sx / cam.s + cam.x, sy / cam.s + cam.y]; };

  /* ---------- Fondos ---------- */
  function TiledBg(tiles) { this.tiles = tiles; }
  TiledBg.prototype.draw = function (g) {
    var x0 = cam.x - 4, x1 = cam.x + cam.vw + 4;
    for (var i = 0; i < this.tiles.length; i++) {
      var t = this.tiles[i];
      if (!t.img || t.x + t.w < x0 || t.x > x1) continue;
      g.drawImage(t.img, t.x - 0.5, 0, t.w + 1, N.LAB.h);   // +1: sin rendijas entre trozos
    }
  };

  N.loadScenes = function (onProgress) {
    var hi = !N.LOW && Math.max(N.CW, N.CH * 16 / 9) > 2400 && !N.Q.has("bajo");
    return N.loadJSON("assets/bg.json?v=" + N.VER).then(function (meta) {
      var list = meta.tiles[hi ? "hi" : "lo"].map(function (t) { return { src: t.src, x: t.x, w: t.w }; });
      var jobs = [], done = 0, total = list.length + Object.keys(meta.occ).length + 2;
      function tick() { done++; if (onProgress) onProgress(done / total); }
      list.forEach(function (t) { jobs.push(N.loadImg("assets/" + t.src + "?v=" + N.VER).then(function (im) { t.img = im; tick(); })); });
      N.SCENES.lab = { w: N.LAB.w, h: N.LAB.h, bg: new TiledBg(list) };
      // oclusores: muebles del primer plano que tapan a la gente que pasa detras
      Object.keys(meta.occ).forEach(function (k) {
        var o = meta.occ[k];
        jobs.push(N.loadImg("assets/occ/" + k + "_" + (hi ? "hi" : "lo") + ".png?v=" + N.VER).then(function (im) {
          tick();
          if (!im) return;
          N.add({ occ: k, z: o.y + o.h, scene: "lab", draw: function (g) { g.drawImage(im, o.x, o.y, o.w, o.h); } });
        }));
      });
      // primeros planos de los peluches (2560 x 1440)
      ["a", "b"].forEach(function (sc) {
        var def = N.SCENES["shelf" + sc.toUpperCase()] = { w: 2560, h: 1440, bg: null };
        jobs.push(N.loadImg("assets/plush/scene_" + sc + "_bg.jpg?v=" + N.VER).then(function (im) {
          tick(); def.bg = { draw: function (g) { if (im) g.drawImage(im, 0, 0, 2560, 1440); } };
        }));
      });
      return Promise.all(jobs);
    });
  };

  /* Transicion suave entre escenarios (fundido) */
  N.fade = 0;
  N.goScene = function (name, setup, dur) {
    dur = dur || 0.9;
    var t0 = N.time;
    return new Promise(function (res) {
      var a = N.add({ scene: "*", layer: "none", update: function () {
        var k = (N.time - t0) / dur;
        if (k < 1) N.fade = N.ease(k);
        else if (!a.sw) { a.sw = true; cam.scene = name; cam.tw = null; if (setup) setup(); N.fade = 1; a.t1 = N.time; }
        else { var k2 = (N.time - a.t1) / dur; N.fade = 1 - N.ease(k2); if (k2 >= 1) { N.fade = 0; a.dead = true; res(); } }
      } });
    });
  };

  /* ---------- Depuracion ---------- */
  N.debugDraw = function (g) {
    if (!N.DEBUG || cam.scene !== "lab") return;
    var L = N.LAB, s = 1 / cam.s;
    g.save(); g.lineWidth = 3 * s; g.font = (16 * s) + "px sans-serif";
    for (var k in L.lanes) { var l = L.lanes[k]; g.strokeStyle = "#0f0"; g.beginPath(); g.moveTo(l.a[0], l.a[1]); g.lineTo(l.b[0], l.b[1]); g.stroke(); g.fillStyle = "#0f0"; g.fillText(k, l.a[0], l.a[1] - 10 * s); }
    for (k in L.stations) { var st = L.stations[k]; g.fillStyle = "#ff0"; g.fillRect(st.x - 8 * s, st.y - 8 * s, 16 * s, 16 * s); g.fillText(k, st.x + 10 * s, st.y); }
    for (k in L.desks) { var d = L.desks[k]; g.strokeStyle = "#0ff"; g.beginPath(); g.moveTo(d.x - 120, d.clip); g.lineTo(d.x + 120, d.clip); g.stroke(); g.fillStyle = "#0ff"; g.fillText(k, d.x, d.clip - 10 * s); }
    for (k in L.spots) { var r = L.spots[k]; g.strokeStyle = "#f0f"; g.strokeRect(r[0], r[1], r[2], r[3]); g.fillStyle = "#f0f"; g.fillText(k, r[0] + 4 * s, r[1] + 18 * s); }
    g.restore();
  };
})();
