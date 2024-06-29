import {
  Grid,
  Typography,
  Box,
  Divider,
  CircularProgress,
} from "@mui/material";
import PropTypes from "prop-types";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import AirportShuttleRoundedIcon from "@mui/icons-material/AirportShuttleRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import FunctionsRoundedIcon from "@mui/icons-material/FunctionsRounded";
import GarageIcon from "@mui/icons-material/GarageRounded";

const Recommendation = ({ data, phase }) => {
  Recommendation.propTypes = {
    data: PropTypes.object,
    phase: PropTypes.string,
  };

  if (!data || !data[phase]) {
    return (
      <Grid item xs={4}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="200px"
        >
          <CircularProgress />
        </Box>
      </Grid>
    );
  }

  const allocations = Object.entries(data[phase]);

  const totalAllocations = allocations.reduce(
    (acc, [, allocation]) => {
      acc.cars += allocation.cars;
      acc.buses += allocation.buses;
      acc.trucks += allocation.trucks;
      acc.carUnits +=
        allocation.cars + allocation.buses * 3 + allocation.trucks * 4;
      return acc;
    },
    { cars: 0, buses: 0, trucks: 0, carUnits: 0 }
  );

  return (
    <Grid item xs={4} className="allocation-container">
      <Box>
        <Grid container className="allocation-header">
          <Grid item xs={3}>
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
              <Typography>Buses</Typography>
            </Box>
          </Grid>
          <Grid item xs={2}>
            <Box className="icon-text">
              <LocalShippingRoundedIcon className="icon-small" />
              <Typography>Trucks</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box className="icon-text">
              <FunctionsRoundedIcon className="icon-small" />
              <Typography>Car Units</Typography>
            </Box>
          </Grid>
        </Grid>
        {allocations.map(([parkingLot, allocation], index) => (
          <Grid
            container
            key={index}
            className={`assignment-container allocation-row ${
              index % 2 === 1 ? "allocation-row-2nd" : ""
            }`}
          >
            <Grid item xs={3} className="assignment-item parking-space">
              <Typography>{parkingLot}</Typography>
            </Grid>
            <Grid item xs={2} className="assignment-item">
              <Typography>{allocation.cars}</Typography>
            </Grid>
            <Grid item xs={2} className="assignment-item">
              <Typography>{allocation.buses}</Typography>
            </Grid>
            <Grid item xs={2} className="assignment-item">
              <Typography>{allocation.trucks}</Typography>
            </Grid>
            <Grid item xs={3} className="assignment-item">
              <Typography>
                {allocation.cars + allocation.buses * 3 + allocation.trucks * 4}
              </Typography>
            </Grid>
          </Grid>
        ))}
        <Divider />
        <Grid container className="assignment-container">
          <Grid item xs={3} className="assignment-item">
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
          <Grid item xs={3} className="assignment-item">
            <Typography>
              <strong>{totalAllocations.carUnits}</strong>
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
};

export default Recommendation;
