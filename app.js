(function () {
  "use strict";

  // ---------- Constants ----------
  // 8:00 AM Pacific (PST, UTC-8) on Nov 12 2026 == 16:00 UTC. No DST change falls in the window.
  const START = Date.UTC(2026, 10, 12, 16, 0, 0);
  const DAY = 86400000;
  const DAYS = 30;
  const END = START + DAYS * DAY;
  const TZ = "America/Vancouver";

  const PEOPLE = { braden: "Braden", kat: "Kat" };
  const OTHER = { braden: "kat", kat: "braden" };
  const ITEMS = [
    { key: "avoided_alcohol", label: "Successfully avoided alcohol", icon: "🍷" },
    { key: "avoided_drugs", label: "Successfully avoided drugs & weed", icon: "🌿" },
    { key: "avoided_sugar", label: "Successfully avoided artificial sugar & candy", icon: "🍬" },
  ];
  const ALL_KEYS = ["avoided_alcohol", "avoided_drugs", "avoided_sugar", "exercised"];
  const BADGES = {
    braden: ["First Ingot", "Fine Gold", "Master Smith", "Heart of Gold"],
    kat: ["First Frame", "Breaking Story", "Investigative Pro", "Prime Time"],
  };
  const MILESTONES = [7, 14, 21, 30];

  // One little prize drawing per badge (viewBox 0 0 56 56). Locked badges show it greyed out.
  const O = 'stroke="#3a2e2a" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  const SPARK = (x, y) => `<path d="M${x} ${y - 5} L${x + 1.4} ${y - 1.4} L${x + 5} ${y} L${x + 1.4} ${y + 1.4} L${x} ${y + 5} L${x - 1.4} ${y + 1.4} L${x - 5} ${y} L${x - 1.4} ${y - 1.4} Z" fill="#fff3c9" stroke="#3a2e2a" stroke-width="1.4" stroke-linejoin="round"/>`;
  const BADGE_ART = {
    "First Ingot": `<path d="M7 44 L14 28 H42 L49 44 Z" fill="#f4b942" ${O}/><path d="M14 28 L19 20 H37 L42 28 Z" fill="#f9d77e" ${O}/><path d="M18 38 H30" stroke="#fff3c9" stroke-width="2.5" stroke-linecap="round"/>${SPARK(45, 14)}`,
    "Fine Gold": `<circle cx="28" cy="35" r="13" fill="none" stroke="#3a2e2a" stroke-width="10"/><circle cx="28" cy="35" r="13" fill="none" stroke="#f4b942" stroke-width="5"/><path d="M28 7 L36 15 L28 24 L20 15 Z" fill="#9fd3e0" ${O}/><path d="M20 15 H36" stroke="#3a2e2a" stroke-width="1.6"/>${SPARK(44, 10)}`,
    "Master Smith": `<path d="M8 30 H42 C42 35 37 37 33 37 V43 H40 V49 H14 V43 H21 V37 C14 37 10 34 8 30 Z" fill="#6c6564" ${O}/><path d="M24 26 L40 8" stroke="#3a2e2a" stroke-width="8" stroke-linecap="round"/><path d="M24 26 L40 8" stroke="#8a5a3c" stroke-width="4" stroke-linecap="round"/><rect x="33" y="2" width="18" height="10" rx="2" transform="rotate(42 42 7)" fill="#c9c4bc" ${O}/>${SPARK(14, 20)}`,
    "Heart of Gold": `<path d="M28 9 V14" stroke="#3a2e2a" stroke-width="2.5"/><circle cx="28" cy="8" r="3.5" fill="none" stroke="#f4b942" stroke-width="2.5"/><path d="M28 48 C10 37 6 27 12 20 C17 14 25 16 28 22 C31 16 39 14 44 20 C50 27 46 37 28 48 Z" fill="#f4b942" ${O}/><path d="M17 25 C18 22 21 21 23 22" stroke="#fff3c9" stroke-width="2.5" stroke-linecap="round" fill="none"/>${SPARK(46, 12)}`,
    "First Frame": `<rect x="10" y="6" width="36" height="44" rx="3" fill="#fff" ${O}/><rect x="14" y="10" width="28" height="26" fill="#b9d7e5" ${O}/><path d="M14 31 C20 25 26 30 30 27 C34 24 38 27 42 25 V36 H14 Z" fill="#7fae8b" stroke="#3a2e2a" stroke-width="1.8" stroke-linejoin="round"/><circle cx="35" cy="17" r="3.5" fill="#f4b942" stroke="#3a2e2a" stroke-width="1.6"/><path d="M18 43 H32" stroke="#d9738f" stroke-width="2.5" stroke-linecap="round"/>`,
    "Breaking Story": `<path d="M8 12 H42 L48 18 V48 H8 Z" fill="#fbf3e4" ${O}/><path d="M42 12 V18 H48" fill="none" ${O}/><rect x="12" y="17" width="26" height="7" rx="1.5" fill="#e0443a" stroke="#3a2e2a" stroke-width="1.6"/><rect x="12" y="28" width="13" height="12" rx="1.5" fill="#e9a3b5" stroke="#3a2e2a" stroke-width="1.6"/><path d="M29 29 H43 M29 34 H43 M29 39 H39 M12 44 H43" stroke="#3a2e2a" stroke-width="1.8" stroke-linecap="round"/>`,
    "Investigative Pro": `<rect x="7" y="10" width="28" height="38" rx="2.5" fill="#fbf3e4" ${O}/><path d="M12 18 H30 M12 24 H30 M12 30 H24" stroke="#87a5c6" stroke-width="2" stroke-linecap="round"/><path d="M40 40 L50 50" stroke="#3a2e2a" stroke-width="8" stroke-linecap="round"/><path d="M40 40 L50 50" stroke="#8a5a3c" stroke-width="4" stroke-linecap="round"/><circle cx="34" cy="34" r="11" fill="#cfe6ea" fill-opacity=".85" stroke="#3a2e2a" stroke-width="4"/><circle cx="34" cy="34" r="11" fill="none" stroke="#87a5c6" stroke-width="1.6"/><path d="M28 30 C29 27 31 26 33 26" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/>`,
    "Prime Time": `<path d="M16 8 H40 V20 C40 30 34 35 28 35 C22 35 16 30 16 20 Z" fill="#f4b942" ${O}/><path d="M16 12 H9 C9 22 13 25 17 25 M40 12 H47 C47 22 43 25 39 25" fill="none" ${O}/><path d="M25 35 H31 V42 H25 Z" fill="#f4b942" ${O}/><rect x="16" y="42" width="24" height="8" rx="2" fill="#8a5a3c" ${O}/><path d="M28 13 L30 18 L35 18 L31 21 L32.5 26 L28 23 L23.5 26 L25 21 L21 18 L26 18 Z" fill="#fff3c9" stroke="#3a2e2a" stroke-width="1.4" stroke-linejoin="round"/>`,
  };
  // The grand prize: unlocked only when BOTH of you finish all 30 days.
  const GRAND = "Documentary about the Goldsmith";
  const GRAND_ART = `<svg class="prize" viewBox="0 0 96 96" width="96" height="96" aria-hidden="true" focusable="false">
    <g transform="rotate(-14 12 34)"><rect x="12" y="22" width="58" height="12" rx="2" fill="#fff" ${O}/>
      <path d="M20 22 L14 34 H22 L28 22 Z M36 22 L30 34 H38 L44 22 Z M52 22 L46 34 H54 L60 22 Z M68 22 L62 34 H70 V22 Z" fill="#3a2e2a"/></g>
    <rect x="12" y="38" width="58" height="42" rx="4" fill="#4a4545" ${O}/>
    <path d="M12 46 H70" stroke="#3a2e2a" stroke-width="2.5"/>
    <path d="M18 54 H44 M18 61 H38 M18 68 H42" stroke="#fbf3e4" stroke-width="3" stroke-linecap="round"/>
    <circle cx="20" cy="42" r="2" fill="#e0443a"/>
    <circle cx="66" cy="66" r="14" fill="none" stroke="#3a2e2a" stroke-width="10"/>
    <circle cx="66" cy="66" r="14" fill="none" stroke="#f4b942" stroke-width="5"/>
    <path d="M60 58 C61 55 63 54 65 54" stroke="#fff3c9" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M66 36 L75 45 L66 54 L57 45 Z" fill="#9fd3e0" ${O}/><path d="M57 45 H75" stroke="#3a2e2a" stroke-width="1.6"/>
    ${SPARK(84, 30)}${SPARK(10, 14)}${SPARK(88, 84)}
  </svg>`;
  const badgeSvg = (name) => `<svg class="prize" viewBox="0 0 56 56" width="56" height="56" aria-hidden="true" focusable="false">${BADGE_ART[name] || ""}</svg>`;

  const cfg = window.CHALLENGE_CONFIG || {};
  const qs = new URLSearchParams(location.search);
  const t0 = Date.now();
  const nowMs = () => (qs.get("now") ? Date.parse(qs.get("now")) + (Date.now() - t0) : Date.now());

  // ---------- State ----------
  const store = { entries: {}, who: null, selected: null, mode: "local", status: "" };
  try { store.who = localStorage.getItem("c30_who"); } catch (e) {}
  if (!PEOPLE[store.who]) store.who = null;
  let sb = null;
  let lastDay = -1;
  const inflight = {};
  const saveTimers = {};
  const celebrated = new Set();

  const key = (p, d) => p + ":" + d;
  const blank = (p, d) => ({
    person: p, day: d, avoided_alcohol: false, avoided_drugs: false, avoided_sugar: false,
    exercised: false, exercise_text: "", note_to_other: "",
  });
  const get = (p, d) => store.entries[key(p, d)] || blank(p, d);
  const count = (r) => ALL_KEYS.reduce((n, k) => n + (r[k] ? 1 : 0), 0);
  const perfect = (r) => count(r) === 4;
  const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function curDay() {
    const n = nowMs();
    if (n < START) return 0;
    if (n >= END) return DAYS;
    return Math.floor((n - START) / DAY) + 1;
  }
  // TEMP QA: set to false to relock boxes to the real schedule.
  const QA_UNLOCK = false;
  const openThrough = () => (QA_UNLOCK ? DAYS : curDay());
  const phase = () => { const n = nowMs(); return n < START ? "before" : n >= END ? "after" : "during"; };
  const dayDate = (d) =>
    new Date(START + (d - 1) * DAY).toLocaleDateString("en-CA", { timeZone: TZ, month: "short", day: "numeric" });

  function moodFor(r) {
    const n = count(r);
    return n === 0 ? "sleepy" : n < 3 ? "perking" : n === 3 ? "almost" : "celebrating";
  }
  function streak(p) {
    let d = curDay();
    if (d < 1) return 0;
    if (!perfect(get(p, d)) && phase() === "during") d--;
    let n = 0;
    while (d >= 1 && perfect(get(p, d))) { n++; d--; }
    return n;
  }
  function perfectCount(p) {
    let n = 0;
    for (let d = 1; d <= DAYS; d++) if (perfect(get(p, d))) n++;
    return n;
  }
  const together = (d) => perfect(get("braden", d)) && perfect(get("kat", d));

  // ---------- Shared forest ----------
  // One grove addition per finished day per person, in day order. Within a day, whoever
  // finished first (by last save time) comes first.
  function forestEvents() {
    const out = [];
    for (let d = 1; d <= DAYS; d++) {
      const done = ["braden", "kat"].filter((p) => perfect(get(p, d)));
      done.sort((a, b) => String(get(a, d).updated_at || "").localeCompare(String(get(b, d).updated_at || "")));
      done.forEach((p) => out.push({ day: d, person: p }));
    }
    return out;
  }
  const openForest = () => window.Grove && window.Grove.open(forestEvents());

  function forestHtml(n) {
    const next = n < 60 ? `Next up: ${window.Grove ? window.Grove.stepText(n + 1) : "something new"}.` : "The grove is complete. 🐨";
    return `
    <section class="card forest-card">
      <div class="forest-head"><h3>Your shared forest 🌳</h3><span>${n} of 60 grown</span></div>
      <div class="gv-mini" id="grove-mini" aria-hidden="true"></div>
      <p class="forest-sub">Every day one of you finishes adds something to the grove. ${next}</p>
      <button type="button" class="forest-btn" id="see-forest">See your shared forest</button>
    </section>`;
  }

  // ---------- Persistence ----------
  function persistLocal() {
    try { localStorage.setItem("c30_entries", JSON.stringify(store.entries)); } catch (e) {}
  }

  async function initData() {
    if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase) {
      try {
        sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
        store.mode = "cloud";
        const { data, error } = await sb.from("entries").select("*");
        if (error) throw error;
        data.forEach((r) => (store.entries[key(r.person, r.day)] = r));
        sb.channel("entries-live")
          .on("postgres_changes", { event: "*", schema: "public", table: "entries" }, (payload) => {
            const r = payload.new;
            if (r && r.person) {
              const mine = store.entries[key(r.person, r.day)];
              // Do not clobber text this device is actively typing.
              const rk = key(r.person, r.day);
              if (mine && (saveTimers[rk] || inflight[rk]) && r.person === store.who) return;
              // Skip echoes that change nothing, so a re-render never swallows an in-progress click.
              const same = mine && [...ALL_KEYS, "exercise_text", "note_to_other"].every((f) => (mine[f] || "") === (r[f] || ""));
              store.entries[rk] = r;
              if (!same) render();
            }
          })
          .subscribe();
        return;
      } catch (e) {
        console.error(e);
        store.mode = "local";
        store.status = "Couldn't reach Supabase, showing this device only.";
      }
    }
    try { store.entries = JSON.parse(localStorage.getItem("c30_entries") || "{}"); } catch (e) { store.entries = {}; }
    addEventListener("storage", (ev) => {
      if (ev.key === "c30_entries") {
        try { store.entries = JSON.parse(ev.newValue || "{}"); render(); } catch (e) {}
      }
    });
  }

  function save(p, d, patch, debounce) {
    const k = key(p, d);
    store.entries[k] = Object.assign({}, get(p, d), patch);
    persistLocal();
    const push = async () => {
      delete saveTimers[k];
      if (sb) {
        const row = Object.assign({}, store.entries[k], { updated_at: new Date().toISOString() });
        inflight[k] = (inflight[k] || 0) + 1;
        const { error } = await sb.from("entries").upsert(row, { onConflict: "person,day" });
        // Keep ignoring our own echo briefly after the write returns.
        setTimeout(() => { if (--inflight[k] <= 0) delete inflight[k]; }, 1500);
        if (error) { console.error(error); store.status = "Save failed. Check your connection."; render(); }
      }
    };
    clearTimeout(saveTimers[k]);
    if (debounce) saveTimers[k] = setTimeout(push, 500);
    else push();
  }

  // ---------- Rendering ----------
  function selectedDay() {
    const c = curDay();
    if (store.selected && store.selected <= Math.max(openThrough(), 1)) return store.selected;
    return Math.max(c, 1);
  }

  function columnHtml(p, d) {
    const r = get(p, d);
    const c = openThrough();
    const mine = store.who === p;
    const open = d >= 1 && d <= c;
    const editable = mine && open;
    const n = count(r);
    const tag = mine ? "Your side" : `${PEOPLE[p]}'s side 💛`;
    const items = ITEMS.map((it) => checkHtml(p, it.key, it.label, it.icon, r[it.key], editable, "")).join("");
    const exId = `ex-${p}`;
    const today = curDay();
    const isToday = d === today;
    const dayChip = `<span class="day-chip ${isToday ? "is-today" : ""}">Day ${d} · ${isToday ? "Today" : dayDate(d)}</span>`;
    const hasNote = !!(r.note_to_other || "").trim();
    // notes can be written from before the challenge starts (for day 1) through today
    const noteBtn = mine && d >= 1 && d <= Math.max(c, 1)
      ? `<button type="button" class="note-btn ${hasNote ? "has" : ""}" data-note="${d}" aria-label="${hasNote ? "Edit your" : "Write a"} note to ${PEOPLE[OTHER[p]]}">💌 ${hasNote ? "Edit note" : "Note"}</button>`
      : "";
    return `
    <section class="col ${p} ${mine ? "mine" : "theirs"} ${perfect(r) ? "perfect" : ""}" data-person="${p}">
      ${bubbleHtml(p, d, mine)}
      <div class="col-head">
        <div class="mascot-wrap">${window.Mascots.render(p, moodFor(r))}</div>
        <div class="col-title">
          <div class="name-row"><h2>${PEOPLE[p]}</h2>${noteBtn}</div>
          <div class="sub-row"><span class="tag">${tag}</span>${dayChip}</div>
        </div>
        <div class="score" aria-label="${n} of 4 done">${n}<small>/4</small></div>
      </div>
      <div class="checks">${items}</div>
      <div class="headliner">
        ${checkHtml(p, "exercised", "Exercised today", "💪", r.exercised, editable, "big")}
        <textarea id="${exId}" data-person="${p}" data-field="exercise_text" rows="2" maxlength="400"
          placeholder="${editable ? "What did you do? (run, lift, hike, yoga…)" : r.exercise_text ? "" : "Nothing logged yet"}"
          ${editable ? "" : "readonly"}>${esc(r.exercise_text)}</textarea>
      </div>
    </section>`;
  }

  function checkHtml(p, k, label, icon, checked, editable, cls) {
    return `<label class="check ${cls} ${checked ? "on" : ""} ${editable ? "" : "ro"}">
      <input type="checkbox" data-person="${p}" data-field="${k}" ${checked ? "checked" : ""} ${editable ? "" : "disabled"}>
      <span class="box" aria-hidden="true"><span class="stamp">${checked ? "✓" : ""}</span></span>
      <span class="check-label"><span class="ico">${icon}</span>${label}</span>
    </label>`;
  }

  // Each koala "says" that person's note to the other one, as a speech bubble above the avatar.
  // Notes are written in the note modal (the button next to your name).
  const shownNotes = {};
  function bubbleHtml(p, d, mine) {
    const r = get(p, d);
    const text = (r.note_to_other || "").trim();
    const seen = shownNotes[p + d];
    const pop = text && seen !== undefined && seen !== text ? " pop" : "";
    shownNotes[p + d] = text;
    if (mine) {
      if (!text) return "";
      return `<div class="bubble above ${p}${pop}"><span class="bubble-to">You said to ${PEOPLE[OTHER[p]]}</span>${esc(text)}</div>`;
    }
    // no note yet: a little thought cloud with "..." floating over their koala
    if (!text) return `<div class="bubble-cloud" role="img" aria-label="No note from ${PEOPLE[p]} yet">
      <svg viewBox="0 0 100 74" width="100" height="74" aria-hidden="true" focusable="false">
        <path d="M22 50 C10 50 6 38 14 32 C10 22 22 14 30 19 C34 8 52 6 58 16 C66 8 82 12 82 24 C94 24 96 40 86 44 C88 52 78 56 70 52 C64 58 50 58 46 52 C38 58 26 56 22 50 Z" fill="#fffaf0" stroke="#3a2e2a" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="40" cy="63" r="4.5" fill="#fffaf0" stroke="#3a2e2a" stroke-width="2.2"/>
        <circle cx="36" cy="70.5" r="2.6" fill="#fffaf0" stroke="#3a2e2a" stroke-width="2"/>
        <circle class="cloud-dot" cx="38" cy="35" r="3.2" fill="#7a6a5f"/><circle class="cloud-dot" cx="50" cy="35" r="3.2" fill="#7a6a5f"/><circle class="cloud-dot" cx="62" cy="35" r="3.2" fill="#7a6a5f"/>
      </svg></div>`;
    return `<div class="bubble above ${p}${pop}"><span class="bubble-to">${PEOPLE[p]} says</span>${esc(text)}</div>`;
  }

  function stripHtml(p) {
    const c = openThrough();
    const today = curDay();
    const sel = selectedDay();
    let cells = "";
    for (let d = 1; d <= DAYS; d++) {
      const r = get(p, d);
      const n = count(r);
      let cls = "cell";
      if (d > c) cls += " future";
      else if (n === 4) cls += " full";
      else if (n > 0) cls += " half";
      if (d === today) cls += " today";
      if (d === sel) cls += " sel";
      if (together(d)) cls += " together";
      const star = n === 4 ? '<span class="star" aria-hidden="true">★</span>' : "";
      const label = `Day ${d}${d === today ? " (today)" : ""}, ${n} of 4${d === sel ? ", showing" : ""}`;
      cells += `<button class="${cls}" data-day="${d}" ${d > c ? "disabled" : ""} ${d === sel ? 'aria-current="date"' : ""} aria-label="${label}"><span class="num">${d}</span>${star}</button>`;
    }
    const st = streak(p);
    const pc = perfectCount(p);
    return `
    <div class="strip ${p}">
      <div class="strip-head"><strong>${PEOPLE[p]}</strong><span class="streak">🔥 ${st}-day perfect streak</span><span class="pc">${pc} perfect</span></div>
      <div class="cells">${cells}</div>
    </div>`;
  }

  function badgesHtml() {
    const rows = ["braden", "kat"].map((p) => {
      const pc = perfectCount(p);
      const b = MILESTONES.map((m, i) => {
        const on = pc >= m;
        const name = BADGES[p][i];
        const status = on ? "Unlocked!" : `${Math.min(pc, m)} of ${m} perfect days`;
        return `<div class="badge ${on ? "on" : "locked"}" aria-label="${name}: ${on ? "unlocked" : "locked, " + status}">
          <span class="prize-wrap">${badgeSvg(name)}</span><b>${name}</b><small>${status}</small>
          <span class="meter" aria-hidden="true"><i style="width:${Math.round((Math.min(pc, m) / m) * 100)}%"></i></span></div>`;
      }).join("");
      return `<div class="badge-row ${p}"><h4>${PEOPLE[p]}</h4><div class="badges">${b}</div></div>`;
    }).join("");
    const both = MILESTONES.filter((m) => perfectCount("braden") >= m && perfectCount("kat") >= m).length;
    const tCount = Array.from({ length: DAYS }, (_, i) => i + 1).filter(together).length;
    const bp = perfectCount("braden"), kp = perfectCount("kat");
    const gOn = bp >= DAYS && kp >= DAYS;
    const meter = (who, v) => `<div class="grand-meter"><span>${who}</span><span class="meter" aria-hidden="true"><i style="width:${Math.round((Math.min(v, DAYS) / DAYS) * 100)}%"></i></span><span>${Math.min(v, DAYS)}/${DAYS}</span></div>`;
    const grand = `
      <div class="grand ${gOn ? "on" : "locked"}" aria-label="${GRAND}: ${gOn ? "unlocked" : `locked, Braden ${bp} and Kat ${kp} of ${DAYS} perfect days`}">
        <small class="grand-kicker">The grand prize · both of you, all ${DAYS} days</small>
        <span class="grand-wrap">${GRAND_ART}</span>
        <b class="grand-name">${GRAND}</b>
        ${gOn ? `<small class="grand-status">Unlocked! Lights, camera, action 🎬</small>` : meter("Braden", bp) + meter("Kat", kp)}
      </div>`;
    return `<section class="card badges-card"><h3>Milestones</h3>${rows}
      <p class="joint">${both ? `💞 You've both unlocked ${both} of 4 together!` : "Unlock a badge at the same time to earn a joint celebration."}</p>
      <p class="joint">💞 Perfect days together: <b>${tCount}</b></p>${grand}</section>`;
  }

  function journalHtml() {
    const c = curDay();
    if (c < 1) return "";
    let out = "";
    for (let d = c; d >= 1; d--) {
      const rows = ["braden", "kat"].map((p) => {
        const r = get(p, d);
        const ticks = ITEMS.map((it) => (r[it.key] ? it.icon : "▫️")).join(" ") + " " + (r.exercised ? "💪" : "▫️");
        return `<div class="j-row ${p}"><b>${PEOPLE[p]}</b> <span class="j-ticks">${ticks}</span>
          ${r.exercise_text ? `<div class="j-ex">🏃 ${esc(r.exercise_text)}</div>` : ""}
          ${r.note_to_other ? `<div class="j-note">💌 ${esc(r.note_to_other)}</div>` : ""}</div>`;
      }).join("");
      out += `<details class="j-day"><summary>Day ${d} · ${dayDate(d)} ${together(d) ? "💞" : ""}</summary>${rows}</details>`;
    }
    return `<section class="card journal"><h3>Journal 📖</h3>${out}</section>`;
  }

  function render() {
    const app = document.getElementById("app");
    const active = document.activeElement;
    const focusId = active && active.id;
    const selStart = active && active.selectionStart;
    const selEnd = active && active.selectionEnd;

    const d = selectedDay();
    const c = curDay();
    const ph = phase();
    const grown = forestEvents().length;
    const dateStr = ph === "before" ? "Day 1 starts Nov 12 at 8 AM" : `Day ${d} · ${dayDate(d)}`;
    const viewing = d !== c && ph === "during" ? `<button class="back" data-day="${c}">Back to today</button>` : "";

    app.innerHTML = `
      ${store.status ? `<div class="status">${esc(store.status)}</div>` : ""}
      ${store.mode === "local" ? `<div class="status soft">Demo mode: data stays on this device until Supabase is connected.</div>` : ""}
      <div class="daybar"><h1>${dateStr}</h1>${viewing}
        <span class="who-line">${store.who ? `You're <b>${PEOPLE[store.who]}</b> · <a href="#" id="not-me">not me?</a>` : ""}</span>
        <button id="sound" class="sound" aria-pressed="${FX.sound}">${FX.sound ? "🔔 Sound on" : "🔕 Sound off"}</button>
      </div>
      ${ph === "before" ? `<p class="hint">The boxes unlock at 8 AM sharp. Get ready 🐨</p>` : ""}
      <div class="cols">${store.who === "kat" ? columnHtml("kat", d) + columnHtml("braden", d) : columnHtml("braden", d) + columnHtml("kat", d)}</div>
      ${forestHtml(grown)}
      <section class="card strips"><h3>The 30-day card</h3>${stripHtml("braden")}${stripHtml("kat")}
        <p class="legend"><span class="cell full"><span class="num">4</span></span> perfect <span class="cell half"><span class="num">2</span></span> partial <span class="cell"><span class="num">1</span></span> empty <span class="cell today"><span class="num">9</span></span> today <span class="cell sel"><span class="num">6</span></span> showing · pink = both perfect 💞</p></section>
      ${badgesHtml()}
      ${journalHtml()}
      <footer>Made with 💛 for Braden &amp; Kat · Nov 12 to Dec 12, 2026</footer>`;

    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) { el.focus(); try { el.setSelectionRange(selStart, selEnd); } catch (e) {} }
    }
    document.getElementById("who-modal").hidden = !!store.who;
    if (window.Grove) {
      window.Grove.background(grown);
      window.Grove.mount(document.getElementById("grove-mini"), grown);
    }
  }

  // ---------- Note modal ----------
  let noteDay = 0, noteBack = null;
  function openNote(d) {
    const me = store.who;
    if (!me) return;
    noteDay = d;
    noteBack = document.activeElement;
    const to = PEOPLE[OTHER[me]];
    const m = document.getElementById("note-modal");
    const ta = document.getElementById("note-text");
    document.getElementById("note-title").textContent = `Note to ${to} 💌`;
    document.getElementById("note-sub").textContent = `Day ${d} · ${dayDate(d)}. It pops up above your koala on ${to}'s screen.`;
    ta.placeholder = `Something sweet, silly or encouraging for ${to}…`;
    ta.value = get(me, d).note_to_other || "";
    document.getElementById("note-count").textContent = `${ta.value.length} / 500`;
    m.hidden = false;
    ta.focus();
    try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {}
  }
  function closeNote() {
    const m = document.getElementById("note-modal");
    if (!m || m.hidden) return;
    m.hidden = true;
    const back = document.querySelector(`.col.${store.who} .note-btn`) || noteBack;
    if (back && back.focus) back.focus();
  }
  function sendNote() {
    const me = store.who;
    if (!me || !noteDay) return closeNote();
    const text = document.getElementById("note-text").value.trim();
    save(me, noteDay, { note_to_other: text });
    document.getElementById("note-modal").hidden = true;
    render();
    const btn = document.querySelector(`.col.${me} .note-btn`);
    if (btn) btn.focus();
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNote();
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && e.target.id === "note-text") sendNote();
  });

  // ---------- Countdown ----------
  function tickCountdown() {
    const n = nowMs();
    const ph = phase();
    const label = document.getElementById("cd-label");
    const box = document.getElementById("countdown");
    const pill = document.getElementById("daypill");
    if (ph === "after") {
      label.textContent = "You did it!";
      box.innerHTML = `<div class="done">30 days 🎉</div>`;
      pill.textContent = "Nov 12 to Dec 12, 2026";
      if (!celebrated.has("fin")) { celebrated.add("fin"); window.FX.finale(); }
    } else {
      const target = ph === "before" ? START : END;
      let s = Math.max(0, Math.floor((target - n) / 1000));
      const parts = [["days", Math.floor(s / 86400)], ["hrs", Math.floor((s % 86400) / 3600)], ["min", Math.floor((s % 3600) / 60)], ["sec", s % 60]];
      label.textContent = ph === "before" ? "Challenge begins in" : "Time left in the challenge";
      box.innerHTML = parts.map(([u, v]) => `<div class="unit"><b>${String(v).padStart(2, "0")}</b><small>${u}</small></div>`).join("");
      pill.textContent = ph === "before" ? "Nov 12 · 8:00 AM Pacific" : `Day ${curDay()} of ${DAYS}`;
    }
    const cd = curDay();
    if (cd !== lastDay) { lastDay = cd; if (store.selected && store.selected > Math.max(cd, 1)) store.selected = null; render(); }
  }

  // ---------- Events ----------
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.type !== "checkbox" || !t.dataset.person) return;
    const p = t.dataset.person;
    if (p !== store.who) return;
    const d = selectedDay();
    const was = perfect(get(p, d));
    save(p, d, { [t.dataset.field]: t.checked });
    render();
    const row = document.querySelector(`.col.${p} input[data-field="${t.dataset.field}"]`);
    const label = row && row.closest(".check");
    window.FX.tick(label, t.checked);
    if (!was && perfect(get(p, d))) {
      window.FX.perfectDay(document.querySelector(`.col.${p}`));
      const pc = perfectCount(p);
      if (MILESTONES.includes(pc)) setTimeout(() => window.FX.milestone(pc), 700);
      if (together(d)) setTimeout(() => window.FX.together(), 1000);
      if (window.Grove) {
        const n = forestEvents().length;
        setTimeout(() => window.Grove.toast(n, openForest), 1600);
      }
    }
  });

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "note-text") {
      document.getElementById("note-count").textContent = `${t.value.length} / 500`;
      return;
    }
    if (t.tagName !== "TEXTAREA" || t.dataset.person !== store.who) return;
    save(t.dataset.person, selectedDay(), { [t.dataset.field]: t.value }, true);
  });

  document.addEventListener("click", (e) => {
    const t = e.target;
    const dayBtn = t.closest("[data-day]");
    if (dayBtn && !dayBtn.disabled) {
      const pick = Number(dayBtn.dataset.day);
      // Tapping today means "follow the clock", so the page still advances at 8 AM.
      store.selected = pick === curDay() ? null : pick;
      render();
      return;
    }
    const noteBtn = t.closest("[data-note]");
    if (noteBtn) { openNote(Number(noteBtn.dataset.note)); return; }
    if (t.id === "note-save") { sendNote(); return; }
    if (t.id === "note-cancel" || t.id === "note-modal") { closeNote(); return; }
    if (t.closest("#see-forest")) {
      openForest();
      return;
    }
    if (t.id === "not-me") {
      e.preventDefault();
      store.who = null;
      try { localStorage.removeItem("c30_who"); } catch (er) {}
      render();
      return;
    }
    if (t.id === "sound") {
      window.FX.setSound(!window.FX.sound);
      render();
      if (window.FX.sound) window.FX.tick(null, true);
      return;
    }
    const who = t.closest("[data-who]");
    if (who && who.classList.contains("who-btn")) {
      store.who = who.dataset.who;
      try { localStorage.setItem("c30_who", store.who); } catch (er) {}
      render();
    }
  });

  // ---------- Boot ----------
  if (window.Grove) window.Grove.now = nowMs;
  render();
  tickCountdown();
  setInterval(tickCountdown, 1000);
  initData().then(() => { render(); });
})();
