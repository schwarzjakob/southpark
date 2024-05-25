import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Typography,
  Box,
  Checkbox,
  ListItemText,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import axios from "axios";

const phaseLabels = {
  assembly: "Assembly",
  runtime: "Runtime",
  disassembly: "Disassembly",
};

const entranceLabels = {
  west: "West",
  north_west: "Northwest",
  north: "North",
  north_east: "Northeast",
  east: "East",
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

function AddEvent() {
  const navigate = useNavigate();
  const initialEventData = {
    name: "",
    dates: {
      assembly: { start: "", end: "" },
      runtime: { start: "", end: "" },
      disassembly: { start: "", end: "" },
    },
    halls: [],
    entrance: "west",
    demands: {
      assembly: {},
      runtime: {},
      disassembly: {},
    },
  };

  const [eventData, setEventData] = useState(initialEventData);
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const isValidDate = (date) => {
    return date && dayjs(date).isValid();
  };

  const isDateRangeValid = (startDate, endDate) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    return end.diff(start, "year") < 1;
  };

  const adjustDates = (dates, phase, dateType, value) => {
    const { assembly, runtime, disassembly } = dates;

    if (!isValidDate(value)) {
      return dates;
    }

    const dateValue = dayjs(value);

    // Handle forward date propagation
    if (dateType === "start") {
      if (phase === "assembly") {
        if (
          !isValidDate(assembly.end) ||
          dateValue.isAfter(dayjs(assembly.end))
        ) {
          dates.assembly.end = value;
        }
        dates.runtime.start = dateValue.add(1, "day").format("YYYY-MM-DD");
        if (
          !isValidDate(runtime.end) ||
          dayjs(dates.runtime.start).isAfter(dayjs(runtime.end))
        ) {
          dates.runtime.end = dates.runtime.start;
        }
        dates.disassembly.start = dayjs(dates.runtime.end)
          .add(1, "day")
          .format("YYYY-MM-DD");
        if (
          !isValidDate(disassembly.end) ||
          dayjs(dates.disassembly.start).isAfter(dayjs(disassembly.end))
        ) {
          dates.disassembly.end = dates.disassembly.start;
        }
      }

      if (phase === "runtime") {
        dates.assembly.end = dateValue.subtract(1, "day").format("YYYY-MM-DD");
        if (
          !isValidDate(assembly.start) ||
          dayjs(dates.assembly.end).isBefore(dayjs(assembly.start))
        ) {
          dates.assembly.start = dates.assembly.end;
        }
        if (
          !isValidDate(runtime.end) ||
          dateValue.isAfter(dayjs(runtime.end))
        ) {
          dates.runtime.end = value;
        }
        dates.disassembly.start = dayjs(dates.runtime.end)
          .add(1, "day")
          .format("YYYY-MM-DD");
        if (
          !isValidDate(disassembly.end) ||
          dayjs(dates.disassembly.start).isAfter(dayjs(disassembly.end))
        ) {
          dates.disassembly.end = dates.disassembly.start;
        }
      }

      if (phase === "disassembly") {
        dates.runtime.end = dateValue.subtract(1, "day").format("YYYY-MM-DD");
        if (
          !isValidDate(runtime.start) ||
          dayjs(dates.runtime.end).isBefore(dayjs(runtime.start))
        ) {
          dates.runtime.start = dates.runtime.end;
        }
        dates.assembly.end = dayjs(dates.runtime.start)
          .subtract(1, "day")
          .format("YYYY-MM-DD");
        if (
          !isValidDate(assembly.start) ||
          dayjs(dates.assembly.end).isBefore(dayjs(assembly.start))
        ) {
          dates.assembly.start = dates.assembly.end;
        }
        if (
          !isValidDate(disassembly.end) ||
          dayjs(dates.disassembly.start).isAfter(dayjs(disassembly.end))
        ) {
          dates.disassembly.end = dates.disassembly.start;
        }
      }
    }

    // Handle backward date propagation
    if (dateType === "end") {
      if (phase === "disassembly") {
        if (
          !isValidDate(disassembly.start) ||
          dateValue.isBefore(dayjs(disassembly.start))
        ) {
          dates.disassembly.start = value;
        }
        dates.runtime.end = dayjs(dates.disassembly.start)
          .subtract(1, "day")
          .format("YYYY-MM-DD");
        if (
          !isValidDate(runtime.start) ||
          dayjs(dates.runtime.end).isBefore(dayjs(runtime.start))
        ) {
          dates.runtime.start = dates.runtime.end;
        }
        dates.assembly.end = dayjs(dates.runtime.start)
          .subtract(1, "day")
          .format("YYYY-MM-DD");
        if (
          !isValidDate(assembly.start) ||
          dayjs(dates.assembly.end).isBefore(dayjs(assembly.start))
        ) {
          dates.assembly.start = dates.assembly.end;
        }
      }

      if (phase === "runtime") {
        dates.disassembly.start = dateValue.add(1, "day").format("YYYY-MM-DD");
        if (
          !isValidDate(disassembly.end) ||
          dayjs(dates.disassembly.start).isAfter(dayjs(disassembly.end))
        ) {
          dates.disassembly.end = dates.disassembly.start;
        }
        if (
          !isValidDate(runtime.start) ||
          dateValue.isBefore(dayjs(runtime.start))
        ) {
          dates.runtime.start = value;
        }
        dates.assembly.end = dayjs(dates.runtime.start)
          .subtract(1, "day")
          .format("YYYY-MM-DD");
        if (
          !isValidDate(assembly.start) ||
          dayjs(dates.assembly.end).isBefore(dayjs(assembly.start))
        ) {
          dates.assembly.start = dates.assembly.end;
        }
      }

      if (phase === "assembly") {
        if (
          !isValidDate(assembly.start) ||
          dateValue.isBefore(dayjs(assembly.start))
        ) {
          dates.assembly.start = value;
        }
        dates.runtime.start = dateValue.add(1, "day").format("YYYY-MM-DD");
        if (
          !isValidDate(runtime.end) ||
          dayjs(dates.runtime.start).isAfter(dayjs(runtime.end))
        ) {
          dates.runtime.end = dates.runtime.start;
        }
        dates.disassembly.start = dayjs(dates.runtime.end)
          .add(1, "day")
          .format("YYYY-MM-DD");
        if (
          !isValidDate(disassembly.end) ||
          dayjs(dates.disassembly.start).isAfter(dayjs(disassembly.end))
        ) {
          dates.disassembly.end = dates.disassembly.start;
        }
      }
    }

    return dates;
  };

  const handleDateChange = (phase, dateType, value) => {
    setEventData((prevState) => {
      const updatedDates = { ...prevState.dates };
      updatedDates[phase][dateType] = value;
      const adjustedDates = adjustDates(updatedDates, phase, dateType, value);

      return {
        ...prevState,
        dates: adjustedDates,
      };
    });
  };

  const handleDemandChange = (phase, date, value) => {
    setEventData((prevState) => ({
      ...prevState,
      demands: {
        ...prevState.demands,
        [phase]: {
          ...prevState.demands[phase],
          [date]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "/api/add_event",
        eventData
      );
      console.log("Event created successfully:", response.data);
      setFeedback({
        open: true,
        message: response.data.message,
        severity: "success",
      });
      handleResetDates(); // Reset the form after successful submission

      try {
        const optimizeResponse = await axios.post(
          "/api/optimize_distance"
        );
        console.log(
          "Optimization triggered successfully:",
          optimizeResponse.data
        );
        setFeedback({
          open: true,
          message: optimizeResponse.data.message,
          severity: "success",
        });
      } catch (optimizeError) {
        console.error("Error triggering optimization:", optimizeError);
        setFeedback({
          open: true,
          message: "Error triggering optimization",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error creating event:", error);
      setFeedback({
        open: true,
        message: "Error creating event",
        severity: "error",
      });
    }
  };

  const handleResetDates = () => {
    setEventData(initialEventData);
    setStep(1);
  };

  const checkHallAvailability = async () => {
    const response = await axios.post(
      "/api/check_hall_availability",
      {
        halls: eventData.halls,
        dates: eventData.dates,
      }
    );
    return response.data;
  };

  const handleNext = async () => {
    // Validate required fields before proceeding to the next step
    const missingFields = [];

    if (!eventData.name) missingFields.push("Event name");
    if (!eventData.halls.length) missingFields.push("Halls");
    if (!eventData.entrance) missingFields.push("Entrance");
    if (!isValidDate(eventData.dates.assembly.start))
      missingFields.push("Assembly start date");
    if (!isValidDate(eventData.dates.assembly.end))
      missingFields.push("Assembly end date");
    if (!isValidDate(eventData.dates.runtime.start))
      missingFields.push("Runtime start date");
    if (!isValidDate(eventData.dates.runtime.end))
      missingFields.push("Runtime end date");
    if (!isValidDate(eventData.dates.disassembly.start))
      missingFields.push("Disassembly start date");
    if (!isValidDate(eventData.dates.disassembly.end))
      missingFields.push("Disassembly end date");

    if (missingFields.length > 0) {
      setFeedback({
        open: true,
        message: `Please fill all required fields: ${missingFields.join(", ")}`,
        severity: "warning",
      });
      return;
    }

    // Check if any date range exceeds one year
    for (const phase in eventData.dates) {
      const { start, end } = eventData.dates[phase];
      if (
        isValidDate(start) &&
        isValidDate(end) &&
        !isDateRangeValid(start, end)
      ) {
        alert(`The date range for ${phaseLabels[phase]} exceeds one year.`);
        return;
      }
    }

    // Check hall availability
    try {
      const availability = await checkHallAvailability();
      const { occupied_halls, free_halls } = availability;
      console.log("Occupied halls:", occupied_halls);
      console.log("Free halls:", free_halls);

      if (occupied_halls && Object.keys(occupied_halls).length > 0) {
        const conflictMessages = [
          "<strong>Did you select the wrong hall?</strong><br>",
        ]
          .concat(
            Object.entries(occupied_halls).map(([hall, conflicts]) => {
              return conflicts
                .map((conflict) => {
                  console.log(conflict.date);
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
        return;
      }

      setStep(2);
    } catch (error) {
      setFeedback({
        open: true,
        message: "Failed to check hall availability.",
        severity: "error",
      });
    }
  };

  const handleBack = () => setStep(1);

  return (
    <form onSubmit={handleSubmit} className="add-event-form">
      {step === 1 && (
        <Box sx={{ pt: 3, pb: 3, pl: 10, pr: 10 }}>
          <Typography variant="h3" component="h2" gutterBottom>
            Add Event
          </Typography>
          <Typography variant="h5" component="h3" gutterBottom>
            Event Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Event"
                value={eventData.name}
                onChange={(e) =>
                  setEventData({ ...eventData, name: e.target.value })
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
                  value={eventData.halls}
                  onChange={(e) =>
                    setEventData({ ...eventData, halls: e.target.value })
                  }
                  label="Halls"
                  renderValue={(selected) => selected.join(", ")}
                >
                  {hallOptions.map((hall) => (
                    <MenuItem key={hall} value={hall}>
                      <Checkbox checked={eventData.halls.indexOf(hall) > -1} />
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
                  value={eventData.entrance}
                  onChange={(e) =>
                    setEventData({ ...eventData, entrance: e.target.value })
                  }
                  label="Entrance"
                >
                  {Object.entries(entranceLabels).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
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
                          eventData.dates[phase].start
                            ? dayjs(eventData.dates[phase].start)
                            : null
                        }
                        onChange={(newValue) =>
                          handleDateChange(
                            phase,
                            "start",
                            newValue ? newValue.format("YYYY-MM-DD") : ""
                          )
                        }
                        slotProps={{
                          textField: { variant: "outlined", error: false },
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
                          eventData.dates[phase].end
                            ? dayjs(eventData.dates[phase].end)
                            : null
                        }
                        onChange={(newValue) =>
                          handleDateChange(
                            phase,
                            "end",
                            newValue ? newValue.format("YYYY-MM-DD") : ""
                          )
                        }
                        slotProps={{
                          textField: { variant: "outlined", error: false },
                        }}
                      />
                    </LocalizationProvider>
                  </FormControl>
                </Grid>
              </React.Fragment>
            ))}
            <Grid item xs={6}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleResetDates}
                fullWidth
              >
                Reset
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="contained"
                color="primary"
                type="button"
                onClick={handleNext}
                fullWidth
              >
                Continue with Demands
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/import")}
                fullWidth
              >
                Import CSV
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}
      {step === 2 && (
        <Box sx={{ pt: 3, pb: 3, pl: 10, pr: 10 }}>
          <Grid container spacing={2}>
            {Object.keys(eventData.dates).map(
              (phase) =>
                eventData.dates[phase].start &&
                new Date(eventData.dates[phase].start) <=
                  new Date(eventData.dates[phase].end) && (
                  <React.Fragment key={phase}>
                    <Grid item xs={12}>
                      <Typography variant="h5" component="h3" gutterBottom>
                        {phaseLabels[phase]}
                      </Typography>
                    </Grid>
                    {new Array(
                      (new Date(eventData.dates[phase].end) -
                        new Date(eventData.dates[phase].start)) /
                        (1000 * 3600 * 24) +
                        1
                    )
                      .fill()
                      .map((_, index) => {
                        const date = new Date(eventData.dates[phase].start);
                        date.setDate(date.getDate() + index);
                        const dateString = date.toISOString().slice(0, 10);
                        return (
                          <Grid item xs={12} key={dateString}>
                            <TextField
                              label={`${dateString} Demand`}
                              type="number"
                              value={eventData.demands[phase][dateString] || ""}
                              onChange={(e) =>
                                handleDemandChange(
                                  phase,
                                  dateString,
                                  e.target.value
                                )
                              }
                              required
                              fullWidth
                              variant="outlined"
                            />
                          </Grid>
                        );
                      })}
                  </React.Fragment>
                )
            )}
            <Grid item xs={6}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleBack}
                fullWidth
              >
                Back
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleResetDates}
                fullWidth
              >
                Reset
              </Button>
            </Grid>
            <Grid item xs={6}></Grid>
            <Grid item xs={6}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                fullWidth
              >
                Submit Event
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}
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
          <span dangerouslySetInnerHTML={{ __html: feedback.message }} />
        </Alert>
      </Snackbar>
    </form>
  );
}

export default AddEvent;
