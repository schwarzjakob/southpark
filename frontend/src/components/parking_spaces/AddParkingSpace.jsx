import { useState } from "react";
import axios from "axios";
import { Switch } from "antd";
import { useNavigate } from "react-router-dom";
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
import PermissionPopup from "../common/PermissionPopup.jsx";
import GarageIcon from "@mui/icons-material/GarageRounded";
import RoofingRoundedIcon from "@mui/icons-material/RoofingRounded";
import WcRoundedIcon from "@mui/icons-material/WcRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import AddRoadRoundedIcon from "@mui/icons-material/AddRoadRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import AddBoxIcon from "@mui/icons-material/AddBox";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CustomBreadcrumbs from "../common/BreadCrumbs.jsx";
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
  const [permissionError, setPermissionError] = useState({
    open: false,
    message: "",
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
    const token = localStorage.getItem("token"); 
    try {
      const response = await axios.post("/api/parking/space", parkingSpace, {
        headers: {
          Authorization: `Bearer ${token}`, 
        },
      });
      const parkingLotId = response.data.id;
      navigate(`/parking_space/${parkingLotId}`);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setPermissionError({
          open: true,
          message: "You do not have permission to perform this action.",
        });
      } else if (error.response && error.response.status === 400) {
        setError("Parking space with this name already exists.");
      } else {
        console.error("Error adding parking space:", error);
      }
    }
  };

  const breadcrumbLinks = [
    { label: "Parking Spaces", path: "/parking_spaces" },
    { label: "Add Parking Space", path: "/parking_space/add" },
  ];

  return (
    <Box className="form-width">
      <CustomBreadcrumbs links={breadcrumbLinks} />
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
              />
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <PlaceRoundedIcon className="input-container__icon" />
              <FormControl fullWidth>
                <InputLabel className="input-label-background">Type</InputLabel>
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
                <InputLabel className="input-label-background">
                  Surface
                </InputLabel>
                <Select
                  value={parkingSpace.surface_material}
                  onChange={handleSelectChange("surface_material")}
                >
                  <MenuItem value="asphalt">Asphalt</MenuItem>
                  <MenuItem value="gravel">Gravel</MenuItem>
                  <MenuItem value="field">Field</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <AttachMoneyRoundedIcon className="input-container__icon" />
              <FormControl fullWidth>
                <InputLabel className="input-label-background">
                  Pricing
                </InputLabel>
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
      <PermissionPopup
        open={permissionError.open}
        onClose={() => setPermissionError({ ...permissionError, open: false })}
        message={permissionError.message}
      />
    </Box>
  );
};

export default AddParkingSpace;
