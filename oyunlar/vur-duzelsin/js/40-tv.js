/* TELEVİZYON — sahnenin yıldızı: sehpa, ceviz kasa, tüp çıkıntısı, dantel örtü, vazo, tavşan kulağı anten,
 * nazar boncuğu, ekran camı, kanal / ses düğmeleri, hafıza tuşları, sinyal ışıkları, hoparlör kumaşı.
 *
 * Çizim tek bir ozel() içinde yapılır. Kasanın her yüzü için yerel → ekran afin dönüşümü kurulur (yuzAc):
 * yüzün ayrıntısı metre cinsinden, düz 2B olarak çizilir; perspektif ve ezilme dönüşümün içindedir.
 * Ezilme (tvDef): soldan vurulunca sol kenar içeri girer, sağ kenar sabit kalır, gövde boyuna uzar ve sağa
 * yatar; yay geri esnetir. Üstten vurulunca gövde basılır, yana yayılır. Zıplama gövdeyi sehpadan kaldırır.
 * Televizyonun yerel ekseni: x sağ, y yukarı (yerden metre), z arkaya. Ön yüz z = TV_ON.
 */
const DUGME = { kanal: [0.7, TV_UST - 0.47], ses: [0.7, TV_UST - 0.8] }; // ön yüzdeki düğme merkezleri (x, y)
const EKRAN = { x0: -0.85, x1: 0.41, y0: 0.16, y1: 1.2 };              // ekran camı (ön yüz: üstten aşağı)
const AH = { kok: [0.36, TV_UST + 0.07, 0.12] };                        // antenin dibi
const CEVIZ = '#8a4a26', CEVIZ_ACIK = '#a65d31', CEVIZ_KOYU = '#5e2f17';

// Deformasyon: yerel nokta → ezilmiş yerel nokta. Sehpa bundan etkilenmez.
function tvDef(p) {
  const t = D.tv, y = p[1] - TV_ALT;
  let x = p[0];
  x -= 0.21 * t.sqL * (x - TV_W);
  x -= 0.21 * t.sqR * (x + TV_W);
  x *= 1 + 0.08 * t.sqT;
  x += t.sh * y;
  // karlıyken kasa vuruşla hafifçe titrer (görüntü bozuk, cihaz huysuz)
  x += Math.sin(TAU * B * 2) * 0.008 * (1 - D.netlik) * (y / (TV_UST - TV_ALT));
  const sy = 1 + 0.12 * (t.sqL + t.sqR) - 0.18 * t.sqT;
  return [x, TV_ALT + y * sy + t.jy, p[2] * (1 + 0.04 * t.sqT)];
}
function tvP(p) { return pr(tvDunya(tvDef(p))); }
function sehpaP(p) { return pr(tvDunya(p)); }
// Dünya noktasını televizyonun yerel eksenine çevirir (deformasyonsuz).
function tvYerel(w) { const x = w[0], z = w[2] - TVZ; return [x * TV_C - z * TV_S, w[1], x * TV_S + z * TV_C]; }
// Yüz dönüşümü: o köşesinden ex ve ey yönleri (yerel, birim metre) tuvalin x ve y'si olur.
function yuzAc(o, ex, ey) {
  const a = tvP(o), b = tvP([o[0] + ex[0] * 0.5, o[1] + ex[1] * 0.5, o[2] + ex[2] * 0.5]), d = tvP([o[0] + ey[0] * 0.5, o[1] + ey[1] * 0.5, o[2] + ey[2] * 0.5]);
  c.save();
  c.transform((b.x - a.x) * 2, (b.y - a.y) * 2, (d.x - a.x) * 2, (d.y - a.y) * 2, a.x, a.y);
}
// Bir yüz kameraya bakıyor mu: dünyadaki normal ile kameraya giden yönün çarpımı.
function gorunur(nokta, normal) {
  const w = tvDunya(nokta), n = [normal[0] * TV_C + normal[2] * TV_S, normal[1], -normal[0] * TV_S + normal[2] * TV_C];
  return (kam.C[0] - w[0]) * n[0] + (kam.C[1] - w[1]) * n[1] + (kam.C[2] - w[2]) * n[2] > 0;
}
function cokgen(noktalar, dolgu, cizgi) {
  c.beginPath();
  noktalar.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
  c.closePath();
  if (dolgu) {
    c.fillStyle = dolgu;
    c.fill();
  }
  if (cizgi) {
    c.lineWidth = cizgi;
    c.strokeStyle = MUREKKEP;
    c.stroke();
  }
}

