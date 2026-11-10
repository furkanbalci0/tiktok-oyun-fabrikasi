// Müzik testleri: her oyunun kendi müziği düzgün mü, takımı farklı oyunlar birbirinden gerçekten farklı mı?
// Her oyunun sayfası açılır, oyunun kendi müziği (OYUN.muzik) sesi dosyaya yazan bir bağlamda (OfflineAudioContext)
// oyunun kullandığı yoldan üretilir. Kulak yerine ölçüm kullanılır (eşiklerin gerekçesi docs/MUZIK.md "Ölçümler"):
//   - düzey: algılanan ses yüksekliği (K süzgeçli, BS.1770'e yakın) davul zurnanın düzeyine yakın; tepe güvenli;
//     kırpılma, sessiz yer, DC kayması yok;
//   - denge: davul, ezgi ve eşlik ayrı ayrı üretilir; ezgi duyulur, hiçbiri ezgiyi bastırmaz;
//   - fark: takımı farklı her iki oyun arasında ezginin tınısı (oktav bantlarındaki tayf zarfı ve harmonik dizilişi)
//     ve davulun tınısı (oktav bantları) ölçülür; ikisi de ayrışmıyorsa test kalır.
// Dinlemek için her oyuna 30 saniyelik önizleme yazılır: test/cikti/<ad>/muzik-onizleme.wav (havalar sırayla).
// Ölçümlerin tamamı test/cikti/muzik-olcum.json'a yazılır.
// Çalıştırma: node cekirdek/test/muzik.test.js [ad ...]   (ad verilmezse oyunlar/ altındaki her oyun)
'use strict';
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
const { KOK, tarayici, raporla, kontrolcu } = require('./ortak');
const { sonuc, kontrol } = kontrolcu();
const adlar = process.argv.slice(2).filter(a => !a.startsWith('--'));
const OYUNLAR = adlar.length ? adlar : fs.readdirSync(path.join(KOK, 'oyunlar')).filter(a => fs.existsSync(path.join(KOK, 'oyunlar', a, 'oyun.html'))).sort();
// duzeyDb: davul zurnaya göre en çok ± bu kadar dB · ezgiBant / ezgiHarm / davulBant: iki oyunun ortalama dB farkı
// (oktav bantları ya da harmonikler üzerinden) bu eşiklerin altındaysa o yönden "aynı" sayılır.
const ESIK = { duzeyDb: 2.5, ezgiBant: 4, ezgiHarm: 4, davulBant: 3 };

