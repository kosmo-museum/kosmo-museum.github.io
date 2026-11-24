/**
 * Sea Launch: the Odyssey platform — two pontoons, the columns, the deck with its hangar and
 * helideck — and the Zenit-3SL on its launch table at the open end. The pointer's x lowers the
 * rocket on its erector towards the hangar, the way it travels; rest is the rocket standing.
 * Hit areas are the rest pose; the rocket is bright at rest.
 */
const {
  Cam, clamp, facing, fit, open, poly, prism, proj, put, rings, rrect, ringAt, run, hull, seg, solid, spring, stepS, disposer, mk, pointer, register,
} = HL;

const ZD = 15, HX = 15, HZ = ZD + 3.2;
const NAMES = ["Зенит-3SL", "палуба", "понтоны", "колонны", "ангар", "стартовый стол"];
const ZEN = [[0, 2.1], [14, 2.1], [19, 2.1], [19.2, 2], [21.6, 2], [21.8, 2.35], [26, 2.35], [28.2, 1.3], [29.6, 0.3]];
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

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 4.3, C = Cam(45, 0.5, S);
  fit(C, [[-27, -13, 0], [27, 13, 0], [HX, 0, HZ + 30], [-12, 0, HZ + 3], [27, 13, ZD], [-27, -13, ZD + 9]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  const block = (x0, y0, x1, y1, r, b, z0, z1) => { const s = solid(g), [ring, inner] = rings(x0, y0, x1, y1, r, b); put(s, prism(P, front, ring, inner, z0, z1)); return s; };
  const pont = (y) => block(-26, y - 2.2, 26, y + 2.2, 2.1, 0.7, 0, 4.2).sil;
  // far pontoon and its columns, near pontoon and its columns, the deck, then what stands on it
  const P1 = pont(-9), cols = [];
  for (const x of [-18, -6, 6, 18]) cols.push(block(x - 1.9, -10.9, x + 1.9, -7.1, 1.6, 0.5, 4.2, ZD - 1));
  const P2 = pont(9);
  for (const x of [-18, -6, 6, 18]) cols.push(block(x - 1.9, 7.1, x + 1.9, 10.9, 1.6, 0.5, 4.2, ZD - 1));
  pth("nf lo", [-18, -6, 6, 18].map((x) => seg(P(x - 1.6, 9, 7), P(x + 1.6, 9, 7))).join(""));
  const deck = block(-24, -12.5, 24, 12.5, 2.2, 1.6, ZD - 1, ZD + 1);
  // the helideck: a ring on the far corner; the hangar: a long rounded box down the deck's far half
  pth("nf lo", open(Array.from({ length: 33 }, (_, k) => { const f = (k / 32) * 2 * Math.PI; return P(-18 + 4 * Math.cos(f), 7 + 4 * Math.sin(f), ZD + 1); })));
  const hang = block(-22, -4.2, 1, 4.2, 2.4, 1.2, ZD + 1, ZD + 7.5);
  pth("nf lo", [-15, -7].map((x) => seg(P(x, 4.2, ZD + 1.4), P(x, 4.2, ZD + 7.1))).join(""));
  const table = block(HX - 3.4, -3.4, HX + 3.4, 3.4, 1.2, 0.8, ZD + 1, HZ);
  const erect = pth("nf"), rock = pth("sil"), rcr = pth("nf lo");
  let drawn = NaN;
  function draw(u) {
    const th = u * (Math.PI / 2) * 0.8, ax = [-Math.sin(th), 0, Math.cos(th)], e1 = [0, 1, 0], e2 = [Math.cos(th), 0, Math.sin(th)];
    const o = [HX, 0, HZ], at = (t, r = 0, side = 0) => P(o[0] + ax[0] * t + side * e2[0] * r, o[1], o[2] + ax[2] * t + side * e2[2] * r);
    erect.setAttribute("d", seg(at(0, 2.6, -1), at(21, 2.6, -1)) + [5, 11, 17].map((t) => seg(at(t, 2.6, -1), at(t, 1.95, -1))).join(""));
    rock.setAttribute("d", lathe(P, [o[0] + ax[0] * 0.2, 0, o[2] + ax[2] * 0.2], ax, e1, e2, ZEN));
    const ring = (t, r) => open(Array.from({ length: 19 }, (_, k) => { const f = -Math.PI / 4 + (k / 36) * 2 * Math.PI; return P(o[0] + ax[0] * t + r * (Math.cos(f) * e1[0] + Math.sin(f) * e2[0]), r * Math.cos(f), o[2] + ax[2] * t + r * Math.sin(f) * e2[2]); }));
    rcr.setAttribute("d", ring(14, 2.1) + ring(19.1, 2.05) + ring(21.7, 2.3) + ring(26, 2.35));
  }
  let cur = -2;
  function light(k) {
    cur = k;
    rock.classList.toggle("hi", k === 0 || k < 0); deck.sil.classList.toggle("hi", k === 1);
    P1.classList.toggle("hi", k === 2); P2.classList.toggle("hi", k === 2);
    cols.forEach((c) => c.sil.classList.toggle("hi", k === 3)); hang.sil.classList.toggle("hi", k === 4); table.sil.classList.toggle("hi", k === 5);
  }
  const U0 = 0.03, sp = spring(U0);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  const T = [[HX, 0, HZ + 14, 3, 0], [HX, 0, HZ + 6, 2.4, 0], [10, 10.5, ZD, 3, 1], [-10, 10.5, ZD, 3, 1], [-12, 9, 1, 2.6, 2], [12, 9, 1, 2.6, 2], [-6, 9, 7, 2.4, 3], [6, 9, 7, 2.4, 3], [-8, 2, ZD + 7.5, 4, 4], [HX + 2, 3, ZD + 2, 2, 5]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r, n]) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * S * 1.2); if (d < 1 && d < bd) { bd = d; best = n; } }); return best; }
  function move(p) {
    sp.t = clamp(U0 + ((p[0] - 60) / 280) * reach, U0, reach);
    const k = hit(p);
    if (k !== cur) { light(k); read.textContent = k < 0 ? "rest" : NAMES[k]; }
    B.wake();
  }
  function leave() { sp.t = U0; light(-1); read.textContent = "rest"; B.wake(); }
  draw(U0); drawn = U0; light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "seastart",
  means: "«Морской старт»: палец укладывает «Зенит» на установщик — так ракета едет из ангара к столу.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[244, 119], [197, 191], [168, 123], null],
  mount,
});
