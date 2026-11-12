/*
 * The shared eucalyptus grove.
 *
 * Every finished day (4 of 4) by either person adds one thing to the grove, in a fixed order:
 * 60 additions in all (30 days x 2 people). The grove is drawn three ways:
 *   Grove.background(n)        fixed scene behind the whole app (#grove-bg)
 *   Grove.mount(el, n)         small preview window inside the "Your shared forest" card
 *   Grove.open(events)         full-screen forest view with a scrubber and a timelapse
 *                              events = [{ day, person }] in order, one per addition
 *   Grove.toast(n, onSee)      "Your forest grew" note after a new addition
 *   Grove.stepText(n)          what addition n added, e.g. "a flower bloomed"
 *
 * Plain JS, no libraries. Items are small inline SVGs positioned in the scene.
 * The sky follows the time of day in Vancouver (morning, afternoon, evening, night).
 */
(function () {
  "use strict";

  const TZ = "America/Vancouver";
  const MAX = 60;
  const NAMES = { braden: "Braden", kat: "Kat" };

  // ---------- the growth schedule ----------
  // A-F = trees (each appears 4 times: seed, sapling, small, big), g = grass, f = flower,
  // k = koala (moves into the next fully grown tree), b = butterfly, bird = bird.
  const ORDER = ["A","g","B","A","f","g","C","B","A","g","f","D","C","g","A","f","B","E","g","k",
    "D","f","C","g","F","B","f","b","E","g","D","f","k","C","g","F","f","E","g","bird",
    "D","f","g","F","k","f","E","g","b","f","F","g","k","f","g","f","k","g","f","k"];
  // left = % across, bottom = px up from the ground line at 800px scene height, s = depth scale
  const TREES = {
    C: { left: 46, bottom: 250, s: 0.6 },
    E: { left: 6, bottom: 235, s: 0.62 },
    A: { left: 76, bottom: 160, s: 0.85 },
    F: { left: 58, bottom: 110, s: 0.95 },
    B: { left: 14, bottom: 70, s: 1.05 },
    D: { left: 94, bottom: 60, s: 1.1 },
  };
  const DRAW = ["C", "E", "A", "F", "B", "D"]; // back to front
  const KOALA_TREES = ["A", "B", "C", "D", "E", "F"];
  const GRASS = [[30,40],[70,30],[50,90],[12,150],[86,120],[40,170],[64,60],[22,20],[94,190],[56,200],[8,90],[78,80],[34,120],[48,15]];
  const FLOWERS = [[26,55],[60,40],[44,130],[82,100],[16,110],[70,150],[36,25],[90,30],[52,170],[6,60],[66,95],[28,190],[84,180]];
  const FLOWER_COLORS = ["#d9738f", "#f4b942", "#ffffff", "#87a5c6", "#b5532f", "#e9a3b5"];
  const FLYERS = [[30, 330, "#f4b942"], [55, 660, ""], [70, 400, "#87a5c6"]];
  const STAGE_TEXT = ["a seed was planted", "a seed sprouted into a sapling", "a sapling grew into a young tree", "a young tree grew tall"];

  const STEPS = [];
  (function build() {
    const st = {}; let g = 0, f = 0, k = 0, fl = 0;
    ORDER.forEach((tok, i) => {
      const step = i + 1;
      if (TREES[tok]) { st[tok] = (st[tok] || 0) + 1; STEPS.push({ step, type: "tree", id: tok, stage: st[tok], text: STAGE_TEXT[st[tok] - 1] }); }
      else if (tok === "g") STEPS.push({ step, type: "grass", idx: g++, text: "a tuft of grass sprouted" });
      else if (tok === "f") STEPS.push({ step, type: "flower", idx: f++, text: "a flower bloomed" });
      else if (tok === "k") { const idx = k++; STEPS.push({ step, type: "koala", id: KOALA_TREES[idx], idx, text: "a koala moved into a tall tree" }); }
      else STEPS.push({ step, type: "flyer", idx: fl++, bird: tok === "bird", text: tok === "bird" ? "a bird flew in" : "a butterfly arrived" });
    });
  })();

  // ---------- time of day ----------
  const TIMES = {
    morning:   { sky: "linear-gradient(#f8d6b8, #fbeedb 50%, #fbf3e4)", sun: [20, 150, "#f7c95e"], tint: "rgba(244,185,66,0.07)" },
    afternoon: { sky: "linear-gradient(#b9d7e5, #e2eef0 50%, #fbf3e4)", sun: [72, 70, "#f4b942"], tint: "" },
    evening:   { sky: "linear-gradient(#c98199, #f0b08c 50%, #f8dcc0)", sun: [82, 250, "#f19a5a"], tint: "rgba(181,83,47,0.14)" },
    night:     { sky: "linear-gradient(#222b4a, #3b4270 60%, #56557c)", sun: [24, 90, "#f3ecd6"], tint: "rgba(20,24,58,0.45)" },
  };
  function timeOfDay(ms) {
    let h = 12;
    try {
      h = parseInt(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(ms || Date.now()), 10);
    } catch (e) {}
    if (h >= 8 && h < 12) return "morning";
    if (h >= 12 && h < 17) return "afternoon";
    if (h >= 17 && h < 21) return "evening";
    return "night";
  }
  const nowMs = () => {
    try { return typeof Grove.now === "function" ? Grove.now() : Date.now(); } catch (e) { return Date.now(); }
  };

  // ---------- drawings ----------
  const SVG = (w, h, body, cls) =>
    `<svg${cls ? ` class="${cls}"` : ""} width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">${body}</svg>`;

  const TREE_ART = {
    1: SVG(40, 24, '<path class="gv-o gv-soil" d="M2 24 Q20 6 38 24 Z"/><ellipse class="gv-ot gv-seed" cx="20" cy="15" rx="4" ry="5"/><path class="gv-blo" d="M20 10 q-1 -5 -5 -6 M20 10 q2 -5 6 -5"/><path class="gv-bl" d="M20 10 q-1 -5 -5 -6 M20 10 q2 -5 6 -5"/>'),
    2: SVG(44, 70, '<path class="gv-o gv-soil" d="M8 70 Q22 60 36 70 Z"/><path class="gv-sto" d="M22 66 C22 54 20 44 23 26"/><path class="gv-st" d="M22 66 C22 54 20 44 23 26"/><ellipse class="gv-ot gv-leaf" cx="14" cy="40" rx="8" ry="4" transform="rotate(-30 14 40)"/><ellipse class="gv-ot gv-leaf2" cx="30" cy="34" rx="8" ry="4" transform="rotate(25 30 34)"/><ellipse class="gv-ot gv-leaf" cx="17" cy="27" rx="7" ry="3.5" transform="rotate(-45 17 27)"/><ellipse class="gv-ot gv-leaf" cx="28" cy="21" rx="7" ry="3.5" transform="rotate(40 28 21)"/>', "gv-sway"),
    3: SVG(90, 150, '<path class="gv-bro" d="M45 104 L26 72"/><path class="gv-br" d="M45 104 L26 72"/><path class="gv-o gv-trunk" d="M39 150 C42 122 40 100 42 78 L49 78 C51 100 49 122 53 150 Z"/><ellipse class="gv-bark" cx="46" cy="124" rx="2.5" ry="6"/><ellipse class="gv-o gv-leaf2" cx="58" cy="58" rx="24" ry="19"/><ellipse class="gv-o gv-leaf" cx="26" cy="64" rx="20" ry="16"/><ellipse class="gv-o gv-leaf" cx="44" cy="40" rx="23" ry="18"/><path class="gv-drip" d="M14 76 q-1 6 1 10 M34 78 q1 6 -1 9 M66 74 q1 6 -1 10"/>', "gv-sway"),
    4: SVG(160, 280, '<path class="gv-bro" d="M76 168 L40 104 M84 156 L122 96 M80 150 L82 74"/><path class="gv-br" d="M76 168 L40 104 M84 156 L122 96 M80 150 L82 74"/><path class="gv-o gv-trunk" d="M64 280 C70 232 68 186 73 146 L88 146 C92 186 90 232 97 280 Z"/><ellipse class="gv-bark" cx="78" cy="240" rx="4" ry="10"/><ellipse class="gv-bark" cx="85" cy="200" rx="3" ry="8"/><ellipse class="gv-bark" cx="76" cy="172" rx="2.5" ry="6"/><ellipse class="gv-o gv-leaf2" cx="104" cy="120" rx="26" ry="18"/><ellipse class="gv-o gv-leaf2" cx="56" cy="128" rx="22" ry="15"/><ellipse class="gv-o gv-leaf" cx="40" cy="92" rx="34" ry="26"/><ellipse class="gv-o gv-leaf" cx="122" cy="84" rx="32" ry="25"/><ellipse class="gv-o gv-leaf" cx="82" cy="56" rx="40" ry="32"/><path class="gv-drip" d="M18 110 q-2 8 2 14 M44 118 q1 7 -1 12 M110 108 q2 8 -1 13 M140 100 q1 8 -2 13 M70 86 q-1 7 1 11"/>', "gv-sway"),
  };
  const TREE_SIZE = { 1: [40, 24], 2: [44, 70], 3: [90, 150], 4: [160, 280] };

  function koalaArt(idx) {
    const kat = idx % 2 === 1;
    const fur = kat ? "gv-furk" : "gv-fur";
    const extra = kat
      ? '<path d="M12 25 q8 5 16 0" fill="none" stroke="#3a2e2a" stroke-width="5" stroke-linecap="round"/><path d="M12 25 q8 5 16 0" fill="none" stroke="#e9a3b5" stroke-width="2.6" stroke-linecap="round"/>'
      : '<circle class="gv-ot gv-gold" cx="15.5" cy="8" r="2.2"/><circle class="gv-ot gv-gold" cx="24.5" cy="8" r="2.2"/>';
    return SVG(40, 44,
      `<circle class="gv-o ${fur}" cx="9" cy="10" r="7"/><circle class="gv-ear" cx="9" cy="10" r="3.5"/><circle class="gv-o ${fur}" cx="31" cy="10" r="7"/><circle class="gv-ear" cx="31" cy="10" r="3.5"/>` +
      `<ellipse class="gv-o ${fur}" cx="20" cy="32" rx="10" ry="10"/><ellipse class="gv-o ${fur}" cx="20" cy="17" rx="12" ry="10.5"/>` +
      `<circle class="gv-ink" cx="15" cy="16" r="1.7"/><circle class="gv-ink" cx="25" cy="16" r="1.7"/><ellipse class="gv-nose" cx="20" cy="20.5" rx="3" ry="3.8"/>` +
      `<path class="gv-ln" d="M11 31 q-4 3 -2 7 M29 31 q4 3 2 7"/>` + extra);
  }
  const GRASS_ART = SVG(30, 18, '<path class="gv-blo" d="M5 18 q2 -9 -1 -15 M11 18 q0 -11 4 -16 M17 18 q1 -8 -2 -12 M23 18 q2 -11 6 -14"/><path class="gv-bl" d="M5 18 q2 -9 -1 -15 M11 18 q0 -11 4 -16 M17 18 q1 -8 -2 -12 M23 18 q2 -11 6 -14"/>');
  const flowerArt = (c) => SVG(24, 34,
    '<path class="gv-blo" d="M12 34 L12 14 M12 26 q5 -4 8 -2"/><path class="gv-bl" d="M12 34 L12 14 M12 26 q5 -4 8 -2"/>' +
    [[12, 5.5], [17.5, 9.5], [15.5, 16], [8.5, 16], [6.5, 9.5]].map(([x, y]) => `<circle class="gv-ot" fill="${c}" cx="${x}" cy="${y}" r="4"/>`).join("") +
    '<circle class="gv-ot gv-gold" cx="12" cy="11" r="3.2"/>');
  const butterflyArt = (c) => SVG(28, 22,
    `<path class="gv-ot" fill="${c}" d="M14 11 C8 0 0 2 2 9 C3 13 9 13 14 11 Z"/><path class="gv-ot" fill="${c}" d="M14 11 C20 0 28 2 26 9 C25 13 19 13 14 11 Z"/>` +
    `<path class="gv-ot" fill="${c}" d="M14 12 C9 14 6 20 10 20 C12 20 14 16 14 12 Z"/><path class="gv-ot" fill="${c}" d="M14 12 C19 14 22 20 18 20 C16 20 14 16 14 12 Z"/><path class="gv-ln" d="M14 6 L14 18"/>`, "gv-fly");
  const BIRD_ART = SVG(40, 20, '<path class="gv-ln" d="M2 8 q9 -8 18 4 q9 -12 18 -4"/>');

  const HILLS =
    '<svg class="gv-hills" viewBox="0 0 390 360" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    '<path class="gv-o" vector-effect="non-scaling-stroke" fill="#c6dbbd" d="M-4 120 C60 80 120 90 190 110 C260 130 320 70 394 90 L394 364 L-4 364 Z"/>' +
    '<path class="gv-o" vector-effect="non-scaling-stroke" fill="#b1cea3" d="M-4 200 C80 160 170 190 230 175 C300 158 350 170 394 160 L394 364 L-4 364 Z"/>' +
    '<path class="gv-o" vector-effect="non-scaling-stroke" fill="#9dc28f" d="M-4 292 C90 272 200 302 394 270 L394 364 L-4 364 Z"/></svg>';

  const STARS = [[8,6],[22,14],[36,4],[50,11],[63,6],[78,15],[90,5],[14,24],[44,20],[70,24],[84,28],[30,30]];
  const FIREFLIES = [[12,120],[28,200],[42,80],[58,230],[70,140],[84,210],[92,90],[20,60]];

  // ---------- scene ----------
  // n = additions shown, h = scene height in px, grow = step number to animate in (or 0)
  function sceneHTML(n, h, grow, time) {
    n = Math.max(0, Math.min(MAX, n | 0));
    time = time || timeOfDay(nowMs());
    const T = TIMES[time];
    const gs = Math.max(0.2, Math.min(1.5, h / 800));
    const px = (v) => (v * gs).toFixed(1) + "px";
    const done = STEPS.slice(0, n);
    const g = (s) => (s.step === grow ? " gv-grow" : "");
    const place = (left, bottom, scale, inner, cls) =>
      `<div class="gv-item" style="left:${left}%;bottom:${px(bottom)};transform:translateX(-50%) scale(${(scale * gs).toFixed(3)})"><div class="${cls || ""}">${inner}</div></div>`;
    const depth = (b) => 1.05 - b / 420;

    let out = `<div class="gv-sky" style="background:${T.sky}"></div>`;
    if (time === "night") out += STARS.map(([l, t], i) => `<i class="gv-star" style="left:${l}%;top:${t}%;animation-delay:${(i % 4) * 0.7}s"></i>`).join("");
    const sz = 64 * gs;
    out += `<div class="gv-sun" style="left:${T.sun[0]}%;top:${px(T.sun[1])};width:${sz}px;height:${sz}px;background:${T.sun[2]}"></div>`;
    out += `<div class="gv-ground" style="height:${px(360)}">${HILLS}</div>`;

    DRAW.forEach((id) => {
      const mine = done.filter((s) => s.type === "tree" && s.id === id);
      if (!mine.length) return;
      const top = mine[mine.length - 1];
      const stage = top.stage;
      let inner = TREE_ART[stage];
      if (stage === 4) {
        const ko = done.find((s) => s.type === "koala" && s.id === id);
        if (ko) inner += `<div class="gv-koala${g(ko)}">${koalaArt(ko.idx)}</div>`;
      }
      const [w, hh] = TREE_SIZE[stage];
      const t = TREES[id];
      out += place(t.left, t.bottom, t.s, `<div class="gv-tree" style="width:${w}px;height:${hh}px">${inner}</div>`, g(top).trim());
    });
    done.filter((s) => s.type === "grass").forEach((s) => {
      const [l, b] = GRASS[s.idx];
      out += place(l, b, depth(b), GRASS_ART, g(s).trim());
    });
    done.filter((s) => s.type === "flower").forEach((s) => {
      const [l, b] = FLOWERS[s.idx];
      out += place(l, b, depth(b), flowerArt(FLOWER_COLORS[s.idx % FLOWER_COLORS.length]), g(s).trim());
    });
    done.filter((s) => s.type === "flyer").forEach((s) => {
      const [l, b, c] = FLYERS[s.idx];
      out += place(l, b, 1, s.bird ? BIRD_ART : butterflyArt(c || "#fff"), g(s).trim());
    });
    if (T.tint) out += `<div class="gv-tint" style="background:${T.tint}"></div>`;
    if (time === "night") out += FIREFLIES.map(([l, b], i) => `<i class="gv-firefly" style="left:${l}%;bottom:${px(b)};animation-delay:${(i % 5) * 0.5}s"></i>`).join("");
    return out;
  }

  // minH: draw as if the scene were at least this tall (a short window then shows just the ground)
  function paint(el, n, grow, time, minH) {
    try {
      const h = Math.max(el.clientHeight || window.innerHeight || 800, minH || 0);
      el.classList.add("gv-scene");
      el.innerHTML = sceneHTML(n, h, grow, time);
    } catch (e) {}
  }

  // ---------- background ----------
  const bg = { n: -1, time: "", h: 0 };
  function background(n) {
    try {
      let el = document.getElementById("grove-bg");
      if (!el) {
        el = document.createElement("div");
        el.id = "grove-bg";
        el.setAttribute("aria-hidden", "true");
        document.body.insertBefore(el, document.body.firstChild);
      }
      const time = timeOfDay(nowMs());
      const h = el.clientHeight;
      if (n === bg.n && time === bg.time && h === bg.h) return;
      const grow = bg.n >= 0 && n === bg.n + 1 ? n : 0;
      bg.n = n; bg.time = time; bg.h = h;
      paint(el, n, grow, time);
    } catch (e) {}
  }

  // ---------- mini preview ----------
  const mini = { n: -1 };
  function mount(el, n) {
    if (!el) return;
    const grow = mini.n >= 0 && n === mini.n + 1 ? n : 0;
    mini.n = n;
    paint(el, n, grow, null, 430);
  }

  // ---------- full-screen forest view ----------
  let view = null;
  function stepText(k) {
    const s = STEPS[k - 1];
    return s ? s.text : "";
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function open(events) {
    try {
      close();
      events = (events || []).slice(0, MAX);
      const total = events.length;
      const back = document.activeElement;
      const el = document.createElement("div");
      el.className = "gv-view";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true");
      el.setAttribute("aria-labelledby", "gv-title");
      el.innerHTML = `
        <div class="gv-head">
          <button type="button" class="gv-btn gv-close">Back</button>
          <h2 id="gv-title">Your shared forest</h2>
          <span class="gv-count">${total} of ${MAX}</span>
        </div>
        <div class="gv-stage"></div>
        <div class="gv-panel">
          <div class="gv-label" aria-live="polite"><b></b><span></span></div>
          <input class="gv-range" type="range" min="0" max="${total}" step="1" value="${total}" aria-label="Scrub through the forest's growth" ${total ? "" : "disabled"}>
          <div class="gv-days"><span>Start</span><span>${total ? "Day " + events[total - 1].day : "Today"}</span></div>
          <div class="gv-btns">
            <button type="button" class="gv-btn gv-prev" aria-label="Step back">&#9664;</button>
            <button type="button" class="gv-btn gv-play" ${total ? "" : "disabled"}>Play the month</button>
            <button type="button" class="gv-btn gv-next" aria-label="Step forward">&#9654;</button>
          </div>
        </div>`;
      document.body.appendChild(el);
      document.documentElement.classList.add("gv-lock");

      const stage = el.querySelector(".gv-stage");
      const range = el.querySelector(".gv-range");
      const playBtn = el.querySelector(".gv-play");
      const label = el.querySelector(".gv-label b");
      const sub = el.querySelector(".gv-label span");
      let cur = total, timer = 0;

      function show(k, animate) {
        cur = Math.max(0, Math.min(total, k));
        range.value = cur;
        paint(stage, cur, animate ? cur : 0);
        if (cur === 0) {
          label.textContent = total ? "Before the first finished day" : "Bare ground, for now";
          sub.textContent = total ? "Drag the slider or press Play to watch it grow." : "Tick all 4 boxes in a day to plant the first seed.";
        } else {
          const e = events[cur - 1];
          label.textContent = `Day ${e.day} · ${NAMES[e.person] || e.person} finished the day`;
          sub.textContent = cap(stepText(cur)) + ".";
        }
      }
      function stop() { clearInterval(timer); timer = 0; playBtn.textContent = cur >= total ? "Play the month" : "Keep playing"; }
      function play() {
        if (timer) return stop();
        if (cur >= total) show(0, false);
        playBtn.textContent = "Pause";
        timer = setInterval(() => {
          if (cur >= total) return stop();
          show(cur + 1, true);
        }, 650);
      }

      range.addEventListener("input", () => { stop(); const k = +range.value; show(k, k === cur + 1); });
      el.querySelector(".gv-prev").addEventListener("click", () => { stop(); show(cur - 1, false); });
      el.querySelector(".gv-next").addEventListener("click", () => { stop(); show(cur + 1, true); });
      playBtn.addEventListener("click", play);
      el.querySelector(".gv-close").addEventListener("click", close);
      const onKey = (e) => { if (e.key === "Escape") close(); };
      const onResize = () => paint(stage, cur, 0);
      document.addEventListener("keydown", onKey);
      window.addEventListener("resize", onResize);

      view = { el, back, cleanup: () => { clearInterval(timer); document.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); } };
      show(total, false);
      el.querySelector(".gv-close").focus();
    } catch (e) {}
  }

  function close() {
    if (!view) return;
    try {
      view.cleanup();
      view.el.remove();
      document.documentElement.classList.remove("gv-lock");
      if (view.back && view.back.focus) view.back.focus();
    } catch (e) {}
    view = null;
  }

  // ---------- "your forest grew" note ----------
  function toast(n, onSee) {
    try {
      const old = document.querySelector(".gv-toast");
      if (old) old.remove();
      const t = document.createElement("div");
      t.className = "gv-toast";
      t.setAttribute("role", "status");
      t.innerHTML = `<span>Your forest grew: ${stepText(n)}.</span><button type="button" class="gv-btn">See it</button>`;
      t.querySelector("button").addEventListener("click", () => { t.remove(); if (onSee) onSee(); });
      document.body.appendChild(t);
      setTimeout(() => t.classList.add("gv-toast-out"), 5200);
      setTimeout(() => t.remove(), 5800);
    } catch (e) {}
  }

  // keep the background's sky in step with the clock and the window size
  setInterval(() => { if (bg.n >= 0) background(bg.n); }, 60000);
  let rz = 0;
  window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (bg.n >= 0) { bg.h = -1; background(bg.n); } }, 200); });

  const Grove = { MAX, STEPS, background, mount, open, close, toast, stepText, timeOfDay, now: null };
  window.Grove = Grove;
})();
