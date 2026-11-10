/* HAREKET — her kare: vuruş sırasını dağıtır, vuruşları ilerletir, televizyonun yaylarını çalıştırır,
 * herkesi yerine yürütüp pozunu kurar. Kamera noktaları da burada (oyunKamera).
 *
 * Vuruş zaman çizgisi (u: 0–1, vuruşla ölçülür): hazırlık → vuruş → değme (temas) → geri çekilme.
 * Değme anında: görüntü düzelir, televizyon o yönden ezilip esner, çarpma efekti, iz, toz; tekmede düğme fırlar.
 * Pozlar karakterin yerel ekseninde kurulur (a: sol +, y: yukarı, c: ileri; boyla çarpılır). Vurulacak nokta
 * dünyada bellidir; yerelYap() onu karakterin eksenine çevirir.
 */

/* ---- vuruş sırası ---- */
function kuledeMi(k) { return k && Math.hypot(k.x - KULE.x, k.z - KULE.z) < 0.3 && k.y0 > KULE.h * 0.8; }
function isDagit() {
  D.kuyruk = D.kuyruk.filter(e => D.oy.get(e.k.id) === e.k && !e.k.cikiyor);
  for (const ad of ['ist', 'kuleIs']) {
    const is = D[ad];
    if (is && (is.k.cikiyor || D.oy.get(is.k.id) !== is.k || (ad === 'kuleIs' && is.k !== D.lider)))
      isBitir(is);
  }
  if (!D.ist) {
    const i = D.kuyruk.findIndex(e => (e.k !== D.lider || e.tip === 'usta') && !e.k.is);
    if (i >= 0)
      D.ist = isYap(D.kuyruk.splice(i, 1)[0], 'ist');
  }
  if (!D.kuleIs && kuledeMi(D.lider) && !D.lider.is) {
    const i = D.kuyruk.findIndex(e => e.k === D.lider && e.tip !== 'usta');
    if (i >= 0)
      D.kuleIs = isYap(D.kuyruk.splice(i, 1)[0], 'kule');
  }
}
function isSure(tip, usta) { return VURUS[tip].sure * (usta ? 0.75 : 1) / (D.kuyruk.length > 3 ? 1.35 : 1); }
function isYap(e, yer) {
  const seq = e.tip === 'usta' ? USTA_SIRA.slice() : null, tip = seq ? seq[0] : e.tip;
  const is = { k: e.k, tip, adet: e.adet, yer, faz: yer === 'kule' ? 'vur' : 'git', b0: B, u: 0, sure: isSure(tip, !!seq), temas: false, seq, si: 0, iz: [] };
  e.k.is = is;
  if (seq) {
    D.usta = { k: e.k, b0: B };
    e.k.yildiz = true;
    D.sovBit = B + 28;
    pankart('Usta işi!', e.k.ad + ' televizyonu tamir ediyor');
  }
  return is;
}
function isBitir(is) {
  if (D.ist === is)
    D.ist = null;
  if (D.kuleIs === is)
    D.kuleIs = null;
  if (is.k.is === is)
    is.k.is = null;
  if (is.seq && D.usta && D.usta.k === is.k) {
    is.k.yildiz = false;
    D.usta = null;
  }
}
function isIlerle(is) {
  if (is.faz !== 'vur')
    return;
  const v = VURUS[is.tip];
  is.u = D.dondurU !== null ? D.dondurU : clamp((B - is.b0) / is.sure, 0, 1);
  if (!is.temas && is.u >= v.temas) {
    is.temas = true;
    temas(is);
  }
  if (is.u < 1 || D.dondurU !== null)
    return;
  if (is.seq && is.si < is.seq.length - 1) {
    is.tip = is.seq[++is.si];
    is.sure = isSure(is.tip, true);
  }
  else if (is.adet > 1)
    is.adet--;
  else
    return isBitir(is);
  is.b0 = B;
  is.u = 0;
  is.temas = false;
}

