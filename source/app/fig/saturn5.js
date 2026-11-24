/**
 * Saturn V: the first stage S-IC with its five F-1 bells and four fins, the S-II, the conical
 * adapter, the S-IVB, the instrument ring, the lunar-module adapter, Apollo's command and service
 * modules and the escape tower. The pointer's x separates the stages along the axis.
 * Hit areas are the rest pose; the first stage is bright at rest.
 */
const {
  Cam, clamp, facing, fit, prism, put, rings, solid, hull, open, poly, proj, seg, spring, stepS, disposer, mk, pointer, register,
} = HL;

const R = 5, R3 = 3.3, Z1 = 6, Z2 = 48, Z3 = 73, Z4 = 78, Z5 = 96, Z6 = 104;
const NAMES = ["S-IC", "S-II", "S-IVB", "Аполлон", "САС", "двигатели F-1"];
const ringZ = (P, x, y, r, z, n = 28) => Array.from({ length: n }, (_, k) => { const t = (k / n) * 2 * Math.PI; return P(x + r * Math.cos(t), y + r * Math.sin(t), z); });
const body = (P, st) => poly(hull(st.flatMap(([x, y, r, z]) => ringZ(P, x, y, r, z))));
const halfZ = (P, r, z) => open(ringZ(P, 0, 0, r, z, 36).filter((_, i) => i <= 18));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;
  const S = 2.35, C = Cam(45, 0.5, S);
  fit(C, [[-9, -9, 0], [9, 9, 0], [0, 0, Z6 + 34]], 200, 160);
  const P = proj(C);
  const g = mk("g", {}, svg);
  const pth = (cls, d = "") => mk("path", { class: cls, d }, g);
  const [ring, inner] = rings(-8.5, -8.5, 8.5, 8.5, 2, 1.4);
  put(solid(g), prism(P, facing(C), ring, inner, 0, 2.6));
  // five F-1 bells: four round, one centre; and four fins, far ones first
  const bells = pth("sil", [[-2.4, -2.4], [2.4, -2.4], [0, 0], [-2.4, 2.4], [2.4, 2.4]].map(([x, y]) => body(P, [[x, y, 1.8, 2.6], [x, y, 0.9, Z1]])).join(""));
  const fin = (a) => { const c = Math.cos(a), s = Math.sin(a), at = (r, z) => P(c * r, s * r, z); return poly([at(R - 0.2, Z1), at(R + 3.2, 2.8), at(R + 3.2, Z1 + 1.6), at(R - 0.2, Z1 + 9)]); };
  pth("sil", [Math.PI * 1.25, Math.PI * 0.75, Math.PI * 1.75].map(fin).join(""));
  const st1 = pth("sil", body(P, [[0, 0, R * 0.92, Z1], [0, 0, R, Z1 + 3], [0, 0, R, Z2]]));
  pth("nf lo", halfZ(P, R, Z1 + 3) + halfZ(P, R, 22) + halfZ(P, R, Z2 - 4));
  pth("sil", fin(Math.PI * 0.25));
  const s2 = pth("sil"), c2 = pth("nf lo"), s3 = pth("sil"), c3 = pth("nf lo"), ap = pth("sil"), ca = pth("nf lo"), les = pth("sil");
  let drawn = NaN;
  function draw(u) {
    const d2 = 7 * u, d3 = 13 * u, d4 = 18 * u, d5 = 26 * u;
    s2.setAttribute("d", body(P, [[0, 0, R, Z2 + d2], [0, 0, R, Z3 + d2]]));
    c2.setAttribute("d", halfZ(P, R, Z2 + 3 + d2) + halfZ(P, R, Z3 - 3 + d2));
    s3.setAttribute("d", body(P, [[0, 0, R * 0.98, Z3 + d3], [0, 0, R3, Z4 + d3], [0, 0, R3, Z5 - 6 + d3]]));
    c3.setAttribute("d", halfZ(P, R3, Z4 + d3) + halfZ(P, R3, Z5 - 7.4 + d3));
    ap.setAttribute("d", body(P, [[0, 0, R3, Z5 - 6 + d4], [0, 0, 2, Z5 + d4], [0, 0, 2, Z6 - 3 + d4], [0, 0, 0.5, Z6 + d4]]));
    ca.setAttribute("d", halfZ(P, R3, Z5 - 5 + d4) + halfZ(P, 2, Z5 + d4) + halfZ(P, 2, Z6 - 3 + d4));
    les.setAttribute("d", body(P, [[0, 0, 0.55, Z6 + d5], [0, 0, 0.3, Z6 + 7 + d5], [0, 0, 0.12, Z6 + 9 + d5]]));
  }
  let cur = -2;
  function light(k) {
    cur = k;
    st1.classList.toggle("hi", k === 0 || k < 0);
    s2.classList.toggle("hi", k === 1); s3.classList.toggle("hi", k === 2); ap.classList.toggle("hi", k === 3); les.classList.toggle("hi", k === 4); bells.classList.toggle("hi", k === 5);
  }
  const U0 = 0.05, sp = spring(U0);
  const B = register(stage, (dt) => { const m = stepS(sp, dt); if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); } return m; });
  bag.add(B.unregister);
  const T = [[0, 0, 28, 7, 0], [0, 0, 60, 6, 1], [0, 0, 84, 4, 2], [0, 0, 99, 3, 3], [0, 0, Z6 + 5, 2.4, 4], [0, 0, 3.5, 4, 5]];
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
  name: "saturn5",
  means: "«Сатурн-5»: палец разделяет ступени — S-IC, S-II, S-IVB и «Аполлон» расходятся по оси.",
  rules: [1, 3, 4, 5, 6],
  range: [0.7, 0.85, 1],
  tour: [[200, 230], [210, 120], [200, 60], null],
  mount,
});
