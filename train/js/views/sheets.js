/* sheets.js — Bottom sheets: exercise editor, add exercise, timer presets. */
"use strict";

/* ================= Sheets ================= */
let lastFocus = null;
function openSheet(title, html, mount) {
  lastFocus = document.activeElement;
  $("#sheet-title").textContent = title;
  $("#sheet-body").innerHTML = html;
  $("#sheet").hidden = false;
  document.body.classList.add("locked");
  if (mount) mount($("#sheet-body"));
  const f = $("#sheet-body").querySelector("input,select,button");
  if (f && !("ontouchstart" in window)) f.focus();
}
function closeSheet() {
  if ($("#sheet").hidden) return;
  $("#sheet").hidden = true;
  document.body.classList.remove("locked");
  $("#sheet-body").innerHTML = "";
  if (lastFocus && document.contains(lastFocus))
    try {
      lastFocus.focus();
    } catch (e) {}
}
let edCtx = null;
function openEditor(exId, ctx) {
  const isNew = !exId;
  const ex = isNew ? L("", "", {}) : clone(program.ex[exId]);
  const itm = ctx && ctx.i != null ? program.days[ctx.day].sections[ctx.sk][ctx.i] : null;
  edCtx = { exId, ctx, isNew, itm, mus: {} };
  ex.muscles.p.forEach((k) => (edCtx.mus[k] = "p"));
  ex.muscles.s.forEach((k) => {
    if (!edCtx.mus[k]) edCtx.mus[k] = "s";
  });
  const used = isNew ? [] : usedIn(exId);
  let h = `<div class="form"><label class="fld span3">ชื่อท่า<input id="e-name" autocomplete="off"></label><label class="fld span3">ประเภท<select id="e-type">${TYPES.map((t) => `<option value="${t[0]}">${esc(t[1])}</option>`).join("")}</select></label><label class="fld num" data-for="sets">Sets<input id="e-sets" inputmode="numeric"></label><label class="fld num" data-for="range"><span id="e-lo-l">Reps ต่ำสุด</span><input id="e-lo" inputmode="numeric"></label><label class="fld num" data-for="range"><span id="e-hi-l">Reps สูงสุด</span><input id="e-hi" inputmode="numeric"></label><label class="fld span2x" data-for="target">เป้าหมายต่อ set<select id="e-target"><option value="range">ตามช่วงที่กำหนด</option><option value="max">Max (มากที่สุด)</option></select></label><label class="switch" data-for="side"><span>ต่อข้าง</span><input type="checkbox" id="e-side"></label><label class="fld span3" data-for="rx">รายละเอียด (เช่น 2×10, 3–5 min)<input id="e-rx" autocomplete="off"></label><label class="fld span2x" data-for="cls">การเพิ่มน้ำหนัก<select id="e-cls"><option value="c">Compound · +2.5 kg</option><option value="i">Isolation · ขั้นต่ำ</option></select></label><label class="fld num" data-for="rest">พัก (วิ)<input id="e-rest" inputmode="numeric" placeholder="auto"></label><label class="fld num" data-for="step">เพิ่มทีละ kg<input id="e-step" inputmode="decimal" placeholder="auto"></label><label class="fld num span2x" data-for="start">น้ำหนักเริ่มต้น (kg)<input id="e-start" inputmode="decimal" placeholder="40 หรือ 10/15/15"></label><label class="fld span3">ลิงก์ YouTube ท่าที่ถูกต้อง<input id="e-yt" type="url" inputmode="url" autocomplete="off" placeholder="https://youtube.com/shorts/..."></label><label class="switch span3" data-for="clip"><span>แสดงคลิปบนการ์ด · เล่นเองแบบไม่มีเสียงเมื่อเลื่อนมาถึง</span><input type="checkbox" id="e-clip"></label><label class="fld span3">Note<textarea id="e-note"></textarea></label>${itm || isNew ? '<label class="fld span3">ป้ายกำกับในวันนี้ (ไม่ใส่ก็ได้)<input id="e-tag" autocomplete="off" placeholder="เช่น NEW, +1 set"></label>' : ""}</div><div class="fld"><span>กล้ามเนื้อ · แตะ 1 ครั้ง = หลัก · 2 ครั้ง = รอง · 3 ครั้ง = ไม่ใช้</span><div class="mchips" id="e-mus">${MUSCLES.map(([k, en, th]) => `<button type="button" data-mus="${k}" data-st="${edCtx.mus[k] || ""}" aria-label="${esc(en)}">${esc(en)} · ${esc(th)}</button>`).join("")}</div></div>${used.length ? `<p class="used">ท่านี้อยู่ใน ${used.join(", ")} · แก้แล้วเปลี่ยนทุกวันที่ใช้ท่านี้</p>` : ""}<p class="err" id="e-err" hidden></p><div class="btns"><button type="button" class="btn" data-act="e-save">บันทึก</button>${itm ? '<button type="button" class="btn danger" data-act="e-remove">เอาออกจากวันนี้</button>' : ""}</div>`;
  openSheet(isNew ? "สร้างท่าใหม่" : `แก้ไข ${ex.name}`, h, () => {
    $("#e-name").value = ex.name;
    $("#e-type").value = ex.type;
    $("#e-sets").value = ex.sets;
    $("#e-lo").value = ex.lo;
    $("#e-hi").value = ex.hi;
    $("#e-rx").value = ex.rx;
    $("#e-cls").value = ex.cls === "c" ? "c" : "i";
    $("#e-rest").value = num(ex.rest) > 0 ? ex.rest : "";
    $("#e-start").value = (ex.startKg || []).map(fmt).join(" / ");
    $("#e-yt").value = ex.yt || "";
    $("#e-note").value = ex.note || "";
    $("#e-step").value = num(ex.step) > 0 ? fmt(num(ex.step)) : "";
    $("#e-clip").checked = !!ex.clip;
    $("#e-target").value = ex.max ? "max" : "range";
    $("#e-side").checked = !!ex.side;
    if ($("#e-tag")) $("#e-tag").value = itm ? itm.tag : "";
    syncEditor();
  });
}
function syncEditor() {
  const t = $("#e-type").value;
  const show = {
    sets: ["load", "bw", "reps", "hold"],
    range: ["load", "bw", "reps", "hold"],
    rx: ["check", "cardio"],
    cls: ["load", "bw"],
    rest: ["load", "bw", "reps", "hold"],
    step: ["load", "bw"],
    start: ["load"],
    clip: ["load", "bw", "reps", "hold", "cardio"],
    target: ["load", "bw", "reps", "hold"],
    side: ["load", "bw", "reps", "hold"],
  };
  document.querySelectorAll("#sheet-body [data-for]").forEach((el) => {
    el.hidden = !show[el.dataset.for].includes(t);
  });
  // Max target: the rep range isn't used
  if ($("#e-target").value === "max")
    document.querySelectorAll('#sheet-body [data-for="range"]').forEach((el) => (el.hidden = true));
  $("#e-lo-l").textContent = t === "hold" ? "วินาทีต่ำสุด" : "Reps ต่ำสุด";
  $("#e-hi-l").textContent = t === "hold" ? "วินาทีสูงสุด" : "Reps สูงสุด";
}
function edErr(msg) {
  const e = $("#e-err");
  e.textContent = msg;
  e.hidden = false;
  e.scrollIntoView({ block: "nearest" });
}
function intIn(sel, min, max) {
  const v = plainNum($(sel).value);
  return v != null && Number.isInteger(v) && v >= min && v <= max ? v : null;
}
function saveEditor() {
  const c = edCtx;
  if (!c) return;
  const name = $("#e-name").value.trim();
  if (!name) return edErr("ใส่ชื่อท่าก่อน");
  const type = $("#e-type").value;
  const o = { name, type };
  if (["load", "bw", "reps", "hold"].includes(type)) {
    const max = $("#e-target").value === "max",
      sets = intIn("#e-sets", 1, 12);
    let lo = intIn("#e-lo", 1, 600),
      hi = intIn("#e-hi", 1, 600);
    if (sets == null) return edErr("Sets ต้องเป็นเลข 1–12");
    if (max) {
      // range is hidden for Max; keep a valid placeholder range
      if (lo == null) lo = 1;
      if (hi == null || hi < lo) hi = lo;
    } else {
      if (lo == null || hi == null)
        return edErr(`ใส่ช่วง ${type === "hold" ? "วินาที" : "reps"} เป็นตัวเลข`);
      if (lo > hi) return edErr("ค่าต่ำสุดต้องไม่มากกว่าค่าสูงสุด");
    }
    Object.assign(o, { sets, lo, hi, max, side: $("#e-side").checked });
    const r = $("#e-rest").value.trim();
    const rv = plainNum(r);
    if (r && (rv == null || rv < 10 || rv > 900))
      return edErr("เวลาพักใส่เป็นวินาที 10–900 หรือเว้นว่างไว้");
    o.rest = rv || 0;
  } else Object.assign(o, { rx: $("#e-rx").value.trim(), max: false, side: false });
  if (["load", "bw"].includes(type)) {
    o.cls = $("#e-cls").value;
    const sr = $("#e-step").value.trim(),
      sv = num(sr);
    if (sr && (sv == null || sv < 0.25 || sv > 20))
      return edErr("เพิ่มทีละใส่เป็น kg 0.25–20 หรือเว้นว่างไว้");
    o.step = sv || 0;
  }
  if (type === "load") {
    const raw = $("#e-start").value.trim();
    const parts = raw ? raw.split(/[\/,\s]+/).filter(Boolean) : [];
    const ks = parts.map((p) => num(p));
    if (ks.some((k) => k == null || k < 0 || k > 500))
      return edErr("น้ำหนักเริ่มต้นใส่เป็นตัวเลข เช่น 40 หรือ 10/15/15");
    o.startKg = ks;
  }
  const yt = $("#e-yt").value.trim();
  if (yt && !safeUrl(yt)) return edErr("ลิงก์ต้องขึ้นต้นด้วย https://");
  o.yt = yt;
  o.note = $("#e-note").value.trim();
  o.clip = type !== "check" && $("#e-clip").checked;
  if (o.clip && !ytId(yt)) return edErr("ใส่ลิงก์ YouTube ก่อนเปิดแสดงคลิปบนการ์ด");
  o.muscles = {
    p: MUSCLES.map((m) => m[0]).filter((k) => c.mus[k] === "p"),
    s: MUSCLES.map((m) => m[0]).filter((k) => c.mus[k] === "s"),
  };
  const tag = $("#e-tag") ? $("#e-tag").value.trim() : "";
  if (c.isNew) {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 24) || "ex";
    let id = `${base}-${Date.now().toString(36).slice(-4)}`;
    while (program.ex[id]) id += "x";
    program.ex[id] = Object.assign(L(id, name), o);
    program.days[c.ctx.day].sections[c.ctx.sk].push(it(id, tag));
  } else {
    Object.assign(program.ex[c.exId], o);
    if (c.itm) c.itm.tag = tag;
  }
  saveProgramNow();
  closeSheet();
  renderWorkout();
  toast(c.isNew ? `เพิ่ม ${name} แล้ว` : `บันทึก ${name} แล้ว`);
}
function openAdd(sk) {
  const d = program.days[state.day];
  const inSec = new Set(d.sections[sk].map((x) => x.ex));
  const list = Object.values(program.ex)
    .filter((e) => !inSec.has(e.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const h = `<button type="button" class="btn" data-act="add-new" data-sk="${esc(sk)}">+ สร้างท่าใหม่</button><label class="fld">หรือเลือกจากท่าที่มีอยู่<input id="add-q" type="search" autocomplete="off" placeholder="ค้นหา เช่น curl"></label>${list.length ? `<ul class="picklist" id="add-list">${list.map((e) => `<li data-name="${esc(e.name.toLowerCase())}"><button type="button" data-pick="${esc(e.id)}" data-sk="${esc(sk)}"><span>${esc(e.name)}</span><small>${esc(typeLabel(e))}</small></button></li>`).join("")}</ul>` : '<p class="empty">ยังไม่มีท่าอื่นให้เลือก</p>'}`;
  openSheet(`เพิ่มท่าใน ${secName(sk)} · ${DN[state.day]}`, h);
}
function openTimerSheet() {
  const pre = [60, 90, 120, 150, 180, 240];
  const h = `<div class="presets">${pre.map((s) => `<button type="button" data-preset="${s}">${mmss(s)}</button>`).join("")}</div><p class="hint">กด ✓ ที่แต่ละ set ระบบจะเริ่มจับเวลาพักตามท่านั้นให้เอง ตั้งค่าเวลาพักเริ่มต้นได้ที่ Settings</p>${timer ? '<button type="button" class="btn ghost" data-t="stop">หยุดจับเวลา</button>' : ""}`;
  openSheet("จับเวลาพัก", h);
}

/* ---------- Sections (shared by every day) ---------- */
function openSecEditor(sk) {
  const s = sk ? program.secs.find((x) => x.id === sk) : null;
  const used = s
    ? ORDER.filter((dk) => program.days[dk].sections[sk].length).map((dk) => DN[dk])
    : [];
  let del = "";
  if (s && used.length)
    del = `<p class="hint">ลบหมวดนี้ได้เมื่อไม่มีท่าเหลือ ตอนนี้ยังมีท่าใน ${used.join(", ")}</p>`;
  else if (s)
    del = `<button type="button" class="btn danger" data-act="sec-del" data-sk="${esc(sk)}">ลบหมวดนี้</button>`;
  const h = `<label class="fld">ชื่อหมวด<input id="sec-name" autocomplete="off" maxlength="40" placeholder="เช่น Drills" value="${s ? esc(s.name) : ""}"></label>
    <p class="hint">หมวดใช้ร่วมกันทุกวัน วันไหนไม่มีท่าในหมวดนี้ หน้า Workout จะไม่แสดงหมวดนั้น</p>
    <p class="err" id="sec-err" hidden></p>
    <div class="btns"><button type="button" class="btn" data-act="sec-save" data-sk="${s ? esc(sk) : ""}">บันทึก</button>${del}</div>`;
  openSheet(s ? `แก้ไขหมวด ${s.name}` : "เพิ่มหมวดใหม่", h);
}
function saveSec(sk) {
  const name = $("#sec-name").value.trim();
  if (!name) {
    const e = $("#sec-err");
    e.textContent = "ใส่ชื่อหมวดก่อน";
    e.hidden = false;
    return;
  }
  const s = sk ? program.secs.find((x) => x.id === sk) : null;
  if (s) s.name = name;
  else {
    let id = `s-${Date.now().toString(36)}`;
    while (program.secs.some((x) => x.id === id)) id += "x";
    program.secs.push({ id, name });
    ORDER.forEach((dk) => (program.days[dk].sections[id] = []));
  }
  saveProgramNow();
  closeSheet();
  renderWorkout();
  toast(s ? `เปลี่ยนชื่อหมวดเป็น ${name} แล้ว` : `เพิ่มหมวด ${name} แล้ว`);
}
function deleteSec(sk) {
  const i = program.secs.findIndex((x) => x.id === sk);
  if (i < 0 || ORDER.some((dk) => program.days[dk].sections[sk].length)) return;
  const [s] = program.secs.splice(i, 1);
  ORDER.forEach((dk) => delete program.days[dk].sections[sk]);
  saveProgramNow();
  closeSheet();
  renderWorkout();
  toast(`ลบหมวด ${s.name} แล้ว`, "เลิกทำ", () => {
    program.secs.splice(i, 0, s);
    ORDER.forEach((dk) => (program.days[dk].sections[sk] = []));
    saveProgramNow();
    if (state.view === "workout") renderWorkout();
  });
}

/* ---------- Copy another day's program into this day ---------- */
function openCopyDay() {
  const list = ORDER.filter((dk) => dk !== state.day)
    .map((dk) => {
      const d = program.days[dk];
      return `<li><button type="button" data-copyfrom="${dk}"><span><b>${DN[dk]}</b> · ${esc(d.rest ? "Rest" : d.name)}</span><small>${d.rest ? "วันพัก" : `${dayItems(d)} ท่า`}</small></button></li>`;
    })
    .join("");
  const h = `<p class="hint">ท่าทั้งหมดของ ${DN[state.day]} จะถูกแทนที่ด้วยของวันที่เลือก (กดเลิกทำได้) ชื่อวันยังเป็นชื่อเดิม</p><ul class="picklist">${list}</ul>`;
  openSheet(`คัดลอกโปรแกรมมาที่ ${DN[state.day]}`, h);
}
function copyDay(from) {
  const to = state.day,
    before = clone(program.days[to]),
    src = program.days[from];
  program.days[to] = {
    // a rest day (or unnamed day) takes the source's name
    name: before.rest || !before.name ? src.name : before.name,
    focus: src.focus,
    rest: src.rest,
    restNotes: [...src.restNotes],
    sections: clone(src.sections),
  };
  saveProgramNow();
  closeSheet();
  renderDays();
  renderWorkout();
  toast(`คัดลอกจาก ${DN[from]} แล้ว`, "เลิกทำ", () => {
    program.days[to] = before;
    saveProgramNow();
    renderDays();
    if (state.day === to) renderWorkout();
  });
}

/* ---------- Blueprints (saved weekly programs) ---------- */
function refreshAfterProgramChange() {
  renderDays();
  if (state.view === "week") renderWeek();
  if (state.view === "workout") renderWorkout();
}
function openBlueprint(id) {
  const b = bpById(id);
  if (!b) return;
  const p = b.program,
    on = b.id === program.bpId,
    dirty = programDirty();
  const days = ORDER.map((dk) => {
    const d = p.days[dk];
    const n = p.secs.reduce((a, s) => a + (d.sections[s.id] || []).length, 0);
    return `<li><span><b>${DN[dk]}</b> · ${esc(d.rest ? "Rest" : d.name)}</span><small>${d.rest ? "วันพัก" : `${n} ท่า`}</small></li>`;
  }).join("");
  let apply;
  if (on && !dirty) apply = '<button type="button" class="btn" disabled>ใช้อยู่ตอนนี้</button>';
  else
    apply = `<button type="button" class="btn" data-act="bp-apply" data-bp="${esc(id)}">${on ? "ย้อนกลับไปใช้ตามที่บันทึกไว้" : "ใช้โปรแกรมนี้"}</button>${dirty ? '<p class="hint">ตารางปัจจุบันมีการแก้ไขที่ยังไม่บันทึก ถ้าเปลี่ยนตอนนี้การแก้ไขจะหายไป (กดเลิกทำได้)</p>' : ""}`;
  const h = `<ul class="daylist">${days}</ul>
    <div class="btns">${apply}
      <button type="button" class="btn ghost" data-act="bp-overwrite" data-bp="${esc(id)}">บันทึกตารางปัจจุบันทับ blueprint นี้</button></div>
    <label class="fld">ชื่อ<input id="bp-name" autocomplete="off" maxlength="60" value="${esc(b.name)}"></label>
    <p class="err" id="bp-err" hidden></p>
    <div class="btns"><button type="button" class="btn ghost" data-act="bp-rename" data-bp="${esc(id)}">เปลี่ยนชื่อ</button>
      <button type="button" class="btn danger" data-act="bp-delete" data-bp="${esc(id)}">ลบ blueprint นี้</button></div>`;
  openSheet(b.name, h);
}
function bpNameFrom(sel, exceptId) {
  const name = $(sel).value.trim(),
    err = $("#bp-err");
  let msg = "";
  if (!name) msg = "ใส่ชื่อก่อน";
  else if (blueprints.some((b) => b.id !== exceptId && b.name === name))
    msg = "มีชื่อนี้แล้ว ถ้าจะเขียนทับ ให้เปิดอันเดิมแล้วกดบันทึกทับ";
  if (msg) {
    err.textContent = msg;
    err.hidden = false;
    return null;
  }
  return name;
}
function applyBlueprint(id) {
  const b = bpById(id);
  if (!b) return;
  const before = program;
  // the blueprint's exercises win; other exercises stay in the library
  program = normalizeProgram({
    ...clone(b.program),
    ex: { ...clone(program.ex), ...clone(b.program.ex) },
    title: b.name,
    bpId: b.id,
  });
  state.edit = false;
  saveProgramNow();
  closeSheet();
  refreshAfterProgramChange();
  toast(`ใช้ ${b.name} แล้ว`, "เลิกทำ", () => {
    program = before;
    saveProgramNow();
    refreshAfterProgramChange();
  });
}
function overwriteBlueprint(id) {
  const b = bpById(id);
  if (!b) return;
  const before = {
    program: b.program,
    savedAt: b.savedAt,
    title: program.title,
    bpId: program.bpId,
  };
  b.program = snapshotProgram(program);
  b.savedAt = new Date().toISOString();
  program.title = b.name;
  program.bpId = b.id;
  saveBlueprints();
  saveProgramNow();
  closeSheet();
  refreshAfterProgramChange();
  toast(`บันทึกลง ${b.name} แล้ว`, "เลิกทำ", () => {
    Object.assign(b, { program: before.program, savedAt: before.savedAt });
    program.title = before.title;
    program.bpId = before.bpId;
    saveBlueprints();
    saveProgramNow();
    refreshAfterProgramChange();
  });
}
function openNewBlueprint() {
  const h = `<label class="fld">ชื่อ blueprint<input id="bp-new-name" autocomplete="off" maxlength="60" placeholder="เช่น Phase 2 · Strength"></label>
    <p class="hint">เก็บตารางทั้ง 7 วันตอนนี้ไว้ (หมวด ท่า sets/reps ลิงก์) แล้วตารางปัจจุบันจะใช้ชื่อนี้</p>
    <p class="err" id="bp-err" hidden></p>
    <div class="btns"><button type="button" class="btn" data-act="bp-create">บันทึก</button></div>`;
  openSheet("บันทึกเป็น blueprint ใหม่", h);
}
function createBlueprint() {
  const name = bpNameFrom("#bp-new-name", null);
  if (!name) return;
  let id = `bp-${Date.now().toString(36)}`;
  while (bpById(id)) id += "x";
  blueprints.push(makeBlueprint(id, name, program));
  program.title = name;
  program.bpId = id;
  saveBlueprints();
  saveProgramNow();
  closeSheet();
  refreshAfterProgramChange();
  toast(`บันทึก ${name} แล้ว`);
}
function renameBlueprint(id) {
  const b = bpById(id);
  const name = b && bpNameFrom("#bp-name", id);
  if (!name) return;
  b.name = name;
  if (program.bpId === id) {
    program.title = name;
    saveProgramNow();
  }
  saveBlueprints();
  closeSheet();
  refreshAfterProgramChange();
  toast(`เปลี่ยนชื่อเป็น ${name} แล้ว`);
}
function deleteBlueprint(id) {
  const i = blueprints.findIndex((b) => b.id === id);
  if (i < 0) return;
  const [b] = blueprints.splice(i, 1);
  saveBlueprints();
  closeSheet();
  refreshAfterProgramChange();
  toast(`ลบ ${b.name} แล้ว`, "เลิกทำ", () => {
    blueprints.splice(i, 0, b);
    saveBlueprints();
    refreshAfterProgramChange();
  });
}
