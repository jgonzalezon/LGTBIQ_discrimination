// src/main.js

import { csv } from 'd3';

// DOM elements
const startButton = document.getElementById('start-button');
const introDiv = document.getElementById('intro');
const formContainer = document.getElementById('form-container');
const dataForm = document.getElementById('data-form');
const dashboard = document.getElementById('dashboard');

// Variables whose options come from the CSV dataset
const CSV_VARIABLES = [
  'A9',
  'A12',
  'G1',
  'G2',
  'G19',
  'RESPONDENT_SO',
  'RESPONDENT_GIE'
];

/**
 * Generate age ranges for the <select id="age"> element.
 */
function buildAgeOptions() {
  const ageSelect = document.getElementById('age');
  if (!ageSelect) return;
  const frag = document.createDocumentFragment();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = 'Selecciona...';
  frag.appendChild(placeholder);

  for (let start = 15; start <= 85; start += 5) {
    const opt = document.createElement('option');
    const label = `${start}-${start + 4}`;
    opt.value = label;
    opt.textContent = label;
    frag.appendChild(opt);
  }
  const plus = document.createElement('option');
  plus.value = '90+';
  plus.textContent = '90 o más';
  frag.appendChild(plus);

  ageSelect.appendChild(frag);
}

/**
 * Populate the remaining <select> elements with unique values from the CSV.
 */
async function populateSelects() {
  const data = await csv('./data/selected_variables.csv');

  CSV_VARIABLES.forEach((varName) => {
    const select = document.getElementById(varName);
    if (!select) return;

    const values = Array.from(
      new Set(
        data
          .map((d) => d[varName])
          .filter((v) => v !== undefined && v !== null && v !== '')
      )
    ).sort();

    const frag = document.createDocumentFragment();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = 'Selecciona...';
    frag.appendChild(placeholder);

    values.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      frag.appendChild(opt);
    });

    select.appendChild(frag);
  });
}

/**
 * Gather all answers from the form.
 */
function getAnswersFromForm() {
  const formData = new FormData(dataForm);
  const answers = {};
  for (const [key, value] of formData.entries()) {
    answers[key] = value;
  }
  return answers;
}

/**
 * Preload form fields with given answers.
 */
function preloadForm(answers) {
  Object.entries(answers).forEach(([key, value]) => {
    const field = dataForm.elements[key];
    if (field) {
      field.value = value;
    }
  });
}

/** Save answers to localStorage */
function saveAnswers(answers) {
  localStorage.setItem('surveyAnswers', JSON.stringify(answers));
}

/** Load answers from localStorage */
function loadAnswers() {
  const raw = localStorage.getItem('surveyAnswers');
  return raw ? JSON.parse(raw) : null;
}

/**
 * Render dashboard and tabbed navigation.
 */
function renderDashboard(answers) {
  dashboard.innerHTML = '';

  const tabs = document.createElement('div');
  tabs.id = 'tabs';
  ['mental', 'apertura', 'violencia', 'discriminacion'].forEach((t) => {
    const btn = document.createElement('button');
    btn.dataset.tab = t;
    btn.textContent =
      t === 'mental'
        ? 'Salud mental'
        : t === 'apertura'
        ? 'Apertura'
        : t === 'violencia'
        ? 'Violencia'
        : 'Discriminación';
    tabs.appendChild(btn);
  });
  dashboard.appendChild(tabs);

  const container = document.createElement('div');
  container.id = 'viz-container';
  dashboard.appendChild(container);

  const back = document.createElement('button');
  back.id = 'back-btn';
  back.textContent = 'Volver al cuestionario';
  dashboard.appendChild(back);

  const filters = { ...answers };

  tabs.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      tabs.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderTab(btn.dataset.tab, filters);
    });
  });

  back.addEventListener('click', () => {
    dashboard.classList.add('hidden');
    formContainer.classList.remove('hidden');
    introDiv.classList.remove('hidden');
  });

  renderTab('mental', filters);
}

/**
 * Render a specific tab with placeholder images.
 */
function renderTab(tabName, filters) {
  const container = document.getElementById('viz-container');
  if (!container) return;
  container.innerHTML = '';

  const mapImg = document.createElement('img');
  mapImg.src = `img/mapa_${tabName}.png`;
  container.appendChild(mapImg);

  for (let i = 1; i <= 3; i++) {
    const img = document.createElement('img');
    img.src = `img/${tabName}_chart${i}.png`;
    container.appendChild(img);
  }
}

// ----------------- Init -----------------

buildAgeOptions();
populateSelects().then(() => {
  const stored = loadAnswers();
  if (stored) {
    preloadForm(stored);
  }
});

startButton.addEventListener('click', () => {
  introDiv.style.display = 'none';
  formContainer.classList.remove('hidden');
});

dataForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const answers = getAnswersFromForm();
  saveAnswers(answers);
  introDiv.classList.add('hidden');
  formContainer.classList.add('hidden');
  dashboard.classList.remove('hidden');
  renderDashboard(answers);
});
