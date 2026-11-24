/**
 * Zal 1, in detail: the first hall as a slab with seven exhibits on rounded
 * plinths, each with its reading desk in front, the route dashed on the floor
 * and the 1957–1966 rail along the back. The pointer picks the exhibit under
 * it: it rises off its plinth, its desk takes the bright stroke, its year on
 * the rail lights to a medium dot; neighbours lift a little, staggered by
 * distance. The slider is the stagger, in ms.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rings, rrect, ringAt, run, seg, unproj,
  tset, tval, tdone, tween, disposer, mk, pointer, put, register, solid, flatDot, place,
} = HL;

const U = 3, E = 2.3, PL = 1.6, LIFT = 19, SLAB = 3;
// [read-out, kind, x, y (metres, museum plan), plinth size (m), year]
const EX = [
  ["СК-1", "suit", -11, 17, 1.3, 1961], ["Беркут", "suit", 6, 17, 1.3, 1965], ["Восток", "vostok", -12.5, 25, 2.6, 1961],
  ["ПС-1", "sputnik", -2, 30, 1.6, 1957], ["Венера-1", "venera", 7, 28, 2.1, 1961], ["Контейнер", "cont", -13.7, 35.8, 3.2, 1960],
  ["Луна-9", "luna", 9.5, 37, 1.7, 1966],
].map(([name, kind, x, y, s, yr]) => ({ name, kind, yr, cx: x * U, cy: y * U, h: (s * U * E) / 2 }))
  .sort((a, b) => a.cx + a.cy - (b.cx + b.cy));
const ROUTE = ["ПС-1", "Контейнер", "Восток", "СК-1", "Беркут", "Луна-9", "Венера-1"];
const X0 = -21 * U, X1 = 15.6 * U, Y0 = 9.8 * U, Y1 = 46 * U;
const m = (v) => v * U * E;
const disc = (cx, cy, r, b) => [rrect(cx - r, cy - r, cx + r, cy + r, r, 14), rrect(cx - r + b, cy - r + b, cx + r - b, cy + r - b, r - b, 14)];

/** Exhibit parts at a lift: [d, class] paths, and spheres [sx, sy, r] drawn after them. */
function parts(P, front, e, z) {
  const out = [], balls = [], { cx, cy } = e, rad = (r) => Math.hypot(...[0, 1].map((k) => P(cx + r * 0.7071, cy - r * 0.7071, 0)[k] - P(cx, cy, 0)[k]));
  const cyl = (r, z0, z1, b = 0.9, dx = 0, dy = 0) => { const [o, i] = disc(cx + dx, cy + dy, r, b); const p = prism(P, front, o, i, z0, z1); out.push([p.sil, "sil"], [p.crease, "nf"]); };
  const box = (w, d, z0, z1, dx = 0, dy = 0) => { const [o, i] = rings(cx + dx - w / 2, cy + dy - d / 2, cx + dx + w / 2, cy + dy + d / 2, Math.min(w, d) * 0.3, Math.min(0.8, Math.min(w, d) * 0.3)); const p = prism(P, front, o, i, z0, z1); out.push([p.sil, "sil"], [p.crease, "nf"]); };
  const ball = (r, zc, dx = 0, dy = 0) => { const c = P(cx + dx, cy + dy, zc); balls.push([c[0], c[1], rad(r)]); };
  // a small round mark on a sphere's face: a circle in the tangent plane at direction d
  const port = (R, zc, d, r) => { const n = d.map((v) => v / Math.hypot(...d)), u = [-n[1], n[0], 0].map((v) => v / (Math.hypot(n[0], n[1]) || 1)), w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
    return Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * 6.283, c = Math.cos(a) * r, s = Math.sin(a) * r; return P(cx + n[0] * R + u[0] * c + w[0] * s, cy + n[1] * R + u[1] * c + w[1] * s, zc + n[2] * R + u[2] * c + w[2] * s); }); };
  if (e.kind === "vostok") {
    cyl(m(0.7), z, z + m(0.35));
    const R = m(1.05), zc = z + m(1.35);
    ball(R, zc);
    return { out, balls, after: [[poly(port(R, zc, [1, 0.35, 0.25], m(0.2))), "nf"], [poly(port(R, zc, [0.3, 1, -0.1], m(0.26))), "nf"], [poly(port(R, zc, [0.75, 0.75, 0.75], m(0.13))), "nf"],
      [seg(P(cx, cy, zc + R), P(cx - m(0.1), cy - m(0.1), zc + R + m(0.5))) + seg(P(cx + R * 0.7, cy - R * 0.2, zc + R * 0.65), P(cx + R * 0.95, cy - R * 0.25, zc + R * 1.05)), "nf"]] };
  }
  if (e.kind === "suit") {
    for (const s of [-1, 1]) box(m(0.2), m(0.24), z, z + m(0.85), 0, s * m(0.15));
    box(m(0.24), m(0.3), z + m(0.85), z + m(1.5), -m(0.27));
    box(m(0.42), m(0.62), z + m(0.85), z + m(1.55));
    for (const s of [-1, 1]) box(m(0.16), m(0.16), z + m(0.9), z + m(1.5), m(0.02), s * m(0.42));
    ball(m(0.28), z + m(1.82));
    return { out, balls, after: [[poly(port(m(0.28), z + m(1.82), [1, 0.15, 0.05], m(0.17))), "nf"]] };
  }
  if (e.kind === "venera") {
    cyl(m(0.45), z, z + m(1.4));
    for (const s of [-1, 1]) box(m(0.25), m(1.5), z + m(0.8), z + m(0.85), 0, s * m(1.15));
    cyl(m(0.3), z + m(1.4), z + m(1.55));
    const dish = Array.from({ length: 20 }, (_, k) => { const a = (k / 20) * 6.283; return P(cx + m(0.55) * Math.cos(a), cy + m(0.55) * Math.sin(a), z + m(2.05)); });
    return { out, balls, after: [[seg(P(cx, cy, z + m(1.55)), P(cx, cy, z + m(2.05))), "nf"], [poly(dish), "sil"]] };
  }
  if (e.kind === "sputnik") {
    cyl(m(0.07), z, z + m(0.9), 0.3);
    const c = [cx, cy, z + m(1.15)], ant = [[-1, -0.35], [-1, 0.35], [-0.8, -0.6], [-0.8, 0.6]];
    out.push([ant.map(([dx, dy]) => seg(P(...c), P(cx + dx * m(1.4), cy + dy * m(1.4), c[2] - m(0.55)))).join(""), "nf"]);
    ball(m(0.32), c[2]);
    return { out, balls, after: [[open(Array.from({ length: 13 }, (_, k) => { const a = (k / 12) * 3.1416; return P(cx + m(0.32) * Math.cos(a) * 0.7071, cy - m(0.32) * Math.cos(a) * 0.7071, c[2] + m(0.32) * Math.sin(a) * 0.08); })), "nf"]] };
  }
  if (e.kind === "luna") {
    const petal = (a) => [[0, 0], [0.28, 0.2], [0.75, 0], [0.28, -0.2]].map(([u, v]) => P(cx + m(u * Math.cos(a) - v * Math.sin(a)), cy + m(u * Math.sin(a) + v * Math.cos(a)), z + 0.4));
    for (let k = 0; k < 4; k++) out.push([poly(petal(Math.PI / 4 + (k * Math.PI) / 2)), "nf"]);
    ball(m(0.32), z + m(0.32));
    return { out, balls, after: [[seg(P(cx, cy, z + m(0.6)), P(cx - m(0.15), cy - m(0.15), z + m(1.1))) + seg(P(cx, cy, z + m(0.6)), P(cx + m(0.2), cy - m(0.05), z + m(0.95))), "nf"]] };
  }
  if (e.kind === "cont") {
    const r = m(0.42), L = m(0.95), zc = z + m(0.62), end = (x, rr = r) => Array.from({ length: 24 }, (_, k) => P(cx + x, cy + rr * Math.cos((k / 24) * 6.283), zc + rr * Math.sin((k / 24) * 6.283)));
    box(m(1.3), m(0.7), z, z + m(0.12));
    for (const s of [-1, 1]) box(m(0.14), m(0.5), z + m(0.12), z + m(0.3), s * m(0.6));
    out.push([poly(hull(end(-L).concat(end(L)))), "sil"], [poly(end(L - 1.2)), "nf"], [poly(end(L - 1.2, r * 0.55)), "nf"]);
    return { out, balls, after: [[poly(Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * 6.283; return P(cx - m(0.2) + m(0.22) * Math.cos(a), cy + r, zc + m(0.22) * Math.sin(a)); })), "nf"]] };
  }
  return { out, balls, after: [] };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;
  const C = Cam(45, 0.5, 2.3);
  fit(C, [[X0, Y0, -SLAB], [X1, Y1, -SLAB], [X1, Y0, -SLAB], [X0, Y1, -SLAB], [X0, Y0, m(3)], [X1, Y0, m(3)]], 200, 170);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [fr, fi] = rings(X0, Y0, X1, Y1, 14, 2.2);
  put(solid(g), prism(P, front, fr, fi, -SLAB, 0));
  // the route, dashed on the floor, painted before every plinth (rule 06)
  const byName = Object.fromEntries(EX.map((e) => [e.name, e]));
  const rp = [[-3 * U, Y0 + 2]].concat(ROUTE.map((n) => [byName[n].cx, byName[n].cy]));
  mk("path", { class: "dash nf", d: open(rp.map(([x, y]) => P(x, y, 0))) }, g);
  // the year rail along the back wall: a long low plate with ten dots on top
  const RY = Y0 + 2.4, RX0 = X0 + 14, RX1 = X1 - 10, RH = m(0.55);
  const [ro, ri] = rings(RX0, RY - 1.4, RX1, RY + 1.4, 1.4, 0.6);
  put(solid(g), prism(P, front, ro, ri, 0, RH));
  const years = Array.from({ length: 10 }, (_, k) => { const d = flatDot(g, C, 1.15, "dot off"); place(d, P(RX0 + 4 + (k * (RX1 - RX0 - 8)) / 9, RY, RH)); return d; });
  const door = flatDot(g, C, 1.6, "dot m");
  place(door, P(-3 * U, Y0 + 4, 0));

  const items = EX.map((e) => {
    const grp = mk("g", {}, g);
    const [o, i] = rings(e.cx - e.h, e.cy - e.h, e.cx + e.h, e.cy + e.h, e.h * 0.55, 1.1);
    const pl = solid(grp); put(pl, prism(P, front, o, i, 0, PL));
    const body = mk("g", {}, grp);
    // the reading desk: a post and a plate tilted 30° towards the viewer, in front of the plinth
    const dx = e.cx + e.h * 0.95 + 3.5, dy = e.cy + e.h * 0.95 + 3.5, dz = m(0.75), w = 3.2, t = 2.1;
    const [po, pi] = rings(dx - 0.5, dy - 0.5, dx + 0.5, dy + 0.5, 0.4, 0.2);
    put(solid(grp), prism(P, front, po, pi, 0, dz));
    const desk = mk("path", { class: "sil", d: poly([P(dx - w * 0.7071 - t * 0.5, dy + w * 0.7071 - t * 0.5, dz + 1.8), P(dx + w * 0.7071 - t * 0.5, dy - w * 0.7071 - t * 0.5, dz + 1.8), P(dx + w * 0.7071 + t * 0.5, dy - w * 0.7071 + t * 0.5, dz), P(dx - w * 0.7071 + t * 0.5, dy + w * 0.7071 + t * 0.5, dz)]) }, grp);
    return { ...e, pl, body, desk, z: tween(0), drawn: NaN, els: null };
  });

  function draw(it, lift) {
    if (lift === it.drawn) return;
    it.drawn = lift;
    const { out, balls, after } = parts(P, front, it, PL + lift);
    if (!it.els) {
      it.els = out.map(([, cls]) => mk("path", { class: cls }, it.body));
      it.bl = balls.map(() => mk("ellipse", { class: "sil" }, it.body));
      it.af = after.map(([, cls]) => mk("path", { class: cls }, it.body));
    }
    out.forEach(([d], k) => it.els[k].setAttribute("d", d));
    balls.forEach(([x, y, r], k) => { const el = it.bl[k]; el.setAttribute("cx", x.toFixed(2)); el.setAttribute("cy", y.toFixed(2)); el.setAttribute("rx", r.toFixed(2)); el.setAttribute("ry", r.toFixed(2)); });
    after.forEach(([d], k) => it.af[k].setAttribute("d", d));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const it of items) { draw(it, tval(it.z, now)); if (!tdone(it.z, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  // hit test on each plinth's rest top, which never moves (rule 01)
  function hit([sx, sy]) {
    const [wx, wy] = unproj(C, sx, sy, PL);
    let best = -1, bd = 1.35;
    items.forEach((it, k) => { const d = Math.max(Math.abs(wx - it.cx), Math.abs(wy - it.cy)) / (it.h + 4); if (d < bd) { bd = d; best = k; } });
    return best;
  }

  let act = -2;
  const home = items.findIndex((it) => it.kind === "vostok");
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act >= 0 ? act : home;
    act = a;
    const f = items[from];
    items.forEach((it, k) => {
      const d = Math.hypot(it.cx - f.cx, it.cy - f.cy);
      const lift = a < 0 ? 0 : k === a ? LIFT : clamp(LIFT * 0.5 * (1 - d / 60), 0, LIFT);
      tset(it.z, lift, now, (d / 24) * stag);
      const on = a >= 0 ? k === a : k === home;
      it.pl.sil.classList.toggle("hi", on);
      it.desk.classList.toggle("hi", on);
      it.body.querySelectorAll(".sil").forEach((el) => el.classList.toggle("hi", on));
    });
    const yr = a >= 0 ? items[a].yr : -1;
    years.forEach((d, k) => d.setAttribute("class", 1957 + k === yr ? "dot m" : "dot off"));
    read.textContent = a < 0 ? "rest" : `${items[a].name} · ${items[a].yr}`;
    B.wake();
  }
  for (const it of items) draw(it, 0);
  setActive(-1);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), down: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { stag = v; }, destroy: bag.dispose };
}

hairline({
  name: "zal1d",
  means: "Первый зал: экспонат под пальцем поднимается, его табличка загорается, а на шкале лет отмечается год.",
  rules: [1, 2, 4, 6],
  range: [0, 40, 90],
  tour: [[140, 150], [215, 175], [270, 140], [250, 205], null],
  mount,
});
