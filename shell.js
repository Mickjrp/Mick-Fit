/* shell.js — Mick Fit: 5-tab navigation over the two apps, shared data, one Backup / Restore. */
'use strict';
const VERSION = '2.2.0';

/* ---------- storage keys (both apps share this origin's localStorage) ---------- */
const MEAL_KEY = 'mick-mealprep-v1';               // meal app: { settings, over, preps, pantry, days, body }
const TRAIN = {                                     // training app (train/js/storage.js → K)
  prog: 'gtl.program.v1', sess: 'gtl.sessions.v1', bw: 'gtl.bw.v1', set: 'gtl.settings.v1',
  timer: 'gtl.timer.v1', seed: 'gtl.seeded.v1', bp: 'gtl.blueprints.v1'
};
const NAV_KEY = 'mickfit.nav.v1', MIGRATED_KEY = 'mickfit.migrated.v1';
const isAppKey = k => k === MEAL_KEY || k.startsWith('gtl.') || k.startsWith('mickfit.');

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function readJSON(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
function writeJSON(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

/* ---------- tabs → which app (frame) and which view (#hash) ---------- */
const ICON = {
  today: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M8.5 13.5l2.5 2.5 4.5-5"/>',
  plan: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2.5v3M16 2.5v3M7 13h3M7 17h3M14 13h3M14 17h3"/>',
  menu: '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z"/><path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19v3H7.5"/><path d="M9 7.5h6"/>',
  stock: '<path d="M3.5 10h17l-1.8 9.2a1.5 1.5 0 0 1-1.5 1.3H6.8a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M8 10l4-6 4 6M9.5 14v3M14.5 14v3"/>',
  me: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c1.4-3.8 4.2-5.8 7.5-5.8s6.1 2 7.5 5.8"/>'
};
const TABS = [
  { k: 'today', label: 'วันนี้', segs: [{ k: 'train', label: 'ซ้อม', f: 'train', h: 'workout' }, { k: 'food', label: 'อาหาร', f: 'meal', h: 'today' }] },
  { k: 'plan', label: 'แผน', segs: [{ k: 'train', label: 'ตารางซ้อม', f: 'train', h: 'week' }, { k: 'food', label: 'แผนอาหาร', f: 'meal', h: 'plan' }] },
  { k: 'menu', label: 'เมนู', segs: [{ k: 'menu', f: 'meal', h: 'menu' }] },
  { k: 'stock', label: 'คลัง', segs: [{ k: 'stock', f: 'meal', h: 'stock' }] },
  { k: 'me', label: 'ฉัน', segs: [{ k: 'bw', label: 'น้ำหนัก', f: 'train', h: 'body' }, { k: 'tset', label: 'ตั้งค่าซ้อม', f: 'train', h: 'settings' }, { k: 'mset', label: 'ตั้งค่าอาหาร', f: 'meal', h: 'config' }, { k: 'data', label: 'ข้อมูล', f: 'data' }] }
];
// meal app changes its own view sometimes (e.g. a "ไปที่คลัง" button): keep the tab bar in step
const MEAL_HASH_TO_TAB = { today: ['today', 'food'], plan: ['plan', 'food'], prep: ['plan', 'food'], menu: ['menu', 'menu'], stock: ['stock', 'stock'], config: ['me', 'mset'] };

const nav = Object.assign({ tab: 'today', seg: { today: 'train', plan: 'train', me: 'bw' } }, readJSON(NAV_KEY) || {});
const tabOf = k => TABS.find(t => t.k === k) || TABS[0];
const segOf = t => t.segs.find(s => s.k === nav.seg[t.k]) || t.segs[0];
const frames = { train: $('#f-train'), meal: $('#f-meal') };

function go(tabKey, segKey) {
  const t = tabOf(tabKey);
  nav.tab = t.k;
  if (segKey) nav.seg[t.k] = segKey;
  try { writeJSON(NAV_KEY, nav); } catch (e) {}
  render();
}
function render() {
  const t = tabOf(nav.tab), s = segOf(t);
  $('#tab-row').innerHTML = TABS.map(x => `<button class="tab" data-tab="${x.k}" ${x.k === t.k ? 'aria-current="page"' : ''}><svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICON[x.k]}</svg>${x.label}${x.k === 'stock' && shopCount() ? `<span class="badge">${shopCount()}</span>` : ''}</button>`).join('');
  $('#seg-bar').hidden = t.segs.length < 2;
  $('#seg').innerHTML = t.segs.length < 2 ? '' : t.segs.map(x => `<button data-seg="${x.k}" aria-pressed="${x.k === s.k}">${x.label}</button>`).join('');
  Object.entries(frames).forEach(([k, f]) => f.classList.toggle('off', k !== s.f));
  $('#p-data').hidden = s.f !== 'data';
  if (s.f === 'data') renderData();
  else showIn(s.f, s.h);
}
// switch the app inside a frame to a view; replace() keeps the frame's history clean
function showIn(f, h) {
  const fr = frames[f];
  try {
    const w = fr.contentWindow;
    // full URL: a bare '#x' would resolve against the shell's own address and load the shell in the frame
    if (w && w.location.href !== 'about:blank' && w.location.hash.slice(1) !== h) w.location.replace(w.location.href.split('#')[0] + '#' + h);
  } catch (e) {}
}
function loadFrames() {
  const t = tabOf(nav.tab), s = segOf(t);
  const first = f => (s.f === f ? s.h : f === 'train' ? 'workout' : 'today');
  frames.train.src = 'train/index.html#' + first('train');
  frames.meal.src = 'meal/index.html#' + first('meal');
}
frames.meal.addEventListener('load', () => {
  try {
    frames.meal.contentWindow.addEventListener('hashchange', () => {
      const m = MEAL_HASH_TO_TAB[frames.meal.contentWindow.location.hash.slice(1)];
      const s = segOf(tabOf(nav.tab));
      if (m && s.f === 'meal' && (m[0] !== nav.tab || m[1] !== s.k)) go(m[0], m[1]);
    });
  } catch (e) {}
});

document.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.tab) { go(b.dataset.tab); return; }
  if (b.dataset.seg) { go(nav.tab, b.dataset.seg); return; }
  const act = b.dataset.act;
  if (act === 'backup') backupAll();
  if (act === 'restore') $('#restore-file').click();
  if (act === 'restore-yes') applyRestore();
  if (act === 'restore-no') { pending = null; renderData(); }
});
document.addEventListener('change', e => {
  if (e.target.id === 'restore-file') { readRestore(e.target.files && e.target.files[0]); e.target.value = ''; }
});

