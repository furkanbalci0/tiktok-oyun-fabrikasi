/* HALAY HAREKETİ — 4 vuruşluk halay adımı, solo, el ele tutuşma, yerine koşma, çalgıcıların yeri ve duruşu.
 * ayakSag / ayakSol: halay adımı · iskelet(k): o anki poz → iskeletKur · kollar(k, onceki, sonraki): komşularla
 * el ele; halay başının boş eli mendil sallar · karakterHareket(k, dt): yerine koşma, çıkış, solo, yüzün yönü
 * calgicilariYerlestir(dt) · Kancalar: oyunGuncelle(dt), oyunKamera().
 */
const ADIM = 0.6; // adım değerleri uzun bacaklı ölçüdedir; kısa bacağa bu oranla küçültülür

// Halay adımı: 4 vuruşluk döngü. Sağa bas, sol ayağı çaprazla, sol tekme, sağ tekme.
function ayakSag(u, g) {
  if (u < 0.6) {
    const t = u / 0.6;
    return [lerp(-0.10, -0.30, t), 0, Math.sin(t * Math.PI) * 0.07];
  }
  if (u < 2)
    return [-0.30, 0, 0];
  if (u < 2.5) {
    const t = (u - 2) / 0.5;
    return [lerp(-0.30, -0.24, t), 0, Math.sin(t * Math.PI) * 0.04];
  }
  if (u < 3)
    return [-0.24, 0, 0];
  const t = u - 3, s = Math.sin(t * Math.PI);
  return [lerp(-0.24, -0.10, t), s * 0.2 * g, s * 0.16 * g];
}
function ayakSol(u, g) {
  if (u < 1)
    return [0.10, 0, 0];
  if (u < 1.6) {
    const t = (u - 1) / 0.6;
    return [lerp(0.10, -0.12, t), 0.04 * t, Math.sin(t * Math.PI) * 0.07];
  }
  if (u < 2)
    return [-0.12, 0.04, 0];
  if (u < 3) {
    const t = u - 2, s = Math.sin(t * Math.PI);
    return [lerp(-0.12, 0.02, t), 0.04 * (1 - t) + s * 0.3 * g, s * 0.22 * g];
  }
  if (u < 3.5)
    return [0.02, 0, 0];
  const t = (u - 3.5) / 0.5;
  return [lerp(0.02, 0.10, t), 0, Math.sin(t * Math.PI) * 0.03];
}

