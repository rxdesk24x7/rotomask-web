import React, { useState, useEffect } from "react";
import { Header } from "./components/Header/Header";
import { VideoImport } from "./components/VideoImport/VideoImport";
import { MaskEditor } from "./components/MaskEditor/MaskEditor";
import { CompositePreview } from "./components/CompositePreview/CompositePreview";
import { EffectImport } from "./components/EffectImport/EffectImport";
import { Timeline } from "./components/Timeline/Timeline";
import { ExportPanel } from "./components/ExportPanel/ExportPanel";

import { useVideoStore } from "./store/videoStore";
import { useMaskStore } from "./store/maskStore";
import { useEditorStore } from "./store/editorStore";

import { useVideoFrames } from "./hooks/useVideoFrames";
import { useMaskingEngine } from "./hooks/useMaskingEngine";
import { useCompositor } from "./hooks/useCompositor";

import { createSampleVideoSource } from "./utils/sampleMedia.utils";

export const App: React.FC = () => {
  const videoSource = useVideoStore((s) => s.videoSource);
  const setVideoSource = useVideoStore((s) => s.setVideoSource);
  const currentFrameIndex = useVideoStore((s) => s.currentFrameIndex);
  const isPlaying = useVideoStore((s) => s.isPlaying);
  const setPlaying = useVideoStore((s) => s.setPlaying);
  const nextFrame = useVideoStore((s) => s.nextFrame);
  const prevFrame = useVideoStore((s) => s.prevFrame);
  const jumpFrames = useVideoStore((s) => s.jumpFrames);

  const mattes = useMaskStore((s) => s.mattes);
  const undo = useMaskStore((s) => s.undo);
  const redo = useMaskStore((s) => s.redo);
  const generatingMask = useMaskStore((s) => s.generatingMask);

  const config = useEditorStore((s) => s.config);
  const setBrushMode = useEditorStore((s) => s.setBrushMode);
  const setBrushSize = useEditorStore((s) => s.setBrushSize);
  const setMaskPreviewMode = useEditorStore((s) => s.setMaskPreviewMode);
  const activeTab = useEditorStore((s) => s.activeTab);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Hook 1: Video Frames Manager
  const { videoElement, currentFrameImageData } = useVideoFrames();

  // Hook 2: AI Masking Engine
  const {
    isReady: isMaskingReady,
    isFallback: isFallbackEngine,
    processCurrentFrame,
    processAllFrames
  } = useMaskingEngine(videoElement);

  // Hook 3: Real-Time 3-Layer Compositor
  const { compositeImageData } = useCompositor(currentFrameImageData);

  // Load sample demo video handler
  const handleLoadSample = () => {
    const sample = createSampleVideoSource();
    setVideoSource(sample);
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setPlaying(!isPlaying);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (e.shiftKey) jumpFrames(10);
        else nextFrame();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey) jumpFrames(-10);
        else prevFrame();
      } else if (e.key === "a" || e.key === "A") {
        setBrushMode("add");
      } else if (e.key === "e" || e.key === "E") {
        setBrushMode("erase");
      } else if (e.key === "[") {
        setBrushSize(config.brushSize - 5);
      } else if (e.key === "]") {
        setBrushSize(config.brushSize + 5);
      } else if (e.key === "1") {
        setMaskPreviewMode("overlay");
      } else if (e.key === "2") {
        setMaskPreviewMode("cutout");
      } else if (e.key === "3") {
        setMaskPreviewMode("composite");
      } else if (e.key === "g" || e.key === "G") {
        if (e.shiftKey) {
          processAllFrames();
        } else {
          processCurrentFrame();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isPlaying,
    setPlaying,
    nextFrame,
    prevFrame,
    jumpFrames,
    setBrushMode,
    setBrushSize,
    config.brushSize,
    setMaskPreviewMode,
    processCurrentFrame,
    processAllFrames,
    undo,
    redo
  ]);

  const currentMatte = mattes.get(currentFrameIndex);

  return (
    <div className="flex flex-col h-screen w-screen bg-bg-primary text-text-primary overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        onOpenImport={() => setIsImportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onAutoMaskAll={processAllFrames}
        onLoadSample={handleLoadSample}
        isGeneratingAll={generatingMask}
        isFallbackEngine={isFallbackEngine}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {!videoSource ? (
          /* Empty Initial State: Big Hero CTA */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center checkerboard-bg">
            <div className="max-w-md bg-bg-secondary/90 backdrop-blur border border-border p-8 rounded-2xl shadow-2xl space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent to-pink-500 flex items-center justify-center mx-auto shadow-lg shadow-accent/25">
                <span className="text-3xl">✂️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Welcome to RotoMask Web</h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  Browser-native AI human masking & 3-layer rotoscope compositing engine.
                  Zero server upload required.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm shadow-lg shadow-accent/25 transition-all cursor-pointer"
                >
                  Import Your Video
                </button>
                <button
                  onClick={handleLoadSample}
                  className="w-full py-2.5 rounded-xl bg-bg-tertiary hover:bg-bg-elevated border border-border text-text-primary font-medium text-xs transition-colors cursor-pointer"
                >
                  Or Try with Demo Video
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === "effect" ? (
          /* Effect Configuration Tab */
          <EffectImport />
        ) : (
          /* Mask Editor & Composite Split View */
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Mask Editor (~60%) */}
            <div className="w-3/5 h-full flex flex-col">
              <MaskEditor
                currentFrameImageData={currentFrameImageData}
                alphaMatte={currentMatte}
                videoSource={videoSource}
                onAutoMaskFrame={processCurrentFrame}
                isGenerating={generatingMask}
              />
            </div>

            {/* Right Panel: Composite Preview (~40%) */}
            <div className="w-2/5 h-full flex flex-col">
              <CompositePreview
                compositeImageData={compositeImageData}
                videoSource={videoSource}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Timeline */}
      {videoSource && (
        <Timeline
          onAutoMaskAll={processAllFrames}
          isGeneratingAll={generatingMask}
        />
      )}

      {/* Modals */}
      <VideoImport
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onVideoLoaded={(source) => setVideoSource(source)}
        onLoadSample={handleLoadSample}
      />

      <ExportPanel
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
};

export default App;
