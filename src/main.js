/*  src/main.js   –  Vanilla JS + D3 v7  */
/*  ------------  PANTALLAS -------------
      Intro  →  Formulario  →  Dashboard
---------------------------------------- */

/// CDN de D3 (asegúrate de tenerla en index.html antes de este script)
/// <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>

///// 1.  SELECTORES y CONSTANTES
const btnStart  = document.getElementById('start-button');
const intro     = document.getElementById('intro');
const formWrap  = document.getElementById('form-container');
const form      = document.getElementById('data-form');
const dash      = document.getElementById('dashboard');

const CSV_VARIABLES = ['A9','A12','G1','G2','G19','RESPONDENT_SO','RESPONDENT_GIE'];
const LS_KEY = 'surveyAnswers';

let GEO=null, DATA=null;           // se llenan en init()

///// 2.  PERSISTENCIA
const saveAns = o   => localStorage.setItem(LS_KEY,JSON.stringify(o));
const loadAns = ()  => JSON.parse(localStorage.getItem(LS_KEY)||'null');

///// 3.  FORMULARIO DINÁMICO
function buildAgeRanges(){
  const sel=document.getElementById('age');
  sel.innerHTML='<option value="" disabled selected>Selecciona...</option>';
  for(let a=15;a<=85;a+=5)
    sel.insertAdjacentHTML('beforeend',`<option>${a}-${a+4}</option>`);
  sel.insertAdjacentHTML('beforeend','<option value="90+">90 o más</option>');
}

function fillSelects(){
  CSV_VARIABLES.forEach(v=>{
    const sel=document.getElementById(v);
    if(!sel) return;
    const vals=[...new Set(DATA.map(d=>d[v]).filter(Boolean))].sort();
    sel.innerHTML='<option value="" disabled selected>Selecciona...</option>';
    vals.forEach(val=>sel.insertAdjacentHTML('beforeend',`<option>${val}</option>`));
  });
}

function preloadForm(o){
  Object.entries(o||{}).forEach(([k,v])=>{
    const el=form.elements[k];
    if(el) el.value=v;
  });
}

///// 4.  FILTRADO y MÉTRICAS
const isOne = v => v==='Selected' || v==='Yes';

function filteredRows(f){
  return DATA.filter(r=>{
    if(f.age){
      const [a,b]=f.age.split('-');
      const n=+r.A1;                         // columna de edad
      if(b ? !(n>=+a&&n<=+b) : n<90) return false;
    }
    return Object.entries(f).every(([k,v])=>{
      if(k==='age'||!v) return true;
      return r[k]===v;
    });
  });
}

function pct(variable,f){                   // 0-1
  const rows=filteredRows(f);
  const ones=rows.filter(r=>isOne(r[variable])).length;
  return rows.length? ones/rows.length : 0;
}

function choroplethByCountry(tab,f){
  const VARS={
    mental:['C1_E','C1_F','D1_2_a','D1_2_b','D1_2_c','D1_2_d','D1_2_e'],
    apertura:['B5_A','B5_B','B5_C','B5_D'],
    violencia:['E1','F1']
  }[tab]||[];
  const map={};
  filteredRows(f).forEach(r=>{
    const ok=VARS.every(v=>isOne(r[v]))?1:0;
    (map[r.A9]??=[]).push(ok);              // A9 = país residencia (nombre textual)
  });
  Object.keys(map).forEach(k=>map[k]=d3.mean(map[k]));
  return map;                               // { "Spain":0.42, ... }
}

///// 5.  D3 – DRAW
function drawMap(target, geo, metrics){
  const w = target.clientWidth || 900;
  const h = 440;                                // un pelín más alto
  const svg = d3.select(target).html('')
                .append('svg')
                .attr('viewBox',[0,0,w,h]);

  /* --- proyección --- */
  const proj = d3.geoMercator().fitSize([w,h-40], geo);
  const path = d3.geoPath().projection(proj);

  /* --- dominio real de valores --- */
  const values = Object.values(metrics).filter(v=>v!=null);
  const min = d3.min(values), max = d3.max(values);
  const color = d3.scaleLinear()
                  .domain([min, max])           // min → green  | max → red
                  .range(['#0f0', '#f00']);

  /* --- mapa --- */
  svg.append('g')
     .selectAll('path')
     .data(geo.features)
     .join('path')
       .attr('d', path)
       .attr('fill',d=>{
          const v = metrics[d.properties.NAME];
          return v==null ? '#555' : color(v);
       })
       .attr('stroke','#000')
       .append('title')
       .text(d=>{
         const v = metrics[d.properties.NAME];
         return `${d.properties.NAME}: ${v!=null ? d3.format('.0%')(v) : 'sin datos'}`;
       });

  /* --- leyenda --- */
  const defs = svg.append('defs');
  const grad = defs.append('linearGradient')
                   .attr('id','grad')
                   .attr('x1','0%').attr('x2','100%');
  grad.append('stop').attr('offset','0%').attr('stop-color', color(min));
  grad.append('stop').attr('offset','100%').attr('stop-color', color(max));

  // barra
  svg.append('rect')
     .attr('id','map-legend')
     .attr('x', (w-260)/2)
     .attr('y', h-32)
     .attr('width',260)
     .attr('height',14)
     .attr('fill','url(#grad)');

  // etiquetas numéricas
  svg.append('g')
     .attr('id','legend-labels')
     .selectAll('text')
     .data([min,max])
     .join('text')
       .attr('x',(d,i)=> (w-260)/2 + (i?260:0))
       .attr('y', h-6)
       .attr('text-anchor', (d,i)=> i?'end':'start')
       .text(d=> d3.format('.0%')(d));
}


