/* AYAR — Gelin Konvoyu oyununun bütün yazıları, hediye kademeleri, açılış kalabalığı ve sahte yorumları.
 * Derlemede HER ZAMAN İLK dosyadır; çekirdek OYUN'u buradan okur (docs/KANCALAR.md).
 * Oyun: yorum yazan izleyici kendi arabasıyla konvoya katılır, tavandan çıkıp el sallar. En çok hediye atanın
 * arabası gelin arabasıdır: en önde, kurdeleli, çiçekli. Hediyeler korna, zigzag, havai fişek ve drift yaptırır.
 */
const OYUN = {
  id: 'konvoy',
  ad: 'Gelin Konvoyu',
  logo: ['Gelin', 'Konvoyu'],
  nasil: { yorum: 'Yorum: konvoya katıl', begeni: 'Beğeni: gaz', hediye: 'Hediye: gelin arabası' },
  yazi: {
    sira: 'Konvoy sırası', gosterge: 'Gaz', bos: 'Yol boş. İlk yazan gelin arabasına biner.',
    birim: 'araba', ses: 'Davul zurnayı başlat', sahne: 'Gelin konvoyu sahnesi', giris: 'konvoya katılır', bosalt: 'Yolu boşalt'
  },
  kapasite: 36,
  // Büyükten küçüğe. tip, oyunHediye'nin hangi etkiyi başlatacağını seçer; etki paneldeki tabloda yazar.
  kademe: [
    { min: 1000, ad: 'Drift şov', tip: 'drift', etki: 'Gönderenin arabası en öne çıkar, dönerek drift atar' },
    { min: 200, ad: 'Havai fişek', tip: 'fisek', etki: 'Gökte havai fişekler patlar, davul coşar' },
    { min: 50, ad: 'Sağ sol', tip: 'zigzag', etki: 'Bütün konvoy sağa sola kıvrılır' },
    { min: 10, ad: 'Hep beraber korna', tip: 'korna', etki: 'Bütün arabalar korna çalar, farlar yanıp söner' },
    { min: 1, ad: 'Korna', tip: 'tek', etki: 'Gönderenin arabası korna çalıp zıplar' }
  ],
  tohum: [['zeyno.47', 320], ['urfalı_bekir', 140], ['gülizar_teyze', 60], ['dj_mahmut', 25], ['elif_naz', 10], ['hasan.usta', 5], ['pınar_34', 0], ['damat_tarafı', 0], ['berfin_gül', 0]],
  sahteAd: ['damat_tarafı', 'gelinin_kuzeni', 'zeyno.47', 'urfalı_bekir', 'gülizar_teyze', 'mert.can.21', 'elif_naz', 'dj_mahmut', 'karadenizli.cemo', 'sibel_abla', 'ozan_dayı', 'mardinli_rojin', 'tuğçe.sk', 'hasan.usta', 'pınar_34', 'şoför_nevzat', 'berfin_gül', 'yusuf.63', 'nazlı_can', 'korna_kemal', 'şahin_k', 'melo.27', 'sağdıç_emre', 'fatoş_01', 'efe_tr', 'cano_23', 'zilan.d', 'hüso_baba', 'ayten_hanım', 'kemo_44', 'deniz.yıldızı', 'rıza_amca', 'sude_nur', 'baran.21', 'ipek_böceği', 'muhtar_emmi', 'selo_02', 'songül.k', 'laz_ziya', 'egeli_duru', 'bozkır_ali', 'nur.sena'],
  sahteYorum: ['konvoya ben de varım', 'korna çalın!', 'düt düüüt', 'gelin arabası kimde', 'sağ şeritten geliyorum', 'Bursa’dan selamlar', 'damat nerede ya', 'yavaş abi yavaş', 'kurdeleyi bağladım', 'selektör yak', 'davul zurna nerede', 'maşallah gelinimize', 'en arkadayım', 'beni de alın', 'dörtlüleri yak', 'İzmir’den katıldım', 'şoför bey gaza bas', 'konvoy uzadıkça uzadı', 'adımı gördüm', 'drift atın!'],
  // Akşamüstü: mor gök, sıcak turuncu ışık. Mürekkep ve açık ton çekirdeğinkiyle aynı kalır (stil dosyasındaki
  // yarı saydam tonlar onlardan türetildi; docs/KANCALAR.md).
  renk: { zemin: '#1a1233', zemin2: '#2a1b4a', zemin3: '#3d2862', cizgi: '#55407e', vurgu: '#ffd166', sicak: '#ef5a3c', serin: '#2fc4b2', soluk: '#c4b3dc' },
  // Araba + tavandan çıkan kişi insan boyundan uzun: arkadakinin adının üstüne daha çok pay.
  kamera: { egim: 0.55, ustPay: 1.9, altPay: 0.3 }
};
