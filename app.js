"use strict";
const I18N = {
  es: {
    title:"Metallicus, verificado", tagline:"Cada dato enlaza a su fuente.", search:"Buscar",
    searchPh:"Buscar persona, empresa, producto…", vMap:"Mapa", vList:"Lista", vTime:"Cronología", vAbout:"Método",
    sConfirmed:"Confirmado", sConfirmedD:"registro oficial, publicación de ambas partes o prensa independiente fiable",
    sSelf:"Según la parte interesada", sSelfD:"solo lo afirma Metallicus o la propia persona/empresa",
    sDisputed:"Fuentes discrepan", sDisputedD:"se muestran las versiones con sus fuentes",
    mapHint:"Toca un elemento para ver sus datos y fuentes. Línea continua: confirmado. Discontinua: según la parte interesada.",
    close:"Cerrar", updated:"Datos revisados el", footNote:"No es asesoramiento financiero. ¿Ves un error? Abre un issue en GitHub con la fuente.",
    facts:"Datos", relations:"Relaciones", website:"Web oficial", sources:"Fuentes", noResults:"Ningún elemento coincide con la búsqueda.",
    open:"Ver ficha", nFacts:n=>`${n} dato${n===1?"":"s"}`,
    groups:{core:"Metallicus",people:"Personas",products:"Productos y tecnología",partners:"Socios y acuerdos",history:"Historia previa",regulatory:"Regulación y tribunales"},
    types:{person:"Persona",company:"Empresa",product:"Producto",token:"Token",blockchain:"Blockchain",organization:"Organización",event:"Evento",regulatory:"Regulación"},
    st:{confirmed:"Confirmado",self:"Según la parte interesada",disputed:"Fuentes discrepan"}
  },
  en: {
    title:"Metallicus, verified", tagline:"Every fact links to its source.", search:"Search",
    searchPh:"Search a person, company, product…", vMap:"Map", vList:"List", vTime:"Timeline", vAbout:"Method",
    sConfirmed:"Confirmed", sConfirmedD:"official record, publication by both parties or reliable independent press",
    sSelf:"Per the interested party", sSelfD:"only Metallicus or the person/company itself says so",
    sDisputed:"Sources disagree", sDisputedD:"each version is shown with its source",
    mapHint:"Tap an item to see its facts and sources. Solid line: confirmed. Dashed: per the interested party.",
    close:"Close", updated:"Data reviewed on", footNote:"Not financial advice. Spotted a mistake? Open a GitHub issue with the source.",
    facts:"Facts", relations:"Relationships", website:"Official site", sources:"Sources", noResults:"Nothing matches your search.",
    open:"Open", nFacts:n=>`${n} fact${n===1?"":"s"}`,
    groups:{core:"Metallicus",people:"People",products:"Products and tech",partners:"Partners and agreements",history:"Earlier history",regulatory:"Regulation and courts"},
    types:{person:"Person",company:"Company",product:"Product",token:"Token",blockchain:"Blockchain",organization:"Organization",event:"Event",regulatory:"Regulatory"},
    st:{confirmed:"Confirmed",self:"Per the interested party",disputed:"Sources disagree"}
  }
};
const GROUPS = ["core","people","products","partners","history","regulatory"];
const GVAR = g => `var(--g-${g})`;
const ABOUT = {
  es:`<h2>Cómo se ha hecho</h2>
<p>Este mapa parte de un mapa anterior en Kumu. Se revisó cada elemento y cada conexión, se eliminó todo lo que no tenía fuente y se investigó de nuevo cada entidad.</p>
<h3>Qué entra</h3>
<ul><li><b>Confirmado</b>: lo respalda un registro oficial (regulador, tribunal), una publicación de ambas partes o prensa independiente fiable. Un comunicado de Metallicus que solo cita a su socio no basta.</li>
<li><b>Según la parte interesada</b>: solo lo dice Metallicus, la propia persona o la propia empresa. Es verificable que lo afirman, no que sea cierto.</li>
<li><b>Fuentes discrepan</b>: hay fuentes fiables con versiones distintas, y se muestran todas.</li></ul>
<h3>Qué no entra</h3>
<p>Rumores, especulación, publicaciones de foros o redes sociales, resúmenes automáticos y cualquier dato que no se haya podido comprobar en una fuente abierta y enlazada. Tampoco personas u organizaciones sin relación documentada con Metallicus o su equipo.</p>
<h3>Correcciones</h3>
<p>Si un dato está mal o una fuente ha cambiado, abre un issue en el repositorio de GitHub con el enlace a la fuente.</p>`,
  en:`<h2>How this was made</h2>
<p>This map started from an earlier Kumu map. Every element and connection was checked, anything without a source was removed, and each entity was researched again.</p>
<h3>What is included</h3>
<ul><li><b>Confirmed</b>: backed by an official record (regulator, court), a publication by both parties, or reliable independent press. A Metallicus release that only quotes its partner is not enough.</li>
<li><b>Per the interested party</b>: only Metallicus, the person or the company itself says it. It is verifiable that they claim it, not that it is true.</li>
<li><b>Sources disagree</b>: reliable sources give different versions, and all are shown.</li></ul>
<h3>What is left out</h3>
<p>Rumours, speculation, forum or social media posts, automated summaries and anything that could not be checked against an open, linked source. Also people or organisations with no documented relationship to Metallicus or its team.</p>
<h3>Corrections</h3>
<p>If a fact is wrong or a source has changed, open an issue in the GitHub repository with a link to the source.</p>`
};

