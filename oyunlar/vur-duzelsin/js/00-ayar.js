/* AYAR — Vur Düzelsin! oyununun bütün yazıları, hediye kademeleri, açılış kalabalığı ve sahte yorumları.
 * Derlemede HER ZAMAN İLK dosyadır; çekirdek OYUN'u buradan okur (docs/KANCALAR.md).
 * Oyun: seksenlerden kalma bir oturma odası. Ortada görüntüsü giden tüplü televizyon, maç başlamak üzere.
 * Yorum yazan televizyonun başına toplanır. Hediye atan televizyona gidip tokat, yumruk, tekme atar; her
 * vuruşta görüntü biraz düzelir, kendi kendine yine bozulur. En çok hediye atan sandalyenin üstüne çıkıp
 * anteni tutar ("tut, kıpırdama!"). Televizyon bir eşyadır: sarsılır, ezilip esner, karlanır; kimse incinmez.
 */
const OYUN = {
  id: 'vur-duzelsin',
  ad: 'Vur Düzelsin!',
  logo: ['Vur', 'Düzelsin!'],
  nasil: { yorum: 'Yorum: TV başına', begeni: 'Beğeni: tezahürat', hediye: 'Hediye: vur!' },
  yazi: {
    sira: 'Anten sırası', gosterge: 'Tezahürat', bos: 'Oda boş. İlk yazan anteni tutar.',
    birim: 'kişi', ses: 'Müziği başlat', sahne: 'Vur Düzelsin oturma odası', giris: 'TV başına gelir', bosalt: 'Odayı boşalt'
  },
  // Oturma odası: televizyon kadrajın yarısını tutsun diye kalabalık 24 kişiyle sınırlı (36 kişide TV küçülüyordu).
  kapasite: 24,
  // Büyükten küçüğe. tip, oyunHediye'nin hangi vuruşu başlatacağını seçer; etki paneldeki tabloda yazar.
  kademe: [
    { min: 1000, ad: 'Usta işi', tip: 'usta', etki: 'Gönderen sahneyi alır: tokat, yumruk, tekme, uçan tekme; görüntü bir anda net, gol olur' },
    { min: 200, ad: 'Uçan tekme', tip: 'ucan', etki: 'Gönderen koşup uçan tekme atar; düğme fırlar, görüntü çok düzelir' },
    { min: 50, ad: 'Tekme', tip: 'tekme', etki: 'Gönderen televizyonun yanına tekme atar' },
    { min: 10, ad: 'Yumruk', tip: 'yumruk', etki: 'Gönderen televizyona yumruk atar' },
    { min: 1, ad: 'Tokat', tip: 'tokat', etki: 'Gönderen televizyona tokat atar' }
  ],
  tohum: [['zeyno.47', 320], ['tamirci_rıza', 120], ['gülizar_teyze', 60], ['dj_mahmut', 15], ['elif_naz', 5], ['hasan.usta', 0], ['pınar_34', 0], ['berfin_gül', 0]],
  sahteAd: ['tamirci_rıza', 'gülizar_teyze', 'zeyno.47', 'urfalı_bekir', 'mert.can.21', 'elif_naz', 'dj_mahmut', 'karadenizli.cemo', 'sibel_abla', 'ozan_dayı', 'mardinli_rojin', 'tuğçe.sk', 'hasan.usta', 'pınar_34', 'kapıcı_nevzat', 'berfin_gül', 'yusuf.63', 'nazlı_can', 'antenci_kemal', 'şahin_k', 'melo.27', 'komşu_emre', 'fatoş_01', 'efe_tr', 'cano_23', 'zilan.d', 'hüso_baba', 'ayten_hanım', 'kemo_44', 'rıza_amca', 'sude_nur', 'baran.21', 'muhtar_emmi', 'selo_02', 'songül.k', 'laz_ziya', 'egeli_duru', 'nur.sena'],
  sahteYorum: ['vur vur düzelir', 'anteni oynatma!', 'maç başlıyor koşun', 'görüntü geldi gitti', 'tepesine vur abi', 'karıncalandı yine', 'ses var görüntü yok', 'folyo sar folyo', 'bir tokat daha', 'yan tarafına vur', 'geldi geldi… gitti', 'kıpırdama!', 'babam böyle düzeltirdi', 'tüplü tv efsane', 'çay koyan var mı', 'kanal kaydı', 'sağa çevir anteni', 'gol olacak gol', 'çocuklar sessiz olun', 'ben de vurayım'],
  // Seksenler oturma odası: hardal duvar kâğıdı, ceviz kaplama, kırmızı halı, ekranın soğuk mavi ışığı.
  // Mürekkep ve açık ton çekirdeğinkiyle aynı kalır (stil dosyasındaki yarı saydam tonlar onlardan türetildi).
  renk: { zemin: '#2a1712', zemin2: '#43251a', zemin3: '#6a3b25', cizgi: '#8c5636', vurgu: '#ffc947', sicak: '#e4572e', serin: '#56c7c0', soluk: '#d8b896' },
  // Televizyon yıldız: kamera ona yakın durur. Antenin ucu ve anteni tutanın başı için üstte pay.
  kamera: { egim: 0.7, F: 1400, ustPay: 1.6, altPay: 0.12 }
};
