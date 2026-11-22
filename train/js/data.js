/* data.js — App info, icons, reference data (days, muscles, exercise types) and the default program. */
"use strict";

/* ---------- App info ---------- */
const APP = "weekly-training",
  VERSION = "1.8.0";

/* ================= Icons ================= */
const I = {
  pencil: '<svg class="ico" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>',
  up: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  down: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  x: '<svg class="ico" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  copy: '<svg class="ico" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>',
};

/* ================= Reference data ================= */
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DN = { mon: "MON", tue: "TUE", wed: "WED", thu: "THU", fri: "FRI", sat: "SAT", sun: "SUN" };
// Sections of programs saved before sections became editable (v1.3 and older).
// Sections now live in program.secs; see secList() in storage.js.
const LEGACY_SECS = [
  { id: "warmup", name: "Warm-up" },
  { id: "plyo", name: "Plyometrics" },
  { id: "strength", name: "Strength" },
  { id: "core", name: "Core" },
  { id: "cardio", name: "Cardio" },
];
const MUSCLES = [
  ["chest", "Chest", "อก"],
  ["serratus", "Serratus", "ซี่โครงข้าง"],
  ["front-delts", "Front delts", "ไหล่หน้า"],
  ["side-delts", "Side delts", "ไหล่ข้าง"],
  ["rear-delts", "Rear delts", "ไหล่หลัง"],
  ["traps", "Traps", "บ่า"],
  ["mid-back", "Mid back", "หลังกลาง"],
  ["lats", "Lats", "ปีก"],
  ["lower-back", "Lower back", "หลังล่าง"],
  ["biceps", "Biceps", "ต้นแขนหน้า"],
  ["triceps", "Triceps", "ต้นแขนหลัง"],
  ["forearms", "Forearms", "แขนท่อนล่าง"],
  ["abs", "Abs", "หน้าท้อง"],
  ["obliques", "Obliques", "ข้างเอว"],
  ["glutes", "Glutes", "ก้น"],
  ["quads", "Quads", "ต้นขาหน้า"],
  ["hamstrings", "Hamstrings", "ต้นขาหลัง"],
  ["calves", "Calves", "น่อง"],
];
const MUS = Object.fromEntries(MUSCLES.map((x) => [x[0], x]));
const TYPES = [
  ["load", "น้ำหนัก (kg × reps)"],
  ["bw", "Bodyweight (+kg × reps)"],
  ["reps", "Reps อย่างเดียว"],
  ["hold", "ค้างเวลา (วินาที)"],
  ["cardio", "Cardio (นาที + HR)"],
  ["check", "เช็กลิสต์ (warm-up / plyo)"],
];

/* ================= Default program ================= */
// The built-in weekly program, also saved as the first blueprint
const PHASE1 = { id: "phase1", title: "Phase 1 · Build Capacity" };
const Y = (id) => `https://youtu.be/${id}`,
  YS = (id) => `https://youtube.com/shorts/${id}`;
