const form = document.getElementById('multiStepForm');
const steps = document.querySelectorAll('.step');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const progressItems = document.querySelectorAll('.progressbar li');

let currentStep = 0;

function showStep(n) {
  steps.forEach((step, i) => {
    step.classList.toggle('active', i === n);
    progressItems[i].classList.toggle('active', i <= n);
  });

  prevBtn.disabled = n === 0;

  if (n === steps.length - 1) {
    nextBtn.style.display = 'none';
    submitBtn.style.display = 'inline-block';
  } else {
    nextBtn.style.display = 'inline-block';
    submitBtn.style.display = 'none';
  }
}

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

form.addEventListener('submit', async e => {
  e.preventDefault();

  if (!validateStep()) return;

  submitBtn.disabled = true;
  nextBtn.disabled = true;
  prevBtn.disabled = true;

  const formData = new FormData(form);

  if (!formData.has('autorizo_contactar')) {
    formData.append('autorizo_contactar', 'false');
  }

  // Convertimos FormData a x-www-form-urlencoded
  const plainFormData = new URLSearchParams(formData).toString();

  const data = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });

  const provincia = data.provincia;
  const situacionLaboral = data.situacion_laboral;
  const banco = data.banco;

  let esGanado = false;

  if (provincia === 'Córdoba') {
    const esEmpleadoPublico = situacionLaboral.includes('Empleado Público');
    const esJubilado = situacionLaboral.includes('Jubilado');
    const esPensionado = situacionLaboral === 'Pensionado';

    if ((esEmpleadoPublico || esPensionado) && banco === 'Bancor') {
      esGanado = true;
    } else if (esJubilado) {
      esGanado = true;
    }
  } else if (provincia === 'Catamarca') {
    const esEmpleadoPublico = situacionLaboral.includes('Empleado Público');
    if (esEmpleadoPublico) {
      esGanado = true;
    }
  }

  try {
    const response = await fetch("https://proxy-appscript.mateprestamos.workers.dev", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: plainFormData,
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    if (result.result !== "OK") throw new Error(`Error en respuesta: ${result.message || 'Desconocido'}`);
    console.log('✅ Respuesta del servidor:', result);

    setTimeout(() => {
      if (esGanado) {
        window.location.href = '../agradecimiento/gracias_solicitud.html';
      } else {
        window.location.href = '../agradecimiento/gracias_interes.html';
      }
    }, 2000);

  } catch (error) {
    console.error('❌ Error al enviar datos:', error);
    setTimeout(() => {
      window.location.href = '../agradecimiento/graciastest.html';
    }, 2000);
  } finally {
    submitBtn.disabled = false;
    nextBtn.disabled = false;
    prevBtn.disabled = currentStep === 0;
  }
});

showStep(currentStep);
