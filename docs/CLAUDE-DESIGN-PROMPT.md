# Claude Design prompt: koala mascots and celebration effects

Paste everything below the line into Claude Design, and attach (or paste) `mascots.js`, `mascots.css`,
and `fx.js` from this repo so it can see the placeholders it is replacing. Take its output back to
Claude Code (or just drop the files in) and overwrite those three files. Nothing else in the app changes.

---

## What I need

I'm building a tiny two-person "30 days of healthy habits" tracker for me (Braden) and my partner (Kat).
The app logic, layout and data are done. I need you to design the **two koala mascots and the
celebration animations** and deliver them as drop-in replacements for three existing files.

The feeling: a cozy sticker book / bullet journal. Warm cream paper, thick friendly dark-brown outlines
(about 2.5px at 120px size), flat soft colors, a little wobble and bounce. It should feel like filling in
a bingo card: every tick should be a tiny hit of joy. Storybook charm, big expressive eyes, gentle
fairy-tale whimsy. Original characters only. Do not imitate any existing franchise character.

Palette already in the app: paper `#fbf3e4`, ink `#3a2e2a`, rust `#b5532f`, blush `#d9738f`,
sage `#7fae8b`, gold `#f4b942`.

## The two mascots (both koalas)

**Braden-koala, a goldsmith.** Cozy, adventurous, goofy loyal-sidekick energy. Leather apron, magnifying
loupe goggles pushed up on his forehead (can drop over one eye in the celebrating mood), and a tiny
jeweler's torch (small flame) held in one paw. Warm earthy colors: sage, rust, cream, leather brown.
Optional small touch: a tiny gold ingot or ring sparkle.

**Kat-koala, a CBC News camera operator and aspiring investigative journalist.** Graceful, bright,
kind-hearted lead energy. A big shoulder-mounted broadcast news camera, plus a small notebook and pencil
tucked behind one ear or in a pocket. Soft dusty blue and blush pink. Do not put any real logos or
network branding on anything: just a plain camera, maybe with a tiny red "recording" dot.

## Mood states (the mascot reacts to how many of 4 daily boxes are ticked)

1. `sleepy` (0 of 4): eyes closed, slow breathing, little "z" floating up, maybe a yawn.
2. `perking` (1 or 2 of 4): eyes open, curious head tilt or gentle sway.
3. `almost` (3 of 4): eager, leaning forward, quick little bounces, sparkle in the eyes.
4. `celebrating` (4 of 4): full happy dance, arms up, big open smile, stars or sparkles popping around.
   Braden throws a little shower of golden sparks from the torch. Kat holds up the camera and a flash pops.

## Deliverable 1: `mascots.js` and `mascots.css`

Contract (do not change the names):

```js
window.Mascots = {
  render(who, mood) { /* returns an SVG markup STRING */ }
}
// who:  "braden" | "kat"
// mood: "sleepy" | "perking" | "almost" | "celebrating"
```

- Return one inline `<svg class="mascot" data-who="..." data-mood="..." viewBox="0 0 120 120" role="img" aria-label="...">`.
  The viewBox is square, and the app shows it at roughly 84px on a phone, so keep details bold and readable.
- Animate with **pure CSS** inside `mascots.css` using selectors like `.mascot[data-mood="celebrating"] .m-arm-l`.
  No JS animation libraries, no external images, no fonts, no network requests. Everything inline.
- The app re-renders the whole card when anything changes, which restarts animations. So idle loops
  should be gentle and look fine when they restart, and one-shot transitions should be quick.
- Wrap all motion in `@media (prefers-reduced-motion: reduce)` so it falls back to a static pose.
- Keep each mascot SVG under about 6KB.

## Deliverable 2: `fx.js`

Contract (all functions must be safe to call at any time, never throw, and no-op quietly if something is missing):

```js
window.FX = {
  sound: false,           // off by default; the app has a toggle
  setSound(on) {},
  tick(el, checked) {},   // a checkbox row was toggled; el = the .check label element (has a .box inside)
  perfectDay(el) {},      // a person just hit 4/4; el = their card (.col)
  milestone(day) {},      // unlocked a badge at day 7, 14, 21 or 30
  together() {},          // both people have a perfect day
  finale() {},            // the 30 days are over (play once, make it big)
}
```

What each should feel like:

- **tick**: a satisfying sticker-stamp. The checkmark slams in with a small overshoot, a tiny ring or
  burst of 6 to 10 confetti bits, and (if sound is on) a soft "pop". Unticking is quiet and quick.
- **perfectDay**: confetti burst from the card, gold stars, the card does a brief happy jiggle.
- **milestone**: a bigger moment. A medal or ribbon drops in and swings, confetti rains from the top.
- **together**: hearts floating up from both sides of the screen.
- **finale**: fireworks plus a long confetti shower, around 4 seconds.

Technical rules for `fx.js`:

- Self-contained vanilla JS. The page already has `<canvas id="fx-canvas">` fixed over the whole screen
  (pointer-events none, z-index 60) that you may draw on. DOM and CSS animation is fine too.
- Particles must clean up after themselves and stop the animation loop when idle (no battery drain).
- Respect `prefers-reduced-motion` (skip big motion, keep a simple fade).
- Sound, if any, via tiny Web Audio oscillator blips only (no audio files), and only when `FX.sound` is true.
- Must run smoothly on a mid-range phone.

## How to hand it back

Give me exactly three complete files I can drop in: `mascots.js`, `mascots.css`, `fx.js`. Also give me a
simple preview page (one HTML file) that shows both koalas in all four moods and buttons to trigger each
FX function, so I can judge the animation before it goes into the app.
