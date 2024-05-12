import { DataGrid } from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";

const columns = [
    { field: 'event_id', headerName: 'Event ID', flex: 1 },
    { field: 'event', headerName: 'Event name', flex: 1 },
    { field: 'date', headerName: 'Date', flex: 1 },
    { field: 'demand', headerName: 'Demand', flex: 1 },
    { field: 'parking_lot', headerName: 'Allocated parking lot', flex: 1 },
    { field: 'capacity', headerName: 'Capacity', flex: 1 },
    { field: 'distance', headerName: 'Distance', flex: 1 },
];

const EventsAllocationTable = () => {
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        fetch('http://127.0.0.1:5000/events_parking_lots_allocation')
            .then(response => response.json())
            .then(data => setTableData(data))
            .catch(error => console.error('There was an error!', error));
    }, []);

    return (
        <div >
            <DataGrid
                rows={tableData}
                columns={columns}
                getRowId={(row) => row.event_id}  // Using event_id as the unique ID for each row
            />
        </div>
    );
};

export default EventsAllocationTable;
