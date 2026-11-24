/**
 * __TITLE__ on a museum mannequin: a domed helmet on a thick neck ring with
 * its visor, a soft suit that narrows to the waist, ball shoulder joints,
 * bellows at elbows and knees, gloves, boots and a pack on the back.
 * __GESTURE_DOC__ What the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rrect, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const KIND = "__KIND__", PL = 3, HR = 8.4, SK = KIND === "sk1";
const NAMES = ["шлем", "стекло", "оболочка", "ранец", "перчатки", "ботинки", "__EXTRA__"];
const nrm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const around = (P, c, d, r, n = 18, sx = 1) => { const u = nrm(cross(d, Math.abs(d[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1])), v = cross(d, u); return Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(...[0, 1, 2].map((i) => c[i] + r * (Math.cos(t) * u[i] * sx + Math.sin(t) * v[i]))); }); };
/** horizontal ellipse ring: half-depth a (x), half-width b (y) */
const ell = (P, cx, cy, z, a, b, n = 24) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(cx + a * Math.cos(t), cy + b * Math.sin(t), z); });
const tube = (P, a, b, r0, r1) => { const d = nrm(b.map((x, i) => x - a[i])); return poly(hull(around(P, a, d, r0).concat(around(P, b, d, r1)))); };
const ball = (P, c, r) => poly(hull([[0, 0, 1], [0, 1, 0], [1, 0, 0]].flatMap((d) => around(P, c, d, r, 20))));
const bellows = (P, a, b, r, n) => { const d = nrm(b.map((x, i) => x - a[i])); let s = ""; for (let k = 1; k <= n; k++) { const f = k / (n + 1), c = a.map((x, i) => x + (b[i] - x) * f); s += open(around(P, c, d, r * 1.06, 18).slice(2, 12)); } return s; };

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let vmax = value;
  const C = Cam(45, 0.5, 3.7);
  fit(C, [[-16, -16, 0], [16, 16, 0], [16, -16, 0], [-16, 16, 0], [0, 0, 75]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, rrect(-16, -16, 16, 16, 8, 6), rrect(-14.5, -14.5, 14.5, 14.5, 6.5, 6), 0, PL));
  const body = mk("g", {}, g), el = {};
  const Z = (z) => PL + z;
  function build(s) {
    body.replaceChildren();
    const pth = (d, cls) => mk("path", { d, class: cls }, body);
    // the mannequin's stand, then the pack, which hangs behind the back
    pth(seg(P(-7, 0, PL), P(-7, 0, Z(30))), "nf lo");
    el.pack = pth(prism(P, front, rrect(SK ? -10 : -13, -6.5, -4.5, 6.5, 2.4, 5), rrect(SK ? -9.3 : -12.3, -5.8, -5.2, 5.8, 1.7, 5), Z(SK ? 33 : 27), Z(SK ? 47 : 52)).sil, "sil");
    if (!SK) pth(seg(P(-12.4, -3, Z(46)), P(-12.4, 3, Z(46))) + seg(P(-12.4, -3, Z(40)), P(-12.4, 3, Z(40))), "nf lo");
    // legs: thigh, knee bellows, shin; boots with a sole
    el.boots = [];
    for (const y of [-3.8, 3.8]) {
      const hip = [0, y, Z(28)], knee = [1.4, y * 1.04, Z(16)], ankle = [0.4, y * 1.06, Z(5.5)];
      pth(tube(P, hip, knee, 3.6, 3.1), "sil"); pth(tube(P, knee, ankle, 3.1, 2.6), "sil");
      pth(bellows(P, [knee[0], knee[1], knee[2] + 2.4], [knee[0], knee[1], knee[2] - 2.4], 3.1, 3), "nf lo");
      const boot = prism(P, front, rrect(-3, y - 2.8, 6.2, y + 2.8, 2.6, 5), rrect(-2.3, y - 2.1, 5.5, y + 2.1, 1.9, 5), Z(0), Z(5.5));
      el.boots.push(pth(boot.sil, "sil")); pth(boot.crease, "nf");
      pth(open(ell(P, 1.6, y, Z(1.2), 4.8, 3, 24).slice(-8).concat(ell(P, 1.6, y, Z(1.2), 4.8, 3, 24).slice(0, 7))), "nf lo");
    }
    // arms: ball shoulders, bellows at the elbow, gloves; the far arm goes behind the torso
    el.gloves = [];
    const arm = (sd) => {
      const sh = [0.4, sd * 9.4, Z(46)], elb = [2.6, sd * 10.6, Z(36)], wr = [5.6, sd * 9.8, Z(28.5)], hand = [7.2, sd * 9.4, Z(25.3)];
      pth(ball(P, sh, 3.3), "sil");
      pth(tube(P, sh, elb, 2.9, 2.6), "sil"); pth(tube(P, elb, wr, 2.6, 2.3), "sil");
      pth(bellows(P, [elb[0] - 0.5, elb[1], elb[2] + 2.2], [elb[0] + 0.7, elb[1], elb[2] - 2.2], 2.6, 3), "nf lo");
      pth(open(around(P, wr, nrm(wr.map((x, i) => x - elb[i])), 2.5, 18).slice(2, 12)), "nf");
      el.gloves.push(pth(tube(P, wr, hand, 2.3, 2.0), "sil"));
    };
    arm(-1);
    // torso: a soft hull that narrows to the waist and widens at the chest
    const rings = [[Z(26), 4.6, 7.4], [Z(32), 4.1, 6.6], [Z(41), 5.4, 8.2], [Z(47), 4.8, 8.6], [Z(50), 3.4, 6]];
    el.torso = pth(poly(hull(rings.flatMap(([z, a, b]) => ell(P, 0.4, 0, z, a, b)))), "sil");
    pth(open(ell(P, 0.4, 0, Z(31), 4.15, 6.65).slice(-6).concat(ell(P, 0.4, 0, Z(31), 4.15, 6.65).slice(0, 7))), "nf");
    if (SK) {
      // harness straps crossing the chest, the ventilation hose to the hip
      pth(seg(P(4.9, -6.2, Z(47)), P(4.5, 5.2, Z(33))) + seg(P(4.9, 6.2, Z(47)), P(4.5, -5.2, Z(33))), "nf lo");
      el.extra = pth(open([P(4.6, 3.4, Z(38)), P(7.4, 6.5, Z(33)), P(6.8, 8.2, Z(27))]), "nf");
    } else {
      // the chest control panel and the pressure gauge strip
      pth(prism(P, front, rrect(3.4, -3.6, 6.4, 3.6, 1.2, 4), rrect(3.8, -3.1, 6, 3.1, 0.8, 4), Z(37), Z(43)).sil, "sil");
      pth(seg(P(6.5, -2.2, Z(41)), P(6.5, 2.2, Z(41))), "nf lo");
      el.extra = el.pack;
    }
    arm(1);
    // neck ring, helmet dome, visor (slides up with the pointer), SK-1 dome seam or Berkut sun filter
    pth(poly(hull(ell(P, 0.5, 0, Z(50), 5.6, 5.9).concat(ell(P, 0.5, 0, Z(52.2), 5.6, 5.9)))), "sil");
    pth(open(ell(P, 0.5, 0, Z(51.1), 5.65, 5.95).slice(-6).concat(ell(P, 0.5, 0, Z(51.1), 5.65, 5.95).slice(0, 7))), "nf lo");
    const hc = [0.8, 0, Z(58.4)];
    const o = P(...hc), e = P(hc[0] + HR * 0.7071, hc[1] - HR * 0.7071, hc[2]), hr = Math.hypot(e[0] - o[0], e[1] - o[1]);
    el.helmet = mk("ellipse", { cx: o[0].toFixed(2), cy: o[1].toFixed(2), rx: hr.toFixed(2), ry: hr.toFixed(2), class: "sil" }, body);
    const lift = clamp(s / Math.max(1, vmax), 0, 1), vd = nrm([0.92 - 0.5 * lift, 0.22, 0.05 + 1.05 * lift]);
    const visor = (r, a, sx) => { const u = nrm(cross(vd, [0, 0, 1])), v = cross(vd, u); return Array.from({ length: 26 }, (_, k) => { const t = (k / 26) * 2 * Math.PI; const q = [0, 1, 2].map((i) => Math.cos(a) * vd[i] + Math.sin(a) * (Math.cos(t) * u[i] * sx + Math.sin(t) * v[i] * 0.82)); return P(hc[0] + r * q[0], hc[1] + r * q[1], hc[2] + r * q[2]); }); };
    el.visor = pth(poly(visor(HR * 1.02, 0.7, 1.12)), "sil");
    if (!SK) pth(poly(visor(HR * 1.04, 0.52, 1.1)), "nf lo");
    if (SK) pth(open(around(P, [hc[0], hc[1], hc[2] + HR * 0.42], [0, 0, 1], HR * 0.9, 22).slice(9, 22)), "nf lo");
    light(cur);
  }
  let cur = -1;
  function light(a) {
    cur = a;
    if (!el.helmet) return;
    el.helmet.classList.toggle("hi", a === 0);
    el.visor.classList.toggle("hi", a === 1 || a < 0);
    el.torso.classList.toggle("hi", a === 2);
    el.pack.classList.toggle("hi", a === 3 || (!SK && a === 6));
    el.gloves.forEach((x) => x.classList.toggle("hi", a === 4));
    el.boots.forEach((x) => x.classList.toggle("hi", a === 5));
    if (SK) el.extra.classList.toggle("hi", a === 6);
  }
  const sp = spring(0.25 * vmax);
  let drawn = NaN;
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; build(sp.x); } return m; });
  bag.add(B.unregister);
  // nearest part; the parts never move, only the visor turns (rule 01)
  function hit([sx, sy]) {
    const A = [[0, 0, Z(62), 8], [8, 2, Z(58), 5], [2, 0, Z(38), 11], [-9, 0, Z(42), 7], [7, 9.5, Z(26), 5], [2, 0, Z(3), 8], ...(SK ? [[7, 7, Z(31), 4]] : [])];
    let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 2.8); if (d < 1 && d < bd) { bd = d; best = k; } });
    return best;
  }
  function move(p) {
    sp.t = clamp((p[0] - 110) / 180, 0, 1) * vmax;
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
  name: "__KIND__",
  means: "__MEANS__",
  rules: [1, 5, 9, 10],
  range: __RANGE__,
  tour: [[150, 120], [220, 160], [260, 230], null],
  mount,
});
