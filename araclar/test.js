#!/usr/bin/env node
/* Bütün testler: bir oyun için (node araclar/test.js <ad>) ya da oyunlar/ altındaki her oyun için.
 * Her oyunda sırayla: derleme güncel mi (derle.js --denetle), çekirdek testleri (cekirdek/test/cekirdek.test.js),
 * varsa oyunun kendi testi (oyunlar/<ad>/test.js). En sonda bir kez köprü testi (cekirdek/test/kopru.test.js; kapısı
 * KOPRU_TEST_PORT ile seçilir, öntanım 8791), müzik testi (cekirdek/test/muzik.test.js: bütün oyunların müziği düzgün ve
 * birbirinden farklı mı; dinleme önizlemesi yazar) ve araç testi (cekirdek/test/araclar.test.js: yeni-oyun, derle, kare-cek).
 * Biri bile kalırsa 1 koduyla çıkar. Tarayıcı: CHROME_PATH ya da playwright'ın Chromium'u (cekirdek/test/ortak.js).
 */
'use strict';
const { spawnSync } = require('child_process'), fs = require('fs'), path = require('path');
const KOK = path.join(__dirname, '..');
const istenen = process.argv[2];
const oyunlar = istenen ? [istenen] : fs.readdirSync(path.join(KOK, 'oyunlar')).filter(a => fs.existsSync(path.join(KOK, 'oyunlar', a, 'js', '00-ayar.js'))).sort();
const sonuc = [];
function calistir(ad, dosya, ...args) {
  console.log('\n==== ' + ad + ' ====');
  const r = spawnSync(process.execPath, [path.join(KOK, dosya), ...args], { cwd: KOK, stdio: 'inherit' });
  sonuc.push([r.status === 0 ? 'GEÇTİ' : 'KALDI', ad]);
}
for (const ad of oyunlar) {
  calistir(ad + ': derleme güncel', 'araclar/derle.js', '--denetle', ad);
  calistir(ad + ': çekirdek testleri', 'cekirdek/test/cekirdek.test.js', ad);
  if (fs.existsSync(path.join(KOK, 'oyunlar', ad, 'test.js')))
    calistir(ad + ': oyun testleri', 'oyunlar/' + ad + '/test.js', ad);
}
calistir('köprü testleri', 'cekirdek/test/kopru.test.js', oyunlar.includes('halay') ? 'halay' : oyunlar[0]);
// Müzik: her zaman bütün oyunlar birlikte (oyunların müziği birbirinden farklı mı, ancak hepsine bakınca anlaşılır).
// Önizlemeler: test/cikti/<ad>/muzik-onizleme.wav
calistir('müzik testleri (bütün oyunlar)', 'cekirdek/test/muzik.test.js');
calistir('araç testleri', 'cekirdek/test/araclar.test.js');
console.log('\n==== ÖZET ====');
for (const [d, ad] of sonuc)
  console.log(d, '|', ad);
const kalan = sonuc.filter(s => s[0] === 'KALDI').length;
console.log(kalan ? '\n' + kalan + ' bölüm kaldı.' : '\nHepsi geçti.');
process.exit(kalan ? 1 : 0);
