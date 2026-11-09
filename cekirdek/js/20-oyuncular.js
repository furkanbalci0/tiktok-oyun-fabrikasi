/* KURALLAR VE OYUN DURUMU — kim halayda, kim halay başı, hangi olay neyi tetikler.
 * D: bütün oyun durumu · karakterYap / gorunumUret: izleyiciden karakter · katil / cikar / siraGuncelle: halay sırası
 * olay(o): DIŞARIDAN GELEN HER ŞEYİN TEK GİRİŞ KAPISI (sahte izleyici, köprü ve testler hep bunu çağırır).
 * Olay biçimi docs/OLAYLAR.md'de. Kullanıcı metni burada temizlenir; hiçbir yerde HTML olarak yazılmaz.
 */
const MAKS = 36, ARALIK = 0.54;
const KADEME = [
  { min: 1000, ad: 'Meydan senin', tip: 'solo' },
  { min: 200, ad: 'Davulcu coşsun', tip: 'davul' },
  { min: 50, ad: 'Çök', tip: 'cok' },
  { min: 10, ad: 'Omuz', tip: 'omuz' },
  { min: 1, ad: 'Zıpla', tip: 'zipla' }
];
const D = { oy: new Map(), sira: [], lider: null, cosku: 0.15, begeni: 0, hareket: null, soloKuyruk: [], solo: null, sovBit: -1, mendilUcus: null, R: 2.2, aci: 0, sarsinti: 0, meydanR: 3.6 };
let zaman = 0, B = 0; // oyun saati (sn) ve müzik vuruşu

const TEN = ['#f2c9a0', '#e3ad7e', '#c98d5e', '#a86d45', '#f6d9bb'];
const SAC = ['#1d1513', '#3a2416', '#5b3a1f', '#2a2a35', '#7b4a22'];
const KUMAS = ['#e23d2f', '#22b8a7', '#f2b632', '#f6ecd9', '#3d5bd0', '#e86a9a', '#4fae6c', '#8b55c9', '#ef7d2d'];
const KOYU = ['#20264f', '#3a2a2c', '#1d3b3a', '#2c2c38', '#4a2238'];
function gorunumUret(id) {
  const r = rastgeleUret(ozet(id)), sec = a => a[Math.floor(r() * a.length)];
  const kadin = r() < 0.5, ana = sec(KUMAS);
  let ikinci = sec(KUMAS);
  if (ikinci === ana)
    ikinci = KUMAS[(KUMAS.indexOf(ana) + 3) % KUMAS.length];
  return {
    kadin, ten: sec(TEN), sac: sec(SAC), boy: 0.98 + r() * 0.13,
    gomlek: kadin ? ana : (r() < 0.7 ? '#f6ecd9' : '#dfe6f5'), yelek: kadin ? ana : sec(KUMAS),
    alt: kadin ? ana : sec(KOYU), onluk: ikinci, kusak: kadin ? ikinci : (ana === '#e23d2f' ? '#f2b632' : '#e23d2f'),
    baslik: kadin ? sec(['yazma', 'yazma', 'orgu', 'cicek']) : sec(['kasket', 'kasket', 'yok', 'bere']),
    baslikRenk: kadin ? ikinci : sec(KOYU), biyik: !kadin && r() < 0.55, ayakkabi: sec(['#2a1c16', '#191a2a', '#5a3620']), salin: r()
  };
}
function karakterYap(id, ad) {
  return { id, ad, jeton: 0, son: zaman, katilim: zaman, g: gorunumUret(id), x: 0, z: 0, y0: 0, yon: Math.PI, yer: 0, hx: 0, hz: 0, sn: 0,
    cikiyor: false, solo: false, balon: null, zip0: -9, zip1: -9, kos: 0, j: {}, p: {}, f: [0, 0, -1], l: [1, 0, 0], mod: 'halay', yeni: zaman };
}
const davulcu = karakterYap('__davulcu', 'Davulcu');
davulcu.mod = 'davulcu';
Object.assign(davulcu.g, { kadin: false, ten: '#d9a070', sac: '#1d1513', boy: 1.2, gomlek: '#f6ecd9', yelek: '#20264f', alt: '#3a2a2c', kusak: '#e23d2f', baslik: 'kasket', baslikRenk: '#3a2a2c', biyik: true });
const zurnaci = karakterYap('__zurnaci', 'Zurnacı');
zurnaci.mod = 'zurnaci';
Object.assign(zurnaci.g, { kadin: false, ten: '#f2c9a0', sac: '#3a2416', boy: 1.14, gomlek: '#f6ecd9', yelek: '#22b8a7', alt: '#20264f', kusak: '#f2b632', baslik: 'bere', baslikRenk: '#e23d2f', biyik: false });
const calgi = { dumP: 0, tekP: 0, perde: 3 };

const temiz = s => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim();
const ayar = { balon: true, yasak: [] };
const yasakVar = m => { const k = m.toLocaleLowerCase('tr'); return ayar.yasak.some(y => k.includes(y)); };
const balonMetni = m => yasakVar(m) ? '' : m.replace(/(https?:\/\/|www\.)\S+/gi, '…').replace(/\d[\d\s().+-]{6,}\d/g, '…');
const kisalt = (s, n) => { const a = Array.from(s); return a.length > n ? a.slice(0, n - 1).join('') + '…' : s; };

