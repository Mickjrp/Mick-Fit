/* storage.js — Saving/loading (localStorage), app state, and per-session logging data. */
"use strict";

/* ================= Storage ================= */
const K = {
  prog: "gtl.program.v1",
  sess: "gtl.sessions.v1",
  bw: "gtl.bw.v1",
  set: "gtl.settings.v1",
  timer: "gtl.timer.v1",
  seed: "gtl.seeded.v1",
  bp: "gtl.blueprints.v1",
  p1: "gtl.phase1-reset.v1",
};
let storageOK = true;
function lsGet(k) {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    storageOK = false;
    return null;
  }
}
function lsSet(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch (e) {
    storageOK = false;
    updateBanner();
    return false;
  }
}
function lsDel(k) {
  try {
    localStorage.removeItem(k);
  } catch (e) {}
}

function normalizeProgram(p) {
  if (!p || typeof p !== "object") p = {};
  if (!p.ex || typeof p.ex !== "object") p.ex = {};
  Object.keys(p.ex).forEach((id) => {
    const e = Object.assign(L(id, id), p.ex[id] || {}, { id });
    const m = e.muscles || {};
    e.muscles = {
      p: (Array.isArray(m.p) ? m.p : []).filter((x) => MUS[x]),
      s: (Array.isArray(m.s) ? m.s : []).filter((x) => MUS[x]),
    };
    if (!TYPES.some((t) => t[0] === e.type)) e.type = "load";
    ["startKg", "startReps"].forEach((k) => {
      if (!Array.isArray(e[k])) e[k] = [];
    });
    e.max = !!e.max;
    e.side = !!e.side;
    p.ex[id] = e;
  });
  if (!p.days || typeof p.days !== "object") p.days = {};
  // Sections: one ordered list shared by every day. Older saves had a fixed list.
  let secs = Array.isArray(p.secs)
    ? p.secs
        .filter((s) => s && s.id)
        .map((s) => ({ id: String(s.id), name: String(s.name || s.id) }))
    : [];
  if (!secs.length) secs = clone(LEGACY_SECS);
  ORDER.forEach((dk) => {
    const d = p.days[dk];
    if (d && d.sections && typeof d.sections === "object")
      Object.keys(d.sections).forEach((k) => {
        if (!secs.some((s) => s.id === k)) secs.push({ id: k, name: k });
      });
  });
  p.secs = secs;
  ORDER.forEach((dk) => {
    const d = p.days[dk] || R("Rest", "", []);
    const src = d.sections || {};
    const sections = {};
    secs.forEach(({ id }) => {
      sections[id] = (Array.isArray(src[id]) ? src[id] : [])
        .filter((x) => x && p.ex[x.ex])
        .map((x) => ({ ex: x.ex, tag: x.tag || "" }));
    });
    p.days[dk] = {
      name: String(d.name || ""),
      focus: String(d.focus || ""),
      rest: !!d.rest,
      restNotes: Array.isArray(d.restNotes) ? d.restNotes.map(String) : [],
      sections,
    };
  });
  // Program name + which blueprint it came from (v1.4 saves had neither)
  p.title = String(
    p.title || (secs.some((s) => s.id === "breathing") ? PHASE1.title : "โปรแกรมของฉัน"),
  );
  // older saves aren't linked to a blueprint until one is applied or saved
  p.bpId = String(p.bpId || "");
  p.v = 2;
  return p;
}
// Section helpers (program.secs = [{ id, name }], in display order)
const secList = () => program.secs;
const secName = (sk) => (program.secs.find((s) => s.id === sk) || { name: sk }).name;
const dayItems = (d) => program.secs.reduce((n, s) => n + d.sections[s.id].length, 0);
let program = lsGet(K.prog);
program = normalizeProgram(program && program.ex && program.days ? program : defaultProgram());
let sessions = lsGet(K.sess) || {};
let bw = lsGet(K.bw) || {};
let settings = Object.assign(
  { restC: 150, restI: 90, stepC: 2.5, stepI: 1, autoRest: true, sound: true, wake: false },
  lsGet(K.set) || {},
);
if (!lsGet(K.seed)) {
  if (!Object.keys(bw).length) bw["2026-11-02"] = { date: "2026-11-02", kg: 53 };
  lsSet(K.bw, bw);
  lsSet(K.prog, program);
  lsSet(K.seed, true);
}
try {
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
} catch (e) {}

/* ---------- Blueprints: saved weekly programs ---------- */
// { id, name, savedAt, program: { secs, days, ex } } — ex holds only the exercises the days use
function snapshotProgram(pr) {
  const used = new Set();
  ORDER.forEach((dk) =>
    pr.secs.forEach(({ id }) => pr.days[dk].sections[id].forEach((x) => used.add(x.ex))),
  );
  const ex = {};
  used.forEach((id) => {
    if (pr.ex[id]) ex[id] = pr.ex[id];
  });
  return clone({ secs: pr.secs, days: pr.days, ex });
}
function makeBlueprint(id, name, pr) {
  return { id, name, savedAt: new Date().toISOString(), program: snapshotProgram(pr) };
}
let blueprints = lsGet(K.bp);
if (!Array.isArray(blueprints)) {
  blueprints = [makeBlueprint(PHASE1.id, PHASE1.title, normalizeProgram(defaultProgram()))];
  lsSet(K.bp, blueprints);
}
/* Mick Fit v2.1: Phase 1 · Build Capacity replaces the old program and old templates (once per device).
   A copy of what was there before is kept in gtl.pre-phase1.v1, just in case.
   Exercises from the old program stay in the library so past logs keep their names. */
