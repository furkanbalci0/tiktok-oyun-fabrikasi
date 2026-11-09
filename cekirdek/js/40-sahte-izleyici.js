/* SAHTE İZLEYİCİ — yayın açık değilken denemek için uydurma adlar ve yorumlar üretir.
 * Gerçek yayın kipinde (köprüden açılınca) kendiliğinden kapanır; sahnede sahte ad görünmez.
 */
const SAHTE_AD = ['halaysever06', 'kıvırcık_ayşe', 'davulcu.memo', 'zeyno.47', 'urfalı_bekir', 'gülizar_teyze', 'mert.can.21', 'elif_naz', 'dj_mahmut', 'karadenizli.cemo', 'sibel_abla', 'ozan_dayı', 'mardinli_rojin', 'tuğçe.sk', 'hasan.usta', 'pınar_34', 'köyün_delisi', 'berfin_gül', 'yusuf.63', 'nazlı_can', 'apo_halay', 'şahin_k', 'melo.27', 'damat_tarafı', 'gelinin_kuzeni', 'fatoş_01', 'efe_tr', 'cano_23', 'zilan.d', 'hüso_baba', 'ayten_hanım', 'kemo_44', 'deniz.yıldızı', 'rıza_amca', 'sude_nur', 'baran.21', 'ipek_böceği', 'muhtar_emmi', 'selo_02', 'songül.k', 'laz_ziya', 'egeli_duru', 'bozkır_ali', 'nur.sena'];
const SAHTE_YORUM = ['halay!', 'ben de geldim', 'çek çek çek', 'Diyarbakır’dan selamlar', 'mendil bende kalsın', 'davulcu coştur', 'halay başı kim ya', 'yer açın geliyorum', 'omuzlar omuzlar', 'bu hava çok iyi', 'Antep buradaa', 'kolum koptu ama bırakmam', 'sıraya girin', 'hoppa!', 'zurnacıya bir çay', 'anneme gösteriyorum', 'düğün var düğün', 'adımı gördüm', 'İzmir’den geldim', 'çök çök çök'];
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
  else if (r < 0.94) {
    const q = Math.random();
    olay({ tip: 'hediye', kullanici: kim, jeton: q < 0.6 ? 1 : q < 0.85 ? 10 : q < 0.955 ? 50 : q < 0.993 ? 200 : 1000 });
  }
  else
    olay({ tip: 'takip', kullanici: kim });
}
setInterval(() => { otoAdim(0.1); muzik.planla(document.hidden ? 1.6 : 0.2); }, 100);
