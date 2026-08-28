import React from "react";
import { Eye, EyeOff, Layers, Sparkles, Sliders } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";

const BG_COLORS = [
  { value: "#111827", label: "Dark Gray" },
  { value: "#000000", label: "Pure Black" },
  { value: "#0f172a", label: "Navy Blue" },
  { value: "#00ff00", label: "Chroma Green" },
  { value: "transparent", label: "Transparent" }
];

export const LayerStack: React.FC = () => {
  const config = useEditorStore((s) => s.config);
  const updateConfig = useEditorStore((s) => s.updateConfig);
  const effectLayer = useEditorStore((s) => s.effectLayer);
  const updateEffectOpacity = useEditorStore((s) => s.updateEffectOpacity);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);

  return (
    <div className="bg-bg-secondary border-t border-border p-3 space-y-2.5 text-xs select-none">
      <div className="flex items-center justify-between font-semibold text-text-muted pb-1 border-b border-border/40">
        <span className="flex items-center gap-1.5 text-white">
          <Layers className="w-3.5 h-3.5 text-accent" /> Layer Compositor Stack
        </span>
        <button
          onClick={() => setActiveTab("effect")}
          className="text-accent hover:text-accent-hover text-[11px] font-medium flex items-center gap-1"
        >
          <Sliders className="w-3 h-3" /> Configure Effects
        </button>
      </div>

      {/* Layer 3: Top - Masked Human */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-bg-tertiary/70 border border-border/60">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateConfig({ showOriginalVideo: !config.showOriginalVideo })}
            className="p-1 rounded text-text-muted hover:text-white"
            title="Toggle Human Subject"
          >
            {config.showOriginalVideo ? <Eye className="w-3.5 h-3.5 text-success" /> : <EyeOff className="w-3.5 h-3.5 text-danger" />}
          </button>
          <div>
            <div className="font-semibold text-white">3. Masked Subject (Top)</div>
            <div className="text-[10px] text-text-muted">Extracted via MediaPipe Alpha Matte</div>
          </div>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[10px] font-mono">
          Foreground
        </span>
      </div>

      {/* Layer 2: Middle - Effect Layer */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-bg-tertiary/70 border border-border/60">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateConfig({ showEffectLayer: !config.showEffectLayer })}
            className="p-1 rounded text-text-muted hover:text-white"
            title="Toggle Effect Layer"
          >
            {config.showEffectLayer ? <Eye className="w-3.5 h-3.5 text-accent" /> : <EyeOff className="w-3.5 h-3.5 text-danger" />}
          </button>
          <div>
            <div className="font-semibold text-white flex items-center gap-1">
              <span>2. Effect: {effectLayer?.name || "None"}</span>
              <Sparkles className="w-3 h-3 text-pink-400" />
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-[10px] text-text-muted">Opacity:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={effectLayer?.opacity ?? 0.85}
                onChange={(e) => updateEffectOpacity(Number(e.target.value))}
                className="w-16 accent-accent h-1 bg-bg-primary rounded cursor-pointer"
              />
              <span className="text-[10px] font-mono text-accent">
                {Math.round((effectLayer?.opacity ?? 0.85) * 100)}%
              </span>
            </div>
          </div>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-accent/15 text-accent text-[10px] font-mono">
          Rotoscope
        </span>
      </div>

      {/* Layer 1: Bottom - Background */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-bg-tertiary/70 border border-border/60">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateConfig({ showBackground: !config.showBackground })}
            className="p-1 rounded text-text-muted hover:text-white"
            title="Toggle Background"
          >
            {config.showBackground ? <Eye className="w-3.5 h-3.5 text-text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-danger" />}
          </button>
          <div>
            <div className="font-semibold text-white">1. Background (Bottom)</div>
            <div className="flex items-center space-x-1.5 mt-1">
              {BG_COLORS.map((bg) => (
                <button
                  key={bg.value}
                  onClick={() => updateConfig({ backgroundColor: bg.value })}
                  className={`w-4 h-4 rounded border transition-all ${
                    config.backgroundColor === bg.value
                      ? "ring-2 ring-accent scale-110 border-white"
                      : "border-border/80 opacity-70 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: bg.value === "transparent" ? "#333" : bg.value
                  }}
                  title={bg.label}
                />
              ))}
            </div>
          </div>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted text-[10px] font-mono">
          Backdrop
        </span>
      </div>
    </div>
  );
};
