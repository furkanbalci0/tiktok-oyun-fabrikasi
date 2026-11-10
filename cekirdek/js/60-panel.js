/* PANEL VE AÇILIŞ — sayfa yazıları, deneme panelinin düğmeleri, sahnenin boyutlandırılması, oyunun başlatılması.
 * sayfaYaz: logo, nasıl oynanır, başlıklar, kademe tablosu ve tema renkleri OYUN'dan · boyutla: sahneyi 9:16 tutar
 * yayinModu: yalnız sahne görünümü (#yayin) · baslat: tohum kalabalığı kurar, oyunBaslat(kayit) çağırır, döngüyü açar
 * window.CanliOyun: dışarıya açık arayüz (olay, baglan, kes, cevir, durum, _test). Testler bunu kullanır.
 * Açılış bütün parçalar çalıştıktan sonra (mikro görevde) yapılır: oyunun üst düzey const'ları kancalarda hazırdır.
 */
const KANCA_DURUM = typeof oyunDurum === 'function' ? oyunDurum : null;
function otoAyarla(v) { oto = v; const b = $('oto'); b.textContent = 'Otomatik izleyici: ' + (v ? 'açık' : 'kapalı'); b.classList.toggle('secili', v); b.setAttribute('aria-pressed', v); }
async function sesDegistir(ac) {
  if (ac) {
    const ok = await muzik.sesAc();
    if (!ok)
      return;
  }
  else
    await muzik.sesKapat();
  $('ses-dugme').textContent = muzik.acik ? 'Sesi kapat' : 'Sesi aç';
  $('ses-dugme').classList.toggle('ana', !muzik.acik);
  $('ses-cagri').hidden = muzik.acik;
}
function boyutla() {
  const yayin = document.body.classList.contains('yayin'), dar = innerWidth <= 820, kok = document.documentElement, s = $('sahne');
  const cs = getComputedStyle(kok), yukH = kok.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let w;
  if (yayin)
    w = Math.min(innerWidth, yukH * 9 / 16);
  else if (dar)
    w = Math.min(innerWidth - 32, yukH * 0.58 * 9 / 16);
  else
    w = Math.min((yukH - 32) * 9 / 16, innerWidth - 32 - 20 - 300);
  w = Math.max(200, Math.floor(w));
  s.style.width = w + 'px';
  s.style.height = Math.round(w * 16 / 9) + 'px';
  const pw = Math.min(yayin ? 1080 : 900, Math.round(w * Math.min(2, devicePixelRatio || 1)));
  if (tuval.width !== pw) {
    tuval.width = pw;
    tuval.height = Math.round(pw * 16 / 9);
  }
}
function yayinModu(v) { document.body.classList.toggle('yayin', v); try {
  if ((location.hash === '#yayin') !== v)
    history.replaceState(null, '', v ? '#yayin' : location.pathname + location.search);
}
catch (e) { } boyutla(); }

// Sayfadaki oyuna özgü her yazı OYUN'dan gelir (hepsi textContent; HTML yazılmaz).
function sayfaYaz() {
  const kok = document.documentElement.style;
  for (const [ad, css] of [['zemin', '--zemin'], ['zemin2', '--zemin-2'], ['zemin3', '--zemin-3'], ['cizgi', '--cizgi'], ['vurgu', '--vurgu'], ['sicak', '--sicak'], ['serin', '--serin'], ['acik', '--acik'], ['soluk', '--soluk'], ['murekkep', '--murekkep']])
    kok.setProperty(css, RENK[ad]);
  const y = OYUN.yazi, logo = $('logo'), lp = [].concat(OYUN.logo || OYUN.ad || '').map(String);
  logo.textContent = '';
  logo.append(lp[0] + (lp.length > 1 ? ' ' : ''));
  if (lp.length > 1) {
    const b = document.createElement('b');
    b.textContent = lp.slice(1).join(' ');
    logo.append(b);
  }
  for (const tur of ['yorum', 'begeni', 'hediye']) {
    const s = $('nasil-' + tur), m = OYUN.nasil[tur];
    if (m)
      s.append(String(m));
    else
      s.hidden = true;
  }
  $('sira-baslik').textContent = y.sira;
  $('gosterge-baslik').textContent = y.gosterge;
  $('ses-cagri').textContent = y.ses;
  tuval.setAttribute('aria-label', y.sahne);
  $('s-yorum-not').textContent = y.giris;
  $('s-takip-not').textContent = y.giris;
  $('bosalt').textContent = y.bosalt;
  // kademe tablosu: küçükten büyüğe
  const tablo = $('kademe-tablo');
  for (const kd of [...KADEME].reverse()) {
    const tr = document.createElement('tr'), a = document.createElement('td'), b = document.createElement('td');
    a.textContent = kd.min + '+ jeton';
    b.textContent = kd.etki || kd.ad;
    tr.append(a, b);
    tablo.append(tr);
  }
}

