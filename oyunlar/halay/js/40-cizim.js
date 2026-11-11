/* HALAY ÇİZİMİ — oyuncular, davul, zurna, mendil; el değiştiren mendilin uçuşu; çalgıcıların ad etiketi.
 * hacimEkle (başın ışığı ve gölgesi) · davulCiz · mendilCiz · Kancalar: oyunCiz(), oyunUst(dt), oyunEkAdlar().
 */
function oyunCiz() {
  for (const k of D.oy.values())
    if (insanEkle(k)) {
      hacimEkle(k);
      ekCiz(k);
    }
  for (const k of CALGICILAR)
    if (insanEkle(k)) {
      hacimEkle(k);
      ekCiz(k);
    }
}
// Düz renkli başa ve gövdeye hacim: başın gövdeye düşen gölgesi (baştan hemen önce çizilir) ve başın üstüne
// basılan ışık damgası (kenar ışığı, parıltı, çene gölgesi). Derinliği başınkiyle aynıdır; liste eşit derinlikleri
// eklenme sırasıyla çizdiği için baştan hemen sonra gelir.
function hacimEkle(k) {
  const ph = k.p.kafa, gg = k.p.gogus, R = KAFA_R * k.g.boy * (k.basOlcek === undefined ? 1 : k.basOlcek) * ph.s;
  if (gg.ok)
    ozel(ph.d - 0.049, () => {
      const en = 0.21 * k.g.boy * gg.s;
      c.drawImage(damga.boyun, gg.x - en, gg.y - en * 0.5, en * 2, en * 1.5);
    });
  ozel(ph.d - 0.05, () => {
    const q = R / 0.9375;
    c.drawImage(damga.kafa, ph.x - q, ph.y - q, q * 2, q * 2);
  });
}
// İnsanın üstüne gelenler: çalgılar ve halay başının mendili. insanEkle k.p'yi doldurduktan sonra çağrılır.
function ekCiz(k) {
  const p = k.p;
  if (k.mod === 'davulcu') {
    const d0 = p.davul;
    ozel(d0.d - 0.2, () => davulCiz(k));
    kap(p.haR, 0.02, p.tokmak, 0.02, '#8a5a2c', p.haR.d - 0.25);
    top(p.tokmak, 0.045, '#f6ecd9', p.tokmak.d - 0.26, 1.5);
    kap(p.haL, 0.012, p.cubuk, 0.008, '#caa46a', p.haL.d - 0.25);
  }
  else if (k.mod === 'zurnaci') {
    // Zurna başın önünde durur; baştan sonra çizilsin diye derinliği öne çekilir.
    kap(p.agiz, 0.02, p.zurnaUc, 0.06, '#7a4a22', p.kafa.d - 0.4);
    top(p.zurnaUc, 0.064, '#caa46a', p.kafa.d - 0.42, 1.5);
  }
  if (k.mendilEl && k.yer > 0.9) {
    const el = p['ha' + k.mendilEl];
    // Mendil elin dış yanına, yukarı doğru sallanır (ekranda el başın solundaysa sola, sağındaysa sağa).
    if (el.ok)
      ozel(el.d - 0.1, () => mendilCiz(el.x, el.y, el.s * 0.8, (el.x < p.kafa.x ? -2.3 : -0.84) + 0.45 * Math.sin(TAU * B), 1));
  }
}
// uçan mendil: eski halay başının elinden yenisinin başına
function oyunUst() {
  soloUstCiz();
  ziplaIsiltiCiz();
  zerreCiz(1);
  const mu = D.mendilUcus;
  if (!mu)
    return;
  const t = (zaman - mu.t0) / mu.sure, h = mu.kime.j.kafa || [0, 1.5, 0];
  const yer = u => pr([lerp(mu.x, h[0], u), lerp(mu.y, h[1] + 0.3, u) + Math.sin(u * Math.PI) * 1.8, lerp(mu.z, h[2], u)]);
  // mendilin ardında kalan ışıltı izi
  c.globalCompositeOperation = 'lighter';
  for (let i = 1; i <= 9; i++) {
    const u = t - i * 0.035, q = u > 0 ? yer(u) : null;
    if (q && q.ok) {
      haleBas('#ffd166', q.x, q.y, q.s * 0.5 * (1 - i / 10), 0.5 * (1 - i / 10));
      isiltiCiz(q.x + Math.sin(i * 2.3) * q.s * 0.12, q.y + Math.cos(i * 1.7) * q.s * 0.12, q.s * 0.09 * (1 - i / 11), '#fff3c8', 0.9 - i * 0.08);
    }
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  const p = yer(t);
  if (p.ok)
    mendilCiz(p.x, p.y, p.s * 1.2, t * 14, 1);
}
function oyunEkAdlar() { return CALGICILAR; }

function davulCiz(k) {
  const p = k.p, a = p.davulL, b = p.davulR;
  if (!a.ok || !b.ok)
    return;
  const yakinA = a.d < b.d, uz = yakinA ? b : a, yk = yakinA ? a : b, cap = 0.21 * k.g.boy, r1 = cap * uz.s, r2 = cap * yk.s;
  const ac = Math.atan2(yk.y - uz.y, yk.x - uz.x), ek = Math.abs(k.l[0] * kam.f[0] + k.l[2] * kam.f[2]), dar = 0.18 + 0.82 * ek;
  const nx = -Math.sin(ac), ny = Math.cos(ac);
  c.lineWidth = Math.max(1, yk.s * 0.012);
  c.strokeStyle = MUREKKEP;
  c.beginPath();
  c.ellipse(uz.x, uz.y, r1 * dar, r1, ac, 0, TAU);
  c.fillStyle = '#e9dcc0';
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(uz.x + nx * r1, uz.y + ny * r1);
  c.lineTo(yk.x + nx * r2, yk.y + ny * r2);
  c.lineTo(yk.x - nx * r2, yk.y - ny * r2);
  c.lineTo(uz.x - nx * r1, uz.y - ny * r1);
  c.closePath();
  // gövde: silindirin üstü ışık alır, altı gölgede kalır
  const gv = c.createLinearGradient(yk.x - nx * r2, yk.y - ny * r2, yk.x + nx * r2, yk.y + ny * r2), ustte = ny > 0 ? 1 : 0;
  gv.addColorStop(ustte, '#7a2a20');
  gv.addColorStop(0.5, '#b5482f');
  gv.addColorStop(1 - ustte, '#de7a4c');
  c.fillStyle = gv;
  c.fill();
  c.stroke();
  c.strokeStyle = '#ffd166';
  c.lineWidth = Math.max(1, yk.s * 0.014);
  for (let i = -2; i <= 2; i++) {
    const t = i / 2.6;
    c.beginPath();
    c.moveTo(uz.x + nx * r1 * t, uz.y + ny * r1 * t);
    c.lineTo(yk.x + nx * r2 * (t + 0.19), yk.y + ny * r2 * (t + 0.19));
    c.stroke();
  }
  c.strokeStyle = MUREKKEP;
  c.lineWidth = Math.max(1, yk.s * 0.012);
  const vur = 1 + (yakinA ? calgi.tekP : calgi.dumP) * 0.05;
  c.beginPath();
  c.ellipse(yk.x, yk.y, r2 * dar * vur, r2 * vur, ac, 0, TAU);
  // deri: ortası tokmaktan aşınmış, kenarı ahşap kasnakla çevrili
  const deri = c.createRadialGradient(yk.x - r2 * 0.2, yk.y - r2 * 0.25, r2 * 0.1, yk.x, yk.y, r2 * 1.05);
  deri.addColorStop(0, '#fff8e8');
  deri.addColorStop(0.7, '#efe0c0');
  deri.addColorStop(1, '#c9ae84');
  c.fillStyle = deri;
  c.fill();
  c.lineWidth = Math.max(2, yk.s * 0.03);
  c.strokeStyle = '#8a5a2c';
  c.stroke();
  c.lineWidth = Math.max(1, yk.s * 0.012);
  c.strokeStyle = MUREKKEP;
  c.beginPath();
  c.ellipse(yk.x, yk.y, r2 * dar * vur * 1.06, r2 * vur * 1.06, ac, 0, TAU);
  c.stroke();
  c.beginPath();
  c.ellipse(yk.x, yk.y, r2 * dar * 0.5, r2 * 0.5, ac, 0, TAU);
  c.fillStyle = 'rgba(150,110,70,.2)';
  c.fill();
}
// İşlemeli mendil: ışıklı kumaş, gölgede kalan kıvrım, sırma kenar, köşede püskül.
function mendilCiz(x, y, s, aci, parlak) {
  const b = 0.3 * s, dal = Math.sin(zaman * 14) * 0.25;
  c.save();
  c.translate(x, y);
  c.rotate(aci);
  if (parlak) {
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.7;
    c.drawImage(damga.hale['#ffd166'], b * 0.5 - b * 1.5, -b * 1.5, b * 3, b * 3);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }
  const yol = () => {
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(b * 0.5, -b * (0.5 + dal), b, -b * 0.28);
    c.lineTo(b * 0.78, b * 0.12);
    c.lineTo(b * 1.02, b * 0.42);
    c.quadraticCurveTo(b * 0.45, b * (0.3 - dal), 0, 0);
    c.closePath();
  };
  yol();
  c.fillStyle = '#e23d2f';
  c.fill();
  // kıvrımın alt yarısı gölgede, üstünde ince bir ışık çizgisi
  c.save();
  c.clip();
  c.fillStyle = 'rgba(110,16,30,.5)';
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(b * 0.5, -b * dal * 0.5, b * 0.8, b * 0.1);
  c.lineTo(b * 1.1, b * 0.6);
  c.lineTo(0, b * 0.5);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(255,190,160,.7)';
  c.lineWidth = Math.max(1, s * 0.012);
  c.beginPath();
  c.moveTo(b * 0.12, -b * 0.08);
  c.quadraticCurveTo(b * 0.5, -b * (0.36 + dal), b * 0.86, -b * 0.2);
  c.stroke();
  c.restore();
  yol();
  c.lineWidth = Math.max(1.5, s * 0.018);
  c.strokeStyle = '#ffd166';
  c.stroke();
  // püskül
  c.fillStyle = '#ffd166';
  c.beginPath();
  c.arc(b * 1.04, b * 0.45, Math.max(1.2, b * 0.07), 0, TAU);
  c.arc(b * 1.02, -b * 0.3, Math.max(1.2, b * 0.07), 0, TAU);
  c.fill();
  c.restore();
}
