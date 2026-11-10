/* EKRAN — televizyonun içindeki görüntü. Her karede küçük bir tuvale (EK) çizilir, ekran camına o basılır.
 *
 * RESIM: temiz yayın görüntüsü (maç: tribün, saha, iki takım, top, skor kutusu, kanal işareti).
 * EK: RESIM'in bozulmuş hâli, oyunun durumunu anlatır:
 *   0 Karlı        yalnız kar ve kayan parlak şerit
 *   1 Kayıyor      kar arasında siyah beyaz görüntü aşağı kayar, kara bir şerit döner
 *   2 Çift görüntü siyah beyaz, gölgeli ikinci kopya, yatay yırtılmalar
 *   3 Siyah beyaz  temiz ama renksiz; oyuncular dizilmiş: "Maç başlamak üzere"
 *   4 Net, renkli  maç oynanıyor, "CANLI"; tam nette gol olur
 * Vuruş anında (D.flas) bir anlık kar patlaması ve sarsıntı olur, sonra görüntü bir basamak iyileşir.
 * Kar dokuları açılışta bir kez üretilir; her karede rastgele bir kaymayla basılır (ucuz).
 */
const EK_W = 256, EK_H = 211;
function tuvalYap(w, h) { const t = document.createElement('canvas'); t.width = w; t.height = h; return { tuval: t, g: t.getContext('2d') }; }
const EK = tuvalYap(EK_W, EK_H), RESIM = tuvalYap(EK_W, EK_H);
let KAR = null, TRIBUN = null;
function karHazirla() {
  KAR = [];
  for (let n = 0; n < 4; n++) {
    const t = tuvalYap(EK_W / 2, EK_H / 2), im = t.g.createImageData(EK_W / 2, EK_H / 2);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = Math.random() < 0.5 ? Math.random() * 90 : 140 + Math.random() * 115;
      im.data[i] = v;
      im.data[i + 1] = v;
      im.data[i + 2] = v + 8;
      im.data[i + 3] = 255;
    }
    t.g.putImageData(im, 0, 0);
    KAR.push(t.tuval);
  }
  // tribündeki kalabalık: renkli benekler
  TRIBUN = tuvalYap(EK_W, 70);
  const g = TRIBUN.g, r = rastgeleUret(42);
  g.fillStyle = '#2c3140';
  g.fillRect(0, 0, EK_W, 70);
  const renk = ['#e8e2d0', '#c9473a', '#e2c044', '#4c6fc9', '#d98b5a', '#9aa0b0'];
  for (let i = 0; i < 900; i++) {
    g.fillStyle = renk[Math.floor(r() * renk.length)];
    g.fillRect(Math.floor(r() * EK_W), Math.floor(r() * 62), 2, 2);
  }
}

