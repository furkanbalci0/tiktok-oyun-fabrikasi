/* VUR DÜZELSİN — kurallar ve durum: kim nerede durur, hediye hangi vuruşu başlatır, görüntü nasıl düzelir.
 *
 * Sahne: ortada sehpanın üstünde tüplü televizyon (x = 0 çevresinde, biraz sağa dönük: sol yanı kameraya
 * bakar). Televizyonun solunda vuruş yeri (ISTASYON): hediye atan oraya yürür, vurur, kalabalığa döner.
 * Sağında sandalye + tabure + ansiklopedi yığını (KULE): lider onun üstünde anteni tutar. Kalabalık
 * televizyonun önünde sıra sıra toplanır; öndeki sıralar daha çok hediye atanlardır.
 *
 * Görüntü: D.netlik 0–1. Her vuruş artırır, zaman (vuruş saati B) azaltır. Beş basamak (D.asama 0–4):
 * karlı, kayan, çift görüntü, siyah beyaz, renkli net. Tam nete çıkınca ekranda gol olur.
 * Vuruşlar sıraya girer (D.kuyruk); vuruş yerinde aynı anda bir kişi vurur (D.ist), lider kendi vuruşunu
 * yığının üstünden yapar (D.kuleIs). Süreler vuruşla (B) ölçülür.
 * Televizyon eşyadır: tepkisi yaylanma, ezilme, karlanma, toz ve fırlayan düğmedir.
 * Kancalar: oyunYerlesim, oyunGiris, oyunHediye, oyunLiderDegisti, oyunBaslat, oyunBosalt, oyunDurum.
 */

/* ---- televizyonun yeri (metre) ---- */
const TVZ = 0.9;                  // televizyon gövdesinin ortası (derinlik)
const TV_YAW = -0.28;             // biraz sağa dönük: sol yan yüzü kameraya bakar, vuruş orada görünür
const TV_C = Math.cos(TV_YAW), TV_S = Math.sin(TV_YAW);
const TV_W = 1.0;                 // gövdenin yarı genişliği
const TV_ALT = 0.28, TV_UST = 1.86; // gövdenin altı ve üstü (sehpanın üstünde)
const TV_ON = -0.42, TV_ARKA = 0.42; // gövdenin önü ve arkası (yerel z); arkada tüpün çıkıntısı ayrıca
// Televizyonun yerel noktası → dünya (deformasyonsuz).
function tvDunya(p) { return [p[0] * TV_C + p[2] * TV_S, p[1], -p[0] * TV_S + p[2] * TV_C + TVZ]; }

/* ---- vuruş yeri ve anten yığını ---- */
// Vuruş yeri: sol yan yüzün önünde. Yüz sola ve biraz kameraya bakar; vuran yüzünü göstersin diye
// televizyona tam dönmez, kameraya doğru biraz açılır.
const SOL_NORMAL = [-TV_C, 0, TV_S];
const ISTASYON = (() => {
  const t = tvDunya([-TV_W, 0, -0.08]), x = t[0] + SOL_NORMAL[0] * 0.34, z = t[2] + SOL_NORMAL[2] * 0.34;
  const fx = -SOL_NORMAL[0], fz = -SOL_NORMAL[2] - 0.5;
  return { x, z, yon: Math.atan2(fx, fz), kosX: x + SOL_NORMAL[0] * 1.15, kosZ: z + SOL_NORMAL[2] * 1.15 - 0.25 };
})();
// Anten yığını: sandalye (0,48) + tabure (0,34) + ansiklopedi (0,14). Lider bunun üstünde durur.
const KULE = (() => {
  const p = tvDunya([TV_W + 0.27, 0, -0.32]);
  return { x: p[0], z: p[2], h: 0.98, yon: Math.atan2(-0.86, -0.5) };
})();

