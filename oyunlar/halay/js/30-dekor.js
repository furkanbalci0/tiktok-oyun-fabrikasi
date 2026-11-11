/* DEKOR — düğün gecesi fonu: dört katmanlı perde (gök, tepeler, köy, meydan duvarı) ve katmanlar arası paralaks.
 * arkaHazirla: katmanlar açılışta bir kez çizilir · fonCiz(): gök + tepeler + köy · onKatmanCiz(): duvar, direkler
 * FON_DIREK: ampul iplerinin asıldığı direklerin katmandaki yeri (34-isik.js kullanır).
 */
// Kamera yüksekten baktığı için gerçek ufuk görüntünün dışında kalır. Gökyüzü ve köy, sahnenin üstünde
// sabit bir fon perdesi gibi durur; UFUK o perdenin bittiği, meydan duvarının oturduğu satırdır.
const UFUK = 468;
// Katmanlar ekrandan geniş çizilir (iki yanda 190 px pay): kamera sağa sola salındıkça farklı hızlarda kayarlar.
// Yayın 1080 genişlikte olduğu için katmanlar 1,5 kat çözünürlükte tutulur, yoksa perde bulanık kalır.
const FON_EN = 1100, FON_BOY = 600, FON_OLCEK = 1.5, FON_PAY = 190;
const FON_KAY = { gok: 120, tepe: 260, koy: 430, on: 640 };
const FON_DIREK = [{ x: 232, y: UFUK - 84 }, { x: 550, y: UFUK - 96 }, { x: 868, y: UFUK - 84 }];
const fon = { gok: null, tepe: null, koy: null, on: null };

function katmanYap(ciz) {
  const t = document.createElement('canvas');
  t.width = FON_EN * FON_OLCEK;
  t.height = FON_BOY * FON_OLCEK;
  const a = t.getContext('2d');
  a.scale(FON_OLCEK, FON_OLCEK);
  a.lineJoin = 'round';
  a.lineCap = 'round';
  ciz(a);
  return t;
}
function arkaHazirla() {
  fon.gok = katmanYap(gokKatman);
  fon.tepe = katmanYap(tepeKatman);
  fon.koy = katmanYap(koyKatman);
  fon.on = katmanYap(onKatman);
  tasDokuHazirla();
  isikHazirla();
}
const katmanX = ad => -FON_PAY - kam.yaw * FON_KAY[ad];
function fonCiz() {
  for (const ad of ['gok', 'tepe', 'koy'])
    c.drawImage(fon[ad], katmanX(ad), 0, FON_EN, FON_BOY);
}
function onKatmanCiz() { c.drawImage(fon.on, katmanX('on'), 0, FON_EN, FON_BOY); }

/* ---- gök: lacivertten ufuktaki gün batımı kızıllığına; yıldızlar, ay, ince bulutlar ---- */
function gokKatman(a) {
  const r = rastgeleUret(41), H = UFUK + 2;
  const gr = a.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#060920');
  gr.addColorStop(0.38, '#111747');
  gr.addColorStop(0.68, '#272a70');
  gr.addColorStop(0.86, '#5a3f86');
  gr.addColorStop(0.95, '#9a5a80');
  gr.addColorStop(1, '#d08a6a');
  a.fillStyle = gr;
  a.fillRect(0, 0, FON_EN, FON_BOY);
  for (let i = 0; i < 190; i++) {
    const x = r() * FON_EN, y = r() * H * 0.86, b = 0.5 + r() * 1.3, al = (0.25 + r() * 0.75) * (1 - y / H * 0.7);
    a.globalAlpha = al;
    a.fillStyle = r() < 0.2 ? '#ffe2a8' : '#f6ecd9';
    a.beginPath();
    a.arc(x, y, b, 0, TAU);
    a.fill();
    if (b > 1.5) {
      // iri yıldızın dört kollu ışıltısı
      a.globalAlpha = al * 0.55;
      a.fillRect(x - b * 3.4, y - 0.4, b * 6.8, 0.8);
      a.fillRect(x - 0.4, y - b * 3.4, 0.8, b * 6.8);
    }
  }
  a.globalAlpha = 1;
  // ay: geniş hale, hacimli yüzey, kraterler
  const mx = 800, my = 96, mr = 36;
  const hale = a.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 5);
  hale.addColorStop(0, 'rgba(255,226,170,.34)');
  hale.addColorStop(0.3, 'rgba(255,214,160,.12)');
  hale.addColorStop(1, 'rgba(255,214,160,0)');
  a.fillStyle = hale;
  a.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10);
  const yuz = a.createRadialGradient(mx - 12, my - 13, 3, mx, my, mr);
  yuz.addColorStop(0, '#fffaf0');
  yuz.addColorStop(0.6, '#f3e6c8');
  yuz.addColorStop(1, '#cdbd9f');
  a.fillStyle = yuz;
  a.beginPath();
  a.arc(mx, my, mr, 0, TAU);
  a.fill();
  for (const [x, y, q] of [[-9, -7, 8], [13, 9, 6], [-2, 15, 4], [14, -13, 3.5], [-17, 9, 3]]) {
    a.fillStyle = 'rgba(150,146,170,.28)';
    a.beginPath();
    a.arc(mx + x, my + y, q, 0, TAU);
    a.fill();
    a.fillStyle = 'rgba(255,250,240,.35)';
    a.beginPath();
    a.arc(mx + x + q * 0.2, my + y + q * 0.25, q * 0.78, 0, TAU);
    a.fill();
  }
  // ince bulut şeritleri: üstleri ay ışığıyla, ufka yakın olanlar kızıllıkla aydınlanır
  for (let i = 0; i < 9; i++) {
    const x = r() * FON_EN, y = 170 + r() * 240, w = 90 + r() * 150, sicak = y > 330;
    for (let q = 0; q < 6; q++) {
      a.fillStyle = sicak ? 'rgba(232,150,130,.075)' : 'rgba(169,176,220,.06)';
      a.beginPath();
      a.ellipse(x + (r() - 0.5) * w, y + (r() - 0.5) * 9, w * (0.3 + r() * 0.4), 5 + r() * 6, 0, 0, TAU);
      a.fill();
    }
  }
}

