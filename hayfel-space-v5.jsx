import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as Tone from "tone";
import { Volume2, VolumeX, SkipBack, SkipForward, Play, Pause, RefreshCw, Github, Instagram, Twitter, Youtube, Linkedin } from "lucide-react";

/* ============================================================
   HAYFELSPACE v5 — "VENTANA, SIN DEGRADADOS"
   Colores planos + patrones SVG intercambiables + grano.
   Mezcla de tarjetas regulares (ventana retro) con acentos
   irregulares (clip-path) usados como firma, no como norma.
   ============================================================ */

/* ---------- generadores de fondo (SVG, cero funciones "gradient") ---------- */
function svgURI(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
function makePattern(kind, size, bg, line) {
  let inner;
  if (kind === "grid") {
    inner = `<path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${line}" stroke-width="1.4"/>`;
  } else if (kind === "dots") {
    inner = `<circle cx="${size / 2}" cy="${size / 2}" r="1.7" fill="${line}"/>`;
  } else if (kind === "cross") {
    const c = size / 2;
    inner = `<path d="M ${c - 6} ${c} H ${c + 6} M ${c} ${c - 6} V ${c + 6}" stroke="${line}" stroke-width="1.6" stroke-linecap="square"/>`;
  } else {
    const h = size / 2;
    inner = `<rect width="${h}" height="${h}" fill="${line}"/><rect x="${h}" y="${h}" width="${h}" height="${h}" fill="${line}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bg}"/>${inner}</svg>`;
  return svgURI(svg);
}
function makeGrain(seed) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed}" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.7 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;
  return svgURI(svg);
}

const BGSTYLES = [
  { id: "grid", label: "CUADRÍCULA" },
  { id: "dots", label: "PUNTOS" },
  { id: "cross", label: "CRUCES" },
  { id: "check", label: "DAMERO" },
];
const PATTERNS = {
  grid: makePattern("grid", 46, "#d40e31", "rgba(11,7,8,.4)"),
  dots: makePattern("dots", 30, "#d40e31", "rgba(11,7,8,.48)"),
  cross: makePattern("cross", 38, "#d40e31", "rgba(11,7,8,.42)"),
  check: makePattern("check", 88, "#d40e31", "#b80e2c"),
};
const TV_PATTERN = makePattern("grid", 24, "#0b0708", "rgba(255,31,63,.4)");
const GRAIN = makeGrain(4);
const TILESIZE = { grid: 46, dots: 30, cross: 38, check: 88 };

const PAPER_SNIPPETS = [
  { k: "REQ-04", t: "\"el usuario debería poder\" → ambigüedad: alta" },
  { k: "CRÍTICO", t: "propone reescritura, esperando veredicto..." },
  { k: "PRISMA", t: "140 → 47 → 19 artículos" },
  { k: "MODELADOR", t: "generando diagrama UML v3" },
  { k: "LOG", t: "ciclo 2/2, el Clasificador sigue sin ceder" },
  { k: "χ²", t: "concordancia entre jueces: 0.83" },
  { k: "ARGRE", t: "Cheng et al., arXiv:2604.23124" },
  { k: "NOTA", t: "revisar alcance antes del viernes" },
];
const PAPER_POS = [
  { x: "6%", y: "14%", r: -8, d: 15, dl: 0 },
  { x: "88%", y: "10%", r: 6, d: 17, dl: 2.5 },
  { x: "3%", y: "46%", r: 5, d: 16, dl: 5 },
  { x: "91%", y: "40%", r: -7, d: 14, dl: 1.2 },
  { x: "9%", y: "74%", r: -4, d: 18, dl: 7 },
  { x: "85%", y: "70%", r: 8, d: 15.5, dl: 3.8 },
  { x: "4%", y: "92%", r: 6, d: 16.5, dl: 9 },
  { x: "89%", y: "90%", r: -6, d: 14.5, dl: 6 },
];

