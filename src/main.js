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
  'G1',              // Nivel educativo
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

const H2_VALUES = [
  'At no time',
  'Some of the time',
  'Less than half of the time',
  'More than half of the time',
  'Most of the time',
  'All the time',
  'Prefer not to say'
];

const H3_VALUES = [
  'Never',
  'Rarely',
  'Often',
  'Always',
  'Prefer not to say',
  'Don\u2019t know'
];

const H2_ORDER = [
  'All the time',
  'Most of the time',
  'More than half of the time',
  'Less than half of the time',
  'Some of the time',
  'At no time'
];

const H3_ORDER = [
  'Always',
  'Often',
  'Rarely',
  'Never'
];

const SPECIAL_COLORS = {
  'Prefer not to say': '#800080', // morado
  'Don\u2019t know': '#8B4513'      // marrón
};

const H2_ES = {
  'At no time': 'En ning\u00fan momento',
  'Some of the time': 'Algunas veces',
  'Less than half of the time': 'Menos de la mitad del tiempo',
  'More than half of the time': 'M\u00e1s de la mitad del tiempo',
  'Most of the time': 'La mayor\u00eda del tiempo',
  'All the time': 'Todo el tiempo',
  'Prefer not to say': 'Prefiero no responder'
};

const H3_ES = {
  'Never': 'Nunca',
  'Rarely': 'Rara vez',
  'Often': 'A menudo',
  'Always': 'Siempre',
  'Prefer not to say': 'Prefiero no responder',
  'Don\u2019t know': 'No lo s\u00e9'
};
const B5_ES = {
  "B5_A": "Casa",
  "B5_B": "Familia",
  "B5_C": "Escuela",
  "B5_D": "Trabajo"
};

const E1_VALUES = [
  'All of the time',
  'More than 10 times',
  '6-10',
  '3-5',
  'Twice',
  'Once',
  'Never',
  'Don\u2019t know',
  'Prefer not to say'
];

const E1_ORDER = [
  'All of the time',
  'More than 10 times',
  '6-10',
  '3-5',
  'Twice',
  'Once',
  'Never'
];

const E1_ES = {
  'All of the time': 'Todo el tiempo',
  'More than 10 times': 'M\u00e1s de 10 veces',
  '6-10': '6-10 veces',
  '3-5': '3-5 veces',
  'Twice': 'Dos veces',
  'Once': 'Una vez',
  'Never': 'Nunca',
  'Don\u2019t know': 'No lo s\u00e9',
  'Prefer not to say': 'Prefiero no responder'
};

const E3_VALUES = [
  'Physical attack',
  'Sexual attack',
  'Physical and sexual attack',
  'Not applicable',
  'Don\u2019t know',
  'Prefer not to say'
];

const E3_ORDER = [
  'Physical and sexual attack',
  'Physical attack',
  'Sexual attack',
  'Not applicable'
];

const E3_VALUES_NO_NA = E3_VALUES.filter(v => v !== 'Not applicable');
const E3_ORDER_NO_NA = E3_ORDER.filter(v => v !== 'Not applicable');

const E3_COLORS = {
  'Physical attack': '#ffa500',             // naranja
  'Sexual attack': '#ff8c00',               // naranja oscuro
  'Physical and sexual attack': '#ff0000'   // rojo intenso
};

const E3_ES = {
  'Physical attack': 'Ataque f\u00edsico',
  'Sexual attack': 'Ataque sexual',
  'Physical and sexual attack': 'Ataque f\u00edsico y sexual',
  'Not applicable': 'No aplicable',
  'Don\u2019t know': 'No lo s\u00e9',
  'Prefer not to say': 'Prefiero no responder'
};

const F1_VALUES = [
  'All the time',
  'More than ten times',
  '6-10 times',
  '3-5 times',
  'Twice',
  'Once',
  'Never',
  'Don\u2019t know',
  'Prefer not to say'
];

const F1_ORDER = [
  'All the time',
  'More than ten times',
  '6-10 times',
  '3-5 times',
  'Twice',
  'Once',
  'Never'
];

