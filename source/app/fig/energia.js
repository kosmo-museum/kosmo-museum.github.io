/**
 * Energia — Buran, lying as on the rollout: the central block Ts with its ogive nose, four strap-on
 * blocks A round its lower half, and the orbiter on top: fuselage, double-delta wing, tail fin.
 * The pointer's x plays the separation: the blocks A drift off and back, then Buran lifts from
 * its attach struts and moves ahead. Hit areas are the rest pose; what is nearest is named.
 */
const {
  Cam, clamp, fit, hull, open, poly, proj, seg, spring, stepS, disposer, mk, pointer, register,
} = HL;

const Z0 = 12, RC = 4, RA = 1.95, D = RC + RA + 0.15;
const XC0 = -29, XC1 = 25, XN = 34, XA1 = 7, XA2 = 12;
const ZB = Z0 + RC + 0.7 + 2.5, RB = 2.5, XR = -22, XF = 10, XT = 15;
const ANG = [100, 150, -150, -100];                 // blocks A, degrees from +z round the x axis (+ is the near side)
const NAMES = ["Буран", "блок Ц", "блок А·1", "блок А·2", "блок А·3", "блок А·4", "крыло", "киль"];

const ring = (P, x, r, y, z, n = 30) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x, y + r * Math.cos(t), z + r * Math.sin(t)); });
const tube = (P, x0, x1, r0, r1, y, z) => poly(hull(ring(P, x0, r0, y, z).concat(ring(P, x1, r1, y, z))));
/** a convex body of revolution from [x, r] stations, one silhouette */
const body = (P, st, y, z) => poly(hull(st.flatMap(([x, r]) => ring(P, x, r, y, z))));
/** the near half of a ring round the x axis: the run that hangs lower on screen */
const nearR = (P, x, r, y, z) => { const e = ring(P, x, r, y, z, 36); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; });
  const f = [], b = []; for (let i = iL; ; i = (i + 1) % 36) { f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i + 35) % 36) { b.push(e[i]); if (i === iR) break; }
  const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const C = Cam(45, 0.5, 4.5);
  const far = (u) => [[XC0 - 12, -D - 9, Z0], [XN + 1, D + 9, Z0], [XC0, 0, Z0 - RC - 8], [XR + 9, 0, ZB + 9 + 10 * u], [XT + 7, 12, ZB + 9 * u], [XT + 7, -12, ZB + 9 * u]];
  fit(C, far(1), 200, 166);
  const P = proj(C);
  const g = mk("g", {}, svg);
  const pth = (cls) => mk("path", { class: cls }, g);
  // separation, from one number u in [0, 1]
  const sepA = (u) => clamp(u * 1.7, 0, 1), sepB = (u) => clamp((u - 0.35) / 0.65, 0, 1);
  const posA = (k, u) => { const a = (ANG[k] * Math.PI) / 180, d = D + 6 * sepA(u); return { y: d * Math.sin(a), z: Z0 + d * Math.cos(a), dx: -9 * sepA(u) }; };
  const posB = (u) => ({ dz: 9 * sepB(u), dx: 6 * sepB(u) });
  // paint order: the far and lower blocks, the core, the near block, the struts, Buran
  const el = { A: [] };
  const mkA = () => ({ noz: pth("nf"), sil: pth("sil"), cr: pth("nf lo") });
  el.A[3] = mkA(); el.A[2] = mkA(); el.A[1] = mkA();
  el.core = { noz: pth("nf"), sil: pth("sil"), cr: pth("nf lo") };
  el.A[0] = mkA();
  el.strut = pth("dash nf");
  el.wing = pth("sil"); el.wcr = pth("nf lo");
  el.bur = pth("sil"); el.bcr = pth("nf lo");
  el.fin = pth("sil"); el.fcr = pth("nf lo");
  // the core never moves: drawn once
  el.core.noz.setAttribute("d", [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].map(([y, z]) => tube(P, XC0 - 2.6, XC0, 1.1, 0.7, y, Z0 + z)).join(""));
  el.core.sil.setAttribute("d", body(P, [[XC0, RC], [XC1, RC], [XC1 + 5, 3.1], [XN, 0.5]], 0, Z0));
  el.core.cr.setAttribute("d", nearR(P, XC0 + 1.2, RC - 0.1, 0, Z0) + nearR(P, -6, RC, 0, Z0) + nearR(P, XC1, RC, 0, Z0) + nearR(P, XC1 + 5, 3.1, 0, Z0));

  let drawn = NaN;
  function draw(u) {
    ANG.forEach((_, k) => { const a = posA(k, u), e = el.A[k], x0 = XC0 + a.dx, x1 = XA1 + a.dx;
      e.noz.setAttribute("d", tube(P, x0 - 2.4, x0, 1.3, 0.8, a.y, a.z));
      e.sil.setAttribute("d", body(P, [[x0, RA], [x1, RA], [XA2 + a.dx, 0.35]], a.y, a.z));
      e.cr.setAttribute("d", nearR(P, x0 + 0.8, RA - 0.1, a.y, a.z) + nearR(P, x1, RA, a.y, a.z)); });
    const b = posB(u), x = (v) => v + b.dx, z = ZB + b.dz, zw = z - RB + 0.5;
    el.strut.setAttribute("d", [-14, 4].map((v) => seg(P(v, 0, Z0 + RC), P(x(v), 0, zw))).join(""));
    const W = [[XR, 2], [XR + 1.5, 12], [XR + 6, 12.2], [-3, 4.6], [7, 2.2]];
    el.wing.setAttribute("d", poly(W.concat(W.slice().reverse().map(([a, c]) => [a, -c])).map(([a, c]) => P(x(a), c, zw))));
    el.wcr.setAttribute("d", open([[XR + 1.4, 10.6], [XR + 5.6, 10.8], [-3.6, 4.2]].map(([a, c]) => P(x(a), c, zw))));
    el.bur.setAttribute("d", body(P, [[x(XR), RB], [x(XF), RB], [x(XT), 1.2], [x(XT + 2.6), 0.3]], 0, z));
    el.bcr.setAttribute("d", seg(P(x(XR + 1), 0, z + RB), P(x(4), 0, z + RB)) + nearR(P, x(XF), RB, 0, z) + nearR(P, x(4), RB, 0, z) + open([[XT - 2.4, -1.4], [XT - 1, -1.6], [XT - 1, 1.6], [XT - 2.4, 1.4]].map(([a, c]) => P(x(a), c, z + 1.9))));
    el.fin.setAttribute("d", poly([[XR + 0.6, z + RB - 0.4], [XR - 2.2, z + 9.6], [XR + 1.2, z + 9.6], [XR + 9, z + RB - 0.2]].map(([a, c]) => P(x(a), 0, c))));
    el.fcr.setAttribute("d", seg(P(x(XR + 1.2), 0, z + RB + 0.8), P(x(XR - 0.6), 0, z + 8.4)));
  }

  let cur = -2;
  function light(a) {
    cur = a;
    el.bur.classList.toggle("hi", a === 0 || a < 0);
    el.core.sil.classList.toggle("hi", a === 1);
    el.A.forEach((e, k) => e.sil.classList.toggle("hi", a === 2 + k));
    el.wing.classList.toggle("hi", a === 6); el.fin.classList.toggle("hi", a === 7);
  }
  const sp = spring(0.06);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  // rest-pose targets, tested on screen (rule 01): [x, y, z, radius]
  const pa = (k) => posA(k, 0);
  const T = [[-4, 0, ZB, 7.5], [16, 0, Z0, 6], [-12, pa(0).y + 1, pa(0).z - 1, 3.4], [-12, pa(1).y + 1, pa(1).z - 2, 3], [-24, pa(2).y, pa(2).z - 2, 2.6], [-24, pa(3).y - 1, pa(3).z, 3],
    [-14, 9, ZB - RB, 3.6], [XR - 0.6, 0, ZB + 6.5, 3]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 4.5 * 1.1); if (d < 1 && d < bd) { bd = d; best = k; } }); return best; }
  function move(p) {
    sp.t = clamp((p[0] - 80) / 240, 0.06, 1) * reach;
    const a = hit(p);
    if (a !== cur) { light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0.06; light(-1); read.textContent = "rest"; B.wake(); }
  draw(sp.x); drawn = sp.x; light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "energia",
  means: "«Энергия — Буран»: палец ведёт разделение — блоки А отходят, «Буран» поднимается с центрального блока.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[185, 150], [255, 215], [132, 190], null],
  mount,
});
