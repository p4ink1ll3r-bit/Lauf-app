let R=[],PLZ=[],META={};
// Einstellungen: Datenordner, Teilen-Link und Adresse für „Fehler melden“ (leer = Meldung zum Kopieren)
const APP_VERSION="v61"; // gleich wie VERSION in service-worker.js; steht in den Einstellungen, damit man sieht, welche Fassung läuft
const DATA_DIR="data/";
const REPORT_URL="https://gbaoxnsytnzcuxbkdrwc.supabase.co/rest/v1/reports";
const REPORT_KEY="sb_publishable_iuxJbdN94igdsBQ5-dtm5g_OxWYWGH9";   // öffentlicher Schlüssel: darf nur Meldungen anlegen
const APP_URL=location.origin+location.pathname.replace(/index\.html$/,"");
const MON=["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const WD=["So","Mo","Di","Mi","Do","Fr","Sa"];
const LONG=["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
const TODAY=new Date();TODAY.setHours(0,0,0,0);
const $=id=>document.getElementById(id);
function km(a,b,c,d){const r=Math.PI/180,x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 2*6371*Math.asin(Math.sqrt(x))}
function dt(s){return new Date(s+"T00:00:00")}
function fmt(s){const d=dt(s);return String(d.getDate()).padStart(2,"0")+"."+String(d.getMonth()+1).padStart(2,"0")+"."+d.getFullYear()}
function fmtS(s){const d=dt(s);return d.getDate()+"."+(d.getMonth()+1)+"."}
function longDate(s){const d=dt(s);return LONG[d.getDay()]+", "+d.getDate()+". "+MON[d.getMonth()]+" "+d.getFullYear()}
function lab(k){return k==="HM"?"Halbmarathon":k==="M"?"Marathon":/^[\d,]+$/.test(k)?k+" km":k}
function labS(k){return k==="HM"?"HM":k==="M"?"M":/^[\d,]+$/.test(k)?k:k}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function daysTo(s){return Math.round((dt(s)-TODAY)/864e5)}
function host(u){try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return u}}
const norm=s=>s.toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss");

// Kleine Symbole
const SV=p=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+p+'</svg>';
const S='fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const IC={
  back:SV('<path d="M15 5l-7 7 7 7" '+S+'/>'),
  share:SV('<circle cx="18" cy="5.5" r="2.5" '+S+'/><circle cx="6" cy="12" r="2.5" '+S+'/><circle cx="18" cy="18.5" r="2.5" '+S+'/><path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4" '+S+'/>'),
  heart:SV('<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>'),
  route:SV('<circle cx="6" cy="18" r="2.5" '+S+'/><circle cx="18" cy="6" r="2.5" '+S+'/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" '+S+'/>'),
  euro:SV('<path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10h9M4 14h9" '+S+'/>'),
  flag:SV('<path d="M5 21V4M5 4h11l-2 4 2 4H5" '+S+'/>'),
  cal:SV('<rect x="3.5" y="5" width="17" height="15" rx="2.5" '+S+'/><path d="M3.5 10h17M8 3v4M16 3v4" '+S+'/>'),
  sun:SV('<circle cx="12" cy="12" r="4" '+S+'/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" '+S+'/>'),
  pack:SV('<path d="M7 8V6a5 5 0 0 1 10 0v2M5 8h14l-1 12H6z" '+S+'/><path d="M9.5 13h5" '+S+'/>'),
  info:SV('<circle cx="12" cy="12" r="9" '+S+'/><path d="M12 11v6M12 7.5v.5" '+S+'/>'),
  car:SV('<path d="M5 16h14M6.5 16l1.5-6h8l1.5 6M5 16v3M19 16v3" '+S+'/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/>'),
  whatsapp:SV('<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" '+S+'/><path d="M9 9.5c.3 2 2.2 4.2 4.8 5l1.2-1.3-2-1-.8.8c-.8-.3-1.6-1-2-1.9l.8-.8-.9-2.1z" fill="currentColor"/>'),
  copy:SV('<rect x="8" y="8" width="12" height="12" rx="2" '+S+'/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" '+S+'/>'),
  ext:SV('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" '+S+'/>'),
  mtn:SV('<path d="M2.5 19.5l6.5-11 4 6.5 2.5-3.5 6 8z" '+S+'/>')
};
const HEART=IC.heart;

// Läufe-Datei in das interne Format übersetzen und Merkmale ableiten
function prepare(list){const x0={};list.forEach(x=>x0[x.id]=x);R=list.map(x=>({id:x.id,t:x.type,n:x.name,o:x.place,la:x.lat,lo:x.lon,d:x.date,e:x.end,ok:x.confirmed,prev:x.prev_date,k:x.distances||[],hm:x.elevation,note:x.note,u:x.url,checked:x.checked,fee:x.fee,ro:x.reg_open,rc:x.reg_close,st:x.start_time,info:x.info,src:x.source,sp:x.start_place,pick:x.pickup,park:x.parking,aid:x.aid,course:x.course,extras:x.extras,showers:x.showers,gear:x.gear,gearNote:x.gear_note,gl:x.gear_levels,gs:x.gear_stand,gw:x.gear_warn,prof:x.profile,gpx:x.gpx,limit:x.limit,soldout:x.sold_out===true,soldPart:typeof x.sold_out==="string"?x.sold_out:"",cutoff:x.cutoff,incl:x.included,late:x.late_reg}));
R.forEach(r=>{
  r.oldId=r.n.toLowerCase().replace(/[^a-z0-9äöüß]+/g,"-")+"-"+r.d.slice(0,4);
  const kms=r.k.map(k=>k==="HM"||/bis HM/.test(k)?21.1:k==="M"?42.2:k==="Backyard"?60:parseFloat(String(k).replace(",",".")));
  r.cls=new Set();kms.filter(x=>!isNaN(x)).forEach(x=>{if(x>=4&&x<=7)r.cls.add("5");else if(x>=8&&x<=12)r.cls.add("10");else if(x>=18&&x<=23)r.cls.add("hm");else if(x>=40&&x<=45)r.cls.add("m");else if(x>45)r.cls.add("ultra");else r.cls.add("o")});
  if(!r.cls.size)r.cls.add("o");
  r.maxKm=Math.max(0,...kms.filter(x=>!isNaN(x)));
  const hms=(r.hm||[]).filter(x=>x);r.hmMax=hms.length?Math.max(...hms):null;
  r.profs=new Set(hms.map(h=>h<300?"flat":h<=1000?"hilly":"alpine"));
  // Vorjahreswerte füllen Lücken (markiert), „na“ = Veranstalter macht dazu keine Angabe
  r.prevF=new Set();r.na=new Set((x0[r.id]&&x0[r.id].na||[]).map(k=>({start_time:"st",start_place:"sp",pickup:"pick",parking:"park",reg_close:"rc",reg_open:"ro"})[k]||k));const pv=x0[r.id]&&x0[r.id].prev||{};
  [["fee","fee"],["st","start_time"],["limit","limit"],["sp","start_place"],["pick","pickup"],["park","parking"],["aid","aid"]].forEach(([k,dk])=>{if(!r[k]&&pv[dk]){r[k]=pv[dk];r.prevF.add(k)}});
  r.price=priceFrom(r.fee);if(r.price&&r.prevF.has("fee"))r.price.prev=true;
});
state.favs=state.favs.map(f=>{const m=R.find(r=>r.oldId===f);return m?m.id:f});}
// „ab 24 €“ aus dem Startgeld-Text: kleinster Erwachsenen-Preis, ohne Kinderläufe, Aufschläge, Staffeln, Extras
const KIDX=/schüler|bambini|kinder|kids|jugend|\bu\s?\d{1,2}\b|zwerg|flitz|wichtel|hund|dog|staffel|team|pfand|shirt|walking|walker|wandern|hiking|nachmeld|serie|jg\.\s?20(?:09|1\d)/i;
function priceFrom(fee){if(!fee)return null;const raw=String(fee);
  if(/übrige.*nicht angegeben/i.test(raw))return null;
  const f=raw.replace(/\([^)]*\)/g," "),vals=[];
  for(const seg of f.split(/[·;]|,\s+/)){if(KIDX.test(seg))continue;
    for(const m of seg.matchAll(/((?:\d+(?:,\d+)?\s*[\/–-]\s*)*\d+(?:,\d+)?)\s*(?:€|EUR\b|Euro\b)/gi)){
      if(/\+\s*$/.test(seg.slice(0,m.index)))continue;
      m[1].split(/[\/–-]/).forEach(x=>{const v=parseFloat(x.trim().replace(",","."));if(v>=3)vals.push(v)})}}
  if(!vals.length)return /keine startgeb|kostenlos/i.test(raw)?{v:0,free:true,prev:/vorjahr/i.test(raw)}:null;
  const v=Math.min(...vals);return{v:Number.isInteger(v)?v:v.toFixed(2).replace(".",","),prev:/vorjahr/i.test(raw)}}
function priceTxt(p){return p.free?"kostenlos":"ab "+p.v+" €"}

let state={tab:"road",radius:100,home:null,dists:[],time:"all",hm:"all",stat:"all",moreF:false,favs:[],packed:{},reg:[],view:"list",cal:null,calDay:null,remind:7};
try{const s=JSON.parse(localStorage.getItem("strail2")||"{}");Object.assign(state,s)}catch(e){}
if(state.dist&&state.dist!=="all"&&!state.dists.length)state.dists=[state.dist];delete state.dist;   // alte Einzelauswahl der Strecke übernehmen
try{const o=JSON.parse(localStorage.getItem("strail")||"{}");if(Array.isArray(o.favs)&&!state.favs.length)state.favs=o.favs}catch(e){}
function save(){try{localStorage.setItem("strail2",JSON.stringify(state))}catch(e){}}
if(["road","trail","fav"].includes(state.start))state.tab=state.start;   // Einstellung „Startseite beim Öffnen“
const SEL=["time","stat","hm"];
const DNAME={"5":"5 km","10":"10 km","hm":"Halbmarathon","m":"Marathon","ultra":"Ultra","o":"Andere Strecken"};
const DORDER=["5","10","hm","m","ultra","o"];
function buildFilters(){SEL.forEach(k=>$("f-"+k).addEventListener("change",e=>{state[k]=e.target.value;save();animNext=true;render()}))}
function syncFilters(){
  SEL.forEach(k=>{const el=$("f-"+k);el.value=state[k];el.classList.toggle("on",state[k]!=="all")});
  $("w-hm").hidden=state.tab!=="trail";$("filters").hidden=state.tab==="fav"||!state.moreF;}
// Schnellauswahl über der Liste: Sortierung, häufige Filter, „Mehr Filter“ klappt die Dropdowns auf
// Zeile über der Liste: welche Strecken gelten ("x von y Läufen"), „Mehr Filter“ klappt die Dropdowns auf
function renderQuick(shown,total){const q=$("quick"),show=state.tab!=="fav"&&state.view!=="cal";q.hidden=!show;if(!show)return;
  const adv=(state.time!=="all"?1:0)+(state.stat!=="all"?1:0)+(state.tab==="trail"&&state.hm!=="all"?1:0),ds=DORDER.filter(k=>state.dists.includes(k));
  const info=ds.length?'<b>'+shown+'</b> von '+total+(total===1?" Lauf":" Läufen")+' · '+ds.map(k=>DNAME[k]).join(", ")+' <button type="button" class="qlink" data-alld>Alle Strecken zeigen</button>':
    'Alle Strecken <button type="button" class="qlink" data-dsel>Strecke wählen</button>';
  q.innerHTML='<span class="qinfo">'+info+'</span><button type="button" class="qchip more" data-more aria-pressed="'+!!state.moreF+'">Mehr Filter'+(adv?" ("+adv+")":"")+'</button>'}
$("quick").addEventListener("click",e=>{
  if(e.target.closest("[data-more]")){state.moreF=!state.moreF;save();render();return}
  if(e.target.closest("[data-alld]")){state.dists=[];save();animNext=true;render();return}
  if(e.target.closest("[data-dsel]")){$("loc").click()}});
// Kurze Rückmeldung unten („Gemerkt“, „Startpunkt gesetzt“ …)
let toastT=null;
function toast(msg){const t=$("toast");if(!t)return;t.textContent=msg;t.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("on"),2400)}
// Dieses Wochenende: Samstag und Sonntag, am Wochenende selbst bis Sonntag
function weekendRange(){const sat=new Date(TODAY),wd=sat.getDay();if(wd!==0&&wd!==6)sat.setDate(sat.getDate()+6-wd);const sun=new Date(sat);if(sat.getDay()===6)sun.setDate(sun.getDate()+1);return[sat,sun]}
// Karten-Zusatzzeile: kurze Hinweise ja, Daten-Anmerkungen („Ausschreibung nennt …“) gehören nur auf die Detailseite
const NOTE_HIDE=/Ausschreibung nennt|beim Veranstalter prüfen|widerspr|nicht abrufbar|Quelle/i;
function cardNote(r){return r.note&&!NOTE_HIDE.test(r.note)?'<div class="meta note">'+esc(r.note)+'</div>':""}
function passFilters(r,skipDist){
  if(!skipDist&&state.dists.length&&!state.dists.some(k=>r.cls.has(k)))return false;
  if(state.time==="weekend"){const[a,b]=weekendRange();if(!(dt(r.d)<=b&&dt(r.e||r.d)>=a))return false}
  else if(state.time!=="all"){const lim=new Date(TODAY);if(state.time==="month")lim.setDate(lim.getDate()+30);else if(state.time==="q")lim.setMonth(lim.getMonth()+3);else lim.setFullYear(lim.getFullYear()+1);if(dt(r.d)>lim)return false}
  if(r.t==="trail"&&state.hm!=="all"&&!r.profs.has(state.hm))return false;
  if(state.stat==="ok"&&!r.ok)return false;
  if(state.stat==="open"&&r.ok)return false;
  return true;}

