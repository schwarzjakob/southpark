import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  Button,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import Demand from "./Demand.jsx";
import Allocation from "./Allocation";
import Recommendation from "./Recommendation";
import CustomBreadcrumbs from "../../common/BreadCrumbs.jsx";
import "../styles/events.css";
import AddAllocationPopup from "./AddAllocationPopup";
import NumbersIcon from "@mui/icons-material/Numbers";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import AssistantRoundedIcon from "@mui/icons-material/AssistantRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowCircleUpRoundedIcon from "@mui/icons-material/ArrowCircleUpRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import ArrowCircleDownRoundedIcon from "@mui/icons-material/ArrowCircleDownRounded";

const AllocateParkingSpaces = () => {
  const { id } = useParams();
  const [demands, setDemands] = useState([]);
  const [event, setEvent] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState("");
  const [, setTotalDemands] = useState({
    cars: 0,
    buses: 0,
    trucks: 0,
    total: 0,
  });
  const [allocatedDemands, setAllocatedDemands] = useState({
    cars: 0,
    buses: 0,
    trucks: 0,
    total: 0,
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [transformedRecommendationData, setTransformedRecommendationData] =
    useState(null);
  const [buttonStates, setButtonStates] = useState({
    assembly: false,
    runtime: false,
    disassembly: false,
  });
  const navigate = useNavigate();

  const fetchDemands = useCallback(async () => {
    try {
      const response = await axios.get(`/api/events/demands/${id}`);
      if (response.status === 204) {
        setDemands([]);
      } else {
        setDemands(response.data);
      }
    } catch (error) {
      console.error("Error fetching demands data:", error);
    }
  }, [id]);

  const fetchEventDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/events/event/${id}`);
      setEvent(response.data);
    } catch (error) {
      console.error("Error fetching event details:", error);
    }
  }, [id]);

  const getStatus = useCallback(
    (date) => {
      if (!event) return null;
      const assemblyStart = new Date(event.assembly_start_date);
      const assemblyEnd = new Date(event.assembly_end_date);
      const runtimeStart = new Date(event.runtime_start_date);
      const runtimeEnd = new Date(event.runtime_end_date);
      const disassemblyStart = new Date(event.disassembly_start_date);
      const disassemblyEnd = new Date(event.disassembly_end_date);
      if (date >= assemblyStart && date <= assemblyEnd) return "assembly";
      if (date >= runtimeStart && date <= runtimeEnd) return "runtime";
      if (date >= disassemblyStart && date <= disassemblyEnd)
        return "disassembly";
      return null;
    },
    [event]
  );

  const storeAllocationsInSession = useCallback(
    (allocations) => {
      if (!event) return;
      const groupedAllocations = {
        assembly: {},
        runtime: {},
        disassembly: {},
      };
      allocations.forEach((allocation) => {
        const date = new Date(allocation.date);
        const status = getStatus(date);
        if (!status) return;
        const parkingLotName = allocation.parking_lot_name;
        const parkingLotId = allocation.parking_lot_id;
        if (!groupedAllocations[status][parkingLotName]) {
          groupedAllocations[status][parkingLotName] = {
            cars: 0,
            buses: 0,
            trucks: 0,
            allocation_id: allocation.allocation_id,
            parking_lot_id: parkingLotId,
            parking_lot_name: parkingLotName,
          };
        }
        groupedAllocations[status][parkingLotName].cars = Math.max(
          groupedAllocations[status][parkingLotName].cars,
          allocation.allocated_cars
        );
        groupedAllocations[status][parkingLotName].buses = Math.max(
          groupedAllocations[status][parkingLotName].buses,
          allocation.allocated_buses
        );
        groupedAllocations[status][parkingLotName].trucks = Math.max(
          groupedAllocations[status][parkingLotName].trucks,
          allocation.allocated_trucks
        );
      });
      sessionStorage.setItem("allocations", JSON.stringify(groupedAllocations));
    },
    [event, getStatus]
  );

  const fetchAllocations = useCallback(async () => {
    if (!event) return;
    try {
      const response = await axios.get(`/api/events/allocations/${id}`);
      if (response.status === 204) {
        storeAllocationsInSession([]);
        setIsDataLoaded(true);
      } else {
        const allocations = response.data;
        storeAllocationsInSession(allocations);
        setIsDataLoaded(true);
      }
    } catch (error) {
      console.error("Error fetching allocations data:", error);
    }
  }, [id, event, storeAllocationsInSession]);
  const saveAllocations = async () => {
    const allocations = JSON.parse(sessionStorage.getItem("allocations"));
    const formattedAllocations = [];
    const phases = [
      {
        name: "assembly",
        start_date: event?.assembly_start_date,
        end_date: event?.assembly_end_date,
      },
      {
        name: "runtime",
        start_date: event?.runtime_start_date,
        end_date: event?.runtime_end_date,
      },
      {
        name: "disassembly",
        start_date: event?.disassembly_start_date,
        end_date: event?.disassembly_end_date,
      },
    ];

    phases.forEach((phase) => {
      if (allocations[phase.name]) {
        Object.values(allocations[phase.name]).forEach((allocation) => {
          const startDate = new Date(phase.start_date);
          const endDate = new Date(phase.end_date);
          for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
            const date = d.toISOString().split("T")[0];
            formattedAllocations.push({
              event_id: id,
              parking_lot_id: allocation.parking_lot_id,
              date: date,
              allocated_cars: allocation.cars,
              allocated_trucks: allocation.trucks,
              allocated_buses: allocation.buses,
            });
          }
        });
      }
    });

    console.log(
      "Sending to API:",
      JSON.stringify({ allocations: formattedAllocations, event_id: id })
    );

    try {
      const response = await axios.post("/api/events/allocate_demands", {
        allocations: formattedAllocations,
        event_id: id,
      });
      if (response.status === 200 || response.status === 201) {
        setSnackbarMessage("Allocations saved successfully");
        setSnackbarSeverity("success");
        setUnsavedChanges(false);
      } else {
        setSnackbarMessage(response.data.error || "Failed to save allocations");
        setSnackbarSeverity("error");
      }
    } catch (error) {
      setSnackbarMessage(
        error.response?.data?.error || "Failed to save allocations"
      );
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const fetchRecommendations = useCallback(async () => {
    try {
      const recommendationResponse = await axios.post(
        `/api/recommendation/engine`,
        { id: id },
        { headers: { "Content-Type": "application/json" } }
      );

      const recommendationData = recommendationResponse.data;
      const parkingSpacesResponse = await axios.get("/api/parking/spaces");
      const parkingSpacesData = parkingSpacesResponse.data;

      const parkingLotMap = {};
      parkingSpacesData.forEach((parkingSpace) => {
        parkingLotMap[parkingSpace.id] = parkingSpace.name;
      });

      const transformData = (data) => {
        const result = {};
        const processData = (type) => {
          if (data[type]?.busses) {
            data[type].busses.forEach((bus) => {
              const lotName = parkingLotMap[bus.parking_lot_id];
              if (!result[type][lotName]) {
                result[type][lotName] = {
                  cars: 0,
                  buses: 0,
                  trucks: 0,
                  allocation_id: 0,
                  parking_lot_id: bus.parking_lot_id,
                  parking_lot_name: lotName,
                };
              }
              result[type][lotName].buses += bus.capacity;
            });
          }

          if (data[type]?.cars) {
            data[type].cars.forEach((car) => {
              const lotName = parkingLotMap[car.parking_lot_id];
              if (!result[type][lotName]) {
                result[type][lotName] = {
                  cars: 0,
                  buses: 0,
                  trucks: 0,
                  allocation_id: 0,
                  parking_lot_id: car.parking_lot_id,
                  parking_lot_name: lotName,
                };
              }
              result[type][lotName].cars += car.capacity;
            });
          }

          if (data[type]?.trucks) {
            data[type].trucks.forEach((truck) => {
              const lotName = parkingLotMap[truck.parking_lot_id];
              if (!result[type][lotName]) {
                result[type][lotName] = {
                  cars: 0,
                  buses: 0,
                  trucks: 0,
                  allocation_id: 0,
                  parking_lot_id: truck.parking_lot_id,
                  parking_lot_name: lotName,
                };
              }
              result[type][lotName].trucks += truck.capacity;
            });
          }
        };

        result.assembly = {};
        result.runtime = {};
        result.disassembly = {};

        processData("assembly");
        processData("runtime");
        processData("disassembly");

        return result;
      };

      const transformedData = transformData(recommendationData);
      setTransformedRecommendationData(transformedData);

      console.log("Recommendation:", transformedData);
    } catch (error) {
      console.error("Error fetching allocations:", error);
    }
  }, [id]);

  useEffect(() => {
    fetchRecommendations();
    fetchDemands();
    fetchEventDetails();
  }, [fetchDemands, fetchEventDetails, fetchRecommendations]);

  useEffect(() => {
    if (event) {
      fetchAllocations();
    }
    return () => {
      sessionStorage.removeItem("allocations");
    };
  }, [fetchAllocations, event]);

  useEffect(() => {
    if (event) {
      const storedAllocations = sessionStorage.getItem("allocations");
      if (storedAllocations) {
        storeAllocationsInSession(JSON.parse(storedAllocations));
        setIsDataLoaded(true);
      } else {
        fetchAllocations();
      }
    }
    return () => {
      sessionStorage.removeItem("allocations");
      setIsDataLoaded(false);
    };
  }, [fetchAllocations, event, storeAllocationsInSession]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [unsavedChanges]);

  useEffect(() => {
    const handleEvent = () => {
      const fullyAllocatedData = JSON.parse(
        sessionStorage.getItem("fullyAllocated")
      );
      if (fullyAllocatedData) {
        const newButtonStates = {
          assembly: false,
          runtime: false,
          disassembly: false,
        };
        fullyAllocatedData.forEach((item) => {
          newButtonStates[item.phase] = item.state;
        });
        setButtonStates(newButtonStates);
      }
    };

    window.addEventListener("storage", handleEvent);

    handleEvent();

    return () => {
      window.removeEventListener("storage", handleEvent);
    };
  }, []);

  const handleNavigation = (path) => {
    if (unsavedChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmLeave) return;
    }
    navigate(path);
  };

  const phases = [
    {
      name: "assembly",
      start_date: event?.assembly_start_date,
      end_date: event?.assembly_end_date,
      icon: ArrowCircleUpRoundedIcon,
      addButtonText: "Add Allocation",
    },
    {
      name: "runtime",
      start_date: event?.runtime_start_date,
      end_date: event?.runtime_end_date,
      icon: PlayCircleFilledRoundedIcon,
      addButtonText: "Add Allocation",
    },
    {
      name: "disassembly",
      start_date: event?.disassembly_start_date,
      end_date: event?.disassembly_end_date,
      icon: ArrowCircleDownRoundedIcon,
      addButtonText: "Add Allocation",
    },
  ];

  const getDemandsPerPhase = (phase) => {
    return demands.filter((demand) => demand.status === phase);
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const breadcrumbLinks = [
    { label: "Events", path: "/events" },
    { label: event ? event.name : "Event", path: `/events/event/${id}` },
    {
      label: "Allocate Parking Spaces",
      path: `/events/event/${id}/allocate-parking-spaces`,
    },
  ];

  const calculateAllocatedDemands = (phase) => {
    const allocations = JSON.parse(sessionStorage.getItem("allocations"));
    if (!allocations) return { cars: 0, buses: 0, trucks: 0, total: 0 };

    const phaseAllocations = allocations[phase];
    const allocated = { cars: 0, buses: 0, trucks: 0 };

    if (phaseAllocations) {
      Object.values(phaseAllocations).forEach((alloc) => {
        allocated.cars += alloc.cars;
        allocated.buses += alloc.buses;
        allocated.trucks += alloc.trucks;
      });
    }

    return allocated;
  };

  const handleAddAllocationClick = (phase) => {
    setSelectedPhase(phase);
    const phaseDemands = getDemandsPerPhase(phase);
    const allocated = calculateAllocatedDemands(phase);

    const totalDemands = {
      cars: phaseDemands.reduce((sum, demand) => sum + demand.car_demand, 0),
      buses: phaseDemands.reduce((sum, demand) => sum + demand.bus_demand, 0),
      trucks: phaseDemands.reduce(
        (sum, demand) => sum + demand.truck_demand,
        0
      ),
      total: phaseDemands.reduce((sum, demand) => sum + demand.demand, 0),
    };

    setTotalDemands(totalDemands);
    setAllocatedDemands(allocated);
    setPopupOpen(true);
    setUnsavedChanges(true);
    window.dispatchEvent(new Event("popup-opened"));
    console.log("popup-opened");
  };
  const applyRecommendations = (phase) => {
    if (
      !transformedRecommendationData ||
      !transformedRecommendationData[phase]
    ) {
      setSnackbarMessage("No recommendations available for this phase");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const currentAllocations =
      JSON.parse(sessionStorage.getItem("allocations")) || {};

    // Remove existing allocations for the selected phase
    currentAllocations[phase] = {};

    // Add new recommendations for the selected phase
    currentAllocations[phase] = transformedRecommendationData[phase];

    // Update session storage
    sessionStorage.setItem("allocations", JSON.stringify(currentAllocations));

    // Dispatch a custom event to notify components
    window.dispatchEvent(new Event("allocations-updated"));

    setSnackbarMessage(`Recommendations applied for ${phase} phase`);
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const handleApplyRecommendationsClick = (phase) => {
    applyRecommendations(phase);
    setUnsavedChanges(true);
  };

  return (
    <Box className="allocateParkingSpace-container">
      <CustomBreadcrumbs
        links={breadcrumbLinks}
        onClick={(link) => handleNavigation(link.path)}
      />
      <Paper className="allocateParkingSpace-paper">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box className="iconHeadline__container">
              <AccountTreeRoundedIcon />
              <Typography variant="h4" gutterBottom>
                Allocate Parking Spaces
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box className="iconHeadline__container">
              <NumbersIcon />
              <Typography variant="h6" gutterBottom>
                Demand
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box className="iconHeadline__container">
              <AccountTreeRoundedIcon />
              <Typography variant="h6" gutterBottom>
                Allocation
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box className="iconHeadline__container">
              <AssistantRoundedIcon />
              <Typography variant="h6" gutterBottom>
                Recommendation
              </Typography>
            </Box>
          </Grid>
          {phases.map((phase) => {
            const phaseDemands = getDemandsPerPhase(phase.name);
            const days = calculateDays(phase.start_date, phase.end_date);

            return (
              <React.Fragment key={phase.name}>
                <Grid container className="phase-divider">
                  <Grid
                    item
                    xs={4}
                    className="phase-divider-text"
                    display="flex"
                    alignItems="center"
                  >
                    <Box className="phase-heading">
                      <Box
                        className="phase-title"
                        display="flex"
                        alignItems="center"
                      >
                        <phase.icon style={{ marginRight: "0.5rem" }} />
                        <Typography variant="h6">
                          {phase.name.charAt(0).toUpperCase() +
                            phase.name.slice(1)}
                        </Typography>
                      </Box>
                      <Box className="phase-dates" style={{ flexGrow: 1 }}>
                        <Typography variant="body1">
                          {formatDate(phase.start_date)} -{" "}
                          {formatDate(phase.end_date)}
                        </Typography>
                      </Box>
                      <Box className="phase-days">
                        <Typography variant="body1">
                          ({days} {days === 1 ? "Day" : "Days"})
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={4} display="flex" className="btn-container">
                    <Tooltip
                      title={
                        buttonStates[phase.name]
                          ? "Fully allocated, cannot add more allocations."
                          : ""
                      }
                    >
                      <span>
                        <Button
                          className={`add-allocation-button ${
                            buttonStates[phase.name] ? "deactivated" : ""
                          }`}
                          variant="contained"
                          color="secondary"
                          startIcon={<AddRoundedIcon />}
                          onClick={() => handleAddAllocationClick(phase.name)}
                          disabled={buttonStates[phase.name]}
                        >
                          {phase.addButtonText}
                        </Button>
                      </span>
                    </Tooltip>
                  </Grid>
                  <Grid item xs={4} display="flex" className="btn-container">
                    <Button
                      className="apply-allocation-button"
                      variant="contained"
                      color="secondary"
                      startIcon={<ArrowBackIosNewRoundedIcon />}
                      onClick={() =>
                        handleApplyRecommendationsClick(phase.name)
                      }
                    >
                      Apply Recommendations
                    </Button>
                  </Grid>
                </Grid>
                {isDataLoaded ? (
                  <>
                    <Demand phase={phase.name} data={phaseDemands} />
                    <Allocation phase={phase.name} />
                    <Recommendation
                      data={transformedRecommendationData}
                      phase={phase.name}
                    />
                  </>
                ) : (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height="200px"
                    width="100%"
                  >
                    <CircularProgress />
                  </Box>
                )}
              </React.Fragment>
            );
          })}
        </Grid>
      </Paper>
      <AddAllocationPopup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        phase={selectedPhase}
        data={getDemandsPerPhase(selectedPhase)}
        allocatedDemands={allocatedDemands}
        startDate={phases.find((p) => p.name === selectedPhase)?.start_date}
        endDate={phases.find((p) => p.name === selectedPhase)?.end_date}
      />
      <Box display="flex" justifyContent="space-between" mt={2}>
        <Button
          className="back-button"
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => handleNavigation(`/events/event/${event.id}`)}
        >
          Back
        </Button>
        <Button
          className="save-button"
          variant="contained"
          color="primary"
          startIcon={<SaveRoundedIcon />}
          onClick={saveAllocations}
        >
          Save Allocations
        </Button>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AllocateParkingSpaces;
