/* ZEMİN — taş döşeli köy meydanı: taş dokusu (bir kez çizilir, perspektifle şerit şerit yere serilir), gece ile
 * fener ışığı arasındaki geçiş, meydanı çevreleyen kilim kuşağı.
 * tasDokuHazirla · tasDokuCiz · meydanIsikCiz · kilimKusakCiz · zeminCiz (hepsini sırayla çağırır)
 */
// Doku dünyada sabittir: merkezi halkanın merkezi (0, 0), kenarı DOKU_M metre. Kalabalıkla büyümez, kamera ona
// yaklaşıp uzaklaşır; böylece taşlar gerçek bir yer gibi durur.
const DOKU_PX = 1536, DOKU_M = 16, DOKU_PPM = DOKU_PX / DOKU_M;
const TAS_TON = [[222, 186, 136], [203, 164, 114], [190, 150, 104], [214, 178, 148], [196, 172, 140]];
let tasDoku = null;
function tasDokuHazirla() {
  const t = document.createElement('canvas');
  t.width = t.height = DOKU_PX;
  const a = t.getContext('2d'), r = rastgeleUret(1907), o = DOKU_PX / 2, P = DOKU_PPM;
  // derz: taşların arasında kalan koyu toprak
  a.fillStyle = '#8c6a48';
  a.fillRect(0, 0, DOKU_PX, DOKU_PX);
  // halka halka dizilmiş, boyu ve tonu değişen taşlar
  for (let r0 = 1.06; r0 < DOKU_M / 2;) {
    const kalin = 0.36 + r() * 0.14, r1 = r0 + kalin, orta = (r0 + r1) / 2;
    const adet = Math.round(TAU * orta / (0.46 + r() * 0.2)), kay = r() * TAU, bosluk = 0.022 / orta;
    for (let i = 0; i < adet; i++) {
      const a0 = kay + (i + (r() - 0.5) * 0.22) / adet * TAU, a1 = kay + (i + 1 + (r() - 0.5) * 0.22) / adet * TAU;
      const ton = TAS_TON[Math.floor(r() * TAS_TON.length)], p = 0.9 + r() * 0.2;
      a.fillStyle = 'rgb(' + Math.round(ton[0] * p) + ',' + Math.round(ton[1] * p) + ',' + Math.round(ton[2] * p) + ')';
      a.beginPath();
      a.arc(o, o, r1 * P - 2.2, a0 + bosluk, a1 - bosluk);
      a.arc(o, o, r0 * P + 2.2, a1 - bosluk, a0 + bosluk, true);
      a.closePath();
      a.fill();
      // taşın bir kenarı aşınmış ve açık, karşı kenarı gölgeli: yüzeyin düz olmadığı okunur
      a.lineWidth = 1.6;
      a.strokeStyle = 'rgba(255,240,205,.3)';
      a.beginPath();
      a.arc(o, o, r1 * P - 3.4, a0 + bosluk * 2, a1 - bosluk * 2);
      a.stroke();
      a.strokeStyle = 'rgba(70,44,26,.26)';
      a.beginPath();
      a.arc(o, o, r0 * P + 3.4, a0 + bosluk * 2, a1 - bosluk * 2);
      a.stroke();
    }
    r0 = r1;
  }
  // ortadaki göbek: sekiz köşeli yıldız, çevresinde dişli kilim suyu
  a.fillStyle = '#c79a66';
  a.beginPath();
  a.arc(o, o, 1.04 * P, 0, TAU);
  a.fill();
  const dis = 28;
  for (let i = 0; i < dis; i++) {
    const a0 = i / dis * TAU, a1 = (i + 1) / dis * TAU, am = (a0 + a1) / 2;
    a.fillStyle = i % 2 ? '#a8402c' : '#efdcb6';
    a.beginPath();
    a.moveTo(o + Math.cos(a0) * 0.99 * P, o + Math.sin(a0) * 0.99 * P);
    a.lineTo(o + Math.cos(a1) * 0.99 * P, o + Math.sin(a1) * 0.99 * P);
    a.lineTo(o + Math.cos(am) * 0.8 * P, o + Math.sin(am) * 0.8 * P);
    a.closePath();
    a.fill();
  }
  const yildiz = (yar, ic, renk) => {
    a.fillStyle = renk;
    a.beginPath();
    for (let i = 0; i < 16; i++) {
      const q = i / 16 * TAU, m = (i % 2 ? ic : yar) * P;
      a.lineTo(o + Math.cos(q) * m, o + Math.sin(q) * m);
    }
    a.closePath();
    a.fill();
  };
  yildiz(0.74, 0.5, '#a8402c');
  yildiz(0.56, 0.36, '#efdcb6');
  yildiz(0.36, 0.22, '#1f8f84');
  a.fillStyle = '#d9a23a';
  a.beginPath();
  a.arc(o, o, 0.11 * P, 0, TAU);
  a.fill();
  // çakıl, toz ve saman çöpleri: yüzey temiz bir desen gibi durmasın
  for (let i = 0; i < 5200; i++) {
    const x = r() * DOKU_PX, y = r() * DOKU_PX;
    a.fillStyle = r() < 0.5 ? 'rgba(64,40,24,.16)' : 'rgba(255,238,200,.16)';
    a.beginPath();
    a.arc(x, y, 0.8 + r() * 2.2, 0, TAU);
    a.fill();
  }
  a.strokeStyle = 'rgba(240,214,140,.4)';
  a.lineWidth = 1.5;
  a.beginPath();
  for (let i = 0; i < 240; i++) {
    const x = r() * DOKU_PX, y = r() * DOKU_PX, q = r() * TAU, u = 5 + r() * 9;
    a.moveTo(x, y);
    a.lineTo(x + Math.cos(q) * u, y + Math.sin(q) * u);
  }
  a.stroke();
  // kenar: doku sert bir çizgiyle bitmez, geceye erir
  a.globalCompositeOperation = 'destination-in';
  const kenar = a.createRadialGradient(o, o, o * 0.8, o, o, o);
  kenar.addColorStop(0, 'rgba(0,0,0,1)');
  kenar.addColorStop(1, 'rgba(0,0,0,0)');
  a.fillStyle = kenar;
  a.fillRect(0, 0, DOKU_PX, DOKU_PX);
  tasDoku = t;
}
// Doku, kameradan uzağa doğru ince şeritlere bölünüp her şerit kendi derinliğinin ölçeğiyle çizilir: uzak taşlar
// küçülür, yakındakiler büyür. Tek parça çizim perspektifi veremezdi (2B tuvalde yalnız eğme ve ölçek var).
const SERIT_M = 0.2;
function tasDokuCiz() {
  const yari = DOKU_M / 2, mz = kam.tz, pay = D.meydanR + 3;
  const zUst = Math.min(yari, mz + pay), zAlt = Math.max(-yari, mz - pay);
  let u0 = pr([0, 0, zUst]);
  for (let z0 = zUst; z0 > zAlt + 1e-6; z0 -= SERIT_M) {
    const z1 = Math.max(zAlt, z0 - SERIT_M), zm = (z0 + z1) / 2, u1 = pr([0, 0, z1]), ust = u0;
    u0 = u1;
    if (!ust.ok || !u1.ok || u1.y < UFUK - 2 || ust.y > GH)
      continue;
    const sol = pr([-yari, 0, zm]), sag = pr([yari, 0, zm]), om = pr([0, 0, zm]);
    if (!sol.ok || !sag.ok)
      continue;
    const sy = (yari - z0) * DOKU_PPM, sh = (z0 - z1) * DOKU_PPM;
    const ux = (sag.x - sol.x) / DOKU_PX, uy = (sag.y - sol.y) / DOKU_PX, vx = (u1.x - ust.x) / sh, vy = (u1.y - ust.y) / sh;
    c.save();
    c.transform(ux, uy, vx, vy, om.x - ux * DOKU_PX / 2 - vx * sh / 2, om.y - uy * DOKU_PX / 2 - vy * sh / 2);
    // şeritler arasında ince boşluk kalmasın diye bir buçuk satır fazla çizilir
    c.drawImage(tasDoku, 0, sy, DOKU_PX, Math.min(sh + 1.5, DOKU_PX - sy), 0, 0, DOKU_PX, Math.min(sh + 1.5, DOKU_PX - sy));
    c.restore();
  }
}
// Meydanın yerdeki elipsi: merkezi, yatay yarıçapı (px) ve dikey basıklığı. Işık, gece ve halkalar bunu kullanır.
function meydanElips(yaricap) {
  const mz = kam.tz, o = pr([0, 0, mz]), sag = pr([yaricap, 0, mz]), on = pr([0, 0, mz - yaricap]), ar = pr([0, 0, mz + yaricap]);
  if (!o.ok || !sag.ok || !on.ok || !ar.ok)
    return null;
  const rx = sag.x - o.x;
  return { x: o.x, y: (on.y + ar.y) / 2, rx, ky: (on.y - ar.y) / 2 / rx };
}
// Gece: fenerlerin yetişmediği yer lacivert karanlığa gömülür; taşlar orada da belli belirsiz seçilir.
// Işık: ortada sıcak bir havuz, vuruşla hafifçe soluk alır.
function meydanIsikCiz() {
  const e = meydanElips(D.meydanR + 0.8);
  if (!e)
    return;
  const nabiz = 0.5 + 0.5 * Math.cos(TAU * B), gosteri = isik.solo * 0.5;
  c.save();
  c.translate(e.x, e.y);
  c.scale(1, e.ky);
  const ust = (UFUK - e.y) / e.ky, alt = (GH - e.y) / e.ky;
  const gece = c.createRadialGradient(0, 0, e.rx * 0.2, 0, 0, e.rx * 1.08);
  gece.addColorStop(0, 'rgba(22,18,58,' + (0.04 + gosteri * 0.5) + ')');
  gece.addColorStop(0.5, 'rgba(22,18,58,' + (0.2 + gosteri * 0.5) + ')');
  gece.addColorStop(0.8, 'rgba(14,16,48,.74)');
  gece.addColorStop(1, 'rgba(9,11,36,.95)');
  c.fillStyle = gece;
  c.fillRect(-GW, ust, GW * 2, alt - ust);
  c.globalCompositeOperation = 'lighter';
  const havuz = c.createRadialGradient(0, 0, 0, 0, 0, e.rx * 0.8);
  havuz.addColorStop(0, 'rgba(255,190,104,' + (0.2 + 0.05 * nabiz) * (1 - gosteri) + ')');
  havuz.addColorStop(0.55, 'rgba(255,170,90,' + 0.08 * (1 - gosteri) + ')');
  havuz.addColorStop(1, 'rgba(255,170,90,0)');
  c.fillStyle = havuz;
  c.fillRect(-e.rx, Math.max(ust, -e.rx), e.rx * 2, e.rx * 2);
  c.restore();
}

