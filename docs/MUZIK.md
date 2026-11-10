# Müzik: nota yazımı, yeni hava ekleme, kendi parçalarını çaldırma

Oyunun kendi müziği `cekirdek/js/10-muzik.js` içinde üretilir. Depoda ses dosyası yoktur ve olmamalıdır.
İsteyen, kendi bilgisayarındaki parçaları da çaldırabilir; bunlar depoya girmez (aşağıda, "Hazır parçalar").

## Bir havanın tanımı

```js
{ id: 'harman', ad: 'Harman Yeri',
  bpm: 104,        // dakikadaki vuruş (coşku 0 iken)
  spb: 4,          // vuruş başına adım: 4 = onaltılık, 3 = 6/8'lik sekizlik
  bar: 16,         // ölçü başına adım
  tonik: 415.3,    // karar sesinin frekansı (Hz)
  dizi: [0, 150, 300, 500, 700, 880, 1000],   // dizinin 7 sesi, karardan sent olarak (çeyrek sesler serbest)
  davul: { ana: 'D..kT.k.D.D.T.k.', cesni: 'D..kT.kkD.DkT.T.', gecis: 'D.TkD.TkDkTkTTTT' },
  bolum: { A: '…', B: '…', D: '-:16 -:16' },
  form: 'AABBD' }
```

## Ezgi yazımı

Bölüm, boşlukla ayrılmış notalardır: `derece:süre`.

| Yazım | Anlamı |
| --- | --- |
| `4:2` | Dizinin 4. derecesi, 2 adım. Derece 0 karardır; 7 bir oktav üstü, -1 kararın altı. |
| `5':2` | Üstten çarpma ile gir. |
| `0~:8` | Tril (üst komşu sesle). Uzun karar seslerinde kullanılır. |
| `-:2` | Sus. |
| `\|` | Ölçü çizgisi; yalnız okunurluk içindir. |

Her bölümün toplam süresi `bar`'ın tam katı olmalıdır; değilse konsola uyarı düşer ve test kalır.

## Davul yazımı

Ölçü başına `bar` karakterlik dizgi: `D` düm (tokmak), `T` tek (çubuk), `k` hafif tek, `.` boş.
Ölçüler sırayla `ana` ve `cesni` kalıbını çalar; bölümün son ölçüsünde `gecis` çalınır.

`D` adlı bölüm davul solosudur: zurna ve dem susar, davul `cesni` ve `gecis` kalıplarını doldurarak çalar.

## Yeni hava eklerken

1. `HAVALAR` dizisine ekle. `id` benzersiz ve ASCII olsun.
2. Ezgi **özgün** olmalı. Var olan bir türkünün ya da şarkının notalarını yazma.
3. `node araclar/test.js` çalıştır. Şunlar ölçülür: bölümler ölçüye oturuyor mu, zurna notaları hedef perdede mi,
   davul vuruşları zamanında mı, kırpılma var mı, davul / zurna / dem dengesi, soloda zurna susuyor mu.
   Yeni hava bu döngülere kendiliğinden girmez: `cekirdek/test/` altındaki testlerdeki `hi < 3` sınırlarını ve
   `Havalar kendiliğinden sırayla döner` kontrolünü güncelle.
4. Dinle. Ölçümler perdeyi ve dengeyi doğrular, kulağa hoş gelip gelmediğini doğrulamaz.

## Hazır parçalar (isteğe bağlı)

Üretilen davul zurna yerine kendi kayıtlarını çaldırabilirsin: kendi yaptığın ya da kullanma hakkın olan
parçalar. Oyun bunları oyunun `oyunlar/<ad>/muzik/` klasöründe arar (paketlenince `dist/<ad>/muzik/`). Klasör yoksa hiçbir
şey değişmez: üretilen davul zurna çalar, deneme panelinde parça bölümü görünmez.

```bash
pip install librosa                                  # bir kez; mp3 için ffmpeg de kurulu olmalı
python araclar/muzik-hazirla.py "parçaların klasörü" oyunlar/<ad>
```

Betik her parçanın vuruşlarını ölçer, dosyayı `muzik/` altına Türkçe harfsiz bir adla kopyalar ve
`muzik/liste.js` dosyasını yazar. Sonra oyunu aç: klasörde parça varsa müzik **yalnız o parçalardan** çalar,
sırayla döner; panelde üretilen havaların yerine parça düğmeleri görünür. Köprüden açılan yayın sayfası da aynı
klasörü kullanır. Üretilen davul zurnaya dönmek için `muzik/` klasörünü kaldır ya da adını değiştir.

Nasıl çalışır:

- Parça bir ses öğesiyle (`Audio`) çalınır. Vuruş saati (`B`), parçanın **önceden ölçülmüş vuruş anlarından**
  gelir (`liste.js` içindeki `vurus`); tempo kayan kayıtta da dans vuruşta kalır.
- Adım atılan nabız 75–150 vuruş/dk arasına alınır: izleyici çift tempo bulduysa iki vuruşta bir basılır.
  `kayma`, bas davulun en güçlü düştüğü vuruştur; halayın dört vuruşluk adımı oradan başlar.
- Coşku arttıkça parça en çok %25 hızlanır (perde değişmez). Üretilen müzikte sınır %38'dir; kayıt daha
  fazla hızlanınca bozulur.
- Parça bitince sıradaki başlar. Ses kapalıyken ya da parça açılamazsa üretilen davul zurna sürer.
- Hediye zili ve çalgıcıların hareketi hazır parçada da çalışır; davul şovu yalnız görüntüdür.

Dikkat edilecekler:

- **`muzik/` depoya girmez** (`.gitignore`). Parçalarının hakkı sende kalır; başkasının kaydını koyma,
  yayında telif sorunu sana döner.
- Baştan sona aynı tempoda, girişi kısa, sözsüz parçalar en iyi sonucu verir.
- Vuruş ölçümü kulakla doğrulanmaz. Dans yarı ya da çift hızda görünürse `liste.js` yeniden üretilmeden
  düzelmez; betikteki 75–150 aralığını o parça için değiştir.

## Adlar

| Ad | Ne |
| --- | --- |
| `window.OYUN_MUZIK` | `muzik/liste.js` içinde `muzik-hazirla.py` tarafından yazılan parça listesi |
| `window.OYUN_MUZIK_KAPALI` | Doğruysa `muzik/` klasörü yok sayılır; testler üretilen müziği sınamak için bunu kullanır |