/* ---- kalabalığın yerleri ---- */
// Televizyonun önünde dört sıra; sıra içi ortadan kenara dolar, öndeki sıra daha değerli. Sol uçlar vuruş
// yerinin önünü kapatmasın diye kalabalık biraz sağa kaydırılmış.
const YERLER = (() => {
  const y = [], siralar = [[-1.1, 6], [-1.46, 6], [-1.82, 6], [-2.18, 5]];
  siralar.forEach(([z, n], s) => {
    const xs = [];
    for (let i = 0; i < n; i++)
      xs.push((i - (n - 1) / 2) * 0.46 + 0.1 + (s % 2 ? 0.23 : 0));
    xs.sort((a, b) => Math.abs(a - 0.1) - Math.abs(b - 0.1) || a - b);
    for (const x of xs)
      y.push([x, z]);
  });
  return y;
})();

/* ---- vuruşlar ---- */
// sure: vuruş sayısı · temas: zaman çizgisinde değme anı (0–1) · net: görüntüye katkı · guc: televizyonun
// sarsılması · y: değme yüksekliği (metre) · yazi: çarpma yazısı
const VURUS = {
  tokat: { sure: 2.0, temas: 0.5, net: 0.08, guc: 0.9, y: 0.58, yazi: 'ŞAK!' },
  yumruk: { sure: 2.0, temas: 0.48, net: 0.15, guc: 1.3, y: 0.5, yazi: 'PAT!' },
  tekme: { sure: 2.4, temas: 0.5, net: 0.25, guc: 1.8, y: 0.4, yazi: 'GÜM!' },
  ucan: { sure: 4.0, temas: 0.62, net: 0.45, guc: 2.6, y: 0.8, yazi: 'BAM!' }
};
const USTA_SIRA = ['tokat', 'yumruk', 'tekme', 'ucan'];
const KUYRUK_EN = 10;   // bekleyen vuruş sınırı; fazlası anında küçük bir sarsıntıyla sayılır
const ASAMA_ADI = ['Karlı', 'Kayıyor', 'Çift görüntü', 'Siyah beyaz', 'Net, renkli'];

Object.assign(D, {
  netlik: 0.12, asama: 0, asamaB: -9, asamaYon: 0, netSabit: false, sonB: 0,
  kuyruk: [], ist: null, kuleIs: null, usta: null,
  tv: { sqL: 0, vL: 0, sqR: 0, vR: 0, sqT: 0, vT: 0, sh: 0, vsh: 0, jy: 0, vy: 0, ant: 0, vant: 0, kule: 0, vkule: 0 },
  flas: 0, efekt: [], toz: [], izler: [], dugme: null, gol: null, golB: -99, skor: [0, 0], sevincB: -9, uzuntuB: -9,
  kipirdamaB: -9, sonVuran: null, temasSay: 0, dondurU: null
});

/* ---- diziliş ---- */
function oyunYerlesim() {
  D.sira.forEach((k, i) => {
    if (i === 0) {
      k.hedefX = KULE.x;
      k.hedefZ = KULE.z;
      return;
    }
    const y = YERLER[Math.min(i - 1, YERLER.length - 1)];
    k.hedefX = y[0];
    k.hedefZ = y[1];
  });
}
// Yeni gelen kapıdan girer gibi yandan, kendi sırasının hizasından gelir.
function oyunGiris(k) {
  k.x = (k.hedefX >= 0.1 ? 1 : -1) * 3.6;
  k.z = k.hedefZ;
  k.y0 = 0;
}

