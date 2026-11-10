#!/usr/bin/env python3
"""Hazır müzik parçalarını BİR oyuna tanıtır: vuruşlarını ölçer, o oyunun muzik/ klasörüne kopyalar, liste.js yazar.

Her oyun kendi müziğini üretir (OYUN.muzik, docs/MUZIK.md); bu betik isteğe bağlıdır. Kendi parçalarını (kendi
bestelediğin ya da kullanma hakkın olan kayıtlar) bir oyunda çalmak istersen bir kez çalıştırırsın, oynayanlar o
parçanın vuruşuna göre hareket eder. Parçalar yalnız o oyunun klasörüne gider: oyunlar/<ad>/muzik/. Bütün oyunların
ortak kullandığı bir müzik klasörü yoktur; aynı parçayı iki oyunda istiyorsan betiği iki oyun için ayrı çalıştır.

Kullanım:
    python araclar/muzik-hazirla.py "parçaların durduğu klasör" <oyun adı>
    python araclar/muzik-hazirla.py "C:/Users/ben/Muzik/konvoy" konvoy

Gerekenler: Python 3.9+, `pip install librosa` (mp3 okumak için ffmpeg kurulu olmalı).
oyunlar/<ad>/muzik/ depoya girmez (.gitignore); parçaların hakları sende kalır.
"""
import json
import os
import re
import shutil
import sys

DEPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def oyun_klasoru(ad):
    """Oyun adını (eski kullanım 'oyunlar/<ad>' de olur) depodaki oyunlar/<ad> klasörüne çevirir; yoksa durur."""
    ad = ad.replace('\\', '/').rstrip('/')
    if ad.startswith('oyunlar/'):
        ad = ad[len('oyunlar/'):]
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', ad):
        sys.exit('Oyun adı yalnız küçük harf, rakam ve tire olabilir (örn. konvoy): "%s"' % ad)
    kl = os.path.join(DEPO, 'oyunlar', ad)
    if not os.path.isfile(os.path.join(kl, 'js', '00-ayar.js')):
        var = sorted(a for a in os.listdir(os.path.join(DEPO, 'oyunlar')) if os.path.isfile(os.path.join(DEPO, 'oyunlar', a, 'js', '00-ayar.js')))
        sys.exit('"%s" adında oyun yok. Oyunlar: %s' % (ad, ', '.join(var)))
    return kl


KOK = oyun_klasoru(sys.argv[2]) if len(sys.argv) > 2 else None  # oyun klasörü: oyunlar/<ad>
HEDEF = os.path.join(KOK, 'muzik') if KOK else None
import librosa  # noqa: E402  (ad denetimi kütüphane yüklenmeden yapılsın)
import numpy as np  # noqa: E402
HARF = str.maketrans('çğıöşüÇĞİÖŞÜâîûÂÎÛ', 'cgiosuCGIOSUaiuAIU')


def dosya_adi(ad):
    """Türkçe harfsiz, boşluksuz dosya adı: 'Düğün Halayı' -> 'dugun-halayi'."""
    return re.sub(r'[^a-z0-9]+', '-', ad.translate(HARF).lower()).strip('-') or 'parca'


def olc(yol):
    y, sr = librosa.load(yol, sr=22050, mono=True)
    hop = 256
    genel = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    _, vurus = librosa.beat.beat_track(onset_envelope=genel, sr=sr, hop_length=hop, units='time', tightness=200)
    vurus = np.asarray(vurus, dtype=float)
    if len(vurus) < 16:
        raise ValueError('vuruş bulunamadı')
    # bas davul: 40-160 Hz bandındaki ani artışlar. Güçlü vuruşu ve ölçü başını bununla seçeriz.
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
    f = librosa.fft_frequencies(sr=sr, n_fft=2048)
    bas = np.maximum(0, np.diff(np.log1p(S[(f >= 40) & (f <= 160)].sum(axis=0)), prepend=0))

    def guc(zamanlar):
        kare = librosa.time_to_frames(zamanlar, sr=sr, hop_length=hop)
        return np.array([bas[max(0, a - 3):a + 4].max() for a in kare])

    bpm = 60 / np.polyfit(np.arange(len(vurus)), vurus, 1)[0]
    # Adım atılan nabız 75-150 arasında olsun: daha hızlıysa iki vuruşta bir, daha yavaşsa araya da bas.
    while bpm > 150:
        g = guc(vurus)
        vurus = vurus[0::2] if g[0::2].mean() >= g[1::2].mean() else vurus[1::2]
        bpm /= 2
    while bpm < 75:
        ara = (vurus[:-1] + vurus[1:]) / 2
        vurus = np.sort(np.concatenate([vurus, ara]))
        bpm *= 2
    # İzleyicinin tek tek vuruşlardaki titremesini yumuşat (tempo kaymasını korur).
    v = vurus.copy()
    v[1:-1] = 0.5 * vurus[1:-1] + 0.25 * (vurus[:-2] + vurus[2:])
    # Ölçü başı: dört vuruşluk dizilimde basın en güçlü düştüğü yer. Halay adımı oradan başlar.
    g = guc(v)
    kayma = int(np.argmax([g[k::4].mean() for k in range(4)]))
    return {'bpm': round(float(bpm), 2), 'kayma': kayma, 'vurus': [round(float(t), 3) for t in v], 'sure': round(len(y) / sr, 1)}


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    kaynak = sys.argv[1]
    os.makedirs(HEDEF, exist_ok=True)
    liste = []
    for ad in sorted(os.listdir(kaynak)):
        govde, uzanti = os.path.splitext(ad)
        if uzanti.lower() not in ('.mp3', '.ogg', '.wav', '.m4a'):
            continue
        try:
            o = olc(os.path.join(kaynak, ad))
        except Exception as hata:  # tek bozuk dosya diğerlerini durdurmasın
            print('ATLANDI', ad, '-', hata)
            continue
        yeni = dosya_adi(govde) + uzanti.lower()
        shutil.copyfile(os.path.join(kaynak, ad), os.path.join(HEDEF, yeni))
        liste.append({'ad': govde, 'dosya': yeni, 'bpm': o['bpm'], 'kayma': o['kayma'], 'vurus': o['vurus']})
        print('%-28s -> muzik/%-24s %6.1f vuruş/dk, %d vuruş, %.0f sn, ölçü başı %d' % (ad, yeni, o['bpm'], len(o['vurus']), o['sure'], o['kayma']))
    with open(os.path.join(HEDEF, 'liste.js'), 'w', encoding='utf-8', newline='\n') as d:
        d.write('// araclar/muzik-hazirla.py üretir; elle düzenleme. vurus: adım atılan vuruşların saniyeleri.\n')
        d.write('window.OYUN_MUZIK = ' + json.dumps(liste, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(len(liste), 'parça hazır:', os.path.relpath(os.path.join(HEDEF, 'liste.js'), DEPO).replace(os.sep, '/'), '(yalnız bu oyunda çalar)')


if __name__ == '__main__':
    main()
