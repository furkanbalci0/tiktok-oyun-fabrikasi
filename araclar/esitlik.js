#!/usr/bin/env node
/* Piksel eşitliği: çekirdekte bir şey değiştirince var olan oyunun görüntüsü değişti mi?
 *
 *   node araclar/esitlik.js <ad>                      şimdiki oyun.html ile son işlemedeki (HEAD) oyun.html
 *   node araclar/esitlik.js <ad> --taban <git-ref>    ... ile o işlemedeki oyun.html
 *   node araclar/esitlik.js <ad> --html <yol>         ... ile diskteki başka bir oyun.html
 *
 * kare-cek.js'in kareleri gerçek saatle alınır; iki çalıştırma hiçbir zaman aynı çıkmaz (vuruş saati, kameranın
 * salınımı, yürüyenlerin yeri, konfeti). Burada iki sayfa da aynı donmuş saatle sürülür: performance.now ve
 * requestAnimationFrame elle ilerler, Math.random tohumlu, setInterval durdurulmuş (müzik planlaması kare
 * dışında çalışıp tempoyu oynatmasın), ses ve web yazı tipi kapalı. Aynı olaylar aynı karede verilir; her denetim
 * noktasında iki tuvalin pikselleri karşılaştırılır. Fark varsa ilk farklı noktalar ve fark resmi yazılır.
 * Çıktı: test/cikti/<ad>/esitlik-*.png. Fark yoksa 0, varsa 1 koduyla çıkar.
 */
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), { pathToFileURL } = require('url'), { execFileSync } = require('child_process');
const kok = path.join(__dirname, '..'), args = process.argv.slice(2), ad = args[0];
if (!ad || !/^[\w-]+$/.test(ad)) { console.error('Kullanım: node araclar/esitlik.js <ad> [--taban <git-ref> | --html <yol>]'); process.exit(2); }
const deger = b => { const i = args.indexOf(b); return i > 0 ? args[i + 1] : null; };
// --yeni <yol>: şimdiki oyun.html yerine başka bir dosya (aracın kendi gürültüsünü ölçmek için aynı dosyayı ver)
const yeni = deger('--yeni') || path.join(kok, 'oyunlar', ad, 'oyun.html');
let eski = deger('--html');
if (!eski) {
  const ref = deger('--taban') || 'HEAD', gecici = path.join(os.tmpdir(), 'esitlik-' + ad + '-' + process.pid + '.html');
  fs.writeFileSync(gecici, execFileSync('git', ['show', ref + ':oyunlar/' + ad + '/oyun.html'], { cwd: kok, maxBuffer: 64 << 20 }));
  eski = gecici;
}
let playwright;
try { playwright = require('playwright'); }
catch (e) { console.error('playwright gerekli:\n  npm install'); process.exit(2); }
const cikti = path.join(kok, 'test', 'cikti', ad);
fs.mkdirSync(cikti, { recursive: true });
const W = +(process.env.W || 540), H = +(process.env.H || 960);

