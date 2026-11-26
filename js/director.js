/* Director: decide que pasa y cuando. Mueve la camara despacio entre las zonas del lab,
 * lanza eventos comunes (gente trabajando, bacterias paseando), especiales (los peluches
 * cantan, pan de pascua, amigo secreto...) y raros (easter eggs: Viejito Pascuero, reno,
 * galleta de jengibre, gruñon verde, duende, cascanueces, mono de nieve, monito, pinguino).
 * Bolsas barajadas por nivel: no se repite nada hasta haber pasado por todo lo demas.
 * Pruebas: ?ev=nombre lanza un evento al empezar; ?zona=left|center|right. */
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

  /* ---------- utilidades de escena ---------- */
  function viewX() { return cam.tw ? cam.tw.b.x : cam.x; }
  function viewW() { return L.h * N.CW / N.CH; }
  function laneSpan(id) {
    var l = L.lanes[id], a = Math.min(l.a[0], l.b[0]), b = Math.max(l.a[0], l.b[0]);
    return Math.min(b, viewX() + viewW()) - Math.max(a, viewX());
  }
  function laneY(id, x) { var l = L.lanes[id], t = (x - l.a[0]) / (l.b[0] - l.a[0]); return N.lerp(l.a[1], l.b[1], N.clamp(t, 0, 1)); }
  function visLanes() { return Object.keys(L.lanes).filter(function (k) { return laneSpan(k) >= 450 && !D.laneBusy[k]; }); }
  function visStations() {
    return Object.keys(L.stations).filter(function (k) { var s = L.stations[k]; return cam.sees(s.x, 160) && !D.stBusy[k]; });
  }
  function visX(m) { return N.rnd(viewX() + (m || 300), viewX() + viewW() - (m || 300)); }
  function free(filter) { var f = N.freePeople(filter); return f.length ? N.pick(f) : null; }
  function freeN(n, filter) { return N.shuffle(N.freePeople(filter)).slice(0, n); }
  function nearEnd(id, x) { var l = L.lanes[id]; return Math.abs(l.a[0] - x) < Math.abs(l.b[0] - x) ? l.a : l.b; }
  function otherEnd(id, pt) { var l = L.lanes[id]; return pt === l.a ? l.b : l.a; }
  D.laneBusy = {}; D.stBusy = {};

  function maybeXmas(o) {
    o = o || {};
    if (N.chance(0.35)) o.acc = N.pick(N.ACC_LIST);
    if (N.chance(0.15)) o.scarf = true;
    return o;
  }
  async function walkIn(def, lane, toX, o) {
    o = maybeXmas(o || {});
    var end = o.end || (N.chance(0.5) ? L.lanes[lane].a : L.lanes[lane].b);
    o.fadeIn = true;
    var p = N.spawnPerson(def, end[0], end[1], o);
    p.lane = lane; p.endIn = end;
    await p.walkTo(toX, laneY(lane, toX));
    return p;
  }
  async function walkOut(p, lane, end) {
    end = end || nearEnd(lane, p.x);
    await p.walkTo(end[0], end[1]);
    await p.leave();
  }

  /* ---------- eventos ---------- */
  var EV = D.EVENTS = {};
  function ev(id, tier, run, can) { EV[id] = { id: id, tier: tier, run: run, can: can || function () { return true; } }; }
  var hasLane = function () { return visLanes().length > 0; };

  // --- comunes ---
  ev("paseo", "c", async function () {
    var lane = N.pick(visLanes()), def = free(); if (!def || !lane) return;
    D.laneBusy[lane] = true;
    var l = L.lanes[lane], start = N.chance(0.5) ? l.a : l.b, end = otherEnd(lane, start);
    var p = N.spawnPerson(def, start[0], start[1], maybeXmas({ fadeIn: true, coat: def.role === "lab" && N.chance(0.6) ? true : (def.role === "lab" ? false : undefined) }));
    if (N.chance(0.6)) p.hold(N.pick(["flask", "petri", "rack", "tube", "mug", "laptop", "paper", "box", "ice", "pipette"]), false);
    if (p.prop === "box" || p.prop === "ice" || p.prop === "rack") p.propBoth = true;
    var mid = N.lerp(start[0], end[0], N.rnd(0.35, 0.65));
    await p.walkTo(mid, laneY(lane, mid));
    D.laneBusy[lane] = false;
    if (N.chance(0.55)) { await p.say(N.pick(def.role === "bio" ? BIO_LINES : def.role === "pi" ? PI_LINES : N.chance(0.3) ? XMAS_LINES : LAB_LINES)); }
    await p.walkTo(end[0], end[1]); await p.leave();
  }, hasLane);

  ev("trabajo", "c", async function () {
    var st = N.pick(visStations()), def = free(function (d) { return d.role === "lab"; }); if (!st || !def) return;
    var S = L.stations[st]; D.stBusy[st] = true;
    var p = await walkIn(def, S.lane, S.x, { coat: true });
    p.face = N.chance(0.5) ? 1 : -1;
    var act = N.pick(["pipette", "swirl", "pipette"]); p.hold(act === "pipette" ? "pipette" : N.pick(["flask", "tube"]));
    var dur = N.rnd(14, 28), t0 = N.time;
    p.do(act, dur);
    await N.wait(N.rnd(3, 7));
    if (N.chance(0.6)) await p.say(N.pick(LAB_LINES));
    await N.until(function () { return N.time - t0 > dur; });
    if (N.chance(0.25)) { p.prop = null; await p.do("stretch", 2.2); }
    D.stBusy[st] = false;
    await walkOut(p, S.lane);
  }, function () { return visStations().length > 0; });

  ev("charla", "c", async function () {
    var lane = N.pick(visLanes()), ds = freeN(2); if (!lane || ds.length < 2) return;
    D.laneBusy[lane] = true;
    var l = L.lanes[lane], mid = N.lerp(l.a[0], l.b[0], N.rnd(0.4, 0.6)), gap = N.depthH(laneY(lane, mid)) * 0.3;
    var a = N.spawnPerson(ds[0], l.a[0], l.a[1], maybeXmas({ fadeIn: true })), b = N.spawnPerson(ds[1], l.b[0], l.b[1], maybeXmas({ fadeIn: true }));
    if (N.chance(0.5)) a.hold("mug"); if (N.chance(0.4)) b.hold("mug");
    await Promise.all([a.walkTo(mid - gap, laneY(lane, mid - gap)), b.walkTo(mid + gap, laneY(lane, mid + gap))]);
    a.face = 1; b.face = -1;
    var talk = [[N.pick(XMAS_LINES), N.pick(["¡Sí!", "Jajaja", "Obvio", "¡Me apunto!", "¿En serio?"])],
      ["¿Cómo te fue con el experimento?", N.pick(["Creció todo… menos lo que quería", "¡Bien!", "Mañana repito", "Mejor ni pregunte"])],
      ["¿Almorzamos?", N.pick(["¡Vamos!", "En 5 minutos", "Tengo que terminar el gel"])],
      ["¿Viste el correo de la profe?", "Sí… hay reunión"],
      ["¿Me ayudas con un análisis?", N.pick(["¡Claro!", "Después de las fiestas", "¿Es en R?"])]];
    var c = N.pick(talk);
    await a.say(c[0]); await b.say(c[1]);
    if (N.chance(0.4)) { a.do("cheer", 1.5); b.do("cheer", 1.5); await N.wait(1.5); }
    D.laneBusy[lane] = false;
    await Promise.all([walkOut(a, lane, l.a), walkOut(b, lane, l.b)]);
  }, hasLane);

  ev("cafe", "c", async function () {
    var st = N.pick(visStations()), def = free(); if (!st || !def) return;
    var S = L.stations[st]; D.stBusy[st] = true;
    var p = await walkIn(def, S.lane, S.x, {}); p.hold("mug"); p.do("sip", 12);
    var t0 = N.time;
    var steam = N.add({ update: function () { if (N.chance(0.15)) FX.steam(p.x + p.face * p.hw * 0.12, p.y - p.hw * 0.75); if (N.time - t0 > 12 || p.dead) this.dead = true; } });
    if (N.chance(0.5)) { await N.wait(4); await p.say(N.pick(["Ahh, café", "Necesitaba esto", "El café del lab es otra cosa", "¿Alguien más quiere?"])); }
    await N.until(function () { return N.time - t0 > 12; });
    D.stBusy[st] = false; await walkOut(p, S.lane);
  }, function () { return visStations().length > 0; });

  ev("bacteria", "c", async function () {
    var lane = N.pick(visLanes()); if (!lane) return;
    var sp = N.pick(N.SPECIES), l = L.lanes[lane], st = N.chance(0.5) ? l.a : l.b, en = otherEnd(lane, st), fly = N.chance(0.35);
    var b = N.spawnBact(sp, st[0], st[1], { len: N.rnd(120, 170), fly: fly, alt: fly ? N.rnd(150, 400) : 0, fadeIn: true, label: 6, hat: N.chance(0.5) ? N.pick(["santa", "elf"]) : null });
    var mid = N.lerp(st[0], en[0], 0.5);
    await b.walkTo(mid, laneY(lane, mid), 0.8);
    if (N.chance(0.7)) await b.say(N.pick(sp.lines));
    await b.walkTo(en[0], en[1], 0.8); await b.leave();
  }, hasLane);

  ev("luces", "c", async function () { FX.nextLights(); });
  ev("matraz", "c", async function () {
    var i = N.ri(0, L.flasks.length - 1); FX.bubbleFlask(i, N.rnd(10, 18), N.pick(["#7cc4ff", "#ffd36a", "#ff8ab0", "#9cff9a", "#c9a0ff"]));
  }, function () { return cam.sees(4600, 200); });
  ev("tele", "c", async function () { FX.tvNext(); }, function () { return cam.sees(620, 100); });
  ev("nieveVentana", "c", async function () {
    FX.outsideSnow = 1; await N.wait(N.rnd(30, 50)); FX.outsideSnow = 0;
  }, function () { return cam.sees(6000, 0) && FX.outsideSnow === 0; });

  // --- especiales ---
  ev("peluchesCantan", "s", function () { return plushShow("sing"); }, function () { return !N.plush.busy && N.plush.list.length; });
  ev("peluchesSaludan", "s", function () { return plushShow("hello"); }, function () { return !N.plush.busy && N.plush.list.length; });
  ev("panDePascua", "s", async function () { await bringFood("pan", "¡Llegó el pan de pascua!", ["¡Yo quiero!", "¿Tiene frutas confitadas?", "¡El mejor día del año!", "Guárdenme un pedazo"]); }, hasLane);
  ev("colaDeMono", "s", async function () { await bringFood("cola", "¡Traje cola de mono!", ["¡Salud!", "Pero poquito, que hay experimentos", "¡Esa es la receta de la abuela!", "Jajaja"]); }, hasLane);
  ev("amigoSecreto", "s", async function () {
    var lane = N.pick(visLanes()), ds = freeN(2); if (!lane || ds.length < 2) return;
    D.laneBusy[lane] = true;
    var l = L.lanes[lane], mid = N.lerp(l.a[0], l.b[0], 0.5), gap = N.depthH(laneY(lane, mid)) * 0.28;
    var a = N.spawnPerson(ds[0], l.a[0], l.a[1], { fadeIn: true, acc: "santa" }), b = N.spawnPerson(ds[1], l.b[0], l.b[1], maybeXmas({ fadeIn: true }));
    a.hold("gift", true);
    await Promise.all([a.walkTo(mid - gap, laneY(lane, mid)), b.walkTo(mid + gap, laneY(lane, mid))]);
    a.face = 1; b.face = -1;
    await a.say("¡" + b.d.name + ", soy tu amigo secreto!");
    a.prop = null; b.hold("gift", true); FX.sparkles(b.x, b.y - b.hw * 0.5, 10, 60); N.music.sfx("sparkle");
    await b.say(N.pick(["¡Gracias!", "¡No puede ser!", "¡Justo lo que quería!", "¿Es una pipeta nueva?"]));
    FX.hearts(b.x, b.y - b.hw * 1.1, 5); b.do("cheer", 2); await N.wait(2);
    D.laneBusy[lane] = false;
    await Promise.all([walkOut(a, lane, l.a), walkOut(b, lane, l.b)]);
  }, hasLane);
  ev("ronda", "s", async function () {
    var r = N.personById("raquel"); if (r.busy) return;
    var lane = N.pick(visLanes()); if (!lane) return;
    var l = L.lanes[lane], other = free(function (d) { return d.id !== "raquel"; });
    D.laneBusy[lane] = true;
    var x = N.lerp(l.a[0], l.b[0], 0.6), y = laneY(lane, x), q = other ? N.spawnPerson(other, l.b[0], l.b[1], { fadeIn: true }) : null;
    var p = N.spawnPerson(r, l.a[0], l.a[1], maybeXmas({ fadeIn: true }));
    if (q) { q.walkTo(x + N.depthH(y) * 0.3, y); q.hold(other.role === "bio" ? "laptop" : "flask"); }
    await p.walkTo(x - N.depthH(y) * 0.3, y);
    p.face = 1; if (q) q.face = -1;
    await p.say(N.pick(PI_LINES));
    if (q) { await q.say(N.pick(ANSWERS)); if (N.chance(0.5)) { p.do("cheer", 1.4); await p.say("¡Así me gusta!"); } }
    D.laneBusy[lane] = false;
    await Promise.all([walkOut(p, lane, l.a), q ? walkOut(q, lane, l.b) : null]);
  }, function () { return hasLane() && !N.personById("raquel").busy; });
  ev("paperAceptado", "s", async function () {
    var lane = N.pick(visLanes()), r = N.personById("raquel"); if (!lane || r.busy) return;
    D.laneBusy[lane] = true;
    var l = L.lanes[lane], x = N.lerp(l.a[0], l.b[0], 0.45), y = laneY(lane, x);
    var p = N.spawnPerson(r, l.a[0], l.a[1], { fadeIn: true }); p.hold("paper");
    var others = freeN(2).map(function (d, i) { var q = N.spawnPerson(d, l.b[0], l.b[1], { fadeIn: true }); q.walkTo(x + N.depthH(y) * (0.35 + i * 0.3), y); return q; });
    await p.walkTo(x, y); p.face = 1;
    await p.say("¡Equipo! ¡Aceptaron el paper!");
    FX.confetti(x, y - N.depthH(y), 40, 200); N.music.sfx("sparkle");
    p.do("cheer", 3); others.forEach(function (q) { q.face = -1; q.do("cheer", 3); });
    if (others[0]) await others[0].say(N.pick(["¡Siiii!", "¡Sin revisión mayor!", "¡A celebrar!"])); else await N.wait(3);
    D.laneBusy[lane] = false;
    await Promise.all([walkOut(p, lane, l.a)].concat(others.map(function (q) { return walkOut(q, lane, l.b); })));
  }, function () { return hasLane() && !N.personById("raquel").busy; });
  ev("bailecito", "s", async function () {
    var lane = N.pick(visLanes()), ds = freeN(N.ri(2, 3)); if (!lane || ds.length < 2) return;
    D.laneBusy[lane] = true;
    var l = L.lanes[lane], ps = ds.map(function (d, i) {
      var x = N.lerp(l.a[0], l.b[0], 0.25 + i * 0.25), end = i % 2 ? l.b : l.a, p = N.spawnPerson(d, end[0], end[1], { fadeIn: true, acc: N.pick(N.ACC_LIST) });
      p.walkTo(x, laneY(lane, x)).then(function () { p.do(N.pick(["dance", "sway"]), 18); });
      return p;
    });
    await N.wait(6); await ps[0].say(N.pick(["¡Esta canción me encanta!", "¡Un bailecito!", "Pausa activa navideña"]));
    for (var i = 0; i < 10; i++) { if (N.chance(0.5)) FX.note(N.pick(ps).x, ps[0].y - ps[0].hw * 1.15); await N.wait(1.2); }
    D.laneBusy[lane] = false;
    await Promise.all(ps.map(function (p, i) { return walkOut(p, lane, i % 2 ? l.b : l.a); }));
  }, hasLane);
  ev("conga", "s", async function () {
    var lane = N.pick(visLanes()); if (!lane) return;
    D.laneBusy[lane] = true;
    var l = L.lanes[lane], st = N.chance(0.5) ? l.a : l.b, en = otherEnd(lane, st), dir = en[0] > st[0] ? -1 : 1;
    var sps = N.shuffle(N.SPECIES.slice()).slice(0, N.ri(4, 6));
    var bs = sps.map(function (sp, i) { return N.spawnBact(sp, st[0] + dir * i * 190, st[1], { len: 130, fadeIn: true, hat: "santa", label: 30 }); });
    var t0 = N.time;
    var notes = N.add({ update: function () { if (N.chance(0.05)) { var b = N.pick(bs); FX.note(b.pos()[0], b.pos()[1] - 80); } if (N.time - t0 > 40) this.dead = true; } });
    bs.forEach(function (b, i) { b.sing = 0.5; b.walkTo(en[0] - dir * i * 10, en[1], 0.55).then(function () { b.leave(); }); });
    await N.wait(3); await bs[0].say("¡Conga acidófila!");
    await N.until(function () { return bs.every(function (b) { return b.dead; }); }, 40);
    D.laneBusy[lane] = false; notes.dead = true;
  }, hasLane);
  ev("nieveMagica", "s", async function () {
    FX.snow = 0.6; var p = null, def = free(), lane = N.pick(visLanes());
    if (def && lane) { var x = N.lerp(L.lanes[lane].a[0], L.lanes[lane].b[0], 0.5); p = await walkIn(def, lane, x, { acc: "beanie" }); await p.say(N.pick(["¿Nieve… adentro del lab?", "¡Está nevando!", "Alguien dejó abierto el -80"])); p.do("cheer", 2); }
    await N.wait(N.rnd(25, 40)); FX.snow = 0;
    if (p) await walkOut(p, lane);
  });
  ev("siesta", "s", async function () {
    var dk = freeDesk(), def = free(function (d) { return d.role === "bio"; }); if (!dk || !def) return;
    var p = sitAt(def, dk); p.do("type", 8); await N.wait(8);
    p.act = "sleep"; await N.wait(N.rnd(10, 16));
    var r = N.personById("raquel");
    p.act = "idle"; p.do("jump", 0.8);
    await p.say(N.pick(["¡Estaba pensando!", "¡No dormía! Compilaba…", "¿Qué? ¡Ah! El job…"]));
    p.do("type", 10); await N.wait(10); D.deskBusy[dk] = false; await p.leave();
  }, function () { return cam.sees(7700, 0) && freeDesk(); });
  ev("decorar", "s", async function () {
    var st = N.pick(visStations()), def = free(); if (!st || !def) return;
    var S = L.stations[st]; D.stBusy[st] = true;
    var p = await walkIn(def, S.lane, S.x + 160, { acc: "elf" }); p.hold("tree", true);
    await p.say("¡Traje el arbolito!");
    var tx = S.x - 40, ty = S.y + 10, h = N.depthH(ty) * 0.9, t0 = N.time;
    p.prop = null;
    var tree = N.add({ z: ty, update: function () { if (N.time - t0 > 600) this.dead = true; }, draw: function (g) {
      var a = Math.min(1, (N.time - t0) / 0.5, (600 - (N.time - t0)) / 2); g.save(); g.globalAlpha = a; N.clay.floorShadow(g, tx, ty, h * 0.4, 0.8); N.clay.draw(g, N.PROPS.tree, tx, ty - h * 0.06, 0, h * 1.4); g.restore();
      if (Math.random() < 0.02) FX.sparkles(tx + N.rnd(-60, 60), ty - h * N.rnd(0.2, 0.5), 1, 10);
    }, hit: function (wx, wy) { return Math.abs(wx - tx) < h * 0.2 && wy < ty && wy > ty - h * 0.5; }, onTap: function () { FX.sparkles(tx, ty - h * 0.3, 12, 80); N.music.sfx("sparkle"); } });
    FX.sparkles(tx, ty - h * 0.3, 14, 80); N.music.sfx("sparkle");
    p.do("cheer", 1.5); await N.wait(1.5);
    D.stBusy[st] = false; await walkOut(p, S.lane);
  }, function () { return visStations().length > 0; });
  ev("copahue", "s", async function () { await copahuePop(); }, function () { return cam.sees(250, 0); });

  // --- raros (easter eggs) ---
  ev("trineoVentana", "r", async function () {
    var gl = L.spots.glass, bl = L.spots.blinds, h = 170, t0 = N.time, d = 14, y0 = gl[1] + 110;
    N.music.sfx("bells");
    await new Promise(function (res) {
      N.add({ z: 1.5, draw: function (g) {
        var k = (N.time - t0) / d; if (k > 1) { this.dead = true; res(); return; }
        var x = N.lerp(gl[0] - 300, bl[0] + bl[2] + 300, k), y = y0 + Math.sin(k * 9) * 30 - k * 80;
        g.save(); g.beginPath(); g.rect(gl[0], gl[1], gl[2], gl[3]); g.clip(); N.clay.draw(g, N.CHARS.trineo, x, y, -0.05, h, true); g.restore();
        g.save(); g.beginPath(); g.rect(bl[0], bl[1], bl[2], bl[3]); g.clip(); g.globalAlpha = 0.28; g.globalCompositeOperation = "multiply"; N.clay.draw(g, N.CHARS.trineo, x, y, -0.05, h, true); g.restore();
        if (Math.random() < 0.3) FX.add({ type: "spark", x: x - 120, y: y, vx: 0, vy: 10, s: 16, life: 1.2, c: "#ffe9a8", scene: "lab" });
      } });
    });
  }, function () { return cam.sees(6300, -400); });
  ev("pascuero", "r", async function () {
    var lane = N.pick(visLanes()); if (!lane) return; D.laneBusy[lane] = true;
    var l = L.lanes[lane], st = l.a, en = l.b, mid = N.lerp(st[0], en[0], 0.5), y = laneY(lane, mid);
    var s = N.spawnChar("pascuero", st[0], st[1], { h: N.depthH(y) * 0.85, fadeIn: true });
    N.music.sfx("bells");
    await s.walkTo(mid, y, 0.8);
    await s.say("¡Jo, jo, jo! ¡Feliz Navidad, laboratorio!");
    var def = free();
    if (def) {
      var p = N.spawnPerson(def, en[0], en[1], { fadeIn: true }); await p.walkTo(mid + N.depthH(y) * 0.45, y); p.face = -1;
      await s.say(N.pick(["¿Te portaste bien este año?", "Te traje puntas de pipeta", "Un regalo para la mejor investigadora", "Esto es para tus cepas"]));
      p.hold("gift", true); FX.sparkles(p.x, p.y - p.hw * 0.5, 14, 80); N.music.sfx("sparkle");
      await p.say(N.pick(["¡Gracias, Viejito Pascuero!", "¡Existe!", "¡No lo puedo creer!"])); p.do("cheer", 2); await N.wait(2);
      walkOut(p, lane, en);
    }
    await s.walkTo(st[0], st[1], 0.8); await s.leave(); D.laneBusy[lane] = false;
  }, hasLane);
  ev("reno", "r", async function () {
    var lane = N.pick(visLanes()); if (!lane) return; D.laneBusy[lane] = true;
    var l = L.lanes[lane], st = N.chance(0.5) ? l.a : l.b, en = otherEnd(lane, st), mid = N.lerp(st[0], en[0], 0.5), y = laneY(lane, mid);
    var r = N.spawnChar("reno", st[0], st[1], { h: N.depthH(y) * 0.8, fadeIn: true });
    await r.walkTo(mid, y, 0.7); r.jumpT = 0.8;
    var def = free();
    if (def) { var p = N.spawnPerson(def, en[0], en[1], { fadeIn: true }); await p.walkTo(N.lerp(mid, en[0], 0.5), y); p.faceTo(r.x); await p.say(N.pick(["¿Y ese reno?", "¿De quién es este reno?", "No se puede entrar con animales al lab…"])); await r.say("¿Alguien ha visto un trineo?"); walkOut(p, lane, en); }
    else await r.say("¿Alguien ha visto un trineo?");
    await r.walkTo(en[0], en[1], 1); await r.leave(); D.laneBusy[lane] = false;
  }, hasLane);
  ev("galleta", "r", async function () {
    var lane = N.pick(visLanes()); if (!lane) return; D.laneBusy[lane] = true;
    var l = L.lanes[lane], st = N.chance(0.5) ? l.a : l.b, en = otherEnd(lane, st), y = laneY(lane, N.lerp(st[0], en[0], 0.5));
    var c = N.spawnChar("galleta", st[0], st[1], { h: N.depthH(y) * 0.35, fadeIn: true });
    c.say("¡Corre, corre, no me atraparás!", 3);
    var def = free(), chase = null;
    if (def) { chase = N.spawnPerson(def, st[0], st[1], { fadeIn: true }); setTimeout(function () {}, 0); await N.wait(1.2); chase.walkTo(en[0], en[1], 1.6).then(function () { chase.leave(); }); chase.say("¡Vuelve acá, galleta!", 2.5); }
    await c.walkTo(en[0], en[1], 2.3); await c.leave();
    await N.wait(2); D.laneBusy[lane] = false;
  }, hasLane);
  ev("grunon", "r", async function () {
    var lane = N.pick(visLanes()); if (!lane) return; D.laneBusy[lane] = true;
    var l = L.lanes[lane], st = N.chance(0.5) ? l.a : l.b, en = otherEnd(lane, st), mid = N.lerp(st[0], en[0], 0.5), y = laneY(lane, mid);
    var gr = N.spawnChar("grunon", st[0], st[1], { h: N.depthH(y) * 0.7, fadeIn: true });
    await gr.walkTo(mid, y, 0.5);
    await gr.say("Shhh… me llevo las luces de Navidad");
    FX.lights.on = 0; gr.prop = "ornament";
    await gr.walkTo(en[0], en[1], 0.6); await gr.leave();
    await N.wait(5);
    var g2 = N.spawnChar("grunon", en[0], en[1], { h: N.depthH(y) * 0.7, fadeIn: true });
    await g2.walkTo(mid, y, 0.7);
    await g2.say(N.pick(["Bueno… ya. Se las devuelvo.", "Este lab es demasiado simpático", "Mi corazón creció tres tallas"]));
    FX.lights.on = 1; FX.hearts(g2.x, g2.y - g2.hw * 1.1, 6); N.music.sfx("sparkle");
    await g2.walkTo(st[0], st[1], 0.8); await g2.leave(); D.laneBusy[lane] = false;
  }, hasLane);
  ev("duende", "r", async function () {
    var st = N.pick(visStations()); if (!st) return; var S = L.stations[st]; D.stBusy[st] = true;
    var l = L.lanes[S.lane], end = N.chance(0.5) ? l.a : l.b, y = S.y;
    var e = N.spawnChar("duende", end[0], end[1], { h: N.depthH(y) * 0.5, fadeIn: true });
    await e.walkTo(S.x, y, 1.2);
    await e.say(N.pick(["Ordenando reactivos por orden alfabético…", "Rotulé todos los tubos", "Inventario de puntas: listo", "Hice el pedido de enzimas"]));
    for (var i = 0; i < 4; i++) { FX.sparkles(e.x + N.rnd(-80, 80), e.y - e.hw * N.rnd(0.5, 1.2), 3, 30); e.jumpT = 0.5; await N.wait(0.9); }
    await e.walkTo(end[0], end[1], 1.4); await e.leave(); D.stBusy[st] = false;
  }, function () { return visStations().length > 0; });
  ev("cascanueces", "r", async function () { await passChar("cascanueces", 0.85, 0.6, ["Un, dos, un, dos…", "¡Firmes, cepas!"]); }, hasLane);
  ev("monito", "r", async function () { await passChar("monito", 0.42, 1.2, ["¡Hola! Vengo de la página monito", "¿Aquí también hay jobs corriendo?", "¡Feliz Navidad desde los servidores!"]); }, hasLane);
  ev("pinguino", "r", async function () { await passChar("pinguino", 0.45, 0.7, ["¿Esto es el -80? Hace calor…", "Me dijeron que había extremófilos", "Busco a A. ferrivorans, la que aguanta el frío"]); }, hasLane);
  ev("monoDeNieve", "r", async function () {
    var lane = N.pick(visLanes()); if (!lane) return; D.laneBusy[lane] = true;
    var l = L.lanes[lane], st = N.chance(0.5) ? l.a : l.b, en = otherEnd(lane, st), mid = N.lerp(st[0], en[0], 0.5), y = laneY(lane, mid);
    var s = N.spawnChar("nieve", st[0], st[1], { h: N.depthH(y) * 0.6, fadeIn: true });
    await s.walkTo(mid, y, 0.6);
    await s.say("Uf… ¿Navidad en Santiago con 32 grados?");
    for (var i = 0; i < 20; i++) { s.melt = i / 30; await N.wait(0.25); }
    var def = free(function (d) { return d.role === "lab"; });
    if (def) { var p = N.spawnPerson(def, en[0], en[1], { fadeIn: true, coat: true }); p.hold("ice", true); await p.walkTo(mid + N.depthH(y) * 0.4, y); p.face = -1; await p.say("¡Rápido, al refrigerador!"); walkOut(p, lane, en); }
    await s.say("¡Gracias! Me voy al frío", 2.5);
    await s.walkTo(en[0], en[1], 0.9); await s.leave(); D.laneBusy[lane] = false;
  }, hasLane);
  ev("bacteriaGigante", "r", async function () {
    var lane = N.pick(visLanes()); if (!lane) return; D.laneBusy[lane] = true;
    var l = L.lanes[lane], st = l.a, en = l.b, y = laneY(lane, (st[0] + en[0]) / 2);
    var b = N.spawnBact(N.speciesById("ferrooxidans"), st[0], st[1], { len: 420, fadeIn: true, hat: "santa", label: 20 });
    var def = free();
    var p = def ? N.spawnPerson(def, en[0], en[1], { fadeIn: true }) : null;
    if (p) { await p.walkTo(N.lerp(st[0], en[0], 0.7), y); }
    await b.walkTo(N.lerp(st[0], en[0], 0.4), y, 0.4);
    if (p) { p.faceTo(b.x); await p.say("¿Quién dejó la estufa a 30 °C toda la noche?"); }
    await b.say("¡Crecí mucho este año!"); b.jumpT = 1;
    if (p) walkOut(p, lane, en);
    await b.walkTo(st[0], st[1], 0.5); await b.leave(); D.laneBusy[lane] = false;
  }, hasLane);

  async function passChar(kind, hk, speed, lines) {
    var lane = N.pick(visLanes()); if (!lane) return; D.laneBusy[lane] = true;
    var l = L.lanes[lane], st = N.chance(0.5) ? l.a : l.b, en = otherEnd(lane, st), mid = N.lerp(st[0], en[0], 0.5), y = laneY(lane, mid);
    var c = N.spawnChar(kind, st[0], st[1], { h: N.depthH(y) * hk, fadeIn: true });
    await c.walkTo(mid, y, speed); c.jumpT = 0.6; await c.say(N.pick(lines));
    await c.walkTo(en[0], en[1], speed); await c.leave(); D.laneBusy[lane] = false;
  }
  async function bringFood(prop, line, replies) {
    var lane = N.pick(visLanes()), ds = freeN(3); if (!lane || ds.length < 2) return;
    D.laneBusy[lane] = true;
    var l = L.lanes[lane], x = N.lerp(l.a[0], l.b[0], 0.5), y = laneY(lane, x), H = N.depthH(y);
    var a = N.spawnPerson(ds[0], l.a[0], l.a[1], maybeXmas({ fadeIn: true })); a.hold(prop, prop === "pan");
    await a.walkTo(x - H * 0.25, y); a.face = 1;
    await a.say(line);
    var rest = ds.slice(1).map(function (d, i) { var q = N.spawnPerson(d, l.b[0], l.b[1], maybeXmas({ fadeIn: true })); q.walkTo(x + H * (0.3 + i * 0.32), y).then(function () { q.face = -1; }); return q; });
    await N.wait(3);
    for (var i = 0; i < rest.length; i++) { await rest[i].say(N.pick(replies)); if (N.chance(0.5)) rest[i].do("cheer", 1.5); }
    FX.hearts(x, y - H * 1.1, 4);
    await N.wait(2);
    D.laneBusy[lane] = false;
    await Promise.all([walkOut(a, lane, l.a)].concat(rest.map(function (q) { return walkOut(q, lane, l.b); })));
  }
  async function copahuePop() {
    var r = L.spots.copahue, cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2;
    FX.sparkles(cx, cy, 16, 90, "#ffb070"); N.music.sfx("sparkle");
    var b = N.spawnBact(N.speciesById("copahuensis"), cx, cy + 520, { len: 120, fly: true, alt: 520, fadeIn: true, label: 8, hat: "santa" });
    await N.wait(0.6); await b.say("¡Salí del póster del Copahue!");
    await b.walkTo(cx + 600, 1590, 0.5); await b.say(N.pick(b.sp.lines)); await b.leave();
  }

  /* ---------- escritorios de bioinformatica (ambiente) ---------- */
  D.deskBusy = {};
  function freeDesk() { var f = Object.keys(L.desks).filter(function (k) { return !D.deskBusy[k]; }); return f.length ? N.pick(f) : null; }
  function sitAt(def, dk) {
    D.deskBusy[dk] = true;
    var d = L.desks[dk], p = N.spawnPerson(def, d.x, d.hip + 0.4 * d.hw, { hw: d.hw, desk: d, fadeIn: true, acc: N.chance(0.3) ? N.pick(N.ACC_LIST) : null });
    p.face = N.chance(0.5) ? 1 : -1; p.deskId = dk;
    return p;
  }
  async function deskSession() {
    var dk = freeDesk(), def = free(function (d) { return d.role === "bio"; }) || (N.chance(0.3) ? free() : null);
    if (!dk || !def) return;
    var p = sitAt(def, dk), dur = N.rnd(70, 180), t0 = N.time;
    while (N.time - t0 < dur) {
      p.do("type", N.rnd(8, 18)); await N.wait(N.rnd(8, 18));
      var r = Math.random();
      if (r < 0.25) { p.do("cheer", 2); await p.say(N.pick(["¡Ensambló!", "¡Corrió sin errores!", "¡Bootstrap 100!", "¡Por fin!"])); }
      else if (r < 0.4) { p.do("facepalm", 2.5); await p.say(N.pick(["Segmentation fault…", "Out of memory", "¿Quién borró /tmp?", "KeyError: 'navidad'"])); }
      else if (r < 0.55) { p.hold("mug"); await p.do("sip", 6); p.prop = null; }
      else if (r < 0.65) await p.do("stretch", 3);
      else if (r < 0.75) await p.say(N.pick(BIO_LINES), 3);
    }
    await p.leave(); D.deskBusy[dk] = false;
  }

  /* ---------- show de los peluches (primer plano) ---------- */
  function leadsWithoutAudio(piece, cb) {   // si la TV aun no deja sonar, igual se animan
    var t0 = N.time, i = 0, leads = piece.ev.filter(function (e) { return e.lead; }).sort(function (a, b) { return a.t - b.t; });
    var a = N.add({ scene: "*", update: function () { while (i < leads.length && N.time - t0 >= leads[i].t) cb(leads[i++]); if (i >= leads.length) this.dead = true; } });
    return function () { a.dead = true; };
  }
  async function plushShow(kind) {
    N.plush.busy = true; D.exclusive = true;
    var sc = kind === "sing" ? N.pick(["shelfA", "shelfB"]) : N.pick(["shelfA", "shelfB"]);
    if (cam.scene === "lab") {
      await D.toZone("right");
      await cam.look(7960, 570, 3.2, 3.5);
    }
    await N.goScene(sc, function () { cam.x = 40; cam.y = 20; cam.z = 1.03; });
    cam.go(0, 0, 1, 26);
    var ps = N.plush.inScene(sc);
    await N.wait(1.2);
    for (var i = 0; i < ps.length; i++) { ps[i].wantAwake = 1; ps[i].hopT = 0.4; await N.wait(0.5); }
    if (kind === "hello") {
      for (i = 0; i < ps.length; i++) { N.bubbleLabel(ps[i]); await ps[i].say(N.pick(N.PLUSH_LINES[ps[i].id]), 3.4); }
      await N.wait(1); ps[0].say("¡Feliz Navidad, lab!", 3); ps.forEach(function (p) { p.hopT = 0.6; }); await N.wait(3);
    } else {
      ps.forEach(function (p) { p.hat = N.pick(["santa", "santa", "elf"]); });
      FX.sparkles(1280, 600, 20, 900); N.music.sfx("sparkle");
      await N.wait(1.5);
      await ps[0].say(N.pick(["¡Un villancico para el lab!", "Uno, dos, tres…", "¡Todos juntos!"]), 2.4);
      var piece = N.music.arrangeCarol(N.pick(["silent", "wish", "jingle", "deck", "hark", "angels", "wenceslas", "joy"]), { voice: "choir", harm: N.pick(["pad", "epiano"]), reps: 1, bass: true, color: false });
      var mode = N.pick(["all", "turns", "solo"]), soloist = N.pick(ps), ni = 0;
      var onNote = function (e) {
        ni++;
        var who = mode === "all" ? ps : mode === "solo" ? [soloist] : [ps[Math.floor(ni / 8) % ps.length]];
        who.forEach(function (p) { p.singNote(e.d, 0.9); });
        if (ni % 3 === 0) { var p = N.pick(who); FX.note(p.px + N.rnd(-60, 60), p.m.y - 10); }
      };
      var dur = Math.min(N.music.play(piece), 50), off;
      if (N.music.running() && N.music.on) off = N.music.onNote(onNote); else off = leadsWithoutAudio(piece, onNote);
      ps.forEach(function (p) { p.dance = N.chance(0.6); });
      await N.wait(dur);
      off(); N.music.stopPiece();
      ps.forEach(function (p) { p.dance = false; p.hopT = 0.6; });
      FX.sparkles(1280, 600, 20, 900);
      await N.wait(2.5);
      ps.forEach(function (p) { p.hat = null; });
    }
    await N.wait(1.5);
    ps.forEach(function (p) { p.wantAwake = 0; });
    await N.wait(1.2);
    await N.goScene("lab", function () { cam.x = 7960 - 1920 / 3.2 * N.CW / N.CH; cam.y = 300; cam.z = 3.2; cam.look(7960, 570, 3.2, 0); });
    await cam.go(N.LAB.zones.right, 0, 1, 4);
    N.plush.busy = false; D.exclusive = false;
  }

  /* ---------- camara y planificacion ---------- */
  var zoneBag = null, nextPan = 0, nextC = 0, nextS = 0, nextR = 0, nextDesk = 0, panning = false;
  var bags = {};
  D.active = 0;
  D.toZone = async function (z) {
    if (cam.zone() === z && !cam.tw) return;
    panning = true;
    var dist = Math.abs(L.zones[z] - cam.x), d = N.clamp(dist / 140, 10, 32);
    await cam.toZone(z, d / N.TURBO);
    panning = false; nextPan = N.time + N.rnd(70, 140);
  };
  D.run = function (id) {
    var e = EV[id]; if (!e) return;
    D.active++; N.log("evento:", id);
    var p;
    try { p = Promise.resolve(e.run()); } catch (err) { console.error(err); p = Promise.resolve(); }
    p.catch(function (err) { console.error("evento", id, err); }).then(function () { D.active--; });
    return p;
  };
  function pick(tier) {
    if (!bags[tier]) bags[tier] = new N.Bag(Object.keys(EV).filter(function (k) { return EV[k].tier === tier; }), tier === "c" ? 2 : 3);
    return bags[tier].next(function (k) { return EV[k].can(); });
  }
  D.start = function () {
    var z = N.Q.get("zona"); cam.x = L.zones[z] != null ? L.zones[z] : L.zones[N.pick(["left", "center", "right"])];
    nextPan = N.time + N.rnd(60, 100); nextC = N.time + 3; nextS = N.time + N.rnd(50, 90); nextR = N.time + N.rnd(150, 260); nextDesk = N.time + 2;
    zoneBag = new N.Bag(["left", "center", "right"], 1);
    FX.tvNext("fire");
    var ev0 = N.Q.get("ev"); if (ev0) N.wait(1).then(function () { D.run(ev0); });
    if (N.Q.has("galeria")) {   // prueba visual: todos los personajes juntos
      D.paused = true;
      ["pascuero", "reno", "galleta", "nieve", "grunon", "duende", "cascanueces", "monito", "pinguino"].forEach(function (k, i) {
        var hk = { pascuero: 0.85, reno: 0.8, galleta: 0.35, nieve: 0.6, grunon: 0.7, duende: 0.5, cascanueces: 0.85, monito: 0.42, pinguino: 0.45 }[k];
        N.spawnChar(k, 250 + i * 400, 1600, { h: N.depthH(1600) * hk });
      });
      N.SPECIES.slice(0, 9).forEach(function (sp, i) { N.spawnBact(sp, 300 + i * 400, 1900, { len: 150, label: 99, hat: i % 3 ? "santa" : null }); });
      N.PEOPLE.forEach(function (d, i) { if (i < 9) N.spawnPerson(d, 3000 + i * 450, 1640, { acc: N.ACC_LIST[i % 5] }); });
      return;
    }
    // dos escritorios ocupados desde el inicio
    deskSession(); setTimeout(deskSession, 4000);
  };
  D.tick = function () {
    if (D.paused) return;
    var t = N.time;
    if (t > nextDesk) { nextDesk = t + N.rnd(25, 60); if (Object.keys(D.deskBusy).filter(function (k) { return D.deskBusy[k]; }).length < 3) deskSession(); }
    if (D.exclusive || cam.scene !== "lab") return;
    if (!panning && t > nextPan && D.active <= 1) {
      var z = zoneBag.next(function (k) { return k !== cam.zone(); });
      D.toZone(z);
    }
    if (panning) return;
    var busyPeople = N.PEOPLE.filter(function (d) { return d.busy; }).length;
    if (t > nextC && D.active < 3 && busyPeople < 8) {
      nextC = t + N.rnd(7, 15) / N.TURBO;
      var id = pick("c"); if (id) D.run(id);
    }
    if (t > nextS && D.active < 2) {
      nextS = t + N.rnd(70, 130) / N.TURBO;
      var s = pick("s"); if (s) D.run(s);
    }
    if (t > nextR && D.active < 2) {
      nextR = t + N.rnd(170, 320) / N.TURBO;
      var r = pick("r"); if (r) D.run(r);
    }
  };

  /* ---------- toques en la pantalla ---------- */
  var taps = [], cool = {};
  function cooled(k, s) { if (cool[k] && N.time < cool[k]) return false; cool[k] = N.time + s; return true; }
  function inR(r, x, y) { return x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3]; }
  D.tap = function (wx, wy) {
    taps.push(N.time); taps = taps.filter(function (t) { return N.time - t < 4; });
    if (taps.length >= 7 && cooled("secret", 30)) { taps = []; var r = pick("r"); if (r) D.run(r); return; }
    // actores (de adelante hacia atras)
    var list = N.actors.filter(function (a) { return a.scene === cam.scene && a.hit && !a.dead; }).sort(function (a, b) { return b.z - a.z; });
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
    if (cam.scene !== "lab") {   // en el primer plano: tocar fuera de los peluches vuelve al lab
      if (!N.plush.busy && cooled("back", 2)) N.goScene("lab", function () { cam.x = L.zones.right; cam.y = 0; cam.z = 1; });
      return;
    }
    var S = L.spots;
    if (inR(S.shelf, wx, wy)) { if (!N.plush.busy && cooled("shelf", 20)) D.run("peluchesSaludan"); return; }
    if (inR(S.tv, wx, wy)) { FX.tvNext(); N.music.sfx("pop"); return; }
    if (inR(S.copahue, wx, wy)) { if (cooled("copahue", 8)) copahuePop(); return; }
    if (inR(S.poster, wx, wy)) { FX.sparkles(wx, wy, 10, 80); posterSay(wx, wy); return; }
    if (inR(S.flasks, wx, wy)) {
      var best = 0, bd = 1e9; L.flasks.forEach(function (f, k) { var dd = Math.abs(f[0] - wx); if (dd < bd) { bd = dd; best = k; } });
      FX.bubbleFlask(best, 6); N.music.sfx("pop");
      if (cooled("flaskB", 5)) { var f = L.flasks[best], b = N.spawnBact(N.pick(N.SPECIES), f[0], f[1] - 120 + 900, { len: 90, fly: true, alt: 900, fadeIn: true, label: 6 }); b.walkTo(f[0] + N.rnd(-300, 300), f[1] + 700, 0.4).then(function () { b.say(N.pick(b.sp.lines), 2.5).then(function () { b.leave(); }); }); }
      return;
    }
    if (inR(S.monitor, wx, wy)) { monitorSay(wx, wy); return; }
    if (inR(S.window, wx, wy)) {
      FX.outsideSnow = 1; setTimeout(function () { FX.outsideSnow = 0; }, 15000);
      if (cooled("sleigh", 60)) D.run("trineoVentana");
      return;
    }
    if (inR(S.fridge, wx, wy) && cooled("fridge", 30)) { D.run("pinguino"); return; }
    // luces
    for (var gI = 0; gI < L.garlands.length; gI++) {
      var pts = L.garlands[gI].pts;
      if (wx > pts[0][0] && wx < pts[pts.length - 1][0] && Math.abs(wy - pts[0][1]) < 90) { FX.nextLights(); N.music.sfx("sparkle"); return; }
    }
    // suelo u otro: chispitas y a veces aparece una bacteria
    FX.sparkles(wx, wy, 6, 40); N.music.sfx("sparkle");
    if (wy > L.floorY && cooled("floorB", 6) && N.chance(0.5)) {
      var y = N.clamp(wy, 1560, 1700), bb = N.spawnBact(N.pick(N.SPECIES), wx, y, { len: N.rnd(110, 150), fadeIn: true, label: 6, hat: N.chance(0.5) ? "santa" : null });
      bb.jumpT = 0.6;
      bb.say(N.pick(bb.sp.lines), 2.8).then(function () { return bb.walkTo(wx + N.rnd(-400, 400), y, 0.7); }).then(function () { bb.leave(); });
    }
  };
  function tapPerson(p) {
    var d = p.d;
    if (p.act !== "sleep") p.do(N.chance(0.6) ? "wave" : "cheer", 1.8);
    else { p.act = "idle"; p.do("jump", 0.8); }
    var lines = d.role === "pi" ? PI_LINES : d.role === "bio" ? BIO_LINES : LAB_LINES;
    var txt = N.chance(0.4) ? "¡Hola! Soy " + d.name : N.chance(0.5) ? N.pick(XMAS_LINES) : N.pick(lines);
    p.say(txt, 2.8);
  }
  var posterMsgs = ["Moya-Beltrán et al. 2021: la clase Acidithiobacillia", "5 géneros: Acidithiobacillus, Fervidacidithiobacillus, Igneacidithiobacillus, Ambacidithiobacillus y Thermithiobacillus", "Viven a pH 2… ¡y felices!"];
  function posterSay(x, y) { N.bubble({ headPos: function () { return [x, y]; }, scene: "lab" }, N.pick(posterMsgs), 4); }
  function monitorSay(x, y) { N.bubble({ headPos: function () { return [x, y]; }, scene: "lab" }, N.pick(["$ sbatch navidad.sh", "Job 24601: PENDING (Resources)", "BLAST: 0 hits", "100% genomas ensamblados", "$ git commit -m \"feliz navidad\""]), 3.5); }
})();
