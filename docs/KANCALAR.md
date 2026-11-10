# Çekirdek ile oyun arasındaki sözleşme

Bu depo bir fabrikadır: **çekirdek** her TikTok yayın oyununda aynı kalan işi yapar, **oyun** yalnız kendine
özgü olanı yazar. Bu belge ikisi arasındaki sınırı tanımlar. Yeni oyun yazan (insan ya da ajan) çekirdeğe
dokunmaz; burada adı geçen kancaları doldurur.

## Depo düzeni

```
cekirdek/
  sayfa.html, stil.css      sayfa iskeleti (sahne + yayın masası paneli); metinler OYUN ayarından doldurulur
  js/NN-*.js                çekirdek parçaları (aşağıda)
  test/                     ortak.js, cekirdek.test.js (her oyuna uygulanır), kopru.test.js
oyunlar/<ad>/
  oyun.json                 { "ad": "Görünen Ad", "paket": "dosya-adi" }
  js/00-ayar.js             const OYUN = { … }  (HER ZAMAN İLK birleştirilir)
  js/NN-*.js                oyunun kancaları ve kendi çizimi
  test.js                   (isteğe bağlı) oyuna özgü kontroller
  oyun.html                 ÜRETİLİR (derleme çıktısı; depoda durur)
sablon/                     en küçük çalışan oyun; `araclar/yeni-oyun.js` bunu kopyalar
araclar/                    derle.js, test.js, yeni-oyun.js, kare-cek.js, paket.js, muzik-hazirla.py
kopru.js, BASLAT.bat        TikTok köprüsü ve Windows başlatıcısı
```

## Derleme

`node araclar/derle.js <ad>` şu sırayla tek bir kapalı işlevin içine birleştirir ve `oyunlar/<ad>/oyun.html`
yazar:

1. `oyunlar/<ad>/js/00-ayar.js`
2. `cekirdek/js/*.js` (ada göre sıralı)
3. `oyunlar/<ad>/js/` altındaki diğer dosyalar (ada göre sıralı)

Hepsi aynı kapalı işlevde olduğu için parçalar birbirinin adlarını doğrudan görür; `import` / `export` yoktur.
İşlev bildirimleri (`function ad() {}`) dosya sırasından bağımsız çağrılabilir; `const` / `let` ise ancak
tanımlandığı satır çalıştıktan sonra kullanılabilir. Bu yüzden `OYUN` ilk dosyadadır, kancalar işlev
bildirimi olarak yazılır. Açılış (`oyunBaslat` ve ilk kare) bütün dosyalar çalıştıktan sonra, bir mikro görevde
yapılır: oyunun kendi dosyalarındaki üst düzey `const` / `let` adları kancalar çağrıldığında hazırdır.
Oyunun üst düzeyde `D`'ye alan eklemesi (`Object.assign(D, { … })`) de böylece açılıştan önce olur.

Derleme zorunlu kancalardan biri işlev bildirimi olarak bulunmazsa adını yazıp durur.

Diğer komutlar: `node araclar/derle.js --hepsi` (ad verilmezse de böyle), `node araclar/derle.js --denetle [ad]`
(çıktı güncel değilse 1 ile çıkar; ad yoksa her oyun), `node araclar/derle.js <ad> --parca yol.html`
(html / head / body etiketsiz parça). Sekme başlığı `oyun.json`daki `ad`dır.

## Değişmez adlar

| Ad | Ne |
| --- | --- |
| `window.CanliOyun` | dışarıya açık arayüz: `olay`, `durum`, `baglan`, `kes`, `cevir`, `_test` |
| `window.OYUN_KOPRU` | köprünün sayfaya yazdığı WebSocket adresi |
| `window.OYUN_MUZIK` | `muzik/liste.js` içindeki hazır parça listesi |
| `window.OYUN_MUZIK_KAPALI` | doğruysa `muzik/` klasörü yok sayılır (testler kullanır) |

## Oyunun ayarı: `OYUN`

