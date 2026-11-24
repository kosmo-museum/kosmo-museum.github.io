/**
 * RD-107, the engine of the R-7's strap-ons: four main chambers with their bells, two vernier
 * chambers on gimbals, the mounting frame, the turbopump with its gas generator, and the feed lines.
 * The pointer's x swings the verniers, as they steer the rocket. Hit areas are the rest pose;
 * the verniers are bright at rest.
 */
const {
  Cam, clamp, facing, fit, open, poly, prism, proj, put, rings, seg, solid, spring, stepS, disposer, mk, pointer, register,
} = HL;

const NAMES = ["рулевые камеры", "камеры", "рама", "ТНА", "газогенератор"];
const BELL = [[0, 1.3], [0.7, 1.12], [1.5, 0.88], [2.4, 0.62], [3.1, 0.46], [3.5, 0.5], [3.9, 0.72], [5.6, 0.74], [6.1, 0.55]];
const VERN = [[0, 0.86], [0.8, 0.7], [1.8, 0.47], [2.5, 0.36], [2.85, 0.42], [3.2, 0.58], [4.3, 0.58], [4.7, 0.4]];

/** the outline of a body of revolution: profile [[t, r]] along axis ax from o; e1, e2 span its rings */
function lathe(P, o, ax, e1, e2, prof, n = 32) {
  const at = (t, r, f) => P(o[0] + ax[0] * t + r * (Math.cos(f) * e1[0] + Math.sin(f) * e2[0]), o[1] + ax[1] * t + r * (Math.cos(f) * e1[1] + Math.sin(f) * e2[1]), o[2] + ax[2] * t + r * (Math.cos(f) * e1[2] + Math.sin(f) * e2[2]));
  const R = prof.map(([t, r]) => Array.from({ length: n }, (_, k) => at(t, r, (k / n) * 2 * Math.PI)));
  const c0 = at(prof[0][0], 0, 0), c1 = at(prof[prof.length - 1][0], 0, 0);
  let d = [c1[0] - c0[0], c1[1] - c0[1]]; const L = Math.hypot(d[0], d[1]) || 1; d = [d[0] / L, d[1] / L];
  const nn = [-d[1], d[0]], dot = (p, v) => p[0] * v[0] + p[1] * v[1];
  const arg = (rg, s) => rg.reduce((b, p, i) => (s * dot(p, nn) > s * dot(rg[b], nn) ? i : b), 0);
  const arc = (rg, i, j, s) => { const a = [], b = []; for (let k = i; ; k = (k + 1) % n) { a.push(rg[k]); if (k === j) break; } for (let k = i; ; k = (k + n - 1) % n) { b.push(rg[k]); if (k === j) break; }
    const m = (q) => q.reduce((v, p) => v + dot(p, d), 0) / q.length; return s * m(a) > s * m(b) ? a : b; };
  const left = R.map((rg) => rg[arg(rg, -1)]), right = R.map((rg) => rg[arg(rg, 1)]);
  const top = R[R.length - 1], bot = R[0];
  return poly(left.concat(arc(top, arg(top, -1), arg(top, 1), 1), right.slice().reverse(), arc(bot, arg(bot, 1), arg(bot, -1), -1)));
}
const nearRing = (P, c, r, z, n = 36) => open(Array.from({ length: n / 2 + 1 }, (_, k) => { const f = -Math.PI / 4 + (k / n) * 2 * Math.PI; return P(c[0] + r * Math.cos(f), c[1] + r * Math.sin(f), z); }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 19.5, C = Cam(45, 0.5, S);
  fit(C, [[-3.5, -3.5, 0], [3.5, 3.5, 0], [0, 0, 11], [-6.5, 0, 2], [6.5, 0, 2]], 200, 170);
  const P = proj(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  const up = [0, 0, 1], X = [1, 0, 0], Y = [0, 1, 0];
  const CH = [[-1.45, -1.45], [1.45, -1.45], [-1.45, 1.45], [1.45, 1.45]];
  // the verniers hang from pivots on the frame's x ends; drawn far one first, then near one at the end
  const ZV = 6.4, VX = 4.4;
  const vern = (s) => ({ s, sil: pth("sil"), cr: pth("nf lo") });
  const V = [], M = [];
  const chamber = ([x, y]) => { const e = pth("sil", lathe(P, [x, y, 0.6], up, X, Y, BELL)); pth("nf lo", nearRing(P, [x, y], 0.74, 4.6) + nearRing(P, [x, y], 1.1, 1.3)); return e; };
  // far to near: (−,−), the far vernier (−x), (+,−) and (−,+), the frame, turbopump, (+,+), the near vernier
  V.push(vern(-1));
  M.push(chamber(CH[0]));
  M.push(chamber(CH[1])); M.push(chamber(CH[2]));
  const frame = solid(g); const [ring, inner] = rings(-3.2, -3.2, 3.2, 3.2, 0.9, 0.5);
  put(frame, prism(P, facing(C), ring, inner, 6.7, 7.3));
  pth("nf lo", CH.map(([x, y]) => seg(P(x * 0.5, y * 0.5, 7.3), P(x * 0.5, y * 0.5 + 0.6, 7.3))).join(""));
  // feed lines from the pump down to the chamber heads, and from the gas generator into the pump
  pth("nf", CH.map(([x, y]) => open([P(0.3 + x * 0.35, -0.3 + y * 0.35, 7.6), P(x * 0.8, y * 0.8, 7.5), P(x, y, 7.1)])).join("") + open([P(-2, 1.6, 8.6), P(-0.6, 0.6, 8.6)]));
  const gg = pth("sil", lathe(P, [-2, 1.6, 7.3], up, X, Y, [[0, 0.5], [1.6, 0.5], [1.9, 0.3]]));
  const tna = pth("sil", lathe(P, [0.3, -0.3, 7.3], up, X, Y, [[0, 1], [0.4, 1.25], [2.6, 1.25], [3.2, 0.9], [3.6, 0.5]]));
  pth("nf lo", nearRing(P, [0.3, -0.3], 1.25, 8.4) + nearRing(P, [0.3, -0.3], 1.25, 9.4));
  M.push(chamber(CH[3]));
  V.push(vern(1));
  let drawn = NaN;
  function draw(a) {
    V.forEach((v) => { const s = v.s, b = a * s, ax = [Math.sin(b) * 0.25 * s, Math.sin(b), -Math.cos(b)];
      const L = Math.hypot(...ax), u = ax.map((c) => c / L), o = [s * VX, 0, ZV];
      // the profile runs from the bell's exit up to the pivot: start the axis at the exit
      const ex = [o[0] + u[0] * 4.7, o[1] + u[1] * 4.7, o[2] + u[2] * 4.7], back = u.map((c) => -c);
      const e1 = [1, 0, 0], e2 = [back[1] * e1[2] - back[2] * e1[1], back[2] * e1[0] - back[0] * e1[2], back[0] * e1[1] - back[1] * e1[0]];
      const n2 = Math.hypot(...e2); const e2n = e2.map((c) => c / n2), e1n = [e2n[1] * back[2] - e2n[2] * back[1], e2n[2] * back[0] - e2n[0] * back[2], e2n[0] * back[1] - e2n[1] * back[0]];
      v.sil.setAttribute("d", lathe(P, ex, back, e1n, e2n, VERN));
      v.cr.setAttribute("d", seg(P(o[0], o[1], o[2]), P(s * 3.2, 0, 6.9)) + seg(P(o[0], o[1] - 0.5, o[2] + 0.2), P(o[0], o[1] + 0.5, o[2] + 0.2))); });
  }
  let cur = -2;
  function light(k) {
    cur = k;
    V.forEach((v) => v.sil.classList.toggle("hi", k === 0 || k < 0));
    M.forEach((e) => e.classList.toggle("hi", k === 1)); frame.sil.classList.toggle("hi", k === 2);
    tna.classList.toggle("hi", k === 3); gg.classList.toggle("hi", k === 4);
  }
  const A0 = 0.12, sp = spring(A0);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  const T = [[VX, 0, 3.6, 1.4, 0], [-VX, 0, 3.6, 1.2, 0], [1.45, 1.45, 2.4, 1.3, 1], [-1.45, 1.45, 2.4, 1.2, 1], [1.45, -1.45, 2.4, 1.1, 1], [0, 3.2, 7, 0.7, 2], [3.2, 0, 7, 0.7, 2], [0.3, -0.3, 9.2, 1.2, 3], [-2, 1.6, 8.3, 0.6, 4]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r, n]) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * S * 1.2); if (d < 1 && d < bd) { bd = d; best = n; } }); return best; }
  function move(p) {
    sp.t = clamp(((p[0] - 200) / 110) * 0.7 * reach, -0.7, 0.7);
    const k = hit(p);
    if (k !== cur) { light(k); read.textContent = k < 0 ? "rest" : NAMES[k]; }
    B.wake();
  }
  function leave() { sp.t = A0; light(-1); read.textContent = "rest"; B.wake(); }
  draw(A0); drawn = A0; light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "rd107",
  means: "РД-107: палец качает рулевые камеры — так они управляют полётом ракеты.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[254, 204], [146, 150], [207, 92], null],
  mount,
});
