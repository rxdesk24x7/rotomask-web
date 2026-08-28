import { useRef, useCallback, useEffect } from "react";
import { useEditorStore } from "../store/editorStore";
import { useMaskStore } from "../store/maskStore";
import { useVideoStore } from "../store/videoStore";
import { MaskStroke, MaskStrokePoint } from "../types";
import { paintBrushStroke, paintStrokeLine } from "../utils/canvas.utils";
import { maskToImageData, hexToRgb } from "../utils/mask.utils";

export function useCanvasEditor() {
  const config = useEditorStore((s) => s.config);
  const setDrawing = useEditorStore((s) => s.setDrawing);
  const setCursorPos = useEditorStore((s) => s.setCursorPos);

  const videoSource = useVideoStore((s) => s.videoSource);
  const currentFrameIndex = useVideoStore((s) => s.currentFrameIndex);

  const mattes = useMaskStore((s) => s.mattes);
  const addStroke = useMaskStore((s) => s.addStroke);

  const brushCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStrokeRef = useRef<MaskStroke | null>(null);
  const isPointerDownRef = useRef(false);

  const currentMatte = mattes.get(currentFrameIndex);

  // Render mask overlay onto maskCanvas
  const renderMaskOverlay = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas || !videoSource) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!config.showMask || !currentMatte) return;

    const rgb = hexToRgb(config.maskOverlayColor);
    const imgData = maskToImageData(
      currentMatte.data,
      currentMatte.width,
      currentMatte.height,
      rgb,
      config.maskOverlayOpacity
    );
    ctx.putImageData(imgData, 0, 0);
  }, [config.showMask, config.maskOverlayColor, config.maskOverlayOpacity, currentMatte, videoSource]);

  useEffect(() => {
    renderMaskOverlay();
  }, [renderMaskOverlay]);

  // Pointer event handlers
  const getNormalizedCoords = (e: React.PointerEvent<HTMLCanvasElement>): MaskStrokePoint | null => {
    const canvas = brushCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!videoSource) return;
    const pt = getNormalizedCoords(e);
    if (!pt) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;
    setDrawing(true);

    const strokeId = `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newStroke: MaskStroke = {
      id: strokeId,
      frameIndex: currentFrameIndex,
      type: config.brushMode,
      brushSize: config.brushSize,
      brushOpacity: config.brushOpacity,
      brushFeather: config.brushFeather,
      points: [pt]
    };
    currentStrokeRef.current = newStroke;

    // Draw initial dab on brush canvas
    const canvas = brushCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const rgb = config.brushMode === "add" ? [34, 197, 94] : [239, 68, 68];
        ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${config.brushOpacity})`;
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, config.brushSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = brushCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setCursorPos({
      x: e.clientX,
      y: e.clientY,
      visible: true
    });

    if (!isPointerDownRef.current || !currentStrokeRef.current) return;

    const pt = getNormalizedCoords(e);
    if (!pt) return;

    const pts = currentStrokeRef.current.points;
    const lastPt = pts[pts.length - 1];
    pts.push(pt);

    // Render live stroke line onto brush canvas
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const color = config.brushMode === "add" ? "rgba(34, 197, 94, 0.7)" : "rgba(239, 68, 68, 0.7)";
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = config.brushSize * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(lastPt.x * canvas.width, lastPt.y * canvas.height);
      ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      ctx.stroke();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setDrawing(false);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }

    // Clear temporary brush canvas
    const canvas = brushCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      addStroke(currentStrokeRef.current);
      currentStrokeRef.current = null;
    }
  };

  const handlePointerLeave = () => {
    setCursorPos({ x: 0, y: 0, visible: false });
  };

  return {
    brushCanvasRef,
    maskCanvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    renderMaskOverlay
  };
}
