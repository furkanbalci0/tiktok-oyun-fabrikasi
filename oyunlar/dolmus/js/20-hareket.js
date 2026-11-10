/* DOLMUŞ HAREKETİ — yolun akması, gövdenin yaylanması, koltuk değiştirme sıçrayışı, el uzatma, gösteriler.
 * yolcuHareket(k, dt, db): sıçra / otur / in, pozu ve elleri kur · soforHareket: direksiyon, para alma
 * Kancalar: oyunGuncelle(dt), oyunKamera().
 * Oturan yolcu: kalça koltuk yüksekliğinde (OTUR_KALCA), ayaklar önde. Hepsi kameraya dönük (yön π); baş ayrıca
 * döner (k.basYon): çizimde insanEkle'den sonra k.f / k.l başın yönüne çevrilir (40-dolmus.js).
 * Kameraya bakan birinin sol yanı ekranın sağıdır: poz.yat + gövdeyi ekranda sağa yatırır.
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
      bob += (u < 1 ? 0.18 : 0.1) * Math.sin(Math.PI * (u % 1));
  }
  D.bob = bob;
  // Gösteride dolmuş yana kayar: sahneyi alan yolcu kadrajın ortasına gelir.
  const ox = dr && dr.yakin ? dr.k.bx : 0;
  D.otoX += (ox - D.otoX) * Math.min(1, dt * 1.6);

  paraIlerlet();
  for (const k of D.oy.values())
    yolcuHareket(k, dt, db);
  soforHareket(dt);
  for (const n of D.paralar)
    n.p = paraYeri(n);
  liderPankartBak();
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
  g.ayakta = su > 1 && su < DURAK_V - 1.2 && !g.k.atla;
  g.k.yildiz = g.k.guler = su > -1;
  // Durak tabelası dolmuş durduğu yerde, kaldırımda belirir; dolmuş kalkınca geride kalır.
  if (g.isaret === null && su > 0.6)
    g.isaret = D.kayma;
}

/* ---- koltuk değiştirme: başların üstünden kısa bir sıçrayış ---- */
function atlaBaslat(k, s, disari) {
  const hx = s.x, hz = s.z, hy = disari ? s.y : tabanY(s.r), uz = Math.hypot(hx - k.bx, hz - k.bz);
  k.atla = { x0: k.bx, y0: k.by, z0: k.bz, x1: hx, y1: hy, z1: hz, b0: B, sure: clamp(0.8 + uz * 0.22, 0.8, 1.5), h: 0.55 + Math.min(0.6, uz * 0.25) };
  if (!disari)
    k.koltuk = s;
}

function koltukDolu(k, s) {
  for (const a of D.oy.values())
    if (a !== k && !a.cikiyor && a.koltuk === s)
      return true;
  return false;
}

