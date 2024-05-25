import { useState } from "react";
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
} from "@mui/material";
import { usePapaParse } from "react-papaparse";
import axios from "axios";

const ImportCSV = () => {
  const { readString } = usePapaParse();
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      readString(target.result, {
        header: true,
        complete: (results) => {
          setCsvData(results.data);
          setCsvHeaders(Object.keys(results.data[0]));
        },
      });
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (event) => {
    const { name, value } = event.target;
    setMapping((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleImport = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/import_events", {
        csv_data: csvData,
        mapping,
      });
      setFeedback({
        open: true,
        message: response.data.message,
        severity: "success",
      });
    } catch (error) {
      setFeedback({
        open: true,
        message: error.response.data.error,
        severity: "error",
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom>
        Import Events from CSV
      </Typography>
      <Button variant="contained" component="label">
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
              <Grid item xs={6}>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel>Event Name</InputLabel>
                  <Select
                    name="name"
                    value={mapping.name || ""}
                    onChange={handleMappingChange}
                    label="Event Name"
                  >
                    {csvHeaders.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel>Assembly Start Date</InputLabel>
                  <Select
                    name="assembly_start_date"
                    value={mapping.assembly_start_date || ""}
                    onChange={handleMappingChange}
                    label="Assembly Start Date"
                  >
                    {csvHeaders.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel>Assembly End Date</InputLabel>
                  <Select
                    name="assembly_end_date"
                    value={mapping.assembly_end_date || ""}
                    onChange={handleMappingChange}
                    label="Assembly End Date"
                  >
                    {csvHeaders.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel>Runtime Start Date</InputLabel>
                  <Select
                    name="runtime_start_date"
                    value={mapping.runtime_start_date || ""}
                    onChange={handleMappingChange}
                    label="Runtime Start Date"
                  >
                    {csvHeaders.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel>Runtime End Date</InputLabel>
                  <Select
                    name="runtime_end_date"
                    value={mapping.runtime_end_date || ""}
                    onChange={handleMappingChange}
                    label="Runtime End Date"
                  >
                    {csvHeaders.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel>Disassembly Start Date</InputLabel>
                  <Select
                    name="disassembly_start_date"
                    value={mapping.disassembly_start_date || ""}
                    onChange={handleMappingChange}
                    label="Disassembly Start Date"
                  >
                    {csvHeaders.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel>Disassembly End Date</InputLabel>
                  <Select
                    name="disassembly_end_date"
                    value={mapping.disassembly_end_date || ""}
                    onChange={handleMappingChange}
                    label="Disassembly End Date"
                  >
                    {csvHeaders.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel>Entrance</InputLabel>
                  <Select
                    name="entrance"
                    value={mapping.entrance || ""}
                    onChange={handleMappingChange}
                    label="Entrance"
                  >
                    {csvHeaders.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" color="primary" onClick={handleImport}>
              Import Events
            </Button>
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