if (!lsGet(K.p1)) {
  if (lsGet(K.prog)) lsSet("gtl.pre-phase1.v1", { at: new Date().toISOString(), program, blueprints });
  const fresh = defaultProgram();
  fresh.ex = Object.assign({}, program.ex, fresh.ex);
  program = normalizeProgram(fresh);
  blueprints = [makeBlueprint(PHASE1.id, PHASE1.title, program)];
  lsSet(K.prog, program);
  lsSet(K.bp, blueprints);
  lsSet(K.p1, true);
}
const saveBlueprints = () => lsSet(K.bp, blueprints);
const bpById = (id) => blueprints.find((b) => b.id === id);
// JSON with sorted keys, so key order never counts as a change
function stableStr(o) {
  if (Array.isArray(o)) return `[${o.map(stableStr).join(",")}]`;
  if (o && typeof o === "object")
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStr(o[k])}`)
      .join(",")}}`;
  return JSON.stringify(o);
}
// true when the active program has changes that aren't saved to its blueprint
function programDirty() {
  const b = bpById(program.bpId);
  return !b || stableStr(snapshotProgram(program)) !== stableStr(b.program);
}

let progT = null;
function saveProgram() {
  clearTimeout(progT);
  progT = setTimeout(() => lsSet(K.prog, program), 250);
}
function saveProgramNow() {
  clearTimeout(progT);
  lsSet(K.prog, program);
}
function saveSettings() {
  lsSet(K.set, settings);
}

/* ================= State ================= */
const state = {
  view: "workout",
  day: DAYS[new Date().getDay()],
  date: todayISO(),
  edit: false,
  mapMode: "plan",
  weekMode: "plan",
  sel: null,
  weekSel: null,
  extra: {},
  bwDirty: false,
  bwAll: false, // body page: show every weight entry, not just the latest 12
  toasted: {},
};
const curKey = () => `${state.date}_${state.day}`;

/* ================= Session data ================= */
function setHas(s) {
  return !!s && (!!s.done || num(s.kg) != null || num(s.reps) != null || num(s.sec) != null);
}
function hasData(e) {
  if (!e) return false;
  if (e.done) return true;
  if (num(e.min) != null || num(e.hr) != null) return true;
  return Array.isArray(e.sets) && e.sets.some(setHas);
}
function cleanEntry(e) {
  const out = {};
  if (e.done) out.done = true;
  if (num(e.min) != null) out.min = num(e.min);
  if (num(e.hr) != null) out.hr = num(e.hr);
  if (Array.isArray(e.sets)) {
    const sets = e.sets.map((s) => {
      const o = {};
      if (s) {
        ["kg", "reps", "sec"].forEach((k) => {
          if (num(s[k]) != null) o[k] = num(s[k]);
        });
        if (s.done) o.done = true;
      }
      return o;
    });
    while (sets.length && !Object.keys(sets[sets.length - 1]).length) sets.pop();
    if (sets.length) out.sets = sets;
  }
  return out;
}
function entry(exId, create) {
  const k = curKey();
  let s = sessions[k];
  if (!s) {
    if (!create) return null;
    s = sessions[k] = { date: state.date, day: state.day, entries: {}, updatedAt: null };
  }
  let e = s.entries[exId];
  if (!e && create) e = s.entries[exId] = {};
  return e || null;
}
let sessT = null;
function touch() {
  const s = sessions[curKey()];
  if (s) s.updatedAt = new Date().toISOString();
  clearTimeout(sessT);
  sessT = setTimeout(persistSessions, 350);
}
function persistSessions() {
  clearTimeout(sessT);
  sessT = null;
  Object.keys(sessions).forEach((k) => {
    const s = sessions[k];
    if (!s || !s.entries) {
      delete sessions[k];
      return;
    }
    const en = {};
    Object.keys(s.entries).forEach((id) => {
      const c = cleanEntry(s.entries[id] || {});
      if (hasData(c)) en[id] = c;
    });
    if (!Object.keys(en).length) delete sessions[k];
    else s.entries = en;
  });
  lsSet(K.sess, sessions);
}
function sortedSessions() {
  return Object.keys(sessions)
    .map((k) => ({ k, v: sessions[k] }))
    .filter((x) => x.v && x.v.date)
    .sort(
      (a, b) =>
        b.v.date.localeCompare(a.v.date) ||
        String(b.v.updatedAt || "").localeCompare(String(a.v.updatedAt || "")),
    );
}
function priorEntries(id, n) {
  const out = [],
    ck = curKey();
  for (const s of sortedSessions()) {
    if (s.k === ck || s.v.date > state.date) continue;
    const e = s.v.entries && s.v.entries[id];
    if (hasData(e)) {
      out.push({ date: s.v.date, e });
      if (out.length >= n) break;
    }
  }
  return out;
}
function summarize(ex, e) {
  if (!e) return "";
  if (ex.type === "cardio") {
    const p = [];
    if (num(e.min) != null) p.push(`${fmt(num(e.min))} min`);
    if (num(e.hr) != null) p.push(`HR ${fmt(num(e.hr))}`);
    return p.join(" · ");
  }
  if (ex.type === "check") return e.done ? "✓" : "";
  return (e.sets || [])
    .filter((s) => s && (num(s.kg) != null || num(s.reps) != null || num(s.sec) != null))
    .map((s) => {
      if (ex.type === "hold") return `${fmt(num(s.sec))}s`;
      const r = num(s.reps) != null ? fmt(num(s.reps)) : "–";
      if (ex.type === "reps") return r;
      if (ex.type === "bw") return num(s.kg) ? `+${fmt(num(s.kg))}×${r}` : r;
      return `${num(s.kg) != null ? fmt(num(s.kg)) : "–"}×${r}`;
    })
    .join(" · ");
}