/* ---- yolcu ---- */
function yolcuHareket(k, dt, db) {
  yolcuHazir(k);
  const d = D.durak, yildiz = !!(d && d.k === k && d.ayakta);
  // yeni koltuk: binen hemen, koltuk değiştiren para elden çıkınca sıçrar
  // (yeni binen, koltuğu henüz boşalmadıysa kaldırımda bekler)
  if (!k.cikiyor && !k.atla && k.yeniKoltuk && k.koltuk !== k.yeniKoltuk && (k.koltuk ? B >= D.yerDegis : !koltukDolu(k, k.yeniKoltuk)))
    atlaBaslat(k, k.yeniKoltuk);
  if (k.cikiyor && !k.indi) {
    // "Müsait bir yerde": en yakın yan duvarın üstünden kaldırıma sıçrar
    k.indi = true;
    atlaBaslat(k, { x: (k.bx >= 0 ? 1 : -1) * (DUVAR_X + 0.9), z: k.bz, y: 0.14 }, true);
  }
  let havada = 0;
  if (k.atla) {
    const a = k.atla, t = clamp((B - a.b0) / a.sure, 0, 1), e = yumusak(t);
    k.bx = lerp(a.x0, a.x1, e);
    k.bz = lerp(a.z0, a.z1, e);
    havada = a.h * Math.sin(Math.PI * t);
    k.by = lerp(a.y0, a.y1, e);
    if (t >= 1)
      k.atla = null;
  }
  else if (k.cikiyor)
    k.bz += db * D.hiz; // kaldırımda kalır, dolmuş uzaklaşır
  const oturacak = !k.atla && !k.cikiyor && !yildiz && !!k.koltuk;
  k.otur += ((oturacak ? 1 : 0) - k.otur) * Math.min(1, dt * (oturacak ? 6 : 10));
  k.yer = oturacak ? 1 : 0;
  if (k.cikiyor)
    k.gitti = !k.atla && k.bz > ARKA_Z + 2.5;
  k.olcek += ((yildiz ? 1.35 : 1) - k.olcek) * Math.min(1, dt * 4);
  k.g.boy = k.asilBoy * k.olcek;
  // dünyadaki yer: içerideyken dolmuşla yaylanır
  k.x = k.bx - D.otoX;
  k.z = k.bz;
  k.y0 = k.by + havada + (Math.abs(k.bx) < DUVAR_X ? D.bob : 0);
  k.yon += aciFark(k.yon, Math.PI) * Math.min(1, dt * 8);

  const poz = pozBekle(k), o = k.otur, vurus = 0.5 + 0.5 * Math.cos(TAU * B);
  poz.hipY = lerp(poz.hipY, OTUR_KALCA + 0.01 * vurus, o);
  poz.aS[1] = lerp(poz.aS[1], 0.17, o);
  poz.aL[1] = lerp(poz.aL[1], 0.17, o);
  poz.aS[2] *= 1 - o;
  poz.aL[2] *= 1 - o;
  poz.yat += yatEk(k);
  poz.egim += egimEk() * o;
  const hop = kasisHop(k.bz);
  poz.hipY += hop;
  if (azHareket)
    poz.yat = 0;
  const W = iskeletKur(k, poz), j = k.j, hy = poz.hipY;
  // eller: oturan dizlerinde, ayaktaki yanlarında
  let hR = o > 0.5 ? W(-0.11, hy + 0.05, 0.16) : W(-0.2, hy + 0.06, 0.05);
  let hL = o > 0.5 ? W(0.11, hy + 0.05, 0.16) : W(0.2, hy + 0.06, 0.05);
  const sal = Math.sin(TAU * B + k.dfaz * TAU);
  if (yildiz) {
    hR = W(-0.3 - 0.05 * sal, hy + 0.62, 0.06);
    hL = W(0.3 + 0.05 * sal, hy + 0.58 + 0.06 * Math.cos(TAU * B), 0.06);
  }
  else if (k.atla || hop > 0.03) {
    // sıçrarken ve kasiste kollar havada
    hR = W(-0.25, hy + 0.5, 0.04);
    hL = W(0.25, hy + 0.5, 0.04);
  }
  else if (d && d.ayakta && !k.cikiyor) {
    // gösteride herkes alkışlar
    const ac = Math.abs(Math.sin(Math.PI * 2 * B + k.dfaz * 3));
    hR = W(-0.03 - 0.07 * ac, hy + 0.27, 0.19);
    hL = W(0.03 + 0.07 * ac, hy + 0.27, 0.19);
  }
  else if (B >= k.zip0 && B < k.zip1 && !k.uzat)
    hL = W(0.26 + 0.05 * sal, hy + 0.5, 0.06); // hediye sevinci: el sallar
  if (k.uzat && !k.atla)
    [hR, hL] = elUzat(k, k.uzat, hR, hL);
  j.haR = hR;
  j.haL = hL;
  kolKur(k);
  // baş: kameraya, para geçerken karşısındakine, gösteride yıldıza bakar
  let bas = Math.PI + (k.dfaz - 0.5) * 0.3;
  if (k.uzat && !k.uzat.yukari)
    bas = Math.PI + aciFark(Math.PI, Math.atan2(k.uzat.hedef[0] - k.x, k.uzat.hedef[2] - k.z)) * 0.5;
  else if (d && d.ayakta && !yildiz)
    bas = Math.PI + clamp(d.k.x - k.x, -1, 1) * 0.6;
  k.basYon += aciFark(k.basYon, bas) * Math.min(1, dt * 7);
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
// Fren öne (kameraya), sollama geriye yaslar; teyp sağa sola sallar. Öne / geriye eğilme poz.egim'dir.
function yatEk(k) {
  if (etkin(D.teyp))
    return 0.035 * Math.sin(Math.PI * B + k.dfaz * 2);
  return 0;
}
function egimEk() {
  let e = 0;
  const d = D.durak;
  if (d) {
    const su = B - d.bas;
    if (su > -0.5 && su < 1.5)
      e += 0.12 * Math.sin(Math.PI * clamp((su + 0.5) / 2, 0, 1));
  }
  if (etkin(D.sollama))
    e -= 0.08 * Math.sin(Math.PI * clamp((B - D.sollama.bas) / D.sollama.sure, 0, 1));
  return azHareket ? 0 : e;
}
function kasisHop(z) {
  if (!D.kasis || azHareket)
    return 0;
  const t = B - D.kasis.bas - z * 0.12;
  return t > 0 && t < 1 ? 0.16 * Math.sin(Math.PI * t) : 0;
}

/* ---- şoför: direksiyonda, para gelince yana uzanır ---- */
function soforHareket(dt) {
  const k = sofor;
  k.x = SOFOR_KOLTUK.x - D.otoX;
  k.z = 0;
  k.y0 = ZEMIN_Y + D.bob;
  k.yon = Math.PI;
  const poz = pozBekle(k);
  poz.hipY = OTUR_KALCA + 0.01 * (0.5 + 0.5 * Math.cos(TAU * B));
  poz.aS[1] = poz.aL[1] = 0.17;
  poz.aS[2] = poz.aL[2] = 0;
  poz.yat = azHareket ? 0 : yatEk(k) * 0.6;
  poz.egim = egimEk();
  poz.hipY += kasisHop(0);
  const W = iskeletKur(k, poz), dk = direksiyonYeri();
  // eller direksiyonun iki yanında; direksiyon vuruşla hafifçe oynar
  const oyna = azHareket ? 0 : 0.03 * Math.sin(TAU * B / 4);
  let hR = [dk[0] - 0.15, dk[1] + 0.05 + oyna, dk[2]], hL = [dk[0] + 0.15, dk[1] + 0.05 - oyna, dk[2]];
  if (k.uzat)
    [hR, hL] = elUzat(k, k.uzat, hR, hL);
  k.j.haR = hR;
  k.j.haL = hL;
  kolKur(k);
  let bas = Math.PI;
  if (k.uzat)
    bas = Math.PI + aciFark(Math.PI, Math.atan2(k.uzat.hedef[0] - k.x, k.uzat.hedef[2] - k.z)) * 0.6;
  k.basYon += aciFark(k.basYon, bas) * Math.min(1, dt * 7);
}
function direksiyonYeri() { return [SOFOR_KOLTUK.x - D.otoX, ZEMIN_Y + D.bob + 0.5, -0.17]; }

/* ---- kamera ---- */
// Bütün dolmuş: yan duvardan yan duvara, ön tampondan arka duvara. Gösteride sahneyi alan yolcuya daralır.
// kameraSigdir her noktaya bir insanın yarı genişliği kadar (0,55 m) pay ekler; dolmuşun kenarı zaten kenardır,
// o pay sokağa kalsın diye kenar noktası KAMERA_PAY kadar içeriden verilir.
const KAMERA_PAY = 0.4;
function oyunKamera() {
  const d = D.durak;
  if (d && d.yakin)
    return [[1.05, d.k.bz - 0.75], [1.05, d.k.bz + 0.3], [0, d.k.bz]];
  return [[DUVAR_X - KAMERA_PAY, ON_UC - 0.12], [DUVAR_X - KAMERA_PAY, ARKA_Z + 0.05]];
}