/* ---------- theme + คลัง badge follow the meal settings ---------- */
function applyTheme() {
  const light = ((readJSON(MEAL_KEY) || {}).settings || {}).theme === 'light';
  document.documentElement.dataset.mode = light ? 'light' : 'dark';
  $('#meta-theme').setAttribute('content', light ? '#eef1f2' : '#0f1417');
}
function shopCount() { return ((readJSON(MEAL_KEY) || {}).pantry || []).filter(p => p && (p.status !== 'have' || p.toBuy)).length; }
window.addEventListener('storage', e => {
  if (e.key === MEAL_KEY || e.key === null) { applyTheme(); render(); }
  else if (!$('#p-data').hidden && e.key && isAppKey(e.key)) renderData();
});

/* ---------- one body-weight log ----------
   Training kept weights in gtl.bw.v1 ({ date: { date, kg } }); the meal app kept its own list in
   body.weights. Both screens now use gtl.bw.v1. Meal weights are copied in for dates that training
   doesn't have; where both apps have a value for the same day, the training value is kept. */
function mergeWeights(list) {
  const bw = readJSON(TRAIN.bw) || {};
  let n = 0;
  (Array.isArray(list) ? list : []).forEach(x => {
    const kg = parseFloat(x && x.kg);
    if (x && /^\d{4}-\d{2}-\d{2}$/.test(x.date) && isFinite(kg) && !bw[x.date]) { bw[x.date] = { date: x.date, kg: Math.round(kg * 10) / 10 }; n++; }
  });
  if (n) writeJSON(TRAIN.bw, bw);
  return n;
}
function migrateOnce() {
  if (localStorage.getItem(MIGRATED_KEY)) return;
  try {
    const m = readJSON(MEAL_KEY);
    mergeWeights(m && m.body && m.body.weights);
    writeJSON(MIGRATED_KEY, new Date().toISOString());
  } catch (e) {}
}