const F1_ES = {
  'All the time': 'Todo el tiempo',
  'More than ten times': 'M\u00e1s de diez veces',
  '6-10 times': '6-10 veces',
  '3-5 times': '3-5 veces',
  'Twice': 'Dos veces',
  'Once': 'Una vez',
  'Never': 'Nunca',
  'Don\u2019t know': 'No lo s\u00e9',
  'Prefer not to say': 'Prefiero no responder'
};

const F1_VAR_ES = {
  'F1_A': 'Comentarios ofensivos',
  'F1_B': 'Amenazas de violencia',
  'F1_C': 'Gestos intimidantes'
};

const DISCRIM_VARS = [
  'D1_2_a','D1_2_b','D1_2_c','D1_2_d','D1_2_e'
];

const DISCRIM_ES = {
  'D1_2_a': 'Buscando trabajo',
  'D1_2_b': 'En el trabajo',
  'D1_2_c': 'Buscando vivienda',
  'D1_2_d': 'En centros de salud/servicios',
  'D1_2_e': 'En centros educativos'
};


///// 2.  PERSISTENCIA
const saveAns = o   => localStorage.setItem(LS_KEY, JSON.stringify(o));
const loadAns = ()  => JSON.parse(localStorage.getItem(LS_KEY) || 'null');

///// 3.  FORMULARIO DINÁMICO (sin A12)
function buildAgeRanges () {
  const sel = document.getElementById('age');
  sel.innerHTML = '<option value="" disabled selected>Selecciona...</option>';
  for (let a = 15; a <= 75; a += 10) {
    sel.insertAdjacentHTML(
      'beforeend',
      `<option value="${a}-${a + 9}">${a}-${a + 9}</option>`
    );
  }
  sel.insertAdjacentHTML('beforeend', '<option value="85+">85 o más</option>');
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
  if (v === 'Not Selected' || v === 'No') return false;
  const neg = [
    'Never',
    'At no time',
    'Not applicable',
    "Haven\u2019t done this",
    'Prefer not to say',
    "Don\u2019t know"
  ];
  return !neg.includes(v);
};

