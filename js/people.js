/* Integrantes del lab en plastilina. Rasgos tomados de las fotos (carpeta Integrantes).
 * Cada persona se arma con piezas (piernas, torso, brazos, cabeza, pelo...) pintadas al cargar;
 * al animar solo se rotan y mueven. Unidades: 1 = altura de la persona, origen en los pies. */
(function () {
  "use strict";
  var C = N.clay;

  N.PEOPLE = [
    { id: "raquel", name: "Raquel", role: "pi", skin: "#e2b391", hair: "#3a2519", hs: "longWavy", top: "#5b2d62", pants: "#2c2e39", earrings: "drop" },
    { id: "abraham", name: "Abraham", role: "bio", skin: "#c79673", hair: "#231914", hs: "swept", beard: "full", glasses: "round", top: "#8a9bb0", stripes: "#6c7c92", pants: "#2f3441" },
    { id: "issotta", name: "Issotta", role: "bio", skin: "#e9bd9e", hair: "#5b4030", hs: "short", beard: "short", top: "#55585c", zip: true, pants: "#3b4a63" },
    { id: "camila", name: "Camila", role: "bio", skin: "#e6b897", hair: "#2b1d17", hs: "long", glasses: "clear", lips: "#c8303a", top: "#2b2b36", floral: true, pants: "#262632" },
    { id: "alejandro", name: "Alejandro", role: "lab", skin: "#dcab86", hair: "#2b2019", hs: "short", beard: "stubble", top: "#e29c8c", coat: true, pants: "#3a3f4d" },
    { id: "celia", name: "Celia", role: "lab", skin: "#c28b69", hair: "#1d1512", hs: "long", top: "#8f8f94", necklace: true, pants: "#30333d" },
    { id: "dilanaz", name: "Dilanaz", role: "lab", skin: "#e2b090", hair: "#3a271d", hs: "curlyShort", earrings: "hoop", top: "#b9a9c6", necklace: true, pants: "#3c3a44" },
    { id: "estefania", name: "Estefanía", role: "lab", skin: "#c99474", hair: "#151110", hs: "longSide", top: "#1d1d1f", jacket: "#d99a2b", pants: "#26262c" },
    { id: "gabriel", name: "Gabriel", role: "lab", skin: "#e8bb98", hair: "#4c3424", hs: "wavyMid", top: "#232325", pants: "#44506a" },
    { id: "gustavo", name: "Gustavo", role: "lab", skin: "#cc9676", hair: "#1f1814", hs: "short", beard: "stubble", headphones: "#e4ddd0", top: "#ba7080", pants: "#343a48" },
    { id: "hector", name: "Héctor", role: "lab", skin: "#ba8264", hair: "#141010", hs: "buzz", top: "#3e4146", pants: "#2d3240" },
    { id: "priscilla", name: "Priscilla", role: "lab", skin: "#dcab89", hair: "#4b3527", hs: "long", top: "#6f7458", pants: "#33343a" },
    { id: "sofi", name: "Sofi", role: "lab", skin: "#deb08e", hair: "#2a1c15", hs: "curlyLong", top: "#e3d6c2", stripes: "#a7825a", coat: true, earrings: "small", pants: "#3a3d4a" },
    { id: "yasna", name: "Yasna", role: "lab", skin: "#cb9272", hair: "#2b1e19", hs: "wavyBob", earrings: "drop", top: "#f0eee8", pants: "#3b3c48" }
  ];
  N.personById = function (id) { for (var i = 0; i < N.PEOPLE.length; i++) if (N.PEOPLE[i].id === id) return N.PEOPLE[i]; return null; };

  var U = 600;   // pixeles por unidad al pintar (se ajusta segun pantalla en N.buildPeople)
  var HEAD_Y = -0.15, HR = 0.135, HRY = 0.155;   // cabeza respecto a su pivote (cuello)

  /* ---------- pelo ---------- */
  function bumps(g, pts, r, col, o) {   // pelo crespo: muchas bolitas
    pts.forEach(function (p) { C.ellShape(g, p[0], p[1], r * (p[2] || 1), r * (p[2] || 1), col, o || { prints: 0, rim: 0.2, edge: false }); });
  }
  function hairBack(g, d) {
    var c = d.hair, hs = d.hs;
    if (hs === "long" || hs === "longSide") C.blobShape(g, [[-0.17, -0.25], [0, -0.33], [0.17, -0.25], [0.19, -0.05], [0.17, 0.12], [0, 0.10], [-0.17, 0.12], [-0.19, -0.05]], c, { hi: 0.18 });
    else if (hs === "longWavy") C.blobShape(g, [[-0.18, -0.26], [0, -0.34], [0.18, -0.26], [0.21, -0.08], [0.19, 0.04], [0.21, 0.13], [0, 0.11], [-0.21, 0.13], [-0.19, 0.04], [-0.21, -0.08]], c, { hi: 0.18 });
    else if (hs === "curlyLong") {
      var p = [];
      for (var a = 0; a < 26; a++) { var t = a / 25; p.push([-0.2 + 0.4 * (a % 2 ? t : 1 - t), -0.28 + 0.4 * t, 1 + 0.2 * Math.sin(a)]); }
      C.blobShape(g, [[-0.19, -0.27], [0, -0.35], [0.19, -0.27], [0.23, -0.05], [0.22, 0.12], [0, 0.10], [-0.22, 0.12], [-0.23, -0.05]], c, { hi: 0.15 });
      bumps(g, p.map(function (q) { return [q[0] * 1.05, q[1], q[2]]; }), 0.045, N.shade(c, 0.08));
    } else if (hs === "wavyBob") C.blobShape(g, [[-0.17, -0.25], [0, -0.33], [0.17, -0.25], [0.2, -0.08], [0.19, 0.0], [0, -0.02], [-0.19, 0.0], [-0.2, -0.08]], c, { hi: 0.18 });
  }
  function hairFront(g, d) {
    var c = d.hair, hs = d.hs, top = HEAD_Y - HRY;
    if (hs === "short" || hs === "buzz") {
      var th = hs === "buzz" ? 0.035 : 0.06;
      C.blobShape(g, [[-0.14, -0.15], [-0.142, -0.24], [-0.09, top - th * 0.6], [0.0, top - th], [0.1, top - th * 0.7], [0.142, -0.24], [0.14, -0.15], [0.12, -0.2], [0.05, -0.235], [-0.06, -0.24], [-0.12, -0.2]], c, { hi: 0.22, prints: 0 });
    } else if (hs === "swept") {
      C.blobShape(g, [[-0.142, -0.15], [-0.15, -0.26], [-0.08, top - 0.08], [0.06, top - 0.07], [0.16, -0.27], [0.142, -0.15], [0.12, -0.21], [0.03, -0.245], [-0.08, -0.235], [-0.125, -0.2]], c, { hi: 0.25, prints: 0 });
    } else if (hs === "long" || hs === "longWavy" || hs === "wavyBob") {
      C.blobShape(g, [[-0.15, -0.02], [-0.16, -0.2], [-0.1, top - 0.03], [0.0, top - 0.045], [0.1, top - 0.03], [0.16, -0.2], [0.15, -0.02], [0.115, -0.08], [0.11, -0.2], [0.02, -0.255], [-0.02, -0.255], [-0.11, -0.2], [-0.115, -0.08]], c, { hi: 0.22, prints: 0 });
    } else if (hs === "longSide") {
      C.blobShape(g, [[-0.15, -0.02], [-0.16, -0.2], [-0.1, top - 0.03], [0.02, top - 0.045], [0.12, top - 0.02], [0.16, -0.2], [0.15, -0.02], [0.118, -0.1], [0.1, -0.17], [0.02, -0.2], [-0.07, -0.235], [-0.115, -0.15]], c, { hi: 0.22, prints: 0 });
    } else if (hs === "curlyShort" || hs === "curlyLong" || hs === "wavyMid") {
      var r = hs === "wavyMid" ? 0.05 : 0.045, pts = [];
      var n = 13;
      for (var i = 0; i < n; i++) {
        var a = Math.PI * (1.02 + 0.96 * i / (n - 1));
        pts.push([Math.cos(a) * (HR + 0.01), HEAD_Y + Math.sin(a) * (HRY + 0.02), 1 + 0.25 * Math.sin(i * 2.3)]);
      }
      pts.push([-0.05, -0.25, 1.1], [0.04, -0.255, 1.0], [0.0, -0.28, 1.2], [-0.09, -0.27, 1], [0.09, -0.27, 1]);
      if (hs !== "wavyMid") pts.push([-0.15, -0.12, 0.9], [0.15, -0.12, 0.9]);
      C.blobShape(g, [[-0.14, -0.16], [-0.13, -0.27], [0, top - 0.04], [0.13, -0.27], [0.14, -0.16], [0, -0.24]], c, { hi: 0.15, prints: 0 });
      bumps(g, pts, r, c);
    }
  }
  function beard(g, d) {
    if (d.beard === "full") C.blobShape(g, [[-0.135, -0.17], [-0.12, -0.06], [-0.06, 0.02], [0, 0.04], [0.06, 0.02], [0.12, -0.06], [0.135, -0.17], [0.09, -0.1], [0.04, -0.105], [0, -0.095], [-0.04, -0.105], [-0.09, -0.1]], d.hair, { hi: 0.15, prints: 0 });
    else if (d.beard === "short") C.blobShape(g, [[-0.133, -0.16], [-0.11, -0.06], [-0.05, -0.01], [0, 0.0], [0.05, -0.01], [0.11, -0.06], [0.133, -0.16], [0.09, -0.095], [0.04, -0.1], [0, -0.09], [-0.04, -0.1], [-0.09, -0.095]], d.hair, { hi: 0.15, prints: 0 });
    else if (d.beard === "stubble") {
      g.save(); g.globalAlpha = 0.22; g.fillStyle = d.hair;
      g.beginPath(); g.ellipse(0, -0.06, 0.11, 0.07, 0, 0, Math.PI); g.fill();
      g.restore();
    }
  }
  function glasses(g, d) {
    if (!d.glasses) return;
    g.save();
    if (d.glasses === "round") {
      g.strokeStyle = "#2b2321"; g.lineWidth = 0.011;
      [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * 0.052 + 0.01, -0.165, 0.042, 0, Math.PI * 2); g.stroke(); });
      g.beginPath(); g.moveTo(-0.0, -0.17); g.quadraticCurveTo(0.01, -0.18, 0.02, -0.17); g.stroke();
    } else {
      g.strokeStyle = "rgba(236,222,222,0.95)"; g.lineWidth = 0.012; g.fillStyle = "rgba(255,255,255,0.10)";
      [-1, 1].forEach(function (s) { var p = C.rrect(s * 0.054 - 0.043 + 0.01, -0.205, 0.086, 0.072, 0.02); g.beginPath(); p(g); g.fill(); g.stroke(); });
      g.beginPath(); g.moveTo(0.0, -0.175); g.lineTo(0.02, -0.175); g.stroke();
    }
    g.restore();
  }
  function extras(g, d) {
    if (d.headphones) {
      g.save(); g.strokeStyle = d.headphones; g.lineWidth = 0.028;
      g.beginPath(); g.ellipse(0, HEAD_Y, HR + 0.02, HRY + 0.03, 0, Math.PI * 1.03, Math.PI * 1.97); g.stroke(); g.restore();
      [-1, 1].forEach(function (s) { C.ellShape(g, s * (HR + 0.012), -0.14, 0.04, 0.06, d.headphones, { prints: 0, rim: 0.25 }); });
    }
    if (d.earrings) {
      [-1, 1].forEach(function (s) {
        var x = s * (HR + 0.004), y = -0.09;
        g.save();
        if (d.earrings === "hoop") { g.strokeStyle = "#d4a93a"; g.lineWidth = 0.008; g.beginPath(); g.arc(x, y + 0.025, 0.025, 0, Math.PI * 2); g.stroke(); }
        else if (d.earrings === "drop") { C.ellShape(g, x, y + 0.03, 0.012, 0.024, "#c9c9cf", { prints: 0 }); }
        else { C.ellShape(g, x, y + 0.008, 0.008, 0.008, "#e8d8a0", { prints: 0 }); }
        g.restore();
      });
    }
  }
  function head(g, d) {
    [-1, 1].forEach(function (s) { C.ellShape(g, s * (HR - 0.005), -0.14, 0.03, 0.038, N.shade(d.skin, -0.06), { prints: 0 }); });
    C.ellShape(g, 0, HEAD_Y, HR, HRY, d.skin, { hi: 0.36, sh: 0.25 });
    // mejillas
    g.save(); g.globalAlpha = 0.22; g.fillStyle = "#e06a5a";
    [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(s * 0.078 + 0.01, -0.105, 0.03, 0.02, 0, 0, Math.PI * 2); g.fill(); });
    g.restore();
    // nariz
    C.ellShape(g, 0.016, -0.125, 0.024, 0.028, N.shade(d.skin, -0.04), { prints: 0, rim: 0.3, hi: 0.5 });
    // cejas
    g.save(); g.strokeStyle = N.shade(d.hair, 0.05); g.lineWidth = 0.014;
    [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(s * 0.072 + 0.01, -0.207); g.quadraticCurveTo(s * 0.05 + 0.01, -0.222, s * 0.026 + 0.01, -0.21); g.stroke(); });
    g.restore();
  }

  /* ---------- cuerpo ---------- */
  function torso(g, d, coat) {
    C.rrShape(g, -0.04, -0.37, 0.08, 0.07, 0.03, N.shade(d.skin, -0.08), { prints: 0 });   // cuello
    var top = d.top;
    var body = [[-0.15, -0.31], [-0.06, -0.335], [0.06, -0.335], [0.15, -0.31], [0.155, -0.15], [0.135, 0.02], [-0.135, 0.02], [-0.155, -0.15]];
    if (!coat) {
      C.blobShape(g, body, d.jacket ? d.top : top, { hi: 0.25 });
      g.save(); g.beginPath(); C.blob(body)(g); g.clip();
      if (d.stripes && !d.jacket) { g.strokeStyle = N.rgba(N.hex2rgb(d.stripes), 0.55); g.lineWidth = 0.008; for (var x = -0.16; x < 0.17; x += 0.028) { g.beginPath(); g.moveTo(x, -0.34); g.lineTo(x, 0.03); g.stroke(); } }
      if (d.floral) { for (var i = 0; i < 26; i++) { g.fillStyle = N.pick(["#e9e3ef", "#c9a9c9", "#f2f0e6"]); g.beginPath(); g.arc(N.rnd(-0.15, 0.15), N.rnd(-0.32, 0.01), 0.008, 0, 7); g.fill(); } }
      if (d.zip) { g.strokeStyle = "#2a2c2f"; g.lineWidth = 0.008; g.beginPath(); g.moveTo(0, -0.33); g.lineTo(0, 0.02); g.stroke(); g.fillStyle = "#444"; g.fillRect(-0.03, -0.37, 0.06, 0.05); }
      g.restore();
      if (d.jacket) {
        [-1, 1].forEach(function (s) {
          C.blobShape(g, [[s * 0.155, -0.31], [s * 0.05, -0.335], [s * 0.035, -0.2], [s * 0.05, 0.02], [s * 0.14, 0.02], [s * 0.16, -0.15]], d.jacket, { hi: 0.28 });
        });
      }
      if (d.necklace) { g.save(); g.strokeStyle = "#d8b648"; g.lineWidth = 0.005; g.beginPath(); g.arc(0, -0.36, 0.06, 0.4, Math.PI - 0.4); g.stroke(); g.restore(); }
    } else {
      // delantal blanco abierto: se ve la ropa en la V
      var coatPts = [[-0.155, -0.31], [-0.06, -0.335], [0.06, -0.335], [0.155, -0.31], [0.165, -0.12], [0.165, 0.15], [-0.165, 0.15], [-0.165, -0.12]];
      C.blobShape(g, coatPts, "#f4f2ee", { hi: 0.2, sh: 0.22 });
      C.blobShape(g, [[-0.05, -0.335], [0.05, -0.335], [0.0, -0.17]], top, { prints: 0, rim: 0.2 });
      g.save(); g.strokeStyle = "rgba(120,115,110,0.45)"; g.lineWidth = 0.006;
      g.beginPath(); g.moveTo(-0.055, -0.335); g.lineTo(0, -0.17); g.lineTo(0.055, -0.335); g.stroke();
      g.beginPath(); g.moveTo(0, -0.17); g.lineTo(0, 0.15); g.stroke();
      g.strokeRect(0.05, -0.08, 0.07, 0.06);
      g.fillStyle = "#3b6fb6"; g.fillRect(0.07, -0.095, 0.008, 0.03);   // lapiz en el bolsillo
      g.restore();
    }
  }
  /* tarjeta de identificacion colgada al cuello, con el nombre */
  function badge(g, d) {
    var cx = 0, cy = -0.165, w = 0.12, h = 0.074, col = d.role === "pi" ? "#c8262e" : d.role === "bio" ? "#2f6fb8" : "#2f8a4a";
    g.save();
    g.strokeStyle = col; g.lineWidth = 0.008;
    g.beginPath(); g.moveTo(-0.045, -0.335); g.lineTo(cx - 0.012, cy - h / 2); g.moveTo(0.045, -0.335); g.lineTo(cx + 0.012, cy - h / 2); g.stroke();
    g.fillStyle = "rgba(60,40,40,0.18)"; g.beginPath(); C.rrect(cx - w / 2 + 0.004, cy - h / 2 + 0.005, w, h, 0.01)(g); g.fill();
    g.fillStyle = "#fffdf8"; g.strokeStyle = "rgba(70,50,50,0.5)"; g.lineWidth = 0.003;
    g.beginPath(); C.rrect(cx - w / 2, cy - h / 2, w, h, 0.01)(g); g.fill(); g.stroke();
    g.fillStyle = col; g.fillRect(cx - w / 2 + 0.003, cy - h / 2 + 0.003, w - 0.006, 0.016);
    g.fillStyle = "#c9c2b8"; g.fillRect(cx - 0.012, cy - h / 2 - 0.004, 0.024, 0.008);
    var fs = 0.024; g.font = "bold " + fs + "px 'Trebuchet MS', sans-serif";
    var tw = g.measureText(d.name).width; if (tw > w * 0.88) { fs *= w * 0.88 / tw; g.font = "bold " + fs + "px 'Trebuchet MS', sans-serif"; }
    g.fillStyle = "#2a2020"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(d.name, cx, cy + 0.011);
    g.restore();
  }
  function arm(g, sleeve, skin) {
    C.rrShape(g, -0.036, -0.03, 0.072, 0.27, 0.035, sleeve, { hi: 0.25, prints: 0 });
    C.ellShape(g, 0, 0.27, 0.042, 0.045, skin, { prints: 0, hi: 0.4 });
  }
  function leg(g, pants, shoe) {
    C.rrShape(g, -0.045, -0.03, 0.09, 0.39, 0.04, pants, { hi: 0.2, prints: 0 });
    C.ellShape(g, 0.018, 0.37, 0.066, 0.036, shoe, { prints: 0, hi: 0.3 });
  }

  /* ---------- accesorios navidenos (en espacio de la cabeza) ---------- */
  var ACC = {};
  function buildAcc() {
    ACC.santa = C.part(-0.25, -0.62, 0.32, -0.15, U, function (g) {
      C.blobShape(g, [[-0.14, -0.26], [-0.08, -0.4], [0.05, -0.5], [0.2, -0.47], [0.22, -0.42], [0.1, -0.4], [0.14, -0.27]], "#c8262e", { hi: 0.3 });
      C.rrShape(g, -0.17, -0.3, 0.34, 0.07, 0.035, "#f6f3ee", { hi: 0.15 });
      C.ellShape(g, 0.23, -0.44, 0.045, 0.045, "#f6f3ee", { prints: 0 });
    });
    ACC.elf = C.part(-0.25, -0.65, 0.4, -0.15, U, function (g) {
      C.blobShape(g, [[-0.15, -0.26], [-0.05, -0.42], [0.15, -0.52], [0.3, -0.56], [0.2, -0.45], [0.15, -0.27]], "#2f8a3e", { hi: 0.3 });
      C.rrShape(g, -0.16, -0.3, 0.32, 0.06, 0.03, "#c8262e", { hi: 0.2 });
      C.ellShape(g, 0.31, -0.565, 0.035, 0.035, "#f2c94c", { prints: 0 });
    });
    ACC.beanie = C.part(-0.2, -0.47, 0.2, -0.15, U, function (g) {
      C.blobShape(g, [[-0.15, -0.24], [-0.12, -0.35], [0, -0.4], [0.12, -0.35], [0.15, -0.24]], "#2f5d9e", { hi: 0.3 });
      C.rrShape(g, -0.155, -0.27, 0.31, 0.06, 0.03, "#e9e4dc", { hi: 0.2 });
      C.ellShape(g, 0, -0.42, 0.04, 0.04, "#e9e4dc", { prints: 0 });
    });
    ACC.antlers = C.part(-0.3, -0.55, 0.3, -0.2, U, function (g) {
      [-1, 1].forEach(function (s) {
        g.save(); g.strokeStyle = "#8a5a33"; g.lineWidth = 0.03; g.lineCap = "round";
        g.beginPath(); g.moveTo(s * 0.08, -0.27); g.quadraticCurveTo(s * 0.16, -0.4, s * 0.12, -0.5); g.stroke();
        g.beginPath(); g.moveTo(s * 0.135, -0.38); g.lineTo(s * 0.22, -0.42); g.stroke();
        g.beginPath(); g.moveTo(s * 0.125, -0.45); g.lineTo(s * 0.06, -0.5); g.stroke();
        g.restore();
      });
      C.rrShape(g, -0.15, -0.3, 0.3, 0.035, 0.017, "#7a4a2a", { prints: 0 });
    });
    ACC.scarf = C.part(-0.2, -0.42, 0.2, -0.1, U, function (g) {   // espacio del torso
      C.rrShape(g, -0.12, -0.39, 0.24, 0.07, 0.035, "#b8323a", { hi: 0.25 });
      C.rrShape(g, 0.04, -0.35, 0.06, 0.2, 0.025, "#b8323a", { hi: 0.25 });
      g.save(); g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 0.012;
      for (var y = -0.3; y < -0.17; y += 0.04) { g.beginPath(); g.moveTo(0.04, y); g.lineTo(0.1, y); g.stroke(); }
      g.restore();
    });
    ACC.flower = C.part(-0.25, -0.4, 0.05, -0.15, U, function (g) {   // corona de acebo
      [[-0.12, -0.28], [-0.07, -0.3], [-0.16, -0.25]].forEach(function (p) { C.ellShape(g, p[0], p[1], 0.035, 0.018, "#2f7a3a", { prints: 0 }); });
      C.ellShape(g, -0.11, -0.27, 0.014, 0.014, "#d0242c", { prints: 0 }); C.ellShape(g, -0.095, -0.285, 0.014, 0.014, "#d0242c", { prints: 0 });
    });
  }

  /* ---------- props (en espacio de la mano; tamano en unidades de persona) ---------- */
  var PROPS = N.PROPS = {};
  function buildProps() {
    var P = function (name, box, fn) { PROPS[name] = C.part(box[0], box[1], box[2], box[3], U, fn); };
    P("pipette", [-0.04, -0.2, 0.04, 0.08], function (g) {
      C.rrShape(g, -0.016, -0.12, 0.032, 0.14, 0.012, "#e8e8ea", { prints: 0 });
      C.rrShape(g, -0.012, -0.17, 0.024, 0.05, 0.01, "#3a77c8", { prints: 0 });
      C.blobShape(g, [[-0.008, 0.02], [0.008, 0.02], [0.002, 0.075], [-0.002, 0.075]], "#f0d44a", { prints: 0, rim: 0.3 });
    });
    P("flask", [-0.08, -0.17, 0.08, 0.05], function (g) {
      var col = N.pick(["#5fb3d9", "#e6c43c", "#d96a8a", "#7cc47a", "#b98ad9"]);
      g.save(); g.beginPath(); C.poly([[-0.025, -0.15], [0.025, -0.15], [0.025, -0.08], [0.07, 0.03], [-0.07, 0.03], [-0.025, -0.08]])(g); g.clip();
      g.fillStyle = "rgba(225,240,248,0.45)"; g.fillRect(-0.1, -0.2, 0.2, 0.3);
      g.fillStyle = col; g.globalAlpha = 0.8; g.fillRect(-0.1, -0.02, 0.2, 0.1); g.restore();
      g.save(); g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 0.006; g.beginPath(); C.poly([[-0.025, -0.15], [0.025, -0.15], [0.025, -0.08], [0.07, 0.03], [-0.07, 0.03], [-0.025, -0.08]])(g); g.stroke();
      g.beginPath(); g.moveTo(-0.04, 0.0); g.lineTo(-0.015, -0.07); g.stroke(); g.restore();
    });
    P("mug", [-0.07, -0.08, 0.07, 0.05], function (g) {
      g.save(); g.strokeStyle = "#c33d3d"; g.lineWidth = 0.014; g.beginPath(); g.arc(0.045, -0.015, 0.025, -1.4, 1.4); g.stroke(); g.restore();
      C.rrShape(g, -0.045, -0.06, 0.09, 0.09, 0.015, N.pick(["#c33d3d", "#f2efe8", "#2f6aa8", "#3a8a4a"]), { prints: 0 });
    });
    P("petri", [-0.08, -0.05, 0.08, 0.03], function (g) {
      C.ellShape(g, 0, -0.01, 0.07, 0.025, "rgba(230,236,240,0.9)", { prints: 0, rim: 0.3 });
      C.ellShape(g, 0, -0.012, 0.06, 0.018, "#e9cf8a", { prints: 0 });
      for (var i = 0; i < 9; i++) { g.fillStyle = N.pick(["#f4f0e0", "#d9b25a", "#c9673d"]); g.beginPath(); g.arc(N.rnd(-0.045, 0.045), N.rnd(-0.022, 0.0), 0.006, 0, 7); g.fill(); }
    });
    P("tube", [-0.03, -0.14, 0.03, 0.05], function (g) {
      g.fillStyle = "rgba(230,240,248,0.7)"; g.beginPath(); C.poly([[-0.016, -0.1], [0.016, -0.1], [0.016, 0.02], [0, 0.04], [-0.016, 0.02]])(g); g.fill();
      g.fillStyle = "#e3b23c"; g.fillRect(-0.016, -0.02, 0.032, 0.04);
      C.rrShape(g, -0.02, -0.125, 0.04, 0.03, 0.008, "#f07a2a", { prints: 0 });
    });
    P("box", [-0.16, -0.14, 0.16, 0.06], function (g) {
      C.rrShape(g, -0.14, -0.12, 0.28, 0.16, 0.015, "#c99a5c", { hi: 0.25 });
      g.save(); g.fillStyle = "rgba(120,80,40,0.35)"; g.fillRect(-0.02, -0.12, 0.04, 0.16); g.restore();
    });
    P("gift", [-0.12, -0.17, 0.12, 0.06], function (g) {
      var col = N.pick(["#c8262e", "#2f7a3e", "#2f5d9e", "#d9a12b", "#8a3aa8"]);
      C.rrShape(g, -0.1, -0.11, 0.2, 0.15, 0.02, col, { hi: 0.3 });
      g.fillStyle = "#f2d66b"; g.fillRect(-0.015, -0.11, 0.03, 0.15); g.fillRect(-0.1, -0.05, 0.2, 0.03);
      C.ellShape(g, -0.03, -0.13, 0.035, 0.022, "#f2d66b", { prints: 0 }); C.ellShape(g, 0.03, -0.13, 0.035, 0.022, "#f2d66b", { prints: 0 });
    });
    P("laptop", [-0.14, -0.15, 0.14, 0.04], function (g) {
      C.rrShape(g, -0.12, -0.14, 0.24, 0.15, 0.01, "#3a3d44", { prints: 0 });
      g.fillStyle = "#8fd0ff"; g.fillRect(-0.105, -0.125, 0.21, 0.12);
      g.fillStyle = "#1c2b3a"; for (var i = 0; i < 6; i++) g.fillRect(-0.095, -0.115 + i * 0.018, N.rnd(0.05, 0.18), 0.008);
    });
    P("rack", [-0.13, -0.12, 0.13, 0.04], function (g) {
      for (var i = 0; i < 6; i++) { g.fillStyle = N.pick(["#f07a2a", "#3a77c8", "#7cc47a", "#e6c43c"]); g.fillRect(-0.1 + i * 0.04, -0.11, 0.022, 0.03); g.fillStyle = "rgba(230,240,248,0.8)"; g.fillRect(-0.1 + i * 0.04, -0.08, 0.022, 0.06); }
      C.rrShape(g, -0.12, -0.05, 0.24, 0.05, 0.01, "#ff8a3a", { prints: 0 });
    });
    P("pan", [-0.12, -0.12, 0.12, 0.05], function (g) {   // pan de pascua
      C.ellShape(g, 0, 0.02, 0.11, 0.025, "#f1eee8", { prints: 0 });
      C.blobShape(g, [[-0.09, 0.01], [-0.08, -0.06], [0, -0.09], [0.08, -0.06], [0.09, 0.01]], "#6b3a1e", { hi: 0.3 });
      for (var i = 0; i < 8; i++) { g.fillStyle = N.pick(["#c8262e", "#2f7a3e", "#e8c25a", "#2a1408"]); g.beginPath(); g.arc(N.rnd(-0.07, 0.07), N.rnd(-0.06, 0.0), 0.007, 0, 7); g.fill(); }
      g.fillStyle = "rgba(255,255,255,0.8)"; for (i = 0; i < 12; i++) { g.beginPath(); g.arc(N.rnd(-0.06, 0.06), N.rnd(-0.08, -0.04), 0.004, 0, 7); g.fill(); }
    });
    P("cola", [-0.04, -0.2, 0.04, 0.05], function (g) {   // cola de mono
      g.save(); g.beginPath(); C.poly([[-0.012, -0.18], [0.012, -0.18], [0.012, -0.12], [0.03, -0.09], [0.03, 0.03], [-0.03, 0.03], [-0.03, -0.09], [-0.012, -0.12]])(g);
      g.fillStyle = "rgba(220,235,225,0.55)"; g.fill(); g.clip(); g.fillStyle = "#b98b5a"; g.fillRect(-0.04, -0.07, 0.08, 0.11); g.restore();
      g.fillStyle = "#f4ead8"; g.fillRect(-0.028, -0.04, 0.056, 0.04);
      g.fillStyle = "#6b3a1e"; g.font = "bold 0.02px sans-serif"; g.textAlign = "center"; g.fillText("COLA", 0, -0.025); g.fillText("MONO", 0, -0.006);
    });
    P("ornament", [-0.05, -0.08, 0.05, 0.05], function (g) {
      C.rrShape(g, -0.012, -0.065, 0.024, 0.018, 0.004, "#d4b24a", { prints: 0 });
      C.ellShape(g, 0, -0.01, 0.042, 0.042, N.pick(["#c8262e", "#2f5d9e", "#d9a12b", "#2f7a3e", "#b02a7a"]), { hi: 0.55 });
    });
    P("star", [-0.07, -0.08, 0.07, 0.06], function (g) {
      var pts = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.028 : 0.065; pts.push([Math.cos(a) * r, -0.01 + Math.sin(a) * r]); }
      C.shape(g, C.poly(pts), "#f2c94c", [-0.065, -0.075, 0.13, 0.13], { hi: 0.5, prints: 0 });
    });
    P("tree", [-0.14, -0.38, 0.14, 0.06], function (g) {
      C.rrShape(g, -0.05, -0.02, 0.1, 0.07, 0.015, "#a8552f", { prints: 0 });
      [[0.0, -0.04, 0.12], [0.0, -0.13, 0.1], [0.0, -0.21, 0.075]].forEach(function (l) {
        C.shape(g, C.poly([[-l[2], l[1]], [0, l[1] - 0.13], [l[2], l[1]]]), "#2f7a3e", [-l[2], l[1] - 0.13, l[2] * 2, 0.13], { hi: 0.3, prints: 0 });
      });
      for (var i = 0; i < 9; i++) { g.fillStyle = N.pick(["#c8262e", "#f2c94c", "#5fb3d9", "#f6f3ee"]); g.beginPath(); g.arc(N.rnd(-0.07, 0.07), N.rnd(-0.25, -0.05), 0.011, 0, 7); g.fill(); }
      g.save(); g.translate(0, -0.33); g.scale(0.7, 0.7); g.drawImage(PROPS.star.c, PROPS.star.x0, PROPS.star.y0, PROPS.star.w, PROPS.star.h); g.restore();
    });
    P("ice", [-0.12, -0.13, 0.12, 0.05], function (g) {
      C.blobShape(g, [[-0.1, -0.1], [0.1, -0.1], [0.08, 0.03], [-0.08, 0.03]], "#3a7fd0", { hi: 0.35 });
      for (var i = 0; i < 6; i++) C.ellShape(g, N.rnd(-0.07, 0.07), N.rnd(-0.12, -0.1), 0.02, 0.015, "rgba(235,248,255,0.95)", { prints: 0 });
    });
    P("candy", [-0.06, -0.2, 0.06, 0.05], function (g) {
      g.save(); g.lineCap = "round"; g.lineWidth = 0.024; g.strokeStyle = "#f6f3ee";
      g.beginPath(); g.moveTo(0, 0.03); g.lineTo(0, -0.12); g.arc(-0.03, -0.12, 0.03, 0, Math.PI, true); g.stroke();
      g.setLineDash([0.012, 0.016]); g.strokeStyle = "#d0242c"; g.stroke(); g.restore();
    });
    P("paper", [-0.09, -0.13, 0.09, 0.04], function (g) {
      C.rrShape(g, -0.07, -0.12, 0.14, 0.15, 0.005, "#fbfaf6", { prints: 0, hi: 0.1 });
      g.fillStyle = "#9aa0a8"; for (var i = 0; i < 8; i++) g.fillRect(-0.055, -0.1 + i * 0.016, N.rnd(0.06, 0.11), 0.005);
      g.fillStyle = "#2a2a2a"; g.fillRect(-0.055, -0.112, 0.09, 0.008);
    });
    P("cookie", [-0.06, -0.08, 0.06, 0.05], function (g) {
      C.blobShape(g, [[-0.05, -0.03], [-0.02, -0.04], [-0.02, -0.07], [0.02, -0.07], [0.02, -0.04], [0.05, -0.03], [0.02, -0.01], [0.03, 0.03], [0, 0.01], [-0.03, 0.03], [-0.02, -0.01]], "#b8743a", { prints: 0 });
    });
  }

  /* ---------- armado por persona ---------- */
  N.buildPeople = function (unitPx) {
    U = unitPx;
    buildAcc(); buildProps();
    N.PEOPLE.forEach(function (d) {
      var sl = d.jacket || d.top, shoe = N.pick(["#2a2220", "#f0ede8", "#3a3a40", "#6a4a32"]);
      d.spr = {
        hairBack: C.part(-0.26, -0.4, 0.26, 0.18, U, function (g) { hairBack(g, d); }),
        head: C.part(-0.2, -0.36, 0.2, 0.04, U, function (g) { head(g, d); }),
        headTop: C.part(-0.22, -0.42, 0.22, 0.08, U, function (g) { beard(g, d); hairFront(g, d); glasses(g, d); extras(g, d); }),
        torso: C.part(-0.2, -0.4, 0.2, 0.06, U, function (g) { torso(g, d, false); badge(g, d); }),
        torsoCoat: C.part(-0.2, -0.4, 0.2, 0.2, U, function (g) { torso(g, d, true); badge(g, d); }),
        arm: C.part(-0.06, -0.05, 0.06, 0.33, U, function (g) { arm(g, sl, d.skin); }),
        armCoat: C.part(-0.06, -0.05, 0.06, 0.33, U, function (g) { arm(g, "#f2f0ec", d.skin); }),
        leg: C.part(-0.06, -0.05, 0.1, 0.42, U, function (g) { leg(g, d.pants, shoe); })
      };
    });
  };

  /* Altura en el mundo segun la profundidad (y de los pies) */
  N.depthH = function (y) { return 0.86 * (750 + (y - 1540)); };

  /* ---------- Persona animada ---------- */
  function Person(def, x, y, o) {
    o = o || {};
    this.d = def; this.x = x; this.y = y; this.z = y;
    this.hw = o.hw || N.depthH(y);
    this.face = o.face || 1;
    this.alpha = o.alpha != null ? o.alpha : 1; this.targetAlpha = 1;
    this.coat = o.coat != null ? o.coat : def.role === "lab";   // delantal: todos los de meson; bioinfo y la PI no
    this.acc = o.acc || null;      // santa, elf, beanie, antlers, flower
    this.scarf = !!o.scarf;
    this.desk = o.desk || null;    // {clip}
    this.sit = !!o.desk;
    this.act = "idle"; this.actT = 0;
    this.phase = Math.random() * 6; this.walking = false;
    this.blinkT = N.rnd(1, 4); this.blink = 0;
    this.talk = 0; this.mouth = 0; this.sing = 0;
    this.prop = null; this.prop2 = null;
    this.look = 0; this.lean = 0; this.jump = 0;
    this.armL = 0; this.armR = 0; this.legA = 0; this.bob = 0; this.tilt = 0;
    this.seed = Math.random() * 100;
    def.busy = true; def.actor = this;
  }
  Person.prototype.update = function (dt) {
    var t = N.time + this.seed;
    this.alpha = N.smooth(this.alpha, this.targetAlpha, 4, dt);
    if (this.targetAlpha === 0 && this.alpha < 0.02) { this.dead = true; this.d.busy = false; this.d.actor = null; return; }
    // caminar
    if (this.path) {
      var p = this.path, dx = p.x - this.x, dy = p.y - this.y, dist = Math.sqrt(dx * dx + dy * dy);
      var sp = this.hw * 0.30 * (p.speed || 1) * dt;
      if (dist <= sp) { this.x = p.x; this.y = p.y; this.path = null; this.walking = false; p.res(); }
      else { this.x += dx / dist * sp; this.y += dy / dist * sp; this.walking = true; this.face = dx >= 0 ? 1 : -1; this.phase += dt * 6.2 * (p.speed || 1); }
      if (!this.sit) { this.hw = N.depthH(this.y); }
    }
    this.z = this.y;
    // parpadeo
    this.blinkT -= dt; if (this.blinkT < 0) { this.blink = 0.13; this.blinkT = N.rnd(2, 6); }
    if (this.blink > 0) this.blink -= dt;
    if (this.talk > 0) { this.talk -= dt; this.mouth = 0.5 + 0.5 * Math.sin(t * 17) * Math.sin(t * 7.3); } else if (this.sing > 0) { this.sing -= dt; } else this.mouth = N.smooth(this.mouth, 0, 10, dt);
    if (this.actT > 0) { this.actT -= dt; if (this.actT <= 0 && this.act !== "sleep") this.act = "idle"; }

    // pose segun la accion
    var a = this.act, L = 0, R = 0, bob = 0, lean = 0, tilt = 0, legA = 0, jump = 0;
    if (this.walking) {
      var s = Math.sin(this.phase);
      legA = s * 0.38; L = -s * 0.28; R = s * 0.28; bob = -Math.abs(Math.cos(this.phase)) * 0.012; tilt = s * 0.03;
      if (this.prop && this.propBoth) { L = -0.55; R = -0.55; }
      else if (this.prop) R = -0.45 + s * 0.05;
    } else {
      var br = Math.sin(t * 1.7) * 0.004;   // respira
      bob = br; tilt = Math.sin(t * 0.6) * 0.03;
      if (a === "wave") { R = 2.5 + Math.sin(t * 9) * 0.35; tilt = 0.06; }
      else if (a === "cheer") { L = 2.7 + Math.sin(t * 10) * 0.2; R = 2.7 + Math.sin(t * 10 + 1) * 0.2; jump = Math.abs(Math.sin(t * 5)) * 0.03; }
      else if (a === "pipette") { R = -0.75 + Math.max(0, Math.sin(t * 2.2)) * 0.35; L = -0.6; tilt = 0.05; lean = 0.03; }
      else if (a === "swirl") { R = -0.6 + Math.sin(t * 6) * 0.12; L = 0.05; tilt = Math.sin(t * 3) * 0.05; }
      else if (a === "type") { L = -0.5 + Math.sin(t * 13) * 0.05; R = -0.5 + Math.sin(t * 11 + 2) * 0.05; tilt = -0.04 + Math.sin(t * 0.5) * 0.03; }
      else if (a === "sip") { var k = (Math.sin(t * 0.9) + 1) / 2; R = -0.45 + k * k * 1.9; tilt = -k * 0.08; }
      else if (a === "dance") { tilt = Math.sin(t * 4) * 0.12; L = 1.2 + Math.sin(t * 4) * 0.6; R = 1.2 - Math.sin(t * 4) * 0.6; bob = -Math.abs(Math.sin(t * 4)) * 0.02; lean = Math.sin(t * 4) * 0.05; }
      else if (a === "sway") { tilt = Math.sin(t * 2.2) * 0.08; lean = Math.sin(t * 2.2) * 0.04; L = 0.15; R = 0.15; }
      else if (a === "stretch") { var k2 = Math.min(1, (N.time - this.actStart) / 1.2); L = 2.9 * k2; R = 2.9 * k2; tilt = Math.sin(t * 2) * 0.05; }
      else if (a === "think") { R = -1.3; tilt = 0.1; }
      else if (a === "shrug") { L = 0.9; R = 0.9; tilt = 0.1; }
      else if (a === "sleep") { tilt = 0.3 + Math.sin(t * 0.8) * 0.03; lean = 0.05; L = -0.3; R = -0.3; }
      else if (a === "point") { R = 1.6; tilt = 0.05; }
      else if (a === "hold") { R = -0.45; if (this.propBoth) L = -0.55; }
      else if (a === "facepalm") { R = -2.6; tilt = 0.15; }
      else if (a === "jump") { jump = Math.abs(Math.sin(t * 7)) * 0.08; L = 2.4; R = 2.4; }
      else if (this.prop) { R = -0.45; if (this.propBoth) L = -0.55; }
      if (this.sing > 0) { tilt = Math.sin(t * 2) * 0.07; }
    }
    var r = 12;
    this.armL = N.smooth(this.armL, L, r, dt); this.armR = N.smooth(this.armR, R, r, dt);
    this.legA = this.walking ? legA : N.smooth(this.legA, 0, r, dt);
    this.bob = N.smooth(this.bob, bob, 20, dt); this.lean = N.smooth(this.lean, lean, 8, dt);
    this.tilt = N.smooth(this.tilt, tilt, 8, dt); this.jump = N.smooth(this.jump, jump, 25, dt);
  };
  Person.prototype.draw = function (g) {
    var d = this.d, S = d.spr, H = this.hw;
    if (this.alpha < 0.01) return;
    g.save();
    g.globalAlpha *= this.alpha;
    if (!this.sit) C.floorShadow(g, this.x, this.y, H * 0.42, 0.9);
    if (this.desk) { g.beginPath(); g.rect(this.x - H, this.y - H * 1.5, H * 2, this.desk.clip - (this.y - H * 1.5)); g.clip(); }
    g.translate(this.x, this.y - this.jump * H);
    if (this.face < 0) g.scale(-1, 1);
    var hipY = (-0.40 + this.bob) * H;
    var lean = this.lean;
    // piernas
    if (!this.sit) {
      C.draw(g, S.leg, -0.055 * H, hipY, this.legA, H);
      C.draw(g, S.leg, 0.055 * H, hipY, -this.legA, H);
    }
    // torso y cabeza (inclinacion desde la cadera)
    g.save(); g.translate(0, hipY); g.rotate(lean);
    var arm = this.coat ? S.armCoat : S.arm;
    var headX = 0, headY = -0.33 * H;
    g.save(); g.translate(headX, headY); g.rotate(this.tilt); g.scale(1.1, 1.1); C.draw(g, S.hairBack, 0, 0, 0, H); g.restore();
    C.draw(g, arm, -0.135 * H, -0.3 * H, this.armL, H);   // brazo de atras
    C.draw(g, this.coat ? S.torsoCoat : S.torso, 0, 0, 0, H);
    if (this.scarf) C.draw(g, ACC.scarf, 0, 0, 0, H);
    // cabeza
    g.save(); g.translate(headX, headY); g.rotate(this.tilt); g.scale(1.1, 1.1);
    C.draw(g, S.head, 0, 0, 0, H);
    this.drawFace(g, H);
    C.draw(g, S.headTop, 0, 0, 0, H);
    if (this.acc && ACC[this.acc]) C.draw(g, ACC[this.acc], 0, 0, 0, H);
    this.drawMouth(g, H);
    g.restore();
    // brazo de adelante + objeto en la mano
    var ra = -this.armR;
    C.draw(g, arm, 0.135 * H, -0.3 * H, ra, H);
    if (this.prop && PROPS[this.prop]) {
      var hx = 0.135 * H - Math.sin(ra) * 0.28 * H, hy = -0.3 * H + Math.cos(ra) * 0.28 * H;
      if (this.propBoth) { hx = 0; hy = -0.13 * H; }
      C.draw(g, PROPS[this.prop], hx, hy, this.propRot || 0, H);
    }
    g.restore();
    g.restore();
  };
  Person.prototype.drawFace = function (g, H) {
    var look = (this.look || 0.008) * H, ex = 0.048 * H, ey = -0.165 * H, sh = 0.01 * H;
    var closed = this.blink > 0 || this.act === "sleep";
    for (var s = -1; s <= 1; s += 2) {
      var x = s * ex + sh;
      if (closed) {
        g.strokeStyle = "#2a1c1a"; g.lineWidth = 0.008 * H; g.beginPath(); g.arc(x, ey - 0.004 * H, 0.016 * H, 0.25, Math.PI - 0.25); g.stroke();
      } else {
        g.fillStyle = "#2a1c1a"; g.beginPath(); g.ellipse(x + look * 0.5, ey + 0.004 * H, 0.017 * H, 0.023 * H, 0, 0, 6.3); g.fill();
        g.fillStyle = "rgba(255,255,255,0.95)"; g.beginPath(); g.arc(x + look * 0.5 + 0.006 * H, ey - 0.004 * H, 0.006 * H, 0, 6.3); g.fill();
      }
    }
  };
  Person.prototype.drawMouth = function (g, H) {
    var x = 0.012 * H, y = -0.07 * H, m = this.mouth;
    if (m > 0.08) {
      g.fillStyle = "#5a1e1e"; g.beginPath(); g.ellipse(x, y + 0.004 * H, 0.026 * H, (0.008 + 0.024 * m) * H, 0, 0, 6.3); g.fill();
      g.fillStyle = "#d9686a"; g.beginPath(); g.ellipse(x, y + (0.01 + 0.012 * m) * H, 0.014 * H, 0.008 * m * H, 0, 0, 6.3); g.fill();
    } else {
      g.strokeStyle = this.d.lips || "#6a2a22"; g.lineWidth = (this.d.lips ? 0.012 : 0.009) * H;
      g.beginPath(); g.arc(x, y - 0.018 * H, 0.03 * H, 0.55, Math.PI - 0.55); g.stroke();
    }
    if (this.act === "sleep" && N.time % 3 < 0.05) N.fx && N.fx.zzz(this.x + this.face * 0.1 * H, this.y - H * 1.05);
  };
  Person.prototype.headPos = function () {
    var H = this.hw;
    return [this.x + this.face * 0.0, this.y - H * (this.sit ? 1.06 : 1.06) - this.jump * H];
  };
  Person.prototype.hit = function (wx, wy) {
    var H = this.hw, top = this.y - H * 1.08, bot = this.desk ? this.desk.clip : this.y;
    return wx > this.x - H * 0.2 && wx < this.x + H * 0.2 && wy > top && wy < bot;
  };

  /* --- acciones para los guiones de eventos (devuelven promesas) --- */
  Person.prototype.walkTo = function (x, y, speed) {
    var self = this;
    if (this.path) this.path.res();
    return new Promise(function (res) { self.path = { x: x, y: y == null ? self.y : y, speed: speed || 1, res: res }; });
  };
  Person.prototype.do = function (act, dur) {
    this.act = act; this.actT = dur || 3; this.actStart = N.time;
    return N.wait(dur || 3);
  };
  Person.prototype.say = function (text, dur) {
    dur = dur || Math.max(2.6, text.length * 0.075);
    this.talk = Math.min(dur * 0.8, 0.25 + text.length * 0.045);
    N.bubble(this, text, dur);
    return N.wait(dur);
  };
  Person.prototype.hold = function (prop, both) { this.prop = prop; this.propBoth = !!both; };
  Person.prototype.leave = function () { this.targetAlpha = 0; return N.until(function () { return true; }, 0.9); };
  Person.prototype.faceTo = function (x) { this.face = x >= this.x ? 1 : -1; };

  N.spawnPerson = function (def, x, y, o) {
    var p = new Person(def, x, y, o);
    if (o && o.fadeIn) { p.alpha = 0; p.targetAlpha = 1; }
    return N.add(p);
  };
  N.freePeople = function (filter) {
    return N.PEOPLE.filter(function (d) { return !d.busy && (!filter || filter(d)); });
  };
  N.ACC_LIST = ["santa", "elf", "beanie", "antlers", "flower"];

  /* ---------- globos de dialogo (en pantalla, tamano fijo) ---------- */
  N.bubble = function (who, text, dur, o) {
    o = o || {};
    var b = N.add({ scene: who.scene || N.cam.scene, layer: "screen", t0: N.time, dur: dur, text: text, who: who, think: !!o.think,
      update: function () { if (N.time - this.t0 > this.dur || (who.dead && !o.keep)) this.dead = true; },
      draw: function (g) {
        if (who.alpha != null && who.alpha < 0.3) return;
        var k = (N.time - this.t0), a = Math.min(1, k / 0.25, (this.dur - k) / 0.4);
        if (a <= 0) return;
        var hp = who.headPos ? who.headPos() : [who.x, who.y], sp = N.cam.toScreen(hp[0], hp[1]);
        if (sp[0] < -40 || sp[0] > N.CW + 40) return;   // fuera de cuadro: no se muestra
        var F = N.UI, fs = Math.round(26 * F), pad = 14 * F;
        g.save(); g.globalAlpha = a * 0.96;
        g.font = "600 " + fs + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
        var lines = wrap(g, this.text, 420 * F), w = 0;
        lines.forEach(function (l) { w = Math.max(w, g.measureText(l).width); });
        var bw = w + pad * 2, bh = lines.length * fs * 1.2 + pad * 1.4;
        var bx = N.clamp(sp[0] - bw / 2, 8, N.CW - bw - 8), by = sp[1] - bh - 30 * F - (1 - a) * 10 * F;
        if (by < 8) by = 8;
        g.fillStyle = "rgba(255,253,248,0.95)"; g.strokeStyle = "rgba(60,40,30,0.25)"; g.lineWidth = 2 * F;
        var r = 18 * F;
        g.beginPath(); C.rrect(bx, by, bw, bh, r)(g); g.fill(); g.stroke();
        if (this.think) {
          [[0, 14, 7], [8, 26, 4.5]].forEach(function (q) { g.beginPath(); g.arc(N.clamp(sp[0], bx + 20, bx + bw - 20) + q[0] * F, by + bh + q[1] * F, q[2] * F, 0, 7); g.fill(); g.stroke(); });
        } else {
          var tx = N.clamp(sp[0], bx + 24 * F, bx + bw - 24 * F);
          g.beginPath(); g.moveTo(tx - 10 * F, by + bh - 1); g.lineTo(tx + 2 * F, by + bh + 20 * F); g.lineTo(tx + 12 * F, by + bh - 1); g.closePath(); g.fill();
        }
        g.fillStyle = "#3a2a22"; g.textBaseline = "top"; g.textAlign = "left";
        lines.forEach(function (l, i) { g.fillText(l, bx + pad, by + pad * 0.7 + i * fs * 1.2); });
        g.restore();
      } });
    return b;
  };
  function wrap(g, text, max) {
    var words = text.split(" "), lines = [], cur = "";
    words.forEach(function (w) { var t = cur ? cur + " " + w : w; if (g.measureText(t).width > max && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    return lines;
  }
})();
