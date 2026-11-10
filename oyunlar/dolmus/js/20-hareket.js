/* DOLMUŞ HAREKETİ — yolun akması, gövdenin yaylanması, yolcuların oturup kalkması, el uzatma, gösteriler.
 * yolcuHareket(k, dt, db): yerine yürü / otur / in, pozu ve elleri kur · soforHareket: direksiyon, para alma
 * Kancalar: oyunGuncelle(dt), oyunKamera().
 * Oturan yolcu: kalça koltuk yüksekliğinde (OTUR_KALCA), ayaklar önde yerde. Gövde kameraya dönük (OTUR_YON),
 * baş ayrıca döner (k.basYon): çizimde insanEkle'den sonra k.f / k.l başın yönüne çevrilir (40-dolmus.js).
 * Gövdenin sol yanı (poz.yat +) dünyada yaklaşık +x, yani yolun ileri yönüdür: fren öne, sollama arkaya yatırır.
 */
const OTUR_KALCA = 0.2;

function oyunGuncelle(dt) {
  const db = clamp(B - D.sonB, 0, 1);
  D.sonB = B;
  if (D.teyp && B > D.teyp.bas + D.teyp.sure)
    D.teyp = null;
  if (D.kasis && B > D.kasis.bas + D.kasis.sure)
    D.kasis = null;
  if (D.sollama && B > D.sollama.bas + D.sollama.sure)
    D.sollama = null;
  durakIlerlet();
  muzik.sov = B < D.sovBit;

  // Hız: gaz (coşku) arttıkça artar, sollamada fırlar, durakta durur. Yol bu hızla dolmuşun altından akar.
  let hedef = 1.3 + 3.2 * D.cosku;
  if (etkin(D.sollama))
    hedef *= 2.6;
  const dr = D.durak;
  if (dr && B >= dr.bas - 0.5 && B < dr.bas + DURAK_V - 1)
    hedef = 0;
  D.hiz += (hedef - D.hiz) * Math.min(1, dt * (hedef === 0 ? 4 : 1.8));
  D.kayma += db * D.hiz;
  // Gövde her vuruşta yaylanır; kasiste önce ön, sonra arka teker hoplatır.
  let bob = azHareket ? 0 : 0.02 * (0.5 + 0.5 * Math.cos(TAU * B)) * Math.min(1, D.hiz / 1.5);
  if (D.kasis && !azHareket) {
    const u = B - D.kasis.bas;
    if (u >= 0 && u < 2)
      bob += (u < 1 ? 0.2 : 0.11) * Math.sin(Math.PI * (u % 1));
  }
  D.bob = bob;
  // Dolmuş kadrajın ortasına kayar (kamera x = 0'a bakar).
  const a = kadrajAraligi();
  D.otoX += ((a[0] + a[1]) / 2 - D.otoX) * Math.min(1, dt * 1.6);

  paraIlerlet();
  for (const k of D.oy.values())
    yolcuHareket(k, dt, db);
  soforHareket(dt);
  for (const n of D.paralar)
    n.p = paraYeri(n);
}

/* ---- müsait bir yerde: dolmuş durur, gönderen ayağa kalkar ---- */
function durakIlerlet() {
  const d = D.durak;
  if (d && (B > d.bas + DURAK_V || d.k.cikiyor || D.oy.get(d.k.id) !== d.k)) {
    d.k.yildiz = d.k.guler = false;
    D.durak = null;
  }
  if (!D.durak && D.durakKuyruk.length) {
    const k = D.durakKuyruk.shift();
    if (!k.cikiyor && D.oy.get(k.id) === k)
      D.durak = { k, bas: Math.ceil(B) + 1, yakin: false, ayakta: false, isaret: null };
  }
  const g = D.durak;
  if (!g)
    return;
  const su = B - g.bas;
  g.yakin = su > 0.5 && su < DURAK_V - 0.8;
  g.ayakta = su > 1 && su < DURAK_V - 1.2;
  g.k.yildiz = g.k.guler = su > -1;
  // Durak tabelası dolmuş durduğu yerde, karşı kaldırımda belirir; dolmuş kalkınca geride kalır.
  if (g.isaret === null && su > 0.6)
    g.isaret = D.kayma + (D.otoX - g.k.du);
}

