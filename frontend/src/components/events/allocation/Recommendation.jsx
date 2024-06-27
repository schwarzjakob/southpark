import { useState, useEffect } from "react";
import { Grid, Typography, Box, IconButton } from "@mui/material";
import PropTypes from "prop-types";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";

const Recommendation = ({ phase }) => {
  Recommendation.propTypes = {
    phase: PropTypes.string.isRequired,
  };

  const [allocations, setAllocations] = useState([]);

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

  return (
    <Grid item xs={4} className="allocation-container">
      <Box>
        <Grid container className="allocation-header">
          <Grid item xs={3}>
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
              <strong></strong>
            </Typography>
          </Grid>
        </Grid>
        {allocations.map(([parkingSpace, data], index) => (
          <Grid container key={index} className="allocation-row">
            <Grid item xs={3}>
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
              <IconButton>
                <DeleteForeverRoundedIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
      </Box>
    </Grid>
  );
};

export default Recommendation;
