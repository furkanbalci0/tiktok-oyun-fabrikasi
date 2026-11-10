/* SAHNE — tuval, tema renkleri, kamera, perspektif, çizim listesi, ad etiketleri. Oyundan bağımsızdır.
 * RENK: tema (OYUN.renk ezer) · kam + kamKur + pr(): 3B noktayı 720×1280 sanal tuvale düşürür
 * ik(): iki kemikli ters kinematik (diz, dirsek) · liste + kap / top / ozel + listeCiz(): uzaktan yakına çizim
 * kameraSigdir(noktalar, dt): verilen yer noktaları ALAN_UST–ALAN_ALT şeridine sığacak kadar uzaklaşır
 * golge: ayak gölgesi · etiketCiz(ekler): ad etiketleri ve konuşma balonları · kenarKarart: köşeleri karartır
 * Eksenler: x sağ, y yukarı, z kameradan uzağa. Karakterin yerel ekseni: x = kendi solu, z = baktığı yön.
 */
const tuval = $('tuval'), c = tuval.getContext('2d');
const GW = 720, GH = 1280;
// Tema renkleri. CSS'te aynı adlar --zemin, --zemin-2 … olarak kullanılır; panel açılışta bunları RENK'ten yazar.
// Renkler #rrggbb biçiminde verilmeli (yarı saydam tonlar bunlardan türetilir).
const RENK_OTO = {
  zemin: '#0e1230', zemin2: '#171d47', zemin3: '#232b63', cizgi: '#343d80',
  vurgu: '#ffd166', sicak: '#e23d2f', serin: '#22b8a7', acik: '#f6ecd9', soluk: '#a9b0dc', murekkep: '#080a1c'
};
const RENK = Object.assign({}, RENK_OTO, OYUN.renk || {});
// Yayın masasının (panelin) renkleri. OYUN.panelRenk verilmezse panel de RENK'i kullanır (eski davranış). Verilirse
// eksik adlar çekirdeğin koyu temasından gelir: gündüz sahnesi açık renkli olsa da panel koyu ve okunaklı kalır.
const PANEL_RENK = OYUN.panelRenk ? Object.assign({}, RENK_OTO, OYUN.panelRenk) : null;
const MUREKKEP = RENK.murekkep;
function renkSaydam(hex, a) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex));
  if (!m)
    return hex;
  const h = m[1].length === 3 ? m[1].replace(/./g, x => x + x) : m[1], n = parseInt(h, 16);
  return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
}
// Dar açılı, yüksekten bakan kamera: öndeki ile arkadaki arasında boy farkı az kalır.
// OYUN.kamera { egim, F, enYakin, ustPay, altPay } varsayılanları ezer.
const kam = Object.assign({ yaw: 0, egim: 0.62, D: 14, tx: 0, ty: 0, tz: 0, F: 1400, cx: 360, cy: 760, ustPay: 1.5, altPay: 0.15 }, OYUN.kamera || {},
  { C: [0, 0, 0], r: [1, 0, 0], u: [0, 1, 0], f: [0, 0, 1], son: { enX: 0, hd: 0 } });
if (!(kam.enYakin > 0))
  kam.enYakin = kam.F / 190;
