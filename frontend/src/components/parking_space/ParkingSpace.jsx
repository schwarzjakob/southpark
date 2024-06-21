import { useState, useEffect } from "react";
import axios from "axios";
import { Box, Typography, Paper, Button } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import GarageIcon from "@mui/icons-material/GarageRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import AddRoadRoundedIcon from "@mui/icons-material/AddRoadRounded";
import WcRoundedIcon from "@mui/icons-material/WcRounded";
import RoofingRoundedIcon from "@mui/icons-material/RoofingRounded";
import ParkingSpaceCapacitysTable from "./ParkingSpaceCapacityTable";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

import "./styles/parkingSpaces.css";

const TITLE = "Parking Space Details";

const ParkingSpace = () => {
  const [parkingSpace, setParkingSpace] = useState(null);
  const [error, setError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchParkingSpace = async () => {
      try {
        const response = await axios.get(`/api/parking/space/${id}`);
        setParkingSpace(response.data);
      } catch (error) {
        console.error("Error fetching parking space data:", error);
        setError("Error fetching parking space data.");
      }
    };

    fetchParkingSpace();
  }, [id]);

  if (!parkingSpace) {
    return (
      <Box className="form-width">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box className="form-width">
      <Box className="form-headline-button__container">
        <Box className="iconHeadline__container">
          <GarageIcon />
          <Typography variant="h4" gutterBottom className="demandTable__title">
            {TITLE}
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate(`/parking_space/edit/${id}`)}
          >
            <Box display="flex" alignItems="center">
              <EditRoundedIcon className="icon__edit-parking-space" />
            </Box>
            Edit Parking Space
          </Button>
        </Box>
      </Box>

      <Paper className="form-container">
        {error && (
          <Typography color="error" variant="body1">
            {error}
          </Typography>
        )}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          padding="16px"
        >
          <Box display="flex" alignItems="end" gap="10px">
            <Box display="flex" alignItems="center">
              <Box className="parking-lot-box">{parkingSpace.name}</Box>
            </Box>
            <Box>
              <Typography variant="body1" fontStyle="italic">
                {parkingSpace.external ? "External" : "Internal"}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box display="flex" justifyContent="space-between" padding="16px">
          <Typography variant="body1" display="flex" gap="10px">
            <AttachMoneyRoundedIcon /> Pricing:{" "}
            {parkingSpace.pricing.charAt(0).toUpperCase() +
              parkingSpace.pricing.slice(1)}
          </Typography>
          <Typography variant="body1" display="flex" gap="10px">
            <AddRoadRoundedIcon /> Surface:{" "}
            {parkingSpace.surface_material.charAt(0).toUpperCase() +
              parkingSpace.surface_material.slice(1)}
          </Typography>
          <Typography variant="body1" display="flex" gap="10px">
            <WcRoundedIcon /> Toilets:{" "}
            {parkingSpace.service_toilets ? "✔" : "✘"}
          </Typography>
          <Typography variant="body1" display="flex" gap="10px">
            <RoofingRoundedIcon /> Shelter:{" "}
            {parkingSpace.service_shelter ? "✔" : "✘"}
          </Typography>
        </Box>
      </Paper>
      <ParkingSpaceCapacitysTable parkingLotId={id} />
      <Box display="flex" justifyContent="space-between" mt={2}>
        <Button
          className="back-button"
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/parking_spaces/`)}
        >
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default ParkingSpace;