```js
const OYUN = {
  id: 'mendil-kimde',                    // ASCII; tarayıcı saklama anahtarlarının öneki
  ad: 'Mendil Kimde?',
  logo: ['Mendil', 'Kimde?'],            // ikinci parça vurgu rengiyle yazılır
  nasil: { yorum: 'Yorum: halaya gir', begeni: 'Beğeni: tempo', hediye: 'Hediye: mendil' },
  yazi: {
    sira: 'Halay sırası', gosterge: 'Coşku', bos: 'Meydan boş. İlk yazan mendili alır.',
    birim: 'kişi', ses: 'Davul zurnayı başlat', sahne: 'Halay sahnesi', giris: 'halaya girer'
  },
  kapasite: 36,                          // sahnede aynı anda en çok kaç izleyici
  kademe: [                              // BÜYÜKTEN KÜÇÜĞE; sonuncunun min değeri 1 olmalı
    { min: 1000, ad: 'Meydan senin', tip: 'solo', etki: 'Gönderen ortaya çıkar, tek başına oynar' },
    { min: 1, ad: 'Zıpla', tip: 'zipla', etki: 'Gönderen zıplar' }
  ],
  tohum: [['zeyno.47', 320], ['elif_naz', 10]],   // deneme açılışındaki sahte kalabalık: [ad, jeton]
  sahteYorum: ['halay!', 'çek çek çek'],          // sahte izleyicinin yazdıkları
  sahteAd: ['halaysever06'],             // isteğe bağlı: sahte izleyici adları (yoksa çekirdeğin genel listesi)
  renk: {},                              // isteğe bağlı: tema renklerini ezer (aşağıda)
  kamera: {}                             // isteğe bağlı: { egim, F, enYakin, ustPay, altPay } varsayılanlarını ezer
};
```

`yazi` içinde ayrıca isteğe bağlı `bosalt` (paneldeki boşaltma düğmesi) vardır. Eksik `yazi` alanları genel
karşılıklarıyla doldurulur. Kademeler çekirdekte büyükten küçüğe sıralanır ve en küçüğünün `min`'i 1'e çekilir.
Sahte izleyici hediyeyi kademelerden seçer: en büyüğü %0,7, ikincisi %3,8, üçüncüsü %10,5, dördüncüsü %25,
kalanı en küçüğü. `kamera.enYakin` verilmezse `F / 190`; `ustPay` (1.5) en arkadakinin ayağından adının üstüne,
`altPay` (0.15) en öndekinin ayağının altına bırakılan pay (metre).

