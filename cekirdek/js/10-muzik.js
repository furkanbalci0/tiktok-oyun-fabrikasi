/* MÜZİK — davul ve zurna burada sentezlenir; ses dosyası yoktur.
 * HAVALAR: ezgiler (nota yazımı docs/MUZIK.md'de) · Muzik: zamanlayıcı + ses zinciri · muzik: tek örnek
 * Önemli: oyunun bütün hareketi "vuruş" saatine (B) bağlıdır ve o saat buradan gelir: muzik.beatAt().
 * Ses kapalıyken de saat işler (performance.now ile); ses açılınca AudioContext saatine geçilir (tabanDegistir).
 */
// Nota yazımı: "derece:süre". Derece dizinin kaçıncı sesi (0 = karar), süre adım sayısı.
// ' = üstten çarpma, ~ = tril, - = sus.
const HAVALAR = [
  { id: 'harman', ad: 'Harman Yeri', bpm: 104, spb: 4, bar: 16, tonik: 415.3,
    dizi: [0, 150, 300, 500, 700, 880, 1000],
    davul: { ana: 'D..kT.k.D.D.T.k.', cesni: 'D..kT.kkD.DkT.T.', gecis: 'D.TkD.TkDkTkTTTT' },
    bolum: {
      A: "4:4 4:2 5':2 4:2 3:2 4:4 | 3:2 4:2 3:2 2:2 3:4 2:4 | 2:2 3:2 4':2 3:2 2:2 1:2 2:4 | 1:2 2:2 1:2 0:2 0~:8",
      B: "4:2 5:2 6:2 7:2 7:4 6:2 7':2 | 8:4 7:2 6:2 7:2 6:2 5:4 | 6':2 5:2 4:2 5:2 4:2 3:2 4:4 | 3:2 2:2 1:2 2:2 0~:8",
      D: "-:16 -:16"
    }, form: 'AABBD' },
  { id: 'toz', ad: 'Toz Duman', bpm: 132, spb: 4, bar: 8, tonik: 392,
    dizi: [0, 120, 390, 500, 700, 800, 1000],
    davul: { ana: 'D.kkT.k.', cesni: 'D.kTT.kk', gecis: 'DkTkTTTT' },
    bolum: {
      A: "4:2 4:1 5:1 4:2 3:2 | 2:2 3:2 4:4 | 4:2 4:1 5:1 4:2 3:2 | 2:2 1:2 0:4 | 0:1 1:1 2:1 3:1 4:2 4:2 | 5':2 4:2 3:2 2:2 | 3:1 2:1 1:2 2:1 1:1 0:2 | 0~:4 0:2 -:2",
      B: "7:2 7:2 6:1 7:1 6:2 | 5:2 6:2 5:4 | 6':2 5:1 6:1 5:2 4:2 | 5:2 4:2 4:4 | 4:1 5:1 6:1 5:1 4:1 3:1 2:2 | 3:2 2:2 1:2 2:2 | 3:1 2:1 1:1 0:1 1:2 0:2 | 0~:6 -:2",
      D: "-:8 -:8 -:8 -:8"
    }, form: 'AABBD' },
  { id: 'cifte', ad: 'Çifte Mendil', bpm: 84, spb: 3, bar: 6, tonik: 404,
    dizi: [0, 140, 300, 500, 700, 800, 1000],
    davul: { ana: 'D.kT.k', cesni: 'D.kTkk', gecis: 'DkkTTT' },
    bolum: {
      A: "4:2 4:1 5':2 4:1 | 3:2 2:1 3:3 | 4:2 3:1 2:2 1:1 | 2:3 2:3 | 3:2 3:1 4':2 3:1 | 2:2 1:1 2:3 | 3:1 2:1 1:1 2:1 1:1 0:1 | 0~:6",
      B: "7:3 6:2 7':1 | 6:2 5:1 6:3 | 5:2 6:1 5:2 4:1 | 5:3 4:3 | 4:1 5:1 6:1 5:1 4:1 3:1 | 4':2 3:1 2:3 | 3:1 2:1 1:1 2:1 1:1 0:1 | 0~:6",
      D: "-:6 -:6 -:6 -:6"
    }, form: 'AABBD' }
];
for (const h of HAVALAR) {
  const coz = yazi => {
    const notalar = [];
    let toplam = 0;
    for (const p of yazi.split(/\s+/)) {
      if (!p || p === '|')
        continue;
      const [sol, sure] = p.split(':');
      const len = +sure;
      const n = { len, sus: sol === '-', carpma: sol.includes("'"), tril: sol.includes('~'), deg: parseInt(sol, 10) || 0 };
      notalar.push(n);
      toplam += len;
    }
    return { notalar, toplam };
  };
  h.harita = [];
  h.bolumBas = [];
  for (const ad of h.form) {
    const b = coz(h.bolum[ad]);
    if (b.toplam % h.bar)
      console.warn('Bölüm ölçüye oturmuyor:', h.id, ad, b.toplam);
    h.bolumBas.push({ bas: h.harita.length, uz: b.toplam, ad });
    let i = h.harita.length;
    h.harita.length += b.toplam;
    for (const n of b.notalar) {
      h.harita[i] = n;
      i += n.len;
    }
  }
  h.formAdim = h.harita.length;
  h.sent = d => { const o = Math.floor(d / 7), i = ((d % 7) + 7) % 7; return h.dizi[i] + 1200 * o; };
}