const CSS = `
.hs{
  --hot:#ff1f3f; --crim:#d40e31; --crim-2:#a4133c; --crim-dk:#6e0a1c; --crim-deep:#59060f;
  --shadow:#0b0708; --soot:#1a0e11; --bone:#f5ede2; --paper:#fffbf5; --gold:#ffc300;
  --mono:ui-monospace,"Cascadia Mono","Courier New",monospace;
  --fat:Impact,"Arial Black",Haettenschweiler,sans-serif;

  position:relative; min-height:100vh; overflow-x:clip;
  font-family:var(--mono); font-size:14px; color:var(--bone);
  cursor:crosshair; padding:16px 12px 100px; background:var(--crim);
}
.hs *{ box-sizing:border-box; }
.hs ::selection{ background:var(--hot); color:var(--paper); }
.hs :focus-visible{ outline:3px solid var(--gold); outline-offset:3px; }
.hs ::-webkit-scrollbar{ width:12px; height:12px; }
.hs ::-webkit-scrollbar-track{ background:var(--soot); }
.hs ::-webkit-scrollbar-thumb{ background:var(--crim); border:2px solid var(--shadow); }
.hs ::-webkit-scrollbar-thumb:hover{ background:var(--hot); }

/* ---------- FONDO: capa de patrón + capa de grano, ambas planas ---------- */
.bglayer{ position:fixed; inset:0; z-index:0; background-repeat:repeat;
  animation:bgdrift 34s linear infinite; }
@keyframes bgdrift{ from{ background-position:0 0; } to{ background-position:calc(var(--tsize,40px) * -4) calc(var(--tsize,40px) * -3); } }
.grainlayer{ position:fixed; inset:0; z-index:1; background-repeat:repeat; opacity:.055; mix-blend-mode:overlay; pointer-events:none;
  animation:graindrift 9s steps(6) infinite; }
@keyframes graindrift{
  0%{ background-position:0 0; } 20%{ background-position:-40px 20px; } 40%{ background-position:30px -30px; }
  60%{ background-position:-20px -50px; } 80%{ background-position:50px 10px; } 100%{ background-position:0 0; } }
.papers-bg{ position:fixed; inset:0; z-index:1; pointer-events:none; overflow:hidden; }
.paperfloat{ position:absolute; width:118px; background:var(--paper); color:var(--shadow); border:2px solid rgba(11,7,8,.7);
  padding:8px 9px; font-size:9px; line-height:1.5; letter-spacing:.2px; opacity:0;
  animation-name:paperinout; animation-timing-function:ease-in-out; animation-iteration-count:infinite; }
.paperfloat b{ display:block; font-size:8px; letter-spacing:1px; color:var(--crim); margin-bottom:3px; }
@keyframes paperinout{
  0%{ opacity:0; transform:translateY(26px) rotate(var(--pr,0deg)) scale(.94); }
  12%{ opacity:.5; transform:translateY(0) rotate(var(--pr,0deg)) scale(1); }
  45%{ opacity:.5; transform:translateY(-8px) rotate(var(--pr,0deg)) scale(1); }
  62%{ opacity:0; transform:translateY(-28px) rotate(var(--pr,0deg)) scale(.94); }
  100%{ opacity:0; transform:translateY(-28px) rotate(var(--pr,0deg)) scale(.94); }
}
.vig{ position:fixed; inset:0; z-index:2; pointer-events:none; box-shadow:inset 0 0 140px rgba(11,7,8,.4); }

/* ---------- SLAB (acentos irregulares, usados con moderación) ---------- */
.slab{ position:relative; transform:rotate(var(--rot,0deg));
  filter:drop-shadow(3px 4px 0 var(--crim-dk)) drop-shadow(7px 9px 0 var(--shadow)) drop-shadow(11px 14px 0 rgba(11,7,8,.45));
  animation:slam .5s cubic-bezier(.16,1.55,.4,1) both; transition:transform .15s cubic-bezier(.2,1.4,.4,1), filter .15s; }
.slab > .edge{ position:absolute; inset:0; background:var(--shadow); }
.slab > .face{ position:relative; margin:5px; min-height:20px; box-shadow:inset 0 0 0 2px rgba(255,255,255,.12), inset 0 -4px 0 rgba(11,7,8,.28); }
.f-bone > .face, .f-gold > .face, .f-flare > .face{ box-shadow:inset 0 0 0 2px rgba(11,7,8,.14), inset 0 -4px 0 rgba(11,7,8,.22); }
.slab.hover:hover{
  filter:drop-shadow(4px 5px 0 var(--crim-dk)) drop-shadow(10px 13px 0 var(--shadow)) drop-shadow(16px 20px 0 rgba(11,7,8,.45));
  transform:rotate(var(--rot,0deg)) translate(-4px,-5px) scale(1.02); }
@keyframes slam{ from{ opacity:0; transform:rotate(var(--rot,0deg)) scale(1.16) translateY(-14px); } to{ opacity:1; transform:rotate(var(--rot,0deg)) scale(1); } }
.f-crim  > .face{ background-color:var(--crim);   color:var(--paper); }
.f-blood > .face{ background-color:var(--crim-2); color:var(--paper); }
.f-deep  > .face{ background-color:var(--crim-dk);color:var(--bone); }
.f-flare > .face{ background-color:var(--hot);    color:var(--shadow); }
.f-shadow> .face{ background-color:var(--shadow); color:var(--bone); }
.f-soot  > .face{ background-color:var(--soot);   color:var(--bone); }
.f-bone  > .face{ background-color:var(--bone);   color:var(--shadow); }
.f-gold  > .face{ background-color:var(--gold);   color:var(--shadow); }

.c-a > *{ clip-path:polygon(0 16px, 100% 0, 100% calc(100% - 13px), 13px 100%); }
.c-b > *{ clip-path:polygon(0 0, 100% 15px, calc(100% - 11px) 100%, 9px calc(100% - 9px)); }
.c-para > *{ clip-path:polygon(17px 0, 100% 0, calc(100% - 17px) 100%, 0 100%); }
.c-trap > *{ clip-path:polygon(0 0, 100% 0, calc(100% - 22px) 100%, 22px 100%); }
.c-blade > *{ clip-path:polygon(0 0, 100% 10px, 100% 100%, 0 calc(100% - 10px)); }
.c-torn > *{ clip-path:polygon(0 9px, 26px 0, 61% 7px, 100% 0, 100% calc(100% - 18px), 84% 100%, 57% calc(100% - 11px), 31% 100%, 9% calc(100% - 7px), 0 100%); }
.c-shard > *{ clip-path:polygon(14px 0, 100% 6px, calc(100% - 8px) 38%, 100% 62%, calc(100% - 16px) 100%, 6px calc(100% - 10px), 0 44%); }

/* ---------- VENTANA (elemento regular, la firma del rediseño) ---------- */
.win{ position:relative; background:var(--bone); color:var(--shadow); border:3px solid var(--shadow);
  box-shadow:4px 4px 0 var(--crim-dk), 9px 9px 0 var(--shadow), 13px 13px 0 rgba(11,7,8,.4);
  animation:pop .4s cubic-bezier(.2,1.3,.3,1) both; transition:transform .15s cubic-bezier(.2,1.4,.4,1), box-shadow .15s; }
.win.dark{ box-shadow:4px 4px 0 var(--crim), 9px 9px 0 var(--soot), 13px 13px 0 rgba(11,7,8,.5); }
.win.hover{ cursor:pointer; }
.win.hover:hover{ transform:translate(-3px,-4px);
  box-shadow:6px 7px 0 var(--crim-dk), 13px 15px 0 var(--shadow), 19px 22px 0 rgba(11,7,8,.4); }
.win.hover:active{ transform:translate(1px,1px);
  box-shadow:2px 2px 0 var(--crim-dk), 5px 5px 0 var(--shadow), 8px 8px 0 rgba(11,7,8,.4); }
@keyframes pop{ from{ opacity:0; transform:translateY(10px); } to{ opacity:1; transform:translateY(0); } }
.win.dark{ background:var(--shadow); color:var(--bone); }
.win > .bar{ display:flex; align-items:center; gap:8px; padding:7px 10px; font-size:11px; letter-spacing:2px; background:var(--shadow); color:var(--bone); border-bottom:3px solid var(--shadow); }
.win.crimbar > .bar{ background:var(--crim); }
.win.goldbar > .bar{ background:var(--gold); color:var(--shadow); }
.win > .bar .wdots{ display:flex; gap:5px; }
.win > .bar .wdots i{ width:9px; height:9px; border-radius:50%; background:var(--hot); }
.win > .bar .wdots i:nth-child(2){ background:var(--gold); }
.win > .bar .wdots i:nth-child(3){ background:var(--bone); }
.win.crimbar > .bar .wdots i:nth-child(3), .win.goldbar > .bar .wdots i:nth-child(3){ background:var(--shadow); }
.win > .bar .wtitle{ margin-left:2px; }
.win > .bar .wtag{ margin-left:auto; opacity:.75; font-size:9px; }
.win > .inner{ padding:14px; }

/* ---------- TASKBAR / CABECERA ---------- */
.wrap{ position:relative; z-index:3; max-width:1080px; margin:0 auto; display:grid; gap:18px; }
.head{ position:relative; }
.taskbar{ display:flex; align-items:center; gap:10px; padding:8px 10px 8px 14px; flex-wrap:wrap; }
.taskbar .wdots{ display:flex; gap:6px; flex:none; }
.taskbar .wdots i{ width:11px; height:11px; border-radius:50%; background:var(--hot); }
.taskbar .wdots i:nth-child(2){ background:var(--gold); } .taskbar .wdots i:nth-child(3){ background:var(--bone); }
.taskbar .wname{ font-size:11px; letter-spacing:2px; opacity:.8; flex:none; padding-right:10px; border-right:2px solid rgba(245,237,226,.25); }
.tabs{ display:flex; gap:4px; overflow-x:auto; flex:1; scrollbar-width:thin; }
.tabbtn{ all:unset; cursor:pointer; display:flex; align-items:center; gap:6px; font-family:var(--mono); font-size:10px;
  letter-spacing:1px; font-weight:700; padding:7px 12px; white-space:nowrap; background:var(--soot); color:var(--bone);
  border:2px solid var(--shadow); border-bottom:3px solid var(--shadow); }
.tabbtn svg{ width:14px; height:14px; image-rendering:pixelated; }
.tabbtn.on{ background:var(--bone); color:var(--shadow); transform:translateY(2px); border-bottom-color:var(--bone); }
.taskbar .clock{ flex:none; font-size:10px; letter-spacing:1px; color:var(--hot); padding-left:8px; }
.snd2{ all:unset; cursor:pointer; flex:none; display:flex; align-items:center; gap:5px; font-size:9px; letter-spacing:1px;
  font-weight:700; padding:7px 10px; background:var(--bone); color:var(--shadow); border:2px solid var(--shadow); }
.snd2.on{ background:var(--hot); }

.stamp{ position:absolute; left:10px; top:-16px; width:96px; z-index:4; }
.stamp .face{ padding:8px 6px; }
.stamp h1{ margin:0; font-family:var(--fat); font-size:20px; line-height:.85; text-align:center; color:var(--paper);
  transform:rotate(-4deg); text-shadow:3px 3px 0 var(--shadow); }
.stamp span{ display:block; font-size:7px; letter-spacing:2px; text-align:center; color:var(--hot); margin-top:2px; }

.quicknav{ display:flex; gap:6px; flex-wrap:wrap; margin-top:10px; padding-left:6px; }
.qbtn{ all:unset; cursor:pointer; font-size:10px; letter-spacing:1px; font-weight:700; padding:6px 12px;
  background:var(--bone); color:var(--shadow); border:2px solid var(--shadow); }
.qbtn:hover{ background:var(--hot); color:var(--paper); }

/* ---------- CONSOLA ---------- */
.console{ display:grid; grid-template-columns:1fr 240px; gap:16px; align-items:start; }
.tv{ position:relative; overflow:hidden; min-height:320px; padding:16px 18px; color:var(--bone); background-color:var(--shadow); }
.tv .grain{ position:absolute; inset:0; pointer-events:none; opacity:.16; background-repeat:repeat; }
.tv .cat{ position:relative; display:inline-block; background:var(--hot); color:var(--paper); font-size:10px; font-weight:700; letter-spacing:2px; padding:3px 9px; }
.tv .date{ position:relative; font-size:11px; color:var(--hot); letter-spacing:2px; }
.tv h2{ position:relative; font-family:var(--fat); font-size:clamp(20px,3.4vw,32px); line-height:1.04; margin:12px 0 4px; color:var(--paper); }
.tv .body{ position:relative; margin-top:14px; max-height:140px; overflow-y:auto; white-space:pre-wrap; line-height:1.6; font-size:13px; color:#efe3d6; padding-right:8px; }

.side{ display:grid; gap:12px; }
.side .inner{ display:grid; gap:10px; }
.transport2{ display:flex; gap:8px; }
.tbtn2{ all:unset; cursor:pointer; flex:1; display:grid; place-items:center; padding:9px 0; background:var(--paper); border:2px solid var(--shadow); }
.tbtn2:hover{ background:var(--crim); color:var(--paper); }
.tbtn2:active{ transform:translateY(2px); }
.stat{ display:flex; justify-content:space-between; font-size:11px; padding:3px 0; border-bottom:1px dotted rgba(11,7,8,.25); }
.stat b{ font-weight:400; opacity:.65; }

/* ---------- TRES PANELES ---------- */
.row3{ display:grid; grid-template-columns:1.1fr .95fr 1fr; gap:16px; align-items:start; }
.inset{ background:var(--paper); color:var(--shadow); padding:10px; font-size:12px; border:2px solid rgba(11,7,8,.15); }
.win.dark .inset{ background:var(--soot); color:var(--bone); border-color:rgba(245,237,226,.15); }
.sched{ max-height:172px; overflow-y:auto; }
.sched div{ display:flex; gap:9px; padding:3px 0; border-bottom:1px dotted rgba(11,7,8,.18); }
.sched b{ color:var(--crim); font-weight:400; min-width:52px; }
.sched .live{ background:var(--crim); color:var(--paper); padding:0 5px; display:inline-block; }

.pfp{ display:grid; grid-template-columns:76px 1fr; gap:10px; padding:14px; }
.pfp svg{ width:100%; height:auto; image-rendering:pixelated; background:var(--shadow); padding:4px; }
.bio{ font-size:12px; line-height:1.5; max-height:108px; overflow-y:auto; }
.kick{ font-family:var(--fat); font-size:16px; margin-bottom:5px; }
.hint{ font-size:10px; letter-spacing:1px; opacity:.7; margin-top:5px; }
.badges{ display:flex; flex-wrap:wrap; gap:5px; margin-top:9px; }
.badges span{ font-size:9px; letter-spacing:1px; padding:3px 6px; background:var(--shadow); color:var(--bone); }

.nowl{ list-style:none; margin:0; padding:0; font-size:12px; }
.nowl li{ display:flex; justify-content:space-between; gap:8px; padding:4px 0; border-bottom:1px dotted rgba(245,237,226,.24); }
.nowl b{ font-weight:400; opacity:.68; }
.meter{ border:2px solid var(--shadow); height:15px; background:var(--paper); padding:2px; margin-top:9px; }
.meter i{ display:block; height:100%; width:0; background:var(--hot); transition:width 1.6s cubic-bezier(.2,.9,.2,1); }

/* ---------- TICKER ---------- */
.strip{ display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:center; }
.striplabel .face{ font-family:var(--fat); font-size:18px; padding:9px 22px 9px 14px; }
.tickwrap{ background:var(--shadow); overflow:hidden; white-space:nowrap; padding:11px 14px; font-size:12px; letter-spacing:1px; border:2px solid var(--shadow); }
.tickwrap span{ display:inline-block; padding-left:100%; animation:slide 28s linear infinite; }
@keyframes slide{ to{ transform:translateX(-100%); } }
.stripbtns{ display:grid; gap:6px; }
.minib{ all:unset; cursor:pointer; font-size:10px; letter-spacing:1px; font-weight:700; padding:6px 14px; background:var(--bone); color:var(--shadow); border:2px solid var(--shadow); text-align:center; }
.minib:hover{ background:var(--gold); }

/* ---------- BANNERS: bento, mezcla regular + irregular ---------- */
.banners{ display:grid; grid-template-columns:1.3fr 1fr 1fr; grid-template-rows:auto auto; gap:14px; }
.ban{ cursor:pointer; }
.ban.lg{ grid-row:1 / span 2; }
.ban:nth-child(2){ grid-column:2; grid-row:1; }
.ban:nth-child(3){ grid-column:3; grid-row:1; }
.ban:nth-child(4){ grid-column:2 / span 2; grid-row:2; }
.ban .n{ font-size:9px; letter-spacing:2px; font-weight:700; opacity:.7; }
.ban .k{ font-size:9px; letter-spacing:2px; font-weight:700; }
.ban h4{ margin:6px 0 0; font-family:var(--fat); font-size:17px; line-height:1.06; }
.ban .go{ margin-top:auto; justify-self:start; background:var(--shadow); color:var(--hot); font-size:9px; letter-spacing:2px; padding:4px 8px; }
.ban:hover .go{ background:var(--gold); color:var(--shadow); }
.ban .win.inner-p, .ban.lg .win{ height:100%; }
.ban.lg .inner{ display:grid; gap:6px; height:100%; align-content:start; padding:16px; }
.ban .face{ padding:12px; display:grid; gap:4px; min-height:112px; align-content:start; }

/* ---------- PANELES DE PAPEL ---------- */
.row2{ display:grid; grid-template-columns:1fr 300px; gap:16px; align-items:start; }
.gbform{ display:grid; grid-template-columns:110px 1fr auto; gap:6px; margin-bottom:10px; }
.gbform input{ font-family:var(--mono); font-size:12px; padding:7px; border:2px solid var(--shadow); background:var(--paper); color:var(--shadow); min-width:0; }
.gbform button{ font-family:var(--mono); font-size:12px; letter-spacing:1px; padding:7px 14px; border:2px solid var(--shadow); background:var(--crim); color:var(--paper); cursor:pointer; }
.gbform button:hover{ background:var(--hot); }
.gbform button:active{ transform:translate(2px,2px); }
.gblist{ display:grid; gap:8px; max-height:186px; overflow-y:auto; }
.gbitem{ display:grid; grid-template-columns:24px 1fr; gap:8px; background:var(--paper); border:2px solid var(--shadow); border-left:5px solid var(--crim); padding:8px; }
.gbitem .av{ width:24px; height:24px; border:2px solid var(--shadow); }
.gbitem .who{ font-size:10px; letter-spacing:1px; color:var(--crim); }
.gbitem p{ margin:2px 0 0; font-size:12px; line-height:1.45; word-break:break-word; }
.win .hint{ color:var(--crim-dk); opacity:.85; }
.tags{ display:flex; flex-wrap:wrap; gap:6px; }
.tags span{ font-size:11px; padding:4px 9px; background:var(--shadow); color:var(--bone); border:2px solid var(--shadow); }
.tags span:nth-child(even){ background:var(--paper); color:var(--shadow); }
.tags span:hover{ background:var(--hot); color:var(--paper); border-color:var(--shadow); }
.arch{ list-style:none; margin:0; padding:0; font-size:12px; max-height:150px; overflow-y:auto; }
.arch li{ padding:6px 4px; border-bottom:1px dotted rgba(11,7,8,.2); cursor:pointer; display:flex; gap:8px; }
.arch li:hover{ background:var(--crim); color:var(--paper); }
.arch li:hover em{ color:var(--paper); }
.arch em{ font-style:normal; color:var(--crim); font-size:10px; }

/* ---------- REDES ---------- */
.redwrap{ position:relative; }
.redsoon{ position:absolute; right:14px; top:-14px; width:78px; z-index:4; }
.redsoon .face{ padding:6px 4px; text-align:center; font-size:9px; letter-spacing:1px; font-weight:700; }
.redgrid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(190px,1fr)); gap:12px; }
.redcard{ display:flex; align-items:center; gap:10px; padding:11px; border:2px solid var(--shadow); background:var(--paper);
  color:var(--shadow); text-decoration:none; transition:transform .12s, box-shadow .12s; }
.redcard.soon{ border-style:dashed; opacity:.68; cursor:default; }
.redcard:not(.soon){ cursor:pointer; }
.redcard:not(.soon):hover{ background:var(--crim); color:var(--paper); transform:translate(-3px,-3px); box-shadow:5px 5px 0 var(--shadow); }
.redcard .ico{ width:34px; height:34px; flex:none; display:grid; place-items:center; background:var(--shadow); color:var(--bone); }
.redcard .ico svg{ width:17px; height:17px; }
.redcard .ico b{ font-size:11px; letter-spacing:.5px; }
.redcard .txt{ display:grid; min-width:0; }
.redcard .plat{ font-size:11px; font-weight:700; letter-spacing:1px; }
.redcard .handle{ font-size:10px; opacity:.65; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.redcard .tag{ margin-left:auto; flex:none; font-size:8px; letter-spacing:1px; padding:3px 6px; background:var(--soot); color:var(--bone); }
.redcard:not(.soon) .tag{ background:var(--gold); color:var(--shadow); }

/* ---------- PIE ---------- */
.foot{ padding:0; }
.foot .inner{ display:flex; flex-wrap:wrap; gap:14px; align-items:center; justify-content:space-between; padding:16px 20px; font-size:11px; }
.counter{ display:flex; gap:3px; }
.counter i{ background:var(--hot); color:var(--paper); font-style:normal; font-weight:700; width:20px; text-align:center; padding:4px 0; }
.ring{ display:flex; gap:8px; flex-wrap:wrap; }
.b88{ width:88px; height:31px; display:grid; place-content:center; font-size:9px; letter-spacing:1px; line-height:1.1; text-align:center;
  background:var(--bone); color:var(--shadow); filter:drop-shadow(3px 3px 0 rgba(11,7,8,.8)); transform:rotate(var(--r,0deg)); }
.b88.x{ background:var(--crim); color:var(--paper); } .b88.y{ background:var(--gold); }

/* ---------- STICKERS ---------- */
.stick{ position:absolute; z-index:20; touch-action:none; user-select:none; cursor:grab; filter:drop-shadow(4px 4px 0 rgba(11,7,8,.95)); }
.stick:active{ cursor:grabbing; }
.star{ width:50px; height:50px; background:var(--shadow); clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%); }
.note{ width:140px; background:var(--bone); color:var(--shadow); padding:9px; font-size:11px; line-height:1.4; transform:rotate(-6deg); border:2px solid var(--shadow); }
.note b{ display:block; font-size:9px; letter-spacing:1px; color:var(--crim); margin-bottom:3px; }
.boom{ font-family:var(--fat); font-size:32px; color:var(--hot); -webkit-text-stroke:2.5px var(--shadow); transform:rotate(-10deg); }

/* ---------- INTERRUPTOR DE FONDO (fijo, abajo) ---------- */
.bgswitch{ position:fixed; left:50%; bottom:16px; transform:translateX(-50%); z-index:900;
  display:flex; align-items:center; gap:8px; background:var(--shadow); color:var(--bone); border:2px solid var(--bone);
  padding:8px 14px; font-size:10px; letter-spacing:1.5px; font-weight:700; cursor:pointer; }
.bgswitch:hover{ background:var(--crim); }
.bgswitch svg{ width:13px; height:13px; }
.bgswitch .dotsrow{ display:flex; gap:3px; margin-left:4px; }
.bgswitch .dotsrow i{ width:5px; height:5px; background:rgba(245,237,226,.35); }
.bgswitch .dotsrow i.on{ background:var(--hot); }

/* ---------- BOOT (rehecho: ventana regular, no franjas diagonales) ---------- */
.boot{ position:fixed; inset:0; z-index:999; background:var(--shadow); display:grid; place-items:center; padding:20px;
  transition:opacity .4s, visibility .4s; }
.boot.off{ opacity:0; visibility:hidden; }
.boot .bgp{ position:absolute; inset:0; opacity:.5; background-repeat:repeat; }
.bootwin{ position:relative; width:min(430px,94vw); background:var(--bone); color:var(--shadow); border:3px solid var(--shadow); box-shadow:9px 10px 0 rgba(0,0,0,.6); }
.bootwin .bbar{ display:flex; align-items:center; gap:6px; padding:7px 10px; font-size:10px; letter-spacing:2px; background:var(--shadow); color:var(--bone); }
.bootwin .bbar i{ width:9px; height:9px; border-radius:50%; background:var(--hot); }
.bootwin .bbar i:nth-child(2){ background:var(--gold); } .bootwin .bbar i:nth-child(3){ background:var(--bone); }
.bootwin .bbody{ padding:22px 22px 18px; }
.bootwin h3{ font-family:var(--fat); font-size:clamp(28px,7vw,46px); margin:0 0 4px; color:var(--crim); letter-spacing:-.5px; line-height:.95; }
.bootwin .sub{ font-size:10px; letter-spacing:2px; opacity:.6; margin-bottom:16px; }
.bootlog{ font-size:11px; line-height:2; min-height:88px; }
.bootlog .ok{ color:var(--crim); }
.bootlog .cur{ display:inline-block; width:7px; height:12px; background:var(--shadow); vertical-align:-2px; animation:blink 1s steps(2) infinite; }
@keyframes blink{ 50%{ opacity:0; } }
.bootgrid{ display:grid; grid-template-columns:repeat(20,1fr); gap:3px; margin:14px 0 8px; }
.bootgrid i{ height:9px; background:rgba(11,7,8,.12); }
.bootgrid i.fill{ background:var(--crim); }
.bootpct{ display:flex; justify-content:space-between; font-size:10px; letter-spacing:2px; color:var(--crim-dk); }

/* ---------- RESPONSIVE ---------- */
@media (max-width:900px){
  .console,.row2,.row3,.strip{ grid-template-columns:1fr; }
  .banners{ grid-template-columns:1fr 1fr; grid-template-rows:auto; }
  .ban.lg{ grid-row:auto; grid-column:1 / span 2; }
  .ban:nth-child(2){ grid-column:1; grid-row:auto; }
  .ban:nth-child(3){ grid-column:2; grid-row:auto; }
  .ban:nth-child(4){ grid-column:1 / span 2; grid-row:auto; }
  .stick{ display:none; }
  .stamp{ position:static; margin-bottom:8px; width:110px; }
}
@media (max-width:560px){
  .banners{ grid-template-columns:1fr; }
  .ban.lg,.ban:nth-child(2),.ban:nth-child(3),.ban:nth-child(4){ grid-column:1; }
  .gbform{ grid-template-columns:1fr; }
  .slab{ --rot:0deg !important; }
  .bgswitch{ font-size:9px; padding:7px 10px; }
}
@media (prefers-reduced-motion:reduce){
  .hs *,.hs *::before,.hs *::after{ animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; }
}
`;

