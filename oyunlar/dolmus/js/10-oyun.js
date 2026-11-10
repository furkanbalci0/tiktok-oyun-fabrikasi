/* DOLMUŞ DURUMU — koltuklar, şoför, elden ele giden paralar, hediye etkileri, ön koltuğun el değiştirmesi.
 *
 * Dolmuş +x yönüne gider (ekranda sağa). Yerleri dolmuşun kendi ekseninde tutulur: u = ön tamponun kaç metre
 * gerisi, w = dünyadaki z (yakın yan -1, uzak yan +1). Dünyadaki yer: x = D.otoX - u. Kamera hep x = 0'a baktığı
 * için oyun dolmuşu kaydırır (D.otoX): kadraja girmesi gereken bölgenin ortası x = 0'a gelir.
 * Şoför uzak yanda (sol direksiyon), ön koltuk yakın yanda; ikisi aynı sırada. Arkada iki koltuk şeridi yarım
 * koltuk kaydırılmıştır: arkadakinin yüzü öndekinin başının arasından görünür.
 *
 * D'ye eklenenler: otoX (dolmuşun dünyadaki yeri), bolge0 / bolge1 (kadraja girecek u aralığı), kayma (yolun akan
 * mesafesi), hiz (metre / vuruş), bob (gövdenin yaylanması), sonB, paralar (elden ele giden banknotlar), kasa
 * (şoföre ulaşan toplam jeton), teyp / kasis / sollama ({ bas, sure }: vuruş aralığı), durak + durakKuyruk
 * (müsait bir yerde: duran dolmuş ve sahneyi alan yolcu), sovBit, parla (ön koltuk el değiştirdiği vuruş).
 * Kancalar: oyunYerlesim, oyunGiris, oyunHediye, oyunLiderDegisti, oyunBaslat, oyunBosalt, oyunDurum.
 */
const ZEMIN_Y = 0.34;          // dolmuşun tabanı (tekerlerin üstü)
const TAVAN_Y = ZEMIN_Y + 1.32; // kesilen tavanın yüksekliği
const ON_U = 1.3;              // şoför ve ön koltuk sırası
const ILK_U = 2.05;            // ilk yolcu sırası
const ARA_U = 0.72;            // aynı şeritte iki koltuk arası
const YAKIN_Z = -0.6, UZAK_Z = 0.6;
const SIRA_YER = 7;            // her şeritte koltuk: 7 + 7 = 14 yolcu, ön koltukla 15
const ARKA_U = ILK_U + (SIRA_YER - 1) * ARA_U + ARA_U / 2 + 0.5;
const OTUR_YON = Math.PI - 0.62; // oturan yolcu kameraya dönük, biraz da yola bakar
const DURAK_V = 16;            // "müsait bir yerde" gösterisinin süresi (vuruş)
const ON_KOLTUK = { u: ON_U, z: YAKIN_Z };
const KOLTUK = [];
for (let i = 0; i < SIRA_YER; i++) {
  KOLTUK.push({ u: ILK_U + i * ARA_U, z: YAKIN_Z });
  KOLTUK.push({ u: ILK_U + i * ARA_U + ARA_U / 2, z: UZAK_Z });
}
Object.assign(D, { otoX: 0, bolge0: -0.35, bolge1: 3, kayma: 0, hiz: 1.5, bob: 0, sonB: 0, paralar: [], kasa: 0, teyp: null, kasis: null, sollama: null, durak: null, durakKuyruk: [], sovBit: -1, parla: -9 });

// Şoför izleyici değildir: D.oy'da durmaz, adı oyunEkAdlar'dan gelir (k.ozel).
const sofor = karakterYap('__sofor', 'Şoför');
Object.assign(sofor, { mod: 'sofor', ozel: true, du: ON_U, dw: UZAK_Z, otur: 1, dfaz: 0.3, basYon: Math.PI - 0.3, uzat: null });
Object.assign(sofor.g, { kadin: false, ten: '#d39a6a', sac: '#2a2a35', boy: 1.12, gomlek: '#8fc3e6', yelek: '#8fc3e6', alt: '#2c2c38', kusak: '#3a2a2c', baslik: 'kasket', baslikRenk: '#3a3f4a', biyik: true, ayakkabi: '#2a1c16' });
sofor.asilBoy = sofor.g.boy;
D.sofor = sofor; // testler şoförün eline bakabilsin (CanliOyun._test.D.sofor)

const etkin = e => !!e && B >= e.bas && B < e.bas + e.sure;
// Oyuncu kaydına dolmuş alanlarını bir kez ekler (tohum kalabalık oyunGiris'ten geçmez).
function yolcuHazir(k) {
  if (k.asilBoy !== undefined)
    return;
  // Yolcular sahnenin kahramanı: genel insan ölçüsünden biraz iri (yüz ve ad kalabalıkta da okunsun).
  k.asilBoy = k.g.boy * 1.1;
  k.g.boy = k.asilBoy;
  k.dfaz = rastgeleUret(ozet('dolmus:' + k.id))();
  k.du = k.hu !== undefined ? k.hu : ON_U;
  k.dw = k.hw !== undefined ? k.hw : YAKIN_Z;
  k.otur = 1;
  k.basYon = Math.PI;
  k.uzat = null;
  k.olcek = 1;
}

