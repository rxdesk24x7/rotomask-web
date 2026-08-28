import { useEffect, useRef, useState, useCallback } from "react";
import { useVideoStore } from "../store/videoStore";
import { createOffscreenCanvas } from "../utils/canvas.utils";
import { waitForVideoSeek } from "../utils/video.utils";

export function useVideoFrames() {
  const videoSource = useVideoStore((s) => s.videoSource);
  const currentFrameIndex = useVideoStore((s) => s.currentFrameIndex);
  const isPlaying = useVideoStore((s) => s.isPlaying);
  const nextFrame = useVideoStore((s) => s.nextFrame);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentFrameImageData, setCurrentFrameImageData] = useState<ImageData | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize hidden video element
  useEffect(() => {
    if (!videoSource) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current = null;
      }
      setIsVideoReady(false);
      setCurrentFrameImageData(null);
      return;
    }

    const video = document.createElement("video");
    video.src = videoSource.url;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    videoRef.current = video;

    const canvas = createOffscreenCanvas(videoSource.width, videoSource.height);
    canvasRef.current = canvas;

    const onMetadata = () => {
      setIsVideoReady(true);
      // Extract initial frame
      extractFrameAt(0);
    };

    video.addEventListener("loadedmetadata", onMetadata);

    return () => {
      video.removeEventListener("loadedmetadata", onMetadata);
      video.pause();
      video.src = "";
    };
  }, [videoSource]);

  const extractFrameAt = useCallback(async (frameIndex: number): Promise<ImageData | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !videoSource) return null;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const targetTime = frameIndex / videoSource.fps;
    if (Math.abs(video.currentTime - targetTime) > 0.001) {
      video.currentTime = targetTime;
      await waitForVideoSeek(video);
    }

    ctx.drawImage(video, 0, 0, videoSource.width, videoSource.height);
    const imgData = ctx.getImageData(0, 0, videoSource.width, videoSource.height);
    setCurrentFrameImageData(imgData);
    return imgData;
  }, [videoSource]);

  // Seek and update on frame change
  useEffect(() => {
    if (!isVideoReady || !videoSource) return;
    extractFrameAt(currentFrameIndex);
  }, [currentFrameIndex, isVideoReady, videoSource, extractFrameAt]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || !videoSource) return;

    const interval = setInterval(() => {
      nextFrame();
    }, 1000 / videoSource.fps);

    return () => clearInterval(interval);
  }, [isPlaying, videoSource, nextFrame]);

  return {
    videoElement: videoRef.current,
    currentFrameImageData,
    isVideoReady,
    extractFrameAt
  };
}
