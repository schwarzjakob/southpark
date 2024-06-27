import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Grid,
  Button,
  IconButton,
  Dialog,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";

const AddAllocationPopup = ({ open, onClose, phase }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <Box p={3} className="add-allocation-popup">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            <AccountTreeRoundedIcon /> Add Allocation
          </Typography>
          <IconButton onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <Typography variant="h6" gutterBottom>
          Phase: {phase}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body1">
              <strong>Max./Day Demand</strong>
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1">
              <strong>Allocated</strong>
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1">Cars: </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1">Allocated Cars</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1">Buses: </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1">Allocated Buses</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1">Trucks: </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body1">Allocated Trucks</Typography>
          </Grid>
        </Grid>
        <Box display="flex" justifyContent="flex-end" mt={3}>
          <Button
            onClick={onClose}
            color="secondary"
            style={{ marginRight: "10px" }}
          >
            Cancel
          </Button>
          <Button variant="contained" color="primary">
            Save
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

AddAllocationPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  phase: PropTypes.string.isRequired,
};

export default AddAllocationPopup;
