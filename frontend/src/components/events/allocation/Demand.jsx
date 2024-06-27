import { useState, useEffect } from "react";
import { Grid, Typography, Box } from "@mui/material";
import PropTypes from "prop-types";

const COLORS = {
  green: "#d0f0c0",
  orange: "#fceabb",
  red: "#fcd7d4",
};

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
        sessionStorage.getItem("allocations")
      );
      if (storedAllocations && storedAllocations[phase]) {
        const phaseAllocations = Object.values(storedAllocations[phase]).reduce(
          (acc, alloc) => {
            acc.cars += alloc.cars;
            acc.buses += alloc.buses;
            acc.trucks += alloc.trucks;
            return acc;
          },
          { cars: 0, buses: 0, trucks: 0 }
        );
        setAllocations(phaseAllocations);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    handleStorageChange();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [phase]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const maxDemand = {
    car_demand: Math.max(...data.map((d) => d.car_demand), 0),
    bus_demand: Math.max(...data.map((d) => d.bus_demand), 0),
    truck_demand: Math.max(...data.map((d) => d.truck_demand), 0),
  };

  const getBackgroundColor = (totalAllocated, maxDemand) => {
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
    maxDemand.car_demand
  );
  const busBackgroundColor = getBackgroundColor(
    totalAllocatedBuses,
    maxDemand.bus_demand
  );
  const truckBackgroundColor = getBackgroundColor(
    totalAllocatedTrucks,
    maxDemand.truck_demand
  );
  const totalDemandBackgroundColor = getBackgroundColor(
    totalAllocatedDemand,
    totalMaxDemand
  );

  return (
    <Grid className="allocation-container" item xs={4}>
      <Box>
        <Grid container>
          <Grid item xs={3}>
            <Typography>
              <strong>Date</strong>
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              <strong>Cars</strong>
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              <strong>Buses</strong>
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              <strong>Trucks</strong>
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              <strong>Total</strong>
            </Typography>
          </Grid>
        </Grid>
        {data.map((demand, index) => (
          <Grid container key={index}>
            <Grid item xs={3}>
              <Typography>{formatDate(demand.date)}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>{demand.car_demand}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>{demand.bus_demand}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>{demand.truck_demand}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>
                {demand.car_demand +
                  demand.bus_demand * 3 +
                  demand.truck_demand * 4}
              </Typography>
            </Grid>
          </Grid>
        ))}
        <Grid container>
          <Grid item xs={3}>
            <Typography>
              <strong>Max. / Day</strong>
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              <strong>{maxDemand.car_demand}</strong>
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              <strong>{maxDemand.bus_demand}</strong>
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              <strong>{maxDemand.truck_demand}</strong>
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              <strong>
                {maxDemand.car_demand +
                  maxDemand.bus_demand * 3 +
                  maxDemand.truck_demand * 4}
              </strong>
            </Typography>
          </Grid>
        </Grid>
        <Grid container>
          <Grid item xs={3}>
            <Typography>
              <strong>∑ Allocated</strong>
            </Typography>
          </Grid>
          <Grid item xs={2} style={{ backgroundColor: carBackgroundColor }}>
            <Typography>
              <strong>{totalAllocatedCars}</strong>
            </Typography>
          </Grid>
          <Grid item xs={2} style={{ backgroundColor: busBackgroundColor }}>
            <Typography>
              <strong>{totalAllocatedBuses}</strong>
            </Typography>
          </Grid>
          <Grid item xs={2} style={{ backgroundColor: truckBackgroundColor }}>
            <Typography>
              <strong>{totalAllocatedTrucks}</strong>
            </Typography>
          </Grid>
          <Grid
            item
            xs={2}
            style={{ backgroundColor: totalDemandBackgroundColor }}
          >
            <Typography>
              <strong>{totalAllocatedDemand}</strong>
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
};

export default Demand;