let lang = new URLSearchParams(location.search).get("lang")==="en" ? "en" : "es";
try{ const saved=localStorage.getItem("lang"); if(saved==="es"||saved==="en") lang=saved; }catch(e){}
let DATA, byId = {}, cy, view, activeGroups = new Set(GROUPS), query = "", current = null;
const T = () => I18N[lang];
const L = (o,k) => o[`${k}_${lang}`] || o[`${k}_es`] || o[`${k}_en`] || "";
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $ = s => document.querySelector(s);

function fmtDate(d){
  if(!d) return "";
  const [y,m,day]=d.split("-");
  if(!m) return y;
  const dt=new Date(Date.UTC(+y,+m-1,+(day||1)));
  return dt.toLocaleDateString(lang==="es"?"es-ES":"en-GB",day?{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}:{month:"short",year:"numeric",timeZone:"UTC"});
}
function srcLinks(sources){
  return (sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title||new URL(s.url).hostname)}</a>`).join(" · ");
}

async function init(){
  const res = await fetch("data/graph.json",{cache:"no-cache"});
  DATA = await res.json();
  DATA.nodes.forEach(n=>byId[n.id]=n);
  $("#updated").textContent = DATA.updated ? fmtDate(DATA.updated) : "";
  buildFilters();
  document.querySelectorAll(".seg button").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  $("#lang").addEventListener("click",()=>{lang=lang==="es"?"en":"es";try{localStorage.setItem("lang",lang)}catch(e){};applyLang();});
  $("#close").addEventListener("click",closePanel);
  $("#q").addEventListener("input",e=>{query=e.target.value.trim().toLowerCase();refresh();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closePanel();});
  window.addEventListener("hashchange",fromHash);
  applyLang();
  setView(matchMedia("(max-width:820px)").matches?"list":"map");
  fromHash();
}
function applyLang(){
  document.documentElement.lang=lang;
  $("#lang").textContent = lang==="es"?"EN":"ES";
  document.querySelectorAll("[data-i18n]").forEach(el=>{const v=T()[el.dataset.i18n]; if(typeof v==="string") el.textContent=v;});
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>el.placeholder=T()[el.dataset.i18nPh]);
  document.querySelectorAll("[data-i18n-aria]").forEach(el=>el.setAttribute("aria-label",T()[el.dataset.i18nAria]));
  document.title = T().title;
  $("#about").innerHTML = ABOUT[lang];
  buildFilters(); refresh();
  if(cy) cy.edges().forEach(e=>e.data("label",L(e.data("raw"),"label")));
  if(current) openNode(current,false);
}
function buildFilters(){
  const counts={}; DATA.nodes.forEach(n=>counts[n.group]=(counts[n.group]||0)+1);
  $("#filters").innerHTML = GROUPS.filter(g=>counts[g]).map(g=>`<button class="chip" style="--c:${GVAR(g)}" data-g="${g}" aria-pressed="${activeGroups.has(g)}"><span class="dot"></span>${esc(T().groups[g])} <small>${counts[g]}</small></button>`).join("");
  document.querySelectorAll(".chip").forEach(b=>b.addEventListener("click",()=>{
    const g=b.dataset.g; activeGroups.has(g)?activeGroups.delete(g):activeGroups.add(g);
    b.setAttribute("aria-pressed",activeGroups.has(g)); refresh();
  }));
}
function matches(n){
  if(!activeGroups.has(n.group)) return false;
  if(!query) return true;
  const hay=[n.name,n.summary_es,n.summary_en,...(n.facts||[]).map(f=>f.es+" "+f.en)].join(" ").toLowerCase();
  return hay.includes(query);
}
function setView(v){
  view=v;
  document.querySelectorAll(".seg button").forEach(b=>b.setAttribute("aria-selected",b.dataset.view===v));
  ["map","list","time","about"].forEach(k=>$(`#view-${k}`).hidden = k!==v);
  $("#legend").hidden = v==="about"; $("#filters").hidden = v==="about";
  if(v==="map"){ if(!cy) buildGraph(); else {cy.resize();} }
  refresh();
}
function refresh(){
  if(!DATA) return;
  if(view==="list") renderList();
  if(view==="time") renderTimeline();
  if(view==="map" && cy){
    cy.batch(()=>{cy.nodes().forEach(n=>{const ok=matches(byId[n.id()]); n.style("display",activeGroups.has(byId[n.id()].group)?"element":"none"); n.toggleClass("dim",!ok);});});
  }
}

