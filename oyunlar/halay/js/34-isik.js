/* IŞIK — fenerler, ampul ve flama ipleri, yumuşak yönlü gölgeler, havada uçuşan ışık zerreleri, hediye gösterilerinin
 * ışıkları (davulun yerde yayılan halkaları, solo ışıkları, zıplayanın yıldızları), halay başının altın halkası.
 * isikHazirla: ışık ve gölge damgaları bir kez çizilir · Kanca: oyunZemin().
 * Damga (sprite): her karede gradyan üretmek yerine önceden çizilmiş küçük tuval; drawImage ile basılır.
 */
const AMPUL = ['#ffd166', '#e23d2f', '#ffd166', '#22b8a7', '#f6ecd9'];
const FLAMA = ['#e23d2f', '#f6ecd9', '#22b8a7', '#f2b632'];
const damga = { hale: {}, ampul: {}, golge: null, kafa: null, boyun: null };
// solo: solo ışığının yumuşak açılıp kapanması (0–1) · halkalar: davulun yerde yayılan vuruş halkaları
const isik = { solo: 0, halkalar: [], dumOnce: 0 };

function damgaYap(boy, ciz) {
  const t = document.createElement('canvas');
  t.width = t.height = boy;
  ciz(t.getContext('2d'), boy / 2);
  return t;
}
function isikHazirla() {
  for (const renk of [...AMPUL, '#ffb347', '#fff3c8']) {
    damga.hale[renk] = damgaYap(96, (a, o) => {
      const g = a.createRadialGradient(o, o, 0, o, o, o);
      g.addColorStop(0, renkSaydam(renk, 0.85));
      g.addColorStop(0.16, renkSaydam(renk, 0.42));
      g.addColorStop(0.45, renkSaydam(renk, 0.12));
      g.addColorStop(1, renkSaydam(renk, 0));
      a.fillStyle = g;
      a.fillRect(0, 0, o * 2, o * 2);
    });
    // ampulün camı: ortası akkor, kenarı kendi renginde
    damga.ampul[renk] = damgaYap(40, (a, o) => {
      const g = a.createRadialGradient(o - 3, o - 4, 1, o, o, o - 2);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.35, renkKat(renk, '#ffffff', 0.45));
      g.addColorStop(0.8, renk);
      g.addColorStop(1, renkKat(renk, '#3a1a2a', 0.45));
      a.fillStyle = g;
      a.beginPath();
      a.arc(o, o, o - 2, 0, TAU);
      a.fill();
    });
  }
  // yer gölgesi: kenarı keskin olmayan koyu leke
  damga.golge = damgaYap(96, (a, o) => {
    const g = a.createRadialGradient(o, o, 0, o, o, o);
    g.addColorStop(0, 'rgba(22,10,34,.62)');
    g.addColorStop(0.5, 'rgba(22,10,34,.4)');
    g.addColorStop(1, 'rgba(22,10,34,0)');
    a.fillStyle = g;
    a.fillRect(0, 0, o * 2, o * 2);
  });
  // başın hacmi: tepede fenerlerden gelen sıcak kenar ışığı, saçta parıltı, çenenin altında serin gölge
  damga.kafa = damgaYap(160, (a, o) => {
    const R = o * 0.9375;
    a.beginPath();
    a.arc(o, o, R - 2, 0, TAU);
    a.clip();
    const golge = a.createRadialGradient(o - R * 0.16, o - R * 0.42, R * 0.72, o - R * 0.1, o - R * 0.3, R * 1.42);
    golge.addColorStop(0, 'rgba(46,18,70,0)');
    golge.addColorStop(1, 'rgba(46,18,70,.5)');
    a.fillStyle = golge;
    a.fillRect(0, 0, o * 2, o * 2);
    const kenar = a.createRadialGradient(o, o + R * 0.07, R * 0.9, o, o + R * 0.07, R * 1.02);
    kenar.addColorStop(0, 'rgba(255,226,165,0)');
    kenar.addColorStop(1, 'rgba(255,226,165,.8)');
    a.fillStyle = kenar;
    a.fillRect(0, 0, o * 2, o * 0.9);
    const parilti = a.createRadialGradient(o - R * 0.36, o - R * 0.58, 0, o - R * 0.36, o - R * 0.58, R * 0.36);
    parilti.addColorStop(0, 'rgba(255,255,255,.42)');
    parilti.addColorStop(1, 'rgba(255,255,255,0)');
    a.fillStyle = parilti;
    a.fillRect(0, 0, o * 2, o * 2);
  });
  // başın gövdeye düşürdüğü gölge
  damga.boyun = damgaYap(64, (a, o) => {
    const g = a.createRadialGradient(o, o, 0, o, o, o);
    g.addColorStop(0, 'rgba(30,12,44,.55)');
    g.addColorStop(0.6, 'rgba(30,12,44,.34)');
    g.addColorStop(1, 'rgba(30,12,44,0)');
    a.fillStyle = g;
    a.fillRect(0, 0, o * 2, o * 2);
  });
}
// Işık damgası: ekranda (x, y) merkezli, cap genişliğinde, üst üste bindikçe parlayan ('lighter') hale.
function haleBas(renk, x, y, cap, al) {
  c.globalAlpha = al;
  c.drawImage(damga.hale[renk], x - cap / 2, y - cap / 2, cap, cap);
}
// Dört kollu ışıltı (yıldız): mendilin izi, solo ve zıplama gösterileri.
function isiltiCiz(x, y, r, renk, al) {
  if (r < 0.6 || al <= 0.01)
    return;
  c.globalAlpha = Math.min(1, al);
  c.fillStyle = renk;
  c.beginPath();
  c.moveTo(x, y - r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y);
  c.quadraticCurveTo(x, y, x, y - r);
  c.fill();
}

