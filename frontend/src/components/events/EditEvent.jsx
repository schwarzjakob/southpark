import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import InsertInvitationRoundedIcon from "@mui/icons-material/InsertInvitationRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import OtherHousesRoundedIcon from "@mui/icons-material/OtherHousesRounded";
import ArrowCircleUpRoundedIcon from "@mui/icons-material/ArrowCircleUpRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import ArrowCircleDownRoundedIcon from "@mui/icons-material/ArrowCircleDownRounded";
import DoorSlidingRoundedIcon from "@mui/icons-material/DoorSlidingRounded";
import dayjs from "dayjs";
import DateRangePicker from "../controls/DateRangePicker";
import "./styles/events.css";

const TITLE = "Edit Event";

const EditEvent = () => {
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`/api/events/event/${id}`);
        console.log("Fetched event data:", response.data); // Add this line
        setEvent(response.data);
      } catch (error) {
        console.error("Error fetching event data:", error);
        setError("Error fetching event data.");
      }
    };

    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvent({
      ...event,
      [name]: value,
    });
  };

  const handleDateRangeChange = (phase, dates) => {
    setEvent({
      ...event,
      [`${phase}_start_date`]: dates[0] ? dates[0].format("YYYY-MM-DD") : "",
      [`${phase}_end_date`]: dates[1] ? dates[1].format("YYYY-MM-DD") : "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/events/event/${id}`, event);
      setFeedback({
        open: true,
        message: "Event updated successfully.",
        severity: "success",
      });
      navigate(`/events/event/${id}`);
    } catch (error) {
      console.error("Error updating event:", error);
      setError("Error updating event.");
      setFeedback({
        open: true,
        message: "Error updating event.",
        severity: "error",
      });
    }
  };

  const toggleHall = (hall) => {
    setEvent((prevEvent) => {
      const halls = prevEvent.halls.includes(hall)
        ? prevEvent.halls.filter((h) => h !== hall)
        : [...prevEvent.halls, hall];
      return { ...prevEvent, halls };
    });
  };

  const toggleEntrance = (entrance) => {
    setEvent((prevEvent) => {
      const entrances = prevEvent.entrances.includes(entrance)
        ? prevEvent.entrances.filter((e) => e !== entrance)
        : [...prevEvent.entrances, entrance];
      return { ...prevEvent, entrances };
    });
  };

  const getContrastingTextColor = (backgroundColor) => {
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "black" : "white";
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
            onClick={() => toggleHall(hall)}
            style={{
              backgroundColor: halls.includes(hall)
                ? event.color
                : "transparent",
              color: halls.includes(hall)
                ? getContrastingTextColor(event.color)
                : "inherit",
              cursor: "pointer",
            }}
          >
            {hall}
          </TableCell>,
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
            onClick={() => cell && toggleEntrance(cell)}
            style={{
              backgroundColor: entrances.includes(cell)
                ? event.color
                : "transparent",
              color: entrances.includes(cell)
                ? getContrastingTextColor(event.color)
                : "inherit",
              cursor: cell ? "pointer" : "default",
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

  return (
    <Box className="form-width">
      <Paper className="form-container">
        <Box className="iconHeadline__container">
          <EditRoundedIcon />
          <Typography variant="h4" gutterBottom className="demandTable__title">
            {TITLE}
          </Typography>
        </Box>
        {error && (
          <Typography color="error" variant="body1">
            {error}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <InsertInvitationRoundedIcon className="input-container__icon" />
              <TextField
                label="Name"
                name="name"
                value={event.name}
                onChange={handleChange}
                fullWidth
              />
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <ColorLensIcon className="input-container__icon" />
              <TextField
                label="Color"
                name="color"
                type="color"
                value={event.color}
                onChange={handleChange}
                fullWidth
              />
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Typography variant="h5" style={{ padding: "0 0 0 36px" }}>
              Assembly
            </Typography>
            <Box className="input-container">
              <ArrowCircleUpRoundedIcon className="input-container__icon" />
              <DateRangePicker
                dateRange={[
                  event.assembly_start_date
                    ? dayjs(event.assembly_start_date)
                    : null,
                  event.assembly_end_date
                    ? dayjs(event.assembly_end_date)
                    : null,
                ]}
                setDateRange={(dates) =>
                  handleDateRangeChange("assembly", dates)
                }
                width100={true}
              />
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Typography variant="h5" style={{ padding: "0 0 0 36px" }}>
              Runtime
            </Typography>
            <Box className="input-container">
              <PlayCircleFilledRoundedIcon className="input-container__icon" />
              <DateRangePicker
                dateRange={[
                  event.runtime_start_date
                    ? dayjs(event.runtime_start_date)
                    : null,
                  event.runtime_end_date ? dayjs(event.runtime_end_date) : null,
                ]}
                setDateRange={(dates) =>
                  handleDateRangeChange("runtime", dates)
                }
                width100={true}
              />
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Typography variant="h5" style={{ padding: "0 0 0 36px" }}>
              Disassembly
            </Typography>
            <Box className="input-container">
              <ArrowCircleDownRoundedIcon className="input-container__icon" />
              <DateRangePicker
                dateRange={[
                  event.disassembly_start_date
                    ? dayjs(event.disassembly_start_date)
                    : null,
                  event.disassembly_end_date
                    ? dayjs(event.disassembly_end_date)
                    : null,
                ]}
                setDateRange={(dates) =>
                  handleDateRangeChange("disassembly", dates)
                }
                width100={true}
              />
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
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
                          <Typography variant="h6">
                            <TableSortLabel>Halls</TableSortLabel>
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>{renderHallMatrix(event.halls)}</TableBody>
                </Table>
              </TableContainer>
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell colSpan={5} style={{ textAlign: "center" }}>
                        <Box className="header-icon-container">
                          <DoorSlidingRoundedIcon
                            fontSize="small"
                            className="header-icon"
                          />
                          <Typography variant="h6">
                            <TableSortLabel>Entrances</TableSortLabel>
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>{renderEntranceGrid(event.entrances)}</TableBody>
                </Table>
              </TableContainer>
            </Box>
          </FormControl>
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Button
              className="back-button"
              variant="outlined"
              color="primary"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveRoundedIcon />}
            >
              Save
            </Button>
          </Box>
        </form>
      </Paper>
      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback({ ...feedback, open: false })}
      >
        <Alert
          onClose={() => setFeedback({ ...feedback, open: false })}
          severity={feedback.severity}
          sx={{ width: "100%" }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditEvent;
