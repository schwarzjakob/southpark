import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import moment from 'moment';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CapacityUtilization = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/capacity_utilization');
        setData(response.data.total_capacity_utilization); // Adjust this line if needed based on your API response structure
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const labels = data.map((d) => moment(d.date).format('DD.MM.YYYY'));
  const utilization = data.map((d) => d.total_demand / d.total_capacity);
  const freeCapacity = data.map((d) => 1 - (d.total_demand / d.total_capacity));

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Capacity Utilization',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        data: utilization,
      },
      {
        label: 'Free Capacity',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        data: freeCapacity,
      }
    ]
  };

  const options = {
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        min: 0,
        max: 1,
        ticks: {
          callback: function(value) {
            return value * 100 + '%';
          }
        }
      },
    },
    title: {
      display: true,
      text: 'Capacity Utilization per Day',
      fontSize: 20
    },
    legend: {
      display: true,
      position: 'right'
    }
  };

  return (
    <div>
      {data.length === 0 ? (
        <div>Loading...</div>
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
};

export default CapacityUtilization;
