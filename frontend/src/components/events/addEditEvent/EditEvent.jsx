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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
import InfoHover from "../../common/InfoHover.jsx";
import DateRangePicker from "../../controls/DateRangePicker.jsx";
import CustomBreadcrumbs from "../../common/BreadCrumbs.jsx";
import PermissionPopup from "../../common/PermissionPopup.jsx";
import "../styles/events.css";

const TITLE = "Edit Event";

const EditEvent = () => {
  const [event, setEvent] = useState({
    name: "",
    color: "#6a91ce",
    assembly_start_date: "",
    assembly_end_date: "",
    runtime_start_date: "",
    runtime_end_date: "",
    disassembly_start_date: "",
    disassembly_end_date: "",
    halls: [],
    entrances: [],
  });
  const [originalEvent, setOriginalEvent] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitCallback, setSubmitCallback] = useState(null);
  const [occupiedHalls, setOccupiedHalls] = useState([]);
  const [permissionError, setPermissionError] = useState({
    open: false,
    message: "",
  });
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(`/api/events/event/${id}`);
        const eventData = response.data;

        if (!eventData) {
          navigate("/404");
          return;
        }

        setEvent(eventData);
        setOriginalEvent(eventData);
        fetchOccupiedHalls(
          id,
          eventData.assembly_start_date,
          eventData.disassembly_end_date,
        );
      } catch (error) {
        console.error("Error fetching event data:", error);
        setError("Error fetching event data.");
        navigate("/404");
      }
    };

    fetchEvent();
  }, [id, navigate]);

  const fetchOccupiedHalls = async (eventId, startDate, endDate) => {
    if (!startDate || !endDate) return;

    try {
      const response = await axios.get(
        `/api/events/occupied_halls/${eventId}`,
        {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        },
      );
      setOccupiedHalls(response.data);
    } catch (error) {
      console.error("Error fetching occupied halls:", error);
    }
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(event) !== JSON.stringify(originalEvent);
  };

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEvent({
      ...event,
      [name]: value,
    });
  };

  const handleDateRangeChange = (phase, dates) => {
    let updatedEvent = { ...event };
    const start = dates[0] ? dates[0].format("YYYY-MM-DD") : "";
    const end = dates[1] ? dates[1].format("YYYY-MM-DD") : "";

    updatedEvent[`${phase}_start_date`] = start;
    updatedEvent[`${phase}_end_date`] = end;

    if (phase === "assembly") {
      const runtimeStartDate = dates[1] ? dayjs(dates[1]).add(1, "day") : null;
      if (runtimeStartDate) {
        updatedEvent.runtime_start_date = runtimeStartDate.format("YYYY-MM-DD");
        if (dayjs(event.runtime_end_date).isBefore(runtimeStartDate)) {
          updatedEvent.runtime_end_date = runtimeStartDate.format("YYYY-MM-DD");
          const disassemblyStartDate = runtimeStartDate.add(1, "day");
          updatedEvent.disassembly_start_date =
            disassemblyStartDate.format("YYYY-MM-DD");
          if (
            dayjs(event.disassembly_end_date).isBefore(disassemblyStartDate)
          ) {
            updatedEvent.disassembly_end_date =
              disassemblyStartDate.format("YYYY-MM-DD");
          }
        }
      }
    }

    if (phase === "runtime") {
      const assemblyEndDate = dates[0]
        ? dayjs(dates[0]).subtract(1, "day")
        : null;
      if (assemblyEndDate) {
        updatedEvent.assembly_end_date = assemblyEndDate.format("YYYY-MM-DD");
        if (dayjs(event.assembly_start_date).isAfter(assemblyEndDate)) {
          updatedEvent.assembly_start_date = assemblyEndDate
            .subtract(1, "day")
            .format("YYYY-MM-DD");
        }
      }
      const disassemblyStartDate = dates[1]
        ? dayjs(dates[1]).add(1, "day")
        : null;
      if (disassemblyStartDate) {
        updatedEvent.disassembly_start_date =
          disassemblyStartDate.format("YYYY-MM-DD");
        if (dayjs(event.disassembly_end_date).isBefore(disassemblyStartDate)) {
          updatedEvent.disassembly_end_date = disassemblyStartDate
            .add(1, "day")
            .format("YYYY-MM-DD");
        }
      }
    }

    if (phase === "disassembly") {
      const runtimeEndDate = dates[0]
        ? dayjs(dates[0]).subtract(1, "day")
        : null;
      if (runtimeEndDate) {
        updatedEvent.runtime_end_date = runtimeEndDate.format("YYYY-MM-DD");
        if (dayjs(event.runtime_start_date).isAfter(runtimeEndDate)) {
          updatedEvent.runtime_start_date = runtimeEndDate.format("YYYY-MM-DD");
          const assemblyEndDate = runtimeEndDate.subtract(1, "day");
          updatedEvent.assembly_end_date = assemblyEndDate.format("YYYY-MM-DD");
          if (dayjs(event.assembly_start_date).isAfter(assemblyEndDate)) {
            updatedEvent.assembly_start_date =
              assemblyEndDate.format("YYYY-MM-DD");
          }
        }
      }
    }

    setEvent(updatedEvent);
    fetchOccupiedHalls(
      updatedEvent.assembly_start_date,
      updatedEvent.disassembly_end_date,
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    const dateChangedPhases = (originalDate, newDate) => {
      if (!originalDate || !newDate) return false;

      const phases = [
        {
          start: originalEvent.assembly_start_date,
          end: originalEvent.assembly_end_date,
        },
        {
          start: originalEvent.runtime_start_date,
          end: originalEvent.runtime_end_date,
        },
        {
          start: originalEvent.disassembly_start_date,
          end: originalEvent.disassembly_end_date,
        },
      ];

      const originalPhase = phases.findIndex(
        (phase) => originalDate >= phase.start && originalDate <= phase.end,
      );
      const newPhase = phases.findIndex(
        (phase) => newDate >= phase.start && newDate <= phase.end,
      );

      return originalPhase !== newPhase;
    };

    const phaseDatesChanged = [
      ["assembly_start_date", "assembly_end_date"],
      ["runtime_start_date", "runtime_end_date"],
      ["disassembly_start_date", "disassembly_end_date"],
    ].some(([startKey, endKey]) => {
      return (
        dateChangedPhases(originalEvent[startKey], event[startKey]) ||
        dateChangedPhases(originalEvent[endKey], event[endKey])
      );
    });

    if (phaseDatesChanged) {
      setDialogOpen(true);
      setSubmitCallback(() => async () => {
        try {
          await axios.put(`/api/events/event/${id}`, event, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setFeedback({
            open: true,
            message:
              "Event updated successfully. Please review demands and allocations.",
            severity: "success",
          });
          navigate(`/events/event/${id}`);
        } catch (error) {
          if (error.response && error.response.status === 403) {
            setPermissionError({
              open: true,
              message: "You do not have permission to perform this action.",
            });
          } else {
            console.error("Error updating event:", error);
            setFeedback({
              open: true,
              message: "Error updating event.",
              severity: "error",
            });
          }
        }
      });
    } else {
      try {
        await axios.put(`/api/events/event/${id}`, event, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setFeedback({
          open: true,
          message: "Event updated successfully.",
          severity: "success",
        });
        navigate(`/events/event/${id}`);
      } catch (error) {
        if (error.response && error.response.status === 403) {
          setPermissionError({
            open: true,
            message: "You do not have permission to perform this action.",
          });
        } else {
          console.error("Error updating event:", error);
          setFeedback({
            open: true,
            message: "Error updating event.",
            severity: "error",
          });
        }
      }
    }
  };

  const toggleHall = (hall) => {
    if (occupiedHalls.includes(hall)) return;
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
    const startDate = event.assembly_start_date;
    const endDate = event.disassembly_end_date;
    const restrictSelection = !startDate || !endDate;

    for (let row = 0; row < rows; row++) {
      const rowData = [];
      for (let col = 1; col <= cols; col++) {
        const hall = `${String.fromCharCode(67 - row)}${col}`;
        const isOccupied = occupiedHalls.includes(hall);
        const isSelected = halls.includes(hall);
        const isRestricted = restrictSelection || isOccupied;

        rowData.push(
          <TableCell
            key={hall}
            onClick={() => !isRestricted && toggleHall(hall)}
            style={{
              backgroundColor: isSelected
                ? event.color
                : isOccupied
                ? "#ccc"
                : "transparent",
              color: isSelected
                ? getContrastingTextColor(event.color)
                : "inherit",
              textAlign: "center",
              cursor: isRestricted ? "not-allowed" : "pointer",
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

  const breadcrumbLinks = [
    { label: "Events", path: "/events" },
    { label: event.name, path: `/events/event/${id}` },
    { label: "Edit Event", path: `/events/event/edit/${id}` },
  ];

  return (
    <Box className="form-width">
      <CustomBreadcrumbs
        links={breadcrumbLinks}
        onClick={(link) => handleNavigate(link.path)}
      />
      <Paper className="form-container">
        <Box className="iconHeadline__container">
          <EditRoundedIcon />
          <Typography variant="h4" gutterBottom>
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
                label="Event Title"
                name="name"
                value={event.name}
                onChange={handleChange}
                fullWidth
                required={true}
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
            <Box className="input-container">
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <Box className="header-icon-container">
                          <ArrowCircleUpRoundedIcon
                            fontSize="small"
                            className="header-icon"
                          />
                          <Typography
                            variant="h6"
                            className="table-header-title"
                          >
                            Assembly Phase
                          </Typography>{" "}
                          <InfoHover
                            direction="right"
                            infoText="Click on the date range to select the assembly start and end dates."
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box className="header-icon-container">
                          <PlayCircleFilledRoundedIcon
                            fontSize="small"
                            className="header-icon"
                          />
                          <Typography
                            variant="h6"
                            className="table-header-title"
                          >
                            Runtime Phase
                          </Typography>
                          <InfoHover
                            direction="right"
                            infoText="Click on the date range to select the runtime start and end dates."
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box className="header-icon-container">
                          <ArrowCircleDownRoundedIcon
                            fontSize="small"
                            className="header-icon"
                          />
                          <Typography
                            variant="h6"
                            className="table-header-title"
                          >
                            Disassembly Phase
                          </Typography>
                          <InfoHover
                            direction="right"
                            infoText="Click on the date range to select the disassembly start and end dates."
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <DateRangePicker
                          dateRange={[
                            event.runtime_start_date
                              ? dayjs(event.runtime_start_date)
                              : null,
                            event.runtime_end_date
                              ? dayjs(event.runtime_end_date)
                              : null,
                          ]}
                          setDateRange={(dates) =>
                            handleDateRangeChange("runtime", dates)
                          }
                          width100={true}
                        />
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  </TableBody>
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
                      <TableCell colSpan={6} style={{ textAlign: "center" }}>
                        <Box className="header-icon-container">
                          <OtherHousesRoundedIcon
                            fontSize="small"
                            className="header-icon"
                          />
                          <Typography
                            variant="h6"
                            className="table-header-title"
                          >
                            Halls
                          </Typography>{" "}
                          <InfoHover
                            direction="right"
                            infoText="Click on a hall to toggle it."
                          />
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
                          <Typography
                            variant="h6"
                            className="table-header-title"
                          >
                            Entrances
                            <InfoHover
                              direction="right"
                              infoText="Click on an entrance to toggle it."
                            />
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
              onClick={() => handleNavigate(`/events/event/${id}`)}
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Phase Dates Changed</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Phase dates have changed. Please review demands and allocations!
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            className="popup-btn-close"
            onClick={() => setDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="popup-btn"
            variant="contained"
            color="primary"
            onClick={() => {
              setDialogOpen(false);
              if (submitCallback) submitCallback();
            }}
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
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
      <PermissionPopup
        open={permissionError.open}
        onClose={() => setPermissionError({ ...permissionError, open: false })}
        message={permissionError.message}
      />
    </Box>
  );
};

export default EditEvent;
