import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import { Box, Button } from "@mui/material";
import CenterFocusStrongRoundedIcon from "@mui/icons-material/CenterFocusStrongRounded";
import MapLegendComponent from "./MapLegend.jsx";
import HeatMapParkingLotPopup from "./HeatMapParkingLotPopup.jsx";
import EntrancePopup from "./EntrancePopup.jsx";
import HallPopup from "./HallPopup.jsx";
import NoEventsOverlay from "./NoEventsOverlay";
import "leaflet/dist/leaflet.css";

const MAP_BOUNDS = [
  [48.146965, 11.672466],
  [48.126979, 11.718895],
];

const COLOR_OCCUPIED = "#ff434375";
const COLOR_FREE = "#6a91ce75";
const MAP_CENTER_POS = [48.1375, 11.702];

const Heatmap = ({ selectedDate, zoom, mapData }) => {
  const {
    coordinates = { halls: [], entrances: [], parking_lots: [] },
    events_timeline = [],
    parking_lots_occupancy = [],
    parking_lots_capacity = [],
    parking_lots_allocations = [],
  } = mapData || {};

  const [events, setEvents] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [capacity, setCapacity] = useState([]);
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    setEvents(events_timeline);
    setCapacity(parking_lots_capacity);
    setAllocations(parking_lots_allocations);

    const combinedData = parking_lots_occupancy.map((occ) => {
      const capacityData = parking_lots_capacity.find(
        (cap) => cap.name === occ.parking_lot_name,
      );
      return {
        ...occ,
        total_capacity: capacityData ? capacityData.capacity : 0,
        utilization_type: capacityData
          ? capacityData.utilization_type
          : "other",
      };
    });
    setOccupancy(combinedData);
  }, [
    coordinates,
    events_timeline,
    parking_lots_occupancy,
    parking_lots_capacity,
    parking_lots_allocations,
  ]);

  const removeDuplicateEvents = (events) => {
    const seen = new Set();
    return events.filter((event) => {
      const isDuplicate = seen.has(event.event_name);
      seen.add(event.event_name);
      return !isDuplicate;
    });
  };

  const uniqueFilteredEvents = removeDuplicateEvents(
    events.filter(
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

      {uniqueFilteredEvents.length === 0 && <NoEventsOverlay />}

      {uniqueFilteredEvents.length > 0 && (
        <>
          {coordinates.entrances.map((entrance, index) => (
            <EntrancePopup
              key={entrance.name}
              entrance={entrance}
              index={index}
              events={uniqueFilteredEvents}
              GREYED_OUT={0.8}
            />
          ))}

          {coordinates.halls.map((hall, index) => (
            <HallPopup
              key={hall.name}
              hall={hall}
              index={index}
              events={uniqueFilteredEvents}
              selectedDate={selectedDate}
              selectedEventId={2}
              GREYED_OUT={0.8}
            />
          ))}

          {coordinates.parking_lots.map((parkingLot, index) => {
            const parkingLotCapacity = parking_lots_capacity.find(
              (capacity) => capacity.id === parkingLot.id,
            );

            const utilizationType =
              parkingLotCapacity?.utilization_type || "other";

            return (
              <HeatMapParkingLotPopup
                key={parkingLot.name}
                parkingLot={parkingLot}
                index={index}
                parking_lots_occupancy={occupancy}
                parking_lots_capacity={capacity}
                parking_lots_allocations={allocations}
                utilization_type={utilizationType} // Pass utilization_type
                COLOR_OCCUPIED={COLOR_OCCUPIED}
                COLOR_FREE={COLOR_FREE}
              />
            );
          })}
        </>
      )}
    </MapContainer>
  );
};

Heatmap.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  zoom: PropTypes.number.isRequired,
  mapData: PropTypes.object.isRequired,
};

export default Heatmap;
