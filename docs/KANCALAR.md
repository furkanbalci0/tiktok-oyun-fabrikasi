# Çekirdek ile oyun arasındaki sözleşme

Bu depo bir fabrikadır: **çekirdek** her TikTok yayın oyununda aynı kalan işi yapar, **oyun** yalnız kendine
özgü olanı yazar. Bu belge ikisi arasındaki sınırı tanımlar. Yeni oyun yazan (insan ya da ajan) çekirdeğe
dokunmaz; burada adı geçen kancaları doldurur.

## Depo düzeni

```
cekirdek/
  sayfa.html, stil.css      sayfa iskeleti (sahne + deneme paneli); metinler OYUN ayarından doldurulur
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
bildirimi olarak yazılır.

Diğer komutlar: `node araclar/derle.js --hepsi`, `node araclar/derle.js --denetle [ad]` (çıktı güncel değilse 1
ile çıkar), `node araclar/derle.js <ad> --parca yol.html` (html / head / body etiketsiz parça).

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
  renk: {},                              // isteğe bağlı: tema renklerini ezer (aşağıda)
  kamera: {}                             // isteğe bağlı: { egim, F, enYakin } varsayılanlarını ezer
};
```

Tema renkleri (`RENK`, CSS'te aynı adla `--zemin` vb.): `zemin`, `zemin2`, `zemin3`, `cizgi`, `vurgu`,
`sicak`, `serin`, `acik`, `soluk`, `murekkep`. Çekirdek sahne üstü yazıları ve etiketleri bunlarla boyar.

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

## Çekirdeğin oyuna sunduğu adlar

**Durum**
- `D`: `oy` (kimlik → oyuncu `Map`), `sira` (jetona göre azalan dizi), `lider` (`sira[0]`), `cosku` (0–1),
  `begeni`, `sarsinti`. Oyun kendi alanlarını `D`'ye ekler.
- `zaman` (saniye), `B` (müzik vuruşu, kesirli; **tek saat budur**), `calgi` (`dumP`, `tekP`: vuruş anında 1'e
  çıkıp sönen nabızlar; `perde`), `muzik` (`sov` alanını oyun ayarlar: doğruysa tempo biraz artar).
- `OYUN`, `KADEME`, `MAKS`, `RENK`.

**Oyuncu `k`** (`karakterYap(id, ad)`): `id`, `ad`, `jeton`, `son` (son etkileşim), `katilim`, `sn` (sıradaki
yeri), `g` (görünüm), `x`, `z`, `y0`, `yon`, `yer` (0–1 yerine oturdu mu), `cikiyor`, `balon`, `zip0` / `zip1`
(hediye sevincinin vuruş aralığı), `kos`, `j` (eklemler), `p` (ekrana düşmüş eklemler), `yeni`, `et`
(etiketin ekrandaki yeri; `insanEkle` kendisi kurar), `ozel`.

**Olaylar ve yazılar:** `olay(o)`, `katil(id, ad, zorla)`, `cikar(k)`, `siraGuncelle()`, `bildir(ad, orta,
vurgu)`, `pankart(satir1, satir2)`, `gunluk(tur, ad, metin)`, `konfeti(adet, guc)`, `kalpAt(adet)`.

**Sahne:** `c` (2B çizim bağlamı, 720×1280 sanal ölçekte), `GW`, `GH`, `ALAN_UST`, `ALAN_ALT`, `kam`,
`pr([x, y, z])` → `{ x, y, s, d, ok }`, `kap(pa, ra, pb, rb, renk, derinlik)` (iki ucu farklı yarıçaplı kapsül),
`top(p, r, renk, derinlik)`, `ozel(derinlik, fn)`, `kapYol(...)`, `golge(x, z, rx, rz)`, `ik(...)`.

**İnsan takımı** (izleyici insan olarak çizilecekse): `gorunumUret(id)`, `iskeletKur(k, poz)`, `kolKur(k)`,
`pozBekle(k)` (vuruşla sallanan bekleme pozu), `insanEkle(k)` (gövde + baş; `k.et` kurulur), `kafaCiz(k, ph)`
(yalnız baş; araç penceresi gibi yerlerde), ölçüler `KALCA`, `GOGUS`, `KAFA_Y`, `KAFA_R`, `BACAK`, `KOL`.

**Yardımcılar:** `TAU`, `HP`, `clamp`, `lerp`, `yumusak`, `basamak`, `ozet`, `rastgeleUret`, `aciFark`,
`azHareket`, `$`.

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
izleyiciler yan yana dizilir, vuruşla sallanır. Yeni oyuna şablondan başla, halaya bakarak zenginleştir.
