/* PARÇACIKLAR — konfeti ve beğeni kalpleri. Ekran koordinatında (720×1280) uçar, sahnenin üstüne çizilir.
 * konfeti(adet, guc): ekranın üstünden saçılır · kalpAt(begeniSayisi): sağ alttan kalpler yükselir
 * parcaCiz(dt): çekirdek her karede çağırır. Toplam parçacık sayısı sınırlıdır (olay selinde de şişmez).
 */
const parca = [];
function konfeti(n, guc) { if (azHareket)
  n = Math.min(n, 12); n = Math.min(n, 420 - parca.length); for (let i = 0; i < n; i++)
  parca.push({ x: GW * (0.1 + Math.random() * 0.8), y: GH * 0.2 + Math.random() * 80, vx: (Math.random() - 0.5) * 420 * guc, vy: -200 - Math.random() * 520 * guc, d: Math.random() * TAU, vd: (Math.random() - 0.5) * 12, c: KUMAS[i % KUMAS.length], o: 2.2 + Math.random() * 1.2, tip: 0, b: 7 + Math.random() * 7 }); }
function kalpAt(n) { const k = Math.min(10, Math.ceil(n / 3), 460 - parca.length); for (let i = 0; i < k; i++)
  parca.push({ x: GW * 0.86 + (Math.random() - 0.5) * 60, y: GH * 0.76 + Math.random() * 40, vx: (Math.random() - 0.5) * 60, vy: -160 - Math.random() * 140, d: 0, vd: 0, c: RENK.sicak, o: 1.6 + Math.random() * 0.8, tip: 1, b: 12 + Math.random() * 10 }); }
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
