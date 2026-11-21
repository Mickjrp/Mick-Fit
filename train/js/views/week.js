/* week.js — Week page: program templates, ready-to-increase list, sets per exercise. */
"use strict";

/* ================= Week view ================= */
// Cards: program templates · ready to add load · sets per exercise this week
function renderWeek() {
  const rl = readyList();
  let h = blueprintCard();
  h += `<section class="card"><h2 class="ch">พร้อมเพิ่มน้ำหนัก</h2>${
    rl.length
      ? `<ul class="readylist">${rl.map((r) => `<li><span class="rn"><span>${esc(r.ex.name)}</span><small>${esc(r.days.join(", "))} · ครั้งล่าสุด ${esc(thDate(r.date))}</small></span><span class="rv">${esc(r.ex.ready ? r.ex.ready.replace(/^.*→\s*/, "") : `${loadText(r.ex, r.ev.kgs) || "BW"} → ${loadText(r.ex, r.ev.next)}`)}</span></li>`).join("")}</ul>`
      : '<p class="hint">ยังไม่มีท่าที่ทำครบ reps สูงสุดทุก set จดต่อไปเรื่อยๆ แล้วท่าที่พร้อมเพิ่มน้ำหนักจะขึ้นที่นี่</p>'
  }</section>`;
  const rows = setsPerExercise();
  h += `<section class="card"><h2 class="ch">Sets ต่อสัปดาห์</h2><p class="hint">แผน = sets ตามโปรแกรมปัจจุบันทั้งสัปดาห์ · ทำแล้ว = sets ที่จดในสัปดาห์นี้ · Cardio นับเป็นครั้ง</p><div class="tablewrap"><table><thead><tr><th>ชื่อท่า</th><th>แผน</th><th>ทำแล้ว</th></tr></thead><tbody>${rows
    .map((r) => {
      const u = r.cardio ? " ครั้ง" : "";
      return `<tr><td>${esc(r.ex.name)}</td><td class="n${r.plan ? "" : " zero"}">${r.plan ? fmtS(r.plan) + u : "–"}</td><td class="n${r.done ? "" : " zero"}">${r.done ? fmtS(r.done) + u : "–"}</td></tr>`;
    })
    .join("")}</tbody></table></div></section>`;
  $("#v-week").innerHTML = h;
}
// One row per exercise, in program order (Mon → Sun, section order). Exercises done this week
// that aren't in the program are added at the end.
function setsPerExercise() {
  const rows = new Map();
  const row = (ex) => {
    if (!rows.has(ex.id)) rows.set(ex.id, { ex, cardio: ex.type === "cardio", plan: 0, done: 0 });
    return rows.get(ex.id);
  };
  ORDER.forEach((dk) => {
    const d = program.days[dk];
    if (d.rest) return;
    secList().forEach(({ id: sk }) =>
      d.sections[sk].forEach((x) => {
        const ex = program.ex[x.ex];
        if (ex) row(ex).plan += ex.type === "cardio" ? 1 : plannedSets(ex);
      }),
    );
  });
  const ws = weekStart(todayISO());
  Object.values(sessions).forEach((s) => {
    if (!s || !s.date || weekStart(s.date) !== ws) return;
    Object.keys(s.entries || {}).forEach((id) => {
      const ex = program.ex[id],
        e = s.entries[id];
      if (!ex) return;
      if (ex.type === "cardio") {
        if (e && (e.done || num(e.min) != null)) row(ex).done += 1;
      } else {
        const n = doneSets(ex, e);
        if (n) row(ex).done += n;
      }
    });
  });
  return [...rows.values()];
}

/* ---------- Program blueprints card ---------- */
const trainDays = (p) => ORDER.filter((dk) => !p.days[dk].rest).length;
function blueprintCard() {
  const cur = bpById(program.bpId),
    dirty = programDirty();
  let h = `<section class="card"><h2 class="ch">โปรแกรม</h2><div class="bp-cur"><span class="k">ใช้อยู่</span><b>${esc(program.title || "—")}</b>${!cur ? '<span class="tag warn">ยังไม่ได้บันทึกเป็นเทมเพลต</span>' : dirty ? '<span class="tag warn">มีการแก้ไขที่ยังไม่บันทึก</span>' : ""}</div>`;
  if (dirty && cur)
    h += `<button type="button" class="btn ghost" data-act="bp-overwrite" data-bp="${esc(cur.id)}">บันทึกการแก้ไขลงใน “${esc(cur.name)}”</button>`;
  h += `<ul class="picklist">${blueprints
    .map((b) => {
      const on = b.id === program.bpId;
      return `<li><button type="button" data-bpopen="${esc(b.id)}"><span>${esc(b.name)}${on ? '<span class="cur">ใช้อยู่</span>' : ""}</span><small>${trainDays(b.program)} วันซ้อม · บันทึก ${esc(thDate(isoLocal(new Date(b.savedAt))))}</small></button></li>`;
    })
    .join("")}</ul>`;
  h += `<button type="button" class="btn" data-act="bp-new">บันทึกตารางปัจจุบันเป็นเทมเพลตใหม่</button>`;
  h += `<p class="hint">เทมเพลตคือตาราง 7 วันที่เก็บไว้ใช้ซ้ำ เปลี่ยนไปใช้อันไหนก็ได้ บันทึกการซ้อมไม่หาย</p></section>`;
  return h;
}