Tema renkleri (`RENK`, CSS'te aynı adla `--zemin` vb.): `zemin`, `zemin2`, `zemin3`, `cizgi`, `vurgu`,
`sicak`, `serin`, `acik`, `soluk`, `murekkep`. `#rrggbb` biçiminde verilir. Çekirdek sahne üstü yazıları ve
etiketleri bunlarla boyar; panel açılışta CSS değişkenlerine (`--zemin-2` …) yazar. Uyarı: stil dosyasındaki
yarı saydam tonlar (`rgba(8,10,28,…)`, `rgba(246,236,217,…)`) eski yayın tarayıcılarında da çalışsın diye düz
yazılmıştır; `murekkep` ya da `acik` çok değişirse bu tonlar temadan ayrışır.

## Kancalar (oyun bunları işlev bildirimi olarak tanımlar)

| Kanca | Ne zaman | Ne yapar |
| --- | --- | --- |
| `oyunBaslat(kayit)` | açılışta, tohum kalabalık kurulduktan sonra | Oyunun kendi durumunu kurar, oyuncuları yerine koyar, arka planı hazırlar |
| `oyunBosalt()` | "boşalt" düğmesinde, oyuncular silindikten sonra | Oyunun kendi durumunu sıfırlar |
| `oyunGiris(k)` | yeni izleyici katıldığında (`siraGuncelle` sonrası) | Giriş konumunu verir (`k.x`, `k.z`); sahneye dışarıdan gelsin |
| `oyunYerlesim()` | sıra her değiştiğinde | `D.sira` içindeki herkesin hedef yerini hesaplar |
| `oyunHediye(k, jeton, kademe)` | hediye sayıldıktan, sıra güncellenmeden önce | Kademenin sahnedeki etkisini başlatır |
| `oyunLiderDegisti(eski, yeni)` | `D.lider` değişince | Rol devri: pankart, konfeti, işaretin el değiştirmesi |
| `oyunGuncelle(dt)` | her kare, müzik saatinden sonra | Hareket ettirir, süreleri ilerletir, eklemleri kurar |
| `oyunKamera()` | her kare | Kadraja girmesi gereken yer noktalarını döndürür: `[[x, z], …]` |
| `oyunZemin()` | her kare, kamera kurulduktan sonra | Arka planı ve zemini doğrudan `c` ile çizer (gölgeler dahil) |
| `oyunCiz()` | her kare, çizim listesi boşaltıldıktan sonra | Sahnedeki her şeyi çizim listesine ekler (`kap`, `ozel`, `insanEkle`) |
| `oyunUst(dt)` | isteğe bağlı; liste çizildikten sonra | Listenin üstüne çizilenler (uçan nesne, ışık) |
| `oyunEkAdlar()` | isteğe bağlı | Etiketi olacak izleyici olmayan oyuncuları döndürür (`ozel: true`, `ad`, `et`) |
| `oyunDurum(d)` | isteğe bağlı; `CanliOyun.durum()` içinde | Duruma oyuna özgü alan ekler |

Çekirdeğin her karede yaptıkları (sırayla): müzik saati (`B`) → coşkunun sönmesi → boşta kalanı çıkarma →
`oyunGuncelle` → çıkanları silme → `kameraSigdir(oyunKamera())` → `oyunZemin` → `oyunCiz` → listeyi derinliğe
göre çizme → `oyunUst` → ad etiketleri ve konuşma balonları → konfeti / kalpler → kenar karartması →
sahne üstü yazılar.

Ayrıntılar:
- Boşta kalan: 45 karede bir, `zaman - k.son` sınırı aşan bir kişi `cikar(k)` ile çıkar (24 kişiden kalabalıkta
  75 sn, değilse 240 sn; hediye atanın süresi `jeton × 4` sn, en çok 600 sn uzar). Lider ve `k.yildiz` çıkarılmaz.
- Çıkanları silme: `k.cikiyor` olan, 1,7 sn geçince ya da oyun `k.gitti = true` deyince `D.oy`'dan silinir.
  Çıkan oyuncuyu sahneden götürmek `oyunGuncelle`'nin işidir.
- `oyunCiz` çağrılmadan önce her izleyicinin `k.et`'i boşaltılır; o karede çizilmeyenin etiketi çıkmaz.
- Çizim listesi `oyunZemin`'den SONRA boşaltılır: `oyunZemin` içinde `kap` / `top` / `ozel` ile eklenen şey
  çizilmez. Zeminde yalnız `c` ile doğrudan çiz; derinliğe göre sıralanması gereken her şeyi (ağaç, direk)
  `oyunCiz`'de ekle.
- `ozel(derinlik, fn)` içindeki `fn` liste çizilirken çalışır: içinden `kap` / `top` / `ozel` çağırma (liste o
  anda sıralanmış ve dönülüyor, sıra bozulur). `fn` içinde yalnız `c` ile doğrudan çiz. Araç gibi tek parça
  nesneler böyle çizilir: bir `ozel`, içinde `pr()` ile bulunan noktalara `c` çizimi.
- Açılıştaki tohum kalabalık için `oyunGiris` çağrılmaz; sıra `oyunYerlesim` → `oyunBaslat` olur. Oyuncuya
  kendi alanlarını ekliyorsan (araç rengi, binek) bunu tek bir "hazır mı" işlevinde yap ve `oyunYerlesim`,
  `oyunGiris`, `oyunBaslat` üçünden de çağır.
- Derlenen kod katı kipte çalışır (`'use strict'`): bildirilmemiş değişkene atama hata verir.
- Bir kancan hata verirse o kare yarım kalır ama döngü sürer: deneme görünümünde sahnenin ortasında kırmızı
  bir şerit hatanın iletisini yazar, hata konsola bir kez düşer. Karede kırmızı şerit görüyorsan önce onu
  düzelt; adların çıkmaması ya da kameranın yaklaşmaması çoğu zaman bunun sonucudur. Sık neden: bir alanın
  tanımsız kalıp hesabı `NaN` yapması. Yayın görünümünde (`#yayin`) şerit çizilmez.
- `kameraSigdir` her noktanın yanına 0,55 m pay ekler (bir insanın yarı genişliği). Daha geniş nesnede (araba)
  `oyunKamera`'dan nesnenin kenar noktalarını da döndür.
- `muzik.sov`'u çekirdek değiştirmez; oyun açıp kapatır (halay: `oyunHediye` ve `oyunGuncelle` içinde
  `muzik.sov = B < D.sovBit`).

