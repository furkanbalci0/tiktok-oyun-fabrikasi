// Çekirdek testleri: her oyuna uygulanır. Kurallar, bozuk girdi, olay seli, müzik saati, ses ölçümü,
// yayın görünümü, uzun süre çalışma. Oyunu başsız tarayıcıda açar ve window.CanliOyun arayüzü üzerinden sürer.
// Oyuna özgü sayılar (kapasite, kademeler, boş sahne yazısı) sayfadaki OYUN ayarından okunur.
// Çalıştırma: node cekirdek/test/cekirdek.test.js <ad>   (ad verilmezse halay)
'use strict';
const fs = require('fs');
const { OYUN_AD, OYUN_URL, CIKTI, tarayici, raporla, kontrolcu } = require('./ortak');
const { sonuc, kontrol } = kontrolcu();

(async () => {
  const b = await tarayici(['--enable-precise-memory-info']);
  const hatalar = [];
  const ac = async (w, h, hash) => {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) hatalar.push(m.text()); });
    p.on('pageerror', e => hatalar.push('SAYFA HATASI: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
    await p.goto(OYUN_URL + (hash || ''));
    await p.waitForTimeout(600);
    return p;
  };
  const p = await ac(1280, 800);
  const bosalt = () => p.evaluate(() => { document.getElementById('bosalt').click(); });
  const O = (o) => p.evaluate(o2 => CanliOyun.olay(o2), o);
  const durum = () => p.evaluate(() => CanliOyun.durum());
  // oyunun ayarı: kapasite, kademeler (büyükten küçüğe), boş sahne yazısı
  const AYAR = await p.evaluate(() => { const T = CanliOyun._test; return { kapasite: T.OYUN.kapasite, bos: T.OYUN.yazi.bos, kademe: T.KADEME.map(x => ({ min: x.min, ad: x.ad })) }; });
  const KAP = AYAR.kapasite, MINLER = AYAR.kademe.map(x => x.min);
  console.log('Oyun:', OYUN_AD, '· kapasite', KAP, '· kademeler', MINLER.join('/'));

  // ---------- KURALLAR ----------
  await bosalt();
  let d = await durum(); kontrol('Boşaltınca sahne boş', d.kisi === 0 && d.lider === null, d.kisi);
  await p.waitForTimeout(120); kontrol('Boş sahnede sıra kutusu oyunun boş yazısını gösterir', (await p.textContent('#sira-liste')).includes(AYAR.bos), AYAR.bos);
  await O({ tip: 'begeni', kullanici: { id: 'a', ad: 'Ali' }, adet: 10 });
  d = await durum(); kontrol('Beğeni oyuna sokmaz, coşkuyu artırır', d.kisi === 0 && d.cosku > 0.05, d.cosku.toFixed(3));
  await O({ tip: 'yorum', kullanici: { id: 'a', ad: 'Ali' }, metin: 'selam' });
  await O({ tip: 'yorum', kullanici: { id: 'a', ad: 'Ali' }, metin: 'yine ben' });
  d = await durum(); kontrol('Yorum oyuna sokar, ikinci yorum çoğaltmaz', d.kisi === 1, d.kisi);
  kontrol('İlk gelen lider olur', d.lider === 'Ali', d.lider);
  await O({ tip: 'yorum', kullanici: { id: 'b', ad: 'Bora' }, metin: 'selam' });
  await O({ tip: 'takip', kullanici: { id: 'c', ad: 'Cem' } });
  d = await durum(); kontrol('Takip eden oyuna girer', d.kisi === 3, d.sira);
  await O({ tip: 'hediye', kullanici: { id: 'b', ad: 'Bora' }, jeton: 5 });
  d = await durum(); kontrol('Hediye atan öne geçip lider olur', d.lider === 'Bora' && d.sira[0][1] === 5, d.sira);
  await O({ tip: 'hediye', kullanici: { id: 'c', ad: 'Cem' }, jeton: 5 });
  d = await durum(); kontrol('Eşit jetonda önce gelen önde kalır', d.lider === 'Bora' && d.sira[1][0] === 'Cem', d.sira);
  await O({ tip: 'hediye', kullanici: { id: 'c', ad: 'Cem' }, jeton: 1, adet: 3 });
  d = await durum(); kontrol('Adetli hediye çarpılarak sayılır (1×3)', d.lider === 'Cem' && d.sira[0][1] === 8, d.sira);
  await O({ tip: 'hediye', kullanici: { id: 'yeni', ad: 'Yeni' }, jeton: 50 });
  d = await durum(); kontrol('Sahnede olmayan hediye atınca girer ve sıraya yerleşir', d.lider === 'Yeni' && d.kisi === 4, d.sira);
  kontrol('En çok hediye atan liderdir', d.sira.every(x => x[1] <= d.sira[0][1]) && d.sira[0][0] === d.lider, d.sira);
  // Her kademenin en küçük değeri o kademenin adını, bir eksiği bir alt kademenin adını bildirir; çok büyük hediye en üst kademedir.
  const kd = await p.evaluate(K => {
    const cik = [], dene = (j, i) => { CanliOyun._test.zamanEkle(0.2); CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'kd' + j + '_' + i, ad: 'kd' + j }, jeton: j }); return document.getElementById('bildirim').lastChild.textContent; };
    K.forEach((x, i) => { cik.push([x.min, dene(x.min, i), x.ad]); if (x.min > 1) cik.push([x.min - 1, dene(x.min - 1, i), K[i + 1].ad]); });
    cik.push([K[0].min * 50, dene(K[0].min * 50, 99), K[0].ad]);
    return cik;
  }, AYAR.kademe);
  kontrol('Hediye kademeleri doğru eşleşir (bildirimde kademe adı)', kd.every(([, yazi, ad]) => yazi.includes(' ' + ad + '!')), kd.map(([j, yazi, ad]) => j + ' → ' + yazi.split('·').pop().trim() + ' (beklenen ' + ad + ')'));

  // kapasite
  await bosalt();
  await p.evaluate(n => { for (let i = 0; i < n; i++) CanliOyun.olay({ tip: 'yorum', kullanici: { id: 'k' + i, ad: 'kisi' + i }, metin: 'x' }); }, KAP * 2 + 8);
  d = await durum(); kontrol('Kalabalık kapasitede (' + KAP + ' kişi) sınırlanır', d.kisi === KAP, d.kisi);
  kontrol('Yer dolunca ilk gelen (lider) atılmaz', d.lider === 'kisi0', d.lider);
  await p.evaluate(n => { for (let i = 0; i < n; i++) CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'z' + i, ad: 'zengin' + i }, jeton: 10 + i }); }, KAP);
  d = await durum(); kontrol('Hediye atanlar dolu sahnede de yer bulur', d.kisi === KAP && d.sira.filter(x => x[1] > 0).length >= KAP - 1, d.sira.filter(x => x[1] > 0).length);
  await O({ tip: 'yorum', kullanici: { id: 'gec', ad: 'GecKalan' }, metin: 'x' });
  d = await durum(); kontrol('Herkes hediye atmışsa yorumcu kimseyi yerinden etmez', !d.sira.some(x => x[0] === 'GecKalan') || d.sira.filter(x => x[1] > 0).length >= KAP - 1, d.sira.some(x => x[0] === 'GecKalan'));

  // boşta kalan çıkar
  await bosalt();
  await p.evaluate(() => { for (let i = 0; i < 6; i++) CanliOyun.olay({ tip: 'yorum', kullanici: { id: 'b' + i, ad: 'bos' + i }, metin: 'x' }); CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'b5', ad: 'bos5' }, jeton: 100 }); CanliOyun._test.zamanEkle(250); });
  await p.waitForTimeout(5500);
  d = await durum(); kontrol('4 dakika sessiz kalan çıkar, hediye atan ve lider kalır', d.kisi === 1 && d.lider === 'bos5', d.sira);

  // ---------- KÖTÜ NİYETLİ / BOZUK GİRDİ ----------
  await bosalt();
  const once = await p.evaluate(() => document.querySelectorAll('*').length);
  const zarar = await p.evaluate(() => {
    window.__xss = 0; const k = '<img src=x onerror="window.__xss=1"><script>window.__xss=1<\/script>';
    const girdi = [
      { tip: 'yorum', kullanici: { id: k, ad: k }, metin: k },
      { tip: 'hediye', kullanici: { id: 'x1', ad: '<b>kalın</b>' }, jeton: 5 },
      { tip: 'takip', kullanici: { id: 'x2', ad: '"><svg onload=window.__xss=1>' } },
      { tip: 'yorum', kullanici: { id: 'uzun', ad: 'A'.repeat(5000) }, metin: 'B'.repeat(50000) },
      { tip: 'yorum', kullanici: { id: 'emoji', ad: '😀👨‍👩‍👧‍👦🇹🇷' }, metin: '🔥'.repeat(100) },
      { tip: 'yorum', kullanici: { id: 'rtl', ad: '‮ters‬' }, metin: 'مرحبا' },
      { tip: 'yorum', kullanici: { id: 12345, ad: 67890 }, metin: 42 },
      { tip: 'yorum', kullanici: {}, metin: 'kimliksiz' }, { tip: 'yorum' }, { tip: 'bilinmeyen', kullanici: { id: 'q' } }, null, undefined, 5, 'metin', [],
      { tip: 'yorum', kullanici: { id: '   ', ad: '   ' }, metin: 'boşluk' },
      { tip: 'hediye', kullanici: { id: 'nan', ad: 'nan' }, jeton: NaN }, { tip: 'hediye', kullanici: { id: 'eksi', ad: 'eksi' }, jeton: -500 },
      { tip: 'hediye', kullanici: { id: 'dev', ad: 'dev' }, jeton: 1e300 }, { tip: 'hediye', kullanici: { id: 'sonsuz', ad: 'sonsuz' }, jeton: Infinity },
      { tip: 'hediye', kullanici: { id: 'yazi', ad: 'yazi' }, jeton: 'abc', adet: 'xyz' }, { tip: 'hediye', kullanici: { id: 'nesne', ad: 'nesne' }, jeton: {}, adet: [] },
      { tip: 'begeni', kullanici: { id: 'bg', ad: 'bg' }, adet: -5 }, { tip: 'begeni', kullanici: { id: 'bg', ad: 'bg' }, adet: 1e12 }, { tip: 'begeni', kullanici: { id: 'bg', ad: 'bg' }, adet: 'çok' },
      { tip: 'yorum', kullanici: { id: 'proto', ad: '__proto__' }, metin: 'constructor' }, { tip: 'yorum', kullanici: { id: '__proto__', ad: 'toString' }, metin: 'x' }
    ];
    let atilan = 0; for (const g of girdi) { try { CanliOyun.olay(g); } catch (e) { atilan++; console.error('olay hata attı: ' + e.message); } }
    return { atilan, d: CanliOyun.durum() };
  });
  await p.waitForTimeout(1200);
  const sonra = await p.evaluate(() => ({ xss: window.__xss, img: document.querySelectorAll('.sahne img, .sahne script, .panel img, .gunluk script, .gunluk b, .sira b, svg[onload]').length, sira: document.getElementById('sira-liste').textContent, d: CanliOyun.durum() }));
  kontrol('Bozuk girdilerin hiçbiri oyunu düşürmez', zarar.atilan === 0, zarar.atilan);
  kontrol('Ad ve yorumdaki HTML çalışmaz, yazı olarak gösterilir', sonra.xss === 0 && sonra.img === 0 && sonra.sira.includes('<b>kalın</b>'), { xss: sonra.xss, eklenenEtiket: sonra.img });
  kontrol('Jeton değerleri sayı olarak kalır (NaN / sonsuz yok)', sonra.d.sira.every(x => Number.isFinite(x[1]) && x[1] >= 0) && sonra.d.sira.find(x => x[0] === 'eksi')[1] === 1, sonra.d.sira.map(x => x[1]));
  kontrol('Çok uzun ad 18 karaktere kısaltılır', sonra.d.sira.every(x => Array.from(x[0]).length <= 18), Math.max(...sonra.d.sira.map(x => Array.from(x[0]).length)));
  kontrol('Coşku 0–1 aralığında kalır', sonra.d.cosku >= 0 && sonra.d.cosku <= 1, sonra.d.cosku);
  await p.locator('#sahne').screenshot({ path: CIKTI + '/t-bozuk-girdi.png' });

  // süzgeç
  await bosalt();
  const suz = await p.evaluate(() => {
    const T = CanliOyun._test, el = document.getElementById('yasak'); el.value = 'Çirkin, KÖTÜsöz'; el.dispatchEvent(new Event('input'));
    const dene = (id, ad, metin) => { CanliOyun.olay({ tip: 'yorum', kullanici: { id, ad }, metin }); const k = T.D.oy.get(id); return [k.ad, k.balon && k.balon.m]; };
    const r = { temiz: dene('s1', 'iyi', 'merhaba'), yasak: dene('s2', 'iyi2', 'bu çok ÇİRKİN bir söz'), ad: dene('s3', 'kötüsöz_44', 'selam'), link: dene('s4', 'iyi4', 'gel bak https://ornek.test/abc ve www.site.test'), tel: dene('s5', 'iyi5', 'ara 0555 123 45 67') };
    document.getElementById('balon-dugme').click(); r.kapali = dene('s6', 'iyi6', 'görünmemeli'); document.getElementById('balon-dugme').click();
    el.value = ''; el.dispatchEvent(new Event('input')); return r;
  });
  kontrol('Yasaklı kelime geçen yorum balon olmaz (büyük/küçük harf, Türkçe)', suz.temiz[1] === 'merhaba' && !suz.yasak[1], suz.yasak);
  kontrol('Yasaklı kelime geçen ad "misafir" olur', suz.ad[0] === 'misafir', suz.ad[0]);
  kontrol('Bağlantı adresi ve telefon balonda gizlenir', !/https|www|ornek|0555|123/.test(suz.link[1] + suz.tel[1]), [suz.link[1], suz.tel[1]]);
  kontrol('Balonlar kapatılınca yorum balonu çıkmaz ama kişi oyuna girer', suz.kapali[0] === 'iyi6' && !suz.kapali[1], suz.kapali);

  // ---------- YAYIN MASASI: durum şeridi, sahneden çıkar, adını gizle, balon kapatma ----------
  await bosalt();
  await p.evaluate(() => {
    CanliOyun.olay({ tip: 'yorum', kullanici: { id: 'm1', ad: 'Mert' }, metin: 'selam' });
    CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'm2', ad: 'Lale' }, jeton: 40 });
    CanliOyun.olay({ tip: 'yorum', kullanici: { id: 'm3', ad: 'kotu_ad' }, metin: 'yasak slogan' });
    CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'm1', ad: 'Mert' }, jeton: 5 });
  });
  await p.waitForTimeout(450);
  const ms = await p.evaluate(() => { const t = id => document.getElementById(id).textContent; return { kisi: t('d-kisi'), jeton: t('d-jeton'), lider: t('d-lider'), bag: t('d-bag'), kare: t('d-kare'), satir: [...document.querySelectorAll('#kisi-liste li[data-id]')].map(li => li.dataset.id + ':' + li.querySelector('.ad').textContent), sekmeGizli: document.getElementById('bolum-deneme').hidden === false && document.getElementById('bolum-yayin').hidden === true }; });
  kontrol('Durum şeridi: kişi sayısı, toplam jeton, lider ve bağlantı canlı yazar', ms.kisi === '3' && ms.jeton === '45' && ms.lider === 'Lale' && ms.bag === 'Deneme' && /\d/.test(ms.kare), ms);
  kontrol('Sahnedekiler listesi jetona göre sıralı', ms.satir.join(',') === 'm2:Lale,m1:Mert,m3:kotu_ad', ms.satir);
  const mod = await p.evaluate(async () => {
    const T = CanliOyun._test, bekle = ms2 => new Promise(r => setTimeout(r, ms2)), satir = id => [...document.querySelectorAll('#kisi-liste li')].find(li => li.dataset.id === id);
    const r = {};
    // adını gizle: sıralamadaki düğmeyle
    r.balonVardi = !!T.D.oy.get('m3').balon;
    satir('m3').querySelector('.k-gizle').click();
    r.gizliAd = T.D.oy.get('m3').ad; r.gizliBalon = T.D.oy.get('m3').balon;
    CanliOyun.olay({ tip: 'yorum', kullanici: { id: 'm3', ad: 'kotu_ad' }, metin: 'yine ben' });
    r.gizliKalir = T.D.oy.get('m3').ad;
    r.sakli = JSON.parse(localStorage.getItem(T.OYUN.id + '-ayar') || '{}');
    // sahneden çıkar: lider çıkınca lider değişir, çıkan hediye atsa da geri gelmez
    satir('m2').querySelector('.k-cikar').click();
    await bekle(30);
    r.cikinca = CanliOyun.durum();
    CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'm2', ad: 'Lale' }, jeton: 500 });
    CanliOyun.olay({ tip: 'yorum', kullanici: { id: 'm2', ad: 'Lale' }, metin: 'geri geldim' });
    r.donmedi = CanliOyun.durum();
    // olay akışından çıkar
    await bekle(250);
    const akis = [...document.getElementById('gunluk').children].find(li => li.dataset.id === 'm1');
    r.akisSatir = !!akis;
    if (akis) akis.querySelector('.g-cikar').click();
    await bekle(30);
    r.akistanCikti = CanliOyun.durum();
    await bekle(300);
    r.modListe = document.getElementById('mod-liste').querySelectorAll('li[data-id]').length;
    r.ozet = document.getElementById('mod-ozet').textContent;
    // geri al: Yayın sekmesindeki listeden
    const geri = id => [...document.getElementById('mod-liste').children].find(li => li.dataset.id === id).querySelector('button').click();
    geri('m2');
    CanliOyun.olay({ tip: 'yorum', kullanici: { id: 'm2', ad: 'Lale' }, metin: 'döndüm' });
    r.geriGeldi = CanliOyun.durum().sira.some(x => x[0] === 'Lale');
    geri('m3');
    r.adGeri = T.D.oy.get('m3').ad;
    document.getElementById('mod-temizle').click();
    r.temiz = T.ayar.gizli.length + T.ayar.cikan.length;
    // balonu kapatınca ekrandaki balonlar da hemen gider; B tuşu aynı işi yapar
    CanliOyun.olay({ tip: 'yorum', kullanici: { id: 'm4', ad: 'Balon' }, metin: 'görünür' });
    r.balonOnce = !!T.D.oy.get('m4').balon;
    document.getElementById('balon-dugme').click();
    r.balonSonra = T.D.oy.get('m4').balon; r.balonAyar = T.ayar.balon;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }));
    r.tusla = T.ayar.balon;
    document.getElementById('yasak').dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }));
    r.yazarken = T.ayar.balon;
    return r;
  });
  kontrol('Adını gizle: ad hemen "misafir" olur, balonu silinir, sonraki yorumda da gizli kalır, saklanır', mod.balonVardi && mod.gizliAd === 'misafir' && !mod.gizliBalon && mod.gizliKalir === 'misafir' && (mod.sakli.gizli || []).some(x => x.id === 'm3' && x.ad === 'kotu_ad'), mod);
  kontrol('Sahneden çıkar: lider çıkar, yeni lider gelir; çıkanın hediyesi ve yorumu onu geri getirmez', !mod.cikinca.sira.some(x => x[0] === 'Lale') && mod.cikinca.lider === 'Mert' && !mod.donmedi.sira.some(x => x[0] === 'Lale') && mod.donmedi.kisi === 2, { cikinca: mod.cikinca.sira, sonra: mod.donmedi.sira });
  kontrol('Olay akışındaki satırdan da çıkarılır; çıkarılanlar listesi ve özeti güncellenir', mod.akisSatir && !mod.akistanCikti.sira.some(x => x[0] === 'Mert') && mod.modListe === 3 && /2 çıkarılan · 1 gizli/.test(mod.ozet), { akis: mod.akisSatir, sira: mod.akistanCikti.sira, liste: mod.modListe, ozet: mod.ozet });
  kontrol('Geri al: çıkarılan yeniden girebilir, gizlenenin adı döner, liste boşalır', mod.geriGeldi && mod.adGeri === 'kotu_ad' && mod.temiz === 0, { geri: mod.geriGeldi, ad: mod.adGeri, kalan: mod.temiz });
  kontrol('Balonlar kapatılınca ekrandaki balon hemen silinir; B tuşu aç/kapa, yazı alanında çalışmaz', mod.balonOnce && !mod.balonSonra && mod.balonAyar === false && mod.tusla === true && mod.yazarken === true, { once: mod.balonOnce, sonra: mod.balonSonra, tus: mod.tusla, yazarken: mod.yazarken });
  kontrol('Sekmeler: açılışta Deneme görünür, diğer sekmeler gizli', ms.sekmeGizli);

  // köprü ileti çevirisi (sayfa tarafı)
  const cv = await p.evaluate(() => { const c = CanliOyun.cevir; return {
    v1chat: c({ event: 'chat', data: { uniqueId: 'a', nickname: 'A', comment: 'selam' } }),
    v2chat: c({ event: 'chat', data: { user: { uniqueId: 'a', nickname: 'A' }, comment: 'selam' } }),
    seri: c({ event: 'gift', data: { uniqueId: 'a', diamondCount: 5, repeatCount: 2, giftType: 1, repeatEnd: false } }),
    seriSon: c({ event: 'gift', data: { uniqueId: 'a', diamondCount: 5, repeatCount: 3, giftType: 1, repeatEnd: true } }),
    seriSayi: c({ event: 'gift', data: { user: { uniqueId: 'a' }, giftDetails: { diamondCount: 5, giftType: 1 }, repeatCount: 3, repeatEnd: 0 } }),
    seriSayiSon: c({ event: 'gift', data: { user: { uniqueId: 'a' }, giftDetails: { diamondCount: 5, giftType: 1 }, repeatCount: 3, repeatEnd: 1 } }),
    buyuk: c({ event: 'gift', data: { uniqueId: 'a', diamondCount: 29999, repeatCount: 1, giftType: 2 } }),
    cop: [c(null), c('x'), c({ event: 'gift' }), c({ event: 'roomUser', data: { viewerCount: 5 } })]
  }; });
  kontrol('Köprü iletisi: düz ve iç içe kullanıcı biçimi', cv.v1chat.metin === 'selam' && cv.v2chat.kullanici.id === 'a');
  kontrol('Seri hediye sürerken sayılmaz, bitince bir kez sayılır', cv.seri === null && cv.seriSon.jeton === 5 && cv.seriSon.adet === 3 && cv.seriSayi === null && cv.seriSayiSon.adet === 3, { surerken: cv.seri, bitince: cv.seriSon });
  kontrol('Tek seferlik büyük hediye hemen sayılır', cv.buyuk.jeton === 29999);
  kontrol('Tanınmayan iletiler yok sayılır', cv.cop.every(x => x === null));

  // ---------- SEL: çok hızlı olay ----------
  await bosalt();
  const sel = await p.evaluate(M => {
    const t0 = performance.now(); let n = 0;
    for (let i = 0; i < 20000; i++) { const id = 'f' + (i % 300), r = i % 10; n++;
      if (r < 5) CanliOyun.olay({ tip: 'yorum', kullanici: { id, ad: id }, metin: 'sel ' + i });
      else if (r < 8) CanliOyun.olay({ tip: 'begeni', kullanici: { id, ad: id }, adet: 15 });
      else CanliOyun.olay({ tip: 'hediye', kullanici: { id, ad: id }, jeton: M[i % M.length] }); }
    return { ms: performance.now() - t0, n, d: CanliOyun.durum(), gunluk: document.getElementById('gunluk').children.length, bildirim: document.getElementById('bildirim').children.length };
  }, MINLER);
  await p.waitForTimeout(3000);
  d = await durum();
  kontrol('20.000 olay tek seferde işlenir', sel.ms < 4000, Math.round(sel.ms) + ' ms');
  kontrol('Selde parçacık, günlük ve bildirim sınırlı kalır', sel.d.parca <= 460 && sel.gunluk <= 40 && sel.bildirim <= 3, { parca: sel.d.parca, gunluk: sel.gunluk, bildirim: sel.bildirim });
  kontrol('Selden sonra oyun akmaya devam eder', d.kisi === KAP && d.kareMs < 40, { kisi: d.kisi, kareMs: +d.kareMs.toFixed(1) });
  await p.locator('#sahne').screenshot({ path: CIKTI + '/t-sel.png' });

  // ---------- MÜZİK SAATİ ----------
  const saat = await p.evaluate(async () => {
    const T = CanliOyun._test, ornek = []; let dur = false;
    const al = () => { ornek.push([performance.now(), CanliOyun.durum().vurus]); if (!dur) requestAnimationFrame(al); }; al();
    const bekle = ms => new Promise(r => setTimeout(r, ms));
    await bekle(1500); document.getElementById('ses-dugme').click(); await bekle(2500);
    document.getElementById('hava-toz').click(); await bekle(4000);
    document.getElementById('ses-dugme').click(); await bekle(1500);
    document.getElementById('hava-cifte').click(); await bekle(3500);
    document.getElementById('ses-dugme').click(); await bekle(2500);
    for (let i = 0; i < 5; i++) { document.getElementById('ses-dugme').click(); await bekle(150); }
    await bekle(1500); dur = true;
    let geri = 0, sicrama = 0, enGeri = 0, enIleri = 0;
    for (let i = 1; i < ornek.length; i++) { const db = ornek[i][1] - ornek[i - 1][1], dtt = (ornek[i][0] - ornek[i - 1][0]) / 1000; if (db < -0.02) { geri++; enGeri = Math.min(enGeri, db); } if (db > dtt * 4.5 + 0.25) { sicrama++; enIleri = Math.max(enIleri, db); } }
    return { ornek: ornek.length, geri, sicrama, enGeri, enIleri, hava: CanliOyun.durum().hava, ses: CanliOyun.durum().ses, toplamVurus: ornek[ornek.length - 1][1] - ornek[0][1], sure: (ornek[ornek.length - 1][0] - ornek[0][0]) / 1000 };
  });
  kontrol('Ses aç/kapa ve hava değişiminde vuruş saati geri gitmez, sıçramaz', saat.geri === 0 && saat.sicrama === 0, saat);
  kontrol('Seçilen havaya geçilir', saat.hava === 'cifte', saat.hava);
  const dongu = await p.evaluate(() => { const { Muzik, HAVALAR } = CanliOyun._test, m = new Muzik(); m.sonraki = 0; const gecis = [[0, m.hava.id]]; let son = m.hava.id; while (m.sonraki < 420) { m.adimCal(); if (m.hava.id !== son) { son = m.hava.id; gecis.push([Math.round(m.sonraki), son]); } } const bar = HAVALAR.map(h => [h.id, h.formAdim / h.bar, h.formAdim % h.bar]); return { gecis, bar }; });
  kontrol('Havalar kendiliğinden sırayla döner (7 dakikada)', dongu.gecis.length >= 4 && dongu.gecis[1][1] === 'toz' && dongu.gecis[2][1] === 'cifte' && dongu.gecis[3][1] === 'harman', dongu.gecis);
  kontrol('Her havanın bölümleri ölçüye tam oturur', dongu.bar.every(x => x[2] === 0), dongu.bar);

  // ---------- SES ÖLÇÜMÜ ----------
  const ses = await p.evaluate(async () => {
    const { Muzik, HAVALAR } = CanliOyun._test, SR = 44100, sonuc = [];
    const isle = async (hi, sn, ayar) => { const oc = new OfflineAudioContext(1, SR * sn, SR), m = new Muzik(); m.hava = HAVALAR[hi]; m.sirayla = false; m.sesKur(oc); m.acik = true; m.sonraki = 0.05; ayar && ayar(m); const olay = []; while (m.sonraki < sn - 0.6) { const t = m.sonraki, a = m.adim, bd = 60 / (m.hava.bpm * m.carpan) / m.hava.spb; m.adimCal(); const n = m.hava.harita[a]; if (n) olay.push({ t, uz: n.len * bd, n }); } const vur = m.olaylar.filter(o => o.tip === 'dum' || o.tip === 'tek').map(o => [o.t, o.tip]); const buf = await oc.startRendering(); return { d: buf.getChannelData(0), olay, vur, m }; };
    const rms = (d, a, b) => { let q = 0; a = Math.max(0, a | 0); b = Math.min(d.length, b | 0); for (let i = a; i < b; i++) q += d[i] * d[i]; return Math.sqrt(q / Math.max(1, b - a)); };
    const perde = (d, orta) => { const N = 2048, s0 = (orta * SR - N / 2) | 0; let enIyi = 0, enLag = 0; const kor = lag => { let q = 0; for (let i = 0; i < N; i++) q += d[s0 + i] * d[s0 + i + lag]; return q; }; for (let lag = Math.floor(SR / 1500); lag <= Math.ceil(SR / 230); lag++) { const q = kor(lag); if (q > enIyi * 1.02) { enIyi = q; enLag = lag; } } const a = kor(enLag - 1), b2 = kor(enLag), c = kor(enLag + 1), kay = (a - c) / (2 * (a - 2 * b2 + c) || 1); return SR / (enLag + kay); };
    for (let hi = 0; hi < 3; hi++) {
      const h = HAVALAR[hi], sn = 24;
      // yalnız zurna: perde doğruluğu
      const z = await isle(hi, sn, m => { m.ses.davul.gain.value = 0; m.ses.dem.cik.value = 0; m.ses.yanki.value = 0; });
      const sapma = []; let olculen = 0;
      for (const o of z.olay) { if (o.n.sus || o.n.tril || o.uz < 0.14) continue; const beklenen = h.tonik * Math.pow(2, h.sent(o.n.deg) / 1200), f = perde(z.d, o.t + Math.min(0.1, o.uz * 0.62)); let c = 1200 * Math.log2(f / beklenen); if (Math.abs(c - 1200) < 60) c -= 1200; if (Math.abs(c + 1200) < 60) c += 1200; sapma.push(c); olculen++; }
      const mutlak = sapma.map(Math.abs).sort((a, b) => a - b);
      // yalnız davul: vuruş zamanlaması
      const dv = await isle(hi, sn, m => { m.ses.zurna.cik.value = 0; m.ses.dem.cik.value = 0; m.ses.yanki.value = 0; });
      // Sıkıştırıcı tüm sese sabit ~6 ms gecikme ekler; önemli olan vuruşların kendi içinde tutarlı olması.
      let gec = 0, enGec = 0, sessiz = 0; const baslar = { dum: [], tek: [] };
      for (let vi = 0; vi < dv.vur.length; vi++) { const [t, tip] = dv.vur[vi], i0 = (t * SR) | 0; let tepe = 0; for (let i = i0; i < i0 + SR * 0.03; i++) tepe = Math.max(tepe, Math.abs(dv.d[i])); if (tepe < 0.02) { sessiz++; continue; }
        if (vi && t - dv.vur[vi - 1][0] < 0.5 && dv.vur[vi - 1][1] === 'dum') continue; // önceki dümün kuyruğu ölçümü bozar
        let bas = -1; for (let i = i0; i < i0 + SR * 0.03; i++) if (Math.abs(dv.d[i]) > tepe * 0.25) { bas = i; break; } const ms = (bas - i0) / SR * 1000; baslar[tip].push(ms); if (ms > 13) gec++; enGec = Math.max(enGec, ms); }
      const yayilim = Math.max(Math.max(...baslar.dum) - Math.min(...baslar.dum), Math.max(...baslar.tek) - Math.min(...baslar.tek)); if (yayilim > 3) gec++;
      const dm = await isle(hi, sn, m => { m.ses.zurna.cik.value = 0; m.ses.davul.gain.value = 0; m.ses.yanki.value = 0; });
      const tam = await isle(hi, sn);
      let tepe = 0, kirpik = 0; for (const v of tam.d) { const a = Math.abs(v); if (a > tepe) tepe = a; if (a >= 0.999) kirpik++; }
      // solo bölümünde zurna gerçekten susuyor mu
      const soloBol = h.bolumBas.find(b => b.ad === 'D'), adimSn = 60 / h.bpm / h.spb, sB = 0.05 + soloBol.bas * adimSn, sS = sB + soloBol.uz * adimSn;
      const soloZ = sS < sn - 0.7 ? rms(z.d, (sB + 0.4) * SR, (sS - 0.05) * SR) : null;
      // spektrum: zurnanın parlaklığı (1–3,5 kHz bandının payı)
      const goertzel = (d, s0, N, f) => { const w = 2 * Math.PI * f / SR, cw = 2 * Math.cos(w); let a = 0, b = 0; for (let i = 0; i < N; i++) { const x = d[s0 + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N)) + cw * a - b; b = a; a = x; } return Math.sqrt(a * a + b * b - cw * a * b); };
      let alt = 0, orta = 0, ust = 0; for (let f = 200; f < 8000; f += 50) { const g = goertzel(z.d, SR * 3, 16384, f); if (f < 1000) alt += g * g; else if (f < 3500) orta += g * g; else ust += g * g; }
      sonuc.push({ hava: h.id, olculenNota: olculen, ortancaSapma: +mutlak[mutlak.length >> 1].toFixed(1), yuzde90: +mutlak[Math.floor(mutlak.length * 0.9)].toFixed(1), enBuyuk: +mutlak[mutlak.length - 1].toFixed(1), vurus: dv.vur.length, gecVurus: gec, sessizVurus: sessiz, enGecMs: +enGec.toFixed(2), yayilimMs: +yayilim.toFixed(2), olculenVurus: baslar.dum.length + baslar.tek.length, rmsZurna: +rms(z.d, SR, SR * 12).toFixed(3), rmsDavul: +rms(dv.d, SR, SR * 12).toFixed(3), rmsDem: +rms(dm.d, SR, SR * 12).toFixed(3), tepe: +tepe.toFixed(3), kirpilan: kirpik, soloZurnaRms: soloZ === null ? null : +soloZ.toFixed(4), bant: { alt: +(alt / (alt + orta + ust)).toFixed(2), orta: +(orta / (alt + orta + ust)).toFixed(2), ust: +(ust / (alt + orta + ust)).toFixed(2) } });
      if (hi === 0) { const kisa = tam.d.subarray(0, SR * 14), i16 = new Int16Array(kisa.length); for (let i = 0; i < kisa.length; i++) i16[i] = Math.max(-1, Math.min(1, kisa[i])) * 32767; let ikili = ''; const u8 = new Uint8Array(i16.buffer); for (let i = 0; i < u8.length; i += 8192) ikili += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); window.__wav = btoa(ikili); }
    }
    return sonuc;
  });
  for (const s of ses) {
    kontrol('Ses [' + s.hava + ']: zurna notaları doğru perdede', s.olculenNota > 20 && s.ortancaSapma < 12 && s.yuzde90 < 30, { nota: s.olculenNota, ortancaSent: s.ortancaSapma, yuzde90Sent: s.yuzde90, enBuyukSent: s.enBuyuk });
    kontrol('Ses [' + s.hava + ']: davul vuruşları zamanında', s.vurus > 30 && s.gecVurus === 0 && s.sessizVurus === 0, { vurus: s.vurus, olculen: s.olculenVurus, sessiz: s.sessizVurus, enGecMs: s.enGecMs, yayilimMs: s.yayilimMs });
    kontrol('Ses [' + s.hava + ']: kırpılma yok, tepe güvenli', s.kirpilan === 0 && s.tepe < 0.95, { tepe: s.tepe });
    kontrol('Ses [' + s.hava + ']: davul / zurna / dem dengesi', s.rmsZurna > 0.04 && s.rmsDavul > s.rmsZurna * 0.6 && s.rmsDem < s.rmsZurna * 0.4, { zurna: s.rmsZurna, davul: s.rmsDavul, dem: s.rmsDem, bant: s.bant });
    if (s.soloZurnaRms !== null) kontrol('Ses [' + s.hava + ']: davul solosunda zurna susar', s.soloZurnaRms < 0.01, s.soloZurnaRms);
  }
  const enYuksek = await p.evaluate(async () => { const { Muzik, HAVALAR } = CanliOyun._test, SR = 44100, cik = []; for (let hi = 0; hi < 3; hi++) { const oc = new OfflineAudioContext(1, SR * 16, SR), m = new Muzik(); m.hava = HAVALAR[hi]; m.sirayla = false; m.duzey = 0.7; m.sesKur(oc); m.acik = true; m.sonraki = 0.05; m.sov = true; m.cosku = 1; m.carpan = 1.38; while (m.sonraki < 15.4) m.adimCal(); const d = (await oc.startRendering()).getChannelData(0); let tepe = 0; for (const v of d) tepe = Math.max(tepe, Math.abs(v)); cik.push(+tepe.toFixed(3)); } return cik; });
  kontrol('Ses en yüksek düzeyde, en hızlı tempoda ve davul şovunda da kırpılmaz', enYuksek.every(x => x < 0.99), enYuksek);
  const wav = Buffer.from(await p.evaluate(() => window.__wav), 'base64'), bas = Buffer.alloc(44);
  bas.write('RIFF', 0); bas.writeUInt32LE(36 + wav.length, 4); bas.write('WAVEfmt ', 8); bas.writeUInt32LE(16, 16); bas.writeUInt16LE(1, 20); bas.writeUInt16LE(1, 22); bas.writeUInt32LE(44100, 24); bas.writeUInt32LE(88200, 28); bas.writeUInt16LE(2, 32); bas.writeUInt16LE(16, 34); bas.write('data', 36); bas.writeUInt32LE(wav.length, 40);
  fs.writeFileSync(CIKTI + '/harman.wav', Buffer.concat([bas, wav]));

  // ---------- HAZIR PARÇALAR (isteğe bağlı müzik klasörü) ----------
  // Depoda ses dosyası yoktur; test, sayfanın içinde 120 vuruş/dk'lık 4 saniyelik bir tık sesi üretip onu çaldırır.
  const hp = await ac(1280, 800);
  const hz = await hp.evaluate(async () => {
    const m = CanliOyun._test.muzik, bekle = ms => new Promise(r => setTimeout(r, ms));
    const SR = 22050, sn = 4, n = SR * sn, pcm = new Int16Array(n);
    for (let b = 0; b < sn * 2; b++) for (let i = 0; i < 600; i++) pcm[Math.floor((0.25 + b * 0.5) * SR) + i] = Math.sin(i * 0.3) * 20000 * (1 - i / 600);
    const bas = new DataView(new ArrayBuffer(44)), yaz = (o, s) => [...s].forEach((ch, i) => bas.setUint8(o + i, ch.charCodeAt(0)));
    yaz(0, 'RIFF'); bas.setUint32(4, 36 + n * 2, true); yaz(8, 'WAVEfmt '); bas.setUint32(16, 16, true); bas.setUint16(20, 1, true); bas.setUint16(22, 1, true);
    bas.setUint32(24, SR, true); bas.setUint32(28, SR * 2, true); bas.setUint16(32, 2, true); bas.setUint16(34, 16, true); yaz(36, 'data'); bas.setUint32(40, n * 2, true);
    const url = URL.createObjectURL(new Blob([bas, pcm], { type: 'audio/wav' }));
    const on = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const kotu = m.hazirKur([{ ad: 'x', dosya: '../kopru.js', vurus: on }, { ad: 'y', dosya: 'a.mp3', vurus: 'yok' }, { ad: 'z', dosya: 'http://kotu.test/a.mp3', vurus: on }, null, 5, { dosya: 'b.mp3', vurus: [0, 1, NaN, 3, 4, 5, 6, 7, 8, 9] }, { dosya: 'c.mp3', vurus: [0, 1] }]);
    const iyi = m.hazirKur([{ ad: '<b>deneme</b> ' + 'A'.repeat(200), dosya: 'deneme.wav', bpm: 120, kayma: 1, vurus: Array.from({ length: 10 }, (_, i) => 0.25 + i * 0.5) }]);
    const ad = m.parcalar[0].ad;
    m.muzikKok = ''; m.parcalar[0].dosya = url; // dosya yerine bellekteki ses
    const ornek = []; let dur = false;
    const al = () => { ornek.push([performance.now(), CanliOyun.durum().vurus, m.hazirCal]); if (!dur) requestAnimationFrame(al); }; al();
    await bekle(800); document.getElementById('ses-dugme').click(); await bekle(900);
    m.kaynakSec('hazir'); await bekle(2500);
    const calarken = { hazirCal: m.hazirCal, ad: m.calanAd(), bpm: Math.round(m.calanBpm()), bilgi: document.getElementById('cosku-bilgi').textContent };
    await bekle(3500); // parça biter, baştan başlar
    const dongu = m.hazirCal;
    m.kaynakSec('sentez'); await bekle(2500);
    const sentez = { hazirCal: m.hazirCal, durdu: m.calar.paused };
    m.kaynakSec('hazir'); await bekle(1500);
    const yeniden = m.hazirCal;
    document.getElementById('ses-dugme').click(); await bekle(1500); // ses kapanır: parça durur, saat yürümeye devam eder
    const kapali = { hazirCal: m.hazirCal, durdu: m.calar.paused, ses: m.acik };
    dur = true;
    let geri = 0, enDonma = 0, donmaBas = ornek[0][0], enSicrama = 0, hv = 0, hs = 0;
    for (let i = 1; i < ornek.length; i++) {
      const db = ornek[i][1] - ornek[i - 1][1], dt = (ornek[i][0] - ornek[i - 1][0]) / 1000;
      if (db < -0.02) geri++;
      if (db > 1e-4) donmaBas = ornek[i][0]; else enDonma = Math.max(enDonma, (ornek[i][0] - donmaBas) / 1000);
      enSicrama = Math.max(enSicrama, db - dt * 4.5);
      if (ornek[i][2] && ornek[i - 1][2] && db < 0.5) { hv += db; hs += dt; }
    }
    return { kotu, iyi, ad, calarken, dongu, sentez, yeniden, kapali, geri, enDonma: +enDonma.toFixed(2), enSicrama: +enSicrama.toFixed(2), hazirHiz: +(hv / hs).toFixed(2), ornek: ornek.length };
  });
  kontrol('Hazır parça listesi: bozuk, klasör dışı ya da adres içeren kayıtlar alınmaz', hz.kotu === 0 && hz.iyi === 1, { kotu: hz.kotu, iyi: hz.iyi });
  kontrol('Hazır parça adı temizlenir ve kısaltılır', Array.from(hz.ad).length <= 28, hz.ad);
  kontrol('Hazır parça seçilince o parça çalar, sahnede adı ve temposu yazar', hz.calarken.hazirCal && hz.calarken.bilgi.startsWith(hz.ad) && hz.calarken.bpm >= 118 && hz.calarken.bpm <= 152, hz.calarken);
  kontrol('Hazır parçada dans parçanın vuruşuyla yürür (saniyede 2–2,5 vuruş)', hz.hazirHiz > 1.85 && hz.hazirHiz < 2.7, hz.hazirHiz);
  kontrol('Hazır parça bitince çalmaya devam eder', hz.dongu === true);
  kontrol('Üretilen müziğe dönünce parça durur; yeniden seçilince çalar', !hz.sentez.hazirCal && hz.sentez.durdu && hz.yeniden, { sentez: hz.sentez, yeniden: hz.yeniden });
  kontrol('Ses kapatılınca hazır parça da durur', !hz.kapali.hazirCal && hz.kapali.durdu && !hz.kapali.ses, hz.kapali);
  kontrol('Müzik kaynağı değişirken vuruş saati geri gitmez, donmaz, ileri en çok iki ölçü atlar', hz.geri === 0 && hz.enDonma < 0.6 && hz.enSicrama < 8.5, { geri: hz.geri, enDonmaSn: hz.enDonma, enSicrama: hz.enSicrama, ornek: hz.ornek });
  await hp.close();

  // ---------- YAYIN GÖRÜNÜMÜ, 1080×1920, BAŞARIM ----------
  const y = await ac(1080, 1920, '#yayin');
  await y.evaluate(n => { for (let i = 0; i < n; i++) CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'y' + i, ad: 'izleyici_' + i }, jeton: 5 + i }); }, KAP);
  await y.waitForTimeout(6000);
  const yd = await y.evaluate(() => ({ w: document.getElementById('tuval').width, h: document.getElementById('tuval').height, panel: getComputedStyle(document.getElementById('panel')).display, sahne: document.getElementById('sahne').getBoundingClientRect().toJSON(), d: CanliOyun.durum() }));
  kontrol('Yayın görünümü: tuval 1080×1920, panel gizli', yd.w === 1080 && yd.h === 1920 && yd.panel === 'none' && Math.round(yd.sahne.width) === 1080, { tuval: yd.w + '×' + yd.h, panel: yd.panel });
  kontrol('1080×1920, ' + yd.d.kisi + ' kişi: kare başına işlem süresi (yazılımsal çizimde)', yd.d.kisi === KAP && yd.d.kareMs < 33, +yd.d.kareMs.toFixed(1) + ' ms');
  await y.screenshot({ path: CIKTI + '/t-yayin-1080.png' });
  await y.close();
  for (const [w, h] of [[1920, 1080], [900, 1600], [360, 640], [820, 700], [2560, 1440]]) {
    const q = await ac(w, h); const r = await q.evaluate(() => { const s = document.getElementById('sahne').getBoundingClientRect(); return { tasma: document.documentElement.scrollWidth - innerWidth, oran: s.width / s.height, sag: s.right, gen: innerWidth, alt: s.bottom, yuk: innerHeight }; });
    kontrol('Pencere ' + w + '×' + h + ': yatay taşma yok, sahne 9:16', r.tasma <= 0 && Math.abs(r.oran - 9 / 16) < 0.005 && r.sag <= r.gen + 0.5, { oran: +r.oran.toFixed(4), tasma: r.tasma }); await q.close();
  }

  // ---------- UZUN SÜRE ÇALIŞMA ----------
  const u = await ac(1280, 800);
  await u.evaluate(() => { document.getElementById('hiz-2').click(); });
  const bellek = [];
  for (let i = 0; i < 9; i++) {
    await u.waitForTimeout(10000);
    await u.evaluate(([i2, M]) => { CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'uz' + (i2 % 3), ad: 'uzun_' + (i2 % 3) }, jeton: M[i2 % Math.min(3, M.length)] }); }, [i, MINLER]);
    bellek.push(await u.evaluate(() => ({ mb: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1), dom: document.querySelectorAll('*').length, d: CanliOyun.durum(), oy: CanliOyun._test.D.oy.size })));
  }
  const ilk = bellek[2], son = bellek[bellek.length - 1];
  kontrol('90 sn çılgın kalabalık: bellek ve sayfa öğeleri şişmez', son.mb < ilk.mb + 25 && son.dom < ilk.dom + 30 && son.oy <= KAP + 24, { bellekMB: bellek.map(x => x.mb), oge: [ilk.dom, son.dom], karakter: son.oy });
  kontrol('90 sn çılgın kalabalık: akıcılık korunur', bellek.every(x => x.d.kareMs < 33), bellek.map(x => +x.d.kareMs.toFixed(1)));
  await u.locator('#sahne').screenshot({ path: CIKTI + '/t-uzun.png' });
  // sekme arkaya gidip gelince
  const gizli = await u.evaluate(async () => { const v0 = CanliOyun.durum().vurus; Object.defineProperty(document, 'hidden', { value: true, configurable: true }); await new Promise(r => setTimeout(r, 2500)); Object.defineProperty(document, 'hidden', { value: false, configurable: true }); await new Promise(r => setTimeout(r, 800)); const v1 = CanliOyun.durum().vurus; return { v0, v1 }; });
  kontrol('Sekme arkaya gidip gelince saat ilerlemeye devam eder', gizli.v1 > gizli.v0 + 3 && gizli.v1 < gizli.v0 + 14, gizli);

  // Oyun kodunda hata: döngü donmaz, hata bir kez bildirilir (ayrı sayfa; bilerek çıkarılan hata yukarıdaki
  // "sayfada hata çıkmadı" sayımına girmesin).
  const hs = await b.newPage({ viewport: { width: 720, height: 800 } }), hsHata = [];
  hs.on('pageerror', e => hsHata.push(e.message));
  await hs.goto(OYUN_URL);
  await hs.waitForTimeout(600);
  const kirik = await hs.evaluate(async () => {
    const D = CanliOyun._test.D, oy = D.oy;
    D.oy = null;
    await new Promise(r => setTimeout(r, 500));
    D.oy = oy;
    D.kareMs = 0;
    await new Promise(r => setTimeout(r, 600));
    return { kareMs: CanliOyun.durum().kareMs, kisi: CanliOyun.durum().kisi };
  });
  // Yarım saniyede ~30 kare bozuk çizilir; hata her karede değil bir kez düşmeli (panelin kendi zamanlayıcısı
  // da aynı bozuk durumu okuyup bir iki hata verebilir, o yüzden üst sınır 4).
  kontrol('Oyun kodunda hata olsa da kare döngüsü sürer, hata her karede yinelenmez', kirik.kareMs > 0 && hsHata.length >= 1 && hsHata.length <= 4, { kareMs: kirik.kareMs, hata: hsHata.length, ilk: (hsHata[0] || '').slice(0, 60) });
  await hs.close();

  kontrol('Tüm testler boyunca sayfada hata çıkmadı', hatalar.length === 0, hatalar.slice(0, 5).join(' | '));
  await b.close();
  process.exit(raporla(sonuc) ? 1 : 0);
})().catch(e => { console.error('TEST ÇÖKTÜ', e); process.exit(1); });
