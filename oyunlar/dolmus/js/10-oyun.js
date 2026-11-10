/* DOLMUŞ DURUMU — koltuklar, şoför, elden ele giden paralar, hediye etkileri, ön koltuğun el değiştirmesi.
 *
 * Dolmuş kameraya doğru gelir (-z yönüne): burnu ekranın altında, arkası yukarıda. Tavanı kesik, içi yukarıdan
 * önden görünür; yolcular zaten kameraya bakar. Dolmuşun kendi ekseni: bx sağa, bz önden arkaya (ön sıra 0).
 * Dünyadaki yer: x = bx - D.otoX, z = bz. Kamera hep x = 0'a baktığı için gösteride dolmuş yana kayar (D.otoX),
 * sahneyi alan yolcu ortaya gelir.
 *
 * Koltuklar dört sıradır ve kademelidir: sıralar 3-4-5-4 koltuklu, her sıra öndekinin boşluğuna oturur; taban
 * sıra sıra yükselir (BASAMAK). Böylece arkadaki her yüz öndekilerin başlarının arasından görünür.
 * Ön sıra: solda kapı yanı koltuk, ortada ÖN KOLTUK (lider), sağda şoför (sol direksiyon; kameraya bakan
 * dolmuşun solu ekranın sağıdır).
 *
 * Koltuk değiştirme: sıra değişince herkesin yeni koltuğu (k.yeniKoltuk) hemen belli olur, ama yer değiştirme
 * hediyenin parası şoföre varınca (D.yerDegis) toplu yapılır. Değiştiren kısa bir sıçramayla başların
 * üstünden yeni koltuğuna konar (k.atla); kimse kimsenin içinden geçmez. Eski lider arkaya sıçrarken yenisi öne
 * sıçrar; pankart yeni lider ön koltuğa konunca çıkar.
 *
 * D'ye eklenenler: otoX, kayma (yolun akan mesafesi), hiz (metre / vuruş), bob, sonB, paralar, kasa, teyp / kasis /
 * sollama ({ bas, sure }), durak + durakKuyruk, sovBit, parla, yerDegis, liderPankart, sofor.
 * Kancalar: oyunYerlesim, oyunGiris, oyunHediye, oyunLiderDegisti, oyunBaslat, oyunBosalt, oyunDurum.
 */
const ZEMIN_Y = 0.3;            // ön sıranın tabanı (tekerlerin üstü)
const SIRA_Z = 0.75;            // iki koltuk sırası arası
const BASAMAK = 0.15;           // her sıranın tabanı öndekinden bu kadar yüksek
// Sıra sıra koltukların x'i (koltuk arası 0,85 m; komşu sıralar yarım koltuk kayık). Ön sıranın sağı şoförün.
const IZGARA = [[-0.85, 0, 0.85], [-1.275, -0.425, 0.425, 1.275], [-1.7, -0.85, 0, 0.85, 1.7], [-1.275, -0.425, 0.425, 1.275]];
const SIRA_SAY = IZGARA.length;
const DUVAR_X = 2.3;            // yan duvarlar
const ON_UC = -0.6;             // ön tampon
const ARKA_Z = (SIRA_SAY - 1) * SIRA_Z + 0.42; // arka duvar
const DURAK_V = 16;             // "müsait bir yerde" gösterisinin süresi (vuruş)
const YOLCU_BOY = 1.25;         // yolcular genel insan ölçüsünden iri: yüz ve ad uzaktan okunsun
const tabanY = r => ZEMIN_Y + r * BASAMAK;
const ON_KOLTUK = { x: 0, z: 0, r: 0, on: true };
const SOFOR_KOLTUK = { x: IZGARA[0][2], z: 0, r: 0, sofor: true };
// Yolcu koltukları öncelik sırasıyla: önden arkaya, her sırada ortadan kenara.
const KOLTUK = [{ x: IZGARA[0][0], z: 0, r: 0 }];
for (let r = 1; r < SIRA_SAY; r++)
  IZGARA[r].slice().sort((a, b) => Math.abs(a) - Math.abs(b) || a - b).forEach(x => KOLTUK.push({ x, z: r * SIRA_Z, r }));
