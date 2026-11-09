/* DEKOR — gece göğü, köy, meydan zemini, kilim baklavaları, ampul dizileri, konfeti ve kalpler.
 * arkaHazirla: gökyüzü bir kez çizilir · zeminCiz (meydan + ampulCiz): her kare · konfeti / kalpAt / parcaCiz
 */
/* ---- arka plan: gökyüzü bir kez çizilir, sonra kaydırılır ---- */
// Kamera yüksekten baktığı için gerçek ufuk görüntünün dışında kalır. Gökyüzü ve köy, sahnenin üstünde
// sabit bir fon perdesi gibi durur; UFUK o perdenin bittiği satırdır.
const UFUK = 432;
let arkaKatman = null;
function arkaHazirla() {
  const t = document.createElement('canvas');
  t.width = 1100;
  t.height = 600;
  const a = t.getContext('2d'), r = rastgeleUret(41), H = UFUK + 2;
  const gr = a.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#0a0d2a');
  gr.addColorStop(0.55, '#1a2260');
  gr.addColorStop(0.9, '#3a3a86');
  gr.addColorStop(1, '#6b4f8f');
  a.fillStyle = gr;
  a.fillRect(0, 0, 1100, H + 160);
  for (let i = 0; i < 120; i++) {
    a.globalAlpha = 0.3 + r() * 0.7;
    a.fillStyle = '#f6ecd9';
    a.beginPath();
    a.arc(r() * 1100, r() * H * 0.85, 0.6 + r() * 1.4, 0, TAU);
    a.fill();
  }
  a.globalAlpha = 0.12;
  a.fillStyle = '#ffd166';
  a.beginPath();
  a.arc(800, 92, 70, 0, TAU);
  a.fill();
  a.globalAlpha = 1;
  a.fillStyle = '#f6ecd9';
  a.beginPath();
  a.arc(800, 92, 34, 0, TAU);
  a.fill();
  a.fillStyle = 'rgba(169,176,220,.35)';
  for (const [x, y, q] of [[790, 84, 8], [812, 100, 6], [798, 106, 4]]) {
    a.beginPath();
    a.arc(x, y, q, 0, TAU);
    a.fill();
  }
  const tepe = (renk, yuk, f1, f2, kay) => { a.fillStyle = renk; a.beginPath(); a.moveTo(0, H + 160); for (let x = 0; x <= 1100; x += 10)
    a.lineTo(x, H - yuk * (0.55 + 0.3 * Math.sin(x * f1 + kay) + 0.15 * Math.sin(x * f2 + kay * 2))); a.lineTo(1100, H + 160); a.closePath(); a.fill(); };
  tepe('#232a6b', 74, 0.0071, 0.019, 1.2);
  tepe('#181e52', 44, 0.011, 0.027, 4.1);
  // köy: evler, kavaklar, ışıklı pencereler
  for (let x = 20; x < 1090;) {
    const kavak = r() < 0.3;
    if (kavak) {
      const h = 46 + r() * 30;
      a.fillStyle = '#10153d';
      a.beginPath();
      a.ellipse(x + 8, H - h / 2 - 2, 8, h / 2, 0, 0, TAU);
      a.fill();
      x += 22;
      continue;
    }
    const w = 34 + r() * 30, h = 20 + r() * 20;
    a.fillStyle = '#10153d';
    a.fillRect(x, H - h, w, h + 4);
    a.beginPath();
    a.moveTo(x - 4, H - h);
    a.lineTo(x + w / 2, H - h - 12 - r() * 8);
    a.lineTo(x + w + 4, H - h);
    a.closePath();
    a.fill();
    a.fillStyle = r() < 0.75 ? '#ffd166' : '#22b8a7';
    for (let px = x + 7; px < x + w - 9; px += 13)
      if (r() < 0.7)
        a.fillRect(px, H - h + 7, 6, 8);
    x += w + 6 + r() * 26;
  }
  arkaKatman = t;
}
const KILIM = ['#e23d2f', '#22b8a7', '#f2b632'];
let zeminBoya = null;
function zeminCiz() {
  c.drawImage(arkaKatman, -190 - kam.yaw * 520, 0);
  if (!zeminBoya) {
    zeminBoya = c.createLinearGradient(0, UFUK, 0, GH);
    zeminBoya.addColorStop(0, '#242b66');
    zeminBoya.addColorStop(0.3, '#171d4b');
    zeminBoya.addColorStop(1, '#0c1030');
  }
  c.fillStyle = zeminBoya;
  c.fillRect(0, UFUK, GW, GH - UFUK);
  // meydan: ampullerin aydınlattığı sıcak toprak. Kenarı geceye karışır, ortası en aydınlık yerdir.
  const mz = kam.tz, yc = D.meydanR + 0.8;
  const o = pr([0, 0, mz]), sag = pr([yc, 0, mz]), on = pr([0, 0, mz - yc]), ar = pr([0, 0, mz + yc]);
  if (o.ok && sag.ok && on.ok && ar.ok) {
    const rx = sag.x - o.x, my = (on.y + ar.y) / 2, ky = (on.y - ar.y) / 2 / rx;
    c.save();
    c.translate(o.x, my);
    c.scale(1, ky);
    const isik = c.createRadialGradient(0, 0, rx * 0.08, 0, 0, rx);
    isik.addColorStop(0, '#f0cf93');
    isik.addColorStop(0.42, '#c9a166');
    isik.addColorStop(0.72, 'rgba(132,104,96,.86)');
    isik.addColorStop(1, 'rgba(58,52,98,0)');
    c.fillStyle = isik;
    c.beginPath();
    c.arc(0, 0, rx, 0, TAU);
    c.fill();
    c.restore();
  }
  // kilim baklavaları: meydanın çevresini sarar
  const rr = D.meydanR - 0.2, adet = Math.max(18, Math.round(rr * TAU / 0.62));
  for (let i = 0; i < adet; i++) {
    const a = i / adet * TAU, da = 0.2 / rr, dr = 0.26;
    const k = [pr([Math.sin(a - da) * rr, 0, mz + Math.cos(a - da) * rr]), pr([Math.sin(a) * (rr + dr), 0, mz + Math.cos(a) * (rr + dr)]), pr([Math.sin(a + da) * rr, 0, mz + Math.cos(a + da) * rr]), pr([Math.sin(a) * (rr - dr), 0, mz + Math.cos(a) * (rr - dr)])];
    if (k.some(p => !p.ok))
      continue;
    c.beginPath();
    c.moveTo(k[0].x, k[0].y);
    for (let q = 1; q < 4; q++)
      c.lineTo(k[q].x, k[q].y);
    c.closePath();
    c.globalAlpha = 0.8;
    c.fillStyle = KILIM[i % 3];
    c.fill();
  }
  c.globalAlpha = 1;
  ampulCiz();
}
// Ampul dizileri fon perdesinin önünde, meydanın arkasında asılıdır; vuruşla yanıp söner.
const AMPUL = ['#ffd166', '#e23d2f', '#ffd166', '#22b8a7', '#f6ecd9'];
const IPLER = [[-24, 404, 744, 452, 13], [-24, 474, 744, 414, 12]];
function ampulCiz() {
  let say = 0;
  for (const [x1, y1, x2, y2, sark] of IPLER) {
    const n = 22, nokta = t => [lerp(x1, x2, t), lerp(y1, y2, t) + sark * 4 * t * (1 - t)];
    c.strokeStyle = 'rgba(8,10,28,.85)';
    c.lineWidth = 2;
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const [x, y] = nokta(i / n);
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
    for (let i = 1; i < n; i++) {
      const [x, y] = nokta(i / n), renk = AMPUL[say % AMPUL.length], par = 0.72 + 0.28 * Math.sin(B * Math.PI + say * 1.7), r = 6.5;
      say++;
      c.globalAlpha = 0.17 * par;
      c.fillStyle = renk;
      c.beginPath();
      c.arc(x, y + r, r * 3.3, 0, TAU);
      c.fill();
      c.globalAlpha = 0.6 + 0.4 * par;
      c.beginPath();
      c.arc(x, y + r, r, 0, TAU);
      c.fill();
    }
  }
  c.globalAlpha = 1;
}


