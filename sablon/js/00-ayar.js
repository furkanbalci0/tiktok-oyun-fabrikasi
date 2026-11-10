/* AYAR — oyunun bütün yazıları, hediye kademeleri, açılış kalabalığı ve sahte yorumları.
 * Derlemede HER ZAMAN İLK dosyadır; çekirdek OYUN'u buradan okur. Alanların tamamı docs/KANCALAR.md'de.
 * Yeni oyuna başlarken önce id'yi değiştir: tarayıcıdaki saklama anahtarları bununla başlar, iki oyun
 * aynı id'yi taşırsa birbirinin sıralamasını görür.
 */
const OYUN = {
  id: 'sablon-oyun',                     // ASCII, tireli; oyun klasörünün adıyla aynı olması önerilir
  ad: 'Şablon Oyun',                     // sekme başlığı oyun.json'daki "ad"dan gelir; bu, sayfadaki addır
  logo: ['Şablon', 'Oyun'],              // sahnenin tepesindeki yazı; ikinci parça vurgu rengiyle yazılır
  // sahne üstündeki üç "nasıl oynanır" hapı (birini boş bırakırsan gizlenir)
  nasil: { yorum: 'Yorum: sahneye gir', begeni: 'Beğeni: coşku', hediye: 'Hediye: zıpla' },
  yazi: {
    sira: 'Sıralama',                    // sol üstteki ilk beşin başlığı
    gosterge: 'Coşku',                   // sağ üstteki çubuğun başlığı
    bos: 'Sahne boş. İlk yorumu yazan lider olur.',
    birim: 'kişi',                       // "36 kişi"
    ses: 'Müziği başlat',                // ses kapalıyken sahnede çıkan düğme
    sahne: 'Şablon oyun sahnesi',        // ekran okuyucu için tuvalin adı
    giris: 'sahneye girer',              // paneldeki "Yorum yaz" düğmesinin alt yazısı
    bosalt: 'Sahneyi boşalt'             // paneldeki boşaltma düğmesi
  },
  kapasite: 36,                          // sahnede aynı anda en çok kaç izleyici
  // Hediye kademeleri BÜYÜKTEN KÜÇÜĞE; en küçüğünün min değeri 1 olmalı.
  // ad: bildirimde ve panel düğmesinde yazar · tip: oyunHediye'de hangi etkinin çalışacağını seçer
  // etki: paneldeki tabloda "sahnede olan" sütunu
  kademe: [
    { min: 100, ad: 'Büyük zıplayış', tip: 'buyuk', etki: 'Gönderen iki kat yükseğe zıplar, konfeti yağar' },
    { min: 1, ad: 'Zıpla', tip: 'zipla', etki: 'Gönderen zıplar' }
  ],
  // deneme açılışındaki sahte kalabalık: [ad, jeton]. Gerçek yayında (köprüden açılınca) kullanılmaz.
  tohum: [['zeyno.47', 120], ['elif_naz', 40], ['hasan.usta', 10], ['pınar_34', 0], ['berfin_gül', 0], ['mert.can.21', 0]],
  // sahte izleyicinin yazdıkları (panelde "Otomatik izleyici" açıkken)
  sahteYorum: ['selam!', 'ben de geldim', 'adımı gördüm', 'zıpla zıpla', 'lider kim?', 'yer açın geliyorum'],
  renk: {},                              // isteğe bağlı: { vurgu: '#ffd166', zemin: '#0e1230', … } tema renklerini ezer
  kamera: {}                             // isteğe bağlı: { egim, F, enYakin } kameranın varsayılanlarını ezer
};
