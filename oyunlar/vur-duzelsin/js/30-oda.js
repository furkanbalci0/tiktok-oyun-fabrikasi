/* ODA — seksenlerden bir oturma odası: hardal desenli duvar kâğıdı, sarkaçlı duvar saati, tül perdeli
 * pencere, kanaviçe tablo, vitrinli büfe, püsküllü abajur, parke, kırmızı Türk halısı; gölgeler ve ekranın
 * odaya vuran titrek ışığı. oyunZemin her karede doğrudan c ile çizer (çizim listesine bir şey eklemez).
 * Duvar z = DUVAR_Z düzlemi, zemin y = 0. Duvardaki eşyaların çoğu sahne yazılarının arkasında kalır;
 * saat televizyonun tam üstünde, sıralama kutusu ile gösterge arasındaki boşluğa düşer.
 */
const DUVAR_Z = 3.3;
let desen = null;
// 70'ler duvar kâğıdı: hardal zeminde iç içe turuncu halkalar, aralarında küçük çiçekler.
function desenHazirla() {
  const t = tuvalYap(56, 56), g = t.g;
  g.fillStyle = '#d9a441';
  g.fillRect(0, 0, 56, 56);
  for (const [x, y] of [[14, 14], [42, 42]]) {
    g.beginPath();
    g.arc(x, y, 11, 0, TAU);
    g.fillStyle = '#c4772c';
    g.fill();
    g.beginPath();
    g.arc(x, y, 7, 0, TAU);
    g.fillStyle = '#e7c063';
    g.fill();
    g.beginPath();
    g.arc(x, y, 3, 0, TAU);
    g.fillStyle = '#9c4f1e';
    g.fill();
  }
  g.fillStyle = '#b5652a';
  for (const [x, y] of [[42, 14], [14, 42]])
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.ellipse(x + Math.cos(i * HP) * 3.5, y + Math.sin(i * HP) * 3.5, 2.6, 1.4, i * HP, 0, TAU);
      g.fill();
    }
  desen = c.createPattern(t.tuval, 'repeat');
}
// Duvardaki dikdörtgen (dünya: x0..x1, y0..y1, duvar düzleminde) → ekran köşeleri
function duvarDik(x0, y0, x1, y1, z) {
  z = z === undefined ? DUVAR_Z - 0.01 : z;
  return [pr([x0, y1, z]), pr([x1, y1, z]), pr([x1, y0, z]), pr([x0, y0, z])];
}
function dortgen(k, dolgu, cizgi) {
  if (k.some(p => !p.ok))
    return;
  cokgen(k, dolgu, cizgi);
}

function oyunZemin() {
  if (!desen)
    desenHazirla();
  const s0 = pr([0, 0, DUVAR_Z]), sa = Math.max(1, s0.s), lw = Math.max(1.5, sa * 0.02);
  const isik = ekranIsik();
  // duvar
  c.fillStyle = '#d9a441';
  c.fillRect(0, 0, GW, GH);
  const sol = pr([-8, 0, DUVAR_Z]), sag = pr([8, 0, DUVAR_Z]);
  desen.setTransform(new DOMMatrix().translateSelf(s0.x, s0.y).scaleSelf(sa / 90, sa / 90));
  c.fillStyle = desen;
  c.fillRect(0, 0, GW, Math.max(sol.y, sag.y));
  // üstte koyulaşan duvar, ortada ekranın soğuk ışığı
  const ust = c.createLinearGradient(0, 0, 0, s0.y);
  ust.addColorStop(0, 'rgba(60,25,10,.55)');
  ust.addColorStop(1, 'rgba(60,25,10,0)');
  c.fillStyle = ust;
  c.fillRect(0, 0, GW, s0.y);
  pencere(lw);
  saat(lw);
  tablo(lw);
  // süpürgelik
  dortgen([pr([-8, 0.16, DUVAR_Z - 0.01]), pr([8, 0.16, DUVAR_Z - 0.01]), pr([8, 0, DUVAR_Z - 0.01]), pr([-8, 0, DUVAR_Z - 0.01])], '#6a3519', lw);
  // parke: duvardan öne uzanan tahtalar
  const z0 = DUVAR_Z, z1 = -9;
  const zm = [pr([-8, 0, z0]), pr([8, 0, z0]), pr([8, 0, z1]), pr([-8, 0, z1])];
  if (zm.every(p => p.ok)) {
    cokgen(zm, '#a8693a');
    c.strokeStyle = 'rgba(70,35,15,.45)';
    c.lineWidth = Math.max(1, sa * 0.008);
    c.beginPath();
    for (let x = -8; x <= 8; x += 0.32) {
      const a = pr([x, 0, z0]), b = pr([x, 0, z1]);
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
    }
    for (let z = z0, i = 0; z > z1; z -= 1.1, i++)
      for (let x = -8 + (i % 2) * 0.16; x <= 8; x += 0.64) {
        const a = pr([x, 0, z]), b = pr([x + 0.32, 0, z]);
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
      }
    c.stroke();
  }
  bufe(lw);
  abajur(lw);
  hali(lw);
  // ekranın ışığı halıya düşer, titrer
  const on = pr(tvDunya([0, 0, TV_ON - 0.9]));
  if (on.ok) {
    const r = 2.6 * on.s, gr = c.createRadialGradient(on.x, on.y, 0, on.x, on.y, r);
    gr.addColorStop(0, 'rgba(' + isik.renk + ',' + (isik.guc * 0.75).toFixed(3) + ')');
    gr.addColorStop(1, 'rgba(' + isik.renk + ',0)');
    c.fillStyle = gr;
    c.beginPath();
    c.ellipse(on.x, on.y, r, r * 0.42, 0, 0, TAU);
    c.fill();
  }
  // gölgeler: sehpa ve televizyon, yığın, kişiler
  const tg = pr(tvDunya([0, 0, 0.1]));
  if (tg.ok) {
    c.fillStyle = 'rgba(40,18,10,.4)';
    c.beginPath();
    c.ellipse(tg.x, tg.y, 1.25 * tg.s, 0.45 * tg.s, 0, 0, TAU);
    c.fill();
  }
  golge(KULE.x, KULE.z, 0.32, 0.2);
  for (const k of D.oy.values())
    golge(k.x, k.z, 0.25 * k.g.boy * (1 - k.y0 * 0.4), 0.13 * k.g.boy * (1 - k.y0 * 0.4));
  if (D.dugme)
    golge(D.dugme.x, D.dugme.z, 0.07, 0.035);
}

