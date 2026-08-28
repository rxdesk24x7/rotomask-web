import { MaskStrokePoint } from "../types";

export function createOffscreenCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  return canvas;
}

export function drawImageDataToCanvas(ctx: CanvasRenderingContext2D, imageData: ImageData): void {
  ctx.putImageData(imageData, 0, 0);
}

export function getImageDataFromVideoFrame(
  video: HTMLVideoElement,
  width: number,
  height: number
): ImageData | null {
  if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null;
  const canvas = createOffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

export function paintBrushStroke(
  maskData: Uint8Array,
  normalizedX: number,
  normalizedY: number,
  brushRadius: number,
  value: 0 | 255,
  width: number,
  height: number,
  feather: boolean = true,
  opacity: number = 1.0
): Uint8Array {
  const result: Uint8Array = new Uint8Array(maskData.slice());
  const cx = Math.round(normalizedX * width);
  const cy = Math.round(normalizedY * height);

  const radiusSq = brushRadius * brushRadius;
  const minX = Math.max(0, cx - brushRadius);
  const maxX = Math.min(width - 1, cx + brushRadius);
  const minY = Math.max(0, cy - brushRadius);
  const maxY = Math.min(height - 1, cy + brushRadius);

  for (let py = minY; py <= maxY; py++) {
    const dy = py - cy;
    const dySq = dy * dy;
    for (let px = minX; px <= maxX; px++) {
      const dx = px - cx;
      const distSq = dx * dx + dySq;
      if (distSq > radiusSq) continue;

      const idx = py * width + px;
      const dist = Math.sqrt(distSq);

      let targetVal = value;
      let effectiveAlpha = opacity;

      if (feather && brushRadius > 1) {
        const t = 1 - dist / brushRadius;
        const featherFalloff = t * t; // quadratic falloff
        effectiveAlpha = opacity * featherFalloff;
      }

      if (value === 255) {
        // Adding to mask
        const blended = Math.round(result[idx] + (255 - result[idx]) * effectiveAlpha);
        result[idx] = Math.min(255, blended);
      } else {
        // Erasing from mask
        const blended = Math.round(result[idx] * (1 - effectiveAlpha));
        result[idx] = Math.max(0, blended);
      }
    }
  }

  return result;
}

export function paintStrokeLine(
  maskData: Uint8Array,
  p1: MaskStrokePoint,
  p2: MaskStrokePoint,
  brushRadius: number,
  value: 0 | 255,
  width: number,
  height: number,
  feather: boolean = true,
  opacity: number = 1.0
): Uint8Array {
  let current = maskData;
  const x1 = p1.x * width;
  const y1 = p1.y * height;
  const x2 = p2.x * width;
  const y2 = p2.y * height;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Step spacing: half of brush radius or at least 2px
  const step = Math.max(2, brushRadius * 0.4);
  const numSteps = Math.ceil(distance / step);

  if (numSteps <= 1) {
    return paintBrushStroke(current, p2.x, p2.y, brushRadius, value, width, height, feather, opacity);
  }

  for (let i = 1; i <= numSteps; i++) {
    const t = i / numSteps;
    const nx = (x1 + dx * t) / width;
    const ny = (y1 + dy * t) / height;
    current = paintBrushStroke(current, nx, ny, brushRadius, value, width, height, feather, opacity);
  }

  return current;
}
