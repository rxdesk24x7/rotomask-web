import { MaskStroke } from "../types";
import { paintBrushStroke, paintStrokeLine } from "./canvas.utils";

export function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map(c => c + c).join("");
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return [0, 255, 136];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function getMaskCoverage(maskData: Uint8Array): number {
  if (!maskData || maskData.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < maskData.length; i++) {
    if (maskData[i] > 127) count++;
  }
  return Math.round((count / maskData.length) * 100);
}

export function applyAllStrokesToMatte(
  baseMatte: Uint8Array,
  strokes: MaskStroke[],
  width: number,
  height: number
): Uint8Array {
  let result: Uint8Array = new Uint8Array(baseMatte.slice());

  for (const stroke of strokes) {
    const val = stroke.type === "add" ? 255 : 0;
    const pts = stroke.points;
    if (pts.length === 0) continue;

    if (pts.length === 1) {
      result = paintBrushStroke(
        result,
        pts[0].x,
        pts[0].y,
        stroke.brushSize,
        val,
        width,
        height,
        stroke.brushFeather,
        stroke.brushOpacity
      );
    } else {
      for (let i = 1; i < pts.length; i++) {
        result = paintStrokeLine(
          result,
          pts[i - 1],
          pts[i],
          stroke.brushSize,
          val,
          width,
          height,
          stroke.brushFeather,
          stroke.brushOpacity
        );
      }
    }
  }

  return result;
}

export function maskToImageData(
  mask: Uint8Array,
  width: number,
  height: number,
  overlayRGB: [number, number, number],
  opacity: number
): ImageData {
  const imgData = new ImageData(width, height);
  const data = imgData.data;

  for (let i = 0; i < mask.length; i++) {
    const px = i * 4;
    const maskVal = mask[i];
    if (maskVal > 0) {
      data[px] = overlayRGB[0];
      data[px + 1] = overlayRGB[1];
      data[px + 2] = overlayRGB[2];
      data[px + 3] = Math.round((maskVal / 255) * opacity * 255);
    } else {
      data[px + 3] = 0;
    }
  }

  return imgData;
}

export function dilate(mask: Uint8Array, radius: number, width: number, height: number): Uint8Array {
  const result = new Uint8Array(mask.length);
  const r = Math.max(1, Math.round(radius));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = 0;
      for (let dy = -r; dy <= r; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          if (dx * dx + dy * dy <= r * r) {
            const val = mask[ny * width + nx];
            if (val > maxVal) maxVal = val;
            if (maxVal === 255) break;
          }
        }
        if (maxVal === 255) break;
      }
      result[y * width + x] = maxVal;
    }
  }

  return result;
}

export function erode(mask: Uint8Array, radius: number, width: number, height: number): Uint8Array {
  const result = new Uint8Array(mask.length);
  const r = Math.max(1, Math.round(radius));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minVal = 255;
      for (let dy = -r; dy <= r; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          if (dx * dx + dy * dy <= r * r) {
            const val = mask[ny * width + nx];
            if (val < minVal) minVal = val;
            if (minVal === 0) break;
          }
        }
        if (minVal === 0) break;
      }
      result[y * width + x] = minVal;
    }
  }

  return result;
}

export function smoothMaskEdges(mask: Uint8Array, width: number, height: number): Uint8Array {
  const result = new Uint8Array(mask.length);
  // 3x3 box blur for fast smoothing
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      sum += mask[(y - 1) * width + (x - 1)];
      sum += mask[(y - 1) * width + x] * 2;
      sum += mask[(y - 1) * width + (x + 1)];
      sum += mask[y * width + (x - 1)] * 2;
      sum += mask[y * width + x] * 4;
      sum += mask[y * width + (x + 1)] * 2;
      sum += mask[(y + 1) * width + (x - 1)];
      sum += mask[(y + 1) * width + x] * 2;
      sum += mask[(y + 1) * width + (x + 1)];
      result[y * width + x] = Math.round(sum / 16);
    }
  }
  return result;
}
