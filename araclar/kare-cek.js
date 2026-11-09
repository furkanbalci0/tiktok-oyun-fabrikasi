// README'deki görseli üretir: docs/ekran-goruntusu.png. Çalıştırma: npm run ekran
'use strict';
const path = require('path');
const { KOK, OYUN_URL, tarayici } = require('./ortak');
(async () => {
  const b = await tarayici(), p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  await p.goto(OYUN_URL + '#yayin'); await p.waitForTimeout(800);
  await p.evaluate(() => {
    const ekle = (ad, jeton) => MendilKimde.olay(jeton ? { tip: 'hediye', kullanici: { id: 'sahte:' + ad, ad }, jeton } : { tip: 'yorum', kullanici: { id: 'sahte:' + ad, ad }, metin: '' });
    for (const ad of ['mert.can.21', 'nazlı_can', 'ozan_dayı', 'sibel_abla', 'baran.21']) ekle(ad, 0);
    document.getElementById('ses-cagri').hidden = true;
  });
  await p.waitForTimeout(5200);
  await p.evaluate(() => MendilKimde.olay({ tip: 'yorum', kullanici: { id: 'sahte:nazlı_can', ad: 'nazlı_can' }, metin: 'çek çek çek' }));
  await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(KOK, 'docs', 'ekran-goruntusu.png') });
  await b.close(); console.log('docs/ekran-goruntusu.png yazıldı');
})().catch(e => { console.error(e); process.exit(1); });