## Çekirdeğin oyuna sunduğu adlar

**Durum**
- `D`: `oy` (kimlik → oyuncu `Map`), `sira` (jetona göre azalan dizi), `lider` (`sira[0]`), `cosku` (0–1),
  `begeni`, `sarsinti`. Oyun kendi alanlarını `D`'ye ekler.
- `zaman` (saniye), `B` (müzik vuruşu, kesirli; **tek saat budur**), `calgi` (`dumP`, `tekP`: vuruş anında 1'e
  çıkıp sönen nabızlar; `perde`), `muzik` (`sov` alanını oyun ayarlar: doğruysa tempo biraz artar).
- `OYUN`, `KADEME`, `MAKS`, `RENK`.

**Oyuncu `k`** (`karakterYap(id, ad)`): `id`, `ad`, `jeton`, `son` (son etkileşim), `katilim`, `sn` (sıradaki
yeri), `g` (görünüm), `x`, `z`, `y0`, `yon`, `yer` (0–1 yerine oturdu mu), `cikiyor`, `cikis` (çıkış zamanı),
`balon`, `zip0` / `zip1` (hediye sevincinin vuruş aralığı), `kos`, `j` (eklemler), `p` (ekrana düşmüş eklemler),
`f` / `l` (baktığı yön ve sol yanı; `iskeletKur` yazar), `mod` (izleyicide `'oyuncu'`), `yeni`, `et`
(etiketin ekrandaki yeri `{ x, y, s, d }`: başın tepesi, ölçek, derinlik; `insanEkle` kendisi kurar), `ozel`.
Oyunun yazdığı bayraklar:
- `yildiz`: öne çıkmış (halayda solo yapan). Boşta kalsa da çıkarılmaz, kalabalık dolunca yerinden edilmez,
  adı liderden sonra en öncelikli etikettir.
- `gitti`: çıkan oyuncu sahneden uzaklaştı, şimdi silinsin.
- `ozel`: izleyici olmayan oyuncu (çalgıcı, hakem): etiketi vurgu renginde ve öncelikli; sıradaki ilk beş payı yok.
- `guler` (hep güler), `ciddi` (hiç gülmez), `ufle` (yanaklar şişkin, ağız kapalı): `kafaCiz` bunlara bakar.
  Hiçbiri yoksa hediye sevinci süresince (`B < k.zip1`) ve `D.cosku > 0.72` iken güler.

**Olaylar ve yazılar:** `olay(o)`, `katil(id, ad, zorla)`, `cikar(k)`, `siraGuncelle()`, `bildir(ad, orta,
vurgu)`, `pankart(satir1, satir2)`, `gunluk(tur, ad, metin, hediye, id)` (son ikisi isteğe bağlı: `hediye` satırı
altın renkte yazar, `id` verilirse satırda yayıncının Gizle / Çıkar düğmeleri olur), `konfeti(adet, guc)`, `kalpAt(adet)`.

**Sahne:** `c` (2B çizim bağlamı, 720×1280 sanal ölçekte), `GW`, `GH`, `ALAN_UST`, `ALAN_ALT`, `kam`,
`pr([x, y, z])` → `{ x, y, s, d, ok }`, `kap(pa, ra, pb, rb, renk, derinlik)` (iki ucu farklı yarıçaplı kapsül),
`top(p, r, renk, derinlik, cizgi)` (`cizgi`: isteğe bağlı çizgi kalınlığı), `ozel(derinlik, fn)`, `kapYol(...)`,
`golge(x, z, rx, rz)`, `ik(...)`, `renkSaydam('#rrggbb', a)`, `MUREKKEP`. Derinlikte büyük sayı uzak demektir;
eşit derinlikler eklendikleri sırayla çizilir. Çekirdeğin kendi çağırdıkları: `kameraSigdir(noktalar, dt)`
(sonunda `kam.son = { enX, hd }`: en geniş `|x|` ve derinliğin yarısı; zemini kalabalığa göre büyütmek için),
`listeCiz()`, `etiketCiz(ekler)`, `kenarKarart()`.

