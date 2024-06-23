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
} from "@mui/material";
import {
  ArrowCircleUpRounded as ArrowCircleUpRoundedIcon,
  PlayCircleFilledRounded as PlayCircleFilledRoundedIcon,
  ArrowCircleDownRounded as ArrowCircleDownRoundedIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import InsertInvitationRoundedIcon from "@mui/icons-material/InsertInvitationRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OtherHousesRoundedIcon from "@mui/icons-material/OtherHousesRounded";
import DoorSlidingRoundedIcon from "@mui/icons-material/DoorSlidingRounded";
import EventDemandTable from "./EventDemandTable";
import "./styles/events.css";

const TITLE = "Event Details";

const Event = () => {
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`/api/events/event/${id}`);
        setEvent(response.data);
      } catch (error) {
        console.error("Error fetching event data:", error);
        setError("Error fetching event data.");
      }
    };

    fetchEvent();
  }, [id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear().toString().slice(2); // Last two digits of the year
    return `${day}.${month}.${year}`;
  };

  const renderHallMatrix = (halls) => {
    const hallMatrix = [];
    const rows = 3;
    const cols = 6;

    for (let row = 0; row < rows; row++) {
      const rowData = [];
      for (let col = 1; col <= cols; col++) {
        const hall = `${String.fromCharCode(67 - row)}${col}`;
        rowData.push(
          <TableCell
            key={hall}
            style={{
              backgroundColor: halls.includes(hall)
                ? event.color
                : "transparent",
              color: halls.includes(hall)
                ? getContrastingTextColor(event.color)
                : "inherit",
              textAlign: "center",
            }}
          >
            {hall}
          </TableCell>
        );
      }
      hallMatrix.push(<TableRow key={row}>{rowData}</TableRow>);
    }

    return hallMatrix;
  };

  const renderEntranceGrid = (entrances) => {
    const entranceGrid = [
      ["North West", "North", "North East"],
      ["West", "", "East"],
    ];

    return entranceGrid.map((row, rowIndex) => (
      <TableRow key={rowIndex}>
        {row.map((cell, cellIndex) => (
          <TableCell
            key={cellIndex}
            style={{
              backgroundColor: entrances.includes(cell)
                ? event.color
                : "transparent",
              color: entrances.includes(cell)
                ? getContrastingTextColor(event.color)
                : "inherit",
              textAlign: "center",
            }}
          >
            {cell}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  if (!event) {
    return (
      <Box className="form-width">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

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
        <Box padding="16px" textAlign="center">
          <Box
            className="event-box"
            style={{
              backgroundColor: event.color,
              color: getContrastingTextColor(event.color),
              display: "inline-block",
              padding: "10px 20px",
              borderRadius: "4px",
            }}
          >
            {event.name}
          </Box>
        </Box>
        <Box padding="16px">
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
                  <TableCell>
                    <Box display="flex" justifyContent="space-between">
                      <Box>{formatDate(event.assembly_start_date)}</Box>
                      <Box> - </Box>
                      <Box>{formatDate(event.assembly_end_date)}</Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" justifyContent="space-between">
                      <Box>{formatDate(event.runtime_start_date)}</Box>
                      <Box> - </Box>
                      <Box style={{ textAlign: "right" }}>
                        {formatDate(event.runtime_end_date)}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" justifyContent="space-between">
                      <Box>{formatDate(event.disassembly_start_date)}</Box>
                      <Box> - </Box>
                      <Box style={{ textAlign: "right" }}>
                        {formatDate(event.disassembly_end_date)}
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Box padding="16px">
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: "center" }}>
                    <Box className="header-icon-container">
                      <OtherHousesRoundedIcon
                        fontSize="small"
                        className="header-icon"
                      />
                      <TableSortLabel>Halls</TableSortLabel>
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{renderHallMatrix(event.halls)}</TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Box padding="16px">
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell colSpan={3} style={{ textAlign: "center" }}>
                    <Box className="header-icon-container">
                      <DoorSlidingRoundedIcon
                        fontSize="small"
                        className="header-icon"
                      />
                      <TableSortLabel>Entrances</TableSortLabel>
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{renderEntranceGrid(event.entrances)}</TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
      <EventDemandTable eventId={id} />
      <Box display="flex" justifyContent="space-between" mt={2}>
        <Button
          className="back-button"
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/events/`)}
        >
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default Event;
