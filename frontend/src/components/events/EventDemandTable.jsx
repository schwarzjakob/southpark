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
  Button,
  Alert,
  Divider,
} from "@mui/material";
import {
  DateRangeRounded as DateRangeRoundedIcon,
  DirectionsCarFilledRounded as DirectionsCarFilledRoundedIcon,
  AirportShuttleRounded as AirportShuttleRoundedIcon,
  LocalShippingRounded as LocalShippingRoundedIcon,
  NumbersRounded as NumbersRoundedIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import ArrowCircleUpRoundedIcon from "@mui/icons-material/ArrowCircleUpRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import ArrowCircleDownRoundedIcon from "@mui/icons-material/ArrowCircleDownRounded";
import FunctionsRoundedIcon from "@mui/icons-material/FunctionsRounded";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "./styles/events.css";

const TITLE = "Event Demands";

const EventDemandTable = ({ eventId }) => {
  EventDemandTable.propTypes = {
    eventId: PropTypes.string.isRequired,
  };

  const [demands, setDemands] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("date");
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDemands = async () => {
      try {
        const response = await axios.get(`/api/events/demands/${eventId}`);
        if (response.status === 204) {
          setNotification("No demands found for this event.");
        } else {
          setDemands(response.data);
        }
      } catch (error) {
        console.error("Error fetching demands data:", error);
      }
    };

    const fetchAllocations = async () => {
      try {
        const response = await axios.get(`/api/events/allocations/${eventId}`);
        setAllocations(response.data);
      } catch (error) {
        console.error("Error fetching allocations data:", error);
      }
    };

    fetchDemands();
    fetchAllocations();
  }, [eventId]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedDemands = demands.sort((a, b) => {
    const isAsc = order === "asc";
    const statusOrder = ["assembly", "runtime", "disassembly"];
    switch (orderBy) {
      case "date":
        return isAsc
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      case "car_demand":
        return isAsc
          ? a.car_demand - b.car_demand
          : b.car_demand - a.car_demand;
      case "truck_demand":
        return isAsc
          ? a.truck_demand - b.truck_demand
          : b.truck_demand - a.truck_demand;
      case "bus_demand":
        return isAsc
          ? a.bus_demand - b.bus_demand
          : b.bus_demand - a.bus_demand;
      case "demand":
        return isAsc ? a.demand - b.demand : b.demand - a.demand;
      case "status":
        return isAsc
          ? statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
          : statusOrder.indexOf(b.status) - statusOrder.indexOf(a.status);
      default:
        return 0;
    }
  });

  const groupedDemands = sortedDemands.reduce((acc, demand) => {
    if (!acc[demand.status]) {
      acc[demand.status] = [];
    }
    acc[demand.status].push(demand);
    return acc;
  }, {});

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "allocated":
        return (
          <Box className="status-label" style={{ color: "green" }}>
            <Typography variant="body2">Demand Fully allocated</Typography>
          </Box>
        );
      case "partially_allocated":
        return (
          <Box className="status-label" style={{ color: "orange" }}>
            <Typography variant="body2">Partly allocated</Typography>
          </Box>
        );
      case "not_allocated":
        return (
          <Box className="status-label" style={{ color: "red" }}>
            <Typography variant="body2">Not allocated</Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case "assembly":
        return <ArrowCircleUpRoundedIcon />;
      case "runtime":
        return <PlayCircleFilledRoundedIcon />;
      case "disassembly":
        return <ArrowCircleDownRoundedIcon />;
      default:
        return null;
    }
  };

  const getAllocatedTotal = (demandDate, demandTotal) => {
    if (!Array.isArray(allocations)) return `0/${demandTotal}`;

    const allocation = allocations.find(
      (alloc) => formatDate(alloc.date) === formatDate(demandDate),
    );

    return allocation
      ? `${allocation.allocated_capacity}/${demandTotal}`
      : `0/${demandTotal}`;
  };

  return (
    <Box className="capacitiesTable-container">
      <Box className="form-headline-button__container">
        <Box className="iconHeadline__container">
          <NumbersRoundedIcon className="demandTable__icon" />
          <Typography variant="h4" gutterBottom className="demandTable__title">
            {TITLE}
          </Typography>
        </Box>
        <Link
          to={`/events/event/${eventId}/add-demand`}
          style={{ textDecoration: "none" }}
        >
          <Button
            variant="contained"
            color="secondary"
            style={{ marginBottom: "1rem", float: "right" }}
          >
            <EditIcon className="addIcon" />
            Edit Demands
          </Button>
        </Link>
      </Box>
      {notification && <Alert severity="info">{notification}</Alert>}
      <TableContainer className="events-container" component={Paper}>
        <Table className="events-table">
          <TableHead className="events-table__header">
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
                    Car Demand
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
                    Truck Demand
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
                    Bus Demand
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
                    Allocated Total
                  </TableSortLabel>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {["assembly", "runtime", "disassembly"].map((phase, index) => (
              <React.Fragment key={phase}>
                {groupedDemands[phase]?.length > 0 && (
                  <>
                    {index !== 0 && <Divider />}
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        style={{ backgroundColor: "#f0f0f0" }}
                      >
                        <Box display="flex" alignItems="center">
                          {getPhaseIcon(phase)}
                          <Typography
                            variant="h6"
                            style={{ marginLeft: "0.5rem" }}
                          >
                            {phase.charAt(0).toUpperCase() + phase.slice(1)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                    {groupedDemands[phase].map((demand) => (
                      <TableRow key={demand.id} hover>
                        <TableCell>{formatDate(demand.date)}</TableCell>
                        <TableCell>{demand.car_demand}</TableCell>
                        <TableCell>{demand.truck_demand}</TableCell>
                        <TableCell>{demand.bus_demand}</TableCell>
                        <TableCell>
                          {getAllocatedTotal(demand.date, demand.demand)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={7} align="right">
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() =>
                            navigate(
                              `/events/event/${eventId}/allocate-parking/${phase}`,
                            )
                          }
                          style={{ margin: "1rem 0" }}
                        >
                          Allocate Parking Spaces
                        </Button>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EventDemandTable;
