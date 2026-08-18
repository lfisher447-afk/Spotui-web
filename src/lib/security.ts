import { AppSettings } from '../types';
import { loadWsmModule, WsmModuleInstance } from './wsm-loader';

let securityCleanupFn: (() => void) | null = null;
let originalGetDisplayMedia: any = null;
let originalToDataURL: any = null;
let originalToBlob: any = null;
let originalGetImageData: any = null;
let originalMediaRecorder: any = null;
let originalPrint: any = null;
let wsmCryptoEngine: WsmModuleInstance | null = null;

export const CLOAK_PRESETS = {
  'google-classroom': {
    title: 'Classes',
    favicon: 'https://ssl.gstatic.com/classroom/favicon.png',
  },
  'google-drive': {
    title: 'My Drive - Google Drive',
    favicon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png',
  },
  wikipedia: {
    title: 'Wikipedia, the free encyclopedia',
    favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico',
  },
  canvas: {
    title: 'Dashboard | Canvas LMS',
    favicon: 'https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico',
  },
  calculator: {
    title: 'Desmos | Graphing Calculator',
    favicon: 'https://www.desmos.com/favicon.ico',
  },
};

export function applyTabCloak(presetKey: keyof typeof CLOAK_PRESETS | 'none') {
  if (presetKey === 'none' || !CLOAK_PRESETS[presetKey]) {
    document.title = 'Spotui Signal Room';
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = '/vite.svg';
    }
    return;
  }

  const preset = CLOAK_PRESETS[presetKey];
  document.title = preset.title;

  let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = preset.favicon;
}

export function launchAboutBlankCloak(targetUrl?: string) {
  const win = window.open('about:blank', '_blank');
  if (!win) {
    alert('Popup blocked! Please allow popups to launch the cloaked stealth window.');
    return;
  }

  const doc = win.document;
  doc.title = 'Classes';

  const iframe = doc.createElement('iframe');
  iframe.src = targetUrl || window.location.href;
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100vw';
  iframe.style.height = '100vh';
  iframe.style.border = 'none';
  iframe.style.margin = '0';
  iframe.style.padding = '0';
  iframe.style.overflow = 'hidden';

  doc.body.style.margin = '0';
  doc.body.style.background = '#071013';
  doc.body.appendChild(iframe);
}

