import React from "react";
import { Polygon, Tooltip, Popup } from "react-leaflet";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";

const transformCoordinates = (originalCoords) => {
  const transformedCoords = [];
  for (let i = 0; i < originalCoords.length; i += 2) {
    transformedCoords.push([originalCoords[i], originalCoords[i + 1]]);
  }
  return transformedCoords;
};

const getContrastingTextColor = (backgroundColor) => {
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "black" : "white";
};

const HallPopup = ({ hall, index, events, GREYED_OUT, selectedDate }) => {
  const transformedCoords = transformCoordinates(hall.coordinates);
  const hallEvents = events.filter((event) =>
    event.halls ? event.halls.split(", ").includes(hall.name) : false,
  );

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

  if (hallEvents.length === 0) {
    return (
      <Polygon
        key={hall.name}
        positions={transformedCoords}
        className={`halls hall-${hall.name}`}
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
          className="tags-halls"
        >
          <span>{hall.name}</span>
        </Tooltip>
        <Popup autoPan={false}>
          <div>
            <div className="popup-title-container">
              <div className="popup-title">{hall.name}</div>
            </div>
            <div className="">
              <div style={{ minWidth: "10rem" }}>No Event!</div>
            </div>
          </div>
        </Popup>
      </Polygon>
    );
  }

  const fillColors = hallEvents.map((event) => ({
    color: event.event_color,
    percentage: 1 / hallEvents.length,
  }));

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

  const gradientId = `gradient-hall-${index}-${hall.id}`;

  const getPopupContent = () => (
    <div className="popup-container">
      <div className="popup-title-container hall">
        <div className="popup-title">{hall.name}</div>
      </div>
      <div className="popup-table-hall">
        <div className="popup-header-hall" style={{ display: "bix" }}>
          <span>Event</span>
        </div>
        <div className="popup-header-hall">
          <span>Status</span>
        </div>
        <div className="popup-header-hall">
          <span>Entrance</span>
        </div>
        <div className="popup-header-hall">
          <span>Allocated Lot</span>
        </div>
        {hallEvents.map((event, index) => {
          const textColor = getContrastingTextColor(event.event_color);
          const status = getEventStatus(event, selectedDate);
          const parkingLots = event[`${status}_parking_lots`] || "None";
          const entrances = event.event_entrance || "None";
          const isLastElement = index === hallEvents.length - 1;

          return (
            <React.Fragment key={index}>
              <div
                className={`details-link_container event ${
                  isLastElement ? "border-round-left" : ""
                }`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: event.event_color,
                  color: textColor,
                }}
              >
                <a href={`/events/event/${event.event_id}`}>
                  <LinkRoundedIcon style={{ color: textColor }} />
                  <span style={{ color: textColor, minWidth: "5rem" }}>
                    {event.event_name}
                  </span>
                </a>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  textAlign: "center",
                  backgroundColor: event.event_color,
                  color: textColor,
                }}
              >
                {status}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  textAlign: "center",
                  backgroundColor: event.event_color,
                  color: textColor,
                }}
              >
                {entrances}
              </div>
              <div
                className={`popup-table-cell-footer ${
                  isLastElement ? "border-round-left" : ""
                }`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  textAlign: "center",
                  backgroundColor: event.event_color,
                  color: textColor,
                }}
              >
                {parkingLots}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  return (
    <React.Fragment key={hall.name}>
      <svg style={{ height: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
            {gradientStops}
          </linearGradient>
        </defs>
      </svg>
      <Polygon
        positions={transformedCoords}
        className={`halls hall-${hall.name}`}
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
          className="tags-halls"
        >
          <span>{hall.name}</span>
        </Tooltip>
        <Popup autoPan={false}>{getPopupContent()}</Popup>
      </Polygon>
    </React.Fragment>
  );
};

HallPopup.propTypes = {
  hall: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  events: PropTypes.array.isRequired,
  selectedEventId: PropTypes.number,
  GREYED_OUT: PropTypes.number.isRequired,
  selectedDate: PropTypes.string.isRequired,
};

export default HallPopup;
