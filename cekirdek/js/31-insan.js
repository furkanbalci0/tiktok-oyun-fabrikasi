/* İNSAN TAKIMI — iri başlı, kısa gövdeli "chibi" insan: eklemler, kollar, bekleme pozu, gövde ve baş çizimi.
 * Oyun izleyicileri insan olarak çizecekse bunları kullanır; başka bir şey çizecekse hiç çağırmaz.
 * iskeletKur(k, poz): pozdan eklemleri (k.j) kurar · kolKur(k): iki kolu ellere (j.haL / j.haR) uzatır
 * pozBekle(k): vuruşla sallanan bekleme pozu · insanEkle(k): gövde + baş çizim listesine; k.et kurulur
 * kafaCiz(k, ph): yalnız baş (yüz, saç, yazma, kasket; baş döndükçe yüz hatları kayar)
 * Baş boyun yarısını tutar ki kalabalıkta da yüzler okunsun.
 */
// Gövde ölçüleri (karakterin boyuyla, k.g.boy, çarpılır; metre)
const KALCA = 0.27, GOGUS = 0.2, KAFA_Y = 0.47, KAFA_R = 0.27, BACAK = 0.135, KOL = 0.16;

// poz: { hipX, hipY, egim, yat, omL, omR, aS, aL }
//   hipX: kalçanın yana kayması · hipY: kalça yüksekliği (KALCA ayakta durur; zıplayınca artar, çökünce azalır)
//   egim: öne (+) / arkaya (−) eğilme · yat: yana yatma · omL / omR: omuzların kalkması
//   aS / aL: sağ ve sol ayak [yana, ileri, yukarı] (karakterin yerel ekseninde, metre)
// Karakterin yerinden (k.x, k.z, k.y0) ve yönünden (k.yon) eklemleri kurar. Bırakır: k._W(yana, yukarı, ileri)
// yerel → dünya çevirici, k._hipX, k._hipY. Ellerin yerini (j.haL, j.haR) çağıran koyar, sonra kolKur(k).
function iskeletKur(k, poz) {
  const g = k.g, boy = g.boy, j = k.j;
  const fx = Math.sin(k.yon), fz = Math.cos(k.yon), lx = -fz, lz = fx;
  k.f[0] = fx;
  k.f[2] = fz;
  k.l[0] = lx;
  k.l[2] = lz;
  const W = (a, y, cc) => [k.x + (a * lx + cc * fx) * boy, k.y0 + y * boy, k.z + (a * lz + cc * fz) * boy];
  const hipX = poz.hipX, hipY = poz.hipY, egim = poz.egim, yat = poz.yat, aS = poz.aS, aL = poz.aL;
  const vurus = 0.5 + 0.5 * Math.cos(TAU * B); // vuruş anında 1
  j.hip = W(hipX, hipY, 0);
  j.gogus = W(hipX + yat * 3, hipY + GOGUS, egim);
  j.kafa = W(hipX + yat * 5, hipY + KAFA_Y + 0.012 * vurus, egim * 1.4 + 0.01);
  j.omL = W(hipX + yat * 3 + 0.15, hipY + GOGUS + 0.01 + poz.omL, egim);
  j.omR = W(hipX + yat * 3 - 0.15, hipY + GOGUS + 0.01 + poz.omR, egim);
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
  return W;
}
// Omuzdan ele iki kol: dirsekler aşağı ve geriye bükülür. k.kolBoy (isteğe bağlı, öntanım 1): kol kemiklerinin
// çarpanı; uzağa uzanan, tavana tutunan, kucaklayan kol için 1,3–1,6. Kemikten uzaktaki el yine kola bağlı çizilir
// ama dirsek düzleşir; kolBoy eli o uzaklığa dirsek bükülü yetiştirir.
function kolKur(k) {
  const j = k.j, boy = k.g.boy, kl = k.kolBoy === undefined ? KOL * boy : KOL * boy * k.kolBoy;
  const kutupR = [-k.f[0] * 0.6 - k.l[0] * 0.5, -0.7, -k.f[2] * 0.6 - k.l[2] * 0.5], kutupL = [-k.f[0] * 0.6 + k.l[0] * 0.5, -0.7, -k.f[2] * 0.6 + k.l[2] * 0.5];
  j.drR = ik(j.omR, j.haR, kl, kl, kutupR, j.drR || [0, 0, 0]);
  j.drL = ik(j.omL, j.haL, kl, kl, kutupL, j.drL || [0, 0, 0]);
}
// Oturma pozu. oturakY: oturağın üst yüzünün k.y0'dan yüksekliği (metre; verilmezse 0,2 × boy, alçak tabure).
// Kalça oturağa konar, dizler öne çıkar. Oturak bacaktan alçaksa ayaklar yerde ve dizler kalkık; yüksekse
// (sedir, bar taburesi) ayaklar sarkar ve vuruşla sırayla sallanır. Gövde vuruşla hafifçe öne arkaya oynar.
// pozBekle gibi döner; ayrıca dizR / dizL: elleri dizlere koymak için yerel nokta [yana, yukarı, ileri].
//   const poz = pozOtur(k, 0.42), W = iskeletKur(k, poz);
//   k.j.haR = W(...poz.dizR); k.j.haL = W(...poz.dizL); kolKur(k);
function pozOtur(k, oturakY) {
  const boy = k.g.boy, vurus = 0.5 + 0.5 * Math.cos(TAU * B);
  const hipY = (oturakY === undefined ? 0.2 * boy : oturakY) / boy + 0.06, dy = hipY - 0.06;
  // ayak bileği kalçadan en çok 0,22 uzakta: diz hep bükülü kalır (bacak toplamı 0,27)
  const ayakY = Math.max(0, dy - 0.2), sarkik = ayakY > 0, yer = Math.sqrt(Math.max(0, 0.0484 - (dy - ayakY) * (dy - ayakY)));
  const sal = sarkik && !azHareket ? Math.sin(TAU * B / 2 + k.g.salin * 5) * 0.035 : 0;
  return {
    hipX: 0, hipY, egim: -0.03 + 0.035 * vurus, yat: azHareket ? 0 : Math.sin(TAU * B / 4) * 0.01, omL: 0, omR: 0,
    aS: [-0.085, yer + sal, ayakY], aL: [0.085, yer - sal, ayakY],
    dizR: [-0.1, hipY + 0.03, 0.14], dizL: [0.1, hipY + 0.03, 0.14]
  };
}
// Bekleme pozu: her vuruşta hafifçe çöker, iki vuruşta bir sırayla ayak kaldırır, dört vuruşta bir yana salınır.
// Dönen nesne değiştirilebilir (ör. egim, zıplama için hipY ve ayak yüksekliği).
function pozBekle(k) {
  const t2 = ((B % 2) + 2) % 2, vurus = 0.5 + 0.5 * Math.cos(TAU * B);
  return {
    hipX: 0, hipY: KALCA - 0.03 * vurus, egim: 0, yat: Math.sin(TAU * B / 4) * 0.02, omL: 0, omR: 0,
    aS: [-0.08, 0, t2 < 1 ? Math.sin(t2 * Math.PI) * 0.045 : 0], aL: [0.08, 0, t2 >= 1 ? Math.sin((t2 - 1) * Math.PI) * 0.045 : 0]
  };
}