/* ---- yerleşim ---- */
// Sıranın başı ön koltukta; gerisi önden arkaya, yakın ve uzak şerit sırayla. Jetonu çok olan şoföre yakındır.
function oyunYerlesim() {
  D.sira.forEach((k, i) => {
    yolcuHazir(k);
    const y = i === 0 ? ON_KOLTUK : KOLTUK[Math.min(i - 1, KOLTUK.length - 1)];
    k.hu = y.u;
    k.hw = y.z;
  });
  bolgeHesapla();
}
// Kadraja girecek u aralığı: ön tampondan en arkadaki dolu koltuğa. Tek yolcuda da bir sıra boş koltuk görünür.
// Dolmuş dolunca kaput kadrajdan taşar (şoför ve direksiyon içeride kalır): yüzler daha iri görünür.
function bolgeHesapla() {
  let son = ILK_U + ARA_U / 2;
  for (const k of D.sira)
    son = Math.max(son, k.hu);
  D.bolge0 = son > ILK_U + 2.5 * ARA_U ? 0.78 : -0.3;
  D.bolge1 = son + 0.5;
}
// Gösteride kadraj sahneyi alan yolcuya daralır.
function kadrajAraligi() {
  const d = D.durak;
  if (d && d.yakin)
    return [d.k.du - 1.45, d.k.du + 1.45];
  return [D.bolge0, D.bolge1];
}
// Yeni binen, dolmuşun arkasından kaldırım tarafında koşarak gelir ve kapıdan yerine geçer.
function oyunGiris(k) {
  yolcuHazir(k);
  k.du = D.bolge1 + 1.6;
  k.dw = -2.2;
  k.otur = 0;
  k.yon = Math.PI / 2;
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
// Ön koltuk el değiştirir: eski sahibi arkaya geçer, yenisi şoförün yanına yürür; koltuk parlar.
function oyunLiderDegisti(eski, yeni) {
  pankart('Ön koltuk el değiştirdi', yeni.ad + ' şoförün yanına geçti');
  konfeti(90, 0.9);
  D.sarsinti = Math.max(D.sarsinti, 0.6);
  D.parla = B;
}
function oyunBaslat() {
  for (const k of D.sira) {
    yolcuHazir(k);
    k.du = k.hu;
    k.dw = k.hw;
    k.otur = 1;
    k.yer = 1;
    k.yon = OTUR_YON;
    k.yeni = -9;
  }
  bolgeHesapla();
  const a = kadrajAraligi();
  D.otoX = (a[0] + a[1]) / 2;
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
  sofor.uzat = null;
  bolgeHesapla();
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
}

/* ---- elden ele para ----
 * Her hediye bir banknot demetidir. Önce gönderenin elinde yarım vuruş havada durur ("uzatır mısınız?"), sonra
 * önündeki her yolcunun elinden geçip şoföre varır.
 * Yol hediye anındaki koltuktan kurulur: oyunHediye sıra güncellenmeden önce çağrılır (docs/KANCALAR.md), D.sira ve
 * koltuklar o an eski hâlindedir. Hediye atan genelde öne geçer; ama parası şoföre varana dek eski koltuğunda
 * oturur (k.tut), yoksa en arkadaki öne fırlar ve para kimsenin elinden geçmezdi. O koltuğa geçecek olan bekler.
 * para = { k, yol: [gönderen, …, şoför], i (hangi el), t0 (o elin başladığı vuruş), v (bir el kaç vuruş),
 *          jeton, tip, p (dünyadaki yeri) }
 */
const PARA_SINIR = 10;
function paraGonder(k, jeton, tip) {
  if (D.paralar.length >= PARA_SINIR)
    return;
  yolcuHazir(k);
  if (!k.tut)
    k.tut = { u: k.hu, w: k.hw };
  const onde = D.sira.filter(x => x !== k && !x.cikiyor && x.hu < k.tut.u).sort((a, b) => b.hu - a.hu);
  const yol = [k, ...onde, sofor];
  D.paralar.push({ k, yol, i: 0, t0: Math.ceil(B * 2) / 2 + 0.5, v: clamp(4.5 / (yol.length - 1), 0.36, 0.7), jeton, tip, p: null });
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
    if (B < n.t0) {
      // havada tutar: el başın üstünde
      a.uzat = { hedef: [a.x + 0.05, a.y0 + 1.25 * a.g.boy, a.z - 0.15], el: 'R', yukari: true };
    }
    else {
      a.uzat = { hedef: gogusYeri(b), el: null };
      b.uzat = { hedef: gogusYeri(a), el: null };
    }
  }
  // Havada parası kalmayan gönderen yeni koltuğuna geçebilir.
  for (const k of D.oy.values())
    if (k.tut && !D.paralar.some(n => n.k === k))
      k.tut = null;
}
function gogusYeri(k) { return k.j.gogus ? k.j.gogus : [k.x, k.y0 + 0.5, k.z]; }
// Para şoföre vardı: kasa dolar, şoför güler ve teşekkür eder.
function paraVardi(n) {
  D.kasa += n.jeton;
  sofor.zip0 = B;
  sofor.zip1 = B + 2.5;
  sofor.balon = { m: n.jeton >= 200 ? 'Allah razı olsun!' : n.jeton >= 10 ? 'Eyvallah abla, abi!' : 'Sağ ol!', t0: zaman };
}
// Elden ele geçerken banknotun dünyadaki yeri: verenin elinden alanın eline, küçük bir kavisle.
function paraYeri(n) {
  const a = n.yol[n.i], b = n.yol[n.i + 1];
  const elA = elYeri(a);
  if (B < n.t0)
    return elA;
  const t = yumusak((B - n.t0) / n.v), elB = elYeri(b);
  return [lerp(elA[0], elB[0], t), lerp(elA[1], elB[1], t) + 0.4 * Math.sin(Math.PI * t), lerp(elA[2], elB[2], t)];
}
function elYeri(k) {
  const el = k.uzat && k.uzat.el === 'L' ? k.j.haL : k.j.haR;
  return el || [k.x, k.y0 + 0.4, k.z];
}