const TUM_KOLTUK = [ON_KOLTUK, SOFOR_KOLTUK, ...KOLTUK];
Object.assign(D, { otoX: 0, kayma: 0, hiz: 1.5, bob: 0, sonB: 0, paralar: [], kasa: 0, teyp: null, kasis: null, sollama: null, durak: null, durakKuyruk: [], sovBit: -1, parla: -9, yerDegis: -1, yerDegisBas: -1, liderPankart: null, tesekkur: null });

// Şoför izleyici değildir: D.oy'da durmaz, adı oyunEkAdlar'dan gelir (k.ozel).
const sofor = karakterYap('__sofor', 'Şoför');
Object.assign(sofor, { mod: 'sofor', ozel: true, koltuk: SOFOR_KOLTUK, yeniKoltuk: SOFOR_KOLTUK, bx: SOFOR_KOLTUK.x, bz: 0, by: ZEMIN_Y, otur: 1, dfaz: 0.3, basYon: Math.PI, uzat: null, atla: null, olcek: 1 });
Object.assign(sofor.g, { kadin: false, ten: '#d39a6a', sac: '#2a2a35', boy: 1.3, gomlek: '#8fc3e6', yelek: '#8fc3e6', alt: '#2c2c38', kusak: '#3a2a2c', baslik: 'kasket', baslikRenk: '#3a3f4a', biyik: true, ayakkabi: '#2a1c16' });
sofor.asilBoy = sofor.g.boy;
D.sofor = sofor; // testler şoförün eline bakabilsin (CanliOyun._test.D.sofor)

const etkin = e => !!e && B >= e.bas && B < e.bas + e.sure;
// Oyuncu kaydına dolmuş alanlarını bir kez ekler (tohum kalabalık oyunGiris'ten geçmez).
function yolcuHazir(k) {
  if (k.asilBoy !== undefined)
    return;
  // Çekirdeğin boy çeşitliliği (0,98–1,11) korunur ama alt ucu kırpılır: en arkadaki kısa biri de okunsun.
  k.asilBoy = Math.max(k.g.boy, 1.04) * YOLCU_BOY;
  k.g.boy = k.asilBoy;
  k.dfaz = rastgeleUret(ozet('dolmus:' + k.id))();
  k.koltuk = null;
  k.yeniKoltuk = null;
  k.atla = null;
  k.bx = 0;
  k.bz = 0;
  k.by = ZEMIN_Y;
  k.otur = 1;
  k.basYon = Math.PI;
  k.uzat = null;
  k.olcek = 1;
}

/* ---- yerleşim ---- */
// Sıranın başı ön koltukta; gerisi önden arkaya. Jetonu çok olan şoföre yakındır.
function oyunYerlesim() {
  D.sira.forEach((k, i) => {
    yolcuHazir(k);
    k.yeniKoltuk = i === 0 ? ON_KOLTUK : KOLTUK[Math.min(i - 1, KOLTUK.length - 1)];
  });
}
// Yeni binen kaldırımdan, koltuğunun yanından sıçrayıp yan duvarın üstünden içeri girer.
function oyunGiris(k) {
  yolcuHazir(k);
  const s = k.yeniKoltuk || KOLTUK[0], yan = s.x > 0.01 ? 1 : s.x < -0.01 ? -1 : (k.dfaz < 0.5 ? -1 : 1);
  k.bx = yan * (DUVAR_X + 0.9);
  k.bz = s.z + 0.8;
  k.by = 0.14;
  k.otur = 0;
}

