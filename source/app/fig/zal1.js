/**
 * Zal 1: the first hall of the Museum of Cosmonautics as a slab with seven
 * exhibits on rounded plinths: «Восток», ПС-1, the dogs' container, two suits,
 * «Венера-1» and «Луна-9». The pointer is projected onto the plinth tops and
 * picks the exhibit under it; it rises off its plinth and takes the bright
 * stroke, and the ones near it lift a little, staggered outwards by distance.
 * The slider is the stagger, in ms.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rings, rrect, ringAt, run, seg, unproj,
  tset, tval, tdone, tween, disposer, mk, pointer, put, register, solid, flatDot, place,
} = HL;

const U = 3, E = 2.3, PL = 1.6, LIFT = 13, SLAB = 3;
// [read-out, kind, centre x, centre y (metres, as in the museum plan), plinth size (m)]
const EX = [
  ["СК-1", "suit", -11, 17, 1.3], ["Беркут", "suit", 6, 17, 1.3], ["Восток", "vostok", -12.5, 25, 2.6],
  ["ПС-1", "sputnik", -2, 30, 1.6], ["Венера-1", "venera", 7, 28, 2.1], ["Контейнер", "cont", -13.7, 35.8, 3.2],
  ["Луна-9", "luna", 9.5, 37, 1.7],
].map(([name, kind, x, y, s]) => ({ name, kind, cx: x * U, cy: y * U, h: (s * U * E) / 2 }))
  .sort((a, b) => a.cx + a.cy - (b.cx + b.cy));
const X0 = -21 * U, X1 = 15.6 * U, Y0 = 9.8 * U, Y1 = 46 * U;
const m = (v) => v * U * E;

/** A horizontal rounded ring around (cx, cy), r = radius, as two rings for prism. */
const disc = (cx, cy, r, b) => [rrect(cx - r, cy - r, cx + r, cy + r, r, 14), rrect(cx - r + b, cy - r + b, cx + r - b, cy + r - b, r - b, 14)];