/* ============================================================
   DATOS
   ============================================================ */
const POSTS = [
  { d: "09.08.26", cat: "TESIS", face: "crim", t: "los cuatro agentes por fin se hablan entre ellos",
    b: `Llevaba semanas con el Crítico devolviendo puras quejas vacías. El problema no era el prompt: era que le pasaba el requisito ya clasificado y sin el texto original, así que criticaba una etiqueta, no una frase.

Ahora el grafo lleva el texto crudo hasta el final. El Crítico marca la ambigüedad, el Modelador la reescribe, y si el Clasificador no está de acuerdo, regresa un ciclo. Máximo dos vueltas o esto no termina nunca.

Nota para mí del futuro: los ciclos infinitos en un grafo de agentes no truenan, solo te vacían la cuenta.` },
  { d: "05.08.26", cat: "SITIO", face: "shadow", t: "reconstruí este sitio otra vez, sin degradados",
    b: `La versión anterior tenía demasiado bisel con degradado y una franja diagonal de fondo que ya se sentía de otra época.

Esta vez todo es color plano: los paneles usan sombra sólida en vez de brillo degradado, y el fondo es un patrón SVG (cuadrícula, puntos, cruces o damero) con una capa de grano encima. Hay un botón abajo para cambiarlo.

También dejé de forzar el mismo corte torcido en cada tarjeta. Ahora la mayoría son ventanas rectas, tipo escritorio viejo, y lo irregular se guarda para unos cuantos acentos.` },
  { d: "02.08.26", cat: "GYM", face: "blood", t: "semana 12 de upper/lower: lo que sí sirvió",
    b: `Cuatro días, dos superiores y dos inferiores. Nada exótico.

Lo que movió la aguja no fue el programa, fue dejar de cambiarlo. Mismos ejercicios doce semanas seguidas, subiendo peso o repeticiones cuando salían limpias.

Lo otro: agendar el gym a las 5pm y tratarlo como clase. Si es "cuando pueda", no puedo.` },
  { d: "28.07.26", cat: "TESIS", face: "bone", t: "leí 140 títulos para quedarme con diecinueve",
    b: `El protocolo pedía documentar cada descarte, y ahí estuvo el valor real: al escribir por qué tiraba cada paper, empecé a ver que mi pregunta estaba mal formulada.

De 140 títulos pasé a 47 resúmenes, de ahí a 19 textos completos. Los otros hablaban de ambigüedad, sí, pero midiéndola, no resolviéndola.

Lo tedioso resultó ser lo que me dio el hueco donde cabe mi trabajo.` },
  { d: "21.07.26", cat: "COCINA", face: "flare", t: "butter chicken, intento siete",
    b: `Los primeros seis salieron a sopa de tomate con pollo adentro. El error era meter la crema con la sartén a todo fuego: se corta y ya nada la salva.

Intento siete: marinar el pollo en yogur griego una hora, tostar las especias en seco antes de nada, bajar la flama al mínimo antes de la mantequilla y la crema.

Salió. Lo malo es que ahora tengo que hacerlo cada semana.` },
  { d: "10.07.26", cat: "DIBUJO", face: "deep", t: "por qué volví al pixel art",
    b: `Porque una cuadrícula de 16x16 no te deja esconderte. No hay degradado que tape una silueta mal resuelta.

Es el mismo motivo por el que me gusta escribir con restricciones: menos opciones, decisiones más honestas.

El avatar de este sitio está hecho con un arreglo de texto y un montón de rectángulos. Nada más.` },
];

