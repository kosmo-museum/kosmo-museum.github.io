/**
 * Baikonur, pad 1 «Gagarin's Start», with the Soyuz on it: the pad over its flame pit, the core
 * block with its waist, four conical strap-ons, the upper stage, the fairing and escape tower;
 * four support trusses («the tulip») holding the rocket by its strap-ons and two service towers.
 * The pointer's x makes it ready: the towers swing away, then the trusses open outward.
 * Hit areas are the rest pose; the rocket is bright at rest.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, proj, prism, rings, put, solid, seg, spring, stepS, disposer, mk, pointer, register,
} = HL;

const ZP = 3, RB0 = 1.5, BD0 = 2.85, BD1 = 1.65, ZB1 = ZP + 21, HT = 36, XTW = 8.5;
const NAMES = ["Союз", "блок Б", "блок В", "блок Г", "блок Д", "ферма", "башня", "стол"];
// strap-ons, far to near: unit direction from the core
const DIRS = [[0, -1], [-1, 0], [1, 0], [0, 1]];

const ringZ = (P, x, y, r, z, n = 24) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x + r * Math.cos(t), y + r * Math.sin(t), z); });
const body = (P, st) => poly(hull(st.flatMap(([x, y, r, z]) => ringZ(P, x, y, r, z))));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 5.3, C = Cam(45, 0.5, S);
  fit(C, [[-13, -13, 0], [13, 13, 0], [0, 0, ZP + 49], [-XTW - 12, 0, ZP + 30], [XTW + 12, 0, ZP + 30], [13, 0, ZP + 4], [0, 13, ZP + 4]], 200, 166);
  const P = proj(C);
  const front = facing(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  // the pad: a square table over the flame pit, its opening a crease
  const pad = solid(g);
  const [ring, inner] = rings(-11, -11, 11, 11, 2.2, 1.4);
  put(pad, prism(P, front, ring, inner, 0, ZP));
  pth("nf lo", poly([[-4, -4], [4, -4], [4, 4], [-4, 4]].map(([x, y]) => P(x, y, ZP))));
  // moving parts, made in paint order: far tower, far trusses, far strap-ons, core, near ones
  const tw = (s) => ({ s, sil: pth("sil"), cr: pth("nf lo") });
  const arm = (k) => ({ k, sil: pth("sil") });
  const T1 = tw(-1), A = [], Bl = [];
  A[0] = arm(0); A[1] = arm(1);
  const strap = (k) => { const [dx, dy] = DIRS[k];
    pth("nf", body(P, [[dx * BD0, dy * BD0, 0.9, ZP + 0.2], [dx * BD0, dy * BD0, 0.6, ZP + 1.4]]));
    const e = pth("sil", body(P, [[dx * BD0, dy * BD0, RB0, ZP + 1.4], [dx * (BD0 - 0.15), dy * (BD0 - 0.15), RB0, ZP + 5], [dx * BD1, dy * BD1, 0.25, ZB1]]));
    pth("nf lo", open(ringZ(P, dx * BD0, dy * BD0, RB0 - 0.1, ZP + 2.2).filter((_, i) => i < 12)));
    return e; };
  Bl[0] = strap(0); Bl[1] = strap(1);
  pth("nf", body(P, [[0, 0, 0.8, ZP + 0.2], [0, 0, 0.6, ZP + 1.4]]));
  const core = pth("sil", body(P, [[0, 0, 1.25, ZP + 1.4], [0, 0, 1.15, ZP + 6], [0, 0, 1.5, ZP + 26]]) + body(P, [[0, 0, 1.5, ZP + 26], [0, 0, 1.38, ZP + 27.5], [0, 0, 1.38, ZP + 34]])
    + body(P, [[0, 0, 1.38, ZP + 34], [0, 0, 1.6, ZP + 35], [0, 0, 1.6, ZP + 41.5], [0, 0, 0.5, ZP + 45]]) + body(P, [[0, 0, 0.25, ZP + 45], [0, 0, 0.12, ZP + 49]]));
  pth("nf lo", [ZP + 26, ZP + 27.5, ZP + 34, ZP + 35].map((z) => open(ringZ(P, 0, 0, 1.45, z).filter((p, i) => i >= 0 && i <= 12))).join("")
    + seg(P(-1.1, 1.1, ZP + 27.5), P(-1.1, 1.1, ZP + 34)));
  Bl[2] = strap(2); Bl[3] = strap(3);
  A[2] = arm(2); A[3] = arm(3);
  const T2 = tw(1);
  // a truss: hinged on the pad rim, its head on the strap-on at z 16; opens outward by u
  const drawArm = (a, u) => { const [dx, dy] = DIRS[a.k], [tx, ty] = [-dy, dx], R0 = 7.5, th0 = Math.atan2(R0 - (BD0 + 1.6), 13.5), th = th0 - u * 1.25, L = Math.hypot(R0 - BD0 - 1.6, 13.5);
    const hx = R0 - L * Math.sin(th), hz = ZP + L * Math.cos(th), w = 0.55, at = (r, z, o) => P(dx * r + tx * o, dy * r + ty * o, z);
    a.sil.setAttribute("d", poly([at(R0 + 0.6, ZP, -w), at(R0 + 0.6, ZP, w), at(hx, hz, w), at(hx, hz, -w)])); };
  // a service tower: a lattice plate in the y-z plane at x = s·XTW, hinged at its foot, falling outward by u
  const drawTower = (t, u) => { const s = t.s, ph = u * 0.95, x0 = s * (XTW + 1.4), w = 1.8;
    const at = (h, y, d = 0) => P(x0 + s * h * Math.sin(ph) - s * d * Math.cos(ph), y, ZP + h * Math.cos(ph) + d * Math.sin(ph)), D = XTW + 1.4 - 2.1;
    t.sil.setAttribute("d", poly([at(0, -w), at(0, w), at(HT, w * 0.7), at(HT, -w * 0.7)]) + poly([at(HT - 10, -1.2), at(HT - 10, 1.2), at(HT - 10, 1.2, D), at(HT - 10, -1.2, D)]) + poly([at(HT - 20, -1.2), at(HT - 20, 1.2), at(HT - 20, 1.2, D), at(HT - 20, -1.2, D)]));
    const zz = []; for (let i = 0; i <= 8; i++) zz.push(at((HT * i) / 8, i % 2 ? w * 0.75 : -w * 0.75)); t.cr.setAttribute("d", open(zz)); };
  let drawn = NaN;
  function draw(u) {
    const ut = clamp(u * 1.8, 0, 1), ua = clamp((u - 0.4) / 0.6, 0, 1);
    drawTower(T1, ut); drawTower(T2, ut);
    A.forEach((a) => drawArm(a, ua));
  }
  let cur = -2;
  function light(k) {
    cur = k;
    core.classList.toggle("hi", k === 0 || k < 0);
    Bl.forEach((e, i) => e.classList.toggle("hi", k === 1 + i));
    A.forEach((a) => a.sil.classList.toggle("hi", k === 5));
    T1.sil.classList.toggle("hi", k === 6); T2.sil.classList.toggle("hi", k === 6);
    pad.sil.classList.toggle("hi", k === 7);
  }
  const U0 = 0.04, sp = spring(U0);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  // rest-pose targets: [x, y, z, r, name]
  const T = [[0, 0, ZP + 38, 3, 0], [0, 0, ZP + 30, 2.4, 0], [0, -2.6, ZP + 9, 1.9, 1], [-2.6, 0, ZP + 9, 1.9, 2], [2.6, 0, ZP + 9, 1.9, 3], [0, 2.6, ZP + 9, 1.9, 4],
    [5.4, 0, ZP + 8, 1.6, 5], [0, 5.4, ZP + 8, 1.6, 5], [-XTW - 1.4, 0, ZP + 22, 3.2, 6], [XTW + 1.4, 0, ZP + 22, 3.2, 6], [6, 6, ZP, 3.5, 7], [-6, -6, ZP, 3, 7]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r, n]) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * S * 1.2); if (d < 1 && d < bd) { bd = d; best = n; } }); return best; }
  function move(p) {
    sp.t = clamp(U0 + ((p[0] - 60) / 280) * reach, U0, reach);
    const k = hit(p);
    if (k !== cur) { light(k); read.textContent = k < 0 ? "rest" : NAMES[k]; }
    B.wake();
  }
  function leave() { sp.t = U0; light(-1); read.textContent = "rest"; B.wake(); }
  draw(U0); drawn = U0; light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "baikonur",
  means: "Байконур, «Гагаринский старт»: палец готовит пуск — башни обслуживания отходят, фермы-«тюльпан» раскрываются.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[200, 90], [300, 160], [120, 240], null],
  mount,
});
