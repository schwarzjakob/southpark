import { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import GarageIcon from "@mui/icons-material/GarageRounded";
import RoofingRoundedIcon from "@mui/icons-material/RoofingRounded";
import WcRoundedIcon from "@mui/icons-material/WcRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import AddRoadRoundedIcon from "@mui/icons-material/AddRoadRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import AddBoxIcon from "@mui/icons-material/AddBox";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

import "./styles/parkingSpaces.css";

const TITLE = "Add Parking Lot";

const AddParkingSpace = () => {
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setParkingSpace({
      ...parkingSpace,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSelectChange = (name) => (event) => {
    const value = event.target.value;
    if (name === "external") {
      setParkingSpace({
        ...parkingSpace,
        [name]: value === "External",
      });
    } else {
      setParkingSpace({
        ...parkingSpace,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/parking/space", parkingSpace);
      const parkingLotId = response.data.id;
      console.log("Parking space added:", parkingLotId);
      navigate(`/parking_space/${parkingLotId}`);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setError("Parking space with this name already exists.");
      } else {
        console.error("Error adding parking space:", error);
      }
    }
  };

  return (
    <Box className="form-width">
      <Paper className="form-container">
        <Box className="iconHeadline__container">
          <AddBoxIcon />
          <Typography variant="h4" gutterBottom>
            {TITLE}
          </Typography>
        </Box>
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
                required={true}
              />
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <PlaceRoundedIcon className="input-container__icon" />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={parkingSpace.external ? "External" : "Internal"}
                  onChange={handleSelectChange("external")}
                >
                  <MenuItem value="Internal">Internal</MenuItem>
                  <MenuItem value="External">External</MenuItem>
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
                onChange={(checked) =>
                  handleSelectChange("service_toilets")({
                    target: { value: checked },
                  })
                }
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
                onChange={(checked) =>
                  handleSelectChange("service_shelter")({
                    target: { value: checked },
                  })
                }
              />
            </Box>
          </FormControl>
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Button
              className="back-button"
              variant="outlined"
              color="primary"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/parking_spaces/`)}
            >
              Back
            </Button>{" "}
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

export default AddParkingSpace;
