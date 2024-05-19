import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

const Dashboard = () => {
  const [tableData, setTableData] = useState([]);

  return (
    <div>
      <Typography variant="h3" component="h2" gutterBottom>
        Dashboard
      </Typography>
    </div>
  );
};

export default Dashboard;
