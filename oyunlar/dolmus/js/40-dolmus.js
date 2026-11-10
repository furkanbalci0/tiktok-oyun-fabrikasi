/* DOLMUŞ ÇİZİMİ — kesit dolmuş: yakın yan duvarı oturak hizasından, tavanı pencere üstünden kesilmiş, içi
 * oyuncak ev gibi görünür. Kesilen yüzler krem rengi ve taralıdır (mimari kesit gibi).
 * dolmusArka(cw): zeminde çizilenler (gölge, uzak tekerler, taban ve kilim, uzak duvar, pencereler ve püsküllü
 * perde, arka duvar, ön panel, ön cam, hat tabelası) · yakinYan: yakın yan, kaput, tekerler (çizim listesinde en
 * önde) · koltukCiz: koltuk (yolcu, ön koltuk, şoför) · banknotCiz · Kancalar: oyunCiz(), oyunUst(dt), oyunEkAdlar().
 * Dolmuş ekseni: u ön tampondan geriye, y yukarı, z dünyadaki z (yakın yan -1). bp(u, y, z) ekrana düşürür.
 */
const DOL = {
  govde: '#ffc63a', govdeKoyu: '#e0a321', serit: '#2ec4b6', serit2: '#e8553b', ic: '#fbefdc', icKoyu: '#ead7b2',
  kesit: '#fff7e6', tarama: '#c9a26a', taban: '#454b54', tabanCizgi: '#545b65', kilim: '#b8322f', kilim2: '#f2c14e',
  koltuk: '#9a3340', dantel: '#fffaf0', on: '#ffc63a', boncuk: '#a0703f', cam: '#bfe9f2', teker: '#24272e', jant: '#d4dbe0',
  pano: '#3a3036', perde: '#8e2f3a'
};
const renkBellek = new Map();
// İki #rrggbb rengin karışımı: yüzlerin ışık ve gölge tonları buradan türer.
function renkKat(a, b, t) {
  const anahtar = a + b + t;
  let s = renkBellek.get(anahtar);
  if (s)
    return s;
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), kanal = sh => Math.round(lerp(x >> sh & 255, y >> sh & 255, t));
  s = 'rgb(' + kanal(16) + ',' + kanal(8) + ',' + kanal(0) + ')';
  renkBellek.set(anahtar, s);
  return s;
}
function bp(u, y, z) { return pr([D.otoX - u, y + D.bob, z]); }
// Dolmuş eksenindeki çokgen.
function bYuz(k, renk, cizgi) {
  const p = k.map(n => bp(n[0], n[1], n[2]));
  if (p.some(q => !q.ok))
    return null;
  noktalar(p);
  c.fillStyle = renk;
  c.fill();
  if (cizgi) {
    c.lineWidth = cizgi;
    c.strokeStyle = MUREKKEP;
    c.stroke();
  }
  return p;
}
// Kutu: yalnız kameraya bakan yüzler (yakın yan, üst, kameranın tarafındaki uç). Dışbükey: sıra gerekmez.
function bKutu(u0, u1, y0, y1, z0, z1, renk, cizgi) {
  const xOn = D.otoX - u0, xArka = D.otoX - u1;
  if (kam.C[0] > xOn)
    bYuz([[u0, y0, z0], [u0, y0, z1], [u0, y1, z1], [u0, y1, z0]], renkKat(renk, '#2a1a2a', 0.25), cizgi);
  if (kam.C[0] < xArka)
    bYuz([[u1, y0, z0], [u1, y0, z1], [u1, y1, z1], [u1, y1, z0]], renkKat(renk, '#2a1a2a', 0.25), cizgi);
  const yan = bYuz([[u0, y0, z0], [u1, y0, z0], [u1, y1, z0], [u0, y1, z0]], renk, cizgi);
  const ust = bYuz([[u0, y1, z0], [u1, y1, z0], [u1, y1, z1], [u0, y1, z1]], renkKat(renk, '#fff8e6', 0.3), cizgi);
  return { yan, ust };
}
// Kesit yüzü: krem dolgu üstüne çapraz tarama (kesilen duvarın kalınlığı).
function kesitCiz(p, cw) {
  if (!p)
    return;
  c.save();
  noktalar(p);
  c.fillStyle = DOL.kesit;
  c.fill();
  c.clip();
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const q of p) {
    x0 = Math.min(x0, q.x);
    x1 = Math.max(x1, q.x);
    y0 = Math.min(y0, q.y);
    y1 = Math.max(y1, q.y);
  }
  c.strokeStyle = DOL.tarama;
  c.lineWidth = Math.max(1, cw * 0.7);
  c.beginPath();
  const ad = 7;
  for (let x = x0 - (y1 - y0); x < x1; x += ad) {
    c.moveTo(x, y1);
    c.lineTo(x + (y1 - y0), y0);
  }
  c.stroke();
  c.restore();
  noktalar(p);
  c.lineWidth = cw;
  c.strokeStyle = MUREKKEP;
  c.stroke();
}

