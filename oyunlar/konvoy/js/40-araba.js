/* ARABA ÇİZİMİ — her izleyicinin arabası, tavandan çıkıp el sallayan sürücüsü, gelin arabasının süsü,
 * korna yazısı, el değiştiren gelin kurdelesi.
 * arabaUret(id): renk ve kasa kimlikten türer (aynı izleyici her yayında aynı arabayla gelir)
 * arabaHazir(k): oyuncu kaydına araba alanlarını bir kez ekler · kutuCiz / yuzCiz (çekirdek): yerel eksende kutu ve yüzey
 * arabaCiz(k, T): bütün araba tek bir çizim parçasıdır (derinliği arabanın ortası)
 * Kancalar: oyunCiz(), oyunUst(dt).
 * Yerel eksen: a = arabanın sol yanı (k.l), y yukarı, cc = ileri (k.f; π yönünde kameraya bakar).
 */
const ARABA_RENK = ['#e23d2f', '#f6ecd9', '#3d5bd0', '#22b8a7', '#f2b632', '#2c2c38', '#e86a9a', '#4fae6c', '#8b55c9', '#ef7d2d', '#b9c6dc'];
const KURDELE = ['#e23d2f', '#ffd166', '#f6ecd9', '#22b8a7', '#e86a9a'];
function arabaUret(id) {
  const r = rastgeleUret(ozet('araba:' + id)), sec2 = a => a[Math.floor(r() * a.length)];
  const kasa = r() < 0.6 ? 'sedan' : 'hatch';
  return { renk: sec2(ARABA_RENK), kasa, kurdele: sec2(KURDELE), faz: r(), elSag: r() < 0.5 };
}
function arabaHazir(k) {
  if (k.ar)
    return;
  k.ar = arabaUret(k.id);
  k.ox = 0;
  k.oz = 0;
  k.oy0 = 0;
  k.korna = -99;
  k.far = -99;
}

/* Kutu, yüzey, daire, kapsül ve renk karışımı çekirdeğin çizim yardımcılarıdır (cekirdek/js/33-cizim.js):
 * kutuCiz, yuzCiz, yerelNokta, cokgenCiz, daireCiz, kapsulCiz, renkKat. T = arabaDonusum(k) (donusum biçiminde). */

/* ---- ölçüler (metre) ---- */
const GOVDE = { a: 0.44, y0: 0.1, y1: 0.42, c: 0.72 };
const KABIN = { sedan: { a: 0.38, y1: 0.74, c0: -0.42, c1: 0.24 }, hatch: { a: 0.38, y1: 0.76, c0: -0.7, c1: 0.2 } };

