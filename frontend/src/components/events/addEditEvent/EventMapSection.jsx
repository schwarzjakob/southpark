import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Box, Button, CircularProgress } from "@mui/material";
import Heatmap from "../../map/HeatMap.jsx";
import EventsMap from "../../map/EventsMap.jsx";
import TimelineSlider from "../../map/TimelineSlider.jsx";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import HorizontalSplitRoundedIcon from "@mui/icons-material/HorizontalSplitRounded";
import dayjs from "dayjs";
import PropTypes from "prop-types";

const filterDataForSelectedDay = (data, date) => {
  if (!data) return {};

  const selectedDay = dayjs(date);

  const filteredParkingLotsAllocations = (
    data.parking_lots_allocations || []
  ).filter((allocation) => dayjs(allocation.date).isSame(selectedDay, "day"));

  const filteredParkingLotsCapacity = (data.parking_lots_capacity || []).filter(
    (capacity) => dayjs(capacity.date).isSame(selectedDay, "day")
  );

  const filteredParkingLotsOccupancy = (
    data.parking_lots_occupancy || []
  ).filter((occupancy) => dayjs(occupancy.date).isSame(selectedDay, "day"));

  return {
    ...data,
    parking_lots_allocations: filteredParkingLotsAllocations,
    parking_lots_capacity: filteredParkingLotsCapacity,
    parking_lots_occupancy: filteredParkingLotsOccupancy,
  };
};

const EventMapSection = ({ event, events, selectedDate, setSelectedDate }) => {
  EventMapSection.propTypes = {
    event: PropTypes.object.isRequired,
    events: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectedDate: PropTypes.instanceOf(Date).isRequired,
    setSelectedDate: PropTypes.func.isRequired,
  };

  const [mapData, setMapData] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialFetch, setInitialFetch] = useState(true);
  const [reloading, setReloading] = useState(false);

  const currentFetchedTimeRange = useRef({
    start: dayjs().subtract(365, "days"),
    end: dayjs().add(365, "days"),
  });

  const fetchMapData = useCallback(
    async (date) => {
      if (initialLoading) {
        setMapLoading(true);
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
          setMapLoading(false);
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

  const toggleMap = () => {
    setShowHeatmap(!showHeatmap);
  };

  const mapDataForSelectedDay = filterDataForSelectedDay(mapData, selectedDate);

  return (
    <Box display="flex" flexDirection="column" gap="1rem">
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
          selectedEventId={parseInt(event.id)}
          mapData={mapData}
        />
      </Box>

      <Box
        className="map__main-content"
        display="flex"
        alignItems="stretch"
        justifyContent="center"
        width="100%"
        height="65vh"
        gap="1rem"
      >
        <Box
          className="map__map-component"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="1px solid"
          borderColor="grey.300"
          p={2}
          width="100%"
          height="100%"
        >
          {mapLoading ? (
            <CircularProgress />
          ) : showHeatmap ? (
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
              selectedEventId={parseInt(event.id)}
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
      </Box>
    </Box>
  );
};

export default EventMapSection;