/* ---- fenerler, ampul ipi, flamalar: fon perdesinin önünde, meydanın arkasında; vuruşla yanıp söner ---- */
function fenerIsikCiz() {
  const ox = katmanX('on'), nabiz = 0.5 + 0.5 * Math.cos(TAU * B);
  c.globalCompositeOperation = 'lighter';
  // meydanın üstünde asılı duran ışıklı pus
  c.globalAlpha = 0.2 + 0.05 * nabiz;
  c.drawImage(damga.hale['#ffb347'], GW / 2 - 430, UFUK - 150, 860, 330);
  for (const d of FON_DIREK) {
    for (const s of [-1, 1])
      haleBas('#ffb347', d.x + s * 17 + ox, d.y + 20, 78 + 10 * nabiz, 0.6 + 0.2 * nabiz);
    // fenerin direğin dibine düşürdüğü ışık havuzu
    c.globalAlpha = 0.34 + 0.08 * nabiz;
    c.drawImage(damga.hale['#ffb347'], d.x + ox - 120, UFUK - 14, 240, 70);
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}
// İpler direkten direğe sarkar; iki uçta ekranın dışına uzanır.
function ipler() {
  const d = FON_DIREK, n = [];
  n.push([d[0].x - 150, d[0].y - 26, d[0].x, d[0].y + 7, 10, 4]);
  for (let i = 0; i + 1 < d.length; i++)
    n.push([d[i].x, d[i].y + 7, d[i + 1].x, d[i + 1].y + 7, 30, 10]);
  n.push([d[d.length - 1].x, d[d.length - 1].y + 7, d[d.length - 1].x + 150, d[d.length - 1].y - 26, 10, 4]);
  return n;
}
const IPLER = ipler();
function ampulCiz() {
  const ox = katmanX('on');
  let say = 0;
  // flamalar: ampul ipinin altında, daha derin sarkan ikinci ip; üçgen bezler vuruşla sallanır
  for (let q = 1; q + 1 < IPLER.length; q++) {
    const [x1, y1, x2, y2] = IPLER[q], adet = 13, nokta = t => [lerp(x1, x2, t) + ox, lerp(y1, y2, t) - 4 + 46 * 4 * t * (1 - t)];
    c.strokeStyle = 'rgba(8,10,28,.8)';
    c.lineWidth = 1.4;
    c.beginPath();
    for (let i = 0; i <= 24; i++) {
      const [x, y] = nokta(i / 24);
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
    for (let i = 0; i < adet; i++) {
      const t = (i + 0.5) / adet, [x, y] = nokta(t), [xs, ys] = nokta(t + 0.01), egim = Math.atan2(ys - y, xs - x);
      const sal = azHareket ? 0 : 0.2 * Math.sin(B * Math.PI + i * 0.9 + q);
      c.save();
      c.translate(x, y);
      c.rotate(egim + sal);
      c.fillStyle = FLAMA[(i + q) % FLAMA.length];
      c.beginPath();
      c.moveTo(-7, 0);
      c.lineTo(7, 0);
      c.lineTo(0, 17);
      c.closePath();
      c.fill();
      // bezin gölgede kalan yarısı
      c.fillStyle = 'rgba(10,8,34,.28)';
      c.beginPath();
      c.moveTo(-7, 0);
      c.lineTo(0, 0);
      c.lineTo(0, 17);
      c.closePath();
      c.fill();
      c.restore();
    }
  }
  for (const [x1, y1, x2, y2, sark, adet] of IPLER) {
    const nokta = t => [lerp(x1, x2, t) + ox, lerp(y1, y2, t) + sark * 4 * t * (1 - t)];
    c.strokeStyle = 'rgba(8,10,28,.9)';
    c.lineWidth = 2;
    c.beginPath();
    for (let i = 0; i <= 24; i++) {
      const [x, y] = nokta(i / 24);
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
    for (let i = 1; i < adet; i++) {
      const [x, y] = nokta(i / adet), renk = AMPUL[say % AMPUL.length], par = 0.7 + 0.3 * Math.sin(B * Math.PI + say * 1.7);
      say++;
      c.globalCompositeOperation = 'lighter';
      haleBas(renk, x, y + 9, 58 * (0.75 + 0.25 * par), 0.5 + 0.4 * par);
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
      // duy
      c.fillStyle = '#1a1226';
      c.fillRect(x - 2.5, y, 5, 5);
      c.globalAlpha = 0.72 + 0.28 * par;
      c.drawImage(damga.ampul[renk], x - 7, y + 3, 14, 14);
    }
  }
  c.globalAlpha = 1;
}

/* ---- havadaki ışık zerreleri: fener ışığında yükselen toz. Yarısı oynayanların arkasında, yarısı önünde ---- */
const ZERRE = Array.from({ length: 46 }, (_, i) => {
  const r = rastgeleUret(300 + i);
  return { x: r(), y: r(), hiz: 0.35 + r() * 0.65, evre: r() * TAU, boy: 5 + r() * 9, on: i % 2 };
});
function zerreCiz(on) {
  const ust = UFUK - 40, yuk = ALAN_ALT - 30 - ust, t = azHareket ? 0 : zaman;
  c.globalCompositeOperation = 'lighter';
  for (const z of ZERRE) {
    if (z.on !== on)
      continue;
    const yol = (z.y * yuk + t * 15 * z.hiz) % yuk, y = ust + yuk - yol;
    const x = ((z.x * (GW + 80) + Math.sin(t * 0.6 * z.hiz + z.evre) * 30 - kam.yaw * 400) % (GW + 80) + GW + 80) % (GW + 80) - 40;
    // iki uçta ve ışığın yetişmediği kenarlarda söner; vuruşla göz kırpar
    const kenar = Math.min(1, yol / 60, (yuk - yol) / 90) * clamp(1.25 - Math.abs(x - GW / 2) / 330, 0, 1);
    const kirp = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(B * Math.PI * z.hiz + z.evre));
    haleBas(z.on ? '#fff3c8' : '#ffd166', x, y, z.boy * (z.on ? 1.3 : 1), 0.75 * kenar * kirp);
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

/* ---- gölgeler: ışık meydanın arkasındaki fenerlerden gelir, gölge öne ve yanlara doğru uzar ---- */
function golgeCiz(k) {
  const boy = k.g.boy, g = pr([k.x, 0, k.z]);
  if (!g.ok)
    return;
  let dx = k.x, dz = k.z - (kam.tz + D.meydanR + 2.5);
  const u = Math.hypot(dx, dz) || 1, uzun = 0.72 * boy;
  dx /= u;
  dz /= u;
  // zıplayanın gölgesi küçülür ve solar
  const yuk = Math.max(0, k.j.hip ? k.j.hip[1] - k.y0 - KALCA * boy : 0), kis = 1 / (1 + yuk * 3);
  const uc = pr([k.x + dx * uzun, 0, k.z + dz * uzun]);
  if (uc.ok) {
    const ax = uc.x - g.x, ay = uc.y - g.y, L = Math.hypot(ax, ay), en = 0.42 * boy * g.s;
    c.save();
    c.translate((g.x + uc.x) / 2, (g.y + uc.y) / 2);
    c.rotate(Math.atan2(ay, ax));
    c.globalAlpha = 0.8 * kis;
    c.drawImage(damga.golge, -(L / 2 + en * 0.7), -en / 2, L + en * 1.4, en);
    c.restore();
  }
  const rx = 0.3 * boy * g.s * kis, rz = 0.16 * boy * g.s * kis;
  c.globalAlpha = 0.95 * kis;
  c.drawImage(damga.golge, g.x - rx, g.y - rz, rx * 2, rz * 2);
  c.globalAlpha = 1;
}

/* ---- gösteri ışıkları ---- */
function isikGuncelle(dt) {
  const hedef = D.solo && D.solo.k.yer > 0.5 ? 1 : 0;
  isik.solo += (hedef - isik.solo) * Math.min(1, dt * 3.5);
  // davulun her "düm"ü yerde bir halka başlatır
  if (calgi.dumP > 0.8 && isik.dumOnce <= 0.8 && isik.halkalar.length < 8)
    isik.halkalar.push({ t0: zaman, x: davulcu.x, z: davulcu.z, sov: !!muzik.sov });
  isik.dumOnce = calgi.dumP;
  while (isik.halkalar.length && zaman - isik.halkalar[0].t0 > 0.9)
    isik.halkalar.shift();
}
// Yerdeki bir dairenin ekrandaki basıklığı: kamera ne kadar yatık bakıyorsa o kadar basık.
const yerBasik = () => Math.sin(kam.egim);
function davulHalkaCiz() {
  const bas = yerBasik();
  if (muzik.sov) {
    const g = pr([davulcu.x, 0, davulcu.z]);
    if (g.ok) {
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.45 + 0.4 * calgi.dumP;
      c.drawImage(damga.hale['#ffd166'], g.x - 1.3 * g.s, g.y - 1.3 * g.s * bas, 2.6 * g.s, 2.6 * g.s * bas);
      c.globalCompositeOperation = 'source-over';
    }
  }
  for (const h of isik.halkalar) {
    const t = (zaman - h.t0) / 0.9, g = pr([h.x, 0, h.z]);
    if (!g.ok || t < 0 || t > 1)
      continue;
    const r = (0.3 + (h.sov ? 3.2 : 0.7) * yumusak(t)) * g.s, soluk = (1 - t) * (1 - t);
    c.strokeStyle = h.sov ? '#ffd166' : '#f6ecd9';
    // şovda halka üç katlıdır: geniş ve soluk bir ışık, üstünde parlak çizgi
    for (const [kal, al] of h.sov ? [[0.34, 0.16], [0.14, 0.32], [0.05, 0.9]] : [[0.045, 0.4]]) {
      c.globalAlpha = soluk * al;
      c.lineWidth = Math.max(2, g.s * kal * (1 - t * 0.5));
      c.beginPath();
      c.ellipse(g.x, g.y, r, r * bas, 0, 0, TAU);
      c.stroke();
    }
  }
  c.globalAlpha = 1;
}
// Solo: yerde dönen ışık yelpazesi, direklerdeki fenerlerden inen huzmeler, ayak altında altın havuz.
function soloZeminCiz() {
  const s = isik.solo;
  if (s < 0.02 || !D.solo)
    return;
  const g = pr([D.solo.k.x, 0, D.solo.k.z]);
  if (!g.ok)
    return;
  const bas = yerBasik(), nabiz = 0.5 + 0.5 * Math.cos(TAU * B), ox = katmanX('on');
  c.globalCompositeOperation = 'lighter';
  // huzmeler
  for (const [i, d] of FON_DIREK.entries()) {
    const lx = d.x + ox, ly = d.y + 20, yari = (0.62 + 0.08 * nabiz) * g.s;
    const gr = c.createLinearGradient(lx, ly, g.x, g.y);
    gr.addColorStop(0, i === 1 ? 'rgba(255,236,190,.42)' : 'rgba(255,196,110,.3)');
    gr.addColorStop(1, 'rgba(255,209,102,.07)');
    c.fillStyle = gr;
    // iç içe iki huzme: dar olan parlak, geniş olan soluk; kenar yumuşak görünür
    for (const [gen, al] of [[1, 0.55], [1.9, 0.3]]) {
      c.globalAlpha = s * al * (0.75 + 0.25 * Math.sin(B * Math.PI + i * 2.1));
      c.beginPath();
      c.moveTo(lx - 4 * gen, ly);
      c.lineTo(lx + 4 * gen, ly);
      c.lineTo(g.x + yari * gen, g.y);
      c.lineTo(g.x - yari * gen, g.y);
      c.closePath();
      c.fill();
    }
  }
  // yerde dönen yelpaze
  c.save();
  c.translate(g.x, g.y);
  c.scale(1, bas);
  c.rotate(azHareket ? 0 : B * TAU / 16);
  const yar = 2.3 * g.s, yel = c.createRadialGradient(0, 0, 0, 0, 0, yar);
  yel.addColorStop(0, 'rgba(255,214,120,.5)');
  yel.addColorStop(0.5, 'rgba(255,196,100,.16)');
  yel.addColorStop(1, 'rgba(255,196,100,0)');
  c.fillStyle = yel;
  c.globalAlpha = s;
  for (let i = 0; i < 10; i++) {
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, yar, i / 10 * TAU, (i + 0.5) / 10 * TAU);
    c.closePath();
    c.fill();
  }
  c.restore();
  // ayak altındaki havuz ve vuruşla açılan halka
  c.globalAlpha = s * (0.7 + 0.3 * nabiz);
  c.drawImage(damga.hale['#ffd166'], g.x - 1.5 * g.s, g.y - 1.5 * g.s * bas, 3 * g.s, 3 * g.s * bas);
  c.globalCompositeOperation = 'source-over';
  const vu = ((B % 1) + 1) % 1, hr = (0.5 + 1.1 * vu) * g.s;
  c.globalAlpha = s * (1 - vu) * 0.8;
  c.strokeStyle = '#ffe9a8';
  c.lineWidth = Math.max(2, g.s * 0.035);
  c.beginPath();
  c.ellipse(g.x, g.y, hr, hr * bas, 0, 0, TAU);
  c.stroke();
  c.globalAlpha = 1;
}
// Solo sürerken sahnenin geri kalanı kararır; oynayanın çevresinde yıldızlar yükselir. Listenin üstüne çizilir.
function soloUstCiz() {
  const s = isik.solo;
  if (s < 0.02 || !D.solo)
    return;
  const k = D.solo.k, o = pr([k.x, 0.45, k.z]);
  if (!o.ok)
    return;
  const perde = c.createRadialGradient(o.x, o.y, o.s * 1.1, o.x, o.y, o.s * 3.6);
  perde.addColorStop(0, 'rgba(6,8,30,0)');
  perde.addColorStop(1, 'rgba(6,8,30,' + 0.5 * s + ')');
  c.fillStyle = perde;
  c.fillRect(0, 0, GW, GH);
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) {
    const evre = (((B / 3 + i * 0.137) % 1) + 1) % 1, aci = i * 2.4 + B * 0.25, uz = 0.45 + 0.5 * ((i * 0.618) % 1);
    const p = pr([k.x + Math.cos(aci) * uz, 0.1 + evre * 1.7, k.z + Math.sin(aci) * uz]);
    if (p.ok)
      isiltiCiz(p.x, p.y, p.s * (0.05 + 0.07 * ((i * 0.37) % 1)) * Math.sin(evre * Math.PI), i % 3 ? '#ffd166' : '#fff3c8', s * Math.sin(evre * Math.PI));
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}
// Hediye sevinci: zıplayanın başının çevresinde açılan yıldızlar.
function ziplaIsiltiCiz() {
  c.globalCompositeOperation = 'lighter';
  for (const k of D.oy.values()) {
    if (!(B >= k.zip0 && B < k.zip1) || !k.p.kafa || !k.p.kafa.ok)
      continue;
    const ph = k.p.kafa, u = (B - k.zip0) / Math.max(0.5, k.zip1 - k.zip0), R = KAFA_R * k.g.boy * ph.s;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * (0.08 + 0.84 * i / 6), uz = R * (1.25 + 0.9 * yumusak(u * 2) + 0.2 * (i % 2));
      isiltiCiz(ph.x + Math.cos(a) * uz, ph.y + Math.sin(a) * uz, R * (0.2 + 0.12 * (i % 2)) * Math.sin(Math.min(1, u * 1.2) * Math.PI), i % 2 ? '#fff3c8' : '#ffd166', 1 - u);
    }
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}
// Halay başının ayağının altında vuruşla atan altın halka: ışıklı zemin, çift çizgi, çevresinde dönen baklavalar.
function liderHalkaCiz() {
  if (!D.lider)
    return;
  const g = pr([D.lider.x, 0, D.lider.z]);
  if (!g.ok)
    return;
  const bas = yerBasik(), n = 1 + 0.08 * Math.sin(B * TAU), rx = 0.4 * g.s * n, ry = rx * bas;
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.55;
  c.drawImage(damga.hale['#ffd166'], g.x - rx * 1.9, g.y - ry * 1.9, rx * 3.8, ry * 3.8);
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
  c.strokeStyle = 'rgba(120,60,10,.55)';
  c.lineWidth = Math.max(3, g.s * 0.05);
  c.beginPath();
  c.ellipse(g.x, g.y + 1.5, rx, ry, 0, 0, TAU);
  c.stroke();
  c.strokeStyle = '#ffd166';
  c.lineWidth = Math.max(2, g.s * 0.034);
  c.beginPath();
  c.ellipse(g.x, g.y, rx, ry, 0, 0, TAU);
  c.stroke();
  c.strokeStyle = '#fff3c8';
  c.lineWidth = Math.max(1, g.s * 0.01);
  c.beginPath();
  c.ellipse(g.x, g.y - 1, rx * 0.86, ry * 0.86, 0, 0, TAU);
  c.stroke();
  c.fillStyle = '#ffd166';
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + (azHareket ? 0 : B * TAU / 8), x = g.x + Math.cos(a) * rx * 1.24, y = g.y + Math.sin(a) * ry * 1.24, q = g.s * 0.035;
    c.beginPath();
    c.moveTo(x - q, y);
    c.lineTo(x, y - q * bas);
    c.lineTo(x + q, y);
    c.lineTo(x, y + q * bas);
    c.closePath();
    c.fill();
  }
}

function oyunZemin() {
  // Meydanın ışığı ve kilim çevresi oynayanları ortalar: üç kişi de otuz altı kişi de ışığın içinde durur.
  D.meydanR += (Math.max(kam.son.enX, kam.son.hd) + 1.7 - D.meydanR) * Math.min(1, sonDt * 1.6);
  isikGuncelle(sonDt);
  zeminCiz();
  zerreCiz(0);
  davulHalkaCiz();
  soloZeminCiz();
  for (const k of D.oy.values())
    golgeCiz(k);
  for (const k of CALGICILAR)
    golgeCiz(k);
  liderHalkaCiz();
}
