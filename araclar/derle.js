#!/usr/bin/env node
/* Derleme: src/ altındaki parçaları tek dosyalık oyuna (mendil-kimde.html) birleştirir.
 *
 *   node araclar/derle.js              mendil-kimde.html dosyasını yeniden üretir
 *   node araclar/derle.js --denetle    üretmez; depodaki dosya güncel değilse 1 koduyla çıkar
 *   node araclar/derle.js --parca YOL  <html>/<head>/<body> etiketleri olmadan, başka bir sayfaya
 *                                      gömülebilecek parça üretir
 *
 * Bağımlılığı yoktur. JS parçaları dosya adına göre sıralanıp tek bir kapalı işlevin içine
 * art arda eklenir; bu yüzden parçalar birbirinin değişkenlerini doğrudan görür ve SIRA ÖNEMLİDİR.
 */
'use strict';
const fs = require('fs'), path = require('path');
const kok = path.join(__dirname, '..'), oku = y => fs.readFileSync(path.join(kok, y), 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '');

const BASLIK = '<title>Mendil Kimde?</title>';
const YAZI_TIPI = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Rubik:wght@400;500;700&display=swap">';
const stil = oku('src/stil.css'), sayfa = oku('src/sayfa.html');
const js = fs.readdirSync(path.join(kok, 'src/js')).filter(d => d.endsWith('.js')).sort()
  .map(d => '/* ── src/js/' + d + ' ── */\n' + oku('src/js/' + d)).join('\n\n');
const betik = '<script>\n(() => {\n\'use strict\';\n' + js + '\n})();\n</script>';

const tam = `<!DOCTYPE html>
<!-- BU DOSYA ÜRETİLİR. Elle düzenleme: src/ altını değiştir, sonra "npm run derle" çalıştır. -->
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${BASLIK}
${YAZI_TIPI}
<style>
body{margin:0}[hidden]{display:none!important}
${stil}
</style>
</head>
<body>
${sayfa}

${betik}
</body>
</html>
`;
const parca = `${BASLIK}
<meta name="claude:viewport-fit-sides" content="cover">
${YAZI_TIPI}
<style>
${stil}
</style>

${sayfa}

${betik}
`;

const args = process.argv.slice(2), hedef = path.join(kok, 'mendil-kimde.html');
if (args[0] === '--parca') { fs.writeFileSync(path.resolve(args[1]), parca); console.log('parça yazıldı:', args[1]); }
else if (args[0] === '--denetle') {
  const eski = fs.existsSync(hedef) ? fs.readFileSync(hedef, 'utf8').replace(/\r\n/g, '\n') : '';
  if (eski !== tam) { console.error('mendil-kimde.html güncel değil. "npm run derle" çalıştırıp sonucu da işle (commit).'); process.exit(1); }
  console.log('mendil-kimde.html güncel.');
} else { fs.writeFileSync(hedef, tam); console.log('mendil-kimde.html yazıldı (' + tam.length + ' karakter).'); }
