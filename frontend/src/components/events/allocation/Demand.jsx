import { useState, useEffect } from "react";
import { Grid, Typography, Box, Divider } from "@mui/material";
import PropTypes from "prop-types";
import { styled } from "@mui/system";
import NumbersRoundedIcon from "@mui/icons-material/NumbersRounded";
import CheckBoxRoundedIcon from "@mui/icons-material/CheckBoxRounded";
import HelpCenterRoundedIcon from "@mui/icons-material/HelpCenterRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import AirportShuttleRoundedIcon from "@mui/icons-material/AirportShuttleRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import FunctionsRoundedIcon from "@mui/icons-material/FunctionsRounded";

const COLORS = {
  green: "#d0f0c0",
  orange: "#fceabb",
  red: "#fcd7d4",
};

const DoubleDivider = styled(Box)(({ theme }) => ({
  position: "relative",
  "&::before, &::after": {
    content: '""',
    position: "absolute",
    left: 0,
    right: 0,
    height: "1px",
    backgroundColor: theme.palette.divider,
  },
  "&::before": {
    top: "-1px",
  },
  "&::after": {
    top: "1px",
  },
}));

const Demand = ({ phase, data }) => {
  Demand.propTypes = {
    phase: PropTypes.string.isRequired,
    data: PropTypes.array.isRequired,
  };

  const [allocations, setAllocations] = useState({
    cars: 0,
    buses: 0,
    trucks: 0,
  });
  useEffect(() => {
    const handleStorageChange = () => {
      const storedAllocations = JSON.parse(
        sessionStorage.getItem("allocations"),
      );
      if (storedAllocations && storedAllocations[phase]) {
        const phaseAllocations = Object.values(storedAllocations[phase]).reduce(
          (acc, alloc) => {
            acc.cars += alloc.cars;
            acc.buses += alloc.buses;
            acc.trucks += alloc.trucks;
            return acc;
          },
          { cars: 0, buses: 0, trucks: 0 },
        );
        setAllocations(phaseAllocations);
      }
    };

    window.addEventListener("allocations-updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    handleStorageChange();

    return () => {
      window.removeEventListener("allocations-updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [phase]);

  const maxDemand = {
    car_demand: Math.max(...data.map((d) => d.car_demand), 0),
    bus_demand: Math.max(...data.map((d) => d.bus_demand), 0),
    truck_demand: Math.max(...data.map((d) => d.truck_demand), 0),
  };

  const getBackgroundColor = (totalAllocated, maxDemand) => {
    if (maxDemand === 0) return "transparent";
    const percentage = (totalAllocated / maxDemand) * 100;
    if (percentage >= 100) return COLORS.green;
    if (percentage >= 80) return COLORS.orange;
    return COLORS.red;
  };

  const totalAllocatedCars = allocations.cars;
  const totalAllocatedBuses = allocations.buses;
  const totalAllocatedTrucks = allocations.trucks;

  const totalAllocatedDemand =
    totalAllocatedCars + totalAllocatedBuses * 3 + totalAllocatedTrucks * 4;

  const totalMaxDemand =
    maxDemand.car_demand +
    maxDemand.bus_demand * 3 +
    maxDemand.truck_demand * 4;

  const carBackgroundColor = getBackgroundColor(
    totalAllocatedCars,
    maxDemand.car_demand,
  );
  const busBackgroundColor = getBackgroundColor(
    totalAllocatedBuses,
    maxDemand.bus_demand,
  );
  const truckBackgroundColor = getBackgroundColor(
    totalAllocatedTrucks,
    maxDemand.truck_demand,
  );
  const totalDemandBackgroundColor = getBackgroundColor(
    totalAllocatedDemand,
    totalMaxDemand,
  );

  const notAllocatedCars = maxDemand.car_demand - totalAllocatedCars;
  const notAllocatedBuses = maxDemand.bus_demand - totalAllocatedBuses;
  const notAllocatedTrucks = maxDemand.truck_demand - totalAllocatedTrucks;
  const notAllocatedTotal =
    maxDemand.car_demand -
    totalAllocatedCars +
    (maxDemand.bus_demand - totalAllocatedBuses) * 3 +
    (maxDemand.truck_demand - totalAllocatedTrucks) * 4;

  const [, setPhases] = useState([]);

  const savePhase = (phase, totalAllocatedDemand, totalMaxDemand) => {
    const state = totalAllocatedDemand === totalMaxDemand;

    const storedPhases =
      JSON.parse(sessionStorage.getItem("fullyAllocated")) || [];
    const updatedPhases = storedPhases.filter((p) => p.phase !== phase);
    updatedPhases.push({ phase, state });

    sessionStorage.setItem("fullyAllocated", JSON.stringify(updatedPhases));

    const storageEvent = new Event("storage");
    window.dispatchEvent(storageEvent);
  };

  useEffect(() => {
    const handlePhaseStorageChange = (e) => {
      if (e.key === "fullyAllocated") {
        setPhases(JSON.parse(e.newValue) || []);
      }
    };

    window.addEventListener("storage", handlePhaseStorageChange);

    return () => {
      window.removeEventListener("storage", handlePhaseStorageChange);
    };
  }, []);

  useEffect(() => {
    savePhase(phase, totalAllocatedDemand, totalMaxDemand);
  }, [phase, totalAllocatedDemand, totalMaxDemand]);

  return (
    <Grid className="allocation-container" item xs={4}>
      <Box>
        <Grid container className="allocation-header">
          <Grid item xs={4}>
            <Box className="icon-text">{""}</Box>
          </Grid>
          <Grid item xs={2}>
            <Box className="icon-text">
              <DirectionsCarFilledRoundedIcon className="icon-small" />
              <Typography>Cars</Typography>
            </Box>
          </Grid>
          <Grid item xs={2}>
            <Box className="icon-text">
              <AirportShuttleRoundedIcon className="icon-small" />
              <Typography>Buses (3)</Typography>
            </Box>
          </Grid>
          <Grid item xs={2}>
            <Box className="icon-text">
              <LocalShippingRoundedIcon className="icon-small" />
              <Typography>Trucks (4)</Typography>
            </Box>
          </Grid>
          <Grid item xs={2}>
            <Box className="icon-text">
              <FunctionsRoundedIcon className="icon-small" />
              <Typography>Total</Typography>
            </Box>
          </Grid>
        </Grid>
        <Grid container className="assignment-container">
          <Grid item xs={4} className="demand-item">
            <Box className="icon-text-row">
              <NumbersRoundedIcon className="icon-small" />
              <Typography>
                Max. Daily <br></br>Phase Demand
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={2} className="demand-item">
            <Typography>{maxDemand.car_demand}</Typography>
          </Grid>
          <Grid item xs={2} className="demand-item">
            <Typography>{maxDemand.bus_demand}</Typography>
          </Grid>
          <Grid item xs={2} className="demand-item">
            <Typography>{maxDemand.truck_demand}</Typography>
          </Grid>
          <Grid item xs={2} className="demand-item">
            <Typography>{totalMaxDemand}</Typography>
          </Grid>
        </Grid>
        <Divider />
        <Grid container className="assignment-container not-allocated">
          <Grid item xs={4} className="demand-item">
            <Box className="icon-text-row">
              <HelpCenterRoundedIcon className="icon-small" />
              <Typography>Not Allocated</Typography>
            </Box>
          </Grid>
          <Grid
            item
            xs={2}
            className="demand-item"
            style={{ backgroundColor: carBackgroundColor }}
          >
            <Typography>{notAllocatedCars}</Typography>
          </Grid>
          <Grid
            item
            xs={2}
            className="demand-item"
            style={{ backgroundColor: busBackgroundColor }}
          >
            <Typography>{notAllocatedBuses}</Typography>
          </Grid>
          <Grid
            item
            xs={2}
            className="demand-item"
            style={{ backgroundColor: truckBackgroundColor }}
          >
            <Typography>{notAllocatedTrucks}</Typography>
          </Grid>
          <Grid
            item
            xs={2}
            className="demand-item"
            style={{ backgroundColor: totalDemandBackgroundColor }}
          >
            <Typography>{notAllocatedTotal}</Typography>
          </Grid>
        </Grid>
        <DoubleDivider />
        <Grid container className="assignment-container allocated">
          <Grid item xs={4} className="demand-item">
            <Box className="icon-text-row">
              <CheckBoxRoundedIcon className="icon-small" />
              <Typography>Allocated</Typography>
            </Box>
          </Grid>
          <Grid
            item
            xs={2}
            className="demand-item"
            style={{ backgroundColor: carBackgroundColor }}
          >
            <Typography fontWeight="bold">{totalAllocatedCars}</Typography>
          </Grid>
          <Grid
            item
            xs={2}
            className="demand-item"
            style={{ backgroundColor: busBackgroundColor }}
          >
            <Typography fontWeight="bold">{totalAllocatedBuses}</Typography>
          </Grid>
          <Grid
            item
            xs={2}
            className="demand-item"
            style={{ backgroundColor: truckBackgroundColor }}
          >
            <Typography fontWeight="bold">{totalAllocatedTrucks}</Typography>
          </Grid>
          <Grid
            item
            xs={2}
            className="demand-item"
            style={{ backgroundColor: totalDemandBackgroundColor }}
          >
            <Typography fontWeight="bold">{totalAllocatedDemand}</Typography>
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
};

export default Demand;
