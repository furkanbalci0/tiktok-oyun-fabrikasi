/* SAHNE YAZILARININ GÖRÜNÜMÜ — sıralama kutusu, coşku göstergesi, nasıl oynanır şeridi, bildirim ve pankart bu
 * oyunda düğün gecesinin malzemesiyle (lake lacivert, sırma kenar, kilim suyu) giydirilir.
 * Yalnız görünüm değişir: kutuların yeri ve boyu çekirdeğin stilindeki gibidir, metinler yine textContent ile yazılır.
 * Stil sayfaya bir <style> öğesiyle eklenir; içinde izleyiciden gelen hiçbir şey yoktur.
 */
const HALAY_STIL = `
.logo{text-shadow:0 .5cqw 0 var(--sicak),0 1cqw 0 #8f1f1a,0 1.8cqw 2.6cqw rgba(0,0,0,.6),0 0 7cqw rgba(255,170,90,.42)}
.nasil span{background:linear-gradient(180deg,rgba(38,42,100,.84),rgba(8,10,28,.84));border-color:rgba(255,209,102,.4);
  box-shadow:0 .5cqw 1.4cqw rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.12)}
.sira h2,.cosku h2{letter-spacing:.04em;text-shadow:0 .3cqw 0 rgba(8,10,28,.9),0 .6cqw 1.6cqw rgba(0,0,0,.65)}
.sira li{background:linear-gradient(180deg,rgba(38,42,100,.9),rgba(10,12,38,.9));
  box-shadow:0 .5cqw 1.4cqw rgba(0,0,0,.38),inset 0 0 0 1px rgba(246,236,217,.16),inset 0 1px 0 rgba(255,255,255,.14)}
.sira li .no{background:rgba(246,236,217,.14);box-shadow:inset 0 0 0 1px rgba(246,236,217,.18)}
.sira li .jt{text-shadow:0 .2cqw .5cqw rgba(0,0,0,.6)}
.sira li.bas{background:linear-gradient(180deg,#f2604a,#c12a22);
  box-shadow:0 .6cqw 2cqw rgba(226,61,47,.5),inset 0 0 0 1.5px rgba(255,209,102,.95),inset 0 -.5cqw .8cqw rgba(110,16,20,.35)}
.sira li.bas .no{background:radial-gradient(circle at 35% 30%,#fff3cc,#ffd166 55%,#dc9f28);
  box-shadow:0 0 0 1px rgba(8,10,28,.45)}
.sira li.bas .ad{text-shadow:0 .2cqw 0 rgba(110,16,20,.6)}
.sira .bos{background:linear-gradient(180deg,rgba(38,42,100,.9),rgba(10,12,38,.9));box-shadow:inset 0 0 0 1px rgba(246,236,217,.16)}
.cosku .cubuk{box-sizing:border-box;background:rgba(8,10,28,.74);border:1px solid rgba(255,209,102,.55);
  box-shadow:inset 0 .4cqw .8cqw rgba(0,0,0,.65),0 .5cqw 1.4cqw rgba(0,0,0,.4)}
.cosku .dolu{background:linear-gradient(180deg,rgba(255,255,255,.42),rgba(255,255,255,0) 46%,rgba(60,10,20,.22)),
  linear-gradient(90deg,var(--serin),var(--vurgu) 60%,var(--sicak));box-shadow:0 0 1.8cqw rgba(255,209,102,.6)}
.cosku .bilgi{text-shadow:0 .2cqw 0 rgba(8,10,28,.85),0 .3cqw 1cqw rgba(0,0,0,.9)}
.bildirim div{background:linear-gradient(180deg,#fff8e8,#f0e0c2);border-left:.8cqw solid var(--vurgu);
  box-shadow:0 .6cqw 1.6cqw rgba(0,0,0,.4)}
.pankart{background:linear-gradient(180deg,#f2604a,#bf2a22);border-block:1.1cqw solid var(--vurgu);
  border-image:repeating-linear-gradient(90deg,#ffd166 0 2.4cqw,#22b8a7 2.4cqw 3.6cqw,#f6ecd9 3.6cqw 4.8cqw,#8f1f1a 4.8cqw 6cqw) 1;
  box-shadow:0 1.4cqw 3.4cqw rgba(0,0,0,.5),inset 0 0 5cqw rgba(110,16,20,.45)}
.pankart .b1{text-shadow:0 .4cqw 0 #8f1f1a,0 .9cqw 1.6cqw rgba(0,0,0,.45)}
.pankart .b2{text-shadow:0 .25cqw 0 rgba(110,16,20,.7)}
`;
const halayStil = document.createElement('style');
halayStil.textContent = HALAY_STIL;
document.head.appendChild(halayStil);
