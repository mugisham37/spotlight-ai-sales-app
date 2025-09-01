"use client";
import React from "react";
import { Compare } from "@/components/ui/compare";

interface PixelatedCompareProps {
  src: string;
  width?: number;
  height?: number;
  className?: string;
  slideMode?: "hover" | "drag";
  showHandlebar?: boolean;
  cellSize?: number;
  dotScale?: number;
  shape?: "circle" | "square";
  backgroundColor?: string;
  dropoutStrength?: number;
  sampleAverage?: boolean;
  tintColor?: string;
  tintStrength?: number;
  objectFit?: "cover" | "contain" | "fill" | "none";
}

export function PixelatedCompare({
  src,
  width = 420,
  height = 520,
  className,
  slideMode = "hover",
  showHandlebar = true,
  cellSize = 4,
  dotScale = 0.85,
  shape = "square",
  backgroundColor = "#0a0a0a",
  dropoutStrength = 0.35,
  sampleAverage = true,
  tintColor = "#3b82f6",
  tintStrength = 0.08,
  objectFit = "cover",
}: PixelatedCompareProps) {
  // Create state for the pixelated version
  const [pixelatedDataUrl, setPixelatedDataUrl] = React.useState<string>("");

  React.useEffect(() => {
    // Create an off-screen canvas to render the pixelated version

    // We need to render the pixelated canvas and convert it to data URL
    // This is a bit tricky since we need to wait for the canvas to render
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "-9999px";
    document.body.appendChild(tempContainer);

    // Create a temporary canvas element
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempContainer.appendChild(tempCanvas);

    // Render pixelated version using our component logic
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) return;

      tempCanvas.width = width;
      tempCanvas.height = height;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const off = offscreen.getContext("2d");
      if (!off) return;

      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      let dw = width;
      let dh = height;
      let dx = 0;
      let dy = 0;

      if (objectFit === "cover") {
        const scale = Math.max(width / iw, height / ih);
        dw = Math.ceil(iw * scale);
        dh = Math.ceil(ih * scale);
        dx = Math.floor((width - dw) / 2);
        dy = Math.floor((height - dh) / 2);
      }

      off.drawImage(img, dx, dy, dw, dh);

      let imageData: ImageData;
      try {
        imageData = off.getImageData(0, 0, width, height);
      } catch {
        ctx.drawImage(img, 0, 0, width, height);
        document.body.removeChild(tempContainer);
        return;
      }

      const data = imageData.data;
      const stride = width * 4;
      const effectiveDotSize = Math.max(1, Math.floor(cellSize * dotScale));

      const hash2D = (ix: number, iy: number) => {
        const s = Math.sin(ix * 12.9898 + iy * 78.233) * 43758.5453123;
        return s - Math.floor(s);
      };

      const luminanceAt = (px: number, py: number) => {
        const ix = Math.max(0, Math.min(width - 1, px));
        const iy = Math.max(0, Math.min(height - 1, py));
        const i = iy * stride + ix * 4;
        const rr = data[i];
        const gg = data[i + 1];
        const bb = data[i + 2];
        return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
      };

      let tintRGB: [number, number, number] | null = null;
      if (tintColor && tintStrength > 0) {
        const hex = tintColor.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        tintRGB = [r, g, b];
      }

      for (let y = 0; y < height; y += cellSize) {
        const cy = Math.min(height - 1, y + Math.floor(cellSize / 2));
        for (let x = 0; x < width; x += cellSize) {
          const cx = Math.min(width - 1, x + Math.floor(cellSize / 2));

          let r = 0;
          let g = 0;
          let b = 0;
          let a = 0;

          if (sampleAverage) {
            let count = 0;
            for (let oy = -1; oy <= 1; oy++) {
              for (let ox = -1; ox <= 1; ox++) {
                const sx = Math.max(0, Math.min(width - 1, cx + ox));
                const sy = Math.max(0, Math.min(height - 1, cy + oy));
                const sIdx = sy * stride + sx * 4;
                r += data[sIdx];
                g += data[sIdx + 1];
                b += data[sIdx + 2];
                a += data[sIdx + 3] / 255;
                count++;
              }
            }
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            a = a / count;
          } else {
            const idx = cy * stride + cx * 4;
            r = data[idx];
            g = data[idx + 1];
            b = data[idx + 2];
            a = data[idx + 3] / 255;
          }

          if (tintRGB && tintStrength > 0) {
            const k = Math.max(0, Math.min(1, tintStrength));
            r = Math.round(r * (1 - k) + tintRGB[0] * k);
            g = Math.round(g * (1 - k) + tintRGB[1] * k);
            b = Math.round(b * (1 - k) + tintRGB[2] * k);
          }

          const Lc = luminanceAt(cx, cy);
          const Lx1 = luminanceAt(cx - 1, cy);
          const Lx2 = luminanceAt(cx + 1, cy);
          const Ly1 = luminanceAt(cx, cy - 1);
          const Ly2 = luminanceAt(cx, cy + 1);
          const grad =
            Math.abs(Lx2 - Lx1) +
            Math.abs(Ly2 - Ly1) +
            Math.abs(Lc - (Lx1 + Lx2 + Ly1 + Ly2) / 4);
          const gradientNorm = Math.max(0, Math.min(1, grad / 255));
          const dropoutProb = Math.max(
            0,
            Math.min(1, (1 - gradientNorm) * dropoutStrength)
          );
          const drop = hash2D(cx, cy) < dropoutProb;

          if (drop || a <= 0) continue;

          ctx.globalAlpha = a;
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

          if (shape === "circle") {
            const radius = effectiveDotSize / 2;
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(
              x + cellSize / 2 - effectiveDotSize / 2,
              y + cellSize / 2 - effectiveDotSize / 2,
              effectiveDotSize,
              effectiveDotSize
            );
          }
        }
      }

      ctx.globalAlpha = 1;

      // Convert canvas to data URL
      const dataUrl = tempCanvas.toDataURL("image/png");
      setPixelatedDataUrl(dataUrl);

      // Clean up
      document.body.removeChild(tempContainer);
    };

    img.onerror = () => {
      console.error("Failed to load image for PixelatedCompare:", src);
      document.body.removeChild(tempContainer);
    };
  }, [
    src,
    width,
    height,
    cellSize,
    dotScale,
    shape,
    backgroundColor,
    dropoutStrength,
    sampleAverage,
    tintColor,
    tintStrength,
    objectFit,
  ]);

  if (!pixelatedDataUrl) {
    // Show loading state or placeholder
    return (
      <div
        className={`flex items-center justify-center bg-neutral-900 rounded-xl ${className}`}
        style={{ width, height }}
      >
        <div className="text-white/50">Loading...</div>
      </div>
    );
  }

  return (
    <Compare
      firstImage={src}
      secondImage={pixelatedDataUrl}
      className={className}
      firstImageClassName="object-cover"
      secondImageClassname="object-cover"
      slideMode={slideMode}
      showHandlebar={showHandlebar}
      initialSliderPercentage={0}
    />
  );
}
