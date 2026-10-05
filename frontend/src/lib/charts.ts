import {
  ArcElement, BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip, type ChartOptions,
} from 'chart.js';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.color = 'rgba(255,255,255,0.55)';

export const PALETTE = [
  'rgba(100,255,180,0.75)', 'rgba(0,217,255,0.75)', 'rgba(139,92,246,0.75)',
  'rgba(255,107,53,0.75)', 'rgba(255,77,109,0.75)', 'rgba(250,199,117,0.75)',
];

const axis = {
  ticks: { color: 'rgba(255,255,255,0.45)', font: { size: 11 } },
  grid: { color: 'rgba(255,255,255,0.04)' },
};

export const barOptions = (overrides: ChartOptions<'bar'> = {}): ChartOptions<'bar'> => ({
  responsive: true,
  animation: { duration: 1400, easing: 'easeOutQuart' },
  plugins: { legend: { labels: { font: { size: 11 } } } },
  scales: { x: axis, y: axis },
  ...overrides,
});
