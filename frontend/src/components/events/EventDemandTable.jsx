import { useState, useEffect } from "react";
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
  IconButton,
  Alert,
} from "@mui/material";
import {
  DateRangeRounded as DateRangeRoundedIcon,
  DirectionsCarFilledRounded as DirectionsCarFilledRoundedIcon,
  AirportShuttleRounded as AirportShuttleRoundedIcon,
  LocalShippingRounded as LocalShippingRoundedIcon,
  NumbersRounded as NumbersRoundedIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import ArrowCircleUpRoundedIcon from "@mui/icons-material/ArrowCircleUpRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import ArrowCircleDownRoundedIcon from "@mui/icons-material/ArrowCircleDownRounded";

import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "./styles/events.css";

const TITLE = "Event Demands";

const EventDemandTable = ({ eventId }) => {
  EventDemandTable.propTypes = {
    eventId: PropTypes.string.isRequired,
  };

  const [demands, setDemands] = useState([]);
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

    fetchDemands();
  }, [eventId]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedDemands = demands.sort((a, b) => {
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

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case "early_assembly":
      case "assembly":
        return <ArrowCircleUpRoundedIcon fontSize="small" />;
      case "runtime":
        return <PlayCircleFilledRoundedIcon fontSize="small" />;
      case "disassembly":
      case "late_disassembly":
        return <ArrowCircleDownRoundedIcon fontSize="small" />;
      default:
        return null;
    }
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
            <AddIcon className="addIcon" />
            Add Demand
          </Button>
        </Link>
      </Box>
      {notification && <Alert severity="info">{notification}</Alert>}
      {demands.length > 0 && (
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
                    Car Demand
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <LocalShippingRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    Truck Demand
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <AirportShuttleRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    Bus Demand
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <DirectionsCarFilledRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    Total Demand
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <DirectionsCarFilledRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    Phase
                  </Box>
                </TableCell>
                <TableCell>
                  <p></p>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedDemands.map((demand) => (
                <TableRow
                  key={demand.id}
                  hover
                  onClick={() =>
                    navigate(
                      `/events/event/${eventId}/edit-demand/${demand.id}`,
                    )
                  }
                  style={{ cursor: "pointer" }}
                >
                  <TableCell>{formatDate(demand.date)}</TableCell>
                  <TableCell>{demand.car_demand}</TableCell>
                  <TableCell>{demand.truck_demand}</TableCell>
                  <TableCell>{demand.bus_demand}</TableCell>
                  <TableCell>{demand.demand}</TableCell>
                  <TableCell>
                    <Box className="header-icon-container">
                      {getPhaseIcon(demand.status)}
                      {demand.status.replace("_", " ")}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/events/event/${eventId}/edit-demand/${demand.id}`,
                        );
                      }}
                      edge="start"
                      size="small"
                    >
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default EventDemandTable;
