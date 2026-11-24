/* Схема зала «Утро космической эры» в стиле Hairline: упрощённая, но по плану — проход от входа к памятнику Гагарину, экспонаты двумя рядами по сторонам,
   круглые постаменты со световым кольцом. Расстояния условные, порядок и стороны — как в зале. Клик — наезд на экспонат, повторный клик или «весь зал» — назад. */
window.mountHallPlan = () => {
const { Cam, clamp, facing, fit, hull, open, poly, prism, proj, rings, rrect, seg, unproj, tset, tval, tdone, tween, mk, pointer, register, flatDot, place, spring, stepS } = HL;
const AX = 2.2;   // ось прохода (x плана, м)
// продолжение маршрута нижнего этажа после «Луны»: «Сотрудничество», «Человечеству» (туда и обратно), парк, лестница наверх
const LOWER_EXT = [[-9.9,  -67.6],  [11.6,  -67.6],  [13.6,  -70.3],  [26.6,  -70.3],  [16.8,  -70.3],  [15.6,  -68.2],  [14.62,  -66.5],  [18.86,  -42.4],  [21.2,  -39.8],  [25.6,  -39.8],  [25.6,  -36.3]];
const SCHEME = {
  // залы: контуры из 3D-карты, проёмы — по рёбрам контура (t вдоль ребра)
  halls:[
    { id:'utro', name:'Зал «Утро космической эры»', floor:'upper', zoom:1, poly:[[14.57, -15.37], [15.57, -9.91], [14.86, 15.37], [-15.57, 15.37], [-10.16, -15.37]], doors:[{ edge:2, t0:.36, t1:.49 }, { edge:0, t0:.69, t1:.95 }] },
    { id:'tvortsy', name:'Зал «Творцы»', floor:'upper', zoom:1.9, poly:[[13.62, -24.82], [23.94, -24.82], [23.94, -9.91], [16.25, -9.91]], doors:[{ edge:3, t0:0, t1:.12 }, { edge:0, t0:.25, t1:.4 }] },
    // U-образный зал: вход из «Творцов» в правое крыло, «Мир» у дальнего торца, выход по левому крылу к лестнице вниз
    { id:'dom', name:'Зал «Космический дом на орбите»', floor:'upper', zoom:.78, mid:[2.2, -44.6], poly:[[13.29, -63.7], [19.97, -25.49], [13.51, -25.49], [7.81, -57.82], [-3.35, -57.82], [-9.05, -25.49], [-15.61, -25.49], [-12.86, -41.02], [-11.79, -47.05], [-8.84, -63.7]], doors:[{ edge:1, t0:.3, t1:.6 }, { edge:7, t0:.12, t1:.9 }] }
    ,
    // вход и удобства: вестибюль под «Утром» и крыло с кафе за «Домом на орбите» (места удобств условные — сверить с музеем)
    { id:'vest', name:'Вестибюль · вход', floor:'upper', zoom:1.35, mid:[2.3, 25.7], poly:[[15.7, 19.97], [17.72, 31.28], [5.58, 31.4], [-0.93, 31.4], [-13.16, 31.28], [-11.18, 19.97]], doors:[{ edge:5, t0:.41, t1:.58 }, { edge:2, t0:.15, t1:.85 }] },
    { id:'cafe', name:'Кафе и конференц-зал', floor:'upper', zoom:1.5, mid:[16.9, -75.1], poly:[[5.6, -78.3], [5.7, -71.8], [28.2, -71.8], [27.7, -78.3]], doors:[{ edge:1, t0:.45, t1:.6 }] },
    // нижний этаж: две комнаты и площадка лестницы между ними; лестница спускается с «Дома на орбите» на запад
    { id:'luna', name:'Зал «Луна и планеты»', floor:'lower', zoom:1.45, mid:[-17.4, -51.5], poly:[[-26.3, -34.07], [-14.76, -34.08], [-13.54, -41.02], [-11.9, -41.02], [-12.14, -48.92], [-8.62, -68.86], [-19.38, -68.86], [-19.38, -58], [-15.04, -57.75], [-16.59, -48.92], [-18.2, -48.92], [-18.2, -41.02], [-25.8, -41.01]], doors:[{ edge:4, t0:.78, t1:1 }] },
    { id:'mezhdu', name:'Зал «Международное сотрудничество»', floor:'lower', zoom:1.0, mid:[2.2, -67.8], poly:[[11.9, -71.3], [13.1, -64.4], [-8.8, -64.4], [-7.5, -71.3]], doors:[{ edge:0, t0:0, t1:1 }, { edge:2, t0:.05, t1:.95 }] },
    { id:'chelovechestvu', name:'Зал «Космонавтика — человечеству»', floor:'lower', zoom:1.25, mid:[20.7, -67.9], poly:[[28.2, -71.3], [28.7, -64.4], [19.0, -64.4], [18.2, -69.4], [12.9, -69.5], [12.7, -71.3]], doors:[{ edge:3, t0:0, t1:1 }, { edge:4, t0:0, t1:1 }] },
    { id:'park', name:'Международный космический парк', floor:'lower', zoom:.85, mid:[21.9, -51.5], poly:[[17.5, -68.9], [22.4, -41.3], [30.4, -41.2], [30.9, -34.2], [28.6, -34.2], [22.6, -34.2], [19.1, -34.2], [13.0, -68.9]], doors:[{ edge:4, t0:0, t1:1 }, { edge:6, t0:.86, t1:1 }, { edge:7, t0:0, t1:1 }] }
  ],
  // дорожки залов, где маршрут не прямой: ось маршрута (план, м) — по ней полоса, шевроны и ответвления к табличкам
  routes:{ dom:[[17, -24.9], [15.44, -27.6], [9.63, -58.6], [-5.17, -58.6], [-7.75, -44], [-12.9, -44]],
    // «Луна»: от лестницы в северную комнату и обратно, потом в южную; полоса рисуется двумя ветками
    luna:[[-17.4, -45.2], [-17.4, -39.7], [-24.2, -39.7], [-17.4, -39.7], [-15.6, -45.2], [-14.9, -49.5], [-14.4, -57], [-14.2, -64.6]].concat(LOWER_EXT), mezhdu:LOWER_EXT, chelovechestvu:LOWER_EXT, park:LOWER_EXT, vest:[[AX, 31.4], [AX, 19.9]], cafe:[[16.9, -71.9], [16.9, -76.5]] },
  strips:{ luna:[[[-17.4, -45.2], [-17.4, -39.7], [-24.2, -39.7]], [[-16.4, -45.4], [-14.9, -49.5], [-14.4, -57], [-14.2, -64.6]].concat(LOWER_EXT.slice(0, 4)), [[16.8, -70.3]].concat(LOWER_EXT.slice(5))], mezhdu:[], chelovechestvu:[], park:[], vest:[], cafe:[] },
  // витрины с мелкими предметами (места — из 3D-карты): тихие короба вдоль стен, не кликаются
  cases:[{ floor:'upper', r:[-11.3, -42.8, -9.6, -35.2] }, { floor:'lower', r:[-17.6, -67.9, -10.9, -66.9] }],
  stairs:{ dom:[-12.9, -44], luna:[-12.9, -44.9], park:[28.6, -35.6] },
  // проход одним контуром: вход → вдоль зала → поворот к двери → вниз по «Творцам» к выходу; островок вокруг ПС-1
  path:[[AX - 1.8, 15.37], [AX - 1.8, -11.7], [16.2, -11.7], [16.2, -24.82], [17.8, -24.82], [17.8, -10.1], [AX + 1.8, -10.1], [AX + 1.8, 15.37]],
  island:{ at:[AX, 3.6], r:2.1 },
  chev:[[AX, 12.6, 0, -1], [AX, 8.0, 0, -1], [AX, -0.9, 0, -1], [AX, -5.6, 0, -1], [6.4, -10.9, 1, 0], [11.0, -10.9, 1, 0], [17.0, -14.6, 0, -1], [17.0, -18.6, 0, -1], [17.0, -22.4, 0, -1], [AX, 17.0, 0, -1], [AX, 18.0, 0, -1], [17.0, -26.2, 0, -1], [17.0, -27.2, 0, -1]],
  at:{ a_in:[2.2, 30.2], a_kassa:[-8.6, 22.8], a_gard:[-8.6, 28.6], a_shop:[12.2, 22.8], a_wc:[14.6, 28.4], a_lift:[6.2, 29.4], a_cafe:[20.1, -75.1], a_wc2:[10.4, -74.6],
    31:[16.37, -66.8], 38:[17.32, -62.6], 900:[18.06, -58.4], 33:[18.74, -54.6], 41:[19.4, -50.9], 32:[19.95, -47.8], 37:[20.39, -45.3], 34:[20.87, -42.6], 35:[21.3, -37.2], 20:[28.4, -38.6], 30:[-6.0, -65.7], 26:[1.4, -65.9], 29:[8.8, -65.9], 25:[-3.4, -69.6], 27:[4.8, -69.6], 56:[23.7, -67.0],
    47:[-15.6, -36.8], 22:[-18.9, -36.5], 21:[-22.6, -36.5], 114:[-25.7, -38.6], 23:[-11.8, -59.8], 15:[-16.6, -62.6],
    44:[17.45, -30.6], 49:[15.95, -39.5], 19:[14.4, -48.3], 36:[1.6, -61.4], 45:[-9.55, -50.5], g:[AX, -13.2], 11:[-6.2, 9.4], 24:[10.4, 9.4], 10:[AX, 3.6], 12:[-6.2, -1.6], 16:[10.4, -1.6], 13:[-6.2, -7.0], 14:[10.4, -7.0], 50:[21.3, -14.8], 17:[21.2, -21.0] },
  hallOf:{ 50:'tvortsy', 17:'tvortsy', 44:'dom', 49:'dom', 19:'dom', 36:'dom', 45:'dom', 47:'luna', 22:'luna', 21:'luna', 114:'luna', 23:'luna', 15:'luna', a_in:'vest', a_kassa:'vest', a_gard:'vest', a_shop:'vest', a_wc:'vest', a_lift:'vest', a_cafe:'cafe', a_wc2:'cafe', 31:'park', 38:'park', 900:'park', 33:'park', 41:'park', 32:'park', 37:'park', 34:'park', 35:'park', 20:'park', 30:'mezhdu', 26:'mezhdu', 29:'mezhdu', 25:'mezhdu', 27:'mezhdu', 56:'chelovechestvu' }
};
const WS = 6.9, m = (v) => v * WS, PLH = m(.32), LIFT = 4;
const disc = (cx, cy, r, b) => [rrect(cx - r, cy - r, cx + r, cy + r, r, 14), rrect(cx - r + b, cy - r + b, cx + r - b, cy + r - b, r - b, 14)];
// [id, read-out, kind, plinth size м, год]
const EXD = [[10, 'ПС-1', 'sputnik', 1.8, 1957], [11, 'Контейнер', 'cont', 2.6, 1960], [12, 'Восток', 'vostok', 3.6, 1961], [13, 'СК-1', 'suit', 1.4, 1961], [14, 'Беркут', 'suit', 1.4, 1965], [16, 'Венера-1', 'venera', 1.9, 1961], [24, 'Луна-9', 'luna', 2.4, 1966], ['g', 'Памятник Гагарину', 'gagarin', 2.8, 0], [50, 'Веранда Циолковского', 'veranda', 3.8, 0], [17, 'ГИРД-09', 'gird', 3.0, 1933],
  [44, 'Союз-4 и Союз-5', 'ship', 2.3, 1969], [49, 'Ястреб', 'suit', 1.3, 1969], [19, 'Орлан-Д', 'suit', 1.3, 1977], [36, 'Мир', 'ship', 2.9, 1986], [45, 'Шлюзовой отсек', 'ship', 2.4, 1989],
  [47, 'Кречет', 'suit', 1.2, 0], [22, 'Луноход-1', 'ship', 2.0, 1970], [21, 'Луна-16', 'ship', 2.0, 1970], [114, 'Картина «Впервые на Луне»', 'paint', 1.4, 1972], [23, 'Венера-4', 'ship', 1.9, 1967], [15, 'Марс-3', 'ship', 2.4, 1971],
  ['a_in', 'Вход', 'amen', .8, 0], ['a_kassa', 'Кассы', 'amen', .8, 0], ['a_gard', 'Гардероб', 'amen', .8, 0], ['a_shop', 'Сувенирный магазин', 'amen', .8, 0], ['a_wc', 'Туалеты', 'amen', .8, 0], ['a_lift', 'Лифт', 'amen', .8, 0], ['a_cafe', 'Кафе', 'amen', .8, 0], ['a_wc2', 'Туалеты', 'amen', .8, 0],
  [25, 'АПАС', 'apas', 1.4, 1975], [26, 'Союз — Аполлон', 'asts', 2.4, 1975], [27, 'Союз-37', 'capsule', 1.4, 1980], [29, 'МКС', 'iss', 2.2, 1998], [30, 'КОСПАС-САРСАТ', 'sat', 1.4, 1982], [56, 'Глонасс-М', 'sat', 1.8, 2003], [31, 'Байконур, «Союз»', 'baikonur', 1.9, 1957], [38, 'Спейс шаттл', 'shuttle', 1.5, 1981], [900, 'Сатурн-5', 'saturn', 1.3, 1967], [33, 'Протон', 'proton', 1.4, 1965], [41, 'Великий поход-2F', 'cz2f', 1.3, 1999], [32, 'РД-107', 'engine', 1.1, 1957], [37, 'Эксплорер-1', 'explorer', 1.0, 1958], [34, 'Морской старт', 'seastart', 1.6, 1999], [35, 'Энергия — Буран', 'buran', 1.9, 1988], [20, 'Союз', 'soyuz', 1.9, 1967]];
// ближайшая точка ломаной маршрута зала (план): для ответвлений к табличкам и стороны пюпитра
const nearOn = (line, p) => { let best = null, bd = 1e9; for (let i = 0; i < line.length - 1; i++){ const a = line[i], b = line[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy), 0, 1), q = [a[0] + dx * t, a[1] + dy * t], d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < bd){ bd = d; best = q; } } return best; };
// полоса вдоль ломаной: смещения на ±w по нормалям, углы — по биссектрисе
const strip = (line, w) => { const L = [], Rr = []; line.forEach((p, i) => { const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)], n1 = i > 0 ? nrm2([-(p[1] - a[1]), p[0] - a[0]]) : null, n2 = i < line.length - 1 ? nrm2([-(b[1] - p[1]), b[0] - p[0]]) : null;
  let n = n1 && n2 ? nrm2([n1[0] + n2[0], n1[1] + n2[1]]) : (n1 || n2); const k = n1 && n2 ? 1 / Math.max(.5, n[0] * n1[0] + n[1] * n1[1]) : 1; L.push([p[0] + n[0] * w * k, p[1] + n[1] * w * k]); Rr.push([p[0] - n[0] * w * k, p[1] - n[1] * w * k]); }); return L.concat(Rr.reverse()); };
