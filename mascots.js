/*
 * Koala mascots for "Braden & Kat: 30 Days".
 *
 * Contract:
 *   Mascots.render(who, mood) -> string of inline SVG markup
 *     who:  "braden" | "kat"
 *     mood: "sleepy" | "perking" | "almost" | "celebrating"
 *
 * How it works: each koala is ONE drawing that contains every mood's face, arms and
 * extras. mascots.css shows the right pieces for svg[data-mood] and animates them.
 * Colours live in mascots.css too (classes like f-fur, o = outlined), so the markup
 * stays small (~4 KB per koala) and contains no fonts, images or network requests.
 *
 * Mood visibility classes:  mo = hidden unless one of these matches
 *   s = sleepy, p = perking, a = almost, c = celebrating
 */
(function () {
  // A 4-point sparkle centred on 0,0. Wrapped in <g transform> so CSS can animate it.
  const STAR = "M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z";
  const star = (x, y, k) =>
    `<g transform="translate(${x} ${y}) scale(${k})"><path class="o-thin f-gold m-star" d="${STAR}"/></g>`;

  // Two-stroke limb: dark outline underneath, fur on top (gives the sticker outline).
  const limb = (d) => `<path class="arm-o" d="${d}"/><path class="arm" d="${d}"/>`;
  const paw = (x, y) => `<circle class="o f-fur" cx="${x}" cy="${y}" r="5"/>`;

  // ---------- shared pieces ----------
  const shadow = '<ellipse class="m-shadow" cx="60" cy="115" rx="30" ry="4"/>';

  const ears =
    '<g class="m-ears"><circle class="o f-fur" cx="29" cy="32" r="17"/><circle class="f-ear" cx="31" cy="34" r="9"/>' +
    '<circle class="o f-fur" cx="91" cy="32" r="17"/><circle class="f-ear" cx="89" cy="34" r="9"/></g>';

  const head =
    '<ellipse class="o f-fur" cx="60" cy="52" rx="31" ry="28"/>' +
    '<ellipse class="f-cheek" cx="39" cy="64" rx="5" ry="3.5"/><ellipse class="f-cheek" cx="81" cy="64" rx="5" ry="3.5"/>';

  const nose =
    '<path class="o f-nose" d="M60 50 c6 0 8 5 8 10 c0 7 -4 11 -8 11 c-4 0 -8 -4 -8 -11 c0 -5 2 -10 8 -10 z"/>' +
    '<ellipse class="f-white" cx="57" cy="55" rx="2" ry="2.8" opacity=".8"/>';

  const eyes =
    // sleepy: closed, curved down
    '<path class="mo s ln" d="M40 51 q5 4 10 0 M70 51 q5 4 10 0"/>' +
    // perking: open, round
    '<g class="mo p"><ellipse class="f-ink" cx="45" cy="50" rx="4.5" ry="5.5"/><ellipse class="f-ink" cx="75" cy="50" rx="4.5" ry="5.5"/>' +
    '<circle class="f-white" cx="46.6" cy="48" r="1.7"/><circle class="f-white" cx="76.6" cy="48" r="1.7"/></g>' +
    // almost: bigger, with a twinkle
    '<g class="mo a"><ellipse class="f-ink" cx="45" cy="50" rx="5.5" ry="6.6"/><ellipse class="f-ink" cx="75" cy="50" rx="5.5" ry="6.6"/>' +
    '<circle class="f-white" cx="47" cy="47.6" r="2.1"/><circle class="f-white" cx="77" cy="47.6" r="2.1"/>' +
    '<circle class="f-white m-twinkle" cx="43.2" cy="53" r="1.1"/><circle class="f-white m-twinkle" cx="73.2" cy="53" r="1.1"/></g>' +
    // celebrating: happy ^ ^
    '<path class="mo c ln ln-b" d="M40 52 q5 -7 10 0 M70 52 q5 -7 10 0"/>';

  const mouths =
    '<ellipse class="mo s f-mouth o-thin m-yawn" cx="60" cy="75.5" rx="2.3" ry="2.7"/>' +
    '<path class="mo p ln" d="M55 74 q5 4 10 0"/>' +
    '<path class="mo a o f-mouth" d="M54 73 q6 7 12 0 z"/>' +
    '<g class="mo c"><path class="o f-mouth" d="M52 72.5 q8 11 16 0 z"/><ellipse class="f-blush" cx="60" cy="78" rx="3.6" ry="1.9"/></g>';

  const zzz =
    '<g class="mo s m-zzz">' +
    '<g transform="translate(92 18)"><path class="ln m-z" d="M0 0 h5 l-5 6 h5"/></g>' +
    '<g transform="translate(101 9) scale(1.25)"><path class="ln m-z" d="M0 0 h5 l-5 6 h5"/></g>' +
    '<g transform="translate(110 -1) scale(1.5)"><path class="ln m-z" d="M0 0 h5 l-5 6 h5"/></g></g>';

  const stars =
    '<g class="mo c m-stars">' + star(10, 18, 1.1) + star(110, 92, 0.9) + star(8, 92, 0.8) + star(60, 6, 0.9) + "</g>";

  // ---------- Braden: goldsmith ----------
  const flame =
    '<g class="m-flame"><path class="o f-gold" d="M26 70 c3 4 5 7 5 9 a5 5 0 0 1 -10 0 c0 -2 2 -5 5 -9 z"/>' +
    '<path class="f-rust" d="M26 75 c1.5 2 2.5 3.5 2.5 4.5 a2.5 2.5 0 0 1 -5 0 c0 -1 1 -2.5 2.5 -4.5 z"/></g>';
  const torch = (hx1, hy1, hx2, hy2, nx, ny) =>
    `<path class="tool-o" d="M${hx1} ${hy1} L${hx2} ${hy2}"/><path class="tool f-rust-s" d="M${hx1} ${hy1} L${hx2} ${hy2}"/>` +
    `<path class="nozzle-o" d="M${hx2} ${hy2} L${nx} ${ny}"/><path class="nozzle" d="M${hx2} ${hy2} L${nx} ${ny}"/>`;

  const sparks =
    '<g class="m-sparks">' +
    [[4, 36], [13, 32], [22, 36], [2, 47], [24, 46], [9, 28]]
      .map(([x, y]) => `<circle class="f-gold o-thin m-spark" cx="${x}" cy="${y}" r="1.9"/>`)
      .join("") +
    "</g>";

  const bradenBody =
    '<path class="o f-sage" d="M34 112 C30 92 40 78 60 78 C80 78 90 92 86 112 Z"/>' +
    '<path class="ln" d="M50 84 L45 79 M70 84 L75 79"/>' +
    '<path class="o f-leather" d="M50 84 h20 v8 l6 20 h-32 l6 -20 z"/>' +
    '<path class="o-thin f-leather2" d="M53 98 h14 v6 q-7 4 -14 0 z"/>' +
    '<circle class="ring" cx="63.5" cy="96.5" r="2.6"/>' +
    '<ellipse class="o f-fur" cx="46" cy="112" rx="9" ry="4.5"/><ellipse class="o f-fur" cx="74" cy="112" rx="9" ry="4.5"/>';

  const loupe =
    '<path class="band" d="M31 39 q29 -13 58 0"/>' +
    // up on forehead (all moods except celebrating)
    '<g class="mo s p a"><circle class="o f-gold" cx="49" cy="33" r="6"/><circle class="f-glass" cx="49" cy="33" r="3.4"/>' +
    '<circle class="o f-gold" cx="71" cy="33" r="6"/><circle class="f-glass" cx="71" cy="33" r="3.4"/></g>' +
    // celebrating: one loupe drops over his eye
    '<g class="mo c"><circle class="o f-gold" cx="49" cy="33" r="6"/><circle class="f-glass" cx="49" cy="33" r="3.4"/>' +
    '<path class="strap" d="M71 35 L75 42"/><circle class="lens" cx="75" cy="51" r="8.5"/>' +
    '<path class="f-white" opacity=".7" d="M70 47 a6 6 0 0 1 4 -3 l.5 1.5 a5 5 0 0 0 -3 2.5 z"/></g>';

  const bradenArmL =
    '<g class="m-arm-l">' +
    '<g class="mo s p a">' + limb("M40 86 L31 101") + torch(30, 101, 27, 88, 26, 83) + flame + paw(31, 101) + "</g>" +
    '<g class="mo c">' + limb("M40 84 L20 72") + torch(19, 72, 15, 60, 13, 55) +
    '<g transform="translate(-13 -28)">' + flame + "</g>" + paw(20, 72) + sparks + "</g></g>";

  const bradenArmR =
    '<g class="m-arm-r"><g class="mo s p a">' + limb("M80 86 L89 101") + paw(89, 101) + "</g>" +
    '<g class="mo c">' + limb("M80 84 L96 66") + paw(96, 66) + "</g></g>";

  // ---------- Kat: camera operator ----------
  const katBody =
    '<path class="o f-blue" d="M34 112 C30 92 40 78 60 78 C80 78 90 92 86 112 Z"/>' +
    '<rect class="o-thin f-paper" x="41" y="93" width="11" height="13" rx="1.5" transform="rotate(-6 46 99)"/>' +
    '<path class="ln-thin" d="M43 97 h6 M43 100 h6"/>' +
    '<rect class="o f-blue2" x="38" y="100" width="16" height="10" rx="2.5"/>' +
    '<path class="o f-blush" d="M43 80 q17 9 34 0 l-2 6 q-15 6 -30 0 z"/>' +
    '<ellipse class="o f-fur" cx="46" cy="112" rx="9" ry="4.5"/><ellipse class="o f-fur" cx="74" cy="112" rx="9" ry="4.5"/>';

  const pencil =
    '<path class="tool-o" d="M16 50 L36 30"/><path class="tool f-gold-s" d="M16 50 L36 30"/>' +
    '<path class="o-thin f-paper" d="M17.8 51.8 L12.6 53.4 L14.2 48.2 Z"/>';

  const flash =
    '<g class="mo c m-flash"><path class="o-thin f-white" d="M121 52 L124 62 L134 60 L126 67 L133 75 L123 71 L120 81 L117 71 L108 74 L115 66 L109 58 L118 61 Z"/>' +
    '<circle class="f-gold" cx="121" cy="66" r="3.5"/></g>';

  const camera =
    '<g class="m-cam">' + flash +
    '<path class="handle" d="M90 56 v-5 h16 v5"/>' +
    '<rect class="o f-cam" x="84" y="56" width="26" height="20" rx="4"/>' +
    '<rect class="f-cam2" x="90" y="61" width="12" height="9" rx="1.5"/>' +
    '<rect class="o f-cam" x="108" y="59" width="8" height="14" rx="2"/>' +
    '<ellipse class="o-thin f-glass" cx="117" cy="66" rx="2.2" ry="6"/>' +
    '<circle class="f-red m-rec" cx="87.5" cy="60.5" r="2"/></g>';

  const katArmL =
    '<g class="m-arm-l"><g class="mo s p a">' + limb("M40 86 L31 101") + paw(31, 101) + "</g>" +
    '<g class="mo c">' + limb("M40 84 L24 66") + paw(24, 66) + "</g></g>";

  const katArmR =
    '<g class="m-arm-r"><g class="mo s p a">' + limb("M78 88 L93 80") + paw(93, 80) + "</g>" +
    '<g class="mo c">' + limb("M80 84 L96 56") + paw(96, 56) + "</g></g>";

  // ---------- assembly ----------
  const parts = {
    braden: {
      label: "Braden the goldsmith koala",
      body: bradenBody,
      beforeHead: "",
      face: loupe,
      front: bradenArmL + bradenArmR,
    },
    kat: {
      label: "Kat the camera operator koala",
      body: katBody,
      beforeHead: pencil,
      face: "",
      front: katArmL + camera + katArmR,
    },
  };

  const moodWords = {
    sleepy: "sleepy, no boxes ticked yet",
    perking: "perking up",
    almost: "almost there",
    celebrating: "celebrating a perfect day",
  };

  // Cache: the drawing never changes, only the data-mood attribute does.
  const cache = {};
  function drawing(who) {
    if (cache[who]) return cache[who];
    const p = parts[who];
    cache[who] =
      shadow +
      '<g class="m-body">' + p.body +
      '<g class="m-head">' + ears + p.beforeHead + head + eyes + nose + mouths + p.face + "</g>" +
      p.front + "</g>" + zzz + stars;
    return cache[who];
  }

  window.Mascots = {
    render(who, mood) {
      if (!parts[who]) who = "braden";
      if (!moodWords[mood]) mood = "perking";
      return (
        `<svg class="mascot" data-who="${who}" data-mood="${mood}" viewBox="0 0 120 120" role="img" ` +
        `aria-label="${parts[who].label}, ${moodWords[mood]}">` + drawing(who) + "</svg>"
      );
    },
  };
})();
