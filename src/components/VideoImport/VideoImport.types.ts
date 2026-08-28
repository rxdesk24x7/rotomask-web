import { VideoSource } from "../../types";

export interface VideoImportProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoLoaded: (source: VideoSource) => void;
  onLoadSample: () => void;
}
