/* ÇİZİM — sahnedeki her şey çizim listesine: televizyon (tek ozel), anten yığını, izleyiciler, vuranın açık
 * avucu / yumruğu, fırlayan düğme. Listenin üstüne (oyunUst): hız izi, çarpma yıldızı ve yazısı, toz,
 * "Tut, kıpırdama!" seslenişi, basamak değişince ekranın üstünde çıkan yazı, usta işinde spot ışığı.
 */
function oyunCiz() {
  ekranGuncelle();
  const tvd = tvP([0, 1.0, TV_ARKA]).d;
  ozel(tvd, tvCiz);
  const sd = pr([(SEDIR.x0 + SEDIR.x1) / 2, SEDIR.h, SEDIR.z0]);
  if (sd.ok)
    ozel(sd.d + 0.05, sedirCiz);
  const ky = pr([KULE.x, 0.5, KULE.z]);
  if (ky.ok)
    ozel(ky.d, kuleCiz);
  for (const k of D.oy.values()) {
    if (!insanEkle(k))
      continue;
    // ustanın adı büyük levhada yazılır (ustaAdi), küçük etiketi çıkmasın
    if (D.usta && D.usta.k === k)
      k.et = null;
    // Minderdeki çömelenlerin adı ayaklarının altına yazılır: başlarının üstü ekranın alt kenarıdır.
    else if (k.et && k.tur === 'comel' && !k.is && k.yer > 0.5 && k !== D.lider) {
      const a = pr([k.x, 0, k.z - 0.16]);
      if (a.ok)
        k.et.y = Math.min(a.y + 30, ALAN_ALT - 4);
    }
    if (k.el) {
      const ha = k.p[k.el.yan < 0 ? 'haR' : 'haL'], dr = k.p[k.el.yan < 0 ? 'drR' : 'drL'];
      if (ha && ha.ok && dr && dr.ok)
        ozel(ha.d - 0.03, () => elCiz(k, ha, dr));
    }
  }
  if (D.dugme) {
    const p = pr([D.dugme.x, D.dugme.y, D.dugme.z]);
    if (p.ok)
      ozel(p.d, () => dugmeUcan(p));
  }
}

