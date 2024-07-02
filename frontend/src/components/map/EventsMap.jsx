import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import PropTypes from "prop-types";
import { Box, Button } from "@mui/material";
import dayjs from "dayjs";
import MapLegendComponent from "./MapLegend.jsx";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import "leaflet/dist/leaflet.css";
import CenterFocusStrongRoundedIcon from "@mui/icons-material/CenterFocusStrongRounded";

const DOWNWARD_OVERLAYS = [
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
  "North East",
  "North West",
  "North",
  "PWest",
  "PM3",
  "PM4",
  "PM5",
  "PN3",
  "PN4",
  "PN5",
  "PN6",
  "PN7",
  "PN8",
  "PN9",
  "PN10",
  "PN11",
  "PN12",
];

const MAP_BOUNDS = [
  [48.146965, 11.672466],
  [48.126979, 11.718895],
];

const RUNTIME = 0.9;
const NOT_RUNTIME = 0.5;
const GREYED_OUT = 0.25;
const MAP_CENTER_POS = [48.1375, 11.702];

const EventsMap = ({ selectedDate, zoom, selectedEventId, mapData }) => {
  console.log("zoom", zoom);
  const {
    coordinates = { halls: [], entrances: [], parking_lots: [] },
    events_timeline = [],
    parking_lots_allocations = [],
    parking_lots_capacity = [],
  } = mapData || {};

  const transformCoordinates = (originalCoords) => {
    const transformedCoords = [];
    for (let i = 0; i < originalCoords.length; i += 2) {
      transformedCoords.push([originalCoords[i], originalCoords[i + 1]]);
    }
    return transformedCoords;
  };

  const getEventStatus = (event, date) => {
    const eventDate = dayjs(date);
    if (
      eventDate.isSame(event.assembly_start_date, "day") ||
      eventDate.isSame(event.assembly_end_date, "day") ||
      eventDate.isBetween(
        event.assembly_start_date,
        event.assembly_end_date,
        null,
        "[]"
      )
    ) {
      return "assembly";
    } else if (
      eventDate.isSame(event.runtime_start_date, "day") ||
      eventDate.isSame(event.runtime_end_date, "day") ||
      eventDate.isBetween(
        event.runtime_start_date,
        event.runtime_end_date,
        null,
        "[]"
      )
    ) {
      return "runtime";
    } else if (
      eventDate.isSame(event.disassembly_start_date, "day") ||
      eventDate.isSame(event.disassembly_end_date, "day") ||
      eventDate.isBetween(
        event.disassembly_start_date,
        event.disassembly_end_date,
        null,
        "[]"
      )
    ) {
      return "disassembly";
    }
    return "unknown";
  };

  const getPopupContent = (event, id, type) => {
    const status = getEventStatus(event, selectedDate);
    const parkingLots = event[`${status}_parking_lots`] || "None";
    const entrances = event.event_entrance || "None";
    if (type === "hall" && event.halls && event.halls.includes(id)) {
      return (
        <div className="cap">
          <h4>{event.event_name}</h4>
          <p>Status: {status}</p>
          <p>Entrance: {entrances}</p>
          <p>Allocated Parking Lots: {parkingLots}</p>
          <div className="details-link_container">
            <a href={`/events/event/${event.event_id}`}>
              <LinkRoundedIcon />
              {event.event_name} Details
            </a>
          </div>
        </div>
      );
    } else if (type === "entrance" && event.event_entrance) {
      return (
        <div className="cap">
          <h4>{event.event_name}</h4>
          <p>Status: {status}</p>
          <p>Allocated Halls: {event.halls}</p>
          <p>Allocated Parking Lots: {parkingLots}</p>
          <div className="details-link_container">
            <a href={`/events/event/${event.event_id}`}>
              <LinkRoundedIcon />
              {event.event_name} Details
            </a>
          </div>
        </div>
      );
    } else {
      return (
        <div className="cap">
          <h4>{event.event_name}</h4>
          <p>Status: {status}</p>
          <p>Entrance: {entrances}</p>
          <p>Associated Halls: {event.halls}</p>
          <div className="details-link_container">
            <a href={`/events/event/${event.event_id}`}>
              <LinkRoundedIcon />
              {event.event_name} Details
            </a>
          </div>
        </div>
      );
    }
  };

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
          "[]"
        ) ||
        dayjs(selectedDate).isSame(event.disassembly_end_date, "day")
    )
  );

  const SetZoomLevel = ({ zoom }) => {
    const map = useMap();

    useEffect(() => {
      map.options.zoomSnap = 0;
      map.setZoom(zoom);
    }, [map, zoom]);

    return null;
  };

  const renderParkingLotOverlay = (parkingLot, index) => {
    const transformedCoords = transformCoordinates(parkingLot.coordinates);
    const allocations = parking_lots_allocations.filter(
      (allocation) => allocation.parking_lot_id === parkingLot.id
    );

    const parkingLotCapacity =
      parking_lots_capacity.find((capacity) => capacity.id === parkingLot.id)
        ?.capacity || 0;

    if (allocations.length === 0 || parkingLotCapacity === 0) {
      return (
        <Polygon
          key={parkingLot.name}
          positions={transformedCoords}
          className={`parking-lots parking-lot-${parkingLot.name}`}
          pathOptions={{
            color: "transparent",
            fillColor: "gray",
            fillOpacity: GREYED_OUT,
            weight: 2,
          }}
        >
          <Tooltip
            direction="center"
            offset={[0, 0]}
            permanent
            className="tags-parking-lots"
          >
            <span>{parkingLot.name}</span>
          </Tooltip>
          <Popup autoPan={false}>
            <span>{parkingLot.name}: No Event!</span>
          </Popup>
        </Polygon>
      );
    }

    const fillColors = allocations.map((allocation) => ({
      color: allocation.event_color,
      percentage: allocation.allocated_capacity / parkingLotCapacity,
    }));

    const usedCapacityPercentage = fillColors.reduce(
      (acc, cur) => acc + cur.percentage,
      0
    );
    const freeCapacityPercentage = 1 - usedCapacityPercentage;

    if (freeCapacityPercentage > 0) {
      fillColors.push({
        color: "rgba(128, 128, 128, 0.25)",
        percentage: freeCapacityPercentage,
      });
    }

    const gradientStops = fillColors.map((fillColor, index) => {
      const previousPercentage = fillColors
        .slice(0, index)
        .reduce((acc, cur) => acc + cur.percentage, 0);
      const currentPercentage = previousPercentage + fillColor.percentage;
      return (
        <React.Fragment key={index}>
          <stop
            offset={`${previousPercentage * 100}%`}
            stopColor={fillColor.color}
          />
          <stop
            offset={`${currentPercentage * 100}%`}
            stopColor={fillColor.color}
          />
        </React.Fragment>
      );
    });

    const gradientId = `gradient-${index}-${parkingLot.id}`;

    return (
      <React.Fragment key={parkingLot.name}>
        <svg style={{ height: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
              {gradientStops}
            </linearGradient>
          </defs>
        </svg>
        <Polygon
          positions={transformedCoords}
          className={`parking-lots parking-lot-${parkingLot.name}`}
          pathOptions={{
            fillColor: `url(#${gradientId})`,
            fillOpacity: 1,
            weight: 2,
            color: "transparent",
          }}
        >
          <Tooltip
            direction="center"
            offset={[0, 0]}
            permanent
            className="tags-parking-lots"
          >
            <span>{parkingLot.name}</span>
          </Tooltip>
          <Popup autoPan={false}>
            <div>
              <div className="popup-title">
                <span>{parkingLot.name}</span>
              </div>
              <div className="popup-table">
                <div className="popup-header">Event</div>
                <div className="popup-header car-units">Car units</div>
                <div className="popup-header">Percentage</div>
                {allocations.map((allocation, index) => {
                  const textColor = getContrastingTextColor(
                    allocation.event_color
                  );
                  return (
                    <React.Fragment key={index}>
                      <div className="details-link_container">
                        <a
                          href={`/events/event/${allocation.event_id}`}
                          style={{
                            backgroundColor: allocation.event_color,
                            color: textColor,
                          }}
                        >
                          <LinkRoundedIcon style={{ color: textColor }} />
                          {allocation.event_name}
                        </a>
                      </div>
                      <div
                        className="popup-table-cell"
                        style={{
                          backgroundColor: allocation.event_color,
                          color: textColor,
                        }}
                      >
                        {allocation.allocated_capacity}
                      </div>
                      <div
                        className="popup-table-cell"
                        style={{
                          backgroundColor: allocation.event_color,
                          color: textColor,
                        }}
                      >
                        {(
                          (allocation.allocated_capacity / parkingLotCapacity) *
                          100
                        ).toFixed(2)}
                        %
                      </div>
                    </React.Fragment>
                  );
                })}
                {freeCapacityPercentage > 0 && (
                  <React.Fragment>
                    <div className="popup-table-cell-footer capacity">
                      <strong>Free Capacity</strong>
                    </div>
                    <div className="popup-table-cell-footer">
                      <strong>
                        {Math.round(
                          freeCapacityPercentage * parkingLotCapacity
                        )}
                      </strong>
                    </div>
                    <div className="popup-table-cell-footer percentage">
                      <strong>
                        {(freeCapacityPercentage * 100).toFixed(2)}%
                      </strong>
                    </div>
                  </React.Fragment>
                )}
              </div>
            </div>
          </Popup>
        </Polygon>
      </React.Fragment>
    );
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

  const getContrastingTextColor = (backgroundColor) => {
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "black" : "white";
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

      {coordinates.halls.map((hall) => {
        const transformedCoords = transformCoordinates(hall.coordinates);
        const event = uniqueFilteredEvents.find((event) =>
          event.halls ? event.halls.split(", ").includes(hall.name) : false
        );
        const fillColor = selectedEventId
          ? event && event.event_id === selectedEventId
            ? `${event.event_color}`
            : "gray"
          : event
          ? `${event.event_color}`
          : "gray";
        const borderColor = event ? `${event.event_color}` : "transparent";
        const opacity = selectedEventId
          ? event && event.event_id === selectedEventId
            ? getEventStatus(event, selectedDate) === "runtime"
              ? RUNTIME
              : NOT_RUNTIME
            : GREYED_OUT
          : event && getEventStatus(event, selectedDate) === "runtime"
          ? RUNTIME
          : NOT_RUNTIME;

        return (
          <Polygon
            key={hall.name}
            positions={transformedCoords}
            className={`halls hall-${hall.name}`}
            pathOptions={{
              color: borderColor,
              fillColor: fillColor,
              fillOpacity: opacity,
              weight: 2,
            }}
          >
            <Tooltip
              direction="center"
              offset={[0, 0]}
              permanent
              className="tags-halls"
            >
              <span>{hall.name}</span>
            </Tooltip>
            <Popup autoPan={false}>
              {event ? (
                getPopupContent(event, hall.name, "hall")
              ) : (
                <span>{hall.name}: No Event!</span>
              )}
            </Popup>
          </Polygon>
        );
      })}

      {coordinates.entrances.map((entrance) => {
        const transformedCoords = transformCoordinates(entrance.coordinates);
        const event = uniqueFilteredEvents.find((event) =>
          event.event_entrance
            ? event.event_entrance.includes(entrance.name)
            : false
        );
        const fillColor = selectedEventId
          ? event && event.event_id === selectedEventId
            ? `${event.event_color}`
            : "gray"
          : event
          ? `${event.event_color}`
          : "gray";
        const borderColor = event ? `${event.event_color}` : "transparent";
        const opacity = selectedEventId
          ? event && event.event_id === selectedEventId
            ? getEventStatus(event, selectedDate) === "runtime"
              ? RUNTIME
              : NOT_RUNTIME
            : GREYED_OUT
          : event && getEventStatus(event, selectedDate) === "runtime"
          ? RUNTIME
          : NOT_RUNTIME;
        const popupOffset = DOWNWARD_OVERLAYS.includes(entrance.name)
          ? [0, 50]
          : [0, 0];

        return (
          <Polygon
            key={entrance.name}
            positions={transformedCoords}
            className={`entrances entrance-${entrance.name}`}
            pathOptions={{
              color: borderColor,
              fillColor: fillColor,
              fillOpacity: opacity,
              weight: 2,
            }}
          >
            <Tooltip
              direction="center"
              offset={[0, 0]}
              permanent
              className="tags-entrances"
            >
              <span>{entrance.name}</span>
            </Tooltip>
            <Popup autoPan={false} offset={popupOffset}>
              {event ? (
                getPopupContent(event, entrance.name, "entrance")
              ) : (
                <span>{entrance.name}: No Event!</span>
              )}
            </Popup>
          </Polygon>
        );
      })}

      {coordinates.parking_lots.map((parkingLot, index) =>
        renderParkingLotOverlay(parkingLot, index)
      )}
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
