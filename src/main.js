/*  src/main.js   –  Vanilla JS + D3 v7
/*  ------------  PANTALLAS -------------
      Intro  →  Formulario  →  Dashboard
---------------------------------------- */

///// 1.  SELECTORES y CONSTANTES
const btnStart  = document.getElementById('start-button');
const intro     = document.getElementById('intro');
const formWrap  = document.getElementById('form-container');
const form      = document.getElementById('data-form');
const dash      = document.getElementById('dashboard');

const CSV_VARIABLES = [               // ❶  A12 se elimina de la lista
  'A9',              // País de residencia
  'G1', 'G19',        // Educación y situación económica
  'RESPONDENT_SO',   // Orientación sexual
  'RESPONDENT_GIE'   // Identidad de género
];
const LS_KEY = 'surveyAnswers';

let GEO = null,            // GeoJSON de Europa
    DATA = null;           // CSV con las respuestas
let NAME_TO_ISO3 = null;   // { Spain:'ESP', … }
let ISO3_TO_NAME = null;   // { ESP:'Spain', … }

/* estado UI */
let SELECTED_COUNTRY = null; // país activo
let CURRENT_TAB = 'mental';
let CURRENT_FILTERS = null;

///// 2.  PERSISTENCIA
const saveAns = o   => localStorage.setItem(LS_KEY, JSON.stringify(o));
const loadAns = ()  => JSON.parse(localStorage.getItem(LS_KEY) || 'null');

///// 3.  FORMULARIO DINÁMICO (sin A12)
function buildAgeRanges () {
  const sel = document.getElementById('age');
  sel.innerHTML = '<option value="" disabled selected>Selecciona...</option>';
  for (let a = 15; a <= 85; a += 5) {
    sel.insertAdjacentHTML('beforeend', `<option value="${a}-${a+4}">${a}-${a+4}</option>`);
  }
  sel.insertAdjacentHTML('beforeend', '<option value="90+">90 o más</option>');
}

function fillSelects () {
  CSV_VARIABLES.forEach(v => {
    const sel = document.getElementById(v);
    if (!sel) return;

    const vals = [...new Set(DATA.map(d => d[v]).filter(Boolean))].sort();
    sel.innerHTML = '<option value="" disabled selected>Selecciona...</option>';
    vals.forEach(val => sel.insertAdjacentHTML('beforeend', `<option value="${val}">${val}</option>`));
  });
}

function preloadForm (o) {
  Object.entries(o || {}).forEach(([k, v]) => {
    const el = form.elements[k];
    if (el) el.value = v;
  });
}

///// 4.  FILTRADO y MÉTRICAS
const isOne = v => {
  if (v == null || v === '') return false;
  if (v === 'Selected' || v === 'Yes') return true;
  const neg = ['Never','At no time','Not applicable','Prefer not to say','Don\u2019t know'];
  return !neg.includes(v);
};

function filteredRows (f) {
  return DATA.filter(r => {

    // edad
    if (f.age) {
      if (f.age === '90+') {
        if (+r.A1 < 90) return false;
      } else {
        const [a, b] = f.age.split('-');
        const n = +r.A1;
        if (!(n >= +a && n <= +b)) return false;
      }
    }

    // resto de selects
    return Object.entries(f).every(([k, v]) => {
      if (k === 'age' || !v) return true;
      return r[k] === v;
    });
  });
}

function pct (variable, f) {
  const rows = filteredRows(f);
  const ones = rows.filter(r => isOne(r[variable])).length;
  return rows.length ? ones / rows.length : 0;
}

function choroplethByCountry (tabOrVar, f) {
  const VARS = {
    apertura:  ['B5_A','B5_B','B5_C','B5_D'],
    violencia: ['E1','F1_A','F1_B','F1_C']
  }[tabOrVar];

  const map = {};                // { ISO3:[scores] }

  const rows = tabOrVar === 'H1' ? DATA : filteredRows(f);

  rows.forEach(r => {
    const cc = NAME_TO_ISO3[r.A9];
    if (!cc) return;

    if (tabOrVar === 'H1') {
      if (r.H1 != null && r.H1 !== '') (map[cc] ??= []).push(+r.H1);
    } else {
      const score = d3.mean(VARS, v => +isOne(r[v]));
      (map[cc] ??= []).push(score);
    }
  });

  Object.keys(map).forEach(k => (map[k] = d3.mean(map[k])));
  return map;
}

