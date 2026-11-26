/* Escenario: el lab dibujado es una franja circular de 9600 x 2160 unidades (el final empalma con
 * el principio). La camara gira lento y continuo (?giro=18 unidades/s). Las cosas fijas del lab
 * (luces, escritorios, peluches, TV...) se repiten cada 9600; la gente y los personajes usan
 * coordenadas absolutas cerca de la camara. Con ?debug se ven las zonas y al tocar se imprime la
 * coordenada. */
(function () {
  "use strict";
  var W = 9600;
  N.LAB = {
    w: W, h: 2160,
    walkY: [1650, 1770],     // pasillo de atras y de adelante (pies)
    stations: [               // trabajar de pie frente a un meson
      { x: 1700, y: 1590 }, { x: 2350, y: 1590 }, { x: 3150, y: 1590 }, { x: 4400, y: 1595 },
      { x: 5400, y: 1600 }, { x: 9200, y: 1590 }, { x: 650, y: 1610 }
    ],
    deskTop: 1225, deskZ: 1630,
    deskTables: [
      { x0: 6320, x1: 7120, monitors: [{ x: 6385, k: "side", dir: 1 }, { x: 6725, k: "back" }, { x: 7070, k: "front" }] },
      { x0: 7240, x1: 7680, monitors: [{ x: 7290, k: "back" }, { x: 7635, k: "side", dir: -1 }] }
    ],
    desksList: [
      { id: "D1", x: 6545, hip: 1360, hw: 560, clip: 1225, chair: "#2b2d33" },
      { id: "D2", x: 6895, hip: 1360, hw: 560, clip: 1225, chair: "#3a2f4a" },
      { id: "D3", x: 7465, hip: 1360, hw: 560, clip: 1225, chair: "#2b2d33" }
    ],
    spots: {
      tv: [370, 750, 500, 300],
      copahue: [150, 770, 180, 240],
      door: [1010, 760, 290, 745],
      flasks: [2060, 560, 700, 200],
      fridge: [3690, 590, 370, 915],
      window: [4780, 500, 1340, 840],
      glass: [4822, 545, 428, 765],
      blinds: [5262, 545, 816, 765],
      monitor: [6990, 1050, 160, 120],
      board: [6400, 620, 900, 380],
      shelf: [8090, 590, 740, 210],
      poster: [8920, 500, 420, 560],
      clock: [7480, 650, 140, 140]
    },
    garlands: [
      { pts: [[1450, 738], [2500, 736], [3550, 738]], sag: 42 },
      { pts: [[4120, 708], [4660, 708]], sag: 30 },
      { pts: [[4790, 512], [5450, 512], [6110, 512]], sag: 46 },
      { pts: [[6400, 612], [7300, 612]], sag: 40 },
      { pts: [[8090, 800], [8460, 800], [8830, 800]], sag: 20 },
      { pts: [[9580, 700], [9950, 690], [10330, 700]], sag: 30 }
    ],
    flasks: [[2150, 748, 92], [2330, 748, 112], [2515, 748, 92], [2690, 748, 104]],
    floorY: 1500
  };
  N.LAB.desks = {}; N.LAB.desksList.forEach(function (d) { N.LAB.desks[d.id] = d; });
  N.ROT = parseFloat(N.Q.get("giro")); if (isNaN(N.ROT)) N.ROT = 18;

  /* posicion absoluta de un elemento fijo (base 0..9600) mas cercana a la vista */
  N.near = function (xb, ref) {
    ref = ref == null ? N.cam.x + N.cam.vw / 2 : ref;
    return xb + Math.round((ref - xb) / W) * W;
  };
  N.wrapX = function (x) { return ((x % W) + W) % W; };

  /* ---------- camara ---------- */
  var cam = N.cam = { scene: "lab", x: 0, y: 0, z: 1, s: 1, vw: 0, vh: 0, tw: null, hold: false };
  N.SCENES = {};
  cam.update = function (dt, CW, CH) {
    var S = N.SCENES[cam.scene];
    if (cam.tw) {
      var t = cam.tw, k = N.ease((N.time - t.t0) / t.d);
      cam.x = N.lerp(t.a.x, t.b.x, k); cam.y = N.lerp(t.a.y, t.b.y, k); cam.z = N.lerp(t.a.z, t.b.z, k);
      if (k >= 1) cam.tw = null;
    } else if (!cam.hold) {
      cam.rotV = N.smooth(cam.rotV || 0, N.ROT, 0.4, dt);
      cam.x += cam.rotV * dt;
    }
    cam.vh = S.h / cam.z; cam.vw = cam.vh * CW / CH;
    cam.y = N.clamp(cam.y, 0, Math.max(0, S.h - cam.vh));
    cam.s = CH / cam.vh;
  };
  cam.go = function (x, y, z, d) {
    cam.tw = { t0: N.time, d: Math.max(0.01, d || 0), a: { x: cam.x, y: cam.y, z: cam.z }, b: { x: x, y: y, z: z } };
    cam.rotV = 0;
    return N.wait(d || 0);
  };
  cam.look = function (wx, wy, z, d) {
    var vh = N.LAB.h / z, vw = vh * N.CW / N.CH;
    return cam.go(wx - vw / 2, N.clamp(wy - vh / 2, 0, N.LAB.h - vh), z, d);
  };
  cam.view = function () {   // vista final (si hay movimiento, hacia donde va)
    var x = cam.tw ? cam.tw.b.x : cam.x, z = cam.tw ? cam.tw.b.z : cam.z, vw = N.LAB.h / z * N.CW / N.CH;
    return { x0: x, x1: x + vw, w: vw };
  };
  cam.sees = function (xb, m) {   // un elemento fijo (base) esta en la vista
    var v = cam.view(), x = N.near(xb, (v.x0 + v.x1) / 2); m = m || 0;
    return x > v.x0 + m && x < v.x1 - m;
  };
  cam.toScreen = function (wx, wy) { return [(wx - cam.x) * cam.s, (wy - cam.y) * cam.s]; };
  cam.toWorld = function (sx, sy) { return [sx / cam.s + cam.x, sy / cam.s + cam.y]; };
  cam.zone = function () { var c = N.wrapX(cam.x + cam.vw / 2); return c < 1400 ? "tv" : c < 3600 ? "mesones" : c < 4700 ? "reactivos" : c < 6200 ? "ventana" : c < 8000 ? "bioinfo" : "peluches"; };

  /* ---------- fondo pintado ---------- */
  function TiledBg(tiles) { this.tiles = tiles; }
  TiledBg.prototype.draw = function (g, off) {
    var x0 = cam.x - off - 4, x1 = cam.x + cam.vw - off + 4;
    for (var i = 0; i < this.tiles.length; i++) {
      var t = this.tiles[i];
      if (t.x + t.w < x0 || t.x > x1) continue;
      g.drawImage(t.img, t.x - 0.5, 0, t.w + 1, N.LAB.h);
    }
  };
  N.loadScenes = function (onProgress) {
    var k = Math.min(1, N.CH / 2160);
    return N.buildLabArt(k, onProgress).then(function (tiles) {
      N.SCENES.lab = { w: W, h: N.LAB.h, bg: new TiledBg(tiles) };
      N.buildForeground(k * 1.2);
    });
  };
  N.fade = 0;

  /* ---------- depuracion ---------- */
  N.debugDraw = function (g) {
    if (!N.DEBUG) return;
    var L = N.LAB, s = 1 / cam.s;
    g.save(); g.lineWidth = 3 * s; g.font = (16 * s) + "px sans-serif";
    L.walkY.forEach(function (y) { g.strokeStyle = "#0f0"; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); });
    L.stations.forEach(function (st, i) { g.fillStyle = "#ff0"; g.fillRect(st.x - 8 * s, st.y - 8 * s, 16 * s, 16 * s); g.fillText("S" + i, st.x + 10 * s, st.y); });
    L.desksList.forEach(function (d) { g.strokeStyle = "#0ff"; g.beginPath(); g.moveTo(d.x - 120, d.clip); g.lineTo(d.x + 120, d.clip); g.stroke(); g.fillStyle = "#0ff"; g.fillText(d.id, d.x, d.clip - 10 * s); });
    for (var k in L.spots) { var r = L.spots[k]; g.strokeStyle = "#f0f"; g.strokeRect(r[0], r[1], r[2], r[3]); g.fillStyle = "#f0f"; g.fillText(k, r[0] + 4 * s, r[1] + 18 * s); }
    g.restore();
  };
})();
