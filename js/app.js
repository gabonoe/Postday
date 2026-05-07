// App entry: splash -> mobile check -> 8th Wall AR (Android + iOS Safari).
import * as THREE from 'three';
import { initReyArScene }      from './ar.js';
import { initArPlacementScene } from './ar-placement.js';

// Expose THREE globally so 8th Wall's XR8.Threejs pipeline module can use it.
window.THREE = THREE;

const splash       = document.getElementById('splash');
const noMobile     = document.getElementById('no-mobile');
const arOverlay    = document.getElementById('ar-overlay');
const btnStart     = document.getElementById('btn-start');
const btnExit      = document.getElementById('btn-exit');
const btnSwitch    = document.getElementById('btn-switch');
const btnPhoto     = document.getElementById('btn-photo');
const photoPreview = document.getElementById('photo-preview');
const photoImg     = document.getElementById('photo-img');
const photoDownload = document.getElementById('photo-download');
const photoClose   = document.getElementById('photo-close');
const hintEl       = document.getElementById('hint');
const modeLabel    = document.getElementById('mode-label');
const canvas       = document.getElementById('camerafeed');

function isMobile() {
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
  const isIpad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return mobileRegex.test(ua) || isIpad;
}

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

// ── Mode state ───────────────────────────────────────────────────────────────
// 'selfie' = front camera + face filter | 'ar' = back camera + model placement
// Mode is persisted via URL param (?mode=ar) so XR8.stop/run is not needed.
const urlMode     = new URLSearchParams(location.search).get('mode');
let currentMode   = urlMode === 'ar' ? 'ar' : 'selfie';
let arStarted     = false;

const HINTS = {
  selfie: 'Selfie del REY — apunta tu cara a la cámara',
  ar:     'Modo RA — apunta al suelo y toca para colocar al Rey',
};

const SWITCH_LABELS = {
  selfie: '🌍 Modo RA',
  ar:     '🤳 Selfie REY',
};

function updateUI(mode) {
  hintEl.textContent     = HINTS[mode];
  btnSwitch.textContent  = SWITCH_LABELS[mode];
  modeLabel.textContent  = mode === 'selfie' ? 'Selfie del REY' : 'Modo RA';
  // Hide photo button in AR placement (can't take a useful selfie from back cam)
  mode === 'ar' ? hide(btnPhoto) : show(btnPhoto);
}

// ── Pipeline builders ────────────────────────────────────────────────────────
function buildPipeline(mode) {
  XR8.clearCameraPipelineModules();

  if (mode === 'selfie') {
    XR8.XrController.configure({ disableWorldTracking: true });
    XR8.addCameraPipelineModules([
      XR8.GlTextureRenderer.pipelineModule(),
      XR8.Threejs.pipelineModule(),
      XR8.XrController.pipelineModule(),
      window.LandingPage.pipelineModule(),
      XRExtras.FullWindowCanvas.pipelineModule(),
      XRExtras.Loading.pipelineModule(),
      XRExtras.RuntimeError.pipelineModule(),
      XR8.CanvasScreenshot.pipelineModule(),
      initReyArScene({ selfieMode: true }),
    ]);
  } else {
    XR8.XrController.configure({ disableWorldTracking: false });
    XR8.addCameraPipelineModules([
      XR8.GlTextureRenderer.pipelineModule(),
      XR8.Threejs.pipelineModule(),
      XR8.XrController.pipelineModule(),
      window.LandingPage.pipelineModule(),
      XRExtras.FullWindowCanvas.pipelineModule(),
      XRExtras.Loading.pipelineModule(),
      XRExtras.RuntimeError.pipelineModule(),
      initArPlacementScene({
        onHintChange: (text) => { hintEl.textContent = text; },
      }),
    ]);
  }
}

function runXR8(mode) {
  const dir = mode === 'selfie'
    ? XR8.XrConfig.camera().FRONT
    : XR8.XrConfig.camera().BACK;
  XR8.run({ canvas, cameraConfig: { direction: dir } });
}

// ── Start / switch ───────────────────────────────────────────────────────────
function startAR() {
  if (arStarted) return;
  arStarted = true;

  const onxrloaded = () => {
    buildPipeline(currentMode);
    runXR8(currentMode);
    updateUI(currentMode);
  };

  if (window.XR8) onxrloaded();
  else window.addEventListener('xrloaded', onxrloaded);
}

function switchMode() {
  const nextMode = currentMode === 'selfie' ? 'ar' : 'selfie';
  // Reload page with new mode param — safest way to switch 8th Wall camera
  const url = new URL(location.href);
  url.searchParams.set('mode', nextMode);
  location.href = url.toString();
}

// ── Event listeners ──────────────────────────────────────────────────────────
btnStart.addEventListener('click', () => {
  if (!isMobile()) {
    hide(splash);
    show(noMobile);
    return;
  }
  hide(splash);
  show(canvas);
  show(arOverlay);
  startAR();
});

// Auto-start AR if returning from a mode switch (URL has ?mode=...)
if (urlMode) {
  if (!isMobile()) {
    show(noMobile);
  } else {
    hide(splash);
    show(canvas);
    show(arOverlay);
    startAR();
  }
}

btnExit.addEventListener('click', () => {
  window.location.reload();
});

btnSwitch.addEventListener('click', switchMode);

btnPhoto.addEventListener('click', async () => {
  if (!window.XR8 || !XR8.CanvasScreenshot) return;
  btnPhoto.disabled = true;
  try {
    const data   = await XR8.CanvasScreenshot.takeScreenshot();
    const dataUrl = 'data:image/jpeg;base64,' + data;
    photoImg.src        = dataUrl;
    photoDownload.href  = dataUrl;
    show(photoPreview);
  } catch (err) {
    console.error('Error tomando foto:', err);
  } finally {
    btnPhoto.disabled = false;
  }
});

photoClose.addEventListener('click', () => {
  hide(photoPreview);
  photoImg.src = '';
});