///// 5.  D3 – DRAWERS (sin cambios)
function drawMap (target, geo, metrics) {
  const w = target.clientWidth || 900;
  const h = 440;

  const svg = d3.select(target).html('')
                .append('svg')
                .attr('viewBox', [0, 0, w, h]);

  const proj  = d3.geoMercator().fitSize([w, h - 40], geo);
  const path  = d3.geoPath().projection(proj);

  const vals = Object.values(metrics).filter(v => v != null);
  const min = d3.min(vals), max = d3.max(vals);
  const color = d3.scaleLinear()
                 .domain([min, max])
                 .range(['red', 'green']);

  svg.append('g')
     .selectAll('path')
     .data(geo.features)
     .join('path')
       .attr('d', path)
       .attr('fill', d => {
         const v = metrics[d.properties.ISO3];
         if (d.properties.ISO3 === SELECTED_COUNTRY) return '#00cfe8';
         return v == null ? '#555' : color(v);
       })
       .attr('stroke', d => SELECTED_COUNTRY === d.properties.ISO3 ? '#fff' : '#000')
       .attr('stroke-width', d => SELECTED_COUNTRY === d.properties.ISO3 ? 2 : 0.5)
       .attr('cursor', 'pointer')
       .on('click', (e, d) => {
         const cc = d.properties.ISO3;
         SELECTED_COUNTRY = SELECTED_COUNTRY === cc ? null : cc;
         renderTab(CURRENT_TAB, CURRENT_FILTERS);
       })
       .append('title')
         .text(d => {
           const v = metrics[d.properties.ISO3];
           return `${d.properties.NAME}: ${v != null ? d3.format('.1f')(v) : 'sin datos'}`;
         });

  // leyenda (igual que antes) …
  const defs = svg.append('defs');
  const grad = defs.append('linearGradient')
                   .attr('id', 'grad')
                   .attr('x1', '0%').attr('x2', '100%');
  grad.append('stop').attr('offset', '0%').attr('stop-color', color(min));
  grad.append('stop').attr('offset', '100%').attr('stop-color', color(max));

  svg.append('rect')
     .attr('id', 'map-legend')
     .attr('x', (w - 260) / 2)
     .attr('y', h - 32)
     .attr('width', 260)
     .attr('height', 14)
     .attr('fill', 'url(#grad)');

  svg.append('g')
     .attr('id', 'legend-labels')
     .selectAll('text')
     .data([min, max])
     .join('text')
       .attr('x', (d, i) => (w - 260) / 2 + (i ? 260 : 0))
       .attr('y', h - 6)
       .attr('text-anchor', (d, i) => i ? 'end' : 'start')
       .text(d => d3.format('.0f')(d));
}

function drawBars (target, data) {
  const w = 360, h = 260, m = 40;
  const svg = d3.select(target).html('').append('svg')
                .attr('viewBox', [0, 0, w, h]);

  const x = d3.scaleLinear([0, d3.max(data, d => d.value)], [m, w - m]);
  const y = d3.scaleBand(data.map(d => d.label), [m, h - m]).padding(0.1);

  svg.append('g')
     .selectAll('rect')
     .data(data)
     .join('rect')
       .attr('x', m)
       .attr('y', d => y(d.label))
       .attr('height', y.bandwidth())
       .attr('width', d => x(d.value) - m)
       .attr('fill', '#00cfe8');
}

function drawDonut (target, val) {
  const w = 220, h = 220, r = 80;
  const svg = d3.select(target).html('')
                .append('svg').attr('viewBox', [0, 0, w, h])
                .append('g')
                  .attr('transform', `translate(${w/2},${h/2})`);

  const arc = d3.arc().innerRadius(r * 0.6).outerRadius(r);

  svg.append('path')
     .attr('d', arc({ startAngle: 0, endAngle: 2 * Math.PI * val }))
     .attr('fill', '#00cfe8');

  svg.append('path')
     .attr('d', arc({ startAngle: 2 * Math.PI * val, endAngle: 2 * Math.PI }))
     .attr('fill', '#222');

  svg.append('text')
     .attr('dy', '.35em')
     .attr('text-anchor', 'middle')
     .attr('fill', '#fff')
     .text(d3.format('.0%')(val));
}

