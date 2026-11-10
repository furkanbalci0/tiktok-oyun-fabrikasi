/* SOKAK — öğle sonu bir mahalle sokağı: asfalt, kesik orta çizgi, kaldırımlar, karşı kaldırımda pastel
 * apartmanlar (altlarında tenteli dükkânlar), arkada daha yüksek bloklar, sokak lambaları ve ağaçlar.
 * Hepsi dünyada durur ve yol akınca (D.kayma) sola kayar; derinliğe göre kendiliğinden yavaşlar.
 * Dolmuşun arkasında kaldıkları için hepsi oyunZemin içinde doğrudan c ile çizilir. Yakın kaldırımda uzun bir şey
 * yoktur: yolcuların önünü kapatmasın.
 * sokakHazirla: binaları kimlikten bağımsız, sabit bir tohumla bir kez üretir · Kanca: oyunZemin().
 */
const SOKAK = {
  asfalt: '#5b656e', asfaltKoyu: '#4e5760', cizgi: '#f1e7cf', bordur: '#ece4d2', bordurKoyu: '#c9bfa8',
  kaldirim: '#dca783', kaldirimCizgi: '#c48e68', golge: 'rgba(28,40,52,.3)', gok: '#9fd6dc',
  pencere: '#4f7f95', pencereAcik: '#cdeef3', panjur: '#3f6b5e'
};
const BINA_RENK = ['#f2b8a0', '#a8d8c8', '#f3d48a', '#e9a3b0', '#9cc6e6', '#f6e3c4', '#c9b6e4', '#f0c27a'];
const DUKKAN = ['BAKKAL', 'BERBER', 'SİMİT', 'ECZANE', 'TERZİ', 'KIRTASİYE', 'LOKANTA', 'ÇAY OCAĞI', 'NALBUR', 'MANAV', 'FIRIN', 'KUAFÖR'];
const TENTE = ['#e8553b', '#2ec4b6', '#ffc63a', '#3d5bd0', '#e86a9a', '#4fae6c'];
const BINA_Z = 3.7, ARKA_Z = 10.5;
let binalar = [], binaDonem = 0, arkaBinalar = [], arkaDonem = 0;
function sokakHazirla() {
  if (binalar.length)
    return;
  const r = rastgeleUret(4242);
  let x = 0;
  for (let i = 0; i < 12; i++) {
    const w = 3.3 + r() * 2.2, kat = 2 + Math.floor(r() * 3);
    binalar.push({ x0: x, w, kat, h: 2.7 + kat * 1.5 + 0.35, renk: BINA_RENK[Math.floor(r() * BINA_RENK.length)], dukkan: DUKKAN[i % DUKKAN.length], tente: TENTE[Math.floor(r() * TENTE.length)], balkon: r() < 0.65, cati: r() < 0.5 ? '#b5523b' : '#8a5a48' });
    x += w + 0.3 + r() * 0.5;
  }
  binaDonem = x;
  x = 0;
  for (let i = 0; i < 9; i++) {
    const w = 5 + r() * 4;
    arkaBinalar.push({ x0: x, w, h: 9 + r() * 7, renk: BINA_RENK[Math.floor(r() * BINA_RENK.length)] });
    x += w + 0.4 + r() * 1.5;
  }
  arkaDonem = x;
}

/* ---- yardımcılar ---- */
function noktalar(p) {
  c.beginPath();
  c.moveTo(p[0].x, p[0].y);
  for (let i = 1; i < p.length; i++)
    c.lineTo(p[i].x, p[i].y);
  c.closePath();
}
// Dünyadaki çokgen (köşeler [x, y, z]); kameranın arkasına düşen köşe varsa çizilmez.
function dunyaCokgen(k, renk, cizgi) {
  const p = k.map(pr);
  if (p.some(q => !q.ok))
    return null;
  noktalar(p);
  c.fillStyle = renk;
  c.fill();
  if (cizgi) {
    c.lineWidth = cizgi;
    c.strokeStyle = MUREKKEP;
    c.stroke();
  }
  return p;
}
// Ekranın dışında kalan bir x aralığını atlamak için kaba denetim.
function ekrandaMi(x0, x1, y, z) {
  const a = pr([x0, y, z]), b = pr([x1, y, z]);
  return a.ok && b.ok && b.x > -40 && a.x < GW + 40;
}
// Tekrarlanan dizinin (dönem d) ekrana düşen kopyalarının kayma payları.
function kopyalar(d, kay) {
  const k0 = -(((kay % d) + d) % d);
  return [k0 - d * 2, k0 - d, k0, k0 + d, k0 + d * 2];
}

