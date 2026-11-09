/* SAHNE ÜSTÜ YAZILAR — sıra kutusu, bildirimler, pankart, paneldeki olay günlüğü.
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
    li.textContent = 'Meydan boş. İlk yazan mendili alır.';
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
const gunlukBekleyen = [];
function gunluk(tur, ad, metin, hediye) { gunlukBekleyen.push([tur, ad, metin, hediye]); if (gunlukBekleyen.length > 40)
  gunlukBekleyen.shift(); }
function gunlukYaz() {
  if (!gunlukBekleyen.length)
    return;
  const ul = $('gunluk');
  for (const [tur, ad, metin, hediye] of gunlukBekleyen) {
    const li = document.createElement('li'), t = document.createElement('span');
    t.className = 'tur' + (hediye ? ' h' : '');
    t.textContent = tur;
    li.append(t, ad + (metin ? ': ' + kisalt(String(metin), 80) : ''));
    ul.append(li);
  }
  gunlukBekleyen.length = 0;
  while (ul.children.length > 40)
    ul.firstChild.remove();
  ul.scrollTop = ul.scrollHeight;
}