// ось маршрута по этажу (план, м): от входа по «Утру» к двери «Творцов», по «Творцам» к «Дому на орбите» и по его залу к лестнице вниз
const WALK = { lower:[[-17.4, -45.2], [-17.4, -39.7], [-24.2, -39.7], [-17.4, -39.7], [-15.6, -45.2], [-14.9, -49.5], [-14.4, -57], [-14.2, -64.6]].concat(LOWER_EXT), upper:[[AX, 29.6], [AX, 17.5], [AX, 6.6], [AX + 2.6, 5.4], [AX + 2.6, 1.8], [AX, 0.6], [AX, -10.9], [17, -10.9], [17, -24.9]].concat(SCHEME.routes.dom.slice(1)) };
const walkLen = (W) => { const out = [0]; for (let i = 1; i < W.length; i++) out.push(out[i - 1] + Math.hypot(W[i][0] - W[i - 1][0], W[i][1] - W[i - 1][1])); return out; };
const walkS = (W, p) => { const A = walkLen(W); let best = 0, bd = 1e9; for (let i = 0; i < W.length - 1; i++){ const a = W[i], b = W[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy, t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2, 0, 1), d = Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t); if (d < bd){ bd = d; best = A[i] + t * Math.sqrt(l2); } } return best; };
const walkAt = (W, s) => { const A = walkLen(W); for (let i = 0; i < W.length - 1; i++) if (s <= A[i + 1] || i === W.length - 2){ const t = clamp((s - A[i]) / (A[i + 1] - A[i]), 0, 1); return [W[i][0] + (W[i + 1][0] - W[i][0]) * t, W[i][1] + (W[i + 1][1] - W[i][1]) * t]; } return W[W.length - 1]; };
const walkSub = (W, s0, s1) => { const A = walkLen(W), lo = Math.min(s0, s1), hi = Math.max(s0, s1), pts = [walkAt(W, lo)]; A.forEach((a, i) => { if (a > lo && a < hi) pts.push(W[i]); }); pts.push(walkAt(W, hi)); return s0 <= s1 ? pts : pts.reverse(); };
const nrm2 = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
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
  if (e.kind === "gagarin") {
    // как в зале: витраж, за спиной сфера-глобус, перед ней кольцо с фигурами-рельефами, Гагарин с вскинутыми руками; смотрит к входу (+x)
    const Z = (v) => z + m(v), V = [0.612, 0.612, 0.5];
    const vx = cx - m(2.3);
    out.push([poly([P(vx, cy - m(3.1), z), P(vx, cy + m(3.1), z), P(vx, cy + m(3.1), Z(4.8)), P(vx, cy - m(3.1), Z(4.8))]), "lo"]);
    out.push([[1, 2, 3, 4, 5].map(k => seg(P(vx, cy - m(3.1) + m(1.033) * k, z), P(vx, cy - m(3.1) + m(1.033) * k, Z(4.8)))).join("") + [1.2, 2.4, 3.6].map(h => seg(P(vx, cy - m(3.1), Z(h)), P(vx, cy + m(3.1), Z(h)))).join(""), "nf lo"]);
    // сфера: силуэт — круг на экране, сетка меридианов и параллелей только на видимой половине
    const sx = cx - m(0.85), sz = 2.35, SR = 1.55, sc = P(sx, cy, Z(sz)), sr = rad(m(SR));
    out.push([poly(Array.from({ length: 48 }, (_, k) => [sc[0] + sr * Math.cos(k / 48 * 6.283), sc[1] + sr * Math.sin(k / 48 * 6.283)])), "sil"]);
    const S3 = (u) => P(sx + m(SR) * u[0], cy + m(SR) * u[1], Z(sz) + m(SR) * u[2]);
    const vis = (pts) => { let d = "", run = []; for (const u of pts){ if (u[0] * V[0] + u[1] * V[1] + u[2] * V[2] > 0.02) run.push(S3(u)); else { if (run.length > 1) d += open(run); run = []; } } if (run.length > 1) d += open(run); return d; };
    let grid = "";
    for (let k = 0; k < 8; k++){ const f = k / 8 * 3.1416; grid += vis(Array.from({ length: 49 }, (_, j) => { const t = j / 48 * 6.283; return [Math.cos(f) * Math.cos(t), Math.sin(f) * Math.cos(t), Math.sin(t)]; })); }
    for (const la of [-0.9, -0.45, 0, 0.45, 0.9]) grid += vis(Array.from({ length: 49 }, (_, j) => { const t = j / 48 * 6.283; return [Math.cos(la) * Math.cos(t), Math.cos(la) * Math.sin(t), Math.sin(la)]; }));
    out.push([grid, "nf lo"]);
    // кольцо с рельефами — перед сферой
    const rx = cx - m(0.85), rc = 2.35, ring = (r, n = 56) => Array.from({ length: n }, (_, k) => { const a = (k / n) * 6.283; return P(rx, cy + m(r) * Math.cos(a), Z(rc) + m(r) * Math.sin(a)); });
    out.push([poly(ring(2.1)) + poly(ring(1.62)), "sil"]);
    out.push([open(ring(1.98).concat([ring(1.98)[0]])) + open(ring(1.74).concat([ring(1.74)[0]])), "nf lo"]);
    out.push([Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * 6.283 + 0.15, big = k % 2 === 0, oy = Math.cos(a) * m(1.86), oz = Math.sin(a) * m(1.86); return poly(Array.from({ length: 12 }, (_, j) => { const t = (j / 12) * 6.283, ry = m(big ? 0.26 : 0.17), rz = m(big ? 0.12 : 0.09); return P(rx, cy + oy + ry * Math.cos(t) * -Math.sin(a) - rz * Math.sin(t) * Math.cos(a), Z(rc) + oz + ry * Math.cos(t) * Math.cos(a) - rz * Math.sin(t) * Math.sin(a)); })); }).join(""), "nf"]);
    // фигура: сапоги, ноги, комбинезон с поясом, руки вскинуты
    for (const s of [-1, 1]){ box(m(0.36), m(0.24), z, Z(0.22), m(0.04), s * m(0.19)); box(m(0.26), m(0.24), Z(0.22), Z(1.55), 0, s * m(0.19)); }
    box(m(0.42), m(0.78), Z(1.5), Z(1.68));
    box(m(0.4), m(0.74), Z(1.68), Z(2.62));
    box(m(0.2), m(0.26), Z(2.62), Z(2.72));
    const arm = (s) => { const y0 = s * 0.36, z0 = 2.52, y1 = s * 1.1, z1 = 3.58, l = Math.hypot(y1 - y0, z1 - z0), ny = -(z1 - z0) / l * 0.09, nz = (y1 - y0) / l * 0.09;
      return poly([[y0 + ny, z0 + nz], [y1 + ny * .8, z1 + nz * .8], [y1 - ny * .8, z1 - nz * .8], [y0 - ny, z0 - nz]].map(([y, h]) => P(cx + m(0.05), cy + m(y), Z(h)))); };
    out.push([arm(-1) + arm(1), "sil"]);
    for (const s of [-1, 1]) ball(m(0.09), Z(3.64), m(0.05), s * m(1.14));
    ball(m(0.2), Z(2.93));
    return { out, balls, after: [[seg(P(cx + m(0.21), cy - m(0.37), Z(2.2)), P(cx + m(0.21), cy + m(0.37), Z(2.2))) + seg(P(cx + m(0.21), cy, Z(2.62)), P(cx + m(0.21), cy, Z(1.7))), "nf lo"]] };
  }
  // ---- упрощённые контурные модели нижнего этажа: ракеты, корабли, спутники (детальные фигуры — позже)
  const cone = (r0, r1, z0, z1, dx = 0, dy = 0) => { const c0 = Array.from({ length:28 }, (_, k) => P(cx + dx + r0 * Math.cos(k / 28 * 6.283), cy + dy + r0 * Math.sin(k / 28 * 6.283), z0)), c1 = Array.from({ length:28 }, (_, k) => P(cx + dx + r1 * Math.cos(k / 28 * 6.283), cy + dy + r1 * Math.sin(k / 28 * 6.283), z1)); out.push([poly(hull(c0.concat(c1))), "sil"]); };
  const tube = (x0, x1, r0, r1, zc, dy = 0) => { const rg = (x, r) => Array.from({ length:28 }, (_, k) => P(cx + x, cy + dy + r * Math.cos(k / 28 * 6.283), zc + r * Math.sin(k / 28 * 6.283))); out.push([poly(hull(rg(x0, r0).concat(rg(x1, r1)))), "sil"]); };
  const plate = (pts) => out.push([poly(pts.map(([x, y, h]) => P(cx + x, cy + y, h))), "sil"]);
  const lines = (segs, cls = "nf") => out.push([segs.map(([a, b]) => seg(P(cx + a[0], cy + a[1], a[2]), P(cx + b[0], cy + b[1], b[2]))).join(""), cls]);
  // [радиус, высота, боковых блоков, их радиус, их высота, блоки-конусы (Р-7), башня САС]
  const ROCK = { proton:[.3, 2.6, 6, .15, 1.2, 0, 0], saturn:[.36, 3.6, 0, 0, 0, 0, 1], cz2f:[.25, 2.8, 4, .13, 1.1, 0, 1], explorer:[.07, 1.3, 0, 0, 0, 0, 0] };
  const rocket = (r, h, n, br, bh, taper = 0, tower = 0, z0 = z, dx = 0) => {
    const B = Array.from({ length:n }, (_, k) => { const a = k / n * 6.283 + .4; return [Math.cos(a) * m(r + br * (taper ? .75 : 1)), Math.sin(a) * m(r + br * (taper ? .75 : 1)), a]; });
    const boost = ([bx, by, a]) => { if (taper){ cone(m(br), m(br * .35), z0, z0 + m(bh), dx + bx, by); const t = [Math.cos(a) * m(r * .9), Math.sin(a) * m(r * .9)]; out.push([seg(P(cx + dx + bx * .55 + t[0] * .3, cy + by * .55 + t[1] * .3, z0 + m(bh)), P(cx + dx + t[0], cy + t[1], z0 + m(bh + .35))), "nf"]); }
      else { cyl(m(br), z0, z0 + m(bh), .5, dx + bx, by); cone(m(br), m(.02), z0 + m(bh), z0 + m(bh + br * 2.4), dx + bx, by); } };
    B.filter(([bx, by]) => bx + by < 0).forEach(boost);
    const ht = tower ? h * .9 : h;
    cyl(m(r), z0, z0 + m(ht * .45), .6, dx); cyl(m(r * (tower ? 1 : .92)), z0 + m(ht * .45), z0 + m(ht * .72), .6, dx); cyl(m(r * .72), z0 + m(ht * .72), z0 + m(ht * .86), .5, dx); cone(m(r * .72), m(r * .2), z0 + m(ht * .86), z0 + m(ht), dx);
    if (tower) out.push([seg(P(cx + dx, cy, z0 + m(ht)), P(cx + dx, cy, z0 + m(h))) + seg(P(cx + dx - m(.04), cy, z0 + m(h * .97)), P(cx + dx + m(.04), cy, z0 + m(h * .97))), "sil"]);
    B.filter(([bx, by]) => bx + by >= 0).forEach(boost); };
  if (ROCK[e.kind]){ rocket(...ROCK[e.kind]); if (e.kind === "explorer") lines([0, 1, 2, 3].map(k => { const a = k * 1.57 + .8; return [[0, 0, z + m(.95)], [Math.cos(a) * m(.45), Math.sin(a) * m(.45), z + m(.75)]]; })); return { out, balls, after:[] }; }
  if (e.kind === "baikonur"){ const zp = z + m(.22); box(m(1.7), m(1.7), z, zp); out.push([poly(Array.from({ length:24 }, (_, k) => P(cx + m(.45) * Math.cos(k / 24 * 6.283), cy + m(.45) * Math.sin(k / 24 * 6.283), zp + 1))), "nf lo"]);
    const arm = (a) => [[Math.cos(a) * m(.75), Math.sin(a) * m(.75), zp], [Math.cos(a) * m(.32), Math.sin(a) * m(.32), zp + m(.75)]];
    lines([.8, 2.4].map(arm)); rocket(.17, 2.3, 4, .14, 1.15, 1, 0, zp); lines([3.9, 5.5].map(arm)); return { out, balls, after:[] }; }
  if (e.kind === "shuttle" || e.kind === "buran"){ const S = e.kind === "shuttle";
    rocket(S ? .28 : .3, S ? 2.2 : 2.6, S ? 2 : 4, S ? .1 : .14, S ? 1.9 : 1.9);
    // орбитальный корабль — на стороне бака к зрителю: круглый фюзеляж, нос, треугольное крыло и киль
    const ox = m(S ? .5 : .55), oy = m(.05), z0 = z + m(.3), z1 = z + m(1.65), rr = m(S ? .17 : .18);
    plate([[ox, oy - m(.75), z0 + m(.02)], [ox, oy + m(.75), z0 + m(.02)], [ox, oy + rr, z0 + m(.95)], [ox, oy - rr, z0 + m(.95)]]);
    cyl(rr, z0, z1, .6, ox, oy); cone(rr, m(.04), z1, z1 + m(.3), ox, oy);
    plate([[ox + rr * .6, oy, z0], [ox + rr + m(.38), oy, z0 - m(.04)], [ox + rr + m(.12), oy, z0 + m(.42)], [ox + rr * .6, oy, z0 + m(.5)]]); return { out, balls, after:[] }; }
  if (e.kind === "seastart"){ for (const s of [-1, 1]) tube(-m(.75), m(.75), m(.14), m(.14), z + m(.14), s * m(.45)); for (const sx of [-1, 1]) for (const sy of [-1, 1]) cyl(m(.07), z + m(.2), z + m(.6), .3, sx * m(.5), sy * m(.45)); box(m(1.3), m(1.1), z + m(.6), z + m(.72)); rocket(.11, 1.5, 0, 0, 0, 0, 0, z + m(.72)); return { out, balls, after:[] }; }
  if (e.kind === "engine"){ const N = [[-1, -1], [1, -1], [-1, 1], [1, 1]].sort((a, b) => a[0] + a[1] - b[0] - b[1]);
    for (const [x, y] of N.slice(0, 2)) cone(m(.16), m(.07), z + m(.1), z + m(.6), x * m(.17), y * m(.17)); cone(m(.07), m(.04), z + m(.3), z + m(.6), -m(.42), m(.0));
    for (const [x, y] of N.slice(2)) cone(m(.16), m(.07), z + m(.1), z + m(.6), x * m(.17), y * m(.17)); cone(m(.07), m(.04), z + m(.3), z + m(.6), m(.42), m(.0));
    box(m(.62), m(.62), z + m(.6), z + m(.82)); cyl(m(.2), z + m(.82), z + m(1.05), .4); lines([[[-m(.2), -m(.2), z + m(.82)], [-m(.32), -m(.32), z + m(.6)]], [[m(.2), m(.2), z + m(.82)], [m(.3), m(.3), z + m(.6)]]]); return { out, balls, after:[] }; }
  if (e.kind === "soyuz"){ const zc = z + m(.75); for (const x of [-.85, .55]) box(m(.14), m(.5), z, zc - m(.4), m(x));
    plate([[-m(.95), -m(.55), zc], [-m(.6), -m(.55), zc], [-m(.6), -m(1.75), zc], [-m(.95), -m(1.75), zc]]);
    tube(-m(1.35), -m(1.15), m(.5), m(.36), zc); tube(-m(1.15), -m(.35), m(.36), m(.36), zc); tube(-m(.35), m(.3), m(.36), m(.22), zc); ball(m(.3), zc, m(.6)); tube(m(.88), m(1.05), m(.05), m(.05), zc);
    plate([[-m(.95), m(.55), zc], [-m(.6), m(.55), zc], [-m(.6), m(1.75), zc], [-m(.95), m(1.75), zc]]); return { out, balls, after:[] }; }
  if (e.kind === "asts"){ const zc = z + m(.8); for (const x of [-1.25, .75]) box(m(.12), m(.4), z, zc - m(.3), m(x));
    plate([[-m(1.55), -m(.28), zc], [-m(1.3), -m(.28), zc], [-m(1.3), -m(1.05), zc], [-m(1.55), -m(1.05), zc]]);
    tube(-m(1.75), -m(1.3), m(.22), m(.22), zc); tube(-m(1.3), -m(.95), m(.22), m(.13), zc); ball(m(.17), zc, -m(.8)); tube(-m(.64), -m(.2), m(.09), m(.09), zc);
    tube(-m(.2), m(.1), m(.06), m(.28), zc); tube(m(.1), m(.95), m(.3), m(.3), zc); tube(m(.95), m(1.25), m(.12), m(.2), zc);
    plate([[-m(1.55), m(.28), zc], [-m(1.3), m(.28), zc], [-m(1.3), m(1.05), zc], [-m(1.55), m(1.05), zc]]); return { out, balls, after:[] }; }
  if (e.kind === "apas"){ cyl(m(.55), z, z + m(.35), .7); cyl(m(.42), z + m(.35), z + m(.5), .5); for (let k = 0; k < 3; k++){ const a = k / 3 * 6.283 + .5, c = Math.cos(a), s = Math.sin(a); plate([[c * m(.42) - s * m(.16), s * m(.42) + c * m(.16), z + m(.5)], [c * m(.42) + s * m(.16), s * m(.42) - c * m(.16), z + m(.5)], [c * m(.3), s * m(.3), z + m(.85)]]); } return { out, balls, after:[] }; }
  if (e.kind === "capsule"){ cone(m(.55), m(.28), z + m(.1), z + m(.8)); cyl(m(.6), z, z + m(.12), .5); cyl(m(.2), z + m(.8), z + m(.9), .4); return { out, balls, after:[] }; }
  if (e.kind === "iss"){ const zc = z + m(.8); for (const x of [-.6, .7]) box(m(.12), m(.3), z, zc - m(.12), m(x));
    const wings = (s) => { for (const y of [1.05, 1.4]) for (const d of [-1, 1]) plate([[d * m(.12), s * m(y), zc + m(.2)], [d * m(.75), s * m(y), zc + m(.2)], [d * m(.75), s * m(y + .26), zc + m(.2)], [d * m(.12), s * m(y + .26), zc + m(.2)]]); };
    wings(-1); tube(-m(1.15), m(1.25), m(.1), m(.1), zc); tube(-m(.1), m(.1), m(.13), m(.13), zc); box(m(.1), m(3.4), zc + m(.13), zc + m(.25)); plate([[-m(.05), -m(.5), zc + m(.25)], [m(.05), -m(.5), zc + m(.25)], [m(.05), -m(.5), zc + m(.6)], [-m(.05), -m(.5), zc + m(.6)]]); wings(1); return { out, balls, after:[] }; }
  if (e.kind === "sat"){ const G = e.id === 56, zc = z + m(.9); cyl(m(.04), z, zc - m(.25), .2); box(m(.45), m(.45), zc - m(.25), zc + m(.25)); for (const s of [-1, 1]) plate([[-m(.18), s * m(.3), zc], [m(.18), s * m(.3), zc], [m(.18), s * m(G ? 1.3 : .8), zc], [-m(.18), s * m(G ? 1.3 : .8), zc]]);
    if (G) cone(m(.2), m(.06), zc + m(.25), zc + m(.45)); else lines([[[0, 0, zc + m(.25)], [m(.1), -m(.1), zc + m(.7)]], [[0, 0, zc + m(.25)], [-m(.15), m(.05), zc + m(.6)]]]); return { out, balls, after:[] }; }
  if (e.kind === "amen") {
    // указатель удобства: стойка и круглая табличка сверху, на ней — простой знак из линий (без букв)
    const zt = z + m(1.05), R0 = m(.32), C = (x, y) => P(cx + x, cy + y, zt + .05), ring = (r, n = 24, ox = 0, oy = 0) => Array.from({ length:n }, (_, k) => C(ox + r * Math.cos(k / n * 6.283), oy + r * Math.sin(k / n * 6.283)));
    cyl(m(.04), z, zt, .2); cyl(R0, zt - m(.06), zt, .4);
    const t = String(e.id).slice(2).replace(/\d+$/, ''), g = [];
    if (t === "kassa") g.push(poly(ring(m(.15))), poly(ring(m(.04), 10)));
    if (t === "gard") g.push(poly([C(-m(.16), m(.08)), C(m(.16), m(.08)), C(0, -m(.08))]), open([C(0, -m(.08)), C(0, -m(.15)), C(m(.04), -m(.17))]));
    if (t === "wc") g.push(poly(ring(m(.06), 12, -m(.09), 0)), poly(ring(m(.06), 12, m(.09), 0)));
    if (t === "lift") g.push(poly([C(-m(.15), -m(.15)), C(m(.15), -m(.15)), C(m(.15), m(.15)), C(-m(.15), m(.15))]), open([C(-m(.06), -m(.03)), C(0, -m(.09)), C(m(.06), -m(.03))]), open([C(-m(.06), m(.03)), C(0, m(.09)), C(m(.06), m(.03))]));
    if (t === "cafe") g.push(poly(ring(m(.11), 18, -m(.03), 0)), open(Array.from({ length:9 }, (_, k) => C(m(.1) + m(.06) * Math.cos(-1.4 + k * .35), m(.06) * Math.sin(-1.4 + k * .35)))));
    if (t === "shop") g.push(poly([C(-m(.13), -m(.1)), C(m(.13), -m(.1)), C(m(.13), m(.14)), C(-m(.13), m(.14))]), open(Array.from({ length:9 }, (_, k) => C(m(.07) * Math.cos(3.14 + k * .39), -m(.1) + m(.07) * Math.sin(3.14 + k * .39)))));
    if (t === "in") g.push(open([C(-m(.12), -m(.12)), C(0, 0), C(-m(.12), m(.12))]), open([C(m(.02), -m(.12)), C(m(.14), 0), C(m(.02), m(.12))]));
    out.push([g.join(""), "nf"]);
    return { out, balls, after:[] };
  }
  if (e.kind === "paint") {
    // картина на стене зала: рама на подрамнике, холст без изображения (содержимое картины не воспроизводим)
    const x0 = cx - m(.75), x1 = cx + m(.75), z0 = z + m(.55), z1 = z + m(1.7), y = cy;
    out.push([poly([P(x0, y, z0), P(x1, y, z0), P(x1, y, z1), P(x0, y, z1)]), "sil"], [poly([P(x0 + m(.09), y, z0 + m(.09)), P(x1 - m(.09), y, z0 + m(.09)), P(x1 - m(.09), y, z1 - m(.09)), P(x0 + m(.09), y, z1 - m(.09))]), "nf lo"]);
    out.push([seg(P(cx, y, z1), P(cx, y, z1 + m(.12))) + seg(P(cx - m(.25), y, z0 - m(.2)), P(cx + m(.25), y, z0 - m(.2))), "nf"]);
    return { out, balls, after: [] };
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
const stage = document.getElementById('m3hlStage'); if (!stage) return;
HL.inject(document); stage.setAttribute('data-hairline', 'zal1-plan'); stage.setAttribute('data-hairline-theme', 'dark'); stage.setAttribute('role', 'img'); stage.setAttribute('aria-label', 'Схема первого зала: проход от входа к памятнику Гагарину, экспонаты по сторонам. Нажмите на экспонат — камера подъедет');
const svg = HL.mk('svg', { viewBox:'0 0 400 320' }, stage);
// вид: та же сторона, что у 3D-карты приложения (EL 36°), доворот к изометрии — стены и ряды ложатся на оси
const ROT = -90 * Math.PI / 180, RC = Math.cos(ROT), RS = Math.sin(ROT), K_EL = 0.5;   // как у наших контурных экспонатов — фигуры встают в схему без искажений
const SC = .74;   // схема: зал сжат, экспонаты в натуральную величину — так они читаются на обзоре
const W2 = (p) => [(p[0] * RC - p[1] * RS) * WS * SC, (p[0] * RS + p[1] * RC) * WS * SC];
const WD = (d) => [d[0] * RC - d[1] * RS, d[0] * RS + d[1] * RC];   // направление плана → мир
const items = EXD.map(([id, name, kind, s, yr]) => { const p = SCHEME.at[id], [x, y] = W2(p); const hall = SCHEME.hallOf[id] || 'utro', rl = SCHEME.routes[hall];
  const q = rl ? nearOn(rl, p) : null, side = q ? nrm2([q[0] - p[0], q[1] - p[1]]) : Math.abs(p[0] - AX) < 1 ? [0, 1] : [Math.sign(AX - p[0]), 0];
  return { id, name, kind, yr, hall, px:p[0], py:p[1], cx:x, cy:y, h:m(s) / 2, z:tween(0), dir:WD(side), spurX:hall === 'tvortsy' ? 17.8 : null, spurQ:q, side }; });
const HALLS = SCHEME.halls.map(h => { const pts = h.poly.map(W2); return { ...h, pts, c:h.mid ? W2(h.mid) : pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]) }; });
let hallK = 0; let hallPts = HALLS[0].pts, hc = HALLS[0].c;
function camFor(zf, focus){ const C0 = Cam(45, K_EL, 1); const box = HALLS[0].pts.map(([x, y]) => [x, y, 0]).concat(HALLS[0].pts.map(([x, y]) => [x, y, m(3)])); fit(C0, box, 200, 165); const P0 = proj(C0); const pp = box.map(p => P0(...p)); const w = Math.max(...pp.map(p => p[0])) - Math.min(...pp.map(p => p[0])), h = Math.max(...pp.map(p => p[1])) - Math.min(...pp.map(p => p[1]));
  const S = Math.min(372 / w, 290 / h) * zf; const C = Cam(45, K_EL, S); fit(C, [[focus[0] - 1, focus[1] - 1, 0], [focus[0] + 1, focus[1] + 1, 0]], 200, focused >= 0 ? 190 : 165); return C; }
