import React from "react";
import { Polygon, Tooltip, Popup } from "react-leaflet";
import PropTypes from "prop-types";
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

const EntrancePopup = ({ entrance, index, events, GREYED_OUT }) => {
  const transformedCoords = transformCoordinates(entrance.coordinates);
  const entranceEvents = events.filter((event) =>
    event.event_entrance ? event.event_entrance.includes(entrance.id) : false,
  );

  const tooltipOffset = (() => {
    const normalizedEntranceName = entrance.name.trim().toLowerCase();
    if (normalizedEntranceName === "north") {
      return [0, -33];
    }
    if (
      normalizedEntranceName === "north west" ||
      normalizedEntranceName === "north east"
    ) {
      return [0, -20];
    }
    return [0, 0];
  })();

  if (entranceEvents.length === 0) {
    return (
      <Polygon
        key={entrance.name}
        positions={transformedCoords}
        className={`entrances entrance-${entrance.name}`}
        pathOptions={{
          color: "transparent",
          fillColor: "gray",
          fillOpacity: GREYED_OUT,
          weight: 2,
        }}
      >
        <Tooltip
          direction="center"
          offset={tooltipOffset}
          permanent
          className="tags-entrances"
        >
          <span>{entrance.name}</span>
        </Tooltip>
        <Popup autoPan={false}>
          <div>
            <div className="popup-title-container">
              <div className="popup-title">
                <span>{entrance.name}</span>
              </div>
            </div>
            <div className="popup-table-entrance">
              <div className="popup-header-entrance">No Event!</div>
            </div>
          </div>{" "}
        </Popup>
      </Polygon>
    );
  }

  const fillColors = entranceEvents.map((event) => ({
    color: event.event_color,
    percentage: 1 / entranceEvents.length,
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

  const gradientId = `gradient-entrance-${index}-${entrance.id}`;

  return (
    <React.Fragment key={entrance.name}>
      <svg style={{ height: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
            {gradientStops}
          </linearGradient>
        </defs>
      </svg>
      <Polygon
        positions={transformedCoords}
        className={`entrances entrance-${entrance.name}`}
        pathOptions={{
          fillColor: `url(#${gradientId})`,
          fillOpacity: 1,
          weight: 2,
          color: "transparent",
        }}
      >
        <Tooltip
          direction="center"
          offset={tooltipOffset}
          permanent
          className="tags-entrances"
        >
          <span>{entrance.name}</span>
        </Tooltip>
        <Popup autoPan={false}>
          <div>
            <div className="popup-title-container">
              <div className="popup-title">
                <span>{entrance.name}</span>
              </div>
            </div>
            <div className="popup-table-entrance">
              <div className="popup-header-entrance">Event</div>
              {entranceEvents.map((event, index) => {
                const textColor = getContrastingTextColor(event.event_color);
                return (
                  <React.Fragment key={index}>
                    <div className="details-link_container event">
                      <a
                        href={`/events/event/${event.event_id}`}
                        style={{
                          backgroundColor: event.event_color,
                          color: textColor,
                        }}
                      >
                        <LinkRoundedIcon style={{ color: textColor }} />
                        {event.event_name}
                      </a>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </Popup>
      </Polygon>
    </React.Fragment>
  );
};

EntrancePopup.propTypes = {
  entrance: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  events: PropTypes.array.isRequired,
  GREYED_OUT: PropTypes.number.isRequired,
};

export default EntrancePopup;
