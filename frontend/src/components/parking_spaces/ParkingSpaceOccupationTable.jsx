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
} from "@mui/icons-material";
import InsertInvitationRoundedIcon from "@mui/icons-material/InsertInvitationRounded";
import CommuteRoundedIcon from "@mui/icons-material/CommuteRounded";
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

  const getStatusColor = (allocated, total) => {
    const percentage = (allocated / total) * 100;
    if (allocated === total) return "red";
    if (percentage >= 80) return "orange";
    if (percentage < 80) return "blue";
    if (total - allocated === 1) return "green";
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
                    Allocated Cars
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <AirportShuttleRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    Allocated Buses
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <LocalShippingRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    Allocated Trucks
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <LocalParkingRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    Allocated/Total Capacity
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
                  <Box className="header-icon-container">Status</Box>
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

                return (
                  <React.Fragment key={dateIndex}>
                    {dateAllocations.map((allocation) => (
                      <TableRow key={allocation.id} hover>
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
                        <TableCell>
                          <Box
                            className="status-indicator"
                            style={{
                              backgroundColor: getStatusColor(
                                allocation.allocated_capacity,
                                allocation.total_capacity
                              ),
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow
                      key={`${date}-total`}
                      style={{ borderBottom: "2px solid #6a91ce" }}
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
                          }}
                        >
                          All Events
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          className="status-indicator"
                          style={{
                            backgroundColor: getStatusColor(
                              totalAllocatedCapacity,
                              totalCapacity
                            ),
                          }}
                        />
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
