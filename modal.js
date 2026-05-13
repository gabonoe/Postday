// Modal de verificación de producto
const btnVerify = document.getElementById('btn-verify');
const modal = document.getElementById('verify-modal');
const modalClose = document.querySelector('.modal__close');
const modalOverlay = document.querySelector('.modal__overlay');
const securityCodeInput = document.getElementById('security-code');
const btnVerifyCode = document.getElementById('btn-verify-code');
const btnShowReport = document.getElementById('btn-show-report');
const btnReport = document.getElementById('btn-report');
const reportEmailInput = document.getElementById('report-email');
const reportLocationInput = document.getElementById('report-location');

// Modal steps
const stepInput = document.getElementById('modal-step-input');
const stepSuccess = document.getElementById('modal-step-success');
const stepWarning = document.getElementById('modal-step-warning');
const reportSection = document.getElementById('report-section');

// Valid code
const VALID_CODE = 'ABC123';

// Open modal
btnVerify.addEventListener('click', () => {
  modal.setAttribute('aria-hidden', 'false');
  resetModal();
  securityCodeInput.focus();
});

// Close modal functions
function closeModal() {
  modal.setAttribute('aria-hidden', 'true');
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
    closeModal();
  }
});

// Reset modal to initial state
function resetModal() {
  stepInput.classList.remove('modal__step--hidden');
  stepSuccess.classList.add('modal__step--hidden');
  stepWarning.classList.add('modal__step--hidden');
  reportSection.classList.add('modal__report-section--hidden');
  btnShowReport.classList.remove('modal__step--hidden');
  securityCodeInput.value = '';
  reportEmailInput.value = '';
  reportLocationInput.value = '';
}

// Verify code
btnVerifyCode.addEventListener('click', () => {
  const code = securityCodeInput.value.trim().toUpperCase();

  if (code === VALID_CODE) {
    // Show success
    stepInput.classList.add('modal__step--hidden');
    stepSuccess.classList.remove('modal__step--hidden');
    stepWarning.classList.add('modal__step--hidden');
  } else {
    // Show warning
    stepInput.classList.add('modal__step--hidden');
    stepSuccess.classList.add('modal__step--hidden');
    stepWarning.classList.remove('modal__step--hidden');
    reportSection.classList.add('modal__report-section--hidden');
    btnShowReport.classList.remove('modal__step--hidden');
  }
});

// Allow Enter key to verify
securityCodeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    btnVerifyCode.click();
  }
});

// Show report section
btnShowReport.addEventListener('click', () => {
  reportSection.classList.remove('modal__report-section--hidden');
  btnShowReport.classList.add('modal__step--hidden');
  reportEmailInput.focus();
});

// Report functionality
btnReport.addEventListener('click', () => {
  const email = reportEmailInput.value.trim();
  const location = reportLocationInput.value.trim();

  if (email && isValidEmail(email)) {
    const locationText = location ? ` Ubicación: ${location}.` : '';
    alert('Reporte enviado. Gracias por ayudarnos a combatir productos falsificados.' + locationText);
    closeModal();
  } else {
    alert('Por favor ingresa un correo electrónico válido.');
  }
});

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Allow Enter key to submit report
reportEmailInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    btnReport.click();
  }
});
