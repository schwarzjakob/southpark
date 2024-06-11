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
  CircularProgress,
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
  const [loading, setLoading] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const eventRefs = useRef([]);
  const bottomRef = useRef(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/events_without_valid_demands");
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

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
    setLoading(true);
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
      setLoading(false);
      return;
    }

    try {
      for (const { event_id, demands } of demandsToSave) {
        await axios.post(`/api/add_demands/${event_id}`, {
          demands,
        });
      }

      let optimizationMessage = "";
      try {
        await axios.post("/api/optimize_distance");
        optimizationMessage = "Optimization completed successfully.";
      } catch (optimizeError) {
        optimizationMessage = "Failed to complete optimization.";
      }

      setFeedback({
        open: true,
        message: `All demands saved successfully. ${optimizationMessage}`,
        severity: "success",
      });

      fetchEvents(); 
      handleScrollToTop();
    } catch (error) {
      setFeedback({
        open: true,
        message: "Failed to save demands.",
        severity: "error",
      });
    } finally {
      setLoading(false); 
    }
  };

  const handleSaveEventDemands = async (eventId) => {
    setLoading(true);
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
      }
    }

    if (!hasDemands) {
      setFeedback({
        open: true,
        message: `No demands entered for ${event.name}.`,
        severity: "info",
      });
      setLoading(false);
      return;
    }

    try {
      await axios.post(`/api/add_demands/${event.event_id}`, {
        demands,
      });

      let optimizationMessage = "";
      try {
        await axios.post("/api/optimize_distance");
        optimizationMessage = "Optimization completed successfully.";
      } catch (optimizeError) {
        optimizationMessage = "Failed to complete optimization.";
      }

      setFeedback({
        open: true,
        message: `${event.name} demands saved successfully. ${optimizationMessage}`,
        severity: "success",
      });

      fetchEvents();
    } catch (error) {
      setFeedback({
        open: true,
        message: `Failed to save ${event.name} demands.`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    fetchEvents();
  };

  const handleRowClick = (params) => {
    const index = events.findIndex((event) => event.event_id === params.id);
    eventRefs.current[index].scrollIntoView({ behavior: "smooth" });
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScrollToBottom = () => {
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
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
                                  onWheel={(e) => e.target.blur()}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value === "" ||
                                      (value >= 0 && !value.includes("-"))
                                    ) {
                                      handleDemandChange(
                                        event.event_id,
                                        date,
                                        value
                                      );
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === "-" ||
                                      e.key === "+" ||
                                      e.key === "e" ||
                                      e.key === "." ||
                                      e.key === ","
                                    ) {
                                      e.preventDefault();
                                    }
                                  }}
                                  inputProps={{
                                    min: 0,
                                    pattern: "[0-9]*",
                                  }}
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
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => handleSaveEventDemands(event.event_id)}
                    disabled={loading}
                  >
                    Save {event.name} Demands
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
              {index < events.length - 1 && <Divider sx={{ my: 2 }} />}
            </React.Fragment>
          ))}
        </>
      ) : loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <CircularProgress />
        </Box>
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
          <Grid item xs={6} sx={{ position: "relative" }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSubmit}
              disabled={loading} 
            >
              Save All Demands
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
          </Grid>
        </Grid>
      </Box>
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
          <span dangerouslySetInnerHTML={{ __html: feedback.message }} />
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InputDemands;
