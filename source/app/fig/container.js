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
  put(solid(g), prism(P, front, rrect(-L - 6, -20, L + 6, 20, 10, 6), rrect(-L - 4.5, -18.5, L + 4.5, 18.5, 8.5, 6), 0, PL));
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
