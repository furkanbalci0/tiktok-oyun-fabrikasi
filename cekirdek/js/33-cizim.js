/* ÇİZİM YARDIMCILARI — insan dışındaki nesneler (araba, televizyon, dolap, sahne) için 3B kutu ve yüzeyler,
 * renk karışımı, gök ve ufuk. Hepsi doğrudan c ile çizer: ozel(derinlik, fn) içindeki fn'den ya da oyunZemin'den
 * çağrılır (fn içinden kap / top / ozel çağrılmaz, docs/KANCALAR.md).
 * renkKat(a, b, t): iki rengin karışımı · donusum(x, y, z, yon, olcek): nesnenin yeri ve yönü (T)
 * yerelNokta(T, yana, yukari, ileri): nesnenin yerel ekseninden dünyaya · yuzBakiyor(T, normal, merkez)
 * cokgenCiz(p, renk, cizgi) · yuzCiz(T, noktalar, renk, cizgi) · kutuCiz(T, a0, a1, y0, y1, c0, c1, renk, cizgi, tonlar)
 * daireCiz(p, r, renk, cizgi) · kapsulCiz(pa, ra, pb, rb, renk, cizgi) · ufukY() · gokCiz(g)
 * Yerel eksen (insan takımıyla aynı): yana = nesnenin solu, yukarı = y, ileri = baktığı yön. yon = π kameraya bakar.
 * Adlar oyunlarınkiyle çakışmasın diye "Ciz" / "Nokta" ekiyle verildi: oyunda aynı adla işlev yazma (derle uyarır).
 */
