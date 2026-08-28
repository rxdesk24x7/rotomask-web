import { AlphaMatte, EditorConfig, VideoSource } from "../../types";

export interface MaskEditorProps {
  currentFrameImageData: ImageData | null;
  alphaMatte: AlphaMatte | undefined;
  videoSource: VideoSource | null;
  onAutoMaskFrame: () => void;
  isGenerating: boolean;
}
