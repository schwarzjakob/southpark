import React, { useEffect, useState } from "react";
import { DataGrid, GridToolbarExport } from "@mui/x-data-grid";
import { Box, Typography } from "@mui/material";

const columns = [
  { field: "event", headerName: "Event", flex: 1 },
  { field: "date", headerName: "Date", flex: 1 },
  { field: "demand", headerName: "Demand", flex: 1 },
  { field: "parking_lot", headerName: "Parking lot", flex: 1 },
  { field: "allocated_capacity", headerName: "Allocated Capacity", flex: 1 },
  { field: "distance", headerName: "Distance", flex: 1 },
];

const EventsAllocationTable = () => {
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/events_parking_lots_allocation")
      .then((response) => response.json())
      .then((data) => setTableData(data))
      .catch((error) => console.error("There was an error!", error));
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h3" component="h2" gutterBottom>
        Allocated Parking Lots For Each Event Date
      </Typography>
      <Box sx={{ width: '100%' }}>
        <DataGrid
          rows={tableData}
          columns={columns}
          getRowId={(row) => row.event_id}
          components={{
            Toolbar: GridToolbarExport,
          }}
          disableSelectionOnClick
          autoHeight
        />
      </Box>
    </Box>
  );
};

export default EventsAllocationTable;