function drawBars(target,data){
  const w=360,h=260,m=40;
  const svg=d3.select(target).html('').append('svg').attr('viewBox',[0,0,w,h]);
  const x=d3.scaleLinear().domain([0,d3.max(data,d=>d.value)]).range([m,w-m]);
  const y=d3.scaleBand().domain(data.map(d=>d.label)).range([m,h-m]).padding(0.1);
  svg.append('g').selectAll('rect')
     .data(data).join('rect')
     .attr('x',m).attr('y',d=>y(d.label))
     .attr('height',y.bandwidth()).attr('width',d=>x(d.value)-m)
     .attr('fill','#00cfe8');
}

function drawDonut(target,val){
  const w=220,h=220,r=80,svg=d3.select(target).html('')
    .append('svg').attr('viewBox',[0,0,w,h])
    .append('g').attr('transform',`translate(${w/2},${h/2})`);
  const arc=d3.arc().innerRadius(r*0.6).outerRadius(r);
  svg.append('path').attr('d',arc({startAngle:0,endAngle:2*Math.PI*val})).attr('fill','#00cfe8');
  svg.append('path').attr('d',arc({startAngle:2*Math.PI*val,endAngle:2*Math.PI})).attr('fill','#222');
  svg.append('text').attr('dy','.35em').attr('text-anchor','middle').attr('fill','#fff')
     .text(d3.format('.0%')(val));
}

///// 6.  DASHBOARD
function renderTab(tab,f){
  const vc=document.getElementById('viz-container'); vc.innerHTML='';
  const mapDiv=document.createElement('div');mapDiv.className='map';vc.appendChild(mapDiv);
  drawMap(mapDiv,GEO,choroplethByCountry(tab,f));

  const charts=document.createElement('div');charts.className='charts';vc.appendChild(charts);

  if(tab==='mental')
    drawBars(charts.appendChild(document.createElement('div')),
             ['C1_E','C1_F','D1_2_a','D1_2_b','D1_2_c','D1_2_d','D1_2_e']
               .map(v=>({label:v,value:pct(v,f)})));

  if(tab==='apertura')
    drawDonut(charts.appendChild(document.createElement('div')), pct('H2',f));

  if(tab==='violencia')
    ['E1','E3','F1'].forEach(v=>drawDonut(charts.appendChild(document.createElement('div')),pct(v,f)));

  if(tab==='discriminacion')
    drawBars(charts.appendChild(document.createElement('div')),
      ['B5_A','B5_B','B5_C','B5_D'].map(v=>({label:v,value:pct(v,f)})));
}

function showDashboard(filters){
  dash.innerHTML='';
  const tabs=document.createElement('div');tabs.id='tabs';
  [['mental','Salud mental'],['apertura','Apertura'],['violencia','Violencia'],['discriminacion','Discriminación']]
    .forEach(([id,txt])=>{
      const b=document.createElement('button');b.textContent=txt;b.dataset.tab=id;
      tabs.appendChild(b);
    });
  const backBtn=document.createElement('button');
  backBtn.id='back-btn'; backBtn.textContent='Volver al cuestionario';

  dash.append(tabs,Object.assign(document.createElement('div'),{id:'viz-container'}),backBtn);

  tabs.onclick=e=>{
    if(e.target.tagName!=='BUTTON')return;
    tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===e.target));
    renderTab(e.target.dataset.tab,filters);
  };
  tabs.firstChild.classList.add('active');
  renderTab('mental',filters);

  backBtn.onclick=()=>{
    dash.classList.add('hidden');
    formWrap.classList.remove('hidden');     // ► solo mostramos formulario
  };
}

///// 7.  INICIO
(async function init(){
  [GEO,DATA] = await Promise.all([
    d3.json('/data/europe.geojson'),
    d3.csv('/data/selected_variables.csv',d3.autoType)
  ]);
  buildAgeRanges();
  fillSelects();
  const stored=loadAns(); if(stored) preloadForm(stored);
})();

///// 8.  EVENTOS
btnStart.onclick = ()=>{
  intro.classList.add('hidden');
  formWrap.classList.remove('hidden');
};

form.addEventListener('submit',e=>{
  e.preventDefault();
  if([...form.elements].some(el=>el.tagName==='SELECT' && !el.value))
    return alert('Completa todas las preguntas');

  const ans=Object.fromEntries(new FormData(form));
  saveAns(ans);

  formWrap.classList.add('hidden');
  dash.classList.remove('hidden');
  showDashboard(ans);
});
