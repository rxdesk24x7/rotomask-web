import React, { useRef, useEffect } from "react";
import { AlphaMatte, EditorConfig, VideoSource } from "../../types";
import { useCanvasEditor } from "../../hooks/useCanvasEditor";
import { useEditorStore } from "../../store/editorStore";
import { compositorService } from "../../services/compositor.service";

interface MaskEditorCanvasProps {
  currentFrameImageData: ImageData | null;
  alphaMatte: AlphaMatte | undefined;
  videoSource: VideoSource | null;
}

export const MaskEditorCanvas: React.FC<MaskEditorCanvasProps> = ({
  currentFrameImageData,
  alphaMatte,
  videoSource
}) => {
  const config = useEditorStore((s) => s.config);
  const cursorPos = useEditorStore((s) => s.cursorPos);

  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    brushCanvasRef,
    maskCanvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    renderMaskOverlay
  } = useCanvasEditor();

  const width = videoSource?.width || 640;
  const height = videoSource?.height || 360;

  // Render video frame on Layer 1 (bottom)
  useEffect(() => {
    const canvas = videoCanvasRef.current;
    if (!canvas || !currentFrameImageData) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (config.maskPreviewMode === "cutout") {
      const cutout = compositorService.generateMaskPreview(
        currentFrameImageData,
        alphaMatte?.data || null,
        config.maskOverlayColor,
        config.maskOverlayOpacity,
        "cutout",
        width,
        height
      );
      ctx.putImageData(cutout, 0, 0);
    } else {
      ctx.putImageData(currentFrameImageData, 0, 0);
    }
  }, [currentFrameImageData, alphaMatte, config.maskPreviewMode, config.maskOverlayColor, config.maskOverlayOpacity, width, height]);

  // Trigger mask overlay render on Layer 2 (middle)
  useEffect(() => {
    renderMaskOverlay();
  }, [renderMaskOverlay, alphaMatte, config.maskPreviewMode]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center p-4 checkerboard-bg overflow-hidden select-none"
    >
      {/* 3-Layer Canvas Stack inside Aspect Ratio Container */}
      <div 
        className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden border border-border/80 bg-black/40"
        style={{
          aspectRatio: `${width} / ${height}`,
          width: "auto",
          height: "auto",
          maxWidth: "100%",
          maxHeight: "100%"
        }}
      >
        {/* Layer 1: Video Frame Canvas */}
        <canvas
          ref={videoCanvasRef}
          width={width}
          height={height}
          className="w-full h-full block"
        />

        {/* Layer 2: Mask Overlay Canvas (semi-transparent color) */}
        {config.maskPreviewMode === "overlay" && (
          <canvas
            ref={maskCanvasRef}
            width={width}
            height={height}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        )}

        {/* Layer 3: Interactive Brush Canvas (top) */}
        <canvas
          ref={brushCanvasRef}
          width={width}
          height={height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          className="absolute inset-0 w-full h-full cursor-none touch-none"
        />

        {/* Dynamic Circular Brush Cursor */}
        {cursorPos.visible && (
          <div
            className="fixed pointer-events-none rounded-full -translate-x-1/2 -translate-y-1/2 z-40 transition-none"
            style={{
              left: cursorPos.x,
              top: cursorPos.y,
              width: `${config.brushSize * 2}px`,
              height: `${config.brushSize * 2}px`,
              border: `2px solid ${config.brushMode === "add" ? "#22c55e" : "#ef4444"}`,
              backgroundColor: `${config.brushMode === "add" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
              boxShadow: "0 0 8px rgba(0,0,0,0.5)"
            }}
          >
            <div className="absolute inset-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full" />
          </div>
        )}
      </div>

      {/* Bottom overlay status */}
      <div className="absolute bottom-6 left-6 flex items-center space-x-2 bg-bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border text-xs text-text-muted">
        <span>Coverage:</span>
        <span className="font-mono text-accent font-semibold">
          {alphaMatte?.coverage ?? 0}%
        </span>
        {alphaMatte?.hasManualEdits && (
          <span className="px-1.5 py-0.5 rounded bg-warning/20 text-warning text-[10px] font-medium">
            Edited
          </span>
        )}
      </div>
    </div>
  );
};
