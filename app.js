"use strict";
const I18N = {
  es: {
    title:"Metallicus, verificado", tagline:"Cada dato enlaza a su fuente.", search:"Buscar",
    searchPh:"Buscar persona, empresa, producto…", vMap:"Mapa", vList:"Lista", vTime:"Cronología", vAbout:"Método",
    sConfirmed:"Confirmado", sConfirmedD:"registro oficial, publicación de ambas partes o prensa independiente fiable",
    sSelf:"Según la parte interesada", sSelfD:"solo lo afirma Metallicus o la propia persona/empresa",
    sDisputed:"Fuentes discrepan", sDisputedD:"se muestran las versiones con sus fuentes",
    mapHint:"Toca un elemento para ver sus datos y fuentes. Pellizca para ampliar.",
    back:"Volver", updated:"Datos revisados el", footNote:"No es asesoramiento financiero.", report:"Avisar de un error",
    facts:"Datos", relations:"Relaciones", website:"Web oficial", noResults:"Ningún elemento coincide con la búsqueda.",
    image:"Imagen", nFacts:n=>`${n} dato${n===1?"":"s"}`,
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
    mapHint:"Tap an item to see its facts and sources. Pinch to zoom.",
    back:"Back", updated:"Data reviewed on", footNote:"Not financial advice.", report:"Report a mistake",
    facts:"Facts", relations:"Relationships", website:"Official site", noResults:"Nothing matches your search.",
    image:"Image", nFacts:n=>`${n} fact${n===1?"":"s"}`,
    groups:{core:"Metallicus",people:"People",products:"Products and tech",partners:"Partners and agreements",history:"Earlier history",regulatory:"Regulation and courts"},
    types:{person:"Person",company:"Company",product:"Product",token:"Token",blockchain:"Blockchain",organization:"Organization",event:"Event",regulatory:"Regulatory"},
    st:{confirmed:"Confirmed",self:"Per the interested party",disputed:"Sources disagree"}
  }
};
const GROUPS = ["core","people","products","partners","history","regulatory"];
const GVAR = g => `var(--g-${g})`;
const ABOUT = {
  es:`<h2>Cómo se ha hecho</h2>
<p>Este mapa parte de un mapa anterior en Kumu. Se revisó cada elemento y cada conexión, se eliminó todo lo que no tenía fuente y se investigó de nuevo cada entidad. Después, una revisión independiente comprobó cada dato contra su fuente.</p>
<h3>Qué entra</h3>
<ul class="marks"><li><span class="mark confirmed"></span><b>Confirmado</b>: lo respalda un registro oficial (regulador, tribunal), una publicación de ambas partes o prensa independiente fiable. Un comunicado de Metallicus que solo cita a su socio no basta.</li>
<li><span class="mark self"></span><b>Según la parte interesada</b>: solo lo dice Metallicus, la propia persona o la propia empresa. Es verificable que lo afirman, no que sea cierto.</li>
<li><span class="mark disputed"></span><b>Fuentes discrepan</b>: hay fuentes fiables con versiones distintas, y se muestran todas.</li></ul>
<h3>Qué no entra</h3>
<p>Rumores, especulación, publicaciones de foros o redes sociales, resúmenes automáticos y cualquier dato que no se haya podido comprobar en una fuente abierta y enlazada. Tampoco personas u organizaciones sin relación documentada con Metallicus o su equipo.</p>
<h3>Imágenes</h3>
<p>Las fotos y logotipos se muestran solo para identificar a cada persona u organización. Proceden de sus webs oficiales, sus comunicados o Wikimedia Commons, y cada ficha indica de dónde sale la imagen. Las marcas pertenecen a sus titulares.</p>
<h3>Correcciones</h3>
<p>Si un dato está mal o una fuente ha cambiado, abre un issue en el repositorio de GitHub con el enlace a la fuente.</p>`,
  en:`<h2>How this was made</h2>
<p>This map started from an earlier Kumu map. Every element and connection was checked, anything without a source was removed, and each entity was researched again. An independent review then checked every fact against its source.</p>
<h3>What is included</h3>
<ul class="marks"><li><span class="mark confirmed"></span><b>Confirmed</b>: backed by an official record (regulator, court), a publication by both parties, or reliable independent press. A Metallicus release that only quotes its partner is not enough.</li>
<li><span class="mark self"></span><b>Per the interested party</b>: only Metallicus, the person or the company itself says it. It is verifiable that they claim it, not that it is true.</li>
<li><span class="mark disputed"></span><b>Sources disagree</b>: reliable sources give different versions, and all are shown.</li></ul>
<h3>What is left out</h3>
<p>Rumours, speculation, forum or social media posts, automated summaries and anything that could not be checked against an open, linked source. Also people or organisations with no documented relationship to Metallicus or its team.</p>
<h3>Images</h3>
<p>Photos and logos are shown only to identify each person or organisation. They come from official websites, press releases or Wikimedia Commons, and each profile says where its image comes from. Trademarks belong to their owners.</p>
<h3>Corrections</h3>
<p>If a fact is wrong or a source has changed, open an issue in the GitHub repository with a link to the source.</p>`
};

