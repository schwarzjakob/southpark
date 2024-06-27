import { useState, useEffect } from "react";
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
import axios from "axios";

const AddAllocationPopup = ({
  open,
  onClose,
  phase,
  totalDemands,
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

  useEffect(() => {
    if (open) {
      fetchParkingLotCapacities();
    }
  }, [open]);

  const fetchParkingLotCapacities = async () => {
    try {
      const response = await axios.get(`/api/events/parking_lot_capacities`, {
        params: { start_date: startDate, end_date: endDate },
      });
      const parkingLotData = response.data;

      const lotMap = {};
      const lotLimits = {};
      const storedAllocations =
        JSON.parse(sessionStorage.getItem("allocations")) || {};

      const alreadyAssigned = new Set();
      Object.values(storedAllocations[phase] || {}).forEach((allocation) => {
        alreadyAssigned.add(allocation.parking_lot_id);
      });

      parkingLotData.forEach((lot) => {
        if (!lotMap[lot.parking_lot_id]) {
          lotMap[lot.parking_lot_id] = {
            name: lot.parking_lot_name,
            free_capacity: lot.free_capacity,
            used_capacity: lot.used_capacity,
            cars: lot.capacity - lot.used_capacity,
            buses: lot.bus_limit - lot.used_buses,
            trucks: lot.truck_limit - lot.used_trucks,
            disabled: alreadyAssigned.has(lot.parking_lot_id),
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
        name: alreadyAssigned.has(parseInt(id))
          ? `[Selected] ${lot.name}`
          : lot.name,
      }));

      setParkingLots(availableParkingLots);

      if (availableParkingLots.length > 0) {
        const firstAvailableLot = availableParkingLots.find(
          (lot) => !lot.disabled
        );
        if (firstAvailableLot) {
          setSelectedParkingLot(firstAvailableLot.id);
          setCapacities({
            cars: Math.min(firstAvailableLot.cars, totalDemands.cars),
            buses: Math.min(firstAvailableLot.buses, totalDemands.buses),
            trucks: Math.min(firstAvailableLot.trucks, totalDemands.trucks),
          });
          setLimits({
            cars: lotLimits[firstAvailableLot.id].cars,
            buses: lotLimits[firstAvailableLot.id].buses,
            trucks: lotLimits[firstAvailableLot.id].trucks,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching parking lot capacities:", error);
    }
  };

  const handleParkingLotChange = (event) => {
    const selectedLot = parkingLots.find(
      (lot) => lot.id === event.target.value
    );
    setSelectedParkingLot(event.target.value);
    setCapacities({
      cars: Math.min(selectedLot.cars, totalDemands.cars),
      buses: Math.min(selectedLot.buses, totalDemands.buses),
      trucks: Math.min(selectedLot.trucks, totalDemands.trucks),
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
      parking_lot_name: parkingLots
        .find((lot) => lot.id === selectedParkingLot)
        .name.replace("[Selected] ", ""),
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <Box p={3} className="add-allocation-popup">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            <AccountTreeRoundedIcon /> Add Allocation
          </Typography>
          <IconButton onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <Divider />
        <Typography variant="h6" gutterBottom>
          Phase: {phase}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Period: {formatDate(startDate)} - {formatDate(endDate)}
        </Typography>
        <Typography variant="h6" gutterBottom>
          Demand to be allocated:
        </Typography>
        <Grid container>
          <Grid item xs={3}>
            <Typography>
              <strong>Cars</strong>
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography>
              <strong>Buses</strong>
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography>
              <strong>Trucks</strong>
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography>
              <strong>Total</strong>
            </Typography>
          </Grid>
        </Grid>
        <Grid container>
          <Grid item xs={3}>
            <Typography>{totalDemands.cars}</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography>{totalDemands.buses}</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography>{totalDemands.trucks}</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography>
              {totalDemands.cars +
                totalDemands.buses * 3 +
                totalDemands.trucks * 4}
            </Typography>
          </Grid>
        </Grid>
        <Divider />
        <Box mt={2}>
          <Typography variant="h6" gutterBottom>
            Select Parking Lot
          </Typography>
          <Select
            fullWidth
            value={selectedParkingLot}
            onChange={handleParkingLotChange}
          >
            {parkingLots.map((lot) => (
              <MenuItem key={lot.id} value={lot.id} disabled={lot.disabled}>
                {lot.name}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Box mt={2}>
          <Typography variant="h6" gutterBottom>
            Limits
          </Typography>
          <Grid container>
            <Grid item xs={4}>
              <Typography>Cars</Typography>
              <Typography>{limits.cars}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography>Buses</Typography>
              <Typography>{limits.buses}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography>Trucks</Typography>
              <Typography>{limits.trucks}</Typography>
            </Grid>
          </Grid>
        </Box>
        <Box mt={2}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography>Cars</Typography>
              <TextField
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
                inputProps={{ min: 0, max: limits.cars }}
                disabled={limits.cars === 0}
              />
            </Grid>
            <Grid item xs={4}>
              <Typography>Buses</Typography>
              <TextField
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
                inputProps={{ min: 0, max: limits.buses }}
                disabled={limits.buses === 0}
              />
            </Grid>
            <Grid item xs={4}>
              <Typography>Trucks</Typography>
              <TextField
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
                inputProps={{ min: 0, max: limits.trucks }}
                disabled={limits.trucks === 0}
              />
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
            style={{ marginRight: "10px" }}
          >
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save
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
  totalDemands: PropTypes.object.isRequired,
  startDate: PropTypes.string.isRequired,
  endDate: PropTypes.string.isRequired,
};

export default AddAllocationPopup;
