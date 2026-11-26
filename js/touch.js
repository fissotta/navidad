/* Todo lo que reacciona al tocarlo: cajones que se abren (y muestran lo que hay adentro),
 * la puerta (a veces entra alguien, a veces... nadie), persianas que suben y bajan, guirnaldas que
 * se mecen, el refrigerador, sillas que giran, la planta, la centrifuga, el termociclador, la
 * incubadora, las repisas, la percha de delantales, las luces del techo, el reloj... */
(function () {
  "use strict";
  var T = N.touch = {}, C = N.clay, L = N.LAB, W = 9600;
  var OUT = "rgba(96,74,74,0.42)";
  function inR(r, x, y) { return x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3]; }
  function say(x, y, txt, d) { N.bubble({ headPos: function () { return [x, y]; }, scene: "lab" }, txt, d || 3.2); }
  var cool = {};
  function cooled(k, s) { if (cool[k] && N.time < cool[k]) return false; cool[k] = N.time + s; return true; }

  /* ---------- guirnalda de pino (se mece) ---------- */
  var HOOKS = 14, SEG = W / HOOKS, pineSpr = null, bowSpr = null, segAmp = [];
  for (var i = 0; i < HOOKS; i++) segAmp.push(0);
  function buildPine(k) {
    pineSpr = C.canvas(SEG * k + 80 * k, 130 * k);
    var g = pineSpr.getContext("2d"); g.scale(k, k); g.translate(40, 0);
    for (var t = 0; t <= 1.0001; t += 0.05) {
      var x = t * SEG, y = 30 + Math.sin(Math.PI * t) * 55;
      g.fillStyle = (Math.round(t * 20) % 2) ? "#3f8a4a" : "#4f9d58";
      g.beginPath(); g.ellipse(x, y, 30, 17, (t - 0.5) * 0.6, 0, 7); g.fill();
      g.fillStyle = "#357a40"; g.beginPath(); g.ellipse(x + 10, y + 6, 18, 10, 0.4, 0, 7); g.fill();
    }
    g.fillStyle = "#f2c94c"; g.beginPath(); g.arc(SEG / 2, 30 + 52, 9, 0, 7); g.fill();
    bowSpr = C.canvas(90 * k, 70 * k);
    g = bowSpr.getContext("2d"); g.scale(k, k); g.translate(45, 20);
    g.fillStyle = "#c8262e"; g.beginPath(); g.ellipse(-22, 0, 22, 13, -0.4, 0, 7); g.ellipse(22, 0, 22, 13, 0.4, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-6, 4); g.lineTo(-20, 42); g.lineTo(-8, 38); g.closePath(); g.moveTo(6, 4); g.lineTo(20, 42); g.lineTo(8, 38); g.closePath(); g.fill();
    g.fillStyle = "#a81e26"; g.beginPath(); g.arc(0, 2, 10, 0, 7); g.fill();
  }

  /* ---------- estado de los objetos ---------- */
  var door = { o: 0, target: 0 };
  var blinds = [{ x0: 4822, x1: 5250, lv: 560, to: 560 }, { x0: 5262, x1: 5658, lv: 1150, to: 1150 }, { x0: 5682, x1: 6078, lv: 980, to: 980 }];
  var fridge = { o: 0, target: 0 };
  var spins = {};   // centrifugas
  var clockSpin = 0, flicker = 0, incub = 0;
  T.blindTop = function (i) { return blinds[i].lv; };
  T.clockExtra = function () { return clockSpin > 0 ? Math.pow(clockSpin / 3, 2) * 720 : 0; };

  /* ---------- cajones ---------- */
  var DRAWERS = [];
  var ITEMS = [
    { n: "parafilm", t: "Aquí hay parafilm" },
    { n: "falcon", t: "¡Tubos Falcon!" },
    { n: "cubetas", t: "Cubetas para el espectro" },
    { n: "puntas", t: "Puntas amarillas… ¡por fin!" },
    { n: "guantes", t: "Guantes talla M (los S se acabaron)" },
    { n: "eppendorf", t: "Eppendorfs de colores" },
    { n: "galleta", t: "¿Quién dejó esta galleta de Navidad aquí?" },
    { n: "calcetin", t: "Un calcetín navideño… ¿de quién es?" },
    { n: "petri", t: "Placas Petri (vacías, por suerte)" },
    { n: "aluminio", t: "Papel aluminio para los matraces" },
    { n: "plumon", t: "Un plumón sin tinta. Clásico." },
    { n: "regalo", t: "¡Un regalo escondido para el amigo secreto!" },
    { n: "bacteria", t: "Shhh… una bacteria durmiendo" },
    { n: "imanes", t: "Imanes de agitación (y uno perdido)" },
    { n: "control", t: "¡El control de la tele estaba aquí!" },
    { n: "cinta", t: "Cinta de enmascarar para rotular" }
  ];
  var itemBag = new N.Bag(ITEMS, 5);
  function icon(g, n, x, y, s) {   // dibujitos de lo que hay en el cajon
    var r = function (xx, yy, w, h, col) { g.beginPath(); C.rrect(x + xx * s, y + yy * s, w * s, h * s, Math.min(w, h) * s * 0.25)(g); g.fillStyle = col; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke(); };
    var c = function (xx, yy, rr, col) { g.beginPath(); g.arc(x + xx * s, y + yy * s, rr * s, 0, 7); g.fillStyle = col; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke(); };
    switch (n) {
      case "parafilm": c(-20, 0, 18, "#d8dde4"); c(-20, 0, 7, "#9aa0a8"); r(5, -14, 40, 28, "#e9edf2"); break;
      case "falcon": for (var i = 0; i < 4; i++) { r(-34 + i * 18, -16, 12, 30, "rgba(230,240,248,0.95)"); r(-35 + i * 18, -20, 14, 7, "#f07a2a"); } break;
      case "cubetas": for (i = 0; i < 5; i++) r(-36 + i * 15, -10, 11, 20, "rgba(220,235,245,0.9)"); break;
      case "puntas": r(-34, -16, 68, 30, "#f0d44a"); for (i = 0; i < 6; i++) c(-24 + i * 10, -4, 2.5, "#c9a82e"); break;
      case "guantes": r(-34, -16, 68, 30, "#5a8fd0"); r(-14, -26, 28, 12, "#9cc4f0"); break;
      case "eppendorf": ["#e05a5a", "#5ab0e0", "#7cc47a", "#f2c94c", "#c08ae0"].forEach(function (col, k) { r(-36 + k * 15, -14, 10, 20, col); }); break;
      case "galleta": g.save(); g.translate(x, y); C.draw(g, N.PROPS.cookie, 0, 0, 0, s * 300); g.restore(); break;
      case "calcetin": r(-20, -24, 22, 30, "#c8262e"); r(-20, 0, 40, 14, "#c8262e"); r(-22, -28, 26, 8, "#f6f3ee"); break;
      case "petri": c(-16, 0, 16, "rgba(230,236,240,0.95)"); c(16, 0, 16, "rgba(230,236,240,0.95)"); break;
      case "aluminio": r(-36, -10, 72, 20, "#c9ced6"); c(-36, 0, 10, "#b4bac4"); break;
      case "plumon": r(-34, -5, 60, 10, "#2f6fc0"); r(24, -6, 12, 12, "#1f4f90"); break;
      case "regalo": r(-18, -18, 36, 30, "#2f8a4a"); r(-3, -18, 6, 30, "#f2c94c"); c(-6, -22, 6, "#f2c94c"); c(6, -22, 6, "#f2c94c"); break;
      case "bacteria": r(-26, -10, 52, 20, "#e6c43c"); c(10, -2, 2.5, "#1a1210"); c(18, -2, 2.5, "#1a1210"); break;
      case "imanes": for (i = 0; i < 4; i++) r(-30 + i * 16, -4, 12, 6, "#f6f3ee"); break;
      case "control": r(-30, -9, 60, 18, "#2b2d33"); c(-16, 0, 3, "#d0242c"); c(-4, 0, 3, "#9aa0a8"); c(8, 0, 3, "#9aa0a8"); break;
      case "cinta": c(0, 0, 18, "#f2e6b8"); c(0, 0, 9, "#fbfaf6"); break;
    }
  }
  function openDrawer(dr, wx) {
    if (dr.o > 0.1 || dr.target > 0) return;
    dr.item = itemBag.next(); dr.target = 1; dr.t0 = N.time;
    N.music.sfx("pop");
    var cx = N.near(dr.r[0] + dr.r[2] / 2, wx), cy = dr.r[1];
    setTimeout(function () {
      say(cx, cy - 20, dr.item.t, 3.6);
      if (dr.item.n === "bacteria") {
        var b = N.spawnBact(N.pick(N.SPECIES), cx, cy + 400, { len: 90, fly: true, alt: 400, fadeIn: true, label: 99 });
        N.wait(2.2).then(function () { return b.say(N.pick(["¡Me despertaste!", "Cinco minutitos más…", "¿Ya es Navidad?"]), 2.5); }).then(function () { return b.walkTo(cx + N.rnd(-500, 500), cy + 500, 0.5); }).then(function () { b.leave(); });
      } else if (dr.item.n === "galleta" && N.chance(0.45)) {
        var y = 1660, gc = N.spawnChar("galleta", cx, y, { h: N.depthH(y) * 0.33, fadeIn: true });
        gc.jumpT = 0.8;
        N.wait(1.6).then(function () { return gc.say("¡No me comas!", 2); }).then(function () { return gc.walkTo(cx + (N.chance(0.5) ? 1 : -1) * 2600, y, 2.2); }).then(function () { gc.leave(); });
      } else if (dr.item.n === "regalo" || dr.item.n === "control") FX().sparkles(cx, cy + 30, 8, 60);
    }, 450);
    N.wait(6).then(function () { dr.target = 0; });
  }
  function FX() { return N.fx; }

  /* ---------- objetos tocables (coordenadas base 0..9600) ---------- */
  var SHELF_TXT = ["Sulfato ferroso", "Medio 9K", "Ácido sulfúrico (¡con cuidado!)", "Tiosulfato de sodio", "Agarosa", "Etanol 70 %", "Buffer TAE 50×", "Azufre elemental", "Glicerol 50 %", "Agua MilliQ"];
  var COAT_TXT = ["Este delantal no es mío…", "¿De quién es este con mancha de azul de metileno?", "Hay un tubo olvidado en el bolsillo", "Delantal con nombre: «NO TOCAR»", "Huele a medio de cultivo"];
  var CUBBY_TXT = ["Carpetas de 2015", "Protocolos de extracción (versión 12)", "El cuaderno de laboratorio de alguien", "Tesis impresas (para el recuerdo)", "Juegos de mesa para la once", "¡Más papel de regalo!"];
  var RX = [];
  function rx(r, fn) { RX.push({ r: r, fn: fn }); }
  function setup() {
    // cajones de los mesones
    [[1420, 3580, 1150], [4120, 4660, 1300], [8880, 9560, 1150]].forEach(function (b) {
      N.benchDrawers(b[0], b[1], b[2]).forEach(function (r) { var d = { r: r, o: 0, target: 0 }; DRAWERS.push(d); rx(r, function (wx) { openDrawer(d, wx); }); });
    });
    // equipos sobre el meson B y F
    rx([1555, 1070, 130, 85], function (wx, wy) { say(wx, wy, "pH " + (1.9 + Math.random() * 0.3).toFixed(2) + " ✓ (acidófilo aprobado)"); });
    rx([1720, 990, 170, 165], function (wx, wy) { say(wx, wy, N.pick(["P1000, P200, P20… ¿y la P10?", "¡Calibren las pipetas!", "Pipeta prestada, pipeta perdida"])); });
    rx([1995, 1060, 170, 95], function (wx, wy) { say(wx, wy, N.pick(["Muestras del Copahue", "Cultivos de A. ferrooxidans", "Rack sin rotular… misterio"])); });
    rx([2325, 1090, 230, 65], function (wx, wy) { say(wx, wy, "¡Recarguen las puntas!"); });
    rx([2895, 1055, 120, 100], function (wx, wy) { spins.b = 3; N.music.sfx("pop"); say(wx, wy, N.pick(["¡Balanceen los tubos!", "14.000 rpm de pura fe", "¡No la abras mientras gira!"])); });
    rx([3295, 1105, 160, 50], function (wx, wy) { say(wx, wy, N.pick(["Tesis_v27_final_FINAL.docx", "Borrador del paper (con comentarios en rojo)", "Protocolo de PCR anotado a mano"])); });
    rx([8925, 1035, 210, 120], function (wx, wy) { say(wx, wy, N.pick(["95 °C… desnaturalizando", "Ciclo 23 de 35", "Termociclador: 1 h 12 min restantes"])); });
    rx([9175, 1065, 140, 90], function (wx, wy) { spins.f = 3; N.music.sfx("pop"); say(wx, wy, N.pick(["Vórtex a fondo", "¡Brrrrrr!"])); });
    rx([9355, 1005, 160, 150], function (wx, wy) { incub = 4; say(wx, wy, N.pick(["30 °C: aquí crecen las cepas", "Incubadora: no abrir sin permiso", "Adentro hay un pan de pascua… ¿por qué?"])); });
    // repisas, percha, cubiculos
    rx([1450, 620, 2100, 340], function (wx, wy) { FX().sparkles(wx, wy, 5, 30); say(wx, wy, N.pick(SHELF_TXT), 2.6); });
    rx([4120, 600, 540, 320], function (wx, wy) { FX().sparkles(wx, wy, 5, 30); say(wx, wy, N.pick(SHELF_TXT), 2.6); });
    rx([4180, 1000, 420, 400], function (wx, wy) {
      say(wx, wy, N.pick(COAT_TXT));
      if (N.chance(0.3) && cooled("coatB", 10)) { var b = N.spawnBact(N.pick(N.SPECIES), wx, 1700, { len: 80, fly: true, alt: 500, fadeIn: true, label: 99 }); N.wait(1.5).then(function () { return b.say("¡Vivía en ese bolsillo!", 2.4); }).then(function () { return b.walkTo(wx + 600, 1700, 0.5); }).then(function () { b.leave(); }); }
    });
    for (var c = 0; c < 3; c++) for (var rw = 0; rw < 3; rw++) rx([8110 + c * 240, 810 + rw * 230, 220, 210], function (wx, wy) { say(wx, wy, N.pick(CUBBY_TXT)); });
    rx([4780, 1340, 1340, 165], function (wx, wy) { say(wx, wy, N.pick(["Aire acondicionado en modo Navidad: 18 °C", "Detrás del mueble hay… polvo", "Aquí se esconden las tapas de los Falcon"])); FX().outsideSnow = 1; setTimeout(function () { FX().outsideSnow = 0; }, 12000); });
    // banderines y copos
    rx([1750, 490, 1500, 210], function (wx, wy) { FX().confetti(wx, wy, 14, 120); say(wx, wy, "¡Feliz Navidad!", 2.4); });
    rx([6500, 490, 750, 170], function (wx, wy) { FX().confetti(wx, wy, 14, 120); say(wx, wy, N.pick(["¡Gracias por este 2026, lab!", "¡Vamos por el 2027!"]), 2.6); });
    [[400, 1300], [4800, 6100], [8100, 8800]].forEach(function (f) {
      rx([f[0] - 40, 320, f[1] - f[0] + 80, 230], function (wx, wy) {
        for (var k = 0; k < 14; k++) FX().add({ type: "snow", x: wx + N.rnd(-80, 80), y: wy + N.rnd(-20, 20), vx: N.rnd(-20, 20), vy: N.rnd(30, 80), s: N.rnd(3, 7), ph: N.rnd(0, 6), life: 3, a: 0.9, top: true });
        if (N.chance(0.4)) say(wx, wy, "Copo de papel hecho en la once", 2.4);
      });
    });
  }

  /* ---------- toque ---------- */
  T.tap = function (wx, wy) {
    var x = N.wrapX(wx);
    // guirnalda de pino
    if (wy > 380 && wy < 520) {
      var si = Math.floor(x / SEG) % HOOKS; segAmp[si] = 1; segAmp[(si + 1) % HOOKS] = 0.6; segAmp[(si + HOOKS - 1) % HOOKS] = 0.6;
      N.music.sfx("bells"); if (N.chance(0.3)) say(wx, wy, N.pick(["Guirnalda de pino (de plástico)", "¡Cuidado, que se cae!"]), 2.2);
      return true;
    }
    // luces de colores
    for (var gI = 0; gI < N.fx.garlandActors.length; gI++) {
      var ga = N.fx.garlandActors[gI], pts = ga.def.pts;
      if (x > pts[0][0] - 20 && x < pts[pts.length - 1][0] + 20 && wy > pts[0][1] - 60 && wy < pts[0][1] + ga.def.sag + 70) { ga.sw = 1; N.fx.nextLights(); N.music.sfx("sparkle"); return true; }
    }
    // luces del techo
    if (wy > 110 && wy < 220 && (x % 1200) > 280 && (x % 1200) < 560) { flicker = 1.6; say(wx, wy + 60, N.pick(["¿Quién tocó el interruptor?", "Se cortó la luz… ah, no.", "Fantasma navideño"]), 2.4); return true; }
    // reloj
    if (inR(L.spots.clock, x, wy)) { clockSpin = 3; var d = new Date(); say(wx, wy, "Son las " + d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2) + (d.getHours() >= 18 ? ". ¡A casa!" : ". ¡A seguir!"), 3); return true; }
    // puerta
    if (inR([1010, 760, 290, 745], x, wy)) { doorVisit(wx); return true; }
    // persianas / ventana
    for (var b = 0; b < blinds.length; b++) {
      var bl = blinds[b];
      if (x > bl.x0 && x < bl.x1 && wy > 530 && wy < 1320) {
        bl.to = bl.lv > 800 ? 560 : N.rnd(1000, 1290); N.music.sfx("pop");
        if (N.chance(0.35)) { FX().outsideSnow = 1; setTimeout(function () { FX().outsideSnow = 0; }, 15000); }
        if (N.chance(0.25) && cooled("sleigh", 60)) N.director.run("trineoVentana");
        return true;
      }
    }
    // refrigerador
    if (inR(L.spots.fridge, x, wy)) {
      if (fridge.target === 0 && fridge.o < 0.1) {
        fridge.target = 1; var fx = N.near(3875, wx);
        say(fx, 640, N.pick(["4 °C: cepas, enzimas y… ¿un pan de pascua?", "¡Cierren el refri!", "Aquí guardamos los villancicos para que no se echen a perder", "Hay un mono de nieve escondido atrás"]), 3.6);
        N.wait(5).then(function () { fridge.target = 0; });
        if (N.chance(0.3) && cooled("fridgeP", 40)) N.wait(1.5).then(function () { N.director.run("pinguino"); });
      }
      return true;
    }
    // objetos varios
    for (var i = 0; i < RX.length; i++) if (inR(RX[i].r, x, wy)) { RX[i].fn(wx, wy); return true; }
    return false;
  };
  // sillas y planta (los objetos de primer plano)
  function fgTap(a, wx) {
    var o = a.o;
    if (a.kind === "chair") {
      a.spin = 1.6; a.rollV = N.rnd(-160, 160); N.music.sfx("boing");
      say(N.near(o.x + o.w / 2, wx), o.y - 20, N.pick(["¡Wiiii!", "¡Más rápido!", "Silla con ruedas = diversión", "Me mareé…"]), 2.2);
      if (N.chance(0.25)) { var b = N.spawnBact(N.pick(N.SPECIES), N.near(o.x + o.w / 2, wx), o.y + o.h - 10, { len: 90, fadeIn: true, label: 99 }); b.jumpT = 0.6; N.wait(1.5).then(function () { return b.say("¡Me caí de la silla!", 2.4); }).then(function () { return b.walkTo(b.x + N.rnd(-600, 600), b.y, 0.6); }).then(function () { b.leave(); }); }
    } else {
      a.shake = 1.4; N.music.sfx("bells"); N.fx.sparkles(N.near(o.x + o.w / 2, wx), o.y + o.h * 0.4, 10, 120);
      say(N.near(o.x + o.w / 2, wx), o.y + 60, N.pick(["Planta navideña oficial del lab", "¡Las esferas tintinean!", "Alguien le puso adornos a la planta", "Riégame, por favor"]), 2.6);
    }
  }

  /* ---------- puerta: a veces entra alguien, a veces… nadie ---------- */
  async function doorVisit(wx) {
    if (door.target > 0 || !cooled("door", 8)) return;
    door.target = 1; N.music.sfx("pop");
    var dx = N.near(1155, wx), r = Math.random();
    await N.wait(1);
    if (r < 0.3) {
      var def = N.freePeople()[0] ? N.pick(N.freePeople()) : null;
      if (def) {
        var p = N.spawnPerson(def, dx, 1520, { fadeIn: true });
        await p.walkTo(dx + 120, 1660);
        await p.say(N.pick(["¡Llegué! ¿Me perdí la once?", "Hola, ¿alguien pidió hielo seco?", "Vengo del bioterio… no pregunten", "¿Ya repartieron el pan de pascua?"]));
        p.walkTo(dx + N.rnd(-2500, 2500), 1660).then(function () { p.leave(); });
      }
    } else if (r < 0.55) {
      var kind = N.pick(["reno", "duende", "monito", "pinguino", "galleta"]), hk = { reno: 0.8, duende: 0.5, monito: 0.42, pinguino: 0.45, galleta: 0.35 }[kind];
      var c = N.spawnChar(kind, dx, 1520, { h: N.depthH(1650) * hk, fadeIn: true });
      await c.walkTo(dx + 150, 1660, 0.8); c.jumpT = 0.6;
      await c.say(N.pick(["¡Hola, lab!", "¿Aquí es la fiesta?", "Me dijeron que había pan de pascua"]));
      c.walkTo(dx + N.rnd(-2500, 2500), 1660, 0.9).then(function () { c.leave(); });
    } else if (r < 0.75) {
      for (var k = 0; k < 20; k++) N.fx.add({ type: "snow", x: dx + N.rnd(-100, 100), y: N.rnd(900, 1400), vx: N.rnd(40, 160), vy: N.rnd(-10, 40), s: N.rnd(3, 7), ph: N.rnd(0, 6), life: 3, a: 0.9, top: true });
      say(dx, 820, N.pick(["…jo… jo… jo…", "¿Hola? … nadie.", "Corrió viento… y olía a galleta de jengibre", "Se escucharon cascabeles en el pasillo"]), 3.4);
    } else {
      var b = N.spawnBact(N.pick(N.SPECIES), dx, 1560, { len: 120, fadeIn: true, label: 99, hat: "santa" });
      await b.walkTo(dx + 150, 1680, 0.7);
      await b.say(N.pick(["¡Me escapé del biorreactor!", "Vine a cantar villancicos", "¿Este es el lab de las acidófilas?"]));
      b.walkTo(dx + N.rnd(-2000, 2000), 1680, 0.7).then(function () { b.leave(); });
    }
    await N.wait(2.5); door.target = 0;
  }

  /* ---------- dibujo y animacion ---------- */
  T.init = function (k) {
    buildPine(k);
    setup();
    N.FG.forEach(function (a) { a.onTap = function () { fgTap(a, N.cam.x + N.cam.vw / 2); }; });
    // pino (pared, detras de todo)
    N.add({ scene: "lab", static: true, z: 0.5, update: function (dt) { for (var i = 0; i < HOOKS; i++) segAmp[i] *= Math.pow(0.35, dt); },
      draw: function (g) {
        var t = N.time, x0 = N.wrapX(N.cam.x) - SEG, dw = SEG + 80;
        for (var i = 0; i < HOOKS; i++) {
          var hx = i * SEG, a = Math.sin(t * 0.7 + i * 1.3) * 0.006 + segAmp[i] * Math.sin(t * 7 + i) * 0.06;
          g.save(); g.translate(hx + SEG / 2, 400); g.rotate(a); g.drawImage(pineSpr, -SEG / 2 - 40, 0, dw, 130); g.restore();
        }
        for (i = 0; i <= HOOKS; i++) g.drawImage(bowSpr, i * SEG - 45, 408, 90, 70);
      } });
    // puerta
    N.add({ scene: "lab", static: true, z: 0.8, update: function (dt) { door.o = N.smooth(door.o, door.target, 5, dt); },
      draw: function (g) {
        var o = door.o, w = 250 * (1 - 0.82 * o);
        g.save(); g.translate(1030, 780); g.transform(w / 250, -0.09 * o, 0, 1, 0, 0);
        var gr = g.createLinearGradient(0, 0, 0, 725); gr.addColorStop(0, N.shade("#d4a06c", -o * 0.25)); gr.addColorStop(1, N.shade("#b98450", -o * 0.25));
        g.beginPath(); C.rrect(0, 0, 250, 725, 4)(g); g.fillStyle = gr; g.fill(); g.strokeStyle = OUT; g.lineWidth = 3; g.stroke();
        g.beginPath(); C.rrect(70, 50, 110, 140, 6)(g); g.fillStyle = "#cfe6f2"; g.fill(); g.stroke();
        g.beginPath(); g.arc(220, 380, 13, 0, 7); g.fillStyle = "#d8c070"; g.fill(); g.stroke();
        g.lineWidth = 24; g.strokeStyle = "#3f8a4a"; g.beginPath(); g.arc(125, 290, 62, 0, 7); g.stroke();
        for (var a = 0; a < 10; a++) { g.fillStyle = a % 2 ? "#d0242c" : "#f2c94c"; g.beginPath(); g.arc(125 + Math.cos(a * 0.63) * 62, 290 + Math.sin(a * 0.63) * 62, 8, 0, 7); g.fill(); }
        g.fillStyle = "#d0242c"; g.beginPath(); g.ellipse(105, 355, 22, 14, 0, 0, 7); g.ellipse(145, 355, 22, 14, 0, 0, 7); g.fill();
        g.beginPath(); C.rrect(75, 210, 100, 40, 4)(g); g.fillStyle = "#fbfaf6"; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
        g.fillStyle = "#3a3a3a"; g.font = "bold 22px sans-serif"; g.textAlign = "center"; g.fillText("LAB", 125, 238);
        g.restore();
      } });
    // persianas
    N.add({ scene: "lab", static: true, z: 1.6, update: function (dt) { blinds.forEach(function (b) { b.lv = N.smooth(b.lv, b.to, 2.5, dt); }); },
      draw: function (g) {
        blinds.forEach(function (b) {
          if (b.lv < 552) return;
          g.fillStyle = "rgba(245,236,205,0.9)"; g.fillRect(b.x0, 545, b.x1 - b.x0, b.lv - 545);
          g.strokeStyle = "rgba(180,165,130,0.35)"; g.lineWidth = 3;
          for (var yy = 575; yy < b.lv - 10; yy += 34) { g.beginPath(); g.moveTo(b.x0, yy); g.lineTo(b.x1, yy); g.stroke(); }
          g.beginPath(); C.rrect(b.x0, b.lv - 14, b.x1 - b.x0, 16, 3)(g); g.fillStyle = "#e8dcb8"; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
          g.strokeStyle = "rgba(120,110,90,0.6)"; g.lineWidth = 2; g.beginPath(); g.moveTo(b.x1 - 30, 545); g.lineTo(b.x1 - 30, b.lv + 60); g.stroke();
          g.fillStyle = "#e8dcb8"; g.beginPath(); g.arc(b.x1 - 30, b.lv + 64, 7, 0, 7); g.fill();
        });
      } });
    // refrigerador abierto: luz fria y neblina
    N.add({ scene: "lab", static: true, z: 2, update: function (dt) {
        fridge.o = N.smooth(fridge.o, fridge.target, 4, dt);
        if (fridge.o > 0.3 && Math.random() < dt * 12) N.fx.add({ type: "smoke", x: N.near(3875) + N.rnd(-150, 150), y: N.rnd(700, 1350), vx: N.rnd(-20, 20), vy: N.rnd(10, 40), s: N.rnd(20, 40), life: 2.2, a: 0.6, c: "rgba(230,245,255,0.35)" });
      },
      draw: function (g) {
        if (fridge.o < 0.02) return;
        g.save(); g.globalAlpha = fridge.o;
        g.fillStyle = "rgba(235,250,255,0.55)"; g.fillRect(3715, 620, 320, 760);
        g.globalCompositeOperation = "lighter"; g.drawImage(C.glow("#bfe8ff"), 3660, 700, 430, 560);
        g.globalCompositeOperation = "source-over";
        // hoja de la puerta abierta hacia la izquierda
        g.fillStyle = "rgba(200,215,225,0.9)"; g.beginPath(); g.moveTo(3715, 620); g.lineTo(3715 - 160 * fridge.o, 600); g.lineTo(3715 - 160 * fridge.o, 1400); g.lineTo(3715, 1380); g.closePath(); g.fill();
        g.strokeStyle = OUT; g.lineWidth = 3; g.stroke();
        g.restore();
      } });
    // cajones abiertos
    N.add({ scene: "lab", static: true, z: 1000, update: function (dt) { DRAWERS.forEach(function (d) { d.o = N.smooth(d.o, d.target, 6, dt); }); },
      draw: function (g) {
        for (var i = 0; i < DRAWERS.length; i++) {
          var d = DRAWERS[i]; if (d.o < 0.02) continue;
          var r = d.r, o = d.o, dy = o * r[3] * 1.05, ex = 10 * o;
          g.fillStyle = "rgba(50,40,40,0.55)"; g.fillRect(r[0], r[1], r[2], r[3]);
          g.fillStyle = "#efe9df"; g.beginPath(); C.rrect(r[0] - ex + 4, r[1] + 6, r[2] + ex * 2 - 8, dy + 4, 4)(g); g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
          if (d.item && o > 0.5) { g.save(); g.globalAlpha = (o - 0.5) * 2; icon(g, d.item.n, r[0] + r[2] / 2, r[1] + 8 + dy * 0.5, r[3] / 42); g.restore(); }
          g.beginPath(); C.rrect(r[0] - ex, r[1] + dy, r[2] + ex * 2, r[3] * (1 + 0.06 * o), 4)(g); g.fillStyle = "#fdfcf9"; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
          g.beginPath(); C.rrect(r[0] + r[2] / 2 - 34, r[1] + dy + 18, 68, 9, 4)(g); g.fillStyle = "#b8b0a8"; g.fill();
        }
      } });
    // centrifugas girando y la incubadora tibia
    N.add({ scene: "lab", static: true, z: 1001, update: function (dt) { for (var k in spins) spins[k] = Math.max(0, spins[k] - dt); incub = Math.max(0, incub - dt); clockSpin = Math.max(0, clockSpin - dt); },
      draw: function (g) {
        [["b", 2955, 1095, 26], ["f", 9245, 1100, 22]].forEach(function (c) {
          var s = spins[c[0]]; if (!s) return;
          g.save(); g.translate(c[1], c[2]); g.rotate(N.time * 25 * Math.min(1, s)); g.strokeStyle = "rgba(60,60,70,0.8)"; g.lineWidth = 5;
          for (var a = 0; a < 3; a++) { g.rotate(Math.PI * 2 / 3); g.beginPath(); g.moveTo(0, 0); g.lineTo(c[3], 0); g.stroke(); }
          g.restore();
        });
        if (incub > 0) { g.save(); g.globalAlpha = Math.min(1, incub) * 0.6; g.globalCompositeOperation = "lighter"; g.drawImage(C.glow("#ffb060"), 9330, 960, 210, 220); g.restore(); }
      } });
    // parpadeo de las luces del techo (sobre toda la pantalla)
    N.add({ scene: "lab", layer: "screen", update: function (dt) { flicker = Math.max(0, flicker - dt); },
      draw: function (g) {
        if (flicker <= 0) return;
        var v = (Math.sin(N.time * 40) > 0.2 ? 0.28 : 0.05) * Math.min(1, flicker);
        g.fillStyle = "rgba(10,12,30," + v + ")"; g.fillRect(0, 0, N.CW, N.CH);
      } });
  };
})();