function kamKur() {
  const cp = Math.cos(kam.egim), sp = Math.sin(kam.egim), sy = Math.sin(kam.yaw), cy = Math.cos(kam.yaw);
  kam.f = [sy * cp, -sp, cy * cp];
  const f = kam.f;
  kam.C = [kam.tx - f[0] * kam.D, kam.ty - f[1] * kam.D, kam.tz - f[2] * kam.D];
  const rl = Math.hypot(f[2], f[0]);
  kam.r = [f[2] / rl, 0, -f[0] / rl];
  const r = kam.r;
  kam.u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
  // Başlar kameraya doğru kalkık çizilir: yukarıdan bakınca tepe değil yüz görünsün diye
  // yüz hatları gerçek eğimin küçük bir payıyla (bf, bu) yerleştirilir.
  const eb = kam.egim * 0.3, cb = Math.cos(eb), sb = Math.sin(eb), bf = kam.bf = [sy * cb, -sb, cy * cb];
  kam.bu = [bf[1] * r[2] - bf[2] * r[1], bf[2] * r[0] - bf[0] * r[2], bf[0] * r[1] - bf[1] * r[0]];
}
// Dünyadaki [x, y, z] noktası → ekranda { x, y }, ölçek s (1 metre kaç piksel), derinlik d, görünür mü ok.
function pr(v) {
  const x = v[0] - kam.C[0], y = v[1] - kam.C[1], z = v[2] - kam.C[2];
  const d = x * kam.f[0] + y * kam.f[1] + z * kam.f[2];
  if (d < 0.35)
    return { x: 0, y: 0, s: 0, d, ok: false };
  const s = kam.F / d;
  return { x: kam.cx + (x * kam.r[0] + z * kam.r[2]) * s, y: kam.cy - (x * kam.u[0] + y * kam.u[1] + z * kam.u[2]) * s, s, d, ok: true };
}
// a'dan b'ye uzanan iki kemik (l1, l2): ortadaki eklemi kutup yönüne doğru büker, sonucu out'a yazar.
function ik(a, b, l1, l2, kutup, out) {
  let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], gd = Math.hypot(dx, dy, dz) || 1e-4;
  const nx = dx / gd, ny = dy / gd, nz = dz / gd, d = Math.min(gd, (l1 + l2) * 0.999);
  const aa = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - aa * aa));
  const kn = kutup[0] * nx + kutup[1] * ny + kutup[2] * nz;
  let px = kutup[0] - nx * kn, py = kutup[1] - ny * kn, pz = kutup[2] - nz * kn;
  const pl = Math.hypot(px, py, pz) || 1;
  out[0] = a[0] + nx * aa + px / pl * h;
  out[1] = a[1] + ny * aa + py / pl * h;
  out[2] = a[2] + nz * aa + pz / pl * h;
  return out;
}

/* ---- çizim listesi (uzaktan yakına sıralanır) ---- */
// Her karede çekirdek listeyi boşaltır, oyunCiz() doldurur, çekirdek derinliğe göre sıralayıp çizer.
// d büyük = uzak. Aynı derinlikteki parçalar eklendikleri sırayla çizilir.
const liste = [];
// İki ucu farklı yarıçaplı kapsül (kol, bacak, gövde). pa / pb: pr() sonucu, ra / rb: metre cinsinden yarıçap.
function kap(pa, ra, pb, rb, renk, d) {
  if (!pa.ok || !pb.ok)
    return;
  liste.push({ d: d === undefined ? (pa.d + pb.d) / 2 : d, t: 0, x1: pa.x, y1: pa.y, r1: ra * pa.s, x2: pb.x, y2: pb.y, r2: rb * pb.s, c: renk, w: Math.max(1, (pa.s + pb.s) * 0.0065) });
}
// Mürekkep çizgili daire (el, top, uç). r metre; cizgi verilmezse ölçeğe göre seçilir.
function top(p, r, renk, d, cizgi) {
  if (!p.ok)
    return;
  liste.push({ d: d === undefined ? p.d : d, t: 2, x: p.x, y: p.y, r: r * p.s, c: renk, w: cizgi === undefined ? Math.max(1, p.s * 0.011) : cizgi });
}
// Serbest çizim: fn sırası gelince doğrudan c ile çizer.
function ozel(d, fn) { liste.push({ d, t: 1, fn }); }
function kapYol(x1, y1, r1, x2, y2, r2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  c.beginPath();
  c.arc(x1, y1, r1, a + HP, a - HP);
  c.arc(x2, y2, r2, a - HP, a + HP);
  c.closePath();
}
function listeCiz() {
  liste.sort((a, b) => b.d - a.d);
  c.strokeStyle = MUREKKEP;
  for (const o of liste) {
    if (o.t === 0) {
      kapYol(o.x1, o.y1, o.r1, o.x2, o.y2, o.r2);
      c.fillStyle = o.c;
      c.fill();
      c.lineWidth = o.w;
      c.strokeStyle = MUREKKEP;
      c.stroke();
    }
    else if (o.t === 2) {
      c.beginPath();
      c.arc(o.x, o.y, o.r, 0, TAU);
      c.fillStyle = o.c;
      c.fill();
      c.lineWidth = o.w;
      c.strokeStyle = MUREKKEP;
      c.stroke();
    }
    else
      o.fn();
  }
}