function filteredRows (f) {
  return DATA.filter(r => {

    // edad
    if (f.age) {
      if (f.age === '85+') {
        if (+r.A1 < 85) return false;
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

function pctInfo(variable, f) {
  const rows = filteredRows(f);
  const ones = rows.filter(r => isOne(r[variable])).length;
  return {
    pct: rows.length ? ones / rows.length : 0,
    count: ones,
    total: rows.length
  };
}

function distribution (variable, f, categories) {
  const rows = filteredRows(f);
  const counts = new Map();
  rows.forEach(r => {
    const val = r[variable];
    if (val == null || val === '') return;
    counts.set(val, (counts.get(val) || 0) + 1);
  });
  return categories.map(c => ({ label: c, value: counts.get(c) || 0 }));
}

function omit (obj, key) {
  const o = { ...obj };
  delete o[key];
  return o;
}

function choroplethByCountry (tabOrVar, f) {
  const VARS = {
    apertura:  ['B5_A','B5_B','B5_C','B5_D'],
    violencia: ['E1','F1_A','F1_B','F1_C'],
    discriminacion: DISCRIM_VARS
  }[tabOrVar];

  const map = {};                // { ISO3:[scores] }

  const rows = filteredRows(tabOrVar === 'H1' ? omit(f, 'A9') : f);

  rows.forEach(r => {
    const cc = NAME_TO_ISO3[r.A9];
    if (!cc) return;

    if (tabOrVar === 'H1') {
      const val = +r.H1;
      if (!Number.isNaN(val)) (map[cc] ??= []).push(val);
    } else if (tabOrVar === 'apertura') {
      const b5 = VARS.some(v => isOne(r[v])) ? 1 : 0;
      (map[cc] ??= []).push(b5);
    } else if (tabOrVar === 'violencia') {
      const experienced = VARS.some(v => r[v] && r[v] !== 'Never') ? 1 : 0;
      (map[cc] ??= []).push(experienced);
    } else if (tabOrVar === 'discriminacion') {
      const any = VARS.some(v => isOne(r[v])) ? 1 : 0;
      (map[cc] ??= []).push(any);
    } else {
      const score = d3.mean(VARS, v => +isOne(r[v])) * 100;
      (map[cc] ??= []).push(score);
    }
  });

  Object.keys(map).forEach(k => {
    const mean = d3.mean(map[k]);
    map[k] = (tabOrVar === 'apertura' || tabOrVar === 'violencia' || tabOrVar === 'discriminacion')
      ? mean * 100
      : mean;
  });
  return map;
}

///// 5.  D3 – DRAWERS (sin cambios)
function drawMap (target, geo, metrics, colors = ['red', 'green'], domain = null, tooltipSuffix = '') {
  const w = target.clientWidth || 900;
  const h = target.clientHeight || 660;

  const svg = d3.select(target).html('')
                .append('svg')
                .attr('viewBox', [0, 0, w, h])
                .attr('width', '100%')
                .attr('height', '100%');

  const proj  = d3.geoMercator().fitSize([w, h - 40], geo);
  const path  = d3.geoPath().projection(proj);

  const vals = Object.values(metrics).filter(v => Number.isFinite(v));
  const min = domain ? domain[0] : (vals.length ? d3.min(vals) : 0);
  const max = domain ? domain[1] : (vals.length ? d3.max(vals) : 10);
  const color = d3.scaleLinear()
                 .domain([min, max])
                 .range(colors);

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
          if (v == null) return `${d.properties.NAME}: sin datos`;
          return `${d.properties.NAME}: ${d3.format('.1f')(v)}${tooltipSuffix}`;
        });

  // leyenda (igual que antes) …
  const defs = svg.append('defs');
  const grad = defs.append('linearGradient')
                   .attr('id', 'grad')
                   .attr('x1', '0%').attr('x2', '100%');
  grad.append('stop').attr('offset', '0%').attr('stop-color', color(min));
  grad.append('stop').attr('offset', '100%').attr('stop-color', color(max));

  const legendW = w * 0.5;

  svg.append('rect')
     .attr('id', 'map-legend')
     .attr('x', (w - legendW) / 2)
     .attr('y', h - 32)
     .attr('width', legendW)
     .attr('height', 14)
     .attr('fill', 'url(#grad)');

  svg.append('g')
     .attr('id', 'legend-labels')
     .selectAll('text')
     .data([min, max])
     .join('text')
       .attr('x', (d, i) => (w - legendW) / 2 + (i ? legendW : 0))
       .attr('y', h - 6)
       .attr('text-anchor', (d, i) => i ? 'end' : 'start')
       .text(d => d3.format('.0f')(d));
}

function drawBars (target, data, title) {
  const w = 480, h = 320, m = { top: 20, right: 40, bottom: 20, left: 120 };

  const div = d3.select(target).html('');
  if (title) div.append('h4').text(title);

  const svg = div.append('svg')
                .attr('viewBox', [0, 0, w, h])
                .attr('width', '100%')
                .attr('height', '100%');

  const x = d3.scaleLinear([0, d3.max(data, d => d.value)], [m.left, w - m.right]);
  const y = d3.scaleBand(data.map(d => d.label), [m.top, h - m.bottom]).padding(0.1);

  const bars = svg.append('g')
                 .selectAll('rect')
                 .data(data)
                 .join('rect')
                   .attr('x', m.left)
                   .attr('y', d => y(d.label))
                   .attr('height', y.bandwidth())
                   .attr('width', 0)
                   .attr('fill', '#00cfe8');

  bars.append('title')
      .text(d => `${d.count} de ${d.total}`);

  const finalWidth = d => x(d.value) - m.left;
  if (!document.documentElement.classList.contains('no-motion')) {
    bars.transition()
        .duration(750)
        .attr('width', finalWidth);
  } else {
    bars.attr('width', finalWidth);
  }

  const lbls = svg.append('g')
                  .selectAll('text.bar-label')
                  .data(data)
                  .join('text')
                    .attr('class', 'bar-label')
                    .attr('x', m.left + 4)
                    .attr('y', d => y(d.label) + y.bandwidth() / 2)
                    .attr('dy', '.35em')
                    .text(d => d3.format('.0%')(d.value));

  const labelX = d => x(d.value) + 4;
  if (!document.documentElement.classList.contains('no-motion')) {
    lbls.transition()
        .duration(750)
        .attr('x', labelX);
  } else {
    lbls.attr('x', labelX);
  }

  svg.append('g')
     .selectAll('text.bar-name')
     .data(data)
     .join('text')
       .attr('class', 'bar-name')
       .attr('x', m.left - 6)
       .attr('y', d => y(d.label) + y.bandwidth() / 2)
       .attr('dy', '.35em')
       .attr('text-anchor', 'end')
       .text(d => d.label);
}

function drawDonut (target, val, title) {
  const w = 400, h = 400, r = 160;
  const div = d3.select(target).html('');
  if (title) div.append('h4').text(title);

  const svg = div.append('svg').attr('viewBox', [0, 0, w, h])
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

function colorFor(label, order, extraColors = null) {
  if (extraColors && extraColors[label]) return extraColors[label];
  if (SPECIAL_COLORS[label]) return SPECIAL_COLORS[label];
  const i = order.indexOf(label);
  const t = i < 0 ? 0 : i / (order.length - 1);
  return d3.interpolateRdYlGn(t);
}

function drawDonutDist (target, data, title, order, labels = {}, colorMap = null) {
  const w = 360, h = 360, r = 140;
  const div = d3.select(target).html('');
  if (title) div.append('h4').text(title);

  const svg = div.append('svg')
                .attr('viewBox', [0, 0, w, h])
                .attr('width', '100%')
                .attr('height', '100%')
                .append('g')
                .attr('transform', `translate(${w/2},${h/2})`);

  const color = label => colorFor(label, order, colorMap);
  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc().innerRadius(r * 0.6).outerRadius(r);

  const arcs = svg.selectAll('path')
                  .data(pie(data))
                  .join('path')
                    .attr('fill', d => color(d.data.label))
                    .attr('d', arc({ startAngle: 0, endAngle: 0 }));

  arcs.append('title')
      .text(d => `${labels[d.data.label] || d.data.label}: ${d.data.value}`);

  arcs.transition()
      .duration(1000)
      .attrTween('d', function(d){
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return t => arc(i(t));
      });

  const total = d3.sum(data, d => d.value);
  svg.selectAll('text')
     .data(pie(data))
     .join('text')
       .attr('class', 'donut-label')
       .attr('transform', d => `translate(${arc.centroid(d)})`)
       .attr('text-anchor', 'middle')
       .attr('dy', '.35em')
       .text(d => d.data.value ? d3.format('.0%')(d.data.value / total) : '');

  const legend = div.append('ul').attr('class', 'donut-legend');
  legend.selectAll('li')
        .data(data)
        .join('li')
          .html(d => `<span style="background:${color(d.label)}"></span>${labels[d.label] || d.label}`);
}

function drawStackedBars(target, vars, f, categories, order, catLabels = {}, varLabels = {}, title = '') {
  const w = 480, h = 300, m = { top: 20, right: 40, bottom: 20, left: 160 };

  const div = d3.select(target).html('');
  if (title) div.append('h4').text(title);

  const rows = vars.map(v => {
    const dist = distribution(v, f, categories);
    const total = d3.sum(dist, d => d.value);
    const obj = { var: v };
    categories.forEach(c => {
      const found = dist.find(d => d.label === c);
      obj[c] = total ? (found ? found.value / total : 0) : 0;
    });
    return obj;
  });

  const stack = d3.stack().keys(order)(rows);
  const x = d3.scaleLinear([0, 1], [m.left, w - m.right]);
  const y = d3.scaleBand(vars, [m.top, h - m.bottom]).padding(0.1);
  const color = c => colorFor(c, order);

  const svg = div.append('svg')
                .attr('viewBox', [0, 0, w, h])
                .attr('width', '100%')
                .attr('height', '100%');

  const groups = svg.append('g')
                    .selectAll('g')
                    .data(stack)
                    .join('g')
                      .attr('fill', d => color(d.key));

  const rects = groups.selectAll('rect')
                      .data(d => d.map(p => Object.assign({}, p, { key: d.key })))
                      .join('rect')
                        .attr('x', x(0))
                        .attr('y', d => y(d.data.var))
                        .attr('height', y.bandwidth())
                        .attr('width', 0);

  rects.append('title')
       .text(d => `${varLabels[d.data.var] || d.data.var}: ${catLabels[d.key] || d.key} ${d3.format('.0%')(d[1] - d[0])}`);

  const rectX = d => x(d[0]);
  const rectW = d => x(d[1]) - x(d[0]);
  if (!document.documentElement.classList.contains('no-motion')) {
    rects.transition()
         .duration(750)
         .attr('x', rectX)
         .attr('width', rectW);
  } else {
    rects.attr('x', rectX).attr('width', rectW);
  }

  svg.append('g')
     .selectAll('text')
     .data(vars)
     .join('text')
       .attr('class', 'bar-name')
       .attr('x', m.left - 6)
       .attr('y', v => y(v) + y.bandwidth() / 2)
       .attr('dy', '.35em')
       .attr('text-anchor', 'end')
       .text(v => varLabels[v] || v);

  const legendCats = order.concat(categories.filter(c => !order.includes(c)));
  const legend = div.append('ul').attr('class', 'donut-legend');
  legend.selectAll('li')
        .data(legendCats)
        .join('li')
          .html(d => `<span style="background:${color(d)}"></span>${catLabels[d] || d}`);
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
    drawMap(mapDiv, GEO, choroplethByCountry('H1', omit(f, 'A9')), ['red','green'], [0,10]);
    mapDiv.insertAdjacentHTML('afterbegin', '<h3>Felicidad general del colectivo</h3>');
  } else {
    const special = tab === 'apertura' || tab === 'violencia' || tab === 'discriminacion';
    const colors = special ? ['green','red'] : ['red','green'];
    const filters = special ? omit(f, 'A9') : f;
    const domain = special ? [0,100] : null;
    const suffix = tab === 'apertura'
      ? ' % de ocultación'
      : tab === 'violencia'
        ? '% que ha recibido violencia'
        : tab === 'discriminacion'
          ? '% que ha sufrido discriminación'
          : '';
    drawMap(mapDiv, GEO, choroplethByCountry(tab, filters), colors, domain, suffix);
    if (tab === 'apertura') {
      mapDiv.insertAdjacentHTML('afterbegin', '<h3>Nivel de apertura/ocultación por países</h3>');
    } else if (tab === 'violencia') {
      mapDiv.insertAdjacentHTML('afterbegin', '<h3>Violencia sobre el colectivo</h3>');
    } else if (tab === 'discriminacion') {
      mapDiv.insertAdjacentHTML('afterbegin', '<h3>Discriminación sobre el colectivo</h3>');
    }
  }

  const charts = document.createElement('div');
  charts.className = 'charts';
  vc.appendChild(charts);

  if (tab === 'mental') {
    const donuts = document.createElement('div');
    donuts.className = 'donuts';
    charts.appendChild(donuts);
    drawDonutDist(
      donuts.appendChild(document.createElement('div')),
      distribution('H2', chartFilters, H2_VALUES),
      'Depresión en las últimas dos semanas',
      H2_ORDER,
      H2_ES
    );
    drawDonutDist(
      donuts.appendChild(document.createElement('div')),
      distribution('H3', chartFilters, H3_VALUES),
      'Intentos de suicidio en el último año',
      H3_ORDER,
      H3_ES
    );
  }

  if (tab === 'apertura') {
    const barData = ['B5_A','B5_B','B5_C','B5_D']
      .map(v => {
        const info = pctInfo(v, chartFilters);
        return {
          label: B5_ES[v],
          value: info.pct,
          count: info.count,
          total: info.total
        };
      });
    drawBars(
      charts.appendChild(Object.assign(document.createElement('div'), { className: 'bar-chart' })),
      barData,
      'Porcentaje de ocultación del colectivo en…'
    );
  }

  if (tab === 'violencia') {
    const vbox = document.createElement('div');
    vbox.className = 'violence-charts';
    charts.appendChild(vbox);

    drawDonutDist(
      vbox.appendChild(document.createElement('div')),
      distribution('E1', chartFilters, E1_VALUES),
      'Número de ataques en los últimos 5 años',
      E1_ORDER,
      E1_ES
    );
    drawDonutDist(
      vbox.appendChild(document.createElement('div')),
      distribution('E3', chartFilters, E3_VALUES_NO_NA),
      'Tipo de ataque recibido',
      E3_ORDER_NO_NA,
      E3_ES,
      E3_COLORS
    );
    const barsDiv = vbox.appendChild(document.createElement('div'));
    drawStackedBars(
      barsDiv,
      ['F1_A','F1_B','F1_C'],
      chartFilters,
      F1_VALUES,
      F1_ORDER,
      F1_ES,
      F1_VAR_ES,
      'Intimidación'
    );
  }

  if (tab === 'discriminacion') {
    const barData = DISCRIM_VARS.map(v => {
      const info = pctInfo(v, chartFilters);
      return {
        label: DISCRIM_ES[v] || v,
        value: info.pct,
        count: info.count,
        total: info.total
      };
    });
    drawBars(
      charts.appendChild(Object.assign(document.createElement('div'), { className: 'bar-chart' })),
      barData,
      'Ámbitos de discriminación'
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

  const backBtn = document.getElementById('back-btn');
  backBtn.style.display = 'block';

  dash.append(
    tabs,
    Object.assign(document.createElement('div'), { id: 'viz-container' })
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
    backBtn.style.display = 'none';
    form.elements.age.focus();
  };
}

///// 7.  INICIO
(async function init () {
  try {
    [GEO, DATA] = await Promise.all([
      d3.json('./data/europe.geojson'),
      d3.csv('./data/selected_variables.csv', d3.autoType)
    ]);
  } catch (err) {
    console.error(err);
    intro.innerHTML = '<p>No se pudieron cargar los datos.</p>';
    return;
  }

  NAME_TO_ISO3 = Object.fromEntries(GEO.features.map(f => [f.properties.NAME, f.properties.ISO3]));
  ISO3_TO_NAME = Object.fromEntries(GEO.features.map(f => [f.properties.ISO3, f.properties.NAME]));
  if (NAME_TO_ISO3['The former Yugoslav Republic of Macedonia']) {
    const mkd = NAME_TO_ISO3['The former Yugoslav Republic of Macedonia'];
    NAME_TO_ISO3['North Macedonia'] = mkd;
    ISO3_TO_NAME[mkd] = 'North Macedonia';
  }

  buildAgeRanges();
  fillSelects();

  const stored = loadAns();
  if (stored) preloadForm(stored);
})();

///// 8.  EVENTOS
respectReducedMotion();
animateIntro();

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

function animateIntro () {
  const q    = document.querySelector('.intro-question');
  const flag = document.getElementById('intro-image');
  const btn  = document.getElementById('start-button');
  const text = q.textContent.trim();

  if (document.documentElement.classList.contains('no-motion')) {
    q.textContent = text;
    flag.classList.add('show');
    btn.classList.add('show');
    return;
  }

  q.textContent = '';
  let i = 0;
  (function type(){
    q.textContent += text[i];
    i++;
    if (i < text.length) {
      setTimeout(type, 80);
    } else {
      flag.classList.add('show');
      btn.classList.add('show');
    }
  })();
}
