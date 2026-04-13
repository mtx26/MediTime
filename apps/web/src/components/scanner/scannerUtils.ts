import type { ReaderOptions } from "zxing-wasm/reader";
import type { TFunction } from "i18next";

// ─── Reader Options ──────────────────────────────────────────────────────────

export const readerOptions: ReaderOptions = {
  tryHarder: true,
  formats: ["DataMatrix"],
  maxNumberOfSymbols: 1,
};

// ─── CSS Styles Injection ────────────────────────────────────────────────────

const controlsStyle = `
  .scanner-controls .form-range {
    height: 0.5rem;
    width: 120px;
  }
  .scanner-controls .form-select-sm {
    padding: 0.125rem 0.25rem;
    font-size: 0.75rem;
    min-width: 120px;
  }
`;

export function injectScannerStyles(): void {
  if (typeof document !== 'undefined' && !document.getElementById('scanner-controls-styles')) {
    const style = document.createElement('style');
    style.id = 'scanner-controls-styles';
    style.textContent = controlsStyle;
    document.head.appendChild(style);
  }
}

// ─── Camera Helpers ──────────────────────────────────────────────────────────

export function getCameraType(camera: MediaDeviceInfo): string {
  const label = camera.label.toLowerCase();

  if (label.includes('back') || label.includes('rear') ||
    label.includes('environment') || label.includes('arriere')) {
    return 'back';
  }

  if (label.includes('front') || label.includes('user') ||
    label.includes('facing') || label.includes('avant')) {
    return 'front';
  }

  if (label.includes('integrated') || label.includes('webcam') ||
    label.includes('built-in')) {
    return 'front';
  }

  return 'front';
}

export function getCameraDisplayName(camera: MediaDeviceInfo, index: number, t: TFunction): string {
  if (!camera.label) return t('scanner.camera') + ` ${index + 1}`;

  const type = getCameraType(camera);
  const label = camera.label.toLowerCase();

  const hasGenericTerms = ['front', 'back', 'rear', 'facing'].some(term =>
    label.includes(term)
  );

  if (hasGenericTerms) {
    return type === 'front' ? t('scanner.camera_front') :
      type === 'back' ? t('scanner.camera_back') :
        camera.label;
  } else {
    let cleanName = camera.label;
    const lowerLabel = camera.label.toLowerCase();
    const genericTerms = ['usb', 'camera', 'webcam', 'cam', 'device', 'video'];

    let earliestIndex = -1;
    for (const term of genericTerms) {
      const termIndex = lowerLabel.indexOf(term);
      if (termIndex !== -1 && (earliestIndex === -1 || termIndex < earliestIndex)) {
        earliestIndex = termIndex;
      }
    }

    if (earliestIndex !== -1) {
      cleanName = camera.label.substring(0, earliestIndex).trim();
    }

    return cleanName || camera.label;
  }
}

// ─── Barcode Detection ───────────────────────────────────────────────────────

interface DetectionPosition {
  points?: Array<{ x: number; y: number }>;
  topLeft?: { x: number; y: number };
  topRight?: { x: number; y: number };
  bottomRight?: { x: number; y: number };
  bottomLeft?: { x: number; y: number };
}

export interface BarcodeDetectionResult {
  position?: DetectionPosition;
}

export function drawDetection(ctx: CanvasRenderingContext2D, r: BarcodeDetectionResult): void {
  let points: Array<{ x: number; y: number }> = [];

  if (Array.isArray(r?.position?.points) && r.position.points.length) {
    points = r.position.points;
  } else if (
    r?.position?.topLeft &&
    r?.position?.topRight &&
    r?.position?.bottomRight &&
    r?.position?.bottomLeft
  ) {
    points = [
      r.position.topLeft,
      r.position.topRight,
      r.position.bottomRight,
      r.position.bottomLeft,
    ];
  }

  if (points.length >= 4) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#00FF00";
    ctx.beginPath();
    const first = points[0];
    const firstX = Number(first.x);
    const firstY = Number(first.y);
    if (Number.isFinite(firstX) && Number.isFinite(firstY)) {
      ctx.moveTo(firstX, firstY);
      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        if (!p || typeof p !== 'object') continue;
        const x = Number(p.x);
        const y = Number(p.y);
        if (Number.isFinite(x) && Number.isFinite(y)) {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
}

// ─── GTIN Extraction ─────────────────────────────────────────────────────────

export function extractGTIN01(text: string): string | null {
  if (!text) return null;

  const GS1_SEPARATOR = String.fromCharCode(29);
  const cleaned = text.replaceAll(GS1_SEPARATOR, "");

  let m = cleaned.match(/\(01\)\s*([0-9]{14})/);
  if (m) return m[1];

  m = cleaned.match(/(?:^|[^0-9])01([0-9]{14})(?:[^0-9]|$)/);
  if (m) return m[1];

  return null;
}
