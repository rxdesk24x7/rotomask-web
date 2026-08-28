import { hexToRgb } from "../utils/mask.utils";

class CompositorService {
  compositeFrame(
    backgroundImageData: ImageData | null,
    effectImageData: ImageData | null,
    humanImageData: ImageData,
    alphaMatte: Uint8Array | null,
    width: number,
    height: number,
    backgroundColor: string = "#111827",
    showBackground: boolean = true,
    showEffectLayer: boolean = true,
    showHuman: boolean = true,
    effectOpacity: number = 1.0
  ): ImageData {
    const output = new ImageData(width, height);
    const out = output.data;
    const human = humanImageData.data;
    const bgRGB = hexToRgb(backgroundColor);

    for (let i = 0; i < width * height; i++) {
      const px = i * 4;
      const alpha = (showHuman && alphaMatte) ? alphaMatte[i] / 255 : (showHuman ? 1.0 : 0.0);
      const invAlpha = 1.0 - alpha;

      // 1. Base Layer (Background)
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 255;

      if (showBackground) {
        if (backgroundImageData) {
          r = backgroundImageData.data[px];
          g = backgroundImageData.data[px + 1];
          b = backgroundImageData.data[px + 2];
        } else if (backgroundColor === "transparent") {
          a = 0;
        } else {
          r = bgRGB[0];
          g = bgRGB[1];
          b = bgRGB[2];
        }
      } else {
        a = 0;
      }

      // 2. Middle Layer (Effect Layer)
      if (showEffectLayer && effectImageData) {
        const effAlpha = (effectImageData.data[px + 3] / 255) * effectOpacity;
        if (effAlpha > 0) {
          const invEff = 1.0 - effAlpha;
          r = effectImageData.data[px] * effAlpha + r * invEff;
          g = effectImageData.data[px + 1] * effAlpha + g * invEff;
          b = effectImageData.data[px + 2] * effAlpha + b * invEff;
          a = Math.max(a, Math.round(effAlpha * 255));
        }
      }

      // 3. Top Layer (Masked Human Subject)
      if (showHuman) {
        out[px]     = Math.round(human[px] * alpha + r * invAlpha);
        out[px + 1] = Math.round(human[px + 1] * alpha + g * invAlpha);
        out[px + 2] = Math.round(human[px + 2] * alpha + b * invAlpha);
        out[px + 3] = Math.max(a, Math.round(alpha * 255));
      } else {
        out[px]     = Math.round(r);
        out[px + 1] = Math.round(g);
        out[px + 2] = Math.round(b);
        out[px + 3] = a;
      }
    }

    return output;
  }

  generateMaskPreview(
    videoFrameData: ImageData,
    alphaMatte: Uint8Array | null,
    overlayColorHex: string,
    overlayOpacity: number,
    mode: "overlay" | "cutout" | "composite",
    width: number,
    height: number
  ): ImageData {
    const output = new ImageData(width, height);
    const out = output.data;
    const src = videoFrameData.data;
    const color = hexToRgb(overlayColorHex);

    for (let i = 0; i < width * height; i++) {
      const px = i * 4;
      const maskVal = alphaMatte ? alphaMatte[i] : 0;
      const maskNorm = maskVal / 255;

      if (mode === "overlay") {
        if (maskVal > 0) {
          const effectiveOp = overlayOpacity * maskNorm;
          const invOp = 1 - effectiveOp;
          out[px]     = Math.round(color[0] * effectiveOp + src[px] * invOp);
          out[px + 1] = Math.round(color[1] * effectiveOp + src[px + 1] * invOp);
          out[px + 2] = Math.round(color[2] * effectiveOp + src[px + 2] * invOp);
        } else {
          out[px]     = src[px];
          out[px + 1] = src[px + 1];
          out[px + 2] = src[px + 2];
        }
        out[px + 3] = 255;
      } else if (mode === "cutout") {
        out[px]     = src[px];
        out[px + 1] = src[px + 1];
        out[px + 2] = src[px + 2];
        out[px + 3] = maskVal;
      } else {
        out[px]     = src[px];
        out[px + 1] = src[px + 1];
        out[px + 2] = src[px + 2];
        out[px + 3] = 255;
      }
    }

    return output;
  }
}

export const compositorService = new CompositorService();
