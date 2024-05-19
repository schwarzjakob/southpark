import React, { useState, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/de'; // Import the Chinese locale (YYYY-MM-DD)
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import axios from 'axios';

const DateInputComponent = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs(new Date()));

  useEffect(() => {
    setSelectedDate(dayjs('2025-02-22'));
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'de'}>
      <Grid>
        <DatePicker
          label="Choose a Date"
          value={selectedDate}
          onChange={(newValue) => setSelectedDate(newValue)}
          slots={{
            textField: (params) => <TextField {...params} />,
          }}
        />
      </Grid>
    </LocalizationProvider>
  );
};

export default DateInputComponent;
