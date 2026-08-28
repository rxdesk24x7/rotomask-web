import React, { useState } from "react";
import { 
  Sparkles, 
  Upload, 
  Download, 
  Play, 
  Layers, 
  HelpCircle, 
  Video, 
  Cpu, 
  Zap,
  RotateCcw
} from "lucide-react";
import { useVideoStore } from "../../store/videoStore";
import { useMaskStore } from "../../store/maskStore";
import { useEditorStore } from "../../store/editorStore";

interface HeaderProps {
  onOpenImport: () => void;
  onOpenExport: () => void;
  onAutoMaskAll: () => void;
  onLoadSample: () => void;
  isGeneratingAll: boolean;
  isFallbackEngine: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenImport,
  onOpenExport,
  onAutoMaskAll,
  onLoadSample,
  isGeneratingAll,
  isFallbackEngine
}) => {
  const videoSource = useVideoStore((s) => s.videoSource);
  const processingProgress = useVideoStore((s) => s.processingProgress);
  const processingStatus = useVideoStore((s) => s.processingStatus);
  const statusMessage = useVideoStore((s) => s.statusMessage);
  const activeTab = useEditorStore((s) => s.activeTab);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const mattes = useMaskStore((s) => s.mattes);

  const [showShortcuts, setShowShortcuts] = useState(false);

  const maskedFramesCount = mattes.size;
  const totalFrames = videoSource?.totalFrames || 0;

  return (
    <header className="h-14 bg-bg-secondary border-b border-border px-4 flex items-center justify-between select-none z-20">
      {/* Left: Brand Logo & Video Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent to-pink-500 flex items-center justify-center shadow-lg shadow-accent/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              RotoMask <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent-hover font-mono font-normal">v1.0</span>
            </h1>
          </div>
        </div>

        {videoSource && (
          <div className="hidden md:flex items-center space-x-2 pl-3 border-l border-border/80">
            <span className="text-xs text-text-muted truncate max-w-[140px] font-medium" title={videoSource.name}>
              {videoSource.name}
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted font-mono">
              {videoSource.width}×{videoSource.height}
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted font-mono">
              {videoSource.fps} FPS
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-mono">
              {maskedFramesCount}/{totalFrames} Masks
            </span>
          </div>
        )}
      </div>

      {/* Center: Processing Status or Nav Tabs */}
      <div className="flex items-center space-x-2">
        {processingStatus === "processing" ? (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs text-accent">
            <Cpu className="w-3.5 h-3.5 animate-spin" />
            <span className="font-mono">{statusMessage || `Processing: ${processingProgress}%`}</span>
            <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-150"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        ) : isFallbackEngine ? (
          <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-warning/10 border border-warning/30 text-xs text-warning" title="WASM model fallback mode active">
            <Zap className="w-3 h-3" />
            <span>Fallback Segmenter</span>
          </div>
        ) : (
          <div className="flex bg-bg-tertiary p-0.5 rounded-lg border border-border/60">
            <button
              onClick={() => setActiveTab("mask")}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                activeTab === "mask" ? "bg-accent text-white shadow" : "text-text-muted hover:text-text-primary"
              }`}
            >
              Mask Editor
            </button>
            <button
              onClick={() => setActiveTab("effect")}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                activeTab === "effect" ? "bg-accent text-white shadow" : "text-text-muted hover:text-text-primary"
              }`}
            >
              Rotoscope Effects
            </button>
          </div>
        )}
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onLoadSample}
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-bg-tertiary hover:bg-bg-elevated text-text-primary border border-border transition-colors"
          title="Load animated sample dancer video"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Demo Video</span>
        </button>

        <button
          onClick={onOpenImport}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-bg-tertiary hover:bg-bg-elevated text-text-primary border border-border transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-text-muted" />
          <span>Import</span>
        </button>

        {videoSource && (
          <button
            onClick={onAutoMaskAll}
            disabled={isGeneratingAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-accent to-purple-600 hover:opacity-95 text-white shadow-md shadow-accent/20 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGeneratingAll ? "Masking..." : "Auto-Mask All"}</span>
          </button>
        )}

        {videoSource && (
          <button
            onClick={onOpenExport}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-success hover:bg-success/90 text-white shadow-md shadow-success/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}

        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="p-1.5 rounded-lg bg-bg-tertiary hover:bg-bg-elevated text-text-muted hover:text-white border border-border transition-colors"
          title="Keyboard Shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-accent" /> Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-text-muted hover:text-white text-xs px-2 py-1 rounded bg-bg-tertiary"
              >
                ESC / Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between p-2 rounded bg-bg-tertiary/60">
                <span className="text-text-muted">Add Brush Mode</span>
                <kbd className="font-mono bg-bg-primary px-1.5 py-0.5 rounded text-accent">A</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-bg-tertiary/60">
                <span className="text-text-muted">Erase Mode</span>
                <kbd className="font-mono bg-bg-primary px-1.5 py-0.5 rounded text-danger">E</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-bg-tertiary/60">
                <span className="text-text-muted">Brush Size - / +</span>
                <div className="space-x-1">
                  <kbd className="font-mono bg-bg-primary px-1.5 py-0.5 rounded text-text-primary">[</kbd>
                  <kbd className="font-mono bg-bg-primary px-1.5 py-0.5 rounded text-text-primary">]</kbd>
                </div>
              </div>
              <div className="flex justify-between p-2 rounded bg-bg-tertiary/60">
                <span className="text-text-muted">Play / Pause</span>
                <kbd className="font-mono bg-bg-primary px-1.5 py-0.5 rounded text-text-primary">Space</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-bg-tertiary/60">
                <span className="text-text-muted">Prev / Next Frame</span>
                <div className="space-x-1">
                  <kbd className="font-mono bg-bg-primary px-1.5 py-0.5 rounded text-text-primary">←</kbd>
                  <kbd className="font-mono bg-bg-primary px-1.5 py-0.5 rounded text-text-primary">→</kbd>
                </div>
              </div>
              <div className="flex justify-between p-2 rounded bg-bg-tertiary/60">
                <span className="text-text-muted">Jump 10 Frames</span>
                <span className="font-mono bg-bg-primary px-1.5 py-0.5 rounded text-text-primary">Shift + ← / →</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-bg-tertiary/60">
                <span className="text-text-muted">Auto-Mask Frame</span>
                <kbd className="font-mono bg-bg-primary px-1.5 py-0.5 rounded text-accent">G</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-bg-tertiary/60">
                <span className="text-text-muted">Auto-Mask All</span>
                <kbd className="font-mono bg-bg-primary px-1.5 py-0.5 rounded text-accent">Shift + G</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-bg-tertiary/60">
                <span className="text-text-muted">Overlay / Cutout / Comp</span>
                <div className="space-x-1">
                  <kbd className="font-mono bg-bg-primary px-1.5 py-0.5 rounded text-text-primary">1</kbd>
                  <kbd className="font-mono bg-bg-primary px-1.5 py-0.5 rounded text-text-primary">2</kbd>
                  <kbd className="font-mono bg-bg-primary px-1.5 py-0.5 rounded text-text-primary">3</kbd>
                </div>
              </div>
              <div className="flex justify-between p-2 rounded bg-bg-tertiary/60">
                <span className="text-text-muted">Undo / Redo</span>
                <span className="font-mono bg-bg-primary px-1.5 py-0.5 rounded text-text-primary">Ctrl+Z / Ctrl+Y</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