/* ---- değme anı ---- */
// Vuruş televizyona değdi: görüntü düzelir, televizyon ezilir, efekt ve iz çıkar.
function temas(is) {
  const v = VURUS[is.tip], k = is.k, kule = is.yer === 'kule';
  D.temasSay++;
  D.sonVuran = k.ad;
  netlikEkle(v.net);
  // Değen uzuv: elle vuruşta yakın el, tekmede yakın ayak (kulede sağ ayak, istasyonda sağ ayak).
  // Efekt vurulan noktada çıkar (uzvun o anki yeri değil: zaman çizgisi atlarsa uzuv henüz yoldadır).
  const yer = vurusHedef(is);
  if (kule && (is.tip === 'tokat' || is.tip === 'yumruk'))
    tvItki(1, v.guc, 'ust');
  else
    tvItki(kule ? 1 : -1, v.guc, 'yan');
  D.flas = Math.max(D.flas, 0.55);
  if (D.efekt.length > 7)
    D.efekt.shift();
  D.efekt.push({ p: yer, tip: is.tip, b0: B, sol: !kule });
  // Sol yan yüzde vuruşun izi: avuç, yumruk çukuru, ayakkabı tabanı. Sağ yan kameraya bakmaz, iz konmaz.
  if (!kule) {
    if (D.izler.length > 5)
      D.izler.shift();
    const yl = tvYerel(yer);
    D.izler.push({ z: clamp(yl[2], TV_ON + 0.12, TV_ARKA - 0.12), y: clamp(yl[1], TV_ALT + 0.12, TV_UST - 0.12), tip: is.tip, b0: B });
  }
  tozAt(yer, is.tip === 'ucan' ? 14 : is.tip === 'tekme' ? 9 : 5);
  if ((is.tip === 'tekme' || is.tip === 'ucan') && !D.dugme)
    dugmeFirlat(kule ? 1 : -1);
  if (is.tip === 'ucan' || is.seq) {
    D.sarsinti = Math.max(D.sarsinti, is.tip === 'ucan' ? 0.9 : 0.5);
    D.sovBit = Math.max(D.sovBit || 0, B + 8);
  }
  if (D.lider && D.lider !== k)
    D.kipirdamaB = Math.max(D.kipirdamaB, B - 6);
  // Usta işinin son vuruşu: görüntü bir anda tam net, ekranda gol.
  if (is.seq && is.si === is.seq.length - 1) {
    D.netlik = 1;
    gol(k.ad);
  }
}
// Televizyona itki: yon -1 soldan (sağa doğru iter), +1 sağdan. nereden: 'yan' ya da 'ust'.
function tvItki(yon, guc, nereden) {
  const t = D.tv;
  if (nereden === 'ust') {
    t.vT += guc * 11;
    t.vsh += yon * -guc * 0.15;
  }
  else if (yon < 0) {
    t.vL += guc * 11;
    t.vsh += guc * 0.5;
  }
  else {
    t.vR += guc * 11;
    t.vsh -= guc * 0.5;
  }
  if (guc > 1.5)
    t.vy += guc * 0.55;
  t.vant += (Math.random() < 0.5 ? -1 : 1) * guc * 2.2;
  t.vkule += guc * 0.9 * (yon < 0 ? 1 : -1);
}
// Yaylar: ezilme hızla açılır, birkaç kez esner, söner. Antenin yayı gevşek: uzun sallanır.
// Deneme anahtarı D.dondurU açıkken yay en çok ezildiği anda durur (yakın çekim değme anını yakalasın).
function tvGuncelle(dt) {
  const t = D.tv, n = Math.max(1, Math.ceil(dt / 0.01)), h = dt / n;
  if (D.dondurU === null)
    D.tvDurdu = false;
  else if (D.tvDurdu)
    return;
  for (let i = 0; i < n; i++) {
    t.vL += (-130 * t.sqL - 6 * t.vL) * h;
    t.sqL = clamp(t.sqL + t.vL * h, -0.8, 1.1);
    t.vR += (-130 * t.sqR - 6 * t.vR) * h;
    t.sqR = clamp(t.sqR + t.vR * h, -0.8, 1.1);
    t.vT += (-130 * t.sqT - 6 * t.vT) * h;
    t.sqT = clamp(t.sqT + t.vT * h, -0.8, 1.1);
    t.vsh += (-220 * t.sh - 7 * t.vsh) * h;
    t.sh = clamp(t.sh + t.vsh * h, -0.25, 0.25);
    t.vant += (-55 * t.ant - 2.2 * t.vant) * h;
    t.ant = clamp(t.ant + t.vant * h, -0.9, 0.9);
    t.vkule += (-70 * t.kule - 4 * t.vkule) * h;
    t.kule = clamp(t.kule + t.vkule * h, -0.6, 0.6);
    // zıplama: yerçekimi; inişte toz kalkar
    if (t.jy > 0 || t.vy > 0) {
      t.vy -= 9.8 * h;
      t.jy += t.vy * h;
      if (t.jy <= 0) {
        t.jy = 0;
        if (t.vy < -0.6)
          tozAt(tvDunya([0, TV_ALT, 0]), 8, true);
        t.vy = t.vy < -0.6 ? -t.vy * 0.28 : 0;
      }
    }
    if (D.dondurU !== null && t.sqL + t.sqR + t.sqT > 0.25 && t.vL + t.vR + t.vT <= 0) {
      D.tvDurdu = true;
      return;
    }
  }
}

