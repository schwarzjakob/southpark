import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Typography,
  Grid,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
} from "@mui/material";
import { usePapaParse } from "react-papaparse";
import axios from "axios";

const defaultMapping = {
  name: "Event Name",
  halls: "Halls",
  assembly_start_date: "Assembly Start Date",
  assembly_end_date: "Assembly End Date",
  runtime_start_date: "Runtime Start Date",
  runtime_end_date: "Runtime End Date",
  disassembly_start_date: "Disassembly Start Date",
  disassembly_end_date: "Disassembly End Date",
  entrance: "Entrance",
};

const ImportCSV = () => {
  const navigate = useNavigate();
  const { readString } = usePapaParse();
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [mapping, setMapping] = useState(defaultMapping);
  const [loading, setLoading] = useState(false); // Loading state
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [events, setEvents] = useState([]); // State to store and display imported events

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      readString(target.result, {
        header: true,
        complete: (results) => {
          setCsvData(results.data);
          setCsvHeaders(Object.keys(results.data[0]));
          const autoMapping = Object.keys(defaultMapping).reduce((acc, key) => {
            const header = Object.keys(results.data[0]).find((h) =>
              h.toLowerCase().includes(defaultMapping[key].toLowerCase())
            );
            acc[key] = header || "";
            return acc;
          }, {});
          setMapping(autoMapping);
        },
      });
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (event) => {
    const { name, value } = event.target;
    setMapping((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleProcessData = () => {
    const processedEvents = csvData.map((row) => {
      const event = {};
      Object.keys(mapping).forEach((key) => {
        event[key] = row[mapping[key]];
      });
      return event;
    });
    setEvents(processedEvents);
    console.log("Processed Events:", processedEvents); // Log processed events for debugging
  };

  const handleImport = async () => {
    setLoading(true); // Set loading to true
    try {
      console.log("Submitting Events:", events); // Log events being submitted for debugging
      const response = await axios.post("http://127.0.0.1:5000/import_events", {
        csv_data: events,
        mapping,
      });
      setFeedback({
        open: true,
        message: response.data.message,
        severity: "success",
      });
      navigate("/input_demands"); // Redirect to demand input form
    } catch (error) {
      setFeedback({
        open: true,
        message: error.response?.data?.error || "Failed to import events.",
        severity: "error",
      });
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  const handleEventChange = (index, field, value) => {
    const updatedEvents = [...events];
    updatedEvents[index][field] = value;
    setEvents(updatedEvents);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom>
        Import Events from CSV
      </Typography>
      <Button variant="contained" component="label" fullWidth>
        Upload CSV
        <input type="file" hidden onChange={handleFileUpload} />
      </Button>
      {csvData.length > 0 && (
        <>
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" gutterBottom>
              Map CSV Columns to Event Fields
            </Typography>
            <Grid container spacing={2}>
              {Object.keys(defaultMapping).map((field) => (
                <Grid item xs={6} key={field}>
                  <FormControl fullWidth required variant="outlined">
                    <InputLabel>{defaultMapping[field]}</InputLabel>
                    <Select
                      name={field}
                      value={mapping[field] || ""}
                      onChange={handleMappingChange}
                      label={defaultMapping[field]}
                    >
                      {csvHeaders.map((header) => (
                        <MenuItem key={header} value={header}>
                          {header}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ))}
            </Grid>
          </Box>
          <Box sx={{ mt: 3, position: "relative" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleProcessData}
              fullWidth
            >
              Process Data
            </Button>
          </Box>
        </>
      )}
      {events.length > 0 && (
        <>
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" gutterBottom>
              Adjust Imported Events
            </Typography>
            {events.map((event, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="h6">
                  Event {index + 1}: {event.name}
                </Typography>
                <Grid container spacing={2}>
                  {Object.keys(defaultMapping).map((field) => (
                    <Grid item xs={6} key={field}>
                      <TextField
                        label={defaultMapping[field]}
                        value={event[field] || ""}
                        onChange={(e) =>
                          handleEventChange(index, field, e.target.value)
                        }
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
            <Box sx={{ mt: 3, position: "relative" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleImport}
                fullWidth
                disabled={loading} // Disable button when loading
              >
                Save Events
              </Button>
              {loading && (
                <CircularProgress
                  size={24}
                  sx={{
                    color: "primary.main",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginTop: "-12px",
                    marginLeft: "-12px",
                  }}
                />
              )}
            </Box>
          </Box>
        </>
      )}
      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback({ ...feedback, open: false })}
      >
        <Alert
          onClose={() => setFeedback({ ...feedback, open: false })}
          severity={feedback.severity}
          sx={{ width: "100%" }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ImportCSV;
