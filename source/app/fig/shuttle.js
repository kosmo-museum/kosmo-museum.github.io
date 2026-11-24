/**
 * Space Shuttle on the pad: the external tank with its ogive nose, two solid boosters at its sides,
 * and the orbiter on its front: fuselage, double-delta wing, tail fin, three main engines.
 * The pointer's x plays ascent staging: the boosters fall away, then the orbiter leaves the tank.
 * Hit areas are the rest pose; the orbiter is bright at rest.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, put, rings, seg, solid, spring, stepS, disposer, mk, pointer, register,
} = HL;

const RT = 4.2, ZT0 = 3, ZT1 = 44, RS = 1.85, YS = RT + RS + 0.4, ZS1 = 40, XO = RT + 3.2, RO = 2.5, ZO0 = 7, ZO1 = 34;
const NAMES = ["орбитер", "внешний бак", "ускоритель", "ускоритель", "крыло", "киль", "двигатели"];
const ringZ = (P, x, y, r, z, n = 26) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x + r * Math.cos(t), y + r * Math.sin(t), z); });
const body = (P, st) => poly(hull(st.flatMap(([x, y, r, z]) => ringZ(P, x, y, r, z))));
const halfZ = (P, x, y, r, z) => open(ringZ(P, x, y, r, z, 36).filter((_, i) => i <= 18));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 5.3, C = Cam(45, 0.5, S);
  fit(C, [[-8, -8, 0], [8, 8, 0], [0, 0, ZT1 + 6], [XO + 9, 0, ZO1 + 6], [0, YS + 9, ZS1 - 8], [0, -YS - 9, ZS1 - 8], [XO + 9, 14, ZO0]], 200, 164);
  const P = proj(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  // the mobile launcher platform under the stack
  const [ring, inner] = rings(-8, -10, 8, 10, 1.6, 1.2);
  const pad = solid(g); put(pad, prism(P, facing(C), ring, inner, 0, ZT0 - 0.4));
  // paint: far booster, tank, near booster, orbiter's engines, wing, fuselage, fin
  const srb = () => ({ noz: pth("nf"), sil: pth("sil"), cr: pth("nf lo") });
  const B1 = srb();
  const tank = pth("sil", body(P, [[0, 0, RT, ZT0], [0, 0, RT, ZT1 - 9], [0, 0, 3.2, ZT1 - 4], [0, 0, 0.9, ZT1], [0, 0, 0.3, ZT1 + 1.2]]));
  pth("nf lo", halfZ(P, 0, 0, RT, ZT1 - 9) + halfZ(P, 0, 0, RT, 22) + halfZ(P, 0, 0, RT, ZT0 + 1.2));
  const B2 = srb();
  const eng = pth("sil"), wing = pth("sil"), wcr = pth("nf lo"), fus = pth("sil"), fcr = pth("nf lo"), fin = pth("sil"), ficr = pth("nf lo");
  let drawn = NaN;
  function draw(u) {
    const ub = clamp(u * 1.8, 0, 1), uo = clamp((u - 0.35) / 0.65, 0, 1);
    [[B1, -1], [B2, 1]].forEach(([b, s]) => { const y = s * (YS + 6 * ub), z = -5 * ub, x = -1.5 * ub;
      b.noz.setAttribute("d", body(P, [[x, y, 1.5, ZT0 - 2.4 + z], [x, y, 0.9, ZT0 + z]]));
      b.sil.setAttribute("d", body(P, [[x, y, RS, ZT0 + z], [x, y, RS, ZS1 - 3 + z], [x, y, 0.35, ZS1 + 1 + z]]));
      b.cr.setAttribute("d", [12, 22, 32].map((h) => halfZ(P, x, y, RS, ZT0 + h + z)).join("")); });
    const dx = 7 * uo, dz = 3 * uo, X = XO + dx, at = (x, y, z) => P(x + dx, y, z + dz);
    eng.setAttribute("d", [[-1.2, 0], [1.2, 0], [0, 1.3]].map(([y, xo]) => body(P, [[X + xo, y, 0.95, ZO0 - 3 + dz], [X + xo, y, 0.5, ZO0 + dz]])).join(""));
    const W = [[ZO0, 1.5], [ZO0, 11.8], [ZO0 + 4, 11.8], [ZO0 + 15, 4.3], [ZO0 + 21, 2]];
    wing.setAttribute("d", poly(W.concat(W.slice().reverse().map(([z, y]) => [z, -y])).map(([z, y]) => at(XO - RO + 0.7, y, z))));
    wcr.setAttribute("d", open([[ZO0 + 0.8, 10.6], [ZO0 + 4.2, 10.6], [ZO0 + 14.6, 3.9]].map(([z, y]) => at(XO - RO + 0.7, y, z))));
    fus.setAttribute("d", body(P, [[X, 0, RO, ZO0 + dz], [X, 0, RO, ZO1 - 3 + dz], [X - 0.4, 0, 1.3, ZO1 + 1 + dz], [X - 0.8, 0, 0.3, ZO1 + 2.4 + dz]]));
    fcr.setAttribute("d", seg(at(XO + RO, 0, ZO0 + 2), at(XO + RO, 0, ZO1 - 8)) + halfZ(P, X, 0, RO, ZO1 - 3 + dz)
      + open([[-1.4, ZO1 - 1.6], [-1.6, ZO1 - 0.4], [1.6, ZO1 - 0.4], [1.4, ZO1 - 1.6]].map(([y, z]) => at(XO + 1.7, y, z))));
    fin.setAttribute("d", poly([[XO + RO - 0.3, ZO0 + 0.6], [XO + RO + 8, ZO0 - 1.4], [XO + RO + 8, ZO0 + 2.2], [XO + RO - 0.2, ZO0 + 9]].map(([x, z]) => at(x, 0, z))));
    ficr.setAttribute("d", seg(at(XO + RO + 1, 0, ZO0 + 0.8), at(XO + RO + 7.2, 0, ZO0 - 0.6)));
  }
  let cur = -2;
  function light(k) {
    cur = k;
    fus.classList.toggle("hi", k === 0 || k < 0); tank.classList.toggle("hi", k === 1);
    B1.sil.classList.toggle("hi", k === 2); B2.sil.classList.toggle("hi", k === 3);
    wing.classList.toggle("hi", k === 4); fin.classList.toggle("hi", k === 5); eng.classList.toggle("hi", k === 6);
  }
  const U0 = 0.05, sp = spring(U0);
  const L = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(L.unregister);
  const T = [[XO, 0, 24, 3.6, 0], [0, 0, 38, 4, 1], [0, -YS, 26, 2.4, 2], [0, YS, 26, 2.4, 3], [XO - 1.8, 8.5, ZO0 + 2, 2.8, 4], [XO + 6, 0, ZO0 + 1.5, 2.4, 5], [XO + 1, 0, ZO0 - 2, 1.8, 6]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r, n]) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * S * 1.2); if (d < 1 && d < bd) { bd = d; best = n; } }); return best; }
  function move(p) {
    sp.t = clamp(U0 + ((p[0] - 80) / 240) * reach, U0, reach);
    const k = hit(p);
    if (k !== cur) { light(k); read.textContent = k < 0 ? "rest" : NAMES[k]; }
    L.wake();
  }
  function leave() { sp.t = U0; light(-1); read.textContent = "rest"; L.wake(); }
  draw(U0); drawn = U0; light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; L.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "shuttle",
  means: "«Спейс шаттл»: палец ведёт выведение — ускорители отходят, орбитер уходит от бака.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[226, 167], [198, 89], [174, 157], null],
  mount,
});