(async () => {
  // GPU ile çizimde kenar yumuşatması çalıştırmadan çalıştırmaya birkaç pikselde oynayabiliyor: yazılımla çizilir.
  const b = await playwright.chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', ...(process.env.ESITLIK_GPU ? [] : ['--disable-gpu', '--disable-accelerated-2d-canvas'])] });
  const ac = async yol => {
    const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    p.hatalar = [];
    p.on('pageerror', e => p.hatalar.push(e.message));
    await p.addInitScript(() => {
      window.OYUN_MUZIK_KAPALI = true;
      window.AudioContext = undefined;
      window.webkitAudioContext = undefined;
      let t = 1000;
      performance.now = () => t;
      window.__ileri = ms => { t += ms; };
      const kuyruk = [];
      window.requestAnimationFrame = cb => { kuyruk.push(cb); return kuyruk.length; };
      window.__kare = () => { const q = kuyruk.splice(0); for (const cb of q) cb(t); };
      window.setInterval = () => 0;
      let s = 12345;
      Math.random = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    });
    await p.goto(pathToFileURL(yol).href + '#yayin');
    await p.waitForTimeout(300);
    await p.evaluate(() => {
      document.getElementById('ses-cagri').hidden = true;
      if (document.getElementById('oto').getAttribute('aria-pressed') === 'true') document.getElementById('oto').click();
      document.getElementById('bosalt').click();
    });
    return p;
  };
  const kareler = (p, n) => p.evaluate(n2 => { for (let i = 0; i < n2; i++) { window.__ileri(1000 / 60); window.__kare(); } }, n);
  const ADLAR = ['mert.can.21', 'nazlı_can', 'ozan_dayı', 'sibel_abla', 'baran.21', 'elif_naz', 'Hacı Salihoğlu', 'kübra__34', 'yusuf61', 'Emre Aksu', 'zeynep', 'babie.live', 'Osman', 'LazReiL', 'almira', 'atike.11', 'Gumbatte', 'RAHMİCAN', 'ssuuddeli', 'usge.29', 'merve', 'editciumut', 'Servet Cankurt', 'Enver Paşa', 'Halil', 'Zeki', 'Hayal', 'aziz__im', 'selinay', 'EY', 'Bey_38', 'yukaa', 'Nazan', 'User2110', 'ilginTR', 'Fatma'];
  // kare-cek.js ile aynı kalabalık: ilk dördü hediye atmış
  const doldur = (p, n) => p.evaluate(([adlar, n2]) => {
    const jeton = [300, 60, 15, 5];
    for (let i = 0; i < n2; i++) {
      const a = adlar[i % adlar.length] + (i >= adlar.length ? '_' + i : ''), kim = { id: 'kare:' + a, ad: a };
      CanliOyun.olay(i < jeton.length ? { tip: 'hediye', kullanici: kim, jeton: jeton[i] } : { tip: 'yorum', kullanici: kim, metin: '' });
    }
  }, [ADLAR, n]);
  const tuval = p => p.evaluate(() => document.getElementById('tuval').toDataURL('image/png'));
  const sonuc = [];
  let farkVar = false;
  const karsilastir = async (pe, py, etiket) => {
    const a = await tuval(pe), byer = await tuval(py);
    const f = await py.evaluate(async ([v1, v2]) => {
      const yukle = async v => { const i = new Image(); i.src = v; await i.decode(); return i; };
      const i1 = await yukle(v1), i2 = await yukle(v2), w = i1.width, h = i1.height;
      const c1 = new OffscreenCanvas(w, h).getContext('2d'), c2 = new OffscreenCanvas(w, h).getContext('2d');
      c1.drawImage(i1, 0, 0);
      c2.drawImage(i2, 0, 0);
      const d1 = c1.getImageData(0, 0, w, h).data, d2 = c2.getImageData(0, 0, w, h).data, fc = new OffscreenCanvas(w, h), fx = fc.getContext('2d'), fd = fx.createImageData(w, h);
      let farkli = 0, enBuyuk = 0;
      const yer = [];
      for (let i = 0; i < d1.length; i += 4) {
        const m = Math.max(Math.abs(d1[i] - d2[i]), Math.abs(d1[i + 1] - d2[i + 1]), Math.abs(d1[i + 2] - d2[i + 2]), Math.abs(d1[i + 3] - d2[i + 3]));
        const g = d2[i] * 0.3 + d2[i + 1] * 0.59 + d2[i + 2] * 0.11;
        fd.data[i] = m ? 255 : g * 0.35; fd.data[i + 1] = m ? 0 : g * 0.35; fd.data[i + 2] = m ? 64 : g * 0.35; fd.data[i + 3] = 255;
        if (m) { farkli++; if (yer.length < 8) yer.push([(i / 4) % w, Math.floor(i / 4 / w), m]); }
        if (m > enBuyuk) enBuyuk = m;
      }
      fx.putImageData(fd, 0, 0);
      const blob = await fc.convertToBlob(), r = new FileReader();
      const url = await new Promise(res => { r.onload = () => res(r.result); r.readAsDataURL(blob); });
      return { farkli, enBuyuk, w, h, yer, url };
    }, [a, byer]);
    const sira = await Promise.all([pe, py].map(p => p.evaluate(() => document.getElementById('sira-liste').textContent)));
    sonuc.push({ etiket, farkliPiksel: f.farkli, enBuyukFark: f.enBuyuk, boyut: f.w + '×' + f.h, siraAyni: sira[0] === sira[1] });
    if (f.farkli || sira[0] !== sira[1]) {
      farkVar = true;
      console.log(etiket + ': ilk farklı noktalar', JSON.stringify(f.yer));
      fs.writeFileSync(path.join(cikti, 'esitlik-' + etiket + '-fark.png'), Buffer.from(f.url.split(',')[1], 'base64'));
    }
    fs.writeFileSync(path.join(cikti, 'esitlik-' + etiket + '.png'), Buffer.from(byer.split(',')[1], 'base64'));
  };
  const senaryo = async (etiket, kur) => {
    const pe = await ac(eski), py = await ac(yeni);
    let say = 0;
    await kur(pe, py, async (n, ara) => {
      for (let i = 0; i < n; i += ara) {
        const m = Math.min(ara, n - i);
        await kareler(pe, m);
        await kareler(py, m);
        say += m;
        await karsilastir(pe, py, etiket + '-' + String(say).padStart(4, '0'));
      }
    });
    for (const p of [pe, py]) if (p.hatalar.length) { farkVar = true; console.log('SAYFA HATASI (' + etiket + '):', p.hatalar.slice(0, 3).join(' | ')); }
    await pe.close();
    await py.close();
  };
  const ikisi = async (pe, py, fn) => { await fn(pe); await fn(py); };
  const kapasite = await (async () => { const p = await ac(yeni), k = await p.evaluate(() => CanliOyun._test.OYUN.kapasite || 36); await p.close(); return k; })();
  for (const [etiket, n] of [['1', 1], ['3', 3], ['9', 9], ['dolu', kapasite]])
    await senaryo(etiket, async (pe, py, yuru) => {
      await ikisi(pe, py, p => kareler(p, 2));
      await ikisi(pe, py, p => doldur(p, n));
      await yuru(390, 130);
      if (n > 2) await ikisi(pe, py, p => p.evaluate(a => CanliOyun.olay({ tip: 'yorum', kullanici: { id: 'kare:' + a, ad: a }, metin: 'selam!' }), ADLAR[2]));
      await yuru(60, 30);
    });
  await senaryo('hediye', async (pe, py, yuru) => {
    await ikisi(pe, py, p => kareler(p, 2));
    await ikisi(pe, py, p => doldur(p, Math.min(kapasite, 14)));
    await yuru(270, 270);
    await ikisi(pe, py, p => p.evaluate(a => CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'kare:' + a, ad: a }, jeton: CanliOyun._test.KADEME[0].min }), ADLAR[7]));
    await yuru(240, 40);
    // her kademeden birer hediye, beğeni seli
    await ikisi(pe, py, p => p.evaluate(() => { const K = CanliOyun._test.KADEME; K.forEach((x, i) => CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'kd' + i, ad: 'kademe_' + i }, jeton: x.min })); CanliOyun.olay({ tip: 'begeni', kullanici: { id: 'bg', ad: 'bg' }, adet: 200 }); }));
    await yuru(300, 60);
  });
  await b.close();
  console.table(sonuc);
  console.log(farkVar ? 'FARK VAR (' + path.relative(kok, cikti) + '/esitlik-*-fark.png)' : 'Bütün denetim noktalarında pikseller aynı (' + sonuc.length + ' nokta).');
  process.exit(farkVar ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
