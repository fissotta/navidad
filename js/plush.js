/* Los peluches del lab, dibujados en sus cajas de colores sobre el mueble blanco (zona de bioinfo).
 * Nombres segun sus etiquetas de cuero. Se despiertan, parpadean, se ponen gorro y cantan cuando
 * la camara se acerca. Coordenadas base (0..9600): se dibujan en cada vuelta del lab. */
(function () {
  "use strict";
  var C = N.clay;
  N.PLUSH_INFO = {
    p1: { name: "Acidithiobacillus thiooxidans", box: "#2c34a8", body: "#f2d65a", w: 62, h: 102, flag: "short" },
    p2: { name: "Acidithiobacillus ferrivorans", box: "#b8242e", body: "#7468c4", w: 58, h: 112, flag: "long" },
    p3: { name: "Acidithiobacillus caldus", box: "#1d1d21", body: "#f2d65a", w: 54, h: 100, flag: "long", glasses: true },
    p4: { name: "Acidithiobacillus ferrooxidans", box: "#eac326", body: "#d0304a", w: 70, h: 104, flag: null },
    p5: { name: "Acidithiobacillus albertensis", box: "#e2632a", body: "#f2d65a", w: 56, h: 106, flag: "tuft" },
    p6: { name: "Acidithiobacillus sulfuriphilus", box: "#25603a", body: "#e85a30", w: 66, h: 128, flag: "long", spikes: true }
  };
  N.PLUSH_LINES = {
    p1: ["Azufre amarillo, corazón amarillo", "¡pH 2 y a cantar!"],
    p2: ["Yo aguanto el frío", "¿Alguien prendió el aire?"],
    p3: ["Con este calor, lentes siempre", "45 °C… ¡qué rico!"],
    p4: ["Fe²⁺ → Fe³⁺, ¡feliz Navidad!", "Soy la más famosa del paper"],
    p5: ["Saludos desde Alberta", "Soy subespecie, pero con estilo"],
    p6: ["¡Las púas son adornos!", "Rama profunda, cariño profundo"]
  };
  var BOX_W = 108, BOX_H = 172, SHELF_Y = 790, X0 = 8102, STEP = 122;

  function Plush(id, i, k) {
    var I = this.info = N.PLUSH_INFO[id];
    this.id = id; this.static = true; this.scene = "lab"; this.z = 900;
    this.bx = X0 + i * STEP; this.by = SHELF_Y - BOX_H;
    this.px = this.bx + BOX_W / 2; this.py = this.by + 26;   // punto de donde cuelga
    this.awake = 0; this.wantAwake = 0; this.hat = null; this.hatA = 0;
    this.sing = 0; this.talk = 0; this.blink = 0; this.blinkT = N.rnd(1, 3); this.ph = Math.random() * 6;
    this.hopT = 0; this.hop = 0; this.dance = false; this.danceA = 0;
    // cuerpo pintado una vez (alta resolucion para el acercamiento)
    var w = I.w, h = I.h, pad = 14;
    this.spr = C.part(-w / 2 - pad, -4, w / 2 + pad, h + pad, k, function (g) {
      if (I.spikes) for (var s = 0; s < 8; s++) { var a = s / 8 * Math.PI * 2 + 0.4; C.ellShape(g, Math.cos(a) * w * 0.52, h * 0.45 + Math.sin(a) * h * 0.42, 7, 7, "#f2d65a", { prints: 0 }); }
      C.shape(g, C.rrect(-w / 2, 0, w, h, w / 2), I.body, [-w / 2, 0, w, h], { hi: 0.45, sh: 0.3 });
      g.save(); g.beginPath(); C.rrect(-w / 2, 0, w, h, w / 2)(g); g.clip();
      g.strokeStyle = "rgba(0,0,0,0.07)"; g.lineWidth = 1.2;
      for (var yy = 4; yy < h; yy += 5) { g.beginPath(); g.moveTo(-w / 2, yy); g.quadraticCurveTo(0, yy + 2.5, w / 2, yy); g.stroke(); }
      g.restore();
      if (I.flag) C.ellShape(g, 0, h + 2, 8, 8, N.shade(I.body, -0.05), { prints: 0 });
    });
  }
  Plush.prototype.update = function (dt) {
    this.awake = N.smooth(this.awake, this.wantAwake, 2, dt);
    this.hatA = N.smooth(this.hatA, this.hat ? 1 : 0, 4, dt);
    this.ph += dt * (1 + this.awake * 2);
    if (this.awake > 0.3) { this.blinkT -= dt; if (this.blinkT < 0) { this.blink = 0.14; this.blinkT = N.rnd(1.5, 4.5); } }
    if (this.blink > 0) this.blink -= dt;
    if (this.talk > 0) { this.talk -= dt; this.sing = 0.4 + 0.4 * Math.sin(N.time * 15); }
    else this.sing = N.smooth(this.sing, this.singT > N.time ? this.singV : 0, 18, dt);
    if (this.hopT > 0) { this.hopT -= dt; this.hop = Math.abs(Math.sin(this.hopT * 9)) * 8; } else this.hop = N.smooth(this.hop, 0, 10, dt);
    this.danceA = N.smooth(this.danceA, this.dance ? 1 : 0, 3, dt);
  };
  Plush.prototype.draw = function (g) {
    var I = this.info, bx = this.bx, by = this.by, t = N.time + this.ph * 0.3, a = this.awake;
    // caja
    g.save();
    g.fillStyle = "rgba(60,40,30,0.12)"; g.fillRect(bx + 6, by + 8, BOX_W, BOX_H);
    g.beginPath(); C.rrect(bx, by, BOX_W, BOX_H, 4)(g); g.fillStyle = "#c9935a"; g.fill(); g.strokeStyle = "rgba(96,74,74,0.5)"; g.lineWidth = 2; g.stroke();
    var gr = g.createLinearGradient(0, by + 8, 0, by + BOX_H - 8); gr.addColorStop(0, N.shade(I.box, -0.35)); gr.addColorStop(0.3, I.box); gr.addColorStop(1, N.shade(I.box, 0.08));
    g.fillStyle = gr; g.fillRect(bx + 8, by + 8, BOX_W - 16, BOX_H - 16);
    // peluche colgando
    var rot = Math.sin(t * 0.9) * 0.012 + Math.sin(t * 1.7) * 0.04 * a + Math.sin(t * 3.2) * 0.14 * this.danceA;
    var sy = 1 + Math.sin(t * 2.1) * 0.015 * (0.3 + a) + this.sing * 0.05, sx = 1 / Math.sqrt(sy);
    g.beginPath(); g.rect(bx + 8, by + 8, BOX_W - 16, BOX_H - 8); g.clip();
    g.translate(this.px, this.py - this.hop); g.rotate(rot); g.scale(sx, sy);
    var w = I.w, h = I.h;
    // flagelo de lana
    if (I.flag) {
      g.strokeStyle = N.shade(I.body, -0.12); g.lineCap = "round";
      var strands = I.flag === "tuft" ? 4 : 1, len = I.flag === "short" ? 22 : 60;
      for (var s = 0; s < strands; s++) {
        g.lineWidth = I.flag === "tuft" ? 2.6 : 3.4; g.beginPath(); g.moveTo(0, h + 6);
        for (var q = 1; q <= 10; q++) { var tt = q / 10; g.lineTo(Math.sin(t * (2 + a * 4) - tt * 5 + s) * (5 + a * 6) * tt + (s - 1.5) * 3 * tt, h + 6 + tt * len); }
        g.stroke();
      }
    }
    g.drawImage(this.spr.c, this.spr.x0, this.spr.y0, this.spr.w, this.spr.h);
    // cara
    var ey = h * 0.26, ex = w * 0.2;
    if (I.glasses) {
      g.fillStyle = "#141414"; g.beginPath(); C.rrect(-w * 0.46, ey - 6, w * 0.42, 13, 4)(g); g.fill(); g.beginPath(); C.rrect(w * 0.04, ey - 6, w * 0.42, 13, 4)(g); g.fill(); g.fillRect(-4, ey - 4, 8, 3);
    } else if (this.blink > 0) {
      g.strokeStyle = "#141010"; g.lineWidth = 2; [-1, 1].forEach(function (d) { g.beginPath(); g.moveTo(d * ex - 3.5, ey); g.lineTo(d * ex + 3.5, ey); g.stroke(); });
    } else {
      g.fillStyle = "#141010"; [-1, 1].forEach(function (d) { g.beginPath(); g.arc(d * ex, ey, 3.6, 0, 7); g.fill(); });
      g.fillStyle = "rgba(255,255,255,0.85)"; [-1, 1].forEach(function (d) { g.beginPath(); g.arc(d * ex + 1.2, ey - 1.2, 1.1, 0, 7); g.fill(); });
    }
    if (this.sing > 0.06) {
      g.fillStyle = "#3a1212"; g.beginPath(); g.ellipse(0, ey + 15, 5 + this.sing * 1.5, 1.5 + this.sing * 6, 0, 0, 7); g.fill();
    } else if (a > 0.4) { g.strokeStyle = "#3a1a12"; g.lineWidth = 1.6; g.beginPath(); g.arc(0, ey + 9, 5, 0.4, Math.PI - 0.4); g.stroke(); }
    if (this.hatA > 0.02 && this.hat && N.HATS[this.hat]) { g.globalAlpha *= this.hatA; C.draw(g, N.HATS[this.hat], 2, 6 - (1 - this.hatA) * 30, -0.18, w * 1.15); }
    g.restore();
  };
  Plush.prototype.headPos = function () { return [N.near(this.px), this.by - 6]; };
  Plush.prototype.hit = function (wx, wy) { var x = N.wrapX(wx); return x > this.bx && x < this.bx + BOX_W && wy > this.by && wy < this.by + BOX_H; };
  Plush.prototype.say = function (text, dur) { dur = dur || Math.max(2.6, text.length * 0.075); this.talk = Math.min(dur * 0.8, 0.3 + text.length * 0.045); N.bubble(this, text, dur); return N.wait(dur); };
  Plush.prototype.singNote = function (dur, v) { this.singT = N.time + Math.max(0.12, dur * 0.85); this.singV = v || 0.9; };
  Plush.prototype.onTap = function () {
    var self = this; this.wantAwake = 1; this.hopT = 0.6;
    this.say(N.pick(N.PLUSH_LINES[this.id]), 3).then(function () { if (!N.plush.busy) self.wantAwake = 0; });
    N.bubbleLabel(this);
  };

  N.plush = { list: [], byId: {}, busy: false, center: X0 + STEP * 3 - (STEP - BOX_W) / 2, top: SHELF_Y - BOX_H };
  N.buildPlush = function (k) {
    ["p1", "p2", "p3", "p4", "p5", "p6"].forEach(function (id, i) {
      var p = N.add(new Plush(id, i, k)); N.plush.list.push(p); N.plush.byId[id] = p;
    });
  };

  /* cartelito con el nombre (como la etiqueta de cuero) */
  N.bubbleLabel = function (p) {
    var t0 = N.time;
    N.add({ scene: "lab", layer: "screen", update: function () { if (N.time - t0 > 4.5) this.dead = true; },
      draw: function (g) {
        var k = N.time - t0, a = Math.min(1, k / 0.3, (4.5 - k) / 0.5); if (a <= 0) return;
        var sp = N.cam.toScreen(N.near(p.px), SHELF_Y + 12), F = N.UI;
        g.save(); g.globalAlpha = a; g.font = "italic 700 " + Math.round(20 * F) + "px Georgia, serif"; g.textAlign = "center";
        var w = g.measureText(p.info.name).width + 30 * F, h = 38 * F;
        g.fillStyle = "#8a6a4e"; g.strokeStyle = "#5a4230"; g.lineWidth = 2 * F;
        g.beginPath(); C.rrect(sp[0] - w / 2, sp[1], w, h, 6 * F)(g); g.fill(); g.stroke();
        g.fillStyle = "#fff3e0"; g.fillText(p.info.name, sp[0], sp[1] + 26 * F);
        g.restore();
      } });
  };
})();
