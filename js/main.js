/* Arranque: lienzo, bucle de dibujo (30 cps en la TV), toques y boton de sonido. */
(function () {
  "use strict";
  N.VER = "6";
  var cv = document.getElementById("c"), g = cv.getContext("2d", { alpha: false });
  var cam = N.cam;

  function size() {
    var dpr = window.devicePixelRatio || 1, w = innerWidth * dpr, h = innerHeight * dpr;
    var maxH = parseFloat(N.Q.get("alto")) || (N.LOW ? 1080 : N.Q.has("bajo") ? 1080 : 2160);
    var k = Math.min(1, maxH / h);
    N.CW = cv.width = Math.round(w * k); N.CH = cv.height = Math.round(h * k);
    N.UI = N.CH / 1080;
  }
  size();
  addEventListener("resize", function () { size(); });

  /* ---------- carga ---------- */
  var loadEl = document.getElementById("load"), bar = document.getElementById("bar");
  function prog(k) { if (bar) bar.style.width = Math.round(k * 100) + "%"; }
  async function boot() {
    var s0 = N.CH / 2160;
    N.buildPeople(Math.round(1050 * s0 * 1.1));
    N.buildCritters(Math.round(260 * s0 * 1.6), Math.round(900 * s0 * 1.1));
    await N.loadScenes(prog);
    N.buildPlush(Math.min(1, N.CH / 2160) * 3.4);
    N.fx.initLights(); N.fx.initWindow(); N.fx.initTV(); N.fx.initFlasks(); N.fx.initClock();
    N.director.start();
    loadEl.style.opacity = 0; setTimeout(function () { loadEl.style.display = "none"; }, 1200);
    var sim = parseFloat(N.Q.get("sim"));
    if (sim) { await N.sim(sim); N.ROT = 0; N.TURBO = 0.0001; }
    last = performance.now(); requestAnimationFrame(frame);
    if (N.music.on) { N.music.init(); }
  }

  /* ---------- noche (solo cambia la ventana y brillan mas las luces) ---------- */
  function nightLevel() {
    var q = N.Q.get("noche"); if (q != null) return parseFloat(q) || 0;
    var d = new Date(), h = d.getHours() + d.getMinutes() / 60;
    if (h >= 21 || h < 6) return 1;
    if (h >= 19.5) return (h - 19.5) / 1.5;
    if (h < 7.5) return 1 - (h - 6) / 1.5;
    return 0;
  }

  /* ---------- bucle ---------- */
  var last = 0, acc = 0, fpsT = 0, fpsN = 0, fps = 0, MIN_DT = N.LOW ? 31 : 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var ms = now - last;
    if (ms < MIN_DT) return;
    last = now;
    var dt = Math.min(0.1, ms / 1000) * N.TURBO;
    fpsN++; if (now - fpsT > 1000) { fps = fpsN; fpsN = 0; fpsT = now; }
    step(dt);
    render();
  }

  function step(dt) {
    N.time += dt;
    if (N.night == null || Math.floor(N.time) % 30 === 0) N.night = nightLevel();
    N.tickWaits();
    N.director.tick();
    N.music.tick();
    for (var i = 0; i < N.actors.length; i++) { var a = N.actors[i]; if (!a.dead && a.update) a.update(dt); }
    N.actors = N.actors.filter(function (a) { return !a.dead; });
    N.fx.update(dt); N.fx.tickWeather(dt);
    cam.update(dt, N.CW, N.CH);
  }
  /* ?sim=60: adelanta 60 s de simulacion (para probar sin pantalla) */
  N.sim = async function (sec) {
    for (var k = 0; k < sec * 30; k++) { step(1 / 30); if (k % 30 === 0) await Promise.resolve(); }
    render();
  };

  function render() {
    var S = N.SCENES[cam.scene];
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#101214"; g.fillRect(0, 0, N.CW, N.CH);
    var s = cam.s;
    g.setTransform(s, 0, 0, s, -cam.x * s, -cam.y * s);
    // el lab es circular: se dibuja la vuelta k (y la siguiente si la vista cruza el empalme)
    var W = N.LAB.w, k0 = Math.floor(cam.x / W), k1 = Math.floor((cam.x + cam.vw) / W), k, i, a;
    for (k = k0; k <= k1; k++) { g.save(); g.translate(k * W, 0); if (S && S.bg) S.bg.draw(g, k * W); g.restore(); }
    var list = [], x0 = cam.x - 700, x1 = cam.x + cam.vw + 700;
    for (i = 0; i < N.actors.length; i++) {
      a = N.actors[i];
      if (!a.draw || a.layer || a.scene !== cam.scene) continue;
      if (a.static) { for (k = k0; k <= k1; k++) list.push({ a: a, k: k, z: a.z }); }
      else if (a.x == null || (a.x > x0 && a.x < x1)) list.push({ a: a, k: 0, z: a.z });
    }
    list.sort(function (p, q) { return p.z - q.z; });
    for (i = 0; i < list.length; i++) {
      var e = list[i];
      if (e.k) { g.save(); g.translate(e.k * W, 0); e.a.draw(g); g.restore(); } else e.a.draw(g);
    }
    N.fx.draw(g, false); N.fx.draw(g, true);
    for (k = k0; k <= k1; k++) { g.save(); g.translate(k * W, 0); N.debugDraw(g); g.restore(); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    for (i = 0; i < N.actors.length; i++) { a = N.actors[i]; if (a.layer === "screen" && a.draw && a.scene === cam.scene) a.draw(g); }
    if (N.fade > 0) { g.fillStyle = "rgba(250,247,240," + N.fade + ")"; g.fillRect(0, 0, N.CW, N.CH); }
    if (N.DEBUG) {
      g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(8, 8, 520 * N.UI, 30 * N.UI);
      g.fillStyle = "#0f0"; g.font = Math.round(18 * N.UI) + "px monospace";
      if (N.errors && N.errors.length) { g.fillStyle = "#f44"; N.errors.slice(-6).forEach(function (m, i) { g.fillText(m.slice(0, 160), 14, (60 + i * 24) * N.UI); }); g.fillStyle = "#0f0"; }
      document.title = "t=" + N.time.toFixed(1) + " P=" + N.actors.filter(function (a) { return a.d; }).map(function (a) { return a.d.id + "@" + Math.round(a.x) + "," + Math.round(a.y) + " a" + a.alpha.toFixed(2) + " h" + Math.round(a.hw); }).join(";") + " err=" + (N.errors ? N.errors.join(" | ") : "");
      g.fillText("t" + N.time.toFixed(0) + " " + fps + " fps · " + N.actors.length + " act · " + N.fx.count() + " part · " + cam.zone() + " · " + N.music.info(), 14, 30 * N.UI);
    }
  }

  /* ---------- toques ---------- */
  function onDown(e) {
    var t = e.changedTouches ? e.changedTouches[0] : e;
    var r = cv.getBoundingClientRect();
    var sx = (t.clientX - r.left) * N.CW / r.width, sy = (t.clientY - r.top) * N.CH / r.height;
    var w = cam.toWorld(sx, sy);
    if (N.DEBUG) console.log("mundo:", Math.round(w[0]), Math.round(w[1]));
    N.director.tap(w[0], w[1]);
  }
  var lastTouch = 0;
  cv.addEventListener("touchstart", function (e) { lastTouch = Date.now(); onDown(e); e.preventDefault(); }, { passive: false });
  cv.addEventListener("mousedown", function (e) { if (Date.now() - lastTouch > 800) onDown(e); });
  // el audio se autoriza con cualquier toque (la TV lo exige)
  function unlock() { if (N.music.on) N.music.unlock(); updBtn(); }
  ["touchend", "click", "keydown", "pointerup"].forEach(function (ev) { document.addEventListener(ev, unlock, true); });

  /* ---------- boton de sonido ---------- */
  var btn = document.getElementById("snd");
  function updBtn() { btn.className = N.music.on ? "on" : "off"; }
  btn.addEventListener("click", function (e) { e.stopPropagation(); N.music.setOn(!N.music.on); if (N.music.on) N.music.unlock(); updBtn(); });
  btn.addEventListener("touchstart", function (e) { e.stopPropagation(); }, { passive: true });
  updBtn();

  /* recarga de madrugada para que la TV no acumule memoria */
  var bootAt = Date.now();
  setInterval(function () { var h = new Date().getHours(); if (h === 5 && Date.now() - bootAt > 6 * 3600 * 1000) location.reload(); }, 600000);

  boot().catch(function (e) { console.error(e); loadEl.textContent = "Error al cargar: " + e; });
})();
