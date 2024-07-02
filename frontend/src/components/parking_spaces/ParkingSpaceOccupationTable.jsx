import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Alert,
} from "@mui/material";
import {
  DateRangeRounded as DateRangeRoundedIcon,
  DirectionsCarFilledRounded as DirectionsCarFilledRoundedIcon,
  AirportShuttleRounded as AirportShuttleRoundedIcon,
  LocalShippingRounded as LocalShippingRoundedIcon,
  LocalParkingRounded as LocalParkingRoundedIcon,
  Circle as CircleIcon,
} from "@mui/icons-material";
import FunctionsRoundedIcon from "@mui/icons-material/FunctionsRounded";
import InsertInvitationRoundedIcon from "@mui/icons-material/InsertInvitationRounded";
import CommuteRoundedIcon from "@mui/icons-material/CommuteRounded";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "./styles/parkingSpaces.css";

const TITLE = "Parking Space Occupation";

const ParkingSpaceOccupationTable = ({ parkingLotId }) => {
  ParkingSpaceOccupationTable.propTypes = {
    parkingLotId: PropTypes.string.isRequired,
  };

  const [allocations, setAllocations] = useState([]);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("date");
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const response = await axios.get(
          `/api/parking/occupations/${parkingLotId}`
        );
        if (response.status === 204) {
          setNotification("No allocations found for this parking lot.");
        } else {
          setAllocations(response.data);
        }
      } catch (error) {
        console.error("Error fetching allocations data:", error);
      }
    };

    fetchAllocations();
  }, [parkingLotId]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedAllocations = allocations.sort((a, b) => {
    const isAsc = order === "asc";
    if (orderBy === "date") {
      return isAsc
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    }
    return 0;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getContrastingTextColor = (backgroundColor) => {
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "black" : "white";
  };

  const getStatusColor = (percentage) => {
    let red, green, blue;

    if (percentage <= 50) {
      // Dark green to Orange-like yellow
      red = Math.min(255, Math.round((percentage / 50) * 255));
      green = Math.min(128, Math.round(128 - (percentage / 50) * 128 + 128));
      blue = 0;
    } else {
      // Orange-like yellow to Red
      red = 255;
      green = Math.min(128, Math.round((1 - (percentage - 50) / 50) * 128));
      blue = 0;
    }

    return `rgb(${red}, ${green}, ${blue})`;
  };

  const getStatusCircle = (percentage) => {
    const color = getStatusColor(percentage);
    return <CircleIcon style={{ color }} />;
  };

  const getStatusText = (percentage) => {
    return `${percentage}% Occupied`;
  };

  // Group allocations by date
  const groupedAllocations = sortedAllocations.reduce((acc, allocation) => {
    const date = allocation.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(allocation);
    return acc;
  }, {});

  return (
    <Box className="occupationTable-container">
      <Box className="form-headline-button__container">
        <Box className="iconHeadline__container">
          <CommuteRoundedIcon />
          <Typography variant="h4" gutterBottom>
            {TITLE}
          </Typography>
        </Box>
      </Box>
      {notification && <Alert severity="info">{notification}</Alert>}
      {Object.keys(groupedAllocations).length > 0 && (
        <TableContainer className="parkingSpaces-container" component={Paper}>
          <Table className="parkingSpaces-table">
            <TableHead className="parkingSpaces-table__header">
              <TableRow>
                <TableCell>
                  <Box className="header-icon-container">
                    <DateRangeRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "date"}
                      direction={orderBy === "date" ? order : "asc"}
                      onClick={() => handleRequestSort("date")}
                    >
                      Date
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <DirectionsCarFilledRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "car_demand"}
                      direction={orderBy === "car_demand" ? order : "asc"}
                      onClick={() => handleRequestSort("car_demand")}
                    >
                      <Box className="header-icon-container__label">
                        <Box className="header-icon-container__label-title">
                          Car Demand
                        </Box>
                        <Box className="header-icon-container__label-unit">
                          (Car Units)
                        </Box>
                      </Box>
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <AirportShuttleRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "bus_demand"}
                      direction={orderBy === "bus_demand" ? order : "asc"}
                      onClick={() => handleRequestSort("bus_demand")}
                    >
                      <Box className="header-icon-container__label">
                        <Box className="header-icon-container__label-title">
                          Bus Demand
                        </Box>
                        <Box className="header-icon-container__label-unit">
                          (= 3x Car Units)
                        </Box>
                      </Box>{" "}
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <LocalShippingRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "truck_demand"}
                      direction={orderBy === "truck_demand" ? order : "asc"}
                      onClick={() => handleRequestSort("truck_demand")}
                    >
                      <Box className="header-icon-container__label">
                        <Box className="header-icon-container__label-title">
                          Truck Demand
                        </Box>
                        <Box className="header-icon-container__label-unit">
                          (= 4x Car Units)
                        </Box>
                      </Box>
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <FunctionsRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "demand"}
                      direction={orderBy === "demand" ? order : "asc"}
                      onClick={() => handleRequestSort("demand")}
                    >
                      <Box className="header-icon-container__label">
                        <Box className="header-icon-container__label-title">
                          Allocated / Total
                        </Box>
                        <Box className="header-icon-container__label-unit">
                          (Total Car Units)
                        </Box>
                      </Box>{" "}
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <InsertInvitationRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    Event
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <LocalParkingRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    Status
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(groupedAllocations).map((date, dateIndex) => {
                const dateAllocations = groupedAllocations[date];
                const totalAllocatedCars = dateAllocations.reduce(
                  (sum, alloc) => sum + alloc.allocated_cars,
                  0
                );
                const totalAllocatedBuses = dateAllocations.reduce(
                  (sum, alloc) => sum + alloc.allocated_buses,
                  0
                );
                const totalAllocatedTrucks = dateAllocations.reduce(
                  (sum, alloc) => sum + alloc.allocated_trucks,
                  0
                );
                const totalAllocatedCapacity = dateAllocations.reduce(
                  (sum, alloc) => sum + alloc.allocated_capacity,
                  0
                );
                const totalCapacity = dateAllocations.reduce(
                  (sum, alloc) => sum + alloc.total_capacity,
                  0
                );

                const occupancyPercentage = Math.round(
                  (totalAllocatedCapacity / totalCapacity) * 100
                );

                return (
                  <React.Fragment key={dateIndex}>
                    {dateAllocations.map((allocation) => (
                      <TableRow
                        key={allocation.id}
                        hover
                        onClick={() =>
                          navigate(`/events/event/${allocation.event_id}`)
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <TableCell>{formatDate(allocation.date)}</TableCell>
                        <TableCell>{allocation.allocated_cars}</TableCell>
                        <TableCell>{allocation.allocated_buses}</TableCell>
                        <TableCell>{allocation.allocated_trucks}</TableCell>
                        <TableCell>{`${allocation.allocated_capacity}/${allocation.total_capacity}`}</TableCell>
                        <TableCell>
                          <Box
                            className="event-box"
                            style={{
                              backgroundColor: allocation.event_color,
                              color: getContrastingTextColor(
                                allocation.event_color
                              ),
                              wordWrap: "break-word",
                              maxWidth: "200px",
                            }}
                          >
                            {allocation.event_name}
                          </Box>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))}
                    <TableRow
                      key={`${date}-total`}
                      style={{
                        borderBottom: "2px solid #6a91ce",
                      }}
                    >
                      <TableCell>{formatDate(date)}</TableCell>
                      <TableCell>{totalAllocatedCars}</TableCell>
                      <TableCell>{totalAllocatedBuses}</TableCell>
                      <TableCell>{totalAllocatedTrucks}</TableCell>
                      <TableCell>{`${totalAllocatedCapacity}/${totalCapacity}`}</TableCell>
                      <TableCell>
                        <Box
                          className="event-box"
                          style={{
                            background: "rgba(128, 128, 128, 75)",
                            color: getContrastingTextColor(
                              "rgba(128, 128, 128, 75)"
                            ),
                            wordWrap: "break-word",
                            maxWidth: "200px",
                            cursor: "default",
                          }}
                        >
                          All Events
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          className="status-box"
                          display="flex"
                          alignItems="center"
                        >
                          {getStatusCircle(occupancyPercentage)}
                          <Typography
                            variant="body2"
                            style={{ marginLeft: "8px" }}
                          >
                            {getStatusText(occupancyPercentage)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ParkingSpaceOccupationTable;