/* ---- hediyeler ---- */
function oyunHediye(k, jeton, kd) {
  const v = Math.ceil(B);
  paraGonder(k, jeton, kd.tip);
  if (kd.tip !== 'uzat') {
    D.teyp = { bas: v, sure: kd.tip === 'teyp' ? 8 : 12 };
    D.sovBit = Math.max(D.sovBit, v + (kd.tip === 'durak' ? 16 : 8));
  }
  if (kd.tip === 'kasis' || kd.tip === 'sollama' || kd.tip === 'durak')
    D.kasis = { bas: v, sure: 2 };
  if (kd.tip === 'sollama' || kd.tip === 'durak') {
    D.sollama = { bas: v + (kd.tip === 'durak' ? 0 : 1), sure: 8 };
    konfeti(40, 0.5);
    D.sarsinti = Math.max(D.sarsinti, 0.4);
  }
  if (kd.tip === 'durak') {
    if (!D.durakKuyruk.includes(k) && !(D.durak && D.durak.k === k) && D.durakKuyruk.length < 4)
      D.durakKuyruk.push(k);
    konfeti(120, 1);
    D.sarsinti = 1;
  }
  muzik.sov = B < D.sovBit;
}
// Ön koltuk el değiştirir; pankart yeni lider koltuğa konunca çıkar (oyunGuncelle → liderPankartBak).
function oyunLiderDegisti(eski, yeni) {
  D.liderPankart = { yeni, b0: B };
}
function liderPankartBak() {
  const lp = D.liderPankart;
  if (!lp)
    return;
  const yeni = lp.yeni, kondu = yeni.koltuk === ON_KOLTUK && !yeni.atla;
  if (yeni !== D.lider || yeni.cikiyor) {
    D.liderPankart = null;
    return;
  }
  if (kondu || B - lp.b0 > 8) {
    pankart('Ön koltuk el değiştirdi', yeni.ad + ' şoförün yanına geçti');
    konfeti(90, 0.9);
    D.sarsinti = Math.max(D.sarsinti, 0.6);
    D.parla = B;
    D.liderPankart = null;
  }
}
function oyunBaslat() {
  for (const k of D.sira) {
    yolcuHazir(k);
    k.koltuk = k.yeniKoltuk;
    k.bx = k.koltuk.x;
    k.bz = k.koltuk.z;
    k.by = tabanY(k.koltuk.r);
    k.otur = 1;
    k.yer = 1;
    k.yon = Math.PI;
    k.yeni = -9;
  }
  D.sonB = B;
  sokakHazirla();
}
function oyunBosalt() {
  D.paralar.length = 0;
  D.durakKuyruk.length = 0;
  D.durak = null;
  D.teyp = D.kasis = D.sollama = null;
  D.sovBit = -1;
  D.kasa = 0;
  D.liderPankart = null;
  D.tesekkur = null;
  D.yerDegis = -1;
  sofor.uzat = null;
  muzik.sov = false;
}
function oyunDurum(d) {
  d.onKoltuk = d.lider;
  d.para = D.paralar.length;
  d.kasa = D.kasa;
  d.teyp = etkin(D.teyp);
  d.kasis = etkin(D.kasis);
  d.sollama = etkin(D.sollama);
  d.durak = D.durak ? D.durak.k.ad : null;
  d.durakKuyruk = D.durakKuyruk.length;
  d.hiz = +D.hiz.toFixed(2);
  // Dolmuşun ekrandaki sınırları (720×1280 sanal ölçekte): testler kadrajın dolu ve taşmasız olduğuna bakar.
  const tampon = bp(0, 0.08, ON_UC - 0.1), tabela = bp(0, ARKA_UST, ARKA_Z), sol = bp(-DUVAR_X, ZEMIN_Y, 0), sag = bp(DUVAR_X, ZEMIN_Y, 0);
  d.kadraj = { ust: Math.round(tabela.y), alt: Math.round(tampon.y), sol: Math.round(sol.x), sag: Math.round(sag.x) };
}

/* ---- elden ele para ----
 * Her hediye bir banknot demetidir. Önce gönderenin elinde yarım vuruş havada durur ("Uzatır mısınız?"), sonra
 * öndeki her sıradan bir yolcunun eline (o sırada banknota en yakın olan), en son ön koltuktan şoföre iner.
 * Yol hediye anındaki koltuklardan kurulur: oyunHediye sıra güncellenmeden önce çağrılır (docs/KANCALAR.md);
 * yer değiştirmeler zaten ilk elden sonra yapılır. Yol kişilere bağlıdır: biri sıçrasa da banknot onun elindedir.
 * para = { k, yol: [gönderen, …, şoför], i (hangi el), t0 (o elin başladığı vuruş), v (bir el kaç vuruş),
 *          jeton, tip, p (dünyadaki yeri), iz (ekrandaki izi) }
 */
