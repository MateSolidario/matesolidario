console.log("Hola")

document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  navToggle.addEventListener('click', function() {
    mainNav.classList.toggle('open');
  });

  // Opcional: cerrar menú al hacer click en un enlace
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mainNav.classList.remove('open'));
  });
});
