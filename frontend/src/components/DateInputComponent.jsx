import React, { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import axios from 'axios';

const DateInputComponent = () => {
  // const [selectedDate, setSelectedDate] = useState(null);
  // selectedDate = new Date();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker />
    </LocalizationProvider>
  );
};

export default DateInputComponent;
