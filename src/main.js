// src/main.js

// Seleccionamos elementos
const startButton = document.getElementById('start-button');
const introDiv = document.getElementById('intro');
const formContainer = document.getElementById('form-container');
const dataForm = document.getElementById('data-form');

// Función que muestra (fade-in) el formulario
function showForm() {
  formContainer.classList.remove('hidden');
  // requestAnimationFrame para asegurar que el navegador aplique el cambio de display antes de animar opacity
  requestAnimationFrame(() => {
    formContainer.classList.add('visible');
  });
}

// Al hacer clic en el botón inicial
startButton.addEventListener('click', () => {
  // 1) Añadimos la clase 'faded' (baja la opacidad a 0 en 0.5s)
  startButton.classList.add('faded');

  // 2) Esperamos a que termine la transición de opacidad
  startButton.addEventListener(
    'transitionend',
    () => {
      // Ocultamos completamente el contenedor intro
      introDiv.style.display = 'none';
      // Mostramos el formulario
      showForm();
    },
    { once: true }
  );
});

// Manejo del submit del formulario (opcional)
dataForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(dataForm);
  const entries = Object.fromEntries(formData.entries());
  console.log('Datos recogidos:', entries);
  // Aquí podrías llamar a tu lógica de D3, envío a servidor, etc.
  alert('Formulario enviado. Revisa la consola para ver los datos.');
});
