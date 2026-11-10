/* SAHTE İZLEYİCİ — yayın açık değilken denemek için uydurma adlar ve yorumlar üretir.
 * Yorumlar OYUN.sahteYorum'dan, adlar OYUN.sahteAd'dan (yoksa aşağıdaki genel listeden) gelir.
 * Hediyeler oyunun kademelerinden seçilir: en büyüğü seyrek, en küçüğü sık.
 * Gerçek yayın kipinde (köprüden açılınca) kendiliğinden kapanır; sahnede sahte ad görünmez.
 */
const SAHTE_AD = OYUN.sahteAd && OYUN.sahteAd.length ? OYUN.sahteAd : ['kıvırcık_ayşe', 'zeyno.47', 'mert.can.21', 'elif_naz', 'dj_mahmut', 'karadenizli.cemo', 'sibel_abla', 'ozan_dayı', 'mardinli_rojin', 'tuğçe.sk', 'hasan.usta', 'pınar_34', 'berfin_gül', 'yusuf.63', 'nazlı_can', 'şahin_k', 'melo.27', 'fatoş_01', 'efe_tr', 'cano_23', 'zilan.d', 'hüso_baba', 'ayten_hanım', 'kemo_44', 'deniz.yıldızı', 'rıza_amca', 'sude_nur', 'baran.21', 'ipek_böceği', 'muhtar_emmi', 'selo_02', 'songül.k', 'laz_ziya', 'egeli_duru', 'bozkır_ali', 'nur.sena'];
const SAHTE_YORUM = OYUN.sahteYorum && OYUN.sahteYorum.length ? OYUN.sahteYorum : ['selam!', 'ben de geldim', 'adımı gördüm'];
// En büyük kademeden başlayarak her kademenin seçilme payı; kalan pay en küçük kademeye kalır.
const SAHTE_HEDIYE_PAY = [0.007, 0.038, 0.105, 0.25];
function sahteJeton() {
  let q = Math.random(), esik = 1;
  for (let i = 0; i < KADEME.length - 1; i++) {
    esik -= SAHTE_HEDIYE_PAY[i] || 0;
    if (q >= esik)
      return KADEME[i].min;
  }
  return KADEME[KADEME.length - 1].min;
}
const sec = a => a[Math.floor(Math.random() * a.length)];
function sahteKim() {
  const ad = temiz($('sahte-ad').value);
  if (ad)
    return { id: 'ben:' + ad, ad };
  const a = sec(SAHTE_AD);
  return { id: 'sahte:' + a, ad: a };
}
const HIZLAR = [{ ad: 'Sakin', sn: 2.2 }, { ad: 'Normal', sn: 0.9 }, { ad: 'Çılgın', sn: 0.28 }];
let oto = true, hiz = 0, otoSayac = 1;
function otoAdim(dt) {
  if (!oto)
    return;
  otoSayac -= dt;
  if (otoSayac > 0)
    return;
  otoSayac = HIZLAR[hiz].sn * (0.4 + Math.random() * 1.2);
  const a = sec(SAHTE_AD), kim = { id: 'sahte:' + a, ad: a }, r = Math.random();
  if (r < 0.5)
    olay({ tip: 'yorum', kullanici: kim, metin: sec(SAHTE_YORUM) });
  else if (r < 0.8)
    olay({ tip: 'begeni', kullanici: kim, adet: 3 + Math.floor(Math.random() * 14) });
  else if (r < 0.94)
    olay({ tip: 'hediye', kullanici: kim, jeton: sahteJeton() });
  else
    olay({ tip: 'takip', kullanici: kim });
}
setInterval(() => { otoAdim(0.1); muzik.planla(document.hidden ? 1.6 : 0.2); }, 100);
