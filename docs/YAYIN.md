# Yayıncı rehberi

Bu rehber, programcı olmayan bir yayıncı içindir. Elinde bir oyun paketi klasörü olduğunu varsayar (`dist/<ad>/`, ya da sana verilen klasör). Paket, TikTok canlı yayınındaki yorum, beğeni ve hediyeleri okuyup oyuna aktarır.

## Gerekenler

- Yayını bilgisayardan yapıyor olmalısın. Telefondan yayın desteklenmez.
- TikTok hesabında LIVE Studio erişimi olmalı. Kimin erişim alacağına TikTok karar verir.
- Windows bilgisayar ve Node.js (aşağıda kurulumu var).
- İnternet bağlantısı.

Şifre gerekmez. Köprü TikTok hesabına girmez; yalnızca herkese açık yayını okur.

## Kurulum

1. https://nodejs.org adresine git ve LTS yazan sürümü indirip kur. Kurulum sırasında her şeyi varsayılan bırakabilirsin.
2. Paket klasörünü bilgisayarında istediğin bir yere koy. Klasör yolunda Türkçe harf olabilir.

## Yayına başlama

1. Paket klasöründeki `BASLAT.bat` dosyasına çift tıkla.
2. İlk seferde gereken kütüphane iner. Bu bir kez olur, internet ister.
3. Ekranda TikTok kullanıcı adın sorulur. Başında `@` olmadan yaz ve Enter'a bas.
4. Oyun tarayıcıda açılır. Yayın açıksa yorumlar, beğeniler ve hediyeler oyuna akmaya başlar.
5. Sayfada bir kez herhangi bir yere tıkla ya da başlat düğmesine bas. Tarayıcılar, kullanıcı tıklamadan ses çalmaya izin vermez.

## TikTok LIVE Studio'ya ekleme

1. Tarayıcıdaki adresin sonuna `#yayin` ekle ve Enter'a bas. Panel gizlenir, yalnızca sahne görünür.
2. LIVE Studio'da yeni bir kaynak ekle ve **pencere yakalama** seç.
3. Listeden oyunun açık olduğu tarayıcı penceresini seç.
4. Pencereyi yayın düzenindeki yerine yerleştir ve boyutlandır.

Tarayıcı kaynağı (browser source) yöntemi bu oyunda boş görünebilir. Pencere yakalama kullan.

Yakalama sırasında tarayıcı penceresi küçültülmemeli. Küçültülmüş pencere yakalanmaz.

## Güvenlik

İzleyicilerin yorumları ekranda yazıldığı gibi görünür. Kötü bir yorum doğrudan yayına çıkabilir. İki seçeneğin var, ikisi de oyunun panelinde:

- Konuşma balonlarını kapat. Yorumlar ekranda görünmez, yine de izleyiciyi oyuna sokar.
- Yasaklı kelime listesini doldur. Listedeki kelimeleri içeren yorumlar gösterilmez.

Yayına çıkmadan önce panelden birini seç. Panel `#yayin` ile gizlendiği için ayarı önce yap.

## Sorun giderme

| Belirti | Neden ve çözüm |
| --- | --- |
| "Node.js bulunamadı" | Node.js kurulu değil ya da kurulumdan sonra bilgisayar yeniden başlatılmadı. https://nodejs.org adresinden LTS sürümünü kur, `BASLAT.bat` dosyasını yeniden aç. |
| Köprü bağlanamıyor, 403 hatası | Kütüphane eski. Paket klasöründe bir komut satırı aç ve `npm install tiktok-live-connector@latest` yaz. Sonra `BASLAT.bat` dosyasını yeniden aç. |
| "Yayın kapalı" ya da kullanıcı bulunamadı | Yayın açık değil ya da kullanıcı adı yanlış. Önce TikTok'ta yayını başlat, adı `@` olmadan yaz. |
| Kapı dolu (port meşgul) | Köprü zaten başka bir pencerede açık olabilir; onu kapat. Olmazsa komut satırında `node kopru.js <kullanıcı_adı> --port 9000 --ac` çalıştır. |
| Ses yok | Tarayıcılar tıklamadan ses açmaz. Sayfada başlat düğmesine bas. Pencere yakalama bilgisayar sesini ayrıca almıyorsa LIVE Studio'da ses kaynağını kontrol et. |
| LIVE Studio'da oyun görünmüyor | Tarayıcı kaynağı yerine pencere yakalama kullan. Pencerenin küçültülmediğinden emin ol. |
| Oyun açık ama yorumlar gelmiyor | Pencerede köprü bağlantı durumunu oku. Yayın açıksa ve yorum yazılıyorsa kütüphaneyi güncelle (403 satırı). |

## Doğrulama durumu (10 Kasım 2026)

Bu tablo neyin denendiğini dürüstçe gösterir. "Denenmedi" yazan adımların çalışacağı varsayılıyor, doğrulanmadı.

| Adım | Durum |
| --- | --- |
| Köprünün gerçek bir TikTok canlı yayınını okuması | `tiktok-live-connector` 2.5.0 ile bir kez denendi: yorum, beğeni, hediye ve takip olayları oyuna ulaştı. 1.x sürümü artık bağlanamıyor (imza isteği 403 dönüyor). |
| `BASLAT.bat`, Windows 10, temiz kopya, Türkçe harfli klasör yolu | Denendi, çalışıyor |
| Node.js kurulu olmayan bir bilgisayar; insanın çift tıklaması | Denenmedi |
| TikTok LIVE Studio pencere yakalama | Denenmedi |

## Kütüphane hakkında

Köprü resmî olmayan `tiktok-live-connector` kütüphanesini kullanır ve TikTok ile bağlantılı değildir. Kütüphane imza için üçüncü taraf bir servise (Euler Stream) dayanır; bu servis ücretsiz kullanımı sınırlayabilir ya da durdurabilir. TikTok'un canlı yorum ve hediye okumak için resmî açık bir API'si yok, yani bu yol bir gün kapanabilir.
