/**
 * The airlock of Mir: a pressurised cylinder on museum cradles, a docking cone at the far end,
 * handrails along its side and, on the near end, the wide hatch cosmonauts went out through.
 * The pointer's x lifts that hatch open on its hinge, outwards, and a crew dot waits inside.
 * What the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rad, rrect, seg, flatDot, place, put, solid,
  spring, stepS, disposer, mk, pointer, register,
} = HL;

const Z0 = 15, R = 9.5, XA = -16, XE = 14, RH = 5.2, TH = 1.1;
const NAMES = ["люк", "отсек", "поручни", "стыковка", "космонавт"];

const ringX = (P, x, r, z = Z0, n = 36, yo = 0) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x, yo + r * Math.cos(t), z + r * Math.sin(t)); });
const tubeX = (P, x0, x1, r0, r1) => poly(hull(ringX(P, x0, r0).concat(ringX(P, x1, r1))));
const nearX = (P, x, r) => { const e = ringX(P, x, r); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; });
  const f = [], b = [], n = e.length; for (let i = iL; ; i = (i + 1) % n) { f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i + n - 1) % n) { b.push(e[i]); if (i === iR) break; }
  const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let amax = value;
  const C = Cam(45, 0.5, 5.6);
  fit(C, [[XA - 7, 0, Z0], [XE + RH * 2.1, 0, Z0 + RH], [0, -R, Z0], [0, R, Z0], [0, 0, Z0 + R], [XA, 0, 0], [XE, 0, 0]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg), el = {};
  const pth = (d, cls) => mk("path", { d, class: cls }, g);
  // cradles under the hull
  for (const x of [XA + 7, XE - 7]) put(solid(g), prism(P, front, rrect(x - 2.2, -6.5, x + 2.2, 6.5, 1.6, 5), rrect(x - 1.5, -5.8, x + 1.5, 5.8, 1, 5), 0, Z0 - R * 0.72));
  // docking cone and its ring at the far end
  el.dock = pth(tubeX(P, XA - 6, XA, 3.6, R - 1.5) + tubeX(P, XA - 7, XA - 6, 3.2, 3.2), "sil");
  pth(nearX(P, XA - 6, 3.6), "nf lo");
  // the hull with its seams and the handrails along the near side
  el.hull = pth(tubeX(P, XA, XE, R, R), "sil");
  pth(nearX(P, XA + 1.2, R) + nearX(P, -2, R) + nearX(P, XE - 1.2, R), "nf lo");
  const rail = (a) => { const y = R * Math.cos(a) * 1.08, z = Z0 + R * Math.sin(a) * 1.08; return seg(P(XA + 3, y, z), P(XE - 3, y, z)) + [XA + 3, -2, XE - 3].map((x) => seg(P(x, y / 1.08, z - (z - Z0) * 0.074), P(x, y, z))).join(""); };
  el.rails = pth(rail(rad(55)) + rail(rad(20)), "nf");
  // the end face: rim, the opening, the crew dot inside, then the hatch over them
  pth(poly(ringX(P, XE + 0.01, R - 0.9)), "nf lo");
  pth(poly(ringX(P, XE + 0.02, RH + 0.8)), "nf");
  const hole = pth(poly(ringX(P, XE + 0.03, RH)), "");
  const crew = flatDot(g, C, 1.5, "dot off"); place(crew, P(XE - 0.5, 0.5, Z0 - 1.6));
  el.hatch = pth("", "sil"); const hb = pth("", "nf"), hh = pth("", "nf lo");

  // the hatch hangs on a hinge along its top edge and lifts outwards, like a lid
  const disc = (a, off, r = RH, n = 36) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI, dz = r * Math.sin(t) - RH;
    return P(XE + off * Math.cos(a) - dz * Math.sin(a), r * Math.cos(t), Z0 + RH + dz * Math.cos(a) + off * Math.sin(a)); });
  function build(deg) {
    const a = rad(deg);
    el.hatch.setAttribute("d", poly(hull(disc(a, 0).concat(disc(a, TH)))));
    hb.setAttribute("d", poly(disc(a, TH, RH - 0.9)));
    hh.setAttribute("d", seg(...[[-0.4, 0.6], [0.4, 0.6]].map(([u]) => disc(a, TH + 0.6, RH * 0.55 + u)[0])));
    crew.setAttribute("class", deg > 25 ? "dot m" : "dot off");
  }
  let cur = -1;
  function light(k) {
    cur = k;
    el.hatch.classList.toggle("hi", k === 0 || k < 0); el.hull.classList.toggle("hi", k === 1); el.rails.classList.toggle("hi", k === 2); el.dock.classList.toggle("hi", k === 3);
    hole.setAttribute("class", k === 4 ? "hi" : "");
  }
  const sp = spring(12);
  let drawn = NaN;
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; build(sp.x); } return m; });
  bag.add(B.unregister);
  // hit test on fixed points of the closed pose (rule 01)
  const A = [[XE, 0, Z0, 5], [-2, 0, Z0, 8], [-2, R * 0.62, Z0 + R * 0.88, 4], [XA - 5, 0, Z0, 4], [XE - 1, 0, Z0 - 1.6, 2.6]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 5.6 * 1.15); if (d < 1 && d < bd) { bd = d; best = k; } }); return best; }
  function move(p) {
    sp.t = clamp((p[0] - 90) / 200, 0, 1) * amax;
    const k = hit(p);
    if (k !== cur) { light(k); read.textContent = k < 0 ? "rest" : NAMES[k]; }
    B.wake();
  }
  function leave() { sp.t = 12; light(-1); read.textContent = "rest"; B.wake(); }
  build(sp.x); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { amax = v; sp.t = Math.min(sp.t, amax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "airlock",
  means: "Шлюзовой отсек «Мира»: палец открывает широкий выходной люк, за ним ждёт космонавт.",
  rules: [1, 5, 6, 9],
  range: [70, 100, 130],
  tour: [[160, 170], [260, 170], [300, 190], null],
  mount,
});