/* ---- parçacıklar: konfeti, kalpler ---- */
const parca = [];
function konfeti(n, guc) { if (azHareket)
  n = Math.min(n, 12); n = Math.min(n, 420 - parca.length); for (let i = 0; i < n; i++)
  parca.push({ x: GW * (0.1 + Math.random() * 0.8), y: GH * 0.2 + Math.random() * 80, vx: (Math.random() - 0.5) * 420 * guc, vy: -200 - Math.random() * 520 * guc, d: Math.random() * TAU, vd: (Math.random() - 0.5) * 12, c: KUMAS[i % KUMAS.length], o: 2.2 + Math.random() * 1.2, tip: 0, b: 7 + Math.random() * 7 }); }
function kalpAt(n) { const k = Math.min(10, Math.ceil(n / 3), 460 - parca.length); for (let i = 0; i < k; i++)
  parca.push({ x: GW * 0.86 + (Math.random() - 0.5) * 60, y: GH * 0.76 + Math.random() * 40, vx: (Math.random() - 0.5) * 60, vy: -160 - Math.random() * 140, d: 0, vd: 0, c: '#e23d2f', o: 1.6 + Math.random() * 0.8, tip: 1, b: 12 + Math.random() * 10 }); }
function parcaCiz(dt) {
  for (let i = parca.length - 1; i >= 0; i--) {
    const p = parca[i];
    p.o -= dt;
    if (p.o <= 0) {
      parca.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.d += p.vd * dt;
    if (p.tip === 0) {
      p.vy += 620 * dt;
      p.vx *= 0.99;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.d);
      c.globalAlpha = Math.min(1, p.o);
      c.fillStyle = p.c;
      c.fillRect(-p.b / 2, -p.b / 4, p.b, p.b / 2);
      c.restore();
    }
    else {
      p.x += Math.sin(zaman * 4 + i) * 0.6;
      c.save();
      c.translate(p.x, p.y);
      c.globalAlpha = Math.min(1, p.o);
      c.fillStyle = p.c;
      const b = p.b;
      c.beginPath();
      c.moveTo(0, b * 0.35);
      c.bezierCurveTo(-b, -b * 0.3, -b * 0.45, -b * 0.95, 0, -b * 0.4);
      c.bezierCurveTo(b * 0.45, -b * 0.95, b, -b * 0.3, 0, b * 0.35);
      c.fill();
      c.restore();
    }
  }
  c.globalAlpha = 1;
}
