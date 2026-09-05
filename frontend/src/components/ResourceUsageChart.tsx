import { Box, Typography } from "@mui/material";
import type { ResourceUsagePoint } from "../types";

const WIDTH = 900;
const HEIGHT = 280;
const LEFT = 52;
const RIGHT = 18;
const TOP = 18;
const BOTTOM = 42;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("sr-Latn-RS", { day: "2-digit", month: "short" }).format(new Date(`${date}T00:00:00Z`));

export function ResourceUsageChart({ points }: { points: ResourceUsagePoint[] }) {
  const plotWidth = WIDTH - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const maximum = Math.max(...points.map(point => point.peakQuantity), 1);
  const yMaximum = Math.max(Math.ceil(maximum * 1.2), 4);
  const x = (index: number) => LEFT + (index / Math.max(points.length - 1, 1)) * plotWidth;
  const y = (value: number) => TOP + plotHeight - (value / yMaximum) * plotHeight;
  const line = points.map((point, index) => `${index ? "L" : "M"} ${x(index)} ${y(point.peakQuantity)}`).join(" ");
  const area = `${line} L ${x(points.length - 1)} ${TOP + plotHeight} L ${LEFT} ${TOP + plotHeight} Z`;
  const labelStep = Math.max(1, Math.ceil(points.length / 7));
  const peakValue = Math.max(...points.map(point => point.peakQuantity));

  if (!points.length) return <Box className="compact-empty"><Typography>Nema podataka za izabrani period.</Typography></Box>;

  return <Box sx={{ width: "100%", overflowX: "auto" }}>
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" role="img" aria-label="Grafikon dnevne iskorišćenosti resursa" style={{ minWidth: 620, display: "block" }}>
      <defs><linearGradient id="resourceUsageArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#325d88" stopOpacity="0.3" /><stop offset="100%" stopColor="#325d88" stopOpacity="0.03" /></linearGradient></defs>
      {[0, 1, 2, 3, 4].map(step => {
        const value = Math.round((yMaximum * (4 - step)) / 4);
        const lineY = TOP + (plotHeight * step) / 4;
        return <g key={step}><line x1={LEFT} x2={WIDTH - RIGHT} y1={lineY} y2={lineY} stroke="#dfe5ea" strokeDasharray="4 5" /><text x={LEFT - 10} y={lineY + 4} textAnchor="end" fontSize="12" fill="#607080">{value}</text></g>;
      })}
      <path d={area} fill="url(#resourceUsageArea)" />
      <path d={line} fill="none" stroke="#325d88" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, index) => {
        const showLabel = index % labelStep === 0 || index === points.length - 1;
        const isPeak = point.peakQuantity === peakValue && peakValue > 0;
        return <g key={point.date}>
          {(points.length <= 30 || isPeak) && <circle cx={x(index)} cy={y(point.peakQuantity)} r={isPeak ? 5 : 3} fill={isPeak ? "#d68c45" : "#325d88"} stroke="white" strokeWidth="2"><title>{formatDate(point.date)}: {point.peakQuantity} jedinica</title></circle>}
          {showLabel && <text x={x(index)} y={HEIGHT - 14} textAnchor="middle" fontSize="12" fill="#607080">{formatDate(point.date)}</text>}
        </g>;
      })}
      <text x="14" y={HEIGHT / 2} transform={`rotate(-90 14 ${HEIGHT / 2})`} textAnchor="middle" fontSize="12" fill="#607080">Broj jedinica</text>
    </svg>
  </Box>;
}
