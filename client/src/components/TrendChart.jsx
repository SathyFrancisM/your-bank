import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function TrendChart({ labels, values, label = 'Trend', color = '#2563eb' }) {
  const data = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: color,
        backgroundColor: `${color}22`,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: color
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: '#64748b' } }
    },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(148,163,184,0.16)' } },
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(148,163,184,0.16)' } }
    }
  };

  return <div className="h-80"><Line data={data} options={options} /></div>;
}