let lang = new URLSearchParams(location.search).get("lang")==="en" ? "en" : "es";
try{ const saved=localStorage.getItem("lang"); if(!new URLSearchParams(location.search).get("lang") && (saved==="es"||saved==="en")) lang=saved; }catch(e){}
let DATA, IMG = {}, byId = {}, cy, view, activeGroups = new Set(GROUPS), query = "", current = null;
const T = () => I18N[lang];
const L = (o,k) => o[`${k}_${lang}`] || o[`${k}_es`] || o[`${k}_en`] || "";
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $ = s => document.querySelector(s);
const isWide = () => matchMedia("(min-width:860px)").matches;

function fmtDate(d){
  if(!d) return "";
  const [y,m,day]=d.split("-");
  if(!m) return y;
  const dt=new Date(Date.UTC(+y,+m-1,+(day||1)));
  return dt.toLocaleDateString(lang==="es"?"es-ES":"en-GB",day?{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}:{month:"short",year:"numeric",timeZone:"UTC"});
}
function srcLinks(sources){
  return (sources||[]).map(s=>{let h="";try{h=new URL(s.url).hostname.replace(/^www\./,"")}catch(e){}return `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title||h)}</a>`}).join(" · ");
}
function initials(name){
  const w=name.replace(/\(.*?\)/g,"").replace(/[^\p{L}\p{N} ]/gu," ").trim().split(/\s+/).filter(Boolean);
  return ((w[0]||"?")[0]+(w.length>1?w[w.length-1][0]:"")).toUpperCase();
}
function avatar(n,size){
  const im=IMG[n.id];
  const cls=["av"]; if(im) cls.push(im.kind==="photo"?"photo":"logo"); if(n.type==="person") cls.push("person");
  const inner = im ? `<img src="${esc(im.url)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.remove('logo','photo');this.replaceWith(document.createTextNode('${esc(initials(n.name))}'))">` : esc(initials(n.name));
  return `<span class="${cls.join(" ")}" style="--s:${size}px;--c:${GVAR(n.group)}" aria-hidden="true">${inner}</span>`;
}

async function init(){
  const [g,i] = await Promise.all([
    fetch("data/graph.json",{cache:"no-cache"}).then(r=>r.json()),
    fetch("data/images.json",{cache:"no-cache"}).then(r=>r.ok?r.json():{}).catch(()=>({}))
  ]);
  DATA=g; IMG=i||{};
  DATA.nodes.forEach(n=>byId[n.id]=n);
  $("#updated").textContent = DATA.updated ? fmtDate(DATA.updated) : "";
  document.querySelectorAll("#tabs button").forEach(b=>b.addEventListener("click",()=>{closePanel();setView(b.dataset.view);}));
  $("#lang").addEventListener("click",()=>{lang=lang==="es"?"en":"es";try{localStorage.setItem("lang",lang)}catch(e){};applyLang();});
  $("#close").addEventListener("click",()=>{ if(history.state&&history.state.panel) history.back(); else closePanel(); });
  $("#q").addEventListener("input",e=>{query=e.target.value.trim().toLowerCase();refresh();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closePanel();});
  window.addEventListener("popstate",()=>{ const id=decodeURIComponent(location.hash.slice(1)); if(id&&byId[id]) openNode(id,false); else closePanel(false); });
  applyLang();
  setView("list");
  const id=decodeURIComponent(location.hash.slice(1)); if(id&&byId[id]) openNode(id,false);
}
function applyLang(){
  document.documentElement.lang=lang;
  $("#lang").textContent = lang==="es"?"EN":"ES";
  document.querySelectorAll("[data-i18n]").forEach(el=>{const v=T()[el.dataset.i18n]; if(typeof v==="string") el.textContent=v;});
  document.querySelectorAll("[data-i18n-ph]").forEach(el=>el.placeholder=T()[el.dataset.i18nPh]);
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
    const g=b.dataset.g;
    // first tap on a chip while all are on: show only that group
    if(activeGroups.size===GROUPS.length){ activeGroups=new Set([g]); }
    else if(activeGroups.has(g)){ activeGroups.delete(g); if(!activeGroups.size) activeGroups=new Set(GROUPS); }
    else activeGroups.add(g);
    document.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",activeGroups.has(c.dataset.g)));
    refresh();
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
  document.querySelectorAll("#tabs button").forEach(b=>b.dataset.view===v?b.setAttribute("aria-current","page"):b.removeAttribute("aria-current"));
  ["map","list","time","about"].forEach(k=>$(`#view-${k}`).hidden = k!==v);
  $("#legend").hidden = v==="about"; $("#filters").hidden = v==="about";
  if(v==="map"){ if(!cy) buildGraph(); else cy.resize(); }
  refresh();
  window.scrollTo(0,0);
}
function refresh(){
  if(!DATA) return;
  if(view==="list") renderList();
  if(view==="time") renderTimeline();
  if(view==="map" && cy){
    cy.batch(()=>cy.nodes().forEach(n=>{const d=byId[n.id()]; n.style("display",activeGroups.has(d.group)?"element":"none"); n.toggleClass("dim",!matches(d));}));
  }
}