// Halaydaki birinin pozu: koşu ile halay adımı arasında yerine oturma oranıyla (k.yer) geçer.
// Ortak hareket (D.hareket: omuz / çök), solo ve hediye zıplaması bunun üstüne biner. Serbest el hedeflerini döndürür.
function halayPoz(k) {
  const g = k.g, b = B, cos = D.cosku, guc = 1 + cos * 0.6;
  const vurus = 0.5 + 0.5 * Math.cos(TAU * b);
  let egim = 0, zipla = 0, elR = null, elL = null;
  const y = k.yer, u = ((b % 4) + 4) % 4;
  // koşu
  const ph = k.kos * 7, ky = 1 - y;
  const ksS = [-0.11, Math.sin(ph) * 0.2, Math.max(0, Math.cos(ph)) * 0.16], ksL = [0.11, -Math.sin(ph) * 0.2, Math.max(0, -Math.cos(ph)) * 0.16];
  let hS = ayakSag(u, guc), hL = ayakSol(u, guc);
  let X = u < 2 ? -0.2 * yumusak(u / 2) : -0.2 * (1 - yumusak((u - 2) / 2));
  let cok = 0, omuz = cos * 0.01 * Math.sin(TAU * b * 2);
  const hr = D.hareket;
  if (hr && b >= hr.bas && b < hr.bas + hr.sure) {
    const hu = b - hr.bas;
    if (hr.tip === 'cok') {
      cok = 0.11 * Math.pow(Math.sin(Math.PI * hu / 2), 2);
    }
    else if (hr.tip === 'omuz') {
      omuz = 0.045 * Math.sin(TAU * hu * 2);
      egim -= 0.03;
    }
  }
  if (k.solo) {
    const su = b - (D.solo ? D.solo.bas : b), t2 = ((su % 2) + 2) % 2, sq = 0.05 + 0.04 * Math.sin(Math.PI * su);
    hS = t2 < 1 ? [-0.14, Math.sin(t2 * Math.PI) * 0.32, Math.sin(t2 * Math.PI) * 0.3] : [-0.14, 0, 0];
    hL = t2 >= 1 ? [0.14, Math.sin((t2 - 1) * Math.PI) * 0.32, Math.sin((t2 - 1) * Math.PI) * 0.3] : [0.14, 0, 0];
    X = 0;
    cok = Math.max(0, sq);
    const yuk = 0.48 + 0.04 * Math.sin(TAU * su);
    elR = [-0.3, yuk, 0.05];
    elL = [0.3, yuk - 0.08 * Math.sin(TAU * su), 0.05];
    omuz = 0.04 * Math.sin(TAU * su * 2);
  }
  if (b >= k.zip0 && b < k.zip1)
    zipla = 0.3 * Math.abs(Math.sin(Math.PI * (b - k.zip0)));
  const kc = 1 - cok * 5;
  const aS = [lerp(ksS[0], hS[0], y) * ADIM, lerp(ksS[1], hS[1] * kc, y) * ADIM, lerp(ksS[2], hS[2] * kc, y) * ADIM + zipla * 0.8];
  const aL = [lerp(ksL[0], hL[0], y) * ADIM, lerp(ksL[1], hL[1] * kc, y) * ADIM, lerp(ksL[2], hL[2] * kc, y) * ADIM + zipla * 0.8];
  const hipX = X * y * ADIM;
  const hipY = KALCA - (0.022 + cos * 0.02) * vurus * y - cok * y + zipla - ky * 0.02 * Math.abs(Math.sin(ph));
  egim += ky * 0.05;
  const yat = Math.sin(TAU * b / 2 + g.salin) * 0.016 * y;
  if (elR) {
    elR[1] += hipY;
    elL[1] += hipY;
  }
  else {
    elR = [-0.2 - ky * 0.04, hipY + 0.06, 0.04 + ky * Math.sin(ph) * 0.14];
    elL = [0.2 + ky * 0.04, hipY + 0.06, 0.04 - ky * Math.sin(ph) * 0.14];
  }
  return { poz: { hipX, hipY, egim, yat, omL: omuz, omR: -omuz, aS, aL }, elR, elL };
}
function iskelet(k) {
  const j = k.j, b = B;
  if (k.mod === 'oyuncu') {
    const h = halayPoz(k);
    iskeletKur(k, h.poz);
    k._elR = h.elR;
    k._elL = h.elL;
    return;
  }
  // çalgıcılar: bekleme pozu, çalgının üstüne eğilmiş
  const poz = pozBekle(k);
  poz.egim = k.mod === 'davulcu' ? -0.02 : -0.015 - calgi.perde * 0.004;
  const W = iskeletKur(k, poz), hipX = poz.hipX, hipY = poz.hipY, yat = poz.yat;
  if (k.mod === 'davulcu') {
    j.davul = W(0.01, hipY + 0.09, 0.22);
    j.davulL = W(0.17, hipY + 0.09, 0.22);
    j.davulR = W(-0.15, hipY + 0.09, 0.22);
    const kal = 1 - calgi.dumP, kal2 = 1 - calgi.tekP;
    j.haR = W(-0.27 - kal * 0.07, hipY + 0.12 + kal * 0.2, 0.2);
    j.haL = W(0.23, hipY + 0.3 + kal2 * 0.07, 0.24);
    j.tokmak = W(-0.17 - kal * 0.04, hipY + 0.1 + kal * 0.08, 0.22);
    j.cubuk = W(0.11, hipY + 0.2 + kal2 * 0.1, 0.32);
  }
  else {
    const kalk = 0.02 + calgi.perde * 0.012 + 0.025 * Math.sin(TAU * b / 2);
    j.agiz = W(hipX + yat * 5, hipY + KAFA_Y - 0.09, KAFA_R * 0.9);
    j.zurnaUc = W(hipX + yat * 5, hipY + 0.26 + kalk * 2.2, 0.62);
    j.haR = W(hipX - 0.03, hipY + 0.34 + kalk * 0.6, 0.33);
    j.haL = W(hipX + 0.03, hipY + 0.3 + kalk * 1.3, 0.45);
  }
}
function kollar(k, onceki, sonraki) {
  const j = k.j, W = k._W, bagli = a => a && a.yer > 0.9 && !a.solo && !a.cikiyor;
  if (k.mod === 'oyuncu') {
    const ben = bagli(k);
    // Herkes kameraya döndüğü için komşu, yayın neresinde durduğuna göre sağda ya da solda kalır.
    let solda = null, sagda = null;
    if (ben)
      for (const a of [onceki, sonraki]) {
        if (!bagli(a))
          continue;
        const yan = (a.x - k.x) * k.l[0] + (a.z - k.z) * k.l[2];
        if (yan >= 0 ? !solda : !!sagda)
          solda = solda || a;
        else
          sagda = a;
      }
    // İki komşu da aynı orta noktaya uzanır; eller orada buluşur.
    const orta = a => [(j.hip[0] + a.j.hip[0]) / 2, (j.hip[1] + a.j.hip[1]) / 2 + 0.04, (j.hip[2] + a.j.hip[2]) / 2];
    const eL = k._elL, eR = k._elR;
    k.bagL = !!solda;
    k.bagR = !!sagda;
    j.haL = solda ? orta(solda) : W(k._hipX + eL[0], eL[1], eL[2]);
    j.haR = sagda ? orta(sagda) : W(k._hipX + eR[0], eR[1], eR[2]);
    k.mendilEl = null;
    if (k === D.lider && ben && !D.mendilUcus) {
      const el = !sagda ? 'R' : !solda ? 'L' : null;
      if (el) {
        const s = el === 'R' ? -1 : 1, th = TAU * B;
        // El başın yanından yukarı uzanır; mendil yüzü kapatmasın.
        j['ha' + el] = W(k._hipX + s * (0.37 + 0.05 * Math.cos(th)), k._hipY + 0.5 + 0.06 * Math.sin(th), 0.05);
        k.mendilEl = el;
      }
    }
  }
  kolKur(k);
}

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
  // çıkan, halkadan yeterince uzaklaşınca silinsin (çekirdek k.gitti'ye bakar)
  if (k.cikiyor)
    k.gitti = Math.hypot(k.x, k.z) > D.R + 6;
}
// Çalgıcılar: bir avuç kişiyken dizinin iki yanında, kalabalıklaşınca yayın önünde, halka kapanınca tam ortada.
// Hiçbir durumda oynayanların yüzünü kapatmazlar; solo yapan onların önüne çıkar.
function calgicilariYerlestir(dt) {
  const zon = D.R * Math.cos(D.aci / 2), xe = D.R * Math.sin(Math.min(D.aci, Math.PI) / 2);
  const yan = 1 - basamak(0.9, 1.6, D.aci), kar = basamak(2.2, 3.4, D.aci);
  const calZ = lerp(lerp(zon - 1.35, 0.15, kar), zon - 0.25, yan);
  // Solo sırasında çalgıcılar iki yana açılır ki öne çıkan kişi onları kapatmasın.
  const aralik = lerp(D.solo ? 1.1 : 0.7, xe + 0.95, yan);
  D.calZ = calZ;
  D.calAralik = aralik;
  D.soloYer = [0, lerp(calZ - 1.15, zon - 1.3, yan)];
  for (const [m, s] of [[davulcu, -1], [zurnaci, 1]]) {
    const gez = muzik.sov && m === davulcu ? 0.5 : 0, hx = s * aralik + gez * Math.sin(B * TAU / 8) * 0.6, hz = calZ - gez * 0.5;
    m.x += (hx - m.x) * Math.min(1, dt * 3);
    m.z += (hz - m.z) * Math.min(1, dt * 3);
    const bak = Math.atan2(kam.C[0] - m.x, kam.C[2] - m.z) + s * 0.22 + (gez ? Math.sin(B * TAU / 4) * 0.3 : 0);
    m.yon += aciFark(m.yon, bak) * Math.min(1, dt * 6);
  }
}

