/**
 * The veranda of Tsiolkovsky's house in Kaluga, as the museum rebuilt it: a corner of glazed
 * walls with small-paned sashes and a roof beam, his writing desk with papers, a lamp and the
 * tin ear trumpet he used (he was nearly deaf from childhood), a chair, and a model of his
 * all-metal airship hanging from the beam. The pointer's x swings a side sash open and sets
 * the airship turning on its strings; what the pointer is nearest takes the bright stroke and is named.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rrect, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

const PL = 3, R = 46, H = 50, NAMES = ["окна веранды", "стол", "слуховая труба", "модель дирижабля"];
const disc = (r, cx = 0, cy = 0) => rrect(cx - r, cy - r, cx + r, cy + r, r, 14);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let amax = (value * Math.PI) / 180;
  const C = Cam(45, 0.5, 2.25);
  fit(C, [[-R, -R, 0], [R, R, 0], [R, -R, 0], [-R, R, 0], [-32, -32, PL + H + 4], [-32, 30, PL + H + 4], [30, -32, PL + H + 4]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  put(solid(g), prism(P, front, disc(R), disc(R - 1.5), 0, PL));
  const Z = (z) => PL + z, W0 = -32, X1 = 26, Y1 = 30;
  // two glazed walls meeting in the far corner: back wall (x = W0) and side wall (y = W0)
  const panel = (a, b, z0, z1) => poly([P(...a, Z(z0)), P(...b, Z(z0)), P(...b, Z(z1)), P(...a, Z(z1))]);
  const back = mk("path", { d: panel([W0, W0], [W0, Y1], 0, H), class: "sil" }, g);
  const side = mk("path", { d: panel([W0, W0], [X1, W0], 0, H), class: "sil" }, g);
  // sashes: a sill at 14, a transom at 40, mullions every 9.7; each sash in three panes
  let grid = "";
  for (const [a, b, along] of [[[W0, W0], [W0, Y1], 1], [[W0, W0], [X1, W0], 0]]) {
    const L = along ? Y1 - W0 : X1 - W0, at = (t, z) => P(along ? W0 : W0 + t, along ? W0 + t : W0, Z(z));
    for (const z of [14, 40]) grid += seg(at(0, z), at(L, z));
    for (let t = 9.7; t < L - 1; t += 9.7) grid += seg(at(t, 14), at(t, H));
    for (let t = 0; t < L - 1; t += 9.7) for (const z of [22.7, 31.3]) grid += seg(at(t + 0.8, z), at(Math.min(L, t + 8.9), z));
    for (let t = 4.85; t < L; t += 9.7) grid += seg(at(t, 40), at(t, H));
    grid += seg(at(0, 6), at(L, 6));
  }
  const panes = mk("path", { d: grid, class: "nf lo" }, g);
  // the roof beam over both walls
  const beam = (a0, a1, b0, b1) => poly([P(a0, a1, Z(H)), P(b0, b1, Z(H)), P(b0, b1, Z(H + 2.5)), P(a0, a1, Z(H + 2.5))]);
  mk("path", { d: beam(W0, W0, W0, Y1) + beam(W0, W0, X1, W0), class: "sil" }, g);
  // an open sash on the side wall, hinged at its left post
  const sash = mk("path", { class: "sil" }, g), sashL = mk("path", { class: "nf lo" }, g);
  // the hanging airship: two strings from the beam, a cigar of corrugated metal with a gondola
  const strings = mk("path", { class: "nf lo" }, g), ship = mk("path", { class: "sil" }, g), shipL = mk("path", { class: "nf lo" }, g);
  // desk against the back wall: top, two pedestals; papers, lamp, ear trumpet
  const desk = solid(g);
  put(desk, prism(P, front, rrect(W0 + 2, -14, W0 + 18, 14, 1, 4), rrect(W0 + 3, -13, W0 + 17, 13, 0.5, 4), Z(17), Z(19)));
  for (const y of [-12, 8]) put(solid(g), prism(P, front, rrect(W0 + 3, y, W0 + 16, y + 5, 0.6, 4), rrect(W0 + 3.6, y + 0.6, W0 + 15.4, y + 4.4, 0.3, 4), 0, Z(17) - PL));
  mk("path", { d: [[W0 + 6, -9, 0.4], [W0 + 9, -3, -0.3], [W0 + 5, 3, 0.2]].map(([x, y, r]) => poly([P(x, y, Z(19.2)), P(x + 7 * Math.cos(r), y + 7 * Math.sin(r), Z(19.2)), P(x + 7 * Math.cos(r) - 5 * Math.sin(r), y + 7 * Math.sin(r) + 5 * Math.cos(r), Z(19.2)), P(x - 5 * Math.sin(r), y + 5 * Math.cos(r), Z(19.2))])).join(""), class: "nf" }, g);
  const lamp = mk("g", {}, g);
  put(solid(lamp), prism(P, front, disc(2.2, W0 + 7, 10), disc(1.6, W0 + 7, 10), Z(19), Z(20)));
  mk("path", { d: seg(P(W0 + 7, 10, Z(20)), P(W0 + 7, 10, Z(28))), class: "nf" }, lamp);
  const shade = mk("path", { d: poly(hull([...Array.from({ length: 16 }, (_, k) => P(W0 + 7 + 1.2 * Math.cos(k / 16 * 6.283), 10 + 1.2 * Math.sin(k / 16 * 6.283), Z(30))), ...Array.from({ length: 16 }, (_, k) => P(W0 + 7 + 3.6 * Math.cos(k / 16 * 6.283), 10 + 3.6 * Math.sin(k / 16 * 6.283), Z(26.5)))])), class: "sil" }, lamp);
  // the ear trumpet: a long cone lying on the desk, bell toward the viewer
  const cone = (c0, c1, r0, r1) => { const d = c1.map((v, i) => v - c0[i]), l = Math.hypot(...d), u = [-d[1] / l, d[0] / l, 0], w = [0, 0, 1]; const ring = (c, r) => Array.from({ length: 18 }, (_, k) => { const t = k / 18 * 6.283; return P(c[0] + r * (Math.cos(t) * u[0]), c[1] + r * (Math.cos(t) * u[1]), c[2] + r * Math.sin(t)); }); return [poly(hull(ring(c0, r0).concat(ring(c1, r1)))), poly(ring(c1, r1))]; };
  const [tr, trMouth] = cone([W0 + 9, -11, Z(20)], [W0 + 17, -3, Z(22.5)], 0.6, 3.2);
  const trumpet = mk("path", { d: tr, class: "sil" }, g); mk("path", { d: trMouth, class: "nf" }, g);
  // the chair in front of the desk
  put(solid(g), prism(P, front, rrect(W0 + 22, -5, W0 + 31, 4, 1, 4), rrect(W0 + 22.6, -4.4, W0 + 30.4, 3.4, 0.6, 4), Z(10), Z(11.5)));
  mk("path", { d: [[W0 + 23, -4.5], [W0 + 30.5, -4.5], [W0 + 23, 3.5], [W0 + 30.5, 3.5]].map(([x, y]) => seg(P(x, y, PL), P(x, y, Z(10)))).join("") + poly([P(W0 + 30.5, -4.5, Z(11.5)), P(W0 + 30.5, 3.5, Z(11.5)), P(W0 + 31.2, 3.5, Z(24)), P(W0 + 31.2, -4.5, Z(24))]), class: "nf" }, g);
  const sp = spring(0.08 * amax);
  let drawn = NaN, pick = -2, spin = 0, last = 0;
  function draw(t) {
    const a = sp.x;
    // sash on the side wall (y = W0), hinged at x = 6, 9.7 wide, from sill 14 to transom 40
    const hx = 6, sw = 9.7, q = (u, z) => P(hx + u * Math.cos(a), W0 + u * Math.sin(a), Z(z));
    sash.setAttribute("d", poly([q(0, 14), q(sw, 14), q(sw, 40), q(0, 40)]));
    sashL.setAttribute("d", seg(q(0.6, 22.7), q(sw - 0.6, 22.7)) + seg(q(0.6, 31.3), q(sw - 0.6, 31.3)));
    // the airship model turns slowly with the draught from the open sash
    const yaw = spin, sc = [-6, -6, Z(41)], L = 13, rr = 2.8, ax = [Math.cos(yaw), Math.sin(yaw), 0], up = [-Math.sin(yaw), Math.cos(yaw), 0];
    const ring = (s, r) => Array.from({ length: 18 }, (_, k) => { const th = k / 18 * 6.283; return P(sc[0] + ax[0] * s + up[0] * r * Math.cos(th), sc[1] + ax[1] * s + up[1] * r * Math.cos(th), sc[2] + r * Math.sin(th)); });
    const prof = [[-L, 0.3], [-L * 0.7, 0.75], [-L * 0.3, 1], [L * 0.3, 1], [L * 0.7, 0.75], [L, 0.25]];
    ship.setAttribute("d", poly(hull(prof.flatMap(([s, f]) => ring(s, rr * f)))));
    shipL.setAttribute("d", prof.slice(1, -1).map(([s, f]) => { const e = ring(s, rr * f * 1.01); return open(e.slice(4, 14)); }).join("") + poly([P(sc[0] - ax[0] * 3, sc[1] - ax[1] * 3, sc[2] - rr - 1.6), P(sc[0] + ax[0] * 3, sc[1] + ax[1] * 3, sc[2] - rr - 1.6), P(sc[0] + ax[0] * 2.4, sc[1] + ax[1] * 2.4, sc[2] - rr), P(sc[0] - ax[0] * 2.4, sc[1] - ax[1] * 2.4, sc[2] - rr)]));
    strings.setAttribute("d", [-0.5, 0.5].map((f) => seg(P(sc[0] + ax[0] * L * f, sc[1] + ax[1] * L * f, sc[2] + rr * 0.9), P(sc[0] + ax[0] * L * f * 0.6, W0 + 1, Z(H)))).join(""));
  }
  function light(k) {
    [back, side, sash].forEach((e) => e.classList.toggle("hi", k === 0));
    desk.sil.classList.toggle("hi", k === 1);
    trumpet.classList.toggle("hi", k === 2 || k < 0);
    ship.classList.toggle("hi", k === 3);
  }
  const B = register(stage, (dt, now) => { const m = stepS(sp, dt); spin += dt * 0.6 * (sp.x / Math.max(0.01, amax)); draw(now); return m || sp.x > 0.05 * amax; });
  bag.add(B.unregister);
  function hit([sx, sy]) {
    const A = [[0, W0, Z(30), 16], [W0 + 10, 0, Z(18), 10], [W0 + 13, -7, Z(21), 5], [-6, -6, Z(41), 10]];
    let best = -1, bd = 1e9;
    A.forEach(([x, y, z, r], k) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * 2.4); if (d < 1 && d < bd + (k === 0 ? 0.4 : 0)) { bd = d; best = k; } });
    return best;
  }
  function move(p) {
    sp.t = clamp((p[0] - 110) / 180, 0, 1) * amax;
    const a = hit(p);
    if (a !== pick) { pick = a; light(a); read.textContent = a < 0 ? "rest" : NAMES[a]; }
    B.wake();
  }
  function leave() { sp.t = 0.08 * amax; pick = -2; light(-1); read.textContent = "rest"; B.wake(); }
  draw(0); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { amax = (v * Math.PI) / 180; sp.t = Math.min(sp.t, amax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "veranda",
  means: "Веранда Циолковского: палец открывает створку окна, и модель дирижабля поворачивается на нитях.",
  rules: [1, 3, 5, 9],
  range: [40, 70, 95],
  tour: [[150, 200], [230, 140], [280, 110], null],
  mount,
});
