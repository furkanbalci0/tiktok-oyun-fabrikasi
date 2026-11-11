// Halaya özgü kontroller: mendil el değiştirince pankart, her kademenin sahnedeki hareketi, solo kuyruğu,
// hediyeyle müzik (tempo adımı, çök patlaması, hava sırası, solo temposu, sınırlar, hazır parça kipi).
// Çekirdek testleri ayrıca çalışır (cekirdek/test/cekirdek.test.js halay). Çalıştırma: node oyunlar/halay/test.js
'use strict';
const path = require('path');
const { OYUN_URL, CIKTI, tarayici, raporla, kontrolcu } = require(path.join(__dirname, '..', '..', 'cekirdek', 'test', 'ortak'));
const { sonuc, kontrol } = kontrolcu();

(async () => {
  const b = await tarayici();
  const hatalar = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on('pageerror', e => hatalar.push('SAYFA HATASI: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) hatalar.push(m.text()); });
  await p.goto(OYUN_URL);
  await p.waitForTimeout(600);
  const bosalt = () => p.evaluate(() => { document.getElementById('bosalt').click(); });
  const O = o => p.evaluate(o2 => CanliOyun.olay(o2), o);
  const durum = () => p.evaluate(() => CanliOyun.durum());

  // mendil el değiştirir
  await bosalt();
  await O({ tip: 'yorum', kullanici: { id: 'a', ad: 'Ali' }, metin: 'halay' });
  await O({ tip: 'yorum', kullanici: { id: 'b', ad: 'Bora' }, metin: 'selam' });
  let d = await durum();
  kontrol('Durumda halay başı adı da var', d.halayBasi === 'Ali' && d.lider === 'Ali', d.halayBasi);
  await O({ tip: 'hediye', kullanici: { id: 'b', ad: 'Bora' }, jeton: 5 });
  const pk = await p.evaluate(() => ({ pankart: document.getElementById('pankart-yeri').textContent, ucus: !!CanliOyun._test.D.mendilUcus }));
  kontrol('Mendil el değiştirince pankart yeni halay başını yazar, mendil uçar', /Mendil el değiştirdi/.test(pk.pankart) && pk.pankart.includes('Bora') && pk.ucus, pk);
  await p.waitForTimeout(1300);
  kontrol('Uçan mendil bir saniyede yerine varır', await p.evaluate(() => !CanliOyun._test.D.mendilUcus));

  // her kademe kendi hareketini başlatır
  await bosalt();
  const kd = await p.evaluate(() => {
    const D = CanliOyun._test.D, cik = {};
    D.sovBit = -1; // önceki denemelerden kalan davul şovu ölçümü bozmasın
    for (const j of [1, 9, 10, 49, 50, 199, 200, 999, 1000, 50000]) {
      CanliOyun._test.zamanEkle(0.2);
      const soloOnce = D.soloKuyruk.length + (D.solo ? 1 : 0);
      CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'kd' + j, ad: 'kd' + j }, jeton: j });
      const k = D.oy.get('kd' + j);
      cik[j] = { hareket: D.hareket && D.hareket.tip, sov: CanliOyun.durum().vurus < D.sovBit, solo: D.soloKuyruk.length + (D.solo ? 1 : 0) - soloOnce, zipla: k.zip1 > k.zip0 };
      D.hareket = null;
    }
    return cik;
  });
  const bekle = (j, h, sov, solo) => kd[j].hareket === h && kd[j].sov === sov && kd[j].solo === solo && kd[j].zipla;
  kontrol('1–9 jeton: yalnız gönderen zıplar', bekle(1, null, false, 0) && bekle(9, null, false, 0), [kd[1], kd[9]]);
  kontrol('10–49 jeton: herkes omuz titretir', bekle(10, 'omuz', false, 0) && bekle(49, 'omuz', false, 0), [kd[10], kd[49]]);
  kontrol('50–199 jeton: herkes çöker', bekle(50, 'cok', false, 0) && bekle(199, 'cok', false, 0), [kd[50], kd[199]]);
  kontrol('200–999 jeton: davul şovu başlar, omuz titrer', bekle(200, 'omuz', true, 0) && bekle(999, 'omuz', true, 0), [kd[200], kd[999]]);
  kontrol('1000+ jeton: gönderen solo kuyruğuna girer, davul şovu başlar', kd[1000].solo === 1 && kd[1000].sov && kd[50000].solo === 1, [kd[1000], kd[50000]]);
  await p.waitForTimeout(2500);
  d = await durum();
  kontrol('Solo sırası gelen ortaya çıkar', d.solo === 'kd1000', d.solo);
  await p.locator('#sahne').screenshot({ path: CIKTI + '/h-solo.png' });

  // solo kuyruğu selde de 4'te kalır
  await bosalt();
  const sel = await p.evaluate(() => {
    for (let i = 0; i < 3000; i++) CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'f' + (i % 300), ad: 'f' + (i % 300) }, jeton: [1, 10, 50, 200, 1000][i % 5] });
    return CanliOyun._test.D.soloKuyruk.length;
  });
  kontrol('Selde solo kuyruğu en çok 4 kişi', sel <= 4, sel);

  // ---- hediyeyle müzik: tempo ve hava (22-hediye-muzik.js). Süreler vuruşla ölçülür: saat dondurulup ilerletilir.
  const kare = (pg = p, n = 3) => pg.evaluate(n2 => new Promise(r => { const f = () => (n2-- > 0 ? requestAnimationFrame(f) : r()); f(); }), n);
  const hediye = (id, jeton, pg = p) => pg.evaluate(o2 => CanliOyun.olay(o2), { tip: 'hediye', kullanici: { id, ad: id }, jeton });
  const ilerle = async (db, pg = p) => { await pg.evaluate(d2 => CanliOyun._test.vurusIlerle(d2), db); await kare(pg); };
  const muz = (pg = p) => pg.evaluate(() => {
    const { D, muzik } = CanliOyun._test;
    return { ek: muzik.tempoEk, hedefHava: (muzik.bekleyen || muzik.hava).id, hava: muzik.hava.id, sira: (D.havaSira || []).length, carpan: muzik.carpan, havaSure: muzik.havaSure, solo: !!D.solo, parca: muzik.hazirCal ? muzik.hz.no : -1, hiz: muzik.calar ? muzik.calar.playbackRate : 0, pankart: document.getElementById('pankart-yeri').textContent };
  });
  // Temiz başlangıç: meydan boş, coşku ve şov yok, saat verilen vuruşta donmuş.
  const sifirla = async (b0, pg = p) => {
    await pg.evaluate(() => { document.getElementById('bosalt').click(); });
    await pg.evaluate(b2 => { const { D, muzik } = CanliOyun._test; D.cosku = 0; D.sovBit = -1; muzik.sov = false; CanliOyun._test.vurusDondur(b2); }, b0);
    await kare(pg);
  };
  const A = await p.evaluate(() => { const { OYUN, muzik } = CanliOyun._test; return { hm: OYUN.hediyeMuzik || {}, tempo: OYUN.tempo || {}, havalar: muzik.havalar.map(h => [h.id, h.ad]), nasil: OYUN.nasil, etki: OYUN.kademe.map(k => k.tip + ':' + k.etki) }; });
  const HM = A.hm, yakin = (a, b2) => Math.abs(a - b2) < 1e-9;
  const sonrakiHava = id => A.havalar[(A.havalar.findIndex(h => h[0] === id) + 1) % A.havalar.length];
  kontrol('Hediye müziği ayarları 00-ayar.js içinde: tempo adımı, tavan / taban, süreler, hava arası',
    HM.adim > 0 && HM.adimVurus >= 4 && HM.adimEnCok >= 2 && HM.cokAgir > 0 && HM.cokAgirVurus > 0 && HM.cokPatlama > HM.adim && HM.cokPatlamaVurus > 0 && HM.havaAra >= 8 && HM.havaSiraEnCok >= 2 && A.tempo.taban >= 0.8 && A.tempo.taban < 1 && A.tempo.tavan > 1.15 && A.tempo.tavan <= 1.38, { HM, tempo: A.tempo });

  // 1 jeton: müzik etkisi yok
  await sifirla(1000);
  let m0 = await muz();
  await hediye('z1', 1); await hediye('z2', 9); await kare();
  let m = await muz();
  kontrol('1–9 jeton: müziğe dokunmaz (tempo eki 0, hava aynı, sıra boş)', m.ek === 0 && m.hedefHava === m0.hedefHava && m.sira === 0, m);

  // 10 jeton: tempo bir kademe hızlanır, birikir, tavanı aşmaz, kendiliğinden söner
  await hediye('o1', 10); await kare();
  const o1 = (await muz()).ek;
  await hediye('o2', 49); await kare();
  const o2 = (await muz()).ek;
  for (let i = 0; i < 6; i++) await hediye('o' + (3 + i), 10);
  await kare();
  const o8 = (await muz()).ek;
  kontrol('10–49 jeton: tempo bir kademe hızlanır, üst üste gelenler birikir', yakin(o1, HM.adim) && yakin(o2, 2 * HM.adim), { o1, o2 });
  kontrol('Tempo kademeleri tavanı aşmaz (8 hediye)', yakin(o8, HM.adimEnCok * HM.adim), o8);
  await ilerle(HM.adimVurus + 1);
  kontrol('Tempo kademesi süresi dolunca kendiliğinden normale döner', (await muz()).ek === 0, await muz());
  await sifirla(1000);
  await hediye('o1', 10); await ilerle(8); await hediye('o2', 10); await ilerle(HM.adimVurus - 7.5);
  kontrol('Her tempo kademesi kendi süresince yaşar (ilki söner, ikincisi sürer)', yakin((await muz()).ek, HM.adim), await muz());

  // 50 jeton: önce ağırlaşır, sonra patlar, sonra normale döner
  await sifirla(1000);
  await hediye('c1', 50); await kare();
  const cAgir = (await muz()).ek;
  await ilerle(HM.cokAgirVurus + 0.25);
  const cPat = (await muz()).ek;
  await ilerle(HM.cokPatlamaVurus);
  const cSon = (await muz()).ek;
  kontrol('50–199 jeton: çökerken tempo ağırlaşır, kalkarken patlar, sonra normale döner', yakin(cAgir, -HM.cokAgir) && yakin(cPat, HM.cokPatlama) && cSon === 0, { cAgir, cPat, cSon });

  // 200 jeton: sıradaki hava, pankart, sıra ve hava arası
  await sifirla(1000);
  await p.evaluate(() => { CanliOyun._test.muzik.havaSure = 60; });
  m0 = await muz();
  const h1 = sonrakiHava(m0.hedefHava), h2 = sonrakiHava(h1[0]);
  await hediye('Davut', 200); await kare();
  for (let i = 0; i < 9; i++) await hediye('Ece' + i, 200);
  await kare();
  m = await muz();
  kontrol('200–999 jeton: sıradaki havaya geçilir', m0.hava !== h1[0] && m.hedefHava === h1[0], { once: m0.hedefHava, sonra: m.hedefHava });
  kontrol('Arka arkaya gelen hava hediyeleri sıraya girer, sıra sınırlıdır', m.sira === HM.havaSiraEnCok, m.sira);
  kontrol('Hediyeyle hava değişince kendiliğinden hava dönüşünün süresi baştan başlar', m.havaSure < 10, m.havaSure);
  await p.waitForFunction(id => CanliOyun._test.muzik.hava.id === id, h1[0], { timeout: 8000 }).catch(() => { });
  await kare();
  m = await muz();
  kontrol('Hava ölçü başında girer; pankart "Havayı <ad> değiştirdi" ve yeni havanın adını yazar', m.hava === h1[0] && m.pankart.includes('Havayı Davut değiştirdi') && m.pankart.includes(h1[1]), m);
  await p.waitForTimeout(700); // pankartın giriş canlandırması bitsin
  const yz = await p.evaluate(() => CanliOyun._test.olcum());
  const kesisir = (a, k) => a && k && a[0] < k[0] + k[2] && a[0] + a[2] > k[0] && a[1] < k[1] + k[3] && a[1] + a[3] > k[1];
  kontrol('Hava pankartı sıralama kutusuna ve yorum alanına girmez', yz.kutular.pankart && !kesisir(yz.kutular.pankart, yz.kutular.sira) && yz.kutular.pankart[1] + yz.kutular.pankart[3] < 1024, yz.kutular);
  await p.locator('#sahne').screenshot({ path: CIKTI + '/h-hava.png' });
  await ilerle(HM.havaAra - 1);
  const araOnce = await muz();
  await ilerle(1.5);
  const araSonra = await muz();
  kontrol('Hava, arası dolmadan yeniden değişmez; dolunca sıradaki hediye işlenir', araOnce.hedefHava === h1[0] && araOnce.sira === HM.havaSiraEnCok && araSonra.hedefHava === h2[0] && araSonra.sira === HM.havaSiraEnCok - 1, { araOnce, araSonra });

  // 1000 jeton: solo en hızlı tempoda, solo bitene dek hava değişmez
  await sifirla(1000);
  m0 = await muz();
  await hediye('Sena', 1000); await kare();
  await hediye('Hava', 200); await kare();
  const s1 = await muz();
  await ilerle(10);
  const s2 = await muz();
  await p.waitForTimeout(2600);
  const s3 = await muz();
  kontrol('1000+ jeton: solo sürerken hava değişmez, gelen hava hediyesi sırada bekler', s1.solo && s2.solo && s1.hedefHava === m0.hedefHava && s2.hedefHava === m0.hedefHava && s2.sira === 1, { s1, s2 });
  kontrol('1000+ jeton: solo en hızlı tempoda oynanır (tempo tavana çıkar, aşmaz)', s3.carpan > A.tempo.tavan - 0.03 && s3.carpan <= A.tempo.tavan + 1e-9, { carpan: s3.carpan, tavan: A.tempo.tavan });
  await ilerle(20);
  const s4 = await muz();
  kontrol('Solo bitince bekleyen hava değişimi işlenir, tempo eki kalkar', !s4.solo && s4.hedefHava === sonrakiHava(m0.hedefHava)[0] && s4.sira === 0 && s4.ek === 0, s4);

  // yayın güvenliği: hava sırada beklerken yayıncı adı gizler ya da izleyiciyi çıkarırsa pankart o adı yazmaz
  // (ad hediye anında değil, duyuru anında okunur)
  const masaDugme = async (id, sinif) => {
    await p.waitForFunction(id2 => [...document.querySelectorAll('#kisi-liste li')].some(li => li.dataset.id === id2), id, { timeout: 4000 }).catch(() => { });
    await p.evaluate(([id2, sinif2]) => { [...document.querySelectorAll('#kisi-liste li')].find(li => li.dataset.id === id2).querySelector(sinif2).click(); }, [id, sinif]);
  };
  const havaGirsin = async id => { await p.waitForFunction(id2 => CanliOyun._test.muzik.hava.id === id2, id, { timeout: 8000 }).catch(() => { }); await kare(); };
  for (const [id, sinif, beklenen, baslik] of [
    ['KabaAd', '.k-gizle', 'Havayı misafir değiştirdi', 'Adı gizlenen izleyicinin hava değişimi pankartta "misafir" yazar, eski adı yazmaz'],
    ['Kovulan', '.k-cikar', 'Hava değişti', 'Sahneden çıkarılan izleyicinin hava değişimi pankartta adsız duyurulur']
  ]) {
    await sifirla(1000);
    await p.evaluate(() => { CanliOyun._test.muzik.havaSure = 60; });
    const hg = sonrakiHava((await muz()).hedefHava);
    await hediye(id, 200); await kare();
    await masaDugme(id, sinif);
    await havaGirsin(hg[0]);
    m = await muz();
    kontrol(baslik, m.hava === hg[0] && m.pankart.includes(hg[1]) && m.pankart.includes(beklenen) && !m.pankart.includes(id), m);
    await p.evaluate(() => { document.getElementById('mod-temizle').click(); });
  }

  // alt sınır ve yumuşaklık: ağırlaşma abartılsa da tempo tabanın altına inmez, kare başına sıçramaz
  await sifirla(1000);
  const tb = await p.evaluate(async () => {
    const { OYUN, muzik } = CanliOyun._test, hm = OYUN.hediyeMuzik || {}, eski = hm.cokAgir;
    hm.cokAgir = 0.7;
    CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'agir', ad: 'agir' }, jeton: 50 });
    let enFark = 0, once = muzik.carpan, enAz = 9;
    const bit = performance.now() + 2600;
    while (performance.now() < bit) {
      await new Promise(r => requestAnimationFrame(r));
      enFark = Math.max(enFark, Math.abs(muzik.carpan - once));
      once = muzik.carpan;
      enAz = Math.min(enAz, once);
    }
    hm.cokAgir = eski;
    return { enFark, enAz, son: once };
  });
  kontrol('Tempo tabanın altına inmez', tb.son < A.tempo.taban + 0.03 && tb.enAz >= A.tempo.taban - 1e-9, { tb, taban: A.tempo.taban });
  kontrol('Tempo değişimi yumuşaktır (kare başına sıçrama yok)', tb.enFark > 0 && tb.enFark < 0.04, tb.enFark);

  // beğeni coşkuyu yükseltir ama halayda tempoya katkısı küçüktür
  await sifirla(1000);
  await p.waitForTimeout(2600);
  const bg0 = await muz();
  await O({ tip: 'begeni', kullanici: { id: 'bg', ad: 'bg' }, adet: 500 });
  const bgCosku = (await durum()).cosku;
  await p.waitForTimeout(2600);
  const bg1 = await muz();
  kontrol('Beğeni coşkuyu yükseltir; halayda tempoya katkısı küçüktür (en çok %10)', bgCosku > 0.9 && A.tempo.cosku > 0 && A.tempo.cosku <= 0.1 && Math.abs(bg0.carpan - 1) < 0.02 && bg1.carpan > 1.02 && bg1.carpan < 1.11, { cosku: bgCosku, once: bg0.carpan, sonra: bg1.carpan, katsayi: A.tempo.cosku });

  // müzik saati: hediyeler yağarken geri gitmez
  await bosalt();
  const saat = await p.evaluate(async () => {
    CanliOyun._test.vurusCoz();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    let geri = 0, once = CanliOyun.durum().vurus, i = 0;
    const ilk = once, bit = performance.now() + 2500;
    while (performance.now() < bit) {
      await new Promise(r => requestAnimationFrame(r));
      if (i++ % 12 === 0)
        CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'st' + i, ad: 'st' + i }, jeton: [10, 50, 200][(i / 12) % 3] });
      const v = CanliOyun.durum().vurus;
      if (v < once - 1e-9)
        geri++;
      once = v;
    }
    return { geri, ilerledi: once - ilk };
  });
  kontrol('Müzik saati tempo değişirken geri gitmez', saat.geri === 0 && saat.ilerledi > 2, saat);

  kontrol('Yazılar: beğeni artık "tempo" demez; kademe açıklamaları müzik etkisini söyler', !/tempo/i.test(A.nasil.begeni) && /hava/.test(A.etki.find(e => e.startsWith('davul:'))) && /tempo/.test(A.etki.find(e => e.startsWith('omuz:'))) && /tempo/.test(A.etki.find(e => e.startsWith('cok:'))) && /tempo/.test(A.etki.find(e => e.startsWith('solo:'))), { nasil: A.nasil, etki: A.etki });

  // ---- hazır parça kipi (sahte parça listesi; çekirdek testindeki yöntem): hava değişimi sıradaki parçaya geçer,
  // tempo o kipin sınırında kalır, yavaşlama adımı atlanır.
  const hp = await b.newPage({ viewport: { width: 1280, height: 800 } });
  hp.on('pageerror', e => hatalar.push('SAYFA HATASI (hazır): ' + e.message));
  await hp.goto(OYUN_URL);
  await hp.waitForTimeout(600);
  const hzBas = await hp.evaluate(async () => {
    const m = CanliOyun._test.muzik, bekle = ms => new Promise(r => setTimeout(r, ms));
    const SR = 11025, sn = 40, n = SR * sn, pcm = new Int16Array(n);
    for (let v = 0; v < sn * 2 - 1; v++) for (let i = 0; i < 300; i++) pcm[Math.floor((0.25 + v * 0.5) * SR) + i] = Math.sin(i * 0.6) * 20000 * (1 - i / 300);
    const bas = new DataView(new ArrayBuffer(44)), yaz = (o, s) => [...s].forEach((ch, i) => bas.setUint8(o + i, ch.charCodeAt(0)));
    yaz(0, 'RIFF'); bas.setUint32(4, 36 + n * 2, true); yaz(8, 'WAVEfmt '); bas.setUint32(16, 16, true); bas.setUint16(20, 1, true); bas.setUint16(22, 1, true);
    bas.setUint32(24, SR, true); bas.setUint32(28, SR * 2, true); bas.setUint16(32, 2, true); bas.setUint16(34, 16, true); yaz(36, 'data'); bas.setUint32(40, n * 2, true);
    const url = URL.createObjectURL(new Blob([bas, pcm], { type: 'audio/wav' }));
    const vurus = Array.from({ length: sn * 2 - 2 }, (_, i) => 0.25 + i * 0.5);
    m.hazirKur([{ ad: 'Parça Bir', dosya: 'bir.wav', bpm: 120, vurus }, { ad: 'Parça İki', dosya: 'iki.wav', bpm: 120, vurus }]);
    m.muzikKok = ''; m.parcalar.forEach(x => { x.dosya = url; }); // dosya yerine bellekteki ses
    document.getElementById('ses-dugme').click(); await bekle(900);
    await m.kaynakSec('hazir'); await bekle(800);
    return { hazirCal: m.hazirCal, no: m.hz ? m.hz.no : -1 };
  });
  kontrol('Hazır parça kipi sahte listeyle açıldı', hzBas.hazirCal && hzBas.no === 0, hzBas);
  await sifirla(1000, hp);
  await hediye('c1', 50, hp); await kare(hp);
  const hzAgir = (await muz(hp)).ek;
  await ilerle(HM.cokAgirVurus + 0.25, hp);
  const hzPat = (await muz(hp)).ek;
  kontrol('Hazır parçada yavaşlama adımı atlanır, patlama çalışır', hzAgir === 0 && yakin(hzPat, HM.cokPatlama), { hzAgir, hzPat });
  await sifirla(1000, hp);
  await hediye('Hasan', 200, hp); await kare(hp);
  await hp.waitForFunction(() => CanliOyun._test.muzik.hazirCal && CanliOyun._test.muzik.hz.no === 1, null, { timeout: 6000 }).catch(() => { });
  const hzHava = await hp.evaluate(() => ({ no: CanliOyun._test.muzik.hz.no, ad: CanliOyun._test.muzik.calanAd(), pankart: document.getElementById('pankart-yeri').textContent }));
  kontrol('Hazır parçada 200 jeton sıradaki parçaya geçer, pankart parçanın adını yazar', hzHava.no === 1 && hzHava.ad === 'Parça İki' && hzHava.pankart.includes('Havayı Hasan değiştirdi') && hzHava.pankart.includes('Parça İki'), hzHava);
  await hediye('Sena', 1000, hp); await kare(hp);
  await hediye('Hava', 200, hp);
  await ilerle(10, hp);
  await hp.waitForTimeout(2600);
  const hzSolo = await muz(hp);
  kontrol('Hazır parçada solo: hız o kipin sınırında kalır (en çok 1,25), parça solo bitene dek değişmez', hzSolo.solo && hzSolo.hiz > 1.2 && hzSolo.hiz <= 1.25 + 1e-9 && hzSolo.parca === 1 && hzSolo.sira === 1, hzSolo);
  await hp.close();

  kontrol('Halay testlerinde sayfada hata çıkmadı', hatalar.length === 0, hatalar.slice(0, 4).join(' | '));
  await b.close();
  process.exit(raporla(sonuc) ? 1 : 0);
})().catch(e => { console.error('TEST ÇÖKTÜ', e); process.exit(1); });