const renkKatBellek = new Map();
// İki rengin karışımı (t: 0 → a, 1 → b), 'rgb(r,g,b)' döner. Yüzeylerin ışık ve gölge tonları buradan türer.
// Renkler #rrggbb ya da #rgb; sonuç önbellekte tutulur (renkleri sabit bir paletten ver, her karede yenisini üretme).
function renkKat(a, b, t) {
  const anahtar = a + b + t;
  let s = renkKatBellek.get(anahtar);
  if (s)
    return s;
  const uzat = h => h.length === 4 ? '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3] : h;
  const x = parseInt(uzat(a).slice(1), 16), y = parseInt(uzat(b).slice(1), 16);
  const kanal = sh => Math.round(lerp(x >> sh & 255, y >> sh & 255, t));
  s = 'rgb(' + kanal(16) + ',' + kanal(8) + ',' + kanal(0) + ')';
  if (renkKatBellek.size > 4000)
    renkKatBellek.clear();
  renkKatBellek.set(anahtar, s);
  return s;
}
// Nesnenin yeri (x, y, z: dünyada, metre), yönü (yon: k.yon gibi, π kameraya bakar) ve ölçeği (olcek, öntanım 1).
function donusum(x, y, z, yon, olcek) {
  const fx = Math.sin(yon), fz = Math.cos(yon);
  return { x, y, z, fx, fz, lx: -fz, lz: fx, k: olcek || 1 };
}
// Nesnenin yerel noktası → dünya [x, y, z]. a: yana (nesnenin solu +), y: yukarı, cc: ileri. Ölçek T.k ile çarpılır.
function yerelNokta(T, a, y, cc) { const q = T.k; return [T.x + (a * T.lx + cc * T.fx) * q, T.y + y * q, T.z + (a * T.lz + cc * T.fz) * q]; }
// Yerel normali n, yerel merkezi m olan yüzey kameraya bakıyor mu.
function yuzBakiyor(T, n, m) {
  const w = yerelNokta(T, m[0], m[1], m[2]), nx = n[0] * T.lx + n[2] * T.fx, nz = n[0] * T.lz + n[2] * T.fz;
  return nx * (kam.C[0] - w[0]) + n[1] * (kam.C[1] - w[1]) + nz * (kam.C[2] - w[2]) > 0;
}
// Ekran noktalarından (pr() sonuçları) çokgen. renk null ise yalnız çizgi; cizgi verilmezse çizgisiz.
function cokgenCiz(p, renk, cizgi) {
  c.beginPath();
  c.moveTo(p[0].x, p[0].y);
  for (let i = 1; i < p.length; i++)
    c.lineTo(p[i].x, p[i].y);
  c.closePath();
  if (renk) {
    c.fillStyle = renk;
    c.fill();
  }
  if (cizgi) {
    c.lineWidth = cizgi;
    c.strokeStyle = MUREKKEP;
    c.stroke();
  }
}
// Yerel noktalardan yüzey (dışbükey çokgen). Kameranın arkasına düşen nokta varsa çizmez, null döner; çizerse
// ekran noktalarını döndürür (üstüne yazı, plaka gibi şey koymak için).
function yuzCiz(T, noktalar, renk, cizgi) {
  const p = noktalar.map(n => pr(yerelNokta(T, n[0], n[1], n[2])));
  if (p.some(q => !q.ok))
    return null;
  cokgenCiz(p, renk, cizgi);
  return p;
}
// Kutu: a0–a1 yana, y0–y1 yukarı, c0–c1 ileri (yerel, metre). Yalnız kameraya bakan yüzler çizilir; kutu dışbükey
// olduğu için görünen yüzler birbirini örtmez, sıra gerekmez. Üst yüz açık, yanlar ve arka koyu tonda (renkKat);
// tonlar = { ust, yan, arka } ile renkler ayrı ayrı verilebilir. Döner: { on, arka, sol, sag, ust } hangi yüz göründü.
//   const T = donusum(1, 0, 2, Math.PI);
//   ozel(pr([1, 0.5, 2]).d, () => { const g = kutuCiz(T, -0.5, 0.5, 0, 0.8, -0.3, 0.3, '#c0392b', 2); if (g.on) yuzCiz(T, …); });
function kutuCiz(T, a0, a1, y0, y1, c0, c1, renk, cizgi, tonlar) {
  const am = (a0 + a1) / 2, ym = (y0 + y1) / 2, cm = (c0 + c1) / 2, g = {};
  const ust = tonlar && tonlar.ust || renkKat(renk, '#fff4dc', 0.22), yan = tonlar && tonlar.yan || renkKat(renk, '#120a1e', 0.22), arka = tonlar && tonlar.arka || renkKat(renk, '#120a1e', 0.35);
  if ((g.on = yuzBakiyor(T, [0, 0, 1], [am, ym, c1])))
    yuzCiz(T, [[a0, y0, c1], [a1, y0, c1], [a1, y1, c1], [a0, y1, c1]], renk, cizgi);
  if ((g.arka = yuzBakiyor(T, [0, 0, -1], [am, ym, c0])))
    yuzCiz(T, [[a0, y0, c0], [a1, y0, c0], [a1, y1, c0], [a0, y1, c0]], arka, cizgi);
  if ((g.sol = yuzBakiyor(T, [1, 0, 0], [a1, ym, cm])))
    yuzCiz(T, [[a1, y0, c0], [a1, y0, c1], [a1, y1, c1], [a1, y1, c0]], yan, cizgi);
  if ((g.sag = yuzBakiyor(T, [-1, 0, 0], [a0, ym, cm])))
    yuzCiz(T, [[a0, y0, c0], [a0, y0, c1], [a0, y1, c1], [a0, y1, c0]], yan, cizgi);
  if ((g.ust = yuzBakiyor(T, [0, 1, 0], [am, y1, cm])))
    yuzCiz(T, [[a0, y1, c0], [a1, y1, c0], [a1, y1, c1], [a0, y1, c1]], ust, cizgi);
  return g;
}
// Ekran noktasında (pr() sonucu) r metrelik daire; cizgi verilirse mürekkep çizgili.
function daireCiz(p, r, renk, cizgi) {
  if (!p.ok)
    return;
  c.beginPath();
  c.arc(p.x, p.y, r * p.s, 0, TAU);
  c.fillStyle = renk;
  c.fill();
  if (cizgi) {
    c.lineWidth = cizgi;
    c.strokeStyle = MUREKKEP;
    c.stroke();
  }
}
// İki ekran noktası arasında kapsül (kap'ın listeye girmeyen, hemen çizen eşi). ra / rb metre.
function kapsulCiz(pa, ra, pb, rb, renk, cizgi) {
  if (!pa.ok || !pb.ok)
    return;
  kapYol(pa.x, pa.y, ra * pa.s, pb.x, pb.y, rb * pb.s);
  c.fillStyle = renk;
  c.fill();
  c.lineWidth = cizgi;
  c.strokeStyle = MUREKKEP;
  c.stroke();
}

