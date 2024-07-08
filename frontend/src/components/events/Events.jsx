import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import PropTypes from "prop-types";
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
  Typography,
  Box,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import FilterDropdown from "./FilterDropdown";
import HallEntranceIcons from "./HallEntranceIcons";
import InsertInvitationRoundedIcon from "@mui/icons-material/InsertInvitationRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ArrowCircleUpRoundedIcon from "@mui/icons-material/ArrowCircleUpRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import ArrowCircleDownRoundedIcon from "@mui/icons-material/ArrowCircleDownRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import GarageIcon from "@mui/icons-material/GarageRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import CircleIcon from "@mui/icons-material/Circle";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LoadingAnimation from "../common/LoadingAnimation.jsx";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OtherHousesRoundedIcon from "@mui/icons-material/OtherHousesRounded";
import "./styles/events.css";
import dayjs from "dayjs";

const TITLE = "Events";

const getContrastingTextColor = (backgroundColor) => {
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "black" : "white";
};

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

const applyFilters = (events, filters) => {
  return events.filter((event) => {
    const entrances = event.entrances.map((e) => e.name) || [];
    const halls = event.halls.map((h) => h.name) || [];
    const allocatedParkingLots = event.allocatedParkingLots || [];
    const status = event.status || "unknown";

    const entrancesMatch =
      filters.entrances.length === 0 ||
      filters.entrances.some((filter) => entrances.includes(filter));

    const hallsMatch =
      filters.halls.length === 0 ||
      filters.halls.some((filter) => halls.includes(filter));

    const parkingLotsMatch =
      filters.parkingLots.length === 0 ||
      filters.parkingLots.some((filter) =>
        allocatedParkingLots.includes(filter),
      );

    const statusMatch =
      filters.status.length === 0 || filters.status.includes(status);

    return entrancesMatch && hallsMatch && parkingLotsMatch && statusMatch;
  });
};

const getStatusText = (status) => {
  switch (status) {
    case "no_demands":
      return "Demands missing";
    case "ok":
      return "Fully allocated";
    case "demands_to_allocate":
      return "Demands to allocate";
    case "not_enough_capacity":
      return "Not enough capacity";
    default:
      return "Unknown status";
  }
};