// стены: контур зала, разрезанный проёмами входа и выхода; каждая стена — тонкий брусок
const WALLH = m(.04), WT = .45;   // стены плоские: тонкая тусклая полоса по контуру пола, чтобы не спорить с экспонатами
const walls = [], wallLines = [];
for (const HH of SCHEME.halls){ const H = HH.poly, c = H.reduce((a, p) => [a[0] + p[0] / H.length, a[1] + p[1] / H.length], [0, 0]);
  H.forEach((a, k) => { const b = H[(k + 1) % H.length], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy); let nx = dy / len, ny = -dx / len; if ((a[0] - c[0]) * nx + (a[1] - c[1]) * ny < 0){ nx = -nx; ny = -ny; }
    let cuts = [[0, 1]]; for (const g of HH.doors) if (g.edge === k) cuts = cuts.flatMap(([t0, t1]) => [[t0, Math.min(t1, g.t0)], [Math.max(t0, g.t1), t1]]).filter(([t0, t1]) => t1 - t0 > .01);
    for (const [t0, t1] of cuts){ const p0 = [a[0] + dx * t0, a[1] + dy * t0], p1 = [a[0] + dx * t1, a[1] + dy * t1], q = [p0, p1, [p1[0] + nx * WT, p1[1] + ny * WT], [p0[0] + nx * WT, p0[1] + ny * WT]].map(W2); q.floor = HH.floor; walls.push(q); wallLines.push(Object.assign([W2(p0), W2(p1)], { floor:HH.floor })); } }); }