/* ---- kamera: oyuncular yayın alanına sığsın ---- */
// Sahnenin oyuncular için ayrılan dikey şeridi (sanal 1280 satırda): üstü HUD, altı TikTok'un yorum alanı.
const ALAN_UST = 505, ALAN_ALT = 1006;
let kamCy = kam.cy;
// Bir adın kutusunun başın tepesinden yukarı kapladığı en büyük yükseklik (lider: 22 punto + 9 + 5 boşluk).
// OYUN.kamera.ustPx için hazır değer: ustPay başın tepesine kadar metre, ustPx adın kendisi piksel.
const ETIKET_PAY = 36;
// Bir kadraj: verilen noktalar (her biri [x, z] ya da [x, z, pay]) tx'e bakan kameraya sığsın diye uzaklık (hD),
// derinliğin ortası (zOrta), yarı derinlik (hd), hedef satır (hCy) ve en geniş yana uzaklık (enX). Öntanımlarla
// (tx = 0, pay 0,55, piksel payı 0) eski kameraSigdir'in hesabının aynısıdır.
function kadrajHesap(noktalar, tx, ustPx, altPx) {
  let mnZ = Infinity, mxZ = -Infinity;
  for (const n of noktalar) {
    if (n[1] < mnZ)
      mnZ = n[1];
    if (n[1] > mxZ)
      mxZ = n[1];
  }
  if (!(mxZ >= mnZ))
    mnZ = mxZ = 0;
  const hd = (mxZ - mnZ) / 2, zOrta = (mnZ + mxZ) / 2, se = Math.sin(kam.egim), ce = Math.cos(kam.egim);
  // Genişlik: kameraya yakın duran daha iri göründüğü için her nokta kendi derinliğiyle hesaba girer.
  let hD = kam.enYakin, ust = 0, alt = 0, enX = 0;
  for (const n of noktalar) {
    const x = Math.abs(n[0] - tx);
    hD = Math.max(hD, (x + (n[2] === undefined ? 0.55 : n[2])) * kam.F / 322 - (n[1] - zOrta) * ce);
    enX = Math.max(enX, x);
  }
  // Piksel payları (ad etiketi gibi ekranda sabit boyda kalan şeyler) şeridi baştan daraltır.
  const bant = ALAN_ALT - ALAN_UST - ustPx - altPx;
  for (let i = 0; i < 5; i++) {
    // en arkadakinin adının üstü ve en öndekinin ayağı, hedef noktaya göre ekranda ne kadar yer tutuyor
    ust = (hd * se + kam.ustPay * ce) * kam.F / (hD + hd * ce);
    alt = (hd * se + kam.altPay) * kam.F / (hD - hd * ce);
    if (ust + alt <= bant)
      break;
    hD *= (ust + alt) / bant;
  }
  return { hD, zOrta, hd, enX, mnZ, se, ce, ust, alt, bant };
}
// Kadrajın hedef satırı: üst ve alt payların arası şeridin ortasına gelsin.
const kadrajCy = (h, ustPx) => ALAN_UST + ustPx + h.ust + (h.bant - h.ust - h.alt) / 2;
// girdi (oyunKamera() döndürür) iki biçimde olabilir:
//   [[x, z], …]   kadraja girmesi gereken yer noktaları; kamera x = 0'a bakar (eski biçim, öntanım).
//   { noktalar, x, odak, odakEn, on, ustPx, altPx }   seçenekli biçim (docs/KANCALAR.md, "Kamera"):
//     noktalar [[x, z, pay?], …] · x: bakılan x (sayı ya da 'orta') · odak: hep büyük kalacak noktalar,
//     odakEn: kalabalık için en çok kaç kat uzaklaşılır (1,25) · on: en öndekinden bu kadar metre derine kadar
//     sığdır, gerisi (kuyruk) kadrajdan taşabilir · ustPx / altPx: şeridin üstünde / altında piksel payı.
//   Seçeneklerin öntanımı OYUN.kamera'dan gelir (orada da x, odakEn, on, ustPx, altPx yazılabilir).
// Sonuç yumuşakça yaklaşır; kam.son = { enX, hd } (en geniş yana uzaklık ve derinliğin yarısı) oyunun zeminini
// kalabalığa göre büyütmesi için saklanır.
function kameraSigdir(girdi, dt) {
  const s = Array.isArray(girdi) ? null : girdi || {};
  let noktalar = s ? s.noktalar || [] : girdi;
  const sec = ad => s && s[ad] !== undefined ? s[ad] : kam[ad];
  const ustPx = sec('ustPx') || 0, altPx = sec('altPx') || 0, on = sec('on'), odak = s && s.odak ? s.odak : null;
  let tx = sec('x');
  if (tx === 'orta') {
    let a = Infinity, b = -Infinity;
    for (const n of odak || noktalar) {
      a = Math.min(a, n[0]);
      b = Math.max(b, n[0]);
    }
    tx = b >= a ? (a + b) / 2 : 0;
  }
  else if (!Number.isFinite(tx))
    tx = 0;
  if (odak)
    noktalar = noktalar.concat(odak);
  // Kuyruk: en öndekinden "on" metreden derindeki noktalar o derinliğe çekilir, genişlikleri sayılmaz.
  if (on > 0 && noktalar.length) {
    let mnZ = Infinity;
    for (const n of noktalar)
      mnZ = Math.min(mnZ, n[1]);
    const sinir = mnZ + on;
    noktalar = noktalar.map(n => n[1] > sinir ? [tx, sinir, 0] : n);
  }
  let h = kadrajHesap(noktalar, tx, ustPx, altPx), hD = h.hD;
  // Odak: büyük nesne (televizyon, sahne) kalabalık yüzünden küçülmesin. Kalabalık odağın gerektirdiğinden en
  // çok odakEn kat uzaklaştırabilir; fazlası kadrajdan taşar, kadraj odağa ortalanır.
  if (odak && odak.length) {
    const o = kadrajHesap(odak, tx, ustPx, altPx), en = o.hD * (sec('odakEn') || 1.25);
    if (hD > en) {
      h = o;
      hD = en;
      h.ust = (h.hd * h.se + kam.ustPay * h.ce) * kam.F / (hD + h.hd * h.ce);
      h.alt = (h.hd * h.se + kam.altPay) * kam.F / (hD - h.hd * h.ce);
    }
  }
  const hd = h.hd, zOrta = h.zOrta, enX = h.enX, kk = Math.min(1, dt * 1.6);
  const hCy = kadrajCy(h, ustPx);
  kam.D += (hD - kam.D) * kk;
  kam.tz += (zOrta - kam.tz) * kk;
  kam.tx += (tx - kam.tx) * kk;
  kamCy += (hCy - kamCy) * kk;
  // hafif sağa sola salınım ve hediye sarsıntısı (D.sarsinti 0–1; oyun artırır, burada söner)
  kam.yaw = azHareket ? 0 : 0.035 * Math.sin(zaman * 0.21);
  D.sarsinti *= Math.exp(-dt * 5);
  kam.cx = 360 + (azHareket ? 0 : Math.sin(zaman * 60) * D.sarsinti * 6);
  kam.cy = kamCy + (azHareket ? 0 : Math.cos(zaman * 53) * D.sarsinti * 6);
  kam.son.enX = enX;
  kam.son.hd = hd;
  kamKur();
}

