import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import axios from "axios";
import moment from "moment";
import { MenuItem, FormControl, Select, InputLabel } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const CapacityUtilization = () => {
  const [data, setData] = useState([]);
  const [year, setYear] = useState("");
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    fetchAvailableYears();
  });

  useEffect(() => {
    if (year) {
      fetchData(year);
    }
  }, [year]);

  const fetchAvailableYears = async () => {
    try {
      const response = await axios.get("/api/available_years");
      const years = response.data.years;
      setAvailableYears(years);
      if (years.length > 0 && !years.includes(year)) {
        setYear(years[0]);
      }
    } catch (error) {
      console.error("Error fetching available years:", error);
    }
  };

  const fetchData = async (year) => {
    try {
      const response = await axios.get(
        `/api/capacity_utilization?year=${year}`,
      );
      setData(response.data.total_capacity_utilization);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const labels = data.map((d) => moment(d.date).format("DD.MM.YYYY"));
  const utilization = data.map((d) =>
    d.total_capacity > 0 ? d.total_demand / d.total_capacity : 0,
  );
  const freeCapacity = data.map((d) =>
    d.total_capacity > 0 ? 1 - d.total_demand / d.total_capacity : 1,
  );

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Capacity Utilization",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
        data: utilization,
      },
      {
        label: "Free Capacity",
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        data: freeCapacity,
      },
    ],
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
          callback: function (value) {
            return value * 100 + "%";
          },
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const index = context.dataIndex;
            const totalDemand = data[index]?.total_demand || 0;
            const totalCapacity = data[index]?.total_capacity || 0;
            const relativeValue = totalCapacity > 0 ? context.raw * 100 : 0;
            const label = context.dataset.label;

            return `${label}: ${relativeValue.toFixed(2)}% (${
              label === "Capacity Utilization"
                ? totalDemand
                : totalCapacity - totalDemand
            })`;
          },
        },
      },
    },
    title: {
      display: true,
      text: "Capacity Utilization per Day",
      fontSize: 20,
    },
    legend: {
      display: true,
      position: "right",
    },
  };

  return (
    <div>
      <FormControl
        variant="outlined"
        style={{ marginBottom: "20px", minWidth: 120 }}
      >
        <InputLabel>Year</InputLabel>
        <Select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          label="Year"
        >
          {availableYears.map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {data.length === 0 ? (
        <div>No data available for the selected year.</div>
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
};

export default CapacityUtilization;
