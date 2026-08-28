import { AlphaMatte, EffectLayer, VideoSource, EditorConfig } from "../types";
import { compositorService } from "./compositor.service";
import { createOffscreenCanvas } from "../utils/canvas.utils";
import { waitForVideoSeek } from "../utils/video.utils";
import { generateProceduralEffect } from "../utils/sampleMedia.utils";

class ExportService {
  async exportCompositeVideo(
    videoSource: VideoSource,
    mattes: Map<number, AlphaMatte>,
    effectLayer: EffectLayer | null,
    config: EditorConfig,
    onProgress: (pct: number) => void
  ): Promise<Blob> {
    const width = videoSource.width;
    const height = videoSource.height;
    const fps = videoSource.fps;
    const totalFrames = videoSource.totalFrames;

    const canvas = createOffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

    const stream = canvas.captureStream(fps);
    let mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm";
    }

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000
    });

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise(async (resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };

      recorder.onerror = (err) => reject(err);

      recorder.start();

      const video = document.createElement("video");
      video.src = videoSource.url;
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;

      await new Promise((res) => {
        video.addEventListener("loadedmetadata", res, { once: true });
      });

      const frameCanvas = createOffscreenCanvas(width, height);
      const frameCtx = frameCanvas.getContext("2d", { willReadFrequently: true })!;

      for (let i = 0; i < totalFrames; i++) {
        video.currentTime = i / fps;
        await waitForVideoSeek(video);

        frameCtx.drawImage(video, 0, 0, width, height);
        const humanImageData = frameCtx.getImageData(0, 0, width, height);

        const matte = mattes.get(i);
        const alphaData = matte ? matte.data : new Uint8Array(width * height).fill(255);

        let effectImageData: ImageData | null = null;
        if (effectLayer && config.showEffectLayer) {
          if (effectLayer.type === "canvas-generated" && effectLayer.presetType) {
            effectImageData = generateProceduralEffect(
              effectLayer.presetType,
              width,
              height,
              i,
              totalFrames,
              effectLayer.color || "#7c6aff"
            );
          } else if (effectLayer.frames && effectLayer.frames.has(i)) {
            effectImageData = effectLayer.frames.get(i)?.imageData || null;
          }
        }

        const composited = compositorService.compositeFrame(
          null,
          effectImageData,
          humanImageData,
          alphaData,
          width,
          height,
          config.backgroundColor,
          config.showBackground,
          config.showEffectLayer,
          config.showOriginalVideo,
          effectLayer?.opacity ?? 1.0
        );

        ctx.putImageData(composited, 0, 0);

        onProgress(Math.round(((i + 1) / totalFrames) * 100));
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }

      recorder.stop();
    });
  }

  async exportAlphaMatteImage(matte: AlphaMatte): Promise<Blob> {
    const canvas = createOffscreenCanvas(matte.width, matte.height);
    const ctx = canvas.getContext("2d")!;
    const imgData = ctx.createImageData(matte.width, matte.height);
    const d = imgData.data;

    for (let i = 0; i < matte.data.length; i++) {
      const px = i * 4;
      const val = matte.data[i];
      d[px] = val;     // Grayscale: 255 = White (Subject)
      d[px + 1] = val;
      d[px + 2] = val;
      d[px + 3] = 255; // Fully opaque PNG
    }

    ctx.putImageData(imgData, 0, 0);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob || new Blob()), "image/png");
    });
  }
}

export const exportService = new ExportService();
