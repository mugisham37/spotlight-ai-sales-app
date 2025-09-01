"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";

type AsciiCanvasProps = {
  src: string;
  width?: number;
  height?: number;
  resolution?: number;
  inverted?: boolean;
  grayscale?: boolean;
  charSet?: "standard" | "detailed" | "blocks" | "minimal";
  fontSize?: number;
  hoverRadius?: number;
  className?: string;
  backgroundColor?: string;
};

type ColoredChar = {
  char: string;
  color: string;
};

export const AsciiCanvas: React.FC<AsciiCanvasProps> = ({
  src,
  width = 600,
  height = 400,
  resolution = 0.13,
  inverted = false,
  grayscale = false,
  charSet = "detailed",
  fontSize = 8,
  hoverRadius = 40,
  className,
  backgroundColor = "#000000",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [asciiArt, setAsciiArt] = useState<string>("");
  const [coloredAsciiArt, setColoredAsciiArt] = useState<ColoredChar[][]>([]);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  const charSets = {
    standard: " .:-=+*#%@",
    detailed: " .,:;i1tfLCG08@",
    blocks: " ░▒▓█",
    minimal: " .:█",
  };

  const adjustColorBrightness = useCallback(
    (r: number, g: number, b: number, factor: number): string => {
      const minBrightness = 40;
      const newR = Math.max(
        Math.min(Math.round(r * factor), 255),
        minBrightness
      );
      const newG = Math.max(
        Math.min(Math.round(g * factor), 255),
        minBrightness
      );
      const newB = Math.max(
        Math.min(Math.round(b * factor), 255),
        minBrightness
      );
      return `rgb(${newR}, ${newG}, ${newB})`;
    },
    []
  );

  const invertColor = useCallback((color: string): string => {
    if (color === "white") return "black";
    if (color === "black") return "white";

    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const r = 255 - parseInt(match[1]);
      const g = 255 - parseInt(match[2]);
      const b = 255 - parseInt(match[3]);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
  }, []);

  const convertToAscii = useCallback(() => {
    if (!processingCanvasRef.current || !imageRef) return;

    try {
      const canvas = processingCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const img = imageRef;
      if (img.width === 0 || img.height === 0) {
        throw new Error("Invalid image dimensions");
      }

      const targetWidth = Math.floor(img.width * resolution);
      const targetHeight = Math.floor(img.height * resolution);

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;
      const chars = charSets[charSet];
      const fontAspect = 0.5;

      const widthStep = Math.ceil(img.width / targetWidth);
      const heightStep = Math.ceil(img.height / targetHeight / fontAspect);

      let result = "";
      const coloredResult: ColoredChar[][] = [];

      for (let y = 0; y < img.height; y += heightStep) {
        const coloredRow: ColoredChar[] = [];

        for (let x = 0; x < img.width; x += widthStep) {
          const pos = (y * img.width + x) * 4;
          const r = data[pos];
          const g = data[pos + 1];
          const b = data[pos + 2];

          let brightness: number;
          if (grayscale) {
            brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
          } else {
            brightness = Math.sqrt(
              0.299 * (r / 255) * (r / 255) +
                0.587 * (g / 255) * (g / 255) +
                0.114 * (b / 255) * (b / 255)
            );
          }

          if (inverted) brightness = 1 - brightness;

          const charIndex = Math.floor(brightness * (chars.length - 1));
          const char = chars[charIndex];
          result += char;

          if (!grayscale) {
            const brightnessFactor =
              (charIndex / (chars.length - 1)) * 1.5 + 0.5;
            const color = adjustColorBrightness(r, g, b, brightnessFactor);
            coloredRow.push({ char, color });
          } else {
            coloredRow.push({ char, color: "white" });
          }
        }

        result += "\n";
        coloredResult.push(coloredRow);
      }

      setAsciiArt(result);
      setColoredAsciiArt(coloredResult);
      setError(null);
    } catch (err) {
      console.error("Error converting to ASCII:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setAsciiArt("");
      setColoredAsciiArt([]);
    }
  }, [
    imageRef,
    resolution,
    inverted,
    grayscale,
    charSet,
    adjustColorBrightness,
    charSets,
  ]);

  const renderToCanvas = useCallback(() => {
    if (!canvasRef.current || !asciiArt || coloredAsciiArt.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "top";

    const lineHeight = fontSize;
    const charWidth = fontSize * 0.6;
    const hoverRadiusSquared = hoverRadius * hoverRadius;

    if (grayscale) {
      const lines = asciiArt.split("\n");
      const maxLineLength = Math.max(...lines.map((line) => line.length));

      canvas.width = maxLineLength * charWidth;
      canvas.height = lines.length * lineHeight;

      ctx.font = `${fontSize}px monospace`;
      ctx.fillStyle = "white";

      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, 0, lineIndex * lineHeight);
      });
    } else {
      canvas.width = coloredAsciiArt[0].length * charWidth;
      canvas.height = coloredAsciiArt.length * lineHeight;

      ctx.font = `${fontSize}px monospace`;

      coloredAsciiArt.forEach((row, rowIndex) => {
        row.forEach((col, colIndex) => {
          const charX = colIndex * charWidth + charWidth / 2;
          const charY = rowIndex * lineHeight + lineHeight / 2;

          let shouldInvert = false;
          if (mousePos) {
            const distanceSquared =
              Math.pow(charX - mousePos.x, 2) + Math.pow(charY - mousePos.y, 2);
            shouldInvert = distanceSquared <= hoverRadiusSquared;
          }

          ctx.fillStyle = shouldInvert ? invertColor(col.color) : col.color;
          ctx.fillText(col.char, colIndex * charWidth, rowIndex * lineHeight);
        });
      });
    }
  }, [
    asciiArt,
    coloredAsciiArt,
    mousePos,
    fontSize,
    hoverRadius,
    grayscale,
    backgroundColor,
    invertColor,
  ]);

  const scheduleRender = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      if (!loading && !error) {
        renderToCanvas();
      }
    });
  }, [loading, error, renderToCanvas]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      setMousePos({
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
  }, []);

  useEffect(() => {
    scheduleRender();
  }, [scheduleRender]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (img.width === 0 || img.height === 0) {
        setError("Invalid image dimensions");
        setLoading(false);
        return;
      }

      setImageRef(img);
      setLoading(false);
    };

    img.onerror = () => {
      setError("Failed to load image");
      setLoading(false);
    };

    img.src = src;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [src]);

  useEffect(() => {
    if (imageRef && !loading) {
      convertToAscii();
    }
  }, [imageRef, loading, convertToAscii]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-white font-mono">Loading image...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-red-400 font-mono text-center">
          <div>{error}</div>
          <div className="text-white text-sm mt-2">
            Try refreshing the page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-crosshair font-mono"
        style={{
          maxWidth: "100%",
          userSelect: "text",
          backgroundColor: backgroundColor,
        }}
        aria-label="ASCII art representation of source image"
        role="img"
      />
      <canvas
        ref={processingCanvasRef}
        className="hidden"
        width={300}
        height={300}
      />
    </div>
  );
};