function baslat(kayit) {
  sayfaYaz();
  // panel düğmeleri
  HAVALAR.forEach((h, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dugme' + (i === 0 ? ' secili' : '');
    b.textContent = h.ad;
    b.id = 'hava-' + h.id;
    b.onclick = () => { muzik.bekleyen = h; muzik.havaSure = 0; };
    $('hava-sec').append(b);
  });
  for (const kd of [...KADEME].reverse()) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dugme';
    b.id = 'h-' + kd.min;
    const g = document.createElement('b');
    g.textContent = kd.min + ' jeton';
    const s = document.createElement('small');
    s.textContent = kd.ad;
    b.append(g, s);
    b.onclick = () => { ilkDokunus(); olay({ tip: 'hediye', kullanici: sahteKim(), jeton: kd.min }); };
    $('hediyeler').append(b);
  }
  HIZLAR.forEach((h, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dugme' + (i === hiz ? ' secili' : '');
    b.textContent = h.ad;
    b.id = 'hiz-' + i;
    b.onclick = () => { hiz = i; for (const x of $('hiz-sec').children)
      x.classList.toggle('secili', x === b); if (!oto)
      otoAyarla(true); };
    $('hiz-sec').append(b);
  });
  let dokunuldu = false;
  const ilkDokunus = () => { if (!dokunuldu) {
    dokunuldu = true;
    if (!muzik.acik)
      sesDegistir(true);
  } };
  $('s-yorum').onclick = () => { ilkDokunus(); olay({ tip: 'yorum', kullanici: sahteKim(), metin: sec(SAHTE_YORUM) }); };
  $('s-begeni').onclick = () => { ilkDokunus(); olay({ tip: 'begeni', kullanici: sahteKim(), adet: 15 }); };
  $('s-takip').onclick = () => { ilkDokunus(); olay({ tip: 'takip', kullanici: sahteKim() }); };
  $('oto').onclick = () => otoAyarla(!oto);
  // Boşalt: önce bütün oyuncular silinir, sonra oyun kendi durumunu sıfırlar (oyunBosalt), sonra sıra yeniden kurulur.
  $('bosalt').onclick = () => { D.oy.clear(); D.cosku = 0; siraImza = '?'; oyunBosalt(); siraGuncelle(); otoAyarla(false); try {
    localStorage.removeItem(SAKLA);
  }
  catch (e) { } };
  const dugmeYaz = (id, on, ad) => { const b = $(id); b.textContent = ad + (on ? 'açık' : 'kapalı'); b.classList.toggle('secili', on); b.setAttribute('aria-pressed', on); };
  $('sirayla').onclick = () => { muzik.sirayla = !muzik.sirayla; dugmeYaz('sirayla', muzik.sirayla, 'Havaları sırayla çal: '); };
  ayarOku();
  dugmeYaz('balon-dugme', ayar.balon, 'Yorum balonları: ');
  $('yasak').value = ayar.yasak.join(', ');
  $('balon-dugme').onclick = () => { ayar.balon = !ayar.balon; dugmeYaz('balon-dugme', ayar.balon, 'Yorum balonları: '); ayarYaz(); };
  $('yasak').oninput = e => { ayar.yasak = e.target.value.split(',').map(x => x.trim().toLocaleLowerCase('tr')).filter(x => x.length > 1).slice(0, 200); ayarYaz(); };
  $('ses-dugme').onclick = () => { dokunuldu = true; sesDegistir(!muzik.acik); };
  $('ses-cagri').onclick = () => { dokunuldu = true; sesDegistir(true); };
  $('ses-duzey').oninput = e => muzik.duzeyAyarla(e.target.value / 100 * 0.7);
  // Hazır parçalar: oyunun yanındaki muzik/liste.js varsa yüklenir ve müzik yalnız o parçalardan çalar;
  // üretilen havaların düğmeleri gizlenir. Klasör yoksa hiçbir şey değişmez, üretilen müzik çalar.
  const kaynakYaz = () => {
    for (const x of $('parca-sec').children)
      x.classList.toggle('secili', muzik.hazirCal && x.id === 'parca-' + muzik.hz.no);
  };
  kare.kaynakYaz = kaynakYaz;
  if (!window.OYUN_MUZIK_KAPALI) {
    const ml = document.createElement('script');
    ml.src = 'muzik/liste.js';
    ml.onload = () => {
      if (!muzik.hazirKur(window.OYUN_MUZIK))
        return;
      muzik.parcalar.forEach((p, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'dugme';
        b.id = 'parca-' + i;
        b.textContent = p.ad;
        b.onclick = async () => { dokunuldu = true; if (!muzik.acik)
          await sesDegistir(true); await muzik.hazirBaslat(i); kaynakYaz(); };
        $('parca-sec').append(b);
      });
      $('hazir-kutu').hidden = false;
      $('hava-sec').hidden = true;
      $('sirayla').parentElement.hidden = true;
      muzik.kaynakSec('hazir').then(kaynakYaz);
    };
    document.head.append(ml);
  }
  $('yayin-gor').onclick = () => yayinModu(true);
  $('cik-yayin').onclick = () => yayinModu(false);
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('yayin'))
    yayinModu(false); });
  addEventListener('hashchange', () => yayinModu(location.hash === '#yayin'));
  $('bag-dugme').onclick = () => { if (Yayin.ws) {
    Yayin.kes();
    bagDurum('', 'Bağlantı kesildi.');
  }
  else
    Yayin.baglan($('bag-adres').value); };
  addEventListener('resize', boyutla);
  if (window.ResizeObserver)
    new ResizeObserver(boyutla).observe(document.documentElement);
  // Başlangıç kalabalığı: sayfa boş açılmasın. Gerçek yayında sahte ad olmaz; saklanan sıra geri gelir.
  const eski = kayit && Array.isArray(kayit.oyuncular) ? kayit.oyuncular : KOPRU ? (siraOku() || []) : null;
  const tohum = eski || (OYUN.tohum || []).map(([ad, jeton]) => ({ id: 'sahte:' + ad, ad, jeton }));
  tohum.forEach((t, i) => { const k = karakterYap(String(t.id), String(t.ad)); k.jeton = +t.jeton || 0; k.katilim = i * 0.001; D.oy.set(k.id, k); });
  siraImza = '?';
  siraGuncelle();
  oyunBaslat(kayit);
  if (kayit && typeof kayit.cosku === 'number')
    D.cosku = kayit.cosku;
  if (kayit && kayit.hava) {
    const h = HAVALAR.find(x => x.id === kayit.hava);
    if (h) {
      muzik.hava = h;
      for (const x of $('hava-sec').children)
        x.classList.toggle('secili', x.id === 'hava-' + h.id);
    }
  }
  document.body.classList.toggle('yayin', location.hash === '#yayin');
  boyutla();
  kamKur();
  if (KOPRU) {
    otoAyarla(false);
    $('bag-adres').value = KOPRU;
    Yayin.surekli = true;
    Yayin.baglan(KOPRU);
    Yayin.surekli = true;
    $('panel-not').textContent = 'Bu sayfayı köprü programı açtı. Yorum ve hediyeler gerçek yayından gelir. Aşağıdaki sahte izleyici düğmeleri yalnızca deneme içindir; yayın sırasında basma.';
    setInterval(siraSakla, 5000);
  }
  if (KOPRU || location.hash === '#yayin')
    muzik.sesAc(true).then(ok => { if (ok)
      sesDegistir(true); });
  requestAnimationFrame(t => { sonKare = t; kare(t); });
}