/* ---- sehpa ---- */
// Altmışlardan kalma sivri ayaklı sehpa: ceviz tabla, altta gazete rafı, ayak uçlarında pirinç yüksük.
function sehpaCiz(s) {
  const w = 0.88, d0 = -0.5, d1 = 0.5, ust = TV_ALT - 0.02, kal = 0.07, lw = Math.max(1.5, s * 0.014);
  const ayak = (x, z) => {
    const ux = x * 1.12, uz = z * 1.12, a = sehpaP([x * 0.92, ust - kal, z * 0.9]), b = sehpaP([ux, 0, uz]);
    if (!a.ok || !b.ok)
      return;
    kapYol(a.x, a.y, 0.035 * a.s, b.x, b.y, 0.018 * b.s);
    c.fillStyle = CEVIZ_KOYU;
    c.fill();
    c.lineWidth = lw;
    c.stroke();
    c.beginPath();
    c.arc(b.x, b.y - 0.02 * b.s, 0.024 * b.s, 0, TAU);
    c.fillStyle = '#d9a83c';
    c.fill();
    c.stroke();
  };
  c.strokeStyle = MUREKKEP;
  ayak(-w, d1);
  ayak(w, d1);
  // gazete rafı ve üstündeki gazeteler
  const r = [[-w * 0.95, 0.12, d0 * 0.9], [w * 0.95, 0.12, d0 * 0.9], [w * 0.95, 0.12, d1 * 0.9], [-w * 0.95, 0.12, d1 * 0.9]].map(sehpaP);
  cokgen(r, CEVIZ_KOYU, lw);
  const g = [[-0.6, 0.13, -0.3], [0.1, 0.13, -0.3], [0.1, 0.2, -0.3], [-0.6, 0.2, -0.3]].map(sehpaP);
  cokgen(g, '#e9e1cc', lw * 0.8);
  c.strokeStyle = 'rgba(60,40,30,.45)';
  c.lineWidth = lw * 0.6;
  for (let i = 1; i < 3; i++) {
    const a = sehpaP([-0.58, 0.13 + i * 0.023, -0.31]), b = sehpaP([0.08, 0.13 + i * 0.023, -0.31]);
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
  }
  c.strokeStyle = MUREKKEP;
  // tabla: üst ve ön kalınlık
  const tu = [[-w, ust, d0], [w, ust, d0], [w, ust, d1], [-w, ust, d1]].map(sehpaP);
  cokgen(tu, CEVIZ_ACIK, lw);
  const to = [[-w, ust, d0], [w, ust, d0], [w, ust - kal, d0], [-w, ust - kal, d0]].map(sehpaP);
  cokgen(to, CEVIZ, lw);
  if (gorunur([-w, ust, 0], [-1, 0, 0]))
    cokgen([[-w, ust, d0], [-w, ust, d1], [-w, ust - kal, d1], [-w, ust - kal, d0]].map(sehpaP), CEVIZ_KOYU, lw);
  ayak(-w, d0);
  ayak(w, d0);
}

