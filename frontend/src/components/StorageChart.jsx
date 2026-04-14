import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Chart.js ko register karein
ChartJS.register(ArcElement, Tooltip, Legend);

function StorageChart({ breakdown }) {
  if (!breakdown) return null;

  // Data setup
  const data = {
    labels: ['Images', 'Documents', 'Media', 'Others'],
    datasets: [
      {
        data: [
          breakdown.Images, 
          breakdown.Documents, 
          breakdown.Media, 
          breakdown.Others
        ],
        backgroundColor: [
          '#36A2EB', // Blue (Images)
          '#FF6384', // Red (Docs)
          '#FFCE56', // Yellow (Media)
          '#C9CBCF', // Grey (Others)
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right', // Labels right side mein dikhenge
        labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12 }
        }
      }
    },
    cutout: '70%', // Beech mein khali jagah (Doughnut style)
  };

  return (
    <div style={{ height: '250px', width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}

export default StorageChart;