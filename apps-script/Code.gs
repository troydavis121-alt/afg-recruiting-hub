/**********************************************************************
 * AFG RECRUITING CAMPAIGN HUB: backend
 * ------------------------------------------------------------------
 * One Google Sheet is the data store. This script exposes it as a
 * tiny JSON API that the GitHub Pages site reads from and writes to.
 * Nobody edits the sheet by hand.
 *
 * ONE-TIME SETUP (see SETUP.md for click-by-click steps)
 *   1. Extensions > Apps Script, paste this file, Save.
 *   2. Run setup()  (authorize when prompted). This builds the tabs
 *      and seeds the source packet, milestones, and defaults.
 *   3. Script Properties (Project Settings, gear icon):
 *        TEAM_CODE:        group members enter this to check items off
 *        ADMIN_PASSPHRASE: the Marketing Director's admin passphrase
 *      (Kept out of this file on purpose so the source is shareable.)
 *   4. Deploy > New deployment > Web app
 *        Execute as: Me       Who has access: Anyone
 *      Copy the /exec URL and paste it into API_URL in index.html.
 *
 * SECURITY MODEL (honest version)
 *   - Reads are public (anyone with the link can GET the checklist).
 *   - Group writes (checking/unchecking items, notes) require TEAM_CODE,
 *     checked HERE on the server.
 *   - Admin writes (add/edit/delete items, members, links, brief, reset)
 *     require ADMIN_PASSPHRASE, also checked HERE on the server.
 *   - Neither code lives in the repo. Both travel in the POST body over
 *     HTTPS and are remembered only in the browser that entered them.
 *   - Status only: nothing AFG considers confidential should ever be
 *     pasted into this sheet or this site.
 *********************************************************************/

const SS = SpreadsheetApp.getActiveSpreadsheet();

const TABS = {
  categories: ['id', 'name', 'blurb', 'sort'],
  items: ['id', 'list', 'category', 'sort', 'title', 'detail', 'priority', 'feeds',
          'owner', 'due', 'done', 'doneBy', 'doneAt', 'note', 'updatedAt', 'updatedBy', 'archived'],
  members: ['name', 'role', 'workstream', 'active'],
  links: ['id', 'label', 'url', 'sort'],
  meta: ['key', 'value'],
  log: ['ts', 'actor', 'action', 'itemId', 'detail']
};

const META_WHITELIST = [
  'projectTitle', 'groupName', 'finalDueDate',
  'brief_client', 'brief_purpose', 'brief_audience', 'brief_geography', 'brief_duration',
  'brief_conversion', 'brief_destination', 'brief_platforms', 'brief_message',
  'gate_audience', 'gate_objective', 'gate_platforms', 'gate_cta'
];
const ITEM_UPDATABLE_FIELDS = ['list', 'category', 'sort', 'title', 'detail', 'priority', 'feeds', 'owner', 'due', 'note'];

