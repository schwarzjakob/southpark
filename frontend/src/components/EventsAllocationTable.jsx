import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Button from "@mui/material/Button"; // Going to be used for export function later
import { GridToolbarExport } from "@mui/x-data-grid";

const columns = [
  // { field: "event_id", headerName: "Event ID", flex: 1 }, // Uncomment this line to show the event_id
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
    <div>
      <h2>Allocated Parking Lots For Each Event Date</h2>
      <DataGrid
        rows={tableData}
        columns={columns}
        getRowId={(row) => row.event_id}
        components={{
          Toolbar: GridToolbarExport,
        }}
        checkboxSelection
        disableSelectionOnClick
      />
    </div>
  );
};

export default EventsAllocationTable;
