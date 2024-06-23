import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  TableSortLabel,
  Typography,
  Box,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import InsertInvitationRoundedIcon from "@mui/icons-material/InsertInvitationRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DoorSlidingRoundedIcon from "@mui/icons-material/DoorSlidingRounded";
import OtherHousesRoundedIcon from "@mui/icons-material/OtherHousesRounded";
import ArrowCircleUpRoundedIcon from "@mui/icons-material/ArrowCircleUpRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import ArrowCircleDownRoundedIcon from "@mui/icons-material/ArrowCircleDownRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import CircleIcon from "@mui/icons-material/Circle";

import "./styles/events.css";

const TITLE = "Events";

const getStatusCircle = (status) => {
  let color;
  switch (status) {
    case "ok":
      color = "green";
      break;
    case "demands_to_allocate":
      color = "orange";
      break;
    case "not_enough_capacity":
      color = "red";
      break;
    default:
      color = "gray";
  }
  return <CircleIcon style={{ color }} />;
};

const getStatusText = (status) => {
  switch (status) {
    case "no_demands":
      return "No demands known";
    case "ok":
      return "O.K.";
    case "demands_to_allocate":
      return "Demands to allocate";
    case "not_enough_capacity":
      return "Not enough capacity";
    default:
      return "Unknown status";
  }
};

