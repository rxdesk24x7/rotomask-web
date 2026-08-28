import React from "react";
import { MaskEditorProps } from "./MaskEditor.types";
import { BrushToolbar } from "./BrushToolbar";
import { MaskEditorCanvas } from "./MaskEditorCanvas";

export const MaskEditor: React.FC<MaskEditorProps> = ({
  currentFrameImageData,
  alphaMatte,
  videoSource,
  onAutoMaskFrame,
  isGenerating
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary overflow-hidden">
      {/* Top Toolbar */}
      <BrushToolbar
        onAutoMaskFrame={onAutoMaskFrame}
        isGenerating={isGenerating}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <MaskEditorCanvas
          currentFrameImageData={currentFrameImageData}
          alphaMatte={alphaMatte}
          videoSource={videoSource}
        />
      </div>
    </div>
  );
};
