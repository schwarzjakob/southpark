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

const ParkingPopup = ({
  parkingLot,
  index,
  parking_lots_allocations,
  parking_lots_capacity,
  GREYED_OUT,
}) => {
  const transformedCoords = transformCoordinates(parkingLot.coordinates);
  const allocations = parking_lots_allocations.filter(
    (allocation) => allocation.parking_lot_id === parkingLot.id,
  );

  const parkingLotCapacity =
    parking_lots_capacity.find((capacity) => capacity.id === parkingLot.id)
      ?.capacity || 0;

  const fillColors = allocations.map((allocation) => ({
    color: allocation.event_color,
    percentage: allocation.allocated_capacity / parkingLotCapacity,
  }));

  const usedCapacityPercentage = fillColors.reduce(
    (acc, cur) => acc + cur.percentage,
    0,
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

  const totalCapacity = allocations.reduce(
    (sum, allocation) => sum + allocation.allocated_capacity,
    0,
  );
  const isFullyAllocated = totalCapacity === parkingLotCapacity;

  const gradientId = `gradient-${index}-${parkingLot.id}`;

  if (!allocations || allocations.length === 0) {
    return (
      <div>
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
            <div className="popup-title-container">
              <div className="popup-title">
                <span>{parkingLot.name}</span>
              </div>
              <div className="details-link_container">
                <a href={`/parking_space/${parkingLot.id}`}>
                  <LinkRoundedIcon />
                  Details
                </a>
              </div>
            </div>

            <div className="popup-table">
              <div className="popup-header">No Event!</div>
              <div className="popup-header car-units">Car units</div>
              <div className="popup-header">Percentage</div>
              <React.Fragment>
                <div className="popup-table-cell-footer capacity">
                  <strong>Free Capacity</strong>
                </div>
                <div className="popup-table-cell-footer">
                  <strong>
                    {Math.round(freeCapacityPercentage * parkingLotCapacity)}
                  </strong>
                </div>
                <div className="popup-table-cell-footer percentage">
                  <strong>{(freeCapacityPercentage * 100).toFixed(2)}%</strong>
                </div>
              </React.Fragment>
            </div>
          </Popup>
        </Polygon>
      </div>
    );
  }

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
            <div className="popup-title-container">
              <div className="popup-title">
                <span>{parkingLot.name}</span>
              </div>
              <div className="details-link_container">
                <a href={`/parking_space/${parkingLot.id}`}>
                  <LinkRoundedIcon />
                  Details
                </a>
              </div>
            </div>
            <div className="popup-table">
              <div className="popup-header">Event</div>
              <div className="popup-header car-units">Car units</div>
              <div className="popup-header">Percentage</div>

              {allocations.map((allocation, index) => {
                const textColor = getContrastingTextColor(
                  allocation.event_color,
                );
                const isLastElement = index === allocations.length - 1;

                return (
                  <React.Fragment key={index}>
                    <div
                      className={`details-link_container event ${
                        isLastElement && isFullyAllocated
                          ? "border-round-left"
                          : ""
                      }`}
                    >
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
                      className={`popup-table-cell ${
                        isLastElement && isFullyAllocated
                          ? "border-round-right"
                          : ""
                      }`}
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
                      {Math.round(freeCapacityPercentage * parkingLotCapacity)}
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

ParkingPopup.propTypes = {
  parkingLot: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  parking_lots_allocations: PropTypes.array.isRequired,
  parking_lots_capacity: PropTypes.array.isRequired,
  GREYED_OUT: PropTypes.number.isRequired,
};

export default ParkingPopup;
