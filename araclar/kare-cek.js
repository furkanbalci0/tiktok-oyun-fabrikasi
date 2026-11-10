#!/usr/bin/env node
/* Sahnenin karelerini alır: oyunun farklı kalabalıklarda nasıl göründüğünü tek bakışta görmek için.
 *
 *   node araclar/kare-cek.js <ad>
 *
 * Yazdıkları (test/cikti/<ad>/ altına):
 *   kare-1.png, kare-3.png, kare-9.png, kare-dolu.png   1, 3, 9 izleyici ve oyunun kapasitesi kadar izleyici
 *   kare-hediye.png                                      en büyük hediye atıldıktan birkaç saniye sonra
 *   kare-hepsi.png                                       beşi yan yana (bakılacak asıl dosya)
 *   kare-hareket.png                                     9 kişi, vuruş saati dondurulup çeyrek vuruş arayla 8 kare
 *                                                        (--hareketsiz ile atlanır)
 *   kare-<etiket>.json                                   ölçüm (720×1280 ölçeğinde): her oyuncunun yüzü { x, y, r },
 *                                                        ad kutusu [x, y, w, h], sahne yazılarının kutuları
 * Sonda kaba kusurları sayar: sıralama kutusuna giren ad, yorum alanına taşan ad, 9 pikselden küçük yüz.
 *
 * Görsel bir değişiklikten sonra bunu çalıştır ve kare-hepsi.png dosyasına bak: yüzler görünüyor mu, kadraj
 * dolu mu, yazılar birbirine giriyor mu, alt beşte bir boş mu. Testlerin geçmesi bunların hiçbirini göstermez.
 * Kurulu Chrome'u kullanmak için: CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"
 */
'use strict';
const path = require('path'), fs = require('fs'), { pathToFileURL } = require('url');
const kok = path.join(__dirname, '..'), ad = process.argv[2];
if (!ad || !/^[\w-]+$/.test(ad)) { console.error('Kullanım: node araclar/kare-cek.js <ad>'); process.exit(2); }
const oyun = path.join(kok, 'oyunlar', ad, 'oyun.html');
if (!fs.existsSync(oyun)) { console.error(oyun + ' yok. Önce derle: node araclar/derle.js ' + ad); process.exit(2); }
let playwright;
try { playwright = require('playwright'); }
catch (e) { console.error('playwright gerekli:\n  npm install'); process.exit(2); }
const cikti = path.join(kok, 'test', 'cikti', ad);
fs.mkdirSync(cikti, { recursive: true });

const ADLAR = ['mert.can.21', 'nazlı_can', 'ozan_dayı', 'sibel_abla', 'baran.21', 'elif_naz', 'Hacı Salihoğlu', 'kübra__34', 'yusuf61', 'Emre Aksu', 'zeynep', 'babie.live', 'Osman', 'LazReiL', 'almira', 'atike.11', 'Gumbatte', 'RAHMİCAN', 'ssuuddeli', 'usge.29', 'merve', 'editciumut', 'Servet Cankurt', 'Enver Paşa', 'Halil', 'Zeki', 'Hayal', 'aziz__im', 'selinay', 'EY', 'Bey_38', 'yukaa', 'Nazan', 'User2110', 'ilginTR', 'Fatma', 'bassy', 'mehmet', 'Sena', 'joker', 'dj_mahmut', 'pınar_34', 'hasan.usta', 'berfin_gül', 'tuğçe.sk', 'efe_tr', 'cano_23', 'zilan.d', 'sude_nur', 'ipek_böceği'];