/** Exhibit parts at a given lift: each part is [d, class]; spheres are [cx, cy, r]. */
function parts(P, front, e, z) {
  const out = [], balls = [], { cx, cy } = e, rad = (r) => Math.hypot(...[0, 1].map((k) => P(cx + r * 0.7071, cy - r * 0.7071, 0)[k] - P(cx, cy, 0)[k]));
  const cyl = (r, z0, z1, b = 0.9) => { const [o, i] = disc(cx, cy, r, b); const p = prism(P, front, o, i, z0, z1); out.push([p.sil, "sil"], [p.crease, "nf"]); };
  const box = (w, d, z0, z1, dx = 0, dy = 0) => { const [o, i] = rings(cx + dx - w / 2, cy + dy - d / 2, cx + dx + w / 2, cy + dy + d / 2, Math.min(w, d) * 0.3, 0.8); const p = prism(P, front, o, i, z0, z1); out.push([p.sil, "sil"], [p.crease, "nf"]); };
  const ball = (r, zc, dx = 0, dy = 0) => { const c = P(cx + dx, cy + dy, zc); balls.push([c[0], c[1], rad(r)]); };
  if (e.kind === "vostok") { cyl(m(0.7), z, z + m(0.35)); ball(m(1.05), z + m(1.35)); }
  if (e.kind === "suit") { box(m(0.55), m(0.32), z, z + m(0.85)); box(m(0.75), m(0.42), z + m(0.85), z + m(1.55)); ball(m(0.26), z + m(1.8)); }
  if (e.kind === "venera") {
    cyl(m(0.45), z, z + m(1.4));
    for (const s of [-1, 1]) box(m(0.25), m(1.5), z + m(0.8), z + m(0.85), 0, s * m(1.15));
    cyl(m(0.3), z + m(1.4), z + m(1.55));
  }
  if (e.kind === "sputnik") {
    cyl(m(0.07), z, z + m(0.9), 0.3);
    const c = [cx, cy, z + m(1.15)], ant = [[-1, -0.35], [-1, 0.35], [-0.8, -0.6], [-0.8, 0.6]];
    out.push([ant.map(([dx, dy]) => seg(P(...c), P(cx + dx * m(1.4), cy + dy * m(1.4), c[2] - m(0.55)))).join(""), "nf"]);
    ball(m(0.32), c[2]);
  }
  if (e.kind === "luna") {
    const petal = (a) => [[0, 0], [0.28, 0.2], [0.75, 0], [0.28, -0.2]].map(([u, v]) => P(cx + m(u * Math.cos(a) - v * Math.sin(a)), cy + m(u * Math.sin(a) + v * Math.cos(a)), z + 0.4));
    for (let k = 0; k < 4; k++) out.push([poly(petal(Math.PI / 4 + (k * Math.PI) / 2)), "nf"]);
    ball(m(0.32), z + m(0.32));
    out.push([seg(P(cx, cy, z + m(0.6)), P(cx - m(0.15), cy - m(0.15), z + m(1.1))), "nf"]);
  }
  if (e.kind === "cont") {
    // a horizontal cylinder: the hull of its two end circles, then the near end as its crease
    const r = m(0.42), L = m(0.95), zc = z + m(0.55), end = (x) => Array.from({ length: 24 }, (_, k) => P(cx + x, cy + r * Math.cos((k / 24) * 6.283), zc + r * Math.sin((k / 24) * 6.283)));
    box(m(1.3), m(0.7), z, z + m(0.16));
    out.push([poly(hull(end(-L).concat(end(L)))), "sil"], [poly(end(L - 1.2)), "nf"]);
  }
  return { out, balls };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;
  const C = Cam(45, 0.5, 2.05);
  fit(C, [[X0, Y0, -SLAB], [X1, Y1, -SLAB], [X1, Y0, -SLAB], [X0, Y1, -SLAB], [X0, Y0, m(3)], [X1, Y0, m(3)]], 200, 172);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [fr, fi] = rings(X0, Y0, X1, Y1, 14, 2.2);
  put(solid(g), prism(P, front, fr, fi, -SLAB, 0));
  // the entrance: a dot at the near wall
  const door = flatDot(g, C, 1.6, "dot m");
  place(door, P(-3 * U, Y0 + 4, 0));

  const items = EX.map((e) => {
    const grp = mk("g", {}, g);
    const [o, i] = rings(e.cx - e.h, e.cy - e.h, e.cx + e.h, e.cy + e.h, e.h * 0.55, 1.1);
    const pl = solid(grp); put(pl, prism(P, front, o, i, 0, PL));
    const body = mk("g", {}, grp);
    return { ...e, pl, body, z: tween(0), drawn: NaN, els: null };
  });

  function draw(it, lift) {
    if (lift === it.drawn) return;
    it.drawn = lift;
    const { out, balls } = parts(P, front, it, PL + lift);
    if (!it.els) {
      it.els = out.map(([, cls]) => mk("path", { class: cls }, it.body));
      it.bl = balls.map(() => mk("ellipse", { class: "sil" }, it.body));
    }
    out.forEach(([d], k) => it.els[k].setAttribute("d", d));
    balls.forEach(([x, y, r], k) => { const el = it.bl[k]; el.setAttribute("cx", x.toFixed(2)); el.setAttribute("cy", y.toFixed(2)); el.setAttribute("rx", r.toFixed(2)); el.setAttribute("ry", r.toFixed(2)); });
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const it of items) { draw(it, tval(it.z, now)); if (!tdone(it.z, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  // hit test on the plinth tops at rest, which never move (rule 01)
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
      it.body.querySelectorAll(".sil").forEach((el) => el.classList.toggle("hi", on));
    });
    read.textContent = a < 0 ? "rest" : items[a].name;
    B.wake();
  }
  for (const it of items) draw(it, 0);
  setActive(-1);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), down: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { stag = v; }, destroy: bag.dispose };
}

hairline({
  name: "zal1",
  means: "Первый зал музея: экспонат под пальцем поднимается со своего постамента, соседи откликаются по очереди.",
  rules: [1, 2, 5, 10],
  range: [0, 40, 90],
  tour: [[140, 150], [215, 175], [270, 140], null],
  mount,
});
