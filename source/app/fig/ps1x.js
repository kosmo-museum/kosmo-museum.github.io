/**
 * PS-1 taken apart, for the long read: the bolted pair of half-shells, the
 * four antennas, the radio transmitter, the battery pack and the fan with its
 * diffuser, on the axis of the ball. set(step) walks the explosion one stage
 * at a time from the page's scroll; the pointer still picks a part and names
 * it. Step 0 is the closed ball.
 */
const {
  Cam, clamp, fit, hull, open, poly, proj, seg, rrect, prism, facing,
  spring, stepS, disposer, mk, pointer, put, register, solid, flatDot, place,
} = HL;

const R = 22, ZC = 40, NAMES = ["корпус", "антенны", "передатчик", "батарея", "вентилятор", "экран"];
// the ball's axis runs across the screen (perpendicular to the view), so the parts spread side by side
// tilted 30° off the picture plane, so the rings read as rings
const U = [0.966 * 0.7071 + 0.259 * 0.7071, -0.966 * 0.7071 + 0.259 * 0.7071, 0], V = [-U[1], U[0], 0];
const W = (P, x, a, b) => P(x * U[0] + a * V[0], x * U[1] + a * V[1], ZC + b);
const ringX = (P, x, r, n = 28) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return W(P, x, r * Math.cos(t), r * Math.sin(t)); });
const tubeX = (P, x0, x1, r0, r1) => poly(hull(ringX(P, x0, r0).concat(ringX(P, x1, r1))));
function half(P, side, dx) {
  const pts = [];
  for (let i = 0; i <= 8; i++) for (let j = 0; j < 22; j++) { const a = (i / 8) * (Math.PI / 2), b = (j / 22) * 2 * Math.PI; pts.push(W(P, dx + side * R * Math.cos(a), R * Math.sin(a) * Math.cos(b), R * Math.sin(a) * Math.sin(b))); }
  return { sil: poly(hull(pts.concat(ringX(P, dx, R)))), cut: poly(ringX(P, dx, R)), flange: poly(ringX(P, dx + side * 1.2, R + 1.4)) };
}
const ANT = [[0.38, 0.42, 66], [-0.38, 0.42, 66], [0.42, -0.3, 80], [-0.42, -0.3, 80]];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 2.3);
  const fp = [[-64, 0, -R], [66, 0, R], [-64, 0, R], [66, 0, -R], [-50, 30, 34], [-50, -30, -30]].map(([x, a, b]) => [x * U[0] + a * V[0], x * U[1] + a * V[1], ZC + b]);
  fit(C, fp, 200, 160);
  const P = proj(C);
  const Wp = (x, a, b) => W(P, x, a, b);
  const g = mk("g", {}, svg);
  const ants = mk("path", { class: "nf" }, g);
  const rear = { sil: mk("path", { class: "sil" }, g), cut: mk("path", { class: "nf" }, g), fl: mk("path", { class: "nf lo" }, g) };
  const inner = mk("g", {}, g);
  const fan = { a: mk("path", { class: "sil" }, inner), b: mk("path", { class: "nf lo" }, inner) };
  const bat = { a: mk("path", { class: "sil" }, inner), b: mk("path", { class: "nf lo" }, inner) };
  const tx = { a: mk("path", { class: "sil" }, inner), b: mk("path", { class: "nf lo" }, inner) };
  const lamp = flatDot(inner, C, 1.1, "dot m");
  const front = { sil: mk("path", { class: "sil" }, g), fl: mk("path", { class: "nf lo" }, g), bolts: mk("path", { class: "nf lo" }, g) };
  const sp = spring(value);
  let drawn = NaN, focus = -1, pick = -1;
  // stage by stage: 1 shells part, 2 antennas named, 3 radio out, 4 batteries out, 5 fan out, 6 screen
  const pose = (s) => { const e = (k) => clamp(s - k, 0, 1); return { fr: 18 * e(0.4) + 34 * e(2), tx: 30 * e(2.4), bat: 10 * e(3.2), fan: -16 * e(4), rr: -14 * e(0.4) - 22 * e(4.4) }; };
  function draw() {
    if (sp.x === drawn) return;
    drawn = sp.x;
    const p = pose(sp.x);
    const r = half(P, -1, p.rr), f = half(P, 1, p.fr);
    rear.sil.setAttribute("d", r.sil); rear.cut.setAttribute("d", p.rr < -1 ? r.cut : ""); rear.fl.setAttribute("d", r.flange);
    front.sil.setAttribute("d", f.sil); front.fl.setAttribute("d", f.flange);
    front.bolts.setAttribute("d", Array.from({ length: 18 }, (_, k) => { const t = (k / 18) * 2 * Math.PI, q = W(P, p.fr + 2.2, (R + 0.7) * Math.cos(t), (R + 0.7) * Math.sin(t)); return `M${q[0].toFixed(1)},${q[1].toFixed(1)}h0.1`; }).join(""));
    ants.setAttribute("d", ANT.map(([y, z, L]) => { const r0 = [p.fr + 9, y * R * 0.85, z * R * 0.85], d = [-0.86, y * 0.9, z * 0.9], l = Math.hypot(...d); return seg(W(P, ...r0), W(P, r0[0] + (d[0] / l) * L, r0[1] + (d[1] / l) * L, r0[2] + (d[2] / l) * L)); }).join(""));
    const open1 = sp.x > 0.5;
    if (open1 && !inner.isConnected) rear.fl.after(inner); else if (!open1 && inner.isConnected) inner.remove();
    if (!open1) return;
    // the fan and diffuser cone (rear), the battery drum (middle), the transmitter block (front)
    const fx = p.fan - 10;
    fan.a.setAttribute("d", tubeX(P, fx - 3, fx + 3, 7, 3));
    fan.b.setAttribute("d", Array.from({ length: 6 }, (_, k) => { const t = (k / 6) * 2 * Math.PI; return seg(W(P, fx + 3, 0, 0), W(P, fx + 3, 6 * Math.cos(t), 6 * Math.sin(t))); }).join(""));
    const bx = p.bat;
    bat.a.setAttribute("d", tubeX(P, bx - 8, bx + 8, 15, 15));
    bat.b.setAttribute("d", [-4, 0, 4].map((x) => open(ringX(P, bx + x, 15.1).slice(0, 15))).join(""));
    const tX = p.tx + 10;
    tx.a.setAttribute("d", poly(hull([[-1,-1],[1,-1],[1,1],[-1,1]].flatMap(([a, b]) => [W(P, tX - 5, a * 7, b * 7), W(P, tX + 5, a * 7, b * 7)]))));
    tx.b.setAttribute("d", seg(W(P, tX - 5, -7, 7), W(P, tX + 5, -7, 7)) + seg(W(P, tX + 5, -7, 7), W(P, tX + 5, 7, 7)) + seg(W(P, tX + 5, 7, 7), W(P, tX + 5, 7, -7)));
    place(lamp, W(P, tX + 5.2, 0, 3));
  }
  function light(k) {
    front.sil.classList.toggle("hi", k === 0 || (k < 0 && focus < 0)); rear.sil.classList.toggle("hi", k === 0 || k === 5);
    ants.classList.toggle("hi", k === 1);
    tx.a.classList.toggle("hi", k === 2); bat.a.classList.toggle("hi", k === 3); fan.a.classList.toggle("hi", k === 4);
    lamp.setAttribute("class", k === 2 ? "dot" : "dot m");
  }
  const show = () => light(pick >= 0 ? pick : focus);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); draw(); return m; });
  bag.add(B.unregister);
  function hit([sx, sy]) {
    const p = pose(sp.t), A = [[p.fr + 12, 0, ZC, 22], [-30, 20, ZC + 18, 18], [p.tx + 10, 0, ZC, 9], [p.bat, 0, ZC, 14], [p.fan - 10, 0, ZC, 8], [p.rr - 12, 0, ZC, 18]];
    let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { if (sp.t < 0.5 && k >= 2 && k <= 4) return; const q = W(P, x, y, z - ZC), d = Math.hypot(sx - q[0], sy - q[1]) / (r * 1.9); if (d < 1 && d < bd) { bd = d; best = k; } });
    return best;
  }
  function move(p) { const a = hit(p); if (a !== pick) { pick = a; show(); read.textContent = a < 0 ? "rest" : NAMES[a]; } }
  function leave() { pick = -1; show(); read.textContent = "rest"; }
  draw(); show(); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  // the long read drives the step; whole steps also choose which part is in focus
  return { set: (v) => { sp.t = v; const f = [-1, 0, 1, 2, 3, 4, 5][Math.round(clamp(v, 0, 6))]; if (f !== focus) { focus = f; show(); } B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "ps1x",
  means: "ПС-1 в разборе: шаг за шагом расходятся полусферы, выходят передатчик, батареи и вентилятор.",
  rules: [1, 3, 5, 6],
  range: [0, 3, 6],
  tour: [[150, 120], [230, 150], [300, 160], null],
  mount,
});
