import { useEffect, useState, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import axios from "axios";
import dayjs from "dayjs";
import { Switch } from "antd";
import { Typography, Box, FormControlLabel } from "@mui/material";
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
import DateRangePicker from "../controls/DateRangePicker";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import PropTypes from "prop-types";

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

const TITLE = "Capacity Utilization per Day";
const FREE_CAPACITY_LABEL = "Free Capacity";
const TOTAL_CAPACITY_UTILIZATION_LABEL = "Total Capacity Utilization";
const NO_DATA_MESSAGE = "No data available for the selected time period.";

const ANIMATION_DURATION = 1000;
const ANIMATION_EASING = "easeInOutQuad";

const DISPLAY = true;
const STACKED = true;
const LEGEND_POSITION = "top";

const FONT_SIZE = 10;
const FONT_SIZE_TITLE = 20;

const TOOLTIP_CALLBACK_LOTS_INFO = "Parking Lots: ";

const TOTAL_CAPACITY_UTILIZATION_COLOR = "#6a91ce";
const FREE_CAPACITY_COLOR = "#4d4d4d";

const DEFAULT_EVENT_COLOR = "#000000";

const ORANGE_BORDER_THRESHOLD = 80;
const RED_BORDER_THRESHOLD = 100;

const TRANSPARENCY = "66";

const applyTransparency = (color) => {
  if (!color || typeof color !== "string") {
    console.warn("Invalid color value provided:", color);
    return DEFAULT_EVENT_COLOR + TRANSPARENCY;
  }
  if (color.startsWith("#")) {
    return color + TRANSPARENCY;
  } else {
    return "#" + color + TRANSPARENCY;
  }
};

const CapacityUtilization = ({
  selectedYear,
  setSelectedYear,
  dateRange,
  setDateRange,
}) => {
  CapacityUtilization.propTypes = {
    selectedYear: PropTypes.number.isRequired,
    setSelectedYear: PropTypes.func.isRequired,
    dateRange: PropTypes.array.isRequired,
    setDateRange: PropTypes.func.isRequired,
  };

  const [data, setData] = useState([]);
  const [showEvents, setShowEvents] = useState(true);
  const [showEmptyDays, setShowEmptyDays] = useState(false);

  const fetchData = useCallback(async (range) => {
    try {
      const response = await axios.get(
        `/api/dashboard/capacity_utilization?start_date=${range[0].format(
          "YYYY-MM-DD"
        )}&end_date=${range[1].format("YYYY-MM-DD")}`
      );
      const fetchedData = response.data;

      const labels = [];
      let currentDate = range[0].clone();
      while (currentDate.isBefore(range[1]) || currentDate.isSame(range[1])) {
        labels.push(currentDate.format("DD.MM.YYYY"));
        currentDate = currentDate.add(1, "day");
      }

      const dataMap = new Map();
      fetchedData.forEach((d) => {
        dataMap.set(dayjs(d.date).format("YYYY-MM-DD"), d);
      });

      const totalCapacityData = await fetchTotalCapacity(range);
      const capacityMap = new Map();
      totalCapacityData.forEach((d) => {
        capacityMap.set(dayjs(d.day).format("YYYY-MM-DD"), d.total_capacity);
      });

      const completeData = labels.map((label) => {
        const originalDate = dayjs(label, "DD.MM.YYYY").format("YYYY-MM-DD");
        if (dataMap.has(originalDate)) {
          const data = dataMap.get(originalDate);
          data.date = label;
          data.total_capacity = capacityMap.get(originalDate) || 0;
          return data;
        }
        return {
          date: label,
          total_capacity: capacityMap.get(originalDate) || 0,
          total_demand: 0,
          events: [],
        };
      });

      setData(completeData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

  const fetchTotalCapacity = async (range) => {
    try {
      const response = await axios.get(
        `/api/dashboard/total_capacity?start_date=${range[0].format(
          "YYYY-MM-DD"
        )}&end_date=${range[1].format("YYYY-MM-DD")}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching total capacity data:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange, selectedYear, fetchData]);

  const handleDateRangeChange = (dates) => {
    const selectedYear = dates[1].year();
    setSelectedYear(selectedYear);
    setDateRange(dates);
  };

  const filteredData = showEmptyDays
    ? data.filter((d) => d.events.length > 0)
    : data;

  const labels = filteredData.map((d) => d.date);
  const datasets = [];
  let hasOrangeBorder = false;
  let hasRedBorder = false;

  if (showEvents) {
    const eventsMap = new Map();
    filteredData.forEach((d) => {
      const utilization = (d.total_demand / d.total_capacity) * 100;
      const borderColor =
        utilization > RED_BORDER_THRESHOLD
          ? "red"
          : utilization > ORANGE_BORDER_THRESHOLD
          ? "orange"
          : "transparent";

      if (borderColor === "orange") hasOrangeBorder = true;
      if (borderColor === "red") hasRedBorder = true;

      d.events.forEach((event) => {
        if (!eventsMap.has(event.event_id)) {
          eventsMap.set(event.event_id, {
            label: event.event_name,
            backgroundColor: applyTransparency(event.event_color),
            borderColor: Array(filteredData.length).fill("transparent"),
            borderWidth: Array(filteredData.length).fill(0),
            data: Array(filteredData.length).fill(0),
            datalabels: {
              anchor: "center",
              align: "center",
              color: "#000000",
              font: {
                size: FONT_SIZE,
              },
            },
          });
        }
        const dataset = eventsMap.get(event.event_id);
        const index = filteredData.findIndex((e) => e.date === d.date);
        dataset.data[index] = event.capacity;
        dataset.borderColor[index] = borderColor;
        dataset.borderWidth[index] = borderColor === "transparent" ? 0 : 2;
      });
    });

    eventsMap.forEach((dataset) => datasets.push(dataset));

    datasets.push({
      label: FREE_CAPACITY_LABEL,
      backgroundColor: applyTransparency(FREE_CAPACITY_COLOR),
      borderColor: applyTransparency(FREE_CAPACITY_COLOR),
      borderWidth: 2,
      data: filteredData.map((d) =>
        d.total_capacity - d.total_demand > 0
          ? d.total_capacity - d.total_demand
          : 0
      ),
      datalabels: {
        anchor: "end",
        align: "start",
        font: {
          size: FONT_SIZE,
        },
      },
    });
  } else {
    datasets.push({
      label: TOTAL_CAPACITY_UTILIZATION_LABEL,
      backgroundColor: applyTransparency(TOTAL_CAPACITY_UTILIZATION_COLOR),
      borderColor: filteredData.map((d) => {
        const utilization = (d.total_demand / d.total_capacity) * 100;
        return utilization > RED_BORDER_THRESHOLD
          ? "red"
          : utilization > ORANGE_BORDER_THRESHOLD
          ? "orange"
          : "transparent";
      }),
      borderWidth: filteredData.map((d) => {
        const utilization = (d.total_demand / d.total_capacity) * 100;
        return utilization > ORANGE_BORDER_THRESHOLD ? 2 : 0;
      }),
      data: filteredData.map((d) => d.total_demand),
      datalabels: {
        anchor: "center",
        align: "center",
        color: "#000000",
        font: {
          size: FONT_SIZE,
        },
      },
    });

    datasets.push({
      label: FREE_CAPACITY_LABEL,
      backgroundColor: applyTransparency(FREE_CAPACITY_COLOR),
      borderColor: applyTransparency(FREE_CAPACITY_COLOR),
      borderWidth: 2,
      borderDash: [5, 5],
      data: filteredData.map((d) =>
        d.total_capacity - d.total_demand > 0
          ? d.total_capacity - d.total_demand
          : 0
      ),
      datalabels: {
        anchor: "end",
        align: "start",
        color: "#000000",
        font: {
          size: FONT_SIZE,
        },
      },
    });
  }

  if (hasOrangeBorder) {
    datasets.push({
      label: "Utilization 80 - 100 %",
      backgroundColor: "white",
      borderColor: "orange",
      borderWidth: 2,
      data: [],
      datalabels: {
        display: false,
      },
    });
  }

  if (hasRedBorder) {
    datasets.push({
      label: "Utilization > 100 %",
      backgroundColor: "white",
      borderColor: "red",
      borderWidth: 2,
      data: [],
      datalabels: {
        display: false,
      },
    });
  }

  const capacity80Data = filteredData.map((d) => d.total_capacity * 0.8);
  const capacity100Data = filteredData.map((d) => d.total_capacity * 0.2);

  datasets.push({
    label: "80% Capacity",
    data: capacity80Data,
    borderColor: "orange",
    borderWidth: 1,
    type: "line",
    stepped: "before",
    borderDash: [5, 5],
    fill: false,
    pointRadius: 0,
    datalabels: {
      display: function (context) {
        return context.dataIndex === 0;
      },
      formatter: () => "80%",
      align: "start",
      anchor: "end",
      color: "orange",
      font: {
        weight: "bold",
        size: FONT_SIZE,
      },
      offset: -25,
      backgroundColor: "white",
    },
  });

  datasets.push({
    label: "100% Capacity",
    data: capacity100Data,
    borderColor: "red",
    borderWidth: 1,
    type: "line",
    stepped: "before",
    borderDash: [5, 5],
    fill: false,
    pointRadius: 0,
    datalabels: {
      display: function (context) {
        return context.dataIndex === 0;
      },
      formatter: () => "100% ",
      align: "start",
      anchor: "end",
      color: "red",
      font: {
        weight: "bold",
        size: FONT_SIZE,
      },
      offset: -25,
      backgroundColor: "white",
    },
  });
  const chartData = {
    labels: labels,
    datasets: datasets,
  };

  const options = {
    animation: {
      duration: ANIMATION_DURATION,
      easing: ANIMATION_EASING,
    },
    scales: {
      x: {
        stacked: STACKED,
        title: {
          display: DISPLAY,
          text: "Day",
        },
      },
      y: {
        stacked: STACKED,
        title: {
          display: DISPLAY,
          text: "Car units",
        },
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value >= 0 ? value : 0;
          },
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const index = context.dataIndex;
            const totalCapacity = filteredData[index]?.total_capacity || 0;
            const absoluteValue = context.raw;
            const label = context.dataset.label;
            const event = filteredData[index]?.events?.find(
              (e) => e.event_name === label
            );
            const lotsInfo =
              event?.parking_lots
                ?.map((lot) => `${lot.name}: ${lot.capacity}`)
                .join(", ") || "";
            return lotsInfo
              ? `${label}: ${absoluteValue} (${totalCapacity})\n${TOOLTIP_CALLBACK_LOTS_INFO}${lotsInfo}`
              : `${label}: ${absoluteValue} (${totalCapacity})`;
          },
        },
      },
      datalabels: {
        display: function (context) {
          if (labels.length > 31) return false;
          const dataset = context.dataset;
          const value = dataset.data[context.dataIndex];
          const totalCapacity =
            filteredData[context.dataIndex]?.total_capacity || 0;
          return value > 15 && (value / totalCapacity) * 100 > 5;
        },
        formatter: (value, context) => {
          const totalDemand = value;
          const totalCapacity =
            filteredData[context.dataIndex]?.total_capacity || 0;
          const percentage = totalCapacity
            ? Math.round((totalDemand / totalCapacity) * 100)
            : 0;
          return `${percentage}%`;
        },
        color: function (context) {
          return context.dataset.datalabels.color;
        },
        anchor: function (context) {
          return context.dataset.datalabels.anchor;
        },
        align: function (context) {
          return context.dataset.datalabels.align;
        },
        offset: 5,
        font: {
          size: FONT_SIZE,
        },
      },
      legend: {
        display: DISPLAY,
        position: LEGEND_POSITION,
        labels: {
          filter: function (legendItem) {
            return (
              legendItem.text !== "100% Capacity" &&
              legendItem.text !== "80% Capacity"
            );
          },
        },
        onClick: null, 
      },
    },
    title: {
      display: DISPLAY,
      text: TITLE,
      fontSize: FONT_SIZE_TITLE,
    },
  };

  return (
    <div className="capacity-utilization">
      <Box className="iconHeadline__container">
        <BarChartRoundedIcon />{" "}
        <Typography variant="h5" gutterBottom>
          {TITLE}
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <DateRangePicker
          dateRange={dateRange}
          setDateRange={handleDateRangeChange}
          enabledPresets={[
            "currentWeek",
            "nextWeek",
            "currentMonth",
            "nextMonth",
            "thisYear",
            "nextYear",
            "months",
          ]}
        />
        <Box
          display="flex"
          alignItems="center"
          gap=".6rem"
          className="switch-container"
        >
          <FormControlLabel
            control={
              <Switch
                checked={showEvents}
                onChange={() => setShowEvents(!showEvents)}
                className="switch"
              />
            }
            label="Show Events"
            className="switch-label"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showEmptyDays}
                onChange={() => setShowEmptyDays(!showEmptyDays)}
                className="switch"
              />
            }
            label="Hide days without events"
            className="switch-label"
          />
        </Box>
      </Box>

      {filteredData.every(
        (d) => d.total_capacity === 0 && d.total_demand === 0
      ) ? (
        <div className="no-data">{NO_DATA_MESSAGE}</div>
      ) : (
        <Bar data={chartData} options={options} className="chart" />
      )}
    </div>
  );
};

export default CapacityUtilization;
