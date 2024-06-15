import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import dayjs from "dayjs";
import axios from "axios";

const colors = [
  "purple",
  "orange",
  "cyan",
  "pink",
  "teal",
  "indigo",
  "lime",
  "red",
  "deepOrange",
  "deepPurple",
  "lightBlue",
  "lightGreen",
  "yellow",
];

const MapComponent = ({ selectedDate, zoom }) => {
  MapComponent.propTypes = {
    selectedDate: PropTypes.string.isRequired,
    zoom: PropTypes.number.isRequired,
  };

  const [halls, setHalls] = useState([]);
  const [parkingLots, setParkingLots] = useState([]);
  const [entrances, setEntrances] = useState([]);
  const [events, setEvents] = useState([]);
  const [colorMapping, setColorMapping] = useState({});

  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        const { data } = await axios.get("/api/coordinates");
        if (data) {
          setEntrances(data.entrances);
          setHalls(data.halls);
          setParkingLots(data.parking_lots);
        }
      } catch (error) {
        console.error(
          "There was an error fetching the coordinates data!",
          error,
        );
      }
    };
    const fetchEvents = async () => {
      try {
        const { data } = await axios.get(
          `/api/events_timeline/${selectedDate}`,
        );
        if (data) {
          setEvents(data);
          const colorMap = {};
          data.forEach((event, index) => {
            if (!colorMap[event.event_name]) {
              colorMap[event.event_name] = colors[index % colors.length];
            }
          });
          setColorMapping(colorMap);
        }
      } catch (error) {
        console.error("There was an error fetching the events data!", error);
      }
    };

    fetchCoordinates();
    fetchEvents();
  }, [selectedDate]);

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
        "[]",
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
        "[]",
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
        "[]",
      )
    ) {
      return "disassembly";
    }
    return "unknown";
  };

  const getPopupContent = (event, id) => {
    const status = getEventStatus(event, selectedDate);
    const parkingLots = event[`${status}_parking_lots`] || "None";
    if (event.halls.includes(id)) {
      return (
        <div className="cap">
          <h4>{event.event_name}</h4>
          <p>Status: {status}</p>
          <p>Entrance: {event.event_entrance}</p>
          <p>Allocated Parking Lots: {parkingLots}</p>
        </div>
      );
    } else {
      return (
        <div className="cap">
          <h4>{event.event_name}</h4>
          <p>Status: {status}</p>
          <p>Entrance: {event.event_entrance}</p>
          <p>Associated Halls: {event.halls}</p>
        </div>
      );
    }
  };

  const getPolygonColor = (name) => {
    for (const event of events) {
      const halls = event.halls ? event.halls.split(", ") : [];
      const status = getEventStatus(event, selectedDate);
      const parkingLots = event[`${status}_parking_lots`]
        ? event[`${status}_parking_lots`].split(", ")
        : [];
      if (halls.includes(name) || parkingLots.includes(name)) {
        return `${colorMapping[event.event_name]}`;
      }
    }
    return "gray";
  };

  const getPolygonOpacity = (status) => {
    return status === "runtime" ? 0.9 : 0.3;
  };

  const filteredEvents = events.filter(
    (event) =>
      dayjs(selectedDate).isSame(event.assembly_start_date, "day") ||
      dayjs(selectedDate).isBetween(
        event.assembly_start_date,
        event.disassembly_end_date,
        null,
        "[]",
      ) ||
      dayjs(selectedDate).isSame(event.disassembly_end_date, "day"),
  );

  const SetZoomLevel = ({ zoom }) => {
    const map = useMap();

    useEffect(() => {
      map.options.zoomSnap = 0;
      map.setZoom(zoom);
    }, [map, zoom]);

    return null;
  };

  return (
    <MapContainer
      center={[48.1375, 11.702]}
      zoom={16}
      scrollWheelZoom={false}
      zoomControl={false}
      dragging={false}
      touchZoom={false}
      doubleClickZoom={false}
      keyboard={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SetZoomLevel zoom={15.5} />
      {/* Rendering halls */}
      {halls.map((hall) => {
        const transformedCoords = transformCoordinates(hall.coordinates);
        const color = getPolygonColor(hall.name);
        const event = filteredEvents.find((event) =>
          event.halls ? event.halls.split(", ").includes(hall.name) : false,
        );
        const status = event ? getEventStatus(event, selectedDate) : "unknown";
        const fillColor = event ? color : "gray";
        const opacity = event ? getPolygonOpacity(status) : 0.9;

        return (
          <Polygon
            key={hall.name}
            positions={transformedCoords}
            className={`halls hall-${hall.name}`}
            pathOptions={{
              color: fillColor,
              fillColor: fillColor,
              fillOpacity: opacity,
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
                getPopupContent(event, hall.name)
              ) : (
                <span>No Event!</span>
              )}
            </Popup>
          </Polygon>
        );
      })}
      {/* Rendering parking lots */}
      {entrances.map((entrance) => {
        const transformedCoords = transformCoordinates(entrance.coordinates);
        const color = getPolygonColor(entrance.name);
        const event = filteredEvents.find((event) =>
          event.entrance ? event.entrance === entrance.name : false,
        );
        const status = event ? getEventStatus(event, selectedDate) : "unknown";
        const fillColor = event ? color : "gray";
        const opacity = event ? getPolygonOpacity(status) : 0.9;

        return (
          <Polygon
            key={entrance.name}
            positions={transformedCoords}
            className={`entrances entrance-${entrance.name}`}
            pathOptions={{
              color: fillColor,
              fillColor: fillColor,
              fillOpacity: opacity,
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
            <Popup autoPan={false}>
              {event ? (
                getPopupContent(event, entrance.name)
              ) : (
                <span>No Event!</span>
              )}
            </Popup>
          </Polygon>
        );
      })}
      {/* Rendering parking lots */}
      {parkingLots.map((parkingLot) => {
        const transformedCoords = transformCoordinates(parkingLot.coordinates);
        const color = getPolygonColor(parkingLot.name);
        const event = filteredEvents.find((event) =>
          event[`${getEventStatus(event, selectedDate)}_parking_lots`]
            ? event[`${getEventStatus(event, selectedDate)}_parking_lots`]
                .split(", ")
                .includes(parkingLot.name)
            : false,
        );
        const status = event ? getEventStatus(event, selectedDate) : "unknown";
        const fillColor = event ? color : "gray";
        const opacity = event ? getPolygonOpacity(status) : 0.9;

        return (
          <Polygon
            key={parkingLot.name}
            positions={transformedCoords}
            className={`parking-lots parking-lot-${parkingLot.name}`}
            pathOptions={{
              color: fillColor,
              fillColor: fillColor,
              fillOpacity: opacity,
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
              {event ? (
                getPopupContent(event, parkingLot.name)
              ) : (
                <span>No Event!</span>
              )}
            </Popup>
          </Polygon>
        );
      })}
    </MapContainer>
  );
};

MapComponent.propTypes = {
  selectedDate: PropTypes.string.isRequired,
};

export default MapComponent;
