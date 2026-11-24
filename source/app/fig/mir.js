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
