/* SEDİR VE MİNDERLER — kalabalığın basamakları. Sağ arkada kilim örtülü sedir (oturanlar), televizyonun
 * önünde kadife minderler (çömelenler). Sedir çizim listesine tek ozel ile girer; minderler yerde, zeminle
 * birlikte çizilir. Ayrıca kadraj ölçümü: testler televizyonun, antenin, liderin ve kalabalığın ekrandaki
 * yerini buradan okur (sahne yazılarıyla çakışma, ekranın örtülmesi, alt kenar).
 */
const MINDER_RENK = ['#b8322b', '#2f6f4a', '#d27a2c', '#7a3b8c', '#2f62b8', '#c9a23a', '#a83c62'];
function minderCiz() {
  let i = 0;
  for (const [x, z, tur] of YERLER) {
    if (tur !== 'comel')
      continue;
    const p = pr([x, 0.03, z + 0.04]);
    if (!p.ok)
      continue;
    c.beginPath();
    c.ellipse(p.x, p.y, 0.27 * p.s, 0.12 * p.s, 0, 0, TAU);
    c.fillStyle = MINDER_RENK[i++ % MINDER_RENK.length];
    c.fill();
    c.lineWidth = Math.max(1.2, p.s * 0.012);
    c.strokeStyle = MUREKKEP;
    c.stroke();
    // köşe püskülleri ve dikiş
    c.strokeStyle = 'rgba(255,230,180,.55)';
    c.beginPath();
    c.ellipse(p.x, p.y, 0.19 * p.s, 0.08 * p.s, 0, 0, TAU);
    c.stroke();
  }
}
// Kilim örtülü sedir: oturak, arkalık, üç yastık, yanlarda kol; arkalığın üstünde dantel.
function sedirCiz() {
  const S = SEDIR, lw = Math.max(1.5, pr([S.x0, S.h, S.z0]).s * 0.016);
  const P = (x, y, z) => pr([x, y, z]);
  const kat = (x0, y0, z0, x1, y1, z1) => [P(x0, y1, z0), P(x1, y1, z0), P(x1, y0, z0), P(x0, y0, z0)];
  // arkalık (arkada, önce)
  cokgen([P(S.x0, 0.95, S.z1), P(S.x1, 0.95, S.z1), P(S.x1, S.h, S.z1), P(S.x0, S.h, S.z1)], '#7a3a1e', lw);
  cokgen([P(S.x0, 0.95, S.z1), P(S.x1, 0.95, S.z1), P(S.x1, 0.95, S.z1 + 0.15), P(S.x0, 0.95, S.z1 + 0.15)], '#8f4826', lw);
  // dantel arkalık örtüsü
  const d = [P(S.x0 + 0.25, 0.96, S.z1 - 0.01), P(S.x1 - 0.25, 0.96, S.z1 - 0.01), P(S.x1 - 0.25, 0.8, S.z1 - 0.01), P(S.x0 + 0.25, 0.8, S.z1 - 0.01)];
  cokgen(d, '#f6f0e2', lw * 0.5);
  // yastıklar
  for (let i = 0; i < 3; i++) {
    const x = lerp(S.x0 + 0.2, S.x1 - 0.2, i / 2), p = P(x, S.h + 0.2, S.z1 - 0.08);
    c.beginPath();
    c.roundRect(p.x - 0.17 * p.s, p.y - 0.15 * p.s, 0.34 * p.s, 0.3 * p.s, 0.08 * p.s);
    c.fillStyle = ['#c9a23a', '#2f6f4a', '#b8322b'][i];
    c.fill();
    c.lineWidth = lw * 0.8;
    c.strokeStyle = MUREKKEP;
    c.stroke();
  }
  // oturak: üst yüz ve kilim örtülü ön yüz
  cokgen([P(S.x0, S.h, S.z0), P(S.x1, S.h, S.z0), P(S.x1, S.h, S.z1), P(S.x0, S.h, S.z1)], '#a8452a', lw);
  const on = kat(S.x0, 0, S.z0, S.x1, S.h, S.z0);
  cokgen(on, '#9e2b25', lw);
  // kilim deseni: şeritler ve baklavalar
  for (const [y, renk] of [[0.34, '#efe2c0'], [0.3, '#23305a'], [0.1, '#23305a'], [0.06, '#efe2c0']]) {
    const a = P(S.x0, y, S.z0 - 0.005), b = P(S.x1, y, S.z0 - 0.005);
    c.strokeStyle = renk;
    c.lineWidth = Math.max(1.5, a.s * 0.025);
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
  }
  for (let x = S.x0 + 0.12; x < S.x1 - 0.05; x += 0.22) {
    const m = P(x, 0.2, S.z0 - 0.006), r = 0.06 * m.s;
    c.beginPath();
    c.moveTo(m.x, m.y - r);
    c.lineTo(m.x + r * 0.8, m.y);
    c.lineTo(m.x, m.y + r);
    c.lineTo(m.x - r * 0.8, m.y);
    c.closePath();
    c.fillStyle = '#e7b546';
    c.fill();
  }
  // yan kol
  cokgen(kat(S.x0 - 0.08, 0, S.z0, S.x0 + 0.04, S.h + 0.22, S.z0), '#7a3a1e', lw);
}