/* ---- gölge, ad etiketleri, konuşma balonları, kenar karartması ---- */
// Yerdeki gölge: (x, z) noktasında rx × rz metrelik elips.
function golge(x, z, rx, rz) {
  const g = pr([x, 0, z]);
  if (!g.ok)
    return;
  c.fillStyle = 'rgba(40,24,30,.34)';
  c.beginPath();
  c.ellipse(g.x, g.y, rx * g.s, rz * g.s, 0, 0, TAU);
  c.fill();
}
// k.et = { x, y, s, d }: etiketin oturacağı yer (başın tepesi), ölçek ve derinlik. insanEkle kendisi kurar;
// insan çizmeyen oyun her karede kendisi yazar. Çekirdek her karede izleyicilerin k.et'ini boşaltır.
// İsteğe bağlı alanlar (docs/KANCALAR.md, "Ad etiketleri"):
//   et.asagi (ya da kalıcı k.etAsagi): ad başın üstüne değil, et.alt (yoksa et.y) noktasının altına asılır
//   et.alt: alt bağlantı noktası (insanEkle çeneyi yazar) · et.bx / et.by: konuşma balonunun ucunun yeri
// ekler: izleyici olmayan, etiketi olacak oyuncular (oyunEkAdlar()); k.ozel olanlar vurgu rengiyle yazılır.
// OYUN.etiket = { ustSinir, altSinir, disari, balonSira } (hepsi isteğe bağlı; yoksa eski davranış):
//   ustSinir: adın üst kenarı bu satırın üstüne çıkmaz (true = ALAN_UST, sıralama kutusunun altı)
//   altSinir: adın alt kenarı bu satırın altına inmez (true = ALAN_ALT, yorum alanının üstü)
//   disari: 'gizle' → bağlantı noktası ekran dışında kalanın adı (ve balonu) çizilmez; öntanım 'kenar' (kenara itilir)
//   balonSira: 'ekleme' (öntanım) · 'derinlik' (uzaktaki önce, öndeki üstte) · 'oncelik' (lider en üstte)
const ETIKET = Object.assign({ ustSinir: null, altSinir: null, disari: 'kenar', balonSira: 'ekleme' }, OYUN.etiket || {});
for (const [ad, sinir] of [['ustSinir', ALAN_UST], ['altSinir', ALAN_ALT]])
  ETIKET[ad] = ETIKET[ad] === true ? sinir : Number.isFinite(ETIKET[ad]) ? ETIKET[ad] : null;