/* ---- anten yığını: sandalye + tabure + ansiklopedi ---- */
function kuleCiz() {
  const x = KULE.x, z = KULE.z, sal = D.tv.kule * 0.06, lw = Math.max(1.5, pr([x, 0.5, z]).s * 0.016);
  const P = (dx, y, dz) => pr([x + dx + sal * y, y, z + dz]);
  c.strokeStyle = MUREKKEP;
  c.lineWidth = lw;
  // kahvehane sandalyesi: dört ayak, hasır oturak, eğik arkalık
  const ayak = (dx, dz) => {
    const a = P(dx, 0.46, dz), b = P(dx * 1.08, 0, dz * 1.08);
    kapYol(a.x, a.y, 0.022 * a.s, b.x, b.y, 0.018 * b.s);
    c.fillStyle = '#4a2716';
    c.fill();
    c.stroke();
  };
  ayak(-0.19, 0.19);
  ayak(0.19, 0.19);
  // arkalık
  const ar = [P(-0.19, 0.46, 0.2), P(0.19, 0.46, 0.2), P(0.21, 0.98, 0.26), P(-0.21, 0.98, 0.26)];
  cokgen(ar, null, lw);
  for (const t of [0.35, 0.7]) {
    const a = P(-0.2, lerp(0.46, 0.98, t), lerp(0.2, 0.26, t)), b = P(0.2, lerp(0.46, 0.98, t), lerp(0.2, 0.26, t));
    kapYol(a.x, a.y, 0.03 * a.s, b.x, b.y, 0.03 * b.s);
    c.fillStyle = '#5a3019';
    c.fill();
    c.stroke();
  }
  const ot = [P(-0.21, 0.48, -0.2), P(0.21, 0.48, -0.2), P(0.21, 0.48, 0.2), P(-0.21, 0.48, 0.2)];
  cokgen(ot, '#d9b45e', lw);
  c.strokeStyle = 'rgba(120,80,20,.6)';
  c.lineWidth = lw * 0.5;
  for (let i = 1; i < 6; i++) {
    const a = P(-0.21 + i * 0.07, 0.48, -0.2), b = P(-0.21 + i * 0.07, 0.48, 0.2);
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
  }
  c.strokeStyle = MUREKKEP;
  c.lineWidth = lw;
  cokgen([P(-0.21, 0.48, -0.2), P(0.21, 0.48, -0.2), P(0.21, 0.43, -0.2), P(-0.21, 0.43, -0.2)], '#5a3019', lw);
  ayak(-0.19, -0.19);
  ayak(0.19, -0.19);
  // üç ayaklı tabure
  for (const a of [-0.13, 0.13]) {
    const p = P(a, 0.8, -0.04), q = P(a * 1.25, 0.49, -0.06);
    kapYol(p.x, p.y, 0.02 * p.s, q.x, q.y, 0.016 * q.s);
    c.fillStyle = '#7a4a2a';
    c.fill();
    c.stroke();
  }
  const tm = P(0, 0.82, 0);
  c.beginPath();
  c.ellipse(tm.x, tm.y, 0.19 * tm.s, 0.08 * tm.s, 0, 0, TAU);
  c.fillStyle = '#b07a46';
  c.fill();
  c.stroke();
  c.beginPath();
  c.ellipse(tm.x, tm.y + 0.03 * tm.s, 0.19 * tm.s, 0.08 * tm.s, 0, 0, Math.PI);
  c.stroke();
  // kalın ansiklopedi: kırmızı cilt, yaldızlı sırt
  const k0 = [P(-0.15, 0.97, -0.1), P(0.15, 0.97, -0.1), P(0.15, 0.83, -0.1), P(-0.15, 0.83, -0.1)];
  const k1 = [P(-0.15, 0.97, -0.1), P(0.15, 0.97, -0.1), P(0.15, 0.97, 0.12), P(-0.15, 0.97, 0.12)];
  cokgen(k1, '#f1e6cc', lw);
  cokgen(k0, '#a3262a', lw);
  const ys = P(0, 0.9, -0.105);
  c.fillStyle = '#e7c46a';
  c.fillRect(ys.x - 0.1 * ys.s, ys.y - 0.012 * ys.s, 0.2 * ys.s, 0.024 * ys.s);
}

/* ---- açık avuç ve yumruk ---- */
// Tokatta açık avuç: dört parmak yelpaze, başparmak yanda. Yumrukta kapalı el: iri, boğum çizgili.
function elCiz(k, ha, dr) {
  const a = Math.atan2(ha.y - dr.y, ha.x - dr.x), r = 0.07 * k.g.boy * ha.s, ten = k.g.ten;
  c.save();
  c.translate(ha.x, ha.y);
  c.rotate(a);
  c.lineWidth = Math.max(1.2, ha.s * 0.011);
  c.strokeStyle = MUREKKEP;
  c.fillStyle = ten;
  if (k.el.tip === 'avuc') {
    for (let i = 0; i < 4; i++) {
      const fa = (i - 1.5) * 0.28;
      c.beginPath();
      c.ellipse(Math.cos(fa) * r * 1.25, Math.sin(fa) * r * 1.25, r * 0.62, r * 0.24, fa, 0, TAU);
      c.fill();
      c.stroke();
    }
    c.beginPath();
    c.ellipse(r * 0.1, -k.el.yan * r * 0.9, r * 0.5, r * 0.22, -k.el.yan * 1.1, 0, TAU);
    c.fill();
    c.stroke();
    c.beginPath();
    c.arc(0, 0, r * 0.9, 0, TAU);
    c.fill();
    c.stroke();
  }
  else {
    c.beginPath();
    c.roundRect(-r * 0.9, -r * 0.85, r * 1.9, r * 1.7, r * 0.55);
    c.fill();
    c.stroke();
    c.lineWidth = Math.max(1, ha.s * 0.007);
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(r * 0.55, i * r * 0.45 - r * 0.18);
      c.lineTo(r * 0.95, i * r * 0.45 - r * 0.18);
      c.stroke();
    }
  }
  c.restore();
}
// Fırlayan kanal / ses düğmesi: dönerek uçar, yerde seker.
function dugmeUcan(p) {
  const r = (D.dugme.hangi === 'kanal' ? 0.13 : 0.1) * p.s;
  c.save();
  c.translate(p.x, p.y);
  c.rotate(D.dugme.rot);
  c.scale(1, 0.75 + 0.25 * Math.cos(D.dugme.rot * 0.7));
  c.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU, rr = i % 2 ? r : r * 0.9;
    i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.fillStyle = '#2b211b';
  c.fill();
  c.lineWidth = Math.max(1.2, p.s * 0.012);
  c.strokeStyle = MUREKKEP;
  c.stroke();
  c.strokeStyle = '#f3e7cc';
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, -r * 0.65);
  c.stroke();
  c.restore();
}

