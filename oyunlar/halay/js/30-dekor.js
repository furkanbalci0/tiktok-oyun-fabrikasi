/* DEKOR — gece göğü, köy, meydan zemini, kilim baklavaları, ampul dizileri, gölgeler, halay başı halkası, solo ışığı.
 * arkaHazirla: gökyüzü bir kez çizilir · zeminCiz (meydan + ampulCiz) · Kanca: oyunZemin().
 */
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

function oyunZemin() {
  // Meydanın ışığı ve kilim çevresi oynayanları ortalar: üç kişi de otuz altı kişi de ışığın içinde durur.
  D.meydanR += (Math.max(kam.son.enX, kam.son.hd) + 1.7 - D.meydanR) * Math.min(1, sonDt * 1.6);
  zeminCiz();
  for (const k of D.oy.values())
    golge(k.x, k.z, 0.25 * k.g.boy, 0.13 * k.g.boy);
  for (const k of CALGICILAR)
    golge(k.x, k.z, 0.25 * k.g.boy, 0.13 * k.g.boy);
  // halay başının ayağının altında vuruşla atan altın halka
  if (D.lider) {
    const g = pr([D.lider.x, 0, D.lider.z]);
    if (g.ok) {
      const n = 1 + 0.08 * Math.sin(B * TAU);
      c.strokeStyle = '#ffd166';
      c.lineWidth = Math.max(2, g.s * 0.03);
      c.beginPath();
      c.ellipse(g.x, g.y, 0.37 * g.s * n, 0.2 * g.s * n, 0, 0, TAU);
      c.stroke();
    }
  }
  // solo yapanın üstüne düşen ışık
  if (D.solo && D.solo.k.yer > 0.5) {
    const g = pr([D.solo.k.x, 0, D.solo.k.z]);
    if (g.ok) {
      const gr = c.createLinearGradient(0, 0, 0, g.y);
      gr.addColorStop(0, 'rgba(255,209,102,0)');
      gr.addColorStop(1, 'rgba(255,209,102,.13)');
      c.fillStyle = gr;
      c.beginPath();
      c.moveTo(g.x - 30, 0);
      c.lineTo(g.x + 30, 0);
      c.lineTo(g.x + 0.7 * g.s, g.y);
      c.lineTo(g.x - 0.7 * g.s, g.y);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,209,102,.25)';
      c.beginPath();
      c.ellipse(g.x, g.y, 0.7 * g.s, 0.38 * g.s, 0, 0, TAU);
      c.fill();
    }
  }
}