function buildGraph(){
  if(typeof cytoscape==="undefined"){ setTimeout(buildGraph,100); return; }
  const deg={}; DATA.edges.forEach(e=>{deg[e.from]=(deg[e.from]||0)+1;deg[e.to]=(deg[e.to]||0)+1;});
  const css=getComputedStyle(document.documentElement);
  const v=k=>css.getPropertyValue(k).trim();
  cy = cytoscape({
    container: $("#cy"),
    elements: [
      ...DATA.nodes.map(n=>({data:{id:n.id,label:n.name,color:v(`--g-${n.group}`),size:22+Math.min(30,(deg[n.id]||0)*3)}})),
      ...DATA.edges.filter(e=>byId[e.from]&&byId[e.to]).map((e,i)=>({data:{id:"e"+i,source:e.from,target:e.to,label:L(e,"label"),status:e.status,raw:e}}))
    ],
    style:[
      {selector:"node",style:{"background-color":"data(color)",width:"data(size)",height:"data(size)",label:"data(label)","font-family":"Public Sans, sans-serif","font-size":11,"font-weight":600,color:v("--ink"),"text-valign":"bottom","text-margin-y":4,"text-wrap":"wrap","text-max-width":110,"text-background-color":v("--bg"),"text-background-opacity":.8,"text-background-padding":2}},
      {selector:"edge",style:{width:1.5,"line-color":v("--muted"),"curve-style":"bezier","target-arrow-shape":"triangle","target-arrow-color":v("--muted"),"arrow-scale":.7,opacity:.55}},
      {selector:'edge[status="self"]',style:{"line-style":"dashed","line-color":v("--self"),"target-arrow-color":v("--self")}},
      {selector:'edge[status="disputed"]',style:{"line-style":"dotted","line-color":v("--disp"),"target-arrow-color":v("--disp")}},
      {selector:'edge[status="confirmed"]',style:{"line-color":v("--ok"),"target-arrow-color":v("--ok")}},
      {selector:".dim",style:{opacity:.15}},
      {selector:"node.focus",style:{"border-width":3,"border-color":v("--ink")}},
      {selector:"edge.hl",style:{opacity:1,width:2.5,label:"data(label)","font-size":10,color:v("--ink"),"text-rotation":"autorotate","text-background-color":v("--surface"),"text-background-opacity":1,"text-background-padding":2}}
    ],
    layout:{name:"cose",animate:false,nodeRepulsion:()=>9000,idealEdgeLength:()=>90,gravity:.25,padding:30,randomize:true,numIter:2500},
    minZoom:.25,maxZoom:3,wheelSensitivity:.25
  });
  cy.on("tap","node",e=>openNode(e.target.id()));
  cy.on("tap",e=>{if(e.target===cy) closePanel();});
  refresh();
}