/* ---- tepeler: uzaktaki sırt puslu ve açık, yakındaki koyu ---- */
function tepeKatman(a) {
  const H = UFUK + 2, r = rastgeleUret(9);
  const sirt = (ust, alt, yuk, f1, f2, kay, agac) => {
    const yy = x => H - yuk * (0.55 + 0.3 * Math.sin(x * f1 + kay) + 0.15 * Math.sin(x * f2 + kay * 2));
    const gr = a.createLinearGradient(0, H - yuk, 0, H);
    gr.addColorStop(0, ust);
    gr.addColorStop(1, alt);
    a.fillStyle = gr;
    a.beginPath();
    a.moveTo(0, FON_BOY);
    for (let x = 0; x <= FON_EN; x += 8)
      a.lineTo(x, yy(x));
    a.lineTo(FON_EN, FON_BOY);
    a.closePath();
    a.fill();
    // sırtın üstünde ufak ağaç kümeleri
    a.fillStyle = ust;
    for (let i = 0; i < agac; i++) {
      const x = r() * FON_EN, q = 3 + r() * 4;
      a.beginPath();
      a.ellipse(x, yy(x) - q * 0.5, q, q * 1.25, 0, 0, TAU);
      a.fill();
    }
  };
  sirt('#4a3f88', '#5b4a8c', 104, 0.0052, 0.013, 0.4, 0);
  sirt('#2c3178', '#3d3a80', 78, 0.0071, 0.019, 1.2, 26);
  sirt('#191f55', '#2a2b68', 46, 0.011, 0.027, 4.1, 34);
}

