# AFG Recruiting Campaign Hub: setup

Two pieces: a **Google Sheet + Apps Script** (the data) and a **static `index.html`** (the site).

---

## 1. Backend (Google Sheet + Apps Script)

1. Create a new **Google Sheet** (name it whatever, you will never open it by hand).
2. **Extensions > Apps Script**. Delete the sample code, paste in **`apps-script/Code.gs`**, Save.
3. Run the **`setup`** function once (pick it from the function dropdown, then Run).
   Authorize when Google asks. If Google shows an "unverified app" warning, click
   **Advanced**, then **Go to (project name) (unsafe)**. This is expected for a
   script you wrote yourself; it is only warning that Google has not reviewed it.
   Running `setup()` builds every tab and loads the 56 source packet items plus
   the 17 milestones.
4. Set the two passphrases, kept out of the code on purpose:
   **Project Settings (gear icon) > Script Properties > Add script property**
   - Name: `TEAM_CODE`, Value: a simple code you give to the group (for checking items off)
   - Name: `ADMIN_PASSPHRASE`, Value: a passphrase only the Marketing Director uses
5. **Deploy > New deployment > Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy, then copy the **Web app URL** (it ends in `/exec`).

> Changed `Code.gs` later? Go to **Deploy > Manage deployments > edit (pencil icon) >
> Version: New > Deploy.** Saving in the Apps Script editor is not enough; a plain
> save does not update the live `/exec` URL. This is the single most common
> "my change did not show up" mistake.

---

## 2. Frontend (the site)

1. Open **`index.html`**, find this line near the top of the script:
   ```js
   const API_URL = "";
   ```
   Paste your `/exec` URL between the quotes. Save.
2. Host it on GitHub Pages:
   **GitHub, new repository, upload `index.html` (and the rest of this folder),
   Settings, Pages, deploy from the main branch.**
   The link will be `https://<your-username>.github.io/<repo-name>/`.

Leave `API_URL` empty and the site runs entirely on built-in demo data stored in
the browser, which is useful for previewing the look before the backend is wired up.

---

## 3. Using the site

- **Group members:** open the link, tap **Who are you?**, pick a name (or add
  yours), and enter the team code. After that, checking an item off saves it
  for everyone within about 20 seconds. Unchecking and rechecking both work,
  and closing the tab right after a change still saves it.
- **Marketing Director (admin):** tap **Admin**, enter the admin passphrase
  (remembered on this device), then add or edit source packet items, manage
  members and links, edit the campaign brief and gate checklist, set the
  final due date, or reset checks if the group needs a clean slate.

Add group members under **Admin > 4. Members** before asking people to
identify themselves, so their name shows up in the "Who are you?" list.

---

## Keeping the seed data in sync

The 56 source packet items and 17 milestones live in three places that must
match: `seed/items.json`, the `SEED` constant in `apps-script/Code.gs`, and
the `DEMO` constant in `index.html`. If you ever edit `seed/items.json`
(adding an item, fixing a typo), run:

```bash
node scripts/sync-seed.mjs
```

This rewrites both embedded copies from the canonical file, so they can
never drift apart. After running it, redeploy `Code.gs` as a **new version**
(see the gotcha above) and commit and push `index.html`.

---

## Notes on the security model

- Reads are public. Anyone with the link can see the checklist. That is intended.
- Checking items off requires `TEAM_CODE`, and admin actions require
  `ADMIN_PASSPHRASE`, both **verified server-side in `Code.gs`**, never in the page.
- Neither code lives in the repository. Both are typed once and remembered
  only in the browser that entered them.
- This site tracks status only. Nothing AFG considers confidential should
  ever be pasted into the Sheet or the site itself.
