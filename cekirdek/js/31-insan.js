/* ÇİZİM — eklemlerden gövde parçaları üretir, uzaktan yakına sıralayıp çizer.
 * liste + kap() + ozel(): çizim listesi · karakterEkle(k): bir karakterin bütün parçaları
 * kafaCiz: yüz, saç, yazma, kasket (baş döndükçe yüz hatları kayar) · davulCiz · mendilCiz
 */
/* ---- çizim listesi (uzaktan yakına sıralanır) ---- */
const liste = [];
function kap(pa, ra, pb, rb, renk, d) {
  if (!pa.ok || !pb.ok)
    return;
  liste.push({ d: d === undefined ? (pa.d + pb.d) / 2 : d, t: 0, x1: pa.x, y1: pa.y, r1: ra * pa.s, x2: pb.x, y2: pb.y, r2: rb * pb.s, c: renk, w: Math.max(1, (pa.s + pb.s) * 0.0065) });
}
function ozel(d, fn) { liste.push({ d, t: 1, fn }); }
function kapYol(x1, y1, r1, x2, y2, r2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  c.beginPath();
  c.arc(x1, y1, r1, a + HP, a - HP);
  c.arc(x2, y2, r2, a - HP, a + HP);
  c.closePath();
}

const SERIT = ['#f2b632', '#e23d2f', '#3d5bd0', '#f6ecd9', '#22b8a7'];
function karakterEkle(k) {
  const j = k.j, g = k.g, p = k.p, boy = g.boy;
  for (const n in j)
    p[n] = pr(j[n]);
  if (!p.hip.ok || !p.kafa.ok)
    return;
  const bacak = g.kadin ? '#3a2a3c' : g.alt;
  for (const y of ['L', 'R']) {
    const kb = p['kb' + y], dz = p['dz' + y], ay = p['ay' + y];
    kap(kb, 0.078 * boy, dz, 0.068 * boy, bacak);
    kap(dz, 0.066 * boy, ay, 0.056 * boy, bacak);
    const a3 = j['ay' + y], uc = pr([a3[0] + k.f[0] * 0.075 * boy, a3[1] - 0.01, a3[2] + k.f[2] * 0.075 * boy]);
    kap(ay, 0.06 * boy, uc, 0.054 * boy, g.ayakkabi, (ay.d + uc.d) / 2 - 0.01);
  }
  const dzOrta = [(j.dzL[0] + j.dzR[0]) / 2, (j.dzL[1] + j.dzR[1]) / 2, (j.dzL[2] + j.dzR[2]) / 2];
  const enYakin = Math.min(p.kbL.d, p.kbR.d, p.dzL.d, p.dzR.d);
  if (g.kadin) {
    const etek = pr([dzOrta[0], dzOrta[1] - 0.035 * boy, dzOrta[2]]);
    kap(p.hip, 0.155 * boy, etek, 0.215 * boy, g.alt, enYakin - 0.03);
    // önlük: öndeki şeritli kumaş
    const o1 = pr([j.hip[0] + k.f[0] * 0.13 * boy, j.hip[1] + 0.01 * boy, j.hip[2] + k.f[2] * 0.13 * boy]), o2 = pr([dzOrta[0] + k.f[0] * 0.17 * boy, dzOrta[1] - 0.02 * boy, dzOrta[2] + k.f[2] * 0.17 * boy]);
    const od = (o1.d + o2.d) / 2 - 0.12;
    kap(o1, 0.075 * boy, o2, 0.115 * boy, g.onluk, od);
    if (o1.ok && o2.ok)
      ozel(od - 0.01, () => {
        const dx = o2.x - o1.x, dy = o2.y - o1.y, uz = Math.hypot(dx, dy) || 1, nx = -dy / uz, ny = dx / uz, r1 = 0.075 * boy * o1.s, r2 = 0.115 * boy * o2.s;
        c.lineWidth = r2 * 0.3;
        let i = SERIT.indexOf(g.onluk) + 1;
        for (const t of [-0.56, 0, 0.56]) {
          c.strokeStyle = SERIT[i++ % SERIT.length];
          c.beginPath();
          c.moveTo(o1.x + nx * t * r1, o1.y + ny * t * r1);
          c.lineTo(o2.x + nx * t * r2 + dx / uz * r2 * 0.55, o2.y + ny * t * r2 + dy / uz * r2 * 0.55);
          c.stroke();
        }
      });
  }
  else {
    const ag = pr([dzOrta[0], dzOrta[1] + 0.045 * boy, dzOrta[2]]);
    kap(p.hip, 0.145 * boy, ag, 0.115 * boy, g.alt, enYakin - 0.02);
  }
  kap(p.hip, 0.148 * boy, p.gogus, 0.168 * boy, g.yelek, p.gogus.d - 0.01);
  if (!g.kadin) {
    const s1 = pr([j.gogus[0] + k.f[0] * 0.12 * boy, j.gogus[1] + 0.02 * boy, j.gogus[2] + k.f[2] * 0.12 * boy]), s2 = pr([j.hip[0] + k.f[0] * 0.105 * boy, j.hip[1] + 0.075 * boy, j.hip[2] + k.f[2] * 0.105 * boy]);
    kap(s1, 0.07 * boy, s2, 0.055 * boy, g.gomlek, (s1.d + s2.d) / 2 - 0.02);
  }
  const b1 = pr([j.hip[0] + k.l[0] * 0.1 * boy, j.hip[1] + 0.055 * boy, j.hip[2] + k.l[2] * 0.1 * boy]), b2 = pr([j.hip[0] - k.l[0] * 0.1 * boy, j.hip[1] + 0.055 * boy, j.hip[2] - k.l[2] * 0.1 * boy]);
  kap(b1, 0.07 * boy, b2, 0.07 * boy, g.kusak, Math.min(b1.d, b2.d) - 0.06);
  for (const y of ['L', 'R']) {
    const om = p['om' + y], dr = p['dr' + y], ha = p['ha' + y];
    kap(om, 0.056 * boy, dr, 0.05 * boy, g.gomlek);
    kap(dr, 0.05 * boy, ha, 0.046 * boy, g.gomlek);
    if (ha.ok)
      liste.push({ d: ha.d - 0.02, t: 2, x: ha.x, y: ha.y, r: 0.055 * boy * ha.s, c: g.ten, w: Math.max(1, ha.s * 0.011) });
  }
  ozel(p.kafa.d - 0.05, () => kafaCiz(k, p.kafa));
  if (k.mod === 'davulcu') {
    const d0 = p.davul;
    ozel(d0.d - 0.2, () => davulCiz(k));
    kap(p.haR, 0.02, p.tokmak, 0.02, '#8a5a2c', p.haR.d - 0.25);
    if (p.tokmak.ok)
      liste.push({ d: p.tokmak.d - 0.26, t: 2, x: p.tokmak.x, y: p.tokmak.y, r: 0.045 * p.tokmak.s, c: '#f6ecd9', w: 1.5 });
    kap(p.haL, 0.012, p.cubuk, 0.008, '#caa46a', p.haL.d - 0.25);
  }
  else if (k.mod === 'zurnaci') {
    // Zurna başın önünde durur; baştan sonra çizilsin diye derinliği öne çekilir.
    kap(p.agiz, 0.02, p.zurnaUc, 0.06, '#7a4a22', p.kafa.d - 0.4);
    if (p.zurnaUc.ok)
      liste.push({ d: p.kafa.d - 0.42, t: 2, x: p.zurnaUc.x, y: p.zurnaUc.y, r: 0.064 * p.zurnaUc.s, c: '#caa46a', w: 1.5 });
  }
  if (k.mendilEl && k.yer > 0.9) {
    const el = p['ha' + k.mendilEl];
    // Mendil elin dış yanına, yukarı doğru sallanır (ekranda el başın solundaysa sola, sağındaysa sağa).
    if (el.ok)
      ozel(el.d - 0.1, () => mendilCiz(el.x, el.y, el.s * 0.8, (el.x < p.kafa.x ? -2.3 : -0.84) + 0.45 * Math.sin(TAU * B), 1));
  }
}
function kafaCiz(k, ph) {
  const g = k.g, R = KAFA_R * g.boy * ph.s, x0 = ph.x, y0 = ph.y, f = k.f, l = k.l;
  const ku = kam.bu, kf = kam.bf;
  const fr = f[0] * kam.r[0] + f[2] * kam.r[2], fu = f[0] * ku[0] + f[2] * ku[2], fd = f[0] * kf[0] + f[2] * kf[2];
  const lr = l[0] * kam.r[0] + l[2] * kam.r[2], lu = l[0] * ku[0] + l[2] * ku[2], ld = l[0] * kf[0] + l[2] * kf[2];
  const uu = ku[1], ud = kf[1];
  const N = (a, b, cc) => ({ x: x0 + R * (a * lr + cc * fr), y: y0 - R * (a * lu + b * uu + cc * fu), d: a * ld + b * ud + cc * fd });
  const cw = Math.max(1, ph.s * 0.012);
  c.lineWidth = cw;
  c.strokeStyle = MUREKKEP;
  const ortu = g.baslik === 'yazma' ? g.baslikRenk : g.sac;
  const arka = N(0, 0.1, -0.36), arkaR = R * (g.baslik === 'yazma' ? 1.02 : 0.95);
  const daire = (x, y, r, renk, cizgi) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = renk; c.fill(); if (cizgi)
    c.stroke(); };
  if (g.baslik === 'orgu')
    for (const s of [-1, 1]) {
      const a = N(s * 0.8, -0.2, -0.3);
      kapYol(a.x, a.y, R * 0.2, a.x + s * R * 0.08, a.y + R * 1.2, R * 0.13);
      c.fillStyle = g.sac;
      c.fill();
      c.stroke();
    }
  if (arka.d > 0)
    daire(arka.x, arka.y, arkaR, ortu, true);
  daire(x0, y0, R, g.ten, true);
  // tepeyi örten saç / yazma / şapka
  c.save();
  c.beginPath();
  c.arc(x0, y0, R - cw * 0.4, 0, TAU);
  c.clip();
  if (g.baslik === 'yazma') {
    const t = N(0, 0.98, 0.14);
    daire(t.x, t.y, R * 0.86, g.baslikRenk);
  }
  else if (g.baslik === 'kasket' || g.baslik === 'bere') {
    const t = N(0, 1.04, 0.02);
    daire(t.x, t.y, R * 0.84, g.baslikRenk);
  }
  else {
    const t = N(0, 1.0, 0.1);
    daire(t.x, t.y, R * 0.78, g.sac);
  }
  c.restore();
  if (fd < 0.3) {
    // Yüz: iri göz, al yanak, açık gülüş. Hediye atan, solo yapan ve coşkun kalabalık gözünü kısarak güler.
    const kirp = (zaman + g.salin * 4.3) % 4.3 < 0.12;
    const guler = k.mod === 'halay' && (B < k.zip1 || k.solo || D.cosku > 0.72);
    for (const s of [-1, 1]) {
      const y = N(s * 0.6, -0.3, 0.68);
      if (y.d < 0) {
        c.globalAlpha = 0.5;
        daire(y.x, y.y, R * (k.mod === 'zurnaci' ? 0.22 : 0.15), '#f0705f');
        c.globalAlpha = 1;
      }
      const e = N(s * 0.36, -0.04, 0.88);
      if (e.d < 0.05) {
        if (guler || kirp) {
          c.lineWidth = R * 0.07;
          c.beginPath();
          c.arc(e.x, e.y + R * 0.06, R * 0.11, Math.PI * 1.12, Math.PI * 1.88);
          c.stroke();
          c.lineWidth = cw;
        }
        else {
          c.beginPath();
          c.ellipse(e.x, e.y, R * 0.085, R * 0.12, 0, 0, TAU);
          c.fillStyle = MUREKKEP;
          c.fill();
          daire(e.x + R * 0.03, e.y - R * 0.045, R * 0.032, '#f6ecd9');
        }
      }
    }
    const m = N(0, -0.42, 0.84);
    if (m.d < 0 && k.mod !== 'zurnaci') {
      c.beginPath();
      c.arc(m.x, m.y - R * 0.05, R * (guler ? 0.17 : 0.13), 0, Math.PI);
      c.closePath();
      c.fillStyle = '#7a1f2a';
      c.fill();
      if (g.biyik) {
        const bi = N(0, -0.26, 0.9);
        c.lineCap = 'round';
        c.lineWidth = R * 0.12;
        c.strokeStyle = g.sac;
        c.beginPath();
        c.moveTo(bi.x - R * 0.26, bi.y + R * 0.06);
        c.quadraticCurveTo(bi.x, bi.y - R * 0.09, bi.x + R * 0.26, bi.y + R * 0.06);
        c.stroke();
        c.strokeStyle = MUREKKEP;
      }
      c.lineWidth = cw;
    }
  }
  if (arka.d <= 0)
    daire(arka.x, arka.y, arkaR, ortu, true);
  if (g.baslik === 'kasket') {
    const s = N(0, 0.46, 0.96);
    if (s.d < 0.05) {
      c.beginPath();
      c.ellipse(s.x, s.y, R * 0.6, R * 0.16, 0, 0, TAU);
      c.fillStyle = g.baslikRenk;
      c.fill();
      c.stroke();
    }
  }
  if (g.baslik === 'bere') {
    const t = N(0, 1.05, 0);
    daire(t.x, t.y, R * 0.16, '#f2b632', true);
  }
  if (g.baslik === 'cicek') {
    const t = N(0.62, 0.62, 0.36);
    if (t.d < 0.3) {
      daire(t.x, t.y, R * 0.22, '#e23d2f', true);
      daire(t.x, t.y, R * 0.08, '#ffd166');
    }
  }
  if (g.baslik === 'yazma') {
    const t = N(0, 0.5, 0.88);
    if (t.d < 0)
      for (const s of [-0.5, 0, 0.5])
        daire(t.x + s * R * 0.7, t.y - Math.abs(s) * R * -0.12, R * 0.05, '#ffd166');
  }
}
function davulCiz(k) {
  const p = k.p, a = p.davulL, b = p.davulR;
  if (!a.ok || !b.ok)
    return;
  const yakinA = a.d < b.d, uz = yakinA ? b : a, yk = yakinA ? a : b, cap = 0.21 * k.g.boy, r1 = cap * uz.s, r2 = cap * yk.s;
  const ac = Math.atan2(yk.y - uz.y, yk.x - uz.x), ek = Math.abs(k.l[0] * kam.f[0] + k.l[2] * kam.f[2]), dar = 0.18 + 0.82 * ek;
  const nx = -Math.sin(ac), ny = Math.cos(ac);
  c.lineWidth = Math.max(1, yk.s * 0.012);
  c.strokeStyle = MUREKKEP;
  c.beginPath();
  c.ellipse(uz.x, uz.y, r1 * dar, r1, ac, 0, TAU);
  c.fillStyle = '#e9dcc0';
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(uz.x + nx * r1, uz.y + ny * r1);
  c.lineTo(yk.x + nx * r2, yk.y + ny * r2);
  c.lineTo(yk.x - nx * r2, yk.y - ny * r2);
  c.lineTo(uz.x - nx * r1, uz.y - ny * r1);
  c.closePath();
  c.fillStyle = '#b5482f';
  c.fill();
  c.stroke();
  c.strokeStyle = '#ffd166';
  c.lineWidth = Math.max(1, yk.s * 0.014);
  for (let i = -2; i <= 2; i++) {
    const t = i / 2.6;
    c.beginPath();
    c.moveTo(uz.x + nx * r1 * t, uz.y + ny * r1 * t);
    c.lineTo(yk.x + nx * r2 * (t + 0.19), yk.y + ny * r2 * (t + 0.19));
    c.stroke();
  }
  c.strokeStyle = MUREKKEP;
  c.lineWidth = Math.max(1, yk.s * 0.012);
  const vur = 1 + (yakinA ? calgi.tekP : calgi.dumP) * 0.05;
  c.beginPath();
  c.ellipse(yk.x, yk.y, r2 * dar * vur, r2 * vur, ac, 0, TAU);
  c.fillStyle = '#f6ecd9';
  c.fill();
  c.stroke();
  c.beginPath();
  c.ellipse(yk.x, yk.y, r2 * dar * 0.55, r2 * 0.55, ac, 0, TAU);
  c.strokeStyle = 'rgba(8,10,28,.25)';
  c.stroke();
  c.strokeStyle = MUREKKEP;
}
function mendilCiz(x, y, s, aci, parlak) {
  const b = 0.3 * s, dal = Math.sin(zaman * 14) * 0.25;
  c.save();
  c.translate(x, y);
  c.rotate(aci);
  if (parlak) {
    c.globalAlpha = 0.25;
    c.beginPath();
    c.arc(b * 0.5, 0, b * 0.9, 0, TAU);
    c.fillStyle = '#ffd166';
    c.fill();
    c.globalAlpha = 1;
  }
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(b * 0.5, -b * (0.5 + dal), b, -b * 0.28);
  c.lineTo(b * 0.78, b * 0.12);
  c.lineTo(b * 1.02, b * 0.42);
  c.quadraticCurveTo(b * 0.45, b * (0.3 - dal), 0, 0);
  c.closePath();
  c.fillStyle = '#e23d2f';
  c.fill();
  c.lineWidth = Math.max(1.5, s * 0.016);
  c.strokeStyle = '#ffd166';
  c.stroke();
  c.restore();
}
