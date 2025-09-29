// =============================
// MATE SOLIDARIO - FORMULARIO JS
// =============================
// Controla el formulario multi-paso de solicitud de crédito.
// - Recopila datos de todos los campos.
// - Valida cada paso, y que se acepten términos.
// - Envía SIEMPRE los datos al backend (ignora errores).
// - Redirige según la lógica de JS local (esGanado).
// - UX: el botón "Enviar" solo se habilita si se aceptan Términos y Condiciones.

/* -------------------------
   SELECTORES Y VARIABLES
------------------------- */
const form = document.getElementById('multiStepForm');
const steps = document.querySelectorAll('.step');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const progressItems = document.querySelectorAll('.progressbar li');
const terminosCheck = document.getElementById('terminos');

let currentStep = 0;

/* -------------------------
    FUNCIONES DE PASOS
------------------------- */

// Muestra el paso n, actualiza barra de progreso y botones
function showStep(n) {
  steps.forEach((step, i) => {
    step.classList.toggle('active', i === n);
    progressItems[i].classList.toggle('active', i <= n);
  });
  prevBtn.disabled = n === 0;
  nextBtn.style.display = n === steps.length - 1 ? 'none' : 'inline-block';
  submitBtn.style.display = n === steps.length - 1 ? 'inline-block' : 'none';
  toggleSubmitBtn(); // Nueva: controla si el botón Enviar se habilita
}

// Valida los campos visibles del paso actual
function validateStep() {
  const inputs = steps[currentStep].querySelectorAll('input, select');
  for (const input of inputs) {
    if (!input.checkValidity()) {
      input.reportValidity();
      return false;
    }
  }
  return true;
}

/* -------------------------
    RECOLECCIÓN DE DATOS
------------------------- */

// Devuelve datos del formulario como objeto plano y como FormData
function getFormData() {
  const formData = new FormData(form);
  // El checkbox "autorizo_contactar" puede venir vacío
  if (!formData.has('autorizo_contactar')) formData.append('autorizo_contactar', 'false');
  const data = {};
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  return { formData, plainData: data };
}

/* -------------------------
    LÓGICA DE NEGOCIO
------------------------- */

// Determina si el perfil es "Ganado" según la lógica local
function isGanado({ provincia, banco, situacion_laboral }) {
  // Córdoba: Empleado Público o Pensionado con Bancor, o Jubilado
  if (provincia === 'Córdoba') {
    const esEmpleadoPublico = situacion_laboral.includes('Empleado Público');
    const esJubilado = situacion_laboral.includes('Jubilado');
    const esPensionado = situacion_laboral === 'Pensionado';
    if ((esEmpleadoPublico || esPensionado) && banco === 'Banco de Córdoba (Bancor)') return true;
    if (esJubilado) return true;
  }
  // Catamarca: Empleado Público
  if (provincia === 'Catamarca') {
    if (situacion_laboral.includes('Empleado Público')) return true;
  }
  // Otros casos: no es ganado
  return false;
}

/* -------------------------
    UX: HABILITA/DESHABILITA SUBMIT
------------------------- */

// Habilita el botón Enviar solo si el checkbox de Términos está tildado (último paso)
function toggleSubmitBtn() {
  if (currentStep === steps.length - 1) {
    submitBtn.disabled = !terminosCheck.checked;
  }
}

// Si cambia el estado del checkbox de Términos, actualiza el botón
terminosCheck.addEventListener('change', toggleSubmitBtn);

/* -------------------------
    NAVEGACIÓN ENTRE PASOS
------------------------- */

prevBtn.addEventListener('click', () => {
  if (currentStep > 0) {
    currentStep--;
    showStep(currentStep);
  }
});

nextBtn.addEventListener('click', () => {
  if (validateStep()) {
    currentStep++;
    showStep(currentStep);
  }
});

/* -------------------------
    ENVÍO DE FORMULARIO
------------------------- */

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateStep()) return;

  // Protección UX doble envío
  submitBtn.disabled = true;
  nextBtn.disabled = true;
  prevBtn.disabled = true;

  // Toma snapshot de los datos y calcula decisión antes del fetch
  const { formData, plainData } = getFormData();
  const esGanado = isGanado({
    provincia: plainData.provincia,
    banco: plainData.banco,
    situacion_laboral: plainData.situacion_laboral
  });

  // Prepara datos para envío (x-www-form-urlencoded)
  const plainFormData = new URLSearchParams(formData).toString();

  // Enviar SIEMPRE los datos, ignorando si hay error/falla CORS
  try {
    await fetch("https://proxy-appscript.mateprestamos.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: plainFormData,
    });
    // No importa si la respuesta es error, CORS, etc.
  } catch (error) {
    // Ignora cualquier error, solo lo muestra en consola para debug
    console.error('❌ Error al enviar datos (ignorado para redirección):', error);
  } finally {
    // SIEMPRE redirige según la lógica local (sin depender del backend)
     fbq('trackCustom', 'formulariocargado');
    setTimeout(() => {
      window.location.href = esGanado
        ? '../agradecimiento/gracias_solicitud.html'
        : '../agradecimiento/gracias_interes.html';
    }, 1200);
    // Opcional: rehabilita botones si el usuario vuelve
    submitBtn.disabled = false;
    nextBtn.disabled = false;
    prevBtn.disabled = currentStep === 0;
  }
});

/* -------------------------
    INICIALIZACIÓN
------------------------- */

showStep(currentStep); // Muestra el primer paso y setea estado inicial del submit

// Fin del formulario.js
