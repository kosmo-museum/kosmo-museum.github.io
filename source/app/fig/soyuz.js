/**
 * Soyuz, the ship: the orbital module ball with its hatch and docking probe, the descent module's
 * bell with its window, the service module with its flared skirt, solar wings and antennas.
 * The pointer's x plays the return: the orbital and service modules part from the descent module,
 * which alone comes home. Hit areas are the rest pose; the descent module is bright at rest.
 */
const {
  Cam, clamp, fit, hull, open, poly, proj, seg, spring, stepS, disposer, mk, pointer, register,
} = HL;

const Z0 = 12, RB = 5.4, XB = -12, XS0 = -6.4, XS1 = 1, RS0 = 3.4, RS1 = 6.4, XP1 = 12, RP = 6.6, RF = 7.6;
const NAMES = ["спускаемый аппарат", "бытовой отсек", "приборно-агрегатный отсек", "батареи", "стыковочный штырь"];
const ringX = (P, x, r, n = 30) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x, r * Math.cos(t), Z0 + r * Math.sin(t)); });
const tubeX = (P, x0, x1, r0, r1) => poly(hull(ringX(P, x0, r0).concat(ringX(P, x1, r1))));
const nearX = (P, x, r) => { const e = ringX(P, x, r, 36); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; });
  const f = [], b = []; for (let i = iL; ; i = (i + 1) % 36) { f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i + 35) % 36) { b.push(e[i]); if (i === iR) break; }
  const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 5.5, C = Cam(45, 0.5, S);
  fit(C, [[XB - RB - 12, 0, Z0], [XP1 + 8, 0, Z0], [XP1 + 8, 24, Z0], [XP1, -24, Z0], [0, 0, Z0 + RF], [0, 0, Z0 - RF]], 200, 164);
  const P = proj(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  // far to near: probe, ball (BO), descent module, far wing, service module, near wing
  const probe = pth("sil"), bo = mk("ellipse", { class: "sil" }, g), boc = pth("nf lo");
  const sa = pth("sil", tubeX(P, XS0, XS1, RS0, RS1)), sac = pth("nf lo", nearX(P, XS1 - 0.6, RS1 - 0.2) + poly(Array.from({ length: 14 }, (_, k) => { const t = (k / 14) * 2 * Math.PI; return P(-2.6 + 0.9 * Math.cos(t), 4.4 + 0.2, Z0 + 2.4 + 0.9 * Math.sin(t)); })));
  const farW = pth("sil"), farWc = pth("nf lo"), fm = pth("nf");
  const pao = pth("sil"), paoc = pth("nf lo");
  const nm = pth("nf"), nearW = pth("sil"), nearWc = pth("nf lo");
  const wing = (dx, side, sil, cr, mast) => { const x = XP1 - 3 + dx, w = 3, y0 = side * (RP + 2), y1 = side * 23;
    mast.setAttribute("d", seg(P(x, side * RP, Z0), P(x, y0, Z0)));
    sil.setAttribute("d", poly([[x - w, y0], [x + w, y0], [x + w, y1], [x - w, y1]].map(([a, b]) => P(a, b, Z0))));
    cr.setAttribute("d", [0.25, 0.5, 0.75].map((f) => seg(P(x - w, y0 + (y1 - y0) * f, Z0), P(x + w, y0 + (y1 - y0) * f, Z0))).join("") + seg(P(x, y0, Z0), P(x, y1, Z0))); };
  let drawn = NaN;
  function draw(u) {
    const db = -7 * u, dp = 7 * u, xb = XB + db;
    probe.setAttribute("d", tubeX(P, xb - RB - 2.6, xb - RB + 0.6, 0.35, 1.4));
    const o = P(xb, 0, Z0), e = P(xb + RB * 0.7071, -RB * 0.7071, Z0), rr = Math.hypot(e[0] - o[0], e[1] - o[1]);
    bo.setAttribute("cx", o[0].toFixed(2)); bo.setAttribute("cy", o[1].toFixed(2)); bo.setAttribute("rx", rr.toFixed(2)); bo.setAttribute("ry", rr.toFixed(2));
    boc.setAttribute("d", poly(Array.from({ length: 16 }, (_, k) => { const t = (k / 16) * 2 * Math.PI; return P(xb + 1.4 * Math.cos(t), 1.4 * Math.sin(t), Z0 + RB * 0.95); }))
      + seg(P(xb - 2.4, -3, Z0 + 3.8), P(xb - 4.4, -6, Z0 + 8)) + seg(P(xb - 2.4, 3, Z0 + 3.8), P(xb - 4.4, 6, Z0 + 8)));
    wing(dp, -1, farW, farWc, fm);
    pao.setAttribute("d", tubeX(P, XS1 + 0.4 + dp, XP1 - 2.2 + dp, RP, RP) + tubeX(P, XP1 - 2.2 + dp, XP1 + dp, RP, RF));
    paoc.setAttribute("d", nearX(P, XS1 + 1.4 + dp, RP) + nearX(P, XP1 - 2.2 + dp, RP) + seg(P(XP1 + dp, 0, Z0 + RF), P(XP1 + 3 + dp, 0, Z0 + RF + 4)));
    wing(dp, 1, nearW, nearWc, nm);
  }
  let cur = -2;
  function light(k) {
    cur = k;
    sa.classList.toggle("hi", k === 0 || k < 0); bo.classList.toggle("hi", k === 1); pao.classList.toggle("hi", k === 2);
    farW.classList.toggle("hi", k === 3); nearW.classList.toggle("hi", k === 3); probe.classList.toggle("hi", k === 4);
  }
  const U0 = 0.03, sp = spring(U0);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  const T = [[-2.7, 0, Z0, 5, 0], [XB, 0, Z0, 5, 1], [7, 0, Z0, 6.4, 2], [9, 16, Z0, 6, 3], [9, -16, Z0, 6, 3], [XB - RB - 1.2, 0, Z0, 1.8, 4]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r, n]) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * S * 1.15); if (d < 1 && d < bd) { bd = d; best = n; } }); return best; }
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
  name: "soyuz",
  means: "«Союз»: палец разделяет отсеки перед спуском — домой возвращается только спускаемый аппарат.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[181, 148], [152, 134], [268, 142], null],
  mount,
});