/* ---- kasa ---- */
function tvCiz() {
  const merkez = tvP([0, (TV_ALT + TV_UST) / 2, 0]), s = merkez.s, lw = Math.max(2, s * 0.02);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.strokeStyle = MUREKKEP;
  sehpaCiz(s);
  const W = TV_W, A = TV_ALT, U = TV_UST, O = TV_ON, R = TV_ARKA;
  const solGor = gorunur([-W, (A + U) / 2, 0], [-1, 0, 0]), sagGor = gorunur([W, (A + U) / 2, 0], [1, 0, 0]);
  // tüpün arka çıkıntısı (gövdenin arkasında, önce çizilir)
  const kb = [[-0.68, A + 0.14, R], [0.68, A + 0.14, R], [0.68, U - 0.16, R], [-0.68, U - 0.16, R]], kr = [[-0.46, A + 0.3, R + 0.42], [0.46, A + 0.3, R + 0.42], [0.46, U - 0.34, R + 0.42], [-0.46, U - 0.34, R + 0.42]];
  if (solGor)
    cokgen([kb[0], kr[0], kr[3], kb[3]].map(tvP), '#3a2a22', lw * 0.8);
  if (sagGor)
    cokgen([kb[1], kr[1], kr[2], kb[2]].map(tvP), '#3a2a22', lw * 0.8);
  cokgen([kb[3], kb[2], kr[2], kr[3]].map(tvP), '#4a372c', lw * 0.8);
  // yan yüzler
  if (solGor)
    yanYuz(-1, lw);
  if (sagGor)
    yanYuz(1, lw);
  ustYuz(lw);
  anten(s, lw, false);
  onYuz(lw);
  // dış çizgi: gövdenin köşelerinin dış zarfı, kalın
  const kose = [];
  for (const x of [-W, W])
    for (const y of [A, U])
      for (const z of [O, R])
        kose.push(tvP([x, y, z]));
  const zarf = disZarf(kose);
  c.lineWidth = lw * 1.7;
  c.strokeStyle = MUREKKEP;
  c.beginPath();
  zarf.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
  c.closePath();
  c.stroke();
  anten(s, lw, true);
  vazo(s, lw);
}
// Yerel noktalar ekranda: dışbükey zarf (sarma yöntemi, 8 nokta).
function disZarf(n) {
  const p = n.filter(q => q.ok).sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3)
    return p;
  const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x), alt = [], ust = [];
  for (const q of p) {
    while (alt.length >= 2 && cr(alt[alt.length - 2], alt[alt.length - 1], q) <= 0)
      alt.pop();
    alt.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (ust.length >= 2 && cr(ust[ust.length - 2], ust[ust.length - 1], q) <= 0)
      ust.pop();
    ust.push(q);
  }
  return alt.slice(0, -1).concat(ust.slice(0, -1));
}
// Ceviz damarı: dalgalı ince çizgiler. Yüz dönüşümü açıkken metre cinsinden.
function damar(x0, y0, x1, y1, n, tohum) {
  const r = rastgeleUret(tohum);
  c.strokeStyle = 'rgba(55,25,10,.32)';
  c.lineWidth = 0.008;
  for (let i = 0; i < n; i++) {
    const y = y0 + (y1 - y0) * (i + 0.5) / n + (r() - 0.5) * 0.03, a = 0.01 + r() * 0.02, f = 4 + r() * 6;
    c.beginPath();
    for (let x = x0; x <= x1 + 1e-6; x += (x1 - x0) / 16)
      x === x0 ? c.moveTo(x, y + Math.sin(x * f + i) * a) : c.lineTo(x, y + Math.sin(x * f + i) * a);
    c.stroke();
  }
  // bir iki budak
  c.strokeStyle = 'rgba(55,25,10,.4)';
  for (let i = 0; i < 2; i++) {
    const x = lerp(x0, x1, 0.2 + r() * 0.6), y = lerp(y0, y1, 0.2 + r() * 0.6);
    c.beginPath();
    c.ellipse(x, y, 0.06, 0.018, 0, 0, TAU);
    c.stroke();
  }
}
function yanYuz(yan, lw) {
  const W = TV_W, H = TV_UST - TV_ALT, Dp = TV_ARKA - TV_ON;
  // tuvalin x'i öne→arkaya derinlik, y'si yukarıdan aşağıya
  yuzAc([yan * W, TV_UST, TV_ON], [0, 0, 1], [0, -1, 0]);
  c.beginPath();
  c.roundRect(0, 0, Dp, H, 0.06);
  c.fillStyle = CEVIZ_KOYU;
  c.fill();
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(255,200,150,.14)');
  g.addColorStop(1, 'rgba(0,0,0,.18)');
  c.fillStyle = g;
  c.fill();
  damar(0.03, 0.05, Dp - 0.03, H - 0.05, 7, yan > 0 ? 11 : 7);
  // havalandırma yarıkları
  c.fillStyle = '#2a1509';
  for (let i = 0; i < 6; i++) {
    c.beginPath();
    c.roundRect(Dp - 0.2, 0.18 + i * 0.08, 0.12, 0.025, 0.012);
    c.fill();
  }
  // vuruş izleri: avuç, yumruk çukuru, ayakkabı tabanı; yavaşça silinir
  if (yan < 0)
    for (const iz of D.izler) {
      const a = clamp(1 - (B - iz.b0) / 16, 0, 1) * 0.75, x = iz.z - TV_ON, y = TV_UST - iz.y;
      if (a <= 0)
        continue;
      c.globalAlpha = a;
      izCiz(iz.tip, x, y);
      c.globalAlpha = 1;
    }
  c.beginPath();
  c.roundRect(0, 0, Dp, H, 0.06);
  c.lineWidth = 0.022;
  c.strokeStyle = MUREKKEP;
  c.stroke();
  c.restore();
}
function izCiz(tip, x, y) {
  if (tip === 'tokat') {
    // avuç izi: tozlu cilada açık renkli el
    c.fillStyle = '#d99a6a';
    c.beginPath();
    c.ellipse(x, y + 0.03, 0.07, 0.085, 0, 0, TAU);
    c.fill();
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.ellipse(x - 0.05 + i * 0.033, y - 0.09 - (i === 1 || i === 2 ? 0.02 : 0), 0.015, 0.05, (i - 1.5) * 0.12, 0, TAU);
      c.fill();
    }
    c.beginPath();
    c.ellipse(x + 0.08, y + 0.02, 0.015, 0.04, -0.9, 0, TAU);
    c.fill();
  }
  else if (tip === 'yumruk') {
    // çukur: koyu gölge, altında parlak kenar
    c.fillStyle = 'rgba(30,12,5,.7)';
    c.beginPath();
    c.ellipse(x, y, 0.08, 0.065, 0, 0, TAU);
    c.fill();
    c.strokeStyle = 'rgba(255,210,170,.8)';
    c.lineWidth = 0.012;
    c.beginPath();
    c.ellipse(x, y, 0.08, 0.065, 0, 0.2, Math.PI - 0.2);
    c.stroke();
  }
  else {
    // ayakkabı tabanı: oval, tırtıklı
    c.fillStyle = 'rgba(40,22,12,.75)';
    c.beginPath();
    c.ellipse(x, y, 0.06, 0.13, 0.15, 0, TAU);
    c.fill();
    c.strokeStyle = 'rgba(200,150,110,.6)';
    c.lineWidth = 0.01;
    for (let i = -3; i <= 3; i++) {
      c.beginPath();
      c.moveTo(x - 0.04, y + i * 0.03);
      c.lineTo(x + 0.04, y + i * 0.03 + 0.008);
      c.stroke();
    }
  }
}
function ustYuz(lw) {
  const W = TV_W, Dp = TV_ARKA - TV_ON;
  // tuvalin x'i sağa, y'si öne→arkaya
  yuzAc([0, TV_UST, TV_ON], [1, 0, 0], [0, 0, 1]);
  c.beginPath();
  c.roundRect(-W, 0, 2 * W, Dp, 0.05);
  c.fillStyle = CEVIZ_ACIK;
  c.fill();
  damar(-W + 0.04, 0.04, W - 0.04, Dp - 0.04, 6, 3);
  c.lineWidth = 0.02;
  c.strokeStyle = MUREKKEP;
  c.stroke();
  // dantel örtü: tığ işi, kenarı dilimli, içi delik delik
  const ox = -0.05, oy = 0.42, rx = 0.66, ry = 0.36;
  c.beginPath();
  for (let i = 0; i <= 48; i++) {
    const a = i / 48 * TAU, dil = 1 + 0.07 * Math.abs(Math.sin(a * 12));
    const x = ox + Math.cos(a) * rx * dil, y = oy + Math.sin(a) * ry * dil;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath();
  c.fillStyle = '#f6f0e2';
  c.fill();
  c.lineWidth = 0.012;
  c.strokeStyle = 'rgba(90,70,50,.7)';
  c.stroke();
  c.fillStyle = 'rgba(150,110,80,.35)';
  for (const [hr, n] of [[0.75, 18], [0.5, 12], [0.25, 6]])
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU;
      c.beginPath();
      c.arc(ox + Math.cos(a) * rx * hr, oy + Math.sin(a) * ry * hr, 0.018, 0, TAU);
      c.fill();
    }
  c.restore();
}

