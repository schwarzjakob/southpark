import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const ExceedsCapacity = () => {
  const [rows, setRows] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get("/api/capacity_utilization");
      const dataWithId = response.data.exceeds_capacity.map((row, index) => ({
        ...row,
        id: index, // Add a unique id to each row
      }));
      setRows(dataWithId);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const columns = [
    { field: "date", headerName: "Date", flex: 1 },
    { field: "total_demand", headerName: "Total Demand", flex: 1 },
    { field: "total_capacity", headerName: "Total Capacity", flex: 1 },
  ];

  return (
    <div>
      <h2>Days with capacity utilization exceeding 100%</h2>
      <DataGrid rows={rows} columns={columns} />
      <Button
        className="button-primary"
        variant="contained"
        color="primary"
        onClick={() => navigate("/")}
      >
        Back to Dashboard
      </Button>
    </div>
  );
};

export default ExceedsCapacity;
