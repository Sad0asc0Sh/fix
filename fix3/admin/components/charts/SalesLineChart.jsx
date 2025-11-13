"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function SalesLineChart({ data }) {
  const labels = data?.labels || [];
  const values = data?.data || [];

  const chartData = {
    labels,
    datasets: [
      {
        label: "فروش",
        data: values,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.2)",
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "#eee" } },
    },
  };

  return <Line options={options} data={chartData} />;
}