const PARA_SINIR = 10;
function paraYolu(k) {
  const yol = [k], s = k.koltuk || k.yeniKoltuk;
  if (s && s !== ON_KOLTUK) {
    let x = s.x;
    for (let r = s.r - 1; r >= 0; r--) {
      let en = null;
      for (const a of D.sira)
        if (a !== k && !a.cikiyor && a.koltuk && a.koltuk.r === r && a.koltuk !== ON_KOLTUK && (!en || Math.abs(a.koltuk.x - x) < Math.abs(en.koltuk.x - x)))
          en = a;
      if (en && r > 0) {
        yol.push(en);
        x = en.koltuk.x;
      }
    }
    const on = D.sira.find(a => a !== k && !a.cikiyor && a.koltuk === ON_KOLTUK);
    if (on)
      yol.push(on);
  }
  yol.push(sofor);
  return yol;
}
// Yer değiştirmeler para şoföre varınca toplu yapılır ("şoför parayı alınca yolcuyu öne alır"): banknot hep
// oturan ellerden geçer. Para üstüne para gelirse bekleme uzar ama ilk hediyeden en çok 8 vuruş sonra herkes
// yerleşir (selde de).
function yerDegisErtele(b) {
  if (D.yerDegis < B)
    D.yerDegisBas = B;
  D.yerDegis = Math.min(Math.max(D.yerDegis, b), D.yerDegisBas + 8);
}
function paraGonder(k, jeton, tip) {
  yolcuHazir(k);
  if (D.paralar.length >= PARA_SINIR) {
    yerDegisErtele(B + 1);
    return;
  }
  const yol = paraYolu(k), t0 = Math.ceil(B * 2) / 2 + 0.5, v = clamp(4 / (yol.length - 1), 0.5, 0.8);
  D.paralar.push({ k, yol, i: 0, t0, v, jeton, tip, p: null, iz: [] });
  yerDegisErtele(t0 + v * (yol.length - 1) + 0.2);
}
const gecerli = x => x === sofor || (!x.cikiyor && D.oy.get(x.id) === x);
// Paraları ilerletir ve elden ele geçişte iki tarafa da "uzat" hedefi verir (yolcuHareket elleri buna uzatır).
function paraIlerlet() {
  sofor.uzat = null;
  for (const k of D.oy.values())
    k.uzat = null;
  for (let i = D.paralar.length - 1; i >= 0; i--) {
    const n = D.paralar[i];
    // Yoldaki biri inerse banknotu bir sonraki alır (geçmiş eller önemsiz, onlara dokunulmaz).
    for (let j = n.yol.length - 2; j >= Math.max(0, n.i); j--)
      if (!gecerli(n.yol[j]))
        n.yol.splice(j, 1);
    while (B >= n.t0 + n.v && n.i < n.yol.length - 1) {
      n.t0 += n.v;
      n.i++;
    }
    if (n.i >= n.yol.length - 1) {
      paraVardi(n);
      D.paralar.splice(i, 1);
      continue;
    }
    const a = n.yol[n.i], b = n.yol[n.i + 1];
    if (B < n.t0)
      a.uzat = { hedef: [a.x + 0.1, a.y0 + 1.3 * a.g.boy, a.z - 0.1], el: 'R', yukari: true };
    else {
      a.uzat = { hedef: gogusYeri(b), el: null };
      b.uzat = { hedef: gogusYeri(a), el: null };
    }
  }
}
function gogusYeri(k) { return k.j.gogus ? k.j.gogus : [k.x, k.y0 + 0.5, k.z]; }
// Para şoföre vardı: kasa dolar, şoför güler ve teşekkür eder.
function paraVardi(n) {
  D.kasa += n.jeton;
  sofor.zip0 = B;
  sofor.zip1 = B + 2.5;
  // teşekkür çekirdeğin balonuyla değil oyunUst'te yazılır: balon başın üstüne, yolcuların yüzlerine ve banknotun
  // üstüne düşerdi (çekirdek balonları oyunUst'ten sonra çizer)
  D.tesekkur = { m: n.jeton >= 200 ? 'Allah razı olsun!' : n.jeton >= 10 ? 'Eyvallah!' : 'Sağ ol!', b0: B };
}
// Banknotun dünyadaki yeri: verenin elinden alanın eline, başların üstünden geçen bir kavisle.
function paraYeri(n) {
  const a = n.yol[n.i], b = n.yol[n.i + 1], elA = elYeri(a);
  if (B < n.t0)
    return elA;
  const t = yumusak((B - n.t0) / n.v), elB = elYeri(b);
  return [lerp(elA[0], elB[0], t), lerp(elA[1], elB[1], t) + 0.45 * Math.sin(Math.PI * t), lerp(elA[2], elB[2], t)];
}
function elYeri(k) {
  const el = k.uzat && k.uzat.el === 'L' ? k.j.haL : k.j.haR;
  return el || [k.x, k.y0 + 0.4, k.z];
}
