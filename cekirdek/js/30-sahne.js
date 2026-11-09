/* İSKELET — kamera, perspektif ve karakterlerin eklem konumları.
 * kam + kamKur + pr(): 3B noktayı 720×1280 sanal tuvale düşürür · ik(): iki kemikli ters kinematik (diz, dirsek)
 * ayakSag / ayakSol: 4 vuruşluk halay adımı · iskelet(k): bir karakterin o anki eklemleri (k.j)
 * kollar(k, onceki, sonraki): komşularla el ele tutuşma; halay başının boş eli mendil sallar
 * Eksenler: x sağ, y yukarı, z kameradan uzağa. Karakterin yerel ekseni: x = kendi solu, z = baktığı yön.
 * Karakterler iri başlı, kısa gövdelidir: baş boyun yarısını tutar ki kalabalıkta da yüzler okunsun.
 */
const tuval = $('tuval'), c = tuval.getContext('2d');
const GW = 720, GH = 1280, MUREKKEP = '#080a1c';
// Dar açılı, yüksekten bakan kamera: halkanın önündeki ile arkasındaki arasında boy farkı az kalır.
const kam = { yaw: 0, egim: 0.62, D: 14, tx: 0, ty: 0, tz: 0, F: 1400, cx: 360, cy: 760, C: [0, 0, 0], r: [1, 0, 0], u: [0, 1, 0], f: [0, 0, 1] };
// Gövde ölçüleri (karakterin boyuyla çarpılır)
const KALCA = 0.27, GOGUS = 0.2, KAFA_Y = 0.47, KAFA_R = 0.27, BACAK = 0.135, KOL = 0.16, ADIM = 0.6;
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
function pr(v) {
  const x = v[0] - kam.C[0], y = v[1] - kam.C[1], z = v[2] - kam.C[2];
  const d = x * kam.f[0] + y * kam.f[1] + z * kam.f[2];
  if (d < 0.35)
    return { x: 0, y: 0, s: 0, d, ok: false };
  const s = kam.F / d;
  return { x: kam.cx + (x * kam.r[0] + z * kam.r[2]) * s, y: kam.cy - (x * kam.u[0] + y * kam.u[1] + z * kam.u[2]) * s, s, d, ok: true };
}
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

// Halay adımı: 4 vuruşluk döngü. Sağa bas, sol ayağı çaprazla, sol tekme, sağ tekme.
// Değerler uzun bacaklı ölçüdedir; iskelet() kısa bacağa ADIM ile küçültür.
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