function mm(p, s) {
  const sp = (x) => (x ? x.split(" ").filter(Boolean) : []);
  return { p: sp(p), s: sp(s) };
}
function L(id, name, o) {
  return Object.assign(
    {
      id,
      name,
      type: "load",
      sets: 3,
      lo: 8,
      hi: 12,
      cls: "i",
      rest: 0,
      step: 0,
      startKg: [],
      startReps: [],
      note: "",
      rx: "",
      yt: "",
      ready: "",
      muscles: { p: [], s: [] },
    },
    o || {},
  );
}
function C(id, name, rx, o) {
  return L(id, name, Object.assign({ type: "check", rx }, o || {}));
}
const DEF_EX = [
  C("open-book", "Open book", "2×10", { yt: Y("Tqv_2oe64vk") }),
  C("tspine", "T-spine stretch", "2×30s", { yt: Y("qovO0ysEpuc") }),
  C("sa-face-pull", "SA face pull", "2×8", { yt: YS("__vgT7K5qKU") }),
  C("seated-er", "Seated external rotation", "2×10", { yt: Y("T_YznGUyE0Q") }),
  L("chest-press", "Chest press", {
    sets: 3,
    lo: 6,
    hi: 8,
    cls: "c",
    startKg: [40],
    yt: YS("aArjHvULFP4"),
    clip: true,
    note: "Scap retracted, elbows 45° · Warm-up 1×10 ▸ 20 kg",
    muscles: mm("chest", "front-delts triceps"),
  }),
  L("dip", "Dip", {
    type: "bw",
    sets: 3,
    lo: 6,
    hi: 10,
    cls: "c",
    note: "10 clean reps ทุก set → เริ่มถ่วงน้ำหนัก",
    yt: YS("MDOjin9jxuY"),
    muscles: mm("chest triceps", "front-delts"),
  }),
  L("ohp", "Overhead press", {
    sets: 3,
    lo: 8,
    hi: 12,
    cls: "c",
    muscles: mm("front-delts", "side-delts triceps traps"),
  }),
  L("lateral-raise", "Lateral raise", {
    sets: 2,
    lo: 12,
    hi: 15,
    startKg: [7],
    note: "Pain-free 4+ สัปดาห์ → 3 sets",
    muscles: mm("side-delts", "traps"),
  }),
  L("fly", "Fly", { sets: 2, lo: 10, hi: 15, muscles: mm("chest", "front-delts") }),
  L("triceps-ext", "Triceps extension", { sets: 3, lo: 10, hi: 12, muscles: mm("triceps") }),
  L("biceps-curl", "Biceps curl", { sets: 3, lo: 10, hi: 12, muscles: mm("biceps", "forearms") }),
  L("situps", "Sit-ups", {
    type: "reps",
    sets: 3,
    lo: 15,
    hi: 15,
    yt: Y("1pbZ8mX2D1U"),
    muscles: mm("abs", "obliques"),
  }),
  C("bike", "Air-bike", "3–5 min"),
  C("sl-legext-iso", "SL leg ext iso", "1×30s", { yt: YS("OcjA4MjLDLo") }),
  C("iso-lunge", "Iso lunge", "1×30–40s", { yt: YS("q9fF5QoeN7U") }),
  C("sl-pogo", "SL pogo", "2×15", { yt: YS("_pDStuHcvTc"), muscles: mm("calves") }),
  C("box-jump", "Box jump", "2×5", {
    yt: "https://www.youtube.com/watch?v=j0nl5dWuqN4",
    muscles: mm("quads glutes", "calves"),
  }),
  C("depth-drop", "Depth drop", "2×5", {
    yt: YS("LvQLWtzQsRE"),
    muscles: mm("quads", "calves glutes"),
  }),
  L("back-squat", "Back squat", {
    sets: 3,
    lo: 8,
    hi: 10,
    cls: "c",
    startKg: [15],
    muscles: mm("quads glutes", "hamstrings lower-back"),
  }),
  L("sl-leg-ext", "SL leg extension", {
    sets: 3,
    lo: 5,
    hi: 8,
    startKg: [30],
    yt: YS("qRzzAAYk4BQ"),
    muscles: mm("quads"),
  }),
  L("split-squat", "Short split squat", {
    sets: 3,
    lo: 8,
    hi: 8,
    cls: "c",
    startKg: [16],
    yt: YS("e9kzl0gi0Lg"),
    muscles: mm("quads glutes", "hamstrings"),
  }),
  C("ytw", "Y-T-W pulls", "2×10", { yt: YS("tlcuHSz1TQE") }),
  L("row", "Row", {
    sets: 4,
    lo: 6,
    hi: 8,
    cls: "c",
    startKg: [45],
    muscles: mm("lats mid-back", "biceps rear-delts"),
  }),
  L("kelso", "Kelso shrug", {
    sets: 3,
    lo: 10,
    hi: 12,
    startKg: [16],
    muscles: mm("mid-back traps", "rear-delts"),
  }),
  L("lat-pulldown", "Lat pulldown", {
    sets: 3,
    lo: 8,
    hi: 12,
    cls: "c",
    startKg: [45],
    muscles: mm("lats", "biceps mid-back"),
  }),
  L("straight-arm", "Straight arm pulldown", {
    sets: 2,
    lo: 10,
    hi: 15,
    muscles: mm("lats", "triceps"),
  }),
  L("reverse-fly", "Reverse fly", {
    sets: 2,
    lo: 12,
    hi: 15,
    note: "Rear delts · ใช้น้ำหนักเบา คุมจังหวะ",
    muscles: mm("rear-delts", "mid-back"),
  }),
  L("triceps-pushdown", "Triceps pushdown", { sets: 3, lo: 10, hi: 12, muscles: mm("triceps") }),
  L("back-ext", "Back extension", {
    type: "bw",
    sets: 2,
    lo: 12,
    hi: 15,
    ready: "ครบทุก set → ถือแผ่นน้ำหนักเพิ่ม",
    yt: Y("7X075Hrl5lE"),
    muscles: mm("lower-back", "glutes hamstrings"),
  }),
  L("z2-run", "Zone 2 run", { type: "cardio", rx: "30 min", note: "HR 120–140" }),

  /* ---------- Phase 1 · Build Capacity (Mick.pdf) ---------- */
  // Upper · breathing drills
  L("fr-wall-slide", "Foam Roller Wall Slide with Lift-Off", {
    yt: YS("MQnT6PPKBT0"),
    type: "reps",
    sets: 3,
    lo: 8,
    hi: 10,
    note: "Tempo 3-0-3-0 · กดปลายแขนดันโรลเลอร์ไปข้างหน้าตลอดการสไลด์ขึ้นเหนือศีรษะ รักษาซี่โครงให้แนบ ไม่ยักไหล่",
    muscles: mm("serratus", "traps"),
  }),
  L("serratus-pushup", "Serratus Push-Up Plus", {
    yt: YS("5469WE4AVjY"),
    type: "reps",
    sets: 3,
    lo: 12,
    hi: 15,
    note: "Tempo 2-2-2-0 · ผลักสะบักโอบซี่โครงให้สุดแล้วค้าง 2 วินาที ไม่โก่งหลัง",
    muscles: mm("serratus", "chest abs"),
  }),
  L("serratus-punch", "Supine Serratus Punch", {
    yt: "https://www.youtube.com/watch?v=r5byDDl3Ri8",
    type: "reps",
    sets: 3,
    lo: 12,
    hi: 12,
    side: true,
    note: "Tempo 2-1-2-0 · เน้นจังหวะเอื้อมสะบักสุดแขนเพื่อเจาะจง Serratus Anterior",
    muscles: mm("serratus", "front-delts"),
  }),
  // Upper · integrated strength & loaded mobility
  L("landmine-press", "Half-Kneeling Landmine Press", {
    yt: "https://www.youtube.com/watch?v=_ArzG9qz-yM",
    sets: 3,
    lo: 8,
    hi: 10,
    cls: "c",
    note: "Tempo 3-2-3-0 · แนวแรงเฉียงใน Scapular Plane ลดแรงกดข้อไหล่ ดันขึ้นพร้อมเอื้อมสะบักสุดมุม (Reach) โดยคุมแกนกลางลำตัวและสะโพกให้นิ่ง",
    muscles: mm("front-delts serratus", "chest triceps abs"),
  }),
  L("sa-cable-row", "Single-Arm Cable Row (Full Protraction)", {
    yt: "https://www.youtube.com/watch?v=afE9JabFqR4",
    sets: 3,
    lo: 12,
    hi: 15,
    cls: "c",
    note: "Tempo 2-2-2-2 · ปล่อยให้สะบักยืดไปข้างหน้าจนสุดในจังหวะผ่อน (Eccentric) แล้วดึงกลับมาอย่างควบคุม เพื่อสร้างสมดุลระหว่าง Serratus กับ Mid/Lower Trap",
    muscles: mm("mid-back lats", "serratus rear-delts biceps"),
  }),
  L("bottoms-up-kb", "Bottoms-Up Kettlebell Carry / Hold", {
    yt: "https://www.youtube.com/watch?v=UpBzi0HIdAI",
    sets: 3,
    lo: 12,
    hi: 12,
    side: true,
    note: "ถือเคตเทิลเบลหงายก้นขึ้น มุมไหล่เฉียง 30 องศา กระตุ้น Co-contraction ของ Rotator Cuff และ Serratus Anterior แบบ Reactive Stability",
    muscles: mm("serratus", "front-delts forearms abs"),
  }),
  L("db-pullover", "Eccentric-Focus Dumbbell Pullover", {
    yt: "https://www.youtube.com/watch?v=hT-2YDwh4h0",
    sets: 3,
    lo: 10,
    hi: 12,
    note: "Tempo 3-2-2-2 · นอนหงายบนม้านั่ง กดแกนกลางและซี่โครงให้นิ่ง ค่อยๆ ลดดัมเบลลงเหนือศีรษะ สร้าง Active Overhead Mobility ภายใต้แรงต้าน · (PDF ไม่ได้ระบุ sets/reps ใส่ 3×10–12 ไว้ก่อน)",
    muscles: mm("lats serratus", "chest triceps"),
  }),
  // Lower · knee prep
  C("hammy-floss", "Hammy flossing", "15 reps", { yt: YS("72WKiKdmn0U") }),
  C("rf-iso", "Rectus femoris iso", "45s", { yt: YS("6rvXIu36E0k") }),
  C("a-walk", "A-walk", "2×16", { yt: "https://www.youtube.com/watch?v=zPEcsUy1s_M" }),
  // Lower · strength
  L("sl-wall-sit", "SL wall sit", {
    type: "hold",
    sets: 2,
    lo: 30,
    hi: 30,
    side: true,
    note: "Lvl 1 2×30s (สัปดาห์ 1) → Lvl 2 1×60s (สัปดาห์ 2) → Lvl 3 1×90s (สัปดาห์ 3)",
    yt: YS("6rvXIu36E0k"),
    muscles: mm("quads", "glutes"),
  }),
  L("fr-bridge", "Foam roller bridge", {
    type: "hold",
    sets: 2,
    lo: 30,
    hi: 30,
    yt: YS("IWjbxCUhfnw"),
    muscles: mm("glutes hamstrings"),
  }),
  C("wall-slide", "Wall slide", "2×10"),
  L("push-up", "Push-up", {
    type: "bw",
    sets: 3,
    lo: 8,
    hi: 15,
    max: true,
    cls: "c",
    startReps: [19, 13, 10],
    note: "Max reps · หยุดเมื่อฟอร์มเริ่มเสีย",
    muscles: mm("chest", "triceps front-delts abs serratus"),
  }),
  L("pull-up", "Pull-up", {
    type: "bw",
    sets: 3,
    lo: 4,
    hi: 8,
    max: true,
    cls: "c",
    startReps: [6, 5, 4],
    note: "Max reps · หยุดเมื่อฟอร์มเริ่มเสีย",
    muscles: mm("lats", "biceps mid-back forearms"),
  }),
  L("incline-db", "Incline DB press", {
    sets: 3,
    lo: 8,
    hi: 10,
    cls: "c",
    startKg: [5],
    muscles: mm("chest", "front-delts triceps"),
  }),
  L("face-pull", "Face pull", {
    sets: 2,
    lo: 12,
    hi: 15,
    startKg: [13],
    muscles: mm("rear-delts", "mid-back traps"),
  }),
  L("hammer-curl", "Hammer curl", {
    sets: 3,
    lo: 10,
    hi: 12,
    startKg: [7],
    muscles: mm("biceps forearms"),
  }),
  L("oh-triceps", "OH triceps extension", {
    sets: 3,
    lo: 10,
    hi: 12,
    startKg: [10],
    muscles: mm("triceps"),
  }),
  L("plank", "Plank", { type: "hold", sets: 3, lo: 30, hi: 45, muscles: mm("abs", "obliques") }),
  C("pogo", "Pogo", "2×15", { yt: Y("NBY9-kTuHEk"), muscles: mm("calves") }),
  C("tall-stance", "Tall stance landing", "2×5", {
    yt: Y("AqoU-Z37I3c"),
    muscles: mm("quads", "glutes"),
  }),
  L("deadlift", "Conventional deadlift", {
    sets: 2,
    lo: 8,
    hi: 10,
    cls: "c",
    startKg: [10],
    muscles: mm("hamstrings glutes lower-back", "traps quads forearms"),
  }),
  L("sl-leg-press", "SL leg press", {
    sets: 3,
    lo: 8,
    hi: 10,
    cls: "c",
    startKg: [10, 15, 15],
    yt: YS("LbKwZIbVYZI"),
    muscles: mm("quads", "glutes"),
  }),
  L("sl-deadlift", "SL deadlift", {
    sets: 3,
    lo: 8,
    hi: 8,
    cls: "c",
    startKg: [24],
    yt: YS("s32cCgmRV3I"),
    muscles: mm("hamstrings glutes", "lower-back"),
  }),
  L("ham-curl", "Hamstring curl", {
    sets: 3,
    lo: 8,
    hi: 12,
    startKg: [30],
    muscles: mm("hamstrings", "calves"),
  }),
  L("calf-raise", "Standing calf raise", { sets: 3, lo: 12, hi: 15, muscles: mm("calves") }),
];
const it = (ex, tag) => ({ ex, tag: tag || "" });
function D(name, focus, sections) {
  return { name, focus, rest: false, restNotes: [], sections };
}
function R(name, focus, notes) {
  return { name, focus, rest: true, restNotes: notes, sections: {} };
}
// Phase 1 · Build Capacity: Upper / Lower alternating Mon–Sat, Sunday rest.
// Zone 2 runs sit on Mon + Fri (upper days, so legs are fresh; 3–4 days apart).
function defaultProgram() {
  const upper = (name) =>
    D(name, "Serratus / Strength", {
      breathing: [it("fr-wall-slide"), it("serratus-pushup"), it("serratus-punch")],
      mobility: [it("landmine-press"), it("sa-cable-row"), it("bottoms-up-kb"), it("db-pullover")],
      strength: [it("push-up"), it("pull-up")],
    });
  const lower = (name) =>
    D(name, "Knee / Run", {
      warmup: [it("bike")],
      kneeprep: [it("hammy-floss"), it("rf-iso"), it("a-walk")],
      strength: [it("sl-wall-sit"), it("fr-bridge"), it("split-squat")],
    });
  const withRun = (d) => {
    d.sections.cardio = [it("z2-run")];
    return d;
  };
  return {
    v: 2,
    title: PHASE1.title,
    bpId: PHASE1.id,
    secs: [
      { id: "warmup", name: "Warm-up" },
      { id: "kneeprep", name: "Knee prep" },
      { id: "breathing", name: "Breathing drills" },
      { id: "mobility", name: "Loaded mobility" },
      { id: "strength", name: "Strength" },
      { id: "cardio", name: "Cardio" },
    ],
    ex: Object.fromEntries(DEF_EX.map((e) => [e.id, clone(e)])),
    days: {
      mon: withRun(upper("Upper D1")),
      tue: lower("Lower D1"),
      wed: upper("Upper D2"),
      thu: lower("Lower D2"),
      fri: withRun(upper("Upper D3")),
      sat: lower("Lower D3"),
      sun: R("Rest", "Recovery", [
        "Light walking",
        "Gentle mobility",
        "Adequate sleep",
        "Calorie surplus",
      ]),
    },
  };
}
