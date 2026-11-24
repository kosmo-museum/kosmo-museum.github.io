/**
 * Vostok: the ship that flew Gagarin, standing on a museum plinth. Three
 * stacked parts: the engine nozzle (ТДУ), the biconical equipment bay (ПАО)
 * ringed by gas bottles, and the spherical descent module (СА) with its hatch.
 * The pointer's x pulls the stack apart, as at separation before re-entry, on
 * a spring; its y picks a part, which takes the bright stroke and is named.
 * The slider is the widest gap, in world units.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rings, ringAt, run, circ, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid, flatDot, place,
} = HL;

const M = 12, PL = 3, RS = 1.15 * M, RJ = 1.22 * M;
// profiles [radius, height] from the bottom of each part; heights are from the part's own base
const NOZ = [[0.18 * M, 0], [0.34 * M, 0.7 * M]];
const PAO = [[0.75 * M, 0], [RJ, 1.45 * M], [0.55 * M, 2.15 * M]];
const NZH = 0.7 * M, PAOH = 2.15 * M, JZ = 1.45 * M;
const NAMES = ["ТДУ", "ПАО", "СА"];
const REST_GAP = 0.22;

/** A lathe solid: the hull of its rings is the silhouette; the widest ring's front half is its one crease. */
function lathe(P, front, prof, z0, wide) {
  const pts = [];
  for (const [r, z] of prof) pts.push(...ringAt(P, circ(r, 28), z0 + z));
  const sil = poly(hull(pts));
  const [r, z] = prof[wide];
  return { sil, crease: open(ringAt(P, run(circ(r - 0.6, 28), front), z0 + z)) };
}

