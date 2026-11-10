/* KONVOY HAREKETİ — arabaların yerine sürülmesi, şerit salınımı, zigzag, drift, yolun akması, fişek ve duman.
 * arabaHareket(k, dt): yerine sür, çık, drift · Kancalar: oyunGuncelle(dt), oyunKamera().
 * Arabanın çizim konumu: k.x + k.ox, k.z + k.oz, yükseklik k.oy0; yönü k.yonG (π: kameraya doğru gider).
 * k.f / k.l her karede yönden kurulur; kafaCiz başı bunlarla döndürür.
 */
let sonDt = 0.016;

function arabaHareket(k, dt) {
  const ar = k.ar;
  let hx = k.hedefX, hz = k.hedefZ;
  const yildiz = D.drift && D.drift.k === k;
  if (k.cikiyor) {
    // Çıkan arabanın hızı düşer, kenara çekip geride kalır.
    if (k.cikX === undefined)
      k.cikX = (k.x >= 0 ? 1 : -1) * (D.yolW + 4);
    hx = k.cikX;
    hz = k.z + 3;
  }
  else if (yildiz) {
    hx = 0;
    hz = DRIFT_Z;
  }
  const dx = hx - k.x, dz = hz - k.z, uz = Math.hypot(dx, dz);
  if (uz > 0.002) {
    const adim = Math.min(uz, (3.2 + uz * 1.5) * dt);
    k.x += dx / uz * adim;
    k.z += dz / uz * adim;
  }
  const yerinde = uz < 0.2 && !k.cikiyor;
  k.yer += ((yerinde ? 1 : 0) - k.yer) * Math.min(1, dt * 6);
  if (k.cikiyor)
    k.gitti = Math.abs(k.x) > D.yolW + 3.2;

  // Şeritte hafif salınım (her arabanın kendi evresiyle) ve zigzag dalgası (öndeki sıra önce kıvrılır).
  let ox = azHareket ? 0 : 0.05 * Math.sin(TAU * B / 8 + ar.faz * TAU) * k.yer, egimYon = 0;
  const zz = D.zigzag;
  if (zz && !yildiz && !k.cikiyor && !azHareket) {
    const u = B - zz.bas, sira = (k.hedefZ - LIDER_Z) / ARA_Z;
    if (u >= 0 && u < zz.sure) {
      const zarf = Math.sin(Math.PI * u / zz.sure), ev = TAU * u / 4 - sira * 0.9;
      ox += 0.55 * zarf * Math.sin(ev);
      egimYon = -0.5 * zarf * Math.cos(ev);
    }
  }
  k.ox += (ox - k.ox) * Math.min(1, dt * 10);
  k.oz = 0;
  // Yön: kameraya doğru (π); yer değiştirirken gittiği yana kırılır, zigzagda kıvrımın yönüne bakar.
  let yon = Math.PI + egimYon + (uz > 0.25 && !k.cikiyor ? clamp(-dx * 0.35, -0.5, 0.5) : 0) + (k.cikiyor ? -Math.sign(k.cikX) * 0.35 : 0);
  if (yildiz && yerinde && !azHareket) {
    // Drift: dört vuruşun ikisinde tam tur döner (yerinde küçük bir daire çizerek), ikisinde poz verir.
    const su = B - D.drift.bas;
    if (su >= 0) {
      const u = su % 4, t = u < 2 ? yumusak(u / 2) : 1, a = TAU * t;
      yon = Math.PI + a;
      k.ox = 0.6 * Math.sin(a);
      k.oz = 0.35 * (1 - Math.cos(a));
      if (u < 2 && D.duman.length < 70 && Math.random() < dt * 30)
        D.duman.push({ x: k.x + k.ox + (Math.random() - 0.5) * 0.8, z: k.z + k.oz + (Math.random() - 0.5) * 0.8, b0: B, r: 0.25 + Math.random() * 0.2 });
    }
  }
  k.yonG = k.yonG === undefined ? yon : k.yonG + aciFark(k.yonG, yon) * Math.min(1, dt * (yildiz ? 20 : 7));
  k.yon = k.yonG;
  const fx = Math.sin(k.yonG), fz = Math.cos(k.yonG);
  k.f[0] = fx;
  k.f[1] = 0;
  k.f[2] = fz;
  k.l[0] = -fz;
  k.l[1] = 0;
  k.l[2] = fx;
  // Yükseklik: her vuruşta süspansiyon yaylanır (sıra arkaya doğru gecikir), hediye sevincinde araba zıplar.
  const yay = 0.5 + 0.5 * Math.cos(TAU * (B - (k.hedefZ - LIDER_Z) * 0.04));
  let zip = 0;
  if (B >= k.zip0 && B < k.zip1)
    zip = (yildiz ? 0.12 : 0.22) * Math.abs(Math.sin(Math.PI * (B - k.zip0)));
  k.oy0 = 0.025 * yay + zip;
  // Drift atan araba sahneyi alır: birkaç saniyeliğine bir buçuk kat büyür.
  k.olcek = lerp(k.olcek || 1, yildiz ? 1.5 : 1, Math.min(1, dt * 4));
}