/* ---- duvardakiler ---- */
// Tül perdeli pencere: dışarıda akşamüstü, karşı apartmanlar ve çatılarında antenler.
function pencere(lw) {
  const x0 = -3.4, x1 = -1.75, y0 = 0.95, y1 = 2.35, k = duvarDik(x0, y0, x1, y1);
  if (k.some(p => !p.ok))
    return;
  const g = c.createLinearGradient(0, k[0].y, 0, k[3].y);
  g.addColorStop(0, '#f2a65a');
  g.addColorStop(1, '#ffd89a');
  cokgen(k, g);
  // karşı apartmanlar
  c.save();
  cokgen(k);
  c.clip();
  const r = rastgeleUret(9);
  for (let x = x0; x < x1; x += 0.3) {
    const h = 0.25 + r() * 0.45, p = duvarDik(x, y0, x + 0.28, y0 + h, DUVAR_Z - 0.005);
    cokgen(p, '#8a5a6a');
    const tep = pr([x + 0.14, y0 + h, DUVAR_Z - 0.005]), s = tep.s;
    c.strokeStyle = '#5a3346';
    c.lineWidth = Math.max(1, s * 0.01);
    c.beginPath();
    c.moveTo(tep.x, tep.y);
    c.lineTo(tep.x, tep.y - 0.18 * s);
    c.moveTo(tep.x - 0.08 * s, tep.y - 0.14 * s);
    c.lineTo(tep.x + 0.08 * s, tep.y - 0.14 * s);
    c.stroke();
  }
  c.restore();
  // pervaz ve kayıt
  cokgen(k, null, lw);
  const om = pr([(x0 + x1) / 2, y1, DUVAR_Z - 0.01]), ol = pr([(x0 + x1) / 2, y0, DUVAR_Z - 0.01]);
  c.strokeStyle = '#f3ead6';
  c.lineWidth = lw * 1.4;
  c.beginPath();
  c.moveTo(om.x, om.y);
  c.lineTo(ol.x, ol.y);
  c.stroke();
  // tül: yarı saydam, alt kenarı fistolu
  c.fillStyle = 'rgba(250,246,236,.55)';
  c.beginPath();
  c.moveTo(k[0].x - 4, k[0].y);
  c.lineTo(k[1].x + 4, k[1].y);
  const n = 10;
  for (let i = n; i >= 0; i--) {
    const x = lerp(k[0].x - 4, k[1].x + 4, i / n), y = lerp(k[3].y, k[2].y, i / n) + 6 + (i % 2) * 5;
    c.lineTo(x, y);
  }
  c.closePath();
  c.fill();
  // yan perdeler: kahverengi kadife, dalgalı
  for (const [xa, xb] of [[x0 - 0.35, x0 + 0.1], [x1 - 0.1, x1 + 0.35]]) {
    const p = duvarDik(xa, y0 - 0.25, xb, y1 + 0.2, DUVAR_Z - 0.02);
    cokgen(p, '#8c3b1f', lw);
    c.strokeStyle = 'rgba(40,10,0,.35)';
    c.lineWidth = lw;
    for (let i = 1; i < 3; i++) {
      const a = pr([lerp(xa, xb, i / 3), y1 + 0.2, DUVAR_Z - 0.02]), b = pr([lerp(xa, xb, i / 3), y0 - 0.25, DUVAR_Z - 0.02]);
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.stroke();
    }
  }
}
// Sarkaçlı duvar saati: ceviz kasa, sarkaç vuruşla sallanır.
function saat(lw) {
  const m = pr([0, 2.0, DUVAR_Z - 0.02]);
  if (!m.ok)
    return;
  const s = m.s;
  c.lineWidth = lw;
  c.strokeStyle = MUREKKEP;
  c.beginPath();
  c.roundRect(m.x - 0.32 * s, m.y - 0.42 * s, 0.64 * s, 1.15 * s, 0.12 * s);
  c.fillStyle = CEVIZ_KOYU;
  c.fill();
  c.stroke();
  c.beginPath();
  c.arc(m.x, m.y - 0.12 * s, 0.24 * s, 0, TAU);
  c.fillStyle = '#f3ead6';
  c.fill();
  c.stroke();
  c.strokeStyle = 'rgba(40,20,10,.8)';
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU;
    c.lineWidth = i % 3 ? lw * 0.4 : lw * 0.8;
    c.beginPath();
    c.moveTo(m.x + Math.cos(a) * 0.19 * s, m.y - 0.12 * s + Math.sin(a) * 0.19 * s);
    c.lineTo(m.x + Math.cos(a) * 0.22 * s, m.y - 0.12 * s + Math.sin(a) * 0.22 * s);
    c.stroke();
  }
  // akrep ve yelkovan: maça beş var
  c.strokeStyle = MUREKKEP;
  c.lineWidth = lw * 0.8;
  c.beginPath();
  c.moveTo(m.x, m.y - 0.12 * s);
  c.lineTo(m.x + Math.cos(-HP - 0.5) * 0.16 * s, m.y - 0.12 * s + Math.sin(-HP - 0.5) * 0.16 * s);
  c.moveTo(m.x, m.y - 0.12 * s);
  c.lineTo(m.x + Math.cos(-HP + 2.6) * 0.11 * s, m.y - 0.12 * s + Math.sin(-HP + 2.6) * 0.11 * s);
  c.stroke();
  // sarkaç camı ve sarkaç
  c.beginPath();
  c.roundRect(m.x - 0.2 * s, m.y + 0.18 * s, 0.4 * s, 0.48 * s, 0.05 * s);
  c.fillStyle = '#3a2016';
  c.fill();
  c.lineWidth = lw * 0.6;
  c.stroke();
  const a = Math.sin(Math.PI * B) * 0.35, px = m.x + Math.sin(a) * 0.36 * s, py = m.y + 0.2 * s + Math.cos(a) * 0.36 * s;
  c.strokeStyle = '#d9a83c';
  c.lineWidth = lw * 0.6;
  c.beginPath();
  c.moveTo(m.x, m.y + 0.2 * s);
  c.lineTo(px, py);
  c.stroke();
  c.beginPath();
  c.arc(px, py, 0.07 * s, 0, TAU);
  c.fillStyle = '#e8b84a';
  c.fill();
  c.strokeStyle = MUREKKEP;
  c.stroke();
}
// Kanaviçe tablo: göl, dağ, kuğu. Yaldızlı çerçeve.
function tablo(lw) {
  const k = duvarDik(1.75, 1.2, 3.05, 2.05);
  if (k.some(p => !p.ok))
    return;
  cokgen(k, '#c99a3a', lw);
  const i = duvarDik(1.85, 1.28, 2.95, 1.97, DUVAR_Z - 0.015);
  const g = c.createLinearGradient(0, i[0].y, 0, i[3].y);
  g.addColorStop(0, '#9fc7d8');
  g.addColorStop(0.55, '#d7e7d6');
  g.addColorStop(0.56, '#4f8fb0');
  g.addColorStop(1, '#3d6f8f');
  cokgen(i, g, lw * 0.6);
  const d = [pr([1.9, 1.62, DUVAR_Z - 0.015]), pr([2.3, 1.88, DUVAR_Z - 0.015]), pr([2.6, 1.7, DUVAR_Z - 0.015]), pr([2.9, 1.86, DUVAR_Z - 0.015]), pr([2.95, 1.62, DUVAR_Z - 0.015])];
  cokgen(d, '#6d7f63');
  const kg = pr([2.45, 1.45, DUVAR_Z - 0.015]), s = kg.s;
  c.fillStyle = '#fbfaf5';
  c.beginPath();
  c.ellipse(kg.x, kg.y, 0.1 * s, 0.045 * s, 0, 0, TAU);
  c.fill();
  c.strokeStyle = '#fbfaf5';
  c.lineWidth = 0.025 * s;
  c.beginPath();
  c.moveTo(kg.x + 0.07 * s, kg.y - 0.01 * s);
  c.quadraticCurveTo(kg.x + 0.13 * s, kg.y - 0.12 * s, kg.x + 0.08 * s, kg.y - 0.14 * s);
  c.stroke();
}
// Vitrinli büfe: camın ardında kristal kadehler, üstünde dantel ve şekerlik.
function bufe(lw) {
  const x0 = 1.55, x1 = 3.5, h = 0.95, z = DUVAR_Z - 0.45;
  const on = [pr([x0, h, z]), pr([x1, h, z]), pr([x1, 0, z]), pr([x0, 0, z])], ust = [pr([x0, h, z]), pr([x1, h, z]), pr([x1, h, DUVAR_Z]), pr([x0, h, DUVAR_Z])];
  if (on.some(p => !p.ok))
    return;
  cokgen(ust, CEVIZ_ACIK, lw);
  cokgen(on, CEVIZ, lw);
  const s = on[0].s;
  // iki cam kapak, içinde kadehler
  for (let i = 0; i < 2; i++) {
    const a = lerp(x0, x1, 0.06 + i * 0.47), b = lerp(x0, x1, 0.47 + i * 0.47);
    const k = [pr([a, h - 0.1, z - 0.01]), pr([b, h - 0.1, z - 0.01]), pr([b, 0.35, z - 0.01]), pr([a, 0.35, z - 0.01])];
    cokgen(k, '#3b2a2a', lw * 0.7);
    for (let j = 0; j < 3; j++) {
      const p = pr([lerp(a, b, 0.22 + j * 0.28), 0.5, z - 0.02]);
      c.fillStyle = 'rgba(210,235,245,.75)';
      c.beginPath();
      c.moveTo(p.x - 0.05 * s, p.y - 0.18 * s);
      c.lineTo(p.x + 0.05 * s, p.y - 0.18 * s);
      c.lineTo(p.x + 0.01 * s, p.y - 0.06 * s);
      c.lineTo(p.x + 0.01 * s, p.y);
      c.lineTo(p.x - 0.01 * s, p.y);
      c.lineTo(p.x - 0.01 * s, p.y - 0.06 * s);
      c.closePath();
      c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,.18)';
    c.beginPath();
    c.moveTo(k[0].x + 0.05 * s, k[0].y);
    c.lineTo(k[0].x + 0.15 * s, k[0].y);
    c.lineTo(k[3].x + 0.02 * s, k[3].y);
    c.lineTo(k[3].x - 0.08 * s, k[3].y);
    c.closePath();
    c.fill();
  }
  // dantel örtü ve kristal şekerlik
  const d = [pr([x0 + 0.4, h + 0.005, z]), pr([x1 - 0.4, h + 0.005, z]), pr([x1 - 0.4, h - 0.12, z - 0.005]), pr([x0 + 0.4, h - 0.12, z - 0.005])];
  cokgen(d, '#f6f0e2', lw * 0.5);
  const sk = pr([(x0 + x1) / 2, h, (z + DUVAR_Z) / 2]);
  c.fillStyle = 'rgba(200,230,240,.85)';
  c.beginPath();
  c.ellipse(sk.x, sk.y - 0.1 * sk.s, 0.14 * sk.s, 0.1 * sk.s, 0, 0, Math.PI);
  c.closePath();
  c.fill();
  c.lineWidth = lw * 0.6;
  c.strokeStyle = MUREKKEP;
  c.stroke();
}
// Püsküllü abajur: ayaklı, sıcak sarı ışık havuzu.
function abajur(lw) {
  const x = -2.85, z = DUVAR_Z - 0.6, a = pr([x, 0, z]), b = pr([x, 1.45, z]);
  if (!a.ok || !b.ok)
    return;
  const s = b.s, gl = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, 2.2 * s);
  gl.addColorStop(0, 'rgba(255,214,140,.45)');
  gl.addColorStop(1, 'rgba(255,214,140,0)');
  c.fillStyle = gl;
  c.fillRect(b.x - 2.2 * s, b.y - 2.2 * s, 4.4 * s, 4.4 * s);
  c.strokeStyle = MUREKKEP;
  c.lineWidth = lw;
  c.beginPath();
  c.moveTo(a.x, a.y);
  c.lineTo(b.x, b.y);
  c.stroke();
  c.strokeStyle = '#d9a83c';
  c.lineWidth = lw * 0.6;
  c.stroke();
  c.beginPath();
  c.ellipse(a.x, a.y, 0.18 * a.s, 0.06 * a.s, 0, 0, TAU);
  c.fillStyle = '#3a2016';
  c.fill();
  c.strokeStyle = MUREKKEP;
  c.lineWidth = lw;
  c.stroke();
  c.beginPath();
  c.moveTo(b.x - 0.16 * s, b.y - 0.3 * s);
  c.lineTo(b.x + 0.16 * s, b.y - 0.3 * s);
  c.lineTo(b.x + 0.3 * s, b.y + 0.02 * s);
  c.lineTo(b.x - 0.3 * s, b.y + 0.02 * s);
  c.closePath();
  c.fillStyle = '#f2d89a';
  c.fill();
  c.stroke();
  c.strokeStyle = '#c4772c';
  c.lineWidth = Math.max(1, s * 0.012);
  c.beginPath();
  for (let i = 0; i <= 10; i++) {
    const px = b.x - 0.3 * s + i * 0.06 * s;
    c.moveTo(px, b.y + 0.02 * s);
    c.lineTo(px + Math.sin(B * Math.PI + i) * 0.01 * s, b.y + 0.08 * s);
  }
  c.stroke();
}

