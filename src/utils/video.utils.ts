import { VideoSource } from "../types";

export function createVideoElement(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = src;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const onLoaded = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
      resolve(video);
    };

    const onError = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
      reject(new Error("Failed to load video element"));
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("error", onError);
  });
}

export async function extractVideoMetadata(file: File): Promise<VideoSource> {
  const url = URL.createObjectURL(file);
  const video = await createVideoElement(url);

  const duration = video.duration || 1;
  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;
  const fps = 30; // standard default, or estimated
  const totalFrames = Math.max(1, Math.floor(duration * fps));

  return {
    file,
    url,
    name: file.name,
    duration,
    fps,
    width,
    height,
    totalFrames
  };
}

export function videoTimeToFrameIndex(time: number, fps: number): number {
  return Math.max(0, Math.floor(time * fps));
}

export function frameIndexToVideoTime(frameIndex: number, fps: number): number {
  return frameIndex / fps;
}

export function formatTimecode(seconds: number, fps: number = 30): string {
  const validSec = Math.max(0, isNaN(seconds) ? 0 : seconds);
  const hrs = Math.floor(validSec / 3600);
  const mins = Math.floor((validSec % 3600) / 60);
  const secs = Math.floor(validSec % 60);
  const frames = Math.floor((validSec % 1) * fps);

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
}

export function waitForVideoSeek(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    if (video.seeking) {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        resolve();
      };
      video.addEventListener("seeked", onSeeked);
    } else {
      resolve();
    }
  });
}
