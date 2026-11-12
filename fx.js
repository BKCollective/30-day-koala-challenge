/*
 * Celebration effects for "Braden & Kat: 30 Days".
 *
 * Contract (every function is safe to call any time, never throws, no-ops if something is missing):
 *   FX.sound / FX.setSound(on)   sound toggle (off by default)
 *   FX.tick(el, checked)         a checkbox row was toggled; el = the .check label (has a .box inside)
 *   FX.perfectDay(el)            a person just hit 4/4; el = their card (.col)
 *   FX.milestone(day)            badge unlocked at day 7, 14, 21 or 30
 *   FX.together()                both people have a perfect day
 *   FX.finale()                  the 30 days are over (plays once)
 *
 * One small particle engine draws on <canvas id="fx-canvas"> (created if missing). The animation
 * loop only runs while particles exist, then stops. Sound is tiny Web Audio blips, only when FX.sound.
 * prefers-reduced-motion: no flying particles; things fade gently instead.
 */
(function () {
  "use strict";

  const COLORS = ["#f4b942", "#d9738f", "#7fae8b", "#87a5c6", "#b5532f", "#fff3c9"];
  const INK = "#3a2e2a";
  const MAX = 700; // particle cap so a mid-range phone stays smooth

  let canvas = null, ctx = null, dpr = 1, W = 0, H = 0;
  let parts = [], raf = 0, last = 0, audio = null;
  const timers = new Set();

  const reduced = () => {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  // ---------- setup ----------
  function ensureCanvas() {
    if (canvas && canvas.isConnected) return true;
    try {
      canvas = document.getElementById("fx-canvas");
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.id = "fx-canvas";
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:60";
        (document.body || document.documentElement).appendChild(canvas);
      }
      ctx = canvas.getContext("2d");
      return !!ctx;
    } catch (e) { return false; }
  }

  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    const w = Math.round(W * dpr), h = Math.round(H * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  let styled = false;
  function ensureStyle() {
    if (styled) return;
    styled = true;
    try {
      const s = document.createElement("style");
      s.id = "fx-style";
      s.textContent = `
@keyframes fx-stamp { 0% { transform: scale(.4) rotate(-18deg); } 55% { transform: scale(1.28) rotate(6deg); } 80% { transform: scale(.94) rotate(-2deg); } 100% { transform: none; } }
@keyframes fx-stamp-in { 0% { transform: scale(2.2); opacity: 0; } 60% { transform: scale(.85); opacity: 1; } 100% { transform: none; } }
@keyframes fx-untick { 0% { transform: scale(1); } 50% { transform: scale(.9); } 100% { transform: none; } }
@keyframes fx-jiggle { 0%,100% { transform: none; } 15% { transform: rotate(-1.6deg) scale(1.02); } 35% { transform: rotate(1.4deg) scale(1.02); } 55% { transform: rotate(-.8deg); } 75% { transform: rotate(.4deg); } }
@keyframes fx-glow { 0%,100% { box-shadow: none; } 40% { box-shadow: 0 0 0 6px rgba(244,185,66,.55); } }
@keyframes fx-fade { 0% { opacity: 0; } 20%,75% { opacity: 1; } 100% { opacity: 0; } }
@keyframes fx-drop { 0% { transform: translateY(-120%) rotate(0); } 45% { transform: translateY(0) rotate(14deg); } 62% { transform: rotate(-10deg); } 76% { transform: rotate(6deg); } 88% { transform: rotate(-3deg); } 100% { transform: rotate(0); } }
@keyframes fx-leave { to { transform: translateY(-30px) scale(.9); opacity: 0; } }
.fx-stamp .box { animation: fx-stamp .5s cubic-bezier(.3,1.5,.5,1); }
.fx-stamp .stamp { display: inline-block; animation: fx-stamp-in .38s cubic-bezier(.3,1.6,.5,1); }
.fx-untick .box { animation: fx-untick .18s ease-out; }
.fx-jiggle { animation: fx-jiggle .7s ease-in-out; }
.fx-overlay { position: fixed; left: 50%; top: 0; z-index: 61; pointer-events: none; transform: translateX(-50%); }
.fx-overlay .fx-swing { transform-origin: 50% 0; animation: fx-drop 1.5s cubic-bezier(.3,1.2,.5,1) both; }
.fx-overlay.fx-out { animation: fx-leave .5s ease-in forwards; }
.fx-fadebox { position: fixed; left: 50%; top: 32%; z-index: 61; pointer-events: none; transform: translate(-50%,-50%); animation: fx-fade 1.8s ease forwards; }
@media (prefers-reduced-motion: reduce) {
  .fx-stamp .box, .fx-stamp .stamp, .fx-untick .box { animation: fx-fade .35s ease reverse; }
  .fx-jiggle { animation: fx-glow .9s ease; }
  .fx-overlay .fx-swing { animation: fx-fade 2.6s ease forwards; }
}`;
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {}
  }

  function later(fn, ms) {
    const id = setTimeout(() => { timers.delete(id); try { fn(); } catch (e) {} }, ms);
    timers.add(id);
  }

  function restartClass(el, cls, ms) {
    try {
      if (!el || !el.classList) return;
      el.classList.remove(cls);
      void el.offsetWidth; // restart the CSS animation
      el.classList.add(cls);
      later(() => el.classList.remove(cls), ms);
    } catch (e) {}
  }

  function centerOf(el, fallbackY) {
    try {
      const r = el.getBoundingClientRect();
      if (r.width || r.height) return [r.left + r.width / 2, r.top + r.height / 2, r];
    } catch (e) {}
    return [window.innerWidth / 2, window.innerHeight * (fallbackY || 0.4), null];
  }

  // ---------- particles ----------
  // kinds: "bit" confetti rectangle, "star", "heart", "ring", "dot" (firework spark with trail), "rocket"
  function add(p) {
    if (parts.length >= MAX) return;
    p.age = 0;
    p.rot = p.rot ?? rnd(0, 6.28);
    p.vr = p.vr ?? rnd(-6, 6);
    p.g = p.g ?? 900;          // gravity px/s^2
    p.drag = p.drag ?? 0.9;    // fraction of velocity kept per second
    p.life = p.life ?? 1.6;    // seconds
    parts.push(p);
  }

  function start() {
    if (raf || !ensureCanvas()) return;
    fit();
    last = performance.now();
    raf = requestAnimationFrame(step);
  }

  function confetti(x, y, n, speed, opts) {
    if (reduced()) return;
    opts = opts || {};
    for (let i = 0; i < n; i++) {
      const a = opts.up ? rnd(-Math.PI * 0.95, -Math.PI * 0.05) : rnd(0, Math.PI * 2);
      const s = rnd(0.35, 1) * speed;
      add({
        kind: opts.kind || (Math.random() < 0.18 ? "star" : "bit"),
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        w: rnd(5, 9), h: rnd(3, 6), size: rnd(4, 7),
        c: opts.color || pick(COLORS), life: opts.life || rnd(1.1, 1.8),
        g: opts.g, drag: opts.drag, wob: rnd(0, 6.28),
      });
    }
    start();
  }

  function ring(x, y, r, color) {
    if (reduced()) return;
    add({ kind: "ring", x, y, vx: 0, vy: 0, g: 0, r0: r * 0.3, r1: r, c: color || INK, life: 0.35 });
    start();
  }

  function rain(seconds, perSec) {
    if (reduced()) return;
    const end = performance.now() + seconds * 1000;
    const drop = () => {
      const w = window.innerWidth;
      const n = Math.max(1, Math.round(perSec / 10));
      for (let i = 0; i < n; i++) {
        add({
          kind: Math.random() < 0.15 ? "star" : "bit", x: rnd(0, w), y: -12,
          vx: rnd(-40, 40), vy: rnd(60, 160), g: 120, drag: 0.6,
          w: rnd(6, 10), h: rnd(3, 6), size: rnd(4, 7), c: pick(COLORS),
          life: rnd(3, 4.5), wob: rnd(0, 6.28), flutter: true,
        });
      }
      start();
      if (performance.now() < end) later(drop, 100);
    };
    drop();
  }

  function hearts(fromX, count) {
    if (reduced()) return;
    const h = window.innerHeight;
    for (let i = 0; i < count; i++) {
      later(() => {
        add({
          kind: "heart", x: fromX + rnd(-30, 30), y: h + 20, vx: 0, vy: rnd(-190, -120),
          g: -10, drag: 1, size: rnd(10, 18), c: pick(["#d9738f", "#e9a3b5", "#b5532f", "#f4b942"]),
          life: rnd(3, 4), rot: 0, vr: 0, wob: rnd(0, 6.28), sway: rnd(18, 34), x0: fromX,
        });
        start();
      }, i * 140 + rnd(0, 80));
    }
  }

  function firework(x, y) {
    const hue = pick([["#f4b942", "#fff3c9"], ["#d9738f", "#f8d9e2"], ["#7fae8b", "#dff0e2"], ["#87a5c6", "#e3edf8"]]);
    add({ kind: "rocket", x, y: window.innerHeight + 10, tx: x, ty: y, vx: rnd(-20, 20), vy: -(window.innerHeight - y) * 1.6, g: 0, drag: 1, life: 0.62, c: "#fff3c9", hue, rot: 0, vr: 0 });
    start();
  }

  function explode(x, y, hue) {
    const n = 46;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd(-0.05, 0.05);
      const s = rnd(160, 300);
      add({ kind: "dot", x, y, px: x, py: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 220, drag: 0.35, life: rnd(1, 1.5), c: i % 3 ? hue[0] : hue[1], size: rnd(1.8, 2.8) });
    }
    ring(x, y, 46, hue[0]);
  }

  function drawStar(c, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      c[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
  }

  function drawHeart(c, s) {
    c.beginPath();
    c.moveTo(0, s * 0.35);
    c.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.45, -s * 1.05, 0, -s * 0.45);
    c.bezierCurveTo(s * 0.45, -s * 1.05, s * 1.1, -s * 0.35, 0, s * 0.35);
    c.closePath();
  }

  function step(now) {
    try {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      fit();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const keep = [];
      for (const p of parts) {
        p.age += dt;
        if (p.age >= p.life) {
          if (p.kind === "rocket") explode(p.x, p.y, p.hue);
          continue;
        }
        const k = Math.pow(p.drag, dt);
        p.vx *= k; p.vy = p.vy * k + p.g * dt;
        p.px = p.x; p.py = p.y;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y > H + 60 && p.vy > 0) continue;
        keep.push(p);

        const t = p.age / p.life;
        const alpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        if (p.kind === "heart") {
          const x = p.x0 !== undefined ? p.x + Math.sin(p.age * 2.4 + p.wob) * p.sway : p.x;
          ctx.translate(x, p.y);
          ctx.rotate(Math.sin(p.age * 2.4 + p.wob) * 0.25);
          const pop = Math.min(1, p.age * 5);
          ctx.scale(pop, pop);
          drawHeart(ctx, p.size);
          ctx.fillStyle = p.c; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
        } else if (p.kind === "ring") {
          const r = p.r0 + (p.r1 - p.r0) * (1 - Math.pow(1 - t, 3));
          ctx.globalAlpha = 1 - t;
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.283);
          ctx.lineWidth = 3 * (1 - t) + 0.5; ctx.strokeStyle = p.c; ctx.stroke();
        } else if (p.kind === "dot") {
          ctx.strokeStyle = p.c; ctx.lineWidth = p.size; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
        } else if (p.kind === "rocket") {
          ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 6.283); ctx.fill();
          ctx.globalAlpha *= 0.4; ctx.fillRect(p.x - 1, p.y, 2, 14);
        } else {
          let x = p.x;
          if (p.flutter) x += Math.sin(p.age * 4 + p.wob) * 14;
          ctx.translate(x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.c;
          if (p.kind === "star") {
            drawStar(ctx, p.size);
            ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = INK; ctx.stroke();
          } else {
            ctx.scale(1, Math.cos(p.age * 8 + p.wob)); // paper flip
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          }
        }
        ctx.restore();
      }
      // (sparks a rocket's explode() pushed mid-loop were iterated above and are already in keep)
      parts = keep;
      raf = 0;
    } catch (e) { parts = []; raf = 0; }

    if (parts.length) raf = requestAnimationFrame(step);
    else {
      try { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); } catch (e) {}
    }
  }

  // ---------- sound: tiny oscillator blips ----------
  function tone(freq, dur, opts) {
    if (!FX.sound) return;
    try {
      opts = opts || {};
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      const t = audio.currentTime + (opts.delay || 0);
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = opts.type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
      const vol = opts.vol || 0.08;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(audio.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  }
  const arpeggio = (notes, gap, dur, type) => notes.forEach((f, i) => tone(f, dur, { delay: i * gap, type }));

  // ---------- reduced-motion helper: a simple badge that fades in and out ----------
  function fadeBadge(svg) {
    try {
      ensureStyle();
      const d = document.createElement("div");
      d.className = "fx-fadebox";
      d.setAttribute("aria-hidden", "true");
      d.innerHTML = svg;
      document.body.appendChild(d);
      later(() => d.remove(), 1900);
    } catch (e) {}
  }
  const HEART_SVG = `<svg width="96" height="96" viewBox="-20 -20 40 40"><path d="M0 7 C-22 -7 -9 -21 0 -9 C9 -21 22 -7 0 7Z" fill="#d9738f" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
  const STAR_SVG = `<svg width="110" height="110" viewBox="-20 -20 40 40"><path d="M0 -16 L4.7 -6.5 L15.2 -4.9 L7.6 2.5 L9.4 12.9 L0 8 L-9.4 12.9 L-7.6 2.5 L-15.2 -4.9 L-4.7 -6.5Z" fill="#f4b942" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/></svg>`;

  function medalSvg(day) {
    const fill = day >= 30 ? "#f4b942" : day >= 21 ? "#d9738f" : day >= 14 ? "#87a5c6" : "#7fae8b";
    return `<svg width="150" height="230" viewBox="0 0 150 230" role="img" aria-label="Day ${day} badge unlocked">
  <path d="M52 0 L75 92 L98 0 Z" fill="#b5532f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M62 0 L75 60 L88 0" fill="none" stroke="#fbf3e4" stroke-width="3"/>
  <path d="M35 0 L65 105 L85 100 L58 0 Z" fill="#d9738f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M115 0 L85 105 L65 100 L92 0 Z" fill="#87a5c6" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="75" cy="152" r="58" fill="${fill}" stroke="${INK}" stroke-width="3.5"/>
  <circle cx="75" cy="152" r="45" fill="#fff3c9" stroke="${INK}" stroke-width="2.5" stroke-dasharray="4 5"/>
  <text x="75" y="146" text-anchor="middle" font-family="Fredoka, system-ui, sans-serif" font-weight="700" font-size="15" fill="${INK}">DAY</text>
  <text x="75" y="180" text-anchor="middle" font-family="Fredoka, system-ui, sans-serif" font-weight="700" font-size="38" fill="${INK}">${day}</text>
  <path d="M38 118 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 z" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
</svg>`;
  }

  // ---------- public API ----------
  const FX = {
    sound: false,

    setSound(on) {
      try { FX.sound = !!on; if (FX.sound) tone(1, 0.01, { vol: 0.0002 }); } catch (e) {}
    },

    tick(el, checked) {
      try {
        ensureStyle();
        if (checked) {
          tone(880, 0.09, { to: 420, type: "triangle", vol: 0.09 }); // soft "pop"
          if (!el) return;
          restartClass(el, "fx-stamp", 600);
          const box = (el.querySelector && el.querySelector(".box")) || el;
          const [x, y] = centerOf(box);
          ring(x, y, 26, "#7fae8b");
          confetti(x, y, 9, 260, { g: 700, drag: 0.15, life: 0.7 });
        } else {
          tone(300, 0.06, { type: "sine", vol: 0.04 });
          if (el) restartClass(el, "fx-untick", 250);
        }
      } catch (e) {}
    },

    perfectDay(el) {
      try {
        ensureStyle();
        arpeggio([523, 659, 784, 1047], 0.09, 0.22, "triangle");
        if (el) restartClass(el, "fx-jiggle", 800);
        if (reduced()) return;
        const [x, , r] = centerOf(el || document.body);
        const y = r ? r.top + 50 : window.innerHeight * 0.3;
        confetti(x, y, 70, 520, { up: true });
        confetti(x, y, 14, 380, { up: true, kind: "star", color: "#f4b942" });
        ring(x, y, 70, "#f4b942");
      } catch (e) {}
    },

    milestone(day) {
      try {
        ensureStyle();
        day = parseInt(day, 10) || 0;
        arpeggio([784, 988, 1175, 1568], 0.12, 0.3, "triangle");
        tone(392, 0.6, { delay: 0.48, type: "sine", vol: 0.05 });
        const o = document.createElement("div");
        o.className = "fx-overlay";
        o.innerHTML = `<div class="fx-swing">${medalSvg(day)}</div>`;
        document.body.appendChild(o);
        later(() => o.classList.add("fx-out"), 2700);
        later(() => o.remove(), 3300);
        rain(2.2, 90);
      } catch (e) {}
    },

    together() {
      try {
        arpeggio([659, 880, 784, 1047], 0.14, 0.28, "sine");
        if (reduced()) { fadeBadge(HEART_SVG); return; }
        const w = window.innerWidth;
        hearts(w * 0.12, 9);
        hearts(w * 0.88, 9);
      } catch (e) {}
    },

    finale() {
      try {
        if (FX._finaleDone) return;
        FX._finaleDone = true;
        later(() => { FX._finaleDone = false; }, 5000); // allow replay later (e.g. preview page)
        arpeggio([523, 659, 784, 1047, 1319], 0.13, 0.35, "triangle");
        tone(262, 1.2, { delay: 0.7, vol: 0.05 });
        if (reduced()) { fadeBadge(STAR_SVG); return; }
        const w = window.innerWidth, h = window.innerHeight;
        for (let i = 0; i < 9; i++) {
          later(() => {
            firework(rnd(w * 0.15, w * 0.85), rnd(h * 0.15, h * 0.42));
            tone(rnd(180, 260), 0.25, { type: "triangle", vol: 0.04, to: 90 });
          }, i * 420 + rnd(0, 120));
        }
        rain(4, 110);
      } catch (e) {}
    },
  };

  window.FX = FX;
})();
