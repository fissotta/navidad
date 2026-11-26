/* Los peluches del lab (repisa blanca, al fondo a la derecha). En los primeros planos
 * (fotos bacterias1 y bacterias2) cada peluche esta recortado y puede moverse, parpadear,
 * ponerse gorro y cantar. Nombres segun sus etiquetas de cuero. */
(function () {
  "use strict";
  N.PLUSH_INFO = {
    p1: { name: "Acidithiobacillus thiooxidans", sp: "thiooxidans", col: [214, 190, 98] },
    p2: { name: "Acidithiobacillus ferrivorans", sp: "ferrivorans", col: [88, 82, 128] },
    p3: { name: "Acidithiobacillus caldus", sp: "caldus", col: [221, 200, 102], mouth: [1190, 790] },
    p4: { name: "Acidithiobacillus ferrooxidans", sp: "ferrooxidans", col: [168, 40, 54] },
    p5: { name: "Acidithiobacillus albertensis", sp: "albertensis", col: [215, 190, 95] },
    p6: { name: "Acidithiobacillus sulfuriphilus", sp: "sulfuriphilus", col: [205, 82, 50] }
  };
  N.PLUSH_LINES = {
    p1: ["Azufre amarillo, corazón amarillo", "¡pH 2 y a cantar!"],
    p2: ["Yo aguanto el frío", "¿Alguien prendió el aire?"],
    p3: ["Con este calor, lentes siempre", "45 °C… ¡qué rico!"],
    p4: ["Fe²⁺ → Fe³⁺, ¡feliz Navidad!", "Soy la más famosa del paper"],
    p5: ["Saludos desde Alberta", "Soy subespecie, pero con estilo"],
    p6: ["¡Las púas son adornos!", "Rama profunda, cariño profundo"]
  };

  var C = N.clay;
  function Plush(id, m, img) {
    this.id = id; this.m = m; this.img = img; this.info = N.PLUSH_INFO[id];
    this.scene = m.scene === "a" ? "shelfA" : "shelfB";
    this.px = m.x + m.w / 2; this.py = m.y + 8;   // cuelga del centro de arriba
    this.z = 10; this.awake = 0; this.wantAwake = 0; this.hat = null; this.hatA = 0;
    this.sing = 0; this.talk = 0; this.blink = 0; this.blinkT = N.rnd(1, 3); this.ph = Math.random() * 6;
    this.hop = 0; this.spin = 0; this.danceA = 0; this.x = this.px; this.y = m.y + m.h * 0.35;
  }
  Plush.prototype.update = function (dt) {
    this.awake = N.smooth(this.awake, this.wantAwake, 2, dt);
    this.hatA = N.smooth(this.hatA, this.hat ? 1 : 0, 4, dt);
    this.ph += dt;
    if (this.awake > 0.3) { this.blinkT -= dt; if (this.blinkT < 0) { this.blink = 0.14; this.blinkT = N.rnd(1.5, 4.5); } }
    if (this.blink > 0) this.blink -= dt;
    if (this.talk > 0) { this.talk -= dt; this.sing = 0.4 + 0.4 * Math.sin(N.time * 15); }
    else this.sing = N.smooth(this.sing, this.singT > N.time ? this.singV : 0, 18, dt);
    if (this.hopT > 0) { this.hopT -= dt; this.hop = Math.abs(Math.sin(this.hopT * 9)) * 26; } else this.hop = N.smooth(this.hop, 0, 10, dt);
    this.danceA = N.smooth(this.danceA, this.dance ? 1 : 0, 3, dt);
  };
  Plush.prototype.draw = function (g) {
    var m = this.m, a = this.awake, t = N.time + this.ph;
    var rot = (Math.sin(t * 0.9) * 0.012 + Math.sin(t * 1.7) * 0.025 * a) + Math.sin(t * 3.2) * 0.09 * this.danceA;
    var sy = 1 + Math.sin(t * 2.1) * 0.012 * (0.3 + a) + this.sing * 0.03, sx = 1 / Math.sqrt(sy);
    g.save();
    g.translate(this.px, this.py - this.hop);
    g.rotate(rot); g.scale(sx, sy);
    var ox = -m.w / 2, oy = m.y - this.py;
    g.drawImage(this.img, ox, oy, m.w, m.h);
    var col = this.info.col, lid = "rgb(" + col[0] + "," + col[1] + "," + col[2] + ")";
    // parpados
    if (this.blink > 0 && m.eyes.length) {
      g.fillStyle = lid;
      m.eyes.forEach(function (e) { g.beginPath(); g.ellipse(e[0] - this.px, e[1] - this.py, 16, 15, 0, 0, 7); g.fill(); }, this);
    }
    // boca (al hablar o cantar)
    var mo = this.sing;
    if (mo > 0.06) {
      var mx, my;
      if (this.info.mouth) { mx = this.info.mouth[0]; my = this.info.mouth[1]; }
      else { mx = (m.eyes[0][0] + m.eyes[1][0]) / 2; my = (m.eyes[0][1] + m.eyes[1][1]) / 2 + 48; }
      g.fillStyle = "#3a1212"; g.beginPath(); g.ellipse(mx - this.px, my - this.py, 20 + mo * 4, 6 + mo * 22, 0, 0, 7); g.fill();
      g.fillStyle = "#c95a5a"; g.beginPath(); g.ellipse(mx - this.px, my - this.py + 6 + mo * 10, 10, 4 + mo * 5, 0, 0, 7); g.fill();
    }
    // gorro
    if (this.hatA > 0.02 && this.hat && N.HATS[this.hat]) {
      g.globalAlpha *= this.hatA;
      var L = m.w * 1.05, hy = oy + 22 - (1 - this.hatA) * 80;
      C.draw(g, N.HATS[this.hat], 0, hy, -0.18, L);
    }
    g.restore();
  };
  Plush.prototype.headPos = function () { return [this.px, this.m.y - 20]; };
  Plush.prototype.hit = function (wx, wy) { var m = this.m; return wx > m.x && wx < m.x + m.w && wy > m.y && wy < m.y + Math.min(m.h, 420); };
  Plush.prototype.say = function (text, dur) { dur = dur || Math.max(2.6, text.length * 0.075); this.talk = Math.min(dur * 0.8, 0.3 + text.length * 0.045); N.bubble(this, text, dur); return N.wait(dur); };
  Plush.prototype.singNote = function (dur, v) { this.singT = N.time + Math.max(0.12, dur * 0.85); this.singV = v || 0.9; };
  Plush.prototype.onTap = function () {
    this.wantAwake = 1; this.hopT = 0.6;
    var self = this;
    this.say(N.pick(N.PLUSH_LINES[this.id]), 3).then(function () { if (!N.plush.busy) self.wantAwake = 0.4; });
    N.bubbleLabel(this);
  };

  N.plush = { list: [], byId: {}, busy: false };
  N.loadPlush = function () {
    return N.loadJSON("assets/plush/plush.json?v=" + N.VER).then(function (meta) {
      return Promise.all(Object.keys(meta).map(function (id) {
        return N.loadImg("assets/plush/" + id + ".png?v=" + N.VER).then(function (img) {
          if (!img) return;
          var p = N.add(new Plush(id, meta[id], img));
          N.plush.list.push(p); N.plush.byId[id] = p;
        });
      }));
    });
  };
  N.plush.inScene = function (sc) { return N.plush.list.filter(function (p) { return p.scene === sc; }); };

  /* cartelito con el nombre de la especie (como la etiqueta de cuero) */
  N.bubbleLabel = function (p) {
    var t0 = N.time;
    N.add({ scene: p.scene, layer: "screen", update: function () { if (N.time - t0 > 4.5) this.dead = true; },
      draw: function (g) {
        var k = N.time - t0, a = Math.min(1, k / 0.3, (4.5 - k) / 0.5); if (a <= 0) return;
        var sp = N.cam.toScreen(p.px, p.m.y + Math.min(p.m.h, 400) + 30), F = N.UI;
        g.save(); g.globalAlpha = a; g.font = "italic 700 " + Math.round(22 * F) + "px Georgia, serif"; g.textAlign = "center";
        var w = g.measureText(p.info.name).width + 30 * F, h = 40 * F;
        g.fillStyle = "#8a6a4e"; g.strokeStyle = "#5a4230"; g.lineWidth = 2 * F;
        g.beginPath(); C.rrect(sp[0] - w / 2, sp[1], w, h, 6 * F)(g); g.fill(); g.stroke();
        g.setLineDash([5 * F, 5 * F]); g.strokeStyle = "rgba(255,230,190,0.6)"; g.beginPath(); C.rrect(sp[0] - w / 2 + 5 * F, sp[1] + 5 * F, w - 10 * F, h - 10 * F, 4 * F)(g); g.stroke(); g.setLineDash([]);
        g.fillStyle = "#2a1c12"; g.fillText(p.info.name, sp[0], sp[1] + 27 * F);
        g.restore();
      } });
  };
})();
