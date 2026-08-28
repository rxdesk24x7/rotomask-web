import React, { useState } from "react";
import { Download, Film, Image as ImageIcon, X, CheckCircle, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { useVideoStore } from "../../store/videoStore";
import { useMaskStore } from "../../store/maskStore";
import { useEditorStore } from "../../store/editorStore";
import { exportService } from "../../services/export.service";

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ isOpen, onClose }) => {
  const videoSource = useVideoStore((s) => s.videoSource);
  const currentFrameIndex = useVideoStore((s) => s.currentFrameIndex);
  const mattes = useMaskStore((s) => s.mattes);
  const config = useEditorStore((s) => s.config);
  const effectLayer = useEditorStore((s) => s.effectLayer);

  const [exportMode, setExportMode] = useState<"composite" | "matte-image">("composite");
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !videoSource) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setProgress(0);
      setError(null);
      setDownloadUrl(null);

      if (exportMode === "composite") {
        const blob = await exportService.exportCompositeVideo(
          videoSource,
          mattes,
          effectLayer,
          config,
          (pct) => setProgress(pct)
        );
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setFileName(`rotomask_composite_${Date.now()}.webm`);
      } else if (exportMode === "matte-image") {
        const matte = mattes.get(currentFrameIndex);
        if (!matte) {
          throw new Error("No alpha matte generated for current frame.");
        }
        const blob = await exportService.exportAlphaMatteImage(matte);
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setFileName(`frame_${currentFrameIndex + 1}_alpha_matte.png`);
      }
    } catch (err: any) {
      setError(err.message || "Export failed. Please check browser support.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-success" />
            <h2 className="text-lg font-bold text-white">Export Rotoscope Media</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-bg-tertiary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Type Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-bg-primary rounded-xl border border-border">
          <button
            onClick={() => { setExportMode("composite"); setDownloadUrl(null); }}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              exportMode === "composite"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-text-muted hover:text-white"
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Composite Video (.webm)</span>
          </button>

          <button
            onClick={() => { setExportMode("matte-image"); setDownloadUrl(null); }}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              exportMode === "matte-image"
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "text-text-muted hover:text-white"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Frame Alpha Matte (.png)</span>
          </button>
        </div>

        {/* Summary Info */}
        <div className="bg-bg-tertiary/70 rounded-xl p-4 border border-border/60 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-text-muted">Resolution:</span>
            <span className="font-mono text-white">{videoSource.width} × {videoSource.height} px</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Framerate:</span>
            <span className="font-mono text-white">{videoSource.fps} FPS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Total Duration:</span>
            <span className="font-mono text-white">{videoSource.duration.toFixed(2)}s ({videoSource.totalFrames} frames)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Masks Ready:</span>
            <span className="font-mono text-accent">{mattes.size} / {videoSource.totalFrames} frames</span>
          </div>
        </div>

        {/* Progress Bar */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-accent flex items-center gap-1.5 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Rendering frames...
              </span>
              <span className="font-mono text-accent font-semibold">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-danger/10 border border-danger/30 text-xs text-danger">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Ready to Download Button */}
        {downloadUrl ? (
          <a
            href={downloadUrl}
            download={fileName}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-success hover:bg-success/90 text-white font-bold text-sm shadow-lg shadow-success/20 transition-all"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Download {fileName}</span>
          </a>
        ) : (
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-accent to-purple-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-accent/25 transition-all disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isExporting ? "Rendering..." : "Start Export"}</span>
          </button>
        )}
      </div>
    </div>
  );
};