const SERIT = ['#f2b632', '#e23d2f', '#3d5bd0', '#f6ecd9', '#22b8a7'];
// Eklemlerden gövde ve başı çizim listesine ekler. Ekrana düşmüş eklemler k.p'ye yazılır (oyun kendi
// eklemlerini — ör. çalgı — k.j'ye koyduysa onlar da k.p'de bulunur). Çizildiyse true döner ve k.et kurulur.
function insanEkle(k) {
  const j = k.j, g = k.g, p = k.p, boy = g.boy;
  k.et = null;
  for (const n in j)
    p[n] = pr(j[n]);
  if (!p.hip.ok || !p.kafa.ok)
    return false;
  const bacak = g.kadin ? '#3a2a3c' : g.alt;
  for (const y of ['L', 'R']) {
    const kb = p['kb' + y], dz = p['dz' + y], ay = p['ay' + y];
    kap(kb, 0.078 * boy, dz, 0.068 * boy, bacak);
    kap(dz, 0.066 * boy, ay, 0.056 * boy, bacak);
    const a3 = j['ay' + y], uc = pr([a3[0] + k.f[0] * 0.075 * boy, a3[1] - 0.01, a3[2] + k.f[2] * 0.075 * boy]);
    kap(ay, 0.06 * boy, uc, 0.054 * boy, g.ayakkabi, (ay.d + uc.d) / 2 - 0.01);
  }
  const dzOrta = [(j.dzL[0] + j.dzR[0]) / 2, (j.dzL[1] + j.dzR[1]) / 2, (j.dzL[2] + j.dzR[2]) / 2];
  const enYakin = Math.min(p.kbL.d, p.kbR.d, p.dzL.d, p.dzR.d);
  if (g.kadin) {
    const etek = pr([dzOrta[0], dzOrta[1] - 0.035 * boy, dzOrta[2]]);
    kap(p.hip, 0.155 * boy, etek, 0.215 * boy, g.alt, enYakin - 0.03);
    // önlük: öndeki şeritli kumaş
    const o1 = pr([j.hip[0] + k.f[0] * 0.13 * boy, j.hip[1] + 0.01 * boy, j.hip[2] + k.f[2] * 0.13 * boy]), o2 = pr([dzOrta[0] + k.f[0] * 0.17 * boy, dzOrta[1] - 0.02 * boy, dzOrta[2] + k.f[2] * 0.17 * boy]);
    const od = (o1.d + o2.d) / 2 - 0.12;
    kap(o1, 0.075 * boy, o2, 0.115 * boy, g.onluk, od);
    if (o1.ok && o2.ok)
      ozel(od - 0.01, () => {
        const dx = o2.x - o1.x, dy = o2.y - o1.y, uz = Math.hypot(dx, dy) || 1, nx = -dy / uz, ny = dx / uz, r1 = 0.075 * boy * o1.s, r2 = 0.115 * boy * o2.s;
        c.lineWidth = r2 * 0.3;
        let i = SERIT.indexOf(g.onluk) + 1;
        for (const t of [-0.56, 0, 0.56]) {
          c.strokeStyle = SERIT[i++ % SERIT.length];
          c.beginPath();
          c.moveTo(o1.x + nx * t * r1, o1.y + ny * t * r1);
          c.lineTo(o2.x + nx * t * r2 + dx / uz * r2 * 0.55, o2.y + ny * t * r2 + dy / uz * r2 * 0.55);
          c.stroke();
        }
      });
  }
  else {
    const ag = pr([dzOrta[0], dzOrta[1] + 0.045 * boy, dzOrta[2]]);
    kap(p.hip, 0.145 * boy, ag, 0.115 * boy, g.alt, enYakin - 0.02);
  }
  kap(p.hip, 0.148 * boy, p.gogus, 0.168 * boy, g.yelek, p.gogus.d - 0.01);
  if (!g.kadin) {
    const s1 = pr([j.gogus[0] + k.f[0] * 0.12 * boy, j.gogus[1] + 0.02 * boy, j.gogus[2] + k.f[2] * 0.12 * boy]), s2 = pr([j.hip[0] + k.f[0] * 0.105 * boy, j.hip[1] + 0.075 * boy, j.hip[2] + k.f[2] * 0.105 * boy]);
    kap(s1, 0.07 * boy, s2, 0.055 * boy, g.gomlek, (s1.d + s2.d) / 2 - 0.02);
  }
  const b1 = pr([j.hip[0] + k.l[0] * 0.1 * boy, j.hip[1] + 0.055 * boy, j.hip[2] + k.l[2] * 0.1 * boy]), b2 = pr([j.hip[0] - k.l[0] * 0.1 * boy, j.hip[1] + 0.055 * boy, j.hip[2] - k.l[2] * 0.1 * boy]);
  kap(b1, 0.07 * boy, b2, 0.07 * boy, g.kusak, Math.min(b1.d, b2.d) - 0.06);
  for (const y of ['L', 'R']) {
    const om = p['om' + y], dr = p['dr' + y], ha = p['ha' + y];
    kap(om, 0.056 * boy, dr, 0.05 * boy, g.gomlek);
    kap(dr, 0.05 * boy, ha, 0.046 * boy, g.gomlek);
    const sekil = k.elSekil && k.elSekil[y];
    if (ha.ok && (sekil === 'avuc' || sekil === 'yumruk')) {
      const gg = p.gogus;
      ozel(ha.d - 0.02, () => elSekilCiz(k, ha, dr, sekil, gg));
    }
    else if (ha.ok)
      liste.push({ d: ha.d - 0.02, t: 2, x: ha.x, y: ha.y, r: 0.055 * boy * ha.s, c: g.ten, w: Math.max(1, ha.s * 0.011) });
  }
  const ph = p.kafa, bo = k.basOlcek;
  ozel(ph.d - 0.05, () => kafaCiz(k, ph, bo));
  const et = k._et || (k._et = { x: 0, y: 0, s: 0, d: 0 }), R = KAFA_R * (bo === undefined ? k.g.boy : k.g.boy * bo) * ph.s;
  et.x = ph.x;
  et.y = ph.y - R;
  et.s = ph.s;
  et.d = ph.d;
  // çene: aşağı asılan adın (k.etAsagi) bağlantı noktası; balon yeri her karede oyunun yeniden yazması için silinir
  et.alt = ph.y + R;
  et.asagi = et.bx = et.by = undefined;
  k.et = et;
  return true;
}
// El biçimi (k.elSekil = { R: 'yumruk', L: 'avuc' }; tanımsız ya da başka değer: yuvarlak el). ha: el, dr: dirsek
// (ekran noktaları); parmaklar önkolun doğrultusunda uzanır, başparmak gövdeye bakan yandadır.
//   avuc: açık el (el sallama, tokat, "dur") · yumruk: kapalı el (yumruk, bayrak tutma, zafer)
function elSekilCiz(k, ha, dr, sekil, gg) {
  const a = Math.atan2(ha.y - dr.y, ha.x - dr.x), r = 0.07 * k.g.boy * ha.s;
  // başparmağın yanı: önkolun hangi yanında gövde kalıyor
  const yan = gg && gg.ok && (Math.cos(a) * (gg.y - ha.y) - Math.sin(a) * (gg.x - ha.x)) < 0 ? -1 : 1;
  c.save();
  c.translate(ha.x, ha.y);
  c.rotate(a);
  c.lineWidth = Math.max(1, ha.s * 0.011);
  c.strokeStyle = MUREKKEP;
  c.fillStyle = k.g.ten;
  if (sekil === 'avuc') {
    // dört parmak yelpaze, yanda başparmak, üstte avuç içi
    for (let i = 0; i < 4; i++) {
      const fa = (i - 1.5) * 0.3, uz = i === 1 || i === 2 ? 1.3 : 1.15;
      c.beginPath();
      c.ellipse(Math.cos(fa) * r * uz, Math.sin(fa) * r * uz, r * 0.6, r * 0.22, fa, 0, TAU);
      c.fill();
      c.stroke();
    }
    c.beginPath();
    c.ellipse(r * 0.15, yan * r * 0.85, r * 0.5, r * 0.21, yan * 1.05, 0, TAU);
    c.fill();
    c.stroke();
    c.beginPath();
    c.arc(0, 0, r * 0.88, 0, TAU);
    c.fill();
    c.stroke();
  }
  else {
    // kapalı el: iri, yuvarlak köşeli; boğum çizgileri ve önde kıvrılan başparmak
    c.beginPath();
    c.roundRect(-r * 0.85, -r * 0.82, r * 1.85, r * 1.64, r * 0.6);
    c.fill();
    c.stroke();
    c.lineWidth = Math.max(1, ha.s * 0.007);
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(r * 0.55, i * r * 0.44);
      c.lineTo(r * 0.98, i * r * 0.44);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(-r * 0.25, yan * r * 0.8);
    c.quadraticCurveTo(r * 0.35, yan * r * 0.15, r * 0.55, yan * r * 0.05);
    c.stroke();
  }
  c.restore();
}
// Baş. Bayraklar: k.guler (hep güler), k.ciddi (hiç gülmez), k.ufle (yanaklar şişkin, ağız kapalı: üflemeli çalgı).
// Bunlar yoksa hediye sevinci süresince (B < k.zip1) ve kalabalık coşkunken (D.cosku > 0.72) güler.
// olcek (isteğe bağlı): başın büyüklük çarpanı (araba büyürken baş da büyüsün, lider iri başlı olsun).
// k.basYon (isteğe bağlı, sayı): başın dünyadaki yönü (k.yon gibi; π kameraya bakar). Tanımsızsa baş gövdeyle
// aynı yöne bakar. Gövde yerinde dururken yan dönüp bakmak, konuşana çevrilmek için.
// Çizilen başın ekrandaki yeri ve yarıçapı k.basEkran = { x, y, r, kare } olarak kalır (kare-cek ve testler okur).
function kafaCiz(k, ph, olcek) {
  const g = k.g, R = KAFA_R * (olcek === undefined ? g.boy : g.boy * olcek) * ph.s, x0 = ph.x, y0 = ph.y;
  let f = k.f, l = k.l;
  if (typeof k.basYon === 'number') {
    const sb = Math.sin(k.basYon), cb = Math.cos(k.basYon);
    f = k._basF || (k._basF = [0, 0, 0]);
    l = k._basL || (k._basL = [0, 0, 0]);
    f[0] = sb;
    f[2] = cb;
    l[0] = -cb;
    l[2] = sb;
  }
  const be = k.basEkran || (k.basEkran = { x: 0, y: 0, r: 0, kare: 0 });
  be.x = x0;
  be.y = y0;
  be.r = R;
  be.kare = kareSay;
  const ku = kam.bu, kf = kam.bf;
  const fr = f[0] * kam.r[0] + f[2] * kam.r[2], fu = f[0] * ku[0] + f[2] * ku[2], fd = f[0] * kf[0] + f[2] * kf[2];
  const lr = l[0] * kam.r[0] + l[2] * kam.r[2], lu = l[0] * ku[0] + l[2] * ku[2], ld = l[0] * kf[0] + l[2] * kf[2];
  const uu = ku[1], ud = kf[1];
  const N = (a, b, cc) => ({ x: x0 + R * (a * lr + cc * fr), y: y0 - R * (a * lu + b * uu + cc * fu), d: a * ld + b * ud + cc * fd });
  const cw = Math.max(1, ph.s * 0.012);
  c.lineWidth = cw;
  c.strokeStyle = MUREKKEP;
  const ortu = g.baslik === 'yazma' ? g.baslikRenk : g.sac;
  const arka = N(0, 0.1, -0.36), arkaR = R * (g.baslik === 'yazma' ? 1.02 : 0.95);
  const daire = (x, y, r, renk, cizgi) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = renk; c.fill(); if (cizgi)
    c.stroke(); };
  if (g.baslik === 'orgu')
    for (const s of [-1, 1]) {
      const a = N(s * 0.8, -0.2, -0.3);
      kapYol(a.x, a.y, R * 0.2, a.x + s * R * 0.08, a.y + R * 1.2, R * 0.13);
      c.fillStyle = g.sac;
      c.fill();
      c.stroke();
    }
  if (arka.d > 0)
    daire(arka.x, arka.y, arkaR, ortu, true);
  daire(x0, y0, R, g.ten, true);
  // tepeyi örten saç / yazma / şapka
  c.save();
  c.beginPath();
  c.arc(x0, y0, R - cw * 0.4, 0, TAU);
  c.clip();
  if (g.baslik === 'yazma') {
    const t = N(0, 0.98, 0.14);
    daire(t.x, t.y, R * 0.86, g.baslikRenk);
  }
  else if (g.baslik === 'kasket' || g.baslik === 'bere') {
    const t = N(0, 1.04, 0.02);
    daire(t.x, t.y, R * 0.84, g.baslikRenk);
  }
  else {
    const t = N(0, 1.0, 0.1);
    daire(t.x, t.y, R * 0.78, g.sac);
  }
  c.restore();
  if (fd < 0.3) {
    // Yüz: iri göz, al yanak, açık gülüş. Gülen gözünü kısarak güler.
    const kirp = (zaman + g.salin * 4.3) % 4.3 < 0.12;
    const guler = !k.ciddi && (k.guler || B < k.zip1 || D.cosku > 0.72);
    for (const s of [-1, 1]) {
      const y = N(s * 0.6, -0.3, 0.68);
      if (y.d < 0) {
        c.globalAlpha = 0.5;
        daire(y.x, y.y, R * (k.ufle ? 0.22 : 0.15), '#f0705f');
        c.globalAlpha = 1;
      }
      const e = N(s * 0.36, -0.04, 0.88);
      if (e.d < 0.05) {
        if (guler || kirp) {
          c.lineWidth = R * 0.07;
          c.beginPath();
          c.arc(e.x, e.y + R * 0.06, R * 0.11, Math.PI * 1.12, Math.PI * 1.88);
          c.stroke();
          c.lineWidth = cw;
        }
        else {
          c.beginPath();
          c.ellipse(e.x, e.y, R * 0.085, R * 0.12, 0, 0, TAU);
          c.fillStyle = MUREKKEP;
          c.fill();
          daire(e.x + R * 0.03, e.y - R * 0.045, R * 0.032, '#f6ecd9');
        }
      }
    }
    const m = N(0, -0.42, 0.84);
    if (m.d < 0 && !k.ufle) {
      c.beginPath();
      c.arc(m.x, m.y - R * 0.05, R * (guler ? 0.17 : 0.13), 0, Math.PI);
      c.closePath();
      c.fillStyle = '#7a1f2a';
      c.fill();
      if (g.biyik) {
        const bi = N(0, -0.26, 0.9);
        c.lineCap = 'round';
        c.lineWidth = R * 0.12;
        c.strokeStyle = g.sac;
        c.beginPath();
        c.moveTo(bi.x - R * 0.26, bi.y + R * 0.06);
        c.quadraticCurveTo(bi.x, bi.y - R * 0.09, bi.x + R * 0.26, bi.y + R * 0.06);
        c.stroke();
        c.strokeStyle = MUREKKEP;
      }
      c.lineWidth = cw;
    }
  }
  if (arka.d <= 0)
    daire(arka.x, arka.y, arkaR, ortu, true);
  if (g.baslik === 'kasket') {
    const s = N(0, 0.46, 0.96);
    if (s.d < 0.05) {
      c.beginPath();
      c.ellipse(s.x, s.y, R * 0.6, R * 0.16, 0, 0, TAU);
      c.fillStyle = g.baslikRenk;
      c.fill();
      c.stroke();
    }
  }
  if (g.baslik === 'bere') {
    const t = N(0, 1.05, 0);
    daire(t.x, t.y, R * 0.16, '#f2b632', true);
  }
  if (g.baslik === 'cicek') {
    const t = N(0.62, 0.62, 0.36);
    if (t.d < 0.3) {
      daire(t.x, t.y, R * 0.22, '#e23d2f', true);
      daire(t.x, t.y, R * 0.08, '#ffd166');
    }
  }
  if (g.baslik === 'yazma') {
    const t = N(0, 0.5, 0.88);
    if (t.d < 0)
      for (const s of [-0.5, 0, 0.5])
        daire(t.x + s * R * 0.7, t.y - Math.abs(s) * R * -0.12, R * 0.05, '#ffd166');
  }
}
