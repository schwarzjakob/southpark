import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Typography,
  Grid,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
  Checkbox,
  ListItemText,
  Divider,
} from "@mui/material";
import { usePapaParse } from "react-papaparse";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import axios from "axios";

const defaultMapping = {
  name: "Event Name",
  halls: "Halls",
  assembly_start_date: "Assembly Start Date",
  assembly_end_date: "Assembly End Date",
  runtime_start_date: "Runtime Start Date",
  runtime_end_date: "Runtime End Date",
  disassembly_start_date: "Disassembly Start Date",
  disassembly_end_date: "Disassembly End Date",
  entrance: "Entrance",
};

const hallOptions = [
  "A1",
  "A2",
  "A3",
  "A4",
  "A5",
  "A6",
  "B1",
  "B2",
  "B3",
  "B4",
  "B5",
  "B6",
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
];

const entranceLabels = {
  west: "West",
  north_west: "Northwest",
  north: "North",
  north_east: "Northeast",
  east: "East",
};

const phaseLabels = {
  assembly: "Assembly",
  runtime: "Runtime",
  disassembly: "Disassembly",
};

const ImportCSV = () => {
  const navigate = useNavigate();
  const { readString } = usePapaParse();
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [mapping, setMapping] = useState(defaultMapping);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [events, setEvents] = useState([]);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const bodyHeight = document.body.scrollHeight - windowHeight;

      setShowScrollToTop(scrollTop > 600);
      setShowScrollToBottom(scrollTop < bodyHeight - 600);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      readString(target.result, {
        header: true,
        complete: (results) => {
          setCsvData(results.data);
          setCsvHeaders(Object.keys(results.data[0]));
          const autoMapping = Object.keys(defaultMapping).reduce((acc, key) => {
            const header = Object.keys(results.data[0]).find((h) =>
              h.toLowerCase().includes(defaultMapping[key].toLowerCase())
            );
            acc[key] = header || "";
            return acc;
          }, {});
          setMapping(autoMapping);
        },
      });
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (event) => {
    const { name, value } = event.target;
    setMapping((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleProcessData = () => {
    const processedEvents = csvData.map((row) => {
      const event = {};
      Object.keys(mapping).forEach((key) => {
        event[key] = row[mapping[key]];
      });
      event.dates = {
        assembly: {
          start: event.assembly_start_date,
          end: event.assembly_end_date,
        },
        runtime: {
          start: event.runtime_start_date,
          end: event.runtime_end_date,
        },
        disassembly: {
          start: event.disassembly_start_date,
          end: event.disassembly_end_date,
        },
      };
      return event;
    });
    setEvents(processedEvents);
  };

  const checkHallAvailability = async (eventData) => {
    const response = await axios.post(
      "http://127.0.0.1:5000/check_hall_availability",
      {
        halls: eventData.halls,
        dates: eventData.dates,
      }
    );
    return response.data;
  };

  const handleImport = async () => {
    setLoading(true);

    // Check hall availability for each event
    for (const eventData of events) {
      try {
        const availability = await checkHallAvailability(eventData);
        const { occupied_halls, free_halls } = availability;

        if (occupied_halls && Object.keys(occupied_halls).length > 0) {
          const conflictMessages = [
            "<strong>Did you select the wrong hall?</strong><br>",
          ]
            .concat(
              Object.entries(occupied_halls).map(([hall, conflicts]) => {
                return conflicts
                  .map((conflict) => {
                    const freeHallsOnThatDay =
                      free_halls[
                        conflict.date.split(".").reverse().join("-")
                      ].join(", ");
                    return `Hall <strong>${hall}</strong> is occupied on <strong>${conflict.date}</strong> by <strong>${conflict.event_name}</strong>.<br>Free halls on that day: <strong>${freeHallsOnThatDay}</strong>.<br>`;
                  })
                  .join("<br>");
              })
            )
            .join("<br>");

          setFeedback({
            open: true,
            message: conflictMessages,
            severity: "error",
          });
          setLoading(false);
          return;
        }
      } catch (error) {
        setFeedback({
          open: true,
          message: "Failed to check hall availability.",
          severity: "error",
        });
        setLoading(false);
        return;
      }
    }

    // Proceed with importing events if no conflicts
    try {
      const response = await axios.post("http://127.0.0.1:5000/import_events", {
        csv_data: events,
        mapping,
      });
      setFeedback({
        open: true,
        message: response.data.message,
        severity: "success",
      });
      navigate("/input_demands");
    } catch (error) {
      setFeedback({
        open: true,
        message: error.response?.data?.error || "Failed to import events.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (index, field, value) => {
    const updatedEvents = [...events];
    updatedEvents[index][field] = value;
    setEvents(updatedEvents);
  };

  const handleDateChange = (index, phase, dateType, value) => {
    const updatedEvents = [...events];
    updatedEvents[index].dates[phase][dateType] = value;
    setEvents(updatedEvents);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScrollToBottom = () => {
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom>
        Import Events from CSV
      </Typography>
      <Button variant="contained" component="label" fullWidth>
        Upload CSV
        <input type="file" hidden onChange={handleFileUpload} />
      </Button>
      {csvData.length > 0 && (
        <>
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" gutterBottom>
              Map CSV Columns to Event Fields
            </Typography>
            <Grid container spacing={2}>
              {Object.keys(defaultMapping).map((field) => (
                <Grid item xs={6} key={field}>
                  <FormControl fullWidth required variant="outlined">
                    <InputLabel>{defaultMapping[field]}</InputLabel>
                    <Select
                      name={field}
                      value={mapping[field] || ""}
                      onChange={handleMappingChange}
                      label={defaultMapping[field]}
                    >
                      {csvHeaders.map((header) => (
                        <MenuItem key={header} value={header}>
                          {header}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ))}
            </Grid>
          </Box>
          <Box sx={{ mt: 3, position: "relative" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleProcessData}
              fullWidth
            >
              Process Data
            </Button>
          </Box>
        </>
      )}
      {events.length > 0 && (
        <>
          <Box sx={{ mt: 3 }}>
            <Typography variant="h3" gutterBottom>
              Adjust Imported Events
            </Typography>
            {events.map((event, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="h4" component="h3" gutterBottom>
                  {event.name}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Event Name"
                      value={event.name || ""}
                      onChange={(e) =>
                        handleEventChange(index, "name", e.target.value)
                      }
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth required variant="outlined">
                      <InputLabel>Halls</InputLabel>
                      <Select
                        multiple
                        value={event.halls ? event.halls.split(",") : []}
                        onChange={(e) =>
                          handleEventChange(
                            index,
                            "halls",
                            e.target.value.join(",")
                          )
                        }
                        label="Halls"
                        renderValue={(selected) => selected.join(", ")}
                      >
                        {hallOptions.map((hall) => (
                          <MenuItem key={hall} value={hall}>
                            <Checkbox
                              checked={
                                event.halls &&
                                event.halls.split(",").indexOf(hall) > -1
                              }
                            />
                            <ListItemText primary={hall} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth required variant="outlined">
                      <InputLabel>Entrance</InputLabel>
                      <Select
                        value={event.entrance || "west"}
                        onChange={(e) =>
                          handleEventChange(index, "entrance", e.target.value)
                        }
                        label="Entrance"
                      >
                        {Object.entries(entranceLabels).map(
                          ([value, label]) => (
                            <MenuItem key={value} value={value}>
                              {label}
                            </MenuItem>
                          )
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  {Object.keys(phaseLabels).map((phase) => (
                    <React.Fragment key={phase}>
                      <Grid item xs={12}>
                        <Typography variant="h5" component="h3" gutterBottom>
                          {phaseLabels[phase]}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <FormControl fullWidth required variant="outlined">
                          <LocalizationProvider
                            dateAdapter={AdapterDayjs}
                            adapterLocale={"de"}
                          >
                            <DatePicker
                              label="Start Date"
                              value={
                                event.dates[phase].start
                                  ? dayjs(event.dates[phase].start)
                                  : null
                              }
                              onChange={(newValue) =>
                                handleDateChange(
                                  index,
                                  phase,
                                  "start",
                                  newValue ? newValue.format("YYYY-MM-DD") : ""
                                )
                              }
                              slotProps={{
                                textField: {
                                  variant: "outlined",
                                  error: false,
                                },
                              }}
                            />
                          </LocalizationProvider>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6}>
                        <FormControl fullWidth required variant="outlined">
                          <LocalizationProvider
                            dateAdapter={AdapterDayjs}
                            adapterLocale={"de"}
                          >
                            <DatePicker
                              label="End Date"
                              value={
                                event.dates[phase].end
                                  ? dayjs(event.dates[phase].end)
                                  : null
                              }
                              onChange={(newValue) =>
                                handleDateChange(
                                  index,
                                  phase,
                                  "end",
                                  newValue ? newValue.format("YYYY-MM-DD") : ""
                                )
                              }
                              slotProps={{
                                textField: {
                                  variant: "outlined",
                                  error: false,
                                },
                              }}
                            />
                          </LocalizationProvider>
                        </FormControl>
                      </Grid>
                    </React.Fragment>
                  ))}
                </Grid>
                {index < events.length - 1 && <Divider sx={{ my: 2 }} />}
              </Box>
            ))}
            <Box sx={{ mt: 3, position: "relative" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleImport}
                fullWidth
                disabled={loading}
              >
                Import Events
              </Button>
              {loading && (
                <CircularProgress
                  size={24}
                  sx={{
                    color: "primary.main",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginTop: "-12px",
                    marginLeft: "-12px",
                  }}
                />
              )}
            </Box>
          </Box>
        </>
      )}
      {showScrollToTop && (
        <Box
          sx={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            width: "90%",
            maxWidth: "400px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleScrollToTop}
          >
            Scroll to Top
          </Button>
        </Box>
      )}
      {showScrollToBottom && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            width: "90%",
            maxWidth: "400px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleScrollToBottom}
          >
            Scroll to Bottom
          </Button>
        </Box>
      )}
      <div ref={bottomRef} />
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
          <span dangerouslySetInnerHTML={{ __html: feedback.message }} />
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ImportCSV;