const Events = ({ selectedDate }) => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [originalPage, setOriginalPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    entrances: [],
    halls: [],
    parkingLots: [],
    status: [],
  });
  const [isInitialPageSet, setIsInitialPageSet] = useState(false);
  const navigate = useNavigate();

  const filteredEvents = applyFilters(
    events
      .filter((event) => {
        if (selectedDate) {
          const selectedDay = dayjs(selectedDate);
          const assemblyStart = dayjs(event.assembly_start_date);
          const disassemblyEnd = dayjs(event.disassembly_end_date);
          return (
            (selectedDay.isAfter(assemblyStart.subtract(1, "day")) ||
              selectedDay.isSame(assemblyStart)) &&
            selectedDay.isBefore(disassemblyEnd)
          );
        }
        return true;
      })
      .filter((event) => {
        return event.name.toLowerCase().includes(filter.toLowerCase());
      }),
    filters,
  );

  const handleFilterChange = (event) => {
    const newFilter = event.target.value;
    setFilter(newFilter);

    setPage(0);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleFilterDropdownChange = (filterName, selectedOptions) => {
    console.log("selectedOptions", selectedOptions);
    setFilters((prevFilters) => {
      let newFilters;
      if (filterName === "hallsAndEntrances") {
        const halls = selectedOptions.filter((option) =>
          events.some((event) =>
            event.halls.map((h) => h.name).includes(option),
          ),
        );
        const entrances = selectedOptions.filter((option) =>
          events.some((event) =>
            event.entrances.map((e) => e.name).includes(option),
          ),
        );
        newFilters = {
          ...prevFilters,
          halls,
          entrances,
        };
      } else {
        newFilters = {
          ...prevFilters,
          [filterName]: selectedOptions,
        };
      }

      const allFiltersEmpty = Object.values(newFilters).every(
        (filter) => filter.length === 0,
      );

      if (allFiltersEmpty) {
        setPage(originalPage);
      } else {
        if (Object.values(prevFilters).every((filter) => filter.length === 0)) {
          setOriginalPage(page);
        }
        setPage(0);
      }

      return newFilters;
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear().toString().slice(2);
    return `${day}.${month}.${year}`;
  };

  const getCurrentPage = useCallback(() => {
    const today = new Date();
    const closestEventIndex = filteredEvents
      .map((event, index) => ({
        index,
        start: new Date(event.assembly_start_date),
        end: new Date(event.disassembly_end_date),
      }))
      .filter((event) => event.start <= today && today <= event.end)
      .map((event) => event.index)
      .sort(
        (a, b) =>
          Math.abs(today - filteredEvents[a].start) -
          Math.abs(today - filteredEvents[b].start),
      )[0];

    return closestEventIndex !== undefined ? closestEventIndex : 0;
  }, [filteredEvents]);

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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && !isInitialPageSet) {
      setPage(Math.floor(getCurrentPage() / rowsPerPage));
      setIsInitialPageSet(true);
    }
  }, [loading, events, rowsPerPage, isInitialPageSet, getCurrentPage]);

  const ensureValidPage = useCallback(
    (filteredEvents) => {
      const maxPage = Math.max(
        0,
        Math.ceil(filteredEvents.length / rowsPerPage) - 1,
      );
      if (page > maxPage) {
        setPage(maxPage);
      }
    },
    [page, rowsPerPage],
  );

  useEffect(() => {
    ensureValidPage(filteredEvents);
  }, [filteredEvents, ensureValidPage]);

  const hallAndEntranceOptions = [
    ...new Set([
      ...events.flatMap((event) => event.halls.map((h) => h.name)),
      ...events.flatMap((event) => event.entrances.map((e) => e.name)),
    ]),
  ];

  const parkingLotOptions = [
    ...new Set(events.flatMap((event) => event.allocatedParkingLots)),
  ];

  const statusOptions = [...new Set(events.map((event) => event.status))];

  return (
    <Box className="form-width event">
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
          className="event-filter"
          fullWidth
          placeholder="Filter events by name"
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
      {loading ? (
        <LoadingAnimation />
      ) : (
        <Box>
          <TableContainer className="events-container" component={Paper}>
            <Table className="events-table">
              <TableHead className="events-table__header">
                <TableRow>
                  <TableCell>
                    <Box className="header-icon-container events">
                      <InsertInvitationRoundedIcon
                        fontSize="small"
                        className="header-icon"
                      />
                      Event
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box className="header-icon-container events">
                      <OtherHousesRoundedIcon
                        fontSize="small"
                        className="header-icon"
                      />
                      Entrances & Halls
                      <FilterDropdown
                        label="Halls & Entrances"
                        options={hallAndEntranceOptions}
                        selectedOptions={[
                          ...filters.halls,
                          ...filters.entrances,
                        ]}
                        onChange={(selectedOptions) =>
                          handleFilterDropdownChange(
                            "hallsAndEntrances",
                            selectedOptions,
                          )
                        }
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box className="header-icon-container events">
                      <GarageIcon fontSize="small" className="header-icon" />
                      Allocated Parking Spaces
                      <FilterDropdown
                        label="Allocated Parking Lots"
                        options={parkingLotOptions}
                        selectedOptions={filters.parkingLots}
                        onChange={(selectedOptions) =>
                          handleFilterDropdownChange(
                            "parkingLots",
                            selectedOptions,
                          )
                        }
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box className="header-icon-container events">
                      <ArrowCircleUpRoundedIcon
                        fontSize="small"
                        className="header-icon"
                      />
                      Assembly
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box className="header-icon-container events">
                      <PlayCircleFilledRoundedIcon
                        fontSize="small"
                        className="header-icon"
                      />
                      Runtime
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box className="header-icon-container events">
                      <ArrowCircleDownRoundedIcon
                        fontSize="small"
                        className="header-icon"
                      />
                      Disassembly
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box className="header-icon-container events">
                      <AssessmentRoundedIcon
                        fontSize="small"
                        className="header-icon"
                      />
                      Capacity Status
                      <FilterDropdown
                        label="Capacity Status"
                        options={statusOptions}
                        selectedOptions={filters.status}
                        onChange={(selectedOptions) =>
                          handleFilterDropdownChange("status", selectedOptions)
                        }
                        align="right"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <p></p>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No Events.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((event) => (
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
                        <TableCell
                          className="halls"
                          style={{ padding: "0", paddingRight: "1rem" }}
                        >
                          <HallEntranceIcons
                            color={event.color}
                            hallIds={event.halls.map((h) => h.id)}
                            entranceIds={event.entrances.map((e) => e.id)}
                          />
                        </TableCell>

                        <TableCell className="allocated-parking-lots">
                          <Box
                            className="parking-lot-container"
                            display="flex"
                            flexWrap="wrap"
                            gap="5px"
                            maxWidth="10rem"
                          >
                            {event.allocatedParkingLots &&
                              event.allocatedParkingLots.map((lot) => (
                                <Box
                                  key={lot}
                                  className="parking-lot"
                                  style={{
                                    backgroundColor: "#6a91ce",
                                    color: "white",
                                    padding: "2px 5px",
                                    borderRadius: "3px",
                                    wordWrap: "break-word",
                                  }}
                                >
                                  {lot}
                                </Box>
                              ))}
                          </Box>
                        </TableCell>
                        <TableCell className="assembly">
                          {`${formatDate(event.assembly_start_date)} -`}
                          <br />
                          {`${formatDate(event.assembly_end_date)}`}
                        </TableCell>
                        <TableCell className="runtime">
                          {`${formatDate(event.runtime_start_date)} -`}
                          <br />
                          {`${formatDate(event.runtime_end_date)}`}
                        </TableCell>
                        <TableCell className="disassembly">
                          {`${formatDate(event.disassembly_start_date)} -`}
                          <br />
                          {`${formatDate(event.disassembly_end_date)}`}
                        </TableCell>
                        <TableCell className="status">
                          <Box
                            className="status-box"
                            display="flex"
                            alignItems="center"
                          >
                            {getStatusCircle(event.status)}
                            <Typography
                              variant="body2"
                              style={{ marginLeft: "8px" }}
                            >
                              {getStatusText(event.status)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() =>
                              navigate(`/events/event/${event.id}`)
                            }
                            edge="start"
                            size="small"
                          >
                            <ArrowForwardIosRoundedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box
            className="pagination-container"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            paddingTop="1rem"
          >
            <Button
              className="btn-events-pages"
              color="primary"
              onClick={() => handlePageChange(null, page - 1)}
              disabled={page === 0}
            >
              <ArrowBackIcon />
            </Button>
            <Typography>
              Page {page + 1} of{" "}
              {Math.ceil(filteredEvents.length / rowsPerPage)}
            </Typography>
            <Button
              className="btn-events-pages"
              color="primary"
              onClick={() => handlePageChange(null, page + 1)}
              disabled={
                page >= Math.ceil(filteredEvents.length / rowsPerPage) - 1
              }
            >
              <ArrowForwardIcon />
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

Events.propTypes = {
  selectedDate: PropTypes.string,
};

export default Events;
