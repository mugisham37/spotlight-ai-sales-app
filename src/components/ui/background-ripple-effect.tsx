"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import "../../styles/ripple-animation.css";

export const BackgroundRippleEffect = ({
  cellSize = 40,
}: {
  cellSize?: number;
}) => {
  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const [dimensions, setDimensions] = useState({ rows: 0, cols: 0 });
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (ref.current) {
        const { width, height } = ref.current.getBoundingClientRect();
        // Calculate exact coverage without negative offsets
        const cols = Math.ceil(width / cellSize) + 1;
        const rows = Math.ceil(height / cellSize) + 1;
        setDimensions({ rows, cols });
        console.log(
          `Grid dimensions: ${rows}x${cols}, Container: ${width}x${height}`
        );
      }
    };

    // Initial calculation
    updateDimensions();

    // Use ResizeObserver for better performance
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [cellSize]);

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 h-full w-full pointer-events-none",
        "[--cell-border-color:rgba(255,255,255,0.2)] [--cell-fill-color:rgba(255,255,255,0.05)] [--cell-shadow-color:rgba(255,255,255,0.3)]",
        "dark:[--cell-border-color:rgba(255,255,255,0.2)] dark:[--cell-fill-color:rgba(255,255,255,0.05)] dark:[--cell-shadow-color:rgba(255,255,255,0.3)]"
      )}
    >
      <div className="relative h-full w-full">
        {dimensions.rows > 0 && dimensions.cols > 0 && (
          <DivGrid
            key={`grid-${dimensions.rows}-${dimensions.cols}`}
            className="absolute inset-0"
            rows={dimensions.rows}
            cols={dimensions.cols}
            cellSize={cellSize}
            borderColor="var(--cell-border-color)"
            fillColor="var(--cell-fill-color)"
            clickedCell={clickedCell}
            hoveredCell={hoveredCell}
            onCellClick={(row, col) => {
              console.log(`Cell clicked: ${row}, ${col}`);
              setClickedCell({ row, col });
              setRippleKey((k) => k + 1);
              // Reset after animation
              setTimeout(() => setClickedCell(null), 2000);
            }}
            onCellHover={(cellIdx) => setHoveredCell(cellIdx)}
            onCellLeave={() => setHoveredCell(null)}
            interactive
          />
        )}
      </div>
    </div>
  );
};

type DivGridProps = {
  className?: string;
  rows: number;
  cols: number;
  cellSize: number; // in pixels
  borderColor: string;
  fillColor: string;
  clickedCell: { row: number; col: number } | null;
  hoveredCell: number | null;
  onCellClick?: (row: number, col: number) => void;
  onCellHover?: (cellIdx: number) => void;
  onCellLeave?: () => void;
  interactive?: boolean;
};

type CellStyle = React.CSSProperties & {
  ["--delay"]?: string;
  ["--duration"]?: string;
};

const DivGrid = ({
  className,
  rows = 7,
  cols = 30,
  cellSize = 56,
  borderColor = "rgba(255,255,255,0.2)",
  fillColor = "rgba(255,255,255,0.05)",
  clickedCell = null,
  hoveredCell = null,
  onCellClick = () => {},
  onCellHover = () => {},
  onCellLeave = () => {},
  interactive = true,
}: DivGridProps) => {
  const cells = useMemo(
    () => Array.from({ length: rows * cols }, (_, idx) => idx),
    [rows, cols]
  );

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    width: cols * cellSize,
    height: rows * cellSize,
    position: "absolute",
    top: 0,
    left: 0,
    pointerEvents: interactive ? "auto" : "none",
  };

  return (
    <div className={cn("relative z-[5]", className)} style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 0;
        const delay = clickedCell ? Math.max(0, distance * 25) : 0;
        const duration = 300 + distance * 30;
        const shouldAnimate = clickedCell && distance <= 20;
        const isHovered = hoveredCell === idx;

        const style: CellStyle = {
          backgroundColor: fillColor,
          borderColor: borderColor,
          width: `${cellSize}px`,
          height: `${cellSize}px`,
          ...(shouldAnimate && {
            "--delay": `${delay}ms`,
            "--duration": `${duration}ms`,
          }),
        };

        return (
          <div
            key={`cell-${idx}`}
            className={cn(
              "cell relative border-[1px] transition-all duration-200 will-change-transform",
              "cursor-pointer select-none",
              // Base state - more visible for debugging
              "opacity-40 bg-white/5 border-white/20",
              // Hover state - highly visible
              isHovered &&
                "opacity-100 bg-white/20 border-white/50 scale-110 z-20",
              "hover:opacity-100 hover:bg-white/20 hover:border-white/50 hover:scale-110 hover:z-20",
              "hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]",
              // Active state
              "active:scale-95 active:bg-white/30",
              // Ripple animation
              shouldAnimate && "animate-cell-ripple",
              // Disable pointer events if not interactive
              !interactive && "pointer-events-none"
            )}
            style={style}
            onClick={(e) => {
              e.stopPropagation();
              if (interactive) {
                console.log(
                  `Cell ${idx} clicked at position (${rowIdx}, ${colIdx})`
                );
                onCellClick?.(rowIdx, colIdx);
              }
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              if (interactive) {
                onCellHover?.(idx);
              }
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              if (interactive) {
                onCellLeave?.();
              }
            }}
            data-cell={idx}
            data-row={rowIdx}
            data-col={colIdx}
          />
        );
      })}
    </div>
  );
};
