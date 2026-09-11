# Your manual tasks

This project was built for you in this folder: `index.html`, `apps-script/Code.gs`,
`seed/items.json`, `scripts/sync-seed.mjs`, `SETUP.md`, `README.md`. The steps
below need a human at the keyboard: Google sign-in, authorization prompts, and
deployment clicks that an assistant cannot do on your behalf.

Note: this machine does not currently have **Git** or **Node.js** installed, so
the steps below use the GitHub website directly instead of git commands. If you
later install Git and Node.js, `SETUP.md` and `scripts/sync-seed.mjs` describe
the command-line path.

---

## 1. Create the Google Sheet and Apps Script project

1. Go to [sheets.google.com](https://sheets.google.com) and create a new,
   blank spreadsheet. Name it something like "AFG Recruiting Campaign Hub data."
   You will not need to open it again after this setup.
2. In the Sheet, click **Extensions > Apps Script**. A new tab opens with a
   default `Code.gs` file containing a sample `myFunction`.
3. Select all the sample code and delete it.
4. Open `apps-script/Code.gs` from this folder, copy its entire contents,
   and paste it into the Apps Script editor.
5. Click the disk icon (or Ctrl+S) to save. Give the project a name if asked,
   for example "AFG Recruiting Hub."

## 2. Run setup() and approve the authorization prompt

1. In the Apps Script toolbar, find the function dropdown (it may say
   `doGet` by default) and change it to **`setup`**.
2. Click **Run**.
3. A dialog will ask you to authorize the script. Click **Review permissions**,
   choose your Google account, and continue.
4. Google will very likely show a screen that says **"Google hasn't verified
   this app."** This is expected: it just means the script has not gone
   through Google's public-app review, which is normal for a script you
   wrote yourself for a private project. Click **Advanced**, then click
   **Go to (your project name) (unsafe)**, then **Allow**.
5. Run finishes. Check the **Executions** tab (left sidebar) for a green
   checkmark, or open your Google Sheet, where you should now see new tabs:
   `categories`, `items`, `members`, `links`, `meta`, `log`, all populated.

## 3. Set the two Script Properties

1. In the Apps Script editor, click the gear icon (**Project Settings**) in
   the left sidebar.
2. Scroll to **Script Properties**, click **Add script property**, and add:
   - Property: `TEAM_CODE`, Value: a short code you will give the group (for example a word or short phrase)
   - Property: `ADMIN_PASSPHRASE`, Value: a passphrase only you (the Marketing Director) will use
3. Click **Save script properties**.

## 4. Deploy the Web App and copy the /exec URL

1. Click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set **Execute as: Me**, and **Who has access: Anyone**.
4. Click **Deploy**.
5. Approve any authorization prompt the same way as step 2 above, if asked again.
6. Copy the **Web app URL**. It ends in `/exec`. This is your live API endpoint.

## 5. Wire the frontend to the backend

1. Open `index.html` in a text editor.
2. Find the line near the top of the `<script>` block:
   ```js
   const API_URL = "";
   ```
3. Paste your `/exec` URL between the quotes and save the file.

## 6. Put the site on GitHub Pages (no Git installed, using the website)

1. Go to [github.com/new](https://github.com/new) and create a new repository,
   for example named `afg-recruiting-hub`. Keep it Public (GitHub Pages on a
   free account needs a public repo, unless your account has Pages for
   private repos). Do not initialize it with a README, since you already have one.
2. On the new, empty repository page, click **uploading an existing file**.
3. Drag in the whole contents of this folder: `index.html`, the `apps-script`
   folder, the `seed` folder, the `scripts` folder, `SETUP.md`, `README.md`,
   and `.gitignore`. GitHub's uploader supports dragging a folder in modern
   browsers; if it does not accept folders directly, drag the files in one
   level at a time (open each subfolder in your file explorer and drag its
   contents into GitHub, which recreates the folder structure automatically).
4. Scroll down, add a commit message like "Initial site," and click
   **Commit changes**.
5. Go to the repository's **Settings > Pages**.
6. Under **Build and deployment > Source**, choose **Deploy from a branch**.
7. Under **Branch**, choose **main** and **/ (root)**, then **Save**.
8. Wait a minute or two, then refresh the Pages settings page. It will show
   your live link: `https://<your-username>.github.io/afg-recruiting-hub/`.

**If you update `Code.gs` later:** go back to Apps Script,
**Deploy > Manage deployments**, click the pencil (edit) icon on your
deployment, change **Version** to **New**, and click **Deploy**. Saving the
file in the editor is not enough to update the live `/exec` URL; this extra
step is required every time.

**If you update `index.html` later:** on GitHub, open the file, click the
pencil (edit) icon, paste in the new content, and commit. GitHub Pages
redeploys automatically within a minute or two.

## 7. Test on real phones

Open the GitHub Pages link on your own phone and, if possible, one other
group member's phone. Confirm: the drawer navigation opens from the ☰
button, checkboxes are easy to tap, nothing scrolls sideways, and checking
an item on the phone shows up when you refresh on a computer.

## 8. Share the link and team code with classmates

Send the group the GitHub Pages link and the `TEAM_CODE` you set in step 3
(not the admin passphrase, that one is yours only). Add each classmate as a
member first, under **Admin > 4. Members** on the site, so their name
appears in the "Who are you?" list when they open the link.

---

## Optional: installing Git and Node.js later

If you want the command-line workflow described in `SETUP.md` (editing
`seed/items.json` and running `node scripts/sync-seed.mjs` to keep the seed
data in sync, or using `git push` instead of the GitHub file uploader),
install:

- **Git for Windows**: [git-scm.com/download/win](https://git-scm.com/download/win)
- **Node.js** (LTS version): [nodejs.org](https://nodejs.org)

After installing, you can clone the GitHub repository you created in step 6
to this computer and work from a terminal instead of the website uploader.
