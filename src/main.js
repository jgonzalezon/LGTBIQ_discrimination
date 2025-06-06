// src/main.js
import { csv } from 'd3';

const startButton = document.getElementById('start-button');
const introDiv = document.getElementById('intro');
const formContainer = document.getElementById('form-container');
const dataForm = document.getElementById('data-form');
const dynamicFields = document.getElementById('dynamic-fields');

const VARIABLES = [
  'A1',
  'A9',
  'A12',
  'G1',
  'G2',
  'G19',
  'RESPONDENT_SO',
  'RESPONDENT_GIE'
];

async function populateForm() {
  const [data, labels] = await Promise.all([
    csv('./data/selected_variables.csv'),
    csv('./data/variable_labels.csv')
  ]);

  const labelMap = {};
  labels.forEach((d) => {
    labelMap[d.variable] = d.label;
  });

  VARIABLES.forEach((varName) => {
    const label = document.createElement('label');
    label.setAttribute('for', varName);
    label.textContent = labelMap[varName] || varName;

    const select = document.createElement('select');
    select.id = varName;
    select.name = varName;

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = 'Selecciona...';
    select.appendChild(placeholder);

    const values = Array.from(
      new Set(
        data
          .map((d) => d[varName])
          .filter((v) => v !== undefined && v !== null && v !== '')
      )
    ).sort();

    values.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });

    dynamicFields.appendChild(label);
    dynamicFields.appendChild(select);
  });
}

function showForm() {
  formContainer.classList.remove('hidden');
  requestAnimationFrame(() => {
    formContainer.classList.add('visible');
  });
}

startButton.addEventListener('click', () => {
  startButton.classList.add('faded');
  startButton.addEventListener(
    'transitionend',
    () => {
      introDiv.style.display = 'none';
      showForm();
      populateForm();
    },
    { once: true }
  );
});

dataForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(dataForm);
  const entries = Object.fromEntries(formData.entries());
  console.log('Datos recogidos:', entries);
  alert('Formulario enviado. Revisa la consola para ver los datos.');
});
