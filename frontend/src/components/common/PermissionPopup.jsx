import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Snackbar, Alert } from "@mui/material";
import { styled } from "@mui/system";

const CustomSnackbar = styled(Snackbar)(({ theme }) => ({
  position: "fixed",
  top: "64px",
  right: "16px",
  width: "300px",
  transition: "transform 0.5s ease-out",
  [theme.breakpoints.up("sm")]: {
    width: "auto",
  },
}));

const ProgressBar = styled("div")({
  height: "4px",
  backgroundColor: "#fb6c79",
  position: "absolute",
  bottom: 0,
  left: 0,
  width: "100%",
  borderBottomLeftRadius: "0px",
  borderBottomRightRadius: "0px",
  animation: "slide 5s linear forwards",
  "@keyframes slide": {
    from: { width: "100%" },
    to: { width: "0%" },
  },
});

const PermissionPopup = ({ open, onClose, message }) => {
  const [showPopup, setShowPopup] = useState(open);

  useEffect(() => {
    if (open) {
      setShowPopup(true);
      const timer = setTimeout(() => {
        setShowPopup(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  useEffect(() => {
    if (!showPopup) {
      const snackbarElement = document.querySelector(".popup_no-permission");
      if (snackbarElement) {
        snackbarElement.style.transform = "translateX(100%)";
        setTimeout(onClose, 500);
      }
    }
  }, [showPopup, onClose]);

  return (
    <CustomSnackbar
      open={showPopup}
      onClose={() => setShowPopup(false)}
      className="popup_no-permission"
    >
      <Alert
        onClose={() => setShowPopup(false)}
        severity="error"
        sx={{
          width: "100%",
          padding: "1rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {message}
        <ProgressBar />
      </Alert>
    </CustomSnackbar>
  );
};

PermissionPopup.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
};

export default PermissionPopup;
