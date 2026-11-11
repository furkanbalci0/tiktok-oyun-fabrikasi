/* HEDİYEYLE MÜZİK — izleyici hediye attıkça tempo ve çalan hava değişir. Ayarlar OYUN.tempo ve OYUN.hediyeMuzik.
 * Tempo: çekirdeğin tempo kapısından geçer (muzik.tempoEk; alt / üst sınırı ve yumuşatmayı çekirdek uygular).
 *   omuz  : her hediye bir tempo kademesi ekler; kademe adimVurus vuruş yaşar, en çok adimEnCok kademe birikir
 *   cok   : hareketin ilk cokAgirVurus vuruşunda tempo ağırlaşır, sonraki cokPatlamaVurus vuruşta patlar
 *   solo  : solo sürdükçe tempo tavandadır
 * Hava: davul hediyesi sıraya girer (D.havaSira: gönderen izleyiciler). Sıradaki, son hava değişiminden havaAra vuruş
 * geçince ve solo yokken işlenir: üretilen müzikte sıradaki hava ölçü başında girer (muzik.bekleyen), hazır parça
 * kipinde sıradaki parça başlar. Kendiliğinden hava dönüşü ve yayıncının panelden seçtiği hava da arayı baştan başlatır.
 * hediyeMuzik(k, kd, v): oyunHediye çağırır · hediyeMuzikGuncelle(): oyunGuncelle çağırır · hediyeMuzikSifirla()
 */
const HEDIYE_MUZIK = OYUN.hediyeMuzik;
Object.assign(D, { tempoAdimlar: [], cokTempo: null, havaSira: [], havaGecis: null, havaSon: -Infinity, calanKimlik: null });

function hediyeMuzik(k, kd, v) {
  const a = HEDIYE_MUZIK;
  if (kd.tip === 'omuz')
    D.tempoAdimlar = [...D.tempoAdimlar, v + a.adimVurus].slice(-a.adimEnCok);
  else if (kd.tip === 'cok')
    D.cokTempo = { bas: v };
  else if (kd.tip === 'davul' && D.havaSira.length < a.havaSiraEnCok)
    D.havaSira = [...D.havaSira, k];
}
function hediyeMuzikSifirla() {
  if (D.havaGecis && muzik.bekleyen === D.havaGecis.h)
    muzik.bekleyen = null;
  Object.assign(D, { tempoAdimlar: [], cokTempo: null, havaSira: [], havaGecis: null, havaSon: -Infinity });
  muzik.tempoEk = 0;
}
// Hedef tempo çarpanına eklenecek pay. Hazır parça yavaşlatılamaz: ağırlaşma adımı o kipte atlanır.
function tempoEkHesapla() {
  const a = HEDIYE_MUZIK, c = D.cokTempo;
  if (D.solo)
    return OYUN.tempo.tavan - 1;
  let ek = D.tempoAdimlar.length * a.adim;
  if (c && B >= c.bas)
    ek += B - c.bas >= a.cokAgirVurus ? a.cokPatlama : muzik.hazirCal ? 0 : -a.cokAgir;
  return ek;
}
function calanKimlik() {
  return muzik.hazirCal ? 'parca-' + muzik.hz.no : muzik.hava.id;
}
// Ad hediye anında değil duyuru anında okunur: yayıncı bu arada adı gizlediyse "misafir" yazılır, izleyici
// sahneden çıktıysa (yayıncı çıkardı ya da kendi gitti) ad hiç yazılmaz.
function havaDuyur(havaAd, k) {
  const sahnede = D.oy.get(k.id) === k && !k.cikiyor;
  pankart(havaAd, sahnede ? 'Havayı ' + k.ad + ' değiştirdi' : 'Hava değişti');
}
// Henüz girmemiş hava değişimini geri alır: gönderen sıranın başına döner.
function havaGecisGeriAl() {
  const g = D.havaGecis;
  if (muzik.bekleyen === g.h)
    muzik.bekleyen = null;
  D.havaSira = [g.k, ...D.havaSira];
  D.havaGecis = null;
}
function havaSiraIslet() {
  const a = HEDIYE_MUZIK, kimlik = calanKimlik(), g = D.havaGecis;
  // Çalan değişti (hediyeyle, kendiliğinden ya da panelden): ara baştan sayılır.
  if (kimlik !== D.calanKimlik) {
    if (D.calanKimlik !== null)
      D.havaSon = B;
    D.calanKimlik = kimlik;
  }
  if (D.solo) {
    // Solo bitene dek hava değişmez: henüz girmemiş değişim sıranın başına döner, kendiliğinden dönüş bekler.
    if (g && muzik.bekleyen === g.h)
      havaGecisGeriAl();
    muzik.havaSure = 0;
    return;
  }
  if (g && muzik.hazirCal && muzik.hava !== g.h)
    havaGecisGeriAl(); // hava girmeden hazır parçaya geçildi: değişim sıradaki parçaya uygulanır
  else if (g) {
    if (muzik.bekleyen === g.h)
      return;
    // Artık beklemiyor: ya ölçü başında girdi ya da yayıncı panelden başka hava seçti.
    if (muzik.hava === g.h && !muzik.hazirCal)
      havaDuyur(g.h.ad, g.k);
    D.havaGecis = null;
  }
  if (!D.havaSira.length || (!muzik.hazirCal && muzik.bekleyen) || B - D.havaSon < a.havaAra)
    return;
  const [k, ...kalan] = D.havaSira;
  D.havaSira = kalan;
  D.havaSon = B;
  if (muzik.hazirCal) {
    const no = (muzik.hz.no + 1) % muzik.parcalar.length;
    muzik.hazirBaslat(no).catch(e => console.error('Hazır parça başlatılamadı:', e));
    havaDuyur(muzik.parcalar[no].ad, k);
    return;
  }
  const h = muzik.havalar[(muzik.havalar.indexOf(muzik.hava) + 1) % muzik.havalar.length];
  muzik.bekleyen = h;
  muzik.havaSure = 0;
  D.havaGecis = { h, k };
}
function hediyeMuzikGuncelle() {
  const a = HEDIYE_MUZIK;
  if (D.tempoAdimlar.some(bit => B >= bit))
    D.tempoAdimlar = D.tempoAdimlar.filter(bit => B < bit);
  if (D.cokTempo && B >= D.cokTempo.bas + a.cokAgirVurus + a.cokPatlamaVurus)
    D.cokTempo = null;
  muzik.tempoEk = tempoEkHesapla();
  havaSiraIslet();
}
