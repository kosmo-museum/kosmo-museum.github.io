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
