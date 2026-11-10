---
name: yeni-oyun
description: Bu depoda TikTok canlı yayını için yeni bir etkileşimli oyun kurma tarifi. Kullanıcı bir oyun fikri söylediğinde ("gelin konvoyu oyunu yap", "at yarışı olsun", "izleyiciler halat çeksin", "şöyle bir yayın oyunu istiyorum"), var olan bir oyunu değiştirmek istediğinde ya da "bunu yayına nasıl veririm" diye sorduğunda kullanılmalıdır. Fikri kurallara çevirme, şablondan başlatma, sahneyi çıtaya göre çizme, kareye bakarak düzeltme, test ve teslim adımlarını içerir.
---

# Yeni oyun: fikirden yayına

Kullanıcı tek cümlelik bir fikir verir; sen çalışan, yayına verilebilir bir oyun teslim edersin. Çekirdek
(`cekirdek/`) işin ortak yarısını zaten yapıyor. Senin işin `oyunlar/<ad>/` altını yazmak.

Başlamadan oku: `AGENTS.md` (harita, değişmezler, görsel çıta), `docs/KANCALAR.md` (dolduracağın kancalar ve
çekirdeğin sunduğu adlar), `oyunlar/halay/js/` (tam örnek).

## 1. Fikri kurala çevir

Bu türde her oyun aynı dört soruya cevap verir. Cevapları kendin ver, kullanıcıya kısa bir tabloyla göster,
itiraz yoksa devam et. Kullanıcıyı soru yağmuruna tutma; yalnız fikir gerçekten iki ayrı oyuna çıkıyorsa sor.

| Soru | Halaydaki cevap |
| --- | --- |
| Yorum yazan sahnede ne olur? | Halaya girer |
| Beğeniler neyi yükseltir? | Coşkuyu, onunla tempoyu |
| Hediye kademeleri ne yapar? (genelde 1, 10, 50, 200, 1000 jeton) | Zıpla, omuz, çök, davul şovu, solo |
| En çok hediye atan kim olur? | Halay başı; mendil onda |

İyi kurallar: izleyici attığı hediyenin karşılığını **hemen ve kendi adıyla** görür; küçük hediye küçük ama
görünür bir şey yapar; en büyük hediye sahneyi birkaç saniyeliğine o kişiye verir; liderlik el değiştirebilir
ki yarış sürsün. Kimse cezalandırılmaz, kimse sahneden kovulmaz (yalnız uzun süre sessiz kalan çıkar; bunu
çekirdek yapar).

## 2. Sahneyi düşün

Yazmadan önce şunlara karar ver:

- **İzleyici sahnede ne?** İnsan (`insanEkle`), araç içinde insan (`kafaCiz` ile baş, gövdesi senin çizimin),
  ya da başka bir şey. Her izleyicinin adı görünecek; çizim `k.et` alanını kurmalı.
- **Nerede dururlar?** 1, 3, 9 ve tam kalabalıkta diziliş. Sıra (`k.sn`) jetona göre gelir: öndekiler daha çok
  hediye atanlardır; bunu dizilişte görünür kıl.
- **Sahnenin ortasında ne var?** Boş orta zayıf durur.
- **Lider nasıl ayrılır?** Yer, işaret, renk; bir bakışta.
- **Renk dünyası.** Zemin, ışık ve yazılar tek paletten (`OYUN.renk`).

## 3. Kur

```bash
node araclar/yeni-oyun.js <ad> "<Görünen Ad>"
```

Şablon `js/10-oyun.js` içinde bütün kancaların en yalın hâlini getirir. O dosyayı kendi oyununa göre yeniden
yaz; büyüdükçe konuya göre yeni dosyalara böl (`20-hareket.js`, `30-dekor.js`, `40-cizim.js` gibi). Aynı kanca
iki dosyada tanımlı kalmasın.

Sonra şu sırayla ilerle; her adımdan sonra derleyip kareye bak:

1. `js/00-ayar.js`: yazılar, kademeler (`etki` metniyle), tohum kalabalık, sahte yorumlar, kapasite.
2. Diziliş ve hareket: `oyunYerlesim`, `oyunGiris`, `oyunGuncelle`, `oyunKamera`.
3. Çizim: `oyunZemin` (arka plan, zemin, gölgeler), `oyunCiz` (izleyiciler ve sahnedeki her şey).
4. Hediye etkileri ve rol devri: `oyunHediye`, `oyunLiderDegisti`.
5. Oyuna özgü testler: `oyunlar/<ad>/test.js` (her kademenin etkisini başlattığını sına).

Çizim için bilmen gerekenler:

- Eksenler: x sağ, y yukarı, z kameradan uzağa. `pr([x, y, z])` ekrandaki yeri ve `s` (metre başına piksel)
  verir. Boyutları `s` ile çarp ki uzaktaki küçük görünsün.
- Sahnedeki nesneleri `oyunCiz` içinde `kap`, `top`, `ozel` ile çizim listesine ekle; derinliğe göre sıralanıp
  çizilirler. Zemin ve arka plan `oyunZemin` içinde doğrudan `c` ile çizilir; orada listeye eklenen şey
  çizilmez (liste sonradan boşaltılır).