/* ---- ön yüz ---- */
function onYuz(lw) {
  const W = TV_W, H = TV_UST - TV_ALT;
  // tuvalin x'i sağa, y'si yukarıdan aşağıya (0 = kasanın üstü)
  yuzAc([0, TV_UST, TV_ON], [1, 0, 0], [0, -1, 0]);
  c.lineJoin = 'round';
  // ceviz çerçeve
  c.beginPath();
  c.roundRect(-W, 0, 2 * W, H, 0.09);
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, CEVIZ_ACIK);
  g.addColorStop(1, CEVIZ);
  c.fillStyle = g;
  c.fill();
  damar(-W + 0.03, 0.02, W - 0.03, 0.08, 1, 5);
  damar(-W + 0.03, H - 0.08, W - 0.03, H - 0.02, 1, 6);
  // koyu ön panel
  c.beginPath();
  c.roundRect(-W + 0.07, 0.08, 2 * W - 0.14, H - 0.14, 0.06);
  c.fillStyle = '#2d1d16';
  c.fill();
  c.lineWidth = 0.014;
  c.strokeStyle = MUREKKEP;
  c.stroke();
  // ekran çerçevesi: krom ince çizgi
  c.beginPath();
  c.roundRect(EKRAN.x0 - 0.05, EKRAN.y0 - 0.05, EKRAN.x1 - EKRAN.x0 + 0.1, EKRAN.y1 - EKRAN.y0 + 0.1, 0.12);
  c.fillStyle = '#17100c';
  c.fill();
  c.lineWidth = 0.016;
  c.strokeStyle = '#d6cdb8';
  c.stroke();
  ekranCam();
  hoparlor();
  kontrolPanel();
  // dantelin öne sarkan ucu
  c.fillStyle = '#f6f0e2';
  c.strokeStyle = 'rgba(90,70,50,.7)';
  c.lineWidth = 0.01;
  c.beginPath();
  c.moveTo(-0.5, -0.004);
  for (let i = 0; i < 8; i++) {
    const x = -0.5 + i * 0.12;
    c.lineTo(x + 0.06, 0.1 + (i % 2) * 0.03);
    c.lineTo(x + 0.12, -0.004);
  }
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = 'rgba(150,110,80,.4)';
  for (let i = 0; i < 8; i++) {
    c.beginPath();
    c.arc(-0.44 + i * 0.12, 0.035, 0.014, 0, TAU);
    c.fill();
  }
  // çerçevenin kalın çizgisi
  c.beginPath();
  c.roundRect(-W, 0, 2 * W, H, 0.09);
  c.lineWidth = 0.024;
  c.strokeStyle = MUREKKEP;
  c.stroke();
  c.restore();
}
// Ekran: hafif bombeli cam, içinde görüntü, köşelerde karartma, camda pencere yansıması.
function ekranYol(pay) {
  const x0 = EKRAN.x0 + pay, x1 = EKRAN.x1 - pay, y0 = EKRAN.y0 + pay, y1 = EKRAN.y1 - pay, r = 0.13, b = 0.025;
  const xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
  c.beginPath();
  c.moveTo(x0 + r, y0);
  c.quadraticCurveTo(xm, y0 - b, x1 - r, y0);
  c.quadraticCurveTo(x1, y0, x1, y0 + r);
  c.quadraticCurveTo(x1 + b, ym, x1, y1 - r);
  c.quadraticCurveTo(x1, y1, x1 - r, y1);
  c.quadraticCurveTo(xm, y1 + b, x0 + r, y1);
  c.quadraticCurveTo(x0, y1, x0, y1 - r);
  c.quadraticCurveTo(x0 - b, ym, x0, y0 + r);
  c.quadraticCurveTo(x0, y0, x0 + r, y0);
  c.closePath();
}
function ekranCam() {
  ekranYol(0);
  c.fillStyle = '#0d1114';
  c.fill();
  c.save();
  ekranYol(0.004);
  c.clip();
  const w = EKRAN.x1 - EKRAN.x0, h = EKRAN.y1 - EKRAN.y0;
  c.imageSmoothingEnabled = true;
  c.drawImage(EK.tuval, EKRAN.x0, EKRAN.y0, w, h);
  // köşeler kararır: tüpün kenarı
  const v = c.createRadialGradient((EKRAN.x0 + EKRAN.x1) / 2, (EKRAN.y0 + EKRAN.y1) / 2, h * 0.28, (EKRAN.x0 + EKRAN.x1) / 2, (EKRAN.y0 + EKRAN.y1) / 2, h * 0.82);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,.6)');
  c.fillStyle = v;
  c.fillRect(EKRAN.x0, EKRAN.y0, w, h);
  // camda odanın penceresinin yansıması ve parlak şerit
  c.fillStyle = 'rgba(255,255,255,.07)';
  c.beginPath();
  c.roundRect(EKRAN.x0 + 0.08, EKRAN.y0 + 0.07, 0.3, 0.22, 0.02);
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,.06)';
  c.lineWidth = 0.02;
  c.beginPath();
  c.moveTo(EKRAN.x0 + 0.23, EKRAN.y0 + 0.07);
  c.lineTo(EKRAN.x0 + 0.23, EKRAN.y0 + 0.29);
  c.moveTo(EKRAN.x0 + 0.08, EKRAN.y0 + 0.18);
  c.lineTo(EKRAN.x0 + 0.38, EKRAN.y0 + 0.18);
  c.stroke();
  const p = c.createLinearGradient(EKRAN.x0, EKRAN.y0, EKRAN.x0 + w * 0.6, EKRAN.y0 + h * 0.7);
  p.addColorStop(0, 'rgba(255,255,255,0)');
  p.addColorStop(0.45, 'rgba(255,255,255,0)');
  p.addColorStop(0.5, 'rgba(255,255,255,.16)');
  p.addColorStop(0.62, 'rgba(255,255,255,0)');
  c.fillStyle = p;
  c.fillRect(EKRAN.x0, EKRAN.y0, w, h);
  c.restore();
  ekranYol(0);
  c.lineWidth = 0.022;
  c.strokeStyle = MUREKKEP;
  c.stroke();
}
// Ekranın altında bej hoparlör kumaşı ve marka yazısı.
function hoparlor() {
  const x0 = EKRAN.x0 - 0.03, x1 = EKRAN.x1 + 0.03, y0 = EKRAN.y1 + 0.09, y1 = TV_UST - TV_ALT - 0.1;
  c.beginPath();
  c.roundRect(x0, y0, x1 - x0, y1 - y0, 0.03);
  c.fillStyle = '#c4ab80';
  c.fill();
  c.save();
  c.clip();
  c.strokeStyle = 'rgba(80,55,30,.35)';
  c.lineWidth = 0.006;
  for (let y = y0 + 0.012; y < y1; y += 0.022) {
    c.beginPath();
    c.moveTo(x0, y);
    c.lineTo(x1, y);
    c.stroke();
  }
  c.strokeStyle = 'rgba(255,240,210,.25)';
  for (let x = x0 + 0.01; x < x1; x += 0.03) {
    c.beginPath();
    c.moveTo(x, y0);
    c.lineTo(x, y1);
    c.stroke();
  }
  c.restore();
  c.lineWidth = 0.012;
  c.strokeStyle = MUREKKEP;
  c.stroke();
  // marka plakası: uydurma ad
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  c.beginPath();
  c.roundRect(mx - 0.17, my - 0.04, 0.34, 0.08, 0.02);
  c.fillStyle = '#2a1a12';
  c.fill();
  yaziYuz('NURTEL', mx, my + 0.003, 0.058, '#e7c46a', 'italic 700');
}
// Yüz dönüşümü içinde yazı: metreyi 100'le büyütüp yazar (tuval küçük punto çizemez).
function yaziYuz(m, x, y, boy, renk, kalin) {
  c.save();
  c.translate(x, y);
  c.scale(0.01, 0.01);
  c.font = (kalin || '700') + ' ' + Math.round(boy * 100) + 'px Rubik, system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = renk;
  c.fillText(m, 0, 0);
  c.restore();
}
// Sağdaki gümüş panel: marka, kanal düğmesi, ses düğmesi, hafıza tuşları, sinyal ışıkları, açma tuşu.
function kontrolPanel() {
  const x0 = EKRAN.x1 + 0.1, x1 = TV_W - 0.1, y0 = 0.11, y1 = TV_UST - TV_ALT - 0.1, xm = (x0 + x1) / 2;
  const g = c.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, '#d9d2c2');
  g.addColorStop(0.5, '#b9b1a0');
  g.addColorStop(1, '#cfc8b7');
  c.beginPath();
  c.roundRect(x0, y0, x1 - x0, y1 - y0, 0.04);
  c.fillStyle = g;
  c.fill();
  c.lineWidth = 0.014;
  c.strokeStyle = MUREKKEP;
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.35)';
  c.lineWidth = 0.004;
  for (let y = y0 + 0.02; y < y1; y += 0.025) {
    c.beginPath();
    c.moveTo(x0 + 0.01, y);
    c.lineTo(x1 - 0.01, y);
    c.stroke();
  }
  yaziYuz('RENKLİ', xm, y0 + 0.07, 0.045, '#5a3a22', '700');
  // kanal ve ses düğmeleri; vuruşta seğirir, tekmede biri fırlar
  for (const ad of ['kanal', 'ses']) {
    const [x, yy] = DUGME[ad], y = TV_UST - yy, r = ad === 'kanal' ? 0.13 : 0.1;
    c.beginPath();
    c.arc(x, y, r + 0.025, 0, TAU);
    c.fillStyle = '#3b3029';
    c.fill();
    if (D.dugme && D.dugme.hangi === ad) {
      // düğmesi fırlamış: delik ve çıplak mil
      c.beginPath();
      c.arc(x, y, r * 0.75, 0, TAU);
      c.fillStyle = '#0c0806';
      c.fill();
      c.beginPath();
      c.arc(x, y, 0.025, 0, TAU);
      c.fillStyle = '#c9c9c9';
      c.fill();
      c.lineWidth = 0.008;
      c.strokeStyle = MUREKKEP;
      c.stroke();
      continue;
    }
    const geri = D.dugmeGeriB !== undefined && B - D.dugmeGeriB < 1 && D.dugmeSonHangi === ad ? 1 + 0.3 * Math.sin(Math.PI * (B - D.dugmeGeriB)) : 1;
    const aci = (ad === 'kanal' ? 0.6 + D.tv.sqL * 0.8 - D.tv.sqR * 0.8 : -0.4 + D.tv.sh * 3) + (D.asama * 0.25);
    dugmeCiz(x, y, r * geri, aci, ad === 'kanal');
  }
  // hafıza tuşları: altı tane, biri basılı
  for (let i = 0; i < 6; i++) {
    const x = xm - 0.12 + (i % 3) * 0.12, y = TV_UST - TV_ALT - 0.49 + Math.floor(i / 3) * 0.09, bas = i === (D.skor[0] % 6);
    c.beginPath();
    c.roundRect(x - 0.045, y - 0.03 + (bas ? 0.008 : 0), 0.09, 0.06, 0.012);
    c.fillStyle = bas ? '#c9b98f' : '#efe4c8';
    c.fill();
    c.lineWidth = 0.01;
    c.strokeStyle = MUREKKEP;
    c.stroke();
  }
  // sinyal ışıkları: görüntünün basamağı kadar yanar
  for (let i = 0; i < 5; i++) {
    const x = xm - 0.13 + i * 0.065, y = TV_UST - TV_ALT - 0.26, yan = i < D.asama + 1;
    c.beginPath();
    c.arc(x, y, 0.022, 0, TAU);
    c.fillStyle = yan ? (i < 2 ? '#ff6b3d' : i < 4 ? '#ffd23f' : '#62e06a') : '#4a3f36';
    c.fill();
    c.lineWidth = 0.007;
    c.strokeStyle = MUREKKEP;
    c.stroke();
  }
  // açma tuşu ve kırmızı lamba
  c.beginPath();
  c.roundRect(xm - 0.1, TV_UST - TV_ALT - 0.18, 0.12, 0.06, 0.015);
  c.fillStyle = '#efe4c8';
  c.fill();
  c.lineWidth = 0.01;
  c.stroke();
  c.beginPath();
  c.arc(xm + 0.08, TV_UST - TV_ALT - 0.15, 0.022, 0, TAU);
  c.fillStyle = '#ff3b2f';
  c.fill();
  c.stroke();
}
// Tırtıklı döner düğme; kanal düğmesinin çevresinde rakam çizgileri.
function dugmeCiz(x, y, r, aci, kanal) {
  c.lineWidth = 0.01;
  c.strokeStyle = MUREKKEP;
  c.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = aci + i / 24 * TAU, rr = i % 2 ? r : r * 0.93;
    i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.fillStyle = '#211813';
  c.fill();
  c.stroke();
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r * 0.8);
  g.addColorStop(0, '#6d5a4c');
  g.addColorStop(1, '#2b211b');
  c.beginPath();
  c.arc(x, y, r * 0.72, 0, TAU);
  c.fillStyle = g;
  c.fill();
  c.stroke();
  c.strokeStyle = '#f3e7cc';
  c.lineWidth = 0.016;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + Math.cos(aci - HP) * r * 0.66, y + Math.sin(aci - HP) * r * 0.66);
  c.stroke();
  if (kanal) {
    c.strokeStyle = 'rgba(40,30,20,.8)';
    c.lineWidth = 0.008;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      c.beginPath();
      c.moveTo(x + Math.cos(a) * (r + 0.03), y + Math.sin(a) * (r + 0.03));
      c.lineTo(x + Math.cos(a) * (r + 0.05), y + Math.sin(a) * (r + 0.05));
      c.stroke();
    }
  }
}

