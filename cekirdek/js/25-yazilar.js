/* SAHNE ÜSTÜ YAZILAR — sıra kutusu, bildirimler, pankart, paneldeki olay günlüğü.
 * bildir(ad, orta, vurgu): sağdaki bildirim satırı · pankart(satir1, satir2): ortadan geçen büyük duyuru
 * gunluk(tur, ad, metin): paneldeki olay günlüğü. Boş sıranın yazısı OYUN.yazi.bos'tan gelir.
 * Hepsi textContent ile yazılır. Sıra kutusu ve günlük olay anında değil karede bir kez güncellenir
 * (yüzlerce olay aynı anda gelse de sayfa takılmasın diye).
 */
/* ---- sahne üstü yazılar ---- */
let siraImza = '';
function siraYaz() {
  const ilk = D.sira.slice(0, 5), imza = ilk.map(k => k.id + ':' + k.jeton + ':' + k.ad).join('|');
  if (imza === siraImza)
    return;
  siraImza = imza;
  const ol = $('sira-liste');
  ol.textContent = '';
  if (!ilk.length) {
    const li = document.createElement('li');
    li.className = 'bos';
    li.textContent = OYUN.yazi.bos;
    ol.append(li);
    return;
  }
  ilk.forEach((k, i) => {
    const li = document.createElement('li');
    if (i === 0)
      li.className = 'bas';
    const no = document.createElement('span');
    no.className = 'no';
    no.textContent = i + 1;
    const ad = document.createElement('span');
    ad.className = 'ad';
    ad.textContent = k.ad;
    const jt = document.createElement('span');
    jt.className = 'jt';
    jt.textContent = k.jeton;
    li.append(no, ad, jt);
    ol.append(li);
  });
}
let bildirimSon = 0;
function bildir(ad, orta, vurgu) {
  const kutu = $('bildirim');
  if (zaman - bildirimSon < 0.12 && kutu.lastChild)
    kutu.lastChild.remove();
  bildirimSon = zaman; // aynı anda yağan hediyeler tek satırda yenilenir
  const d = document.createElement('div'), b = document.createElement('b');
  d.append(ad + ' · ' + orta);
  if (vurgu) {
    b.textContent = ' ' + vurgu;
    d.append(b);
  }
  kutu.append(d);
  while (kutu.children.length > 3)
    kutu.firstChild.remove();
  setTimeout(() => { d.classList.add('git'); setTimeout(() => d.remove(), 320); }, 2800);
}
function pankart(b1, b2) {
  const yer = $('pankart-yeri');
  yer.textContent = '';
  const p = document.createElement('div');
  p.className = 'pankart';
  const a = document.createElement('div');
  a.className = 'b1';
  a.textContent = b1;
  const b = document.createElement('div');
  b.className = 'b2';
  b.textContent = b2;
  p.append(a, b);
  yer.append(p);
  setTimeout(() => p.remove(), 3500);
}
/* ---- paneldeki olay akışı ----
 * En yenisi üstte, en çok 40 satır. Fare ya da klavye odağı akıştayken (gunlukDur) satırlar kaymaz: yeni olaylar
 * bekler, yayıncı tıklamak istediği satırı kaçırmaz. id verilen satırda "Gizle" ve "Çıkar" düğmeleri olur
 * (60-panel.js bunları dinler). hediye ve id isteğe bağlıdır; oyun gunluk(tur, ad, metin) diye de çağırabilir.
 */
const gunlukBekleyen = [];
let gunlukDur = false, gunlukYeni = 0;
const GUNLUK_TIP = { yorum: 'y', 'beğeni': 'b', takip: 't', hediye: 'h', 'paylaşım': 'p', geldi: 'g', gizlendi: 'm', 'çıkarıldı': 'm', 'geri alındı': 'm' };
function gunluk(tur, ad, metin, hediye, id) { gunlukBekleyen.push([tur, ad, metin, hediye, id, Date.now()]); gunlukYeni++; if (gunlukBekleyen.length > 40)
  gunlukBekleyen.shift(); }
const ikiHane = n => (n < 10 ? '0' : '') + n;
function gunlukSatir(tur, ad, metin, hediye, id, t) {
  const li = document.createElement('li'), zm = document.createElement('span'), tp = document.createElement('span'), ic = document.createElement('span'), a = document.createElement('span');
  const s = new Date(t);
  li.className = 't-' + (GUNLUK_TIP[tur] || (hediye ? 'h' : 'o'));
  zm.className = 'zm';
  zm.textContent = ikiHane(s.getHours()) + ':' + ikiHane(s.getMinutes()) + ':' + ikiHane(s.getSeconds());
  tp.className = 'tur';
  tp.textContent = tur;
  ic.className = 'icerik';
  a.className = 'ad';
  a.textContent = String(ad);
  ic.append(a);
  if (metin) {
    const m = document.createElement('span');
    m.className = 'metin';
    m.textContent = kisalt(String(metin), 80);
    ic.append(m);
  }
  li.append(zm, tp, ic);
  if (id) {
    li.dataset.id = id;
    li.classList.toggle('gizli', modKume.gizli.has(id));
    li.classList.toggle('cikan', modKume.cikan.has(id));
    const e = document.createElement('span');
    e.className = 'eylem';
    for (const [sinif, yazi, etiket] of [['g-gizle', 'Gizle', 'Adını gizle: '], ['g-cikar tehlike', 'Çıkar', 'Sahneden çıkar: ']]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mini ' + sinif;
      b.textContent = yazi;
      b.setAttribute('aria-label', etiket + ad);
      e.append(b);
    }
    li.append(e);
  }
  return li;
}
function gunlukYaz() {
  const dur = $('akis-dur');
  if (gunlukDur) {
    if (gunlukYeni) {
      dur.hidden = false;
      dur.textContent = 'Durdu · ' + (gunlukYeni > 40 ? '40+' : gunlukYeni) + ' yeni';
    }
    return;
  }
  if (!dur.hidden)
    dur.hidden = true;
  gunlukYeni = 0;
  if (!gunlukBekleyen.length)
    return;
  const ul = $('gunluk'), parca = document.createDocumentFragment();
  for (const g of gunlukBekleyen)
    parca.prepend(gunlukSatir(...g));
  ul.prepend(parca);
  gunlukBekleyen.length = 0;
  while (ul.children.length > 40)
    ul.lastChild.remove();
  ul.scrollTop = 0;
}
