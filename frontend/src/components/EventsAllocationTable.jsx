import { useEffect, useState } from "react";
import { DataGrid, GridToolbarExport } from "@mui/x-data-grid";
import { Box, Typography } from "@mui/material";

const columns = [
  { field: "event", headerName: "Event", flex: 1 },
  { field: "date", headerName: "Date", flex: 1 },
  { field: "status", headerName: "Phase", flex: 1 },
  { field: "halls", headerName: "Halls", flex: 1 },
  { field: "demand", headerName: "Demand", flex: 1 },
  { field: "parking_lot", headerName: "Parking Lot", flex: 1 },
  { field: "allocated_capacity", headerName: "Allocated Capacity", flex: 1 },
  { field: "distance", headerName: "Distance", flex: 1 },
];

const EventsAllocationTable = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events_parking_lots_allocation")
      .then((response) => response.json())
      .then((data) => {
        console.log("Backend data 2:", data);
        setTableData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("There was an error!", error);
        setLoading(false);
      });
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h3" component="h2" gutterBottom>
        Allocated Parking Lots For Each Event Date
      </Typography>
      <Box sx={{ width: "100%" }}>
        <DataGrid
          rows={tableData}
          columns={columns}
          getRowId={(row) => row.id}
          components={{
            Toolbar: GridToolbarExport,
          }}
          disableSelectionOnClick
          autoHeight
          loading={loading}
        />
      </Box>
    </Box>
  );
};

export default EventsAllocationTable;