/* SEED:START */
const SEED = {
  "version": 1,
  "categories": [
    { "id": "REC", "name": "Recruiting objective", "blurb": "The one opportunity we are recruiting for and what a qualified candidate looks like." },
    { "id": "EVP", "name": "Recruiting value proposition", "blurb": "Specific, supportable reasons a candidate would choose AFG." },
    { "id": "AUD", "name": "Audience insight and interviews", "blurb": "What AFG knows about successful hires, plus interview access." },
    { "id": "SOC", "name": "Social media baseline", "blurb": "Date-stamped performance data for every active AFG account." },
    { "id": "AST", "name": "Recruiting materials and assets", "blurb": "Existing content the group can use, and what to avoid." },
    { "id": "CMP", "name": "Brand voice and compliance", "blurb": "Tone, terminology, disclosures, and what compliance will not allow." },
    { "id": "RES", "name": "Resources and constraints", "blurb": "Budget, people, tools, and approval time for a realistic plan." },
    { "id": "FUN", "name": "Recruiting funnel baseline", "blurb": "Numbers from career page visit through interview." },
    { "id": "COM", "name": "Competitors", "blurb": "Firms competing with AFG for the same candidates." },
    { "id": "ADM", "name": "Approvals", "blurb": "Sign-offs needed before anything is shared or submitted." }
  ],
  "items": [
    { "id": "REC-01", "cat": "REC", "p": 1, "title": "The one role or opportunity AFG wants to recruit for", "feeds": "Parts 1, 3" },
    { "id": "REC-02", "cat": "REC", "p": 1, "title": "Hiring targets and how many candidates AFG could realistically consider in the campaign month", "feeds": "Parts 3, 9" },
    { "id": "REC-03", "cat": "REC", "p": 1, "title": "Geographic recruiting area and in-person, hybrid, or remote arrangement", "feeds": "Parts 1, 6" },
    { "id": "REC-04", "cat": "REC", "p": 1, "title": "Definition of a qualified candidate (experience, licensing, education, traits)", "feeds": "Parts 1, 3, 9" },
    { "id": "REC-05", "cat": "REC", "p": 1, "title": "Application and interview process, who responds to leads, and expected response time", "feeds": "Parts 3, 4, 7" },
    { "id": "REC-06", "cat": "REC", "p": 2, "title": "Common reasons applicants do not advance", "feeds": "Parts 1, 5" },
    { "id": "EVP-01", "cat": "EVP", "p": 1, "title": "Career value proposition deck (English and Spanish versions)", "feeds": "Parts 1, 3, 5, 7" },
    { "id": "EVP-02", "cat": "EVP", "p": 1, "title": "Summary of training, mentorship, and professional development", "feeds": "Parts 3, 7" },
    { "id": "EVP-03", "cat": "EVP", "p": 1, "title": "Leadership answer: why build a career at AFG instead of another firm?", "feeds": "Parts 3, 5" },
    { "id": "EVP-04", "cat": "EVP", "p": 2, "title": "Support resources for financial professionals (technology, marketing, administrative)", "feeds": "Part 7" },
    { "id": "EVP-05", "cat": "EVP", "p": 2, "title": "Proof points separated from aspirational messaging", "feeds": "Parts 5, 7" },
    { "id": "EVP-06", "cat": "EVP", "p": 2, "title": "Approved career stories from current team members", "feeds": "Part 7" },
    { "id": "AUD-01", "cat": "AUD", "p": 1, "title": "Anonymized profile of recent successful hires (prior careers, career stage, motivations)", "feeds": "Part 1" },
    { "id": "AUD-02", "cat": "AUD", "p": 1, "title": "Top questions and objections recruiters hear from candidates", "feeds": "Parts 1, 5, 7" },
    { "id": "AUD-03", "cat": "AUD", "p": 1, "title": "Interview scheduled: AFG leadership", "feeds": "Parts 1, 3" },
    { "id": "AUD-04", "cat": "AUD", "p": 1, "title": "Interview scheduled: recruiter or recruiting coordinator", "feeds": "Parts 1, 9" },
    { "id": "AUD-05", "cat": "AUD", "p": 1, "title": "Interviews scheduled: two recently hired financial professionals", "feeds": "Parts 1, 5" },
    { "id": "AUD-06", "cat": "AUD", "p": 2, "title": "Interview scheduled: one established financial professional", "feeds": "Parts 1, 7" },
    { "id": "AUD-07", "cat": "AUD", "p": 3, "title": "Interview (if possible): a candidate who considered AFG but did not move forward", "feeds": "Parts 1, 5" },
    { "id": "SOC-01", "cat": "SOC", "p": 1, "title": "Account inventory: every handle and link, with follower counts as of a stated date", "feeds": "Parts 2, 3" },
    { "id": "SOC-02", "cat": "SOC", "p": 1, "title": "Sprout Social export for the last 6 to 12 months (impressions, engagements, engagement rate, clicks)", "feeds": "Parts 2, 3, 9" },
    { "id": "SOC-03", "cat": "SOC", "p": 1, "title": "Top 10 and bottom 10 posts with metrics", "feeds": "Part 2" },
    { "id": "SOC-04", "cat": "SOC", "p": 1, "title": "Past recruiting posts tagged separately, with results", "feeds": "Part 2" },
    { "id": "SOC-05", "cat": "SOC", "p": 2, "title": "Content workflow: who creates, who approves, posting frequency, current calendar", "feeds": "Parts 2, 4, 8" },
    { "id": "SOC-06", "cat": "SOC", "p": 2, "title": "Business Casual podcast and YouTube stats, plus episodes featuring career stories", "feeds": "Parts 2, 7" },
    { "id": "SOC-07", "cat": "SOC", "p": 3, "title": "Process for responding to messages and comments", "feeds": "Parts 4, 9" },
    { "id": "SOC-08", "cat": "SOC", "p": 3, "title": "Past paid social results, if any", "feeds": "Parts 2, 4" },
    { "id": "AST-01", "cat": "AST", "p": 1, "title": "Career webpage link and interest form (afgfl.com/career)", "feeds": "Parts 7, 9" },
    { "id": "AST-02", "cat": "AST", "p": 1, "title": "Brand kit: logos, colors, fonts, Canva brand kit access", "feeds": "Parts 5, 7" },
    { "id": "AST-03", "cat": "AST", "p": 2, "title": "Job descriptions for the target role", "feeds": "Parts 1, 7" },
    { "id": "AST-04", "cat": "AST", "p": 2, "title": "Recruiting brochures, presentations, email copy, and FAQs", "feeds": "Part 7" },
    { "id": "AST-05", "cat": "AST", "p": 2, "title": "Approved testimonials", "feeds": "Part 7" },
    { "id": "AST-06", "cat": "AST", "p": 2, "title": "Office, team, and event photography and video", "feeds": "Part 7" },
    { "id": "AST-07", "cat": "AST", "p": 3, "title": "List of outdated materials the group should not use", "feeds": "Part 7" },
    { "id": "CMP-01", "cat": "CMP", "p": 1, "title": "Desired tone and preferred terminology (for example, \"financial professional\")", "feeds": "Part 5" },
    { "id": "CMP-02", "cat": "CMP", "p": 1, "title": "Words, phrases, and claims compliance does not permit", "feeds": "Parts 5, 7" },
    { "id": "CMP-03", "cat": "CMP", "p": 1, "title": "Required disclosures and rules for referencing affiliated firms", "feeds": "Parts 7, 8" },
    { "id": "CMP-04", "cat": "CMP", "p": 1, "title": "Guidance on testimonials and on compensation or income messaging", "feeds": "Part 7" },
    { "id": "CMP-05", "cat": "CMP", "p": 1, "title": "Who approves content and expected compliance review time", "feeds": "Parts 4, 8" },
    { "id": "RES-01", "cat": "RES", "p": 1, "title": "Campaign budget and paid social budget (a range is fine)", "feeds": "Part 4" },
    { "id": "RES-02", "cat": "RES", "p": 1, "title": "Staff who could participate and weekly hours available", "feeds": "Part 4" },
    { "id": "RES-03", "cat": "RES", "p": 1, "title": "Ability to edit the career page and create UTM tracking links", "feeds": "Parts 7, 9" },
    { "id": "RES-04", "cat": "RES", "p": 2, "title": "Production capacity and equipment (studio, cameras, editing, Canva, Adobe)", "feeds": "Parts 4, 7" },
    { "id": "RES-05", "cat": "RES", "p": 2, "title": "Sprout Social availability for scheduling and reporting", "feeds": "Parts 4, 8, 9" },
    { "id": "RES-06", "cat": "RES", "p": 2, "title": "Leadership approval turnaround time", "feeds": "Parts 4, 8" },
    { "id": "FUN-01", "cat": "FUN", "p": 1, "title": "Career page visits and form submissions per month", "feeds": "Parts 3, 9" },
    { "id": "FUN-02", "cat": "FUN", "p": 1, "title": "Inquiries, qualified candidates, initial interviews, and candidates advancing", "feeds": "Parts 3, 9" },
    { "id": "FUN-03", "cat": "FUN", "p": 2, "title": "Candidate source breakdown (referral, LinkedIn, job boards, events)", "feeds": "Parts 2, 6" },
    { "id": "FUN-04", "cat": "FUN", "p": 2, "title": "Average response time and inquiry-to-interview conversion", "feeds": "Part 9" },
    { "id": "FUN-05", "cat": "FUN", "p": 2, "title": "Note of which funnel numbers do not exist yet", "feeds": "Part 9" },
    { "id": "FUN-06", "cat": "FUN", "p": 3, "title": "Historical cost per applicant or lead, if paid advertising was used", "feeds": "Parts 4, 9" },
    { "id": "COM-01", "cat": "COM", "p": 1, "title": "Three to five firms competing with AFG for the same candidates", "feeds": "Part 2" },
    { "id": "COM-02", "cat": "COM", "p": 3, "title": "AFG's view of each competitor's recruiting pitch", "feeds": "Part 2" },
    { "id": "ADM-01", "cat": "ADM", "p": 1, "title": "Leadership sign-off on what AFG information can appear in a graded paper", "feeds": "All" },
    { "id": "ADM-02", "cat": "ADM", "p": 1, "title": "Dr. Eastman approves AFG as the client", "feeds": "All" },
    { "id": "ADM-03", "cat": "ADM", "p": 2, "title": "Permission to use employee names, photos, and quotes", "feeds": "Part 7" }
  ],
  "milestones": [
    { "id": "M-01", "week": "1", "title": "Kickoff meeting held: audience chosen, brief drafted, roles assigned, packet deadline set", "owner": "Whole group" },
    { "id": "M-02", "week": "1", "title": "Group information submitted (name, members, meeting time)", "owner": "Editor and operations lead" },
    { "id": "M-03", "week": "1", "title": "Requirements checklist built from the rubric", "owner": "Editor and operations lead" },
    { "id": "M-04", "week": "1", "title": "One-page campaign brief finalized", "owner": "Strategy lead" },
    { "id": "M-05", "week": "2", "title": "All Priority 1 source packet items delivered", "owner": "Marketing Director" },
    { "id": "M-06", "week": "2", "title": "Stakeholder interviews completed and notes shared", "owner": "Research lead" },
    { "id": "M-07", "week": "3", "title": "Part 1 persona drafted and approved", "owner": "Research lead" },
    { "id": "M-08", "week": "4", "title": "Part 2 AFG audit and competitor audit drafted", "owner": "Audit lead" },
    { "id": "M-09", "week": "5", "title": "Part 3 goals, SMART objectives, strategy, and tactics drafted", "owner": "Strategy lead" },
    { "id": "M-10", "week": "5", "title": "Section 4 resource plan validated against AFG capacity", "owner": "Marketing Director + one member" },
    { "id": "M-11", "week": "6", "title": "Sections 5 and 6 drafted; big idea and platforms locked", "owner": "Creative lead" },
    { "id": "M-12", "week": "8", "title": "Section 7 posts designed, captioned, and named", "owner": "Whole group" },
    { "id": "M-13", "week": "8", "title": "Section 8 calendar built; optional draft submitted", "owner": "Editor and operations lead" },
    { "id": "M-14", "week": "10", "title": "Section 9 measurement plan drafted", "owner": "Strategy lead" },
    { "id": "M-15", "week": "10", "title": "Introduction, conclusion, and APA references complete", "owner": "Editor and operations lead" },
    { "id": "M-16", "week": "11", "title": "Final rubric check, client fact-check, and proofread", "owner": "Whole group" },
    { "id": "M-17", "week": "11", "title": "Final paper and team peer evaluation submitted", "owner": "Whole group" }
  ],
  "meta": {
    "projectTitle": "AFG Recruiting Campaign Hub",
    "groupName": "",
    "finalDueDate": "2026-11-24",
    "brief_client": "Alliance Financial Group",
    "brief_purpose": "Recruiting",
    "brief_audience": "One clearly defined candidate segment (to be chosen at kickoff)",
    "brief_geography": "Southwest Florida, unless AFG recruits more broadly",
    "brief_duration": "One month, beginning after submission",
    "brief_conversion": "Recruiting inquiry, career form submission, or scheduled introductory conversation",
    "brief_destination": "afgfl.com/career",
    "brief_platforms": "LinkedIn primary; Instagram and Facebook if research justifies",
    "brief_message": "AFG offers the support, development, culture, and opportunity the chosen candidate values",
    "gate_audience": false,
    "gate_objective": false,
    "gate_platforms": false,
    "gate_cta": false,
    "seedVersion": 1
  },
  "members": [
    { "name": "Marketing Director", "role": "Client liaison", "workstream": "AFG source packet", "active": true }
  ],
  "links": [
    { "id": "career", "label": "AFG career page", "url": "https://www.afgfl.com/career", "sort": 1 },
    { "id": "folder", "label": "Shared folder", "url": "", "sort": 2 },
    { "id": "rubric", "label": "Rubric", "url": "", "sort": 3 },
    { "id": "kickoffplan", "label": "Kickoff plan (Word)", "url": "", "sort": 4 },
    { "id": "schedule", "label": "Schedule of Topics", "url": "", "sort": 5 }
  ],
  "teamWorkstreams": [
    { "workstream": "AFG source packet", "owner": "Marketing Director" },
    { "workstream": "Persona and audience research", "owner": "Research lead" },
    { "workstream": "AFG and competitor audit", "owner": "Audit lead" },
    { "workstream": "Strategy, objectives, measurement", "owner": "Strategy lead" },
    { "workstream": "Content development", "owner": "Creative lead with whole group" },
    { "workstream": "Resources and implementation", "owner": "Marketing Director + one member" },
    { "workstream": "Calendar, APA, final edit", "owner": "Editor and operations lead" },
    { "workstream": "Quality review", "owner": "Whole group" }
  ],
  "kickoffAgenda": {
    "blocks": [
      { "time": "0 to 10 min", "desc": "Review the rubric and requirements" },
      { "time": "10 to 20 min", "desc": "Confirm the client, purpose, and boundaries" },
      { "time": "20 to 35 min", "desc": "Choose one audience" },
      { "time": "35 to 45 min", "desc": "Walk the source packet and flag gaps" },
      { "time": "45 to 55 min", "desc": "Assign owners and deadlines" },
      { "time": "55 to 60 min", "desc": "Confirm the next meeting" }
    ],
    "outputs": [
      "The approved target market",
      "A one-page campaign brief",
      "Assigned responsibilities",
      "A source packet deadline"
    ]
  }
};
/* SEED:END */