/* ---- halı ---- */
// Kırmızı zeminli Türk halısı: lacivert kenar, krem bordür, ortada göbek, köşelerde motif, önde püsküller.
function hali(lw) {
  const X = 2.7, Z0 = -2.5, Z1 = 2.4;
  const kat = (x0, z0, x1, z1) => [pr([x0, 0.004, z1]), pr([x1, 0.004, z1]), pr([x1, 0.004, z0]), pr([x0, 0.004, z0])];
  const dis = kat(-X, Z0, X, Z1);
  if (dis.some(p => !p.ok))
    return;
  cokgen(dis, '#23305a', lw);
  cokgen(kat(-X + 0.18, Z0 + 0.18, X - 0.18, Z1 - 0.18), '#efe2c0');
  cokgen(kat(-X + 0.28, Z0 + 0.28, X - 0.28, Z1 - 0.28), '#9e2b25');
  // bordürdeki küçük baklavalar
  c.fillStyle = '#9e2b25';
  for (let x = -X + 0.4; x < X - 0.3; x += 0.36)
    for (const z of [Z0 + 0.23, Z1 - 0.23]) {
      const p = [pr([x, 0.005, z + 0.05]), pr([x + 0.08, 0.005, z]), pr([x, 0.005, z - 0.05]), pr([x - 0.08, 0.005, z])];
      cokgen(p, '#b8432d');
    }
  // göbek: iç içe baklava
  const gob = (cx, cz, rx, rz, renk) => cokgen([pr([cx, 0.006, cz + rz]), pr([cx + rx, 0.006, cz]), pr([cx, 0.006, cz - rz]), pr([cx - rx, 0.006, cz])], renk);
  gob(0, -0.3, 1.5, 1.35, '#23305a');
  gob(0, -0.3, 1.22, 1.08, '#efe2c0');
  gob(0, -0.3, 0.95, 0.84, '#c2452f');
  gob(0, -0.3, 0.5, 0.44, '#23305a');
  gob(0, -0.3, 0.22, 0.2, '#e7b546');
  // köşe motifleri
  for (const sx of [-1, 1])
    for (const z of [Z0 + 0.75, Z1 - 0.75]) {
      gob(sx * (X - 0.75), z, 0.36, 0.3, '#23305a');
      gob(sx * (X - 0.75), z, 0.18, 0.15, '#e7b546');
    }
  // ön kenardaki püsküller
  c.strokeStyle = '#efe2c0';
  c.lineWidth = Math.max(1, lw * 0.6);
  c.beginPath();
  for (let x = -X + 0.05; x < X; x += 0.1) {
    const a = pr([x, 0.004, Z0]), b = pr([x, 0.004, Z0 - 0.12]);
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
  }
  c.stroke();
}
