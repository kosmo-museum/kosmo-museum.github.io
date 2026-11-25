// ---- типографика: неразрывный пробел после коротких слов, перед тире и между числом и единицей
(() => {
  const SH = /(^|[\s(«„"—–-])(в|во|к|ко|с|со|у|о|об|обо|и|а|но|да|на|по|за|из|от|до|не|ни|же|ли|бы|для|при|без|над|под|про|или|что|как|его|её|их|мы|вы|ты|я|он|она|оно|они|все|так|уже|ещё|где|кто|это|то|те|та|тот|чем)\s+/gi;
  const fix = (t) => { let o = t, p; do { p = o; o = o.replace(SH, (m, a, w) => a + w + ' '); } while (o !== p);
    o = o.replace(/[\s\u00a0]·[\s\u00a0]/g, '\u00a0/ '); /* v195: точки-разделители «·» показываем как «/» (просьба Саши) */
    return o.replace(/\s+([—–])\s/g, ' $1 ').replace(/(\d)\s+(км|м|мин|ч|кг|см|г|₽|%|м²|тыс\.|млн|витков|дня|дней|лет|года|год|чел\.)(?=[\s.,;:!?)»]|$)/g, '$1 $2'); };
  const SKIP = { SCRIPT:1, STYLE:1, TEXTAREA:1, INPUT:1, CODE:1, PRE:1 };
  const walk = (n) => { if (n.nodeType === 3){ const v = n.nodeValue; if (v && /\s/.test(v)){ const f = fix(v); if (f !== v) n.nodeValue = f; } return; }
    if (n.nodeType === 1 && !SKIP[n.tagName]) for (let c = n.firstChild; c; c = c.nextSibling) walk(c); };
  const run = () => walk(document.body);
  new MutationObserver(ms => { for (const m of ms){ if (m.type === 'characterData') walk(m.target); else m.addedNodes.forEach(walk); } }).observe(document.body, { childList:true, subtree:true, characterData:true });
  run(); window.__typo = fix;
})();
