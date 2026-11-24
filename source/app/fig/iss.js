/**
 * The ISS: the long integrated truss, eight solar wings on four rotary joints at its ends, and the
 * pressurised modules across it — Zvezda with its own small wings, Zarya, Unity, Destiny, Harmony,
 * with Kibo and Columbus off Harmony's sides. The pointer's x turns the wings round the truss,
 * the way the joints track the Sun. Hit areas are the rest pose; the wings are bright at rest.
 */
const {
  Cam, clamp, fit, hull, open, poly, proj, seg, rad, spring, stepS, disposer, mk, pointer, register,
} = HL;

const Z0 = 14, ZM = Z0 - 4.2, XT = 55, WX = [-49, -39, 39, 49], WL = 19, WW = 5;
const NAMES = ["батареи", "ферма", "Звезда", "Заря", "Юнити", "Дестини", "Гармония", "Кибо", "Коламбус"];
// modules along y at x = 0: [y0, y1, r0, r1, name index]
const MODS = [[-34, -27, 1.5, 1.5, 2], [-27, -20, 2.1, 2.1, 2], [-20, -7, 2.05, 2.05, 3], [-7, -2.4, 2.25, 2.25, 4], [-2.4, 6.2, 2.2, 2.2, 5], [6.2, 13, 2.2, 2.2, 6]];