const CHANNELS = [
  { k: "TODO",   accent: "#f5ede2" },
  { k: "TESIS",  accent: "#ff1f3f" },
  { k: "GYM",    accent: "#0b0708" },
  { k: "COCINA", accent: "#d40e31" },
  { k: "DIBUJO", accent: "#ffc300" },
  { k: "SITIO",  accent: "#f5ede2" },
];

const SCHEDULE = [
  ["07:00", "café y silencio"], ["08:30", "escribir tesis"], ["11:00", "código / agentes"],
  ["13:30", "comer"], ["17:00", "gym (upper)"], ["19:00", "cocinar algo con especias"],
  ["21:00", "dibujar"], ["23:00", "leer papers mal"],
];

const SONGS = ["jazz de bar en loop", "breakcore a las 3am", "la misma playlist de siempre", "silencio (por fin)"];
const MOODS = ["cafeinado", "en negación", "productivo??", "tranquilo"];

const BOOTLOG = ["montando ventanas...", "cargando patrón de fondo...", "afilando dos o tres bordes...", "listo."];

const SOCIALS = [
  { k: "GITHUB", icon: Github, handle: "@hayfel", href: null },
  { k: "INSTAGRAM", icon: Instagram, handle: "@hayfel", href: null },
  { k: "X / TWITTER", icon: Twitter, handle: "@hayfel", href: null },
  { k: "TIKTOK", icon: null, mono: "TT", handle: "@hayfel", href: null },
  { k: "YOUTUBE", icon: Youtube, handle: "hayfel", href: null },
  { k: "LINKEDIN", icon: Linkedin, handle: "hayfel", href: null },
];

