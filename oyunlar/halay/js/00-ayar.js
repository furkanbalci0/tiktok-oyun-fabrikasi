/* AYAR — Mendil Kimde? oyununun bütün yazıları, hediye kademeleri, açılış kalabalığı ve sahte yorumları.
 * Derlemede HER ZAMAN İLK dosyadır; çekirdek OYUN'u buradan okur (docs/KANCALAR.md).
 */
const OYUN = {
  id: 'mendil-kimde',
  ad: 'Mendil Kimde?',
  logo: ['Mendil', 'Kimde?'],
  nasil: { yorum: 'Yorum: halaya gir', begeni: 'Beğeni: coşku', hediye: 'Hediye: mendil, müzik' },
  yazi: {
    sira: 'Halay sırası', gosterge: 'Coşku', bos: 'Meydan boş. İlk yazan mendili alır.',
    birim: 'kişi', ses: 'Davul zurnayı başlat', sahne: 'Halay sahnesi', giris: 'halaya girer', bosalt: 'Meydanı boşalt'
  },
  kapasite: 36,
  // Büyükten küçüğe. tip, oyunHediye'nin hangi hareketi başlatacağını seçer; etki paneldeki tabloda yazar.
  kademe: [
    { min: 1000, ad: 'Meydan senin', tip: 'solo', etki: 'Gönderen ortaya çıkar, en hızlı tempoda tek başına oynar' },
    { min: 200, ad: 'Davulcu coşsun', tip: 'davul', etki: 'Davulcu coşar, sıradaki havaya geçilir' },
    { min: 50, ad: 'Çök', tip: 'cok', etki: 'Herkes çöker; tempo ağırlaşır, kalkarken patlar' },
    { min: 10, ad: 'Omuz', tip: 'omuz', etki: 'Herkes omuz titretir, tempo bir kademe hızlanır' },
    { min: 1, ad: 'Zıpla', tip: 'zipla', etki: 'Gönderen zıplar' }
  ],
  tohum: [['zeyno.47', 320], ['urfalı_bekir', 140], ['gülizar_teyze', 60], ['dj_mahmut', 25], ['elif_naz', 10], ['hasan.usta', 5], ['pınar_34', 0], ['köyün_delisi', 0], ['berfin_gül', 0]],
  sahteAd: ['halaysever06', 'kıvırcık_ayşe', 'davulcu.memo', 'zeyno.47', 'urfalı_bekir', 'gülizar_teyze', 'mert.can.21', 'elif_naz', 'dj_mahmut', 'karadenizli.cemo', 'sibel_abla', 'ozan_dayı', 'mardinli_rojin', 'tuğçe.sk', 'hasan.usta', 'pınar_34', 'köyün_delisi', 'berfin_gül', 'yusuf.63', 'nazlı_can', 'apo_halay', 'şahin_k', 'melo.27', 'damat_tarafı', 'gelinin_kuzeni', 'fatoş_01', 'efe_tr', 'cano_23', 'zilan.d', 'hüso_baba', 'ayten_hanım', 'kemo_44', 'deniz.yıldızı', 'rıza_amca', 'sude_nur', 'baran.21', 'ipek_böceği', 'muhtar_emmi', 'selo_02', 'songül.k', 'laz_ziya', 'egeli_duru', 'bozkır_ali', 'nur.sena'],
  sahteYorum: ['halay!', 'ben de geldim', 'çek çek çek', 'Diyarbakır’dan selamlar', 'mendil bende kalsın', 'davulcu coştur', 'halay başı kim ya', 'yer açın geliyorum', 'omuzlar omuzlar', 'bu hava çok iyi', 'Antep buradaa', 'kolum koptu ama bırakmam', 'sıraya girin', 'hoppa!', 'zurnacıya bir çay', 'anneme gösteriyorum', 'düğün var düğün', 'adımı gördüm', 'İzmir’den geldim', 'çök çök çök'],
  renk: {},
  kamera: {},
  // Pankart (mendil el değiştirdi, hava değişti) sıralama kutusunun üstünden değil altından geçer: kutu hep okunur.
  sahneYazi: { pankart: 'alt' },
  // Müzik: halayın davul zurnası ve üç havası (çekirdekteki davul-zurna takımının kendi havaları; docs/MUZIK.md).
  muzik: { takim: 'davul-zurna', havalar: ['harman', 'toz', 'cifte'] },
  // Tempo (çekirdeğin tempo kapısı, docs/KANCALAR.md): çarpan 1 = havanın kendi hızı. Halayda tempoyu hediyeler
  // yönetir: beğeninin (coşkunun) katkısı küçüktür. taban / tavan: tempo çarpanının hiç aşılmayan sınırları.
  tempo: { cosku: 0.08, taban: 0.88, tavan: 1.3 },
  // Hediyeyle müzik (22-hediye-muzik.js). Süreler vuruşladır, tempo payları çarpana eklenir (0.07 = %7).
  hediyeMuzik: {
    adim: 0.07, adimVurus: 16, adimEnCok: 3,   // omuz: bir tempo kademesi, kaç vuruş yaşar, en çok kaç kademe birikir
    cokAgir: 0.12, cokAgirVurus: 2,            // çök: çökerken ağırlaşma payı ve süresi
    cokPatlama: 0.2, cokPatlamaVurus: 6,       // çök: kalkarken hızlanma payı ve süresi
    havaAra: 24, havaSiraEnCok: 4              // davul: iki hava değişimi arasında en az vuruş, bekleyen değişim sınırı
  }
};