/* ---- yolcu ---- */
function yolcuHareket(k, dt, db) {
  yolcuHazir(k);
  const d = D.durak, yildiz = !!(d && d.k === k && d.ayakta);
  let hu = k.hu, hw = k.hw;
  if (k.tut) {
    // parası şoföre varana dek eski koltuğunda oturur
    hu = k.tut.u;
    hw = k.tut.w;
  }
  else if (D.paralar.length && koltukTutulu(k, hu, hw)) {
    // yeni koltuğu henüz boşalmadı: olduğu yerde bekler
    hu = k.du;
    hw = k.dw;
  }
  if (k.cikiyor) {
    // "Müsait bir yerde": kaldırıma iner, dolmuş giderken geride kalır.
    hu = k.du;
    hw = -2.4;
    k.du += db * D.hiz;
  }
  const du = hu - k.du, dw = hw - k.dw, uz = Math.hypot(du, dw);
  if (uz > 0.002) {
    const adim = Math.min(uz, (2.4 + uz * 1.6) * dt);
    k.du += du / uz * adim;
    k.dw += dw / uz * adim;
  }
  const yerinde = uz < 0.12 && !k.cikiyor;
  k.yer += ((yerinde ? 1 : 0) - k.yer) * Math.min(1, dt * 6);
  k.otur += ((yerinde && !yildiz ? 1 : 0) - k.otur) * Math.min(1, dt * (yerinde && !yildiz ? 5 : 9));
  if (k.cikiyor)
    k.gitti = k.dw < -2.1 && D.otoX - k.du < -(D.bolge1 - D.bolge0) / 2 - 1.6;
  // Gösterideki yolcu büyür: sahne onun.
  k.olcek += ((yildiz ? 1.3 : 1) - k.olcek) * Math.min(1, dt * 4);
  k.g.boy = k.asilBoy * k.olcek;
  // dünyadaki yer: kapıdan içeri girerken basamağa çıkar
  k.x = D.otoX - k.du;
  k.z = k.dw;
  const ic = clamp((k.dw + 1.6) / 0.5, 0, 1);
  k.y0 = ic * (ZEMIN_Y + D.bob);
  // yön: yürürken gittiği yere, otururken kameraya dönük
  let yon = OTUR_YON + (k.dfaz - 0.5) * 0.2;
  if (uz > 0.2 || k.cikiyor)
    yon = Math.atan2(-du || -0.001, k.cikiyor ? -1 : dw);
  if (yildiz)
    yon = Math.PI;
  k.yon += aciFark(k.yon, yon) * Math.min(1, dt * 8);

  const poz = pozBekle(k), o = k.otur, vurus = 0.5 + 0.5 * Math.cos(TAU * B);
  poz.hipY = lerp(poz.hipY, OTUR_KALCA + 0.01 * vurus, o);
  poz.aS[1] = lerp(poz.aS[1], 0.17, o);
  poz.aL[1] = lerp(poz.aL[1], 0.17, o);
  poz.aS[2] *= 1 - o;
  poz.aL[2] *= 1 - o;
  poz.yat += yatEk(k);
  // kasis: önden arkaya dalga halinde hoplarlar (öndeki önce)
  const hop = kasisHop(k.du);
  poz.hipY += hop;
  if (azHareket)
    poz.yat = 0;
  const W = iskeletKur(k, poz);
  const j = k.j, hy = poz.hipY;
  // eller: oturan dizlerinde, ayaktaki yanlarında
  let hR = o > 0.5 ? W(-0.11, hy + 0.05, 0.16) : W(-0.2, hy + 0.06, 0.05);
  let hL = o > 0.5 ? W(0.11, hy + 0.05, 0.16) : W(0.2, hy + 0.06, 0.05);
  const sal = Math.sin(TAU * B + k.dfaz * TAU);
  if (yildiz) {
    hR = W(-0.3 - 0.05 * sal, hy + 0.62, 0.06);
    hL = W(0.3 + 0.05 * sal, hy + 0.58 + 0.06 * Math.cos(TAU * B), 0.06);
  }
  else if (d && d.ayakta && !k.cikiyor) {
    // gösteride herkes alkışlar
    const ac = Math.abs(Math.sin(Math.PI * 2 * B + k.dfaz * 3));
    hR = W(-0.03 - 0.07 * ac, hy + 0.27, 0.19);
    hL = W(0.03 + 0.07 * ac, hy + 0.27, 0.19);
  }
  else if (hop > 0.03) {
    hR = W(-0.24, hy + 0.5, 0.04);
    hL = W(0.24, hy + 0.5, 0.04);
  }
  else if (B >= k.zip0 && B < k.zip1 && !k.uzat) {
    // hediye sevinci: el sallar
    hL = W(0.26 + 0.05 * sal, hy + 0.5, 0.06);
  }
  if (k.uzat)
    [hR, hL] = elUzat(k, k.uzat, hR, hL);
  j.haR = hR;
  j.haL = hL;
  kolKur(k);
  // baş: kameraya, para geçerken karşısındakine, gösteride yıldıza bakar
  let bas = Math.PI - 0.12 + (k.dfaz - 0.5) * 0.3;
  if (k.uzat && !k.uzat.yukari)
    bas = Math.PI + aciFark(Math.PI, Math.atan2(k.uzat.hedef[0] - k.x, k.uzat.hedef[2] - k.z)) * 0.55;
  else if (d && d.ayakta && !yildiz)
    bas = Math.PI + clamp(d.k.x - k.x, -1, 1) * 0.6;
  if (uz > 0.2 || k.cikiyor)
    bas = k.yon;
  k.basYon = k.basYon === undefined ? bas : k.basYon + aciFark(k.basYon, bas) * Math.min(1, dt * 7);
}
function koltukTutulu(k, u, w) {
  for (const x of D.sira)
    if (x !== k && x.tut && Math.abs(x.tut.u - u) < 0.01 && Math.abs(x.tut.w - w) < 0.01)
      return true;
  return false;
}
// Bir eli dünyadaki hedefe uzatır (kol boyunca); hangi elin uzanacağını hedefin yanı seçer.
function elUzat(k, u, hR, hL) {
  const j = k.j, gg = j.gogus, h = u.hedef;
  if (!u.el)
    u.el = (h[0] - gg[0]) * k.l[0] + (h[2] - gg[2]) * k.l[2] > 0 ? 'L' : 'R';
  const om = u.el === 'L' ? j.omL : j.omR, dx = h[0] - om[0], dy = h[1] - om[1], dz = h[2] - om[2];
  const uz = Math.hypot(dx, dy, dz) || 1, r = Math.min(uz, 0.31 * k.g.boy);
  const el = [om[0] + dx / uz * r, om[1] + dy / uz * r, om[2] + dz / uz * r];
  return u.el === 'L' ? [hR, el] : [el, hL];
}
// Fren öne, sollama arkaya, teyp sağa sola yatırır (poz.yat + : gövdenin solu, yani yolun ilerisi).
function yatEk(k) {
  let y = 0;
  const d = D.durak;
  if (d) {
    const su = B - d.bas;
    if (su > -0.5 && su < 1.5)
      y += 0.07 * Math.sin(Math.PI * clamp((su + 0.5) / 2, 0, 1));
  }
  if (etkin(D.sollama))
    y -= 0.045 * Math.sin(Math.PI * clamp((B - D.sollama.bas) / D.sollama.sure, 0, 1));
  if (etkin(D.teyp))
    y += 0.035 * Math.sin(Math.PI * B + k.dfaz * 2);
  return y;
}
function kasisHop(u) {
  if (!D.kasis || azHareket)
    return 0;
  const t = B - D.kasis.bas - u * 0.08;
  return t > 0 && t < 1 ? 0.16 * Math.sin(Math.PI * t) : 0;
}

