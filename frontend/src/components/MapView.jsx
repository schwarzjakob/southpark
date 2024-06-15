// src/components/MapView.jsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import TimelineSlider from "./TimelineSlider.jsx";
import MapComponent from "./MapComponent.jsx";
import DateInputComponent from "./DateInputComponent.jsx";
import MapIcon from "@mui/icons-material/MapRounded";
import axios from "axios";
import "../styles/mapView.css";
import dayjs from "dayjs";

const TITLE = "Map View";

const MapView = () => {
  const location = useLocation();
  const initialDate =
    location.state?.selectedDate || dayjs().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await axios.get(
          `/api/events_timeline/${selectedDate}`,
        );
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, [selectedDate]);

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
          >
            <DateInputComponent
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </Box>
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
          className="map__map-component"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="1px solid"
          borderColor="grey.300"
          p={2}
        >
          <MapComponent
            selectedDate={selectedDate}
            events={events}
            zoom={15.5}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default MapView;
