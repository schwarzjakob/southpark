import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Grid,
  TextField,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import { DataGrid, GridToolbarExport } from "@mui/x-data-grid";
import axios from "axios";
import dayjs from "dayjs";

const phaseLabels = {
  assembly: "Assembly",
  runtime: "Runtime",
  disassembly: "Disassembly",
};

const columns = [
  { field: "name", headerName: "Event Name", flex: 1 },
  { field: "year", headerName: "Year", flex: 1 },
];

const InputDemands = () => {
  const [events, setEvents] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const eventRefs = useRef([]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:5000/events_without_valid_demands"
      );
      const eventsWithDemands = response.data.events.reduce((acc, event) => {
        const { event_id, demand_id, date, demand, ...rest } = event;
        const formattedDate = dayjs(date).format("YYYY-MM-DD");

        const existingEvent = acc.find((e) => e.event_id === event_id);
        if (existingEvent) {
          existingEvent.demands[formattedDate] = { demand_id, demand };
        } else {
          acc.push({
            event_id,
            demands: { [formattedDate]: { demand_id, demand } },
            ...rest,
          });
        }

        return acc;
      }, []);
      setEvents(eventsWithDemands);
      eventRefs.current = eventsWithDemands.map(() => React.createRef());

      const tableData = eventsWithDemands.map((event) => ({
        id: event.event_id,
        name: event.name,
        year: dayjs(event.runtime_start_date).year(),
      }));
      setTableData(tableData);
    } catch (error) {
      setFeedback({
        open: true,
        message: "Failed to fetch events.",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDemandChange = (eventId, date, value) => {
    setEvents((prevState) =>
      prevState.map((event) =>
        event.event_id === eventId
          ? {
              ...event,
              demands: {
                ...event.demands,
                [date]: { ...event.demands[date], demand: value },
              },
            }
          : event
      )
    );
  };

  const handleSubmit = async () => {
    let hasDemands = false;
    const demandsToSave = [];

    for (const event of events) {
      const demands = {};
      for (const [date, { demand_id, demand }] of Object.entries(
        event.demands
      )) {
        if (
          demand !== undefined &&
          demand !== null &&
          demand !== "" &&
          !isNaN(demand) &&
          demand > 0
        ) {
          demands[demand_id] = { date, demand };
          hasDemands = true;
        }
      }
      if (hasDemands) {
        demandsToSave.push({ event_id: event.event_id, demands });
      }
    }

    if (!hasDemands) {
      setFeedback({
        open: true,
        message: "No demands entered for any event.",
        severity: "info",
      });
      return;
    }

    try {
      for (const { event_id, demands } of demandsToSave) {
        await axios.post(`http://127.0.0.1:5000/add_demands/${event_id}`, {
          demands,
        });
      }
      setFeedback({
        open: true,
        message: "All demands saved successfully.",
        severity: "success",
      });
      fetchEvents(); // Refetch events after successful save
    } catch (error) {
      setFeedback({
        open: true,
        message: "Failed to save demands.",
        severity: "error",
      });
    }
  };

  const handleSaveEventDemands = async (eventId) => {
    const event = events.find((event) => event.event_id === eventId);
    const demands = {};
    let hasDemands = false;

    for (const [date, { demand_id, demand }] of Object.entries(event.demands)) {
      if (
        demand !== undefined &&
        demand !== null &&
        demand !== "" &&
        !isNaN(demand) &&
        demand > 0
      ) {
        demands[demand_id] = { date, demand };
        hasDemands = true;
        console.log(demands);
      }
    }

    if (!hasDemands) {
      setFeedback({
        open: true,
        message: `No demands entered for ${event.name}.`,
        severity: "info",
      });
      return;
    }

    try {
      await axios.post(`http://127.0.0.1:5000/add_demands/${event.event_id}`, {
        demands,
      });
      setFeedback({
        open: true,
        message: `${event.name} demands saved successfully.`,
        severity: "success",
      });
      fetchEvents(); // Refetch events after successful save
    } catch (error) {
      setFeedback({
        open: true,
        message: `Failed to save ${event.name} demands.`,
        severity: "error",
      });
    }
  };

  const handleReset = () => {
    fetchEvents();
  };

  const handleRowClick = (params) => {
    const index = events.findIndex((event) => event.event_id === params.id);
    eventRefs.current[index].scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Box sx={{ pt: 3, pb: 3, pl: 10, pr: 10 }}>
      <Typography variant="h3" component="h2" gutterBottom>
        Input Visitor Demands
      </Typography>
      {events.length > 0 ? (
        <>
          <Box sx={{ mb: 3 }}>
            <DataGrid
              rows={tableData}
              columns={columns}
              getRowId={(row) => row.id}
              components={{
                Toolbar: GridToolbarExport,
              }}
              disableSelectionOnClick
              autoHeight
              onRowClick={handleRowClick}
            />
          </Box>
          {events.map((event, index) => (
            <React.Fragment key={event.event_id}>
              <Box ref={(el) => (eventRefs.current[index] = el)} sx={{ mb: 3 }}>
                <Typography variant="h4" component="h3" gutterBottom>
                  {event.name}
                </Typography>
                <Grid container spacing={2}>
                  {Object.keys(phaseLabels).map((phase) => {
                    const startDateKey = `${phase}_start_date`;
                    const endDateKey = `${phase}_end_date`;
                    const startDate = event[startDateKey];
                    const endDate = event[endDateKey];

                    if (
                      startDate &&
                      endDate &&
                      dayjs(startDate).isValid() &&
                      dayjs(endDate).isValid()
                    ) {
                      const dates = Object.keys(event.demands).filter(
                        (date) =>
                          dayjs(date).isAfter(
                            dayjs(startDate).subtract(1, "day")
                          ) && dayjs(date).isBefore(dayjs(endDate))
                      );

                      if (dates.length > 0) {
                        return (
                          <React.Fragment key={phase}>
                            <Grid item xs={12}>
                              <Typography
                                variant="h5"
                                component="h3"
                                gutterBottom
                              >
                                {phaseLabels[phase]}
                              </Typography>
                            </Grid>
                            {dates.map((date) => (
                              <Grid
                                item
                                xs={12}
                                key={`${event.event_id}-${date}`}
                              >
                                <TextField
                                  label={`${date} Demand`}
                                  type="number"
                                  value={event.demands[date].demand || ""}
                                  onChange={(e) =>
                                    handleDemandChange(
                                      event.event_id,
                                      date,
                                      e.target.value
                                    )
                                  }
                                  required
                                  fullWidth
                                  variant="outlined"
                                />
                              </Grid>
                            ))}
                          </React.Fragment>
                        );
                      }
                    }
                    return null;
                  })}
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => handleSaveEventDemands(event.event_id)}
                  >
                    Save {event.name} Demands
                  </Button>
                </Box>
              </Box>
              {index < events.length - 1 && <Divider sx={{ my: 2 }} />}
            </React.Fragment>
          ))}
        </>
      ) : (
        <Typography>No events without demands.</Typography>
      )}
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={handleReset}
            >
              Reset
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSubmit}
            >
              Save Demands
            </Button>
          </Grid>
        </Grid>
      </Box>
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
    </Box>
  );
};

export default InputDemands;
