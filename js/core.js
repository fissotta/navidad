/* Nucleo: utilidades, tiempo de juego, esperas (para escribir eventos como guiones) y actores.
 * Todo vive en el objeto global N. Se evita sintaxis muy nueva: la TV del lab (Tizen) trae un Chrome antiguo. */
var N = window.N = {};
(function () {
  "use strict";
  var Q = N.Q = new URLSearchParams(location.search);
  N.LOW = /Tizen|SMART-TV|SmartTV|Web0S/i.test(navigator.userAgent) || Q.has("lento");
  N.DEBUG = Q.has("debug");
  if (N.DEBUG) {   // errores visibles (para probar en la TV o sin consola)
    N.errors = [];
    window.addEventListener("error", function (e) { N.errors.push(String(e.message) + " @" + (e.filename || "").split("/").pop() + ":" + e.lineno); });
    window.addEventListener("unhandledrejection", function (e) { N.errors.push("promesa: " + (e.reason && e.reason.stack || e.reason)); });
  }
  N.TURBO = Math.max(1, Math.min(20, parseFloat(Q.get("turbo")) || 1));   // ?turbo=5 acelera el tiempo (pruebas)

  N.rnd = function (a, b) { return a + Math.random() * (b - a); };
  N.ri = function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); };
  N.pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  N.chance = function (p) { return Math.random() < p; };
  N.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  N.lerp = function (a, b, t) { return a + (b - a) * t; };
  N.ease = function (t) { t = N.clamp(t, 0, 1); return 0.5 - 0.5 * Math.cos(Math.PI * t); };
  N.easeOut = function (t) { t = N.clamp(t, 0, 1); return 1 - (1 - t) * (1 - t); };
  N.smooth = function (cur, target, rate, dt) { return target + (cur - target) * Math.exp(-rate * dt); };
  N.shuffle = function (a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  N.rgba = function (c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; };
  N.hex2rgb = function (h) { h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; };
  N.shade = function (hex, f) {   // f<0 oscurece, f>0 aclara
    var c = N.hex2rgb(hex);
    for (var i = 0; i < 3; i++) c[i] = Math.round(f < 0 ? c[i] * (1 + f) : c[i] + (255 - c[i]) * f);
    return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
  };

  /* Bolsa barajada: entrega todos los elementos en orden aleatorio antes de repetir,
   * y evita repetir los ultimos `avoid` al rebarajar. */
  N.Bag = function (items, avoid) {
    this.items = items.slice(); this.avoid = avoid || 0; this.q = []; this.recent = [];
  };
  N.Bag.prototype.next = function (filter) {
    var tries = 0;
    while (tries++ < 3) {
      if (!this.q.length) {
        var self = this;
        this.q = N.shuffle(this.items.filter(function (x) { return self.recent.indexOf(x) < 0; }));
        if (!this.q.length) this.q = N.shuffle(this.items.slice());
      }
      for (var i = 0; i < this.q.length; i++) {
        if (!filter || filter(this.q[i])) {
          var it = this.q.splice(i, 1)[0];
          this.recent.push(it); if (this.recent.length > this.avoid) this.recent.shift();
          return it;
        }
      }
      if (!filter) break;
      this.q = [];   // nada sirve en la cola actual: rebaraja con todo
      if (tries === 2) { var ok = this.items.filter(filter); return ok.length ? N.pick(ok) : null; }
    }
    return null;
  };

  /* Tiempo de juego y esperas: `await N.wait(2)` dentro de un evento. */
  N.time = 0;
  var waits = [];
  N.wait = function (s) { return new Promise(function (res) { waits.push({ t: N.time + s, res: res }); }); };
  N.until = function (fn, max) {
    var t0 = N.time;
    return new Promise(function (res) { waits.push({ fn: fn, t: t0 + (max || 1e9), res: res }); });
  };
  N.tickWaits = function () {
    for (var i = waits.length - 1; i >= 0; i--) {
      var w = waits[i];
      if (N.time >= w.t || (w.fn && w.fn())) { waits.splice(i, 1); w.res(); }
    }
  };

  /* Actores: objetos con update(dt), draw(g) en coordenadas del mundo, z (orden), scene. */
  N.actors = [];
  N.add = function (a) {
    a.born = N.time; if (a.scene == null) a.scene = "lab"; if (a.z == null) a.z = 0;
    N.actors.push(a); return a;
  };
  N.remove = function (a) { if (a) a.dead = true; };
  N.loaded = {};
  N.loadImg = function (src) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { console.warn("no cargo", src); res(null); };
      im.src = src;
    });
  };
  N.loadJSON = function (src) { return fetch(src).then(function (r) { return r.json(); }); };
  N.log = function () { if (N.DEBUG) console.log.apply(console, arguments); };
})();