- Araç gibi tek parça nesneyi bir `ozel(derinlik, fn)` ile ekle ve `fn` içinde yalnız `c` ile çiz; `fn`
  içinden `kap` / `top` çağırma. Tam örnek: `oyunlar/konvoy/js/40-araba.js` (dönebilen kutu, kameraya bakan
  yüzler, pencereden çıkan sürücü).
- Dış çizgi rengi `MUREKKEP`; renkler `RENK` içinden.
- Hareketi `B` (vuruş) ile sür: `Math.sin(TAU * B)` vuruşta bir tur atar. `calgi.dumP` her güçlü vuruşta 1'e
  çıkıp söner; ışık ve zıplama için kullan.
- `Math.random()` yalnız parçacık gibi süs için. İzleyicinin görünümü kimliğinden türesin (`ozet(k.id)`,
  `rastgeleUret`): aynı kişi her yayında aynı görünür.

Sık takılınan yerler:

- Kancalar `function oyunX() {}` biçiminde işlev bildirimi olmalı; ok işlevi yazarsan derleme durur.
- Kamera hep `x = 0` çevresine bakar: sahneyi `x = 0` etrafında ortala. `oyunKamera()` yalnız kadraja girmesi
  gereken yer noktalarını döndürür; yakınlaşmayı çekirdek yapar.
- İnsan çizmiyorsan (araç, hayvan, top) her izleyicinin etiket yerini kendin yaz:
  `k.et = { x, y, s, d }` (`pr()` sonucundan: adın duracağı tepe noktası, ölçek, derinlik). Çekirdek `k.et`
  alanını her karede boşaltır; yazmazsan ad görünmez.
- `oyunHediye` sıra güncellenmeden önce çağrılır: içindeyken `D.lider` hâlâ eski liderdir. Yeni lider için
  `oyunLiderDegisti` kancasını kullan (ilk lider belirirken ve sahne boşaltılırken çağrılmaz).
- Çıkan izleyiciyi (`k.cikiyor`) sahneden sen götürürsün; uzaklaşınca `k.gitti = true` de. Demezsen 1,7 sn
  sonra olduğu yerde kaybolur.
- Müzik çekirdekte üretilen davul zurnadır. Oyununun havası buna uymuyorsa çekirdeği değiştirme; kullanıcıya
  kendi parçasını ekleyebileceğini söyle (`docs/MUZIK.md`).
- `gorunumUret(id)` yöresel kıyafet verir (yazma, kasket, önlük). Başka kılık gerekiyorsa gövdeyi kendin çiz,
  başı `kafaCiz` ile al.

## 4. Kareye bak, düzelt, yine bak

```bash
node araclar/derle.js <ad> && node araclar/kare-cek.js <ad>
```

`test/cikti/<ad>/kare-hepsi.png` dosyasını aç ve **kendi gözünle** şunları denetle. En az iki tur yap; ilk
karede her zaman düzeltilecek bir şey çıkar.

- Yüzler ya da izleyicinin karşılığı net görünüyor mu, adlar okunuyor mu?
- 1 kişide sahne boş mu kalıyor? Tam kalabalıkta taşıyor ya da karıncaya dönüyor mu?
- Lider hemen seçiliyor mu?
- Ortadaki nesneler izleyicilerin önünü kapatıyor mu?
- Üst yazılarla (sıralama kutusu, gösterge) sahnedeki şeyler çakışıyor mu?
- Alt beşte bir boş mu?
- En büyük hediye karesi diğerlerinden açıkça farklı mı?
- Renkler tek bir dünyadan mı, yoksa her şey ayrı telden mi çalıyor?

Kare hareketsizdir; hareketi görmek için oyunu aç (`node kopru.js --deneme --oyun <ad> --ac`).

## 5. Sına

```bash
node araclar/test.js <ad>
```

Çekirdek testleri kuralların iskeletini, bozuk girdiyi, olay selini, müzik saatini, yayın görünümünü ve
uzun süre çalışmayı sınar. Kalan kontrol varsa oyunun kancalarında hata vardır; çekirdeği değiştirerek
geçirme.

## 6. Teslim et

Kullanıcıya kısa ve dürüst bir özet ver:

- Oyun ne yapıyor (kurallar tablosu).
- Nasıl açılır: `node kopru.js --deneme --oyun <ad> --ac`.
- Kare dosyasının yeri.
- Neyin testle, neyin gözle doğrulandığı; neyin **hiç** doğrulanmadığı (ses kulakla dinlenmedi, gerçek yayın
  denenmedi, hareket yalnız karelerden görüldü gibi).
- Yayına verme adımları için `docs/YAYIN.md`; yayıncı paketi için `node araclar/paket.js <ad>`.

## Yapma

- `cekirdek/` altını değiştirme. Eksik bir şey varsa oyunda çöz, raporda öner.
- Başka bir yayının çizimini, adını, müziğini kopyalama. Mekanik alınır, görünüş senin olur.
- Depoya görsel ya da ses dosyası ekleme.
- "Testler geçti" diyerek bitirme; kareye bakmadan teslim etme.
- Gerçek yayına bağlanmayı kullanıcı istemeden deneme. İsterse: köprü yalnız okur, herhangi bir açık
  yayınla denenebilir; o izleyicilerin adlarıyla dönen görüntü yayına ya da videoya konmaz.
