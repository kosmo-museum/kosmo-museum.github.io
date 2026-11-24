/**
 * Luna 9: the first craft to land softly on the Moon, on a round plinth. A
 * ball of four petals around a small station; the pointer's x opens the
 * petals on a spring, as they opened on the surface on 3 February 1966, and
 * the station shows its camera turret and four whip antennas. The petal
 * nearest the pointer, read on the ground plane, takes the bright stroke.
 * The slider is how far the petals can open, in degrees.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, proj, ringAt, run, circ, rrect, prism, seg, unproj,
  spring, stepS, disposer, mk, pointer, put, register, solid, flatDot, place, rad,
} = HL;

const R = 30, PL = 3, TH = rad(24), GAP = rad(3), PR = 2.45 * R;
const ZC = PL + R * Math.cos(TH) + 0.5;
const NAMES = ["лепесток 1", "лепесток 2", "лепесток 3", "лепесток 4"];

/** Rodrigues: v rotated by a about unit axis k. */
const rot = (v, k, a) => {
  const c = Math.cos(a), s = Math.sin(a), d = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  const x = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
  return [0, 1, 2].map((i) => v[i] * c + x[i] * s + k[i] * d * (1 - c));
};

/** Petal at azimuth phi, opened by a: its outline and its middle rib, as world points. */
function petal(phi, a) {
  const sp = (th, ps) => [R * Math.sin(th) * Math.cos(ps), R * Math.sin(th) * Math.sin(ps), ZC - R * Math.cos(th)];
  const H = sp(TH, phi), k = [-Math.sin(phi), Math.cos(phi), 0];
  const turn = (p) => { const v = rot([p[0] - H[0], p[1] - H[1], p[2] - H[2]], k, a); return [H[0] + v[0], H[1] + v[1], Math.max(PL, H[2] + v[2])]; };
  const p0 = phi - Math.PI / 4 + GAP, p1 = phi + Math.PI / 4 - GAP, n = 10, line = [];
  for (let i = 0; i <= n; i++) line.push(sp(TH + ((Math.PI - TH) * i) / n, p0));
  for (let i = n; i >= 0; i--) line.push(sp(TH + ((Math.PI - TH) * i) / n, p1));
  for (let i = 1; i < 6; i++) line.push(sp(TH, p1 - ((p1 - p0) * i) / 6));
  const rib = [];
  for (let i = 0; i <= n; i++) rib.push(sp(TH + ((Math.PI - 0.15 - TH) * i) / n, phi));
  return { line: line.map(turn), rib: rib.map(turn) };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let amax = rad(value);
  const C = Cam(45, 0.5, 2.35);
  fit(C, [[-PR, -PR, 0], [PR, PR, 0], [PR, -PR, 0], [-PR, PR, 0], [0, 0, ZC + R + 2]], 200, 170);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const disc = (r) => rrect(-r, -r, r, r, r, 14);
  put(solid(g), prism(P, front, disc(PR), disc(PR - 2.2), 0, PL));

  // paint order: the two far petals, the station, the two near ones (azimuths 0 and 90 face the camera)
  const PH = [Math.PI, 1.5 * Math.PI, 0, 0.5 * Math.PI];
  const mkPetal = () => { const grp = mk("g", {}, g); return { sil: mk("path", { class: "sil" }, grp), rib: mk("path", { class: "nf lo" }, grp) }; };
  const pet = [mkPetal(), mkPetal()];
  const st = mk("g", {}, g);
  const body = solid(st), ants = mk("path", { class: "nf" }, st), turret = solid(st);
  const lens = flatDot(st, C, 1.25, "dot");
  pet.push(mkPetal(), mkPetal());

  const opn = spring(0.55 * amax);
  let drawn = NaN, pick = -1;
  const zb = ZC - R * Math.cos(TH) + 1;
  const lathe = (prof, z0) => { const pts = []; for (const [r, z] of prof) pts.push(...ringAt(P, circ(r, 28), z0 + z)); const [r, z] = prof[1]; return { sil: poly(hull(pts)), crease: open(ringAt(P, run(circ(r - 0.7, 28), front), z0 + z)) }; };

  function draw() {
    if (opn.x === drawn) return;
    drawn = opn.x;
    const f = amax > 0 ? clamp(opn.x / rad(100), 0, 1) : 0;
    PH.forEach((phi, i) => {
      const q = petal(phi, opn.x);
      pet[i].sil.setAttribute("d", poly(q.line.map((p) => P(...p))));
      pet[i].rib.setAttribute("d", open(q.rib.map((p) => P(...p))));
    });
    // the station: a squat body, the camera turret, and four antennas that swing up as the petals open
    put(body, lathe([[0.46 * R, 0], [0.55 * R, 0.32 * R], [0.3 * R, 0.62 * R]], zb));
    const tz = zb + 0.62 * R;
    put(turret, prism(P, front, disc(0.15 * R), disc(0.15 * R - 0.6), tz, tz + 0.42 * R));
    const e = rad(8 + 34 * f);
    ants.setAttribute("d", [0, 1, 2, 3].map((k) => {
      const a = Math.PI / 4 + (k * Math.PI) / 2, r0 = 0.3 * R, L = 1.25 * R;
      const b = [Math.cos(a) * r0, Math.sin(a) * r0, tz - 2];
      return seg(P(...b), P(b[0] + Math.cos(a) * Math.cos(e) * L, b[1] + Math.sin(a) * Math.cos(e) * L, b[2] + Math.sin(e) * L));
    }).join(""));
    place(lens, P(0.15 * R * 0.7, 0.15 * R * 0.7, tz + 0.3 * R));
  }

  function light(a) {
    pet.forEach((p, i) => p.sil.classList.toggle("hi", i === a));
    lens.setAttribute("class", a < 0 ? "dot" : "dot m");
  }

  const B = register(stage, (dt) => { const m = stepS(opn, dt); draw(); return m; });
  bag.add(B.unregister);

  // the petal is chosen on the ground plane, which never moves (rule 01): by the pointer's bearing from the centre
  function hit([sx, sy]) {
    const [wx, wy] = unproj(C, sx, sy, PL);
    if (Math.hypot(wx, wy) > PR + 6) return -1;
    const b = Math.atan2(wy, wx);
    let best = 0, bd = 9;
    PH.forEach((phi, i) => { const d = Math.abs(Math.atan2(Math.sin(b - phi), Math.cos(b - phi))); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  function move(p) {
    opn.t = clamp((p[0] - 110) / 180, 0, 1) * amax;
    const a = hit(p);
    if (a !== pick) { pick = a; light(a); read.textContent = a < 0 ? "rest" : NAMES[PH.length - 1 - a]; }
    B.wake();
  }
  function leave() { opn.t = 0.55 * amax; pick = -1; light(-1); read.textContent = "rest"; B.wake(); }

  draw(); light(-1); read.textContent = "rest";
  bag.add(pointer(stage, { move, down: move, leave }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { amax = rad(v); opn.t = Math.min(opn.t, amax); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "luna9",
  means: "«Луна-9» на постаменте: палец раскрывает четыре лепестка, как на Луне 3 февраля 1966 года, и станция поднимает антенны.",
  rules: [1, 3, 5, 6],
  range: [60, 85, 105],
  tour: [[120, 150], [230, 210], [300, 170], null],
  mount,
});
