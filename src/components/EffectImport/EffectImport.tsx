import React from "react";
import { Sparkles, Palette, Zap, Flame, Wind, Binary, Sliders, Check } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { EffectPresetType } from "../../types";

const PRESETS: Array<{ id: EffectPresetType; name: string; desc: string; icon: React.ReactNode; defaultColor: string }> = [
  {
    id: "neon-glow",
    name: "Neon Glow Aura",
    desc: "Pulsating cyber glow rings positioned right behind the subject",
    icon: <Sparkles className="w-5 h-5 text-accent" />,
    defaultColor: "#7c6aff"
  },
  {
    id: "cyber-grid",
    name: "3D Cyber Grid",
    desc: "Futuristic 3D perspective floor and horizon grid tunnel",
    icon: <Zap className="w-5 h-5 text-cyan-400" />,
    defaultColor: "#06b6d4"
  },
  {
    id: "energy-aura",
    name: "Plasma Energy Aura",
    desc: "Swirling electrified fire plasma particles dancing around subject",
    icon: <Flame className="w-5 h-5 text-amber-400" />,
    defaultColor: "#f59e0b"
  },
  {
    id: "speed-lines",
    name: "Anime Speed Lines",
    desc: "High-octane action radial zoom motion rays",
    icon: <Wind className="w-5 h-5 text-pink-400" />,
    defaultColor: "#ec4899"
  },
  {
    id: "matrix-rain",
    name: "Matrix Glyph Rain",
    desc: "Falling digital neon matrix code streams",
    icon: <Binary className="w-5 h-5 text-green-400" />,
    defaultColor: "#22c55e"
  }
];

const COLOR_PALETTE = [
  "#7c6aff", "#ec4899", "#06b6d4", "#22c55e", "#f59e0b", "#e11d48", "#8b5cf6", "#ffffff"
];

export const EffectImport: React.FC = () => {
  const effectLayer = useEditorStore((s) => s.effectLayer);
  const setEffectLayer = useEditorStore((s) => s.setEffectLayer);
  const updateEffectOpacity = useEditorStore((s) => s.updateEffectOpacity);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setEffectLayer({
      type: "canvas-generated",
      name: preset.name,
      presetType: preset.id,
      width: 1280,
      height: 720,
      opacity: effectLayer?.opacity ?? 0.85,
      color: preset.defaultColor
    });
  };

  const handleColorChange = (hex: string) => {
    if (!effectLayer) return;
    setEffectLayer({
      ...effectLayer,
      color: hex
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary overflow-y-auto p-6 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" /> Rotoscope & Effect Layer System
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Choose visual effects to render behind the human subject (Layer 2 in composite)
          </p>
        </div>
        <button
          onClick={() => setActiveTab("mask")}
          className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors"
        >
          Back to Mask Editor
        </button>
      </div>

      {/* Presets Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Built-in Procedural Rotoscope Presets
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESETS.map((preset) => {
            const isSelected = effectLayer?.presetType === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-accent/15 border-accent ring-1 ring-accent shadow-lg shadow-accent/10"
                    : "bg-bg-secondary hover:bg-bg-tertiary border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-bg-tertiary border border-border">
                    {preset.icon}
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{preset.name}</h4>
                  <p className="text-xs text-text-muted leading-relaxed">{preset.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Effect Parameters */}
      {effectLayer && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4 max-w-xl">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-accent" /> Active Effect Parameters
          </h3>

          {/* Color Palette */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-primary flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-text-muted" /> Glow / Accent Color
            </label>
            <div className="flex items-center space-x-2 pt-1">
              {COLOR_PALETTE.map((hex) => (
                <button
                  key={hex}
                  onClick={() => handleColorChange(hex)}
                  style={{ backgroundColor: hex }}
                  className={`w-6 h-6 rounded-full border transition-all ${
                    effectLayer.color === hex
                      ? "ring-2 ring-accent scale-110 border-white"
                      : "border-border/60 hover:scale-105"
                  }`}
                />
              ))}
              <input
                type="color"
                value={effectLayer.color || "#7c6aff"}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                title="Custom color"
              />
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-text-primary">Effect Layer Opacity</span>
              <span className="font-mono text-accent font-semibold">
                {Math.round(effectLayer.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={effectLayer.opacity}
              onChange={(e) => updateEffectOpacity(Number(e.target.value))}
              className="w-full accent-accent h-2 bg-bg-primary rounded cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