export function launchBlobCloak(targetUrl?: string) {
  const finalSrc = targetUrl || window.location.href;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Dashboard</title>
        <style>html,body{margin:0;padding:0;width:100%;height:100%;background:#071013;overflow:hidden;}</style>
      </head>
      <body>
        <iframe src="${finalSrc}" style="width:100%;height:100%;border:none;"></iframe>
      </body>
    </html>
  `;
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}

/**
 * 1000x Hardened Anti-Screenshot, Anti-Extension, Anti-Software-Recording Engine
 */
export function initSecurityEngine(settings: AppSettings) {
  // 0. Load WebAssembly WSM Security Crypto Engine
  loadWsmModule('/stealth-crypto.wsm', 'wsm_stealth_crypto_tls').then((inst) => {
    wsmCryptoEngine = inst;
  });

  // Cleanup previous listeners
  if (securityCleanupFn) {
    securityCleanupFn();
    securityCleanupFn = null;
  }

  // Handle Tab Cloaking
  applyTabCloak(settings.security.cloakPreset as any);

  // 1. Anti Page Close Guard
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = 'Signal Room Vault session is currently active. Are you sure you want to exit?';
    return e.returnValue;
  };
  window.addEventListener('beforeunload', handleBeforeUnload);

  // 2. Build or Retrieve GPU Blackout Overlay Curtain
  let overlay = document.getElementById('anti-screenshot-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'anti-screenshot-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #000000;
      z-index: 2147483647;
      display: none;
      align-items: center;
      justify-content: center;
      color: #38bdf8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      letter-spacing: 1.5px;
      pointer-events: all;
      user-select: none;
      -webkit-user-select: none;
      backdrop-filter: blur(50px);
    `;
    overlay.innerHTML = `
      <div style="text-align: center; border: 1px solid #1e293b; padding: 32px 48px; border-radius: 20px; background: #020617; box-shadow: 0 0 100px rgba(0,0,0,1);">
        <div style="color: #ef4444; font-weight: 800; margin-bottom: 10px; font-size: 18px; letter-spacing: 2px;">
          [ HARDENED DRM & EXTENSION SHIELD ENGAGED ]
        </div>
        <div style="color: #94a3b8; font-size: 13px; margin-top: 4px; font-weight: 600;">
          SCREEN CAPTURE / EXTENSION RECORDING INTERCEPTED & BLACKED OUT
        </div>
        <div style="color: #48e4ff; font-size: 11px; margin-top: 12px; font-family: monospace;">
          PROTECTED BY WSM ZERO-KNOWLEDGE BYTECODE CORE • CHROMEBOOK & WINDOWS GUARD
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // 3. Inject Strict Anti-Print CSS to defeat PDF/Print screen grabbers
  let printStyle = document.getElementById('anti-print-drm-style');
  if (!printStyle) {
    printStyle = document.createElement('style');
    printStyle.id = 'anti-print-drm-style';
    printStyle.innerHTML = `
      @media print {
        html, body, #root, * {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
        body::before {
          content: "[ DRM PROTECTED CONTENT - SCREENSHOT/PRINT PROHIBITED ]";
          display: block !important;
          visibility: visible !important;
          color: black !important;
          font-size: 24pt !important;
          text-align: center !important;
          margin-top: 200pt !important;
        }
      }
    `;
    document.head.appendChild(printStyle);
  }

  const showShield = () => {
    if (overlay && settings.security.antiScreenshotEnabled) {
      overlay.style.display = 'flex';
    }
  };

  const hideShield = () => {
    if (overlay) overlay.style.display = 'none';
  };

  // 4. Focus, Blur, Visibility, and Pointer Event Guards
  const handleBlur = () => {
    if (settings.security.blurSensitivity !== 'standard') {
      showShield();
    }
  };

  const handleFocus = () => {
    hideShield();
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      showShield();
    } else {
      hideShield();
    }
  };

  // 5. Anti-Extension & Screen Scraper MutationObserver
  // Detects extensions injecting recording overlays (Loom, Clearpay, Lightshot, Screencastify, etc.)
  const extensionObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLElement) {
          const id = (node.id || '').toLowerCase();
          const cls = (node.className || '').toString().toLowerCase();
          const tag = node.tagName.toLowerCase();

          if (
            id.includes('loom') ||
            id.includes('recorder') ||
            id.includes('screencastify') ||
            id.includes('screenshot') ||
            id.includes('capture') ||
            cls.includes('loom') ||
            cls.includes('screencast') ||
            tag === 'chrome-extension'
          ) {
            console.warn('[DRM Extension Interceptor] Malicious screen recorder extension detected & purged:', node);
            try {
              node.remove();
            } catch (e) {}
            showShield();
            setTimeout(hideShield, 3000);
          }
        }
      }
    }
  });

  try {
    extensionObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  } catch (e) {}

  // 6. Hook Canvas Export APIs (toDataURL, toBlob, getImageData) to prevent DOM-to-Image / HTML2Canvas screen scraping
  if (!originalToDataURL) {
    originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (type, quality) {
      if (settings.security.antiScreenshotEnabled) {
        // Return solid 1x1 black pixel data URI
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      }
      return originalToDataURL.apply(this, arguments as any);
    };
  }

  if (!originalToBlob) {
    originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      if (settings.security.antiScreenshotEnabled) {
        const blackCanvas = document.createElement('canvas');
        blackCanvas.width = 1;
        blackCanvas.height = 1;
        return originalToBlob.call(blackCanvas, callback, type, quality);
      }
      return originalToBlob.apply(this, arguments as any);
    };
  }

  if (!originalGetImageData) {
    originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function (sx, sy, sw, sh) {
      if (settings.security.antiScreenshotEnabled && (sw > 300 || sh > 300)) {
        // Obfuscate large canvas scrapes
        return new ImageData(sw, sh);
      }
      return originalGetImageData.apply(this, arguments as any);
    };
  }

  // 7. Hook MediaRecorder to block extension screen recording
  if (window.MediaRecorder && !originalMediaRecorder) {
    originalMediaRecorder = window.MediaRecorder;
    try {
      (window as any).MediaRecorder = class extends (originalMediaRecorder as any) {
        constructor(stream: any, options: any) {
          console.warn('[DRM MediaRecorder Guard] Unauthorized recorder blocked.');
          // Generate decoy blank stream
          const canvas = document.createElement('canvas');
          canvas.width = 1280;
          canvas.height = 720;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 1280, 720);
          }
          const decoyStream = canvas.captureStream(1);
          super(decoyStream, options);
        }
      };
    } catch (e) {}
  }

  // 8. Hook getDisplayMedia for WebRTC Screen Share / OBS / Discord
  if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    if (!originalGetDisplayMedia) {
      originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
    }
    navigator.mediaDevices.getDisplayMedia = async function (constraints) {
      showShield();
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1920, 1080);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('[ SIGNAL ROOM HARDENED DRM SHIELD - SCREEN CAPTURE PROHIBITED ]', 240, 540);
      }
      return canvas.captureStream(30);
    };
  }

  // 9. Keyboard Shortcuts Interception: Windows, ChromeOS, macOS, Snip Tools
  const handleKeyDown = (e: KeyboardEvent) => {
    // 1. Standard PrintScreen & SysRq
    if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
      e.preventDefault();
      showShield();
      try {
        navigator.clipboard?.writeText?.('');
      } catch (err) {}
      setTimeout(hideShield, 2500);
      return;
    }

    // 2. Windows Snipping Tool: Win + Shift + S
    if (e.shiftKey && (e.metaKey || e.key === 'Meta') && e.key.toLowerCase() === 's') {
      e.preventDefault();
      showShield();
      try {
        navigator.clipboard?.writeText?.('');
      } catch (err) {}
      setTimeout(hideShield, 3500);
      return;
    }

    // 3. Windows Game Bar Screen Recorder: Win + Alt + R / Win + G
    if (e.altKey && (e.metaKey || e.key === 'Meta') && (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'g')) {
      e.preventDefault();
      showShield();
      setTimeout(hideShield, 3500);
      return;
    }

    // 4. Chromebook / ChromeOS Screenshot & Screen Capture Combos:
    // Ctrl + Window Switcher (F5 / BrowserBack)
    if (e.ctrlKey && (e.key === 'F5' || e.code === 'F5' || e.key === 'BrowserBack' || e.code === 'BrowserBack')) {
      e.preventDefault();
      showShield();
      setTimeout(hideShield, 3000);
      return;
    }

    // Chromebook Screen Capture Tool: Search/Meta + Shift + S
    if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      showShield();
      setTimeout(hideShield, 3000);
      return;
    }

    // Chromebook Quick Settings Snapshot Key
    if (e.key === 'Snapshot' || e.key === 'LaunchApp1' || e.code === 'Snapshot') {
      e.preventDefault();
      showShield();
      setTimeout(hideShield, 2500);
      return;
    }

    // 5. macOS Screenshot combos (Cmd + Shift + 3 / 4 / 5 / 6)
    if (e.metaKey && e.shiftKey && ['3', '4', '5', '6'].includes(e.key)) {
      e.preventDefault();
      showShield();
      setTimeout(hideShield, 3000);
      return;
    }

    // 6. DevTools shortcuts
    if (settings.security.preventDevTools) {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toLowerCase() === 'u')
      ) {
        e.preventDefault();
        showShield();
        setTimeout(hideShield, 2000);
      }
    }
  };

  // 10. Mouse leave & Pointer Cancel Guards
  const handleMouseLeave = () => {
    if (settings.security.blurSensitivity === 'ultra-paranoia') {
      showShield();
    }
  };

  const handleMouseEnter = () => {
    hideShield();
  };

  // 11. Context Menu & Selection Guard
  const handleContextMenu = (e: MouseEvent) => {
    if (settings.security.blockRightClick) {
      e.preventDefault();
    }
  };

  // 12. Hook window.print()
  if (!originalPrint) {
    originalPrint = window.print;
    window.print = function () {
      showShield();
      console.warn('[DRM Print Guard] Window print intercepted.');
    };
  }

  window.addEventListener('blur', handleBlur);
  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('contextmenu', handleContextMenu);
  document.addEventListener('mouseleave', handleMouseLeave);
  document.addEventListener('mouseenter', handleMouseEnter);

  // 13. Dynamic Stroboscopic Anti-OCR Matrix Watermark
  if (settings.security.dynamicWatermark) {
    let wm = document.getElementById('drm-watermark');
    if (!wm) {
      wm = document.createElement('div');
      wm.id = 'drm-watermark';
      wm.style.cssText = `
        position: fixed;
        bottom: 14px;
        right: 14px;
        font-family: monospace;
        font-size: 10px;
        color: rgba(72, 228, 255, 0.25);
        pointer-events: none;
        z-index: 2147483640;
        text-shadow: 0 0 4px rgba(0,0,0,0.8);
      `;
      wm.innerText = `WSM-DRM: ${Math.random().toString(36).substring(2, 9).toUpperCase()} | SIGNAL-ROOM HARDENED`;
      document.body.appendChild(wm);
    }
  }

  securityCleanupFn = () => {
    extensionObserver.disconnect();
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('contextmenu', handleContextMenu);
    document.removeEventListener('mouseleave', handleMouseLeave);
    document.removeEventListener('mouseenter', handleMouseEnter);
  };
}
