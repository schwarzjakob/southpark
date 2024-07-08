import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import DateRangePicker from "../controls/DateRangePicker";
import CustomBreadcrumbs from "../common/BreadCrumbs.jsx";
import PermissionPopup from "../common/PermissionPopup.jsx";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Alert,
} from "@mui/material";

import {
  DirectionsCarFilledRounded as DirectionsCarFilledIcon,
  LocalParkingRounded as LocalParkingRoundedIcon,
  AirportShuttleRounded as AirportShuttleRoundedIcon,
  LocalShippingRounded as LocalShippingRoundedIcon,
  DateRangeRounded as DateRangeRoundedIcon,
  SaveRounded as SaveRoundedIcon,
  AddBox as AddBoxIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import "./styles/parkingSpaces.css";

const TITLE = "Add Capacity";

const AddParkingSpaceCapacity = () => {
  const [capacity, setCapacity] = useState({
    capacity: 0,
    utilization_type: "parking",
    truck_limit: 0,
    bus_limit: 0,
    valid_from: null,
    valid_to: null,
  });
  const [parkingLot, setParkingLot] = useState({
    name: "",
    external: false,
  });
  const [error, setError] = useState("");
  const [originalCapacity] = useState(null);
  const [existingCapacities, setExistingCapacities] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const parkingLotId = searchParams.get("parkinglotId");
  const [permissionError, setPermissionError] = useState({
    open: false,
    message: "",
  });

  useEffect(() => {
    const fetchParkingLot = async () => {
      try {
        const response = await axios.get(`/api/parking/space/${parkingLotId}`);
        setParkingLot(response.data);
      } catch (error) {
        console.error("Error fetching parking lot data:", error);
        setError("Error fetching parking lot data.");
      }
    };

    const fetchCapacities = async () => {
      try {
        const response = await axios.get(
          `/api/parking/capacities/${parkingLotId}`
        );
        if (Array.isArray(response.data)) {
          setExistingCapacities(response.data);
        } else {
          setExistingCapacities([]);
        }
      } catch (error) {
        console.error("Error fetching existing capacities:", error);
        setError("Error fetching existing capacities.");
      }
    };

    fetchParkingLot();
    fetchCapacities();
  }, [parkingLotId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCapacity({
      ...capacity,
      [name]: value,
    });
  };

  const handleDateChange = (dates) => {
    setCapacity({
      ...capacity,
      valid_from: dates[0],
      valid_to: dates[1],
    });
  };

  const checkForOverlaps = () => {
    const currentFrom = dayjs(capacity.valid_from);
    const currentTo = dayjs(capacity.valid_to);

    if (!Array.isArray(existingCapacities)) {
      console.error("existingCapacities is not an array:", existingCapacities);
      setError("Internal error: existing capacities data is not valid.");
      return [];
    }

    const overlappingCapacities = existingCapacities.filter(
      (cap) =>
        currentFrom.isBetween(
          dayjs(cap.valid_from),
          dayjs(cap.valid_to),
          null,
          "[]"
        ) ||
        currentTo.isBetween(
          dayjs(cap.valid_from),
          dayjs(cap.valid_to),
          null,
          "[]"
        ) ||
        (currentFrom.isBefore(dayjs(cap.valid_from)) &&
          currentTo.isAfter(dayjs(cap.valid_to)))
    );

    return overlappingCapacities;
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(capacity) !== JSON.stringify(originalCapacity);
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

    const overlappingCapacities = checkForOverlaps();

    if (overlappingCapacities.length > 0) {
      const errorMessage = `The selected time range overlaps with the following capacities: ${overlappingCapacities
        .map(
          (cap) =>
            `${dayjs(cap.valid_from).format("DD/MM/YYYY")} - ${dayjs(
              cap.valid_to
            ).format("DD/MM/YYYY")}`
        )
        .join(
          ", "
        )}. Please choose a different time range or edit the conflicting capacities first.`;
      setError(errorMessage);
      return;
    }

    const addDays = (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    const updatedValidFrom = capacity.valid_from
      ? addDays(capacity.valid_from, 1).toISOString()
      : null;
    const updatedValidTo = capacity.valid_to
      ? addDays(capacity.valid_to, 1).toISOString()
      : null;

    try {
      await axios.post(
        `/api/parking/capacities/${parkingLotId}`,
        {
          ...capacity,
          valid_from: updatedValidFrom,
          valid_to: updatedValidTo,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      navigate(`/parking_space/${parkingLotId}`);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setPermissionError({
          open: true,
          message: "You do not have permission to perform this action.",
        });
      } else {
        console.error("Error adding capacity:", error);
        const errorMessage =
          error.response?.data?.error || "Error adding capacity.";
        setError(errorMessage);
      }
    }
  };

  const breadcrumbLinks = [
    { label: "Parking Spaces", path: "/parking_spaces" },
    { label: parkingLot.name, path: `/parking_space/${parkingLotId}` },
    {
      label: `Add Capacity`,
      path: `/parking_space/${parkingLotId}/add_capacity`,
    },
  ];

  return (
    <Box className="form-width">
      <CustomBreadcrumbs
        links={breadcrumbLinks}
        onClick={(link) => handleNavigate(link.path)}
      />
      <Paper className="form-container">
        <Box className="iconHeadline__container">
          <AddBoxIcon />
          <Typography variant="h4" gutterBottom>
            {TITLE}
          </Typography>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        <Box mb={2} display="flex" gap="10px" alignItems="center">
          <Typography variant="h6" className="parking-lot-box">
            {parkingLot.name}
          </Typography>
          <Typography fontStyle="italic">
            ({parkingLot.external ? "External" : "Internal"})
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <DateRangeRoundedIcon className="input-container__icon" />
              <DateRangePicker
                dateRange={[capacity.valid_from, capacity.valid_to]}
                setDateRange={handleDateChange}
                width100={true}
              />
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container ">
              <LocalParkingRoundedIcon className="input-container__icon" />
              <InputLabel className="input-label-background input-container__label-utilization">
                Utilization Type
              </InputLabel>
              <Select
                name="utilization_type"
                value={capacity.utilization_type}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="parking">Parking</MenuItem>
                <MenuItem value="event">Event</MenuItem>
                <MenuItem value="construction">Construction</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <DirectionsCarFilledIcon className="input-container__icon" />
              <TextField
                label="Total Capacity (Car Units)"
                name="capacity"
                type="number"
                value={capacity.capacity}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  inputProps: { step: 1, min: 0 },
                }}
              />
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <AirportShuttleRoundedIcon className="input-container__icon" />
              <TextField
                label="Bus Limit (= 3x Car Units)"
                name="bus_limit"
                type="number"
                value={capacity.bus_limit}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  inputProps: { step: 1, min: 0 },
                }}
              />
            </Box>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Box className="input-container">
              <LocalShippingRoundedIcon className="input-container__icon" />
              <TextField
                label="Truck Limit  (= 4x Car Units)"
                name="truck_limit"
                type="number"
                value={capacity.truck_limit}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  inputProps: { step: 1, min: 0 },
                }}
              />
            </Box>
          </FormControl>
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Button
              className="back-button"
              variant="outlined"
              color="primary"
              startIcon={<ArrowBackIcon />}
              onClick={() => handleNavigate(`/parking_space/${parkingLotId}`)}
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

export default AddParkingSpaceCapacity;