function arabaDonusum(k) {
  const fx = Math.sin(k.yonG), fz = Math.cos(k.yonG);
  return { x: k.x + k.ox, y: k.oy0, z: k.z + k.oz, fx, fz, lx: -fz, lz: fx, k: k.olcek || 1 };
}
function arabaCiz(k, T) {
  const ar = k.ar, kb = KABIN[ar.kasa], cw = Math.max(1, pr([T.x, 0, T.z]).s * 0.012), renk = ar.renk;
  // Gelin süsü liderin arabasındadır; taç (çekirdeğin ad etiketi) ile aynı anda el değiştirir.
  const gelin = k === D.lider;
  // tekerlekler gövdenin içinde kalır, altından görünür; dönüşü jant çizgisiyle görünür
  for (const sa of [-1, 1])
    for (const sc of [-1, 1])
      kutuCiz(T, sa > 0 ? 0.3 : -0.42, sa > 0 ? 0.42 : -0.3, -T.y / T.k, 0.26 - T.y * 0.5, sc * 0.46 - 0.13, sc * 0.46 + 0.13, '#231b2c', cw);
  // gövde
  const gv = kutuCiz(T, -GOVDE.a, GOVDE.a, GOVDE.y0, GOVDE.y1, -GOVDE.c, GOVDE.c, renk, cw);
  if (gv.on) {
    // ızgara, farlar, plaka
    yuzCiz(T, [[-0.2, 0.2, GOVDE.c + 0.005], [0.2, 0.2, GOVDE.c + 0.005], [0.2, 0.32, GOVDE.c + 0.005], [-0.2, 0.32, GOVDE.c + 0.005]], '#3a2f45', cw * 0.8);
    const yaniyor = B >= k.far && B < k.far + 3 && ((B - k.far) * 2 % 1) < 0.55;
    for (const s of [-1, 1]) {
      const f = pr(yerelNokta(T, s * 0.31, 0.29, GOVDE.c + 0.01));
      if (yaniyor && f.ok) {
        c.globalAlpha = 0.35;
        daireCiz(f, 0.22, '#ffe9a8');
        c.globalAlpha = 1;
      }
      daireCiz(f, 0.075, yaniyor ? '#fff6c8' : '#f3dca0', cw);
    }
    const pl = yuzCiz(T, [[-0.14, 0.12, GOVDE.c + 0.01], [0.14, 0.12, GOVDE.c + 0.01], [0.14, 0.2, GOVDE.c + 0.01], [-0.14, 0.2, GOVDE.c + 0.01]], '#fbefdc', cw * 0.8);
    if (pl && pl[0].s > 70) {
      // plakada konvoydaki sıra numarası
      c.fillStyle = MUREKKEP;
      c.font = '700 ' + Math.round(pl[0].s * 0.07) + 'px Rubik, system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(gelin ? 'GELİN' : '34 K ' + (k.sn + 1), (pl[0].x + pl[2].x) / 2, (pl[0].y + pl[2].y) / 2 + 0.5);
      c.textBaseline = 'alphabetic';
    }
  }
  if (gv.arka)
    for (const s of [-1, 1])
      yuzCiz(T, [[s * 0.38, 0.28, -GOVDE.c - 0.005], [s * 0.24, 0.28, -GOVDE.c - 0.005], [s * 0.24, 0.35, -GOVDE.c - 0.005], [s * 0.38, 0.35, -GOVDE.c - 0.005]], '#e23d2f', cw * 0.6);
  // kabin ve camları
  const kv = kutuCiz(T, -kb.a, kb.a, GOVDE.y1, kb.y1, kb.c0, kb.c1, renk, cw);
  const cam = '#a8d8e8', camK = '#7fb8cf', ic = 0.05;
  if (kv.on)
    yuzCiz(T, [[-kb.a + ic, GOVDE.y1 + 0.03, kb.c1 + 0.005], [kb.a - ic, GOVDE.y1 + 0.03, kb.c1 + 0.005], [kb.a - ic, kb.y1 - 0.04, kb.c1 + 0.005], [-kb.a + ic, kb.y1 - 0.04, kb.c1 + 0.005]], cam, cw * 0.7);
  if (kv.arka)
    yuzCiz(T, [[-kb.a + ic, GOVDE.y1 + 0.04, kb.c0 - 0.005], [kb.a - ic, GOVDE.y1 + 0.04, kb.c0 - 0.005], [kb.a - ic, kb.y1 - 0.05, kb.c0 - 0.005], [-kb.a + ic, kb.y1 - 0.05, kb.c0 - 0.005]], camK, cw * 0.7);
  for (const [s, gor] of [[1, kv.sol], [-1, kv.sag]])
    if (gor)
      yuzCiz(T, [[s * (kb.a + 0.005), GOVDE.y1 + 0.04, kb.c0 + 0.06], [s * (kb.a + 0.005), GOVDE.y1 + 0.04, kb.c1 - 0.06], [s * (kb.a + 0.005), kb.y1 - 0.05, kb.c1 - 0.06], [s * (kb.a + 0.005), kb.y1 - 0.05, kb.c0 + 0.06]], camK, cw * 0.7);
  // anten ve ucundaki kurdele (vuruşla dalgalanır, geriye doğru uçar)
  const an0 = pr(yerelNokta(T, -0.32, GOVDE.y1, -0.6)), an1 = pr(yerelNokta(T, -0.32, 1.0, -0.62));
  if (an0.ok && an1.ok) {
    c.strokeStyle = MUREKKEP;
    c.lineWidth = Math.max(1, an0.s * 0.012);
    c.beginPath();
    c.moveTo(an0.x, an0.y);
    c.lineTo(an1.x, an1.y);
    c.stroke();
    const dal = Math.sin(TAU * B + ar.faz * 5), u1 = pr(yerelNokta(T, -0.32 + dal * 0.06, 0.96, -0.95)), u2 = pr(yerelNokta(T, -0.32 - dal * 0.05, 0.88, -0.9));
    if (u1.ok && u2.ok)
      cokgenCiz([an1, u1, u2], ar.kurdele, Math.max(1, an0.s * 0.008));
  }
  if (gelin)
    gelinSusu(k, T, kb, cw);
  // tavan penceresinden çıkan sürücü
  surucuCiz(k, T, kb, cw);
}
// Gelin arabası: kaputta kocaman kırmızı fiyonk, köşelerden tavana tül kurdeleler, ön camın dibinde çiçekler.
function gelinSusu(k, T, kb, cw) {
  // Lider yeni değiştiyse süs kaputta büyüyerek açılır (yaklaşık bir vuruş), tül ve çiçekler belirir.
  const ku = D.kurdeleUcus, u = ku && ku.kime === k ? clamp((B - ku.b0) / 1.1, 0, 1) : 1;
  const acil = u < 1 ? yumusak(u) * (1 + 0.45 * Math.sin(Math.PI * u)) : 1;
  c.globalAlpha = Math.min(1, u * 2);
  for (const s of [-1, 1]) {
    const a = pr(yerelNokta(T, s * 0.42, GOVDE.y1, GOVDE.c - 0.02)), b = pr(yerelNokta(T, s * kb.a, kb.y1, kb.c1)), o = pr(yerelNokta(T, s * 0.5, GOVDE.y1 + 0.16, (GOVDE.c + kb.c1) / 2));
    if (!a.ok || !b.ok || !o.ok)
      continue;
    for (const [renk, w] of [[MUREKKEP, 0.085], ['#fbefdc', 0.06], ['#e86a9a', 0.022]]) {
      c.strokeStyle = renk;
      c.lineWidth = w * a.s;
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.quadraticCurveTo(o.x, o.y, b.x, b.y);
      c.stroke();
    }
  }
  for (let i = 0; i < 5; i++) {
    const p = pr(yerelNokta(T, (i - 2) * 0.13, GOVDE.y1 + 0.04, kb.c1 + 0.06));
    daireCiz(p, 0.06, i % 2 ? '#e86a9a' : '#fbefdc', cw * 0.7);
    daireCiz(p, 0.022, '#ffd166');
  }
  c.globalAlpha = 1;
  fiyonkCiz(pr(yerelNokta(T, 0, GOVDE.y1 + 0.03, GOVDE.c - 0.16)), acil * T.k, Math.sin(TAU * B) * 0.06);
}
// Fiyonk: iki ilmek, düğüm ve iki kuyruk. p ekrandaki merkez, b büyüklük çarpanı, aci hafif sallanma.
function fiyonkCiz(p, b, aci) {
  if (!p.ok)
    return;
  const r = 0.2 * b * p.s;
  c.save();
  c.translate(p.x, p.y);
  c.rotate(aci);
  c.lineWidth = Math.max(1.5, p.s * 0.014);
  c.strokeStyle = MUREKKEP;
  c.fillStyle = '#c92a2a';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(s * r * 0.15, r * 0.1);
    c.lineTo(s * r * 0.35, r * 1.1);
    c.lineTo(s * r * 0.7, r * 0.95);
    c.closePath();
    c.fill();
    c.stroke();
  }
  c.fillStyle = '#e23d2f';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.ellipse(s * r * 0.62, -r * 0.05, r * 0.62, r * 0.38, s * -0.25, 0, TAU);
    c.fill();
    c.stroke();
  }
  c.fillStyle = '#ff7a6a';
  c.beginPath();
  c.arc(0, 0, r * 0.26, 0, TAU);
  c.fill();
  c.stroke();
  c.restore();
}
// Sürücü: tavan penceresinden göğsüne kadar çıkar, kameraya bakar, el sallar. Kornada iki elini kaldırır.
function surucuCiz(k, T, kb, cw) {
  const g = k.g, boy = clamp(g.boy, 0.98, 1.1), cc = (kb.c0 + kb.c1) / 2 + 0.04, ust = kb.y1;
  // tavan penceresi: koyu delik
  const delik = yuzCiz(T, [[-0.22, ust + 0.002, cc - 0.2], [0.22, ust + 0.002, cc - 0.2], [0.22, ust + 0.002, cc + 0.18], [-0.22, ust + 0.002, cc + 0.18]], '#1a1226', cw * 0.6);
  if (!delik)
    return;
  const korna = B >= k.korna && B < k.korna + KORNA_V, sevinc = korna || (B >= k.zip0 && B < k.zip1) || k.yildiz;
  const gogus = pr(yerelNokta(T, 0, ust + 0.02, cc)), omuz = pr(yerelNokta(T, 0, ust + 0.2 * boy, cc));
  const ph = pr(yerelNokta(T, 0, ust + (0.2 + KAFA_R * 0.95) * boy + 0.01 * Math.cos(TAU * B), cc + 0.02));
  // kollar: biri sallanır, öteki tavana dayanır; sevinçte ikisi de havada
  const sal = Math.sin(TAU * B + k.ar.faz * TAU);
  for (const s of [-1, 1]) {
    const omz = pr(yerelNokta(T, s * 0.15 * boy, ust + 0.17 * boy, cc));
    const sallayan = (s > 0) === k.ar.elSag;
    let el;
    if (sevinc)
      el = yerelNokta(T, s * (0.34 + 0.04 * sal) * boy, ust + (0.62 + 0.05 * Math.sin(TAU * B * 2 + s)) * boy, cc + 0.08);
    else if (sallayan)
      el = yerelNokta(T, s * (0.36 + 0.07 * sal) * boy, ust + (0.5 + 0.04 * Math.cos(TAU * B)) * boy, cc + 0.06);
    else
      el = yerelNokta(T, s * 0.3 * boy, ust + 0.03, cc + 0.16);
    const pe = pr(el);
    kapsulCiz(omz, 0.055 * boy, pe, 0.048 * boy, g.gomlek, cw);
    daireCiz(pe, 0.055 * boy, g.ten, cw);
  }
  kapsulCiz(gogus, 0.15 * boy, omuz, 0.165 * boy, g.yelek, cw);
  // büyüyen (drift atan) arabada baş da büyür
  kafaCiz(k, ph, T.k);
}