**İnsan takımı** (izleyici insan olarak çizilecekse): `gorunumUret(id)`, `iskeletKur(k, poz)`, `kolKur(k)`,
`pozBekle(k)` (vuruşla sallanan bekleme pozu), `insanEkle(k)` (gövde + baş; `k.et` kurulur), `kafaCiz(k, ph)`
(yalnız baş; araç penceresi gibi yerlerde), ölçüler `KALCA`, `GOGUS`, `KAFA_Y`, `KAFA_R`, `BACAK`, `KOL`.
- `poz = { hipX, hipY, egim, yat, omL, omR, aS, aL }`: kalçanın yana kayması ve yüksekliği (`KALCA` ayakta),
  öne eğilme, yana yatma, omuzların kalkması, sağ / sol ayak `[yana, ileri, yukarı]` (karakterin yerel ekseninde).
- `iskeletKur(k, poz)` `k.x`, `k.z`, `k.y0`, `k.yon` ve boydan eklemleri kurar; `W(yana, yukarı, ileri)` yerel →
  dünya çeviricisini döndürür (ayrıca `k._W`, `k._hipX`, `k._hipY`). Elleri (`k.j.haL`, `k.j.haR`) çağıran
  `W` ile koyar, sonra `kolKur(k)`.
- `insanEkle(k)` çizildiyse `true` döner; `k.p` o zaman o karenin ekran noktalarıdır (oyunun `k.j`'ye eklediği
  çalgı gibi eklemler de dahil), üstüne çalgı ya da eşya bu noktalarla eklenir.

**Yardımcılar:** `TAU`, `HP`, `clamp`, `lerp`, `yumusak`, `basamak`, `ozet`, `rastgeleUret`, `aciFark`,
`azHareket`, `$`.

**Dışarıya açık arayüz:** `CanliOyun.durum()` → `{ oyun, kisi, lider, cosku, begeni, vurus, sira: [[ad, jeton]…],
kareMs, parca, bagli, alinan, hava, ses }` ve `oyunDurum(d)`'nin ekledikleri. `CanliOyun._test` → `{ D, muzik,
Muzik, HAVALAR, ayar, OYUN, KADEME, zamanEkle(sn), zaman() }`.

## Testler

`node araclar/test.js [ad]`: verilen oyun (ya da `oyunlar/` altındaki her oyun) için `derle.js --denetle`,
`cekirdek/test/cekirdek.test.js <ad>`, varsa `oyunlar/<ad>/test.js <ad>`; en sonda bir kez
`cekirdek/test/kopru.test.js`. Ortak parçalar `cekirdek/test/ortak.js`'te: oyun adı ilk bağımsız değişkenden
(yoksa `halay`), sayfa `oyunlar/<ad>/oyun.html`, ekran görüntüleri `test/cikti/<ad>/`, `CHROME_PATH` desteklenir,
her sayfada `window.OYUN_MUZIK_KAPALI = true`.

## Oyunun uyması gerekenler

1. Dışarıdan gelen her şey `olay(o)` üzerinden girer; oyun `D`'yi başka girişten değiştirmez.
2. İzleyici metni asla HTML olarak yazılmaz: sayfaya `textContent`, tuvale `fillText`.
3. Sahnenin `ALAN_UST`–`ALAN_ALT` şeridi oyuncularındır. Üstü sahne yazıları, altı (1024 ve sonrası)
   TikTok'un yorum alanıdır; oraya bir şey çizme.
4. Hareket ve süreler vuruşla (`B`) ölçülür, saniyeyle değil. `B` geri gitmez.
5. Ses ve görsel üretimdir: depoya ses, görsel, hazır model eklenmez. Var olan bir şarkının notası yazılmaz.
6. `oyun.html` üretilir: `js/` değişince derle, ikisini birlikte işle.
7. Çekirdek testleri (`cekirdek/test/cekirdek.test.js <ad>`) her oyunda geçmelidir: yorum oyuna sokar, beğeni
   coşkuyu artırır, hediye sıralamayı değiştirir, en çok hediye atan liderdir, kalabalık `kapasite`de
   sınırlanır, 1080×1920'de en kalabalık hâlde kare başına işlem 33 ms'nin altındadır.

## Örnek

`oyunlar/halay/` bütün kancaları kullanan tam bir oyundur. `sablon/` aynı kancaların en yalın hâlidir:
izleyiciler sıra sıra dizilip kameraya bakar, vuruşla sallanır; hediye atan zıplar; lider önde, ortada, altın
halkanın üstünde durur. Yeni oyuna şablondan başla, halaya bakarak zenginleştir.
