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
const RENK = Object.assign({
  zemin: '#0e1230', zemin2: '#171d47', zemin3: '#232b63', cizgi: '#343d80',
  vurgu: '#ffd166', sicak: '#e23d2f', serin: '#22b8a7', acik: '#f6ecd9', soluk: '#a9b0dc', murekkep: '#080a1c'
}, OYUN.renk || {});
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
// noktalar: kadraja girmesi gereken yer noktaları [[x, z], …] (oyunKamera() döndürür). Kamera sağa sola
// dönmez, ortaya bakar; bu yüzden yalnız |x| önemlidir. Sonuç yumuşakça yaklaşır; kam.son = { enX, hd }
// (en geniş |x| ve derinliğin yarısı) oyunun zeminini kalabalığa göre büyütmesi için saklanır.
function kameraSigdir(noktalar, dt) {
  let mnZ = Infinity, mxZ = -Infinity;
  for (const n of noktalar) {
    if (n[1] < mnZ)
      mnZ = n[1];
    if (n[1] > mxZ)
      mxZ = n[1];
  }
  if (!(mxZ >= mnZ))
    mnZ = mxZ = 0;
  const hd = (mxZ - mnZ) / 2, zOrta = (mnZ + mxZ) / 2, se = Math.sin(kam.egim), ce = Math.cos(kam.egim), kk = Math.min(1, dt * 1.6);
  // Genişlik: kameraya yakın duran daha iri göründüğü için her nokta kendi derinliğiyle hesaba girer.
  let hD = kam.enYakin, ust = 0, alt = 0, enX = 0;
  for (const n of noktalar) {
    const x = Math.abs(n[0]);
    hD = Math.max(hD, (x + 0.55) * kam.F / 322 - (n[1] - zOrta) * ce);
    enX = Math.max(enX, x);
  }
  for (let i = 0; i < 5; i++) {
    // en arkadakinin adının üstü ve en öndekinin ayağı, hedef noktaya göre ekranda ne kadar yer tutuyor
    ust = (hd * se + kam.ustPay * ce) * kam.F / (hD + hd * ce);
    alt = (hd * se + kam.altPay) * kam.F / (hD - hd * ce);
    if (ust + alt <= ALAN_ALT - ALAN_UST)
      break;
    hD *= (ust + alt) / (ALAN_ALT - ALAN_UST);
  }
  const hCy = ALAN_UST + ust + (ALAN_ALT - ALAN_UST - ust - alt) / 2;
  kam.D += (hD - kam.D) * kk;
  kam.tz += (zOrta - kam.tz) * kk;
  kam.tx += (0 - kam.tx) * kk;
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
// ekler: izleyici olmayan, etiketi olacak oyuncular (oyunEkAdlar()); k.ozel olanlar vurgu rengiyle yazılır.
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
  for (const k of sirali) {
    const et = k.et, bas = k === D.lider, yeniMi = !k.ozel && zaman - k.yeni < 3;
    const punto = clamp(Math.round(et.s * 0.17), 13, 18) + (bas ? 4 : 0), yk = punto + 9, tac = bas ? punto * 1.05 : 0;
    c.font = (bas ? '700 ' : '500 ') + punto + 'px Rubik, system-ui, sans-serif';
    if (k.adYazi !== k.ad + punto) {
      k.adYazi = k.ad + punto;
      k.adW = c.measureText(k.ad).width;
    }
    const w = k.adW + punto * 1.1 + tac, y0 = et.y - 5;
    const x = clamp(et.x, w / 2 + 4, GW - w / 2 - 4);
    let y = null;
    for (const dy of [0, -(yk + 2), -(yk + 2) * 2]) {
      const a = x - w / 2, u = y0 + dy - yk;
      if (!kutular.some(q => a < q[0] + q[2] && a + w > q[0] && u < q[1] + q[3] && u + yk > q[1])) {
        y = y0 + dy;
        break;
      }
    }
    k.etY = y0 - yk;
    if (y === null) {
      if (onc(k) < 500)
        continue;
      y = y0;
    }
    k.etY = y - yk;
    kutular.push([x - w / 2, y - yk, w, yk]);
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
  for (const k of adlar) {
    if (!k.balon)
      continue;
    const ya = zaman - k.balon.t0;
    if (ya > 3.4) {
      k.balon = null;
      continue;
    }
    const et = k.et, al = Math.min(1, ya * 8, (3.4 - ya) * 4), by = (k.etY ?? et.y - 60) - 12;
    c.font = '700 21px Rubik, system-ui, sans-serif';
    const w = Math.min(330, c.measureText(k.balon.m).width + 28), x = clamp(et.x, w / 2 + 8, GW - w / 2 - 8);
    c.globalAlpha = al;
    c.fillStyle = RENK.vurgu;
    c.strokeStyle = MUREKKEP;
    c.lineWidth = 2.5;
    c.beginPath();
    c.roundRect(x - w / 2, by - 36, w, 36, 14);
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(et.x - 8, by - 2);
    c.lineTo(et.x, by + 9);
    c.lineTo(et.x + 8, by - 2);
    c.stroke();
    c.fill();
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