/* ---- zeminde: dolmuşun yolcuların arkasında kalan her şeyi ---- */
const PENCERE_Y0 = ZEMIN_Y + 0.52, PENCERE_Y1 = ZEMIN_Y + 1.12;
function dolmusArka(cw) {
  // yoldaki gölge (güneş sol önden)
  const g = [[-0.1, 0, -0.9], [ARKA_U + 0.2, 0, -0.9], [ARKA_U + 0.45, 0, 1.4], [0.15, 0, 1.4]].map(n => pr([D.otoX - n[0], 0, n[2]]));
  if (g.every(q => q.ok)) {
    noktalar(g);
    c.fillStyle = SOKAK.golge;
    c.fill();
  }
  // uzak tekerler: gövdenin altından görünür
  for (const tu of [1.0, ARKA_U - 1.15])
    tekerCiz(tu, 1.07, cw, false);
  // taban, koridorda kilim
  bYuz([[0.62, ZEMIN_Y, -1.0], [ARKA_U, ZEMIN_Y, -1.0], [ARKA_U, ZEMIN_Y, 0.99], [0.62, ZEMIN_Y, 0.99]], DOL.taban, cw);
  c.strokeStyle = DOL.tabanCizgi;
  c.lineWidth = Math.max(1, cw);
  c.beginPath();
  for (let z = -0.85; z < 0.95; z += 0.17) {
    const a = bp(0.7, ZEMIN_Y, z), b = bp(ARKA_U - 0.05, ZEMIN_Y, z);
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
  }
  c.stroke();
  const kl = bYuz([[ILK_U - 0.5, ZEMIN_Y, -0.2], [ARKA_U - 0.15, ZEMIN_Y, -0.2], [ARKA_U - 0.15, ZEMIN_Y, 0.2], [ILK_U - 0.5, ZEMIN_Y, 0.2]], DOL.kilim);
  if (kl) {
    // kilim: ortada sarı baklavalar
    c.fillStyle = DOL.kilim2;
    for (let u = ILK_U - 0.3; u < ARKA_U - 0.3; u += 0.4) {
      const m = bp(u, ZEMIN_Y, 0), a = bp(u - 0.13, ZEMIN_Y, 0), b = bp(u, ZEMIN_Y, 0.12), d = bp(u, ZEMIN_Y, -0.12);
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.lineTo(2 * m.x - a.x, 2 * m.y - a.y);
      c.lineTo(d.x, d.y);
      c.closePath();
      c.fill();
    }
  }
  // gösterideki yolcunun arkası ışır
  const dr = D.durak;
  if (dr && dr.ayakta && dr.k.p.kafa && dr.k.p.kafa.ok) {
    const h = dr.k.p.kafa, r = h.s * 1.6, gr = c.createRadialGradient(h.x, h.y, 0, h.x, h.y, r);
    gr.addColorStop(0, 'rgba(255,214,102,.75)');
    gr.addColorStop(1, 'rgba(255,214,102,0)');
    c.fillStyle = gr;
    c.fillRect(h.x - r, h.y - r, r * 2, r * 2);
  }
  // uzak duvarın iç yüzü: pencere altı, pencere üstü, dikmeler; camlar saydam (sokak görünür)
  const z = 0.99, u0 = 0.95, u1 = ARKA_U;
  bYuz([[u0, ZEMIN_Y, z], [u1, ZEMIN_Y, z], [u1, PENCERE_Y0, z], [u0, PENCERE_Y0, z]], DOL.ic, cw);
  bYuz([[u0, PENCERE_Y1, z], [u1, PENCERE_Y1, z], [u1, TAVAN_Y, z], [u0, TAVAN_Y, z]], DOL.icKoyu, cw);
  const PN = 5, pw = (u1 - u0 - 0.1) / PN;
  for (let i = 0; i < PN; i++) {
    const a = u0 + 0.05 + i * pw, b = a + pw;
    bYuz([[a, PENCERE_Y0, z], [a + 0.09, PENCERE_Y0, z], [a + 0.09, PENCERE_Y1, z], [a, PENCERE_Y1, z]], DOL.icKoyu, cw);
    c.globalAlpha = 0.38;
    bYuz([[a + 0.09, PENCERE_Y0, z], [b, PENCERE_Y0, z], [b, PENCERE_Y1, z], [a + 0.09, PENCERE_Y1, z]], DOL.cam);
    c.globalAlpha = 1;
    // camın parıltısı
    const p1 = bp(a + 0.3, PENCERE_Y1 - 0.05, z), p2 = bp(a + 0.55, PENCERE_Y0 + 0.05, z);
    c.strokeStyle = 'rgba(255,255,255,.55)';
    c.lineWidth = Math.max(1.5, cw * 2);
    c.beginPath();
    c.moveTo(p1.x, p1.y);
    c.lineTo(p2.x, p2.y);
    c.stroke();
    // püsküllü perde: pencerenin üstünde bordo saçak, altında sarı püsküller
    const pp = bYuz([[a + 0.09, PENCERE_Y1 - 0.12, z - 0.01], [b, PENCERE_Y1 - 0.12, z - 0.01], [b, PENCERE_Y1, z - 0.01], [a + 0.09, PENCERE_Y1, z - 0.01]], DOL.perde, cw * 0.7);
    if (pp) {
      c.fillStyle = DOL.kilim2;
      for (let t = 0.06; t < 1; t += 0.12) {
        const q = bp(lerp(a + 0.09, b, t), PENCERE_Y1 - 0.12, z - 0.01);
        c.beginPath();
        c.arc(q.x, q.y + 0.025 * q.s, Math.max(1.2, 0.025 * q.s), 0, TAU);
        c.fill();
      }
    }
  }
  // tavan tutamak borusu
  const t0 = bp(u0 + 0.6, TAVAN_Y - 0.06, 0.75), t1 = bp(u1 - 0.1, TAVAN_Y - 0.06, 0.75);
  c.strokeStyle = MUREKKEP;
  c.lineWidth = Math.max(2, 0.05 * t0.s + 2);
  c.beginPath();
  c.moveTo(t0.x, t0.y);
  c.lineTo(t1.x, t1.y);
  c.stroke();
  c.strokeStyle = '#d4dbe0';
  c.lineWidth = Math.max(1, 0.05 * t0.s);
  c.stroke();
  // kesilmiş tavan: uzak duvarın tepesi ve tavanın kalan payı
  kesitCiz(bYuz([[u0, TAVAN_Y, 0.8], [u1 + 0.06, TAVAN_Y, 0.8], [u1 + 0.06, TAVAN_Y, 1.06], [u0, TAVAN_Y, 1.06]], DOL.kesit), cw);
  // arka duvar: iç yüzü ileri bakar; ortasında arka cam
  const ra = bYuz([[u1, ZEMIN_Y, -1.0], [u1, ZEMIN_Y, 1.0], [u1, TAVAN_Y, 1.0], [u1, TAVAN_Y, -1.0]], DOL.icKoyu, cw);
  if (ra) {
    c.globalAlpha = 0.45;
    bYuz([[u1, PENCERE_Y0, -0.6], [u1, PENCERE_Y0, 0.75], [u1, PENCERE_Y1, 0.75], [u1, PENCERE_Y1, -0.6]], DOL.cam);
    c.globalAlpha = 1;
    kesitCiz(bYuz([[u1, TAVAN_Y, -1.0], [u1 + 0.07, TAVAN_Y, -1.0], [u1 + 0.07, TAVAN_Y, 1.06], [u1, TAVAN_Y, 1.06]], DOL.kesit), cw);
    kesitCiz(bYuz([[u1, ZEMIN_Y + 0.2, -1.06], [u1 + 0.07, ZEMIN_Y + 0.2, -1.06], [u1 + 0.07, TAVAN_Y, -1.06], [u1, TAVAN_Y, -1.06]], DOL.kesit), cw);
  }
  // ön: torpido, ön cam, uzak A direği
  bKutu(0.6, 0.95, ZEMIN_Y, ZEMIN_Y + 0.42, -0.98, 0.98, DOL.pano, cw);
  c.globalAlpha = 0.3;
  bYuz([[0.62, ZEMIN_Y + 0.42, -1.0], [0.62, ZEMIN_Y + 0.42, 1.0], [0.97, TAVAN_Y, 1.0], [0.97, TAVAN_Y, -1.0]], DOL.cam);
  c.globalAlpha = 1;
  const d0 = bp(0.62, ZEMIN_Y + 0.42, 1.0), d1 = bp(0.97, TAVAN_Y, 1.0);
  c.strokeStyle = MUREKKEP;
  c.lineWidth = Math.max(3, 0.09 * d0.s + 2);
  c.beginPath();
  c.moveTo(d0.x, d0.y);
  c.lineTo(d1.x, d1.y);
  c.stroke();
  c.strokeStyle = DOL.govde;
  c.lineWidth = Math.max(2, 0.09 * d0.s);
  c.stroke();
  // teyp ve kasa göstergesi torpidonun üstünde
  const ty = bKutu(0.7, 0.86, ZEMIN_Y + 0.42, ZEMIN_Y + 0.5, -0.15, 0.25, '#2a2a35', cw * 0.8);
  if (ty.ust) {
    const m = bp(0.78, ZEMIN_Y + 0.5, 0.05);
    c.fillStyle = etkin(D.teyp) ? '#7cf0c8' : '#3f6b5e';
    c.beginPath();
    c.arc(m.x, m.y, Math.max(2, 0.04 * m.s), 0, TAU);
    c.fill();
  }
  const ks = bp(0.78, ZEMIN_Y + 0.43, -0.6);
  if (ks.ok && ks.s > 70) {
    c.font = '700 ' + Math.round(clamp(ks.s * 0.11, 10, 20)) + 'px Rubik, system-ui, sans-serif';
    const m = '₺' + D.kasa, w = c.measureText(m).width + 10, h = clamp(ks.s * 0.15, 14, 26);
    c.fillStyle = '#1b2228';
    c.beginPath();
    c.roundRect(ks.x - w / 2, ks.y - h, w, h, 4);
    c.fill();
    c.fillStyle = '#7cf0c8';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(m, ks.x, ks.y - h / 2 + 1);
    c.textBaseline = 'alphabetic';
  }
  // ayna ve sallanan nazar boncuğu
  const ay = bp(0.92, TAVAN_Y - 0.1, 0.05), sal = azHareket ? 0 : Math.sin(TAU * B / 2) * 0.35 + (etkin(D.kasis) ? Math.sin(TAU * B * 2) * 0.4 : 0);
  if (ay.ok) {
    c.fillStyle = '#2a2a35';
    c.beginPath();
    c.roundRect(ay.x - 0.14 * ay.s, ay.y - 0.05 * ay.s, 0.28 * ay.s, 0.09 * ay.s, 3);
    c.fill();
    const L = 0.32 * ay.s, bx = ay.x + Math.sin(sal) * L, by = ay.y + Math.cos(sal) * L;
    c.strokeStyle = '#f6ecd9';
    c.lineWidth = Math.max(1, ay.s * 0.008);
    c.beginPath();
    c.moveTo(ay.x, ay.y);
    c.lineTo(bx, by);
    c.stroke();
    for (const [r, renk] of [[0.075, '#1f5fc6'], [0.052, '#f6ecd9'], [0.033, '#4aa3e8'], [0.016, '#080a1c']]) {
      c.fillStyle = renk;
      c.beginPath();
      c.arc(bx, by, r * ay.s, 0, TAU);
      c.fill();
    }
  }
  // hat tabelası: uzak yanın tepesinde, önde. Gösteride gönderenin adını yazar.
  const hb = bYuz([[1.0, TAVAN_Y + 0.04, 1.02], [3.0, TAVAN_Y + 0.04, 1.02], [3.0, TAVAN_Y + 0.4, 1.02], [1.0, TAVAN_Y + 0.4, 1.02]], '#fbf3e4', cw * 1.4);
  if (hb) {
    const w = hb[0].x - hb[1].x, h = hb[1].y - hb[2].y;
    const m = dr && dr.yakin ? dr.k.ad + ' durağı' : 'ÇARŞI  ⇄  İSKELE';
    c.font = Math.round(clamp(h * 0.62, 8, 34)) + 'px "Lilita One", Rubik, system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = dr && dr.yakin ? DOL.serit2 : '#1f5063';
    c.fillText(m, (hb[0].x + hb[1].x) / 2, (hb[0].y + hb[2].y) / 2 + 1, w - 10);
    c.textBaseline = 'alphabetic';
  }
}
// Teker: yan yüzü kameraya bakan disk; jant çizgileri yol hızıyla döner.
function tekerCiz(u, z, cw, yakin) {
  const p = bp(u, 0.25 - D.bob, z);
  if (!p.ok)
    return;
  const r = 0.25 * p.s, ry = r * Math.cos(kam.egim) * 0.9 + r * 0.1;
  c.fillStyle = DOL.teker;
  c.beginPath();
  c.ellipse(p.x, p.y, r, ry, 0, 0, TAU);
  c.fill();
  if (!yakin)
    return;
  c.lineWidth = cw;
  c.strokeStyle = MUREKKEP;
  c.stroke();
  c.fillStyle = DOL.jant;
  c.beginPath();
  c.ellipse(p.x, p.y, r * 0.5, ry * 0.5, 0, 0, TAU);
  c.fill();
  c.stroke();
  const a0 = -D.kayma / 0.25;
  c.strokeStyle = '#7a848c';
  c.lineWidth = Math.max(1, r * 0.08);
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = a0 + i * TAU / 5;
    c.moveTo(p.x, p.y);
    c.lineTo(p.x + Math.cos(a) * r * 0.45, p.y + Math.sin(a) * ry * 0.45);
  }
  c.stroke();
}

