import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import PropTypes from 'prop-types';

const DateInputComponent = ({ selectedDate, setSelectedDate }) => {
  DateInputComponent.propTypes = {
    selectedDate: PropTypes.string.isRequired,
    setSelectedDate: PropTypes.func.isRequired,
  };
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'de'}>
      <Grid>
        <DatePicker
          label="Choose a Date"
          value={dayjs(selectedDate)}
          onChange={(newValue) =>
            setSelectedDate(newValue.format('YYYY-MM-DD'))
          }
          slots={{
            textField: (params) => <TextField {...params} />,
          }}
        />
      </Grid>
    </LocalizationProvider>
  );
};

export default DateInputComponent;
