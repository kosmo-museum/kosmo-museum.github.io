// 2D-риг Белки и Стрелки: стикерный персонаж в SVG, каждая часть — отдельная «кость».
// mountDog2D(box) -> { setMood(m, holdMs), setWho('belka'|'strelka'), mouth(v), look(x, y), destroy() }
window.mountDog2D = (box) => {
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#3b2a24';
  const PAL = {
    belka:   { fur:'#F7F1E7', fur2:'#E9DFD0', muzzle:'#FFFFFF', ear:'#F7F1E7', inner:'#F2C3B0', patch:'none', vest:'#E2552B', vest2:'#B93E1C', brow:'#C9B49C' },
    strelka: { fur:'#FBF7F0', fur2:'#EDE4D7', muzzle:'#FFFFFF', ear:'#C77A3C', inner:'#E9A773', patch:'#C77A3C', vest:'#3F9C7A', vest2:'#2C7259', brow:'#9C5A2A' } };
  box.innerHTML = `
<svg viewBox="0 0 300 380" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style="display:block;overflow:visible">
  <defs>
    <radialGradient id="dIris" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#7a4a32"/><stop offset=".55" stop-color="#3a2219"/><stop offset="1" stop-color="#1d110c"/></radialGradient>
    <radialGradient id="dGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FF8A3D" stop-opacity=".55"/><stop offset="1" stop-color="#FF8A3D" stop-opacity="0"/></radialGradient>
  </defs>
  <ellipse cx="150" cy="170" rx="150" ry="140" fill="url(#dGlow)"/>
  <g id="tail"><path id="tailP" d="M236 330 C 274 320 286 276 268 256 C 260 272 250 296 232 308 Z" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/></g>
  <g id="body">
    <path id="bodyP" d="M34 410 C 38 318 90 236 150 234 C 210 236 262 318 266 410 Z" stroke="${INK}" stroke-width="3.5"/>
    <path id="vestP" d="M46 410 C 52 336 92 296 122 292 Q150 312 178 292 C 208 296 248 336 254 410 Z" stroke="${INK}" stroke-width="3.5"/>
    <path id="vestS" d="M150 308 L150 410" stroke-width="3" stroke-dasharray="5 6" fill="none"/>
    <circle cx="150" cy="302" r="8" fill="#E7E2DA" stroke="${INK}" stroke-width="3"/>
    <g transform="translate(200 352) rotate(-8)"><circle r="14" fill="#F4EDE3" stroke="${INK}" stroke-width="2.5"/><circle r="3.4" fill="${INK}"/><ellipse rx="10.5" ry="4.2" fill="none" stroke="${INK}" stroke-width="1.8" transform="rotate(-25)"/></g>
  </g>
  <g id="head">
    <g id="earL"><path id="earLP" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path id="earLI"/><path id="earLF" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/></g>
    <g id="earR"><path id="earRP" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path id="earRI"/><path id="earRF" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/></g>
    <path id="headP" d="M150 96 C 198 96 230 126 233 164 C 236 190 226 208 214 218 L 224 228 L 206 229 L 210 238 L 190 235 C 178 243 164 246 150 246 C 136 246 122 243 110 235 L 90 238 L 94 229 L 76 228 L 86 218 C 74 208 64 190 67 164 C 70 126 102 96 150 96 Z" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path id="patchL" d="M86 128 C 104 112 132 118 140 140 C 144 160 134 180 116 182 C 96 182 82 166 80 150 C 79 140 81 134 86 128 Z"/>
    <path id="patchTop" d="M132 98 C 140 96 160 96 168 98 C 166 112 158 124 150 130 C 142 124 134 112 132 98 Z"/>
    <ellipse id="muzzle" cx="150" cy="200" rx="42" ry="32"/>
    <ellipse id="chkL" cx="104" cy="196" rx="12" ry="7" fill="#FF8C7A" opacity="0"/><ellipse id="chkR" cx="196" cy="196" rx="12" ry="7" fill="#FF8C7A" opacity="0"/>
    <g id="eyeL"><g class="eo"><ellipse rx="14" ry="16" fill="url(#dIris)" stroke="${INK}" stroke-width="2.5"/><g class="pu"><circle cx="4" cy="-6" r="4.6" fill="#fff"/><circle cx="-5" cy="6" r="2.2" fill="#fff" opacity=".9"/></g></g><path class="ec" d="M-14 2 Q0 -14 14 2" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity="0"/><path class="es" d="M-13 0 Q0 6 13 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity="0"/></g>
    <g id="eyeR"><g class="eo"><ellipse rx="14" ry="16" fill="url(#dIris)" stroke="${INK}" stroke-width="2.5"/><g class="pu"><circle cx="4" cy="-6" r="4.6" fill="#fff"/><circle cx="-5" cy="6" r="2.2" fill="#fff" opacity=".9"/></g></g><path class="ec" d="M-14 2 Q0 -14 14 2" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity="0"/><path class="es" d="M-13 0 Q0 6 13 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity="0"/></g>
    <path id="browL" fill="none" stroke-width="4" stroke-linecap="round"/><path id="browR" fill="none" stroke-width="4" stroke-linecap="round"/>
    <path id="mouthO" fill="#6b2226" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse id="tongue" cx="150" cy="222" rx="10" ry="8" fill="#F07D8A" stroke="${INK}" stroke-width="2.5"/>
    <path id="mouthL" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M136 186 Q150 179 164 186 Q162 198 150 201 Q138 198 136 186 Z" fill="#2a211e" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse cx="145" cy="186" rx="5" ry="2.4" fill="#fff" opacity=".7"/>
  </g>
  <g id="pawL"><rect x="-17" y="-34" width="34" height="74" rx="17" stroke="${INK}" stroke-width="3.5"/><path d="M-7 -30 v8 M7 -30 v8" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/></g>
  <g id="pawR"><rect x="-17" y="-34" width="34" height="74" rx="17" stroke="${INK}" stroke-width="3.5"/><path d="M-7 -30 v8 M7 -30 v8" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/></g>
  <g id="card" opacity="0"><rect x="-56" y="-44" width="112" height="80" rx="14" fill="#14161A" stroke="${INK}" stroke-width="3.5"/><circle cx="-24" cy="-6" r="20" fill="#2a2e36"/><circle cx="-24" cy="-6" r="20" fill="none" stroke="#9aa2ad" stroke-width="2"/><circle cx="-30" cy="-12" r="5" fill="#cfe3ff" opacity=".8"/><text x="6" y="-10" fill="#FF8A4A" font-family="JetBrains Mono,monospace" font-size="9" letter-spacing="1">ЗАЛ 1</text><text x="6" y="6" fill="#ECEEF1" font-family="Inter,sans-serif" font-size="13" font-weight="500">«Восток»</text><text x="6" y="22" fill="#8E95A0" font-family="Inter,sans-serif" font-size="10">идём смотреть</text></g>
  <g id="fx">
    <g id="bark" opacity="0"><path d="M206 64 h64 a14 14 0 0 1 14 14 v20 a14 14 0 0 1 -14 14 h-40 l-14 14 v-14 h-10 a14 14 0 0 1 -14 -14 v-20 a14 14 0 0 1 14 -14 z" fill="#fff" stroke="${INK}" stroke-width="3"/><text x="238" y="95" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="18" fill="${INK}">Гав!</text></g>
    <g id="think" opacity="0"><circle cx="218" cy="98" r="5" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="230" cy="80" r="8" fill="#fff" stroke="${INK}" stroke-width="2.5"/><ellipse cx="256" cy="52" rx="26" ry="22" fill="#fff" stroke="${INK}" stroke-width="3"/><text x="256" y="61" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="24" fill="#E2552B">?</text></g>
    <g id="stars" opacity="0" fill="#FFD27A" stroke="${INK}" stroke-width="2"><path d="M60 92 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5z"/><path d="M244 120 l4 8 8 4 -8 4 -4 8 -4 -8 -8 -4 8 -4z"/><path d="M226 54 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z"/></g>
    <g id="hearts" opacity="0" fill="#FF6A6A" stroke="${INK}" stroke-width="2"><path d="M70 110 c-6 -10 -20 -4 -14 8 l14 12 14 -12 c6 -12 -8 -18 -14 -8z"/><path d="M236 92 c-4 -7 -14 -3 -10 6 l10 8 10 -8 c4 -9 -6 -13 -10 -6z"/></g>
    <g id="zzz" opacity="0" font-family="Inter,sans-serif" font-weight="700" fill="#cfd6e4"><text x="214" y="96" font-size="16">z</text><text x="230" y="76" font-size="21">z</text><text x="250" y="52" font-size="27">Z</text></g>
    <g id="tear" opacity="0"><path d="M0 0 C 4 7 6 11 6 14 a6 6 0 0 1 -12 0 c0 -3 2 -7 6 -14 z" fill="#8ec8ff" stroke="${INK}" stroke-width="2"/></g>
  </g>
</svg>`;
  const $ = s => box.querySelector(s), svg = box.querySelector('svg');
  const el = { head:$('#head'), body:$('#body'), tail:$('#tail'), earL:$('#earL'), earR:$('#earR'), eyeL:$('#eyeL'), eyeR:$('#eyeR'), browL:$('#browL'), browR:$('#browR'), mouthL:$('#mouthL'), mouthO:$('#mouthO'), tongue:$('#tongue'), pawL:$('#pawL'), pawR:$('#pawR'), card:$('#card'), bark:$('#bark'), think:$('#think'), stars:$('#stars'), hearts:$('#hearts'), zzz:$('#zzz'), tear:$('#tear'), chkL:$('#chkL'), chkR:$('#chkR') };
  let who = 'belka';
  // ear shapes: Belka upright and pointed, Strelka a softer ear with the tip folded forward
  const EAR = {
    belka:   { o:'M96 134 C 84 102 86 70 100 46 C 120 60 138 86 142 112 Z', i:'M104 122 C 98 100 100 78 106 64 C 118 78 128 94 130 110 Z', f:'' },
    strelka: { o:'M94 134 C 84 106 88 80 100 62 C 118 70 136 90 142 112 Z', i:'M104 122 C 99 104 101 88 107 78 C 117 88 126 100 129 112 Z', f:'M100 62 C 118 70 132 84 138 98 C 126 104 110 104 98 98 C 100 86 100 74 100 62 Z' } };
  function setWho(w){ who = w; const P = PAL[w], E = EAR[w];
    $('#headP').setAttribute('fill', P.fur); $('#bodyP').setAttribute('fill', P.fur); $('#tailP').setAttribute('fill', w === 'belka' ? P.fur : P.patch);
    $('#muzzle').setAttribute('fill', P.muzzle); $('#vestP').setAttribute('fill', P.vest); $('#vestS').setAttribute('stroke', P.vest2);
    $('#patchL').setAttribute('fill', P.patch); $('#patchTop').setAttribute('fill', P.patch);
    $('#patchL').style.display = $('#patchTop').style.display = w === 'strelka' ? '' : 'none';
    for (const s of ['L', 'R']){ $('#ear' + s + 'P').setAttribute('d', E.o); $('#ear' + s + 'P').setAttribute('fill', P.ear); $('#ear' + s + 'I').setAttribute('d', E.i); $('#ear' + s + 'I').setAttribute('fill', P.inner);
      $('#ear' + s + 'F').setAttribute('d', E.f); $('#ear' + s + 'F').setAttribute('fill', P.ear); }
    el.browL.setAttribute('stroke', P.brow); el.browR.setAttribute('stroke', P.brow);
    for (const p of [el.pawL, el.pawR]) p.querySelector('rect').setAttribute('fill', P.fur); }
  setWho('belka');
  // ---- expression parameters; each mood is a target, the rig eases toward it
  const N = { tilt:0, bob:0, earL:0, earR:0, eyeOpen:1, eyeBig:0, happy:0, sleepy:0, brow:0, browSad:0, smile:.5, open:0, tongue:0, lookX:0, lookY:0, cheek:0,
    pawL:0, pawR:0, wave:0, point:0, chin:0, hold:0, wag:.3, bark:0, think:0, stars:0, hearts:0, zzz:0, tear:0, card:0 };
  const MOODS = {
    idle:{},
    hello:{ tilt:.08, smile:1, open:.35, earL:-.1, earR:-.1, wave:1, pawR:1, cheek:.6, wag:1, brow:.4 },
    joy:{ happy:1, smile:1, open:.8, tongue:1, earL:.35, earR:.35, cheek:1, wag:1.6, hearts:1, bob:1 },
    wow:{ eyeBig:1, brow:1, open:.6, smile:.2, earL:-.25, earR:-.25, stars:1, tongue:0 },
    think:{ tilt:-.12, lookX:.8, lookY:-.9, brow:.3, browSad:-.3, smile:.25, chin:1, pawL:1, think:1, earR:.25 },
    listen:{ tilt:.16, earL:-.3, earR:.3, brow:.35, smile:.6, lookX:-.2 },
    sad:{ earL:.9, earR:.9, browSad:1, eyeOpen:.7, smile:-.6, lookY:.6, tilt:.06, tear:1, wag:0 },
    show:{ point:1, pawR:1, smile:.9, open:.3, lookX:1, lookY:.2, card:1, earL:-.1, earR:-.1, cheek:.4, wag:1 },
    bark:{ open:1, smile:.6, bark:1, earL:-.25, earR:-.25, brow:.6, wag:1.4 },
    sleep:{ sleepy:1, tilt:.18, earL:.5, earR:.5, smile:.3, zzz:1, wag:0 },
    talk:{ smile:.7, brow:.3, earL:-.05, earR:-.05, cheek:.3, wag:.8 } };
  const C = {...N}; let target = {...N}, mood = 'idle', until = 0, extra = 0, ptr = [0, 0], alive = true;
  function setMood(m, hold = 0){ mood = m; target = {...N, ...(MOODS[m] || {})}; until = hold ? performance.now() + hold : 0; }
  const ease = (k) => { for (const key in C) C[key] += (target[key] - C[key]) * k; };
  let nextBlink = 1.2, blinkT = -9, twT = -9, twSide = 0, nextTw = 3; const t0 = performance.now();
  const T = (e, s) => e.setAttribute('transform', s), O = (e, v) => e.setAttribute('opacity', Math.max(0, Math.min(1, v)).toFixed(3));
  function frame(now){ if (!alive) return; requestAnimationFrame(frame); const t = (now - t0) / 1000;
    if (until && now > until){ until = 0; setMood('idle'); }
    ease(.12);
    if (t > nextBlink){ blinkT = t; nextBlink = t + 2.2 + Math.random() * 3.2; }
    if (t > nextTw){ twT = t; twSide = Math.random() < .5 ? 0 : 1; nextTw = t + 2.5 + Math.random() * 4; }
    const blink = Math.max(0, 1 - Math.abs(t - blinkT - .07) / .07) * (1 - C.sleepy);
    const tw = Math.max(0, Math.sin(Math.min(1, (t - twT) / .3) * Math.PI)) * .35;
    const breathe = Math.sin(t * 2.1), bounce = C.bob * Math.abs(Math.sin(t * 7)) * 6;
    const talk = mood === 'talk' ? Math.max(0, Math.sin(t * 14) * Math.sin(t * 3.3 + 1)) * .7 : 0;
    const open = Math.min(1, C.open + talk + extra);
    // body, tail
    T(el.body, `translate(0 ${(-bounce * .4).toFixed(2)}) translate(150 400) scale(${1 + breathe * .008} ${1 + breathe * .012}) translate(-150 -400)`);
    T(el.tail, `rotate(${(Math.sin(t * (4 + C.wag * 8)) * (8 + C.wag * 14)).toFixed(2)} 234 318)`);
    // head: tilt, bob, follows the pointer
    const lx = Math.max(-1, Math.min(1, C.lookX + ptr[0] * .8)), ly = Math.max(-1, Math.min(1, C.lookY + ptr[1] * .8));
    const hx = lx * 6, hy = ly * 4 + Math.sin(t * 1.6) * 1.5 - bounce;
    T(el.head, `translate(${hx.toFixed(2)} ${hy.toFixed(2)}) rotate(${((C.tilt + Math.sin(t * .7) * .015) * 57.3).toFixed(2)} 150 246)`);
    // ears (rotate about the base; positive = flop down and out)
    T(el.earL, `rotate(${(-(C.earL + (twSide === 0 ? tw : 0)) * 38).toFixed(2)} 120 118)`);
    T(el.earR, `translate(300 0) scale(-1 1) rotate(${(-(C.earR + (twSide === 1 ? tw : 0)) * 38).toFixed(2)} 120 118)`);
    // eyes: open/blink/big, closed-happy arcs, sleepy lines, pupils follow the gaze
    const sy = Math.max(.06, C.eyeOpen * (1 - blink) * (1 - C.happy) * (1 - C.sleepy)) * (1 + C.eyeBig * .22), sx = 1 + C.eyeBig * .12;
    for (const [e, cx] of [[el.eyeL, 120], [el.eyeR, 180]]){ T(e, `translate(${cx} 160)`);
      const eo = e.querySelector('.eo'); T(eo, `scale(${sx.toFixed(3)} ${sy.toFixed(3)})`); O(eo, 1 - Math.max(C.happy, C.sleepy) * 1.4);
      T(eo.querySelector('.pu'), `translate(${(lx * 3).toFixed(2)} ${(ly * 3).toFixed(2)})`);
      O(e.querySelector('.ec'), C.happy * 1.4); O(e.querySelector('.es'), C.sleepy * 1.4); }
    // brows: raise, sad (inner ends up)
    const br = C.brow * 7, bs = C.browSad * 7;
    el.browL.setAttribute('d', `M106 ${136 - br + bs * .3} Q120 ${129 - br} 134 ${136 - br - bs}`);
    el.browR.setAttribute('d', `M194 ${136 - br + bs * .3} Q180 ${129 - br} 166 ${136 - br - bs}`);
    O(el.chkL, C.cheek * .55); O(el.chkR, C.cheek * .55);
    // mouth: smile line + open shape + tongue
    const s = C.smile, cy = 210 - s * 6, my = 214 + s * 7;
    el.mouthL.setAttribute('d', `M150 200 L150 208 M${126 - s * 4} ${cy} Q138 ${my} 150 208 Q162 ${my} ${174 + s * 4} ${cy}`);
    const oh = open * 30;
    el.mouthO.setAttribute('d', `M${134 - s * 2} 211 Q150 ${213 + oh * 1.25} ${166 + s * 2} 211 Q150 ${214 + oh * .15} ${134 - s * 2} 211 Z`); O(el.mouthO, open > .03 ? 1 : 0);
    el.tongue.setAttribute('transform', `translate(150 ${(212 + open * 14 + C.tongue * 6).toFixed(2)}) scale(${(.6 + C.tongue * .5).toFixed(2)} ${(.3 + C.tongue * .8).toFixed(2)}) translate(-150 -222)`);
    O(el.tongue, Math.min(1, open * 1.5) * (C.tongue > .05 || open > .45 ? 1 : 0));
    // paws: hidden below; wave, point, chin, hold
    const pr = C.pawR, pl = C.pawL;
    const waveA = Math.sin(t * 9) * 18 * C.wave, ptA = -62 * C.point;
    T(el.pawR, `translate(${(214 + C.point * 4).toFixed(1)} ${(400 - pr * 150 + C.point * 34).toFixed(1)}) rotate(${(waveA + ptA + 8).toFixed(2)})`);
    T(el.pawL, `translate(${(96 + C.chin * 20).toFixed(1)} ${(400 - pl * 146).toFixed(1)}) rotate(${(-8 + C.chin * 22).toFixed(2)})`);
    // props
    T(el.card, `translate(${(226 - (1 - C.card) * 30).toFixed(1)} 268) rotate(${(6 - C.card * 4).toFixed(2)}) scale(${(.55 + C.card * .3).toFixed(3)})`); O(el.card, C.card);
    O(el.bark, C.bark); T(el.bark, `translate(0 ${((1 - C.bark) * 10).toFixed(1)})`);
    O(el.think, C.think); T(el.think, `translate(0 ${(Math.sin(t * 2) * 2).toFixed(2)})`);
    O(el.stars, C.stars); T(el.stars, `rotate(${(Math.sin(t * 3) * 4).toFixed(2)} 150 100)`);
    O(el.hearts, C.hearts); T(el.hearts, `translate(0 ${(-((t * 18) % 24)).toFixed(1)})`);
    O(el.zzz, C.zzz); T(el.zzz, `translate(${(Math.sin(t) * 3).toFixed(2)} ${(-((t * 6) % 10)).toFixed(1)})`);
    O(el.tear, C.tear * (((t * .7) % 1) < .8 ? 1 : 0)); T(el.tear, `translate(${(108 + hx).toFixed(1)} ${(176 + hy + ((t * .7) % 1) * 30).toFixed(1)})`);
  }
  requestAnimationFrame(frame);
  return { setMood, setWho, mouth(v){ extra = v; }, look(x, y){ ptr = [x, y]; }, destroy(){ alive = false; box.innerHTML = ''; } };
};