const ringY = (P, y, r, x, z, n = 26) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x + r * Math.cos(t), y, z + r * Math.sin(t)); });
const ringX = (P, x, r, y, z, n = 26) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x, y + r * Math.cos(t), z + r * Math.sin(t)); });
const cylY = (P, y0, y1, r0, r1, x = 0, z = ZM) => poly(hull(ringY(P, y0, r0, x, z).concat(ringY(P, y1, r1, x, z))));
const cylX = (P, x0, x1, r, y, z) => poly(hull(ringX(P, x0, r, y, z).concat(ringX(P, x1, r, y, z))));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 3.15, C = Cam(45, 0.5, S);
  fit(C, [[-XT - 2, -WL - 3, Z0], [XT + 2, WL + 3, Z0], [-XT, 0, Z0 + WL], [XT, 0, Z0 - WL], [0, -34, ZM], [-14, 10, ZM], [10, 10, ZM]], 200, 162);
  const P = proj(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  // a wing on the joint at x, side ±1, turned by a round the truss: blanket, mast, cell lines
  const W = [];
  const mkWing = (x, s) => ({ x, s, sil: pth("sil"), cr: pth("nf lo") });
  const drawWing = (w, a) => { const dy = Math.cos(a) * w.s, dz = Math.sin(a) * w.s, at = (u, v) => P(w.x + v, dy * u, Z0 + dz * u);
    w.sil.setAttribute("d", poly([at(1.6, -WW / 2), at(WL, -WW / 2), at(WL, WW / 2), at(1.6, WW / 2)]));
    w.cr.setAttribute("d", seg(at(1.6, 0), at(WL, 0)) + [0.25, 0.5, 0.75].map((f) => seg(at(1.6 + (WL - 1.6) * f, -WW / 2), at(1.6 + (WL - 1.6) * f, WW / 2))).join("")); };
  // paint order: far wings, Zvezda's wings and the far modules, the truss, the near modules, near wings
  for (const x of WX) W.push(mkWing(x, -1));
  const zw = pth("sil"), zwc = pth("nf lo");
  const mod = {};
  const addMod = ([y0, y1, r0, r1, k]) => { const e = pth("sil", cylY(P, y0, y1, r0, r1)); (mod[k] = mod[k] || []).push(e); };
  MODS.filter((m) => m[1] <= -2.4).forEach(addMod);
  pth("nf lo", [-27, -20, -7].map((y) => open(ringY(P, y, 2.1, 0, ZM).slice(0, 14))).join(""));
  // the S0 link from Destiny up to the truss
  pth("sil", poly(hull([[-1.2, 0.6], [1.2, 0.6], [1.2, 3.2], [-1.2, 3.2]].flatMap(([x, y]) => [P(x, y, ZM + 2), P(x, y, Z0)]))));
  const truss = pth("sil", cylX(P, -XT, XT, 1.15, 0, Z0));
  pth("nf lo", [-30, -14, 14, 30].map((x) => seg(P(x, 1.15, Z0), P(x, 0, Z0 - 1.15))).join("") + seg(P(-XT + 2, 0.8, Z0 + 0.8), P(XT - 2, 0.8, Z0 + 0.8)));
  // the four rotary joints: rings round the truss
  pth("nf", WX.map((x) => cylX(P, x - 0.6, x + 0.6, 1.7, 0, Z0)).join(""));
  // radiators: two plates hanging aft from the truss centre
  pth("sil", [-20, 20].map((x) => poly([P(x - 4, 1.2, Z0 - 0.4), P(x + 4, 1.2, Z0 - 0.4), P(x + 4, 1.2, Z0 - 9), P(x - 4, 1.2, Z0 - 9)])).join(""));
  const kibo = pth("sil", cylX(P, -14, -2.2, 2.2, 10, ZM));
  MODS.filter((m) => m[0] >= -2.4).forEach(addMod);
  pth("nf lo", open(ringY(P, 6.2, 2.2, 0, ZM).slice(0, 14)));
  const colu = pth("sil", cylX(P, 2.2, 9, 2.2, 10, ZM));
  for (const x of WX) W.push(mkWing(x, 1));

  let drawn = NaN;
  function draw(a) {
    W.forEach((w) => drawWing(w, a));
    // Zvezda's own wings, fixed, along x
    zw.setAttribute("d", [-1, 1].map((s) => poly([[s * 2.2, -24], [s * 13, -24], [s * 13, -21.6], [s * 2.2, -21.6]].map(([x, y]) => P(x, y, ZM)))).join(""));
    zwc.setAttribute("d", [-1, 1].map((s) => seg(P(s * 2.2, -22.8, ZM), P(s * 13, -22.8, ZM))).join(""));
  }
  let cur = -2;
  function light(k) {
    cur = k;
    W.forEach((w) => w.sil.classList.toggle("hi", k === 0 || k < 0));
    truss.classList.toggle("hi", k === 1);
    for (const [i, els] of Object.entries(mod)) els.forEach((e) => e.classList.toggle("hi", k === +i));
    kibo.classList.toggle("hi", k === 7); colu.classList.toggle("hi", k === 8);
  }
  const A0 = rad(-38), sp = spring(A0);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  // rest-pose targets (rule 01): [x, y, z, r, name]
  const T = [[-42, 8, Z0 - 6, 7, 0], [42, -8, Z0 + 6, 7, 0], [-42, -8, Z0 + 6, 6, 0], [42, 8, Z0 - 6, 6, 0], [-24, 0, Z0, 3, 1], [24, 0, Z0, 3, 1],
    [0, -26, ZM, 3.6, 2], [0, -13.5, ZM, 3.4, 3], [0, -4.7, ZM, 2.2, 4], [0, 2, ZM, 3, 5], [0, 9.6, ZM, 2.8, 6], [-8, 10, ZM, 3, 7], [5.6, 10, ZM, 2.6, 8]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r, n]) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * S * 1.2); if (d < 1 && d < bd) { bd = d; best = n; } }); return best; }
  function move(p) {
    sp.t = A0 + rad(lerpA(clamp(p[0] / 400, 0, 1)) * reach);
    const k = hit(p);
    if (k !== cur) { light(k); read.textContent = k < 0 ? "rest" : NAMES[k]; }
    B.wake();
  }
  const lerpA = (f) => -40 + 70 * f;
  function leave() { sp.t = A0; light(-1); read.textContent = "rest"; B.wake(); }
  draw(A0); drawn = A0; light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "iss",
  means: "МКС: палец поворачивает солнечные батареи вокруг фермы — так шарниры следят за Солнцем.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[300, 200], [200, 170], [100, 120], null],
  mount,
});
