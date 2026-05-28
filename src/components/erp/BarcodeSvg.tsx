import React from "react";
import { getEan13Binary } from "@/lib/utils/barcode-generator";

interface Props {
  barcode: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

export default function BarcodeSvg({
  barcode,
  width = 115,
  height = 40,
  showText = true,
  className = "",
}: Props) {
  const binary = getEan13Binary(barcode);

  if (!binary) {
    return (
      <div className={`text-[9px] font-mono text-red-500 flex items-center justify-center border border-red-200 bg-red-50 p-1 rounded ${className}`}>
        Cód Inválido
      </div>
    );
  }

  // EAN-13 has exactly 95 bars of equal width (3 left guard, 42 left side, 5 center guard, 42 right side, 3 right guard)
  const barCount = binary.length; // 95
  const barWidth = width / barCount;

  // Let's build the SVG paths or rects
  const rects: React.ReactNode[] = [];
  for (let i = 0; i < barCount; i++) {
    if (binary[i] === "1") {
      // Guard bars are taller: left guard (indices 0-2), center guard (indices 45-49), right guard (indices 92-94)
      const isGuard = i < 3 || (i >= 45 && i < 50) || i >= 92;
      const rectHeight = isGuard ? height : height * 0.85;

      rects.push(
        <rect
          key={i}
          x={i * barWidth}
          y={0}
          width={barWidth + 0.05} // slight overlap to avoid tiny subpixel white lines in PDF rendering
          height={rectHeight}
          fill="black"
        />
      );
    }
  }

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        width={width}
        height={height + (showText ? 12 : 0)}
        viewBox={`0 0 ${width} ${height + (showText ? 12 : 0)}`}
        className="overflow-visible"
      >
        <g>{rects}</g>
        {showText && (
          <text
            x={width / 2}
            y={height + 10}
            textAnchor="middle"
            fill="black"
            className="font-mono font-bold select-none"
            style={{ fontSize: "9px", letterSpacing: "1px" }}
          >
            {barcode}
          </text>
        )}
      </svg>
    </div>
  );
}