const wallEdges = []; for (const q of walls){ const qc = q.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4], [0, 0]); for (let i = 0; i < 4; i++){ const a = q[i], b = q[(i + 1) % 4], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); let nx = dy / l, ny = -dx / l; if ((a[0] - qc[0]) * nx + (a[1] - qc[1]) * ny < 0){ nx = -nx; ny = -ny; } if (nx + ny > .05) wallEdges.push(Object.assign([a, b], { floor:q.floor })); } }
const g = mk('g', {}, svg);
const L = { floorB:mk('path', { class:'lo' }, g), floor:mk('path', { class:'fo' }, g), aisle:mk('path', { class:'dash nf' }, g), stairs:mk('path', { class:'nf lo' }, g), island:mk('path', {}, g), marks:mk('path', { class:'nf hi' }, g), leg:mk('path', { class:'dash nf hi' }, g), you:mk('path', { class:'hi' }, g), spurs:mk('path', { class:'nf lo' }, g), halo:mk('g', {}, g), walls:mk('g', {}, g), objs:mk('g', {}, g) };
L.nextRing = mk('path', { class:'nf hi' }, g);   // кольцо следующего экспоната — поверх постаментов, чтобы его было видно
const caseG = mk('g', {}, g), cases = (SCHEME.cases || []).map(c => ({ ...c, s:HL.solid(caseG), items:mk('path', { class:'nf lo' }, caseG) }));
g.appendChild(L.objs); g.appendChild(L.nextRing);
const wallSides = mk('path', { class:'lo' }, L.walls), wallTop = mk('path', { class:'nf sil' }, L.walls);
const FIGN = { 10:'sputnik', 11:'container', 12:'vostok', 13:'sk1', 14:'berkut', 16:'venera', 24:'luna9', 17:'gird09', 50:'veranda', 44:'soyuz45', 49:'yastreb', 19:'orlan', 36:'mir', 45:'airlock', 47:'krechet', 22:'lunokhod', 21:'luna16', 23:'venera4', 15:'mars3', 35:'energia', 26:'asts', 29:'iss', 31:'baikonur', 33:'proton', 38:'shuttle', 900:'saturn5', 32:'rd107', 34:'seastart', 20:'soyuz' };
const FITALL = new Map([[44, 1.5], [36, 1.25], [45, 1.05], [22, 1.1], [21, 1.15], [23, .9], [15, 1.05], [35, 1.5], [26, 1.65], [29, 1.25], [31, 1.1], [33, .72], [38, .95], [900, .62], [32, 1], [34, 1.1], [20, 1.4]]);   // длинные экспонаты вписываем в постамент целиком, а не по самой широкой детали
for (const it of items){ it.halo = mk('path', { class:'nf lo' }, L.halo); it.halo2 = mk('path', { class:'nf hi' }, L.halo); it.halo2.style.display = 'none'; it.grp = mk('g', {}, L.objs); it.pl = HL.solid(it.grp); it.body = mk('g', {}, it.grp);
  // подробная фигура экспоната (наша Hairline-иллюстрация), вписанная в круглый постамент схемы
  // у каждой фигуры своя невидимая «сцена» внутри карты: по ней ядро понимает, что фигура на экране, и ведёт её жест
  const F = window.HLFIG && window.HLFIG[FIGN[it.id]]; if (F){ it.fig = mk('g', {}, it.grp); it.F = F; it.part = '';
    it.fst = document.createElement('div'); it.fst.style.cssText = 'position:absolute;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none'; stage.appendChild(it.fst);
    const rd = { set textContent(v){ it.part = v && v !== 'rest' ? v : ''; if (it.onRead) it.onRead(); }, get textContent(){ return it.part; } };
    try { F.mount({ stage:it.fst, svg:it.fig, read:rd }, F.range[0]); it.pl.g.style.display = 'none'; } catch (err){ it.fig.remove(); it.fig = null; it.fst.remove(); } }
  it.post = HL.solid(it.grp); it.desk = mk('path', { class:'sil' }, it.grp);
  // скафандры стоят в стеклянных витринах — так манекен читается как экспонат, а не как человек
  if (it.kind === 'suit') it.glass = mk('path', { class:'nf lo' }, it.grp); }
