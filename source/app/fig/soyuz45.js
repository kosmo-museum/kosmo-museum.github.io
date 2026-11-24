/**
 * Soyuz-4 and Soyuz-5, docked nose to nose as in January 1969: on each ship the ball of the orbital
 * module with its hatch, the bell of the descent module, the service module with its flared skirt
 * and a pair of solar wings. The pointer's x walks two crew dots out of Soyuz-5's hatch, over the
 * docking node and into Soyuz-4: Yeliseyev and Khrunov changed ships through open space.
 * What the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rrect, seg, flatDot, place, put, solid,
  spring, stepS, disposer, mk, pointer, register,
} = HL;

const Z0 = 14, RB = 5.4, XB = 6.6, X1 = 13, X2 = 20, X3 = 30, RS0 = 3.4, RS1 = 6.4, RP = 6.6, RF = 7.6;
const NAMES = ["стыковка", "БО-5", "СА-5", "ПАО-5", "батареи-5", "БО-4", "СА-4", "ПАО-4", "батареи-4", "переход"];

const ringX = (P, x, r, z = Z0, n = 30) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x, r * Math.cos(t), z + r * Math.sin(t)); });
const tubeX = (P, x0, x1, r0, r1) => poly(hull(ringX(P, x0, r0).concat(ringX(P, x1, r1))));
/** the near half of a ring round the x axis: the run that hangs lower on screen */
const nearX = (P, x, r) => { const e = ringX(P, x, r, Z0, 36); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; });
  const f = [], b = []; for (let i = iL; ; i = (i + 1) % 36) { f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i + 35) % 36) { b.push(e[i]); if (i === iR) break; }
  const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gap = value;
  const C = Cam(45, 0.5, 3.9);
  fit(C, [[-X3, -27, Z0], [X3, 27, Z0], [-X3, 0, Z0 - RF], [X3, 0, Z0 + RF], [0, 0, Z0 + RB + 9], [-X3, 0, 0], [X3, 0, 0]], 200, 166);
  const P = proj(C);
  const g = mk("g", {}, svg), el = {};
  const pth = (d, cls, par = g) => mk("path", { d, class: cls }, par);
  const ball = (x, r) => { const o = P(x, 0, Z0), e = P(x + r * 0.7071, -r * 0.7071, Z0), rr = Math.hypot(e[0] - o[0], e[1] - o[1]);
    return mk("ellipse", { cx: o[0].toFixed(2), cy: o[1].toFixed(2), rx: rr.toFixed(2), ry: rr.toFixed(2), class: "sil" }, g); };
  // museum stands, one under each service module
  const front = facing(C);
  for (const s of [-1, 1]) { const x = s * 25; put(solid(g), prism(P, front, rrect(x - 2.6, -4.2, x + 2.6, 4.2, 1.6, 5), rrect(x - 1.9, -3.5, x + 1.9, 3.5, 1, 5), 0, Z0 - RP + 0.4)); }
  // a solar wing: mast from the skirt, the plate, its cells (side -1 is the far one)
  const wing = (s, side) => { const x = s * 25.5, w = 3, y0 = side * (RP + 2), y1 = side * 27;
    pth(seg(P(x, side * RP, Z0), P(x, y0, Z0)), "nf");
    const el2 = pth(poly([[x - w, y0], [x + w, y0], [x + w, y1], [x - w, y1]].map(([a, b]) => P(a, b, Z0))), "sil");
    pth([0.25, 0.5, 0.75].map((f) => seg(P(x - w, y0 + (y1 - y0) * f, Z0), P(x + w, y0 + (y1 - y0) * f, Z0))).join("") + seg(P(x, y0, Z0), P(x, y1, Z0)), "nf lo"); return el2; };
  el.wings = { 1: [], [-1]: [] };
  for (const s of [-1, 1]) el.wings[s].push(wing(s, -1));
  // one ship from its far end in: service module, descent module, orbital module
  const ship = (s) => {
    const pao = pth(tubeX(P, s * (X3 - 2.2), s * X3, RP, RF) + tubeX(P, s * X2, s * (X3 - 2.2), RP, RP), "sil");
    pth(nearX(P, s * (X3 - 2.2), RP) + nearX(P, s * (X2 + 4), RP), "nf lo");
    if (s < 0) el.wings[s].push(wing(s, 1));
    const sa = pth(tubeX(P, s * X1, s * X2, RS0, RS1), "sil");
    pth(nearX(P, s * (X2 - 0.6), RS1 - 0.2), "nf");
    const bo = ball(s * XB, RB);
    // the side hatch of the orbital module, on its top, and the antennas
    const hz = Z0 + RB * 0.92, hx = s * (XB + 1.2);
    pth(poly(Array.from({ length: 16 }, (_, k) => { const t = (k / 16) * 2 * Math.PI; return P(hx + 1.4 * Math.cos(t), 1.4 * Math.sin(t), hz + 0.4); })), "nf");
    pth(seg(P(s * (XB + 3.5), -3.2, Z0 + 3.8), P(s * (XB + 6), -6, Z0 + 8)) + seg(P(s * (XB + 3.5), 3.2, Z0 + 3.8), P(s * (XB + 6), 6, Z0 + 8)), "nf lo");
    return { pao, sa, bo };
  };
  el.s4 = ship(-1);
  // the docking node: probe into drogue, bright at rest
  el.dock = pth(tubeX(P, -1.4, 1.4, 1.6, 1.6), "sil");
  el.s5 = ship(1);
  el.wings[1].push(wing(1, 1));
  // the crossing: a guide over both balls, and two crew dots on it
  const path = (t) => { const a = Math.PI * clamp(t, 0, 1), x = XB * Math.cos(a), z = Z0 + RB + 0.6 + 4.6 * Math.sin(a); return P(x, 1.5, z); };
  el.guide = pth(open(Array.from({ length: 25 }, (_, k) => path(k / 24))), "dash nf");
  const crew = [flatDot(g, C, 1.15, "dot"), flatDot(g, C, 1.15, "dot")];

  let cur = -1;
  function light(a) {
    cur = a;
    const S5 = el.s5, S4 = el.s4;
    el.dock.classList.toggle("hi", a === 0 || a < 0);
    S5.bo.classList.toggle("hi", a === 1); S5.sa.classList.toggle("hi", a === 2); S5.pao.classList.toggle("hi", a === 3);
    S4.bo.classList.toggle("hi", a === 5); S4.sa.classList.toggle("hi", a === 6); S4.pao.classList.toggle("hi", a === 7);
    el.wings[1].forEach((w) => w.classList.toggle("hi", a === 4)); el.wings[-1].forEach((w) => w.classList.toggle("hi", a === 8));
    el.guide.classList.toggle("hi", a === 9);
  }
  const sp = spring(0.1);
  let drawn = NaN;
  const draw = (t) => { crew.forEach((d, k) => { const u = clamp(t - k * gap, 0, 1); place(d, path(u)); d.setAttribute("class", u <= 0.001 || u >= 0.999 ? "dot m" : "dot"); }); };
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  // parts never move; only the crew does (rule 01)
  const A = [[0, 0, Z0, 3], [XB, 0, Z0, 5], [16.5, 0, Z0, 5], [25, 0, Z0, 6.5], [25.5, 18, Z0, 7], [-XB, 0, Z0, 5], [-16.5, 0, Z0, 5], [-25, 0, Z0, 6.5], [-25.5, -18, Z0, 7], [0, 1.5, Z0 + RB + 5.2, 3.2]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 3.9 * 1.2); if (d < 1 && d < bd) { bd = d; best = k; } }); return best; }
  function move(p) {
    sp.t = clamp((300 - p[0]) / 200, 0, 1) + gap;
    const a = hit(p);
    if (a !== cur) { light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0.1; light(-1); read.textContent = "rest"; B.wake(); }
  draw(sp.x); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { gap = v; drawn = NaN; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "soyuz45",
  means: "«Союз-4» и «Союз-5» в стыковке: палец ведёт двух космонавтов по обшивке из одного корабля в другой.",
  rules: [1, 4, 5, 6],
  range: [0.12, 0.18, 0.24],
  tour: [[290, 200], [215, 120], [130, 120], null],
  mount,
});