///// 6.  DASHBOARD (sin cambios lógicos)
function renderTab (tab, f) {
  CURRENT_TAB = tab;
  CURRENT_FILTERS = f;

  const chartFilters = SELECTED_COUNTRY
        ? { ...f, A9: ISO3_TO_NAME[SELECTED_COUNTRY] }
        : f;

  const vc = document.getElementById('viz-container');
  vc.innerHTML = '';

  const mapDiv = document.createElement('div');
  mapDiv.className = 'map';
  vc.appendChild(mapDiv);
  if (tab === 'mental') {
    drawMap(mapDiv, GEO, choroplethByCountry('H1', {}));
  } else {
    drawMap(mapDiv, GEO, choroplethByCountry(tab, f)); // mapa = métricas globales
  }

  const charts = document.createElement('div');
  charts.className = 'charts';
  vc.appendChild(charts);

  if (tab === 'mental') {
    drawDonut(charts.appendChild(document.createElement('div')), pct('H2', chartFilters));
    drawDonut(charts.appendChild(document.createElement('div')), pct('H3', chartFilters));
  }

  if (tab === 'apertura') {
    drawDonut(charts.appendChild(document.createElement('div')), pct('H2', chartFilters));
  }

  if (tab === 'violencia') {
    ['E1','E3','F1_A','F1_B','F1_C'].forEach(v =>
      drawDonut(charts.appendChild(document.createElement('div')), pct(v, chartFilters))
    );
  }

  if (tab === 'discriminacion') {
    drawBars(charts.appendChild(document.createElement('div')),
      ['B5_A','B5_B','B5_C','B5_D']
        .map(v => ({ label: v, value: pct(v, chartFilters) }))
    );
  }
}

function showDashboard (filters) {
  dash.innerHTML = '';

  const tabs = document.createElement('div');
  tabs.id = 'tabs';
  [
    ['mental','Salud mental'],
    ['apertura','Apertura'],
    ['violencia','Violencia'],
    ['discriminacion','Discriminación']
  ].forEach(([id, txt]) => {
    const b = document.createElement('button');
    b.textContent = txt;
    b.dataset.tab = id;
    tabs.appendChild(b);
  });

  const backBtn = document.createElement('button');
  backBtn.id = 'back-btn';
  backBtn.textContent = 'Volver al cuestionario';

  dash.append(
    tabs,
    Object.assign(document.createElement('div'), { id: 'viz-container' }),
    backBtn
  );

  tabs.onclick = e => {
    if (e.target.tagName !== 'BUTTON') return;
    tabs.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === e.target));
    renderTab(e.target.dataset.tab, filters);
  };

  tabs.firstChild.classList.add('active');
  renderTab('mental', filters);

  backBtn.onclick = () => {
    dash.classList.add('hidden');
    formWrap.classList.remove('hidden');
    form.elements.age.focus();
  };
}

///// 7.  INICIO
(async function init () {
  try {
    [GEO, DATA] = await Promise.all([
      d3.json('/data/europe.geojson'),
      d3.csv('/data/selected_variables.csv', d3.autoType)
    ]);
  } catch (err) {
    console.error(err);
    intro.innerHTML = '<p>No se pudieron cargar los datos.</p>';
    return;
  }

  NAME_TO_ISO3 = Object.fromEntries(GEO.features.map(f => [f.properties.NAME, f.properties.ISO3]));
  ISO3_TO_NAME = Object.fromEntries(GEO.features.map(f => [f.properties.ISO3, f.properties.NAME]));

  buildAgeRanges();
  fillSelects();

  const stored = loadAns();
  if (stored) preloadForm(stored);
})();

///// 8.  EVENTOS
respectReducedMotion();

btnStart.onclick = () => {
  intro.classList.add('hidden');
  formWrap.classList.remove('hidden');
  form.elements.age.focus();
};

form.addEventListener('submit', e => {
  e.preventDefault();

  if ([...form.elements].some(el => el.tagName === 'SELECT' && !el.value)) {
    alert('Completa todas las preguntas');
    return;
  }

  const ans = Object.fromEntries(new FormData(form));
  saveAns(ans);

  formWrap.classList.add('hidden');
  dash.classList.remove('hidden');
  showDashboard(ans);
});

/* util: respeta prefers-reduced-motion */
function respectReducedMotion () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('no-motion');
  }
}
