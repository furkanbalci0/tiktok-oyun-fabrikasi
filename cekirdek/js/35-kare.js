/* KARE DÖNGÜSÜ — her karede: müzik saatini oku, oyunu ilerlet, kamerayı ayarla, her şeyi çiz.
 * karakterHareket(k): yerine koşma, çıkış, solo · kare(): ana döngü (requestAnimationFrame)
 */
/* ---- her kare ---- */
function karakterHareket(k, dt) {
  let hx, hz, hedefYon;
  if (k.cikiyor) {
    const a = Math.atan2(k.x, k.z), r = D.R + 9;
    hx = Math.sin(a) * r;
    hz = Math.cos(a) * r;
  }
  else if (k.solo) {
    hx = D.soloYer[0];
    hz = D.soloYer[1];
  }
  else {
    const a = k.hedefAci + D.salinim;
    hx = Math.sin(a) * D.R;
    hz = Math.cos(a) * D.R;
  }
  const dx = hx - k.x, dz = hz - k.z, uz = Math.hypot(dx, dz);
  if (uz > 0.002) {
    const adim = Math.min(uz, (2.8 + uz * 1.6) * dt);
    k.x += dx / uz * adim;
    k.z += dz / uz * adim;
    if (uz > 0.15)
      k.kos += adim;
  }
  const yerinde = uz < 0.16 && !k.cikiyor;
  k.yer += ((yerinde ? 1 : 0) - k.yer) * Math.min(1, dt * 7);
  if (k.solo && yerinde)
    hedefYon = Math.atan2(-kam.f[0], -kam.f[2]) + (azHareket ? 0 : Math.floor((B - D.solo.bas) / 4) % 2 ? TAU * yumusak(((B - D.solo.bas) % 4) / 2) : 0);
  else {
    // Herkes kameraya döner ki yüzü görünsün. Koşan gittiği yöne, yerinde oynayan halkanın içine doğru hafifçe kırılır.
    const cx = kam.C[0] - k.x, cz = kam.C[2] - k.z, cl = Math.hypot(cx, cz) || 1, il = Math.hypot(k.x, k.z) || 1;
    if (uz > 0.3)
      hedefYon = Math.atan2(cx / cl + 0.55 * dx / uz, cz / cl + 0.55 * dz / uz);
    else
      hedefYon = Math.atan2(cx / cl - 0.3 * k.x / il, cz / cl - 0.3 * k.z / il);
  }
  k.yon += aciFark(k.yon, hedefYon) * Math.min(1, dt * (k.solo ? 14 : 9));
}
// Sahnenin oyuncular için ayrılan dikey şeridi (sanal 1280 satırda): üstü HUD, altı TikTok'un yorum alanı.
const ALAN_UST = 505, ALAN_ALT = 1006;
let sonKare = 0, kareSay = 0, kamCy = kam.cy;
function kare(simdiMs) {
  const olcBas = performance.now(), dt = Math.min(0.05, (simdiMs - sonKare) / 1000 || 0.016);
  sonKare = simdiMs;
  zaman += dt;
  kareSay++;
  // müzik saati
  muzik.cosku = D.cosku;
  muzik.sov = B < D.sovBit;
  const hedefCarpan = 1 + 0.3 * D.cosku + (muzik.sov ? 0.08 : 0);
  muzik.carpan += (hedefCarpan - muzik.carpan) * Math.min(1, dt * 1.5);
  muzik.planla(0.2);
  const mt = muzik.simdi();
  B = muzik.beatAt(mt);
  const ol = muzik.olaylar;
  while (ol.length && ol[0].t <= mt) {
    const e = ol.shift();
    if (e.tip === 'dum')
      calgi.dumP = 1;
    else if (e.tip === 'tek')
      calgi.tekP = 1;
    else
      calgi.hedefPerde = e.deg;
  }
  calgi.dumP *= Math.exp(-dt * 8);
  calgi.tekP *= Math.exp(-dt * 11);
  calgi.perde += ((calgi.hedefPerde ?? 3) - calgi.perde) * Math.min(1, dt * 10);
  // oyun
  D.cosku = Math.max(0, D.cosku - dt * 0.022);
  D.R += (D.Rhedef - D.R) * Math.min(1, dt * 2.5);
  D.salinim = azHareket ? 0 : 0.09 * Math.sin(B * TAU / 16);
  if (D.hareket && B > D.hareket.bas + D.hareket.sure)
    D.hareket = null;
  if (D.solo && (B > D.solo.bas + 16 || D.solo.k.cikiyor)) {
    D.solo.k.solo = false;
    D.solo = null;
  }
  if (!D.solo && D.soloKuyruk.length) {
    const k = D.soloKuyruk.shift();
    if (!k.cikiyor) {
      k.solo = true;
      D.solo = { k, bas: Math.ceil(B) + 1 };
    }
  }
  if (D.mendilUcus && zaman - D.mendilUcus.t0 > D.mendilUcus.sure)
    D.mendilUcus = null;
  if (kareSay % 45 === 0)
    for (const k of D.sira) {
      if (k === D.lider || k.solo)
        continue;
      if (zaman - k.son > (D.sira.length > 24 ? 75 : 240) + Math.min(600, k.jeton * 4)) {
        cikar(k);
        break;
      }
    }
  // çalgıcılar: bir avuç kişiyken dizinin iki yanında, kalabalıklaşınca yayın önünde, halka kapanınca tam ortada.
  // Hiçbir durumda oynayanların yüzünü kapatmazlar; solo yapan onların önüne çıkar.
  const zon = D.R * Math.cos(D.aci / 2), xe = D.R * Math.sin(Math.min(D.aci, Math.PI) / 2);
  const yan = 1 - basamak(0.9, 1.6, D.aci), kar = basamak(2.2, 3.4, D.aci);
  const calZ = lerp(lerp(zon - 1.35, 0.15, kar), zon - 0.25, yan);
  // Solo sırasında çalgıcılar iki yana açılır ki öne çıkan kişi onları kapatmasın.
  const aralik = lerp(D.solo ? 1.1 : 0.7, xe + 0.95, yan);
  D.soloYer = [0, lerp(calZ - 1.15, zon - 1.3, yan)];
  for (const [m, s] of [[davulcu, -1], [zurnaci, 1]]) {
    const gez = muzik.sov && m === davulcu ? 0.5 : 0, hx = s * aralik + gez * Math.sin(B * TAU / 8) * 0.6, hz = calZ - gez * 0.5;
    m.x += (hx - m.x) * Math.min(1, dt * 3);
    m.z += (hz - m.z) * Math.min(1, dt * 3);
    const bak = Math.atan2(kam.C[0] - m.x, kam.C[2] - m.z) + s * 0.22 + (gez ? Math.sin(B * TAU / 4) * 0.3 : 0);
    m.yon += aciFark(m.yon, bak) * Math.min(1, dt * 6);
  }
  for (const k of D.oy.values()) {
    karakterHareket(k, dt);
    if (k.cikiyor && (zaman - k.cikis > 1.7 || Math.hypot(k.x, k.z) > D.R + 6))
      D.oy.delete(k.id);
  }
  // kamera: halay, çalgıcılar ve solo yeri yayın alanına (HUD'ın altı, yorum alanının üstü) sığacak kadar uzaklaşır
  let mnZ = calZ - 0.2, mxZ = calZ + 0.2;
  const noktalar = [[aralik + 0.3, calZ]];
  const kutu = (x, z) => {
    noktalar.push([Math.abs(x), z]);
    if (z < mnZ)
      mnZ = z;
    if (z > mxZ)
      mxZ = z;
  };
  for (const k of D.sira)
    kutu(Math.sin(k.hedefAci) * D.Rhedef, Math.cos(k.hedefAci) * D.Rhedef);
  if (D.solo)
    kutu(D.soloYer[0], D.soloYer[1]);
  const hd = (mxZ - mnZ) / 2, zOrta = (mnZ + mxZ) / 2, se = Math.sin(kam.egim), ce = Math.cos(kam.egim), kk = Math.min(1, dt * 1.6);
  // Genişlik: kameraya yakın duran daha iri göründüğü için her nokta kendi derinliğiyle hesaba girer.
  let hD = kam.F / 190, ust = 0, alt = 0, enX = 0;
  for (const [x, z] of noktalar) {
    hD = Math.max(hD, (x + 0.55) * kam.F / 322 - (z - zOrta) * ce);
    enX = Math.max(enX, x);
  }
  // Meydanın ışığı ve kilim çevresi oynayanları ortalar: üç kişi de otuz altı kişi de ışığın içinde durur.
  D.meydanR += (Math.max(enX, hd) + 1.7 - D.meydanR) * kk;
  for (let i = 0; i < 5; i++) {
    // en arkadakinin adının üstü ve en öndekinin ayağı, hedef noktaya göre ekranda ne kadar yer tutuyor
    ust = (hd * se + 1.5 * ce) * kam.F / (hD + hd * ce);
    alt = (hd * se + 0.15) * kam.F / (hD - hd * ce);
    if (ust + alt <= ALAN_ALT - ALAN_UST)
      break;
    hD *= (ust + alt) / (ALAN_ALT - ALAN_UST);
  }
  const hCy = ALAN_UST + ust + (ALAN_ALT - ALAN_UST - ust - alt) / 2;
  kam.D += (hD - kam.D) * kk;
  kam.tz += ((mnZ + mxZ) / 2 - kam.tz) * kk;
  kam.tx += (0 - kam.tx) * kk;
  kamCy += (hCy - kamCy) * kk;
  kam.yaw = azHareket ? 0 : 0.035 * Math.sin(zaman * 0.21);
  D.sarsinti *= Math.exp(-dt * 5);
  kam.cx = 360 + (azHareket ? 0 : Math.sin(zaman * 60) * D.sarsinti * 6);
  kam.cy = kamCy + (azHareket ? 0 : Math.cos(zaman * 53) * D.sarsinti * 6);
  kamKur();
  // iskeletler
  const hepsi = [...D.oy.values(), davulcu, zurnaci];
  for (const k of hepsi)
    iskelet(k, dt);
  for (const k of hepsi) {
    const i = k.cikiyor ? -1 : k.sn;
    kollar(k, k.mod === 'halay' && i > 0 ? D.sira[i - 1] : null, k.mod === 'halay' && i >= 0 ? D.sira[i + 1] : null);
  }
  // çizim
  c.setTransform(tuval.width / GW, 0, 0, tuval.height / GH, 0, 0);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  zeminCiz();
  for (const k of hepsi) {
    const g = pr([k.x, 0, k.z]);
    if (!g.ok)
      continue;
    c.fillStyle = 'rgba(40,24,30,.34)';
    c.beginPath();
    c.ellipse(g.x, g.y, 0.25 * k.g.boy * g.s, 0.13 * k.g.boy * g.s, 0, 0, TAU);
    c.fill();
  }
  if (D.lider) {
    const g = pr([D.lider.x, 0, D.lider.z]);
    if (g.ok) {
      const n = 1 + 0.08 * Math.sin(B * TAU);
      c.strokeStyle = '#ffd166';
      c.lineWidth = Math.max(2, g.s * 0.03);
      c.beginPath();
      c.ellipse(g.x, g.y, 0.37 * g.s * n, 0.2 * g.s * n, 0, 0, TAU);
      c.stroke();
    }
  }
  if (D.solo && D.solo.k.yer > 0.5) {
    const g = pr([D.solo.k.x, 0, D.solo.k.z]);
    if (g.ok) {
      const gr = c.createLinearGradient(0, 0, 0, g.y);
      gr.addColorStop(0, 'rgba(255,209,102,0)');
      gr.addColorStop(1, 'rgba(255,209,102,.13)');
      c.fillStyle = gr;
      c.beginPath();
      c.moveTo(g.x - 30, 0);
      c.lineTo(g.x + 30, 0);
      c.lineTo(g.x + 0.7 * g.s, g.y);
      c.lineTo(g.x - 0.7 * g.s, g.y);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,209,102,.25)';
      c.beginPath();
      c.ellipse(g.x, g.y, 0.7 * g.s, 0.38 * g.s, 0, 0, TAU);
      c.fill();
    }
  }
  liste.length = 0;
  for (const k of hepsi)
    karakterEkle(k);
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
  // uçan mendil
  const mu = D.mendilUcus;
  if (mu) {
    const t = (zaman - mu.t0) / mu.sure, h = mu.kime.j.kafa || [0, 1.5, 0], p = pr([lerp(mu.x, h[0], t), lerp(mu.y, h[1] + 0.3, t) + Math.sin(t * Math.PI) * 1.8, lerp(mu.z, h[2], t)]);
    if (p.ok)
      mendilCiz(p.x, p.y, p.s * 1.2, t * 14, 1);
  }
  // ad etiketleri ve konuşma balonları
  const adlar = [davulcu, zurnaci].filter(k => k.p.kafa && k.p.kafa.ok);
  for (const k of D.oy.values())
    if (k.p.kafa && k.p.kafa.ok && !k.cikiyor)
      adlar.push(k);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  // Yer yetmeyince kimin adı kalır: halay başı, solo yapan, çalgıcılar, son konuşanlar, ilk beş, öndekiler.
  const onc = k => (k === D.lider ? 2000 : 0) + (k.solo ? 1500 : 0) + (k.mod !== 'halay' ? 900 : 0) + (zaman - k.son < 6 ? 600 - (zaman - k.son) * 20 : 0) + (k.mod === 'halay' && k.sn < 5 ? 200 - k.sn : 0) - k.p.kafa.d;
  const kutular = [], sirali = adlar.slice().sort((a, b) => onc(b) - onc(a));
  for (const k of sirali) {
    const ph = k.p.kafa, bas = k === D.lider, yeniMi = k.mod === 'halay' && zaman - k.yeni < 3;
    const punto = clamp(Math.round(ph.s * 0.17), 13, 18) + (bas ? 4 : 0), yk = punto + 9, tac = bas ? punto * 1.05 : 0;
    c.font = (bas ? '700 ' : '500 ') + punto + 'px Rubik, system-ui, sans-serif';
    if (k.adYazi !== k.ad + punto) {
      k.adYazi = k.ad + punto;
      k.adW = c.measureText(k.ad).width;
    }
    const w = k.adW + punto * 1.1 + tac, y0 = ph.y - KAFA_R * k.g.boy * ph.s - 5;
    const x = clamp(ph.x, w / 2 + 4, GW - w / 2 - 4);
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
    c.fillStyle = bas ? '#ffd166' : 'rgba(8,10,28,.78)';
    c.beginPath();
    c.roundRect(x - w / 2, y - yk, w, yk, yk / 2);
    c.fill();
    if (bas) {
      c.lineWidth = 2.5;
      c.strokeStyle = MUREKKEP;
      c.stroke();
      // taç: halay başının işareti
      const tx = x - w / 2 + punto * 0.5, ty = y - yk / 2, b = punto * 0.42;
      c.fillStyle = '#e23d2f';
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
    c.fillStyle = bas ? MUREKKEP : yeniMi ? '#5fe0d0' : k.mod !== 'halay' ? '#ffd166' : '#f6ecd9';
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
    const ph = k.p.kafa, al = Math.min(1, ya * 8, (3.4 - ya) * 4), by = (k.etY ?? ph.y - 60) - 12;
    c.font = '700 21px Rubik, system-ui, sans-serif';
    const w = Math.min(330, c.measureText(k.balon.m).width + 28), x = clamp(ph.x, w / 2 + 8, GW - w / 2 - 8);
    c.globalAlpha = al;
    c.fillStyle = '#ffd166';
    c.strokeStyle = MUREKKEP;
    c.lineWidth = 2.5;
    c.beginPath();
    c.roundRect(x - w / 2, by - 36, w, 36, 14);
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(ph.x - 8, by - 2);
    c.lineTo(ph.x, by + 9);
    c.lineTo(ph.x + 8, by - 2);
    c.stroke();
    c.fill();
    c.fillStyle = MUREKKEP;
    c.fillText(k.balon.m, x, by - 17, w - 18);
    c.globalAlpha = 1;
  }
  c.textBaseline = 'alphabetic';
  parcaCiz(dt);
  // kenar karartması
  if (!kare.vg) {
    kare.vg = c.createRadialGradient(GW / 2, GH * 0.58, GH * 0.32, GW / 2, GH * 0.58, GH * 0.74);
    kare.vg.addColorStop(0, 'rgba(8,10,28,0)');
    kare.vg.addColorStop(1, 'rgba(8,10,28,.5)');
  }
  c.fillStyle = kare.vg;
  c.fillRect(0, 0, GW, GH);
  if (D.siraKirli) {
    D.siraKirli = false;
    siraYaz();
  }
  if (kareSay % 6 === 0) {
    gunlukYaz();
    $('cosku-dolu').style.width = Math.round(D.cosku * 100) + '%';
    $('cosku-bilgi').textContent = muzik.calanAd() + '\n' + Math.round(muzik.calanBpm()) + ' vuruş/dk · ' + D.sira.length + ' kişi';
    const calan = muzik.hazirCal ? muzik.hz.no : -1;
    if (calan !== kare.parca) {
      kare.parca = calan;
      kare.kaynakYaz();
    }
    const secHava = (muzik.bekleyen || muzik.hava).id;
    if (secHava !== kare.hava) {
      kare.hava = secHava;
      for (const x of $('hava-sec').children)
        x.classList.toggle('secili', x.id === 'hava-' + secHava);
    }
  }
  D.kareMs = D.kareMs ? D.kareMs * 0.95 + (performance.now() - olcBas) * 0.05 : performance.now() - olcBas;
  requestAnimationFrame(kare);
}
