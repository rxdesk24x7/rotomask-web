import { useState, useEffect, useMemo } from "react";
import { useVideoStore } from "../store/videoStore";
import { useMaskStore } from "../store/maskStore";
import { useEditorStore } from "../store/editorStore";
import { compositorService } from "../services/compositor.service";
import { generateProceduralEffect } from "../utils/sampleMedia.utils";

export function useCompositor(currentFrameImageData: ImageData | null) {
  const videoSource = useVideoStore((s) => s.videoSource);
  const currentFrameIndex = useVideoStore((s) => s.currentFrameIndex);
  const mattes = useMaskStore((s) => s.mattes);
  const config = useEditorStore((s) => s.config);
  const effectLayer = useEditorStore((s) => s.effectLayer);

  const [compositeImageData, setCompositeImageData] = useState<ImageData | null>(null);

  const currentMatte = mattes.get(currentFrameIndex);

  useEffect(() => {
    if (!videoSource || !currentFrameImageData) {
      setCompositeImageData(null);
      return;
    }

    const { width, height } = videoSource;
    const alphaData = currentMatte ? currentMatte.data : null;

    // Generate or get effect layer frame
    let effectImageData: ImageData | null = null;
    if (effectLayer && config.showEffectLayer) {
      if (effectLayer.type === "canvas-generated" && effectLayer.presetType) {
        effectImageData = generateProceduralEffect(
          effectLayer.presetType,
          width,
          height,
          currentFrameIndex,
          videoSource.totalFrames,
          effectLayer.color || "#7c6aff"
        );
      } else if (effectLayer.frames && effectLayer.frames.has(currentFrameIndex)) {
        effectImageData = effectLayer.frames.get(currentFrameIndex)?.imageData || null;
      }
    }

    const composited = compositorService.compositeFrame(
      null,
      effectImageData,
      currentFrameImageData,
      alphaData,
      width,
      height,
      config.backgroundColor,
      config.showBackground,
      config.showEffectLayer,
      config.showOriginalVideo,
      effectLayer?.opacity ?? 1.0
    );

    setCompositeImageData(composited);
  }, [
    videoSource,
    currentFrameImageData,
    currentFrameIndex,
    currentMatte,
    config.backgroundColor,
    config.showBackground,
    config.showEffectLayer,
    config.showOriginalVideo,
    effectLayer
  ]);

  return {
    compositeImageData
  };
}