const zf = spring(1), fx = spring(hc[0]), fy = spring(hc[1]);
// шевроны вдоль маршрута зала: через каждые ~5 м плана, по направлению движения
const routeChev = (line) => { const out = []; for (let i = 0; i < line.length - 1; i++){ const a = line[i], b = line[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(l / 5); for (let k = 1; k <= n; k++){ const t = k / (n + 1); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (b[0] - a[0]) / l, (b[1] - a[1]) / l]); } } return out; };
let C, P, front, act = -1, focused = -1;
const circ = (cx, cy, r, z, n = 36) => Array.from({ length: n }, (_, k) => { const a = (k / n) * 6.283; return P(cx + r * Math.cos(a), cy + r * Math.sin(a), z); });
const Pp = (x, y, z = 0) => P(...W2([x, y]), z);   // точка плана → экран
function draw(now){
  C = camFor(zf.x, [fx.x, fy.x]); P = proj(C); front = facing(C);
  const FL = HALLS[hallK].floor, HF = HALLS.filter(h => h.floor === FL);
  L.floorB.setAttribute('d', '');
  L.floor.setAttribute('d', HF.map(h => poly(h.pts.map(([x, y]) => P(x, y, 0)))).join(''));
  // проход: полоса от входа к памятнику, шевроны — куда идти; в залах с ломаным маршрутом — полоса вдоль его оси
  // маршрут — одна пунктирная линия по оси прохода (на «Луне» — две ветки от лестницы)
  L.aisle.setAttribute('d', (FL === 'lower' ? SCHEME.strips.luna : [WALK.upper]).map(l => open(l.map(([x, y]) => Pp(x, y)))).join(''));
  // лестница на другой этаж: ступени поперёк выхода
  L.stairs.setAttribute('d', HF.filter(h => SCHEME.stairs[h.id]).map(h => { const [sx, sy] = SCHEME.stairs[h.id]; return [0, 1, 2, 3, 4].map(k => seg(Pp(sx - .6 - k * .9, sy - 1.6), Pp(sx - .6 - k * .9, sy + 1.6))).join(''); }).join(''));
  L.island.setAttribute('d', '');
  // стрелка строится на экране: острие по направлению движения, крылья под 40°
  const chev = (x, y, dx, dy) => { const a = Pp(x, y), b = Pp(x + dx, y + dy), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l, k = 7 * zf.x ** .6, c = Math.cos(.7), sn = Math.sin(.7);
    const tip = [a[0] + ux * k * .5, a[1] + uy * k * .5], w1 = [tip[0] - k * (ux * c - uy * sn), tip[1] - k * (uy * c + ux * sn)], w2 = [tip[0] - k * (ux * c + uy * sn), tip[1] - k * (uy * c - ux * sn)]; return open([w1, tip, w2]); };
  L.marks.setAttribute('d', (FL === 'upper' ? SCHEME.chev : []).concat(...HF.filter(h => SCHEME.routes[h.id]).flatMap(h => (SCHEME.strips[h.id] || [SCHEME.routes[h.id]]).map(routeChev))).map(([x, y, dx, dy]) => chev(x, y, dx, dy)).join(''));
  // ответвления от прохода к табличкам
  L.spurs.setAttribute('d', items.filter(it => it.kind !== 'amen' && HALLS.find(h => h.id === it.hall).floor === FL).map(it => { if (it.spurQ){ const d = Math.hypot(it.px - it.spurQ[0], it.py - it.spurQ[1]), r = (it.h / WS + .45) / SC; return d > r + .3 ? seg(Pp(it.spurQ[0] + it.side[0] * -.35, it.spurQ[1] + it.side[1] * -.35), Pp(it.px + it.side[0] * r, it.py + it.side[1] * r)) : ''; } const s = Math.abs(it.px - AX) < 1 ? null : Math.sign(it.px - AX); if (s === null) return ''; const x0 = it.spurX != null ? it.spurX : AX + s * .35; return seg(Pp(x0, it.py), Pp(it.px - s * (it.h / WS + .75) / SC, it.py)); }).join(''));
  for (const c of cases){ const on = c.floor === FL; c.s.g.style.display = on ? '' : 'none'; c.items.style.display = on ? '' : 'none'; if (!on) continue;
    const A = W2([c.r[0], c.r[1]]), B = W2([c.r[2], c.r[3]]), x0 = Math.min(A[0], B[0]), x1 = Math.max(A[0], B[0]), y0 = Math.min(A[1], B[1]), y1 = Math.max(A[1], B[1]), h = m(.85), b = Math.min(m(.12), (Math.min(x1 - x0, y1 - y0)) * .2);
    const [o, i] = rings(x0, y0, x1, y1, m(.15), b); HL.put(c.s, prism(P, front, o, i, 0, h)); c.s.sil.setAttribute('class', 'lo');
    const n = 4, along = x1 - x0 > y1 - y0; c.items.setAttribute('d', Array.from({ length:n }, (_, k) => { const t = (k + .5) / n, cx = along ? x0 + (x1 - x0) * t : (x0 + x1) / 2, cy = along ? (y0 + y1) / 2 : y0 + (y1 - y0) * t; return poly(circ(cx, cy, m(.13), h + m(.05), 10)); }).join('')); }
  wallTop.setAttribute('d', wallLines.filter(q => q.floor === FL).map(([a, b]) => seg(P(...a, 0), P(...b, 0))).join(''));
  wallSides.setAttribute('d', '');
  const order = items.slice().sort((a, b) => a.cx + a.cy - (b.cx + b.cy)); order.forEach(it => L.objs.appendChild(it.grp));
  for (const it of items){ const lift = tval(it.z, now); const on = HALLS.find(h => h.id === it.hall).floor === FL; it.grp.style.display = on ? '' : 'none'; it.halo.style.display = on ? '' : 'none'; if (!on){ it.halo2.style.display = 'none'; continue; } else if (items[act] === it) it.halo2.style.display = '';
    // круглый постамент со световым кольцом на полу
    const [o, i] = disc(it.cx, it.cy, it.h, Math.min(m(.18), it.h * .25)); HL.put(it.pl, prism(P, front, o, i, 0, PLH));
    it.halo.setAttribute('d', poly(circ(it.cx, it.cy, it.h + m(.4), 0))); it.halo2.setAttribute('d', poly(circ(it.cx, it.cy, it.h + m(.75), 0)));
    if (it.fig){
      if (!it.pb){ let best = null; if (FITALL.has(it.id)){ let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const el of it.fig.querySelectorAll('.sil')){ const b = el.getBBox(); if (!b.width) continue; x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); } if (x1 > x0) best = { x:x0, y:y0, width:x1 - x0, height:y1 - y0, all:true }; } else for (const el of it.fig.querySelectorAll('path.sil')){ const b = el.getBBox(); if (b.width > 0 && (!best || b.width > best.width)) best = b; } if (best) it.pb = best; }
      if (it.pb){ const cc = circ(it.cx, it.cy, it.h, lift), xs = cc.map(p => p[0]), ys = cc.map(p => p[1]), wpx = Math.max(...xs) - Math.min(...xs), s = wpx / it.pb.width * (FITALL.get(it.id) || 1);
        const ox = (Math.max(...xs) + Math.min(...xs)) / 2, oy = (Math.max(...ys) + Math.min(...ys)) / 2, px = it.pb.x + it.pb.width / 2, py = it.pb.all ? it.pb.y + it.pb.height * .78 : it.pb.y + it.pb.height / 2 - (it.pb.height - it.pb.width * K_EL) / 2;
        it.fig.setAttribute('transform', `translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${s.toFixed(4)}) translate(${(-px).toFixed(2)} ${(-py).toFixed(2)})`); }
    }
    const { out, balls, after } = it.fig ? { out:[], balls:[], after:[] } : parts(P, front, it, PLH + lift);
    if (!it.els || it.els.length !== out.length){ it.body.replaceChildren(); it.els = out.map(([, c]) => mk('path', { class:c, 'fill-rule':'evenodd' }, it.body)); it.bl = balls.map(() => mk('ellipse', { class:'sil' }, it.body)); it.af = after.map(([, c]) => mk('path', { class:c }, it.body)); }
    out.forEach(([d], k) => it.els[k].setAttribute('d', d)); balls.forEach(([x, y, r], k) => { const el = it.bl[k]; el.setAttribute('cx', x.toFixed(2)); el.setAttribute('cy', y.toFixed(2)); el.setAttribute('rx', r.toFixed(2)); el.setAttribute('ry', r.toFixed(2)); }); after.forEach(([d], k) => it.af[k].setAttribute('d', d));
    // пюпитр с табличкой — со стороны прохода (у указателей удобств его нет)
    if (it.kind === 'amen'){ it.post.g.style.display = 'none'; it.desk.style.display = 'none'; }
    const [ux, uy] = it.dir, dx = it.cx + ux * (it.h + m(.5)), dy = it.cy + uy * (it.h + m(.5)), dz = m(.75), w = m(.3), t = m(.2), px = -uy, py = ux;
    const [po, pi] = rings(dx - m(.04), dy - m(.04), dx + m(.04), dy + m(.04), m(.03), m(.01)); HL.put(it.post, prism(P, front, po, pi, 0, dz));
    it.desk.setAttribute('d', poly([P(dx - px * w - ux * t, dy - py * w - uy * t, dz + m(.12)), P(dx + px * w - ux * t, dy + py * w - uy * t, dz + m(.12)), P(dx + px * w + ux * t, dy + py * w + uy * t, dz), P(dx - px * w + ux * t, dy - py * w + uy * t, dz)]));
    if (it.glass){ const r = it.h * .98, zt = lift + m(2.35), top = circ(it.cx, it.cy, r, zt, 40), bot = circ(it.cx, it.cy, r, lift + m(.02), 40); let iL = 0, iR = 0; bot.forEach((q, k) => { if (q[0] < bot[iL][0]) iL = k; if (q[0] > bot[iR][0]) iR = k; });
      const gl = [Pp(0, 0)]; it.glass.setAttribute('d', poly(top) + seg(bot[iL], top[iL]) + seg(bot[iR], top[iR]) + seg(P(it.cx + r * .55, it.cy + r * .2, lift + m(1.9)), P(it.cx + r * .2, it.cy + r * .55, lift + m(.9)))); } }
}
// экскурсия: текущий экспонат, следующий и участок пути между ними
const ROUTE = { ids:[], i:-1 };
function drawRoute(FL){
  const it0 = ROUTE.i >= 0 ? items.find(x => x.id === ROUTE.ids[ROUTE.i]) : null, it1 = ROUTE.i >= 0 ? items.find(x => x.id === ROUTE.ids[ROUTE.i + 1]) : null;
  const flo = (it) => it && HALLS.find(h => h.id === it.hall).floor, W = WALK[FL];
  if (!W || (!it0 && !it1)){ L.leg.setAttribute('d', ''); L.nextRing.setAttribute('d', ''); L.you.setAttribute('d', ''); return; }
  const on0 = flo(it0) === FL, on1 = flo(it1) === FL, s0 = on0 ? walkS(W, [it0.px, it0.py]) : on1 ? 0 : null, s1 = on1 ? walkS(W, [it1.px, it1.py]) : on0 ? walkLen(W).slice(-1)[0] : null;
  const pts = s0 == null ? [] : walkSub(W, s0, s1), ends = [];
  if (on0) ends.push(seg(Pp(it0.px, it0.py), Pp(...pts[0]))); if (on1 && pts.length) ends.push(seg(Pp(...pts[pts.length - 1]), Pp(it1.px, it1.py)));
  L.leg.setAttribute('d', (pts.length > 1 ? open(pts.map(([x, y]) => Pp(x, y, m(.05)))) : '') + ends.join(''));
  L.nextRing.setAttribute('d', on1 ? poly(circ(it1.cx, it1.cy, it1.h + m(1.05), 0)) + poly(circ(it1.cx, it1.cy, it1.h + m(1.3), 0)) : '');
  L.you.setAttribute('d', on0 && pts.length ? poly(circ(...W2(pts[0]), m(.32), m(.05), 16)) : '');
}
window.__hlRoute = (ids, i) => { ROUTE.ids = ids || []; ROUTE.i = i == null ? -1 : i; if (act < 0) lab.textContent = restText(); B.wake(); };
const restText = () => { const nx = ROUTE.i >= 0 ? items.find(x => x.id === ROUTE.ids[ROUTE.i + 1]) : null; return nx ? `экскурсия · дальше: ${nx.name}` : 'нажмите на экспонат — камера подъедет'; };
const B = register(stage, (dt, now) => { let mv = stepS(zf, dt); mv = stepS(fx, dt) || mv; mv = stepS(fy, dt) || mv; for (const it of items) if (!tdone(it.z, now)) mv = true; draw(now); drawRoute(HALLS[hallK].floor); return mv; });
const lab = document.getElementById('m3hlRead');
// «живая» фигура: при наезде на экспонат его фигура один раз проигрывает свой жест (тур ядра), а подпись называет деталь
const labText = (it) => (it.yr ? `${it.name} · ${it.yr}` : it.name) + (it === live.it && it.part ? ` · ${it.part}` : '');
const live = { it:null, tour:null };
function liveStop(){ const it = live.it; if (live.tour) live.tour.stop(); live.tour = null; live.it = null; if (it){ const on = items[act] === it; it.fig.querySelectorAll('.sil').forEach(el => el.classList.toggle('hi', on)); if (on) lab.textContent = labText(it); } }
function livePlay(k){ liveStop(); const it = items[k]; if (!it || !it.fig || !it.F.tour) return;
  live.it = it; it.fig.querySelectorAll('.sil').forEach(el => el.classList.remove('hi'));
  it.onRead = () => { if (live.it === it && (items[act] === it || items[focused] === it)) lab.textContent = labText(it); };
  const stops = it.F.tour; live.tour = HL.tour(it.fst, stops, (i) => { if (stops[i] === null && live.it === it) setTimeout(liveStop, 60); }); }