// Anmeldestatus: kurz für Karten und Kacheln
// sold_out: true = alles ausgebucht; Text = nur einzelne Strecken ausgebucht (der Text sagt welche)
function regInfo(r){
  if(r.soldout)return{c:"full",t:"Ausgebucht",s:"Ausgebucht"};
  const b=regInfo0(r);
  if(r.soldPart&&(!b||b.c!=="plain"))return{c:"hot",t:"Teils ausgebucht",s:"teils ausgebucht"};
  return b}
function regInfo0(r){
  if(r.rc&&daysTo(r.rc)<0)return{c:"plain",t:"Anmeldung zu",s:"geschlossen"};
  if(r.ro&&daysTo(r.ro)>0){const k=daysTo(r.ro);return{c:k<=14?"hot":"open",t:k<=14?"Anmeldung öffnet "+(k===1?"morgen":"in "+k+" T."):"Anmeldung ab "+fmtS(r.ro),s:"ab "+fmtS(r.ro)}}
  if(r.rc){const k=daysTo(r.rc);return{c:k<=14?"hot":"ok",t:k<=14?"Meldeschluss "+(k===0?"heute":k===1?"morgen":"in "+k+" T."):"Anmeldung bis "+fmtS(r.rc),s:"bis "+fmtS(r.rc)}}
  if(r.ro)return{c:"ok",t:"Anmeldung offen",s:"offen"};
  return null}

function card(r,favView){
  const d=dt(r.d),end=r.e?dt(r.e):null,day=end?d.getDate()+"–"+end.getDate():d.getDate();
  const chips=r.k.map((k,i)=>'<span class="chip'+(r.t==="trail"?" trail":"")+'">'+esc(lab(k))+(r.hm&&r.hm[i]?' <small>· '+r.hm[i].toLocaleString("de-DE")+' Hm</small>':"")+"</span>").join("");
  const fav=state.favs.includes(r.id),reg=state.reg.includes(r.id),days=daysTo(r.d),ri=regInfo(r);
  let pills="";
  if(reg)pills+='<span class="pill reg">Angemeldet ✓</span>';
  else if(favView&&days>=0)pills+='<button type="button" class="pill regq" data-regq="'+r.id+'">Ich bin angemeldet</button>';
  else if(ri)pills+='<span class="pill '+ri.c+'">'+ri.t+'</span>';
  if(!r.ok)pills+='<span class="pill open" title="Termin geschätzt nach dem Vorjahr">Termin offen</span>';
  const right=r.price?(r.price.free?'<span class="price">kostenlos</span>':'<span class="price"><small>'+(r.price.prev?"ca. ":"ab ")+'</small>'+r.price.v+' €</span>'):"";
  const mon=MON[d.getMonth()].slice(0,3),wd=end?WD[d.getDay()]+"–"+WD[end.getDay()]:WD[d.getDay()];
  let dateBox;
  if(favView){const C=2*Math.PI*25,f=days<=0?1:Math.max(.06,Math.min(1,1-days/90));
    dateBox='<div class="ringd '+r.t+'"><div class="rg"><svg viewBox="0 0 58 58" aria-hidden="true"><circle class="bgc" cx="29" cy="29" r="25"/><circle class="fgc" cx="29" cy="29" r="25" stroke-dasharray="'+(C*f).toFixed(1)+' '+C.toFixed(1)+'"/></svg>'+
      '<span class="in"><span class="d'+(end?" range":"")+'">'+day+'</span><span class="m">'+mon+'</span></span></div><span class="left'+(days<=14?" near":"")+'">'+(days<=0?"Heute":days===1?"morgen":"noch "+days+" T.")+'</span></div>'}
  else dateBox='<div class="leaf '+r.t+(r.ok?"":" est")+'"><span class="m">'+mon+(d.getFullYear()!==TODAY.getFullYear()?" "+String(d.getFullYear()).slice(2):"")+'</span><span class="d'+(end?" range":"")+'">'+day+'</span><span class="w">'+wd+'</span></div>';
  return '<article class="card'+(r.t==="trail"?" trail":"")+'" data-card="'+r.id+'">'+dateBox+
    '<div class="info"><h3><button class="open" type="button" data-open="'+r.id+'">'+esc(r.n)+'</button></h3>'+
    '<div class="meta"><span>'+esc(r.o)+'</span>'+(r.dist==null?"":'<span><b>'+r.dist+' km</b> entfernt</span>')+'</div>'+
    '<div class="chips">'+chips+'</div>'+cardNote(r)+
    ((pills||right)?'<div class="row"><span class="pills">'+pills+'</span>'+right+'</div>':"")+'</div>'+
    '<button class="heart" type="button" data-id="'+r.id+'" aria-pressed="'+fav+'" aria-label="'+(fav?"Aus Meine Läufe entfernen":"Merken")+'">'+HEART+'</button></article>';}

function leafHTML(r){const d=dt(r.d),end=r.e?dt(r.e):null,day=end?d.getDate()+"–"+end.getDate():d.getDate();
  return '<div class="leaf '+r.t+(r.ok?"":" est")+'"><span class="m">'+MON[d.getMonth()].slice(0,3)+(d.getFullYear()!==TODAY.getFullYear()?" "+String(d.getFullYear()).slice(2):"")+'</span><span class="d'+(end?" range":"")+'">'+day+'</span><span class="w">'+(end?WD[d.getDay()]+"–"+WD[end.getDay()]:WD[d.getDay()])+'</span></div>'}
