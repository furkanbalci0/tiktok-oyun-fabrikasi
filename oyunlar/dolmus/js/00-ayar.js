/* AYAR — Müsait Bir Yerde oyununun bütün yazıları, hediye kademeleri, açılış kalabalığı ve sahte yorumları.
 * Derlemede HER ZAMAN İLK dosyadır; çekirdek OYUN'u buradan okur (docs/KANCALAR.md).
 * Oyun: yorum yazan izleyici dolmuşa biner. Hediye atanın parası elden ele şoföre uzatılır. En çok hediye atan
 * şoförün yanındaki ön koltuğa oturur. Dolmuş kesit olarak çizilir: yan duvarı ve tavanı açık, oyuncak ev gibi.
 * Kapasite 15: "14+1" dolmuşun 14 yolcu koltuğu ve ön koltuk (şoför izleyici değildir).
 */
const OYUN = {
  id: 'dolmus',
  ad: 'Müsait Bir Yerde',
  logo: ['Müsait Bir', 'Yerde'],
  nasil: { yorum: 'Yorum: dolmuşa bin', begeni: 'Beğeni: gaz', hediye: 'Hediye: şoföre uzat' },
  yazi: {
    sira: 'Ön koltuk sırası', gosterge: 'Gaz', bos: 'Dolmuş boş. İlk binen ön koltuğa oturur.',
    birim: 'yolcu', ses: 'Teybi aç', sahne: 'Dolmuş sahnesi', giris: 'dolmuşa biner', bosalt: 'Dolmuşu boşalt'
  },
  kapasite: 15,
  // Büyükten küçüğe. Her hediyede para elden ele şoföre gider; tip, ayrıca hangi etkinin başlayacağını seçer.
  kademe: [
    { min: 1000, ad: 'Müsait bir yerde!', tip: 'durak', etki: 'Dolmuş gönderen için durur; o ayağa kalkar, sahne onun' },
    { min: 200, ad: 'Sollama', tip: 'sollama', etki: 'Şoför gaza basıp sollar, herkes koltuğa yapışır' },
    { min: 50, ad: 'Kasis', tip: 'kasis', etki: 'Dolmuş kasise girer, bütün yolcular hoplar' },
    { min: 10, ad: 'Teybi aç', tip: 'teyp', etki: 'Şoför teybi açar, herkes başıyla tempo tutar' },
    { min: 1, ad: 'Uzatır mısınız?', tip: 'uzat', etki: 'Para elden ele şoföre uzatılır' }
  ],
  tohum: [['zeyno.47', 320], ['emekli_necati', 140], ['pazarcı_hatice', 60], ['öğrenci.elif', 25], ['berber_cemo', 10], ['hasan.usta', 5], ['pınar_34', 0], ['nur.sena', 0], ['simitçi_rıza', 0]],
  sahteAd: ['emekli_necati', 'pazarcı_hatice', 'öğrenci.elif', 'berber_cemo', 'simitçi_rıza', 'zeyno.47', 'mert.can.21', 'elif_naz', 'karadenizli.cemo', 'sibel_abla', 'ozan_dayı', 'mardinli_rojin', 'tuğçe.sk', 'hasan.usta', 'pınar_34', 'berfin_gül', 'yusuf.63', 'nazlı_can', 'şahin_k', 'melo.27', 'fatoş_01', 'efe_tr', 'cano_23', 'zilan.d', 'hüso_baba', 'ayten_hanım', 'kemo_44', 'deniz.yıldızı', 'sude_nur', 'baran.21', 'ipek_böceği', 'muhtar_emmi', 'selo_02', 'songül.k', 'laz_ziya', 'egeli_duru', 'bozkır_ali', 'nur.sena', 'son_durak_ayşe', 'kapı_önü_kemal'],
  sahteYorum: ['şoför bey müsait bir yerde', 'uzatır mısınız', 'iki tam bir öğrenci', 'para üstü?', 'arkaya ilerleyelim', 'ben de bindim', 'çarşıda inecem', 'teybi aç abi', 'yavaş kasis var', 'ön koltuk benim', 'abi bozuk yok', 'Kadıköy’den selamlar', 'ayakta yer var mı', 'adımı gördüm', 'beni de alın', 'hızlı git geç kaldım', 'son durak neresi', 'camı açar mısınız', 'kapı kapanmadı', 'şoföre bir çay'],
  // Öğle sonu, dar bir mahalle sokağı: hardal sarısı dolmuş, turkuaz şerit, pastel apartmanlar. Panel ve sahne
  // üstü yazılar koyu petrol mavisinden gelir; mürekkep ve açık ton çekirdeğinkiyle aynı kalır (KANCALAR.md).
  renk: { zemin: '#0f2a36', zemin2: '#163b4a', zemin3: '#1f5063', cizgi: '#2d6a7e', vurgu: '#ffc63a', sicak: '#e8553b', serin: '#2ec4b6', soluk: '#9cc4cc' },
  // Yukarıdan bakan kamera: dolmuşun içi (tavanı yok) ve iki koltuk sırası üst üste görünür. ustPay arka duvarın
  // tepesini, altPay yakın tekerlerin altını kadraja alır.
  kamera: { egim: 0.85, ustPay: 1.6, altPay: 0.1 }
};
