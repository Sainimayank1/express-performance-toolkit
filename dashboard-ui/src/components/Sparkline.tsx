import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color: string;
  gradientId: string;
  activeIndex?: number | null;
}

/** 
 * A sleek, SVG-based sparkline that uses Bezier curves 
 * for a smoother, more premium look.
 */
export function Sparkline({
  data,
  width = 300,
  height = 60,
  color,
  gradientId,
  activeIndex,
}: SparklineProps) {
  const { linePath, areaPath, activePoint } = useMemo(() => {
    if (data.length < 2) return { linePath: "", areaPath: "", activePoint: null };
    
    const max = Math.max(...data, 1);
    const min = 0;
    const range = max - min;
    const xStep = width / (data.length - 1);
    
    const points = data.map((val, i) => ({
      x: i * xStep,
      y: height - ((val - min) / range) * height
    }));

    // Generate smooth curve using Bezier pathing
    let d = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX = (curr.x + next.x) / 2;
      d += ` C ${cpX},${curr.y} ${cpX},${next.y} ${next.x},${next.y}`;
    }

    const a = `${d} L ${width},${height} L 0,${height} Z`;
    
    const activePoint = activeIndex !== undefined && activeIndex !== null && points[activeIndex] 
      ? points[activeIndex] 
      : null;

    return { linePath: d, areaPath: a, activePoint };
  }, [data, width, height, activeIndex]);

  if (data.length < 2) return <div style={{ height, width: '100%' }} />;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
        style={{ transition: "d 0.3s ease-in-out" }}
      />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: "d 0.3s ease-in-out" }}
      />
      {activePoint && (
        <g>
          {/* Outer glow ring */}
          <circle
            cx={activePoint.x}
            cy={activePoint.y}
            r="6"
            fill={color}
            style={{ opacity: 0.2, transition: "cx 0.1s linear, cy 0.1s linear" }}
          />
          {/* Core point */}
          <circle
            cx={activePoint.x}
            cy={activePoint.y}
            r="3.5"
            fill="var(--surface-high)"
            stroke={color}
            strokeWidth="2"
            style={{ transition: "cx 0.1s linear, cy 0.1s linear" }}
          />
        </g>
      )}
    </svg>
  );
}