// Dışarıya açık küçük arayüz: köprü yazanlar ve denemeler için.
window.CanliOyun = {
  olay, baglan: a => Yayin.baglan(a), kes: () => Yayin.kes(), cevir: m => Yayin.cevir(m),
  durum: () => {
    const d = { oyun: OYUN.id, kisi: D.sira.length, lider: D.lider && D.lider.ad, cosku: D.cosku, begeni: D.begeni, vurus: B, sira: D.sira.map(k => [k.ad, k.jeton]), kareMs: D.kareMs, parca: parca.length, bagli: !!(Yayin.ws && Yayin.ws.readyState === 1), alinan: Yayin.alinan, hava: muzik.hava.id, ses: muzik.acik };
    if (KANCA_DURUM)
      KANCA_DURUM(d);
    return d;
  },
  _test: { D, muzik, Muzik, HAVALAR, ayar, OYUN, KADEME, zamanEkle: sn => { zaman += sn; }, zaman: () => zaman },
  async _sesTesti(sn, i) {
    const oc = new OfflineAudioContext(2, 44100 * sn, 44100), m = new Muzik();
    m.hava = HAVALAR[i || 0];
    m.sesKur(oc);
    m.acik = true;
    m.sonraki = 0.05;
    while (m.sonraki < sn)
      m.adimCal();
    const buf = await oc.startRendering(), d = buf.getChannelData(0);
    let tepe = 0, kare2 = 0, gecis = 0;
    const dilim = [];
    for (let i2 = 0; i2 < d.length; i2++) {
      const v = d[i2];
      if (Math.abs(v) > tepe)
        tepe = Math.abs(v);
      kare2 += v * v;
      if (i2 && (v > 0) !== (d[i2 - 1] > 0))
        gecis++;
      if (i2 % 44100 === 44099) {
        let q = 0;
        for (let w = i2 - 44099; w <= i2; w++)
          q += d[w] * d[w];
        dilim.push(+Math.sqrt(q / 44100).toFixed(3));
      }
    }
    return { tepe: +tepe.toFixed(3), rms: +Math.sqrt(kare2 / d.length).toFixed(3), sifirGecis: Math.round(gecis / sn), dilim, adimlar: m.iz.length };
  }
};
window.claude?.hot?.snapshot?.(() => ({ oyuncular: D.sira.map(k => ({ id: k.id, ad: k.ad, jeton: k.jeton })), cosku: D.cosku, hava: muzik.hava.id }));
queueMicrotask(() => {
  if (window.claude?.hot?.ready)
    window.claude.hot.ready(baslat);
  else
    baslat(window.claude?.hot?.data ?? {});
});
