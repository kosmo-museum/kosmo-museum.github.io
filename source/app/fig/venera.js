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
  put(solid(g), prism(P, front, rrect(-20, -20, 20, 20, 9, 6), rrect(-18.5, -18.5, 18.5, 18.5, 7.5, 6), 0, PL));
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
