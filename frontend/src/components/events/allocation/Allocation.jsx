import { useState, useEffect, useCallback } from "react";
import { Grid, Typography, Box, IconButton, Divider } from "@mui/material";
import PropTypes from "prop-types";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import AirportShuttleRoundedIcon from "@mui/icons-material/AirportShuttleRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import FunctionsRoundedIcon from "@mui/icons-material/FunctionsRounded";
import GarageIcon from "@mui/icons-material/GarageRounded";

const Allocation = ({ phase }) => {
  Allocation.propTypes = {
    phase: PropTypes.string.isRequired,
  };

  const [allocations, setAllocations] = useState([]);

  const handleDelete = (parkingSpace) => {
    const storedAllocations = JSON.parse(localStorage.getItem("allocations"));
    if (storedAllocations && storedAllocations[phase]) {
      delete storedAllocations[phase][parkingSpace];
      localStorage.setItem("allocations", JSON.stringify(storedAllocations));

      setAllocations(Object.entries(storedAllocations[phase]));
      window.dispatchEvent(new Event("allocations-updated"));
    }
  };

  const loadAllocations = useCallback(() => {
    const storedAllocations = JSON.parse(localStorage.getItem("allocations"));
    if (storedAllocations && storedAllocations[phase]) {
      setAllocations(Object.entries(storedAllocations[phase]));
    } else {
      setAllocations([]);
    }
  }, [phase]);

  useEffect(() => {
    const handleAllocationsUpdated = () => {
      loadAllocations();
    };

    window.addEventListener("allocations-updated", handleAllocationsUpdated);
    loadAllocations();

    return () => {
      window.removeEventListener(
        "allocations-updated",
        handleAllocationsUpdated
      );
    };
  }, [loadAllocations]);

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
            <Box className="icon-text">
              <GarageIcon className="icon-small" />
              <Typography>Parking</Typography>
            </Box>
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
              <Typography>Truck (4)</Typography>
            </Box>
          </Grid>
          <Grid item xs={2}>
            <Box className="icon-text">
              <FunctionsRoundedIcon className="icon-small" />
              <Typography>Car Units</Typography>
            </Box>
          </Grid>
          <Grid item xs={2}>
            {""}
          </Grid>
        </Grid>
        {allocations.map(([parkingSpace, data], index) => (
          <Grid
            container
            key={index}
            className={`assignment-container allocation-row ${
              index % 2 === 1 ? "allocation-row-2nd" : ""
            }`}
          >
            <Grid item xs={2} className="assignment-item parking-space">
              <Typography>{parkingSpace}</Typography>
            </Grid>
            <Grid item xs={2} className="assignment-item">
              <Typography>{data.cars}</Typography>
            </Grid>
            <Grid item xs={2} className="assignment-item">
              <Typography>{data.buses}</Typography>
            </Grid>
            <Grid item xs={2} className="assignment-item">
              <Typography>{data.trucks}</Typography>
            </Grid>
            <Grid item xs={2} className="assignment-item">
              <Typography>
                {data.cars + data.buses * 3 + data.trucks * 4}
              </Typography>
            </Grid>
            <Grid item xs={2} className="assignment-item">
              <IconButton
                onClick={() => handleDelete(parkingSpace)}
                className="small-icon-button"
              >
                <DeleteForeverRoundedIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        <Divider />
        <Grid container className="assignment-container">
          <Grid item xs={2} className="assignment-item">
            <Typography>
              <strong>∑</strong>
            </Typography>
          </Grid>
          <Grid item xs={2} className="assignment-item ">
            <Typography>
              <strong>{totalAllocations.cars}</strong>
            </Typography>
          </Grid>
          <Grid item xs={2} className="assignment-item">
            <Typography>
              <strong>{totalAllocations.buses}</strong>
            </Typography>
          </Grid>
          <Grid item xs={2} className="assignment-item">
            <Typography>
              <strong>{totalAllocations.trucks}</strong>
            </Typography>
          </Grid>
          <Grid item xs={2} className="assignment-item">
            <Typography>
              <strong>{totalAllocations.carUnits}</strong>
            </Typography>
          </Grid>
          <Grid item xs={2} className="assignment-item">
            <Typography> </Typography>
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
};

export default Allocation;