/* ---- gök ve ufuk ---- */
// Gerçek ufuk çizgisinin ekrandaki satırı (720×1280 ölçeğinde). Kamera yaklaştıkça, eğildikçe değişir; dik bakan
// kamerada (eğim 0,62, F 1400) ekranın çok üstünde kalır, alçak ve geniş açılı kamerada (eğim 0,5, F 700) görünür.
function ufukY() { return kam.cy - kam.F * Math.tan(kam.egim); }
// Gök ve uzak zemin: oyunZemin'in başında çağrılır, ufuk satırını döndürür; yol, tarla, sahne onun altına çizilir.
// g (hepsi isteğe bağlı):
//   gok: üstten ufka renkler, ör. ['#2a5a9c', '#7fb6e6', '#ffe3b0'] · zemin: ufuktan öne renkler, ör. ['#9bbf6a', '#5f8a3c']
//   pus: ufuk çizgisindeki ince ışık şeridi rengi · gunes: { x: 0–1 (ekran genişliğinde), r: piksel, renk, isik }
//   ufuk: hazır bir satır (verilmezse ufukY()); kamera hep dik bakıyorsa gök görünmesin diye ufuk ekranın üstüne düşer.
//   const u = gokCiz({ gok: ['#2a5a9c', '#ffe3b0'], zemin: ['#9bbf6a', '#5f8a3c'], pus: '#fff1d0', gunes: { x: 0.7, r: 46 } });
function gokCiz(g) {
  g = g || {};
  const u = g.ufuk === undefined ? ufukY() : g.ufuk, gok = g.gok || [RENK.zemin, RENK.zemin2], zemin = g.zemin || [RENK.zemin3, RENK.zemin2];
  const boya = (y0, y1, renkler) => {
    const b = c.createLinearGradient(0, y0, 0, y1);
    renkler.forEach((r, i) => b.addColorStop(renkler.length > 1 ? i / (renkler.length - 1) : 0, r));
    return b;
  };
  if (u > 0) {
    c.fillStyle = boya(Math.min(0, u - 900), u, gok);
    c.fillRect(0, 0, GW, Math.min(GH, u));
  }
  if (g.gunes && u > 0) {
    const gn = g.gunes, x = (gn.x === undefined ? 0.5 : gn.x) * GW, r = gn.r || 50, y = u - r * 0.35;
    c.save();
    c.beginPath();
    c.rect(0, 0, GW, u);
    c.clip();
    c.globalAlpha = 0.25;
    c.fillStyle = gn.isik || '#ffd166';
    c.beginPath();
    c.arc(x, y, r * 2.1, 0, TAU);
    c.fill();
    c.globalAlpha = 1;
    c.fillStyle = gn.renk || '#ffe2a0';
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
    c.restore();
  }
  if (u < GH) {
    const y0 = Math.max(0, u);
    c.fillStyle = boya(u, Math.max(u + 1, GH), zemin);
    c.fillRect(0, y0, GW, GH - y0);
  }
  if (g.pus && u > -40 && u < GH + 40) {
    const b = c.createLinearGradient(0, u - 46, 0, u + 30);
    b.addColorStop(0, renkSaydam(g.pus, 0));
    b.addColorStop(0.62, renkSaydam(g.pus, 0.55));
    b.addColorStop(1, renkSaydam(g.pus, 0));
    c.fillStyle = b;
    c.fillRect(0, u - 46, GW, 76);
  }
  return u;
}
