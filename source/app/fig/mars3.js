/**
 * The descent module of Mars-3, the first soft landing on Mars (1971): the wide cone of the
 * aerodynamic shield on a museum cradle and the round landing station on top, wrapped in four
 * petals. The pointer's x opens the petals outwards, the way the station stood itself up on the
 * ground before it sent its signal; the antenna rods rise with them.
 * What the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, circ, clamp, facing, fit, hull, open, poly, prism, proj, rad, put, solid, seg,
  spring, stepS, disposer, mk, pointer, register,
} = HL;

const NAMES = ["станция", "лепестки", "аэроэкран", "антенны"];
const Z0 = 3, RC = 12, ZT = 12, RT = 4.2, ZS = 16, RS = 4.6;
const ringZ = (P, r, z, n = 48) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(r * Math.cos(t), r * Math.sin(t), z); });

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let amax = value;
  const C = Cam(45, 0.5, 6.4);
  fit(C, [[-RC, 0, Z0], [RC, 0, Z0], [0, -RC, Z0], [0, RC, Z0], [0, 0, ZS + RS + 9], [0, 0, 0]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg), el = {};
  const pth = (d, cls) => mk("path", { d, class: cls }, g);
  // cradle, then the shield: a cone from its wide rim to the flat top it carries the station on
  { const s = solid(g); put(s, prism(P, front, circ(7, 28), circ(6.3, 28), 0, Z0)); }
  el.cone = pth(poly(hull(ringZ(P, RC, Z0).concat(ringZ(P, RT, ZT)))), "sil");
  pth(open(HL.run(circ(RC - 1, 48), front).map((q) => P(q.u, q.v, Z0 + 0.4))) + open(HL.run(circ(RT, 40), front).map((q) => P(q.u, q.v, ZT))), "nf lo");
  // petals: a petal is hinged on the station's waist and swings from upright to lying on the cone
  const PET = [0, 1, 2, 3].map((k) => (k / 4) * 2 * Math.PI + Math.PI / 4);
  const petal = (a, phi) => { const c = Math.cos(a), s = Math.sin(a), hz = ZS - 1.2, r0 = RS * 0.95, L = 6.4, w = 3.1;
    const out = [Math.sin(phi), Math.cos(phi)]; // radial, up
    const pts = [[r0, -w], [r0, w], [r0 + out[0] * L * 0.55, w * 0.7, out[1] * L * 0.55], [r0 + out[0] * L, 0, out[1] * L], [r0 + out[0] * L * 0.55, -w * 0.7, out[1] * L * 0.55]];
    return pts.map(([u, v, z = 0]) => P(u * c - v * s, u * s + v * c, hz + z)); };
  const behind = PET.filter((a) => Math.cos(a) + Math.sin(a) < 0), ahead = PET.filter((a) => Math.cos(a) + Math.sin(a) >= 0);
  const pb = behind.map(() => pth("", "sil")), ants = pth("", "nf");
  const o = P(0, 0, ZS), e = P(RS * 0.7071, -RS * 0.7071, ZS), rr = Math.hypot(e[0] - o[0], e[1] - o[1]);
  el.ball = mk("ellipse", { cx: o[0].toFixed(2), cy: o[1].toFixed(2), rx: rr.toFixed(2), ry: rr.toFixed(2), class: "sil" }, g);
  pth(open(HL.run(circ(RS, 40), front).map((q) => P(q.u, q.v, ZS - 1.2))), "nf lo");
  const pa = ahead.map(() => pth("", "sil"));
  el.petals = pb.concat(pa);
  function build(deg) {
    const phi = rad(deg);
    behind.forEach((a, k) => pb[k].setAttribute("d", poly(petal(a, phi))));
    ahead.forEach((a, k) => pa[k].setAttribute("d", poly(petal(a, phi))));
    const f = clamp((deg - 12) / 90, 0, 1), top = ZS + RS * 0.8;
    ants.setAttribute("d", f > 0.05 ? seg(P(0.8, -1.2, top), P(0.8 + 1.5 * f, -1.2 - 2.5 * f, top + 7 * f)) + seg(P(-1.2, 0.8, top), P(-1.2 - 2.5 * f, 0.8 + 1.5 * f, top + 7 * f)) : "");
  }
  let cur = -1;
  function light(k) { cur = k; el.ball.classList.toggle("hi", k === 0 || k < 0); el.petals.forEach((x) => x.classList.toggle("hi", k === 1)); el.cone.classList.toggle("hi", k === 2); ants.classList.toggle("hi", k === 3); }
  const sp = spring(12);
  let drawn = NaN;
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; build(sp.x); } return m; });
  bag.add(B.unregister);
  // fixed points of the closed pose (rule 01)
  const A = [[0, 0, ZS, 3.5], [3.5, 3.5, ZS + 2, 3], [7, 7, Z0 + 3, 4], [0, 0, ZS + 9, 2.5]];
  function hit([sx, sy]) { let best = -1, bd = 1e9; A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 6.4 * 1.2); if (d < 1 && d < bd) { bd = d; best = k; } }); return best; }
  function move(p) { sp.t = 12 + clamp((p[0] - 110) / 180, 0, 1) * (amax - 12); const k = hit(p); if (k !== cur) { light(k); read.textContent = k < 0 ? "rest" : NAMES[k]; } B.wake(); }
  function leave() { sp.t = 12; light(-1); read.textContent = "rest"; B.wake(); }
  build(12); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { amax = v; sp.t = Math.min(sp.t, amax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "mars3",
  means: "Спускаемый аппарат «Марс-3»: палец раскрывает лепестки станции на конусе аэродинамического экрана.",
  rules: [1, 5, 6, 9],
  range: [90, 105, 120],
  tour: [[150, 200], [230, 140], [280, 220], null],
  mount,
});
