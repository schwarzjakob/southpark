import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import axios from "axios";

import { Typography, Box, CircularProgress } from "@mui/material";
import PropTypes from "prop-types";
import "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const NO_DATA_MESSAGE = "No data available for the selected day.";
const ANIMATION_DURATION = 100;
const ANIMATION_EASING = "easeInOutQuad";
const FONT_SIZE = 10;
const COLOR_OCCUPIED = "#ff434375";
const COLOR_FREE = "#6a91ce75";

const ParkingLotBarChart = ({ selectedDate, isPercentage }) => {
  ParkingLotBarChart.propTypes = {
    selectedDate: PropTypes.string.isRequired,
    isPercentage: PropTypes.bool.isRequired,
  };

  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setError] = useState(null);
  const [parkingLots, setParkingLots] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [parkingLotOccupancyResponse, parkingLotsResponse] =
          await Promise.all([
            axios.get(`/api/map/parking_occupancy/${selectedDate}`),
            axios.get(`/api/map/parking_lots_capacity/${selectedDate}`),
          ]);

        const parkingLotOccupancy = parkingLotOccupancyResponse.data;
        const parkingLots = parkingLotsResponse.data;
        if (parkingLots) {
          const sortedParkingLots = [...parkingLots]
            .map((lot) => ({
              ...lot,
              name: lot.external ? `${lot.name} (ext.)` : lot.name,
            }))
            .sort((a, b) => {
              if (a.external === b.external) {
                if (!a.external) {
                  return a.id - b.id;
                }
                return a.name.localeCompare(b.name);
              }
              return a.external - b.external;
            });

          setParkingLots(sortedParkingLots);

          const labels = sortedParkingLots.map((item) => item.name);

          const usedCapacityData = Array(sortedParkingLots.length).fill(0);
          const freeCapacityData = isPercentage
            ? Array(sortedParkingLots.length).fill(100)
            : [...sortedParkingLots.map((item) => item.capacity)];

          if (parkingLotOccupancy !== "No data") {
            parkingLotOccupancy.forEach((item) => {
              const index = sortedParkingLots.findIndex(
                (lot) =>
                  lot.name.replace(" (ext.)", "") === item.parking_lot_name
              );
              if (index >= 0) {
                const totalCapacity = sortedParkingLots[index].capacity;
                const usedCapacity = item.occupancy;
                const freeCapacity = totalCapacity - usedCapacity;
                const usedPercentage = (usedCapacity / totalCapacity) * 100;
                const freePercentage = (freeCapacity / totalCapacity) * 100;

                usedCapacityData[index] = isPercentage
                  ? usedPercentage
                  : usedCapacity;
                freeCapacityData[index] = isPercentage
                  ? freePercentage
                  : freeCapacity;
              }
            });
          }
          const datasets = [];

          if (!isPercentage) {
            datasets.push({
              label: "Used Capacity",
              backgroundColor: COLOR_OCCUPIED,
              borderColor: COLOR_OCCUPIED,
              borderWidth: 1,
              data: usedCapacityData,
              datalabels: {
                anchor: "end",
                align: function (context) {
                  const value = context.dataset.data[context.dataIndex];
                  return value > 250 ? "start" : "end";
                },
                offset: function (context) {
                  const value = context.dataset.data[context.dataIndex];
                  return value > 250 ? 0 : 0;
                },
                color: "#000000",
                font: {
                  size: FONT_SIZE,
                },
                display: function (context) {
                  const usedValue = context.dataset.data[context.dataIndex];
                  const freeValue = freeCapacityData[context.dataIndex];
                  return usedValue >= freeValue;
                },
                formatter: (value) => value.toFixed(0),
              },
            });

            datasets.push({
              label: "Free Capacity",
              backgroundColor: COLOR_FREE,
              borderColor: COLOR_FREE,
              borderWidth: 1,
              data: freeCapacityData,
              datalabels: {
                anchor: "end",
                align: "end",
                color: "#000000",
                offset: 0,
                font: {
                  size: FONT_SIZE,
                },
                display: function (context) {
                  const freeValue = context.dataset.data[context.dataIndex];
                  const usedValue = usedCapacityData[context.dataIndex];
                  return freeValue > usedValue;
                },
                formatter: (value) => `${value.toFixed(0)}`,
              },
            });
          } else {
            datasets.push({
              label: "Used Capacity",
              backgroundColor: COLOR_OCCUPIED,
              borderColor: COLOR_OCCUPIED,
              borderWidth: 1,
              data: usedCapacityData,
              datalabels: {
                anchor: "end",
                align: function (context) {
                  const value = context.dataset.data[context.dataIndex];
                  return value > 25 ? "start" : "end";
                },
                offset: function (context) {
                  const value = context.dataset.data[context.dataIndex];
                  return value > 25 ? 3 : 0;
                },
                color: "#000000",
                font: {
                  size: FONT_SIZE,
                },
                display: function (context) {
                  const usedValue = context.dataset.data[context.dataIndex];
                  const freeValue = freeCapacityData[context.dataIndex];
                  return usedValue >= freeValue;
                },
                formatter: (value) => `${value.toFixed(2)}%`,
              },
            });

            datasets.push({
              label: "Free Capacity",
              backgroundColor: COLOR_FREE,
              borderColor: COLOR_FREE,
              borderWidth: 1,
              data: freeCapacityData,
              datalabels: {
                anchor: "end",
                align: "start",
                color: "#000000",
                offset: 0,
                font: {
                  size: FONT_SIZE,
                },
                display: function (context) {
                  const freeValue = context.dataset.data[context.dataIndex];
                  const usedValue = usedCapacityData[context.dataIndex];
                  return freeValue > usedValue;
                },
                formatter: (value) => `${value.toFixed(2)}%`,
              },
            });
          }

          setChartData({
            labels,
            datasets,
          });
          setLoading(false);
        } else {
          setChartData(null);
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        setError(error);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, isPercentage, setError]);

  const options = {
    indexAxis: "y",
    scales: {
      x: {
        beginAtZero: true,
        max: isPercentage ? 100 : undefined,
        stacked: true,
        title: {
          display: true,
          text: isPercentage ? "Capacity Percentage" : " Total Capacity",
        },
        ticks: {
          callback: (value) => `${value}${isPercentage ? "%" : ""}`,
        },
      },
      y: {
        stacked: true,
        title: {
          display: false,
          text: "Parking Lots",
        },
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const index = context.dataIndex;
            const totalCapacity = parkingLots[index]?.capacity || 0;
            const value = context.raw;
            const label = context.dataset.label;

            if (isPercentage) {
              return `${label}: ${value.toFixed(2)}%`;
            } else {
              return `${label}: ${value.toFixed(0)} (${totalCapacity})`;
            }
          },
        },
      },
      datalabels: {
        display: function (context) {
          const value = context.dataset.data[context.dataIndex];
          return value > 0;
        },
        color: function (context) {
          return context.dataset.backgroundColor;
        },
        anchor: "end",
        align: "start",
        offset: 5,
        font: {
          size: FONT_SIZE,
        },
      },
      legend: {
        display: true,
        position: "top",
        align: "center",
      },
      title: {
        display: false,
        position: "top",
        align: "start",
      },
    },
    animation: {
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  if (loading) {
    return (
      <Box
        className="circular-loading_container"
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="chart-container">
      {chartData ? (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-end",
            width: "100%",
          }}
        >
          <Box
            className="bar-container"
            sx={{
              width: "100%",
            }}
          >
            <Bar
              style={{ height: `${chartData.labels.length * 30}px` }}
              data={chartData}
              options={options}
            />
          </Box>
        </Box>
      ) : (
        <Box className="no-data">
          <Typography>{NO_DATA_MESSAGE}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ParkingLotBarChart;
