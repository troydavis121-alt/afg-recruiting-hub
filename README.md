# AFG Recruiting Campaign Hub

A one-page shared checklist for the MAR 6880 Social Media Marketing group
project. The client is Alliance Financial Group (AFG), the campaign is
about recruiting, and the site owner is AFG's Marketing Director.

It has three jobs:

1. **Source Packet checklist**, the 56 items the Marketing Director has to
   supply, checkable by anyone in the group, saved to a Google Sheet so
   nothing gets lost when someone closes the tab.
2. **Milestones checklist**, the 17 week-by-week project milestones, same
   check-off behavior.
3. **Reference hub**: the campaign brief, team roles, kickoff agenda, key
   links, and a recent activity log.

- `index.html`: the whole site (HTML, CSS, and vanilla JS, no build step). Deploy to GitHub Pages.
- `apps-script/Code.gs`: the backend. Paste into Google Apps Script, run `setup()` once.
- `seed/items.json`: the canonical source packet and milestone content.
- `scripts/sync-seed.mjs`: keeps the seed data in `Code.gs` and `index.html` in sync with `seed/items.json`.
- `SETUP.md`: full deploy guide.
- `YOUR_MANUAL_TASKS.md`: the click-by-click steps only a person can do (Google sign-in, deployment, sharing the link).

Leave `API_URL` empty in `index.html` to preview on built-in demo data; paste
your Apps Script `/exec` URL to go live. See `SETUP.md` for the full guide.
