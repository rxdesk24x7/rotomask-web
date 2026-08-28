import React, { useRef } from "react";
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  SkipBack, 
  SkipForward,
  Sparkles
} from "lucide-react";
import { TimelineProps } from "./Timeline.types";
import { FrameStrip } from "./FrameStrip";
import { useVideoStore } from "../../store/videoStore";
import { formatTimecode } from "../../utils/video.utils";

export const Timeline: React.FC<TimelineProps> = ({
  onAutoMaskAll,
  isGeneratingAll
}) => {
  const videoSource = useVideoStore((s) => s.videoSource);
  const currentFrameIndex = useVideoStore((s) => s.currentFrameIndex);
  const isPlaying = useVideoStore((s) => s.isPlaying);
  const setCurrentFrame = useVideoStore((s) => s.setCurrentFrame);
  const setPlaying = useVideoStore((s) => s.setPlaying);
  const nextFrame = useVideoStore((s) => s.nextFrame);
  const prevFrame = useVideoStore((s) => s.prevFrame);
  const jumpFrames = useVideoStore((s) => s.jumpFrames);

  const scrubberRef = useRef<HTMLDivElement | null>(null);

  const totalFrames = videoSource?.totalFrames || 1;
  const fps = videoSource?.fps || 30;
  const currentTime = currentFrameIndex / fps;
  const totalDuration = videoSource?.duration || 1;

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || !videoSource) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetFrame = Math.round(ratio * (totalFrames - 1));
    setCurrentFrame(targetFrame);
  };

  const handleScrubberDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 1) {
      handleScrubberClick(e);
    }
  };

  return (
    <div className="h-28 bg-bg-secondary border-t border-border flex flex-col justify-between select-none z-10">
      {/* Top Scrubber Track */}
      <div
        ref={scrubberRef}
        onMouseDown={handleScrubberClick}
        onMouseMove={handleScrubberDrag}
        className="relative w-full h-3 bg-bg-tertiary cursor-pointer group transition-all hover:h-4"
      >
        {/* Progress Fill */}
        <div
          className="h-full bg-accent/70 relative"
          style={{ width: `${(currentFrameIndex / (totalFrames - 1 || 1)) * 100}%` }}
        >
          {/* Thumb marker */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg ring-2 ring-accent scale-75 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* Frame Thumbnail Indicators Strip */}
      <FrameStrip />

      {/* Bottom Transport Controls Bar */}
      <div className="h-11 px-4 flex items-center justify-between border-t border-border/40 text-xs">
        {/* Left: Timecode & Frame Indicator */}
        <div className="flex items-center space-x-3">
          <div className="font-mono text-sm font-semibold tracking-wider text-white bg-bg-tertiary px-2.5 py-1 rounded-md border border-border/60">
            {formatTimecode(currentTime, fps)}
          </div>
          <div className="text-text-muted font-mono text-xs">
            Frame <span className="text-text-primary font-semibold">{currentFrameIndex + 1}</span> / {totalFrames}
          </div>
        </div>

        {/* Center: Playback Transport Buttons */}
        <div className="flex items-center space-x-1">
          {/* Jump to start */}
          <button
            onClick={() => setCurrentFrame(0)}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-muted hover:text-white transition-colors"
            title="Jump to Start"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Jump 10 frames back */}
          <button
            onClick={() => jumpFrames(-10)}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-muted hover:text-white transition-colors"
            title="Back 10 Frames (Shift+←)"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Frame */}
          <button
            onClick={prevFrame}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-muted hover:text-white transition-colors"
            title="Previous Frame (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setPlaying(!isPlaying)}
            className="w-9 h-9 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center shadow-lg shadow-accent/25 transition-transform active:scale-95"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          {/* Next Frame */}
          <button
            onClick={nextFrame}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-muted hover:text-white transition-colors"
            title="Next Frame (→)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Jump 10 frames forward */}
          <button
            onClick={() => jumpFrames(10)}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-muted hover:text-white transition-colors"
            title="Forward 10 Frames (Shift+→)"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>

          {/* Jump to end */}
          <button
            onClick={() => setCurrentFrame(totalFrames - 1)}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-muted hover:text-white transition-colors"
            title="Jump to End"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Auto-mask All fast button */}
        <div className="flex items-center space-x-2">
          {videoSource && (
            <button
              onClick={onAutoMaskAll}
              disabled={isGeneratingAll}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-bg-tertiary hover:bg-bg-elevated border border-border text-text-primary text-xs font-medium transition-colors disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>{isGeneratingAll ? "Processing All..." : "Auto-Mask All"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
