import { create } from "zustand";
import { VideoSource, ProcessingStatus } from "../types";

interface VideoStore {
  videoSource: VideoSource | null;
  currentFrameIndex: number;
  isPlaying: boolean;
  processingStatus: ProcessingStatus;
  processingProgress: number; // 0-100
  statusMessage: string;

  setVideoSource: (source: VideoSource | null) => void;
  setCurrentFrame: (index: number) => void;
  nextFrame: () => void;
  prevFrame: () => void;
  jumpFrames: (delta: number) => void;
  setPlaying: (playing: boolean) => void;
  setProcessingStatus: (status: ProcessingStatus, progress?: number, message?: string) => void;
  reset: () => void;
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  videoSource: null,
  currentFrameIndex: 0,
  isPlaying: false,
  processingStatus: "idle",
  processingProgress: 0,
  statusMessage: "",

  setVideoSource: (source) => {
    set({
      videoSource: source,
      currentFrameIndex: 0,
      isPlaying: false,
      processingStatus: "idle",
      processingProgress: 0,
      statusMessage: source ? `Loaded: ${source.name}` : ""
    });
  },

  setCurrentFrame: (index) => {
    const { videoSource } = get();
    if (!videoSource) {
      set({ currentFrameIndex: 0 });
      return;
    }
    const clamped = Math.max(0, Math.min(videoSource.totalFrames - 1, Math.round(index)));
    set({ currentFrameIndex: clamped });
  },

  nextFrame: () => {
    const { currentFrameIndex, videoSource } = get();
    if (!videoSource) return;
    if (currentFrameIndex < videoSource.totalFrames - 1) {
      set({ currentFrameIndex: currentFrameIndex + 1 });
    }
  },

  prevFrame: () => {
    const { currentFrameIndex } = get();
    if (currentFrameIndex > 0) {
      set({ currentFrameIndex: currentFrameIndex - 1 });
    }
  },

  jumpFrames: (delta) => {
    const { currentFrameIndex, videoSource } = get();
    if (!videoSource) return;
    const target = Math.max(0, Math.min(videoSource.totalFrames - 1, currentFrameIndex + delta));
    set({ currentFrameIndex: target });
  },

  setPlaying: (playing) => set({ isPlaying: playing }),

  setProcessingStatus: (status, progress, message) => {
    set((state) => ({
      processingStatus: status,
      processingProgress: progress !== undefined ? progress : state.processingProgress,
      statusMessage: message !== undefined ? message : state.statusMessage
    }));
  },

  reset: () => {
    set({
      videoSource: null,
      currentFrameIndex: 0,
      isPlaying: false,
      processingStatus: "idle",
      processingProgress: 0,
      statusMessage: ""
    });
  }
}));
