/* Musica suave generada en el navegador (Web Audio, sin archivos ni derechos de autor).
 * Alterna villancicos tradicionales (dominio publico) con arreglos que cambian cada vez
 * (tonalidad, tempo, instrumentos, armonias "lofi") y piezas ambientales que no son navidenas.
 * Siempre encendida por defecto y a volumen bajo; la TV la deja sonar tras el primer toque. */
(function () {
  "use strict";
  var M = N.music = { on: true, vol: 0.22, ready: false, piece: null, listeners: [] };
  try { var sv = localStorage.getItem("navidad.vol"); if (sv != null) M.vol = parseFloat(sv); if (localStorage.getItem("navidad.mute") === "1") M.on = false; } catch (e) {}
  var Q = N.Q.get("vol"); if (Q != null) M.vol = parseFloat(Q) || 0;
  if (N.Q.get("musica") === "off") M.on = false;

  var ctx = null, master, comp, rev, revIn, dry;

  function impulse(sec, decay) {
    var rate = ctx.sampleRate, len = Math.floor(rate * sec), b = ctx.createBuffer(2, len, rate);
    for (var c = 0; c < 2; c++) {
      var d = b.getChannelData(c);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }
  M.init = function () {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = M.ctx = new AC();
    master = ctx.createGain(); master.gain.value = M.on ? M.vol : 0;
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    master.connect(comp); comp.connect(ctx.destination);
    dry = ctx.createGain(); dry.gain.value = 0.8; dry.connect(master);
    rev = ctx.createConvolver(); rev.buffer = impulse(3.2, 2.6);
    revIn = ctx.createGain(); revIn.gain.value = 0.45; revIn.connect(rev); rev.connect(master);
    M.ready = true;
  };
  M.unlock = function () {
    M.init(); if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    var b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
  };
  M.setOn = function (on) {
    M.on = on; try { localStorage.setItem("navidad.mute", on ? "0" : "1"); } catch (e) {}
    if (master) master.gain.setTargetAtTime(on ? M.vol : 0, ctx.currentTime, 0.4);
  };
  M.running = function () { return ctx && ctx.state === "running"; };

  /* ---------- instrumentos ---------- */
  function out(node, wet) {
    node.connect(dry); var w = ctx.createGain(); w.gain.value = wet == null ? 0.6 : wet; node.connect(w); w.connect(revIn);
  }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function env(g, t, a, peak, d, sus, rel, end) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * sus, t + a, d);
    g.gain.setTargetAtTime(0.0001, end, rel);
  }
  var INST = {
    celesta: function (m, t, d, v) {   // campanita suave
      var f = mtof(m + 12), g = ctx.createGain(); out(g, 0.7);
      [[1, 1], [2.0, 0.25], [3.98, 0.08]].forEach(function (p) {
        var o = ctx.createOscillator(), gg = ctx.createGain(); o.frequency.value = f * p[0]; gg.gain.value = p[1]; o.connect(gg); gg.connect(g); o.start(t); o.stop(t + 3);
      });
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16 * v, t + 0.006); g.gain.setTargetAtTime(0.0001, t + 0.01, 0.55);
    },
    musicbox: function (m, t, d, v) {
      var f = mtof(m + 12), g = ctx.createGain(); out(g, 0.75);
      [[1, 1], [3.0, 0.18], [5.4, 0.06]].forEach(function (p) {
        var o = ctx.createOscillator(), gg = ctx.createGain(); o.frequency.value = f * p[0]; gg.gain.value = p[1]; o.connect(gg); gg.connect(g); o.start(t); o.stop(t + 3.5);
      });
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.13 * v, t + 0.004); g.gain.setTargetAtTime(0.0001, t + 0.01, 0.8);
    },
    epiano: function (m, t, d, v) {   // piano electrico FM
      var f = mtof(m), car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
      car.frequency.value = f; mod.frequency.value = f; mod.connect(mg); mg.connect(car.frequency);
      mg.gain.setValueAtTime(f * 1.6, t); mg.gain.setTargetAtTime(f * 0.15, t, 0.25);
      car.connect(g); out(g, 0.5);
      env(g, t, 0.008, 0.12 * v, 0.6, 0.35, 0.35, t + d);
      car.start(t); mod.start(t); car.stop(t + d + 2); mod.stop(t + d + 2);
    },
    pluck: function (m, t, d, v) {
      var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = mtof(m); f.type = "lowpass"; f.frequency.value = 2200;
      o.connect(f); f.connect(g); out(g, 0.5);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.14 * v, t + 0.005); g.gain.setTargetAtTime(0.0001, t + 0.01, 0.22);
      o.start(t); o.stop(t + 1.5);
    },
    pad: function (m, t, d, v) {   // colchon calido
      var g = ctx.createGain(), f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900; f.Q.value = 0.5;
      f.connect(g); out(g, 0.8);
      [-6, 5].forEach(function (cents) { var o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = cents; o.connect(f); o.start(t); o.stop(t + d + 3); });
      env(g, t, Math.min(1.2, d * 0.4), 0.028 * v, 0.8, 0.85, 0.9, t + d);
    },
    bass: function (m, t, d, v) {
      var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = "triangle"; o.frequency.value = mtof(m); f.type = "lowpass"; f.frequency.value = 500;
      o.connect(f); f.connect(g); out(g, 0.15);
      env(g, t, 0.02, 0.16 * v, 0.5, 0.5, 0.2, t + d * 0.9);
      o.start(t); o.stop(t + d + 1.5);
    },
    choir: function (m, t, d, v) {   // "uuu" suave (para las bacterias que cantan)
      var g = ctx.createGain(), src = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain();
      src.type = "sawtooth"; src.frequency.value = mtof(m); vib.frequency.value = 5; vg.gain.value = mtof(m) * 0.012;
      vib.connect(vg); vg.connect(src.frequency);
      var f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(); f1.type = f2.type = "bandpass";
      f1.frequency.value = 330; f1.Q.value = 6; f2.frequency.value = 850; f2.Q.value = 8;
      var g2 = ctx.createGain(); g2.gain.value = 0.35;
      src.connect(f1); src.connect(f2); f1.connect(g); f2.connect(g2); g2.connect(g); out(g, 0.8);
      env(g, t, 0.12, 0.5 * v, 0.3, 0.8, 0.18, t + d * 0.95);
      src.start(t); vib.start(t); src.stop(t + d + 1.2); vib.stop(t + d + 1.2);
    },
    bells: function (m, t, d, v) {   // cascabeles muy suaves
      var len = 0.12, b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate), dd = b.getChannelData(0);
      for (var i = 0; i < dd.length; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / dd.length, 3);
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = b; f.type = "highpass"; f.frequency.value = 6000; s.connect(f); f.connect(g); out(g, 0.4);
      g.gain.value = 0.05 * v; s.start(t);
    }
  };

  /* ---------- teoria minima ---------- */
  var NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function parseNote(s) {   // "F#4" -> midi
    var m = /^([A-G])(#|b)?(-?\d)$/.exec(s); if (!m) return null;
    return 12 * (parseInt(m[3], 10) + 1) + NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  }
  function parseMel(str) {   // "G4:1.5 A4:.5 | R:1" -> [{m,d}]
    var out = [];
    str.replace(/\|/g, " ").split(/\s+/).forEach(function (tok) {
      if (!tok) return;
      var p = tok.split(":"), d = p[1] ? parseFloat(p[1]) : 1;
      out.push({ m: p[0] === "R" ? null : parseNote(p[0]), d: d });
    });
    return out;
  }
  var QUAL = { "": [0, 4, 7], m: [0, 3, 7], "7": [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6], sus: [0, 5, 7], "6": [0, 4, 7, 9], add9: [0, 4, 7, 14], m9: [0, 3, 7, 10, 14] };
  function parseChord(s) {   // "D7:2" -> {root, q, d}
    var p = s.split(":"), m = /^([A-G])(#|b)?(.*)$/.exec(p[0]);
    var root = NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    return { root: root, q: m[3] || "", d: p[1] ? parseFloat(p[1]) : 4 };
  }
  function parseChords(str) { return str.replace(/\|/g, " ").split(/\s+/).filter(Boolean).map(parseChord); }

  /* ---------- villancicos (dominio publico), en Do ---------- */
  var CAROLS = [
    { id: "jingle", title: "Jingle Bells", bpm: 112, beats: 4,
      mel: "G3 E4 D4 C4 | G3:3 G3:.5 G3:.5 | G3 E4 D4 C4 | A3:4 | A3 F4 E4 D4 | B3:4 | G4 G4 F4 D4 | E4:4 | G3 E4 D4 C4 | G3:4 | G3 E4 D4 C4 | A3:3 A3 | A3 F4 E4 D4 | G4 G4 G4 G4 | A4 G4 F4 D4 | C4:2 G4:2 |" +
           "E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4:1.5 D4:.5 | E4:4 | F4 F4 F4:1.5 F4:.5 | F4 E4 E4 E4:.5 E4:.5 | E4 D4 D4 E4 | D4:2 G4:2 | E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4:1.5 D4:.5 | E4:4 | F4 F4 F4 F4 | F4 E4 E4 E4:.5 E4:.5 | G4 G4 F4 D4 | C4:4",
      ch: "C C C F F G7 G7 C C C C F F G7 G7 G7 C C C C F C D7 G7 C C C C F C G7 C" },
    { id: "silent", title: "Noche de paz", bpm: 84, beats: 3,
      mel: "G4:1.5 A4:.5 G4 | E4:3 | G4:1.5 A4:.5 G4 | E4:3 | D5:2 D5 | B4:3 | C5:2 C5 | G4:3 | A4:2 A4 | C5:1.5 B4:.5 A4 | G4:1.5 A4:.5 G4 | E4:3 | A4:2 A4 | C5:1.5 B4:.5 A4 | G4:1.5 A4:.5 G4 | E4:3 | D5:2 D5 | F5:1.5 D5:.5 B4 | C5:3 | E5:3 | C5:1.5 G4:.5 E4 | G4:1.5 F4:.5 D4 | C4:3 | R:3",
      ch: "C:3 C:3 C:3 C:3 G:3 G:3 C:3 C:3 F:3 F:3 C:3 C:3 F:3 F:3 C:3 C:3 G:3 G7:3 C:3 C:3 C:3 G7:3 C:3 C:3" },
    { id: "deck", title: "Deck the Halls", bpm: 104, beats: 4,
      mel: "G4:1.5 F4:.5 E4 D4 | C4 D4 E4 C4 | D4:.5 E4:.5 F4:.5 D4:.5 E4:1.5 D4:.5 | C4 B3 C4:2 | G4:1.5 F4:.5 E4 D4 | C4 D4 E4 C4 | D4:.5 E4:.5 F4:.5 D4:.5 E4:1.5 D4:.5 | C4 B3 C4:2 | D4:1.5 E4:.5 F4 D4 | E4:1.5 F4:.5 G4 D4 | E4:.5 F#4:.5 G4 A4:.5 B4:.5 C5 | B4 A4 G4:2 | G4:1.5 F4:.5 E4 D4 | C4 D4 E4 C4 | A4:.5 A4:.5 A4:.5 A4:.5 G4:1.5 F4:.5 | E4 D4 C4:2",
      ch: "C:4 C:4 G7:2 C:2 G7:2 C:2 C:4 C:4 G7:2 C:2 G7:2 C:2 G:4 C:2 G:2 D7:4 D7:2 G:2 C:4 C:4 F:4 G7:2 C:2" },
    { id: "wish", title: "We Wish You a Merry Christmas", bpm: 108, beats: 3,
      mel: "R:2 G4 | C5 C5:.5 D5:.5 C5:.5 B4:.5 | A4 A4 A4 | D5 D5:.5 E5:.5 D5:.5 C5:.5 | B4 G4 G4 | E5 E5:.5 F5:.5 E5:.5 D5:.5 | C5 A4 G4:.5 G4:.5 | A4 D5 B4 | C5:3",
      ch: "C:3 C:3 F:3 D7:3 G:3 E7:3 Am:3 Dm:2 G7:1 C:3" },
    { id: "joy", title: "Joy to the World", bpm: 96, beats: 4,
      mel: "C5:2 B4:1.5 A4:.5 | G4:3 F4 | E4:2 D4:2 | C4:3 G4 | A4:3 A4 | B4:3 B4 | C5:3 C5 | C5 B4 A4 G4 | G4:1.5 F4:.5 E4 C5 | C5 B4 A4 G4 | G4:1.5 F4:.5 E4 E4 | E4 E4 E4 E4:.5 F4:.5 | G4:3 F4:.5 E4:.5 | D4 D4 D4 D4:.5 E4:.5 | F4:3 E4:.5 D4:.5 | C4 C5:2 A4 | G4:1.5 F4:.5 E4 F4 | E4:2 D4:2 | C4:4",
      ch: "C:4 G:2 F:2 C:2 G:2 C:4 F:4 G:4 C:4 C:4 C:4 C:4 C:4 C:4 C:4 G:4 G7:4 C:2 F:2 C:4 C:2 G:2 C:4" },
    { id: "hark", title: "Hark! The Herald Angels Sing", bpm: 100, beats: 4,
      mel: "G4 C5 C5:1.5 B4:.5 | C5 E5 E5 D5 | G5 G5 G5:1.5 F5:.5 | E5 D5 E5:2 | G4 C5 C5:1.5 B4:.5 | C5 E5 E5 D5 | G5 D5 D5:1.5 B4:.5 | B4 A4 G4:2",
      ch: "C:4 C:2 G:2 C:4 C:1 G:1 C:2 C:4 C:2 G:2 G:4 G:1 D:1 G:2" },
    { id: "wenceslas", title: "Good King Wenceslas", bpm: 100, beats: 4,
      mel: "G4 G4 G4 A4 | G4 G4 D4:2 | E4 D4 E4 F#4 | G4:2 G4:2 | G4 G4 G4 A4 | G4 G4 D4:2 | E4 D4 E4 F#4 | G4:2 G4:2 | D5 C5 B4 A4 | B4 A4 G4:2 | E4 D4 E4 F#4 | G4:2 G4:2 | D4 D4 E4 F#4 | G4 G4 A4:2 | D5 C5 B4 A4 | G4:2 C5:2 | G4:4",
      ch: "G:4 G:2 D:2 C:2 D:2 G:4 G:4 G:2 D:2 C:2 D:2 G:4 G:2 D:2 G:4 C:2 D:2 G:4 G:2 D:2 G:2 D:2 G:2 D:2 Em:2 C:2 G:4", key: -7 },
    { id: "angels", title: "Ángeles cantando están", bpm: 92, beats: 4,
      mel: "E4 E4 E4 G4 | G4:1.5 F4:.5 E4:2 | E4 D4 E4 G4 | E4:1.5 D4:.5 C4:2 | E4 E4 E4 G4 | G4:1.5 F4:.5 E4:2 | E4 D4 E4 G4 | E4:1.5 D4:.5 C4:2",
      ch: "C:4 G:2 C:2 C:2 G:2 C:1 G:1 C:2 C:4 G:2 C:2 C:2 G:2 C:1 G:1 C:2" },
    { id: "bells", title: "Carol of the Bells", bpm: 132, beats: 3, minor: true,
      mel: "Bb4 A4:.5 Bb4:.5 G4 | Bb4 A4:.5 Bb4:.5 G4 | Bb4 A4:.5 Bb4:.5 G4 | Bb4 A4:.5 Bb4:.5 G4 | Bb4 A4:.5 Bb4:.5 G4 | Bb4 A4:.5 Bb4:.5 G4 | Bb4 A4:.5 Bb4:.5 G4 | Bb4 A4:.5 Bb4:.5 G4 |" +
           "D5 C5:.5 D5:.5 Bb4 | D5 C5:.5 D5:.5 Bb4 | D5 C5:.5 D5:.5 Bb4 | D5 C5:.5 D5:.5 Bb4 | G5 G5:.5 G5:.5 F5:.5 Eb5:.5 | D5 D5:.5 D5:.5 C5:.5 Bb4:.5 | C5 C5:.5 C5:.5 D5:.5 C5:.5 | G4 G4 G4 | G5 G5:.5 G5:.5 F5:.5 Eb5:.5 | D5 D5:.5 D5:.5 C5:.5 Bb4:.5 | C5 C5:.5 C5:.5 D5:.5 C5:.5 | G4:3",
      ch: "Gm:3 Gm:3 Eb:3 D:3 Gm:3 Gm:3 Eb:3 D:3 Gm:3 Gm:3 Eb:3 D:3 Gm:3 Gm:3 Cm:3 D:3 Gm:3 Gm:3 Cm:3 Gm:3", key: -7 }
  ];
  CAROLS.forEach(function (c) { c.notes = parseMel(c.mel); c.chords = parseChords(c.ch); });
  M.CAROLS = CAROLS;

  /* ---------- armado de una pieza: lista de eventos {t (s), inst, m, d, v, lead} ---------- */
  function chordNotes(c, base, color) {
    var q = c.q;
    if (color && q === "") q = N.pick(["maj7", "add9", "6", ""]);
    if (color && q === "m") q = N.pick(["m7", "m9", "m"]);
    var iv = QUAL[q] || QUAL[""];
    return iv.map(function (i) { return base + c.root + i; });
  }
  function arrangeCarol(carol, o) {
    o = o || {};
    var ev = [], spb = 60 / (carol.bpm * (o.tempo || N.rnd(0.72, 0.9))), key = (carol.key || 0) + (o.key != null ? o.key : N.pick([0, 2, -3, 5, -2, 3]));
    var lead = o.lead || N.pick(["celesta", "musicbox", "epiano", "pluck", "celesta"]);
    var harm = o.harm || N.pick(["pad", "epiano", "arp"]);
    var color = o.color != null ? o.color : N.chance(0.6);
    var reps = o.reps || (carol.notes.length < 40 ? 2 : 1);
    var bass = o.bass != null ? o.bass : N.chance(0.6);
    var t0 = 0, total = 0;
    carol.notes.forEach(function (n) { total += n.d; });
    for (var r = 0; r < reps; r++) {
      var lr = r === 1 && N.chance(0.5) ? N.pick(["celesta", "musicbox", "epiano", "pluck"]) : lead;
      var oct = r === 1 && lr !== "epiano" && N.chance(0.3) ? 12 : 0;
      var t = t0;
      carol.notes.forEach(function (n) {
        if (n.m != null) ev.push({ t: t * spb, inst: o.voice || lr, m: n.m + key + oct + (o.voice === "choir" ? 0 : (lr === "epiano" || lr === "pluck" ? 12 : 0)), d: n.d * spb, v: 0.9, lead: true });
        t += n.d;
      });
      t = t0;
      carol.chords.forEach(function (c, ci) {
        var notes = chordNotes(c, 48 + key, color), d = c.d * spb;
        if (harm === "pad") notes.forEach(function (m) { ev.push({ t: t * spb, inst: "pad", m: m + 12, d: d, v: 0.9 }); });
        else if (harm === "epiano") { var beats = c.d; for (var b = 0; b < beats; b += (carol.beats === 3 ? 1 : 2)) notes.forEach(function (m, i) { if (i < 4) ev.push({ t: (t + b) * spb, inst: "epiano", m: m + 12, d: spb * 1.2, v: 0.45 }); }); }
        else { var pat = [0, 1, 2, 1, 3, 2, 1, 2]; for (var k = 0; k < c.d * 2; k++) { var mm = notes[pat[k % pat.length] % notes.length]; ev.push({ t: (t + k * 0.5) * spb, inst: "pluck", m: mm + 12, d: spb * 0.5, v: 0.35 }); } }
        if (bass) ev.push({ t: t * spb, inst: "bass", m: 36 + key + c.root + (c.root + key < -2 ? 12 : 0), d: d, v: 0.8 });
        t += c.d;
      });
      if (o.sleigh && carol.id === "jingle") for (var s = 0; s < total; s += 1) ev.push({ t: (t0 + s) * spb, inst: "bells", m: 0, d: 0.1, v: s % 2 ? 0.5 : 1 });
      t0 += total;
    }
    return { ev: ev, dur: t0 * spb + 3, title: carol.title, kind: "carol", spb: spb };
  }
  // pieza ambiental: acordes con color, arpegio y melodia pentatonica al azar
  var PROGS = [
    ["Imaj7", "vi7", "ii7", "V7"], ["Imaj7", "IVmaj7"], ["vi9", "IVmaj7", "Imaj7", "V6"], ["Imaj7", "iii7", "IVmaj7", "IVm6"],
    ["ii9", "V7", "Imaj7", "vi7"], ["IVmaj7", "V6", "iii7", "vi9"], ["Imaj7", "bVIImaj7", "IVmaj7", "Imaj7"]
  ];
  var DEG = { I: 0, ii: 2, iii: 4, IV: 5, V: 7, vi: 9, bVII: 10 };
  function arrangeAmbient() {
    var ev = [], bpm = N.rnd(62, 76), spb = 60 / bpm, key = N.ri(-4, 5), prog = N.pick(PROGS), bars = N.pick([16, 20, 24]);
    var arpInst = N.pick(["epiano", "pluck", "celesta"]), melInst = N.pick(["celesta", "musicbox", "epiano"]);
    var penta = [0, 2, 4, 7, 9, 12, 14, 16];
    var mi = 3, melOn = N.chance(0.75), jingle = N.chance(0.25);
    for (var b = 0; b < bars; b++) {
      var sym = prog[b % prog.length], mm = /^(b?[IViv]+)(.*)$/.exec(sym), root = DEG[mm[1]], qs = mm[2];
      var minor = mm[1] === mm[1].toLowerCase();
      var q = qs === "maj7" ? "maj7" : qs === "7" ? (minor ? "m7" : "7") : qs === "9" ? (minor ? "m9" : "add9") : qs === "6" ? "6" : qs === "m6" ? "6" : (minor ? "m" : "");
      var notes = (QUAL[q] || QUAL[""]).map(function (i) { return 48 + key + root + i; });
      var t = b * 4;
      notes.forEach(function (m) { ev.push({ t: t * spb, inst: "pad", m: m + 12, d: 4 * spb, v: 0.8 }); });
      ev.push({ t: t * spb, inst: "bass", m: 36 + key + root, d: 3.5 * spb, v: 0.7 });
      if (b > 1) for (var k = 0; k < 8; k++) if (N.chance(0.62)) ev.push({ t: (t + k * 0.5) * spb, inst: arpInst, m: notes[(k * 2 + b) % notes.length] + 12, d: spb * 0.6, v: 0.3 });
      if (melOn && b > 3 && b < bars - 1) {
        for (var s = 0; s < 4; s++) {
          if (N.chance(0.45)) {
            mi = N.clamp(mi + N.pick([-2, -1, -1, 0, 1, 1, 2]), 0, penta.length - 1);
            var dur = N.pick([1, 1, 2, 0.5]);
            ev.push({ t: (t + s) * spb, inst: melInst, m: 60 + key + penta[mi], d: dur * spb, v: 0.7, lead: true });
          }
        }
      }
      if (jingle && b % 4 === 0) for (var j = 0; j < 4; j++) ev.push({ t: (t + j) * spb, inst: "bells", m: 0, d: 0.1, v: 0.6 });
    }
    return { ev: ev, dur: bars * 4 * spb + 4, title: "ambiente", kind: "ambient", spb: spb };
  }
  M.arrangeCarol = function (id, o) { var c = CAROLS.filter(function (x) { return x.id === id; })[0] || N.pick(CAROLS); return arrangeCarol(c, o); };

  /* ---------- reproductor con planificacion anticipada ---------- */
  var playing = null, nextAt = 0, gapUntil = 0, bag = null, kindBag = null;
  function startPiece(piece) {
    if (!ctx) return;
    piece.ev.sort(function (a, b) { return a.t - b.t; });
    playing = { p: piece, t0: ctx.currentTime + 0.3, i: 0 };
    M.piece = piece; N.log("musica:", piece.title);
  }
  M.play = function (piece, fadeOld) {   // interrumpe lo que suena (con un pequeno silencio)
    if (!ctx) return 0;
    playing = null; gapUntil = 0;
    startPiece(piece);
    return piece.dur;
  };
  M.stopPiece = function () { playing = null; gapUntil = ctx ? ctx.currentTime + N.rnd(4, 8) : 0; };
  M.onNote = function (fn) { M.listeners.push(fn); return function () { M.listeners.splice(M.listeners.indexOf(fn), 1); }; };
  M.tick = function () {
    if (!ctx || ctx.state !== "running") return;
    var now = ctx.currentTime;
    if (!playing) {
      if (now < gapUntil) return;
      if (!bag) { bag = new N.Bag(CAROLS.map(function (c) { return c.id; }), 3); kindBag = new N.Bag(["carol", "carol", "ambient", "ambient", "ambient"], 1); }
      var k = kindBag.next();
      startPiece(k === "carol" ? M.arrangeCarol(bag.next(), { sleigh: N.chance(0.3) }) : arrangeAmbient());
    }
    var P = playing, ev = P.p.ev;
    while (P.i < ev.length && P.t0 + ev[P.i].t < now + 0.35) {
      var e = ev[P.i++], t = Math.max(now + 0.01, P.t0 + e.t);
      try { INST[e.inst](e.m, t, e.d, e.v); } catch (err) {}
      if (e.lead && M.listeners.length) {
        (function (e2, delay) { setTimeout(function () { M.listeners.forEach(function (f) { f(e2); }); }, delay); })(e, (t - now) * 1000);
      }
    }
    if (P.i >= ev.length && now > P.t0 + P.p.dur) { playing = null; gapUntil = now + N.rnd(6, 18); }
  };
  M.info = function () { return !ctx ? "sin audio" : ctx.state + (M.piece ? " · " + M.piece.title : ""); };
  M.sfx = function (kind) {   // efectos minimos (muy bajos)
    if (!ctx || ctx.state !== "running" || !M.on) return;
    var t = ctx.currentTime;
    if (kind === "pop") INST.pluck(84, t, 0.1, 0.6);
    else if (kind === "sparkle") { [88, 91, 95].forEach(function (m, i) { INST.celesta(m - 12, t + i * 0.07, 0.2, 0.5); }); }
    else if (kind === "bells") { for (var i = 0; i < 6; i++) INST.bells(0, t + i * 0.12, 0.1, 0.8); }
    else if (kind === "boing") INST.celesta(67, t, 0.2, 0.6);
  };
})();