/* ============================ ROUTING ============================ */

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'getAll';
  if (action === 'ping') return json_({ ok: true, serverTime: new Date().toISOString() });
  if (action === 'getAll') return json_({ ok: true, data: getAll_() });
  return json_({ ok: false, error: 'unknown action' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return json_({ ok: false, error: 'Server busy, try again' });
  try {
    const b = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = b.action;

    if (action === 'verifyCode') return json_(verifyCode_(b));

    const teamActions = { setDone: setDone_, setNote: setNote_, batch: batch_ };
    if (teamActions[action]) {
      if (!checkTeam_(b.code)) return json_({ ok: false, error: 'Wrong team code' });
      return json_(teamActions[action](b));
    }

    const adminActions = {
      addItem: addItem_, updateItem: updateItem_, deleteItem: deleteItem_, restoreItem: restoreItem_,
      upsertMember: upsertMember_, removeMember: removeMember_,
      upsertLink: upsertLink_, removeLink: removeLink_,
      setMeta: setMeta_, resetChecks: resetChecks_
    };
    if (adminActions[action]) {
      if (!checkAdmin_(b.pass)) return json_({ ok: false, error: 'Wrong admin passphrase' });
      return json_(adminActions[action](b));
    }

    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ============================ READ ============================== */

function getAll_() {
  return {
    meta: metaObj_(),
    categories: rows_('categories').sort((a, b) => Number(a.sort) - Number(b.sort)),
    members: rows_('members'),
    links: rows_('links').sort((a, b) => Number(a.sort) - Number(b.sort)),
    items: rows_('items').map(normalizeItem_),
    log: rows_('log').slice(-30).reverse(),
    serverTime: new Date().toISOString()
  };
}

function metaObj_() {
  const o = {};
  rows_('meta').forEach(r => { o[r.key] = r.value; });
  return o;
}

function normalizeItem_(r) {
  return {
    id: r.id, list: r.list, category: r.category, sort: Number(r.sort) || 0,
    title: r.title, detail: r.detail || '',
    priority: (r.priority === '' || r.priority === null || r.priority === undefined) ? null : Number(r.priority),
    feeds: r.feeds || '', owner: r.owner || '', due: r.due || '',
    done: isTrue_(r.done), doneBy: r.doneBy || '', doneAt: r.doneAt || '',
    note: r.note || '', updatedAt: r.updatedAt || '', updatedBy: r.updatedBy || '',
    archived: isTrue_(r.archived)
  };
}

/* ========================= TEAM WRITES =========================== */

function verifyCode_(b) {
  const stored = PropertiesService.getScriptProperties().getProperty('TEAM_CODE');
  if (!stored) return { ok: false, error: 'TEAM_CODE is not set up yet. Ask the admin to set it in Script Properties.' };
  return { ok: true, data: { valid: String(b.code) === stored } };
}

function setDone_(b) { return applySetDone_(b.id, b.done, b.by); }

function applySetDone_(id, done, by) {
  const now = new Date().toISOString();
  const actor = sanitizeStr_(by, 100);
  const fields = { done: !!done, updatedAt: now, updatedBy: actor };
  if (done) { fields.doneBy = actor; fields.doneAt = now; }
  else { fields.doneBy = ''; fields.doneAt = ''; }
  const updated = updateRowByKey_('items', 'id', id, fields);
  if (!updated) return { ok: false, error: 'Item not found: ' + id };
  appendLog_(actor, done ? 'checked' : 'unchecked', id, updated.title);
  return { ok: true, data: normalizeItem_(updated) };
}

function setNote_(b) { return applySetNote_(b.id, b.note, b.by); }

function applySetNote_(id, note, by) {
  const now = new Date().toISOString();
  const actor = sanitizeStr_(by, 100);
  const fields = { note: sanitizeStr_(note, 1000), updatedAt: now, updatedBy: actor };
  const updated = updateRowByKey_('items', 'id', id, fields);
  if (!updated) return { ok: false, error: 'Item not found: ' + id };
  appendLog_(actor, 'noted', id, updated.title);
  return { ok: true, data: normalizeItem_(updated) };
}

function batch_(b) {
  const results = [];
  (b.ops || []).forEach(op => {
    if (op.action === 'setDone') results.push(applySetDone_(op.id, op.done, b.by));
    else if (op.action === 'setNote') results.push(applySetNote_(op.id, op.note, b.by));
  });
  return { ok: true, data: results.filter(r => r.ok).map(r => r.data) };
}

/* ========================= ADMIN WRITES =========================== */

function addItem_(b) {
  const it = b.item || {};
  const list = it.list === 'milestone' ? 'milestone' : 'packet';
  const title = sanitizeStr_(it.title, 200);
  if (!title) return { ok: false, error: 'Title required' };

  let id, category = '';
  if (list === 'milestone') {
    id = nextId_('M-', r => r.list === 'milestone');
  } else {
    category = String(it.category || '').toUpperCase().trim();
    if (!category || !rows_('categories').some(c => c.id === category))
      return { ok: false, error: 'Valid category required' };
    id = nextId_(category + '-', r => r.list === 'packet' && r.category === category);
  }

  const now = new Date().toISOString();
  const row = {
    id, list, category, sort: Number(it.sort) || 999,
    title, detail: sanitizeStr_(it.detail, 1000),
    priority: list === 'packet' ? (Number(it.priority) || 3) : '',
    feeds: sanitizeStr_(it.feeds, 200), owner: sanitizeStr_(it.owner, 100), due: sanitizeStr_(it.due, 50),
    done: false, doneBy: '', doneAt: '', note: '',
    updatedAt: now, updatedBy: 'Admin', archived: false
  };
  tab_('items').appendRow(objToRow_('items', row));
  appendLog_('Admin', 'added', id, title);
  return { ok: true, data: normalizeItem_(row) };
}

function updateItem_(b) {
  const fields = {};
  Object.keys(b.fields || {}).forEach(k => {
    if (ITEM_UPDATABLE_FIELDS.indexOf(k) === -1) return;
    let v = b.fields[k];
    if (k === 'title') v = sanitizeStr_(v, 200);
    else if (k === 'detail' || k === 'note') v = sanitizeStr_(v, 1000);
    else if (k === 'feeds') v = sanitizeStr_(v, 200);
    else v = sanitizeStr_(v, 100);
    fields[k] = v;
  });
  fields.updatedAt = new Date().toISOString();
  fields.updatedBy = 'Admin';
  const updated = updateRowByKey_('items', 'id', b.id, fields);
  if (!updated) return { ok: false, error: 'Item not found: ' + b.id };
  appendLog_('Admin', 'edited', b.id, updated.title);
  return { ok: true, data: normalizeItem_(updated) };
}

function deleteItem_(b) {
  const updated = updateRowByKey_('items', 'id', b.id, { archived: true, updatedAt: new Date().toISOString(), updatedBy: 'Admin' });
  if (!updated) return { ok: false, error: 'Item not found: ' + b.id };
  appendLog_('Admin', 'archived', b.id, updated.title);
  return { ok: true, data: normalizeItem_(updated) };
}

function restoreItem_(b) {
  const updated = updateRowByKey_('items', 'id', b.id, { archived: false, updatedAt: new Date().toISOString(), updatedBy: 'Admin' });
  if (!updated) return { ok: false, error: 'Item not found: ' + b.id };
  appendLog_('Admin', 'restored', b.id, updated.title);
  return { ok: true, data: normalizeItem_(updated) };
}

function upsertMember_(b) {
  const m = b.member || {};
  const name = sanitizeStr_(m.name, 100);
  if (!name) return { ok: false, error: 'Name required' };
  const fields = { role: sanitizeStr_(m.role, 100), workstream: sanitizeStr_(m.workstream, 150), active: m.active !== false };
  const existing = findRow_('members', 'name', name);
  if (existing) updateRowByKey_('members', 'name', name, fields);
  else tab_('members').appendRow(objToRow_('members', Object.assign({ name }, fields)));
  appendLog_('Admin', 'member saved', name, '');
  return { ok: true, data: Object.assign({ name }, fields) };
}

function removeMember_(b) {
  const name = String(b.name || '');
  const found = findRow_('members', 'name', name);
  if (!found) return { ok: false, error: 'Member not found' };
  found.sheet.deleteRow(found.rowIndex);
  appendLog_('Admin', 'member removed', name, '');
  return { ok: true };
}

function upsertLink_(b) {
  const l = b.link || {};
  const id = String(l.id || '').trim() || ('lnk' + Utilities.getUuid().slice(0, 8));
  const url = String(l.url || '').trim();
  if (url && !isHttpUrl_(url)) return { ok: false, error: 'Links must use http or https' };
  const fields = { label: sanitizeStr_(l.label, 200), url: sanitizeStr_(url, 500), sort: Number(l.sort) || 999 };
  const existing = findRow_('links', 'id', id);
  if (existing) updateRowByKey_('links', 'id', id, fields);
  else tab_('links').appendRow(objToRow_('links', Object.assign({ id }, fields)));
  appendLog_('Admin', 'link saved', id, fields.label);
  return { ok: true, data: Object.assign({ id }, fields) };
}

function removeLink_(b) {
  const id = String(b.id || '');
  const found = findRow_('links', 'id', id);
  if (!found) return { ok: false, error: 'Link not found' };
  found.sheet.deleteRow(found.rowIndex);
  appendLog_('Admin', 'link removed', id, '');
  return { ok: true };
}

function setMeta_(b) {
  if (META_WHITELIST.indexOf(b.key) === -1) return { ok: false, error: 'That field cannot be edited here' };
  const isGate = String(b.key).indexOf('gate_') === 0;
  const v = isGate ? !!b.value : sanitizeStr_(b.value, 500);
  const existing = findRow_('meta', 'key', b.key);
  if (existing) updateRowByKey_('meta', 'key', b.key, { value: v });
  else tab_('meta').appendRow([b.key, v]);
  appendLog_('Admin', 'meta updated', b.key, '');
  return { ok: true, data: { key: b.key, value: v } };
}

function resetChecks_(b) {
  if (b.confirm !== 'RESET') return { ok: false, error: 'Type RESET to confirm' };
  const list = b.list === 'milestone' ? 'milestone' : 'packet';
  const sh = tab_('items'), head = TABS.items;
  const vals = sh.getDataRange().getValues();
  const c = {
    list: head.indexOf('list'), done: head.indexOf('done'), doneBy: head.indexOf('doneBy'),
    doneAt: head.indexOf('doneAt'), updatedAt: head.indexOf('updatedAt'), updatedBy: head.indexOf('updatedBy')
  };
  const now = new Date().toISOString();
  let changed = 0;
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][c.list] === list && isTrue_(vals[i][c.done])) {
      vals[i][c.done] = false; vals[i][c.doneBy] = ''; vals[i][c.doneAt] = '';
      vals[i][c.updatedAt] = now; vals[i][c.updatedBy] = 'Admin';
      changed++;
    }
  }
  if (changed) sh.getRange(1, 1, vals.length, head.length).setValues(vals);
  appendLog_('Admin', 'reset checks', list, changed + ' item(s)');
  return { ok: true, data: { changed } };
}

