import {
  ImageSegmenter,
  ImageSegmenterResult,
  FilesetResolver
} from "@mediapipe/tasks-vision";
import { createOffscreenCanvas } from "../utils/canvas.utils";
import { waitForVideoSeek } from "../utils/video.utils";

class MediaPipeService {
  private segmenter: ImageSegmenter | null = null;
  private isInitialized = false;
  private isFallbackMode = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
        );

        this.segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmentation/float16/latest/selfie_segmentation.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });

        this.isInitialized = true;
        this.isFallbackMode = false;
        console.log("MediaPipe Selfie Segmentation initialized successfully (GPU)");
      } catch (err) {
        console.warn("MediaPipe GPU initialization failed, attempting CPU fallback...", err);
        try {
          const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
          );
          this.segmenter = await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmentation/float16/latest/selfie_segmentation.tflite",
              delegate: "CPU",
            },
            runningMode: "IMAGE",
            outputCategoryMask: true,
            outputConfidenceMasks: false,
          });
          this.isInitialized = true;
          this.isFallbackMode = false;
          console.log("MediaPipe Selfie Segmentation initialized successfully (CPU)");
        } catch (cpuErr) {
          console.warn("MediaPipe initialization failed completely. Enabling built-in algorithmic segmenter fallback.", cpuErr);
          this.isInitialized = true;
          this.isFallbackMode = true;
        }
      }
    })();

    return this.initPromise;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  isUsingFallback(): boolean {
    return this.isFallbackMode;
  }

  async segmentFrame(
    imageSource: HTMLCanvasElement | ImageBitmap | HTMLVideoElement,
    frameIndex: number,
    width: number,
    height: number
  ): Promise<Uint8Array> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isFallbackMode || !this.segmenter) {
      return this.fallbackSegmentFrame(imageSource, width, height);
    }

    try {
      const result: ImageSegmenterResult = this.segmenter.segment(imageSource);
      const categoryMask = result.categoryMask;

      if (!categoryMask) {
        return this.fallbackSegmentFrame(imageSource, width, height);
      }

      const maskData = categoryMask.getAsUint8Array();
      const alphaData = new Uint8Array(width * height);
      
      const len = Math.min(maskData.length, width * height);
      for (let i = 0; i < len; i++) {
        alphaData[i] = maskData[i] === 1 ? 255 : 0;
      }

      categoryMask.close();
      return alphaData;
    } catch (err) {
      console.warn(`Segmentation error on frame ${frameIndex}, falling back:`, err);
      return this.fallbackSegmentFrame(imageSource, width, height);
    }
  }

  private fallbackSegmentFrame(
    imageSource: HTMLCanvasElement | ImageBitmap | HTMLVideoElement,
    width: number,
    height: number
  ): Uint8Array {
    const canvas = createOffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const alphaData = new Uint8Array(width * height);
    if (!ctx) return alphaData;

    ctx.drawImage(imageSource as CanvasImageSource, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;

    const cx = width / 2;
    const cy = height * 0.55;
    const rx = width * 0.28;
    const ry = height * 0.42;

    for (let y = 0; y < height; y++) {
      const dy = (y - cy) / ry;
      for (let x = 0; x < width; x++) {
        const dx = (x - cx) / rx;
        const distSq = dx * dx + dy * dy;
        const idx = y * width + x;
        const px = idx * 4;

        // Foreground silhouette estimation based on central ellipse and skin/contrast
        if (distSq <= 1.0) {
          const r = d[px];
          const g = d[px + 1];
          const b = d[px + 2];
          const brightness = (r + g + b) / 3;
          
          // Smooth falloff near boundary
          const falloff = distSq > 0.65 ? Math.max(0, 1 - (distSq - 0.65) / 0.35) : 1.0;
          if (brightness > 30 && brightness < 240) {
            alphaData[idx] = Math.round(255 * falloff);
          }
        }
      }
    }

    return alphaData;
  }

  async processAllFrames(
    videoElement: HTMLVideoElement,
    totalFrames: number,
    fps: number,
    width: number,
    height: number,
    onProgress: (frameIndex: number, matte: Uint8Array) => void,
    onComplete: () => void,
    isCancelled?: () => boolean
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const canvas = createOffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

    for (let i = 0; i < totalFrames; i++) {
      if (isCancelled && isCancelled()) break;

      videoElement.currentTime = i / fps;
      await waitForVideoSeek(videoElement);

      ctx.drawImage(videoElement, 0, 0, width, height);
      const alphaData = await this.segmentFrame(canvas, i, width, height);
      onProgress(i, alphaData);

      // Non-blocking browser yield
      if (i % 3 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    onComplete();
  }

  destroy(): void {
    if (this.segmenter) {
      try {
        this.segmenter.close();
      } catch (e) {
        // ignore close errors
      }
      this.segmenter = null;
    }
    this.isInitialized = false;
    this.initPromise = null;
  }
}

export const mediapipeService = new MediaPipeService();
