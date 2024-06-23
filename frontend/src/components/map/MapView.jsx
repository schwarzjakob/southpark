// src/components/MapView.jsx
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { Switch } from "antd";
import TimelineSlider from "./TimelineSlider.jsx";
import MapComponent from "./Map.jsx";
import OccupanciesBarChart from "./OccupanciesBarChart.jsx";
import MapIcon from "@mui/icons-material/MapRounded";
import "./styles/mapView.css";
import dayjs from "dayjs";

const TITLE = "Map View";

const MapView = () => {
  const location = useLocation();
  const initialDate =
    location.state?.selectedDate || dayjs().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [events] = useState([]);
  const [isPercentage, setIsPercentage] = useState(true);

  const handleToggle = () => {
    setIsPercentage(!isPercentage);
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Box>
      <Box display="flex" flexDirection="column" gap={2}>
        <Box
          className="mapView__title"
          display="flex"
          flexDirection="row"
          alignContent="center"
          gap={2}
        >
          <Box className="iconHeadline__container">
            <MapIcon className="demandTable__icon" />{" "}
            <Typography
              variant="h4"
              gutterBottom
              className="demandTable__title"
            >
              {TITLE}
            </Typography>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="left"
            borderColor="grey.300"
            p={1}
          ></Box>
        </Box>
        <Box
          className="map__timeline-slider"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="1px solid"
          borderColor="grey.300"
          p={2}
        >
          <TimelineSlider
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            events={events}
          />
        </Box>
        <Box
          className="map__main-content"
          display="flex"
          alignItems="stretch"
          justifyContent="center"
          width="100%"
          height="70vh"
          gap={2}
        >
          <Box
            className="map__map-component"
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="1px solid"
            borderColor="grey.300"
            p={2}
            width="70vw"
            height="100%"
          >
            <MapComponent
              selectedDate={selectedDate}
              events={events}
              zoom={15.5}
            />
          </Box>
          <Box
            className="map__bar-chart-component"
            display="flex"
            flexDirection={"column"}
            alignItems="center"
            justifyContent="flex-start"
            border="1px solid"
            borderColor="grey.300"
            width="30vw"
            height={"100%"}
            overflow={"auto"}
          >
            <Box className="chart-header">
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    color: "var(--textColor)",
                    padding: "0.3rem",
                  }}
                >
                  {"Parking Lot Utilization"} | {formattedDate}
                </Typography>
              </Box>
              <Box
                className="switch-container"
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  fontSize: "0.8rem",
                  alignItems: "center",
                  padding: "0.3rem",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    marginRight: "0.5rem",
                  }}
                >
                  {isPercentage ? "Percentage" : "Absolute"}
                </Typography>
                <Switch
                  checked={isPercentage}
                  onChange={handleToggle}
                  className="switch"
                  size="small"
                />
              </Box>
            </Box>
            <OccupanciesBarChart
              className="bar-chart"
              selectedDate={selectedDate}
              isPercentage={isPercentage}
              handleToggle={handleToggle}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MapView;
