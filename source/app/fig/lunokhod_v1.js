/**
 * Lunokhod 1: the first rover on another world, on a museum plinth. A tub on
 * eight wheels under a round lid that carried its solar cells, two camera
 * eyes in front, a whip antenna and a pencil-beam dish on a mast. The
 * pointer's x opens the lid on a spring, as it opened in the lunar day; what
 * the pointer is over on the ground, a wheel, the eyes or the lid, takes the
 * bright stroke and is named. The slider is how far the lid opens, in degrees.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, proj, ringAt, run, rrect, circ, prism, seg, unproj,
  spring, stepS, disposer, mk, pointer, put, register, solid, flatDot, place, rad,
} = HL;

const PL = 3, Z0 = PL + 8, ZF = PL + 10, ZT = PL + 21, WR = 6.2, WY = 21, WX = [-16, -5.5, 5.5, 16];
const TOP = rrect(-22, -17, 22, 17, 13, 6), FOOT = rrect(-18, -13, 18, 13, 10, 6), IN = rrect(-20.6, -15.6, 20.6, 15.6, 11.6, 6);
const LID = rrect(-22.5, -17.5, 22.5, 17.5, 13.5, 6);

/** A wheel at (x, y): a disc standing in the x–z plane, its silhouette the hull of its two faces. */
function wheel(P, x, y, side) {
  const face = (yy, r) => Array.from({ length: 22 }, (_, k) => { const t = (k / 22) * 2 * Math.PI; return P(x + r * Math.cos(t), yy, PL + WR + r * Math.sin(t)); });
  const o = y + side * 1.6, i = y - side * 1.6;
  const spokes = [0, 1, 2, 3, 4, 5].map((k) => { const t = (k / 6) * 2 * Math.PI; return seg(P(x + 1.2 * Math.cos(t), o, PL + WR + 1.2 * Math.sin(t)), P(x + (WR - 1.4) * Math.cos(t), o, PL + WR + (WR - 1.4) * Math.sin(t))); }).join("");
  return { sil: poly(hull(face(o, WR).concat(face(i, WR)))), rim: poly(face(o, WR - 1.1)), spokes };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let amax = rad(value);
  const C = Cam(45, 0.5, 2.95);
  fit(C, [[-30, -30, 0], [30, 30, 0], [30, -30, 0], [-30, 30, 0], [-22, 0, ZT + 46], [10, -14, ZT + 26]], 200, 168);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, rrect(-30, -30, 30, 30, 16, 6), rrect(-28, -28, 28, 28, 14, 6), 0, PL));

  // far wheels, the tub, the near wheels, then everything on the top
  const mkWheel = (x, y, side) => { const grp = mk("g", {}, g), w = wheel(P, x, y, side); const s = mk("path", { d: w.sil, class: "sil" }, grp); mk("path", { d: w.rim, class: "nf" }, grp); mk("path", { d: w.spokes, class: "nf lo" }, grp); return { x, y, s }; };
  const wheels = WX.map((x) => mkWheel(x, -WY, -1));
  const tub = solid(g);
  put(tub, { sil: poly(hull(ringAt(P, FOOT, Z0).concat(ringAt(P, TOP, ZT)))), crease: open(ringAt(P, run(IN, front), ZT)) });
  // the instrument belt round the tub, and the two camera eyes on its front face
  mk("path", { d: open(ringAt(P, run(rrect(-20.2, -15.2, 20.2, 15.2, 11.6, 6), front), ZF + 3)), class: "nf lo" }, g);
  const eyes = [-5.5, 5.5].map((y) => mk("path", { d: poly(Array.from({ length: 16 }, (_, k) => { const t = (k / 16) * 2 * Math.PI; return P(21.2, y + 2.3 * Math.cos(t), ZF + 5.5 + 2.3 * Math.sin(t)); })), class: "sil" }, g));
  WX.forEach((x) => wheels.push(mkWheel(x, WY, 1)));

  // the mast with its pencil-beam dish at the front left, the whip at the back right
  const mast = [16, -12];
  mk("path", { d: seg(P(mast[0], mast[1], ZT), P(mast[0], mast[1], ZT + 12)) + seg(P(-17, 12, ZT), P(-24, 16, ZT + 30)), class: "nf" }, g);
  const dish = solid(g);
  const cone = (r, z) => ringAt(P, circ(r, 20).map((q) => ({ ...q, u: q.u + mast[0], v: q.v + mast[1] })), z);
  put(dish, { sil: poly(hull(cone(1, ZT + 11).concat(cone(4.2, ZT + 17)))), crease: open(cone(3.6, ZT + 16.6)) });

  // the lid, hinged along the back edge of the tub
  const lidG = mk("g", {}, g), lidUnder = mk("path", { class: "lo" }, lidG), lid = mk("path", { class: "sil" }, lidG), cells = mk("path", { class: "nf lo" }, lidG);
  const op = spring(0.35 * amax);
  let drawn = NaN, pick = -2;
  const L = (u, v, a, t) => P(-22.5 + (u + 22.5) * Math.cos(a) - t * Math.sin(a), v, ZT + 1 + (u + 22.5) * Math.sin(a) + t * Math.cos(a));
  function draw() {
    if (op.x === drawn) return;
    drawn = op.x;
    const a = op.x;
    lidUnder.setAttribute("d", poly(LID.map((q) => L(q.u, q.v, a, 0))));
    lid.setAttribute("d", poly(LID.map((q) => L(q.u, q.v, a, a > rad(90) ? 0 : 1.6))));
    // the solar cells show on the lid's inside once it lifts
    cells.setAttribute("d", a < rad(12) ? "" : [-9, 0, 9].map((v) => seg(L(-18, v, a, -0.2), L(18, v, a, -0.2))).join("") + [-10, 10].map((u) => seg(L(u, -14, a, -0.2), L(u, 14, a, -0.2))).join(""));
  }

  const parts = () => [...wheels.map((w) => [w.s]), eyes, [lid]];
  const NAMES = ["колесо 4", "колесо 3", "колесо 2", "колесо 1", "колесо 5", "колесо 6", "колесо 7", "колесо 8", "камеры", "крышка"];
  function light(a) {
    parts().forEach((els, k) => els.forEach((el) => el.classList.toggle("hi", a < 0 ? k === 8 : k === a)));
  }

  const B = register(stage, (dt) => { const m = stepS(op, dt); draw(); return m; });
  bag.add(B.unregister);

  // the ground plane never moves (rule 01): outside the tub's sides is a wheel, the front strip is the eyes, the rest is the lid
  function hit([sx, sy]) {
    const [wx, wy] = unproj(C, sx, sy, PL);
    if (Math.abs(wx) > 30 || Math.abs(wy) > 30) return -1;
    if (Math.abs(wy) > 15) {
      let best = 0, bd = 99;
      WX.forEach((x, k) => { const d = Math.abs(wx - x); if (d < bd) { bd = d; best = k; } });
      return wy < 0 ? best : 4 + best;
    }
    return wx > 14 ? 8 : 9;
  }
  function move(p) {
    op.t = clamp((p[0] - 110) / 180, 0, 1) * amax;
    const a = hit(p);
    if (a !== pick) { pick = a; light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { op.t = 0.35 * amax; pick = -1; light(-1); read.textContent = "rest"; B.wake(); }

  draw(); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { amax = rad(v); op.t = Math.min(op.t, amax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "lunokhod",
  means: "«Луноход-1» на постаменте: палец открывает крышку с солнечной батареей, колёса и камеры отзываются по имени.",
  rules: [1, 5, 6, 9],
  range: [60, 95, 120],
  tour: [[150, 120], [215, 230], [300, 200], null],
  mount,
});
