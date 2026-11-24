/**
 * Vostok, as it stands in the museum: the charred descent sphere resting on a
 * low cradle, its big hatch open with a pale rim and Gagarin's seat inside, a
 * small porthole above, and a stepped viewing platform beside it. The
 * pointer's x pulls the ejection seat out through the hatch on a spring, as
 * it fired at seven kilometres; what the pointer is nearest takes the bright
 * stroke and is named. The slider is how far the seat travels.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, ringAt, run, rrect, circ, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid, flatDot, place,
} = HL;

const R = 30, PL = 3, LEG = 5, ZC = PL + LEG + R * 0.93;
const D = [0.86, -0.22, 0.46].map((x, _, a) => x / Math.hypot(...a)); // the hatch faces up and toward the viewer
const PORT = [0.35, 0.55, 0.76].map((x, _, a) => x / Math.hypot(...a));
const VZOR = [0.66, 0.6, -0.2].map((x, _, a) => x / Math.hypot(...a)); // the «Взор» window at the cosmonaut's feet
const NAMES = ["шар", "люк", "иллюминаторы", "кресло"];

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
/** A ring on the sphere's surface around direction d, angular radius a, pushed out by lift. */
function cap(P, d, a, lift = 0) {
  const u = nrm(cross(d, [0, 0, 1])), v = cross(d, u), r = R + lift, out = [];
  for (let k = 0; k < 32; k++) {
    const t = (k / 32) * 2 * Math.PI, q = [0, 1, 2].map((i) => Math.cos(a) * d[i] + Math.sin(a) * (Math.cos(t) * u[i] + Math.sin(t) * v[i]));
    out.push(P(r * q[0], r * q[1], ZC + r * q[2]));
  }
  return out;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let smax = value;
  const C = Cam(45, 0.5, 2.3);
  const far = (s) => [D[0] * (R + s), D[1] * (R + s), ZC + D[2] * (R + s) + 16];
  fit(C, [[-38, -38, 0], [56, 40, 0], [56, -38, 0], [-38, 40, 0], [0, 0, ZC + R], far(smax)], 200, 172);
  const P = proj(C), front = facing(C);
  const o = P(0, 0, ZC), e = P(R * 0.7071, -R * 0.7071, ZC), sr = Math.hypot(e[0] - o[0], e[1] - o[1]);

  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, rrect(-38, -38, 56, 40, 18, 6), rrect(-36, -36, 54, 38, 16, 6), 0, PL));
  // the cradle: a low ring on short legs under the sphere
  const cr = rrect(-R * 0.55, -R * 0.55, R * 0.55, R * 0.55, R * 0.55, 14), ci = rrect(-R * 0.55 + 1, -R * 0.55 + 1, R * 0.55 - 1, R * 0.55 - 1, R * 0.55 - 1, 14);
  mk("path", { d: [0, 1, 2, 3].map((k) => { const a = Math.PI / 4 + (k * Math.PI) / 2, x = Math.cos(a) * R * 0.52, y = Math.sin(a) * R * 0.52; return seg(P(x, y, PL), P(x, y, PL + LEG)); }).join(""), class: "nf" }, g);
  put(solid(g), prism(P, front, cr, ci, PL + LEG, PL + LEG + 2.2));

  // through the open hatch we see the interior: a plate the shape of the opening, then the seat, then the sphere with the opening cut out (rule 06)
  const hole = cap(P, D, 0.5, 0.3);
  mk("path", { d: poly(hole), class: "fo" }, g);
  const seatG = mk("g", {}, g);
  const seat = solid(seatG), back = solid(seatG), head = solid(seatG);
  const circle = `M${(o[0] - sr).toFixed(2)},${o[1].toFixed(2)}a${sr.toFixed(2)},${sr.toFixed(2)} 0 1,0 ${(2 * sr).toFixed(2)},0a${sr.toFixed(2)},${sr.toFixed(2)} 0 1,0 ${(-2 * sr).toFixed(2)},0Z`;
  const ball = mk("path", { d: circle + poly(hole), "fill-rule": "evenodd", class: "sil" }, g);
  const rimO = mk("path", { d: poly(cap(P, D, 0.62, 0.6)) + poly(hole), "fill-rule": "evenodd", class: "sil" }, g);
  const rimI = mk("path", { d: poly(hole), class: "nf" }, g);
  const port = mk("path", { d: poly(cap(P, PORT, 0.15)), class: "sil" }, g);
  mk("path", { d: poly(cap(P, PORT, 0.1)), class: "nf lo" }, g);
  const vzor = mk("path", { d: poly(cap(P, VZOR, 0.17)), class: "sil" }, g);
  mk("path", { d: poly(cap(P, VZOR, 0.11)), class: "nf lo" }, g);
  const seam = mk("path", { d: open(ringAt(P, run(circ(R * 0.995, 40), front), ZC - R * 0.32)), class: "nf lo" }, g);
  const belt = flatDot(seatG, C, 1.15, "dot off");
  let outside = false;

  // the viewing platform: two grated steps beside the sphere
  const stepA = solid(g), stepB = solid(g);
  // the grated viewing steps stand on the hatch side, as in the hall
  put(stepB, prism(P, front, rrect(30, -24, 42, 6, 4, 5), rrect(31.5, -22.5, 40.5, 4.5, 2.5, 5), PL, PL + 10));
  put(stepA, prism(P, front, rrect(42, -24, 52, 6, 4, 5), rrect(43.5, -22.5, 50.5, 4.5, 2.5, 5), PL, PL + 5));
  mk("path", { d: [-18, -12, -6, 0].map((y) => seg(P(31.5, y, PL + 10), P(40.5, y, PL + 10))).join("") + [-18, -12, -6, 0].map((y) => seg(P(43.5, y, PL + 5), P(50.5, y, PL + 5))).join(""), class: "nf lo" }, g);

  const sp = spring(0.12 * smax);
  let drawn = NaN, pick = -2;
  const at = (s) => { const k = R * 0.38 + s; return [D[0] * k, D[1] * k, ZC + D[2] * k - 8]; };
  function draw() {
    if (sp.x === drawn) return;
    drawn = sp.x;
    const [x, y, z] = at(sp.x);
    put(seat, prism(P, front, rrect(x - 5, y - 5, x + 5, y + 5, 2.5, 5), rrect(x - 4, y - 4, x + 4, y + 4, 1.5, 5), z, z + 4));
    put(back, prism(P, front, rrect(x - 6, y - 5, x - 3, y + 5, 1.4, 4), rrect(x - 5.4, y - 4.4, x - 3.6, y + 4.4, 0.8, 4), z, z + 15));
    put(head, prism(P, front, rrect(x - 6.2, y - 3.5, x - 2.6, y + 3.5, 1.6, 4), rrect(x - 5.6, y - 2.9, x - 3.2, y + 2.9, 1, 4), z + 15, z + 19));
    place(belt, P(x - 1, y, z + 4));
    // once the seat is clear of the sphere it is painted in front of it
    const out = sp.x > R * 0.55;
    if (out !== outside) { outside = out; if (out) seam.after(seatG); else ball.before(seatG); }
  }
  function light(a) {
    ball.classList.toggle("hi", a === 0);
    rimO.classList.toggle("hi", a === 1 || a < 0);
    port.classList.toggle("hi", a === 2); vzor.classList.toggle("hi", a === 2);
    [seat, back, head].forEach((s) => s.sil.classList.toggle("hi", a === 3));
  }
  const B = register(stage, (dt) => { const m = stepS(sp, dt); draw(); return m; });
  bag.add(B.unregister);

  // nearest part, read against the TARGET pose (rule 01)
  function hit([sx, sy]) {
    const sat = P(...at(sp.t).map((v, i) => (i === 2 ? v + 9 : v)));
    const hc = P(D[0] * R, D[1] * R, ZC + D[2] * R), pc = P(PORT[0] * R, PORT[1] * R, ZC + PORT[2] * R), vc = P(VZOR[0] * R, VZOR[1] * R, ZC + VZOR[2] * R);
    const c = [[o, sr * 1.05], [hc, sr * 0.42], [pc, sr * 0.18], [sat, sr * 0.3], [vc, sr * 0.18]];
    let best = -1, bd = 1e9;
    c.forEach(([p, r], k) => { const d = Math.hypot(sx - p[0], sy - p[1]) / r; if (d < 1 && d < bd + (k === 0 ? 0.6 : 0)) { bd = d; best = k; } });
    return best === 4 ? 2 : best;
  }
  function move(p) {
    sp.t = clamp((p[0] - 110) / 180, 0, 1) * smax;
    const a = hit(p);
    if (a !== pick) { pick = a; light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0.12 * smax; pick = -1; light(-1); read.textContent = "rest"; B.wake(); }
  draw(); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { smax = v; sp.t = Math.min(sp.t, smax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "vostok",
  means: "Спускаемый аппарат «Восток», как он стоит в музее: палец выдвигает кресло Гагарина из люка, как при катапультировании.",
  rules: [1, 5, 6, 9],
  range: [18, 30, 42],
  tour: [[150, 150], [245, 120], [300, 90], null],
  mount,
});