/* ---- kancalar ---- */
function oyunCiz() {
  yolKenariEkle();
  for (const k of D.oy.values()) {
    if (!k.ar)
      continue;
    const T = arabaDonusum(k), m = pr([T.x, 0.5, T.z]);
    if (!m.ok)
      continue;
    ozel(m.d, () => arabaCiz(k, T));
    // Adın yeri: başın tepesi (surucuCiz'deki baş merkezinin bir yarıçap üstü).
    const kb = KABIN[k.ar.kasa], boy = clamp(k.g.boy, 0.98, 1.1), cc = (kb.c0 + kb.c1) / 2 + 0.06;
    const ph = pr(yerelNokta(T, 0, kb.y1 + (0.2 + KAFA_R * 0.95) * boy, cc));
    if (ph.ok) {
      const et = k._et || (k._et = { x: 0, y: 0, s: 0, d: 0 });
      et.x = ph.x;
      et.y = ph.y - KAFA_R * boy * T.k * ph.s;
      et.s = ph.s;
      et.d = ph.d;
      // Ad sıralama kutusuna ve göstergeye girmesin: kadrajın üst kenarındaki arkadaki arabaların adı yazılmaz
      // (gelin arabası hariç). Drift atanın adını oyunUst büyük yazar.
      const yildiz = D.drift && D.drift.k === k;
      if (!yildiz && (et.y >= ETIKET_UST || k === D.lider))
        k.et = et;
    }
  }
}
const ETIKET_UST = 560;
// Listenin üstüne: korna yazıları, el değiştiren gelin süsünün ışık izi, drift atanın büyük adı.
function oyunUst() {
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (const k of D.oy.values()) {
    if (!k.ar || !(B >= k.korna && B < k.korna + KORNA_V))
      continue;
    const T = arabaDonusum(k), p = pr(yerelNokta(T, 0.5, 0.45, 0.6));
    if (!p.ok)
      continue;
    const u = (B - k.korna) / KORNA_V, olc = 0.8 + 0.35 * Math.sin(Math.min(1, u * 4) * HP), punto = Math.round(clamp(p.s * 0.2, 13, 26) * olc);
    c.globalAlpha = Math.min(1, (1 - u) * 3);
    c.font = punto + 'px "Paytone One", Rubik, system-ui, sans-serif';
    c.lineWidth = 4;
    c.strokeStyle = MUREKKEP;
    const x = p.x + (k.x + k.ox >= 0 ? 1 : -1) * p.s * 0.25, y = p.y - u * p.s * 0.3;
    c.strokeText('DÜT!', x, y);
    c.fillStyle = RENK.vurgu;
    c.fillText('DÜT!', x, y);
  }
  c.globalAlpha = 1;
  c.textBaseline = 'alphabetic';
  // Gelin süsü el değiştirince eski arabadan yenisine bir ışık izi akar (süs yeni arabada hemen açılır).
  const ku = D.kurdeleUcus;
  if (ku && ku.kime.ar) {
    const h2 = ku.kime, bas = B - ku.b0;
    for (let i = 0; i < 9; i++) {
      const t = clamp(bas / 0.9 - i * 0.07, 0, 1);
      if (t <= 0 || bas > 1.6)
        continue;
      const y = yumusak(t), p = pr([lerp(ku.x, h2.x + h2.ox, y), 0.6 + Math.sin(t * Math.PI) * 1.8, lerp(ku.z, h2.z + h2.oz + 0.5, y)]);
      if (!p.ok)
        continue;
      c.globalAlpha = (1 - i / 9) * clamp(2 - bas, 0, 1);
      c.fillStyle = i % 2 ? '#ffd166' : '#e23d2f';
      c.beginPath();
      c.arc(p.x, p.y, p.s * (0.13 - i * 0.01), 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
  }
  // Drift atanın adı: sahnenin yıldızı, büyük ve vurgu renginde. Arabanın önüne, yola yazılır: üstündeki öteki
  // adlar onu örtmesin.
  if (D.drift && D.drift.k.ar && D.drift.k.yer > 0.3) {
    const k = D.drift.k, T = arabaDonusum(k), kb = KABIN[k.ar.kasa], boy = clamp(k.g.boy, 0.98, 1.1);
    const p = pr([T.x, 0, T.z - GOVDE.c * T.k - 0.35]);
    if (p.ok) {
      c.font = '30px "Paytone One", Rubik, system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const w = Math.min(420, c.measureText(k.ad).width + 40), x = clamp(p.x, w / 2 + 8, GW - w / 2 - 8), y = Math.min(ALAN_ALT - 30, p.y + 24);
      c.fillStyle = RENK.vurgu;
      c.strokeStyle = MUREKKEP;
      c.lineWidth = 3;
      c.beginPath();
      c.roundRect(x - w / 2, y - 24, w, 48, 24);
      c.fill();
      c.stroke();
      c.fillStyle = MUREKKEP;
      c.fillText(k.ad, x, y + 1, w - 24);
      c.font = '20px "Paytone One", Rubik, system-ui, sans-serif';
      c.lineWidth = 4;
      c.strokeText('DRIFT ŞOV!', x, y - 36);
      c.fillStyle = RENK.sicak;
      c.fillText('DRIFT ŞOV!', x, y - 36);
      c.textBaseline = 'alphabetic';
    }
  }
}
