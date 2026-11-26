/* Director: decide que pasa y cuando, mientras la camara gira lento por el lab circular.
 * Los eventos aparecen un poco por delante de la camara (asi entran en cuadro). Niveles:
 * comunes (gente trabajando, bacterias), especiales (peluches cantan, pan de pascua...) y raros
 * (easter eggs). Bolsas barajadas: nada se repite hasta pasar por lo demas.
 * Pruebas: ?ev=nombre lanza un evento al empezar; ?x=6000 pone la camara en esa posicion. */
(function () {
  "use strict";
  var D = N.director = {}, L = N.LAB, cam = N.cam, FX = N.fx;

  /* ---------- frases ---------- */
  var LAB_LINES = ["¿Alguien vio mi pipeta de 200?", "Las placas ya están en la estufa", "¿Quién dejó el autoclave andando?", "pH 2, como corresponde",
    "Me faltan puntas amarillas…", "¿Hay medio 9K preparado?", "Esta cepa crece lento, pero crece", "¿Me pasan el sulfato ferroso?", "Voy a sembrar y vuelvo",
    "¿Alguien calibró el pHmetro?", "Otra extracción de ADN y listo", "¡Contaminación no, por favor!", "La PCR salió preciosa", "Gel corriendo, 30 minutos",
    "¿Quién se tomó mi café?", "¡Feliz Navidad, cepas!", "Repique a medio fresco", "¿Cuánto falta para el qPCR?", "Hoy los cultivos están felices"];
  var BIO_LINES = ["¡Ensambló el genoma!", "Segmentation fault… otra vez", "El clúster está lleno", "¿Quién está usando todos los núcleos?", "BLAST: 0 hits. Interesante.",
    "Corriendo el pangenoma…", "git push y a la casa", "Este árbol filogenético quedó precioso", "¿Python o R? Sí.", "Me faltan 3 genomas para el paper",
    "conda install navidad", "El job lleva 3 días en cola", "¡Anotación lista!", "Ojalá el revisor 2 esté de vacaciones"];
  var PI_LINES = ["¿Cómo van esos genomas?", "¿Y el borrador del paper?", "¡Buen trabajo, equipo!", "¿Ya mandaron el abstract?", "Este año fue increíble, gracias a todos", "¡Felices fiestas, lab!", "¿Y las cepas del Copahue?"];
  var ANSWERS = ["¡Casi listo!", "Ehh… en eso estoy", "¡Va súper bien!", "Mañana sin falta", "Falta poquito", "¡Ya casi, profe!"];
  var XMAS_LINES = ["¡Feliz Navidad!", "¿Quién trae el pan de pascua?", "¿Hacemos amigo secreto?", "Hace 32 grados y estamos con gorro", "Que el 2027 traiga muchos papers",
    "Mis cepas también merecen regalo", "¿Ya armaron el arbolito?", "Navidad con pH 2", "¿Hay cola de mono?"];

  /* ---------- donde ocurren las cosas (siempre cerca de la vista, por delante) ---------- */
  D.laneBusy = {}; D.stBusy = {}; D.deskBusy = {};
  function lane() {
    var ids = [0, 1].filter(function (i) { return !D.laneBusy[i]; }); if (!ids.length) return null;
    var i = N.pick(ids); D.laneBusy[i] = true; return { i: i, y: L.walkY[i] + N.rnd(-15, 15) };
  }
  function release(l) { if (l) D.laneBusy[l.i] = false; }
  function hasLane() { return !D.laneBusy[0] || !D.laneBusy[1]; }
  function offL() { return cam.view().x0 - 300; }
  function offR() { return cam.view().x1 + 300; }
  function midX(T, spread) { var v = cam.view(); return v.x0 + v.w * 0.5 + N.ROT * (T || 12) * 0.5 + N.rnd(-1, 1) * v.w * (spread == null ? 0.15 : spread); }
  function station() {   // un meson que este (o vaya a estar) en cuadro
    var v = cam.view(), lo = v.x0 + v.w * 0.25, hi = v.x1 + N.ROT * 12 - v.w * 0.15, c = [];
    L.stations.forEach(function (s, i) { if (D.stBusy[i]) return; var x = N.near(s.x, (lo + hi) / 2); if (x > lo && x < hi) c.push({ i: i, x: x, y: s.y }); });
    return c.length ? N.pick(c) : null;
  }
  function free(filter) { var f = N.freePeople(filter); return f.length ? N.pick(f) : null; }
  function freeN(n, filter) { return N.shuffle(N.freePeople(filter)).slice(0, n); }
  function maybeXmas(o) {
    o = o || {};
    if (N.chance(0.35)) o.acc = N.pick(N.ACC_LIST);
    if (N.chance(0.15)) o.scarf = true;
    return o;
  }
  function side() { return N.chance(0.5) ? "l" : "r"; }
  function sideX(s) { return s === "l" ? offL() : offR(); }
  function other(s) { return s === "l" ? "r" : "l"; }
  async function enter(def, s, x, y, o) {   // entra caminando desde fuera de cuadro
    o = maybeXmas(o || {});
    var p = N.spawnPerson(def, sideX(s), y, o);
    await p.walkTo(x, y);
    return p;
  }
  async function exit(p, s) { await p.walkTo(sideX(s || (N.chance(0.5) ? "l" : "r")), p.y); await p.leave(); }
  function ahead(xb) { var v = cam.view(), x = xb + Math.ceil((v.x0 - 300 - xb) / L.w) * L.w; return x; }   // proxima vez que pasa por delante

  /* ---------- eventos ---------- */
  var EV = D.EVENTS = {};
  function ev(id, tier, run, can) { EV[id] = { id: id, tier: tier, run: run, can: can || function () { return true; } }; }

  // --- comunes ---
  ev("paseo", "c", async function () {
    var l = lane(), def = free(); if (!l || !def) { release(l); return; }
    var s = side(), p = N.spawnPerson(def, sideX(s), l.y, maybeXmas({ coat: def.role === "lab" ? N.chance(0.7) : undefined }));
    if (N.chance(0.6)) p.hold(N.pick(["flask", "petri", "rack", "tube", "mug", "laptop", "paper", "box", "ice", "pipette"]));
    if (p.prop === "box" || p.prop === "ice" || p.prop === "rack") p.propBoth = true;
    await p.walkTo(midX(14), l.y);
    if (N.chance(0.55)) await p.say(N.pick(def.role === "bio" ? BIO_LINES : def.role === "pi" ? PI_LINES : N.chance(0.3) ? XMAS_LINES : LAB_LINES));
    release(l);
    await exit(p, other(s));
  }, hasLane);

  ev("trabajo", "c", async function () {
    var st = station(), def = free(function (d) { return d.role === "lab"; }); if (!st || !def) return;
    D.stBusy[st.i] = true;
    var p = await enter(def, side(), st.x, st.y, { coat: true });
    p.face = N.chance(0.5) ? 1 : -1;
    var act = N.pick(["pipette", "swirl", "pipette"]); p.hold(act === "pipette" ? "pipette" : N.pick(["flask", "tube"]));
    var dur = N.rnd(14, 26), t0 = N.time; p.do(act, dur);
    await N.wait(N.rnd(3, 7));
    if (N.chance(0.6)) await p.say(N.pick(LAB_LINES));
    await N.until(function () { return N.time - t0 > dur; });
    if (N.chance(0.25)) { p.prop = null; await p.do("stretch", 2.2); }
    D.stBusy[st.i] = false;
    await exit(p);
  }, function () { return !!station(); });

  ev("charla", "c", async function () {
    var l = lane(), ds = freeN(2); if (!l || ds.length < 2) { release(l); return; }
    var m = midX(16, 0.1), gap = N.depthH(l.y) * 0.3;
    var a = N.spawnPerson(ds[0], offL(), l.y, maybeXmas()), b = N.spawnPerson(ds[1], offR(), l.y, maybeXmas());
    if (N.chance(0.5)) a.hold("mug"); if (N.chance(0.4)) b.hold("mug");
    await Promise.all([a.walkTo(m - gap, l.y), b.walkTo(m + gap, l.y)]);
    a.face = 1; b.face = -1;
    var talk = [[N.pick(XMAS_LINES), N.pick(["¡Sí!", "Jajaja", "Obvio", "¡Me apunto!", "¿En serio?"])],
      ["¿Cómo te fue con el experimento?", N.pick(["Creció todo… menos lo que quería", "¡Bien!", "Mañana repito", "Mejor ni pregunte"])],
      ["¿Almorzamos?", N.pick(["¡Vamos!", "En 5 minutos", "Tengo que terminar el gel"])],
      ["¿Viste el correo de la profe?", "Sí… hay reunión"],
      ["¿Me ayudas con un análisis?", N.pick(["¡Claro!", "Después de las fiestas", "¿Es en R?"])]];
    var c = N.pick(talk);
    await a.say(c[0]); await b.say(c[1]);
    if (N.chance(0.4)) { a.do("cheer", 1.5); b.do("cheer", 1.5); await N.wait(1.5); }
    release(l);
    await Promise.all([exit(a, "l"), exit(b, "r")]);
  }, hasLane);

  ev("cafe", "c", async function () {
    var st = station(), def = free(); if (!st || !def) return;
    D.stBusy[st.i] = true;
    var p = await enter(def, side(), st.x, st.y, {}); p.hold("mug"); p.do("sip", 12);
    var t0 = N.time;
    N.add({ update: function () { if (N.chance(0.15)) FX.steam(p.x + p.face * p.hw * 0.12, p.y - p.hw * 0.75); if (N.time - t0 > 12 || p.dead) this.dead = true; } });
    if (N.chance(0.5)) { await N.wait(4); await p.say(N.pick(["Ahh, café", "Necesitaba esto", "El café del lab es otra cosa", "¿Alguien más quiere?"])); }
    await N.until(function () { return N.time - t0 > 12; });
    D.stBusy[st.i] = false; await exit(p);
  }, function () { return !!station(); });

  ev("bacteria", "c", async function () {
    var sp = N.pick(N.SPECIES), s = side(), fly = N.chance(0.35), y = N.pick(L.walkY) + 40;
    var b = N.spawnBact(sp, sideX(s), y, { len: N.rnd(120, 170), fly: fly, alt: fly ? N.rnd(150, 400) : 0, label: 99, hat: N.chance(0.5) ? N.pick(["santa", "elf"]) : null });
    await b.walkTo(midX(10), y, 0.8);
    if (N.chance(0.7)) await b.say(N.pick(sp.lines));
    await b.walkTo(sideX(other(s)), y, 0.8); await b.leave();
  });

  ev("luces", "c", async function () { FX.nextLights(); });
  ev("matraz", "c", async function () { FX.bubbleFlask(N.ri(0, L.flasks.length - 1), N.rnd(10, 18), N.pick(["#7cc4ff", "#ffd36a", "#ff8ab0", "#9cff9a", "#c9a0ff"])); }, function () { return cam.sees(2420, 200); });
  ev("tele", "c", async function () { FX.tvNext(); }, function () { return cam.sees(620, 100); });
  ev("nieveVentana", "c", async function () { FX.outsideSnow = 1; await N.wait(N.rnd(30, 50)); FX.outsideSnow = 0; }, function () { return cam.sees(5050, 0) && FX.outsideSnow === 0; });

  // --- especiales ---
  ev("peluchesCantan", "s", function () { return plushShow("sing"); }, function () { return !N.plush.busy; });
  ev("peluchesSaludan", "s", function () { return plushShow("hello"); }, function () { return !N.plush.busy; });
  ev("panDePascua", "s", function () { return bringFood("pan", "¡Llegó el pan de pascua!", ["¡Yo quiero!", "¿Tiene frutas confitadas?", "¡El mejor día del año!", "Guárdenme un pedazo"]); }, hasLane);
  ev("colaDeMono", "s", function () { return bringFood("cola", "¡Traje cola de mono!", ["¡Salud!", "Pero poquito, que hay experimentos", "¡Esa es la receta de la abuela!", "Jajaja"]); }, hasLane);
  ev("amigoSecreto", "s", async function () {
    var l = lane(), ds = freeN(2); if (!l || ds.length < 2) { release(l); return; }
    var m = midX(18, 0.1), gap = N.depthH(l.y) * 0.28;
    var a = N.spawnPerson(ds[0], offL(), l.y, { acc: "santa" }), b = N.spawnPerson(ds[1], offR(), l.y, maybeXmas());
    a.hold("gift", true);
    await Promise.all([a.walkTo(m - gap, l.y), b.walkTo(m + gap, l.y)]);
    a.face = 1; b.face = -1;
    await a.say("¡" + b.d.name + ", soy tu amigo secreto!");
    a.prop = null; b.hold("gift", true); FX.sparkles(b.x, b.y - b.hw * 0.5, 10, 60); N.music.sfx("sparkle");
    await b.say(N.pick(["¡Gracias!", "¡No puede ser!", "¡Justo lo que quería!", "¿Es una pipeta nueva?"]));
    FX.hearts(b.x, b.y - b.hw * 1.1, 5); b.do("cheer", 2); await N.wait(2);
    release(l);
    await Promise.all([exit(a, "l"), exit(b, "r")]);
  }, hasLane);
  ev("ronda", "s", async function () {
    var r = N.personById("raquel"), l = lane(); if (!l || r.busy) { release(l); return; }
    var o2 = free(function (d) { return d.id !== "raquel"; }), m = midX(16, 0.1), H = N.depthH(l.y);
    var p = N.spawnPerson(r, offL(), l.y, maybeXmas()), q = o2 ? N.spawnPerson(o2, offR(), l.y, {}) : null;
    if (q) { q.walkTo(m + H * 0.3, l.y); q.hold(o2.role === "bio" ? "laptop" : "flask"); }
    await p.walkTo(m - H * 0.3, l.y); p.face = 1; if (q) q.face = -1;
    await p.say(N.pick(PI_LINES));
    if (q) { await q.say(N.pick(ANSWERS)); if (N.chance(0.5)) { p.do("cheer", 1.4); await p.say("¡Así me gusta!"); } }
    release(l);
    await Promise.all([exit(p, "l"), q ? exit(q, "r") : null]);
  }, function () { return hasLane() && !N.personById("raquel").busy; });
  ev("paperAceptado", "s", async function () {
    var r = N.personById("raquel"), l = lane(); if (!l || r.busy) { release(l); return; }
    var m = midX(16, 0.1), H = N.depthH(l.y);
    var p = N.spawnPerson(r, offL(), l.y, {}); p.hold("paper");
    var others = freeN(2).map(function (d, i) { var q = N.spawnPerson(d, offR(), l.y, {}); q.walkTo(m + H * (0.35 + i * 0.3), l.y); return q; });
    await p.walkTo(m, l.y); p.face = 1;
    await p.say("¡Equipo! ¡Aceptaron el paper!");
    FX.confetti(m, l.y - H, 40, 200); N.music.sfx("sparkle");
    p.do("cheer", 3); others.forEach(function (q) { q.face = -1; q.do("cheer", 3); });
    if (others[0]) await others[0].say(N.pick(["¡Siiii!", "¡Sin revisión mayor!", "¡A celebrar!"])); else await N.wait(3);
    release(l);
    await Promise.all([exit(p, "l")].concat(others.map(function (q) { return exit(q, "r"); })));
  }, function () { return hasLane() && !N.personById("raquel").busy; });
  ev("bailecito", "s", async function () {
    var l = lane(), ds = freeN(N.ri(2, 3)); if (!l || ds.length < 2) { release(l); return; }
    var m = midX(20, 0.05), H = N.depthH(l.y);
    var ps = ds.map(function (d, i) {
      var x = m + (i - (ds.length - 1) / 2) * H * 0.55, s = i % 2 ? "r" : "l", p = N.spawnPerson(d, sideX(s), l.y, { acc: N.pick(N.ACC_LIST) });
      p.walkTo(x, l.y).then(function () { p.do(N.pick(["dance", "sway"]), 18); });
      p.exitSide = s; return p;
    });
    await N.wait(6); await ps[0].say(N.pick(["¡Esta canción me encanta!", "¡Un bailecito!", "Pausa activa navideña"]));
    for (var i = 0; i < 10; i++) { if (N.chance(0.5)) FX.note(N.pick(ps).x, ps[0].y - ps[0].hw * 1.15); await N.wait(1.2); }
    release(l);
    await Promise.all(ps.map(function (p) { return exit(p, p.exitSide); }));
  }, hasLane);
  ev("conga", "s", async function () {
    var l = lane(); if (!l) return;
    var s = side(), dir = s === "l" ? -1 : 1, x0 = sideX(s), sps = N.shuffle(N.SPECIES.slice()).slice(0, N.ri(4, 6)), y = l.y + 30;
    var bs = sps.map(function (sp, i) { return N.spawnBact(sp, x0 + dir * i * 190, y, { len: 130, hat: "santa", label: 99 }); });
    var t0 = N.time, notes = N.add({ update: function () { if (N.chance(0.05)) { var b = N.pick(bs); FX.note(b.pos()[0], b.pos()[1] - 80); } if (N.time - t0 > 45) this.dead = true; } });
    var x1 = sideX(other(s)) - dir * 400;
    bs.forEach(function (b, i) { b.sing = 0.5; b.walkTo(x1 - dir * i * 10, y, 0.55).then(function () { b.leave(); }); });
    await N.wait(4); await bs[0].say("¡Conga acidófila!");
    await N.until(function () { return bs.every(function (b) { return b.dead; }); }, 45);
    release(l); notes.dead = true;
  }, hasLane);
  ev("nieveMagica", "s", async function () {
    FX.snow = 0.6; var p = null, def = free(), l = lane();
    if (def && l) { p = await enter(def, side(), midX(8), l.y, { acc: "beanie" }); await p.say(N.pick(["¿Nieve… adentro del lab?", "¡Está nevando!", "Alguien dejó abierto el -80"])); p.do("cheer", 2); }
    await N.wait(N.rnd(25, 40)); FX.snow = 0;
    release(l); if (p) await exit(p);
  });
  ev("siesta", "s", async function () {
    var dk = freeDesk(), def = free(function (d) { return d.role === "bio"; }); if (!dk || !def) return;
    var p = sitAt(def, dk); p.do("type", 8); await N.wait(8);
    p.act = "sleep"; await N.wait(N.rnd(10, 16));
    p.act = "idle"; p.do("jump", 0.8);
    await p.say(N.pick(["¡Estaba pensando!", "¡No dormía! Compilaba…", "¿Qué? ¡Ah! El job…"]));
    p.do("type", 10); await N.wait(10); D.deskBusy[dk.id] = false; await p.leave();
  }, function () { return cam.sees(7000, -600) && !!freeDesk(); });
  ev("decorar", "s", async function () {
    var st = station(), def = free(); if (!st || !def) return;
    D.stBusy[st.i] = true;
    var p = await enter(def, side(), st.x + 160, st.y, { acc: "elf" }); p.hold("tree", true);
    await p.say("¡Traje el arbolito!");
    var tx = st.x - 40, ty = st.y + 30, h = N.depthH(ty) * 0.9, t0 = N.time, life = 900;
    p.prop = null;
    N.add({ x: tx, z: ty, update: function () { if (N.time - t0 > life) this.dead = true; }, draw: function (g) {
      var a = Math.min(1, (N.time - t0) / 0.5, (life - (N.time - t0)) / 2); g.save(); g.globalAlpha = a; N.clay.floorShadow(g, tx, ty, h * 0.4, 0.8); N.clay.draw(g, N.PROPS.tree, tx, ty - h * 0.06, 0, h * 1.4); g.restore();
      if (Math.random() < 0.02) FX.sparkles(tx + N.rnd(-60, 60), ty - h * N.rnd(0.2, 0.5), 1, 10);
    }, hit: function (wx, wy) { return Math.abs(wx - tx) < h * 0.2 && wy < ty && wy > ty - h * 0.5; }, onTap: function () { FX.sparkles(tx, ty - h * 0.3, 12, 80); N.music.sfx("sparkle"); } });
    FX.sparkles(tx, ty - h * 0.3, 14, 80); N.music.sfx("sparkle");
    p.do("cheer", 1.5); await N.wait(1.5);
    D.stBusy[st.i] = false; await exit(p);
  }, function () { return !!station(); });
  ev("copahue", "s", function () { return copahuePop(); }, function () { return cam.sees(240, 0); });

  // --- raros (easter eggs) ---
  ev("trineoVentana", "r", async function () {
    var gb = L.spots.glass, bb = L.spots.blinds, gx = N.near(gb[0]), bx = gx + (bb[0] - gb[0]);
    var h = 170, t0 = N.time, d = 14, y0 = gb[1] + 120;
    N.music.sfx("bells");
    await new Promise(function (res) {
      N.add({ z: 1.5, draw: function (g) {
        var k = (N.time - t0) / d; if (k > 1) { this.dead = true; res(); return; }
        var x = N.lerp(gx - 300, bx + bb[2] + 300, k), y = y0 + Math.sin(k * 9) * 30 - k * 80;
        g.save(); g.beginPath(); g.rect(gx, gb[1], gb[2], gb[3]); g.clip(); N.clay.draw(g, N.CHARS.trineo, x, y, -0.05, h, true); g.restore();
        g.save(); g.beginPath(); g.rect(bx, bb[1], bb[2], 600); g.clip(); g.globalAlpha = 0.25; N.clay.draw(g, N.CHARS.trineo, x, y, -0.05, h, true); g.restore();
        if (Math.random() < 0.3) FX.add({ type: "spark", x: x - 120, y: y, vx: 0, vy: 10, s: 16, life: 1.2, c: "#ffe9a8", scene: "lab" });
      } });
    });
  }, function () { return cam.sees(5400, -500); });
  ev("pascuero", "r", async function () {
    var l = lane(); if (!l) return;
    var m = midX(20, 0.08), s = N.spawnChar("pascuero", offL(), l.y, { h: N.depthH(l.y) * 0.85 });
    N.music.sfx("bells");
    await s.walkTo(m, l.y, 0.8);
    await s.say("¡Jo, jo, jo! ¡Feliz Navidad, laboratorio!");
    var def = free();
    if (def) {
      var p = N.spawnPerson(def, offR(), l.y, {}); await p.walkTo(m + N.depthH(l.y) * 0.45, l.y); p.face = -1;
      await s.say(N.pick(["¿Te portaste bien este año?", "Te traje puntas de pipeta", "Un regalo para el mejor lab", "Esto es para tus cepas"]));
      p.hold("gift", true); FX.sparkles(p.x, p.y - p.hw * 0.5, 14, 80); N.music.sfx("sparkle");
      await p.say(N.pick(["¡Gracias, Viejito Pascuero!", "¡Existe!", "¡No lo puedo creer!"])); p.do("cheer", 2); await N.wait(2);
      exit(p, "r");
    }
    await s.walkTo(offL(), l.y, 0.8); await s.leave(); release(l);
  }, hasLane);
  ev("reno", "r", async function () {
    var l = lane(); if (!l) return;
    var sd = side(), m = midX(14), r = N.spawnChar("reno", sideX(sd), l.y, { h: N.depthH(l.y) * 0.8 });
    await r.walkTo(m, l.y, 0.7); r.jumpT = 0.8;
    var def = free();
    if (def) { var p = N.spawnPerson(def, sideX(other(sd)), l.y, {}); await p.walkTo(m + (sd === "l" ? 1 : -1) * N.depthH(l.y) * 0.6, l.y); p.faceTo(r.x); await p.say(N.pick(["¿Y ese reno?", "¿De quién es este reno?", "No se puede entrar con animales al lab…"])); await r.say("¿Alguien ha visto un trineo?"); exit(p, other(sd)); }
    else await r.say("¿Alguien ha visto un trineo?");
    await r.walkTo(sideX(other(sd)), l.y, 1); await r.leave(); release(l);
  }, hasLane);
  ev("galleta", "r", async function () {
    var l = lane(); if (!l) return;
    var sd = side(), c = N.spawnChar("galleta", sideX(sd), l.y, { h: N.depthH(l.y) * 0.35 });
    c.say("¡Corre, corre, no me atraparás!", 3);
    var def = free();
    if (def) { var ch = N.spawnPerson(def, sideX(sd), l.y, {}); await N.wait(1.4); ch.walkTo(sideX(other(sd)), l.y, 1.6).then(function () { ch.leave(); }); ch.say("¡Vuelve acá, galleta!", 2.5); }
    await c.walkTo(sideX(other(sd)), l.y, 2.3); await c.leave();
    await N.wait(2); release(l);
  }, hasLane);
  ev("grunon", "r", async function () {
    var l = lane(); if (!l) return;
    var sd = side(), m = midX(24, 0.05), H = N.depthH(l.y) * 0.7;
    var gr = N.spawnChar("grunon", sideX(sd), l.y, { h: H });
    await gr.walkTo(m, l.y, 0.5);
    await gr.say("Shhh… me llevo las luces de Navidad");
    FX.lights.on = 0; gr.prop = "ornament";
    await gr.walkTo(sideX(other(sd)), l.y, 0.6); await gr.leave();
    await N.wait(5);
    var g2 = N.spawnChar("grunon", sideX(other(sd)), l.y, { h: H });
    await g2.walkTo(midX(8, 0.05), l.y, 0.7);
    await g2.say(N.pick(["Bueno… ya. Se las devuelvo.", "Este lab es demasiado simpático", "Mi corazón creció tres tallas"]));
    FX.lights.on = 1; FX.hearts(g2.x, g2.y - g2.hw * 1.1, 6); N.music.sfx("sparkle");
    await g2.walkTo(sideX(sd), l.y, 0.8); await g2.leave(); release(l);
  }, hasLane);
  ev("duende", "r", async function () {
    var st = station(); if (!st) return; D.stBusy[st.i] = true;
    var sd = side(), e = N.spawnChar("duende", sideX(sd), st.y, { h: N.depthH(st.y) * 0.5 });
    await e.walkTo(st.x, st.y, 1.2);
    await e.say(N.pick(["Ordenando reactivos por orden alfabético…", "Rotulé todos los tubos", "Inventario de puntas: listo", "Hice el pedido de enzimas"]));
    for (var i = 0; i < 4; i++) { FX.sparkles(e.x + N.rnd(-80, 80), e.y - e.hw * N.rnd(0.5, 1.2), 3, 30); e.jumpT = 0.5; await N.wait(0.9); }
    await e.walkTo(sideX(other(sd)), st.y, 1.4); await e.leave(); D.stBusy[st.i] = false;
  }, function () { return !!station(); });
  ev("cascanueces", "r", function () { return passChar("cascanueces", 0.85, 0.6, ["Un, dos, un, dos…", "¡Firmes, cepas!"]); }, hasLane);
  ev("monito", "r", function () { return passChar("monito", 0.42, 1.2, ["¡Hola! Vengo de la página monito", "¿Aquí también hay jobs corriendo?", "¡Feliz Navidad desde los servidores!"]); }, hasLane);
  ev("pinguino", "r", function () { return passChar("pinguino", 0.45, 0.7, ["¿Esto es el -80? Hace calor…", "Me dijeron que había extremófilos", "Busco a A. ferrivorans, la que aguanta el frío"]); }, hasLane);
  ev("monoDeNieve", "r", async function () {
    var l = lane(); if (!l) return;
    var sd = side(), m = midX(24, 0.05), s = N.spawnChar("nieve", sideX(sd), l.y, { h: N.depthH(l.y) * 0.6 });
    await s.walkTo(m, l.y, 0.6);
    await s.say("Uf… ¿Navidad en Santiago con 32 grados?");
    for (var i = 0; i < 20; i++) { s.melt = i / 30; await N.wait(0.25); }
    var def = free(function (d) { return d.role === "lab"; });
    if (def) { var p = N.spawnPerson(def, sideX(other(sd)), l.y, { coat: true }); p.hold("ice", true); await p.walkTo(m + (sd === "l" ? 1 : -1) * N.depthH(l.y) * 0.45, l.y); p.faceTo(s.x); await p.say("¡Rápido, al refrigerador!"); exit(p, other(sd)); }
    await s.say("¡Gracias! Me voy al frío", 2.5);
    await s.walkTo(sideX(other(sd)), l.y, 0.9); await s.leave(); release(l);
  }, hasLane);
  ev("bacteriaGigante", "r", async function () {
    var l = lane(); if (!l) return;
    var m = midX(20, 0.05), b = N.spawnBact(N.speciesById("ferrooxidans"), offL(), l.y + 40, { len: 420, hat: "santa", label: 99 });
    var def = free(), p = def ? N.spawnPerson(def, offR(), l.y, {}) : null;
    if (p) p.walkTo(m + 500, l.y);
    await b.walkTo(m - 100, l.y + 40, 0.4);
    if (p) { p.faceTo(b.x); await p.say("¿Quién dejó la estufa a 30 °C toda la noche?"); }
    await b.say("¡Crecí mucho este año!"); b.jumpT = 1;
    if (p) exit(p, "r");
    await b.walkTo(offL(), l.y + 40, 0.5); await b.leave(); release(l);
  }, hasLane);

  async function passChar(kind, hk, speed, lines) {
    var l = lane(); if (!l) return;
    var sd = side(), c = N.spawnChar(kind, sideX(sd), l.y, { h: N.depthH(l.y) * hk });
    await c.walkTo(midX(12), l.y, speed); c.jumpT = 0.6; await c.say(N.pick(lines));
    await c.walkTo(sideX(other(sd)), l.y, speed); await c.leave(); release(l);
  }
  async function bringFood(prop, line, replies) {
    var l = lane(), ds = freeN(3); if (!l || ds.length < 2) { release(l); return; }
    var m = midX(20, 0.05), H = N.depthH(l.y);
    var a = N.spawnPerson(ds[0], offL(), l.y, maybeXmas()); a.hold(prop, prop === "pan");
    await a.walkTo(m - H * 0.25, l.y); a.face = 1;
    await a.say(line);
    var rest = ds.slice(1).map(function (d, i) { var q = N.spawnPerson(d, offR(), l.y, maybeXmas()); q.walkTo(m + H * (0.3 + i * 0.32), l.y).then(function () { q.face = -1; }); return q; });
    await N.wait(3);
    for (var i = 0; i < rest.length; i++) { await rest[i].say(N.pick(replies)); if (N.chance(0.5)) rest[i].do("cheer", 1.5); }
    FX.hearts(m, l.y - H * 1.1, 4); await N.wait(2);
    release(l);
    await Promise.all([exit(a, "l")].concat(rest.map(function (q) { return exit(q, "r"); })));
  }
  async function copahuePop() {
    var r = L.spots.copahue, cx = N.near(r[0] + r[2] / 2), cy = r[1] + r[3] / 2;
    FX.sparkles(cx, cy, 16, 90, "#ffb070"); N.music.sfx("sparkle");
    var b = N.spawnBact(N.speciesById("copahuensis"), cx, cy + 560, { len: 120, fly: true, alt: 560, label: 99, hat: "santa" });
    await N.wait(0.6); await b.say("¡Salí del póster del Copahue!");
    await b.walkTo(cx + 700, 1700, 0.5); await b.say(N.pick(b.sp.lines)); await b.leave();
  }

  /* ---------- escritorios de bioinformatica ---------- */
  function freeDesk() { var f = L.desksList.filter(function (d) { return !D.deskBusy[d.id]; }); return f.length ? N.pick(f) : null; }
  function sitAt(def, d) {
    D.deskBusy[d.id] = true;
    var x = ahead(d.x), p = N.spawnPerson(def, x, d.hip + 0.4 * d.hw, { hw: d.hw, desk: d, fadeIn: true, acc: N.chance(0.3) ? N.pick(N.ACC_LIST) : null });
    p.face = N.chance(0.5) ? 1 : -1;
    return p;
  }
  async function deskSession() {
    var d = freeDesk(), def = free(function (q) { return q.role === "bio"; }) || (N.chance(0.3) ? free() : null);
    if (!d || !def) return;
    var p = sitAt(def, d), dur = N.rnd(90, 240), t0 = N.time;
    while (N.time - t0 < dur) {
      p.do("type", N.rnd(8, 18)); await N.wait(N.rnd(8, 18));
      var r = Math.random();
      if (r < 0.25) { p.do("cheer", 2); await p.say(N.pick(["¡Ensambló!", "¡Corrió sin errores!", "¡Bootstrap 100!", "¡Por fin!"])); }
      else if (r < 0.4) { p.do("facepalm", 2.5); await p.say(N.pick(["Segmentation fault…", "Out of memory", "¿Quién borró /tmp?", "KeyError: 'navidad'"])); }
      else if (r < 0.55) { p.hold("mug"); await p.do("sip", 6); p.prop = null; }
      else if (r < 0.65) await p.do("stretch", 3);
      else if (r < 0.75) await p.say(N.pick(BIO_LINES), 3);
    }
    await p.leave(); D.deskBusy[d.id] = false;
  }

  /* ---------- show de los peluches: la camara se acerca a la repisa ---------- */
  function leadsWithoutAudio(piece, cb) {
    var t0 = N.time, i = 0, leads = piece.ev.filter(function (e) { return e.lead; }).sort(function (a, b) { return a.t - b.t; });
    var a = N.add({ update: function () { while (i < leads.length && N.time - t0 >= leads[i].t) cb(leads[i++]); if (i >= leads.length) this.dead = true; } });
    return function () { a.dead = true; };
  }
  async function plushShow(kind) {
    N.plush.busy = true; D.exclusive = true;
    var v = cam.view(), cx = N.near(N.plush.center, v.x0 + v.w * 0.5);
    if (cx < v.x0 - 400) cx += L.w;   // si quedo atras, la siguiente vuelta
    var ps = N.plush.list;
    await cam.look(cx, N.plush.top + 110, 2.9, 6);
    cam.hold = true;
    await N.wait(0.8);
    for (var i = 0; i < ps.length; i++) { ps[i].wantAwake = 1; ps[i].hopT = 0.4; await N.wait(0.4); }
    if (kind === "hello") {
      for (i = 0; i < ps.length; i++) { N.bubbleLabel(ps[i]); await ps[i].say(N.pick(N.PLUSH_LINES[ps[i].id]), 3.2); }
      await N.wait(0.6); ps[0].say("¡Feliz Navidad, lab!", 3); ps.forEach(function (p) { p.hopT = 0.6; }); await N.wait(3);
    } else {
      ps.forEach(function (p) { p.hat = N.pick(["santa", "santa", "elf"]); });
      FX.sparkles(cx, N.plush.top + 60, 16, 300); N.music.sfx("sparkle");
      await N.wait(1.5);
      await ps[N.ri(0, 5)].say(N.pick(["¡Un villancico para el lab!", "Uno, dos, tres…", "¡Todos juntos!"]), 2.4);
      var piece = N.music.arrangeCarol(N.pick(["silent", "wish", "jingle", "deck", "hark", "angels", "wenceslas", "joy"]), { voice: "choir", harm: N.pick(["pad", "epiano"]), reps: 1, bass: true, color: false });
      var mode = N.pick(["all", "turns", "solo"]), soloist = N.pick(ps), ni = 0;
      var onNote = function (e) {
        ni++;
        var who = mode === "all" ? ps : mode === "solo" ? [soloist] : [ps[Math.floor(ni / 8) % ps.length]];
        who.forEach(function (p) { p.singNote(e.d, 0.9); });
        if (ni % 3 === 0) { var p = N.pick(who); FX.note(N.near(p.px) + N.rnd(-20, 20), p.by - 10); }
      };
      var dur = Math.min(N.music.play(piece) || 40, 50), off;
      if (N.music.running() && N.music.on) off = N.music.onNote(onNote); else off = leadsWithoutAudio(piece, onNote);
      ps.forEach(function (p) { p.dance = N.chance(0.6); });
      await N.wait(dur);
      off(); N.music.stopPiece();
      ps.forEach(function (p) { p.dance = false; p.hopT = 0.6; });
      FX.sparkles(cx, N.plush.top + 60, 16, 300);
      await N.wait(2.5);
      ps.forEach(function (p) { p.hat = null; });
    }
    await N.wait(1.2);
    ps.forEach(function (p) { p.wantAwake = 0; });
    cam.hold = false;
    await cam.look(cx, 1080, 1, 6);
    N.plush.busy = false; D.exclusive = false;
  }

  /* ---------- planificacion ---------- */
  var nextC = 0, nextS = 0, nextR = 0, nextDesk = 0, bags = {};
  D.active = 0;
  D.run = function (id) {
    var e = EV[id]; if (!e) return;
    D.active++; N.log("evento:", id);
    var p;
    try { p = Promise.resolve(e.run()); } catch (err) { console.error(err); p = Promise.resolve(); }
    p.catch(function (err) { console.error("evento", id, err); if (N.errors) N.errors.push(id + ": " + err); }).then(function () { D.active--; });
    return p;
  };
  function pick(tier) {
    if (!bags[tier]) bags[tier] = new N.Bag(Object.keys(EV).filter(function (k) { return EV[k].tier === tier; }), tier === "c" ? 2 : 3);
    return bags[tier].next(function (k) { return EV[k].can(); });
  }
  D.start = function () {
    var x0 = parseFloat(N.Q.get("x")); cam.x = isNaN(x0) ? N.rnd(0, L.w) : x0;
    nextC = N.time + 2; nextS = N.time + N.rnd(50, 90); nextR = N.time + N.rnd(140, 240); nextDesk = N.time + 1;
    FX.tvNext("fire");
    var ev0 = N.Q.get("ev"); if (ev0) N.wait(0.5).then(function () { D.run(ev0); });
    if (N.Q.has("galeria")) {   // prueba visual: todos los personajes juntos
      D.paused = true; N.ROT = 0;
      var bx = cam.x + 250;
      ["pascuero", "reno", "galleta", "nieve", "grunon", "duende", "cascanueces", "monito", "pinguino"].forEach(function (k, i) {
        var hk = { pascuero: 0.85, reno: 0.8, galleta: 0.35, nieve: 0.6, grunon: 0.7, duende: 0.5, cascanueces: 0.85, monito: 0.42, pinguino: 0.45 }[k];
        N.spawnChar(k, bx + i * 400, 1650, { h: N.depthH(1650) * hk });
      });
      N.SPECIES.slice(0, 9).forEach(function (sp, i) { N.spawnBact(sp, bx + 50 + i * 400, 1950, { len: 150, label: 99, hat: i % 3 ? "santa" : null }); });
      N.PEOPLE.forEach(function (d, i) { N.spawnPerson(d, bx + (N.Q.has("gente") ? -100 + i * 280 : 4000 + i * 420), N.Q.has("gente") ? 1900 : 1780, { acc: i % 3 ? null : N.ACC_LIST[i % 5] }); });
      return;
    }
    for (var i = 0; i < 2; i++) deskSession();
  };
  D.tick = function () {
    if (D.paused) return;
    var t = N.time;
    if (t > nextDesk) { nextDesk = t + N.rnd(25, 60); if (L.desksList.filter(function (d) { return D.deskBusy[d.id]; }).length < 3) deskSession(); }
    if (D.exclusive) return;
    var busyPeople = N.PEOPLE.filter(function (d) { return d.busy; }).length;
    if (t > nextC && D.active < 3 && busyPeople < 8) { nextC = t + N.rnd(7, 14); var id = pick("c"); if (id) D.run(id); }
    if (t > nextS && D.active < 2) { nextS = t + N.rnd(70, 130); var s = pick("s"); if (s) D.run(s); }
    if (t > nextR && D.active < 2) { nextR = t + N.rnd(170, 300); var r = pick("r"); if (r) D.run(r); }
  };

  /* ---------- toques en la pantalla ---------- */
  var taps = [], cool = {};
  function cooled(k, s) { if (cool[k] && N.time < cool[k]) return false; cool[k] = N.time + s; return true; }
  function inR(r, x, y) { return x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3]; }
  D.tap = function (wx, wy) {
    taps.push(N.time); taps = taps.filter(function (t) { return N.time - t < 4; });
    if (taps.length >= 7 && cooled("secret", 30)) { taps = []; var r0 = pick("r"); if (r0) D.run(r0); return; }
    var list = N.actors.filter(function (a) { return a.scene === "lab" && a.hit && !a.dead; }).sort(function (a, b) { return b.z - a.z; });
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (a.hit(wx, wy)) {
        if (a.onTap) a.onTap();
        else if (a.d) tapPerson(a);
        else if (a.say) { a.jumpT = 0.7; a.say(N.pick(["¡Hola!", "¡Feliz Navidad!", "Jo, jo, jo", "¡Me encontraste!"]), 2.2); }
        N.music.sfx("pop");
        return;
      }
    }
    var xb = N.wrapX(wx), S = L.spots;
    if (inR(S.shelf, xb, wy)) { if (!N.plush.busy && cooled("shelf", 25)) D.run("peluchesSaludan"); return; }
    if (inR(S.tv, xb, wy)) { FX.tvNext(); N.music.sfx("pop"); return; }
    if (inR(S.copahue, xb, wy)) { if (cooled("copahue", 8)) copahuePop(); return; }
    if (inR(S.poster, xb, wy)) { FX.sparkles(wx, wy, 10, 80); say(wx, wy, N.pick(posterMsgs), 4); return; }
    if (inR(S.board, xb, wy)) { say(wx, wy, N.pick(["5 géneros en la clase Acidithiobacillia", "Moya-Beltrán et al. 2021", "Este árbol lo dibujó bioinfo"]), 3.5); return; }
    if (inR(S.clock, xb, wy)) { var d = new Date(); say(wx, wy, "Son las " + d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2) + (d.getHours() >= 18 ? ". ¡A casa!" : ". ¡A seguir!"), 3); return; }
    if (inR(S.flasks, xb, wy)) {
      var best = 0, bd = 1e9; L.flasks.forEach(function (f, k) { var dd = Math.abs(f[0] - xb); if (dd < bd) { bd = dd; best = k; } });
      FX.bubbleFlask(best, 6); N.music.sfx("pop");
      if (cooled("flaskB", 5)) { var f = L.flasks[best], fx = N.near(f[0]), b = N.spawnBact(N.pick(N.SPECIES), fx, f[1] + 900, { len: 90, fly: true, alt: 1000, label: 99 }); b.walkTo(fx + N.rnd(-300, 300), f[1] + 900, 0.3).then(function () { return b.say(N.pick(b.sp.lines), 2.5); }).then(function () { b.leave(); }); }
      return;
    }
    if (inR(S.monitor, xb, wy)) { say(wx, wy, N.pick(["$ sbatch navidad.sh", "Job 24601: PENDING (Resources)", "BLAST: 0 hits", "100% genomas ensamblados", "$ git commit -m \"feliz navidad\""]), 3.5); return; }
    if (inR(S.window, xb, wy)) { FX.outsideSnow = 1; setTimeout(function () { FX.outsideSnow = 0; }, 15000); if (cooled("sleigh", 60)) D.run("trineoVentana"); return; }
    if (inR(S.fridge, xb, wy) && cooled("fridge", 30)) { D.run("pinguino"); return; }
    if (inR(S.door, xb, wy) && cooled("door", 30)) { D.run(N.pick(["pascuero", "reno", "monito"])); return; }
    for (var gI = 0; gI < L.garlands.length; gI++) {
      var pts = L.garlands[gI].pts;
      if (xb > pts[0][0] && xb < pts[pts.length - 1][0] && Math.abs(wy - pts[0][1]) < 90) { FX.nextLights(); N.music.sfx("sparkle"); return; }
    }
    FX.sparkles(wx, wy, 6, 40); N.music.sfx("sparkle");
    if (wy > L.floorY && cooled("floorB", 6) && N.chance(0.5)) {
      var y = N.clamp(wy, 1650, 1900), bb = N.spawnBact(N.pick(N.SPECIES), wx, y, { len: N.rnd(110, 150), fadeIn: true, label: 99, hat: N.chance(0.5) ? "santa" : null });
      bb.jumpT = 0.6;
      bb.say(N.pick(bb.sp.lines), 2.8).then(function () { return bb.walkTo(wx + N.rnd(-400, 400), y, 0.7); }).then(function () { bb.leave(); });
    }
  };
  function say(x, y, txt, d) { N.bubble({ headPos: function () { return [x, y]; }, scene: "lab" }, txt, d); }
  function tapPerson(p) {
    var d = p.d;
    if (p.act !== "sleep") p.do(N.chance(0.6) ? "wave" : "cheer", 1.8);
    else { p.act = "idle"; p.do("jump", 0.8); }
    var lines = d.role === "pi" ? PI_LINES : d.role === "bio" ? BIO_LINES : LAB_LINES;
    p.say(N.chance(0.4) ? "¡Hola! Soy " + d.name : N.chance(0.5) ? N.pick(XMAS_LINES) : N.pick(lines), 2.8);
  }
  var posterMsgs = ["Moya-Beltrán et al. 2021: la clase Acidithiobacillia", "5 géneros: Acidithiobacillus, Fervidacidithiobacillus, Igneacidithiobacillus, Ambacidithiobacillus y Thermithiobacillus", "Viven a pH 2… ¡y felices!"];
})();
