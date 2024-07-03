import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { Switch } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./styles/map.css";
import TimelineSlider from "./TimelineSlider.jsx";
import EventsMap from "./EventsMap.jsx";
import Heatmap from "./HeatMap.jsx";
import LoadingAnimation from "../common/LoadingAnimation.jsx";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import HorizontalSplitRoundedIcon from "@mui/icons-material/HorizontalSplitRounded";
import OccupanciesBarChart from "./OccupanciesBarChart.jsx";
import MapIcon from "@mui/icons-material/MapRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import axios from "axios";

const TITLE = "Map";

const MapPage = () => {
  const location = useLocation();
  const initialDate =
    location.state?.selectedDate || dayjs().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [events] = useState([]);
  const [isPercentage, setIsPercentage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEventId] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [mapData, setMapData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialFetch, setInitialFetch] = useState(true);
  const [reloading, setReloading] = useState(false);
  const navigate = useNavigate();

  const currentFetchedTimeRange = useRef({
    start: dayjs().subtract(365, "days"),
    end: dayjs().add(365, "days"),
  });

  const fetchMapData = useCallback(
    async (date) => {
      if (initialLoading) {
        setLoading(true);
      }
      if (!initialLoading) {
        setReloading(true);
      }
      try {
        const { data } = await axios.get(`/api/map/map_data/${date}`);
        setMapData(data);

        const start = dayjs(date).subtract(365, "days");
        const end = dayjs(date).add(365, "days");
        currentFetchedTimeRange.current = { start, end };
      } catch (error) {
        console.error("Error fetching map data:", error);
      } finally {
        if (initialLoading) {
          setLoading(false);

          setInitialLoading(false);
        }
        setReloading(false);
      }
    },
    [initialLoading]
  );

  useEffect(() => {
    if (initialFetch) {
      fetchMapData(selectedDate);
      setInitialFetch(false);
    }
  }, [fetchMapData, selectedDate, initialFetch]);

  useEffect(() => {
    if (
      currentFetchedTimeRange.current.start &&
      currentFetchedTimeRange.current.end
    ) {
      const start = currentFetchedTimeRange.current.start;
      const end = currentFetchedTimeRange.current.end;
      const selected = dayjs(selectedDate);

      const withinFetchedRange =
        selected.isAfter(start.add(0.2 * 365, "days")) &&
        selected.isBefore(end.subtract(0.2 * 365, "days"));
      if (!withinFetchedRange) {
        fetchMapData(selectedDate);
      }
    }
  }, [fetchMapData, selectedDate, reloading]);

  const filterDataForSelectedDay = (data, date) => {
    const selectedDay = dayjs(date);

    const filteredParkingLotsAllocations = data.parking_lots_allocations.filter(
      (allocation) => {
        return dayjs(allocation.date).isSame(selectedDay, "day");
      }
    );

    const filteredParkingLotsCapacity = data.parking_lots_capacity.filter(
      (capacity) => {
        return dayjs(capacity.date).isSame(selectedDay, "day");
      }
    );

    const filteredParkingLotsOccupancy = data.parking_lots_occupancy.filter(
      (occupancy) => {
        return dayjs(occupancy.date).isSame(selectedDay, "day");
      }
    );

    return {
      ...data,
      parking_lots_allocations: filteredParkingLotsAllocations,
      parking_lots_capacity: filteredParkingLotsCapacity,
      parking_lots_occupancy: filteredParkingLotsOccupancy,
    };
  };

  const handleToggle = () => {
    setIsPercentage(!isPercentage);
  };

  const toggleMap = () => {
    setShowHeatmap(!showHeatmap);
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  if (loading) {
    return <LoadingAnimation />;
  }

  const mapDataForSelectedDay = filterDataForSelectedDay(mapData, selectedDate);

  return (
    <Box>
      <Box display="flex" flexDirection="column" gap={2}>
        <Box className="form-headline-button__container">
          <Box className="iconHeadline__container">
            <MapIcon />
            <Typography variant="h4" gutterBottom>
              {TITLE}
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate(`/event/add`)}
            >
              <Box display="flex" alignItems="center">
                <AddRoundedIcon className="icon__edit-parking-space" />
              </Box>
              Add Event
            </Button>
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
            mapData={mapData}
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
            {showHeatmap ? (
              <Heatmap
                selectedDate={selectedDate}
                zoom={15.5}
                mapData={mapDataForSelectedDay}
              />
            ) : (
              <EventsMap
                selectedDate={selectedDate}
                zoom={15.5}
                mapData={mapDataForSelectedDay}
                selectedEventId={selectedEventId}
              />
            )}
            <Box className="map-switch-container">
              <Button
                className="map-switch-btn"
                variant="contained"
                onClick={toggleMap}
                startIcon={
                  showHeatmap ? (
                    <HorizontalSplitRoundedIcon />
                  ) : (
                    <LocalFireDepartmentRoundedIcon />
                  )
                }
              >
                {showHeatmap ? "Switch to Events Map" : "Switch to Heatmap"}
              </Button>
            </Box>
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
                className="switch-container switch-container-bar-chart"
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  alignContent: "center",
                  gap: "0.8rem",
                  fontSize: "0.5center",
                  padding: "0.3rem",
                  width: "100%",
                }}
              >
                <Typography sx={{ fontSize: "0.8rem" }}># Absolute</Typography>
                <Switch
                  checked={isPercentage}
                  onChange={handleToggle}
                  className="switch"
                  size="small"
                />
                <Typography sx={{ fontSize: "0.8rem" }}>
                  % Percentage
                </Typography>
              </Box>
            </Box>
            <OccupanciesBarChart
              className="bar-chart"
              selectedDate={selectedDate}
              mapData={mapDataForSelectedDay}
              isPercentage={isPercentage}
              handleToggle={handleToggle}
              reloading={reloading}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MapPage;