/* ---- hediyeler ---- */
// Hediye sıraya girer. Aynı kişinin bekleyen aynı vuruşu varsa üst üste sayılır (en çok 5): seri hediyede
// aynı kişi art arda vurur. Sıra dolarsa vuruş anında, küçük bir sarsıntıyla sayılır (görüntü yine düzelir).
function oyunHediye(k, jeton, kd) {
  if (kd.tip === 'usta') {
    konfeti(70, 0.8);
    D.sarsinti = 0.6;
    // Sırada zaten iki usta varsa ya da sıra doluysa gösteri beklemez: görüntü anında büyük ölçüde düzelir.
    if (D.kuyruk.filter(e => e.tip === 'usta').length >= 2 || D.kuyruk.some(e => e.k === k && e.tip === 'usta')) {
      netlikEkle(0.5);
      tvItki(-1, 2.6, 'yan');
      return;
    }
    D.kuyruk = D.kuyruk.filter(e => e.k !== k);
    if (D.kuyruk.length >= KUYRUK_EN) {
      const at = D.kuyruk.pop();
      netlikEkle(VURUS[at.tip] ? VURUS[at.tip].net * 0.6 : 0.3);
    }
    D.kuyruk.unshift({ k, tip: 'usta', adet: 1 });
    return;
  }
  const tip = VURUS[kd.tip] ? kd.tip : 'tokat';
  const ayni = D.kuyruk.find(e => e.k === k && e.tip === tip);
  if (ayni) {
    ayni.adet = Math.min(5, ayni.adet + 1);
    return;
  }
  if (D.kuyruk.length >= KUYRUK_EN) {
    netlikEkle(VURUS[tip].net * 0.6);
    tvItki(Math.random() < 0.5 ? -1 : 1, VURUS[tip].guc * 0.5, 'yan');
    return;
  }
  D.kuyruk.push({ k, tip, adet: 1 });
}
// Anten el değiştirir: eski lider yığından iner, yeni lider çıkar. Arada anten boşta kalır, görüntü karlanır.
function oyunLiderDegisti(eski, yeni) {
  pankart('Anten el değiştirdi', yeni.ad + ' tutuyor. Kıpırdama!');
  netlikEkle(-0.12);
  D.tv.vant += 3;
  D.flas = Math.max(D.flas, 0.7);
  D.kipirdamaB = B;
  konfeti(40, 0.6);
}
function oyunBaslat() {
  for (const k of D.sira) {
    k.x = k.hedefX;
    k.z = k.hedefZ;
    k.y0 = k === D.lider ? KULE.h : 0;
    k.yer = 1;
    k.yon = k === D.lider ? KULE.yon : Math.PI;
    k.yeni = -9;
  }
  D.sonB = B;
}
function oyunBosalt() {
  D.kuyruk.length = 0;
  D.ist = D.kuleIs = D.usta = D.gol = D.dugme = null;
  D.efekt.length = D.toz.length = D.izler.length = 0;
  D.netlik = 0.12;
  D.asama = 0;
  D.flas = 0;
  D.golB = -99;
  D.skor = [0, 0];
  muzik.sov = false;
  for (const a in D.tv)
    D.tv[a] = 0;
}
function oyunDurum(d) {
  d.netlik = +D.netlik.toFixed(3);
  d.asama = D.asama;
  d.asamaAd = ASAMA_ADI[D.asama];
  d.kuyruk = D.kuyruk.length;
  d.vuran = D.ist ? { ad: D.ist.k.ad, tip: D.ist.tip, faz: D.ist.faz } : null;
  d.kuleVuran = D.kuleIs ? { ad: D.kuleIs.k.ad, tip: D.kuleIs.tip, faz: D.kuleIs.faz } : null;
  d.antenTutan = D.lider && D.lider.y0 > KULE.h * 0.8 ? D.lider.ad : null;
  d.temas = D.temasSay;
  d.gol = D.skor[0];
  d.usta = D.usta ? D.usta.k.ad : null;
  d.dugmeUcuyor = !!D.dugme;
  d.tvEkran = tvEkranKutusu();
  const o = tvP([(EKRAN.x0 + EKRAN.x1) / 2, TV_UST - (EKRAN.y0 + EKRAN.y1) / 2, TV_ON]);
  d.ekranOrta = { x: o.x, y: o.y, s: o.s };
  d.ezilme = +(D.tv.sqL + D.tv.sqR + D.tv.sqT).toFixed(3);
}

/* ---- görüntü ---- */
function netlikEkle(m) {
  D.netlik = clamp(D.netlik + m, 0.03, 1);
}
// Basamaklar 0,2'lik dilimler: karlı / kayan / çift görüntü / siyah beyaz / renkli.
function asamaHesap(n) { return n < 0.2 ? 0 : n < 0.4 ? 1 : n < 0.6 ? 2 : n < 0.8 ? 3 : 4; }
function gol(ad) {
  D.gol = { b0: B, ad };
  D.golB = B;
  D.skor[0]++;
  D.sevincB = B + 4;
  konfeti(90, 0.8);
  D.sarsinti = Math.max(D.sarsinti, 0.4);
}
