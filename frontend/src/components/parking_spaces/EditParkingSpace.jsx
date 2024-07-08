import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import PermissionPopup from "../common/PermissionPopup.jsx";
import GarageIcon from "@mui/icons-material/GarageRounded";
import RoofingRoundedIcon from "@mui/icons-material/RoofingRounded";
import WcRoundedIcon from "@mui/icons-material/WcRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import AddRoadRoundedIcon from "@mui/icons-material/AddRoadRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CustomBreadcrumbs from "../common/BreadCrumbs.jsx";

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
  const [permissionError, setPermissionError] = useState({
    open: false,
    message: "",
  });

  const [originalParkingSpace, setOriginalParkingSpace] = useState(null);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchParkingSpace = async () => {
      try {
        const response = await axios.get(`/api/parking/space/${id}`);
        const data = response.data;
        if (!data) {
          setNotFound(true);
          return;
        }
        if (!["asphalt", "gravel", "field"].includes(data.surface_material)) {
          data.surface_material = "asphalt";
        }
        setParkingSpace(data);
        setOriginalParkingSpace(data);
      } catch (error) {
        console.error("Error fetching parking space data:", error);
        setError("Error fetching parking space data.");
        setNotFound(true);
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

  const hasUnsavedChanges = () => {
    return (
      JSON.stringify(parkingSpace) !== JSON.stringify(originalParkingSpace)
    );
  };

  const handleNavigate = (path) => {
    if (
      hasUnsavedChanges() &&
      !window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      )
    ) {
      return;
    }
    navigate(path);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      await axios.put(`/api/parking/space/${id}`, parkingSpace, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      navigate(`/parking_space/${id}`);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setPermissionError({
          open: true,
          message: "You do not have permission to perform this action.",
        });
      } else if (error.response && error.response.status === 400) {
        setError("Parking space with this name already exists.");
      } else {
        console.error("Error updating parking space:", error);
        setError("Error updating parking space.");
      }
    }
  };

  <PermissionPopup
    open={permissionError.open}
    onClose={() => setPermissionError({ ...permissionError, open: false })}
    message={permissionError.message}
  />;

  const breadcrumbLinks = [
    { label: "Parking Spaces", path: "/parking_spaces" },
    { label: parkingSpace.name, path: `/parking_space/${id}` },
    { label: "Edit", path: `/parking_space/${id}/edit` },
  ];

  if (notFound) {
    return (
      <Box className="form-width">
        <Typography color="error" variant="h4">
          Parking Space Not Found
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/parking_spaces")}
        >
          Back to Parking Spaces
        </Button>
      </Box>
    );
  }

  return (
    <Box className="form-width">
      <CustomBreadcrumbs
        links={breadcrumbLinks}
        onClick={(link) => handleNavigate(link.path)}
      />
      <Paper className="form-container">
        <Box className="iconHeadline__container">
          <EditRoundedIcon />
          <Typography variant="h4" gutterBottom>
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
                <InputLabel className="input-label-background">Type</InputLabel>
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
              onClick={() => handleNavigate(`/parking_space/${id}`)}
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

export default EditParkingSpace;
