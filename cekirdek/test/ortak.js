// Testlerin ortak parçaları: tarayıcıyı açar, yolları ve sonuç raporunu sağlar.
'use strict';
const path = require('path'), fs = require('fs'), { pathToFileURL } = require('url');
let playwright;
try { playwright = require('playwright'); }
catch (e) { console.error('Testler için playwright gerekli:\n  npm install\n  npx playwright install chromium'); process.exit(2); }

const KOK = path.join(__dirname, '..');
const OYUN = path.join(KOK, 'mendil-kimde.html');
const OYUN_URL = pathToFileURL(OYUN).href;
const CIKTI = path.join(__dirname, 'cikti'); // ekran görüntüleri ve ses dosyası buraya yazılır (depoya girmez)
fs.mkdirSync(CIKTI, { recursive: true });

// CHROME_PATH verilirse o tarayıcı, verilmezse playwright'ın indirdiği Chromium kullanılır.
const tarayici = (ek = []) => playwright.chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', ...ek]
});

function raporla(sonuc) {
  const kalan = sonuc.filter(s => s[0] === 'KALDI').length;
  for (const s of sonuc) console.log(s[0], '|', s[1], s[2] ? '| ' + s[2].slice(0, 330) : '');
  console.log('\nTOPLAM', sonuc.length, 'kontrol,', kalan, 'kaldı');
  return kalan;
}
function kontrolcu() {
  const sonuc = [];
  const kontrol = (ad, kosul, ayrinti) => sonuc.push([kosul ? 'GEÇTİ' : 'KALDI', ad,
    ayrinti === undefined ? '' : typeof ayrinti === 'string' ? ayrinti : JSON.stringify(ayrinti, (x, v) => typeof v === 'bigint' ? v + 'n' : v)]);
  return { sonuc, kontrol };
}
module.exports = { KOK, OYUN, OYUN_URL, CIKTI, tarayici, raporla, kontrolcu };
