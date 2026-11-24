/* Подробные контурные экспонаты (наши Hairline-фигуры) для схемы зала: постаменты переделаны в круглые. */
window.HLFIG = window.HLFIG || {};
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * PS-1: the first artificial satellite, a polished ball on a museum rod with
 * four whip antennas swept back. It was two half-shells bolted together round
 * a battery block and a radio transmitter. The pointer's x parts the shells
 * on a spring; what is nearest the pointer, the shell, the radio inside or
 * the antennas, takes the bright stroke and is named. Slider: widest gap.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, ringAt, run, rrect, circ, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid, flatDot, place,
} = HL;

const R = 17, PL = 3, ZC = PL + 52, NAMES = ["антенны", "корпус", "передатчик"];
// four antennas: roots on the front shell, swept back and out (world directions)
const ANT = [[-0.82, 0.38, 0.42, 72], [-0.82, -0.38, 0.42, 72], [-0.86, 0.42, -0.3, 86], [-0.86, -0.42, -0.3, 86]];

const unit = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };

/** A half-shell: the sphere's points on one side of the cut, plus the cut ring, offset along x by dx. */
function shell(P, side, dx) {
  const pts = [];
  for (let i = 0; i <= 8; i++) for (let j = 0; j < 20; j++) {
    const a = (i / 8) * (Math.PI / 2), b = (j / 20) * 2 * Math.PI;
    pts.push(P(dx + side * R * Math.cos(a), R * Math.sin(a) * Math.cos(b), ZC + R * Math.sin(a) * Math.sin(b)));
  }
  const cut = Array.from({ length: 28 }, (_, k) => { const b = (k / 28) * 2 * Math.PI; return P(dx, R * Math.cos(b), ZC + R * Math.sin(b)); });
  return { sil: poly(hull(pts.concat(cut))), cut: poly(cut) };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gmax = value;
  const C = Cam(45, 0.5, 2.15);
  fit(C, [[-30, -30, 0], [30, 30, 0], [30, -30, 0], [-30, 30, 0], [-72, 30, ZC + 34], [-72, -30, ZC + 34], [gmax + R, 0, ZC + R]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, rrect(-26.0, -26.0, 26.0, 26.0, 26.0, 14), rrect(-24.5, -24.5, 24.5, 24.5, 24.5, 14), 0, PL));
  put(solid(g), prism(P, front, rrect(-1.2, -1.2, 1.2, 1.2, 1.2, 4), rrect(-0.6, -0.6, 0.6, 0.6, 0.6, 4), PL, ZC - R + 2));

  // paint order: antennas (they run behind), the back shell, the radio block, the front shell
  const ants = mk("path", { class: "nf" }, g);
  const back = mk("path", { class: "sil" }, g), backCut = mk("path", { class: "nf" }, g);
  const box = solid(g), lamp = flatDot(g, C, 1.1, "dot");
  const fr = mk("path", { class: "sil" }, g), seam = mk("path", { class: "nf lo" }, g);

  const gap = spring(0.25 * gmax);
  let drawn = NaN, pick = -2;
  const pose = (s) => ({ b: -s * 0.35, f: s * 0.65 });
  function draw() {
    if (gap.x === drawn) return;
    drawn = gap.x;
    const { b, f } = pose(gap.x);
    const sb = shell(P, -1, b), sf = shell(P, 1, f);
    back.setAttribute("d", sb.sil); backCut.setAttribute("d", sb.cut);
    put(box, prism(P, front, rrect(b + 2, -7, f - 2 > b + 6 ? f - 2 : b + 6, 7, 3, 5), rrect(b + 3, -6, (f - 2 > b + 6 ? f - 2 : b + 6) - 1, 6, 2, 5), ZC - 8, ZC + 6));
    place(lamp, P((b + f) / 2, 0, ZC + 6));
    fr.setAttribute("d", sf.sil);
    seam.setAttribute("d", open(Array.from({ length: 15 }, (_, k) => { const t = (k / 14) * Math.PI - Math.PI / 2; return P(f + R * 0.5, R * 0.866 * Math.cos(t), ZC + R * 0.866 * Math.sin(t)); })));
    ants.setAttribute("d", ANT.map(([x, y, z, L]) => { const d = unit([x, y, z]), r0 = [f + R * 0.55, y * R * 0.6, ZC + z * R * 0.6]; return seg(P(...r0), P(r0[0] + d[0] * L, r0[1] + d[1] * L, r0[2] + d[2] * L)); }).join(""));
  }
  function light(a) {
    ants.classList.toggle("hi", a === 0);
    fr.classList.toggle("hi", a === 1 || a < 0); back.classList.toggle("hi", a === 1);
    box.sil.classList.toggle("hi", a === 2);
    lamp.setAttribute("class", a < 0 ? "dot" : "dot m");
  }
  const B = register(stage, (dt) => { const m = stepS(gap, dt); draw(); return m; });
  bag.add(B.unregister);

  // picked against the TARGET pose (rule 01): the antenna tips, the shell, the radio between the shells
  function hit([sx, sy]) {
    const { b, f } = pose(gap.t);
    const tips = P(f - 50, 0, ZC + 10), shellC = P(f + R * 0.5, 0, ZC), mid = P((b + f) / 2, 0, ZC);
    const ds = [Math.hypot(sx - tips[0], sy - tips[1]) * 0.8, Math.hypot(sx - shellC[0], sy - shellC[1]), gap.t > 6 ? Math.hypot(sx - mid[0], sy - mid[1]) * 0.7 : 1e9];
    const k = ds.indexOf(Math.min(...ds));
    return ds[k] < 70 ? k : -1;
  }
  function move(p) {
    gap.t = clamp((p[0] - 110) / 180, 0, 1) * gmax;
    const a = hit(p);
    if (a !== pick) { pick = a; light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { gap.t = 0.25 * gmax; pick = -1; light(-1); read.textContent = "rest"; B.wake(); }
  draw(); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { gmax = v; gap.t = Math.min(gap.t, gmax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "sputnik",
  means: "ПС-1 на штанге: палец разводит две полусферы, внутри видны батареи и передатчик, антенны остаются на передней.",
  rules: [1, 3, 5, 6],
  range: [12, 22, 32],
  tour: [[120, 110], [230, 150], [290, 170], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * The ejection container that brought Belka and Strelka home on 20 August
 * 1960: a capsule on its side, on a cradle, with a hatch on the near flank and
 * two cabins inside, one per dog. The pointer's x swings the hatch open on a
 * spring; the cabin nearest the pointer takes the bright stroke and is named.
 */
const {
  Cam, clamp, fit, hull, open, poly, proj, prism, facing, rrect, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid, flatDot, place,
} = HL;

const PL = 3, R = 14, L = 26, ZC = PL + 9 + R, NAMES = ["Белка", "Стрелка", "люк", "контейнер"];
const ringX = (P, x, r, n = 30) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x, r * Math.cos(t), ZC + r * Math.sin(t)); });

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let amax = (value * Math.PI) / 180;
  const C = Cam(45, 0.5, 2.9);
  fit(C, [[-L - 6, -20, 0], [L + 6, 20, 0], [L + 6, -20, 0], [-L - 6, 20, 0], [0, R + 22, ZC], [0, 0, ZC + R + 2]], 200, 170);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, rrect(-32.0, -32.0, 32.0, 32.0, 32.0, 14), rrect(-30.5, -30.5, 30.5, 30.5, 30.5, 14), 0, PL));
  for (const x of [-L * 0.55, L * 0.55]) put(solid(g), prism(P, front, rrect(x - 3, -10, x + 3, 10, 2, 4), rrect(x - 2.3, -9.3, x + 2.3, 9.3, 1.3, 4), PL, PL + 11));
  // the capsule: a cylinder with domed ends, its seams and the hatch opening on the near side
  const shell = mk("path", { d: poly(hull(ringX(P, -L, R).concat(ringX(P, L, R), ringX(P, -L - 5, R * 0.6), ringX(P, L + 5, R * 0.6)))), class: "sil" }, g);
  mk("path", { d: [-L * 0.35, L * 0.35].map((x) => open(ringX(P, x, R + 0.1).slice(0, 16))).join(""), class: "nf lo" }, g);
  const hole = (t) => [[-16, -0.15], [16, -0.15], [16, 1.05], [-16, 1.05]].map(([x, a]) => P(x, R * Math.cos(a + t), ZC + R * Math.sin(a + t)));
  const arc = (x0, x1, a0, a1, rr = R) => { const out = []; for (let k = 0; k <= 10; k++) { const a = a0 + ((a1 - a0) * k) / 10; out.push(P(x0, rr * Math.cos(a), ZC + rr * Math.sin(a))); } for (let k = 10; k >= 0; k--) { const a = a0 + ((a1 - a0) * k) / 10; out.push(P(x1, rr * Math.cos(a), ZC + rr * Math.sin(a))); } return out; };
  mk("path", { d: poly(arc(-16, 16, -0.15, 1.05, R - 0.2)), class: "fo" }, g);
  // the two cabins, seen through the opening
  const cab = [-8, 8].map((x) => { const s = solid(g); put(s, prism(P, front, rrect(x - 6.5, -6, x + 6.5, 6, 2.5, 5), rrect(x - 5.8, -5.3, x + 5.8, 5.3, 1.8, 5), ZC - 6, ZC + 3)); return s; });
  const eyes = [-8, 8].map((x) => { const d = flatDot(g, C, 1, "dot off"); place(d, P(x + 3, 3, ZC + 3)); return d; });
  mk("path", { d: poly(arc(-16, 16, -0.15, 1.05)), class: "nf" }, g);
  const hatch = mk("path", { class: "sil" }, g), hinge = mk("path", { class: "nf lo" }, g);
  const op = spring(0.3 * amax);
  let drawn = NaN, pick = -2;
  function draw() {
    if (op.x === drawn) return;
    drawn = op.x;
    // hinged along its top edge, the hatch swings up and out
    const a = op.x, top = 1.05, pts = [];
    for (let k = 0; k <= 10; k++) { const t = -0.15 + (1.2 * k) / 10, y = R * Math.cos(t), z = ZC + R * Math.sin(t), hy = R * Math.cos(top), hz = ZC + R * Math.sin(top);
      const dy = y - hy, dz = z - hz, ry = dy * Math.cos(a) - dz * Math.sin(a), rz = dy * Math.sin(a) + dz * Math.cos(a); pts.push([hy + ry * 1 + 0.6, hz + rz]); }
    const poly2 = pts.map(([y, z]) => P(-16, y, z)).concat(pts.slice().reverse().map(([y, z]) => P(16, y, z)));
    hatch.setAttribute("d", poly(hull(poly2)));
    hinge.setAttribute("d", seg(P(-16, R * Math.cos(top), ZC + R * Math.sin(top)), P(16, R * Math.cos(top), ZC + R * Math.sin(top))));
  }
  function light(k) {
    cab.forEach((c, i) => c.sil.classList.toggle("hi", k === i));
    eyes.forEach((e, i) => e.setAttribute("class", k === i ? "dot" : "dot off"));
    hatch.classList.toggle("hi", k === 2 || k < 0);
    shell.classList.toggle("hi", k === 3);
  }
  const B = register(stage, (dt) => { const m = stepS(op, dt); draw(); return m; });
  bag.add(B.unregister);
  // nearest anchor; the cabins count only while the hatch is open (target pose, rule 01)
  function hit([sx, sy]) {
    const openT = op.t > 0.5, A = [[-8, 0, ZC, 9], [8, 0, ZC, 9], [0, R + 6, ZC + 8, 12], [0, 0, ZC - 4, 26]];
    let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { if (!openT && k < 2) return; const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 2.9); if (d < 1 && d < bd) { bd = d; best = k; } });
    return best;
  }
  function move(p) {
    op.t = clamp((p[0] - 110) / 180, 0, 1) * amax;
    const a = hit(p);
    if (a !== pick) { pick = a; light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { op.t = 0.3 * amax; pick = -2; light(-1); read.textContent = "rest"; B.wake(); }
  draw(); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { amax = (v * Math.PI) / 180; op.t = Math.min(op.t, amax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "container",
  means: "Катапультируемый контейнер Белки и Стрелки: палец открывает люк, внутри две кабины — для каждой собаки.",
  rules: [1, 5, 6, 10],
  range: [70, 100, 130],
  tour: [[150, 140], [230, 170], [270, 140], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
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
  put(solid(g), prism(P, front, rrect(-38.0, -46.0, 56.0, 48.0, 47.0, 14), rrect(-36.5, -44.5, 54.5, 46.5, 45.5, 14), 0, PL));
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

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * SK-1, Gagarin's suit, on a museum mannequin, drawn as a body, not as tubes: limbs are swept outlines that
 * taper and bend, the torso is lofted through hips, waist, chest and shoulders. A domed helmet with
 * a thick visor frame and a glint on the glass sits on a bolted neck ring; the suit carries its seams,
 * belt and buckle, chest straps or control panel, the ventilation fitting and hose, bellows at
 * elbows and knees, cuffed gloves with a thumb, laced boots, and a pack on the back.
 * The pointer's x raises the helmet visor. What the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rrect, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const KIND = "sk1", PL = 3, HR = 8.6, SK = KIND === "sk1";
const NAMES = ["шлем", "стекло", "оболочка", "ранец", "перчатки", "ботинки", "шланг вентиляции"];
const nrm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const around = (P, c, d, r, n = 18, sx = 1) => { const u = nrm(cross(d, Math.abs(d[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1])), v = cross(d, u); return Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(...[0, 1, 2].map((i) => c[i] + r * (Math.cos(t) * u[i] * sx + Math.sin(t) * v[i]))); }); };
/** horizontal ellipse ring: half-depth a (x), half-width b (y) */
const ell = (P, cx, cy, z, a, b, n = 28) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(cx + a * Math.cos(t), cy + b * Math.sin(t), z); });
/** the near half of a horizontal ring (the side toward the viewer), as an open line */
const nearArc = (P, cx, cy, z, a, b, n = 28) => { const e = ell(P, cx, cy, z, a, b, n); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; }); const arc = []; for (let i = iL; ; i = (i + 1) % n){ arc.push(e[i]); if (i === iR) break; } const alt = []; for (let i = iL; ; i = (i - 1 + n) % n){ alt.push(e[i]); if (i === iR) break; } const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(arc) > my(alt) ? arc : alt); };
/** the near half of any ring of screen points: the arc between its left and right ends that hangs lower on screen */
const half = (e) => { const n = e.length; let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; }); const f = [], b = []; for (let i = iL; ; i = (i + 1) % n){ f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i - 1 + n) % n){ b.push(e[i]); if (i === iR) break; } const my = (q) => q.reduce((s2, p) => s2 + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };
/** a smooth Catmull-Rom path through control points, with radii carried along */
function sweep(pts, rs, per = 6) {
  const out = [], rr = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      rr.push(rs[i] + (rs[i + 1] - rs[i]) * (t2 * (3 - 2 * t))); }
  }
  out.push(pts[pts.length - 1]); rr.push(rs[rs.length - 1]);
  return [out, rr];
}
/** a limb as one outline: the swept centreline offset by its radius on screen, with round caps */
function limb(P, pts, rs) {
  const [w, r] = sweep(pts, rs), c = w.map((p) => P(...p)), o = P(...w[0]), e = P(w[0][0] + 0.7071, w[0][1] - 0.7071, w[0][2]), sc = Math.hypot(e[0] - o[0], e[1] - o[1]);
  const n = c.length, L = [], R = [];
  for (let i = 0; i < n; i++) { const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl, rr = r[i] * sc;
    L.push([c[i][0] + nx * rr, c[i][1] + ny * rr]); R.push([c[i][0] - nx * rr, c[i][1] - ny * rr]); }
  // a round cap from one side to the other, bulging along dir (the way the limb ends)
  const cap = (ctr, from, to, dir, steps = 10) => { const a0 = Math.atan2(from[1] - ctr[1], from[0] - ctr[0]), rr = Math.hypot(from[0] - ctr[0], from[1] - ctr[1]);
    const mk2 = (sgn) => Array.from({ length: steps - 1 }, (_, k) => { const t = a0 + sgn * Math.PI * (k + 1) / steps; return [ctr[0] + rr * Math.cos(t), ctr[1] + rr * Math.sin(t)]; });
    const A = mk2(1), Bq = mk2(-1), m = Math.floor(steps / 2) - 1, sa = (A[m][0] - ctr[0]) * dir[0] + (A[m][1] - ctr[1]) * dir[1], sb = (Bq[m][0] - ctr[0]) * dir[0] + (Bq[m][1] - ctr[1]) * dir[1]; return sa > sb ? A : Bq; };
  const tEnd = [c[n - 1][0] - c[n - 2][0], c[n - 1][1] - c[n - 2][1]], tSt = [c[0][0] - c[1][0], c[0][1] - c[1][1]];
  const capE = cap(c[n - 1], L[n - 1], R[n - 1], tEnd), capS = cap(c[0], R[0], L[0], tSt);
  return poly(L.concat(capE, R.slice().reverse(), capS));
}
/** the torso lofted through horizontal rings [z, half-depth, half-width]; keeps the waist */
function loft(P, cx, rings) {
  const E = rings.map(([z, a, b]) => ell(P, cx, 0, z, a, b, 32)), L = [], R = [];
  for (const e of E) { let l = e[0], r = e[0]; for (const p of e) { if (p[0] < l[0]) l = p; if (p[0] > r[0]) r = p; } L.push(l); R.push(r); }
  const arc = (e, from, to, pick) => { const n = e.length, i0 = e.indexOf(from), i1 = e.indexOf(to), f = [], b = []; for (let i = i0; ; i = (i + 1) % n) { f.push(e[i]); if (i === i1) break; } for (let i = i0; ; i = (i - 1 + n) % n) { b.push(e[i]); if (i === i1) break; } const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return pick(my(f), my(b)) ? f : b; };
  const top = arc(E[E.length - 1], L[L.length - 1], R[R.length - 1], (a, b) => a < b), bot = arc(E[0], R[0], L[0], (a, b) => a > b);
  return poly(L.concat(top, R.slice().reverse(), bot));
}
/** a point on the front of the torso at height z, y across */
const frontAt = (rings, cx, z, y) => { let i = 0; while (i < rings.length - 2 && rings[i + 1][0] < z) i++; const [z0, a0, b0] = rings[i], [z1, a1, b1] = rings[i + 1], t = clamp((z - z0) / (z1 - z0), 0, 1), a = a0 + (a1 - a0) * t, b = b0 + (b1 - b0) * t; return [cx + a * Math.sqrt(Math.max(0, 1 - (y / b) ** 2)), y, z]; };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let vmax = value;
  const C = Cam(45, 0.5, 3.6);
  fit(C, [[-16, -16, 0], [16, 16, 0], [16, -16, 0], [-16, 16, 0], [0, 0, 77]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, rrect(-16.0, -16.0, 16.0, 16.0, 16.0, 14), rrect(-14.5, -14.5, 14.5, 14.5, 14.5, 14), 0, PL));
  const body = mk("g", {}, g), el = {};
  const Z = (z) => PL + z;
  const TR = [[Z(26.5), 5.0, 7.9], [Z(29), 4.8, 7.5], [Z(32.5), 4.5, 7.0], [Z(36.5), 5.3, 7.8], [Z(41.5), 6.0, 8.7], [Z(45.5), 5.7, 9.4], [Z(48.5), 4.6, 8.6], [Z(50.5), 3.5, 6.5]];
  function build(s) {
    body.replaceChildren();
    const pth = (d, cls) => mk("path", { d, class: cls }, body);
    // the mannequin's stand behind, then the pack that hangs on the back
    pth(seg(P(-8, 0, PL), P(-8, 0, Z(30))), "nf lo");
    const pk = SK ? [-10.5, -4.6, 33, 47] : [-13.5, -4.6, 26, 53];
    el.pack = pth(prism(P, front, rrect(pk[0], -6.8, pk[1], 6.8, 2.6, 5), rrect(pk[0] + 0.7, -6.1, pk[1] - 0.7, 6.1, 1.9, 5), Z(pk[2]), Z(pk[3])).sil, "sil");
    pth(seg(P(pk[1] + 0.1, -6.8, Z(pk[2] + 4)), P(pk[1] + 0.1, 6.8, Z(pk[2] + 4))) + (SK ? "" : seg(P(pk[0] + 0.5, -6.6, Z(46)), P(pk[0] + 0.5, 6.6, Z(46))) + seg(P(pk[0] + 0.5, -6.6, Z(40)), P(pk[0] + 0.5, 6.6, Z(40)))), "nf lo");
    // legs, far one first: one outline each from hip to ankle, knee bellows, thigh strap; laced boots
    el.boots = [];
    const leg = (y) => {
      const hip = [0.2, y, Z(29.5)], th = [0.9, y * 1.02, Z(23)], kn = [1.5, y * 1.04, Z(16.5)], cf = [0.9, y * 1.05, Z(11.5)], an = [0.5, y * 1.06, Z(6.2)];
      pth(limb(P, [hip, th, kn, cf, an], [4.4, 4.0, 3.45, 3.35, 2.7]), "sil");
      for (const dz of [-1.6, 0, 1.6]) pth(half(around(P, [kn[0], kn[1], kn[2] + dz], [0, 0, 1], 3.3, 24)), "nf lo");
      pth(half(around(P, th, [0, 0, 1], 3.85, 24)), "nf");
      const boot = prism(P, front, rrect(-3.2, y - 2.9, 6.6, y + 2.9, 2.8, 6), rrect(-2.5, y - 2.2, 5.9, y + 2.2, 2.1, 6), Z(0), Z(6.6));
      el.boots.push(pth(boot.sil, "sil")); pth(boot.crease, "nf");
      pth(nearArc(P, 1.7, y, Z(1.3), 4.95, 2.95), "nf lo");
      pth(open([0, 1, 2, 3].flatMap((k) => [P(2.9 - k * 0.55, y - 0.9, Z(3 + k * 0.9)), P(2.9 - k * 0.55, y + 0.9, Z(3.45 + k * 0.9))])), "nf lo");
    };
    leg(-4); leg(4);
    // arms: shoulder, elbow, wrist on one swept outline; bellows; a cuff; the glove with a thumb
    el.gloves = [];
    const arm = (sd) => {
      const sh = [0.3, sd * 9.8, Z(46)], up = [1.0, sd * 11.0, Z(41)], eb = [2.6, sd * 11.4, Z(36.2)], fa = [4.8, sd * 10.9, Z(32.6)], wr = [6.6, sd * 10.2, Z(29.6)];
      pth(limb(P, [sh, up, eb, fa, wr], [3.9, 3.35, 3.05, 2.95, 2.6]), "sil");
      const d = nrm(fa.map((x, i) => x - up[i]));
      for (const f of [-0.12, 0, 0.12]) pth(half(around(P, lerp(eb, fa, f + 0.08), d, 3.05, 24)), "nf lo");
      pth(half(around(P, sh, nrm([0, sd, 0.25]), 3.6, 24)), "nf lo");
      const dw = nrm(wr.map((x, i) => x - fa[i]));
      for (const f of [0.78, 0.92]) pth(half(around(P, lerp(fa, wr, f), dw, 2.75, 24)), "nf");
      const hand = [8.0, sd * 9.8, Z(26.4)], tip = [8.8, sd * 9.5, Z(24.6)];
      el.gloves.push(pth(limb(P, [lerp(wr, hand, 0.2), hand, tip], [2.55, 2.45, 1.9]), "sil"));
      pth(limb(P, [[7.6, sd * 8.0, Z(28)], [8.7, sd * 7.7, Z(26.6)]], [0.85, 0.7]), "sil");
      pth(half(around(P, lerp(wr, hand, 0.55), dw, 2.4, 24)), "nf lo");
    };
    arm(-1);
    // torso, lofted so the waist stays in; seam down the front, belt with a buckle
    el.torso = pth(loft(P, 0.4, TR), "sil");
    pth(open([Z(33.5), Z(37), Z(41), Z(45), Z(48.5)].map((z) => P(...frontAt(TR, 0.4, z, 0)))), "nf lo");
    pth(nearArc(P, 0.4, 0, Z(31.2), 4.25, 6.75), "nf"); pth(nearArc(P, 0.4, 0, Z(30.2), 4.35, 6.9), "nf lo");
    const bk = frontAt(TR, 0.4, Z(30.7), 0); pth(poly([P(bk[0] + 0.2, -1.3, Z(29.7)), P(bk[0] + 0.2, 1.3, Z(29.7)), P(bk[0] + 0.2, 1.3, Z(31.7)), P(bk[0] + 0.2, -1.3, Z(31.7))]), "sil");
    pth(nearArc(P, 0.4, 0, Z(48.6), 4.45, 8.35), "nf lo");
    if (SK) {
      // harness straps crossing the chest with a ring where they meet, ventilation fitting and hose to the hip
      const st = (y0, z0, y1, z1) => open(Array.from({ length: 9 }, (_, k) => { const t = k / 8; return P(...frontAt(TR, 0.55, z0 + (z1 - z0) * t, y0 + (y1 - y0) * t)); }));
      pth(st(-6.3, Z(47.5), 5.4, Z(33)) + st(6.3, Z(47.5), -5.4, Z(33)), "nf");
      const mid = frontAt(TR, 0.6, Z(40.3), 0); pth(poly(around(P, mid, [1, 0, 0], 0.9, 14)), "sil");
      const vf = frontAt(TR, 0.7, Z(37.5), 3.6); pth(poly(around(P, vf, nrm([1, 0.45, 0]), 1.1, 16)), "sil");
      el.extra = pth(open([P(vf[0] + 0.6, vf[1] + 0.6, vf[2] - 0.6), P(vf[0] + 2.4, vf[1] + 2.6, Z(33.5)), P(vf[0] + 2.2, vf[1] + 3.8, Z(29)), P(vf[0] + 1.2, vf[1] + 3.6, Z(26))]), "nf");
    } else {
      // the chest control panel with its gauge, and the oxygen hoses to the pack
      const cp = frontAt(TR, 0.4, Z(40), 0);
      pth(prism(P, front, rrect(cp[0] - 1.2, -3.8, cp[0] + 1.6, 3.8, 1.2, 4), rrect(cp[0] - 0.8, -3.3, cp[0] + 1.2, 3.3, 0.8, 4), Z(37), Z(43.5)).sil, "sil");
      const gz = [cp[0] + 1.7, 1.6, Z(41.5)]; pth(poly(around(P, gz, [1, 0, 0], 1, 14)), "nf");
      pth(seg(P(cp[0] + 1.7, -2.6, Z(39)), P(cp[0] + 1.7, -0.4, Z(39))), "nf lo");
      el.extra = el.pack;
    }
    arm(1);
    // neck ring with its bolts, helmet dome, visor frame and glass (turns up with the pointer)
    pth(poly(hull(ell(P, 0.5, 0, Z(50.2), 5.8, 6.1).concat(ell(P, 0.5, 0, Z(52.8), 5.8, 6.1)))), "sil");
    pth(nearArc(P, 0.5, 0, Z(51.5), 5.85, 6.15), "nf lo");
    for (let k = 0; k < 9; k++) { const t = -1.2 + k * 0.3, p = [0.5 + 5.85 * Math.cos(t), 6.15 * Math.sin(t), Z(51.5)]; pth(poly(around(P, p, [Math.cos(t), Math.sin(t), 0], 0.28, 8)), "nf"); }
    const hc = [0.8, 0, Z(59.4)];
    const o = P(...hc), e = P(hc[0] + HR * 0.7071, hc[1] - HR * 0.7071, hc[2]), hr = Math.hypot(e[0] - o[0], e[1] - o[1]);
    el.helmet = mk("ellipse", { cx: o[0].toFixed(2), cy: o[1].toFixed(2), rx: hr.toFixed(2), ry: hr.toFixed(2), class: "sil" }, body);
    const lift = clamp(s / Math.max(1, vmax), 0, 1), vd = nrm([0.92 - 0.5 * lift, 0.22, 0.05 + 1.05 * lift]);
    const visor = (r, a, sx, sy = 0.82) => { const u = nrm(cross(vd, [0, 0, 1])), v = cross(vd, u); return Array.from({ length: 30 }, (_, k) => { const t = (k / 30) * 2 * Math.PI; const q = [0, 1, 2].map((i) => Math.cos(a) * vd[i] + Math.sin(a) * (Math.cos(t) * u[i] * sx + Math.sin(t) * v[i] * sy)); return P(hc[0] + r * q[0], hc[1] + r * q[1], hc[2] + r * q[2]); }); };
    pth(poly(visor(HR * 1.03, 0.78, 1.12)), "sil");
    el.visor = pth(poly(visor(HR * 1.045, 0.64, 1.1)), "sil");
    if (!SK) pth(poly(visor(HR * 1.06, 0.5, 1.08, 0.7)), "nf lo");
    // a glint on the glass
    const gl = visor(HR * 1.05, 0.48, 1.0, 0.75); pth(open(gl.slice(17, 22)), "nf");
    if (SK) { pth(open(around(P, [hc[0], hc[1], hc[2] + HR * 0.42], [0, 0, 1], HR * 0.9, 24).slice(10, 24)), "nf lo");
      const lt = [hc[0] - 1.2, HR * 0.97, hc[2] - 1.5]; pth(poly(around(P, lt, [0, 1, 0], 0.9, 12)), "sil"); }
    light(cur);
  }
  let cur = -1;
  function light(a) {
    cur = a;
    if (!el.helmet) return;
    el.helmet.classList.toggle("hi", a === 0);
    el.visor.classList.toggle("hi", a === 1 || a < 0);
    el.torso.classList.toggle("hi", a === 2);
    el.pack.classList.toggle("hi", a === 3 || (!SK && a === 6));
    el.gloves.forEach((x) => x.classList.toggle("hi", a === 4));
    el.boots.forEach((x) => x.classList.toggle("hi", a === 5));
    if (SK) el.extra.classList.toggle("hi", a === 6);
  }
  const sp = spring(0.25 * vmax);
  let drawn = NaN;
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; build(sp.x); } return m; });
  bag.add(B.unregister);
  // nearest part; the parts never move, only the visor turns (rule 01)
  function hit([sx, sy]) {
    const A = [[0, 0, Z(63), 8], [8, 2, Z(59), 5], [2, 0, Z(39), 11], [-9, 0, Z(42), 7], [7.3, 9.6, Z(25.5), 5], [2, 0, Z(3), 8], ...(SK ? [[7, 7, Z(31), 4]] : [])];
    let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 2.8); if (d < 1 && d < bd) { bd = d; best = k; } });
    return best;
  }
  function move(p) {
    sp.t = clamp((p[0] - 110) / 180, 0, 1) * vmax;
    const a = hit(p);
    if (a !== cur) { light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0.25 * vmax; light(-1); read.textContent = "rest"; B.wake(); }
  build(sp.x); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { vmax = v; sp.t = Math.min(sp.t, vmax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "sk1",
  means: "Скафандр «СК-1» на манекене: палец поднимает стекло гермошлема, части скафандра называются.",
  rules: [1, 5, 9, 10],
  range: [6, 10, 14],
  tour: [[150, 120], [220, 160], [260, 230], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Berkut, Leonov's suit for the first spacewalk, on a museum mannequin, drawn as a body, not as tubes: limbs are swept outlines that
 * taper and bend, the torso is lofted through hips, waist, chest and shoulders. A domed helmet with
 * a thick visor frame and a glint on the glass sits on a bolted neck ring; the suit carries its seams,
 * belt and buckle, chest straps or control panel, the ventilation fitting and hose, bellows at
 * elbows and knees, cuffed gloves with a thumb, laced boots, and a pack on the back.
 * The pointer's x raises the visor and its sun filter; the big pack on the back kept him alive outside. What the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rrect, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const KIND = "berkut", PL = 3, HR = 8.6, SK = KIND === "sk1";
const NAMES = ["шлем", "стекло", "оболочка", "ранец", "перчатки", "ботинки", "ранец"];
const nrm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const around = (P, c, d, r, n = 18, sx = 1) => { const u = nrm(cross(d, Math.abs(d[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1])), v = cross(d, u); return Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(...[0, 1, 2].map((i) => c[i] + r * (Math.cos(t) * u[i] * sx + Math.sin(t) * v[i]))); }); };
/** horizontal ellipse ring: half-depth a (x), half-width b (y) */
const ell = (P, cx, cy, z, a, b, n = 28) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(cx + a * Math.cos(t), cy + b * Math.sin(t), z); });
/** the near half of a horizontal ring (the side toward the viewer), as an open line */
const nearArc = (P, cx, cy, z, a, b, n = 28) => { const e = ell(P, cx, cy, z, a, b, n); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; }); const arc = []; for (let i = iL; ; i = (i + 1) % n){ arc.push(e[i]); if (i === iR) break; } const alt = []; for (let i = iL; ; i = (i - 1 + n) % n){ alt.push(e[i]); if (i === iR) break; } const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(arc) > my(alt) ? arc : alt); };
/** the near half of any ring of screen points: the arc between its left and right ends that hangs lower on screen */
const half = (e) => { const n = e.length; let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; }); const f = [], b = []; for (let i = iL; ; i = (i + 1) % n){ f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i - 1 + n) % n){ b.push(e[i]); if (i === iR) break; } const my = (q) => q.reduce((s2, p) => s2 + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };
/** a smooth Catmull-Rom path through control points, with radii carried along */
function sweep(pts, rs, per = 6) {
  const out = [], rr = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      rr.push(rs[i] + (rs[i + 1] - rs[i]) * (t2 * (3 - 2 * t))); }
  }
  out.push(pts[pts.length - 1]); rr.push(rs[rs.length - 1]);
  return [out, rr];
}
/** a limb as one outline: the swept centreline offset by its radius on screen, with round caps */
function limb(P, pts, rs) {
  const [w, r] = sweep(pts, rs), c = w.map((p) => P(...p)), o = P(...w[0]), e = P(w[0][0] + 0.7071, w[0][1] - 0.7071, w[0][2]), sc = Math.hypot(e[0] - o[0], e[1] - o[1]);
  const n = c.length, L = [], R = [];
  for (let i = 0; i < n; i++) { const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl, rr = r[i] * sc;
    L.push([c[i][0] + nx * rr, c[i][1] + ny * rr]); R.push([c[i][0] - nx * rr, c[i][1] - ny * rr]); }
  // a round cap from one side to the other, bulging along dir (the way the limb ends)
  const cap = (ctr, from, to, dir, steps = 10) => { const a0 = Math.atan2(from[1] - ctr[1], from[0] - ctr[0]), rr = Math.hypot(from[0] - ctr[0], from[1] - ctr[1]);
    const mk2 = (sgn) => Array.from({ length: steps - 1 }, (_, k) => { const t = a0 + sgn * Math.PI * (k + 1) / steps; return [ctr[0] + rr * Math.cos(t), ctr[1] + rr * Math.sin(t)]; });
    const A = mk2(1), Bq = mk2(-1), m = Math.floor(steps / 2) - 1, sa = (A[m][0] - ctr[0]) * dir[0] + (A[m][1] - ctr[1]) * dir[1], sb = (Bq[m][0] - ctr[0]) * dir[0] + (Bq[m][1] - ctr[1]) * dir[1]; return sa > sb ? A : Bq; };
  const tEnd = [c[n - 1][0] - c[n - 2][0], c[n - 1][1] - c[n - 2][1]], tSt = [c[0][0] - c[1][0], c[0][1] - c[1][1]];
  const capE = cap(c[n - 1], L[n - 1], R[n - 1], tEnd), capS = cap(c[0], R[0], L[0], tSt);
  return poly(L.concat(capE, R.slice().reverse(), capS));
}
/** the torso lofted through horizontal rings [z, half-depth, half-width]; keeps the waist */
function loft(P, cx, rings) {
  const E = rings.map(([z, a, b]) => ell(P, cx, 0, z, a, b, 32)), L = [], R = [];
  for (const e of E) { let l = e[0], r = e[0]; for (const p of e) { if (p[0] < l[0]) l = p; if (p[0] > r[0]) r = p; } L.push(l); R.push(r); }
  const arc = (e, from, to, pick) => { const n = e.length, i0 = e.indexOf(from), i1 = e.indexOf(to), f = [], b = []; for (let i = i0; ; i = (i + 1) % n) { f.push(e[i]); if (i === i1) break; } for (let i = i0; ; i = (i - 1 + n) % n) { b.push(e[i]); if (i === i1) break; } const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return pick(my(f), my(b)) ? f : b; };
  const top = arc(E[E.length - 1], L[L.length - 1], R[R.length - 1], (a, b) => a < b), bot = arc(E[0], R[0], L[0], (a, b) => a > b);
  return poly(L.concat(top, R.slice().reverse(), bot));
}
/** a point on the front of the torso at height z, y across */
const frontAt = (rings, cx, z, y) => { let i = 0; while (i < rings.length - 2 && rings[i + 1][0] < z) i++; const [z0, a0, b0] = rings[i], [z1, a1, b1] = rings[i + 1], t = clamp((z - z0) / (z1 - z0), 0, 1), a = a0 + (a1 - a0) * t, b = b0 + (b1 - b0) * t; return [cx + a * Math.sqrt(Math.max(0, 1 - (y / b) ** 2)), y, z]; };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let vmax = value;
  const C = Cam(45, 0.5, 3.6);
  fit(C, [[-16, -16, 0], [16, 16, 0], [16, -16, 0], [-16, 16, 0], [0, 0, 77]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, rrect(-16.0, -16.0, 16.0, 16.0, 16.0, 14), rrect(-14.5, -14.5, 14.5, 14.5, 14.5, 14), 0, PL));
  const body = mk("g", {}, g), el = {};
  const Z = (z) => PL + z;
  const TR = [[Z(26.5), 5.0, 7.9], [Z(29), 4.8, 7.5], [Z(32.5), 4.5, 7.0], [Z(36.5), 5.3, 7.8], [Z(41.5), 6.0, 8.7], [Z(45.5), 5.7, 9.4], [Z(48.5), 4.6, 8.6], [Z(50.5), 3.5, 6.5]];
  function build(s) {
    body.replaceChildren();
    const pth = (d, cls) => mk("path", { d, class: cls }, body);
    // the mannequin's stand behind, then the pack that hangs on the back
    pth(seg(P(-8, 0, PL), P(-8, 0, Z(30))), "nf lo");
    const pk = SK ? [-10.5, -4.6, 33, 47] : [-13.5, -4.6, 26, 53];
    el.pack = pth(prism(P, front, rrect(pk[0], -6.8, pk[1], 6.8, 2.6, 5), rrect(pk[0] + 0.7, -6.1, pk[1] - 0.7, 6.1, 1.9, 5), Z(pk[2]), Z(pk[3])).sil, "sil");
    pth(seg(P(pk[1] + 0.1, -6.8, Z(pk[2] + 4)), P(pk[1] + 0.1, 6.8, Z(pk[2] + 4))) + (SK ? "" : seg(P(pk[0] + 0.5, -6.6, Z(46)), P(pk[0] + 0.5, 6.6, Z(46))) + seg(P(pk[0] + 0.5, -6.6, Z(40)), P(pk[0] + 0.5, 6.6, Z(40)))), "nf lo");
    // legs, far one first: one outline each from hip to ankle, knee bellows, thigh strap; laced boots
    el.boots = [];
    const leg = (y) => {
      const hip = [0.2, y, Z(29.5)], th = [0.9, y * 1.02, Z(23)], kn = [1.5, y * 1.04, Z(16.5)], cf = [0.9, y * 1.05, Z(11.5)], an = [0.5, y * 1.06, Z(6.2)];
      pth(limb(P, [hip, th, kn, cf, an], [4.4, 4.0, 3.45, 3.35, 2.7]), "sil");
      for (const dz of [-1.6, 0, 1.6]) pth(half(around(P, [kn[0], kn[1], kn[2] + dz], [0, 0, 1], 3.3, 24)), "nf lo");
      pth(half(around(P, th, [0, 0, 1], 3.85, 24)), "nf");
      const boot = prism(P, front, rrect(-3.2, y - 2.9, 6.6, y + 2.9, 2.8, 6), rrect(-2.5, y - 2.2, 5.9, y + 2.2, 2.1, 6), Z(0), Z(6.6));
      el.boots.push(pth(boot.sil, "sil")); pth(boot.crease, "nf");
      pth(nearArc(P, 1.7, y, Z(1.3), 4.95, 2.95), "nf lo");
      pth(open([0, 1, 2, 3].flatMap((k) => [P(2.9 - k * 0.55, y - 0.9, Z(3 + k * 0.9)), P(2.9 - k * 0.55, y + 0.9, Z(3.45 + k * 0.9))])), "nf lo");
    };
    leg(-4); leg(4);
    // arms: shoulder, elbow, wrist on one swept outline; bellows; a cuff; the glove with a thumb
    el.gloves = [];
    const arm = (sd) => {
      const sh = [0.3, sd * 9.8, Z(46)], up = [1.0, sd * 11.0, Z(41)], eb = [2.6, sd * 11.4, Z(36.2)], fa = [4.8, sd * 10.9, Z(32.6)], wr = [6.6, sd * 10.2, Z(29.6)];
      pth(limb(P, [sh, up, eb, fa, wr], [3.9, 3.35, 3.05, 2.95, 2.6]), "sil");
      const d = nrm(fa.map((x, i) => x - up[i]));
      for (const f of [-0.12, 0, 0.12]) pth(half(around(P, lerp(eb, fa, f + 0.08), d, 3.05, 24)), "nf lo");
      pth(half(around(P, sh, nrm([0, sd, 0.25]), 3.6, 24)), "nf lo");
      const dw = nrm(wr.map((x, i) => x - fa[i]));
      for (const f of [0.78, 0.92]) pth(half(around(P, lerp(fa, wr, f), dw, 2.75, 24)), "nf");
      const hand = [8.0, sd * 9.8, Z(26.4)], tip = [8.8, sd * 9.5, Z(24.6)];
      el.gloves.push(pth(limb(P, [lerp(wr, hand, 0.2), hand, tip], [2.55, 2.45, 1.9]), "sil"));
      pth(limb(P, [[7.6, sd * 8.0, Z(28)], [8.7, sd * 7.7, Z(26.6)]], [0.85, 0.7]), "sil");
      pth(half(around(P, lerp(wr, hand, 0.55), dw, 2.4, 24)), "nf lo");
    };
    arm(-1);
    // torso, lofted so the waist stays in; seam down the front, belt with a buckle
    el.torso = pth(loft(P, 0.4, TR), "sil");
    pth(open([Z(33.5), Z(37), Z(41), Z(45), Z(48.5)].map((z) => P(...frontAt(TR, 0.4, z, 0)))), "nf lo");
    pth(nearArc(P, 0.4, 0, Z(31.2), 4.25, 6.75), "nf"); pth(nearArc(P, 0.4, 0, Z(30.2), 4.35, 6.9), "nf lo");
    const bk = frontAt(TR, 0.4, Z(30.7), 0); pth(poly([P(bk[0] + 0.2, -1.3, Z(29.7)), P(bk[0] + 0.2, 1.3, Z(29.7)), P(bk[0] + 0.2, 1.3, Z(31.7)), P(bk[0] + 0.2, -1.3, Z(31.7))]), "sil");
    pth(nearArc(P, 0.4, 0, Z(48.6), 4.45, 8.35), "nf lo");
    if (SK) {
      // harness straps crossing the chest with a ring where they meet, ventilation fitting and hose to the hip
      const st = (y0, z0, y1, z1) => open(Array.from({ length: 9 }, (_, k) => { const t = k / 8; return P(...frontAt(TR, 0.55, z0 + (z1 - z0) * t, y0 + (y1 - y0) * t)); }));
      pth(st(-6.3, Z(47.5), 5.4, Z(33)) + st(6.3, Z(47.5), -5.4, Z(33)), "nf");
      const mid = frontAt(TR, 0.6, Z(40.3), 0); pth(poly(around(P, mid, [1, 0, 0], 0.9, 14)), "sil");
      const vf = frontAt(TR, 0.7, Z(37.5), 3.6); pth(poly(around(P, vf, nrm([1, 0.45, 0]), 1.1, 16)), "sil");
      el.extra = pth(open([P(vf[0] + 0.6, vf[1] + 0.6, vf[2] - 0.6), P(vf[0] + 2.4, vf[1] + 2.6, Z(33.5)), P(vf[0] + 2.2, vf[1] + 3.8, Z(29)), P(vf[0] + 1.2, vf[1] + 3.6, Z(26))]), "nf");
    } else {
      // the chest control panel with its gauge, and the oxygen hoses to the pack
      const cp = frontAt(TR, 0.4, Z(40), 0);
      pth(prism(P, front, rrect(cp[0] - 1.2, -3.8, cp[0] + 1.6, 3.8, 1.2, 4), rrect(cp[0] - 0.8, -3.3, cp[0] + 1.2, 3.3, 0.8, 4), Z(37), Z(43.5)).sil, "sil");
      const gz = [cp[0] + 1.7, 1.6, Z(41.5)]; pth(poly(around(P, gz, [1, 0, 0], 1, 14)), "nf");
      pth(seg(P(cp[0] + 1.7, -2.6, Z(39)), P(cp[0] + 1.7, -0.4, Z(39))), "nf lo");
      el.extra = el.pack;
    }
    arm(1);
    // neck ring with its bolts, helmet dome, visor frame and glass (turns up with the pointer)
    pth(poly(hull(ell(P, 0.5, 0, Z(50.2), 5.8, 6.1).concat(ell(P, 0.5, 0, Z(52.8), 5.8, 6.1)))), "sil");
    pth(nearArc(P, 0.5, 0, Z(51.5), 5.85, 6.15), "nf lo");
    for (let k = 0; k < 9; k++) { const t = -1.2 + k * 0.3, p = [0.5 + 5.85 * Math.cos(t), 6.15 * Math.sin(t), Z(51.5)]; pth(poly(around(P, p, [Math.cos(t), Math.sin(t), 0], 0.28, 8)), "nf"); }
    const hc = [0.8, 0, Z(59.4)];
    const o = P(...hc), e = P(hc[0] + HR * 0.7071, hc[1] - HR * 0.7071, hc[2]), hr = Math.hypot(e[0] - o[0], e[1] - o[1]);
    el.helmet = mk("ellipse", { cx: o[0].toFixed(2), cy: o[1].toFixed(2), rx: hr.toFixed(2), ry: hr.toFixed(2), class: "sil" }, body);
    const lift = clamp(s / Math.max(1, vmax), 0, 1), vd = nrm([0.92 - 0.5 * lift, 0.22, 0.05 + 1.05 * lift]);
    const visor = (r, a, sx, sy = 0.82) => { const u = nrm(cross(vd, [0, 0, 1])), v = cross(vd, u); return Array.from({ length: 30 }, (_, k) => { const t = (k / 30) * 2 * Math.PI; const q = [0, 1, 2].map((i) => Math.cos(a) * vd[i] + Math.sin(a) * (Math.cos(t) * u[i] * sx + Math.sin(t) * v[i] * sy)); return P(hc[0] + r * q[0], hc[1] + r * q[1], hc[2] + r * q[2]); }); };
    pth(poly(visor(HR * 1.03, 0.78, 1.12)), "sil");
    el.visor = pth(poly(visor(HR * 1.045, 0.64, 1.1)), "sil");
    if (!SK) pth(poly(visor(HR * 1.06, 0.5, 1.08, 0.7)), "nf lo");
    // a glint on the glass
    const gl = visor(HR * 1.05, 0.48, 1.0, 0.75); pth(open(gl.slice(17, 22)), "nf");
    if (SK) { pth(open(around(P, [hc[0], hc[1], hc[2] + HR * 0.42], [0, 0, 1], HR * 0.9, 24).slice(10, 24)), "nf lo");
      const lt = [hc[0] - 1.2, HR * 0.97, hc[2] - 1.5]; pth(poly(around(P, lt, [0, 1, 0], 0.9, 12)), "sil"); }
    light(cur);
  }
  let cur = -1;
  function light(a) {
    cur = a;
    if (!el.helmet) return;
    el.helmet.classList.toggle("hi", a === 0);
    el.visor.classList.toggle("hi", a === 1 || a < 0);
    el.torso.classList.toggle("hi", a === 2);
    el.pack.classList.toggle("hi", a === 3 || (!SK && a === 6));
    el.gloves.forEach((x) => x.classList.toggle("hi", a === 4));
    el.boots.forEach((x) => x.classList.toggle("hi", a === 5));
    if (SK) el.extra.classList.toggle("hi", a === 6);
  }
  const sp = spring(0.25 * vmax);
  let drawn = NaN;
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; build(sp.x); } return m; });
  bag.add(B.unregister);
  // nearest part; the parts never move, only the visor turns (rule 01)
  function hit([sx, sy]) {
    const A = [[0, 0, Z(63), 8], [8, 2, Z(59), 5], [2, 0, Z(39), 11], [-9, 0, Z(42), 7], [7.3, 9.6, Z(25.5), 5], [2, 0, Z(3), 8], ...(SK ? [[7, 7, Z(31), 4]] : [])];
    let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 2.8); if (d < 1 && d < bd) { bd = d; best = k; } });
    return best;
  }
  function move(p) {
    sp.t = clamp((p[0] - 110) / 180, 0, 1) * vmax;
    const a = hit(p);
    if (a !== cur) { light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0.25 * vmax; light(-1); read.textContent = "rest"; B.wake(); }
  build(sp.x); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { vmax = v; sp.t = Math.min(sp.t, vmax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "berkut",
  means: "Скафандр «Беркут» Леонова на манекене: палец поднимает стекло шлема, части скафандра называются.",
  rules: [1, 5, 9, 10],
  range: [6, 10, 14],
  tour: [[150, 120], [220, 160], [260, 230], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Venera 1, the first probe sent to Venus (12 February 1961): a cylinder with
 * a domed top on a museum stand, two solar panels, a large mesh dish and two
 * whip antennas. The pointer's x unfolds the panels on a spring; what the
 * pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, fit, hull, open, poly, proj, prism, facing, rrect, ringAt, run, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid, flatDot, place,
} = HL;

const PL = 3, R = 7, Z0 = PL + 16, H = 26, NAMES = ["корпус", "солнечная батарея", "антенна", "штыревые антенны"];
const disc = (r, cx = 0, cy = 0) => rrect(cx - r, cy - r, cx + r, cy + r, r, 14);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let amax = (value * Math.PI) / 180;
  const C = Cam(45, 0.5, 3.1);
  fit(C, [[-24, -24, 0], [24, 24, 0], [24, -24, 0], [-24, 24, 0], [0, -34, Z0 + 14], [0, 34, Z0 + 14], [-14, -8, Z0 + H + 22], [0, 0, Z0 + H + 14]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, rrect(-20.0, -20.0, 20.0, 20.0, 20.0, 14), rrect(-18.5, -18.5, 18.5, 18.5, 18.5, 14), 0, PL));
  mk("path", { d: seg(P(0, 0, PL), P(0, 0, Z0)), class: "nf" }, g);
  // the dish on its boom, behind the body
  const dishC = [-12, -6, Z0 + H + 6], dd = [0.55, 0.3, 0.78];
  const dishRing = (r, off) => { const u = [-dd[1], dd[0], 0].map((x, _, a) => x / Math.hypot(...a)), v = [dd[1] * u[2] - dd[2] * u[1], dd[2] * u[0] - dd[0] * u[2], dd[0] * u[1] - dd[1] * u[0]]; return Array.from({ length: 28 }, (_, k) => { const t = (k / 28) * 2 * Math.PI; return P(...[0, 1, 2].map((i) => dishC[i] + dd[i] * off + r * (Math.cos(t) * u[i] + Math.sin(t) * v[i]))); }); };
  mk("path", { d: seg(P(-3, -1, Z0 + H - 2), P(...dishC)), class: "nf" }, g);
  const dish = mk("path", { d: poly(hull(dishRing(13, 0).concat(dishRing(2, -5)))), class: "sil" }, g);
  mk("path", { d: poly(dishRing(13, 0)) + [0.33, 0.66].map((f) => poly(dishRing(13 * f, -5 * (1 - f) ** 2))).join(""), class: "nf lo" }, g);
  const far = mk("g", {}, g);
  const body = solid(g);
  const pts = [[R, Z0], [R, Z0 + H * 0.75], [R * 0.82, Z0 + H * 0.9], [R * 0.45, Z0 + H]].flatMap(([r, z]) => ringAt(P, disc(r), z));
  put(body, { sil: poly(hull(pts)), crease: open(ringAt(P, run(disc(R - 0.4), front), Z0 + H * 0.75)) + open(ringAt(P, run(disc(R - 0.4), front), Z0 + H * 0.3)) });
  const lamp = flatDot(g, C, 1, "dot"); place(lamp, P(R, 0, Z0 + H * 0.55));
  const whips = mk("path", { d: seg(P(R * 0.6, R * 0.6, Z0 + 2), P(R + 16, R + 10, Z0 - 10)) + seg(P(0, 0, Z0 + H), P(4, 2, Z0 + H + 20)), class: "nf" }, g);
  const near = mk("g", {}, g);
  const panels = [far, near].map((grp, i) => { const s = i ? 1 : -1; return { s, sil: mk("path", { class: "sil" }, grp), cells: mk("path", { class: "nf lo" }, grp) }; });
  const op = spring(0.5 * amax);
  let drawn = NaN, pick = -2;
  function draw() {
    if (op.x === drawn) return;
    drawn = op.x;
    // each panel is hinged at the body's side; folded it hangs down along the body, open it stands out level
    const a = op.x;
    for (const p of panels) {
      const q = (w, l) => { const y = p.s * (R + l * Math.sin(a)), z = Z0 + H * 0.62 - l * Math.cos(a); return P(w, y, z); };
      p.sil.setAttribute("d", poly([q(-6, 0), q(6, 0), q(6, 24), q(-6, 24)]));
      p.cells.setAttribute("d", [6, 12, 18].map((l) => seg(q(-6, l), q(6, l))).join("") + seg(q(0, 0), q(0, 24)));
    }
  }
  function light(k) {
    body.sil.classList.toggle("hi", k === 0);
    panels.forEach((p) => p.sil.classList.toggle("hi", k === 1));
    dish.classList.toggle("hi", k === 2 || k < 0);
    whips.classList.toggle("hi", k === 3);
    lamp.setAttribute("class", k === 0 ? "dot" : "dot m");
  }
  const B = register(stage, (dt) => { const m = stepS(op, dt); draw(); return m; });
  bag.add(B.unregister);
  function hit([sx, sy]) {
    const a = op.t, wing = (s) => [0, s * (R + 12 * Math.sin(a)), Z0 + H * 0.62 - 12 * Math.cos(a), 12];
    const A = [[0, 0, Z0 + H / 2, 10], wing(1), wing(-1), [...dishC, 13], [R + 10, R + 6, Z0 - 6, 7]];
    let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 2.7); if (d < 1 && d < bd) { bd = d; best = k; } });
    return best < 0 ? -1 : best === 2 ? 1 : best > 2 ? best - 1 : best;
  }
  function move(p) {
    op.t = clamp((p[0] - 110) / 180, 0, 1) * amax;
    const a = hit(p);
    if (a !== pick) { pick = a; light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { op.t = 0.5 * amax; pick = -2; light(-1); read.textContent = "rest"; B.wake(); }
  draw(); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { amax = (v * Math.PI) / 180; op.t = Math.min(op.t, amax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "venera",
  means: "«Венера-1» на стойке: палец раскрывает солнечные батареи, части аппарата называются.",
  rules: [1, 3, 5, 9],
  range: [60, 90, 110],
  tour: [[150, 120], [220, 150], [280, 200], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Luna 9: the first craft to land softly on the Moon, on a round plinth. A
 * ball of four petals around a small station; the pointer's x opens the
 * petals on a spring, as they opened on the surface on 3 February 1966, and
 * the station shows its camera turret and four whip antennas. The petal
 * nearest the pointer, read on the ground plane, takes the bright stroke.
 * The slider is how far the petals can open, in degrees.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, proj, ringAt, run, circ, rrect, prism, seg, unproj,
  spring, stepS, disposer, mk, pointer, put, register, solid, flatDot, place, rad,
} = HL;

const R = 30, PL = 3, TH = rad(24), GAP = rad(3), PR = 2.45 * R;
const ZC = PL + R * Math.cos(TH) + 0.5;
const NAMES = ["лепесток 1", "лепесток 2", "лепесток 3", "лепесток 4"];

/** Rodrigues: v rotated by a about unit axis k. */
const rot = (v, k, a) => {
  const c = Math.cos(a), s = Math.sin(a), d = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  const x = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
  return [0, 1, 2].map((i) => v[i] * c + x[i] * s + k[i] * d * (1 - c));
};

/** Petal at azimuth phi, opened by a: its outline and its middle rib, as world points. */
function petal(phi, a) {
  const sp = (th, ps) => [R * Math.sin(th) * Math.cos(ps), R * Math.sin(th) * Math.sin(ps), ZC - R * Math.cos(th)];
  const H = sp(TH, phi), k = [-Math.sin(phi), Math.cos(phi), 0];
  const turn = (p) => { const v = rot([p[0] - H[0], p[1] - H[1], p[2] - H[2]], k, a); return [H[0] + v[0], H[1] + v[1], Math.max(PL, H[2] + v[2])]; };
  const p0 = phi - Math.PI / 4 + GAP, p1 = phi + Math.PI / 4 - GAP, n = 10, line = [];
  for (let i = 0; i <= n; i++) line.push(sp(TH + ((Math.PI - TH) * i) / n, p0));
  for (let i = n; i >= 0; i--) line.push(sp(TH + ((Math.PI - TH) * i) / n, p1));
  for (let i = 1; i < 6; i++) line.push(sp(TH, p1 - ((p1 - p0) * i) / 6));
  const rib = [];
  for (let i = 0; i <= n; i++) rib.push(sp(TH + ((Math.PI - 0.15 - TH) * i) / n, phi));
  return { line: line.map(turn), rib: rib.map(turn) };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let amax = rad(value);
  const C = Cam(45, 0.5, 2.35);
  fit(C, [[-PR, -PR, 0], [PR, PR, 0], [PR, -PR, 0], [-PR, PR, 0], [0, 0, ZC + R + 2]], 200, 170);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const disc = (r) => rrect(-r, -r, r, r, r, 14);
  put(solid(g), prism(P, front, disc(PR), disc(PR - 2.2), 0, PL));

  // paint order: the two far petals, the station, the two near ones (azimuths 0 and 90 face the camera)
  const PH = [Math.PI, 1.5 * Math.PI, 0, 0.5 * Math.PI];
  const mkPetal = () => { const grp = mk("g", {}, g); return { sil: mk("path", { class: "sil" }, grp), rib: mk("path", { class: "nf lo" }, grp) }; };
  const pet = [mkPetal(), mkPetal()];
  const st = mk("g", {}, g);
  const body = solid(st), ants = mk("path", { class: "nf" }, st), turret = solid(st);
  const lens = flatDot(st, C, 1.25, "dot");
  pet.push(mkPetal(), mkPetal());

  const opn = spring(0.55 * amax);
  let drawn = NaN, pick = -1;
  const zb = ZC - R * Math.cos(TH) + 1;
  const lathe = (prof, z0) => { const pts = []; for (const [r, z] of prof) pts.push(...ringAt(P, circ(r, 28), z0 + z)); const [r, z] = prof[1]; return { sil: poly(hull(pts)), crease: open(ringAt(P, run(circ(r - 0.7, 28), front), z0 + z)) }; };

  function draw() {
    if (opn.x === drawn) return;
    drawn = opn.x;
    const f = amax > 0 ? clamp(opn.x / rad(100), 0, 1) : 0;
    PH.forEach((phi, i) => {
      const q = petal(phi, opn.x);
      pet[i].sil.setAttribute("d", poly(q.line.map((p) => P(...p))));
      pet[i].rib.setAttribute("d", open(q.rib.map((p) => P(...p))));
    });
    // the station: a squat body, the camera turret, and four antennas that swing up as the petals open
    put(body, lathe([[0.46 * R, 0], [0.55 * R, 0.32 * R], [0.3 * R, 0.62 * R]], zb));
    const tz = zb + 0.62 * R;
    put(turret, prism(P, front, disc(0.15 * R), disc(0.15 * R - 0.6), tz, tz + 0.42 * R));
    const e = rad(8 + 34 * f);
    ants.setAttribute("d", [0, 1, 2, 3].map((k) => {
      const a = Math.PI / 4 + (k * Math.PI) / 2, r0 = 0.3 * R, L = 1.25 * R;
      const b = [Math.cos(a) * r0, Math.sin(a) * r0, tz - 2];
      return seg(P(...b), P(b[0] + Math.cos(a) * Math.cos(e) * L, b[1] + Math.sin(a) * Math.cos(e) * L, b[2] + Math.sin(e) * L));
    }).join(""));
    place(lens, P(0.15 * R * 0.7, 0.15 * R * 0.7, tz + 0.3 * R));
  }

  function light(a) {
    pet.forEach((p, i) => p.sil.classList.toggle("hi", i === a));
    lens.setAttribute("class", a < 0 ? "dot" : "dot m");
  }

  const B = register(stage, (dt) => { const m = stepS(opn, dt); draw(); return m; });
  bag.add(B.unregister);

  // the petal is chosen on the ground plane, which never moves (rule 01): by the pointer's bearing from the centre
  function hit([sx, sy]) {
    const [wx, wy] = unproj(C, sx, sy, PL);
    if (Math.hypot(wx, wy) > PR + 6) return -1;
    const b = Math.atan2(wy, wx);
    let best = 0, bd = 9;
    PH.forEach((phi, i) => { const d = Math.abs(Math.atan2(Math.sin(b - phi), Math.cos(b - phi))); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  function move(p) {
    opn.t = clamp((p[0] - 110) / 180, 0, 1) * amax;
    const a = hit(p);
    if (a !== pick) { pick = a; light(a); read.textContent = a < 0 ? "rest" : NAMES[PH.length - 1 - a]; }
    B.wake();
  }
  function leave() { opn.t = 0.55 * amax; pick = -1; light(-1); read.textContent = "rest"; B.wake(); }

  draw(); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { amax = rad(v); opn.t = Math.min(opn.t, amax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "luna9",
  means: "«Луна-9» на постаменте: палец раскрывает четыре лепестка, как на Луне 3 февраля 1966 года, и станция поднимает антенны.",
  rules: [1, 3, 5, 6],
  range: [60, 85, 105],
  tour: [[120, 150], [230, 210], [300, 170], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * GIRD-09, the first Soviet liquid-fuel rocket (17 August 1933, Nakhabino): a slim
 * 2.4-metre body lying on two cradles of a museum stand — a pointed nose fairing, the liquid
 * oxygen tank with its rivet rows, the combustion chamber where jellied petrol burned in the
 * oxygen, a short nozzle and four swept fins. The pointer's x pulls the sections apart along
 * the axis, as the drawings show it, with the bulkheads between them; what the pointer is
 * nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rrect, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const PL = 3, R = 6, LEN = 104, ZA = PL + 15, NAMES = ["стабилизаторы", "камера сгорания", "бак кислорода", "обтекатель"];
// sections along the axis, from the tail: [from, to, radius at start, radius at end]
const SEC = [[0, 22, R, R], [22, 50, R, R], [50, 82, R, R], [82, 104, R, 0.6]];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gmax = value;
  const C = Cam(45, 0.5, 2.2);
  fit(C, [[-14, -64, 0], [14, -64, 0], [-14, 64, 0], [14, 64, 0], [0, -84, ZA + 14], [0, 84, ZA + 14], [0, -70, ZA - 14]], 200, 170);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, rrect(-60.0, -60.0, 60.0, 60.0, 60.0, 14), rrect(-58.5, -58.5, 58.5, 58.5, 58.5, 14), 0, PL));
  // two saddle cradles that the rocket rests in
  for (const y of [-26, 22]) {
    put(solid(g), prism(P, front, rrect(-2, y - 1.6, 2, y + 1.6, 0.8, 4), rrect(-1.4, y - 1, 1.4, y + 1, 0.4, 4), PL, ZA - R - 1));
    mk("path", { d: open(Array.from({ length: 9 }, (_, k) => { const a = Math.PI * (1.15 + (k / 8) * 0.7); return P(Math.cos(a) * (R + 0.8), y, ZA + Math.sin(a) * (R + 0.8)); })), class: "sil nf" }, g);
  }
  const back = mk("g", {}, g), mid = mk("g", {}, g), fore = mk("g", {}, g);
  const ring = (y, r, n = 26) => Array.from({ length: n }, (_, k) => { const a = (k / n) * 2 * Math.PI; return P(r * Math.cos(a), y, ZA + r * Math.sin(a)); });
  // the near half of a ring around the axis (toward the viewer)
  const nearRing = (y, r) => { const e = ring(y, r, 32); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; }); const f = [], b = []; for (let i = iL; ; i = (i + 1) % 32) { f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i + 31) % 32) { b.push(e[i]); if (i === iR) break; } const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };
  const fins = [0, 1, 2, 3].map((k) => { const a = Math.PI / 4 + (k * Math.PI) / 2; return { a, dir: [Math.cos(a), 0, Math.sin(a)], el: null }; });
  const el = { sec: [], seams: [], fins: [], nozzle: null, heads: null };
  for (let i = 0; i < 4; i++) { el.sec.push(mk("path", { class: "sil" }, mid)); el.seams.push(mk("path", { class: "nf lo" }, mid)); }
  el.heads = mk("path", { class: "nf" }, mid);
  el.nozzle = mk("path", { class: "sil" }, back);
  for (const f of fins) f.el = mk("path", { class: "sil" }, f.dir[0] + f.dir[2] > 0 ? fore : back);
  const sp = spring(0.06 * gmax);
  let drawn = NaN, pick = -2;
  function draw() {
    if (sp.x === drawn) return;
    drawn = sp.x;
    const gap = sp.x, y0 = -LEN / 2 - gap * 1.5, Y = (s, i) => y0 + s + gap * i;
    SEC.forEach(([s0, s1, r0, r1], i) => {
      const pts = [];
      if (i === 3) { for (let k = 0; k <= 6; k++) { const t = k / 6, s = s0 + (s1 - s0) * t, r = r0 * Math.sqrt(Math.max(0, 1 - t * t)) + r1 * t * t; pts.push(...ring(Y(s, i), Math.max(r, 0.4), 20)); } }
      else pts.push(...ring(Y(s0, i), r0), ...ring(Y(s1, i), r1));
      el.sec[i].setAttribute("d", poly(hull(pts)));
      // seams and rivet rows: the tank has two rows, the chamber an access hatch, the fairing a joint ring
      let d = "";
      if (i === 2) for (const s of [s0 + 4, s0 + 16, s1 - 4]) d += nearRing(Y(s, i), r0 + 0.05);
      if (i === 1) { d += nearRing(Y(s0 + 5, i), r0 + 0.05); const hy = Y(s0 + 14, i); d += poly(Array.from({ length: 14 }, (_, k) => { const t = (k / 14) * 2 * Math.PI, a = 0.69 + Math.cos(t) * 0.38; return P(Math.cos(a) * (R + 0.08), hy + Math.sin(t) * 4.2, ZA + Math.sin(a) * (R + 0.08)); })); }
      if (i === 0) d += nearRing(Y(s1 - 3, i), r0 + 0.05);
      if (i === 3) d += nearRing(Y(s0 + 3, i), R * 0.98);
      el.seams[i].setAttribute("d", d);
    });
    // bulkheads appear in the gaps once the sections part
    el.heads.setAttribute("d", gap > 1.2 ? [22, 50, 82].map((s, k) => poly(ring(Y(s, k + 1), R * 0.92, 24))).join("") : "");
    // nozzle at the tail, the four fins swept back over it
    const ty = Y(0, 0);
    el.nozzle.setAttribute("d", poly(hull(ring(ty, R * 0.55, 16).concat(ring(ty - 5, R * 0.8, 16)))));
    for (const f of fins) { const q = (s, r) => P(f.dir[0] * r, Y(s, 0), ZA + f.dir[2] * r); f.el.setAttribute("d", poly([q(4, R * 0.98), q(20, R * 0.98), q(9, R + 10), q(-3, R + 10)])); }
  }
  function light(k) {
    fins.forEach((f) => f.el.classList.toggle("hi", k === 0));
    el.nozzle.classList.toggle("hi", k === 0);
    el.sec.forEach((s, i) => s.classList.toggle("hi", k === i || (k < 0 && i === 1)));
  }
  const B = register(stage, (dt) => { const m = stepS(sp, dt); draw(); return m; });
  bag.add(B.unregister);
  function hit([sx, sy]) {
    const gap = sp.t, y0 = -LEN / 2 - gap * 1.5, c = [[8, 0], [36, 1], [66, 2], [93, 3]].map(([s, i]) => P(0, y0 + s + gap * i, ZA));
    let best = -1, bd = 1e9;
    c.forEach((p, k) => { const d = Math.hypot(sx - p[0], sy - p[1]) / 26; if (d < 1 && d < bd) { bd = d; best = k; } });
    return best;
  }
  function move(p) {
    sp.t = clamp((p[0] - 110) / 180, 0, 1) * gmax;
    const a = hit(p);
    if (a !== pick) { pick = a; light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0.06 * gmax; pick = -2; light(-1); read.textContent = "rest"; B.wake(); }
  draw(); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { gmax = v; sp.t = Math.min(sp.t, gmax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "gird09",
  means: "Ракета «ГИРД-09» на ложементах: палец разводит отсеки вдоль оси — обтекатель, бак кислорода, камера сгорания, хвост со стабилизаторами.",
  rules: [1, 3, 5, 9],
  range: [6, 10, 14],
  tour: [[130, 200], [200, 160], [280, 120], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * The veranda of Tsiolkovsky's house in Kaluga, as the museum rebuilt it: a corner of glazed
 * walls with small-paned sashes and a roof beam, his writing desk with papers, a lamp and the
 * tin ear trumpet he used (he was nearly deaf from childhood), a chair, and a model of his
 * all-metal airship hanging from the beam. The pointer's x swings a side sash open and sets
 * the airship turning on its strings; what the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rrect, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const PL = 3, R = 46, H = 50, NAMES = ["окна веранды", "стол", "слуховая труба", "модель дирижабля"];
const disc = (r, cx = 0, cy = 0) => rrect(cx - r, cy - r, cx + r, cy + r, r, 14);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let amax = (value * Math.PI) / 180;
  const C = Cam(45, 0.5, 2.25);
  fit(C, [[-R, -R, 0], [R, R, 0], [R, -R, 0], [-R, R, 0], [-32, -32, PL + H + 4], [-32, 30, PL + H + 4], [30, -32, PL + H + 4]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, disc(R), disc(R - 1.5), 0, PL));
  const Z = (z) => PL + z, W0 = -32, X1 = 26, Y1 = 30;
  // two glazed walls meeting in the far corner: back wall (x = W0) and side wall (y = W0)
  const panel = (a, b, z0, z1) => poly([P(...a, Z(z0)), P(...b, Z(z0)), P(...b, Z(z1)), P(...a, Z(z1))]);
  const back = mk("path", { d: panel([W0, W0], [W0, Y1], 0, H), class: "sil" }, g);
  const side = mk("path", { d: panel([W0, W0], [X1, W0], 0, H), class: "sil" }, g);
  // sashes: a sill at 14, a transom at 40, mullions every 9.7; each sash in three panes
  let grid = "";
  for (const [a, b, along] of [[[W0, W0], [W0, Y1], 1], [[W0, W0], [X1, W0], 0]]) {
    const L = along ? Y1 - W0 : X1 - W0, at = (t, z) => P(along ? W0 : W0 + t, along ? W0 + t : W0, Z(z));
    for (const z of [14, 40]) grid += seg(at(0, z), at(L, z));
    for (let t = 9.7; t < L - 1; t += 9.7) grid += seg(at(t, 14), at(t, H));
    for (let t = 0; t < L - 1; t += 9.7) for (const z of [22.7, 31.3]) grid += seg(at(t + 0.8, z), at(Math.min(L, t + 8.9), z));
    for (let t = 4.85; t < L; t += 9.7) grid += seg(at(t, 40), at(t, H));
    grid += seg(at(0, 6), at(L, 6));
  }
  const panes = mk("path", { d: grid, class: "nf lo" }, g);
  // the roof beam over both walls
  const beam = (a0, a1, b0, b1) => poly([P(a0, a1, Z(H)), P(b0, b1, Z(H)), P(b0, b1, Z(H + 2.5)), P(a0, a1, Z(H + 2.5))]);
  mk("path", { d: beam(W0, W0, W0, Y1) + beam(W0, W0, X1, W0), class: "sil" }, g);
  // an open sash on the side wall, hinged at its left post
  const sash = mk("path", { class: "sil" }, g), sashL = mk("path", { class: "nf lo" }, g);
  // the hanging airship: two strings from the beam, a cigar of corrugated metal with a gondola
  const strings = mk("path", { class: "nf lo" }, g), ship = mk("path", { class: "sil" }, g), shipL = mk("path", { class: "nf lo" }, g);
  // desk against the back wall: top, two pedestals; papers, lamp, ear trumpet
  const desk = solid(g);
  put(desk, prism(P, front, rrect(W0 + 2, -14, W0 + 18, 14, 1, 4), rrect(W0 + 3, -13, W0 + 17, 13, 0.5, 4), Z(17), Z(19)));
  for (const y of [-12, 8]) put(solid(g), prism(P, front, rrect(W0 + 3, y, W0 + 16, y + 5, 0.6, 4), rrect(W0 + 3.6, y + 0.6, W0 + 15.4, y + 4.4, 0.3, 4), 0, Z(17) - PL));
  mk("path", { d: [[W0 + 6, -9, 0.4], [W0 + 9, -3, -0.3], [W0 + 5, 3, 0.2]].map(([x, y, r]) => poly([P(x, y, Z(19.2)), P(x + 7 * Math.cos(r), y + 7 * Math.sin(r), Z(19.2)), P(x + 7 * Math.cos(r) - 5 * Math.sin(r), y + 7 * Math.sin(r) + 5 * Math.cos(r), Z(19.2)), P(x - 5 * Math.sin(r), y + 5 * Math.cos(r), Z(19.2))])).join(""), class: "nf" }, g);
  const lamp = mk("g", {}, g);
  put(solid(lamp), prism(P, front, disc(2.2, W0 + 7, 10), disc(1.6, W0 + 7, 10), Z(19), Z(20)));
  mk("path", { d: seg(P(W0 + 7, 10, Z(20)), P(W0 + 7, 10, Z(28))), class: "nf" }, lamp);
  const shade = mk("path", { d: poly(hull([...Array.from({ length: 16 }, (_, k) => P(W0 + 7 + 1.2 * Math.cos(k / 16 * 6.283), 10 + 1.2 * Math.sin(k / 16 * 6.283), Z(30))), ...Array.from({ length: 16 }, (_, k) => P(W0 + 7 + 3.6 * Math.cos(k / 16 * 6.283), 10 + 3.6 * Math.sin(k / 16 * 6.283), Z(26.5)))])), class: "sil" }, lamp);
  // the ear trumpet: a long cone lying on the desk, bell toward the viewer
  const cone = (c0, c1, r0, r1) => { const d = c1.map((v, i) => v - c0[i]), l = Math.hypot(...d), u = [-d[1] / l, d[0] / l, 0], w = [0, 0, 1]; const ring = (c, r) => Array.from({ length: 18 }, (_, k) => { const t = k / 18 * 6.283; return P(c[0] + r * (Math.cos(t) * u[0]), c[1] + r * (Math.cos(t) * u[1]), c[2] + r * Math.sin(t)); }); return [poly(hull(ring(c0, r0).concat(ring(c1, r1)))), poly(ring(c1, r1))]; };
  const [tr, trMouth] = cone([W0 + 9, -11, Z(20)], [W0 + 17, -3, Z(22.5)], 0.6, 3.2);
  const trumpet = mk("path", { d: tr, class: "sil" }, g); mk("path", { d: trMouth, class: "nf" }, g);
  // the chair in front of the desk
  put(solid(g), prism(P, front, rrect(W0 + 22, -5, W0 + 31, 4, 1, 4), rrect(W0 + 22.6, -4.4, W0 + 30.4, 3.4, 0.6, 4), Z(10), Z(11.5)));
  mk("path", { d: [[W0 + 23, -4.5], [W0 + 30.5, -4.5], [W0 + 23, 3.5], [W0 + 30.5, 3.5]].map(([x, y]) => seg(P(x, y, PL), P(x, y, Z(10)))).join("") + poly([P(W0 + 30.5, -4.5, Z(11.5)), P(W0 + 30.5, 3.5, Z(11.5)), P(W0 + 31.2, 3.5, Z(24)), P(W0 + 31.2, -4.5, Z(24))]), class: "nf" }, g);
  const sp = spring(0.08 * amax);
  let drawn = NaN, pick = -2, spin = 0, last = 0;
  function draw(t) {
    const a = sp.x;
    // sash on the side wall (y = W0), hinged at x = 6, 9.7 wide, from sill 14 to transom 40
    const hx = 6, sw = 9.7, q = (u, z) => P(hx + u * Math.cos(a), W0 + u * Math.sin(a), Z(z));
    sash.setAttribute("d", poly([q(0, 14), q(sw, 14), q(sw, 40), q(0, 40)]));
    sashL.setAttribute("d", seg(q(0.6, 22.7), q(sw - 0.6, 22.7)) + seg(q(0.6, 31.3), q(sw - 0.6, 31.3)));
    // the airship model turns slowly with the draught from the open sash
    const yaw = spin, sc = [-6, -6, Z(41)], L = 13, rr = 2.8, ax = [Math.cos(yaw), Math.sin(yaw), 0], up = [-Math.sin(yaw), Math.cos(yaw), 0];
    const ring = (s, r) => Array.from({ length: 18 }, (_, k) => { const th = k / 18 * 6.283; return P(sc[0] + ax[0] * s + up[0] * r * Math.cos(th), sc[1] + ax[1] * s + up[1] * r * Math.cos(th), sc[2] + r * Math.sin(th)); });
    const prof = [[-L, 0.3], [-L * 0.7, 0.75], [-L * 0.3, 1], [L * 0.3, 1], [L * 0.7, 0.75], [L, 0.25]];
    ship.setAttribute("d", poly(hull(prof.flatMap(([s, f]) => ring(s, rr * f)))));
    shipL.setAttribute("d", prof.slice(1, -1).map(([s, f]) => { const e = ring(s, rr * f * 1.01); return open(e.slice(4, 14)); }).join("") + poly([P(sc[0] - ax[0] * 3, sc[1] - ax[1] * 3, sc[2] - rr - 1.6), P(sc[0] + ax[0] * 3, sc[1] + ax[1] * 3, sc[2] - rr - 1.6), P(sc[0] + ax[0] * 2.4, sc[1] + ax[1] * 2.4, sc[2] - rr), P(sc[0] - ax[0] * 2.4, sc[1] - ax[1] * 2.4, sc[2] - rr)]));
    strings.setAttribute("d", [-0.5, 0.5].map((f) => seg(P(sc[0] + ax[0] * L * f, sc[1] + ax[1] * L * f, sc[2] + rr * 0.9), P(sc[0] + ax[0] * L * f * 0.6, W0 + 1, Z(H)))).join(""));
  }
  function light(k) {
    [back, side, sash].forEach((e) => e.classList.toggle("hi", k === 0));
    desk.sil.classList.toggle("hi", k === 1);
    trumpet.classList.toggle("hi", k === 2 || k < 0);
    ship.classList.toggle("hi", k === 3);
  }
  const B = register(stage, (dt, now) => { const m = stepS(sp, dt); spin += dt * 0.6 * (sp.x / Math.max(0.01, amax)); draw(now); return m || sp.x > 0.05 * amax; });
  bag.add(B.unregister);
  function hit([sx, sy]) {
    const A = [[0, W0, Z(30), 16], [W0 + 10, 0, Z(18), 10], [W0 + 13, -7, Z(21), 5], [-6, -6, Z(41), 10]];
    let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 2.4); if (d < 1 && d < bd + (k === 0 ? 0.4 : 0)) { bd = d; best = k; } });
    return best;
  }
  function move(p) {
    sp.t = clamp((p[0] - 110) / 180, 0, 1) * amax;
    const a = hit(p);
    if (a !== pick) { pick = a; light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0.08 * amax; pick = -2; light(-1); read.textContent = "rest"; B.wake(); }
  draw(0); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { amax = (v * Math.PI) / 180; sp.t = Math.min(sp.t, amax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "veranda",
  means: "Веранда Циолковского: палец открывает створку окна, и модель дирижабля поворачивается на нитях.",
  rules: [1, 3, 5, 9],
  range: [40, 70, 95],
  tour: [[150, 200], [230, 140], [280, 110], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Mir: the core module, as the museum shows it full size and the old cutaway
 * posters drew it. A docking node with five ports, a narrow and a wide working
 * compartment joined by a cone, a transfer chamber at the back and a pair of
 * solar wings. The pointer's x lifts the upper half of the hull off on a
 * spring and shows the floor inside: the crew cabins, the table, the control
 * post. What the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, fit, hull, poly, proj, seg, rrect, prism, facing,
  spring, stepS, disposer, mk, pointer, put, register, solid, flatDot, place,
} = HL;

const Z0 = 24, RB = 16.6, RS = 11.6, RN = 10, RT = 9;
// [x0, x1, r0, r1, liftable]
const SEG = [[-52, -44, RT, RT, 0], [-44, -6, RB, RB, 1], [-6, 0, RB, RS, 1], [0, 32, RS, RS, 1]];
const NAMES = ["переходная камера", "большой отсек", "каюты", "стол", "пульт", "стыковочный узел", "солнечные батареи"];

const ring = (P, x, r, z, a0 = 0, a1 = 2 * Math.PI, n = 28, yo = 0) => Array.from({ length: n + 1 }, (_, k) => { const t = a0 + ((a1 - a0) * k) / n; return P(x, yo + r * Math.cos(t), z + r * Math.sin(t)); });
const tubeX = (P, x0, x1, r0, r1, z, a0, a1, yo = 0) => poly(hull(ring(P, x0, r0, z, a0, a1, 28, yo).concat(ring(P, x1, r1, z, a0, a1, 28, yo))));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let hmax = value;
  const C = Cam(45, 0.5, 2.55);
  fit(C, [[-52, -60, Z0], [56, 60, Z0], [-52, 0, Z0 - RB], [56, 0, Z0 + RN + 12], [-10, -hmax * 1.1, Z0 + RB + hmax], [-30, 60, Z0], [-30, -60, Z0]], 200, 160);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  // museum stands under the wide compartment
  for (const x of [-34, -14]) put(solid(g), prism(P, front, rrect(x - 3, -8, x + 3, 8, 2, 4), rrect(x - 2.2, -7.2, x + 2.2, 7.2, 1.2, 4), 0, Z0 - RB + 1));

  // the far solar wing, painted first
  const wing = (s) => { const pts = [[-26, s * 18], [-14, s * 18], [-14, s * 62], [-26, s * 62]].map(([x, y]) => P(x, y, Z0 + 2)); const cells = [26, 34, 42, 50].map((y) => seg(P(-26, s * y, Z0 + 2), P(-14, s * y, Z0 + 2))).join("") + seg(P(-20, s * 18, Z0 + 2), P(-20, s * 62, Z0 + 2)); return { d: poly(pts), cells, mast: seg(P(-20, s * RB * 0.9, Z0 + 2), P(-20, s * 18, Z0 + 2)) }; };
  const wings = [];
  const addWing = (s) => { const w = wing(s); mk("path", { d: w.mast, class: "nf" }, g); const el = mk("path", { d: w.d, class: "sil" }, g); mk("path", { d: w.cells, class: "nf lo" }, g); wings.push(el); };
  addWing(-1);

  // lower troughs, the interior, the near walls, the lifted upper halves, the node
  const low = mk("g", {}, g), inside = mk("g", {}, g), near = mk("g", {}, g), up = mk("g", {}, g);
  const segEls = SEG.map(([x0, x1, r0, r1, lift], i) => {
    if (!lift) { const el = mk("path", { d: tubeX(P, x0, x1, r0, r1, Z0, 0, 2 * Math.PI), class: "sil" }, low); mk("path", { d: poly(ring(P, x0 - 3, 4, Z0)) + poly(ring(P, x0, 4.6, Z0)), class: "nf" }, low); return { el }; }
    const lo = mk("path", { d: tubeX(P, x0, x1, r0, r1, Z0, Math.PI, 2 * Math.PI) + poly(ring(P, x1, r1, Z0, Math.PI, 2 * Math.PI)), class: "sil" }, low);
    const nw = mk("path", { d: tubeX(P, x0, x1, r0, r1, Z0, -0.36, 0.02), class: "sil" }, near);
    const hi = mk("path", { class: "sil" }, up), cut = mk("path", { class: "nf lo" }, up);
    return { x0, x1, r0, r1, lo, nw, hi, cut };
  });
  const FL = Z0 - 0.35 * RB;
  // the floor and what stands on it, inside the wide compartment and at the control post
  const box = (x0, y0, x1, y1, z0, z1) => { const s = solid(inside); put(s, prism(P, front, rrect(x0, y0, x1, y1, 1, 4), rrect(x0 + 0.6, y0 + 0.6, x1 - 0.6, y1 - 0.6, 0.5, 4), z0, z1)); return s; };
  mk("path", { d: poly([[-43, -13], [-7, -13], [-7, 13], [-43, 13]].map(([x, y]) => P(x, y, FL))), class: "nf lo" }, inside);
  const cabins = [box(-30, -13, -24, -7, FL, FL + 16), box(-30, 7, -24, 13, FL, FL + 16)];
  const table = box(-16, -4, -10, 4, FL, FL + 6);
  const post = box(22, -6, 30, 6, Z0 - 0.35 * RS, Z0 - 0.35 * RS + 9);
  const crew = flatDot(inside, C, 1.2, "dot m"); place(crew, P(-13, 0, FL + 6));

  // the docking node: a ball with five ports, bright at rest
  const nodeG = mk("g", {}, g);
  const o = P(42, 0, Z0), e = P(42 + RN * 0.7071, -RN * 0.7071, Z0), nr = Math.hypot(e[0] - o[0], e[1] - o[1]);
  mk("path", { d: tubeX(P, 32, 34, RS, 6, Z0, 0, 2 * Math.PI), class: "sil" }, nodeG);
  const node = mk("ellipse", { cx: o[0].toFixed(2), cy: o[1].toFixed(2), rx: nr.toFixed(2), ry: nr.toFixed(2), class: "sil" }, nodeG);
  const port = (a, b) => { mk("path", { d: poly(hull(a.concat(b))), class: "sil" }, nodeG); mk("path", { d: poly(b), class: "nf" }, nodeG); };
  const ringY = (y, r) => Array.from({ length: 22 }, (_, k) => { const t = (k / 22) * 2 * Math.PI; return P(42 + r * Math.cos(t), y, Z0 + r * Math.sin(t)); });
  const ringZ = (z, r) => Array.from({ length: 22 }, (_, k) => { const t = (k / 22) * 2 * Math.PI; return P(42 + r * Math.cos(t), r * Math.sin(t), z); });
  port(ringZ(Z0 + RN - 1, 4.4), ringZ(Z0 + RN + 3, 4.4));
  port(ringY(RN - 1, 4.4), ringY(RN + 3, 4.4));
  port(ring(P, 42 + RN - 1, 4.4, Z0), ring(P, 42 + RN + 4, 4.4, Z0));
  addWing(1);

  const lift = spring(0.15 * hmax);
  let drawn = NaN, pick = -2;
  function draw() {
    if (lift.x === drawn) return;
    drawn = lift.x;
    const h = lift.x;
    for (const s of segEls) { if (!s.hi) continue;
      // the upper half lifts and slides to the far side, so the floor shows
      const dy = -h * 1.1;
      s.hi.setAttribute("d", tubeX(P, s.x0, s.x1, s.r0, s.r1, Z0 + h, 0, Math.PI, dy));
      s.cut.setAttribute("d", h < 0.5 ? "" : seg(P(s.x0, dy + s.r0, Z0 + h), P(s.x1, dy + s.r1, Z0 + h)) + seg(P(s.x0, dy - s.r0, Z0 + h), P(s.x1, dy - s.r1, Z0 + h)));
    }
    const show = h > 1.5;
    if (show && !inside.isConnected) low.after(inside); else if (!show && inside.isConnected) inside.remove();
  }
  function light(a) {
    segEls[0].el.classList.toggle("hi", a === 0);
    [1, 2].forEach((i) => { segEls[i].lo.classList.toggle("hi", a === 1); segEls[i].hi.classList.toggle("hi", a === 1); });
    cabins.forEach((c) => c.sil.classList.toggle("hi", a === 2));
    table.sil.classList.toggle("hi", a === 3);
    post.sil.classList.toggle("hi", a === 4);
    node.classList.toggle("hi", a === 5 || a < 0);
    wings.forEach((w) => w.classList.toggle("hi", a === 6));
  }
  const B = register(stage, (dt) => { const m = stepS(lift, dt); draw(); return m; });
  bag.add(B.unregister);

  // nearest anchor at the TARGET pose (rule 01); the inside only counts once the hull is open
  function hit([sx, sy]) {
    const open = lift.t > 6, A = [[-48, 0, Z0, 14], [-25, -lift.t * 1.1, Z0 + RB * 0.6 + lift.t, 26], [-27, 0, FL + 8, 12], [-13, 0, FL + 3, 10], [26, 0, Z0, 16], [42, 0, Z0, 18], [-20, 40, Z0, 26], [-20, -40, Z0, 26]];
    let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { if (!open && (k === 2 || k === 3)) return; const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / r; if (d < 1 && d < bd) { bd = d; best = k; } });
    return best === 7 ? 6 : best;
  }
  function move(p) {
    lift.t = clamp((p[0] - 110) / 180, 0, 1) * hmax;
    const a = hit(p);
    if (a !== pick) { pick = a; light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { lift.t = 0.15 * hmax; pick = -2; light(-1); read.textContent = "rest"; B.wake(); }
  draw(); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { hmax = v; lift.t = Math.min(lift.t, hmax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "mir",
  means: "Базовый блок «Мира»: палец снимает верхнюю половину корпуса, и видно, как жили космонавты — каюты, стол, пульт.",
  rules: [1, 5, 6, 10],
  range: [18, 28, 38],
  tour: [[140, 150], [220, 140], [300, 110], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
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

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Yastreb, the soft suit Khrunov and Yeliseyev wore to cross from Soyuz-5 to Soyuz-4 in 1969 on a museum mannequin: swept limbs, a lofted torso, helmet with visor and glint, seams, gloves, boots.
 * The pointer's x raises the visor; the life-support units ride on the legs, so the suit fits through the hatch. What the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rrect, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const KIND = "yastreb", PL = 3, HR = 8.6, SK = KIND === "sk1";
/* полужёсткие (вход через люк-ранец на спине) и «Ястреб» (блоки жизнеобеспечения на ногах) */ const HARD = KIND === "orlan" || KIND === "krechet", YA = KIND === "yastreb", KR = KIND === "krechet";
const NAMES = ["шлем", "стекло", "оболочка", "блоки на ногах", "перчатки", "ботинки", "пульт"];
const nrm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const around = (P, c, d, r, n = 18, sx = 1) => { const u = nrm(cross(d, Math.abs(d[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1])), v = cross(d, u); return Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(...[0, 1, 2].map((i) => c[i] + r * (Math.cos(t) * u[i] * sx + Math.sin(t) * v[i]))); }); };
/* horizontal ellipse ring: half-depth a (x), half-width b (y) */ const ell = (P, cx, cy, z, a, b, n = 28) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(cx + a * Math.cos(t), cy + b * Math.sin(t), z); });
/* the near half of a horizontal ring (the side toward the viewer), as an open line */ const nearArc = (P, cx, cy, z, a, b, n = 28) => { const e = ell(P, cx, cy, z, a, b, n); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; }); const arc = []; for (let i = iL; ; i = (i + 1) % n){ arc.push(e[i]); if (i === iR) break; } const alt = []; for (let i = iL; ; i = (i - 1 + n) % n){ alt.push(e[i]); if (i === iR) break; } const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(arc) > my(alt) ? arc : alt); };
/* the near half of any ring of screen points: the arc between its left and right ends that hangs lower on screen */ const half = (e) => { const n = e.length; let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; }); const f = [], b = []; for (let i = iL; ; i = (i + 1) % n){ f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i - 1 + n) % n){ b.push(e[i]); if (i === iR) break; } const my = (q) => q.reduce((s2, p) => s2 + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };
/* a smooth Catmull-Rom path through control points, with radii carried along */ function sweep(pts, rs, per = 6) {
  const out = [], rr = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      rr.push(rs[i] + (rs[i + 1] - rs[i]) * (t2 * (3 - 2 * t))); }
  }
  out.push(pts[pts.length - 1]); rr.push(rs[rs.length - 1]);
  return [out, rr];
}
/* a limb as one outline: the swept centreline offset by its radius on screen, with round caps */ function limb(P, pts, rs) {
  const [w, r] = sweep(pts, rs), c = w.map((p) => P(...p)), o = P(...w[0]), e = P(w[0][0] + 0.7071, w[0][1] - 0.7071, w[0][2]), sc = Math.hypot(e[0] - o[0], e[1] - o[1]);
  const n = c.length, L = [], R = [];
  for (let i = 0; i < n; i++) { const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl, rr = r[i] * sc;
    L.push([c[i][0] + nx * rr, c[i][1] + ny * rr]); R.push([c[i][0] - nx * rr, c[i][1] - ny * rr]); }
  /* a round cap from one side to the other, bulging along dir (the way the limb ends) */ const cap = (ctr, from, to, dir, steps = 10) => { const a0 = Math.atan2(from[1] - ctr[1], from[0] - ctr[0]), rr = Math.hypot(from[0] - ctr[0], from[1] - ctr[1]);
    const mk2 = (sgn) => Array.from({ length: steps - 1 }, (_, k) => { const t = a0 + sgn * Math.PI * (k + 1) / steps; return [ctr[0] + rr * Math.cos(t), ctr[1] + rr * Math.sin(t)]; });
    const A = mk2(1), Bq = mk2(-1), m = Math.floor(steps / 2) - 1, sa = (A[m][0] - ctr[0]) * dir[0] + (A[m][1] - ctr[1]) * dir[1], sb = (Bq[m][0] - ctr[0]) * dir[0] + (Bq[m][1] - ctr[1]) * dir[1]; return sa > sb ? A : Bq; };
  const tEnd = [c[n - 1][0] - c[n - 2][0], c[n - 1][1] - c[n - 2][1]], tSt = [c[0][0] - c[1][0], c[0][1] - c[1][1]];
  const capE = cap(c[n - 1], L[n - 1], R[n - 1], tEnd), capS = cap(c[0], R[0], L[0], tSt);
  return poly(L.concat(capE, R.slice().reverse(), capS));
}
/* the torso lofted through horizontal rings [z, half-depth, half-width]; keeps the waist */ function loft(P, cx, rings) {
  const E = rings.map(([z, a, b]) => ell(P, cx, 0, z, a, b, 32)), L = [], R = [];
  for (const e of E) { let l = e[0], r = e[0]; for (const p of e) { if (p[0] < l[0]) l = p; if (p[0] > r[0]) r = p; } L.push(l); R.push(r); }
  const arc = (e, from, to, pick) => { const n = e.length, i0 = e.indexOf(from), i1 = e.indexOf(to), f = [], b = []; for (let i = i0; ; i = (i + 1) % n) { f.push(e[i]); if (i === i1) break; } for (let i = i0; ; i = (i - 1 + n) % n) { b.push(e[i]); if (i === i1) break; } const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return pick(my(f), my(b)) ? f : b; };
  const top = arc(E[E.length - 1], L[L.length - 1], R[R.length - 1], (a, b) => a < b), bot = arc(E[0], R[0], L[0], (a, b) => a > b);
  return poly(L.concat(top, R.slice().reverse(), bot));
}
/* a point on the front of the torso at height z, y across */ const frontAt = (rings, cx, z, y) => { let i = 0; while (i < rings.length - 2 && rings[i + 1][0] < z) i++; const [z0, a0, b0] = rings[i], [z1, a1, b1] = rings[i + 1], t = clamp((z - z0) / (z1 - z0), 0, 1), a = a0 + (a1 - a0) * t, b = b0 + (b1 - b0) * t; return [cx + a * Math.sqrt(Math.max(0, 1 - (y / b) ** 2)), y, z]; };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let vmax = value;
  const C = Cam(45, 0.5, 3.6);
  fit(C, [[-16, -16, 0], [16, 16, 0], [16, -16, 0], [-16, 16, 0], [0, 0, 77]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, rrect(-16.0, -16.0, 16.0, 16.0, 16.0, 14), rrect(-14.5, -14.5, 14.5, 14.5, 14.5, 14), 0, PL));
  const body = mk("g", {}, g), el = {};
  const Z = (z) => PL + z;
  const TR = HARD ? [[Z(26.5), 5.2, 8.0], [Z(29), 5.0, 7.7], [Z(32.5), 5.4, 7.8], [Z(36.5), 6.3, 8.8], [Z(41.5), 6.9, 9.6], [Z(45.5), 6.8, 10.0], [Z(48.5), 6.2, 9.6], [Z(51.5), 5.0, 7.8]]
    : [[Z(26.5), 5.0, 7.9], [Z(29), 4.8, 7.5], [Z(32.5), 4.5, 7.0], [Z(36.5), 5.3, 7.8], [Z(41.5), 6.0, 8.7], [Z(45.5), 5.7, 9.4], [Z(48.5), 4.6, 8.6], [Z(50.5), 3.5, 6.5]];
  /* люк-ранец поворачивается на петле у края спины (вертикальная ось): кольцо rrect с повёрнутыми точками и нормалями */ const turn = (ring, hx, hy, a) => { const c = Math.cos(a), s2 = Math.sin(a); return ring.map((q) => ({ u: hx + (q.u - hx) * c - (q.v - hy) * s2, v: hy + (q.u - hx) * s2 + (q.v - hy) * c, nu: q.nu * c - q.nv * s2, nv: q.nu * s2 + q.nv * c })); };
  function build(s) {
    body.replaceChildren();
    const pth = (d, cls) => mk("path", { d, class: cls }, body);
    /* the mannequin's stand behind, then the pack that hangs on the back */ pth(seg(P(-8, 0, PL), P(-8, 0, Z(30))), "nf lo");
    const lift = clamp(s / Math.max(1, vmax), 0, 1);
    el.packs = [];
    if (HARD) {
      /* проём в спине кирасы, потом сам люк-ранец: он открывается на петле, как дверца, — так в скафандр входят */ const ang = -1.9 * lift, hx = -5.0, hy = 7.4, f0 = KR ? -15.5 : -14.8, t0 = Z(KR ? 25 : 26), t1 = Z(KR ? 56 : 55);
      if (lift > 0.02) pth(poly([[-5.6, -5.6, Z(30)], [-5.6, 5.6, Z(30)], [-6.2, 5.6, Z(50)], [-6.2, -5.6, Z(50)]].map((p) => P(...p))), "nf lo");
      const o = turn(rrect(f0, -7.4, hx, 7.4, 2.8, 6), hx, hy, ang), i = turn(rrect(f0 + 0.8, -6.6, hx - 0.8, 6.6, 2.0, 6), hx, hy, ang), pr = prism(P, front, o, i, t0, t1);
      el.packs.push(pth(pr.sil, "sil")); pth(pr.crease, "nf"); const tp = (u, v, z) => { const q = turn([{ u, v, nu: 1, nv: 0 }], hx, hy, ang)[0]; return P(q.u, q.v, z); };
      if (lift < 0.12) pth(seg(tp(f0 + 0.2, -6.9, Z(46)), tp(f0 + 0.2, 6.9, Z(46))) + seg(tp(f0 + 0.2, -6.9, Z(36)), tp(f0 + 0.2, 6.9, Z(36))), "nf lo");
      pth(open([tp(hx, hy, t0 + 3), tp(hx, hy, t1 - 3)]), "nf");
    } else if (!YA) {
      const pk = SK ? [-10.5, -4.6, 33, 47] : [-13.5, -4.6, 26, 53];
      el.packs.push(pth(prism(P, front, rrect(pk[0], -6.8, pk[1], 6.8, 2.6, 5), rrect(pk[0] + 0.7, -6.1, pk[1] - 0.7, 6.1, 1.9, 5), Z(pk[2]), Z(pk[3])).sil, "sil"));
      pth(seg(P(pk[1] + 0.1, -6.8, Z(pk[2] + 4)), P(pk[1] + 0.1, 6.8, Z(pk[2] + 4))) + (SK ? "" : seg(P(pk[0] + 0.5, -6.6, Z(46)), P(pk[0] + 0.5, 6.6, Z(46))) + seg(P(pk[0] + 0.5, -6.6, Z(40)), P(pk[0] + 0.5, 6.6, Z(40)))), "nf lo");
    }
    /* legs, far one first: one outline each from hip to ankle, knee bellows, thigh strap; laced boots */ el.boots = [];
    const leg = (y) => {
      const hip = [0.2, y, Z(29.5)], th = [0.9, y * 1.02, Z(23)], kn = [1.5, y * 1.04, Z(16.5)], cf = [0.9, y * 1.05, Z(11.5)], an = [0.5, y * 1.06, Z(6.2)];
      pth(limb(P, [hip, th, kn, cf, an], [4.4, 4.0, 3.45, 3.35, 2.7]), "sil");
      for (const dz of [-1.6, 0, 1.6]) pth(half(around(P, [kn[0], kn[1], kn[2] + dz], [0, 0, 1], 3.3, 24)), "nf lo");
      pth(half(around(P, th, [0, 0, 1], 3.85, 24)), "nf");
      const boot = prism(P, front, rrect(-3.2, y - 2.9, 6.6, y + 2.9, 2.8, 6), rrect(-2.5, y - 2.2, 5.9, y + 2.2, 2.1, 6), Z(0), Z(6.6));
      el.boots.push(pth(boot.sil, "sil")); pth(boot.crease, "nf");
      if (YA) { const u = prism(P, front, rrect(3.2, y * 1.03 - 2.2, 6.6, y * 1.03 + 2.2, 1.2, 5), rrect(3.8, y * 1.03 - 1.6, 6.0, y * 1.03 + 1.6, 0.7, 5), Z(17.5), Z(25)); el.packs.push(pth(u.sil, "sil")); pth(u.crease, "nf");
        pth(open([P(4.9, y * 1.03 - 0.6, Z(25)), P(3.6, y * 0.9, Z(28.5)), P(2.4, y * 0.6, Z(31))]), "nf lo"); }
      pth(nearArc(P, 1.7, y, Z(1.3), 4.95, 2.95), "nf lo");
      pth(open([0, 1, 2, 3].flatMap((k) => [P(2.9 - k * 0.55, y - 0.9, Z(3 + k * 0.9)), P(2.9 - k * 0.55, y + 0.9, Z(3.45 + k * 0.9))])), "nf lo");
    };
    leg(-4); leg(4);
    /* arms: shoulder, elbow, wrist on one swept outline; bellows; a cuff; the glove with a thumb */ el.gloves = [];
    const arm = (sd) => {
      const sh = [0.3, sd * 9.8, Z(46)], up = [1.0, sd * 11.0, Z(41)], eb = [2.6, sd * 11.4, Z(36.2)], fa = [4.8, sd * 10.9, Z(32.6)], wr = [6.6, sd * 10.2, Z(29.6)];
      pth(limb(P, [sh, up, eb, fa, wr], [3.9, 3.35, 3.05, 2.95, 2.6]), "sil");
      const d = nrm(fa.map((x, i) => x - up[i]));
      for (const f of [-0.12, 0, 0.12]) pth(half(around(P, lerp(eb, fa, f + 0.08), d, 3.05, 24)), "nf lo");
      pth(half(around(P, sh, nrm([0, sd, 0.25]), 3.6, 24)), HARD ? "nf" : "nf lo");
      if (HARD) pth(half(around(P, lerp(sh, up, 0.35), nrm([0.1, sd, -0.6]), 3.7, 24)), "nf");
      const dw = nrm(wr.map((x, i) => x - fa[i]));
      for (const f of [0.78, 0.92]) pth(half(around(P, lerp(fa, wr, f), dw, 2.75, 24)), "nf");
      const hand = [8.0, sd * 9.8, Z(26.4)], tip = [8.8, sd * 9.5, Z(24.6)];
      el.gloves.push(pth(limb(P, [lerp(wr, hand, 0.2), hand, tip], [2.55, 2.45, 1.9]), "sil"));
      pth(limb(P, [[7.6, sd * 8.0, Z(28)], [8.7, sd * 7.7, Z(26.6)]], [0.85, 0.7]), "sil");
      pth(half(around(P, lerp(wr, hand, 0.55), dw, 2.4, 24)), "nf lo");
    };
    arm(-1);
    /* torso, lofted so the waist stays in; seam down the front, belt with a buckle */ el.torso = pth(loft(P, 0.4, TR), "sil");
    pth(open([Z(33.5), Z(37), Z(41), Z(45), Z(48.5)].map((z) => P(...frontAt(TR, 0.4, z, 0)))), "nf lo");
    pth(nearArc(P, 0.4, 0, Z(31.2), 4.25, 6.75), "nf"); pth(nearArc(P, 0.4, 0, Z(30.2), 4.35, 6.9), "nf lo");
    const bk = frontAt(TR, 0.4, Z(30.7), 0); pth(poly([P(bk[0] + 0.2, -1.3, Z(29.7)), P(bk[0] + 0.2, 1.3, Z(29.7)), P(bk[0] + 0.2, 1.3, Z(31.7)), P(bk[0] + 0.2, -1.3, Z(31.7))]), "sil");
    pth(nearArc(P, 0.4, 0, Z(48.6), 4.45, 8.35), "nf lo");
    if (SK) {
      /* harness straps crossing the chest with a ring where they meet, ventilation fitting and hose to the hip */ const st = (y0, z0, y1, z1) => open(Array.from({ length: 9 }, (_, k) => { const t = k / 8; return P(...frontAt(TR, 0.55, z0 + (z1 - z0) * t, y0 + (y1 - y0) * t)); }));
      pth(st(-6.3, Z(47.5), 5.4, Z(33)) + st(6.3, Z(47.5), -5.4, Z(33)), "nf");
      const mid = frontAt(TR, 0.6, Z(40.3), 0); pth(poly(around(P, mid, [1, 0, 0], 0.9, 14)), "sil");
      const vf = frontAt(TR, 0.7, Z(37.5), 3.6); pth(poly(around(P, vf, nrm([1, 0.45, 0]), 1.1, 16)), "sil");
      el.extra = pth(open([P(vf[0] + 0.6, vf[1] + 0.6, vf[2] - 0.6), P(vf[0] + 2.4, vf[1] + 2.6, Z(33.5)), P(vf[0] + 2.2, vf[1] + 3.8, Z(29)), P(vf[0] + 1.2, vf[1] + 3.6, Z(26))]), "nf");
    } else {
      /* the chest control panel with its gauge, and the oxygen hoses to the pack */ const cp = frontAt(TR, 0.4, Z(40), 0);
      if (HARD) { // пульт на груди: широкий блок с рукоятками по бокам
        const pz = KR ? [36, 44] : [34, 41], pw = KR ? 5.4 : 4.6, px = cp[0] + 0.6;
        const pr = prism(P, front, rrect(px - 1.4, -pw, px + 2.4, pw, 1.3, 5), rrect(px - 0.8, -pw + 0.7, px + 1.8, pw - 0.7, 0.7, 5), Z(pz[0]), Z(pz[1]));
        el.panel = pth(pr.sil, "sil"); pth(pr.crease, "nf");
        for (const yy of [-pw - 0.6, pw + 0.6]) pth(open([P(px, yy * 0.86, Z(pz[1] - 1)), P(px + 1.6, yy, Z(pz[1] - 2.2)), P(px + 1.6, yy, Z(pz[0] + 1))]), "nf");
        if (KR) pth(open([P(px + 2.5, -pw + 1, Z(pz[1] + 0.2)), P(px + 3.2, -pw + 1, Z(pz[1] + 3.2)), P(px + 3.2, pw - 1, Z(pz[1] + 3.2)), P(px + 2.5, pw - 1, Z(pz[1] + 0.2))]), "nf lo");
      } else el.panel = pth(prism(P, front, rrect(cp[0] - 1.2, -3.8, cp[0] + 1.6, 3.8, 1.2, 4), rrect(cp[0] - 0.8, -3.3, cp[0] + 1.2, 3.3, 0.8, 4), Z(37), Z(43.5)).sil, "sil");
      const gz = HARD ? [cp[0] + 3.1, 1.6, Z(KR ? 41 : 38.5)] : [cp[0] + 1.7, 1.6, Z(41.5)]; pth(poly(around(P, gz, [1, 0, 0], 1, 14)), "nf");
      pth(seg(P(cp[0] + 1.7, -2.6, Z(39)), P(cp[0] + 1.7, -0.4, Z(39))), "nf lo");
      el.extra = HARD || YA ? el.panel : el.packs[0];
    }
    arm(1);
    /* neck ring with its bolts, helmet dome, visor frame and glass (turns up with the pointer) */ if (HARD) pth(nearArc(P, 0.4, 0, Z(52.4), 5.6, 7.4), "nf lo");
    else { pth(poly(hull(ell(P, 0.5, 0, Z(50.2), 5.8, 6.1).concat(ell(P, 0.5, 0, Z(52.8), 5.8, 6.1)))), "sil");
    pth(nearArc(P, 0.5, 0, Z(51.5), 5.85, 6.15), "nf lo"); }
    if (!HARD) for (let k = 0; k < 9; k++) { const t = -1.2 + k * 0.3, p = [0.5 + 5.85 * Math.cos(t), 6.15 * Math.sin(t), Z(51.5)]; pth(poly(around(P, p, [Math.cos(t), Math.sin(t), 0], 0.28, 8)), "nf"); }
    const hc = HARD ? [1.2, 0, Z(58.6)] : [0.8, 0, Z(59.4)];
    const o = P(...hc), e = P(hc[0] + HR * 0.7071, hc[1] - HR * 0.7071, hc[2]), hr = Math.hypot(e[0] - o[0], e[1] - o[1]);
    el.helmet = mk("ellipse", { cx: o[0].toFixed(2), cy: o[1].toFixed(2), rx: hr.toFixed(2), ry: hr.toFixed(2), class: "sil" }, body);
    const vl = HARD ? 0.18 : lift, vd = nrm([0.92 - 0.5 * vl, 0.22, 0.05 + 1.05 * vl]);
    const visor = (r, a, sx, sy = 0.82) => { const u = nrm(cross(vd, [0, 0, 1])), v = cross(vd, u); return Array.from({ length: 30 }, (_, k) => { const t = (k / 30) * 2 * Math.PI; const q = [0, 1, 2].map((i) => Math.cos(a) * vd[i] + Math.sin(a) * (Math.cos(t) * u[i] * sx + Math.sin(t) * v[i] * sy)); return P(hc[0] + r * q[0], hc[1] + r * q[1], hc[2] + r * q[2]); }); };
    pth(poly(visor(HR * 1.03, 0.78, 1.12)), "sil");
    el.visor = pth(poly(visor(HR * 1.045, 0.64, 1.1)), "sil");
    if (!SK) pth(poly(visor(HR * 1.06, 0.5, 1.08, 0.7)), "nf lo");
    /* фары по бокам шлема полужёстких скафандров */ if (HARD) for (const yy of [-1, 1]) { const lt = [hc[0] - 0.5, yy * HR * 0.98, hc[2] - 2.2]; pth(poly(around(P, lt, [0, yy, 0], 1.1, 12)), "sil"); }
    /* a glint on the glass */ const gl = visor(HR * 1.05, 0.48, 1.0, 0.75); pth(open(gl.slice(17, 22)), "nf");
    if (SK) { pth(open(around(P, [hc[0], hc[1], hc[2] + HR * 0.42], [0, 0, 1], HR * 0.9, 24).slice(10, 24)), "nf lo");
      const lt = [hc[0] - 1.2, HR * 0.97, hc[2] - 1.5]; pth(poly(around(P, lt, [0, 1, 0], 0.9, 12)), "sil"); }
    light(cur);
  }
  let cur = -1;
  function light(a) {
    cur = a;
    if (!el.helmet) return;
    el.helmet.classList.toggle("hi", a === 0);
    el.visor.classList.toggle("hi", a === 1 || a < 0);
    el.torso.classList.toggle("hi", a === 2);
    el.packs.forEach((x) => x.classList.toggle("hi", a === 3 || (!SK && !HARD && !YA && a === 6)));
    el.gloves.forEach((x) => x.classList.toggle("hi", a === 4));
    el.boots.forEach((x) => x.classList.toggle("hi", a === 5));
    if (SK || HARD || YA) el.extra.classList.toggle("hi", a === 6);
  }
  const sp = spring(0.25 * vmax);
  let drawn = NaN;
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; build(sp.x); } return m; });
  bag.add(B.unregister);
  /* nearest part; the parts never move, only the visor turns (rule 01) */ function hit([sx, sy]) {
    const A = [[0, 0, Z(63), 8], [8, 2, Z(59), 5], [2, 0, Z(41), 10], YA ? [5, 4.2, Z(21), 4] : [-10, 0, Z(42), 7], [7.3, 9.6, Z(25.5), 5], [2, 0, Z(3), 8], ...(SK ? [[7, 7, Z(31), 4]] : HARD ? [[8.5, 0, Z(KR ? 40 : 37.5), 4]] : YA ? [[7.5, 0, Z(40), 3.5]] : [])];
    let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 2.8); if (d < 1 && d < bd) { bd = d; best = k; } });
    return best;
  }
  function move(p) {
    sp.t = clamp(HARD ? (300 - p[0]) / 170 : (p[0] - 110) / 180, 0, 1) * vmax;
    const a = hit(p);
    if (a !== cur) { light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0.25 * vmax; light(-1); read.textContent = "rest"; B.wake(); }
  build(sp.x); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { vmax = v; sp.t = Math.min(sp.t, vmax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "yastreb",
  means: "Скафандр «Ястреб» на манекене: блоки жизнеобеспечения на ногах, палец поднимает стекло шлема.",
  rules: [1, 5, 9, 10],
  range: [6, 10, 14],
  tour: [[150, 120], [220, 160], [260, 230], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Orlan-D, the semi-rigid suit for spacewalks from Salyut and Mir, entered through its back on a museum mannequin: swept limbs, a lofted torso, helmet with visor and glint, seams, gloves, boots.
 * The pointer's x swings the backpack open on its hinge: that door is how the cosmonaut gets in. What the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rrect, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const KIND = "orlan", PL = 3, HR = 8.6, SK = KIND === "sk1";
/* полужёсткие (вход через люк-ранец на спине) и «Ястреб» (блоки жизнеобеспечения на ногах) */ const HARD = KIND === "orlan" || KIND === "krechet", YA = KIND === "yastreb", KR = KIND === "krechet";
const NAMES = ["шлем", "стекло", "кираса", "люк-ранец", "перчатки", "ботинки", "пульт"];
const nrm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const around = (P, c, d, r, n = 18, sx = 1) => { const u = nrm(cross(d, Math.abs(d[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1])), v = cross(d, u); return Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(...[0, 1, 2].map((i) => c[i] + r * (Math.cos(t) * u[i] * sx + Math.sin(t) * v[i]))); }); };
/* horizontal ellipse ring: half-depth a (x), half-width b (y) */ const ell = (P, cx, cy, z, a, b, n = 28) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(cx + a * Math.cos(t), cy + b * Math.sin(t), z); });
/* the near half of a horizontal ring (the side toward the viewer), as an open line */ const nearArc = (P, cx, cy, z, a, b, n = 28) => { const e = ell(P, cx, cy, z, a, b, n); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; }); const arc = []; for (let i = iL; ; i = (i + 1) % n){ arc.push(e[i]); if (i === iR) break; } const alt = []; for (let i = iL; ; i = (i - 1 + n) % n){ alt.push(e[i]); if (i === iR) break; } const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(arc) > my(alt) ? arc : alt); };
/* the near half of any ring of screen points: the arc between its left and right ends that hangs lower on screen */ const half = (e) => { const n = e.length; let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; }); const f = [], b = []; for (let i = iL; ; i = (i + 1) % n){ f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i - 1 + n) % n){ b.push(e[i]); if (i === iR) break; } const my = (q) => q.reduce((s2, p) => s2 + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };
/* a smooth Catmull-Rom path through control points, with radii carried along */ function sweep(pts, rs, per = 6) {
  const out = [], rr = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      rr.push(rs[i] + (rs[i + 1] - rs[i]) * (t2 * (3 - 2 * t))); }
  }
  out.push(pts[pts.length - 1]); rr.push(rs[rs.length - 1]);
  return [out, rr];
}
/* a limb as one outline: the swept centreline offset by its radius on screen, with round caps */ function limb(P, pts, rs) {
  const [w, r] = sweep(pts, rs), c = w.map((p) => P(...p)), o = P(...w[0]), e = P(w[0][0] + 0.7071, w[0][1] - 0.7071, w[0][2]), sc = Math.hypot(e[0] - o[0], e[1] - o[1]);
  const n = c.length, L = [], R = [];
  for (let i = 0; i < n; i++) { const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl, rr = r[i] * sc;
    L.push([c[i][0] + nx * rr, c[i][1] + ny * rr]); R.push([c[i][0] - nx * rr, c[i][1] - ny * rr]); }
  /* a round cap from one side to the other, bulging along dir (the way the limb ends) */ const cap = (ctr, from, to, dir, steps = 10) => { const a0 = Math.atan2(from[1] - ctr[1], from[0] - ctr[0]), rr = Math.hypot(from[0] - ctr[0], from[1] - ctr[1]);
    const mk2 = (sgn) => Array.from({ length: steps - 1 }, (_, k) => { const t = a0 + sgn * Math.PI * (k + 1) / steps; return [ctr[0] + rr * Math.cos(t), ctr[1] + rr * Math.sin(t)]; });
    const A = mk2(1), Bq = mk2(-1), m = Math.floor(steps / 2) - 1, sa = (A[m][0] - ctr[0]) * dir[0] + (A[m][1] - ctr[1]) * dir[1], sb = (Bq[m][0] - ctr[0]) * dir[0] + (Bq[m][1] - ctr[1]) * dir[1]; return sa > sb ? A : Bq; };
  const tEnd = [c[n - 1][0] - c[n - 2][0], c[n - 1][1] - c[n - 2][1]], tSt = [c[0][0] - c[1][0], c[0][1] - c[1][1]];
  const capE = cap(c[n - 1], L[n - 1], R[n - 1], tEnd), capS = cap(c[0], R[0], L[0], tSt);
  return poly(L.concat(capE, R.slice().reverse(), capS));
}
/* the torso lofted through horizontal rings [z, half-depth, half-width]; keeps the waist */ function loft(P, cx, rings) {
  const E = rings.map(([z, a, b]) => ell(P, cx, 0, z, a, b, 32)), L = [], R = [];
  for (const e of E) { let l = e[0], r = e[0]; for (const p of e) { if (p[0] < l[0]) l = p; if (p[0] > r[0]) r = p; } L.push(l); R.push(r); }
  const arc = (e, from, to, pick) => { const n = e.length, i0 = e.indexOf(from), i1 = e.indexOf(to), f = [], b = []; for (let i = i0; ; i = (i + 1) % n) { f.push(e[i]); if (i === i1) break; } for (let i = i0; ; i = (i - 1 + n) % n) { b.push(e[i]); if (i === i1) break; } const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return pick(my(f), my(b)) ? f : b; };
  const top = arc(E[E.length - 1], L[L.length - 1], R[R.length - 1], (a, b) => a < b), bot = arc(E[0], R[0], L[0], (a, b) => a > b);
  return poly(L.concat(top, R.slice().reverse(), bot));
}
/* a point on the front of the torso at height z, y across */ const frontAt = (rings, cx, z, y) => { let i = 0; while (i < rings.length - 2 && rings[i + 1][0] < z) i++; const [z0, a0, b0] = rings[i], [z1, a1, b1] = rings[i + 1], t = clamp((z - z0) / (z1 - z0), 0, 1), a = a0 + (a1 - a0) * t, b = b0 + (b1 - b0) * t; return [cx + a * Math.sqrt(Math.max(0, 1 - (y / b) ** 2)), y, z]; };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let vmax = value;
  const C = Cam(45, 0.5, 3.6);
  fit(C, [[-16, -16, 0], [16, 16, 0], [16, -16, 0], [-16, 16, 0], [0, 0, 77]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, rrect(-16.0, -16.0, 16.0, 16.0, 16.0, 14), rrect(-14.5, -14.5, 14.5, 14.5, 14.5, 14), 0, PL));
  const body = mk("g", {}, g), el = {};
  const Z = (z) => PL + z;
  const TR = HARD ? [[Z(26.5), 5.2, 8.0], [Z(29), 5.0, 7.7], [Z(32.5), 5.4, 7.8], [Z(36.5), 6.3, 8.8], [Z(41.5), 6.9, 9.6], [Z(45.5), 6.8, 10.0], [Z(48.5), 6.2, 9.6], [Z(51.5), 5.0, 7.8]]
    : [[Z(26.5), 5.0, 7.9], [Z(29), 4.8, 7.5], [Z(32.5), 4.5, 7.0], [Z(36.5), 5.3, 7.8], [Z(41.5), 6.0, 8.7], [Z(45.5), 5.7, 9.4], [Z(48.5), 4.6, 8.6], [Z(50.5), 3.5, 6.5]];
  /* люк-ранец поворачивается на петле у края спины (вертикальная ось): кольцо rrect с повёрнутыми точками и нормалями */ const turn = (ring, hx, hy, a) => { const c = Math.cos(a), s2 = Math.sin(a); return ring.map((q) => ({ u: hx + (q.u - hx) * c - (q.v - hy) * s2, v: hy + (q.u - hx) * s2 + (q.v - hy) * c, nu: q.nu * c - q.nv * s2, nv: q.nu * s2 + q.nv * c })); };
  function build(s) {
    body.replaceChildren();
    const pth = (d, cls) => mk("path", { d, class: cls }, body);
    /* the mannequin's stand behind, then the pack that hangs on the back */ pth(seg(P(-8, 0, PL), P(-8, 0, Z(30))), "nf lo");
    const lift = clamp(s / Math.max(1, vmax), 0, 1);
    el.packs = [];
    if (HARD) {
      /* проём в спине кирасы, потом сам люк-ранец: он открывается на петле, как дверца, — так в скафандр входят */ const ang = -1.9 * lift, hx = -5.0, hy = 7.4, f0 = KR ? -15.5 : -14.8, t0 = Z(KR ? 25 : 26), t1 = Z(KR ? 56 : 55);
      if (lift > 0.02) pth(poly([[-5.6, -5.6, Z(30)], [-5.6, 5.6, Z(30)], [-6.2, 5.6, Z(50)], [-6.2, -5.6, Z(50)]].map((p) => P(...p))), "nf lo");
      const o = turn(rrect(f0, -7.4, hx, 7.4, 2.8, 6), hx, hy, ang), i = turn(rrect(f0 + 0.8, -6.6, hx - 0.8, 6.6, 2.0, 6), hx, hy, ang), pr = prism(P, front, o, i, t0, t1);
      el.packs.push(pth(pr.sil, "sil")); pth(pr.crease, "nf"); const tp = (u, v, z) => { const q = turn([{ u, v, nu: 1, nv: 0 }], hx, hy, ang)[0]; return P(q.u, q.v, z); };
      if (lift < 0.12) pth(seg(tp(f0 + 0.2, -6.9, Z(46)), tp(f0 + 0.2, 6.9, Z(46))) + seg(tp(f0 + 0.2, -6.9, Z(36)), tp(f0 + 0.2, 6.9, Z(36))), "nf lo");
      pth(open([tp(hx, hy, t0 + 3), tp(hx, hy, t1 - 3)]), "nf");
    } else if (!YA) {
      const pk = SK ? [-10.5, -4.6, 33, 47] : [-13.5, -4.6, 26, 53];
      el.packs.push(pth(prism(P, front, rrect(pk[0], -6.8, pk[1], 6.8, 2.6, 5), rrect(pk[0] + 0.7, -6.1, pk[1] - 0.7, 6.1, 1.9, 5), Z(pk[2]), Z(pk[3])).sil, "sil"));
      pth(seg(P(pk[1] + 0.1, -6.8, Z(pk[2] + 4)), P(pk[1] + 0.1, 6.8, Z(pk[2] + 4))) + (SK ? "" : seg(P(pk[0] + 0.5, -6.6, Z(46)), P(pk[0] + 0.5, 6.6, Z(46))) + seg(P(pk[0] + 0.5, -6.6, Z(40)), P(pk[0] + 0.5, 6.6, Z(40)))), "nf lo");
    }
    /* legs, far one first: one outline each from hip to ankle, knee bellows, thigh strap; laced boots */ el.boots = [];
    const leg = (y) => {
      const hip = [0.2, y, Z(29.5)], th = [0.9, y * 1.02, Z(23)], kn = [1.5, y * 1.04, Z(16.5)], cf = [0.9, y * 1.05, Z(11.5)], an = [0.5, y * 1.06, Z(6.2)];
      pth(limb(P, [hip, th, kn, cf, an], [4.4, 4.0, 3.45, 3.35, 2.7]), "sil");
      for (const dz of [-1.6, 0, 1.6]) pth(half(around(P, [kn[0], kn[1], kn[2] + dz], [0, 0, 1], 3.3, 24)), "nf lo");
      pth(half(around(P, th, [0, 0, 1], 3.85, 24)), "nf");
      const boot = prism(P, front, rrect(-3.2, y - 2.9, 6.6, y + 2.9, 2.8, 6), rrect(-2.5, y - 2.2, 5.9, y + 2.2, 2.1, 6), Z(0), Z(6.6));
      el.boots.push(pth(boot.sil, "sil")); pth(boot.crease, "nf");
      if (YA) { const u = prism(P, front, rrect(3.2, y * 1.03 - 2.2, 6.6, y * 1.03 + 2.2, 1.2, 5), rrect(3.8, y * 1.03 - 1.6, 6.0, y * 1.03 + 1.6, 0.7, 5), Z(17.5), Z(25)); el.packs.push(pth(u.sil, "sil")); pth(u.crease, "nf");
        pth(open([P(4.9, y * 1.03 - 0.6, Z(25)), P(3.6, y * 0.9, Z(28.5)), P(2.4, y * 0.6, Z(31))]), "nf lo"); }
      pth(nearArc(P, 1.7, y, Z(1.3), 4.95, 2.95), "nf lo");
      pth(open([0, 1, 2, 3].flatMap((k) => [P(2.9 - k * 0.55, y - 0.9, Z(3 + k * 0.9)), P(2.9 - k * 0.55, y + 0.9, Z(3.45 + k * 0.9))])), "nf lo");
    };
    leg(-4); leg(4);
    /* arms: shoulder, elbow, wrist on one swept outline; bellows; a cuff; the glove with a thumb */ el.gloves = [];
    const arm = (sd) => {
      const sh = [0.3, sd * 9.8, Z(46)], up = [1.0, sd * 11.0, Z(41)], eb = [2.6, sd * 11.4, Z(36.2)], fa = [4.8, sd * 10.9, Z(32.6)], wr = [6.6, sd * 10.2, Z(29.6)];
      pth(limb(P, [sh, up, eb, fa, wr], [3.9, 3.35, 3.05, 2.95, 2.6]), "sil");
      const d = nrm(fa.map((x, i) => x - up[i]));
      for (const f of [-0.12, 0, 0.12]) pth(half(around(P, lerp(eb, fa, f + 0.08), d, 3.05, 24)), "nf lo");
      pth(half(around(P, sh, nrm([0, sd, 0.25]), 3.6, 24)), HARD ? "nf" : "nf lo");
      if (HARD) pth(half(around(P, lerp(sh, up, 0.35), nrm([0.1, sd, -0.6]), 3.7, 24)), "nf");
      const dw = nrm(wr.map((x, i) => x - fa[i]));
      for (const f of [0.78, 0.92]) pth(half(around(P, lerp(fa, wr, f), dw, 2.75, 24)), "nf");
      const hand = [8.0, sd * 9.8, Z(26.4)], tip = [8.8, sd * 9.5, Z(24.6)];
      el.gloves.push(pth(limb(P, [lerp(wr, hand, 0.2), hand, tip], [2.55, 2.45, 1.9]), "sil"));
      pth(limb(P, [[7.6, sd * 8.0, Z(28)], [8.7, sd * 7.7, Z(26.6)]], [0.85, 0.7]), "sil");
      pth(half(around(P, lerp(wr, hand, 0.55), dw, 2.4, 24)), "nf lo");
    };
    arm(-1);
    /* torso, lofted so the waist stays in; seam down the front, belt with a buckle */ el.torso = pth(loft(P, 0.4, TR), "sil");
    pth(open([Z(33.5), Z(37), Z(41), Z(45), Z(48.5)].map((z) => P(...frontAt(TR, 0.4, z, 0)))), "nf lo");
    pth(nearArc(P, 0.4, 0, Z(31.2), 4.25, 6.75), "nf"); pth(nearArc(P, 0.4, 0, Z(30.2), 4.35, 6.9), "nf lo");
    const bk = frontAt(TR, 0.4, Z(30.7), 0); pth(poly([P(bk[0] + 0.2, -1.3, Z(29.7)), P(bk[0] + 0.2, 1.3, Z(29.7)), P(bk[0] + 0.2, 1.3, Z(31.7)), P(bk[0] + 0.2, -1.3, Z(31.7))]), "sil");
    pth(nearArc(P, 0.4, 0, Z(48.6), 4.45, 8.35), "nf lo");
    if (SK) {
      /* harness straps crossing the chest with a ring where they meet, ventilation fitting and hose to the hip */ const st = (y0, z0, y1, z1) => open(Array.from({ length: 9 }, (_, k) => { const t = k / 8; return P(...frontAt(TR, 0.55, z0 + (z1 - z0) * t, y0 + (y1 - y0) * t)); }));
      pth(st(-6.3, Z(47.5), 5.4, Z(33)) + st(6.3, Z(47.5), -5.4, Z(33)), "nf");
      const mid = frontAt(TR, 0.6, Z(40.3), 0); pth(poly(around(P, mid, [1, 0, 0], 0.9, 14)), "sil");
      const vf = frontAt(TR, 0.7, Z(37.5), 3.6); pth(poly(around(P, vf, nrm([1, 0.45, 0]), 1.1, 16)), "sil");
      el.extra = pth(open([P(vf[0] + 0.6, vf[1] + 0.6, vf[2] - 0.6), P(vf[0] + 2.4, vf[1] + 2.6, Z(33.5)), P(vf[0] + 2.2, vf[1] + 3.8, Z(29)), P(vf[0] + 1.2, vf[1] + 3.6, Z(26))]), "nf");
    } else {
      /* the chest control panel with its gauge, and the oxygen hoses to the pack */ const cp = frontAt(TR, 0.4, Z(40), 0);
      if (HARD) { // пульт на груди: широкий блок с рукоятками по бокам
        const pz = KR ? [36, 44] : [34, 41], pw = KR ? 5.4 : 4.6, px = cp[0] + 0.6;
        const pr = prism(P, front, rrect(px - 1.4, -pw, px + 2.4, pw, 1.3, 5), rrect(px - 0.8, -pw + 0.7, px + 1.8, pw - 0.7, 0.7, 5), Z(pz[0]), Z(pz[1]));
        el.panel = pth(pr.sil, "sil"); pth(pr.crease, "nf");
        for (const yy of [-pw - 0.6, pw + 0.6]) pth(open([P(px, yy * 0.86, Z(pz[1] - 1)), P(px + 1.6, yy, Z(pz[1] - 2.2)), P(px + 1.6, yy, Z(pz[0] + 1))]), "nf");
        if (KR) pth(open([P(px + 2.5, -pw + 1, Z(pz[1] + 0.2)), P(px + 3.2, -pw + 1, Z(pz[1] + 3.2)), P(px + 3.2, pw - 1, Z(pz[1] + 3.2)), P(px + 2.5, pw - 1, Z(pz[1] + 0.2))]), "nf lo");
      } else el.panel = pth(prism(P, front, rrect(cp[0] - 1.2, -3.8, cp[0] + 1.6, 3.8, 1.2, 4), rrect(cp[0] - 0.8, -3.3, cp[0] + 1.2, 3.3, 0.8, 4), Z(37), Z(43.5)).sil, "sil");
      const gz = HARD ? [cp[0] + 3.1, 1.6, Z(KR ? 41 : 38.5)] : [cp[0] + 1.7, 1.6, Z(41.5)]; pth(poly(around(P, gz, [1, 0, 0], 1, 14)), "nf");
      pth(seg(P(cp[0] + 1.7, -2.6, Z(39)), P(cp[0] + 1.7, -0.4, Z(39))), "nf lo");
      el.extra = HARD || YA ? el.panel : el.packs[0];
    }
    arm(1);
    /* neck ring with its bolts, helmet dome, visor frame and glass (turns up with the pointer) */ if (HARD) pth(nearArc(P, 0.4, 0, Z(52.4), 5.6, 7.4), "nf lo");
    else { pth(poly(hull(ell(P, 0.5, 0, Z(50.2), 5.8, 6.1).concat(ell(P, 0.5, 0, Z(52.8), 5.8, 6.1)))), "sil");
    pth(nearArc(P, 0.5, 0, Z(51.5), 5.85, 6.15), "nf lo"); }
    if (!HARD) for (let k = 0; k < 9; k++) { const t = -1.2 + k * 0.3, p = [0.5 + 5.85 * Math.cos(t), 6.15 * Math.sin(t), Z(51.5)]; pth(poly(around(P, p, [Math.cos(t), Math.sin(t), 0], 0.28, 8)), "nf"); }
    const hc = HARD ? [1.2, 0, Z(58.6)] : [0.8, 0, Z(59.4)];
    const o = P(...hc), e = P(hc[0] + HR * 0.7071, hc[1] - HR * 0.7071, hc[2]), hr = Math.hypot(e[0] - o[0], e[1] - o[1]);
    el.helmet = mk("ellipse", { cx: o[0].toFixed(2), cy: o[1].toFixed(2), rx: hr.toFixed(2), ry: hr.toFixed(2), class: "sil" }, body);
    const vl = HARD ? 0.18 : lift, vd = nrm([0.92 - 0.5 * vl, 0.22, 0.05 + 1.05 * vl]);
    const visor = (r, a, sx, sy = 0.82) => { const u = nrm(cross(vd, [0, 0, 1])), v = cross(vd, u); return Array.from({ length: 30 }, (_, k) => { const t = (k / 30) * 2 * Math.PI; const q = [0, 1, 2].map((i) => Math.cos(a) * vd[i] + Math.sin(a) * (Math.cos(t) * u[i] * sx + Math.sin(t) * v[i] * sy)); return P(hc[0] + r * q[0], hc[1] + r * q[1], hc[2] + r * q[2]); }); };
    pth(poly(visor(HR * 1.03, 0.78, 1.12)), "sil");
    el.visor = pth(poly(visor(HR * 1.045, 0.64, 1.1)), "sil");
    if (!SK) pth(poly(visor(HR * 1.06, 0.5, 1.08, 0.7)), "nf lo");
    /* фары по бокам шлема полужёстких скафандров */ if (HARD) for (const yy of [-1, 1]) { const lt = [hc[0] - 0.5, yy * HR * 0.98, hc[2] - 2.2]; pth(poly(around(P, lt, [0, yy, 0], 1.1, 12)), "sil"); }
    /* a glint on the glass */ const gl = visor(HR * 1.05, 0.48, 1.0, 0.75); pth(open(gl.slice(17, 22)), "nf");
    if (SK) { pth(open(around(P, [hc[0], hc[1], hc[2] + HR * 0.42], [0, 0, 1], HR * 0.9, 24).slice(10, 24)), "nf lo");
      const lt = [hc[0] - 1.2, HR * 0.97, hc[2] - 1.5]; pth(poly(around(P, lt, [0, 1, 0], 0.9, 12)), "sil"); }
    light(cur);
  }
  let cur = -1;
  function light(a) {
    cur = a;
    if (!el.helmet) return;
    el.helmet.classList.toggle("hi", a === 0);
    el.visor.classList.toggle("hi", a === 1 || a < 0);
    el.torso.classList.toggle("hi", a === 2);
    el.packs.forEach((x) => x.classList.toggle("hi", a === 3 || (!SK && !HARD && !YA && a === 6)));
    el.gloves.forEach((x) => x.classList.toggle("hi", a === 4));
    el.boots.forEach((x) => x.classList.toggle("hi", a === 5));
    if (SK || HARD || YA) el.extra.classList.toggle("hi", a === 6);
  }
  const sp = spring(0.25 * vmax);
  let drawn = NaN;
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; build(sp.x); } return m; });
  bag.add(B.unregister);
  /* nearest part; the parts never move, only the visor turns (rule 01) */ function hit([sx, sy]) {
    const A = [[0, 0, Z(63), 8], [8, 2, Z(59), 5], [2, 0, Z(41), 10], YA ? [5, 4.2, Z(21), 4] : [-10, 0, Z(42), 7], [7.3, 9.6, Z(25.5), 5], [2, 0, Z(3), 8], ...(SK ? [[7, 7, Z(31), 4]] : HARD ? [[8.5, 0, Z(KR ? 40 : 37.5), 4]] : YA ? [[7.5, 0, Z(40), 3.5]] : [])];
    let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 2.8); if (d < 1 && d < bd) { bd = d; best = k; } });
    return best;
  }
  function move(p) {
    sp.t = clamp(HARD ? (300 - p[0]) / 170 : (p[0] - 110) / 180, 0, 1) * vmax;
    const a = hit(p);
    if (a !== cur) { light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0.25 * vmax; light(-1); read.textContent = "rest"; B.wake(); }
  build(sp.x); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { vmax = v; sp.t = Math.min(sp.t, vmax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "orlan",
  means: "Скафандр «Орлан-Д»: жёсткая кираса со шлемом, вход через люк-ранец на спине. Палец открывает люк.",
  rules: [1, 5, 9, 10],
  range: [6, 10, 14],
  tour: [[150, 120], [220, 160], [260, 230], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
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

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Krechet, the lunar suit built for the Soviet landing, entered through its back on a museum mannequin: swept limbs, a lofted torso, helmet with visor and glint, seams, gloves, boots.
 * The pointer's x swings the backpack open on its hinge; the chest console folds over the belly. What the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rrect, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const KIND = "krechet", PL = 3, HR = 8.6, SK = KIND === "sk1";
/* полужёсткие (вход через люк-ранец на спине) и «Ястреб» (блоки жизнеобеспечения на ногах) */ const HARD = KIND === "orlan" || KIND === "krechet", YA = KIND === "yastreb", KR = KIND === "krechet";
const NAMES = ["шлем", "стекло", "кираса", "люк-ранец", "перчатки", "ботинки", "пульт"];
const nrm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const around = (P, c, d, r, n = 18, sx = 1) => { const u = nrm(cross(d, Math.abs(d[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1])), v = cross(d, u); return Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(...[0, 1, 2].map((i) => c[i] + r * (Math.cos(t) * u[i] * sx + Math.sin(t) * v[i]))); }); };
/* horizontal ellipse ring: half-depth a (x), half-width b (y) */ const ell = (P, cx, cy, z, a, b, n = 28) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(cx + a * Math.cos(t), cy + b * Math.sin(t), z); });
/* the near half of a horizontal ring (the side toward the viewer), as an open line */ const nearArc = (P, cx, cy, z, a, b, n = 28) => { const e = ell(P, cx, cy, z, a, b, n); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; }); const arc = []; for (let i = iL; ; i = (i + 1) % n){ arc.push(e[i]); if (i === iR) break; } const alt = []; for (let i = iL; ; i = (i - 1 + n) % n){ alt.push(e[i]); if (i === iR) break; } const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(arc) > my(alt) ? arc : alt); };
/* the near half of any ring of screen points: the arc between its left and right ends that hangs lower on screen */ const half = (e) => { const n = e.length; let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; }); const f = [], b = []; for (let i = iL; ; i = (i + 1) % n){ f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i - 1 + n) % n){ b.push(e[i]); if (i === iR) break; } const my = (q) => q.reduce((s2, p) => s2 + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };
/* a smooth Catmull-Rom path through control points, with radii carried along */ function sweep(pts, rs, per = 6) {
  const out = [], rr = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      rr.push(rs[i] + (rs[i + 1] - rs[i]) * (t2 * (3 - 2 * t))); }
  }
  out.push(pts[pts.length - 1]); rr.push(rs[rs.length - 1]);
  return [out, rr];
}
/* a limb as one outline: the swept centreline offset by its radius on screen, with round caps */ function limb(P, pts, rs) {
  const [w, r] = sweep(pts, rs), c = w.map((p) => P(...p)), o = P(...w[0]), e = P(w[0][0] + 0.7071, w[0][1] - 0.7071, w[0][2]), sc = Math.hypot(e[0] - o[0], e[1] - o[1]);
  const n = c.length, L = [], R = [];
  for (let i = 0; i < n; i++) { const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl, rr = r[i] * sc;
    L.push([c[i][0] + nx * rr, c[i][1] + ny * rr]); R.push([c[i][0] - nx * rr, c[i][1] - ny * rr]); }
  /* a round cap from one side to the other, bulging along dir (the way the limb ends) */ const cap = (ctr, from, to, dir, steps = 10) => { const a0 = Math.atan2(from[1] - ctr[1], from[0] - ctr[0]), rr = Math.hypot(from[0] - ctr[0], from[1] - ctr[1]);
    const mk2 = (sgn) => Array.from({ length: steps - 1 }, (_, k) => { const t = a0 + sgn * Math.PI * (k + 1) / steps; return [ctr[0] + rr * Math.cos(t), ctr[1] + rr * Math.sin(t)]; });
    const A = mk2(1), Bq = mk2(-1), m = Math.floor(steps / 2) - 1, sa = (A[m][0] - ctr[0]) * dir[0] + (A[m][1] - ctr[1]) * dir[1], sb = (Bq[m][0] - ctr[0]) * dir[0] + (Bq[m][1] - ctr[1]) * dir[1]; return sa > sb ? A : Bq; };
  const tEnd = [c[n - 1][0] - c[n - 2][0], c[n - 1][1] - c[n - 2][1]], tSt = [c[0][0] - c[1][0], c[0][1] - c[1][1]];
  const capE = cap(c[n - 1], L[n - 1], R[n - 1], tEnd), capS = cap(c[0], R[0], L[0], tSt);
  return poly(L.concat(capE, R.slice().reverse(), capS));
}
/* the torso lofted through horizontal rings [z, half-depth, half-width]; keeps the waist */ function loft(P, cx, rings) {
  const E = rings.map(([z, a, b]) => ell(P, cx, 0, z, a, b, 32)), L = [], R = [];
  for (const e of E) { let l = e[0], r = e[0]; for (const p of e) { if (p[0] < l[0]) l = p; if (p[0] > r[0]) r = p; } L.push(l); R.push(r); }
  const arc = (e, from, to, pick) => { const n = e.length, i0 = e.indexOf(from), i1 = e.indexOf(to), f = [], b = []; for (let i = i0; ; i = (i + 1) % n) { f.push(e[i]); if (i === i1) break; } for (let i = i0; ; i = (i - 1 + n) % n) { b.push(e[i]); if (i === i1) break; } const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return pick(my(f), my(b)) ? f : b; };
  const top = arc(E[E.length - 1], L[L.length - 1], R[R.length - 1], (a, b) => a < b), bot = arc(E[0], R[0], L[0], (a, b) => a > b);
  return poly(L.concat(top, R.slice().reverse(), bot));
}
/* a point on the front of the torso at height z, y across */ const frontAt = (rings, cx, z, y) => { let i = 0; while (i < rings.length - 2 && rings[i + 1][0] < z) i++; const [z0, a0, b0] = rings[i], [z1, a1, b1] = rings[i + 1], t = clamp((z - z0) / (z1 - z0), 0, 1), a = a0 + (a1 - a0) * t, b = b0 + (b1 - b0) * t; return [cx + a * Math.sqrt(Math.max(0, 1 - (y / b) ** 2)), y, z]; };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let vmax = value;
  const C = Cam(45, 0.5, 3.6);
  fit(C, [[-16, -16, 0], [16, 16, 0], [16, -16, 0], [-16, 16, 0], [0, 0, 77]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, rrect(-16.0, -16.0, 16.0, 16.0, 16.0, 14), rrect(-14.5, -14.5, 14.5, 14.5, 14.5, 14), 0, PL));
  const body = mk("g", {}, g), el = {};
  const Z = (z) => PL + z;
  const TR = HARD ? [[Z(26.5), 5.2, 8.0], [Z(29), 5.0, 7.7], [Z(32.5), 5.4, 7.8], [Z(36.5), 6.3, 8.8], [Z(41.5), 6.9, 9.6], [Z(45.5), 6.8, 10.0], [Z(48.5), 6.2, 9.6], [Z(51.5), 5.0, 7.8]]
    : [[Z(26.5), 5.0, 7.9], [Z(29), 4.8, 7.5], [Z(32.5), 4.5, 7.0], [Z(36.5), 5.3, 7.8], [Z(41.5), 6.0, 8.7], [Z(45.5), 5.7, 9.4], [Z(48.5), 4.6, 8.6], [Z(50.5), 3.5, 6.5]];
  /* люк-ранец поворачивается на петле у края спины (вертикальная ось): кольцо rrect с повёрнутыми точками и нормалями */ const turn = (ring, hx, hy, a) => { const c = Math.cos(a), s2 = Math.sin(a); return ring.map((q) => ({ u: hx + (q.u - hx) * c - (q.v - hy) * s2, v: hy + (q.u - hx) * s2 + (q.v - hy) * c, nu: q.nu * c - q.nv * s2, nv: q.nu * s2 + q.nv * c })); };
  function build(s) {
    body.replaceChildren();
    const pth = (d, cls) => mk("path", { d, class: cls }, body);
    /* the mannequin's stand behind, then the pack that hangs on the back */ pth(seg(P(-8, 0, PL), P(-8, 0, Z(30))), "nf lo");
    const lift = clamp(s / Math.max(1, vmax), 0, 1);
    el.packs = [];
    if (HARD) {
      /* проём в спине кирасы, потом сам люк-ранец: он открывается на петле, как дверца, — так в скафандр входят */ const ang = -1.9 * lift, hx = -5.0, hy = 7.4, f0 = KR ? -15.5 : -14.8, t0 = Z(KR ? 25 : 26), t1 = Z(KR ? 56 : 55);
      if (lift > 0.02) pth(poly([[-5.6, -5.6, Z(30)], [-5.6, 5.6, Z(30)], [-6.2, 5.6, Z(50)], [-6.2, -5.6, Z(50)]].map((p) => P(...p))), "nf lo");
      const o = turn(rrect(f0, -7.4, hx, 7.4, 2.8, 6), hx, hy, ang), i = turn(rrect(f0 + 0.8, -6.6, hx - 0.8, 6.6, 2.0, 6), hx, hy, ang), pr = prism(P, front, o, i, t0, t1);
      el.packs.push(pth(pr.sil, "sil")); pth(pr.crease, "nf"); const tp = (u, v, z) => { const q = turn([{ u, v, nu: 1, nv: 0 }], hx, hy, ang)[0]; return P(q.u, q.v, z); };
      if (lift < 0.12) pth(seg(tp(f0 + 0.2, -6.9, Z(46)), tp(f0 + 0.2, 6.9, Z(46))) + seg(tp(f0 + 0.2, -6.9, Z(36)), tp(f0 + 0.2, 6.9, Z(36))), "nf lo");
      pth(open([tp(hx, hy, t0 + 3), tp(hx, hy, t1 - 3)]), "nf");
    } else if (!YA) {
      const pk = SK ? [-10.5, -4.6, 33, 47] : [-13.5, -4.6, 26, 53];
      el.packs.push(pth(prism(P, front, rrect(pk[0], -6.8, pk[1], 6.8, 2.6, 5), rrect(pk[0] + 0.7, -6.1, pk[1] - 0.7, 6.1, 1.9, 5), Z(pk[2]), Z(pk[3])).sil, "sil"));
      pth(seg(P(pk[1] + 0.1, -6.8, Z(pk[2] + 4)), P(pk[1] + 0.1, 6.8, Z(pk[2] + 4))) + (SK ? "" : seg(P(pk[0] + 0.5, -6.6, Z(46)), P(pk[0] + 0.5, 6.6, Z(46))) + seg(P(pk[0] + 0.5, -6.6, Z(40)), P(pk[0] + 0.5, 6.6, Z(40)))), "nf lo");
    }
    /* legs, far one first: one outline each from hip to ankle, knee bellows, thigh strap; laced boots */ el.boots = [];
    const leg = (y) => {
      const hip = [0.2, y, Z(29.5)], th = [0.9, y * 1.02, Z(23)], kn = [1.5, y * 1.04, Z(16.5)], cf = [0.9, y * 1.05, Z(11.5)], an = [0.5, y * 1.06, Z(6.2)];
      pth(limb(P, [hip, th, kn, cf, an], [4.4, 4.0, 3.45, 3.35, 2.7]), "sil");
      for (const dz of [-1.6, 0, 1.6]) pth(half(around(P, [kn[0], kn[1], kn[2] + dz], [0, 0, 1], 3.3, 24)), "nf lo");
      pth(half(around(P, th, [0, 0, 1], 3.85, 24)), "nf");
      const boot = prism(P, front, rrect(-3.2, y - 2.9, 6.6, y + 2.9, 2.8, 6), rrect(-2.5, y - 2.2, 5.9, y + 2.2, 2.1, 6), Z(0), Z(6.6));
      el.boots.push(pth(boot.sil, "sil")); pth(boot.crease, "nf");
      if (YA) { const u = prism(P, front, rrect(3.2, y * 1.03 - 2.2, 6.6, y * 1.03 + 2.2, 1.2, 5), rrect(3.8, y * 1.03 - 1.6, 6.0, y * 1.03 + 1.6, 0.7, 5), Z(17.5), Z(25)); el.packs.push(pth(u.sil, "sil")); pth(u.crease, "nf");
        pth(open([P(4.9, y * 1.03 - 0.6, Z(25)), P(3.6, y * 0.9, Z(28.5)), P(2.4, y * 0.6, Z(31))]), "nf lo"); }
      pth(nearArc(P, 1.7, y, Z(1.3), 4.95, 2.95), "nf lo");
      pth(open([0, 1, 2, 3].flatMap((k) => [P(2.9 - k * 0.55, y - 0.9, Z(3 + k * 0.9)), P(2.9 - k * 0.55, y + 0.9, Z(3.45 + k * 0.9))])), "nf lo");
    };
    leg(-4); leg(4);
    /* arms: shoulder, elbow, wrist on one swept outline; bellows; a cuff; the glove with a thumb */ el.gloves = [];
    const arm = (sd) => {
      const sh = [0.3, sd * 9.8, Z(46)], up = [1.0, sd * 11.0, Z(41)], eb = [2.6, sd * 11.4, Z(36.2)], fa = [4.8, sd * 10.9, Z(32.6)], wr = [6.6, sd * 10.2, Z(29.6)];
      pth(limb(P, [sh, up, eb, fa, wr], [3.9, 3.35, 3.05, 2.95, 2.6]), "sil");
      const d = nrm(fa.map((x, i) => x - up[i]));
      for (const f of [-0.12, 0, 0.12]) pth(half(around(P, lerp(eb, fa, f + 0.08), d, 3.05, 24)), "nf lo");
      pth(half(around(P, sh, nrm([0, sd, 0.25]), 3.6, 24)), HARD ? "nf" : "nf lo");
      if (HARD) pth(half(around(P, lerp(sh, up, 0.35), nrm([0.1, sd, -0.6]), 3.7, 24)), "nf");
      const dw = nrm(wr.map((x, i) => x - fa[i]));
      for (const f of [0.78, 0.92]) pth(half(around(P, lerp(fa, wr, f), dw, 2.75, 24)), "nf");
      const hand = [8.0, sd * 9.8, Z(26.4)], tip = [8.8, sd * 9.5, Z(24.6)];
      el.gloves.push(pth(limb(P, [lerp(wr, hand, 0.2), hand, tip], [2.55, 2.45, 1.9]), "sil"));
      pth(limb(P, [[7.6, sd * 8.0, Z(28)], [8.7, sd * 7.7, Z(26.6)]], [0.85, 0.7]), "sil");
      pth(half(around(P, lerp(wr, hand, 0.55), dw, 2.4, 24)), "nf lo");
    };
    arm(-1);
    /* torso, lofted so the waist stays in; seam down the front, belt with a buckle */ el.torso = pth(loft(P, 0.4, TR), "sil");
    pth(open([Z(33.5), Z(37), Z(41), Z(45), Z(48.5)].map((z) => P(...frontAt(TR, 0.4, z, 0)))), "nf lo");
    pth(nearArc(P, 0.4, 0, Z(31.2), 4.25, 6.75), "nf"); pth(nearArc(P, 0.4, 0, Z(30.2), 4.35, 6.9), "nf lo");
    const bk = frontAt(TR, 0.4, Z(30.7), 0); pth(poly([P(bk[0] + 0.2, -1.3, Z(29.7)), P(bk[0] + 0.2, 1.3, Z(29.7)), P(bk[0] + 0.2, 1.3, Z(31.7)), P(bk[0] + 0.2, -1.3, Z(31.7))]), "sil");
    pth(nearArc(P, 0.4, 0, Z(48.6), 4.45, 8.35), "nf lo");
    if (SK) {
      /* harness straps crossing the chest with a ring where they meet, ventilation fitting and hose to the hip */ const st = (y0, z0, y1, z1) => open(Array.from({ length: 9 }, (_, k) => { const t = k / 8; return P(...frontAt(TR, 0.55, z0 + (z1 - z0) * t, y0 + (y1 - y0) * t)); }));
      pth(st(-6.3, Z(47.5), 5.4, Z(33)) + st(6.3, Z(47.5), -5.4, Z(33)), "nf");
      const mid = frontAt(TR, 0.6, Z(40.3), 0); pth(poly(around(P, mid, [1, 0, 0], 0.9, 14)), "sil");
      const vf = frontAt(TR, 0.7, Z(37.5), 3.6); pth(poly(around(P, vf, nrm([1, 0.45, 0]), 1.1, 16)), "sil");
      el.extra = pth(open([P(vf[0] + 0.6, vf[1] + 0.6, vf[2] - 0.6), P(vf[0] + 2.4, vf[1] + 2.6, Z(33.5)), P(vf[0] + 2.2, vf[1] + 3.8, Z(29)), P(vf[0] + 1.2, vf[1] + 3.6, Z(26))]), "nf");
    } else {
      /* the chest control panel with its gauge, and the oxygen hoses to the pack */ const cp = frontAt(TR, 0.4, Z(40), 0);
      if (HARD) { // пульт на груди: широкий блок с рукоятками по бокам
        const pz = KR ? [36, 44] : [34, 41], pw = KR ? 5.4 : 4.6, px = cp[0] + 0.6;
        const pr = prism(P, front, rrect(px - 1.4, -pw, px + 2.4, pw, 1.3, 5), rrect(px - 0.8, -pw + 0.7, px + 1.8, pw - 0.7, 0.7, 5), Z(pz[0]), Z(pz[1]));
        el.panel = pth(pr.sil, "sil"); pth(pr.crease, "nf");
        for (const yy of [-pw - 0.6, pw + 0.6]) pth(open([P(px, yy * 0.86, Z(pz[1] - 1)), P(px + 1.6, yy, Z(pz[1] - 2.2)), P(px + 1.6, yy, Z(pz[0] + 1))]), "nf");
        if (KR) pth(open([P(px + 2.5, -pw + 1, Z(pz[1] + 0.2)), P(px + 3.2, -pw + 1, Z(pz[1] + 3.2)), P(px + 3.2, pw - 1, Z(pz[1] + 3.2)), P(px + 2.5, pw - 1, Z(pz[1] + 0.2))]), "nf lo");
      } else el.panel = pth(prism(P, front, rrect(cp[0] - 1.2, -3.8, cp[0] + 1.6, 3.8, 1.2, 4), rrect(cp[0] - 0.8, -3.3, cp[0] + 1.2, 3.3, 0.8, 4), Z(37), Z(43.5)).sil, "sil");
      const gz = HARD ? [cp[0] + 3.1, 1.6, Z(KR ? 41 : 38.5)] : [cp[0] + 1.7, 1.6, Z(41.5)]; pth(poly(around(P, gz, [1, 0, 0], 1, 14)), "nf");
      pth(seg(P(cp[0] + 1.7, -2.6, Z(39)), P(cp[0] + 1.7, -0.4, Z(39))), "nf lo");
      el.extra = HARD || YA ? el.panel : el.packs[0];
    }
    arm(1);
    /* neck ring with its bolts, helmet dome, visor frame and glass (turns up with the pointer) */ if (HARD) pth(nearArc(P, 0.4, 0, Z(52.4), 5.6, 7.4), "nf lo");
    else { pth(poly(hull(ell(P, 0.5, 0, Z(50.2), 5.8, 6.1).concat(ell(P, 0.5, 0, Z(52.8), 5.8, 6.1)))), "sil");
    pth(nearArc(P, 0.5, 0, Z(51.5), 5.85, 6.15), "nf lo"); }
    if (!HARD) for (let k = 0; k < 9; k++) { const t = -1.2 + k * 0.3, p = [0.5 + 5.85 * Math.cos(t), 6.15 * Math.sin(t), Z(51.5)]; pth(poly(around(P, p, [Math.cos(t), Math.sin(t), 0], 0.28, 8)), "nf"); }
    const hc = HARD ? [1.2, 0, Z(58.6)] : [0.8, 0, Z(59.4)];
    const o = P(...hc), e = P(hc[0] + HR * 0.7071, hc[1] - HR * 0.7071, hc[2]), hr = Math.hypot(e[0] - o[0], e[1] - o[1]);
    el.helmet = mk("ellipse", { cx: o[0].toFixed(2), cy: o[1].toFixed(2), rx: hr.toFixed(2), ry: hr.toFixed(2), class: "sil" }, body);
    const vl = HARD ? 0.18 : lift, vd = nrm([0.92 - 0.5 * vl, 0.22, 0.05 + 1.05 * vl]);
    const visor = (r, a, sx, sy = 0.82) => { const u = nrm(cross(vd, [0, 0, 1])), v = cross(vd, u); return Array.from({ length: 30 }, (_, k) => { const t = (k / 30) * 2 * Math.PI; const q = [0, 1, 2].map((i) => Math.cos(a) * vd[i] + Math.sin(a) * (Math.cos(t) * u[i] * sx + Math.sin(t) * v[i] * sy)); return P(hc[0] + r * q[0], hc[1] + r * q[1], hc[2] + r * q[2]); }); };
    pth(poly(visor(HR * 1.03, 0.78, 1.12)), "sil");
    el.visor = pth(poly(visor(HR * 1.045, 0.64, 1.1)), "sil");
    if (!SK) pth(poly(visor(HR * 1.06, 0.5, 1.08, 0.7)), "nf lo");
    /* фары по бокам шлема полужёстких скафандров */ if (HARD) for (const yy of [-1, 1]) { const lt = [hc[0] - 0.5, yy * HR * 0.98, hc[2] - 2.2]; pth(poly(around(P, lt, [0, yy, 0], 1.1, 12)), "sil"); }
    /* a glint on the glass */ const gl = visor(HR * 1.05, 0.48, 1.0, 0.75); pth(open(gl.slice(17, 22)), "nf");
    if (SK) { pth(open(around(P, [hc[0], hc[1], hc[2] + HR * 0.42], [0, 0, 1], HR * 0.9, 24).slice(10, 24)), "nf lo");
      const lt = [hc[0] - 1.2, HR * 0.97, hc[2] - 1.5]; pth(poly(around(P, lt, [0, 1, 0], 0.9, 12)), "sil"); }
    light(cur);
  }
  let cur = -1;
  function light(a) {
    cur = a;
    if (!el.helmet) return;
    el.helmet.classList.toggle("hi", a === 0);
    el.visor.classList.toggle("hi", a === 1 || a < 0);
    el.torso.classList.toggle("hi", a === 2);
    el.packs.forEach((x) => x.classList.toggle("hi", a === 3 || (!SK && !HARD && !YA && a === 6)));
    el.gloves.forEach((x) => x.classList.toggle("hi", a === 4));
    el.boots.forEach((x) => x.classList.toggle("hi", a === 5));
    if (SK || HARD || YA) el.extra.classList.toggle("hi", a === 6);
  }
  const sp = spring(0.25 * vmax);
  let drawn = NaN;
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; build(sp.x); } return m; });
  bag.add(B.unregister);
  /* nearest part; the parts never move, only the visor turns (rule 01) */ function hit([sx, sy]) {
    const A = [[0, 0, Z(63), 8], [8, 2, Z(59), 5], [2, 0, Z(41), 10], YA ? [5, 4.2, Z(21), 4] : [-10, 0, Z(42), 7], [7.3, 9.6, Z(25.5), 5], [2, 0, Z(3), 8], ...(SK ? [[7, 7, Z(31), 4]] : HARD ? [[8.5, 0, Z(KR ? 40 : 37.5), 4]] : YA ? [[7.5, 0, Z(40), 3.5]] : [])];
    let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 2.8); if (d < 1 && d < bd) { bd = d; best = k; } });
    return best;
  }
  function move(p) {
    sp.t = clamp(HARD ? (300 - p[0]) / 170 : (p[0] - 110) / 180, 0, 1) * vmax;
    const a = hit(p);
    if (a !== cur) { light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0.25 * vmax; light(-1); read.textContent = "rest"; B.wake(); }
  build(sp.x); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { vmax = v; sp.t = Math.min(sp.t, vmax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "krechet",
  means: "Лунный скафандр «Кречет»: кираса со шлемом, люк-ранец на спине и пульт на груди. Палец открывает люк.",
  rules: [1, 5, 9, 10],
  range: [6, 10, 14],
  tour: [[150, 120], [220, 160], [260, 230], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Lunokhod 1, from the museum's photographs: a bowl-shaped tub that narrows
 * to the bottom under a saw-tooth band, a round lid wider than the tub with
 * the solar cells inside, eight wire wheels with stepped motor hubs, a ribbed
 * pencil-beam antenna on a turret at the front and a striped cone antenna
 * beside it. The pointer's x opens the lid on a spring; what the pointer is
 * nearest, a wheel, the lid, the cameras or an antenna, is named.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, proj, ringAt, run, rrect, prism, seg, unproj,
  spring, stepS, disposer, mk, pointer, put, register, solid, place, rad,
} = HL;

const PL = 3, WR = 6.2, AX = PL + WR, ZB = AX + 5, ZM = ZB + 9, ZT = ZB + 17, RB = 15, RM = 22, RT = 25.5, RL = 27.5, WY = 17;
const WX = [-14, -4.7, 4.7, 14];
const NAMES = ["колесо", "крышка", "камеры", "антенна", "конусная антенна"];
const disc = (r, cx = 0, cy = 0, n = 18) => rrect(cx - r, cy - r, cx + r, cy + r, r, n);
const nrm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** Circle of radius r around point c, in the plane normal to d. */
const ringAround = (P, c, d, r, n = 18) => { const u = nrm(cross(d, Math.abs(d[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1])), v = cross(d, u); return Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(...[0, 1, 2].map((i) => c[i] + r * (Math.cos(t) * u[i] + Math.sin(t) * v[i]))); }); };
/** A tube from a to b, radius r: silhouette and its near end. */
const tube = (P, a, b, r) => { const d = nrm(b.map((x, i) => x - a[i])); return { sil: poly(hull(ringAround(P, a, d, r).concat(ringAround(P, b, d, r)))), end: poly(ringAround(P, b, d, r * 0.7)) }; };

function wheel(P, x, y, s) {
  const c = (yy) => [x, yy, AX], o = y + s * 1.8, i = y - s * 1.8, ring = (yy, r, n = 24) => ringAround(P, c(yy), [0, 1, 0], r, n);
  const spokes = Array.from({ length: 12 }, (_, k) => { const t = (k / 12) * 2 * Math.PI, t2 = t + 0.9; return seg(P(x + 1.4 * Math.cos(t), o - s * 1.4, AX + 1.4 * Math.sin(t)), P(x + (WR - 0.6) * Math.cos(t2), o, AX + (WR - 0.6) * Math.sin(t2))); }).join("");
  const mesh = Array.from({ length: 14 }, (_, k) => { const t = (k / 14) * 2 * Math.PI; return seg(P(x + WR * Math.cos(t), o, AX + WR * Math.sin(t)), P(x + WR * Math.cos(t), i, AX + WR * Math.sin(t))); }).join("");
  // the stepped motor hub, pointing outwards
  const hub = poly(hull(ring(o - s * 0.5, 2.2, 12).concat(ring(o + s * 1.8, 1.5, 12), ring(o + s * 3.4, 0.7, 12))));
  return { sil: poly(hull(ring(o, WR).concat(ring(i, WR)))), rim: poly(ring(o, WR - 0.6)), mesh, spokes, hub };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let amax = rad(value);
  const C = Cam(45, 0.5, 2.7);
  fit(C, [[-31, -31, 0], [31, 31, 0], [31, -31, 0], [-31, 31, 0], [-RL, 0, ZT + 2 * RL * 0.95], [30, -12, ZT + 30], [12, 8, ZT + 22]], 200, 170);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, disc(31), disc(29), 0, PL));
  mk("path", { d: [[-20, 20, 4.5], [22, -21, 3.5]].map(([x, y, r]) => poly(ringAt(P, disc(r, x, y, 10), PL))).join(""), class: "nf lo" }, g);

  const mkWheel = (x, y, s) => { const grp = mk("g", {}, g), w = wheel(P, x, y, s); const sl = mk("path", { d: w.sil, class: "sil" }, grp); mk("path", { d: w.mesh, class: "nf lo" }, grp); mk("path", { d: w.rim, class: "nf" }, grp); mk("path", { d: w.spokes, class: "nf lo" }, grp); mk("path", { d: w.hub, class: "nf" }, grp); return sl; };
  const wheels = WX.map((x) => mkWheel(x, -WY, -1));
  // the chassis frame between the wheels
  mk("path", { d: [-WY + 3, WY - 3].map((y) => seg(P(-17, y, AX + 1.5), P(17, y, AX + 1.5))).join("") + seg(P(17, -WY + 3, AX + 1.5), P(17, WY - 3, AX + 1.5)), class: "nf lo" }, g);
  // the bowl: narrow bottom ring, slightly full walls, wide rim; the saw-tooth band under the rim
  const tub = solid(g);
  put(tub, { sil: poly(hull([[RB, ZB], [RM, ZM], [RT, ZT]].flatMap(([r, z]) => ringAt(P, disc(r), z)))), crease: open(ringAt(P, run(disc(RB + 0.3), front), ZB + 1.5)) + open(ringAt(P, run(disc(RT - 0.8), front), ZT - 1.2)) });
  const saw = []; const fr = run(disc(RT - 1.6, 0, 0, 30), front);
  fr.forEach((q, k) => saw.push(P(q.u, q.v, k % 2 ? ZT - 2 : ZT - 5)));
  mk("path", { d: open(saw), class: "nf lo" }, g);
  // the two camera eyes in the front of the bowl, and the thin whip rods
  const eyes = mk("g", {}, g);
  for (const y of [-5, 5]) { const a = [RM - 2, y, ZM + 1], b = [RM + 1.4, y, ZM + 1]; const t = tube(P, a, b, 2.1); mk("path", { d: t.sil, class: "sil" }, eyes); mk("path", { d: t.end, class: "nf" }, eyes); }
  mk("path", { d: seg(P(RM - 1, -14, ZM + 3), P(RM + 18, -26, ZM - 2)) + seg(P(-RM + 4, 13, ZM + 2), P(-RM - 8, 28, ZM - 3)), class: "nf" }, g);
  WX.forEach((x) => wheels.push(mkWheel(x, WY, 1)));

  // the lid, hinged along the back of the rim; inside it the grid of cells
  const lidG = mk("g", {}, g), lidEdge = mk("path", { class: "lo" }, lidG), lid = mk("path", { class: "sil" }, lidG), cells = mk("path", { class: "nf lo" }, lidG);
  const L = (u, v, a, t) => P(-RL + u * Math.cos(a) - t * Math.sin(a), v, ZT + 0.6 + u * Math.sin(a) + t * Math.cos(a));
  const rim = (a, t) => Array.from({ length: 56 }, (_, k) => { const th = (k / 56) * 2 * Math.PI; return L(RL + RL * Math.cos(th), RL * Math.sin(th), a, t); });

  // the turret with the ribbed pencil-beam antenna (front left) and the striped cone (front right)
  const ant = mk("g", {}, g);
  put(solid(ant), prism(P, front, disc(3.4, 19, -11, 10), disc(2.8, 19, -11, 10), ZT, ZT + 8));
  const A0 = [19, -11, ZT + 10], A1 = [33, -13, ZT + 27], at = tube(P, A0, A1, 2.1);
  const beam = mk("path", { d: at.sil, class: "sil" }, ant);
  mk("path", { d: [0.2, 0.35, 0.5, 0.65, 0.8].map((f) => poly(ringAround(P, A0.map((x, i) => x + (A1[i] - x) * f), nrm(A1.map((x, i) => x - A0[i])), 2.15, 14))).join("") + at.end, class: "nf lo" }, ant);
  mk("path", { d: seg(P(12, 9, ZT), P(12, 9, ZT + 8)), class: "nf" }, ant);
  const cone = mk("path", { d: poly(hull(ringAt(P, disc(2.6, 12, 9, 8), ZT + 8).concat(ringAt(P, disc(0.4, 12, 9, 6), ZT + 21)))), class: "sil" }, ant);
  mk("path", { d: open(Array.from({ length: 40 }, (_, k) => { const f = k / 39, r = 2.6 - 2.2 * f, t = f * 4 * 2 * Math.PI; return P(12 + r * Math.cos(t), 9 + r * Math.sin(t), ZT + 8 + 13 * f); }).filter((_, k) => true)), class: "nf lo" }, ant);

  const op = spring(0.45 * amax);
  let drawn = NaN, pick = -2;
  function draw() {
    if (op.x === drawn) return;
    drawn = op.x;
    const a = op.x;
    lidEdge.setAttribute("d", poly(rim(a, 0)));
    lid.setAttribute("d", poly(hull(rim(a, 0).concat(rim(a, 1.4)))));
    if (a < rad(14)) { cells.setAttribute("d", ""); return; }
    let d = "";
    for (let u = 3.4; u < 2 * RL; u += 3.4) { const h = Math.sqrt(Math.max(0, RL * RL - (u - RL) ** 2)) - 1.2; if (h > 1) d += seg(L(u, -h, a, -0.3), L(u, h, a, -0.3)); }
    for (let v = -RL + 3.4; v < RL; v += 3.4) { const h = Math.sqrt(Math.max(0, RL * RL - v * v)) - 1.2; if (h > 1) d += seg(L(RL - h, v, a, -0.3), L(RL + h, v, a, -0.3)); }
    cells.setAttribute("d", d);
  }
  function light(k, w) {
    wheels.forEach((s, i) => s.classList.toggle("hi", k === 0 && i === w));
    lid.classList.toggle("hi", k === 1);
    eyes.querySelectorAll(".sil").forEach((el) => el.classList.toggle("hi", k === 2));
    beam.classList.toggle("hi", k === 3 || k < 0);
    cone.classList.toggle("hi", k === 4);
  }
  const B = register(stage, (dt) => { const m = stepS(op, dt); draw(); return m; });
  bag.add(B.unregister);

  // the ground plane never moves (rule 01)
  function hit([sx, sy]) {
    const [wx, wy] = unproj(C, sx, sy, PL);
    if (Math.hypot(wx, wy) > 33) return [-1, -1];
    if (Math.abs(wy) > 19) { let best = 0, bd = 99; WX.forEach((x, k) => { const dd = Math.abs(wx - x); if (dd < bd) { bd = dd; best = k; } }); return [0, wy < 0 ? best : 4 + best]; }
    if (wx > 15 && wy < -4) return [3, -1];
    if (wx > 6 && wy > 4) return [4, -1];
    if (wx > 15) return [2, -1];
    return [1, -1];
  }
  function move(p) {
    op.t = clamp((p[0] - 110) / 180, 0, 1) * amax;
    const [k, w] = hit(p), key = k * 10 + w;
    if (key !== pick) { pick = key; light(k, w); read.textContent = k < 0 ? "rest" : k === 0 ? NAMES[0] + " " + (w + 1) : NAMES[k]; }
    B.wake();
  }
  function leave() { op.t = 0.45 * amax; pick = -2; light(-1, -1); read.textContent = "rest"; B.wake(); }
  draw(); light(-1, -1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { amax = rad(v); op.t = Math.min(op.t, amax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "lunokhod",
  means: "«Луноход-1» по фото музея: палец открывает круглую крышку с солнечной батареей, детали называются.",
  rules: [1, 5, 6, 9],
  range: [45, 70, 95],
  tour: [[150, 120], [215, 240], [300, 200], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Luna-16, the automatic station that brought lunar soil home in 1970: a landing stage on four
 * legs with round pads, its cluster of spherical tanks, the ascent stage above with the small
 * return capsule on top, and the drilling arm on its side. The pointer's x swings the arm from
 * the ground up to the capsule, as the station did with its 101 grams of soil.
 * What the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, circ, clamp, facing, fit, hull, open, poly, prism, proj, rad, rrect, seg, put, solid,
  spring, stepS, disposer, mk, pointer, register,
} = HL;

const NAMES = ["капсула", "взлётная ступень", "баки", "опоры", "грунтозаборник"];
const ringAt = (r, x, y, n = 24) => circ(r, n).map((q) => ({ u: q.u + x, v: q.v + y, nu: q.nu, nv: q.nv }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let amax = value;
  const C = Cam(45, 0.5, 5.4);
  fit(C, [[-15, -15, 0], [15, 15, 0], [15, -15, 0], [-15, 15, 0], [0, 0, 35], [23, 0, 2]], 200, 170);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg), el = { legs: [], tanks: [] };
  const pth = (d, cls, par = g) => mk("path", { d, class: cls }, par);
  const ball = (x, y, z, r, par = g) => { const o = P(x, y, z), e = P(x + r * 0.7071, y - r * 0.7071, z), rr = Math.hypot(e[0] - o[0], e[1] - o[1]);
    return mk("ellipse", { cx: o[0].toFixed(2), cy: o[1].toFixed(2), rx: rr.toFixed(2), ry: rr.toFixed(2), class: "sil" }, par); };
  const cyl = (r, z0, z1, x = 0, y = 0, b = 0.7) => { const s = solid(g); put(s, prism(P, front, ringAt(r, x, y), ringAt(r - b, x, y), z0, z1)); return s; };
  // a strut as a thin quad between two world points
  const strut = (a, b, w = 0.5) => { const A = P(...a), B = P(...b), dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * w * 2, ny = dx / l * w * 2;
    return poly([[A[0] + nx, A[1] + ny], [B[0] + nx, B[1] + ny], [B[0] - nx, B[1] - ny], [A[0] - nx, A[1] - ny]]); };
  // legs and pads, far ones first
  const LEG = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  const leg = ([sx, sy]) => { const pad = [sx * 12.5, sy * 12.5, 0.6]; const s = solid(g); put(s, prism(P, front, ringAt(2.2, pad[0], pad[1], 16), ringAt(1.6, pad[0], pad[1], 16), 0, 0.9));
    el.legs.push(pth(strut([sx * 6.5, sy * 6.5, 9], [pad[0], pad[1], 1]) + strut([sx * 7.5, sy * 3.5, 12], [pad[0], pad[1], 1], 0.35) + strut([sx * 3.5, sy * 7.5, 12], [pad[0], pad[1], 1], 0.35), "sil")); el.legs.push(s.sil); };
  leg(LEG[0]);
  // the drilling arm: pivot on the +x side; it sits behind or in front of the body by its angle
  const armBack = pth("", "sil"), armBackH = pth("", "nf");
  // landing stage: frame ring, then four spherical tanks back to front
  el.frame = cyl(8.6, 8, 11.5, 0, 0, 1.2).sil;
  const TK = [[-4.6, -4.6], [4.6, -4.6], [-4.6, 4.6], [4.6, 4.6]];
  leg(LEG[1]); leg(LEG[2]);
  for (const [x, y] of TK) el.tanks.push(ball(x, y, 14.4, 4.3));
  // ascent stage: a short drum of tanks, the instrument bay, the capsule
  el.asc = cyl(4.6, 17.5, 24.5).sil;
  pth(open(HL.run(ringAt(4.6, 0, 0, 36), front).map((q) => P(q.u, q.v, 21))), "nf lo");
  cyl(2.9, 24.5, 27.5, 0, 0, 0.5);
  pth(seg(P(0, -2, 27.5), P(-2, -6, 33)) + seg(P(0, 2, 27.5), P(-2, 6, 33)), "nf");
  el.cap = ball(0, 0, 30.8, 3.2);
  pth(open(Array.from({ length: 13 }, (_, k) => { const a = (k / 12) * Math.PI; return P(3.2 * 0.7071 * Math.cos(a), -3.2 * 0.7071 * Math.cos(a), 30.8 + 3.2 * 0.12 * Math.sin(a)); })), "nf lo");
  leg(LEG[3]);
  const armFront = pth("", "sil"), armFrontH = pth("", "nf");

  const PV = [8.4, 3.2, 13];
  function build(deg) {
    const t = rad(deg), d = [Math.cos(t), 0, Math.sin(t)], L = 15, tip = PV.map((v, i) => v + d[i] * L);
    const arm = strut(PV, tip, 0.55), head = poly(hull([-1, 1].flatMap((s) => [0, 3].map((k) => P(...tip.map((v, i) => v + d[i] * k + (i === 1 ? s * 1.1 : 0)))))));
    const inFront = deg < 40;
    armBack.setAttribute("d", inFront ? "" : arm + head); armFront.setAttribute("d", inFront ? arm + head : "");
    armBackH.setAttribute("d", inFront ? "" : poly(ringAt(1, PV[0], PV[1], 12).map((q) => P(q.u, q.v, PV[2]))));
    armFrontH.setAttribute("d", inFront ? poly(ringAt(1, PV[0], PV[1], 12).map((q) => P(q.u, q.v, PV[2]))) : "");
  }
  let cur = -1;
  function light(k) {
    cur = k;
    el.cap.classList.toggle("hi", k === 0 || k < 0); el.asc.classList.toggle("hi", k === 1);
    el.tanks.forEach((x) => x.classList.toggle("hi", k === 2)); el.legs.forEach((x) => x.classList.toggle("hi", k === 3));
    [armBack, armFront].forEach((x) => x.classList.toggle("hi", k === 4));
  }
  const sp = spring(-58);
  let drawn = NaN;
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; build(sp.x); } return m; });
  bag.add(B.unregister);
  // fixed hit points of the rest pose (rule 01); the arm is found where it rests, by the ground
  const A = [[0, 0, 31, 3.5], [0, 0, 21, 4.5], [0, 0, 14, 6], [12.5, 12.5, 1, 3.5], [15, 3.2, 2, 3.5]];
  function hit([sx, sy]) { let best = -1, bd = 1e9; A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), dd = Math.hypot(sx - p[0], sy - p[1]) / (r * 5.4 * 1.2); if (dd < 1 && dd < bd) { bd = dd; best = k; } }); return best; }
  function move(p) {
    sp.t = -58 + clamp((p[0] - 100) / 200, 0, 1) * (amax + 58);
    const k = hit(p); if (k !== cur) { light(k); read.textContent = k < 0 ? "rest" : NAMES[k]; } B.wake();
  }
  function leave() { sp.t = -58; light(-1); read.textContent = "rest"; B.wake(); }
  build(sp.x); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { amax = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "luna16",
  means: "«Луна-16» на опорах: палец поднимает грунтозаборник от грунта к возвращаемой капсуле.",
  rules: [1, 5, 6, 9],
  range: [100, 115, 130],
  tour: [[250, 250], [220, 150], [200, 70], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * The descent capsule of Venera-4, the first craft to radio back from inside another planet's
 * atmosphere (1967): a heat-shielded ball on a museum cradle, the parachute bay on its crown and
 * the antenna rod. The pointer's x pops the bay's lid and opens the canopy above, as the capsule
 * hung under it for an hour and a half on the way down.
 * What the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, circ, clamp, facing, fit, hull, open, poly, prism, proj, seg, put, solid,
  spring, stepS, disposer, mk, pointer, register,
} = HL;

const NAMES = ["шар", "парашютный отсек", "антенна", "парашют"];
const R = 9, ZC = 12.5;
const ringAt = (r, n = 28) => circ(r, n);
const ringZ = (P, r, z, n = 40) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(r * Math.cos(t), r * Math.sin(t), z); });

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let hmax = value;
  const C = Cam(45, 0.5, 6.2);
  fit(C, [[-10, -10, 0], [10, 10, 0], [0, 0, ZC + R + 8 + hmax + 9], [-15, 0, ZC + R + hmax], [15, 0, ZC + R + hmax]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg), el = {};
  const pth = (d, cls) => mk("path", { d, class: cls }, g);
  // the canopy and its lines sit behind everything, so they are painted first
  const lines = pth("", "nf lo"), canopy = pth("", "sil"), gores = pth("", "nf lo");
  // the cradle
  { const s = solid(g); put(s, prism(P, front, ringAt(6.5), ringAt(5.8), 0, 2.2)); el.cradle = s.sil; }
  // the ball, its belt and the near half of the shield seam
  const o = P(0, 0, ZC), e = P(R * 0.7071, -R * 0.7071, ZC), rr = Math.hypot(e[0] - o[0], e[1] - o[1]);
  el.ball = mk("ellipse", { cx: o[0].toFixed(2), cy: o[1].toFixed(2), rx: rr.toFixed(2), ry: rr.toFixed(2), class: "sil" }, g);
  const nearRing = (r, z) => open(HL.run(circ(r, 40), front).map((q) => P(q.u, q.v, z)));
  pth(nearRing(Math.sqrt(R * R - 9), ZC - 3) + nearRing(R * 0.995, ZC), "nf lo");
  // parachute bay on the crown: a short drum, its lid lifts on the spring
  const bayZ = ZC + Math.sqrt(R * R - 3.6 * 3.6) - 0.6;
  { const s = solid(g); put(s, prism(P, front, ringAt(3.6), ringAt(3.0), bayZ, bayZ + 3)); el.bay = s.sil; }
  const lid = solid(g), rod = pth("", "sil");
  function build(h) {
    const lz = bayZ + 3 + h * 0.35;
    put(lid, prism(P, front, ringAt(3.7), ringAt(3.1), lz, lz + 0.9));
    rod.setAttribute("d", seg(P(-1.8, -1.8, lz + 0.9), P(-2.2, -2.2, lz + 3.4)));
    const cz = lz + 4 + h, f = clamp(h / Math.max(1, hmax), 0, 1), cr = 3.5 + 11.5 * f, ch = cr * 0.75;
    if (f < 0.04) { canopy.setAttribute("d", ""); lines.setAttribute("d", ""); gores.setAttribute("d", ""); return; }
    // canopy: a dome, its rim and silhouette; the lines run from the rim to the lid
    const rim = ringZ(P, cr, cz), top = P(0, 0, cz + ch), dome = Array.from({ length: 25 }, (_, k) => { const t = Math.PI * k / 24, x = cr * Math.cos(t), z = cz + ch * Math.sin(t); return P(x * 0.7071, -x * 0.7071, z); });
    const near = rim.filter((_, k) => { const t = (k / rim.length) * 2 * Math.PI; return Math.cos(t) + Math.sin(t) > 0; });
    canopy.setAttribute("d", poly(hull(dome.concat(rim))));
    gores.setAttribute("d", open(near.slice().sort((p1, p2) => p1[0] - p2[0])));
    lines.setAttribute("d", [0, 1, 2, 3, 4, 5].map((k) => { const t = (k / 6) * 2 * Math.PI + 0.4; return seg(P(cr * Math.cos(t), cr * Math.sin(t), cz), P(0, 0, lz + 0.9)); }).join(""));
  }
  let cur = -1;
  function light(k) {
    cur = k;
    el.ball.classList.toggle("hi", k === 0); el.bay.classList.toggle("hi", k === 1 || k < 0); lid.sil.classList.toggle("hi", k === 1 || k < 0);
    rod.classList.toggle("hi", k === 2); canopy.classList.toggle("hi", k === 3);
  }
  const sp = spring(0);
  let drawn = NaN;
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; build(sp.x); } return m; });
  bag.add(B.unregister);
  // fixed points of the closed pose; the canopy answers where it opens, above the crown (rule 01)
  const A = [[0, 0, ZC, 7], [0, 0, ZC + R + 1.5, 3], [-2.6, -2.6, ZC + R + 7, 2], [0, 0, ZC + R + 14, 5]];
  function hit([sx, sy]) { let best = -1, bd = 1e9; A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 6.2 * 1.2); if (d < 1 && d < bd) { bd = d; best = k; } }); return best; }
  function move(p) { sp.t = clamp((p[0] - 110) / 180, 0, 1) * hmax; const k = hit(p); if (k !== cur) { light(k); read.textContent = k < 0 ? "rest" : NAMES[k]; } B.wake(); }
  function leave() { sp.t = 0; light(-1); read.textContent = "rest"; B.wake(); }
  build(0); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { hmax = v; sp.t = Math.min(sp.t, hmax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "venera4",
  means: "Спускаемый аппарат «Венера-4»: палец открывает парашютный отсек и раскрывает купол над шаром.",
  rules: [1, 5, 6, 9],
  range: [6, 9, 12],
  tour: [[150, 220], [230, 150], [270, 80], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
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

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Energia — Buran, lying as on the rollout: the central block Ts with its ogive nose, four strap-on
 * blocks A round its lower half, and the orbiter on top: fuselage, double-delta wing, tail fin.
 * The pointer's x plays the separation: the blocks A drift off and back, then Buran lifts from
 * its attach struts and moves ahead. Hit areas are the rest pose; what is nearest is named.
 */
const {
  Cam, clamp, fit, hull, open, poly, proj, seg, spring, stepS, disposer, mk, pointer, register,
} = HL;

const Z0 = 12, RC = 4, RA = 1.95, D = RC + RA + 0.15;
const XC0 = -29, XC1 = 25, XN = 34, XA1 = 7, XA2 = 12;
const ZB = Z0 + RC + 0.7 + 2.5, RB = 2.5, XR = -22, XF = 10, XT = 15;
const ANG = [100, 150, -150, -100];                 // blocks A, degrees from +z round the x axis (+ is the near side)
const NAMES = ["Буран", "блок Ц", "блок А·1", "блок А·2", "блок А·3", "блок А·4", "крыло", "киль"];

const ring = (P, x, r, y, z, n = 30) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x, y + r * Math.cos(t), z + r * Math.sin(t)); });
const tube = (P, x0, x1, r0, r1, y, z) => poly(hull(ring(P, x0, r0, y, z).concat(ring(P, x1, r1, y, z))));
/** a convex body of revolution from [x, r] stations, one silhouette */
const body = (P, st, y, z) => poly(hull(st.flatMap(([x, r]) => ring(P, x, r, y, z))));
/** the near half of a ring round the x axis: the run that hangs lower on screen */
const nearR = (P, x, r, y, z) => { const e = ring(P, x, r, y, z, 36); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; });
  const f = [], b = []; for (let i = iL; ; i = (i + 1) % 36) { f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i + 35) % 36) { b.push(e[i]); if (i === iR) break; }
  const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const C = Cam(45, 0.5, 4.5);
  const far = (u) => [[XC0 - 12, -D - 9, Z0], [XN + 1, D + 9, Z0], [XC0, 0, Z0 - RC - 8], [XR + 9, 0, ZB + 9 + 10 * u], [XT + 7, 12, ZB + 9 * u], [XT + 7, -12, ZB + 9 * u]];
  fit(C, far(1), 200, 166);
  const P = proj(C);
  const g = mk("g", {}, svg);
  const pth = (cls) => mk("path", { class: cls }, g);
  // separation, from one number u in [0, 1]
  const sepA = (u) => clamp(u * 1.7, 0, 1), sepB = (u) => clamp((u - 0.35) / 0.65, 0, 1);
  const posA = (k, u) => { const a = (ANG[k] * Math.PI) / 180, d = D + 6 * sepA(u); return { y: d * Math.sin(a), z: Z0 + d * Math.cos(a), dx: -9 * sepA(u) }; };
  const posB = (u) => ({ dz: 9 * sepB(u), dx: 6 * sepB(u) });
  // paint order: the far and lower blocks, the core, the near block, the struts, Buran
  const el = { A: [] };
  const mkA = () => ({ noz: pth("nf"), sil: pth("sil"), cr: pth("nf lo") });
  el.A[3] = mkA(); el.A[2] = mkA(); el.A[1] = mkA();
  el.core = { noz: pth("nf"), sil: pth("sil"), cr: pth("nf lo") };
  el.A[0] = mkA();
  el.strut = pth("dash nf");
  el.wing = pth("sil"); el.wcr = pth("nf lo");
  el.bur = pth("sil"); el.bcr = pth("nf lo");
  el.fin = pth("sil"); el.fcr = pth("nf lo");
  // the core never moves: drawn once
  el.core.noz.setAttribute("d", [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].map(([y, z]) => tube(P, XC0 - 2.6, XC0, 1.1, 0.7, y, Z0 + z)).join(""));
  el.core.sil.setAttribute("d", body(P, [[XC0, RC], [XC1, RC], [XC1 + 5, 3.1], [XN, 0.5]], 0, Z0));
  el.core.cr.setAttribute("d", nearR(P, XC0 + 1.2, RC - 0.1, 0, Z0) + nearR(P, -6, RC, 0, Z0) + nearR(P, XC1, RC, 0, Z0) + nearR(P, XC1 + 5, 3.1, 0, Z0));

  let drawn = NaN;
  function draw(u) {
    ANG.forEach((_, k) => { const a = posA(k, u), e = el.A[k], x0 = XC0 + a.dx, x1 = XA1 + a.dx;
      e.noz.setAttribute("d", tube(P, x0 - 2.4, x0, 1.3, 0.8, a.y, a.z));
      e.sil.setAttribute("d", body(P, [[x0, RA], [x1, RA], [XA2 + a.dx, 0.35]], a.y, a.z));
      e.cr.setAttribute("d", nearR(P, x0 + 0.8, RA - 0.1, a.y, a.z) + nearR(P, x1, RA, a.y, a.z)); });
    const b = posB(u), x = (v) => v + b.dx, z = ZB + b.dz, zw = z - RB + 0.5;
    el.strut.setAttribute("d", [-14, 4].map((v) => seg(P(v, 0, Z0 + RC), P(x(v), 0, zw))).join(""));
    const W = [[XR, 2], [XR + 1.5, 12], [XR + 6, 12.2], [-3, 4.6], [7, 2.2]];
    el.wing.setAttribute("d", poly(W.concat(W.slice().reverse().map(([a, c]) => [a, -c])).map(([a, c]) => P(x(a), c, zw))));
    el.wcr.setAttribute("d", open([[XR + 1.4, 10.6], [XR + 5.6, 10.8], [-3.6, 4.2]].map(([a, c]) => P(x(a), c, zw))));
    el.bur.setAttribute("d", body(P, [[x(XR), RB], [x(XF), RB], [x(XT), 1.2], [x(XT + 2.6), 0.3]], 0, z));
    el.bcr.setAttribute("d", seg(P(x(XR + 1), 0, z + RB), P(x(4), 0, z + RB)) + nearR(P, x(XF), RB, 0, z) + nearR(P, x(4), RB, 0, z) + open([[XT - 2.4, -1.4], [XT - 1, -1.6], [XT - 1, 1.6], [XT - 2.4, 1.4]].map(([a, c]) => P(x(a), c, z + 1.9))));
    el.fin.setAttribute("d", poly([[XR + 0.6, z + RB - 0.4], [XR - 2.2, z + 9.6], [XR + 1.2, z + 9.6], [XR + 9, z + RB - 0.2]].map(([a, c]) => P(x(a), 0, c))));
    el.fcr.setAttribute("d", seg(P(x(XR + 1.2), 0, z + RB + 0.8), P(x(XR - 0.6), 0, z + 8.4)));
  }

  let cur = -2;
  function light(a) {
    cur = a;
    el.bur.classList.toggle("hi", a === 0 || a < 0);
    el.core.sil.classList.toggle("hi", a === 1);
    el.A.forEach((e, k) => e.sil.classList.toggle("hi", a === 2 + k));
    el.wing.classList.toggle("hi", a === 6); el.fin.classList.toggle("hi", a === 7);
  }
  const sp = spring(0.06);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  // rest-pose targets, tested on screen (rule 01): [x, y, z, radius]
  const pa = (k) => posA(k, 0);
  const T = [[-4, 0, ZB, 7.5], [16, 0, Z0, 6], [-12, pa(0).y + 1, pa(0).z - 1, 3.4], [-12, pa(1).y + 1, pa(1).z - 2, 3], [-24, pa(2).y, pa(2).z - 2, 2.6], [-24, pa(3).y - 1, pa(3).z, 3],
    [-14, 9, ZB - RB, 3.6], [XR - 0.6, 0, ZB + 6.5, 3]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 4.5 * 1.1); if (d < 1 && d < bd) { bd = d; best = k; } }); return best; }
  function move(p) {
    sp.t = clamp((p[0] - 80) / 240, 0.06, 1) * reach;
    const a = hit(p);
    if (a !== cur) { light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0.06; light(-1); read.textContent = "rest"; B.wake(); }
  draw(sp.x); drawn = sp.x; light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "energia",
  means: "«Энергия — Буран»: палец ведёт разделение — блоки А отходят, «Буран» поднимается с центрального блока.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[185, 150], [255, 215], [132, 190], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Soyuz — Apollo, July 1975, in a line: Apollo's service module with its engine bell, antenna and
 * thruster quads, the command module cone, the docking module, the androgynous APAS node, then
 * Soyuz-19: orbital-module ball, descent-module bell, service module with its solar wings.
 * The pointer's x undocks Soyuz and backs it off along the axis; the APAS is bright at rest.
 * Hit areas are the rest pose (rule 01); what is nearest is named.
 */
const {
  Cam, clamp, fit, hull, open, poly, proj, seg, spring, stepS, disposer, mk, pointer, register,
} = HL;

const Z0 = 12, XE = -33, XS0 = -30, XS1 = -15, RS = 3.9, XC1 = -8.5, RCt = 0.9, XD1 = -2, RD = 1.5;
const XA = 0.6, XB = 3.4, RBo = 2.3, XSA0 = 5.6, XSA1 = 9.6, XP1 = 14.4, RP = 2.7, RPF = 3.1;
const NAMES = ["АПАС", "Союз · БО", "Союз · СА", "Союз · ПАО", "батареи", "стык. модуль", "Аполлон · CM", "Аполлон · SM"];

const ringX = (P, x, r, z = Z0, n = 30) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x, r * Math.cos(t), z + r * Math.sin(t)); });
const body = (P, st) => poly(hull(st.flatMap(([x, r]) => ringX(P, x, r))));
const nearX = (P, x, r) => { const e = ringX(P, x, r, Z0, 36); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; });
  const f = [], b = []; for (let i = iL; ; i = (i + 1) % 36) { f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i + 35) % 36) { b.push(e[i]); if (i === iR) break; }
  const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 6.2, C = Cam(45, 0.5, S);
  fit(C, [[XE - 1, -RS, Z0], [XP1 + 10, 0, Z0], [XP1 + 10, 10, Z0], [XP1, -10, Z0], [-20, 0, Z0 - RS - 4], [-24, 0, Z0 + RS + 1], [0, 0, Z0 - 6]], 200, 166);
  const P = proj(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  // Apollo, far to near: engine bell, service module, antenna, command module, docking module
  pth("nf", body(P, [[XE, 2.2], [XS0, 1.1]]));
  const sm = pth("sil", body(P, [[XS0, RS], [XS1, RS]]));
  pth("nf lo", nearX(P, XS0 + 0.8, RS - 0.1) + nearX(P, -22, RS) + nearX(P, XS1 + 0.6, RS - 0.1)
    + [-1, 1].map((s) => seg(P(XS0 + 2, s * RS * 0.7071, Z0 + RS * 0.7071), P(XS1 - 1, s * RS * 0.7071, Z0 + RS * 0.7071))).join(""));
  // thruster quads: a small cross on the near side and on top
  const quad = (y, z) => seg(P(-17.6, y, z - 0.9), P(-17.6, y, z + 0.9)) + seg(P(-18.5, y, z), P(-16.7, y, z));
  pth("nf", quad(RS + 0.2, Z0) + quad(0, Z0 + RS + 0.2));
  // the high-gain antenna: a mast down from the aft end and four small dishes
  pth("nf", seg(P(XS0 + 1.5, RS * 0.5, Z0 - RS * 0.86), P(XS0 - 1, RS * 0.5 + 1, Z0 - RS - 3)));
  for (const [a, b] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) pth("nf", poly(Array.from({ length: 12 }, (_, k) => { const t = (k / 12) * 2 * Math.PI; return P(XS0 - 1 + a + 0.7 * Math.cos(t), RS * 0.5 + 1 + b, Z0 - RS - 3 + 0.7 * Math.sin(t)); })));
  const cm = pth("sil", body(P, [[XS1, RS], [XS1 + 0.4, RS - 0.2], [XC1, RCt]]));
  pth("nf lo", nearX(P, XS1 + 0.4, RS - 0.25) + open([[-12.6, 1.6], [-12, 1.8]].map(([x, r]) => P(x, r, Z0 + r))));
  const dm = pth("sil", body(P, [[XC1, RD], [XD1, RD]]));
  pth("nf lo", nearX(P, XC1 + 0.6, RD - 0.05) + nearX(P, XD1 - 0.6, RD - 0.05));
  // Soyuz: redrawn when it backs off (dx along +x)
  const ap = pth("sil"), farW = pth("sil"), farWc = pth("nf lo"), fwm = pth("nf");
  const bo = mk("ellipse", { class: "sil" }, g), boc = pth("nf lo");
  const sa = pth("sil"), sac = pth("nf lo");
  const pao = pth("sil"), paoc = pth("nf lo");
  const nwm = pth("nf"), nearW = pth("sil"), nearWc = pth("nf lo");
  const wing = (dx, side, sil, cr, mast) => { const x = XP1 - 1.6 + dx, w = 1.4, y0 = side * (RP + 1.2), y1 = side * 10.5;
    mast.setAttribute("d", seg(P(x, side * RP, Z0), P(x, y0, Z0)));
    sil.setAttribute("d", poly([[x - w, y0], [x + w, y0], [x + w, y1], [x - w, y1]].map(([a, b]) => P(a, b, Z0))));
    cr.setAttribute("d", [0.33, 0.66].map((f) => seg(P(x - w, y0 + (y1 - y0) * f, Z0), P(x + w, y0 + (y1 - y0) * f, Z0))).join("")); };
  let drawn = NaN;
  function draw(u) {
    const dx = 0.05 + 7 * u, X = (v) => v + dx;
    ap.setAttribute("d", body(P, [[XD1, 1.75], [XD1 + 1, 1.75]]) + body(P, [[X(XA - 1.2), 1.75], [X(XA), 1.75]]));
    wing(dx, -1, farW, farWc, fwm);
    const o = P(X(XB), 0, Z0), e = P(X(XB) + RBo * 0.7071, -RBo * 0.7071, Z0), rr = Math.hypot(e[0] - o[0], e[1] - o[1]);
    bo.setAttribute("cx", o[0].toFixed(2)); bo.setAttribute("cy", o[1].toFixed(2)); bo.setAttribute("rx", rr.toFixed(2)); bo.setAttribute("ry", rr.toFixed(2));
    boc.setAttribute("d", seg(P(X(XB + 1.4), -1.6, Z0 + 1.6), P(X(XB + 2.6), -2.6, Z0 + 4)) + seg(P(X(XB + 1.4), 1.6, Z0 + 1.6), P(X(XB + 2.6), 2.6, Z0 + 4)));
    sa.setAttribute("d", body(P, [[X(XSA0), 1.2], [X(XSA1), 2.2]]));
    sac.setAttribute("d", nearX(P, X(XSA1 - 0.4), 2.1));
    pao.setAttribute("d", body(P, [[X(XSA1), RP], [X(XP1 - 1.2), RP], [X(XP1), RPF]]));
    paoc.setAttribute("d", nearX(P, X(XSA1 + 0.6), RP) + nearX(P, X(XP1 - 1.2), RP));
    wing(dx, 1, nearW, nearWc, nwm);
  }
  let cur = -2;
  function light(a) {
    cur = a;
    ap.classList.toggle("hi", a === 0 || a < 0);
    bo.classList.toggle("hi", a === 1); sa.classList.toggle("hi", a === 2); pao.classList.toggle("hi", a === 3);
    farW.classList.toggle("hi", a === 4); nearW.classList.toggle("hi", a === 4);
    dm.classList.toggle("hi", a === 5); cm.classList.toggle("hi", a === 6); sm.classList.toggle("hi", a === 7);
  }
  const sp = spring(0);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  const T = [[0, 0, Z0, 2.2], [XB, 0, Z0, 2.6], [7.6, 0, Z0, 2.4], [12, 0, Z0, 3], [12.8, 7, Z0, 3.6], [-5.2, 0, Z0, 2.6], [-12, 0, Z0, 3.4], [-22, 0, Z0, 6]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * S * 1.15); if (d < 1 && d < bd) { bd = d; best = k; } }); return best; }
  function move(p) {
    sp.t = clamp((p[0] - 110) / 220, 0, 1) * reach;
    const a = hit(p);
    if (a !== cur) { light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0; light(-1); read.textContent = "rest"; B.wake(); }
  draw(0); drawn = 0; light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "asts",
  means: "«Союз — Аполлон»: палец расстыковывает корабли — «Союз-19» отходит от стыковочного узла АПАС.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[200, 160], [250, 190], [120, 120], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
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

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
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

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Proton: the first stage — a central oxidiser tank ringed by six outboard fuel tanks, each with its
 * engine — the lattice interstage, the second and third stages and the payload fairing.
 * The pointer's x separates the stages: they part along the axis and the lattice shows between.
 * Hit areas are the rest pose; the first stage's tanks are bright at rest.
 */
const {
  Cam, clamp, facing, fit, prism, put, rings, solid, hull, open, poly, proj, seg, spring, stepS, disposer, mk, pointer, register,
} = HL;

const R = 2.05, RT = 0.82, DT = R + 0.55, Z1 = 4.6, Z2 = 25, Z3 = 38, Z4 = 42.5, Z5 = 51;
const NAMES = ["1-я ступень", "2-я ступень", "3-я ступень", "обтекатель", "переходник"];
const ringZ = (P, x, y, r, z, n = 26) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x + r * Math.cos(t), y + r * Math.sin(t), z); });
const body = (P, st) => poly(hull(st.flatMap(([x, y, r, z]) => ringZ(P, x, y, r, z))));
const halfZ = (P, r, z) => open(ringZ(P, 0, 0, r, z, 36).filter((_, i) => i <= 18));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 4.3, C = Cam(45, 0.5, S);
  fit(C, [[-7, -7, 0], [7, 7, 0], [0, 0, Z5 + 24], [3, 3, Z5 + 22], [-3, -3, Z5 + 22]], 200, 160);
  const P = proj(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  // the museum's launch table under it
  const [ring, inner] = rings(-6.5, -6.5, 6.5, 6.5, 1.6, 1.1);
  put(solid(g), prism(P, facing(C), ring, inner, 0, 2.4));
  pth("nf lo", poly([[-3.4, -3.4], [3.4, -3.4], [3.4, 3.4], [-3.4, 3.4]].map(([x, y]) => P(x, y, 2.4))));
  // six outboard tanks, sorted far to near round the core
  const ang = [0, 1, 2, 3, 4, 5].map((k) => (k * Math.PI) / 3 + Math.PI / 6);
  const pos = ang.map((a) => [DT * Math.cos(a), DT * Math.sin(a)]).sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
  const tank = ([x, y]) => { pth("nf", body(P, [[x, y, 0.62, 2.4], [x, y, 0.4, Z1]]));
    return pth("sil", body(P, [[x, y, RT, Z1], [x, y, RT, Z2 - 1.6], [x * 0.9, y * 0.9, 0.35, Z2 + 0.4]])); };
  const st1 = [];
  pos.slice(0, 3).forEach((p) => st1.push(tank(p)));
  st1.push(pth("sil", body(P, [[0, 0, 1.5, Z1], [0, 0, R, Z1 + 3], [0, 0, R, Z2]])));
  pos.slice(3).forEach((p) => st1.push(tank(p)));
  pth("nf lo", halfZ(P, R, Z2 - 0.8));
  // the moving upper part
  const lat = pth("nf"), s2 = pth("sil"), c2 = pth("nf lo"), s3 = pth("sil"), c3 = pth("nf lo"), fr = pth("sil"), cf = pth("nf lo");
  let drawn = NaN;
  function draw(u) {
    const d2 = 7 * u, d3 = 12 * u, d4 = 16 * u;
    // the lattice between stage 1 and 2: struts round the near half, stretched by the gap
    const n = 10, a0 = Math.PI * 0.05, zl = Z2, zh = Z2 + 1.6 + d2, L = [];
    for (let k = 0; k <= n; k++) { const a = a0 + (k / n) * Math.PI * 0.9 - Math.PI / 4 + Math.PI / 4, b = a + Math.PI / n;
      L.push(seg(P(R * Math.cos(a), R * Math.sin(a), zl), P(R * Math.cos(b), R * Math.sin(b), zh))); }
    lat.setAttribute("d", L.join(""));
    s2.setAttribute("d", body(P, [[0, 0, R, zh], [0, 0, R, Z3 + d2]]));
    c2.setAttribute("d", halfZ(P, R, zh + 0.9) + halfZ(P, R, Z3 + d2 - 0.9));
    s3.setAttribute("d", body(P, [[0, 0, R * 0.98, Z3 + d3], [0, 0, R * 0.98, Z4 + d3]]));
    c3.setAttribute("d", halfZ(P, R * 0.98, Z4 + d3 - 1.2));
    fr.setAttribute("d", body(P, [[0, 0, R * 1.08, Z4 + d4], [0, 0, R * 1.08, Z5 + d4], [0, 0, 1.3, Z5 + 4 + d4], [0, 0, 0.35, Z5 + 6.8 + d4]]));
    cf.setAttribute("d", halfZ(P, R * 1.08, Z5 + d4) + seg(P(0, -R * 1.08, Z4 + d4 + 0.6), P(0, -R * 1.08, Z5 + d4)));
  }
  let cur = -2;
  function light(k) {
    cur = k;
    st1.forEach((e) => e.classList.toggle("hi", k === 0 || k < 0));
    s2.classList.toggle("hi", k === 1); s3.classList.toggle("hi", k === 2); fr.classList.toggle("hi", k === 3); lat.classList.toggle("hi", k === 4);
  }
  const U0 = 0.06, sp = spring(U0);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  const T = [[0, 0, 14, 4, 0], [0, 0, 31, 3, 1], [0, 0, 40.2, 2.2, 2], [0, 0, 47, 3, 3], [0, 0, Z2 + 1, 1.4, 4]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r, n]) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * S * 1.2); if (d < 1 && d < bd) { bd = d; best = n; } }); return best; }
  function move(p) {
    sp.t = clamp(U0 + ((p[0] - 80) / 240) * reach, U0, reach);
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
  name: "proton",
  means: "«Протон»: палец разделяет ступени — между первой и второй открывается решётчатый переходник.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[200, 230], [210, 120], [200, 60], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
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

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Saturn V: the first stage S-IC with its five F-1 bells and four fins, the S-II, the conical
 * adapter, the S-IVB, the instrument ring, the lunar-module adapter, Apollo's command and service
 * modules and the escape tower. The pointer's x separates the stages along the axis.
 * Hit areas are the rest pose; the first stage is bright at rest.
 */
const {
  Cam, clamp, facing, fit, prism, put, rings, solid, hull, open, poly, proj, seg, spring, stepS, disposer, mk, pointer, register,
} = HL;

const R = 5, R3 = 3.3, Z1 = 6, Z2 = 48, Z3 = 73, Z4 = 78, Z5 = 96, Z6 = 104;
const NAMES = ["S-IC", "S-II", "S-IVB", "Аполлон", "САС", "двигатели F-1"];
const ringZ = (P, x, y, r, z, n = 28) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x + r * Math.cos(t), y + r * Math.sin(t), z); });
const body = (P, st) => poly(hull(st.flatMap(([x, y, r, z]) => ringZ(P, x, y, r, z))));
const halfZ = (P, r, z) => open(ringZ(P, 0, 0, r, z, 36).filter((_, i) => i <= 18));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 2.35, C = Cam(45, 0.5, S);
  fit(C, [[-9, -9, 0], [9, 9, 0], [0, 0, Z6 + 34]], 200, 160);
  const P = proj(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  const [ring, inner] = rings(-8.5, -8.5, 8.5, 8.5, 2, 1.4);
  put(solid(g), prism(P, facing(C), ring, inner, 0, 2.6));
  // five F-1 bells: four round, one centre; and four fins, far ones first
  const bells = pth("sil", [[-2.4, -2.4], [2.4, -2.4], [0, 0], [-2.4, 2.4], [2.4, 2.4]].map(([x, y]) => body(P, [[x, y, 1.8, 2.6], [x, y, 0.9, Z1]])).join(""));
  const fin = (a) => { const c = Math.cos(a), s = Math.sin(a), at = (r, z) => P(c * r, s * r, z); return poly([at(R - 0.2, Z1), at(R + 3.2, 2.8), at(R + 3.2, Z1 + 1.6), at(R - 0.2, Z1 + 9)]); };
  pth("sil", [Math.PI * 1.25, Math.PI * 0.75, Math.PI * 1.75].map(fin).join(""));
  const st1 = pth("sil", body(P, [[0, 0, R * 0.92, Z1], [0, 0, R, Z1 + 3], [0, 0, R, Z2]]));
  pth("nf lo", halfZ(P, R, Z1 + 3) + halfZ(P, R, 22) + halfZ(P, R, Z2 - 4));
  pth("sil", fin(Math.PI * 0.25));
  const s2 = pth("sil"), c2 = pth("nf lo"), s3 = pth("sil"), c3 = pth("nf lo"), ap = pth("sil"), ca = pth("nf lo"), les = pth("sil");
  let drawn = NaN;
  function draw(u) {
    const d2 = 7 * u, d3 = 13 * u, d4 = 18 * u, d5 = 26 * u;
    s2.setAttribute("d", body(P, [[0, 0, R, Z2 + d2], [0, 0, R, Z3 + d2]]));
    c2.setAttribute("d", halfZ(P, R, Z2 + 3 + d2) + halfZ(P, R, Z3 - 3 + d2));
    s3.setAttribute("d", body(P, [[0, 0, R * 0.98, Z3 + d3], [0, 0, R3, Z4 + d3], [0, 0, R3, Z5 - 6 + d3]]));
    c3.setAttribute("d", halfZ(P, R3, Z4 + d3) + halfZ(P, R3, Z5 - 7.4 + d3));
    ap.setAttribute("d", body(P, [[0, 0, R3, Z5 - 6 + d4], [0, 0, 2, Z5 + d4], [0, 0, 2, Z6 - 3 + d4], [0, 0, 0.5, Z6 + d4]]));
    ca.setAttribute("d", halfZ(P, R3, Z5 - 5 + d4) + halfZ(P, 2, Z5 + d4) + halfZ(P, 2, Z6 - 3 + d4));
    les.setAttribute("d", body(P, [[0, 0, 0.55, Z6 + d5], [0, 0, 0.3, Z6 + 7 + d5], [0, 0, 0.12, Z6 + 9 + d5]]));
  }
  let cur = -2;
  function light(k) {
    cur = k;
    st1.classList.toggle("hi", k === 0 || k < 0);
    s2.classList.toggle("hi", k === 1); s3.classList.toggle("hi", k === 2); ap.classList.toggle("hi", k === 3); les.classList.toggle("hi", k === 4); bells.classList.toggle("hi", k === 5);
  }
  const U0 = 0.05, sp = spring(U0);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  const T = [[0, 0, 28, 7, 0], [0, 0, 60, 6, 1], [0, 0, 84, 4, 2], [0, 0, 99, 3, 3], [0, 0, Z6 + 5, 2.4, 4], [0, 0, 3.5, 4, 5]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r, n]) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * S * 1.2); if (d < 1 && d < bd) { bd = d; best = n; } }); return best; }
  function move(p) {
    sp.t = clamp(U0 + ((p[0] - 80) / 240) * reach, U0, reach);
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
  name: "saturn5",
  means: "«Сатурн-5»: палец разделяет ступени — S-IC, S-II, S-IVB и «Аполлон» расходятся по оси.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[200, 230], [210, 120], [200, 60], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * RD-107, the engine of the R-7's strap-ons: four main chambers with their bells, two vernier
 * chambers on gimbals, the mounting frame, the turbopump with its gas generator, and the feed lines.
 * The pointer's x swings the verniers, as they steer the rocket. Hit areas are the rest pose;
 * the verniers are bright at rest.
 */
const {
  Cam, clamp, facing, fit, open, poly, prism, proj, put, rings, seg, solid, spring, stepS, disposer, mk, pointer, register,
} = HL;

const NAMES = ["рулевые камеры", "камеры", "рама", "ТНА", "газогенератор"];
const BELL = [[0, 1.3], [0.7, 1.12], [1.5, 0.88], [2.4, 0.62], [3.1, 0.46], [3.5, 0.5], [3.9, 0.72], [5.6, 0.74], [6.1, 0.55]];
const VERN = [[0, 0.86], [0.8, 0.7], [1.8, 0.47], [2.5, 0.36], [2.85, 0.42], [3.2, 0.58], [4.3, 0.58], [4.7, 0.4]];

/** the outline of a body of revolution: profile [[t, r]] along axis ax from o; e1, e2 span its rings */
function lathe(P, o, ax, e1, e2, prof, n = 32) {
  const at = (t, r, f) => P(o[0] + ax[0] * t + r * (Math.cos(f) * e1[0] + Math.sin(f) * e2[0]), o[1] + ax[1] * t + r * (Math.cos(f) * e1[1] + Math.sin(f) * e2[1]), o[2] + ax[2] * t + r * (Math.cos(f) * e1[2] + Math.sin(f) * e2[2]));
  const R = prof.map(([t, r]) => Array.from({ length: n }, (_, k) => at(t, r, (k / n) * 2 * Math.PI)));
  const c0 = at(prof[0][0], 0, 0), c1 = at(prof[prof.length - 1][0], 0, 0);
  let d = [c1[0] - c0[0], c1[1] - c0[1]]; const L = Math.hypot(d[0], d[1]) || 1; d = [d[0] / L, d[1] / L];
  const nn = [-d[1], d[0]], dot = (p, v) => p[0] * v[0] + p[1] * v[1];
  const arg = (rg, s) => rg.reduce((b, p, i) => (s * dot(p, nn) > s * dot(rg[b], nn) ? i : b), 0);
  const arc = (rg, i, j, s) => { const a = [], b = []; for (let k = i; ; k = (k + 1) % n) { a.push(rg[k]); if (k === j) break; } for (let k = i; ; k = (k + n - 1) % n) { b.push(rg[k]); if (k === j) break; }
    const m = (q) => q.reduce((v, p) => v + dot(p, d), 0) / q.length; return s * m(a) > s * m(b) ? a : b; };
  const left = R.map((rg) => rg[arg(rg, -1)]), right = R.map((rg) => rg[arg(rg, 1)]);
  const top = R[R.length - 1], bot = R[0];
  return poly(left.concat(arc(top, arg(top, -1), arg(top, 1), 1), right.slice().reverse(), arc(bot, arg(bot, 1), arg(bot, -1), -1)));
}
const nearRing = (P, c, r, z, n = 36) => open(Array.from({ length: n / 2 + 1 }, (_, k) => { const f = -Math.PI / 4 + (k / n) * 2 * Math.PI; return P(c[0] + r * Math.cos(f), c[1] + r * Math.sin(f), z); }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 19.5, C = Cam(45, 0.5, S);
  fit(C, [[-3.5, -3.5, 0], [3.5, 3.5, 0], [0, 0, 11], [-6.5, 0, 2], [6.5, 0, 2]], 200, 170);
  const P = proj(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  const up = [0, 0, 1], X = [1, 0, 0], Y = [0, 1, 0];
  const CH = [[-1.45, -1.45], [1.45, -1.45], [-1.45, 1.45], [1.45, 1.45]];
  // the verniers hang from pivots on the frame's x ends; drawn far one first, then near one at the end
  const ZV = 6.4, VX = 4.4;
  const vern = (s) => ({ s, sil: pth("sil"), cr: pth("nf lo") });
  const V = [], M = [];
  const chamber = ([x, y]) => { const e = pth("sil", lathe(P, [x, y, 0.6], up, X, Y, BELL)); pth("nf lo", nearRing(P, [x, y], 0.74, 4.6) + nearRing(P, [x, y], 1.1, 1.3)); return e; };
  // far to near: (−,−), the far vernier (−x), (+,−) and (−,+), the frame, turbopump, (+,+), the near vernier
  V.push(vern(-1));
  M.push(chamber(CH[0]));
  M.push(chamber(CH[1])); M.push(chamber(CH[2]));
  const frame = solid(g); const [ring, inner] = rings(-3.2, -3.2, 3.2, 3.2, 0.9, 0.5);
  put(frame, prism(P, facing(C), ring, inner, 6.7, 7.3));
  pth("nf lo", CH.map(([x, y]) => seg(P(x * 0.5, y * 0.5, 7.3), P(x * 0.5, y * 0.5 + 0.6, 7.3))).join(""));
  // feed lines from the pump down to the chamber heads, and from the gas generator into the pump
  pth("nf", CH.map(([x, y]) => open([P(0.3 + x * 0.35, -0.3 + y * 0.35, 7.6), P(x * 0.8, y * 0.8, 7.5), P(x, y, 7.1)])).join("") + open([P(-2, 1.6, 8.6), P(-0.6, 0.6, 8.6)]));
  const gg = pth("sil", lathe(P, [-2, 1.6, 7.3], up, X, Y, [[0, 0.5], [1.6, 0.5], [1.9, 0.3]]));
  const tna = pth("sil", lathe(P, [0.3, -0.3, 7.3], up, X, Y, [[0, 1], [0.4, 1.25], [2.6, 1.25], [3.2, 0.9], [3.6, 0.5]]));
  pth("nf lo", nearRing(P, [0.3, -0.3], 1.25, 8.4) + nearRing(P, [0.3, -0.3], 1.25, 9.4));
  M.push(chamber(CH[3]));
  V.push(vern(1));
  let drawn = NaN;
  function draw(a) {
    V.forEach((v) => { const s = v.s, b = a * s, ax = [Math.sin(b) * 0.25 * s, Math.sin(b), -Math.cos(b)];
      const L = Math.hypot(...ax), u = ax.map((c) => c / L), o = [s * VX, 0, ZV];
      // the profile runs from the bell's exit up to the pivot: start the axis at the exit
      const ex = [o[0] + u[0] * 4.7, o[1] + u[1] * 4.7, o[2] + u[2] * 4.7], back = u.map((c) => -c);
      const e1 = [1, 0, 0], e2 = [back[1] * e1[2] - back[2] * e1[1], back[2] * e1[0] - back[0] * e1[2], back[0] * e1[1] - back[1] * e1[0]];
      const n2 = Math.hypot(...e2); const e2n = e2.map((c) => c / n2), e1n = [e2n[1] * back[2] - e2n[2] * back[1], e2n[2] * back[0] - e2n[0] * back[2], e2n[0] * back[1] - e2n[1] * back[0]];
      v.sil.setAttribute("d", lathe(P, ex, back, e1n, e2n, VERN));
      v.cr.setAttribute("d", seg(P(o[0], o[1], o[2]), P(s * 3.2, 0, 6.9)) + seg(P(o[0], o[1] - 0.5, o[2] + 0.2), P(o[0], o[1] + 0.5, o[2] + 0.2))); });
  }
  let cur = -2;
  function light(k) {
    cur = k;
    V.forEach((v) => v.sil.classList.toggle("hi", k === 0 || k < 0));
    M.forEach((e) => e.classList.toggle("hi", k === 1)); frame.sil.classList.toggle("hi", k === 2);
    tna.classList.toggle("hi", k === 3); gg.classList.toggle("hi", k === 4);
  }
  const A0 = 0.12, sp = spring(A0);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  const T = [[VX, 0, 3.6, 1.4, 0], [-VX, 0, 3.6, 1.2, 0], [1.45, 1.45, 2.4, 1.3, 1], [-1.45, 1.45, 2.4, 1.2, 1], [1.45, -1.45, 2.4, 1.1, 1], [0, 3.2, 7, 0.7, 2], [3.2, 0, 7, 0.7, 2], [0.3, -0.3, 9.2, 1.2, 3], [-2, 1.6, 8.3, 0.6, 4]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r, n]) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * S * 1.2); if (d < 1 && d < bd) { bd = d; best = n; } }); return best; }
  function move(p) {
    sp.t = clamp(((p[0] - 200) / 110) * 0.7 * reach, -0.7, 0.7);
    const k = hit(p);
    if (k !== cur) { light(k); read.textContent = k < 0 ? "rest" : NAMES[k]; }
    B.wake();
  }
  function leave() { sp.t = A0; light(-1); read.textContent = "rest"; B.wake(); }
  draw(A0); drawn = A0; light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "rd107",
  means: "РД-107: палец качает рулевые камеры — так они управляют полётом ракеты.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[254, 204], [146, 150], [207, 92], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Sea Launch: the Odyssey platform — two pontoons, the columns, the deck with its hangar and
 * helideck — and the Zenit-3SL on its launch table at the open end. The pointer's x lowers the
 * rocket on its erector towards the hangar, the way it travels; rest is the rocket standing.
 * Hit areas are the rest pose; the rocket is bright at rest.
 */
