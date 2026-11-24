/**
 * GIRD-09, the first Soviet liquid-fuel rocket (17 August 1933, Nakhabino): a slim
 * 2.4-metre body lying on two cradles of a museum stand — a pointed nose fairing, the liquid
 * oxygen tank with its rivet rows, the combustion chamber where jellied petrol burned in the
 * oxygen, a short nozzle and four swept fins. The pointer's x pulls the sections apart along
 * the axis, as the drawings show it, with the bulkheads between them; what the pointer is
 * nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rrect, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const PL = 3, R = 6, LEN = 104, ZA = PL + 15, NAMES = ["стабилизаторы", "камера сгорания", "бак кислорода", "обтекатель"];
// sections along the axis, from the tail: [from, to, radius at start, radius at end]
const SEC = [[0, 22, R, R], [22, 50, R, R], [50, 82, R, R], [82, 104, R, 0.6]];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gmax = value;
  const C = Cam(45, 0.5, 2.2);
  fit(C, [[-14, -64, 0], [14, -64, 0], [-14, 64, 0], [14, 64, 0], [0, -84, ZA + 14], [0, 84, ZA + 14], [0, -70, ZA - 14]], 200, 170);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, rrect(-14, -60, 14, 60, 12, 6), rrect(-12.5, -58.5, 12.5, 58.5, 10.5, 6), 0, PL));
  // two saddle cradles that the rocket rests in
  for (const y of [-26, 22]) {
    put(solid(g), prism(P, front, rrect(-2, y - 1.6, 2, y + 1.6, 0.8, 4), rrect(-1.4, y - 1, 1.4, y + 1, 0.4, 4), PL, ZA - R - 1));
    mk("path", { d: open(Array.from({ length: 9 }, (_, k) => { const a = Math.PI * (1.15 + (k / 8) * 0.7); return P(Math.cos(a) * (R + 0.8), y, ZA + Math.sin(a) * (R + 0.8)); })), class: "sil nf" }, g);
  }
  const back = mk("g", {}, g), mid = mk("g", {}, g), fore = mk("g", {}, g);
  const ring = (y, r, n = 26) => Array.from({ length: n }, (_, k) => { const a = (k / n) * 2 * Math.PI; return P(r * Math.cos(a), y, ZA + r * Math.sin(a)); });
  // the near half of a ring around the axis (toward the viewer)
  const nearRing = (y, r) => { const e = ring(y, r, 32); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; }); const f = [], b = []; for (let i = iL; ; i = (i + 1) % 32) { f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i + 31) % 32) { b.push(e[i]); if (i === iR) break; } const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };
  const fins = [0, 1, 2, 3].map((k) => { const a = Math.PI / 4 + (k * Math.PI) / 2; return { a, dir: [Math.cos(a), 0, Math.sin(a)], el: null }; });
  const el = { sec: [], seams: [], fins: [], nozzle: null, heads: null };
  for (let i = 0; i < 4; i++) { el.sec.push(mk("path", { class: "sil" }, mid)); el.seams.push(mk("path", { class: "nf lo" }, mid)); }
  el.heads = mk("path", { class: "nf" }, mid);
  el.nozzle = mk("path", { class: "sil" }, back);
  for (const f of fins) f.el = mk("path", { class: "sil" }, f.dir[0] + f.dir[2] > 0 ? fore : back);
  const sp = spring(0.06 * gmax);
  let drawn = NaN, pick = -2;
  function draw() {
    if (sp.x === drawn) return;
    drawn = sp.x;
    const gap = sp.x, y0 = -LEN / 2 - gap * 1.5, Y = (s, i) => y0 + s + gap * i;
    SEC.forEach(([s0, s1, r0, r1], i) => {
      const pts = [];
      if (i === 3) { for (let k = 0; k <= 6; k++) { const t = k / 6, s = s0 + (s1 - s0) * t, r = r0 * Math.sqrt(Math.max(0, 1 - t * t)) + r1 * t * t; pts.push(...ring(Y(s, i), Math.max(r, 0.4), 20)); } }
      else pts.push(...ring(Y(s0, i), r0), ...ring(Y(s1, i), r1));
      el.sec[i].setAttribute("d", poly(hull(pts)));
      // seams and rivet rows: the tank has two rows, the chamber an access hatch, the fairing a joint ring
      let d = "";
      if (i === 2) for (const s of [s0 + 4, s0 + 16, s1 - 4]) d += nearRing(Y(s, i), r0 + 0.05);
      if (i === 1) { d += nearRing(Y(s0 + 5, i), r0 + 0.05); const hy = Y(s0 + 14, i); d += poly(Array.from({ length: 14 }, (_, k) => { const t = (k / 14) * 2 * Math.PI, a = 0.69 + Math.cos(t) * 0.38; return P(Math.cos(a) * (R + 0.08), hy + Math.sin(t) * 4.2, ZA + Math.sin(a) * (R + 0.08)); })); }
      if (i === 0) d += nearRing(Y(s1 - 3, i), r0 + 0.05);
      if (i === 3) d += nearRing(Y(s0 + 3, i), R * 0.98);
      el.seams[i].setAttribute("d", d);
    });
    // bulkheads appear in the gaps once the sections part
    el.heads.setAttribute("d", gap > 1.2 ? [22, 50, 82].map((s, k) => poly(ring(Y(s, k + 1), R * 0.92, 24))).join("") : "");
    // nozzle at the tail, the four fins swept back over it
    const ty = Y(0, 0);
    el.nozzle.setAttribute("d", poly(hull(ring(ty, R * 0.55, 16).concat(ring(ty - 5, R * 0.8, 16)))));
    for (const f of fins) { const q = (s, r) => P(f.dir[0] * r, Y(s, 0), ZA + f.dir[2] * r); f.el.setAttribute("d", poly([q(4, R * 0.98), q(20, R * 0.98), q(9, R + 10), q(-3, R + 10)])); }
  }
  function light(k) {
    fins.forEach((f) => f.el.classList.toggle("hi", k === 0));
    el.nozzle.classList.toggle("hi", k === 0);
    el.sec.forEach((s, i) => s.classList.toggle("hi", k === i || (k < 0 && i === 1)));
  }
  const B = register(stage, (dt) => { const m = stepS(sp, dt); draw(); return m; });
  bag.add(B.unregister);
  function hit([sx, sy]) {
    const gap = sp.t, y0 = -LEN / 2 - gap * 1.5, c = [[8, 0], [36, 1], [66, 2], [93, 3]].map(([s, i]) => P(0, y0 + s + gap * i, ZA));
    let best = -1, bd = 1e9;
    c.forEach((p, k) => { const d = Math.hypot(sx - p[0], sy - p[1]) / 26; if (d < 1 && d < bd) { bd = d; best = k; } });
    return best;
  }
  function move(p) {
    sp.t = clamp((p[0] - 110) / 180, 0, 1) * gmax;
    const a = hit(p);
    if (a !== pick) { pick = a; light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0.06 * gmax; pick = -2; light(-1); read.textContent = "rest"; B.wake(); }
  draw(); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { gmax = v; sp.t = Math.min(sp.t, gmax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "gird09",
  means: "Ракета «ГИРД-09» на ложементах: палец разводит отсеки вдоль оси — обтекатель, бак кислорода, камера сгорания, хвост со стабилизаторами.",
  rules: [1, 3, 5, 9],
  range: [6, 10, 14],
  tour: [[130, 200], [200, 160], [280, 120], null],
  mount,
});