class Muzik {
  constructor() {
    this.hava = HAVALAR[0];
    this.bekleyen = null;
    this.adim = 0;
    this.beat = 0;
    this.sonraki = null;
    this.iz = [];
    this.olaylar = [];
    this.carpan = 1;
    this.sov = false;
    this.cosku = 0;
    this.ctx = null;
    this.acik = false;
    this.duzey = 0.6;
    this.sirayla = true;
    this.havaSure = 0;
    this.enVurus = 0;
    // hazır parçalar (isteğe bağlı): muzik/liste.js varsa dolar
    this.parcalar = [];
    this.muzikKok = 'muzik/';
    this.kaynak = 'sentez';
    this.hazirCal = false;
    this.hazirSira = 0;
    this.hz = null;
    this.calar = null;
  }
  simdi() { return this.acik ? this.ctx.currentTime : performance.now() / 1000; }
  beatAt(t) {
    let v;
    if (this.hazirCal)
      v = this.hazirVurus();
    else {
      const iz = this.iz;
      if (!iz.length)
        return this.beat;
      let e = iz[0];
      for (let i = iz.length - 1; i >= 0; i--)
        if (iz[i].t <= t) {
          e = iz[i];
          break;
        }
      v = e.beat + (t - e.t) / e.bd;
    }
    if (!(v >= this.enVurus))
      return this.enVurus;
    this.enVurus = v;
    return v; // saat asla geri gitmez
  }
  planla(ufuk) {
    if (this.hazirCal) {
      this.hazirPlanla();
      return;
    }
    const t = this.simdi();
    if (this.sonraki === null)
      this.sonraki = t + 0.05;
    else if (this.sonraki < t - 0.4)
      this.atla(t + 0.05);
    let guard = 0;
    while (this.sonraki < t + ufuk && guard++ < 400)
      this.adimCal();
    while (this.iz.length > 2 && this.iz[1].t < t - 0.5)
      this.iz.shift();
  }
  // Ana iş parçacığı uzun süre kilitlenince (olay seli, ağır bir kare) zamanı geçmiş adımlar çalınmaz, ama
  // vuruş sayacı o adımlar kadar ileri alınır. Eskiden yalnız "sonraki" şimdiye çekiliyordu: sayaç geride kaldığı
  // için yeni adımların vuruşu, saatin o ana dek (son kayıttan ileri yürüterek) gösterdiği vuruştan küçük kalıyor,
  // B kilit süresi kadar donuyordu (beatAt geri gitmez, bekler).
  atla(hedef) {
    const h = this.hava, dur = 60 / (h.bpm * this.carpan) / h.spb, n = Math.ceil((hedef - this.sonraki) / dur);
    if (!(n > 0))
      return;
    this.sonraki += n * dur;
    this.beat += n / h.spb;
    this.havaSure += n * dur;
    this.adim = (this.adim + n) % h.formAdim;
  }
  adimCal() {
    let h = this.hava;
    if (this.sirayla && !this.bekleyen && this.adim === 0 && this.havaSure > 100)
      this.bekleyen = HAVALAR[(HAVALAR.indexOf(h) + 1) % HAVALAR.length];
    if (this.bekleyen && this.adim % h.bar === 0) {
      h = this.hava = this.bekleyen;
      this.bekleyen = null;
      this.adim = 0;
      this.havaSure = 0;
      if (this.ses)
        for (const z of [this.ses.zurna, this.ses.dem]) {
          z.o1.frequency.setValueAtTime(h.tonik, this.sonraki);
          z.o2.frequency.setValueAtTime(h.tonik, this.sonraki);
        }
    }
    const t = this.sonraki, dur = 60 / (h.bpm * this.carpan) / h.spb;
    this.iz.push({ t, beat: this.beat, bd: dur * h.spb, adim: this.adim });
    // davul
    const s = this.adim % h.bar, olcu = Math.floor(this.adim / h.bar);
    const bol = h.bolumBas.find(b => this.adim >= b.bas && this.adim < b.bas + b.uz);
    const sonOlcu = bol && this.adim >= bol.bas + bol.uz - h.bar;
    const solo = bol && bol.ad === 'D'; // zurna susar, davul tek başına çalar
    let ch = (solo ? (olcu % 2 ? h.davul.gecis : h.davul.cesni) : sonOlcu ? h.davul.gecis : (olcu % 2 ? h.davul.cesni : h.davul.ana))[s];
    if (ch === '.' && (solo || this.sov || (this.cosku > 0.6 && s % 2 === 0)))
      ch = 'k';
    if (ch === 'D') {
      this.dum(t, s === 0 ? 1 : 0.8);
      this.olaylar.push({ t, tip: 'dum' });
    }
    else if (ch === 'T') {
      this.tek(t, 0.8);
      this.olaylar.push({ t, tip: 'tek' });
    }
    else if (ch === 'k') {
      this.tek(t, this.sov ? 0.45 : 0.3);
      this.olaylar.push({ t, tip: 'tek' });
    }
    // zurna
    const n = h.harita[this.adim];
    if (n) {
      this.nota(n, t, dur);
      if (!n.sus)
        this.olaylar.push({ t, tip: 'nota', deg: n.deg });
    }
    this.adim = (this.adim + 1) % h.formAdim;
    this.beat += 1 / h.spb;
    this.sonraki += dur;
    this.havaSure += dur;
  }
  sesKur(ctx) {
    this.ctx = ctx;
    const ana = ctx.createGain();
    ana.gain.value = 0.7;
    const sik = ctx.createDynamicsCompressor();
    sik.threshold.value = -14;
    sik.ratio.value = 5;
    sik.attack.value = 0.004;
    sik.release.value = 0.16;
    const son = ctx.createGain();
    son.gain.value = this.duzey; /* düzey sıkıştırıcıdan sonra ayarlanır */
    ana.connect(sik);
    sik.connect(son);
    son.connect(ctx.destination);
    // açık hava yankısı: sönümlenen gürültüden üretilmiş kısa bir tepki
    const yanki = ctx.createConvolver(), uz = Math.floor(ctx.sampleRate * 1.1), tb = ctx.createBuffer(2, uz, ctx.sampleRate), r = rastgeleUret(7);
    for (let k = 0; k < 2; k++) {
      const d = tb.getChannelData(k);
      for (let i = 0; i < uz; i++)
        d[i] = (r() * 2 - 1) * Math.pow(1 - i / uz, 3.2);
    }
    yanki.buffer = tb;
    const yg = ctx.createGain();
    yg.gain.value = 0.16;
    yanki.connect(yg);
    yg.connect(ana);
    const davul = ctx.createGain();
    davul.gain.value = 1.75;
    davul.connect(ana);
    davul.connect(yanki);
    const zb = ctx.createGain();
    zb.gain.value = 1;
    zb.connect(ana);
    zb.connect(yanki);
    const gb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), gd = gb.getChannelData(0);
    for (let i = 0; i < gd.length; i++)
      gd[i] = r() * 2 - 1;
    const zurnaKur = (seviye, parlak) => {
      const perde = ctx.createConstantSource();
      perde.offset.value = 0;
      perde.start();
      const o1 = ctx.createOscillator();
      o1.type = 'sawtooth';
      o1.frequency.value = this.hava.tonik;
      const o2 = ctx.createOscillator();
      o2.type = 'square';
      o2.frequency.value = this.hava.tonik;
      o2.detune.value = 6;
      const g1 = ctx.createGain();
      g1.gain.value = 0.6;
      const g2 = ctx.createGain();
      g2.gain.value = 0.22;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 5.7;
      const vib = ctx.createGain();
      vib.gain.value = 4;
      lfo.connect(vib);
      for (const o of [o1, o2]) {
        perde.connect(o.detune);
        vib.connect(o.detune);
      }
      const sek = ctx.createWaveShaper(), egri = new Float32Array(1024);
      for (let i = 0; i < 1024; i++)
        egri[i] = Math.tanh((i / 511.5 - 1) * 2.4);
      sek.curve = egri;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 540;
      const f1 = ctx.createBiquadFilter();
      f1.type = 'peaking';
      f1.frequency.value = 1350;
      f1.Q.value = 2.0;
      f1.gain.value = 12;
      const f2 = ctx.createBiquadFilter();
      f2.type = 'peaking';
      f2.frequency.value = 2750;
      f2.Q.value = 2.4;
      f2.gain.value = 11;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = parlak;
      const amp = ctx.createGain();
      amp.gain.value = 0;
      const cik = ctx.createGain();
      cik.gain.value = seviye;
      o1.connect(g1);
      g1.connect(sek);
      o2.connect(g2);
      g2.connect(sek);
      sek.connect(hp);
      hp.connect(f1);
      f1.connect(f2);
      f2.connect(lp);
      lp.connect(amp);
      amp.connect(cik);
      cik.connect(zb);
      o1.start();
      o2.start();
      lfo.start();
      return { perde: perde.offset, amp: amp.gain, vib: vib.gain, o1, o2, cik: cik.gain };
    };
    this.ses = { ana, son, davul, yanki: yg.gain, gurultu: gb, zurna: zurnaKur(0.23, 6800), dem: zurnaKur(0.055, 3000) };
  }
  dum(t, v) {
    if (!this.acik)
      return;
    const c = this.ctx, s = this.ses;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(52, t + 0.13);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.44);
    o.connect(g);
    g.connect(s.davul);
    o.start(t);
    o.stop(t + 0.46);
    this.fis(t, 0.035, 'lowpass', 900, 0.5 * v);
  }
  tek(t, v) {
    if (!this.acik)
      return;
    const c = this.ctx, s = this.ses;
    this.fis(t, 0.055, 'bandpass', 3300, 0.55 * v);
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(640, t);
    o.frequency.exponentialRampToValueAtTime(380, t + 0.04);
    g.gain.setValueAtTime(0.3 * v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g);
    g.connect(s.davul);
    o.start(t);
    o.stop(t + 0.07);
  }
  fis(t, sure, tur, frek, v) {
    const c = this.ctx, s = this.ses, k = c.createBufferSource();
    k.buffer = s.gurultu;
    const f = c.createBiquadFilter();
    f.type = tur;
    f.frequency.value = frek;
    f.Q.value = 0.9;
    const g = c.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    k.connect(f);
    f.connect(g);
    g.connect(s.davul);
    k.start(t, (t * 7.13) % 0.9, sure + 0.02);
  }
  nota(n, t, dur) {
    if (!this.acik)
      return;
    const z = this.ses.zurna, h = this.hava, uz = n.len * dur;
    this.ses.dem.amp.setTargetAtTime(n.sus && n.len >= h.bar ? 0 : 1, t, n.sus ? 0.06 : 0.25);
    if (n.sus) {
      z.amp.setTargetAtTime(0, t, 0.015);
      return;
    }
    const c = h.sent(n.deg), ust = h.sent(n.deg + 1);
    z.amp.setTargetAtTime(0.3, Math.max(0, t - 0.008), 0.004);
    z.amp.setTargetAtTime(1, t + 0.004, 0.012);
    if (n.carpma) {
      z.perde.setValueAtTime(ust, t);
      z.perde.setTargetAtTime(c, t + 0.034, 0.006);
    }
    else
      z.perde.setTargetAtTime(c, t, 0.007);
    if (n.tril) {
      const ad = Math.min(0.085, dur * 0.5), kac = Math.floor(uz * 0.55 / ad);
      for (let i = 1; i <= kac; i++)
        z.perde.setTargetAtTime(i % 2 ? ust : c, t + i * ad, 0.008);
    }
    z.vib.setTargetAtTime(3, t, 0.02);
    if (uz > 0.28)
      z.vib.setTargetAtTime(20, t + 0.12, 0.09);
  }
  zil(guc) {
    if (!this.acik)
      return;
    const c = this.ctx, t = c.currentTime + 0.01;
    for (const [f, v] of [[1760, 0.12], [2637, 0.07], [3520, 0.04 * guc]]) {
      const o = c.createOscillator(), g = c.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5 + 0.3 * guc);
      o.connect(g);
      g.connect(this.ses.ana);
      o.start(t);
      o.stop(t + 1);
    }
  }
  tabanDegistir(ac) {
    const eski = this.simdi(), b = this.beatAt(eski), ileri = this.iz.find(e => e.t > eski), sonBd = this.iz.length ? this.iz[this.iz.length - 1].bd : 0.5;
    this.acik = ac;
    const yeni = this.simdi();
    let bd = sonBd;
    if (ileri) {
      this.adim = ileri.adim;
      this.beat = ileri.beat;
      this.sonraki = yeni + Math.max(0.04, ileri.t - eski);
      if (ileri.beat > b + 1e-6)
        bd = (this.sonraki - yeni) / (ileri.beat - b);
    }
    else
      this.sonraki = yeni + 0.05;
    this.iz = [{ t: yeni, beat: b, bd, adim: -1 }];
    this.olaylar.length = 0; // köprü dilimi: yeni saatte ilk adıma tam vuruşunda varır
  }
  async sesAc(beklemeden) {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC)
        return false;
      this.sesKur(new AC());
    }
    const p = this.ctx.resume();
    if (beklemeden) {
      await Promise.race([p, new Promise(r => setTimeout(r, 500))]);
      if (this.ctx.state !== 'running')
        return false;
    }
    else
      await p;
    if (!this.acik)
      this.tabanDegistir(true);
    this.ses.son.gain.setTargetAtTime(this.duzey, this.ctx.currentTime, 0.05);
    if (this.kaynak === 'hazir' && !this.hazirCal)
      this.hazirBaslat(this.hz ? this.hz.no : 0);
    return true;
  }
  async sesKapat() {
    if (!this.acik)
      return;
    this.sentezeDon();
    this.ses.zurna.amp.setTargetAtTime(0, this.ctx.currentTime, 0.02);
    this.ses.dem.amp.setTargetAtTime(0, this.ctx.currentTime, 0.02);
    this.tabanDegistir(false);
    await this.ctx.suspend();
  }
  duzeyAyarla(v) {
    this.duzey = v;
    if (this.calar)
      this.calar.volume = clamp(v / 0.7, 0, 1);
    if (this.acik)
      this.ses.son.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  /* ---- hazır parçalar ----
   * muzik/ klasöründeki kayıtlar bir ses öğesiyle çalınır; vuruş saati o kaydın önceden ölçülmüş vuruşlarından
   * gelir (araclar/muzik-hazirla.py). Ses kapalıyken ya da parça açılamazsa üretilen davul zurna sürer.
   */
  hazirKur(liste) {
    this.parcalar = (Array.isArray(liste) ? liste : [])
      .filter(p => p && typeof p.dosya === 'string' && /^[\w.-]+$/.test(p.dosya) && Array.isArray(p.vurus) && p.vurus.length > 8 && p.vurus.every(Number.isFinite))
      .slice(0, 12)
      .map(p => ({ ad: kisalt(temiz(p.ad || p.dosya), 28), dosya: p.dosya, bpm: clamp(+p.bpm || 100, 40, 240), kayma: (p.kayma | 0) & 3, vurus: p.vurus }));
    return this.parcalar.length;
  }
  async kaynakSec(k) {
    this.kaynak = k === 'hazir' && this.parcalar.length ? 'hazir' : 'sentez';
    if (this.kaynak === 'sentez')
      this.sentezeDon();
    else if (this.acik && !this.hazirCal)
      return this.hazirBaslat(this.hz ? this.hz.no : 0);
    return true;
  }
  async hazirBaslat(no) {
    const n = this.parcalar.length;
    if (!n)
      return false;
    no = ((no % n) + n) % n;
    const p = this.parcalar[no], sira = ++this.hazirSira;
    if (!this.calar) {
      const a = this.calar = new Audio();
      a.preload = 'auto';
      a.preservesPitch = true;
      a.addEventListener('ended', () => { if (this.hazirCal)
        this.hazirBaslat(this.hz.no + 1); });
      a.addEventListener('error', () => { if (this.hazirCal)
        this.sentezeDon(); });
    }
    const a = this.calar;
    // Parça yüklenirken dans donmasın: saat, son tempoyla kendi kendine yürür.
    if (this.hazirCal)
      this.hz.bos = { b: this.enVurus, s: performance.now() / 1000, hiz: this.parcalar[this.hz.no].bpm / 60 * a.playbackRate };
    a.src = this.muzikKok + p.dosya;
    a.volume = clamp(this.duzey / 0.7, 0, 1);
    a.playbackRate = clamp(this.carpan, 1, 1.25);
    try {
      await a.play();
    }
    catch (e) {
      if (sira === this.hazirSira)
        this.sentezeDon();
      return false;
    }
    if (sira !== this.hazirSira)
      return false;
    if (this.kaynak !== 'hazir' || !this.acik) {
      a.pause();
      return false;
    }
    // Yeni parçanın ölçü başı, dansın dört vuruşluk döngüsünün başına denk getirilir.
    const once = p.vurus[0] / (p.vurus[1] - p.vurus[0]);
    this.hz = { no, i: 0, taban: Math.ceil((this.enVurus + p.kayma + once) / 4 - 1e-6) * 4, t: a.currentTime, s: performance.now() / 1000, yari: -1, bos: null };
    if (!this.hazirCal) {
      this.hazirCal = true;
      const t = this.ctx.currentTime;
      for (const z of [this.ses.zurna, this.ses.dem]) {
        z.amp.cancelScheduledValues(t);
        z.amp.setTargetAtTime(0, t, 0.02);
      }
    }
    this.iz.length = 0;
    this.olaylar.length = 0;
    return true;
  }
  sentezeDon() {
    this.hazirSira++;
    if (this.calar)
      this.calar.pause();
    if (!this.hazirCal)
      return;
    this.hazirCal = false;
    // Üretilen müzik bir sonraki ölçü başında girer; araya kadar saat aynı tempoda yürür.
    const t = this.simdi(), b = this.enVurus, bd = 60 / (this.hava.bpm * this.carpan), nb = Math.ceil(b / 4 + 1e-6) * 4;
    this.iz = [{ t, beat: b, bd, adim: -1 }];
    this.adim = 0;
    this.beat = nb;
    this.sonraki = t + (nb - b) * bd;
    this.havaSure = 0;
    this.olaylar.length = 0;
  }
  hazirSaat() {
    // Ses öğesinin saati kaba adımlarla ilerleyebilir; kendi saatimizi yürütüp ona yumuşakça yaklaştırırız.
    const a = this.calar, hz = this.hz, simdi = performance.now() / 1000;
    let t = hz.t + (a.paused ? 0 : (simdi - hz.s) * a.playbackRate);
    const fark = a.currentTime - t;
    t = Math.abs(fark) > 0.25 ? a.currentTime : t + fark * 0.06;
    hz.t = t;
    hz.s = simdi;
    return t;
  }
  hazirVurus() {
    const hz = this.hz;
    if (hz.bos)
      return hz.bos.b + (performance.now() / 1000 - hz.bos.s) * hz.bos.hiz;
    const p = this.parcalar[hz.no], v = p.vurus, t = this.hazirSaat();
    let i = hz.i;
    while (i < v.length - 2 && v[i + 1] <= t)
      i++;
    while (i > 0 && v[i] > t)
      i--;
    hz.i = i;
    return hz.taban + i - p.kayma + (t - v[i]) / (v[i + 1] - v[i]);
  }
  hazirPlanla() {
    const a = this.calar, hiz = clamp(this.carpan, 1, 1.25);
    if (Math.abs(a.playbackRate - hiz) > 0.004)
      a.playbackRate = hiz;
    // Çalgıcıların eli kolu vuruşla oynasın: her vuruşta düm, arasında tek, zurnacıya gezinen bir perde.
    const yari = Math.floor(this.enVurus * 2), hz = this.hz;
    if (hz.yari >= 0 && yari > hz.yari) {
      const t = this.simdi();
      this.olaylar.push({ t, tip: yari % 2 ? 'tek' : 'dum' }, { t, tip: 'nota', deg: [3, 4, 5, 4, 2, 3, 1, 4][yari % 8] });
    }
    hz.yari = yari;
  }
  calanAd() { return this.hazirCal ? this.parcalar[this.hz.no].ad : this.hava.ad; }
  calanBpm() { return this.hazirCal ? this.parcalar[this.hz.no].bpm * this.calar.playbackRate : this.hava.bpm * this.carpan; }
}
const muzik = new Muzik();