(async () => {
  const b = await playwright.chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
  const hatalar = [];
  const ac = async (w, h) => {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await p.addInitScript(() => { window.OYUN_MUZIK_KAPALI = true; });
    p.on('pageerror', e => hatalar.push(String(e)));
    // Google Fonts 4 sn'de gelmezse vazgeçilir, yedek yazı tipiyle sürer (bağlantı yokken sayfa 30 sn açılmıyordu).
    await p.route(/fonts\.(googleapis|gstatic)\.com/, async r => {
      try { await r.fulfill({ response: await r.fetch({ timeout: 4000 }) }); }
      catch (e) { await r.abort().catch(() => { }); }
    });
    await p.goto(pathToFileURL(oyun).href + '#yayin');
    await p.waitForTimeout(500);
    // sahte izleyiciyi durdur, sahneyi boşalt: kareler her seferinde aynı kalabalıkla alınsın
    await p.evaluate(() => {
      document.getElementById('ses-cagri').hidden = true;
      if (document.getElementById('oto').getAttribute('aria-pressed') === 'true') document.getElementById('oto').click();
      document.getElementById('bosalt').click();
    });
    return p;
  };
  // İlk dört kişi hediye atmış olsun: sıralama kutusu ve lider dolu görünsün.
  const doldur = (p, n) => p.evaluate(([adlar, n]) => {
    const jeton = [300, 60, 15, 5];
    for (let i = 0; i < n; i++) {
      const ad = adlar[i % adlar.length] + (i >= adlar.length ? '_' + i : ''), kim = { id: 'kare:' + ad, ad };
      CanliOyun.olay(i < jeton.length ? { tip: 'hediye', kullanici: kim, jeton: jeton[i] } : { tip: 'yorum', kullanici: kim, metin: '' });
    }
  }, [ADLAR, n]);

  const ilk = await ac(540, 960);
  const kapasite = await ilk.evaluate(() => CanliOyun._test.OYUN.kapasite || 36);
  await ilk.close();
  const kareler = [], uyari = [];
  // Ölçüm (720×1280 ölçeğinde): yüzlerin yarıçapı, ad kutuları, sahne yazılarının kutuları → kare-<etiket>.json.
  // Gözle bakmadan önce kaba kusurları sayar: sıralama kutusuna giren ad, ekrandan taşan ad, karıncalaşan yüz.
  const olc = async (p, etiket) => {
    const o = await p.evaluate(() => CanliOyun._test.olcum());
    fs.writeFileSync(path.join(cikti, 'kare-' + etiket + '.json'), JSON.stringify(o, null, 1));
    const kesis = (a, b) => a && b && a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
    const adlar = o.kisiler.filter(k => k.etiket), yuzler = o.kisiler.filter(k => k.bas).map(k => k.bas.r).sort((a, b) => a - b);
    const sira = adlar.filter(k => kesis(k.etiket, o.kutular.sira) || kesis(k.etiket, o.kutular.cosku)).map(k => k.ad);
    const tasan = adlar.filter(k => k.etiket[1] + k.etiket[3] > o.alan[1] + 18 || k.etiket[1] < 0).map(k => k.ad);
    if (sira.length) uyari.push(etiket + ': ' + sira.length + ' ad sıralama kutusuna / göstergeye giriyor (' + sira.slice(0, 4).join(', ') + ')');
    if (tasan.length) uyari.push(etiket + ': ' + tasan.length + ' ad yorum alanına ya da ekran dışına taşıyor (' + tasan.slice(0, 4).join(', ') + ')');
    if (yuzler.length && yuzler[0] < 9) uyari.push(etiket + ': en küçük yüzün yarıçapı ' + yuzler[0] + ' px (720 genişlikte; 9 px altı kalabalıkta okunmaz)');
    return { ad: adlar.length, kisi: o.kisiler.length, yuzEnKucuk: yuzler[0], yuzOrtanca: yuzler[yuzler.length >> 1] };
  };
  const ozet = {};
  for (const [etiket, n] of [['1', 1], ['3', 3], ['9', 9], ['dolu', kapasite]]) {
    const p = await ac(540, 960);
    await doldur(p, n);
    await p.waitForTimeout(6500);
    if (n > 2) await p.evaluate(a => CanliOyun.olay({ tip: 'yorum', kullanici: { id: 'kare:' + a, ad: a }, metin: 'selam!' }), ADLAR[2]);
    await p.waitForTimeout(500);
    const yol = path.join(cikti, 'kare-' + etiket + '.png');
    await p.screenshot({ path: yol });
    ozet[etiket] = await olc(p, etiket);
    kareler.push(yol);
    if (etiket === '9' && !process.argv.includes('--hareketsiz')) {
      // Hareket: vuruş saati dondurulup çeyrek vuruş adımlarla iki vuruş boyunca ilerletilir; sekiz kare yan yana
      // (kare-hareket.png). Duran kare hareketin ritmini göstermez: sallanma, zıplama, el kol buradan görülür.
      const b0 = await p.evaluate(() => Math.floor(CanliOyun._test.vurusDondur()));
      const seri = [];
      for (let i = 0; i < 8; i++) {
        await p.evaluate(b => CanliOyun._test.vurusDondur(b), b0 + i * 0.25);
        await p.waitForTimeout(70);
        seri.push(await p.screenshot());
      }
      await p.evaluate(() => CanliOyun._test.vurusCoz());
      const yan = await b.newPage({ viewport: { width: 270 * seri.length, height: 480 } });
      await yan.setContent('<body style="margin:0;display:flex;background:#000;font:600 14px sans-serif;color:#fff">' + seri.map((k, i) => '<div style="position:relative"><img style="width:270px;height:480px;display:block" src="data:image/png;base64,' + k.toString('base64') + '"><span style="position:absolute;left:6px;bottom:6px;background:#000a;padding:2px 6px">B +' + (i * 0.25).toFixed(2) + '</span></div>').join('') + '</body>');
      await yan.waitForTimeout(200);
      await yan.screenshot({ path: path.join(cikti, 'kare-hareket.png') });
      await yan.close();
    }
    await p.close();
  }
  // en büyük hediye: oyunun en gösterişli anı
  const h = await ac(540, 960);
  await doldur(h, Math.min(kapasite, 14));
  await h.waitForTimeout(4500);
  await h.evaluate(a => { const enBuyuk = CanliOyun._test.KADEME[0].min; CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'kare:' + a, ad: a }, jeton: enBuyuk }); }, ADLAR[7]);
  await h.waitForTimeout(3600);
  const hYol = path.join(cikti, 'kare-hediye.png');
  await h.screenshot({ path: hYol });
  ozet.hediye = await olc(h, 'hediye');
  kareler.push(hYol);
  await h.close();
  // beşi yan yana: tek dosyada bakmak için
  const yan = await b.newPage({ viewport: { width: 540 * kareler.length, height: 960 } });
  // Kareler sayfaya gömülür: boş sayfa (about:blank) diskteki dosyayı adresinden yükleyemez.
  await yan.setContent('<body style="margin:0;display:flex;background:#000">' + kareler.map(k => '<img style="width:540px;height:960px" src="data:image/png;base64,' + fs.readFileSync(k).toString('base64') + '">').join('') + '</body>');
  await yan.waitForTimeout(300);
  await yan.screenshot({ path: path.join(cikti, 'kare-hepsi.png') });
  await yan.close();
  // yayın çözünürlüğünde, en kalabalık hâlde kare başına işlem süresi
  const y = await ac(1080, 1920);
  await doldur(y, kapasite);
  await y.waitForTimeout(6000);
  const ms = await y.evaluate(() => CanliOyun.durum().kareMs);
  await y.close();
  await b.close();
  console.log('Kareler: ' + path.relative(kok, cikti));
  console.log('  bak: ' + path.relative(kok, path.join(cikti, 'kare-hepsi.png')) + '   (1, 3, 9, ' + kapasite + ' kişi, en büyük hediye)');
  if (!process.argv.includes('--hareketsiz')) console.log('  hareket: ' + path.relative(kok, path.join(cikti, 'kare-hareket.png')) + '   (9 kişi, çeyrek vuruş arayla 8 kare)');
  console.log('  ölçüm: kare-<etiket>.json (yüz yarıçapı, ad kutuları; 720×1280 ölçeğinde)');
  for (const [e, o] of Object.entries(ozet))
    console.log('    ' + e.padEnd(6) + o.kisi + ' kişi, ' + o.ad + ' ad yazıldı, yüz yarıçapı en küçük ' + o.yuzEnKucuk + ' px, ortanca ' + o.yuzOrtanca + ' px');
  if (uyari.length) console.log('DİKKAT (kareye bakarak doğrula):\n  ' + uyari.join('\n  '));
  console.log('1080×1920, ' + kapasite + ' kişi: kare başına ' + ms.toFixed(1) + ' ms (sınır 33)');
  if (hatalar.length) { console.log('SAYFA HATALARI:\n  ' + [...new Set(hatalar)].slice(0, 5).join('\n  ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