function renderList(){
  const shown=DATA.nodes.filter(matches);
  if(!shown.length){$("#list").innerHTML=`<p>${esc(T().noResults)}</p>`;return;}
  $("#list").innerHTML = GROUPS.map(g=>{
    const ns=shown.filter(n=>n.group===g).sort((a,b)=>a.name.localeCompare(b.name));
    if(!ns.length) return "";
    return `<section class="grp" style="--c:${GVAR(g)}"><h2><span class="dot"></span>${esc(T().groups[g])}</h2>${ns.map(n=>`<button class="item" data-id="${n.id}"><b>${esc(n.name)}</b><span>${esc(L(n,"summary"))}</span><small>${T().nFacts((n.facts||[]).length)}</small></button>`).join("")}</section>`;
  }).join("");
  document.querySelectorAll(".item").forEach(b=>b.addEventListener("click",()=>openNode(b.dataset.id)));
}
function renderTimeline(){
  const rows=[];
  DATA.nodes.filter(matches).forEach(n=>(n.facts||[]).forEach(f=>{if(f.date) rows.push({d:f.date,f,n});}));
  rows.sort((a,b)=>a.d.localeCompare(b.d));
  $("#timeline").innerHTML = rows.length? rows.map(r=>`<li class="t"><time>${esc(fmtDate(r.d))}</time><span class="mark ${r.f.status}" title="${esc(T().st[r.f.status])}"></span><div><p>${esc(r.f[lang]||r.f.es)}</p><button data-id="${r.n.id}">${esc(r.n.name)}</button></div></li>`).join("") : `<li>${esc(T().noResults)}</li>`;
  document.querySelectorAll("#timeline button").forEach(b=>b.addEventListener("click",()=>openNode(b.dataset.id)));
}

function openNode(id,push=true){
  const n=byId[id]; if(!n) return; current=id;
  const rels=DATA.edges.filter(e=>(e.from===id||e.to===id)&&byId[e.from]&&byId[e.to]);
  const facts=[...(n.facts||[])].sort((a,b)=>(a.date||"9").localeCompare(b.date||"9"));
  $("#detail").innerHTML = `
    <span class="d-type" style="--c:${GVAR(n.group)}"><span class="dot"></span>${esc(T().types[n.type]||n.type)} · ${esc(T().groups[n.group])}</span>
    <h2>${esc(n.name)}</h2>
    <p class="d-sum">${esc(L(n,"summary"))}</p>
    ${n.website?`<p class="d-site"><a href="${esc(n.website)}" target="_blank" rel="noopener noreferrer">${esc(T().website)}</a></p>`:""}
    ${facts.length?`<h3>${esc(T().facts)}</h3><ul class="facts">${facts.map(f=>`<li class="fact"><span class="mark ${f.status}" title="${esc(T().st[f.status])}"></span><p>${esc(f[lang]||f.es)}</p><div class="meta">${f.date?`<time>${esc(fmtDate(f.date))}</time> · `:""}${esc(T().st[f.status])} · ${srcLinks(f.sources)}</div></li>`).join("")}</ul>`:""}
    ${rels.length?`<h3>${esc(T().relations)}</h3>${rels.map(e=>{const other=e.from===id?e.to:e.from;const txt=e.from===id?`${esc(L(e,"label"))} <button data-id="${other}">${esc(byId[other].name)}</button>`:`<button data-id="${other}">${esc(byId[other].name)}</button> ${esc(L(e,"label"))} ${esc(n.name)}`;return `<div class="rel"><span class="mark ${e.status}" title="${esc(T().st[e.status])}"></span><div>${txt}<div class="src">${e.date?esc(fmtDate(e.date))+" · ":""}${srcLinks(e.sources)}</div></div></div>`}).join("")}`:""}`;
  $("#detail").querySelectorAll("button[data-id]").forEach(b=>b.addEventListener("click",()=>openNode(b.dataset.id)));
  $("#panel").hidden=false; $("#panel").scrollTop=0;
  if(cy){cy.elements().removeClass("focus hl");const nd=cy.getElementById(id);nd.addClass("focus");nd.connectedEdges().addClass("hl");cy.resize();}
  if(push && location.hash!==`#${id}`) history.replaceState(null,"",`#${id}`);
}
function closePanel(){
  $("#panel").hidden=true; current=null;
  if(cy){cy.elements().removeClass("focus hl");cy.resize();}
  if(location.hash) history.replaceState(null,"",location.pathname+location.search);
}
function fromHash(){const id=decodeURIComponent(location.hash.slice(1)); if(id&&byId[id]) openNode(id,false);}
document.addEventListener("DOMContentLoaded",init);
