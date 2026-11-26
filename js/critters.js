/* Bacterias del paper (Moya-Beltran et al. 2021, clase Acidithiobacillia) y personajes navidenos,
 * todos en plastilina. Comparten la misma forma de moverse (walkTo/say/leave) que las personas. */
(function () {
  "use strict";
  var C = N.clay;

  N.SPECIES = [
    { id: "ferrooxidans", name: "Acidithiobacillus ferrooxidans", col: "#b5652e", lines: ["Fe²⁺ → Fe³⁺… ¡qué rico!", "Me como el fierro de los adornos", "Oxidar es mi pasión"] },
    { id: "thiooxidans", name: "Acidithiobacillus thiooxidans", col: "#e6c43c", lines: ["¿Hay azufre para la once?", "pH 2: el clima perfecto", "Navidad amarilla"] },
    { id: "caldus", name: "Fervidacidithiobacillus caldus", col: "#e8833a", glasses: true, lines: ["¿45 °C? Ideal.", "Diciembre en Santiago: me encanta", "Pásenme el bloqueador"] },
    { id: "copahuensis", name: "Igneacidithiobacillus copahuensis", col: "#d9502e", spikes: true, lines: ["Saludos desde el volcán Copahue", "Yo vengo de un volcán", "¿Alguien dijo fumarola?"] },
    { id: "yellowstonensis", name: "Ca. Igneacidithiobacillus yellowstonensis", col: "#c98a3a", lines: ["Llegué de Yellowstone", "Los géiseres no son lo mismo"] },
    { id: "taiwanensis", name: "Ca. Igneacidithiobacillus taiwanensis", col: "#c94a6a", lines: ["Vine desde Taiwán", "Todavía soy Candidatus…"] },
    { id: "sulfuriphilus", name: "Ambacidithiobacillus sulfuriphilus", col: "#9b6bc9", lines: ["Rama profunda, corazón tierno", "Amo el azufre (está en mi nombre)"] },
    { id: "tepidarius", name: "Thermithiobacillus tepidarius", col: "#c8394a", lines: ["Tibiecito, como me gusta", "Soy el primo lejano"] },
    { id: "ferrivorans", name: "Acidithiobacillus ferrivorans", col: "#5a8fd0", scarf: true, lines: ["Yo aguanto el frío", "Una bufanda y listo"] },
    { id: "ferriphilus", name: "Acidithiobacillus ferriphilus", col: "#a8553a", lines: ["Fierro, fierro, fierro"] },
    { id: "ferridurans", name: "Acidithiobacillus ferridurans", col: "#8a4a3a", lines: ["Duro como el fierro"] },
    { id: "ferrianus", name: "Acidithiobacillus ferrianus", col: "#c27a4a", lines: ["¿Me prestan un clavo?"] },
    { id: "albertensis", name: "A. thiooxidans subsp. albertensis", col: "#e0b04a", lines: ["Saludos desde Alberta"] },
    { id: "sulfurivorans", name: "Acidithiobacillus sulfurivorans", col: "#d6d04a", lines: ["Comer azufre: mi deporte"] },
    { id: "concretivorus", name: "Acidithiobacillus concretivorus", col: "#9a9a92", lines: ["Ñam, concreto", "Este edificio está rico"] },
    { id: "marinus", name: "Acidithiobacillus marinus", col: "#3a9ab0", lines: ["Navego por el lab", "¡Ahoy!"] },
    { id: "montserratensis", name: "Acidithiobacillus montserratensis", col: "#d0703a", lines: ["Otra bacteria volcánica más"] }
  ];
  N.speciesById = function (id) { for (var i = 0; i < N.SPECIES.length; i++) if (N.SPECIES[i].id === id) return N.SPECIES[i]; return N.SPECIES[0]; };

  var U = 300, HATS = {};
  N.buildCritters = function (unitPx, charPx) {
    U = unitPx;
    // bacterias: bastoncito horizontal de largo 1 (origen en el centro)
    N.SPECIES.forEach(function (sp) {
      sp.spr = C.part(-0.62, -0.36, 0.62, 0.36, U, function (g) {
        if (sp.spikes) for (var i = 0; i < 7; i++) { var a = i / 7 * Math.PI * 2 + 0.3; C.ellShape(g, Math.cos(a) * 0.5, Math.sin(a) * 0.25, 0.05, 0.05, "#f2d66b", { prints: 0 }); }
        C.shape(g, C.rrect(-0.5, -0.24, 1, 0.48, 0.24), sp.col, [-0.5, -0.24, 1, 0.48], { hi: 0.4, prints: 2 });
        // textura de tejido (como los peluches)
        g.save(); g.beginPath(); C.rrect(-0.5, -0.24, 1, 0.48, 0.24)(g); g.clip();
        g.strokeStyle = "rgba(0,0,0,0.06)"; g.lineWidth = 0.012;
        for (var x = -0.5; x < 0.5; x += 0.035) { g.beginPath(); g.moveTo(x, -0.25); g.lineTo(x + 0.02, 0.25); g.stroke(); }
        g.restore();
        if (sp.scarf) { C.rrShape(g, 0.05, -0.25, 0.09, 0.5, 0.04, "#d0383e", { prints: 0 }); }
      });
    });
    HATS.santa = C.part(-0.3, -0.45, 0.35, 0.05, U, function (g) {
      C.blobShape(g, [[-0.2, 0], [-0.1, -0.22], [0.08, -0.35], [0.24, -0.3], [0.12, -0.2], [0.18, 0]], "#c8262e", { hi: 0.3 });
      C.rrShape(g, -0.23, -0.04, 0.44, 0.08, 0.04, "#f6f3ee", { prints: 0 });
      C.ellShape(g, 0.26, -0.3, 0.05, 0.05, "#f6f3ee", { prints: 0 });
    });
    HATS.elf = C.part(-0.3, -0.5, 0.45, 0.05, U, function (g) {
      C.blobShape(g, [[-0.2, 0], [-0.05, -0.25], [0.2, -0.4], [0.38, -0.44], [0.2, -0.25], [0.2, 0]], "#2f8a3e", { hi: 0.3 });
      C.rrShape(g, -0.22, -0.04, 0.44, 0.07, 0.035, "#c8262e", { prints: 0 });
    });
    HATS.sailor = C.part(-0.25, -0.2, 0.25, 0.05, U, function (g) {
      C.blobShape(g, [[-0.2, 0], [-0.18, -0.14], [0.18, -0.14], [0.2, 0]], "#f6f3ee", { hi: 0.2 });
      C.rrShape(g, -0.2, -0.04, 0.4, 0.05, 0.02, "#2f5d9e", { prints: 0 });
    });
    HATS.sunglasses = C.part(-0.25, -0.08, 0.25, 0.08, U, function (g) {
      g.fillStyle = "#141414"; g.beginPath(); C.rrect(-0.2, -0.05, 0.17, 0.09, 0.03)(g); g.fill(); g.beginPath(); C.rrect(0.03, -0.05, 0.17, 0.09, 0.03)(g); g.fill(); g.fillRect(-0.05, -0.04, 0.1, 0.02);
    });
    U = charPx || unitPx;
    buildChars();
  };
  N.HATS = HATS;

  /* ---------- base para todo lo que camina ---------- */
  function Mover() {}
  Mover.prototype.walkTo = function (x, y, speed) {
    var self = this; if (this.path) this.path.res();
    return new Promise(function (res) { self.path = { x: x, y: y == null ? self.y : y, speed: speed || 1, res: res }; });
  };
  Mover.prototype.stepPath = function (dt, base) {
    if (!this.path) { this.moving = false; return; }
    var p = this.path, dx = p.x - this.x, dy = p.y - this.y, d = Math.sqrt(dx * dx + dy * dy), sp = base * (p.speed || 1) * dt;
    if (d <= sp) { this.x = p.x; this.y = p.y; this.path = null; this.moving = false; p.res(); }
    else { this.x += dx / d * sp; this.y += dy / d * sp; this.moving = true; if (Math.abs(dx) > 1) this.face = dx > 0 ? 1 : -1; }
  };
  Mover.prototype.say = function (text, dur) { dur = dur || Math.max(2.6, text.length * 0.075); this.talk = Math.min(dur * 0.8, 0.25 + text.length * 0.045); N.bubble(this, text, dur); return N.wait(dur); };
  Mover.prototype.leave = function () { this.targetAlpha = 0; return N.wait(0.9); };
  Mover.prototype.fadeUpdate = function (dt) {
    this.alpha = N.smooth(this.alpha, this.targetAlpha, 4, dt);
    if (this.targetAlpha === 0 && this.alpha < 0.02) this.dead = true;
  };

  /* ---------- Bacteria ---------- */
  function Bact(sp, x, y, o) {
    o = o || {};
    this.sp = sp; this.x = x; this.y = y; this.len = o.len || 150; this.face = o.face || 1;
    this.fly = !!o.fly; this.alt = o.alt || 0; this.hat = o.hat || (sp.id === "marinus" ? "sailor" : null);
    this.alpha = o.fadeIn ? 0 : 1; this.targetAlpha = 1; this.ph = Math.random() * 6; this.talk = 0; this.blink = 0; this.blinkT = N.rnd(1, 4);
    this.label = o.label || 0; this.scene = o.scene || "lab"; this.z = y; this.mood = 0; this.spin = 0; this.jump = 0;
  }
  Bact.prototype = Object.create(Mover.prototype);
  Bact.prototype.update = function (dt) {
    this.fadeUpdate(dt); this.stepPath(dt, this.len * 1.6); this.ph += dt * (this.moving ? 14 : 5);
    this.z = this.y + (this.zb || 0);
    this.blinkT -= dt; if (this.blinkT < 0) { this.blink = 0.12; this.blinkT = N.rnd(2, 5); } if (this.blink > 0) this.blink -= dt;
    if (this.talk > 0) this.talk -= dt; if (this.label > 0) this.label -= dt;
    if (this.jumpT > 0) { this.jumpT -= dt; this.jump = Math.abs(Math.sin(this.jumpT * 8)) * this.len * 0.3; } else this.jump = 0;
  };
  Bact.prototype.pos = function () {
    var bob = this.fly ? Math.sin(N.time * 2 + this.ph * 0.1) * this.len * 0.12 : -Math.abs(Math.sin(this.ph * 0.5)) * this.len * (this.moving ? 0.06 : 0.02);
    return [this.x, this.y - this.alt - this.len * 0.25 + bob - this.jump];
  };
  Bact.prototype.draw = function (g) {
    if (this.alpha < 0.01) return;
    var p = this.pos(), L = this.len, sp = this.sp;
    g.save(); g.globalAlpha *= this.alpha;
    if (!this.fly) C.floorShadow(g, this.x, this.y, L * 1.1, 0.7);
    g.translate(p[0], p[1]); g.rotate(Math.sin(this.ph * 0.25) * 0.06 + this.spin); if (this.face < 0) g.scale(-1, 1);
    // flagelo
    g.strokeStyle = N.shade(sp.col, -0.2); g.lineWidth = L * 0.035; g.lineCap = "round"; g.beginPath();
    for (var i = 0; i <= 14; i++) { var t = i / 14, xx = -L * 0.48 - t * L * 0.75, yy = Math.sin(this.ph - t * 7) * L * 0.08 * t; if (!i) g.moveTo(xx, yy); else g.lineTo(xx, yy); }
    g.stroke();
    g.drawImage(sp.spr.c, sp.spr.x0 * L, sp.spr.y0 * L, sp.spr.w * L, sp.spr.h * L);
    // cara
    var ex = L * 0.25, ey = -L * 0.05;
    for (var s = 0; s < 2; s++) {
      var x = ex + s * L * 0.13;
      if (this.blink > 0) { g.strokeStyle = "#1a1210"; g.lineWidth = L * 0.015; g.beginPath(); g.moveTo(x - L * 0.025, ey); g.lineTo(x + L * 0.025, ey); g.stroke(); }
      else { g.fillStyle = "#1a1210"; g.beginPath(); g.arc(x, ey, L * 0.03, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.8)"; g.beginPath(); g.arc(x + L * 0.01, ey - L * 0.01, L * 0.009, 0, 7); g.fill(); }
    }
    if (sp.glasses) C.draw(g, HATS.sunglasses, ex + L * 0.065, ey, 0, L * 0.7);
    var m = this.talk > 0 ? 0.5 + 0.5 * Math.sin(N.time * 16) : (this.sing || 0);
    if (m > 0.1) { g.fillStyle = "#4a1a1a"; g.beginPath(); g.ellipse(ex + L * 0.065, ey + L * 0.1, L * 0.035, L * 0.04 * m, 0, 0, 7); g.fill(); }
    else { g.strokeStyle = "#3a1a12"; g.lineWidth = L * 0.014; g.beginPath(); g.arc(ex + L * 0.065, ey + L * 0.06, L * 0.035, 0.4, Math.PI - 0.4); g.stroke(); }
    if (this.hat && HATS[this.hat]) C.draw(g, HATS[this.hat], L * 0.1, -L * 0.2, -0.15, L);
    g.restore();
    if (this.label > 0) {
      g.save(); g.globalAlpha = Math.min(1, this.label) * this.alpha; g.font = "italic 600 " + Math.round(L * 0.2) + "px Georgia, serif"; g.textAlign = "center";
      g.fillStyle = "rgba(255,255,255,0.85)"; var w = g.measureText(sp.name).width;
      g.beginPath(); C.rrect(this.x - w / 2 - 10, p[1] + L * 0.3, w + 20, L * 0.3, L * 0.08)(g); g.fill();
      g.fillStyle = "#2a2a2a"; g.fillText(sp.name, this.x, p[1] + L * 0.52); g.restore();
    }
  };
  Bact.prototype.headPos = function () { var p = this.pos(); return [p[0], p[1] - this.len * 0.3]; };
  Bact.prototype.hit = function (wx, wy) { var p = this.pos(); return Math.abs(wx - p[0]) < this.len * 0.6 && Math.abs(wy - p[1]) < this.len * 0.35; };
  Bact.prototype.onTap = function () {
    this.label = 4; this.jumpT = 0.8;
    this.say(N.pick(this.sp.lines), 3);
  };
  N.spawnBact = function (sp, x, y, o) { return N.add(new Bact(sp, x, y, o)); };

  /* ---------- personajes navidenos ---------- */
  var CH = N.CHARS = {};
  function buildChars() {
    var pt = function (b, f) { return C.part(b[0], b[1], b[2], b[3], U, f); };
    // Viejito Pascuero
    CH.pascuero = { h: 1, legs: [-0.09, 0.09], legY: -0.28, gait: 1,
      leg: pt([-0.07, -0.03, 0.1, 0.32], function (g) { C.rrShape(g, -0.05, -0.02, 0.1, 0.24, 0.04, "#b8222a", { prints: 0 }); C.rrShape(g, -0.06, 0.18, 0.15, 0.11, 0.04, "#1c1a1a", { prints: 0 }); }),
      body: pt([-0.4, -1.06, 0.4, -0.18], function (g) {
        [-1, 1].forEach(function (s) { C.rrShape(g, s * 0.3 - 0.06, -0.68, 0.12, 0.3, 0.06, "#c8262e", { prints: 0 }); C.ellShape(g, s * 0.3, -0.36, 0.06, 0.06, "#f6f3ee", { prints: 0 }); });
        C.ellShape(g, 0, -0.48, 0.3, 0.3, "#c8262e", { hi: 0.35 });
        C.rrShape(g, -0.3, -0.46, 0.6, 0.07, 0.03, "#1c1a1a", { prints: 0 }); C.rrShape(g, -0.05, -0.475, 0.1, 0.1, 0.02, "#e8c25a", { prints: 0 });
        C.rrShape(g, -0.04, -0.78, 0.08, 0.6, 0.04, "#f6f3ee", { prints: 0 });
        C.ellShape(g, 0, -0.86, 0.15, 0.14, "#f0c2a0", { hi: 0.4 });
        C.blobShape(g, [[-0.16, -0.86], [-0.15, -0.72], [-0.08, -0.62], [0, -0.58], [0.08, -0.62], [0.15, -0.72], [0.16, -0.86], [0.08, -0.8], [0, -0.79], [-0.08, -0.8]], "#f8f6f2", { hi: 0.15, prints: 0 });
        C.ellShape(g, 0, -0.83, 0.035, 0.03, "#e07a6a", { prints: 0 });
        C.blobShape(g, [[-0.07, -0.79], [0, -0.81], [0.07, -0.79], [0.02, -0.77], [-0.02, -0.77]], "#f8f6f2", { prints: 0 });
        g.fillStyle = "#1e1410"; [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * 0.05, -0.9, 0.015, 0, 7); g.fill(); });
        C.blobShape(g, [[-0.16, -0.94], [-0.1, -1.0], [0.05, -1.04], [0.2, -0.98], [0.26, -0.9], [0.17, -0.95], [0.15, -0.93]], "#c8262e", { hi: 0.3 });
        C.rrShape(g, -0.17, -0.97, 0.34, 0.06, 0.03, "#f6f3ee", { prints: 0 }); C.ellShape(g, 0.27, -0.89, 0.04, 0.04, "#f6f3ee", { prints: 0 });
      }) };
    // reno (de lado)
    CH.reno = { h: 1, quad: true, legY: -0.42, legs: [-0.28, -0.18, 0.2, 0.3],
      leg: pt([-0.04, -0.03, 0.05, 0.45], function (g) { C.rrShape(g, -0.03, -0.02, 0.06, 0.4, 0.03, "#7a4e2e", { prints: 0 }); C.rrShape(g, -0.035, 0.37, 0.075, 0.06, 0.02, "#2a1e18", { prints: 0 }); }),
      body: pt([-0.5, -1.05, 0.62, -0.35], function (g) {
        C.ellShape(g, -0.48, -0.62, 0.05, 0.04, "#f2ece2", { prints: 0 });
        C.ellShape(g, -0.02, -0.56, 0.42, 0.17, "#8a5a36", { hi: 0.3 });
        C.ellShape(g, 0.0, -0.5, 0.25, 0.08, "#c9a27a", { prints: 0, hi: 0.2 });
        C.rrShape(g, 0.3, -0.82, 0.1, 0.3, 0.05, "#8a5a36", { prints: 0 });
        g.save(); g.strokeStyle = "#5a3a22"; g.lineWidth = 0.025; g.lineCap = "round";
        [[0.38, -0.9, 0.3, -1.02], [0.38, -0.9, 0.5, -1.0], [0.33, -0.96, 0.26, -0.97], [0.46, -0.96, 0.52, -0.92]].forEach(function (l) { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); });
        g.restore();
        C.ellShape(g, 0.42, -0.86, 0.12, 0.08, "#8a5a36", { hi: 0.35 });
        C.ellShape(g, 0.33, -0.92, 0.04, 0.025, "#6a4228", { prints: 0 });
        C.ellShape(g, 0.54, -0.85, 0.035, 0.035, Math.random() < 0.35 ? "#d0242c" : "#2a1a14", { prints: 0, hi: 0.6 });
        g.fillStyle = "#1e1410"; g.beginPath(); g.arc(0.44, -0.88, 0.014, 0, 7); g.fill();
        C.rrShape(g, 0.22, -0.72, 0.16, 0.05, 0.02, "#c8262e", { prints: 0 });
        C.ellShape(g, 0.3, -0.66, 0.025, 0.025, "#e8c25a", { prints: 0, hi: 0.6 });
      }) };
    // galleta de jengibre
    CH.galleta = { h: 1, legs: [-0.12, 0.12], legY: -0.3, gait: 1.6,
      leg: pt([-0.1, -0.03, 0.1, 0.32], function (g) { C.rrShape(g, -0.08, -0.02, 0.16, 0.32, 0.08, "#b8743a", { prints: 0, hi: 0.3 }); g.strokeStyle = "#fff"; g.lineWidth = 0.02; g.beginPath(); g.moveTo(-0.05, 0.24); g.quadraticCurveTo(0, 0.2, 0.05, 0.24); g.stroke(); }),
      body: pt([-0.45, -1.02, 0.45, -0.22], function (g) {
        C.rrShape(g, -0.42, -0.66, 0.84, 0.15, 0.075, "#b8743a", { hi: 0.3 });
        C.rrShape(g, -0.2, -0.65, 0.4, 0.42, 0.15, "#b8743a", { hi: 0.3 });
        C.ellShape(g, 0, -0.8, 0.2, 0.2, "#b8743a", { hi: 0.35 });
        g.strokeStyle = "#fff"; g.lineWidth = 0.02;
        [-1, 1].forEach(function (s) { g.beginPath(); for (var i = 0; i < 5; i++) g.lineTo(s * (0.3 + i * 0.02), -0.61 + (i % 2 ? 0.03 : -0.03)); g.stroke(); });
        g.beginPath(); g.arc(0, -0.78, 0.09, 0.3, Math.PI - 0.3); g.stroke();
        g.fillStyle = "#fff"; [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * 0.07, -0.85, 0.028, 0, 7); g.fill(); });
        g.fillStyle = "#1a1010"; [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * 0.07 + 0.01, -0.85, 0.013, 0, 7); g.fill(); });
        ["#d0242c", "#2f8a3e", "#f2c94c"].forEach(function (c, i) { C.ellShape(g, 0, -0.55 + i * 0.1, 0.03, 0.03, c, { prints: 0, hi: 0.6 }); });
      }) };
    // mono de nieve
    CH.nieve = { h: 1, legs: null, gait: 0.6,
      body: pt([-0.45, -1.1, 0.45, 0.02], function (g) {
        C.ellShape(g, 0, -0.2, 0.3, 0.2, "#f4f7fa", { hi: 0.4, sh: 0.25 });
        g.save(); g.strokeStyle = "#5a3a22"; g.lineWidth = 0.025; g.beginPath(); g.moveTo(-0.18, -0.48); g.lineTo(-0.42, -0.62); g.moveTo(0.18, -0.48); g.lineTo(0.42, -0.64); g.lineTo(0.46, -0.7); g.stroke(); g.restore();
        C.ellShape(g, 0, -0.5, 0.22, 0.16, "#f4f7fa", { hi: 0.4, sh: 0.25 });
        C.ellShape(g, 0, -0.76, 0.16, 0.13, "#f4f7fa", { hi: 0.4, sh: 0.25 });
        C.rrShape(g, -0.16, -0.66, 0.32, 0.06, 0.03, "#c8262e", { prints: 0 }); C.rrShape(g, 0.05, -0.64, 0.06, 0.16, 0.03, "#c8262e", { prints: 0 });
        g.fillStyle = "#1e1e1e"; [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * 0.05, -0.8, 0.018, 0, 7); g.fill(); });
        [0, 1, 2].forEach(function (i) { g.beginPath(); g.arc(0, -0.55 + i * 0.07, 0.016, 0, 7); g.fill(); });
        C.blobShape(g, [[0, -0.77], [0.16, -0.75], [0, -0.73]], "#f07a2a", { prints: 0 });
        C.rrShape(g, -0.17, -0.89, 0.34, 0.03, 0.01, "#1e1e1e", { prints: 0 }); C.rrShape(g, -0.1, -1.06, 0.2, 0.18, 0.02, "#1e1e1e", { prints: 0, hi: 0.2 });
        g.fillStyle = "#c8262e"; g.fillRect(-0.1, -0.93, 0.2, 0.03);
      }) };
    // gruñon verde (peludo, con gorro caido)
    CH.grunon = { h: 1, legs: [-0.08, 0.08], legY: -0.3, gait: 0.8, sneak: true,
      leg: pt([-0.05, -0.03, 0.12, 0.32], function (g) { C.rrShape(g, -0.03, -0.02, 0.06, 0.28, 0.03, "#5e8f2e", { prints: 0 }); C.ellShape(g, 0.03, 0.28, 0.07, 0.03, "#4f7a26", { prints: 0 }); }),
      body: pt([-0.38, -1.12, 0.45, -0.22], function (g) {
        var fur = function (cx, cy, rx, ry, n) { for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; C.ellShape(g, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 0.05, 0.05, "#6aa034", { prints: 0, edge: false, rim: 0.3 }); } };
        fur(0, -0.48, 0.22, 0.22, 16); C.ellShape(g, 0, -0.48, 0.24, 0.24, "#6aa034", { hi: 0.3 });
        C.ellShape(g, 0.02, -0.45, 0.13, 0.15, "#8fc25a", { prints: 0 });
        fur(0, -0.82, 0.13, 0.13, 10); C.ellShape(g, 0, -0.82, 0.16, 0.15, "#6aa034", { hi: 0.35 });
        g.fillStyle = "#f2e04a"; [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(s * 0.06 + 0.02, -0.85, 0.045, 0.035, 0, 0, 7); g.fill(); });
        g.fillStyle = "#8a2a1a"; [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * 0.06 + 0.035, -0.85, 0.018, 0, 7); g.fill(); });
        g.strokeStyle = "#3a5a1a"; g.lineWidth = 0.018; [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(s * 0.11 + 0.02, -0.91); g.lineTo(s * 0.02 + 0.02, -0.89); g.stroke(); });
        g.strokeStyle = "#2a3a12"; g.lineWidth = 0.016; g.beginPath(); g.moveTo(-0.08, -0.76); g.quadraticCurveTo(0.03, -0.7, 0.12, -0.8); g.stroke();
        C.blobShape(g, [[-0.15, -0.92], [-0.05, -1.03], [0.15, -1.06], [0.33, -0.98], [0.4, -0.86], [0.3, -0.92], [0.14, -0.95]], "#c8262e", { hi: 0.3 });
        C.rrShape(g, -0.16, -0.96, 0.3, 0.06, 0.03, "#f6f3ee", { prints: 0 }); C.ellShape(g, 0.41, -0.84, 0.045, 0.045, "#f6f3ee", { prints: 0 });
        [-1, 1].forEach(function (s) { C.rrShape(g, s * 0.24 - 0.035, -0.6, 0.07, 0.25, 0.035, "#6aa034", { prints: 0 }); });
      }) };
    // duende
    CH.duende = { h: 1, legs: [-0.07, 0.07], legY: -0.32, gait: 1.3,
      leg: pt([-0.06, -0.03, 0.14, 0.34], function (g) { C.rrShape(g, -0.04, -0.02, 0.08, 0.28, 0.04, "#f6f3ee", { prints: 0 }); g.fillStyle = "#c8262e"; for (var y = 0.02; y < 0.26; y += 0.07) g.fillRect(-0.04, y, 0.08, 0.03); C.blobShape(g, [[-0.05, 0.25], [0.08, 0.24], [0.14, 0.2], [0.11, 0.3], [-0.05, 0.31]], "#2f7a3e", { prints: 0 }); }),
      body: pt([-0.35, -1.1, 0.45, -0.26], function (g) {
        C.blobShape(g, [[-0.18, -0.68], [0.18, -0.68], [0.24, -0.3], [0.1, -0.34], [0, -0.28], [-0.1, -0.34], [-0.24, -0.3]], "#2f8a3e", { hi: 0.3 });
        C.rrShape(g, -0.2, -0.47, 0.4, 0.06, 0.02, "#2a1e18", { prints: 0 }); C.rrShape(g, -0.04, -0.48, 0.08, 0.08, 0.01, "#e8c25a", { prints: 0 });
        [-1, 1].forEach(function (s) { C.blobShape(g, [[s * 0.14, -0.84], [s * 0.27, -0.92], [s * 0.15, -0.78]], "#f0c2a0", { prints: 0 }); });
        C.ellShape(g, 0, -0.82, 0.15, 0.15, "#f0c2a0", { hi: 0.4 });
        g.fillStyle = "#1e1410"; [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * 0.05 + 0.01, -0.84, 0.018, 0, 7); g.fill(); });
        g.strokeStyle = "#8a3a2a"; g.lineWidth = 0.014; g.beginPath(); g.arc(0.01, -0.79, 0.05, 0.3, Math.PI - 0.3); g.stroke();
        g.save(); g.globalAlpha = 0.3; g.fillStyle = "#e05a5a"; [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * 0.09, -0.78, 0.03, 0, 7); g.fill(); }); g.restore();
        C.blobShape(g, [[-0.16, -0.9], [-0.02, -1.0], [0.2, -1.05], [0.38, -1.02], [0.22, -0.96], [0.16, -0.9]], "#2f8a3e", { hi: 0.3 });
        C.rrShape(g, -0.17, -0.93, 0.34, 0.05, 0.025, "#c8262e", { prints: 0 }); C.ellShape(g, 0.39, -1.02, 0.035, 0.035, "#f2c94c", { prints: 0 });
      }) };
    // cascanueces
    CH.cascanueces = { h: 1, legs: [-0.07, 0.07], legY: -0.36, gait: 0.9, stiff: true,
      leg: pt([-0.06, -0.03, 0.12, 0.38], function (g) { C.rrShape(g, -0.045, -0.02, 0.09, 0.3, 0.02, "#f6f3ee", { prints: 0 }); C.rrShape(g, -0.05, 0.24, 0.13, 0.12, 0.03, "#1c1a1a", { prints: 0 }); }),
      body: pt([-0.3, -1.12, 0.3, -0.3], function (g) {
        C.rrShape(g, -0.16, -0.68, 0.32, 0.34, 0.05, "#c8262e", { hi: 0.3 });
        g.fillStyle = "#f2c94c"; for (var i = 0; i < 4; i++) { g.beginPath(); g.arc(0, -0.62 + i * 0.08, 0.015, 0, 7); g.fill(); }
        C.rrShape(g, -0.18, -0.4, 0.36, 0.06, 0.02, "#1c1a1a", { prints: 0 });
        [-1, 1].forEach(function (s) { C.rrShape(g, s * 0.2 - 0.04, -0.66, 0.08, 0.3, 0.03, "#c8262e", { prints: 0 }); C.ellShape(g, s * 0.2, -0.66, 0.06, 0.03, "#f2c94c", { prints: 0 }); });
        C.rrShape(g, -0.12, -0.88, 0.24, 0.22, 0.04, "#f0c8a8", { hi: 0.35 });
        C.rrShape(g, -0.1, -0.76, 0.2, 0.07, 0.01, "#f6f3ee", { prints: 0 }); g.strokeStyle = "#999"; g.lineWidth = 0.006; for (i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-0.08 + i * 0.033, -0.76); g.lineTo(-0.08 + i * 0.033, -0.69); g.stroke(); }
        C.blobShape(g, [[-0.1, -0.79], [0, -0.77], [0.1, -0.79], [0.06, -0.75], [0, -0.76], [-0.06, -0.75]], "#f6f3ee", { prints: 0 });
        g.fillStyle = "#1e1410"; [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * 0.045, -0.83, 0.014, 0, 7); g.fill(); });
        C.ellShape(g, 0, -0.81, 0.02, 0.018, "#e08a7a", { prints: 0 });
        C.rrShape(g, -0.13, -1.1, 0.26, 0.24, 0.03, "#1c1a1a", { hi: 0.2 }); C.rrShape(g, -0.13, -0.91, 0.26, 0.04, 0.01, "#f2c94c", { prints: 0 });
      }) };
    // monito (de la pagina monito) con gorro
    CH.monito = { h: 1, legs: [-0.08, 0.08], legY: -0.3, gait: 1.4,
      leg: pt([-0.06, -0.03, 0.12, 0.32], function (g) { C.rrShape(g, -0.04, -0.02, 0.08, 0.27, 0.04, "#7a4e2e", { prints: 0 }); C.ellShape(g, 0.03, 0.27, 0.06, 0.03, "#d9b48a", { prints: 0 }); }),
      body: pt([-0.5, -1.08, 0.38, -0.24], function (g) {
        g.save(); g.strokeStyle = "#7a4e2e"; g.lineWidth = 0.05; g.lineCap = "round"; g.beginPath(); g.moveTo(-0.15, -0.35); g.bezierCurveTo(-0.45, -0.3, -0.45, -0.7, -0.3, -0.75); g.stroke(); g.restore();
        C.ellShape(g, 0, -0.48, 0.2, 0.22, "#7a4e2e", { hi: 0.3 }); C.ellShape(g, 0.02, -0.45, 0.12, 0.14, "#d9b48a", { prints: 0 });
        [-1, 1].forEach(function (s) { C.ellShape(g, s * 0.17, -0.8, 0.06, 0.06, "#d9b48a", { prints: 0 }); });
        C.ellShape(g, 0, -0.8, 0.17, 0.16, "#7a4e2e", { hi: 0.35 }); C.ellShape(g, 0.02, -0.76, 0.12, 0.1, "#d9b48a", { prints: 0 });
        g.fillStyle = "#1e1410"; [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * 0.05 + 0.02, -0.82, 0.018, 0, 7); g.fill(); });
        g.strokeStyle = "#5a3a22"; g.lineWidth = 0.014; g.beginPath(); g.arc(0.02, -0.75, 0.05, 0.3, Math.PI - 0.3); g.stroke();
        C.blobShape(g, [[-0.16, -0.9], [-0.05, -1.0], [0.12, -1.04], [0.28, -0.96], [0.32, -0.86], [0.2, -0.92], [0.15, -0.9]], "#c8262e", { hi: 0.3 });
        C.rrShape(g, -0.17, -0.94, 0.34, 0.05, 0.025, "#f6f3ee", { prints: 0 }); C.ellShape(g, 0.33, -0.84, 0.04, 0.04, "#f6f3ee", { prints: 0 });
        [-1, 1].forEach(function (s) { C.rrShape(g, s * 0.2 - 0.035, -0.62, 0.07, 0.3, 0.035, "#7a4e2e", { prints: 0 }); });
      }) };
    // pinguino
    CH.pinguino = { h: 1, legs: null, gait: 1, waddle: 0.15,
      body: pt([-0.32, -1.0, 0.36, 0.03], function (g) {
        [-1, 1].forEach(function (s) { C.ellShape(g, s * 0.08 + 0.02, -0.01, 0.08, 0.035, "#f09a2a", { prints: 0 }); });
        C.ellShape(g, 0, -0.45, 0.26, 0.43, "#22252c", { hi: 0.3 });
        C.ellShape(g, 0.03, -0.4, 0.17, 0.34, "#f6f3ee", { prints: 0, hi: 0.2 });
        [-1, 1].forEach(function (s) { C.ellShape(g, s * 0.26, -0.45, 0.05, 0.18, "#22252c", { prints: 0 }); });
        g.fillStyle = "#fff"; [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * 0.07 + 0.04, -0.75, 0.03, 0, 7); g.fill(); });
        g.fillStyle = "#111"; [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * 0.07 + 0.05, -0.75, 0.015, 0, 7); g.fill(); });
        C.blobShape(g, [[0.0, -0.69], [0.14, -0.66], [0.0, -0.63]], "#f09a2a", { prints: 0 });
        C.rrShape(g, -0.2, -0.6, 0.42, 0.06, 0.03, "#2f8ad0", { prints: 0 }); C.rrShape(g, -0.12, -0.58, 0.06, 0.16, 0.03, "#2f8ad0", { prints: 0 });
      }) };
    // trineo con renos (silueta pequena para la ventana)
    CH.trineo = pt([-1.3, -0.5, 0.6, 0.1], function (g) {
      g.fillStyle = "#c8262e"; g.beginPath(); g.moveTo(-0.1, -0.2); g.lineTo(0.5, -0.2); g.quadraticCurveTo(0.6, -0.35, 0.5, -0.45); g.lineTo(0.45, -0.05); g.lineTo(-0.05, -0.05); g.closePath(); g.fill();
      g.strokeStyle = "#e8c25a"; g.lineWidth = 0.025; g.beginPath(); g.moveTo(-0.15, 0.0); g.lineTo(0.55, 0.0); g.quadraticCurveTo(0.62, -0.03, 0.6, -0.08); g.stroke();
      C.ellShape(g, 0.25, -0.32, 0.1, 0.12, "#c8262e", { prints: 0 }); C.ellShape(g, 0.27, -0.45, 0.06, 0.06, "#f0c2a0", { prints: 0 });
      C.ellShape(g, 0.1, -0.3, 0.12, 0.1, "#7a4e2e", { prints: 0 });
      [-0.45, -0.95].forEach(function (x) {
        C.ellShape(g, x, -0.22, 0.17, 0.07, "#8a5a36", { prints: 0 }); C.ellShape(g, x - 0.17, -0.32, 0.05, 0.04, "#8a5a36", { prints: 0 });
        g.strokeStyle = "#5a3a22"; g.lineWidth = 0.02; g.beginPath(); g.moveTo(x - 0.17, -0.35); g.lineTo(x - 0.2, -0.45); g.moveTo(x - 0.15, -0.35); g.lineTo(x - 0.1, -0.44); g.stroke();
        [x - 0.1, x - 0.05, x + 0.06, x + 0.11].forEach(function (lx, i) { g.beginPath(); g.moveTo(lx, -0.18); g.lineTo(lx + (i % 2 ? 0.05 : -0.05), -0.06); g.stroke(); });
      });
      g.strokeStyle = "#5a3a22"; g.lineWidth = 0.01; g.beginPath(); g.moveTo(-0.35, -0.24); g.lineTo(-0.1, -0.15); g.stroke();
    });
  }

  function Char(kind, x, y, o) {
    o = o || {};
    this.k = kind; this.def = CH[kind]; this.x = x; this.y = y; this.z = y; this.hw = o.h || 500; this.face = o.face || 1;
    this.alpha = o.fadeIn ? 0 : 1; this.targetAlpha = 1; this.ph = 0; this.talk = 0; this.scene = o.scene || "lab";
    this.speed = o.speed || 1; this.prop = o.prop || null; this.melt = 0; this.jumpT = 0; this.alt = 0;
  }
  Char.prototype = Object.create(Mover.prototype);
  Char.prototype.update = function (dt) {
    this.fadeUpdate(dt);
    this.stepPath(dt, this.hw * 0.3 * (this.def.gait || 1));
    if (this.moving) this.ph += dt * 7 * (this.def.gait || 1) * (this.path ? this.path.speed : 1);
    this.z = this.y; if (this.talk > 0) this.talk -= dt; if (this.jumpT > 0) this.jumpT -= dt;
  };
  Char.prototype.draw = function (g) {
    if (this.alpha < 0.01) return;
    var D = this.def, H = this.hw, s = Math.sin(this.ph), mv = this.moving ? 1 : 0;
    var hop = this.jumpT > 0 ? Math.abs(Math.sin(this.jumpT * 7)) * 0.12 : 0;
    var bob = (D.sneak ? -Math.abs(s) * 0.05 : -Math.abs(s) * 0.025) * mv - hop - this.alt;
    if (!D.legs && mv) bob = -Math.abs(s) * 0.05;
    g.save(); g.globalAlpha *= this.alpha;
    C.floorShadow(g, this.x, this.y, H * (D.quad ? 0.9 : 0.5), 0.8 * (1 - this.alt * 2));
    g.translate(this.x, this.y + bob * H);
    if (this.face < 0) g.scale(-1, 1);
    var rot = D.waddle ? s * D.waddle * mv : D.legs ? 0 : s * 0.06 * mv;
    if (D.sneak && mv) rot = 0.12;
    g.rotate(rot);
    if (this.melt > 0) g.scale(1 + this.melt * 0.3, 1 - this.melt * 0.5);
    if (D.legs) {
      var amp = D.stiff ? 0.25 : 0.45;
      for (var i = 0; i < D.legs.length; i++) C.draw(g, D.leg, D.legs[i] * H, D.legY * H, (i % 2 ? -1 : 1) * s * amp * mv, H);
    }
    C.draw(g, D.body, 0, 0, 0, H);
    if (this.prop && N.PROPS[this.prop]) C.draw(g, N.PROPS[this.prop], 0.3 * H, -0.42 * H, 0, H * 0.9);
    if (this.talk > 0) { g.fillStyle = "#4a1a1a"; g.beginPath(); g.ellipse(0.02 * H, -0.76 * H, 0.03 * H, 0.02 * H * (1 + Math.sin(N.time * 16)), 0, 0, 7); g.fill(); }
    g.restore();
  };
  Char.prototype.headPos = function () { return [this.x, this.y - this.hw * (1.05 + this.alt)]; };
  Char.prototype.hit = function (wx, wy) { var w = this.hw * (this.def.quad ? 0.55 : 0.3); return Math.abs(wx - this.x) < w && wy < this.y && wy > this.y - this.hw; };
  N.spawnChar = function (kind, x, y, o) { return N.add(new Char(kind, x, y, o)); };
})();
