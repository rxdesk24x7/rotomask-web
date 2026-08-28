import React, { useRef, useEffect } from "react";
import { useVideoStore } from "../../store/videoStore";
import { useMaskStore } from "../../store/maskStore";

export const FrameStrip: React.FC = () => {
  const videoSource = useVideoStore((s) => s.videoSource);
  const currentFrameIndex = useVideoStore((s) => s.currentFrameIndex);
  const setCurrentFrame = useVideoStore((s) => s.setCurrentFrame);
  const mattes = useMaskStore((s) => s.mattes);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);

  const totalFrames = videoSource?.totalFrames || 0;

  // Auto-scroll active frame into view
  useEffect(() => {
    if (activeThumbRef.current && containerRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
    }
  }, [currentFrameIndex]);

  if (!videoSource || totalFrames === 0) return null;

  // For long videos (> 300 frames), step down to show every Nth frame indicator for speed
  const step = totalFrames > 300 ? Math.ceil(totalFrames / 150) : 1;
  const frameIndices: number[] = [];
  for (let i = 0; i < totalFrames; i += step) {
    frameIndices.push(i);
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center space-x-1 overflow-x-auto py-1 px-3 no-scrollbar select-none h-14 bg-bg-primary/60 border-t border-border/40"
    >
      {frameIndices.map((fIdx) => {
        const matte = mattes.get(fIdx);
        const isSelected = fIdx === currentFrameIndex;
        const hasEdits = matte?.hasManualEdits;
        const isMasked = matte !== undefined;

        let statusColor = "bg-border/60"; // no mask
        let statusTitle = "Unmasked";
        if (hasEdits) {
          statusColor = "bg-warning";
          statusTitle = "Manual Edits";
        } else if (isMasked) {
          statusColor = "bg-success";
          statusTitle = "Auto Masked";
        }

        return (
          <button
            key={fIdx}
            ref={isSelected ? activeThumbRef : null}
            onClick={() => setCurrentFrame(fIdx)}
            title={`Frame ${fIdx + 1} - ${statusTitle}`}
            className={`group relative flex flex-col items-center justify-between min-w-[36px] h-10 px-1 py-1 rounded transition-all shrink-0 ${
              isSelected
                ? "bg-accent/20 border border-accent ring-1 ring-accent text-white scale-105"
                : "bg-bg-tertiary/80 hover:bg-bg-elevated border border-border/50 text-text-muted hover:text-text-primary"
            }`}
          >
            {/* Frame number */}
            <span className="text-[10px] font-mono leading-none font-medium">
              {fIdx + 1}
            </span>

            {/* Status dot */}
            <div className="flex items-center space-x-0.5">
              <span className={`w-2 h-2 rounded-full ${statusColor} transition-transform group-hover:scale-125`} />
            </div>
          </button>
        );
      })}
    </div>
  );
};