const {
  Cam, clamp, facing, fit, open, poly, prism, proj, put, rings, rrect, ringAt, run, hull, seg, solid, spring, stepS, disposer, mk, pointer, register,
} = HL;

const ZD = 15, HX = 15, HZ = ZD + 3.2;
const NAMES = ["Зенит-3SL", "палуба", "понтоны", "колонны", "ангар", "стартовый стол"];
const ZEN = [[0, 2.1], [14, 2.1], [19, 2.1], [19.2, 2], [21.6, 2], [21.8, 2.35], [26, 2.35], [28.2, 1.3], [29.6, 0.3]];
/** the outline of a body of revolution: profile [[t, r]] along axis ax from o; e1, e2 span its rings */
function lathe(P, o, ax, e1, e2, prof, n = 32) {
  const at = (t, r, f) => P(o[0] + ax[0] * t + r * (Math.cos(f) * e1[0] + Math.sin(f) * e2[0]), o[1] + ax[1] * t + r * (Math.cos(f) * e1[1] + Math.sin(f) * e2[1]), o[2] + ax[2] * t + r * (Math.cos(f) * e1[2] + Math.sin(f) * e2[2]));
  const R = prof.map(([t, r]) => Array.from({ length: n }, (_, k) => at(t, r, (k / n) * 2 * Math.PI)));
  const c0 = at(prof[0][0], 0, 0), c1 = at(prof[prof.length - 1][0], 0, 0);
  let d = [c1[0] - c0[0], c1[1] - c0[1]]; const L = Math.hypot(d[0], d[1]) || 1; d = [d[0] / L, d[1] / L];
  const nn = [-d[1], d[0]], dot = (p, v) => p[0] * v[0] + p[1] * v[1];
  const arg = (rg, s) => rg.reduce((b, p, i) => (s * dot(p, nn) > s * dot(rg[b], nn) ? i : b), 0);
  const arc = (rg, i, j, s) => { const a = [], b = []; for (let k = i; ; k = (k + 1) % n) { a.push(rg[k]); if (k === j) break; } for (let k = i; ; k = (k + n - 1) % n) { b.push(rg[k]); if (k === j) break; }
    const m = (q) => q.reduce((v, p) => v + dot(p, d), 0) / q.length; return s * m(a) > s * m(b) ? a : b; };
  const left = R.map((rg) => rg[arg(rg, -1)]), right = R.map((rg) => rg[arg(rg, 1)]);
  const top = R[R.length - 1], bot = R[0];
  return poly(left.concat(arc(top, arg(top, -1), arg(top, 1), 1), right.slice().reverse(), arc(bot, arg(bot, 1), arg(bot, -1), -1)));
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 4.3, C = Cam(45, 0.5, S);
  fit(C, [[-27, -13, 0], [27, 13, 0], [HX, 0, HZ + 30], [-12, 0, HZ + 3], [27, 13, ZD], [-27, -13, ZD + 9]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  const block = (x0, y0, x1, y1, r, b, z0, z1) => { const s = solid(g), [ring, inner] = rings(x0, y0, x1, y1, r, b); put(s, prism(P, front, ring, inner, z0, z1)); return s; };
  const pont = (y) => block(-26, y - 2.2, 26, y + 2.2, 2.1, 0.7, 0, 4.2).sil;
  // far pontoon and its columns, near pontoon and its columns, the deck, then what stands on it
  const P1 = pont(-9), cols = [];
  for (const x of [-18, -6, 6, 18]) cols.push(block(x - 1.9, -10.9, x + 1.9, -7.1, 1.6, 0.5, 4.2, ZD - 1));
  const P2 = pont(9);
  for (const x of [-18, -6, 6, 18]) cols.push(block(x - 1.9, 7.1, x + 1.9, 10.9, 1.6, 0.5, 4.2, ZD - 1));
  pth("nf lo", [-18, -6, 6, 18].map((x) => seg(P(x - 1.6, 9, 7), P(x + 1.6, 9, 7))).join(""));
  const deck = block(-24, -12.5, 24, 12.5, 2.2, 1.6, ZD - 1, ZD + 1);
  // the helideck: a ring on the far corner; the hangar: a long rounded box down the deck's far half
  pth("nf lo", open(Array.from({ length: 33 }, (_, k) => { const f = (k / 32) * 2 * Math.PI; return P(-18 + 4 * Math.cos(f), 7 + 4 * Math.sin(f), ZD + 1); })));
  const hang = block(-22, -4.2, 1, 4.2, 2.4, 1.2, ZD + 1, ZD + 7.5);
  pth("nf lo", [-15, -7].map((x) => seg(P(x, 4.2, ZD + 1.4), P(x, 4.2, ZD + 7.1))).join(""));
  const table = block(HX - 3.4, -3.4, HX + 3.4, 3.4, 1.2, 0.8, ZD + 1, HZ);
  const erect = pth("nf"), rock = pth("sil"), rcr = pth("nf lo");
  let drawn = NaN;
  function draw(u) {
    const th = u * (Math.PI / 2) * 0.8, ax = [-Math.sin(th), 0, Math.cos(th)], e1 = [0, 1, 0], e2 = [Math.cos(th), 0, Math.sin(th)];
    const o = [HX, 0, HZ], at = (t, r = 0, side = 0) => P(o[0] + ax[0] * t + side * e2[0] * r, o[1], o[2] + ax[2] * t + side * e2[2] * r);
    erect.setAttribute("d", seg(at(0, 2.6, -1), at(21, 2.6, -1)) + [5, 11, 17].map((t) => seg(at(t, 2.6, -1), at(t, 1.95, -1))).join(""));
    rock.setAttribute("d", lathe(P, [o[0] + ax[0] * 0.2, 0, o[2] + ax[2] * 0.2], ax, e1, e2, ZEN));
    const ring = (t, r) => open(Array.from({ length: 19 }, (_, k) => { const f = -Math.PI / 4 + (k / 36) * 2 * Math.PI; return P(o[0] + ax[0] * t + r * (Math.cos(f) * e1[0] + Math.sin(f) * e2[0]), r * Math.cos(f), o[2] + ax[2] * t + r * Math.sin(f) * e2[2]); }));
    rcr.setAttribute("d", ring(14, 2.1) + ring(19.1, 2.05) + ring(21.7, 2.3) + ring(26, 2.35));
  }
  let cur = -2;
  function light(k) {
    cur = k;
    rock.classList.toggle("hi", k === 0 || k < 0); deck.sil.classList.toggle("hi", k === 1);
    P1.classList.toggle("hi", k === 2); P2.classList.toggle("hi", k === 2);
    cols.forEach((c) => c.sil.classList.toggle("hi", k === 3)); hang.sil.classList.toggle("hi", k === 4); table.sil.classList.toggle("hi", k === 5);
  }
  const U0 = 0.03, sp = spring(U0);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  const T = [[HX, 0, HZ + 14, 3, 0], [HX, 0, HZ + 6, 2.4, 0], [10, 10.5, ZD, 3, 1], [-10, 10.5, ZD, 3, 1], [-12, 9, 1, 2.6, 2], [12, 9, 1, 2.6, 2], [-6, 9, 7, 2.4, 3], [6, 9, 7, 2.4, 3], [-8, 2, ZD + 7.5, 4, 4], [HX + 2, 3, ZD + 2, 2, 5]];
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
  name: "seastart",
  means: "«Морской старт»: палец укладывает «Зенит» на установщик — так ракета едет из ангара к столу.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[244, 119], [197, 191], [168, 123], null],
  mount,
});

})();
(() => { const hairline = (f) => { window.HLFIG[f.name] = f; };
/**
 * Soyuz, the ship: the orbital module ball with its hatch and docking probe, the descent module's
 * bell with its window, the service module with its flared skirt, solar wings and antennas.
 * The pointer's x plays the return: the orbital and service modules part from the descent module,
 * which alone comes home. Hit areas are the rest pose; the descent module is bright at rest.
 */
const {
  Cam, clamp, fit, hull, open, poly, proj, seg, spring, stepS, disposer, mk, pointer, register,
} = HL;

const Z0 = 12, RB = 5.4, XB = -12, XS0 = -6.4, XS1 = 1, RS0 = 3.4, RS1 = 6.4, XP1 = 12, RP = 6.6, RF = 7.6;
const NAMES = ["спускаемый аппарат", "бытовой отсек", "приборно-агрегатный отсек", "батареи", "стыковочный штырь"];
const ringX = (P, x, r, n = 30) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x, r * Math.cos(t), Z0 + r * Math.sin(t)); });
const tubeX = (P, x0, x1, r0, r1) => poly(hull(ringX(P, x0, r0).concat(ringX(P, x1, r1))));
const nearX = (P, x, r) => { const e = ringX(P, x, r, 36); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; });
  const f = [], b = []; for (let i = iL; ; i = (i + 1) % 36) { f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i + 35) % 36) { b.push(e[i]); if (i === iR) break; }
  const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 5.5, C = Cam(45, 0.5, S);
  fit(C, [[XB - RB - 12, 0, Z0], [XP1 + 8, 0, Z0], [XP1 + 8, 24, Z0], [XP1, -24, Z0], [0, 0, Z0 + RF], [0, 0, Z0 - RF]], 200, 164);
  const P = proj(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  // far to near: probe, ball (BO), descent module, far wing, service module, near wing
  const probe = pth("sil"), bo = mk("ellipse", { class: "sil" }, g), boc = pth("nf lo");
  const sa = pth("sil", tubeX(P, XS0, XS1, RS0, RS1)), sac = pth("nf lo", nearX(P, XS1 - 0.6, RS1 - 0.2) + poly(Array.from({ length: 14 }, (_, k) => { const t = (k / 14) * 2 * Math.PI; return P(-2.6 + 0.9 * Math.cos(t), 4.4 + 0.2, Z0 + 2.4 + 0.9 * Math.sin(t)); })));
  const farW = pth("sil"), farWc = pth("nf lo"), fm = pth("nf");
  const pao = pth("sil"), paoc = pth("nf lo");
  const nm = pth("nf"), nearW = pth("sil"), nearWc = pth("nf lo");
  const wing = (dx, side, sil, cr, mast) => { const x = XP1 - 3 + dx, w = 3, y0 = side * (RP + 2), y1 = side * 23;
    mast.setAttribute("d", seg(P(x, side * RP, Z0), P(x, y0, Z0)));
    sil.setAttribute("d", poly([[x - w, y0], [x + w, y0], [x + w, y1], [x - w, y1]].map(([a, b]) => P(a, b, Z0))));
    cr.setAttribute("d", [0.25, 0.5, 0.75].map((f) => seg(P(x - w, y0 + (y1 - y0) * f, Z0), P(x + w, y0 + (y1 - y0) * f, Z0))).join("") + seg(P(x, y0, Z0), P(x, y1, Z0))); };
  let drawn = NaN;
  function draw(u) {
    const db = -7 * u, dp = 7 * u, xb = XB + db;
    probe.setAttribute("d", tubeX(P, xb - RB - 2.6, xb - RB + 0.6, 0.35, 1.4));
    const o = P(xb, 0, Z0), e = P(xb + RB * 0.7071, -RB * 0.7071, Z0), rr = Math.hypot(e[0] - o[0], e[1] - o[1]);
    bo.setAttribute("cx", o[0].toFixed(2)); bo.setAttribute("cy", o[1].toFixed(2)); bo.setAttribute("rx", rr.toFixed(2)); bo.setAttribute("ry", rr.toFixed(2));
    boc.setAttribute("d", poly(Array.from({ length: 16 }, (_, k) => { const t = (k / 16) * 2 * Math.PI; return P(xb + 1.4 * Math.cos(t), 1.4 * Math.sin(t), Z0 + RB * 0.95); }))
      + seg(P(xb - 2.4, -3, Z0 + 3.8), P(xb - 4.4, -6, Z0 + 8)) + seg(P(xb - 2.4, 3, Z0 + 3.8), P(xb - 4.4, 6, Z0 + 8)));
    wing(dp, -1, farW, farWc, fm);
    pao.setAttribute("d", tubeX(P, XS1 + 0.4 + dp, XP1 - 2.2 + dp, RP, RP) + tubeX(P, XP1 - 2.2 + dp, XP1 + dp, RP, RF));
    paoc.setAttribute("d", nearX(P, XS1 + 1.4 + dp, RP) + nearX(P, XP1 - 2.2 + dp, RP) + seg(P(XP1 + dp, 0, Z0 + RF), P(XP1 + 3 + dp, 0, Z0 + RF + 4)));
    wing(dp, 1, nearW, nearWc, nm);
  }
  let cur = -2;
  function light(k) {
    cur = k;
    sa.classList.toggle("hi", k === 0 || k < 0); bo.classList.toggle("hi", k === 1); pao.classList.toggle("hi", k === 2);
    farW.classList.toggle("hi", k === 3); nearW.classList.toggle("hi", k === 3); probe.classList.toggle("hi", k === 4);
  }
  const U0 = 0.03, sp = spring(U0);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  const T = [[-2.7, 0, Z0, 5, 0], [XB, 0, Z0, 5, 1], [7, 0, Z0, 6.4, 2], [9, 16, Z0, 6, 3], [9, -16, Z0, 6, 3], [XB - RB - 1.2, 0, Z0, 1.8, 4]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r, n]) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * S * 1.15); if (d < 1 && d < bd) { bd = d; best = n; } }); return best; }
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
  name: "soyuz",
  means: "«Союз»: палец разделяет отсеки перед спуском — домой возвращается только спускаемый аппарат.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[181, 148], [152, 134], [268, 142], null],
  mount,
});

})();