/* ---- şoför: direksiyonda, para gelince arkaya uzanır ---- */
function soforHareket(dt) {
  const k = sofor;
  k.x = D.otoX - ON_U;
  k.z = UZAK_Z;
  k.y0 = ZEMIN_Y + D.bob;
  k.yon = Math.PI - 0.95;
  const poz = pozBekle(k);
  poz.hipY = OTUR_KALCA + 0.01 * (0.5 + 0.5 * Math.cos(TAU * B));
  poz.aS[1] = poz.aL[1] = 0.19;
  poz.aS[2] = poz.aL[2] = 0;
  poz.yat = azHareket ? 0 : yatEk(k) * 0.6;
  poz.hipY += kasisHop(ON_U);
  const W = iskeletKur(k, poz), dk = direksiyonYeri();
  // eller direksiyonun iki yanında; viraj yokken direksiyon vuruşla hafifçe oynar
  const oyna = azHareket ? 0 : 0.03 * Math.sin(TAU * B / 4);
  let hR = [dk[0] - 0.02, dk[1] + 0.06 + oyna, dk[2] - 0.13], hL = [dk[0] + 0.02, dk[1] + 0.06 - oyna, dk[2] + 0.11];
  if (k.uzat)
    [hR, hL] = elUzat(k, k.uzat, hR, hL);
  k.j.haR = hR;
  k.j.haL = hL;
  kolKur(k);
  let bas = Math.PI - 0.35;
  if (k.uzat)
    bas = Math.PI + aciFark(Math.PI, Math.atan2(k.uzat.hedef[0] - k.x, k.uzat.hedef[2] - k.z)) * 0.6;
  k.basYon += aciFark(k.basYon, bas) * Math.min(1, dt * 7);
}
function direksiyonYeri() { return [D.otoX - (ON_U - 0.4), ZEMIN_Y + D.bob + 0.47, UZAK_Z]; }

/* ---- kamera ---- */
// Kadraja girecek u aralığı, dolmuşun ortası x = 0'a gelecek biçimde; derinlikte yakın tekerlerden arka duvara.
// Yarı genişlik hedef aralıktan hesaplanır (D.otoX ona doğru kayarken kamera da aynı hızla yaklaşır).
function oyunKamera() {
  const a = kadrajAraligi(), y = (a[1] - a[0]) / 2;
  return [[y, -1.2], [y, 1.08], [0, -1.2], [0, 1.08]];
}