// Temiz maç görüntüsü. oyna: oyuncular koşuyor mu (net basamakta), yoksa santrada dizili mi.
function macCiz(t, oyna) {
  const g = RESIM.g, W = EK_W, H = EK_H, ufuk = 62, pan = oyna ? Math.sin(t * 0.11) * 30 : 0;
  g.drawImage(TRIBUN.tuval, 0, 0);
  // reklam panoları (uydurma, marka yok)
  const pano = [['#d8322b', 'ÇAY'], ['#f2f0e6', 'BAKKAL'], ['#2f62b8', 'MAHALLE'], ['#e2c044', 'SİMİT']];
  g.font = '700 9px Rubik, system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let i = -1; i < 6; i++) {
    const x = ((i * 64 - pan * 0.6) % (64 * 4) + 64 * 4) % (64 * 4) - 32, [renk, yazi] = pano[(i + 4) % 4];
    g.fillStyle = renk;
    g.fillRect(x, ufuk - 9, 63, 11);
    g.fillStyle = renk === '#f2f0e6' ? '#d8322b' : '#fff';
    g.fillText(yazi, x + 31, ufuk - 3);
  }
  // saha: biçilmiş çim şeritleri, perspektifle genişler
  for (let i = -6; i < 7; i++) {
    const x0 = W / 2 + (i * 30 - pan) * 1, x1 = x0 + 30;
    g.fillStyle = (i & 1) ? '#3b8f39' : '#47a243';
    g.beginPath();
    g.moveTo(W / 2 + (x0 - W / 2) * 0.55, ufuk + 2);
    g.lineTo(W / 2 + (x1 - W / 2) * 0.55, ufuk + 2);
    g.lineTo(W / 2 + (x1 - W / 2) * 1.6, H);
    g.lineTo(W / 2 + (x0 - W / 2) * 1.6, H);
    g.closePath();
    g.fill();
  }
  // çizgiler: kenar, orta çizgi, orta yuvarlak
  g.strokeStyle = 'rgba(255,255,255,.85)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, ufuk + 6);
  g.lineTo(W, ufuk + 6);
  const ox = W / 2 - pan * 1.1;
  g.moveTo(ox - pan * 0.1, ufuk + 6);
  g.lineTo(ox + pan * 0.4, H);
  g.stroke();
  g.beginPath();
  g.ellipse(ox, 140, 46, 22, 0, 0, TAU);
  g.stroke();
  // oyuncular: kırmızı formalı ev sahibi, mavi formalı konuk; top
  const top = oyna ? [ox + Math.sin(t * 0.7) * 70, 140 + Math.sin(t * 1.1) * 30] : [ox, 140];
  for (let i = 0; i < 10; i++) {
    const ev = i < 5, j = i % 5;
    let x, y;
    if (oyna) {
      x = top[0] + Math.sin(t * (0.5 + j * 0.13) + i * 1.7) * (30 + j * 12) + (ev ? -14 : 14);
      y = 132 + Math.cos(t * (0.4 + j * 0.11) + i) * 30 + j * 4;
    }
    else {
      x = ox + (ev ? -1 : 1) * (22 + j * 20);
      y = 112 + j * 15;
    }
    const kosu = oyna ? Math.sin(t * 6 + i) * 3 : 0, olc = 0.75 + (y - ufuk) / H * 0.6;
    g.fillStyle = '#1b1b1b';
    g.fillRect(x - 3 * olc, y - 2 * olc, 2 * olc, 8 * olc + kosu);
    g.fillRect(x + 1 * olc, y - 2 * olc, 2 * olc, 8 * olc - kosu);
    g.fillStyle = ev ? '#d8322b' : '#2f62b8';
    g.fillRect(x - 4 * olc, y - 11 * olc, 8 * olc, 10 * olc);
    g.fillStyle = '#f2f0e6';
    g.fillRect(x - 4 * olc, y - 2 * olc, 8 * olc, 3 * olc);
    g.fillStyle = '#e3b58e';
    g.beginPath();
    g.arc(x, y - 14 * olc, 3.2 * olc, 0, TAU);
    g.fill();
  }
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(top[0], top[1], 3.4, 0, TAU);
  g.fill();
  g.strokeStyle = '#111';
  g.lineWidth = 1;
  g.stroke();
  // skor kutusu ve saat (vuruşla ilerler), kanal işareti
  g.fillStyle = 'rgba(10,12,30,.85)';
  g.fillRect(8, 8, 104, 18);
  g.font = '700 10px Rubik, system-ui, sans-serif';
  g.textAlign = 'left';
  g.fillStyle = '#fff';
  g.fillText('MHL ' + D.skor[0] + '-' + D.skor[1] + ' KMŞ', 13, 17.5);
  const dk = oyna ? Math.floor(t / 8) % 90 : 0, sn = oyna ? Math.floor(t * 7.5) % 60 : 0;
  g.fillStyle = '#ffd23f';
  g.fillText((dk < 10 ? '0' : '') + dk + ':' + (sn < 10 ? '0' : '') + sn, 84, 17.5);
  g.fillStyle = 'rgba(255,255,255,.85)';
  g.beginPath();
  g.arc(W - 20, 18, 10, 0, TAU);
  g.fill();
  g.fillStyle = '#c4202a';
  g.font = '700 14px Rubik, system-ui, sans-serif';
  g.textAlign = 'center';
  g.fillText('1', W - 20, 18.5);
  if (oyna) {
    g.fillStyle = '#d8322b';
    g.fillRect(W - 58, 34, 50, 14);
    g.fillStyle = '#fff';
    g.font = '700 9px Rubik, system-ui, sans-serif';
    g.fillText('CANLI', W - 33, 41.5);
  }
  else {
    g.fillStyle = 'rgba(10,12,30,.85)';
    g.fillRect(0, H - 34, W, 22);
    g.fillStyle = '#fff';
    g.font = '700 12px Rubik, system-ui, sans-serif';
    g.fillText('MAÇ BAŞLAMAK ÜZERE', W / 2, H - 22.5);
  }
  // gol: büyük yazı ve alt bant
  if (D.gol) {
    const a = B - D.gol.b0, olc = 1 + 0.25 * Math.max(0, Math.sin(a * Math.PI * 2)) * Math.max(0, 1 - a / 6);
    g.save();
    g.translate(W / 2, H / 2 - 6);
    g.scale(olc, olc);
    g.font = '400 46px "Lilita One", Rubik, system-ui, sans-serif';
    g.lineWidth = 6;
    g.strokeStyle = '#111';
    g.strokeText('GOOOL!', 0, 0);
    g.fillStyle = '#ffd23f';
    g.fillText('GOOOL!', 0, 0);
    g.restore();
    if (D.gol.ad) {
      g.fillStyle = 'rgba(200,30,30,.92)';
      g.fillRect(0, H - 34, W, 22);
      g.fillStyle = '#fff';
      g.font = '700 12px Rubik, system-ui, sans-serif';
      g.fillText('Görüntüyü düzelten: ' + D.gol.ad, W / 2, H - 22.5, W - 12);
    }
  }
  else if (D.usta) {
    g.fillStyle = 'rgba(200,120,10,.92)';
    g.fillRect(0, H - 34, W, 22);
    g.fillStyle = '#fff';
    g.font = '700 12px Rubik, system-ui, sans-serif';
    g.fillText('USTA İŞ BAŞINDA: ' + D.usta.k.ad, W / 2, H - 22.5, W - 12);
  }
}