/* ---- zemin ---- */
let tepeBoya = null;
function oyunZemin() {
  c.fillStyle = SOKAK.gok;
  c.fillRect(0, 0, GW, GH);
  const kay = D.kayma, cw = Math.max(1, pr([0, 0, 0]).s * 0.012);
  // arka sıradaki yüksek bloklar (yol hızının yarısıyla akar: uzakta oldukları için)
  for (const o of kopyalar(arkaDonem, kay * 0.5))
    for (const b of arkaBinalar) {
      const x0 = b.x0 + o - arkaDonem * 1.2, x1 = x0 + b.w;
      if (!ekrandaMi(x0, x1, 0, ARKA_Z))
        continue;
      dunyaCokgen([[x0, 0, ARKA_Z], [x1, 0, ARKA_Z], [x1, b.h, ARKA_Z], [x0, b.h, ARKA_Z]], renkKat(b.renk, '#7fb3bf', 0.45));
      dunyaCokgen([[x0, b.h, ARKA_Z], [x1, b.h, ARKA_Z], [x1, b.h, ARKA_Z + 3], [x0, b.h, ARKA_Z + 3]], renkKat(b.renk, '#e9f4f2', 0.5));
      c.fillStyle = 'rgba(70,110,125,.35)';
      for (let y = 2.2; y < b.h - 1; y += 1.6)
        for (let x = x0 + 0.5; x < x1 - 0.6; x += 1.1) {
          const p = pr([x, y, ARKA_Z]), q = pr([x + 0.55, y + 0.75, ARKA_Z]);
          if (p.ok && q.ok)
            c.fillRect(p.x, q.y, q.x - p.x, p.y - q.y);
        }
    }
  // yollar ve kaldırımlar
  const X = 70;
  dunyaCokgen([[-X, 0, ARKA_Z - 0.5], [X, 0, ARKA_Z - 0.5], [X, 0, BINA_Z], [-X, 0, BINA_Z]], '#c7b8a0');
  dunyaCokgen([[-X, 0.14, BINA_Z + 0.2], [X, 0.14, BINA_Z + 0.2], [X, 0.14, 2.75], [-X, 0.14, 2.75]], SOKAK.kaldirim);
  dunyaCokgen([[-X, 0.14, 2.75], [X, 0.14, 2.75], [X, 0.14, 2.6], [-X, 0.14, 2.6]], SOKAK.bordur);
  dunyaCokgen([[-X, 0, 2.6], [X, 0, 2.6], [X, 0.14, 2.6], [-X, 0.14, 2.6]], SOKAK.bordurKoyu);
  dunyaCokgen([[-X, 0, 2.6], [X, 0, 2.6], [X, 0, -2.45], [-X, 0, -2.45]], SOKAK.asfalt);
  dunyaCokgen([[-X, 0.14, -2.45], [X, 0.14, -2.45], [X, 0.14, -2.6], [-X, 0.14, -2.6]], SOKAK.bordur);
  const kd = dunyaCokgen([[-X, 0.14, -2.6], [X, 0.14, -2.6], [X, 0.14, -7], [-X, 0.14, -7]], SOKAK.kaldirim);
  if (kd) {
    // kaldırım ekranın altına dek sürer (gök rengi alttan görünmesin)
    c.fillStyle = SOKAK.kaldirim;
    c.fillRect(0, Math.min(kd[2].y, kd[3].y) - 1, GW, GH);
  }
  // kaldırım taşlarının derzleri ve orta çizgi akar
  c.strokeStyle = SOKAK.kaldirimCizgi;
  c.lineWidth = Math.max(1, cw * 0.8);
  c.beginPath();
  for (const [z0, z1] of [[2.75, BINA_Z + 0.2], [-2.6, -7]]) {
    const m0 = Math.floor((kay - 30) / 0.9);
    for (let m = m0; m < m0 + 70; m++) {
      const x = m * 0.9 - kay, a = pr([x, 0.14, z0]), b = pr([x, 0.14, z1]);
      if (a.ok && b.ok && a.x > -20 && a.x < GW + 20) {
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
      }
    }
  }
  c.stroke();
  const m0 = Math.floor((kay - 30) / 3.2);
  for (let m = m0; m < m0 + 22; m++) {
    const x = m * 3.2 - kay;
    if (ekrandaMi(x, x + 1.7, 0, 1.95))
      dunyaCokgen([[x, 0, 1.88], [x + 1.7, 0, 1.88], [x + 1.7, 0, 2.02], [x, 0, 2.02]], SOKAK.cizgi);
  }
  // karşı kaldırımdaki apartmanlar
  for (const o of kopyalar(binaDonem, kay))
    for (const b of binalar) {
      const x0 = b.x0 + o - binaDonem * 0.5;
      if (ekrandaMi(x0, x0 + b.w, 0, BINA_Z))
        binaCiz(b, x0, cw);
    }
  sokakEsyasi(kay, cw);
  // geçilen araba (sollamada) ve durak tabelası
  sollananCiz(cw);
  durakTabelasi(cw);
  // üstteki sahne yazıları okunsun diye çatıların üstü koyulaşır
  if (!tepeBoya) {
    tepeBoya = c.createLinearGradient(0, 0, 0, ALAN_UST - 20);
    tepeBoya.addColorStop(0, 'rgba(14,44,58,.86)');
    tepeBoya.addColorStop(0.55, 'rgba(14,44,58,.5)');
    tepeBoya.addColorStop(1, 'rgba(14,44,58,0)');
  }
  c.fillStyle = tepeBoya;
  c.fillRect(0, 0, GW, ALAN_UST - 20);
  dolmusArka(cw);
}