/* ---- çizim listesinde: koltuklar, yakın yan, şoför, yolcular (banknotlar oyunUst'te, hepsinin üstünde) ---- */
const KAPI0 = 1.63, KAPI1 = 1.82; // kapı: ön koltukla ilk koltuk arası
// Yakın yan: oturak hizasında kesilmiş alçak duvar (kapı boşluğuyla), kaput, tampon, tekerler.
function yakinYan() {
  const cw = Math.max(1, bp(2, 0, -1).s * 0.012), ust = ZEMIN_Y + 0.2, z0 = -1.06, z1 = -0.98;
  for (const [a, b] of [[0.64, KAPI0], [KAPI1, ARKA_U + 0.07]]) {
    const k = bKutu(a, b, 0.14, ust, z0, z1, DOL.govde, 0);
    kesitCiz(k.ust, cw);
    if (k.yan) {
      // turkuaz kuşak ve kırmızı ince şerit
      bYuz([[a, 0.27, z0 - 0.002], [b, 0.27, z0 - 0.002], [b, 0.37, z0 - 0.002], [a, 0.37, z0 - 0.002]], DOL.serit);
      bYuz([[a, 0.4, z0 - 0.002], [b, 0.4, z0 - 0.002], [b, 0.425, z0 - 0.002], [a, 0.425, z0 - 0.002]], DOL.serit2);
      noktalar(k.yan);
      c.lineWidth = cw;
      c.strokeStyle = MUREKKEP;
      c.stroke();
    }
  }
  // kapı basamağı
  bKutu(KAPI0, KAPI1, 0.14, 0.28, -1.04, -0.9, '#8a949c', cw);
  // "14+1" yazısı arka tekerin önünde
  const yz = bp(ARKA_U - 2.0, 0.21, z0 - 0.003);
  if (yz.ok && yz.s > 50) {
    c.font = Math.round(clamp(yz.s * 0.13, 9, 26)) + 'px "Lilita One", Rubik, system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#1f5063';
    c.fillText('14+1', yz.x, yz.y);
    c.textBaseline = 'alphabetic';
  }
  // kaput ve tampon
  const kp = bKutu(0.02, 0.66, 0.14, ZEMIN_Y + 0.36, -1.04, 1.04, DOL.govde, cw);
  if (kp.yan) {
    bYuz([[0.02, 0.27, -1.042], [0.66, 0.27, -1.042], [0.66, 0.37, -1.042], [0.02, 0.37, -1.042]], DOL.serit);
    const f = bp(0.1, 0.55, -1.045);
    if (f.ok) {
      c.fillStyle = '#fff3c4';
      c.beginPath();
      c.arc(f.x, f.y, 0.07 * f.s, 0, TAU);
      c.fill();
      c.lineWidth = cw;
      c.strokeStyle = MUREKKEP;
      c.stroke();
    }
  }
  bKutu(-0.06, 0.04, 0.1, 0.3, -1.08, 1.08, '#cfd6dc', cw);
  bKutu(ARKA_U + 0.03, ARKA_U + 0.12, 0.1, 0.28, -1.08, 1.08, '#cfd6dc', cw);
  for (const tu of [1.0, ARKA_U - 1.15])
    tekerCiz(tu, -1.08, cw, true);
}
// Koltuk: oturak, arkalık ve başlık örtüsü. tur: 'yolcu' bordo + dantel, 'on' altın sarısı boncuklu, 'sofor' ahşap boncuklu.
function koltukCiz(u, z, tur) {
  const cw = Math.max(1, bp(u, ZEMIN_Y, z).s * 0.011), a = 0.25;
  const renk = tur === 'on' ? DOL.on : tur === 'sofor' ? '#3a3036' : DOL.koltuk;
  bKutu(u - 0.18, u + 0.2, ZEMIN_Y, ZEMIN_Y + 0.07, z - a + 0.04, z + a - 0.04, '#2a2a35', cw);
  bKutu(u - 0.22, u + 0.22, ZEMIN_Y + 0.07, ZEMIN_Y + 0.16, z - a, z + a, renk, cw);
  const ar = bKutu(u + 0.2, u + 0.31, ZEMIN_Y + 0.12, ZEMIN_Y + 0.8, z - a, z + a, renk, cw);
  if (tur === 'yolcu')
    bKutu(u + 0.185, u + 0.325, ZEMIN_Y + 0.6, ZEMIN_Y + 0.82, z - a + 0.03, z + a - 0.03, DOL.dantel, cw * 0.8);
  else if (ar.yan) {
    // boncuklu örtü: arkalığın yanında nokta nokta
    c.fillStyle = tur === 'on' ? '#b07a12' : DOL.boncuk;
    for (let y = ZEMIN_Y + 0.2; y < ZEMIN_Y + 0.78; y += 0.08)
      for (const du of [0.23, 0.28]) {
        const q = bp(u + du, y, z - a - 0.003);
        c.beginPath();
        c.arc(q.x, q.y, Math.max(1, 0.018 * q.s), 0, TAU);
        c.fill();
      }
  }
  if (tur === 'on') {
    // ön koltuk el değiştirince koltuk parlar; hep küçük bir yıldız ışıltısı
    const yas = B - D.parla, m = bp(u, ZEMIN_Y + 0.45, z);
    if (yas >= 0 && yas < 3 && m.ok) {
      c.globalAlpha = 0.6 * (1 - yas / 3);
      c.strokeStyle = '#ffe9a8';
      c.lineWidth = 0.08 * m.s;
      c.beginPath();
      c.ellipse(m.x, m.y, (0.5 + yas * 0.15) * m.s, (0.55 + yas * 0.15) * m.s, 0, 0, TAU);
      c.stroke();
      c.globalAlpha = 1;
    }
    const pl = bp(u - 0.02, ZEMIN_Y + 0.115, z - a - 0.004);
    if (pl.ok && pl.s > 85) {
      c.font = '700 ' + Math.round(clamp(pl.s * 0.06, 9, 15)) + 'px Rubik, system-ui, sans-serif';
      const w = c.measureText('ÖN KOLTUK').width + 8, h = clamp(pl.s * 0.08, 11, 19);
      c.fillStyle = DOL.serit2;
      c.beginPath();
      c.roundRect(pl.x - w / 2, pl.y - h / 2, w, h, 3);
      c.fill();
      c.fillStyle = '#fff7e6';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('ÖN KOLTUK', pl.x, pl.y + 1);
      c.textBaseline = 'alphabetic';
    }
  }
}
// Banknot demeti: küçük hediyede tek, büyüdükçe kalınlaşan yelpaze.
const PARA_RENK = { uzat: '#7cc36b', teyp: '#5aa7e0', kasis: '#b07ad8', sollama: '#f08a3c', durak: '#e8553b' };
const PARA_ADET = { uzat: 1, teyp: 2, kasis: 2, sollama: 3, durak: 4 };
function banknotCiz(n) {
  const p = pr(n.p);
  if (!p.ok)
    return;
  const w = Math.max(38, 0.5 * p.s), h = w * 0.52, adet = PARA_ADET[n.tip] || 1, renk = PARA_RENK[n.tip] || PARA_RENK.uzat;
  if (adet >= 3) {
    const r = w * 1.2, gr = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    gr.addColorStop(0, 'rgba(255,233,168,.7)');
    gr.addColorStop(1, 'rgba(255,233,168,0)');
    c.fillStyle = gr;
    c.fillRect(p.x - r, p.y - r, r * 2, r * 2);
  }
  for (let i = 0; i < adet; i++) {
    c.save();
    c.translate(p.x + (i - (adet - 1) / 2) * w * 0.14, p.y - i * h * 0.1);
    c.rotate(-0.3 + 0.18 * i + (azHareket ? 0 : 0.12 * Math.sin(TAU * B * 2 + i)));
    c.fillStyle = renk;
    c.strokeStyle = MUREKKEP;
    c.lineWidth = Math.max(1.2, w * 0.05);
    c.beginPath();
    c.roundRect(-w / 2, -h / 2, w, h, w * 0.06);
    c.fill();
    c.stroke();
    c.strokeStyle = renkKat(renk, '#ffffff', 0.5);
    c.lineWidth = Math.max(1, w * 0.03);
    c.strokeRect(-w * 0.4, -h * 0.32, w * 0.8, h * 0.64);
    c.fillStyle = renkKat(renk, '#ffffff', 0.55);
    c.beginPath();
    c.arc(0, 0, h * 0.26, 0, TAU);
    c.fill();
    if (w > 24) {
      c.fillStyle = renkKat(renk, '#080a1c', 0.55);
      c.font = '700 ' + Math.round(h * 0.42) + 'px Rubik, system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('₺', 0, 1);
      c.textBaseline = 'alphabetic';
    }
    c.restore();
  }
}
// Başı k.basYon'a çevirir. insanEkle gövdeyi hemen listeye koyar, başı (kafaCiz) ise liste çizilirken çizer:
// yön burada değişince yalnız baş döner. Bir sonraki karede iskeletKur gövdenin yönünü geri yazar.
function basCevir(k) {
  const b = k.basYon;
  if (b === undefined)
    return;
  k.f[0] = Math.sin(b);
  k.f[2] = Math.cos(b);
  k.l[0] = -Math.cos(b);
  k.l[2] = Math.sin(b);
}
// Şoförün güneş gözlüğü: kafaCiz'in göz yerlerine iki koyu cam.
function gozluk() {
  const k = sofor, ph = k.p.kafa;
  if (!ph || !ph.ok)
    return;
  const R = KAFA_R * k.g.boy * ph.s, f = k.f, l = k.l, ku = kam.bu, kf = kam.bf;
  const fr = f[0] * kam.r[0] + f[2] * kam.r[2], fu = f[0] * ku[0] + f[2] * ku[2], fd = f[0] * kf[0] + f[2] * kf[2];
  const lr = l[0] * kam.r[0] + l[2] * kam.r[2], lu = l[0] * ku[0] + l[2] * ku[2], ld = l[0] * kf[0] + l[2] * kf[2];
  const N = (a, b, cc) => ({ x: ph.x + R * (a * lr + cc * fr), y: ph.y - R * (a * lu + b * ku[1] + cc * fu), d: a * ld + b * kf[1] + cc * fd });
  const g1 = N(0.36, -0.04, 0.9), g2 = N(-0.36, -0.04, 0.9);
  c.strokeStyle = MUREKKEP;
  c.lineWidth = Math.max(1.5, R * 0.07);
  c.beginPath();
  c.moveTo(g1.x, g1.y);
  c.lineTo(g2.x, g2.y);
  c.stroke();
  for (const g of [g1, g2]) {
    if (g.d > 0.1)
      continue;
    c.fillStyle = '#1b2228';
    c.beginPath();
    c.ellipse(g.x, g.y, R * 0.21, R * 0.15, 0, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(160,220,240,.6)';
    c.beginPath();
    c.ellipse(g.x - R * 0.06, g.y - R * 0.05, R * 0.06, R * 0.035, -0.5, 0, TAU);
    c.fill();
  }
}
function direksiyonCiz() {
  const p = pr(direksiyonYeri());
  if (!p.ok)
    return;
  c.save();
  c.translate(p.x, p.y);
  c.rotate(-0.5 + (azHareket ? 0 : 0.08 * Math.sin(TAU * B / 4)));
  c.lineWidth = Math.max(3, 0.05 * p.s);
  c.strokeStyle = '#1b1f26';
  c.beginPath();
  c.ellipse(0, 0, 0.07 * p.s, 0.18 * p.s, 0, 0, TAU);
  c.stroke();
  c.restore();
}

function oyunCiz() {
  const derin = (u, y, z) => bp(u, y, z).d;
  // koltuklar: oturanın arkasında kalsın diye biraz geride sıralanır
  for (const y of KOLTUK)
    ozel(derin(y.u, ZEMIN_Y + 0.4, y.z) + 0.3, () => koltukCiz(y.u, y.z, 'yolcu'));
  ozel(derin(ON_U, ZEMIN_Y + 0.4, YAKIN_Z) + 0.3, () => koltukCiz(ON_U, YAKIN_Z, 'on'));
  ozel(derin(ON_U, ZEMIN_Y + 0.4, UZAK_Z) + 0.3, () => koltukCiz(ON_U, UZAK_Z, 'sofor'));
  ozel(derin(2, 0.4, -1.08) - 0.05, yakinYan);
  // şoför, gözlüğü ve direksiyonu
  if (insanEkle(sofor)) {
    basCevir(sofor);
    ozel(sofor.p.kafa.d - 0.052, gozluk);
    ozel(Math.min(sofor.p.haR.d, sofor.p.haL.d) - 0.03, direksiyonCiz);
  }
  // Kadrajın dışında kalanın adı yazılmaz: çekirdek etiketi ekran kenarına sıkıştırır, kenarda yığılırdı.
  for (const k of D.oy.values())
    if (insanEkle(k)) {
      basCevir(k);
      if (k.et.x < -10 || k.et.x > GW + 10)
        k.et = null;
    }
}
function oyunEkAdlar() { return [sofor]; }

/* ---- listenin üstüne: yazılar ve gösteriler ---- */
function yaziKalin(m, x, y, punto, renk) {
  c.font = punto + 'px "Lilita One", Rubik, system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  c.lineWidth = Math.max(3, punto * 0.18);
  c.strokeStyle = MUREKKEP;
  c.strokeText(m, x, y);
  c.fillStyle = renk;
  c.fillText(m, x, y);
  c.textBaseline = 'alphabetic';
}
function hap(m, x, y, punto, zemin, yazi) {
  c.font = '700 ' + punto + 'px Rubik, system-ui, sans-serif';
  const w = Math.min(GW - 16, c.measureText(m).width + punto * 1.2), h = punto * 1.7;
  x = clamp(x, w / 2 + 8, GW - w / 2 - 8);
  c.fillStyle = zemin;
  c.strokeStyle = MUREKKEP;
  c.lineWidth = 2.5;
  c.beginPath();
  c.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
  c.fill();
  c.stroke();
  c.fillStyle = yazi;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(m, x, y + 1, w - punto);
  c.textBaseline = 'alphabetic';
}
function oyunUst() {
  // sollama: hız çizgileri
  if (etkin(D.sollama) && !azHareket) {
    const u = (B - D.sollama.bas) / D.sollama.sure, al = Math.sin(Math.PI * u);
    c.strokeStyle = 'rgba(255,255,255,' + (0.55 * al).toFixed(3) + ')';
    c.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const y = ALAN_UST + 30 + ((i * 97) % (ALAN_ALT - ALAN_UST - 60)), L = 60 + (i * 53) % 90, x = GW - ((zaman * 1400 + i * 211) % (GW + 300));
      c.lineWidth = 2 + (i % 3);
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + L, y);
      c.stroke();
    }
    const on = bp(-0.2, 0.9, -0.5);
    if (on.ok && u < 0.6)
      yaziKalin('VIIIN!', clamp(on.x, 90, GW - 90), Math.max(ALAN_UST + 30, on.y - 40), 34, RENK.vurgu);
  }
  // teyp: torpidodan notalar yükselir
  if (etkin(D.teyp) && !azHareket) {
    const m = bp(0.78, ZEMIN_Y + 0.55, 0.05);
    if (m.ok)
      for (let i = 0; i < 5; i++) {
        const t = ((B - D.teyp.bas) * 0.5 + i / 5) % 1, x = m.x - t * m.s * 1.6 + Math.sin(t * 9 + i) * m.s * 0.15, y = m.y - t * m.s * 1.1;
        c.globalAlpha = Math.sin(Math.PI * t);
        notaCiz(x, y, clamp(m.s * 0.11, 8, 22), i % 2 ? RENK.serin : RENK.vurgu);
      }
    c.globalAlpha = 1;
  }
  // kasis: "HOP!"
  if (D.kasis && B - D.kasis.bas < 1.6 && B >= D.kasis.bas) {
    const p = bp((D.bolge0 + D.bolge1) / 2, TAVAN_Y + 0.2, 0), u = (B - D.kasis.bas) / 1.6;
    if (p.ok) {
      c.globalAlpha = Math.min(1, (1 - u) * 3);
      yaziKalin('HOP!', p.x, Math.max(ALAN_UST + 30, p.y - u * 30), Math.round(30 + 16 * Math.sin(Math.PI * Math.min(1, u * 2))), RENK.vurgu);
      c.globalAlpha = 1;
    }
  }
  // Banknotlar her şeyin üstünde: elden ele geçiş oyunun asıl anıdır, öndeki başların arkasında kaybolmasın.
  // Arkasında az önce geçtiği yerlerden kalan altın bir iz olur; havadayken "Uzatır mısınız?" yazar.
  for (const n of D.paralar) {
    if (!n.p)
      continue;
    const iz = n.iz || (n.iz = []), p = pr(n.p);
    if (!p.ok)
      continue;
    iz.push([p.x, p.y]);
    if (iz.length > 9)
      iz.shift();
    c.fillStyle = '#ffe9a8';
    for (let i = 0; i < iz.length - 1; i++) {
      c.globalAlpha = (i + 1) / iz.length * 0.7;
      c.beginPath();
      c.arc(iz[i][0], iz[i][1], 2 + i * 0.7, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
    banknotCiz(n);
    if (B < n.t0)
      hap('Uzatır mısınız?', p.x, p.y - 34, 15, '#fff7e6', MUREKKEP);
  }
  // inen yolcu
  for (const k of D.oy.values())
    if (k.cikiyor && zaman - k.cikis < 1.4 && k.p.kafa && k.p.kafa.ok)
      hap('Müsait bir yerde!', k.p.kafa.x, k.p.kafa.y - KAFA_R * k.g.boy * k.p.kafa.s - 18, 14, '#fff7e6', MUREKKEP);
  // gösteri: gönderenin büyük adı
  const d = D.durak;
  if (d && d.yakin) {
    const y = ALAN_ALT - 46;
    c.globalAlpha = clamp((B - d.bas - 0.5) * 2, 0, 1) * clamp((d.bas + DURAK_V - 0.8 - B) * 2, 0, 1);
    yaziKalin('MÜSAİT BİR YERDE!', GW / 2, y - 44, 30, RENK.sicak);
    hap(d.k.ad + ' için duruyoruz', GW / 2, y, 22, RENK.vurgu, MUREKKEP);
    c.globalAlpha = 1;
  }
}
function notaCiz(x, y, b, renk) {
  c.fillStyle = renk;
  c.strokeStyle = MUREKKEP;
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(x, y, b * 0.42, b * 0.32, -0.4, 0, TAU);
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(x + b * 0.36, y - b * 0.1);
  c.lineTo(x + b * 0.36, y - b * 1.2);
  c.quadraticCurveTo(x + b * 0.9, y - b * 1.0, x + b * 0.85, y - b * 0.55);
  c.stroke();
}
