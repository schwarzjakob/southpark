import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import PropTypes from "prop-types";
import { Box, Button } from "@mui/material";
import dayjs from "dayjs";
import MapLegendComponent from "./MapLegend.jsx";
import ParkingPopup from "./EventsMapParkingLotPopup.jsx";
import EntrancePopup from "./EntrancePopup.jsx";
import HallPopup from "./HallPopup.jsx";
import NoEventsOverlay from "./NoEventsOverlay";
import "leaflet/dist/leaflet.css";
import CenterFocusStrongRoundedIcon from "@mui/icons-material/CenterFocusStrongRounded";

const MAP_BOUNDS = [
  [48.146965, 11.672466],
  [48.126979, 11.718895],
];

const GREYED_OUT = 0.25;
const MAP_CENTER_POS = [48.1375, 11.702];

const EventsMap = ({ selectedDate, zoom, selectedEventId, mapData }) => {
  const {
    coordinates = { halls: [], entrances: [], parking_lots: [] },
    events_timeline = [],
    parking_lots_allocations = [],
    parking_lots_capacity = [],
  } = mapData || {};

  const removeDuplicateEvents = (events) => {
    const seen = new Set();
    return events.filter((event) => {
      const isDuplicate = seen.has(event.event_name);
      seen.add(event.event_name);
      return !isDuplicate;
    });
  };

  const uniqueFilteredEvents = removeDuplicateEvents(
    events_timeline.filter(
      (event) =>
        dayjs(selectedDate).isSame(event.assembly_start_date, "day") ||
        dayjs(selectedDate).isBetween(
          event.assembly_start_date,
          event.disassembly_end_date,
          null,
          "[]",
        ) ||
        dayjs(selectedDate).isSame(event.disassembly_end_date, "day"),
    ),
  );

  if (uniqueFilteredEvents.length === 0) {
    return <NoEventsOverlay />;
  }

  const SetZoomLevel = ({ zoom }) => {
    const map = useMap();

    useEffect(() => {
      map.options.zoomSnap = 0;
      map.setZoom(zoom);
    }, [map, zoom]);

    return null;
  };

  const RecenterButton = () => {
    const map = useMap();

    const handleRecenter = () => {
      map.setView(MAP_CENTER_POS, zoom);
    };

    return (
      <Box className="recenter-container" zIndex={1000}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRecenter}
          className="recenter-button"
          startIcon={<CenterFocusStrongRoundedIcon />}
        ></Button>
      </Box>
    );
  };

  return (
    <MapContainer
      center={MAP_CENTER_POS}
      zoom={zoom}
      scrollWheelZoom={false}
      zoomControl={true}
      dragging={true}
      touchZoom={true}
      doubleClickZoom={true}
      keyboard={false}
      zoomSnap={0.3}
      zoomDelta={0.3}
      maxBounds={MAP_BOUNDS}
      maxBoundsViscosity={1}
      minZoom={14}
      maxZoom={17}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SetZoomLevel zoom={15.5} />
      <RecenterButton />
      <MapLegendComponent
        events={uniqueFilteredEvents}
        selectedDate={selectedDate}
      />

      {coordinates.halls.map((hall, index) => (
        <HallPopup
          key={hall.name}
          hall={hall}
          index={index}
          events={uniqueFilteredEvents}
          selectedDate={selectedDate}
          selectedEventId={selectedEventId}
          GREYED_OUT={GREYED_OUT}
        />
      ))}

      {coordinates.entrances.map((entrance, index) => (
        <EntrancePopup
          key={entrance.name}
          entrance={entrance}
          index={index}
          events={uniqueFilteredEvents}
          GREYED_OUT={0.8}
        />
      ))}

      {coordinates.parking_lots.map((parkingLot, index) => {
        const parkingLotCapacity = parking_lots_capacity.find(
          (capacity) => capacity.id === parkingLot.id,
        );

        const utilizationType = parkingLotCapacity?.utilization_type || "other";

        return (
          <ParkingPopup
            key={parkingLot.name}
            parkingLot={parkingLot}
            index={index}
            parking_lots_allocations={parking_lots_allocations}
            parking_lots_capacity={parking_lots_capacity}
            utilization_type={utilizationType}
            GREYED_OUT={GREYED_OUT}
          />
        );
      })}
    </MapContainer>
  );
};

EventsMap.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  zoom: PropTypes.number.isRequired,
  selectedEventId: PropTypes.number,
  mapData: PropTypes.object,
};

export default EventsMap;
