/*
 * EFFECTS SWAP-IN POINT (owned by Claude Design, see docs/CLAUDE-DESIGN-PROMPT.md)
 *
 * Contract (all functions must be safe to call at any time and never throw):
 *   FX.tick(el, checked)          a checkbox row was toggled. el = the row element.
 *   FX.perfectDay(el)             a person just reached 4 of 4. el = their card element.
 *   FX.milestone(day)             a person just unlocked the badge for day 7/14/21/30.
 *   FX.together()                 both people have a perfect day today.
 *   FX.finale()                   the 30 days are over.
 *   FX.setSound(on) / FX.sound    sound toggle state (off by default).
 *
 * This file is a small working placeholder.
 */
(function () {
  const canvas = document.getElementById("fx-canvas");
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let parts = [];
  let raf = 0;
  let audio = null;

  function size() {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
  }
  size();
  addEventListener("resize", size);

  const colors = ["#f4b942", "#e58fa6", "#7fae8b", "#6aa6c9", "#b5532f", "#fff3c9"];

  function burst(x, y, n, spread) {
    if (reduce) return;
    const d = devicePixelRatio;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (Math.random() * 6 + 3) * (spread || 1) * d;
      parts.push({
        x: x * d, y: y * d, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 5 * d,
        w: (Math.random() * 6 + 4) * d, h: (Math.random() * 4 + 3) * d,
        r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        c: colors[(Math.random() * colors.length) | 0], life: 1,
      });
    }
    if (!raf) raf = requestAnimationFrame(step);
  }

  function step() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts = parts.filter((p) => p.life > 0 && p.y < canvas.height + 40);
    for (const p of parts) {
      p.vy += 0.25 * devicePixelRatio; p.vx *= 0.99;
      p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.006;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(p.life, 0); ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    raf = parts.length ? requestAnimationFrame(step) : 0;
    if (!parts.length) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function beep(freq, dur, delay) {
    if (!FX.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime + (delay || 0);
      const o = audio.createOscillator(); const g = audio.createGain();
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  }

  function center(el) {
    try {
      const r = el.getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2];
    } catch (e) { return [innerWidth / 2, innerHeight / 3]; }
  }

  const FX = {
    sound: false,
    setSound(on) { FX.sound = !!on; },
    tick(el, checked) {
      try {
        if (!el) return;
        if (checked) {
          el.classList.remove("fx-pop"); void el.offsetWidth; el.classList.add("fx-pop");
          const [x, y] = center(el.querySelector(".box") || el);
          burst(x, y, 10, 0.6); beep(660, 0.12);
        } else beep(330, 0.1);
      } catch (e) {}
    },
    perfectDay(el) {
      try {
        const [x, y] = center(el || document.body);
        burst(x, y, 90, 1.2); beep(523, 0.15); beep(659, 0.15, 0.12); beep(784, 0.25, 0.24);
      } catch (e) {}
    },
    milestone(day) {
      try { burst(innerWidth / 2, innerHeight / 3, 160, 1.5); beep(784, 0.3); beep(988, 0.4, 0.2); } catch (e) {}
    },
    together() {
      try { burst(innerWidth / 2, innerHeight / 2, 120, 1.3); } catch (e) {}
    },
    finale() {
      try {
        for (let i = 0; i < 6; i++) setTimeout(() => burst(Math.random() * innerWidth, innerHeight * 0.3, 120, 1.4), i * 350);
      } catch (e) {}
    },
  };
  window.FX = FX;
})();