// Bozulmuş görüntü: basamağa ve basamak içindeki ilerlemeye göre karışım.
function ekranGuncelle() {
  if (!KAR)
    karHazirla();
  const g = EK.g, W = EK_W, H = EK_H, n = D.netlik, a = D.asama, ic = clamp((n - a * 0.2) / 0.2, 0, 1), t = B, fl = D.flas;
  if (a >= 1)
    macCiz(t, a === 4);
  g.globalAlpha = 1;
  g.filter = 'none';
  g.fillStyle = '#07090a';
  g.fillRect(0, 0, W, H);
  // titreme: vuruştan sonra görüntü bir an zıplar
  const zip = fl > 0.05 ? (Math.random() - 0.5) * 24 * fl : 0;
  if (a === 1) {
    // dikey kayma: görüntü aşağı akar, arada kara bant
    const k = ((t * 0.55) % 1) * H;
    g.filter = 'grayscale(1) contrast(1.3) brightness(.9)';
    g.globalAlpha = 0.5 + ic * 0.3;
    g.drawImage(RESIM.tuval, 0, k + zip - H);
    g.drawImage(RESIM.tuval, 0, k + zip);
    g.filter = 'none';
    g.globalAlpha = 1;
    g.fillStyle = '#000';
    g.fillRect(0, k - 10 + zip, W, 16);
  }
  else if (a === 2) {
    // çift görüntü ve yırtılma
    g.filter = 'grayscale(1) contrast(1.2)';
    g.globalAlpha = 0.75;
    g.drawImage(RESIM.tuval, zip, 0);
    g.globalAlpha = 0.32;
    g.drawImage(RESIM.tuval, 12 + zip, 0);
    g.filter = 'none';
    g.globalAlpha = 1;
    const r = rastgeleUret(Math.floor(t * 3) + 1);
    for (let i = 0; i < 3; i++) {
      const y = Math.floor(r() * (H - 20)), h = 6 + Math.floor(r() * 12), dx = (r() - 0.5) * 30 * (1 - ic * 0.5);
      g.drawImage(EK.tuval, 0, y, W, h, dx, y, W, h);
    }
  }
  else if (a === 3) {
    g.filter = 'grayscale(1) contrast(1.1)';
    g.drawImage(RESIM.tuval, zip * 0.5, 0);
    g.filter = 'none';
  }
  else if (a === 4) {
    g.filter = ic < 0.5 ? 'saturate(' + (0.5 + ic) + ')' : 'none';
    g.drawImage(RESIM.tuval, zip * 0.4, 0);
    g.filter = 'none';
  }
  // kar
  const karAlfa = clamp([0.96, 0.58, 0.42, 0.15, 0.05][a] - ic * [0.06, 0.12, 0.12, 0.08, 0.03][a] + fl * 0.75, 0, 1);
  if (karAlfa > 0.01) {
    g.globalAlpha = karAlfa;
    g.imageSmoothingEnabled = false;
    const kt = KAR[Math.floor(zaman * 30) % KAR.length], ox = Math.floor(Math.random() * 60), oy = Math.floor(Math.random() * 40);
    g.drawImage(kt, ox, oy, W / 2 - ox, H / 2 - oy, 0, 0, (W / 2 - ox) * 2, (H / 2 - oy) * 2);
    g.drawImage(kt, 0, 0, ox, H / 2, W - ox * 2, 0, ox * 2, H);
    g.drawImage(kt, 0, 0, W / 2, oy, 0, H - oy * 2, W, oy * 2);
    g.imageSmoothingEnabled = true;
    g.globalAlpha = 1;
  }
  // karlıyken parlak bir şerit yukarıdan aşağı geçer
  if (a <= 2) {
    const y = ((t * 0.35) % 1.3) * H - 20;
    const p = g.createLinearGradient(0, y - 20, 0, y + 20);
    p.addColorStop(0, 'rgba(255,255,255,0)');
    p.addColorStop(0.5, 'rgba(255,255,255,' + (0.22 - a * 0.06) + ')');
    p.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = p;
    g.fillRect(0, y - 20, W, 40);
  }
  // tarama çizgileri
  g.fillStyle = 'rgba(0,0,0,.16)';
  for (let y = 0; y < H; y += 3)
    g.fillRect(0, y, W, 1);
}
// Ekranın odaya saçtığı ışığın rengi: karlıyken soğuk mavi, maçta yeşilimsi.
function ekranIsik() {
  const a = D.asama, kar = [1, 0.75, 0.5, 0.2, 0][a], titre = kar * (0.75 + Math.random() * 0.25) + (1 - kar);
  return { renk: a >= 4 ? '120,230,150' : a === 3 ? '220,230,240' : '170,205,255', guc: (0.32 + D.flas * 0.3) * titre };
}
