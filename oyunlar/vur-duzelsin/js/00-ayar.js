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
  // Oturma odası: televizyon kadrajın yarısını tutsun diye kalabalık 21 kişiyle sınırlı (36 kişide TV küçülüyordu;
  // önde tek sıra minder var, ikinci sıra yüzleri ve adları üst üste bindiriyordu).
  kapasite: 21,
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
  kamera: { egim: 0.62, F: 1400, ustPay: 2.1, altPay: 0.06 },
  // Müzik: maç gecesi, seksenler televizyon spor jeneriği (davul makinesi, synth bas, bakır nefesli, akor
  // vuruşları). İki özgün hava, sırayla döner. Yazım docs/MUZIK.md. Tempo vuruşların ve yürüyüşün hızını da belirler.
  muzik: {
    takim: 'mac',
    havalar: [
      { id: 'naklen', ad: 'Naklen Yayın', bpm: 112, spb: 4, bar: 16, tonik: 349.2,
        dizi: [0, 200, 400, 500, 700, 900, 1100],                       // majör
        davul: { ana: 'D...T...D.D.T...', cesni: 'D...T..DD.D.T..g', gecis: 'D...T...m.m.mmTT' },
        ust: { ana: 'h.h.h.h.h.h.h.ho', cesni: 'h.h.h.hoh.h.h.h.', gecis: 'h.h.h.h.o...o...' },
        bas: { ana: '1.8.1.8.1.8.1.8.', cesni: '1.8.1.8.1.8.5.8.', gecis: '1.8.1.8.5.5.8.8.' },
        akor: { ana: 'X.....x.......x.', cesni: 'X.....x...x.....', gecis: 'X.....x.X...X...' },
        bolum: {
          A: '0:2 2:2 4:4 7:3 6:1 5:4 | 4:2 5:2 4:2 2:2 4:6 -:2 | 5:2 6:2 7:2 5:2 4:3 2:1 4:4 | 1:2 2:2 3:2 1:2 0:6 -:2',
          B: '7:3 7:1 7:2 8:2 9:4 7:4 | 8:2 7:2 6:2 5:2 6:4 4:4 | 5:3 5:1 6:2 7:2 8:2 7:2 5:4 | 6:2 4:2 5:2 1:2 0:4 -:4',
          D: '-:16 -:16'
        },
        eslik: { A: '0:16 5:16 3:16 4:8 0:8', B: '0:16 4:16 1:16 4:8 0:8' },
        form: 'AABBD' },
      { id: 'tribun', ad: 'Tribün', bpm: 120, spb: 4, bar: 16, tonik: 293.66,
        dizi: [0, 200, 300, 500, 700, 900, 1000],                       // dorian
        davul: { ana: 'D...c...D..Dc...', cesni: 'D...c...D.Dmc.c.', gecis: 'D.m.c.m.mmmmc.cc' },
        ust: { ana: 'h...h...h...h...', gecis: 'h.h.h.h.h.h.h.h.' },
        bas: { ana: '1...1...1..51...', cesni: '1...1...1..58...', gecis: '1.1.5.5.8.8.5.5.' },
        akor: { ana: 'X...........x...', cesni: 'X.......x...x...', gecis: 'X...x...X...X...' },
        bolum: {
          A: '0:3 0:1 2:2 3:2 4:4 3:2 2:2 | 4:3 4:1 5:2 4:2 3:4 -:4 | 2:3 2:1 3:2 4:2 5:2 4:2 3:2 2:2 | 1:2 2:2 0:6 -:6',
          B: '7:4 6:2 5:2 6:4 4:4 | 5:4 4:2 3:2 4:6 -:2 | 3:2 4:2 5:2 6:2 7:3 6:1 5:4 | 4:2 2:2 1:2 -1:2 0:6 -:2',
          D: '-:16 -:16'
        },
        eslik: { A: '0:16 3:16 2:16 4:8 0:8', B: '0:16 6:16 3:16 4:8 0:8' },
        form: 'AABBD' }
    ]
  }
};
