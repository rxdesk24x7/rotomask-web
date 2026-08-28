import React, { useRef, useEffect } from "react";
import { LayerStack } from "./LayerStack";
import { VideoSource } from "../../types";

interface CompositePreviewProps {
  compositeImageData: ImageData | null;
  videoSource: VideoSource | null;
}

export const CompositePreview: React.FC<CompositePreviewProps> = ({
  compositeImageData,
  videoSource
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const width = videoSource?.width || 640;
  const height = videoSource?.height || 360;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !compositeImageData) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(compositeImageData, 0, 0);
  }, [compositeImageData]);

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary overflow-hidden border-l border-border select-none">
      {/* Title Bar */}
      <div className="bg-bg-secondary border-b border-border px-4 py-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-white flex items-center gap-1.5">
          Final Rotoscope Composite
        </span>
        <div className="flex items-center space-x-2 text-text-muted font-mono text-[11px]">
          <span>Order: BG → Effect → Human</span>
        </div>
      </div>

      {/* Main Composite Canvas */}
      <div className="flex-1 relative flex items-center justify-center p-4 checkerboard-bg overflow-hidden">
        <div
          className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden border border-border/80 bg-black/50"
          style={{
            aspectRatio: `${width} / ${height}`,
            maxWidth: "100%",
            maxHeight: "100%"
          }}
        >
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-full block"
          />
        </div>
      </div>

      {/* Layer Stack Control Panel */}
      <LayerStack />
    </div>
  );
};