function katil(id, ad, zorla) {
  let k = D.oy.get(id);
  if (k && !k.cikiyor) {
    if (ad)
      k.ad = ad;
    return k;
  }
  if (D.sira.length >= MAKS) {
    let kurban = null;
    for (const a of D.sira) {
      if (a === D.lider || a.solo)
        continue;
      if (!zorla && a.jeton > 0)
        continue;
      if (!kurban || a.jeton < kurban.jeton || (a.jeton === kurban.jeton && a.son < kurban.son))
        kurban = a;
    }
    if (!kurban)
      return null;
    cikar(kurban);
  }
  k = karakterYap(id, ad || id);
  D.oy.set(id, k);
  siraGuncelle();
  const a = k.hedefAci || 0, r = D.R + 4.5;
  k.x = Math.sin(a) * r;
  k.z = Math.cos(a) * r;
  return k;
}
function cikar(k) { k.cikiyor = true; k.cikis = zaman; siraGuncelle(); }
function siraGuncelle() {
  D.sira = [...D.oy.values()].filter(k => !k.cikiyor).sort((a, b) => b.jeton - a.jeton || a.katilim - b.katilim);
  D.sira.forEach((k, i) => k.sn = i);
  D.lider = D.sira[0] || null;
  yerlesimHesapla();
  D.siraKirli = true;
}
function yerlesimHesapla() {
  const n = D.sira.length, L = Math.max(0, n - 1) * ARALIK;
  D.Rhedef = Math.max(2.2, L / 5.2);
  const R = D.Rhedef;
  D.aci = L / R;
  // Yay arkada ortalanır, açıklığı hep kameraya bakar: halkanın içi (çalgıcılar, solo) kapanmaz.
  // Halay başı yayın sol ucundadır; kameraya döndüğü için serbest kalan sağ eli mendili sallar.
  const bas = -D.aci / 2;
  D.sira.forEach((k, i) => { k.hedefAci = bas + i * ARALIK / R; });
}

function olay(o) {
  if (!o || !o.tip)
    return;
  const kim = o.kullanici || {}, id = temiz(kim.id || kim.ad).slice(0, 64);
  if (!id)
    return;
  let ad = kisalt(temiz(kim.ad || kim.id), 18);
  if (yasakVar(ad))
    ad = 'misafir';
  if (o.tip === 'yorum') {
    const m = temiz(o.metin).slice(0, 200), b = ayar.balon ? balonMetni(m) : '';
    const k = katil(id, ad, false);
    if (k) {
      k.son = zaman;
      if (b)
        k.balon = { m: kisalt(b, 30), t0: zaman };
    }
    gunluk('yorum', ad, m);
  }
  else if (o.tip === 'begeni') {
    const n = clamp(Math.round(o.adet) || 1, 1, 500);
    D.begeni += n;
    D.cosku = Math.min(1, D.cosku + n * 0.006);
    const k = D.oy.get(id);
    if (k)
      k.son = zaman;
    kalpAt(n);
    gunluk('beğeni', ad, '×' + n);
  }
  else if (o.tip === 'takip') {
    const k = katil(id, ad, false);
    if (k) {
      k.son = zaman;
      k.yeni = zaman;
    }
    bildir(ad, 'takip etti, hoş geldin');
    gunluk('takip', ad, '');
  }
  else if (o.tip === 'paylasim') {
    D.cosku = Math.min(1, D.cosku + 0.05);
    gunluk('paylaşım', ad, '');
  }
  else if (o.tip === 'katilim') {
    gunluk('geldi', ad, '');
  }
  else if (o.tip === 'hediye') {
    const j = clamp(Math.round((+o.jeton || 1) * (+o.adet || 1)), 1, 1e7), onceki = D.lider;
    const k = katil(id, ad, true);
    if (!k)
      return;
    k.jeton += j;
    k.son = zaman;
    D.cosku = Math.min(1, D.cosku + Math.min(0.35, j / 300));
    const kd = KADEME.find(x => j >= x.min), v = Math.ceil(B);
    k.zip0 = Math.ceil(B * 2) / 2;
    k.zip1 = k.zip0 + 4;
    if (kd.tip === 'omuz' || kd.tip === 'cok')
      D.hareket = { tip: kd.tip, bas: v, sure: 8 };
    if (kd.tip === 'davul' || kd.tip === 'solo') {
      D.sovBit = Math.max(D.sovBit, v + 16);
      D.hareket = { tip: 'omuz', bas: v, sure: 8 };
      konfeti(40, 0.5);
    }
    if (kd.tip === 'solo') {
      if (!D.soloKuyruk.includes(k) && !k.solo && D.soloKuyruk.length < 4)
        D.soloKuyruk.push(k);
      konfeti(120, 1);
      D.sarsinti = 1;
    }
    bildir(ad, j + ' jeton', kd.ad + '!');
    muzik.zil(Math.min(1, j / 200));
    gunluk('hediye', ad, j + ' jeton → ' + kd.ad, true);
    siraGuncelle();
    if (onceki && D.lider !== onceki)
      liderDegisti(onceki, D.lider);
  }
}
function liderDegisti(eski, yeni) {
  const e = eski.j.haR || [eski.x, 1.4, eski.z];
  D.mendilUcus = { x: e[0], y: e[1], z: e[2], t0: zaman, sure: 1.0, kime: yeni };
  pankart('Mendil el değiştirdi', 'Yeni halay başı: ' + yeni.ad);
  konfeti(90, 0.9);
  D.sarsinti = 0.7;
}
