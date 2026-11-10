/* SOKAK — öğle sonu dar bir mahalle sokağı. Dolmuş kameraya doğru gelir; sokak onun iki yanından geriye (yukarı)
 * akar: asfalt, yaya geçitleri, rögar kapakları, bordür, karo kaldırım, tenteli dükkânlar, çınarlar.
 * Üstteki sahne yazılarının arkasında sakin bir gök ve uzak tepe silueti durur (arkaPerde): yazılar okunsun.
 * Hepsi dolmuşun arkasında kaldığı için oyunZemin içinde doğrudan c ile çizilir.
 * sokakHazirla: dükkânları sabit bir tohumla bir kez üretir, gök perdesini bir kez çizer · Kanca: oyunZemin().
 */
const SOKAK = {
  asfalt: '#5b656e', cizgi: '#f1e7cf', bordur: '#ece4d2', bordurKoyu: '#c9bfa8', kaldirim: '#dca783',
  kaldirimCizgi: '#c48e68', golge: 'rgba(28,40,52,.32)', rogar: '#3f474f'
};
const BINA_RENK = ['#f2b8a0', '#a8d8c8', '#f3d48a', '#e9a3b0', '#9cc6e6', '#f6e3c4', '#c9b6e4', '#f0c27a'];
const DUKKAN = ['BAKKAL', 'BERBER', 'SİMİT', 'ECZANE', 'TERZİ', 'KIRTASİYE', 'LOKANTA', 'ÇAY OCAĞI', 'NALBUR', 'MANAV', 'FIRIN', 'KUAFÖR'];
const TENTE = ['#e8553b', '#2ec4b6', '#ffc63a', '#3d5bd0', '#e86a9a', '#4fae6c'];
const YOL_X = 2.35, KALDIRIM_X = 3.9;
// Gök perdesinin alt çizgisi: sıralama kutusu ve göstergenin hemen altı (stil.css .sira, .cosku).
const UFUK = 488;
let dukkanlar = [], dukkanDonem = 0, perde = null;
function sokakHazirla() {
  if (dukkanlar.length)
    return;
  const r = rastgeleUret(4242);
  let z = 0;
  for (let i = 0; i < 12; i++) {
    const uz = 3.4 + r() * 2.4;
    dukkanlar.push({ z0: z, uz, yan: i % 2 ? 1 : -1, renk: BINA_RENK[Math.floor(r() * BINA_RENK.length)], ad: DUKKAN[i % DUKKAN.length], tente: TENTE[Math.floor(r() * TENTE.length)] });
    if (i % 2)
      z += uz + 0.4 + r() * 0.8;
  }
  dukkanDonem = z;
  perdeCiz();
}
// Gök, güneş, bulutlar ve uzakta tepelere yayılmış mahalle silueti: bir kez ayrı bir tuvale çizilir.
function perdeCiz() {
  const t = document.createElement('canvas');
  t.width = GW;
  t.height = UFUK + 40;
  const a = t.getContext('2d'), r = rastgeleUret(91), H = UFUK;
  const gr = a.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#2f7fa6');
  gr.addColorStop(0.55, '#6fb9cf');
  gr.addColorStop(0.86, '#bfe3df');
  gr.addColorStop(1, '#f6dcb0');
  a.fillStyle = gr;
  a.fillRect(0, 0, GW, H + 40);
  a.fillStyle = 'rgba(255,240,200,.35)';
  a.beginPath();
  a.arc(560, 330, 70, 0, TAU);
  a.fill();
  a.fillStyle = '#fff3cf';
  a.beginPath();
  a.arc(560, 330, 34, 0, TAU);
  a.fill();
  a.fillStyle = 'rgba(255,255,255,.55)';
  for (const [x, y, w] of [[140, 300, 150], [420, 250, 120], [640, 390, 110], [250, 410, 90]]) {
    a.beginPath();
    a.ellipse(x, y, w / 2, 9, 0, 0, TAU);
    a.ellipse(x - w * 0.18, y - 7, w / 4, 8, 0, 0, TAU);
    a.fill();
  }
  const tepe = (renk, yuk, f1, f2, kay) => {
    a.fillStyle = renk;
    a.beginPath();
    a.moveTo(0, H + 40);
    for (let x = 0; x <= GW; x += 8)
      a.lineTo(x, H - yuk * (0.55 + 0.3 * Math.sin(x * f1 + kay) + 0.15 * Math.sin(x * f2 + kay * 2)));
    a.lineTo(GW, H + 40);
    a.closePath();
    a.fill();
  };
  tepe('#8fb7b9', 60, 0.009, 0.021, 0.8);
  // mahalle: tepeye tırmanan küçük evler, kiremit damlar
  for (let x = 6; x < GW;) {
    const w = 14 + r() * 16, h = 10 + r() * 16, y = H - 22 - 18 * (0.5 + 0.5 * Math.sin(x * 0.009 + 0.8));
    a.fillStyle = BINA_RENK[Math.floor(r() * BINA_RENK.length)];
    a.globalAlpha = 0.75;
    a.fillRect(x, y - h, w, h + 30);
    a.fillStyle = '#b5523b';
    a.fillRect(x - 1, y - h - 3, w + 2, 4);
    a.globalAlpha = 1;
    x += w + 2 + r() * 6;
  }
  tepe('#6d9a9a', 22, 0.013, 0.03, 2.1);
  perde = t;
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
// Yol akınca dünyada kayan dizinin görünen kopyaları: z = taban + kayma (dönem d), yakından uzağa.
function akanZ(d, z0, bas, son) {
  const k = ((D.kayma % d) + d) % d, cik = [];
  for (let z = z0 + k + Math.ceil((bas - z0 - k) / d) * d; z < son; z += d)
    cik.push(z);
  return cik;
}

/* ---- zemin ---- */
function oyunZemin() {
  const cw = Math.max(1, pr([0, 0, 0]).s * 0.011), Z0 = -6, Z1 = 26;
  c.fillStyle = SOKAK.kaldirim;
  c.fillRect(0, 0, GW, GH);
  // asfalt, bordürler, kaldırımlar
  dunyaCokgen([[-YOL_X, 0, Z0], [YOL_X, 0, Z0], [YOL_X, 0, Z1], [-YOL_X, 0, Z1]], SOKAK.asfalt);
  for (const s of [-1, 1]) {
    dunyaCokgen([[s * YOL_X, 0, Z0], [s * YOL_X, 0.14, Z0], [s * YOL_X, 0.14, Z1], [s * YOL_X, 0, Z1]], SOKAK.bordurKoyu);
    dunyaCokgen([[s * YOL_X, 0.14, Z0], [s * (YOL_X + 0.16), 0.14, Z0], [s * (YOL_X + 0.16), 0.14, Z1], [s * YOL_X, 0.14, Z1]], SOKAK.bordur);
  }
  // kaldırım derzleri ve yoldaki işaretler akar
  c.strokeStyle = SOKAK.kaldirimCizgi;
  c.lineWidth = Math.max(1, cw * 0.8);
  c.beginPath();
  for (const z of akanZ(0.8, 0, Z0, Z1))
    for (const s of [-1, 1]) {
      const a = pr([s * (YOL_X + 0.16), 0.14, z]), b = pr([s * 9, 0.14, z]);
      if (a.ok && b.ok) {
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
      }
    }
  c.stroke();
  for (const z of akanZ(3.2, 0, Z0, Z1))
    for (const s of [-1, 1])
      dunyaCokgen([[s * 2.05, 0, z], [s * 2.18, 0, z], [s * 2.18, 0, z + 1.6], [s * 2.05, 0, z + 1.6]], SOKAK.cizgi);
  for (const z of akanZ(22, 4, Z0, Z1))
    for (let x = -2.1; x < 2.1; x += 0.6)
      dunyaCokgen([[x, 0, z], [x + 0.36, 0, z], [x + 0.36, 0, z + 1.8], [x, 0, z + 1.8]], SOKAK.cizgi);
  for (const z of akanZ(9, 2, Z0, Z1)) {
    const p = pr([-1.2, 0, z]);
    if (p.ok) {
      // rögar kapağı: koyu delik gibi değil, halkalı dökme demir kapak gibi görünsün
      c.fillStyle = SOKAK.rogar;
      c.strokeStyle = '#8a939b';
      c.lineWidth = Math.max(1, cw);
      for (const r of [0.3, 0.2, 0.1]) {
        c.beginPath();
        c.ellipse(p.x, p.y, r * p.s, r * p.s * Math.sin(kam.egim), 0, 0, TAU);
        if (r === 0.3)
          c.fill();
        c.stroke();
      }
    }
  }
  // dükkânlar: yüzleri yola bakar, tenteleri kaldırıma uzanır
  for (const o of akanZ(dukkanDonem, 0, Z0 - dukkanDonem, Z1))
    for (const d of dukkanlar)
      dukkanCiz(d, o + d.z0, cw);
  // çınarlar: tepeden görünen yuvarlak taçlar
  for (const z of akanZ(7.5, 1, Z0, Z1))
    for (const s of [-1, 1])
      agacCiz(s * 3.35, z + (s > 0 ? 3.7 : 0), cw);
  durakTabelasi(cw);
  dolmusArka(cw);
  hizCizgileri();
  // gök perdesi: üstteki sahne yazılarının arkası sakin kalsın
  c.drawImage(perde, 0, 0);
  const pus = c.createLinearGradient(0, UFUK - 6, 0, UFUK + 34);
  pus.addColorStop(0, 'rgba(246,220,176,1)');
  pus.addColorStop(1, 'rgba(246,220,176,0)');
  c.fillStyle = pus;
  c.fillRect(0, UFUK - 6, GW, 40);
}
function dukkanCiz(d, z0, cw) {
  const z1 = z0 + d.uz, s = d.yan, x = s * KALDIRIM_X;
  if (z1 < -6 || z0 > 26)
    return;
  // cephe (yola bakan yüz) ve vitrin
  const cp = dunyaCokgen([[x, 0.14, z0], [x, 0.14, z1], [x, 3.4, z1], [x, 3.4, z0]], d.renk, cw);
  if (!cp)
    return;
  dunyaCokgen([[x - s * 0.01, 0.4, z0 + 0.4], [x - s * 0.01, 0.4, z1 - 1.3], [x - s * 0.01, 1.9, z1 - 1.3], [x - s * 0.01, 1.9, z0 + 0.4]], '#a9dbe2', cw * 0.8);
  // tente: cepheden kaldırıma eğik iner; şeritli
  const t = dunyaCokgen([[x, 2.5, z0 + 0.1], [x, 2.5, z1 - 0.1], [x - s * 1.1, 2.05, z1 - 0.1], [x - s * 1.1, 2.05, z0 + 0.1]], d.tente, cw);
  if (t) {
    c.fillStyle = '#fbf3e4';
    for (let i = 1; i < 8; i += 2) {
      const a = i / 8, e = (i + 1) / 8;
      c.beginPath();
      c.moveTo(lerp(t[0].x, t[1].x, a), lerp(t[0].y, t[1].y, a));
      c.lineTo(lerp(t[0].x, t[1].x, e), lerp(t[0].y, t[1].y, e));
      c.lineTo(lerp(t[3].x, t[2].x, e), lerp(t[3].y, t[2].y, e));
      c.lineTo(lerp(t[3].x, t[2].x, a), lerp(t[3].y, t[2].y, a));
      c.closePath();
      c.fill();
    }
  }
  // tabela: tentenin üstünde, cephede
  const tb = dunyaCokgen([[x - s * 0.01, 2.6, z0 + 0.3], [x - s * 0.01, 2.6, z1 - 0.3], [x - s * 0.01, 3.2, z1 - 0.3], [x - s * 0.01, 3.2, z0 + 0.3]], '#fbf3e4', cw);
  if (tb) {
    const cx = (tb[0].x + tb[1].x + tb[2].x + tb[3].x) / 4, cy = (tb[0].y + tb[1].y + tb[2].y + tb[3].y) / 4, w = Math.abs(tb[0].x - tb[2].x), h = Math.abs(tb[0].y - tb[1].y);
    if (h > 24 && w > 7) {
      // cephe yola dik durduğu için tabela ekranda dikine uzanır: yazı da dikine döner
      c.save();
      c.translate(cx, cy);
      c.rotate(s > 0 ? HP : -HP);
      c.font = Math.round(clamp(w * 0.7, 8, 20)) + 'px "Lilita One", Rubik, system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = '#8a2f2a';
      c.fillText(d.ad, 0, 1, h - 6);
      c.restore();
    }
  }
}
function agacCiz(x, z, cw) {
  if (z < -6 || z > 26)
    return;
  const t = pr([x, 3.0, z]);
  if (!t.ok)
    return;
  golge(x + 0.5, z + 0.6, 1.0, 0.8);
  for (const [dx, dz, r, renk] of [[0, 0, 0.95, '#5fae58'], [-0.35, 0.3, 0.6, '#6dbb60'], [0.3, -0.35, 0.55, '#8ccf6a']]) {
    const p = pr([x + dx, 3.0 + (r < 0.9 ? 0.25 : 0), z + dz]);
    c.beginPath();
    c.arc(p.x, p.y, r * p.s, 0, TAU);
    c.fillStyle = renk;
    c.fill();
    c.lineWidth = cw;
    c.strokeStyle = MUREKKEP;
    c.stroke();
  }
}
// Sollamada iki yanda yukarı akan hız çizgileri (dolmuş hızlanınca sokak geriye fırlar).
function hizCizgileri() {
  if (!etkin(D.sollama) || azHareket)
    return;
  const u = (B - D.sollama.bas) / D.sollama.sure, al = Math.sin(Math.PI * u);
  c.strokeStyle = 'rgba(255,255,255,' + (0.6 * al).toFixed(3) + ')';
  c.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const x = i % 2 ? 18 + (i * 37) % 70 : GW - 18 - (i * 41) % 70, L = 70 + (i * 53) % 90, y = ALAN_ALT - ((zaman * 1500 + i * 173) % (ALAN_ALT - UFUK + L));
    c.lineWidth = 3 + (i % 3);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, y + L);
    c.stroke();
  }
}
// "Müsait bir yerde" durağı: dolmuş durduğu yerde, kapı tarafındaki kaldırımda direk ve yuvarlak durak levhası.
function durakTabelasi(cw) {
  const d = D.durak;
  if (!d || d.isaret === null)
    return;
  const x = -3.0 - D.otoX, z = d.k.bz + (D.kayma - d.isaret);
  if (z > 26)
    return;
  const a = pr([x, 0.14, z]), b = pr([x, 2.3, z]);
  if (!a.ok || !b.ok || b.y < UFUK + 20)
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