/* =========================== HELPERS =========================== */

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function tab_(name) {
  let sh = SS.getSheetByName(name);
  if (!sh) { sh = SS.insertSheet(name); sh.appendRow(TABS[name]); }
  return sh;
}

function rows_(name) {
  const sh = tab_(name);
  const vals = sh.getDataRange().getValues();
  const head = vals.shift();
  return vals.filter(r => r.join('') !== '').map(r => rowArrToObj_(head, r));
}

function rowArrToObj_(head, r) {
  const o = {};
  head.forEach((h, i) => { o[h] = r[i]; });
  return o;
}

function objToRow_(tabName, obj) {
  return TABS[tabName].map(h => (obj[h] !== undefined ? obj[h] : ''));
}

function findRow_(tabName, keyCol, keyVal) {
  const sh = tab_(tabName), head = TABS[tabName];
  const vals = sh.getDataRange().getValues();
  const ci = head.indexOf(keyCol);
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][ci]) === String(keyVal)) return { sheet: sh, head, rowIndex: i + 1, row: vals[i] };
  }
  return null;
}

// writes one row with a single setValues call, looked up by key (never by row index)
function updateRowByKey_(tabName, keyCol, keyVal, fieldsObj) {
  const found = findRow_(tabName, keyCol, keyVal);
  if (!found) return null;
  const row = found.row.slice();
  Object.keys(fieldsObj).forEach(k => {
    const ci = found.head.indexOf(k);
    if (ci >= 0) row[ci] = fieldsObj[k];
  });
  found.sheet.getRange(found.rowIndex, 1, 1, found.head.length).setValues([row]);
  return rowArrToObj_(found.head, row);
}