/* ---- kadraj ölçümü (720×1280 ölçeğinde) ---- */
function kadrajOlc() {
  const kutu = noktalar => {
    const ok = noktalar.filter(p => p.ok);
    return { x0: Math.min(...ok.map(p => p.x)), x1: Math.max(...ok.map(p => p.x)), y0: Math.min(...ok.map(p => p.y)), y1: Math.max(...ok.map(p => p.y)) };
  };
  const tvKose = [];
  for (const x of [-TV_W, TV_W])
    for (const y of [TV_ALT, TV_UST + 0.06])
      for (const z of [TV_ON, TV_ARKA])
        tvKose.push(tvP([x, y, z]));
  for (const x of [-0.9, 0.9])
    for (const z of [-0.5, 0.5])
      tvKose.push(sehpaP([x * 1.12, 0, z * 1.12]));
  const tv = kutu(tvKose), u = antenUclari(), an = [u.kok, u.sol, u.sag].map(pr);
  const ekran = kutu([tvP([EKRAN.x0, TV_UST - EKRAN.y0, TV_ON]), tvP([EKRAN.x1, TV_UST - EKRAN.y0, TV_ON]), tvP([EKRAN.x0, TV_UST - EKRAN.y1, TV_ON]), tvP([EKRAN.x1, TV_UST - EKRAN.y1, TV_ON])]);
  const tvd = tvP([0, 1.0, TV_ARKA]).d;
  let lider = null, orten = [], kisiler = [];
  for (const k of D.oy.values()) {
    if (k.cikiyor || !k.p.kafa || !k.p.kafa.ok)
      continue;
    const ph = k.p.kafa, R = KAFA_R * k.g.boy * ph.s, ayak = pr([k.x, 0, k.z]);
    const b = { ad: k.ad, x0: ph.x - R, x1: ph.x + R, ust: ph.y - R, ayak: ayak.y, etiket: k.etY === undefined ? null : k.etY, et: !!k.et };
    if (k === D.lider)
      lider = b;
    else
      kisiler.push(b);
    // ekranın önünde çizilen bir baş ekranın içine giriyorsa ekranı örtüyor demektir
    if (ph.d < tvd && ph.x + R > ekran.x0 && ph.x - R < ekran.x1 && ph.y + R > ekran.y0 && ph.y - R < ekran.y1)
      orten.push(k.ad);
  }
  return { tv, ekran, anten: { y0: Math.min(...an.map(p => p.y)), x0: Math.min(...an.map(p => p.x)), x1: Math.max(...an.map(p => p.x)), noktalar: an.map(p => [Math.round(p.x), Math.round(p.y)]) }, lider, kisiler, orten };
}
