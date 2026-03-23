import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color: string;
  gradientId: string;
}

export function Sparkline({
  data,
  width = 300,
  height = 60,
  color,
  gradientId,
}: SparklineProps) {
  const points = useMemo(() => {
    if (data.length === 0) return "";
    const max = Math.max(...data, 1);
    const min = 0;
    const range = max - min;

    const xStep = width / (data.length - 1 || 1);
    
    return data.map((val, i) => {
      const x = i * xStep;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(" ");
  }, [data, width, height]);

  const areaPath = useMemo(() => {
    if (!points) return "";
    return `M 0,${height} L ${points} L ${width},${height} Z`;
  }, [points, width, height]);

  const linePath = useMemo(() => {
    if (!points) return "";
    return `M ${points}`;
  }, [points]);

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
        style={{ transition: "d 0.3s ease" }}
      />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: "d 0.3s ease" }}
      />
    </svg>
  );
}