function iskelet(k, dt) {
  const g = k.g, boy = g.boy, j = k.j, b = B;
  const fx = Math.sin(k.yon), fz = Math.cos(k.yon), lx = -fz, lz = fx;
  k.f[0] = fx;
  k.f[2] = fz;
  k.l[0] = lx;
  k.l[2] = lz;
  const W = (a, y, cc) => [k.x + (a * lx + cc * fx) * boy, k.y0 + y * boy, k.z + (a * lz + cc * fz) * boy];
  const cos = D.cosku, guc = 1 + cos * 0.6;
  let hipX = 0, hipY = KALCA, egim = 0, yat = 0, omL = 0, omR = 0, zipla = 0;
  let aS = [-0.07, 0, 0], aL = [0.07, 0, 0];
  let elR = null, elL = null; // serbest el hedefleri (yerel)
  const vurus = 0.5 + 0.5 * Math.cos(TAU * b); // vuruş anında 1
  if (k.mod === 'halay') {
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
    aS = [lerp(ksS[0], hS[0], y) * ADIM, lerp(ksS[1], hS[1] * kc, y) * ADIM, lerp(ksS[2], hS[2] * kc, y) * ADIM + zipla * 0.8];
    aL = [lerp(ksL[0], hL[0], y) * ADIM, lerp(ksL[1], hL[1] * kc, y) * ADIM, lerp(ksL[2], hL[2] * kc, y) * ADIM + zipla * 0.8];
    hipX = X * y * ADIM;
    hipY = KALCA - (0.022 + cos * 0.02) * vurus * y - cok * y + zipla - ky * 0.02 * Math.abs(Math.sin(ph));
    omL = omuz;
    omR = -omuz;
    egim += ky * 0.05;
    yat = Math.sin(TAU * b / 2 + g.salin) * 0.016 * y;
    if (elR) {
      elR[1] += hipY;
      elL[1] += hipY;
    }
    else {
      elR = [-0.2 - ky * 0.04, hipY + 0.06, 0.04 + ky * Math.sin(ph) * 0.14];
      elL = [0.2 + ky * 0.04, hipY + 0.06, 0.04 - ky * Math.sin(ph) * 0.14];
    }
  }
  else {
    const t2 = ((b % 2) + 2) % 2;
    aS = [-0.08, 0, t2 < 1 ? Math.sin(t2 * Math.PI) * 0.045 : 0];
    aL = [0.08, 0, t2 >= 1 ? Math.sin((t2 - 1) * Math.PI) * 0.045 : 0];
    hipY = KALCA - 0.03 * vurus;
    yat = Math.sin(TAU * b / 4) * 0.02;
    if (k.mod === 'davulcu')
      egim = -0.02;
    else
      egim = -0.015 - calgi.perde * 0.004;
  }
  j.hip = W(hipX, hipY, 0);
  j.gogus = W(hipX + yat * 3, hipY + GOGUS, egim);
  j.kafa = W(hipX + yat * 5, hipY + KAFA_Y + 0.012 * vurus, egim * 1.4 + 0.01);
  j.omL = W(hipX + yat * 3 + 0.15, hipY + GOGUS + 0.01 + omL, egim);
  j.omR = W(hipX + yat * 3 - 0.15, hipY + GOGUS + 0.01 + omR, egim);
  j.kbL = W(hipX + 0.075, hipY - 0.02, 0);
  j.kbR = W(hipX - 0.075, hipY - 0.02, 0);
  j.ayL = W(aL[0], aL[2] + 0.04, aL[1]);
  j.ayR = W(aS[0], aS[2] + 0.04, aS[1]);
  const ileri = [fx, 0.15, fz];
  j.dzL = ik(j.kbL, j.ayL, BACAK * boy, BACAK * boy, ileri, j.dzL || [0, 0, 0]);
  j.dzR = ik(j.kbR, j.ayR, BACAK * boy, BACAK * boy, ileri, j.dzR || [0, 0, 0]);
  k._W = W;
  k._hipY = hipY;
  k._hipX = hipX;
  // çalgıcıların elleri
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
  else if (k.mod === 'zurnaci') {
    const kalk = 0.02 + calgi.perde * 0.012 + 0.025 * Math.sin(TAU * b / 2);
    j.agiz = W(hipX + yat * 5, hipY + KAFA_Y - 0.09, KAFA_R * 0.9);
    j.zurnaUc = W(hipX + yat * 5, hipY + 0.26 + kalk * 2.2, 0.62);
    j.haR = W(hipX - 0.03, hipY + 0.34 + kalk * 0.6, 0.33);
    j.haL = W(hipX + 0.03, hipY + 0.3 + kalk * 1.3, 0.45);
  }
  else {
    k._elR = elR;
    k._elL = elL;
  }
}
function kollar(k, onceki, sonraki) {
  const j = k.j, W = k._W, boy = k.g.boy, bagli = a => a && a.yer > 0.9 && !a.solo && !a.cikiyor;
  if (k.mod === 'halay') {
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
  const kutupR = [-k.f[0] * 0.6 - k.l[0] * 0.5, -0.7, -k.f[2] * 0.6 - k.l[2] * 0.5], kutupL = [-k.f[0] * 0.6 + k.l[0] * 0.5, -0.7, -k.f[2] * 0.6 + k.l[2] * 0.5];
  j.drR = ik(j.omR, j.haR, KOL * boy, KOL * boy, kutupR, j.drR || [0, 0, 0]);
  j.drL = ik(j.omL, j.haL, KOL * boy, KOL * boy, kutupL, j.drL || [0, 0, 0]);
}
