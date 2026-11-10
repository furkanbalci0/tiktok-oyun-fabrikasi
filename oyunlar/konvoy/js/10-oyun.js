/* KONVOY DURUMU — diziliş, hediye etkileri, gelin kurdelesinin el değiştirmesi, drift kuyruğu.
 * Konvoy kameraya doğru gider (yerel ileri = -z). En önde gelin arabası (lider, diğerlerinden büyük), arkasında
 * en çok dört şeritte uzayan konvoy: öndeki sıralar daha çok hediye atanlardır, komşu şeritler yarım sıra
 * kaydırılır ki arkadakinin yüzü öndekinin arkasında kalmasın.
 * D'ye eklenenler: kolon (şerit sayısı), zigzag ({ bas, sure }: bütün konvoyun kıvrılması),
 * fisekler (gökteki havai fişekler), fisekBit / sovBit (fişek ve davul şovu hangi vuruşa dek sürer),
 * driftKuyruk + drift ({ k, bas }: en öne çıkıp dönen), kurdeleUcus (gelin süsünün yeni arabada açılışı),
 * yolW (yolun yarı genişliği), kayma (yolun akan mesafesi, metre), duman (drift dumanı), sonB.
 * Süreler vuruşla (B) ölçülür: korna 1,5 vuruş, kurdele geçişi 2 vuruş, drift 16 vuruş.
 * Kancalar: oyunYerlesim, oyunGiris, oyunHediye, oyunLiderDegisti, oyunBaslat, oyunBosalt, oyunDurum.
 */
const ARA_X = 1.25;    // yan yana iki şerit arası (metre); iki şeritte daha açık (ARA_X2): arkadakiler gelin arabasının
const ARA_X2 = 2.0;    // iki yanından görünsün
const ARA_Z = 2.4;     // aynı şeritte iki araba arası
const ILK_SIRA = 3.0;  // gelin arabası ile ilk sıra arası (gelin arabası büyük)
const LIDER_Z = -1.3;  // gelin arabasının yeri
const DRIFT_Z = -4.9;  // drift atanın yeri: gelin arabasının önündeki boş yol
const KORNA_V = 1.5;   // bir kornanın süresi (vuruş)
const DRIFT_V = 16;    // drift şovunun süresi (vuruş)
const LIDER_OLCEK = 1.3, DRIFT_OLCEK = 2.1; // gelin arabası ve drift atan araba bu kadar büyük çizilir
Object.assign(D, { kolon: 1, zigzag: null, fisekler: [], fisekBit: -1, sovBit: -1, driftKuyruk: [], drift: null, kurdeleUcus: null, yolW: 2.4, kayma: 0, duman: [], sonB: 0 });

// Konvoy önce uzar, sonra genişler: 2 araba tek sıra, 9 araba iki şerit, 36 araba dört şerit.
function kolonSayisi(m) { return m <= 1 ? 1 : m <= 8 ? 2 : m <= 20 ? 3 : 4; }
function oyunYerlesim() {
  const m = D.sira.length - 1, kol = kolonSayisi(m), yerler = [];
  D.kolon = kol;
  for (let i = 0; i < kol; i++)
    yerler.push(i - (kol - 1) / 2);
  // Sıranın içi ortadan kenara dolar: sıradaki en yüksek jeton ortaya gelir.
  yerler.sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
  D.sira.forEach((k, i) => {
    arabaHazir(k);
    if (i === 0) {
      k.hedefX = 0;
      k.hedefZ = LIDER_Z;
      return;
    }
    const s = Math.floor((i - 1) / kol), o = yerler[(i - 1) % kol];
    const kay = kol === 2 ? (o > 0 ? 0.5 : 0) : Math.abs(o) >= 1 ? 0.5 : 0;
    k.hedefX = o * (kol === 2 ? ARA_X2 : ARA_X);
    k.hedefZ = LIDER_Z + ILK_SIRA + ARA_Z * (s + kay);
  });
}
// Yeni gelen arkadan, kendi şeridinin biraz dışından hızla gelip yerine girer (sollar gibi).
function oyunGiris(k) {
  arabaHazir(k);
  k.x = k.hedefX + (k.hedefX >= 0 ? 0.8 : -0.8);
  k.z = k.hedefZ + 9;
  k.yon = Math.PI;
}

/* ---- hediyeler ---- */
function kornaCal(k, gecikme) {
  k.korna = B + (gecikme || 0);
  k.far = k.korna;
}
// Bütün konvoy korna çalar: öndekiler biraz önce başlar, ses arkaya doğru dalga gibi yayılır.
function hepsiKorna() {
  for (const k of D.oy.values())
    if (!k.cikiyor)
      kornaCal(k, Math.min(1, k.sn * 0.06));
}
function oyunHediye(k, j, kd) {
  const v = Math.ceil(B);
  // Her hediyede gönderen korna çalar; büyüdükçe bütün konvoy katılır.
  if (kd.tip !== 'tek')
    hepsiKorna();
  kornaCal(k);
  if (kd.tip === 'zigzag' || kd.tip === 'fisek' || kd.tip === 'drift')
    D.zigzag = { bas: v, sure: 8 };
  if (kd.tip === 'fisek' || kd.tip === 'drift') {
    D.fisekBit = Math.max(D.fisekBit, v + 12);
    D.sovBit = Math.max(D.sovBit, v + 16);
    fisekAt(3);
    konfeti(40, 0.5);
  }
  if (kd.tip === 'drift') {
    if (!D.driftKuyruk.includes(k) && !(D.drift && D.drift.k === k) && D.driftKuyruk.length < 4)
      D.driftKuyruk.push(k);
    konfeti(120, 1);
    D.sarsinti = 1;
  }
  muzik.sov = B < D.sovBit;
}
// Gelin kurdelesi eski gelin arabasının kaputundan yenisinin kaputuna uçar.
function oyunLiderDegisti(eski, yeni) {
  D.kurdeleUcus = { x: eski.x + (eski.ox || 0), z: eski.z, b0: B, sure: 2, kime: yeni };
  pankart('Gelin arabası el değiştirdi', 'Kurdele artık ' + yeni.ad + ' arabasında');
  konfeti(90, 0.9);
  D.sarsinti = 0.7;
  kornaCal(yeni);
}
function oyunBaslat() {
  for (const k of D.sira) {
    arabaHazir(k);
    k.x = k.hedefX;
    k.z = k.hedefZ;
    k.yer = 1;
    k.yon = Math.PI;
    k.yeni = -9;
  }
  D.sonB = B;
  arkaHazirla();
}
function oyunBosalt() {
  D.driftKuyruk.length = 0;
  D.drift = null;
  D.zigzag = null;
  D.kurdeleUcus = null;
  D.fisekler.length = 0;
  D.duman.length = 0;
  D.fisekBit = D.sovBit = -1;
  muzik.sov = false;
}
function oyunDurum(d) {
  d.gelinArabasi = d.lider;
  d.etiketUst = ETIKET_UST;
  d.drift = D.drift ? D.drift.k.ad : null;
  d.driftKuyruk = D.driftKuyruk.length;
  d.zigzag = !!D.zigzag;
  d.fisek = D.fisekler.length;
  let n = 0;
  for (const k of D.oy.values())
    if (kornaCaliyor(k))
      n++;
  d.korna = n;
}
// Korna çalıyor ya da birazdan çalacak (dalga halinde başlayanlar için).
function kornaCaliyor(k) { return k.korna !== undefined && B < k.korna + KORNA_V; }
