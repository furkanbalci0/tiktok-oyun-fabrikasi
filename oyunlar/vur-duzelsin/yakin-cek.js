#!/usr/bin/env node
/* Televizyonun yakın çekimleri: genel kare küçük kaldığı için modelin ayrıntısına bunlarla bakılır.
 *
 *   node oyunlar/vur-duzelsin/yakin-cek.js
 *
 * Yazdıkları (test/cikti/vur-duzelsin/ altına, 1080×1920 yayın görünümünden kırpılmış):
 *   yakin-asama-0..4.png        görüntünün beş basamağı (karlı → renkli)
 *   yakin-<vuruş>-hazirlik.png  vuruşun kurulma anı (tokat, yumruk, tekme, ucan)
 *   yakin-<vuruş>-temas.png     değme anı: televizyon ezilmiş, çarpma efekti
 *   yakin-kule-tokat-temas.png  anteni tutanın yığının üstünden vuruşu
 *   yakin-hepsi.png             hepsi tek dosyada
 * Zaman çizgisi D.dondurU ile o anda tutulur (oyunun kendi deneme anahtarı); görüntü D.netSabit ile sabitlenir.
 * Kurulu Chrome: CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"
 */
'use strict';
const path = require('path'), fs = require('fs'), { pathToFileURL } = require('url');
const kok = path.join(__dirname, '..', '..'), oyun = path.join(__dirname, 'oyun.html'), cikti = path.join(kok, 'test', 'cikti', 'vur-duzelsin');
const playwright = require('playwright');
fs.mkdirSync(cikti, { recursive: true });

(async () => {
  const b = await playwright.chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const hatalar = [];
  p.on('pageerror', e => hatalar.push(String(e)));
  await p.addInitScript(() => { window.OYUN_MUZIK_KAPALI = true; });
  await p.goto(pathToFileURL(oyun).href + '#yayin');
  await p.waitForTimeout(600);
  await p.evaluate(() => {
    document.getElementById('ses-cagri').hidden = true;
    if (document.getElementById('oto').getAttribute('aria-pressed') === 'true') document.getElementById('oto').click();
    document.getElementById('bosalt').click();
    const O = (id, ad, j) => CanliOyun.olay(j ? { tip: 'hediye', kullanici: { id, ad }, jeton: j } : { tip: 'yorum', kullanici: { id, ad }, metin: 'x' });
    O('l', 'antenci_kemal', 500); O('a', 'zeyno.47', 0); O('b', 'elif_naz', 0); O('c', 'mert.can.21', 0); O('d', 'hasan.usta', 0);
  });
  await p.waitForTimeout(3500);
  const kutu = async () => {
    const e = await p.evaluate(() => CanliOyun.durum().tvEkran), k = 1080 / 720;
    const x0 = Math.max(0, e.x0 * k - 330), x1 = Math.min(1080, e.x1 * k + 170), y0 = Math.max(0, e.y0 * k - 40), y1 = Math.min(1920, e.y1 * k + 60);
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  };
  const yollar = [];
  const cek = async ad => { const y = path.join(cikti, 'yakin-' + ad + '.png'); await p.screenshot({ path: y, clip: await kutu() }); yollar.push(y); };
  // beş basamak
  for (let a = 0; a < 5; a++) {
    await p.evaluate(n => { const D = CanliOyun._test.D; D.netSabit = true; D.netlik = n; D.flas = 0; }, 0.1 + a * 0.2);
    await p.waitForTimeout(700);
    await cek('asama-' + a);
  }
  await p.evaluate(() => { CanliOyun._test.D.netlik = 0.3; });
  // istasyon vuruşları: hazırlık ve değme
  const J = { tokat: 1, yumruk: 10, tekme: 50, ucan: 200 };
  const TE = { tokat: 0.5, yumruk: 0.48, tekme: 0.5, ucan: 0.62 };
  for (const tip of Object.keys(J)) {
    await p.evaluate(j => CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'a', ad: 'zeyno.47' }, jeton: j }), J[tip]);
    for (let i = 0; i < 60; i++) {
      if (await p.evaluate(() => { const s = CanliOyun._test.D.ist; return s && s.faz === 'vur'; })) break;
      await p.waitForTimeout(100);
    }
    await p.evaluate(u => { CanliOyun._test.D.dondurU = u; }, tip === 'ucan' ? 0.5 : TE[tip] * 0.55);
    await p.waitForTimeout(250);
    await cek(tip + '-hazirlik');
    await p.evaluate(u => { CanliOyun._test.D.dondurU = u; }, TE[tip] + 0.01);
    await p.waitForTimeout(70);
    await cek(tip + '-temas');
    console.log('  ' + tip + ' değme anında yay: ' + JSON.stringify(await p.evaluate(() => { const t = CanliOyun._test.D.tv; return { ezilme: +t.sqL.toFixed(2), yatma: +t.sh.toFixed(3), zipla: +t.jy.toFixed(3) }; })));
    await p.evaluate(() => { CanliOyun._test.D.dondurU = null; });
    await p.waitForTimeout(tip === 'ucan' ? 2600 : 1500);
    await p.evaluate(() => { const D = CanliOyun._test.D; D.netlik = 0.3; D.dugme = null; });
  }
  // anteni tutanın vuruşu (yığının üstünden)
  await p.evaluate(() => CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'l', ad: 'antenci_kemal' }, jeton: 1 }));
  for (let i = 0; i < 40 && !(await p.evaluate(() => !!CanliOyun._test.D.kuleIs)); i++) await p.waitForTimeout(100);
  await p.evaluate(() => { CanliOyun._test.D.dondurU = 0.51; });
  await p.waitForTimeout(70);
  await cek('kule-tokat-temas');
  await p.evaluate(() => { CanliOyun._test.D.dondurU = null; });
  // hepsi bir arada
  const boy = await Promise.all(yollar.map(async y => { const im = await b.newPage(); await im.setContent('<img src="data:image/png;base64,' + fs.readFileSync(y).toString('base64') + '">'); const r = await im.evaluate(() => [document.images[0].naturalWidth, document.images[0].naturalHeight]); await im.close(); return r; }));
  const W = 420, H = Math.round(W * boy[0][1] / boy[0][0]), sut = 5, sat = Math.ceil(yollar.length / sut);
  const hep = await b.newPage({ viewport: { width: W * sut, height: (H + 22) * sat } });
  await hep.setContent('<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(' + sut + ',' + W + 'px);font:14px sans-serif;color:#eee">' + yollar.map(y => '<div><img style="width:' + W + 'px;height:' + H + 'px;object-fit:contain;display:block" src="data:image/png;base64,' + fs.readFileSync(y).toString('base64') + '"><div style="height:22px">' + path.basename(y) + '</div></div>').join('') + '</body>');
  await hep.waitForTimeout(300);
  await hep.screenshot({ path: path.join(cikti, 'yakin-hepsi.png') });
  await b.close();
  console.log('Yakın çekimler: ' + path.relative(kok, cikti) + ' (' + yollar.length + ' kare) · bak: yakin-hepsi.png');
  if (hatalar.length) { console.log('SAYFA HATALARI:\n  ' + [...new Set(hatalar)].slice(0, 5).join('\n  ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
