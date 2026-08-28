import React from "react";
import { 
  Plus, 
  Minus, 
  Sparkles, 
  RotateCcw, 
  Trash2, 
  Undo2, 
  Redo2, 
  Eye, 
  Scissors, 
  Layers, 
  Feather,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { useMaskStore } from "../../store/maskStore";
import { useVideoStore } from "../../store/videoStore";
import { dilate, erode, smoothMaskEdges, getMaskCoverage } from "../../utils/mask.utils";
import { AlphaMatte } from "../../types";

interface BrushToolbarProps {
  onAutoMaskFrame: () => void;
  isGenerating: boolean;
}

const SWATCHES = [
  { hex: "#00FF88", name: "Cyber Green" },
  { hex: "#EC4899", name: "Neon Pink" },
  { hex: "#38BDF8", name: "Electric Blue" },
  { hex: "#F59E0B", name: "Amber" },
  { hex: "#A855F7", name: "Purple" }
];

export const BrushToolbar: React.FC<BrushToolbarProps> = ({
  onAutoMaskFrame,
  isGenerating
}) => {
  const config = useEditorStore((s) => s.config);
  const updateConfig = useEditorStore((s) => s.updateConfig);
  const setBrushMode = useEditorStore((s) => s.setBrushMode);
  const setBrushSize = useEditorStore((s) => s.setBrushSize);
  const setBrushOpacity = useEditorStore((s) => s.setBrushOpacity);
  const setBrushFeather = useEditorStore((s) => s.setBrushFeather);
  const setMaskPreviewMode = useEditorStore((s) => s.setMaskPreviewMode);

  const currentFrameIndex = useVideoStore((s) => s.currentFrameIndex);
  const undo = useMaskStore((s) => s.undo);
  const redo = useMaskStore((s) => s.redo);
  const undoStack = useMaskStore((s) => s.undoStack);
  const redoStack = useMaskStore((s) => s.redoStack);
  const clearFrameMask = useMaskStore((s) => s.clearFrameMask);
  const resetFrameToAuto = useMaskStore((s) => s.resetFrameToAuto);
  const mattes = useMaskStore((s) => s.mattes);
  const setMatte = useMaskStore((s) => s.setMatte);

  const currentMatte = mattes.get(currentFrameIndex);

  const handleGrowMask = () => {
    if (!currentMatte) return;
    const dilated = dilate(currentMatte.data, 4, currentMatte.width, currentMatte.height);
    const updated: AlphaMatte = {
      ...currentMatte,
      data: dilated,
      hasManualEdits: true,
      coverage: getMaskCoverage(dilated),
      lastModified: Date.now()
    };
    setMatte(currentFrameIndex, updated);
  };

  const handleShrinkMask = () => {
    if (!currentMatte) return;
    const eroded = erode(currentMatte.data, 4, currentMatte.width, currentMatte.height);
    const updated: AlphaMatte = {
      ...currentMatte,
      data: eroded,
      hasManualEdits: true,
      coverage: getMaskCoverage(eroded),
      lastModified: Date.now()
    };
    setMatte(currentFrameIndex, updated);
  };

  const handleSmoothMask = () => {
    if (!currentMatte) return;
    const smoothed = smoothMaskEdges(currentMatte.data, currentMatte.width, currentMatte.height);
    const updated: AlphaMatte = {
      ...currentMatte,
      data: smoothed,
      hasManualEdits: true,
      coverage: getMaskCoverage(smoothed),
      lastModified: Date.now()
    };
    setMatte(currentFrameIndex, updated);
  };

  return (
    <div className="bg-bg-secondary/95 backdrop-blur border-b border-border px-3 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Brush Mode & Sizing */}
      <div className="flex items-center space-x-3">
        {/* Add / Erase Buttons */}
        <div className="flex bg-bg-tertiary p-0.5 rounded-lg border border-border/80">
          <button
            onClick={() => setBrushMode("add")}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium transition-all ${
              config.brushMode === "add"
                ? "bg-add text-black font-semibold shadow-sm"
                : "text-text-muted hover:text-white"
            }`}
            title="Add to Mask (A)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
          <button
            onClick={() => setBrushMode("erase")}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium transition-all ${
              config.brushMode === "erase"
                ? "bg-erase text-white font-semibold shadow-sm"
                : "text-text-muted hover:text-white"
            }`}
            title="Erase from Mask (E)"
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Erase</span>
          </button>
        </div>

        {/* Brush Size Slider */}
        <div className="flex items-center space-x-2 bg-bg-tertiary px-2.5 py-1 rounded-lg border border-border/60">
          <span className="text-text-muted font-medium">Size:</span>
          <input
            type="range"
            min="3"
            max="120"
            value={config.brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20 accent-accent cursor-pointer h-1.5 bg-bg-primary rounded-lg"
          />
          <span className="font-mono text-accent w-7 text-right">{config.brushSize}px</span>
        </div>

        {/* Brush Opacity */}
        <div className="hidden sm:flex items-center space-x-2 bg-bg-tertiary px-2.5 py-1 rounded-lg border border-border/60">
          <span className="text-text-muted font-medium">Opacity:</span>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={config.brushOpacity}
            onChange={(e) => setBrushOpacity(Number(e.target.value))}
            className="w-16 accent-accent cursor-pointer h-1.5 bg-bg-primary rounded-lg"
          />
          <span className="font-mono text-accent w-7 text-right">{Math.round(config.brushOpacity * 100)}%</span>
        </div>

        {/* Feather Soft Edge */}
        <button
          onClick={() => setBrushFeather(!config.brushFeather)}
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg border transition-all ${
            config.brushFeather
              ? "bg-accent/15 border-accent/40 text-accent font-medium"
              : "bg-bg-tertiary border-border text-text-muted hover:text-white"
          }`}
          title="Toggle Soft Feathered Edge"
        >
          <Feather className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Soft Edge</span>
        </button>
      </div>

      {/* Center: Mask Morphology & Fast Actions */}
      <div className="hidden lg:flex items-center space-x-1.5 bg-bg-tertiary/60 p-1 rounded-lg border border-border/60">
        <button
          onClick={handleGrowMask}
          disabled={!currentMatte}
          className="px-2 py-0.5 rounded text-[11px] font-medium text-text-muted hover:text-white hover:bg-bg-elevated disabled:opacity-40"
          title="Dilate / Grow mask by 4px"
        >
          + Grow
        </button>
        <button
          onClick={handleShrinkMask}
          disabled={!currentMatte}
          className="px-2 py-0.5 rounded text-[11px] font-medium text-text-muted hover:text-white hover:bg-bg-elevated disabled:opacity-40"
          title="Erode / Shrink mask by 4px"
        >
          − Shrink
        </button>
        <button
          onClick={handleSmoothMask}
          disabled={!currentMatte}
          className="px-2 py-0.5 rounded text-[11px] font-medium text-text-muted hover:text-white hover:bg-bg-elevated disabled:opacity-40"
          title="Smooth mask boundary"
        >
          Smooth
        </button>
      </div>

      {/* Right: Preview Mode & Actions */}
      <div className="flex items-center space-x-2">
        {/* Swatches */}
        <div className="hidden sm:flex items-center space-x-1 bg-bg-tertiary px-1.5 py-1 rounded-lg border border-border/60">
          {SWATCHES.map((s) => (
            <button
              key={s.hex}
              onClick={() => updateConfig({ maskOverlayColor: s.hex })}
              style={{ backgroundColor: s.hex }}
              className={`w-3.5 h-3.5 rounded-full transition-transform ${
                config.maskOverlayColor === s.hex ? "scale-125 ring-2 ring-white" : "opacity-75 hover:opacity-100"
              }`}
              title={s.name}
            />
          ))}
        </div>

        {/* Preview Mode Switcher */}
        <div className="flex bg-bg-tertiary p-0.5 rounded-lg border border-border/80">
          <button
            onClick={() => setMaskPreviewMode("overlay")}
            className={`p-1 rounded transition-colors ${
              config.maskPreviewMode === "overlay" ? "bg-accent text-white" : "text-text-muted hover:text-white"
            }`}
            title="Mask Overlay Mode (1)"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMaskPreviewMode("cutout")}
            className={`p-1 rounded transition-colors ${
              config.maskPreviewMode === "cutout" ? "bg-accent text-white" : "text-text-muted hover:text-white"
            }`}
            title="Cutout Mode (2)"
          >
            <Scissors className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center space-x-0.5">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="p-1 rounded bg-bg-tertiary hover:bg-bg-elevated text-text-muted hover:text-white disabled:opacity-30 border border-border/60 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="p-1 rounded bg-bg-tertiary hover:bg-bg-elevated text-text-muted hover:text-white disabled:opacity-30 border border-border/60 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auto Mask Current Frame */}
        <button
          onClick={onAutoMaskFrame}
          disabled={isGenerating}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-accent/20 border border-accent/40 text-accent-hover font-semibold hover:bg-accent hover:text-white transition-all disabled:opacity-40"
          title="Auto Mask Frame (G)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGenerating ? "..." : "Auto Frame"}</span>
        </button>

        {/* Reset / Clear */}
        <button
          onClick={() => resetFrameToAuto(currentFrameIndex)}
          disabled={!currentMatte}
          className="p-1 rounded bg-bg-tertiary hover:bg-bg-elevated text-text-muted hover:text-white disabled:opacity-30 border border-border/60 transition-colors"
          title="Reset to Auto Mask"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => clearFrameMask(currentFrameIndex)}
          disabled={!currentMatte}
          className="p-1 rounded bg-bg-tertiary hover:bg-danger/20 text-text-muted hover:text-danger disabled:opacity-30 border border-border/60 transition-colors"
          title="Clear Frame Mask"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
