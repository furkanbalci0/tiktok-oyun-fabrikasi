/* HALAY ÇİZİMİ — oyuncular, davul, zurna, mendil; el değiştiren mendilin uçuşu; çalgıcıların ad etiketi.
 * davulCiz · mendilCiz · Kancalar: oyunCiz(), oyunUst(dt), oyunEkAdlar().
 */
function oyunCiz() {
  for (const k of D.oy.values())
    if (insanEkle(k))
      ekCiz(k);
  for (const k of CALGICILAR)
    if (insanEkle(k))
      ekCiz(k);
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
  const mu = D.mendilUcus;
  if (!mu)
    return;
  const t = (zaman - mu.t0) / mu.sure, h = mu.kime.j.kafa || [0, 1.5, 0], p = pr([lerp(mu.x, h[0], t), lerp(mu.y, h[1] + 0.3, t) + Math.sin(t * Math.PI) * 1.8, lerp(mu.z, h[2], t)]);
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
  c.fillStyle = '#b5482f';
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
  c.fillStyle = '#f6ecd9';
  c.fill();
  c.stroke();
  c.beginPath();
  c.ellipse(yk.x, yk.y, r2 * dar * 0.55, r2 * 0.55, ac, 0, TAU);
  c.strokeStyle = 'rgba(8,10,28,.25)';
  c.stroke();
  c.strokeStyle = MUREKKEP;
}
function mendilCiz(x, y, s, aci, parlak) {
  const b = 0.3 * s, dal = Math.sin(zaman * 14) * 0.25;
  c.save();
  c.translate(x, y);
  c.rotate(aci);
  if (parlak) {
    c.globalAlpha = 0.25;
    c.beginPath();
    c.arc(b * 0.5, 0, b * 0.9, 0, TAU);
    c.fillStyle = '#ffd166';
    c.fill();
    c.globalAlpha = 1;
  }
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(b * 0.5, -b * (0.5 + dal), b, -b * 0.28);
  c.lineTo(b * 0.78, b * 0.12);
  c.lineTo(b * 1.02, b * 0.42);
  c.quadraticCurveTo(b * 0.45, b * (0.3 - dal), 0, 0);
  c.closePath();
  c.fillStyle = '#e23d2f';
  c.fill();
  c.lineWidth = Math.max(1.5, s * 0.016);
  c.strokeStyle = '#ffd166';
  c.stroke();
  c.restore();
}
