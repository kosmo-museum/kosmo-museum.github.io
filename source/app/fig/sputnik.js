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
  put(solid(g), prism(P, front, rrect(-26, -26, 26, 26, 13, 6), rrect(-24, -24, 24, 24, 11, 6), 0, PL));
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
