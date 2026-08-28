import { VideoSource, EffectLayer, EffectPresetType } from "../types";

export function createSampleVideoSource(): VideoSource {
  const width = 640;
  const height = 360;
  const fps = 30;
  const duration = 3.0; // 3 seconds = 90 frames
  const totalFrames = Math.floor(duration * fps);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const stream = canvas.captureStream(fps);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm",
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  // Render 90 frames procedurally
  let frame = 0;
  const interval = setInterval(() => {
    const t = frame / totalFrames;
    
    // Background gradient with moving horizon
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#0f172a");
    bgGrad.addColorStop(0.6, "#1e293b");
    bgGrad.addColorStop(1, "#334155");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Grid floor
    ctx.strokeStyle = "rgba(124, 106, 255, 0.25)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, height * 0.65);
      ctx.lineTo(width / 2 + (x - width / 2) * 2.5, height);
      ctx.stroke();
    }

    // Moving sun/orb
    ctx.fillStyle = "rgba(236, 72, 153, 0.4)";
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.45, 60, 0, Math.PI * 2);
    ctx.fill();

    // Human silhouette figure dancing / standing in center
    const posX = width * 0.5 + Math.sin(t * Math.PI * 4) * 25;
    const posY = height * 0.72 + Math.cos(t * Math.PI * 8) * 6;

    ctx.fillStyle = "#e2e8f0";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 4;

    // Head
    ctx.beginPath();
    ctx.arc(posX, posY - 110, 18, 0, Math.PI * 2);
    ctx.fill();

    // Neck & Torso
    ctx.beginPath();
    ctx.roundRect(posX - 18, posY - 90, 36, 55, 8);
    ctx.fill();

    // Left arm (animated wave)
    const armAngleL = Math.sin(t * Math.PI * 6) * 0.6 - 0.4;
    ctx.beginPath();
    ctx.moveTo(posX - 16, posY - 85);
    ctx.lineTo(posX - 40 + Math.sin(armAngleL) * 30, posY - 55 + Math.cos(armAngleL) * 20);
    ctx.stroke();

    // Right arm (animated)
    const armAngleR = -Math.sin(t * Math.PI * 6) * 0.6 + 0.4;
    ctx.beginPath();
    ctx.moveTo(posX + 16, posY - 85);
    ctx.lineTo(posX + 40 + Math.sin(armAngleR) * 30, posY - 55 + Math.cos(armAngleR) * 20);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(posX - 10, posY - 35);
    ctx.lineTo(posX - 18, posY + 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(posX + 10, posY - 35);
    ctx.lineTo(posX + 18, posY + 20);
    ctx.stroke();

    frame++;
    if (frame >= totalFrames) {
      clearInterval(interval);
      mediaRecorder.stop();
    }
  }, 1000 / fps);

  mediaRecorder.start();

  // Create a placeholder blob URL immediately, which updates when ready
  const dummyCanvas = document.createElement("canvas");
  dummyCanvas.width = width;
  dummyCanvas.height = height;

  return {
    url: "",
    name: "sample-dance-video.webm",
    duration,
    fps,
    width,
    height,
    totalFrames
  };
}

export function generateProceduralEffect(
  preset: EffectPresetType,
  width: number,
  height: number,
  frameIndex: number,
  totalFrames: number,
  color: string = "#7c6aff"
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const t = (frameIndex % 60) / 60;

  ctx.clearRect(0, 0, width, height);

  if (preset === "neon-glow") {
    // Pulsing cyber aura rings behind human
    const cx = width / 2;
    const cy = height * 0.55;
    for (let r = 50; r < 220; r += 35) {
      const currentR = (r + t * 50) % 240;
      const alpha = Math.max(0, 1 - currentR / 240) * 0.85;
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(cx, cy, currentR, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (preset === "cyber-grid") {
    // 3D perspective grid tunnel
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    const horizon = height * 0.5;

    // Moving horizontal grid lines
    for (let i = 0; i < 12; i++) {
      const lineY = horizon + Math.pow((i + t) / 12, 2.2) * (height - horizon);
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(width, lineY);
      ctx.stroke();
    }
    // Radial perspective lines
    for (let x = -width; x <= width * 2; x += 40) {
      ctx.beginPath();
      ctx.moveTo(width / 2, horizon);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  } else if (preset === "energy-aura") {
    // Swirling plasma particles
    const cx = width / 2;
    const cy = height * 0.5;
    const numParticles = 40;
    ctx.fillStyle = color;
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2 + t * Math.PI * 4;
      const dist = 60 + Math.sin(t * Math.PI * 6 + i) * 50 + (i % 3) * 30;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * (dist * 0.8);
      const size = 6 + (i % 5) * 3;
      
      ctx.globalAlpha = 0.5 + Math.sin(t * 10 + i) * 0.3;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (preset === "speed-lines") {
    // Anime radial speed lines
    const cx = width / 2;
    const cy = height * 0.5;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    const numLines = 50;
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2 + (i % 2 === 0 ? t * 0.2 : -t * 0.2);
      const r1 = 120 + ((i * 37 + frameIndex * 13) % 60);
      const r2 = 380 + ((i * 43) % 100);
      ctx.globalAlpha = 0.3 + ((i * 17) % 50) / 100;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.stroke();
    }
  } else if (preset === "matrix-rain") {
    // Digital matrix glyph rain
    ctx.fillStyle = color;
    ctx.font = "14px monospace";
    const cols = Math.floor(width / 16);
    for (let col = 0; col < cols; col++) {
      const speedOffset = (col * 7) % 10;
      const dropY = ((frameIndex * 8 + speedOffset * 20) % (height + 100)) - 50;
      for (let j = 0; j < 6; j++) {
        const charY = dropY - j * 16;
        if (charY >= 0 && charY <= height) {
          ctx.globalAlpha = Math.max(0, 1 - j * 0.18);
          const char = String.fromCharCode(0x30A0 + ((col * 13 + j * 7 + frameIndex) % 96));
          ctx.fillText(char, col * 16, charY);
        }
      }
    }
  }

  return ctx.getImageData(0, 0, width, height);
}