/* ---- listenin üstü ---- */
function oyunUst() {
  if (D.usta)
    spot();
  if (D.gol)
    golIsigi();
  hizIzi(D.ist);
  hizIzi(D.kuleIs);
  tozCiz();
  for (const e of D.efekt)
    carpma(e);
  seslenis();
  basamakYazisi();
  if (D.usta)
    ustaAdi();
}
// Usta işinde oda kararır; televizyon ve usta aydınlıkta kalır. Gol olunca karanlık kalkar.
function spot() {
  const a = D.gol ? 0 : clamp((B - D.usta.b0) / 1.5, 0, 1) * 0.45;
  const t = tvP([0, 1.0, 0]), k = pr([D.usta.k.x, 0.6 * D.usta.k.g.boy + D.usta.k.y0, D.usta.k.z]);
  if (a <= 0.01 || !t.ok || !k.ok)
    return;
  // iki delik: önce televizyonun dışına kırp, sonra ustanın dışını boya (çakışan delikler kararmasın)
  c.save();
  c.beginPath();
  c.rect(0, 0, GW, GH);
  c.ellipse(t.x, t.y, 1.55 * t.s, 1.35 * t.s, 0, 0, TAU);
  c.clip('evenodd');
  c.beginPath();
  c.rect(0, 0, GW, GH);
  c.ellipse(k.x, k.y, 0.85 * k.s, 1.05 * k.s, 0, 0, TAU);
  c.fillStyle = 'rgba(12,6,4,' + a.toFixed(3) + ')';
  c.fill('evenodd');
  c.restore();
}
// Ustanın adı: başının üstünde büyük levha.
function ustaAdi() {
  const k = D.usta.k, p = pr([k.x, k.y0 + 1.12 * k.g.boy, k.z]);
  if (!p.ok)
    return;
  const al = clamp((B - D.usta.b0) * 2, 0, 1);
  c.save();
  c.globalAlpha = al;
  c.font = '30px "Lilita One", Rubik, system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const w = Math.min(330, c.measureText(k.ad).width + 44), x = clamp(p.x + 30, w / 2 + 8, GW - w / 2 - 8), y = Math.max(ALAN_UST - 10, p.y - 40);
  c.fillStyle = RENK.vurgu;
  c.strokeStyle = MUREKKEP;
  c.lineWidth = 3;
  c.beginPath();
  c.roundRect(x - w / 2, y - 24, w, 48, 24);
  c.fill();
  c.stroke();
  c.fillStyle = MUREKKEP;
  c.fillText(k.ad, x, y + 1, w - 24);
  c.font = '20px "Lilita One", Rubik, system-ui, sans-serif';
  c.lineWidth = 5;
  c.strokeText('USTA İŞ BAŞINDA!', x, y - 36);
  c.fillStyle = RENK.sicak;
  c.fillText('USTA İŞ BAŞINDA!', x, y - 36);
  c.restore();
}
// Gol anı: ekranın ışığı odaya taşar; sahnenin en parlak anı.
function golIsigi() {
  const a = B - D.gol.b0;
  if (a > 8)
    return;
  const o = tvP([(EKRAN.x0 + EKRAN.x1) / 2, TV_UST - (EKRAN.y0 + EKRAN.y1) / 2, TV_ON]);
  if (!o.ok)
    return;
  const g = clamp(1 - a / 8, 0, 1) * (0.85 + 0.15 * Math.sin(a * Math.PI * 4));
  c.save();
  c.globalCompositeOperation = 'lighter';
  const r = 4.2 * o.s, gr = c.createRadialGradient(o.x, o.y, 0.3 * o.s, o.x, o.y, r);
  gr.addColorStop(0, 'rgba(255,250,215,' + (0.55 * g).toFixed(3) + ')');
  gr.addColorStop(0.35, 'rgba(190,255,170,' + (0.28 * g).toFixed(3) + ')');
  gr.addColorStop(1, 'rgba(120,200,120,0)');
  c.fillStyle = gr;
  c.fillRect(0, 0, GW, GH);
  // ışın demetleri
  c.translate(o.x, o.y);
  c.rotate(a * 0.4);
  c.fillStyle = 'rgba(255,240,180,' + (0.16 * g).toFixed(3) + ')';
  for (let i = 0; i < 10; i++) {
    c.rotate(TAU / 10);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(r, -0.35 * o.s);
    c.lineTo(r, 0.35 * o.s);
    c.closePath();
    c.fill();
  }
  c.restore();
}
// Vuran uzvun arkasında beyaz, incelen hız izi.
function hizIzi(is) {
  if (!is || is.iz.length < 2)
    return;
  const n = is.iz.map(p => pr(p));
  for (let i = 1; i < n.length; i++) {
    const a = n[i - 1], b = n[i];
    if (!a.ok || !b.ok)
      continue;
    c.strokeStyle = 'rgba(255,255,255,' + (0.25 + 0.6 * i / n.length).toFixed(2) + ')';
    c.lineWidth = Math.max(2, b.s * 0.1 * i / n.length);
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
  }
}
function tozCiz() {
  for (const p of D.toz) {
    const q = pr([p.x, p.y, p.z]);
    if (!q.ok)
      continue;
    const u = p.t / p.omur;
    c.fillStyle = 'rgba(236,220,190,' + (0.6 * (1 - u)).toFixed(3) + ')';
    c.beginPath();
    c.arc(q.x, q.y, p.r * (1 + u * 1.6) * q.s, 0, TAU);
    c.fill();
  }
}
// Çarpma: sivri yıldız, çevresinde çizgiler, ortasında "ŞAK!" yazısı. Önce büyüyüp oturur, sonra söner.
const CARPMA_RENK = { tokat: '#ffe066', yumruk: '#ffb347', tekme: '#ff7a45', ucan: '#ff5a5a' };
function carpma(e) {
  const p = pr(e.p), a = B - e.b0;
  if (!p.ok || a < 0)
    return;
  const v = VURUS[e.tip], buyuk = e.tip === 'ucan' ? 1.25 : e.tip === 'tekme' ? 1.1 : 1;
  const ol = (a < 0.25 ? yumusak(a / 0.25) * 1.25 : 1.25 - 0.25 * yumusak((a - 0.25) / 0.3)) * buyuk, al = clamp((2.2 - a) / 0.8, 0, 1);
  const elle = e.tip === 'tokat' || e.tip === 'yumruk', r = (elle ? 0.19 : 0.24) * p.s * ol, yon = e.sol ? 1 : -1;
  // yıldız vurulan yüzün üstüne kayar: vuranın elini, yüzünü örtmesin
  const cx = p.x + yon * r * (elle ? 1.0 : 0.35), cy = p.y + (elle ? r * 0.25 : -r * 0.2);
  c.save();
  c.globalAlpha = al;
  c.translate(cx, cy);
  c.rotate(yon * 0.12);
  // çizgiler
  c.strokeStyle = '#fff6d8';
  c.lineWidth = Math.max(2, p.s * 0.025);
  for (let i = 0; i < 8; i++) {
    const t = i / 8 * TAU + 0.2, r0 = r * (1.05 + 0.1 * a), r1 = r * (1.45 + 0.3 * a);
    c.beginPath();
    c.moveTo(Math.cos(t) * r0, Math.sin(t) * r0);
    c.lineTo(Math.cos(t) * r1, Math.sin(t) * r1);
    c.stroke();
  }
  // yıldız
  c.beginPath();
  for (let i = 0; i < 24; i++) {
    const t = i / 24 * TAU, rr = i % 2 ? r * 0.55 : r * (0.9 + ((i * 7) % 5) * 0.06);
    i ? c.lineTo(Math.cos(t) * rr, Math.sin(t) * rr) : c.moveTo(Math.cos(t) * rr, Math.sin(t) * rr);
  }
  c.closePath();
  c.fillStyle = CARPMA_RENK[e.tip] || '#ffe066';
  c.fill();
  c.lineWidth = Math.max(2, p.s * 0.018);
  c.strokeStyle = MUREKKEP;
  c.stroke();
  c.beginPath();
  c.arc(0, 0, r * 0.38, 0, TAU);
  c.fillStyle = '#fffbe8';
  c.fill();
  // yazı
  const punto = Math.round(clamp(r * 0.62, 16, 46));
  c.font = punto + 'px "Lilita One", Rubik, system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineWidth = Math.max(3, punto * 0.16);
  c.strokeStyle = MUREKKEP;
  c.strokeText(v.yazi, 0, 0);
  c.fillStyle = RENK.sicak;
  c.fillText(v.yazi, 0, 0);
  c.restore();
}
// Kalabalığın anteni tutana seslenişi: el değişince, vuruşlardan sonra ve ara ara.
function seslenis() {
  if (!kuledeMi(D.lider))
    return;
  const a = B - D.kipirdamaB, aralik = (B % 24) < 3;
  if (a > 5 && !aralik)
    return;
  const k = D.lider, el = D.antenUc ? pr(D.antenUc) : null
  if (!el || !el.ok)
    return;
  const yazi = a <= 5 ? 'TUT, KIPIRDAMA!' : 'KIPIRDAMA!', punto = 22;
  c.font = punto + 'px "Lilita One", Rubik, system-ui, sans-serif';
  const w = c.measureText(yazi).width + 26, x = clamp(el.x + 6, w / 2 + 6, GW - w / 2 - 6), y = Math.max(ALAN_UST - 40, el.y - 64);
  const t = a <= 5 ? a : B % 24, al = Math.min(1, t * 4, (a <= 5 ? 5 - t : 3 - t) * 2), sars = Math.sin(zaman * 40) * 1.5;
  c.save();
  c.globalAlpha = clamp(al, 0, 1);
  c.translate(x + sars, y);
  c.rotate(-0.05);
  c.fillStyle = '#fffbe8';
  c.strokeStyle = MUREKKEP;
  c.lineWidth = 3;
  c.beginPath();
  // köşeli bağırma balonu
  const h = 40;
  for (let i = 0; i < 18; i++) {
    const t2 = i / 18 * TAU, rx = w / 2 + (i % 2 ? 8 : 0), ry = h / 2 + (i % 2 ? 7 : 0);
    i ? c.lineTo(Math.cos(t2) * rx, Math.sin(t2) * ry) : c.moveTo(Math.cos(t2) * rx, Math.sin(t2) * ry);
  }
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = RENK.sicak;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(yazi, 0, 1);
  c.restore();
}
// Basamak değişince ekranın üstünde kısa yazı: "Görüntü geliyor!" / "Yine karlandı…"
const BASAMAK_YAZI = [['Yine karlandı…', ''], ['Bir şey görünüyor!', 'Kayıyor…'], ['Görüntü geliyor!', 'Çift görüntü…'], ['Siyah beyaz geldi!', 'Renk gitti…'], ['RENKLİ! MAÇ BAŞLADI!', '']];
function basamakYazisi() {
  const a = B - D.asamaB;
  // golde ve ustanın gösterisinde ekranın kendi yazısı (GOOOL, usta bandı) konuşur
  if (a < 0 || a > 3.5 || !D.asamaYon || D.gol || D.usta)
    return;
  const yazi = BASAMAK_YAZI[D.asama][D.asamaYon > 0 ? 0 : 1] || BASAMAK_YAZI[D.asama][0];
  if (!yazi)
    return;
  // ekranın alt kısmına, camın üstüne yazılır: sahne yazılarıyla çakışmaz, durumu ekranın kendisi söyler
  const p = tvP([(EKRAN.x0 + EKRAN.x1) / 2, TV_UST - EKRAN.y1 + 0.2, TV_ON]);
  if (!p.ok)
    return;
  const punto = D.asamaYon > 0 ? 28 : 24, y = p.y - a * 6;
  c.save();
  c.globalAlpha = clamp(Math.min(a * 5, (3.5 - a) * 2), 0, 1);
  c.font = punto + 'px "Lilita One", Rubik, system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineWidth = 6;
  c.strokeStyle = MUREKKEP;
  c.strokeText(yazi, p.x, y);
  c.fillStyle = D.asamaYon > 0 ? RENK.vurgu : '#cfe3ff';
  c.fillText(yazi, p.x, y);
  c.restore();
}
