/* Сайт Музея космонавтики — концепт. Общий слой: контент из той же базы, что приложение (../app/content.json),
   превью черновика админки (?preview=1), живое обновление, шапка, меню, подвал и баннеры приложения. */
(function(){
  'use strict';
  const W = window, prev = /[?&]preview=1/.test(location.search);
  /* ---------- контент */
  W.KC = null;
  try { const x = new XMLHttpRequest(); x.open('GET', '../app/content.json?t=' + Date.now(), false); x.send(null); if (x.status >= 200 && x.status < 300) W.KC = JSON.parse(x.responseText); } catch(e){}
  const draft = () => { try { const s = localStorage.getItem('kosmoDraft'); return s ? JSON.parse(s) : null; } catch(e){ return null; } };
  if (prev){ const d = draft(); if (d) W.KC = d; }
  const set = d => { if (!d || typeof d !== 'object') return; W.KC = d; run(); };
  addEventListener('message', e => { if (e.origin !== location.origin) return; const m = e.data; if (m && m.type === 'kosmo-content'){ S.focus = m.section || null; set(m.data); } });
  addEventListener('storage', e => { if (prev && e.key === 'kosmoDraft') set(draft()); });
  let ver = (W.KC && +W.KC.version) || 0;
  if (!prev) setInterval(() => { if (document.hidden) return; fetch('../app/content.json?t=' + Date.now(), { cache:'no-store' }).then(r => r.json()).then(d => { if ((+d.version || 0) > ver){ ver = +d.version; set(d); } }).catch(() => {}); }, 5000);

  /* ---------- помощники */
  const S = W.S = {};
  S.K = () => W.KC || {};
  S.prev = prev;
  S.E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  S.$ = (s, r) => (r || document).querySelector(s);
  S.MON = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  S.MONs = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  S.DN = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
  S.ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  S.pd = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
  S.dl = s => { const d = S.pd(s), t = new Date(); t.setHours(0, 0, 0, 0); const k = Math.round((d - t) / 864e5); return k === 0 ? 'Сегодня' : k === 1 ? 'Завтра' : d.getDate() + ' ' + S.MON[d.getMonth()]; };
  const num = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ''); return m ? +m[1] + m[2] / 60 : null; };
  S.hm = h => { const H = Math.floor(h), M = Math.round((h - H) * 60); return H + ':' + String(M).padStart(2, '0'); };
  S.hours = () => { const h = S.K().hours || {}, o = num(h.open) ?? 10, c = num(h.close) ?? 19, lc = num(h.lateClose) ?? 21, H = {}; for (let d = 0; d < 7; d++) H[d] = h.closedDay === d ? null : [o, (h.late || []).includes(d) ? lc : c]; return H; };
  S.status = () => { const H = S.hours(), now = new Date(), m = now.getHours() + now.getMinutes() / 60, td = H[now.getDay()];
    if (td && m >= td[0] && m < td[1]) return { open:true, t:`Сегодня открыто до ${S.hm(td[1])}`, s:'' };
    for (let i = 0; i < 8; i++){ const d = new Date(now); d.setDate(now.getDate() + i); const hh = H[d.getDay()]; if (hh && (i > 0 || m < hh[0])) return { open:false, t:'Сейчас закрыто', s:`откроется ${i === 0 ? 'сегодня' : i === 1 ? 'завтра' : S.DN[d.getDay()].toLowerCase()} в ${S.hm(hh[0])}` }; }
    return { open:false, t:'Закрыто', s:'' }; };
  S.price = () => +(S.K().tickets && S.K().tickets.priceFrom != null && S.K().tickets.priceFrom !== '' ? S.K().tickets.priceFrom : 500) || 0;
  S.buyUrl = () => (S.K().tickets && S.K().tickets.url) || 'https://kosmo-museum.ru/visit';
  S.events = () => { const today = S.ymd(new Date());
    return (S.K().events || []).filter(e => !e.day || (e.until || e.day) >= today).map(e => ({ e, long:!!(e.until && e.day <= today) || e.kind === 'Выставка', key:e.day ? (e.day < today ? today : e.day) + (e.time || '99') : '0',
      w:e.day ? (e.until && e.day <= today ? 'до ' + S.pd(e.until).getDate() + ' ' + S.MON[S.pd(e.until).getMonth()] : S.dl(e.day)) : e.date })).sort((a, b) => a.key.localeCompare(b.key)); };
  S.seats = n => { n = +n || 0; const a = n % 10, b = n % 100; return n + ' ' + (a === 1 && b !== 11 ? 'место' : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? 'места' : 'мест'); };
  /* правки, которые уже подсвечены, не мигают повторно */
  const seen = {}; S.changed = (k, v) => { const s = JSON.stringify(v ?? null), was = k in seen, c = seen[k] !== s; seen[k] = s; return was && c; };
  S.flash = el => { if (!el) return; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); };
  S.link = href => { if (!prev || !href || /^(https?:|#|mailto:|tel:)/.test(href)) return href; const [p, h] = href.split('#'); return p + (p.includes('?') ? '&' : '?') + 'preview=1' + (h ? '#' + h : ''); };

  /* ---------- экспонаты: база + правки из админки */
  S.EXD = null;
  S.loadEx = () => S.EXD ? Promise.resolve(S.EXD) : fetch('data/exhibits.json').then(r => r.json()).then(d => (S.EXD = d));
  const IMG = { 10:'../app/thumbs/10.webp', 11:'../app/thumbs/11.webp', 12:'../app/thumbs/12.webp', 13:'../app/thumbs/13.webp', 14:'../app/thumbs/14.webp', 16:'../app/thumbs/16.webp', 24:'../app/thumbs/24.webp', 36:'../app/g/mir_card.webp', 15:'../app/g/mars_card.webp', 23:'../app/g/venera_card.webp' };
  const BIG = { 36:'../app/g/mir_big.webp', 15:'../app/g/mars_big.webp', 23:'../app/g/venera_big.webp', 12:'../app/g/cover_12.webp', 10:'../app/g/cover_10.webp' };
  S.exImg = (id, big) => (big && BIG[id]) || IMG[id] || null;
  S.hallColor = hall => { const H = (S.EXD && S.EXD.halls) || {}; const n = String(hall || '').split(' · ').pop(); for (const k in H) if (n && (H[k].name === n || n.includes(H[k].name.split(' ')[0]))) return H[k].color; return '#9CC4EA'; };
  S.exList = () => { if (!S.EXD) return []; const ov = S.K().exhibits || [];
    return S.EXD.exhibits.map(e => { const o = ov.find(x => x.id === e.id) || {}, inf = JSON.parse(JSON.stringify(S.EXD.info[e.id] || {})), hide = o.hide || [];
      if (o.sum) inf.sum = o.sum; ['facts', 'nums', 'people'].forEach(k => { if (Array.isArray(o[k])) inf[k] = o[k]; if (hide.includes(k)) delete inf[k]; });
      return Object.assign({}, e, { title:o.title || e.title, short:o.short || e.short, desc:o.desc != null && o.desc !== '' ? o.desc : e.desc, dog:o.dog || e.dog, info:inf, chapters:e.id === 10 ? (o.chapters && o.chapters.length ? o.chapters : S.EXD.longread) : null }); }); };
  S.exCard = e => { const img = S.exImg(e.id), c = S.hallColor(e.hall);
    return `<a class="exc" href="${S.link('exhibit.html?id=' + e.id)}"><div class="im" style="${img ? `background-image:url(${img})` : `background:radial-gradient(120% 90% at 50% 10%,${c}33,#0f1114 70%)`}">${img ? '' : `<div class="ph" style="color:${c}">${S.E(e.short)}</div>`}</div><div class="tx"><b>${S.E(e.title)}</b><span>${S.E(e.hall)}</span></div></a>`; };

  /* ---------- иконки */
  const I = S.I = {
    cal:'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', ex:'<path d="M12 3l3 6v11H9V9z"/><path d="M9 14l-3 3v3h3M15 14l3 3v3h-3"/>',
    guide:'<circle cx="9" cy="7" r="3"/><path d="M3 20c.8-3.6 3-5.5 6-5.5s5.2 1.9 6 5.5"/><path d="M16 4.5l4 2-4 2zM16 4.5V12"/>', clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    group:'<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9.5" r="2.2"/><path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8M14.5 15c2.6 0 4.4 1.3 5 3.6"/>', shop:'<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    kids:'<circle cx="12" cy="12" r="8.5"/><path d="M9 10h.01M15 10h.01M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8"/>', ticket:'<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/>',
    phone:'<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>', pin:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>', play:'<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>', map:'<path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/>', menu:'<path d="M4 7h16M4 12h16M4 17h16"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
    star:'<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>', bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'
  };
  S.ico = (k, w) => `<svg viewBox="0 0 24 24" width="${w || 20}" height="${w || 20}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[k]}</svg>`;

  /* ---------- шапка, меню, подвал, баннеры */
  const NAV = [['afisha.html', 'Афиша'], ['exhibits.html', 'Экспонаты'], ['visit.html', 'Посещение'], ['groups.html', 'Группам и школам'], ['kids.html', 'Детям'], ['shop.html', 'Магазин']];
  const here = (location.pathname.split('/').pop() || 'index.html');
  S.appUrl = (id) => '../app/' + (id ? '?ex=' + id : '');
  S.appBanner = (mode) => mode === 'slim'
    ? `<a class="appban slim" href="${S.appUrl()}" target="_blank" rel="noopener"><img class="ic" src="../app/g/icon-192.png" alt=""><div><b>Гид «Музей в кармане»</b><span>Маршрут, карта и рассказы у экспонатов — в телефоне</span></div><span class="go btn sm vio">Открыть</span></a>`
    : `<div class="appban" data-kc="app"><div class="lab vio">Новое · гид в телефоне</div><h3>Музей в кармане</h3><p>Белка проведёт по залам шаг за шагом, расскажет у каждого экспоната и поставит печать в космический паспорт. Работает в браузере, без установки.</p>
      <div class="feats"><span>Экскурсия 45 мин · 1 ч · 2 ч</span><span>3D-карта двух этажей</span><span>Аудиогид</span><span>Паспорт с печатями</span><span>Билет в телефоне</span></div>
      <div class="acts"><a class="btn vio" href="${S.appUrl()}" target="_blank" rel="noopener">${S.ico('phone', 18)}Открыть гид</a><img class="qr" src="assets/qr-app.svg" alt="QR-код гида"><span class="qrt">Наведите камеру телефона — гид откроется сразу</span></div>
      <img class="phone" src="../app/g/home-shot.webp" alt="Главный экран гида «Музей в кармане»"></div>`;
  function chrome(){
    const st = S.status();
    const hdr = document.createElement('header'); hdr.className = 'hdr';
    hdr.innerHTML = `<div class="wrap"><a class="logo" href="${S.link('index.html')}" aria-label="Музей космонавтики — на главную"><img src="assets/logo.svg" alt="Музей космонавтики"></a>
      <nav>${NAV.map(([h, n]) => `<a href="${S.link(h)}" class="${here === h ? 'on' : ''}">${n}</a>`).join('')}</nav><div class="sp"></div>
      <span class="st" data-kc="hours"><i class="dot ${st.open ? '' : 'off'}"></i><span id="hdrSt">${S.E(st.t)}</span></span><a class="lang" href="#">EN</a>
      <a class="btn sm or" id="hdrBuy" href="${S.E(S.buyUrl())}" target="_blank" rel="noopener">Билеты</a><button class="burger" aria-label="Меню">${S.ico('menu')}</button></div>`;
    document.body.prepend(hdr);
    const menu = document.createElement('div'); menu.className = 'menu';
    menu.innerHTML = `<div class="wrap" style="padding:0"><div style="display:flex;align-items:center;gap:10px;margin:4px 4px 8px"><i class="dot ${st.open ? '' : 'off'}"></i><span style="font-weight:600">${S.E(st.t)}</span><span style="color:var(--mu)">${S.E(st.s)}</span></div>
      ${NAV.map(([h, n]) => `<a class="mi" href="${S.link(h)}">${n}<span>→</span></a>`).join('')}
      <div class="sub"><a href="${S.link('about.html')}">О музее</a><a href="#">Новости</a><a href="#">Дом-музей Королёва</a><a href="#">Пресс-служба</a><a href="#">Образование</a><a href="#">English</a></div>${S.appBanner('slim')}</div>`;
    document.body.append(menu);
    hdr.querySelector('.burger').onclick = () => { const on = menu.classList.toggle('on'); hdr.querySelector('.burger').innerHTML = S.ico(on ? 'x' : 'menu'); document.body.style.overflow = on ? 'hidden' : ''; };
    const ftr = document.createElement('footer'); ftr.className = 'ftr';
    ftr.innerHTML = `<div class="wrap"><div class="g"><div><img src="assets/logo.svg" alt="Музей космонавтики" style="height:40px;margin-bottom:14px"><div>Москва, проспект Мира, 111 · метро ВДНХ</div><div id="ftrHrs" style="margin-top:6px"></div></div>
      <div><h4>Посетителям</h4><a href="${S.link('visit.html')}">Часы и цены</a><a href="${S.link('afisha.html')}">Афиша</a><a href="${S.link('exhibits.html')}">Экспонаты</a><a href="${S.link('groups.html')}">Группам и школам</a></div>
      <div><h4>Музей</h4><a href="${S.link('about.html')}">О музее</a><a href="#">Дом-музей Королёва</a><a href="#">Пресс-служба</a><a href="#">Документы</a></div>
      <div>${S.appBanner('slim')}</div></div>
      <div class="concept">Концепт сайта студии Perasperadastra для Музея космонавтики — не официальный сайт. Тексты, часы, афиша и цены приходят из общей админки с приложением; покупка билетов — на сайте Мосбилета.</div></div>`;
    document.body.append(ftr);
    if (!document.body.dataset.noappbar){ const bar = document.createElement('div'); bar.className = 'appbar';
      bar.innerHTML = `<a class="t" id="barBuy" href="${S.E(S.buyUrl())}" target="_blank" rel="noopener">${S.ico('ticket', 18)}<span id="barPrice"></span></a><a class="g" href="${S.appUrl()}" target="_blank" rel="noopener">${S.ico('phone', 18)}Гид</a>`;
      document.body.append(bar); document.body.classList.add('has-appbar'); }
    if (prev){ const b = document.createElement('div'); b.className = 'pvbadge'; b.textContent = 'Черновик из админки'; document.body.append(b); }
  }
  function chromeUpdate(){ const st = S.status(), H = S.hours();
    const s = S.$('#hdrSt'); if (s){ s.textContent = st.t; s.previousElementSibling.className = 'dot ' + (st.open ? '' : 'off'); }
    ['#hdrBuy', '#barBuy'].forEach(q => { const a = S.$(q); if (a) a.href = S.buyUrl(); });
    const bp = S.$('#barPrice'); if (bp) bp.textContent = `Билет · ${S.price().toLocaleString('ru')} ₽`;
    const fh = S.$('#ftrHrs'); if (fh){ const d = [1, 2, 3, 4, 5, 6, 0]; const g = {}; d.forEach(k => { const v = H[k] ? S.hm(H[k][0]) + '–' + S.hm(H[k][1]) : 'выходной'; (g[v] = g[v] || []).push(S.DN[k].toLowerCase()); }); fh.textContent = Object.entries(g).map(([v, ds]) => ds.join(', ') + ' — ' + v).join(' · '); } }

  /* ---------- страница */
  const pages = []; S.page = fn => { pages.push(fn); if (ready) fn(); };
  let ready = false;
  const fixLinks = () => { if (!prev) return; document.querySelectorAll('a[href]').forEach(a => { const h = a.getAttribute('href'); if (h && !/preview=1/.test(h) && !/^(https?:|#|mailto:|tel:|\.\.\/)/.test(h)) a.setAttribute('href', S.link(h)); }); };
  function run(){ chromeUpdate(); pages.forEach(f => { try { f(); } catch(e){ console.warn(e); } }); fixLinks();
    const f = S.focus; S.focus = null; const el = f && prev && S.$(`[data-kc~="${f}"]`); if (el) el.scrollIntoView({ block:'center', behavior:'smooth' }); }
  S.run = run;
  addEventListener('DOMContentLoaded', () => { chrome(); ready = true; run(); });
})();
