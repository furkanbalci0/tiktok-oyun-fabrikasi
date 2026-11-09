/* YARDIMCILAR — her parçanın kullandığı küçük işlevler.
 * clamp / lerp / yumusak / basamak: sayı yardımcıları · ozet + rastgeleUret: addan tekrarlanabilir rastgelelik
 * aciFark: iki açı arasındaki en kısa fark · azHareket: kullanıcı "hareketi azalt" istemiş mi · $: id ile öğe bul
 */
const TAU = Math.PI * 2, HP = Math.PI / 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const yumusak = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const basamak = (a, b, x) => yumusak((x - a) / (b - a));
function ozet(s) { let h = 2166136261; for (const ch of String(s)) {
  h ^= ch.codePointAt(0);
  h = Math.imul(h, 16777619);
} return h >>> 0; }
function rastgeleUret(tohum) { return () => { tohum |= 0; tohum = tohum + 0x6D2B79F5 | 0; let t = Math.imul(tohum ^ tohum >>> 15, 1 | tohum); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const aciFark = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI)
  d -= TAU; if (d < -Math.PI)
  d += TAU; return d; };
const azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);
