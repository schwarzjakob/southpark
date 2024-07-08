import React from "react";
import { Polygon, Tooltip, Popup } from "react-leaflet";
import PropTypes from "prop-types";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";
import { Box } from "@mui/material";

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

const calculateColor = (occupancy, occupiedColor, freeColor) => {
  const r1 = parseInt(freeColor.substring(1, 3), 16);
  const g1 = parseInt(freeColor.substring(3, 5), 16);
  const b1 = parseInt(freeColor.substring(5, 7), 16);

  const r2 = parseInt(occupiedColor.substring(1, 3), 16);
  const g2 = parseInt(occupiedColor.substring(3, 5), 16);
  const b2 = parseInt(occupiedColor.substring(5, 7), 16);

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

const HeatMapParkingLotPopup = ({
  parkingLot,
  parking_lots_allocations,
  parking_lots_capacity,
  utilization_type,
  COLOR_OCCUPIED,
  COLOR_FREE,
}) => {
  const transformedCoords = transformCoordinates(parkingLot.coordinates);
  const isUnderConstruction = utilization_type === "construction";

  if (isUnderConstruction) {
    const fillPattern = "url(#diagonal-stripe-2)";

    return (
      <React.Fragment key={parkingLot.name}>
        <svg style={{ height: 0 }}>
          <defs>
            <pattern
              id="diagonal-stripe-2"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="5" height="10" fill="#dea731" />
              <rect x="5" width="5" height="10" fill="black" />
            </pattern>
          </defs>
        </svg>
        <Polygon
          positions={transformedCoords}
          className={`parking-lots parking-lot-${parkingLot.name}`}
          pathOptions={{
            fillColor: fillPattern,
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
            <div className="construction-info">
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <EngineeringRoundedIcon sx={{ marginRight: "0.3rem" }} />
                <Box>Under Construction!</Box>
              </Box>
            </div>
          </Popup>
        </Polygon>
      </React.Fragment>
    );
  }

  const parkingLotCapacity =
    parking_lots_capacity.find((capacity) => capacity.id === parkingLot.id)
      ?.capacity || 0;

  const allocations = parking_lots_allocations.filter(
    (allocation) => allocation.parking_lot_id === parkingLot.id,
  );

  const totalAllocated = allocations.reduce(
    (sum, allocation) => sum + allocation.allocated_capacity,
    0,
  );

  const occupancyRatio = parkingLotCapacity
    ? totalAllocated / parkingLotCapacity
    : 0;

  const fillColor = calculateColor(occupancyRatio, COLOR_OCCUPIED, COLOR_FREE);

  const getPopupContent = () => {
    if (!allocations || allocations.length === 0) {
      return (
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
            <div className="popup-header">No Event!</div>
            <div className="popup-header car-units">Car units</div>
            <div className="popup-header">Percentage</div>
            <React.Fragment>
              <div className="popup-table-cell-footer capacity">
                <strong>Free Capacity</strong>
              </div>
              <div className="popup-table-cell-footer">
                <strong>
                  {Math.round((1 - occupancyRatio) * parkingLotCapacity)}
                </strong>
              </div>
              <div className="popup-table-cell-footer percentage">
                <strong>{((1 - occupancyRatio) * 100).toFixed(2)}%</strong>
              </div>
            </React.Fragment>
          </div>
        </div>
      );
    }

    return (
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
            const textColor = getContrastingTextColor(allocation.event_color);
            return (
              <React.Fragment key={index}>
                <div className="details-link_container event">
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
          <React.Fragment>
            <div className="popup-table-cell-footer capacity">
              <strong>Free Capacity</strong>
            </div>
            <div className="popup-table-cell-footer">
              <strong>
                {Math.round((1 - occupancyRatio) * parkingLotCapacity)}
              </strong>
            </div>
            <div className="popup-table-cell-footer percentage">
              <strong>{((1 - occupancyRatio) * 100).toFixed(2)}%</strong>
            </div>
          </React.Fragment>
        </div>
      </div>
    );
  };

  return (
    <Polygon
      positions={transformedCoords}
      className={`parking-lots parking-lot-${parkingLot.name}`}
      pathOptions={{
        fillColor: fillColor,
        fillOpacity: 0.75,
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
      <Popup autoPan={false}>{getPopupContent()}</Popup>
    </Polygon>
  );
};

HeatMapParkingLotPopup.propTypes = {
  parkingLot: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  parking_lots_allocations: PropTypes.array.isRequired,
  parking_lots_capacity: PropTypes.array.isRequired,
  utilization_type: PropTypes.string.isRequired,
  COLOR_OCCUPIED: PropTypes.string.isRequired,
  COLOR_FREE: PropTypes.string.isRequired,
};

export default HeatMapParkingLotPopup;
