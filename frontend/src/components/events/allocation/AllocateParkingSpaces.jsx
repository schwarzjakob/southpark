import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Box, Typography, Grid, Button, Paper } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import Demand from "./Demand.jsx";
import Allocation from "./Allocation";
import Recommendation from "./Recommendation";
import CustomBreadcrumbs from "../../common/BreadCrumbs.jsx";
import "../styles/events.css";
import AddLinkIcon from "@mui/icons-material/AddLink";
import NumbersIcon from "@mui/icons-material/Numbers";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import AssistantRoundedIcon from "@mui/icons-material/AssistantRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AddAllocationPopup from "./AddAllocationPopup";

const AllocateParkingSpace = () => {
  const { id } = useParams();
  const [demands, setDemands] = useState([]);
  const [event, setEvent] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState("");
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
        if (!groupedAllocations[status][parkingLotName]) {
          groupedAllocations[status][parkingLotName] = {
            cars: 0,
            buses: 0,
            trucks: 0,
            allocation_id: allocation.allocation_id, // Add allocation_id
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
    setPopupOpen(true);
  };

  const handlePopupClose = () => {
    setPopupOpen(false);
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
                  <Box className="phase-title">
                    <Typography variant="h6">
                      {phase.name.charAt(0).toUpperCase() + phase.name.slice(1)}
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
                  <Box mt={2} className="allocation-add-button">
                    <Button
                      variant="contained"
                      color="primary"
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
      />
    </Box>
  );
};

export default AllocateParkingSpace;
