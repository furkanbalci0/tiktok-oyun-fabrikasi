/* HALAY DURUMU — yay biçiminde halay dizisi, çalgıcılar, hediye etkileri, mendilin el değiştirmesi.
 * D'ye eklenenler: hareket (herkesin yaptığı omuz / çök), soloKuyruk + solo (ortaya çıkan), sovBit (davul şovu
 * hangi vuruşa dek sürer), mendilUcus (el değiştiren mendil), R / Rhedef (yayın yarıçapı), aci (yayın açıklığı),
 * meydanR (ışıklı meydanın yarıçapı), salinim (dizinin yavaş salınımı), soloYer, calZ / calAralik (çalgıcıların yeri).
 * Hediyenin müziğe etkisi (tempo, hava sırası) 22-hediye-muzik.js'tedir.
 * Kancalar: oyunYerlesim, oyunGiris, oyunHediye, oyunLiderDegisti, oyunBaslat, oyunBosalt, oyunDurum.
 */
const ARALIK = 0.54;
Object.assign(D, { hareket: null, soloKuyruk: [], solo: null, sovBit: -1, mendilUcus: null, R: 2.2, Rhedef: 2.2, aci: 0, meydanR: 3.6, salinim: 0, soloYer: [0, 0], calZ: 0, calAralik: 0.7 });

// Çalgıcılar izleyici değildir: D.oy'da durmazlar, etiketleri oyunEkAdlar'dan gelir (k.ozel).
const davulcu = karakterYap('__davulcu', 'Davulcu');
Object.assign(davulcu, { mod: 'davulcu', ozel: true, ciddi: true });
Object.assign(davulcu.g, { kadin: false, ten: '#d9a070', sac: '#1d1513', boy: 1.2, gomlek: '#f6ecd9', yelek: '#20264f', alt: '#3a2a2c', kusak: '#e23d2f', baslik: 'kasket', baslikRenk: '#3a2a2c', biyik: true });
const zurnaci = karakterYap('__zurnaci', 'Zurnacı');
Object.assign(zurnaci, { mod: 'zurnaci', ozel: true, ciddi: true, ufle: true });
Object.assign(zurnaci.g, { kadin: false, ten: '#f2c9a0', sac: '#3a2416', boy: 1.14, gomlek: '#f6ecd9', yelek: '#22b8a7', alt: '#20264f', kusak: '#f2b632', baslik: 'bere', baslikRenk: '#e23d2f', biyik: false });
const CALGICILAR = [davulcu, zurnaci];

// Herkes yayın üstünde ARALIK metre arayla durur; yay kalabalıkla büyür ve kapanmaya yaklaşır.
function oyunYerlesim() {
  const n = D.sira.length, L = Math.max(0, n - 1) * ARALIK;
  D.Rhedef = Math.max(2.2, L / 5.2);
  const R = D.Rhedef;
  D.aci = L / R;
  // Yay arkada ortalanır, açıklığı hep kameraya bakar: halkanın içi (çalgıcılar, solo) kapanmaz.
  // Halay başı yayın sol ucundadır; kameraya döndüğü için serbest kalan sağ eli mendili sallar.
  const bas = -D.aci / 2;
  D.sira.forEach((k, i) => { k.hedefAci = bas + i * ARALIK / R; });
}
// Yeni gelen, yerinin hizasında halkanın dışından koşarak gelir.
function oyunGiris(k) {
  const a = k.hedefAci || 0, r = D.R + 4.5;
  k.x = Math.sin(a) * r;
  k.z = Math.cos(a) * r;
}
function oyunHediye(k, j, kd) {
  const v = Math.ceil(B);
  if (kd.tip === 'omuz' || kd.tip === 'cok')
    D.hareket = { tip: kd.tip, bas: v, sure: 8 };
  if (kd.tip === 'davul' || kd.tip === 'solo') {
    D.sovBit = Math.max(D.sovBit, v + 16);
    D.hareket = { tip: 'omuz', bas: v, sure: 8 };
    konfeti(40, 0.5);
  }
  if (kd.tip === 'solo') {
    if (!D.soloKuyruk.includes(k) && !k.solo && D.soloKuyruk.length < 4)
      D.soloKuyruk.push(k);
    konfeti(120, 1);
    D.sarsinti = 1;
  }
  hediyeMuzik(k, kd, v);
  muzik.sov = B < D.sovBit;
}
// Mendil eski halay başının elinden yenisinin başına uçar.
function oyunLiderDegisti(eski, yeni) {
  const e = eski.j.haR || [eski.x, 1.4, eski.z];
  D.mendilUcus = { x: e[0], y: e[1], z: e[2], t0: zaman, sure: 1.0, kime: yeni };
  pankart('Mendil el değiştirdi', 'Yeni halay başı: ' + yeni.ad);
  konfeti(90, 0.9);
  D.sarsinti = 0.7;
}
function oyunBaslat() {
  D.R = D.Rhedef;
  for (const k of D.sira) {
    k.x = Math.sin(k.hedefAci) * D.R;
    k.z = Math.cos(k.hedefAci) * D.R;
    k.yer = 1;
    k.yon = Math.PI;
    k.yeni = -9;
  }
  davulcu.x = -2.4;
  davulcu.z = 1;
  zurnaci.x = 2.4;
  zurnaci.z = 1;
  arkaHazirla();
}
function oyunBosalt() {
  D.soloKuyruk.length = 0;
  D.solo = null;
  D.hareket = null;
  D.mendilUcus = null;
  hediyeMuzikSifirla();
}
function oyunDurum(d) {
  d.halayBasi = d.lider;
  d.solo = D.solo ? D.solo.k.ad : null;
  d.soloKuyruk = D.soloKuyruk.length;
  d.tempoEk = muzik.tempoEk;
  d.havaSira = D.havaSira.length;
}