function etiketCiz(ekler) {
  const adlar = ekler.filter(k => k && k.et);
  for (const k of D.oy.values())
    if (k.et && !k.cikiyor)
      adlar.push(k);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  // Yer yetmeyince kimin adı kalır: lider, yıldız, özel oyuncular, son konuşanlar, ilk beş, öndekiler.
  const onc = k => (k === D.lider ? 2000 : 0) + (k.yildiz ? 1500 : 0) + (k.ozel ? 900 : 0) + (zaman - k.son < 6 ? 600 - (zaman - k.son) * 20 : 0) + (!k.ozel && k.sn < 5 ? 200 - k.sn : 0) - k.et.d;
  const kutular = [], sirali = adlar.slice().sort((a, b) => onc(b) - onc(a));
  const ustS = ETIKET.ustSinir, altS = ETIKET.altSinir, gizle = ETIKET.disari === 'gizle';
  for (const k of sirali) {
    const et = k.et, bas = k === D.lider, yeniMi = !k.ozel && zaman - k.yeni < 3;
    k.etKutu = null;
    k.etDisari = gizle && !(et.x >= 0 && et.x <= GW && et.y >= 0 && et.y <= GH);
    if (k.etDisari)
      continue;
    const punto = clamp(Math.round(et.s * 0.17), 13, 18) + (bas ? 4 : 0), yk = punto + 9, tac = bas ? punto * 1.05 : 0;
    c.font = (bas ? '700 ' : '500 ') + punto + 'px Rubik, system-ui, sans-serif';
    if (k.adYazi !== k.ad + punto) {
      k.adYazi = k.ad + punto;
      k.adW = c.measureText(k.ad).width;
    }
    const asagi = !!(et.asagi || k.etAsagi);
    const w = k.adW + punto * 1.1 + tac;
    let y0 = asagi ? (et.alt === undefined ? et.y : et.alt) + 5 + yk : et.y - 5;
    const x = clamp(et.x, w / 2 + 4, GW - w / 2 - 4);
    // Yer yoksa ad bir iki kat kayar: başın üstündeki ad yukarı, altına asılan ad aşağı. Sınıra dayanan ad
    // sınırdan uzağa doğru kayar. Sınırın çok ötesine düşen (baş sınırın epey üstünde) ad, öncelikli değilse yazılmaz.
    let yon = asagi ? 1 : -1, itme = 0;
    if (ustS !== null && y0 - yk < ustS) {
      itme = ustS - (y0 - yk);
      y0 = ustS + yk;
      yon = 1;
    }
    if (altS !== null && y0 > altS) {
      itme = Math.max(itme, y0 - altS);
      y0 = altS;
      yon = -1;
    }
    k.etY = y0 - yk;
    if (itme > yk * 2 && onc(k) < 500)
      continue;
    const adim = yon * (yk + 2);
    let y = null;
    for (const dy of [0, adim, adim * 2]) {
      const a = x - w / 2, u = y0 + dy - yk;
      if ((ustS !== null && u < ustS) || (altS !== null && u + yk > altS))
        continue;
      if (!kutular.some(q => a < q[0] + q[2] && a + w > q[0] && u < q[1] + q[3] && u + yk > q[1])) {
        y = y0 + dy;
        break;
      }
    }
    if (y === null) {
      if (onc(k) < 500)
        continue;
      y = y0;
    }
    k.etY = y - yk;
    kutular.push([x - w / 2, y - yk, w, yk]);
    k.etKutu = kutular[kutular.length - 1];
    c.fillStyle = bas ? RENK.vurgu : renkSaydam(MUREKKEP, 0.78);
    c.beginPath();
    c.roundRect(x - w / 2, y - yk, w, yk, yk / 2);
    c.fill();
    if (bas) {
      c.lineWidth = 2.5;
      c.strokeStyle = MUREKKEP;
      c.stroke();
      // taç: liderin işareti
      const tx = x - w / 2 + punto * 0.5, ty = y - yk / 2, b = punto * 0.42;
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
    c.fillStyle = bas ? MUREKKEP : yeniMi ? '#5fe0d0' : k.ozel ? RENK.vurgu : RENK.acik;
    c.fillText(k.ad, x + tac / 2, y - yk / 2 + 1);
  }
  // Balonların çizim sırası: sonra çizilen üstte kalır.
  let balonlar = adlar;
  if (ETIKET.balonSira === 'derinlik')
    balonlar = adlar.slice().sort((a, b) => b.et.d - a.et.d);
  else if (ETIKET.balonSira === 'oncelik')
    balonlar = adlar.slice().sort((a, b) => onc(a) - onc(b));
  for (const k of balonlar) {
    if (!k.balon)
      continue;
    const ya = zaman - k.balon.t0;
    if (ya > 3.4) {
      k.balon = null;
      continue;
    }
    if (k.etDisari)
      continue;
    const et = k.et, al = Math.min(1, ya * 8, (3.4 - ya) * 4);
    // Balonun ucu: oyunun verdiği yer, yoksa adın üstü; ad aşağı asılıysa başın üstü.
    const bx = et.bx === undefined ? et.x : et.bx;
    let by = et.by !== undefined ? et.by : (et.asagi || k.etAsagi) ? et.y - 12 : (k.etY ?? et.y - 60) - 12, kuyruk = true;
    // Üst sınır varsa balon sıralama kutusuna girmez: sınıra dayanır, ucu ancak altında kalırsa çizilir.
    if (ETIKET.ustSinir !== null && by - 36 < ETIKET.ustSinir) {
      by = ETIKET.ustSinir + 36;
      kuyruk = et.y > by + 4;
    }
    c.font = '700 21px Rubik, system-ui, sans-serif';
    const w = Math.min(330, c.measureText(k.balon.m).width + 28), x = clamp(bx, w / 2 + 8, GW - w / 2 - 8);
    c.globalAlpha = al;
    c.fillStyle = RENK.vurgu;
    c.strokeStyle = MUREKKEP;
    c.lineWidth = 2.5;
    c.beginPath();
    c.roundRect(x - w / 2, by - 36, w, 36, 14);
    c.fill();
    c.stroke();
    if (kuyruk) {
      c.beginPath();
      c.moveTo(bx - 8, by - 2);
      c.lineTo(bx, by + 9);
      c.lineTo(bx + 8, by - 2);
      c.stroke();
      c.fill();
    }
    c.fillStyle = MUREKKEP;
    c.fillText(k.balon.m, x, by - 17, w - 18);
    c.globalAlpha = 1;
  }
  c.textBaseline = 'alphabetic';
}
let kenarBoya = null;
function kenarKarart() {
  if (!kenarBoya) {
    kenarBoya = c.createRadialGradient(GW / 2, GH * 0.58, GH * 0.32, GW / 2, GH * 0.58, GH * 0.74);
    kenarBoya.addColorStop(0, renkSaydam(MUREKKEP, 0));
    kenarBoya.addColorStop(1, renkSaydam(MUREKKEP, 0.5));
  }
  c.fillStyle = kenarBoya;
  c.fillRect(0, 0, GW, GH);
}
