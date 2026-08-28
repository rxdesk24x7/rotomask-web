import { create } from "zustand";
import { EditorConfig, BrushMode, MaskPreviewMode, EffectLayer } from "../types";

interface EditorStore {
  config: EditorConfig;
  isDrawing: boolean;
  activeTab: "mask" | "effect" | "export";
  effectLayer: EffectLayer | null;
  cursorPos: { x: number; y: number; visible: boolean };

  updateConfig: (partial: Partial<EditorConfig>) => void;
  setBrushMode: (mode: BrushMode) => void;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushFeather: (feather: boolean) => void;
  setMaskPreviewMode: (mode: MaskPreviewMode) => void;
  setDrawing: (v: boolean) => void;
  setActiveTab: (tab: "mask" | "effect" | "export") => void;
  setEffectLayer: (layer: EffectLayer | null) => void;
  updateEffectOpacity: (opacity: number) => void;
  setCursorPos: (pos: { x: number; y: number; visible: boolean }) => void;
  resetEditor: () => void;
}

const DEFAULT_CONFIG: EditorConfig = {
  brushSize: 25,
  brushOpacity: 0.9,
  brushFeather: true,
  brushMode: "add",
  maskPreviewMode: "overlay",
  maskOverlayColor: "#00FF88",
  maskOverlayOpacity: 0.45,
  showOriginalVideo: true,
  showEffectLayer: true,
  showMask: true,
  showBackground: true,
  backgroundColor: "#111827",
  viewMode: "split"
};

export const useEditorStore = create<EditorStore>((set) => ({
  config: DEFAULT_CONFIG,
  isDrawing: false,
  activeTab: "mask",
  effectLayer: {
    type: "canvas-generated",
    name: "Neon Glow Aura",
    presetType: "neon-glow",
    width: 1280,
    height: 720,
    opacity: 0.85,
    color: "#7c6aff"
  },
  cursorPos: { x: 0, y: 0, visible: false },

  updateConfig: (partial) => {
    set((state) => ({ config: { ...state.config, ...partial } }));
  },

  setBrushMode: (brushMode) => {
    set((state) => ({ config: { ...state.config, brushMode } }));
  },

  setBrushSize: (brushSize) => {
    const clamped = Math.max(2, Math.min(150, brushSize));
    set((state) => ({ config: { ...state.config, brushSize: clamped } }));
  },

  setBrushOpacity: (brushOpacity) => {
    const clamped = Math.max(0.05, Math.min(1.0, brushOpacity));
    set((state) => ({ config: { ...state.config, brushOpacity: clamped } }));
  },

  setBrushFeather: (brushFeather) => {
    set((state) => ({ config: { ...state.config, brushFeather } }));
  },

  setMaskPreviewMode: (maskPreviewMode) => {
    set((state) => ({ config: { ...state.config, maskPreviewMode } }));
  },

  setDrawing: (isDrawing) => set({ isDrawing }),

  setActiveTab: (activeTab) => set({ activeTab }),

  setEffectLayer: (effectLayer) => set({ effectLayer }),

  updateEffectOpacity: (opacity) => {
    set((state) => {
      if (!state.effectLayer) return state;
      return {
        effectLayer: {
          ...state.effectLayer,
          opacity: Math.max(0, Math.min(1, opacity))
        }
      };
    });
  },

  setCursorPos: (cursorPos) => set({ cursorPos }),

  resetEditor: () => {
    set({
      config: DEFAULT_CONFIG,
      isDrawing: false,
      activeTab: "mask",
      cursorPos: { x: 0, y: 0, visible: false }
    });
  }
}));