const PIX = [
  "................", ".....kkkkkk.....", "...kkaaaaaakk...", "..kaaaaaaaaaak..",
  "..kakkkkkkkkak..", "..kakcwkkwckak..", "..kakccwwcckak..", "..kakkkkkkkkak..",
  "..kaaaaaaaaaak..", "..kaokkkkkkoak..", "..kaawkwkwkaak..", "..kkaaaaaaaakk..",
  "...kkkkkkkkkk...", "....k.k..k.k....", "................", "................",
];

function Sprite({ accent = "#d40e31", eye = "#ff1f3f", id = 0 }) {
  const C = { k: "#0b0708", a: accent, w: "#f5ede2", c: eye, o: "#d40e31" };
  const rects = [];
  PIX.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      let c = ch;
      if (y === 5 && id % 3 === 1 && (x === 6 || x === 9)) c = "k";
      if (y === 6 && id % 3 === 2 && (x === 7 || x === 8)) c = "c";
      if (C[c]) rects.push(<rect key={x + "-" + y} x={x} y={y} width="1" height="1" fill={C[c]} />);
    });
  });
  return <svg viewBox="0 0 16 16" role="img" aria-label="sprite">{rects}</svg>;
}

function Slab({ rot = 0, clip = "a", face = "crim", className = "", delay = 0, children, ...rest }) {
  return (
    <div className={`slab c-${clip} f-${face} ${className}`} style={{ "--rot": `${rot}deg`, animationDelay: `${delay}ms` }} {...rest}>
      <div className="edge" />
      <div className="face">{children}</div>
    </div>
  );
}