// Kalender-Links (Google, Outlook)
function ymd(d){return d.getFullYear()+String(d.getMonth()+1).padStart(2,"0")+String(d.getDate()).padStart(2,"0")}
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function plus(x,k){const d=dt(x);d.setDate(d.getDate()+k);return d}
function gcal(title,start,end,details,loc,time){let dates;
  if(time&&/^\d\d:\d\d$/.test(time)){const h=Math.min(23,parseInt(time,10)+4);dates=ymd(dt(start))+"T"+time.replace(":","")+"00/"+ymd(dt(start))+"T"+String(h).padStart(2,"0")+time.slice(3)+"00"}
  else dates=ymd(dt(start))+"/"+ymd(plus(end||start,1));
  return"https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(title)+"&dates="+dates+(time?"&ctz=Europe%2FBerlin":"")+"&details="+encodeURIComponent(details)+"&location="+encodeURIComponent(loc)}
function ocal(title,start,end,details,loc){return"https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&allday=true&subject="+encodeURIComponent(title)+"&startdt="+start+"&enddt="+iso(plus(end||start,1))+"&body="+encodeURIComponent(details)+"&location="+encodeURIComponent(loc)}
function calDetails(r){return r.k.map(lab).join(", ")+(r.st?" · Start "+r.st+" Uhr":"")+" · Infos: "+r.u+" (aus Race Hunt)"}
// Apple Kalender (iPhone): Knopf verlinkt auf ics/<id>.ics, die Dateien erzeugt scripts/ics.py beim Veröffentlichen

// Kopfbild aus den Daten: Trail = Bergsilhouette (Höhe nach Hm), Straße = Straße mit Start/Ziel
function heroSVG(r){
  if(r.t==="trail"){const h=Math.sqrt(Math.min(1,(r.hmMax||500)/3000)),peak=95-h*70;
    return '<svg viewBox="0 0 600 190" role="img" aria-label="Bergsilhouette'+(r.hmMax?", bis "+r.hmMax+" Höhenmeter":"")+'"><rect width="600" height="190" fill="var(--trail-soft)"/><circle cx="480" cy="58" r="18" fill="var(--trail)" opacity=".55"/>'+
    '<path d="M0 190 L0 '+(peak+90)+' L110 '+(peak+55)+' L190 '+(peak+85)+' L300 '+(peak+30)+' L380 '+(peak+70)+' L460 '+(peak+48)+' L600 '+(peak+100)+' L600 190Z" fill="var(--trail)" opacity=".35"/>'+
    '<path d="M0 190 L0 165 L90 '+(peak+110)+' L170 155 L260 '+(peak+95)+' L350 150 L450 '+(peak+115)+' L600 158 L600 190Z" fill="var(--ink)" opacity=".55"/>'+
    '<path d="M60 186 C160 172 210 180 300 168 S470 158 560 172" fill="none" stroke="var(--trail)" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/></svg>'}
  return '<svg viewBox="0 0 600 190" role="img" aria-label="Straßenlauf"><rect width="600" height="190" fill="var(--road-soft)"/>'+
    '<path d="M255 40 L345 40 L600 190 L0 190Z" fill="var(--road)" opacity=".85"/>'+
    '<path d="M300 46 L300 190" stroke="var(--u-mark)" stroke-width="6" stroke-dasharray="18 16"/>'+
    '<path d="M0 140 L600 140" stroke="var(--surface)" stroke-width="10" stroke-dasharray="14 14" opacity=".9"/>'+
    '<rect x="150" y="58" width="10" height="132" fill="var(--road-ink)"/><rect x="440" y="58" width="10" height="132" fill="var(--road-ink)"/>'+
    '<rect x="140" y="54" width="320" height="34" rx="4" fill="var(--u-mark)"/>'+
    '<text x="300" y="79" text-anchor="middle" font-family="Saira Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="24" letter-spacing="3" fill="#1D2733">START · ZIEL</text></svg>'}
function profileSVG(r){const p=r.prof;if(!Array.isArray(p)||p.length<3)return"";
  const W=600,H=140,maxK=p[p.length-1][0],alts=p.map(q=>q[1]),lo=Math.min(...alts),hi=Math.max(...alts),sp=Math.max(50,hi-lo);
  const pts=p.map(q=>[(q[0]/maxK*(W-40)+30).toFixed(1),(H-20-(q[1]-lo)/sp*(H-40)).toFixed(1)]);
  return '<figure class="prof"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Höhenprofil von '+lo+' bis '+hi+' Meter über '+maxK+' Kilometer"><path d="M'+pts[0][0]+' '+(H-20)+' L'+pts.map(x=>x.join(" ")).join(" L")+' L'+pts[pts.length-1][0]+' '+(H-20)+'Z" fill="var(--trail-soft)"/><path d="M'+pts.map(x=>x.join(" ")).join(" L")+'" fill="none" stroke="var(--trail)" stroke-width="2.5" stroke-linejoin="round"/>'+
   '<text x="30" y="14" font-size="12" fill="var(--muted)">'+hi+' m</text><text x="30" y="'+(H-4)+'" font-size="12" fill="var(--muted)">0 km</text><text x="'+(W-10)+'" y="'+(H-4)+'" font-size="12" text-anchor="end" fill="var(--muted)">'+maxK+' km</text></svg></figure>'}
// Pflichtausrüstung: oben je Strecke Pflicht / empfohlen / keine Pflicht, dann die Liste zum Abhaken
const GLV={pflicht:["Pflicht","pf"],empfohlen:["Empfohlen","em"],keine:["Keine genannt","kn"],offen:["Unklar","kn"]};
function gearBox(r){
  const hasG=r.gear&&r.gear.length,hasL=r.gl&&r.gl.length;
  if(hasL){const done=(state.packed&&state.packed[r.id])||[];
    const lv=new Set(r.gl.map(x=>x.level)),sum=lv.has("pflicht")?(lv.size===1?["Pflicht","pf"]:["Pflicht, nicht überall","pf"]):lv.has("empfohlen")?["Nur empfohlen","em"]:lv.has("offen")?["Unklar","kn"]:["Keine Pflicht genannt","kn"];
    return gearWrap(sum,
     (r.gs?'<span class="gstand'+(/Vorjahr/.test(r.gs)?" old":"")+'">'+esc(r.gs)+'</span>':"")+
     '<div class="glv">'+r.gl.map(x=>{const l=GLV[x.level]||GLV.offen;return '<div class="gr"><span class="gk">'+esc(/^\d+([,.]\d+)?$/.test(x.km)?x.km+" km":x.km)+'</span><span class="gp '+l[1]+'">'+l[0]+'</span><span class="gc">'+esc(x.check||"")+'</span></div>'}).join("")+'</div>'+
     (r.gw?'<p class="gwarn">'+esc(r.gw)+'</p>':"")+
     (hasG?'<span class="src" id="packcount">'+done.length+' von '+r.gear.length+' eingepackt</span><ul class="pack">'+
       r.gear.map((g,i)=>'<li><label><input type="checkbox" data-pack="'+r.id+'" value="'+i+'"'+(done.includes(i)?" checked":"")+'><span>'+esc(g)+'</span></label></li>').join("")+'</ul>':"")+
     (r.gearNote?'<span class="src">'+esc(r.gearNote)+'</span>':""))}
  if(!hasG){if(r.t!=="trail"||!(r.maxKm>25))return"";
    return '<section class="box"><h3>'+IC.pack+'Pflichtausrüstung</h3><p class="miss">Noch nicht erfasst. Auf längeren Trailstrecken gibt es meist eine Pflichtausrüstung, sie steht in der Ausschreibung des Veranstalters.'+(r.u?' <a href="'+esc(r.u)+'" target="_blank" rel="noopener">Zur Veranstalterseite</a>':"")+'</p></section>'}
  const done=(state.packed&&state.packed[r.id])||[];
  return gearWrap(["Liste ansehen","kn"],'<span class="src" id="packcount">'+done.length+' von '+r.gear.length+' eingepackt</span><ul class="pack">'+
   r.gear.map((g,i)=>'<li><label><input type="checkbox" data-pack="'+r.id+'" value="'+i+'"'+(done.includes(i)?" checked":"")+'><span>'+esc(g)+'</span></label></li>').join("")+'</ul>'+
   (r.gearNote?'<span class="src">'+esc(r.gearNote)+'</span>':""))}
// Ausklappbarer Kasten: zu sieht man nur die Kurzfassung (Pflicht, empfohlen …), auf die Strecken und die Liste kommen beim Aufklappen
function gearWrap(sum,body){return '<details class="box gearbox"><summary><h3>'+IC.pack+'Pflichtausrüstung</h3><span class="gsum '+sum[1]+'">'+sum[0]+'</span></summary><div class="gbody">'+body+'</div></details>'}
function flagBtn(id,kind,txt){return '<button type="button" class="flag" data-report="'+id+'" data-kind="'+kind+'">'+IC.flag+(txt||"Falsch?")+'</button>'}
function missLine(arr,id){return arr.length?'<p class="miss">Noch offen: '+arr.join(", ")+' – wird nachgetragen.<button type="button" class="linkbtn inl" data-report="'+id+'" data-kind="Info ergänzen">Weißt du es? Ergänzen</button></p>':""}
function V(r,k,suf){const v=r[k];if(!v)return r.na.has(k)?'<span class="na">Keine Angabe des Veranstalters</span>':"";return esc(v)+(suf||"")+(r.prevF.has(k)?' <span class="vj">Vorjahr</span>':"")}
// Anfahrt: Routen-Knöpfe, auf dem Handy steht die passende Karten-App zuerst
const IS_IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const IS_MOBILE=IS_IOS||/Android/i.test(navigator.userAgent);
const NAV_IC={
  pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="2.3" fill="currentColor"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 11.2l15-6.7-6.7 15-2.2-6.1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'};
function navBtn(href,name,ico,pref){return'<a class="navbtn'+(pref?" pref":"")+'" href="'+href+'" target="_blank" rel="noopener"><span class="ni">'+ico+'</span><span class="nt"><b>'+name+'</b><small>Route zum Start öffnen</small></span><span class="go">'+IC.ext+'</span></a>'}
// Statusbanner über den Anmelde-Knöpfen: sagt auf einen Blick, ob man sich noch anmelden kann
const ST_IC={
  ok:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 12.5l2.7 2.7L16 9.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  clock:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5.2l3.2 1.9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  stop:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6.6 6.6l10.8 10.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'};
function statusBanner(r){
  const rd=r.rc?daysTo(r.rc):null,od=r.ro?daysTo(r.ro):null,tag=k=>k<=0?"heute":k===1?"morgen":"in "+k+" Tagen";
  let c,ic,t,s;
  if(r.soldout){c="full";ic="stop";t="Ausgebucht";s="Alle Startplätze sind vergeben."}
  else if(r.soldPart&&!(r.rc&&rd<0)){c="hot";ic="stop";t="Teilweise ausgebucht";s=esc(r.soldPart)}
  else if(r.rc&&rd<0){c="plain";ic="stop";t="Meldeschluss vorbei";s="Letzter Tag war "+longDate(r.rc)+". "+(r.late?"Nachmeldung: "+esc(r.late):"Ob eine Nachmeldung geht, steht beim Veranstalter.")}
  else if(od!==null&&od>0){c=od<=14?"hot":"open";ic="clock";t="Anmeldung öffnet "+tag(od);s="Start der Anmeldung: "+longDate(r.ro)}
  else if(r.rc){c=rd<=7?"hot":"ok";ic=rd<=7?"clock":"ok";t=rd<=7?"Meldeschluss "+tag(rd):"Anmeldung offen";s=(rd<=7?"Letzter Tag: ":"Bis ")+longDate(r.rc)+(rd>7?" · noch "+rd+" Tage":"")}
  else if(r.ro){c="ok";ic="ok";t="Anmeldung offen";s="Einen Meldeschluss nennt der Veranstalter bisher nicht."}
  else if(!r.ok){c="open";ic="clock";t="Termin noch nicht bestätigt";s=(r.prev?"Das Datum ist nach dem Vorjahr geschätzt.":"Das Datum stammt aus einem Laufkalender, der Veranstalter hat es noch nicht bestätigt.")+" Anmeldung und Preise stehen noch nicht fest."}
  else return"";
  return'<div class="status s-'+c+'" role="status">'+ST_IC[ic]+'<div><b>'+t+'</b><span>'+s+'</span></div></div>'}
// Startgeld: steht der Text klar als „Strecke … Betrag €“, wird er zur Liste; sonst bleibt er Text
function priceList(txt){if(!txt)return"";
  const parts=[];
  for(const g of txt.split(/\s*[;·]\s*/)){const items=g.split(/,\s+(?=[0-9A-ZÄÖÜ])/).map(s=>s.trim()).filter(Boolean),late=/^Nachmeldung/i.test(items[0]||"");
    items.forEach((s,i)=>parts.push(late&&i>0&&!/^Nachmeldung/i.test(s)?"Nachmeldung "+s:s))}   // „Nachmeldung A 17 €, B 10 €“: auch B ist Nachmeldung
  if(parts.length<2)return"";
  const re=/(\+?\d{1,4}(?:[.,]\d{1,2})?)\s?(?:€|Euro)/g,rows=[];
  for(const p of parts){const m=[...p.matchAll(re)];if(m.length!==1)return"";
    const label=p.replace(m[0][0],"").replace(/\s*\bje\b\s*$/i,"").replace(/^[\s:–-]+|[\s:–-]+$/g,"");
    rows.push([label||"Startgeld",m[0][1]+" €"])}
  return'<ul class="prices">'+rows.map(x=>'<li'+(/^Nachmeldung/i.test(x[0])?' class="late"':"")+'><span>'+esc(x[0])+'</span><b class="pv">'+esc(x[1])+'</b></li>').join("")+'</ul>'}
function kvRows(rows){const have=rows.filter(x=>x[1]);return have.length?'<dl class="kv">'+have.map(x=>'<dt>'+x[0]+'</dt><dd>'+x[1]+'</dd>').join("")+'</dl>':""}

// Wetter: 7-Tage-Vorhersage (Open-Meteo)
const WMO={0:"Sonnig",1:"Überwiegend sonnig",2:"Teils bewölkt",3:"Bewölkt",45:"Nebel",48:"Nebel mit Reif",51:"Leichter Niesel",53:"Niesel",55:"Starker Niesel",56:"Gefrierender Niesel",57:"Gefrierender Niesel",61:"Leichter Regen",63:"Regen",65:"Starker Regen",66:"Gefrierender Regen",67:"Gefrierender Regen",71:"Leichter Schneefall",73:"Schneefall",75:"Starker Schneefall",77:"Schneegriesel",80:"Leichte Schauer",81:"Schauer",82:"Starke Schauer",85:"Schneeschauer",86:"Starke Schneeschauer",95:"Gewitter",96:"Gewitter mit Hagel",99:"Gewitter mit Hagel"};
function wxIcon(c){const k=c===0||c===1?"sun":c===2?"part":c===3?"cloud":c===45||c===48?"fog":c>=95?"storm":(c>=71&&c<=77)||c===85||c===86?"snow":"rain";
  const sun='<circle cx="12" cy="12" r="5" fill="var(--trail)"/>',cl='<path d="M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 7 18z" fill="var(--muted)" opacity=".75"/>',cl2=cl.replace('18h10','15h10').replace('0 0 0 7 18z','0 0 0 7 15z');
  const g={sun:sun,part:'<circle cx="9" cy="9" r="4.5" fill="var(--trail)"/>'+cl,cloud:cl,fog:'<path d="M4 9h16M3 13h18M5 17h14" stroke="var(--muted)" stroke-width="2" stroke-linecap="round"/>',
   rain:cl2+'<path d="M9 18l-1 3M13 18l-1 3M17 18l-1 3" stroke="var(--road)" stroke-width="2" stroke-linecap="round"/>',
   snow:cl2+'<circle cx="9" cy="20" r="1.3" fill="var(--road)"/><circle cx="13" cy="21" r="1.3" fill="var(--road)"/><circle cx="17" cy="20" r="1.3" fill="var(--road)"/>',
   storm:cl2+'<path d="M13 15l-3 4h3l-2 4" stroke="var(--trail)" stroke-width="2" fill="none" stroke-linejoin="round"/>'};
  return '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">'+g[k]+'</svg>'}
async function loadWeather(r,days){const el=$("wxbody");if(!el)return;
  try{const u="https://api.open-meteo.com/v1/forecast?latitude="+r.la+"&longitude="+r.lo+"&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&hourly=temperature_2m&timezone=Europe%2FBerlin&forecast_days=16";
    const ctl=new AbortController();setTimeout(()=>ctl.abort(),6000);
    const j=await (await fetch(u,{signal:ctl.signal})).json(),D=j.daily;if(!D||!D.time||!D.time.length)throw 0;
    const cell=i=>{const d=dt(D.time[i]),race=D.time[i]>=r.d&&D.time[i]<=(r.e||r.d);
      return '<li class="wxd'+(race?" race":"")+'"><span class="wd">'+(i===0?"Heute":WD[d.getDay()])+'</span><small>'+d.getDate()+'.'+(d.getMonth()+1)+'.</small>'+wxIcon(D.weather_code[i])+
       '<b>'+Math.round(D.temperature_2m_max[i])+'°</b><small>'+Math.round(D.temperature_2m_min[i])+'°</small><span class="rp">'+(D.precipitation_probability_max[i]??0)+' %</span>'+(race?'<span class="tagr">Lauf</span>':"")+'</li>'};
    let html='<ol class="wxrow" aria-label="Wetter der nächsten 7 Tage">'+[0,1,2,3,4,5,6].filter(i=>i<D.time.length).map(cell).join("")+'</ol>';
    const ri=D.time.indexOf(r.d);
    if(ri>=0){let atStart="";if(r.st&&j.hourly){const t=j.hourly.temperature_2m[ri*24+parseInt(r.st,10)];if(t!=null)atStart=' · zum Start um '+esc(r.st)+' Uhr '+Math.round(t)+' °C'}
      html+='<div class="wxs"><b>Am Lauftag:</b> '+(WMO[D.weather_code[ri]]||"")+', '+Math.round(D.temperature_2m_min[ri])+' bis '+Math.round(D.temperature_2m_max[ri])+' °C, Regenrisiko '+(D.precipitation_probability_max[ri]??0)+' %, Wind bis '+Math.round(D.wind_speed_10m_max[ri])+' km/h'+atStart+'</div>'}
    else if(days>15){const d=dt(r.d);d.setDate(d.getDate()-15);html+='<div class="src">Die Vorhersage für den Lauftag selbst gibt es ab '+d.getDate()+"."+(d.getMonth()+1)+"."+d.getFullYear()+'.</div>'}
    el.className="wx";el.innerHTML=html+'<span class="src">Regen-% = Regenrisiko · Open-Meteo, Stand '+new Date().toLocaleString("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})+' Uhr</span>'}
  catch(e){if($("wxbody"))$("wxbody").textContent="Die Live-Vorhersage lädt erst in der fertigen App. Bis dahin hilft der Link."}}

// Detailseite
let lastFocus=null,curId=null,animNext=true;
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function riseIn(el){if(RM)return;[...el.children].slice(0,14).forEach((c,i)=>{c.classList.add('rise');c.style.setProperty('--i',i)})}
function countUp(el,to){if(RM||!el||to<2)return;const t0=performance.now(),d=650;const f=t=>{const p=Math.min(1,(t-t0)/d),v=Math.round(to*(1-Math.pow(1-p,3)));el.firstChild.nodeValue=String(v);if(p<1)requestAnimationFrame(f)};el.firstChild.nodeValue='0';requestAnimationFrame(f)}
function openDetail(id){const r=R.find(x=>x.id===id);if(!r)return;if($("detail").hidden)lastFocus=document.activeElement;curId=id;
  const fav=state.favs.includes(r.id),reg=state.reg.includes(r.id),days=daysTo(r.d),ri=regInfo(r),loc=(r.sp||r.o),det=calDetails(r);
  const legs=r.k.map((k,i)=>{const h=r.hm&&r.hm[i];return'<div class="leg'+(r.t==="trail"?" trail":"")+'"><span>'+esc(lab(k))+'</span>'+(h?'<span class="bar2" style="max-width:'+Math.max(12,Math.min(160,h/20))+'px"></span><span>'+h.toLocaleString("de-DE")+' Hm</span>':"")+'</div>'}).join("");
  const when=longDate(r.d)+(r.e?" bis "+longDate(r.e):"");
  const tile=(label,v,sub)=>'<div class="stat"><span class="lbl">'+label+'</span><span class="v'+(v?"":" dim")+'">'+(v||"offen")+'</span>'+(sub?'<span class="s">'+sub+'</span>':"")+'</div>';
  const kmMax=r.k.length?lab(r.k[r.k.length-1]):"";
  const tiles=tile("Strecken",r.k.length===1?esc(lab(r.k[0])):r.k.length+" Strecken",r.k.length>1?"bis "+esc(kmMax):"")+
    (r.t==="trail"?tile("Höhenmeter",r.hmMax?"bis "+r.hmMax.toLocaleString("de-DE"):"",r.hmMax?"Hm":""):tile("Startzeit",r.st?esc(r.st):"",r.st?(r.prevF.has("st")?"Uhr · Vorjahr":"Uhr"):""))+
    tile("Startgeld",r.price?priceTxt(r.price):(r.fee?"siehe unten":""),r.price&&r.price.prev?"Vorjahrespreis":"")+
    tile("Anmeldung",ri?ri.s:"",ri&&ri.c==="hot"?ri.t:"");
  // Anmeldung & Kosten
  const plist=priceList(r.fee);
  const regRows=[["Anmeldung",ri&&(r.ro||ri.c==="full"||ri.c==="plain")?esc(ri.t):""],["Anmeldestart",r.ro?fmt(r.ro):""],["Meldeschluss",r.rc?fmt(r.rc):""],["Startgeld",plist?"":V(r,"fee")],
    ["Teilnehmer&shy;limit",V(r,"limit")+(r.soldout?' <span class="pill full">ausgebucht</span>':"")],["Im Startgeld",r.incl?esc(r.incl):""],["Nachmeldung",r.late?esc(r.late):""]];
  const regMiss=[];if(!r.fee&&!r.na.has("fee"))regMiss.push("Startgeld");if(!r.rc&&!r.na.has("rc"))regMiss.push("Meldeschluss");if(!r.ro&&!r.rc&&!r.na.has("ro"))regMiss.push("Anmeldestart");if(!r.limit&&!r.na.has("limit"))regMiss.push("Teilnehmerlimit");
  // Am Lauftag
  const dayMain=[["Startzeit",r.st?'<span class="bigv">'+esc(r.st)+' Uhr</span>'+(r.prevF.has("st")?' <span class="vj">Vorjahr</span>':""):V(r,"st"," Uhr")],["Start&shy;unterlagen",V(r,"pick")],["Anreise &amp; Parken",V(r,"park")],["Umkleide &amp; Duschen",r.showers?esc(r.showers):""]];
  const dayMore=[["Start/Ziel",V(r,"sp")],["Verpflegung",V(r,"aid")],["Vor Ort",r.extras?esc(r.extras):""]];
  const dayHtml=kvRows(dayMain)+(dayMore.some(x=>x[1])?'<details class="more"'+(dayMain.some(x=>x[1])?"":" open")+'><summary>Mehr zum Lauftag</summary>'+kvRows(dayMore)+'</details>':"");
  const dayMiss=[];[["st","Startzeit"],["pick","Startunterlagen"],["park","Parken"],["aid","Verpflegung"]].forEach(([k,l])=>{if(!r[k]&&!r.na.has(k))dayMiss.push(l)});
  const gmaps="https://www.google.com/maps/dir/?api=1&destination="+r.la+","+r.lo,amaps="https://maps.apple.com/?daddr="+r.la+","+r.lo+"&q="+encodeURIComponent(r.n);
  $("detail").innerHTML='<div class="in">'+
   '<div class="dhero '+r.t+'"><div class="htools"><button class="rb" type="button" data-close aria-label="Zurück">'+IC.back+'</button><div class="grp">'+
     '<button class="rb" type="button" data-share="'+r.id+'" aria-label="Lauf teilen">'+IC.share+'</button>'+
     '<button class="rb heart" type="button" data-id="'+r.id+'" aria-pressed="'+fav+'" aria-label="'+(fav?"Aus Meine Läufe entfernen":"Merken")+'">'+HEART+'</button></div></div>'+
     '<div class="top">'+leafHTML(r)+'<div class="tt"><span class="kick">'+(r.t==="trail"?"Trail":"Straße")+' · '+esc(r.o)+'</span><h2 id="d-title">'+esc(r.n)+'</h2><span class="when">'+when+'</span></div></div>'+
     '<div class="pills">'+(r.ok?'<span class="pill ok">Termin bestätigt</span>':'<span class="pill open">Termin offen'+(r.prev?' · Vorjahr '+fmt(r.prev):'')+'</span>')+
     (reg?'<span class="pill reg">Angemeldet ✓</span>':"")+'<span class="hchip">'+(days<=0?"Heute":"noch <b>"+days+"</b> Tage")+'</span>'+(r.dist==null?"":'<span class="hchip"><b>'+r.dist+'</b> km entfernt</span>')+'</div></div>'+
   '<div class="regbar'+(r.u?"":" solo")+'" role="group" aria-label="Anmeldung">'+statusBanner(r)+
     (r.u?'<a class="cta" href="'+esc(r.u)+'" target="_blank" rel="noopener" data-goreg="'+r.id+'">Zur Anmeldung '+IC.ext.replace('<svg','<svg width="16" height="16"')+'</a>':"")+
     '<button type="button" class="regbtn" data-reg="'+r.id+'" aria-pressed="'+reg+'">'+(reg?"✓ Angemeldet":"Ich bin angemeldet")+'</button>'+
     '<span class="reghint">Schon angemeldet? Hake es hier ab, dann steht der Lauf unter „Meine Läufe“.</span></div>'+
   '<div class="stats">'+tiles+'</div>'+
   '<section class="box"><h3>'+IC.route+'Strecke</h3>'+(r.course?'<div>'+esc(r.course)+'</div>':"")+(r.cutoff?'<div><b>Zeitlimit:</b> '+esc(r.cutoff)+'</div>':"")+'<div class="legs">'+legs+'</div>'+profileSVG(r)+
     (r.gpx?'<div class="btns"><a class="btn" href="'+esc(r.gpx)+'" target="_blank" rel="noopener">GPX-Track '+IC.ext+'</a></div>':"")+'</section>'+
   '<section class="box"><h3>'+IC.euro+'Anmeldung &amp; Kosten'+flagBtn(r.id,"Kosten oder Fristen falsch")+'</h3>'+(plist?plist+(r.prevF.has("fee")?'<span class="vj">Vorjahr</span>':""):"")+kvRows(regRows)+missLine(regMiss,r.id)+'</section>'+
   '<section class="box"><h3>'+IC.flag+'Am Lauftag'+flagBtn(r.id,"Lauftag-Infos falsch")+'</h3>'+dayHtml+missLine(dayMiss,r.id)+'</section>'+
   '<section class="box"><h3>'+IC.car+'Anfahrt</h3>'+
     '<div class="navaddr">'+NAV_IC.pin+'<div><b>'+esc(loc)+'</b>'+(r.dist==null?"":'<span>'+r.dist+' km Luftlinie ab '+esc(state.home.name.replace(/^\d{5}\s/,""))+'</span>')+'</div></div>'+
     '<div class="navlist">'+(IS_IOS?navBtn(amaps,"Apple Karten",NAV_IC.arrow,true)+navBtn(gmaps,"Google Maps",NAV_IC.pin,false):navBtn(gmaps,"Google Maps",NAV_IC.pin,IS_MOBILE)+navBtn(amaps,"Apple Karten",NAV_IC.arrow,false))+'</div>'+
     '<button type="button" class="linkbtn" data-copyaddr="'+esc(loc)+'">Adresse kopieren</button></section>'+
   '<section class="box" id="wx"><h3>'+IC.sun+'Wetter in '+esc(r.o)+'</h3><div id="wxbody" class="na">Vorhersage wird geladen …</div>'+
     '<div class="btns"><a class="btn" href="https://www.meteoblue.com/de/wetter/woche/'+r.la.toFixed(3)+'N'+r.lo.toFixed(3)+'E" target="_blank" rel="noopener">Wetter öffnen '+IC.ext+'</a></div></section>'+
   gearBox(r)+
   '<section class="box"><h3>'+IC.cal+'In den Kalender</h3><div class="btns"><a class="btn" href="ics/'+encodeURIComponent(r.id)+'.ics">Apple Kalender (iPhone), mit Erinnerungen</a><a class="btn" href="'+esc(gcal(r.n,r.d,r.e,det,loc,r.st))+'" target="_blank" rel="noopener">Google '+IC.ext+'</a><a class="btn" href="'+esc(ocal(r.n,r.d,r.e,det,loc))+'" target="_blank" rel="noopener">Outlook '+IC.ext+'</a>'+
     (r.rc&&daysTo(r.rc)>=0?'<a class="btn" href="'+esc(gcal("Meldeschluss: "+r.n,r.rc,null,"Letzter Tag zur Anmeldung für "+r.n+" am "+fmt(r.d)+" · "+r.u,""))+'" target="_blank" rel="noopener">Meldeschluss (Google) '+IC.ext+'</a>':"")+'</div><span class="src">Die Apple-Datei enthält Lauftag, Meldeschluss und Anmeldestart, soweit sie noch kommen, mit Erinnerungen: Lauftag eine Woche und einen Tag vorher, Meldeschluss 7, 3 und 1 Tag vorher.</span></section>'+
   ((r.info||r.note)?'<section class="box"><h3>'+IC.info+'Gut zu wissen</h3>'+(r.info?'<div>'+esc(r.info)+'</div>':"")+(r.note?'<div>'+esc(r.note)+'</div>':"")+'</section>':"")+
   '<span class="src">Infos: '+esc(host(r.u))+(r.src?' · Termin-Quelle: '+esc(host(r.src)):"")+(r.checked?' · geprüft am '+fmt(r.checked):"")+'. Angaben ohne Gewähr.</span>'+
   '<button type="button" class="reportbig" data-report="'+r.id+'">'+IC.flag+'Stimmt etwas nicht? Melden</button><span class="src rnote">Dauert eine halbe Minute und hilft allen Läufern.</span>'+
  '</div>';
  $("detail").hidden=false;$("detail").scrollTop=0;loadWeather(r,days);document.body.classList.add("locked");$("detail").querySelector("[data-close]").focus({preventScroll:true,focusVisible:false})}
// Detailseite schließen: kurz zur Seite wegschieben (nur wenn Bewegung erlaubt), dann ausblenden
const MOTION=!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);
function closeDetail(){const d=$("detail");if(d.hidden||d.classList.contains("leaving"))return;
  const finish=()=>{d.classList.remove("leaving");d.hidden=true;curId=null;document.body.classList.remove("locked");render();
    const b=lastFocus&&lastFocus.dataset&&lastFocus.dataset.open?document.querySelector('[data-open="'+lastFocus.dataset.open+'"]'):null;if(b)b.focus({preventScroll:true})};
  if(!MOTION){finish();return}
  d.classList.add("leaving");let done=false;const go=()=>{if(!done){done=true;finish()}};
  d.addEventListener("animationend",go,{once:true});setTimeout(go,320)}
function toggleFav(id){const i=state.favs.indexOf(id);if(i<0)state.favs.push(id);else{state.favs.splice(i,1);state.reg=state.reg.filter(x=>x!==id)}save()}
function syncHeart(b,id){const on=state.favs.includes(id);b.setAttribute("aria-pressed",on);b.setAttribute("aria-label",on?"Aus Meine Läufe entfernen":"Merken")}
$("detail").addEventListener("click",e=>{if(e.target.closest("[data-close]")){closeDetail();return}
  const sh=e.target.closest("[data-share]");if(sh){shareRace(sh.dataset.share);return}  const ca=e.target.closest("[data-copyaddr]");if(ca){const txt=ca.textContent;
    (navigator.clipboard?navigator.clipboard.writeText(ca.dataset.copyaddr):Promise.reject()).then(()=>{ca.textContent="Kopiert ✓"}).catch(()=>{ca.textContent="Nicht möglich, bitte markieren und kopieren"}).finally(()=>setTimeout(()=>{ca.textContent=txt},2000));return}
  const rp=e.target.closest("[data-report]");if(rp){openReport(rp.dataset.report,rp.dataset.kind);return}
  const rg=e.target.closest("[data-reg]");if(rg){const id=rg.dataset.reg,i=state.reg.indexOf(id);
    if(i<0){state.reg.push(id);if(!state.favs.includes(id))state.favs.push(id)}else state.reg.splice(i,1);save();
    const on=state.reg.includes(id);rg.setAttribute("aria-pressed",on);rg.textContent=on?"✓ Angemeldet":"Ich bin angemeldet";
    toast(on?"Als angemeldet markiert ✓":"Anmeldung wieder entfernt");
    const h=$("detail").querySelector(".heart");if(h)syncHeart(h,id);return}
  const b=e.target.closest(".heart");if(b){const id=b.dataset.id;toggleFav(id);syncHeart(b,id);toast(state.favs.includes(id)?"Gemerkt · steht unter „Meine Läufe“":"Aus „Meine Läufe“ entfernt");
    const rg2=$("detail").querySelector("[data-reg]");if(rg2&&!state.reg.includes(id)){rg2.setAttribute("aria-pressed","false");rg2.textContent="Ich bin angemeldet"}}});
$("detail").addEventListener("change",e=>{const c=e.target.closest("[data-pack]");if(!c)return;const id=c.dataset.pack,i=+c.value;
  state.packed=state.packed||{};const a=state.packed[id]||(state.packed[id]=[]),k=a.indexOf(i);c.checked?(k<0&&a.push(i)):(k>=0&&a.splice(k,1));save();
  const r=R.find(x=>x.id===id);if($("packcount")&&r)$("packcount").textContent=a.length+" von "+r.gear.length+" eingepackt"});

// Bottom-Sheets (Standort, Teilen)
let sheetFocus=null;
function openSheet(id){sheetFocus=document.activeElement;$("backdrop").hidden=false;$(id).hidden=false;document.body.classList.add("locked");const f=$(id).querySelector("input,button,a");if(f)f.focus()}
// Erster Start: das Standort-Fenster als Begrüßung („Wo läufst du?“), danach nie wieder von selbst
function openWelcome(){$("locsheet").classList.add("welcome");$("loc-h").textContent="Wo läufst du?";$("loc-done").textContent="Läufe anzeigen";
  openSheet("locsheet");$("backdrop").hidden=true;if(document.activeElement&&document.activeElement.blur)document.activeElement.blur()}
function endWelcome(){const s=$("locsheet");if(!s.classList.contains("welcome"))return;
  s.classList.remove("welcome");$("loc-h").textContent="Startpunkt ändern";$("loc-done").textContent="Fertig";state.onboarded=true;save()}
// Fenster am Strich oder oben nach unten wischen schließt sie (nicht im Begrüßungsbildschirm)
document.querySelectorAll(".bsheet").forEach(sh=>{let y0=null,x0=0,dy=0,t0=0,drag=false;
  sh.addEventListener("touchstart",e=>{y0=null;if(e.touches.length!==1||sh.classList.contains("welcome"))return;
    if(!e.target.closest(".grip,h2"))return;   // gezogen wird nur am Strich oder an der Überschrift
    const t=e.touches[0];y0=t.clientY;x0=t.clientX;dy=0;t0=Date.now();drag=false},{passive:true});
  sh.addEventListener("touchmove",e=>{if(y0===null)return;const t=e.touches[0];dy=t.clientY-y0;
    if(!drag){if(dy>8&&dy>Math.abs(t.clientX-x0))drag=true;else if(Math.abs(t.clientX-x0)>12){y0=null;return}}
    if(drag){if(dy<0)dy=0;sh.style.animation="none";sh.style.transition="none";sh.style.transform="translateY("+dy+"px)";e.preventDefault()}},{passive:false});
  sh.addEventListener("touchend",()=>{if(y0===null)return;y0=null;if(!drag)return;drag=false;
    const schnell=dy/Math.max(1,Date.now()-t0)>0.6;sh.style.transition="transform .18s ease";
    if(dy>110||schnell){sh.style.transform="translateY(100%)";setTimeout(closeSheets,170)}else sh.style.transform=""});
  sh.addEventListener("touchcancel",()=>{y0=null;drag=false;sh.style.transform=""})});
function closeSheets(){if(!$("locsheet").hidden)commitStart();document.querySelectorAll(".bsheet").forEach(s=>{s.style.animation="";s.style.transform="";s.style.transition=""});endWelcome();const ni=document.querySelector(".nav .in");if(ni)ni.dataset.i=["road","trail","fav"].indexOf(state.tab);["locsheet","sharesheet","setsheet","asksheet","legalsheet","bellsheet","datasheet"].forEach(i=>$(i).hidden=true);$("backdrop").hidden=true;if($("detail").hidden&&$("report").hidden)document.body.classList.remove("locked");if(sheetFocus&&sheetFocus.focus)sheetFocus.focus()}
$("backdrop").addEventListener("click",()=>{if(!$("locsheet").hidden&&!commitStart())return;closeSheets()});
$("loc").addEventListener("click",()=>{$("startinfo").classList.remove("err");$("startinfo").textContent="";if(state.onboarded||homeShown)showHome();openSheet("locsheet")});
// Getippte, aber nicht aus der Liste gewählte PLZ/Ort gilt beim Schließen: der erste Vorschlag wird genommen
function commitStart(){const f=$("start"),v=f.value.trim();if(!v||f.parentElement.classList.contains("gesetzt"))return true;
  const h=hits.length?hits:find(v);if(h[0]){choose(h[0]);return true}
  $("startinfo").classList.add("err");$("startinfo").textContent="Kein Ort gefunden. Versuch es mit einer Postleitzahl.";return false}
$("loc-done").addEventListener("click",()=>{if(commitStart())closeSheets()});
// Einstellungen: Darstellung Automatisch / Hell / Dunkel (auf dem Gerät gespeichert)
const HOST_THEME=document.documentElement.getAttribute("data-theme");
function applyTheme(){const t=state.theme||"auto",el=document.documentElement;
  if(t==="auto"){if(HOST_THEME)el.setAttribute("data-theme",HOST_THEME);else el.removeAttribute("data-theme")}else el.setAttribute("data-theme",t);
  document.querySelectorAll("[data-theme-set]").forEach(b=>b.setAttribute("aria-checked",b.dataset.themeSet===t))}
$("gear").addEventListener("click",()=>{syncRemind();syncStart();$("dist-sum").textContent=distSum();document.querySelector(".nav .in").dataset.i=3;$("set-stand").textContent=$("stand").textContent+"Die Läufe werden jede Nacht geprüft. App-Version "+APP_VERSION+".";openSheet("setsheet");const c=$("setsheet").querySelector('[aria-checked="true"]');if(c)c.focus()});
$("setsheet").addEventListener("click",e=>{const b=e.target.closest("[data-theme-set]");if(b){state.theme=b.dataset.themeSet;save();applyTheme()}
  const rb=e.target.closest("[data-remind]");if(rb){state.remind=+rb.dataset.remind;save();syncRemind();render()}});
$("remind").addEventListener("click",e=>{const o=e.target.closest("[data-open]");if(o)openDetail(o.dataset.open)});
$("bell").addEventListener("click",()=>{const its=remindItems();state.seen={};its.forEach(x=>{state.seen[x.r.id+"|"+x.t]=urg(x.k)});save();
  $("bell-n").hidden=true;$("bell").classList.remove("wig");
  $("bl-t").innerHTML=its.map(x=>'<button type="button" class="soonrow" data-open="'+x.r.id+'"><span>'+x.t+': <b>'+esc(x.r.n)+'</b></span><span class="'+urg(x.k)+'">'+whenTxt(x.k)+'</span></button>').join("");openSheet("bellsheet")});
$("bl-t").addEventListener("click",e=>{const o=e.target.closest("[data-open]");if(o){closeSheets();openDetail(o.dataset.open)}});
$("bl-done").addEventListener("click",closeSheets);
$("sbtn").addEventListener("click",()=>{$("field").hidden=false;$("q").focus()});
$("q").addEventListener("blur",()=>setTimeout(()=>{if(!$("q").value.trim())$("field").hidden=true},250));
$("set-done").addEventListener("click",closeSheets);
// Platzhalter: Punkte, die noch nicht fertig sind, und die Rechtstexte (Inhalt folgt vor dem öffentlichen Start)
$("setsheet").addEventListener("click",e=>{
  const s=e.target.closest("[data-soon]");if(s){toast(s.dataset.soon+" kommt bald");return}
  const l=e.target.closest("[data-legal]");if(l){$("lg-h").textContent=l.dataset.legal;$("lg-t").innerHTML=LEGAL[l.dataset.legal]||"";$("setsheet").hidden=true;$("legalsheet").hidden=false;$("legalsheet").scrollTop=0;$("lg-done").focus()}});
$("lg-done").addEventListener("click",()=>{$("legalsheet").hidden=true;$("setsheet").hidden=false});
$("set-loc").addEventListener("click",()=>{$("setsheet").hidden=true;$("locsheet").hidden=false;$("start").focus()});
// Meine Distanzen: die Streckenwahl liegt im Startpunkt-Fenster und bleibt auf dem Gerät gespeichert
function distSum(){const n={"5":"5 km","10":"10 km",hm:"HM",m:"M",ultra:"Ultra",o:"Andere"};return state.dists.length?DORDER.filter(k=>state.dists.includes(k)).map(k=>n[k]||k).join(", "):"Alle"}
$("set-dist").addEventListener("click",()=>{$("setsheet").hidden=true;$("locsheet").hidden=false;$("dchips").scrollIntoView({block:"center"})});
// Startseite beim Öffnen
function syncStart(){document.querySelectorAll("[data-start]").forEach(b=>b.setAttribute("aria-checked",b.dataset.start===(state.start||"last")))}
$("setsheet").addEventListener("click",e=>{const b=e.target.closest("[data-start]");if(b){state.start=b.dataset.start;save();syncStart()}});
// Sichern und Wiederherstellen: ein Code zum Aufbewahren (iPhone-App-Fenster können keine Dateien speichern)
const BACKUP_KEYS=["favs","reg","packed","home","radius","dists","theme","remind","start","view"];
function backupCode(){const o={};BACKUP_KEYS.forEach(k=>{if(state[k]!==undefined)o[k]=state[k]});return"PH1:"+btoa(unescape(encodeURIComponent(JSON.stringify(o))))}
function restoreCode(c){let o;try{c=c.trim();if(!c.startsWith("PH1:"))throw 0;o=JSON.parse(decodeURIComponent(escape(atob(c.slice(4)))))}catch(e){return"Der Code ist nicht gültig. Kopiere ihn vollständig, er beginnt mit PH1:."}
  const ids=a=>Array.isArray(a)?a.filter(x=>typeof x==="string"&&R.some(r=>r.id===x)):[];
  if(o.favs)state.favs=ids(o.favs);if(o.reg)state.reg=ids(o.reg).filter(x=>state.favs.includes(x));
  if(o.packed&&typeof o.packed==="object")state.packed=o.packed;
  if(o.home&&typeof o.home.lat==="number"&&typeof o.home.lon==="number"&&typeof o.home.name==="string")state.home={name:o.home.name,lat:o.home.lat,lon:o.home.lon};
  if([20,30,50,75,100,150,200].includes(+o.radius)||(+o.radius>=10&&+o.radius<=200))state.radius=+o.radius;
  if(Array.isArray(o.dists))state.dists=o.dists.filter(k=>DORDER.includes(k));
  if(["auto","light","dark"].includes(o.theme))state.theme=o.theme;
  if([0,3,7,14].includes(+o.remind))state.remind=+o.remind;
  if(["last","road","trail","fav"].includes(o.start))state.start=o.start;
  save();applyTheme();syncRemind();syncStart();render();return"Wiederhergestellt: "+state.favs.length+" gemerkte Läufe, davon "+state.reg.length+" angemeldet."}
$("set-backup").addEventListener("click",()=>{$("da-code").value=backupCode();$("da-in").value="";$("da-msg").textContent="";$("setsheet").hidden=true;$("datasheet").hidden=false;$("da-done").focus()});
$("da-copy").addEventListener("click",async()=>{const t=$("da-code");try{await navigator.clipboard.writeText(t.value);$("da-msg").textContent="Kopiert ✓ Jetzt in einer Notiz ablegen."}catch(err){t.focus();t.select();$("da-msg").textContent="Code markiert – jetzt kopieren (lange tippen)."}});
$("da-restore").addEventListener("click",()=>{const v=$("da-in").value;$("da-msg").textContent=v.trim()?restoreCode(v):"Füge zuerst den Code ein."});
$("da-done").addEventListener("click",()=>{$("datasheet").hidden=true;$("setsheet").hidden=false});
// Alles zurücksetzen: zweimal tippen
let resetArmed=0;
$("set-reset").addEventListener("click",()=>{const em=$("reset-em");
  if(!resetArmed){resetArmed=setTimeout(()=>{resetArmed=0;em.textContent="löschen"},4000);em.textContent="nochmal tippen";return}
  clearTimeout(resetArmed);try{localStorage.removeItem("strail2")}catch(e){}location.reload()});
// Feedback geben: gleiche Sammelstelle wie die Fehlermeldungen, Art „feedback“
function openFeedback(){const el=$("report");reportFocus=document.activeElement;closeSheets();
  el.innerHTML='<div class="in"><button class="back" type="button" data-rclose>← Zurück</button><h2 id="rp-title" class="rph">Feedback geben</h2>'+
   '<p class="src">Was gefällt dir, was fehlt, was nervt? Schreib einfach los.</p>'+
   '<form id="rform" class="rform" novalidate><label><span class="lbl">Dein Feedback</span><textarea name="text" rows="6" placeholder="z. B. Mir fehlt der Filter für Läufe mit Hund"></textarea></label>'+
   '<p class="src rnote2">Bitte keine persönlichen Daten eintragen (Name, Telefon, E-Mail). Wir brauchen sie nicht.</p>'+
   '<button class="cta" type="submit">Feedback absenden</button><div id="rmsg" class="src" aria-live="polite"></div></form></div>';
  el.dataset.race="";el.dataset.mode="feedback";el.hidden=false;el.scrollTop=0;document.body.classList.add("locked");el.querySelector("[data-rclose]").focus()}
$("set-feedback").addEventListener("click",openFeedback);

// Angemeldet? Nach „Zur Anmeldung“ fragt die App beim Zurückkommen nach
function setReg(id){if(!state.reg.includes(id))state.reg.push(id);if(!state.favs.includes(id))state.favs.push(id);save();toast("Als angemeldet gespeichert ✓");
  const rg=$("detail").querySelector('[data-reg="'+id+'"]');if(rg){rg.setAttribute("aria-pressed","true");rg.textContent="✓ Angemeldet";const h=$("detail").querySelector(".heart");if(h)syncHeart(h,id)}}
document.addEventListener("click",e=>{const a=e.target.closest("[data-goreg]");if(a&&!state.reg.includes(a.dataset.goreg)){state.pendingReg={id:a.dataset.goreg,t:Date.now()};save()}});
function askReg(){const p=state.pendingReg;if(!p||!R.length||!$("asksheet").hidden)return;
  if(Date.now()-p.t<4000)return;
  if(Date.now()-p.t>3*864e5||state.reg.includes(p.id)){state.pendingReg=null;save();return}
  const r=R.find(x=>x.id===p.id);if(!r){state.pendingReg=null;save();return}
  $("asksheet").innerHTML='<div class="in"><div class="grip"></div><h2 id="ask-h">Hast du dich angemeldet?</h2><p class="src"><b>'+esc(r.n)+'</b> · '+longDate(r.d)+'</p>'+
   '<p class="src">Dann landet der Lauf unter „Meine Läufe → Angemeldet“, mit Countdown und Lauftag-Infos.</p>'+
   '<div class="shareopts"><button class="cta" type="button" data-askyes="'+r.id+'">Ja, ich bin angemeldet</button><button class="btn" type="button" data-askno>Noch nicht</button></div>'+
   '<div class="askflag"><span>Haben Datum und Preis gestimmt?</span><button type="button" class="flag" data-askreport="'+r.id+'">'+IC.flag+'Nein, melden</button></div></div>';
  openSheet("asksheet")}
$("asksheet").addEventListener("click",e=>{const y=e.target.closest("[data-askyes]");
  if(y){setReg(y.dataset.askyes);state.pendingReg=null;save();closeSheets();render();return}
  const ar=e.target.closest("[data-askreport]");if(ar){closeSheets();openReport(ar.dataset.askreport,"Kosten oder Fristen falsch");return}
  if(e.target.closest("[data-askno]")){state.pendingReg=null;save();closeSheets()}});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")setTimeout(askReg,400)});
window.addEventListener("focus",()=>setTimeout(askReg,400));

// Teilen: System-Teilen (in der echten App), sonst WhatsApp oder Text kopieren
function shareText(r){return r.n+" – "+longDate(r.d)+" in "+r.o+" ("+r.k.map(lab).join(", ")+"). Infos: "+r.u}
async function shareRace(id){const r=R.find(x=>x.id===id);if(!r)return;const link=APP_URL+"#"+r.id,txt=shareText(r);
  if(navigator.share){try{await navigator.share({title:r.n,text:txt,url:link});return}catch(e){if(e&&e.name==="AbortError")return}}
  const full=txt+"\nIn der App: "+link;
  $("sharesheet").innerHTML='<div class="in"><div class="grip"></div><h2 id="sh-h">Lauf teilen</h2><p class="src">'+esc(r.n)+' · '+fmt(r.d)+'</p><div class="shareopts">'+
   '<a class="btn" href="https://wa.me/?text='+encodeURIComponent(full)+'" target="_blank" rel="noopener">'+IC.whatsapp+'Per WhatsApp schicken</a>'+
   '<button class="btn" type="button" data-copyshare>'+IC.copy+'Text kopieren</button></div>'+
   '<textarea readonly rows="4" class="copy" id="sharetxt">'+esc(full)+'</textarea><button class="back" type="button" data-shclose>Schließen</button></div>';
  openSheet("sharesheet")}
// App weiterempfehlen (Einstellungen): gleiche Wege wie beim Lauf teilen
async function shareApp(){const txt="Race Hunt: alle Straßen- und Trailläufe in Bayern mit Terminen, Startgeld und Meldeschluss. Kostenlos, ohne Anmeldung.";
  if(navigator.share){try{await navigator.share({title:"Race Hunt",text:txt,url:APP_URL});return}catch(e){if(e&&e.name==="AbortError")return}}
  const full=txt+"\n"+APP_URL;$("setsheet").hidden=true;
  $("sharesheet").innerHTML='<div class="in"><div class="grip"></div><h2 id="sh-h">App weiterempfehlen</h2><p class="src">Schick die App an Freunde und Lauftreff.</p><div class="shareopts">'+
   '<a class="btn" href="https://wa.me/?text='+encodeURIComponent(full)+'" target="_blank" rel="noopener">'+IC.whatsapp+'Per WhatsApp schicken</a>'+
   '<button class="btn" type="button" data-copyshare>'+IC.copy+'Text kopieren</button></div>'+
   '<textarea readonly rows="4" class="copy" id="sharetxt">'+esc(full)+'</textarea><button class="back" type="button" data-shclose>Schließen</button></div>';
  openSheet("sharesheet")}
$("set-share").addEventListener("click",shareApp);
$("sharesheet").addEventListener("click",async e=>{if(e.target.closest("[data-shclose]")){closeSheets();return}
  const c=e.target.closest("[data-copyshare]");if(c){const t=$("sharetxt");try{await navigator.clipboard.writeText(t.value);c.innerHTML=IC.copy+"Kopiert ✓"}catch(err){t.focus();t.select();c.innerHTML=IC.copy+"Text markiert – jetzt kopieren"}}});
document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(!$("backdrop").hidden)closeSheets();else if(!$("report").hidden)closeReport();else closeDetail()});

// Fehler melden / Lauf fehlt – wird an REPORT_URL gesendet; das Sonntags-Update prüft die Meldungen
const KINDS=["Info ergänzen","Termin falsch","Kosten oder Fristen falsch","Link funktioniert nicht","Lauftag-Infos falsch","Lauf findet nicht statt","Sonstiges"];
let reportFocus=null;
function openReport(id,kind){const r=id?R.find(x=>x.id===id):null,el=$("report");reportFocus=document.activeElement;
  el.innerHTML='<div class="in"><button class="back" type="button" data-rclose>← Zurück</button>'+
   '<h2 id="rp-title" class="rph">'+(r?"Fehler melden":"Lauf fehlt? Melden")+'</h2>'+
   (r?'<p class="src">Zu: <b>'+esc(r.n)+'</b> am '+fmt(r.d)+'</p>':'<p class="src">Welcher Lauf fehlt? Je mehr du weißt, desto schneller ist er drin.</p>')+
   '<form id="rform" class="rform" novalidate>'+
   (r?'<label><span class="lbl">Worum geht es?</span><select name="kind">'+KINDS.map(k=>'<option'+(k===(kind||"Termin falsch")?" selected":"")+'>'+k+'</option>').join("")+'</select></label>':
     '<label><span class="lbl">Name des Laufs</span><input name="name" autocomplete="off"></label>'+
     '<label><span class="lbl">Ort</span><input name="place" autocomplete="off"></label>'+
     '<label><span class="lbl">Datum, falls bekannt</span><input name="date" type="date"></label>'+
     '<label><span class="lbl">Link zum Veranstalter</span><input name="link" type="url" placeholder="https://"></label>')+
   '<label><span class="lbl">'+(r?"Was ist richtig?":"Weitere Hinweise")+'</span><textarea name="text" rows="4" placeholder="'+(r?"z. B. 2027 ist der Lauf am 12. Juni, Startgeld 35 €":"z. B. Distanzen, Höhenmeter")+'"></textarea></label>'+
   '<p class="src rnote2">Bitte keine persönlichen Daten eintragen (Name, Telefon, E-Mail). Wir brauchen sie nicht.</p>'+
   '<button class="cta" type="submit">Meldung absenden</button><div id="rmsg" class="src" aria-live="polite"></div></form></div>';
  el.dataset.race=id||"";el.dataset.mode="";el.hidden=false;el.scrollTop=0;document.body.classList.add("locked");el.querySelector("[data-rclose]").focus()}
function closeReport(){$("report").hidden=true;if($("detail").hidden)document.body.classList.remove("locked");if(reportFocus&&reportFocus.focus)reportFocus.focus()}
$("missing").addEventListener("click",()=>openReport(null));
$("report").addEventListener("click",async e=>{if(e.target.closest("[data-rclose]")){closeReport();return}
  const c=e.target.closest("[data-copy]");if(c){const t=$("report").querySelector(".copy");try{await navigator.clipboard.writeText(t.value);c.textContent="Kopiert ✓"}catch(err){t.focus();t.select();c.textContent="Text markiert – jetzt kopieren"}}});
$("report").addEventListener("submit",async e=>{e.preventDefault();const f=e.target,o={};new FormData(f).forEach((v,k)=>{v=String(v).trim();if(v)o[k]=v});
  const id=$("report").dataset.race||null,msg=$("rmsg"),fb=$("report").dataset.mode==="feedback";
  if(fb&&!o.text){msg.textContent="Schreib kurz, was dir einfällt.";return}
  if(!fb&&id&&!o.text){msg.textContent="Schreib kurz dazu, was richtig ist.";return}
  if(!fb&&!id&&!o.name){msg.textContent="Bitte gib mindestens den Namen des Laufs an.";return}
  const r=id?R.find(x=>x.id===id):null,rec=Object.assign({type:fb?"feedback":id?"fehler":"fehlt",race:id,race_name:r?r.n:null,status:"neu",created:new Date().toISOString()},o);
  const btn=f.querySelector("[type=submit]");btn.disabled=true;msg.textContent="Wird gesendet …";
  let ok=false;try{if(REPORT_URL){const res=await fetch(REPORT_URL,{method:"POST",headers:{"Content-Type":"application/json",apikey:REPORT_KEY,Prefer:"return=minimal"},body:JSON.stringify(rec)});ok=res.ok}}catch(err){}
  if(ok){f.innerHTML='<div class="empty"><strong>Danke für deine Meldung!</strong>Sie wird geprüft und eingearbeitet.</div><button class="back" type="button" data-rclose>Schließen</button>'}
  else{const txt="Race-Hunt-Meldung"+(r?" zu "+r.n+" ("+fmt(r.d)+")":" – Lauf fehlt")+": "+Object.values(o).join(" · ");
    msg.innerHTML='Die Meldung konnte nicht direkt gesendet werden. Kopier den Text und schick ihn ans Team:<textarea readonly rows="3" class="copy">'+esc(txt)+'</textarea><button type="button" class="back" data-copy>Text kopieren</button>';btn.disabled=false}});

// Lauf-Suche
function findRaces(q){const n=norm(q.trim());if(n.length<2)return[];const live=R.filter(r=>dt(r.e||r.d)>=TODAY),a=[],b=[];
  for(const r of live){const nn=norm(r.n),no=norm(r.o);if(nn.startsWith(n)||nn.split(/[\s\-–]+/).some(w=>w.startsWith(n)))a.push(r);else if(nn.includes(n)||no.includes(n))b.push(r)}
  const by=(x,y)=>x.d.localeCompare(y.d);return a.sort(by).concat(b.sort(by)).slice(0,8)}
let qh=[],qs=-1;
function showQ(){const ul=$("qsugg"),v=$("q").value.trim();
  if(v.length<2){ul.hidden=true;$("q").setAttribute("aria-expanded","false");return}
  ul.innerHTML=qh.length?qh.map((r,i)=>'<li role="option" data-i="'+i+'" aria-selected="'+(i===qs)+'"><b>'+esc(r.n)+'</b><span>'+fmt(r.d)+' · '+esc(r.o)+' · '+(r.t==="trail"?"Trail":"Straße")+(state.reg.includes(r.id)?" · angemeldet":state.favs.includes(r.id)?" · gemerkt":"")+'</span></li>').join(""):'<li class="none" role="option" aria-disabled="true">Kein Lauf gefunden. <span>Fehlt einer? Ganz unten auf „Lauf fehlt?“ tippen.</span></li>';
  ul.hidden=false;$("q").setAttribute("aria-expanded","true")}
function pickQ(r){$("q").value="";qh=[];qs=-1;showQ();$("q").blur();openDetail(r.id)}
$("q").addEventListener("input",e=>{qh=findRaces(e.target.value);qs=qh.length?0:-1;showQ()});
$("q").addEventListener("keydown",e=>{
  if(e.key==="ArrowDown"&&qh.length){qs=(qs+1)%qh.length;showQ();e.preventDefault()}
  else if(e.key==="ArrowUp"&&qh.length){qs=(qs-1+qh.length)%qh.length;showQ();e.preventDefault()}
  else if(e.key==="Enter"){e.preventDefault();if(qh[qs])pickQ(qh[qs])}
  else if(e.key==="Escape"){$("q").value="";qh=[];showQ()}});
$("qsugg").addEventListener("mousedown",e=>{const li=e.target.closest("li[data-i]");if(li){e.preventDefault();pickQ(qh[+li.dataset.i])}});
$("q").addEventListener("blur",()=>setTimeout(()=>{$("qsugg").hidden=true;$("q").setAttribute("aria-expanded","false")},150));

$("next").addEventListener("click",()=>{if($("next").dataset.id)openDetail($("next").dataset.id)});
document.querySelectorAll(".vb").forEach(b=>b.addEventListener("click",()=>{state.view=b.dataset.v;save();animNext=true;render()}));
function calMonth(){const t=TODAY;return state.cal||(t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0"))}
function shiftMonth(k){const [Y,M]=calMonth().split("-").map(Number),d=new Date(Y,M-1+k,1);state.cal=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");state.calDay=null;save()}
function calHTML(list,favView){
  const [Y,M]=calMonth().split("-").map(Number),first=new Date(Y,M-1,1),nd=new Date(Y,M,0).getDate(),off=(first.getDay()+6)%7,byDay={};
  list.forEach(r=>{const d=dt(r.d),e=r.e?dt(r.e):d;for(let x=new Date(d);x<=e;x.setDate(x.getDate()+1))if(x.getFullYear()===Y&&x.getMonth()===M-1)(byDay[x.getDate()]=byDay[x.getDate()]||[]).push(r)});
  if(state.calDay&&!byDay[state.calDay])state.calDay=null;
  let g='<div class="cal"><div class="calhead"><button type="button" class="calnav" data-cal="-1" aria-label="Vorheriger Monat">‹</button><strong>'+MON[M-1]+' '+Y+'</strong><button type="button" class="calnav" data-cal="1" aria-label="Nächster Monat">›</button></div><div class="calgrid">';
  ["Mo","Di","Mi","Do","Fr","Sa","So"].forEach(w=>g+='<span class="cwd">'+w+'</span>');
  for(let i=0;i<off;i++)g+='<span></span>';
  for(let d=1;d<=nd;d++){const rs=byDay[d]||[],isT=Y===TODAY.getFullYear()&&M-1===TODAY.getMonth()&&d===TODAY.getDate();
    g+='<button type="button" class="cday'+(rs.length?" has":"")+(isT?" today":"")+(state.calDay===d?" sel":"")+'" data-day="'+d+'"'+(rs.length?' aria-pressed="'+(state.calDay===d)+'"':' disabled')+' aria-label="'+d+'. '+MON[M-1]+(rs.length?", "+rs.length+(rs.length>1?" Läufe":" Lauf"):"")+'"><span class="n">'+d+'</span><span class="dots">'+rs.slice(0,3).map(r=>'<i class="'+r.t+(state.reg.includes(r.id)?" reg":"")+'"></i>').join("")+'</span></button>'}
  g+='</div><div class="calkey"><span><i></i>Straße</span><span><i class="trail"></i>Trail</span><span>Grüner Ring = angemeldet</span></div></div>';
  const sel=state.calDay?byDay[state.calDay]:null,shown=sel||list.filter(r=>{const d=dt(r.d),e=r.e?dt(r.e):d;return (d.getFullYear()===Y&&d.getMonth()===M-1)||(e.getFullYear()===Y&&e.getMonth()===M-1)});
  g+='<h2 class="month">'+(sel?state.calDay+". "+MON[M-1]:MON[M-1]+" "+Y+" · "+shown.length+(shown.length===1?" Lauf":" Läufe"))+'</h2>';
  return g+(shown.length?shown.map(r=>card(r,favView)).join(""):'<div class="empty"><strong>Keine Läufe in diesem Monat</strong>Blättere mit den Pfeilen weiter'+(favView?".":" oder vergrößere den Umkreis.")+'</div>')}
function soonBox(list){
  const soon=list.map(r=>r.ro&&daysTo(r.ro)>=0&&daysTo(r.ro)<=30?{r,k:daysTo(r.ro),t:"Anmeldung öffnet"}:r.rc&&daysTo(r.rc)>=0&&daysTo(r.rc)<=30?{r,k:daysTo(r.rc),t:"Meldeschluss"}:null).filter(Boolean).sort((a,b)=>a.k-b.k);
  return'<section class="soon" aria-label="Fristen"><span class="lbl">Fristen in den nächsten 30 Tagen</span>'+(soon.length?soon.map(x=>'<button type="button" class="soonrow" data-open="'+x.r.id+'"><span>'+x.t+': <b>'+esc(x.r.n)+'</b></span><span class="'+urg(x.k)+'">'+whenTxt(x.k)+'</span></button>').join(""):'<span class="src">Bei deinen gemerkten Läufen steht gerade keine Frist an.</span>')+'</section>'}

// Erinnerungen in der App: bei gemerkten Läufen naht Anmeldestart, Meldeschluss (state.remind Tage vorher) oder der Lauftag (7 Tage)
function remindItems(){const days=+state.remind||0;if(!days)return[];const out=[];
  R.forEach(r=>{if(!state.favs.includes(r.id))return;const reg=state.reg.includes(r.id);
    if(!reg&&r.ro&&daysTo(r.ro)>=0&&daysTo(r.ro)<=days)out.push({r,k:daysTo(r.ro),t:"Anmeldung öffnet"});
    if(!reg&&r.rc&&daysTo(r.rc)>=0&&daysTo(r.rc)<=days)out.push({r,k:daysTo(r.rc),t:"Meldeschluss"});
    const kd=daysTo(r.d);if(r.ok&&kd>=0&&kd<=7)out.push({r,k:kd,t:reg?"Dein Lauf":"Lauftag"})});
  return out.sort((a,b)=>a.k-b.k)}
function whenTxt(k){return k===0?"heute":k===1?"morgen":"in "+k+" Tagen"}
function urg(k){return k<=1?"u3":k<=3?"u2":"u1"}
// Glocke: eine Frist gilt als gesehen, bis sie in die nächste Stufe (gelb, orange, rot) rutscht
let wigDone=false,wigOn=false;
function seenKey(x){return(state.seen||{})[x.r.id+"|"+x.t]}
function syncRemind(){document.querySelectorAll("[data-remind]").forEach(b=>b.setAttribute("aria-checked",+b.dataset.remind===+state.remind))}
// Meine Läufe: je Lauf ein Link auf die Kalenderdatei (Lauftag, Meldeschluss, Anmeldestart mit Erinnerungen)
function icsBox(list){if(!list.length)return"";
  return'<section class="soon" aria-label="Kalender"><span class="lbl">Erinnerungen im Kalender</span>'+list.map(r=>'<a class="soonrow" href="ics/'+encodeURIComponent(r.id)+'.ics"><span><b>'+esc(r.n)+'</b></span><span>Kalender</span></a>').join("")+
    '<span class="src">Tippe auf „Kalender“, dann trägt dein iPhone Lauftag und Meldeschluss mit Erinnerungen ein.</span></section>'}
function render(){
  if(!R.length)return;const anim=animNext;animNext=false;
  $("radv").textContent=state.radius;$("radius").value=state.radius;
  document.querySelectorAll("#rchips button").forEach(b=>b.setAttribute("aria-pressed",+b.dataset.k===state.radius));
  document.querySelectorAll("#dchips button").forEach(b=>b.setAttribute("aria-pressed",state.dists.includes(b.dataset.k)));
  const H=state.home;
  const ort=H?H.name.replace(/^\d{5}\s/,""):"Startpunkt wählen";$("loc-t").textContent=ort;$("loc-r").textContent=H?"· "+state.radius+" km":"";$("loc").classList.toggle("long",ort.length>16);
  if(!$("startinfo").classList.contains("err"))$("startinfo").textContent="";
  if((state.onboarded||homeShown)&&document.activeElement!==$("start"))showHome();
  R.forEach(r=>r.dist=H?Math.round(km(H.lat,H.lon,r.la,r.lo)):null);   // ohne Startpunkt: keine Entfernung, kein Umkreis
  const live=R.filter(r=>dt(r.e||r.d)>=TODAY);
  state.favs=state.favs.filter(id=>R.some(r=>r.id===id));state.reg=(state.reg||[]).filter(id=>state.favs.includes(id));
  const regs=live.filter(r=>state.reg.includes(r.id)).sort((a,b)=>a.d.localeCompare(b.d)),nx=$("next");
  if(regs.length){const r=regs[0],k=daysTo(r.d);nx.dataset.id=r.id;
    nx.innerHTML='<span class="lbl">Dein nächster Lauf</span><strong>'+esc(r.n)+'</strong><span class="big">'+(k<=0?"Heute":k+"<small>"+(k===1?"Tag":"Tage")+"</small>")+'</span><span class="sub">'+longDate(r.d)+' · '+esc(r.o)+(regs.length>1?' · +'+(regs.length-1)+' weitere':"")+'</span>';nx.hidden=false;if(anim&&k>1)countUp(nx.querySelector(".big"),k)}
  else{nx.hidden=true;nx.dataset.id=""}
  const rAll=remindItems(),rm=$("remind"),ri2=state.tab==="fav"?[]:rAll.filter(x=>x.k<=3).slice(0,6),bl=$("bell");
  if(ri2.length){rm.innerHTML=ri2.map(x=>'<button type="button" class="sc '+urg(x.k)+'" data-open="'+x.r.id+'"><b>'+whenTxt(x.k)+'</b><span>'+x.t+' · '+esc(x.r.n)+'</span></button>').join("");rm.hidden=false}
  else{rm.innerHTML="";rm.hidden=true}
  const fresh=rAll.filter(x=>seenKey(x)!==urg(x.k)).length;
  if(fresh&&!wigDone){wigDone=true;wigOn=true;setTimeout(()=>{wigOn=false;bl.classList.remove("wig")},1600)}
  bl.hidden=!rAll.length;bl.className="ibtn bell "+(rAll.length?urg(rAll[0].k):"")+(fresh&&wigOn?" wig":"");$("bell-n").textContent=fresh;$("bell-n").hidden=!fresh;
  document.querySelectorAll(".vb").forEach(b=>b.setAttribute("aria-pressed",b.dataset.v===state.view));
  const inRadius=r=>!H||r.dist<=state.radius;
  const near=live.filter(r=>inRadius(r)&&passFilters(r));
  $("n-road").textContent=near.filter(r=>r.t==="road").length;
  $("n-trail").textContent=near.filter(r=>r.t==="trail").length;
  $("n-fav").textContent=state.favs.length;
  document.querySelectorAll(".tab[role=tab]").forEach(b=>b.setAttribute("aria-selected",b.dataset.k===state.tab));
  document.querySelector(".nav .in").dataset.i=["road","trail","fav"].indexOf(state.tab);
  syncFilters();
  document.body.className="mode-"+state.tab+($("detail").hidden&&$("report").hidden&&$("backdrop").hidden?"":" locked");
  const active=["time","stat"].filter(k=>state[k]!=="all").length+(state.tab==="trail"&&state.hm!=="all"?1:0);
  $("reset").hidden=!active;
  let list,favView=state.tab==="fav";
  if(favView)list=live.filter(r=>state.favs.includes(r.id));
  else list=near.filter(r=>r.t===state.tab);
  list.sort((a,b)=>a.d.localeCompare(b.d)||(a.dist||0)-(b.dist||0));
  renderQuick(list.length,live.filter(r=>r.t===state.tab&&inRadius(r)&&passFilters(r,true)).length);
  $("tag").textContent=state.tab==="road"?"Straßenläufe":state.tab==="trail"?"Trails & Bergläufe":"Meine Läufe";
  const hc=t=>'<span class="hchip">'+t+'</span>';
  $("sub").innerHTML=favView?hc("<b>"+state.reg.length+"</b> angemeldet")+hc("<b>"+(state.favs.length-state.reg.length)+"</b> gemerkt"):
    hc("<b>"+list.length+"</b> "+(list.length===1?"Lauf":"Läufe"))+hc(H?"im Umkreis "+state.radius+" km":"ganz Bayern")+(active||state.dists.length?hc("gefiltert"):"");
  if(state.view==="cal"){$("out").innerHTML=calHTML(list,favView);if(anim)riseIn($("out"));return}
  if(!list.length){
    const nearest=H?Math.min(...live.map(r=>r.dist)):0;let msg;
    if(favView){$("out").innerHTML='<div class="empty emptyfav">'+HEART+'<strong>Noch nichts gemerkt</strong><p>Tippe bei einem Lauf auf das Herz, dann steht er hier mit Fristen und Countdown.</p><button type="button" class="cta" data-goto="road">Läufe ansehen</button></div>';return}
    else if(nearest>200)msg='<strong>Hier sind noch keine Läufe erfasst</strong>Der nächste bekannte Lauf ist '+nearest+' km von '+esc(H.name)+' entfernt. Bisher sind Läufe in Bayern erfasst.';
    else if(active||state.dists.length)msg='<strong>Keine Treffer mit diesen Filtern</strong>Lockere die Filter, wähle weitere Strecken oder vergrößere den Umkreis.';
    else if(!H)msg='<strong>Keine Läufe gefunden</strong>Schau später noch einmal vorbei.';
    else msg='<strong>Keine Läufe im Umkreis von '+state.radius+' km</strong>Tipp oben auf deinen Standort und vergrößere den Umkreis.';
    $("out").innerHTML='<div class="empty">'+msg+'</div>';return}
  let html="",cur="";
  if(favView){const regL=list.filter(r=>state.reg.includes(r.id)),favL=list.filter(r=>!state.reg.includes(r.id));
    html=soonBox(favL)+icsBox(list);
    if(regL.length)html+='<h2 class="month">Angemeldet</h2>'+regL.map(r=>card(r,true)).join("");
    if(favL.length)html+='<h2 class="month">Gemerkt</h2>'+favL.map(r=>card(r,true)).join("");
    $("out").innerHTML=html;if(anim)riseIn($("out"));return}
  for(const r of list){const d=dt(r.d),key=d.getFullYear()+"-"+d.getMonth();
    if(key!==cur){cur=key;html+='<h2 class="month">'+MON[d.getMonth()]+" "+d.getFullYear()+"</h2>"}
    html+=card(r,false)}
  $("out").innerHTML=html;if(anim)riseIn($("out"));}

$("out").addEventListener("click",e=>{
  const h=e.target.closest(".heart");if(h){toggleFav(h.dataset.id);toast(state.favs.includes(h.dataset.id)?"Gemerkt · steht unter „Meine Läufe“":"Aus „Meine Läufe“ entfernt");render();return}
  const gt=e.target.closest("[data-goto]");if(gt){state.tab=gt.dataset.goto;save();animNext=true;render();window.scrollTo({top:0,behavior:RM?"auto":"smooth"});return}
  const rq=e.target.closest("[data-regq]");if(rq){setReg(rq.dataset.regq);render();return}
  const cn=e.target.closest("[data-cal]");if(cn){shiftMonth(+cn.dataset.cal);render();return}
  const dy=e.target.closest("[data-day]");if(dy){const d=+dy.dataset.day;state.calDay=state.calDay===d?null:d;save();render();return}
  if(e.target.closest("a"))return;
  let o=e.target.closest("[data-open]");if(!o){const c=e.target.closest(".card");if(c)o=c.querySelector("[data-open]")}
  if(o)openDetail(o.dataset.open)});
$("radius").addEventListener("input",e=>{state.radius=+e.target.value;save();render()});
$("rchips").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;state.radius=+b.dataset.k;save();render()});
$("reset").addEventListener("click",()=>{SEL.forEach(k=>state[k]="all");save();render()});
$("dchips").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const k=b.dataset.k,i=state.dists.indexOf(k);
  if(i<0)state.dists.push(k);else state.dists.splice(i,1);save();animNext=true;render()});
$("wsearch").addEventListener("click",()=>{closeSheets();$("field").hidden=false;setTimeout(()=>$("q").focus(),80)});
document.querySelectorAll(".tab[role=tab]").forEach(b=>b.addEventListener("click",()=>{if(state.tab===b.dataset.k)return;state.tab=b.dataset.k;save();animNext=true;render();window.scrollTo({top:0,behavior:RM?"auto":"smooth"})}));

// Startpunkt: PLZ/Ort-Suche (offline)
function find(q){q=q.trim();if(!q)return[];
  if(/^\d+$/.test(q))return PLZ.filter(e=>e.z.startsWith(q)).slice(0,8);
  // PLZ und Ort in beliebiger Reihenfolge („94330 Aiterhofen“, „Aiterhofen, 94330“): die PLZ entscheidet, der Ortsname sortiert vor
  const zm=q.match(/\d{3,5}/);
  if(zm){const z=zm[0],n=norm(q.replace(/\d+/g," ").replace(/[,;]/g," ").replace(/\s+/g," ").trim()),c=PLZ.filter(e=>e.z.startsWith(z));
    if(!n)return c.slice(0,8);
    return c.filter(e=>e.n.startsWith(n)).concat(c.filter(e=>!e.n.startsWith(n)&&e.n.includes(n)),c.filter(e=>!e.n.includes(n))).slice(0,8)}
  q=q.replace(/^st\.?\s+/i,"Sankt ");
  const n=norm(q),a=[],b=[],seen=new Set();
  for(const e of PLZ){if(seen.has(e.p))continue;if(e.n.startsWith(n)){seen.add(e.p);a.push(e)}else if(b.length<20&&e.n.includes(n)){seen.add(e.p);b.push(e)}}
  a.sort((x,y)=>x.p.length-y.p.length);return a.concat(b).slice(0,8)}
let hits=[],sel=-1;
function showSugg(){const ul=$("sugg");
  if(!hits.length){ul.hidden=true;$("start").setAttribute("aria-expanded","false");return}
  ul.innerHTML=hits.map((e,i)=>'<li role="option" data-i="'+i+'" aria-selected="'+(i===sel)+'"><b>'+e.z+'</b><span>'+esc(e.p)+'</span></li>').join("");
  ul.hidden=false;$("start").setAttribute("aria-expanded","true")}
// Der gewählte Startpunkt steht im Eingabefeld selbst (mit Haken), nicht klein darunter
let homeShown=false;
function showHome(){if(!state.home)return;const s=$("start");s.value=state.home.name;s.parentElement.classList.add("gesetzt");homeShown=true}
function choose(e){animNext=true;state.home={name:e.z+" "+e.p,lat:e.la,lon:e.lo};hits=[];sel=-1;showSugg();$("startinfo").classList.remove("err");$("startinfo").textContent="";save();showHome();render();$("start").blur();toast("Startpunkt: "+e.p)}
$("start").addEventListener("input",e=>{e.target.parentElement.classList.remove("gesetzt");hits=find(e.target.value);sel=hits.length?0:-1;showSugg()});
$("start").addEventListener("focus",e=>{if(e.target.parentElement.classList.contains("gesetzt"))setTimeout(()=>e.target.select(),0)});
$("start").addEventListener("keydown",e=>{
  if(e.key==="ArrowDown"&&hits.length){sel=(sel+1)%hits.length;showSugg();e.preventDefault()}
  else if(e.key==="ArrowUp"&&hits.length){sel=(sel-1+hits.length)%hits.length;showSugg();e.preventDefault()}
  else if(e.key==="Enter"){e.preventDefault();if(hits[sel])choose(hits[sel]);else if($("start").value.trim()){$("startinfo").classList.add("err");$("startinfo").textContent="Kein Ort gefunden. Versuch es mit einer Postleitzahl."}}
  else if(e.key==="Escape"){hits=[];showSugg()}});
$("sugg").addEventListener("mousedown",e=>{const li=e.target.closest("li");if(li){e.preventDefault();choose(hits[+li.dataset.i])}});
$("start").addEventListener("blur",()=>setTimeout(()=>{hits=[];showSugg();if(homeShown&&!$("startinfo").classList.contains("err"))showHome()},150));
// Ortsname für „Mein Standort“: unter den 15 nächsten PLZ-Einträgen gewinnt der häufigste Name (so zählen Firmen-PLZ wie „Essanelle“ nicht)
function nearestPlace(la,lo){const c=Math.cos(la*Math.PI/180),near=[];
  for(const e of PLZ){const d=(e.la-la)**2+((e.lo-lo)*c)**2;if(near.length<15||d<near[near.length-1].d){near.push({e,d});near.sort((a,b)=>a.d-b.d);if(near.length>15)near.pop()}}
  if(!near.length)return null;const cnt={};near.forEach(x=>cnt[x.e.p]=(cnt[x.e.p]||0)+1);
  return near.find(x=>cnt[x.e.p]===Math.max(...Object.values(cnt))).e}
function geoFail(msg){$("geo").removeAttribute("aria-busy");const s=$("startinfo");s.classList.add("err");s.textContent=msg}
$("geo").addEventListener("click",()=>{const g=$("geo");
  if(!("geolocation" in navigator)){geoFail("Dein Gerät kann den Standort hier nicht teilen. Gib PLZ oder Ort ein.");return}
  g.setAttribute("aria-busy","true");$("startinfo").classList.remove("err");$("startinfo").textContent="Standort wird abgefragt …";
  const HILFE="Erlaube den Standort für diese Seite in den Einstellungen deines Browsers (zum Beispiel über das Schloss- oder Einstellungs-Symbol neben der Adresse) und tippe dann noch einmal. Oder gib PLZ oder Ort ein.";
  // Wartet so lange auf deine Antwort, wie du brauchst; nach ein paar Sekunden kommt nur ein Hinweis, abgebrochen wird nicht
  const hint=setTimeout(()=>{if(g.getAttribute("aria-busy")==="true")$("startinfo").textContent="Warte auf die Freigabe. Erscheint kein Fenster, erlaube den Standort in den Browser-Einstellungen für diese Seite."},6000);
  const stop=()=>{clearTimeout(hint)};
  // Erst schnell über das Netz; liefert das nichts, ein zweiter Versuch mit GPS (genauer, aber langsamer)
  const fragen=hoch=>{try{navigator.geolocation.getCurrentPosition(p=>{stop();g.removeAttribute("aria-busy");
      const la=p.coords.latitude,lo=p.coords.longitude,n=nearestPlace(la,lo);
      state.home={name:"Mein Standort"+(n?" (bei "+n.p+")":""),lat:la,lon:lo};$("startinfo").classList.remove("err");$("startinfo").textContent="";save();showHome();render();toast("Startpunkt: "+state.home.name)},
    err=>{if(err&&err.code!==1&&!hoch){$("startinfo").textContent="Suche mit GPS … das kann einen Moment dauern.";fragen(true);return}
      stop();geoFail(!err||err.code===1?"Der Standort ist für diese Seite nicht freigegeben. "+HILFE:
      err.code===2?"Dein Handy liefert keinen Standort. Prüfe, ob die Ortung (GPS) eingeschaltet und für deinen Browser erlaubt ist, oder gib PLZ oder Ort ein.":
      "Das Ermitteln dauert zu lange. Versuch es noch einmal, am besten im Freien, oder gib PLZ oder Ort ein.")},
    {enableHighAccuracy:!!hoch,timeout:hoch?30000:12000,maximumAge:hoch?0:600000})}
    catch(e){stop();geoFail("Standortzugriff ist hier nicht möglich. Gib PLZ oder Ort ein.")}};
  if(navigator.permissions&&navigator.permissions.query){
    navigator.permissions.query({name:"geolocation"}).then(r=>{if(r.state==="denied"){stop();geoFail("Der Standort ist für diese Seite gesperrt. "+HILFE)}else fragen(false)},()=>fragen(false))}
  else fragen(false)});

buildFilters();applyTheme();
$("out").innerHTML='<div class="empty"><strong>Läufe werden geladen …</strong>Einen Moment.</div>';
(async()=>{
  try{const res=await fetch(DATA_DIR+"races.json",{cache:"no-cache"});if(!res.ok)throw 0;const j=await res.json();META=j;prepare(j.races||[]);
    $("stand").textContent="Läufe-Stand: "+fmt(j.updated)+" · "+(j.races||[]).length+" Läufe. ";render();
    const h=decodeURIComponent((location.hash||"").slice(1));if(h&&R.some(r=>r.id===h))openDetail(h);
    if(!state.onboarded&&!h)openWelcome();else setTimeout(askReg,800)}
  catch(e){$("out").innerHTML='<div class="empty"><strong>Läufe konnten nicht geladen werden</strong>Prüf deine Verbindung und lade die Seite neu.</div>'}
  try{const res=await fetch(DATA_DIR+"plz.json");const j=await res.json();PLZ=j.map(a=>({z:a[0],p:a[1],la:a[2],lo:a[3],n:norm(a[1])}))}
  catch(e){$("start").placeholder="Ortssuche gerade nicht verfügbar"}
})();