function nextId_(prefix, filterFn) {
  let max = 0;
  rows_('items').filter(filterFn).forEach(r => {
    if (String(r.id).indexOf(prefix) === 0) {
      const n = parseInt(String(r.id).slice(prefix.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  });
  return prefix + String(max + 1).padStart(2, '0');
}

function appendLog_(actor, action, itemId, detail) {
  tab_('log').appendRow([new Date().toISOString(), sanitizeStr_(actor, 100), sanitizeStr_(action, 100), String(itemId || ''), sanitizeStr_(detail, 300)]);
}

function isTrue_(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }

// caps length and neutralizes spreadsheet formula injection (=, +, -, @, tab)
function sanitizeStr_(s, maxLen) {
  s = (s === null || s === undefined) ? '' : String(s);
  if (maxLen) s = s.slice(0, maxLen);
  if (/^[=+\-@\t]/.test(s)) s = "'" + s;
  return s;
}

function isHttpUrl_(u) { return /^https?:\/\//i.test(String(u)); }

function checkTeam_(code) {
  const stored = PropertiesService.getScriptProperties().getProperty('TEAM_CODE');
  return !!stored && !!code && String(code) === stored;
}

function checkAdmin_(pass) {
  const stored = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSPHRASE');
  return !!stored && !!pass && String(pass) === stored;
}

/* ============================ SETUP ============================ */
// Run once from the editor (function dropdown -> setup -> Run). Safe to
// run again after pasting a newer SEED: it creates missing tabs, adds any
// new categories/items/links/meta keys, and never touches existing done
// states, notes, or admin edits.

function setup() {
  Object.keys(TABS).forEach(t => { const sh = tab_(t); if (sh.getLastRow() === 0) sh.appendRow(TABS[t]); });

  const existingItems = rows_('items');
  const existingSeedVersion = Number(metaObj_().seedVersion) || 0;
  if (existingItems.length > 0 && existingSeedVersion >= SEED.meta.seedVersion) return;

  // categories: reference data, safe to keep in sync
  SEED.categories.forEach((c, i) => {
    const fields = { name: c.name, blurb: c.blurb, sort: i + 1 };
    if (findRow_('categories', 'id', c.id)) updateRowByKey_('categories', 'id', c.id, fields);
    else tab_('categories').appendRow(objToRow_('categories', Object.assign({ id: c.id }, fields)));
  });

  // items + milestones: add only what's missing, never touch existing rows
  const existingIds = new Set(existingItems.map(r => r.id));
  const now = new Date().toISOString();
  SEED.items.forEach((it, i) => {
    if (existingIds.has(it.id)) return;
    tab_('items').appendRow(objToRow_('items', {
      id: it.id, list: 'packet', category: it.cat, sort: i + 1, title: it.title, detail: '',
      priority: it.p, feeds: it.feeds, owner: 'Marketing Director', due: '', done: false,
      doneBy: '', doneAt: '', note: '', updatedAt: now, updatedBy: 'Setup', archived: false
    }));
  });
  SEED.milestones.forEach((m, i) => {
    if (existingIds.has(m.id)) return;
    tab_('items').appendRow(objToRow_('items', {
      id: m.id, list: 'milestone', category: '', sort: i + 1, title: m.title, detail: '',
      priority: '', feeds: '', owner: m.owner, due: m.week, done: false,
      doneBy: '', doneAt: '', note: '', updatedAt: now, updatedBy: 'Setup', archived: false
    }));
  });

  // members: only seed the placeholder if the tab is genuinely empty
  if (rows_('members').length === 0) {
    SEED.members.forEach(m => tab_('members').appendRow(objToRow_('members', m)));
  }

  // links: add only missing ones, so an admin-filled URL is never overwritten
  const existingLinkIds = new Set(rows_('links').map(r => r.id));
  SEED.links.forEach(l => { if (!existingLinkIds.has(l.id)) tab_('links').appendRow(objToRow_('links', l)); });

  // meta: set only keys that aren't already present, so admin edits survive a re-run
  const existingMetaKeys = new Set(rows_('meta').map(r => r.key));
  Object.keys(SEED.meta).forEach(k => {
    if (k === 'seedVersion' || existingMetaKeys.has(k)) return;
    tab_('meta').appendRow([k, SEED.meta[k]]);
  });
  if (findRow_('meta', 'key', 'seedVersion')) updateRowByKey_('meta', 'key', 'seedVersion', { value: SEED.meta.seedVersion });
  else tab_('meta').appendRow(['seedVersion', SEED.meta.seedVersion]);
}