// Sayfanın içinde çalışır. Oyunun her havasını üretir ve ölçer; önizlemeyi WAV olarak döndürür.
async function olc(onizlemeSn) {
  const T = CanliOyun._test, { Muzik, HAVALAR, TAKIM, TAKIMLAR, havalarKur } = T, SR = 44100;
  // ---- küçük sinyal araçları
  const fft = (re, im) => {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) {
      const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a), y = len / 2;
      for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < y; k++) { const ur = re[i + k], ui = im[i + k], vr = re[i + k + y] * cr - im[i + k + y] * ci, vi = re[i + k + y] * ci + im[i + k + y] * cr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + y] = ur - vr; im[i + k + y] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
    }
  };
  const genlik = (d, s0, N) => { const re = new Float32Array(N), im = new Float32Array(N); for (let i = 0; i < N; i++) re[i] = (d[s0 + i] || 0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N)); fft(re, im); const g = new Float32Array(N / 2); for (let i = 0; i < N / 2; i++) g[i] = Math.hypot(re[i], im[i]); return g; };
  const rms = (d, a = 0, b = d.length) => { let q = 0; for (let i = a; i < b; i++) q += d[i] * d[i]; return Math.sqrt(q / Math.max(1, b - a)); };
  const db = v => 20 * Math.log10(Math.max(1e-9, v));
  // K süzgeci (ITU-R BS.1770: 1,68 kHz üstüne +4 dB raf, 38 Hz alt geçiren); RBJ çift kutuplu süzgeçlerle
  const biquad = (d, [b0, b1, b2, a0, a1, a2]) => { const y = new Float32Array(d.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < d.length; i++) { const x = d[i], v = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = v; y[i] = v; } return y; };
  const raf = (() => { const A = Math.pow(10, 4 / 40), w = 2 * Math.PI * 1681.97 / SR, c = Math.cos(w), al = Math.sin(w) / (2 * 0.7071), s = 2 * Math.sqrt(A) * al; return [A * ((A + 1) + (A - 1) * c + s), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - s), (A + 1) - (A - 1) * c + s, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - s]; })();
  const ag = (() => { const w = 2 * Math.PI * 38.13 / SR, c = Math.cos(w), al = Math.sin(w) / (2 * 0.5003); return [(1 + c) / 2, -(1 + c), (1 + c) / 2, 1 + al, -2 * c, 1 - al]; })();
  const kSuz = d => biquad(biquad(d, raf), ag);
  const lufs = d => +(-0.691 + 10 * Math.log10(Math.max(1e-12, rms(kSuz(d)) ** 2))).toFixed(1);
  // oktav bantları (63 Hz … 16 kHz): her bandın gücü, en güçlü banda göre dB (-50'de kırpılır)
  const OKTAV = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  const tayf = d => {
    const N = 4096, top = new Float64Array(N / 2);
    for (let s0 = 0; s0 + N < d.length; s0 += N / 2) { const g = genlik(d, s0, N); for (let i = 0; i < N / 2; i++) top[i] += g[i] * g[i]; }
    let tum = 0, mer = 0; const bant = OKTAV.map(() => 0);
    for (let i = 1; i < N / 2; i++) { const f = i * SR / N; tum += top[i]; mer += top[i] * f; const k = OKTAV.findIndex(m => f >= m / Math.SQRT2 && f < m * Math.SQRT2); if (k >= 0) bant[k] += top[i]; }
    const ust = Math.max(...bant);
    return { merkez: Math.round(mer / tum), oktavDb: bant.map(v => +Math.max(-50, 10 * Math.log10(v / ust)).toFixed(1)) };
  };
  // ---- bir havayı üret: kanal = açık kollar (davul / ezgi / eslik / yanki); verilmezse hepsi
  const isle = async (m, sn, kanal) => {
    const oc = new OfflineAudioContext(1, SR * sn, SR);
    m.sesKur(oc);
    if (kanal) for (const k of ['davul', 'ezgi', 'eslik', 'yanki']) if (!kanal.includes(k)) m.ses.kanal[k].value = 0;
    m.acik = true; m.sonraki = 0.05;
    const notalar = [];
    while (m.sonraki < sn - 0.6) { const t = m.sonraki, a = m.adim, h = m.hava, bd = 60 / (h.bpm * m.carpan) / h.spb; m.adimCal(); const n = h.harita[a]; if (n && !n.sus) notalar.push({ t, uz: n.len * bd, f: h.frek(n.deg) }); }
    return { d: (await oc.startRendering()).getChannelData(0), notalar };
  };
  const yeni = (takim, havalar, hi) => { const m = new Muzik(takim, havalar); m.hava = havalar[hi]; m.sirayla = false; return m; };
  const havaOlc = async (takim, havalar, hi) => {
    const sn = 20, d = (await isle(yeni(takim, havalar, hi), sn)).d;
    const ezgi = await isle(yeni(takim, havalar, hi), sn, ['ezgi']), dv = (await isle(yeni(takim, havalar, hi), sn, ['davul'])).d, es = (await isle(yeni(takim, havalar, hi), sn, ['eslik'])).d;
    let tepe = 0, kirpik = 0, ort = 0;
    for (const v of d) { const a = Math.abs(v); if (a > tepe) tepe = a; if (a >= 0.999) kirpik++; ort += v; }
    let sessiz = 0, pencere = 0; for (let s0 = SR; s0 + SR / 10 < d.length - SR; s0 += SR / 10) { pencere++; if (rms(d, s0, s0 + SR / 10) < 0.003) sessiz++; }
    // ezginin harmonik dizilişi: her uzun notada ilk 10 harmonik, en güçlüsüne göre dB (-40'ta kırpılır)
    const ed = ezgi.d, N = 4096, harm = new Float64Array(10); let say = 0;
    for (const o of ezgi.notalar) {
      if (o.uz < 0.15 || o.t + 0.05 + N / SR > sn) continue;
      const g = genlik(ed, Math.floor((o.t + 0.04) * SR), N), a = [];
      for (let k = 1; k <= 10; k++) { const b = k * o.f * N / SR; let en = 0; for (let i = Math.floor(b) - 2; i <= Math.ceil(b) + 2; i++) if (i > 0 && i < N / 2) en = Math.max(en, g[i]); a.push(k * o.f < 11000 ? en : 0); }
      const ust = Math.max(...a); if (!(ust > 0)) continue;
      a.forEach((v, k) => { harm[k] += v / ust; }); say++;
    }
    const h = havalar[hi], ezT = tayf(ed), tam = tayf(d);
    return { hava: h.id, ad: h.ad, bpm: h.bpm, lufs: lufs(d), rmsDb: +db(rms(d)).toFixed(1), tepe: +tepe.toFixed(3), kirpik, dc: +(ort / d.length).toFixed(5), sessizPay: +(sessiz / pencere).toFixed(3),
      ezgiLufs: lufs(ed), davulLufs: lufs(dv), eslikLufs: lufs(es), merkez: tam.merkez, oktavDb: tam.oktavDb, ezgiOktav: ezT.oktavDb, ezgiMerkez: ezT.merkez, davulOktav: tayf(dv).oktavDb,
      harmonik: Array.from(harm, v => +Math.max(-40, db(v / Math.max(1, say))).toFixed(1)), olculenNota: say };
  };
  const cik = { takim: Object.keys(TAKIMLAR).find(k => TAKIMLAR[k] === TAKIM), bildirim: !!T.OYUN.muzik, havalar: [], havaImza: HAVALAR.map(h => h.id + ':' + JSON.stringify([h.bolum, h.dizi, h.tonik, h.bpm])).join('|') };
  for (let hi = 0; hi < HAVALAR.length; hi++) cik.havalar.push(await havaOlc(TAKIM, HAVALAR, hi));
  // karşılaştırma ölçüsü: aynı sayfada davul zurnanın ilk havası
  cik.davulZurna = await havaOlc(TAKIMLAR['davul-zurna'], havalarKur(TAKIMLAR['davul-zurna']), 0);
  // ---- önizleme: havalar sırayla, oyunun kullandığı yoldan (bekleyen hava bir sonraki ölçü başında girer)
  const oc = new OfflineAudioContext(2, SR * onizlemeSn, SR), m = new Muzik();
  m.sirayla = false; m.sesKur(oc); m.acik = true; m.sonraki = 0.05;
  let sira = 0;
  while (m.sonraki < onizlemeSn - 0.05) { const k = Math.floor(m.sonraki / (onizlemeSn / HAVALAR.length)); if (k > sira && k < HAVALAR.length) { sira = k; m.bekleyen = HAVALAR[k]; } m.adimCal(); }
  const buf = await oc.startRendering(), L = buf.getChannelData(0), R = buf.getChannelData(1);
  // son yarım saniye yumuşakça kısılır (kesik bitmesin)
  const pcm = new Int16Array(L.length * 2);
  for (let i = 0; i < L.length; i++) { const s = Math.min(1, (L.length - i) / (SR / 2)); pcm[2 * i] = Math.max(-1, Math.min(1, L[i] * s)) * 32767; pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i] * s)) * 32767; }
  const u8 = new Uint8Array(pcm.buffer); let ikili = '';
  for (let i = 0; i < u8.length; i += 8192) ikili += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
  cik.wav = btoa(ikili);
  cik.onizlemeHavalar = HAVALAR.map(h => h.ad);
  return cik;
}