function setActive(a){ if (a === act) return; act = a; const now = performance.now(), f = items[a >= 0 ? a : 0];
  items.forEach((it, k) => { const d = Math.hypot(it.cx - f.cx, it.cy - f.cy) / WS; tset(it.z, a < 0 ? 0 : k === a ? LIFT : clamp(LIFT * .4 * (1 - d / 12), 0, LIFT), now, d * 25); const on = k === a; it.pl.sil.classList.toggle('hi', on); it.halo.classList.toggle('hi', on); it.halo.classList.toggle('lo', !on); it.halo2.style.display = on ? '' : 'none'; it.desk.classList.toggle('hi', on); it.body.querySelectorAll('.sil').forEach(el => el.classList.toggle('hi', on)); if (it.fig && it !== live.it) it.fig.querySelectorAll('.sil').forEach(el => el.classList.toggle('hi', on)); });
  lab.textContent = a < 0 ? restText() : labText(items[a]); if (a >= 0 && window.__sel) window.__sel(typeof items[a].id === 'number' ? items[a].id : null); B.wake(); }
function hit([sx, sy]){ const [wx, wy] = unproj(C, sx, sy, PLH); let best = -1, bd = 1.25; items.forEach((it, k) => { if (HALLS.find(h => h.id === it.hall).floor !== HALLS[hallK].floor) return; const d = Math.hypot(wx - it.cx, wy - it.cy) / (it.h + m(.7)); if (d < bd){ bd = d; best = k; } }); return best; }
function setHall(i){ hallK = i; hallPts = HALLS[i].pts; hc = HALLS[i].c; const el = document.getElementById('m3hlHallName'); if (el) el.textContent = HALLS[i].name + ' · схема'; }
window.__hlHall = (id) => { const i = HALLS.findIndex(h => h.id === id); if (i < 0) return; setHall(i); setActive(-1); focus(-1); };
function focus(k){ focused = k; window.__hlFocused && window.__hlFocused(k >= 0 && typeof items[k].id === 'number' ? items[k].id : null); if (k >= 0 && items[k].hall !== HALLS[hallK].id) setHall(HALLS.findIndex(h => h.id === items[k].hall)); if (k < 0){ zf.t = HALLS[hallK].zoom || 1; fx.t = hc[0]; fy.t = hc[1]; } else { zf.t = items[k].kind === 'gagarin' ? 2.1 : items[k].fig ? 3.0 * clamp(FITALL.get(items[k].id) || 1.2, 1.05, 1.25) : 3.0; fx.t = items[k].cx; fy.t = items[k].cy; } B.wake(); document.getElementById('m3hlBack').hidden = k < 0; if (k >= 0) livePlay(k); else liveStop(); }
pointer(stage, { move:(p) => setActive(hit(p)), down:(p) => { const k = hit(p); setActive(k); if (k >= 0 && k === focused && items[k].fig) livePlay(k); else focus(k === focused ? -1 : k); }, leave:() => setActive(-1) });
document.getElementById('m3hlBack').onclick = () => focus(-1);
window.__hlAmenity = (t) => { const k = items.findIndex(i => i.id === 'a_' + t); if (k >= 0){ setActive(k); focus(k); } };   // t: in, kassa, gard, shop, wc, lift, cafe
window.__hlFocusId = (id) => { const k = items.findIndex(i => i.id === id); if (k >= 0){ setActive(k); focus(k); } };
draw(performance.now()); setActive(-1); if (window.RT && window.RT.on && window.ROUTES) window.__hlRoute(window.ROUTES[window.RT.key].ids, window.RT.i);
window.__hlPlay = () => {};
};