/** A ring drawn on a sphere's surface around direction d, angular radius a: its points, and whether it faces us. */
function capRing(P, c, R, d, a) {
  const up = Math.abs(d[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
  const u = norm(cross(d, up)), v = cross(d, u), pts = [];
  for (let k = 0; k < 24; k++) {
    const t = (k / 24) * 2 * Math.PI, q = [0, 1, 2].map((i) => Math.cos(a) * d[i] + Math.sin(a) * (Math.cos(t) * u[i] + Math.sin(t) * v[i]));
    pts.push(P(c[0] + R * q[0], c[1] + R * q[1], c[2] + R * q[2]));
  }
  return pts;
}
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gmax = value;
  const top = PL + NZH + PAOH + 2 * RS;
  const C = Cam(45, 0.5, 2.85);
  fit(C, [[-24, -24, 0], [24, 24, 0], [24, -24, 0], [-24, 24, 0], [0, 0, top + gmax * 1.1 + 2]], 200, 162);
  const P = proj(C), front = facing(C);
  const sr = Math.hypot(P(RS * 0.7071, -RS * 0.7071, 0)[0] - P(0, 0, 0)[0], P(RS * 0.7071, -RS * 0.7071, 0)[1] - P(0, 0, 0)[1]);

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(-24, -24, 24, 24, 12, 1.6);
  put(solid(g), prism(P, front, pr, pi, 0, PL));
  const cradle = flatDot(g, C, 1.2, "dot off");

  // parts, painted bottom to top: the nozzle, the back bottles, the bay, the front bottles, the sphere
  const noz = solid(mk("g", {}, g));
  const botB = mk("g", {}, g), bay = solid(mk("g", {}, g)), botF = mk("g", {}, g);
  const BOT = Array.from({ length: 14 }, (_, k) => {
    const a = (k / 14) * 2 * Math.PI + 0.2, x = Math.cos(a) * (RJ + 1.6), y = Math.sin(a) * (RJ + 1.6);
    return { x, y, el: mk("ellipse", { class: "sil" }, x + y < 0 ? botB : botF) };
  });
  const sph = mk("g", {}, g);
  const ball = mk("ellipse", { class: "sil" }, sph);
  const hatch = mk("path", { class: "nf" }, sph), chute = mk("path", { class: "nf lo" }, sph), port = mk("path", { class: "nf lo" }, sph), belt = mk("path", { class: "nf lo" }, sph);

  // the gap on a spring: it follows the pointer's x continuously
  const gap = spring(REST_GAP * gmax);
  let drawn = NaN, pick = -1;
  const bases = (s) => [PL, PL + NZH + s * 0.35, PL + NZH + PAOH + s * 1.1];

  function draw() {
    if (gap.x === drawn) return;
    drawn = gap.x;
    const [z0, z1, z2] = bases(gap.x);
    put(noz, lathe(P, front, NOZ, z0, 1));
    put(bay, lathe(P, front, PAO, z1, 1));
    const bs = Math.hypot(...[0, 1].map((i) => P(1.6 * 0.7071, -1.6 * 0.7071, 0)[i] - P(0, 0, 0)[i]));
    for (const b of BOT) { const [x, y] = P(b.x, b.y, z1 + JZ); b.el.setAttribute("cx", x.toFixed(2)); b.el.setAttribute("cy", y.toFixed(2)); b.el.setAttribute("rx", bs.toFixed(2)); b.el.setAttribute("ry", bs.toFixed(2)); }
    const c = [0, 0, z2 + RS], [cx, cy] = P(...c);
    ball.setAttribute("cx", cx.toFixed(2)); ball.setAttribute("cy", cy.toFixed(2)); ball.setAttribute("rx", sr.toFixed(2)); ball.setAttribute("ry", sr.toFixed(2));
    // the entry hatch on the near flank, the parachute hatch on top, the «Взор» port low on the side
    hatch.setAttribute("d", poly(capRing(P, c, RS, norm([0.95, 0.05, 0.3]), 0.4)));
    chute.setAttribute("d", poly(capRing(P, c, RS, [0, 0, 1], 0.33)));
    port.setAttribute("d", poly(capRing(P, c, RS, norm([0.1, 0.9, -0.42]), 0.16)));
    belt.setAttribute("d", open(ringAt(P, run(circ(RS * 0.985, 32), front), c[2] - RS * 0.17)));
    place(cradle, P(0, 0, PL));
  }

  function light(a) {
    const on = (k) => (a < 0 ? k === 2 : k === a);
    noz.sil.classList.toggle("hi", on(0));
    bay.sil.classList.toggle("hi", on(1));
    BOT.forEach((b) => b.el.classList.toggle("hi", on(1)));
    ball.classList.toggle("hi", a === 2);
    hatch.classList.toggle("hi", a < 0);
  }

  const B = register(stage, (dt) => { const moving = stepS(gap, dt); draw(); return moving; });
  bag.add(B.unregister);

  // pick by y against the TARGET pose (rule 01): each part's band is its centre at the gap the spring is heading to
  function hit([sx, sy]) {
    const [z0, z1, z2] = bases(gap.t);
    const mids = [z0 + NZH / 2, z1 + PAOH / 2, z2 + RS].map((z) => P(0, 0, z)[1]);
    const [wx, wy] = [sx - P(0, 0, 0)[0], 0];
    if (Math.abs(wx) > sr * 1.9) return -1;
    let best = -1, bd = 1e9;
    mids.forEach((y, k) => { const d = Math.abs(sy - y); if (d < bd) { bd = d; best = k; } });
    return bd < sr * 1.3 ? best : -1;
  }

  function move(p) {
    gap.t = clamp((p[0] - 120) / 170, 0, 1) * gmax;
    const a = hit(p);
    if (a !== pick) { pick = a; light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { gap.t = REST_GAP * gmax; pick = -1; light(-1); read.textContent = "rest"; B.wake(); }

  draw(); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { gmax = v; gap.t = Math.min(gap.t, gmax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "vostok",
  means: "«Восток» на постаменте: палец разводит спускаемый аппарат и приборный отсек, как при разделении перед посадкой.",
  rules: [1, 3, 5, 8],
  range: [8, 16, 24],
  tour: [[150, 230], [250, 170], [290, 90], null],
  mount,
});
