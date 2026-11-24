/**
 * Proton: the first stage — a central oxidiser tank ringed by six outboard fuel tanks, each with its
 * engine — the lattice interstage, the second and third stages and the payload fairing.
 * The pointer's x separates the stages: they part along the axis and the lattice shows between.
 * Hit areas are the rest pose; the first stage's tanks are bright at rest.
 */
const {
  Cam, clamp, facing, fit, prism, put, rings, solid, hull, open, poly, proj, seg, spring, stepS, disposer, mk, pointer, register,
} = HL;

const R = 2.05, RT = 0.82, DT = R + 0.55, Z1 = 4.6, Z2 = 25, Z3 = 38, Z4 = 42.5, Z5 = 51;
const NAMES = ["1-я ступень", "2-я ступень", "3-я ступень", "обтекатель", "переходник"];
const ringZ = (P, x, y, r, z, n = 26) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x + r * Math.cos(t), y + r * Math.sin(t), z); });
const body = (P, st) => poly(hull(st.flatMap(([x, y, r, z]) => ringZ(P, x, y, r, z))));
const halfZ = (P, r, z) => open(ringZ(P, 0, 0, r, z, 36).filter((_, i) => i <= 18));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 4.3, C = Cam(45, 0.5, S);
  fit(C, [[-7, -7, 0], [7, 7, 0], [0, 0, Z5 + 24], [3, 3, Z5 + 22], [-3, -3, Z5 + 22]], 200, 160);
  const P = proj(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  // the museum's launch table under it
  const [ring, inner] = rings(-6.5, -6.5, 6.5, 6.5, 1.6, 1.1);
  put(solid(g), prism(P, facing(C), ring, inner, 0, 2.4));
  pth("nf lo", poly([[-3.4, -3.4], [3.4, -3.4], [3.4, 3.4], [-3.4, 3.4]].map(([x, y]) => P(x, y, 2.4))));
  // six outboard tanks, sorted far to near round the core
  const ang = [0, 1, 2, 3, 4, 5].map((k) => (k * Math.PI) / 3 + Math.PI / 6);
  const pos = ang.map((a) => [DT * Math.cos(a), DT * Math.sin(a)]).sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
  const tank = ([x, y]) => { pth("nf", body(P, [[x, y, 0.62, 2.4], [x, y, 0.4, Z1]]));
    return pth("sil", body(P, [[x, y, RT, Z1], [x, y, RT, Z2 - 1.6], [x * 0.9, y * 0.9, 0.35, Z2 + 0.4]])); };
  const st1 = [];
  pos.slice(0, 3).forEach((p) => st1.push(tank(p)));
  st1.push(pth("sil", body(P, [[0, 0, 1.5, Z1], [0, 0, R, Z1 + 3], [0, 0, R, Z2]])));
  pos.slice(3).forEach((p) => st1.push(tank(p)));
  pth("nf lo", halfZ(P, R, Z2 - 0.8));
  // the moving upper part
  const lat = pth("nf"), s2 = pth("sil"), c2 = pth("nf lo"), s3 = pth("sil"), c3 = pth("nf lo"), fr = pth("sil"), cf = pth("nf lo");
  let drawn = NaN;
  function draw(u) {
    const d2 = 7 * u, d3 = 12 * u, d4 = 16 * u;
    // the lattice between stage 1 and 2: struts round the near half, stretched by the gap
    const n = 10, a0 = Math.PI * 0.05, zl = Z2, zh = Z2 + 1.6 + d2, L = [];
    for (let k = 0; k <= n; k++) { const a = a0 + (k / n) * Math.PI * 0.9 - Math.PI / 4 + Math.PI / 4, b = a + Math.PI / n;
      L.push(seg(P(R * Math.cos(a), R * Math.sin(a), zl), P(R * Math.cos(b), R * Math.sin(b), zh))); }
    lat.setAttribute("d", L.join(""));
    s2.setAttribute("d", body(P, [[0, 0, R, zh], [0, 0, R, Z3 + d2]]));
    c2.setAttribute("d", halfZ(P, R, zh + 0.9) + halfZ(P, R, Z3 + d2 - 0.9));
    s3.setAttribute("d", body(P, [[0, 0, R * 0.98, Z3 + d3], [0, 0, R * 0.98, Z4 + d3]]));
    c3.setAttribute("d", halfZ(P, R * 0.98, Z4 + d3 - 1.2));
    fr.setAttribute("d", body(P, [[0, 0, R * 1.08, Z4 + d4], [0, 0, R * 1.08, Z5 + d4], [0, 0, 1.3, Z5 + 4 + d4], [0, 0, 0.35, Z5 + 6.8 + d4]]));
    cf.setAttribute("d", halfZ(P, R * 1.08, Z5 + d4) + seg(P(0, -R * 1.08, Z4 + d4 + 0.6), P(0, -R * 1.08, Z5 + d4)));
  }
  let cur = -2;
  function light(k) {
    cur = k;
    st1.forEach((e) => e.classList.toggle("hi", k === 0 || k < 0));
    s2.classList.toggle("hi", k === 1); s3.classList.toggle("hi", k === 2); fr.classList.toggle("hi", k === 3); lat.classList.toggle("hi", k === 4);
  }
  const U0 = 0.06, sp = spring(U0);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  const T = [[0, 0, 14, 4, 0], [0, 0, 31, 3, 1], [0, 0, 40.2, 2.2, 2], [0, 0, 47, 3, 3], [0, 0, Z2 + 1, 1.4, 4]];
  function hit([sx, sy]) { let best = -1, bd = 1e9;
    T.forEach(([x, y, z, r, n]) => { const p = P(x, y, z), d = Math.hypot(sx - p[0], sy - p[1]) / (r * S * 1.2); if (d < 1 && d < bd) { bd = d; best = n; } }); return best; }
  function move(p) {
    sp.t = clamp(U0 + ((p[0] - 80) / 240) * reach, U0, reach);
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
  name: "proton",
  means: "«Протон»: палец разделяет ступени — между первой и второй открывается решётчатый переходник.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[200, 230], [210, 120], [200, 60], null],
  mount,
});
