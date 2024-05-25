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
      navigate("/input_demands"); // Redirect to demand input form
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
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleImport}
              fullWidth
            >
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