/* ---- apartman: yüzü kameraya dönük, damı yukarıdan görünür ---- */
function binaCiz(b, x0, cw) {
  const x1 = x0 + b.w, z = BINA_Z, h = b.h, r = b.renk;
  dunyaCokgen([[x0, h, z], [x1, h, z], [x1, h, z + 4], [x0, h, z + 4]], renkKat(r, '#fff6e8', 0.35), cw);
  // kiremit saçak ve çatı
  dunyaCokgen([[x0 - 0.15, h, z - 0.2], [x1 + 0.15, h, z - 0.2], [x1 - 0.2, h + 0.9, z + 1.6], [x0 + 0.2, h + 0.9, z + 1.6]], b.cati, cw);
  dunyaCokgen([[x0, 0, z], [x1, 0, z], [x1, h, z], [x0, h, z]], r, cw);
  // pencereler: kat kat, panjurlu; bazı katlarda balkon ve çamaşır ipi
  const n = Math.max(1, Math.floor((b.w - 0.6) / 1.15)), ara = b.w / n;
  for (let kat = 0; kat < b.kat; kat++) {
    const y0 = 2.95 + kat * 1.5;
    for (let i = 0; i < n; i++) {
      const px = x0 + ara * (i + 0.5);
      dunyaCokgen([[px - 0.32, y0, z], [px + 0.32, y0, z], [px + 0.32, y0 + 0.95, z], [px - 0.32, y0 + 0.95, z]], (i + kat) % 3 ? SOKAK.pencere : SOKAK.pencereAcik, cw * 0.8);
      dunyaCokgen([[px - 0.48, y0, z], [px - 0.34, y0, z], [px - 0.34, y0 + 0.95, z], [px - 0.48, y0 + 0.95, z]], SOKAK.panjur);
      dunyaCokgen([[px + 0.34, y0, z], [px + 0.48, y0, z], [px + 0.48, y0 + 0.95, z], [px + 0.34, y0 + 0.95, z]], SOKAK.panjur);
    }
    if (b.balkon && kat % 2 === 0) {
      dunyaCokgen([[x0 + 0.3, y0 - 0.1, z - 0.6], [x1 - 0.3, y0 - 0.1, z - 0.6], [x1 - 0.3, y0 - 0.1, z], [x0 + 0.3, y0 - 0.1, z]], renkKat(r, '#ffffff', 0.4), cw);
      dunyaCokgen([[x0 + 0.3, y0 - 0.1, z - 0.6], [x1 - 0.3, y0 - 0.1, z - 0.6], [x1 - 0.3, y0 + 0.4, z - 0.6], [x0 + 0.3, y0 + 0.4, z - 0.6]], renkKat(r, '#3a2a2c', 0.25), cw);
      // çamaşırlar
      for (let i = 0; i < 3; i++) {
        const cx = x0 + 0.7 + i * 0.55;
        if (cx > x1 - 0.6)
          break;
        dunyaCokgen([[cx, y0 + 0.75, z - 0.6], [cx + 0.35, y0 + 0.75, z - 0.6], [cx + 0.35, y0 + 0.45, z - 0.6], [cx, y0 + 0.45, z - 0.6]], TENTE[(i + kat + Math.round(b.w)) % TENTE.length]);
      }
    }
  }
  // dükkân: vitrin, tente, tabela
  dunyaCokgen([[x0 + 0.3, 0.14, z], [x1 - 0.3, 0.14, z], [x1 - 0.3, 2.0, z], [x0 + 0.3, 2.0, z]], '#3d5560', cw);
  dunyaCokgen([[x0 + 0.5, 0.5, z], [x1 - 1.4, 0.5, z], [x1 - 1.4, 1.8, z], [x0 + 0.5, 1.8, z]], '#a9dbe2', cw * 0.8);
  const t = dunyaCokgen([[x0 + 0.2, 2.05, z - 0.9], [x1 - 0.2, 2.05, z - 0.9], [x1 - 0.2, 2.5, z], [x0 + 0.2, 2.5, z]], b.tente, cw);
  if (t) {
    // tentenin beyaz şeritleri
    c.fillStyle = '#fbf3e4';
    const s = 6;
    for (let i = 1; i < s; i += 2) {
      const a = i / s, e = (i + 1) / s;
      c.beginPath();
      c.moveTo(lerp(t[0].x, t[1].x, a), lerp(t[0].y, t[1].y, a));
      c.lineTo(lerp(t[0].x, t[1].x, e), lerp(t[0].y, t[1].y, e));
      c.lineTo(lerp(t[3].x, t[2].x, e), lerp(t[3].y, t[2].y, e));
      c.lineTo(lerp(t[3].x, t[2].x, a), lerp(t[3].y, t[2].y, a));
      c.closePath();
      c.fill();
    }
  }
  const tb = dunyaCokgen([[x0 + 0.4, 2.55, z], [x1 - 0.4, 2.55, z], [x1 - 0.4, 2.85, z], [x0 + 0.4, 2.85, z]], '#fbf3e4', cw);
  if (tb && tb[1].x - tb[0].x > 40) {
    const boy = Math.round(clamp((tb[0].y - tb[3].y) * 0.75, 7, 22));
    c.font = boy + 'px "Lilita One", Rubik, system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#8a2f2a';
    c.fillText(b.dukkan, (tb[0].x + tb[1].x) / 2, (tb[0].y + tb[3].y) / 2 + 1, tb[1].x - tb[0].x - 6);
    c.textBaseline = 'alphabetic';
  }
}
// Karşı kaldırımda lambalar ve ağaçlar (dolmuşun arkasında kalır).
function sokakEsyasi(kay, cw) {
  const z = 3.15, m0 = Math.floor((kay - 30) / 7);
  for (let m = m0; m < m0 + 14; m++) {
    const x = m * 7 - kay;
    if (!ekrandaMi(x - 1, x + 1, 0, z))
      continue;
    if (m % 2) {
      // çınar: gövde ve yuvarlak taç
      const a = pr([x, 0.14, z]), b = pr([x, 2.2, z]), t = pr([x, 3.0, z]);
      if (!a.ok || !t.ok)
        continue;
      golge(x + 0.4, z + 0.2, 1.1, 0.5);
      c.strokeStyle = MUREKKEP;
      c.lineWidth = 0.22 * a.s + 2;
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.stroke();
      c.strokeStyle = '#7a5235';
      c.lineWidth = 0.22 * a.s;
      c.stroke();
      for (const [dx, dy, r] of [[0, 0, 1], [-0.6, -0.3, 0.7], [0.65, -0.2, 0.75], [0.1, 0.55, 0.7]]) {
        c.beginPath();
        c.arc(t.x + dx * t.s, t.y - dy * t.s, r * t.s, 0, TAU);
        c.fillStyle = dy > 0.3 ? '#8ccf6a' : '#5fae58';
        c.fill();
        c.lineWidth = cw;
        c.strokeStyle = MUREKKEP;
        c.stroke();
      }
    }
    else {
      // sokak lambası
      const a = pr([x, 0.14, z]), b = pr([x, 3.6, z]), u = pr([x - 0.7, 3.7, z]);
      if (!a.ok || !b.ok)
        continue;
      c.strokeStyle = '#2f4a55';
      c.lineWidth = Math.max(2, 0.09 * a.s);
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.quadraticCurveTo(b.x, u.y, u.x, u.y);
      c.stroke();
      c.fillStyle = '#ffe9a8';
      c.beginPath();
      c.ellipse(u.x, u.y + 0.08 * u.s, 0.22 * u.s, 0.1 * u.s, 0, 0, TAU);
      c.fill();
      c.lineWidth = cw;
      c.strokeStyle = MUREKKEP;
      c.stroke();
    }
  }
}
// Sollamada karşı şeritteki yavaş araba geriye doğru kalır.
function sollananCiz(cw) {
  const s = D.sollama;
  if (!s)
    return;
  const u = B - s.bas;
  if (u < 0 || u > s.sure)
    return;
  const x = 7 - u * 2.4, z0 = 1.35, z1 = 2.35, y0 = 0.12;
  if (!ekrandaMi(x - 2, x + 2, 0, z0))
    return;
  dunyaCokgen([[x - 1.9, 0, z0 - 0.1], [x + 1.9, 0, z0 - 0.1], [x + 1.9, 0, z1 + 0.3], [x - 1.9, 0, z1 + 0.3]], SOKAK.golge);
  // kasa ve kabin
  dunyaCokgen([[x - 1.7, y0, z0], [x + 1.7, y0, z0], [x + 1.7, 0.6, z0], [x - 1.7, 0.6, z0]], '#3d5bd0', cw);
  dunyaCokgen([[x - 1.7, 0.6, z0], [x + 1.7, 0.6, z0], [x + 1.7, 0.6, z1], [x - 1.7, 0.6, z1]], '#6f88e6', cw);
  dunyaCokgen([[x - 0.9, 0.6, z0 + 0.1], [x + 0.8, 0.6, z0 + 0.1], [x + 0.6, 1.05, z0 + 0.15], [x - 0.8, 1.05, z0 + 0.15]], '#bfe9f2', cw);
  dunyaCokgen([[x - 0.8, 1.05, z0 + 0.15], [x + 0.6, 1.05, z0 + 0.15], [x + 0.6, 1.05, z1 - 0.15], [x - 0.8, 1.05, z1 - 0.15]], '#6f88e6', cw);
  for (const tx of [x - 1.1, x + 1.1]) {
    const p = pr([tx, 0.25, z0 - 0.02]);
    if (p.ok) {
      c.beginPath();
      c.ellipse(p.x, p.y, 0.25 * p.s, 0.25 * p.s * Math.cos(kam.egim), 0, 0, TAU);
      c.fillStyle = '#23262d';
      c.fill();
    }
  }
}
// "Müsait bir yerde" durağı: dolmuşun durduğu yerde karşı kaldırımda direk ve yuvarlak durak levhası. Gönderenin
// adını hat tabelası yazar (40-dolmus.js); levha yüksekte kaldığı için ad oraya yazılmaz, sahne yazılarına girerdi.
function durakTabelasi(cw) {
  const d = D.durak;
  if (!d || d.isaret === null)
    return;
  const x = d.isaret - D.kayma, z = 3.0;
  if (!ekrandaMi(x - 1.5, x + 1.5, 0, z))
    return;
  const a = pr([x, 0.14, z]), b = pr([x, 2.2, z]);
  // Yakın çekimde levha sahne yazılarının arkasına düşer: orada çizilmez (sıralama kutusunu bulandırmasın).
  if (!a.ok || !b.ok || b.y < ALAN_UST - 30)
    return;
  c.strokeStyle = MUREKKEP;
  c.lineWidth = 0.1 * a.s + 2;
  c.beginPath();
  c.moveTo(a.x, a.y);
  c.lineTo(b.x, b.y);
  c.stroke();
  c.strokeStyle = '#d7dde0';
  c.lineWidth = 0.1 * a.s;
  c.stroke();
  const r = 0.42 * b.s;
  c.beginPath();
  c.arc(b.x, b.y, r, 0, TAU);
  c.fillStyle = '#2e8f5a';
  c.fill();
  c.lineWidth = Math.max(2, cw * 1.5);
  c.strokeStyle = '#fbf3e4';
  c.stroke();
  c.fillStyle = '#fbf3e4';
  c.font = Math.round(r * 0.55) + 'px "Lilita One", Rubik, system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('DURAK', b.x, b.y + 1, r * 1.8);
  c.textBaseline = 'alphabetic';
}
