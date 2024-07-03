import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
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
  CircularProgress,
} from "@mui/material";
import CustomBreadcrumbs from "../../common/BreadCrumbs.jsx";
import EventDemandTable from "./EventDemandTable.jsx";
import EventMapSection from "./EventMapSection.jsx";
import Allocations from "./Allocations.jsx";
import "../../map/styles/map.css";
import "../styles/events.css";
import {
  ArrowCircleUpRounded as ArrowCircleUpRoundedIcon,
  PlayCircleFilledRounded as PlayCircleFilledRoundedIcon,
  ArrowCircleDownRounded as ArrowCircleDownRoundedIcon,
  InsertInvitationRounded as InsertInvitationRoundedIcon,
  EditRounded as EditRoundedIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForwardIosRounded as ArrowForwardIosRoundedIcon,
} from "@mui/icons-material";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import dayjs from "dayjs";

const TITLE = "Event Details";
const INITIAL_DATE = "2000-01-01";

const Event = () => {
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [eventLoading, setEventLoading] = useState(true);
  const [originalEvent, setOriginalEvent] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [events] = useState([]);
  const [selectedDate, setSelectedDate] = useState(INITIAL_DATE);
  const [isEditingDemands, setIsEditingDemands] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`/api/events/event/${id}`);
        const eventData = response.data;

        eventData.assembly_start_date = formatDateToISO(
          eventData.assembly_start_date,
        );
        eventData.assembly_end_date = formatDateToISO(
          eventData.assembly_end_date,
        );
        eventData.runtime_start_date = formatDateToISO(
          eventData.runtime_start_date,
        );
        eventData.runtime_end_date = formatDateToISO(
          eventData.runtime_end_date,
        );
        eventData.disassembly_start_date = formatDateToISO(
          eventData.disassembly_start_date,
        );
        eventData.disassembly_end_date = formatDateToISO(
          eventData.disassembly_end_date,
        );

        const calculateMiddleDate = (start, end) => {
          const startDate = dayjs(start);
          const endDate = dayjs(end);
          const middleDate = startDate.add(
            endDate.diff(startDate, "days") / 2,
            "days",
          );
          return middleDate.format("YYYY-MM-DD");
        };

        setEvent(eventData);
        setOriginalEvent(eventData);
        if (eventData && eventData.runtime_start_date) {
          setSelectedDate(
            calculateMiddleDate(
              eventData.runtime_start_date,
              eventData.runtime_end_date,
            ),
          );
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
        setError("Error fetching event data.");
      } finally {
        setEventLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const hasUnsavedChanges = useCallback(() => {
    return JSON.stringify(event) !== JSON.stringify(originalEvent);
  }, [event, originalEvent]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleNavigate = (path) => {
    if (
      hasUnsavedChanges() &&
      !window.confirm(
        "You have unsaved changes. Are you sure you want to leave?",
      )
    ) {
      return;
    }
    navigate(path);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear().toString().slice(2);
    return `${day}.${month}.${year}`;
  };

  const formatDateToISO = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const getContrastingTextColor = (backgroundColor) => {
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "black" : "white";
  };

  const breadcrumbLinks = [
    { label: "Events", path: "/events" },
    { label: event ? event.name : "Event", path: `/events/event/${id}` },
  ];

  const calculateDaysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (eventLoading) {
    return (
      <Box
        className="form-width"
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="form-width">
      <CustomBreadcrumbs
        links={breadcrumbLinks}
        onClick={(link) => handleNavigate(link.path)}
      />
      <Box className="form-headline-button__container">
        <Box className="iconHeadline__container">
          <InsertInvitationRoundedIcon />
          <Typography variant="h4" gutterBottom>
            {TITLE}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate(`/events/event/edit/${id}`)}
          >
            <Box display="flex" alignItems="center">
              <EditRoundedIcon className="icon__edit-event" />
            </Box>
            Edit Event
          </Button>
        </Box>
      </Box>
      <Paper className="form-container">
        {error && (
          <Typography color="error" variant="body1">
            {error}
          </Typography>
        )}
        <Box paddingBottom="1.5rem">
          <Box
            className="event-box"
            style={{
              backgroundColor: event.color,
              color: getContrastingTextColor(event.color),
            }}
          >
            {event.name}
          </Box>
        </Box>
        <Box paddingBottom="1.5rem">
          <TableContainer className="events-container" component={Paper}>
            <Table className="parkingSpaces-table">
              <TableHead className="parkingSpaces-table__header">
                <TableRow>
                  <TableCell>
                    <Box className="header-icon-container">
                      <ArrowCircleUpRoundedIcon
                        fontSize="small"
                        className="header-icon"
                      />
                      <TableSortLabel>Assembly</TableSortLabel>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box className="header-icon-container">
                      <PlayCircleFilledRoundedIcon
                        fontSize="small"
                        className="header-icon"
                      />
                      <TableSortLabel>Runtime</TableSortLabel>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box className="header-icon-container">
                      <ArrowCircleDownRoundedIcon
                        fontSize="small"
                        className="header-icon"
                      />
                      <TableSortLabel>Disassembly</TableSortLabel>
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell className="time-span-container">
                    <Box display="flex" justifyContent="space-between">
                      <Box className="time-span-days">
                        {calculateDaysBetween(
                          event.assembly_start_date,
                          event.assembly_end_date,
                        )}{" "}
                        Days
                      </Box>
                      <Box className="time-span-date">
                        {formatDate(event.assembly_start_date)}
                      </Box>
                      <ArrowForwardIosRoundedIcon className="time-span-icon" />
                      <Box className="time-span-date">
                        {formatDate(event.assembly_end_date)}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell className="time-span-container">
                    <Box display="flex" justifyContent="space-between">
                      <Box className="time-span-days">
                        {calculateDaysBetween(
                          event.runtime_start_date,
                          event.runtime_end_date,
                        )}{" "}
                        Days
                      </Box>
                      <Box className="time-span-date">
                        {formatDate(event.runtime_start_date)}
                      </Box>
                      <ArrowForwardIosRoundedIcon className="time-span-icon" />
                      <Box
                        className="time-span-date"
                        style={{ textAlign: "right" }}
                      >
                        {formatDate(event.runtime_end_date)}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell className="time-span-container">
                    <Box display="flex" justifyContent="space-between">
                      <Box className="time-span-days">
                        {calculateDaysBetween(
                          event.disassembly_start_date,
                          event.disassembly_end_date,
                        )}{" "}
                        Days
                      </Box>
                      <Box className="time-span-date">
                        {formatDate(event.disassembly_start_date)}
                      </Box>
                      <ArrowForwardIosRoundedIcon className="time-span-icon" />
                      <Box
                        className="time-span-date"
                        style={{ textAlign: "right" }}
                      >
                        {formatDate(event.disassembly_end_date)}
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <EventMapSection
          event={event}
          events={events}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </Paper>
      <EventDemandTable
        eventId={id}
        setIsEditingDemands={setIsEditingDemands}
        style={{ marginBottom: "32px" }}
      />
      <Allocations setIsEditingDemands={setIsEditingDemands} eventId={id} />
      <Box display="flex" justifyContent="space-between" mt={2}>
        <Box display="flex" justifyContent="space-between">
          <Button
            className="back-button"
            variant="outlined"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={() => handleNavigate(`/events/`)}
          >
            Back
          </Button>
        </Box>
        {!isEditingDemands && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AccountTreeRoundedIcon />}
            onClick={() =>
              navigate(`/events/event/${id}/allocate-parking-spaces`)
            }
          >
            Allocate Parking Spaces
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default Event;
