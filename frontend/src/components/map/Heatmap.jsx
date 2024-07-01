import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Tooltip,
  Popup,
  useMap,
} from "react-leaflet";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import axios from "axios";
import MapLegendComponent from "./MapLegend.jsx";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import "leaflet/dist/leaflet.css";

const downwardsOverlays = [
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

const COLOR_OCCUPIED = "#ff434375";
const COLOR_FREE = "#6a91ce75";

const Heatmap = ({ selectedDate, zoom }) => {
  const [halls, setHalls] = useState([]);
  const [parkingLots, setParkingLots] = useState([]);
  const [entrances, setEntrances] = useState([]);
  const [events, setEvents] = useState([]);
  const [occupancy, setOccupancy] = useState([]);

  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        const { data } = await axios.get("/api/map/coordinates");
        if (data) {
          setEntrances(data.entrances);
          setHalls(data.halls);
          setParkingLots(data.parking_lots);
        }
      } catch (error) {
        console.error(
          "There was an error fetching the coordinates data!",
          error
        );
      }
    };

    const fetchEvents = async () => {
      try {
        const { data } = await axios.get(
          `/api/map/events_timeline/${selectedDate}`
        );
        if (data) {
          setEvents(data);
        }
      } catch (error) {
        console.error("There was an error fetching the events data!", error);
      }
    };

    const fetchOccupancyAndCapacity = async () => {
      try {
        const [occupancyRes, capacityRes] = await Promise.all([
          axios.get(`/api/map/parking_occupancy/${selectedDate}`),
          axios.get(`/api/map/parking_lots_capacity/${selectedDate}`),
        ]);

        if (
          Array.isArray(occupancyRes.data) &&
          Array.isArray(capacityRes.data)
        ) {
          const occupancyData = occupancyRes.data;
          const capacityData = capacityRes.data;

          const combinedData = occupancyData.map((occ) => {
            const capacity = capacityData.find(
              (cap) => cap.name === occ.parking_lot_name
            );
            return {
              ...occ,
              total_capacity: capacity ? capacity.capacity : 0,
            };
          });

          setOccupancy(combinedData);
        } else {
          console.error("Occupancy or Capacity data is not an array!");
        }
      } catch (error) {
        console.error(
          "There was an error fetching the occupancy or capacity data!",
          error
        );
      }
    };

    fetchCoordinates();
    fetchEvents();
    fetchOccupancyAndCapacity();
  }, [selectedDate]); // Add selectedDate as a dependency

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

  const calculateColor = (occupancy) => {
    const r1 = parseInt(COLOR_FREE.substring(1, 3), 16);
    const g1 = parseInt(COLOR_FREE.substring(3, 5), 16);
    const b1 = parseInt(COLOR_FREE.substring(5, 7), 16);

    const r2 = parseInt(COLOR_OCCUPIED.substring(1, 3), 16);
    const g2 = parseInt(COLOR_OCCUPIED.substring(3, 5), 16);
    const b2 = parseInt(COLOR_OCCUPIED.substring(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * occupancy)
      .toString(16)
      .padStart(2, "0");
    const g = Math.round(g1 + (g2 - g1) * occupancy)
      .toString(16)
      .padStart(2, "0");
    const b = Math.round(b1 + (b2 - b1) * occupancy)
      .toString(16)
      .padStart(2, "0");
    return `#${r}${g}${b}`;
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
    events.filter(
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

  return (
    <MapContainer
      center={[48.1375, 11.702]}
      zoom={zoom}
      scrollWheelZoom={false}
      zoomControl={true}
      dragging={false}
      touchZoom={true}
      doubleClickZoom={true}
      keyboard={false}
      zoomSnap={0.3}
      zoomDelta={0.3}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SetZoomLevel zoom={15.5} />
      <MapLegendComponent
        events={uniqueFilteredEvents}
        selectedDate={selectedDate}
      />

      {halls.map((hall) => {
        const transformedCoords = transformCoordinates(hall.coordinates);
        const event = uniqueFilteredEvents.find((event) =>
          event.halls ? event.halls.split(", ").includes(hall.name) : false
        );
        const fillColor = event ? `${event.event_color}` : "gray";
        const borderColor = event ? `${event.event_color}` : "transparent";

        return (
          <Polygon
            key={hall.name}
            positions={transformedCoords}
            className={`halls hall-${hall.name}`}
            pathOptions={{
              color: borderColor,
              fillColor: fillColor,
              fillOpacity: event ? 0.75 : 0.25,
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

      {entrances.map((entrance) => {
        const transformedCoords = transformCoordinates(entrance.coordinates);
        const event = uniqueFilteredEvents.find((event) =>
          event.event_entrance
            ? event.event_entrance.includes(entrance.name)
            : false
        );
        const fillColor = event ? `${event.event_color}` : "gray";
        const borderColor = event ? `${event.event_color}` : "transparent";
        const popupOffset = downwardsOverlays.includes(entrance.name)
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
              fillOpacity: event ? 0.75 : 0.25,
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

      {parkingLots.map((parkingLot) => {
        const transformedCoords = transformCoordinates(parkingLot.coordinates);
        const occupancyData = occupancy.find(
          (data) => data.parking_lot_name === parkingLot.name
        );
        const totalCapacity = occupancyData ? occupancyData.total_capacity : 0;
        const occupancyRate =
          occupancyData && totalCapacity
            ? occupancyData.occupancy / totalCapacity
            : 0;

        const fillColor = calculateColor(occupancyRate);
        const borderColor = fillColor;
        const popupOffset = downwardsOverlays.includes(parkingLot.name)
          ? [0, 80]
          : [0, 0];

        return (
          <Polygon
            key={parkingLot.name}
            positions={transformedCoords}
            className={`parking-lots parking-lot-${parkingLot.name}`}
            pathOptions={{
              color: borderColor,
              fillColor: fillColor,
              fillOpacity: 0.75,
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
            <Popup autoPan={false} offset={popupOffset}>
              {occupancyData ? (
                <div>
                  <h4>{parkingLot.name}</h4>
                  <p>Occupancy: {occupancyData.occupancy}</p>
                  <p>
                    Free Capacity: {totalCapacity - occupancyData.occupancy}
                  </p>
                  <div className="details-link_container">
                    <a href={`/parking_space/${parkingLot.id}`}>
                      <LinkRoundedIcon />
                      {parkingLot.name} Details
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <h4>{parkingLot.name}</h4>
                  <p>Occupancy: 0</p>
                  <p>Free Capacity: {totalCapacity}</p>
                  <div className="details-link_container">
                    <a href={`/parking_space/${parkingLot.id}`}>
                      <LinkRoundedIcon />
                      {parkingLot.name} Details
                    </a>
                  </div>
                </div>
              )}
            </Popup>
          </Polygon>
        );
      })}
    </MapContainer>
  );
};

Heatmap.propTypes = {
  selectedDate: PropTypes.string.isRequired,
  zoom: PropTypes.number.isRequired,
};

export default Heatmap;