function buildGraph(){
  if(typeof cytoscape==="undefined"){ setTimeout(buildGraph,120); return; }
  const deg={}; DATA.edges.forEach(e=>{deg[e.from]=(deg[e.from]||0)+1;deg[e.to]=(deg[e.to]||0)+1;});
  const css=getComputedStyle(document.documentElement), v=k=>css.getPropertyValue(k).trim();
  const small=!isWide();
  cy = cytoscape({
    container: $("#cy"),
    elements: [
      ...DATA.nodes.map(n=>({data:{id:n.id,label:n.name,color:v(`--g-${n.group}`),size:(small?26:24)+Math.min(34,(deg[n.id]||0)*3),img:IMG[n.id]?IMG[n.id].url:"",kind:IMG[n.id]?IMG[n.id].kind:""}})),
      ...DATA.edges.filter(e=>byId[e.from]&&byId[e.to]).map((e,i)=>({data:{id:"e"+i,source:e.from,target:e.to,label:L(e,"label"),status:e.status,raw:e}}))
    ],
    style:[
      {selector:"node",style:{"background-color":"data(color)",width:"data(size)",height:"data(size)",label:"data(label)","font-family":"Public Sans, sans-serif","font-size":small?10:11,"font-weight":600,color:v("--ink"),"text-valign":"bottom","text-margin-y":4,"text-wrap":"wrap","text-max-width":small?90:110,"text-background-color":v("--bg"),"text-background-opacity":.85,"text-background-padding":2,"border-width":2,"border-color":"data(color)","min-zoomed-font-size":small?7:5}},
      {selector:'node[img != ""]',style:{"background-image":"data(img)","background-fit":"cover","background-clip":"node","background-image-crossorigin":"null","background-color":"#ffffff"}},
      {selector:'node[kind = "logo"]',style:{"background-fit":"contain","background-width":"72%","background-height":"72%"}},
      {selector:"edge",style:{width:1.5,"line-color":v("--muted"),"curve-style":"bezier","target-arrow-shape":"triangle","target-arrow-color":v("--muted"),"arrow-scale":.7,opacity:.5}},
      {selector:'edge[status="confirmed"]',style:{"line-color":v("--ok"),"target-arrow-color":v("--ok")}},
      {selector:'edge[status="self"]',style:{"line-style":"dashed","line-color":v("--self"),"target-arrow-color":v("--self")}},
      {selector:'edge[status="disputed"]',style:{"line-style":"dotted","line-color":v("--disp"),"target-arrow-color":v("--disp")}},
      {selector:".dim",style:{opacity:.15}},
      {selector:"node.focus",style:{"border-width":4,"border-color":v("--ink")}},
      {selector:"edge.hl",style:{opacity:1,width:2.5,label:"data(label)","font-size":10,color:v("--ink"),"text-rotation":"autorotate","text-background-color":v("--surface"),"text-background-opacity":1,"text-background-padding":2}}
    ],
    layout:{name:"cose",animate:false,nodeRepulsion:()=>small?12000:9000,idealEdgeLength:()=>small?80:90,gravity:.3,padding:20,randomize:true,numIter:2500},
    minZoom:.2,maxZoom:3,wheelSensitivity:.25
  });
  cy.on("tap","node",e=>openNode(e.target.id()));
  refresh();
}

