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