const Events = () => {
  const [events, setEvents] = useState([]);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");
  const [filter, setFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsResponse, statusResponse] = await Promise.all([
          axios.get("/api/events/events"),
          axios.get("/api/events/events_status"),
        ]);

        const events = eventsResponse.data;
        const statusMap = statusResponse.data.reduce((acc, status) => {
          acc[status.event_id] = status.status;
          return acc;
        }, {});

        const eventsWithStatus = events.map((event) => ({
          ...event,
          status: statusMap[event.id] || "unknown",
        }));

        setEvents(eventsWithStatus);
      } catch (error) {
        console.error("Error fetching events data", error);
      }
    };

    fetchData();
  }, []);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const filteredEvents = events.filter((event) =>
    event.name.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedEvents = filteredEvents.sort((a, b) => {
    if (orderBy === "name") {
      return order === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (orderBy === "entrance") {
      return order === "asc"
        ? a.entrances.join(", ").localeCompare(b.entrances.join(", "))
        : b.entrances.join(", ").localeCompare(a.entrances.join(", "));
    } else if (orderBy === "halls") {
      return order === "asc"
        ? a.halls.length - b.halls.length
        : b.halls.length - a.halls.length;
    } else if (orderBy === "assembly") {
      return order === "asc"
        ? a.assembly_start_date.localeCompare(b.assembly_start_date)
        : b.assembly_start_date.localeCompare(a.assembly_start_date);
    } else if (orderBy === "runtime") {
      return order === "asc"
        ? a.runtime_start_date.localeCompare(b.runtime_start_date)
        : b.runtime_start_date.localeCompare(a.runtime_start_date);
    } else if (orderBy === "disassembly") {
      return order === "asc"
        ? a.disassembly_start_date.localeCompare(b.disassembly_start_date)
        : b.disassembly_start_date.localeCompare(a.disassembly_start_date);
    } else if (orderBy === "status") {
      return order === "asc"
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    return 0;
  });

  const groupHallsByLetter = (halls) => {
    return halls.reduce((acc, hall) => {
      const letter = hall.charAt(0).toUpperCase();
      if (!acc[letter]) {
        acc[letter] = [];
      }
      acc[letter].push(hall);
      return acc;
    }, {});
  };

  const getContrastingTextColor = (backgroundColor) => {
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "black" : "white";
  };

  return (
    <Box className="form-width">
      <Box className="form-headline-button__container">
        <Box className="iconHeadline__container">
          <InsertInvitationRoundedIcon />
          <Typography variant="h4" gutterBottom>
            {TITLE}
          </Typography>
        </Box>
        <Link to="/event/add" style={{ textDecoration: "none" }}>
          <Button
            variant="contained"
            color="secondary"
            style={{ marginBottom: "1rem", float: "right" }}
          >
            <AddRoundedIcon className="addIcon" />
            Add Event
          </Button>
        </Link>
      </Box>
      <Box>
        <TextField
          variant="outlined"
          fullWidth
          placeholder="Search events"
          value={filter}
          onChange={handleFilterChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon />
              </InputAdornment>
            ),
          }}
          style={{ marginBottom: "1rem" }}
        />
      </Box>
      <Box>
        <TableContainer className="events-container" component={Paper}>
          <Table className="events-table">
            <TableHead className="events-table__header">
              <TableRow>
                <TableCell>
                  <Box className="header-icon-container">
                    <InsertInvitationRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "name"}
                      direction={orderBy === "name" ? order : "asc"}
                      onClick={() => handleRequestSort("name")}
                    >
                      Event
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <DoorSlidingRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "entrance"}
                      direction={orderBy === "entrance" ? order : "asc"}
                      onClick={() => handleRequestSort("entrance")}
                    >
                      Entrance
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <OtherHousesRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "halls"}
                      direction={orderBy === "halls" ? order : "asc"}
                      onClick={() => handleRequestSort("halls")}
                    >
                      Halls
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <ArrowCircleUpRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "assembly"}
                      direction={orderBy === "assembly" ? order : "asc"}
                      onClick={() => handleRequestSort("assembly")}
                    >
                      Assembly
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <PlayCircleFilledRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "runtime"}
                      direction={orderBy === "runtime" ? order : "asc"}
                      onClick={() => handleRequestSort("runtime")}
                    >
                      Runtime
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <ArrowCircleDownRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "disassembly"}
                      direction={orderBy === "disassembly" ? order : "asc"}
                      onClick={() => handleRequestSort("disassembly")}
                    >
                      Disassembly
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box className="header-icon-container">
                    <AssessmentRoundedIcon
                      fontSize="small"
                      className="header-icon"
                    />
                    <TableSortLabel
                      active={orderBy === "status"}
                      direction={orderBy === "status" ? order : "asc"}
                      onClick={() => handleRequestSort("status")}
                    >
                      Capacity Status
                    </TableSortLabel>
                  </Box>
                </TableCell>
                <TableCell>
                  <p></p>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEvents.map((event) => (
                <TableRow
                  key={event.id}
                  onClick={() => navigate(`/events/event/${event.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell className="event-name">
                    <Box
                      className="event-box"
                      style={{
                        backgroundColor: event.color,
                        color: getContrastingTextColor(event.color),
                        wordWrap: "break-word",
                        maxWidth: "200px",
                      }}
                    >
                      {event.name}
                    </Box>
                  </TableCell>
                  <TableCell className="entrances">
                    {event.entrances.join(", ")}
                  </TableCell>
                  <TableCell className="halls">
                    {Object.entries(groupHallsByLetter(event.halls)).map(
                      ([letter, halls]) => (
                        <Box key={letter}>{halls.join(", ")}</Box>
                      )
                    )}
                  </TableCell>
                  <TableCell className="assembly">
                    {`${new Date(
                      event.assembly_start_date
                    ).toLocaleDateString()} - ${new Date(
                      event.assembly_end_date
                    ).toLocaleDateString()}`}
                  </TableCell>
                  <TableCell className="runtime">
                    {`${new Date(
                      event.runtime_start_date
                    ).toLocaleDateString()} - ${new Date(
                      event.runtime_end_date
                    ).toLocaleDateString()}`}
                  </TableCell>
                  <TableCell className="disassembly">
                    {`${new Date(
                      event.disassembly_start_date
                    ).toLocaleDateString()} - ${new Date(
                      event.disassembly_end_date
                    ).toLocaleDateString()}`}
                  </TableCell>
                  <TableCell className="status">
                    <Box
                      className="status-box"
                      display="flex"
                      alignItems="center"
                    >
                      {getStatusCircle(event.status)}
                      <Typography variant="body2" style={{ marginLeft: "8px" }}>
                        {getStatusText(event.status)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => navigate(`/events/event/${event.id}`)}
                      edge="start"
                      size="small"
                    >
                      <ArrowForwardIosRoundedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default Events;