function renderList(){
  const shown=DATA.nodes.filter(matches);
  if(!shown.length){$("#list").innerHTML=`<p class="empty">${esc(T().noResults)}</p>`;return;}
  $("#list").innerHTML = GROUPS.map(g=>{
    const ns=shown.filter(n=>n.group===g).sort((a,b)=>(b.type==="company"&&g==="core")-(a.type==="company"&&g==="core")||a.name.localeCompare(b.name));
    if(!ns.length) return "";
    return `<section class="grp" style="--c:${GVAR(g)}"><h2><span class="dot"></span>${esc(T().groups[g])}</h2><div class="cards">${ns.map(n=>`<button class="item" data-id="${n.id}">${avatar(n,52)}<span class="txt"><b>${esc(n.name)}</b><span>${esc(L(n,"summary"))}</span><small>${T().nFacts((n.facts||[]).length)}</small></span></button>`).join("")}</div></section>`;
  }).join("");
  document.querySelectorAll(".item").forEach(b=>b.addEventListener("click",()=>openNode(b.dataset.id)));
}
function renderTimeline(){
  const rows=[];
  DATA.nodes.filter(matches).forEach(n=>(n.facts||[]).forEach(f=>{if(f.date) rows.push({d:f.date,f,n});}));
  rows.sort((a,b)=>a.d.localeCompare(b.d));
  $("#timeline").innerHTML = rows.length? rows.map(r=>`<li class="t">${avatar(r.n,36)}<div><time><span class="mark ${r.f.status}" title="${esc(T().st[r.f.status])}"></span>${esc(fmtDate(r.d))}</time><p>${esc(r.f[lang]||r.f.es)}</p><button class="who" data-id="${r.n.id}">${esc(r.n.name)}</button></div></li>`).join("") : `<li class="empty">${esc(T().noResults)}</li>`;
  document.querySelectorAll("#timeline .who").forEach(b=>b.addEventListener("click",()=>openNode(b.dataset.id)));
}

function openNode(id,push=true){
  const n=byId[id]; if(!n) return;
  const wasOpen=!!current; current=id;
  const im=IMG[id];
  const rels=DATA.edges.filter(e=>(e.from===id||e.to===id)&&byId[e.from]&&byId[e.to]);
  const facts=[...(n.facts||[])].sort((a,b)=>(a.date||"9").localeCompare(b.date||"9"));
  $("#detail").innerHTML = `
    <div class="d-head">
      ${avatar(n, im&&im.kind==="photo"?112:88)}
      <span class="d-type" style="--c:${GVAR(n.group)}"><span class="dot"></span>${esc(T().types[n.type]||n.type)} · ${esc(T().groups[n.group])}</span>
      <h2>${esc(n.name)}</h2>
      ${im?`<p class="credit">${esc(T().image)}: <a href="${esc(im.credit_page||im.url)}" target="_blank" rel="noopener noreferrer">${esc(im.credit||new URL(im.credit_page||im.url).hostname)}</a></p>`:""}
    </div>
    <p class="d-sum">${esc(L(n,"summary"))}</p>
    ${n.website?`<p class="d-site"><a href="${esc(n.website)}" target="_blank" rel="noopener noreferrer">${esc(T().website)}</a></p>`:""}
    ${facts.length?`<h3>${esc(T().facts)}</h3><ul class="facts">${facts.map(f=>`<li class="fact"><span class="mark ${f.status}" title="${esc(T().st[f.status])}"></span><p>${esc(f[lang]||f.es)}</p><div class="meta">${f.date?`<time>${esc(fmtDate(f.date))}</time> · `:""}${esc(T().st[f.status])} · ${srcLinks(f.sources)}</div></li>`).join("")}</ul>`:""}
    ${rels.length?`<h3>${esc(T().relations)}</h3>${rels.map(e=>{const o=byId[e.from===id?e.to:e.from];const txt=e.from===id?`${esc(L(e,"label"))} <button class="who" data-id="${o.id}">${esc(o.name)}</button>`:`<button class="who" data-id="${o.id}">${esc(o.name)}</button> ${esc(L(e,"label"))} ${esc(n.name)}`;return `<div class="rel">${avatar(o,40)}<div>${txt}<div class="src"><span class="mark ${e.status}" title="${esc(T().st[e.status])}"></span>${e.date?esc(fmtDate(e.date))+" · ":""}${srcLinks(e.sources)}</div></div></div>`}).join("")}`:""}`;
  $("#detail").querySelectorAll("button[data-id]").forEach(b=>b.addEventListener("click",()=>openNode(b.dataset.id)));
  $("#panel").hidden=false; $("#panel").scrollTop=0;
  document.body.style.overflow = isWide() ? "" : "hidden";
  if(cy){cy.elements().removeClass("focus hl");const nd=cy.getElementById(id);nd.addClass("focus");nd.connectedEdges().addClass("hl");setTimeout(()=>cy.resize(),0);}
  if(push){ const st={panel:true}; if(wasOpen) history.replaceState(st,"",`#${id}`); else history.pushState(st,"",`#${id}`); }
}
function closePanel(updateUrl=true){
  if(!current && $("#panel").hidden) return;
  $("#panel").hidden=true; current=null; document.body.style.overflow="";
  if(cy){cy.elements().removeClass("focus hl");setTimeout(()=>cy.resize(),0);}
  if(updateUrl && location.hash) history.replaceState(null,"",location.pathname+location.search);
}
document.addEventListener("DOMContentLoaded",init);
