import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Grid,
  Button,
  IconButton,
  Dialog,
  MenuItem,
  Select,
  TextField,
  Divider,
  Alert,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import ArrowCircleUpRoundedIcon from "@mui/icons-material/ArrowCircleUpRounded";
import PlayCircleFilledRoundedIcon from "@mui/icons-material/PlayCircleFilledRounded";
import ArrowCircleDownRoundedIcon from "@mui/icons-material/ArrowCircleDownRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import AirportShuttleRoundedIcon from "@mui/icons-material/AirportShuttleRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import HelpCenterRoundedIcon from "@mui/icons-material/HelpCenterRounded";
import GarageIcon from "@mui/icons-material/GarageRounded";
import CloseIcon from "@mui/icons-material/Close";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import axios from "axios";

const AddAllocationPopup = ({
  open,
  onClose,
  phase,
  data,
  allocatedDemands,
  startDate,
  endDate,
}) => {
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedParkingLot, setSelectedParkingLot] = useState("");
  const [capacities, setCapacities] = useState({
    cars: 0,
    buses: 0,
    trucks: 0,
  });
  const [limits, setLimits] = useState({
    cars: 0,
    buses: 0,
    trucks: 0,
  });
  const [showError, setShowError] = useState(false);

  const maxDemand = {
    car_demand: Math.max(...data.map((d) => d.car_demand), 0),
    bus_demand: Math.max(...data.map((d) => d.bus_demand), 0),
    truck_demand: Math.max(...data.map((d) => d.truck_demand), 0),
  };

  const notAllocatedCars = maxDemand.car_demand - allocatedDemands.cars;
  const notAllocatedBuses = maxDemand.bus_demand - allocatedDemands.buses;
  const notAllocatedTrucks = maxDemand.truck_demand - allocatedDemands.trucks;

  const fetchParkingLotCapacities = useCallback(async () => {
    try {
      const response = await axios.get(`/api/events/parking_lot_capacities`, {
        params: { start_date: startDate, end_date: endDate },
      });
      const parkingLotData = response.data;

      const lotMap = {};
      const lotLimits = {};

      parkingLotData.forEach((lot) => {
        if (!lotMap[lot.parking_lot_id]) {
          lotMap[lot.parking_lot_id] = {
            name: lot.parking_lot_name,
            free_capacity: lot.free_capacity,
            used_capacity: lot.used_capacity,
            cars: lot.capacity - lot.used_capacity,
            buses: lot.bus_limit - lot.used_buses,
            trucks: lot.truck_limit - lot.used_trucks,
          };
          lotLimits[lot.parking_lot_id] = {
            cars: lot.capacity - lot.used_capacity,
            buses: lot.bus_limit - lot.used_buses,
            trucks: lot.truck_limit - lot.used_trucks,
          };
        } else {
          lotMap[lot.parking_lot_id].free_capacity = Math.min(
            lotMap[lot.parking_lot_id].free_capacity,
            lot.free_capacity
          );
          lotMap[lot.parking_lot_id].used_capacity += lot.used_capacity;
          lotMap[lot.parking_lot_id].cars = Math.min(
            lotMap[lot.parking_lot_id].cars,
            lot.capacity - lot.used_capacity
          );
          lotMap[lot.parking_lot_id].buses = Math.min(
            lotMap[lot.parking_lot_id].buses,
            lot.bus_limit - lot.used_buses
          );
          lotMap[lot.parking_lot_id].trucks = Math.min(
            lotMap[lot.parking_lot_id].trucks,
            lot.truck_limit - lot.used_trucks
          );

          lotLimits[lot.parking_lot_id].cars = Math.min(
            lotLimits[lot.parking_lot_id].cars,
            lot.capacity - lot.used_capacity
          );
          lotLimits[lot.parking_lot_id].buses = Math.min(
            lotLimits[lot.parking_lot_id].buses,
            lot.bus_limit - lot.used_buses
          );
          lotLimits[lot.parking_lot_id].trucks = Math.min(
            lotLimits[lot.parking_lot_id].trucks,
            lot.truck_limit - lot.used_trucks
          );
        }
      });

      const availableParkingLots = Object.entries(lotMap).map(([id, lot]) => ({
        id,
        ...lot,
      }));

      setParkingLots(availableParkingLots);

      if (availableParkingLots.length > 0) {
        const firstAvailableLot = availableParkingLots[0];
        setSelectedParkingLot(firstAvailableLot.id);
        setCapacities({
          cars: Math.min(firstAvailableLot.cars, notAllocatedCars),
          buses: Math.min(firstAvailableLot.buses, notAllocatedBuses),
          trucks: Math.min(firstAvailableLot.trucks, notAllocatedTrucks),
        });
        setLimits({
          cars: lotLimits[firstAvailableLot.id].cars,
          buses: lotLimits[firstAvailableLot.id].buses,
          trucks: lotLimits[firstAvailableLot.id].trucks,
        });
      }
    } catch (error) {
      console.error("Error fetching parking lot capacities:", error);
    }
  }, [
    startDate,
    endDate,
    notAllocatedCars,
    notAllocatedBuses,
    notAllocatedTrucks,
  ]);

  useEffect(() => {
    if (open) {
      fetchParkingLotCapacities();
      document.body.style.overflow = "hidden"; // Prevent scrolling
    } else {
      document.body.style.overflow = "unset"; // Allow scrolling
    }

    return () => {
      document.body.style.overflow = "unset"; // Ensure scrolling is reset when component unmounts
    };
  }, [open, fetchParkingLotCapacities]);

  const handleParkingLotChange = (event) => {
    const selectedLot = parkingLots.find(
      (lot) => lot.id === event.target.value
    );
    setSelectedParkingLot(event.target.value);
    setCapacities({
      cars: Math.min(selectedLot.cars, notAllocatedCars),
      buses: Math.min(selectedLot.buses, notAllocatedBuses),
      trucks: Math.min(selectedLot.trucks, notAllocatedTrucks),
    });
    setLimits({
      cars: selectedLot.cars,
      buses: selectedLot.buses,
      trucks: selectedLot.trucks,
    });
  };

  const handleSave = () => {
    if (
      capacities.cars === 0 &&
      capacities.buses === 0 &&
      capacities.trucks === 0
    ) {
      setShowError(true);
      return;
    }

    const storedAllocations =
      JSON.parse(sessionStorage.getItem("allocations")) || {};
    const newAllocation = {
      cars: capacities.cars,
      buses: capacities.buses,
      trucks: capacities.trucks,
      parking_lot_name: parkingLots.find((lot) => lot.id === selectedParkingLot)
        .name,
      parking_lot_id: selectedParkingLot,
    };
    if (!storedAllocations[phase]) {
      storedAllocations[phase] = {};
    }
    storedAllocations[phase][newAllocation.parking_lot_name] = newAllocation;
    sessionStorage.setItem("allocations", JSON.stringify(storedAllocations));
    window.dispatchEvent(new Event("storage"));
    onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const getPhaseIcon = () => {
    switch (phase) {
      case "assembly":
        return <ArrowCircleUpRoundedIcon />;
      case "runtime":
        return <PlayCircleFilledRoundedIcon />;
      case "disassembly":
        return <ArrowCircleDownRoundedIcon />;
      default:
        return <AccountTreeRoundedIcon />;
    }
  };

  const days = calculateDays(startDate, endDate);

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <Box p={3} className="add-allocation-popup">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          className="popup-header"
        >
          <Box display="flex" gap="1rem" alignItems="center">
            {getPhaseIcon()}
            <Typography
              className="popup-title"
              variant="h6"
              gutterBottom
              display="flex"
              alignContent="center"
            >
              Add {phase.charAt(0).toUpperCase() + phase.slice(1)} Allocation
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <Divider />
        <Typography variant="body1" gutterBottom className="popup-date">
          {formatDate(startDate)} - {formatDate(endDate)} ({days}{" "}
          {days === 1 ? "Day" : "Days"})
        </Typography>

        <Grid container className="popup-allocation-header">
          <Grid item xs={3}>
            <Box className="icon-text">{""}</Box>
          </Grid>
          <Grid item xs={3}>
            <Box className="icon-text">
              <DirectionsCarFilledRoundedIcon className="icon-small" />
              <Typography>Cars</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box className="icon-text">
              <AirportShuttleRoundedIcon className="icon-small" />
              <Typography>Buses</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box className="icon-text">
              <LocalShippingRoundedIcon className="icon-small" />
              <Typography>Trucks</Typography>
            </Box>
          </Grid>
        </Grid>
        <Divider />

        <Grid container className="assignment-container not-allocated">
          <Grid item xs={3} className="demand-item">
            <Box className="icon-text-row">
              <HelpCenterRoundedIcon className="icon-small" />
              <Typography>Not Allocated</Typography>
            </Box>
          </Grid>
          <Grid item xs={3} className="demand-item">
            <Typography>{notAllocatedCars}</Typography>
          </Grid>
          <Grid item xs={3} className="demand-item">
            <Typography>{notAllocatedBuses}</Typography>
          </Grid>
          <Grid item xs={3} className="demand-item">
            <Typography>{notAllocatedTrucks}</Typography>
          </Grid>
        </Grid>
        <Divider />

        <Box mt={2}>
          <Box display="flex" gap="0.5rem" alignItems="center" className="">
            <GarageIcon />
            <Typography
              gutterBottom
              variant="h6"
              display="flex"
              alignContent="center"
              margin
            >
              Available Parking Spaces
            </Typography>
          </Box>
          <Select
            fullWidth
            value={selectedParkingLot}
            onChange={handleParkingLotChange}
          >
            {parkingLots.map((lot) => (
              <MenuItem key={lot.id} value={lot.id}>
                {`${lot.name} (Free: ${lot.free_capacity}, Utilized: ${lot.used_capacity})`}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Box mt={2}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box
                display="flex"
                alignItems="center"
                className="popup-icon-label"
              >
                <DirectionsCarFilledRoundedIcon
                  style={{ marginRight: "8px" }}
                />
                <Typography>Cars</Typography>
              </Box>
              <TextField
                label="= Car Units"
                type="number"
                fullWidth
                value={capacities.cars}
                onChange={(e) =>
                  setCapacities({
                    ...capacities,
                    cars: Math.min(
                      Math.max(0, parseInt(e.target.value, 10)),
                      limits.cars
                    ),
                  })
                }
                inputProps={{ min: 0, max: limits.cars, step: 10 }}
                disabled={limits.cars === 0}
              />
              <Typography variant="caption">
                {parkingLots.find((lot) => lot.id === selectedParkingLot)?.name}
                : Limit: {limits.cars}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Box
                display="flex"
                alignItems="center"
                className="popup-icon-label"
              >
                <AirportShuttleRoundedIcon style={{ marginRight: "8px" }} />
                <Typography>Buses</Typography>
              </Box>
              <TextField
                label="= 3x Car Units"
                type="number"
                fullWidth
                value={capacities.buses}
                onChange={(e) =>
                  setCapacities({
                    ...capacities,
                    buses: Math.min(
                      Math.max(0, parseInt(e.target.value, 10)),
                      limits.buses
                    ),
                  })
                }
                inputProps={{ min: 0, max: limits.buses, step: 10 }}
                disabled={limits.buses === 0}
              />
              <Typography variant="caption">
                {parkingLots.find((lot) => lot.id === selectedParkingLot)?.name}
                : Limit: {limits.buses}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Box
                display="flex"
                alignItems="center"
                className="popup-icon-label"
              >
                <LocalShippingRoundedIcon style={{ marginRight: "8px" }} />
                <Typography>Trucks</Typography>
              </Box>
              <TextField
                label="= 4x Car Units"
                type="number"
                fullWidth
                value={capacities.trucks}
                onChange={(e) =>
                  setCapacities({
                    ...capacities,
                    trucks: Math.min(
                      Math.max(0, parseInt(e.target.value, 10)),
                      limits.trucks
                    ),
                  })
                }
                inputProps={{ min: 0, max: limits.trucks, step: 10 }}
                disabled={limits.trucks === 0}
              />
              <Typography variant="caption">
                {parkingLots.find((lot) => lot.id === selectedParkingLot)?.name}
                : Limit: {limits.trucks}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        {showError && (
          <Box mt={2}>
            <Alert severity="error">Cannot save with all values set to 0</Alert>
          </Box>
        )}
        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button
            onClick={onClose}
            color="secondary"
            className="popup-btn-close"
            startIcon={<CloseIcon />}
            style={{ marginRight: "10px" }}
          >
            Cancel
          </Button>
          <Button
            startIcon={<AddRoundedIcon />}
            variant="contained"
            className="popup-btn"
            color="primary"
            onClick={handleSave}
          >
            Add
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

AddAllocationPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  phase: PropTypes.string.isRequired,
  data: PropTypes.array.isRequired,
  allocatedDemands: PropTypes.object.isRequired,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
};

export default AddAllocationPopup;
