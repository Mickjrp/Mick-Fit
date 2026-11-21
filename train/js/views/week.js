/* week.js — Week page: ready-to-increase list, weekly muscle map, rules. */
"use strict";

/* ================= Week view ================= */
function renderWeek() {
  const plan = scoresWeek("plan"),
    done = scoresWeek("done"),
    rl = readyList();
  let h = blueprintCard();
  h += `<section class="card"><h2 class="ch">พร้อมเพิ่มน้ำหนัก</h2>${
    rl.length
      ? `<ul class="readylist">${rl.map((r) => `<li><span class="rn"><span>${esc(r.ex.name)}</span><small>${esc(r.days.join(", "))} · ครั้งล่าสุด ${esc(thDate(r.date))}</small></span><span class="rv">${esc(r.ex.ready ? r.ex.ready.replace(/^.*→\s*/, "") : `${loadText(r.ex, r.ev.kgs) || "BW"} → ${loadText(r.ex, r.ev.next)}`)}</span></li>`).join("")}</ul>`
      : '<p class="hint">ยังไม่มีท่าที่ทำครบ reps สูงสุดทุก set จดต่อไปเรื่อยๆ แล้วท่าที่พร้อมเพิ่มน้ำหนักจะขึ้นที่นี่</p>'
  }</section>`;
  h += `<section class="mapcard" data-mapkind="week">${mapInner("week")}</section>`;
  h += `<section class="card"><h2 class="ch">Sets ต่อสัปดาห์</h2><p class="hint">คำนวณจากโปรแกรมปัจจุบัน · หลัก = กล้ามเนื้อหลักของท่า · รอง = ช่วยออกแรง · ทำแล้ว = set หลักที่จดในสัปดาห์นี้</p><div class="tablewrap"><table><thead><tr><th>Muscle</th><th>แผน</th><th>ทำแล้ว</th></tr></thead><tbody>${MUSCLES.map(
    ([k, en, th]) => {
      const p = plan[k] || { p: 0, s: 0 },
        dn = done[k] || { p: 0, s: 0 };
      return `<tr><td>${esc(en)} <span class="hint">${esc(th)}</span></td><td class="n${p.p || p.s ? "" : " zero"}">${p.p ? fmtS(p.p) : "–"}${p.s ? ` <span class="hint">+${fmtS(p.s)} รอง</span>` : ""}</td><td class="n${dn.p ? "" : " zero"}">${dn.p ? fmtS(dn.p) : "–"}</td></tr>`;
    },
  ).join("")}</tbody></table></div></section>`;
  h +=
    '<details class="card rules"><summary>Progressive overload rules</summary><ol>' +
    "<li>Compound exercises<small>Reach the top of the rep range in ALL sets, maintain good technique, then increase weight by 2.5 kg (or smallest available increment)</small></li>" +
    "<li>Isolation exercises<small>Reach the top of the rep range in ALL sets, then increase weight by the smallest increment</small></li>" +
    "<li>Bodyweight exercises<small>Pull-up: 8 clean reps in ALL sets → add weight gradually · Dip: 10 clean reps in ALL sets → add weight gradually · Push-up: 15 reps in ALL sets → harder variation or add weight</small></li>" +
    "<li>Plyometrics<small>Prioritize explosive power and landing quality. Increase difficulty only when technique is consistent</small></li>" +
    "<li>Training intensity<small>Compound: RIR 1–3 · Isolation: RIR 1–2 · Avoid failure on every set</small></li>" +
    "<li>Recovery<small>Sleep 7–9 hours · Rest 2–3 min for compound lifts · 60–120 s for isolation · Take additional recovery if performance declines</small></li>" +
    "<li>Pain rule<small>Sharp/pinching joint pain → stop that exercise · Muscle burn/fatigue → OK to continue</small></li></ol></details>";
  h +=
    '<details class="card rules"><summary>Muscle gain rules</summary><ul>' +
    "<li>Maintain a calorie surplus of 200–300 kcal/day</li><li>Protein: 1.6–2.2 g/kg body weight/day</li><li>Target weight gain: 0.15–0.25 kg/week</li><li>Track body weight 3–4 mornings/week and monitor the weekly average</li><li>If weight doesn't increase for 2 weeks, add 100–150 kcal/day</li></ul></details>";
  h +=
    '<details class="card rules"><summary>Main priorities</summary><ol><li>Progressive overload</li><li>Consistent training technique</li><li>Adequate nutrition</li><li>Recovery and sleep</li><li>Consistent weekly weight gain</li></ol></details>';
  $("#v-week").innerHTML = h;
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
