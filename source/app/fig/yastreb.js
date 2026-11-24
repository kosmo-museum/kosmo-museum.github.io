/**
 * Yastreb, the soft suit Khrunov and Yeliseyev wore to cross from Soyuz-5 to Soyuz-4 in 1969 on a museum mannequin: swept limbs, a lofted torso, helmet with visor and glint, seams, gloves, boots.
 * The pointer's x raises the visor; the life-support units ride on the legs, so the suit fits through the hatch. What the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rrect, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const KIND = "yastreb", PL = 3, HR = 8.6, SK = KIND === "sk1";
/* полужёсткие (вход через люк-ранец на спине) и «Ястреб» (блоки жизнеобеспечения на ногах) */ const HARD = KIND === "orlan" || KIND === "krechet", YA = KIND === "yastreb", KR = KIND === "krechet";
const NAMES = ["шлем", "стекло", "оболочка", "блоки на ногах", "перчатки", "ботинки", "пульт"];
const nrm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const around = (P, c, d, r, n = 18, sx = 1) => { const u = nrm(cross(d, Math.abs(d[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1])), v = cross(d, u); return Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(...[0, 1, 2].map((i) => c[i] + r * (Math.cos(t) * u[i] * sx + Math.sin(t) * v[i]))); }); };
/* horizontal ellipse ring: half-depth a (x), half-width b (y) */ const ell = (P, cx, cy, z, a, b, n = 28) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(cx + a * Math.cos(t), cy + b * Math.sin(t), z); });
/* the near half of a horizontal ring (the side toward the viewer), as an open line */ const nearArc = (P, cx, cy, z, a, b, n = 28) => { const e = ell(P, cx, cy, z, a, b, n); let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; }); const arc = []; for (let i = iL; ; i = (i + 1) % n){ arc.push(e[i]); if (i === iR) break; } const alt = []; for (let i = iL; ; i = (i - 1 + n) % n){ alt.push(e[i]); if (i === iR) break; } const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return open(my(arc) > my(alt) ? arc : alt); };
/* the near half of any ring of screen points: the arc between its left and right ends that hangs lower on screen */ const half = (e) => { const n = e.length; let iL = 0, iR = 0; e.forEach((p, i) => { if (p[0] < e[iL][0]) iL = i; if (p[0] > e[iR][0]) iR = i; }); const f = [], b = []; for (let i = iL; ; i = (i + 1) % n){ f.push(e[i]); if (i === iR) break; } for (let i = iL; ; i = (i - 1 + n) % n){ b.push(e[i]); if (i === iR) break; } const my = (q) => q.reduce((s2, p) => s2 + p[1], 0) / q.length; return open(my(f) > my(b) ? f : b); };
/* a smooth Catmull-Rom path through control points, with radii carried along */ function sweep(pts, rs, per = 6) {
  const out = [], rr = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      rr.push(rs[i] + (rs[i + 1] - rs[i]) * (t2 * (3 - 2 * t))); }
  }
  out.push(pts[pts.length - 1]); rr.push(rs[rs.length - 1]);
  return [out, rr];
}
/* a limb as one outline: the swept centreline offset by its radius on screen, with round caps */ function limb(P, pts, rs) {
  const [w, r] = sweep(pts, rs), c = w.map((p) => P(...p)), o = P(...w[0]), e = P(w[0][0] + 0.7071, w[0][1] - 0.7071, w[0][2]), sc = Math.hypot(e[0] - o[0], e[1] - o[1]);
  const n = c.length, L = [], R = [];
  for (let i = 0; i < n; i++) { const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl, rr = r[i] * sc;
    L.push([c[i][0] + nx * rr, c[i][1] + ny * rr]); R.push([c[i][0] - nx * rr, c[i][1] - ny * rr]); }
  /* a round cap from one side to the other, bulging along dir (the way the limb ends) */ const cap = (ctr, from, to, dir, steps = 10) => { const a0 = Math.atan2(from[1] - ctr[1], from[0] - ctr[0]), rr = Math.hypot(from[0] - ctr[0], from[1] - ctr[1]);
    const mk2 = (sgn) => Array.from({ length: steps - 1 }, (_, k) => { const t = a0 + sgn * Math.PI * (k + 1) / steps; return [ctr[0] + rr * Math.cos(t), ctr[1] + rr * Math.sin(t)]; });
    const A = mk2(1), Bq = mk2(-1), m = Math.floor(steps / 2) - 1, sa = (A[m][0] - ctr[0]) * dir[0] + (A[m][1] - ctr[1]) * dir[1], sb = (Bq[m][0] - ctr[0]) * dir[0] + (Bq[m][1] - ctr[1]) * dir[1]; return sa > sb ? A : Bq; };
  const tEnd = [c[n - 1][0] - c[n - 2][0], c[n - 1][1] - c[n - 2][1]], tSt = [c[0][0] - c[1][0], c[0][1] - c[1][1]];
  const capE = cap(c[n - 1], L[n - 1], R[n - 1], tEnd), capS = cap(c[0], R[0], L[0], tSt);
  return poly(L.concat(capE, R.slice().reverse(), capS));
}
/* the torso lofted through horizontal rings [z, half-depth, half-width]; keeps the waist */ function loft(P, cx, rings) {
  const E = rings.map(([z, a, b]) => ell(P, cx, 0, z, a, b, 32)), L = [], R = [];
  for (const e of E) { let l = e[0], r = e[0]; for (const p of e) { if (p[0] < l[0]) l = p; if (p[0] > r[0]) r = p; } L.push(l); R.push(r); }
  const arc = (e, from, to, pick) => { const n = e.length, i0 = e.indexOf(from), i1 = e.indexOf(to), f = [], b = []; for (let i = i0; ; i = (i + 1) % n) { f.push(e[i]); if (i === i1) break; } for (let i = i0; ; i = (i - 1 + n) % n) { b.push(e[i]); if (i === i1) break; } const my = (q) => q.reduce((s, p) => s + p[1], 0) / q.length; return pick(my(f), my(b)) ? f : b; };
  const top = arc(E[E.length - 1], L[L.length - 1], R[R.length - 1], (a, b) => a < b), bot = arc(E[0], R[0], L[0], (a, b) => a > b);
  return poly(L.concat(top, R.slice().reverse(), bot));
}
/* a point on the front of the torso at height z, y across */ const frontAt = (rings, cx, z, y) => { let i = 0; while (i < rings.length - 2 && rings[i + 1][0] < z) i++; const [z0, a0, b0] = rings[i], [z1, a1, b1] = rings[i + 1], t = clamp((z - z0) / (z1 - z0), 0, 1), a = a0 + (a1 - a0) * t, b = b0 + (b1 - b0) * t; return [cx + a * Math.sqrt(Math.max(0, 1 - (y / b) ** 2)), y, z]; };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let vmax = value;
  const C = Cam(45, 0.5, 3.6);
  fit(C, [[-16, -16, 0], [16, 16, 0], [16, -16, 0], [-16, 16, 0], [0, 0, 77]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, rrect(-16, -16, 16, 16, 8, 6), rrect(-14.5, -14.5, 14.5, 14.5, 6.5, 6), 0, PL));
  const body = mk("g", {}, g), el = {};
  const Z = (z) => PL + z;
  const TR = HARD ? [[Z(26.5), 5.2, 8.0], [Z(29), 5.0, 7.7], [Z(32.5), 5.4, 7.8], [Z(36.5), 6.3, 8.8], [Z(41.5), 6.9, 9.6], [Z(45.5), 6.8, 10.0], [Z(48.5), 6.2, 9.6], [Z(51.5), 5.0, 7.8]]
    : [[Z(26.5), 5.0, 7.9], [Z(29), 4.8, 7.5], [Z(32.5), 4.5, 7.0], [Z(36.5), 5.3, 7.8], [Z(41.5), 6.0, 8.7], [Z(45.5), 5.7, 9.4], [Z(48.5), 4.6, 8.6], [Z(50.5), 3.5, 6.5]];
  /* люк-ранец поворачивается на петле у края спины (вертикальная ось): кольцо rrect с повёрнутыми точками и нормалями */ const turn = (ring, hx, hy, a) => { const c = Math.cos(a), s2 = Math.sin(a); return ring.map((q) => ({ u: hx + (q.u - hx) * c - (q.v - hy) * s2, v: hy + (q.u - hx) * s2 + (q.v - hy) * c, nu: q.nu * c - q.nv * s2, nv: q.nu * s2 + q.nv * c })); };
  function build(s) {
    body.replaceChildren();
    const pth = (d, cls) => mk("path", { d, class: cls }, body);
    /* the mannequin's stand behind, then the pack that hangs on the back */ pth(seg(P(-8, 0, PL), P(-8, 0, Z(30))), "nf lo");
    const lift = clamp(s / Math.max(1, vmax), 0, 1);
    el.packs = [];
    if (HARD) {
      /* проём в спине кирасы, потом сам люк-ранец: он открывается на петле, как дверца, — так в скафандр входят */ const ang = -1.9 * lift, hx = -5.0, hy = 7.4, f0 = KR ? -15.5 : -14.8, t0 = Z(KR ? 25 : 26), t1 = Z(KR ? 56 : 55);
      if (lift > 0.02) pth(poly([[-5.6, -5.6, Z(30)], [-5.6, 5.6, Z(30)], [-6.2, 5.6, Z(50)], [-6.2, -5.6, Z(50)]].map((p) => P(...p))), "nf lo");
      const o = turn(rrect(f0, -7.4, hx, 7.4, 2.8, 6), hx, hy, ang), i = turn(rrect(f0 + 0.8, -6.6, hx - 0.8, 6.6, 2.0, 6), hx, hy, ang), pr = prism(P, front, o, i, t0, t1);
      el.packs.push(pth(pr.sil, "sil")); pth(pr.crease, "nf"); const tp = (u, v, z) => { const q = turn([{ u, v, nu: 1, nv: 0 }], hx, hy, ang)[0]; return P(q.u, q.v, z); };
      if (lift < 0.12) pth(seg(tp(f0 + 0.2, -6.9, Z(46)), tp(f0 + 0.2, 6.9, Z(46))) + seg(tp(f0 + 0.2, -6.9, Z(36)), tp(f0 + 0.2, 6.9, Z(36))), "nf lo");
      pth(open([tp(hx, hy, t0 + 3), tp(hx, hy, t1 - 3)]), "nf");
    } else if (!YA) {
      const pk = SK ? [-10.5, -4.6, 33, 47] : [-13.5, -4.6, 26, 53];
      el.packs.push(pth(prism(P, front, rrect(pk[0], -6.8, pk[1], 6.8, 2.6, 5), rrect(pk[0] + 0.7, -6.1, pk[1] - 0.7, 6.1, 1.9, 5), Z(pk[2]), Z(pk[3])).sil, "sil"));
      pth(seg(P(pk[1] + 0.1, -6.8, Z(pk[2] + 4)), P(pk[1] + 0.1, 6.8, Z(pk[2] + 4))) + (SK ? "" : seg(P(pk[0] + 0.5, -6.6, Z(46)), P(pk[0] + 0.5, 6.6, Z(46))) + seg(P(pk[0] + 0.5, -6.6, Z(40)), P(pk[0] + 0.5, 6.6, Z(40)))), "nf lo");
    }
    /* legs, far one first: one outline each from hip to ankle, knee bellows, thigh strap; laced boots */ el.boots = [];
    const leg = (y) => {
      const hip = [0.2, y, Z(29.5)], th = [0.9, y * 1.02, Z(23)], kn = [1.5, y * 1.04, Z(16.5)], cf = [0.9, y * 1.05, Z(11.5)], an = [0.5, y * 1.06, Z(6.2)];
      pth(limb(P, [hip, th, kn, cf, an], [4.4, 4.0, 3.45, 3.35, 2.7]), "sil");
      for (const dz of [-1.6, 0, 1.6]) pth(half(around(P, [kn[0], kn[1], kn[2] + dz], [0, 0, 1], 3.3, 24)), "nf lo");
      pth(half(around(P, th, [0, 0, 1], 3.85, 24)), "nf");
      const boot = prism(P, front, rrect(-3.2, y - 2.9, 6.6, y + 2.9, 2.8, 6), rrect(-2.5, y - 2.2, 5.9, y + 2.2, 2.1, 6), Z(0), Z(6.6));
      el.boots.push(pth(boot.sil, "sil")); pth(boot.crease, "nf");
      if (YA) { const u = prism(P, front, rrect(3.2, y * 1.03 - 2.2, 6.6, y * 1.03 + 2.2, 1.2, 5), rrect(3.8, y * 1.03 - 1.6, 6.0, y * 1.03 + 1.6, 0.7, 5), Z(17.5), Z(25)); el.packs.push(pth(u.sil, "sil")); pth(u.crease, "nf");
        pth(open([P(4.9, y * 1.03 - 0.6, Z(25)), P(3.6, y * 0.9, Z(28.5)), P(2.4, y * 0.6, Z(31))]), "nf lo"); }
      pth(nearArc(P, 1.7, y, Z(1.3), 4.95, 2.95), "nf lo");
      pth(open([0, 1, 2, 3].flatMap((k) => [P(2.9 - k * 0.55, y - 0.9, Z(3 + k * 0.9)), P(2.9 - k * 0.55, y + 0.9, Z(3.45 + k * 0.9))])), "nf lo");
    };
    leg(-4); leg(4);
    /* arms: shoulder, elbow, wrist on one swept outline; bellows; a cuff; the glove with a thumb */ el.gloves = [];
    const arm = (sd) => {
      const sh = [0.3, sd * 9.8, Z(46)], up = [1.0, sd * 11.0, Z(41)], eb = [2.6, sd * 11.4, Z(36.2)], fa = [4.8, sd * 10.9, Z(32.6)], wr = [6.6, sd * 10.2, Z(29.6)];
      pth(limb(P, [sh, up, eb, fa, wr], [3.9, 3.35, 3.05, 2.95, 2.6]), "sil");
      const d = nrm(fa.map((x, i) => x - up[i]));
      for (const f of [-0.12, 0, 0.12]) pth(half(around(P, lerp(eb, fa, f + 0.08), d, 3.05, 24)), "nf lo");
      pth(half(around(P, sh, nrm([0, sd, 0.25]), 3.6, 24)), HARD ? "nf" : "nf lo");
      if (HARD) pth(half(around(P, lerp(sh, up, 0.35), nrm([0.1, sd, -0.6]), 3.7, 24)), "nf");
      const dw = nrm(wr.map((x, i) => x - fa[i]));
      for (const f of [0.78, 0.92]) pth(half(around(P, lerp(fa, wr, f), dw, 2.75, 24)), "nf");
      const hand = [8.0, sd * 9.8, Z(26.4)], tip = [8.8, sd * 9.5, Z(24.6)];
      el.gloves.push(pth(limb(P, [lerp(wr, hand, 0.2), hand, tip], [2.55, 2.45, 1.9]), "sil"));
      pth(limb(P, [[7.6, sd * 8.0, Z(28)], [8.7, sd * 7.7, Z(26.6)]], [0.85, 0.7]), "sil");
      pth(half(around(P, lerp(wr, hand, 0.55), dw, 2.4, 24)), "nf lo");
    };
    arm(-1);
    /* torso, lofted so the waist stays in; seam down the front, belt with a buckle */ el.torso = pth(loft(P, 0.4, TR), "sil");
    pth(open([Z(33.5), Z(37), Z(41), Z(45), Z(48.5)].map((z) => P(...frontAt(TR, 0.4, z, 0)))), "nf lo");
    pth(nearArc(P, 0.4, 0, Z(31.2), 4.25, 6.75), "nf"); pth(nearArc(P, 0.4, 0, Z(30.2), 4.35, 6.9), "nf lo");
    const bk = frontAt(TR, 0.4, Z(30.7), 0); pth(poly([P(bk[0] + 0.2, -1.3, Z(29.7)), P(bk[0] + 0.2, 1.3, Z(29.7)), P(bk[0] + 0.2, 1.3, Z(31.7)), P(bk[0] + 0.2, -1.3, Z(31.7))]), "sil");
    pth(nearArc(P, 0.4, 0, Z(48.6), 4.45, 8.35), "nf lo");
    if (SK) {
      /* harness straps crossing the chest with a ring where they meet, ventilation fitting and hose to the hip */ const st = (y0, z0, y1, z1) => open(Array.from({ length: 9 }, (_, k) => { const t = k / 8; return P(...frontAt(TR, 0.55, z0 + (z1 - z0) * t, y0 + (y1 - y0) * t)); }));
      pth(st(-6.3, Z(47.5), 5.4, Z(33)) + st(6.3, Z(47.5), -5.4, Z(33)), "nf");
      const mid = frontAt(TR, 0.6, Z(40.3), 0); pth(poly(around(P, mid, [1, 0, 0], 0.9, 14)), "sil");
      const vf = frontAt(TR, 0.7, Z(37.5), 3.6); pth(poly(around(P, vf, nrm([1, 0.45, 0]), 1.1, 16)), "sil");
      el.extra = pth(open([P(vf[0] + 0.6, vf[1] + 0.6, vf[2] - 0.6), P(vf[0] + 2.4, vf[1] + 2.6, Z(33.5)), P(vf[0] + 2.2, vf[1] + 3.8, Z(29)), P(vf[0] + 1.2, vf[1] + 3.6, Z(26))]), "nf");
    } else {
      /* the chest control panel with its gauge, and the oxygen hoses to the pack */ const cp = frontAt(TR, 0.4, Z(40), 0);
      if (HARD) { // пульт на груди: широкий блок с рукоятками по бокам
        const pz = KR ? [36, 44] : [34, 41], pw = KR ? 5.4 : 4.6, px = cp[0] + 0.6;
        const pr = prism(P, front, rrect(px - 1.4, -pw, px + 2.4, pw, 1.3, 5), rrect(px - 0.8, -pw + 0.7, px + 1.8, pw - 0.7, 0.7, 5), Z(pz[0]), Z(pz[1]));
        el.panel = pth(pr.sil, "sil"); pth(pr.crease, "nf");
        for (const yy of [-pw - 0.6, pw + 0.6]) pth(open([P(px, yy * 0.86, Z(pz[1] - 1)), P(px + 1.6, yy, Z(pz[1] - 2.2)), P(px + 1.6, yy, Z(pz[0] + 1))]), "nf");
        if (KR) pth(open([P(px + 2.5, -pw + 1, Z(pz[1] + 0.2)), P(px + 3.2, -pw + 1, Z(pz[1] + 3.2)), P(px + 3.2, pw - 1, Z(pz[1] + 3.2)), P(px + 2.5, pw - 1, Z(pz[1] + 0.2))]), "nf lo");
      } else el.panel = pth(prism(P, front, rrect(cp[0] - 1.2, -3.8, cp[0] + 1.6, 3.8, 1.2, 4), rrect(cp[0] - 0.8, -3.3, cp[0] + 1.2, 3.3, 0.8, 4), Z(37), Z(43.5)).sil, "sil");
      const gz = HARD ? [cp[0] + 3.1, 1.6, Z(KR ? 41 : 38.5)] : [cp[0] + 1.7, 1.6, Z(41.5)]; pth(poly(around(P, gz, [1, 0, 0], 1, 14)), "nf");
      pth(seg(P(cp[0] + 1.7, -2.6, Z(39)), P(cp[0] + 1.7, -0.4, Z(39))), "nf lo");
      el.extra = HARD || YA ? el.panel : el.packs[0];
    }
    arm(1);
    /* neck ring with its bolts, helmet dome, visor frame and glass (turns up with the pointer) */ if (HARD) pth(nearArc(P, 0.4, 0, Z(52.4), 5.6, 7.4), "nf lo");
    else { pth(poly(hull(ell(P, 0.5, 0, Z(50.2), 5.8, 6.1).concat(ell(P, 0.5, 0, Z(52.8), 5.8, 6.1)))), "sil");
    pth(nearArc(P, 0.5, 0, Z(51.5), 5.85, 6.15), "nf lo"); }
    if (!HARD) for (let k = 0; k < 9; k++) { const t = -1.2 + k * 0.3, p = [0.5 + 5.85 * Math.cos(t), 6.15 * Math.sin(t), Z(51.5)]; pth(poly(around(P, p, [Math.cos(t), Math.sin(t), 0], 0.28, 8)), "nf"); }
    const hc = HARD ? [1.2, 0, Z(58.6)] : [0.8, 0, Z(59.4)];
    const o = P(...hc), e = P(hc[0] + HR * 0.7071, hc[1] - HR * 0.7071, hc[2]), hr = Math.hypot(e[0] - o[0], e[1] - o[1]);
    el.helmet = mk("ellipse", { cx: o[0].toFixed(2), cy: o[1].toFixed(2), rx: hr.toFixed(2), ry: hr.toFixed(2), class: "sil" }, body);
    const vl = HARD ? 0.18 : lift, vd = nrm([0.92 - 0.5 * vl, 0.22, 0.05 + 1.05 * vl]);
    const visor = (r, a, sx, sy = 0.82) => { const u = nrm(cross(vd, [0, 0, 1])), v = cross(vd, u); return Array.from({ length: 30 }, (_, k) => { const t = (k / 30) * 2 * Math.PI; const q = [0, 1, 2].map((i) => Math.cos(a) * vd[i] + Math.sin(a) * (Math.cos(t) * u[i] * sx + Math.sin(t) * v[i] * sy)); return P(hc[0] + r * q[0], hc[1] + r * q[1], hc[2] + r * q[2]); }); };
    pth(poly(visor(HR * 1.03, 0.78, 1.12)), "sil");
    el.visor = pth(poly(visor(HR * 1.045, 0.64, 1.1)), "sil");
    if (!SK) pth(poly(visor(HR * 1.06, 0.5, 1.08, 0.7)), "nf lo");
    /* фары по бокам шлема полужёстких скафандров */ if (HARD) for (const yy of [-1, 1]) { const lt = [hc[0] - 0.5, yy * HR * 0.98, hc[2] - 2.2]; pth(poly(around(P, lt, [0, yy, 0], 1.1, 12)), "sil"); }
    /* a glint on the glass */ const gl = visor(HR * 1.05, 0.48, 1.0, 0.75); pth(open(gl.slice(17, 22)), "nf");
    if (SK) { pth(open(around(P, [hc[0], hc[1], hc[2] + HR * 0.42], [0, 0, 1], HR * 0.9, 24).slice(10, 24)), "nf lo");
      const lt = [hc[0] - 1.2, HR * 0.97, hc[2] - 1.5]; pth(poly(around(P, lt, [0, 1, 0], 0.9, 12)), "sil"); }
    light(cur);
  }
  let cur = -1;
  function light(a) {
    cur = a;
    if (!el.helmet) return;
    el.helmet.classList.toggle("hi", a === 0);
    el.visor.classList.toggle("hi", a === 1 || a < 0);
    el.torso.classList.toggle("hi", a === 2);
    el.packs.forEach((x) => x.classList.toggle("hi", a === 3 || (!SK && !HARD && !YA && a === 6)));
    el.gloves.forEach((x) => x.classList.toggle("hi", a === 4));
    el.boots.forEach((x) => x.classList.toggle("hi", a === 5));
    if (SK || HARD || YA) el.extra.classList.toggle("hi", a === 6);
  }
  const sp = spring(0.25 * vmax);
  let drawn = NaN;
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; build(sp.x); } return m; });
  bag.add(B.unregister);
  /* nearest part; the parts never move, only the visor turns (rule 01) */ function hit([sx, sy]) {
    const A = [[0, 0, Z(63), 8], [8, 2, Z(59), 5], [2, 0, Z(41), 10], YA ? [5, 4.2, Z(21), 4] : [-10, 0, Z(42), 7], [7.3, 9.6, Z(25.5), 5], [2, 0, Z(3), 8], ...(SK ? [[7, 7, Z(31), 4]] : HARD ? [[8.5, 0, Z(KR ? 40 : 37.5), 4]] : YA ? [[7.5, 0, Z(40), 3.5]] : [])];
    let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 2.8); if (d < 1 && d < bd) { bd = d; best = k; } });
    return best;
  }
  function move(p) {
    sp.t = clamp(HARD ? (300 - p[0]) / 170 : (p[0] - 110) / 180, 0, 1) * vmax;
    const a = hit(p);
    if (a !== cur) { light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0.25 * vmax; light(-1); read.textContent = "rest"; B.wake(); }
  build(sp.x); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { vmax = v; sp.t = Math.min(sp.t, vmax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "yastreb",
  means: "Скафандр «Ястреб» на манекене: блоки жизнеобеспечения на ногах, палец поднимает стекло шлема.",
  rules: [1, 5, 9, 10],
  range: [6, 10, 14],
  tour: [[150, 120], [220, 160], [260, 230], null],
  mount,
});