let sonDt = 0.016; // oyunZemin meydanı aynı hızla büyütsün diye
function oyunGuncelle(dt) {
  sonDt = dt;
  D.R += (D.Rhedef - D.R) * Math.min(1, dt * 2.5);
  D.salinim = azHareket ? 0 : 0.09 * Math.sin(B * TAU / 16);
  if (D.hareket && B > D.hareket.bas + D.hareket.sure)
    D.hareket = null;
  // solo: sırası gelen 16 vuruş ortada tek başına oynar
  if (D.solo && (B > D.solo.bas + 16 || D.solo.k.cikiyor)) {
    const k = D.solo.k;
    k.solo = k.yildiz = k.guler = false;
    D.solo = null;
  }
  if (!D.solo && D.soloKuyruk.length) {
    const k = D.soloKuyruk.shift();
    if (!k.cikiyor) {
      k.solo = k.yildiz = k.guler = true;
      D.solo = { k, bas: Math.ceil(B) + 1 };
    }
  }
  if (D.mendilUcus && zaman - D.mendilUcus.t0 > D.mendilUcus.sure)
    D.mendilUcus = null;
  calgicilariYerlestir(dt);
  for (const k of D.oy.values())
    karakterHareket(k, dt);
  muzik.sov = B < D.sovBit;
  hediyeMuzikGuncelle();
  // eklemler: önce herkesin iskeleti, sonra komşulara uzanan kollar
  const hepsi = [...D.oy.values(), davulcu, zurnaci];
  for (const k of hepsi)
    iskelet(k);
  for (const k of hepsi) {
    const i = k.cikiyor ? -1 : k.sn, halayda = k.mod === 'oyuncu';
    kollar(k, halayda && i > 0 ? D.sira[i - 1] : null, halayda && i >= 0 ? D.sira[i + 1] : null);
  }
}
// Kadraja girmesi gerekenler: çalgıcılar, herkesin hedef yeri ve solo yeri.
function oyunKamera() {
  const calZ = D.calZ, n = [[D.calAralik + 0.3, calZ], [0, calZ - 0.2], [0, calZ + 0.2]];
  for (const k of D.sira)
    n.push([Math.sin(k.hedefAci) * D.Rhedef, Math.cos(k.hedefAci) * D.Rhedef]);
  if (D.solo)
    n.push(D.soloYer);
  return n;
}