function Win({ title, tag, dark, crimbar, goldbar, className = "", children, ...rest }) {
  return (
    <div className={`win ${dark ? "dark" : ""} ${crimbar ? "crimbar" : ""} ${goldbar ? "goldbar" : ""} ${className}`} {...rest}>
      <div className="bar">
        <span className="wdots"><i /><i /><i /></span>
        <span className="wtitle">{title}</span>
        {tag && <span className="wtag">{tag}</span>}
      </div>
      <div className="inner">{children}</div>
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */
export default function HayfelSpace() {
  const [booting, setBooting] = useState(true);
  const [bootP, setBootP] = useState(0);
  const [chan, setChan] = useState("TODO");
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [typed, setTyped] = useState("");
  const [visits, setVisits] = useState(13407);
  const [tick, setTick] = useState(0);
  const [sound, setSound] = useState(false);
  const [meter, setMeter] = useState(0);
  const [bgIdx, setBgIdx] = useState(0);
  const [guests, setGuests] = useState([
    { n: "ana_delcampo", m: "me encanta que esto no parezca hecho con plantilla" },
    { n: "estefan", m: "la receta del curry me salvó la cena, gracias" },
    { n: "anon", m: "volví solo para arrastrar el sticker" },
  ]);
  const [gname, setGname] = useState("");
  const [gmsg, setGmsg] = useState("");
  const synth = useRef(null);
  const rootRef = useRef(null);

  const list = chan === "TODO" ? POSTS : POSTS.filter((p) => p.cat === chan);
  const featured = list[idx % list.length] || POSTS[0];
  const bgStyle = BGSTYLES[bgIdx % BGSTYLES.length];

  const blip = useCallback((note = "C6") => {
    if (!sound || !synth.current) return;
    try { synth.current.triggerAttackRelease(note, "32n"); } catch (e) { /* silencio */ }
  }, [sound]);

  async function toggleSound() {
    if (sound) { setSound(false); return; }
    try {
      await Tone.start();
      if (!synth.current) {
        synth.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "square" },
          envelope: { attack: .001, decay: .09, sustain: 0, release: .05 },
        }).toDestination();
        synth.current.volume.value = -20;
      }
      setSound(true);
      synth.current.triggerAttackRelease("A5", "32n");
    } catch (e) { setSound(false); }
  }

  function cycleBg() {
    setBgIdx((i) => (i + 1) % BGSTYLES.length);
    blip("D6");
  }

  useEffect(() => {
    const t = setInterval(() => {
      setBootP((p) => {
        const n = Math.min(100, p + 9 + Math.random() * 14);
        if (n >= 100) { clearInterval(t); setTimeout(() => { setBooting(false); setMeter(62); }, 420); }
        return n;
      });
    }, 160);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (booting) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setTyped(featured.b); return; }
    setTyped(""); let n = 0;
    const t = setInterval(() => {
      n += 5; setTyped(featured.b.slice(0, n));
      if (n >= featured.b.length) clearInterval(t);
    }, 12);
    return () => clearInterval(t);
  }, [featured, booting]);

  useEffect(() => {
    if (!playing || booting) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 9000);
    return () => clearInterval(t);
  }, [playing, booting, list.length]);

  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 3200); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let last = 0;
    const h = (e) => {
      const now = performance.now(); if (now - last < 55) return; last = now;
      const d = document.createElement("div");
      d.style.cssText = `position:fixed;width:8px;height:8px;z-index:800;pointer-events:none;left:${e.clientX - 4}px;top:${e.clientY - 4}px;background:${Math.random() > .5 ? "#ff1f3f" : "#0b0708"}`;
      document.body.appendChild(d);
      d.animate([{ opacity: .9, transform: "scale(1)" }, { opacity: 0, transform: "scale(0)" }],
        { duration: 480, easing: "ease-out" }).onfinish = () => d.remove();
    };
    window.addEventListener("pointermove", h, { passive: true });
    return () => window.removeEventListener("pointermove", h);
  }, []);

  function confetti(x, y) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cols = ["#0b0708", "#d40e31", "#ff1f3f", "#f5ede2", "#ffc300", "#6e0a1c"];
    for (let i = 0; i < 26; i++) {
      const d = document.createElement("div");
      const star = i % 3 === 0;
      d.style.cssText = `position:fixed;width:11px;height:11px;z-index:800;pointer-events:none;left:${x}px;top:${y}px;background:${cols[i % cols.length]};${star ? "clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);" : ""}`;
      document.body.appendChild(d);
      d.animate([{ transform: "translate(0,0) rotate(0)", opacity: 1 },
      { transform: `translate(${(Math.random() - .5) * 300}px,${120 + Math.random() * 240}px) rotate(${Math.random() * 900}deg)`, opacity: 0 }],
        { duration: 950 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = () => d.remove();
    }
  }

  function pick(post, e) {
    const i = list.indexOf(post);
    setIdx(i < 0 ? 0 : i); setPlaying(false); blip("E6");
    if (e) confetti(e.clientX, e.clientY);
    rootRef.current?.querySelector(".tv")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function sign() {
    if (!gmsg.trim()) return;
    setGuests([{ n: gname.trim() || "anon", m: gmsg.trim() }, ...guests]);
    setGname(""); setGmsg(""); blip("A5");
  }

  const AV = ["#d40e31", "#0b0708", "#ff1f3f", "#ffc300", "#6e0a1c"];
  const hour = new Date().getHours();
  const clockStr = useMemo(() => new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }), [tick]);
  const bootFill = Math.round(bootP / 5);

  return (
    <div className="hs" ref={rootRef}>
      <style>{CSS}</style>

      <div className="bglayer" style={{ backgroundImage: PATTERNS[bgStyle.id], "--tsize": `${TILESIZE[bgStyle.id]}px` }} aria-hidden="true" />
      <div className="grainlayer" style={{ backgroundImage: GRAIN }} aria-hidden="true" />
      <Papers />
      <div className="vig" aria-hidden="true" />

      <div className={`boot ${booting ? "" : "off"}`} role="status">
        <div className="bgp" style={{ backgroundImage: PATTERNS.grid }} aria-hidden="true" />
        <div className="bootwin">
          <div className="bbar"><i /><i /><i /><span style={{ marginLeft: 6 }}>SISTEMA.BOOT</span></div>
          <div className="bbody">
            <h3>HAYFEL<br />SPACE</h3>
            <div className="sub">iniciando interfaz personal</div>
            <div className="bootlog">
              {BOOTLOG.map((l, i) => {
                const threshold = ((i + 1) / BOOTLOG.length) * 100;
                if (bootP < threshold - 25) return null;
                const done = bootP >= threshold;
                return <div key={l}><span className={done ? "ok" : ""}>{done ? "> " : "· "}{l}</span></div>;
              })}
              <span className="cur" />
            </div>
            <div className="bootgrid">
              {Array.from({ length: 20 }).map((_, i) => <i key={i} className={i < bootFill ? "fill" : ""} />)}
            </div>
            <div className="bootpct"><span>CARGANDO</span><span>{Math.min(100, Math.round(bootP))}%</span></div>
          </div>
        </div>
      </div>

      <div className="wrap">

        {/* ---------- CABECERA: taskbar tipo ventana + estampa irregular ---------- */}
        <header className="head">
          <Slab rot={-4} clip="shard" face="shadow" className="stamp hover">
            <h1>HAYFEL<span>TRANSMITE</span></h1>
          </Slab>

          <div className="win taskbar">
            <span className="wdots"><i /><i /><i /></span>
            <span className="wname">HAYFELSPACE.EXE</span>
            <nav className="tabs">
              {CHANNELS.map((c, i) => (
                <button key={c.k} className={`tabbtn ${chan === c.k ? "on" : ""}`}
                  onClick={() => { setChan(c.k); setIdx(0); setPlaying(true); blip("C6"); }}>
                  <Sprite accent={c.accent} eye={i % 2 ? "#f5ede2" : "#ff1f3f"} id={i} />
                  {c.k}
                </button>
              ))}
            </nav>
            <span className="clock">{clockStr}</span>
            <button className={`snd2 ${sound ? "on" : ""}`} onClick={toggleSound}>
              {sound ? <Volume2 size={13} /> : <VolumeX size={13} />} {sound ? "ON" : "OFF"}
            </button>
          </div>

          <nav className="quicknav">
            {[["ENTRADAS", "#banners"], ["PROGRAMA", "#prog"], ["VISITAS", "#gb"], ["REDES", "#redes"], ["LINKS", "#pie"]].map(([txt, href]) => (
              <button key={txt} className="qbtn" onClick={() => { blip("B5"); document.querySelector(href)?.scrollIntoView({ behavior: "smooth" }); }}>
                {txt}
              </button>
            ))}
          </nav>
        </header>

        {/* ---------- CONSOLA ---------- */}
        <section className="console">
          <Slab rot={-1} clip="torn" face="crim" className="screen" delay={140}>
            <div className="tv">
              <div className="grain" style={{ backgroundImage: TV_PATTERN }} aria-hidden="true" />
              <span className="cat">{featured.cat}</span>{" "}
              <span className="date">{featured.d}</span>
              <h2>{featured.t}</h2>
              <div className="body">{typed}</div>
            </div>
          </Slab>

          <Win title="REPRODUCTOR" tag={`${idx % list.length + 1}/${list.length}`} className="side">
            <div className="transport2">
              <button className="tbtn2" onClick={() => { setIdx((i) => (i - 1 + list.length) % list.length); setPlaying(false); blip("D5"); }}><SkipBack size={15} /></button>
              <button className="tbtn2" onClick={() => { setPlaying(!playing); blip("G5"); }}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>
              <button className="tbtn2" onClick={() => { setIdx((i) => (i + 1) % list.length); setPlaying(false); blip("F5"); }}><SkipForward size={15} /></button>
            </div>
            <div>
              <div className="stat"><b>canal</b><span>{chan}</span></div>
              <div className="stat"><b>sonando</b><span>{SONGS[tick % SONGS.length]}</span></div>
              <div className="stat"><b>humor</b><span>{MOODS[tick % MOODS.length]}</span></div>
            </div>
            <div className="hint">se avanza solo cada 9s, o usa los botones</div>
          </Win>
        </section>

        {/* ---------- TRES PANELES ---------- */}
        <section className="row3" id="prog">
          <Win title="PROGRAMACIÓN DE HOY" crimbar>
            <div className="inset sched">
              {SCHEDULE.map(([t, w]) => {
                const h = parseInt(t, 10);
                const live = hour >= h && hour < h + 2;
                return <div key={t}><b>{t}</b><span className={live ? "live" : ""}>{w}</span></div>;
              })}
            </div>
            <div className="hint">en rojo = lo que debería estar haciendo</div>
          </Win>

          <Win title="PERFIL.EXE" goldbar>
            <div className="pfp">
              <Sprite accent="#d40e31" eye="#ff1f3f" />
              <div>
                <div className="kick">HOLA!! soy Hayfel</div>
                <div className="bio">
                  <p style={{ margin: "0 0 8px" }}>Estudio ingeniería en la UACJ y ahorita vivo dentro de mi tesis: un sistema de varios agentes que se pelean entre ellos para limpiar requisitos ambiguos.</p>
                  <p style={{ margin: 0 }}>Fuera de eso: fierros por la tarde, cocinar con demasiada especia, y dibujar cuando el compilador me deja en paz.</p>
                </div>
                <div className="badges">
                  <span>CIUDAD JUÁREZ</span><span>UACJ</span><span>GYM 5PM</span><span>LANGGRAPH</span>
                </div>
              </div>
            </div>
          </Win>

          <Slab rot={1.8} clip="b" face="deep" delay={340}>
            <div style={{ padding: 14 }}>
              <div style={{ fontFamily: "var(--fat)", fontSize: 17, marginBottom: 9 }}>AHORA MISMO</div>
              <ul className="nowl">
                <li><b>leyendo</b><span>papers de RE</span></li>
                <li><b>comiendo</b><span>pollo, otra vez</span></li>
                <li><b>tesis</b><span>capítulo 4</span></li>
              </ul>
              <div style={{ fontSize: 10, letterSpacing: 2, marginTop: 12 }}>62% ESCRITO</div>
              <div className="meter"><i style={{ width: `${meter}%` }} /></div>
              <div className="hint" style={{ opacity: .85 }}>100% ansiedad</div>
            </div>
          </Slab>
        </section>

        {/* ---------- TICKER ---------- */}
        <section className="strip">
          <Slab rot={-2} clip="tab" face="flare" className="striplabel" delay={380}>¿QUÉ HAY?</Slab>
          <div className="tickwrap"><span>
            canal actual: {chan} ~ {list.length} entradas en cola ~ el libro de visitas está abierto ~ arrastra los stickers ~ sin algoritmo, sin ads, puro yo ~
          </span></div>
          <div className="stripbtns">
            <button className="minib" onClick={() => { blip("C6"); document.querySelector("#prog")?.scrollIntoView({ behavior: "smooth" }); }}>HORARIOS</button>
            <button className="minib" onClick={(e) => { setVisits(visits + 1); confetti(e.clientX, e.clientY); blip("E6"); }}>CLICK DIARIO</button>
          </div>
        </section>

        {/* ---------- BANNERS: bento, mezcla de tamaños y formas ---------- */}
        <section className="banners" id="banners">
          {list.slice(0, 4).map((p, i) => (
            i === 0 ? (
              <Win key={p.t} title={p.cat} tag={p.d} crimbar className={`ban lg hover`} onClick={(e) => pick(p, e)}>
                <div className="n">DESTACADO · N°01</div>
                <h4>{p.t}</h4>
                <span className="go">LEER YA!</span>
              </Win>
            ) : (
              <Slab key={p.t} rot={i % 2 ? 2.4 : -2.4} clip={i % 2 ? "b" : "torn"} face={p.face}
                className="ban hover" delay={420 + i * 80} onClick={(e) => pick(p, e)}>
                <div className="k">{p.cat} · {p.d}</div>
                <h4>{p.t}</h4>
                <span className="go">LEER YA!</span>
              </Slab>
            )
          ))}
        </section>

        {/* ---------- PANELES DE PAPEL ---------- */}
        <section className="row2" id="gb">
          <Win title="LIBRO DE VISITAS">
            <div className="gbform">
              <input value={gname} onChange={(e) => setGname(e.target.value)} placeholder="tu nombre" maxLength={18} aria-label="Tu nombre" />
              <input value={gmsg} onChange={(e) => setGmsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sign()}
                placeholder="deja algo escrito..." maxLength={140} aria-label="Tu mensaje" />
              <button onClick={sign}>FIRMAR</button>
            </div>
            <div className="gblist">
              {guests.map((g, i) => (
                <div className="gbitem" key={i + g.m}>
                  <div className="av" style={{ background: AV[i % AV.length] }} />
                  <div><div className="who">&gt;&gt; {g.n}</div><p>{g.m}</p></div>
                </div>
              ))}
            </div>
            <div className="hint">las firmas se borran al recargar (prototipo, todavía sin base de datos)</div>
          </Win>

          <div style={{ display: "grid", gap: 16 }}>
            <Win title="ARCHIVO">
              <ul className="arch">
                {POSTS.map((p) => (
                  <li key={p.t} onClick={(e) => { setChan("TODO"); setTimeout(() => pick(p, e), 0); }}>
                    <em>{p.d}</em><span>{p.t}</span>
                  </li>
                ))}
              </ul>
            </Win>
            <Win title="OBSESIONES">
              <div className="tags">
                <span>agentes LLM</span><span>pixel art</span><span>upper/lower</span>
                <span>curry</span><span>CSS plano a propósito</span><span>PRISMA</span><span>webrings</span>
              </div>
            </Win>
          </div>
        </section>

        {/* ---------- REDES ---------- */}
        <section className="redwrap" id="redes">
          <Slab rot={4} clip="tab" face="gold" className="redsoon hover">PRONTO</Slab>
          <Win title="REDES SOCIALES" tag="preparando enlaces" crimbar>
            <div className="redgrid">
              {SOCIALS.map((s) => {
                const Body = (
                  <>
                    <span className="ico">{s.icon ? <s.icon /> : <b>{s.mono}</b>}</span>
                    <span className="txt">
                      <span className="plat">{s.k}</span>
                      <span className="handle">{s.handle}</span>
                    </span>
                    <span className="tag">{s.href ? "ABRIR" : "PRONTO"}</span>
                  </>
                );
                return s.href ? (
                  <a key={s.k} className="redcard" href={s.href} target="_blank" rel="noreferrer">{Body}</a>
                ) : (
                  <div key={s.k} className="redcard soon" aria-disabled="true">{Body}</div>
                );
              })}
            </div>
            <div className="hint">los links todavía no están puestos, pero las tarjetas ya están listas — solo falta rellenar el href de cada una en SOCIALS.</div>
          </Win>
        </section>

        {/* ---------- PIE: ventana regular con estampas irregulares dentro ---------- */}
        <Win title="HAYFELSPACE" tag="© 2026" className="foot" id="pie">
          <div className="inner">
            <div>
              <div style={{ letterSpacing: 2, marginBottom: 6 }}>VISITAS</div>
              <div className="counter">
                {String(visits).padStart(6, "0").split("").map((n, i) => <i key={i}>{n}</i>)}
              </div>
            </div>
            <div className="ring">
              <span className="b88" style={{ "--r": "-4deg" }}>CÓDIGO<br />ABIERTO</span>
              <span className="b88 x" style={{ "--r": "3deg" }}>SIN<br />ADS</span>
              <span className="b88 y" style={{ "--r": "-2deg" }}>HECHO<br />A MANO</span>
            </div>
            <div style={{ textAlign: "right", lineHeight: 1.6, fontSize: 11 }}>
              se ve mejor con la ventana grande<br />
              <span style={{ opacity: .7 }}>fondo actual: {bgStyle.label.toLowerCase()}</span>
            </div>
          </div>
        </Win>
      </div>

      <Stickers />

      <button className="bgswitch" onClick={cycleBg} aria-label="Cambiar fondo">
        <RefreshCw size={13} />
        FONDO: {bgStyle.label}
        <span className="dotsrow">
          {BGSTYLES.map((b, i) => <i key={b.id} className={i === bgIdx ? "on" : ""} />)}
        </span>
      </button>
    </div>
  );
}

