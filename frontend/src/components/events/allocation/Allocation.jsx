import { useState, useEffect } from "react";
import {
  Grid,
  Typography,
  Box,
  IconButton,
  Divider,
} from "@mui/material";
import PropTypes from "prop-types";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";

const Allocation = ({ phase }) => {
  Allocation.propTypes = {
    phase: PropTypes.string.isRequired,
  };

  const [allocations, setAllocations] = useState([]);

  const handleDelete = (parkingSpace) => {
    const storedAllocations = JSON.parse(sessionStorage.getItem("allocations"));
    if (storedAllocations && storedAllocations[phase]) {
      delete storedAllocations[phase][parkingSpace];
      sessionStorage.setItem("allocations", JSON.stringify(storedAllocations));
      setAllocations(Object.entries(storedAllocations[phase]));
      window.dispatchEvent(new Event("storage"));
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const storedAllocations = JSON.parse(
        sessionStorage.getItem("allocations")
      );
      if (storedAllocations && storedAllocations[phase]) {
        setAllocations(Object.entries(storedAllocations[phase]));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    handleStorageChange();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [phase]);

  useEffect(() => {
    const storedAllocations = JSON.parse(sessionStorage.getItem("allocations"));
    if (storedAllocations && storedAllocations[phase]) {
      setAllocations(Object.entries(storedAllocations[phase]));
    }
  }, [phase]);

  const totalAllocations = allocations.reduce(
    (acc, [, data]) => {
      acc.cars += data.cars;
      acc.buses += data.buses;
      acc.trucks += data.trucks;
      acc.carUnits += data.cars + data.buses * 3 + data.trucks * 4;
      return acc;
    },
    { cars: 0, buses: 0, trucks: 0, carUnits: 0 }
  );

  return (
    <Grid item xs={4} className="allocation-container">
      <Box>
        <Grid container className="allocation-header">
          <Grid item xs={2}>
            <Typography>
              <strong>Parking Space</strong>
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
              <strong>Car Units</strong>
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              <strong></strong>
            </Typography>
          </Grid>
        </Grid>
        {allocations.map(([parkingSpace, data], index) => (
          <Grid container key={index} className="allocation-row">
            <Grid item xs={2}>
              <Typography>{parkingSpace}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>{data.cars}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>{data.buses}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>{data.trucks}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>
                {data.cars + data.buses * 3 + data.trucks * 4}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <IconButton onClick={() => handleDelete(parkingSpace)}>
                <DeleteForeverRoundedIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        <Divider />
        <Grid container>
          <Grid item xs={2}>
            <Typography>
              <strong>Total</strong>
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              <strong>{totalAllocations.cars}</strong>
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              <strong>{totalAllocations.buses}</strong>
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              <strong>{totalAllocations.trucks}</strong>
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography>
              <strong>{totalAllocations.carUnits}</strong>
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
};

export default Allocation;
