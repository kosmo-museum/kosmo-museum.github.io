/**
 * Soyuz — Apollo, July 1975, in a line: Apollo's service module with its engine bell, antenna and
 * thruster quads, the command module cone, the docking module, the androgynous APAS node, then
 * Soyuz-19: orbital-module ball, descent-module bell, service module with its solar wings.
 * The pointer's x undocks Soyuz and backs it off along the axis; the APAS is bright at rest.
 * Hit areas are the rest pose (rule 01); what is nearest is named.
 */
const {
  Cam, clamp, fit, hull, open, poly, proj, seg, spring, stepS, disposer, mk, pointer, register,
} = HL;

const Z0 = 12, XE = -33, XS0 = -30, XS1 = -15, RS = 3.9, XC1 = -8.5, RCt = 0.9, XD1 = -2, RD = 1.5;
const XA = 0.6, XB = 3.4, RBo = 2.3, XSA0 = 5.6, XSA1 = 9.6, XP1 = 14.4, RP = 2.7, RPF = 3.1;
const NAMES = ["АПАС", "Союз · БО", "Союз · СА", "Союз · ПАО", "батареи", "стык. модуль", "Аполлон · CM", "Аполлон · SM"];

const ringX = (P, x, r, z = Z0, n = 30) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x, r * Math.cos(t), z + r * Math.sin(t)); });
const body = (P, st) => poly(hull(st.flatMap(([x, r]) => ringX(P, x, r))));
const nearX = (P, x, r) => { const e = ringX(P, x, r, Z0, 36); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; });
  const f = [], b = []; for (let i = iL; ; i = (i + 1) % 36) { f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i + 35) % 36) { b.push(e[i]); if (i === iR) break; }
  const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 6.2, C = Cam(45, 0.5, S);
  fit(C, [[XE - 1, -RS, Z0], [XP1 + 10, 0, Z0], [XP1 + 10, 10, Z0], [XP1, -10, Z0], [-20, 0, Z0 - RS - 4], [-24, 0, Z0 + RS + 1], [0, 0, Z0 - 6]], 200, 166);
  const P = proj(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  // Apollo, far to near: engine bell, service module, antenna, command module, docking module
  pth("nf", body(P, [[XE, 2.2], [XS0, 1.1]]));
  const sm = pth("sil", body(P, [[XS0, RS], [XS1, RS]]));
  pth("nf lo", nearX(P, XS0 + 0.8, RS - 0.1) + nearX(P, -22, RS) + nearX(P, XS1 + 0.6, RS - 0.1)
    + [-1, 1].map((s) => seg(P(XS0 + 2, s * RS * 0.7071, Z0 + RS * 0.7071), P(XS1 - 1, s * RS * 0.7071, Z0 + RS * 0.7071))).join(""));
  // thruster quads: a small cross on the near side and on top
  const quad = (y, z) => seg(P(-17.6, y, z - 0.9), P(-17.6, y, z + 0.9)) + seg(P(-18.5, y, z), P(-16.7, y, z));
  pth("nf", quad(RS + 0.2, Z0) + quad(0, Z0 + RS + 0.2));
  // the high-gain antenna: a mast down from the aft end and four small dishes
  pth("nf", seg(P(XS0 + 1.5, RS * 0.5, Z0 - RS * 0.86), P(XS0 - 1, RS * 0.5 + 1, Z0 - RS - 3)));
  for (const [a, b] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) pth("nf", poly(Array.from({ length: 12 }, (_, k) => { const t = (k / 12) * 2 * Math.PI; return P(XS0 - 1 + a + 0.7 * Math.cos(t), RS * 0.5 + 1 + b, Z0 - RS - 3 + 0.7 * Math.sin(t)); })));
  const cm = pth("sil", body(P, [[XS1, RS], [XS1 + 0.4, RS - 0.2], [XC1, RCt]]));
  pth("nf lo", nearX(P, XS1 + 0.4, RS - 0.25) + open([[-12.6, 1.6], [-12, 1.8]].map(([x, r]) => P(x, r, Z0 + r))));
  const dm = pth("sil", body(P, [[XC1, RD], [XD1, RD]]));
  pth("nf lo", nearX(P, XC1 + 0.6, RD - 0.05) + nearX(P, XD1 - 0.6, RD - 0.05));
  // Soyuz: redrawn when it backs off (dx along +x)
  const ap = pth("sil"), farW = pth("sil"), farWc = pth("nf lo"), fwm = pth("nf");
  const bo = mk("ellipse", { class: "sil" }, g), boc = pth("nf lo");
  const sa = pth("sil"), sac = pth("nf lo");
  const pao = pth("sil"), paoc = pth("nf lo");
  const nwm = pth("nf"), nearW = pth("sil"), nearWc = pth("nf lo");
  const wing = (dx, side, sil, cr, mast) => { const x = XP1 - 1.6 + dx, w = 1.4, y0 = side * (RP + 1.2), y1 = side * 10.5;
    mast.setAttribute("d", seg(P(x, side * RP, Z0), P(x, y0, Z0)));
    sil.setAttribute("d", poly([[x - w, y0], [x + w, y0], [x + w, y1], [x - w, y1]].map(([a, b]) => P(a, b, Z0))));
    cr.setAttribute("d", [0.33, 0.66].map((f) => seg(P(x - w, y0 + (y1 - y0) * f, Z0), P(x + w, y0 + (y1 - y0) * f, Z0))).join("")); };
  let drawn = NaN;
  function draw(u) {
    const dx = 0.05 + 7 * u, X = (v) => v + dx;
    ap.setAttribute("d", body(P, [[XD1, 1.75], [XD1 + 1, 1.75]]) + body(P, [[X(XA - 1.2), 1.75], [X(XA), 1.75]]));
    wing(dx, -1, farW, farWc, fwm);
    const o = P(X(XB), 0, Z0), e = P(X(XB) + RBo * 0.7071, -RBo * 0.7071, Z0), rr = Math.hypot(e[0] - o[0], e[1] - o[1]);
    bo.setAttribute("cx", o[0].toFixed(2)); bo.setAttribute("cy", o[1].toFixed(2)); bo.setAttribute("rx", rr.toFixed(2)); bo.setAttribute("ry", rr.toFixed(2));
    boc.setAttribute("d", seg(P(X(XB + 1.4), -1.6, Z0 + 1.6), P(X(XB + 2.6), -2.6, Z0 + 4)) + seg(P(X(XB + 1.4), 1.6, Z0 + 1.6), P(X(XB + 2.6), 2.6, Z0 + 4)));
    sa.setAttribute("d", body(P, [[X(XSA0), 1.2], [X(XSA1), 2.2]]));
    sac.setAttribute("d", nearX(P, X(XSA1 - 0.4), 2.1));
    pao.setAttribute("d", body(P, [[X(XSA1), RP], [X(XP1 - 1.2), RP], [X(XP1), RPF]]));
    paoc.setAttribute("d", nearX(P, X(XSA1 + 0.6), RP) + nearX(P, X(XP1 - 1.2), RP));
    wing(dx, 1, nearW, nearWc, nwm);
  }
  let cur = -2;
  function light(a) {
    cur = a;
    ap.classList.toggle("hi", a === 0 || a < 0);
    bo.classList.toggle("hi", a === 1); sa.classList.toggle("hi", a === 2); pao.classList.toggle("hi", a === 3);
    farW.classList.toggle("hi", a === 4); nearW.classList.toggle("hi", a === 4);
    dm.classList.toggle("hi", a === 5); cm.classList.toggle("hi", a === 6); sm.classList.toggle("hi", a === 7);
  }
  const sp = spring(0);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  const T = [[0, 0, Z0, 2.2], [XB, 0, Z0, 2.6], [7.6, 0, Z0, 2.4], [12, 0, Z0, 3], [12.8, 7, Z0, 3.6], [-5.2, 0, Z0, 2.6], [-12, 0, Z0, 3.4], [-22, 0, Z0, 6]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * S * 1.15); if (d < 1 && d < bd) { bd = d; best = k; } }); return best; }
  function move(p) {
    sp.t = clamp((p[0] - 110) / 220, 0, 1) * reach;
    const a = hit(p);
    if (a !== cur) { light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0; light(-1); read.textContent = "rest"; B.wake(); }
  draw(0); drawn = 0; light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { reach = v; B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "asts",
  means: "«Союз — Аполлон»: палец расстыковывает корабли — «Союз-19» отходит от стыковочного узла АПАС.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[200, 160], [250, 190], [120, 120], null],
  mount,
});