/* ---- köy: minare, kavaklar, alttan meydan ışığı alan evler, ışıklı pencereler, baca dumanı ---- */
function evCiz(a, r, x, H, w, h) {
  const govde = a.createLinearGradient(0, H - h, 0, H);
  govde.addColorStop(0, '#161b4c');
  govde.addColorStop(1, '#43305c');
  a.fillStyle = govde;
  a.fillRect(x, H - h, w, h + 6);
  // ayın vurmadığı yan
  a.fillStyle = 'rgba(8,10,34,.32)';
  a.fillRect(x, H - h, w * 0.3, h + 6);
  const tepe = 14 + r() * 10, kirma = r() < 0.45, sacak = 5;
  a.fillStyle = '#0c1034';
  a.beginPath();
  a.moveTo(x - sacak, H - h);
  if (kirma) {
    a.lineTo(x + w * 0.24, H - h - tepe);
    a.lineTo(x + w * 0.76, H - h - tepe);
  }
  else
    a.lineTo(x + w / 2, H - h - tepe);
  a.lineTo(x + w + sacak, H - h);
  a.closePath();
  a.fill();
  // kiremit çizgileri ve ayın vurduğu saçak
  a.strokeStyle = 'rgba(120,128,200,.2)';
  a.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    const t = i / 3, ic = (tepe / 12) * sacak * t;
    a.beginPath();
    a.moveTo(x - sacak + (kirma ? w * 0.24 + sacak : w / 2 + sacak) * t, H - h - tepe * t);
    a.lineTo(x + w + sacak - (kirma ? w * 0.24 + sacak : w / 2 + sacak) * t + ic * 0, H - h - tepe * t);
    a.stroke();
  }
  a.strokeStyle = 'rgba(196,202,240,.6)';
  a.lineWidth = 1.5;
  a.beginPath();
  a.moveTo(kirma ? x + w * 0.76 : x + w / 2, H - h - tepe);
  a.lineTo(x + w + sacak, H - h);
  a.stroke();
  if (r() < 0.6) {
    const bx = x + w * (0.2 + r() * 0.5);
    a.fillStyle = '#0c1034';
    a.fillRect(bx, H - h - tepe - 5, 7, tepe * 0.8);
    for (let i = 0; i < 6; i++) {
      a.fillStyle = 'rgba(190,190,230,' + (0.09 - i * 0.012) + ')';
      a.beginPath();
      a.arc(bx + 4 + i * 3.5 + Math.sin(i * 1.3) * 3, H - h - tepe - 10 - i * 8, 4 + i * 1.6, 0, TAU);
      a.fill();
    }
  }
  // pencereler: çoğu yanık; yanan pencere duvara ışık saçar
  const adet = Math.max(1, Math.floor((w - 14) / 19)), ara = (w - 14) / adet;
  for (let i = 0; i < adet; i++) {
    const px = x + 9 + i * ara + (ara - 9) / 2 - 2, py = H - h + 9, yanik = r() < 0.72, renk = r() < 0.82 ? '#ffd98a' : '#7fe0d2';
    if (yanik) {
      const isik = a.createRadialGradient(px + 4.5, py + 6, 2, px + 4.5, py + 6, 20);
      isik.addColorStop(0, renkSaydam(renk, 0.34));
      isik.addColorStop(1, renkSaydam(renk, 0));
      a.fillStyle = isik;
      a.fillRect(px - 16, py - 14, 41, 40);
    }
    a.fillStyle = yanik ? renk : '#0a0d2c';
    a.fillRect(px, py, 9, 12);
    if (yanik) {
      a.fillStyle = 'rgba(255,255,255,.4)';
      a.fillRect(px, py, 9, 3.5);
    }
    a.strokeStyle = '#0c1034';
    a.lineWidth = 1.4;
    a.strokeRect(px, py, 9, 12);
    a.beginPath();
    a.moveTo(px + 4.5, py);
    a.lineTo(px + 4.5, py + 12);
    a.moveTo(px, py + 6);
    a.lineTo(px + 9, py + 6);
    a.stroke();
  }
}
function kavakCiz(a, x, H, h) {
  a.fillStyle = '#0c1136';
  a.fillRect(x - 1.5, H - h * 0.3, 3, h * 0.3 + 4);
  a.beginPath();
  a.ellipse(x, H - h * 0.56, h * 0.13, h * 0.46, 0, 0, TAU);
  a.fill();
  // ay sağda: kavağın sağ yanı hafifçe aydınlanır
  a.fillStyle = 'rgba(92,100,190,.3)';
  a.beginPath();
  a.ellipse(x + h * 0.045, H - h * 0.6, h * 0.06, h * 0.36, 0, 0, TAU);
  a.fill();
}
function koyKatman(a) {
  const r = rastgeleUret(23), H = UFUK + 2;
  // minare: köyün en yüksek yapısı, şerefesinde bir ışık
  const mx = 660;
  a.fillStyle = '#151a4e';
  a.fillRect(mx - 5, H - 134, 10, 140);
  a.fillRect(mx - 9, H - 100, 18, 6);
  a.beginPath();
  a.moveTo(mx - 6, H - 134);
  a.lineTo(mx, H - 164);
  a.lineTo(mx + 6, H - 134);
  a.closePath();
  a.fill();
  a.fillStyle = 'rgba(196,202,240,.5)';
  a.fillRect(mx + 3.5, H - 134, 1.5, 134);
  const mi = a.createRadialGradient(mx, H - 104, 1, mx, H - 104, 16);
  mi.addColorStop(0, 'rgba(255,217,138,.9)');
  mi.addColorStop(0.25, 'rgba(255,217,138,.3)');
  mi.addColorStop(1, 'rgba(255,217,138,0)');
  a.fillStyle = mi;
  a.fillRect(mx - 16, H - 120, 32, 32);
  for (let x = -6; x < FON_EN;) {
    if (r() < 0.27) {
      kavakCiz(a, x + 10, H, 62 + r() * 46);
      x += 24 + r() * 8;
      continue;
    }
    const w = 54 + r() * 40, h = 30 + r() * 28;
    evCiz(a, r, x, H, w, h);
    x += w + 2 + r() * 20;
  }
  // meydanın ışığı evlerin dibinde pus olur
  const pus = a.createLinearGradient(0, H - 70, 0, H + 6);
  pus.addColorStop(0, 'rgba(255,184,120,0)');
  pus.addColorStop(1, 'rgba(255,184,120,.3)');
  a.fillStyle = pus;
  a.fillRect(0, H - 70, FON_EN, 80);
}