/* ---------- ฉัน › ข้อมูล: Backup / Restore for the whole app ---------- */
let pending = null; // { kind, obj, name }
function counts() {
  const m = readJSON(MEAL_KEY) || {};
  return {
    sess: Object.keys(readJSON(TRAIN.sess) || {}).length,
    days: Object.values(m.days || {}).filter(d => d && (d.entries || []).some(e => e.done)).length,
    bw: Object.keys(readJSON(TRAIN.bw) || {}).length,
    pantry: (m.pantry || []).length
  };
}
const KIND = { all: 'Backup ของ Mick Fit (ทั้งแอป)', train: 'Backup จากแอป Weekly Training เดิม', meal: 'Backup จากแอป Meal Prep เดิม' };
const REPLACES = { all: 'ข้อมูลทั้งหมดในเครื่องนี้จะถูกแทนที่ด้วยไฟล์นี้', train: 'แทนที่ข้อมูลฝั่งซ้อม (ตาราง บันทึกซ้อม ตั้งค่าซ้อม) ข้อมูลอาหารไม่เปลี่ยน น้ำหนักตัวในไฟล์จะแทนที่ของเดิม', meal: 'แทนที่ข้อมูลฝั่งอาหารส่วนที่มีในไฟล์ ข้อมูลซ้อมไม่เปลี่ยน น้ำหนักตัวในไฟล์จะเพิ่มเฉพาะวันที่ยังไม่มี' };
function renderData() {
  const c = counts(), standalone = !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches));
  $('#p-data').innerHTML = `
  <h1>ข้อมูล</h1>
  <section class="card"><h2>Backup ทั้งแอป</h2>
    <div class="stats"><div class="stat"><b>${c.sess}</b><span>วันซ้อม</span></div><div class="stat"><b>${c.days}</b><span>วันที่จดอาหาร</span></div><div class="stat"><b>${c.bw}</b><span>ค่าน้ำหนักตัว</span></div><div class="stat"><b>${c.pantry}</b><span>ของในคลัง</span></div></div>
    <p class="hint">ข้อมูลเก็บอยู่ในเครื่องนี้เท่านั้น ไฟล์ Backup ไฟล์เดียวเก็บทั้งฝั่งซ้อมและอาหาร ควร Backup เก็บไว้เป็นระยะ</p>
    <div class="btn-row"><button class="btn primary" data-act="backup">Backup (.json)</button><button class="btn" data-act="restore">Restore จากไฟล์</button></div>
    <input type="file" id="restore-file" class="vh" accept="application/json,.json" tabindex="-1">
    ${pending ? `<div class="confirm"><b>${esc(KIND[pending.kind])}</b><span>${esc(pending.name)}</span><span>${REPLACES[pending.kind]}</span><div class="btn-row"><button class="btn primary" data-act="restore-yes">แทนที่</button><button class="btn" data-act="restore-no">ยกเลิก</button></div></div>` : ''}
    <p class="err" id="restore-err" hidden></p>
    <p class="hint">Restore ได้ทั้งไฟล์ Backup ของแอปนี้ และไฟล์จากแอปเดิมสองตัว (Weekly Training: Backup .json · Meal Prep: Export JSON)</p>
  </section>
  <section class="card"><h2>ติดตั้งบน iPhone</h2>
    ${standalone ? '<p class="hint">เปิดเป็นแอปบน Home Screen อยู่แล้ว</p>' : '<ol class="steps"><li>เปิดหน้านี้ใน Safari</li><li>แตะปุ่ม Share</li><li>เลือก Add to Home Screen แล้วกด Add</li></ol>'}
  </section>
  <p class="hint" style="text-align:center">Mick Fit · v${VERSION}</p>`;
}
async function saveFile(name, text, mime) {
  const blob = new Blob([text], { type: mime });
  try {
    const file = new File([blob], name, { type: mime });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (e) { toast('บันทึกไฟล์ไม่สำเร็จ'); }
}
function backupAll() {
  try { frames.train.contentWindow.persistSessions(); } catch (e) {} // write the workout being logged right now
  const storage = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (isAppKey(k) && k !== NAV_KEY) storage[k] = readJSON(k);
  }
  saveFile(`mickfit-backup-${today()}.json`, JSON.stringify({ app: 'mick-fit', version: 1, exportedAt: new Date().toISOString(), storage }), 'application/json');
}
function kindOf(o) {
  if (!o || typeof o !== 'object') return '';
  if (o.app === 'mick-fit' && o.storage && typeof o.storage === 'object') return 'all';
  if (o.program && o.program.ex && o.program.days) return 'train';
  if (o.settings || Array.isArray(o.recipes) || Array.isArray(o.pantry) || Array.isArray(o.preps) || o.days) return 'meal';
  return '';
}
function readRestore(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    let o = null;
    try { o = JSON.parse(String(rd.result)); } catch (e) {}
    const kind = kindOf(o);
    pending = kind ? { kind, obj: o, name: file.name } : null;
    renderData();
    if (!kind) { const er = $('#restore-err'); er.textContent = 'ไฟล์นี้ไม่ใช่ backup ของแอปนี้หรือแอปเดิม'; er.hidden = false; }
  };
  rd.readAsText(file);
}
// Unload both apps first: the training app saves its in-memory data when its page closes,
// which would otherwise overwrite what we restore.
const blank = f => new Promise(res => { f.addEventListener('load', res, { once: true }); f.src = 'about:blank'; });
async function applyRestore() {
  const p = pending;
  if (!p) return;
  pending = null;
  await Promise.all([blank(frames.train), blank(frames.meal)]);
  try {
    const o = p.obj;
    if (p.kind === 'all') {
      const old = [];
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (isAppKey(k) && k !== NAV_KEY) old.push(k); }
      old.forEach(k => localStorage.removeItem(k));
      Object.entries(o.storage).forEach(([k, v]) => { if (isAppKey(k) && k !== NAV_KEY && v != null) writeJSON(k, v); });
    } else if (p.kind === 'train') {
      // same fields as the training app's own Restore (train/js/views/settings.js → applyImport)
      writeJSON(TRAIN.prog, o.program);
      writeJSON(TRAIN.sess, o.sessions && typeof o.sessions === 'object' ? o.sessions : {});
      writeJSON(TRAIN.bw, o.bw && typeof o.bw === 'object' ? o.bw : {});
      writeJSON(TRAIN.set, Object.assign(readJSON(TRAIN.set) || {}, o.settings || {}));
      if (Array.isArray(o.blueprints)) writeJSON(TRAIN.bp, o.blueprints);
      writeJSON(TRAIN.seed, true);
    } else {
      // same fields as the meal app's own Import (meal/index.html → doImport), stored in its saved shape
      const m = readJSON(MEAL_KEY) || {};
      if (o.settings) m.settings = o.settings;
      if (Array.isArray(o.recipes)) { m.over = m.over || {}; o.recipes.forEach(r => { if (r && r.id) m.over[r.id] = r; }); }
      if (Array.isArray(o.preps)) m.preps = o.preps;
      if (Array.isArray(o.pantry)) m.pantry = o.pantry;
      if (o.body && Array.isArray(o.body.weights)) m.body = o.body;
      if (o.days && typeof o.days === 'object') m.days = Object.assign(m.days || {}, o.days);
      writeJSON(MEAL_KEY, m);
      mergeWeights(o.body && o.body.weights);
    }
    writeJSON(MIGRATED_KEY, new Date().toISOString());
    toast('กู้ข้อมูลจาก backup แล้ว');
  } catch (e) {
    toast('กู้ข้อมูลไม่สำเร็จ: พื้นที่เก็บข้อมูลอาจเต็ม');
  }
  applyTheme();
  loadFrames();
  render();
}

let toastT = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- boot ---------- */
migrateOnce();
applyTheme();
loadFrames();
render();
if ('serviceWorker' in navigator && /^(https:|http:\/\/localhost)/.test(location.href)) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
