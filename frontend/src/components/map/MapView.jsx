// src/components/MapView.jsx
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
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
            width="75vw"
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
            alignItems="center"
            justifyContent="center"
            border="1px solid"
            borderColor="grey.300"
            width="25vw"
            height={"100%"}
            overflow={"auto"}
          >
            <OccupanciesBarChart
              className="bar-chart"
              selectedDate={selectedDate}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MapView;
