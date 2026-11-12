# Braden & Kat: 30 Days

A one-page shared tracker. Nov 12, 2026 8:00 AM to Dec 12, 2026 8:00 AM (Pacific). Plain HTML, CSS and JS, no build step.

## Files

| File | Purpose | Owner |
|---|---|---|
| `index.html`, `styles.css`, `app.js` | Layout, countdown, data, streaks, badges | Claude Code |
| `config.js` | Supabase URL and anon key | You |
| `supabase.sql` | One-time table and security setup | You (run once) |
| `mascots.js`, `mascots.css` | Koala art and mood animations | Claude Design |
| `fx.js` | Confetti, tick stamps, celebrations, sound | Claude Design |
| `grove.js`, `grove.css` | The shared eucalyptus forest: app background, forest card, full-screen scrubber | Claude Design |
| `preview.html` | Preview of the koalas in every mood and every effect | Claude Design |
| `docs/CLAUDE-DESIGN-PROMPT.md` | The prompt to give Claude Design | |

## Setup

1. **Supabase:** create a project, open SQL Editor, paste `supabase.sql`, Run.
2. **Config:** copy the Project URL and `anon` public key (Project Settings > API) into `config.js`.
   The anon key is meant to be public, so committing it is fine.
3. **GitHub Pages:** push to a repo, then Settings > Pages > deploy from `main` / root. Use an unlisted
   repo name and do not share the link beyond the two of you, because there is no login by design.
4. Open the link on both phones, pick Braden or Kat once, done.

Without a config the app runs in demo mode (data stays in that browser only).

## Testing the calendar

Add `?now=2026-11-20T10:00:00-08:00` to the URL to pretend it is another moment. Useful values:
before start `2026-11-12T07:00:00-08:00`, the finale `2026-12-12T08:00:01-08:00`.

## Notes

- Days run 8 AM to 8 AM Pacific. Past days stay editable; future days are locked.
- Each person can edit only their own side. This is a UI rule, not security.
