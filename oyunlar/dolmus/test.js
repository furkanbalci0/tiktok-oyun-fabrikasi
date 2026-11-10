// Dolmuşa özgü kontroller: ön koltuk ve el değiştirmesi (koltuk boş kalmaz, sıçrayış başların üstünden), koltuk
// dizilişi, kadraj (dolmuş şeridi doldurur, yüzler iri, adlar çakışmaz, sahne yazılarının altına girmez), paranın
// arkadan öne elden ele şoföre inmesi, her kademenin etkisi, "müsait bir yerde" gösterisi, selde sınırlar, inen
// yolcu, yolun akması. Paranın geçtiği anlar yarım saniye arayla test/cikti/dolmus/para-1..3.png olarak yazılır.
// Çekirdek testleri ayrıca çalışır (cekirdek/test/cekirdek.test.js dolmus). Çalıştırma: node oyunlar/dolmus/test.js dolmus
'use strict';
const path = require('path');
const { OYUN_URL, CIKTI, tarayici, raporla, kontrolcu } = require(path.join(__dirname, '..', '..', 'cekirdek', 'test', 'ortak'));
const { sonuc, kontrol } = kontrolcu();

(async () => {
  const b = await tarayici();
  const hatalar = [];
  // Sahne 540×960: kare-cek'in ve yayın önizlemesinin boyu (yüz ölçüleri bu boyda verilir).
  const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  p.on('pageerror', e => hatalar.push('SAYFA HATASI: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) hatalar.push(m.text()); });
  await p.goto(OYUN_URL + '#yayin');
  await p.waitForTimeout(600);
  await p.evaluate(() => { document.getElementById('ses-cagri').hidden = true; if (document.getElementById('oto').getAttribute('aria-pressed') === 'true') document.getElementById('oto').click(); });
  const bosalt = () => p.evaluate(() => { document.getElementById('bosalt').click(); });
  const O = o => p.evaluate(o2 => CanliOyun.olay(o2), o);
  const durum = () => p.evaluate(() => CanliOyun.durum());

  // ön koltuk el değiştirir: eski lider arkaya, yenisi öne sıçrar; koltuk boş kalmaz; pankart yeni lider konunca
  await bosalt();
  await O({ tip: 'yorum', kullanici: { id: 'a', ad: 'Ali' }, metin: 'selam' });
  for (let i = 0; i < 6; i++) await O({ tip: 'yorum', kullanici: { id: 'y' + i, ad: 'yolcu' + i }, metin: 'x' });
  await p.waitForTimeout(2500);
  let d = await durum();
  const onK = await p.evaluate(() => { const D = CanliOyun._test.D, k = D.oy.get('a'); return { x: k.koltuk.x, z: k.koltuk.z, on: !!k.koltuk.on, sofor: [D.sofor.koltuk.x, D.sofor.koltuk.z] }; });
  kontrol('İlk binen ön koltuğa, şoförün yanına oturur (aynı sıra, en önde)', d.onKoltuk === 'Ali' && onK.on && onK.z === onK.sofor[1] && Math.abs(onK.x - onK.sofor[0]) < 1, onK);
  const devir = await p.evaluate(async () => {
    const D = CanliOyun._test.D, bekle = ms => new Promise(r => setTimeout(r, ms)), ali = D.oy.get('a'), yeni = D.oy.get('y5');
    CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'y5', ad: 'yolcu5' }, jeton: 5 });
    const pankartHemen = document.getElementById('pankart-yeri').textContent;
    let bos = 0, enYuksek = 0, pankart = '', t0 = performance.now(), son = t0;
    for (let i = 0; i < 90; i++) {
      await bekle(40);
      const s = performance.now();
      // ön koltukta oturan (havada olmayan) kimse yoksa ve ikisi de havada değilse koltuk boştur
      if (![...D.oy.values()].some(k => k.koltuk && k.koltuk.on && !k.atla) && !yeni.atla && !ali.atla)
        bos += s - son;
      son = s;
      if (yeni.atla)
        enYuksek = Math.max(enYuksek, yeni.y0 - yeni.by);
      if (!pankart && document.getElementById('pankart-yeri').textContent)
        pankart = document.getElementById('pankart-yeri').textContent + ' @' + Math.round(s - t0) + 'ms; yeni ' + (yeni.atla ? 'havada' : 'oturdu');
    }
    return { pankartHemen, pankart, bosMs: Math.round(bos), enYuksek: +enYuksek.toFixed(2), yeniOnde: !!yeni.koltuk.on, aliArkada: !ali.koltuk.on && !ali.atla };
  });
  kontrol('Ön koltuk el değiştirir: yenisi öne, eskisi arkaya sıçrar; pankart yeni lider koltuğa konunca çıkar', !devir.pankartHemen && /Ön koltuk el değiştirdi/.test(devir.pankart) && devir.pankart.includes('yolcu5') && devir.pankart.includes('oturdu') && devir.yeniOnde && devir.aliArkada, devir);
  kontrol('Koltuk değişirken ön koltuk boş kalmaz; değiştiren başların üstünden sıçrar', devir.bosMs < 200 && devir.enYuksek > 0.5, { bosMs: devir.bosMs, sicrayisM: devir.enYuksek });

  // diziliş ve kadraj: 15 kişi
  await bosalt();
  await p.evaluate(() => { for (let i = 0; i < 15; i++) CanliOyun.olay({ tip: i < 6 ? 'hediye' : 'yorum', kullanici: { id: 'd' + i, ad: 'dizi_yolcu_' + i }, jeton: 60 - i * 5, metin: 'x' }); });
  await p.waitForTimeout(6500);
  const diz = await p.evaluate(() => {
    const D = CanliOyun._test.D, s = D.sira, olc = 540 / 720;
    const kutu = s.filter(k => k.et).map(k => { const punto = 14 + (k === D.lider ? 4 : 0), yk = punto + 9; return [k.et.x, k.etY, yk]; });
    let cakisan = 0;
    for (let i = 0; i < kutu.length; i++)
      for (let j = i + 1; j < kutu.length; j++)
        if (Math.abs(kutu[i][1] - kutu[j][1]) < Math.min(kutu[i][2], kutu[j][2]) - 2 && Math.abs(kutu[i][0] - kutu[j][0]) < 40)
          cakisan++;
    return {
      kisi: s.length, ayni: new Set(s.map(k => k.koltuk.x + ',' + k.koltuk.z)).size, sirali: s.every((k, i) => i === 0 || k.koltuk.z >= s[i - 1].koltuk.z), oturdu: s.filter(k => k.otur > 0.9).length,
      etiket: s.filter(k => k.et || D.onSira.some(a => a.k === k)).length, onSira: D.onSira.length, enUstAd: Math.round(Math.min(...s.filter(k => k.et).map(k => k.etY))), enKucukYuz: +Math.min(...s.map(k => 0.27 * k.g.boy * k.p.kafa.s * olc)).toFixed(1),
      enBuyukYuz: +Math.max(...s.map(k => 0.27 * k.g.boy * k.p.kafa.s * olc)).toFixed(1), cakisan, kadraj: CanliOyun.durum().kadraj
    };
  });
  kontrol('Dolu dolmuşta iki yolcu aynı koltuğa konmaz; jetonu çok olan şoföre yakın oturur', diz.ayni === diz.kisi && diz.kisi === 15 && diz.sirali, diz);
  kontrol('Herkes oturdu ve her yolcunun adı yazılı', diz.oturdu === 15 && diz.etiket === 15, diz);
  kontrol('Dolmuş oyuncu şeridini doldurur: genişliğin %80\'i, tampon şeridin içinde, arka duvar şeridin üstüne taşmaz', diz.kadraj.sag - diz.kadraj.sol > 0.8 * 720 && diz.kadraj.alt <= 1006 && diz.kadraj.alt > 960 && diz.kadraj.ust >= 505, diz.kadraj);
  kontrol('15 yolcuda en küçük yüz bile iri (540×960 karede baş yarıçapı ≥ 32 px)', diz.enKucukYuz >= 32, { enKucuk: diz.enKucukYuz, enBuyuk: diz.enBuyukYuz });
  kontrol('Adlar sıralama kutusunun altına girmez ve birbirine binmez', diz.enUstAd >= 478 && diz.cakisan === 0, { enUstAdKutusu: diz.enUstAd, cakisan: diz.cakisan });
  await p.screenshot({ path: CIKTI + '/d-dolu.png' });

  // para elden ele: en arkadaki küçük bir hediye atar; banknot her sıradan bir elden geçip önden şoföre iner
  await bosalt();
  await p.evaluate(() => { for (let i = 0; i < 15; i++) CanliOyun.olay({ tip: 'yorum', kullanici: { id: 'p' + i, ad: 'para' + i }, metin: 'x' }); });
  await p.waitForTimeout(4000);
  const once = await durum();
  await O({ tip: 'hediye', kullanici: { id: 'p14', ad: 'para14' }, jeton: 1 });
  const izle = await p.evaluate(async () => {
    const D = CanliOyun._test.D, uzanan = new Set(), adimlar = [], bekle = ms => new Promise(r => setTimeout(r, ms));
    let yol = null, enYakin = 9, asagi = true, sonI = -1;
    for (let t = 0; t < 160; t++) {
      await bekle(40);
      const n = D.paralar[0];
      if (!n)
        break;
      if (!yol)
        yol = n.yol.map(k => k.ad + ':' + (k.koltuk ? k.koltuk.r : '?'));
      for (const k of [...D.oy.values(), D.sofor])
        if (k.uzat && !k.uzat.yukari)
          uzanan.add(k.ad);
      if (n.p && n.i < n.yol.length - 1) {
        const a = n.yol[n.i], b2 = n.yol[n.i + 1], el = k => (k.uzat && k.uzat.el === 'L' ? k.j.haL : k.j.haR);
        const uz = (x, y) => Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
        enYakin = Math.min(enYakin, Math.min(uz(n.p, el(a)), uz(n.p, el(b2))));
        adimlar.push(n.i);
        // her el değişiminde banknot öne gelir (alan, verenden önde ya da aynı sırada oturur)
        if (n.i !== sonI) {
          if (sonI >= 0 && a.koltuk && n.yol[sonI].koltuk && a.koltuk.z > n.yol[sonI].koltuk.z)
            asagi = false;
          sonI = n.i;
        }
      }
    }
    return { yol, uzanan: [...uzanan], enYakin: +enYakin.toFixed(3), adim: [...new Set(adimlar)].length, asagi, bitti: D.paralar.length === 0, kasa: D.kasa, sofor: D.tesekkur && D.tesekkur.m };
  });
  const sira = (izle.yol || []).slice(0, -1).map(s => +s.split(':')[1]);
  kontrol('Banknotun yolu: gönderen en arkada, her öndeki sıradan bir el, ön koltuk, en son şoför', izle.yol && izle.yol[0].startsWith('para14') && izle.yol[izle.yol.length - 1].startsWith('Şoför') && sira.every((r, i) => i === 0 || r < sira[i - 1]) && sira[sira.length - 1] === 0 && izle.yol.length >= 5, izle.yol);
  kontrol('Yoldaki herkes elini uzatır, banknot elden ele arkadan öne iner', izle.uzanan.length >= izle.yol.length - 1 && izle.uzanan.includes('Şoför') && izle.adim >= izle.yol.length - 1 && izle.enYakin < 0.05 && izle.asagi, { uzanan: izle.uzanan.length, adim: izle.adim, enYakin: izle.enYakin, asagi: izle.asagi });
  kontrol('Para şoföre varınca kasa dolar, şoför teşekkür eder', izle.bitti && izle.kasa === once.kasa + 1 && !!izle.sofor, { kasa: izle.kasa, sofor: izle.sofor });

  // paranın geçtiği anlar: yarım saniye arayla üç kare (en arkadan 10 jetonluk hediye)
  await p.waitForTimeout(800);
  await O({ tip: 'hediye', kullanici: { id: 'p13', ad: 'para13' }, jeton: 10 });
  const kareler = [];
  await p.waitForTimeout(700);
  for (let i = 0; i < 3; i++) {
    if (i) await p.waitForTimeout(500);
    await p.screenshot({ path: CIKTI + '/para-' + (i + 1) + '.png' });
    kareler.push(await p.evaluate(() => { const n = CanliOyun._test.D.paralar[0]; return n ? { el: n.i, kimde: n.yol[n.i].ad, kime: n.yol[n.i + 1] && n.yol[n.i + 1].ad, y: Math.round(n.iz.length ? n.iz[n.iz.length - 1][1] : -1) } : null; }));
  }
  kontrol('Yarım saniye arayla üç karede banknot başka ellerde ve gittikçe aşağıda (öne iniyor)', kareler.every(Boolean) && new Set(kareler.map(k => k.el)).size === 3 && kareler[1].y > kareler[0].y && kareler[2].y > kareler[1].y, kareler);

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

  // gösteri: dolmuş durur, gönderen ayağa kalkar, büyür ve ortaya gelir; adı büyük yazılır
  // Sabit süre beklemek yük altında kişiyi yolun ortasında yakalıyordu: ortaya varana dek beklenir (en çok 12 sn).
  await p.waitForTimeout(3600);
  await p.waitForFunction(() => { const g = CanliOyun._test.D.durak; return g && g.yakin && Math.abs(g.k.p.kafa.x - 360) < 80; }, null, { timeout: 12000 }).catch(() => { });
  const gs = await p.evaluate(() => {
    const D = CanliOyun._test.D, g = D.durak;
    return g && { ad: g.k.ad, yildiz: g.k.yildiz, ayakta: g.ayakta, yakin: g.yakin, otur: +g.k.otur.toFixed(2), olcek: +g.k.olcek.toFixed(2), hiz: +D.hiz.toFixed(2), ortada: Math.round(g.k.p.kafa.x), yaricap540: +(0.27 * g.k.g.boy * g.k.p.kafa.s * 0.75).toFixed(1), enUstAd: Math.round(Math.min(...[...D.oy.values()].filter(k => k.et).map(k => k.etY))) };
  });
  kontrol('Müsait bir yerde: dolmuş durur, gönderen ayağa kalkar, büyür, ortaya gelir; adlar sahne yazılarının altına girmez', gs && gs.ad === 'kd1000' && gs.yildiz && gs.ayakta && gs.yakin && gs.otur < 0.2 && gs.olcek > 1.25 && gs.hiz < 0.3 && Math.abs(gs.ortada - 360) < 90 && gs.yaricap540 > 50 && gs.enUstAd >= 478, gs);
  await p.screenshot({ path: CIKTI + '/d-durak.png' });
  const sonra = await p.evaluate(async () => { const D = CanliOyun._test.D; D.durak.bas -= 40; await new Promise(r => setTimeout(r, 400)); const k = D.oy.get('kd1000'); return { simdiki: D.durak ? D.durak.k.ad : null, eskiYildiz: k.yildiz }; });
  kontrol('Gösteri bitince sıradaki geçer, öncekinin yıldızlığı kalkar', sonra.simdiki === 'kd50000' && !sonra.eskiYildiz, sonra);

  // inen yolcu: yan duvarın üstünden kaldırıma sıçrar, dolmuş uzaklaşınca silinir
  await bosalt();
  const in1 = await p.evaluate(async () => {
    for (let i = 0; i < 4; i++) CanliOyun.olay({ tip: 'yorum', kullanici: { id: 'c' + i, ad: 'cik' + i }, metin: 'x' });
    await new Promise(r => setTimeout(r, 2500));
    const D = CanliOyun._test.D, k = D.oy.get('c3');
    k.son = -1e6;
    let enDis = 0;
    for (let t = 0; t < 50 && D.oy.has('c3'); t++) { await new Promise(r => setTimeout(r, 50)); enDis = Math.max(enDis, Math.abs(k.bx)); }
    return { cikti: !D.sira.includes(k), silindi: !D.oy.has('c3'), kaldirim: +enDis.toFixed(2) };
  });
  // yan duvar x = ±2,3'te; dışı kaldırım
  kontrol('Uzun süre sessiz kalan "müsait bir yerde" der, duvarın üstünden kaldırıma iner ve gider', in1.cikti && in1.silindi && in1.kaldirim > 2.4, in1);

  // hareket: yol akar, gövde yaylanır (önceki gösteride duran dolmuş önce hızlansın)
  await bosalt();
  for (let i = 0; i < 3; i++) await O({ tip: 'yorum', kullanici: { id: 'h' + i, ad: 'h' + i }, metin: 'x' });
  await p.waitForTimeout(2000);
  const hr = await p.evaluate(async () => {
    const D = CanliOyun._test.D, a = { kayma: D.kayma, v: CanliOyun.durum().vurus, z: CanliOyun._test.zaman(), t: performance.now() };
    const boblar = new Set();
    for (let i = 0; i < 12; i++) { await new Promise(r => setTimeout(r, 60)); boblar.add(D.bob.toFixed(4)); }
    return { kayma: +(D.kayma - a.kayma).toFixed(2), bob: boblar.size, hiz: +D.hiz.toFixed(2), vurus: +(CanliOyun.durum().vurus - a.v).toFixed(2), zaman: +(CanliOyun._test.zaman() - a.z).toFixed(2), gercek: +((performance.now() - a.t) / 1000).toFixed(2) };
  });
  kontrol('Yol akar ve dolmuş vuruşla yaylanır', hr.kayma > 0.5 && hr.bob > 4, hr);

  // Selde paralar ve gösteri sırası sınırlı kalır; sel durunca herkes yerleşir. En sonda: 3000 olay ana iş
  // parçacığını uzun kilitler ve çekirdeğin müzik saati (B) bir süre bekler, ondan sonraki ölçümleri bozardı.
  await bosalt();
  const sel = await p.evaluate(() => {
    for (let i = 0; i < 3000; i++) CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'f' + (i % 300), ad: 'f' + (i % 300) }, jeton: [1, 10, 50, 200, 1000][i % 5] });
    const D = CanliOyun._test.D; return { para: D.paralar.length, kuyruk: D.durakKuyruk.length };
  });
  kontrol('Selde havada en çok 10 banknot, gösteri sırasında en çok 4 kişi', sel.para <= 10 && sel.kuyruk <= 4, sel);
  await p.waitForTimeout(9000);
  const selSonra = await p.evaluate(() => { const D = CanliOyun._test.D, s = D.sira; return { yerinde: s.filter(k => k.koltuk === k.yeniKoltuk).length, kisi: s.length }; });
  kontrol('Sel durunca herkes yeni koltuğuna yerleşir', selSonra.yerinde === selSonra.kisi, selSonra);

  kontrol('Dolmuş testlerinde sayfada hata çıkmadı', hatalar.length === 0, hatalar.slice(0, 4).join(' | '));
  await b.close();
  process.exit(raporla(sonuc) ? 1 : 0);
})().catch(e => { console.error('TEST ÇÖKTÜ', e); process.exit(1); });