/* ---- kilim kuşağı: meydanı çevreleyen dokuma yolluk ---- */
const KILIM = ['#e23d2f', '#22b8a7', '#f2b632'];
function halkaYol(yaricap, adet, mz) {
  const n = [];
  for (let i = 0; i < adet; i++) {
    const a = i / adet * TAU, p = pr([Math.sin(a) * yaricap, 0, mz + Math.cos(a) * yaricap]);
    if (!p.ok)
      return null;
    n.push(p);
  }
  return n;
}
function kilimKusakCiz() {
  const mz = kam.tz, rr = D.meydanR - 0.2, en = 0.34, dilim = 72;
  const dis = halkaYol(rr + en, dilim, mz), ic = halkaYol(rr - en, dilim, mz), sacak = halkaYol(rr + en + 0.13, dilim, mz);
  if (!dis || !ic || !sacak)
    return;
  const yol = n => { c.moveTo(n[0].x, n[0].y); for (let i = 1; i < n.length; i++)
    c.lineTo(n[i].x, n[i].y); c.closePath(); };
  // saçaklar: kilimin dış kenarından sarkan iplikler
  c.strokeStyle = 'rgba(241,223,189,.7)';
  c.lineWidth = Math.max(1, dis[0].s * 0.012);
  c.beginPath();
  for (let i = 0; i < dilim; i++)
    for (const t of [0, 0.33, 0.66]) {
      const j = (i + 1) % dilim;
      c.moveTo(lerp(dis[i].x, dis[j].x, t), lerp(dis[i].y, dis[j].y, t));
      c.lineTo(lerp(sacak[i].x, sacak[j].x, t), lerp(sacak[i].y, sacak[j].y, t));
    }
  c.stroke();
  // yerdeki kilimin altına düşen ince gölge
  c.save();
  c.translate(0, 3);
  c.fillStyle = 'rgba(16,8,26,.35)';
  c.beginPath();
  yol(dis);
  yol(ic);
  c.fill('evenodd');
  c.restore();
  c.fillStyle = '#9c2a24';
  c.beginPath();
  yol(dis);
  yol(ic);
  c.fill('evenodd');
  // kenar suları: krem ve koyu iki ince çizgi
  for (const [oran, renk, kal] of [[0.86, '#f1dfbd', 0.03], [0.68, '#3a1a2a', 0.016]]) {
    c.strokeStyle = renk;
    c.lineWidth = Math.max(1, dis[0].s * kal);
    for (const yon of [1, -1]) {
      const h = halkaYol(rr + yon * en * oran, dilim, mz);
      if (!h)
        continue;
      c.beginPath();
      yol(h);
      c.stroke();
    }
  }
  // baklavalar: kilimin ana motifi; hediye hareketinde ve vuruşta hafifçe parlar
  const adet = Math.max(18, Math.round(rr * TAU / 0.6)), da = 0.17 / rr, dr = 0.2;
  const coskulu = D.hareket || muzik.sov, parla = (coskulu ? 0.5 : 0.18) * (0.5 + 0.5 * Math.cos(TAU * B));
  for (let i = 0; i < adet; i++) {
    const a = i / adet * TAU;
    const k = [pr([Math.sin(a - da) * rr, 0, mz + Math.cos(a - da) * rr]), pr([Math.sin(a) * (rr + dr), 0, mz + Math.cos(a) * (rr + dr)]), pr([Math.sin(a + da) * rr, 0, mz + Math.cos(a + da) * rr]), pr([Math.sin(a) * (rr - dr), 0, mz + Math.cos(a) * (rr - dr)])];
    if (k.some(p => !p.ok))
      continue;
    c.beginPath();
    c.moveTo(k[0].x, k[0].y);
    for (let q = 1; q < 4; q++)
      c.lineTo(k[q].x, k[q].y);
    c.closePath();
    c.fillStyle = i % 3 === 0 ? '#f1dfbd' : KILIM[i % 3];
    c.fill();
    c.lineWidth = Math.max(1, k[0].s * 0.012);
    c.strokeStyle = '#3a1a2a';
    c.stroke();
    // baklavanın göbeği
    const o = pr([Math.sin(a) * rr, 0, mz + Math.cos(a) * rr]);
    c.fillStyle = i % 3 === 0 ? '#e23d2f' : '#f1dfbd';
    c.beginPath();
    c.ellipse(o.x, o.y, o.s * 0.05, o.s * 0.03, 0, 0, TAU);
    c.fill();
  }
  if (parla > 0.02) {
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = 'rgba(255,200,120,' + parla * 0.5 + ')';
    c.beginPath();
    yol(dis);
    yol(ic);
    c.fill('evenodd');
    c.globalCompositeOperation = 'source-over';
  }
}

