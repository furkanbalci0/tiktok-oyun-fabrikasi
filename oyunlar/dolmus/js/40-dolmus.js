/* DOLMUŞ ÇİZİMİ — kameraya doğru gelen kesit dolmuş: tavanı yok, yan duvarları oturak üstünden kesik; içi basamaklı
 * koltuk sıralarıyla oyuncak ev gibi görünür. Kesilen yüzler krem rengi ve taralıdır (mimari kesit gibi).
 * dolmusArka(cw): zeminde çizilenler (gölge, basamaklı taban, yan duvarların iç yüzü, arka duvar ve cam, hat
 * tabelası) · onPano: burun, torpido, tamponlar, ön tekerler (çizim listesinde en önde) · koltukCiz · banknotCiz
 * onSiraCiz: ön sıranın adları çene altında ve balonları · Kancalar: oyunCiz(), oyunUst(dt).
 * Dolmuş ekseni: bx sağa, y yukarı, bz önden arkaya. bp(bx, y, bz) ekrana düşürür (gövdenin yaylanması dahil).
 */
const DOL = {
  govde: '#ffc63a', serit: '#2ec4b6', serit2: '#e8553b', ic: '#fbefdc', icKoyu: '#ead7b2', kesit: '#fff7e6',
  tarama: '#c9a26a', taban: '#454b54', basamak: '#ffd84f', koltuk: '#9a3340', dantel: '#fffaf0', on: '#ffc63a',
  boncuk: '#a0703f', cam: '#cdeff5', teker: '#24272e', pano: '#3a3036', perde: '#8e2f3a', kilim2: '#f2c14e'
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
function bp(x, y, z) { return pr([x - D.otoX, y + D.bob, z]); }
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
// Kutu: yalnız kameraya bakan yüzler (ön, üst, kameranın tarafındaki yan). Dışbükey: sıra gerekmez.
function bKutu(x0, x1, y0, y1, z0, z1, renk, cizgi) {
  const yan = renkKat(renk, '#2a1a2a', 0.25);
  if (kam.C[0] < x0 - D.otoX)
    bYuz([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], yan, cizgi);
  if (kam.C[0] > x1 - D.otoX)
    bYuz([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], yan, cizgi);
  const ust = bYuz([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], renkKat(renk, '#fff8e6', 0.3), cizgi);
  const on = bYuz([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], renk, cizgi);
  return { on, ust };
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
  for (let x = x0 - (y1 - y0); x < x1; x += 7) {
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

/* ---- zeminde: yolcuların arkasında kalan her şey ---- */
const DUVAR_UST = ZEMIN_Y + 0.62;               // yan duvarların kesildiği yükseklik
const ARKA_UST = tabanY(SIRA_SAY - 1) + 0.75;  // arka duvarın tepesi (en arkadakilerin omuz hizası)
function dolmusArka(cw) {
  const g = [[-DUVAR_X, 0, ON_UC], [DUVAR_X, 0, ON_UC], [DUVAR_X + 0.35, 0, ARKA_Z + 0.4], [-DUVAR_X + 0.35, 0, ARKA_Z + 0.4]].map(n => pr([n[0] - D.otoX, 0, n[2]]));
  if (g.every(q => q.ok)) {
    noktalar(g);
    c.fillStyle = SOKAK.golge;
    c.fill();
  }
  // arka tekerler gövdenin altından görünür
  for (const s of [-1, 1])
    bKutu(s > 0 ? DUVAR_X - 0.28 : -DUVAR_X - 0.02, s > 0 ? DUVAR_X + 0.02 : -DUVAR_X + 0.28, 0, 0.5, ARKA_Z - 0.9, ARKA_Z - 0.35, DOL.teker, cw);
  // gövdenin altı (tabanın kenarı) ve arka duvar
  const za = ARKA_Z, ya = tabanY(SIRA_SAY - 1);
  bYuz([[-DUVAR_X, ya, za], [DUVAR_X, ya, za], [DUVAR_X, ARKA_UST, za], [-DUVAR_X, ARKA_UST, za]], DOL.icKoyu, cw);
  c.globalAlpha = 0.8;
  bYuz([[-1.45, ya + 0.42, za - 0.005], [1.45, ya + 0.42, za - 0.005], [1.45, ARKA_UST - 0.08, za - 0.005], [-1.45, ARKA_UST - 0.08, za - 0.005]], DOL.cam, cw * 0.8);
  c.globalAlpha = 1;
  // püsküllü perde arka camın üstünde
  bYuz([[-1.45, ARKA_UST - 0.2, za - 0.01], [1.45, ARKA_UST - 0.2, za - 0.01], [1.45, ARKA_UST - 0.08, za - 0.01], [-1.45, ARKA_UST - 0.08, za - 0.01]], DOL.perde, cw * 0.7);
  c.fillStyle = DOL.kilim2;
  for (let x = -1.38; x < 1.45; x += 0.14) {
    const q = bp(x, ARKA_UST - 0.2, za - 0.012);
    c.beginPath();
    c.arc(q.x, q.y + 0.03 * q.s, Math.max(1.5, 0.028 * q.s), 0, TAU);
    c.fill();
  }
  kesitCiz(bYuz([[-DUVAR_X - 0.05, ARKA_UST, za], [DUVAR_X + 0.05, ARKA_UST, za], [DUVAR_X + 0.05, ARKA_UST, za + 0.1], [-DUVAR_X - 0.05, ARKA_UST, za + 0.1]], DOL.kesit), cw);
  // yan duvarların iç yüzü (kameraya yan bakar), kuşak şeridi ve kesik tepesi
  for (const s of [-1, 1]) {
    const x = s * DUVAR_X;
    bYuz([[x, ZEMIN_Y, -0.45], [x, ZEMIN_Y, za], [x, DUVAR_UST, za], [x, DUVAR_UST, -0.45]], DOL.ic, cw);
    bYuz([[x, DUVAR_UST - 0.16, -0.45], [x, DUVAR_UST - 0.16, za], [x, DUVAR_UST - 0.08, za], [x, DUVAR_UST - 0.08, -0.45]], DOL.serit);
    kesitCiz(bYuz([[x, DUVAR_UST, -0.5], [x, DUVAR_UST, za + 0.1], [x + s * 0.09, DUVAR_UST, za + 0.1], [x + s * 0.09, DUVAR_UST, -0.5]], DOL.kesit), cw);
  }
  // basamaklı taban: her sıranın basamağı, önünde sarı uyarı şeridi
  for (let r = 0; r < SIRA_SAY; r++) {
    const z0 = r === 0 ? -0.45 : r * SIRA_Z - SIRA_Z / 2, z1 = r === SIRA_SAY - 1 ? za : (r + 1) * SIRA_Z - SIRA_Z / 2, y = tabanY(r);
    bYuz([[-DUVAR_X, y, z0], [DUVAR_X, y, z0], [DUVAR_X, y, z1], [-DUVAR_X, y, z1]], DOL.taban, cw);
    if (r > 0) {
      bYuz([[-DUVAR_X, tabanY(r - 1), z0], [DUVAR_X, tabanY(r - 1), z0], [DUVAR_X, y, z0], [-DUVAR_X, y, z0]], renkKat(DOL.taban, '#000000', 0.25), cw);
      bYuz([[-DUVAR_X, y - 0.03, z0 - 0.002], [DUVAR_X, y - 0.03, z0 - 0.002], [DUVAR_X, y, z0 - 0.002], [-DUVAR_X, y, z0 - 0.002]], DOL.basamak);
    }
  }
  // gösterideki yolcunun arkası ışır
  const dr = D.durak;
  if (dr && dr.ayakta && dr.k.p.kafa && dr.k.p.kafa.ok) {
    const h = dr.k.p.kafa, r = h.s * 1.8, gr = c.createRadialGradient(h.x, h.y, 0, h.x, h.y, r);
    gr.addColorStop(0, 'rgba(255,214,102,.8)');
    gr.addColorStop(1, 'rgba(255,214,102,0)');
    c.fillStyle = gr;
    c.fillRect(h.x - r, h.y - r, r * 2, r * 2);
  }
}

/* ---- çizim listesinde ---- */
// Ön: torpido (ön sıranın dizlerini örter), ön cam payı, burun, tampon, farlar, ön tekerler.
function onPano() {
  const cw = Math.max(1, bp(0, 0.5, -0.5).s * 0.011), PZ = -0.44;
  for (const s of [-1, 1])
    bKutu(s > 0 ? DUVAR_X - 0.3 : -DUVAR_X - 0.02, s > 0 ? DUVAR_X + 0.02 : -DUVAR_X + 0.3, 0, 0.5, -0.56, -0.2, DOL.teker, cw);
  bKutu(-DUVAR_X - 0.02, DUVAR_X + 0.02, 0.14, ZEMIN_Y + 0.3, ON_UC, -0.5, DOL.govde, cw);
  bYuz([[-DUVAR_X, 0.22, ON_UC - 0.002], [DUVAR_X, 0.22, ON_UC - 0.002], [DUVAR_X, 0.3, ON_UC - 0.002], [-DUVAR_X, 0.3, ON_UC - 0.002]], DOL.serit);
  // burundaki hat tabelası (gösteride gönderenin adı alttaki büyük yazıda; tabela onun arkasında kalır)
  const hb = bYuz([[-1.05, 0.33, ON_UC - 0.004], [1.05, 0.33, ON_UC - 0.004], [1.05, 0.6, ON_UC - 0.004], [-1.05, 0.6, ON_UC - 0.004]], '#fbf3e4', cw);
  if (hb) {
    const w = hb[1].x - hb[0].x, h = hb[0].y - hb[3].y;
    c.font = Math.round(clamp(h * 0.62, 9, 30)) + 'px "Lilita One", Rubik, system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#1f5063';
    c.fillText('ÇARŞI  ⇄  İSKELE', (hb[0].x + hb[1].x) / 2, (hb[0].y + hb[3].y) / 2 + 1, w - 10);
    c.textBaseline = 'alphabetic';
  }
  for (const s of [-1, 1]) {
    const f = bp(s * 1.55, 0.46, ON_UC - 0.006);
    c.fillStyle = '#fff3c4';
    c.beginPath();
    c.ellipse(f.x, f.y, 0.2 * f.s, 0.11 * f.s, 0, 0, TAU);
    c.fill();
    c.lineWidth = cw;
    c.strokeStyle = MUREKKEP;
    c.stroke();
  }
  bKutu(-DUVAR_X - 0.06, DUVAR_X + 0.06, 0.08, 0.26, ON_UC - 0.1, ON_UC, '#cfd6dc', cw);
  // ön camın kesik alt çerçevesi ve torpido
  kesitCiz(bYuz([[-DUVAR_X, ZEMIN_Y + 0.46, -0.52], [DUVAR_X, ZEMIN_Y + 0.46, -0.52], [DUVAR_X, ZEMIN_Y + 0.46, -0.44], [-DUVAR_X, ZEMIN_Y + 0.46, -0.44]], DOL.kesit), cw);
  const tp = bKutu(-DUVAR_X + 0.05, DUVAR_X - 0.05, ZEMIN_Y + 0.15, ZEMIN_Y + 0.42, PZ, -0.26, DOL.pano, cw);
  if (tp.on) {
    // ön koltuğun önünde levha
    const pl = bp(0, ZEMIN_Y + 0.29, PZ - 0.005);
    if (pl.ok) {
      c.font = '700 ' + Math.round(clamp(pl.s * 0.1, 11, 22)) + 'px Rubik, system-ui, sans-serif';
      const w = c.measureText('ÖN KOLTUK').width + 14, h = clamp(pl.s * 0.15, 15, 30);
      c.fillStyle = DOL.on;
      c.strokeStyle = MUREKKEP;
      c.lineWidth = 2;
      c.beginPath();
      c.roundRect(pl.x - w / 2, pl.y - h / 2, w, h, 5);
      c.fill();
      c.stroke();
      c.fillStyle = MUREKKEP;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('ÖN KOLTUK', pl.x, pl.y + 1);
      c.textBaseline = 'alphabetic';
    }
    // teyp ve kasa göstergesi
    const ks = bp(-1.15, ZEMIN_Y + 0.29, PZ - 0.005);
    if (ks.ok) {
      c.font = '700 ' + Math.round(clamp(ks.s * 0.11, 11, 22)) + 'px Rubik, system-ui, sans-serif';
      const m = '₺' + D.kasa, w = c.measureText(m).width + 12, h = clamp(ks.s * 0.15, 15, 30);
      c.fillStyle = '#1b2228';
      c.beginPath();
      c.roundRect(ks.x - w / 2, ks.y - h / 2, w, h, 4);
      c.fill();
      c.fillStyle = etkin(D.teyp) ? '#ffe9a8' : '#7cf0c8';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(m, ks.x, ks.y + 1);
      c.textBaseline = 'alphabetic';
    }
    // torpidoda sallanan nazar boncuğu
    const ay = bp(-1.65, ZEMIN_Y + 0.42, PZ), sal = azHareket ? 0 : Math.sin(TAU * B / 2) * 0.35 + (etkin(D.kasis) ? Math.sin(TAU * B * 2) * 0.4 : 0);
    if (ay.ok) {
      const L = 0.25 * ay.s, bx = ay.x + Math.sin(sal) * L, by = ay.y + Math.cos(sal) * L;
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
  }
}
// Koltuk: oturak, arkalık ve başlık örtüsü. 'yolcu' bordo + dantel, 'on' altın sarısı boncuklu, 'sofor' koyu boncuklu.
function koltukCiz(s, tur) {
  const y = tabanY(s.r), cw = Math.max(1, bp(s.x, y, s.z).s * 0.011), a = 0.32;
  const renk = tur === 'on' ? DOL.on : tur === 'sofor' ? '#3a3036' : DOL.koltuk;
  if (tur === 'on') {
    // ön koltuk el değiştirince parlar; her zaman altın bir ışıltı
    const yas = B - D.parla, m = bp(s.x, y + 0.5, s.z + 0.15);
    const r = (0.62 + (yas >= 0 && yas < 3 ? yas * 0.12 : 0)) * m.s, gr = c.createRadialGradient(m.x, m.y, 0, m.x, m.y, r);
    gr.addColorStop(0, 'rgba(255,214,102,' + (yas >= 0 && yas < 3 ? 0.9 - yas * 0.15 : 0.45) + ')');
    gr.addColorStop(1, 'rgba(255,214,102,0)');
    c.fillStyle = gr;
    c.fillRect(m.x - r, m.y - r, r * 2, r * 2);
  }
  // Ön koltuğun arkalığı geniş ve yüksektir: liderin başının arkasında altın bir taht gibi durur.
  const ab = tur === 'on' ? 0.44 : a, ust = tur === 'on' ? 1.12 : 0.66;
  bKutu(s.x - a, s.x + a, y + 0.06, y + 0.16, s.z - 0.2, s.z + 0.2, renk, cw);
  const ar = bKutu(s.x - ab, s.x + ab, y + 0.12, y + ust, s.z + 0.2, s.z + 0.3, renk, tur === 'on' ? cw * 2 : cw);
  if (tur === 'yolcu')
    bKutu(s.x - a + 0.04, s.x + a - 0.04, y + 0.5, y + 0.68, s.z + 0.19, s.z + 0.31, DOL.dantel, cw * 0.8);
  else if (ar.on) {
    // boncuklu örtü
    c.fillStyle = tur === 'on' ? '#b07a12' : DOL.boncuk;
    for (let yy = y + 0.2; yy < y + ust - 0.02; yy += 0.08)
      for (let xx = s.x - ab + 0.06; xx < s.x + ab - 0.03; xx += 0.08) {
        const q = bp(xx, yy, s.z + 0.198);
        c.beginPath();
        c.arc(q.x, q.y, Math.max(1, 0.017 * q.s), 0, TAU);
        c.fill();
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
  const w = Math.max(56, 0.5 * p.s), h = w * 0.52, adet = PARA_ADET[n.tip] || 1, renk = PARA_RENK[n.tip] || PARA_RENK.uzat;
  const r = w * 1.1, gr = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
  gr.addColorStop(0, 'rgba(255,240,190,.75)');
  gr.addColorStop(1, 'rgba(255,240,190,0)');
  c.fillStyle = gr;
  c.fillRect(p.x - r, p.y - r, r * 2, r * 2);
  for (let i = 0; i < adet; i++) {
    c.save();
    c.translate(p.x + (i - (adet - 1) / 2) * w * 0.14, p.y - i * h * 0.1);
    c.rotate(-0.3 + 0.18 * i + (azHareket ? 0 : 0.12 * Math.sin(TAU * B * 2 + i)));
    c.fillStyle = renk;
    c.strokeStyle = MUREKKEP;
    c.lineWidth = Math.max(2, w * 0.05);
    c.beginPath();
    c.roundRect(-w / 2, -h / 2, w, h, w * 0.06);
    c.fill();
    c.stroke();
    c.strokeStyle = renkKat(renk, '#ffffff', 0.5);
    c.lineWidth = Math.max(1, w * 0.03);
    c.strokeRect(-w * 0.4, -h * 0.32, w * 0.8, h * 0.64);
    c.fillStyle = renkKat(renk, '#ffffff', 0.55);
    c.beginPath();
    c.arc(0, 0, h * 0.28, 0, TAU);
    c.fill();
    c.fillStyle = renkKat(renk, '#080a1c', 0.55);
    c.font = '700 ' + Math.round(h * 0.44) + 'px Rubik, system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('₺', 0, 1);
    c.textBaseline = 'alphabetic';
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
  c.rotate(azHareket ? 0 : 0.08 * Math.sin(TAU * B / 4));
  c.lineWidth = Math.max(4, 0.06 * p.s);
  c.strokeStyle = '#1b1f26';
  c.beginPath();
  c.ellipse(0, 0, 0.24 * p.s, 0.11 * p.s, 0, 0, TAU);
  c.stroke();
  c.restore();
}
// Ad etiketinin punto ölçeği: çekirdek punto'yu et.s'den seçer (13–18); kalabalıkta yan yana adlar sığsın diye
// ölçek sınırlanır (14 punto).
const ETIKET_S = 82;

function oyunCiz() {
  const derin = s => bp(s.x, tabanY(s.r) + 0.4, s.z).d;
  for (const s of KOLTUK)
    ozel(derin(s) + 0.35, () => koltukCiz(s, 'yolcu'));
  ozel(derin(ON_KOLTUK) + 0.35, () => koltukCiz(ON_KOLTUK, 'on'));
  ozel(derin(SOFOR_KOLTUK) + 0.35, () => koltukCiz(SOFOR_KOLTUK, 'sofor'));
  // Torpido ön sıranın dizlerinin önündedir; önlük gibi öne uzanan parçalar da altında kalsın diye en öne sıralanır.
  ozel(bp(0, 0.5, ON_UC).d - 0.3, onPano);
  // şoför, gözlüğü ve direksiyonu
  if (insanEkle(sofor)) {
    basCevir(sofor);
    ozel(sofor.p.kafa.d - 0.052, gozluk);
    ozel(pr(direksiyonYeri()).d - 0.06, direksiyonCiz);
    sofor.et.s = Math.min(sofor.et.s, ETIKET_S);
  }
  // Kadrajın dışında kalanın adı yazılmaz: çekirdek etiketi ekran kenarına sıkıştırır, kenarda yığılırdı. Oyuncu
  // şeridinin üstüne taşan ad da yazılmaz (gösterideki yakın çekimde arkadakiler): sıralama kutusunun altına girerdi.
  for (const k of D.oy.values())
    if (insanEkle(k)) {
      basCevir(k);
      k.et.s = Math.min(k.et.s, ETIKET_S);
      if (k.et.x < -10 || k.et.x > GW + 10 || k.et.y > ALAN_ALT + 40 || k.et.y < ALAN_UST + 3)
        k.et = null;
    }
  // Gösteride sahne tek kişinindir: yakın çekimde öteki adlar hem kalabalık eder hem çekirdek onları üst üste itip
  // sahne yazılarının altına sokar. Yalnız yıldızın ve şoförün adı kalır.
  const dr = D.durak;
  if (dr && dr.yakin)
    for (const k of D.oy.values())
      if (k !== dr.k)
        k.et = null;
  adlariAc();
  onSiraAyir();
}
// Ön sıranın (kapı yanı, ön koltuk, şoför) adları çenenin altına, torpidonun üstündeki boşluğa yazılır: başın üstüne
// yazılsalar ikinci sıranın yüzlerini örterlerdi. Çekirdek etiketi hep başın üstüne koyduğu için (etiketCiz) bu
// adları oyunUst çekirdeğin görünüşüyle kendisi çizer; k.et boşaltılır. Onların yorum balonu da başlarının üstüne
// buradan çizilir: çekirdek balonu ancak etiketi olana çizer. Balon kapatma ve ad gizleme ayarına uyulur.
const onSira = [];
D.onSira = onSira; // testler ön sıranın adlarına bakabilsin
function onSiraAyir() {
  onSira.length = 0;
  const dr = D.durak;
  for (const k of [...D.oy.values(), sofor]) {
    if (!k.et || !k.koltuk || k.koltuk.r !== 0 || k.atla || k.cikiyor || (dr && dr.k === k && dr.ayakta))
      continue;
    const ph = k.p.kafa, R = KAFA_R * k.g.boy * ph.s;
    onSira.push({ k, x: k.et.x, y: ph.y + R + 3, ust: ph.y - R });
    k.et = null;
  }
}
function onSiraCiz() {
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (const a of onSira) {
    const k = a.k, bas = k === D.lider, punto = 14 + (bas ? 4 : 0), yk = punto + 9, tac = bas ? punto * 1.05 : 0;
    c.font = (bas ? '700 ' : '500 ') + punto + 'px Rubik, system-ui, sans-serif';
    const w = c.measureText(k.ad).width + punto * 1.1 + tac, x = clamp(a.x, w / 2 + 4, GW - w / 2 - 4), y = a.y;
    c.fillStyle = bas ? RENK.vurgu : renkSaydam(MUREKKEP, 0.78);
    c.beginPath();
    c.roundRect(x - w / 2, y, w, yk, yk / 2);
    c.fill();
    if (bas) {
      c.lineWidth = 2.5;
      c.strokeStyle = MUREKKEP;
      c.stroke();
      // taç (çekirdeğin etiketindeki gibi)
      const tx = x - w / 2 + punto * 0.5, ty = y + yk / 2, b = punto * 0.42;
      c.fillStyle = RENK.sicak;
      c.beginPath();
      c.moveTo(tx, ty + b * 0.7);
      c.lineTo(tx - b * 0.15, ty - b * 0.6);
      c.lineTo(tx + b * 0.45, ty);
      c.lineTo(tx + b, ty - b * 0.85);
      c.lineTo(tx + b * 1.55, ty);
      c.lineTo(tx + b * 2.15, ty - b * 0.6);
      c.lineTo(tx + b * 2, ty + b * 0.7);
      c.closePath();
      c.fill();
    }
    c.fillStyle = bas ? MUREKKEP : k.ozel ? RENK.vurgu : RENK.acik;
    c.fillText(k.ad, x + tac / 2, y + yk / 2 + 1);
    const bl = k.balon, ya = bl ? zaman - bl.t0 : 99;
    if (bl && ayar.balon && !modKume.gizli.has(k.id) && ya < 3.4) {
      c.font = '700 21px Rubik, system-ui, sans-serif';
      const bw = Math.min(330, c.measureText(bl.m).width + 28), bx = clamp(a.x, bw / 2 + 8, GW - bw / 2 - 8), by = a.ust - 10;
      c.globalAlpha = Math.min(1, ya * 8, (3.4 - ya) * 4);
      c.fillStyle = RENK.vurgu;
      c.strokeStyle = MUREKKEP;
      c.lineWidth = 2.5;
      c.beginPath();
      c.roundRect(bx - bw / 2, by - 36, bw, 36, 14);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(a.x - 8, by - 2);
      c.lineTo(a.x, by + 9);
      c.lineTo(a.x + 8, by - 2);
      c.stroke();
      c.fill();
      c.fillStyle = MUREKKEP;
      c.fillText(bl.m, bx, by - 17, bw - 18);
      c.globalAlpha = 1;
    }
  }
  c.textBaseline = 'alphabetic';
}
// Aynı sıradaki adlar yan yana sığmazsa çekirdek birini bir satır yukarı iter: arkadaki yüzün üstüne, en arka sırada
// sıralama kutusunun altına girer. Bunu önlemek için her sıranın adları burada yana açılır (çekirdeğin punto ve
// kutu genişliği hesabıyla, 30-sahne.js etiketCiz).
function adlariAc() {
  const siralar = new Map();
  for (const k of [...D.oy.values(), sofor]) {
    if (!k.et || !k.koltuk || k.atla || k.cikiyor)
      continue;
    const bas = k === D.lider, punto = clamp(Math.round(k.et.s * 0.17), 13, 18) + (bas ? 4 : 0);
    c.font = (bas ? '700 ' : '500 ') + punto + 'px Rubik, system-ui, sans-serif';
    const w = c.measureText(k.ad).width + punto * 1.1 + (bas ? punto * 1.05 : 0) + 6;
    const s = siralar.get(k.koltuk.r) || [];
    s.push({ k, w, x: k.et.x });
    siralar.set(k.koltuk.r, s);
  }
  for (const s of siralar.values()) {
    s.sort((a, b) => a.x - b.x);
    for (let tur = 0; tur < 8; tur++) {
      for (let i = 0; i + 1 < s.length; i++) {
        const eksik = (s[i].w + s[i + 1].w) / 2 - (s[i + 1].x - s[i].x);
        if (eksik > 0) {
          s[i].x -= eksik / 2;
          s[i + 1].x += eksik / 2;
        }
      }
      for (const a of s)
        a.x = clamp(a.x, a.w / 2 + 4, GW - a.w / 2 - 4);
    }
    for (const a of s)
      a.k.et.x = a.x;
  }
}

/* ---- listenin üstüne: banknotlar, yazılar, gösteriler ---- */
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
  if (etkin(D.sollama)) {
    const on = bp(0, 0.6, ON_UC), u = (B - D.sollama.bas) / D.sollama.sure;
    if (on.ok && u < 0.6)
      yaziKalin('VIIIN!', GW / 2, Math.min(ALAN_ALT - 30, on.y + 10), 40, RENK.vurgu);
  }
  // teyp: torpidodan notalar yükselir
  if (etkin(D.teyp) && !azHareket) {
    const m = bp(-1.15, ZEMIN_Y + 0.45, -0.44);
    if (m.ok)
      for (let i = 0; i < 6; i++) {
        const t = ((B - D.teyp.bas) * 0.5 + i / 6) % 1, x = m.x + (i % 2 ? -1 : 1) * t * m.s * 0.9 + Math.sin(t * 9 + i) * m.s * 0.12, y = m.y - t * m.s * 1.6;
        c.globalAlpha = Math.sin(Math.PI * t);
        notaCiz(x, y, clamp(m.s * 0.12, 10, 26), i % 2 ? RENK.serin : RENK.vurgu);
      }
    c.globalAlpha = 1;
  }
  // kasis: "HOP!"
  if (D.kasis && B >= D.kasis.bas && B - D.kasis.bas < 1.6) {
    const p = bp(0, ARKA_UST, ARKA_Z), u = (B - D.kasis.bas) / 1.6;
    if (p.ok) {
      c.globalAlpha = Math.min(1, (1 - u) * 3);
      yaziKalin('HOP!', GW / 2, Math.max(ALAN_UST + 40, p.y + 30 - u * 30), Math.round(34 + 16 * Math.sin(Math.PI * Math.min(1, u * 2))), RENK.vurgu);
      c.globalAlpha = 1;
    }
  }
  onSiraCiz();
  // şoförün teşekkürü: başının yanında, dolmuşun sağ kenarına doğru (yüzlerin ve banknotun üstüne düşmesin)
  const ts = D.tesekkur, sk = sofor.p.kafa;
  if (ts && B - ts.b0 < 2 && sk && sk.ok) {
    c.globalAlpha = clamp((2 - (B - ts.b0)) * 3, 0, 1);
    hap(ts.m, sk.x + KAFA_R * sofor.g.boy * sk.s * 2.2, sk.y + KAFA_R * sofor.g.boy * sk.s * 0.9, 15, '#fff7e6', MUREKKEP);
    c.globalAlpha = 1;
  }
  // Banknotlar her şeyin üstünde: elden ele geçiş oyunun asıl anıdır, öndeki başların arkasında kaybolmasın.
  // Arkasında az önce geçtiği yerlerden kalan altın bir iz olur; havadayken "Uzatır mısınız?" yazar.
  for (const n of D.paralar) {
    if (!n.p)
      continue;
    const p = pr(n.p);
    if (!p.ok)
      continue;
    n.iz.push([p.x, p.y]);
    if (n.iz.length > 10)
      n.iz.shift();
    c.fillStyle = '#ffe9a8';
    for (let i = 0; i < n.iz.length - 1; i++) {
      c.globalAlpha = (i + 1) / n.iz.length * 0.8;
      c.beginPath();
      c.arc(n.iz[i][0], n.iz[i][1], 3 + i * 0.9, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
    banknotCiz(n);
    if (B < n.t0)
      hap('Uzatır mısınız?', p.x, p.y - Math.max(56, 0.5 * p.s) * 0.5 - 26, 19, '#fff7e6', MUREKKEP);
  }
  // inen yolcu
  for (const k of D.oy.values())
    if (k.cikiyor && zaman - k.cikis < 1.4 && k.p.kafa && k.p.kafa.ok)
      hap('Müsait bir yerde!', k.p.kafa.x, k.p.kafa.y - KAFA_R * k.g.boy * k.p.kafa.s - 20, 16, '#fff7e6', MUREKKEP);
  // gösteri: gönderenin büyük adı
  const d = D.durak;
  if (d && d.yakin) {
    const y = ALAN_ALT - 40;
    c.globalAlpha = clamp((B - d.bas - 0.5) * 2, 0, 1) * clamp((d.bas + DURAK_V - 0.8 - B) * 2, 0, 1);
    yaziKalin('MÜSAİT BİR YERDE!', GW / 2, y - 50, 38, RENK.sicak);
    hap(d.k.ad + ' için duruyoruz', GW / 2, y, 26, RENK.vurgu, MUREKKEP);
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
