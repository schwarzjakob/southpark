import { useState, useEffect } from "react";
import axios from "axios";
import { Switch } from "antd";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import GarageIcon from "@mui/icons-material/GarageRounded";
import RoofingRoundedIcon from "@mui/icons-material/RoofingRounded";
import WcRoundedIcon from "@mui/icons-material/WcRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import AddRoadRoundedIcon from "@mui/icons-material/AddRoadRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

import "./styles/parkingSpaces.css";

const TITLE = "Edit Parking Lot";

const EditParkingSpace = () => {
  const [parkingSpace, setParkingSpace] = useState({
    name: "",
    service_toilets: false,
    surface_material: "asphalt",
    service_shelter: false,
    pricing: "low",
    external: false,
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchParkingSpace = async () => {
      console.log("ID:", id);
      try {
        if (!id || isNaN(id)) {
          setError("No valid ID provided.");
          return;
        }
        const response = await axios.get(`/api/get_parking_space/${id}`);
        setParkingSpace(response.data);
      } catch (error) {
        console.error("Error fetching parking space data:", error);
        setError("Error fetching parking space data.");
      }
    };

    fetchParkingSpace();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setParkingSpace({
      ...parkingSpace,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSwitchChange = (name) => (checked) => {
    setParkingSpace({
      ...parkingSpace,
      [name]: checked,
    });
  };

  const handleSelectChange = (name) => (event) => {
    const value = event.target.value;
    setParkingSpace({
      ...parkingSpace,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `/api/edit_parking_space/${id}`,
        parkingSpace,
      );
      console.log("Parking space updated:", response.data);
      navigate(`/parking_space/${response.data.id}`);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setError("Parking space with this name already exists.");
      } else {
        console.error("Error updating parking space:", error);
        setError("Error updating parking space.");
      }
    }
  };

  return (
    <Box className="form-width">
      <Paper className="form-container">
        <Box className="iconHeadline__container">
          <EditRoundedIcon />
          <Typography variant="h4" gutterBottom className="demandTable__title">
            {TITLE}
          </Typography>
        </Box>
        {error && (
          <Typography color="error" variant="body1">
            {error}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <GarageIcon className="input-container__icon" />
              <TextField
                label="Name"
                name="name"
                value={parkingSpace.name}
                onChange={handleChange}
                fullWidth
                error={!!error}
                helperText={error}
              />
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <PlaceRoundedIcon className="input-container__icon" />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={parkingSpace.external.toString()}
                  onChange={handleSelectChange("external")}
                >
                  <MenuItem value="false">Internal</MenuItem>
                  <MenuItem value="true">External</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <AddRoadRoundedIcon className="input-container__icon" />
              <FormControl fullWidth>
                <InputLabel>Surface</InputLabel>
                <Select
                  value={parkingSpace.surface_material}
                  onChange={handleSelectChange("surface_material")}
                >
                  <MenuItem value="asphalt">Asphalt</MenuItem>
                  <MenuItem value="gravel">Gravel</MenuItem>
                  <MenuItem value="dirt">Dirt</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <AttachMoneyRoundedIcon className="input-container__icon" />
              <FormControl fullWidth>
                <InputLabel>Pricing</InputLabel>
                <Select
                  value={parkingSpace.pricing}
                  onChange={handleSelectChange("pricing")}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <WcRoundedIcon className="input-container__icon" />
              <Typography style={{ marginRight: "10px" }}>Toilets</Typography>
              <Switch
                name="service_toilets"
                checked={parkingSpace.service_toilets}
                onChange={handleSwitchChange("service_toilets")}
              />
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <RoofingRoundedIcon className="input-container__icon" />
              <Typography style={{ marginRight: "10px" }}>Shelter</Typography>
              <Switch
                name="service_shelter"
                checked={parkingSpace.service_shelter}
                onChange={handleSwitchChange("service_shelter")}
              />
            </Box>
          </FormControl>
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Button
              className="back-button"
              variant="outlined"
              color="primary"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveRoundedIcon />}
            >
              Save
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default EditParkingSpace;
