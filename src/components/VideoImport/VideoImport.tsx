import React, { useState, useRef } from "react";
import { Upload, Film, Sparkles, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { VideoImportProps } from "./VideoImport.types";
import { extractVideoMetadata } from "../../utils/video.utils";

export const VideoImport: React.FC<VideoImportProps> = ({
  isOpen,
  onClose,
  onVideoLoaded,
  onLoadSample
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    const validTypes = ["video/mp4", "video/webm", "video/quicktime", "video/ogg"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|ogg)$/i)) {
      setError("Unsupported format. Please upload MP4, WebM, or MOV video.");
      return;
    }

    if (file.size > 2 * 1024 * 1024 * 1024) {
      setError("File size exceeds 2GB limit. Please upload a smaller clip.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const source = await extractVideoMetadata(file);
      onVideoLoaded(source);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to parse video. Please try another file.");
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Film className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-white">Import Source Video</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-bg-tertiary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? "border-accent bg-accent/10 scale-[1.01]"
              : "border-border hover:border-accent/60 hover:bg-bg-tertiary/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/ogg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-3 text-accent">
            <Upload className="w-7 h-7" />
          </div>

          <p className="text-sm font-semibold text-white mb-1">
            Drag & drop video here, or click to browse
          </p>
          <p className="text-xs text-text-muted">
            Supports MP4, WebM, MOV (Max 2GB)
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-danger/10 border border-danger/30 text-xs text-danger">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center space-x-2 py-2 text-xs text-accent">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span>Analyzing video metadata...</span>
          </div>
        )}

        {/* Alternative: Load sample video */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <span className="text-xs text-text-muted">Don&apos;t have a video handy?</span>
          <button
            type="button"
            onClick={() => {
              onLoadSample();
              onClose();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500/20 to-accent/20 border border-pink-500/30 hover:border-pink-500/60 text-xs font-semibold text-pink-300 hover:text-white transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Load Animated Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
