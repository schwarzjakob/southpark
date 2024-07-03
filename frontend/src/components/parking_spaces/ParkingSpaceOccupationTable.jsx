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
  IconButton,
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
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import "./styles/parkingSpaces.css";

const TITLE = "Parking Space Occupation";

const ParkingSpaceOccupationTable = ({ parkingLotId, selectedDate }) => {
  ParkingSpaceOccupationTable.propTypes = {
    parkingLotId: PropTypes.string.isRequired,
    selectedDate: PropTypes.string,
  };

  const [allocations, setAllocations] = useState([]);
  const [filteredAllocations, setFilteredAllocations] = useState([]);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("date");
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const response = await axios.get(
          `/api/parking/occupations/${parkingLotId}`,
        );
        if (response.status === 204) {
          console.log("No allocations found for this parking lot.");
          setAllocations([{}]);
        } else {
          setAllocations(response.data.length ? response.data : [{}]);
          filterAllocations(
            response.data.length ? response.data : [{}],
            selectedYear,
            selectedMonth,
          );
        }
      } catch (error) {
        console.error("Error fetching allocations data:", error);
      }
    };

    fetchAllocations();
  }, [parkingLotId, selectedYear, selectedMonth]);

  useEffect(() => {
    filterAllocations(allocations, selectedYear, selectedMonth);
  }, [allocations, selectedYear, selectedMonth]);

  useEffect(() => {
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      setSelectedYear(selectedDateObj.getFullYear());
      setSelectedMonth(selectedDateObj.getMonth());
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const dateStr = `${selectedDateObj
        .getDate()
        .toString()
        .padStart(2, "0")}.${(selectedDateObj.getMonth() + 1)
        .toString()
        .padStart(2, "0")}.${selectedDateObj.getFullYear()}`;

      setTimeout(() => {
        const tableContainer = document.querySelector(
          ".parkingSpaces-container",
        );
        if (tableContainer) {
          tableContainer.scrollTop = 0;
        }

        const targetRow = document.querySelector(
          `.allocation-table-row[data-date="${dateStr}"]`,
        );
        if (targetRow) {
          targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
          targetRow.classList.add("highlight");
        }
      }, 0);
    }
  }, [selectedDate, filteredAllocations]);

  const filterAllocations = (allocations, year, month) => {
    const startOfMonth = dayjs().year(year).month(month).startOf("month");
    const endOfMonth = dayjs().year(year).month(month).endOf("month");

    const filtered = allocations.filter((allocation) => {
      const allocationDate = dayjs(allocation.date);
      return allocationDate.isBetween(startOfMonth, endOfMonth, "day", "[]");
    });

    setFilteredAllocations(filtered);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleYearChange = (increment) => {
    setSelectedYear(selectedYear + increment);
  };

  const sortedAllocations = filteredAllocations.sort((a, b) => {
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
      red = Math.min(255, Math.round((percentage / 50) * 255));
      green = Math.min(128, Math.round(128 - (percentage / 50) * 128 + 128));
      blue = 0;
    } else {
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

  const groupedAllocations = sortedAllocations.reduce((acc, allocation) => {
    const date = allocation.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(allocation);
    return acc;
  }, {});

  const months = Array.from({ length: 12 }, (_, i) =>
    dayjs().month(i).format("MMM"),
  );

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
      <TableContainer className="parkingSpaces-container" component={Paper}>
        <Table className="parkingSpaces-table">
          <TableHead className="parkingSpaces-table__header">
            <TableCell colSpan={7} className="demandTable__headerCell">
              <TableContainer>
                <Table className="parkingSpaces-year-month-table">
                  <TableHead>
                    <TableRow>
                      <TableCell colSpan={1}>
                        <Box className="demandTable__headerCell-nav">
                          <IconButton
                            className="ArrowBackIosIcon"
                            onClick={() => handleYearChange(-1)}
                            size="small"
                            style={{ transition: "transform 0.3s" }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.transform = "scale(1.2)")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                          >
                            <ArrowBackIosIcon fontSize="small" />
                          </IconButton>
                          <Typography
                            variant="h6"
                            className="demandTable__monthLabel"
                          >
                            {selectedYear}
                          </Typography>
                          <IconButton
                            className="ArrowForwardIosIcon"
                            onClick={() => handleYearChange(1)}
                            size="small"
                            style={{ transition: "transform 0.3s" }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.transform = "scale(1.2)")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.transform = "scale(1)")
                            }
                          >
                            <ArrowForwardIosIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      {months.map((month, index) => (
                        <TableCell
                          key={index}
                          align="center"
                          className="demandTable__headerCell demandTable__headerCell-month"
                          onClick={() => setSelectedMonth(index)}
                          style={{ cursor: "pointer" }}
                        >
                          <Typography
                            variant="body1"
                            className="demandTable__monthLabel"
                          >
                            {month}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                </Table>
              </TableContainer>
            </TableCell>
            <TableRow className="parkingSpaces-year-month-table">
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
                  <Box className="header-icon-container__label">
                    <Box className="header-icon-container__label-title">
                      Allocated Cars
                    </Box>
                    <Box className="header-icon-container__label-unit">
                      (Car Units)
                    </Box>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box className="header-icon-container">
                  <AirportShuttleRoundedIcon
                    fontSize="small"
                    className="header-icon"
                  />
                  <Box className="header-icon-container__label">
                    <Box className="header-icon-container__label-title">
                      Allocated Buses
                    </Box>
                    <Box className="header-icon-container__label-unit">
                      (= 3x Car Units)
                    </Box>
                  </Box>{" "}
                </Box>
              </TableCell>
              <TableCell>
                <Box className="header-icon-container">
                  <LocalShippingRoundedIcon
                    fontSize="small"
                    className="header-icon"
                  />
                  <Box className="header-icon-container__label">
                    <Box className="header-icon-container__label-title">
                      Allocated Trucks
                    </Box>
                    <Box className="header-icon-container__label-unit">
                      (= 4x Car Units)
                    </Box>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box className="header-icon-container">
                  <FunctionsRoundedIcon
                    fontSize="small"
                    className="header-icon"
                  />
                  <Box className="header-icon-container__label">
                    <Box className="header-icon-container__label-title">
                      Allocated / Total
                    </Box>
                    <Box className="header-icon-container__label-unit">
                      (Total Car Units)
                    </Box>
                  </Box>{" "}
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
            {Object.keys(groupedAllocations).length > 0 ? (
              Object.keys(groupedAllocations).map((date, dateIndex) => {
                const dateAllocations = groupedAllocations[date];
                const totalAllocatedCars = dateAllocations.reduce(
                  (sum, alloc) => sum + alloc.allocated_cars,
                  0,
                );
                const totalAllocatedBuses = dateAllocations.reduce(
                  (sum, alloc) => sum + alloc.allocated_buses,
                  0,
                );
                const totalAllocatedTrucks = dateAllocations.reduce(
                  (sum, alloc) => sum + alloc.allocated_trucks,
                  0,
                );
                const totalAllocatedCapacity = dateAllocations.reduce(
                  (sum, alloc) => sum + alloc.allocated_capacity,
                  0,
                );
                const totalCapacity = dateAllocations.reduce(
                  (sum, alloc) => sum + alloc.total_capacity,
                  0,
                );

                let occupancyPercentage =
                  (totalAllocatedCapacity / totalCapacity) * 100;
                if (occupancyPercentage > 99 && occupancyPercentage < 100) {
                  occupancyPercentage = 99;
                } else {
                  occupancyPercentage = Math.round(occupancyPercentage);
                }

                const isLastRow =
                  dateIndex === Object.keys(groupedAllocations).length - 1;

                const style = {
                  position: "relative",
                  borderBottom: isLastRow ? "none" : "2px solid #6a91ce",
                  paddingTop: "6px",
                };

                const doubleStrokeStyle = {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  borderTop: "1px solid rgba(128, 128, 128, 0.5)",
                  borderBottom: "1px solid rgba(128, 128, 128, 0.5)",
                };

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
                        className="allocation-table-row"
                        data-date={formatDate(allocation.date)}
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
                                allocation.event_color,
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
                    <TableRow key={`${date}-total`} style={style}>
                      <TableCell>
                        <Box style={doubleStrokeStyle}></Box>
                        <Box style={{ display: "flex", alignItems: "center" }}>
                          <FunctionsRoundedIcon></FunctionsRoundedIcon>
                        </Box>
                      </TableCell>
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
                              "rgba(128, 128, 128, 75)",
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
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No allocations available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ParkingSpaceOccupationTable;