const wavYaz = (yol, b64) => {
  const veri = Buffer.from(b64, 'base64'), bas = Buffer.alloc(44);
  bas.write('RIFF', 0); bas.writeUInt32LE(36 + veri.length, 4); bas.write('WAVEfmt ', 8); bas.writeUInt32LE(16, 16); bas.writeUInt16LE(1, 20); bas.writeUInt16LE(2, 22);
  bas.writeUInt32LE(44100, 24); bas.writeUInt32LE(44100 * 4, 28); bas.writeUInt16LE(4, 32); bas.writeUInt16LE(16, 34); bas.write('data', 36); bas.writeUInt32LE(veri.length, 40);
  fs.writeFileSync(yol, Buffer.concat([bas, veri]));
};
const ortalama = (liste, f) => liste.reduce((a, x) => a + f(x), 0) / liste.length;
const vektorOrt = (liste, f) => f(liste[0]).map((_, i) => ortalama(liste, x => f(x)[i]));
const dbFark = (a, b) => +ortalama(a.map((v, k) => [v, b[k]]), ([x, y]) => Math.abs(x - y)).toFixed(2);

(async () => {
  const b = await tarayici();
  const hatalar = [], olcum = {};
  for (const ad of OYUNLAR) {
    const p = await b.newPage();
    p.on('pageerror', e => hatalar.push(ad + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) hatalar.push(ad + ': ' + m.text()); });
    await p.goto(pathToFileURL(path.join(KOK, 'oyunlar', ad, 'oyun.html')).href);
    await p.waitForTimeout(400);
    const r = await p.evaluate(olc, 30);
    await p.close();
    const cikti = path.join(KOK, 'test', 'cikti', ad);
    fs.mkdirSync(cikti, { recursive: true });
    wavYaz(path.join(cikti, 'muzik-onizleme.wav'), r.wav);
    delete r.wav;
    olcum[ad] = r;
    const ref = r.davulZurna.lufs;
    console.log('\n' + ad + ' · takım ' + r.takim + (r.bildirim ? '' : ' (OYUN.muzik yok: öntanım)') + ' · önizleme ' + path.relative(KOK, path.join(cikti, 'muzik-onizleme.wav')) + ' (' + r.onizlemeHavalar.join(' → ') + ')');
    for (const h of r.havalar) {
      console.log('  ' + h.hava.padEnd(9) + ' ' + h.bpm + ' bpm · ' + h.lufs + ' LUFS (davul zurna ' + ref + ') · RMS ' + h.rmsDb + ' dB · tepe ' + h.tepe + ' · DC ' + h.dc + ' · ezgi/davul/eşlik ' + [h.ezgiLufs, h.davulLufs, h.eslikLufs].join('/') + ' LUFS · merkez ' + h.merkez + ' Hz');
      console.log('            oktav ' + h.oktavDb.join(' ') + ' · ezgi oktav ' + h.ezgiOktav.join(' ') + ' · davul oktav ' + h.davulOktav.join(' ') + ' · harmonik ' + h.harmonik.join(' '));
      kontrol(ad + ' [' + h.hava + ']: ses yüksekliği davul zurnaya yakın (±' + ESIK.duzeyDb + ' dB), tepe güvenli, kırpılma yok', Math.abs(h.lufs - ref) <= ESIK.duzeyDb && h.tepe < 0.95 && h.kirpik === 0, { lufs: h.lufs, davulZurna: ref, tepe: h.tepe });
      kontrol(ad + ' [' + h.hava + ']: sessiz yer ve DC kayması yok', h.sessizPay < 0.05 && Math.abs(h.dc) < 0.002, { sessizPay: h.sessizPay, dc: h.dc });
      // ezgi önde: davul ezgiden en çok 3 dB yüksek, en çok 8 dB alçak (davul zurnada 4-7 dB alçak); eşlik ezgiden en az 4 dB alçak
      kontrol(ad + ' [' + h.hava + ']: ezgi duyulur; davul da eşlik de ezgiyi bastırmaz', h.ezgiLufs > -26 && h.davulLufs - h.ezgiLufs < 3 && h.davulLufs - h.ezgiLufs > -8 && h.eslikLufs - h.ezgiLufs < -4 && h.olculenNota >= 8, { ezgi: h.ezgiLufs, davul: h.davulLufs, eslik: h.eslikLufs, nota: h.olculenNota });
    }
  }
  await b.close();
  // ---- oyunlar arası fark
  const ozet = {};
  for (const [ad, r] of Object.entries(olcum))
    ozet[ad] = { takim: r.takim, bildirim: r.bildirim, imza: r.havaImza, ezgiOktav: vektorOrt(r.havalar, h => h.ezgiOktav), harmonik: vektorOrt(r.havalar, h => h.harmonik), davulOktav: vektorOrt(r.havalar, h => h.davulOktav), merkez: ortalama(r.havalar, h => h.merkez), bpm: r.havalar.map(h => h.bpm) };
  const ad = Object.keys(ozet), farklar = [];
  // Ölçünün kendi oynaması: aynı oyunun kendi havaları arasındaki en büyük fark (aynı takım, başka ezgi ve tempo).
  // Eşikler bunun epey üstünde seçildi; takımı farklı iki oyun bu kadar yakınsa aynı müzik sayılır.
  const ic = {};
  for (const [a2, r] of Object.entries(olcum)) {
    const x = { ezgiBant: 0, ezgiHarm: 0, davulBant: 0 };
    for (let i = 0; i < r.havalar.length; i++)
      for (let j = i + 1; j < r.havalar.length; j++) {
        const p = r.havalar[i], q = r.havalar[j];
        x.ezgiBant = Math.max(x.ezgiBant, dbFark(p.ezgiOktav, q.ezgiOktav));
        x.ezgiHarm = Math.max(x.ezgiHarm, dbFark(p.harmonik, q.harmonik));
        x.davulBant = Math.max(x.davulBant, dbFark(p.davulOktav, q.davulOktav));
      }
    ic[a2] = x;
  }
  console.log('\nAynı oyunun havaları arasındaki en büyük fark (ölçünün takım içi oynaması): ' + Object.entries(ic).map(([a2, x]) => a2 + ' ezgi bandı ' + x.ezgiBant + ' / harmonik ' + x.ezgiHarm + ' / davul ' + x.davulBant + ' dB').join(' · '));
  console.log('\nOyunlar arası fark: ortalama dB farkı (ezgi oktav bantları, eşik ' + ESIK.ezgiBant + ' · ezgi harmonikleri, eşik ' + ESIK.ezgiHarm + ' · davul oktav bantları, eşik ' + ESIK.davulBant + ')');
  for (let i = 0; i < ad.length; i++)
    for (let j = i + 1; j < ad.length; j++) {
      const a = ozet[ad[i]], c = ozet[ad[j]];
      const f = { cift: ad[i] + ' ↔ ' + ad[j], ezgiBant: dbFark(a.ezgiOktav, c.ezgiOktav), ezgiHarm: dbFark(a.harmonik, c.harmonik), davulBant: dbFark(a.davulOktav, c.davulOktav), merkez: Math.round(a.merkez) + ' / ' + Math.round(c.merkez) + ' Hz', tempo: a.bpm.join(',') + ' / ' + c.bpm.join(','), ayniTakim: a.takim === c.takim };
      farklar.push(f);
      const satir = f.cift + ': ezgi bandı ' + f.ezgiBant + ' dB, ezgi harmonikleri ' + f.ezgiHarm + ' dB, davul bandı ' + f.davulBant + ' dB, tayf merkezi ' + f.merkez + ', tempo ' + f.tempo;
      console.log('  ' + satir + (f.ayniTakim ? ' · aynı takım (' + a.takim + ')' : ''));
      if (!f.ayniTakim)
        kontrol('Farklı müzik: ' + ad[i] + ' (' + a.takim + ') ile ' + ad[j] + ' (' + c.takim + ') ezginin tınısında da davulda da ayrışır', (f.ezgiBant >= ESIK.ezgiBant || f.ezgiHarm >= ESIK.ezgiHarm) && f.davulBant >= ESIK.davulBant, satir);
      else if (a.imza === c.imza)
        console.log('  UYARI: ' + ad[i] + ' ile ' + ad[j] + ' aynı havaları aynı takımla çalıyor' + (!a.bildirim || !c.bildirim ? ' (müzik bildirmeyen oyun öntanımı, davul zurnayı çalar; OYUN.muzik ekle, docs/MUZIK.md)' : '') + '.');
      else
        console.log('  (aynı takım, başka havalar: yalnız ezgiler ve tempo farklı; bilerek seçildiyse sorun değil)');
    }
  kontrol('Müzik ölçümünde sayfada hata çıkmadı', hatalar.length === 0, hatalar.slice(0, 4).join(' | '));
  fs.writeFileSync(path.join(KOK, 'test', 'cikti', 'muzik-olcum.json'), JSON.stringify({ esik: ESIK, oyunlar: olcum, farklar, takimIci: ic }, null, 1));
  process.exit(raporla(sonuc) ? 1 : 0);
})().catch(e => { console.error('TEST ÇÖKTÜ', e); process.exit(1); });