/* ============================================================
   STICKERS ARRASTRABLES
   ============================================================ */
function Sticker({ children, x, y, className = "" }) {
  const [pos, setPos] = useState({ x, y });
  const off = useRef({ x: 0, y: 0 });
  const drag = useRef(false);
  return (
    <div className={`stick ${className}`} style={{ left: pos.x, top: pos.y }}
      onPointerDown={(e) => {
        drag.current = true; e.currentTarget.setPointerCapture(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        off.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const p = e.currentTarget.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
        setPos({ x: e.clientX - off.current.x - p.left, y: e.clientY - off.current.y - p.top });
      }}
      onPointerUp={() => { drag.current = false; }}>
      {children}
    </div>
  );
}

function Papers() {
  return (
    <div className="papers-bg" aria-hidden="true">
      {PAPER_POS.map((p, i) => {
        const s = PAPER_SNIPPETS[i % PAPER_SNIPPETS.length];
        return (
          <div key={i} className="paperfloat" style={{
            left: p.x, top: p.y, "--pr": `${p.r}deg`,
            animationDuration: `${p.d}s`, animationDelay: `${p.dl}s`,
          }}>
            <b>{s.k}</b>{s.t}
          </div>
        );
      })}
    </div>
  );
}

function Stickers() {
  return (
    <>
      <Sticker x={14} y={250}><div className="star" /></Sticker>
      <Sticker x={2} y={640}><div className="boom">POW!</div></Sticker>
      <Sticker x={24} y={920}>
        <div className="note"><b>NOTA AL MARGEN</b>arrástrame. sí, en serio, agárrame con el mouse.</div>
      </Sticker>
    </>
  );
}