/* ---- ön katman: çınarlar, taş duvar, duvara serilmiş kilimler, fenerli ahşap direkler ---- */
const TAS_DUVAR = [[125, 98, 102], [143, 114, 104], [108, 85, 96], [158, 128, 110]];
function cinarCiz(a, r, x, H) {
  a.fillStyle = '#1c1430';
  a.beginPath();
  a.moveTo(x - 11, H);
  a.quadraticCurveTo(x - 5, H - 60, x - 16, H - 104);
  a.lineTo(x + 12, H - 104);
  a.quadraticCurveTo(x + 4, H - 60, x + 12, H);
  a.closePath();
  a.fill();
  const kume = [];
  for (let i = 0; i < 22; i++)
    kume.push([x + (r() - 0.5) * 150, H - 104 - r() * 96, 22 + r() * 22]);
  kume.sort((p, q) => p[1] - q[1]);
  for (const [kx, ky, kr] of kume) {
    // üst kümeler gece koyusu, alttakiler meydanın ışığını alır
    const t = clamp((ky - (H - 200)) / 96, 0, 1);
    a.fillStyle = 'rgb(' + Math.round(lerp(14, 74, t)) + ',' + Math.round(lerp(22, 62, t)) + ',' + Math.round(lerp(58, 58, t)) + ')';
    a.beginPath();
    a.arc(kx, ky, kr, 0, TAU);
    a.fill();
    a.fillStyle = 'rgba(255,190,110,' + (0.05 + t * 0.13) + ')';
    a.beginPath();
    a.arc(kx, ky + kr * 0.3, kr * 0.72, 0, TAU);
    a.fill();
  }
}
function duvarCiz(a, r, H) {
  const ust = H - 30, sira = 3, sy = 11;
  a.fillStyle = '#33263f';
  a.fillRect(0, ust, FON_EN, 36);
  for (let s = 0; s < sira; s++)
    for (let x = -r() * 20; x < FON_EN;) {
      const w = 20 + r() * 22, t = TAS_DUVAR[Math.floor(r() * TAS_DUVAR.length)], p = 0.86 + r() * 0.28;
      a.fillStyle = 'rgb(' + Math.round(t[0] * p) + ',' + Math.round(t[1] * p) + ',' + Math.round(t[2] * p) + ')';
      a.beginPath();
      a.roundRect(x + 1, ust + 3 + s * sy + 1, w - 2, sy - 2, 2.5);
      a.fill();
      // taşın üst kenarına vuran ışık
      a.fillStyle = 'rgba(255,226,180,.22)';
      a.fillRect(x + 3, ust + 3 + s * sy + 1.5, w - 6, 1.4);
      x += w;
    }
  // harpuşta: duvarın üstündeki açık renkli kapak taşları
  for (let x = -r() * 20; x < FON_EN;) {
    const w = 34 + r() * 20;
    a.fillStyle = r() < 0.5 ? '#b3947c' : '#a58670';
    a.beginPath();
    a.roundRect(x + 0.8, ust - 4, w - 1.6, 7.5, 2);
    a.fill();
    a.fillStyle = 'rgba(255,240,210,.35)';
    a.fillRect(x + 3, ust - 3.4, w - 6, 1.3);
    x += w;
  }
  // meydanın ışığı ortada güçlü, kenarlarda duvar geceye karışır
  const kenar = a.createLinearGradient(FON_PAY - 60, 0, FON_EN - FON_PAY + 60, 0);
  kenar.addColorStop(0, 'rgba(12,14,44,.72)');
  kenar.addColorStop(0.3, 'rgba(12,14,44,.12)');
  kenar.addColorStop(0.5, 'rgba(255,190,110,.1)');
  kenar.addColorStop(0.7, 'rgba(12,14,44,.12)');
  kenar.addColorStop(1, 'rgba(12,14,44,.72)');
  a.fillStyle = kenar;
  a.fillRect(0, ust - 5, FON_EN, 42);
}
// Duvardan sarkan kilim: düğün evinin en iyi kilimi meydana asılır.
function asiliKilimCiz(a, x, H, w, renkler) {
  const ust = H - 33, boy = 31, serit = boy / 7;
  for (let i = 0; i < 7; i++) {
    a.fillStyle = renkler[i % renkler.length];
    a.fillRect(x, ust + i * serit, w, serit + 0.5);
  }
  // orta şeritte baklava motifleri
  a.fillStyle = '#f1dfbd';
  for (let bx = x + 7; bx < x + w - 4; bx += 11) {
    a.beginPath();
    a.moveTo(bx, ust + serit * 3.5 - 4);
    a.lineTo(bx + 4, ust + serit * 3.5);
    a.lineTo(bx, ust + serit * 3.5 + 4);
    a.lineTo(bx - 4, ust + serit * 3.5);
    a.closePath();
    a.fill();
  }
  a.strokeStyle = '#f1dfbd';
  a.lineWidth = 1;
  a.beginPath();
  for (let sx = x + 1.5; sx < x + w; sx += 3) {
    a.moveTo(sx, ust + boy);
    a.lineTo(sx, ust + boy + 4);
  }
  a.stroke();
  // kumaşın kıvrım gölgesi
  const kiv = a.createLinearGradient(x, 0, x + w, 0);
  kiv.addColorStop(0, 'rgba(10,8,30,.32)');
  kiv.addColorStop(0.25, 'rgba(10,8,30,0)');
  kiv.addColorStop(0.7, 'rgba(255,230,190,.1)');
  kiv.addColorStop(1, 'rgba(10,8,30,.36)');
  a.fillStyle = kiv;
  a.fillRect(x, ust, w, boy);
}
function direkCiz(a, d, H) {
  const g = a.createLinearGradient(d.x - 5, 0, d.x + 5, 0);
  g.addColorStop(0, '#3d2616');
  g.addColorStop(0.45, '#94602f');
  g.addColorStop(1, '#4b2e19');
  a.fillStyle = g;
  a.fillRect(d.x - 4.5, d.y, 9, H + 8 - d.y);
  a.fillRect(d.x - 20, d.y + 5, 40, 4.5);
  // ahşabın damarı
  a.strokeStyle = 'rgba(30,16,8,.4)';
  a.lineWidth = 0.8;
  a.beginPath();
  for (let y = d.y + 16; y < H; y += 13) {
    a.moveTo(d.x - 2.5, y);
    a.lineTo(d.x - 1.5, y + 8);
    a.moveTo(d.x + 2, y + 5);
    a.lineTo(d.x + 2.6, y + 11);
  }
  a.stroke();
  // fener: kolun ucunda asılı, camı sıcak ışıklı
  for (const s of [-1, 1]) {
    const fx = d.x + s * 17, fy = d.y + 12;
    a.strokeStyle = '#20140c';
    a.lineWidth = 1.2;
    a.beginPath();
    a.moveTo(fx, d.y + 9);
    a.lineTo(fx, fy);
    a.stroke();
    a.fillStyle = '#20140c';
    a.beginPath();
    a.moveTo(fx - 5, fy + 3);
    a.lineTo(fx, fy - 2);
    a.lineTo(fx + 5, fy + 3);
    a.closePath();
    a.fill();
    const cam = a.createLinearGradient(0, fy + 3, 0, fy + 14);
    cam.addColorStop(0, '#fff3c8');
    cam.addColorStop(1, '#ffb347');
    a.fillStyle = cam;
    a.fillRect(fx - 4, fy + 3, 8, 11);
    a.strokeStyle = '#20140c';
    a.lineWidth = 1.1;
    a.strokeRect(fx - 4, fy + 3, 8, 11);
    a.fillRect(fx - 5, fy + 14, 10, 2);
  }
}
function onKatman(a) {
  const r = rastgeleUret(77), H = UFUK + 2;
  cinarCiz(a, r, 196, H);
  cinarCiz(a, r, 918, H);
  duvarCiz(a, r, H);
  asiliKilimCiz(a, 296, H, 58, ['#b5332a', '#f1dfbd', '#1f8f84', '#b5332a', '#d99a2b']);
  asiliKilimCiz(a, 634, H, 66, ['#1f8f84', '#f1dfbd', '#b5332a', '#d99a2b', '#b5332a']);
  asiliKilimCiz(a, 772, H, 50, ['#d99a2b', '#b5332a', '#f1dfbd', '#1f8f84', '#b5332a']);
  for (const d of FON_DIREK)
    direkCiz(a, d, H);
}
