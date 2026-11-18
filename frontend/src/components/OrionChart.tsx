import React from 'react';
import Plot from 'react-plotly.js';
import type { Data, Layout, Config } from 'plotly.js';

interface OrionChartProps {
  data: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  className?: string;
  height?: number;
  title?: string;
  showLegend?: boolean;
}

const ORION_LAYOUT: Partial<Layout> = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: {
    family: 'Inter, system-ui, sans-serif',
    color: '#94a3b8',
    size: 11,
  },
  margin: { l: 45, r: 15, t: 30, b: 35 },
  xaxis: {
    gridcolor: 'rgba(255,255,255,0.04)',
    zerolinecolor: 'rgba(255,255,255,0.08)',
    tickfont: { color: '#64748b', family: 'JetBrains Mono, monospace', size: 10 },
    linecolor: '#283142',
  },
  yaxis: {
    gridcolor: 'rgba(255,255,255,0.04)',
    zerolinecolor: 'rgba(255,255,255,0.08)',
    tickfont: { color: '#64748b', family: 'JetBrains Mono, monospace', size: 10 },
    linecolor: '#283142',
  },
  // Main Colors: Stark Red, Metallic Gold, Arc Reactor Cyan, Titanium, Ice White, Muted Silver
  colorway: ['#ff1e42', '#d4af37', '#00f0ff', '#8b9bb4', '#f8fafc', '#94a3b8'],
  hoverlabel: {
    bgcolor: '#171c24',
    bordercolor: '#39465e',
    font: { family: 'JetBrains Mono, monospace', color: '#f8fafc', size: 12 },
  },
  legend: {
    font: { color: '#94a3b8', size: 10, family: 'Inter, sans-serif' },
    bgcolor: 'transparent',
    orientation: 'h',
    y: -0.2,
  },
  autosize: true,
};

const ORION_CONFIG: Partial<Config> = {
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
  responsive: true,
};

const OrionChart: React.FC<OrionChartProps> = ({
  data,
  layout = {},
  config = {},
  className = '',
  height = 300,
  title,
  showLegend = true,
}) => {
  const mergedLayout: Partial<Layout> = {
    ...ORION_LAYOUT,
    ...layout,
    height,
    showlegend: showLegend,
    title: title
      ? {
          text: title,
          font: { color: '#f8fafc', size: 13, family: 'Inter, sans-serif' },
          x: 0.02,
        }
      : undefined,
  };

  return (
    <div className={`w-full overflow-hidden max-w-full ${className}`}>
      <Plot
        data={data}
        layout={mergedLayout}
        config={{ ...ORION_CONFIG, ...config }}
        useResizeHandler
        className="w-full h-full max-w-full"
        style={{ width: '100%', height }}
      />
    </div>
  );
};

export default OrionChart;
