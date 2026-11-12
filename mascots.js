/*
 * MASCOT SWAP-IN POINT (owned by Claude Design, see docs/CLAUDE-DESIGN-PROMPT.md)
 *
 * Contract:
 *   Mascots.render(who, mood) -> string of inline SVG markup
 *     who:  "braden" | "kat"
 *     mood: "sleepy" | "perking" | "almost" | "celebrating"
 *           sleepy = 0 of 4 done, perking = 1-2, almost = 3, celebrating = 4
 *   The returned markup must be wrapped in <svg class="mascot" data-who data-mood>
 *   and may use CSS classes defined in mascots.css for animation.
 *
 * This file is a deliberately simple placeholder so the app works today.
 */
(function () {
  const palette = {
    braden: { fur: "#a9b0a4", accent: "#b5532f" },
    kat: { fur: "#b7bcc9", accent: "#e58fa6" },
  };

  function eyes(mood) {
    if (mood === "sleepy")
      return '<path d="M40 58 q6 5 12 0 M68 58 q6 5 12 0" stroke="#3a2e2a" stroke-width="3" fill="none" stroke-linecap="round"/>';
    if (mood === "celebrating")
      return '<path d="M40 60 q6 -8 12 0 M68 60 q6 -8 12 0" stroke="#3a2e2a" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
    const r = mood === "almost" ? 5 : 4;
    return `<circle cx="46" cy="58" r="${r}" fill="#3a2e2a"/><circle cx="74" cy="58" r="${r}" fill="#3a2e2a"/>`;
  }

  function mouth(mood) {
    if (mood === "sleepy") return '<path d="M54 82 h12" stroke="#3a2e2a" stroke-width="3" stroke-linecap="round"/>';
    if (mood === "celebrating")
      return '<path d="M48 78 q12 18 24 0 z" fill="#d9626f" stroke="#3a2e2a" stroke-width="2.5" stroke-linejoin="round"/>';
    return '<path d="M50 80 q10 9 20 0" stroke="#3a2e2a" stroke-width="3" fill="none" stroke-linecap="round"/>';
  }

  function accessory(who, c) {
    if (who === "braden")
      return `<g><circle cx="46" cy="36" r="9" fill="none" stroke="${c.accent}" stroke-width="4"/><circle cx="74" cy="36" r="9" fill="none" stroke="${c.accent}" stroke-width="4"/><path d="M55 36 h10" stroke="${c.accent}" stroke-width="4"/></g>`;
    return `<g><circle cx="88" cy="32" r="7" fill="${c.accent}"/><circle cx="88" cy="32" r="3" fill="#ffe9a8"/></g>`;
  }

  window.Mascots = {
    render(who, mood) {
      const c = palette[who] || palette.braden;
      return `<svg class="mascot" data-who="${who}" data-mood="${mood}" viewBox="0 0 120 120" role="img" aria-label="${who} koala, ${mood}">
        <g class="m-body">
          <circle cx="22" cy="40" r="20" fill="${c.fur}"/><circle cx="22" cy="40" r="11" fill="#f3d9d9"/>
          <circle cx="98" cy="40" r="20" fill="${c.fur}"/><circle cx="98" cy="40" r="11" fill="#f3d9d9"/>
          <circle cx="60" cy="66" r="42" fill="${c.fur}"/>
          <ellipse cx="60" cy="72" rx="9" ry="12" fill="#3a2e2a"/>
          ${eyes(mood)}${mouth(mood)}${accessory(who, c)}
        </g>
      </svg>`;
    },
  };
})();
