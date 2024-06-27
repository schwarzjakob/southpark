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
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import Demand from "./Demand.jsx";
import Allocation from "./Allocation";
import Recommendation from "./Recommendation";
import CustomBreadcrumbs from "../../common/BreadCrumbs.jsx";
import "../styles/events.css";
import AddAllocationPopup from "./AddAllocationPopup";
import AddLinkIcon from "@mui/icons-material/AddLink";
import NumbersIcon from "@mui/icons-material/Numbers";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import AssistantRoundedIcon from "@mui/icons-material/AssistantRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";

const AllocateParkingSpace = () => {
  const { id } = useParams();
  const [demands, setDemands] = useState([]);
  const [event, setEvent] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState("");
  const [totalDemands, setTotalDemands] = useState({
    cars: 0,
    buses: 0,
    trucks: 0,
    total: 0,
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
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
      const allocations = response.data;
      storeAllocationsInSession(allocations);
      setIsDataLoaded(true);
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
      JSON.stringify({ allocations: formattedAllocations })
    );

    try {
      const response = await axios.post("/api/events/allocate_demands", {
        allocations: formattedAllocations,
      });
      if (response.status === 201) {
        setSnackbarMessage("Allocations saved successfully");
        setSnackbarSeverity("success");
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

  useEffect(() => {
    fetchDemands();
    fetchEventDetails();
  }, [fetchDemands, fetchEventDetails]);

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

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleAddAllocationClick = (phase) => {
    setSelectedPhase(phase);
    const phaseDemands = getDemandsPerPhase(phase);
    const phaseAllocations = JSON.parse(sessionStorage.getItem("allocations"))[
      phase
    ];
    const allocated = { cars: 0, buses: 0, trucks: 0 };

    Object.values(phaseAllocations).forEach((alloc) => {
      allocated.cars += alloc.cars;
      allocated.buses += alloc.buses;
      allocated.trucks += alloc.trucks;
    });

    const totalDemands = {
      cars:
        phaseDemands.reduce((sum, demand) => sum + demand.car_demand, 0) -
        allocated.cars,
      buses:
        phaseDemands.reduce((sum, demand) => sum + demand.bus_demand, 0) -
        allocated.buses,
      trucks:
        phaseDemands.reduce((sum, demand) => sum + demand.truck_demand, 0) -
        allocated.trucks,
      total:
        phaseDemands.reduce((sum, demand) => sum + demand.demand, 0) -
        (allocated.cars + allocated.buses * 3 + allocated.trucks * 4),
    };

    setTotalDemands(totalDemands);
    setPopupOpen(true);
  };

  const handlePopupClose = () => {
    setPopupOpen(false);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box className="allocateParkingSpace-container">
      <CustomBreadcrumbs
        links={breadcrumbLinks}
        onClick={(link) => handleNavigate(link.path)}
      />
      <Paper className="allocateParkingSpace-paper">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box className="iconHeadline__container">
              <AddLinkIcon />
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
                <Grid item xs={12} className="phase-divider">
                  <Box className="phase-divider-text">
                    <Box className="phase-title ">
                      <Typography variant="h6">
                        {phase.name.charAt(0).toUpperCase() +
                          phase.name.slice(1)}
                      </Typography>
                    </Box>
                    <Box className="phase-dates">
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

                  <Box mt={2} className="allocation-add-button">
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<AddRoundedIcon />}
                      onClick={() => handleAddAllocationClick(phase.name)}
                    >
                      Add Allocation
                    </Button>
                  </Box>
                </Grid>
                {isDataLoaded && (
                  <Demand phase={phase.name} data={phaseDemands} />
                )}
                {isDataLoaded && <Allocation phase={phase.name} />}
                <Recommendation phase={phase.name} data={phaseDemands} />
              </React.Fragment>
            );
          })}
        </Grid>
      </Paper>
      <AddAllocationPopup
        open={popupOpen}
        onClose={handlePopupClose}
        phase={selectedPhase}
        totalDemands={totalDemands}
        startDate={phases.find((p) => p.name === selectedPhase)?.start_date}
        endDate={phases.find((p) => p.name === selectedPhase)?.end_date}
      />
      <Box display="flex" justifyContent="space-between" mt={2}>
        <Box display="flex" justifyContent="space-between">
          <Button
            className="back-button"
            variant="outlined"
            color="primary"
            startIcon={<ArrowBackIosNewRoundedIcon />}
            onClick={() => navigate(`/events/event/${event.id}`)}
          >
            Back
          </Button>
          <Button
            className="save-button"
            variant="contained"
            color="primary"
            onClick={saveAllocations}
          >
            Save
          </Button>
        </Box>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AllocateParkingSpace;