let zeminBoya = null, altBoya = null;
function zeminCiz() {
  fonCiz();
  if (!zeminBoya) {
    zeminBoya = c.createLinearGradient(0, UFUK, 0, GH);
    zeminBoya.addColorStop(0, '#1d2052');
    zeminBoya.addColorStop(0.3, '#131640');
    zeminBoya.addColorStop(1, '#090b26');
  }
  c.fillStyle = zeminBoya;
  c.fillRect(0, UFUK, GW, GH - UFUK);
  c.save();
  c.beginPath();
  c.rect(0, UFUK, GW, GH - UFUK);
  c.clip();
  tasDokuCiz();
  meydanIsikCiz();
  kilimKusakCiz();
  // Alt beşte bir TikTok'un yorum alanıdır: zemin orada geceye gömülür, yorumların arkası sakin kalır.
  if (!altBoya) {
    altBoya = c.createLinearGradient(0, ALAN_ALT - 60, 0, GH);
    altBoya.addColorStop(0, 'rgba(9,11,36,0)');
    altBoya.addColorStop(0.35, 'rgba(9,11,36,.72)');
    altBoya.addColorStop(1, 'rgba(9,11,36,.94)');
  }
  c.fillStyle = altBoya;
  c.fillRect(0, ALAN_ALT - 60, GW, GH - ALAN_ALT + 60);
  c.restore();
  onKatmanCiz();
  fenerIsikCiz();
  ampulCiz();
}
