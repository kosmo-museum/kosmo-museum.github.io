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