function oyunGuncelle(dt) {
  sonDt = dt;
  // Yol konvoyun altından akar: hız vuruşa bağlı, gaz (coşku) arttıkça hızlanır. B geri gitmez.
  const db = clamp(B - D.sonB, 0, 1);
  D.sonB = B;
  D.kayma += db * (1.4 + 3.2 * D.cosku);
  D.yolW += (Math.max(2.3, kam.son.enX + 1.25) - D.yolW) * Math.min(1, dt * 1.5);
  if (D.zigzag && B > D.zigzag.bas + D.zigzag.sure)
    D.zigzag = null;
  // drift: sırası gelen en öne çıkar, 16 vuruş döner
  if (D.drift && (B > D.drift.bas + DRIFT_V || D.drift.k.cikiyor || !D.oy.has(D.drift.k.id))) {
    const k = D.drift.k;
    k.yildiz = k.guler = false;
    D.drift = null;
  }
  if (!D.drift && D.driftKuyruk.length) {
    const k = D.driftKuyruk.shift();
    if (!k.cikiyor && D.oy.has(k.id)) {
      k.yildiz = k.guler = true;
      D.drift = { k, bas: Math.ceil(B) + 1 };
      kornaCal(k);
    }
  }
  if (D.kurdeleUcus && B - D.kurdeleUcus.b0 > D.kurdeleUcus.sure)
    D.kurdeleUcus = null;
  // havai fişek: şov sürerken her vuruşta bir yenisi atılır
  if (B < D.fisekBit && Math.floor(B) !== Math.floor(B - db))
    fisekAt(1);
  for (let i = D.fisekler.length - 1; i >= 0; i--)
    if (B - D.fisekler[i].b0 > 4)
      D.fisekler.splice(i, 1);
  for (let i = D.duman.length - 1; i >= 0; i--)
    if (B - D.duman[i].b0 > 2.5)
      D.duman.splice(i, 1);
  muzik.sov = B < D.sovBit;
  for (const k of D.oy.values()) {
    arabaHazir(k);
    arabaHareket(k, dt);
  }
}
// Gökte bir havai fişek: önce yükselir, sonra açılır. Göğün sağ yarısında patlar: sol üstte sıralama kutusu var. Görünümü süs olduğu için Math.random kullanır.
function fisekAt(n) {
  for (let i = 0; i < n && D.fisekler.length < 14; i++)
    D.fisekler.push({ x: 280 + Math.random() * 380, y: 250 + Math.random() * 140, b0: B + i * 0.35, renk: KUMAS[Math.floor(Math.random() * KUMAS.length)], renk2: Math.random() < 0.5 ? '#ffd166' : '#f6ecd9', n: 22 + Math.floor(Math.random() * 10), aci: Math.random() * TAU });
}

// Kadraja girmesi gerekenler: her arabanın önü ve arkası (yanlarından pay bırakarak), drift yeri.
function oyunKamera() {
  const zz = D.zigzag ? 0.5 : 0, n = [[0.9, LIDER_Z - 0.75], [0.9, LIDER_Z + 0.75]];
  for (const k of D.sira) {
    const x = Math.abs(k.hedefX) + 0.15 + zz;
    n.push([x, k.hedefZ - 0.75], [x, k.hedefZ + 0.75]);
  }
  if (D.drift)
    n.push([1.5, DRIFT_Z - 1.3], [1.5, DRIFT_Z + 0.6]);
  return n;
}
