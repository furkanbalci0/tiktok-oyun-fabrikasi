// Dolmuşa özgü kontroller: ön koltuk ve el değiştirmesi, koltuk dizilişi, paranın elden ele şoföre gitmesi,
// her kademenin sahnedeki etkisi, "müsait bir yerde" gösterisi, selde sınırlar, inen yolcu, yolun akması.
// Paranın geçtiği anların kareleri test/cikti/dolmus/para-*.png olarak yazılır (gözle bakmak için).
// Çekirdek testleri ayrıca çalışır (cekirdek/test/cekirdek.test.js dolmus). Çalıştırma: node oyunlar/dolmus/test.js dolmus
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
  await p.evaluate(() => { if (document.getElementById('oto').getAttribute('aria-pressed') === 'true') document.getElementById('oto').click(); });
  const bosalt = () => p.evaluate(() => { document.getElementById('bosalt').click(); });
  const O = o => p.evaluate(o2 => CanliOyun.olay(o2), o);
  const durum = () => p.evaluate(() => CanliOyun.durum());

  // ön koltuk el değiştirir
  await bosalt();
  await O({ tip: 'yorum', kullanici: { id: 'a', ad: 'Ali' }, metin: 'selam' });
  await O({ tip: 'yorum', kullanici: { id: 'b', ad: 'Bora' }, metin: 'selam' });
  let d = await durum();
  const onK = await p.evaluate(() => { const D = CanliOyun._test.D, k = D.oy.get('a'); return { hu: k.hu, hw: k.hw, sofor: [D.sofor.du, D.sofor.dw] }; });
  kontrol('İlk binen ön koltuğa, şoförün yanına oturur (aynı sıra, yakın yan)', d.onKoltuk === 'Ali' && onK.hu === onK.sofor[0] && onK.hw < 0 && onK.sofor[1] > 0, onK);
  await O({ tip: 'hediye', kullanici: { id: 'b', ad: 'Bora' }, jeton: 5 });
  const pk = await p.evaluate(() => ({ pankart: document.getElementById('pankart-yeri').textContent, parla: CanliOyun.durum().vurus - CanliOyun._test.D.parla, bora: CanliOyun._test.D.oy.get('b').hu, ali: CanliOyun._test.D.oy.get('a').hu }));
  kontrol('Ön koltuk el değiştirince pankart yeni sahibini yazar, koltuk parlar, eskisi arkaya geçer', /Ön koltuk el değiştirdi/.test(pk.pankart) && pk.pankart.includes('Bora') && pk.parla >= 0 && pk.parla < 1 && pk.bora < pk.ali, pk);

  // diziliş
  await bosalt();
  await p.evaluate(() => { for (let i = 0; i < 15; i++) CanliOyun.olay({ tip: i < 6 ? 'hediye' : 'yorum', kullanici: { id: 'd' + i, ad: 'dizi' + i }, jeton: 60 - i * 5, metin: 'x' }); });
  await p.waitForTimeout(4000);
  const diz = await p.evaluate(() => {
    const D = CanliOyun._test.D, s = D.sira;
    return { kisi: s.length, ayni: new Set(s.map(k => k.hu.toFixed(2) + ',' + k.hw.toFixed(2))).size, sirali: s.every((k, i) => i === 0 || k.hu >= s[i - 1].hu), oturdu: s.filter(k => k.otur > 0.9).length,
      etiket: s.filter(k => k.et).length, ekranda: s.filter(k => k.p.kafa && k.p.kafa.ok && k.p.kafa.x > 0 && k.p.kafa.x < 720 && k.p.kafa.y > 505 && k.p.kafa.y < 1006).length };
  });
  kontrol('Dolu dolmuşta iki yolcu aynı koltuğa konmaz', diz.ayni === diz.kisi && diz.kisi === 15, diz.ayni + '/' + diz.kisi);
  kontrol('Jetonu çok olan şoföre yakın oturur', diz.sirali, diz);
  kontrol('Herkes koltuğuna oturdu; her yolcunun başı oyun şeridinde ve adı yazılı', diz.oturdu === 15 && diz.ekranda === 15 && diz.etiket === 15, diz);
  await p.locator('#sahne').screenshot({ path: CIKTI + '/d-dolu.png' });

  // para elden ele: en arkadaki küçük bir hediye atar; banknot öndeki herkesin elinden geçip şoföre varır
  await bosalt();
  await p.evaluate(() => { for (let i = 0; i < 9; i++) CanliOyun.olay({ tip: 'yorum', kullanici: { id: 'p' + i, ad: 'para' + i }, metin: 'x' }); });
  await p.waitForTimeout(3500);
  const once = await durum();
  await O({ tip: 'hediye', kullanici: { id: 'p8', ad: 'para8' }, jeton: 1 });
  const izle = await p.evaluate(async () => {
    const D = CanliOyun._test.D, uzanan = new Set(), adimlar = [], bekle = ms => new Promise(r => setTimeout(r, ms));
    let yol = null, enYakin = 9, kare = 0;
    // gönderen para yoldayken arkada (eski koltuğunda) kalıyor mu
    const g = D.oy.get('p8'), tutuldu = !!g.tut && g.tut.u > g.hu;
    for (let t = 0; t < 140 && (D.paralar.length || !yol); t++) {
      await bekle(50);
      const n = D.paralar[0];
      if (!n)
        break;
      if (n.yol && !yol)
        yol = n.yol.map(k => k.ad + ':' + (k.hu === undefined ? k.du : k.hu).toFixed(2));
      for (const k of [...D.oy.values(), D.sofor])
        if (k.uzat && !k.uzat.yukari)
          uzanan.add(k.ad);
      if (n.p && n.yol && n.i < n.yol.length - 1) {
        // banknot hep iki el arasında: verenin ya da alanın eline yakın
        const a = n.yol[n.i], b2 = n.yol[n.i + 1], el = k => (k.uzat && k.uzat.el === 'L' ? k.j.haL : k.j.haR);
        const uz = (x, y) => Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
        enYakin = Math.min(enYakin, Math.min(uz(n.p, el(a)), uz(n.p, el(b2))));
        adimlar.push(n.i);
      }
      kare++;
    }
    return { yol, tutuldu, uzanan: [...uzanan], enYakin: +enYakin.toFixed(3), adim: [...new Set(adimlar)], bitti: D.paralar.length === 0, kasa: D.kasa, sofor: D.sofor.balon && D.sofor.balon.m };
  });
  // gönderen hediyeyle öne geçer ama parası varana dek eski koltuğunda oturur; aradakiler şoföre doğru sıralı
  const huSira = (izle.yol || []).slice(1, -1).map(s => +s.split(':')[1]);
  kontrol('Banknotun yolu: gönderen (eski koltuğundan), öndeki her yolcu şoföre doğru, en son şoför', izle.yol && izle.yol.length === 10 && izle.yol[0].startsWith('para8') && izle.yol[izle.yol.length - 1].startsWith('Şoför') && huSira.every((h, i) => i === 0 || h < huSira[i - 1]) && izle.tutuldu, { yol: izle.yol, eskiKoltukta: izle.tutuldu });
  kontrol('Yoldaki herkes elini uzatır, banknot elden ele geçer', izle.uzanan.length >= 9 && izle.uzanan.includes('Şoför') && izle.adim.length >= 8 && izle.enYakin < 0.05, { uzanan: izle.uzanan.length, adim: izle.adim.length, enYakin: izle.enYakin });
  kontrol('Para şoföre varınca kasa dolar, şoför teşekkür eder', izle.bitti && izle.kasa === once.kasa + 1 && !!izle.sofor, { kasa: izle.kasa, sofor: izle.sofor });

  // paranın geçtiği anların kareleri
  await O({ tip: 'hediye', kullanici: { id: 'p7', ad: 'para7' }, jeton: 50 });
  for (let i = 0; i < 3; i++) {
    await p.waitForTimeout(i ? 650 : 700);
    await p.locator('#sahne').screenshot({ path: CIKTI + '/para-' + (i + 1) + '.png' });
  }

  // her kademe kendi etkisini başlatır
  await bosalt();
  for (let i = 0; i < 5; i++) await O({ tip: 'yorum', kullanici: { id: 'e' + i, ad: 'eski' + i }, metin: 'x' });
  const kd = await p.evaluate(() => {
    const T = CanliOyun._test, D = T.D, cik = {};
    for (const j of [1, 9, 10, 49, 50, 199, 200, 999, 1000, 50000]) {
      T.zamanEkle(0.2);
      D.teyp = D.kasis = D.sollama = null;
      D.paralar.length = 0;
      const durOnce = D.durakKuyruk.length + (D.durak ? 1 : 0);
      CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'kd' + j, ad: 'kd' + j }, jeton: j });
      const ac = e => !!e && e.bas <= CanliOyun.durum().vurus + 2;
      cik[j] = { para: D.paralar.length, teyp: ac(D.teyp), kasis: ac(D.kasis), sollama: ac(D.sollama), durak: D.durakKuyruk.length + (D.durak ? 1 : 0) - durOnce };
    }
    return cik;
  });
  const yalniz = (x, ...acik) => x.para === 1 && ['teyp', 'kasis', 'sollama'].every(a => x[a] === acik.includes(a)) && x.durak === (acik.includes('durak') ? 1 : 0);
  kontrol('1–9 jeton: yalnız para elden ele gider', yalniz(kd[1]) && yalniz(kd[9]), [kd[1], kd[9]]);
  kontrol('10–49 jeton: para + şoför teybi açar', yalniz(kd[10], 'teyp') && yalniz(kd[49], 'teyp'), [kd[10], kd[49]]);
  kontrol('50–199 jeton: para + teyp + kasis', yalniz(kd[50], 'teyp', 'kasis') && yalniz(kd[199], 'teyp', 'kasis'), [kd[50], kd[199]]);
  kontrol('200–999 jeton: para + teyp + kasis + sollama', yalniz(kd[200], 'teyp', 'kasis', 'sollama') && yalniz(kd[999], 'teyp', 'kasis', 'sollama'), [kd[200], kd[999]]);
  kontrol('1000+ jeton: gönderen "müsait bir yerde" sırasına girer', yalniz(kd[1000], 'teyp', 'kasis', 'sollama', 'durak') && kd[50000].durak === 1, [kd[1000], kd[50000]]);

  // gösteri: dolmuş durur, gönderen ayağa kalkar ve büyür, kadraj ona daralır
  await p.waitForTimeout(3200);
  const gs = await p.evaluate(() => {
    const D = CanliOyun._test.D, g = D.durak;
    return g && { ad: g.k.ad, yildiz: g.k.yildiz, ayakta: g.ayakta, yakin: g.yakin, otur: +g.k.otur.toFixed(2), olcek: +g.k.olcek.toFixed(2), hiz: +D.hiz.toFixed(2), tabela: g.isaret !== null };
  });
  kontrol('Müsait bir yerde: dolmuş durur, gönderen ayağa kalkar, büyür, kadraj ona daralır, durak tabelası belirir', gs && gs.ad === 'kd1000' && gs.yildiz && gs.ayakta && gs.yakin && gs.otur < 0.2 && gs.olcek > 1.2 && gs.hiz < 0.3 && gs.tabela, gs);
  await p.locator('#sahne').screenshot({ path: CIKTI + '/d-durak.png' });
  const sonra = await p.evaluate(async () => { const D = CanliOyun._test.D; D.durak.bas -= 40; await new Promise(r => setTimeout(r, 400)); const k = D.oy.get('kd1000'); return { simdiki: D.durak ? D.durak.k.ad : null, eskiYildiz: k.yildiz }; });
  kontrol('Gösteri bitince sıradaki geçer, öncekinin yıldızlığı kalkar', sonra.simdiki === 'kd50000' && !sonra.eskiYildiz, sonra);

  // selde paralar ve gösteri sırası sınırlı kalır
  await bosalt();
  const sel = await p.evaluate(() => {
    for (let i = 0; i < 3000; i++) CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'f' + (i % 300), ad: 'f' + (i % 300) }, jeton: [1, 10, 50, 200, 1000][i % 5] });
    const D = CanliOyun._test.D; return { para: D.paralar.length, kuyruk: D.durakKuyruk.length };
  });
  kontrol('Selde havada en çok 10 banknot, gösteri sırasında en çok 4 kişi', sel.para <= 10 && sel.kuyruk <= 4, sel);

  // inen yolcu: kaldırıma iner, geride kalır, silinir
  await bosalt();
  const in1 = await p.evaluate(async () => {
    for (let i = 0; i < 4; i++) CanliOyun.olay({ tip: 'yorum', kullanici: { id: 'c' + i, ad: 'cik' + i }, metin: 'x' });
    await new Promise(r => setTimeout(r, 2500));
    const D = CanliOyun._test.D, k = D.oy.get('c3');
    k.son = -1e6;
    let enDis = 0;
    for (let t = 0; t < 50 && D.oy.has('c3'); t++) { await new Promise(r => setTimeout(r, 50)); enDis = Math.min(enDis, k.dw); }
    return { cikti: !D.sira.includes(k), silindi: !D.oy.has('c3'), kaldirim: +enDis.toFixed(2) };
  });
  kontrol('Uzun süre sessiz kalan "müsait bir yerde" der, kaldırıma iner ve gider', in1.cikti && in1.silindi && in1.kaldirim < -1.6, in1);

  // hareket: yol akar, gövde yaylanır
  await bosalt();
  for (let i = 0; i < 3; i++) await O({ tip: 'yorum', kullanici: { id: 'h' + i, ad: 'h' + i }, metin: 'x' });
  const hr = await p.evaluate(async () => {
    const D = CanliOyun._test.D, a = { kayma: D.kayma, bob: D.bob };
    const boblar = new Set();
    for (let i = 0; i < 12; i++) { await new Promise(r => setTimeout(r, 60)); boblar.add(D.bob.toFixed(4)); }
    return { kayma: +(D.kayma - a.kayma).toFixed(2), bob: boblar.size };
  });
  kontrol('Yol akar ve dolmuş vuruşla yaylanır', hr.kayma > 0.5 && hr.bob > 4, hr);

  kontrol('Dolmuş testlerinde sayfada hata çıkmadı', hatalar.length === 0, hatalar.slice(0, 4).join(' | '));
  await b.close();
  process.exit(raporla(sonuc) ? 1 : 0);
})().catch(e => { console.error('TEST ÇÖKTÜ', e); process.exit(1); });