/* ---- görüntü, sevinç ---- */
function goruntuGuncelle(dB, dt) {
  const tutuyor = kuledeMi(D.lider);
  if (!D.netSabit && !D.usta && !(D.gol && B - D.gol.b0 < 8))
    netlikEkle(-dB * (tutuyor ? 0.009 : 0.03));
  D.flas *= Math.exp(-dt * 5);
  const a = asamaHesap(D.netlik);
  if (a !== D.asama) {
    D.asamaYon = a > D.asama ? 1 : -1;
    D.asama = a;
    D.asamaB = B;
    if (D.asamaYon > 0)
      D.sevincB = Math.max(D.sevincB, B + 2);
    else
      D.uzuntuB = B + 2;
  }
  if (D.asama === 4 && D.netlik >= 0.97 && B - D.golB > 40)
    gol(D.sonVuran);
  if (D.gol && B - D.gol.b0 > 12)
    D.gol = null;
  muzik.sov = B < (D.sovBit || 0);
}

/* ---- toz, düğme, efektler ---- */
function tozAt(p, n, yerden) {
  for (let i = 0; i < n && D.toz.length < 60; i++) {
    const a = Math.random() * TAU, h = 0.2 + Math.random() * 0.5;
    D.toz.push({ x: p[0] + Math.cos(a) * 0.15, y: Math.max(0.05, p[1] + (Math.random() - 0.3) * 0.2), z: p[2] + Math.sin(a) * 0.15,
      vx: Math.cos(a) * h, vy: (yerden ? 0.15 : 0.35) + Math.random() * 0.4, vz: Math.sin(a) * h * 0.6, r: 0.025 + Math.random() * 0.04, t: 0, omur: 0.9 + Math.random() * 0.8 });
  }
  // Televizyonun üstündeki örtüden de toz kalkar.
  for (let i = 0; i < Math.ceil(n / 2) && D.toz.length < 60; i++) {
    const q = tvDunya([(Math.random() - 0.5) * 1.6, TV_UST + 0.04, (Math.random() - 0.5) * 0.6]);
    D.toz.push({ x: q[0], y: q[1], z: q[2], vx: (Math.random() - 0.5) * 0.3, vy: 0.3 + Math.random() * 0.3, vz: 0, r: 0.03 + Math.random() * 0.04, t: 0, omur: 1 + Math.random() * 0.8 });
  }
}
// Kanal düğmesi yerinden fırlar, yere düşüp seker; biraz sonra yerine geri takılır.
let dugmeSira = 0;
function dugmeFirlat(yon) {
  const hangi = dugmeSira++ % 2 ? 'ses' : 'kanal', yer = tvDunya([DUGME[hangi][0], DUGME[hangi][1], TV_ON - 0.04]);
  D.dugme = { hangi, x: yer[0], y: yer[1], z: yer[2], vx: (yon < 0 ? 1 : -1) * (0.6 + Math.random() * 0.5), vy: 2.6 + Math.random() * 0.8, vz: -1.6, rot: 0, vr: 16, b0: B, yerde: -1 };
}
function parcacikGuncelle(dt) {
  for (let i = D.toz.length - 1; i >= 0; i--) {
    const p = D.toz[i];
    p.t += dt;
    if (p.t > p.omur) {
      D.toz.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.vx *= Math.exp(-dt * 2.5);
    p.vz *= Math.exp(-dt * 2.5);
    p.vy *= Math.exp(-dt * 1.5);
  }
  while (D.efekt.length && B - D.efekt[0].b0 > 2.5)
    D.efekt.shift();
  while (D.izler.length && B - D.izler[0].b0 > 16)
    D.izler.shift();
  const d = D.dugme;
  if (d) {
    if (d.yerde < 0) {
      d.vy -= 9.8 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.z += d.vz * dt;
      d.rot += d.vr * dt;
      if (d.y < 0.06) {
        d.y = 0.06;
        if (d.vy < -1.2) {
          d.vy = -d.vy * 0.4;
          d.vx *= 0.6;
          d.vz *= 0.6;
          d.vr *= 0.6;
        }
        else
          d.yerde = B;
      }
    }
    else if (B - d.yerde > 6) {
      D.dugmeSonHangi = d.hangi;
      D.dugme = null;
      D.dugmeGeriB = B;
    }
  }
}

/* ---- kişiler ---- */
// Dünyadaki bir noktayı karakterin yerel eksenine çevirir: [a (sol +), y (yukarı), c (ileri)], boyla bölünmüş.
function yerelYap(k, yon, P) {
  const fx = Math.sin(yon), fz = Math.cos(yon), lx = -fz, lz = fx, dx = P[0] - k.x, dz = P[2] - k.z, b = k.g.boy;
  return [(dx * lx + dz * lz) / b, (P[1] - k.y0) / b, (dx * fx + dz * fz) / b];
}
const seg = (u, a, b) => clamp((u - a) / (b - a), 0, 1);
const l3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const bz3 = (a, m, b, t) => l3(l3(a, m, t), l3(m, b, t), t);
// Uzuv ucunu omuzdan / kalçadan en çok "boy × uzunluk × pay" uzağa bırakır (çok uzarsa lastik gibi görünür).
function erim(merkez, p, uz) {
  const dx = p[0] - merkez[0], dy = p[1] - merkez[1], dz = p[2] - merkez[2], d = Math.hypot(dx, dy, dz);
  if (d <= uz)
    return p;
  const r = uz / d;
  return [merkez[0] + dx * r, merkez[1] + dy * r, merkez[2] + dz * r];
}

function oyunGuncelle(dt) {
  const dB = Math.max(0, B - D.sonB);
  D.sonB = B;
  isDagit();
  if (D.ist)
    isIlerle(D.ist);
  if (D.kuleIs)
    isIlerle(D.kuleIs);
  goruntuGuncelle(dB, dt);
  tvGuncelle(dt);
  parcacikGuncelle(dt);
  for (const k of D.oy.values())
    kisiGuncelle(k, dt);
}

function kisiGuncelle(k, dt) {
  const is = k.is, ist = is && is.yer === 'ist', lider = k === D.lider && !k.cikiyor;
  // hedef yer
  let hx = k.hedefX, hz = k.hedefZ;
  if (k.cikiyor) {
    hx = (k.x >= 0.1 ? 1 : -1) * 4.2;
    hz = k.z;
  }
  else if (ist) {
    const kos = is.tip === 'ucan' && is.faz === 'git';
    hx = kos ? ISTASYON.kosX : ISTASYON.x;
    hz = kos ? ISTASYON.kosZ : ISTASYON.z;
  }
  const ucanVur = ist && is.faz === 'vur' && is.tip === 'ucan';
  const dx = hx - k.x, dz = hz - k.z, uz = Math.hypot(dx, dz);
  if (!ucanVur && uz > 0.002) {
    const adim = Math.min(uz, (2.2 + uz * 1.6) * dt);
    k.x += dx / uz * adim;
    k.z += dz / uz * adim;
    k.adim = (k.adim || 0) + adim;
  }
  if (ist && is.faz === 'git' && uz < 0.05) {
    is.faz = 'vur';
    is.b0 = B;
  }
  k.yer += ((uz < 0.16 && !k.cikiyor ? 1 : 0) - k.yer) * Math.min(1, dt * 7);
  if (k.cikiyor)
    k.gitti = Math.abs(k.x) > 4;
  // Yığına çıkma / inme
  const kulede = lider && Math.hypot(k.x - KULE.x, k.z - KULE.z) < 0.3 && !ist;
  k.y0 += ((kulede ? KULE.h : 0) - k.y0) * Math.min(1, dt * 7);
  // bakış
  let bak;
  if (ist && is.faz === 'vur')
    bak = ISTASYON.yon;
  else if (kulede)
    bak = KULE.yon;
  else if (uz > 0.25)
    bak = Math.atan2(dx / uz + (kam.C[0] - k.x) * 0.02, dz / uz - 0.3);
  else
    bak = Math.atan2(kam.C[0] - k.x, kam.C[2] - k.z) - (k.x - 0.1) * 0.16;
  k.yon += aciFark(k.yon, bak) * Math.min(1, dt * (is && is.faz === 'vur' ? 30 : 8));
  // poz
  k.el = null;
  if (is && is.faz === 'vur')
    return vurusPozu(k, is);
  const poz = pozBekle(k);
  if (uz > 0.2) {
    // yürüyüş: adım adım ayak kalkar
    const w = k.adim * 9;
    poz.aS[2] = Math.max(0, Math.sin(w)) * 0.09;
    poz.aL[2] = Math.max(0, -Math.sin(w)) * 0.09;
    poz.aS[1] = Math.sin(w) * 0.06;
    poz.aL[1] = -Math.sin(w) * 0.06;
    poz.egim = 0.06;
  }
  const sevinc = B < D.sevincB || (D.gol && B - D.gol.b0 < 6), uzgun = B < D.uzuntuB;
  const zip = B >= k.zip0 && B < k.zip1 ? 0.22 * Math.abs(Math.sin(Math.PI * (B - k.zip0))) : sevinc && !kulede ? 0.12 * Math.abs(Math.sin(Math.PI * B)) : 0;
  poz.hipY += zip;
  poz.aS[2] += zip * 0.8;
  poz.aL[2] += zip * 0.8;
  if (kulede) {
    // Yığın sarsılır, anteni tutan da onunla sallanır.
    poz.yat += D.tv.kule * 0.12;
    poz.egim += 0.04;
  }
  const W = iskeletKur(k, poz);
  if (kulede) {
    // sağ el antenin ucunda, sol el belde ("kıpırdama" duruşu)
    k.j.haR = W(-0.14, poz.hipY + 0.44 + 0.02 * Math.sin(TAU * B / 4), 0.28);
    k.j.haL = W(0.22, poz.hipY + 0.02, -0.04);
    D.antenUc = k.j.haR;
  }
  else if (sevinc) {
    const s = Math.sin(TAU * B) * 0.04;
    k.j.haR = W(-0.24, poz.hipY + 0.56 + s, 0.06);
    k.j.haL = W(0.24, poz.hipY + 0.56 - s, 0.06);
  }
  else if (uzgun) {
    k.j.haR = W(-0.15, poz.hipY + 0.52, 0.04);
    k.j.haL = W(0.15, poz.hipY + 0.52, 0.04);
  }
  else {
    const sal = Math.sin(TAU * B / 2 + k.g.salin * 6) * 0.03;
    k.j.haR = W(-0.21, poz.hipY + 0.07 + sal, 0.04);
    k.j.haL = W(0.21, poz.hipY + 0.07 - sal, 0.04);
  }
  kolKur(k);
}

/* ---- vuruş pozları ---- */
// Vurulacak nokta (dünya): istasyonda sol yan yüz, kulede sağ yanın üstü (el) ya da ortası (ayak).
function vurusHedef(is) {
  const ayakla = is.tip === 'tekme' || is.tip === 'ucan';
  return is.yer === 'kule' ? tvDunya([TV_W + 0.02, ayakla ? TV_ALT + 0.82 : TV_UST - 0.32, -0.3]) : tvDunya([-TV_W - 0.02, VURUS[is.tip].y, -0.1]);
}
// is.u boyunca: hazırlık (geri çekil, kur), vuruş (hızlanarak hedefe), değme (kısa bekleme), geri çekilme.
// el: yakın kol / bacak (istasyonda sağ, a < 0; kulede sol, a > 0). Hedef dünyada sabit, yerele çevrilir.
function vurusPozu(k, is) {
  const tip = is.tip, v = VURUS[tip], te = v.temas, u = is.u, kule = is.yer === 'kule';
  const el = kule ? 1 : -1, h = seg(u, 0, te * 0.62), s = seg(u, te * 0.62, te), g = seg(u, te + 0.12, 1);
  const hiz = s * s;
  // gövde dönüşü: hazırlıkta vuran kol geriye çekilirken gövde kameraya açılır (yüz görünsün), vuruşta öne döner
  const tw = u < te ? lerp(0, -el * 0.4, yumusak(h)) * (1 - hiz) + (-el * 0.1) * hiz : lerp(-el * 0.1, 0, yumusak(g));
  const yon0 = kule ? KULE.yon : ISTASYON.yon;
  k.yon = yon0 + tw * (tip === 'tekme' || tip === 'ucan' ? 0.6 : 1);
  const poz = pozBekle(k);
  poz.yat = 0;
  const hedefW = vurusHedef(is);
  if (tip === 'ucan' && !kule) {
    // Koşu, sıçrayış, iki ayakla değme, geri seken düşüş.
    const kos = seg(u, 0, 0.3), atla = seg(u, 0.3, 0.85), ini = seg(u, 0.85, 1);
    const yakin = [ISTASYON.x + (ISTASYON.x - ISTASYON.kosX) * -0.12 + 0.1, ISTASYON.z];
    if (u < 0.3) {
      k.x = lerp(ISTASYON.kosX, ISTASYON.x, yumusak(kos) * 0.7);
      k.z = lerp(ISTASYON.kosZ, ISTASYON.z, yumusak(kos) * 0.7);
    }
    else if (u < te) {
      const t = seg(u, 0.3, te);
      k.x = lerp(lerp(ISTASYON.kosX, ISTASYON.x, 0.7), yakin[0], t);
      k.z = lerp(lerp(ISTASYON.kosZ, ISTASYON.z, 0.7), yakin[1], t);
    }
    else {
      const t = yumusak(seg(u, te, 0.9));
      k.x = lerp(yakin[0], ISTASYON.x - 0.18, t);
      k.z = lerp(yakin[1], ISTASYON.z, t);
    }
    k.y0 = u >= 0.3 && u < 0.85 ? 0.46 * Math.sin(Math.PI * atla) : 0;
    const T = yerelYap(k, k.yon, hedefW);
    if (u < 0.3) {
      const w = kos * 9;
      poz.aS = [-0.08, Math.sin(w * Math.PI) * 0.1, Math.max(0, Math.sin(w * Math.PI)) * 0.12];
      poz.aL = [0.08, -Math.sin(w * Math.PI) * 0.1, Math.max(0, -Math.sin(w * Math.PI)) * 0.12];
      poz.egim = 0.14;
    }
    else if (u < 0.85) {
      // havada: geriye yatık, iki ayak öne uzanmış; değme anında yakın ayak hedefte
      const t = yumusak(seg(u, 0.3, te));
      poz.egim = lerp(0.05, -0.32, t);
      poz.hipY = KALCA + 0.02;
      const uc = [T[0], T[2], T[1] - 0.04];
      poz.aS = l3([-0.08, 0.02, 0.18], uc, t);
      poz.aL = l3([0.08, -0.02, 0.12], [uc[0] + 0.16, uc[1] - 0.05, uc[2] - 0.06], t);
    }
    else {
      poz.hipY = KALCA - 0.08 * Math.sin(Math.PI * ini);
      poz.egim = 0.12 * Math.sin(Math.PI * ini);
    }
    const W = iskeletKur(k, poz);
    poz.aS = sinirAyak(k, poz.aS, -1);
    poz.aL = sinirAyak(k, poz.aL, 1);
    iskeletKur(k, poz);
    const kol = u >= 0.3 && u < 0.85 ? 0.62 : 0.3;
    k.j.haR = W(-0.26, poz.hipY + kol, -0.12);
    k.j.haL = W(0.26, poz.hipY + kol, -0.1);
    kolKur(k);
    is.ucW = k.j.ayR;
    izKaydet(k, is, k.j.ayR, u > 0.4 && u < te + 0.05);
    return;
  }
  const T = yerelYap(k, k.yon, hedefW);
  const omuz = [el * 0.15, poz.hipY + GOGUS, 0];
  const REST = [el * 0.21, poz.hipY + 0.07, 0.04], DIGER = [-el * 0.21, poz.hipY + 0.07, 0.04];
  let el1 = REST, el2 = DIGER;
  if (tip === 'tokat') {
    // açık avuç, geniş yay: kol arkaya ve yukarı kurulur, yandan savrulur
    const KUR = [el * 0.4, poz.hipY + 0.62, -0.14], ORTA = [el * 0.16, poz.hipY + 0.66, 0.3], SON = [-el * 0.04, poz.hipY + 0.3, 0.28];
    if (u < te * 0.62)
      el1 = l3(REST, KUR, yumusak(h));
    else if (u < te)
      el1 = bz3(KUR, ORTA, T, hiz);
    else if (u < te + 0.12)
      el1 = l3(T, [T[0] - el * 0.05, T[1] - 0.04, T[2] - 0.02], seg(u, te, te + 0.12));
    else
      el1 = bz3([T[0] - el * 0.05, T[1] - 0.04, T[2] - 0.02], SON, REST, yumusak(g));
    el2 = [-el * 0.2, poz.hipY + 0.2, 0.12];
    poz.egim = u < te ? lerp(-0.06, 0.1, hiz) : lerp(0.1, 0, yumusak(g));
    if (u > te * 0.3 && u < te + 0.2)
      k.el = { tip: 'avuc', yan: el };
  }
  else if (tip === 'yumruk') {
    // kol göğse çekilir, öteki el yüzü korur; vücut öne atılır, kol dümdüz hedefe
    const KUR = [el * 0.16, poz.hipY + 0.42, -0.22];
    if (u < te * 0.62)
      el1 = l3(REST, KUR, yumusak(h));
    else if (u < te)
      el1 = l3(KUR, T, hiz);
    else if (u < te + 0.12)
      el1 = T;
    else
      el1 = l3(T, REST, yumusak(g));
    el2 = [-el * 0.09, poz.hipY + 0.5, 0.16];
    poz.egim = u < te ? lerp(-0.08, 0.17, hiz) - 0.06 * yumusak(h) * (1 - hiz) : lerp(0.17, 0, yumusak(g));
    poz.hipY -= 0.03 * yumusak(h) * (1 - g);
    const ileri = u < te ? hiz : 1 - yumusak(g);
    poz.aS = [-0.08, 0.03 + 0.08 * ileri, 0];
    poz.aL = [0.08, -0.05, 0];
    if (u < 0.92)
      k.el = { tip: 'yumruk', yan: el };
  }
  else {
    // tekme: diz karna çekilir, gövde geriye yatar, bacak hedefe açılır; kollar dengede
    const ayak = el < 0 ? 'aS' : 'aL', diger = el < 0 ? 'aL' : 'aS';
    const KUR = [el * 0.07, 0.06, 0.2], UC = [T[0], T[2], T[1] - 0.04], DUR = [el * 0.08, 0, 0];
    let a = DUR;
    if (u < te * 0.62)
      a = l3(DUR, KUR, yumusak(h));
    else if (u < te)
      a = l3(KUR, UC, hiz);
    else if (u < te + 0.12)
      a = UC;
    else
      a = l3(UC, DUR, yumusak(g));
    poz[ayak] = a;
    poz[diger] = [-el * 0.08, -0.04, 0];
    poz.egim = u < te ? lerp(-0.1 * yumusak(h), -0.22, hiz) : lerp(-0.22, 0, yumusak(g));
    poz.hipY += (u < te ? 0.05 * hiz : 0.05 * (1 - yumusak(g)));
    iskeletKur(k, poz);
    poz[ayak] = sinirAyak(k, poz[ayak], el);
    el1 = [el * 0.3, poz.hipY + 0.42, -0.08];
    el2 = [-el * 0.3, poz.hipY + 0.46, 0.02];
    if (kule) {
      // kulede öteki el antende kalır
      el2 = null;
    }
  }
  const W = iskeletKur(k, poz);
  const yakin = el < 0 ? 'haR' : 'haL', uzak = el < 0 ? 'haL' : 'haR';
  // Kol en çok 1,2 kat uzar: omuzdan erime sınır (değme anında hafif "lastik" uzama vuruşu satar).
  k.j[yakin] = erim(W(omuz[0], omuz[1], omuz[2]), W(el1[0], el1[1], el1[2]), KOL * 2 * k.g.boy * 1.22);
  if (kule) {
    k.j.haR = W(-0.14, poz.hipY + 0.44, 0.28);
    D.antenUc = k.j.haR;
    if (tip !== 'tekme' && tip !== 'ucan')
      k.j[yakin] = erim(W(omuz[0], omuz[1], omuz[2]), W(el1[0], el1[1], el1[2]), KOL * 2 * k.g.boy * 1.3);
    else
      k.j.haL = W(0.26, poz.hipY + 0.42, -0.06);
  }
  else
    k.j[uzak] = el2 ? W(el2[0], el2[1], el2[2]) : k.j[uzak];
  kolKur(k);
  const uc = tip === 'tekme' ? (el < 0 ? k.j.ayR : k.j.ayL) : k.j[yakin];
  izKaydet(k, is, uc, u > te * 0.55 && u < te + 0.06);
}
// Ayağı kalçadan bacak boyunun biraz ötesine bırakır.
function sinirAyak(k, a, yan) {
  const kb = [yan * 0.075 + 0, k._hipY - 0.02, 0], p = [a[0], a[2] + 0.04, a[1]];
  const q = erim(kb, p, BACAK * 2 * 1.12);
  return [q[0], q[2], q[1] - 0.04];
}
// Vuran uzvun son birkaç ekran olmayan dünya noktası: hız izi için.
function izKaydet(k, is, p, acik) {
  if (!acik || !p) {
    if (is.iz.length)
      is.iz.shift();
    return;
  }
  is.iz.push(p.slice());
  if (is.iz.length > 7)
    is.iz.shift();
}

/* ---- kamera ---- */
// Kadraja girmesi gerekenler: televizyon (anteni ve sehpasıyla), vuruş yeri, yığın ve dolu yerler.
// Çekirdek her noktaya 0,55 m pay ekler; televizyonun kenarları için bu pay düşülerek verilir.
function oyunKamera() {
  const n = [[ISTASYON.x - 0.1, ISTASYON.z], [KULE.x, KULE.z], [0, TVZ + 0.62], [0, TVZ - 0.5]];
  // uçan tekmenin koşu yeri: koşu boyunca kamera biraz açılır
  if (D.ist && D.ist.tip === 'ucan')
    n.push([ISTASYON.kosX + 0.2, ISTASYON.kosZ]);
  for (const k of D.sira)
    if (k !== D.lider)
      n.push([k.hedefX, k.hedefZ]);
  return n;
}