/* ---- anten ve süs ---- */
// Tavşan kulağı anten: kubbe dip, iki teleskop çubuk, uçlarda top. Sağ çubuğun ucu folyoya sarılı; lider
// tutuyorsa ucu onun elindedir. Sol çubuk vuruşla sallanır, ortasında nazar boncuğu sallanır.
// on = false: dip ve arkada kalan çubuk (gövdeden önce); on = true: öndeki çubuk ve süsler.
function antenUclari() {
  const t = D.tv, kok = tvDunya(tvDef(AH.kok));
  const aL = 1.95 + t.ant * 0.35, uz = 0.9;
  const sol = tvDunya(tvDef([AH.kok[0] + Math.cos(aL) * uz, AH.kok[1] + Math.sin(aL) * uz, AH.kok[2] + 0.18]));
  let sag;
  if (kuledeMi(D.lider) && D.antenUc)
    sag = D.antenUc;
  else {
    const aR = 0.62 - t.ant * 0.25;
    sag = tvDunya(tvDef([AH.kok[0] + Math.cos(aR) * uz, AH.kok[1] + Math.sin(aR) * uz, AH.kok[2] + 0.1]));
  }
  return { kok, sol, sag };
}
function cubuk(a, b, r0, r1, s) {
  // üç boğumlu teleskop: kalından inceye
  for (let i = 0; i < 3; i++) {
    const t0 = i / 3, t1 = (i + 1) / 3 + 0.02;
    const p0 = pr(l3(a, b, t0)), p1 = pr(l3(a, b, Math.min(1, t1)));
    if (!p0.ok || !p1.ok)
      continue;
    const r = lerp(r0, r1, i / 2) * p0.s;
    kapYol(p0.x, p0.y, r, p1.x, p1.y, r * 0.9);
    c.fillStyle = '#cfd3d6';
    c.fill();
    c.lineWidth = Math.max(1, s * 0.008);
    c.strokeStyle = MUREKKEP;
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.7)';
    c.lineWidth = Math.max(0.6, r * 0.4);
    c.beginPath();
    c.moveTo(p0.x - r * 0.3, p0.y - r * 0.3);
    c.lineTo(p1.x - r * 0.3, p1.y - r * 0.3);
    c.stroke();
  }
}
function anten(s, lw, onde) {
  const u = antenUclari(), kok = pr(u.kok);
  if (!kok.ok)
    return;
  if (!onde) {
    // sol çubuk arkada (dip ile birlikte)
    cubuk(u.kok, u.sol, 0.022, 0.012, s);
    const ps = pr(u.sol);
    c.beginPath();
    c.arc(ps.x, ps.y, 0.035 * ps.s, 0, TAU);
    c.fillStyle = '#e8e8e8';
    c.fill();
    c.lineWidth = lw * 0.6;
    c.stroke();
    // nazar boncuğu: sol çubuğun ortasından ipe asılı, sarkaç gibi
    const ip = l3(u.kok, u.sol, 0.52), pi = pr(ip), sal = D.tv.ant * 0.9 + Math.sin(TAU * B / 2) * 0.12;
    const bn = pr([ip[0] + Math.sin(sal) * 0.16, ip[1] - Math.cos(sal) * 0.16, ip[2]]);
    if (pi.ok && bn.ok) {
      c.strokeStyle = '#7a1f2a';
      c.lineWidth = Math.max(1, s * 0.006);
      c.beginPath();
      c.moveTo(pi.x, pi.y);
      c.lineTo(bn.x, bn.y);
      c.stroke();
      const r = 0.055 * bn.s;
      for (const [rr, renk] of [[1, '#1f4fbf'], [0.7, '#f6f2e8'], [0.45, '#5fb8e8'], [0.22, '#111']]) {
        c.beginPath();
        c.arc(bn.x, bn.y + r, r * rr, 0, TAU);
        c.fillStyle = renk;
        c.fill();
        if (rr === 1) {
          c.lineWidth = Math.max(1, s * 0.007);
          c.strokeStyle = MUREKKEP;
          c.stroke();
        }
      }
    }
    return;
  }
  // dip kubbesi
  const r = 0.14 * kok.s;
  c.beginPath();
  c.ellipse(kok.x, kok.y, r, r * 0.55, 0, Math.PI, 0);
  c.lineTo(kok.x + r, kok.y + r * 0.18);
  c.lineTo(kok.x - r, kok.y + r * 0.18);
  c.closePath();
  c.fillStyle = '#2b2522';
  c.fill();
  c.lineWidth = lw * 0.7;
  c.strokeStyle = MUREKKEP;
  c.stroke();
  c.beginPath();
  c.arc(kok.x - r * 0.25, kok.y - r * 0.25, r * 0.16, 0, TAU);
  c.fillStyle = '#c9c4bd';
  c.fill();
  // sağ çubuk önde: ucu folyoya sarılı
  cubuk(u.kok, u.sag, 0.022, 0.012, s);
  const ps = pr(u.sag);
  if (ps.ok) {
    const fr = 0.07 * ps.s, rr = rastgeleUret(7);
    c.beginPath();
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * TAU, q = fr * (0.75 + rr() * 0.45);
      i ? c.lineTo(ps.x + Math.cos(a) * q, ps.y + Math.sin(a) * q) : c.moveTo(ps.x + Math.cos(a) * q, ps.y + Math.sin(a) * q);
    }
    c.closePath();
    c.fillStyle = '#d5d9dc';
    c.fill();
    c.lineWidth = lw * 0.6;
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.9)';
    c.lineWidth = Math.max(1, fr * 0.18);
    c.beginPath();
    c.moveTo(ps.x - fr * 0.4, ps.y - fr * 0.2);
    c.lineTo(ps.x - fr * 0.05, ps.y - fr * 0.45);
    c.moveTo(ps.x + fr * 0.1, ps.y + fr * 0.2);
    c.lineTo(ps.x + fr * 0.4, ps.y);
    c.stroke();
  }
}
// Dantelin üstünde porselen vazo, içinde plastik güller. Televizyon yaylandıkça sallanır.
function vazo(s, lw) {
  const p = tvP([-0.16, TV_UST, 0.05]);
  if (!p.ok)
    return;
  const r = p.s, egik = D.tv.sh * 2.5 + D.tv.ant * 0.08;
  c.save();
  c.translate(p.x, p.y);
  c.rotate(egik);
  c.lineWidth = Math.max(1.2, r * 0.012);
  c.strokeStyle = MUREKKEP;
  // güller
  const gul = [[-0.08, -0.42, '#d8322b'], [0.07, -0.47, '#e9573f'], [0, -0.36, '#c4202a']];
  c.strokeStyle = '#3f7d3a';
  c.lineWidth = Math.max(1, r * 0.01);
  for (const [x, y] of gul) {
    c.beginPath();
    c.moveTo(0, -0.2 * r);
    c.quadraticCurveTo(x * 0.3 * r, (y + 0.1) * r, x * r, y * r);
    c.stroke();
  }
  for (const [x, y, sx] of [[-0.09, -0.3, -1], [0.08, -0.33, 1]]) {
    c.beginPath();
    c.ellipse(x * r, y * r, 0.05 * r, 0.022 * r, sx * 0.6, 0, TAU);
    c.fillStyle = '#4f9a45';
    c.fill();
    c.strokeStyle = MUREKKEP;
    c.lineWidth = Math.max(1, r * 0.008);
    c.stroke();
  }
  for (const [x, y, renk] of gul) {
    c.beginPath();
    c.arc(x * r, y * r, 0.055 * r, 0, TAU);
    c.fillStyle = renk;
    c.fill();
    c.stroke();
    c.strokeStyle = 'rgba(90,0,10,.6)';
    c.beginPath();
    c.arc(x * r, y * r, 0.028 * r, 0.5, 4.5);
    c.stroke();
    c.strokeStyle = MUREKKEP;
  }
  // vazo gövdesi
  c.beginPath();
  c.moveTo(-0.05 * r, -0.22 * r);
  c.quadraticCurveTo(-0.15 * r, -0.12 * r, -0.1 * r, 0);
  c.lineTo(0.1 * r, 0);
  c.quadraticCurveTo(0.15 * r, -0.12 * r, 0.05 * r, -0.22 * r);
  c.closePath();
  c.fillStyle = '#f2ead8';
  c.fill();
  c.lineWidth = Math.max(1.2, r * 0.012);
  c.stroke();
  c.strokeStyle = '#2f62b8';
  c.lineWidth = Math.max(1, r * 0.01);
  c.beginPath();
  c.moveTo(-0.11 * r, -0.08 * r);
  c.quadraticCurveTo(0, -0.05 * r, 0.11 * r, -0.08 * r);
  c.stroke();
  c.restore();
}

/* ---- testler ve kare çekimi için: ekranın tuvaldeki yeri (720×1280 ölçeğinde) ---- */
function tvEkranKutusu() {
  const a = tvP([-TV_W - 0.1, TV_UST + 0.9, TV_ON]), b = tvP([TV_W + 0.1, 0, TV_ON]);
  return a.ok && b.ok ? { x0: Math.round(a.x), y0: Math.round(a.y), x1: Math.round(b.x), y1: Math.round(b.y) } : null;
}
